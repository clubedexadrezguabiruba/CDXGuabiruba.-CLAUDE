"use client";

import { useState } from "react";
import { useAchievements, type Achievement } from "@/hooks/useAchievements";

const CATEGORY_LABELS: Record<string, string> = {
  bots: "Bots",
  puzzles: "Puzzles",
  lessons: "Aulas",
  progression: "Progressão",
  streak: "Sequência",
  general: "Geral",
};

const CATEGORY_ORDER = ["bots", "puzzles", "lessons", "progression", "streak", "general"];

function AchievementCard({ ach }: { ach: Achievement }) {
  const pct = Math.min(
    100,
    Math.round((ach.progress / ach.condition_value) * 100)
  );

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
        ach.unlocked
          ? "border-amber-200 bg-amber-50 shadow-sm"
          : "border-zinc-200 bg-white opacity-70"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          ach.unlocked
            ? "bg-amber-200 text-amber-800"
            : "bg-zinc-100 text-zinc-400"
        }`}
      >
        {ach.unlocked ? "\u2B50" : "\uD83D\uDD12"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium leading-tight">
            {ach.title}
          </span>
          {ach.reward_xp > 0 && (
            <span className="shrink-0 text-xs font-semibold text-amber-600">
              +{ach.reward_xp} XP
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{ach.description}</p>
        {!ach.unlocked && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-zinc-400">
              {ach.progress}/{ach.condition_value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementPanel() {
  const { achievements, loading, error } = useAchievements();
  const [showLocked, setShowLocked] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Insígnias</h2>
        <div className="flex items-center justify-center py-6 text-sm text-zinc-400">
          Carregando conquistas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Insígnias</h2>
        <p className="text-sm text-red-600">Erro: {error}</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.length - unlockedCount;

  // Separate unlocked and locked
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  // Group unlocked by category
  const groupedUnlocked = new Map<string, Achievement[]>();
  for (const ach of unlocked) {
    const cat = ach.category || "general";
    if (!groupedUnlocked.has(cat)) groupedUnlocked.set(cat, []);
    groupedUnlocked.get(cat)!.push(ach);
  }

  // Group locked by category
  const groupedLocked = new Map<string, Achievement[]>();
  for (const ach of locked) {
    const cat = ach.category || "general";
    if (!groupedLocked.has(cat)) groupedLocked.set(cat, []);
    groupedLocked.get(cat)!.push(ach);
  }

  const unlockedCategories = CATEGORY_ORDER.filter((c) => groupedUnlocked.has(c));
  for (const cat of groupedUnlocked.keys()) {
    if (!unlockedCategories.includes(cat)) unlockedCategories.push(cat);
  }

  const lockedCategories = CATEGORY_ORDER.filter((c) => groupedLocked.has(c));
  for (const cat of groupedLocked.keys()) {
    if (!lockedCategories.includes(cat)) lockedCategories.push(cat);
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Insígnias</h2>
        <span className="text-sm font-medium text-zinc-500">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {/* Unlocked achievements — always visible */}
      {unlockedCategories.length > 0 ? (
        <div className="space-y-4">
          {unlockedCategories.map((cat) => {
            const items = groupedUnlocked.get(cat) ?? [];
            return (
              <div key={cat}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h3>
                <div className="space-y-2">
                  {items.map((ach) => (
                    <AchievementCard key={ach.id} ach={ach} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-zinc-400">
          Nenhuma insígnia desbloqueada ainda.
        </p>
      )}

      {/* Locked achievements — collapsed by default */}
      {lockedCount > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowLocked(!showLocked)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
          >
            {showLocked ? "Ocultar" : "Mostrar"} bloqueadas ({lockedCount})
            <span className="text-xs">{showLocked ? "▲" : "▼"}</span>
          </button>

          {showLocked && (
            <div className="mt-3 space-y-4">
              {lockedCategories.map((cat) => {
                const items = groupedLocked.get(cat) ?? [];
                return (
                  <div key={cat}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </h3>
                    <div className="space-y-2">
                      {items.map((ach) => (
                        <AchievementCard key={ach.id} ach={ach} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
