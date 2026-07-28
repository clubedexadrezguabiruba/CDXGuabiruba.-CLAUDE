import { expect, type Page } from "@playwright/test";
import { Chess } from "chess.js";

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
 * Lê quais casas do tabuleiro estão ocupadas, direto do DOM do chessground.
 *
 * Por que pelo retângulo de cada <piece> e não por hit-testing: o chessground
 * declara `cg-board piece { pointer-events: none }` (chessground.base.css:59),
 * então document.elementFromPoint nunca devolve uma peça. Já
 * getBoundingClientRect() devolve a caixa renderizada, translate incluído — dá
 * para mapear direto para a casa.
 *
 * Peças em `ghost` (arraste) e `fading` (captura saindo) são ignoradas: elas
 * não representam a posição real.
 */
async function occupiedSquares(
  page: Page,
  orientation: "white" | "black"
): Promise<Set<string>> {
  const squares = await page.evaluate((orient) => {
    const board = document.querySelector("cg-board");
    if (!board) return [];
    const rect = board.getBoundingClientRect();
    if (rect.width === 0) return [];
    const cell = rect.width / 8;
    const files = "abcdefgh";
    const out: string[] = [];

    for (const piece of Array.from(board.querySelectorAll("piece"))) {
      if (piece.classList.contains("ghost") || piece.classList.contains("fading")) {
        continue;
      }
      const p = piece.getBoundingClientRect();
      const col = Math.floor((p.left + p.width / 2 - rect.left) / cell);
      const row = Math.floor((p.top + p.height / 2 - rect.top) / cell);
      if (col < 0 || col > 7 || row < 0 || row > 7) continue;

      // Mesmo mapeamento de getSquareCenter, invertido.
      const file = orient === "white" ? col : 7 - col;
      const rank = orient === "white" ? 7 - row : row;
      out.push(`${files[file]}${rank + 1}`);
    }
    return out;
  }, orientation);

  return new Set(squares);
}

/**
 * Make a chess move by clicking on the source and destination squares.
 * Orientation must be provided (derived from FEN via getPlayerColor).
 * NOTE: Chessground uses CSS flex-direction to flip coordinates visually,
 * so DOM-based orientation detection is unreliable.
 *
 * O helper ASSERTA que o lance entrou. Antes ele era fire-and-forget — dois
 * cliques com esperas fixas de 150/300 ms e nenhuma verificação — e quando o
 * lance não entrava o teste seguia em silêncio. Numa partida de bot isso levava
 * ao modal com ZERO lances; como BotGameClient.tsx:293 guarda a análise atrás de
 * `if (history.length > 0)`, o botão "Ver Análise" ficava permanentemente
 * desabilitado e a espera de 60 s do teste C4 não tinha como ser satisfeita. A
 * falha aparecia longe da causa.
 *
 * @param expectLanded  false para cliques que NÃO devem virar lance de verdade —
 *   é o caso dos premoves em premove.spec.ts, onde a peça faz snap-back de
 *   propósito porque não é a vez do jogador.
 */
