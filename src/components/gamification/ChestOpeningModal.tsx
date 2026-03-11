"use client";

import { useEffect, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import type { ClaimedItem } from "@/hooks/useChests";

interface ChestOpeningModalProps {
  item: ClaimedItem;
  onClose: () => void;
}

const RARITY_STYLES: Record<string, { border: string; badge: string; bg: string; glow: string }> = {
  common: {
    border: "border-zinc-300",
    badge: "bg-zinc-200 text-zinc-600",
    bg: "bg-zinc-50",
    glow: "",
  },
  rare: {
    border: "border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    bg: "bg-blue-50",
    glow: "",
  },
  epic: {
    border: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
    bg: "bg-purple-50",
    glow: "",
  },
  legendary: {
    border: "border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    bg: "bg-amber-50",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.4)]",
  },
};

const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const SLOT_LABELS: Record<string, string> = {
  head: "Cabeça",
  outfit: "Roupa",
  hand: "Mão",
  background: "Fundo",
  frame: "Moldura",
  pet: "Pet",
};

/**
 * Modal de abertura de baú com animação em 3 fases.
 * Fase 1 (0–1.5s): suspense — baú tremendo
 * Fase 2 (1.5–2.5s): flash de abertura
 * Fase 3 (2.5s+): revelação do item
 *
 * Som: notify.mp3 como placeholder — substituir por chest-open.mp3 no polish.
 */
export default function ChestOpeningModal({ item, onClose }: ChestOpeningModalProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const t1 = setTimeout(() => {
      requestAnimationFrame(() => setPhase(2));
    }, 1500);

    const t2 = setTimeout(() => {
      // placeholder — substituir por som dedicado de baú
      soundManager.play("notify");
      requestAnimationFrame(() => setPhase(3));
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const style = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-500"
        onClick={phase === 3 ? onClose : undefined}
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
            className={`animate-scale-in flex w-72 flex-col items-center rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} p-6 shadow-2xl`}
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

            {/* Confirmação */}
            <p className="mt-3 text-xs text-zinc-400">
              Adicionado ao inventário
            </p>

            {/* Botão */}
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
