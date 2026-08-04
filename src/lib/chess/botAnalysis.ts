import { Chess } from "chess.js";
import type { Square, PieceSymbol } from "chess.js";
import type { StockfishEngine, EngineAnalysis } from "./StockfishEngine";
import { encodeMate } from "./StockfishEngine";
import { toEpd } from "./openingBook";
import type { OpeningBook, OpeningName } from "./openingBook";
import type { PlayerColor } from "@/types/bot";

/**
 * Post-game review model — three parts, three different provenances:
 *
 *  - **Accuracy**: port of Lichess' open algorithm (lila `AccuracyPercent.scala`
 *    + scalachess `eval.scala`): win% sigmoid, per-move exponential decay, and a
 *    game score that is the mean of a volatility-weighted mean and a harmonic
 *    mean. Constants below are the literals from their source.
 *  - **Categories**: chess.com's published "expected points" bands
 *    (inaccuracy 0.05–0.10, mistake 0.10–0.20, blunder ≥ 0.20).
 *  - **Brilliant**: our own conservative rule. chess.com's real CAPS is
 *    proprietary and rating-dependent — we do not claim equivalence, only the
 *    same spirit: brilliant should be rare.
 *  - **Book**: origin, not quality. A move still inside opening theory
 *    (`openingBook.ts`) is neither praise nor blame and leaves the accuracy
 *    average entirely — see `aplicarLivro`.
 */

export type MoveCategory =
  | "brilliant"   // !! — real sacrifice + confirmed best move + contested position
  | "great"       // !  — never returned today; kept for DB compatibility
  | "best"        // engine's top choice
  | "good"        // small eval loss
  | "inaccuracy"  // ?! — moderate loss
  | "mistake"     // ?  — significant loss
  | "blunder"     // ?? — severe loss
  | "book";       // opening theory — outside the accuracy average

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
  moveAccuracy: number;  // 0-100 per-move — the real value, even when book
  category: MoveCategory;
  isSacrifice?: boolean;
  /**
   * Was this move still inside opening theory? Kept beside `category` and not
   * folded into it, because the label can hide the quality: a move that theory
   * knows and the engine dislikes shows up as "book", and only this flag plus
   * `winProbLoss` say what really happened.
   */
  isBookMove: boolean;
  skipped?: boolean;
  halfMoveIndex: number;
}

export interface GameAnalysis {
  accuracy: number;
  moves: MoveAnalysis[];
  counts: Record<MoveCategory, number>;
  topBlunders: MoveAnalysis[];
  allMoves: MoveAnalysis[];
  botAccuracy: number;
  botCounts: Record<MoveCategory, number>;
  /**
   * How many moves actually entered each accuracy average.
   *
   * `computeGameAccuracy` returns 0 when nothing qualifies, and 0 is
   * indistinguishable from "played terribly". A child who plays four moves of
   * theory and resigns would read "Precisão: 0%". With the count, every surface
   * can tell the two apart and print nothing instead of a lie.
   */
  accuracyMoveCount: number;
  botAccuracyMoveCount: number;
  /** Deepest named opening the game reached — independent of the book latch. */
  opening: OpeningName | null;
}

// ---------------------------------------------------------------------------
// Win probability and per-move accuracy (Lichess constants)
// ---------------------------------------------------------------------------

/** scalachess `eval.scala`: MULTIPLIER, applied to a centipawn value ceiled at ±1000. */
const WIN_PCT_MULTIPLIER = 0.00368208;
const CP_CEILING = 1000;

/**
 * Convert centipawns (side's perspective) to win percentage on a 0-100 scale.
 *
 * The ±1000 ceiling is what keeps a mate from reading as 100%: any mate sentinel
 * (±10001..±10100) saturates at 97.54% / 2.46%. Never feed `exp` an unceiled cp.
 */
export function cpToWinPct(cp: number): number {
  const ceiled = Math.max(-CP_CEILING, Math.min(CP_CEILING, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-WIN_PCT_MULTIPLIER * ceiled)) - 1);
}

/**
 * Per-move accuracy, 0-100. Both arguments are win percentages on a 0-100 scale,
 * from the moving side's perspective.
 *
 * lila `AccuracyPercent.fromWinPercents` — including the `+ 1` uncertainty bonus
 * that the public write-up omits.
 */
