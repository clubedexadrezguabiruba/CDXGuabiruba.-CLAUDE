/**
 * Avatar System — Slot Definitions
 *
 * Configuração canônica de cada slot: render mode, z-index,
 * variantes de gênero, pertencimento ao character-root, animação local.
 * Unifica informações dos docs 01, 03 e 04.
 */

import type { SlotDefinition } from "./types";
import { Z_INDEX } from "./constants";

export const SLOT_DEFINITIONS: SlotDefinition[] = [
  {
    slot: "background",
    renderMode: "underlay",
    zIndex: Z_INDEX.background,
    requiresGenderVariant: false,
    insideCharacterRoot: false,
    localAnimation: "none",
    hasAnimatedVariant: false,
  },
  {
    slot: "outfit",
    renderMode: "dressed_base",
    zIndex: Z_INDEX.body, // dressed_base substitui body na mesma posição
    requiresGenderVariant: true,
    insideCharacterRoot: true,
    localAnimation: "none", // herda global do character-root
    hasAnimatedVariant: false,
  },
  {
    slot: "hand",
    renderMode: "overlay",
    zIndex: Z_INDEX.hand,
    requiresGenderVariant: false,
    insideCharacterRoot: true,
    localAnimation: "local",
    hasAnimatedVariant: false,
  },
  {
    slot: "head",
    renderMode: "head_swap",
    zIndex: Z_INDEX.head,
    requiresGenderVariant: true,
    insideCharacterRoot: true,
    localAnimation: "local",
    hasAnimatedVariant: false,
  },
  {
    slot: "pet",
    renderMode: "companion",
    zIndex: Z_INDEX.pet,
    requiresGenderVariant: false,
    insideCharacterRoot: false,
    localAnimation: "baked",
    hasAnimatedVariant: true, // {slug}-animated.png
  },
  {
    slot: "frame",
    renderMode: "frame_ui",
    zIndex: Z_INDEX.frame,
    requiresGenderVariant: false,
    insideCharacterRoot: false,
    localAnimation: "none",
    hasAnimatedVariant: false,
  },
];

/** Lookup rápido por slot */
export const SLOT_DEFINITION_MAP = Object.fromEntries(
  SLOT_DEFINITIONS.map((def) => [def.slot, def])
) as Record<string, SlotDefinition>;
