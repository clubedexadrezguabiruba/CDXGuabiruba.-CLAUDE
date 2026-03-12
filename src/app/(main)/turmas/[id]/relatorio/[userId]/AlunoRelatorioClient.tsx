"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface StudentProfile {
  display_name: string | null;
  level: number;
  xp: number;
  puzzle_rating: number;
}

interface LessonEntry {
  lesson_id: number;
  completed: boolean;
  steps_completed: number;
  lessons: { title: string; trail: string } | null;
}

interface BotWin {
  bot_id: number;
  bots: { name: string; elo: number } | null;
}

interface TaskEntry {
  progress: number;
  completed: boolean;
  class_tasks: { title: string; task_type: string } | null;
}

interface AchievementEntry {
  achievement_key: string;
  achievements: { title: string } | null;
}

interface AlunoRelatorioClientProps {
  classId: number;
  className: string;
  studentId: string;
}

export default function AlunoRelatorioClient({ classId, className, studentId }: AlunoRelatorioClientProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<LessonEntry[]>([]);
  const [botWins, setBotWins] = useState<BotWin[]>([]);
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      const [profileRes, streakRes, lessonsRes, botsRes, tasksRes, achievementsRes] = await Promise.all([
        supabase
          .from("users")
          .select("display_name, level, xp, puzzle_rating")
          .eq("id", studentId)
          .single(),
        supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", studentId)
          .single(),
        supabase
          .from("user_lesson_progress")
          .select("lesson_id, completed, steps_completed, lessons(title, trail)")
          .eq("user_id", studentId)
          .order("lesson_id"),
        supabase
          .from("user_bot_first_wins")
          .select("bot_id, bots(name, elo)")
          .eq("user_id", studentId)
          .order("bot_id"),
        supabase
          .from("user_task_progress")
          .select("progress, completed, class_tasks!inner(title, task_type, class_id)")
          .eq("user_id", studentId)
          .eq("class_tasks.class_id", classId),
        supabase
          .from("user_achievements")
          .select("achievement_key, achievements(title)")
          .eq("user_id", studentId),
      ]);

      if (profileRes.error) throw new Error(profileRes.error.message);

      requestAnimationFrame(() => {
        setProfile(profileRes.data as StudentProfile);
        setStreak(streakRes.data?.current_streak ?? 0);
        setLessons((lessonsRes.data ?? []) as unknown as LessonEntry[]);
        setBotWins((botsRes.data ?? []) as unknown as BotWin[]);
        setTasks((tasksRes.data ?? []) as unknown as TaskEntry[]);
        setAchievements((achievementsRes.data ?? []) as unknown as AchievementEntry[]);
        setError(null);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar relatorio";
      requestAnimationFrame(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [classId, studentId]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando relatorio do aluno...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600 shadow-sm">
        Erro: {error ?? "Aluno nao encontrado."}
      </div>
    );
  }

  const completedLessons = lessons.filter((l) => l.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <>
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <Link href={`/turmas/${classId}/relatorio`} className="text-xs text-zinc-400 hover:text-zinc-600">
          &larr; Relatorio da {className}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          {profile.display_name ?? "Sem nome"}
        </h1>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{profile.level}</p>
          <p className="text-xs text-zinc-500">Nivel</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{profile.puzzle_rating}</p>
          <p className="text-xs text-zinc-500">Rating</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{profile.xp}</p>
          <p className="text-xs text-zinc-500">XP total</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{streak}</p>
          <p className="text-xs text-zinc-500">Streak atual</p>
        </div>
      </div>

      {/* Aulas */}
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700">
          Aulas ({completedLessons.length} concluidas)
        </h2>
        {lessons.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">Nenhuma aula iniciada.</p>
        ) : (
          <div className="mt-2 divide-y">
            {lessons.map((l) => (
              <div key={l.lesson_id} className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-700">
                  {l.lessons?.title ?? `Aula ${l.lesson_id}`}
                  <span className="ml-1 text-xs text-zinc-400">
                    ({l.lessons?.trail ?? "?"})
                  </span>
                </span>
                <span className={`text-xs font-medium ${l.completed ? "text-green-600" : "text-zinc-400"}`}>
                  {l.completed ? "Concluida" : `${l.steps_completed} passos`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bots */}
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700">
          Bots derrotados ({botWins.length})
        </h2>
        {botWins.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">Nenhum bot derrotado.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {botWins.map((b) => (
              <span
                key={b.bot_id}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {b.bots?.name ?? `Bot ${b.bot_id}`} ({b.bots?.elo ?? "?"})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tarefas da turma */}
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700">
          Tarefas ({completedTasks.length}/{tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">Nenhuma tarefa atribuida.</p>
        ) : (
          <div className="mt-2 divide-y">
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-700">
                  {t.class_tasks?.title ?? "Tarefa"}
                </span>
                <span className={`text-xs font-medium ${t.completed ? "text-green-600" : "text-zinc-400"}`}>
                  {t.completed ? "Completa" : `Progresso: ${t.progress}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conquistas */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-700">
          Conquistas ({achievements.length})
        </h2>
        {achievements.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">Nenhuma conquista desbloqueada.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span
                key={a.achievement_key}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                {a.achievements?.title ?? a.achievement_key}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