export function computeMoveAccuracy(wpBeforePct: number, wpAfterPct: number): number {
  if (wpAfterPct >= wpBeforePct) return 100;
  const winDiff = wpBeforePct - wpAfterPct;
  const raw =
    103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
  return Math.max(0, Math.min(100, raw + 1));
}

// ---------------------------------------------------------------------------
// Material channel (escapes the win% sigmoid's saturation)
// ---------------------------------------------------------------------------

/**
 * The win% sigmoid saturates beyond ±1000cp: once a side is completely lost,
 * hanging yet another piece loses ~0 win-percentage points, so the move would
 * read as "good" with 100% accuracy. Measured against chess.com on the same
 * game: they mark those hangs "?" (mistake), we left them blank. This channel
 * judges a move by its raw centipawn loss, in three regimes, and the final
 * category/accuracy take the worse of the two channels.
 */
export type MaterialSeverity = "none" | "inaccuracy" | "mistake" | "blunder";

/** Mate sentinels (±10001..10100) read as "±25 pawns" for centipawn arithmetic. */
const MATE_CHANNEL_CP = 2500;

/** Centipawn loss for the material channel, with mate sentinels mapped to ±2500. */
export function channelCpLoss(moverEvalBefore: number, moverEvalAfter: number): number {
  const map = (v: number) => (Math.abs(v) > 9999 ? Math.sign(v) * MATE_CHANNEL_CP : v);
  return Math.max(0, map(moverEvalBefore) - map(moverEvalAfter));
}

/**
 * Severity of a material loss, given where the game stood (win probs 0-1,
 * mover's POV).
 *
 * - Still winning big after the move (wp >= 0.90, ~+600cp): conversion slack.
 *   Only a rook-or-more given away (>= 900cp) whispers, and never above
 *   "inaccuracy" — this is also where a missed mate lands.
 * - Already dead lost before the move (wp <= 0.10, ~-600cp): the saturated
 *   regime this channel exists for. A hung piece (>= 250cp) is a mistake —
 *   capped there, matching the "?" chess.com gives these, never "??".
 * - Contested positions: the win% channel is sensitive here and usually
 *   dominates; these bands only add a floor for outright hangs.
 */
export function judgeMaterialLoss(
  cpLoss: number,
  winProbBefore: number,
  winProbAfter: number
): MaterialSeverity {
  if (winProbAfter >= 0.90) {
    return cpLoss >= 900 ? "inaccuracy" : "none";
  }
  if (winProbBefore <= 0.10) {
    return cpLoss >= 250 ? "mistake" : "none";
  }
  if (cpLoss >= 900) return "blunder";
  if (cpLoss >= 300) return "mistake";
  if (cpLoss >= 150) return "inaccuracy";
  return "none";
}

/**
 * Per-move accuracy ceiling for each severity — the lichess accuracy curve
 * evaluated at the middle of the corresponding win%-loss band (7.5/15/25pp),
 * so a saturated hang scores like the same hang in a contested position.
 */
const SEVERITY_ACCURACY_CAP: Record<MaterialSeverity, number> = {
  none: 100,
  inaccuracy: 72,
  mistake: 52,
  blunder: 33,
};

// ---------------------------------------------------------------------------
// Sacrifice detection (static exchange evaluation)
// ---------------------------------------------------------------------------

const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 };

/** Guard against pathological recursion; a real exchange never gets close. */
const SEE_MAX_DEPTH = 32;

/**
 * How much material the side to move can win on `square`, playing the exchange
 * out with real legal moves.
 *
 *   seeGain = max(0, max over every legal capture m on `square` of
 *                    value(piece standing on square) − seeGain(position after m))
 *
 * The 0 is the option of not capturing at all (standing pat).
 *
 * Every capture is explored, not just the least-valuable attacker: LVA ordering
 * is only optimal in the static model, and with legal moves pins and checks break
 * that guarantee. Cost is irrelevant — this runs 0-3 times per game, on candidate
 * moves only.
 *
 * Using legal moves buys, for free: absolutely pinned attackers are excluded, the
 * king only recaptures on an undefended square, x-ray attackers appear as the
 * blockers leave, and a promotion inside the sequence is picked up because the
 * victim's value is re-read from the board at each level.
 */
