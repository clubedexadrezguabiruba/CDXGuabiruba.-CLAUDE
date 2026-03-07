"use client";

import { useEffect, useRef } from "react";

interface MoveListProps {
  history: string[];
}

export default function MoveList({ history }: MoveListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  // Group into pairs (white, black)
  const pairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  if (pairs.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-zinc-400">
        Nenhum lance ainda
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto p-2 text-sm">
      {pairs.map((pair, idx) => {
        const isLast = idx === pairs.length - 1;
        return (
          <div
            key={pair.num}
            className={`flex gap-1 rounded px-1.5 py-0.5 ${
              isLast ? "bg-yellow-100" : ""
            }`}
          >
            <span className="w-7 shrink-0 text-right text-xs text-zinc-400">
              {pair.num}.
            </span>
            <span className="w-16 font-medium text-zinc-800">{pair.white}</span>
            <span className="w-16 font-medium text-zinc-800">
              {pair.black || ""}
            </span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
