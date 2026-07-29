import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarBaseClient from "./AvatarBaseClient";

/**
 * Aprovação do boneco base — a arte do Doug, reconstruída como recolorível.
 *
 * Existe para responder uma pergunta só: **isso está aprovado?** O desenho vem
 * de `public/items/base/avatar-base-neutro.svg`, gerado por `npm run
 * avatar:base`. Nada disto está ligado ao avatar de produção ainda; ligar é o
 * passo seguinte, e depende do aval que esta página existe para colher.
 *
 * Trancada em professor/admin, com 404 em vez de redirect — mesma decisão da
 * página irmã `/dev/avatar`: não vale dar pista de que a rota existe.
 */
export default async function DevAvatarBasePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (perfil?.role !== "professor" && perfil?.role !== "admin") notFound();

  return <AvatarBaseClient />;
}
