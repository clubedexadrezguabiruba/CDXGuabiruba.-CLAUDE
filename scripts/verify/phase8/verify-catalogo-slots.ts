/**
 * GATE DO CATÁLOGO DE SLOTS — a fundação do guarda-roupa (Bloco 1 do doc 21).
 *
 * O QUE ELE EXISTE PARA IMPEDIR
 * -----------------------------
 * Três falhas, e nenhuma delas quebra o `apply`:
 *
 *  1. **A repetição do pecado que matou a v2.** A pilha antiga tinha **8
 *     uniformes semeados no banco e 0 renderáveis** — o catálogo prometia peças
 *     que nenhum compositor sabia desenhar. O conserto não é disciplina, é
 *     mecanismo: o conjunto de slugs de `avatar_catalogo` tem de ser **igual** ao
 *     de `src/lib/avatar/catalogo.ts`, slot a slot, nos dois sentidos.
 *
 *  2. **Régua que não é régua.** Se `equipar_peca` não conferir o direito, o
 *     cadeado do editor vira enfeite de CSS: um `rpc()` no devtools veste o traje
 *     de General no primeiro dia. É a Regra Inviolável nº 1, e a única prova
 *     aceitável é a negação **MEDIDA** — chamada de verdade, como o papel
 *     `authenticated`.
 *
 *  3. **Dado incoerente no catálogo.** Cada origem usa uma coluna de régua e
 *     ignora as outras duas. Uma peça de baú com `min_level` preenchido é dado
 *     que ninguém lê e que a próxima pessoa vai acreditar. O CHECK composto da
 *     migration recusa; este gate mede os DADOS, porque migration é intenção e
 *     estado do banco é fato — e um CHECK dropado amanhã não avisa ninguém.
 *
 *  4. **A economia do traje voltando por acidente ao vínculo com patente.** Desde
 *     2026-08-13 a patente dá **moldura**, não roupa (doc 21 §0), e a economia é
 *     **1 traje inicial + o resto por baú** (doc 22 §1). A conferência 3 mede as
 *     duas metades disso, e ela é a que mudou de sinal: até essa data ela exigia
 *     "nenhum traje sai de baú", que era a trava nº 3 do doc 21 §1.3. A trava foi
 *     **revogada** — o CHECK `avatar_catalogo_traje_nao_e_de_bau` caiu na migration
 *     `20260813120000` —, e o que a substitui é a régua da economia nova.
 *
 * POR QUE ELE NÃO PASSA POR VACUIDADE COM O CATÁLOGO VAZIO
 * --------------------------------------------------------
 * No Bloco 1 não existe nenhuma peça: os dois lados são conjuntos vazios, e a
 * conferência 2 é verdadeira por não ter o que comparar. Isso seria um gate
 * decorativo — o defeito que este projeto mais persegue.
 *
 * Por isso a conferência 4 **planta as próprias peças** dentro da transação: uma
 * de nível, uma de patente, uma de baú possuída e uma de baú não possuída. As
 * negações são medidas contra peças que existem de verdade, e nada sobrevive ao
 * `ROLLBACK`. A partir do Bloco 2 o catálogo real chega, e a conferência 2 passa
 * a ter dentes sozinha.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Tudo roda dentro de UMA transação que termina em `ROLLBACK`, personificando um
 * usuário existente por `set_config('request.jwt.claims', ...)` — que é de onde
 * `auth.uid()` lê. Nem as peças plantadas, nem o que o aluno "equipou", nem a
 * linha de guarda-roupa sobrevivem.
 *
 * `conferir(db)` recebe o handle de fora para que o ensaio a seco de uma
 * migration possa rodá-la **dentro da mesma transação em que a migration foi
 * aplicada**. Sem banco separado (achado D3), é o único jeito de medir "passa
 * depois" sem aplicar em produção — foi assim no Bloco C, no E.2 e no Bloco 6.
 *
 * Uso: npm run verify:catalogo-slots
 */

import { resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import type { Sql } from "postgres";
import { getDbUrl } from "../db-url";
import { CATALOGO, SLOTS } from "../../../src/lib/avatar/catalogo";

/**
 * As colunas de equipar que o Bloco 1 acrescentou a `users`.
 *
 * Eram **5**. `avatar_fundo` foi apagada em 2026-08-13, junto com o slot `fundo`
 * inteiro: a peça de teste do Bloco 3 provou o achado **G23** — nenhuma cor de
 * fundo faz os seis anéis de patente lerem —, e o Doug decidiu por um fundo único
 * para todo aluno, que é o marfim que os palcos já usavam.
 */
const COLUNAS_EQUIPAR = ["avatar_traje", "avatar_chapeu", "avatar_rosto", "avatar_pet"] as const;

/** As duas tabelas da arquitetura B (doc 21 §3.1). */
const TABELAS = ["avatar_catalogo", "avatar_guarda_roupa"] as const;

/** Prefixo das peças plantadas pela conferência 4. Nenhuma sobrevive ao ROLLBACK. */
const FIXTURE = "zz-teste-gate";

/**
 * Roda algo que PODE lançar, sem perder a transação.
 *
 * Exceção dentro de uma transação a aborta inteira: sem savepoint, a primeira
 * conferência que falha faz todas as seguintes falharem por "current transaction
 * is aborted" — e o relatório culparia o lugar errado.
 */
async function tentar(db: Sql, marca: string, fn: () => Promise<unknown>): Promise<string | null> {
  await db.unsafe(`savepoint ${marca}`);
  try {
    await fn();
    await db.unsafe(`release savepoint ${marca}`);
    return null;
  } catch (e) {
    await db.unsafe(`rollback to savepoint ${marca}`);
    return e instanceof Error ? e.message : String(e);
  }
}

export interface Relatorio {
  passed: number;
  failed: number;
}

export async function conferir(db: Sql): Promise<Relatorio> {
  let passed = 0;
  let failed = 0;

  const ok = (msg: string) => {
    console.log(`  [PASS] ${msg}`);
    passed++;
  };
  const nok = (msg: string, detalhe: string) => {
    console.log(`  [FAIL] ${msg}`);
    console.log(`         ${detalhe}`);
    failed++;
  };
  const info = (msg: string) => console.log(`  [INFO] ${msg}`);

  // --- 1. A estrutura ------------------------------------------------------
  console.log("\n1. As duas tabelas, as cinco colunas e a RPC");

  const presentes: Record<string, boolean> = {};
  for (const tabela of TABELAS) {
    const [{ existe }] = await db<{ existe: boolean }[]>`
      select to_regclass(${"public." + tabela}) is not null as existe`;
    presentes[tabela] = existe;
    if (existe) ok(`tabela ${tabela} existe`);
    else
      nok(
        `tabela ${tabela} não existe`,
        "aplicar supabase/migrations/20260811160000_bloco1_fundacao_dos_slots.sql",
      );
  }

  if (!presentes["avatar_catalogo"] || !presentes["avatar_guarda_roupa"]) {
    return { passed, failed };
  }

  // RLS ligada é metade da defesa; a outra metade é o grant, medido pelo
  // verify:privileges. Uma tabela sem RLS com o grant default do Supabase é
  // leitura e escrita abertas ao navegador.
  for (const tabela of TABELAS) {
    const [{ ligada }] = await db<{ ligada: boolean }[]>`
      select relrowsecurity as ligada from pg_class
      where oid = ${"public." + tabela}::regclass`;
    if (ligada) ok(`${tabela} com RLS ligada`);
    else nok(`${tabela} sem RLS`, "o grant default do Supabase abre a tabela ao navegador");
  }

  const cols = await db<{ column_name: string; udt_name: string }[]>`
    select column_name, udt_name from information_schema.columns
    where table_schema='public' and table_name='users'`;
  const porNome = new Map(cols.map((c) => [c.column_name, c]));

  for (const col of COLUNAS_EQUIPAR) {
    const achada = porNome.get(col);
    if (!achada) nok(`users.${col} não existe`, "coluna do Bloco 1 — a migration não foi aplicada");
    else if (achada.udt_name !== "text") nok(`users.${col} tem tipo ${achada.udt_name}`, "slug é text");
    else ok(`users.${col} existe (text)`);
  }

  // Sem a FK, um UPDATE grava slug que não existe e o compositor recebe lixo.
  const fks = await db<{ conname: string; def: string }[]>`
    select con.conname, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname='public' and rel.relname='users' and con.contype='f'
      and pg_get_constraintdef(con.oid) ilike '%avatar_catalogo%'`;

  for (const col of COLUNAS_EQUIPAR) {
    if (fks.some((f) => new RegExp(`\\(${col}\\)`).test(f.def))) {
      ok(`users.${col} referencia avatar_catalogo`);
    } else {
      nok(
        `users.${col} sem FK para avatar_catalogo`,
        "sem ela, slug inexistente entra na coluna e a tela pede uma peça que não existe",
      );
    }
  }

  const [{ existe: temRpc }] = await db<{ existe: boolean }[]>`
    select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname='equipar_peca'
    ) as existe`;

  if (!temRpc) {
    nok("RPC equipar_peca não existe", "é ela quem confere o direito; sem ela o cadeado é enfeite");
    return { passed, failed };
  }
  ok("RPC equipar_peca existe");

  const [{ pode }] = await db<{ pode: boolean }[]>`
    select has_function_privilege(
      'authenticated', 'public.equipar_peca(text, text)', 'EXECUTE') as pode`;
  if (pode) ok("equipar_peca é executável por authenticated");
  else nok("authenticated não executa equipar_peca", "o navegador não conseguiria trocar de peça");

  // --- 2. A trava anti-v2: banco == código, slot a slot --------------------
  console.log("\n2. Os slugs do banco são exatamente os do código, slot a slot");

  const linhas = await db<{ slug: string; slot: string; origem: string }[]>`
    select slug, slot, origem from public.avatar_catalogo order by slot, slug`;

  const slotsDoBanco = new Set(linhas.map((l) => l.slot));
  const forasteiros = [...slotsDoBanco].filter((s) => !SLOTS.includes(s as never));
  if (forasteiros.length > 0) {
    nok(
      `${forasteiros.length} slot(s) no banco fora dos cinco: ${forasteiros.join(", ")}`,
      "o CHECK de avatar_catalogo.slot devia ter recusado — constraint dropada ou migration fora do plano",
    );
  } else {
    ok("nenhum slot fora dos cinco declarados");
  }

  let totalBanco = 0;
  let totalCodigo = 0;

  for (const slot of SLOTS) {
    const noBanco = new Set(linhas.filter((l) => l.slot === slot).map((l) => l.slug));
    const noCodigo = new Set(CATALOGO[slot]);
    totalBanco += noBanco.size;
    totalCodigo += noCodigo.size;

    const sobrando = [...noBanco].filter((s) => !noCodigo.has(s));
    const faltando = [...noCodigo].filter((s) => !noBanco.has(s));

    if (sobrando.length > 0) {
      nok(
        `slot ${slot}: ${sobrando.length} slug(s) no banco que o código não desenha — ${sobrando.join(", ")}`,
        "é o pecado da v2 (8 uniformes semeados, 0 renderáveis): cadeado que abre para o nada",
      );
    }
    if (faltando.length > 0) {
      nok(
        `slot ${slot}: ${faltando.length} peça(s) do código sem linha no banco — ${faltando.join(", ")}`,
        "o servidor negaria uma peça que a tela oferece — falta a seed",
      );
    }
    if (sobrando.length === 0 && faltando.length === 0) {
      ok(
        `slot ${slot}: ${noBanco.size} slug(s) iguais dos dois lados` +
          (noBanco.size > 0 ? ` (${[...noBanco].sort().join(", ")})` : ""),
      );
    }
  }

  if (totalBanco === 0 && totalCodigo === 0) {
    info(
      "catálogo vazio dos dois lados — é o estado esperado do Bloco 1, que é encanamento e não " +
        "desenha peça. A conferência 4 abaixo planta as suas próprias peças para não medir o vazio.",
    );
  }

  // --- 3. Os dados do catálogo são coerentes -------------------------------
  console.log("\n3. Origem × colunas, e a economia do traje (1 inicial + o resto de baú)");

  const incoerentes = await db<{ slug: string; origem: string; motivo: string }[]>`
    select slug, origem,
           case
             when origem = 'marco_nivel'
               and (min_level is null or min_tier is not null or raridade is not null)
               then 'marco_nivel precisa de min_level e só dele'
             when origem = 'marco_patente'
               and (min_tier is null or min_level is not null or raridade is not null)
               then 'marco_patente precisa de min_tier e só dele'
             when origem = 'bau'
               and (raridade is null or min_level is not null or min_tier is not null)
               then 'bau precisa de raridade e só dela'
           end as motivo
    from public.avatar_catalogo
    where case
            when origem = 'marco_nivel'
              then (min_level is null or min_tier is not null or raridade is not null)
            when origem = 'marco_patente'
              then (min_tier is null or min_level is not null or raridade is not null)
            when origem = 'bau'
              then (raridade is null or min_level is not null or min_tier is not null)
            else true
          end`;

  if (incoerentes.length > 0) {
    nok(
      `${incoerentes.length} peça(s) com origem incoerente`,
      incoerentes.map((p) => `${p.slug}: ${p.motivo}`).join(" | ") +
        " — o CHECK composto devia ter recusado; constraint dropada?",
    );
  } else {
    ok("toda peça traz a régua da própria origem, e só ela");
  }

  // A economia do traje: 1 inicial + o resto todo de baú.
  //
  // ESTA CONFERÊNCIA FOI VIRADA DO AVESSO EM 2026-08-13. Ela media o contrário —
  // "nenhum traje no pool de baú", a trava nº 3 do doc 21 §1.3 — e a premissa dela
  // caiu com o vínculo patente→traje: o mérito de patente agora é a MOLDURA, e o
  // traje virou a principal peça de baú do produto (39 das 40).
  //
  // O que ela mede agora é a economia decidida (doc 21 §0.6, doc 22 §1), e ela tem
  // dentes nos dois sentidos:
  //
  //   (i)  NENHUM traje é `marco_patente`. É a trava contra a reintrodução silenciosa
  //        do vínculo — se alguém semear um traje por patente, a moldura passa a
  //        competir com a roupa pelo mesmo sinal, que é o defeito que a virada
  //        desfez.
  //   (ii) NO MÁXIMO UM traje é `marco_nivel`. Dois iniciais é uma economia que
  //        ninguém decidiu, e ela apareceria em produção como duas peças grátis na
  //        criação do avatar.
  const trajes = await db<{ slug: string; origem: string }[]>`
    select slug, origem from public.avatar_catalogo where slot = 'traje' order by slug`;

  const trajePorPatente = trajes.filter((t) => t.origem === "marco_patente");
  if (trajePorPatente.length > 0) {
    nok(
      `${trajePorPatente.length} traje(s) com origem 'marco_patente': ${trajePorPatente.map((t) => t.slug).join(", ")}`,
      "o vínculo patente→traje foi desfeito em 2026-08-13 (doc 21 §0): a patente dá MOLDURA, " +
        "não roupa. Traje por patente faz a moldura e a roupa disputarem o mesmo sinal",
    );
  } else {
    ok("nenhum traje amarrado a patente (a patente dá moldura, não roupa)");
  }

  const iniciais = trajes.filter((t) => t.origem === "marco_nivel");
  if (iniciais.length > 1) {
    nok(
      `${iniciais.length} trajes iniciais: ${iniciais.map((t) => t.slug).join(", ")}`,
      "a economia decidida é 1 inicial + o resto por baú (doc 22 §1) — dois iniciais é " +
        "uma segunda peça grátis que ninguém decidiu dar",
    );
  } else if (iniciais.length === 1) {
    ok(`1 traje inicial (${iniciais[0]!.slug}), o resto sai de baú`);
  } else {
    info("nenhum traje semeado ainda — o inicial chega no B5, e os de baú a partir dele");
  }

  // A pirâmide é MEDIDA e relatada; ela só ganha dentes no Bloco 4, junto do
  // claim_chest v3, que é quem define o que fazer com um pool vazio. Cobrar
  // forma de pirâmide antes de existir sorteio seria inventar régua.
  const pool = await db<{ raridade: string; n: number }[]>`
    select raridade, count(*)::int as n from public.avatar_catalogo
    where origem = 'bau' group by raridade order by raridade`;

  if (pool.length === 0) {
    info("pool de baú vazio — nada a sortear ainda (o baú volta a dar peça no Bloco 4)");
  } else {
    info(`pool de baú: ${pool.map((p) => `${p.raridade} ${p.n}`).join(" · ")}`);
  }

  // --- 4. A régua é do servidor (negação medida, papel authenticated) ------
  console.log("\n4. equipar_peca recusa quem não tem direito (papel authenticated)");

  const [cobaia] = await db<{ id: string; email: string; level: number }[]>`
    select id, email, level from public.users
    where role in ('aluno','professor') order by created_at limit 1`;

  if (!cobaia) {
    nok("nenhum aluno ou professor no banco", "a simulação precisa de uma conta para personificar");
    return { passed, failed };
  }
  info(`cobaia: ${cobaia.email} (nível ${cobaia.level})`);

  // As peças plantadas. Existem só dentro desta transação e são o que impede a
  // conferência de passar por vacuidade com o catálogo real ainda vazio.
  //
  // A COBAIA É `pet`, E ERA `fundo` ATÉ 2026-08-13 — quando o slot `fundo` morreu
  // (achado G23), esta bateria precisou de outro slot vazio. `pet` foi escolhido
  // por duas razões medidas: a conferência (a) precisa de DOIS slots distintos —
  // planta num, tenta gravar no outro —, e com `pet` ela continua sendo pet→chapeu,
  // sem mudar de forma; e `pet` nasce `[]` sem registro derivado, ao contrário de
  // `traje`, que sai de `Object.keys(TRAJES_DA_ARTE)` e já tem duas peças reais.
  //
  // A ordem protege o gate: a conferência 2 (banco × código, slot a slot) roda
  // ANTES deste insert, então plantar aqui não desequilibra a comparação.
  const livre = `${FIXTURE}-pet-livre`;
  const alto = `${FIXTURE}-pet-alto`;
  const dono = `${FIXTURE}-rosto-do-bau`;
  const alheio = `${FIXTURE}-rosto-alheio`;

  await db`
    insert into public.avatar_catalogo (slug, slot, origem, min_level, raridade) values
      (${livre},  'pet',   'marco_nivel', 1,    null),
      (${alto},   'pet',   'marco_nivel', 9999, null),
      (${dono},   'rosto', 'bau',         null, 'rare'),
      (${alheio}, 'rosto', 'bau',         null, 'epic')`;

  await db`
    insert into public.avatar_guarda_roupa (user_id, slug, fonte)
    values (${cobaia.id}, ${dono}, 'bau')`;

  info(`4 peças plantadas na transação (prefixo ${FIXTURE}) — nenhuma sobrevive ao ROLLBACK`);

  await db`select set_config('request.jwt.claims', ${JSON.stringify({
    sub: cobaia.id,
    role: "authenticated",
  })}, true)`;
  await db`set local role authenticated`;

  // (a) peça de outro slot — NEGADA
  const errSlot = await tentar(db, "sp_slot", () =>
    db`select public.equipar_peca('chapeu', ${livre})`,
  );
  if (errSlot) {
    ok(`equipar a peça de pet "${livre}" no slot chapeu foi NEGADO`);
    info(`mensagem do servidor: ${errSlot.split("\n")[0]}`);
  } else {
    nok(
      "equipar peça de um slot na coluna de outro foi ACEITO",
      "a FK aceita qualquer slug do catálogo — só a RPC sabe que a peça é de outro slot, e ela não conferiu",
    );
  }

  // (b) sem direito, por marco de nível — NEGADA
  const errNivel = await tentar(db, "sp_nivel", () =>
    db`select public.equipar_peca('pet',${alto})`,
  );
  if (errNivel) {
    ok(`equipar "${alto}" (exige nível 9999) no nível ${cobaia.level} foi NEGADO`);
    info(`mensagem do servidor: ${errNivel.split("\n")[0]}`);
  } else {
    nok(
      "equipar peça acima do nível foi ACEITO",
      "a régua do banco não está sendo conferida, e o cadeado do editor é enfeite de CSS",
    );
  }

  // (c) slug inexistente — NEGADO
  const errSlug = await tentar(db, "sp_slug", () =>
    db`select public.equipar_peca('pet','peca-que-nao-existe')`,
  );
  if (errSlug) ok("slug inexistente foi NEGADO");
  else nok("slug inexistente foi ACEITO", "a RPC não confere existência — grava lixo em users");

  // (d) peça de baú que o aluno NÃO ganhou — NEGADA
  const errBau = await tentar(db, "sp_bau", () =>
    db`select public.equipar_peca('rosto', ${alheio})`,
  );
  if (errBau) {
    ok(`equipar "${alheio}" (de baú, sem linha no guarda-roupa) foi NEGADO`);
  } else {
    nok(
      "equipar peça de baú que o aluno não ganhou foi ACEITO",
      "o guarda-roupa deixaria de significar alguma coisa: qualquer slug de baú seria vestível",
    );
  }

  // O TRAJE **ANTES** DOS DOIS EQUIPAMENTOS — e é este valor que a conferência (g)
  // compara depois. Ver o bloco de comentário dela: a versão anterior afirmava um
  // valor literal (`=== null`) em vez de comparar, e por isso media outra coisa.
  const [antes] = await db<{ traje: string | null }[]>`
    select avatar_traje as traje from public.users where id = ${cobaia.id}`;

  // (e) peça a que se tem direito por NÍVEL — aceita E persistida.
  //     Um gate que só nega passa por vacuidade se a RPC negar tudo.
  const errLivre = await tentar(db, "sp_livre", () =>
    db`select public.equipar_peca('pet',${livre})`,
  );
  // (f) peça a que se tem direito pelo GUARDA-ROUPA — aceita.
  const errDono = await tentar(db, "sp_dono", () =>
    db`select public.equipar_peca('rosto', ${dono})`,
  );

  const [gravado] = await db<{ pet: string | null; rosto: string | null; traje: string | null }[]>`
    select avatar_pet as pet, avatar_rosto as rosto, avatar_traje as traje
    from public.users where id = ${cobaia.id}`;

  if (!errLivre && gravado?.pet === livre) {
    ok(`equipar "${livre}" (nível 1) foi aceito e PERSISTIU`);
  } else {
    nok(
      `equipar "${livre}" (nível 1) não persistiu`,
      `erro: ${errLivre ?? "nenhum"} — gravado: ${JSON.stringify(gravado)}`,
    );
  }

  if (!errDono && gravado?.rosto === dono) {
    ok(`equipar "${dono}" (de baú, com linha no guarda-roupa) foi aceito e PERSISTIU`);
  } else {
    nok(
      `equipar "${dono}" pelo guarda-roupa não persistiu`,
      `erro: ${errDono ?? "nenhum"} — gravado: ${JSON.stringify(gravado)}`,
    );
  }

  // ------------------------------------------------------------------------
  // (g) UM SLOT POR CHAMADA: a coluna dos outros slots tem de CONTINUAR A MESMA
  // ------------------------------------------------------------------------
  //
  // Ela afirmava `gravado?.traje === null`, e isso é o achado **G26** (2026-08-17):
  // a conferência prometia *"equipar um slot não mexeu nos outros"* e testava *"o
  // traje está vazio"*, que é outra coisa. Errava nas duas direções:
  //
  //  - **falso VERDE**, o silencioso: com a coluna nula — o estado durante toda a
  //    vida deste gate — uma RPC que ZERASSE o traje passaria igual. Era aprovação
  //    por vacuidade, o modo de falha nº 1 desta base de código;
  //  - **falso VERMELHO**: bastou o Doug equipar um traje na cobaia em produção
  //    para a conferência reprovar uma RPC que estava certa.
  //
  // Comparar antes × depois mata os dois: não existe estado do guarda-roupa da
  // cobaia que faça esta linha mentir, e ela passa a medir o que o nome dela diz.
  if (gravado?.traje === antes?.traje) {
    ok(
      `equipar um slot não mexeu nos outros três ` +
        `(avatar_traje era ${JSON.stringify(antes?.traje)} e continua)`,
    );
  } else {
    nok(
      `equipar pet/rosto mexeu em avatar_traje ` +
        `(era ${JSON.stringify(antes?.traje)}, virou ${JSON.stringify(gravado?.traje)})`,
      "o CASE do UPDATE tem de preservar as colunas dos outros slots",
    );
  }

  // (g2) A NEGAÇÃO MEDIDA — a comparação acima sabe reprovar?
  //
  // Régua nova entra com controle negativo ao lado, e aqui ele não é opcional: a
  // régua que esta substitui passava por vacuidade, e trocar uma vacuidade por
  // outra seria o mesmo erro com outra roupagem. Então a coluna é mexida de
  // propósito e a MESMA comparação é refeita — ela tem de acusar.
  //
  // É seguro: tudo isto vive na transação que o `finally` desfaz com ROLLBACK, a
  // mesma que já planta e apaga as 4 peças de fixture.
  await db`set local role postgres`;
  await db`update public.users set avatar_traje = null where id = ${cobaia.id}`;
  const [sabotado] = await db<{ traje: string | null }[]>`
    select avatar_traje as traje from public.users where id = ${cobaia.id}`;
  await db`update public.users set avatar_traje = ${antes?.traje ?? null} where id = ${cobaia.id}`;
  await db`set local role authenticated`;

  if (antes?.traje === null) {
    // Cobaia sem traje equipado: zerar não muda nada, e o controle não teria o que
    // provar. Dizer isso em voz alta é melhor que imprimir um verde que não mediu.
    info(
      "controle negativo NÃO RODOU: a cobaia está sem traje, então zerar a coluna não " +
        "produz diferença. Equipe um traje nela para o controle ter o que medir.",
    );
  } else if (sabotado?.traje !== antes?.traje) {
    ok("controle negativo: a comparação ACUSA quando a coluna muda — ela não é vácua");
  } else {
    nok(
      "controle negativo falhou: zerar avatar_traje não produziu diferença",
      "a comparação de (g) está lendo algo que não muda — ela aprovaria qualquer coisa",
    );
  }

  // (h) tirar a peça — NULL é valor legítimo, sempre permitido.
  const errNulo = await tentar(db, "sp_nulo", () => db`select public.equipar_peca('pet',null)`);
  const [depois] = await db<{ pet: string | null }[]>`
    select avatar_pet as pet from public.users where id = ${cobaia.id}`;
  if (!errNulo && depois?.pet === null) {
    ok("tirar a peça (p_slug NULL) foi aceito");
  } else {
    nok(
      "tirar a peça (p_slug NULL) não funcionou",
      `erro: ${errNulo ?? "nenhum"} — ausência de peça não tem régua a satisfazer`,
    );
  }

  // (i) slot inventado — NEGADO. Sem isto, um slot novo passaria despercebido
  //     gravando em coluna nenhuma e devolvendo sucesso.
  const errSlotFalso = await tentar(db, "sp_slot_falso", () =>
    db`select public.equipar_peca('capa', ${livre})`,
  );
  if (errSlotFalso) ok("slot inventado ('capa') foi NEGADO");
  else nok("slot inventado foi ACEITO", "a RPC gravaria em coluna nenhuma e devolveria sucesso");

  // (j) a régua não é editável por quem ela governa.
  const errEscritaCat = await tentar(db, "sp_escrita_cat", () =>
    db`update public.avatar_catalogo set min_level = 1 where slug = ${alto}`,
  );
  if (errEscritaCat) ok("authenticated não escreve em avatar_catalogo");
  else
    nok(
      "authenticated escreveu no próprio catálogo",
      "baixar o min_level da peça destrava qualquer coisa sem marco nenhum",
    );

  const errEscritaGr = await tentar(db, "sp_escrita_gr", () =>
    db`insert into public.avatar_guarda_roupa (user_id, slug, fonte) values (${cobaia.id}, ${alheio}, 'bau')`,
  );
  if (errEscritaGr) ok("authenticated não escreve em avatar_guarda_roupa");
  else
    nok(
      "authenticated deu a si mesmo uma peça de baú",
      "o sorteio do baú deixaria de significar alguma coisa: bastaria um INSERT no devtools",
    );

  await db`reset role`;
  return { passed, failed };
}

class Rollback extends Error {}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: catálogo de slots (banco x código)");
  console.log("========================================");

  let rel: Relatorio = { passed: 0, failed: 0 };

  try {
    try {
      await sql.begin(async (tx) => {
        rel = await conferir(tx as unknown as Sql);
        throw new Rollback();
      });
    } catch (e) {
      if (!(e instanceof Rollback)) throw e;
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${rel.passed} passed | ${rel.failed} failed`);
  console.log("========================================");
  if (rel.failed > 0) process.exit(1);
  console.log("\nGate do catálogo de slots: OK");
}

// `conferir` é importada pelo ensaio a seco; sem esta guarda, importar o módulo
// dispararia o gate inteiro como efeito colateral.
const executadoDireto =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) {
  main().catch((e) => {
    console.error("Erro no gate:", e.message);
    process.exit(1);
  });
}
