"use client";

import { useMemo } from "react";
import { Chess } from "chess.js";

// Piece values for material balance
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

// Unicode piece symbols (shown in captured color)
const WHITE_PIECES: Record<string, string> = { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕" };
const BLACK_PIECES: Record<string, string> = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" };

// Order: queen, rook, bishop, knight, pawn (highest value first)
const PIECE_ORDER = ["q", "r", "b", "n", "p"];

interface CapturedPiecesProps {
  /** Full move history with FEN before each move + SAN */
  history: { san: string; before: string }[];
  /** Which side's captures to show (pieces THIS side captured from the opponent) */
  perspective: "white" | "black";
}

/**
 * Derives captured pieces by replaying each SAN move with chess.js.
 * Uses the `captured` field from moveResult, not FEN diff (handles promotion correctly).
 */
function deriveCaptured(history: { san: string; before: string }[]) {
  const capturedByWhite: string[] = []; // pieces white captured (black pieces)
  const capturedByBlack: string[] = []; // pieces black captured (white pieces)

  for (const entry of history) {
    try {
      const c = new Chess(entry.before);
      const result = c.move(entry.san);
      if (result?.captured) {
        if (result.color === "w") {
          capturedByWhite.push(result.captured);
        } else {
          capturedByBlack.push(result.captured);
        }
      }
    } catch {
      // Skip invalid moves
    }
  }

  return { capturedByWhite, capturedByBlack };
}

function sortPieces(pieces: string[]): string[] {
  return [...pieces].sort(
    (a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b)
  );
}

export default function CapturedPieces({ history, perspective }: CapturedPiecesProps) {
  const { capturedByWhite, capturedByBlack } = useMemo(
    () => deriveCaptured(history),
    [history]
  );

  // This side's captures (pieces taken from opponent)
  const myCaptured = perspective === "white" ? capturedByWhite : capturedByBlack;
  const opponentCaptured = perspective === "white" ? capturedByBlack : capturedByWhite;

  // Material balance: my captures value - opponent captures value
  const myValue = myCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
  const oppValue = opponentCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
  const balance = myValue - oppValue;

  // Pieces shown in opponent's color (these are pieces taken FROM the opponent)
  const pieceSymbols = perspective === "white" ? BLACK_PIECES : WHITE_PIECES;
  const sorted = sortPieces(myCaptured);

  if (sorted.length === 0 && balance <= 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      <span className="flex items-center text-xs leading-none opacity-80">
        {sorted.map((piece, i) => (
          <span key={i} className="-mr-0.5">
            {pieceSymbols[piece] || piece}
          </span>
        ))}
      </span>
      {balance > 0 && (
        <span className="ml-1 text-[10px] font-semibold text-zinc-500">
          +{balance}
        </span>
      )}
    </div>
  );
}
