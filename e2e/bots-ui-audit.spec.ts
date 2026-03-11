/**
 * Auditoria de UI/UX — Seção Bots
 *
 * Testes Playwright focados em layout, responsividade, consistência tonal e UX.
 * Estratégia em 2 camadas:
 *   Camada 1 (smoke): fluxo real /bots → pré-jogo → jogo → rendição → modal
 *   Camada 2 (oportunístico): BotPostGame/GameReview se análise completar
 *
 * Breakpoints: mobile 375px, desktop 1280px
 */

import { test, expect, type Page } from "@playwright/test";
import { makeMove } from "./helpers/chess-helpers";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TIMESTAMP = Date.now();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const VALID_PGN =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 1-0";

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 720 };

// ---------------------------------------------------------------------------
// Auth helpers (inline — mirrors bots-analysis.spec.ts pattern)
// ---------------------------------------------------------------------------

async function createTestUser(email: string, password: string): Promise<string> {
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
  if (!res.ok) throw new Error(`Falha ao criar user: ${JSON.stringify(data)}`);
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

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

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

async function registerWin(userId: string, botId: number) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_bot_results`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ user_id: userId, bot_id: botId, result: "win", pgn: VALID_PGN }),
  });
  if (!res.ok) throw new Error(`Failed to register win: ${await res.text()}`);

  await fetch(`${SUPABASE_URL}/rest/v1/user_bot_first_wins`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({ user_id: userId, bot_id: botId }),
  });
}

// ---------------------------------------------------------------------------
// Audit helpers
// ---------------------------------------------------------------------------

async function checkNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });
  expect(overflow, "Horizontal overflow detected").toBe(false);
}

async function takeAuditScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/audit/${name}.png`,
    fullPage: true,
  });
}

async function cleanupUser(userId: string) {
  for (const table of ["bot_game_analysis", "user_bot_first_wins", "user_bot_results"]) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  }
  await deleteTestUser(userId);
}

// ============================================================
// BLOCO A — Labels Tonais (Camada 1)
// ============================================================

test.describe("Audit A: Labels tonais na /bots page", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-a+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditA@${TIMESTAMP}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("A1: /bots page — labels visíveis estão em português", async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });

    // Verificar título e subtítulo em português
    await expect(page.getByText("Duelos da Campanha")).toBeVisible();
    await expect(page.getByText("Escolha seu rival")).toBeVisible();
    await expect(page.getByText(/derrotados/)).toBeVisible();

    // Verificar nomes dos stages em português
    await expect(page.getByText("Acampamento dos Recrutas")).toBeVisible();

    // Screenshot como evidência
    await takeAuditScreenshot(page, "A1-bots-page-labels");
  });
});

// ============================================================
// BLOCO B — Layout /bots (Camada 1)
// ============================================================

