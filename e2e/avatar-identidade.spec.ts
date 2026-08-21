import { test, expect, type Locator, type Page } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/lesson-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * A IDENTIDADE DO AVATAR KOKESHI — criação, régua de desbloqueio e perfil público.
 *
 * Sucede `phase8-avatar.spec.ts`, apagado no Bloco D junto com o inventário que ele
 * media (itens, slots, equipar/desequipar). O que aquele teste protegia e continua
 * valendo é a **Regra Inviolável nº 1**: quem decide o que o aluno pode vestir é o
 * servidor. Só mudou o objeto — de `equip_item` para `update_avatar_identity`.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO MEDE E O `verify:` NÃO MEDE
 * ---------------------------------------------------------------------------
 *
 * `verify:cabelo-catalogo` já prova a negação no banco, e `verify:perfil-publico`
 * já prova as chaves de `get_public_profile`. Os dois falam SQL. O que só o
 * navegador responde:
 *
 *  1. **o clique chega ao banco** — a tela grava as três colunas de uma vez;
 *  2. **o cadeado desenhado bate com a régua do servidor** — a tela não tem número
 *     chumbado, e subir o nível abre a peça sem tocar em código;
 *  3. **a folha de estilo sai uma vez** com 7 bonecos na página. O
 *     `folha-unica.test.ts` mede isso em node, sobre a string; aqui é o React 19
 *     deduplicando `<style href precedence>` de verdade, no `<head>` de um
 *     chromium — que é o mecanismo em que o número do E.1 se apoia;
 *  4. **o `/perfil/[userId]` renderiza** com a RPC que o E.3 reescreveu. Ela perdeu
 *     3 chaves e ganhou 3; uma tela que lesse a chave velha só quebra aqui.
 *
 * O **Bloco 6** acrescentou dois testes, e eles medem o que o doc 15 §6 cobra das
 * cinco telas novas:
 *
 *  5. **o boneco aparece na navbar e no Quadro de Honra** — e as duas telas,
 *     servidas por componentes diferentes (`<AvatarCabeca>` e `<AvatarKokeshi>`
 *     compartilham a folha), ainda emitem UM bloco de estilo;
 *  6. **alunos com identidades diferentes saem diferentes no ranking, e sem salto
 *     de layout.** O primeiro é o modo de falha da colisão de `ns` — 30 bonecos
 *     com a pele do primeiro — e nenhum gate de SQL o enxerga: a RPC pode devolver
 *     as três colunas certas e a tela desenhar todas iguais. O segundo é medido no
 *     MECANISMO (caixa com largura/altura explícitas e `line-height: 0`), porque
 *     cronometrar o salto seria um teste instável.
 *
 * ⚠️ Os dois só passam **depois** da migration do Bloco 6: sem as três colunas nas
 * RPCs, `avatar_skin` chega `undefined` em toda linha, o componente cai no default
 * do banco, e os 30 bonecos saem idênticos — que é exatamente o que o teste 6
 * reprova.
 *
 * Bate no Supabase de PRODUÇÃO como toda esta suíte: cria e apaga usuários reais.
 * Rodar com intenção, nunca em CI.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TIMESTAMP = Date.now();
const EMAIL_ALUNO = `teste+identidade${TIMESTAMP}@cdxguabiruba.test`;
const EMAIL_COLEGA = `teste+colega${TIMESTAMP}@cdxguabiruba.test`;
const SENHA = `Teste@${TIMESTAMP}`;

/**
 * Os índices que o teste escolhe na tela, e os nomes que o aluno lê.
 *
 * Os nomes são copy de `EditorDeAparencia.tsx` (NOMES_PELE e NOMES_COR_CABELO) e os
 * índices são a posição na paleta de `palette.ts`. O par existe escrito aqui de
 * propósito: o teste clica pelo NOME e confere pelo ÍNDICE, então se alguém
 * reordenar a paleta sem reordenar os rótulos, é aqui que aparece.
 *
 * Nenhum dos dois é o default do banco (pele 2, cor 0) — escolher o que já estava
 * escolhido provaria zero.
 */
const PELE_ESCOLHIDA = { nome: "Tom 6", indice: 5 };
const COR_ESCOLHIDA = { nome: "Ruivo", indice: 4 };

const cabecalhoServico = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

interface LinhaDoCatalogo {
  slug: string;
  min_level: number;
}

