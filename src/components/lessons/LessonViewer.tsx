"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import type {
  LessonRow,
  LessonContent,
  LessonSection,
  LessonDemoSection,
  LessonExerciseSection,
  CompleteLessonStepResult,
} from "@/types/lesson";
import LessonBoard from "@/components/chess/LessonBoard";
import type { LessonBoardHandle } from "@/components/chess/LessonBoard";
import type { Key } from "chessground/types";
import LessonText from "./LessonText";
import LessonDemo from "./LessonDemo";
import LessonExercise from "./LessonExercise";
import type { ExerciseState } from "./LessonExercise";
import Confetti from "./Confetti";
import { useSupabase } from "@/hooks/useSupabase";
import { useSound } from "@/hooks/useSound";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────

interface DemoPosition {
  fen: string;
  lastMove?: [string, string];
}

/** Apply UCI move on FEN. Falls back to manual board manipulation for kingless positions. */
function applyUciOnFen(
  fen: string,
  uci: string
): { fen: string; lastMove: [string, string] } {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);

  try {
    const chess = new Chess(fen);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    chess.move({ from, to, promotion });
    return { fen: chess.fen(), lastMove: [from, to] };
  } catch {
    // Manual FEN manipulation for positions chess.js can't handle (no kings)
    const parts = fen.split(" ");
    const ranks = parts[0].split("/");
    const board: (string | null)[][] = [];

    for (const rank of ranks) {
      const row: (string | null)[] = [];
      for (const ch of rank) {
        if (ch >= "1" && ch <= "8") {
          for (let j = 0; j < parseInt(ch); j++) row.push(null);
        } else {
          row.push(ch);
        }
      }
      board.push(row);
    }

    const fc = (f: string) => f.charCodeAt(0) - 97;
    const fr = (r: string) => 8 - parseInt(r);

    const piece = board[fr(from[1])][fc(from[0])];
    board[fr(from[1])][fc(from[0])] = null;
    board[fr(to[1])][fc(to[0])] = piece;

    const newRanks = board.map((row) => {
      let s = "",
        e = 0;
      for (const c of row) {
        if (c === null) e++;
        else {
          if (e > 0) {
            s += e;
            e = 0;
          }
          s += c;
        }
      }
      if (e > 0) s += e;
      return s;
    });

    const newTurn = parts[1] === "w" ? "b" : "w";
    const moveNum =
      parseInt(parts[5] || "1") + (newTurn === "w" ? 1 : 0);

    return {
      fen: `${newRanks.join("/")} ${newTurn} ${parts[2] || "-"} ${parts[3] || "-"} 0 ${moveNum}`,
      lastMove: [from, to],
    };
  }
}

function precomputeDemoPositions(section: LessonDemoSection): DemoPosition[] {
  const positions: DemoPosition[] = [{ fen: section.fen }];
  let currentFen = section.fen;
  for (const uci of section.moves) {
    const result = applyUciOnFen(currentFen, uci);
    positions.push({ fen: result.fen, lastMove: result.lastMove });
    currentFen = result.fen;
  }
  return positions;
}

/** Get the turn color from a FEN */
function turnFromFen(fen: string): "white" | "black" {
  const parts = fen.split(" ");
  return parts[1] === "b" ? "black" : "white";
}

// ─── StarDisplay ────────────────────────────────────────────

