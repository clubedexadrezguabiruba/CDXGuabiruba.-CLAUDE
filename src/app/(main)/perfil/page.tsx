import { createClient } from "@/lib/supabase/server";
import PerfilClient from "./PerfilClient";
import type { Aparencia, PecaDoCatalogo } from "@/components/avatar/EditorDeAparencia";

export interface ProfileData {
  userId: string;
  displayName: string;
  level: number;
  xp: number;
  puzzleRating: number;
  puzzleBestStreak: number;
  title: string;
  /** O NÚMERO do título, para a <MolduraPatente> do palco. 0 = Calouro. */
  achievedTier: number;
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
    .select("display_name, level, xp, puzzle_rating, puzzle_best_streak, rush_3min_record, rush_5min_record, rush_resistencia_record, created_at, avatar_skin, avatar_cabelo, avatar_hair_color, avatar_traje, avatar_rosto, avatar_oculos")
    .eq("id", user.id)
    .single();

  // O catálogo INTEIRO dos três slots que a tela veste, numa leitura só.
  //
  // Eram DUAS consultas até 2026-08-23 — uma em `avatar_hair_catalog` e outra em
  // `avatar_catalogo` filtrando o traje —, porque o cabelo tinha tabela própria.
  // Ele passou a ser peça de baú como as outras, e o `.in(...)` no lugar do
  // `.eq(...)` é literalmente o que sobrou da migração do lado da leitura.
  //
  // O aluno lê o catálogo INTEIRO, inclusive as peças que não tem: é o que permite
  // a VITRINE mostrar o que ele ainda deseja. Quem recusa é `equipar_peca`, no
  // servidor (Regra Inviolável nº 1) — a lista aqui é informação, nunca trava.
  const { data: catalogo } = await supabase
    .from("avatar_catalogo")
    .select("slug, slot, origem, min_level, min_tier, raridade")
    .in("slot", ["cabelo", "traje", "rosto"]);

  // O guarda-roupa dele — a outra metade da vitrine. Peça de baú sem linha aqui
  // aparece em silhueta; a RLS já limita a leitura ao próprio aluno.
  const { data: guardaRoupa } = await supabase
    .from("avatar_guarda_roupa")
    .select("slug")
    .eq("user_id", user.id);

  const possuidas = new Set((guardaRoupa ?? []).map((g) => g.slug as string));

  // `achieved_tier` entra no SELECT que já existia — a consulta continua sendo UMA.
  // É ele que a <MolduraPatente> lê no palco de 168 px.
  const { data: titleData } = await supabase
    .from("user_titles")
    .select("current_title, achieved_tier")
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
    title: titleData?.current_title ?? "Calouro",
    // Sem linha em `user_titles` o aluno é Calouro, tier 0 — o mesmo default que
    // o COALESCE da matview aplica. As duas fontes têm de concordar.
    achievedTier: titleData?.achieved_tier ?? 0,
    currentStreak: streakData?.current_streak ?? 0,
    longestStreak: streakData?.longest_streak ?? 0,
    memberSince: profile?.created_at ?? user.created_at ?? "",
    rush3min: profile?.rush_3min_record ?? 0,
    rush5min: profile?.rush_5min_record ?? 0,
    rushResistencia: profile?.rush_resistencia_record ?? 0,
  };

  const aparencia: Aparencia = {
    skin: profile?.avatar_skin ?? 2,
    hair: profile?.avatar_cabelo ?? null,
    hairColor: profile?.avatar_hair_color ?? 0,
  };

  // O `possui` é montado AQUI, no servidor, e não no cliente: juntar catálogo com
  // guarda-roupa é a única conta que decide silhueta × peça, e ela não pode
  // depender de duas listas chegarem à tela em ordens diferentes.
  const doSlot = (slot: string): PecaDoCatalogo[] =>
    ((catalogo ?? []) as ({ slot: string } & Omit<PecaDoCatalogo, "possui">)[])
      .filter((c) => c.slot === slot)
      .map(({ slot: _slot, ...c }) => ({ ...c, possui: possuidas.has(c.slug) }));

  return (
    <PerfilClient
      profile={profileData}
      aparencia={aparencia}
      catalogoCabelo={doSlot("cabelo")}
      catalogoTraje={doSlot("traje")}
      catalogoRosto={doSlot("rosto")}
      catalogoOculos={doSlot("oculos")}
      trajeInicial={profile?.avatar_traje ?? null}
      rostoInicial={profile?.avatar_rosto ?? null}
      oculosInicial={profile?.avatar_oculos ?? null}
      botsDefeated={botsDefeated ?? 0}
      lessonsCompleted={lessonsCompleted ?? 0}
      puzzlesSolved={puzzlesSolved ?? 0}
    />
  );
}
