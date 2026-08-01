/**
 * Avatar System — Render Modes
 *
 * Mapeamento canônico de slot → render mode.
 * O render_mode é propriedade do slot, não do item (doc 01).
 */

import type { AvatarSlot, RenderMode } from "./types";

/**
 * Cada slot tem exatamente um render mode.
 * - underlay: preenche canvas inteiro (background)
 * - dressed_base: substitui body quando outfit equipado
 * - head_swap: substitui head region com variante por gênero
 * - companion: fora do character-root, posição independente
 * - frame_ui: CSS, fora do render stack de imagens
 */
export const SLOT_RENDER_MODES: Record<AvatarSlot, RenderMode> = {
  background: "underlay",
  outfit: "dressed_base",
  head: "head_swap",
  pet: "companion",
  frame: "frame_ui",
} as const;
