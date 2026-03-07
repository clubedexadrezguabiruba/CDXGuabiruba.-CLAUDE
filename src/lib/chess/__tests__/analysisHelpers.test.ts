import { describe, it, expect } from "vitest";
import {
  formatEval,
  evalBarPercent,
  getLastMoveSquares,
  accuracyColor,
} from "../analysisHelpers";

// ---------------------------------------------------------------------------
// formatEval
// ---------------------------------------------------------------------------

describe("formatEval", () => {
  it("formats positive cp correctly", () => {
    expect(formatEval(523)).toBe("+5.23");
  });

  it("formats negative cp correctly", () => {
    expect(formatEval(-142)).toBe("-1.42");
  });

  it("formats zero as +0.00", () => {
    expect(formatEval(0)).toBe("+0.00");
  });

  it("formats small positive cp", () => {
    expect(formatEval(50)).toBe("+0.50");
  });

  it("returns +M for mate winning (cp >= 9000)", () => {
    expect(formatEval(9000)).toBe("+M");
    expect(formatEval(10000)).toBe("+M");
  });

  it("returns -M for mate losing (cp <= -9000)", () => {
    expect(formatEval(-9000)).toBe("-M");
    expect(formatEval(-10000)).toBe("-M");
  });
});

// ---------------------------------------------------------------------------
// evalBarPercent
// ---------------------------------------------------------------------------

describe("evalBarPercent", () => {
  it("returns 50 for equal position (cp=0)", () => {
    expect(evalBarPercent(0)).toBe(50);
  });

  it("returns 100 for mate winning", () => {
    expect(evalBarPercent(9000)).toBe(100);
  });

  it("returns 0 for mate losing", () => {
    expect(evalBarPercent(-9000)).toBe(0);
  });

  it("large positive returns <= 98 (clamped)", () => {
    expect(evalBarPercent(2000)).toBeLessThanOrEqual(98);
    expect(evalBarPercent(2000)).toBeGreaterThan(90);
  });

  it("large negative returns >= 2 (clamped)", () => {
    expect(evalBarPercent(-2000)).toBeGreaterThanOrEqual(2);
    expect(evalBarPercent(-2000)).toBeLessThan(10);
  });

  it("is monotonically increasing", () => {
    const values = [-5000, -2000, -500, -100, 0, 100, 500, 2000, 5000];
    for (let i = 1; i < values.length; i++) {
      expect(evalBarPercent(values[i])).toBeGreaterThanOrEqual(evalBarPercent(values[i - 1]));
    }
  });

  it("result always in [2, 98] for non-mate values", () => {
    for (const cp of [-8000, -3000, -1000, -100, 0, 100, 1000, 3000, 8000]) {
      const pct = evalBarPercent(cp);
      expect(pct).toBeGreaterThanOrEqual(2);
      expect(pct).toBeLessThanOrEqual(98);
    }
  });
});

// ---------------------------------------------------------------------------
// getLastMoveSquares
// ---------------------------------------------------------------------------

describe("getLastMoveSquares", () => {
  const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("returns [from, to] for valid move", () => {
    expect(getLastMoveSquares(STARTPOS, "e4")).toEqual(["e2", "e4"]);
  });

  it("returns [from, to] for knight move", () => {
    expect(getLastMoveSquares(STARTPOS, "Nf3")).toEqual(["g1", "f3"]);
  });

  it("returns undefined for invalid SAN", () => {
    expect(getLastMoveSquares(STARTPOS, "Qh5")).toBeUndefined();
  });

  it("returns undefined for invalid FEN", () => {
    expect(getLastMoveSquares("invalid fen", "e4")).toBeUndefined();
  });

  it("handles castling", () => {
    const fen = "r1bqkbnr/pppppppp/2n5/8/8/5NP1/PPPPPPBP/RNBQK2R w KQkq - 2 3";
    const result = getLastMoveSquares(fen, "O-O");
    expect(result).toEqual(["e1", "g1"]);
  });
});

// ---------------------------------------------------------------------------
// accuracyColor
// ---------------------------------------------------------------------------

describe("accuracyColor", () => {
  it("returns green for accuracy >= 75", () => {
    expect(accuracyColor(75)).toBe("#22c55e");
    expect(accuracyColor(90)).toBe("#22c55e");
    expect(accuracyColor(100)).toBe("#22c55e");
  });

  it("returns yellow for accuracy 50-74", () => {
    expect(accuracyColor(74)).toBe("#eab308");
    expect(accuracyColor(50)).toBe("#eab308");
    expect(accuracyColor(60)).toBe("#eab308");
  });

  it("returns orange for accuracy 25-49", () => {
    expect(accuracyColor(49)).toBe("#f97316");
    expect(accuracyColor(25)).toBe("#f97316");
    expect(accuracyColor(30)).toBe("#f97316");
  });

  it("returns red for accuracy < 25", () => {
    expect(accuracyColor(24)).toBe("#ef4444");
    expect(accuracyColor(0)).toBe("#ef4444");
    expect(accuracyColor(10)).toBe("#ef4444");
  });
});
