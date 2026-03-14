"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface PendingChest {
  id: number;
  source_type: string;
  source_id: string;
  granted_at: string;
}

export interface ClaimedItem {
  id: number;
  name: string;
  slot: string;
  rarity: string;
  image_url: string | null;
  description: string;
}

export interface ClaimResult {
  item: ClaimedItem;
  rarity: string;
  alreadyClaimed: boolean;
  scrapped: boolean;
  scrappedXp: number;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function fetchChests(): Promise<PendingChest[]> {
  const { data, error } = await supabase
    .from("user_chests")
    .select("id, source_type, source_id, granted_at")
    .eq("claimed", false)
    .order("granted_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PendingChest[];
}

export function useChests() {
  const [chests, setChests] = useState<PendingChest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChests();
      requestAnimationFrame(() => setChests(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar baús";
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

  const openChest = useCallback(
    async (chestId: number): Promise<ClaimResult> => {
      const { data, error: rpcError } = await supabase.rpc("claim_chest", {
        p_chest_id: chestId,
      });

      if (rpcError) throw new Error(rpcError.message);

      const json = data as Record<string, unknown>;

      // already_claimed — remove da lista e retorna sem travar
      if (json.already_claimed) {
        requestAnimationFrame(() =>
          setChests((prev) => prev.filter((c) => c.id !== chestId)),
        );
        return {
          item: {
            id: json.item_id as number,
            name: "",
            slot: "",
            rarity: (json.rarity as string) ?? "common",
            image_url: null,
            description: "",
          },
          rarity: (json.rarity as string) ?? "common",
          alreadyClaimed: true,
          scrapped: false,
          scrappedXp: 0,
        };
      }

      // sucesso — remove da lista local
      requestAnimationFrame(() =>
        setChests((prev) => prev.filter((c) => c.id !== chestId)),
      );

      const item = json.item as Record<string, unknown>;
      return {
        item: {
          id: item.id as number,
          name: item.name as string,
          slot: item.slot as string,
          rarity: item.rarity as string,
          image_url: (item.image_url as string) ?? null,
          description: (item.description as string) ?? "",
        },
        rarity: json.rarity as string,
        alreadyClaimed: false,
        scrapped: (json.scrapped as boolean) ?? false,
        scrappedXp: (json.scrapped_xp as number) ?? 0,
      };
    },
    [],
  );

  return { chests, loading, error, openChest, refresh: load };
}
