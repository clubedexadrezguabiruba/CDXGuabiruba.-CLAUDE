"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { EquippedMap } from "@/types/inventory";
import type { AnchorProfile, PetAnchor, MotionProfile } from "@/lib/avatar/types";
import type { Easing } from "motion/react";
import type { ResolvedAvatar } from "@/lib/avatar/resolvedAvatar";
import { resolveAvatar } from "@/lib/avatar/resolvedAvatar";
import { Z_INDEX } from "@/lib/avatar/constants";
import { getFrameStyle, FRAME_BORDER_WIDTH } from "@/lib/avatar/frameStyles";
import { baseSkinPath } from "@/lib/avatar/fallbacks";

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
 * - character-root: motion.div com breathing global (body + head)
 * - pet: FORA do character-root (companion independente)
 * - frame: CSS decorativo (border + glow por rarity), fora do render stack
 */
export default function AvatarDisplay({ equipped, avatarBase = "male", size = "lg" }: AvatarDisplayProps) {
  const resolved = resolveAvatar(equipped, avatarBase, size);
  const { sizeConfig: cfg, animated, bodySrc, bodyScale, globalMotion, layers, headKnockout } = resolved;

  const ausentes = coletarAusentes(resolved);
  useReportarAusentes(ausentes);

  const bg = layers.background;
  const head = layers.head;
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
        // Marcação legível por teste e por monitoramento em QUALQUER ambiente.
        // O <img> some quando o arquivo não existe; este atributo não.
        data-avatar-missing={ausentes.length > 0 ? ausentes.map((a) => a.caminho).join(" ") : undefined}
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
        {/* Head é filho: herda o transform via CSS composition */}
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
          {/* Knockout mask: quando head equipado, recorta topo do body para esconder */}
          {/* cabelo/cabeça da base que vazaria atrás do head_swap */}
          <BodyImage
            src={bodySrc}
            fallbackSrc={baseSkinPath(avatarBase)}
            headKnockout={headKnockout}
          />

          {/* z:4 — Head (LOCAL tilt, aditivo ao global) */}
          {head?.src && (() => {
            const headAnchor = head.anchor as AnchorProfile;
            const headScale = headAnchor.scale ?? 1;
            return (
              <MotionAnchor
                anchor={headAnchor}
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
                  style={headScale !== 1 ? { transform: `scale(${headScale})` } : {}}
                />
              </MotionAnchor>
            );
          })()}
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

        {/* Marcador de asset ausente — só em desenvolvimento. */}
        {/* Em produção a criança não vê chrome de debug; o sinal fica no */}
        {/* console.error e no data-avatar-missing acima. */}
        {process.env.NODE_ENV !== "production" && ausentes.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 border-2 border-dashed border-fuchsia-500 bg-fuchsia-500/15"
            style={{ zIndex: Z_INDEX.frame + 1 }}
            title={`Asset ausente: ${ausentes.map((a) => a.caminho).join(", ")}`}
          />
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
// T0.3 — asset ausente falha ALTO
// ============================================================
// Antes: <img onError> escondia a camada e devolvia null. O item entrava no
// inventário, a criança equipava e o boneco não mudava — sem erro em lugar
// nenhum. Era o sintoma dos 45 itens invisíveis.
//
// A falha DURA continua sendo o gate (npm run verify:phase8), que roda no CI
// e impede o item de chegar em produção. Em runtime, o objetivo é ser
// impossível de não notar em desenvolvimento e auditável em produção — não
// derrubar a tela de uma criança por causa de um chapéu.

interface AssetAusente {
  slot: string;
  caminho: string;
}

function coletarAusentes(resolved: ResolvedAvatar): AssetAusente[] {
  const fora: AssetAusente[] = [];

  if (resolved.bodyMissingSrc) {
    fora.push({ slot: "outfit", caminho: resolved.bodyMissingSrc });
  }

  for (const camada of Object.values(resolved.layers)) {
    if (camada.status === "missing" && camada.missingSrc) {
      fora.push({ slot: camada.slot, caminho: camada.missingSrc });
    }
  }

  // Ordem estável para o atributo não oscilar entre renders.
  return fora.sort((a, b) => a.caminho.localeCompare(b.caminho));
}

/**
 * Reporta cada asset ausente uma vez por combinação, via efeito.
 *
 * Em efeito e não no corpo do render por causa do StrictMode do React 19:
 * o corpo roda duas vezes e duplicaria todo log.
 */
function useReportarAusentes(ausentes: AssetAusente[]) {
  const chave = ausentes.map((a) => `${a.slot}:${a.caminho}`).join("|");

  useEffect(() => {
    if (!chave) return;
    for (const par of chave.split("|")) {
      const [slot, caminho] = par.split(/:(.+)/);
      console.error(
        `[avatar] asset ausente no slot "${slot}": ${caminho} não está em public/items/. ` +
          `O item foi equipado e não aparece no boneco. ` +
          `Rode "npm run avatar:manifest" e "npm run verify:phase8" para localizar a origem.`,
      );
    }
  }, [chave]);
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
// BodyImage — body com fallback runtime para base skin
// Se bodySrc (dressed_base) retornar 404, cai para base skin.
// Knockout mask só aplica quando body carregou com sucesso.
// ============================================================
function BodyImage({
  src,
  fallbackSrc,
  headKnockout,
}: {
  src: string;
  fallbackSrc: string;
  headKnockout: { top: number; left: number; right: number } | null;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const activeSrc = useFallback ? fallbackSrc : src;

  // Knockout só aplica se body carregou (não fallback por 404)
  const applyKnockout = headKnockout != null && !useFallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activeSrc}
      alt="Avatar"
      className="absolute inset-0 h-full w-full object-contain"
      style={applyKnockout ? {
        clipPath: `inset(${(headKnockout.top * 100).toFixed(1)}% ${(headKnockout.right * 100).toFixed(1)}% 0 ${(headKnockout.left * 100).toFixed(1)}%)`,
      } : undefined}
      onError={() => {
        if (!useFallback) setUseFallback(true);
      }}
    />
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
