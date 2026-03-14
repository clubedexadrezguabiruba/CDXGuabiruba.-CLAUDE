"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { soundManager } from "@/lib/sounds/soundManager";
import { fetchMissions } from "@/hooks/useMissions";
import type { Mission, NewAchievement } from "@/hooks/useMissions";
import type { TaskProgress } from "@/types/class";

// ── Types ────────────────────────────────────────────────────

type ToastItem =
  | { type: "task"; data: TaskProgress }
  | { type: "mission"; data: Mission }
  | { type: "achievement"; data: NewAchievement }
  | { type: "levelup"; level: number };

interface ActivityToastsProps {
  /** Modo fetch: incrementar para disparar busca */
  triggerCount?: number;
  /** Modo preloaded: dados já carregados (dashboard) */
  preloadedData?: {
    missions: Mission[];
    newAchievements: NewAchievement[];
    level: number;
  };
}

// ── localStorage helpers (namespaced por userId) ─────────────

const STORAGE_PREFIX = "cdx:mission_toast_seen:";

function loadSeenMissions(userId: string): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveSeenMissions(userId: string, ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

// ── Toast display duration / gap ─────────────────────────────

const TOAST_DURATION = 3000;
const TOAST_GAP = 500;

// ── Component ────────────────────────────────────────────────

export default function ActivityToasts({
  triggerCount = 0,
  preloadedData,
}: ActivityToastsProps) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const [exiting, setExiting] = useState(false);

  const prevLevelRef = useRef<number | null>(null);
  const seenMissionsRef = useRef<Set<number> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const initializedRef = useRef(false);

  // ── Initialize: fetch userId + level baseline ──────────────

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (preloadedData) {
      // Dashboard mode: arm baseline from props
      prevLevelRef.current = preloadedData.level;
      // userId still needed for localStorage
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          userIdRef.current = user.id;
          seenMissionsRef.current = loadSeenMissions(user.id);
          // Mark currently completed missions as seen (first-mount silencing)
          const completedIds = preloadedData.missions
            .filter((m) => m.completed)
            .map((m) => m.id);
          for (const id of completedIds) seenMissionsRef.current.add(id);
          saveSeenMissions(user.id, seenMissionsRef.current);
        }
      });
      return;
    }

    // Activity page mode: fetch userId + level for baseline
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userIdRef.current = user.id;
      seenMissionsRef.current = loadSeenMissions(user.id);

      supabase
        .from("users")
        .select("level")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) prevLevelRef.current = data.level;
        });
    });
  }, [preloadedData]);

  // ── Build queue from results ───────────────────────────────

  const buildQueue = useCallback(
    (
      missions: Mission[],
      newAchievements: NewAchievement[],
      completedTasks: TaskProgress[],
      level: number
    ): ToastItem[] => {
      const items: ToastItem[] = [];

      // 1. Tasks
      for (const t of completedTasks) {
        if (t.just_completed) {
          items.push({ type: "task", data: t });
        }
      }

      // 2. Missions (deduplicate via seenMissionsRef)
      if (seenMissionsRef.current && userIdRef.current) {
        const newlyCompleted = missions.filter(
          (m) => m.completed && !seenMissionsRef.current!.has(m.id)
        );
        for (const m of newlyCompleted) {
          items.push({ type: "mission", data: m });
          seenMissionsRef.current.add(m.id);
        }
        saveSeenMissions(userIdRef.current, seenMissionsRef.current);
      }

      // 3. Achievements (already server-deduplicated)
      for (const a of newAchievements) {
        items.push({ type: "achievement", data: a });
      }

      // 4. Level-up
      if (
        prevLevelRef.current !== null &&
        level > prevLevelRef.current
      ) {
        items.push({ type: "levelup", level });
      }
      prevLevelRef.current = level;

      return items;
    },
    []
  );

  // ── Trigger: fetch mode ────────────────────────────────────

  useEffect(() => {
    if (triggerCount === 0 || preloadedData) return;

    const myRequestId = ++requestIdRef.current;

    async function fetchAll() {
      const supabase = createClient();

      const [missionsResult, tasksResult, levelResult] = await Promise.all([
        fetchMissions(),
        supabase.rpc("check_my_tasks"),
        userIdRef.current
          ? supabase
              .from("users")
              .select("level")
              .eq("id", userIdRef.current)
              .single()
          : Promise.resolve({ data: null }),
      ]);

      // Stale guard: if a newer trigger arrived, discard everything
      if (requestIdRef.current !== myRequestId) return;

      const missions = missionsResult.ok ? missionsResult.state.missions : [];
      const newAchievements = missionsResult.ok
        ? missionsResult.state.newAchievements
        : [];
      const tasks = ((tasksResult.data ?? []) as TaskProgress[]);
      const level = levelResult.data?.level ?? prevLevelRef.current ?? 1;

      const items = buildQueue(missions, newAchievements, tasks, level);
      if (items.length > 0) {
        setQueue((prev) => [...prev, ...items]);
      }
    }

    fetchAll();
  }, [triggerCount, preloadedData, buildQueue]);

  // ── Trigger: preloaded mode (dashboard) ────────────────────

  const preloadedProcessedRef = useRef(false);

  useEffect(() => {
    if (!preloadedData || preloadedProcessedRef.current) return;
    if (!seenMissionsRef.current) return; // Wait for init

    preloadedProcessedRef.current = true;

    // For preloaded, check_my_tasks is not needed (dashboard doesn't have tasks)
    // But we do need to check missions, achievements, and level-up
    const items = buildQueue(
      preloadedData.missions,
      preloadedData.newAchievements,
      [], // no tasks in dashboard context
      preloadedData.level
    );
    if (items.length > 0) {
      setQueue(items);
    }
  }, [preloadedData, buildQueue]);

  // ── Queue processor: show 1 at a time ──────────────────────

  useEffect(() => {
    if (current !== null || queue.length === 0) return;

    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(next);
    setExiting(false);

    // Play sound
    if (next.type === "levelup") {
      soundManager.play("streak");
    } else {
      soundManager.play("notify");
    }

    // Auto-dismiss after duration
    const hideTimer = setTimeout(() => {
      setExiting(true);
      const removeTimer = setTimeout(() => {
        setCurrent(null);
      }, TOAST_GAP);
      return () => clearTimeout(removeTimer);
    }, TOAST_DURATION);

    return () => clearTimeout(hideTimer);
  }, [current, queue]);

  // ── Render ─────────────────────────────────────────────────

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ${
          exiting ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-scale-in"
        }`}
      >
        {current.type === "task" && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-5 py-3 shadow-lg">
            <div className="text-center">
              <div className="text-sm font-bold text-green-700">
                Tarefa Concluída!
              </div>
              <div className="mt-1 text-base font-semibold text-green-900">
                {current.data.title}
              </div>
            </div>
          </div>
        )}

        {current.type === "mission" && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-5 py-3 shadow-lg">
            <div className="text-center">
              <div className="text-sm font-bold text-green-700">
                Missão Completada!
              </div>
              <div className="mt-1 text-base font-semibold text-green-900">
                {current.data.title}
              </div>
              <div className="mt-0.5 text-xs text-green-600">
                +{current.data.reward_xp} XP
              </div>
            </div>
          </div>
        )}

        {current.type === "achievement" && (
          <div className="rounded-xl border border-purple-300 bg-purple-50 px-5 py-3 shadow-lg">
            <div className="text-center">
              <div className="text-sm font-bold text-purple-700">
                Insígnia Desbloqueada!
              </div>
              <div className="mt-1 text-base font-semibold text-purple-900">
                {current.data.title}
              </div>
              <div className="mt-0.5 text-xs text-purple-600">
                {current.data.description}
                {current.data.reward_xp > 0 &&
                  ` (+${current.data.reward_xp} XP)`}
                {current.data.reward_egg && " + 🥚 Ovo recebido!"}
              </div>
            </div>
          </div>
        )}

        {current.type === "levelup" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-3 shadow-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-700">
                Parabéns! Nível {current.level}!
              </div>
              <div className="mt-1 text-sm text-amber-600">
                Você ganhou um baú de nível!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
