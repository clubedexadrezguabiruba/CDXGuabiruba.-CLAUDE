"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { soundManager } from "@/lib/sounds/soundManager";
import { AvatarTronco } from "@/components/avatar/AvatarTronco";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import { nomeDaPeca } from "@/lib/avatar/catalogo";
import { corDaRaridade, nomeDaRaridade } from "@/lib/avatar/raridade";

interface ChestOpeningModalProps {
  /** Ovo criado — a recompensa chega ao chocar. */
  isEgg?: boolean;
  /** XP pago na hora. */
  xp?: number;
  /**
   * A PEÇA sorteada, desde o `claim_chest` v3 (B6, 2026-08-13). Os três desfechos
   * são exclusivos: ovo, peça, ou XP.
   */
  itemSlug?: string;
  /**
   * O SLOT da peça sorteada — `traje`, `rosto`, `cabelo`.
   *
   * `useChests.ts:42` já o entregava e o modal o **jogava fora**: até 2026-08-23
   * o baú só dava traje, então desenhar tronco e ler o nome de `TRAJES_DA_ARTE`
   * dava certo por acidente. Com o cabelo no catálogo o acidente acaba — um cabelo
   * sorteado apareceria como tronco vazio com o slug cru por baixo.
   */
  itemSlot?: string;
  /** A raridade do baú — é a cor da moldura do card da peça. */
  raridade?: string;
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
  itemSlug,
  itemSlot,
  raridade = "common",
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

        {/* Fase 3b: A PEÇA — o baú voltou a dar objeto no B6 (2026-08-13) */}
        {phase === 3 && !isEgg && itemSlug && (
          <div className="animate-scale-in flex w-72 flex-col items-center rounded-2xl border-2 bg-white p-6 shadow-2xl"
               style={{ borderColor: corDaRaridade(raridade) }}>
            {/* O RECORTE SEGUE O SLOT, e é a mesma decisão §5.2 do doc 21 que a
                vitrine do editor já segue: mostra-se o pedaço do boneco em que a
                peça mora, não o boneco inteiro — a peça é o assunto do card.

                Traje é tronco; cabelo, rosto, óculos e chapéu são cabeça. A cabeça
                leva o cabelo junto quando a peça é de rosto porque a barba recolore
                COM ele (D17): uma cabeça careca mostraria a barba numa cor que o
                aluno não escolheu.

                ⚠️ **O `else` era um buraco, e ele engolia dois slots.** Até
                2026-08-27 qualquer peça que não fosse cabelo nem rosto caía no
                `<AvatarTronco traje={itemSlug}>` — e `trajeDe()` de um slug que não
                é traje não emite camada nenhuma. O aluno abria o baú, ganhava um
                óculos (5 peças desde 2026-08-27) ou um chapéu (9 peças) e via um
                TRONCO VAZIO com o nome da peça embaixo. Nenhuma régua estática
                enxerga: `itemSlot` é `string`, então não há união a exaurir.

                O chapéu é o único de cabeça que NÃO usa `<AvatarCabeca>`: a janela
                do recorte corta 4 dos 9 (o `mago` perde 62,1 u de 482 à esquerda —
                medido). Ele sai de corpo inteiro, como na vitrine. */}
            <div className="mb-3 grid place-items-center rounded-xl bg-warm-stone px-2 py-2">
              {itemSlot === "cabelo" ? (
                <AvatarCabeca skin={2} hair={itemSlug} hairColor={0} lado={120} ns="bau" />
              ) : itemSlot === "rosto" ? (
                <AvatarCabeca skin={2} hair={null} hairColor={0} rosto={itemSlug} lado={120} ns="bau" />
              ) : itemSlot === "oculos" ? (
                <AvatarCabeca skin={2} hair={null} hairColor={0} oculos={itemSlug} lado={120} ns="bau" />
              ) : itemSlot === "chapeu" ? (
                <AvatarKokeshi skin={2} hair={null} hairColor={0} chapeu={itemSlug} altura={150} ns="bau" />
              ) : (
                <AvatarTronco skin={2} hair={null} hairColor={0} traje={itemSlug} altura={120} ns="bau" />
              )}
            </div>
            {/* O nome da raridade vai ESCRITO junto da cor da moldura — a
                "Colorblind Rule" do DESIGN.md: cor sozinha não informa nada. */}
            <p className="text-xs font-semibold uppercase tracking-wider"
               style={{ color: corDaRaridade(raridade) }}>
              Peça {nomeDaRaridade(raridade)}
            </p>
            <h3 className="mt-1 text-center text-lg font-bold text-ink">
              {nomeDaPeca(itemSlot ?? "traje", itemSlug)}
            </h3>
            <p className="mt-2 text-center text-sm text-ink/70">
              Já está no seu guarda-roupa. Vista no perfil quando quiser.
            </p>
            <Link
              href="/perfil"
              className="mt-4 block w-full rounded-lg bg-deep-navy py-2 text-center text-sm font-medium text-warm-ivory transition-opacity hover:opacity-90"
            >
              Ir para o perfil
            </Link>
            <button onClick={onClose} className="mt-2 text-xs text-ink/60 hover:text-ink">
              Fechar
            </button>
          </div>
        )}

        {/* Fase 3c: XP na hora */}
        {phase === 3 && !isEgg && !itemSlug && (
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
