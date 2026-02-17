"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";
import type { Config } from "chessground/config";
import {
  parsePuzzleMoves,
  getPlayerColor,
  toDests,
  parseUci,
  moveToUci,
  applyUciMove,
} from "@/lib/chess/puzzleLogic";
import { soundManager } from "@/lib/sounds/soundManager";

export interface PuzzleResult {
  solved: boolean;
  movesPlayed: string[];
  timeSpentMs: number;
}

interface PuzzleBoardProps {
  fen: string;
  solutionMoves: string;
  onComplete: (result: PuzzleResult) => void;
  disabled?: boolean;
  soundEnabled?: boolean;
}

type PuzzlePhase = "loading" | "playing" | "correct" | "failed";

export default function PuzzleBoard({
  fen,
  solutionMoves,
  onComplete,
  disabled = false,
  soundEnabled = true,
}: PuzzleBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const chessRef = useRef<Chess | null>(null);
  const movesRef = useRef<string[]>([]);
  const moveIndexRef = useRef(0);
  const movesPlayedRef = useRef<string[]>([]);
  const startTimeRef = useRef(0);
  const [phase, setPhase] = useState<PuzzlePhase>("loading");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  // Refs to avoid stale closures in chessground event handlers and timeouts.
  // These are updated on every render so callbacks always access latest values.
  const playerColorRef = useRef<"white" | "black">("white");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const playSound = useCallback(
    (name: Parameters<typeof soundManager.play>[0]) => {
      if (soundEnabledRef.current) soundManager.play(name);
    },
    []
  );

  // updateBoard uses refs only → stable callback, no stale closures
  const updateBoard = useCallback(() => {
    const cg = cgRef.current;
    const chess = chessRef.current;
    if (!cg || !chess) return;

    const color = playerColorRef.current;
    const isDisabled = disabledRef.current;
    const turnColor = chess.turn() === "w" ? "white" : "black";
    const isPlayerTurn = turnColor === color;

    cg.set({
      fen: chess.fen(),
      turnColor,
      movable: {
        free: false,
        color: isPlayerTurn && !isDisabled ? color : undefined,
        dests: isPlayerTurn && !isDisabled ? toDests(chess) : new Map(),
        showDests: true,
      },
      check: chess.isCheck() ? turnColor : undefined,
    });
  }, []);

  // completeResult uses refs only → stable callback
  const completeResult = useCallback(
    (solved: boolean) => {
      const timeSpent = Date.now() - startTimeRef.current;
      setPhase(solved ? "correct" : "failed");

      const cg = cgRef.current;
      if (cg) {
        cg.set({
          movable: { free: false, color: undefined, dests: new Map() },
        });
      }

      onCompleteRef.current({
        solved,
        movesPlayed: movesPlayedRef.current,
        timeSpentMs: timeSpent,
      });
    },
    []
  );

  // playOpponentMove depends on stable callbacks → stable
  const playOpponentMove = useCallback(
    (delayMs: number = 400) => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      const moves = movesRef.current;
      const idx = moveIndexRef.current;

      if (!chess || !cg || idx >= moves.length) return;

      setTimeout(() => {
        const uci = moves[idx];
        const parsed = parseUci(uci);
        const moveResult = applyUciMove(chess, uci);

        if (moveResult) {
          cg.move(parsed.from as Key, parsed.to as Key);
          movesPlayedRef.current.push(uci);

          if (moveResult.captured) {
            playSound("capture");
          } else {
            playSound("move");
          }
          if (chess.isCheck()) {
            playSound("check");
          }

          moveIndexRef.current = idx + 1;

          if (moveIndexRef.current >= moves.length) {
            completeResult(true);
            return;
          }

          updateBoard();

          if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
            setPhase("playing");
          }
        }
      }, delayMs);
    },
    [playSound, updateBoard, completeResult]
  );

  // handleUserMove depends on stable callbacks → stable
  const handleUserMove = useCallback(
    (orig: Key, dest: Key) => {
      const chess = chessRef.current;
      const moves = movesRef.current;
      const idx = moveIndexRef.current;

      if (!chess || idx >= moves.length) return;

      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
      }

      const expectedUci = moves[idx];
      const userUci = orig + dest;

      // Check if promotion is needed
      const parsed = parseUci(expectedUci);
      let fullUserUci = userUci;
      if (parsed.promotion) {
        fullUserUci = userUci + parsed.promotion;
      }

      const moveResult = applyUciMove(chess, fullUserUci);
      if (!moveResult) {
        updateBoard();
        return;
      }

      const actualUci = moveToUci(moveResult);
      movesPlayedRef.current.push(actualUci);

      if (
        actualUci === expectedUci ||
        userUci === expectedUci.slice(0, 4)
      ) {
        // Correct move
        const cg = cgRef.current;
        if (cg) {
          cg.setAutoShapes([{ orig: dest, brush: "green" }]);
        }

        if (moveResult.captured) {
          playSound("capture");
        } else {
          playSound("move");
        }
        if (chess.isCheck()) {
          playSound("check");
        }

        moveIndexRef.current = idx + 1;

        if (moveIndexRef.current >= moves.length) {
          playSound("correct");
          completeResult(true);
          return;
        }

        // Play opponent's next move after delay
        setTimeout(() => {
          const cg = cgRef.current;
          if (cg) cg.setAutoShapes([]);
          playOpponentMove(300);
        }, 300);
      } else {
        // Wrong move
        const cg = cgRef.current;
        if (cg) {
          cg.setAutoShapes([{ orig: dest, brush: "red" }]);
        }

        playSound("wrong");
        chess.undo();

        setTimeout(() => {
          completeResult(false);
        }, 600);
      }
    },
    [playSound, updateBoard, completeResult, playOpponentMove]
  );

  // Ref for chessground event handler (always points to latest handleUserMove)
  const handleUserMoveRef = useRef(handleUserMove);
  handleUserMoveRef.current = handleUserMove;

  // Initialize board
  useEffect(() => {
    if (!boardRef.current) return;

    const chess = new Chess(fen);
    chessRef.current = chess;

    const allMoves = parsePuzzleMoves(solutionMoves);
    movesRef.current = allMoves;
    moveIndexRef.current = 0;
    movesPlayedRef.current = [];
    startTimeRef.current = 0;

    // Set player color synchronously via ref (avoids stale closure)
    const color = getPlayerColor(fen);
    playerColorRef.current = color;
    setPlayerColor(color);
    setPhase("loading");

    const config: Config = {
      fen,
      orientation: color,
      turnColor: chess.turn() === "w" ? "white" : "black",
      movable: {
        free: false,
        color: undefined,
        dests: new Map(),
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => {
            handleUserMoveRef.current(orig, dest);
          },
        },
      },
      premovable: { enabled: false },
      draggable: { enabled: true, showGhost: true },
      selectable: { enabled: true },
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: false },
      coordinates: true,
    };

    if (cgRef.current) {
      cgRef.current.destroy();
    }

    const cg = Chessground(boardRef.current, config);
    cgRef.current = cg;

    // Play opponent's first move after a delay
    setTimeout(() => {
      playOpponentMove(600);
    }, 300);

    return () => {
      cg.destroy();
      cgRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, solutionMoves]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="puzzle-board-wrap" ref={boardRef} />
      {phase === "loading" && (
        <div className="text-sm text-zinc-500">Preparando...</div>
      )}
      {phase === "playing" && (
        <div className="text-sm font-medium">
          {playerColor === "white" ? "Brancas" : "Pretas"} jogam
        </div>
      )}
      {phase === "correct" && (
        <div className="text-sm font-bold text-green-600">Correto!</div>
      )}
      {phase === "failed" && (
        <div className="text-sm font-bold text-red-600">Incorreto</div>
      )}
    </div>
  );
}
