export type ItemSlot = "head" | "outfit" | "hand" | "background" | "frame" | "pet";
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
