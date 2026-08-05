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
 *  3. PATENTES (T0.17) — a régua vive em `title_tiers`, não mais num array
 *     dentro de `complete_lesson_step`. Três coisas travadas aqui:
 *
 *     (a) todo usuário tem linha em `user_titles`. Foi a ausência dessa linha
 *         — e não a régua — que fez o `teacherdoug001` concluir a trilha
 *         inteira em 2026-07-29 e continuar "Aprendiz": o UPDATE antigo
 *         casava zero linhas e não reclamava.
 *     (b) a reconciliação está em dia: ninguém abaixo da patente que a
 *         contagem de aulas concluídas já lhe dá.
 *     (c) patente com uniforme atrelado é patente alcançável. É o que impede
 *         mandar desenhar uniforme para marco que o conteúdo não alcança.
 *
 * Uso: npm run verify:avatar-db
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Slots que o subsistema reconhece hoje. A F2 acrescenta `hair` e `back`. */
// `hand` saiu em 2026-07-31 pela D-E do doc 15 — o boneco kokeshi não tem mãos.
const SLOTS_ESPERADOS = ["background", "frame", "head", "outfit", "pet"];

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

    // --- 5. Patentes (T0.17) ---
    console.log("\n5. Patentes: régua, reconciliação e alcance");

    const [{ existe }] = await sql<{ existe: boolean }[]>`
      select to_regclass('public.title_tiers') is not null as existe`;

    const tiers = existe
      ? await sql<
          { tier: number; title: string; level_name: string | null; lessons_required: number; outfit_item_id: string | null }[]
        >`select tier, title, level_name, lessons_required, outfit_item_id
          from title_tiers order by tier`
      : [];

    if (!existe) {
      nok(
        "tabela title_tiers não existe",
        "a régua da patente ainda está hard-coded dentro de complete_lesson_step — aplicar 20260729120000_patente_por_marcos.sql",
      );
    } else if (tiers.length === 0) {
      nok("title_tiers vazia", "sem régua, recompute_user_title não concede nada");
    } else {
      ok(`title_tiers com ${tiers.length} patentes`);

      // (a) A régua precisa ser uma escada: tier contíguo desde 0 e marco
      //     estritamente crescente. Um marco fora de ordem torna a patente
      //     do meio inalcançável sem ninguém perceber.
      const contigua = tiers.every((t, i) => t.tier === i);
      if (!contigua) {
        nok("tiers não são contíguos a partir de 0", `tiers: ${tiers.map((t) => t.tier).join(", ")}`);
      } else {
        ok("tiers contíguos a partir de 0");
      }

      const crescente = tiers.every((t, i) => i === 0 || t.lessons_required > tiers[i - 1].lessons_required);
      if (!crescente) {
        nok(
          "lessons_required não é estritamente crescente",
          `marcos: ${tiers.map((t) => t.lessons_required).join(", ")} — patente do meio fica inalcançável`,
        );
      } else {
        ok(`marcos crescentes: ${tiers.map((t) => t.lessons_required).join(" → ")}`);
      }

      // (b) A wiring. Se alguém reescrever complete_lesson_step a partir de
      //     migration antiga, a chamada some e a patente volta a morrer em
      //     silêncio — que é exatamente o que aconteceu com a curva de XP.
      const defLesson = await sql<{ def: string }[]>`
        select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.prokind='f' and p.proname='complete_lesson_step'`;

      if (defLesson.length === 0) {
        nok("complete_lesson_step não existe", "é ela que dispara a reconciliação da patente");
      } else if (!defLesson[0].def.includes("recompute_user_title")) {
        nok(
          "complete_lesson_step não chama recompute_user_title",
          "concluir aula deixou de reconciliar a patente — provável recolagem de corpo antigo",
        );
      } else {
        ok("complete_lesson_step chama recompute_user_title");
      }

      // (c) Todo usuário tem linha. É o defeito original: sem linha, o UPDATE
      //     casa zero e a patente evapora sem erro.
      const semLinha = await sql<{ display_name: string }[]>`
        select u.display_name from users u
        left join user_titles t on t.user_id = u.id
        where t.user_id is null`;

      if (semLinha.length > 0) {
        nok(
          `${semLinha.length} usuário(s) sem linha em user_titles`,
          `${semLinha.map((u) => u.display_name).join(", ")} — a concessão de patente falharia em silêncio para eles`,
        );
      } else {
        ok("todo usuário tem linha em user_titles");
      }

      // (d) Reconciliação em dia: ninguém abaixo do que já conquistou.
      const atrasados = await sql<{ display_name: string; current_title: string; concluidas: number; devido: string }[]>`
        with progresso as (
          select u.id, u.display_name, t.current_title,
                 (select count(*) from user_lesson_progress p where p.user_id = u.id and p.completed) as concluidas
          from users u join user_titles t on t.user_id = u.id
        )
        select p.display_name, p.current_title, p.concluidas,
               (select tt.title from title_tiers tt
                where tt.lessons_required <= p.concluidas order by tt.tier desc limit 1) as devido
        from progresso p
        where p.current_title is distinct from
              (select tt.title from title_tiers tt
               where tt.lessons_required <= p.concluidas order by tt.tier desc limit 1)`;

      if (atrasados.length > 0) {
        nok(
          `${atrasados.length} usuário(s) com patente desatualizada`,
          atrasados
            .map((a) => `${a.display_name}: ${a.concluidas} aulas, tem "${a.current_title}", devia ter "${a.devido}"`)
            .join(" | "),
        );
      } else {
        ok("nenhum usuário abaixo da patente que a contagem de aulas lhe dá");
      }

      // (e) Uniforme só para patente alcançável. É o gate que impede gastar
      //     arte em marco que o conteúdo não alcança.
      const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from lessons`;
      const alcancaveis = tiers.filter((t) => t.lessons_required <= total);
      const mortos = tiers.filter((t) => t.outfit_item_id !== null && t.lessons_required > total);

      if (mortos.length > 0) {
        nok(
          `${mortos.length} patente(s) com uniforme atrelado e inalcançável`,
          `${mortos.map((t) => `${t.title} (${t.lessons_required} aulas)`).join(", ")} — ` +
            `o banco tem ${total} aulas; esse uniforme nunca seria vestido`,
        );
      } else {
        ok(`nenhum uniforme atrelado a patente inalcançável`);
      }

      console.log(
        `  [INFO] ${alcancaveis.length} de ${tiers.length} patentes alcançáveis com ${total} aulas no banco ` +
          `(${alcancaveis.map((t) => t.title).join(", ")}).\n` +
          "         As demais esperam conteúdo — desenhar uniforme para elas é arte morta.",
      );
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
