"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { EGG_HATCH_HOURS, EGG_STAGES } from "@/lib/constants/items";
import type { Egg, HatchResult } from "@/types/inventory";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type EggStage = (typeof EGG_STAGES)[number];

function getEggStage(egg: Egg): EggStage {
  if (!egg.hatch_start_at) return EGG_STAGES[0];
  const elapsedMs = Date.now() - new Date(egg.hatch_start_at).getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  let stage: EggStage = EGG_STAGES[0];
  for (const s of EGG_STAGES) {
    if (elapsedHours >= s.hours) stage = s;
  }
  return stage;
}

function getTimeRemaining(egg: Egg): { hours: number; minutes: number; totalMs: number } {
  if (!egg.hatch_start_at) return { hours: EGG_HATCH_HOURS, minutes: 0, totalMs: EGG_HATCH_HOURS * 3600000 };
  const targetMs = new Date(egg.hatch_start_at).getTime() + EGG_HATCH_HOURS * 3600000;
  const remainingMs = Math.max(0, targetMs - Date.now());
  const totalMinutes = Math.ceil(remainingMs / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMs: remainingMs,
  };
}

function isReady(egg: Egg): boolean {
  if (!egg.hatch_start_at) return false;
  const elapsedMs = Date.now() - new Date(egg.hatch_start_at).getTime();
  return elapsedMs >= EGG_HATCH_HOURS * 3600000;
}

export function useEggs() {
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("get_eggs");
      if (rpcError) throw new Error(rpcError.message);
      const parsed = (data as Egg[]) ?? [];
      requestAnimationFrame(() => setEggs(parsed));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar ovos";
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

  // Timer: update every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeEgg = useMemo(() => eggs.find((e) => e.status === "hatching") ?? null, [eggs]);
  const queuedEggs = useMemo(() => eggs.filter((e) => e.status === "queued"), [eggs]);

  const activeStage = useMemo(
    () => (activeEgg ? getEggStage(activeEgg) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEgg, tick],
  );

  const activeTimeRemaining = useMemo(
    () => (activeEgg ? getTimeRemaining(activeEgg) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEgg, tick],
  );

  const activeIsReady = useMemo(
    () => (activeEgg ? isReady(activeEgg) : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEgg, tick],
  );

  const hatchEgg = useCallback(
    async (eggId: number): Promise<HatchResult> => {
      const { data, error: rpcError } = await supabase.rpc("hatch_egg", {
        p_egg_id: eggId,
      });

      if (rpcError) throw new Error(rpcError.message);

      const json = data as Record<string, unknown>;

      if (json.already_hatched) {
        requestAnimationFrame(() =>
          setEggs((prev) => prev.filter((e) => e.id !== eggId)),
        );
        return {
          hatched: false,
          is_xp_egg: false,
          xp_bonus: 0,
          pet: null,
          next_egg_started: false,
          already_hatched: true,
        };
      }

      // Refresh egg list to pick up next egg state
      await load();

      return {
        hatched: true,
        is_xp_egg: (json.is_xp_egg as boolean) ?? false,
        xp_bonus: (json.xp_bonus as number) ?? 0,
        pet: (json.pet as HatchResult["pet"]) ?? null,
        next_egg_started: (json.next_egg_started as boolean) ?? false,
      };
    },
    [load],
  );

  return {
    eggs,
    activeEgg,
    queuedEggs,
    eggCount: eggs.length,
    loading,
    error,
    hatchEgg,
    activeStage,
    activeTimeRemaining,
    activeIsReady,
    getEggStage,
    getTimeRemaining,
    isReady: isReady,
    refresh: load,
  };
}
