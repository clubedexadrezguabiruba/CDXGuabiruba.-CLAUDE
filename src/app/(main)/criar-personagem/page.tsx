import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CriarPersonagemClient from "./CriarPersonagemClient";
import type {
  CabeloDoCatalogo,
  TrajeDoCatalogo,
} from "@/components/avatar/EditorDeAparencia";

/**
 * A tela de criação lê o nível REAL do aluno, e não presume 1.
 *
 * A tentação é assumir que quem chega aqui acabou de nascer — e ela quebra na
 * primeira migration do F.2, que zera `avatar_chosen` de 8 contas que já têm XP,
 * nível e baú. Um aluno de nível 20 mandado de volta para cá tem direito ao coque
 * e ao moicano; a régua é a mesma do perfil, e ela vem do banco.
 */
export default async function CriarPersonagemPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("avatar_chosen, level, avatar_skin, avatar_hair, avatar_hair_color, avatar_traje")
    .eq("id", data.user.id)
    .single();

  // Se já escolheu, redirecionar ao dashboard
  if (profile?.avatar_chosen) {
    redirect("/dashboard");
  }

  const { data: catalogo } = await supabase
    .from("avatar_hair_catalog")
    .select("slug, min_level");

  // O catálogo de traje e o guarda-roupa, para a vitrine. Na criação o aluno é
  // nível 1 e não tem nada de baú, mas ler os dois em vez de presumir é o que faz
  // esta tela continuar certa no dia em que alguém chegar aqui já com peça.
  const { data: catalogoTraje } = await supabase
    .from("avatar_catalogo")
    .select("slug, origem, min_level, min_tier, raridade")
    .eq("slot", "traje");

  const { data: guardaRoupa } = await supabase
    .from("avatar_guarda_roupa")
    .select("slug")
    .eq("user_id", data.user.id);

  const possuidas = new Set((guardaRoupa ?? []).map((g) => g.slug as string));

  return (
    <CriarPersonagemClient
      nivel={profile?.level ?? 1}
      inicial={{
        // Os defaults das colunas (skin 2, hair NULL, cor 0) são ponto de partida
        // legítimo, não placeholder: todo aluno é renderizável desde que a linha
        // exista. Por isso a tela não tem estado "ainda não escolheu".
        skin: profile?.avatar_skin ?? 2,
        hair: profile?.avatar_hair ?? null,
        hairColor: profile?.avatar_hair_color ?? 0,
      }}
      catalogo={(catalogo as CabeloDoCatalogo[] | null) ?? []}
      catalogoTraje={((catalogoTraje ?? []) as Omit<TrajeDoCatalogo, "possui">[]).map((t) => ({
        ...t,
        possui: possuidas.has(t.slug),
      }))}
      trajeInicial={profile?.avatar_traje ?? null}
    />
  );
}
