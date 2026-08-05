/**
 * Avatar System — Template Guides
 *
 * Regiões computadas em pixels do runtime canvas (400×560) derivadas
 * dos anchor profiles de RECRUTA_V1. Usadas para gerar SVG guides e
 * para referência programática no pipeline de processamento.
 *
 * Todos os valores aqui são DERIVADOS — a fonte de verdade está em
 * bodyFamilies.ts (frações normalizadas). Este módulo converte para
 * pixels concretos do canvas runtime.
 */

import type { GenderVariant } from "./types";
import { CANVAS_RUNTIME, BODY_SCALE, GROUND_LINE } from "./constants";
import { RECRUTA_V1 } from "./bodyFamilies";

// --- Tipos ---

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateRegions {
  canvas: { width: number; height: number };
  body: PixelRect;
  groundLineY: number;
  head: PixelRect;
  pet: PixelRect;
}

// --- Cálculo ---

const CW = CANVAS_RUNTIME.width;   // 400
const CH = CANVAS_RUNTIME.height;  // 560

function computeRegions(gender: GenderVariant): TemplateRegions {
  const anchors = RECRUTA_V1.anchors[gender];

  const bodyW = CW * BODY_SCALE;
  const bodyH = CH * BODY_SCALE;

  return {
    canvas: { width: CW, height: CH },

    body: {
      x: (CW - bodyW) / 2,
      y: CH - bodyH,
      width: bodyW,
      height: bodyH,
    },

    groundLineY: CH * GROUND_LINE,

    head: {
      x: CW * anchors.head.left,
      y: CH * anchors.head.top,
      width: CW * anchors.head.width,
      height: CH * anchors.head.height,
    },

    // Pet: bottom/right → convert to x/y/width/height
    // Usando petSize xl (110) × sizeMultiplier como referência visual
    pet: {
      x: CW - (CW * Math.abs(anchors.pet.right)) - 110 * anchors.pet.sizeMultiplier,
      y: CH - (CH * anchors.pet.bottom) - 110 * anchors.pet.sizeMultiplier,
      width: 110 * anchors.pet.sizeMultiplier,
      height: 110 * anchors.pet.sizeMultiplier,
    },
  };
}

// --- Regiões pré-computadas ---

export const TEMPLATE_REGIONS_MALE = computeRegions("male");
export const TEMPLATE_REGIONS_FEMALE = computeRegions("female");

export function getTemplateRegions(gender: GenderVariant): TemplateRegions {
  return gender === "female" ? TEMPLATE_REGIONS_FEMALE : TEMPLATE_REGIONS_MALE;
}
