"use client";

import Link from "next/link";
import type { PublicProfileData } from "@/types/ranking";
import { xpForLevel } from "@/lib/gamification/xp";
import { emojiDaInsignia } from "@/lib/gamification/achievementIcons";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import MolduraPatente from "@/components/avatar/MolduraPatente";

interface Props {
  profile: PublicProfileData;
}

/**
 * O avatar saiu daqui no Bloco D e voltou no E.4.
 *
 * Ele não é buscado: as colunas chegam prontas dentro de `get_public_profile`,
 * que o E.3 reescreveu para devolver `avatar_skin`/`avatar_cabelo`/`avatar_hair_color`
 * no lugar do `equipped_items` fixo em `[]` da pilha v2. Índice e slug, a mesma
 * língua do banco — a tradução para hex é do `<AvatarKokeshi>`.
 *
 * **`traje` entrou em 2026-08-13, fechando o G21**, e não custou migration: a RPC já
 * devolvia o slug desde o Bloco 1: quem o perdia era o `as PublicProfileData` do
 * `page.tsx`, sobre um tipo que só nomeava três chaves de avatar. `null` é o macacão
 * de treino, que é estado legítimo — o espelho do careca.
 *
 * **Sem animação, e de propósito:** este é o perfil de OUTRA pessoa, uma tela de
 * leitura. Piscar e respirar são para o boneco do próprio aluno, onde o movimento
 * é a resposta ao que ele acabou de escolher.
 */
export default function PublicProfileClient({ profile }: Props) {
  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  const memberDate = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/ranking"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700"
      >
        ← Voltar ao Quadro de Honra
      </Link>

      {/* Header: avatar + info */}
      <div className="mb-6 flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm">
        {/* O marfim atrás do boneco é o mesmo do palco do próprio perfil: o
            contorno preto do kokeshi precisa de fundo claro para manter a
            silhueta, e o branco puro do card o deixaria recortado demais. */}
        {/* A moldura é 3 px aqui, não 2: o boneco tem 104 px e um fio de 2 sumiria
            contra a área que ele ocupa. É o mesmo anel das listas, dimensionado
            para o palco. */}
        <MolduraPatente tier={profile.achieved_tier} espessura={3}>
          <span className="grid place-items-center bg-warm-stone px-2 py-2">
            <AvatarKokeshi
              skin={profile.avatar_skin}
              hair={profile.avatar_cabelo}
              hairColor={profile.avatar_hair_color}
              traje={profile.avatar_traje}
              altura={104}
              ns="perfil-publico"
              rotulo={`Avatar de ${profile.public_name}`}
            />
          </span>
        </MolduraPatente>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-zinc-900">
            {profile.public_name}
          </h1>
          <p className="text-sm text-zinc-600">{profile.title}</p>

          {/* Level + XP bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">Nível {profile.level}</span>
              <span>
                {profile.xp}/{xpNeeded} XP
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Streak + membro desde */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
            {profile.current_streak > 0 && (
              <span>🔥 {profile.current_streak} dias</span>
            )}
            {memberDate && <span>Membro desde {memberDate}</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Histórico de Combate
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <StatItem label="Rating" value={profile.puzzle_rating.toString()} />
          <StatItem
            label="Bots derrotados"
            value={`${profile.bots_defeated}/10`}
          />
          <StatItem
            label="Aulas concluídas"
            value={profile.lessons_completed.toString()}
          />
          <StatItem
            label="Rush 3min"
            value={
              profile.rush_3min_record > 0
                ? profile.rush_3min_record.toString()
                : "—"
            }
          />
          <StatItem
            label="Rush 5min"
            value={
              profile.rush_5min_record > 0
                ? profile.rush_5min_record.toString()
                : "—"
            }
          />
          <StatItem
            label="Rush Resistência"
            value={
              profile.rush_resistencia_record > 0
                ? profile.rush_resistencia_record.toString()
                : "—"
            }
          />
        </div>
      </div>

      {/* Conquistas desbloqueadas */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Insígnias Conquistadas
          <span className="ml-1 text-xs font-normal text-zinc-400">
            ({profile.achievements_count})
          </span>
        </h2>

        {profile.achievements.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            Nenhuma insígnia conquistada ainda.
          </p>
        ) : (
          <div className="grid gap-2">
            {profile.achievements.map((ach) => (
              <div
                key={ach.key}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2"
              >
                <span className="text-xl">{emojiDaInsignia(ach.icon)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-800">
                    {ach.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-zinc-500">{label}</span>
      <p className="font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
