/**
 * GATE: banco do subsistema avatar / cosméticos / baús (T0.15–T0.17)
 *
 * A fase 8 nunca teve gate. As três coisas que este script trava:
 *
 *  1. ESTRUTURA (T0.15) — RPCs presentes, CHECK de slots, UNIQUE que sustenta
 *     a idempotência. Sem o UNIQUE de `user_inventory` a detecção de
 *     duplicata do `claim_chest` (que lê `FOUND` depois do ON CONFLICT)
 *     deixa de funcionar e a criança recebe o mesmo item várias vezes sem
 *     virar XP.
 *
 *  2. VAZAMENTO (T0.16) — as policies `inventory_select_classmate` e
 *     `equipped_select_classmate` deixavam qualquer aluno ler o inventário
 *     dos colegas de turma. Foram dropadas nas migrations 20260318100000 e
 *     20260320200000. Nada impedia alguém de recriá-las; agora impede.
 *
 *  3. PREMISSA DAS PATENTES (T0.17) — `complete_lesson_step` compara a trilha
 *     concluída contra um array de 7 trilhas para decidir o título. O banco
 *     tem 2. Resultado: 5 dos 7 títulos são inalcançáveis em produção, e o
 *     avatar v4 ia mandar desenhar 5 uniformes que ninguém vestiria. O
 *     defeito não foi a régua — foi nada verificar a premissa.
 *
 * Uso: npm run verify:avatar-db
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Slots que o subsistema reconhece hoje. A F2 acrescenta `hair` e `back`. */
const SLOTS_ESPERADOS = ["background", "frame", "hand", "head", "outfit", "pet"];

const RARIDADES_ESPERADAS = ["common", "epic", "legendary", "rare"];

const RPCS_ESPERADOS = [
  "claim_chest",
  "equip_item",
  "unequip_slot",
  "update_avatar_base",
  "get_eggs",
  "hatch_egg",
  "_create_random_pet_egg",
  "_create_specific_pet_egg",
];

/** Policies que vazavam dados entre colegas de turma. Não podem voltar. */
const POLICIES_PROIBIDAS = ["inventory_select_classmate", "equipped_select_classmate"];

/**
 * Títulos que hoje não têm trilha correspondente no banco.
 *
 * Levantado em 2026-07-29: `lessons` tem apenas as trilhas `recruta` e
 * `soldado`, mas o mapa de títulos em `complete_lesson_step` prevê 7. Estes 5
 * são inalcançáveis até o conteúdo existir.
 *
 * O backlog do avatar v4 (doc 14) decidiu fazer as trilhas crescerem para 7 em
 * vez de mudar a régua. Quando a 3ª trilha entrar, este gate manda encolher a
 * lista — é o ponto todo dele.
 */
const TITULOS_SEM_TRILHA_CONHECIDOS = ["Capitão", "Comandante", "General", "Grão-Mestre", "Lenda"];

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

