"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { parsePuzzleMoves } from "@/lib/chess/puzzleLogic";
import { PUZZLE_THEMES } from "@/lib/chess/themeMap";
import { soundManager } from "@/lib/sounds/soundManager";
import { ArrowLeft, RotateCcw, CheckCircle, Clock, Lightbulb, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";

// --- Constants ---
const BATCH_SIZE = 10;
const REVANCHE_QUEUE_SOFT_CAP = 30;

// --- Interfaces ---
interface RevanchePuzzle {
  queue_id: number;
  puzzle_id: number;
  fen: string;
  moves: string;
  rating: number;
  stage: number; // 1-based: review_count + 1
  added_at: string;
  themes: string[];
}

interface RpcDuePuzzle {
  queue_id: number;
  puzzle_id: number;
  added_at: string;
  review_count: number;
  next_review_at: string;
  puzzle: {
    id: number;
    lichess_id: string;
    fen: string;
    moves: string;
    rating: number;
    themes: string[];
  };
}

interface AttemptResult {
  solved: boolean;
  revanche_resolved: boolean;
  revanche_review_count: number;
  revanche_next_review: string | null;
}

// --- Helpers ---
function mapRpcToRevanche(rpc: RpcDuePuzzle): RevanchePuzzle {
  return {
    queue_id: rpc.queue_id,
    puzzle_id: rpc.puzzle_id,
    fen: rpc.puzzle.fen,
    moves: rpc.puzzle.moves,
    rating: rpc.puzzle.rating,
    stage: rpc.review_count + 1,
    added_at: rpc.added_at,
    themes: rpc.puzzle.themes ?? [],
  };
}

function translateTheme(lichessKey: string): string {
  const theme = PUZZLE_THEMES.find((t) =>
    t.lichessKeys.includes(lichessKey)
  );
  return theme?.name ?? lichessKey;
}

function StageIndicator({ stage, graduated }: { stage: number; graduated?: boolean }) {
  const color = graduated ? "text-yellow-500" : "text-purple-500";
  const emptyColor = "text-zinc-300";
  return (
    <span className="inline-flex gap-0.5 text-sm" title={`${Math.min(stage, 3)}/3 acertos`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stage ? color : emptyColor}>●</span>
      ))}
    </span>
  );
}

function ThemeChips({ themes, max = 3 }: { themes: string[]; max?: number }) {
  if (!themes || themes.length === 0) return null;
  const visible = themes.slice(0, max);
  const remaining = themes.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((t) => (
        <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400">
          {translateTheme(t)}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400">
          +{remaining}
        </span>
      )}
    </div>
  );
}

