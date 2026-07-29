import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, promoteToTeacher } from "./helpers/class-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * T0.10 — a página de teste de tamanhos do avatar v4 renderiza e é trancada.
 *
 * Bate no Supabase de PRODUÇÃO como toda esta suíte: cria e apaga um usuário
 * real. Rodar com intenção, nunca em CI.
 */
const SENHA = "TesteDevAvatar!2026";

function email(prefixo: string) {
  return `${prefixo}-${Date.now()}@teste-recruta64.local`;
}

test.describe("Página de teste do avatar v4", () => {
  test("aluno não enxerga a rota", async ({ page }) => {
    const e = email("devavatar-aluno");
    const id = await createTestUser(e, SENHA);
    try {
      await loginAndSettle(page, e, SENHA);
      const resposta = await page.goto("/dev/avatar");
      expect(resposta?.status()).toBe(404);
    } finally {
      await deleteTestUser(id);
    }
  });

  test("professor vê o boneco nos 4 tamanhos, e ele reage aos controles", async ({ page }) => {
    const e = email("devavatar-prof");
    const id = await createTestUser(e, SENHA);
    try {
      await promoteToTeacher(id);
      await loginAndSettle(page, e, SENHA);
      await page.goto("/dev/avatar");

      await expect(page.locator("h1", { hasText: "Teste de tamanhos" })).toBeVisible();

      // Um SVG do boneco por tamanho declarado.
      const bonecos = page.locator("svg.est");
      await expect(bonecos).toHaveCount(4);

      // O uniforme entra como camada nova sobre o traje da base.
      const antes = await bonecos.first().locator("path").count();
      await page.locator("select").nth(1).selectOption("general");
      await expect
        .poll(async () => bonecos.first().locator("path").count())
        .toBeGreaterThan(antes);

      // O pet é um SVG à parte, fora do character-root.
      await page.locator('input[type="checkbox"]').first().check();
      await expect(page.locator("svg.pet-peao").first()).toBeVisible();

      await page.screenshot({ path: ".scratch/pagina-avatar-v4.png", fullPage: true });

      // Pilha completa: fundo + boneco + uniforme + chapéu + pet + moldura.
      await page.locator("select").nth(0).selectOption("coroa");
      await page.locator("select").nth(2).selectOption("/items/bg/castelo.png");
      await page.locator("select").nth(3).selectOption("legendary");
      await page.locator('input[type="checkbox"]').nth(1).check();
      await expect(page.locator("svg.est")).toHaveCount(5); // 4 tamanhos + a lupa
      await page.screenshot({ path: ".scratch/pagina-avatar-v4-completo.png", fullPage: true });
    } finally {
      await deleteTestUser(id);
    }
  });
});
