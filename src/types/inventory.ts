export type ItemSlot = "head" | "outfit" | "background" | "frame" | "pet";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export interface InventoryItem {
  id: number;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  image_url: string | null;
  description: string;
  source: string;
  obtained_at: string;
  equipped: boolean;
}

export interface EquippedItem {
  slot: ItemSlot;
  id: number;
  name: string;
  rarity: ItemRarity;
  image_url: string | null;
}

export type EquippedMap = Partial<Record<ItemSlot, EquippedItem>>;

// --- Egg Hatching System ---

export type EggStatus = "hatching" | "queued";

export interface Egg {
  id: number;
  status: EggStatus;
  hatch_start_at: string | null;
  created_at: string;
  queue_position: number | null;
}

export interface HatchResult {
  hatched: boolean;
  is_xp_egg: boolean;
  xp_bonus: number;
  pet: {
    id: number;
    name: string;
    rarity: string;
    image_url: string | null;
    description: string;
  } | null;
  next_egg_started: boolean;
  already_hatched?: boolean;
}
