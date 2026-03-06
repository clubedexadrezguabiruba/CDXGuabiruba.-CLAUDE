"use client";

import { useState, useCallback, useRef } from "react";
import type {
  LessonExerciseSection,
  SubmitReviewGateResult,
} from "@/types/lesson";
import LessonBoard from "@/components/chess/LessonBoard";
import type { LessonBoardHandle } from "@/components/chess/LessonBoard";
import Confetti from "./Confetti";
import { useSupabase } from "@/hooks/useSupabase";
import { useSound } from "@/hooks/useSound";
import Link from "next/link";
import { Chess } from "chess.js";
import { toDests } from "@/lib/chess/puzzleLogic";

export interface ReviewExercise {
  lessonId: number;
  stepIndex: number;
  exercise: LessonExerciseSection;
}

interface ReviewGateProps {
  trail: string;
  trailName: string;
  exercises: ReviewExercise[];
}

type Phase = "quiz" | "submitting" | "result";

/** Apply UCI move on FEN, returning new FEN. */
function applyUciOnFen(fen: string, uci: string): string {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  try {
    const chess = new Chess(fen);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    chess.move({ from, to, promotion });
    return chess.fen();
  } catch {
    return fen;
  }
}

export default function ReviewGate({
  trail,
  trailName,
  exercises,
}: ReviewGateProps) {
  const supabase = useSupabase();
  const { play } = useSound();
  const boardRef = useRef<LessonBoardHandle>(null);

  const total = exercises.length;

  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<
    { lessonId: number; stepIndex: number; move: string; correct: boolean }[]
  >([]);
  const [boardFen, setBoardFen] = useState(exercises[0]?.exercise.fen ?? "");
  const [interactive, setInteractive] = useState(true);
  const [feedbackState, setFeedbackState] = useState<
    "waiting" | "correct" | "wrong"
  >("waiting");
  const submittingMoveRef = useRef(false);
  const [boardShake, setBoardShake] = useState(false);

  // Result state
  const [result, setResult] = useState<SubmitReviewGateResult | null>(null);

  const correctCount = answers.filter((a) => a.correct).length;

  const handleMove = useCallback(
    (uci: string) => {
      if (submittingMoveRef.current || feedbackState !== "waiting") return;
      submittingMoveRef.current = true;

      const ex = exercises[currentIdx];
      const isCorrect = ex.exercise.expected_moves.includes(uci);

      // Show the moved piece
      const newFen = applyUciOnFen(ex.exercise.fen, uci);
      setBoardFen(newFen);
      setInteractive(false);

      if (isCorrect) {
        setFeedbackState("correct");
        play("move");

        // Green highlight
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        boardRef.current?.setConfig({
          drawable: {
            autoShapes: [
              { orig: from as never, brush: "green" },
              { orig: to as never, brush: "green" },
            ],
          },
        });

        const newAnswers = [
          ...answers,
          {
            lessonId: ex.lessonId,
            stepIndex: ex.stepIndex,
            move: uci,
            correct: true,
          },
        ];
        setAnswers(newAnswers);

        // Auto-advance after 1.5s
        setTimeout(() => {
          boardRef.current?.setConfig({ drawable: { autoShapes: [] } });
          advanceOrSubmit(newAnswers);
        }, 1500);
      } else {
        setFeedbackState("wrong");
        play("wrong");

        boardRef.current?.setConfig({
          drawable: {
            autoShapes: [
              { orig: uci.slice(0, 2) as never, brush: "red" },
            ],
          },
        });

        setBoardShake(true);
        setTimeout(() => setBoardShake(false), 300);

        const newAnswers = [
          ...answers,
          {
            lessonId: ex.lessonId,
            stepIndex: ex.stepIndex,
            move: uci,
            correct: false,
          },
        ];
        setAnswers(newAnswers);

        // Auto-advance after 1.5s (no retry in review mode)
        setTimeout(() => {
          boardRef.current?.setConfig({ drawable: { autoShapes: [] } });
          advanceOrSubmit(newAnswers);
        }, 1500);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, exercises, answers, feedbackState, play]
  );

  const advanceOrSubmit = useCallback(
    (currentAnswers: typeof answers) => {
      const nextIdx = currentIdx + 1;
      if (nextIdx < total) {
        setCurrentIdx(nextIdx);
        setBoardFen(exercises[nextIdx].exercise.fen);
        setInteractive(true);
        setFeedbackState("waiting");
        submittingMoveRef.current = false;
      } else {
        // Submit all answers
        submitAnswers(currentAnswers);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIdx, total, exercises]
  );

  const submitAnswers = useCallback(
    async (
      finalAnswers: { lessonId: number; stepIndex: number; move: string }[]
    ) => {
      setPhase("submitting");

      const rpcAnswers = finalAnswers.map((a) => ({
        lesson_id: a.lessonId,
        step_index: a.stepIndex,
        move: a.move,
      }));

      try {
        const { data, error } = await supabase.rpc("submit_review_gate", {
          p_trail: trail,
          p_answers: rpcAnswers,
        });

        if (error) {
          console.error("[ReviewGate] RPC error:", error);
          setPhase("result");
          setResult({ score: 0, passed: false, required_score: 7 });
          return;
        }

        const res = data as SubmitReviewGateResult;
        setResult(res);
        setPhase("result");

        if (res.passed) {
          play("victory");
        }
      } catch (err) {
        console.error("[ReviewGate] unexpected error:", err);
        setPhase("result");
        setResult({ score: 0, passed: false, required_score: 7 });
      }
    },
    [supabase, trail, play]
  );

  const handleRetry = useCallback(() => {
    setPhase("quiz");
    setCurrentIdx(0);
    setAnswers([]);
    setBoardFen(exercises[0]?.exercise.fen ?? "");
    setInteractive(true);
    setFeedbackState("waiting");
    submittingMoveRef.current = false;
    setResult(null);
  }, [exercises]);

  // Current exercise
  const currentExercise = exercises[currentIdx];

  // Get orientation from exercise (interactive needs legal dests)
  const orientation = currentExercise?.exercise.orientation ?? "white";

  if (phase === "submitting") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="animate-pulse text-lg font-medium text-zinc-600">
          Verificando respostas...
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const passed = result.passed;
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        {passed && <Confetti />}
        <div
          className={`rounded-2xl border-2 p-6 text-center ${
            passed
              ? "border-green-300 bg-green-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <h2
            className={`mb-2 text-xl font-bold ${
              passed ? "text-green-800" : "text-amber-800"
            }`}
          >
            {passed ? "Aprovado!" : "Quase lá!"}
          </h2>
          <p
            className={`text-3xl font-bold ${
              passed ? "text-green-700" : "text-amber-700"
            }`}
          >
            {result.score}/{total}
          </p>
          <p
            className={`mt-1 text-sm ${
              passed ? "text-green-600" : "text-amber-600"
            }`}
          >
            {passed
              ? `Trilha ${trailName} desbloqueada!`
              : `Precisa de ${result.required_score} acertos para passar.`}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {!passed && (
              <button
                onClick={handleRetry}
                className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Tentar novamente
              </button>
            )}
            <Link
              href="/aulas"
              className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Voltar ao Mapa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz phase
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/aulas"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← Voltar ao mapa
        </Link>
        <h1 className="text-sm font-semibold text-zinc-800">
          Desafio Final — {trailName}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Questão {currentIdx + 1} de {total}
          </span>
          <span>
            Acertos: {correctCount}/{answers.length}
          </span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Instruction */}
      <div className="mb-2 rounded-lg bg-zinc-800 px-4 py-3 text-center text-sm text-white">
        <p>{currentExercise?.exercise.instruction}</p>
        {feedbackState === "correct" && (
          <p className="mt-1 text-green-300 text-xs">Correto!</p>
        )}
        {feedbackState === "wrong" && (
          <p className="mt-1 text-red-300 text-xs">Incorreto</p>
        )}
      </div>

      {/* Board */}
      <div className={boardShake ? "board-shake" : ""}>
        <LessonBoard
          ref={boardRef}
          fen={boardFen}
          orientation={orientation}
          interactive={interactive && feedbackState === "waiting"}
          onMove={handleMove}
        />
      </div>

      {/* Status */}
      <div className="mt-2 text-center text-xs text-zinc-500">
        {feedbackState === "waiting" && "Faça seu lance"}
        {feedbackState === "correct" && "Avançando..."}
        {feedbackState === "wrong" && "Avançando..."}
      </div>
    </div>
  );
}
