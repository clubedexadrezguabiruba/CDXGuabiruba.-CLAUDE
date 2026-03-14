"use client";

import Link from "next/link";
import { useRanking } from "@/hooks/useRanking";
import type { RankingData, RankingType } from "@/types/ranking";

const TABS: { key: RankingType; label: string }[] = [
  { key: "rating", label: "Rating" },
  { key: "rush_3min", label: "Rush 3min" },
  { key: "rush_5min", label: "Rush 5min" },
  { key: "level", label: "Nível" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

function metricLabel(tab: RankingType): string {
  if (tab === "rating") return "Rating";
  if (tab === "rush_3min") return "Pontos";
  if (tab === "rush_5min") return "Pontos";
  return "Nível";
}

interface Props {
  initialData: RankingData;
  userId: string;
}

export default function RankingClient({ initialData, userId }: Props) {
  const { entries, myRank, isHidden, activeTab, loading, switchTab } =
    useRanking("rating", initialData);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-zinc-900">Quadro de Honra</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner: oculto do ranking */}
      {isHidden && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Você está oculto do ranking global.{" "}
          <Link
            href="/configuracoes"
            className="font-medium underline hover:text-amber-900"
          >
            Alterar em Configurações
          </Link>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-zinc-100"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhum jogador no ranking ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-zinc-500">
                <th className="w-12 px-3 py-2.5 text-center">#</th>
                <th className="px-3 py-2.5">Jogador</th>
                <th className="px-3 py-2.5 text-right">
                  {metricLabel(activeTab)}
                </th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Título</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMe = entry.user_id === userId;
                const initials = entry.public_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b transition-colors last:border-0 hover:bg-zinc-50 ${
                      isMe ? "bg-blue-50 font-medium" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center font-medium">
                      {entry.position <= 3
                        ? MEDAL[entry.position - 1]
                        : entry.position}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/perfil/${entry.user_id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
                          {initials}
                        </span>
                        <span className="truncate">
                          {entry.public_name}
                        </span>
                        {isMe && (
                          <span className="text-xs text-blue-600">(você)</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {entry.metric_value}
                    </td>
                    <td className="hidden px-3 py-2.5 text-zinc-500 sm:table-cell">
                      {entry.title}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Banner: posição do usuário se fora do top */}
      {myRank && myRank.position > entries.length && !loading && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Sua posição: <strong>#{myRank.position}</strong> com{" "}
          {myRank.metric_value} {metricLabel(activeTab).toLowerCase()}
        </div>
      )}
    </div>
  );
}
