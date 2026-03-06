"use client";

import Link from "next/link";
import type { LessonMapEntry, ReviewGateEntry } from "@/types/lesson";
import { TRAILS } from "@/types/lesson";

interface LessonMapProps {
  lessons: LessonMapEntry[];
  reviewGates: ReviewGateEntry[];
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-xs">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? "text-yellow-400" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function LessonBubble({ lesson }: { lesson: LessonMapEntry }) {
  const isClickable =
    lesson.status === "available" ||
    lesson.status === "in_progress" ||
    lesson.status === "completed";

  const bubble = (
    <div
      className={`
        flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all
        ${lesson.status === "locked"
          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 opacity-50"
          : lesson.status === "available"
            ? "cursor-pointer border-green-400 bg-white shadow-md hover:shadow-lg hover:scale-105"
            : lesson.status === "in_progress"
              ? "cursor-pointer border-blue-400 bg-blue-50 shadow-md hover:shadow-lg hover:scale-105"
              : "cursor-pointer border-green-300 bg-green-50 hover:shadow-md hover:scale-105"
        }
      `}
    >
      {lesson.status === "locked" && (
        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {lesson.status === "available" && (
        <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      {lesson.status === "in_progress" && (
        <div className="relative flex items-center justify-center">
          <svg className="h-8 w-8" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray={`${(lesson.steps_completed / lesson.total_steps) * 100}, 100`}
            />
          </svg>
          <span className="absolute text-xs font-bold text-blue-600">
            {lesson.steps_completed}/{lesson.total_steps}
          </span>
        </div>
      )}
      {lesson.status === "completed" && (
        <>
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <StarDisplay count={lesson.stars} />
        </>
      )}
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/aulas/${lesson.id}`} className="flex flex-col items-center gap-1">
        {bubble}
        <span className="max-w-[80px] truncate text-center text-xs text-zinc-600">
          {lesson.trail_order}. {lesson.title}
        </span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title="Complete a aula anterior">
      {bubble}
      <span className="max-w-[80px] truncate text-center text-xs text-zinc-400">
        {lesson.trail_order}. {lesson.title}
      </span>
    </div>
  );
}

function ReviewGateBubble({
  trail,
  gate,
  allComplete,
}: {
  trail: string;
  gate: ReviewGateEntry | undefined;
  allComplete: boolean;
}) {
  const passed = gate?.passed ?? false;
  const isAvailable = allComplete && !passed;

  const bubble = (
    <div
      className={`
        flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all
        ${passed
          ? "cursor-pointer border-yellow-400 bg-yellow-50"
          : isAvailable
            ? "cursor-pointer border-yellow-400 bg-white shadow-md hover:shadow-lg hover:scale-105"
            : "cursor-not-allowed border-zinc-200 bg-zinc-100 opacity-50"
        }
      `}
    >
      <svg className={`h-7 w-7 ${passed ? "text-yellow-500" : isAvailable ? "text-yellow-600" : "text-zinc-400"}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {passed && (
        <span className="text-xs font-bold text-yellow-600">
          {gate?.best_score}/10
        </span>
      )}
    </div>
  );

  if (isAvailable || passed) {
    return (
      <Link href={`/aulas/review/${trail}`} className="flex flex-col items-center gap-1">
        {bubble}
        <span className="text-center text-xs text-zinc-600">Desafio Final</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title="Complete todas as aulas da trilha">
      {bubble}
      <span className="text-center text-xs text-zinc-400">Desafio Final</span>
    </div>
  );
}

export default function LessonMap({ lessons, reviewGates }: LessonMapProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-900">Aulas</h1>

      {TRAILS.map((trail) => {
        const trailLessons = lessons.filter((l) => l.trail === trail.key);
        if (trailLessons.length === 0) return null;

        const gate = reviewGates.find((g) => g.trail === trail.key);
        const allComplete = trailLessons.every((l) => l.status === "completed");
        const isTrailLocked = trailLessons.every((l) => l.status === "locked");

        return (
          <div key={trail.key} className={isTrailLocked ? "opacity-60" : ""}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: trail.color }}
              />
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  {trail.name}
                </h2>
                <p className="text-sm text-zinc-500">{trail.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {trailLessons.map((lesson) => (
                <LessonBubble key={lesson.id} lesson={lesson} />
              ))}
              <ReviewGateBubble
                trail={trail.key}
                gate={gate}
                allComplete={allComplete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
