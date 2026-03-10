"use client";

import { useEffect, useRef } from "react";

interface MoveListProps {
  history: string[];
  activeIndex?: number | null;
  onClickMove?: (halfMoveIndex: number) => void;
}

export default function MoveList({ history, activeIndex, onClickMove }: MoveListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll: to active move if navigating, to end otherwise
  useEffect(() => {
    if (activeIndex != null && containerRef.current) {
      const el = containerRef.current.querySelector("[data-active='true']");
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return;
      }
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length, activeIndex]);

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

  const isNavigating = activeIndex != null;
  const lastHalfMove = history.length - 1;

  function moveClasses(halfMove: number) {
    const isActive = activeIndex === halfMove;
    const isLastAndNotNavigating = !isNavigating && halfMove === lastHalfMove;
    return `w-16 rounded px-1 font-medium ${
      isActive
        ? "bg-blue-200 text-blue-900"
        : isLastAndNotNavigating
          ? "bg-yellow-100 text-zinc-800"
          : "text-zinc-800"
    } ${onClickMove ? "cursor-pointer hover:bg-zinc-100" : ""}`;
  }

  return (
    <div ref={containerRef} className="max-h-80 overflow-y-auto p-2 text-sm">
      {pairs.map((pair) => {
        const whiteIdx = (pair.num - 1) * 2;
        const blackIdx = whiteIdx + 1;
        return (
          <div key={pair.num} className="flex gap-1 px-1.5 py-0.5">
            <span className="w-7 shrink-0 text-right text-xs text-zinc-400">
              {pair.num}.
            </span>
            <span
              data-active={activeIndex === whiteIdx || undefined}
              className={moveClasses(whiteIdx)}
              onClick={onClickMove ? () => onClickMove(whiteIdx) : undefined}
            >
              {pair.white}
            </span>
            {pair.black && (
              <span
                data-active={activeIndex === blackIdx || undefined}
                className={moveClasses(blackIdx)}
                onClick={onClickMove ? () => onClickMove(blackIdx) : undefined}
              >
                {pair.black}
              </span>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
