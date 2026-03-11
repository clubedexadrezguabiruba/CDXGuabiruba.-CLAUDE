"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Bot, BotStatus } from "@/types/bot";
import BotCard from "./BotCard";

const STAGE_ORDER = [
  "Acampamento dos Recrutas",
  "Vila dos Soldados",
  "Fortaleza dos Estrategistas",
  "Cidade dos Generais",
  "Cidadela dos Mestres",
];

const STAGE_STARS: Record<string, number> = {
  "Acampamento dos Recrutas": 1,
  "Vila dos Soldados": 2,
  "Fortaleza dos Estrategistas": 3,
  "Cidade dos Generais": 4,
  "Cidadela dos Mestres": 5,
};

interface BotGridProps {
  bots: Bot[];
  statusMap: Record<number, BotStatus>;
}

export default function BotGrid({ bots, statusMap }: BotGridProps) {
  const router = useRouter();

  const stages = useMemo(() => {
    const grouped = new Map<string, Bot[]>();
    for (const bot of bots) {
      const stage = bot.stage || "Acampamento dos Recrutas";
      if (!grouped.has(stage)) grouped.set(stage, []);
      grouped.get(stage)!.push(bot);
    }

    return STAGE_ORDER
      .filter((s) => grouped.has(s))
      .map((s) => ({ name: s, stars: STAGE_STARS[s] || 1, bots: grouped.get(s)! }));
  }, [bots]);

  // Map bot id → name of the previous bot (by unlock_order)
  const prevBotNameMap = useMemo(() => {
    const sorted = [...bots].sort((a, b) => a.unlock_order - b.unlock_order);
    const map: Record<number, string> = {};
    for (let i = 1; i < sorted.length; i++) {
      map[sorted[i].id] = sorted[i - 1].name;
    }
    return map;
  }, [bots]);

  return (
    <div className="space-y-8">
      {stages.map((stage) => (
        <div key={stage.name}>
          {/* Stage header */}
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-700">{stage.name}</h2>
            <div className="flex gap-0.5 text-yellow-500">
              {Array.from({ length: stage.stars }, (_, i) => (
                <span key={i} className="text-sm">{"\u2605"}</span>
              ))}
            </div>
          </div>

          {/* Bot cards grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stage.bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                status={statusMap[bot.id] || "locked"}
                prevBotName={prevBotNameMap[bot.id]}
                onClick={() => router.push(`/bots/${bot.id}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
