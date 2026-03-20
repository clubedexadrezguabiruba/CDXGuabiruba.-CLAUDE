"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { EquippedMap } from "@/types/inventory";
import type { AnchorProfile, PetAnchor, MotionProfile } from "@/lib/avatar/types";
import type { Easing } from "motion/react";
import { resolveAvatar } from "@/lib/avatar/resolvedAvatar";
import { Z_INDEX } from "@/lib/avatar/constants";
import { getFrameStyle, FRAME_BORDER_WIDTH } from "@/lib/avatar/frameStyles";

// Backward-compatible re-export — call sites importam AvatarBase daqui
export type AvatarBase = "male" | "female";

interface AvatarDisplayProps {
  equipped: EquippedMap;
  avatarBase?: AvatarBase;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Avatar vestível com character-root motion group.
 *
 * Arquitetura (doc 03):
 * - background: FORA do character-root (cenário estático)
 * - character-root: motion.div com breathing global (body + head + hand)
 * - pet: FORA do character-root (companion independente)
 * - frame: CSS decorativo (border + glow por rarity), fora do render stack
 */
export default function AvatarDisplay({ equipped, avatarBase = "male", size = "lg" }: AvatarDisplayProps) {
  const resolved = resolveAvatar(equipped, avatarBase, size);
  const { sizeConfig: cfg, animated, bodySrc, bodyScale, globalMotion, layers } = resolved;

  const bg = layers.background;
  const head = layers.head;
  const hand = layers.hand;
  const pet = layers.pet;

  // Frame: CSS decorativo por rarity (border + glow)
  const frameItem = equipped.frame;
  const frameStyle = frameItem ? getFrameStyle(frameItem.rarity) : null;
  const frameBorderWidth = FRAME_BORDER_WIDTH[size];

  return (
    <div className="flex items-end gap-2">
      {/* Avatar container */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl shadow-sm ${
          !bg?.src ? "bg-linear-to-b from-zinc-100 to-zinc-200" : ""
        }`}
        style={{ width: cfg.w, height: cfg.h }}
      >
        {/* z:0 — Background (FORA do character-root) */}
        {bg?.src && (
          <AvatarLayer
            src={bg.src}
            alt="Background"
            className="absolute inset-0 z-0 rounded-xl"
            style={{ width: cfg.w, height: cfg.h }}
          />
        )}

        {/* CHARACTER ROOT — motion.div com breathing global */}
        {/* Head e hand são filhos: herdam o transform via CSS composition */}
        <motion.div
          className="absolute bottom-0 z-1"
          style={{
            width: cfg.w * bodyScale,
            height: cfg.h * bodyScale,
            left: (cfg.w - cfg.w * bodyScale) / 2,
            transformOrigin: globalMotion.origin,
          }}
          {...(animated ? {
            animate: globalMotion.animate,
            transition: {
              duration: globalMotion.duration,
              repeat: Infinity,
              ease: globalMotion.ease as Easing,
            },
          } : {})}
        >
          {/* z:1 — Body (base skin ou dressed_base) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bodySrc}
            alt="Avatar"
            className="absolute inset-0 h-full w-full object-contain"
          />

          {/* z:3 — Hand (LOCAL swing, aditivo ao global) */}
          {hand?.src && (
            <MotionAnchor
              anchor={hand.anchor as AnchorProfile}
              motionProfile={hand.motionProfile}
              animated={animated}
              zIndex={Z_INDEX.hand}
              canvasW={cfg.w}
              canvasH={cfg.h}
              rootOffsetTop={cfg.h * (1 - bodyScale)}
              rootOffsetLeft={(cfg.w - cfg.w * bodyScale) / 2}
            >
              <AvatarLayer
                src={hand.src}
                alt="Hand"
                className="h-full w-full"
                style={{}}
              />
            </MotionAnchor>
          )}

          {/* z:4 — Head (LOCAL tilt, aditivo ao global) */}
          {head?.src && (
            <MotionAnchor
              anchor={head.anchor as AnchorProfile}
              motionProfile={head.motionProfile}
              animated={animated}
              zIndex={Z_INDEX.head}
              canvasW={cfg.w}
              canvasH={cfg.h}
              rootOffsetTop={cfg.h * (1 - bodyScale)}
              rootOffsetLeft={(cfg.w - cfg.w * bodyScale) / 2}
            >
              <AvatarLayer
                src={head.src}
                alt="Head"
                className="h-full w-full"
                style={{}}
              />
            </MotionAnchor>
          )}
        </motion.div>

        {/* z:5 — Pet (FORA do character-root, companion independente) */}
        {pet?.src && (
          <div
            className="absolute z-5"
            style={{
              bottom: `${cfg.h * (pet.anchor as PetAnchor).bottom}px`,
              right: `${-cfg.w * Math.abs((pet.anchor as PetAnchor).right)}px`,
              width: cfg.petSize * (pet.anchor as PetAnchor).sizeMultiplier,
              height: cfg.petSize * (pet.anchor as PetAnchor).sizeMultiplier,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={animated && pet.animatedSrc ? pet.animatedSrc : pet.src}
              alt="Pet"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {/* z:10 — Frame (CSS decorativo, FORA do render stack) */}
        {frameStyle && (
          <div
            className={`absolute inset-0 rounded-xl border-solid pointer-events-none ${frameStyle.borderClass} ${frameStyle.glowClass}`}
            style={{ borderWidth: frameBorderWidth, zIndex: Z_INDEX.frame }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// MotionAnchor — posiciona um slot via AnchorProfile + animação local
// ============================================================
function MotionAnchor({
  anchor,
  motionProfile,
  animated,
  zIndex,
  canvasW,
  canvasH,
  rootOffsetTop,
  rootOffsetLeft,
  children,
}: {
  anchor: AnchorProfile;
  motionProfile: MotionProfile | null;
  animated: boolean;
  zIndex: number;
  canvasW: number;
  canvasH: number;
  rootOffsetTop: number;
  rootOffsetLeft: number;
  children: React.ReactNode;
}) {
  // Anchors são frações do canvas (400×560), mas este div está dentro do
  // character-root (93% do canvas, bottom-anchored). Converter canvas→root:
  const top = canvasH * anchor.top - rootOffsetTop;
  const left = canvasW * anchor.left - rootOffsetLeft;
  const width = canvasW * anchor.width;
  const height = canvasH * anchor.height;

  return (
    <motion.div
      className="absolute"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width,
        height,
        transformOrigin: anchor.origin,
        zIndex,
      }}
      {...(animated && motionProfile ? {
        animate: motionProfile.animate,
        transition: {
          duration: motionProfile.duration,
          repeat: Infinity,
          ease: motionProfile.ease as Easing,
        },
      } : {})}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// AvatarLayer — img wrapper com fallback de erro
// ============================================================
function AvatarLayer({
  src,
  alt,
  className,
  style,
}: {
  src: string | null;
  alt: string;
  className: string;
  style: React.CSSProperties;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}
