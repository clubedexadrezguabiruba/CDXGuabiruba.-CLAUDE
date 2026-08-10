import { createClient } from "@/lib/supabase/server";
import PerfilClient from "./PerfilClient";

export interface ProfileData {
  userId: string;
  displayName: string;
  level: number;
  xp: number;
  puzzleRating: number;
  puzzleBestStreak: number;
  title: string;
  currentStreak: number;
  longestStreak: number;
  memberSince: string;
  rush3min: number;
  rush5min: number;
  rushResistencia: number;
}

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Faça login para ver seu perfil.</p>
      </div>
    );
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, level, xp, puzzle_rating, puzzle_best_streak, rush_3min_record, rush_5min_record, rush_resistencia_record, created_at")
    .eq("id", user.id)
    .single();

  const { data: titleData } = await supabase
    .from("user_titles")
    .select("current_title")
    .eq("user_id", user.id)
    .single();

  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", user.id)
    .single();

  // Contar bots derrotados (distintos — user_bot_first_wins tem UNIQUE(user_id, bot_id))
  const { count: botsDefeated } = await supabase
    .from("user_bot_first_wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Contar aulas completadas
  const { count: lessonsCompleted } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true);

  // Contar puzzles resolvidos
  const { count: puzzlesSolved } = await supabase
    .from("user_puzzle_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("solved", true);

  const profileData: ProfileData = {
    userId: user.id,
    displayName: profile?.display_name || user.email || "Usuário",
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    puzzleRating: profile?.puzzle_rating ?? 1000,
    puzzleBestStreak: profile?.puzzle_best_streak ?? 0,
    title: titleData?.current_title ?? "Aprendiz",
    currentStreak: streakData?.current_streak ?? 0,
    longestStreak: streakData?.longest_streak ?? 0,
    memberSince: profile?.created_at ?? user.created_at ?? "",
    rush3min: profile?.rush_3min_record ?? 0,
    rush5min: profile?.rush_5min_record ?? 0,
    rushResistencia: profile?.rush_resistencia_record ?? 0,
  };

  return (
    <PerfilClient
      profile={profileData}
      botsDefeated={botsDefeated ?? 0}
      lessonsCompleted={lessonsCompleted ?? 0}
      puzzlesSolved={puzzlesSolved ?? 0}
    />
  );
}
