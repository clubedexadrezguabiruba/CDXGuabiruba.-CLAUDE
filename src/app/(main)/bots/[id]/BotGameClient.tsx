"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";
import { useSound } from "@/hooks/useSound";
import { useUser } from "@/hooks/useUser";
import { StockfishEngine } from "@/lib/chess/StockfishEngine";
import {
  detectGameOver,
  generatePgn,
  getRandomPhrase,
  resultToPgn,
} from "@/lib/chess/botGameLogic";
import { parseUci } from "@/lib/chess/puzzleLogic";
import { analyzeGame } from "@/lib/chess/botAnalysis";
import type { GameAnalysis } from "@/lib/chess/botAnalysis";
import type {
  Bot,
  PlayerColor,
  TimeControl,
  GameResult,
  GameOverInfo,
  GameOverReason,
} from "@/types/bot";


import BotBoard from "@/components/chess/BotBoard";
import BotPreGame from "@/components/bots/BotPreGame";
import BotPostGame from "@/components/bots/BotPostGame";
import BotSpeechBubble from "@/components/bots/BotSpeechBubble";
import { useGameClock, ClockBadge } from "@/components/bots/GameClock";
import MoveList from "@/components/bots/MoveList";
import GameOverModal from "@/components/bots/GameOverModal";
import GameReview from "@/components/bots/GameReview";
import BotAvatar from "@/components/bots/BotAvatar";
import { useArrowKeys } from "@/hooks/useArrowKeys";
import { useFutureMoveQueue } from "@/hooks/useFutureMoveQueue";
import type { QueuedMove } from "@/lib/chess/futureMoveQueue";
import { soundManager } from "@/lib/sounds/soundManager";

type GamePhase = "pre-game" | "playing" | "game-over-modal" | "post-game" | "review";

function getBotThinkingDelay(elo: number): number {
  const base = Math.max(400, 1500 - (elo - 250) * (1100 / 1650));
  const variation = base * (0.7 + Math.random() * 0.6);
  return Math.round(variation);
}

const BLUNDER_RATE: Record<string, number> = {
  leo: 0.42,
  skippy: 0.35,
  tome: 0.28,
  "sargento-pardo": 0.20,
  iris: 0.14,
  breno: 0.10,
  silas: 0.08,
  "capita-lucia": 0.06,
  cassio: 0.04,
  helena: 0.03,
};

function getBlunderRate(slug: string): number {
  return BLUNDER_RATE[slug] ?? 0;
}

const INITIAL_CHESS = new Chess();

interface BotGameClientProps {
  bot: Bot;
  nextBot?: { id: number; name: string } | null;
}

