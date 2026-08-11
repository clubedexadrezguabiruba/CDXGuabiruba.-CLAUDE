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
 * ---------------------------------------------------------------------------
 * O GATE MUDOU DE TELA NO BLOCO E, E TODO USUÁRIO NOVO PASSA POR ELE
 * ---------------------------------------------------------------------------
 *
 * Até o Bloco D esta função clicava num `<img alt="Masculino">` e num "Confirmar"
 * que nascia `disabled` — a tela do avatar v2, apagada com a pilha dela. A tela
 * nova é `CriarPersonagemClient.tsx`: pele + cabelo + cor, gravadas por
 * `update_avatar_identity`.
 *
 * Isto NÃO é manutenção de um teste de avatar: `avatar_chosen` nasce `false` para
 * todo usuário criado pela API de admin, então **toda** conta nova da suíte cai
 * aqui. Com o helper apontando para a tela morta, os seis specs que criam usuário
 * morreriam esperando um botão que não existe mais — que é exatamente a forma como
 * a suíte ficou 4 meses sem proteger nada, registrada no bloco acima.
 *
 * ---------------------------------------------------------------------------
 * A PROVA DE HIDRATAÇÃO MUDOU DE SINAL, PORQUE O BOTÃO NÃO NASCE MAIS DESLIGADO
 * ---------------------------------------------------------------------------
 *
 * Na tela v2 "Confirmar" era `disabled={!selected || saving}`, e esperá-lo habilitar
 * provava que o clique no card tinha registrado. A tela nova não tem estado
 * inválido — os defaults do banco (pele 2, careca, cor 0) são uma escolha legítima,
 * e o botão só desliga enquanto salva. Some o sinal, e um clique que caísse antes da
 * hidratação sumiria sem deixar rastro: o React monta o `onClick` depois.
 *
 * O sinal novo é uma amostra de pele. Clicar em "Tom 1" e esperar `aria-pressed`
 * virar `true` prova que o React está vivo NAQUELA árvore — e o botão de confirmar
 * é filho da mesma. Um probe, não um retry às cegas.
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
 * Recruta", que a `FaixaDeComando` emite a partir do `titulo` que
 * `CriarPersonagemClient.tsx:42` passa) ou o h1 do dashboard ("Quartel-General",
 * dashboard/page.tsx:61). Só um dos dois existe por vez, e ambos vêm no HTML do
 * servidor — não dependem dos RPCs do dashboard.
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

  // As 8 amostras de pele levam `aria-label="Tom N"` (EditorDeAparencia.tsx:196).
  // O default do banco é o índice 2, ou seja "Tom 3" — então "Tom 1" está sempre
  // por escolher, e o clique tem para onde mover o estado.
  //
  // O `toPass` é o retry do clique perdido: se o primeiro cair antes da
  // hidratação, o `aria-pressed` não vira e ele clica de novo. Do jeito que
  // estava — clique único e torcida — a falha aparecia lá adiante, num teste
  // que não é este.
  const tomDePele = page.getByRole("button", { name: "Tom 1", exact: true });
  await expect(tomDePele).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await tomDePele.click();
    await expect(tomDePele).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  const confirmar = page.getByRole("button", { name: "Confirmar", exact: true });
  await confirmar.click();

  // Aqui SIM vale esperar o conteúdo: é o único ponto em que precisamos provar
  // que a identidade foi persistida. Se `update_avatar_identity` recusar, a tela
  // mostra o motivo num role="alert" (EditorDeAparencia.tsx:436) e o dashboard
  // nunca chega — então esperamos os DOIS e falamos o que o servidor disse, em
  // vez de morrer 20 s depois com "elemento não encontrado".
  //
  // ⚠️ O `filter` NÃO é zelo. `getByRole("alert")` sozinho casa o **alert vazio do
  // overlay de dev do Next**, que existe em toda página e que o Playwright enxerga
  // porque atravessa shadow DOM. Medido no snapshot de uma falha real: ele é o
  // terceiro nó da árvore, antes de o app começar. Com ele no `.or()`, a espera
  // resolvia na hora e o helper morria com "A criação do recruta falhou:" e
  // mensagem VAZIA — o teste acusando o próprio detector.
  //
  // Exigir texto é o que separa os dois sem depender da cópia do produto nem da
  // tag do overlay: alerta sem texto não tem o que reportar, e se um dia o
  // overlay mostrar um erro de verdade, ele é justamente o que se quer ver.
  const erroDoServidor = page.getByRole("alert").filter({ hasText: /\S/ });
  await expect(dashboardHeading.or(erroDoServidor)).toBeVisible({ timeout: 20_000 });
  if (await erroDoServidor.isVisible()) {
    throw new Error(`A criação do recruta falhou: ${await erroDoServidor.innerText()}`);
  }
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
