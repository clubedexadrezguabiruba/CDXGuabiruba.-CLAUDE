import { createClient } from "@/lib/supabase/server";
import PerfilClient from "./PerfilClient";

interface ProfileData {
  displayName: string;
  level: number;
  xp: number;
  puzzleRating: number;
  title: string;
  currentStreak: number;
  memberSince: string;
  rush3min: number;
  rush5min: number;
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
    .select("display_name, level, xp, puzzle_rating, rush_3min_record, rush_5min_record, created_at")
    .eq("id", user.id)
    .single();

  const { data: titleData } = await supabase
    .from("user_titles")
    .select("current_title")
    .eq("user_id", user.id)
    .single();

  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("current_streak")
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

  const profileData: ProfileData = {
    displayName: profile?.display_name || user.email || "Usuário",
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    puzzleRating: profile?.puzzle_rating ?? 1000,
    title: titleData?.current_title ?? "Aprendiz",
    currentStreak: streakData?.current_streak ?? 0,
    memberSince: profile?.created_at ?? user.created_at ?? "",
    rush3min: profile?.rush_3min_record ?? 0,
    rush5min: profile?.rush_5min_record ?? 0,
  };

  return (
    <PerfilClient
      profile={profileData}
      botsDefeated={botsDefeated ?? 0}
      lessonsCompleted={lessonsCompleted ?? 0}
    />
  );
}
