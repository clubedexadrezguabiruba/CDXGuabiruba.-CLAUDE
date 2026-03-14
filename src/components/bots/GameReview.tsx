"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useArrowKeys } from "@/hooks/useArrowKeys";
import { Chess } from "chess.js";
import BotBoard from "@/components/chess/BotBoard";
import type { Bot, PlayerColor, GameResult } from "@/types/bot";
import BotAvatar from "./BotAvatar";


import type { GameAnalysis, MoveCategory, MoveAnalysis } from "@/lib/chess/botAnalysis";
import { getLastMoveSquares, formatEval, evalBarPercent } from "@/lib/chess/analysisHelpers";
import type { DrawShape } from "chessground/draw";
import type { Key } from "chessground/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_INFO: Record<MoveCategory, { symbol: string; label: string; color: string; bg: string }> = {
  brilliant:  { symbol: "!!", label: "Brilhante",  color: "#06b6d4", bg: "bg-cyan-100" },
  great:      { symbol: "\u2605", label: "Ótimo",  color: "#22c55e", bg: "bg-green-100" },
  best:       { symbol: "\u2605", label: "Ótimo",  color: "#22c55e", bg: "bg-green-100" },
  good:       { symbol: "",   label: "Bom",        color: "#84cc16", bg: "" },
  inaccuracy: { symbol: "?!", label: "Imprecisão", color: "#eab308", bg: "bg-yellow-100" },
  mistake:    { symbol: "?",  label: "Erro",       color: "#f97316", bg: "bg-orange-100" },
  blunder:    { symbol: "??", label: "Erro Grave",  color: "#ef4444", bg: "bg-red-100" },
};

