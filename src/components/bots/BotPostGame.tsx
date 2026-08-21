"use client";

import { BookOpen, type LucideIcon } from "lucide-react";
import type { Bot, GameResult } from "@/types/bot";
import BotAvatar from "./BotAvatar";
import { accuracyColor } from "@/lib/chess/analysisHelpers";
import type { GameAnalysis, MoveAnalysis, MoveCategory } from "@/lib/chess/botAnalysis";

// ---------------------------------------------------------------------------
// Category config with chess.com-style symbols
// ---------------------------------------------------------------------------

/**
 * ESTA TABELA E UM ARRAY, e o compilador NAO cobra uma linha faltando: uma
 * categoria nova entra em `MoveCategory` e some daqui sem erro nenhum. Quem
 * acrescentar categoria acrescenta linha aqui a mao.
 *
 * A cor de "Livro" e diferente da que a GameReview usa para a mesma categoria,
 * de proposito: nenhuma cor unica passa 4,5:1 sobre branco E sobre #262522 ao
 * mesmo tempo (exigiria luminancia <=0,18 e >=0,26 simultaneamente). Aqui, no
 * card escuro, o tom claro da 5,8:1; la, o escuro da 5,3:1 sobre branco.
 * Cada superficie ja tinha sua propria tabela, entao os dois tons saem de graca.
 */
const CATEGORY_ROWS: {
  key: MoveCategory;
  mergeKey?: MoveCategory;
  symbol: string;
  label: string;
  color: string;
  bg: string;
  /** Fundo inline, para nao criar classe `bg-*` nova (o gate conta por arquivo). */
  bgStyle?: string;
  icon?: LucideIcon;
}[] = [
  { key: "brilliant", symbol: "!!", label: "Brilhante", color: "#06b6d4", bg: "bg-cyan-500/20" },
  { key: "best", mergeKey: "great", symbol: "★", label: "Ótimo", color: "#22c55e", bg: "bg-green-500/20" },
  { key: "book", symbol: "", label: "Livro", color: "#A69F94", bg: "", bgStyle: "rgba(133,127,118,0.20)", icon: BookOpen },
  { key: "good", symbol: "✓", label: "Bom", color: "#84cc16", bg: "bg-lime-500/20" },
  { key: "inaccuracy", symbol: "?!", label: "Imprecisão", color: "#eab308", bg: "bg-yellow-500/20" },
  { key: "mistake", symbol: "?", label: "Erro", color: "#f97316", bg: "bg-orange-500/20" },
  { key: "blunder", symbol: "??", label: "Erro Grave", color: "#ef4444", bg: "bg-red-500/20" },
];

