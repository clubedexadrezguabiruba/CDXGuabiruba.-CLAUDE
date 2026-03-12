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
      const { data, error: qErr } = await supabase
        .from("class_feed")
        .select("id, class_id, user_id, event_type, event_data, created_at, users(display_name)")
        .eq("class_id", classId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (qErr) throw new Error(qErr.message);

      const mapped: FeedEvent[] = (data ?? []).map((row) => {
        const u = row.users as unknown as { display_name: string | null } | null;
        return {
          id: row.id,
          class_id: row.class_id,
          user_id: row.user_id,
          event_type: row.event_type,
          event_data: row.event_data as Record<string, unknown>,
          created_at: row.created_at,
          display_name: u?.display_name ?? null,
        };
      });

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
