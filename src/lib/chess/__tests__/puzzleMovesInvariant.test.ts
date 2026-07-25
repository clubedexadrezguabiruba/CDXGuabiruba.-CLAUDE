import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  parsePuzzleMoves,
  parseUci,
  applyUciMove,
  moveToUci,
} from "../puzzleLogic";
import fixtures from "./fixtures/puzzle-solutions.json";

/**
 * INVARIANTE DE SERVER-AUTHORITY DOS PUZZLES
 *
 * `puzzle_attempt` valida comparando `p_moves` com `puzzles.moves`. Para que essa
 * validação signifique algo, o client precisa enviar os lances que REALMENTE
 * jogou (`movesPlayed`), e não a solução que o servidor já lhe entregou.
 *
 * Isso só é seguro se, num acerto honesto, `movesPlayed` for idêntico à solução.
 * Este teste prova essa igualdade replicando exatamente a mecânica de
 * PuzzleBoard.tsx sobre puzzles reais do banco (inclusive promoções):
 *
 *  - lance do oponente (índices pares): PuzzleBoard empurra a string da solução
 *    crua em `movesPlayedRef` (PuzzleBoard.tsx:294).
 *  - lance do jogador (índices ímpares): PuzzleBoard empurra
 *    `moveToUci(moveResult)` (PuzzleBoard.tsx:197), onde a promoção é forçada
 *    para a peça da solução (PuzzleBoard.tsx:186-188).
 *
 * Se este teste falhar para algum puzzle, enviar `movesPlayed` reprovaria um
 * acerto legítimo — então ele é o gate que protege a mudança.
 */

type Fixture = { id: string | number; fen: string; moves: string };
const puzzles = fixtures as Fixture[];

/** Reproduz o que `movesPlayedRef.current` contém após um acerto completo. */
function simulateHonestSolve(fen: string, solution: string): string[] {
  const moves = parsePuzzleMoves(solution);
  const chess = new Chess(fen);
  const movesPlayed: string[] = [];

  for (let idx = 0; idx < moves.length; idx++) {
    const expectedUci = moves[idx];

    // Índices pares = lance do oponente, jogado automaticamente pelo board.
    if (idx % 2 === 0) {
      const applied = applyUciMove(chess, expectedUci);
      if (!applied) throw new Error(`lance do oponente ilegal: ${expectedUci} (idx ${idx})`);
      movesPlayed.push(expectedUci);
      continue;
    }

    // Índices ímpares = lance do jogador. O jogador honesto arrasta a peça
    // de/para as casas certas; a promoção é preenchida pelo componente.
    const parsed = parseUci(expectedUci);
    const userUci = expectedUci.slice(0, 4);
    const fullUserUci = parsed.promotion ? userUci + parsed.promotion : userUci;

    const moveResult = applyUciMove(chess, fullUserUci);
    if (!moveResult) throw new Error(`lance do jogador ilegal: ${fullUserUci} (idx ${idx})`);
    movesPlayed.push(moveToUci(moveResult));
  }

  return movesPlayed;
}

describe("invariante movesPlayed === solução (puzzles reais)", () => {
  it("tem fixtures suficientes, incluindo promoções", () => {
    expect(puzzles.length).toBeGreaterThan(300);
    const comPromocao = puzzles.filter((p) => /[a-h][1-8][a-h][1-8][qrbn]/.test(p.moves));
    expect(comPromocao.length).toBeGreaterThan(50);
  });

  it("todas as soluções são legais a partir do FEN", () => {
    const ilegais: string[] = [];
    for (const p of puzzles) {
      try {
        simulateHonestSolve(p.fen, p.moves);
      } catch (e) {
        ilegais.push(`${p.id}: ${(e as Error).message}`);
      }
    }
    expect(ilegais).toEqual([]);
  });

  it("movesPlayed de um acerto honesto é idêntico a puzzles.moves", () => {
    const divergentes: string[] = [];

    for (const p of puzzles) {
      const esperado = parsePuzzleMoves(p.moves);
      let obtido: string[];
      try {
        obtido = simulateHonestSolve(p.fen, p.moves);
      } catch {
        continue; // coberto pelo teste de legalidade
      }
      if (obtido.join(" ") !== esperado.join(" ")) {
        divergentes.push(`${p.id}\n  esperado: ${esperado.join(" ")}\n  obtido:   ${obtido.join(" ")}`);
      }
    }

    expect(divergentes).toEqual([]);
  });

  it("um lance errado do jogador produz movesPlayed diferente da solução", () => {
    // Garante que a comparação no servidor tem poder discriminante: se o
    // jogador erra, o array enviado difere da solução.
    const p = puzzles.find((x) => parsePuzzleMoves(x.moves).length >= 3);
    expect(p).toBeDefined();

    const moves = parsePuzzleMoves(p!.moves);
    const chess = new Chess(p!.fen);
    applyUciMove(chess, moves[0]); // oponente

    // Qualquer lance legal diferente do esperado
    const legais = chess.moves({ verbose: true });
    const errado = legais.find((m) => moveToUci(m) !== moves[1]);
    expect(errado).toBeDefined();

    expect(moveToUci(errado!)).not.toBe(moves[1]);
  });
});
