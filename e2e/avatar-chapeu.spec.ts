import { test, expect, type Locator, type Page } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/lesson-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * O CHAPÉU CHEGA À VITRINE — a ponta que nenhuma régua desta casa alcança.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, E POR QUE ELE NÃO É O DO ÓCULOS
 * ---------------------------------------------------------------------------
 *
 * As 9 peças do slot `chapeu` entraram no catálogo em 2026-08-27, com arte em
 * `public/items/chapeu/`, coluna em `users`, `equipar_peca` aceitando o slot e
 * `<AvatarKokeshi>` aceitando a prop — e **nenhuma tela onde vesti-las**. O óculos
 * caiu no dia anterior por uma consulta que esquecia um slot que a tela já
 * oferecia; aqui a tela nunca ofereceu o slot: `SlotDaVitrine` excluía `chapeu` e o
 * grupo não existia no editor.
 *
 * ---------------------------------------------------------------------------
 * O QUE SÓ ESTE ARQUIVO RESPONDE
 * ---------------------------------------------------------------------------
 *
 *  1. **existe o grupo "Chapéu", e ele oferece peça vestível.** `verify:catalogo-slots`
 *     prova que o banco tem as nove e que a RPC as aceita; ele não abre navegador e
 *     não sabe se a tela desenhou o grupo. Antes deste bloco a seção não existia, e
 *     `build`, `typecheck`, 1125 testes de vitest e os 19 gates passavam;
 *  2. **o clique chega a `users.avatar_chapeu` e NÃO derruba o cabelo.** O chapéu
 *     *contém* o cabelo no desenho (`escondeCabelo`), e conter no render é o oposto
 *     de apagar na coluna — quem some do desenho tem de continuar no banco;
 *  3. **o palco e a navbar desenham a peça**, cada um por seu caminho de leitura.
 *     Uma prop opcional que o componente aceita e a tela não passa é invisível ao
 *     `typecheck` — foi assim que o palco do `/perfil` ficou sem óculos;
 *  4. **o par (chapéu, cabelo) roda de verdade.** O clip `-c-chapeu` no palco é a
 *     prova de que a máquina do `escondeCabelo` recebeu dados de aluno, e não só as
 *     fixtures de `chapeu-contem-cabelo.test.ts`.
 *
 * Bate no Supabase de PRODUÇÃO como toda esta suíte: cria e apaga um usuário real.
 * Rodar com intenção, nunca em CI.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TIMESTAMP = Date.now();
const EMAIL = `teste+chapeu${TIMESTAMP}@cdxguabiruba.test`;
const SENHA = `Teste@${TIMESTAMP}`;

const cabecalhoServico = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

/** As duas colunas que este arquivo existe para ver conviverem. */
interface Vestido {
  avatar_chapeu: string | null;
  avatar_cabelo: string | null;
}

