import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RankingClient from "./RankingClient";
import type { RankingData } from "@/types/ranking";

export default async function RankingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Fetch inicial: rating top 50 com posição do caller
  const { data: ranking, error } = await supabase.rpc(
    "get_ranking_with_position",
    { p_type: "rating", p_limit: 50 }
  );

  const initialData: RankingData = error
    ? { entries: [], my_rank: null, is_hidden: false }
    : (ranking as RankingData);

  return <RankingClient initialData={initialData} userId={data.user.id} />;
}
