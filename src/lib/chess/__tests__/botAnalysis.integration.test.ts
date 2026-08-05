import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { analyzeGame, cpToWinPct } from "../botAnalysis";
import type { StockfishEngine, EngineAnalysis } from "../StockfishEngine";
import { toEpd } from "../openingBook";
import type { OpeningBook, OpeningName } from "../openingBook";

// ---------------------------------------------------------------------------
// Mock Stockfish Engine
// ---------------------------------------------------------------------------

class MockStockfishEngine {
  private evalMap = new Map<string, number>();
  private bestMoveMap = new Map<string, string>();
  private bestMoveAtDepth = new Map<string, string>();
  private throwForFens = new Set<string>();
  private throwOnceFens = new Set<string>();

  /** Every analyze() call, in order — lets a test assert the exact search count. */
  readonly calls: { fen: string; depth: number }[] = [];

  setEval(fen: string, cp: number): void {
    this.evalMap.set(fen, cp);
  }

  setBestMove(fen: string, uci: string): void {
    this.bestMoveMap.set(fen, uci);
  }

  /** Overrides setBestMove for one specific depth (used for the depth-16 confirmation). */
  setBestMoveAtDepth(fen: string, depth: number, uci: string): void {
    this.bestMoveAtDepth.set(`${depth}|${fen}`, uci);
  }

  setThrowFor(fen: string): void {
    this.throwForFens.add(fen);
  }

  /** Throws the first time this FEN is searched, then behaves normally. */
  setThrowOnceFor(fen: string): void {
    this.throwOnceFens.add(fen);
  }

  async analyze(fen: string, depth: number): Promise<EngineAnalysis> {
    this.calls.push({ fen, depth });
    if (this.throwOnceFens.has(fen)) {
      this.throwOnceFens.delete(fen);
      throw new Error("Engine error");
    }
    if (this.throwForFens.has(fen)) throw new Error("Engine error");
    return {
      cp: this.evalMap.get(fen) ?? 0,
      bestMoveUci:
        this.bestMoveAtDepth.get(`${depth}|${fen}`) ?? this.bestMoveMap.get(fen) ?? "e2e4",
    };
  }

  async bestMove(fen: string, depth: number): Promise<string> {
    const { bestMoveUci } = await this.analyze(fen, depth);
    return bestMoveUci ?? "(none)";
  }

