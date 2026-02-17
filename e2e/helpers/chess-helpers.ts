import type { Page } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ============================================================
// Seed test puzzles — verified positions with known solutions
// ============================================================

interface TestPuzzle {
  lichess_id: string;
  fen: string;
  moves: string;
  rating: number;
  rating_deviation: number;
  themes: string[];
}

/**
 * Verified test puzzles with correct solutions:
 *
 * 1. test_m1_white: Back rank mate in 1, player = white
 *    Position: White Rf1+Kh1 vs Black Kg8(→h8)+pawns g7/h7
 *    Setup: Kh8, Solution: Rf8# (rook mates on 8th rank, pawns block escape)
 *
 * 2. test_m1_black: Back rank mate in 1, player = black
 *    Position: Black Rf8+Kh8 vs White Kg1(→h1)+pawns g2/h2
 *    Setup: Kh1, Solution: Rf1# (rook mates on 1st rank, pawns block escape)
 */
const TEST_PUZZLES: TestPuzzle[] = [
  {
    lichess_id: "test_m1_white",
    fen: "7k/6pp/8/8/8/8/6PP/5R1K b - - 0 1",
    moves: "h8g8 f1f8",
    rating: 600,
    rating_deviation: 75,
    themes: ["mateIn1", "backRankMate"],
  },
  {
    lichess_id: "test_m1_black",
    fen: "5r1k/6pp/8/8/8/8/6PP/7K w - - 0 1",
    moves: "h1g1 f8f1",
    rating: 600,
    rating_deviation: 75,
    themes: ["mateIn1", "backRankMate"],
  },
];

export async function seedTestPuzzles(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  for (const puzzle of TEST_PUZZLES) {
    await fetch(`${SUPABASE_URL}/rest/v1/puzzles`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(puzzle),
    });
  }
}

export async function cleanupTestPuzzles(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  await fetch(
    `${SUPABASE_URL}/rest/v1/puzzles?lichess_id=like.test_%`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
}

// ============================================================
// Check if database has puzzles
// ============================================================

export async function hasPuzzlesInDB(theme?: string): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return false;

  let url = `${SUPABASE_URL}/rest/v1/puzzles?select=id&limit=1`;
  if (theme) {
    url += `&themes=cs.{${theme}}`;
  }

  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

// ============================================================
// Chessground interaction helpers
// ============================================================

/**
 * Get the pixel center of a chess square on the chessground board.
 * Chessground renders an 8x8 grid; orientation flips coordinates.
 */
function getSquareCenter(
  boardRect: { x: number; y: number; width: number; height: number },
  square: string,
  orientation: "white" | "black"
): { x: number; y: number } {
  const file = square.charCodeAt(0) - "a".charCodeAt(0); // 0-7 (a-h)
  const rank = parseInt(square[1]) - 1; // 0-7 (1-8)

  const cellW = boardRect.width / 8;
  const cellH = boardRect.height / 8;

  let col: number;
  let row: number;

  if (orientation === "white") {
    col = file; // a=0 left, h=7 right
    row = 7 - rank; // rank 8=top(0), rank 1=bottom(7)
  } else {
    col = 7 - file; // h=0 left, a=7 right
    row = rank; // rank 1=top(0), rank 8=bottom(7)
  }

  return {
    x: boardRect.x + col * cellW + cellW / 2,
    y: boardRect.y + row * cellH + cellH / 2,
  };
}

/**
 * Make a chess move by clicking on the source and destination squares.
 * Orientation must be provided (derived from FEN via getPlayerColor).
 * NOTE: Chessground uses CSS flex-direction to flip coordinates visually,
 * so DOM-based orientation detection is unreliable.
 */
export async function makeMove(
  page: Page,
  from: string,
  to: string,
  orientation: "white" | "black"
): Promise<void> {
  const board = page.locator("cg-board");
  const rect = await board.boundingBox();
  if (!rect) throw new Error("Board not found");

  const fromPos = getSquareCenter(rect, from, orientation);
  const toPos = getSquareCenter(rect, to, orientation);

  // Click source square to select piece
  await page.mouse.click(fromPos.x, fromPos.y);
  await page.waitForTimeout(150);

  // Click destination square to make move
  await page.mouse.click(toPos.x, toPos.y);
  await page.waitForTimeout(300);
}

/**
 * Wait for the puzzle phase to change (shown as text below the board).
 */
export async function waitForPhase(
  page: Page,
  phase: "playing" | "correct" | "failed",
  timeout = 10_000
): Promise<void> {
  const textMap = {
    playing: /jogam$/,
    correct: "Correto!",
    failed: "Incorreto",
  };
  // Use .first() because parent pages (rating, categorias) also show
  // "Correto!" in their result overlay, causing strict mode violations.
  // PuzzleBoard's phase text always appears first in DOM order.
  await page.getByText(textMap[phase]).first().waitFor({ timeout });
}

/**
 * Wait for the opponent to make their move (animation delay).
 */
export async function waitForOpponentMove(
  page: Page,
  ms = 1500
): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * Intercept a Supabase RPC response and extract the result data.
 * Must be called BEFORE navigating to the page.
 */
export async function interceptRPC(
  page: Page,
  rpcName: string
): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(`/rest/v1/rpc/${rpcName}`)) {
        try {
          const data = await response.json();
          resolve(data as Record<string, unknown>);
        } catch {
          // ignore parse errors
        }
      }
    });
  });
}

