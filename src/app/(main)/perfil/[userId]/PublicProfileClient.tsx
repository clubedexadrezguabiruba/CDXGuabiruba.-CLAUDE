"use client";

import Link from "next/link";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import type { AvatarBase } from "@/components/avatar/AvatarDisplay";
import type { PublicProfileData } from "@/types/ranking";
import type { EquippedMap, ItemSlot, ItemRarity } from "@/types/inventory";

interface Props {
  profile: PublicProfileData;
}

export default function PublicProfileClient({ profile }: Props) {
  // Converter equipped_items do RPC para EquippedMap do AvatarDisplay
  const equipped: EquippedMap = {};
  for (const item of profile.equipped_items) {
    const slot = item.slot as ItemSlot;
    equipped[slot] = {
      slot,
      id: 0,
      name: item.item_name,
      rarity: item.rarity as ItemRarity,
      image_url: item.image_url,
    };
  }

  // XP necessário para avançar do nível N → N+1
  const xpForLevel = (lv: number) => Math.round(100 * Math.pow(1.05, lv - 1));
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

      {/* Header: Avatar + Info */}
      <div className="mb-6 flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm">
        <div className="shrink-0">
          <AvatarDisplay equipped={equipped} avatarBase={(profile.avatar_base || "male") as AvatarBase} size="md" />
        </div>

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
                <span className="text-xl">{ach.icon || "🏅"}</span>
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
