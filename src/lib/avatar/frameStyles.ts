/**
 * Avatar System — Frame Styles
 *
 * Mapeia rarity de um frame item equipado → classes CSS decorativas.
 * Frame é puro CSS (border + glow), não uma imagem no render stack.
 *
 * Evolução futura: border-image com assets 9-slice pode ser adicionado
 * aqui sem mudar a interface. O componente consumiria `style` em vez
 * de (ou além de) `className`.
 */

import type { AvatarSize } from "./types";

export interface FrameStyle {
  borderClass: string;
  glowClass: string;
}

/**
 * Estilos de frame por rarity.
 * Derivados de RARITY_STYLES em src/lib/constants/items.ts
 * mas especializados para o contexto de frame (borda + glow ao redor do avatar).
 */
const FRAME_RARITY_STYLES: Record<string, FrameStyle> = {
  common: {
    borderClass: "border-zinc-300",
    glowClass: "",
  },
  rare: {
    borderClass: "border-blue-400",
    glowClass: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
  },
  epic: {
    borderClass: "border-purple-500",
    glowClass: "shadow-[0_0_16px_rgba(168,85,247,0.3)]",
  },
  legendary: {
    borderClass: "border-amber-400",
    glowClass: "shadow-[0_0_24px_rgba(251,191,36,0.4)]",
  },
};

const FALLBACK_STYLE: FrameStyle = FRAME_RARITY_STYLES.common;

/** Border width por avatar size (px) */
export const FRAME_BORDER_WIDTH: Record<AvatarSize, number> = {
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
};

/** Retorna as classes CSS para o frame baseado na rarity do item equipado */
export function getFrameStyle(rarity: string): FrameStyle {
  return FRAME_RARITY_STYLES[rarity] ?? FALLBACK_STYLE;
}