function StarDisplay({
  count,
  size = "lg",
}: {
  count: number;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-3xl" : "text-lg";
  return (
    <div className={`flex gap-1 ${sizeClass}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={i <= count ? "text-yellow-400" : "text-zinc-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface LessonViewerProps {
  lesson: LessonRow;
  initialProgress: {
    steps_completed: number;
    completed: boolean;
    stars: number;
  } | null;
}

export default function LessonViewer({
  lesson,
  initialProgress,
}: LessonViewerProps) {
  const supabase = useSupabase();
  const { play } = useSound();
  const content = lesson.content_json as LessonContent;
  const sections = content.sections;
  const totalSections = sections.length;
  const rawAlreadyDone = initialProgress?.completed ?? false;
  const [retrying, setRetrying] = useState(false);
  const alreadyDone = rawAlreadyDone && !retrying;
  const dimKings = content.dim_kings ?? false;

  const boardRef = useRef<LessonBoardHandle>(null);

  // ─── Exercise map (sectionIndex → stepIndex) ───
  const exerciseMap = useMemo(() => {
    const map: {
      sectionIndex: number;
      stepIndex: number;
      exercise: LessonExerciseSection;
    }[] = [];
    let count = 0;
    sections.forEach((s: LessonSection, i: number) => {
      if (s.type === "exercise") {
        count++;
        map.push({ sectionIndex: i, stepIndex: count, exercise: s });
      }
    });
    return map;
  }, [sections]);

  const totalExercises = exerciseMap.length;

  // ─── Demo positions precomputed ───
  const demoPositionsMap = useMemo(() => {
    const map = new Map<number, DemoPosition[]>();
    sections.forEach((s: LessonSection, i: number) => {
      if (s.type === "demo") {
        map.set(i, precomputeDemoPositions(s));
      }
    });
    return map;
  }, [sections]);

  // ─── State ───
  const [currentIdx, setCurrentIdx] = useState(0);
  const [furthestIdx, setFurthestIdx] = useState(alreadyDone ? totalSections - 1 : 0);
  const [stepsCompleted, setStepsCompleted] = useState(
    initialProgress?.steps_completed ?? 0
  );
  const [lessonDone, setLessonDone] = useState(alreadyDone);
  const [finalStars, setFinalStars] = useState(initialProgress?.stars ?? 0);
  const [xpGained, setXpGained] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Demo state
  const [demoMoveIndex, setDemoMoveIndex] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const demoRunIdRef = useRef(0);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoCompletedSet, setDemoCompletedSet] = useState<Set<number>>(
    () => {
      if (alreadyDone) {
        const set = new Set<number>();
        sections.forEach((s: LessonSection, i: number) => {
          if (s.type === "demo") set.add(i);
        });
        return set;
      }
      return new Set();
    }
  );

  // Exercise state
  const [exerciseState, setExerciseState] = useState<ExerciseState>(
    alreadyDone && sections[0]?.type === "exercise" ? "correct" : "waiting"
  );
  const [exerciseFen, setExerciseFen] = useState("");
  const [hintRevealed, setHintRevealed] = useState(false);
  const submittingRef = useRef(false);
  const [boardShake, setBoardShake] = useState(false);

  // Refs to avoid stale closures in timeouts
  const stepsCompletedRef = useRef(stepsCompleted);
  stepsCompletedRef.current = stepsCompleted;
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  // Timers cleanup
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSection = sections[currentIdx];

  // ─── Helpers ───
  const getExerciseEntry = useCallback(
    (sectionIdx: number) =>
      exerciseMap.find((e) => e.sectionIndex === sectionIdx),
    [exerciseMap]
  );

  const isExerciseCompleted = useCallback(
    (sectionIdx: number) => {
      const entry = getExerciseEntry(sectionIdx);
      if (!entry) return false;
      return entry.stepIndex <= stepsCompleted;
    },
    [getExerciseEntry, stepsCompleted]
  );

  // ─── Reset board UI between sections ───
  const resetBoardUI = useCallback(() => {
    boardRef.current?.setConfig({
      drawable: { autoShapes: [] },
      lastMove: undefined,
    });
  }, []);

  // ─── Navigate to a section (used by goForward, goBack, auto-advance) ───
  const navigateToSection = useCallback(
    (newIdx: number) => {
      const newSection = sections[newIdx];
      resetBoardUI();
      setCurrentIdx(newIdx);
      setFurthestIdx((f) => Math.max(f, newIdx));

      if (newSection.type === "exercise") {
        const entry = exerciseMap.find((e) => e.sectionIndex === newIdx);
        if (entry) {
          const completed = entry.stepIndex <= stepsCompletedRef.current;
          setExerciseState(completed ? "correct" : "waiting");
          if (completed) {
            try {
              const applied = applyUciOnFen(
                entry.exercise.fen,
                entry.exercise.expected_moves[0]
              );
              setExerciseFen(applied.fen);
            } catch {
              setExerciseFen(entry.exercise.fen);
            }
          } else {
            setExerciseFen(entry.exercise.fen);
          }
          setHintRevealed(false);
          submittingRef.current = false;
        }
      }
      if (newSection.type === "demo") {
        const total = (demoPositionsMap.get(newIdx)?.length ?? 1) - 1;
        setDemoMoveIndex(demoCompletedSet.has(newIdx) || alreadyDone ? total : 0);
      }
    },
    [sections, resetBoardUI, exerciseMap, demoPositionsMap, demoCompletedSet, alreadyDone]
  );

  // ─── Can advance? ───
  const canAdvance = useMemo(() => {
    if (currentIdx >= totalSections - 1) return false;

    // Reviewing past sections: always can advance
    if (currentIdx < furthestIdx) return true;
    if (alreadyDone) return true;

    if (currentSection.type === "text") return true;

    if (currentSection.type === "demo") {
      return demoCompletedSet.has(currentIdx);
    }

    if (currentSection.type === "exercise") {
      return exerciseState === "correct" || isExerciseCompleted(currentIdx);
    }

    return true;
  }, [
    currentIdx,
    totalSections,
    furthestIdx,
    alreadyDone,
    currentSection,
    demoCompletedSet,
    exerciseState,
    isExerciseCompleted,
  ]);

  // ─── Stop demo autoplay ───
  const stopDemoAutoplay = useCallback(() => {
    demoRunIdRef.current++;
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoPlaying(false);
  }, []);

  // ─── Clear pending auto-advance ───
  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  // ─── Navigation ───
  const goForward = useCallback(() => {
    if (!canAdvance) return;
    clearAutoAdvance();

    if (currentSection.type === "demo") {
      stopDemoAutoplay();
      setDemoCompletedSet((prev) => new Set(prev).add(currentIdx));
    }

    navigateToSection(currentIdx + 1);
  }, [
    canAdvance,
    currentIdx,
    currentSection,
    clearAutoAdvance,
    stopDemoAutoplay,
    navigateToSection,
  ]);

  const goBack = useCallback(() => {
    if (currentIdx <= 0) return;
    clearAutoAdvance();

    if (currentSection.type === "demo") {
      stopDemoAutoplay();
    }

    navigateToSection(currentIdx - 1);
  }, [
    currentIdx,
    currentSection,
    clearAutoAdvance,
    stopDemoAutoplay,
    navigateToSection,
  ]);

  // ─── Repeat current section ───
  const handleRepeat = useCallback(() => {
    if (exerciseState === "checking") return;
    clearAutoAdvance();
    resetBoardUI();

    if (currentSection.type === "exercise") {
      const entry = getExerciseEntry(currentIdx);
      if (entry) {
        setExerciseState("waiting");
        setExerciseFen(entry.exercise.fen);
        setHintRevealed(false);
        submittingRef.current = false;
      }
    }

    if (currentSection.type === "demo") {
      // Restart auto-play from zero
      stopDemoAutoplay();
      setDemoMoveIndex(0);
      setDemoCompletedSet((prev) => {
        const next = new Set(prev);
        next.delete(currentIdx);
        return next;
      });
      // Will trigger auto-play via effect
    }
  }, [currentIdx, currentSection, exerciseState, getExerciseEntry, resetBoardUI, clearAutoAdvance, stopDemoAutoplay]);

  // ─── Start retry (reset all state for fresh attempt) ───
  const startRetry = useCallback(() => {
    setRetrying(true);
    setStepsCompleted(0);
    setLessonDone(false);
    setFinalStars(0);
    setXpGained(0);
    setShowConfetti(false);
    setDemoCompletedSet(new Set());
    setFurthestIdx(0);
    setExerciseState("waiting");
    setExerciseFen("");
    setHintRevealed(false);
    submittingRef.current = false;
    clearAutoAdvance();
    stopDemoAutoplay();
    resetBoardUI();
    setCurrentIdx(0);
    setDemoMoveIndex(0);
  }, [clearAutoAdvance, stopDemoAutoplay, resetBoardUI]);

  // ─── Schedule auto-advance after 2.5s ───
  const scheduleAutoAdvance = useCallback(() => {
    clearAutoAdvance();
    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      const idx = currentIdxRef.current;
      if (idx < totalSections - 1) {
        navigateToSection(idx + 1);
      }
    }, 2500);
  }, [clearAutoAdvance, totalSections, navigateToSection]);

  // ─── Demo auto-play effect ───
  useEffect(() => {
    if (currentSection.type !== "demo") return;
    if (demoCompletedSet.has(currentIdx) && demoMoveIndex > 0) return;
    if (alreadyDone) return;

    const positions = demoPositionsMap.get(currentIdx);
    if (!positions || positions.length <= 1) return;

    // Only start autoplay when at position 0
    if (demoMoveIndex !== 0) return;

    const nextRunId = demoRunIdRef.current + 1;
    demoRunIdRef.current = nextRunId;
    const currentRunId = nextRunId;
    setDemoPlaying(true);

    let moveIdx = 0;
    const totalMoves = positions.length - 1;

    // Start with a small delay
    const startTimer = setTimeout(() => {
      if (demoRunIdRef.current !== currentRunId) return;

      const intervalId = setInterval(() => {
        if (demoRunIdRef.current !== currentRunId) {
          clearInterval(intervalId);
          demoIntervalRef.current = null;
          return;
        }

        moveIdx++;
        if (moveIdx > totalMoves) {
          clearInterval(intervalId);
          demoIntervalRef.current = null;
          setDemoPlaying(false);
          setDemoCompletedSet((prev) => new Set(prev).add(currentIdx));

          // Auto-advance after 2.5s
          scheduleAutoAdvance();
          return;
        }

        const section = sections[currentIdx] as LessonDemoSection;
        const move = section.moves[moveIdx - 1];
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);

        // Animate the move
        boardRef.current?.animateMove(from, to);
        play("move");

        // After animation (200ms), sync FEN
        setTimeout(() => {
          if (demoRunIdRef.current !== currentRunId) return;
          const pos = positions[moveIdx];
          boardRef.current?.setConfig({
            fen: pos.fen,
            lastMove: pos.lastMove as Key[] | undefined,
          });
          setDemoMoveIndex(moveIdx);
        }, 200);
      }, 1200);

      demoIntervalRef.current = intervalId;
    }, 600);

    return () => {
      clearTimeout(startTimer);
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      // Invalidate current run so stale callbacks are ignored
      demoRunIdRef.current = nextRunId + 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentSection.type, demoMoveIndex === 0 ? 0 : 1]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  // ─── Exercise move handler ───
  const handleExerciseMove = useCallback(
    async (uci: string) => {
      if (exerciseState !== "waiting" || submittingRef.current) return;
      submittingRef.current = true;

      const entry = getExerciseEntry(currentIdx);
      if (!entry) {
        submittingRef.current = false;
        return;
      }

      // Immediately show the moved piece position
      try {
        const applied = applyUciOnFen(entry.exercise.fen, uci);
        setExerciseFen(applied.fen);
      } catch {
        /* Chessground already moved the piece visually */
      }

      setExerciseState("checking");

      try {
        const { data, error } = await supabase.rpc("complete_lesson_step", {
          p_lesson_id: lesson.id,
          p_step_index: entry.stepIndex,
          p_move: uci,
          p_used_hint: hintRevealed,
        });

        if (error) {
          console.error("[LessonViewer] RPC error:", error);
          setExerciseState("waiting");
          setExerciseFen(entry.exercise.fen);
          submittingRef.current = false;
          return;
        }

        const result = data as CompleteLessonStepResult;

        if (result.correct) {
          setExerciseState("correct");
          play("move");
          setStepsCompleted((prev) => prev + 1);

          // Green highlight on move squares
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
          setTimeout(() => {
            boardRef.current?.setConfig({
              drawable: { autoShapes: [] },
            });
          }, 1500);

          if (result.lesson_completed && !lessonDone) {
            setLessonDone(true);
            setFinalStars(result.stars ?? 1);
            setXpGained(result.xp_gained);
            setShowConfetti(true);
            play("victory");
          } else {
            // Auto-advance after 2.5s
            scheduleAutoAdvance();
          }
        } else {
          // Wrong move
          setExerciseState("wrong");
          play("wrong");

          // Red flash on origin square
          const from = uci.slice(0, 2);
          boardRef.current?.setConfig({
            drawable: {
              autoShapes: [{ orig: from as never, brush: "red" }],
            },
          });

          // Board shake
          setBoardShake(true);
          setTimeout(() => setBoardShake(false), 300);

          // Snap back after 800ms
          setTimeout(() => {
            boardRef.current?.setConfig({
              drawable: { autoShapes: [] },
            });
            setExerciseState("waiting");
            setExerciseFen(entry.exercise.fen);
            submittingRef.current = false;
          }, 800);
          return;
        }
      } catch (err) {
        console.error("[LessonViewer] unexpected error:", err);
        setExerciseState("waiting");
        setExerciseFen(entry.exercise.fen);
      }

      submittingRef.current = false;
    },
    [
      exerciseState,
      currentIdx,
      getExerciseEntry,
      supabase,
      lesson.id,
      hintRevealed,
      play,
      lessonDone,
      scheduleAutoAdvance,
    ]
  );

  // ─── Board config for current section ───
  const boardConfig = useMemo(() => {
    if (currentSection.type === "text") {
      const s = currentSection;
      if (!s.fen) return null;
      return {
        fen: s.fen,
        orientation: (s.orientation ?? "white") as "white" | "black",
        interactive: false,
        highlights: s.highlights,
        arrows: s.arrows,
      };
    }

    if (currentSection.type === "demo") {
      const positions = demoPositionsMap.get(currentIdx);
      if (!positions) return null;
      const pos = positions[demoMoveIndex];
      return {
        fen: pos.fen,
        orientation: (currentSection.orientation ?? "white") as
          | "white"
          | "black",
        interactive: false,
        lastMove: pos.lastMove,
      };
    }

    if (currentSection.type === "exercise") {
      const completed = isExerciseCompleted(currentIdx);

      let fen = exerciseFen || currentSection.fen;
      if (completed && !exerciseFen) {
        try {
          fen = applyUciOnFen(
            currentSection.fen,
            currentSection.expected_moves[0]
          ).fen;
        } catch {
          /* keep original */
        }
      }

      return {
        fen,
        orientation: (currentSection.orientation ?? "white") as
          | "white"
          | "black",
        interactive: exerciseState === "waiting" && !completed,
      };
    }

    return null;
  }, [
    currentSection,
    currentIdx,
    demoPositionsMap,
    demoMoveIndex,
    exerciseFen,
    exerciseState,
    isExerciseCompleted,
  ]);

  // ─── Labels ───
  const topicLabel = `Tópico ${currentIdx + 1} de ${totalSections}`;

  const exerciseLabel = useMemo(() => {
    if (currentSection.type !== "exercise") return null;
    const entry = getExerciseEntry(currentIdx);
    if (!entry) return null;
    return `Exercício ${entry.stepIndex} de ${totalExercises}`;
  }, [currentSection, currentIdx, getExerciseEntry, totalExercises]);

  const isLastSection = currentIdx === totalSections - 1;

  // Playing color for exercise indicator
  const playingColor = useMemo(() => {
    if (currentSection.type === "exercise") {
      return turnFromFen(currentSection.fen);
    }
    return "white" as const;
  }, [currentSection]);

  // ─── Demo nav handlers (pause autoplay + manual control) ───
  const handleDemoNavForward = useCallback(() => {
    stopDemoAutoplay();
    const positions = demoPositionsMap.get(currentIdx);
    if (!positions) return;
    if (demoMoveIndex < positions.length - 1) {
      const newIndex = demoMoveIndex + 1;
      setDemoMoveIndex(newIndex);
      play("move");
      if (newIndex >= positions.length - 1) {
        setDemoCompletedSet((prev) => new Set(prev).add(currentIdx));
      }
    }
  }, [currentIdx, demoMoveIndex, demoPositionsMap, play, stopDemoAutoplay]);

  const handleDemoNavBack = useCallback(() => {
    stopDemoAutoplay();
    if (demoMoveIndex > 0) {
      setDemoMoveIndex(demoMoveIndex - 1);
    }
  }, [demoMoveIndex, stopDemoAutoplay]);

  // ─── Annotation for current demo move ───
  const demoAnnotation = useMemo(() => {
    if (currentSection.type !== "demo") return undefined;
    return currentSection.annotations?.[demoMoveIndex];
  }, [currentSection, demoMoveIndex]);

  // ─── Can show hint? ───
  const canShowHint =
    currentSection.type === "exercise" &&
    currentSection.hint &&
    exerciseState === "waiting" &&
    !hintRevealed;

  // ─── Can repeat? ───
  const canRepeat =
    exerciseState !== "checking" &&
    (currentSection.type === "exercise" || currentSection.type === "demo");

  // ─── Mobile text content (above board) ───
  const mobileTextContent = useMemo(() => {
    if (currentSection.type === "text") {
      return (
        <>
          {currentSection.title && (
            <p className="font-bold">{currentSection.title}</p>
          )}
          <p>{currentSection.body}</p>
        </>
      );
    }
    if (currentSection.type === "demo") {
      return currentSection.description ? (
        <p>{currentSection.description}</p>
      ) : (
        currentSection.title && <p className="font-bold">{currentSection.title}</p>
      );
    }
    if (currentSection.type === "exercise") {
      return (
        <>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div
              className={`h-3 w-3 rounded-full border ${
                playingColor === "white"
                  ? "border-zinc-400 bg-white"
                  : "border-zinc-500 bg-zinc-800"
              }`}
            />
            <span className="font-bold text-xs">SEU LANCE</span>
          </div>
          <p>{currentSection.instruction}</p>
          {exerciseState === "correct" && currentSection.after_text && (
            <p className="mt-1 text-green-300 text-xs">{currentSection.after_text}</p>
          )}
          {exerciseState === "wrong" && (
            <p className="mt-1 text-red-300 text-xs">Tente novamente!</p>
          )}
          {hintRevealed && currentSection.hint && (
            <p className="mt-1 text-amber-300 text-xs">{currentSection.hint}</p>
          )}
        </>
      );
    }
    return null;
  }, [currentSection, playingColor, exerciseState, hintRevealed]);

  // ─── Render ───
  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/aulas"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← Voltar ao mapa
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-800 lg:text-base">
            {lesson.title}
          </h1>
          {rawAlreadyDone && !retrying && (
            <>
              <StarDisplay count={initialProgress?.stars ?? 0} size="sm" />
              <button
                onClick={startRetry}
                className="ml-2 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Refazer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confetti + completion banner */}
      {showConfetti && <Confetti />}
      {showConfetti && !alreadyDone && (
        <div className="mb-4 rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-green-800">
            Aula Completa!
          </h2>
          <StarDisplay count={finalStars} />
          <p className="mt-2 text-lg font-semibold text-green-700">
            +{xpGained} XP
          </p>
          <p className="mt-1 text-sm text-green-600">
            {finalStars === 3
              ? "Perfeita!"
              : finalStars === 2
                ? "Muito bem!"
                : "Completou!"}
          </p>
          <Link
            href="/aulas"
            className="mt-3 inline-block rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Voltar ao Mapa
          </Link>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {boardConfig ? (
        <div>
          {/* MOBILE: Text/instruction above board (Chess Universe style) */}
          <div className="lg:hidden rounded-lg bg-zinc-800 px-4 py-3 mb-2 text-white text-sm text-center min-h-12 flex flex-col justify-center">
            {mobileTextContent}
            {demoPlaying && currentSection.type === "demo" && (
              <p className="mt-1 text-zinc-400 text-xs animate-pulse">
                Reproduzindo...
              </p>
            )}
          </div>

          {/* Board + Desktop Panel row */}
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* SINGLE Board — rendered once, used by both layouts */}
            <div className="w-full lg:w-[60%]">
              <div className={boardShake ? "board-shake" : ""}>
                <LessonBoard
                  ref={boardRef}
                  fen={boardConfig.fen}
                  orientation={boardConfig.orientation}
                  interactive={boardConfig.interactive}
                  highlights={boardConfig.highlights}
                  arrows={boardConfig.arrows}
                  lastMove={boardConfig.lastMove}
                  dimKings={dimKings}
                  onMove={
                    currentSection.type === "exercise"
                      ? handleExerciseMove
                      : undefined
                  }
                />
              </div>
            </div>

            {/* DESKTOP ONLY: ChessKid panel (40%) */}
            <div className="hidden lg:flex lg:w-[40%] flex-col rounded-xl bg-zinc-700 overflow-hidden">
              {/* Dark header */}
              <div className="px-4 py-2 text-center text-white font-bold text-sm">
                Aulas
              </div>

              {/* White content card */}
              <div className="flex-1 m-2 rounded-lg bg-white p-4 overflow-y-auto">
                {/* Progress bar */}
                <div className="mb-3">
                  <p className="text-xs text-zinc-400">
                    Tópico #{currentIdx + 1} de {totalSections}
                  </p>
                  <div className="mt-1 h-1 rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${((currentIdx + 1) / totalSections) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {exerciseLabel && (
                  <p className="mb-2 text-xs font-medium text-zinc-500">
                    {exerciseLabel}
                  </p>
                )}

                {currentSection.type === "text" && (
                  <LessonText section={currentSection} topicLabel={topicLabel} />
                )}

                {currentSection.type === "demo" && (
                  <LessonDemo
                    section={currentSection}
                    topicLabel={topicLabel}
                    annotation={demoAnnotation}
                    isPlaying={demoPlaying}
                  />
                )}

                {currentSection.type === "exercise" && (
                  <LessonExercise
                    exercise={currentSection}
                    topicLabel={topicLabel}
                    state={
                      isExerciseCompleted(currentIdx)
                        ? "correct"
                        : exerciseState
                    }
                    hintRevealed={hintRevealed}
                    playingColor={playingColor}
                  />
                )}
              </div>

              {/* Footer nav */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-600">
                <div className="flex-1" />

                {/* Demo manual nav */}
                {currentSection.type === "demo" && (
                  <>
                    <button
                      onClick={handleDemoNavBack}
                      disabled={demoMoveIndex <= 0}
                      className="h-8 w-8 rounded-full bg-zinc-600 text-white text-sm flex items-center justify-center hover:bg-zinc-500 disabled:opacity-40"
                      title="Lance anterior"
                    >
                      ←
                    </button>
                    <button
                      onClick={handleDemoNavForward}
                      disabled={
                        demoMoveIndex >=
                        (demoPositionsMap.get(currentIdx)?.length ?? 1) - 1
                      }
                      className="h-8 w-8 rounded-full bg-zinc-600 text-white text-sm flex items-center justify-center hover:bg-zinc-500 disabled:opacity-40"
                      title="Próximo lance"
                    >
                      →
                    </button>
                  </>
                )}

                {/* Section nav */}
                <button
                  onClick={goBack}
                  disabled={currentIdx <= 0 || exerciseState === "checking"}
                  className="h-8 w-8 rounded-full bg-zinc-600 text-white text-sm flex items-center justify-center hover:bg-zinc-500 disabled:opacity-40"
                  title="Seção anterior"
                >
                  ◀
                </button>

                {canShowHint && (
                  <button
                    onClick={() => setHintRevealed(true)}
                    className="h-8 w-8 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center hover:bg-amber-400"
                    title="Ver dica"
                  >
                    ?
                  </button>
                )}

                {isLastSection ? (
                  <Link
                    href="/aulas"
                    className="h-8 px-3 rounded-full bg-green-600 text-white text-sm flex items-center justify-center hover:bg-green-500 font-medium"
                  >
                    Concluir
                  </Link>
                ) : (
                  <button
                    onClick={goForward}
                    disabled={!canAdvance || exerciseState === "checking"}
                    className="h-8 w-8 rounded-full bg-zinc-600 text-white text-sm flex items-center justify-center hover:bg-zinc-500 disabled:opacity-40"
                    title="Próxima seção"
                  >
                    ▶
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE: Info bar below board */}
          <div className="lg:hidden flex items-center justify-between px-2 py-1 text-xs text-zinc-500">
            <span>{exerciseLabel || lesson.title}</span>
            <span>
              {currentIdx + 1} / {totalSections}
            </span>
          </div>

          {/* MOBILE: Nav bar — large touch buttons */}
          <div className="lg:hidden flex items-center gap-2 px-3 py-3 border-t bg-zinc-100">
            <button
              onClick={goBack}
              disabled={currentIdx <= 0 || exerciseState === "checking"}
              className="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-bold text-sm disabled:opacity-40 active:bg-zinc-700"
            >
              ← ANTERIOR
            </button>

            {canRepeat && (
              <button
                onClick={handleRepeat}
                className="flex-1 py-3 rounded-lg bg-amber-500 text-white font-bold text-sm active:bg-amber-400"
              >
                ↺ REPETIR
              </button>
            )}

            {canShowHint && (
              <button
                onClick={() => setHintRevealed(true)}
                className="py-3 px-4 rounded-lg bg-amber-500 text-white font-bold text-sm active:bg-amber-400"
              >
                💡
              </button>
            )}

            {isLastSection ? (
              <Link
                href="/aulas"
                className="flex-1 py-3 rounded-lg bg-green-600 text-white font-bold text-sm text-center active:bg-green-500"
              >
                CONCLUIR
              </Link>
            ) : (
              <button
                onClick={goForward}
                disabled={!canAdvance || exerciseState === "checking"}
                className="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-bold text-sm disabled:opacity-40 active:bg-zinc-700"
              >
                PRÓXIMA →
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Full-width text (no board) — both layouts */
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
          {currentSection.type === "text" && (
            <LessonText section={currentSection} topicLabel={topicLabel} />
          )}

          {/* Navigation for no-board sections */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={currentIdx <= 0}
              className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
            >
              ← ANTERIOR
            </button>

            {isLastSection ? (
              <Link
                href="/aulas"
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                CONCLUIR
              </Link>
            ) : (
              <button
                onClick={goForward}
                disabled={!canAdvance}
                className="rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                PRÓXIMA →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Already-done banner on last section */}
      {alreadyDone && isLastSection && !showConfetti && (
        <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-center">
          <StarDisplay count={initialProgress?.stars ?? 0} />
          <p className="mt-1 text-sm text-zinc-600">Aula já concluída</p>
        </div>
      )}
    </div>
  );
}
