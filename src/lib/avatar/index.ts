/**
 * Avatar System — Public API
 *
 * Reexports organizados para facilitar imports nas próximas fases.
 * Uso: import { RECRUTA_V1, SIZE_CONFIG, GLOBAL_IDLE } from "@/lib/avatar";
 */

// Types
export type {
  AvatarSlot,
  GenderVariant,
  AvatarSize,
  BodyFamilyId,
  RenderMode,
  AnimationMode,
  AnchorProfile,
  PetAnchor,
  CanvasDimensions,
  SizeConfig,
  MotionProfile,
  SlotDefinition,
  BodyFamilyAnchors,
  BodyFamilyDefinition,
} from "./types";

// Constants
export {
  CANVAS_PRODUCTION,
  CANVAS_RUNTIME,
  BODY_PRODUCTION,
  BODY_RUNTIME,
  CANVAS_RATIO,
  GROUND_LINE,
  BODY_SCALE,
  SIZE_CONFIG,
  Z_INDEX,
  PET_APNG_BUDGET,
  HEAD_ASSET_SIZE,
  HAND_ASSET_SIZE,
  PET_ASSET_SIZE,
} from "./constants";

// Body Families
export { RECRUTA_V1, DEFAULT_BODY_FAMILY } from "./bodyFamilies";

// Render Modes
export { SLOT_RENDER_MODES } from "./renderModes";

// Animation Profiles
export {
  GLOBAL_IDLE,
  HAND_SWING,
  HEAD_TILT,
  isAnimated,
  ANIMATION_LIMITS,
} from "./animationProfiles";

// Slot Definitions
export { SLOT_DEFINITIONS, SLOT_DEFINITION_MAP } from "./slotDefinitions";

// Fallbacks
export { baseSkinPath, resolveBodySrc } from "./fallbacks";

// Asset Resolver
export { resolveAssetUrl } from "./assetResolver";

// Resolved Avatar
export type { SlotStatus, ResolvedLayer, ResolvedAvatar } from "./resolvedAvatar";
export { resolveAvatar } from "./resolvedAvatar";

// Template Guides
export type { PixelRect, TemplateRegions } from "./templateGuides";
export {
  TEMPLATE_REGIONS_MALE,
  TEMPLATE_REGIONS_FEMALE,
  getTemplateRegions,
} from "./templateGuides";

// Frame Styles
export type { FrameStyle } from "./frameStyles";
export { getFrameStyle, FRAME_BORDER_WIDTH } from "./frameStyles";

// Template Masks
export type { SlotMask } from "./templateMasks";
export { getSlotMask } from "./templateMasks";
