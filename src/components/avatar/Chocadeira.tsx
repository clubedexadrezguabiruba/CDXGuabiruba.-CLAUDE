"use client";

import { useState } from "react";
import { useEggs } from "@/hooks/useEggs";
import { EGG_HATCH_HOURS } from "@/lib/constants/items";
import EggHatchingModal from "@/components/gamification/EggHatchingModal";
import Badge from "@/components/ui/Badge";
import Card, { CardTitle } from "@/components/ui/Card";
import type { HatchResult } from "@/types/inventory";

/**
 * O ESTADO VAZIO — e desde o E.2 ele é o único estado que existe.
 *
 * `claim_chest` parou de criar ovo quando o baú passou a pagar XP na hora, e pet
 * foi apagado no Bloco B. Enquanto não houver arte de bichinho, a fila fica em
 * zero para sempre.
 *
 * **A Chocadeira fica na tela mesmo assim** — decisão do Doug no E.4. Sumir seria
 * mais limpo e mais errado: o aluno que já viu ovo aqui concluiria que perdeu
 * alguma coisa, e quem nunca viu não saberia que existe. Vazio com prazo é uma
 * promessa; ausência é um buraco.
 *
 * O texto não promete data porque não há data, e não diz "pet" porque a palavra
 * ainda não existe em lugar nenhum do produto para a criança.
 */
function ChocadeiraVazia() {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <CardTitle className="mb-0">Chocadeira</CardTitle>
        <Badge>Em breve</Badge>
      </div>
      <div className="flex items-center gap-3">
        <svg
          aria-hidden
          className="h-9 w-9 shrink-0 text-ink/25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="M12 3c3.2 0 6 4.6 6 8.4A6 6 0 016 11.4C6 7.6 8.8 3 12 3z" />
          <path d="M9.5 12.5l1.6 1.6 1.5-2 1.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-ink/70">
          Nenhum ovo por aqui. Os baús estão pagando XP na hora — os ovos voltam
          quando os bichos da Academia chegarem.
        </p>
      </div>
    </Card>
  );
}

const CRACK_LINES = [
  [], // crack 0: intacto
  [{ top: "40%", left: "45%", rotate: -30 }],
  [
    { top: "35%", left: "40%", rotate: -30 },
    { top: "50%", left: "50%", rotate: 20 },
  ],
  [
    { top: "30%", left: "35%", rotate: -45 },
    { top: "45%", left: "50%", rotate: 15 },
    { top: "55%", left: "40%", rotate: -10 },
  ],
  [
    { top: "25%", left: "35%", rotate: -45 },
    { top: "40%", left: "55%", rotate: 25 },
    { top: "50%", left: "35%", rotate: -15 },
    { top: "60%", left: "50%", rotate: 40 },
  ],
  [], // crack 5: pronto (no lines, different emoji)
];

export default function Chocadeira() {
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

  if (loading) return null;
  if (eggCount === 0) return <ChocadeiraVazia />;
  if (!activeEgg || !activeStage || !activeTimeRemaining) return null;

  const crack = activeStage.crack;
  const trembles = "tremble" in activeStage && activeStage.tremble;
  const cracks = CRACK_LINES[crack] ?? [];
  const progressPercent = Math.min(
    100,
    100 - (activeTimeRemaining.totalMs / (EGG_HATCH_HOURS * 3600000)) * 100,
  );

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
      const msg = err instanceof Error ? err.message : "Erro ao chocar";
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
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-amber-900">
          Chocadeira
        </h3>

        {/* Main egg display */}
        <div className="flex flex-col items-center gap-3">
          {/* Large egg */}
          <div className="relative">
            <span
              className={`block text-8xl ${trembles ? "animate-egg-tremble" : ""} ${activeIsReady ? "animate-egg-glow" : ""}`}
            >
              {crack >= 5 ? "🐣" : "🥚"}
            </span>
            {/* Crack lines overlay */}
            {cracks.map((line, i) => (
              <div
                key={i}
                className="absolute h-[2px] w-5 bg-amber-800/50 rounded pointer-events-none"
                style={{
                  top: line.top,
                  left: line.left,
                  transform: `rotate(${line.rotate}deg)`,
                }}
              />
            ))}
          </div>

          {/* Stage label */}
          <p className="text-sm font-semibold text-amber-800">
            {activeStage.label}
          </p>

          {/* Timer / Ready */}
          {activeIsReady ? (
            <p className="text-sm font-bold text-green-600">
              Pronto para chocar!
            </p>
          ) : (
            <p className="text-sm text-amber-700">
              {activeTimeRemaining.hours}h {activeTimeRemaining.minutes}min restantes
            </p>
          )}

          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="h-2 w-full rounded-full bg-amber-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-amber-600">
              <span>0h</span>
              <span>24h</span>
              <span>48h</span>
              <span>72h</span>
            </div>
          </div>

          {/* Hatch button */}
          {activeIsReady && (
            <button
              onClick={handleHatch}
              disabled={hatching}
              className="mt-2 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-bold text-white shadow transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              {hatching ? "Chocando..." : "Chocar!"}
            </button>
          )}

          {hatchError && (
            <p className="text-sm text-red-600">{hatchError}</p>
          )}
        </div>

        {/* Queued eggs */}
        {queuedEggs.length > 0 && (
          <div className="mt-4 border-t border-amber-200 pt-3">
            <p className="mb-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Fila ({queuedEggs.length})
            </p>
            <div className="flex gap-2">
              {queuedEggs.map((egg) => (
                <div
                  key={egg.id}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-xl"
                  title={`Posicao ${egg.queue_position ?? "?"} na fila`}
                >
                  🥚
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {hatchResult && (
        <EggHatchingModal result={hatchResult} onClose={handleCloseModal} />
      )}
    </>
  );
}
