import { test, expect, type Page, type Locator } from "@playwright/test";
import { makeMove } from "./helpers/chess-helpers";
import {
  createTestUser,
  deleteTestUser,
  loginUser,
  cleanupUserProgress,
  forceCompleteLessons,
  hasAdminAccess,
  RECRUTA_LESSONS,
} from "./helpers/lesson-helpers";

// Credenciais únicas por run
const TS = Date.now();
const TEST_EMAIL = `aulas+${TS}@cdxguabiruba.test`;
const TEST_PASSWORD = `Aulas@${TS}`;

// ============================================================
// Navigation & panel helpers
//
// Desktop viewport (1280x720) has two layouts:
//   1. Full-width text (no board): single card with buttons
//   2. Board+sidebar: mobile text (lg:hidden) + desktop sidebar (hidden lg:flex)
//
// On desktop, text content lives in the sidebar's white card.
// We target that card for text assertions to avoid hidden mobile elements.
// ============================================================

/** Desktop sidebar white content card — visible on lg+ when board is shown */
function desktopPanel(page: Page): Locator {
  return page.locator(".rounded-xl.bg-zinc-700 .bg-white");
}

async function clickNext(page: Page): Promise<void> {
  // Desktop board layout: ▶ button with title
  const desktop = page.locator('button[title="Próxima seção"]');
  if (await desktop.isVisible().catch(() => false)) {
    await desktop.click();
    return;
  }
  // Full-width text layout: "PRÓXIMA →"
  await page.locator('button:has-text("PRÓXIMA")').click();
}

async function clickPrev(page: Page): Promise<void> {
  const desktop = page.locator('button[title="Seção anterior"]');
  if (await desktop.isVisible().catch(() => false)) {
    await desktop.click();
    return;
  }
  await page.locator('button:has-text("ANTERIOR")').click();
}

/** Navigate from section 1 to the first exercise (section 4) in lesson 1 */
async function navigateToExercise1(page: Page): Promise<void> {
  await clickNext(page); // section 1 → 2
  await page.waitForTimeout(400);
  await clickNext(page); // section 2 → 3
  await page.waitForTimeout(400);
  await clickNext(page); // section 3 → 4 (exercise 1)
  await expect(page.locator(".puzzle-board-wrap")).toBeVisible({
    timeout: 5_000,
  });
}

// ============================================================
// Grupo A — Acesso e Mapa
// ============================================================

