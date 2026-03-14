"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Mission {
  id: number;
  mission_key: string;
  title: string;
  target: number;
  progress: number;
  reward_xp: number;
  completed: boolean;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface NewAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  reward_xp: number;
  reward_chest: boolean;
  reward_egg?: boolean;
  category: string;
}

interface MissionsState {
  missions: Mission[];
  allCompleted: boolean;
  chestAvailable: boolean;
  streak: StreakData;
  newAchievements: NewAchievement[];
}

interface UseMissionsResult extends MissionsState {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchMissions(): Promise<
  { ok: true; state: MissionsState } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("check_daily_missions");

  if (error) return { ok: false, error: error.message };

  const result = data as {
    date: string;
    missions: Mission[];
    all_completed: boolean;
    chest_available: boolean;
    streak?: { current: number; longest: number; last_active_date: string | null };
    new_achievements?: NewAchievement[];
  };

  return {
    ok: true,
    state: {
      missions: result.missions ?? [],
      allCompleted: result.all_completed ?? false,
      chestAvailable: result.chest_available ?? false,
      streak: {
        current: result.streak?.current ?? 0,
        longest: result.streak?.longest ?? 0,
        lastActiveDate: result.streak?.last_active_date ?? null,
      },
      newAchievements: result.new_achievements ?? [],
    },
  };
}

export function useMissions(): UseMissionsResult {
  const [state, setState] = useState<MissionsState>({
    missions: [],
    allCompleted: false,
    chestAvailable: false,
    streak: { current: 0, longest: 0, lastActiveDate: null },
    newAchievements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await fetchMissions();
    if (result.ok) {
      setState(result.state);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    fetchMissions().then((result) => {
      requestAnimationFrame(() => {
        if (result.ok) {
          setState(result.state);
          setError(null);
        } else {
          setError(result.error);
        }
        setLoading(false);
      });
    });
  }, []);

  return { ...state, loading, error, refresh };
}
