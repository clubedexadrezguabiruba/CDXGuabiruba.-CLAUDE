"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import FaixaDeComando from "@/components/layout/FaixaDeComando";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import MolduraPatente from "@/components/avatar/MolduraPatente";
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
    <div className="min-h-full bg-warm-ivory pb-10 text-ink">
      <FaixaDeComando
        supertitulo="Academia 64"
        titulo="Quadro de Honra"
        saudacao="Mérito da Academia, atualizado a cada partida."
      />

      <div className="mx-auto max-w-2xl px-4 pt-5">
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-ink/6 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-ink/55 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner: oculto do ranking */}
      {isHidden && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink/80">
          Você está oculto do ranking global.{" "}
          <Link
            href="/configuracoes"
            className="rounded font-medium underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
              className="h-12 animate-pulse rounded-lg bg-ink/6"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/55">
          Nenhum jogador no ranking ainda.
        </p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-warm-ivory text-ink/55">
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

                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-ink/10 transition-colors last:border-0 hover:bg-ink/3 ${
                      isMe ? "bg-gold/12 font-medium" : ""
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
                        className="flex items-center gap-2 rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        {/* O lugar mais social do produto é onde o trabalho da
                            criança mais precisa aparecer. 40 px, `animado`
                            desligado: 30 bonecos animados numa lista pagam 30
                            animações por nada.

                            A moldura é o que faz a patente aparecer AQUI, e o
                            ranking é onde ela mais rende: é a única tela em que o
                            aluno vê o próprio degrau ao lado do dos outros. */}
                        <MolduraPatente tier={entry.achieved_tier}>
                          <AvatarCabeca
                            skin={entry.avatar_skin}
                            hair={entry.avatar_cabelo}
                            hairColor={entry.avatar_hair_color}
                            chapeu={entry.avatar_chapeu}
                            rosto={entry.avatar_rosto}
                            oculos={entry.avatar_oculos}
                            lado={40}
                            ns={`rk-${entry.user_id}`}
                          />
                        </MolduraPatente>
                        <span className="block max-w-40 truncate sm:max-w-none">
                          {entry.public_name}
                        </span>
                        {isMe && (
                          <span className="text-xs font-semibold text-gold">(você)</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {entry.metric_value}
                    </td>
                    <td className="hidden px-3 py-2.5 text-ink/70 sm:table-cell">
                      {entry.title}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Banner: posição do usuário se fora do top */}
      {myRank && myRank.position > entries.length && !loading && (
        <div className="mt-4 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink/80">
          Sua posição: <strong>#{myRank.position}</strong> com{" "}
          {myRank.metric_value} {metricLabel(activeTab).toLowerCase()}
        </div>
      )}
      </div>
    </div>
  );
}
