import { test, expect, type Locator, type Page } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/lesson-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * BARBA **E** ÓCULOS — a única ponta do slot novo que não tinha medição.
 *
 * O slot `oculos` nasceu em 2026-08-27 e foi provado por dois caminhos: o RENDER
 * (a esteira de arte desenha os cinco, com o vão da lente aberto) e o GATE de SQL
 * (`verify:catalogo-slots` §4 chama `equipar_peca` com token `authenticated` e
 * prova que um slot não mexe nos outros). Nenhum dos dois abre um navegador.
 *
 * Então nada media o pedido do Doug como ele o fez: *"eu preciso que dê para
 * vestir a barba e o óculos, ao mesmo tempo"*. Vestir é um clique numa tela, com
 * sessão logada, e a peça tem de aparecer no boneco depois.
 *
 * ---------------------------------------------------------------------------
 * O QUE SÓ ESTE ARQUIVO RESPONDE
 * ---------------------------------------------------------------------------
 *
 *  1. **a vitrine OFERECE a peça** — o gate de SQL prova que o banco tem as cinco
 *     e que a RPC as aceita; ele não sabe se a tela buscou o slot. Uma consulta
 *     que esquece `oculos` devolve `[]`, e `[]` é *truthy* em JS: a seção renderiza
 *     com a ficha da ausência e nada mais. Build, `typecheck` e `verify:all`
 *     passam os quatro — o aluno é quem descobre;
 *  2. **o clique chega às DUAS colunas, e a segunda não zera a primeira.** É a
 *     virada inteira de 2026-08-27 num assert: enquanto óculos e barba dividiam o
 *     slot `rosto`, vestir um tirava o outro por construção;
 *  3. **o palco desenha as duas peças no mesmo boneco.** Uma prop opcional que o
 *     `<AvatarKokeshi>` aceita e a tela não passa é invisível ao `typecheck` — o
 *     boneco sai sem óculos e nenhuma régua estática reclama.
 *
 * Bate no Supabase de PRODUÇÃO como toda esta suíte: cria e apaga um usuário real.
 * Rodar com intenção, nunca em CI.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TIMESTAMP = Date.now();
const EMAIL = `teste+barbaoculos${TIMESTAMP}@cdxguabiruba.test`;
const SENHA = `Teste@${TIMESTAMP}`;

const cabecalhoServico = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

/** As duas colunas que este arquivo existe para ver conviverem. */
interface Vestido {
  avatar_rosto: string | null;
  avatar_oculos: string | null;
}

async function lerVestido(userId: string): Promise<Vestido> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=avatar_rosto,avatar_oculos`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerVestido falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as Vestido[];
  if (linhas.length !== 1) throw new Error(`esperava 1 linha em users, veio ${linhas.length}`);
  return linhas[0];
}

/**
 * Os slugs de um slot, lidos do BANCO e nunca escritos aqui.
 *
 * Os cinco óculos entraram com slug provisório e o Doug ainda vai batizá-los —
 * *"depois eu digo qual é a peça, qual é o nome da peça"*. Um slug chumbado neste
 * arquivo viraria uma segunda lista para discordar do catálogo no dia do batismo.
 */
async function slugsDoSlot(slot: string): Promise<string[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/avatar_catalogo?slot=eq.${slot}&select=slug`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`slugsDoSlot(${slot}) falhou: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { slug: string }[]).map((l) => l.slug).sort();
}

/** Concede a peça com service_role — o baú, sem abrir baú. */
async function concederPeca(userId: string, slug: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/avatar_guarda_roupa`, {
    method: "POST",
    headers: { ...cabecalhoServico, Prefer: "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: userId, slug, fonte: "bau" }),
  });
  if (!res.ok) throw new Error(`concederPeca(${slug}) falhou: ${res.status} ${await res.text()}`);
}

/**
 * A seção de um grupo da vitrine, ancorada no h3 EXATO.
 *
 * `.last()` é seguro contra `<section>` aninhada: o Playwright devolve em ordem de
 * documento, então a mais interna é a última.
 */
function secao(page: Page, titulo: string): Locator {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: titulo, exact: true }) })
    .last();
}

/**
 * Clica e exige que o estado tenha se mexido, repetindo se não.
 *
 * O `onClick` só existe depois da hidratação do React, e um clique que caia antes
 * some sem deixar rastro. `aria-pressed` é o sinal direto de que a árvore está
 * viva. Reequipar a mesma peça é idempotente, então repetir não suja nada.
 */
