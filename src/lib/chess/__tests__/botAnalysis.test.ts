import { describe, it, expect } from "vitest";
import {
  cpToWinPct,
  computeMoveAccuracy,
  seeGain,
  computeSacrifice,
  computeGameAccuracy,
  categorize,
  channelCpLoss,
  judgeMaterialLoss,
  aplicarLivro,
  accuracyMoveIndexes,
} from "../botAnalysis";
import type { CategorizationInput } from "../botAnalysis";
import { encodeMate } from "../StockfishEngine";
import type { Square } from "chess.js";

// ---------------------------------------------------------------------------
// encodeMate — the single encoding shared by the UCI parser and the terminal
// short-circuit in analyzeGame.
// ---------------------------------------------------------------------------

describe("encodeMate", () => {
  it("encodes mate in N with magnitude growing as mate approaches", () => {
    expect(encodeMate(1)).toBe(10099);
    expect(encodeMate(3)).toBe(10097);
    expect(encodeMate(50)).toBe(10050);
    expect(encodeMate(99)).toBe(10001);
  });

  it("encodes both signs", () => {
    expect(encodeMate(-1)).toBe(-10099);
    expect(encodeMate(-50)).toBe(-10050);
    expect(encodeMate(-99)).toBe(-10001);
  });

  it("clamps beyond 99 moves to the ±10001 floor", () => {
    expect(encodeMate(150)).toBe(10001);
    expect(encodeMate(-150)).toBe(-10001);
  });

  it("maps a consumed mate (mate 0) to the negative extreme — side to move lost", () => {
    expect(encodeMate(0)).toBe(-10100);
  });
});

// ---------------------------------------------------------------------------
// cpToWinPct — scalachess `eval.scala` (MULTIPLIER 0.00368208, cp ceiled at ±1000)
// ---------------------------------------------------------------------------

describe("cpToWinPct", () => {
  it("returns 50 for an equal position", () => {
    expect(cpToWinPct(0)).toBe(50);
  });

  it("matches the Lichess sigmoid at reference points", () => {
    expect(cpToWinPct(100)).toBeCloseTo(59.1026, 3);
    expect(cpToWinPct(400)).toBeCloseTo(81.3487, 3);
    expect(cpToWinPct(-400)).toBeCloseTo(18.6513, 3);
  });

  it("saturates at the ±1000 ceiling — never reaches 100", () => {
    expect(cpToWinPct(1000)).toBeCloseTo(97.5447, 3);
    expect(cpToWinPct(5000)).toBeCloseTo(97.5447, 3);
    expect(cpToWinPct(1000)).toBeLessThan(100);
  });

  it("absorbs the mate sentinels through the same ceiling", () => {
    expect(cpToWinPct(10100)).toBeCloseTo(97.5447, 3);
    expect(cpToWinPct(encodeMate(1))).toBeCloseTo(97.5447, 3);
    expect(cpToWinPct(-10099)).toBeCloseTo(2.4553, 3);
    expect(cpToWinPct(encodeMate(0))).toBeCloseTo(2.4553, 3);
  });

  it("is symmetric: wp(x) + wp(-x) = 100", () => {
    for (const x of [100, 200, 500, 1000, 2000, 10100]) {
      expect(cpToWinPct(x) + cpToWinPct(-x)).toBeCloseTo(100, 10);
    }
  });

  it("is monotonically increasing below the ceiling", () => {
    const values = [-1000, -500, -200, -100, 0, 100, 200, 500, 1000];
    for (let i = 1; i < values.length; i++) {
      expect(cpToWinPct(values[i])).toBeGreaterThan(cpToWinPct(values[i - 1]));
    }
  });
});

// ---------------------------------------------------------------------------
// computeMoveAccuracy — lila `AccuracyPercent.fromWinPercents` (with the +1 bonus)
// ---------------------------------------------------------------------------

