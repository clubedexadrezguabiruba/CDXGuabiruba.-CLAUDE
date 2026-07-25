"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { ArrowLeft, Heart, Timer, Trophy, Zap, Shield, Flame } from "lucide-react";
import Link from "next/link";
import ActivityToasts from "@/components/gamification/ActivityToasts";

interface RushPuzzle {
  id: number;
  fen: string;
  moves: string;
  rating: number;
}

type RushPhase = "select" | "playing" | "gameover";
type RushMode = "3min" | "5min" | "resistencia";

interface RushRun {
  id: number;
  score: number;
  best_streak: number;
  mode: string;
  played_at: string;
  avg_time_per_puzzle: number | null;
}

interface PendingAttempt {
  promise: PromiseLike<{ data: unknown; error: unknown }>;
  args: {
    p_puzzle_id: number;
    p_moves: string[];
    p_mode: string;
    p_time_spent_ms: number;
    p_rush_run_id: number;
  };
}

const MODE_CONFIG = {
  "3min": { icon: Zap, label: "3 Minutos", description: "Resolva o máximo em 3 min" },
  "5min": { icon: Timer, label: "5 Minutos", description: "Resolva o máximo em 5 min" },
  resistencia: { icon: Shield, label: "Resistência", description: "Sem tempo. Dificuldade crescente" },
} as const;

function getTier(score: number) {
  if (score >= 20) return { label: "Mestre", bg: "bg-purple-100", text: "text-purple-700", flame: 3 };
  if (score >= 15) return { label: "Expert", bg: "bg-red-100", text: "text-red-700", flame: 2 };
  if (score >= 10) return { label: "Difícil", bg: "bg-orange-100", text: "text-orange-700", flame: 1 };
  if (score >= 5) return { label: "Médio", bg: "bg-yellow-100", text: "text-yellow-700", flame: 0 };
  return { label: "Fácil", bg: "bg-green-100", text: "text-green-700", flame: 0 };
}

function getModeLabel(mode: string) {
  if (mode === "resistencia") return "Resistência";
  return mode;
}

