import { Chess } from "chess.js";
import type { Key } from "chessground/types";

/**
 * Parse Lichess puzzle moves string into array of UCI moves.
 * Lichess format: "e2e4 d7d5 g1f3" (space-separated UCI)
 * First move is the opponent's setup move, remaining are the solution.
 */
export function parsePuzzleMoves(movesStr: string): string[] {
  return movesStr.trim().split(/\s+/);
}

/**
 * Determine the player's color from FEN.
 * In Lichess puzzles, the first move in the solution is the opponent's.
 * If FEN says white to move → opponent is white → player is black.
 * If FEN says black to move → opponent is black → player is white.
 */
export function getPlayerColor(fen: string): "white" | "black" {
  const turn = fen.split(" ")[1];
  return turn === "w" ? "black" : "white";
}

/**
 * Convert chess.js verbose moves to chessground Dests map.
 * Used to highlight legal move destinations.
 */
export function toDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  const moves = chess.moves({ verbose: true });
  for (const m of moves) {
    const from = m.from as Key;
    const to = m.to as Key;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from)!.push(to);
  }
  return dests;
}

/**
 * Parse a UCI move string (e.g., "e2e4", "e7e8q") into components.
 */
export function parseUci(uci: string): {
  from: string;
  to: string;
  promotion?: string;
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

/**
 * Convert a chess.js move object to UCI string for comparison.
 */
export function moveToUci(move: { from: string; to: string; promotion?: string }): string {
  return move.from + move.to + (move.promotion || "");
}

/**
 * Get the FEN after applying a UCI move to the current position.
 */
export function applyUciMove(
  chess: Chess,
  uci: string
): ReturnType<Chess["move"]> | null {
  const { from, to, promotion } = parseUci(uci);
  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}