export function seeGain(fen: string, square: Square, depth = 0): number {
  if (depth >= SEE_MAX_DEPTH) return 0;

  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return 0;
  }

  const victim = chess.get(square);
  if (!victim) return 0;
  const victimValue = PIECE_VALUES[victim.type] ?? 0;

  let best = 0; // standing pat
  for (const move of chess.moves({ verbose: true })) {
    if (move.to !== square || !move.captured) continue;
    const next = new Chess(fen);
    next.move({ from: move.from, to: move.to, promotion: move.promotion });
    const gain = victimValue - seeGain(next.fen(), square, depth + 1);
    if (gain > best) best = gain;
  }
  return best;
}

/**
 * Does this move give up material on its destination square?
 *
 * netValue = what the opponent wins on that square afterwards − what the move
 * captured. A sacrifice is netValue >= 2 (a minor piece or more).
 *
 * Accepted limitations, deliberately on the conservative side (they can only
 * produce *fewer* brilliants, never more):
 *  - only the destination square is examined — hanging a *different* piece
 *    elsewhere does not count as a sacrifice;
 *  - en passant is invisible to the square scan (it only ever involves a pawn,
 *    net 1 < 2, so it could not qualify anyway);
 *  - the material gained by a promotion *inside* the exchange sequence is not
 *    added to the winner's tally.
 */
