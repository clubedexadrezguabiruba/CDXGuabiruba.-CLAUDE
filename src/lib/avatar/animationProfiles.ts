/**
 * Avatar System — Animation Profiles
 *
 * Perfis canônicos de animação extraídos de AvatarDisplay.tsx e doc 08.
 * Valores validados visualmente — não alterar sem teste.
 *
 * Durações intencionalmente dessincronizadas (3s, 3.5s, 4s) para
 * evitar aspecto robótico de loop sincronizado.
 */

import type { AvatarSize, MotionProfile } from "./types";

// --- Global Motion (character-root) ---
// Extraído de AvatarDisplay.tsx linhas 62-70

export const GLOBAL_IDLE: MotionProfile = {
  animate: {
    scaleY: [1, 1.004, 1],
    rotate: [-0.3, 0.3, -0.3],
  },
  duration: 4,
  ease: "easeInOut",
  origin: "bottom center",
};

// --- Local Motion: Hand (swing) ---
// Extraído de AvatarDisplay.tsx linhas 101-108

export const HAND_SWING: MotionProfile = {
  animate: {
    rotate: [-2, 2, -2],
  },
  duration: 3,
  ease: "easeInOut",
  origin: "top center",
};

// --- Local Motion: Head (tilt) ---
// Extraído de AvatarDisplay.tsx linhas 132-139

export const HEAD_TILT: MotionProfile = {
  animate: {
    rotate: [-0.5, 0.5, -0.5],
  },
  duration: 3.5,
  ease: "easeInOut",
  origin: "bottom center",
};

// --- Condição de ativação ---

/** Animações ativas apenas em lg/xl (doc 08) */
export function isAnimated(size: AvatarSize): boolean {
  return size === "lg" || size === "xl";
}

// --- Limites absolutos (doc 08) ---

export const ANIMATION_LIMITS = {
  maxRotateGlobal: 1,      // ±1° máximo
  maxScaleYGlobal: 0.01,   // ±1% máximo
  maxRotateHand: 5,        // ±5° máximo
  maxRotateHead: 2,        // ±2° máximo
  minDuration: 2,          // segundos
  maxDuration: 8,          // segundos
} as const;
