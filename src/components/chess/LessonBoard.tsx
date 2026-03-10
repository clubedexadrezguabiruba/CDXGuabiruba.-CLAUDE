"use client";

import { useRef, useEffect, useCallback, useImperativeHandle } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";
import type { Config } from "chessground/config";
import type { DrawShape } from "chessground/draw";
import { toDests } from "@/lib/chess/puzzleLogic";

export interface LessonBoardHandle {
  animateMove: (from: string, to: string) => void;
  setConfig: (config: Partial<Config>) => void;
}

export interface LessonBoardProps {
  fen: string;
  orientation?: "white" | "black";
  interactive?: boolean;
  highlights?: string[];
  arrows?: [string, string][];
  onMove?: (uci: string) => void;
  lastMove?: [string, string];
  dimKings?: boolean;
  ref?: React.Ref<LessonBoardHandle>;
}

/** Parse turn color from FEN without chess.js (tolerates invalid positions) */
function turnFromFen(fen: string): "white" | "black" {
  const parts = fen.split(" ");
  return parts[1] === "b" ? "black" : "white";
}

export default function LessonBoard({
  fen,
  orientation = "white",
  interactive = false,
  highlights,
  arrows,
  onMove,
  lastMove,
  dimKings = false,
  ref,
}: LessonBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // Keep a ref to the current FEN so handleMove can detect promotions
  const fenRef = useRef(fen);
  fenRef.current = fen;

  const handleMove = useCallback((orig: Key, dest: Key) => {
    if (!onMoveRef.current) return;

    let uci = orig + dest;

    // Detect pawn promotion: pawn reaching rank 8 (white) or rank 1 (black)
    // Auto-promote to queen (standard for lessons)
    const destRank = dest[1];
    if (destRank === "8" || destRank === "1") {
      try {
        const chess = new Chess(fenRef.current);
        const piece = chess.get(orig as never);
        if (piece && piece.type === "p") {
          uci += "q";
        }
      } catch {
        // Invalid FEN — skip promotion detection
      }
    }

    onMoveRef.current(uci);
  }, []);

  // Build auto-shapes from highlights + arrows
  const buildShapes = useCallback((): DrawShape[] => {
    const shapes: DrawShape[] = [];
    if (highlights) {
      for (const sq of highlights) {
        shapes.push({ orig: sq as Key, brush: "blue" });
      }
    }
    if (arrows) {
      for (const [from, to] of arrows) {
        shapes.push({ orig: from as Key, dest: to as Key, brush: "green" });
      }
    }
    return shapes;
  }, [highlights, arrows]);

  // Expose imperative handle for parent (LessonViewer)
  useImperativeHandle(ref, () => ({
    animateMove(from: string, to: string) {
      cgRef.current?.move(from as Key, to as Key);
    },
    setConfig(config: Partial<Config>) {
      cgRef.current?.set(config);
    },
  }));

  // Effect 1: Create/recreate Chessground on mount and orientation change
  useEffect(() => {
    if (!boardRef.current) return;

    const turnColor = turnFromFen(fen);

    let dests: Map<Key, Key[]> = new Map();
    let isCheck = false;
    if (interactive) {
      try {
        const chess = new Chess(fen);
        dests = toDests(chess);
        isCheck = chess.isCheck();
      } catch {
        // FEN invalid for chess.js — allow display but disable interaction
      }
    }

    const config: Config = {
      fen,
      orientation,
      turnColor,
      lastMove: lastMove as [Key, Key] | undefined,
      movable: {
        free: false,
        color: interactive ? turnColor : undefined,
        dests,
        showDests: true,
        events: { after: handleMove },
      },
      premovable: { enabled: false },
      draggable: { enabled: interactive, showGhost: true },
      selectable: { enabled: interactive },
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: true, autoShapes: buildShapes() },
      coordinates: true,
      check: isCheck ? turnColor : undefined,
    };

    if (cgRef.current) {
      cgRef.current.destroy();
    }

    cgRef.current = Chessground(boardRef.current, config);

    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
    // Only recreate on orientation change (mount/unmount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  // Effect 2: Update FEN, interactivity, shapes via cg.set() (no destroy)
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;

    const turnColor = turnFromFen(fen);

    let dests: Map<Key, Key[]> = new Map();
    let isCheck = false;
    if (interactive) {
      try {
        const chess = new Chess(fen);
        dests = toDests(chess);
        isCheck = chess.isCheck();
      } catch {
        // FEN invalid for chess.js
      }
    }

    cg.set({
      fen,
      turnColor,
      lastMove: lastMove as [Key, Key] | undefined,
      movable: {
        free: false,
        color: interactive ? turnColor : undefined,
        dests,
        showDests: true,
      },
      draggable: { enabled: interactive, showGhost: true },
      selectable: { enabled: interactive },
      check: isCheck ? turnColor : undefined,
      drawable: { autoShapes: buildShapes() },
    });
  }, [fen, interactive, lastMove, buildShapes]);

  return (
    <div
      className={`puzzle-board-wrap ${dimKings ? "lesson-dim-kings" : ""}`}
      ref={boardRef}
    />
  );
}
