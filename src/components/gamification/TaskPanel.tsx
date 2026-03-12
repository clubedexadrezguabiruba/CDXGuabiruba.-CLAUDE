"use client";

import { useMyTasks } from "@/hooks/useMyTasks";

export default function TaskPanel() {
  const { tasks, loading, error } = useMyTasks();

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Tarefas da Companhia</h2>
        <p className="mt-2 text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Tarefas da Companhia</h2>
        <p className="mt-2 text-sm text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (tasks.length === 0) return null;

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Tarefas da Companhia</h2>

      {pending.length > 0 && (
        <div className="mt-3 space-y-2">
          {pending.map((task) => {
            const pct = task.target > 0 ? Math.min(100, Math.round((task.progress / task.target) * 100)) : 0;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date();

            return (
              <div key={task.task_id} className="rounded-lg border p-3">
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
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                    {task.task_type}
                  </span>
                  {task.deadline && (
                    <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                      {isOverdue ? "Atrasada" : `Prazo: ${new Date(task.deadline).toLocaleDateString("pt-BR")}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-zinc-400">
            {completed.length} tarefa(s) completada(s)
          </p>
          <div className="mt-1 space-y-1">
            {completed.slice(0, 3).map((task) => (
              <div key={task.task_id} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                <span className="text-green-600">&#10003;</span>
                <span className="text-sm text-green-800">{task.title}</span>
              </div>
            ))}
            {completed.length > 3 && (
              <p className="text-xs text-zinc-400">
                +{completed.length - 3} tarefa(s) completada(s)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
