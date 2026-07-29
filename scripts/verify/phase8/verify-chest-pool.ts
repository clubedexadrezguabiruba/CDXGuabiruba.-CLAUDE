/**
 * GATE: a ponte dos baús (T0.5) — todo item sorteado aparece no boneco.
 *
 * O QUE ESTE GATE PROVA
 * ---------------------
 * Abre baús de verdade, chamando o RPC de verdade, e confere que TODO item
 * concedido tem os arquivos que o render exige em `public/items/`.
 *
 * Antes da migration 20260729120000 ele falha: 45 dos 77 itens do catálogo
 * não vestem o boneco, e o sorteio não sabia disso.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Tudo roda dentro de UMA transação que termina em ROLLBACK. O usuário é
 * personificado por `set_config('request.jwt.claims', ..., true)` — que é de
 * onde `auth.uid()` lê — em vez de criar conta nova. Nenhuma linha sobrevive:
 * nem baú, nem inventário, nem ovo, nem XP.
 *
 * Isto é deliberadamente diferente do e2e, que cria e apaga usuários reais e
 * por isso não roda em CI. Este gate roda em CI.
 *
 * AS QUATRO CONFERÊNCIAS
 * ----------------------
 *  1. A coluna `items.renderable` existe.
 *  2. A marca no banco bate com o disco (recalculada de public/items/).
 *  3. `claim_chest` e `_create_random_pet_egg` filtram por ela no corpo —
 *     protege contra uma migration futura recolar um corpo antigo, que foi
 *     como a curva de XP regrediu por 4 meses.
 *  4. 60 aberturas reais: todo item recebido renderiza.
 *
 * Uso: npm run verify:chest-pool
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";
import { varrerAssets } from "../../avatar/asset-scan";
import { avaliarRenderabilidade } from "../../../src/lib/avatar/renderability";
import type { ItemSlot } from "../../../src/types/inventory";

/** Quantos baús abrir na simulação. */
const ABERTURAS = 60;

interface ItemDb {
  id: number;
  name: string;
  slot: ItemSlot;
  rarity: string;
  image_url: string | null;
  renderable: boolean;
}

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detalhe: string) {
  console.log(`  [FAIL] ${msg}`);
  console.log(`         ${detalhe}`);
  failed++;
}

