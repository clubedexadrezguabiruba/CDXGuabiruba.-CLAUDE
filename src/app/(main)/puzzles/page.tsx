import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  TrendingUp,
  Grid3X3,
  Timer,
  RotateCcw,
} from "lucide-react";

interface RevancheData {
  due_count: number;
  total_pending: number;
}

export default async function PuzzlesHubPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  // Buscar count de revanche para badge
  let revancheDueCount = 0;
  let revancheTotalPending = 0;
  const { data: revancheData } = await supabase.rpc("get_revanche_due");
  if (revancheData) {
    const rd = revancheData as RevancheData;
    revancheDueCount = rd.due_count ?? 0;
    revancheTotalPending = rd.total_pending ?? 0;
  }

  // Buscar perfil para exibir rating
  const { data: profile } = await supabase
    .from("users")
    .select("puzzle_rating, puzzle_streak, rush_3min_record, rush_5min_record, rush_resistencia_record")
    .eq("id", authData.user.id)
    .single();

  const cards = [
    {
      href: "/puzzles/rating",
      icon: TrendingUp,
      title: "Modo Rating",
      description: "Resolva puzzles e suba seu rating Glicko-2",
      stat: profile ? `Rating: ${profile.puzzle_rating}` : null,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      href: "/puzzles/categorias",
      icon: Grid3X3,
      title: "Categorias",
      description: "Pratique temas táticos específicos",
      stat: "20 temas",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
    },
    {
      href: "/puzzles/rush",
      icon: Timer,
      title: "Puzzle Rush",
      description: "Contra o relógio ou no modo resistência",
      stat: profile
        ? `3min: ${profile.rush_3min_record} | 5min: ${profile.rush_5min_record} | Resistência: ${profile.rush_resistencia_record}`
        : null,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      href: "/puzzles/revanche",
      icon: RotateCcw,
      title: "Revanche",
      description: "Revise puzzles que você errou (repetição espaçada)",
      stat: revancheTotalPending > 0 ? `${revancheTotalPending} para revisar` : null,
      badge: revancheDueCount > 0 ? revancheDueCount : null,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">Puzzles</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`relative flex flex-col gap-3 rounded-xl border p-5 transition-colors ${card.color}`}
          >
            <div className="flex items-center gap-3">
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              <h2 className="text-lg font-semibold">{card.title}</h2>
              {"badge" in card && card.badge ? (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {card.badge}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-600">{card.description}</p>
            {card.stat && (
              <p className="text-xs font-medium text-zinc-500">{card.stat}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
