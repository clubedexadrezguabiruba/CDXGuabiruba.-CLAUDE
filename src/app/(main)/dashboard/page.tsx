import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // Integração com RPC existente — server-authority, sem lógica no client
  const { data: ranking, error: rankingError } = await supabase.rpc(
    "get_ranking",
    { p_type: "rating", p_limit: 10 }
  );

  const entries: RankingEntry[] = (ranking as RankingEntry[] | null) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="rounded-xl border p-4 text-sm">
        <div className="font-medium">Logado</div>
        <div className="mt-2 space-y-1 text-zinc-700">
          <div>
            <span className="font-medium">Email:</span> {data.user.email}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">
          Ranking — Top 10 (Rating de Puzzles)
        </h2>

        {rankingError ? (
          <p className="text-sm text-red-600">
            Erro ao carregar ranking: {rankingError.message}
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
                <th className="pb-2 pr-2">Nível</th>
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
                  <td className="py-2 pr-2">{entry.level}</td>
                  <td className="py-2">{entry.title ?? "Aprendiz"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
