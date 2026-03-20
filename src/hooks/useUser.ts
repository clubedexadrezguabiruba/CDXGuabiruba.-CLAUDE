"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  display_name: string | null;
  role: string;
  xp: number;
  level: number;
  puzzle_rating: number;
  puzzle_rd: number;
  puzzle_streak: number;
  puzzle_best_streak: number;
  sound_muted: boolean;
  premove_enabled: boolean;
  auto_queen: boolean;
  avatar_config: Record<string, unknown>;
  avatar_base: string;
  rush_3min_record: number;
  rush_5min_record: number;
  rush_resistencia_record: number;
  ranking_visible: boolean;
}

interface UseUserResult {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useUser(): UseUserResult {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        const { data } = await supabase
          .from("users")
          .select(
            "id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_streak, puzzle_best_streak, sound_muted, premove_enabled, auto_queen, avatar_config, avatar_base, rush_3min_record, rush_5min_record, rush_resistencia_record, ranking_visible"
          )
          .eq("id", user.id)
          .single();

        if (data) setProfile(data as UserProfile);
      }

      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { authUser, profile, loading };
}
