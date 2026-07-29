import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarTesteClient from "./AvatarTesteClient";

/**
 * T0.10 — Página de teste de tamanhos do avatar v4.
 *
 * Existe para responder "isso lê a 56 px?" sem esperar a F2, que é quando o
 * render de produção passa a usar o boneco novo. Aqui o SVG do protótipo é
 * montado ao vivo, com fundo, moldura e pet, nos 4 tamanhos do plano.
 *
 * Trancada em professor/admin: é ferramenta de trabalho, não tela de aluno.
 * Some com 404 para quem não é, em vez de redirecionar — não vale dar pista
 * de que a rota existe.
 */
export default async function DevAvatarPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (perfil?.role !== "professor" && perfil?.role !== "admin") notFound();

  return <AvatarTesteClient />;
}
