import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CriarPersonagemClient from "./CriarPersonagemClient";

export default async function CriarPersonagemPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Se já escolheu, redirecionar ao dashboard
  const { data: profile } = await supabase
    .from("users")
    .select("avatar_chosen")
    .eq("id", data.user.id)
    .single();

  if (profile?.avatar_chosen) {
    redirect("/dashboard");
  }

  return <CriarPersonagemClient />;
}
