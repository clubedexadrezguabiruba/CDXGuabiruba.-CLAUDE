/**
 * Avatar System — Constantes Canônicas
 *
 * Valores estruturais do sistema de avatar centralizados aqui.
 * Extraídos de AvatarDisplay.tsx e dos docs fundacionais (doc 04).
 */

import type { AvatarSize, CanvasDimensions, SizeConfig } from "./types";

// --- Canvas Dimensions (doc 04) ---

export const CANVAS_PRODUCTION: CanvasDimensions = { width: 800, height: 1120 };
export const CANVAS_RUNTIME: CanvasDimensions = { width: 400, height: 560 };

export const BODY_PRODUCTION: CanvasDimensions = { width: 800, height: 1200 };
export const BODY_RUNTIME: CanvasDimensions = { width: 400, height: 600 };

/** Aspect ratio canônico do avatar container: 5:7 */
export const CANVAS_RATIO = 5 / 7;

/** Posição da ground line como fração da altura (95%) */
export const GROUND_LINE = 0.95;

/** Fração do canvas ocupada pelo body (93%) */
export const BODY_SCALE = 0.93;

// --- Size Config por Viewport ---
// Extraído de AvatarDisplay.tsx linhas 15-20

export const SIZE_CONFIG: Record<AvatarSize, SizeConfig> = {
  sm: { w: 56, h: 78, petSize: 24 },
  md: { w: 100, h: 140, petSize: 40 },
  lg: { w: 200, h: 280, petSize: 80 },
  xl: { w: 340, h: 476, petSize: 110 },
} as const;

// --- Z-Indices por Layer ---

export const Z_INDEX = {
  background: 0,
  body: 1,        // base skin ou dressed_base
  hand: 3,
  head: 4,
  pet: 5,
  frame: 10,
} as const;

// --- Performance Budget (doc 08) ---

export const PET_APNG_BUDGET = {
  targetSizeBytes: 3 * 1024 * 1024,    // ~3 MB
  maxSizeBytes: 5 * 1024 * 1024,       // 5 MB absoluto
  targetWidth: 240,                     // px
  targetFps: 8,
  maxFps: 12,
  cycleDurationRange: [10, 16] as const, // segundos
} as const;

// --- Head Asset Dimensions ---

export const HEAD_ASSET_SIZE = 1024;  // 1024×1024 px
export const HAND_ASSET_SIZE = 512;   // 512×512 px
export const PET_ASSET_SIZE = 1024;   // 1024×1024 px (estático)