async function clicarEProvar(ficha: Locator): Promise<void> {
  await expect(async () => {
    await ficha.click();
    await expect(ficha).toHaveAttribute("aria-pressed", "true", { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/**
 * A única ficha VESTÍVEL de um grupo — e a asserção é a premissa do teste.
 *
 * O aluno recebeu exatamente uma peça de cada slot, então a vitrine tem de oferecer
 * exatamente uma ficha habilitada além da ausência ("Sem barba", "Sem óculos"). Zero
 * é o modo de falha que este arquivo nasceu para pegar: a tela que não busca o slot
 * desenha o grupo inteiro com a ausência sozinha.
 */
async function fichaVestivel(page: Page, titulo: string, rotuloSemPeca: string): Promise<Locator> {
  const habilitadas = secao(page, titulo).locator("button:not([disabled])");
  const rotulos = await habilitadas.evaluateAll((bs) =>
    bs.map((b) => b.getAttribute("aria-label") ?? "")
  );
  const vestiveis = rotulos.filter((r) => r !== rotuloSemPeca);

  expect(
    vestiveis,
    `a vitrine "${titulo}" não ofereceu peça vestível nenhuma — o aluno TEM a peça no ` +
      `guarda-roupa, então ou a tela não buscou o catálogo deste slot, ou não o passou ` +
      `ao editor. Habilitadas na tela: ${JSON.stringify(rotulos)}`
  ).toHaveLength(1);

  return secao(page, titulo).getByRole("button", { name: vestiveis[0], exact: true });
}

test.describe("Barba e óculos vestidos ao mesmo tempo", () => {
  // Login contra o Supabase remoto mais duas RPCs de equipar. Os 30 s padrão não
  // bastam quando a suíte roda inteira em série — é latência, não lógica.
  test.describe.configure({ timeout: 90_000 });

  const temAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;
  let slugBarba: string;
  let slugOculos: string;

  test.beforeAll(async () => {
    test.skip(!temAdmin, "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos");

    const rostos = await slugsDoSlot("rosto");
    const oculos = await slugsDoSlot("oculos");
    expect(rostos.length, "o slot rosto está vazio em avatar_catalogo").toBeGreaterThan(0);
    expect(
      oculos.length,
      "o slot oculos está vazio em avatar_catalogo — a migration 20260827190000 não foi aplicada?"
    ).toBeGreaterThan(0);
    slugBarba = rostos[0];
    slugOculos = oculos[0];

    userId = await createTestUser(EMAIL, SENHA);
    // `handle_new_user` cria a linha em `users` por trigger; sem esta pausa a
    // concessão pode chegar antes dela e violar a FK.
    await new Promise((r) => setTimeout(r, 1500));

    await concederPeca(userId, slugBarba);
    await concederPeca(userId, slugOculos);
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("a tela veste as duas, o banco guarda as duas, e o boneco mostra as duas", async ({
    page,
  }) => {
    // A premissa declarada: o aluno nasce sem nada nos dois slots. Sem isto, "ficou
    // vestido" poderia estar medindo o default do banco.
    const antes = await lerVestido(userId);
    expect(antes.avatar_rosto, "o aluno novo deveria nascer sem barba").toBeNull();
    expect(antes.avatar_oculos, "o aluno novo deveria nascer sem óculos").toBeNull();

    await loginAndSettle(page, EMAIL, SENHA);
    await page.goto("/perfil");
    await expect(secao(page, "Rosto")).toBeVisible({ timeout: 20_000 });

    // ---------------------------------------------------------------- a barba
    await clicarEProvar(await fichaVestivel(page, "Rosto", "Sem barba"));
    await expect
      .poll(async () => (await lerVestido(userId)).avatar_rosto, { timeout: 15_000 })
      .toBe(slugBarba);

    // --------------------------------------------------------------- o óculos
    //
    // ⚠️ ESTA É A ASSERÇÃO DA VIRADA. Até 2026-08-27 as duas famílias dividiam o
    // slot `rosto`, e `equipar_peca` escreve UM slug por coluna: clicar no óculos
    // apagava a barba, sem erro nenhum. O `poll` espera a segunda coluna e a
    // comparação seguinte exige que a primeira tenha sobrevivido.
    await clicarEProvar(await fichaVestivel(page, "Óculos", "Sem óculos"));
    await expect
      .poll(async () => (await lerVestido(userId)).avatar_oculos, { timeout: 15_000 })
      .toBe(slugOculos);

    const depois = await lerVestido(userId);
    expect(
      depois.avatar_rosto,
      "vestir o óculos derrubou a barba — os dois slots voltaram a ser um só"
    ).toBe(slugBarba);

    // ----------------------------------------------------- e o boneco mostra
    //
    // O `reload` é de propósito: sem ele mediríamos o estado que o próprio clique
    // deixou no React. Com ele, o palco é remontado a partir do que o SERVIDOR leu
    // de `users` e passou ao componente — que é onde uma prop esquecida se esconde.
    await page.reload();

    // Só o palco tem `rotulo`; as fichas da vitrine e o boneco da navbar saem
    // `aria-hidden` de propósito, então este `getByRole` não os pega.
    const palco = page.getByRole("img", { name: /^Avatar de / });
    await expect(palco).toBeVisible({ timeout: 20_000 });

    // As duas peças chegam ao SVG como `<image>`: o óculos é arte de cor assada
    // (`/items/oculos/*.svg`) e a barba entra pela máscara de tom
    // (`/items/rosto/*-tom.png`), que recolore com o cabelo. Ler os `href` é ler o
    // que o compositor de fato emitiu, e não o que a tela pretendia emitir.
    const hrefsDoPalco = await palco
      .locator("image")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("href") ?? ""));

    expect(
      hrefsDoPalco.some((h) => h.includes("/items/rosto/")),
      `o palco não desenhou a barba. <image> emitidos: ${JSON.stringify(hrefsDoPalco)}`
    ).toBe(true);
    expect(
      hrefsDoPalco.some((h) => h.includes("/items/oculos/")),
      `o palco não desenhou o óculos. <image> emitidos: ${JSON.stringify(hrefsDoPalco)}`
    ).toBe(true);

    // E a navbar, que é o boneco que segue o aluno por toda a plataforma. Ela lê de
    // `users` no layout, por outro caminho que o `/perfil` — um slot que chega numa
    // tela e não na outra é exatamente o defeito que este par de asserções separa.
    const hrefsDaNavbar = await page
      .locator("nav svg.kk image")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("href") ?? ""));
    expect(
      hrefsDaNavbar.some((h) => h.includes("/items/oculos/")),
      `a navbar não desenhou o óculos. <image> emitidos: ${JSON.stringify(hrefsDaNavbar)}`
    ).toBe(true);
  });
});
