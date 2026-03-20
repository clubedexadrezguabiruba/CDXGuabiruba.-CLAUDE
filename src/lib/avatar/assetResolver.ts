/**
 * Avatar System — Asset Resolver
 *
 * Função pura central que resolve a URL final de um asset dado o
 * render mode, gênero e estado de animação. Encapsula toda a lógica
 * de naming legado (suffixes -swap-male, -animated, etc.) num único lugar.
 *
 * Regras de resolução (doc 03):
 *   head_swap:    {slug}.png → {slug}-swap-{gender}.png
 *   dressed_base: {slug}.png → {slug}-{gender}.png
 *   companion:    {slug}.png → {slug}-animated.png  (se animated=true)
 *   overlay:      sem transformação
 *   underlay:     sem transformação
 *   frame_ui:     sem transformação
 */

import type { GenderVariant, RenderMode } from "./types";

/**
 * Resolve a URL final de um asset baseado em render mode, gênero e animação.
 *
 * @param baseUrl   - image_url do item no DB (pode ser null)
 * @param gender    - "male" | "female"
 * @param renderMode - render mode do slot
 * @param animated  - true para pet em lg/xl (APNG)
 * @returns URL resolvida ou null se baseUrl for null
 */
export function resolveAssetUrl(
  baseUrl: string | null | undefined,
  gender: GenderVariant,
  renderMode: RenderMode,
  animated: boolean = false,
): string | null {
  if (!baseUrl) return null;

  switch (renderMode) {
    case "head_swap":
      // Cabeça redesenhada com acessório — variante por gênero
      // /items/head/bandana-tatica.png → /items/head/bandana-tatica-swap-male.png
      return baseUrl.replace(/\.png$/, `-swap-${gender}.png`);

    case "dressed_base":
      // Corpo inteiro com roupa — variante por gênero
      // /items/outfit/tunica-azul.png → /items/outfit/tunica-azul-male.png
      return baseUrl.replace(/\.png$/, `-${gender}.png`);

    case "companion":
      if (animated) {
        // Pet animado (APNG) — usado em lg/xl
        // /items/pet/peaozinho-madeira.png → /items/pet/peaozinho-madeira-animated.png
        return baseUrl.replace(/\.png$/, "-animated.png");
      }
      // Pet estático — usado em sm/md
      return baseUrl;

    case "overlay":
    case "underlay":
    case "frame_ui":
      // Sem transformação de URL
      return baseUrl;

    default:
      return baseUrl;
  }
}
