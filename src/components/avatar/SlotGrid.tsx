"use client";

import { useState } from "react";
import type { EquippedMap, ItemSlot } from "@/types/inventory";
import { RARITY_STYLES, SLOT_LABELS, SLOT_EMOJIS, ALL_SLOTS } from "@/lib/constants/items";

interface SlotGridProps {
  equipped: EquippedMap;
  onUnequip?: (slot: ItemSlot) => void;
}

/**
 * Grid 2x3 mostrando os 6 slots de equipamento.
 * Cada slot mostra o item equipado ou "Vazio".
 */
export default function SlotGrid({ equipped, onUnequip }: SlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ALL_SLOTS.map((slot) => (
        <SlotCard
          key={slot}
          slot={slot}
          equipped={equipped}
          onUnequip={onUnequip}
        />
      ))}
    </div>
  );
}

function SlotCard({
  slot,
  equipped,
  onUnequip,
}: {
  slot: ItemSlot;
  equipped: EquippedMap;
  onUnequip?: (slot: ItemSlot) => void;
}) {
  const item = equipped[slot];
  const style = item ? RARITY_STYLES[item.rarity] : null;
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={`flex flex-col items-center rounded-lg border-2 p-3 text-center transition-all ${
        item
          ? `${style?.border} ${style?.bg} ${style?.glow} hover:scale-[1.02]`
          : "border-dashed border-zinc-300 bg-zinc-50"
      }`}
    >
      {/* Slot emoji + label */}
      <span className="text-xs font-medium text-zinc-500">{SLOT_LABELS[slot]}</span>

      {/* Item image or empty */}
      <div className="my-1.5 flex h-12 w-12 items-center justify-center">
        {item && item.image_url && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-contain"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-xl opacity-40">{SLOT_EMOJIS[slot]}</span>
        )}
      </div>

      {/* Item name */}
      <span className="line-clamp-2 text-xs font-medium text-zinc-700">
        {item ? item.name : "Vazio"}
      </span>

      {/* Unequip button */}
      {item && onUnequip && (
        <button
          onClick={() => onUnequip(slot)}
          className="mt-1.5 text-xs text-zinc-400 hover:text-red-500"
        >
          Desequipar
        </button>
      )}
    </div>
  );
}
