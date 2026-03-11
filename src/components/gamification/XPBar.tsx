"use client";

interface XPBarProps {
  xp: number;
  level: number;
}

/** XP necessário para avançar do nível N → N+1: round(100 * 1.05^(N-1)) */
function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.05, level - 1));
}

export default function XPBar({ xp, level }: XPBarProps) {
  const xpNeeded = xpForLevel(level);
  const pct = Math.min(100, Math.round((xp / xpNeeded) * 100));

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">Nv. {level}</span>
          <span className="text-sm text-zinc-500">
            {xp} / {xpNeeded} XP
          </span>
        </div>
        <span className="text-xs font-medium text-zinc-400">{pct}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
