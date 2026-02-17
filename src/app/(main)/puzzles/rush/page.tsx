"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { parsePuzzleMoves } from "@/lib/chess/puzzleLogic";
import { ArrowLeft, Heart, Timer, Trophy } from "lucide-react";
import Link from "next/link";

interface RushPuzzle {
  id: number;
  fen: string;
  moves: string;
  rating: number;
}

type RushPhase = "select" | "playing" | "gameover";

interface RushRun {
  id: number;
  score: number;
  best_streak: number;
  mode: string;
  played_at: string;
  avg_time_per_puzzle: number | null;
}

export default function PuzzleRushPage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const { play } = useSound();

  const [phase, setPhase] = useState<RushPhase>("select");
  const [mode, setMode] = useState<"3min" | "5min">("3min");
  const [runId, setRunId] = useState<number | null>(null);
  const [puzzles, setPuzzles] = useState<RushPuzzle[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [history, setHistory] = useState<RushRun[]>([]);
  const [gameoverData, setGameoverData] = useState<{
    score: number;
    bestStreak: number;
    avgTime: number | null;
    isRecord: boolean;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Load history
  useEffect(() => {
    async function loadHistory() {

      const { data } = await supabase
        .from("puzzle_rush_runs")
        .select("id, score, best_streak, mode, played_at, avg_time_per_puzzle")
        .eq("status", "completed")
        .order("played_at", { ascending: false })
        .limit(10);
      if (data) setHistory(data as RushRun[]);
    }
    loadHistory();
  }, [phase, supabase]);

  const endRush = useCallback(
    async (finalScore: number, finalStreak: number, finalLives: number) => {
      if (!runId) return;


      const { data } = await supabase.rpc("end_rush", {
        p_rush_run_id: runId,
        p_score: finalScore,
        p_best_streak: finalStreak,
        p_lives_remaining: finalLives,
      });

      if (data) {
        const d = data as {
          score: number;
          best_streak: number;
          avg_time_per_puzzle: number | null;
          is_new_record: boolean;
        };
        setGameoverData({
          score: d.score,
          bestStreak: d.best_streak,
          avgTime: d.avg_time_per_puzzle,
          isRecord: d.is_new_record,
        });
      }

      play("rush-gameover");
      setPhase("gameover");
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [runId, play, supabase]
  );

  const startRush = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.rpc("start_rush", { p_mode: mode });

    if (error || !data) {
      setStartError(error?.message ?? "Erro ao iniciar rush. Tente novamente.");
      setLoading(false);
      return;
    }
    setStartError(null);

    const d = data as {
      run_id: number;
      puzzles: RushPuzzle[];
    };

    setRunId(d.run_id);
    setPuzzles(d.puzzles);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(3);
    setGameoverData(null);

    const totalSeconds = mode === "3min" ? 180 : 300;
    setTimeLeft(totalSeconds);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = totalSeconds - elapsed;
      setTimeLeft(remaining);

      if (remaining <= 10 && remaining > 0) {
        play("rush-tick");
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        // Will trigger gameover via useEffect
      }
    }, 1000);

    setLoading(false);
    setPhase("playing");
  }, [mode, play, supabase]);

  // Timer expiry check
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) {
      endRush(score, bestStreak, lives);
    }
  }, [timeLeft, phase, score, bestStreak, lives, endRush]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePuzzleComplete = useCallback(
    async (result: PuzzleResult) => {
      const currentPuzzle = puzzles[currentIdx];
      if (!currentPuzzle || !runId) return;


      const allMoves = parsePuzzleMoves(currentPuzzle.moves);

      await supabase.rpc("puzzle_attempt", {
        p_puzzle_id: currentPuzzle.id,
        p_moves: result.solved ? allMoves : result.movesPlayed,
        p_mode: "rush",
        p_time_spent_ms: result.timeSpentMs,
        p_rush_run_id: runId,
      });

      if (result.solved) {
        const newScore = score + 1;
        const newStreak = streak + 1;
        const newBestStreak = Math.max(bestStreak, newStreak);
        setScore(newScore);
        setStreak(newStreak);
        setBestStreak(newBestStreak);

        // Next puzzle
        if (currentIdx + 1 < puzzles.length) {
          setTimeout(() => setCurrentIdx(currentIdx + 1), 400);
        } else {
          endRush(newScore, newBestStreak, lives);
        }
      } else {
        setStreak(0);
        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          endRush(score, bestStreak, 0);
        } else {
          // Next puzzle
          if (currentIdx + 1 < puzzles.length) {
            setTimeout(() => setCurrentIdx(currentIdx + 1), 800);
          } else {
            endRush(score, bestStreak, newLives);
          }
        }
      }
    },
    [puzzles, currentIdx, runId, score, streak, bestStreak, lives, endRush, supabase]
  );

  const formatTime = (s: number) => {
    const min = Math.floor(Math.max(0, s) / 60);
    const sec = Math.max(0, s) % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // === SELECT MODE ===
  if (phase === "select") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Link
          href="/puzzles"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Puzzles
        </Link>

        <h1 className="text-2xl font-bold">Puzzle Rush</h1>
        <p className="text-sm text-zinc-500">
          Resolva o máximo de puzzles antes do tempo acabar. 3 erros = Game Over.
        </p>

        <div className="flex gap-4">
          {(["3min", "5min"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl border-2 p-6 text-center transition-colors ${
                mode === m
                  ? "border-orange-400 bg-orange-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <Timer className="mx-auto mb-2 h-8 w-8 text-orange-500" />
              <div className="text-lg font-bold">{m === "3min" ? "3 Minutos" : "5 Minutos"}</div>
            </button>
          ))}
        </div>

        <button
          onClick={startRush}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Carregando..." : "Iniciar Rush!"}
        </button>

        {startError && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {startError}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Últimas Partidas</h2>
            <div className="space-y-1">
              {history.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{run.mode}</span>
                  <span>Score: <strong>{run.score}</strong></span>
                  <span className="text-xs text-zinc-500">
                    {new Date(run.played_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === PLAYING ===
  if (phase === "playing") {
    const currentPuzzle = puzzles[currentIdx];

    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${
                  i < lives ? "fill-red-500 text-red-500" : "text-zinc-300"
                }`}
              />
            ))}
          </div>
          <div
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              timeLeft <= 10
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm font-bold text-orange-600">
            Score: {score}
          </div>
        </div>

        {currentPuzzle && (
          <PuzzleBoard
            key={currentPuzzle.id}
            fen={currentPuzzle.fen}
            solutionMoves={currentPuzzle.moves}
            onComplete={handlePuzzleComplete}
            soundEnabled={!profile?.sound_muted}
          />
        )}

        <div className="text-center text-xs text-zinc-400">
          Puzzle {currentIdx + 1} / {puzzles.length} — Rating: {currentPuzzle?.rating}
        </div>
      </div>
    );
  }

  // === GAME OVER ===
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="rounded-xl border bg-white p-6 text-center">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-orange-500" />
        <h1 className="text-2xl font-bold">Fim do Rush!</h1>

        {gameoverData?.isRecord && (
          <div className="mt-2 rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-700">
            Novo Recorde Pessoal!
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {gameoverData?.score ?? score}
            </div>
            <div className="text-xs text-zinc-500">Puzzles Resolvidos</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{gameoverData?.bestStreak ?? bestStreak}</div>
            <div className="text-xs text-zinc-500">Melhor Streak</div>
          </div>
          {gameoverData?.avgTime && (
            <div className="col-span-2">
              <div className="text-lg font-bold">
                {(gameoverData.avgTime / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-zinc-500">Tempo Médio por Puzzle</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setPhase("select");
            setGameoverData(null);
          }}
          className="flex-1 rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600"
        >
          Jogar Novamente
        </button>
        <Link
          href="/puzzles"
          className="flex-1 rounded-xl border py-3 text-center font-medium hover:bg-zinc-50"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
