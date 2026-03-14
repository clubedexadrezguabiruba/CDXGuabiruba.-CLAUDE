"use client";

import { useState } from "react";
import type { InventoryItem, ItemSlot, ItemRarity } from "@/types/inventory";
import { RARITY_STYLES, RARITY_LABELS, SLOT_LABELS, SLOT_EMOJIS, ALL_SLOTS, ALL_RARITIES } from "@/lib/constants/items";

interface InventoryGridProps {
  items: InventoryItem[];
  onEquip?: (itemId: number) => void;
  onUnequip?: (slot: ItemSlot) => void;
}

/**
 * Grid de inventário com filtros por slot e raridade.
 * Mostra todos os itens do aluno com opção de equipar/desequipar.
 */
export default function InventoryGrid({ items, onEquip, onUnequip }: InventoryGridProps) {
  const [slotFilter, setSlotFilter] = useState<ItemSlot | null>(null);
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | null>(null);

  const filtered = items.filter((item) => {
    if (slotFilter && item.slot !== slotFilter) return false;
    if (rarityFilter && item.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filtros por slot */}
      <div className="mb-2 flex flex-wrap gap-1">
        <FilterPill
          label="Todos"
          active={slotFilter === null}
          onClick={() => setSlotFilter(null)}
        />
        {ALL_SLOTS.map((s) => (
          <FilterPill
            key={s}
            label={`${SLOT_EMOJIS[s]} ${SLOT_LABELS[s]}`}
            active={slotFilter === s}
            onClick={() => setSlotFilter(slotFilter === s ? null : s)}
          />
        ))}
      </div>

      {/* Filtros por raridade */}
      <div className="mb-3 flex flex-wrap gap-1">
        {ALL_RARITIES.map((r) => (
          <FilterPill
            key={r}
            label={RARITY_LABELS[r]}
            active={rarityFilter === r}
            onClick={() => setRarityFilter(rarityFilter === r ? null : r)}
            variant={r}
          />
        ))}
      </div>

      {/* Grid de itens */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">
          {items.length === 0
            ? "Nenhum item no inventário. Abra baús para ganhar itens!"
            : "Nenhum item corresponde aos filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard
              key={`${item.id}-${item.obtained_at}`}
              item={item}
              onEquip={onEquip}
              onUnequip={onUnequip}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Item card
// ============================================================
function ItemCard({
  item,
  onEquip,
  onUnequip,
}: {
  item: InventoryItem;
  onEquip?: (itemId: number) => void;
  onUnequip?: (slot: ItemSlot) => void;
}) {
  const style = RARITY_STYLES[item.rarity];
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-center rounded-lg border-2 p-3 text-center transition-all ${
        style.border
      } ${style.bg} ${item.equipped ? "ring-2 ring-emerald-500 ring-offset-2 shadow-md" : "hover:shadow-md hover:scale-[1.02] cursor-pointer"} ${style.glow}`}
    >
      {/* Badge "Equipado" */}
      {item.equipped && (
        <span className="absolute -top-2 right-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          Equipado
        </span>
      )}

      {/* Badge raridade */}
      <span className={`mb-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badge}`}>
        {RARITY_LABELS[item.rarity]}
      </span>

      {/* Imagem */}
      <div className="my-1.5 flex h-16 w-16 items-center justify-center">
        {item.image_url && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-contain"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-3xl">{SLOT_EMOJIS[item.slot]}</span>
        )}
      </div>

      {/* Nome */}
      <span className="line-clamp-2 text-xs font-medium text-zinc-700">{item.name}</span>

      {/* Ação */}
      {item.equipped ? (
        onUnequip && (
          <button
            onClick={() => onUnequip(item.slot)}
            className="mt-2 rounded-md bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-red-100 hover:text-red-600"
          >
            Desequipar
          </button>
        )
      ) : (
        onEquip && (
          <button
            onClick={() => onEquip(item.id)}
            className="mt-2 rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Equipar
          </button>
        )
      )}
    </div>
  );
}

// ============================================================
// Filter pill
// ============================================================
function FilterPill({
  label,
  active,
  onClick,
  variant,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: string;
}) {
  const rarityColor = variant
    ? RARITY_STYLES[variant]
    : null;

  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? rarityColor
            ? `${rarityColor.badge} ring-1 ring-current`
            : "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
