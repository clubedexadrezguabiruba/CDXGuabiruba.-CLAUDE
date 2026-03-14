"use client";

import { useEffect, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import { RARITY_STYLES, RARITY_LABELS } from "@/lib/constants/items";
import type { HatchResult } from "@/types/inventory";

interface EggHatchingModalProps {
  result: HatchResult;
  onClose: () => void;
}

/**
 * Modal de eclosao de ovo com animacao em 3 fases:
 *   Fase 1 (0-1.5s): ovo tremendo intensamente
 *   Fase 2 (1.5-2.5s): flash de quebra
 *   Fase 3 (2.5s+): revelacao do pet ou XP bonus
 */
export default function EggHatchingModal({ result, onClose }: EggHatchingModalProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        requestAnimationFrame(() => setPhase(2));
      }, 1500),
    );

    timers.push(
      setTimeout(() => {
        soundManager.play("notify");
        requestAnimationFrame(() => setPhase(3));
      }, 2500),
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const canClose = phase === 3;
  const pet = result.pet;
  const isXp = result.is_xp_egg;
  const style = pet
    ? RARITY_STYLES[pet.rarity] ?? RARITY_STYLES.common
    : RARITY_STYLES.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-500"
        onClick={canClose ? onClose : undefined}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Fase 1: Ovo tremendo */}
        {phase === 1 && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-7xl animate-egg-hatch-tremble">
              🥚
            </div>
            <p className="text-lg font-semibold text-white animate-pulse">
              O ovo esta chocando...
            </p>
          </div>
        )}

        {/* Fase 2: Flash */}
        {phase === 2 && (
          <div className="flex items-center justify-center">
            <div className="h-40 w-40 animate-ping rounded-full bg-amber-300/80" />
          </div>
        )}

        {/* Fase 3: Revelacao */}
        {phase === 3 && !isXp && pet && (
          <div
            className={`animate-scale-in flex w-72 flex-col items-center rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} p-6 shadow-2xl`}
          >
            {/* Badge de raridade */}
            <span
              className={`mb-3 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}
            >
              {RARITY_LABELS[pet.rarity] ?? pet.rarity}
            </span>

            {/* Imagem do pet */}
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-inner text-4xl">
              {pet.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pet.image_url}
                  alt={pet.name}
                  className="h-16 w-16 object-contain"
                />
              ) : (
                "🐾"
              )}
            </div>

            {/* Nome */}
            <h3 className="text-center text-lg font-bold text-zinc-900">
              {pet.name}
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">Pet</p>

            {/* Descricao */}
            {pet.description && (
              <p className="mt-2 text-center text-sm text-zinc-600">
                {pet.description}
              </p>
            )}

            <p className="mt-3 text-xs text-zinc-400">
              Adicionado ao inventario
            </p>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Fase 3: XP bonus */}
        {phase === 3 && isXp && (
          <div className="animate-scale-in flex flex-col items-center gap-3">
            <div className="text-5xl">✨</div>
            <p className="text-2xl font-bold text-amber-400">
              +{result.xp_bonus} XP
            </p>
            <p className="text-sm text-zinc-300">
              Todos os pets coletados!
            </p>
            <p className="text-xs text-zinc-400">
              Experiencia bonus recebida
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
