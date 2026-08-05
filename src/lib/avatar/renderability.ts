/**
 * Avatar System — Regra de renderabilidade
 *
 * Responde a UMA pergunta: "este item do catálogo chega a aparecer no boneco?"
 *
 * POR QUE ISTO É UM MÓDULO PRÓPRIO
 * --------------------------------
 * A resposta depende das regras de nomenclatura do resolver (um item de `head`
 * precisa de DUAS variantes de gênero, um `frame` não precisa de arquivo
 * nenhum porque é CSS). Essa regra estava implícita, espalhada entre
 * assetResolver.ts e AvatarDisplay.tsx — então nada podia verificá-la.
 *
 * Com a regra aqui, o gate de banco e o render consultam o MESMO código. Se a
 * Fase 2 mudar a nomenclatura (gênero deixa de existir, `garment` substitui
 * `dressed_base`), muda-se este arquivo e o gate acompanha sozinho — em vez de
 * a verificação continuar aprovando uma regra que o render não usa mais.
 */

import type { ItemSlot } from "@/types/inventory";
import type { GenderVariant } from "./types";
import { assetExiste } from "./assetManifest";

export const GENEROS: readonly GenderVariant[] = ["male", "female"] as const;

export interface ItemParaRender {
  slot: ItemSlot;
  image_url: string | null;
}

export interface Renderabilidade {
  /** true se o item aparece no boneco para todos os gêneros. */
  renderiza: boolean;
  /** Arquivos que o item exige e que NÃO existem. Vazio quando renderiza. */
  faltando: string[];
  /** Todos os arquivos que o item exige (existindo ou não). */
  exigidos: string[];
  /** Explicação curta, para mensagem de gate. */
  motivo: string;
}

/**
 * Arquivos que um item precisa ter em `public/items/` para renderizar.
 *
 * Espelha resolveAssetUrl() + resolveAvatar(). Mantê-los em sincronia é o
 * propósito do teste unitário em __tests__/renderability.test.ts.
 */
export function assetsExigidos(item: ItemParaRender): string[] {
  const base = item.image_url;

  // Frame não passa pelo render stack: é border + glow em CSS, derivado da
  // raridade (frameStyles.ts). Renderiza mesmo sem arquivo algum.
  if (item.slot === "frame") return [];

  if (!base) return [];

  switch (item.slot) {
    // head_swap: cabeça inteira redesenhada, uma por gênero.
    case "head":
      return GENEROS.map((g) => base.replace(/\.png$/, `-swap-${g}.png`));

    // dressed_base: corpo inteiro vestido, um por gênero.
    case "outfit":
      return GENEROS.map((g) => base.replace(/\.png$/, `-${g}.png`));

    // underlay / companion: o próprio arquivo, sem variante.
    // O APNG do pet (-animated) é opcional — sem ele o pet ainda aparece
    // estático, então não entra como exigência.
    case "background":
    case "pet":
      return [base];

    default:
      return [base];
  }
}

/**
 * Avalia um item do catálogo contra o manifesto de assets.
 *
 * @param existe - injetável para o gate poder avaliar contra um manifesto
 *                 recém-varrido do disco em vez do arquivo commitado.
 */
export function avaliarRenderabilidade(
  item: ItemParaRender,
  existe: (caminho: string) => boolean = assetExiste,
): Renderabilidade {
  if (item.slot === "frame") {
    return { renderiza: true, faltando: [], exigidos: [], motivo: "frame é CSS puro, não precisa de arquivo" };
  }

  if (!item.image_url) {
    return { renderiza: false, faltando: [], exigidos: [], motivo: "image_url nulo" };
  }

  const exigidos = assetsExigidos(item);
  const faltando = exigidos.filter((c) => !existe(c));

  return {
    renderiza: faltando.length === 0,
    faltando,
    exigidos,
    motivo: faltando.length === 0 ? "todos os assets presentes" : `${faltando.length} de ${exigidos.length} assets ausentes`,
  };
}
