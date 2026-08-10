"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface PendingChest {
  id: number;
  source_type: string;
  source_id: string;
  granted_at: string;
}

/**
 * O QUE UM BAÚ DEVOLVE DESDE O BLOCO A (2026-08-10).
 *
 * Não devolve mais item: o catálogo do avatar v2 está sendo apagado
 * (docs/avatar/20-troca-de-pilha-plano.md), e `claim_chest` parou de consultar
 * `items` justamente para não travar quando ele esvaziar.
 *
 * São dois desfechos, e a raridade decide qual — a regra saiu de medir o
 * `claim_chest` antigo 300 vezes, não de escolha:
 *
 *   common            → `isXp`, paga na hora
 *   rare/epic/legend. → `isEgg`, vira ovo de 72h
 */
export interface ClaimResult {
  rarity: string;
  alreadyClaimed: boolean;
  /** Ovo criado — a recompensa chega ao chocar, não agora. */
  isEgg: boolean;
  /** XP pago na hora, já concedido pelo servidor antes desta linha existir. */
  isXp: boolean;
  /** Quanto de XP, quando `isXp`. Zero nos outros casos. */
  xp: number;
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

      const rarity = (json.rarity as string) ?? "common";

      // already_claimed — remove da lista e retorna sem travar. O ChestPanel
      // sai antes de abrir o modal neste caso, então não há o que exibir.
      if (json.already_claimed) {
        requestAnimationFrame(() =>
          setChests((prev) => prev.filter((c) => c.id !== chestId)),
        );
        return { rarity, alreadyClaimed: true, isEgg: false, isXp: false, xp: 0 };
      }

      // sucesso — remove da lista local
      requestAnimationFrame(() =>
        setChests((prev) => prev.filter((c) => c.id !== chestId)),
      );

      if (json.is_egg) {
        return { rarity, alreadyClaimed: false, isEgg: true, isXp: false, xp: 0 };
      }

      return {
        rarity,
        alreadyClaimed: false,
        isEgg: false,
        isXp: true,
        xp: (json.scrapped_xp as number) ?? 0,
      };
    },
    [],
  );

  return { chests, loading, error, openChest, refresh: load };
}