interface Identidade {
  avatar_skin: number;
  avatar_hair: string | null;
  avatar_hair_color: number;
  avatar_chosen: boolean;
  level: number;
}

/**
 * O catálogo NA MESMA ORDEM em que o editor o desenha: `min_level` crescente, e o
 * slug como desempate (`EditorDeAparencia.tsx:261`). Sem repetir a ordenação aqui,
 * "a segunda ficha da grade" não teria dono conhecido.
 */
async function lerCatalogo(): Promise<LinhaDoCatalogo[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/avatar_hair_catalog?select=slug,min_level`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerCatalogo falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as LinhaDoCatalogo[];
  return linhas.sort((a, b) => a.min_level - b.min_level || a.slug.localeCompare(b.slug));
}

async function lerIdentidade(userId: string): Promise<Identidade> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}` +
      `&select=avatar_skin,avatar_hair,avatar_hair_color,avatar_chosen,level`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerIdentidade falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as Identidade[];
  if (linhas.length !== 1) throw new Error(`esperava 1 linha em users, veio ${linhas.length}`);
  return linhas[0];
}

/**
 * Escreve o nível direto na tabela, com service_role.
 *
 * Passar por `grant_xp` seria mais fiel ao produto e é caro por nada: aqui o nível
 * é PREMISSA do teste, não o que ele mede. Quem mede a curva de XP é o
 * `verify:xp-curve`.
 */
async function definirNivel(userId: string, level: number): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...cabecalhoServico, Prefer: "return=minimal" },
    body: JSON.stringify({ level }),
  });
  if (!res.ok) throw new Error(`definirNivel falhou: ${res.status} ${await res.text()}`);
}