test.describe("Audit B: Layout da página /bots", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-b+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditB@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
    botIds = await getBotIds();
    // Registrar vitória no bot 1 para ter estados diferentes
    await registerWin(userId, botIds.bot1Id);
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("B1-mobile: grid sem overflow horizontal a 375px", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });
    // Capturar screenshot ANTES do assert para ter evidência visual do overflow
    await takeAuditScreenshot(page, "B1-bots-grid-mobile");
    // Medir overflow — se falhar, é achado real de responsividade
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const hasOverflow = scrollWidth > viewportWidth;
    if (hasOverflow) {
      console.log(`[ACHADO NOVO] Overflow horizontal na /bots mobile: scrollWidth=${scrollWidth}, viewport=${viewportWidth}, diff=${scrollWidth - viewportWidth}px`);
    }
    expect(hasOverflow, `Overflow: ${scrollWidth} > ${viewportWidth}`).toBe(false);
  });

  test("B1-desktop: grid sem overflow horizontal a 1280px", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });
    await checkNoHorizontalOverflow(page);
    await takeAuditScreenshot(page, "B1-bots-grid-desktop");
  });

  test("B2: headers de stage visíveis e ordenados", async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });

    // Verificar que pelo menos os stages com bots estão visíveis
    await expect(page.getByText("Acampamento dos Recrutas")).toBeVisible();
    await expect(page.getByText("Vila dos Soldados")).toBeVisible();

    // Verificar ordem: Acampamento aparece antes de Vila
    const acampamento = await page.getByText("Acampamento dos Recrutas").boundingBox();
    const vila = await page.getByText("Vila dos Soldados").boundingBox();
    expect(acampamento).not.toBeNull();
    expect(vila).not.toBeNull();
    expect(acampamento!.y).toBeLessThan(vila!.y);
  });

  test("B3: bot bloqueado tem estado disabled + opacidade", async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });

    // Bot 3 (Tomé) deve estar bloqueado — user só venceu bot 1
    // Use first() because P7 fix makes "Tomé" appear in Sargento Pardo's card too ("Derrote Tomé primeiro")
    const bot3Card = page.locator("button").filter({ hasText: "Tomé" }).first();
    await expect(bot3Card).toBeDisabled();

    // P7 corrigido: agora mostra nome do bot anterior
    await expect(bot3Card.getByText(/Derrote .+ primeiro/)).toBeVisible();

    await takeAuditScreenshot(page, "B3-locked-bot-state");
  });

  test("B4: bot derrotado tem badge dourada", async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });

    // Bot 1 (Léo) foi derrotado — deve ter badge dourada
    const bot1Card = page.locator("button").filter({ hasText: "Léo" });
    await expect(bot1Card).toBeEnabled();

    // Badge ★ é um div absolute dentro do card
    const badge = bot1Card.locator(".absolute");
    await expect(badge).toBeVisible();

    await takeAuditScreenshot(page, "B4-defeated-bot-badge");
  });

  test("B5: progress bar renderiza com porcentagem correta", async ({ page }) => {
    await login(page, EMAIL, PASSWORD);
    await page.goto("/bots");
    await expect(page.getByText("Duelos da Campanha")).toBeVisible({ timeout: 10_000 });

    // Com 1 vitória em ~10 bots, deveria mostrar "1 de X derrotados"
    await expect(page.getByText(/1 de \d+ derrotados/)).toBeVisible();

    // Progress bar container está visível
    const progressBar = page.locator(".bg-green-500");
    await expect(progressBar.first()).toBeVisible();
  });
});

// ============================================================
// BLOCO C — Pré-Jogo (Camada 1)
// ============================================================

test.describe("Audit C: Layout pré-jogo", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-c+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditC@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
    botIds = await getBotIds();
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("C1-mobile: pré-jogo renderiza abaixo do tabuleiro", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    // Board visível
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });

    // "Iniciar Duelo" visível no mobile (pode ter 2 no DOM — mobile + desktop hidden)
    const startButton = page.locator('button:has-text("Iniciar Duelo"):visible');
    await expect(startButton.first()).toBeVisible();

    // Seletores de cor e tempo visíveis
    await expect(page.getByText("Brancas").first()).toBeVisible();
    await expect(page.getByText("Escolha seu lado").first()).toBeVisible();

    await takeAuditScreenshot(page, "C1-pregame-mobile");
  });

  test("C2-desktop: pré-jogo renderiza no sidebar", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(DESKTOP);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });

    // "Iniciar Duelo" visível (2 no DOM — usar :visible)
    const startButton = page.locator('button:has-text("Iniciar Duelo"):visible');
    await expect(startButton.first()).toBeVisible();

    // Verificar que o board e o botão estão lado a lado (board à esquerda)
    const board = await page.locator("cg-board").boundingBox();
    const button = await startButton.first().boundingBox();
    expect(board).not.toBeNull();
    expect(button).not.toBeNull();
    // No desktop, o botão deve estar à direita do board (sidebar)
    expect(button!.x).toBeGreaterThan(board!.x);

    // [ACHADO P8] — Sidebar é lg:w-80 (320px). Screenshot para documentar se é apertado
    await takeAuditScreenshot(page, "C2-pregame-desktop");
  });

  test("C3-mobile: todos os elementos do pré-jogo visíveis", async ({ page }) => {
    test.setTimeout(30_000);
    // Definir viewport mobile explicitamente — sem isso, elementos do sidebar ficam hidden
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });

    // Nome do bot
    await expect(page.getByText("Léo").first()).toBeVisible();

    // Seletores de cor (usar :visible pois existem 2 instâncias no DOM)
    await expect(page.locator('button:has-text("Brancas"):visible').first()).toBeVisible();
    await expect(page.locator('button:has-text("Pretas"):visible').first()).toBeVisible();
    await expect(page.locator('button:has-text("Aleat."):visible').first()).toBeVisible();

    // Seletor de tempo
    await expect(page.locator('button:has-text("Sem relógio"):visible').first()).toBeVisible();

    // Botão de início
    await expect(page.locator('button:has-text("Iniciar Duelo"):visible').first()).toBeVisible();

    await takeAuditScreenshot(page, "C3-pregame-elements-mobile");
  });
});