export async function makeMove(
  page: Page,
  from: string,
  to: string,
  orientation: "white" | "black",
  { expectLanded = true }: { expectLanded?: boolean } = {}
): Promise<void> {
  const board = page.locator("cg-board");
  const rect = await board.boundingBox();
  if (!rect) throw new Error("Board not found");

  const fromPos = getSquareCenter(rect, from, orientation);
  const toPos = getSquareCenter(rect, to, orientation);

  if (expectLanded) {
    const before = await occupiedSquares(page, orientation);
    if (!before.has(from)) {
      throw new Error(
        `makeMove(${from}->${to}): não há peça em ${from}. ` +
          `Orientação usada: ${orientation}. Casas ocupadas: ${[...before].sort().join(",")}`
      );
    }
  }

  // Click source square to select piece
  await page.mouse.click(fromPos.x, fromPos.y);
  await page.waitForTimeout(150);

  // Click destination square to make move
  await page.mouse.click(toPos.x, toPos.y);

  if (!expectLanded) {
    await page.waitForTimeout(300);
    return;
  }

  // Uma segunda tentativa, limitada.
  //
  // Se o clique cai antes de o app devolver a vez ao jogador, ele vira PREMOVE
  // (PuzzleBoard mantém uma fila de premove) e a peça faz snap-back — o lance
  // simplesmente não acontece. A posição já foi conferida antes daqui, então
  // não é caso de posição errada: é o clique ter chegado alguns milissegundos
  // cedo. Reemitir uma vez resolve, e a checagem antes do reclique evita
  // duplicar um lance que só estava lento para animar.
  const entrou = await moveLanded(page, from, to, orientation, 1_500);
  if (!entrou) {
    await page.mouse.click(fromPos.x, fromPos.y);
    await page.waitForTimeout(150);
    await page.mouse.click(toPos.x, toPos.y);
  }

  await waitForMoveOnBoard(page, from, to, orientation, {
    message:
      `Lance ${from}->${to} não entrou no tabuleiro, nem após uma segunda ` +
      `tentativa. Causas típicas: lance ilegal na posição, ou orientação ` +
      `errada (${orientation}).`,
  });
}