/** Token do PRÓPRIO aluno — é o que faz a RPC rodar como `authenticated`. */
async function entrarComSenha(email: string, senha: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: senha }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`entrarComSenha falhou: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

/**
 * Chama a RPC com o token do aluno, e NÃO com service_role.
 *
 * É a diferença entre testar e não testar nada: `service_role` passa por cima de
 * toda RLS, e `auth.uid()` dentro da função sairia nulo. O ataque que este arquivo
 * simula — mexer no DOM para habilitar a ficha travada — chega ao servidor
 * exatamente por este caminho.
 */
async function chamarRpcComoAluno(
  token: string,
  rpc: string,
  params: Record<string, unknown>
): Promise<{ status: number; corpo: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return { status: res.status, corpo: await res.text() };
}

/**
 * A seção do seletor de cabelo.
 *
 * Ancorada no h3 exato "Cabelo" — "Cor do cabelo" é outro h3, e sem o `exact` os
 * dois casariam. `.last()` é seguro contra `<section>` aninhada: o Playwright
 * devolve em ordem de documento, então a mais interna é a última.
 */
function secaoDeCabelo(page: Page) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Cabelo", exact: true }) })
    .last();
}

/** As fichas do seletor, na ordem da grade: careca primeiro, depois o catálogo. */
function fichasDeCabelo(page: Page) {
  return secaoDeCabelo(page).getByRole("button");
}

/**
 * Clica e exige que o estado tenha se mexido, repetindo se não.
 *
 * O motivo é o mesmo do `settleAfterLogin`: o `onClick` só existe depois da
 * hidratação do React, e um clique que caia antes some sem deixar rastro. O
 * `aria-pressed` é o sinal direto de que a árvore está viva — e, uma vez provada,
 * vale para os cliques seguintes da mesma tela.
 */
async function clicarEProvar(ficha: Locator): Promise<void> {
  await expect(async () => {
    await ficha.click();
    await expect(ficha).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

test.describe("Identidade do avatar — a tela, a régua e o perfil público", () => {
  // O dashboard e o perfil disparam vários RPCs contra o Supabase remoto (missões,
  // baús, streak, ranking, conquistas). Rodando a suíte inteira em série, os 30 s
  // padrão não bastam — não é lógica, é latência de rede sob carga. Herdado do
  // spec que este arquivo sucede, pelo mesmo motivo.
  test.describe.configure({ timeout: 90_000 });

  const temAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY && ANON_KEY);
  let idAluno: string;
  let idColega: string;
  let catalogo: LinhaDoCatalogo[];

  test.beforeAll(async () => {
    test.skip(!temAdmin, "NEXT_PUBLIC_SUPABASE_URL, ANON_KEY ou SERVICE_ROLE_KEY não definidos");

    idAluno = await createTestUser(EMAIL_ALUNO, SENHA);
    idColega = await createTestUser(EMAIL_COLEGA, SENHA);

    // O `handle_new_user` cria a linha em `users` por trigger; sem esta pausa a
    // primeira leitura pode chegar antes dela.
    await new Promise((r) => setTimeout(r, 1500));

    catalogo = await lerCatalogo();
    expect(catalogo.length, "o catálogo de cabelo está vazio — o Bloco C não foi aplicado?").toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    if (idAluno) await deleteTestUser(idAluno);
    if (idColega) await deleteTestUser(idColega);
  });

  // ==========================================================================
  test("a criação grava as três colunas, e a folha de estilo sai uma vez", async ({ page }) => {
    const livre = catalogo[0];
    expect(
      livre.min_level,
      "o cabelo mais barato do catálogo está travado no nível 1 — não há o que um recruta novo escolha"
    ).toBe(1);

    // Login CRU, sem `loginAndSettle`: o gate é o objeto do teste, e o helper
    // existe justamente para atravessá-lo. Usá-lo aqui seria medir o helper.
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL_ALUNO);
    await page.fill('input[type="password"]', SENHA);
    await page.click('button[type="submit"]');

    await expect(page.locator("h1", { hasText: "Matrícula" })).toBeVisible({
      timeout: 20_000,
    });

    // O palco é o boneco grande, e ele é a prévia da tela inteira.
    await expect(page.getByRole("img", { name: "Prévia do seu avatar" })).toBeVisible();

    // A grade é careca + catálogo INTEIRO, travados inclusive: é o que permite
    // mostrar o cadeado com o nível que falta.
    const fichas = fichasDeCabelo(page);
    await expect(fichas).toHaveCount(catalogo.length + 1);

    // O cadeado desenhado bate com a régua do banco, NÍVEL A NÍVEL — e não só na
    // contagem. O aluno é nível 1, então travado é exatamente `min_level > 1`, e o
    // número que a ficha mostra tem de ser o `min_level` daquela linha. Comparar as
    // duas listas ordenadas cobre catálogo com dois cabelos no mesmo nível, que
    // uma busca por ficha não cobriria.
    const rotulosTravados = await secaoDeCabelo(page)
      .locator("button[disabled]")
      .evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label") ?? ""));
    const niveisNaTela = rotulosTravados
      .map((r) => Number(r.match(/exige nível (\d+)/)?.[1] ?? NaN))
      .sort((a, b) => a - b);
    const niveisNoBanco = catalogo
      .filter((c) => c.min_level > 1)
      .map((c) => c.min_level)
      .sort((a, b) => a - b);
    expect(niveisNaTela, `os cadeados da tela não batem com avatar_hair_catalog`).toEqual(
      niveisNoBanco
    );

    // A segunda ficha é o cabelo mais barato do catálogo — a primeira é a careca,
    // que não é linha do banco (é `avatar_hair IS NULL`).
    await clicarEProvar(fichas.nth(1));

    // Pelo NOME que o aluno lê; o `aria-pressed` prova que a amostra ficou
    // escolhida, e o índice conferido lá embaixo prova que é a mesma que o banco
    // guardou. Se alguém reordenar a paleta sem reordenar os rótulos, quebra aqui.
    await clicarEProvar(page.getByRole("button", { name: COR_ESCOLHIDA.nome, exact: true }));
    await clicarEProvar(page.getByRole("button", { name: PELE_ESCOLHIDA.nome, exact: true }));

    // ------------------------------------------------------------------ a folha
    // Medida AQUI porque esta tela já tem 7 bonecos (o palco + as 6 fichas) e um
    // login contra produção custa dez segundos. O número do E.1 é este: N
    // avatares, UM bloco de folha.
    const bonecos = await page.locator("svg.kk").count();
    expect(bonecos, "esperava o palco mais as fichas do seletor").toBeGreaterThanOrEqual(
      catalogo.length + 2
    );
    // `kk-respira` é regra da folha e de mais nada: no modo `folhaExterna` o
    // `compor()` não emite `<style>` dentro do `<svg>`, então todo bloco que
    // contém essa string É a folha. Medido: a folha inteira são 1 524 bytes.
    const blocosDeFolha = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter((s) =>
          (s.textContent ?? "").includes("kk-respira")
        ).length
    );
    expect(blocosDeFolha, `${bonecos} bonecos na página deveriam emitir 1 folha`).toBe(1);

    // ------------------------------------------------------------- e ao servidor
    await page.getByRole("button", { name: "Confirmar", exact: true }).click();
    await expect(page.locator("h1", { hasText: "Saguão" })).toBeVisible({
      timeout: 20_000,
    });

    const identidade = await lerIdentidade(idAluno);
    expect(identidade.avatar_skin).toBe(PELE_ESCOLHIDA.indice);
    expect(identidade.avatar_hair).toBe(livre.slug);
    expect(identidade.avatar_hair_color).toBe(COR_ESCOLHIDA.indice);
    // Sem isto o dashboard devolveria o aluno ao gate para sempre.
    expect(identidade.avatar_chosen).toBe(true);
  });

  // ==========================================================================
  test("o cadeado é do servidor: a RPC recusa o cabelo travado", async () => {
    const travado = [...catalogo].reverse().find((c) => c.min_level > 1);
    test.skip(!travado, "nenhum cabelo do catálogo é travado — não há régua a testar");

    // A premissa é declarada, não herdada do teste anterior: o nível é o que
    // decide a recusa, e um arquivo em que a ordem dos testes é a premissa quebra
    // no dia em que alguém rodar um `--grep`.
    await definirNivel(idAluno, 1);
    const antes = await lerIdentidade(idAluno);

    const token = await entrarComSenha(EMAIL_ALUNO, SENHA);
    const { status, corpo } = await chamarRpcComoAluno(token, "update_avatar_identity", {
      p_skin: antes.avatar_skin,
      p_hair: travado!.slug,
      p_hair_color: antes.avatar_hair_color,
    });

    // É o caminho por onde passa quem edita o DOM para destravar a ficha: o botão
    // `disabled` é INFORMAÇÃO, e quem recusa é a transação.
    expect(status, `a RPC aceitou ${travado!.slug} para um aluno de nível 1`).toBeGreaterThanOrEqual(400);
    expect(corpo).toContain(`exige nível ${travado!.min_level}`);

    // E a recusa não deixou meia gravação para trás.
    const depois = await lerIdentidade(idAluno);
    expect(depois.avatar_hair).toBe(antes.avatar_hair);
    expect(depois.avatar_skin).toBe(antes.avatar_skin);
    expect(depois.avatar_hair_color).toBe(antes.avatar_hair_color);
  });

  // ==========================================================================
  test("subir de nível abre o cadeado, e o /perfil salva a troca", async ({ page }) => {
    const travado = [...catalogo].reverse().find((c) => c.min_level > 1);
    test.skip(!travado, "nenhum cabelo do catálogo é travado — não há cadeado a abrir");

    // O mesmo aluno, o mesmo código, um nível diferente. Se a tela tivesse a régua
    // chumbada, o cadeado continuaria lá depois desta linha.
    await definirNivel(idAluno, travado!.min_level);

    await loginAndSettle(page, EMAIL_ALUNO, SENHA);
    await page.goto("/perfil");
    await expect(secaoDeCabelo(page)).toBeVisible({ timeout: 20_000 });

    await expect(
      secaoDeCabelo(page).locator("button[disabled]"),
      `no nível ${travado!.min_level} nenhuma ficha deveria seguir travada`
    ).toHaveCount(0);

    // A ficha mais cara é a última da grade: o catálogo é ordenado por min_level.
    const fichas = fichasDeCabelo(page);
    await clicarEProvar(fichas.last());

    await page.getByRole("button", { name: "Salvar aparência", exact: true }).click();

    // A confirmação é do servidor: `expect.poll` porque a RPC + o `router.refresh`
    // acontecem depois do clique, e ler o banco na mesma linha leria o estado
    // anterior.
    await expect
      .poll(async () => (await lerIdentidade(idAluno)).avatar_hair, { timeout: 15_000 })
      .toBe(travado!.slug);
  });

  // ==========================================================================
  test("o perfil público do colega renderiza com o boneco novo", async ({ page }) => {
    await loginAndSettle(page, EMAIL_COLEGA, SENHA);
    await page.goto(`/perfil/${idAluno}`);

    // `get_public_profile` perdeu 3 chaves e ganhou 3 no E.3. Se a tela lesse
    // qualquer uma das velhas, ou se a matview não tivesse o aluno, o que aparece
    // aqui é o 404 do `notFound()`.
    const boneco = page.getByRole("img", { name: /^Avatar de / });
    await expect(boneco).toBeVisible({ timeout: 20_000 });

    // O nome é mascarado por `mask_display_name`, então o teste não o adivinha —
    // ele parte do rótulo do boneco e exige o MESMO nome no cabeçalho. É o que
    // prova que o avatar ao lado é o daquele aluno, e não resto de outra linha.
    // Ancorar no boneco, e não no h1, também é o que dispensa saber qual h1 da
    // página é o do nome.
    const nome = ((await boneco.getAttribute("aria-label")) ?? "").replace(/^Avatar de /, "");
    expect(nome.length, "o boneco anunciou 'Avatar de ' sem nome nenhum").toBeGreaterThan(0);
    await expect(page.locator("h1", { hasText: nome })).toBeVisible();

    /**
     * DOIS BONECOS, UMA FOLHA — e esta asserção mudou no Bloco 6, por um motivo
     * que vale registrar.
     *
     * Ela exigia `toHaveCount(1)`: a tela tinha UM boneco, o do colega. O Bloco 6
     * pôs o avatar do próprio aluno na navbar, e o `<AvatarCabeca>` de lá é o
     * segundo — a contagem virou 2 e o teste reprovou. **Não era defeito do
     * produto: era a asserção envelhecendo junto com a mudança que ela deveria
     * proteger**, e ela só apareceu porque o e2e rodou.
     *
     * Trocar o 1 por 2 seria o conserto preguiçoso, e ele perde o que a asserção
     * queria dizer. O que ela quer é *"N bonecos, UM bloco de estilo"* — e agora a
     * prova é mais forte que antes: os dois bonecos vêm de **componentes
     * diferentes** (`<AvatarKokeshi>` no corpo da página, `<AvatarCabeca>` na
     * navbar), e um `href` divergente entre eles emitiria duas folhas. Aqui é o
     * React 19 deduplicando de verdade, num chromium, entre dois arquivos.
     */
    await expect(page.locator("nav svg.kk"), "o boneco da navbar").toHaveCount(1);
    const bonecos = await page.locator("svg.kk").count();
    expect(bonecos, "esperava o da navbar mais o do perfil do colega").toBe(2);

    const blocosDeFolha = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter((s) =>
          (s.textContent ?? "").includes("kk-respira"),
        ).length,
    );
    expect(
      blocosDeFolha,
      "os dois componentes de avatar têm de compartilhar o href da folha",
    ).toBe(1);
  });

  // ==========================================================================
  // O BLOCO 6 — o boneco aparece onde a criança aparece
  //
  // O doc 15 §6 cobra três coisas destas telas, e nenhuma delas o SQL responde:
  // o avatar aparece no ranking · alunos com configurações diferentes saem
  // DIFERENTES · nenhum salto de layout ao carregar.
  // ==========================================================================

  test("a navbar e o Quadro de Honra mostram o boneco do aluno", async ({ page }) => {
    await loginAndSettle(page, EMAIL_ALUNO, SENHA);
    await page.goto("/dashboard");
    await expect(page.locator("h1", { hasText: "Saguão" })).toBeVisible({
      timeout: 20_000,
    });

    // A navbar era um círculo com duas letras, e o comentário `{/* Avatar
    // placeholder */}` estava no código desde sempre. Ancorar no `<nav>` é o que
    // separa este boneco dos do Quadro de Honra logo abaixo.
    await expect(page.locator("nav svg.kk")).toHaveCount(1);

    // O Quadro de Honra não tinha nem iniciais. Um boneco por linha do top 5, e
    // o aluno logado está entre eles (ele existe e é visível no ranking).
    const noQuadro = page.locator("ol svg.kk");
    await expect(noQuadro.first()).toBeVisible({ timeout: 20_000 });
    expect(await noQuadro.count(), "o Quadro de Honra não desenhou boneco nenhum").toBeGreaterThan(0);

    // Navbar + lista, e ainda assim UMA folha. É o mecanismo do E.1 atravessando
    // dois componentes diferentes: `<AvatarCabeca>` reusa o `href` de
    // `<AvatarKokeshi>` justamente para isto.
    const blocosDeFolha = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter((s) =>
          (s.textContent ?? "").includes("kk-respira"),
        ).length,
    );
    expect(blocosDeFolha, "navbar + Quadro de Honra deveriam emitir 1 folha").toBe(1);
  });

  test("o ranking mostra bonecos DIFERENTES, sem salto de layout", async ({ page }) => {
    // A premissa é declarada: os dois alunos precisam de identidades distintas,
    // senão "saem diferentes" passaria por vacuidade. O colega recebe pele e cor
    // diferentes das do aluno, pela RPC e com o token dele — que é o caminho do
    // produto, e o que refresca a matview de onde o ranking lê.
    const eu = await lerIdentidade(idAluno);
    const tokenColega = await entrarComSenha(EMAIL_COLEGA, SENHA);
    const peleDoColega = eu.avatar_skin === 0 ? 7 : 0;
    const corDoColega = eu.avatar_hair_color === 1 ? 6 : 1;
    const { status } = await chamarRpcComoAluno(tokenColega, "update_avatar_identity", {
      p_skin: peleDoColega,
      p_hair: null,
      p_hair_color: corDoColega,
    });
    expect(status, "não consegui dar identidade própria ao colega").toBeLessThan(400);

    await loginAndSettle(page, EMAIL_ALUNO, SENHA);
    await page.goto("/ranking");
    await expect(page.locator("h1", { hasText: "Quadro de Honra" })).toBeVisible({
      timeout: 20_000,
    });

    // --- o avatar aparece ---------------------------------------------------
    const naTabela = page.locator("table svg.kk");
    await expect(naTabela.first()).toBeVisible({ timeout: 20_000 });
    expect(
      await naTabela.count(),
      "o ranking desenhou menos de 2 bonecos — sem dois não dá para provar que saem diferentes",
    ).toBeGreaterThanOrEqual(2);

    // --- e eles são DIFERENTES ---------------------------------------------
    //
    // O tom de pele viaja como custom property no `style` do `<svg>` (`--av-pele`),
    // que é o mecanismo do recolorir. Contar quantos valores distintos existem é a
    // prova direta de que a RPC está entregando identidade POR ALUNO — e não a do
    // primeiro, repetida, que é exatamente o modo de falha da colisão de `ns`.
    const peles = await naTabela.evaluateAll((svgs) =>
      svgs.map((s) => (s as SVGElement).style.getPropertyValue("--av-pele").trim()),
    );
    expect(
      new Set(peles).size,
      `os ${peles.length} bonecos do ranking têm todos a mesma pele (${peles[0]}) — a lista está desenhando a identidade de um aluno só`,
    ).toBeGreaterThan(1);

    // --- nenhum salto de layout --------------------------------------------
    //
    // O mecanismo é a caixa com largura e altura EXPLÍCITAS mais `line-height: 0`
    // (`AvatarCabeca.tsx`): sem os dois, a linha mede uma altura antes de pintar e
    // outra depois. Medir o "salto" cronometrando o carregamento seria um teste
    // instável; medir o mecanismo é medir a causa.
    const caixas = await naTabela.evaluateAll((svgs) =>
      svgs.map((s) => {
        const r = s.getBoundingClientRect();
        const pai = s.parentElement as HTMLElement;
        return {
          w: Math.round(r.width),
          h: Math.round(r.height),
          paiW: pai.style.width,
          paiH: pai.style.height,
          lh: pai.style.lineHeight,
        };
      }),
    );
    for (const c of caixas) {
      expect(c.w, "o recorte é quadrado: largura e altura têm de bater").toBe(c.h);
      expect(c.h, "o ranking pede 40 px").toBe(40);
      expect(c.paiW, "a caixa do avatar tem de levar largura explícita").toBe("40px");
      expect(c.paiH, "a caixa do avatar tem de levar altura explícita").toBe("40px");
      expect(c.lh, "sem line-height 0 o SVG inline arrasta um vão de baseline").toBe("0");
    }

    // E a folha continua saindo uma vez, agora com a lista inteira na página.
    const blocosDeFolha = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter((s) =>
          (s.textContent ?? "").includes("kk-respira"),
        ).length,
    );
    expect(blocosDeFolha, `${caixas.length} bonecos no ranking deveriam emitir 1 folha`).toBe(1);
  });
});
