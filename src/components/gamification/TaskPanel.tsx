"use client";

import Card, { CardTitle } from "@/components/ui/Card";

import Link from "next/link";
import { useMyTasks } from "@/hooks/useMyTasks";
import TaskCompletionToast from "./TaskCompletionToast";

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

export default function TaskPanel() {
  const { tasks, loading, error } = useMyTasks();

  if (loading) {
    return (
      <Card>
        <CardTitle className="mb-0">Tarefas da Companhia</CardTitle>
        <p className="mt-2 text-sm text-ink/55">Carregando...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle className="mb-0">Tarefas da Companhia</CardTitle>
        <p className="mt-2 text-sm text-erro">Erro: {error}</p>
      </Card>
    );
  }

  const justCompleted = tasks.filter((t) => t.just_completed);

  if (tasks.length === 0) return <TaskCompletionToast completedTasks={justCompleted} />;

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <Card>
      <CardTitle className="mb-0">Tarefas da Companhia</CardTitle>

      {pending.length > 0 && (
        <div className="mt-3 space-y-2">
          {pending.map((task) => {
            const pct = task.target > 0 ? Math.min(100, Math.round((task.progress / task.target) * 100)) : 0;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date();

            return (
              <Link
                key={task.task_id}
                href={getTaskHref(task.task_type)}
                className="block rounded-lg border p-3 transition-all hover:border-gold/60 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-ink/55">{task.description}</p>
                    )}
                  </div>
                  <span className="ml-2 text-xs font-medium text-ink/55">
                    {task.progress}/{task.target}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-ink/6">
                  <div
                    className="h-full rounded-full bg-deep-navy transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-ink/45">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-ink/6 px-2 py-0.5">
                      {task.task_type}
                    </span>
                    {task.deadline && (
                      <span className={isOverdue ? "text-erro font-medium" : ""}>
                        {isOverdue ? "Atrasada" : `Prazo: ${new Date(task.deadline).toLocaleDateString("pt-BR")}`}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-ink/70">Iniciar &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-ink/45">
            {completed.length} tarefa(s) completada(s)
          </p>
          <div className="mt-1 space-y-1">
            {completed.slice(0, 3).map((task) => (
              <div key={task.task_id} className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2">
                <span className="text-ok">&#10003;</span>
                <span className="text-sm text-ok">{task.title}</span>
              </div>
            ))}
            {completed.length > 3 && (
              <p className="text-xs text-ink/45">
                +{completed.length - 3} tarefa(s) completada(s)
              </p>
            )}
          </div>
        </div>
      )}
      <TaskCompletionToast completedTasks={justCompleted} />
    </Card>
  );
}
