"use client";

import { useState } from "react";
import { useEggs } from "@/hooks/useEggs";
import EggHatchingModal from "./EggHatchingModal";
import type { HatchResult } from "@/types/inventory";

const CRACK_VISUALS = [
  { emoji: "🥚", bg: "bg-amber-50", border: "border-amber-200" },
  { emoji: "🥚", bg: "bg-amber-50", border: "border-amber-300" },
  { emoji: "🥚", bg: "bg-amber-100", border: "border-amber-300" },
  { emoji: "🥚", bg: "bg-amber-100", border: "border-amber-400" },
  { emoji: "🐣", bg: "bg-amber-100", border: "border-amber-400" },
  { emoji: "🐣", bg: "bg-amber-200", border: "border-amber-500" },
];

export default function EggCard() {
  const {
    activeEgg,
    queuedEggs,
    eggCount,
    loading,
    activeStage,
    activeTimeRemaining,
    activeIsReady,
    hatchEgg,
  } = useEggs();

  const [hatching, setHatching] = useState(false);
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);
  const [hatchError, setHatchError] = useState<string | null>(null);

  if (loading || eggCount === 0) return null;
  if (!activeEgg || !activeStage || !activeTimeRemaining) return null;

  const crack = activeStage.crack;
  const visual = CRACK_VISUALS[crack] ?? CRACK_VISUALS[0];
  const trembles = "tremble" in activeStage && activeStage.tremble;

  async function handleHatch() {
    if (!activeEgg || hatching) return;
    setHatching(true);
    setHatchError(null);

    try {
      const result = await hatchEgg(activeEgg.id);
      if (result.already_hatched) {
        setHatching(false);
        return;
      }
      setHatchResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao chocar ovo";
      setHatchError(msg);
      setHatching(false);
    }
  }

  function handleCloseModal() {
    setHatchResult(null);
    setHatching(false);
  }

  return (
    <>
      <div className={`rounded-xl border ${visual.border} ${visual.bg} p-4 shadow-sm`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chocadeira</h2>
          {queuedEggs.length > 0 && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              +{queuedEggs.length} na fila
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Egg visual */}
          <div className="relative">
            <span
              className={`block text-5xl ${trembles ? "animate-egg-tremble" : ""} ${activeIsReady ? "animate-egg-glow" : ""}`}
            >
              {visual.emoji}
            </span>
            {/* Crack overlay lines */}
            {crack >= 1 && crack < 5 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {Array.from({ length: crack }, (_, i) => (
                  <div
                    key={i}
                    className="absolute h-[2px] w-3 bg-amber-800/40 rounded"
                    style={{
                      transform: `rotate(${-45 + i * 30}deg)`,
                      top: `${35 + i * 8}%`,
                      left: `${30 + (i % 2) * 20}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-700">
              {activeStage.label}
            </p>

            {activeIsReady ? (
              <p className="mt-0.5 text-xs font-semibold text-green-600">
                Pronto para chocar!
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500">
                {activeTimeRemaining.hours}h {activeTimeRemaining.minutes}min restantes
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-1000"
                style={{
                  width: `${Math.min(100, 100 - (activeTimeRemaining.totalMs / (72 * 3600000)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Hatch button */}
          {activeIsReady && (
            <button
              onClick={handleHatch}
              disabled={hatching}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              {hatching ? "Chocando..." : "Chocar!"}
            </button>
          )}
        </div>

        {hatchError && (
          <p className="mt-2 text-sm text-red-600">{hatchError}</p>
        )}
      </div>

      {hatchResult && (
        <EggHatchingModal result={hatchResult} onClose={handleCloseModal} />
      )}
    </>
  );
}
