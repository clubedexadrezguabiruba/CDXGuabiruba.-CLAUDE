import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Bot, BotStatus } from "@/types/bot";
import BotGrid from "@/components/bots/BotGrid";

export default async function BotsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all bots ordered by unlock_order
  const { data: bots } = await supabase
    .from("bots")
    .select("*")
    .order("unlock_order", { ascending: true });

  if (!bots || bots.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-zinc-500">Nenhum bot encontrado.</p>
      </div>
    );
  }

  // Fetch user's first wins to determine unlock status (canonical source)
  const { data: wins } = await supabase
    .from("user_bot_first_wins")
    .select("bot_id")
    .eq("user_id", user.id);

  const wonBotIds = new Set((wins || []).map((w) => w.bot_id));

  // Build status map: bot 1 always available, others need previous bot defeated
  const statusMap: Record<number, BotStatus> = {};
  for (const bot of bots as Bot[]) {
    if (wonBotIds.has(bot.id)) {
      statusMap[bot.id] = "defeated";
    } else if (bot.unlock_order === 1) {
      statusMap[bot.id] = "available";
    } else {
      const prevBot = (bots as Bot[]).find(
        (b) => b.unlock_order === bot.unlock_order - 1
      );
      if (prevBot && wonBotIds.has(prevBot.id)) {
        statusMap[bot.id] = "available";
      } else {
        statusMap[bot.id] = "locked";
      }
    }
  }

  const defeatedCount = wonBotIds.size;
  const totalCount = bots.length;
  const pct = totalCount > 0 ? Math.round((defeatedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Duelos da Campanha</h1>
        <p className="mt-1 text-zinc-500">
          Escolha seu rival. Cada vitória abre o próximo desafio.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 flex items-center gap-3 text-sm text-zinc-500">
        <span className="text-yellow-500">{"\uD83C\uDFC6"}</span>
        <span>
          {defeatedCount} de {totalCount} derrotados
        </span>
        <div className="h-2 max-w-xs flex-1 rounded-full bg-zinc-200">
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <BotGrid bots={bots as Bot[]} statusMap={statusMap} />
    </div>
  );
}
