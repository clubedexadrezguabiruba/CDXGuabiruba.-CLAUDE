"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ClassTask } from "@/types/class";
import CreateTaskForm from "@/components/teacher/CreateTaskForm";

interface MemberProgress {
  user_id: string;
  display_name: string | null;
  progress: number;
  completed: boolean;
}

interface TarefasClientProps {
  classId: number;
  className: string;
}

export default function TarefasClient({ classId, className }: TarefasClientProps) {
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [taskReport, setTaskReport] = useState<Record<number, MemberProgress[]>>({});
  const [loadingReport, setLoadingReport] = useState<number | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: qErr } = await supabase
      .from("class_tasks")
      .select("id, class_id, teacher_id, task_type, config_json, title, description, deadline, active, created_at")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (qErr) {
      requestAnimationFrame(() => {
        setError(qErr.message);
        setLoading(false);
      });
      return;
    }

    requestAnimationFrame(() => {
      setTasks((data ?? []) as ClassTask[]);
      setError(null);
      setLoading(false);
    });
  }, [classId]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  async function loadReport(taskId: number) {
    if (expandedTask === taskId) {
      setExpandedTask(null);
      return;
    }

    setExpandedTask(taskId);

    if (taskReport[taskId]) return;

    setLoadingReport(taskId);

    const supabase = createClient();
    const { data } = await supabase
      .from("user_task_progress")
      .select("user_id, progress, completed, users(display_name)")
      .eq("task_id", taskId);

    const mapped: MemberProgress[] = (data ?? []).map((row) => {
      const u = row.users as unknown as { display_name: string | null } | null;
      return {
        user_id: row.user_id,
        display_name: u?.display_name ?? null,
        progress: row.progress,
        completed: row.completed,
      };
    });

    setTaskReport((prev) => ({ ...prev, [taskId]: mapped }));
    setLoadingReport(null);
  }

  // `class_tasks` não aceita mais escrita direta do browser: o grant de UPDATE
  // foi revogado e a policy `class_tasks_update_teacher` dropada em
  // 20260809140000_r1_passo3_liga_desliga_de_tarefa_por_rpc.sql. A RPC aplica a
  // mesma regra de antes (teacher_id = auth.uid()) e move só a coluna `active` —
  // a policy não restringia coluna nenhuma.
  async function handleToggleActive(taskId: number, currentActive: boolean) {
    const supabase = createClient();
    const { error } = await supabase.rpc("set_task_active", {
      p_task_id: taskId,
      p_active: !currentActive,
    });
    if (error) {
      console.error("Erro ao ligar/desligar tarefa:", error);
      return;
    }
    load();
  }

  function getTarget(task: ClassTask): number {
    const c = task.config_json as unknown as Record<string, unknown>;
    switch (task.task_type) {
      case "lesson":
        return 1;
      case "puzzles_count":
      case "puzzles_theme":
        return (c.count as number) ?? 1;
      case "bot":
        return 1;
      case "rush":
        return (c.count as number) ?? 1;
      default:
        return 1;
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando tarefas...
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

  return (
    <>
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <Link href={`/turmas/${classId}`} className="text-xs text-zinc-400 hover:text-zinc-600">
          &larr; {className}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">Tarefas</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Gerencie as tarefas da turma.
        </p>
      </div>

      {/* Criar tarefa */}
      {showCreate ? (
        <div className="mb-4">
          <CreateTaskForm
            classId={classId}
            onCreated={() => {
              setShowCreate(false);
              load();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="mb-4 w-full rounded-xl border-2 border-dashed border-zinc-300 bg-white py-4 text-sm font-medium text-zinc-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          + Nova Tarefa
        </button>
      )}

      {/* Lista de tarefas */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Nenhuma tarefa criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const target = getTarget(task);
            const report = taskReport[task.id];
            const isExpanded = expandedTask === task.id;
            const completedCount = report?.filter((r) => r.completed).length ?? 0;
            const totalCount = report?.length ?? 0;

            return (
              <div
                key={task.id}
                className={`rounded-xl border bg-white shadow-sm ${!task.active ? "opacity-60" : ""}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900">{task.title}</h3>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-zinc-500">{task.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium">
                          {task.task_type}
                        </span>
                        {task.deadline && (
                          <span>
                            Prazo: {new Date(task.deadline).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {!task.active && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                            Inativa
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(task.id, task.active)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                      >
                        {task.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => loadReport(task.id)}
                        className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                      >
                        {isExpanded ? "Fechar" : "Ver Progresso"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report expandido */}
                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    {loadingReport === task.id ? (
                      <p className="text-xs text-zinc-500">Carregando...</p>
                    ) : !report || report.length === 0 ? (
                      <p className="text-xs text-zinc-500">Nenhum membro com progresso.</p>
                    ) : (
                      <>
                        <p className="mb-2 text-xs font-medium text-zinc-600">
                          {completedCount}/{totalCount} completaram
                        </p>
                        <div className="divide-y">
                          {report.map((r) => (
                            <div key={r.user_id} className="flex items-center justify-between py-2">
                              <span className="text-sm text-zinc-700">
                                {r.display_name ?? "Sem nome"}
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  r.completed ? "text-green-600" : "text-zinc-500"
                                }`}
                              >
                                {r.completed
                                  ? "Completa"
                                  : `${r.progress}/${target}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
