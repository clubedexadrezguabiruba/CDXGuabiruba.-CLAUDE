import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  normalizeFen,
  createQueue,
  enqueue,
  dequeue,
  validateMove,
  projectPosition,
  isFirstMoveCoherent,
  type QueuedMove,
} from "../futureMoveQueue";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makeMove(from: string, to: string, promotion?: "q" | "r" | "b" | "n"): { from: string; to: string; promotion?: "q" | "r" | "b" | "n" } {
  return { from, to, promotion };
}

describe("normalizeFen", () => {
  it("keeps first 4 fields, drops halfmove and fullmove", () => {
    expect(normalizeFen(STARTING_FEN)).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"
    );
  });

  it("preserves en passant square", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(normalizeFen(fen)).toBe(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3"
    );
  });
});

describe("createQueue", () => {
  it("returns empty array", () => {
    expect(createQueue()).toEqual([]);
  });
});

describe("enqueue", () => {
  it("adds a legal move to empty queue", () => {
    const chess = new Chess();
    const result = enqueue([], makeMove("e2", "e4"), chess, 5);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(1);
    expect(result![0].from).toBe("e2");
    expect(result![0].to).toBe("e4");
    expect(result![0].expectedFen).toBeTruthy();
  });

  it("rejects an illegal move", () => {
    const chess = new Chess();
    const result = enqueue([], makeMove("e2", "e5"), chess, 5);
    expect(result).toBeNull();
  });

  it("respects maxSize limit", () => {
    const chess = new Chess();
    const q1 = enqueue([], makeMove("e2", "e4"), chess, 1);
    expect(q1).not.toBeNull();
    // Queue is now full (maxSize=1)
    const q2 = enqueue(q1!, makeMove("d7", "d5"), chess, 1);
    expect(q2).toBeNull();
  });

  it("validates against projected position for multi-move queue", () => {
    const chess = new Chess();
    // White plays e4
    const q1 = enqueue([], makeMove("e2", "e4"), chess, 5);
    expect(q1).not.toBeNull();
    // Now projected position: black to move. Black plays e5
    const q2 = enqueue(q1!, makeMove("e7", "e5"), chess, 5);
    expect(q2).not.toBeNull();
    expect(q2!.length).toBe(2);
    // Now projected: white to move. White plays Nf3
    const q3 = enqueue(q2!, makeMove("g1", "f3"), chess, 5);
    expect(q3).not.toBeNull();
    expect(q3!.length).toBe(3);
  });

  it("rejects move illegal in projected position", () => {
    const chess = new Chess();
    // White plays e4
    const q1 = enqueue([], makeMove("e2", "e4"), chess, 5);
    // Projected: black to move. Trying to move a white piece = illegal
    const q2 = enqueue(q1!, makeMove("d2", "d4"), chess, 5);
    expect(q2).toBeNull();
  });

  it("auto-detects promotion and applies auto-queen", () => {
    // Position where white pawn on e7 can promote (black king on h8, not blocking e8)
    const chess = new Chess("7k/4P3/8/8/8/8/8/4K3 w - - 0 1");
    const result = enqueue([], makeMove("e7", "e8"), chess, 5);
    expect(result).not.toBeNull();
    expect(result![0].promotion).toBe("q");
  });
});

describe("dequeue", () => {
  it("returns null for empty queue", () => {
    expect(dequeue([])).toBeNull();
  });

  it("returns first move and remaining queue", () => {
    const chess = new Chess();
    const q = enqueue([], makeMove("e2", "e4"), chess, 5)!;
    const result = dequeue(q);
    expect(result).not.toBeNull();
    expect(result!.move.from).toBe("e2");
    expect(result!.remaining).toEqual([]);
  });

  it("preserves FIFO order", () => {
    const chess = new Chess();
    let q = enqueue([], makeMove("e2", "e4"), chess, 5)!;
    q = enqueue(q, makeMove("e7", "e5"), chess, 5)!;

    const first = dequeue(q)!;
    expect(first.move.from).toBe("e2");
    expect(first.remaining.length).toBe(1);

    const second = dequeue(first.remaining)!;
    expect(second.move.from).toBe("e7");
    expect(second.remaining.length).toBe(0);
  });
});