// --- localStorage helpers for sessionFailCounts ---
const FAIL_COUNTS_KEY = "revanche_fail_counts";
function loadFailCounts(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FAIL_COUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveFailCounts(counts: Record<number, number>) {
  try {
    localStorage.setItem(FAIL_COUNTS_KEY, JSON.stringify(counts));
  } catch { /* ignore */ }
}

// --- Main Component ---
export default function PuzzleRevanchePage() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [puzzles, setPuzzles] = useState<RevanchePuzzle[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [progressPoints, setProgressPoints] = useState(0);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    solved: boolean;
    puzzleId: number;
    graduated: boolean;
    reviewCount: number;
    nextReview: string | null;
  } | null>(null);
  const [solutionDone, setSolutionDone] = useState(false);
  const [sessionFailCounts, setSessionFailCounts] = useState<Record<number, number>>(() => loadFailCounts());
  const [showHint, setShowHint] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref to detect navigation away during in-flight RPC (stale closure guard)
  const currentIdxRef = useRef<number | null>(null);

  const loadRevanche = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setSolutionDone(false);
    setRpcError(null);

    const { data, error } = await supabase.rpc("get_revanche_due");

    if (error || !data) {
      setLoading(false);
      return;
    }

    const d = data as {
      due_puzzles: RpcDuePuzzle[];
      due_count: number;
      total_pending: number;
      resolved_count: number;
      progress_sum: number;
    };

    const mapped = (d.due_puzzles ?? []).map(mapRpcToRevanche);
    // Sort: stage ASC, then next_review_at ASC (already ordered by RPC, but enforce)
    mapped.sort((a, b) => a.stage - b.stage);

    const rc = d.resolved_count ?? 0;
    const ps = d.progress_sum ?? 0;
    setPuzzles(mapped);
    setDueCount(d.due_count ?? 0);
    setTotalPending(d.total_pending ?? 0);
    setResolvedCount(rc);
    setProgressPoints(ps + rc * 3);
    setCurrentIdx(null);
    setVisibleCount(BATCH_SIZE);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    loadRevanche();
  }, [loadRevanche]);

  // Sync currentIdxRef for stale-closure guard in async handlers
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      deferredTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const advanceAfterResult = useCallback(
    (solved: boolean, graduated: boolean, _puzzle: RevanchePuzzle, idx: number) => {
      setResult(null);
      setSolutionDone(false);
      setShowHint(false);
      setRpcError(null);

      // Helper: schedule deferred state update (tracked for cancellation)
      const defer = (fn: () => void) => {
        const t = setTimeout(() => {
          deferredTimersRef.current = deferredTimersRef.current.filter((x) => x !== t);
          fn();
        }, 0);
        deferredTimersRef.current.push(t);
      };

      if (solved) {
        // Bug 2: Only decrement totalPending on graduation
        if (graduated) {
          setTotalPending((prev) => Math.max(0, prev - 1));
          setResolvedCount((prev) => prev + 1);
        }
        // Remove from due list (acertou = sai de "due" independente de graduar)
        setPuzzles((prev) => {
          const next = prev.filter((_, i) => i !== idx);
          if (next.length > 0) {
            const nextIdx = idx < next.length ? idx : 0;
            defer(() => { setCurrentIdx(nextIdx); setAttemptKey((k) => k + 1); });
          } else {
            defer(() => setCurrentIdx(null));
          }
          return next;
        });
        setDueCount((prev) => Math.max(0, prev - 1));
      } else {
        // Failed: move to end of list, reset stage, advance to next
        setPuzzles((prev) => {
          const failed = { ...prev[idx], stage: 1 };
          const rest = prev.filter((_, i) => i !== idx);
          const next = [...rest, failed];
          if (next.length > 0) {
            const nextIdx = idx < rest.length ? idx : 0;
            defer(() => { setCurrentIdx(nextIdx); setAttemptKey((k) => k + 1); });
          } else {
            defer(() => setCurrentIdx(null));
          }
          return next;
        });
      }
    },
    []
  );

  const handlePuzzleComplete = useCallback(
    async (puzzleResult: PuzzleResult) => {
      if (currentIdx === null) return;
      const puzzle = puzzles[currentIdx];
      if (!puzzle) return;

      const allMoves = parsePuzzleMoves(puzzle.moves);

      const { data, error } = await supabase.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle.puzzle_id,
        p_moves: puzzleResult.solved ? allMoves : puzzleResult.movesPlayed,
        p_mode: "revanche",
        p_time_spent_ms: puzzleResult.timeSpentMs,
      });

      // Bug 4: Handle RPC error
      if (error) {
        setRpcError("Erro ao salvar. Tente novamente.");
        return;
      }

      // Guard: user navigated away during RPC (stale closure)
      if (currentIdxRef.current === null) return;

      const attempt = data as AttemptResult;

      // Update weighted progress points
      if (puzzleResult.solved) {
        setProgressPoints((prev) => prev + 1);
      } else {
        // Server reset review_count to 0; lost progress = old review_count
        const lostProgress = puzzle.stage - 1;
        if (lostProgress > 0) setProgressPoints((prev) => Math.max(0, prev - lostProgress));
      }

      // Increment fail count and persist
      if (!puzzleResult.solved) {
        setSessionFailCounts((prev) => {
          const next = { ...prev, [puzzle.puzzle_id]: (prev[puzzle.puzzle_id] || 0) + 1 };
          saveFailCounts(next);
          return next;
        });
      }

      // Play sound (PuzzleBoard already plays move/capture/check sounds during play,
      // but does NOT play a result sound — it only shows text. So we add result sounds here.)
      if (profile && !profile.sound_muted) {
        if (puzzleResult.solved) {
          soundManager.play(attempt.revanche_resolved ? "victory" : "streak");
        }
        // "wrong" sound is already played by PuzzleBoard on incorrect move
      }

      setResult({
        solved: puzzleResult.solved,
        puzzleId: puzzle.puzzle_id,
        graduated: attempt.revanche_resolved,
        reviewCount: attempt.revanche_review_count,
        nextReview: attempt.revanche_next_review,
      });

      if (puzzleResult.solved) {
        // Auto-advance after 2.5s
        autoAdvanceRef.current = setTimeout(() => {
          advanceAfterResult(puzzleResult.solved, attempt.revanche_resolved, puzzle, currentIdx);
        }, 2500);
      }
      // If failed: wait for solution animation + user action (retry/next buttons)
    },
    [currentIdx, puzzles, supabase, profile, advanceAfterResult]
  );

  const handleRetry = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setResult(null);
    setSolutionDone(false);
    setRpcError(null);
    setAttemptKey((k) => k + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (currentIdx === null) return;
    const puzzle = puzzles[currentIdx];
    if (!puzzle) return;
    advanceAfterResult(false, false, puzzle, currentIdx);
  }, [currentIdx, puzzles, advanceAfterResult]);

  const handleSolutionEnd = useCallback(() => {
    setSolutionDone(true);
  }, []);

  // === Session complete screen ===
  if (!loading && currentIdx === null && puzzles.length === 0 && dueCount === 0 && totalPending > 0) {
    const totalCount = resolvedCount + totalPending;
    const totalMax = totalCount * 3;
    const pct = totalMax > 0 ? Math.round(Math.max(0, progressPoints) / totalMax * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Link href="/puzzles" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="h-4 w-4" /> Puzzles
        </Link>
        <div className="rounded-xl border bg-zinc-50 p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="text-lg font-semibold">Sessão concluída!</h2>
          <div className="mx-auto mt-4 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Progresso</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-200">
              <div className="h-2.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {totalPending} puzzle{totalPending !== 1 ? "s" : ""} agendado{totalPending !== 1 ? "s" : ""} para os próximos dias.
          </p>
          <Link
            href="/puzzles/rating"
            className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Ir para Rating
          </Link>
        </div>
      </div>
    );
  }

  // === Playing a puzzle ===
  if (currentIdx !== null && puzzles[currentIdx]) {
    const puzzle = puzzles[currentIdx];
    const isFailed = result && !result.solved;

    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <button
          onClick={() => {
            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
            deferredTimersRef.current.forEach(clearTimeout);
            deferredTimersRef.current = [];
            setCurrentIdx(null);
            setResult(null);
            setSolutionDone(false);
            setShowHint(false);
            setRpcError(null);
          }}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à lista
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <span>Revanche — Rating: {puzzle.rating}</span>
          <StageIndicator stage={puzzle.stage} />
        </div>

        <PuzzleBoard
          key={`${puzzle.puzzle_id}-${attemptKey}`}
          fen={puzzle.fen}
          solutionMoves={puzzle.moves}
          onComplete={handlePuzzleComplete}
          soundEnabled={!profile?.sound_muted}
          premovable={profile?.premove_enabled ?? true}
          showHint={showHint}
          autoShowSolution={isFailed ? true : false}
          onSolutionEnd={handleSolutionEnd}
        />

        {/* Hint button: show after 2+ failures on this puzzle, only while playing */}
        {(sessionFailCounts[puzzle.puzzle_id] || 0) >= 2 && !result && (
          <button
            onClick={() => setShowHint(true)}
            disabled={showHint}
            className={`mx-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showHint
                ? "bg-yellow-100 text-yellow-600 cursor-default"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            {showHint ? "Dica ativada" : "Dica"}
          </button>
        )}

        {/* RPC error */}
        {rpcError && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            <div className="text-sm font-medium">{rpcError}</div>
            <button
              onClick={() => { setRpcError(null); setAttemptKey((k) => k + 1); }}
              className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Result: success */}
        {result && result.solved && (
          <div className={`rounded-lg p-4 text-center ${result.graduated ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-800"}`}>
            {result.graduated ? (
              <>
                <Trophy className="mx-auto mb-1 h-6 w-6 text-yellow-500" />
                <div className="text-lg font-bold">Puzzle dominado!</div>
                <StageIndicator stage={3} graduated />
              </>
            ) : (
              <>
                <div className="text-lg font-bold">
                  {result.reviewCount === 1
                    ? "Boa! Próxima revisão em 1 dia."
                    : "Quase lá! Próxima revisão em 3 dias."}
                </div>
                <StageIndicator stage={result.reviewCount} />
              </>
            )}
            {/* Themes on result */}
            {puzzle.themes.length > 0 && (
              <div className="mt-2 flex justify-center">
                <ThemeChips themes={puzzle.themes} />
              </div>
            )}
          </div>
        )}

        {/* Result: failure */}
        {result && !result.solved && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-800">
            <div className="text-lg font-bold">
              {solutionDone ? "Não foi dessa vez." : "Não foi dessa vez. Veja a solução:"}
            </div>
            {/* Themes after solution ends */}
            {solutionDone && puzzle.themes.length > 0 && (
              <div className="mt-2 flex justify-center">
                <ThemeChips themes={puzzle.themes} />
              </div>
            )}
            {/* Action buttons after solution ends */}
            {solutionDone && (
              <div className="mt-3 flex justify-center gap-3">
                <button
                  onClick={handleRetry}
                  className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  Tentar de novo
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // === List view ===
  const totalCount = resolvedCount + totalPending;
  const totalMax = totalCount * 3;
  const pct = totalMax > 0 ? Math.round(Math.max(0, progressPoints) / totalMax * 100) : 0;
  const visiblePuzzles = puzzles.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Link
        href="/puzzles"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Puzzles
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revanche</h1>
        {puzzles.length > 0 && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            {puzzles.length} disponíve{puzzles.length !== 1 ? "is" : "l"}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Puzzles que você errou ficam disponíveis para revisão.
        Acerte 3 vezes para dominar cada puzzle (1 dia → 3 dias → dominado).
      </p>

      {/* Progress bar */}
      {!loading && totalCount > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Progresso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-zinc-200">
            <div className="h-2.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex gap-3 text-xs text-zinc-400">
            {resolvedCount > 0 && <span>✓ {resolvedCount} dominados</span>}
            <span>↻ {totalPending} em revisão</span>
            <span>○ {puzzles.length} disponíveis agora</span>
          </div>
        </div>
      )}

      {/* Overcap banner */}
      {!loading && totalPending >= REVANCHE_QUEUE_SOFT_CAP && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Você tem muitos puzzles para revisar. Foque nestes primeiro — novos entrarão quando houver espaço.
          </span>
        </div>
      )}

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <div className="animate-pulse text-zinc-400">Carregando...</div>
        </div>
      )}

      {!loading && puzzles.length === 0 && totalPending === 0 && (
        <div className="rounded-xl border bg-zinc-50 p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="text-lg font-semibold">Tudo em dia!</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Nenhum puzzle para revisar no momento. Continue resolvendo puzzles no modo Rating
            e os que você errar aparecerão aqui.
          </p>
          <Link
            href="/puzzles/rating"
            className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Ir para Rating
          </Link>
        </div>
      )}

      {!loading && puzzles.length === 0 && totalPending > 0 && (
        <div className="rounded-xl border bg-zinc-50 p-8 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-purple-400" />
          <h2 className="text-lg font-semibold">Revisões agendadas</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {totalPending} puzzle{totalPending !== 1 ? "s" : ""} agendado{totalPending !== 1 ? "s" : ""}{" "}
            para revisão nos próximos dias.
          </p>
          <Link
            href="/puzzles/rating"
            className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Ir para Rating
          </Link>
        </div>
      )}

      {!loading && puzzles.length > 0 && (
        <div className="space-y-2">
          {visiblePuzzles.map((puzzle, idx) => (
            <button
              key={puzzle.queue_id}
              onClick={() => { setCurrentIdx(idx); setAttemptKey((k) => k + 1); setResult(null); setSolutionDone(false); setRpcError(null); }}
              className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-left transition-colors hover:bg-purple-50"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Rating {puzzle.rating}</span>
                    <StageIndicator stage={puzzle.stage} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {new Date(puzzle.added_at).toLocaleDateString("pt-BR")}
                  </div>
                  {puzzle.themes.length > 0 && (
                    <div className="mt-1">
                      <ThemeChips themes={puzzle.themes} max={3} />
                    </div>
                  )}
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-zinc-400" />
            </button>
          ))}

          {/* Show more button */}
          {puzzles.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((v) => v + BATCH_SIZE)}
              className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50"
            >
              Mostrar mais ({puzzles.length - visibleCount} restantes)
            </button>
          )}
        </div>
      )}

      {!loading && puzzles.length > 0 && totalPending > puzzles.length && (
        <p className="text-center text-xs text-zinc-400">
          +{totalPending - puzzles.length} agendado{totalPending - puzzles.length !== 1 ? "s" : ""} para os próximos dias
        </p>
      )}
    </div>
  );
}
