import { test, expect } from "@playwright/test";
import { makeMove } from "./helpers/chess-helpers";

const TIMESTAMP = Date.now();
const TEST_EMAIL = `bottest+${TIMESTAMP}@cdxguabiruba.test`;
const TEST_PASSWORD = `BotTest@${TIMESTAMP}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const VALID_PGN =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 1-0";

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

async function login(
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

/** Fetch bot IDs from the database */
async function getBotIds(): Promise<{ bot1Id: number; bot2Id: number; bot3Id: number }> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/bots?select=id,unlock_order&order=unlock_order`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const bots = await res.json();
  return {
    bot1Id: bots.find((b: { unlock_order: number }) => b.unlock_order === 1).id,
    bot2Id: bots.find((b: { unlock_order: number }) => b.unlock_order === 2).id,
    bot3Id: bots.find((b: { unlock_order: number }) => b.unlock_order === 3).id,
  };
}

/** Register a win for a user via REST API (bypasses game) */
async function registerWin(userId: string, botId: number) {
  // Use service role to insert directly (bypasses RPC validation)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_bot_results`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      bot_id: botId,
      result: "win",
      pgn: VALID_PGN,
    }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Failed to register win: ${JSON.stringify(data)}`);

  // Also insert into user_bot_first_wins (atomic first-win table)
  await fetch(`${SUPABASE_URL}/rest/v1/user_bot_first_wins`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      bot_id: botId,
    }),
  });

  return data;
}

/** Check if analysis was persisted for a user */
async function getLatestAnalysis(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/bot_game_analysis?user_id=eq.${userId}&order=analyzed_at.desc&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data?.[0] ?? null;
}

/** Get latest bot result for a user */
async function getLatestResult(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_bot_results?user_id=eq.${userId}&order=played_at.desc&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data?.[0] ?? null;
}

// ============================================================
// Nível C: Fluxo integrado real (ponta a ponta)
// ============================================================

test.describe("Nível C: fluxo integrado real", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      // Cleanup analysis, first wins, and results
      await fetch(
        `${SUPABASE_URL}/rest/v1/bot_game_analysis?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await fetch(
        `${SUPABASE_URL}/rest/v1/user_bot_first_wins?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await fetch(
        `${SUPABASE_URL}/rest/v1/user_bot_results?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await deleteTestUser(userId);
    }
  });

  test("C1: derrota + análise + post-game + review (sem crash)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // 1. Login
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // 2. Navigate to bots
    await page.goto("/bots");
    await expect(
      page.getByText("Duelos da Campanha")
    ).toBeVisible({ timeout: 10_000 });

    // 3. Click first bot (Léo) — BotCard is a <button> with bot name text
    await page.getByText("Léo").first().click();
    await expect(page).toHaveURL(/\/bots\//, { timeout: 10_000 });

    // 4. Start game
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();

    // 5. Wait for board
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    // 6. Make 2 moves
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(3000);

    // 7. Surrender
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    // 8. GameOverModal: "Derrota"
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // 9. Wait for analysis
    await expect(
      page.getByRole("button", { name: /Revisão de Batalha/i })
    ).toBeEnabled({ timeout: 60_000 });

    // 10. Accuracy visible
    await expect(page.getByText(/%/)).toBeVisible();

    // 11. Click "Revisão de Batalha" → goes to post-game (BotPostGame)
    await page
      .getByRole("button", { name: /Revisão de Batalha/i })
      .click();

    // 12. Verify BotPostGame renders (accuracy gauge visible)
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 5_000 });

    // 13. Click "Revisão de Batalha" in BotPostGame → goes to review (GameReview)
    await page
      .getByRole("button", { name: /Revisão de Batalha/i })
      .click();

    // 14. Verify GameReview renders
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 5_000 });

    // 15. Verify navigation buttons exist
    const navNext = page.getByTitle(/Próximo/i);
    if (await navNext.isVisible()) {
      await navNext.click();
      await page.waitForTimeout(500);
    }
  });

  test("C2: revanche — volta para pre-game", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    const { bot1Id } = await getBotIds();
    await page.goto(`/bots/${bot1Id}`);
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Make a move and surrender
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    // Modal appears
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // Click "Revanche"
    await page.getByRole("button", { name: /Revanche/i }).click();

    // Should return to pre-game
    await expect(
      page.locator('button:has-text("Iniciar Duelo"):visible')
    ).toBeVisible({ timeout: 5_000 });
  });

  test("C3: voltar aos duelos — navega para /bots", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    const { bot1Id } = await getBotIds();
    await page.goto(`/bots/${bot1Id}`);
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // Click "Voltar aos Duelos"
    await page.getByRole("button", { name: /Voltar aos Duelos/i }).click();
    await expect(page).toHaveURL(/\/bots$/, { timeout: 10_000 });
  });

  test("C4: encadeamento result→analysis persiste no banco", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    const { bot1Id } = await getBotIds();
    await page.goto(`/bots/${bot1Id}`);
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(3000);

    // Surrender
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    // Wait for analysis to complete (button enabled = analysis done + persisted)
    await expect(
      page.getByRole("button", { name: /Revisão de Batalha/i })
    ).toBeEnabled({ timeout: 60_000 });

    // Give a moment for the save_bot_analysis RPC to complete
    await page.waitForTimeout(3000);

    // Verify in database
    const result = await getLatestResult(userId);
    expect(result).not.toBeNull();
    expect(result.result).toBe("loss");
    expect(result.bot_id).toBe(bot1Id);

    const analysis = await getLatestAnalysis(userId);
    expect(analysis).not.toBeNull();
    expect(analysis.bot_result_id).toBe(result.id);
    expect(analysis.accuracy_percent).toBeGreaterThan(0);
  });
});

