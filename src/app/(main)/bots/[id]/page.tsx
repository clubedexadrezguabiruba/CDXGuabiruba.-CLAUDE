import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Bot } from "@/types/bot";
import BotGameClient from "./BotGameClient";

interface BotPageProps {
  params: Promise<{ id: string }>;
}

export default async function BotPage({ params }: BotPageProps) {
  const { id } = await params;
  const botId = parseInt(id, 10);
  if (isNaN(botId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the bot
  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .single();

  if (!bot) notFound();

  // Check unlock status
  if ((bot as Bot).unlock_order > 1) {
    // Find previous bot
    const { data: prevBot } = await supabase
      .from("bots")
      .select("id")
      .eq("unlock_order", (bot as Bot).unlock_order - 1)
      .single();

    if (prevBot) {
      const { data: prevWin } = await supabase
        .from("user_bot_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("bot_id", prevBot.id)
        .eq("result", "win")
        .limit(1);

      if (!prevWin || prevWin.length === 0) {
        redirect("/bots");
      }
    }
  }

  return <BotGameClient bot={bot as Bot} />;
}