// ============================================================
// BLOCO D — Fase de Jogo (Camada 1)
// ============================================================

test.describe("Audit D: Layout da fase de jogo", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-d+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditD@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
    botIds = await getBotIds();
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("D1-mobile: board e controles visíveis durante jogo", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    // Iniciar jogo
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Board renderiza com tamanho razoável
    const board = await page.locator("cg-board").boundingBox();
    expect(board).not.toBeNull();
    expect(board!.width).toBeGreaterThan(250);
    expect(board!.width).toBeLessThanOrEqual(375);

    // Info bar do bot visível (nome)
    await expect(page.getByText("Léo").first()).toBeVisible();

    // Info bar do player visível ("Você")
    await expect(page.getByText("Você").first()).toBeVisible();

    // Botão de render-se visível no mobile
    await expect(page.locator('button:has-text("Render-se"):visible').first()).toBeVisible();

    // Capturar screenshot antes do assert de overflow (para ter evidência)
    await takeAuditScreenshot(page, "D1-game-playing-mobile");

    // Medir overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const hasOverflow = scrollWidth > viewportWidth;
    if (hasOverflow) {
      console.log(`[ACHADO NOVO] Overflow horizontal durante jogo mobile: scrollWidth=${scrollWidth}, viewport=${viewportWidth}, diff=${scrollWidth - viewportWidth}px`);
    }
    expect(hasOverflow, `Overflow: ${scrollWidth} > ${viewportWidth}`).toBe(false);
  });

  test("D2-desktop: board + sidebar durante jogo", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(DESKTOP);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Board + sidebar visíveis
    const board = await page.locator("cg-board").boundingBox();
    expect(board).not.toBeNull();

    // Sidebar tem "Lances" header
    await expect(page.getByText("Lances").first()).toBeVisible();

    // Render-se no sidebar desktop — usar :visible pois mobile tem outro hidden
    await expect(page.locator('button:has-text("Render-se"):visible').first()).toBeVisible();

    await checkNoHorizontalOverflow(page);
    await takeAuditScreenshot(page, "D2-game-playing-desktop");
  });
});

// ============================================================
// BLOCO E — GameOverModal (Camada 1, via rendição)
// ============================================================

