import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, promoteToTeacher } from "./helpers/class-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * A página de aprovação do boneco base renderiza e é trancada.
 *
 * Sucede o teste da `/dev/avatar`, que morreu com o boneco de protótipo. O que
 * ele garantia e continua valendo é a TRANCA: rota de desenvolvimento não pode
 * responder para aluno, e responde 404 em vez de redirect para não dar pista de
 * que existe. O resto do teste antigo apontava para controles do boneco velho.
 *
 * Bate no Supabase de PRODUÇÃO como toda esta suíte: cria e apaga um usuário
 * real. Rodar com intenção, nunca em CI.
 */
const SENHA = "TesteDevAvatar!2026";
const ROTA = "/dev/avatar-base";

function email(prefixo: string) {
  return `${prefixo}-${Date.now()}@teste-recruta64.local`;
}

test.describe("Página de aprovação do boneco base", () => {
  test("aluno não enxerga a rota", async ({ page }) => {
    const e = email("devavatar-aluno");
    const id = await createTestUser(e, SENHA);
    try {
      await loginAndSettle(page, e, SENHA);
      const resposta = await page.goto(ROTA);
      expect(resposta?.status()).toBe(404);
    } finally {
      await deleteTestUser(id);
    }
  });

  test("professor vê o boneco nos 8 tons, e a cor troca pela variável", async ({ page }) => {
    const e = email("devavatar-prof");
    const id = await createTestUser(e, SENHA);
    try {
      await promoteToTeacher(id);
      await loginAndSettle(page, e, SENHA);
      await page.goto(ROTA);

      await expect(page.locator("h1", { hasText: "Boneco base" })).toBeVisible();

      // A folha de <symbol> é buscada em runtime. Se o fetch falhar, a página
      // mostra o erro em vez do desenho — e nenhum <use> existe.
      const usos = page.locator('use[href="#avatar-base-neutro"]');
      await expect(usos).toHaveCount(20); // 4 tamanhos + 8 tons + 8 a 56 px

      // O recolorir é uma custom property: trocar o tom muda a variável, e o
      // desenho é o mesmo arquivo. É a premissa inteira do v4 num assert.
      const primeiro = usos.first().locator("xpath=..");
      const antes = await primeiro.getAttribute("style");
      await page.locator("select").first().selectOption("7");
      await expect.poll(async () => primeiro.getAttribute("style")).not.toBe(antes);

      await page.screenshot({ path: ".scratch/pagina-avatar-base.png", fullPage: true });
    } finally {
      await deleteTestUser(id);
    }
  });
});
