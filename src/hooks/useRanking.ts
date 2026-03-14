"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RankingData, RankingEntry, RankingType } from "@/types/ranking";

interface UseRankingResult {
  entries: RankingEntry[];
  myRank: RankingEntry | null;
  isHidden: boolean;
  activeTab: RankingType;
  loading: boolean;
  switchTab: (tab: RankingType) => void;
}

export function useRanking(
  initialType: RankingType,
  initialData: RankingData | null
): UseRankingResult {
  const [activeTab, setActiveTab] = useState<RankingType>(initialType);
  const [entries, setEntries] = useState<RankingEntry[]>(
    initialData?.entries ?? []
  );
  const [myRank, setMyRank] = useState<RankingEntry | null>(
    initialData?.my_rank ?? null
  );
  const [isHidden, setIsHidden] = useState(initialData?.is_hidden ?? false);
  const [loading, setLoading] = useState(false);

  // Cache por tab para evitar re-fetch
  const cacheRef = useRef<Partial<Record<RankingType, RankingData>>>({
    [initialType]: initialData ?? { entries: [], my_rank: null, is_hidden: false },
  });

  const switchTab = useCallback(
    async (tab: RankingType) => {
      setActiveTab(tab);

      // Se já tem cache, usa
      const cached = cacheRef.current[tab];
      if (cached) {
        setEntries(cached.entries);
        setMyRank(cached.my_rank);
        setIsHidden(cached.is_hidden);
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc(
          "get_ranking_with_position",
          { p_type: tab, p_limit: 50 }
        );

        if (error) {
          console.error("Erro ao buscar ranking:", error);
          return;
        }

        const result = data as RankingData;
        cacheRef.current[tab] = result;
        setEntries(result.entries ?? []);
        setMyRank(result.my_rank ?? null);
        setIsHidden(result.is_hidden ?? false);
      } catch (e) {
        console.error("Erro ao buscar ranking:", e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { entries, myRank, isHidden, activeTab, loading, switchTab };
}
