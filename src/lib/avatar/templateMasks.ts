/**
 * Avatar System — Template Masks
 *
 * Definição canônica das masks por slot. Cada mask indica qual região
 * do canvas um asset daquele slot deve preencher.
 *
 * Usado para:
 * - Gerar SVG masks de referência
 * - Validar posicionamento de assets no pipeline
 * - Orientar artistas/IA sobre onde desenhar
 */

import type { AvatarSlot, GenderVariant } from "./types";
import { getTemplateRegions, type PixelRect } from "./templateGuides";
import { CANVAS_RUNTIME, BODY_RUNTIME } from "./constants";

export interface SlotMask {
  slot: AvatarSlot;
  label: string;
  region: PixelRect | null;
  requiresGenderVariant: boolean;
  notes: string;
}

/**
 * Retorna a mask de um slot para um dado gênero.
 * Slots sem região espacial (background, frame) retornam region=null.
 */
export function getSlotMask(slot: AvatarSlot, gender: GenderVariant): SlotMask {
  const regions = getTemplateRegions(gender);

  switch (slot) {
    case "head":
      return {
        slot: "head",
        label: "Head Region",
        region: regions.head,
        requiresGenderVariant: true,
        notes: "Cabeça inteira sem pescoço, corte no queixo. Canvas do asset: 1024×1024.",
      };

    case "hand":
      return {
        slot: "hand",
        label: "Hand Region",
        region: regions.hand,
        requiresGenderVariant: false,
        notes: "Item na mão direita do personagem (lado esquerdo da tela). Canvas do asset: 512×512.",
      };

    case "outfit":
      return {
        slot: "outfit",
        label: "Outfit Region (dressed_base)",
        region: regions.body,
        requiresGenderVariant: true,
        notes: `Corpo inteiro com roupa, mesma pose da base. Canvas do asset: ${BODY_RUNTIME.width}×${BODY_RUNTIME.height}.`,
      };

    case "pet":
      return {
        slot: "pet",
        label: "Pet Region",
        region: regions.pet,
        requiresGenderVariant: false,
        notes: "Companion no canto inferior direito. Canvas do asset: 1024×1024.",
      };

    case "background":
      return {
        slot: "background",
        label: "Background (full canvas)",
        region: { x: 0, y: 0, width: CANVAS_RUNTIME.width, height: CANVAS_RUNTIME.height },
        requiresGenderVariant: false,
        notes: `Preenche canvas inteiro ${CANVAS_RUNTIME.width}×${CANVAS_RUNTIME.height}. Chão sólido no terço inferior.`,
      };

    case "frame":
      return {
        slot: "frame",
        label: "Frame (CSS border-image)",
        region: null,
        requiresGenderVariant: false,
        notes: "Não é camada de imagem. Renderizado como CSS border-image ao redor do container.",
      };
  }
}
