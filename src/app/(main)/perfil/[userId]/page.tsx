import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicProfileClient from "./PublicProfileClient";
import type { PublicProfileData } from "@/types/ranking";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Se é o próprio usuário, redireciona para /perfil
  if (data.user.id === userId) redirect("/perfil");

  // Buscar perfil público via RPC
  const { data: profile, error } = await supabase.rpc("get_public_profile", {
    p_user_id: userId,
  });

  if (error || !profile) notFound();

  const profileData = profile as PublicProfileData;

  return <PublicProfileClient profile={profileData} />;
}
