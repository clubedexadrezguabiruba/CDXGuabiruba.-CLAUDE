"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import MolduraPatente from "@/components/avatar/MolduraPatente";
import type { RankingEntry, RankingType } from "@/types/ranking";

const TABS: { key: RankingType; label: string }[] = [
  { key: "rating", label: "Rating" },
  { key: "rush_3min", label: "Rush 3min" },
  { key: "rush_5min", label: "Rush 5min" },
  { key: "level", label: "Nível" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

function metricLabel(tab: RankingType): string {
  if (tab === "rating") return "Rating";
  if (tab === "rush_3min" || tab === "rush_5min") return "Pontos";
  return "Nível";
}

interface Props {
  classId: number;
  className: string;
  initialEntries: RankingEntry[];
  userId: string;
}

export default function ClassRankingClient({
  classId,
  className,
  initialEntries,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<RankingType>("rating");
  const [entries, setEntries] = useState<RankingEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);

  const cacheRef = useRef<Partial<Record<RankingType, RankingEntry[]>>>({
    rating: initialEntries,
  });

  const switchTab = useCallback(
    async (tab: RankingType) => {
      setActiveTab(tab);

      const cached = cacheRef.current[tab];
      if (cached) {
        setEntries(cached);
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_class_ranking", {
          p_class_id: classId,
          p_type: tab,
          p_limit: 30,
        });

        if (error) {
          console.error("Erro ao buscar ranking da turma:", error);
          return;
        }

        const result = (data as RankingEntry[] | null) ?? [];
        cacheRef.current[tab] = result;
        setEntries(result);
      } catch (e) {
        console.error("Erro ao buscar ranking da turma:", e);
      } finally {
        setLoading(false);
      }
    },
    [classId]
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/turmas/${classId}`}
        className="mb-2 inline-block text-xs text-zinc-400 hover:text-zinc-600"
      >
        &larr; {className}
      </Link>
      <h1 className="mb-4 text-xl font-bold text-zinc-900">
        Ranking da Companhia
      </h1>

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

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-zinc-100"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhum membro no ranking ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-zinc-500">
                <th className="w-12 px-3 py-2.5 text-center">#</th>
                <th className="px-3 py-2.5">Membro</th>
                <th className="px-3 py-2.5 text-right">
                  {metricLabel(activeTab)}
                </th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Título</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMe = entry.user_id === userId;

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
                        {/* 40 px, como o ranking global — as duas listas são a
                            mesma leitura e não têm por que discordar de tamanho. */}
                        <MolduraPatente tier={entry.achieved_tier}>
                          <AvatarCabeca
                            skin={entry.avatar_skin}
                            hair={entry.avatar_hair}
                            hairColor={entry.avatar_hair_color}
                            lado={40}
                            ns={`cr-${entry.user_id}`}
                          />
                        </MolduraPatente>
                        <span className="truncate">{entry.public_name}</span>
                        {entry.is_teacher && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Professor
                          </span>
                        )}
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
    </div>
  );
}