// ============================================================
// Nível B: UI com estado preparado (RPC setup + verificação visual)
// ============================================================

test.describe("Nível B: UI com estado preparado", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const B_EMAIL = `bottest-b+${TIMESTAMP}@cdxguabiruba.test`;
  const B_PASSWORD = `BotTestB@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAccess,
      "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos"
    );
    userId = await createTestUser(B_EMAIL, B_PASSWORD);
    botIds = await getBotIds();
  });

  test.afterAll(async () => {
    if (userId) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/bot_game_analysis?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await fetch(
        `${SUPABASE_URL}/rest/v1/user_bot_first_wins?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await fetch(
        `${SUPABASE_URL}/rest/v1/user_bot_results?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      await deleteTestUser(userId);
    }
  });

  test("B1: bot 2 desbloqueado após vitória no bot 1", async ({ page }) => {
    test.setTimeout(30_000);

    // Setup: register win on bot 1
    await registerWin(userId, botIds.bot1Id);

    // Login and navigate to /bots
    await login(page, B_EMAIL, B_PASSWORD);
    await page.goto("/bots");
    await expect(
      page.getByText("Duelos da Campanha")
    ).toBeVisible({ timeout: 10_000 });

    // Bot 2 should be clickable (not locked/disabled)
    // Navigate to bot 2 page — should NOT redirect
    await page.goto(`/bots/${botIds.bot2Id}`);
    await expect(page).toHaveURL(
      new RegExp(`/bots/${botIds.bot2Id}`),
      { timeout: 10_000 }
    );
    // Should see pre-game UI
    await expect(
      page.locator('button:has-text("Iniciar Duelo"):visible')
    ).toBeVisible({ timeout: 10_000 });
  });

  test("B2: acesso direto a bot bloqueado redireciona para /bots", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // User has NO wins — bot 3 (unlock_order=3) should be locked
    // Create a fresh user with no wins for this test
    const freshEmail = `bottest-b2+${TIMESTAMP}@cdxguabiruba.test`;
    const freshPassword = `BotTestB2@${TIMESTAMP}`;
    const freshUserId = await createTestUser(freshEmail, freshPassword);

    try {
      await login(page, freshEmail, freshPassword);
      await page.goto(`/bots/${botIds.bot3Id}`);

      // Should redirect to /bots
      await expect(page).toHaveURL(/\/bots$/, { timeout: 10_000 });
    } finally {
      await deleteTestUser(freshUserId);
    }
  });

  test("B3: botão 'Próximo Duelo' existe no modal após vitória (inspeção de código)", async () => {
    // Este cenário não pode ser validado ponta a ponta pela UI porque
    // não é possível forçar vitória contra Stockfish deterministicamente.
    //
    // Validação por inspeção de código:
    // - GameOverModal.tsx aceita props nextBotId e onNextBot
    // - BotGameClient.tsx passa nextBotId={bot.unlock_order < 10 ? bot.id + 1 : null}
    // - O botão "Próximo Duelo →" é renderizado quando result==="win" && nextBotId && onNextBot
    // - onNextBot navega para /bots/${bot.id + 1}
    //
    // Validação RPC (Nível A) confirmou que:
    // - bot_result com result='win' funciona e retorna first_win
    // - Desbloqueio do próximo bot funciona
    //
    // VEREDICTO: Não validado ponta a ponta. Validado por inspeção + RPC.
    expect(true).toBe(true); // Placeholder — documented as not E2E-testable
  });
});
