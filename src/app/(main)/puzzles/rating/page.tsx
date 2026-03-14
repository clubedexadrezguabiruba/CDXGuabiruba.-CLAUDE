"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { parsePuzzleMoves } from "@/lib/chess/puzzleLogic";
import { ArrowLeft, SkipForward, Flame, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import TaskCompletionToast from "@/components/gamification/TaskCompletionToast";
import type { TaskProgress } from "@/types/class";

const STREAK_MILESTONES = new Set([
  3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
]);

interface PuzzleData {
  id: number;
  lichess_id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
}

interface RatingState {
  puzzle: PuzzleData | null;
  userRating: number;
  streak: number;
  bestStreak: number;
  skipsAvailable: number;
  loading: boolean;
  error: string | null;
  result: {
    solved: boolean;
    ratingDelta: number;
    ratingAfter: number;
    streak: number;
  } | null;
}

export default function PuzzleRatingPage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const { play } = useSound();
  const [state, setState] = useState<RatingState>({
    puzzle: null,
    userRating: 400,
    streak: 0,
    bestStreak: 0,
    skipsAvailable: 0,
    loading: true,
    error: null,
    result: null,
  });

  const [completedTasks, setCompletedTasks] = useState<TaskProgress[]>([]);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNextPuzzle = useCallback(async () => {
    // Clear any pending auto-advance
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    requestAnimationFrame(() => {
      setState((s) => ({ ...s, loading: true, error: null, result: null }));
    });


    const { data, error } = await supabase.rpc("get_next_puzzle_rating");

    if (error || !data) {
      requestAnimationFrame(() => {
        setState((s) => ({
          ...s,
          loading: false,
          error: error?.message ?? "Erro ao carregar puzzle",
        }));
      });
      return;
    }

    const d = data as {
      puzzle?: PuzzleData;
      error?: string;
      user_rating: number;
      streak: number;
      best_streak: number;
      skips_available: number;
    };

    if (d.error) {
      requestAnimationFrame(() => {
        setState((s) => ({ ...s, loading: false, error: d.error! }));
      });
      return;
    }

    requestAnimationFrame(() => {
      setState((s) => ({
        ...s,
        puzzle: d.puzzle ?? null,
        userRating: d.user_rating,
        streak: d.streak,
        bestStreak: d.best_streak,
        skipsAvailable: d.skips_available,
        loading: false,
      }));
    });
  }, [supabase]);

  useEffect(() => {
    loadNextPuzzle();
  }, [loadNextPuzzle]);

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const handlePuzzleComplete = useCallback(
    async (result: PuzzleResult) => {
      if (!state.puzzle) return;
  

      const allMoves = parsePuzzleMoves(state.puzzle.moves);

      const { data, error } = await supabase.rpc("puzzle_attempt", {
        p_puzzle_id: state.puzzle.id,
        p_moves: result.solved ? allMoves : result.movesPlayed,
        p_mode: "rating",
        p_time_spent_ms: result.timeSpentMs,
      });

      if (error || !data) {
        // Even if RPC fails, show result and auto-advance
        setState((s) => ({
          ...s,
          result: {
            solved: result.solved,
            ratingDelta: 0,
            ratingAfter: s.userRating,
            streak: result.solved ? s.streak + 1 : 0,
          },
        }));

        autoAdvanceRef.current = setTimeout(() => {
          loadNextPuzzle();
        }, 2500);
        return;
      }

      const d = data as {
        solved: boolean;
        rating_before: number;
        rating_after: number;
        rating_delta: number;
        streak: number;
        best_streak: number;
      };

      if (d.solved && STREAK_MILESTONES.has(d.streak)) {
        play("streak");
      }

      // Check task completion
      supabase.rpc("check_my_tasks").then(({ data: taskData }) => {
        const tasks = (taskData ?? []) as TaskProgress[];
        const just = tasks.filter((t) => t.just_completed);
        if (just.length > 0) requestAnimationFrame(() => setCompletedTasks(just));
      });

      setState((s) => ({
        ...s,
        result: {
          solved: d.solved,
          ratingDelta: d.rating_delta,
          ratingAfter: d.rating_after,
          streak: d.streak,
        },
        userRating: d.rating_after,
        streak: d.streak,
        bestStreak: d.best_streak,
      }));

      // Auto-next after delay (1.5s on success for faster flow)
      autoAdvanceRef.current = setTimeout(() => {
        loadNextPuzzle();
      }, 1500);
    },
    [state.puzzle, loadNextPuzzle, play, supabase]
  );

  const handleSkip = useCallback(async () => {

    const { error } = await supabase.rpc("skip_puzzle");
    if (!error) {
      loadNextPuzzle();
    }
  }, [loadNextPuzzle, supabase]);

  return (
    <div className="puzzle-rating-wrap mx-auto max-w-2xl p-4 lg:max-w-5xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/puzzles"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Puzzles
        </Link>
        {/* Mobile: rating + streak inline */}
        <div className="flex items-center gap-3 lg:hidden">
          {state.streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-bold">{state.streak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            {state.userRating}
          </div>
        </div>
      </div>

      {/* Two-column on desktop */}
      <div className="lg:flex lg:gap-6">
        {/* Left: Board area */}
        <div className="flex-1 space-y-3">
          {state.loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-pulse text-zinc-400">Carregando puzzle...</div>
            </div>
          )}

          {state.error && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              {state.error}
              <button
                onClick={loadNextPuzzle}
                className="mt-2 block w-full rounded-md bg-red-100 px-3 py-1.5 text-sm hover:bg-red-200"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {state.puzzle && !state.loading && (
            <>
              <PuzzleBoard
                key={state.puzzle.id}
                fen={state.puzzle.fen}
                solutionMoves={state.puzzle.moves}
                onComplete={handlePuzzleComplete}
                soundEnabled={!profile?.sound_muted}
                premovable={profile?.premove_enabled ?? true}
              />
              <div className="text-center text-xs text-zinc-400">
                Rating: {state.puzzle.rating}
              </div>
            </>
          )}
        </div>

        {/* Right: Info panel */}
        {state.puzzle && !state.loading && (
          <div className="mt-4 space-y-4 lg:mt-0 lg:w-72 lg:shrink-0">
            {/* Desktop: rating card */}
            <div className="hidden rounded-xl border bg-white p-4 lg:block">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Seu Rating
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{state.userRating}</span>
                {state.result && (
                  <span
                    className={`text-sm font-bold ${
                      state.result.ratingDelta >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {state.result.ratingDelta >= 0 ? "+" : ""}
                    {state.result.ratingDelta}
                  </span>
                )}
              </div>
              {state.streak > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-bold">Streak: {state.streak}</span>
                </div>
              )}
            </div>

            {/* Result */}
            {state.result && (
              <div
                className={`rounded-xl p-4 text-center ${
                  state.result.solved
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <div className="text-lg font-bold">
                  {state.result.solved ? "Correto!" : "Incorreto"}
                </div>
                <div className="mt-1 text-sm">
                  Rating:{" "}
                  <span
                    className={
                      state.result.ratingDelta >= 0
                        ? "font-bold text-green-600"
                        : "font-bold text-red-600"
                    }
                  >
                    {state.result.ratingDelta >= 0 ? "+" : ""}
                    {state.result.ratingDelta}
                  </span>{" "}
                  ({state.result.ratingAfter})
                </div>
                {state.result.streak >= 3 && (
                  <div className="mt-1 flex items-center justify-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="font-bold">Streak: {state.result.streak}</span>
                  </div>
                )}
                <button
                  onClick={loadNextPuzzle}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-white"
                >
                  Próximo puzzle
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Skip button */}
            {!state.result && state.skipsAvailable > 0 && (
              <div className="text-center lg:text-left">
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
                >
                  <SkipForward className="h-3 w-3" />
                  Pular ({state.skipsAvailable} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <TaskCompletionToast completedTasks={completedTasks} />
    </div>
  );
}