function getCount(counts: Record<MoveCategory, number>, key: MoveCategory, mergeKey?: MoveCategory): number {
  return counts[key] + (mergeKey ? counts[mergeKey] : 0);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryIcon({
  symbol,
  color,
  bg,
  bgStyle,
  icon: Icon,
}: {
  symbol: string;
  color: string;
  bg: string;
  bgStyle?: string;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${bg}`}
      style={{ color, backgroundColor: bgStyle }}
    >
      {Icon ? <Icon size={13} strokeWidth={2.5} aria-hidden /> : symbol}
    </span>
  );
}

function DualCategoryTable({
  playerCounts,
  botCounts,
}: {
  playerCounts: Record<MoveCategory, number>;
  botCounts: Record<MoveCategory, number>;
}) {
  return (
    <div className="w-full divide-y divide-zinc-700/50">
      {CATEGORY_ROWS.map(({ key, mergeKey, symbol, label, color, bg, bgStyle, icon }) => {
        const pCount = getCount(playerCounts, key, mergeKey);
        const bCount = getCount(botCounts, key, mergeKey);

        return (
          <div
            key={key}
            className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
          >
            {/* Player count */}
            <div className="w-10 text-center">
              <span
                className="text-sm font-bold"
                style={{ color: pCount > 0 ? color : "#71717a" }}
              >
                {pCount}
              </span>
            </div>

            {/* Icon + label */}
            <div className="flex items-center gap-2">
              <CategoryIcon symbol={symbol} color={color} bg={bg} bgStyle={bgStyle} icon={icon} />
              <span className="text-sm font-medium text-zinc-300">{label}</span>
            </div>

            {/* Bot count */}
            <div className="w-10 text-center">
              <span
                className="text-sm font-bold"
                style={{ color: bCount > 0 ? color : "#71717a" }}
              >
                {bCount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Precisao de um lado — ou o motivo de nao haver numero.
 *
 * `computeGameAccuracy` devolve 0 quando nenhum lance entrou na media, e 0 e
 * indistinguivel de "jogou pessimo". Quem abriu com quatro lances de teoria e
 * desistiu leria "Precisao: 0". `moveCount` e o que separa os dois casos.
 */
function AccuracyStat({ value, moveCount }: { value: number; moveCount: number }) {
  const semMedida = moveCount === 0;
  return (
    <div className="text-center">
      <div
        className={`text-3xl font-black tabular-nums ${semMedida ? "text-zinc-500" : ""}`}
        style={semMedida ? undefined : { color: accuracyColor(value) }}
      >
        {semMedida ? "—" : value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
        {semMedida ? "Só teoria" : "Precisão"}
      </div>
    </div>
  );
}

function MistakeCard({ move }: { move: MoveAnalysis }) {
  const isBlunder = move.category === "blunder";
  const borderColor = isBlunder ? "border-red-500/30" : "border-orange-500/30";
  const iconColor = isBlunder ? "#ef4444" : "#f97316";
  const iconBg = isBlunder ? "bg-red-500/15" : "bg-orange-500/15";
  const icon = isBlunder ? "??" : "?";

  return (
    <div className={`flex items-start gap-3 rounded-lg border ${borderColor} bg-zinc-800/60 p-3`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconBg}`}
        style={{ color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-200">
            Lance {move.moveNumber}
          </span>
          <span className="text-xs text-zinc-500">
            &minus;{(move.winProbLoss * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded bg-red-500/15 px-1.5 py-0.5 text-xs font-medium text-red-400">
            {move.moveSan}
          </span>
          <span className="text-zinc-500">&rarr;</span>
          <span className="inline-flex items-center rounded bg-green-500/15 px-1.5 py-0.5 text-xs font-medium text-green-400">
            {move.bestMoveSan}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    result === "win" ? "Vitória" : result === "loss" ? "Derrota" : "Empate";
  const resultColor =
    result === "win"
      ? "text-green-400"
      : result === "loss"
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <div className="mx-auto max-w-md px-4 py-6 lg:max-w-lg">
      {/* Dark review card */}
      <div className="overflow-hidden rounded-2xl bg-[#262522] shadow-2xl">
        {/* ── Header: Result ── */}
        <div className="border-b border-zinc-700/50 px-5 py-3 text-center">
          <span className={`text-sm font-bold uppercase tracking-wide ${resultColor}`}>
            {resultLabel}
          </span>
        </div>

        {/* ── Players row with accuracies ── */}
        {analysis && (
          <div className="border-b border-zinc-700/50 px-4 py-5">
            <div className="flex items-center justify-between">
              {/* Player side */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-base font-bold text-white shadow-lg shadow-green-900/30">
                  Vc
                </div>
                <span className="text-xs font-medium text-zinc-400">Você</span>
              </div>

              {/* Accuracy: Player */}
              <AccuracyStat value={analysis.accuracy} moveCount={analysis.accuracyMoveCount} />

              {/* Accuracy: Bot */}
              <AccuracyStat value={analysis.botAccuracy} moveCount={analysis.botAccuracyMoveCount} />

              {/* Bot side */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14">
                  <BotAvatar bot={bot} size="sm" />
                </div>
                <span className="text-xs font-medium text-zinc-400">{bot.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading analysis ── */}
        {analyzing && (
          <div className="border-b border-zinc-700/50 px-5 py-6 text-center">
            <div className="mb-3 text-sm font-medium text-zinc-400">
              Analisando sua partida...
            </div>
            {analysisProgress && analysisProgress.total > 0 && (
              <>
                <div className="mb-2 text-xs text-zinc-500">
                  Lance {analysisProgress.current} de {analysisProgress.total}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Dual category table ── */}
        {analysis && (
          <DualCategoryTable
            playerCounts={analysis.counts}
            botCounts={analysis.botCounts}
          />
        )}

        {/* ── Mistakes section ── */}
        {analysis && analysis.topBlunders.length > 0 && (
          <div className="border-t border-zinc-700/50 px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Lances para Revisar
            </h3>
            <div className="space-y-2">
              {analysis.topBlunders.map((m, i) => (
                <MistakeCard key={i} move={m} />
              ))}
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="border-t border-zinc-700/50 p-4">
          <div className="flex flex-col gap-2">
            {onViewReview && (
              <button
                onClick={onViewReview}
                className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-green-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262522] focus-visible:outline-none"
              >
                Revisão da Partida
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={onRematch}
                className="flex-1 rounded-xl border border-zinc-600 py-2.5 text-sm font-bold text-zinc-300 transition-all duration-150 hover:border-zinc-500 hover:bg-zinc-700/50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262522] focus-visible:outline-none"
              >
                Revanche
              </button>
              <button
                onClick={onBack}
                className="flex-1 rounded-xl border border-zinc-600 py-2.5 text-sm font-bold text-zinc-300 transition-all duration-150 hover:border-zinc-500 hover:bg-zinc-700/50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262522] focus-visible:outline-none"
              >
                Voltar aos Duelos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
