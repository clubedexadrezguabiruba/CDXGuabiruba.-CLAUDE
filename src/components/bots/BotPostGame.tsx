"use client";

import type { Bot, GameResult } from "@/types/bot";
import BotAvatar from "./BotAvatar";


import type { GameAnalysis, MoveAnalysis } from "@/lib/chess/botAnalysis";

/** SVG circular gauge */
function AccuracyGauge({ accuracy }: { accuracy: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  const color =
    accuracy >= 75
      ? "#22c55e"
      : accuracy >= 50
        ? "#eab308"
        : accuracy >= 25
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {accuracy}%
        </span>
        <span className="text-xs text-zinc-500">Precis&atilde;o</span>
      </div>
    </div>
  );
}

const CATEGORY_CONFIG = [
  { key: "brilliant" as const, label: "Brilhante", color: "#06b6d4", bg: "bg-cyan-500" },
  { key: "great" as const, label: "Excelente", color: "#3b82f6", bg: "bg-blue-500" },
  { key: "best" as const, label: "Melhor", color: "#22c55e", bg: "bg-green-500" },
  { key: "good" as const, label: "Bom", color: "#84cc16", bg: "bg-lime-500" },
  { key: "inaccuracy" as const, label: "Imprecis\u00E3o", color: "#eab308", bg: "bg-yellow-500" },
  { key: "mistake" as const, label: "Erro", color: "#f97316", bg: "bg-orange-500" },
  { key: "blunder" as const, label: "Erro Grave", color: "#ef4444", bg: "bg-red-500" },
];

function CategoryBars({ analysis }: { analysis: GameAnalysis }) {
  const totalMoves = Object.values(analysis.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full space-y-2">
      {CATEGORY_CONFIG.map(({ key, label, color, bg }) => {
        const count = analysis.counts[key];
        const pct = totalMoves > 0 ? (count / totalMoves) * 100 : 0;

        return (
          <div key={key} className="flex items-center gap-3">
            <div className="w-20 text-right text-sm font-medium" style={{ color }}>
              {label}
            </div>
            <div className="flex-1">
              <div className="h-5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full ${bg}`}
                  style={{
                    width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                    transition: "width 0.8s ease-out",
                  }}
                />
              </div>
            </div>
            <div className="w-6 text-right text-sm font-bold text-zinc-700">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MistakeCard({ move }: { move: MoveAnalysis }) {
  const isBlunder = move.category === "blunder";
  const borderColor = isBlunder ? "border-red-300" : "border-orange-300";
  const iconBg = isBlunder ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600";
  const icon = isBlunder ? "??" : "?";

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${borderColor} bg-white p-3`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-800">
            Lance {move.moveNumber}
          </span>
          <span className="text-xs text-zinc-400">
            &minus;{(move.winProbLoss * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
            {move.moveSan}
          </span>
          <span className="text-zinc-400">&rarr;</span>
          <span className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
            {move.bestMoveSan}
          </span>
        </div>
      </div>
    </div>
  );
}

interface BotPostGameProps {
  bot: Bot;
  result: GameResult;
  analysis: GameAnalysis | null;
  analyzing: boolean;
  analysisProgress?: { current: number; total: number };
  onRematch: () => void;
  onBack: () => void;
  onViewReview?: () => void;
}

export default function BotPostGame({
  bot,
  result,
  analysis,
  analyzing,
  analysisProgress,
  onRematch,
  onBack,
  onViewReview,
}: BotPostGameProps) {
  const resultLabel =
    result === "win" ? "Vit\u00F3ria" : result === "loss" ? "Derrota" : "Empate";
  const resultBadge =
    result === "win"
      ? "bg-green-100 text-green-700"
      : result === "loss"
        ? "bg-red-100 text-red-700"
        : "bg-zinc-100 text-zinc-700";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:max-w-3xl">
      {/* Players header */}
      <div className="mb-4 flex items-center justify-center gap-6">
        {/* Player */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
            Vc
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-800">{"Voc\u00EA"}</p>
          {analysis && (
            <p className="text-xs text-zinc-400">{analysis.accuracy}%</p>
          )}
        </div>

        <div className="text-xs font-bold text-zinc-300">VS</div>

        {/* Bot */}
        <div className="text-center">
          <div className="mx-auto">
            <BotAvatar bot={bot} size="sm" />
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-800">{bot.name}</p>
          <p className="text-xs text-zinc-400">ELO {bot.elo}</p>
        </div>
      </div>

      {/* Result badge */}
      <div className="mb-6 text-center">
        <span className={`inline-block rounded-full px-4 py-1 text-sm font-bold ${resultBadge}`}>
          {resultLabel}
        </span>
      </div>

      {/* Loading analysis */}
      {analyzing && (
        <div className="mb-6 w-full rounded-xl border bg-zinc-50 p-5 text-center">
          <div className="mb-3 text-sm font-medium text-zinc-600">
            Analisando sua partida...
          </div>
          {analysisProgress && analysisProgress.total > 0 && (
            <>
              <div className="mb-1 text-xs text-zinc-400">
                Lance {analysisProgress.current} de {analysisProgress.total}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Analysis results — 2 columns on desktop */}
      {analysis && (
        <>
          <div className="lg:flex lg:gap-6">
            {/* Left: Accuracy gauge */}
            <div className="flex flex-1 justify-center">
              <AccuracyGauge accuracy={analysis.accuracy} />
            </div>

            {/* Right: Category bars */}
            <div className="mt-4 flex-1 lg:mt-0">
              <div className="rounded-xl border bg-white p-4">
                <CategoryBars analysis={analysis} />
              </div>
            </div>
          </div>

          {/* Best move of the game */}
          {analysis.bestPlayerMove && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Melhor Lance da Partida
              </h3>
              <div className="flex items-start gap-3 rounded-lg border border-green-300 bg-white p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                  {analysis.bestPlayerMove.category === "brilliant" ? "!!" : analysis.bestPlayerMove.category === "great" ? "!" : "\u2605"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-zinc-800">
                      Lance {analysis.bestPlayerMove.moveNumber}
                    </span>
                    <span className="text-xs text-green-600">
                      {analysis.bestPlayerMove.moveAccuracy.toFixed(0)}% {"precis\u00E3o"}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                      {analysis.bestPlayerMove.moveSan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mistakes */}
          {analysis.topBlunders.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Lances para Revisar
              </h3>
              <div className="space-y-2">
                {analysis.topBlunders.map((m, i) => (
                  <MistakeCard key={i} move={m} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-2">
        {onViewReview && (
          <button
            onClick={onViewReview}
            className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition-colors duration-150 hover:bg-green-500 active:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {"Revis\u00E3o de Batalha"}
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={onRematch}
            className="flex-1 rounded-xl border-2 border-zinc-300 py-3 font-bold text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Revanche
          </button>
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border-2 border-zinc-300 py-3 font-bold text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Voltar aos Duelos
          </button>
        </div>
      </div>
    </div>
  );
}
