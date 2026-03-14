import { Chess } from "chess.js";
import type { Square, PieceSymbol } from "chess.js";
import type { StockfishEngine } from "./StockfishEngine";
import type { PlayerColor } from "@/types/bot";

export type MoveCategory =
  | "brilliant"   // !! — sacrifice + near-best + contested position
  | "great"       // !  — best move in complex/balanced position
  | "best"        // engine's top choice
  | "good"        // small eval loss
  | "inaccuracy"  // ?! — moderate loss
  | "mistake"     // ?  — significant loss
  | "blunder";    // ?? — severe loss

export interface MoveAnalysis {
  moveNumber: number;
  moveUci: string;
  moveSan: string;
  fen: string; // position before the move
  bestMoveUci: string;
  bestMoveSan: string;
  evalBefore: number; // centipawns from player's perspective
  evalAfter: number;
  cpLoss: number;
  winProbBefore: number; // 0-1
  winProbAfter: number;  // 0-1
  winProbLoss: number;   // 0-1 (before - after, clamped >=0)
  moveAccuracy: number;  // 0-100 per-move
  category: MoveCategory;
  isSacrifice?: boolean;
  skipped?: boolean;
  halfMoveIndex: number;
}

export interface GameAnalysis {
  accuracy: number;
  moves: MoveAnalysis[];
  counts: Record<MoveCategory, number>;
  topBlunders: MoveAnalysis[];
  bestPlayerMove: MoveAnalysis | null;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Convert centipawns (player's perspective) to win probability [0, 1].
 * Uses sigmoid calibrated to Elo-based expected score (cp/400 scale).
 */
export function cpToWinProb(cp: number): number {
  if (cp > 9999) return 1.0;  // forced mate winning
  if (cp < -9999) return 0.0; // forced mate losing
  return 1 / (1 + Math.pow(10, -cp / 400));
}

/**
 * Per-move accuracy using Chess.com's approximate exponential decay model.
 * wpLossPct = win probability loss on 0-100 scale.
 */
export function computeMoveAccuracy(wpBefore: number, wpAfter: number): number {
  const wpLossPct = Math.max(0, (wpBefore - wpAfter) * 100);
  if (wpLossPct <= 0) return 100;
  const raw = 103.1668 * Math.exp(-0.04354 * wpLossPct) - 3.1668;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Detect if a move sacrifices material.
 * Sacrifice = moved piece lands on square attacked by opponent AND
 * piece value > value of what it captured.
 */
export function isSacrificingMaterial(fenBefore: string, moveUci: string): boolean {
  try {
    const chess = new Chess(fenBefore);
    const from = moveUci.slice(0, 2) as Square;
    const to = moveUci.slice(2, 4) as Square;
    const promotion = moveUci.length > 4 ? (moveUci[4] as PieceSymbol) : undefined;

    const moveObj = chess.move({ from, to, promotion });
    if (!moveObj) return false;

    const capturedValue = moveObj.captured ? PIECE_VALUES[moveObj.captured] : 0;
    const movedPieceValue = PIECE_VALUES[moveObj.piece] || 0;

    // After the move, chess.turn() is the opponent's color
    const isAttacked = chess.isAttacked(to, chess.turn());
    if (!isAttacked) return false;

    // Sacrifice if we're losing material in the exchange
    return movedPieceValue > capturedValue;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

export interface CategorizationInput {
  cpLoss: number;
  winProbLoss: number;     // 0-1
  winProbBefore: number;   // 0-1
  winProbAfter: number;    // 0-1
  isBestMove: boolean;
  isSacrifice: boolean;
  legalMoveCount: number;
  totalPieces: number;     // pieces on board (from FEN)
}

/**
 * Categorize a move. Brilliant detection aligned with chess.com criteria:
 * 1. Material sacrifice (isSacrifice)
 * 2. Best or nearly best move (isBestMove || cpLoss <= 5)
 * 3. Competitive position before (wp 0.25-0.75)
 * 4. Good position after (wp > 0.25)
 * 5. In endgame: must be THE best move
 */
export function categorize(input: CategorizationInput): MoveCategory {
  const {
    cpLoss, winProbLoss, winProbBefore, winProbAfter,
    isBestMove, isSacrifice, legalMoveCount, totalPieces,
  } = input;

  // Negative outcomes first (by severity)
  if (winProbLoss > 0.20) return "blunder";
  if (winProbLoss > 0.10) return "mistake";
  if (winProbLoss > 0.05) return "inaccuracy";

  // --- Move is at least "good" from here ---

  // Brilliant: aligned with chess.com — rare and celebratory
  if (isSacrifice) {
    const isNearBest = isBestMove || cpLoss <= 5;
    const positionContested = winProbBefore > 0.25 && winProbBefore < 0.75;
    const positionGoodAfter = winProbAfter > 0.25;
    // Endgame heuristic: few pieces → must be THE best move (chess.com: "only good move")
    const isEndgame = totalPieces <= 10;
    const endgameOk = !isEndgame || isBestMove;

    if (isNearBest && positionContested && positionGoodAfter && endgameOk) {
      return "brilliant";
    }
  }

  // Best move (great unified into best — great preserved only for DB compatibility)
  if (isBestMove) {
    return "best";
  }

  return "good";
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a completed game — only the player's moves.
 * IMPORTANT: All engine calls are sequential (engine is single-threaded).
 */
export async function analyzeGame(
  history: { san: string; before: string; after: string }[],
  playerColor: PlayerColor,
  engine: StockfishEngine,
  onProgress?: (current: number, total: number) => void
): Promise<GameAnalysis> {
  const ANALYSIS_DEPTH = 12;
  const playerMoveIndices: number[] = [];

  // Determine which moves are the player's (0-indexed: white=even, black=odd)
  for (let i = 0; i < history.length; i++) {
    const isWhiteMove = i % 2 === 0;
    if (
      (playerColor === "white" && isWhiteMove) ||
      (playerColor === "black" && !isWhiteMove)
    ) {
      playerMoveIndices.push(i);
    }
  }

  const totalMoves = playerMoveIndices.length;
  const analyses: MoveAnalysis[] = [];

  for (let pi = 0; pi < playerMoveIndices.length; pi++) {
    const i = playerMoveIndices[pi];
    const move = history[i];
    onProgress?.(pi + 1, totalMoves);

    try {
      // Sequential calls — engine is single-threaded, cannot run concurrently
      const evalBefore = await engine.evaluate(move.before, ANALYSIS_DEPTH);
      const bestMoveUci = await engine.bestMove(move.before, ANALYSIS_DEPTH);
      const evalAfterRaw = await engine.evaluate(move.after, ANALYSIS_DEPTH);

      // Normalize evals to player's perspective.
      // SF returns eval from side-to-move's POV:
      // - Before player's move: player is side-to-move → evalBefore is already player's perspective
      // - After player's move: opponent is side-to-move → negate to get player's perspective
      const playerEvalBefore = evalBefore;
      const playerEvalAfter = -evalAfterRaw;
      const cpLoss = Math.max(0, playerEvalBefore - playerEvalAfter);

      // Win probability
      const winProbBefore = cpToWinProb(playerEvalBefore);
      const winProbAfter = cpToWinProb(playerEvalAfter);
      const winProbLoss = Math.max(0, winProbBefore - winProbAfter);
      let moveAccuracy = computeMoveAccuracy(winProbBefore, winProbAfter);

      // Derive UCI and SAN from the player's move
      const tempChess = new Chess(move.before);
      const moveObj = tempChess.move(move.san);
      const moveUci = moveObj
        ? moveObj.from + moveObj.to + (moveObj.promotion || "")
        : "";

      const isBestMove = moveUci === bestMoveUci;

      // Best move SAN
      let bestMoveSan = bestMoveUci;
      try {
        const bestChess = new Chess(move.before);
        const bestObj = bestChess.move({
          from: bestMoveUci.slice(0, 2) as Square,
          to: bestMoveUci.slice(2, 4) as Square,
          promotion: bestMoveUci.length > 4 ? (bestMoveUci[4] as PieceSymbol) : undefined,
        });
        if (bestObj) bestMoveSan = bestObj.san;
      } catch { /* keep UCI fallback */ }

      // Legal move count & sacrifice detection
      const legalMoveCount = new Chess(move.before).moves().length;
      const sacrifice = isSacrificingMaterial(move.before, moveUci);

      // Forced move (only 1 legal) → always 100% accuracy
      if (legalMoveCount === 1) moveAccuracy = 100;

      // Count pieces on board for endgame detection
      const totalPieces = move.before.replace(/[^pnbrqkPNBRQK]/g, "").length;

      const category = categorize({
        cpLoss,
        winProbLoss,
        winProbBefore,
        winProbAfter,
        isBestMove,
        isSacrifice: sacrifice,
        legalMoveCount,
        totalPieces,
      });

      analyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        moveUci,
        moveSan: move.san,
        fen: move.before,
        bestMoveUci,
        bestMoveSan,
        evalBefore: playerEvalBefore,
        evalAfter: playerEvalAfter,
        cpLoss,
        winProbBefore,
        winProbAfter,
        winProbLoss,
        moveAccuracy,
        category,
        isSacrifice: sacrifice,
        halfMoveIndex: i,
      });
    } catch {
      // Timeout or engine error — skip this move
      analyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        moveUci: "",
        moveSan: move.san,
        fen: move.before,
        bestMoveUci: "",
        bestMoveSan: "",
        evalBefore: 0,
        evalAfter: 0,
        cpLoss: 0,
        winProbBefore: 0.5,
        winProbAfter: 0.5,
        winProbLoss: 0,
        moveAccuracy: 50,
        category: "good",
        skipped: true,
        halfMoveIndex: i,
      });
    }
  }

  // Overall accuracy: average of per-move accuracies
  const validMoves = analyses.filter((a) => !a.skipped);
  const accuracy =
    validMoves.length > 0
      ? Math.round(
          validMoves.reduce((sum, a) => sum + a.moveAccuracy, 0) / validMoves.length
        )
      : 0;

  // Count categories
  const counts: Record<MoveCategory, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  for (const a of validMoves) counts[a.category]++;

  // Top 3 worst moves (sorted by win probability loss)
  const topBlunders = validMoves
    .filter((a) => a.category === "blunder" || a.category === "mistake")
    .sort((a, b) => b.winProbLoss - a.winProbLoss)
    .slice(0, 3);

  // Best player move (highest accuracy, prefer brilliant/great)
  const bestPlayerMove = validMoves.length > 0
    ? validMoves.reduce((best, curr) => {
        if (curr.moveAccuracy > best.moveAccuracy) return curr;
        if (curr.moveAccuracy === best.moveAccuracy) {
          const rank = (c: MoveCategory) =>
            c === "brilliant" ? 3 : c === "great" ? 2 : c === "best" ? 1 : 0;
          if (rank(curr.category) > rank(best.category)) return curr;
        }
        return best;
      })
    : null;

  return { accuracy, moves: analyses, counts, topBlunders, bestPlayerMove };
}