  setSkill(_level: number): void {}
  async init(): Promise<void> {}
  destroy(): void {}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function playGame(moves: string[]): { san: string; before: string; after: string }[] {
  const chess = new Chess();
  for (const san of moves) {
    chess.move(san);
  }
  return chess.history({ verbose: true }).map((m) => ({
    san: m.san,
    before: m.before,
    after: m.after,
  }));
}

/** Position i is history[i].before; the last position is the final `after`. */
function positionFens(history: { before: string; after: string }[]): string[] {
  return [...history.map((h) => h.before), history[history.length - 1].after];
}

/** Set evals from a White-POV list, converting to the side-to-move POV the engine uses. */
function setWhitePovEvals(
  engine: MockStockfishEngine,
  history: { before: string; after: string }[],
  whitePovCp: number[]
): void {
  const fens = positionFens(history);
  fens.forEach((fen, i) => engine.setEval(fen, i % 2 === 0 ? whitePovCp[i] : -whitePovCp[i]));
}

const asEngine = (m: MockStockfishEngine) => m as unknown as StockfishEngine;

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe("analyzeGame integration", () => {
  it("analyzes only player (white) moves", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 20);
    for (const entry of history) engine.setBestMove(entry.before, "e2e4");

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.moves).toHaveLength(2);
    expect(result.moves[0].halfMoveIndex).toBe(0);
    expect(result.moves[1].halfMoveIndex).toBe(2);
    expect(result.allMoves).toHaveLength(4);
  });

  it("analyzes only player (black) moves", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    for (const entry of history) engine.setBestMove(entry.before, "e7e5");

    const result = await analyzeGame(history, "black", asEngine(engine));

    expect(result.moves).toHaveLength(2);
    expect(result.moves[0].halfMoveIndex).toBe(1);
    expect(result.moves[1].halfMoveIndex).toBe(3);
    expect(result.allMoves).toHaveLength(4);
  });

  it("returns empty analysis for empty history", async () => {
    const engine = new MockStockfishEngine();
    const result = await analyzeGame([], "white", asEngine(engine));

    expect(result.accuracy).toBe(0);
    expect(result.botAccuracy).toBe(0);
    expect(result.moves).toHaveLength(0);
    expect(result.allMoves).toHaveLength(0);
    expect(result.topBlunders).toHaveLength(0);
    expect(result.counts.brilliant).toBe(0);
    expect(engine.calls).toHaveLength(0);
  });

  it("handles single move game", async () => {
    const history = playGame(["e4"]);
    const engine = new MockStockfishEngine();
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.moves).toHaveLength(1);
    expect(result.moves[0].moveSan).toBe("e4");
    expect(result.moves[0].halfMoveIndex).toBe(0);
  });

  it("negates eval after player's move (opponent's turn)", async () => {
    const history = playGame(["e4", "e5"]);
    const engine = new MockStockfishEngine();
    engine.setEval(history[0].before, 50);
    // After White's move it is Black to move: -30 for Black = +30 for White.
    engine.setEval(history[0].after, -30);
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.moves[0].evalBefore).toBe(50);
    expect(result.moves[0].evalAfter).toBe(30);
  });

  it("detects best move correctly", async () => {
    const history = playGame(["e4", "e5"]);
    const engine = new MockStockfishEngine();
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(history, "white", asEngine(engine));
    expect(result.moves[0].category).toBe("best");
  });

  it("calls onProgress with correct indices", async () => {
    const history = playGame(["e4", "e5", "d4", "d5", "Nf3"]);
    const engine = new MockStockfishEngine();
    const progressCalls: [number, number][] = [];

    await analyzeGame(history, "white", asEngine(engine), (current, total) =>
      progressCalls.push([current, total])
    );

    expect(progressCalls).toEqual([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]]);
  });

  it("counts match analyzed moves", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();

    const result = await analyzeGame(history, "white", asEngine(engine));

    const totalCounts = Object.values(result.counts).reduce((a, b) => a + b, 0);
    expect(totalCounts).toBe(result.moves.filter((m) => !m.skipped).length);
  });

  it("topBlunders limited to 3, sorted by winProbLoss", async () => {
    const history = playGame(["e4", "e5", "d4", "d5", "Nf3", "Nc6", "Bc4", "Nf6", "Nc3", "Bb4"]);
    const engine = new MockStockfishEngine();
    // White POV: White gives away more and more on each of its moves.
    setWhitePovEvals(engine, history, [0, -800, -600, -600, -400, -400, -300, -300, 300, 300, 300]);
    for (const entry of history) engine.setBestMove(entry.before, "a2a3");

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.topBlunders.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < result.topBlunders.length; i++) {
      expect(result.topBlunders[i - 1].winProbLoss).toBeGreaterThanOrEqual(
        result.topBlunders[i].winProbLoss
      );
    }
    for (const b of result.topBlunders) {
      expect(["blunder", "mistake"]).toContain(b.category);
    }
  });

  // -------------------------------------------------------------------------
  // Search economy: one search per position
  // -------------------------------------------------------------------------

  it("(i) searches each position exactly once — 4 moves, no terminal → 5 searches", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();

    await analyzeGame(history, "white", asEngine(engine));

    expect(engine.calls).toHaveLength(5);
    expect(engine.calls.map((c) => c.fen)).toEqual(positionFens(history));
    expect(engine.calls.every((c) => c.depth === 14)).toBe(true);
  });

  it("(ii) a failed search skips its own move and does not poison the next one", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();
    const fens = positionFens(history);
    // Fails as the "after" of move 1; move 2 must re-search it as its own "before".
    engine.setThrowOnceFor(fens[2]);

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.allMoves[1].skipped).toBe(true);
    expect(result.allMoves[0].skipped).toBeUndefined();
    expect(result.allMoves[2].skipped).toBeUndefined();
    expect(result.allMoves[3].skipped).toBeUndefined();
    // 5 positions + 1 retry of the position that failed
    expect(engine.calls).toHaveLength(6);
    expect(engine.calls.map((c) => c.fen)).toEqual([
      fens[0], fens[1], fens[2], fens[2], fens[3], fens[4],
    ]);
  });

  it("a permanently failing position keeps skipping without poisoning the rest", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();
    engine.setThrowFor(positionFens(history)[0]);

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.allMoves[0].skipped).toBe(true);
    expect(result.allMoves[0].moveAccuracy).toBe(50);
    expect(result.allMoves[0].category).toBe("good");
    expect(result.allMoves[1].skipped).toBeUndefined();
    expect(result.moves.filter((m) => !m.skipped)).toHaveLength(1);
  });

  it("(iii) fool's mate — the terminal position costs no search", async () => {
    const history = playGame(["f3", "e5", "g4", "Qh4#"]);
    const engine = new MockStockfishEngine();

    const result = await analyzeGame(history, "black", asEngine(engine));

    // 4 moves, 5 positions, but the last one is checkmate → 4 searches
    expect(engine.calls).toHaveLength(4);
    const mating = result.allMoves[3];
    expect(mating.moveSan).toBe("Qh4#");
    expect(mating.winProbAfter).toBeCloseTo(cpToWinPct(10100) / 100, 4);
    expect(mating.winProbAfter).toBeCloseTo(0.9754, 3);
    expect(mating.evalAfter).toBe(10100);
  });

  // -------------------------------------------------------------------------
  // Brilliant
  // -------------------------------------------------------------------------

  it("(iv) best move onto an attacked BUT defended square is not brilliant", async () => {
    // 6.Ne5 — e5 attacked by Nd7, defended by the d4 pawn. This is the shape that
    // produced three "brilliants" in a single game before the SEE.
    const history = playGame([
      "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Nbd7", "Bg5", "Be7", "Ne5",
    ]);
    const engine = new MockStockfishEngine();
    engine.setBestMove(history[10].before, "f3e5");

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(history[10].san).toBe("Ne5");
    expect(result.allMoves[10].category).toBe("best");
    expect(result.allMoves[10].isSacrifice).toBe(false);
    expect(result.counts.brilliant).toBe(0);
    // No depth-16 confirmation was needed — the SEE already rejected it.
    expect(engine.calls).toHaveLength(12);
  });

  it("(vi) a real sacrifice becomes brilliant only after depth 16 confirms it", async () => {
    // 6.Bxh7+ — bishop for a pawn, only Kg8/Nf6 recapture: SEE net 2.
    const moves = ["d4", "d5", "Nf3", "Nf6", "e3", "e6", "Bd3", "Be7", "Nbd2", "O-O", "Bxh7+"];

    const confirming = new MockStockfishEngine();
    const history = playGame(moves);
    confirming.setBestMove(history[10].before, "d3h7");

    const confirmed = await analyzeGame(history, "white", asEngine(confirming));
    expect(history[10].san).toBe("Bxh7+");
    expect(confirmed.allMoves[10].isSacrifice).toBe(true);
    expect(confirmed.allMoves[10].category).toBe("brilliant");
    expect(confirmed.counts.brilliant).toBe(1);
    // 12 positions + 1 confirmation search
    expect(confirming.calls).toHaveLength(13);
    expect(confirming.calls[12]).toEqual({ fen: history[10].before, depth: 16 });

    // Same position, but depth 16 prefers another move → the label falls back to best.
    const flipping = new MockStockfishEngine();
    flipping.setBestMove(history[10].before, "d3h7");
    flipping.setBestMoveAtDepth(history[10].before, 16, "e1g1");

    const flipped = await analyzeGame(history, "white", asEngine(flipping));
    expect(flipped.allMoves[10].category).toBe("best");
    expect(flipped.counts.brilliant).toBe(0);
    // The move IS a sacrifice; it just was not confirmed.
    expect(flipped.allMoves[10].isSacrifice).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Accuracy
  // -------------------------------------------------------------------------

  it("(vii) hangs in an already-lost position are mistakes, not 'good' — the Léo 83% case", async () => {
    const history = playGame([
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7",
      "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8", "d4", "Nbd7",
    ]);
    const engine = new MockStockfishEngine();

    // Black collapses early and then hangs a piece on every move. From White
    // +700 on, Black's win% is pinned at the sigmoid's floor (< 10%), so the
    // win% channel sees ~0pp loss per hang — before this fix every one of
    // these read "good" with 100% per-move accuracy.
    setWhitePovEvals(engine, history, [
      0, 0, 100, 100, 400, 400, 700, 700, 1000, 1000, 1400,
      1400, 1800, 1800, 2300, 2300, 2900, 2900, 3600, 3600, 4400,
    ]);

    const result = await analyzeGame(history, "white", asEngine(engine));

    // Black's ten moves: the two early collapses register through win%
    // (blunder + mistake); the seven saturated hangs (300-800cp each) must now
    // register through the material channel instead of reading "good".
    expect(result.botCounts.mistake + result.botCounts.blunder).toBeGreaterThanOrEqual(8);
    expect(result.botCounts.good + result.botCounts.best).toBeLessThanOrEqual(1);
    // And the bot's accuracy must reflect it (was ~89 with the hangs at 100%).
    expect(result.botAccuracy).toBeGreaterThan(20);
    expect(result.botAccuracy).toBeLessThan(60);

    // White only ever gains eval — clean conversion stays clean.
    expect(result.counts.mistake + result.counts.blunder + result.counts.inaccuracy).toBe(0);
    expect(result.accuracy).toBeGreaterThan(90);
  });

  it("(viii) conversion slack: shedding < 900cp while still winning is not flagged", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    // White at +2000 plays a move keeping +1850: 150cp of slop, win% ~unchanged.
    setWhitePovEvals(engine, history, [2000, 1850, 1850, 1850, 1850]);
    engine.setBestMove(history[0].before, "a2a3"); // not the played move

    const result = await analyzeGame(history, "white", asEngine(engine));

    expect(result.allMoves[0].category).toBe("good");
    expect(result.allMoves[0].moveAccuracy).toBeGreaterThan(90);
  });

  it("(v) a bot that hangs pieces scores far below the arithmetic mean", async () => {
    const history = playGame([
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7",
      "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8", "d4", "Nbd7",
    ]);
    const engine = new MockStockfishEngine();

    // cpToWinPct(376) ≈ 80 — Black hands over ~30 win-percentage points on five
    // of its ten moves, White hands them back on five of its own.
    const SWING = 376;
    const whitePov = [
      0, 0, SWING, 0, 0, 0, SWING, 0, 0, 0,
      SWING, 0, 0, 0, SWING, 0, 0, 0, SWING, 0, 0,
    ];
    setWhitePovEvals(engine, history, whitePov);

    const result = await analyzeGame(history, "white", asEngine(engine));

    const botMoveAccs = result.allMoves
      .filter((m) => m.halfMoveIndex % 2 === 1)
      .map((m) => m.moveAccuracy);
    const arithmetic = botMoveAccs.reduce((a, b) => a + b, 0) / botMoveAccs.length;

    // The old code averaged the per-move accuracies — that is what inflated the
    // weak bots to ~88 in production.
    expect(arithmetic).toBeGreaterThan(60);
    expect(result.botAccuracy).toBeGreaterThanOrEqual(25);
    expect(result.botAccuracy).toBeLessThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// Livro de aberturas
// ---------------------------------------------------------------------------

type LinhaFake = { sans: string[]; nome?: OpeningName };

/**
 * Builds a book straight from SAN lines, exactly the way the real generator
 * does — same chess.js, same `toEpd`, same edge indexing. **Zero fetch**: the
 * loader never runs here, so the tests keep working under vitest/node, where
 * `fetch` for a local `/public` path does not exist.
 */
function fakeBook(linhas: (string[] | LinhaFake)[]): OpeningBook {
  const movesByEpd = new Map<string, Set<string>>();
  const namesByEpd = new Map<string, OpeningName>();

  for (const item of linhas) {
    const { sans, nome } = Array.isArray(item) ? { sans: item, nome: undefined } : item;
    const chess = new Chess();
    for (const san of sans) {
      const epd = toEpd(chess.fen());
      const mv = chess.move(san);
      const uci = mv.from + mv.to + (mv.promotion ?? "");
      let destinos = movesByEpd.get(epd);
      if (!destinos) {
        destinos = new Set<string>();
        movesByEpd.set(epd, destinos);
      }
      destinos.add(uci);
    }
    if (nome) namesByEpd.set(toEpd(chess.fen()), nome);
  }

  return { revision: "fake", movesByEpd, namesByEpd };
}

const ESPANHOLA: OpeningName = { eco: "C60", familia: "Abertura Espanhola", variante: "Fake" };
const PEAO_DO_REI: OpeningName = { eco: "C20", familia: "Jogo do Peao do Rei", variante: null };

/**
 * The game used by the latch and the name tests.
 *
 * Theory (the second line below) reaches the SAME position by playing Bb5
 * before a3. The played game inverts that order, so it leaves theory at index
 * 4 — and rejoins the exact book position at index 7, which is the whole
 * point: the book knows `Bb4` from that position and the seal must still say
 * no.
 */
const JOGO_TRANSPOSTO = ["e4", "e5", "Nf3", "Nc6", "a3", "a6", "Bb5", "Bb4"];
const LIVRO_TRANSPOSTO = [
  { sans: ["e4", "e5"], nome: PEAO_DO_REI },
  { sans: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "a3", "Bb4"], nome: ESPANHOLA },
];

describe("analyzeGame + livro de aberturas", () => {
  it("(1) marks every move of a line the book knows", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 20);

    const book = fakeBook([["e4", "e5", "Nf3", "Nc6"]]);
    const result = await analyzeGame(history, "white", asEngine(engine), undefined, book);

    expect(result.allMoves.map((m) => m.category)).toEqual(["book", "book", "book", "book"]);
    expect(result.allMoves.every((m) => m.isBookMove)).toBe(true);
    expect(result.counts.book).toBe(2);
    expect(result.botCounts.book).toBe(2);
  });

  it("(2) a move outside the book edges is not book — the edge does not leak", async () => {
    // The book knows 1.e4 e5. The game plays 1.e4 d5: same position, other move.
    const history = playGame(["e4", "d5"]);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 20);

    const book = fakeBook([["e4", "e5"]]);
    const result = await analyzeGame(history, "white", asEngine(engine), undefined, book);

    expect(result.allMoves[0].category).toBe("book");
    expect(result.allMoves[1].isBookMove).toBe(false);
    expect(result.allMoves[1].category).not.toBe("book");
  });

  it("(3) the latch never re-opens, even when the book knows the later position", async () => {
    const history = playGame(JOGO_TRANSPOSTO);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 15);

    const book = fakeBook(LIVRO_TRANSPOSTO);

    // Guard: the book really does know index 7 move from that exact position.
    // Without this the test would pass for the wrong reason.
    const epdAntesDo7 = toEpd(history[7].before);
    expect(book.movesByEpd.get(epdAntesDo7)?.has("f8b4")).toBe(true);

    const result = await analyzeGame(history, "white", asEngine(engine), undefined, book);

    expect(result.allMoves.map((m) => m.category === "book")).toEqual([
      true, true, true, true, false, false, false, false,
    ]);
  });

  it("(4) a theoretical gambit at mistake level stays book; at blunder level it does not", async () => {
    // cpToWinPct(-168) ~= 35 -> 15pp lost = mistake band (0.10-0.20).
    const historyErro = playGame(["e4", "e5"]);
    const motorErro = new MockStockfishEngine();
    setWhitePovEvals(motorErro, historyErro, [0, -168, -168]);
    const livro = fakeBook([["e4", "e5"]]);

    const semLivro = await analyzeGame(historyErro, "white", asEngine(motorErro));
    expect(semLivro.allMoves[0].category).toBe("mistake");

    const motorErro2 = new MockStockfishEngine();
    setWhitePovEvals(motorErro2, historyErro, [0, -168, -168]);
    const comLivro = await analyzeGame(historyErro, "white", asEngine(motorErro2), undefined, livro);
    expect(comLivro.allMoves[0].category).toBe("book");
    expect(comLivro.accuracyMoveCount).toBe(0);

    // cpToWinPct(-298) ~= 25 -> 25pp lost = blunder. Book does not cover it,
    // and it goes on counting for the accuracy: it was a real mistake.
    const historyGrave = playGame(["e4", "e5"]);
    const motorGrave = new MockStockfishEngine();
    setWhitePovEvals(motorGrave, historyGrave, [0, -298, -298]);

    const grave = await analyzeGame(historyGrave, "white", asEngine(motorGrave), undefined, livro);
    expect(grave.allMoves[0].category).toBe("blunder");
    expect(grave.allMoves[0].isBookMove).toBe(true);
    expect(grave.accuracyMoveCount).toBe(1);
  });

  it("(5) the book removes exactly its own moves from the accuracy count", async () => {
    const history = playGame(JOGO_TRANSPOSTO);
    const motorSem = new MockStockfishEngine();
    for (const fen of positionFens(history)) motorSem.setEval(fen, 15);
    const motorCom = new MockStockfishEngine();
    for (const fen of positionFens(history)) motorCom.setEval(fen, 15);

    const sem = await analyzeGame(history, "white", asEngine(motorSem));
    const com = await analyzeGame(
      history, "white", asEngine(motorCom), undefined, fakeBook(LIVRO_TRANSPOSTO)
    );

    // White plays indexes 0, 2, 4, 6; the first two are book.
    const livrosDoJogador = com.moves.filter((m) => m.category === "book").length;
    expect(livrosDoJogador).toBe(2);
    expect(sem.accuracyMoveCount).toBe(4);
    expect(com.accuracyMoveCount).toBe(sem.accuracyMoveCount - livrosDoJogador);
  });

  it("(6) an all-theory game leaves zero moves in the accuracy count", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 20);

    const result = await analyzeGame(
      history, "white", asEngine(engine), undefined, fakeBook([["e4", "e5", "Nf3", "Nc6"]])
    );

    expect(result.accuracyMoveCount).toBe(0);
    expect(result.botAccuracyMoveCount).toBe(0);
    // E por isso nenhuma superficie imprime esse 0.
    expect(result.accuracy).toBe(0);
  });

  it("(7) the opening NAME is independent of the latch and updates after the deviation", async () => {
    const history = playGame(JOGO_TRANSPOSTO);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 15);

    const result = await analyzeGame(
      history, "white", asEngine(engine), undefined, fakeBook(LIVRO_TRANSPOSTO)
    );

    // Named at index 1, left theory at index 4, transposed back into a named
    // position at index 7 — the deepest name wins.
    expect(result.opening).toEqual(ESPANHOLA);
  });

  it("(8) book: null and no fifth argument are deep-equal, and the legacy fields hold", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const motorA = new MockStockfishEngine();
    setWhitePovEvals(motorA, history, [0, -168, 0, 0, 0]);
    const motorB = new MockStockfishEngine();
    setWhitePovEvals(motorB, history, [0, -168, 0, 0, 0]);

    const semArgumento = await analyzeGame(history, "white", asEngine(motorA));
    const comNull = await analyzeGame(history, "white", asEngine(motorB), undefined, null);

    expect(comNull).toEqual(semArgumento);
    expect(semArgumento.opening).toBeNull();
    expect(semArgumento.allMoves.every((m) => m.isBookMove === false)).toBe(true);
    expect(semArgumento.counts.book).toBe(0);
    expect(semArgumento.allMoves[0].category).toBe("mistake");
    expect(semArgumento.counts.mistake).toBe(1);
    expect(semArgumento.accuracyMoveCount).toBe(2);
    expect(semArgumento.topBlunders).toHaveLength(1);
    expect(semArgumento.topBlunders[0].halfMoveIndex).toBe(0);
  });

  it("(9) the engine still searches N+1 positions with the whole game in book", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();
    for (const fen of positionFens(history)) engine.setEval(fen, 20);

    await analyzeGame(
      history, "white", asEngine(engine), undefined, fakeBook([["e4", "e5", "Nf3", "Nc6"]])
    );

    // Decision 1 as an assertion: the book takes the move out of the accuracy,
    // never out of the engine. The eval bar and the arrows do not regress.
    expect(engine.calls).toHaveLength(history.length + 1);
  });
});
