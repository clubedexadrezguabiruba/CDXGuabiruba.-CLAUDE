import { test, expect, type Locator, type Page } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/lesson-helpers";
import { loginAndSettle } from "./helpers/auth-helpers";

/**
 * A IDENTIDADE DO AVATAR KOKESHI — criação, régua de desbloqueio e perfil público.
 *
 * Sucede `phase8-avatar.spec.ts`, apagado no Bloco D junto com o inventário que ele
 * media (itens, slots, equipar/desequipar). O que aquele teste protegia e continua
 * valendo é a **Regra Inviolável nº 1**: quem decide o que o aluno pode vestir é o
 * servidor. Só mudou o objeto — de `equip_item` para `update_avatar_identity`, e
 * deste para **`equipar_peca`** em 2026-08-23, quando o cabelo virou peça de baú.
 * A régua deixou de ser NÍVEL e passou a ser POSSE; `avatar_hair_catalog` não
 * existe mais, e `update_avatar_identity` ficou só com as duas cores.
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
/**
 * Os nomes de raridade que o aluno lê, e eles são COPY de `src/lib/avatar/raridade.ts`.
 *
 * Escritos aqui de propósito, como o par nome/índice das paletas: o teste lê o que
 * está na tela e confere contra o que está no banco, então uma tradução que mudar
 * de um lado só aparece aqui.
 */
const NOME_DA_RARIDADE: Record<string, string> = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

const PELE_ESCOLHIDA = { nome: "Tom 6", indice: 5 };
const COR_ESCOLHIDA = { nome: "Ruivo", indice: 4 };

const cabecalhoServico = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

interface LinhaDoCatalogo {
  slug: string;
  raridade: "common" | "rare" | "epic" | "legendary";
  inicial: boolean;
}

interface Identidade {
  avatar_skin: number;
  avatar_cabelo: string | null;
  avatar_hair_color: number;
  avatar_chosen: boolean;
  level: number;
}

/**
 * O catálogo do slot `cabelo`, NA MESMA ORDEM em que a vitrine o desenha.
 *
 * ⚠️ A ORDEM MUDOU EM 2026-08-23 junto com a gramática. Era `min_level` crescente,
 * lida de `avatar_hair_catalog`; a tabela não existe mais. A vitrine ordena por
 * **o que o aluno pode usar primeiro**, e o slug como desempate
 * (`EditorDeAparencia.tsx`, `ordenados`) — a lista lida de cima para baixo é a
 * progressão. Sem repetir a ordenação aqui, "a segunda ficha da grade" não teria
 * dono conhecido.
 *
 * Quem o aluno pode usar depende de quem ele TEM, então a ordenação recebe o
 * guarda-roupa: é a mesma conta que o `page.tsx` faz no servidor.
 */
async function lerCatalogo(possuidas: Set<string> = new Set()): Promise<LinhaDoCatalogo[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/avatar_catalogo?slot=eq.cabelo&select=slug,raridade,inicial`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerCatalogo falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as LinhaDoCatalogo[];
  return linhas.sort((a, b) => {
    const d = Number(possuidas.has(b.slug)) - Number(possuidas.has(a.slug));
    return d !== 0 ? d : a.slug.localeCompare(b.slug);
  });
}

async function lerIdentidade(userId: string): Promise<Identidade> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}` +
      `&select=avatar_skin,avatar_cabelo,avatar_hair_color,avatar_chosen,level`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerIdentidade falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as Identidade[];
  if (linhas.length !== 1) throw new Error(`esperava 1 linha em users, veio ${linhas.length}`);
  return linhas[0];
}

