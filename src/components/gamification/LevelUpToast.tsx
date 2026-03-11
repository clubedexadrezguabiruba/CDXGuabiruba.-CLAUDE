"use client";

import { useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/sounds/soundManager";

interface LevelUpToastProps {
  level: number;
  levelsGained?: number;
}

/**
 * Toast de level-up. Detecta mudança de nível via comparação com valor anterior.
 * Usa useRef para evitar mostrar ao montar pela primeira vez.
 * Som: usa 'streak' como placeholder até ter level-up.mp3 dedicado.
 */
export default function LevelUpToast({ level }: LevelUpToastProps) {
  const prevLevel = useRef<number | null>(null);
  const [show, setShow] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(level);

  useEffect(() => {
    // Primeiro render: memoriza nível mas não mostra toast
    if (prevLevel.current === null) {
      prevLevel.current = level;
      return;
    }

    // Nível mudou e aumentou
    if (level > prevLevel.current) {
      const newLevel = level;
      prevLevel.current = level;
      soundManager.play("streak"); // placeholder para level-up

      requestAnimationFrame(() => {
        setDisplayLevel(newLevel);
        setShow(true);
      });

      const timer = setTimeout(() => {
        requestAnimationFrame(() => setShow(false));
      }, 4000);
      return () => clearTimeout(timer);
    }

    prevLevel.current = level;
  }, [level]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto animate-bounce rounded-xl border border-amber-300 bg-amber-50 px-6 py-3 shadow-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-amber-700">
            Parabéns! Nível {displayLevel}!
          </div>
          <div className="mt-1 text-sm text-amber-600">
            Você ganhou um baú de nível!
          </div>
        </div>
      </div>
    </div>
  );
}
