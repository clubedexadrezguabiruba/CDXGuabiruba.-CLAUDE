/**
 * Avatar System — Fallbacks & Canonical Paths
 *
 * Paths canônicos para base skins e regras de fallback.
 * Centraliza strings que antes eram construídas inline no componente.
 */

import type { GenderVariant } from "./types";

/**
 * Path da base skin por gênero.
 * Legado: `/items/base/avatar-base-${gender}.png`
 */
export function baseSkinPath(gender: GenderVariant): string {
  return `/items/base/avatar-base-${gender}.png`;
}

/**
 * Determina o src do body layer.
 * Se outfit equipado com image_url, resolve como dressed_base.
 * Senão, retorna a base skin padrão.
 *
 * Nota: No sistema legado, outfit renderiza como overlay separado (z:2).
 * No novo sistema (Fase 4+), dressed_base substitui a base inteira.
 * Este resolver já produz a URL correta para o novo sistema.
 */
export function resolveBodySrc(
  outfitImageUrl: string | null | undefined,
  gender: GenderVariant,
): string {
  if (outfitImageUrl) {
    // dressed_base: corpo inteiro com roupa, variante por gênero
    // Ex: /items/outfit/tunica-azul.png → /items/outfit/tunica-azul-male.png
    return outfitImageUrl.replace(/\.png$/, `-${gender}.png`);
  }
  return baseSkinPath(gender);
}
