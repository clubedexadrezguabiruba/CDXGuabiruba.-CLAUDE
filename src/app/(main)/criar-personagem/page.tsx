import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CriarPersonagemClient from "./CriarPersonagemClient";
import type { PecaDoCatalogo } from "@/components/avatar/EditorDeAparencia";

/**
 * A tela de criação lê o nível REAL do aluno, e não presume 1.
 *
 * A tentação é assumir que quem chega aqui acabou de nascer — e ela quebra na
 * primeira migration do F.2, que zera `avatar_chosen` de 8 contas que já têm XP,
 * nível e baú. Um aluno assim pode ter peça de baú no guarda-roupa, e a vitrine
 * tem de mostrá-la vestível. A régua é a mesma do perfil, e ela vem do banco.
 *
 * ⚠️ Até 2026-08-23 a régua do cabelo era o NÍVEL — "um aluno de nível 20 tem
 * direito ao coque e ao moicano". Não é mais: o cabelo virou peça de baú, e quem
 * decide é a linha em `avatar_guarda_roupa`. O nível continua sendo lido porque a
 * vitrine ainda sabe desenhar peça de marco, e o CHECK do banco ainda a admite.
 */
export default async function CriarPersonagemPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("avatar_chosen, level, avatar_skin, avatar_cabelo, avatar_hair_color, avatar_traje, avatar_rosto, avatar_oculos")
    .eq("id", data.user.id)
    .single();

  // Se já escolheu, redirecionar ao dashboard
  if (profile?.avatar_chosen) {
    redirect("/dashboard");
  }

  // O catálogo dos três slots vestíveis e o guarda-roupa, para as vitrines.
  //
  // Eram DUAS consultas até 2026-08-23, uma delas em `avatar_hair_catalog`: o
  // cabelo tinha tabela própria e era travado por NÍVEL. Agora é peça de baú como
  // as outras, e é o guarda-roupa que decide. **Na criação o aluno já tem as
  // iniciais** — `handle_new_user` as semeia com `fonte = 'inicial'` —, e é por
  // isso que ele chega aqui podendo escolher entre 2 cabelos `common` e a careca.
  //
  // Ler o guarda-roupa em vez de presumir "conta nova não tem nada" é o que faz
  // esta tela continuar certa para quem foi mandado de volta para cá com peça no
  // baú — o caso que a migration do F.2 criou.
  //
  // ⚠️ A LISTA DE SLOTS ANDA JUNTO COM OS `doSlot(...)` LÁ EMBAIXO. `oculos` ficou
  // de fora quando o slot nasceu, em 2026-08-27, e a tela ofereceu "Sem óculos" e
  // mais nada — `[]` é *truthy*, então a seção renderiza vazia em vez de sumir, e
  // nenhuma régua estática enxerga. Ver o comentário longo no `/perfil`, que tem o
  // mesmo par de linhas e caiu pelo mesmo motivo.
  const { data: catalogo } = await supabase
    .from("avatar_catalogo")
    .select("slug, slot, origem, min_level, min_tier, raridade")
    .in("slot", ["cabelo", "traje", "rosto", "oculos"]);

  const { data: guardaRoupa } = await supabase
    .from("avatar_guarda_roupa")
    .select("slug")
    .eq("user_id", data.user.id);

  const possuidas = new Set((guardaRoupa ?? []).map((g) => g.slug as string));

  const doSlot = (slot: string): PecaDoCatalogo[] =>
    ((catalogo ?? []) as ({ slot: string } & Omit<PecaDoCatalogo, "possui">)[])
      .filter((c) => c.slot === slot)
      .map(({ slot: _slot, ...c }) => ({ ...c, possui: possuidas.has(c.slug) }));

  return (
    <CriarPersonagemClient
      nivel={profile?.level ?? 1}
      inicial={{
        // Os defaults das colunas (skin 2, hair NULL, cor 0) são ponto de partida
        // legítimo, não placeholder: todo aluno é renderizável desde que a linha
        // exista. Por isso a tela não tem estado "ainda não escolheu".
        skin: profile?.avatar_skin ?? 2,
        hair: profile?.avatar_cabelo ?? null,
        hairColor: profile?.avatar_hair_color ?? 0,
      }}
      catalogoCabelo={doSlot("cabelo")}
      catalogoTraje={doSlot("traje")}
      catalogoRosto={doSlot("rosto")}
      catalogoOculos={doSlot("oculos")}
      trajeInicial={profile?.avatar_traje ?? null}
      rostoInicial={profile?.avatar_rosto ?? null}
      oculosInicial={profile?.avatar_oculos ?? null}
    />
  );
}
