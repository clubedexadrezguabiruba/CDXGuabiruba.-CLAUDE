"use client";

import { useEffect, useState } from "react";
import type { Bot, PlayerColor, TimeControl } from "@/types/bot";
import { TIME_CONTROLS } from "@/types/bot";
import { getRandomPhrase } from "@/lib/chess/botGameLogic";
import BotSpeechBubble from "./BotSpeechBubble";
import BotAvatar from "./BotAvatar";

interface BotPreGameProps {
  bot: Bot;
  selectedColor: "white" | "black" | "random";
  onColorChange: (color: "white" | "black" | "random") => void;
  selectedTC: number;
  onTCChange: (index: number) => void;
  onStart: (color: PlayerColor, timeControl: TimeControl) => void;
}

export default function BotPreGame({
  bot,
  selectedColor,
  onColorChange,
  selectedTC,
  onTCChange,
  onStart,
}: BotPreGameProps) {
  const [phrase, setPhrase] = useState<string | null>(null);

  useEffect(() => {
    setPhrase(getRandomPhrase(bot, "pre_game"));
  }, [bot]);

  const handleStart = () => {
    const color: PlayerColor =
      selectedColor === "random"
        ? Math.random() < 0.5 ? "white" : "black"
        : selectedColor;
    onStart(color, TIME_CONTROLS[selectedTC].value);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Bot avatar */}
      <BotAvatar bot={bot} size="lg" />

      {/* Name + epithet + ELO */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-900">{bot.name}</h2>
        {bot.epithet && (
          <p className="text-sm italic text-zinc-500">{bot.epithet}</p>
        )}
        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-3 py-0.5 text-sm font-medium text-zinc-500">
          ELO {bot.elo}
        </span>
      </div>

      {/* Speech bubble */}
      <BotSpeechBubble message={phrase} dismissMs={30000} />

      {/* Personality */}
      <p className="text-center text-xs italic text-zinc-400">{bot.personality}</p>

      {/* Divider */}
      <div className="h-px w-full bg-zinc-200" />

      {/* Color selection */}
      <div className="w-full">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Escolha seu lado
        </p>
        <div className="flex justify-center gap-2">
          {(
            [
              { value: "white" as const, label: "\u2654 Brancas" },
              { value: "black" as const, label: "\u265A Pretas" },
              { value: "random" as const, label: "\uD83C\uDFB2 Aleat." },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onColorChange(value)}
              className={`rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                selectedColor === value
                  ? "border-zinc-800 bg-zinc-800 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time control */}
      <div className="w-full">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Tempo
        </p>
        <div className="flex justify-center gap-2">
          {TIME_CONTROLS.map((tc, i) => (
            <button
              key={tc.label}
              onClick={() => onTCChange(i)}
              className={`rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                selectedTC === i
                  ? "border-zinc-800 bg-zinc-800 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={handleStart}
        className="mt-2 w-full rounded-2xl bg-green-600 py-3.5 text-lg font-bold text-white shadow-lg transition-colors duration-150 hover:bg-green-500 active:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Iniciar Duelo
      </button>
    </div>
  );
}
