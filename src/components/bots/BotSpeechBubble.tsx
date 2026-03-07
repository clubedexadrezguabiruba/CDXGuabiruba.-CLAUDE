"use client";

import { useEffect, useState } from "react";

interface BotSpeechBubbleProps {
  message: string | null;
  /** Auto-dismiss after this many ms (default 4000). */
  dismissMs?: number;
}

export default function BotSpeechBubble({
  message,
  dismissMs = 4000,
}: BotSpeechBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    // Use rAF so the setState fires asynchronously (not synchronous in effect body)
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), dismissMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [message, dismissMs]);

  if (!message) return null;

  return (
    <div
      className={`rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
