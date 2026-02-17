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
  avatar_config: Record<string, unknown>;
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
            "id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_streak, puzzle_best_streak, sound_muted, avatar_config"
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
