import { describe, it, expect, vi } from "vitest";
import { Chess } from "chess.js";
import { analyzeGame } from "../botAnalysis";
import type { StockfishEngine } from "../StockfishEngine";

// ---------------------------------------------------------------------------
// Mock Stockfish Engine
// ---------------------------------------------------------------------------

class MockStockfishEngine {
  private evalMap = new Map<string, number>();
  private bestMoveMap = new Map<string, string>();
  private throwForFens = new Set<string>();

  setEval(fen: string, cp: number): void {
    this.evalMap.set(fen, cp);
  }

  setBestMove(fen: string, uci: string): void {
    this.bestMoveMap.set(fen, uci);
  }

  setThrowFor(fen: string): void {
    this.throwForFens.add(fen);
  }

  async evaluate(fen: string, _depth: number): Promise<number> {
    if (this.throwForFens.has(fen)) throw new Error("Engine error");
    return this.evalMap.get(fen) ?? 0;
  }

  async bestMove(fen: string, _depth: number): Promise<string> {
    if (this.throwForFens.has(fen)) throw new Error("Engine error");
    return this.bestMoveMap.get(fen) ?? "e2e4";
  }

  setSkill(_level: number): void {}
  async init(): Promise<void> {}
  destroy(): void {}
}

// ---------------------------------------------------------------------------
// Helper: play a game and extract history
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

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe("analyzeGame integration", () => {
  it("analyzes only player (white) moves", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();

    // Set evals for white's moves (indices 0, 2)
    for (const entry of history) {
      engine.setEval(entry.before, 20);
      engine.setEval(entry.after, 20);
      engine.setBestMove(entry.before, "e2e4");
    }

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // moves = player only: White has 2 moves (indices 0 and 2)
    expect(result.moves).toHaveLength(2);
    expect(result.moves[0].halfMoveIndex).toBe(0);
    expect(result.moves[1].halfMoveIndex).toBe(2);
    // allMoves = all 4 moves
    expect(result.allMoves).toHaveLength(4);
  });

  it("analyzes only player (black) moves", async () => {
    const history = playGame(["e4", "e5", "Nf3", "Nc6"]);
    const engine = new MockStockfishEngine();

    for (const entry of history) {
      engine.setEval(entry.before, 0);
      engine.setEval(entry.after, 0);
      engine.setBestMove(entry.before, "e7e5");
    }

    const result = await analyzeGame(
      history,
      "black",
      engine as unknown as StockfishEngine
    );

    // moves = player only: Black has 2 moves (indices 1 and 3)
    expect(result.moves).toHaveLength(2);
    expect(result.moves[0].halfMoveIndex).toBe(1);
    expect(result.moves[1].halfMoveIndex).toBe(3);
    // allMoves = all 4 moves
    expect(result.allMoves).toHaveLength(4);
  });

  it("returns empty analysis for empty history", async () => {
    const engine = new MockStockfishEngine();
    const result = await analyzeGame(
      [],
      "white",
      engine as unknown as StockfishEngine
    );

    expect(result.accuracy).toBe(0);
    expect(result.moves).toHaveLength(0);
    expect(result.allMoves).toHaveLength(0);
    expect(result.topBlunders).toHaveLength(0);
    expect(result.counts.brilliant).toBe(0);
    expect(result.counts.blunder).toBe(0);
  });

  it("handles single move game", async () => {
    const history = playGame(["e4"]);
    const engine = new MockStockfishEngine();
    engine.setEval(history[0].before, 0);
    engine.setEval(history[0].after, 0);
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    expect(result.moves).toHaveLength(1);
    expect(result.moves[0].moveSan).toBe("e4");
    expect(result.moves[0].halfMoveIndex).toBe(0);
  });

  it("marks skipped moves when engine throws", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();

    // Set up normal evals for all positions
    for (const entry of history) {
      engine.setEval(entry.before, 20);
      engine.setEval(entry.after, 20);
      engine.setBestMove(entry.before, "e2e4");
    }

    // Make engine throw for the first white move's "before" position
    engine.setThrowFor(history[0].before);

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // First move should be skipped
    expect(result.moves[0].skipped).toBe(true);
    expect(result.moves[0].moveAccuracy).toBe(50);
    expect(result.moves[0].category).toBe("good");

    // Second white move (index 2) should be normal
    expect(result.moves[1].skipped).toBeUndefined();
  });

  it("skipped moves are excluded from accuracy calculation", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();

    // Make engine return best move = actual move (100% accuracy)
    const chess = new Chess();
    const e4Move = chess.move("e4");
    engine.setEval(history[0].before, 20);
    engine.setEval(history[0].after, 20);
    engine.setBestMove(history[0].before, e4Move!.from + e4Move!.to);

    // Second white move (d4)
    const chess2 = new Chess(history[2].before);
    const d4Move = chess2.move("d4");
    engine.setEval(history[2].before, 20);
    engine.setEval(history[2].after, 20);
    engine.setBestMove(history[2].before, d4Move!.from + d4Move!.to);

    // Make first move throw
    engine.setThrowFor(history[0].before);

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // Accuracy should only consider the non-skipped move
    const validMoves = result.moves.filter((m) => !m.skipped);
    expect(validMoves).toHaveLength(1);
    // Accuracy should be based only on the valid move, not averaged with skipped=50
    expect(result.accuracy).not.toBe(75); // (50 + 100) / 2 would be wrong
  });

  it("negates eval after player's move (opponent's turn)", async () => {
    const history = playGame(["e4", "e5"]);
    const engine = new MockStockfishEngine();

    // Before white's move: eval from white's perspective = +50
    engine.setEval(history[0].before, 50);
    // After white's move: eval from black's perspective (side to move) = -30
    // This means +30 from white's perspective, so evalAfter should be 30
    engine.setEval(history[0].after, -30);
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // evalAfter should be negated: -(-30) = 30 (player's perspective)
    expect(result.moves[0].evalBefore).toBe(50);
    expect(result.moves[0].evalAfter).toBe(30);
  });

  it("detects best move correctly", async () => {
    const history = playGame(["e4", "e5"]);
    const engine = new MockStockfishEngine();
    engine.setEval(history[0].before, 0);
    engine.setEval(history[0].after, 0);
    // Best move matches actual move
    engine.setBestMove(history[0].before, "e2e4");

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // Should be best or great (since it matched the engine's top choice)
    expect(["best", "great"]).toContain(result.moves[0].category);
  });

  it("calls onProgress with correct indices", async () => {
    const history = playGame(["e4", "e5", "d4", "d5", "Nf3"]);
    const engine = new MockStockfishEngine();

    for (const entry of history) {
      engine.setEval(entry.before, 0);
      engine.setEval(entry.after, 0);
      engine.setBestMove(entry.before, "e2e4");
    }

    const progressCalls: [number, number][] = [];
    await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine,
      (current, total) => progressCalls.push([current, total])
    );

    // All 5 moves are now analyzed (indices 0-4)
    expect(progressCalls).toEqual([
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
    ]);
  });

  it("topBlunders limited to 3, sorted by winProbLoss", async () => {
    // Create a longer game
    const history = playGame([
      "e4", "e5", "d4", "d5", "Nf3", "Nc6", "Bc4", "Nf6", "Nc3", "Bb4",
    ]);
    const engine = new MockStockfishEngine();

    // White's moves are indices 0, 2, 4, 6, 8
    // Set up evals to produce different winProbLoss values
    const whiteIndices = [0, 2, 4, 6, 8];
    // We want 4 blunders with varying severity
    const evalsBefore = [0, 200, 150, 100, 300]; // positive = player advantage
    const evalsAfter = [-800, -600, -400, -300, 300]; // negated in analyzeGame

    for (let i = 0; i < whiteIndices.length; i++) {
      const idx = whiteIndices[i];
      engine.setEval(history[idx].before, evalsBefore[i]);
      // After move: engine returns from opponent's perspective, so negate what we want
      engine.setEval(history[idx].after, -evalsAfter[i]);
      engine.setBestMove(history[idx].before, "a2a3"); // not the actual move
    }

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    // topBlunders should have at most 3
    expect(result.topBlunders.length).toBeLessThanOrEqual(3);

    // Should be sorted by winProbLoss descending
    for (let i = 1; i < result.topBlunders.length; i++) {
      expect(result.topBlunders[i - 1].winProbLoss).toBeGreaterThanOrEqual(
        result.topBlunders[i].winProbLoss
      );
    }

    // Only blunders and mistakes included
    for (const b of result.topBlunders) {
      expect(["blunder", "mistake"]).toContain(b.category);
    }
  });

  it("counts match analyzed moves", async () => {
    const history = playGame(["e4", "e5", "d4", "d5"]);
    const engine = new MockStockfishEngine();

    for (const entry of history) {
      engine.setEval(entry.before, 0);
      engine.setEval(entry.after, 0);
      engine.setBestMove(entry.before, "e2e4");
    }

    const result = await analyzeGame(
      history,
      "white",
      engine as unknown as StockfishEngine
    );

    const totalCounts = Object.values(result.counts).reduce((a, b) => a + b, 0);
    const validMoves = result.moves.filter((m) => !m.skipped);
    expect(totalCounts).toBe(validMoves.length);
  });
});
