"use client";

import type { LessonExerciseSection } from "@/types/lesson";

export type ExerciseState = "waiting" | "checking" | "correct" | "wrong";

interface LessonExerciseProps {
  exercise: LessonExerciseSection;
  topicLabel: string;
  state: ExerciseState;
  hintRevealed: boolean;
  playingColor: "white" | "black";
}

/** Exercise panel — Chess Universe style. Board + RPC logic controlled by parent. */
export default function LessonExercise({
  exercise,
  topicLabel,
  state,
  hintRevealed,
  playingColor,
}: LessonExerciseProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-400">{topicLabel}</p>

      {/* "Seu lance" header with color indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`h-4 w-4 rounded-full border ${
            playingColor === "white"
              ? "border-zinc-300 bg-white"
              : "border-zinc-600 bg-zinc-800"
          }`}
        />
        <span className="text-sm font-bold text-zinc-800">Seu lance</span>
      </div>

      <p className="text-sm text-zinc-700">{exercise.instruction}</p>

      {/* Hint revealed */}
      {hintRevealed && exercise.hint && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <p>{exercise.hint}</p>
          {state === "waiting" && (
            <p className="mt-1 text-xs text-amber-600">
              Usar dica limita a 2 estrelas no máximo
            </p>
          )}
        </div>
      )}

      {/* Correct — after text */}
      {state === "correct" && exercise.after_text && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {exercise.after_text}
        </div>
      )}

      {/* Wrong — subtle retry message */}
      {state === "wrong" && (
        <p className="text-sm font-medium text-red-600">Tente novamente!</p>
      )}

      {state === "checking" && (
        <p className="text-sm text-zinc-500">Verificando...</p>
      )}
    </div>
  );
}