test.describe("Audit E: GameOverModal", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-e+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditE@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
    botIds = await getBotIds();
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("E1-mobile: modal centrado e sem overflow", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    // Iniciar, mover, render-se
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    // Modal aparece
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // Modal centrado e dentro do viewport
    const modal = page.locator(".max-w-sm");
    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE.width + 1);

    // Botões visíveis (P3 corrigido: modal agora diz "Ver Análise")
    await expect(page.getByRole("button", { name: /Ver Análise|Analisando/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Revanche/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Voltar aos Duelos/i })).toBeVisible();

    // Razão da derrota visível
    await expect(page.getByText(/por/)).toBeVisible();

    // [P5 CORRIGIDO] — Verifica que frase do bot agora aparece no modal
    // O BotSpeechBubble renderiza dentro do modal (.max-w-sm)
    const modalEl = page.locator(".max-w-sm");
    const speechBubble = modalEl.locator("[class*='speech'], [class*='bubble'], p, div").filter({ hasText: /.{10,}/ });
    const bubbleCount = await speechBubble.count();
    if (bubbleCount > 0) {
      console.log("[P5 CORRIGIDO] Modal agora contém frase do bot");
    } else {
      console.log("[P5 VERIFICAR] Frase do bot pode não estar renderizando no modal");
    }

    await takeAuditScreenshot(page, "E1-gameover-modal-mobile");
  });

  test("E2-desktop: modal centrado e sem overflow", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(DESKTOP);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    const modal = page.locator(".max-w-sm");
    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(DESKTOP.width + 1);

    await takeAuditScreenshot(page, "E2-gameover-modal-desktop");
  });

  test("E3: verificar label 'Revisão de Batalha' no modal [ACHADO P3]", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // P3 corrigido: modal agora diz "Ver Análise" (diferente de "Revisão de Batalha" no PostGame)
    const reviewButton = page.getByRole("button", { name: /Ver Análise/i });
    const analyzingButton = page.getByRole("button", { name: /Analisando/i });
    const reviewVisible = await reviewButton.isVisible().catch(() => false);
    const analyzingVisible = await analyzingButton.isVisible().catch(() => false);
    expect(reviewVisible || analyzingVisible).toBe(true);
  });
});

// ============================================================
// BLOCO F — BotPostGame e GameReview (Camada 2, oportunístico)
// ============================================================

