"use client";

import Card, { CardTitle } from "@/components/ui/Card";

import type { StreakData } from "@/hooks/useMissions";

const MILESTONES = [
  1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100,
  125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900,
  1000, 1200, 1500, 2000,
];

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
      <Card>
        <CardTitle className="mb-0">Sequência de Presença</CardTitle>
        <div className="mt-2 text-sm text-ink/45">Carregando...</div>
      </Card>
    );
  }

  const effective = getEffectiveStreak(streak);
  const nextMilestone = getNextMilestone(effective);
  const progressToNext = nextMilestone
    ? Math.round((effective / nextMilestone) * 100)
    : 100;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle className="mb-0">Sequência de Presença</CardTitle>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl" aria-hidden="true">
            {effective > 0 ? "\uD83D\uDD25" : "\u2744\uFE0F"}
          </span>
          <span className="text-3xl font-bold tabular-nums">
            {effective}
          </span>
          <span className="text-sm text-ink/55">
            {effective === 1 ? "dia" : "dias"}
          </span>
        </div>
      </div>

      {effective > 0 && nextMilestone && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-ink/55">
            <span>Próximo marco: {nextMilestone} dias</span>
            <span>
              {effective}/{nextMilestone}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {!nextMilestone && effective >= 2000 && (
        <div className="mt-2 text-sm font-medium text-gold">
          Todos os marcos alcançados!
        </div>
      )}

      {effective === 0 && streak.longest > 0 && (
        <div className="mt-2 text-xs text-ink/45">
          Complete uma missão para iniciar sua sequência!
          {streak.longest > 1 && ` (Recorde: ${streak.longest} dias)`}
        </div>
      )}

      {effective > 0 && streak.longest > effective && (
        <div className="mt-2 text-xs text-ink/45">
          Recorde: {streak.longest} dias
        </div>
      )}
    </Card>
  );
}