/**
 * Parse solution moves from Lichess format (space-separated UCI).
 */
export function parseMoves(movesStr: string): string[] {
  return movesStr.trim().split(/\s+/);
}

/**
 * Determine player color from FEN.
 * If FEN says white to move → opponent is white → player is black.
 */
export function getPlayerColor(fen: string): "white" | "black" {
  const turn = fen.split(" ")[1];
  return turn === "w" ? "black" : "white";
}

/**
 * Solve a puzzle by making the correct moves.
 * @param page Playwright page
 * @param allMoves ALL moves (setup + solution) — move[0] is opponent's setup
 * @param fen The puzzle FEN (before any moves) — used to determine orientation
 *
 * Player moves are at odd indices (1, 3, 5...).
 * Opponent responses are at even indices (2, 4, 6...).
 */
export async function solvePuzzle(
  page: Page,
  allMoves: string[],
  fen: string
): Promise<void> {
  const orientation = getPlayerColor(fen);

  // Wait for opponent's setup move (move[0])
  await waitForOpponentMove(page);
  await waitForPhase(page, "playing");

  for (let i = 1; i < allMoves.length; i++) {
    const move = allMoves[i];
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);

    if (i % 2 === 1) {
      // Player's move (odd index)
      await makeMove(page, from, to, orientation);

      // If this is the last move, puzzle should complete
      if (i === allMoves.length - 1) {
        return;
      }
    } else {
      // Opponent's response (even index) — wait for animation
      await waitForOpponentMove(page, 1000);
    }
  }
}

/**
 * Make a deliberately wrong move to fail the puzzle.
 * @param orientation Board orientation (derived from FEN via getPlayerColor)
 */
export async function makeWrongMove(
  page: Page,
  orientation: "white" | "black"
): Promise<void> {
  const board = page.locator("cg-board");
  const rect = await board.boundingBox();
  if (!rect) throw new Error("Board not found");

  // Strategy: click on various squares until we trigger a move.
  const squares =
    orientation === "white"
      ? ["e2", "e4", "d2", "d4", "a2", "a3", "h2", "h3"]
      : ["e7", "e5", "d7", "d5", "a7", "a6", "h7", "h6"];

  for (let i = 0; i < squares.length - 1; i++) {
    const from = squares[i];
    const to = squares[i + 1];
    const fromPos = getSquareCenter(rect, from, orientation);
    const toPos = getSquareCenter(rect, to, orientation);

    await page.mouse.click(fromPos.x, fromPos.y);
    await page.waitForTimeout(100);
    await page.mouse.click(toPos.x, toPos.y);
    await page.waitForTimeout(200);

    // Check if the move was accepted (phase changed to failed)
    const failed = await page
      .getByText("Incorreto")
      .isVisible()
      .catch(() => false);
    if (failed) return;
  }
}