/** O lance from->to já está refletido no tabuleiro? Poll curto, sem lançar. */
async function moveLanded(
  page: Page,
  from: string,
  to: string,
  orientation: "white" | "black",
  timeout: number
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const now = await occupiedSquares(page, orientation);
    if (!now.has(from) && now.has(to)) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

/** Conjunto de casas ocupadas numa posição do chess.js. */
function occupiedFromChess(chess: Chess): Set<string> {
  const set = new Set<string>();
  for (const row of chess.board()) {
    for (const sq of row) if (sq) set.add(sq.square);
  }
  return set;
}

/**
 * Espera o tabuleiro chegar EXATAMENTE na posição esperada.
 *
 * Por que a posição inteira e não só "a peça saiu da origem e chegou ao
 * destino": no modo resistência os puzzles se sucedem, e o contador da página
 * ("Puzzle 4 / 60") avança ANTES de o tabuleiro terminar de carregar a nova
 * posição. Uma checagem local pode ser satisfeita por coincidência na posição
 * ANTERIOR — origem vazia e destino ocupado acontecem o tempo todo num
 * tabuleiro cheio. O teste então jogava o lance do jogador na posição errada.
 *
 * Comparar o conjunto de casas ocupadas com o que o chess.js calcula elimina o
 * falso positivo, e de brinde trata roque, en passant e promoção corretamente —
 * casos em que "remove origem, adiciona destino" estaria errado.
 */
async function waitForPosition(
  page: Page,
  chess: Chess,
  orientation: "white" | "black",
  { message, timeout = 15_000 }: { message: string; timeout?: number }
): Promise<void> {
  const esperado = [...occupiedFromChess(chess)].sort().join(",");

  await expect
    .poll(
      async () => [...(await occupiedSquares(page, orientation))].sort().join(","),
      { timeout, message }
    )
    .toBe(esperado);
}

/**
 * Espera até o tabuleiro refletir o lance from->to.
 *
 * O sinal é a peça ter saído da origem E chegado ao destino. Poll em vez de
 * espera fixa porque o chessground anima a transição (~200 ms) e a velocidade
 * varia com a carga da máquina.
 */
async function waitForMoveOnBoard(
  page: Page,
  from: string,
  to: string,
  orientation: "white" | "black",
  { message, timeout = 5_000 }: { message: string; timeout?: number }
): Promise<void> {
  await expect
    .poll(
      async () => {
        const now = await occupiedSquares(page, orientation);
        return !now.has(from) && now.has(to);
      },
      { timeout, message }
    )
    .toBe(true);
}

/**
 * Inicia um duelo contra bot e espera o jogo REALMENTE começar.
 *
 * Por que existe: os 13 call sites faziam
 *   click('button:has-text("Iniciar Duelo"):visible')
 *   expect(page.locator("cg-board")).toBeVisible()
 * e essa segunda linha não prova nada — o **pré-jogo já mostra um tabuleiro**.
 * Quando o clique caía antes da hidratação do React, o handler não registrava, o
 * jogo não começava, e o teste seguia adiante achando que estava jogando. A falha
 * aparecia lá na frente, procurando um elemento da fase de jogo (o header
 * "Lances" no D2-desktop, por exemplo), sem pista da causa.
 *
 * O sinal de que o jogo começou é o indicador de vez — "Sua vez" ou
 * "<bot> pensando..." (BotGameClient.tsx:748-751 e :834), que só existe na fase de
 * jogo. O retry cobre o clique que chegou cedo demais.
 *
 * `filter({ visible: true })` e NÃO `.first()`: o indicador é renderizado duas
 * vezes, uma no layout mobile (`lg:hidden`) e outra no sidebar desktop. Num
 * viewport desktop o `.first()` casa com o elemento mobile, que o CSS esconde —
 * o log do Playwright mostrava "18 × locator resolved to <span class=...lg:hidden>
 * Sua vez</span> - unexpected value hidden". É a mesma armadilha já paga no
 * perfil, que monta dois AvatarDisplay pelo mesmo motivo.
 */
export async function startBotGame(page: Page): Promise<void> {
  const startButton = page.locator('button:has-text("Iniciar Duelo"):visible');
  const turnIndicator = page
    .getByText(/Sua vez|pensando\.\.\./)
    .filter({ visible: true })
    .first();

  await expect(startButton.first()).toBeVisible({ timeout: 15_000 });
  await startButton.first().click();

  try {
    await expect(turnIndicator).toBeVisible({ timeout: 5_000 });
  } catch {
    // Clique cedo demais (pré-hidratação): o botão ainda está lá. Tenta de novo.
    if (await startButton.first().isVisible().catch(() => false)) {
      await startButton.first().click();
    }
    await expect(turnIndicator).toBeVisible({ timeout: 15_000 });
  }
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

  // Acompanha a posição esperada em paralelo, com o chess.js — a mesma fonte de
  // verdade que o app usa.
  //
  // Antes havia esperas fixas aqui (1500 ms para o lance de abertura do
  // oponente, 1000 ms para cada resposta). Isso bastava num puzzle avulso, mas
  // não no modo resistência, que encadeia 10 puzzles: o contador da página
  // ("Puzzle 4 / 60") avança ANTES de o tabuleiro carregar a nova posição, e o
  // teste emitia o lance do jogador ainda na posição anterior.
  //
  // Esperar a POSIÇÃO INTEIRA bater, em vez de só "a peça saiu daqui e chegou
  // ali", é o que elimina o falso positivo: num tabuleiro cheio, origem vazia e
  // destino ocupado acontecem por coincidência o tempo todo na posição errada.
  const chess = new Chess(fen);

  const aplicar = (uci: string) =>
    chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
    });

  // Lance de abertura do oponente (move[0]).
  const setup = allMoves[0];
  if (setup && setup.length >= 4) {
    aplicar(setup);
    await waitForPosition(page, chess, orientation, {
      message:
        `O tabuleiro não chegou na posição do puzzle após o lance de abertura ` +
        `do oponente (${setup}). Provavelmente ainda mostra o puzzle anterior — ` +
        `jogar agora usaria a posição errada.`,
    });
  } else {
    await waitForOpponentMove(page);
  }

  await waitForPhase(page, "playing");

  for (let i = 1; i < allMoves.length; i++) {
    const move = allMoves[i];
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);

    if (i % 2 === 1) {
      // Player's move (odd index)
      await makeMove(page, from, to, orientation);
      aplicar(move);

      // If this is the last move, puzzle should complete
      if (i === allMoves.length - 1) {
        return;
      }
    } else {
      // Resposta do oponente (índice par) — esperar a posição, não dormir.
      aplicar(move);
      await waitForPosition(page, chess, orientation, {
        message:
          `O tabuleiro não chegou na posição esperada após a resposta do ` +
          `oponente (${move}). Jogar agora usaria uma posição desatualizada.`,
      });
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
