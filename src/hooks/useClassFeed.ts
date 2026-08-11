"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeedEvent } from "@/types/class";

interface UseClassFeedResult {
  events: FeedEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClassFeed(classId: number): UseClassFeedResult {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();

    try {
      // A RPC, e não a tabela — desde o Bloco 6.
      //
      // Ler `class_feed` direto do navegador funcionava para o texto do evento e
      // NÃO tinha como chegar à identidade do avatar: `users` tem RLS e a matview
      // teve o SELECT revogado de `authenticated` (20260806150000). A RPC junta as
      // duas coisas com a mesma checagem de pertencimento de `get_class_ranking`,
      // e devolve o `display_name` FRESCO — o de `event_data` é um retrato do dia
      // do evento e não acompanha troca de nome.
      const { data, error: qErr } = await supabase.rpc("get_class_feed", {
        p_class_id: classId,
        p_limit: 50,
      });

      if (qErr) throw new Error(qErr.message);

      const mapped = (data as FeedEvent[] | null) ?? [];

      requestAnimationFrame(() => {
        setEvents(mapped);
        setError(null);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar mural";
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

  return { events, loading, error, refresh: load };
}
