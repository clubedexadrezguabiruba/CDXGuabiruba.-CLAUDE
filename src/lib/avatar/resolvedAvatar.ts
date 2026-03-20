/**
 * Avatar System — Resolved Avatar
 *
 * Tipos e função principal que resolvem um EquippedMap + contexto
 * em uma estrutura pronta para o render consumir. A Fase 4 (render rewrite)
 * usará este resultado diretamente em vez de fazer lógica inline.
 */

import type { EquippedMap, EquippedItem } from "@/types/inventory";
import type {
  AvatarSlot,
  AvatarSize,
  GenderVariant,
  RenderMode,
  AnimationMode,
  AnchorProfile,
  PetAnchor,
  MotionProfile,
  BodyFamilyDefinition,
  SizeConfig,
} from "./types";
import { SIZE_CONFIG } from "./constants";
import { SLOT_DEFINITION_MAP } from "./slotDefinitions";
import { DEFAULT_BODY_FAMILY } from "./bodyFamilies";
import { GLOBAL_IDLE, HAND_SWING, HEAD_TILT, isAnimated } from "./animationProfiles";
import { resolveAssetUrl } from "./assetResolver";
import { baseSkinPath } from "./fallbacks";

// --- Resolved Types ---

export type SlotStatus = "equipped" | "fallback" | "empty";

export interface ResolvedLayer {
  slot: AvatarSlot;
  status: SlotStatus;
  renderMode: RenderMode;
  src: string | null;
  animatedSrc: string | null;
  zIndex: number;
  insideCharacterRoot: boolean;
  localAnimation: AnimationMode;
  motionProfile: MotionProfile | null;
  anchor: AnchorProfile | PetAnchor | null;
}

export interface ResolvedAvatar {
  /** Src do body layer (base skin ou dressed_base) */
  bodySrc: string;
  /** Gender variant em uso */
  gender: GenderVariant;
  /** Avatar size */
  size: AvatarSize;
  /** Size config em pixels */
  sizeConfig: SizeConfig;
  /** Se animações devem ser ativadas (lg/xl) */
  animated: boolean;
  /** Global motion profile (character-root) */
  globalMotion: MotionProfile;
  /** Body scale (fração do canvas) */
  bodyScale: number;
  /** Layers resolvidos por slot */
  layers: Partial<Record<AvatarSlot, ResolvedLayer>>;
}

// --- Motion profile por slot ---

const SLOT_MOTION: Partial<Record<AvatarSlot, MotionProfile>> = {
  // hand: sem motion local — forearm_prop herda apenas global (braço relaxado)
  head: HEAD_TILT,
};

// --- Resolver principal ---

/**
 * Resolve um EquippedMap + contexto em um ResolvedAvatar pronto para render.
 *
 * Absorve toda a lógica de:
 * - URL swaps por gênero (head, outfit)
 * - Variante animada (pet)
 * - Anchor profiles por gênero
 * - Motion profiles por slot
 * - Fallback de body (base skin quando sem outfit)
 *
 * Funções pura: sem side effects, sem state, sem DOM.
 */
export function resolveAvatar(
  equipped: EquippedMap,
  gender: GenderVariant,
  size: AvatarSize,
  bodyFamily: BodyFamilyDefinition = DEFAULT_BODY_FAMILY,
): ResolvedAvatar {
  const animated = isAnimated(size);
  const sizeConfig = SIZE_CONFIG[size];
  const anchors = bodyFamily.anchors[gender];

  // Body: dressed_base se outfit equipado, senão base skin
  const bodySrc = equipped.outfit?.image_url
    ? resolveAssetUrl(equipped.outfit.image_url, gender, "dressed_base") ?? baseSkinPath(gender)
    : baseSkinPath(gender);

  // Resolver cada slot
  const layers: Partial<Record<AvatarSlot, ResolvedLayer>> = {};

  const slotsToResolve: AvatarSlot[] = ["background", "head", "hand", "pet", "frame"];

  for (const slot of slotsToResolve) {
    const def = SLOT_DEFINITION_MAP[slot];
    if (!def) continue;

    const item: EquippedItem | undefined = equipped[slot];
    const status: SlotStatus = item ? "equipped" : "empty";

    const src = item
      ? resolveAssetUrl(item.image_url, gender, def.renderMode, false)
      : null;

    const animatedSrc = item && def.hasAnimatedVariant
      ? resolveAssetUrl(item.image_url, gender, def.renderMode, true)
      : null;

    // Anchor: head e hand têm AnchorProfile, pet tem PetAnchor
    let anchor: AnchorProfile | PetAnchor | null = null;
    if (slot === "head") anchor = anchors.head;
    else if (slot === "hand") anchor = anchors.hand;
    else if (slot === "pet") anchor = anchors.pet;

    layers[slot] = {
      slot,
      status,
      renderMode: def.renderMode,
      src,
      animatedSrc,
      zIndex: def.zIndex,
      insideCharacterRoot: def.insideCharacterRoot,
      localAnimation: def.localAnimation,
      motionProfile: SLOT_MOTION[slot] ?? null,
      anchor,
    };
  }

  return {
    bodySrc,
    gender,
    size,
    sizeConfig,
    animated,
    globalMotion: GLOBAL_IDLE,
    bodyScale: bodyFamily.body.scale,
    layers,
  };
}
