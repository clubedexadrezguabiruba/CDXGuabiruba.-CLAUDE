/**
 * Avatar System — Domain Types
 *
 * Tipos centrais do sistema de avatar. Reutiliza ItemSlot de inventory.ts
 * para evitar duplicação. Define conceitos do modelo de domínio (doc 01).
 */

import type { ItemSlot } from "@/types/inventory";

// Re-export para conveniência — AvatarSlot é semanticamente o mesmo que ItemSlot
export type AvatarSlot = ItemSlot;

export type GenderVariant = "male" | "female";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type BodyFamilyId = "recruta_v1";

// --- Render Modes (doc 01) ---

export type RenderMode =
  | "underlay"       // background — preenche canvas inteiro
  | "dressed_base"   // outfit — substitui base skin (mesmo corpo + roupa)
  | "head_swap"      // head — cabeça redesenhada com acessório
  | "overlay"        // hand — item sobreposto ao corpo
  | "companion"      // pet — posicionado fora do character-root
  | "frame_ui";      // frame — CSS border-image, fora do render stack

// --- Animation Modes (doc 01) ---

export type AnimationMode =
  | "global"   // character-root: breathing + sway, herdado por filhos
  | "local"    // head/hand: micro-motion aditivo ao global
  | "baked"    // pet: APNG nativo, sem Framer Motion
  | "none";    // background, outfit (herda global), frame

// --- Coordenadas e Canvas ---

/** Coordenadas normalizadas (0–1) relativas ao canvas runtime */
export interface AnchorProfile {
  top: number;
  left: number;
  width: number;
  height: number;
  origin: string; // CSS transform-origin (ex: "bottom center")
}

/** Posicionamento especial do pet (bottom/right em vez de top/left) */
export interface PetAnchor {
  bottom: number;       // fração da altura do canvas
  right: number;        // fração da largura do canvas (negativo = para fora)
  sizeMultiplier: number; // multiplicador sobre petSize
}

/** Dimensões de canvas em pixels */
export interface CanvasDimensions {
  width: number;
  height: number;
}

/** Configuração de tamanho do avatar por viewport */
export interface SizeConfig {
  w: number;
  h: number;
  petSize: number;
}

// --- Animation ---

/** Parâmetros de uma animação Framer Motion em loop */
export interface MotionProfile {
  animate: Record<string, number[]>;
  duration: number;
  ease: string;
  origin: string; // CSS transform-origin
}

// --- Slot Definition ---

export interface SlotDefinition {
  slot: AvatarSlot;
  renderMode: RenderMode;
  zIndex: number;
  requiresGenderVariant: boolean;
  insideCharacterRoot: boolean;
  localAnimation: AnimationMode;
  hasAnimatedVariant: boolean;
}

// --- Body Family ---

export interface BodyFamilyAnchors {
  head: AnchorProfile;
  hand: AnchorProfile;
  pet: PetAnchor;
}

export interface BodyFamilyDefinition {
  id: BodyFamilyId;
  canvas: {
    production: CanvasDimensions;  // 800×1120
    runtime: CanvasDimensions;     // 400×560
  };
  body: {
    production: CanvasDimensions;  // 800×1200
    runtime: CanvasDimensions;     // 400×600
    scale: number;                 // 0.93 — fração do canvas que o body ocupa
  };
  groundLine: number; // fração (0.95 = 95% da altura)
  anchors: Record<GenderVariant, BodyFamilyAnchors>;
}
