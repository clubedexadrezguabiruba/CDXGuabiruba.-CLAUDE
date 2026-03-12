"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskProgress } from "@/types/class";

interface UseMyTasksResult {
  tasks: TaskProgress[];
  loading: boolean;
  error: string | null;
  /** Chamar após: montar dashboard, completar aula, finalizar bot,
   *  finalizar rush, resolver puzzle (mode='rating').
   *  NÃO chamar durante rush/resistência. */
  refresh: () => Promise<void>;
}

export function useMyTasks(): UseMyTasksResult {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      const { data, error: rpcErr } = await supabase.rpc("check_my_tasks");

      if (rpcErr) throw new Error(rpcErr.message);

      const result = (data ?? []) as TaskProgress[];

      requestAnimationFrame(() => {
        setTasks(result);
        setError(null);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar tarefas";
      requestAnimationFrame(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  return { tasks, loading, error, refresh: load };
}
