import { test, expect } from "@playwright/test";
import { makeMove } from "./helpers/chess-helpers";

const TIMESTAMP = Date.now();
const TEST_EMAIL = `bottest+${TIMESTAMP}@cdxguabiruba.test`;
const TEST_PASSWORD = `BotTest@${TIMESTAMP}`;

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
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

// ============================================================
// Fluxo completo: jogar → análise → revisão lance-a-lance
// ============================================================

test.describe("análise pós-jogo e revisão", () => {
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

  test("jogar, abandonar, ver análise e revisar lances", async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Login
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // 2. Navegar para a lista de bots
    await page.goto("/bots");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });

    // 3. Clicar no primeiro bot (unlock_order=1)
    const firstBotCard = page.locator("[data-bot-card]").first();
    // Fallback: if no data-bot-card, click first link that goes to /bots/
    if ((await firstBotCard.count()) === 0) {
      await page.locator('a[href*="/bots/"]').first().click();
    } else {
      await firstBotCard.click();
    }
    await expect(page).toHaveURL(/\/bots\//, { timeout: 10_000 });

    // 4. Clicar "Iniciar Duelo" para iniciar com defaults (brancas, sem tempo)
    await page.getByText("Iniciar Duelo").click();

    // 5. Aguardar tabuleiro interativo
    await expect(page.locator("cg-board")).toBeVisible({ timeout: 10_000 });

    // Aguardar "Sua vez" para garantir que é a vez do jogador
    // (pode estar em texto mobile ou desktop)
    await page.waitForTimeout(1500);

    // 6. Fazer 2 lances como brancas
    await makeMove(page, "e2", "e4", "white");
    // Aguardar resposta do bot
    await page.waitForTimeout(3000);

    await makeMove(page, "d2", "d4", "white");
    await page.waitForTimeout(3000);

    // 7. Render-se
    await page.getByText("Render-se").first().click();
    await page.getByText("Sim").first().click();

    // 8. GameOverModal: verificar "Derrota"
    await expect(page.getByText("Derrota")).toBeVisible({ timeout: 5_000 });

    // 9. Aguardar análise: botão muda de "Analisando..." para "Revisão da Partida"
    await expect(
      page.getByRole("button", { name: /Revisão de Batalha/i })
    ).toBeEnabled({ timeout: 60_000 });

    // 10. Verificar accuracy visível
    await expect(page.getByText(/%/)).toBeVisible();

    // 11. Clicar "Revisão da Partida"
    await page
      .getByRole("button", { name: /Revisão de Batalha/i })
      .click();

    // 12. Verificar GameReview renderiza
    await expect(
      page.getByText(/Revisão de Batalha/i)
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("cg-board")).toBeVisible();

    // Botões de navegação visíveis (4 botões)
    const navButtons = page.locator("button").filter({
      has: page.locator(
        ':text("⏮"), :text("◀"), :text("▶"), :text("⏭")'
      ),
    });
    // Alternativa: verificar que existem botões de nav
    await expect(page.getByTitle(/lance/i).first()).toBeVisible();

    // 13. Clicar próximo lance
    const nextButton = page.getByTitle(/Pr\u00F3ximo/i);
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // 14. Clicar em lance na lista e verificar highlight
    const moveButton = page.locator("button[data-active]").first();
    if ((await moveButton.count()) > 0) {
      await moveButton.click();
      await expect(
        page.locator("button[data-active='true']")
      ).toBeVisible();
    }

    // 15. Clicar "Voltar aos Duelos"
    await page.getByText("Voltar aos Duelos").click();

    // 16. Verificar navegação para /bots
    await expect(page).toHaveURL(/\/bots$/, { timeout: 10_000 });
  });
});
