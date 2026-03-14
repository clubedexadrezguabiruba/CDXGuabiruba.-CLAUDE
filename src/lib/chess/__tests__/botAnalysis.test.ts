import { describe, it, expect } from "vitest";
import {
  cpToWinProb,
  computeMoveAccuracy,
  isSacrificingMaterial,
  categorize,
} from "../botAnalysis";
import type { CategorizationInput } from "../botAnalysis";

// ---------------------------------------------------------------------------
// cpToWinProb
// ---------------------------------------------------------------------------

describe("cpToWinProb", () => {
  it("returns 0.5 for equal position (cp=0)", () => {
    expect(cpToWinProb(0)).toBe(0.5);
  });

  it("returns ~0.909 for cp=400", () => {
    expect(cpToWinProb(400)).toBeCloseTo(0.909, 2);
  });

  it("returns ~0.091 for cp=-400", () => {
    expect(cpToWinProb(-400)).toBeCloseTo(0.091, 2);
  });

  it("returns 1.0 for mate winning (cp > 9999)", () => {
    expect(cpToWinProb(10099)).toBe(1.0);
    expect(cpToWinProb(10050)).toBe(1.0);
  });

  it("returns close to 1.0 for very large positive cp (not mate)", () => {
    expect(cpToWinProb(9000)).toBeGreaterThan(0.99);
    expect(cpToWinProb(9500)).toBeGreaterThan(0.99);
  });

  it("returns 0.0 for mate losing (cp < -9999)", () => {
    expect(cpToWinProb(-10099)).toBe(0.0);
    expect(cpToWinProb(-10050)).toBe(0.0);
  });

  it("returns close to 0.0 for very large negative cp (not mate)", () => {
    expect(cpToWinProb(-9000)).toBeLessThan(0.01);
    expect(cpToWinProb(-9500)).toBeLessThan(0.01);
  });

  it("is symmetric: cpToWinProb(x) + cpToWinProb(-x) ≈ 1.0", () => {
    for (const x of [100, 200, 500, 1000, 2000]) {
      const sum = cpToWinProb(x) + cpToWinProb(-x);
      expect(sum).toBeCloseTo(1.0, 10);
    }
  });

  it("is monotonically increasing for non-mate values", () => {
    const values = [-2000, -1000, -500, -200, -100, 0, 100, 200, 500, 1000, 2000];
    for (let i = 1; i < values.length; i++) {
      expect(cpToWinProb(values[i])).toBeGreaterThan(cpToWinProb(values[i - 1]));
    }
  });
});

// ---------------------------------------------------------------------------
// computeMoveAccuracy
// ---------------------------------------------------------------------------

