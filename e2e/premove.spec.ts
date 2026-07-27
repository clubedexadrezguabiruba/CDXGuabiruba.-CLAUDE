import { test, expect } from "@playwright/test";
import { settleAfterLogin } from "./helpers/auth-helpers";
import { makeMove } from "./helpers/chess-helpers";

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

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await settleAfterLogin(page);
}

// ============================================================
// Helper: count blue shapes (premove indicators) on the board
// ============================================================

async function countBlueShapes(page: import("@playwright/test").Page): Promise<number> {
  // Chessground renders autoShapes as SVG circles/rects inside cg-board > svg
  // Blue brush shapes have fill matching the blue color (#3b82f6)
  return page.locator("cg-board svg circle, cg-board svg rect").evaluateAll(
    (els) =>
      els.filter((el) => {
        const fill = el.getAttribute("fill") || el.getAttribute("stroke") || "";
        return fill.toLowerCase().includes("#3b82f6");
      }).length
  );
}

// ============================================================
// Helper: collect console logs matching a pattern
// ============================================================

function collectLogs(
  page: import("@playwright/test").Page,
  prefix: string
): string[] {
  const logs: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes(prefix)) logs.push(text);
  });
  return logs;
}

// ============================================================
// Premove E2E tests
// ============================================================

test.describe("premove: múltiplos premoves contra bot", () => {
  const TIMESTAMP = Date.now();
  const TEST_EMAIL = `premovetest+${TIMESTAMP}@cdxguabiruba.test`;
  const TEST_PASSWORD = `PremoveTest@${TIMESTAMP}`;
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
    if (userId) await deleteTestUser(userId);
  });

  test("enfileirar 3 premoves, ver shapes, e execução automática", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Collect debug logs
    const afterLogs = collectLogs(page, "[PREMOVE:after]");
    const enqueueLogs = collectLogs(page, "[PREMOVE:enqueue]");
    const executeLogs = collectLogs(page, "[PREMOVE:tryExecuteFirst]");

    // 1. Login
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // 2. Navigate to bots
    await page.goto("/bots");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10_000,
    });

    // 3. Click first bot
    //
    // Os cards de bot são <button> com onClick -> router.push (BotGrid.tsx:77 +
    // BotCard.tsx:18), NÃO âncoras. O seletor a[href*="/bots/"] nunca casava e
    // o teste ficava esperando até estourar o timeout de 120s.
    await page.getByText("Léo").first().click();
    await expect(page).toHaveURL(/\/bots\//, { timeout: 10_000 });

    // 4. Start game (white, no time)
    // dois botões (layout mobile + desktop), só um visível — mesmo padrão
    // usado em bots-analysis.spec.ts
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();

    // 5. Wait for board
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500); // Wait for "Sua vez"

    // 6. Play e2e4 (normal move on player's turn)
    await makeMove(page, "e2", "e4", "white");

    // 7. Wait for bot to play (interactive becomes false, then true, then false again)
    // After our move, bot thinks for a bit, plays, and then it's our turn.
    // We need to wait for bot to play and THEN immediately premove during bot's NEXT think.
    await page.waitForTimeout(3000); // Bot responds

    // 8. Play d2d4 (normal move on player's turn)
    await makeMove(page, "d2", "d4", "white");

    // 9. Now bot is thinking — this is our window for premoves.
    //
    // NÃO esperar aqui. Léo é o bot mais fraco (250 elo, profundidade baixa) e
    // responde em poucas centenas de ms; os 500ms que havia antes já eram
    // suficientes para a vez voltar ao jogador, e então os "premoves" abaixo
    // eram registrados como lances normais (interactive=true). Era por isso que
    // a asserção de premove encontrava zero.
    // Emitimos os lances imediatamente, para cair dentro da janela de reflexão.

    // 10. Premove 1: Nb1→c3
    await makeMove(page, "b1", "c3", "white");
    await page.waitForTimeout(300);

    // 11. Premove 2: Bf1→c4 (or d3 — depends on position, try c4)
    await makeMove(page, "f1", "c4", "white");
    await page.waitForTimeout(300);

    // 12. Premove 3: Qd1→f3
    await makeMove(page, "d1", "f3", "white");
    await page.waitForTimeout(300);

    // 13. Verify: at least 1 premove enqueued (afterLogs should have entries)
    // The exact number depends on which premoves were legal in the projected position.
    // But we should have at least 1 [PREMOVE:after] log with interactive=false.
    const premoveAfterLogs = afterLogs.filter((l) =>
      l.includes('"interactive":false')
    );
    console.log(
      `[TEST] after logs with interactive=false: ${premoveAfterLogs.length}`
    );
    console.log(`[TEST] enqueue logs: ${enqueueLogs.length}`);
    console.log(`[TEST] execute logs: ${executeLogs.length}`);

    // Asserção corrigida.
    //
    // Antes exigia >= 1 log [PREMOVE:after] com "interactive":false, e isso é o
    // sinal ERRADO: o caminho de premove passa pelo evento
    // `premovable.events.set` do chessground (BotBoard), não pelo evento
    // `after`. Na prática o filtro dava 0 mesmo quando os premoves
    // funcionavam perfeitamente — enquanto os logs de enqueue/execute
    // mostravam 3 enfileirados e 1 executado.
    //
    // O que de fato prova que a fila de premoves funciona:
    expect(enqueueLogs.length).toBeGreaterThanOrEqual(1);
    expect(executeLogs.length).toBeGreaterThanOrEqual(1);

    // 14. Wait for bot to finish and premove to execute
    await page.waitForTimeout(5000);

    // At least 1 tryExecuteFirst should have fired (proves execution works)
    expect(executeLogs.length).toBeGreaterThanOrEqual(1);

    // 15. Resign to end cleanly
    const resignBtn = page.getByText("Render-se").first();
    if (await resignBtn.isVisible()) {
      await resignBtn.click();
      const confirmBtn = page.getByText("Sim").first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });

  test("right-click limpa fila de premoves", async ({ page }) => {
    test.setTimeout(90_000);

    const clearLogs = collectLogs(page, "[PREMOVE:clearQueue]");

    // 1. Login + navigate + start game
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/bots");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByText("Léo").first().click();  // card é <button>, não <a>
    await expect(page).toHaveURL(/\/bots\//, { timeout: 10_000 });
    // dois botões (layout mobile + desktop), só um visível — mesmo padrão
    // usado em bots-analysis.spec.ts
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    // 2. Play a normal move
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000); // Bot responds

    // 3. Play another normal move
    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(500); // Wait for bot to start thinking

    // 4. Make a premove
    await makeMove(page, "b1", "c3", "white");
    await page.waitForTimeout(300);

    // 5. Right-click on board to clear queue
    const board = page.locator("cg-board");
    const rect = await board.boundingBox();
    if (rect) {
      await page.mouse.click(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        { button: "right" }
      );
    }
    await page.waitForTimeout(300);

    // 6. Verify clearQueue was called
    console.log(`[TEST] clearQueue logs: ${clearLogs.length}`);
    expect(clearLogs.length).toBeGreaterThanOrEqual(1);

    // 7. Resign
    const resignBtn = page.getByText("Render-se").first();
    if (await resignBtn.isVisible()) {
      await resignBtn.click();
      const confirmBtn = page.getByText("Sim").first();
      if (await confirmBtn.isVisible()) await confirmBtn.click();
    }
  });
});
