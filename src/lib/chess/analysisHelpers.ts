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

/**
 * Format centipawn eval for display.
 * Mate scores show as "+M" / "-M".
 */
export function formatEval(cp: number): string {
  if (cp >= 9000) return "+M";
  if (cp <= -9000) return "-M";
  const val = (cp / 100).toFixed(2);
  return cp >= 0 ? `+${val}` : val;
}

/**
 * Map centipawns to white's eval bar percentage (50% = equal).
 * Clamped to [2, 98].
 */
export function evalBarPercent(cp: number): number {
  if (cp >= 9000) return 100;
  if (cp <= -9000) return 0;
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
