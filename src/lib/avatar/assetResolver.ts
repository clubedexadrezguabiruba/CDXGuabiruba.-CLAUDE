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
 *
 * T0.2 — O CAMINHO CANDIDATO NÃO É MAIS A RESPOSTA FINAL.
 * Montar o caminho por convenção sempre devolvia uma string plausível, mesmo
 * quando o arquivo não existia; quem descobria a verdade era o `onError` da
 * <img>, tarde demais e em silêncio. Agora `resolveAsset()` confronta o
 * candidato com o manifesto (D20) e separa "não tem item equipado" de
 * "tem item equipado e o arquivo sumiu" — duas coisas que o `null` antigo
 * confundia numa só.
 */

import type { GenderVariant, RenderMode } from "./types";
import { assetExiste } from "./assetManifest";

/**
 * Resolve a URL final de um asset baseado em render mode, gênero e animação.
 *
 * Aplica APENAS as regras de nomenclatura — não verifica existência.
 * Para o caminho verificado contra o manifesto, use `resolveAsset()`.
 *
 * @param baseUrl   - image_url do item no DB (pode ser null)
 * @param gender    - "male" | "female"
 * @param renderMode - render mode do slot
 * @param animated  - true para pet em lg/xl (APNG)
 * @returns URL candidata ou null se baseUrl for null
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

    case "underlay":
    case "frame_ui":
      // Sem transformação de URL
      return baseUrl;

    default:
      return baseUrl;
  }
}

export interface AssetResolvido {
  /** Caminho que as regras de nomenclatura produzem. null se não há item. */
  candidato: string | null;
  /** Caminho confirmado no manifesto. null se o arquivo não existe. */
  src: string | null;
  /** true quando há item equipado mas o arquivo não está em public/items/. */
  ausente: boolean;
}

/**
 * Resolve um asset e confronta o resultado com o manifesto.
 *
 * `ausente: true` é o sinal que o render usa para falhar alto (T0.3) em vez
 * de sumir com a camada.
 */
export function resolveAsset(
  baseUrl: string | null | undefined,
  gender: GenderVariant,
  renderMode: RenderMode,
  animated: boolean = false,
): AssetResolvido {
  const candidato = resolveAssetUrl(baseUrl, gender, renderMode, animated);

  if (candidato === null) {
    return { candidato: null, src: null, ausente: false };
  }

  const existe = assetExiste(candidato);
  return { candidato, src: existe ? candidato : null, ausente: !existe };
}