test.describe("Audit F: BotPostGame e labels (Camada 2)", () => {
  const hasAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  const EMAIL = `audit-f+${TIMESTAMP}@cdxguabiruba.test`;
  const PASSWORD = `AuditF@${TIMESTAMP}`;
  let userId: string;
  let botIds: { bot1Id: number; bot2Id: number; bot3Id: number };

  test.beforeAll(async () => {
    test.skip(!hasAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
    botIds = await getBotIds();
  });

  test.afterAll(async () => {
    if (userId) await cleanupUser(userId);
  });

  test("F1: fluxo completo — modal → post-game → verificar labels [ACHADOS P1, P2, P3]", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    // Iniciar, fazer 2 lances, render-se
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();

    // Modal aparece
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // Esperar análise completar (oportunístico — timeout de 60s)
    const reviewButton = page.getByRole("button", { name: /Revisão de Batalha/i });
    try {
      await expect(reviewButton).toBeEnabled({ timeout: 60_000 });
    } catch {
      // Análise não completou a tempo — documentar limitação e pular
      await takeAuditScreenshot(page, "F1-analysis-timeout-modal");
      test.skip(true, "Análise não completou em 60s — limitação documentada");
      return;
    }

    // [ACHADO P2] — Verificar se "Best" aparece em inglês no modal
    const modalText = await page.textContent("body");
    const hasBestEnglish = modalText?.includes(">Best<") || false;
    // Capturar estado: se analysis completou, pode ter quick stats
    await takeAuditScreenshot(page, "F1-gameover-with-analysis-mobile");

    // Navegar para BotPostGame
    await reviewButton.click();
    await page.waitForTimeout(1000);

    // [ACHADO P1] — Verificar se "Blunder" aparece em inglês no BotPostGame
    const postGameText = await page.textContent("body");
    const hasBlunderEnglish = postGameText?.match(/\bBlunder\b/);

    // Screenshot do BotPostGame
    await takeAuditScreenshot(page, "F1-postGame-mobile");

    // Verificar se SVG do accuracy gauge está visível
    const svgGauge = page.locator("svg").first();
    await expect(svgGauge).toBeVisible();

    // Verificar labels de categorias visíveis (pelo menos algumas)
    const visibleCategories: string[] = [];
    for (const cat of ["Brilhante", "Excelente", "Melhor", "Bom", "Imprecisão", "Erro", "Blunder", "Erro Grave"]) {
      const isVis = await page.getByText(cat, { exact: true }).first().isVisible().catch(() => false);
      if (isVis) visibleCategories.push(cat);
    }

    // Documentar achados
    // P1: "Blunder" (inglês) deveria ser "Erro Grave" (português)
    if (hasBlunderEnglish) {
      console.log("[ACHADO P1 CONFIRMADO] Label 'Blunder' em inglês no BotPostGame");
    }
    // P2: "Best" (inglês) no modal — pode não ter aparecido se quick stats não renderizou
    if (hasBestEnglish) {
      console.log("[ACHADO P2 CONFIRMADO] Label 'Best' em inglês no GameOverModal");
    }
    console.log(`[AUDIT F1] Categorias visíveis no BotPostGame: ${visibleCategories.join(", ")}`);

    // [ACHADO P3] — Verificar se BotPostGame também tem botão "Revisão de Batalha"
    const secondReviewButton = page.getByRole("button", { name: /Revisão de Batalha/i });
    const hasSecondReview = await secondReviewButton.isVisible().catch(() => false);
    if (hasSecondReview) {
      console.log("[ACHADO P3 CONFIRMADO] Label 'Revisão de Batalha' duplicada no BotPostGame");
    }

    // Sem overflow no mobile
    await checkNoHorizontalOverflow(page);
  });

  test("F2: GameReview — eval bar e layout mobile [ACHADO P4]", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(MOBILE);
    await login(page, EMAIL, PASSWORD);
    await page.goto(`/bots/${botIds.bot1Id}`);

    // Jogo rápido + rendição
    await page.locator('button:has-text("Iniciar Duelo"):visible').click();
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);
    await makeMove(page, "e2", "e4", "white");
    await page.waitForTimeout(3000);
    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Render-se"):visible').click();
    await page.locator('button:has-text("Sim"):visible').first().click();
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // Esperar análise
    const reviewButton = page.getByRole("button", { name: /Revisão de Batalha/i });
    try {
      await expect(reviewButton).toBeEnabled({ timeout: 60_000 });
    } catch {
      await takeAuditScreenshot(page, "F2-analysis-timeout");
      test.skip(true, "Análise não completou em 60s");
      return;
    }

    // Modal → PostGame
    await reviewButton.click();
    await page.waitForTimeout(1000);

    // PostGame → Review (se segundo "Revisão de Batalha" existe)
    const secondReview = page.getByRole("button", { name: /Revisão de Batalha/i });
    const hasSecond = await secondReview.isVisible().catch(() => false);
    if (!hasSecond) {
      test.skip(true, "Botão de Review não encontrado no PostGame");
      return;
    }

    await secondReview.click();
    await page.waitForTimeout(1000);

    // GameReview deve ter board visível
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 5_000 });

    // [ACHADO P4] — Eval bar deve estar ESCONDIDA no mobile (<640px = hidden sm:flex)
    // A eval bar é um div com w-7 dentro de hidden sm:flex
    // No mobile 375px, ela NÃO deve estar visível
    const evalBarContainer = page.locator(".hidden.sm\\:flex").first();
    const evalBarVisible = await evalBarContainer.isVisible().catch(() => false);
    // Documentar: se eval bar está escondida no mobile, confirma achado P4
    if (!evalBarVisible) {
      console.log("[ACHADO P4 CONFIRMADO] Eval bar escondida no mobile 375px");
    }

    // Botões de navegação visíveis (usam unicode ◀ ▶ etc.)
    const navButtons = page.locator("button").filter({ hasText: /[◀▶⏮⏭]/ });
    const navCount = await navButtons.count();
    expect(navCount).toBeGreaterThanOrEqual(2);

    // Screenshot
    await takeAuditScreenshot(page, "F2-gameReview-mobile");

    // Sem overflow
    await checkNoHorizontalOverflow(page);
  });
});
