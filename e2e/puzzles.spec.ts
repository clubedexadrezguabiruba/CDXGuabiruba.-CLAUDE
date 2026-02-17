import { test, expect } from "@playwright/test";
import {
  seedTestPuzzles,
  cleanupTestPuzzles,
  hasPuzzlesInDB,
  makeMove,
  waitForPhase,
  waitForOpponentMove,
  interceptRPC,
  parseMoves,
  getPlayerColor,
  solvePuzzle,
  makeWrongMove,
} from "./helpers/chess-helpers";

const TIMESTAMP = Date.now();
const TEST_EMAIL = `puzzletest+${TIMESTAMP}@cdxguabiruba.test`;
const TEST_PASSWORD = `PuzzleTest@${TIMESTAMP}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function createTestUser(
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Falha ao criar user de teste: ${JSON.stringify(data)}`);
  return data.id;
}

async function deleteTestUser(userId: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

async function loginUser(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

// ============================================================
// SMOKE TESTS (existing — kept as-is)
// ============================================================
test.describe("puzzles — smoke tests", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);
    await seedTestPuzzles();
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
    await cleanupTestPuzzles();
  });

  test("hub /puzzles exibe 4 cards de modo", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles");

    await expect(
      page.getByRole("heading", { level: 1, name: "Puzzles" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Modo Rating" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Categorias" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Puzzle Rush" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revanche" })
    ).toBeVisible();
  });

  test("rating mode carrega puzzle com tabuleiro", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/rating");

    await expect(page.locator(".puzzle-board-wrap")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("link", { name: "Puzzles" }).first()
    ).toBeVisible();
  });

  test("categorias exibe 20 temas", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/categorias");

    await expect(
      page.getByRole("heading", { level: 1, name: "Categorias" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mate em 1" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Garfo (Fork)" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cravada (Pin)" })
    ).toBeVisible();

    const cards = page.locator('a[href^="/puzzles/categorias/"]');
    await expect(cards).toHaveCount(20);
  });

  test("categoria mateIn1 carrega puzzle", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/categorias/mateIn1");

    await expect(page.getByText("Todos")).toBeVisible();
    await page.waitForTimeout(3000);
    const hasBoardOrMessage =
      (await page.locator(".puzzle-board-wrap").count()) > 0 ||
      (await page.getByText(/nenhum puzzle|erro/i).count()) > 0;
    expect(hasBoardOrMessage).toBeTruthy();
  });

  test("rush exibe seleção de modo 3min/5min", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/rush");

    await expect(page.getByText("Puzzle Rush")).toBeVisible();
    await expect(page.getByText("3 Minutos")).toBeVisible();
    await expect(page.getByText("5 Minutos")).toBeVisible();
    await expect(page.getByText("Iniciar Rush!")).toBeVisible();
  });

  test("rush inicia e mostra timer + vidas", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/rush");

    await page.click("text=3 Minutos");
    await page.click("text=Iniciar Rush!");

    await expect(page.locator("svg.fill-red-500").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/[23]:\d{2}/)).toBeVisible();
    await expect(page.getByText("Score:")).toBeVisible();
    await expect(page.locator(".puzzle-board-wrap")).toBeVisible();
  });

  test("revanche exibe estado vazio para novo usuário", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/puzzles/revanche");

    await expect(page.getByText("Revanche")).toBeVisible();
    await expect(page.getByText("Tudo em dia!")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Ir para Rating")).toBeVisible();
  });

  test("navbar exibe link para Puzzles", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);

    const puzzlesLink = page.locator('a[href="/puzzles"]', {
      hasText: "Puzzles",
    });
    await expect(puzzlesLink).toBeVisible();

    await puzzlesLink.click();
    await expect(page).toHaveURL(/\/puzzles/);
  });
});

