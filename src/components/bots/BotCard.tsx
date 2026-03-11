"use client";

import type { Bot, BotStatus } from "@/types/bot";
import BotAvatar from "./BotAvatar";

interface BotCardProps {
  bot: Bot;
  status: BotStatus;
  prevBotName?: string;
  onClick: () => void;
}

export default function BotCard({ bot, status, prevBotName, onClick }: BotCardProps) {
  const isLocked = status === "locked";
  const isDefeated = status === "defeated";

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
        isLocked
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-50"
          : isDefeated
            ? "border-yellow-300 bg-linear-to-b from-yellow-50 to-white hover:border-yellow-400 hover:shadow-md"
            : "border-zinc-300 bg-white hover:border-green-400 hover:shadow-lg"
      }`}
    >
      {/* Defeated gold star badge */}
      {isDefeated && (
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs text-white shadow">
          \u2605
        </div>
      )}

      {/* Avatar circle */}
      <div className="transition-transform duration-150 group-hover:scale-[1.02]">
        <BotAvatar bot={bot} size="md" locked={isLocked} />
      </div>

      {/* Name + epithet */}
      <div className="text-sm font-bold text-zinc-800">{bot.name}</div>
      {!isLocked && bot.epithet && (
        <div className="line-clamp-1 text-xs italic text-zinc-500">{bot.epithet}</div>
      )}

      {/* ELO pill */}
      <div className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
        ELO {bot.elo}
      </div>

      {/* Locked text */}
      {isLocked && (
        <div className="line-clamp-1 text-xs text-zinc-400">
          {prevBotName ? `Derrote ${prevBotName} primeiro` : "Derrote o anterior"}
        </div>
      )}
    </button>
  );
}