class Rollback extends Error {}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: ponte dos baús (T0.5)");
  console.log("========================================");

  try {
    // --- 1. A coluna existe ---
    console.log("\n1. Marca de renderabilidade no catálogo");

    const [{ existe: temColuna }] = await sql<{ existe: boolean }[]>`
      select exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='items' and column_name='renderable'
      ) as existe`;

    if (!temColuna) {
      nok(
        "items.renderable não existe",
        "Sem ela o sorteio não tem como distinguir item que veste de item invisível. " +
          "Aplique supabase/migrations/20260729120000_avatar_v4_ponte_baus.sql.",
      );
      return finalizar();
    }
    ok("items.renderable existe");

    // --- 2. A marca bate com o disco ---
    console.log("\n2. Marca do banco x arquivos em public/items/");

    const itens = await sql<ItemDb[]>`
      select id::int as id, name, slot, rarity, image_url, renderable from items order by id`;

    const disco = new Set(varrerAssets());
    const existeArquivo = (c: string) => disco.has(c);

    /** Veste o boneco E tem miniatura para o inventário e o modal do baú. */
    function apareceDeVerdade(i: ItemDb): boolean {
      const veste = avaliarRenderabilidade(i, existeArquivo).renderiza;
      const miniatura = !!i.image_url && existeArquivo(i.image_url);
      return veste && miniatura;
    }

    const porId = new Map(itens.map((i) => [i.id, i]));
    const divergentes = itens.filter((i) => i.renderable !== apareceDeVerdade(i));

    if (divergentes.length > 0) {
      const marcadosSemArte = divergentes.filter((i) => i.renderable);
      const arteSemMarca = divergentes.filter((i) => !i.renderable);
      nok(
        `${divergentes.length} item(ns) com a marca fora de sincronia com o disco`,
        [
          marcadosSemArte.length
            ? `marcados renderable mas SEM os arquivos (perigoso, entram no sorteio): ${marcadosSemArte.map((i) => `${i.id} ${i.name}`).join("; ")}`
            : "",
          arteSemMarca.length
            ? `com os arquivos mas NÃO marcados (a arte chegou, falta a migration): ${arteSemMarca.map((i) => `${i.id} ${i.name}`).join("; ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
      );
    } else {
      const marcados = itens.filter((i) => i.renderable).length;
      ok(`marca em dia: ${marcados} de ${itens.length} itens aparecem de verdade`);
    }

    // Toda raridade precisa de pelo menos um item sorteável, senão o roll
    // cai no fallback e a distribuição deixa de significar o que promete.
    console.log("\n3. Cobertura por raridade no pool");
    for (const raridade of ["common", "rare", "epic", "legendary"]) {
      const n = itens.filter((i) => i.rarity === raridade && i.renderable).length;
      if (n === 0) nok(`raridade "${raridade}" sem item sorteável`, "o roll cai no fallback");
      else ok(`raridade "${raridade}": ${n} itens sorteáveis`);
    }

    // --- 3. O filtro está no corpo das funções ---
    console.log("\n4. Filtro presente no corpo das funções (anti-regressão)");

    const fns = await sql<{ proname: string; def: string }[]>`
      select p.proname, pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f'
        and p.proname = any(${["claim_chest", "_create_random_pet_egg"]})`;

    for (const nome of ["claim_chest", "_create_random_pet_egg"]) {
      const f = fns.find((x) => x.proname === nome);
      if (!f) {
        nok(`${nome} não existe no banco`, "RPC do subsistema de baús sumiu");
        continue;
      }
      if (!/\brenderable\b/.test(f.def)) {
        nok(
          `${nome} não filtra por renderable`,
          "alguma migration recolou um corpo antigo — foi assim que a curva de XP regrediu 4 meses",
        );
      } else {
        ok(`${nome} filtra por renderable`);
      }
    }

    // --- 4. Simulação real, em transação revertida ---
    console.log(`\n5. ${ABERTURAS} aberturas reais (transação revertida)`);

    const [cobaia] = await sql<{ id: string; email: string }[]>`
      select id, email from users order by created_at limit 1`;
    if (!cobaia) {
      nok("nenhum usuário no banco", "a simulação precisa de uma conta para personificar");
      return finalizar();
    }
    console.log(`   personificando ${cobaia.email} (nada é gravado: ROLLBACK ao final)`);

    const recebidos: number[] = [];

    try {
      await sql.begin(async (tx) => {
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: cobaia.id, role: "authenticated" })}, true)`;

        const [{ max_inv }] = await tx<{ max_inv: number }[]>`
          select coalesce(max(id), 0)::int as max_inv from user_inventory`;
        const [{ max_egg }] = await tx<{ max_egg: number }[]>`
          select coalesce(max(id), 0)::int as max_egg from user_eggs`;

        for (let n = 0; n < ABERTURAS; n++) {
          const [c] = await tx<{ id: number }[]>`
            insert into user_chests (user_id, source_type, source_id)
            values (${cobaia.id}, 'level_up', ${`gate_chest_pool_${n}`})
            returning id::int as id`;
          await tx`select public.claim_chest(${c.id}::bigint)`;
        }

        // Itens que entraram no inventário nesta transação.
        const novosItens = await tx<{ item_id: number }[]>`
          select item_id::int as item_id from user_inventory
          where user_id = ${cobaia.id} and id > ${max_inv}`;
        // Pets reservados em ovo nesta transação (o baú não devolve qual é).
        const novosOvos = await tx<{ pet_item_id: number | null }[]>`
          select pet_item_id::int as pet_item_id from user_eggs
          where user_id = ${cobaia.id} and id > ${max_egg}`;
        // Duplicatas não entram no inventário; o baú registra o item sorteado.
        const duplicatas = await tx<{ item_id: number | null }[]>`
          select item_id::int as item_id from user_chests
          where user_id = ${cobaia.id} and source_id like 'gate_chest_pool_%' and item_id is not null`;

        for (const r of novosItens) recebidos.push(r.item_id);
        for (const r of novosOvos) if (r.pet_item_id != null) recebidos.push(r.pet_item_id);
        for (const r of duplicatas) if (r.item_id != null) recebidos.push(r.item_id);

        throw new Rollback();
      });
    } catch (e) {
      if (!(e instanceof Rollback)) throw e;
    }

    const distintos = [...new Set(recebidos)];
    const invisiveis = distintos
      .map((id) => porId.get(id))
      .filter((i): i is ItemDb => !!i && !apareceDeVerdade(i));

    if (distintos.length === 0) {
      nok("nenhum item foi concedido nas aberturas", "o sorteio não devolveu nada — pool vazio?");
    } else if (invisiveis.length > 0) {
      nok(
        `${invisiveis.length} de ${distintos.length} itens sorteados NÃO aparecem no boneco`,
        invisiveis.map((i) => `${i.id} "${i.name}" (${i.slot}/${i.rarity})`).join("; "),
      );
    } else {
      ok(`${ABERTURAS} aberturas, ${distintos.length} itens distintos, todos aparecem no boneco`);
    }

    // Registro honesto: a simulação é amostral, não exaustiva. O que a torna
    // conclusiva na prática é o volume — com 45 de 77 itens quebrados, passar
    // 60 sorteios por acaso tem probabilidade da ordem de 1e-23.
    console.log(`   (amostragem: ${ABERTURAS} sorteios; a conferência exaustiva é a nº 2)`);
  } finally {
    await sql.end();
  }

  finalizar();
}

function finalizar() {
  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");
  if (failed > 0) process.exit(1);
  console.log("\nGate da ponte dos baús: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
