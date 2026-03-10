"use client";

import { useState } from "react";
import Image from "next/image";
import type { Bot } from "@/types/bot";

const SIZE_MAP = {
  xs: { container: "h-8 w-8", text: "text-lg", px: 32 },
  sm: { container: "h-12 w-12", text: "text-2xl", px: 48 },
  md: { container: "h-16 w-16", text: "text-3xl", px: 64 },
  lg: { container: "h-20 w-20", text: "text-4xl", px: 80 },
  xl: { container: "h-24 w-24", text: "text-5xl", px: 96 },
} as const;

interface BotAvatarProps {
  bot: Bot;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  locked?: boolean;
}

export default function BotAvatar({ bot, size, locked }: BotAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { container, text, px } = SIZE_MAP[size];
  const emoji = bot.emoji || "♟";

  const baseClasses = `flex items-center justify-center rounded-full ${container}`;

  if (locked) {
    return (
      <div className={`${baseClasses} bg-zinc-200 ${text}`}>🔒</div>
    );
  }

  if (imageError) {
    return (
      <div
        className={`${baseClasses} ${size === "lg" || size === "xl" ? "bg-linear-to-br from-zinc-100 to-zinc-200 shadow-lg" : "bg-zinc-100 shadow-inner"} ${text}`}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} overflow-hidden ${size === "lg" || size === "xl" ? "bg-linear-to-br from-zinc-100 to-zinc-200 shadow-lg" : "bg-zinc-100 shadow-inner"}`}>
      <Image
        src={`/bots/${bot.slug}.png`}
        alt={bot.name}
        width={px}
        height={px}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