export default function PuzzleRushPage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const { play } = useSound();

  const [phase, setPhase] = useState<RushPhase>("select");
  const [mode, setMode] = useState<RushMode>("3min");
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
  const [tierBanner, setTierBanner] = useState<string | null>(null);
  const [toastTrigger, setToastTrigger] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tierBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const pendingAttemptsRef = useRef<PendingAttempt[]>([]);
  const prevTierRef = useRef<string>("Fácil");

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

      const settled = await Promise.allSettled(
        pendingAttemptsRef.current.map((a) => a.promise)
      );

      for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        const failed =
          r.status === "rejected" ||
          (r.status === "fulfilled" &&
            (r.value as { error: unknown }).error != null);
        if (failed) {
          await supabase.rpc(
            "puzzle_attempt",
            pendingAttemptsRef.current[i].args
          );
        }
      }

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

      // Trigger activity toasts (missions, achievements, tasks, level-up)
      setToastTrigger((c) => c + 1);
    },
    [runId, play, supabase]
  );

  const startRush = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.rpc("start_rush", { p_mode: mode });

    if (error || !data) {
      setStartError(error?.message ?? "Erro ao iniciar. Tente novamente.");
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
    setTierBanner(null);
    pendingAttemptsRef.current = [];
    prevTierRef.current = "Fácil";

    if (mode !== "resistencia") {
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
        }
      }, 1000);
    } else {
      startTimeRef.current = Date.now();
      setTimeLeft(-1); // sentinel: no timer
    }

    setLoading(false);
    setPhase("playing");
  }, [mode, play, supabase]);

  // Timer expiry check (only for timed modes)
  useEffect(() => {
    if (phase === "playing" && mode !== "resistencia" && timeLeft <= 0) {
      endRush(score, bestStreak, lives);
    }
  }, [timeLeft, phase, mode, score, bestStreak, lives, endRush]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      if (tierBannerTimeoutRef.current) clearTimeout(tierBannerTimeoutRef.current);
    };
  }, []);

  const handlePuzzleComplete = useCallback(
    (result: PuzzleResult) => {
      const currentPuzzle = puzzles[currentIdx];
      if (!currentPuzzle || !runId) return;

      const args = {
        p_puzzle_id: currentPuzzle.id,
        // Sempre os lances REALMENTE jogados — ver comentário em rating/page.tsx
        p_moves: result.movesPlayed,
        p_mode: mode === "resistencia" ? "resistencia" : ("rush" as string),
        p_time_spent_ms: result.timeSpentMs,
        p_rush_run_id: runId,
      };
      const promise = supabase.rpc("puzzle_attempt", args);
      pendingAttemptsRef.current.push({ promise, args });

      const nextIdx = currentIdx + 1;
      // Values used in the finally block for advance/endRush
      let finalScore = score;
      let finalBestStreak = bestStreak;
      let finalLives = lives;
      let shouldEnd = false;

      try {
        if (result.solved) {
          const newScore = score + 1;
          const newStreak = streak + 1;
          const newBestStreak = Math.max(bestStreak, newStreak);
          finalScore = newScore;
          finalBestStreak = newBestStreak;
          setScore(newScore);
          setStreak(newStreak);
          setBestStreak(newBestStreak);

          if (nextIdx >= puzzles.length) {
            shouldEnd = true;
          } else {
            // Tier transition for resistencia (based on score, not index)
            if (mode === "resistencia") {
              const newTier = getTier(newScore);
              if (newTier.label !== prevTierRef.current) {
                prevTierRef.current = newTier.label;
                setTierBanner(newTier.label);
                play("streak");
                if (tierBannerTimeoutRef.current) clearTimeout(tierBannerTimeoutRef.current);
                tierBannerTimeoutRef.current = setTimeout(() => setTierBanner(null), 2000);
              }
            }
          }
        } else {
          setStreak(0);
          const newLives = lives - 1;
          finalLives = newLives;
          setLives(newLives);

          if (newLives <= 0) {
            shouldEnd = true;
            finalLives = 0;
          } else if (nextIdx >= puzzles.length) {
            shouldEnd = true;
          }
        }
      } catch (e) {
        console.error("[Rush] handlePuzzleComplete error:", e);
      } finally {
        // ALWAYS advance or end — never leave the board stuck
        if (shouldEnd) {
          endRush(finalScore, finalBestStreak, finalLives);
        } else if (nextIdx < puzzles.length) {
          if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
          advanceTimeoutRef.current = setTimeout(
            () => setCurrentIdx(nextIdx),
            result.solved ? 400 : 800
          );
        } else {
          endRush(finalScore, finalBestStreak, finalLives);
        }
      }
    },
    [puzzles, currentIdx, runId, score, streak, bestStreak, lives, mode, endRush, play, supabase]
  );

  const formatTime = (s: number) => {
    const min = Math.floor(Math.max(0, s) / 60);
    const sec = Math.max(0, s) % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const getRecordForMode = (m: RushMode) => {
    if (!profile) return 0;
    if (m === "3min") return profile.rush_3min_record ?? 0;
    if (m === "5min") return profile.rush_5min_record ?? 0;
    return profile.rush_resistencia_record ?? 0;
  };

  // === SELECT MODE ===
  if (phase === "select") {
    const filteredHistory = history.filter((r) => r.mode === mode);

    return (
      <div className="mx-auto max-w-2xl p-4">
        <Link
          href="/puzzles"
          className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Puzzles
        </Link>

        <div className="mx-auto max-w-md">
          {/* Control panel */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Puzzle Rush</h1>
              <p className="mt-1 text-sm text-zinc-500">
                3 erros = Game Over. Resolva o máximo!
              </p>
            </div>

            {/* Record for selected mode */}
            <div className="flex items-center gap-4 rounded-lg border bg-white px-4 py-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Recorde
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {getRecordForMode(mode)}
                </div>
              </div>
            </div>

            {/* Mode cards */}
            <div className="space-y-3">
              {(["3min", "5min", "resistencia"] as const).map((m) => {
                const config = MODE_CONFIG[m];
                const ModeIcon = config.icon;
                const isSelected = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-orange-400 bg-orange-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <ModeIcon className={`h-6 w-6 ${isSelected ? "text-orange-500" : "text-zinc-400"}`} />
                    <div>
                      <div className="font-semibold">{config.label}</div>
                      <div className="text-xs text-zinc-500">{config.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={startRush}
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Carregando..." : "Jogar!"}
            </button>

            {startError && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {startError}
              </div>
            )}

            {/* History filtered by mode */}
            {filteredHistory.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-zinc-600">Últimas Partidas</h2>
                <div className="space-y-1">
                  {filteredHistory.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{getModeLabel(run.mode)}</span>
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
        </div>
      </div>
    );
  }

  // === PLAYING ===
  if (phase === "playing") {
    const currentPuzzle = puzzles[currentIdx];
    const isResistencia = mode === "resistencia";
    const tier = isResistencia ? getTier(score) : null;

    return (
      <div className="mx-auto max-w-2xl p-4 lg:max-w-5xl">
        <div className="lg:flex lg:gap-6">
          {/* Left: Board — `relative` para o banner de tier poder ser overlay */}
          <div className="relative flex-1 space-y-3">
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

              {/* Timer or Tier badge */}
              {isResistencia && tier ? (
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors duration-500 ${tier.bg} ${tier.text} ${
                    tierBanner ? "animate-bounce" : ""
                  }`}
                >
                  {tier.flame >= 1 && (
                    <Flame
                      className={`${
                        tier.flame === 1 ? "h-4 w-4" : tier.flame === 2 ? "h-5 w-5 fill-current" : "h-6 w-6 fill-current animate-pulse"
                      }`}
                    />
                  )}
                  {tier.label}
                </div>
              ) : (
                <div
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    timeLeft <= 10
                      ? "animate-pulse bg-red-100 text-red-600"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              )}

              <div className="text-sm font-bold text-orange-600">
                Score: {score}
              </div>
            </div>

            {/* Tier promotion banner — OVERLAY, nunca no fluxo.
                Antes era um bloco no fluxo logo acima do PuzzleBoard: ao
                aparecer (e 2s depois ao sair) empurrava o tabuleiro para baixo
                e de volta. O board se movia sob o cursor no exato momento em
                que o jogador acabara de acertar e ia jogar de novo — e era o
                que fazia o e2e E1 falhar sempre no puzzle 6 (score = 5, o
                primeiro limiar de tier).
                `pointer-events-none` garante que nunca intercepte um clique. */}
            {tierBanner && (
              <div
                className={`pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 animate-bounce rounded-lg px-4 py-2 text-center text-lg font-bold shadow-lg ${getTier(score).bg} ${getTier(score).text}`}
              >
                NÍVEL: {tierBanner}!
              </div>
            )}

            {currentPuzzle && (
              <PuzzleBoard
                key={currentPuzzle.id}
                fen={currentPuzzle.fen}
                solutionMoves={currentPuzzle.moves}
                onComplete={handlePuzzleComplete}
                soundEnabled={!profile?.sound_muted}
                premovable={profile?.premove_enabled ?? true}
              />
            )}

            <div className="text-center text-xs text-zinc-400">
              Puzzle {currentIdx + 1} / {puzzles.length} — Rating: {currentPuzzle?.rating}
            </div>
          </div>

          {/* Right: Stats panel (desktop) */}
          <div className="mt-4 hidden space-y-4 lg:mt-0 lg:block lg:w-80 lg:shrink-0">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {isResistencia ? "Resistência" : `Rush ${mode}`}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{score}</div>
                  <div className="text-xs text-zinc-500">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{streak}</div>
                  <div className="text-xs text-zinc-500">Streak</div>
                </div>
              </div>
              {isResistencia && tier && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-center text-sm font-bold ${tier.bg} ${tier.text}`}>
                  {tier.flame >= 1 && <Flame className="mr-1 inline h-4 w-4" />}
                  Nível: {tier.label}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Vidas</div>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-6 w-6 ${
                      i < lives ? "fill-red-500 text-red-500" : "text-zinc-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === GAME OVER ===
  const isResistencia = mode === "resistencia";
  const maxTier = gameoverData ? getTier(gameoverData.score) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:max-w-5xl">
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border bg-white p-6 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-orange-500" />
          <h1 className="text-2xl font-bold">
            {isResistencia ? "Fim da Resistência!" : "Fim do Rush!"}
          </h1>

          {gameoverData?.isRecord && (
            <div className="mx-auto mt-2 w-fit rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-700">
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
            {isResistencia && maxTier && (
              <div>
                <div className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${maxTier.bg} ${maxTier.text}`}>
                  {maxTier.label}
                </div>
                <div className="mt-1 text-xs text-zinc-500">Nível Máximo</div>
              </div>
            )}
            {gameoverData?.avgTime && (
              <div>
                <div className="text-lg font-bold">
                  {(gameoverData.avgTime / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-zinc-500">Tempo Médio</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
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
      <ActivityToasts triggerCount={toastTrigger} />
    </div>
  );
}
