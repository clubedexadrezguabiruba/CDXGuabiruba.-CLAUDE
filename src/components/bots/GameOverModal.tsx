"use client";

import { useMemo } from "react";
import type { Bot, GameResult, GameOverReason } from "@/types/bot";
import { REASON_LABELS } from "@/types/bot";
import type { GameAnalysis } from "@/lib/chess/botAnalysis";
import { accuracyColor } from "@/lib/chess/analysisHelpers";
import { getRandomPhrase } from "@/lib/chess/botGameLogic";
import BotAvatar from "./BotAvatar";
import BotSpeechBubble from "./BotSpeechBubble";

interface GameOverModalProps {
  bot: Bot;
  result: GameResult;
  reason: GameOverReason;
  analysis: GameAnalysis | null;
  analyzing: boolean;
  nextBotId?: number | null;
  nextBotName?: string;
  onViewReview: () => void;
  onRematch: () => void;
  onNewBot: () => void;
  onNextBot?: () => void;
}

export default function GameOverModal({
  bot,
  result,
  reason,
  analysis,
  analyzing,
  nextBotId,
  nextBotName,
  onViewReview,
  onRematch,
  onNewBot,
  onNextBot,
}: GameOverModalProps) {
  const reasonLabel = REASON_LABELS[reason] || reason;

  const resultIcon = result === "win" ? "\uD83C\uDFC6" : result === "draw" ? "\uD83E\uDD1D" : null;
  const resultTitle =
    result === "win"
      ? `Vitória sobre ${bot.name}`
      : result === "loss"
        ? "Derrota"
        : "Empate";
  const resultColor =
    result === "win"
      ? "text-green-600"
      : result === "loss"
        ? "text-red-600"
        : "text-zinc-600";
  const iconBg =
    result === "win"
      ? "bg-green-100"
      : result === "loss"
        ? "bg-red-100"
        : "bg-zinc-100";

  const canReview = !analyzing && analysis !== null;

  // Bot reacts to game outcome
  const botPhrase = useMemo(() => {
    const phraseKey = result === "win" ? "on_loss" : result === "loss" ? "on_win" : "on_win";
    return getRandomPhrase(bot, phraseKey);
  }, [bot, result]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        style={{ animation: "modal-enter 0.25s ease-out" }}
      >
        {/* Result icon */}
        {resultIcon ? (
          <div
            className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${iconBg}`}
          >
            {resultIcon}
          </div>
        ) : (
          <div className="mx-auto mb-3">
            <BotAvatar bot={bot} size="md" />
          </div>
        )}

        {/* Title */}
        <h2 className={`text-2xl font-bold ${resultColor}`}>{resultTitle}</h2>
        <p className="mt-1 text-sm text-zinc-500">por {reasonLabel}</p>

        {/* Bot phrase */}
        {botPhrase && (
          <div className="mt-3">
            <BotSpeechBubble message={botPhrase} dismissMs={30000} />
          </div>
        )}

        {/* Accuracy — player vs bot */}
        {analysis && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <span
              className="text-lg font-bold"
              style={{ color: accuracyColor(analysis.accuracy) }}
            >
              {Math.round(analysis.accuracy)}%
            </span>
            <span className="text-xs text-zinc-400">vs</span>
            <span
              className="text-lg font-bold"
              style={{ color: accuracyColor(analysis.botAccuracy) }}
            >
              {Math.round(analysis.botAccuracy)}%
            </span>
          </div>
        )}

        {/* Quick stats */}
        {analysis && (
          <div className="mt-4 flex justify-center gap-6">
            {analysis.counts.brilliant > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-500">
                  {analysis.counts.brilliant}
                </div>
                <div className="text-xs text-zinc-400">Brilhante</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {analysis.counts.best + analysis.counts.great}
              </div>
              <div className="text-xs text-zinc-400">Ótimos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-lime-600">
                {analysis.counts.good}
              </div>
              <div className="text-xs text-zinc-400">Bom</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {analysis.counts.mistake + analysis.counts.blunder}
              </div>
              <div className="text-xs text-zinc-400">Erros</div>
            </div>
          </div>
        )}

        {/* Review button */}
        <button
          onClick={onViewReview}
          disabled={!canReview}
          className="mt-5 w-full rounded-xl bg-green-600 py-3 font-bold text-white transition-colors duration-150 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {analyzing ? "Analisando..." : "Ver Análise"}
        </button>

        {/* Next bot button (only on win when next bot exists) */}
        {result === "win" && nextBotId && onNextBot && (
          <button
            onClick={onNextBot}
            className="mt-3 w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {nextBotName ? `Próximo: ${nextBotName} →` : "Próximo Duelo →"}
          </button>
        )}

        {/* Secondary buttons */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={onRematch}
            className="flex-1 rounded-xl border-2 border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Revanche
          </button>
          <button
            onClick={onNewBot}
            className="flex-1 rounded-xl border-2 border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Voltar aos Duelos
          </button>
        </div>
      </div>
    </div>
  );
}
