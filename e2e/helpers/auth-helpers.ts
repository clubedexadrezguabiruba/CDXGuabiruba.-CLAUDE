import { expect, type Page } from "@playwright/test";

/**
 * Estabiliza a navegação depois do submit de login.
 *
 * Por que existe: a Fase 8 introduziu o gate de criação de avatar em
 * src/app/(main)/dashboard/page.tsx:37 — usuário com `avatar_chosen = false`
 * é redirecionado para /criar-personagem em vez de /dashboard. Todos os
 * helpers de login do e2e esperavam `/dashboard` direto, então TODO teste que
 * cria usuário novo passou a falhar no login desde março de 2026 — ou seja, a
 * suíte e2e não protegia nada durante os 4 meses em que o avatar foi reescrito.
 *
 * Este helper aceita as duas rotas e, se cair no gate, completa a escolha de
 * avatar para seguir o fluxo — que é o que um usuário real faz.
 *
 * ---
 *
 * NUNCA decidir por URL aqui. O redirect do gate é do SERVIDOR e chega depois:
 * a sequência real, lida do trace do Playwright, é
 *
 *     POST /login → auth/v1/token 200 → GET /dashboard?_rsc → GET /criar-personagem?_rsc
 *
 * A versão anterior fazia `if (!page.url().includes("criar-personagem")) return;`
 * e caía justamente na janela em que a URL ainda era /dashboard. Ela retornava
 * "sucesso" sem clicar em nada, o teste seguia achando estar no dashboard, e a
 * falha aparecia muito depois — em phase8-avatar, procurando "Baús" por 30 s numa
 * página que era o gate de avatar. No trace não havia nenhuma chamada a
 * `update_avatar_base`, o que provou que o helper nunca tocou o gate.
 *
 * A espera correta é por CONTEÚDO RENDERIZADO: o h1 do gate ("Criação do
 * Recruta", CriarPersonagemClient.tsx:33) ou o h1 do dashboard
 * ("Quartel-General", dashboard/page.tsx:61). Só um dos dois existe por vez, e
 * ambos vêm no HTML do servidor — não dependem dos RPCs do dashboard.
 *
 * Esperar pela URL não funciona, nem com janela de tolerância: o redirect do
 * gate é uma navegação RSC e a URL não muda de forma observável a tempo.
 *
 * Localizador de CSS, NÃO getByRole: `getByRole("heading", …)` reconstrói a
 * árvore de acessibilidade da página inteira a cada poll. Num dashboard com
 * missões, streak, baús, conquistas e ranking isso custa caro, e o custo se
 * paga em todo login da suíte. Medido: a versão com getByRole somou ~13 min ao
 * run completo e estourou o orçamento de 30 s de 43 testes.
 */
export async function settleAfterLogin(page: Page): Promise<void> {
  const gateHeading = page.locator("h1", { hasText: "Criação do Recruta" });
  const dashboardHeading = page.locator("h1", { hasText: "Quartel-General" });

  await expect(gateHeading.or(dashboardHeading)).toBeVisible({ timeout: 20_000 });

  // Já no dashboard: usuário com avatar_chosen = true.
  if (!(await gateHeading.isVisible())) return;

  // O card de avatar é um <button> que contém <img alt="Masculino"> E
  // <span>Masculino</span>, então seu nome acessível é "Masculino Masculino".
  // Ancorar no <img> evita depender do match por substring do getByRole.
  const card = page.locator("button").filter({ has: page.getByAltText("Masculino") });
  const confirmar = page.getByRole("button", { name: "Confirmar", exact: true });

  // "Confirmar" nasce disabled={!selected || saving} (CriarPersonagemClient.tsx:65).
  // O clique no card só tem efeito depois da hidratação do React; se ele cair
  // antes, o onClick não registra, `selected` fica null e o clique seguinte bate
  // num botão desabilitado — o Playwright então espera e o teste morre com a
  // página parada em "Criação do Recruta".
  //
  // Esperar o botão habilitar é o sinal direto de que o estado mudou. O retry
  // cobre o caso do primeiro clique ter chegado cedo demais.
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  try {
    await expect(confirmar).toBeEnabled({ timeout: 5_000 });
  } catch {
    await card.click();
    await expect(confirmar).toBeEnabled({ timeout: 10_000 });
  }

  await confirmar.click();

  // Aqui SIM vale esperar o conteúdo: é o único ponto em que precisamos provar
  // que o avatar foi persistido. Se `update_avatar_base` falhar, o dashboard
  // devolve o usuário ao gate e esta espera falha com a página certa na mão —
  // em vez de deixar o teste seguir e morrer 30 s depois procurando "Baús".
  await expect(dashboardHeading).toBeVisible({ timeout: 20_000 });
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
