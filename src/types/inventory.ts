// O que sobrou do inventário do avatar v2: só o ovo.
//
// Os tipos de item (`ItemSlot`, `ItemRarity`, `InventoryItem`, `EquippedItem`,
// `EquippedMap`) saíram no Bloco D da troca de pilha, junto com as 3 tabelas que
// o Bloco B apagou do banco. Ovo e baú continuam existindo e continuam falando
// em raridade — daí `HatchResult.xp_bonus` e o `rarity` dentro de `pet`.
//
// Ver docs/avatar/20-troca-de-pilha-plano.md.

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