describe("computeMoveAccuracy", () => {
  it("returns 100 when no loss (same wp)", () => {
    expect(computeMoveAccuracy(0.6, 0.6)).toBe(100);
  });

  it("returns 100 when wp improves (wpAfter > wpBefore)", () => {
    expect(computeMoveAccuracy(0.5, 0.55)).toBe(100);
  });

  it("returns high accuracy for small loss", () => {
    const acc = computeMoveAccuracy(0.8, 0.78);
    expect(acc).toBeGreaterThan(80);
  });

  it("returns low accuracy for large loss", () => {
    const acc = computeMoveAccuracy(0.7, 0.2);
    expect(acc).toBeLessThan(20);
  });

  it("never returns negative", () => {
    expect(computeMoveAccuracy(1.0, 0.0)).toBeGreaterThanOrEqual(0);
  });

  it("never returns above 100", () => {
    expect(computeMoveAccuracy(0.0, 1.0)).toBeLessThanOrEqual(100);
  });

  it("result is always in [0, 100] for various inputs", () => {
    const pairs: [number, number][] = [
      [0, 0], [1, 0], [0.5, 0.5], [0.99, 0.01], [0.5, 0.49],
    ];
    for (const [before, after] of pairs) {
      const acc = computeMoveAccuracy(before, after);
      expect(acc).toBeGreaterThanOrEqual(0);
      expect(acc).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// isSacrificingMaterial
// ---------------------------------------------------------------------------

describe("isSacrificingMaterial", () => {
  const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("returns false for normal pawn push (not attacked)", () => {
    expect(isSacrificingMaterial(STARTPOS, "e2e4")).toBe(false);
  });

  it("returns false for invalid FEN", () => {
    expect(isSacrificingMaterial("invalid", "e2e4")).toBe(false);
  });

  it("returns false for invalid move", () => {
    expect(isSacrificingMaterial(STARTPOS, "a1h8")).toBe(false);
  });

  it("returns true when knight moves to square attacked by pawn", () => {
    // White knight on b5, black pawn on a6 attacks b5 → but we need Nc3 attacked
    // FEN: white Nb1, black pawn on d4. After Nc3, d4 attacks c3.
    // Actually simpler: white knight on g1, black pawn on f6.
    // After Nf3, f6 doesn't attack f3. Let's use explicit setup.
    // FEN where white Nb1 can go to c3 which is attacked by black pawn on d4
    const fen = "rnbqkb1r/ppp1pppp/5n2/8/3p4/8/PPPPPPPP/RNBQKBNR w KQkq - 0 3";
    // Nb1 → c3, and d4 pawn attacks c3 (d4 can take on c3)
    expect(isSacrificingMaterial(fen, "b1c3")).toBe(true);
  });

  it("returns true when queen captures pawn on attacked square (Q value > p value)", () => {
    // White queen captures pawn on f7 which is defended by king on e8
    const fen = "rnbqkbnr/pppppBpp/8/8/4P3/3Q4/PPPP1PPP/RNB1K1NR w KQkq - 0 1";
    // Actually let's use a cleaner FEN. White Qd3 captures pawn f5 defended by pawn g6
    const fen2 = "rnbqkbnr/pppppp1p/6p1/5p2/8/3Q4/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
    // Qd3 x f5, f5 is attacked by g6 pawn → sacrifice (9 > 1)
    expect(isSacrificingMaterial(fen2, "d3f5")).toBe(true);
  });

  it("returns false when pawn captures pawn on attacked square (equal value)", () => {
    // After 1.e4 d5, exd5 captures pawn. If d5 is also defended, pawn value = pawn value.
    // FEN after 1.e4 d5: black pawn on d5 defended by Qd8 (not pawn). Actually we need
    // the captured square to be attacked by opponent. Let's make c6 defend d5.
    const fen = "rnbqkbnr/pp2pppp/2p5/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
    // exd5, d5 is defended by c6 pawn → pawn captures pawn, 1 > 1 is false
    expect(isSacrificingMaterial(fen, "e4d5")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// categorize
// ---------------------------------------------------------------------------

describe("categorize", () => {
  function makeInput(overrides: Partial<CategorizationInput>): CategorizationInput {
    return {
      cpLoss: 0,
      winProbLoss: 0,
      winProbBefore: 0.5,
      winProbAfter: 0.5,
      isBestMove: false,
      isSacrifice: false,
      legalMoveCount: 20,
      totalPieces: 32,
      ...overrides,
    };
  }

  it("returns blunder when winProbLoss > 0.20", () => {
    expect(categorize(makeInput({ winProbLoss: 0.25 }))).toBe("blunder");
  });

  it("returns mistake when winProbLoss > 0.10", () => {
    expect(categorize(makeInput({ winProbLoss: 0.15 }))).toBe("mistake");
  });

  it("returns inaccuracy when winProbLoss > 0.05", () => {
    expect(categorize(makeInput({ winProbLoss: 0.08 }))).toBe("inaccuracy");
  });

  it("returns good for small loss, non-best move", () => {
    expect(categorize(makeInput({ winProbLoss: 0.03 }))).toBe("good");
  });

  it("returns best for engine's top choice in simple position", () => {
    expect(categorize(makeInput({ isBestMove: true, legalMoveCount: 3, winProbBefore: 0.9 }))).toBe("best");
  });

  it("returns best for best move in complex balanced position (great unified into best)", () => {
    expect(categorize(makeInput({ isBestMove: true, legalMoveCount: 10, winProbBefore: 0.5 }))).toBe("best");
  });

  it("returns brilliant for sacrifice + near-best + contested + good after", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: true,
      cpLoss: 0,
      winProbBefore: 0.5,
      winProbAfter: 0.55,
      winProbLoss: 0,
    }))).toBe("brilliant");
  });

  it("brilliant rejected when cpLoss > 5 and not best move", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: false,
      cpLoss: 10,
      winProbBefore: 0.5,
      winProbAfter: 0.45,
      winProbLoss: 0.01,
    }))).toBe("good");
  });

  it("brilliant rejected when position bad after sacrifice (winProbAfter <= 0.25)", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: true,
      cpLoss: 0,
      winProbBefore: 0.5,
      winProbAfter: 0.20,
      winProbLoss: 0.03,
    }))).toBe("best");
  });

  it("brilliant rejected in endgame when not best move", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: false,
      cpLoss: 3,
      winProbBefore: 0.5,
      winProbAfter: 0.55,
      winProbLoss: 0,
      totalPieces: 8,
    }))).toBe("good");
  });

  // Boundary tests (strict >)
  it("boundary: winProbLoss exactly 0.20 is NOT blunder", () => {
    expect(categorize(makeInput({ winProbLoss: 0.20 }))).not.toBe("blunder");
    expect(categorize(makeInput({ winProbLoss: 0.20 }))).toBe("mistake");
  });

  it("boundary: winProbLoss exactly 0.10 is NOT mistake", () => {
    expect(categorize(makeInput({ winProbLoss: 0.10 }))).not.toBe("mistake");
    expect(categorize(makeInput({ winProbLoss: 0.10 }))).toBe("inaccuracy");
  });

  it("boundary: winProbLoss exactly 0.05 is NOT inaccuracy", () => {
    expect(categorize(makeInput({ winProbLoss: 0.05 }))).not.toBe("inaccuracy");
    expect(categorize(makeInput({ winProbLoss: 0.05 }))).toBe("good");
  });

  it("brilliant rejected when position already winning (wpBefore >= 0.75)", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: true,
      cpLoss: 0,
      winProbBefore: 0.80,
      winProbAfter: 0.85,
      winProbLoss: 0,
    }))).toBe("best");
  });

  it("brilliant rejected when position already losing (wpBefore <= 0.25)", () => {
    expect(categorize(makeInput({
      isSacrifice: true,
      isBestMove: true,
      cpLoss: 0,
      winProbBefore: 0.20,
      winProbAfter: 0.30,
      winProbLoss: 0,
    }))).toBe("best");
  });

  it("great no longer returned — best move always returns best", () => {
    // Previously, best move in complex balanced position returned "great"
    // Now unified: always "best"
    expect(categorize(makeInput({ isBestMove: true, legalMoveCount: 6, winProbBefore: 0.5 }))).toBe("best");
    expect(categorize(makeInput({ isBestMove: true, legalMoveCount: 10, winProbBefore: 0.15 }))).toBe("best");
    expect(categorize(makeInput({ isBestMove: true, legalMoveCount: 10, winProbBefore: 0.85 }))).toBe("best");
  });
});
