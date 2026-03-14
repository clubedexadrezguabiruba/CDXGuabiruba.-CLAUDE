"use client";

import { useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import type { TaskProgress } from "@/types/class";

interface TaskCompletionToastProps {
  completedTasks: TaskProgress[];
}

/**
 * Toast discreto no canto inferior direito quando uma tarefa é concluída.
 * Só dispara quando a lista muda de vazio para preenchido (just_completed).
 */
export default function TaskCompletionToast({
  completedTasks,
}: TaskCompletionToastProps) {
  const prevLen = useRef(0);
  const [visible, setVisible] = useState<TaskProgress[]>([]);

  useEffect(() => {
    if (completedTasks.length > 0 && prevLen.current === 0) {
      soundManager.play("notify");
      requestAnimationFrame(() => {
        setVisible(completedTasks);
      });

      const timer = setTimeout(() => {
        requestAnimationFrame(() => setVisible([]));
      }, 5000);
      prevLen.current = completedTasks.length;
      return () => clearTimeout(timer);
    }
    prevLen.current = completedTasks.length;
  }, [completedTasks]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {visible.map((task) => (
        <div
          key={task.task_id}
          className="pointer-events-auto animate-scale-in rounded-xl border border-green-300 bg-green-50 px-5 py-3 shadow-lg"
        >
          <div className="text-center">
            <div className="text-sm font-bold text-green-700">
              Tarefa Concluida!
            </div>
            <div className="mt-1 text-base font-semibold text-green-900">
              {task.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
