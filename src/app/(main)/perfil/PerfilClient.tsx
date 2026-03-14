"use client";

import { useInventory } from "@/hooks/useInventory";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import SlotGrid from "@/components/avatar/SlotGrid";
import InventoryGrid from "@/components/avatar/InventoryGrid";
import Chocadeira from "@/components/avatar/Chocadeira";
import type { ItemSlot } from "@/types/inventory";

interface ProfileData {
  displayName: string;
  level: number;
  xp: number;
  puzzleRating: number;
  title: string;
  currentStreak: number;
  memberSince: string;
  rush3min: number;
  rush5min: number;
}

interface PerfilClientProps {
  profile: ProfileData;
  botsDefeated: number;
  lessonsCompleted: number;
}

export default function PerfilClient({ profile, botsDefeated, lessonsCompleted }: PerfilClientProps) {
  const { items, equipped, loading, equip, unequip } = useInventory();

  const handleEquip = async (itemId: number) => {
    try {
      await equip(itemId);
    } catch {
      // silencioso — o estado não muda se falhar
    }
  };

  const handleUnequip = async (slot: ItemSlot) => {
    try {
      await unequip(slot);
    } catch {
      // silencioso
    }
  };

  // XP necessário para avançar do nível N → N+1: round(100 * 1.05^(N-1))
  // Mesma fórmula do XPBar e do grant_xp server-side
  const xpForLevel = (lv: number) => Math.round(100 * Math.pow(1.05, lv - 1));
  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  const memberDate = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header: Registro da Campanha */}
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Registro da Campanha</h1>

      {/* Layout 2 colunas em desktop, empilhado em mobile */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Coluna esquerda: Avatar + Info + Slots + Stats */}
        <div className="shrink-0 lg:w-80">
          {/* Avatar + Info */}
          <div className="mb-6 flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="shrink-0">
              {loading ? (
                <div className="flex h-35 w-25 items-center justify-center rounded-xl bg-zinc-100">
                  <span className="text-xs text-zinc-400">...</span>
                </div>
              ) : (
                <AvatarDisplay equipped={equipped} size="md" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-zinc-900">{profile.displayName}</h2>
              <p className="text-sm text-zinc-600">{profile.title}</p>

              {/* Level + XP bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium">Nível {profile.level}</span>
                  <span>{profile.xp}/{xpNeeded} XP</span>
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
                {profile.currentStreak > 0 && (
                  <span>🔥 {profile.currentStreak} dias</span>
                )}
                {memberDate && <span>Membro desde {memberDate}</span>}
              </div>
            </div>
          </div>

          {/* Equipamentos da Campanha */}
          <section className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">Equipamentos da Campanha</h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : (
              <SlotGrid equipped={equipped} onUnequip={handleUnequip} />
            )}
          </section>

          {/* Chocadeira */}
          <Chocadeira />

          {/* Histórico de Combate */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">Histórico de Combate</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatItem label="Rating" value={profile.puzzleRating.toString()} />
              <StatItem label="Bots derrotados" value={`${botsDefeated}/10`} />
              <StatItem label="Aulas concluídas" value={lessonsCompleted.toString()} />
              <StatItem label="Rush 3min" value={profile.rush3min > 0 ? profile.rush3min.toString() : "—"} />
            </div>
          </section>
        </div>

        {/* Coluna direita: Arsenal (Inventário) */}
        <section className="min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">
            Arsenal
            {!loading && (
              <span className="ml-1 text-xs font-normal text-zinc-400">
                ({items.length} {items.length === 1 ? "item" : "itens"})
              </span>
            )}
          </h3>
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-100" />
              ))}
            </div>
          ) : (
            <InventoryGrid
              items={items}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
            />
          )}
        </section>
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
