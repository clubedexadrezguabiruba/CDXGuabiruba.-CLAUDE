"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { InventoryItem, EquippedItem, EquippedMap, ItemSlot, ItemRarity } from "@/types/inventory";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar inventário do usuário com detalhes do item
      const { data: invData, error: invErr } = await supabase
        .from("user_inventory")
        .select("item_id, source, obtained_at, items(id, name, slot, rarity, image_url, description)")
        .order("obtained_at", { ascending: false });

      if (invErr) throw new Error(invErr.message);

      // Buscar itens equipados
      const { data: eqData, error: eqErr } = await supabase
        .from("user_equipped")
        .select("slot, item_id, items(id, name, rarity, image_url)");

      if (eqErr) throw new Error(eqErr.message);

      // Montar mapa de equipados
      const eqMap: EquippedMap = {};
      for (const row of eqData ?? []) {
        const item = row.items as unknown as { id: number; name: string; rarity: string; image_url: string | null };
        if (item) {
          eqMap[row.slot as ItemSlot] = {
            slot: row.slot as ItemSlot,
            id: item.id,
            name: item.name,
            rarity: item.rarity as ItemRarity,
            image_url: item.image_url,
          };
        }
      }

      // Montar lista de inventário com flag equipped
      const equippedIds = new Set(Object.values(eqMap).map((e) => e.id));
      const inventoryItems: InventoryItem[] = (invData ?? []).map((row) => {
        const item = row.items as unknown as {
          id: number; name: string; slot: string; rarity: string; image_url: string | null; description: string;
        };
        return {
          id: item.id,
          name: item.name,
          slot: item.slot as ItemSlot,
          rarity: item.rarity as ItemRarity,
          image_url: item.image_url,
          description: item.description,
          source: row.source,
          obtained_at: row.obtained_at,
          equipped: equippedIds.has(item.id),
        };
      });

      requestAnimationFrame(() => {
        setItems(inventoryItems);
        setEquipped(eqMap);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar inventário";
      requestAnimationFrame(() => setError(msg));
    } finally {
      requestAnimationFrame(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  const equip = useCallback(async (itemId: number) => {
    const { data, error: rpcErr } = await supabase.rpc("equip_item", { p_item_id: itemId });
    if (rpcErr) throw new Error(rpcErr.message);

    const json = data as Record<string, unknown>;
    const itemData = json.item as Record<string, unknown>;
    const slot = json.slot as ItemSlot;

    // Atualizar estado local otimisticamente
    requestAnimationFrame(() => {
      const newEquipped: EquippedItem = {
        slot,
        id: itemData.id as number,
        name: itemData.name as string,
        rarity: itemData.rarity as ItemRarity,
        image_url: (itemData.image_url as string) ?? null,
      };

      setEquipped((prev) => ({ ...prev, [slot]: newEquipped }));
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          equipped: it.id === itemId ? true : it.slot === slot ? false : it.equipped,
        })),
      );
    });

    return json;
  }, []);

  const unequip = useCallback(async (slot: ItemSlot) => {
    const { error: rpcErr } = await supabase.rpc("unequip_slot", { p_slot: slot });
    if (rpcErr) throw new Error(rpcErr.message);

    // Atualizar estado local
    requestAnimationFrame(() => {
      setEquipped((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          equipped: it.slot === slot ? false : it.equipped,
        })),
      );
    });
  }, []);

  return { items, equipped, loading, error, equip, unequip, refresh: load };
}
