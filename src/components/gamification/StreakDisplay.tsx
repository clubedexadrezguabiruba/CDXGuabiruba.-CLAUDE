"use client";

import type { StreakData } from "@/hooks/useMissions";

const MILESTONES = [7, 14, 30, 60, 100];

function getNextMilestone(current: number): number | null {
  for (const m of MILESTONES) {
    if (current < m) return m;
  }
  return null;
}

/**
 * Calcula o streak efetivo para exibição.
 * Se last_active_date é hoje ou ontem → mostra current_streak.
 * Se last_active_date é anterior a ontem (ou null) → mostra 0.
 * Isso evita mostrar streak "fantasma" quando o aluno ficou dias sem jogar.
 */
function getEffectiveStreak(streak: StreakData): number {
  if (!streak.lastActiveDate || streak.current === 0) return 0;

  // Calcula "hoje" em Brasília no client (aproximação boa o suficiente para display)
  const now = new Date();
  // Brasília = UTC-3
  const brasiliaOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const diff = (brasiliaOffset - localOffset) * 60000;
  const brasilia = new Date(now.getTime() + diff);
  const todayStr = brasilia.toISOString().slice(0, 10);

  const yesterday = new Date(brasilia);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const lastActive = streak.lastActiveDate.slice(0, 10);

  if (lastActive === todayStr || lastActive === yesterdayStr) {
    return streak.current;
  }

  return 0;
}

interface StreakDisplayProps {
  streak: StreakData;
  loading?: boolean;
}

export default function StreakDisplay({ streak, loading }: StreakDisplayProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Sequência de Campanha</h2>
        <div className="mt-2 text-sm text-zinc-400">Carregando...</div>
      </div>
    );
  }

  const effective = getEffectiveStreak(streak);
  const nextMilestone = getNextMilestone(effective);
  const progressToNext = nextMilestone
    ? Math.round((effective / nextMilestone) * 100)
    : 100;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sequência de Campanha</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl" aria-hidden="true">
            {effective > 0 ? "\uD83D\uDD25" : "\u2744\uFE0F"}
          </span>
          <span className="text-3xl font-bold tabular-nums">
            {effective}
          </span>
          <span className="text-sm text-zinc-500">
            {effective === 1 ? "dia" : "dias"}
          </span>
        </div>
      </div>

      {effective > 0 && nextMilestone && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Próximo marco: {nextMilestone} dias</span>
            <span>
              {effective}/{nextMilestone}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {!nextMilestone && effective >= 100 && (
        <div className="mt-2 text-sm font-medium text-amber-600">
          Todos os marcos alcançados!
        </div>
      )}

      {effective === 0 && streak.longest > 0 && (
        <div className="mt-2 text-xs text-zinc-400">
          Complete uma missão para iniciar sua sequência!
          {streak.longest > 1 && ` (Recorde: ${streak.longest} dias)`}
        </div>
      )}

      {effective > 0 && streak.longest > effective && (
        <div className="mt-2 text-xs text-zinc-400">
          Recorde: {streak.longest} dias
        </div>
      )}
    </div>
  );
}
