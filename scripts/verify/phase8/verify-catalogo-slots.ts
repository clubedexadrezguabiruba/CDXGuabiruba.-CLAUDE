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

/** As 5 colunas de equipar que o Bloco 1 acrescentou a `users`. */
const COLUNAS_EQUIPAR = [
  "avatar_traje",
  "avatar_chapeu",
  "avatar_rosto",
  "avatar_fundo",
  "avatar_pet",
] as const;

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
  console.log("\n3. Origem × colunas, e o traje que não sai de baú");

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

  const trajeDeBau = await db<{ slug: string }[]>`
    select slug from public.avatar_catalogo where slot = 'traje' and origem = 'bau'`;
  if (trajeDeBau.length > 0) {
    nok(
      `${trajeDeBau.length} traje(s) saindo de baú: ${trajeDeBau.map((t) => t.slug).join(", ")}`,
      "uniforme é mérito de patente (doc 21 §1.3, trava nº 3) — sair de baú apaga o mérito",
    );
  } else {
    ok("nenhum traje no pool de baú");
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
  const livre = `${FIXTURE}-fundo-livre`;
  const alto = `${FIXTURE}-fundo-alto`;
  const dono = `${FIXTURE}-rosto-do-bau`;
  const alheio = `${FIXTURE}-rosto-alheio`;

  await db`
    insert into public.avatar_catalogo (slug, slot, origem, min_level, raridade) values
      (${livre},  'fundo', 'marco_nivel', 1,    null),
      (${alto},   'fundo', 'marco_nivel', 9999, null),
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
    ok(`equipar a peça de fundo "${livre}" no slot chapeu foi NEGADO`);
    info(`mensagem do servidor: ${errSlot.split("\n")[0]}`);
  } else {
    nok(
      "equipar peça de um slot na coluna de outro foi ACEITO",
      "a FK aceita qualquer slug do catálogo — só a RPC sabe que a peça é de outro slot, e ela não conferiu",
    );
  }

  // (b) sem direito, por marco de nível — NEGADA
  const errNivel = await tentar(db, "sp_nivel", () =>
    db`select public.equipar_peca('fundo', ${alto})`,
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
    db`select public.equipar_peca('fundo', 'peca-que-nao-existe')`,
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

  // (e) peça a que se tem direito por NÍVEL — aceita E persistida.
  //     Um gate que só nega passa por vacuidade se a RPC negar tudo.
  const errLivre = await tentar(db, "sp_livre", () =>
    db`select public.equipar_peca('fundo', ${livre})`,
  );
  // (f) peça a que se tem direito pelo GUARDA-ROUPA — aceita.
  const errDono = await tentar(db, "sp_dono", () =>
    db`select public.equipar_peca('rosto', ${dono})`,
  );

  const [gravado] = await db<{ fundo: string | null; rosto: string | null; traje: string | null }[]>`
    select avatar_fundo as fundo, avatar_rosto as rosto, avatar_traje as traje
    from public.users where id = ${cobaia.id}`;

  if (!errLivre && gravado?.fundo === livre) {
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

  // (g) um slot por chamada: os outros quatro não podem ter sido zerados.
  if (gravado?.traje === null) {
    ok("equipar um slot não mexeu nos outros quatro (avatar_traje segue NULL)");
  } else {
    nok(
      `equipar fundo/rosto mexeu em avatar_traje (virou ${JSON.stringify(gravado?.traje)})`,
      "o CASE do UPDATE tem de preservar as colunas dos outros slots",
    );
  }

  // (h) tirar a peça — NULL é valor legítimo, sempre permitido.
  const errNulo = await tentar(db, "sp_nulo", () => db`select public.equipar_peca('fundo', null)`);
  const [depois] = await db<{ fundo: string | null }[]>`
    select avatar_fundo as fundo from public.users where id = ${cobaia.id}`;
  if (!errNulo && depois?.fundo === null) {
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