export function computeSacrifice(
  fenBefore: string,
  moveUci: string
): { isSacrifice: boolean; netValue: number } {
  try {
    const chess = new Chess(fenBefore);
    const from = moveUci.slice(0, 2) as Square;
    const to = moveUci.slice(2, 4) as Square;
    const promotion = moveUci.length > 4 ? (moveUci[4] as PieceSymbol) : undefined;

    const moveObj = chess.move({ from, to, promotion });
    if (!moveObj) return { isSacrifice: false, netValue: 0 };
    // Promoting is a material *gain*; never treat it as a sacrifice.
    if (moveObj.promotion) return { isSacrifice: false, netValue: 0 };

    const capturedValue = moveObj.captured ? PIECE_VALUES[moveObj.captured] : 0;
    const netValue = seeGain(chess.fen(), to) - capturedValue;
    return { isSacrifice: netValue >= 2, netValue };
  } catch {
    return { isSacrifice: false, netValue: 0 };
  }
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

export interface CategorizationInput {
  winProbLoss: number;     // 0-1
  winProbBefore: number;   // 0-1
  winProbAfter: number;    // 0-1
  isBestMove: boolean;
  isSacrifice: boolean;    // SEE >= 2, and (for brilliant) confirmed at depth 16
  legalMoveCount: number;
  halfMoveIndex: number;   // 0-indexed position in game history
  materialSeverity: MaterialSeverity; // from judgeMaterialLoss
}

/**
 * Categorize a move.
 *
 * Negative thresholds are chess.com's published expected-points bands.
 * Brilliant is our own rule and is deliberately strict: a real sacrifice, the
 * engine's exact top choice (no "near enough" tolerance — a 5cp margin is noise
 * at analysis depth), a genuine choice to make, past the opening, in a position that
 * was contested before and is still healthy after.
 */
export function categorize(input: CategorizationInput): MoveCategory {
  const {
    winProbLoss, winProbBefore, winProbAfter,
    isBestMove, isSacrifice, legalMoveCount, halfMoveIndex,
    materialSeverity,
  } = input;

  // Negative outcomes first (by severity) — worse of the two channels.
  if (winProbLoss > 0.20 || materialSeverity === "blunder") return "blunder";
  if (winProbLoss > 0.10 || materialSeverity === "mistake") return "mistake";
  if (winProbLoss > 0.05 || materialSeverity === "inaccuracy") return "inaccuracy";

  // --- Move is at least "good" from here ---

  if (
    isSacrifice &&
    isBestMove &&
    legalMoveCount > 1 &&
    halfMoveIndex >= 10 &&
    winProbBefore > 0.25 &&
    winProbBefore < 0.75 &&
    winProbAfter > 0.25
  ) {
    return "brilliant";
  }

  // Best move (great unified into best — great preserved only for DB compatibility)
  if (isBestMove) return "best";

  return "good";
}

/**
 * Aplica a origem "livro" sobre a qualidade que o motor já julgou.
 *
 * Fica FORA de `categorize` de propósito: livro é procedência, não qualidade, e
 * misturar as duas custaria um campo novo em `CategorizationInput` e mexeria
 * nos ~15 testes de uma função que não tem por que mudar.
 *
 * **Livro vence imprecisão e erro, mas nunca vence Erro Grave.** A base do
 * Lichess é de nomenclatura, não de lances aprovados — sem esta trava, `2.g4`
 * do Mate do Louco sairia da conta da precisão. Gambito de verdade não é
 * afetado: o Gambito do Rei custa ~0,08 de probabilidade de vitória e o Evans
 * ~0,07, enquanto Erro Grave exige mais de 0,20. Quem cura em tempo real é o
 * motor, que continua avaliando toda posição.
 */
export function aplicarLivro(qualidade: MoveCategory, isBookMove: boolean): MoveCategory {
  if (!isBookMove) return qualidade;
  return qualidade === "blunder" ? qualidade : "book";
}

// ---------------------------------------------------------------------------
// Game accuracy (lila `AccuracyPercent.gameAccuracy`)
// ---------------------------------------------------------------------------

const WEIGHT_MIN = 0.5;
const WEIGHT_MAX = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Population standard deviation (÷n) — scalalib `Maths.standardDeviation`. */
function populationStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Game accuracy per colour, 0-100.
 *
 * @param positionWinPcts N+1 win percentages (0-100), **White's point of view**,
 *   one per position including the start. `null` = the engine gave no usable
 *   evaluation for that position. There is deliberately no carry-forward: making
 *   a value up would flatten the volatility weights and disagree with a real
 *   re-search of the same position on the next move.
 * @param moveAccuracies N per-move accuracies (0-100), the *mover's* point of
 *   view. `null` = skipped move.
 *
 * A move counts only when its own accuracy and both adjacent positions exist.
 *
 * Divergence from lila, on purpose: lila drops a move whenever *any* position in
 * its window is missing (`_.sequence`); we compute the weight from the values
 * that are present. Our gaps come from engine failures, which are rare and
 * isolated, and dropping the neighbours as well would silently delete good moves.
 */
/**
 * Which half-move indexes of one colour actually enter its accuracy average.
 *
 * A move counts only when its own accuracy and both adjacent positions exist.
 * This predicate lives here, alone, because two callers need it and they must
 * never drift: `computeGameAccuracy` builds the average from it, and
 * `analyzeGame` reports its length as `accuracyMoveCount`. A count that
 * disagreed with the average would let a surface print "0%" while claiming a
 * move was measured.
 */
export function accuracyMoveIndexes(
  positionWinPcts: (number | null)[],
  moveAccuracies: (number | null)[],
  isWhite: boolean
): number[] {
  const moveCount = moveAccuracies.length;
  if (moveCount === 0 || positionWinPcts.length !== moveCount + 1) return [];

  const indexes: number[] = [];
  for (let i = 0; i < moveCount; i++) {
    if ((i % 2 === 0) !== isWhite) continue;
    if (moveAccuracies[i] === null) continue;
    if (positionWinPcts[i] === null || positionWinPcts[i + 1] === null) continue;
    indexes.push(i);
  }
  return indexes;
}

export function computeGameAccuracy(
  positionWinPcts: (number | null)[],
  moveAccuracies: (number | null)[]
): { white: number; black: number } {
  const moveCount = moveAccuracies.length;
  if (moveCount === 0 || positionWinPcts.length !== moveCount + 1) {
    return { white: 0, black: 0 };
  }

  const len = positionWinPcts.length;
  const windowSize = clamp(Math.floor(moveCount / 10), 2, 8);

  // lila: `List.fill(windowSize.atMost(size) - 2)(take(windowSize)) ::: sliding(windowSize)`
  // — the padding repeats the first window so that there is exactly one weight
  // per move.
  const windows: (number | null)[][] = [];
  const firstWindow = positionWinPcts.slice(0, windowSize);
  const padCount = Math.max(0, Math.min(windowSize, len) - 2);
  for (let i = 0; i < padCount; i++) windows.push(firstWindow);
  if (len <= windowSize) {
    windows.push(positionWinPcts.slice());
  } else {
    for (let i = 0; i + windowSize <= len; i++) {
      windows.push(positionWinPcts.slice(i, i + windowSize));
    }
  }

  const weights = windows.map((window) => {
    const present = window.filter((v): v is number => v !== null);
    if (present.length < 2) return WEIGHT_MIN;
    return clamp(populationStdDev(present), WEIGHT_MIN, WEIGHT_MAX);
  });

  const colorAccuracy = (isWhite: boolean): number => {
    const entries = accuracyMoveIndexes(positionWinPcts, moveAccuracies, isWhite).map((i) => ({
      accuracy: moveAccuracies[i] as number,
      weight: weights[i] ?? WEIGHT_MIN,
    }));
    if (entries.length === 0) return 0;

    const weightSum = entries.reduce((sum, e) => sum + e.weight, 0);
    const weighted =
      weightSum > 0
        ? entries.reduce((sum, e) => sum + e.accuracy * e.weight, 0) / weightSum
        : 0;

    // scalalib `Maths.harmonicMean` floors each term at 1 (`1 / Math.max(1, v)`),
    // so a 0%-accuracy move drags the mean down hard without collapsing it to 0.
    const harmonic =
      entries.length / entries.reduce((sum, e) => sum + 1 / Math.max(1, e.accuracy), 0);

    return (weighted + harmonic) / 2;
  };

  return { white: colorAccuracy(true), black: colorAccuracy(false) };
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

// 14 desde a comparação com o chess.com (2026-08): a 12 o motor elegia como
// "melhor" lances que análise mais funda reprova (ex.: 4...g6?? na partida de
// referência). Custa ~2-4× o tempo da análise a 12; o timeout de busca do
// StockfishEngine foi dimensionado junto.
const ANALYSIS_DEPTH = 14;
/** A brilliant candidate is re-searched deeper, so the label does not flip with depth noise. */
const BRILLIANT_CONFIRM_DEPTH = 16;

function emptyCounts(): Record<MoveCategory, number> {
  return { brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, book: 0 };
}

/**
 * UCI of `san` played from `fenBefore`, or "" if it does not parse.
 *
 * Used only by the book path, which has to know the move before the engine has
 * said anything about it. Deliberately its own tiny function instead of hoisting
 * the derivation out of the main try/catch: doing that would change what a
 * malformed SAN does to the rest of the analysis.
 */
function uciDeSan(fenBefore: string, san: string): string {
  try {
    const chess = new Chess(fenBefore);
    const mv = chess.move(san);
    return mv.from + mv.to + (mv.promotion ?? "");
  } catch {
    return "";
  }
}

/**
 * Analyze a completed game — all moves (player + bot).
 *
 * One search per *position* instead of three per move: the evaluation after move
 * i is the evaluation before move i+1, and the best move now comes back from the
 * same search as the score. Total: N+1 searches (N when the game ends in
 * mate/stalemate, since the final position needs no engine), plus 0-3 brilliant
 * confirmations.
 *
 * All engine calls are sequential — the engine is single-threaded.
 *
 * @param book Opening book, or `null`/omitted to analyze exactly as before it
 *   existed. A parameter and not a module singleton because an internal
 *   `await loadOpeningBook()` would make every integration test call `fetch`,
 *   which does not exist under vitest/node. Positional because `onProgress`
 *   already is.
 */
export async function analyzeGame(
  history: { san: string; before: string; after: string }[],
  playerColor: PlayerColor,
  engine: StockfishEngine,
  onProgress?: (current: number, total: number) => void,
  book?: OpeningBook | null
): Promise<GameAnalysis> {
  const totalMoves = history.length;
  const allAnalyses: MoveAnalysis[] = [];

  /**
   * The book latch. Once a move leaves theory the *seal* never comes back, even
   * if a later position happens to be in the book again — the child was not
   * following theory at that point, they arrived there on their own.
   */
  let inBook = book !== null && book !== undefined;
  /**
   * The opening NAME is independent of the latch (it updates whenever the exact
   * position matches a named one, including by transposition after the
   * deviation). Same EPD means the same position: if it matched, the player did
   * in fact reach that opening. The name may therefore end up shallower than
   * the last book move, and that is correct.
   */
  let opening: OpeningName | null = null;

  /** Cache indexed by position (0..N). Position i is the board before move i. */
  const positionEvals: (EngineAnalysis | null)[] = new Array(totalMoves + 1).fill(null);
  /** Same indexing, win% from White's POV. */
  const positionWinPcts: (number | null)[] = new Array(totalMoves + 1).fill(null);
  const moveAccuracies: (number | null)[] = new Array(totalMoves).fill(null);

  /** Engine scores are side-to-move POV; White moves on even-indexed positions. */
  const whitePov = (index: number, cp: number) => cpToWinPct(index % 2 === 0 ? cp : -cp);

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    onProgress?.(i + 1, totalMoves);

    // Two independent book processes, neither of which needs the engine — so
    // they run outside the try and survive an engine timeout on this move.
    let isBookMove = false;
    if (book) {
      const uciJogado = uciDeSan(move.before, move.san);
      const teoria = book.movesByEpd.get(toEpd(move.before));
      isBookMove = inBook && uciJogado !== "" && (teoria?.has(uciJogado) ?? false);
      inBook = isBookMove;

      const nomeada = book.namesByEpd.get(toEpd(move.after));
      if (nomeada) opening = nomeada;
    }

    try {
      let before = positionEvals[i];
      if (!before) {
        before = await engine.analyze(move.before, ANALYSIS_DEPTH);
        positionEvals[i] = before;
      }
      positionWinPcts[i] = whitePov(i, before.cp);

      let after = positionEvals[i + 1];
      if (!after) {
        const post = new Chess(move.after);
        if (post.isGameOver()) {
          // Terminal position — no search needed. `encodeMate(0)` is a loss for
          // the side to move, which is exactly the side that just got mated.
          after = { cp: post.isCheckmate() ? encodeMate(0) : 0, bestMoveUci: null };
        } else {
          after = await engine.analyze(move.after, ANALYSIS_DEPTH);
        }
        positionEvals[i + 1] = after;
      }
      positionWinPcts[i + 1] = whitePov(i + 1, after.cp);

      // Normalize evals to the moving side's perspective.
      // SF returns eval from side-to-move's POV:
      // - Before move: side-to-move is the mover → already the mover's perspective
      // - After move: opponent is side-to-move → negate
      const moverEvalBefore = before.cp;
      const moverEvalAfter = -after.cp;
      const cpLoss = Math.max(0, moverEvalBefore - moverEvalAfter);

      const wpBeforePct = cpToWinPct(moverEvalBefore);
      const wpAfterPct = cpToWinPct(moverEvalAfter);
      const winProbBefore = wpBeforePct / 100;
      const winProbAfter = wpAfterPct / 100;
      const winProbLoss = Math.max(0, winProbBefore - winProbAfter);
      let moveAccuracy = computeMoveAccuracy(wpBeforePct, wpAfterPct);

      // Derive UCI and SAN from the move
      const tempChess = new Chess(move.before);
      const moveObj = tempChess.move(move.san);
      const moveUci = moveObj
        ? moveObj.from + moveObj.to + (moveObj.promotion || "")
        : "";

      const bestMoveUci = before.bestMoveUci ?? "";
      const isBestMove = moveUci !== "" && moveUci === bestMoveUci;

      // Best move SAN
      let bestMoveSan = bestMoveUci;
      if (bestMoveUci) {
        try {
          const bestChess = new Chess(move.before);
          const bestObj = bestChess.move({
            from: bestMoveUci.slice(0, 2) as Square,
            to: bestMoveUci.slice(2, 4) as Square,
            promotion: bestMoveUci.length > 4 ? (bestMoveUci[4] as PieceSymbol) : undefined,
          });
          if (bestObj) bestMoveSan = bestObj.san;
        } catch { /* keep UCI fallback */ }
      }

      const legalMoveCount = new Chess(move.before).moves().length;

      // Material channel: a hang the saturated win% channel cannot see. A forced
      // move is exempt — losing material with no alternative is not an error.
      const materialSeverity =
        legalMoveCount > 1
          ? judgeMaterialLoss(
              channelCpLoss(moverEvalBefore, moverEvalAfter),
              winProbBefore,
              winProbAfter
            )
          : "none";
      moveAccuracy = Math.min(moveAccuracy, SEVERITY_ACCURACY_CAP[materialSeverity]);

      // Forced move (only 1 legal) → always 100% accuracy
      if (legalMoveCount === 1) moveAccuracy = 100;

      // The SEE and the confirmation search are the expensive parts — only run
      // them once the cheap gates have already passed.
      const cheapGatesPass =
        isBestMove &&
        legalMoveCount > 1 &&
        i >= 10 &&
        winProbLoss <= 0.05 &&
        winProbBefore > 0.25 &&
        winProbBefore < 0.75 &&
        winProbAfter > 0.25;

      let isSacrifice = false;
      let brilliantConfirmed = false;
      if (cheapGatesPass) {
        isSacrifice = computeSacrifice(move.before, moveUci).isSacrifice;
        if (isSacrifice) {
          try {
            const deeper = await engine.analyze(move.before, BRILLIANT_CONFIRM_DEPTH);
            brilliantConfirmed = deeper.bestMoveUci === moveUci;
          } catch {
            // Confirmation failed — fall back to "best", never to brilliant.
            brilliantConfirmed = false;
          }
        }
      }

      const category = aplicarLivro(
        categorize({
          winProbLoss,
          winProbBefore,
          winProbAfter,
          isBestMove,
          isSacrifice: isSacrifice && brilliantConfirmed,
          legalMoveCount,
          halfMoveIndex: i,
          materialSeverity,
        }),
        isBookMove
      );

      // Theory leaves the accuracy average entirely. A book move barred at
      // blunder still counts — that one was a real mistake, book or not.
      moveAccuracies[i] = category === "book" ? null : moveAccuracy;

      allAnalyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        moveUci,
        moveSan: move.san,
        fen: move.before,
        bestMoveUci,
        bestMoveSan,
        evalBefore: moverEvalBefore,
        evalAfter: moverEvalAfter,
        cpLoss,
        winProbBefore,
        winProbAfter,
        winProbLoss,
        moveAccuracy,
        category,
        isSacrifice,
        isBookMove,
        halfMoveIndex: i,
      });
    } catch {
      // Timeout or engine error — skip this move. Whatever succeeded before the
      // failure stays cached, so the next move never re-uses a poisoned position:
      // it simply re-searches its own "before" if that slot is still null.
      allAnalyses.push({
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
        isBookMove,
        skipped: true,
        halfMoveIndex: i,
      });
    }
  }

  const isPlayerIndex = (halfMoveIndex: number) => {
    const isWhite = halfMoveIndex % 2 === 0;
    return (playerColor === "white" && isWhite) || (playerColor === "black" && !isWhite);
  };

  // Separate player moves for accuracy/counts (like chess.com)
  const playerMoves = allAnalyses.filter((a) => isPlayerIndex(a.halfMoveIndex));
  const validPlayerMoves = playerMoves.filter((a) => !a.skipped);
  const botMoves = allAnalyses.filter((a) => !isPlayerIndex(a.halfMoveIndex));
  const validBotMoves = botMoves.filter((a) => !a.skipped);

  const gameAccuracy = computeGameAccuracy(positionWinPcts, moveAccuracies);
  const playerIsWhite = playerColor === "white";
  const accuracy = Math.round(playerIsWhite ? gameAccuracy.white : gameAccuracy.black);
  const botAccuracy = Math.round(playerIsWhite ? gameAccuracy.black : gameAccuracy.white);
  const accuracyMoveCount = accuracyMoveIndexes(positionWinPcts, moveAccuracies, playerIsWhite).length;
  const botAccuracyMoveCount = accuracyMoveIndexes(positionWinPcts, moveAccuracies, !playerIsWhite).length;

  const counts = emptyCounts();
  for (const a of validPlayerMoves) counts[a.category]++;

  // Top 3 worst player moves. Sorted by per-move accuracy, not winProbLoss:
  // a hang in an already-lost position loses ~0 win% but must still surface.
  const topBlunders = validPlayerMoves
    .filter((a) => a.category === "blunder" || a.category === "mistake")
    .sort((a, b) => a.moveAccuracy - b.moveAccuracy)
    .slice(0, 3);

  const botCounts = emptyCounts();
  for (const a of validBotMoves) botCounts[a.category]++;

  return {
    accuracy,
    moves: playerMoves,
    counts,
    topBlunders,
    allMoves: allAnalyses,
    botAccuracy,
    botCounts,
    accuracyMoveCount,
    botAccuracyMoveCount,
    opening,
  };
}
