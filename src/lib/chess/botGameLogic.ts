import type { Chess } from "chess.js";
import type { Bot, PlayerColor, GameOverInfo } from "@/types/bot";

/**
 * Detect if the game is over and determine result from player's perspective.
 */
export function detectGameOver(
  chess: Chess,
  playerColor: PlayerColor
): GameOverInfo | null {
  if (chess.isCheckmate()) {
    // The side to move is in checkmate — they lost
    const loserColor = chess.turn() === "w" ? "white" : "black";
    return {
      result: loserColor === playerColor ? "loss" : "win",
      reason: "checkmate",
    };
  }

  if (chess.isStalemate()) return { result: "draw", reason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { result: "draw", reason: "insufficient" };
  if (chess.isThreefoldRepetition()) return { result: "draw", reason: "threefold" };
  if (chess.isDraw()) return { result: "draw", reason: "fifty-moves" };

  return null;
}

/**
 * Generate PGN with standard headers.
 */
export function generatePgn(
  chess: Chess,
  bot: Bot,
  playerColor: PlayerColor,
  resultStr: string
): string {
  const white = playerColor === "white" ? "Jogador" : bot.name;
  const black = playerColor === "black" ? "Jogador" : bot.name;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  const moves = chess.pgn();
  return `[White "${white}"]\n[Black "${black}"]\n[Date "${date}"]\n[Result "${resultStr}"]\n\n${moves} ${resultStr}`;
}

/**
 * Pick a random phrase from the bot's phrases_json.
 */
export function getRandomPhrase(
  bot: Bot,
  key: keyof Bot["phrases_json"]
): string {
  const phrases = bot.phrases_json[key];
  if (!phrases || phrases.length === 0) return "";
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Map GameResult to PGN result string.
 */
export function resultToPgn(result: "win" | "loss" | "draw", playerColor: PlayerColor): string {
  if (result === "draw") return "1/2-1/2";
  if (result === "win") return playerColor === "white" ? "1-0" : "0-1";
  return playerColor === "white" ? "0-1" : "1-0";
}
