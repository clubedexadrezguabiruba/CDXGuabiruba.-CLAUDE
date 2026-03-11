import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DailyPanel from "@/components/gamification/DailyPanel";

interface RankingEntry {
  user_id: string;
  display_name: string | null;
  level: number;
  puzzle_rating: number;
  title: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Buscar título do aluno
  const { data: titleData } = await supabase
    .from("user_titles")
    .select("current_title")
    .eq("user_id", data.user.id)
    .single();
  const title = titleData?.current_title ?? "Aprendiz";

  // Ranking top 5 para preview
  const { data: ranking, error: rankingError } = await supabase.rpc(
    "get_ranking",
    { p_type: "rating", p_limit: 5 }
  );
  const entries: RankingEntry[] = (ranking as RankingEntry[] | null) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header — Quartel-General */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quartel-General</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seu centro de comando &middot; {title}
        </p>
      </div>

      {/* Atalhos rápidos */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Link
          href="/aulas"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="text-2xl">&#128218;</span>
          <span className="text-xs font-medium text-zinc-700">
            Continuar Treinamento
          </span>
        </Link>
        <Link
          href="/puzzles/rating"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="text-2xl">&#9876;&#65039;</span>
          <span className="text-xs font-medium text-zinc-700">
            Desafio Tático
          </span>
        </Link>
        <Link
          href="/bots"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="text-2xl">&#129302;</span>
          <span className="text-xs font-medium text-zinc-700">
            Enfrentar Bot
          </span>
        </Link>
      </div>

      {/* Blocos client-side: XP, missões, streak, baús, insígnias */}
      <DailyPanel />

      {/* Quadro de Honra — preview top 5 */}
      <div className="mt-6 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Quadro de Honra</h2>

        {rankingError ? (
          <p className="text-sm text-red-600">
            Erro ao carregar ranking.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum jogador no ranking ainda.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">Jogador</th>
                <th className="pb-2 pr-2">Rating</th>
                <th className="pb-2">Título</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.user_id} className="border-b last:border-0">
                  <td className="py-2 pr-2 font-medium">{i + 1}</td>
                  <td className="py-2 pr-2">
                    {entry.display_name ?? "Jogador"}
                  </td>
                  <td className="py-2 pr-2">{entry.puzzle_rating}</td>
                  <td className="py-2 text-zinc-500">
                    {entry.title ?? "Aprendiz"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
