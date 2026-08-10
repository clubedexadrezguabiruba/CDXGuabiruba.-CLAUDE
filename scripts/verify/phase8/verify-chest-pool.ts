/**
 * GATE: o baú não depende mais de `items` — Bloco A da troca de pilha.
 *
 * O NOME DO SCRIPT É LEGADO. Ele nasceu como "ponte dos baús" (T0.5), medindo
 * se todo item sorteado aparecia no boneco. Não há mais item para sortear: o
 * Doug decidiu apagar o catálogo do avatar v2 inteiro
 * (docs/avatar/20-troca-de-pilha-plano.md). O caminho e o nome npm ficaram para
 * não espalhar churn por package.json, verify:all e o painel no mesmo passo em
 * que o contrato muda.
 *
 * O QUE ESTE GATE PROVA AGORA
 * ---------------------------
 * Que o baú e o ovo sobrevivem a um catálogo vazio. Antes da migration
 * 20260810120000 ele falha: `claim_chest` consulta `items` e faz
 * `RAISE EXCEPTION 'Nenhum item disponível no sistema'` quando não acha nada —
 * ou seja, apagar os itens (Bloco B) travaria as cinco fontes de baú de uma vez.
 *
 * AS QUATRO CONFERÊNCIAS
 * ----------------------
 *  1. Nenhuma das três funções menciona `items` no corpo. É a conferência
 *     anti-regressão: protege contra uma migration futura recolar um corpo
 *     antigo, que foi como a curva de XP regrediu por 4 meses.
 *  2. Nenhuma delas menciona `renderable` — a ponte T0.5 saiu junto.
 *  3. 60 aberturas reais: ZERO exceção, e toda abertura devolve XP ou ovo.
 *  4. A regra da raridade é a que foi medida: `common` paga na hora, `rare`
 *     para cima vira ovo.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Tudo roda dentro de UMA transação que termina em ROLLBACK, personificando um
 * usuário existente por `set_config('request.jwt.claims', ...)` — que é de onde
 * `auth.uid()` lê. Nenhuma linha sobrevive: nem baú, nem ovo, nem XP.
 *
 * Uso: npm run verify:chest-pool
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Quantos baús abrir na simulação. */
const ABERTURAS = 60;

/** As três funções que o Bloco A desamarrou de `items`. */
const FUNCOES = ["claim_chest", "_create_random_pet_egg", "hatch_egg"] as const;

interface Resultado {
  is_egg?: boolean;
  is_xp?: boolean;
  rarity?: string;
  scrapped_xp?: number;
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
  console.log("GATE: o baú sobrevive sem catálogo de item");
  console.log("========================================");

  try {
    // --- 1 e 2. O corpo das funções não fala mais de item ---
    console.log("\n1. Nenhuma das três funções consulta `items` (anti-regressão)");

    const fns = await sql<{ proname: string; def: string }[]>`
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
      // `public.items` e `from items` — o que interessa é a tabela, não a
      // palavra solta ("item_scrap" e "item_id" são legítimos e continuam).
      const tocaItems = /\b(from|join|update|into)\s+(public\.)?items\b/i.test(f.def);
      if (tocaItems) {
        nok(
          `${nome} ainda consulta a tabela items`,
          "com o catálogo vazio esta função quebra — é o que o Bloco A existe para cortar",
        );
      } else {
        ok(`${nome} não consulta items`);
      }

      if (/\brenderable\b/.test(f.def)) {
        nok(
          `${nome} ainda filtra por renderable`,
          "a ponte T0.5 saiu com o catálogo; a coluna morre no Bloco B",
        );
      } else {
        ok(`${nome} não menciona renderable`);
      }
    }

    // --- 3. Simulação real, em transação revertida ---
    console.log(`\n2. ${ABERTURAS} aberturas reais (transação revertida)`);

    const [cobaia] = await sql<{ id: string; email: string }[]>`
      select id, email from users order by created_at limit 1`;
    if (!cobaia) {
      nok("nenhum usuário no banco", "a simulação precisa de uma conta para personificar");
      return finalizar();
    }
    console.log(`   personificando ${cobaia.email} (nada é gravado: ROLLBACK ao final)`);

    const resultados: Resultado[] = [];
    let erro: string | null = null;

    try {
      await sql.begin(async (tx) => {
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: cobaia.id, role: "authenticated" })}, true)`;

        for (let n = 0; n < ABERTURAS; n++) {
          const [c] = await tx<{ id: number }[]>`
            insert into user_chests (user_id, source_type, source_id)
            values (${cobaia.id}, 'level_up', ${`gate_chest_pool_${n}`})
            returning id::int as id`;
          const [r] = await tx<{ res: Resultado }[]>`
            select public.claim_chest(${c.id}::bigint) as res`;
          resultados.push(r.res);
        }

        throw new Rollback();
      });
    } catch (e) {
      if (e instanceof Rollback) {
        // caminho feliz
      } else {
        erro = e instanceof Error ? e.message : String(e);
      }
    }

    if (erro) {
      nok(
        `abertura de baú lançou exceção antes de completar ${ABERTURAS}`,
        `${erro} — é exatamente a falha que trava as 5 fontes de baú quando o catálogo esvazia`,
      );
      return finalizar();
    }

    ok(`${ABERTURAS} aberturas, zero exceção`);

    // Toda abertura tem de ter devolvido alguma coisa.
    const vazias = resultados.filter((r) => !r.is_egg && !r.is_xp);
    if (vazias.length > 0) {
      nok(
        `${vazias.length} de ${ABERTURAS} aberturas não devolveram nem XP nem ovo`,
        "baú aberto que não recompensa é pior que baú que falha: some sem sintoma",
      );
    } else {
      const ovos = resultados.filter((r) => r.is_egg).length;
      const xp = resultados.filter((r) => r.is_xp).length;
      ok(`toda abertura recompensou — ${xp} em XP, ${ovos} em ovo`);
    }

    // --- 4. A regra da raridade é a medida ---
    console.log("\n3. A regra: common paga na hora, rare para cima vira ovo");

    const fora = resultados.filter((r) =>
      r.rarity === "common" ? r.is_egg : !r.is_egg,
    );

    if (fora.length > 0) {
      const amostra = fora
        .slice(0, 5)
        .map((r) => `${r.rarity}→${r.is_egg ? "ovo" : "xp"}`)
        .join(", ");
      nok(
        `${fora.length} de ${ABERTURAS} aberturas fora da regra`,
        `esperado common→xp e rare/epic/legendary→ovo; veio ${amostra}`,
      );
    } else {
      const ovos = resultados.filter((r) => r.is_egg).length;
      const taxa = ((ovos / ABERTURAS) * 100).toFixed(1);
      ok(`regra respeitada em ${ABERTURAS}/${ABERTURAS} — taxa de ovo ${taxa}% (medida antes: 55,7%)`);
    }

    // O XP do baú de XP tem de ser positivo, senão grant_xp teria reprovado.
    const xpInvalido = resultados.filter((r) => r.is_xp && !(r.scrapped_xp! > 0));
    if (xpInvalido.length > 0) {
      nok(`${xpInvalido.length} baús de XP com valor não positivo`, "grant_xp recusa p_amount <= 0");
    } else if (resultados.some((r) => r.is_xp)) {
      ok("todo baú de XP pagou valor positivo");
    }

    console.log(`   (amostragem: ${ABERTURAS} sorteios; a conferência 1 é exaustiva por leitura do corpo)`);
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
  console.log("\nGate do baú sem catálogo: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
