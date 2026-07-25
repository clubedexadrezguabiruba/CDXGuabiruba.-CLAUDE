import { expect, type Page } from "@playwright/test";

/**
 * Estabiliza a navegação depois do submit de login.
 *
 * Por que existe: a Fase 8 introduziu o gate de criação de avatar em
 * src/app/(main)/dashboard/page.tsx:38 — usuário com `avatar_chosen = false`
 * é redirecionado para /criar-personagem em vez de /dashboard. Todos os
 * helpers de login do e2e esperavam `/dashboard` direto, então TODO teste que
 * cria usuário novo passou a falhar no login desde março de 2026 — ou seja, a
 * suíte e2e não protegia nada durante os 4 meses em que o avatar foi reescrito.
 *
 * Este helper aceita as duas rotas e, se cair no gate, completa a escolha de
 * avatar para seguir o fluxo — que é o que um usuário real faz.
 */
export async function settleAfterLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/(dashboard|criar-personagem)/, {
    timeout: 15_000,
  });

  if (!page.url().includes("criar-personagem")) return;

  // O card de avatar é um <button> que contém <img alt="Masculino"> E
  // <span>Masculino</span>, então seu nome acessível é "Masculino Masculino".
  // Ancorar no <img> evita depender do match por substring do getByRole.
  await page.locator("button").filter({ has: page.getByAltText("Masculino") }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

/** Faz login e estabiliza no dashboard (passando pelo gate de avatar se houver). */
export async function loginAndSettle(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await settleAfterLogin(page);
}
