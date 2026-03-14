"use client";

import { useEffect, useMemo, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import { RARITY_STYLES, RARITY_LABELS, SLOT_LABELS } from "@/lib/constants/items";
import type { ClaimedItem } from "@/hooks/useChests";

interface ChestOpeningModalProps {
  item: ClaimedItem;
  scrapped?: boolean;
  scrappedXp?: number;
  onClose: () => void;
}

const FRAGMENT_COLORS: Record<string, string> = {
  common: "bg-zinc-400",
  rare: "bg-blue-400",
  epic: "bg-purple-500",
  legendary: "bg-amber-400",
};

/**
 * Modal de abertura de baú com animação em 3 fases (normal)
 * ou 5 fases quando item é duplicado (forja de experiência).
 *
 * Normal:
 *   Fase 1 (0–1.5s): suspense — baú tremendo
 *   Fase 2 (1.5–2.5s): flash de abertura
 *   Fase 3 (2.5s+): revelação do item
 *
 * Forja (scrapped):
 *   Fase 1–2: idênticas
 *   Fase 3 (2.5–4.2s): revelação com aviso "já em seu inventário"
 *   Fase 4 (4.2–5.6s): despedaçamento com fragmentos
 *   Fase 5 (5.6s+): recompensa XP
 */
export default function ChestOpeningModal({
  item,
  scrapped = false,
  scrappedXp = 0,
  onClose,
}: ChestOpeningModalProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Fragmentos pré-calculados (estáveis entre renders)
  const fragments = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * 360 + Math.random() * 36;
        const dist = 80 + Math.random() * 120;
        return {
          fx: `${Math.cos((angle * Math.PI) / 180) * dist}px`,
          fy: `${Math.sin((angle * Math.PI) / 180) * dist}px`,
          fr: `${Math.random() * 720 - 360}deg`,
          size: 6 + Math.random() * 8,
          delay: Math.random() * 0.15,
        };
      }),
    [],
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Fase 1 → 2
    timers.push(
      setTimeout(() => {
        requestAnimationFrame(() => setPhase(2));
      }, 1500),
    );

    // Fase 2 → 3
    timers.push(
      setTimeout(() => {
        soundManager.play("notify");
        requestAnimationFrame(() => setPhase(3));
      }, 2500),
    );

    if (scrapped) {
      // Fase 3 → 4 (despedaçamento)
      timers.push(
        setTimeout(() => {
          soundManager.play("capture");
          requestAnimationFrame(() => setPhase(4));
        }, 4200),
      );

      // Fase 4 → 5 (recompensa XP)
      timers.push(
        setTimeout(() => {
          requestAnimationFrame(() => setPhase(5));
        }, 5600),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [scrapped]);

  const style = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
  const fragmentColor = FRAGMENT_COLORS[item.rarity] ?? FRAGMENT_COLORS.common;
  const canClose = scrapped ? phase === 5 : phase === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-500"
        onClick={canClose ? onClose : undefined}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Fase 1: Suspense */}
        {phase === 1 && (
          <div className="flex flex-col items-center gap-4 animate-bounce">
            <div className="text-7xl">🎁</div>
            <p className="text-lg font-semibold text-white animate-pulse">
              Abrindo baú...
            </p>
          </div>
        )}

        {/* Fase 2: Flash */}
        {phase === 2 && (
          <div className="flex items-center justify-center">
            <div className="h-40 w-40 animate-ping rounded-full bg-white/80" />
          </div>
        )}

        {/* Fase 3: Revelação */}
        {phase === 3 && (
          <div
            className={`animate-scale-in flex w-72 flex-col items-center rounded-2xl border-2 ${
              scrapped ? "border-amber-400 animate-pulse" : style.border
            } ${style.bg} ${style.glow} p-6 shadow-2xl`}
          >
            {/* Badge de raridade */}
            <span
              className={`mb-3 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}
            >
              {RARITY_LABELS[item.rarity] ?? item.rarity}
            </span>

            {/* Ícone/imagem do item */}
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-inner text-4xl">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-16 w-16 object-contain"
                />
              ) : (
                "✨"
              )}
            </div>

            {/* Nome do item */}
            <h3 className="text-center text-lg font-bold text-zinc-900">
              {item.name}
            </h3>

            {/* Slot */}
            <p className="mt-0.5 text-xs text-zinc-500">
              {SLOT_LABELS[item.slot] ?? item.slot}
            </p>

            {/* Descrição */}
            {item.description && (
              <p className="mt-2 text-center text-sm text-zinc-600">
                {item.description}
              </p>
            )}

            {/* Status */}
            {scrapped ? (
              <p className="mt-3 text-xs font-medium text-amber-600">
                Equipamento já em seu inventário
              </p>
            ) : (
              <>
                <p className="mt-3 text-xs text-zinc-400">
                  Adicionado ao inventário
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Continuar
                </button>
              </>
            )}
          </div>
        )}

        {/* Fase 4: Despedaçamento */}
        {phase === 4 && (
          <div className="relative flex items-center justify-center">
            {/* Card sendo destruído */}
            <div
              className={`animate-item-shatter flex w-72 flex-col items-center rounded-2xl border-2 border-amber-400 ${style.bg} p-6 shadow-2xl`}
              style={{ animationDelay: "0.35s" }}
            >
              {/* Shake wrapper */}
              <div className="animate-item-shake flex flex-col items-center">
                <span
                  className={`mb-3 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}
                >
                  {RARITY_LABELS[item.rarity] ?? item.rarity}
                </span>
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-inner text-4xl">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 object-contain"
                    />
                  ) : (
                    "✨"
                  )}
                </div>
                <h3 className="text-center text-lg font-bold text-zinc-900">
                  {item.name}
                </h3>
              </div>
            </div>

            {/* Fragmentos radiais */}
            {fragments.map((f, i) => (
              <div
                key={i}
                className={`absolute animate-fragment-fly rounded-sm ${fragmentColor}`}
                style={
                  {
                    "--fx": f.fx,
                    "--fy": f.fy,
                    "--fr": f.fr,
                    width: f.size,
                    height: f.size,
                    animationDelay: `${0.35 + f.delay}s`,
                    opacity: 0,
                    animationFillMode: "backwards",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Fase 5: Recompensa XP */}
        {phase === 5 && (
          <div className="animate-xp-reveal flex flex-col items-center gap-3">
            <div className="text-5xl">⚔️</div>
            <p className="text-2xl font-bold text-amber-500">
              +{scrappedXp} XP
            </p>
            <p className="text-sm text-zinc-300">
              Equipamento forjado em experiência
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-48 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
