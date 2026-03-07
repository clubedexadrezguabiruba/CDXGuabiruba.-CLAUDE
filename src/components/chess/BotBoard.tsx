"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";
import type { Config } from "chessground/config";
import type { DrawShape } from "chessground/draw";
import { toDests } from "@/lib/chess/puzzleLogic";
import { soundManager } from "@/lib/sounds/soundManager";
import type { PlayerColor } from "@/types/bot";

interface BotBoardProps {
  chess: Chess;
  orientation: PlayerColor;
  interactive: boolean;
  onMove: (uci: string) => void;
  lastMove?: [string, string];
  soundEnabled?: boolean;
  autoShapes?: DrawShape[];
}

const PROMOTION_PIECES = ["q", "r", "b", "n"] as const;
const PIECE_SYMBOLS: Record<string, string> = {
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
};

export default function BotBoard({
  chess,
  orientation,
  interactive,
  onMove,
  lastMove,
  soundEnabled = true,
  autoShapes,
}: BotBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Stable refs
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const chessRef = useRef(chess);
  chessRef.current = chess;

  const playSound = useCallback(
    (name: Parameters<typeof soundManager.play>[0]) => {
      if (soundEnabledRef.current) soundManager.play(name);
    },
    []
  );

  // Detect if a move is a pawn promotion
  const isPromotion = useCallback(
    (from: string, to: string): boolean => {
      const piece = chessRef.current.get(from as Parameters<typeof chessRef.current.get>[0]);
      if (!piece || piece.type !== "p") return false;
      const rank = to[1];
      return (piece.color === "w" && rank === "8") || (piece.color === "b" && rank === "1");
    },
    []
  );

  const handleUserMove = useCallback(
    (orig: Key, dest: Key) => {
      if (!interactiveRef.current) return;

      if (isPromotion(orig, dest)) {
        // Block the board, show promotion modal
        setPromotionPending({ from: orig, to: dest });
        return;
      }

      // Non-promotion move — apply directly
      const moveResult = chessRef.current.move({ from: orig, to: dest });
      if (!moveResult) return;

      if (chessRef.current.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      onMoveRef.current(orig + dest);
    },
    [isPromotion, playSound]
  );

  const handlePromotion = useCallback(
    (piece: string) => {
      if (!promotionPending) return;
      const { from, to } = promotionPending;
      setPromotionPending(null);

      const moveResult = chessRef.current.move({
        from,
        to,
        promotion: piece,
      });
      if (!moveResult) return;

      if (chessRef.current.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      onMoveRef.current(from + to + piece);
    },
    [promotionPending, playSound]
  );

  // Ref for chessground event handler
  const handleUserMoveRef = useRef(handleUserMove);
  handleUserMoveRef.current = handleUserMove;

  // Initialize chessground
  useEffect(() => {
    if (!boardRef.current) return;

    const config: Config = {
      fen: chess.fen(),
      orientation,
      turnColor: chess.turn() === "w" ? "white" : "black",
      movable: {
        free: false,
        color: interactive ? orientation : undefined,
        dests: interactive ? toDests(chess) : new Map(),
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
      drawable: {
        enabled: false,
        autoShapes: autoShapes ?? [],
        brushes: {
          green:      { key: "green",      color: "#15803d", opacity: 1,   lineWidth: 10 },
          red:        { key: "red",        color: "#ef4444", opacity: 1,   lineWidth: 10 },
          blue:       { key: "blue",       color: "#3b82f6", opacity: 1,   lineWidth: 10 },
          yellow:     { key: "yellow",     color: "#eab308", opacity: 1,   lineWidth: 10 },
          brilliant:  { key: "brilliant",  color: "#06b6d4", opacity: 1,   lineWidth: 10 },
          great:      { key: "great",      color: "#3b82f6", opacity: 1,   lineWidth: 10 },
          best:       { key: "best",       color: "#22c55e", opacity: 1,   lineWidth: 10 },
          good:       { key: "good",       color: "#84cc16", opacity: 0.8, lineWidth: 10 },
          inaccuracy: { key: "inaccuracy", color: "#eab308", opacity: 1,   lineWidth: 10 },
          mistake:    { key: "mistake",    color: "#f97316", opacity: 1,   lineWidth: 10 },
          blunder:    { key: "blunder",    color: "#ef4444", opacity: 1,   lineWidth: 10 },
          bestMove:   { key: "bestMove",   color: "#22c55e", opacity: 0.6, lineWidth: 12 },
        },
      },
      coordinates: true,
      lastMove: lastMove as [Key, Key] | undefined,
    };

    if (cgRef.current) cgRef.current.destroy();
    cgRef.current = Chessground(boardRef.current, config);

    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  // Update board state when chess/interactive/lastMove changes
  const fen = chess.fen();
  useEffect(() => {
    const cg = cgRef.current;
    const c = chessRef.current;
    if (!cg || !c) return;

    const turnColor = c.turn() === "w" ? "white" : "black";
    const isPlayerTurn = turnColor === orientation && interactive;

    cg.set({
      fen,
      turnColor,
      lastMove: lastMove as [Key, Key] | undefined,
      movable: {
        free: false,
        color: isPlayerTurn && !promotionPending ? orientation : undefined,
        dests: isPlayerTurn && !promotionPending ? toDests(c) : new Map(),
        showDests: true,
      },
      check: c.isCheck() ? turnColor : undefined,
      drawable: { autoShapes: autoShapes ?? [] },
    });
  }, [fen, interactive, lastMove, orientation, promotionPending, autoShapes]);

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="bot-board-wrap" ref={boardRef} />

      {/* Promotion Modal */}
      {promotionPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="flex gap-2 rounded-lg bg-white p-4 shadow-xl">
            {PROMOTION_PIECES.map((piece) => (
              <button
                key={piece}
                onClick={() => handlePromotion(piece)}
                className="flex h-14 w-14 items-center justify-center rounded-lg text-3xl hover:bg-zinc-100 active:bg-zinc-200"
              >
                {PIECE_SYMBOLS[piece]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