/** O guarda-roupa do aluno: slug -> fonte. É o que decide silhueta x peça. */
async function lerGuardaRoupa(userId: string): Promise<Map<string, string>> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/avatar_guarda_roupa?user_id=eq.${userId}&select=slug,fonte`,
    { headers: cabecalhoServico }
  );
  if (!res.ok) throw new Error(`lerGuardaRoupa falhou: ${res.status} ${await res.text()}`);
  const linhas = (await res.json()) as { slug: string; fonte: string }[];
  return new Map(linhas.map((l) => [l.slug, l.fonte]));
}

/**
 * Concede a peça com service_role — o que o baú faria, sem abrir baú.
 *
 * Substituiu `definirNivel`, que saiu do arquivo com a escada de nível. A premissa
 * do teste deixou de ser "que nível o aluno tem" e passou a ser "que peça ele
 * possui": é a POSSE que abre o cadeado agora, e conceder a linha é a forma direta
 * de estabelecê-la. Quem mede o sorteio é `verify:chest-pool`.
 */
async function concederPeca(userId: string, slug: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/avatar_guarda_roupa`, {
    method: "POST",
    headers: { ...cabecalhoServico, Prefer: "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: userId, slug, fonte: "bau" }),
  });
  if (!res.ok) throw new Error(`concederPeca falhou: ${res.status} ${await res.text()}`);
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

    catalogo = await lerCatalogo(new Set((await lerGuardaRoupa(idAluno)).keys()));
    expect(
      catalogo.length,
      "o slot cabelo está vazio em avatar_catalogo — a migration 20260823110000 não foi aplicada?"
    ).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    if (idAluno) await deleteTestUser(idAluno);
    if (idColega) await deleteTestUser(idColega);
  });

  // ==========================================================================
  test("a criação grava as três colunas, e a folha de estilo sai uma vez", async ({ page }) => {
    // ⚠️ A PREMISSA MUDOU EM 2026-08-23, e a nova é MAIS FORTE que a antiga.
    //
    // Era `expect(livre.min_level).toBe(1)` — um número numa coluna. O cabelo virou
    // peça de baú, e o que abre a peça é POSSE. Então são duas premissas, e a
    // segunda mede o SEED de verdade em vez de ler um campo:
    //
    //   (i)  existe cabelo `common` no catálogo;
    //   (ii) o aluno recém-criado TEM exatamente as iniciais no guarda-roupa, com
    //        `fonte = 'inicial'`. Isto prova que `handle_new_user` semeou — se o
    //        gatilho não rodar, o aluno nasce com o que a tela oferece e o servidor
    //        nega, que é o defeito que o slot inteiro existe para impedir.
    const comuns = catalogo.filter((c) => c.raridade === "common");
    expect(comuns.length, "nenhum cabelo common no catálogo — um aluno novo não teria o que escolher")
      .toBeGreaterThan(0);

    const guardaRoupa = await lerGuardaRoupa(idAluno);
    const iniciaisDoAluno = [...guardaRoupa.entries()].filter(([, fonte]) => fonte === "inicial");
    const cabelosIniciais = catalogo.filter((c) => c.inicial);

    expect(
      cabelosIniciais.length,
      "o catálogo não marca nenhum cabelo como inicial — a decisão é 2 cabelos common de saída"
    ).toBe(2);
    expect(
      iniciaisDoAluno.map(([slug]) => slug).filter((s) => s.startsWith("cabelo-")).sort(),
      "o aluno recém-criado não recebeu os cabelos iniciais — handle_new_user não semeou"
    ).toEqual(cabelosIniciais.map((c) => c.slug).sort());

    const livre = catalogo[0];

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

    // O CADEADO DESENHADO BATE COM O GUARDA-ROUPA, PEÇA A PEÇA — e não só na
    // contagem. Era nível a nível até 2026-08-23; agora travado é exatamente "não
    // possuo", e a ficha travada não diz mais "Nível 30": ela sai em SILHUETA, com
    // a raridade escrita ao lado da cor (a "Colorblind Rule" do DESIGN.md).
    //
    // Comparar as duas listas ordenadas cobre catálogo com duas peças da mesma
    // raridade, que uma busca por ficha não cobriria.
    const rotulosTravados = await secaoDeCabelo(page)
      .locator("button[disabled]")
      .evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label") ?? ""));
    const raridadesNaTela = rotulosTravados
      // ⚠️ `\w` NÃO CASA ACENTO em JavaScript, e as raridades têm: "rara" passava,
      // "épica" e "lendária" quebravam o match e viravam "?". Medido no e2e de
      // 2026-08-23. `.+?` casa qualquer coisa até o resto do rótulo, que é fixo.
      .map((r) => r.match(/peça (.+?) de baú, você ainda não tem/)?.[1] ?? "?")
      .sort();
    const raridadesNoBanco = catalogo
      .filter((c) => !guardaRoupa.has(c.slug))
      .map((c) => NOME_DA_RARIDADE[c.raridade].toLowerCase())
      .sort();
    expect(
      raridadesNaTela,
      "as silhuetas da tela não batem com o que o aluno NÃO tem no guarda-roupa"
    ).toEqual(raridadesNoBanco);

    // A segunda ficha é a primeira peça que o aluno PODE vestir — a primeira é a
    // careca, que não é linha do banco (é `avatar_cabelo IS NULL`).
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
    expect(identidade.avatar_hair_color).toBe(COR_ESCOLHIDA.indice);
    // ⚠️ O CABELO CHEGOU POR OUTRA PORTA, e é a mudança de comportamento desta
    // tela: ele gravou no CLIQUE da ficha, por `equipar_peca`, não no "Confirmar".
    // As duas cores acima é que subiram com o botão, por `update_avatar_identity`.
    // A asserção continua a mesma porque o resultado é o mesmo — o que mudou é
    // quando, e é isso que este comentário existe para não deixar esquecer.
    expect(identidade.avatar_cabelo).toBe(livre.slug);
    // Sem isto o dashboard devolveria o aluno ao gate para sempre.
    expect(identidade.avatar_chosen).toBe(true);
  });

  // ==========================================================================
  test("o cadeado é do servidor: a RPC recusa a peça que o aluno não tem", async () => {
    // ⚠️ MESMO CAMINHO DE ATAQUE, OBJETO NOVO. Era "cabelo acima do nível" contra
    // `update_avatar_identity`; virou "peça que não possuo" contra `equipar_peca`.
    // As três asserções são as mesmas — 4xx, a mensagem, e nenhuma meia gravação.
    const naoPossui = [...(await lerGuardaRoupa(idAluno)).keys()];
    const alvo = catalogo.find((c) => !naoPossui.includes(c.slug));
    test.skip(!alvo, "o aluno possui o catálogo inteiro — não há negação a provar");

    // A premissa é declarada, não herdada do teste anterior: a POSSE é o que decide
    // a recusa, e um arquivo em que a ordem dos testes é a premissa quebra no dia
    // em que alguém rodar um `--grep`.
    const antes = await lerIdentidade(idAluno);
    expect(
      (await lerGuardaRoupa(idAluno)).has(alvo!.slug),
      `a premissa deste teste é que o aluno NÃO tenha ${alvo!.slug}`
    ).toBe(false);

    const token = await entrarComSenha(EMAIL_ALUNO, SENHA);
    const { status, corpo } = await chamarRpcComoAluno(token, "equipar_peca", {
      p_slot: "cabelo",
      p_slug: alvo!.slug,
    });

    // É o caminho por onde passa quem edita o DOM para destravar a silhueta: o
    // botão `disabled` é INFORMAÇÃO, e quem recusa é a transação.
    expect(
      status,
      `a RPC aceitou ${alvo!.slug} para um aluno que não tem a peça`
    ).toBeGreaterThanOrEqual(400);
    expect(corpo).toContain("você ainda não tem a peça");

    // E a recusa não deixou meia gravação para trás.
    const depois = await lerIdentidade(idAluno);
    expect(depois.avatar_cabelo).toBe(antes.avatar_cabelo);
    expect(depois.avatar_skin).toBe(antes.avatar_skin);
    expect(depois.avatar_hair_color).toBe(antes.avatar_hair_color);
  });

  // ==========================================================================
  test("ganhar a peça abre o cadeado, e o clique no /perfil veste na hora", async ({ page }) => {
    // ⚠️ A PREMISSA TROCOU: era "subir de nível", virou "ganhar a peça". É o que a
    // virada de 2026-08-23 quer dizer na prática — o baú passou a ser a porta, e
    // conceder a linha com service_role é o baú sem abrir baú.
    const possuidasAntes = await lerGuardaRoupa(idAluno);
    const alvo = catalogo.find((c) => !possuidasAntes.has(c.slug));
    test.skip(!alvo, "o aluno possui o catálogo inteiro — não há cadeado a abrir");

    await loginAndSettle(page, EMAIL_ALUNO, SENHA);
    await page.goto("/perfil");
    await expect(secaoDeCabelo(page)).toBeVisible({ timeout: 20_000 });

    // A TELA É MEDIDA ANTES E DEPOIS, e a peça é identificada pela diferença.
    //
    // A alternativa seria uma tabela slug -> nome legível escrita aqui, e ela seria
    // uma segunda lista para discordar de `CABELOS`. O nome já está no aria-label
    // da silhueta ("<Nome> — peça <raridade> de baú, você ainda não tem"), então a
    // tela responde sozinha qual ficha destravou.
    const nomesTravados = async (): Promise<string[]> =>
      (
        await secaoDeCabelo(page)
          .locator("button[disabled]")
          .evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label") ?? ""))
      )
        .map((r) => r.split(" — ")[0])
        .sort();

    const travadosAntes = await nomesTravados();
    expect(
      travadosAntes.length,
      "nenhuma ficha em silhueta antes de conceder — não há cadeado a abrir"
    ).toBeGreaterThan(0);

    // O mesmo aluno, o mesmo código, uma linha a mais no guarda-roupa. Se a tela
    // tivesse a régua chumbada, a silhueta continuaria lá depois desta linha.
    await concederPeca(idAluno, alvo!.slug);
    await page.reload();
    await expect(secaoDeCabelo(page)).toBeVisible({ timeout: 20_000 });

    const travadosDepois = await nomesTravados();
    const destravou = travadosAntes.filter((n) => !travadosDepois.includes(n));
    expect(
      destravou,
      `conceder ${alvo!.slug} deveria tirar EXATAMENTE uma ficha da silhueta`
    ).toHaveLength(1);

    // Agora o rótulo é só o nome: a ficha vestível não carrega o sufixo da silhueta.
    const ficha = secaoDeCabelo(page).getByRole("button", {
      name: destravou[0],
      exact: true,
    });
    await clicarEProvar(ficha);

    // ⚠️ NÃO HÁ "Salvar aparência" AQUI, e é a mudança de comportamento desta
    // virada: o cabelo é peça e veste NA HORA, por `equipar_peca`, como o traje já
    // fazia. O botão continua existindo — ele grava as duas CORES, que são o que
    // sobrou de `update_avatar_identity`.
    //
    // `expect.poll` porque a RPC acontece depois do clique, e ler o banco na mesma
    // linha leria o estado anterior.
    await expect
      .poll(async () => (await lerIdentidade(idAluno)).avatar_cabelo, { timeout: 15_000 })
      .toBe(alvo!.slug);
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
    // ⚠️ A ASSINATURA MUDOU EM 2026-08-23: a RPC perdeu o cabelo e ficou com as
    // duas cores. Chamar com 3 parâmetros devolve **404** — a função não existe —,
    // e é assim que o PostgREST diz "essa assinatura morreu". O cabelo do colega
    // não entra aqui de propósito: pele e cor já bastam para os dois saírem
    // diferentes, e vesti-lo exigiria conceder a peça antes.
    const { status } = await chamarRpcComoAluno(tokenColega, "update_avatar_identity", {
      p_skin: peleDoColega,
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
