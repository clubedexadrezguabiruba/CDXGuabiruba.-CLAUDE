"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MemberSummary {
  user_id: string;
  display_name: string | null;
  level: number;
  xp: number;
  puzzle_rating: number;
  current_streak: number;
  lessons_completed: number;
  bots_defeated: number;
  tasks_completed: number;
  tasks_total: number;
}

interface RelatorioClientProps {
  classId: number;
  className: string;
}

export default function RelatorioClient({ classId, className }: RelatorioClientProps) {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      // Buscar membros da turma
      const { data: memberRows, error: memErr } = await supabase
        .from("class_members")
        .select("user_id, users(display_name, level, xp, puzzle_rating)")
        .eq("class_id", classId);

      if (memErr) throw new Error(memErr.message);

      const userIds = (memberRows ?? []).map((m) => m.user_id);
      if (userIds.length === 0) {
        requestAnimationFrame(() => {
          setMembers([]);
          setLoading(false);
        });
        return;
      }

      // Queries paralelas para dados agregados
      const [streakRes, lessonsRes, botsRes, tasksRes] = await Promise.all([
        supabase
          .from("user_streaks")
          .select("user_id, current_streak")
          .in("user_id", userIds),
        supabase
          .from("user_lesson_progress")
          .select("user_id")
          .in("user_id", userIds)
          .eq("completed", true),
        supabase
          .from("user_bot_first_wins")
          .select("user_id")
          .in("user_id", userIds),
        supabase
          .from("user_task_progress")
          .select("user_id, completed, task_id, class_tasks!inner(class_id)")
          .eq("class_tasks.class_id", classId)
          .in("user_id", userIds),
      ]);

      // Indexar dados
      const streakMap = new Map<string, number>();
      (streakRes.data ?? []).forEach((s) => streakMap.set(s.user_id, s.current_streak));

      const lessonCountMap = new Map<string, number>();
      (lessonsRes.data ?? []).forEach((l) => {
        lessonCountMap.set(l.user_id, (lessonCountMap.get(l.user_id) ?? 0) + 1);
      });

      const botCountMap = new Map<string, number>();
      (botsRes.data ?? []).forEach((b) => {
        botCountMap.set(b.user_id, (botCountMap.get(b.user_id) ?? 0) + 1);
      });

      const taskTotalMap = new Map<string, number>();
      const taskCompletedMap = new Map<string, number>();
      (tasksRes.data ?? []).forEach((t) => {
        taskTotalMap.set(t.user_id, (taskTotalMap.get(t.user_id) ?? 0) + 1);
        if (t.completed) {
          taskCompletedMap.set(t.user_id, (taskCompletedMap.get(t.user_id) ?? 0) + 1);
        }
      });

      // Montar resultado
      const result: MemberSummary[] = (memberRows ?? []).map((row) => {
        const u = row.users as unknown as {
          display_name: string | null;
          level: number;
          xp: number;
          puzzle_rating: number;
        } | null;

        return {
          user_id: row.user_id,
          display_name: u?.display_name ?? null,
          level: u?.level ?? 1,
          xp: u?.xp ?? 0,
          puzzle_rating: u?.puzzle_rating ?? 400,
          current_streak: streakMap.get(row.user_id) ?? 0,
          lessons_completed: lessonCountMap.get(row.user_id) ?? 0,
          bots_defeated: botCountMap.get(row.user_id) ?? 0,
          tasks_completed: taskCompletedMap.get(row.user_id) ?? 0,
          tasks_total: taskTotalMap.get(row.user_id) ?? 0,
        };
      });

      result.sort((a, b) => b.level - a.level || b.xp - a.xp);

      requestAnimationFrame(() => {
        setMembers(result);
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
  }, [classId]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando relatorio...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600 shadow-sm">
        Erro: {error}
      </div>
    );
  }

  // Agregados
  const avgLevel = members.length > 0 ? (members.reduce((s, m) => s + m.level, 0) / members.length).toFixed(1) : "0";
  const avgRating = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.puzzle_rating, 0) / members.length) : 0;
  const totalTasksCompleted = members.reduce((s, m) => s + m.tasks_completed, 0);
  const totalTasks = members.reduce((s, m) => s + m.tasks_total, 0);
  const taskPct = totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <Link href={`/turmas/${classId}`} className="text-xs text-zinc-400 hover:text-zinc-600">
          &larr; {className}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">Relatorio da Turma</h1>
      </div>

      {/* Visão geral */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{members.length}</p>
          <p className="text-xs text-zinc-500">Membros</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{avgLevel}</p>
          <p className="text-xs text-zinc-500">Nivel medio</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{avgRating}</p>
          <p className="text-xs text-zinc-500">Rating medio</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{taskPct}%</p>
          <p className="text-xs text-zinc-500">Tarefas completas</p>
        </div>
      </div>

      {/* Lista de membros */}
      {members.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Nenhum membro na turma.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <Link
              key={m.user_id}
              href={`/turmas/${classId}/relatorio/${m.user_id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {m.display_name ?? "Sem nome"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>Nv. {m.level}</span>
                    <span>&middot;</span>
                    <span>Rating {m.puzzle_rating}</span>
                    <span>&middot;</span>
                    <span>{m.lessons_completed} aulas</span>
                    <span>&middot;</span>
                    <span>{m.bots_defeated} bots</span>
                    <span>&middot;</span>
                    <span>{m.tasks_completed}/{m.tasks_total} tarefas</span>
                  </div>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
