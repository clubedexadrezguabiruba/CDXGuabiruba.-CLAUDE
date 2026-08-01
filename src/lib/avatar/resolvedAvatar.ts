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
import { GLOBAL_IDLE, HEAD_TILT, isAnimated } from "./animationProfiles";
import { resolveAsset } from "./assetResolver";
import { baseSkinPath } from "./fallbacks";

// --- Resolved Types ---

/**
 * `missing` = há item equipado, mas o arquivo não está no manifesto.
 * Antes esse caso era indistinguível de `empty`, e era exatamente por isso
 * que 45 itens sumiam sem sintoma. Quem consome tem que tratá-lo alto.
 */
export type SlotStatus = "equipped" | "fallback" | "missing" | "empty";

export interface ResolvedLayer {
  slot: AvatarSlot;
  status: SlotStatus;
  renderMode: RenderMode;
  src: string | null;
  animatedSrc: string | null;
  /** Caminho que o item exigia quando `status === "missing"`. */
  missingSrc: string | null;
  zIndex: number;
  insideCharacterRoot: boolean;
  localAnimation: AnimationMode;
  motionProfile: MotionProfile | null;
  anchor: AnchorProfile | PetAnchor | null;
}

export interface ResolvedAvatar {
  /** Src do body layer (base skin ou dressed_base) */
  bodySrc: string;
  /**
   * Caminho do uniforme equipado que não existe em public/items/.
   * null quando não há uniforme ou quando o arquivo existe. Quem consome
   * reporta; o render já caiu para a base skin (nunca boneco pelado).
   */
  bodyMissingSrc: string | null;
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
  /**
   * Head knockout: clipPath inset para recortar cabeça/cabelo da base
   * quando head está equipado. Derivado da head anchor region.
   * Esconde cabelo que vazaria atrás do head_swap.
   * null quando head não está equipado (body aparece completo).
   */
  headKnockout: {
    top: number;   // fração do topo a recortar
    left: number;  // fração da esquerda a recortar
    right: number; // fração da direita a recortar
  } | null;
}

// --- Motion profile por slot ---

const SLOT_MOTION: Partial<Record<AvatarSlot, MotionProfile>> = {
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

  // Body: dressed_base se outfit equipado, senão base skin.
  // O manifesto decide: uniforme sem arquivo cai para a base em vez de
  // apontar para um 404 e deixar o BodyImage descobrir no onError.
  const outfitResolvido = resolveAsset(equipped.outfit?.image_url, gender, "dressed_base");
  const bodySrc = outfitResolvido.src ?? baseSkinPath(gender);
  const bodyMissingSrc = outfitResolvido.ausente ? outfitResolvido.candidato : null;

  // Resolver cada slot
  const layers: Partial<Record<AvatarSlot, ResolvedLayer>> = {};

  const slotsToResolve: AvatarSlot[] = ["background", "head", "pet", "frame"];

  for (const slot of slotsToResolve) {
    const def = SLOT_DEFINITION_MAP[slot];
    if (!def) continue;

    const item: EquippedItem | undefined = equipped[slot];

    const estatico = resolveAsset(item?.image_url, gender, def.renderMode, false);

    // Frame não tem arquivo no render stack: é CSS por raridade.
    // Sem esta exceção ele seria reportado como ausente em todo render.
    const ehFrame = def.renderMode === "frame_ui";
    const ausente = !ehFrame && estatico.ausente;

    const status: SlotStatus = !item ? "empty" : ausente ? "missing" : "equipped";
    const src = ehFrame ? estatico.candidato : estatico.src;

    // Variante animada é opcional: sem o APNG o pet ainda aparece estático.
    const animado = item && def.hasAnimatedVariant
      ? resolveAsset(item.image_url, gender, def.renderMode, true)
      : null;
    const animatedSrc = animado?.src ?? null;

    // Anchor: head tem AnchorProfile, pet tem PetAnchor
    let anchor: AnchorProfile | PetAnchor | null = null;
    if (slot === "head") anchor = anchors.head;
    else if (slot === "pet") anchor = anchors.pet;

    layers[slot] = {
      slot,
      status,
      renderMode: def.renderMode,
      src,
      animatedSrc,
      missingSrc: ausente ? estatico.candidato : null,
      zIndex: def.zIndex,
      insideCharacterRoot: def.insideCharacterRoot,
      localAnimation: def.localAnimation,
      motionProfile: SLOT_MOTION[slot] ?? null,
      anchor,
    };
  }

  // Head knockout mask: quando head equipado, recorta cabelo/cabeça da base.
  // Vertical: derivado da head anchor region × factorY (validado visualmente).
  // Lateral: inset fixo pequeno (5%) — suficiente para cobrir cabelo espetado.
  const KNOCKOUT_BY_GENDER = {
    male:   { factorY: 0.71, side: 0.05 },
    female: { factorY: 0.66, side: 0.05 },
  } as const;
  //
  // Condição corrigida: knockout só quando o chapéu REALMENTE renderiza.
  // Antes bastava `equipped.head` existir. Como 7 dos 8 itens de head não têm
  // as variantes -swap-*, equipar um deles recortava o topo da base e não
  // desenhava nada por cima — o boneco ficava decapitado, não "sem mudança".
  let headKnockout: ResolvedAvatar["headKnockout"] = null;
  if (layers.head?.status === "equipped" && layers.head.src) {
    const { factorY, side } = KNOCKOUT_BY_GENDER[gender];
    const headAnchor = anchors.head;
    const canvasH = sizeConfig.h;
    const rootH = canvasH * bodyFamily.body.scale;
    const rootOffsetTop = canvasH * (1 - bodyFamily.body.scale);

    // Vertical: corta do topo até factorY% da head region
    const knockoutCanvasY = canvasH * (headAnchor.top + headAnchor.height * factorY);
    const knockoutTop = Math.max(0, (knockoutCanvasY - rootOffsetTop) / rootH);

    headKnockout = { top: knockoutTop, left: side, right: side };
  }

  return {
    bodySrc,
    bodyMissingSrc,
    gender,
    size,
    sizeConfig,
    animated,
    globalMotion: GLOBAL_IDLE,
    bodyScale: bodyFamily.body.scale,
    layers,
    headKnockout,
  };
}
