"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import PuzzleBoard, { type PuzzleResult } from "@/components/chess/PuzzleBoard";
import { getThemeByKey, getRandomLichessThemeKey } from "@/lib/chess/themeMap";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PuzzleData {
  id: number;
  lichess_id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
}

type Difficulty = "all" | "easy" | "medium" | "hard";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  all: "Todos",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  all: "bg-zinc-100 text-zinc-700",
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export default function CategoriaTemaPuzzlePage() {
  const params = useParams();
  const tema = params.tema as string;
  const themeInfo = getThemeByKey(tema);
  const supabase = useSupabase();
  const { profile } = useUser();

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ solved: boolean } | null>(null);
  const [solved, setSolved] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPuzzle = useCallback(async () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    requestAnimationFrame(() => {
      setLoading(true);
      setError(null);
      setResult(null);
    });


    // Use random key for multi-key themes (e.g., mateIn3plus)
    const lichessKey = getRandomLichessThemeKey(tema);
    const { data, error: rpcError } = await supabase.rpc(
      "get_next_puzzle_category",
      { p_theme: lichessKey, p_difficulty: difficulty }
    );

    if (rpcError || !data) {
      requestAnimationFrame(() => {
        setError(rpcError?.message ?? "Erro ao carregar");
        setLoading(false);
      });
      return;
    }

    const d = data as { puzzle?: PuzzleData; error?: string };
    if (d.error) {
      const errMsg = d.error;
      requestAnimationFrame(() => {
        setError(errMsg);
        setLoading(false);
      });
      return;
    }

    requestAnimationFrame(() => {
      setPuzzle(d.puzzle ?? null);
      setLoading(false);
    });
  }, [tema, difficulty, supabase]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const handleComplete = useCallback(
    async (puzzleResult: PuzzleResult) => {
      if (!puzzle) return;
  

      await supabase.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle.id,
        // Sempre os lances REALMENTE jogados — ver comentário em rating/page.tsx
        p_moves: puzzleResult.movesPlayed,
        p_mode: "category",
        p_time_spent_ms: puzzleResult.timeSpentMs,
      });

      setResult({ solved: puzzleResult.solved });
      if (puzzleResult.solved) setSolved((s) => s + 1);

      autoAdvanceRef.current = setTimeout(() => loadPuzzle(), 2000);
    },
    [puzzle, loadPuzzle, supabase]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Link
          href="/puzzles/categorias"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Categorias
        </Link>
        <span className="text-sm text-zinc-500">Resolvidos: {solved}</span>
      </div>

      <h1 className="text-xl font-bold">
        {themeInfo?.name ?? tema}
      </h1>

      {/* Difficulty filter */}
      <div className="flex gap-2">
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              difficulty === d
                ? DIFFICULTY_COLORS[d] + " ring-2 ring-offset-1 ring-zinc-300"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-pulse text-zinc-400">Carregando puzzle...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
          <button
            onClick={loadPuzzle}
            className="mt-2 block w-full rounded-md bg-red-100 px-3 py-1.5 text-sm hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {puzzle && !loading && (
        <>
          <div className="text-center text-xs text-zinc-400">
            Rating: {puzzle.rating}
          </div>
          <PuzzleBoard
            key={puzzle.id}
            fen={puzzle.fen}
            solutionMoves={puzzle.moves}
            onComplete={handleComplete}
            soundEnabled={!profile?.sound_muted}
            premovable={profile?.premove_enabled ?? true}
          />
          {result && (
            <div
              className={`rounded-lg p-3 text-center text-sm font-medium ${
                result.solved
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {result.solved ? "Correto!" : "Incorreto"} — Seu rating não foi alterado
              <button
                onClick={loadPuzzle}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:bg-white"
              >
                Próximo puzzle
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
