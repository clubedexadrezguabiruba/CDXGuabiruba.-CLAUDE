"use client";

import { useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import type { Mission } from "@/hooks/useMissions";

const STORAGE_KEY = "mission_toast_seen";

function loadSeen(): Set<number> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveSeen(ids: Set<number>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

interface MissionCompletionToastProps {
  missions: Mission[];
}

export default function MissionCompletionToast({
  missions,
}: MissionCompletionToastProps) {
  const seenRef = useRef<Set<number> | null>(null);
  const [visible, setVisible] = useState<Mission[]>([]);

  useEffect(() => {
    const completedIds = new Set(
      missions.filter((m) => m.completed).map((m) => m.id)
    );

    // Primeiro mount: carregar do sessionStorage + registrar atuais
    if (seenRef.current === null) {
      const stored = loadSeen();
      // Unir stored + completedIds (missões já completadas ao carregar)
      for (const id of completedIds) stored.add(id);
      seenRef.current = stored;
      saveSeen(stored);
      return;
    }

    // Detectar missões recém-completadas
    const newlyCompleted = missions.filter(
      (m) => m.completed && !seenRef.current!.has(m.id)
    );

    if (newlyCompleted.length > 0) {
      soundManager.play("notify");
      requestAnimationFrame(() => setVisible(newlyCompleted));

      const timer = setTimeout(() => {
        requestAnimationFrame(() => setVisible([]));
      }, 5000);

      // Atualizar ref + storage
      for (const id of completedIds) seenRef.current.add(id);
      saveSeen(seenRef.current);
      return () => clearTimeout(timer);
    }

    // Atualizar ref + storage com novos IDs
    for (const id of completedIds) seenRef.current.add(id);
    saveSeen(seenRef.current);
  }, [missions]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {visible.map((mission) => (
        <div
          key={mission.id}
          className="pointer-events-auto animate-scale-in rounded-xl border border-green-300 bg-green-50 px-5 py-3 shadow-lg"
        >
          <div className="text-center">
            <div className="text-sm font-bold text-green-700">
              Missão Completada!
            </div>
            <div className="mt-1 text-base font-semibold text-green-900">
              {mission.title}
            </div>
            <div className="mt-0.5 text-xs text-green-600">
              +{mission.reward_xp} XP
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
