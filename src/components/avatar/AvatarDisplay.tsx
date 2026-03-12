"use client";

import { useState } from "react";
import type { EquippedMap } from "@/types/inventory";
import { RARITY_STYLES } from "@/lib/constants/items";

interface AvatarDisplayProps {
  equipped: EquippedMap;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { w: 56, h: 78, petSize: 24 },
  md: { w: 100, h: 140, petSize: 40 },
  lg: { w: 200, h: 280, petSize: 80 },
} as const;

/**
 * Avatar vestível com camadas sobrepostas por slot.
 * Renderiza background (z:0) → base (z:1) → outfit (z:2) → hand (z:3) → head (z:4) → frame (z:5).
 * Pet é renderizado fora do container principal, ao lado.
 */
export default function AvatarDisplay({ equipped, size = "lg" }: AvatarDisplayProps) {
  const cfg = SIZE_CONFIG[size];
  const frameStyle = equipped.frame ? RARITY_STYLES[equipped.frame.rarity] : null;

  return (
    <div className="flex items-end gap-2">
      {/* Avatar container */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl shadow-sm ${
          !equipped.background ? "bg-linear-to-b from-zinc-100 to-zinc-200" : ""
        }`}
        style={{ width: cfg.w, height: cfg.h }}
      >
        {/* z:0 — Background */}
        {equipped.background && (
          <AvatarLayer
            src={equipped.background.image_url}
            alt={equipped.background.name}
            className="absolute inset-0 z-0 rounded-xl"
            style={{ width: cfg.w, height: cfg.h }}
          />
        )}

        {/* z:1 — Avatar base (sempre visível) */}
        <div className="absolute inset-0 z-1 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/base/avatar-base.png"
            alt="Avatar"
            className="h-full w-full object-contain"
            style={{ width: cfg.w, height: cfg.h }}
          />
        </div>

        {/* z:2 — Outfit */}
        {equipped.outfit && (
          <AvatarLayer
            src={equipped.outfit.image_url}
            alt={equipped.outfit.name}
            className="absolute z-2"
            style={{
              top: `${cfg.h * 0.35}px`,
              left: `${cfg.w * 0.15}px`,
              width: cfg.w * 0.7,
              height: cfg.h * 0.57,
            }}
          />
        )}

        {/* z:3 — Hand */}
        {equipped.hand && (
          <AvatarLayer
            src={equipped.hand.image_url}
            alt={equipped.hand.name}
            className="absolute z-3"
            style={{
              top: `${cfg.h * 0.45}px`,
              right: `${cfg.w * 0.02}px`,
              width: cfg.w * 0.3,
              height: cfg.h * 0.28,
            }}
          />
        )}

        {/* z:4 — Head */}
        {equipped.head && (
          <AvatarLayer
            src={equipped.head.image_url}
            alt={equipped.head.name}
            className="absolute z-4"
            style={{
              top: 0,
              left: `${cfg.w * 0.25}px`,
              width: cfg.w * 0.5,
              height: cfg.h * 0.22,
            }}
          />
        )}

        {/* z:5 — Frame */}
        {equipped.frame && (
          <div
            className={`pointer-events-none absolute z-5 ${frameStyle?.glow ?? ""}`}
            style={{
              top: `${-cfg.h * 0.036}px`,
              left: `${-cfg.w * 0.05}px`,
              width: cfg.w * 1.1,
              height: cfg.h * 1.07,
            }}
          >
            <AvatarLayer
              src={equipped.frame.image_url}
              alt={equipped.frame.name}
              className="h-full w-full"
              style={{}}
            />
          </div>
        )}
      </div>

      {/* Pet — fora do container, ao lado */}
      {equipped.pet && (
        <div className="shrink-0" style={{ width: cfg.petSize, height: cfg.petSize }}>
          <AvatarLayer
            src={equipped.pet.image_url}
            alt={equipped.pet.name}
            className="h-full w-full"
            style={{}}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente interno para camadas com fallback
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
