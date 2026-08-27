/**
 * GATE DO BAÚ — o contrato do E.2: XP direto, na hora, em toda raridade.
 *
 * O NOME DO SCRIPT É LEGADO. Ele nasceu como "ponte dos baús" (T0.5), medindo
 * se todo item sorteado aparecia no boneco; virou, no Bloco A, o gate de "o baú
 * sobrevive a um catálogo vazio". O caminho e o nome npm ficaram para não
 * espalhar churn por package.json, verify:all e o painel a cada troca de
 * contrato.
 *
 * O QUE ESTE GATE PROVA AGORA
 * ---------------------------
 * **REESCRITO NO B6 (2026-08-13), quando o baú voltou a dar PEÇA.** Até então ele
 * media a decisão do T9 na forma dela de 2026-08-10: *toda* abertura paga XP na
 * hora. A decisão não foi revogada — ela ganhou objeto. Agora:
 *
 *  - o baú **nunca sai de mãos vazias** (a lição da T9, intacta), mas o que sai é
 *    **peça OU XP**;
 *  - o **XP é um prêmio dentro do pool `common`**, não o prêmio de toda raridade;
 *  - fora do `common`, XP só é legítimo como **fallback de pool esgotado** — e o
 *    gate mede a diferença, porque ela é medível: se há peça inédita naquela
 *    raridade, XP ali é desenho errado;
 *  - **nenhum baú cria ovo.** O ovo não morreu, hiberna esperando o pet do Bloco
 *    8, e este gate continua cobrando que as duas funções dele **existam** e
 *    **não sejam chamadas**.
 *
 * As conferências 1, 2 e 3 não mudaram uma linha: elas são sobre o ovo, e o ovo
 * continua dormindo.
 *
 * AS CINCO CONFERÊNCIAS
 * ---------------------
 *  1. O corpo das funções, lido de `pg_get_functiondef`: `claim_chest` não
 *     chama mais o criador de ovo; nenhuma das três consulta `items` ou filtra
 *     `renderable` (anti-regressão do Bloco A); e as duas dormentes continuam
 *     no banco.
 *  2. A prova MECÂNICA de "0 ovos": `_create_random_pet_egg` é a única função
 *     que insere em `user_eggs`, e ninguém a chama. Sem isto, "0 ovos em 60
 *     aberturas" seria só amostragem com sorte.
 *  3. A fila de produção está vazia — é o que a migration esvaziou, e é o que
 *     mantém a Chocadeira do /perfil sem ovo fantasma.
 *  4. 60 aberturas reais: zero exceção, zero ovo criado, **peça ou XP em todas**,
 *     XP fora do `common` só com pool esgotado, e **nenhuma peça repetida** — o
 *     pool é de inéditas, e repetir prova que o `NOT EXISTS` não enxerga a linha
 *     que a abertura anterior gravou.
 *  5. A escala 15/25/40/60 bate por raridade **nas aberturas que pagaram XP**, no
 *     JSON devolvido **e** no ledger `xp_grants` — prometer XP e não creditar é a
 *     falha que some sem sintoma. E a peça concedida tem de estar no
 *     guarda-roupa: prometer slug sem gravar a linha entrega uma peça que
 *     `equipar_peca` recusa no clique seguinte.
 *
 * ⚠️ POR QUE O CORPO É LIDO SEM COMENTÁRIO
 * A migration do E.2 explica, dentro do próprio corpo de `claim_chest`, que
 * `_create_random_pet_egg` continua viva. Procurar o nome no texto cru reprova
 * pela explicação da mudança — foi a lição 3 do Bloco B, e o ensaio a seco do
 * E.2 a repetiu antes deste arquivo existir.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Tudo roda dentro de UMA transação que termina em ROLLBACK, personificando um
 * usuário existente por `set_config('request.jwt.claims', ...)` — que é de onde
 * `auth.uid()` lê. Nenhuma linha sobrevive: nem baú, nem ovo, nem XP.
 *
 * As conferências vivem em `conferir(db)`, que recebe o handle de fora, para
 * que o ensaio a seco de uma migration possa rodá-las **dentro da mesma
 * transação em que a migration foi aplicada**. Sem banco separado (D3), é o
 * único jeito de medir "passa depois" sem aplicar em produção.
 *
 * Uso: npm run verify:chest-pool
 */

import { resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import type { Sql } from "postgres";
import { getDbUrl } from "../db-url";

/** Quantos baús abrir na simulação. */
const ABERTURAS = 60;

/** A escala do E.2 — era a do ovo, e passou a valer para toda raridade. */
const ESCALA: Record<string, number> = {
  common: 15,
  rare: 25,
  epic: 40,
  legendary: 60,
};

/** As três funções que o Bloco A desamarrou de `items`. */
const FUNCOES = ["claim_chest", "_create_random_pet_egg", "hatch_egg"] as const;

/** As duas que hibernam esperando o pet do Bloco 8 — existir é o contrato. */
const DORMENTES = ["_create_random_pet_egg", "hatch_egg"] as const;

interface Resultado {
  is_egg?: boolean;
  /** As duas chaves NOVAS do v3 (B6). Ausentes quando o prêmio foi XP. */
  item_slug?: string;
  item_slot?: string;
  is_xp?: boolean;
  rarity?: string;
  scrapped_xp?: number;
}

/**
 * Tira comentário de SQL antes de procurar chamada no corpo.
 *
 * Sem isto o gate reprova pela explicação da própria mudança: a migration do
 * E.2 nomeia `_create_random_pet_egg` num comentário para dizer que ela ficou
 * viva de propósito.
 */
function semComentario(sqlSrc: string): string {
  return sqlSrc.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
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

  // --- 1. O corpo das funções ---
  console.log("\n1. O corpo das três funções do subsistema");

  const fns = await db<{ proname: string; def: string }[]>`
    select p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.prokind='f'
      and p.proname = any(${FUNCOES as unknown as string[]})`;

  for (const nome of FUNCOES) {
    const f = fns.find((x) => x.proname === nome);
    if (!f) {
      nok(`${nome} não existe no banco`, "RPC do subsistema de baús sumiu");
      continue;
    }
    const corpo = semComentario(f.def);

    // `public.items` e `from items` — o que interessa é a tabela, não a
    // palavra solta ("item_scrap" e "item_rarity" são legítimos e continuam).
    if (/\b(from|join|update|into)\s+(public\.)?items\b/i.test(corpo)) {
      nok(
        `${nome} ainda consulta a tabela items`,
        "com o catálogo vazio esta função quebra — é o que o Bloco A cortou",
      );
    } else {
      ok(`${nome} não consulta items`);
    }

    if (/\brenderable\b/.test(corpo)) {
      nok(
        `${nome} ainda filtra por renderable`,
        "a ponte T0.5 saiu com o catálogo; a coluna morreu no Bloco B",
      );
    } else {
      ok(`${nome} não menciona renderable`);
    }
  }

  const claim = fns.find((x) => x.proname === "claim_chest");
  if (claim) {
    if (/_create_random_pet_egg\s*\(/.test(semComentario(claim.def))) {
      nok(
        "claim_chest ainda cria ovo",
        "a decisão do T9 é XP direto na hora; ovo sem pet dentro é espera de 72h por moeda que já podia estar na mão",
      );
    } else {
      ok("claim_chest não cria ovo (a chamada saiu, o comentário pode ficar)");
    }
  }

  for (const nome of DORMENTES) {
    if (fns.some((x) => x.proname === nome)) {
      ok(`${nome} continua existindo (dormente, não apagada)`);
    } else {
      nok(
        `${nome} foi apagada`,
        "o T9 decidiu hibernar o ovo, não matá-lo: é por esta função que o pet volta no Bloco 8",
      );
    }
  }

  // --- 2. A prova mecânica de que nada cria ovo ---
  console.log("\n2. Ninguém mais cria ovo (prova mecânica, não amostral)");

  const inserem = await db<{ proname: string }[]>`
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.prokind='f'
      and pg_get_functiondef(p.oid) ilike '%insert into public.user_eggs%'
    order by 1`;

  const nomesInserem = inserem.map((r) => r.proname);
  if (nomesInserem.length === 1 && nomesInserem[0] === "_create_random_pet_egg") {
    ok("só _create_random_pet_egg insere em user_eggs");
  } else {
    nok(
      `quem insere em user_eggs: ${nomesInserem.join(", ") || "(ninguém)"}`,
      "esperado exatamente _create_random_pet_egg — outro caminho de criação escaparia das 60 aberturas",
    );
  }

  const chamam = await db<{ proname: string }[]>`
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.prokind='f' and p.proname <> '_create_random_pet_egg'
      and regexp_replace(pg_get_functiondef(p.oid), '--[^\n]*', ' ', 'g')
          ilike '%_create_random_pet_egg%'
    order by 1`;

  if (chamam.length === 0) {
    ok("nenhuma função chama _create_random_pet_egg");
  } else {
    nok(
      `${chamam.map((r) => r.proname).join(", ")} chama _create_random_pet_egg`,
      "enquanto não houver pet, nada cria ovo — decisão acessória do T9",
    );
  }

  const trg = await db<{ tgname: string }[]>`
    select t.tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where not t.tgisinternal and c.relname = 'user_eggs'`;
  if (trg.length === 0) ok("nenhum trigger em user_eggs");
  else nok(`trigger em user_eggs: ${trg.map((t) => t.tgname).join(", ")}`, "caminho de criação fora das RPCs");

  // --- 3. A fila de produção está vazia ---
  console.log("\n3. A fila de ovos em produção");

  const [fila] = await db<{ na_fila: number; xp_preso: number }[]>`
    select count(*) filter (where status in ('hatching','queued'))::int as na_fila,
           coalesce(sum(xp_bonus) filter (where status in ('hatching','queued')),0)::int as xp_preso
    from user_eggs`;

  if (fila.na_fila === 0) {
    ok("0 ovos em voo — nenhum XP preso em espera");
  } else {
    nok(
      `${fila.na_fila} ovos ainda na fila, ${fila.xp_preso} XP presos`,
      "a fila choca em série, 72h por ovo: é o achado T9 inteiro",
    );
  }

  // --- 4. 60 aberturas reais ---
  console.log(`\n4. ${ABERTURAS} aberturas reais — peça OU XP, e nada repetido`);

  const [cobaia] = await db<{ id: string; email: string }[]>`
    select id, email from users order by created_at limit 1`;
  if (!cobaia) {
    nok("nenhum usuário no banco", "a simulação precisa de uma conta para personificar");
    return { passed, failed };
  }
  console.log(`   personificando ${cobaia.email} (nada é gravado: ROLLBACK ao final)`);

  await db`select set_config('request.jwt.claims', ${JSON.stringify({
    sub: cobaia.id,
    role: "authenticated",
  })}, true)`;

  const [ovosAntes] = await db<{ n: number }[]>`select count(*)::int as n from user_eggs`;

  // O XP NÃO PODE APARECER FORA DO `common` — a não ser como fallback de pool
  // vazio, que é legítimo. A distinção é medível: se houver peça inédita daquela
  // raridade no catálogo, XP ali é o desenho errado, não o degradar previsto.
  //
  // ⚠️ ESTA QUERY RODA **ANTES** DO LAÇO, e o lugar dela é a conferência.
  // Ela media o pool DEPOIS das 60 aberturas até 2026-08-23 — e as aberturas
  // esvaziam o próprio pool que se quer medir: peça sorteada vira linha em
  // `avatar_guarda_roupa` e some do `NOT EXISTS`. Medido na produção daquele dia:
  // pool real `legendary 1`, pool medido `(vazio)`, porque a `rosto-barba-trancada`
  // saiu no meio do laço. Com o pool lido como vazio, **todo** XP fora do `common`
  // vira "fallback legítimo" e a conferência aprova por VACUIDADE. Não aparecia
  // porque o pool não-common tinha uma peça só; com o cabelo dentro do catálogo
  // ele fica grande, e o verde falso cairia justamente aqui.
  const inedito = await db<{ raridade: string; n: number }[]>`
    select c.raridade, count(*)::int as n
    from avatar_catalogo c
    where c.origem = 'bau'
      and not exists (
        select 1 from avatar_guarda_roupa g
        where g.user_id = ${cobaia.id} and g.slug = c.slug)
    group by c.raridade`;
  const poolDe = new Map(inedito.map((r) => [r.raridade, r.n]));
  console.log(
    `   pool inédito ANTES das ${ABERTURAS} aberturas: ` +
      (inedito.length ? inedito.map((r) => `${r.raridade} ${r.n}`).join(" · ") : "(vazio)"),
  );

  const resultados: Resultado[] = [];
  const chaves: string[] = [];
  let erro: string | null = null;

  try {
    for (let n = 0; n < ABERTURAS; n++) {
      const [c] = await db<{ id: number }[]>`
        insert into user_chests (user_id, source_type, source_id)
        values (${cobaia.id}, 'level_up', ${`gate_chest_pool_${n}`})
        returning id::int as id`;
      const [r] = await db<{ res: Resultado }[]>`
        select public.claim_chest(${c.id}::bigint) as res`;
      resultados.push(r.res);
      chaves.push(`scrap_chest_${c.id}`);
    }
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  if (erro) {
    nok(
      `abertura de baú lançou exceção antes de completar ${ABERTURAS}`,
      `${erro} — é a falha que trava as 5 fontes de baú de uma vez`,
    );
    return { passed, failed };
  }
  ok(`${ABERTURAS} aberturas, zero exceção`);

  const [ovosDepois] = await db<{ n: number }[]>`select count(*)::int as n from user_eggs`;
  const criados = ovosDepois.n - ovosAntes.n;
  if (criados === 0) {
    ok(`0 ovos criados em ${ABERTURAS} aberturas`);
  } else {
    nok(
      `${criados} ovos criados em ${ABERTURAS} aberturas`,
      "enquanto não houver pet, o baú paga na hora — a espera não tem conteúdo",
    );
  }

  // O XP deixou de ser TODO prêmio, e virou UM prêmio — só no pool `common`.
  // Toda abertura tem de entregar exatamente uma das duas coisas.
  const nemUmNemOutro = resultados.filter((r) => !r.is_xp && !r.item_slug);
  if (nemUmNemOutro.length === 0) {
    ok(`toda abertura entregou peça OU XP (${ABERTURAS}/${ABERTURAS}) — nenhuma saiu vazia`);
  } else {
    nok(
      `${nemUmNemOutro.length} de ${ABERTURAS} aberturas não entregaram nada`,
      "é a lição da T9: o baú nunca sai de mãos vazias, e o fallback de pool vazio existe para isso",
    );
  }

  // O pool ENCOLHE durante o laço: peça sorteada vira linha no guarda-roupa e sai
  // do `NOT EXISTS`. Então nem o pool inicial nem o final julgam — só o pool **no
  // instante de cada abertura**. Medido na produção de 2026-08-23: a peça
  // `legendary` saiu na abertura #8 e os XPs `legendary` vieram em #21, #35 e #54;
  // com o pool inicial congelado os três seriam acusados, e são fallback legítimo.
  // Refazemos o pool passo a passo, na ordem em que as aberturas aconteceram.
  const restante = new Map(poolDe);
  const xpIndevido: Resultado[] = [];
  for (const r of resultados) {
    const rar = r.rarity ?? "";
    if (r.is_xp && rar !== "common" && (restante.get(rar) ?? 0) > 0) xpIndevido.push(r);
    if (r.item_slug) restante.set(rar, (restante.get(rar) ?? 0) - 1);
  }
  if (xpIndevido.length === 0) {
    ok(
      "XP só saiu no pool common ou com o pool esgotado — " +
        (inedito.length
          ? inedito.map((r) => `${r.raridade} ${r.n} inéditas`).join(" · ")
          : "nenhuma peça de baú no catálogo, então TUDO é fallback"),
    );
  } else {
    nok(
      `${xpIndevido.length} aberturas pagaram XP numa raridade que TINHA peça inédita`,
      "um baú lendário que paga 60 de XP com a peça lendária disponível é a decepção " +
        "que a raridade existe para não produzir",
    );
  }

  // Peça concedida = linha no guarda-roupa. Prometer no JSON e não gravar é a
  // mesma falha silenciosa do XP sem ledger, um andar acima: a peça apareceria no
  // modal e `equipar_peca` a recusaria no clique seguinte.
  const comPeca = resultados.filter((r) => r.item_slug);
  if (comPeca.length > 0) {
    const slugs = [...new Set(comPeca.map((r) => r.item_slug as string))];
    const [guardado] = await db<{ n: number }[]>`
      select count(*)::int as n from avatar_guarda_roupa
      where user_id = ${cobaia.id} and fonte = 'bau' and slug = any(${slugs})`;
    if (guardado.n === slugs.length) {
      ok(`as ${slugs.length} peça(s) sorteada(s) estão no guarda-roupa: ${slugs.join(", ")}`);
    } else {
      nok(
        `${slugs.length} peça(s) prometida(s) no JSON, ${guardado.n} no guarda-roupa`,
        "baú que devolve slug sem gravar a linha entrega uma peça que equipar_peca recusa",
      );
    }

    // NENHUMA PEÇA REPETIDA. O pool é de inéditas por construção, e é isto que
    // prova que o `NOT EXISTS` enxerga a linha que a abertura anterior gravou —
    // dentro da mesma transação, que é onde um `NOT EXISTS` mal escrito falharia.
    const repetidas = comPeca.length - slugs.length;
    if (repetidas === 0) {
      ok(`nenhuma peça repetida em ${comPeca.length} sorteios de peça`);
    } else {
      nok(
        `${repetidas} peça(s) sorteada(s) mais de uma vez`,
        "o pool é de INÉDITAS: repetir quer dizer que o NOT EXISTS não vê a linha " +
          "que a abertura anterior gravou",
      );
    }
  } else {
    const total = [...poolDe.values()].reduce((a, b) => a + b, 0);
    console.log(
      `  [INFO] nenhuma peça saiu nas ${ABERTURAS} aberturas — ` +
        `o catálogo de baú tem ${total} peça(s) inédita(s) para esta cobaia`,
    );
  }

  // --- 5. A escala, no JSON e no ledger ---
  console.log("\n5. A escala 15/25/40/60 nas aberturas que pagaram XP");

  const pagaramXp = resultados.filter((r) => r.is_xp);
  const fora = pagaramXp.filter((r) => r.scrapped_xp !== ESCALA[r.rarity ?? ""]);
  if (fora.length > 0) {
    const amostra = fora
      .slice(0, 5)
      .map((r) => `${r.rarity}→${r.scrapped_xp}`)
      .join(", ");
    nok(
      `${fora.length} de ${pagaramXp.length} aberturas de XP fora da escala`,
      `esperado ${JSON.stringify(ESCALA)}; veio ${amostra}`,
    );
  } else {
    const dist: Record<string, number> = {};
    for (const r of resultados) dist[r.rarity ?? "?"] = (dist[r.rarity ?? "?"] ?? 0) + 1;
    ok(
      `escala respeitada em ${pagaramXp.length}/${pagaramXp.length} aberturas de XP — ` +
        "raridades sorteadas: " +
        Object.entries(dist)
          .map(([k, v]) => `${k} ${v}`)
          .join(" · "),
    );
  }

  // A peça NÃO paga XP, e isso é contrato: `scrapped_xp` 0 nela. O cliente
  // ramifica no par (is_xp, scrapped_xp); prometer os dois mostra duas telas.
  const pecaComXp = comPeca.filter((r) => (r.scrapped_xp ?? 0) !== 0);
  if (pecaComXp.length === 0) {
    ok("abertura que deu peça devolveu scrapped_xp = 0");
  } else {
    nok(
      `${pecaComXp.length} aberturas deram peça E prometeram XP`,
      "o cliente ramifica no par (is_xp, scrapped_xp); prometer os dois mostra duas telas",
    );
  }

  const prometido = resultados.reduce((s, r) => s + (r.scrapped_xp ?? 0), 0);
  const [credito] = await db<{ n: number; xp: number }[]>`
    select count(*)::int as n, coalesce(sum(amount),0)::int as xp
    from xp_grants where source='item_scrap' and source_id = any(${chaves})`;

  if (credito.xp === prometido && credito.n === pagaramXp.length) {
    ok(`o XP prometido foi creditado: ${credito.xp} XP em ${credito.n} grants`);
  } else {
    nok(
      `prometido ${prometido} XP em ${pagaramXp.length} aberturas, ` +
        `creditado ${credito.xp} em ${credito.n} grants`,
      "baú que devolve número sem gravar no ledger some sem sintoma",
    );
  }

  console.log(
    `   (amostragem: ${ABERTURAS} sorteios; as conferências 1, 2 e 3 são exaustivas)`,
  );

  return { passed, failed };
}

class Rollback extends Error {}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: o baú paga XP direto (T9 / E.2)");
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
  console.log("\nGate do baú: OK");
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
