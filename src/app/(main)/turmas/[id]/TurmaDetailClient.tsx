"use client";

import { useState } from "react";
import Link from "next/link";
import { useClassDetail } from "@/hooks/useClassDetail";
import { useMyTasks } from "@/hooks/useMyTasks";
import { createClient } from "@/lib/supabase/client";
import TaskCompletionToast from "@/components/gamification/TaskCompletionToast";

interface TurmaDetailClientProps {
  classId: number;
  isTeacher: boolean;
}

export default function TurmaDetailClient({ classId, isTeacher }: TurmaDetailClientProps) {
  const { classData, members, loading, error, refresh } = useClassDetail(classId);
  const { tasks: allTasks, loading: tasksLoading } = useMyTasks();
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const classTasks = allTasks.filter((t) => t.class_id === classId);

  function getTaskHref(taskType: string): string {
    switch (taskType) {
      case "lesson": return "/aulas";
      case "puzzles_count": return "/puzzles/rating";
      case "puzzles_theme": return "/puzzles/categorias";
      case "bot": return "/bots";
      case "rush": return "/puzzles/rush";
      default: return "/dashboard";
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando companhia...
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600 shadow-sm">
        Erro: {error ?? "Companhia nao encontrada."}
      </div>
    );
  }

  async function handleRemoveMember(userId: string) {
    if (removing) return;
    setRemoving(userId);

    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc("remove_class_member", {
      p_class_id: classId,
      p_user_id: userId,
    });

    if (rpcErr) {
      alert("Erro ao remover: " + rpcErr.message);
    }

    setRemoving(null);
    refresh();
  }

  function handleCopyCode() {
    if (!classData) return;
    navigator.clipboard.writeText(classData.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/turmas" className="text-xs text-zinc-400 hover:text-zinc-600">
              &larr; Companhias
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900">{classData.name}</h1>
            {!classData.active && (
              <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Inativa
              </span>
            )}
          </div>
        </div>

        {/* Invite code — professor only */}
        {isTeacher && (
          <div className="mt-4 rounded-lg bg-zinc-100 p-3">
            <p className="text-xs text-zinc-500">Codigo de convite</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-zinc-900">
                {classData.invite_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      {(() => {
        const teacher = members.find((m) => m.is_teacher);
        const students = members.filter((m) => !m.is_teacher);
        return (
          <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900">Companhia</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              1 professor, {students.length} aluno(s)
            </p>

            {/* Professor */}
            {teacher && (
              <div className="mt-3 border-b pb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">
                    {teacher.display_name ?? "Professor"}
                  </p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Professor
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Nv. {teacher.level}</p>
              </div>
            )}

            {/* Alunos */}
            {students.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">Nenhum aluno ainda.</p>
            ) : (
              <div className="divide-y">
                {students.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {m.display_name ?? "Sem nome"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Nv. {m.level}
                        {isTeacher && <> &middot; Rating {m.puzzle_rating}</>}
                      </p>
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        disabled={removing === m.user_id}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {removing === m.user_id ? "Removendo..." : "Remover"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Minhas Tarefas — aluno */}
      {!isTeacher && (
        <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Minhas Tarefas</h2>
          {tasksLoading ? (
            <p className="mt-2 text-sm text-zinc-500">Carregando...</p>
          ) : classTasks.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nenhuma tarefa atribuida.</p>
          ) : (
            <>
              {classTasks.filter((t) => !t.completed).map((task) => {
                const pct = task.target > 0 ? Math.min(100, Math.round((task.progress / task.target) * 100)) : 0;
                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                return (
                  <Link
                    key={task.task_id}
                    href={getTaskHref(task.task_type)}
                    className="mt-2 block rounded-lg border p-3 transition-all hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">{task.description}</p>
                        )}
                      </div>
                      <span className="ml-2 text-xs font-medium text-zinc-500">
                        {task.progress}/{task.target}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5">{task.task_type}</span>
                        {task.deadline && (
                          <span className={isOverdue ? "font-medium text-red-500" : ""}>
                            {isOverdue ? "Atrasada" : `Prazo: ${new Date(task.deadline).toLocaleDateString("pt-BR")}`}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-blue-600">Iniciar &rarr;</span>
                    </div>
                  </Link>
                );
              })}
              {classTasks.filter((t) => t.completed).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-zinc-400">
                    {classTasks.filter((t) => t.completed).length} tarefa(s) completada(s)
                  </p>
                  <div className="mt-1 space-y-1">
                    {classTasks.filter((t) => t.completed).slice(0, 3).map((task) => (
                      <div key={task.task_id} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                        <span className="text-green-600">&#10003;</span>
                        <span className="text-sm text-green-800">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cards de navegação */}
      <div className="space-y-3">
        {isTeacher && (
          <>
            <Link
              href={`/turmas/${classId}/tarefas`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">Tarefas</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">Criar e gerenciar tarefas da companhia</p>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
            <Link
              href={`/turmas/${classId}/relatorio`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">Relatorios</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">Progresso dos membros da companhia</p>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
          </>
        )}
        <Link
          href={`/turmas/${classId}/ranking`}
          className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-700">Ranking da Companhia</h3>
              <p className="mt-0.5 text-xs text-zinc-400">Classificação dos membros por rating, rush e nível</p>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </div>
        </Link>
        <Link
          href={`/turmas/${classId}/mural`}
          className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-700">Mural</h3>
              <p className="mt-0.5 text-xs text-zinc-400">Conquistas recentes da companhia</p>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </div>
        </Link>
      </div>
      <TaskCompletionToast completedTasks={allTasks.filter((t) => t.just_completed)} />
    </>
  );
}
