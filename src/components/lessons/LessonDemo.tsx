"use client";

import type { LessonDemoSection } from "@/types/lesson";

interface LessonDemoProps {
  section: LessonDemoSection;
  topicLabel: string;
  annotation?: string;
  isPlaying: boolean;
}

/** Renders demo info panel (desktop sidebar). Board & auto-play controlled by parent. */
export default function LessonDemo({
  section,
  topicLabel,
  annotation,
  isPlaying,
}: LessonDemoProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-400">{topicLabel}</p>
      {section.title && (
        <h3 className="text-lg font-bold text-zinc-900">{section.title}</h3>
      )}
      {section.description && (
        <p className="text-sm text-zinc-600">{section.description}</p>
      )}

      {annotation && (
        <p className="text-sm text-zinc-600 italic">{annotation}</p>
      )}

      {isPlaying && (
        <p className="text-sm text-zinc-500 animate-pulse">Reproduzindo...</p>
      )}
    </div>
  );
}
