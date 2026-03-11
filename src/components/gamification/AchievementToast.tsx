"use client";

import { useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";
import type { NewAchievement } from "@/hooks/useMissions";

interface AchievementToastProps {
  achievements: NewAchievement[];
}

/**
 * Mostra toast para conquistas recém-desbloqueadas.
 * Só dispara quando a lista muda de vazio para preenchido.
 * Som: notify.mp3 como placeholder.
 */
export default function AchievementToast({
  achievements,
}: AchievementToastProps) {
  const prevLen = useRef(0);
  const [visible, setVisible] = useState<NewAchievement[]>([]);

  useEffect(() => {
    if (achievements.length > 0 && prevLen.current === 0) {
      soundManager.play("notify");
      requestAnimationFrame(() => {
        setVisible(achievements);
      });

      const timer = setTimeout(() => {
        requestAnimationFrame(() => setVisible([]));
      }, 5000);
      prevLen.current = achievements.length;
      return () => clearTimeout(timer);
    }
    prevLen.current = achievements.length;
  }, [achievements]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {visible.map((ach) => (
          <div
            key={ach.key}
            className="animate-bounce rounded-xl border border-purple-300 bg-purple-50 px-5 py-3 shadow-lg"
          >
            <div className="text-center">
              <div className="text-sm font-bold text-purple-700">
                Insígnia Desbloqueada!
              </div>
              <div className="mt-1 text-base font-semibold text-purple-900">
                {ach.title}
              </div>
              <div className="mt-0.5 text-xs text-purple-600">
                {ach.description}
                {ach.reward_xp > 0 && ` (+${ach.reward_xp} XP)`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
