"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { parsePuzzleMoves } from "@/lib/chess/puzzleLogic";
import { ArrowLeft, RotateCcw, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface RevanchePuzzle {
  queue_id: number;
  puzzle_id: number;
  fen: string;
  moves: string;
  rating: number;
  stage: number;
  added_at: string;
}

// Shape returned by get_revanche_due RPC
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

function mapRpcToRevanche(rpc: RpcDuePuzzle): RevanchePuzzle {
  return {
    queue_id: rpc.queue_id,
    puzzle_id: rpc.puzzle_id,
    fen: rpc.puzzle.fen,
    moves: rpc.puzzle.moves,
    rating: rpc.puzzle.rating,
    stage: rpc.review_count + 1, // 0-based review_count → 1-based stage
    added_at: rpc.added_at,
  };
}

export default function PuzzleRevanchePage() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [puzzles, setPuzzles] = useState<RevanchePuzzle[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    solved: boolean;
    puzzleId: number;
  } | null>(null);

  const loadRevanche = useCallback(async () => {
    setLoading(true);
    setResult(null);


    const { data, error } = await supabase.rpc("get_revanche_due");

    if (error || !data) {
      setLoading(false);
      return;
    }

    const d = data as {
      due_puzzles: RpcDuePuzzle[];
      due_count: number;
      total_pending: number;
    };

    const mapped = (d.due_puzzles ?? []).map(mapRpcToRevanche);
    setPuzzles(mapped);
    setTotalPending(d.total_pending ?? 0);
    setCurrentIdx(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadRevanche();
  }, [loadRevanche]);

  const handlePuzzleComplete = useCallback(
    async (puzzleResult: PuzzleResult) => {
      if (currentIdx === null) return;
      const puzzle = puzzles[currentIdx];
      if (!puzzle) return;

  
      const allMoves = parsePuzzleMoves(puzzle.moves);

      await supabase.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle.puzzle_id,
        p_moves: puzzleResult.solved ? allMoves : puzzleResult.movesPlayed,
        p_mode: "revanche",
        p_time_spent_ms: puzzleResult.timeSpentMs,
      });

      setResult({
        solved: puzzleResult.solved,
        puzzleId: puzzle.puzzle_id,
      });

      // Auto advance after delay
      setTimeout(() => {
        setResult(null);
        // Remove the completed puzzle from list
        setPuzzles((prev) => prev.filter((_, i) => i !== currentIdx));
        setCurrentIdx(null);
        if (puzzleResult.solved) {
          setTotalPending((prev) => Math.max(0, prev - 1));
        }
      }, 2000);
    },
    [currentIdx, puzzles, supabase]
  );

  // === Playing a puzzle ===
  if (currentIdx !== null && puzzles[currentIdx]) {
    const puzzle = puzzles[currentIdx];

    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <button
          onClick={() => {
            setCurrentIdx(null);
            setResult(null);
          }}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à lista
        </button>

        <div className="text-center text-xs text-zinc-400">
          Revanche — Rating: {puzzle.rating} — Estágio {puzzle.stage}/3
        </div>

        <PuzzleBoard
          key={puzzle.puzzle_id}
          fen={puzzle.fen}
          solutionMoves={puzzle.moves}
          onComplete={handlePuzzleComplete}
          soundEnabled={!profile?.sound_muted}
        />

        {result && (
          <div
            className={`rounded-lg p-4 text-center ${
              result.solved
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <div className="text-lg font-bold">
              {result.solved ? "Correto! Puzzle removido da fila." : "Incorreto. Voltará para revisão."}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Seu rating não foi alterado.
            </div>
          </div>
        )}
      </div>
    );
  }

  // === List view ===
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
        {totalPending > 0 && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            {totalPending} pendente{totalPending !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Puzzles que você errou ficam disponíveis imediatamente para revisão.
        Acerte para avançar no ciclo (1 dia → 3 dias → concluído).
      </p>

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
          {puzzles.map((puzzle, idx) => (
            <button
              key={puzzle.queue_id}
              onClick={() => setCurrentIdx(idx)}
              className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-left transition-colors hover:bg-purple-50"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">
                    Puzzle — Rating {puzzle.rating}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    Adicionado em {new Date(puzzle.added_at).toLocaleDateString("pt-BR")}
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                      Estágio {puzzle.stage}/3
                    </span>
                  </div>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-zinc-400" />
            </button>
          ))}
        </div>
      )}

      {!loading && puzzles.length > 0 && totalPending > puzzles.length && (
        <p className="text-center text-xs text-zinc-400">
          +{totalPending - puzzles.length} puzzle{totalPending - puzzles.length !== 1 ? "s" : ""} agendado{totalPending - puzzles.length !== 1 ? "s" : ""} para os próximos dias
        </p>
      )}
    </div>
  );
}