test("A1: anônimo em /aulas redireciona para /login", async ({ page }) => {
  await page.goto("/aulas");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("aulas — smoke tests", () => {
  const admin = hasAdminAccess();
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  test("A2: mapa exibe trilha Recruta com aulas", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas");

    await expect(page.getByRole("heading", { name: "Aulas" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Recruta")).toBeVisible();
    await expect(page.getByText("O Tabuleiro e as Casas")).toBeVisible();
    await expect(page.locator('a[href="/aulas/1"]')).toBeVisible();
  });

  test("A3: aula 2 bloqueada para novo usuário", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas");
    await expect(page.getByRole("heading", { name: "Aulas" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('a[href="/aulas/3"]')).toHaveCount(0);
  });

  // ============================================================
  // Grupo B — Navegação na Aula
  // ============================================================

  test("B1: carrega aula 1 e exibe seção texto", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");

    await expect(page.getByText("O Tabuleiro e as Casas")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("← Voltar ao mapa")).toBeVisible();
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible();
  });

  test("B2: navegar entre seções com botões", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible({
      timeout: 10_000,
    });

    // Seção 1 → 2 (texto com board)
    await clickNext(page);
    await expect(page.locator(".puzzle-board-wrap")).toBeVisible({
      timeout: 5_000,
    });

    // Desktop panel mostra título da seção 2
    const panel = desktopPanel(page);
    await expect(panel.getByText("Colunas e Fileiras")).toBeVisible();

    // Volta pra seção 1 (full-width text, sem board)
    await clickPrev(page);
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible();
  });

  test("B3: aula bloqueada redireciona para /aulas", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/3");
    await expect(page).toHaveURL(/\/aulas$/, { timeout: 10_000 });
  });

  // ============================================================
  // Grupo C — Exercícios Interativos (CORE)
  // ============================================================

  test("C1: exercício correto → feedback + auto-avanço", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible({
      timeout: 10_000,
    });

    await navigateToExercise1(page);

    // Desktop panel mostra instrução
    const panel = desktopPanel(page);
    await expect(
      panel.getByText("Mova o peão branco para a casa e4")
    ).toBeVisible({ timeout: 5_000 });

    // Lance correto: e2→e4
    await makeMove(page, "e2", "e4", "white");

    // Auto-advance: painel mostra instrução do exercício 2
    await expect(
      panel.getByText("Mova o peão branco para a casa d4")
    ).toBeVisible({ timeout: 8_000 });
  });

  test("C2: exercício errado → feedback + retry → acerto", async ({
    page,
  }) => {
    await cleanupUserProgress(userId);
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible({
      timeout: 10_000,
    });

    await navigateToExercise1(page);

    const panel = desktopPanel(page);

    // Lance errado: a2→a3
    await makeMove(page, "a2", "a3", "white");

    // Feedback de erro no painel desktop
    await expect(panel.getByText("Tente novamente!")).toBeVisible({
      timeout: 5_000,
    });

    // Snap-back (800ms)
    await page.waitForTimeout(1500);

    // Lance correto: e2→e4
    await makeMove(page, "e2", "e4", "white");

    // Avança para exercício 2
    await expect(
      panel.getByText("Mova o peão branco para a casa d4")
    ).toBeVisible({ timeout: 8_000 });
  });

  test("C3: completar aula inteira → banner + estrelas + XP", async ({
    page,
  }) => {
    await cleanupUserProgress(userId);
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible({
      timeout: 10_000,
    });

    await navigateToExercise1(page);

    const panel = desktopPanel(page);

    // Exercício 1: e2→e4
    await makeMove(page, "e2", "e4", "white");
    await expect(
      panel.getByText("Mova o peão branco para a casa d4")
    ).toBeVisible({ timeout: 8_000 });

    // Exercício 2: d2→d4
    await makeMove(page, "d2", "d4", "white");
    await expect(
      panel.getByText("Mova o cavalo para a casa f3")
    ).toBeVisible({ timeout: 8_000 });

    // Exercício 3: g1→f3 (último!)
    await makeMove(page, "g1", "f3", "white");

    // Banner de conclusão (renderizado fora do panel)
    const banner = page.locator("div.border-green-300", {
      hasText: "Aula Completa!",
    });
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner.getByText("★").first()).toBeVisible();

    // O locator /\+\d+ XP/ solto era ambíguo (strict mode violation): dois
    // elementos casam nesta tela — o banner da aula (LessonViewer.tsx:884) e o
    // toast da missão. Escopamos ao banner.
    //
    // NÃO assertar XP positivo aqui: aulas não concedem XP direto, por design
    // (Visao_do_Produto — XP só via missões e conquistas), então o banner
    // legitimamente mostra "+0 XP". O XP real vem do toast da missão
    // complete_1_lesson, que só aparece na PRIMEIRA aula do dia — e este spec
    // compartilha um usuário entre 14 testes, então exigir XP positivo tornaria
    // o teste dependente de ordem.
    await expect(banner.getByText(/\+\d+ XP/)).toBeVisible({ timeout: 10_000 });

    // Voltar ao mapa (exact para distinguir do header "← Voltar ao mapa")
    const voltarBtn = page.getByRole("link", {
      name: "Voltar ao Mapa",
      exact: true,
    });
    await expect(voltarBtn).toBeVisible();
    await voltarBtn.click();
    await expect(page).toHaveURL(/\/aulas$/, { timeout: 10_000 });
  });

  // ============================================================
  // Grupo D — Mapa pós-conclusão
  // ============================================================

  test("D1: aula completa mostra estrelas no mapa + desbloqueio aula 2", async ({
    page,
  }) => {
    await cleanupUserProgress(userId);
    await forceCompleteLessons(userId, [RECRUTA_LESSONS[0]]);

    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas");
    await expect(page.getByRole("heading", { name: "Aulas" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("★").first()).toBeVisible();
    await expect(page.locator('a[href="/aulas/3"]')).toBeVisible();
  });

  test("D2: aula 2 acessível após completar aula 1", async ({ page }) => {
    await cleanupUserProgress(userId);
    await forceCompleteLessons(userId, [RECRUTA_LESSONS[0]]);

    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/3");

    await expect(page.locator("h1").getByText("O Peão")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("← Voltar ao mapa")).toBeVisible();
  });

  // ============================================================
  // Grupo E — Dica
  // ============================================================

  test("E1: botão dica revela texto e aviso de estrelas", async ({ page }) => {
    await cleanupUserProgress(userId);
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.getByText("O Tabuleiro de Xadrez")).toBeVisible({
      timeout: 10_000,
    });

    await navigateToExercise1(page);

    const panel = desktopPanel(page);

    // Botão de dica: desktop tem title="Ver dica"
    const hintBtn = page.locator('button[title="Ver dica"]');
    await expect(hintBtn).toBeVisible({ timeout: 3_000 });
    await hintBtn.click();

    // Texto da dica no painel desktop
    await expect(
      panel.getByText("O peão da coluna e pode avançar duas casas")
    ).toBeVisible({ timeout: 3_000 });

    // Aviso de limitação
    await expect(
      panel.getByText("Usar dica limita a 2 estrelas")
    ).toBeVisible();
  });

  // ============================================================
  // Grupo F — Review Gate
  // ============================================================

  test("F1: review gate bloqueado sem completar trilha", async ({ page }) => {
    await cleanupUserProgress(userId);
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/review/recruta");
    await expect(page).toHaveURL(/\/aulas$/, { timeout: 10_000 });
  });

  test("F2: review gate carrega após completar trilha", async ({ page }) => {
    await cleanupUserProgress(userId);
    await forceCompleteLessons(userId, RECRUTA_LESSONS);

    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/aulas/review/recruta");

    await expect(page.getByText("Desafio Final")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Questão 1 de 10")).toBeVisible();
    await expect(page.locator(".puzzle-board-wrap")).toBeVisible();
  });
});
