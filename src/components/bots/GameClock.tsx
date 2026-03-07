"use client";

import { useRef, useEffect, useState } from "react";
import type { PlayerColor } from "@/types/bot";

interface UseGameClockOptions {
  whiteTimeMs: number;
  blackTimeMs: number;
  activeColor: PlayerColor | null;
  incrementMs: number;
  onTimeout: (color: PlayerColor) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Headless game clock hook — returns display values for each color. */
export function useGameClock({
  whiteTimeMs,
  blackTimeMs,
  activeColor,
  incrementMs,
  onTimeout,
}: UseGameClockOptions) {
  const [displayWhite, setDisplayWhite] = useState(whiteTimeMs);
  const [displayBlack, setDisplayBlack] = useState(blackTimeMs);

  const remainingRef = useRef({ white: whiteTimeMs, black: blackTimeMs });
  const turnStartRef = useRef<number | null>(null);
  const activeColorRef = useRef(activeColor);
  const onTimeoutRef = useRef(onTimeout);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    remainingRef.current = { white: whiteTimeMs, black: blackTimeMs };
    const raf = requestAnimationFrame(() => {
      setDisplayWhite(whiteTimeMs);
      setDisplayBlack(blackTimeMs);
    });
    return () => cancelAnimationFrame(raf);
  }, [whiteTimeMs, blackTimeMs]);

  useEffect(() => {
    tickRef.current = () => {
      const color = activeColorRef.current;
      if (!color) {
        rafRef.current = requestAnimationFrame(() => tickRef.current());
        return;
      }

      const now = performance.now();
      const elapsed = turnStartRef.current ? now - turnStartRef.current : 0;
      const remaining = remainingRef.current[color] - elapsed;

      if (remaining <= 0) {
        remainingRef.current[color] = 0;
        if (color === "white") setDisplayWhite(0);
        else setDisplayBlack(0);
        onTimeoutRef.current(color);
        return;
      }

      if (color === "white") setDisplayWhite(remaining);
      else setDisplayBlack(remaining);

      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  useEffect(() => {
    const prevColor = activeColorRef.current;

    if (prevColor && prevColor !== activeColor && turnStartRef.current) {
      const elapsed = performance.now() - turnStartRef.current;
      remainingRef.current[prevColor] = Math.max(
        0,
        remainingRef.current[prevColor] - elapsed + incrementMs
      );
      if (prevColor === "white") setDisplayWhite(remainingRef.current.white);
      else setDisplayBlack(remainingRef.current.black);
    }

    activeColorRef.current = activeColor;
    turnStartRef.current = activeColor ? performance.now() : null;
  }, [activeColor, incrementMs]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => tickRef.current());
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    whiteTime: formatTime(displayWhite),
    blackTime: formatTime(displayBlack),
    whiteMs: displayWhite,
    blackMs: displayBlack,
  };
}

/** Inline clock badge for one player. */
export function ClockBadge({
  time,
  timeMs,
  active,
}: {
  time: string;
  timeMs: number;
  active: boolean;
}) {
  const isLow = timeMs < 30000;

  return (
    <div
      className={`rounded-lg px-3 py-1 text-center font-mono text-base font-bold transition-colors duration-150 ${
        active
          ? isLow
            ? "bg-red-600 text-white"
            : "bg-zinc-800 text-white"
          : "bg-zinc-200 text-zinc-600"
      }`}
    >
      {time}
    </div>
  );
}

/** Legacy wrapper — kept for backward compat but prefer useGameClock + ClockBadge. */
interface GameClockProps {
  whiteTimeMs: number;
  blackTimeMs: number;
  activeColor: PlayerColor | null;
  incrementMs: number;
  onTimeout: (color: PlayerColor) => void;
}

export default function GameClock(props: GameClockProps) {
  const { whiteTime, blackTime, whiteMs, blackMs } = useGameClock(props);

  return (
    <div className="flex items-center gap-2">
      <ClockBadge time={blackTime} timeMs={blackMs} active={props.activeColor === "black"} />
      <ClockBadge time={whiteTime} timeMs={whiteMs} active={props.activeColor === "white"} />
    </div>
  );
}
