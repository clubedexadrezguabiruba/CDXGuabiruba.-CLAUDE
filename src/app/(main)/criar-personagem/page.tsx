import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CriarPersonagemClient from "./CriarPersonagemClient";
import type { CabeloDoCatalogo } from "@/components/avatar/EditorDeAparencia";

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
    .select("avatar_chosen, level, avatar_skin, avatar_hair, avatar_hair_color")
    .eq("id", data.user.id)
    .single();

  // Se já escolheu, redirecionar ao dashboard
  if (profile?.avatar_chosen) {
    redirect("/dashboard");
  }

  const { data: catalogo } = await supabase
    .from("avatar_hair_catalog")
    .select("slug, min_level");

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
    />
  );
}
