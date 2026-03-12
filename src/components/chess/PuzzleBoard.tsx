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
import { useFutureMoveQueue } from "@/hooks/useFutureMoveQueue";

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
  showHint?: boolean;
  autoShowSolution?: boolean;
  onSolutionEnd?: () => void;
  premovable?: boolean;
}

type PuzzlePhase = "loading" | "playing" | "correct" | "failed";

// Dummy chess instance for hook init before real chess is created
const DUMMY_CHESS = new Chess();

export default function PuzzleBoard({
  fen,
  solutionMoves,
  onComplete,
  disabled = false,
  soundEnabled = true,
  showHint = false,
  autoShowSolution = false,
  onSolutionEnd,
  premovable = false,
}: PuzzleBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const chessRef = useRef<Chess | null>(null);
  const movesRef = useRef<string[]>([]);
  const moveIndexRef = useRef(0);
  const movesPlayedRef = useRef<string[]>([]);
  const startTimeRef = useRef(0);
  const completedRef = useRef(false);
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [phase, setPhase] = useState<PuzzlePhase>("loading");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  // Refs to avoid stale closures in chessground event handlers and timeouts.
  const playerColorRef = useRef<"white" | "black">("white");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const showHintRef = useRef(showHint);
  showHintRef.current = showHint;
  const autoShowSolutionRef = useRef(autoShowSolution);
  autoShowSolutionRef.current = autoShowSolution;
  const onSolutionEndRef = useRef(onSolutionEnd);
  onSolutionEndRef.current = onSolutionEnd;
  const solutionRunIdRef = useRef(0);
  const premovableRef = useRef(premovable);
  premovableRef.current = premovable;

  const playSound = useCallback(
    (name: Parameters<typeof soundManager.play>[0]) => {
      if (soundEnabledRef.current) soundManager.play(name);
    },
    []
  );

  // Tracked setTimeout that gets cleaned up on unmount/re-init
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      activeTimeoutsRef.current = activeTimeoutsRef.current.filter(t => t !== id);
      fn();
    }, ms);
    activeTimeoutsRef.current.push(id);
    return id;
  }, []);

  // showHintHighlight highlights the origin square of the current expected move
  const showHintHighlight = useCallback(() => {
    const cg = cgRef.current;
    const moves = movesRef.current;
    const idx = moveIndexRef.current;
    if (!cg || !showHintRef.current || idx >= moves.length) return;
    const origin = moves[idx].slice(0, 2);
    cg.setAutoShapes([{ orig: origin as Key, brush: "blue" }]);
  }, []);

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
        color: premovableRef.current || (isPlayerTurn && !isDisabled) ? color : undefined,
        dests: isPlayerTurn && !isDisabled ? toDests(chess) : new Map(),
        showDests: true,
      },
      premovable: {
        enabled: premovableRef.current,
      },
      check: chess.isCheck() ? turnColor : undefined,
    });
  }, []);

  // completeResult uses refs only → stable callback
  const completeResult = useCallback(
    (solved: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const timeSpent = Date.now() - startTimeRef.current;
      setPhase(solved ? "correct" : "failed");

      const cg = cgRef.current;
      if (cg) {
        cg.set({
          movable: { free: false, color: undefined, dests: new Map() },
        });
      }

      try {
        onCompleteRef.current({
          solved,
          movesPlayed: movesPlayedRef.current,
          timeSpentMs: timeSpent,
        });
      } catch (e) {
        console.error("[PuzzleBoard] onComplete error:", e);
      }
    },
    []
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
          // Lock board immediately — prevents stale-dests race during delay
          cg.set({ movable: { color: undefined, dests: new Map() } });
        }

        if (chess.isCheck()) {
          playSound("check");
        } else if (moveResult.captured) {
          playSound("capture");
        } else {
          playSound("move");
        }

        moveIndexRef.current = idx + 1;

        if (moveIndexRef.current >= moves.length) {
          // Sync FEN so promoted pieces display correctly
          const cgSync = cgRef.current;
          if (cgSync && chess) cgSync.set({ fen: chess.fen() });
          completeResult(true);
          return;
        }

        // Play opponent's next move after delay
        safeTimeout(() => {
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

        safeTimeout(() => {
          completeResult(false);
        }, 600);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playSound, updateBoard, completeResult, safeTimeout] // playOpponentMove accessed via ref, not direct dep
  );

  // Ref for chessground event handler (always points to latest handleUserMove)
  const handleUserMoveRef = useRef(handleUserMove);
  handleUserMoveRef.current = handleUserMove;

  // --- Premove queue (maxSize=1 for puzzles — deliberate product decision,
  //     not a limitation. Puzzles have fixed solutions; multiple premoves
  //     would be "guessing" sequences. Single premove = speed without
  //     compromising learning.) ---
  const moveQueue = useFutureMoveQueue({
    maxSize: 1,
    chess: chessRef.current ?? DUMMY_CHESS,
    playerColor: playerColorRef.current,
    enabled: premovable,
    onExecute: (move) => handleUserMoveRef.current(move.from as Key, move.to as Key),
    onInvalidated: () => { if (soundEnabledRef.current) soundManager.play("wrong"); },
  });

  // Ref to access clearQueue from init effect
  const clearQueueRef = useRef(moveQueue.clearQueue);
  clearQueueRef.current = moveQueue.clearQueue;
  const tryExecuteFirstRef = useRef(moveQueue.tryExecuteFirst);
  tryExecuteFirstRef.current = moveQueue.tryExecuteFirst;

  // playOpponentMove depends on stable callbacks → stable
  const playOpponentMove = useCallback(
    (delayMs: number = 400) => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      const moves = movesRef.current;
      const idx = moveIndexRef.current;

      if (!chess || !cg || idx >= moves.length) return;

      safeTimeout(() => {
        const uci = moves[idx];
        const parsed = parseUci(uci);
        const moveResult = applyUciMove(chess, uci);

        if (moveResult) {
          cg.move(parsed.from as Key, parsed.to as Key);
          movesPlayedRef.current.push(uci);

          if (chess.isCheck()) {
            playSound("check");
          } else if (moveResult.captured) {
            playSound("capture");
          } else {
            playSound("move");
          }

          moveIndexRef.current = idx + 1;

          if (moveIndexRef.current >= moves.length) {
            // Sync FEN so promoted pieces display correctly
            const cgInner = cgRef.current;
            if (cgInner && chess) cgInner.set({ fen: chess.fen() });
            completeResult(true);
            return;
          }

          updateBoard();
          showHintHighlight();

          if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
            setPhase("playing");
          }

          // Try to execute queued premove after board is unlocked for player
          requestAnimationFrame(() => {
            tryExecuteFirstRef.current();
          });
        } else {
          // Puzzle data is invalid (FEN/moves mismatch) — skip to avoid freeze
          completeResult(false);
        }
      }, delayMs);
    },
    [playSound, updateBoard, completeResult, showHintHighlight, safeTimeout]
  );

  // Wire playOpponentMove into handleUserMove via ref (breaks circular dep)
  const playOpponentMoveRef = useRef(playOpponentMove);
  playOpponentMoveRef.current = playOpponentMove;

  // Auto-show solution after failure: replay remaining moves on the board
  useEffect(() => {
    if (!autoShowSolution || phase !== "failed") return;

    const chess = chessRef.current;
    const cg = cgRef.current;
    const moves = movesRef.current;
    const startIdx = moveIndexRef.current;
    if (!chess || !cg || startIdx >= moves.length) {
      // Nothing to replay
      onSolutionEndRef.current?.();
      return;
    }

    const runId = ++solutionRunIdRef.current;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Lock board and sync FEN (chess.undo() after wrong move desyncs cg from chess)
    cg.set({
      fen: chess.fen(),
      movable: { free: false, color: undefined, dests: new Map() },
      lastMove: undefined,
    });
    cg.setAutoShapes([]);

    // Wait 1s then replay each move with 800ms gap
    const startTimer = setTimeout(() => {
      if (solutionRunIdRef.current !== runId) return;

      let i = startIdx;
      const playNext = () => {
        if (solutionRunIdRef.current !== runId || i >= moves.length) {
          if (solutionRunIdRef.current === runId) {
            onSolutionEndRef.current?.();
          }
          return;
        }
        const uci = moves[i];
        const parsed = parseUci(uci);
        const moveResult = applyUciMove(chess, uci);
        if (moveResult) {
          cg.move(parsed.from as Key, parsed.to as Key);
          cg.set({ fen: chess.fen(), check: chess.isCheck() ? (chess.turn() === "w" ? "white" : "black") : undefined });
          if (soundEnabledRef.current) {
            if (chess.isCheck()) soundManager.play("check");
            else if (moveResult.captured) soundManager.play("capture");
            else soundManager.play("move");
          }
        }
        i++;
        if (i < moves.length) {
          const t = setTimeout(playNext, 800);
          timers.push(t);
        } else {
          // Done
          if (solutionRunIdRef.current === runId) {
            onSolutionEndRef.current?.();
          }
        }
      };
      playNext();
    }, 1000);
    timers.push(startTimer);

    return () => {
      // Invalidate current run so stale callbacks are ignored
      solutionRunIdRef.current = runId + 1;
      timers.forEach(clearTimeout);
    };
  }, [autoShowSolution, phase]);

  // Show hint when showHint prop changes to true (user clicks "Dica" button)
  useEffect(() => {
    if (!showHint || phase !== "playing") return;
    showHintHighlight();
  }, [showHint, phase, showHintHighlight]);

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
    completedRef.current = false;
    clearQueueRef.current(); // Clear premove queue on puzzle switch

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
        color: premovable ? color : undefined,
        dests: new Map(),
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => {
            handleUserMoveRef.current(orig, dest);
          },
        },
      },
      premovable: {
        enabled: premovable,
        showDests: true,
        castle: true,
        events: {
          set: (orig: Key, dest: Key) => {
            // Enqueue into our custom queue, then cancel chessground's ghost visual.
            // Our queue is the single source of truth.
            const accepted = moveQueue.enqueueMove(orig, dest);
            if (!accepted && soundEnabledRef.current) soundManager.play("wrong");
            // Always cancel chessground's internal premove state
            cgRef.current?.cancelPremove();
          },
          // NO-OP: same pattern as BotBoard. Cancellation only from our
          // explicit logic (queue invalidation, puzzle switch), never from
          // chessground's timing-sensitive unset event.
          unset: () => {},
        },
      },
      draggable: { enabled: true, showGhost: true },
      selectable: { enabled: true },
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: true },
      coordinates: true,
    };

    if (cgRef.current) {
      cgRef.current.destroy();
    }

    const cg = Chessground(boardRef.current, config);
    cgRef.current = cg;

    // Play opponent's first move after a delay
    safeTimeout(() => {
      playOpponentMove(600);
    }, 300);

    return () => {
      // Cancel ALL pending timeouts to prevent double-fire in React Strict Mode
      activeTimeoutsRef.current.forEach(clearTimeout);
      activeTimeoutsRef.current = [];
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