async function lerVestido(userId: string): Promise<Vestido> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=avatar_chapeu,avatar_cabelo`,
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
 * Chumbar um slug neste arquivo criaria uma segunda lista para discordar do
 * catálogo no dia em que o Doug rebatizar as peças.
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
 * Põe um cabelo na cabeça do aluno ANTES do login, por service_role.
 *
 * É montagem de cenário, não a medição: o aluno novo nasce careca
 * (`avatar_cabelo` NULL), e uma cabeça careca não exercita o `escondeCabelo` — o
 * clip do chapéu só é emitido quando existe cabelo para conter. Vestir pela tela
 * seria um segundo clique medindo o que o e2e da vitrine do cabelo já mede.
 */
async function porCabelo(userId: string, slug: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...cabecalhoServico, Prefer: "return=minimal" },
    body: JSON.stringify({ avatar_cabelo: slug }),
  });
  if (!res.ok) throw new Error(`porCabelo(${slug}) falhou: ${res.status} ${await res.text()}`);
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
 * A única ficha VESTÍVEL do grupo — e a asserção é a premissa do teste.
 *
 * O aluno recebeu exatamente um chapéu, então a vitrine tem de oferecer exatamente
 * uma ficha habilitada além da ausência ("Sem chapéu"). Zero é o modo de falha que
 * este arquivo nasceu para pegar: a tela sem o grupo não oferece nada.
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

test.describe("O chapéu é vestível na vitrine", () => {
  // Login contra o Supabase remoto mais a RPC de equipar. Os 30 s padrão não bastam
  // quando a suíte roda inteira em série — é latência, não lógica.
  test.describe.configure({ timeout: 90_000 });

  const temAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;
  let slugChapeu: string;
  let slugCabelo: string;

  test.beforeAll(async () => {
    test.skip(!temAdmin, "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos");

    const chapeus = await slugsDoSlot("chapeu");
    const cabelos = await slugsDoSlot("cabelo");
    expect(
      chapeus.length,
      "o slot chapeu está vazio em avatar_catalogo — a esteira de arte não rodou?"
    ).toBeGreaterThan(0);
    expect(cabelos.length, "o slot cabelo está vazio em avatar_catalogo").toBeGreaterThan(0);
    slugChapeu = chapeus[0];
    slugCabelo = cabelos[0];

    userId = await createTestUser(EMAIL, SENHA);
    // `handle_new_user` cria a linha em `users` por trigger; sem esta pausa a
    // concessão pode chegar antes dela e violar a FK.
    await new Promise((r) => setTimeout(r, 1500));

    await concederPeca(userId, slugChapeu);
    await concederPeca(userId, slugCabelo);
    await porCabelo(userId, slugCabelo);
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("a tela oferece o chapéu, o banco guarda, e o boneco veste sem perder o cabelo", async ({
    page,
  }) => {
    // A premissa declarada: o aluno nasce sem chapéu e com o cabelo que a montagem
    // pôs. Sem isto, "ficou vestido" poderia estar medindo o default do banco.
    const antes = await lerVestido(userId);
    expect(antes.avatar_chapeu, "o aluno novo deveria nascer sem chapéu").toBeNull();
    expect(antes.avatar_cabelo, "a montagem não pôs o cabelo").toBe(slugCabelo);

    await loginAndSettle(page, EMAIL, SENHA);
    await page.goto("/perfil");

    // ---------------------------------------------- o grupo existe, e é o defeito
    //
    // Esta linha sozinha reprova antes do bloco: `SlotDaVitrine` não tinha `chapeu`
    // e o editor não tinha o grupo, então a seção não existia em lugar nenhum.
    await expect(
      secao(page, "Chapéu"),
      "o grupo 'Chapéu' não existe na tela — as 9 peças do catálogo não têm onde ser vestidas"
    ).toBeVisible({ timeout: 20_000 });

    await clicarEProvar(await fichaVestivel(page, "Chapéu", "Sem chapéu"));
    await expect
      .poll(async () => (await lerVestido(userId)).avatar_chapeu, { timeout: 15_000 })
      .toBe(slugChapeu);

    // O chapéu ESCONDE o cabelo no desenho; esconder no render é o oposto de apagar
    // na coluna. Se um dia o compositor "resolver" o par zerando o slot de baixo, é
    // aqui que aparece.
    const depois = await lerVestido(userId);
    expect(
      depois.avatar_cabelo,
      "vestir o chapéu derrubou o cabelo — conter no desenho virou apagar no banco"
    ).toBe(slugCabelo);

    // ------------------------------------------------------- e o boneco mostra
    //
    // O `reload` é de propósito: sem ele mediríamos o estado que o próprio clique
    // deixou no React. Com ele, o palco é remontado a partir do que o SERVIDOR leu
    // de `users` e passou ao componente — que é onde uma prop esquecida se esconde.
    await page.reload();

    // Só o palco tem `rotulo`; as fichas da vitrine e o boneco da navbar saem
    // `aria-hidden` de propósito, então este `getByRole` não os pega.
    const palco = page.getByRole("img", { name: /^Avatar de / });
    await expect(palco).toBeVisible({ timeout: 20_000 });

    // A peça chega ao SVG como `<image>`: o chapéu é arte de cor assada
    // (`/items/chapeu/*.svg`, Regra Inviolável nº 4). Ler os `href` é ler o que o
    // compositor de fato emitiu, e não o que a tela pretendia emitir.
    const hrefsDoPalco = await palco
      .locator("image")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("href") ?? ""));
    expect(
      hrefsDoPalco.some((h) => h.includes("/items/chapeu/")),
      `o palco não desenhou o chapéu. <image> emitidos: ${JSON.stringify(hrefsDoPalco)}`
    ).toBe(true);

    // O PAR RODOU. `compor()` só emite `<clipPath id="{ns}-c-chapeu">` quando há
    // chapéu COM linha e cabelo para conter — é a máquina do `escondeCabelo`
    // recebendo dados de aluno, e não as fixtures do teste de unidade.
    await expect(
      palco.locator('clipPath[id$="-c-chapeu"]'),
      "o palco não emitiu o clip do chapéu — o par (chapéu, cabelo) não chegou ao compositor"
    ).toHaveCount(1);

    // E a navbar, que é o boneco que segue o aluno por toda a plataforma. Ela lê de
    // `users` no layout, por outro caminho que o `/perfil` — um slot que chega numa
    // tela e não na outra é exatamente o defeito que este par de asserções separa.
    const hrefsDaNavbar = await page
      .locator("nav svg.kk image")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("href") ?? ""));
    expect(
      hrefsDaNavbar.some((h) => h.includes("/items/chapeu/")),
      `a navbar não desenhou o chapéu. <image> emitidos: ${JSON.stringify(hrefsDaNavbar)}`
    ).toBe(true);
  });
});