export default function BotGameClient({ bot, nextBot }: BotGameClientProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { play: playSound } = useSound();
  const { profile } = useUser();


  // Pre-game state (elevated for mobile+desktop sync)
  const [preGameColor, setPreGameColor] = useState<"white" | "black" | "random">("white");
  const [preGameTC, setPreGameTC] = useState(0);

  // Game state
  const [phase, setPhase] = useState<GamePhase>("pre-game");
  const [chess, setChess] = useState<Chess | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [timeControl, setTimeControl] = useState<TimeControl>({
    type: "unlimited",
  });
  const [lastMove, setLastMove] = useState<[string, string] | undefined>();
  const [interactive, setInteractive] = useState(false);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [, forceUpdate] = useState(0);

  // Post-game state
  const [gameResult, setGameResult] = useState<GameResult>("loss");
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>("checkmate");
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const resultIdRef = useRef<number | null>(null);
  const analysisEngineRef = useRef<StockfishEngine | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });
  const [fullHistory, setFullHistory] = useState<
    { san: string; before: string; after: string }[]
  >([]);

  // Move navigation state (null = live position, number = viewing past move)
  const [viewHalfMove, setViewHalfMove] = useState<number | null>(null);

  // Clock state
  const [activeClockColor, setActiveClockColor] = useState<PlayerColor | null>(
    null
  );

  // Refs
  const engineRef = useRef<StockfishEngine | null>(null);
  const chessRef = useRef<Chess | null>(null);
  const resultSubmittedRef = useRef(false);
  const moveCountRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const playerColorRef = useRef<PlayerColor>("white");
  useEffect(() => {
    chessRef.current = chess;
  }, [chess]);
  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  // Future move queue — handles premoves for bot games
  const premoveEnabled = profile?.premove_enabled ?? true;
  const handleQueueExecute = useCallback(
    (move: QueuedMove) => {
      const c = chessRef.current;
      if (!c) return;

      // Apply the queued move to the real chess instance
      const promotion = move.promotion;
      const moveResult = c.move({
        from: move.from,
        to: move.to,
        promotion: promotion,
      });
      if (!moveResult) return;

      // Sound + UI update (chessground will sync via fen update)

      // Play sound
      if (c.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      // Notify the game loop (same as handlePlayerMove)
      setViewHalfMove(null);
      moveCountRef.current++;
      setLastMove([move.from, move.to]);

      const gameOver = detectGameOver(c, playerColorRef.current);
      if (gameOver) {
        endGame(gameOver);
        return;
      }

      setInteractive(false);
      const botColor: PlayerColor =
        playerColorRef.current === "white" ? "black" : "white";
      setActiveClockColor(botColor);
      forceUpdate((n) => n + 1);

      const thinkingMs = getBotThinkingDelay(bot.elo);
      setTimeout(() => makeBotMove(), thinkingMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playSound, bot.elo]
  );

  const handleQueueInvalidated = useCallback(() => {
    soundManager.play("wrong");
  }, []);

  const moveQueue = useFutureMoveQueue({
    maxSize: 10,
    chess: chess ?? INITIAL_CHESS,
    playerColor,
    enabled: premoveEnabled,
    onExecute: handleQueueExecute,
    onInvalidated: handleQueueInvalidated,
  });

  // Ref to break circular dependency: endGame → clearQueue, but moveQueue depends on endGame via handleQueueExecute
  const clearQueueRef = useRef<(() => void) | null>(null);
  clearQueueRef.current = moveQueue.clearQueue;

  const handleTimeout = useCallback(
    (color: PlayerColor) => {
      const result: GameResult =
        color === playerColorRef.current ? "loss" : "win";
      endGame({ result, reason: "timeout" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Clock hook — always called (hooks can't be conditional)
  const timedTc = timeControl.type === "timed" ? timeControl : null;
  const clock = useGameClock({
    whiteTimeMs: timedTc?.initialMs ?? 300000,
    blackTimeMs: timedTc?.initialMs ?? 300000,
    activeColor: timedTc ? activeClockColor : null,
    incrementMs: timedTc?.incrementMs ?? 0,
    onTimeout: handleTimeout,
  });

  const endGame = useCallback(
    async (info: GameOverInfo) => {
      setInteractive(false);
      setActiveClockColor(null);
      clearQueueRef.current?.();

      if (info.result === "win") playSound("victory");
      else if (info.result === "loss") playSound("defeat");

      setGameResult(info.result);
      setGameOverReason(info.reason);

      if (!resultSubmittedRef.current) {
        resultSubmittedRef.current = true;
        resultIdRef.current = null;

        const c = chessRef.current;
        const pColor = playerColorRef.current;
        if (c) {
          const pgnResult = resultToPgn(info.result, pColor);
          const pgn = generatePgn(c, bot, pColor, pgnResult);
          const timeSpent = Math.round(
            (Date.now() - gameStartTimeRef.current) / 1000
          );

          try {
            const { data } = await supabase.rpc("bot_result", {
              p_bot_id: bot.id,
              p_result: info.result,
              p_pgn: pgn,
              p_time_spent_seconds: timeSpent,
            });
            if (data?.result_id) {
              resultIdRef.current = data.result_id;
            }
          } catch (err) {
            console.error("Failed to submit bot result:", { botId: bot.id, result: info.result, error: err });
          }
        }
      }

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      setPhase("game-over-modal");

      if (chessRef.current) {
        const history = chessRef.current.history({ verbose: true }).map((m) => ({
          san: m.san,
          before: m.before,
          after: m.after,
        }));
        setFullHistory(history);

        if (history.length > 0) {
          setAnalyzing(true);
          try {
            const analysisEngine = new StockfishEngine();
            analysisEngineRef.current = analysisEngine;
            await analysisEngine.init();
            analysisEngine.setSkill(20);

            const pColor = playerColorRef.current;
            const result = await analyzeGame(
              history,
              pColor,
              analysisEngine,
              (current, total) => setAnalysisProgress({ current, total })
            );
            setAnalysis(result);
            analysisEngine.destroy();
            analysisEngineRef.current = null;

            // Persist analysis to database (1 retry, graduated logging)
            const rId = resultIdRef.current;
            if (rId && chessRef.current) {
              const pgnResult = resultToPgn(info.result, pColor);
              const pgn = generatePgn(chessRef.current, bot, pColor, pgnResult);
              const rpcParams = {
                p_bot_result_id: rId,
                p_pgn: pgn,
                p_moves_analysis_json: JSON.stringify(result.moves),
                p_accuracy_percent: result.accuracy,
                p_brilliant: result.counts.brilliant,
                p_great: result.counts.great + result.counts.best,
                p_good: result.counts.good,
                p_inaccuracy: result.counts.inaccuracy,
                p_mistake: result.counts.mistake,
                p_blunder: result.counts.blunder,
                p_schema_version: 1,
                p_engine_info: "stockfish-18.0.5-lite",
              };

              let saved = false;
              for (let attempt = 1; attempt <= 2; attempt++) {
                const { error } = await supabase.rpc("save_bot_analysis", rpcParams);
                if (!error) {
                  saved = true;
                  break;
                }
                if (attempt === 1) {
                  console.warn("save_bot_analysis attempt 1 failed", { resultId: rId, error: error.message });
                  await new Promise((r) => setTimeout(r, 2000));
                } else {
                  console.error("save_bot_analysis failed permanently", { resultId: rId, botId: bot.id, accuracy: result.accuracy, error: error.message });
                }
              }

              // Mark analysis_status as failed if save didn't succeed
              if (!saved) {
                await supabase.rpc("mark_analysis_failed", { p_bot_result_id: rId });
              }
            }
          } catch (err) {
            console.error("Analysis failed:", { botId: bot.id, resultId: resultIdRef.current, error: err });
          } finally {
            setAnalyzing(false);
          }
        }
      }
    },
    [bot, supabase, playSound]
  );

  const makeBotMove = useCallback(async () => {
    const engine = engineRef.current;
    const c = chessRef.current;
    if (!engine || !c || c.isGameOver()) return;

    try {
      const shouldBlunder = Math.random() < getBlunderRate(bot.slug);
      let moveUci: string;

      if (shouldBlunder) {
        const legalMoves = c.moves({ verbose: true });
        if (legalMoves.length === 0) return;
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        moveUci = randomMove.from + randomMove.to + (randomMove.promotion || "");
      } else {
        const bestMoveUci = await engine.bestMove(c.fen(), bot.depth);
        if (!bestMoveUci || bestMoveUci === "(none)") return;
        moveUci = bestMoveUci;
      }

      const parsed = parseUci(moveUci);
      const moveResult = c.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion,
      });

      if (!moveResult) return;

      setLastMove([parsed.from, parsed.to]);
      moveCountRef.current++;

      if (c.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      if (moveCountRef.current % 5 === 0) {
        setBotMessage(getRandomPhrase(bot, "during"));
      }

      const gameOver = detectGameOver(c, playerColorRef.current);
      if (gameOver) {
        endGame(gameOver);
        return;
      }

      setActiveClockColor(playerColorRef.current);
      setInteractive(true);
      forceUpdate((n) => n + 1);

      // Try execute queued premove after bot plays
      requestAnimationFrame(() => moveQueue.tryExecuteFirst());
    } catch (err) {
      console.error("Bot move error:", { botId: bot.id, fen: chessRef.current?.fen(), error: err });
    }
  }, [bot, playSound, endGame, moveQueue]);

  const handlePlayerMove = useCallback(
    (uci: string) => {
      const c = chessRef.current;
      if (!c) return;

      setViewHalfMove(null);
      moveCountRef.current++;
      setLastMove([uci.slice(0, 2), uci.slice(2, 4)]);

      const gameOver = detectGameOver(c, playerColorRef.current);
      if (gameOver) {
        endGame(gameOver);
        return;
      }

      setInteractive(false);
      const botColor: PlayerColor =
        playerColorRef.current === "white" ? "black" : "white";
      setActiveClockColor(botColor);
      forceUpdate((n) => n + 1);

      const thinkingMs = getBotThinkingDelay(bot.elo);
      setTimeout(() => makeBotMove(), thinkingMs);
    },
    [endGame, makeBotMove, bot.elo]
  );

  const handleResign = useCallback(() => {
    setShowResignConfirm(false);
    endGame({ result: "loss", reason: "resign" });
  }, [endGame]);

  const startGame = useCallback(
    async (color: PlayerColor, tc: TimeControl) => {
      setPlayerColor(color);
      playerColorRef.current = color;
      setTimeControl(tc);
      resultSubmittedRef.current = false;
      resultIdRef.current = null;
      moveCountRef.current = 0;
      gameStartTimeRef.current = Date.now();
      setLastMove(undefined);
      setBotMessage(null);
      setAnalysis(null);
      setAnalyzing(false);
      setEngineError(null);
      setShowResignConfirm(false);
      setGameOverReason("checkmate");

      moveQueue.clearQueue();

      const newChess = new Chess();
      chessRef.current = newChess;
      setChess(newChess);

      const engine = new StockfishEngine();
      engineRef.current = engine;

      try {
        await engine.init();
        engine.setSkill(bot.skill_level);
      } catch (err) {
        console.error("Failed to init Stockfish:", { botId: bot.id, skillLevel: bot.skill_level, error: err });
        setEngineError("Falha ao carregar o engine de xadrez. Recarregue a página.");
        return;
      }

      setPhase("playing");

      if (color === "black") {
        setInteractive(false);
        const botColor: PlayerColor = "white";
        if (tc.type === "timed") {
          setActiveClockColor(botColor);
        }

        setTimeout(async () => {
          try {
            let firstMoveUci: string;
            const shouldBlunder = Math.random() < getBlunderRate(bot.slug);
            if (shouldBlunder) {
              const legalMoves = newChess.moves({ verbose: true });
              const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
              firstMoveUci = randomMove.from + randomMove.to + (randomMove.promotion || "");
            } else {
              const bestMoveUci = await engine.bestMove(newChess.fen(), bot.depth);
              if (!bestMoveUci || bestMoveUci === "(none)") return;
              firstMoveUci = bestMoveUci;
            }

            const parsed = parseUci(firstMoveUci);
            const moveResult = newChess.move({
              from: parsed.from,
              to: parsed.to,
              promotion: parsed.promotion,
            });

            if (!moveResult) return;

            setLastMove([parsed.from, parsed.to]);
            moveCountRef.current++;

            if (newChess.isCheck()) playSound("check");
            else if (moveResult.captured) playSound("capture");
            else playSound("move");

            setActiveClockColor(color);
            setInteractive(true);
            forceUpdate((n) => n + 1);

            setBotMessage(getRandomPhrase(bot, "during"));
          } catch (err) {
            console.error("First bot move error:", { botId: bot.id, error: err });
          }
        }, getBotThinkingDelay(bot.elo));
      } else {
        setInteractive(true);
        if (tc.type === "timed") {
          setActiveClockColor("white");
        }
      }
    },
    [bot, playSound, moveQueue]
  );

  const handleRematch = useCallback(() => {
    // Destroy analysis engine if still running
    if (analysisEngineRef.current) {
      analysisEngineRef.current.destroy();
      analysisEngineRef.current = null;
    }
    setPhase("pre-game");
    setChess(null);
    setLastMove(undefined);
    setBotMessage(null);
    setAnalysis(null);
    setAnalyzing(false);
    setEngineError(null);
    setShowResignConfirm(false);
    setFullHistory([]);
    setViewHalfMove(null);
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      analysisEngineRef.current?.destroy();
    };
  }, []);

  const noop = useCallback(() => {}, []);

  // Computed values needed by hooks below (must be before any early return)
  const isPreGame = phase === "pre-game";
  const isGameOverModal = phase === "game-over-modal";
  const isViewingPast = viewHalfMove !== null;
  const displayOrientation = isPreGame ? "white" : playerColor;
  const history = isPreGame ? [] : (chess?.history() ?? []);
  const histLen = history.length;

  // Arrow key navigation for move review
  const navPrev = useCallback(() => {
    if (phase !== "playing" && phase !== "game-over-modal") return;
    if (histLen === 0) return;
    setViewHalfMove((v) => {
      if (v === null) return histLen - 2;
      return Math.max(-1, v - 1);
    });
  }, [phase, histLen]);

  const navNext = useCallback(() => {
    if (phase !== "playing" && phase !== "game-over-modal") return;
    if (histLen === 0) return;
    setViewHalfMove((v) => {
      if (v === null) return null;
      const next = v + 1;
      if (next >= histLen - 1) return null;
      return next;
    });
  }, [phase, histLen]);

  useArrowKeys({
    onPrev: navPrev,
    onNext: navNext,
    enabled: phase === "playing" || phase === "game-over-modal",
  });

  // Build verbose history for navigation (during play or after game)
  const verboseHistory = useMemo(() => {
    if (fullHistory.length > 0) return fullHistory;
    if (!chess) return [];
    return chess.history({ verbose: true }).map((m) => ({
      san: m.san, before: m.before, after: m.after, from: m.from, to: m.to,
    }));
  }, [fullHistory, chess, history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Display chess: show past position or live position
  const displayChess = useMemo(() => {
    if (isViewingPast && viewHalfMove !== null && viewHalfMove >= 0 && viewHalfMove < verboseHistory.length) {
      return new Chess(verboseHistory[viewHalfMove].after);
    }
    if (isViewingPast && viewHalfMove === -1) {
      return INITIAL_CHESS;
    }
    return chess || INITIAL_CHESS;
  }, [isViewingPast, viewHalfMove, verboseHistory, chess]);

  // Last move highlight: show viewed move or live last move
  const displayLastMove = useMemo<[string, string] | undefined>(() => {
    if (isViewingPast && viewHalfMove !== null && viewHalfMove >= 0 && viewHalfMove < verboseHistory.length) {
      const entry = verboseHistory[viewHalfMove];
      if ("from" in entry && "to" in entry) return [entry.from as string, entry.to as string];
      // Fallback: parse from before FEN
      const tempChess = new Chess(entry.before);
      const moves = tempChess.moves({ verbose: true });
      const match = moves.find((m) => m.san === entry.san);
      if (match) return [match.from, match.to];
    }
    if (isViewingPast) return undefined;
    return lastMove;
  }, [isViewingPast, viewHalfMove, verboseHistory, lastMove]);

  const isTimed = !isPreGame && timeControl.type === "timed";

  // Post-game: full-screen analysis summary
  if (phase === "post-game") {
    return (
      <BotPostGame
        bot={bot}
        result={gameResult}
        analysis={analysis}
        analyzing={analyzing}
        analysisProgress={analysisProgress}
        onRematch={handleRematch}
        onBack={() => router.push("/bots")}
        onViewReview={analysis ? () => setPhase("review") : undefined}
      />
    );
  }

  // Review: move-by-move interactive review
  if (phase === "review" && analysis) {
    return (
      <GameReview
        bot={bot}
        playerColor={playerColor}
        result={gameResult}
        fullHistory={fullHistory}
        analysis={analysis}
        onRematch={handleRematch}
        onBack={() => router.push("/bots")}
      />
    );
  }

  // Determine which clock goes where based on orientation
  // Top = opponent, bottom = player
  const topClock = displayOrientation === "white"
    ? { time: clock.blackTime, ms: clock.blackMs, active: activeClockColor === "black" }
    : { time: clock.whiteTime, ms: clock.whiteMs, active: activeClockColor === "white" };
  const bottomClock = displayOrientation === "white"
    ? { time: clock.whiteTime, ms: clock.whiteMs, active: activeClockColor === "white" }
    : { time: clock.blackTime, ms: clock.blackMs, active: activeClockColor === "black" };

  return (
    <div className="bot-game-wrap mx-auto max-w-5xl px-4 py-4">
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Left column: board area */}
        <div className="flex flex-1 flex-col items-center gap-2">
          {/* Top bar: opponent (bot) info + clock */}
          <div className="flex w-full max-w-[500px] items-center justify-between lg:max-w-[560px]">
            <div className="flex items-center gap-2">
              <BotAvatar bot={bot} size="xs" />
              <span className="text-sm font-bold text-zinc-800">{bot.name}</span>
              <span className="text-xs text-zinc-400">({bot.elo})</span>
            </div>
            {isTimed && (
              <ClockBadge time={topClock.time} timeMs={topClock.ms} active={topClock.active} />
            )}
          </div>

          {/* Board */}
          <BotBoard
            chess={displayChess}
            orientation={displayOrientation}
            interactive={!isPreGame && interactive && !isGameOverModal && !isViewingPast}
            onMove={isPreGame ? noop : handlePlayerMove}
            lastMove={displayLastMove}
            premovable={premoveEnabled}
            autoQueen={profile?.auto_queen ?? true}
            queueShapes={moveQueue.shapes}
            enqueueMove={moveQueue.enqueueMove}
            clearQueue={moveQueue.clearQueue}
            speculativeDests={moveQueue.speculativeDests}
          />

          {/* Bottom bar: player info + clock */}
          <div className="flex w-full max-w-[500px] items-center justify-between lg:max-w-[560px]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                Vc
              </div>
              <span className="text-sm font-bold text-zinc-800">{"Voc\u00EA"}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isPreGame && !isTimed && (
                <span className="text-sm text-zinc-500 lg:hidden">
                  {interactive && !isGameOverModal
                    ? "Sua vez"
                    : isGameOverModal
                      ? ""
                      : `${bot.name} pensando...`}
                </span>
              )}
              {isTimed && (
                <ClockBadge time={bottomClock.time} timeMs={bottomClock.ms} active={bottomClock.active} />
              )}
            </div>
          </div>

          {/* Clear premove queue button */}
          {moveQueue.queue.length > 0 && (
            <div className="flex w-full max-w-[500px] items-center lg:max-w-[560px]">
              <button
                onClick={() => moveQueue.clearQueue()}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-200"
              >
                {"\u2715"} Limpar ({moveQueue.queue.length})
              </button>
            </div>
          )}

          {/* Mobile: pre-game controls below board */}
          {isPreGame && (
            <div className="mt-2 w-full max-w-[500px] lg:hidden">
              <BotPreGame bot={bot} selectedColor={preGameColor} onColorChange={setPreGameColor} selectedTC={preGameTC} onTCChange={setPreGameTC} onStart={startGame} />
            </div>
          )}

          {/* Mobile: resign button */}
          {!isPreGame && !isGameOverModal && (
            <div className="mt-1 flex w-full max-w-[500px] items-center justify-end lg:hidden">
              {!showResignConfirm ? (
                <button
                  onClick={() => setShowResignConfirm(true)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {"\uD83C\uDFF3"} Render-se
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Tem certeza?</span>
                  <button
                    onClick={handleResign}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setShowResignConfirm(false)}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {"N\u00E3o"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: sidebar */}
        <div className="hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:gap-3">
          {isPreGame ? (
            <BotPreGame bot={bot} selectedColor={preGameColor} onColorChange={setPreGameColor} selectedTC={preGameTC} onTCChange={setPreGameTC} onStart={startGame} />
          ) : (
            <>
              {/* Bot identity card */}
              <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-4">
                <BotAvatar bot={bot} size="xl" />
                <div className="text-sm font-bold text-zinc-800">{bot.name}</div>
                {bot.epithet && (
                  <div className="text-xs italic text-zinc-500">{bot.epithet}</div>
                )}
                <div className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                  ELO {bot.elo}
                </div>
              </div>

              {botMessage && !isGameOverModal && (
                <BotSpeechBubble message={botMessage} />
              )}

              {!isGameOverModal && (
                <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-sm text-zinc-500">
                  {interactive ? "Sua vez" : `${bot.name} pensando...`}
                </div>
              )}

              <div className="flex-1 overflow-hidden rounded-xl border bg-white">
                <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Lances
                </div>
                <MoveList
                  history={history}
                  activeIndex={viewHalfMove}
                  onClickMove={(idx) => setViewHalfMove(idx >= history.length - 1 ? null : idx)}
                />
              </div>

              {!isGameOverModal && (
                <div>
                  {!showResignConfirm ? (
                    <button
                      onClick={() => setShowResignConfirm(true)}
                      className="w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {"\uD83C\uDFF3"} Render-se
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleResign}
                        className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Sim, render-me
                      </button>
                      <button
                        onClick={() => setShowResignConfirm(false)}
                        className="flex-1 rounded-xl border py-2.5 text-sm hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Engine error alert */}
      {engineError && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 shadow-lg">
          {engineError}
        </div>
      )}

      {isGameOverModal && (
        <GameOverModal
          bot={bot}
          result={gameResult}
          reason={gameOverReason}
          analysis={analysis}
          analyzing={analyzing}
          nextBotId={nextBot?.id ?? null}
          nextBotName={nextBot?.name}
          onViewReview={() => setPhase("post-game")}
          onRematch={handleRematch}
          onNewBot={() => router.push("/bots")}
          onNextBot={nextBot ? () => router.push(`/bots/${nextBot.id}`) : undefined}
        />
      )}
    </div>
  );
}
