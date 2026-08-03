"use client";

import Card, { CardTitle } from "@/components/ui/Card";

import Link from "next/link";
import type { Mission } from "@/hooks/useMissions";

function getMissionHref(key: string): string {
  if (key.includes("rating") || key.startsWith("streak_")) return "/puzzles/rating";
  if (key.includes("lesson")) return "/aulas";
  if (key.includes("bot")) return "/bots";
  if (key.includes("rush")) return "/puzzles/rush";
  if (key.includes("category")) return "/puzzles/categorias";
  if (key.includes("revanche")) return "/puzzles/revanche";
  if (key.includes("mate2") || key.includes("fork") || key.includes("pin") || key.includes("endgame"))
    return "/puzzles/categorias";
  return "/dashboard";
}

function MissionRow({ mission }: { mission: Mission }) {
  const pct = Math.min(
    100,
    Math.round((mission.progress / mission.target) * 100)
  );

  const inner = (
    <div
      className={`rounded-lg border p-3 transition-all ${
        mission.completed
          ? "border-ok/30 bg-ok/10"
          : "border-ink/10 bg-white shadow-sm hover:border-gold/60 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium leading-tight">
          {mission.completed && (
            <span className="mr-1 text-ok" aria-label="Completada">
              &#10003;
            </span>
          )}
          {mission.title}
        </span>
        <span className="shrink-0 text-xs font-semibold text-gold">
          +{mission.reward_xp} XP
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              mission.completed ? "bg-ok" : "bg-deep-navy"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-ink/55">
          {mission.progress}/{mission.target}
        </span>
      </div>

      {!mission.completed && (
        <div className="mt-1 text-right">
          <span className="text-xs font-medium text-ink/70">Iniciar &rarr;</span>
        </div>
      )}
    </div>
  );

  if (mission.completed) return inner;

  return (
    <Link href={getMissionHref(mission.mission_key)} className="block">
      {inner}
    </Link>
  );
}

interface MissionPanelProps {
  missions: Mission[];
  allCompleted: boolean;
  chestAvailable: boolean;
  loading: boolean;
  error: string | null;
  title?: string;
}

export default function MissionPanel({
  missions,
  allCompleted,
  chestAvailable,
  loading,
  error,
  title = "Recruta",
}: MissionPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardTitle>Ordens do Dia</CardTitle>
        <div className="flex items-center justify-center py-6 text-sm text-ink/45">
          Carregando missões...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle>Ordens do Dia</CardTitle>
        <p className="text-sm text-erro">Erro: {error}</p>
      </Card>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle className="mb-0">Ordens do Dia</CardTitle>
        <span className="text-sm font-medium text-ink/55">
          {completedCount}/{missions.length}
        </span>
      </div>

      {allCompleted ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="text-4xl">&#127942;</span>
          <p className="text-sm font-medium text-ink/80">
            Parabéns, <span className="font-bold text-ink/80">{title}</span>!
            Você concluiu todas as ordens do dia!
          </p>
          <p className="text-xs text-ink/55">
            Volte amanhã para novas missões.
          </p>
          {chestAvailable && (
            <p className="mt-1 text-xs font-medium text-gold">
              Abra seu baú no painel de baús!
            </p>
          )}
        </div>
      ) : missions.length === 0 ? (
        <p className="text-sm text-ink/55">
          Nenhuma missão disponível hoje.
        </p>
      ) : (
        <div className="space-y-2">
          {missions.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </Card>
  );
}
