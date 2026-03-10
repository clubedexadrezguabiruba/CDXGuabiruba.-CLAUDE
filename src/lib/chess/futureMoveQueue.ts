/**
 * futureMoveQueue.ts — Motor puro de fila de jogadas futuras.
 *
 * Sem React, sem side effects. Funções puras que operam sobre a fila.
 * Usado por useFutureMoveQueue.ts (hook) em BotBoard e PuzzleBoard.
 */

import { Chess } from "chess.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedMove {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
  createdAt: number;
  /** FEN normalizado (peças + turno + roque + en passant) esperado quando este lance executar */
  expectedFen: string;
}

// ---------------------------------------------------------------------------
// FEN helpers
// ---------------------------------------------------------------------------

/** Mantém campos 1-4 do FEN (peças, turno, roque, en passant). Descarta halfmove/fullmove. */
export function normalizeFen(fen: string): string {
  const parts = fen.split(" ");
  return parts.slice(0, 4).join(" ");
}

// ---------------------------------------------------------------------------
// Queue operations (pure)
// ---------------------------------------------------------------------------

export function createQueue(): QueuedMove[] {
  return [];
}

/**
 * Adiciona lance à fila. Valida na posição projetada (shadow chess).
 * Retorna nova fila ou null se cheia ou lance inválido na projeção.
 */
export function enqueue(
  queue: QueuedMove[],
  move: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" },
  chess: Chess,
  maxSize: number
): QueuedMove[] | null {
  if (queue.length >= maxSize) return null;

  // Projetar posição após lances já na fila
  const projected = projectPosition(queue, chess);
  if (!projected) return null;

  // Detectar promoção automática
  const promotion = move.promotion ?? detectPromotion(projected, move.from, move.to);

  // Validar lance na posição projetada
  let testMove;
  try {
    testMove = projected.move({
      from: move.from,
      to: move.to,
      promotion: promotion,
    });
  } catch {
    return null;
  }

  if (!testMove) return null;

  const expectedFen = normalizeFen(projected.fen());

  const item: QueuedMove = {
    from: move.from,
    to: move.to,
    promotion: promotion,
    createdAt: Date.now(),
    expectedFen,
  };

  return [...queue, item];
}

/** Remove e retorna o primeiro lance da fila. */
export function dequeue(
  queue: QueuedMove[]
): { move: QueuedMove; remaining: QueuedMove[] } | null {
  if (queue.length === 0) return null;
  const [move, ...remaining] = queue;
  return { move, remaining };
}

/** Validação real: tenta chess.move() num clone da posição atual. */
export function validateMove(move: QueuedMove, chess: Chess): boolean {
  const clone = new Chess(chess.fen());
  try {
    const result = clone.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Projeta posição: aplica todos os lances da fila num clone.
 * Retorna o clone na posição final, ou null se algum lance falhar.
 */
export function projectPosition(
  queue: QueuedMove[],
  chess: Chess
): Chess | null {
  const clone = new Chess(chess.fen());
  for (const item of queue) {
    try {
      const result = clone.move({
        from: item.from,
        to: item.to,
        promotion: item.promotion,
      });
      if (!result) return null;
    } catch {
      return null;
    }
  }
  return clone;
}

/** Verifica se o primeiro lance da fila é coerente com a posição atual. */
export function isFirstMoveCoherent(
  queue: QueuedMove[],
  currentFen: string
): boolean {
  if (queue.length === 0) return true;
  // O expectedFen do primeiro item foi calculado como a posição APÓS o lance,
  // então para checar coerência comparamos se o lance é legal na posição atual.
  // Usamos validateMove em vez de comparar FENs, pois é mais robusto.
  const clone = new Chess(currentFen);
  const first = queue[0];
  try {
    const result = clone.move({
      from: first.from,
      to: first.to,
      promotion: first.promotion,
    });
    return result !== null;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Detecta se um lance é promoção de peão e retorna 'q' (auto-queen). */
function detectPromotion(
  chess: Chess,
  from: string,
  to: string
): "q" | undefined {
  const piece = chess.get(from as Parameters<typeof chess.get>[0]);
  if (!piece || piece.type !== "p") return undefined;
  const rank = to[1];
  if (
    (piece.color === "w" && rank === "8") ||
    (piece.color === "b" && rank === "1")
  ) {
    return "q";
  }
  return undefined;
}
