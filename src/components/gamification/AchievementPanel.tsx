"use client";

import Card, { CardTitle } from "@/components/ui/Card";

import { useState } from "react";
import { useAchievements, type Achievement } from "@/hooks/useAchievements";

const CATEGORY_LABELS: Record<string, string> = {
  bots: "Bots",
  puzzles: "Desafios",
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
          ? "border-gold/40 bg-gold/10 shadow-sm"
          : "border-ink/10 bg-white opacity-70"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          ach.unlocked
            ? "bg-gold/40 text-ink/80"
            : "bg-ink/6 text-ink/45"
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
            <span className="shrink-0 text-xs font-semibold text-gold">
              +{ach.reward_xp} XP
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink/55">{ach.description}</p>
        {!ach.unlocked && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-gold transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-ink/45">
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
      <Card>
        <CardTitle>Conquistas</CardTitle>
        <div className="flex items-center justify-center py-6 text-sm text-ink/45">
          Carregando conquistas...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle>Conquistas</CardTitle>
        <p className="text-sm text-erro">Erro: {error}</p>
      </Card>
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
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle className="mb-0">Conquistas</CardTitle>
        <span className="text-sm font-medium text-ink/55">
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
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
        /*
          O estado vazio é onde o Arquivo se apresenta: ele é o lugar do mapa
          que guarda "o que ainda não foi mostrado", e a estante de troféus é a
          primeira mecânica que lhe dá função (D10). Aqui a frase trabalha
          dobrado — nomeia o lugar e diz o que fazer para preencher a estante.
        */
        <p className="py-4 text-center text-sm text-ink/45">
          Sua estante no Arquivo ainda está vazia. Jogue, estude e volte para vê-la crescer.
        </p>
      )}

      {/* Locked achievements — collapsed by default */}
      {lockedCount > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowLocked(!showLocked)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink/15 py-2 text-sm font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink/80"
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
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
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
    </Card>
  );
}
