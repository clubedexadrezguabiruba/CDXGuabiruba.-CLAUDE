import { Chess } from "chess.js";

/**
 * Derive from/to squares from a SAN move and the FEN before it.
 */
export function getLastMoveSquares(
  fenBefore: string,
  san: string
): [string, string] | undefined {
  try {
    const c = new Chess(fenBefore);
    const m = c.move(san);
    return m ? [m.from, m.to] : undefined;
  } catch {
    return undefined;
  }
}

/** Check if a centipawn value encodes a forced mate. */
export function isMateEval(cp: number): boolean {
  return Math.abs(cp) > 9999;
}

/** Extract mate-in-N from an encoded mate eval. */
export function extractMateIn(cp: number): number {
  return 100 - (Math.abs(cp) - 10000);
}

/**
 * Format centipawn eval for display.
 * Mate scores show as "+M3" / "-M3" with distance.
 */
export function formatEval(cp: number): string {
  if (isMateEval(cp)) {
    const m = extractMateIn(cp);
    return cp > 0 ? `+M${m}` : `-M${m}`;
  }
  const val = (cp / 100).toFixed(2);
  return cp >= 0 ? `+${val}` : val;
}

/**
 * Map centipawns to white's eval bar percentage (50% = equal).
 * Clamped to [2, 98].
 */
export function evalBarPercent(cp: number): number {
  if (isMateEval(cp)) return cp > 0 ? 100 : 0;
  const pct = 50 + 50 * (2 / (1 + Math.exp(-cp / 250)) - 1);
  return Math.max(2, Math.min(98, pct));
}

/**
 * Return a hex color based on accuracy percentage.
 */
export function accuracyColor(accuracy: number): string {
  if (accuracy >= 75) return "#22c55e";
  if (accuracy >= 50) return "#eab308";
  if (accuracy >= 25) return "#f97316";
  return "#ef4444";
}