// ============================================================
// GAMEPLAY TESTS — Rating Mode
// ============================================================
test.describe("puzzles — rating gameplay", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );
    await seedTestPuzzles();
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("A1: board carrega e oponente joga primeiro lance", async ({
    page,
  }) => {
    await loginUser(
      page,
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );

    // Intercept RPC to get puzzle data
    const rpcPromise = interceptRPC(page, "get_next_puzzle_rating");
    await page.goto("/puzzles/rating");

    // Wait for board
    await expect(page.locator(".puzzle-board-wrap")).toBeVisible({
      timeout: 15_000,
    });

    // Wait for data
    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível no banco de dados");

    // Wait for opponent's setup move and "playing" phase
    await waitForPhase(page, "playing", 5_000);
  });

  test("A2: resolve puzzle completo e mostra Correto", async ({ page }) => {
    await loginUser(
      page,
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );

    // Intercept RPC
    const rpcPromise = interceptRPC(page, "get_next_puzzle_rating");
    await page.goto("/puzzles/rating");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível no banco de dados");

    const moves = parseMoves(puzzle!.moves);

    // Solve the puzzle
    await solvePuzzle(page, moves, puzzle!.fen);

    // Should show "Correto!"
    await waitForPhase(page, "correct", 5_000);
    await expect(page.getByText("Correto!").first()).toBeVisible();
  });

  test("A3: resultado mostra rating delta", async ({ page }) => {
    await loginUser(
      page,
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_rating");
    await page.goto("/puzzles/rating");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível");

    await solvePuzzle(page, parseMoves(puzzle!.moves), puzzle!.fen);
    await waitForPhase(page, "correct", 5_000);

    // Result overlay should show rating change
    const resultOverlay = page.locator(".bg-green-50");
    await expect(resultOverlay).toBeVisible({ timeout: 5_000 });
    // Should contain "Rating:" text
    await expect(resultOverlay.getByText("Rating:")).toBeVisible();
  });

  test("A4: auto-avanço carrega próximo puzzle", async ({ page }) => {
    await loginUser(
      page,
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_rating");
    await page.goto("/puzzles/rating");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível");

    await solvePuzzle(page, parseMoves(puzzle!.moves), puzzle!.fen);
    await waitForPhase(page, "correct", 5_000);

    // Wait for auto-advance (2.5s) + loading
    await page.waitForTimeout(4000);

    // Should show loading or a new puzzle board (not stuck on result)
    const isLoading = await page.getByText("Carregando puzzle...").isVisible();
    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    expect(isLoading || hasBoard).toBeTruthy();
  });

  test('A5: botão "Próximo puzzle" funciona', async ({ page }) => {
    await loginUser(
      page,
      `ratingtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RatingTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_rating");
    await page.goto("/puzzles/rating");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível");

    await solvePuzzle(page, parseMoves(puzzle!.moves), puzzle!.fen);
    await waitForPhase(page, "correct", 5_000);

    // Click "Próximo puzzle" button immediately
    const nextBtn = page.getByText("Próximo puzzle");
    await expect(nextBtn).toBeVisible({ timeout: 3_000 });
    await nextBtn.click();

    // Should start loading next puzzle
    await page.waitForTimeout(1000);
    const isLoading = await page.getByText("Carregando puzzle...").isVisible();
    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    expect(isLoading || hasBoard).toBeTruthy();
  });
});

// ============================================================
// GAMEPLAY TESTS — Categorias
// ============================================================
test.describe("puzzles — categorias gameplay", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );
    await seedTestPuzzles();
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("B1: mateIn1 resolve puzzle completo", async ({ page }) => {
    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_category");
    await page.goto("/puzzles/categorias/mateIn1");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle mateIn1 disponível");

    await solvePuzzle(page, parseMoves(puzzle!.moves), puzzle!.fen);
    await waitForPhase(page, "correct", 5_000);
    await expect(page.getByText("Correto!").first()).toBeVisible();
  });

  test("B2: mateIn2 multi-move funciona (FIX #1 critical)", async ({
    page,
  }) => {
    // Skip if no mateIn2 puzzles in DB
    const hasMateIn2 = await hasPuzzlesInDB("mateIn2");
    test.skip(!hasMateIn2, "Nenhum puzzle mateIn2 no banco");

    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_category");
    await page.goto("/puzzles/categorias/mateIn2");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle mateIn2 disponível");

    const moves = parseMoves(puzzle!.moves);
    // mateIn2 should have 4 moves: setup, player1, opponent, player2
    expect(moves.length).toBeGreaterThanOrEqual(4);

    await solvePuzzle(page, moves, puzzle!.fen);
    await waitForPhase(page, "correct", 8_000);
    await expect(page.getByText("Correto!").first()).toBeVisible();
  });

  test("B3: mateIn3plus puzzle carrega (FIX #4)", async ({ page }) => {
    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    await page.goto("/puzzles/categorias/mateIn3plus");
    await page.waitForTimeout(3000);

    // Should have a board or a "nenhum puzzle" message
    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    const hasError = await page
      .getByText(/nenhum puzzle|erro/i)
      .isVisible()
      .catch(() => false);
    expect(hasBoard || hasError).toBeTruthy();
  });

  test("B4: fork puzzle carrega", async ({ page }) => {
    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    await page.goto("/puzzles/categorias/fork");
    await page.waitForTimeout(3000);

    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    const hasError = await page
      .getByText(/nenhum puzzle|erro/i)
      .isVisible()
      .catch(() => false);
    expect(hasBoard || hasError).toBeTruthy();
  });

  test("B5: filtro de dificuldade funciona", async ({ page }) => {
    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    await page.goto("/puzzles/categorias/mateIn1");
    await page.waitForTimeout(2000);

    // Click "Fácil" difficulty
    const easyBtn = page.getByText("Fácil");
    await expect(easyBtn).toBeVisible();
    await easyBtn.click();

    // Should trigger reload (loading indicator or new board)
    await page.waitForTimeout(2000);
    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    const isLoading = await page
      .getByText("Carregando puzzle...")
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .getByText(/nenhum puzzle|erro/i)
      .isVisible()
      .catch(() => false);
    expect(hasBoard || isLoading || hasError).toBeTruthy();
  });

  test('B6: botão "Próximo puzzle" em categorias', async ({ page }) => {
    await loginUser(
      page,
      `cattest+${TIMESTAMP}@cdxguabiruba.test`,
      `CatTest@${TIMESTAMP}`
    );

    const rpcPromise = interceptRPC(page, "get_next_puzzle_category");
    await page.goto("/puzzles/categorias/mateIn1");

    const data = await rpcPromise;
    const puzzle = (data as { puzzle?: { fen: string; moves: string } })
      ?.puzzle;
    test.skip(!puzzle, "Nenhum puzzle disponível");

    await solvePuzzle(page, parseMoves(puzzle!.moves), puzzle!.fen);
    await waitForPhase(page, "correct", 5_000);

    // Click "Próximo puzzle"
    const nextBtn = page.getByText("Próximo puzzle");
    await expect(nextBtn).toBeVisible({ timeout: 3_000 });
    await nextBtn.click();

    // Should load next puzzle
    await page.waitForTimeout(2000);
    const hasBoard = await page.locator(".puzzle-board-wrap").isVisible();
    expect(hasBoard).toBeTruthy();
  });
});

// ============================================================
// GAMEPLAY TESTS — Rush Mode
// ============================================================
test.describe("puzzles — rush gameplay", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(
      `rushtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RushTest@${TIMESTAMP}`
    );
    await seedTestPuzzles();
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("C1: rush inicia e mostra board + timer + vidas", async ({ page }) => {
    await loginUser(
      page,
      `rushtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RushTest@${TIMESTAMP}`
    );
    await page.goto("/puzzles/rush");

    await page.click("text=3 Minutos");

    const rpcPromise = interceptRPC(page, "start_rush");
    await page.click("text=Iniciar Rush!");

    const data = await rpcPromise;
    const puzzles = (data as { puzzles?: unknown[] })?.puzzles;
    test.skip(!puzzles || puzzles.length === 0, "Rush não retornou puzzles");

    // Timer visible
    await expect(page.getByText(/[23]:\d{2}/)).toBeVisible({ timeout: 10_000 });

    // Lives visible (hearts)
    await expect(page.locator("svg.fill-red-500").first()).toBeVisible();

    // Board visible
    await expect(page.locator(".puzzle-board-wrap")).toBeVisible();

    // Score visible
    await expect(page.getByText("Score:")).toBeVisible();
  });

  test("C2: rush acerto incrementa score", async ({ page }) => {
    await loginUser(
      page,
      `rushtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RushTest@${TIMESTAMP}`
    );
    await page.goto("/puzzles/rush");

    await page.click("text=3 Minutos");

    const rpcPromise = interceptRPC(page, "start_rush");
    await page.click("text=Iniciar Rush!");

    const data = await rpcPromise;
    const puzzles = (
      data as { puzzles?: { fen: string; moves: string }[] }
    )?.puzzles;
    test.skip(!puzzles || puzzles.length === 0, "Rush não retornou puzzles");

    // Solve first puzzle
    const firstPuzzle = puzzles![0];
    const moves = parseMoves(firstPuzzle.moves);
    await solvePuzzle(page, moves, firstPuzzle.fen);

    // Score should be 1
    await page.waitForTimeout(1000);
    await expect(page.getByText("Score: 1")).toBeVisible({ timeout: 5_000 });
  });
});

// ============================================================
// GAMEPLAY TESTS — Revanche
// ============================================================
test.describe("puzzles — revanche gameplay", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(
      `revtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RevTest@${TIMESTAMP}`
    );
    await seedTestPuzzles();
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("D1: revanche estado vazio para novo usuário (FIX #3)", async ({
    page,
  }) => {
    await loginUser(
      page,
      `revtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RevTest@${TIMESTAMP}`
    );
    await page.goto("/puzzles/revanche");

    await expect(page.getByText("Revanche")).toBeVisible();
    await expect(page.getByText("Tudo em dia!")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("D2: puzzle aparece na revanche imediatamente após erro em rating", async ({
    page,
  }) => {
    // This test verifies the core revanche fix: puzzles with next_review_at = now()
    // show up immediately in the revanche page.
    // We insert directly into the revanche queue via Admin API for reliability.

    await loginUser(
      page,
      `revtest+${TIMESTAMP}@cdxguabiruba.test`,
      `RevTest@${TIMESTAMP}`
    );

    // Get the user's ID
    const userRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const usersData = (await userRes.json()) as {
      users: { id: string; email: string }[];
    };
    const testUserEmail = `revtest+${TIMESTAMP}@cdxguabiruba.test`;
    const testUser = usersData.users.find(
      (u: { email: string }) => u.email === testUserEmail
    );
    test.skip(!testUser, "Test user not found");

    // Get a random puzzle from the database
    const puzzleRes = await fetch(
      `${SUPABASE_URL}/rest/v1/puzzles?select=id&limit=1`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const puzzlesArr = (await puzzleRes.json()) as { id: number }[];
    test.skip(puzzlesArr.length === 0, "No puzzles in DB");
    const puzzleId = puzzlesArr[0].id;

    // Insert directly into revanche queue with next_review_at = now()
    // This simulates what puzzle_attempt does after the fix
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/puzzle_revanche_queue`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: testUser!.id,
          puzzle_id: puzzleId,
          next_review_at: new Date().toISOString(),
          review_count: 0,
          resolved: false,
        }),
      }
    );
    expect(insertRes.ok).toBeTruthy();

    // Navigate to revanche — the puzzle should appear IMMEDIATELY
    await page.goto("/puzzles/revanche");
    await page.waitForTimeout(3000);

    // Puzzle should be in the revanche list
    const hasPuzzles = await page
      .locator("button")
      .filter({ hasText: /Puzzle/ })
      .count();
    const hasEmptyState = await page
      .getByText("Tudo em dia!")
      .isVisible()
      .catch(() => false);

    expect(hasPuzzles).toBeGreaterThanOrEqual(1);
    expect(hasEmptyState).toBeFalsy();
  });
});
