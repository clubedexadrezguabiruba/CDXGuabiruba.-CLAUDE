"use client";

import type { Mission } from "@/hooks/useMissions";

function MissionRow({ mission }: { mission: Mission }) {
  const pct = Math.min(
    100,
    Math.round((mission.progress / mission.target) * 100)
  );

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        mission.completed
          ? "border-green-200 bg-green-50"
          : "border-zinc-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium leading-tight">
          {mission.completed && (
            <span className="mr-1 text-green-600" aria-label="Completada">
              &#10003;
            </span>
          )}
          {mission.title}
        </span>
        <span className="shrink-0 text-xs font-semibold text-amber-600">
          +{mission.reward_xp} XP
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              mission.completed ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-zinc-500">
          {mission.progress}/{mission.target}
        </span>
      </div>
    </div>
  );
}

interface MissionPanelProps {
  missions: Mission[];
  allCompleted: boolean;
  chestAvailable: boolean;
  loading: boolean;
  error: string | null;
}

export default function MissionPanel({
  missions,
  allCompleted,
  chestAvailable,
  loading,
  error,
}: MissionPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Ordens do Dia</h2>
        <div className="flex items-center justify-center py-6 text-sm text-zinc-400">
          Carregando missões...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Ordens do Dia</h2>
        <p className="text-sm text-red-600">Erro: {error}</p>
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ordens do Dia</h2>
        <span className="text-sm font-medium text-zinc-500">
          {completedCount}/{missions.length}
        </span>
      </div>

      {missions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhuma missão disponível hoje.
        </p>
      ) : (
        <div className="space-y-2">
          {missions.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      )}

      {allCompleted && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-700">
          {chestAvailable
            ? "Todas as missões completas! Abra seu baú no painel de baús."
            : "Todas as missões completas! Baú do dia já concedido."}
        </div>
      )}
    </div>
  );
}