describe("validateMove", () => {
  it("returns true for a legal move", () => {
    const chess = new Chess();
    const move: QueuedMove = {
      from: "e2", to: "e4", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(true);
  });

  it("returns false for an illegal move", () => {
    const chess = new Chess();
    const move: QueuedMove = {
      from: "e2", to: "e5", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(false);
  });

  it("detects captured piece making move illegal", () => {
    // After 1. e4 d5 2. exd5, the black d5 pawn is gone
    const chess = new Chess();
    chess.move("e4");
    chess.move("d5");
    chess.move("exd5");

    // Black tries to move d5 pawn — it was captured
    const move: QueuedMove = {
      from: "d5", to: "d4", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(false);
  });

  it("detects castling becoming illegal", () => {
    // Position: king has moved, castling rights lost
    const chess = new Chess("r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1");
    // No castling rights (FEN has "-")
    const move: QueuedMove = {
      from: "e1", to: "g1", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(false);
  });

  it("validates promotion move", () => {
    const chess = new Chess("7k/4P3/8/8/8/8/8/4K3 w - - 0 1");
    const move: QueuedMove = {
      from: "e7", to: "e8", promotion: "q", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(true);
  });
});

describe("projectPosition", () => {
  it("returns clone for empty queue", () => {
    const chess = new Chess();
    const result = projectPosition([], chess);
    expect(result).not.toBeNull();
    expect(result!.fen()).toBe(chess.fen());
  });

  it("applies queued moves to clone", () => {
    const chess = new Chess();
    const q = enqueue([], makeMove("e2", "e4"), chess, 5)!;
    const result = projectPosition(q, chess);
    expect(result).not.toBeNull();
    // Original chess unchanged
    expect(chess.fen()).toBe(STARTING_FEN);
    // Projected has e4 played
    expect(result!.fen()).toContain("4P3");
  });

  it("returns null if a queued move is illegal", () => {
    const chess = new Chess();
    const badQueue: QueuedMove[] = [
      { from: "e2", to: "e5", createdAt: 0, expectedFen: "" },
    ];
    expect(projectPosition(badQueue, chess)).toBeNull();
  });
});

describe("isFirstMoveCoherent", () => {
  it("returns true for empty queue", () => {
    expect(isFirstMoveCoherent([], STARTING_FEN)).toBe(true);
  });

  it("returns true when first move is legal in current position", () => {
    const chess = new Chess();
    const q = enqueue([], makeMove("e2", "e4"), chess, 5)!;
    expect(isFirstMoveCoherent(q, chess.fen())).toBe(true);
  });

  it("returns false when position changed and move became illegal", () => {
    const chess = new Chess();
    const q = enqueue([], makeMove("e2", "e4"), chess, 5)!;

    // Change position: advance to a different state where e2-e4 is impossible
    chess.move("d4");
    chess.move("d5");
    // e2 pawn is still there, e4 is still empty, but it's black's turn → illegal for white
    // Actually after d4 d5 it's white's turn. Let's make e2-e4 still legal.
    // Better test: queue a move for a piece that gets captured
    const chess2 = new Chess("rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
    const q2 = enqueue([], makeMove("e4", "e5"), chess2, 5)!;

    // Now change position: e4 pawn was captured
    const chess3 = new Chess("rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3");
    expect(isFirstMoveCoherent(q2, chess3.fen())).toBe(false);
  });
});

describe("edge cases", () => {
  it("en passant becomes illegal when position changes", () => {
    // Position with en passant available
    const chess = new Chess("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3");
    const move: QueuedMove = {
      from: "e5", to: "d6", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(true);

    // Same piece positions but no en passant
    const chess2 = new Chess("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3");
    expect(validateMove(move, chess2)).toBe(false);
  });

  it("check forces specific response, invalidating queued move", () => {
    // White is in check, must respond
    const chess = new Chess("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    // Try to play a2-a3 (not a valid response to check)
    const move: QueuedMove = {
      from: "a2", to: "a3", createdAt: 0, expectedFen: "",
    };
    expect(validateMove(move, chess)).toBe(false);
  });

  it("5-move queue fills up correctly", () => {
    const chess = new Chess();
    let q = enqueue([], makeMove("e2", "e4"), chess, 5)!;
    q = enqueue(q, makeMove("e7", "e5"), chess, 5)!;
    q = enqueue(q, makeMove("g1", "f3"), chess, 5)!;
    q = enqueue(q, makeMove("b8", "c6"), chess, 5)!;
    q = enqueue(q, makeMove("f1", "c4"), chess, 5)!;
    expect(q.length).toBe(5);

    // 6th should fail
    const q6 = enqueue(q, makeMove("g8", "f6"), chess, 5);
    expect(q6).toBeNull();
  });
});