describe("computeMoveAccuracy", () => {
  it("returns 100 when the position did not get worse", () => {
    expect(computeMoveAccuracy(60, 60)).toBe(100);
    expect(computeMoveAccuracy(50, 55)).toBe(100);
  });

  it("matches the lila curve at reference win-percent losses", () => {
    expect(computeMoveAccuracy(50, 48)).toBeCloseTo(92.3954, 3);
    expect(computeMoveAccuracy(50, 45)).toBeCloseTo(80.8153, 3);
    expect(computeMoveAccuracy(50, 40)).toBeCloseTo(64.5798, 3);
    expect(computeMoveAccuracy(50, 30)).toBeCloseTo(41.0168, 3);
    expect(computeMoveAccuracy(50, 20)).toBeCloseTo(25.7720, 3);
  });

  it("reaches exactly 0 for a catastrophic loss (equal position to lost)", () => {
    // 97.5447 → 2.4553 is "winning by a mate sentinel" collapsing to "getting mated"
    expect(computeMoveAccuracy(97.5447, 2.4553)).toBe(0);
  });

  it("stays within [0, 100]", () => {
    for (const [before, after] of [[0, 0], [100, 0], [50, 50], [99, 1], [50, 49]]) {
      const acc = computeMoveAccuracy(before, after);
      expect(acc).toBeGreaterThanOrEqual(0);
      expect(acc).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// SEE — a corpus of positions, chess.js only (no engine)
// Every number below was measured by running seeGain on the FEN, not guessed.
// ---------------------------------------------------------------------------

describe("seeGain / computeSacrifice", () => {
  it("(a) piece on an attacked BUT defended square is not a sacrifice", () => {
    // Nd2-e4: e4 attacked by Nf6, defended by Pd3. Nxe4 dxe4 is an even trade.
    // This is the bug that produced three "brilliants" in one game: the old
    // isSacrificingMaterial only asked "is the square attacked?" → netValue 3.
    const fen = "4k3/8/5n2/8/8/3P4/3N4/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "d2e4");
    expect(result.netValue).toBe(0);
    expect(result.isSacrifice).toBe(false);
  });

  it("(b) queen taking a defended pawn is a sacrifice", () => {
    const fen = "rnbqkbnr/pppppp1p/6p1/5p2/8/3Q4/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
    const result = computeSacrifice(fen, "d3f5"); // Qxf5 gxf5
    expect(result.netValue).toBe(8);
    expect(result.isSacrifice).toBe(true);
  });

  it("(c) greek gift Bxh7+ with only the king defending sits exactly on the threshold", () => {
    const fen = "6k1/7p/8/8/8/3B4/8/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "d3h7"); // Bxh7+ Kxh7 → bishop for a pawn
    expect(result.netValue).toBe(2);
    expect(result.isSacrifice).toBe(true);
  });

  it("(d) an even knight trade is not a sacrifice", () => {
    const fen = "4k3/8/3p4/4n3/8/5N2/8/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "f3e5"); // Nxe5 dxe5
    expect(result.netValue).toBe(0);
    expect(result.isSacrifice).toBe(false);
  });

  it("(e) an unattacked square is not a sacrifice", () => {
    const startpos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(seeGain("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1", "e4" as Square)).toBe(0);
    expect(computeSacrifice(startpos, "e2e4").isSacrifice).toBe(false);
  });

  it("(f) a pawn given away is below the threshold (net 1 < 2)", () => {
    const fen = "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "e2e4"); // e4 dxe4, nothing recaptures
    expect(result.netValue).toBe(1);
    expect(result.isSacrifice).toBe(false);
  });

  it("(g) the move's own promotion is never a sacrifice", () => {
    // b8=Q is immediately captured by Rb1, but promoting is a material gain.
    const fen = "4k3/1P6/8/8/8/4K3/8/1r6 w - - 0 1";
    expect(computeSacrifice(fen, "b7b8q").isSacrifice).toBe(false);
  });

  it("(h) with several attackers, the best capture order wins — not the first found", () => {
    // Ne5 is attacked by pawn d6 and queen h8. Qxe5 loses material for Black
    // (dxe5 follows), so the exchange is worth exactly the knight.
    const fen = "4k2q/8/3p4/8/3P4/5N2/8/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "f3e5");
    expect(result.netValue).toBe(3);
    expect(result.isSacrifice).toBe(true);
  });

  it("(i) an absolutely pinned attacker does not count", () => {
    // bxc5 would expose Kb8 to Rb1 — chess.js never generates it.
    const fen = "1k6/8/1p6/8/8/3N4/8/1R5K w - - 0 1";
    const result = computeSacrifice(fen, "d3c5");
    expect(result.netValue).toBe(0);
    expect(result.isSacrifice).toBe(false);
  });

  it("(j) an x-ray defender behind a rook changes the verdict", () => {
    // Ne5 with White rooks doubled on e2/e1: after the file clears, Re1 recaptures.
    const withXray = "4r2k/4r3/8/8/8/5N2/4R3/4R2K w - - 0 1";
    expect(computeSacrifice(withXray, "f3e5").netValue).toBe(0);
    // Same position without the back rook: the knight really is given away.
    const withoutXray = "4r2k/4r3/8/8/8/5N2/4R3/7K w - - 0 1";
    expect(computeSacrifice(withoutXray, "f3e5").netValue).toBe(3);
    expect(computeSacrifice(withoutXray, "f3e5").isSacrifice).toBe(true);
  });

  it("(k) a king cannot recapture on a defended square", () => {
    // Kg7 attacks h6, but Pg5 defends it: after Nh6 the only legal king moves are
    // Kf8, Kh8, Kh7 and Kg6 — Kxh6 is not among them.
    const fen = "8/6k1/8/5NP1/8/8/8/4K3 w - - 0 1";
    const result = computeSacrifice(fen, "f5h6");
    expect(result.netValue).toBe(0);
    expect(result.isSacrifice).toBe(false);
  });

  it("(l) a promotion INSIDE the exchange is valued from the board, not assumed", () => {
    // Rb1 allows cxb1=N winning the rook (net 2). Reading the promoted piece as a
    // pawn would make it net 4; assuming a queen would make it not a sacrifice.
    const fen = "7k/8/8/1R6/8/8/2p5/R6K w - - 0 1";
    const result = computeSacrifice(fen, "b5b1");
    expect(result.netValue).toBe(2);
    expect(result.isSacrifice).toBe(true);
  });

  it("(m) mirrored for Black — Bxh2+ with only the king defending", () => {
    const fen = "4k3/8/3b4/8/8/8/7P/6K1 b - - 0 1";
    const result = computeSacrifice(fen, "d6h2");
    expect(result.netValue).toBe(2);
    expect(result.isSacrifice).toBe(true);
  });

  it("returns 0 for an invalid FEN or an illegal move", () => {
    expect(computeSacrifice("invalid", "e2e4")).toEqual({ isSacrifice: false, netValue: 0 });
    const startpos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(computeSacrifice(startpos, "a1h8")).toEqual({ isSacrifice: false, netValue: 0 });
    expect(seeGain("invalid", "e4" as Square)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Material channel — the escape from the win% sigmoid's saturation
// ---------------------------------------------------------------------------

describe("channelCpLoss", () => {
  it("is the plain eval drop for ordinary centipawns", () => {
    expect(channelCpLoss(100, -200)).toBe(300);
    expect(channelCpLoss(-600, -900)).toBe(300);
    expect(channelCpLoss(-2000, -3000)).toBe(1000); // does NOT saturate like win%
  });

  it("never negative — an improving move is 0", () => {
    expect(channelCpLoss(100, 400)).toBe(0);
  });

  it("maps mate sentinels to ±2500", () => {
    // Allowing mate from a merely-lost position: -900 → mated
    expect(channelCpLoss(-900, -10100)).toBe(1600);
    // Missing a mate but staying winning: had mate-in-1, now "only" +800
    expect(channelCpLoss(10099, 800)).toBe(1700);
    // Mate-in-1 traded for mate-in-3 costs nothing
    expect(channelCpLoss(10099, 10097)).toBe(0);
    // Already worse than the mate ceiling — no spurious loss
    expect(channelCpLoss(-9000, -10100)).toBe(0);
  });
});

describe("judgeMaterialLoss", () => {
  const CONTESTED = [0.5, 0.4] as const; // wpBefore, wpAfter — sensitive range

  it("contested positions: 150/300/900 → inaccuracy/mistake/blunder, strict boundaries", () => {
    expect(judgeMaterialLoss(149, ...CONTESTED)).toBe("none");
    expect(judgeMaterialLoss(150, ...CONTESTED)).toBe("inaccuracy");
    expect(judgeMaterialLoss(299, ...CONTESTED)).toBe("inaccuracy");
    expect(judgeMaterialLoss(300, ...CONTESTED)).toBe("mistake");
    expect(judgeMaterialLoss(899, ...CONTESTED)).toBe("mistake");
    expect(judgeMaterialLoss(900, ...CONTESTED)).toBe("blunder");
  });

  it("still winning big after (wp >= 0.90): conversion slack, at most inaccuracy", () => {
    // Simplifying while +2000 → +1850 is not an error
    expect(judgeMaterialLoss(150, 0.976, 0.972)).toBe("none");
    expect(judgeMaterialLoss(899, 0.976, 0.95)).toBe("none");
    // Hanging a rook/queen (or missing a mate) while still winning: whisper only
    expect(judgeMaterialLoss(900, 0.976, 0.95)).toBe("inaccuracy");
    expect(judgeMaterialLoss(1700, 0.975, 0.954)).toBe("inaccuracy");
  });

  it("already dead lost before (wp <= 0.10): a hung piece is a mistake, never a blunder", () => {
    // This is the regime that inflated Léo to 83%: every value below returned
    // "none" through the win% channel (loss ≈ 0pp at the sigmoid's floor).
    expect(judgeMaterialLoss(249, 0.05, 0.03)).toBe("none");   // shuffling while lost
    expect(judgeMaterialLoss(250, 0.05, 0.03)).toBe("mistake"); // hangs a piece
    expect(judgeMaterialLoss(1000, 0.05, 0.02)).toBe("mistake"); // hangs the queen — still "?"
  });

  it("winning-after slack is checked before lost-before (they cannot co-occur)", () => {
    expect(judgeMaterialLoss(900, 0.98, 0.96)).toBe("inaccuracy");
  });
});

// ---------------------------------------------------------------------------
// categorize
// ---------------------------------------------------------------------------

describe("categorize", () => {
  function makeInput(overrides: Partial<CategorizationInput>): CategorizationInput {
    return {
      winProbLoss: 0,
      winProbBefore: 0.5,
      winProbAfter: 0.5,
      isBestMove: false,
      isSacrifice: false,
      legalMoveCount: 20,
      halfMoveIndex: 20, // mid-game by default (past the opening gate)
      materialSeverity: "none",
      ...overrides,
    };
  }

  const brilliant: Partial<CategorizationInput> = {
    isSacrifice: true,
    isBestMove: true,
    winProbBefore: 0.5,
    winProbAfter: 0.55,
    winProbLoss: 0,
  };

  it("returns blunder / mistake / inaccuracy by win-probability loss", () => {
    expect(categorize(makeInput({ winProbLoss: 0.25 }))).toBe("blunder");
    expect(categorize(makeInput({ winProbLoss: 0.15 }))).toBe("mistake");
    expect(categorize(makeInput({ winProbLoss: 0.08 }))).toBe("inaccuracy");
    expect(categorize(makeInput({ winProbLoss: 0.03 }))).toBe("good");
  });

  it("boundaries are strict — 0.20 / 0.10 / 0.05 fall to the lighter category", () => {
    expect(categorize(makeInput({ winProbLoss: 0.20 }))).toBe("mistake");
    expect(categorize(makeInput({ winProbLoss: 0.10 }))).toBe("inaccuracy");
    expect(categorize(makeInput({ winProbLoss: 0.05 }))).toBe("good");
  });

  it("material severity escalates a move the win% channel called good", () => {
    // The saturated hang: winProbLoss ≈ 0 but a piece was given away
    expect(categorize(makeInput({ winProbLoss: 0.01, materialSeverity: "mistake" })))
      .toBe("mistake");
    expect(categorize(makeInput({ winProbLoss: 0, materialSeverity: "inaccuracy" })))
      .toBe("inaccuracy");
    expect(categorize(makeInput({ winProbLoss: 0, materialSeverity: "blunder" })))
      .toBe("blunder");
  });

  it("the channels take the WORSE verdict — material never softens a win% blunder", () => {
    expect(categorize(makeInput({ winProbLoss: 0.25, materialSeverity: "none" })))
      .toBe("blunder");
    expect(categorize(makeInput({ winProbLoss: 0.15, materialSeverity: "inaccuracy" })))
      .toBe("mistake");
  });

  it("returns best for the engine's top choice", () => {
    expect(categorize(makeInput({ isBestMove: true }))).toBe("best");
    expect(categorize(makeInput({ isBestMove: true, winProbBefore: 0.9 }))).toBe("best");
  });

  it("returns brilliant when every gate passes", () => {
    expect(categorize(makeInput(brilliant))).toBe("brilliant");
  });

  it("brilliant needs the exact best move — no near-best tolerance", () => {
    expect(categorize(makeInput({ ...brilliant, isBestMove: false }))).toBe("good");
  });

  it("brilliant rejected without a sacrifice", () => {
    expect(categorize(makeInput({ ...brilliant, isSacrifice: false }))).toBe("best");
  });

  it("brilliant rejected on a forced move (only one legal)", () => {
    expect(categorize(makeInput({ ...brilliant, legalMoveCount: 1 }))).toBe("best");
  });

  it("brilliant rejected in the opening (halfMoveIndex < 10)", () => {
    expect(categorize(makeInput({ ...brilliant, halfMoveIndex: 9 }))).toBe("best");
    expect(categorize(makeInput({ ...brilliant, halfMoveIndex: 10 }))).toBe("brilliant");
  });

  it("brilliant rejected when the position was not contested", () => {
    expect(categorize(makeInput({ ...brilliant, winProbBefore: 0.8, winProbAfter: 0.85 }))).toBe("best");
    expect(categorize(makeInput({ ...brilliant, winProbBefore: 0.2, winProbAfter: 0.3 }))).toBe("best");
  });

  it("brilliant rejected when the position is bad afterwards", () => {
    expect(categorize(makeInput({ ...brilliant, winProbAfter: 0.20, winProbLoss: 0.03 }))).toBe("best");
  });

  it("great is never returned", () => {
    const inputs: Partial<CategorizationInput>[] = [
      { isBestMove: true, legalMoveCount: 6 },
      { isBestMove: true, winProbBefore: 0.15 },
      { isBestMove: true, winProbBefore: 0.85 },
    ];
    for (const i of inputs) expect(categorize(makeInput(i))).not.toBe("great");
  });
});

// ---------------------------------------------------------------------------
// computeGameAccuracy
// ---------------------------------------------------------------------------

describe("computeGameAccuracy", () => {
  /**
   * Hand-checkable game: 20 half-moves, so windowSize = clamp(floor(20/10), 2, 8) = 2.
   * White loses 2pp on nine moves and 30pp on one; Black never loses anything.
   * Weights are |Δwin%| / 2 (population stddev of a 2-value window), clamped.
   */
  function handMadeGame() {
    const winPcts: number[] = [60];
    for (let i = 0; i < 20; i++) {
      const last = winPcts[winPcts.length - 1];
      if (i % 2 !== 0) winPcts.push(last);            // Black plays perfectly
      else if (i === 10) winPcts.push(last - 30);     // White's blunder
      else winPcts.push(last - 2);                    // White's small slips
    }
    const accuracies = winPcts.slice(0, 20).map((_, i) => {
      const before = i % 2 === 0 ? winPcts[i] : 100 - winPcts[i];
      const after = i % 2 === 0 ? winPcts[i + 1] : 100 - winPcts[i + 1];
      return computeMoveAccuracy(before, after);
    });
    return { winPcts, accuracies };
  }

  it("punishes one blunder far harder than an arithmetic mean would", () => {
    const { winPcts, accuracies } = handMadeGame();
    const whiteAccs = accuracies.filter((_, i) => i % 2 === 0);
    const arithmetic = whiteAccs.reduce((a, b) => a + b, 0) / whiteAccs.length;
    expect(arithmetic).toBeCloseTo(85.733, 2); // what the old code returned

    const result = computeGameAccuracy(winPcts, accuracies);
    // weighted 54.32 (the blunder carries weight 12 vs 1), harmonic 73.42
    expect(result.white).toBeCloseTo(63.871, 2);
    expect(result.black).toBeCloseTo(100, 6);
  });

  it("a null position excludes only its neighbouring moves, without NaN", () => {
    const { winPcts, accuracies } = handMadeGame();
    const holed: (number | null)[] = [...winPcts];
    holed[5] = null; // kills moves 4 and 5
    const holedAccs: (number | null)[] = [...accuracies];
    holedAccs[4] = null;
    holedAccs[5] = null;

    const result = computeGameAccuracy(holed, holedAccs);
    expect(Number.isNaN(result.white)).toBe(false);
    expect(Number.isNaN(result.black)).toBe(false);
    expect(result.white).toBeGreaterThan(0);
    expect(result.white).toBeLessThan(100);
  });

  it("a move whose accuracy is null is skipped even with both positions present", () => {
    const flat = [50, 50, 50, 50, 50];
    expect(computeGameAccuracy(flat, [100, 100, 100, 100]).white).toBeCloseTo(100, 6);
    // White's move 2 dropped → only move 0 counts, still 100
    expect(computeGameAccuracy(flat, [100, 100, null, 100]).white).toBeCloseTo(100, 6);
  });

  it("floors each harmonic term at 1, as scalalib does — a 0 does not collapse the game", () => {
    // White: accuracies 100 and 0. weights are all 0.5 (flat evals) →
    // weighted = 50, harmonic = 2 / (1/100 + 1/1) = 1.980 → (50 + 1.980) / 2
    const result = computeGameAccuracy([50, 50, 50, 50, 50], [100, null, 0, null]);
    expect(result.white).toBeCloseTo(25.9901, 3);
    expect(result.black).toBe(0); // no valid Black move at all
  });

  it("handles a single move", () => {
    const result = computeGameAccuracy([50, 45], [80.8153]);
    expect(result.white).toBeCloseTo(80.8153, 3);
    expect(result.black).toBe(0);
  });

  it("returns 0/0 for an empty game or a mismatched length", () => {
    expect(computeGameAccuracy([50], [])).toEqual({ white: 0, black: 0 });
    expect(computeGameAccuracy([50, 50], [100, 100])).toEqual({ white: 0, black: 0 });
  });
});

// ---------------------------------------------------------------------------
// aplicarLivro (lance de teoria de abertura)
// ---------------------------------------------------------------------------

describe("aplicarLivro", () => {
  it("is the identity when the move is not in the book", () => {
    const todas = [
      "brilliant", "great", "best", "good", "inaccuracy", "mistake", "blunder", "book",
    ] as const;
    for (const c of todas) {
      expect(aplicarLivro(c, false)).toBe(c);
    }
  });

  it("book beats inaccuracy and mistake — theory is neither praise nor blame", () => {
    expect(aplicarLivro("inaccuracy", true)).toBe("book");
    expect(aplicarLivro("mistake", true)).toBe("book");
  });

  it("book also overrides the positive labels — origin, not quality", () => {
    expect(aplicarLivro("best", true)).toBe("book");
    expect(aplicarLivro("good", true)).toBe("book");
    expect(aplicarLivro("brilliant", true)).toBe("book");
  });

  it("book NEVER beats blunder — the Fool's Mate case", () => {
    // `Barnes Opening: Fool's Mate` (1. f3 e5 2. g4 Qh4#) is a NAMED line of the
    // Lichess base: 2.g4 would arrive here flagged as book. Without this rule it
    // would leave the accuracy average, and allowing mate in one would cost the
    // child nothing. The veto list is the belt; this is the braces.
    expect(aplicarLivro("blunder", true)).toBe("blunder");
  });
});

// ---------------------------------------------------------------------------
// accuracyMoveIndexes (o predicado unico da conta de precisao)
// ---------------------------------------------------------------------------

describe("accuracyMoveIndexes", () => {
  it("counts only the moves of the asked colour", () => {
    const wp = [50, 50, 50, 50, 50];
    const acc = [90, 80, 70, 60];
    expect(accuracyMoveIndexes(wp, acc, true)).toEqual([0, 2]);
    expect(accuracyMoveIndexes(wp, acc, false)).toEqual([1, 3]);
  });

  it("drops a move whose accuracy is null — book leaves the average this way", () => {
    const wp = [50, 50, 50, 50, 50];
    expect(accuracyMoveIndexes(wp, [null, 80, 70, 60], true)).toEqual([2]);
  });

  it("drops a move whose adjacent position has no evaluation", () => {
    expect(accuracyMoveIndexes([50, null, 50, 50, 50], [90, 80, 70, 60], true)).toEqual([2]);
  });

  it("agrees with computeGameAccuracy: an all-null colour yields 0 moves and 0%", () => {
    const wp = [50, 50, 50, 50, 50];
    const acc = [null, 80, null, 60];
    expect(accuracyMoveIndexes(wp, acc, true)).toEqual([]);
    expect(computeGameAccuracy(wp, acc).white).toBe(0);
  });

  it("a null accuracy leaves the average, and the opposite colour is bit-identical", () => {
    // Sem livro nenhum, mas e exatamente o efeito que o livro produz: tirar um
    // lance de uma cor nao pode mexer no numero da outra.
    const wp = [50, 55, 45, 60, 40];
    const comBranca = computeGameAccuracy(wp, [70, 80, 90, 60]);
    const semBranca = computeGameAccuracy(wp, [null, 80, 90, 60]);
    expect(semBranca.black).toBe(comBranca.black);
    expect(semBranca.white).not.toBe(comBranca.white);
    expect(accuracyMoveIndexes(wp, [null, 80, 90, 60], true)).toEqual([2]);
  });
});
