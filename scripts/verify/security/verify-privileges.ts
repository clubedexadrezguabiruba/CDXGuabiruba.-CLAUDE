/**
 * GATE DE SEGURANÇA DO BANCO
 *
 * Assere duas propriedades que a migration 20260725120000 estabelece:
 *
 *  1. Toda função SECURITY DEFINER em `public` fixa search_path.
 *     Sem isso, o chamador pode plantar objetos que a função resolve
 *     (`function_search_path_mutable` no linter do Supabase).
 *
 *  2. Helpers internos que mutam estado NÃO são executáveis por anon nem
 *     authenticated. grant_xp chamável do browser é o caso crítico.
 *
 * Uso: npm run verify:privileges
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Helpers internos que só devem ser chamáveis por outras funções DEFINER. */
const HELPERS_INTERNOS = [
  "grant_xp",
  "check_level_up",
  "emit_class_feed",
  "_create_random_pet_egg",
  "_create_specific_pet_egg",
  "refresh_public_profiles",
  "handle_new_user",
  "update_updated_at",
  "debug_puzzle_state",
];

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detail: string) {
  console.log(`  [FAIL] ${msg} -- ${detail}`);
  failed++;
}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: privilégios e search_path do banco");
  console.log("========================================");

  try {
    // --- 1. search_path fixo em toda função SECURITY DEFINER ---
    console.log("\n1. search_path em funções SECURITY DEFINER");

    const definers = await sql<
      { proname: string; args: string; has_sp: boolean }[]
    >`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as args,
             (p.proconfig is not null
              and exists (select 1 from unnest(p.proconfig) c where c like 'search_path%')) as has_sp
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
      order by p.proname`;

    const semSearchPath = definers.filter((d) => !d.has_sp);

    if (definers.length === 0) {
      nok("Funções SECURITY DEFINER", "nenhuma encontrada — schema aplicado?");
    } else if (semSearchPath.length > 0) {
      nok(
        `search_path fixo em ${definers.length} funções DEFINER`,
        `${semSearchPath.length} sem search_path: ${semSearchPath
          .map((d) => d.proname)
          .slice(0, 8)
          .join(", ")}${semSearchPath.length > 8 ? "..." : ""}`
      );
    } else {
      ok(`Todas as ${definers.length} funções SECURITY DEFINER fixam search_path`);
    }

    // --- 2. helpers internos não executáveis pelo browser ---
    console.log("\n2. EXECUTE dos helpers internos");

    const privs = await sql<
      { proname: string; args: string; anon_exec: boolean; auth_exec: boolean }[]
    >`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as args,
             has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any(${HELPERS_INTERNOS})
      order by p.proname`;

    const encontrados = new Set(privs.map((p) => p.proname));
    for (const nome of HELPERS_INTERNOS) {
      if (!encontrados.has(nome)) {
        console.log(`  [SKIP] ${nome} não existe no banco`);
      }
    }

    for (const p of privs) {
      const expostoA: string[] = [];
      if (p.anon_exec) expostoA.push("anon");
      if (p.auth_exec) expostoA.push("authenticated");

      if (expostoA.length > 0) {
        nok(`${p.proname} não deve ser executável pelo browser`, `exposto a: ${expostoA.join(", ")}`);
      } else {
        ok(`${p.proname}: EXECUTE revogado de anon e authenticated`);
      }
    }

    // --- 3. RPCs legítimos seguem chamáveis (não revogamos demais) ---
    console.log("\n3. RPCs legítimos seguem executáveis por authenticated");

    const rpcsPublicos = [
      "puzzle_attempt",
      "complete_lesson_step",
      "claim_chest",
      "equip_item",
      "get_ranking",
      "start_rush",
      "end_rush",
      "join_class",
      "hatch_egg",
    ];

    const pub = await sql<{ proname: string; auth_exec: boolean }[]>`
      select p.proname, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any(${rpcsPublicos})
      order by p.proname`;

    for (const r of pub) {
      if (r.auth_exec) ok(`${r.proname}: executável por authenticated (esperado)`);
      else nok(`${r.proname} deveria seguir executável`, "EXECUTE revogado demais");
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");

  if (failed > 0) process.exit(1);
  console.log("\nGate de privilégios: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