/** Extrai os elementos de um ARRAY['a','b'] do corpo de uma função. */
function extrairArraySql(def: string, variavel: string): string[] | null {
  const re = new RegExp(`${variavel}[^=]*:=\\s*ARRAY\\[([^\\]]+)\\]`, "i");
  const m = def.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: banco do avatar (fase 8)");
  console.log("========================================");

  try {
    // --- 1. RPCs presentes ---
    console.log("\n1. RPCs do subsistema");

    const fns = await sql<{ proname: string; def: string }[]>`
      select p.proname, pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f' and p.proname = any(${RPCS_ESPERADOS})`;

    const presentes = new Map(fns.map((f) => [f.proname, f.def]));
    for (const nome of RPCS_ESPERADOS) {
      if (presentes.has(nome)) ok(`${nome} existe`);
      else nok(`${nome} não existe`, "RPC do subsistema de avatar sumiu do banco");
    }

    // --- 2. CHECK constraints ---
    console.log("\n2. CHECK de slots e raridades");

    const checks = await sql<{ tabela: string; conname: string; def: string }[]>`
      select rel.relname as tabela, con.conname, pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and con.contype='c'
        and rel.relname in ('items','user_equipped')`;

    function valoresDoCheck(tabela: string, coluna: string): string[] | null {
      const c = checks.find((x) => x.tabela === tabela && x.def.includes(`(${coluna} = ANY`));
      if (!c) return null;
      return [...c.def.matchAll(/'([^']+)'::text/g)].map((m) => m[1]).sort();
    }

    for (const [tabela, coluna, esperado] of [
      ["items", "slot", SLOTS_ESPERADOS],
      ["user_equipped", "slot", SLOTS_ESPERADOS],
      ["items", "rarity", RARIDADES_ESPERADAS],
    ] as const) {
      const atual = valoresDoCheck(tabela, coluna);
      if (!atual) {
        nok(`${tabela}.${coluna} sem CHECK`, `qualquer texto entraria em ${coluna}`);
      } else if (JSON.stringify(atual) !== JSON.stringify([...esperado].sort())) {
        nok(
          `${tabela}.${coluna}: CHECK diferente do esperado`,
          `banco: [${atual.join(", ")}] | esperado: [${[...esperado].sort().join(", ")}]`,
        );
      } else {
        ok(`${tabela}.${coluna}: CHECK com ${atual.length} valores`);
      }
    }

    // A lista hard-coded dentro de unequip_slot é uma segunda cópia do CHECK.
    // Duas cópias divergem em silêncio — na F2, quando `hair` e `back` entrarem,
    // esquecer uma delas deixa o slot novo impossível de desequipar.
    const defUnequip = presentes.get("unequip_slot");
    if (defUnequip) {
      const naFuncao = [...defUnequip.matchAll(/'([a-z_]+)'/g)]
        .map((m) => m[1])
        .filter((s) => SLOTS_ESPERADOS.includes(s) || ["hair", "back"].includes(s));
      const distintos = [...new Set(naFuncao)].sort();
      if (JSON.stringify(distintos) !== JSON.stringify([...SLOTS_ESPERADOS].sort())) {
        nok(
          "unequip_slot valida uma lista de slots diferente do CHECK",
          `função: [${distintos.join(", ")}] | CHECK: [${[...SLOTS_ESPERADOS].sort().join(", ")}]`,
        );
      } else {
        ok("unequip_slot valida exatamente os slots do CHECK");
      }
    }

    // --- 3. UNIQUE e FK ---
    console.log("\n3. UNIQUE e FK que sustentam a idempotência");

    const cons = await sql<{ tabela: string; conname: string; def: string; tipo: string }[]>`
      select rel.relname as tabela, con.conname, pg_get_constraintdef(con.oid) as def, con.contype as tipo
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and con.contype in ('u','f')
        and rel.relname in ('user_inventory','user_equipped','user_chests')`;

    const esperados: [string, string, string][] = [
      ["user_inventory", "UNIQUE (user_id, item_id)", "sem ele o ON CONFLICT do claim_chest não detecta duplicata"],
      ["user_equipped", "UNIQUE (user_id, slot)", "sem ele o mesmo slot acumula itens em vez de substituir"],
      ["user_chests", "UNIQUE (user_id, source_type, source_id)", "sem ele o mesmo evento gera baús repetidos"],
      ["user_inventory", "FOREIGN KEY (item_id) REFERENCES items(id)", "inventário poderia apontar para item inexistente"],
      ["user_equipped", "FOREIGN KEY (item_id) REFERENCES items(id)", "equipado poderia apontar para item inexistente"],
    ];

    for (const [tabela, trecho, porque] of esperados) {
      const achou = cons.some((c) => c.tabela === tabela && c.def.startsWith(trecho));
      if (achou) ok(`${tabela}: ${trecho}`);
      else nok(`${tabela} sem ${trecho}`, porque);
    }

    // --- 4. Policies de vazamento (T0.16) ---
    console.log("\n4. Policies que vazavam inventário entre colegas");

    const policies = await sql<{ tablename: string; policyname: string }[]>`
      select tablename, policyname from pg_policies where schemaname='public'`;

    const nomes = new Set(policies.map((p) => p.policyname));
    for (const proibida of POLICIES_PROIBIDAS) {
      if (nomes.has(proibida)) {
        nok(
          `policy "${proibida}" existe`,
          "deixa aluno ler o inventário de colegas de turma; foi dropada e não pode voltar",
        );
      } else {
        ok(`policy "${proibida}" ausente (correto)`);
      }
    }

    // Contrapartida: as policies próprias precisam existir, senão o aluno
    // não vê nem o próprio inventário.
    for (const [tabela, policy] of [
      ["user_inventory", "inventory_select_own"],
      ["user_equipped", "equipped_select_own"],
      ["user_chests", "user_chests_select_own"],
    ] as const) {
      if (policies.some((p) => p.tablename === tabela && p.policyname === policy)) {
        ok(`policy "${policy}" presente`);
      } else {
        nok(`policy "${policy}" ausente`, `o aluno não conseguiria ler o próprio ${tabela}`);
      }
    }

    // --- 5. Premissa das patentes (T0.17) ---
    console.log("\n5. Premissa: trilhas do banco x mapa de títulos");

    const defLesson = await sql<{ def: string }[]>`
      select pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f' and p.proname='complete_lesson_step'`;

    if (defLesson.length === 0) {
      nok("complete_lesson_step não existe", "é ela que concede o título ao concluir trilha");
    } else {
      const def = defLesson[0].def;
      const ordemTrilhas = extrairArraySql(def, "v_trail_order_arr");
      const mapaTitulos = extrairArraySql(def, "v_title_map");

      const trilhasDb = (
        await sql<{ trail: string }[]>`select distinct trail from lessons order by trail`
      ).map((r) => r.trail);

      if (!ordemTrilhas || !mapaTitulos) {
        nok(
          "não consegui ler os arrays de trilha/título de complete_lesson_step",
          "a função foi reescrita e este gate precisa acompanhar",
        );
      } else if (ordemTrilhas.length !== mapaTitulos.length) {
        nok(
          "mapa de títulos e ordem de trilhas têm tamanhos diferentes",
          `${ordemTrilhas.length} trilhas x ${mapaTitulos.length} títulos — array_position devolveria título errado`,
        );
      } else {
        ok(`mapa consistente: ${ordemTrilhas.length} trilhas, ${mapaTitulos.length} títulos`);

        // (a) Trilha que existe no banco e não está no mapa: concluir a trilha
        //     não concede título nenhum, e ninguém percebe.
        const foraDoMapa = trilhasDb.filter((t) => !ordemTrilhas.includes(t));
        if (foraDoMapa.length > 0) {
          nok(
            `${foraDoMapa.length} trilha(s) do banco fora do mapa de títulos`,
            `${foraDoMapa.join(", ")} — concluir essas trilhas não concede patente alguma`,
          );
        } else {
          ok(`as ${trilhasDb.length} trilhas do banco estão no mapa (${trilhasDb.join(", ")})`);
        }

        // (b) Título cuja trilha não existe: patente inalcançável.
        const inalcancaveis = mapaTitulos.filter((_, i) => !trilhasDb.includes(ordemTrilhas[i]));
        const novos = inalcancaveis.filter((t) => !TITULOS_SEM_TRILHA_CONHECIDOS.includes(t));
        const resolvidos = TITULOS_SEM_TRILHA_CONHECIDOS.filter((t) => !inalcancaveis.includes(t));

        if (novos.length > 0) {
          nok(
            `${novos.length} título(s) NOVOS inalcançáveis`,
            `${novos.join(", ")} — o mapa cresceu sem a trilha correspondente existir`,
          );
        } else if (inalcancaveis.length > 0) {
          ok(
            `${inalcancaveis.length} títulos inalcançáveis, todos conhecidos ` +
              `(${inalcancaveis.join(", ")}) — esperam as trilhas 3–7`,
          );
        } else {
          ok("todos os títulos do mapa são alcançáveis");
        }

        if (resolvidos.length > 0) {
          console.log(
            `  [INFO] ${resolvidos.length} título(s) deixaram de ser inalcançáveis: ${resolvidos.join(", ")}.\n` +
              "         Encolha TITULOS_SEM_TRILHA_CONHECIDOS neste arquivo.",
          );
        }
      }
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");
  if (failed > 0) process.exit(1);
  console.log("\nGate de banco do avatar: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
