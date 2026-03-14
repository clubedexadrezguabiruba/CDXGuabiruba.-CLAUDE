"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import type { Key } from "chessground/types";
import type { DrawShape } from "chessground/draw";
import {
  type QueuedMove,
  createQueue,
  enqueue,
  dequeue,
  validateMove,
} from "@/lib/chess/futureMoveQueue";
import { toDests } from "@/lib/chess/puzzleLogic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePremoveQueueOptions {
  maxSize: number;           // 10 bots, 1 puzzles
  chess: Chess;
  playerColor: "white" | "black";
  enabled: boolean;          // premove_enabled setting
  onExecute: (move: QueuedMove) => void;
  onInvalidated?: () => void;
}

export interface UsePremoveQueueReturn {
  queue: QueuedMove[];
  enqueueMove: (from: string, to: string) => boolean;
  clearQueue: () => void;
  /** Caller controls when to execute (e.g. after bot moves, via rAF).
   *  Idempotent: calling twice in same state won't double-execute —
   *  isExecutingRef guards re-entrancy, and dequeue removes the item. */
  tryExecuteFirst: () => void;
  shapes: DrawShape[];
  isExecutingRef: React.RefObject<boolean>;
  /** Legal destinations from the turn-swapped projected position.
   *  Used by BotBoard as movable.dests during opponent's turn. */
  speculativeDests: Map<Key, Key[]>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFutureMoveQueue({
  maxSize,
  chess,
  playerColor,
  enabled,
  onExecute,
  onInvalidated,
}: UsePremoveQueueOptions): UsePremoveQueueReturn {
  // --- Queue state: ref is source of truth, state snapshot drives UI ---
  const queueRef = useRef<QueuedMove[]>(createQueue());
  const isExecutingRef = useRef(false);
  const [queueSnapshot, setQueueSnapshot] = useState<QueuedMove[]>([]);

  // Stable refs for callbacks
  const onExecuteRef = useRef(onExecute);
  useEffect(() => { onExecuteRef.current = onExecute; });
  const chessRef = useRef(chess);
  useEffect(() => { chessRef.current = chess; });
  const onInvalidatedRef = useRef(onInvalidated);
  useEffect(() => { onInvalidatedRef.current = onInvalidated; });
  const playerColorRef = useRef(playerColor);
  useEffect(() => { playerColorRef.current = playerColor; });

  // --- Sync ref → state snapshot ---
  const syncSnapshot = useCallback(() => {
    setQueueSnapshot([...queueRef.current]);
  }, []);

  // --- Clear queue ---
  const clearQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;
    if (process.env.NODE_ENV === "development") {
      console.log("[PREMOVE:clearQueue]", { was: queueRef.current.length, ts: performance.now().toFixed(1) });
    }
    queueRef.current = createQueue();
    syncSnapshot();
  }, [syncSnapshot]);

  // --- Try execute first item ---
  const tryExecuteFirst = useCallback(() => {
    if (isExecutingRef.current) return;
    if (queueRef.current.length === 0) return;

    const first = queueRef.current[0];
    if (process.env.NODE_ENV === "development") {
      console.log("[PREMOVE:tryExecuteFirst]", {
        move: first.from + first.to + (first.promotion ?? ""),
        queueLen: queueRef.current.length,
        fen: chessRef.current.fen().split(" ").slice(0, 2).join(" "),
        ts: performance.now().toFixed(1),
      });
    }
    if (!validateMove(first, chessRef.current)) {
      // First illegal → cancel entire queue
      queueRef.current = createQueue();
      syncSnapshot();
      onInvalidatedRef.current?.();
      return;
    }

    // Execute
    isExecutingRef.current = true;
    const result = dequeue(queueRef.current);
    if (result) {
      queueRef.current = result.remaining;
      syncSnapshot();
      onExecuteRef.current(result.move);
    }
    isExecutingRef.current = false;
  }, [syncSnapshot]);

  // --- Enqueue move (never auto-executes — caller decides when) ---
  const enqueueMove = useCallback(
    (from: string, to: string): boolean => {
      if (!enabled) return false;
      if (queueRef.current.length >= maxSize) return false;

      const chess = chessRef.current;
      const currentTurn = chess.turn() === "w" ? "white" : "black";
      const isPlayerTurn = currentTurn === playerColorRef.current;

      if (isPlayerTurn) {
        // Player's turn — full validation via projection
        const newQueue = enqueue(
          queueRef.current,
          { from, to },
          chess,
          maxSize
        );
        if (!newQueue) return false;
        queueRef.current = newQueue;
      } else {
        // Opponent's turn — chess.js rejects moves because it enforces turn order.
        // We project with turn-swapping: after each queued move, flip turn back
        // to the player so the next premove can be validated. This is speculative —
        // we skip the opponent's unknown responses. tryExecuteFirst re-validates
        // at execution time with the real position.
        const pColor = playerColorRef.current === "white" ? "w" : "b";

        // Start with player's turn
        // Turn-swap: flip turn to player but preserve en passant and castling rights
        const startFen = chess.fen().split(" ");
        startFen[1] = pColor;
        let projected: Chess;
        try { projected = new Chess(startFen.join(" ")); } catch { return false; }

        // Replay existing queue, swapping turn after each move
        for (const item of queueRef.current) {
          try {
            const r = projected.move({ from: item.from, to: item.to, promotion: item.promotion });
            if (!r) return false;
          } catch { return false; }
          // Swap turn back to player for the next premove (preserve en passant + castling)
          const pFen = projected.fen().split(" ");
          pFen[1] = pColor;
          try { projected = new Chess(pFen.join(" ")); } catch { return false; }
        }

        // Detect auto-queen promotion
        const piece = projected.get(from as Parameters<typeof projected.get>[0]);
        let promotion: "q" | "r" | "b" | "n" | undefined;
        if (piece?.type === "p") {
          const rank = to[1];
          if ((piece.color === "w" && rank === "8") || (piece.color === "b" && rank === "1")) {
            promotion = "q";
          }
        }

        // Validate new move in projected position
        try {
          const r = projected.move({ from, to, promotion });
          if (!r) return false;
        } catch { return false; }

        const item: QueuedMove = {
          from, to, promotion,
          createdAt: Date.now(),
          expectedFen: "", // speculative — opponent's moves unknown
        };
        queueRef.current = [...queueRef.current, item];
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[PREMOVE:enqueue]", {
          move: from + to,
          queueLen: queueRef.current.length,
          isPlayerTurn: chessRef.current.turn() === (playerColorRef.current === "white" ? "w" : "b"),
          ts: performance.now().toFixed(1),
        });
      }
      syncSnapshot();
      return true;
    },
    [enabled, maxSize, syncSnapshot]
  );

  // --- Speculative dests: legal moves from projected position (turn-swapped) ---
  // Use chess.fen() as reactivity trigger — the Chess object is mutated in place,
  // so the object reference never changes; fen string does.
  const currentFen = chess.fen();
  const speculativeDests: Map<Key, Key[]> = useMemo(() => {
    if (!enabled) return new Map();
    const pColor = playerColor === "white" ? "w" : "b";
    const startFen = currentFen.split(" ");
    startFen[1] = pColor;
    let projected: Chess;
    try { projected = new Chess(startFen.join(" ")); } catch { return new Map(); }

    for (const item of queueRef.current) {
      try {
        const r = projected.move({ from: item.from, to: item.to, promotion: item.promotion });
        if (!r) return new Map();
      } catch { return new Map(); }
      const pFen = projected.fen().split(" ");
      pFen[1] = pColor;
      try { projected = new Chess(pFen.join(" ")); } catch { return new Map(); }
    }
    return toDests(projected);
    // queueSnapshot triggers recompute when queue changes (body reads queueRef.current for projection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playerColor, currentFen, queueSnapshot]);

  // --- Shapes: blue highlights on from/to squares (no arrows) ---
  const shapes: DrawShape[] = useMemo(
    () =>
      queueSnapshot.flatMap((item) => [
        { orig: item.from as Key, brush: "blue" },
        { orig: item.to as Key, brush: "blue" },
      ]),
    [queueSnapshot]
  );

  return {
    queue: queueSnapshot,
    enqueueMove,
    clearQueue,
    tryExecuteFirst,
    shapes,
    isExecutingRef,
    speculativeDests,
  };
}
