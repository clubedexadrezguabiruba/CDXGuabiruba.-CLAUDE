import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArteMapaClient from "./ArteMapaClient";

/**
 * O MAPA DA ESPESSURA no navegador — o instrumento do retoque de arte.
 *
 * A régua da espessura publica percentis, que dizem *quanto*. Quem vai retocar a
 * arte precisa de *onde*, e é isso que esta página mostra: o contorno denso
 * pintado por faixa, sobre a própria arte apagada.
 *
 * **Ela não mede nada.** Quem mede é `npm run arte:mapa -- <arte> --watch`, que
 * grava `public/dev/arte-mapa.{png,json}` a cada salvamento da arte; a página relê
 * e se refaz. A separação é deliberada: medir exige `sharp` e o `tsconfig` dos
 * scripts, e trazer o pipeline de diagnóstico para dentro do bundle que serve o
 * aluno seria acoplamento sem ganho.
 *
 * `public/dev/` é ignorado pelo git — o artefato é local e regenerável, e nunca
 * embarca.
 *
 * Trancada em professor/admin, com **404 em vez de redirect**, pela mesma razão
 * de `dev/avatar-base`: redirect confirma que a rota existe, e rota de
 * desenvolvimento não deve dar essa pista.
 */
export const metadata = { title: "Mapa da espessura — arte" };

export default async function DevArteMapaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (perfil?.role !== "professor" && perfil?.role !== "admin") notFound();

  return <ArteMapaClient />;
}
