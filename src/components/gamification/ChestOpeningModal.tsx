"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { soundManager } from "@/lib/sounds/soundManager";

interface ChestOpeningModalProps {
  /** Ovo criado — a recompensa chega ao chocar. */
  isEgg?: boolean;
  /** XP pago na hora. */
  xp?: number;
  onClose: () => void;
}

/**
 * Modal de abertura de baú — três fases, dois desfechos.
 *
 *   Fase 1 (0–1.5s): suspense, o baú tremendo
 *   Fase 2 (1.5–2.5s): flash de abertura
 *   Fase 3 (2.5s+): o desfecho — ovo, ou XP
 *
 * O QUE SAIU DAQUI NO BLOCO A (2026-08-10), e por quê
 * ---------------------------------------------------
 * Saíram o card do item, a fase de despedaçamento e a fase 5 de recompensa —
 * as três existiam para o baú que entregava EQUIPAMENTO, e para a "forja" do
 * equipamento repetido. Não há mais item no baú: o catálogo do avatar v2 está
 * sendo apagado (docs/avatar/20-troca-de-pilha-plano.md) e `claim_chest` já
 * não consulta `items`.
 *
 * O despedaçamento não foi substituído por outra animação de propósito. Ele
 * animava uma coisa concreta se quebrando; sem a coisa, seria movimento sem
 * referente — e a regra da direção é que a recompensa é REAÇÃO A FATO, não
 * enfeite. O XP aqui já foi concedido pelo servidor antes de esta tela existir.
 *
 * Este componente ainda não foi migrado para a direção A: as cores cruas
 * abaixo são as que já estavam aqui, mantidas para não acrescentar débito novo
 * enquanto o modal inteiro não passa pela migração.
 */
export default function ChestOpeningModal({
  isEgg = false,
  xp = 0,
  onClose,
}: ChestOpeningModalProps) {
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

        {/* Fase 3a: Ovo misterioso */}
        {phase === 3 && isEgg && (
          <div className="animate-scale-in flex w-72 flex-col items-center rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-2xl">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-inner text-5xl">
              🥚
            </div>
            <h3 className="text-center text-lg font-bold text-amber-900">
              Um ovo misterioso apareceu!
            </h3>
            <p className="mt-2 text-center text-sm text-amber-700">
              Algo esta se formando dentro... Volte em breve para chocar!
            </p>
            <Link
              href="/perfil"
              className="mt-4 block w-full rounded-lg bg-amber-500 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Ir para Chocadeira
            </Link>
            <button
              onClick={onClose}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-700"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Fase 3b: XP na hora */}
        {phase === 3 && !isEgg && (
          <div className="animate-xp-reveal flex flex-col items-center gap-3">
            <div className="text-5xl">⚔️</div>
            <p className="text-2xl font-bold text-amber-500">+{xp} XP</p>
            <p className="text-sm text-zinc-300">Recompensa do baú</p>
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
