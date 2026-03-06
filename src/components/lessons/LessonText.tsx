"use client";

import type { LessonTextSection } from "@/types/lesson";

interface LessonTextProps {
  section: LessonTextSection;
  topicLabel: string;
}

/** Parse simple **bold** markdown into React nodes */
function parseBody(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/** Text panel — board is controlled by parent (LessonViewer). */
export default function LessonText({ section, topicLabel }: LessonTextProps) {
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-400">{topicLabel}</p>
      {section.title && (
        <h3 className="mb-2 text-lg font-bold text-zinc-900">
          {section.title}
        </h3>
      )}
      <p className="leading-relaxed text-zinc-700">{parseBody(section.body)}</p>
    </div>
  );
}
