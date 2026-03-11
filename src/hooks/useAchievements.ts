"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
  hidden: boolean;
  condition_type: string;
  condition_value: number;
  reward_xp: number;
  reward_chest: boolean;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
}

interface UseAchievementsResult {
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchAchievements(): Promise<
  { ok: true; data: Achievement[] } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_achievements");

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data as Achievement[]) ?? [] };
}

export function useAchievements(): UseAchievementsResult {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await fetchAchievements();
    if (result.ok) {
      setAchievements(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    fetchAchievements().then((result) => {
      requestAnimationFrame(() => {
        if (result.ok) {
          setAchievements(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
        setLoading(false);
      });
    });
  }, []);

  return { achievements, loading, error, refresh };
}
