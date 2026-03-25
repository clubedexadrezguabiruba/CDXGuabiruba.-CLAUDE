/**
 * Avatar System — Body Family Definitions
 *
 * Define a body family canônica "recruta_v1" com todos os anchors e dimensões.
 * Valores extraídos de AvatarDisplay.tsx linhas 28-30 (head), 94-97 (hand),
 * 156-159 (pet) e dos docs fundacionais (doc 04).
 *
 * Estes valores são per-body_family+gender, nunca per-item.
 */

import type { BodyFamilyDefinition } from "./types";
import {
  CANVAS_PRODUCTION,
  CANVAS_RUNTIME,
  BODY_PRODUCTION,
  BODY_RUNTIME,
  BODY_SCALE,
  GROUND_LINE,
} from "./constants";

export const RECRUTA_V1: BodyFamilyDefinition = {
  id: "recruta_v1",

  canvas: {
    production: CANVAS_PRODUCTION,
    runtime: CANVAS_RUNTIME,
  },

  body: {
    production: BODY_PRODUCTION,
    runtime: BODY_RUNTIME,
    scale: BODY_SCALE,
  },

  groundLine: GROUND_LINE,

  anchors: {
    male: {
      head: {
        top: 0.100,
        left: 0.1,
        width: 0.8,
        height: 0.215,
        origin: "bottom center",
        scale: 0.92,
      },
      hand: {
        top: 0.32,
        left: 0.17,
        width: 0.25,
        height: 0.25,
        origin: "top center",
      },
      pet: {
        bottom: 0.09,
        right: -0.01,
        sizeMultiplier: 1.3,
      },
    },
    female: {
      head: {
        top: 0.098,
        left: 0.039,
        width: 0.92,
        height: 0.230,
        origin: "bottom center",
      },
      hand: {
        top: 0.32,
        left: 0.17,
        width: 0.25,
        height: 0.25,
        origin: "top center",
      },
      pet: {
        bottom: 0.09,
        right: -0.01,
        sizeMultiplier: 1.3,
      },
    },
  },
};

/** Body family padrão — único existente */
export const DEFAULT_BODY_FAMILY = RECRUTA_V1;