const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EvalBar({ cp, orientation }: { cp: number; orientation: PlayerColor }) {
  const whitePct = evalBarPercent(cp);
  const topPct = orientation === "white" ? (100 - whitePct) : whitePct;

  return (
    <div className="relative w-7 shrink-0 overflow-hidden rounded-sm bg-zinc-800">
      <div
        className="absolute bottom-0 left-0 w-full bg-zinc-100 transition-all duration-300"
        style={{ height: `${100 - topPct}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-zinc-400 mix-blend-difference [writing-mode:vertical-lr] rotate-180">
          {formatEval(cp)}
        </span>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: MoveCategory }) {
  const info = CATEGORY_INFO[category];
  if (!info.symbol) return null;
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${info.bg}`}
      style={{ color: info.color }}
      title={info.label}
    >
      {info.symbol}
    </span>
  );
}

function MoveInfoPanel({
  entry,
  moveAnalysis,
  isPlayerMove,
}: {
  entry: { san: string; before: string; after: string } | null;
  moveAnalysis: MoveAnalysis | null;
  isPlayerMove: boolean;
}) {
  if (!entry) {
    return (
      <div className="flex items-center justify-center px-4 py-5 text-sm text-zinc-400">
        {"Posi\u00E7\u00E3o inicial"}
      </div>
    );
  }

  if (!isPlayerMove || !moveAnalysis) {
    return (
      <div className="px-4 py-3">
        <div className="text-xs text-zinc-400">Lance do bot</div>
        <div className="mt-0.5 text-base font-bold text-zinc-700">{entry.san}</div>
      </div>
    );
  }

  const info = CATEGORY_INFO[moveAnalysis.category];
  const showBest = !["best", "great", "brilliant"].includes(moveAnalysis.category);

  return (
    <div className="space-y-1.5 px-4 py-3">
      {/* Category + move */}
      <div className="flex items-center gap-2">
        <CategoryBadge category={moveAnalysis.category} />
        <span className="text-base font-bold" style={{ color: info.color }}>
          {entry.san}
        </span>
        <span className="text-xs font-medium" style={{ color: info.color }}>
          {info.label}
        </span>
      </div>

      {/* Eval badge */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono font-semibold text-zinc-600">
          {formatEval(moveAnalysis.evalAfter)}
        </span>
        {moveAnalysis.winProbLoss > 0.001 && (
          <span className="text-xs text-red-500">
            &minus;{(moveAnalysis.winProbLoss * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Best move suggestion */}
      {showBest && moveAnalysis.bestMoveSan && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400">Melhor:</span>
          <span className="rounded bg-green-50 px-1.5 py-0.5 font-semibold text-green-700">
            {moveAnalysis.bestMoveSan}
          </span>
        </div>
      )}

      {/* Move accuracy */}
      <div className="text-xs text-zinc-400">
        {"Precis\u00E3o"}: {moveAnalysis.moveAccuracy.toFixed(0)}%
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface GameReviewProps {
  bot: Bot;
  playerColor: PlayerColor;
  result: GameResult;
  fullHistory: { san: string; before: string; after: string }[];
  analysis: GameAnalysis;
  onRematch: () => void;
  onBack: () => void;
}

export default function GameReview({
  bot,
  playerColor,
  result,
  fullHistory,
  analysis,
  onRematch,
  onBack,
}: GameReviewProps) {
  const [currentHalfMove, setCurrentHalfMove] = useState(-1);
  const moveListRef = useRef<HTMLDivElement>(null);
  const noop = useCallback(() => {}, []);

  // Build analysis lookup: halfMoveIndex -> MoveAnalysis
  const analysisMap = useMemo(() => {
    const map = new Map<number, MoveAnalysis>();
    for (const m of analysis.moves) {
      map.set(m.halfMoveIndex, m);
    }
    return map;
  }, [analysis]);

  // Determine if a half-move index is the player's move
  const isPlayerHalfMove = useCallback(
    (idx: number) => {
      const isWhite = idx % 2 === 0;
      return (playerColor === "white" && isWhite) || (playerColor === "black" && !isWhite);
    },
    [playerColor]
  );

  // Current position
  const currentEntry = currentHalfMove >= 0 ? fullHistory[currentHalfMove] : null;
  const displayFen = currentEntry ? currentEntry.after : STARTPOS;
  const lastMoveSquares = currentEntry
    ? getLastMoveSquares(currentEntry.before, currentEntry.san)
    : undefined;

  // Chess instance for the board
  const displayChess = useMemo(() => new Chess(displayFen), [displayFen]);

  // Current move analysis (if player's move)
  const currentAnalysis =
    currentHalfMove >= 0 ? analysisMap.get(currentHalfMove) ?? null : null;
  const currentIsPlayer = currentHalfMove >= 0 && isPlayerHalfMove(currentHalfMove);

  // Eval for bar (from white's perspective for consistent display)
  const currentEvalWhite = useMemo(() => {
    if (currentAnalysis) {
      return playerColor === "white" ? currentAnalysis.evalAfter : -currentAnalysis.evalAfter;
    }
    for (let i = currentHalfMove; i >= 0; i--) {
      const ma = analysisMap.get(i);
      if (ma) {
        return playerColor === "white" ? ma.evalAfter : -ma.evalAfter;
      }
    }
    return 0;
  }, [currentHalfMove, currentAnalysis, analysisMap, playerColor]);

  // Board shapes: category circle on destination + best move arrow
  const autoShapes = useMemo((): DrawShape[] => {
    if (currentHalfMove < 0 || !currentIsPlayer || !currentAnalysis) return [];

    const shapes: DrawShape[] = [];
    const entry = fullHistory[currentHalfMove];

    // Circle on the destination square with category color
    const squares = getLastMoveSquares(entry.before, entry.san);
    if (squares) {
      shapes.push({ orig: squares[1] as Key, brush: currentAnalysis.category });
    }

    // Green arrow showing best move (only when player made a sub-optimal move)
    const showBestArrow = !["best", "great", "brilliant"].includes(currentAnalysis.category);
    if (showBestArrow && currentAnalysis.bestMoveUci && currentAnalysis.bestMoveUci.length >= 4) {
      const from = currentAnalysis.bestMoveUci.slice(0, 2) as Key;
      const to = currentAnalysis.bestMoveUci.slice(2, 4) as Key;
      shapes.push({ orig: from, dest: to, brush: "bestMove" });
    }

    return shapes;
  }, [currentHalfMove, currentIsPlayer, currentAnalysis, fullHistory]);

  // Navigation
  const goFirst = useCallback(() => setCurrentHalfMove(-1), []);
  const goPrev = useCallback(() => setCurrentHalfMove((m) => Math.max(-1, m - 1)), []);
  const goNext = useCallback(
    () => setCurrentHalfMove((m) => Math.min(fullHistory.length - 1, m + 1)),
    [fullHistory.length]
  );
  const goLast = useCallback(
    () => setCurrentHalfMove(fullHistory.length - 1),
    [fullHistory.length]
  );

  // Keyboard navigation
  useArrowKeys({ onPrev: goPrev, onNext: goNext, onFirst: goFirst, onLast: goLast });

  // Auto-scroll move list to current move
  useEffect(() => {
    if (!moveListRef.current) return;
    const activeEl = moveListRef.current.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentHalfMove]);

  // Build move pairs for the list
  const movePairs = useMemo(() => {
    const pairs: { moveNum: number; white?: { idx: number; san: string }; black?: { idx: number; san: string } }[] = [];
    for (let i = 0; i < fullHistory.length; i++) {
      const moveNum = Math.floor(i / 2) + 1;
      if (i % 2 === 0) {
        pairs.push({ moveNum, white: { idx: i, san: fullHistory[i].san } });
      } else {
        if (pairs.length > 0) {
          pairs[pairs.length - 1].black = { idx: i, san: fullHistory[i].san };
        }
      }
    }
    return pairs;
  }, [fullHistory]);

  const resultLabel =
    result === "win" ? "Vit\u00F3ria" : result === "loss" ? "Derrota" : "Empate";
  const resultBadge =
    result === "win"
      ? "bg-green-100 text-green-700"
      : result === "loss"
        ? "bg-red-100 text-red-700"
        : "bg-zinc-100 text-zinc-700";

  // Top = opponent, Bottom = player (relative to board orientation)
  const botIcon = <BotAvatar bot={bot} size="xs" />;
  const playerIcon = (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
      <span className="text-[10px] font-bold text-white">Vc</span>
    </div>
  );
  const topPlayer = playerColor === "white"
    ? { name: bot.name, icon: botIcon, isBot: true }
    : { name: "Voc\u00EA", icon: playerIcon, isBot: false };
  const bottomPlayer = playerColor === "white"
    ? { name: "Voc\u00EA", icon: playerIcon, isBot: false }
    : { name: bot.name, icon: botIcon, isBot: true };

  return (
    <div className="mx-auto max-w-[960px] px-3 py-4">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-zinc-800">
          {"Revisão de Batalha"}
        </h2>
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${resultBadge}`}>
          {resultLabel}
        </span>
        <span className="text-xs text-zinc-400">{analysis.accuracy}% {"precis\u00E3o"}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-5">
        {/* ====== LEFT: Eval bar + Board + Nav ====== */}
        <div className="flex items-stretch gap-1.5">
          {/* Eval bar — matches board height via self-stretch */}
          <div className="hidden sm:flex">
            <EvalBar cp={currentEvalWhite} orientation={playerColor} />
          </div>

          {/* Board wrapper */}
          <div className="flex flex-col">
            {/* Top player label */}
            <div className="mb-1 flex items-center gap-2">
              {topPlayer.icon}
              <span className="text-sm font-semibold text-zinc-700">{topPlayer.name}</span>
            </div>

            {/* Board — fixed size via wrapper */}
            <div className="w-[min(84vw,480px)] lg:w-[480px]">
              <BotBoard
                chess={displayChess}
                orientation={playerColor}
                interactive={false}
                onMove={noop}
                lastMove={lastMoveSquares}
                soundEnabled={false}
                autoShapes={autoShapes}
              />
            </div>

            {/* Bottom player label */}
            <div className="mt-1 flex items-center gap-2">
              {bottomPlayer.icon}
              <span className="text-sm font-semibold text-zinc-700">{bottomPlayer.name}</span>
            </div>

            {/* Navigation controls */}
            <div className="mt-2 flex items-center justify-center gap-0.5">
              <button
                onClick={goFirst}
                disabled={currentHalfMove === -1}
                className="rounded-lg px-3.5 py-2 text-base text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                title="Primeiro lance"
              >
                {"\u23EE"}
              </button>
              <button
                onClick={goPrev}
                disabled={currentHalfMove === -1}
                className="rounded-lg px-3.5 py-2 text-base text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                title="Lance anterior (\u2190)"
              >
                {"\u25C0"}
              </button>
              <button
                onClick={goNext}
                disabled={currentHalfMove >= fullHistory.length - 1}
                className="rounded-lg px-3.5 py-2 text-base text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                title="Pr\u00F3ximo lance (\u2192)"
              >
                {"\u25B6"}
              </button>
              <button
                onClick={goLast}
                disabled={currentHalfMove >= fullHistory.length - 1}
                className="rounded-lg px-3.5 py-2 text-base text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                title={"\u00DAltimo lance"}
              >
                {"\u23ED"}
              </button>
            </div>
          </div>
        </div>

        {/* ====== RIGHT: Sidebar ====== */}
        <div className="mt-4 flex min-w-0 flex-1 flex-col gap-3 lg:mt-0 lg:max-w-[340px]">
          {/* Move info panel */}
          <div className="rounded-xl border bg-white shadow-sm">
            <MoveInfoPanel
              entry={currentEntry}
              moveAnalysis={currentAnalysis}
              isPlayerMove={currentIsPlayer}
            />
          </div>

          {/* Annotated move list */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Lances
            </div>
            <div
              ref={moveListRef}
              className="max-h-[260px] overflow-y-auto px-2 py-1 lg:max-h-[360px]"
            >
              {movePairs.map((pair) => (
                <div key={pair.moveNum} className="flex items-center text-sm leading-7">
                  {/* Move number */}
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-zinc-400 pr-1.5">
                    {pair.moveNum}.
                  </span>

                  {/* White's move */}
                  {pair.white && (
                    <button
                      data-active={currentHalfMove === pair.white.idx}
                      onClick={() => setCurrentHalfMove(pair.white!.idx)}
                      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-left font-medium transition-colors ${
                        currentHalfMove === pair.white.idx
                          ? "bg-blue-100 text-blue-800"
                          : "text-zinc-800 hover:bg-zinc-50"
                      }`}
                      style={{ minWidth: "3.5rem" }}
                    >
                      {isPlayerHalfMove(pair.white.idx) && analysisMap.has(pair.white.idx) && (
                        <CategoryBadge category={analysisMap.get(pair.white.idx)!.category} />
                      )}
                      <span>{pair.white.san}</span>
                    </button>
                  )}

                  {/* Black's move */}
                  {pair.black && (
                    <button
                      data-active={currentHalfMove === pair.black.idx}
                      onClick={() => setCurrentHalfMove(pair.black!.idx)}
                      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-left font-medium transition-colors ${
                        currentHalfMove === pair.black.idx
                          ? "bg-blue-100 text-blue-800"
                          : "text-zinc-800 hover:bg-zinc-50"
                      }`}
                      style={{ minWidth: "3.5rem" }}
                    >
                      {isPlayerHalfMove(pair.black.idx) && analysisMap.has(pair.black.idx) && (
                        <CategoryBadge category={analysisMap.get(pair.black.idx)!.category} />
                      )}
                      <span>{pair.black.san}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onRematch}
              className="flex-1 rounded-xl border-2 border-zinc-300 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Revanche
            </button>
            <button
              onClick={onBack}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-500 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Voltar aos Duelos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
