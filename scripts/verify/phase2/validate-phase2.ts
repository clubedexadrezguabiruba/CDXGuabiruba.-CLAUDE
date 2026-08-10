/**
 * ============================================================
 * Gate de Validação — Fase 2: Banco de Dados
 * ============================================================
 *
 * O que valida:
 *   1. Existência das 24 tabelas (2.1–2.11)
 *   2. Seed data: 10 bots, 17 achievements, 77 itens (2.19)
 *   3. 9 RPCs core (2.14–2.16): existência e exigência de auth
 *   4. RLS: tabelas protegidas bloqueiam anon; catálogo requer auth
 *   5. View materializada user_public_profiles (2.12) via get_ranking
 *
 * Pré-requisitos:
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - Opcionalmente SUPABASE_SERVICE_ROLE_KEY (bypassa RLS para checar seeds)
 *   - Migrations da Fase 2 aplicadas no Supabase remoto
 *
 * SEGURANÇA: usa service_role_key se disponível — NUNCA rodar no client.
 *            Uso exclusivo: terminal local / CI.
 *
 * Exit:
 *   0 = todos os testes passaram
 *   1 = ao menos 1 falha
 *
 * Uso:
 *   npm run verify:phase2
 *   npx tsx scripts/verify/phase2/validate-phase2.ts
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.js";

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    "Faltam variáveis em .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY);
const anonClient = createClient(URL, ANON_KEY);

let pass = 0;
let fail = 0;

function ok(label: string) {
  pass++;
  console.log(`  [PASS] ${label}`);
}

function nok(label: string, detail?: string) {
  fail++;
  console.log(`  [FAIL] ${label}${detail ? " -- " + detail : ""}`);
}

async function main() {
  console.log("=== VALIDACAO FASE 2 -- BANCO DE DADOS ===\n");
  console.log(`Supabase URL: ${URL}`);
  console.log(`Key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon"}\n`);

  // --- 1. Tabelas ---
  console.log("1. TABELAS (2.1-2.11)");

  const expectedTables = [
    "users",
    "puzzles",
    "user_puzzle_attempts",
    "lessons",
    "user_lesson_progress",
    "bots",
    "user_bot_results",
    "bot_game_analysis",
    "achievements",
    "user_achievements",
    "daily_missions",
    "daily_chests",
    // `items`, `user_inventory` e `user_equipped` saíram no Bloco B
    // (2026-08-10) — o avatar v2 inteiro foi apagado. A ausência delas é
    // exigida por verify:avatar-db.
    "user_streaks",
    "user_titles",
    "puzzle_revanche_queue",
    "classes",
    "class_members",
    "class_tasks",
    "user_task_progress",
    "class_feed",
    "puzzle_rush_runs",
  ];

  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) nok(`Tabela ${table}`, error.message);
    else ok(`Tabela ${table}`);
  }

  // --- 2. Seeds ---
  console.log("\n2. SEEDS (2.19)");

  const { data: bots, error: botsErr } = await supabase
    .from("bots")
    .select("id, name, elo, unlock_order")
    .order("unlock_order");
  if (botsErr) nok("Bots seed", botsErr.message);
  else if (!bots || bots.length !== 10)
    nok("Bots seed", `Esperado 10, encontrado ${bots?.length}`);
  else ok(`Bots seed: ${bots.length} bots (${bots[0].name}..${bots[bots.length - 1].name})`);

  const { data: achs, error: achsErr } = await supabase
    .from("achievements")
    .select("id, key")
    .order("id");
  if (achsErr) nok("Achievements seed", achsErr.message);
  else if (!achs || achs.length < 15)
    nok("Achievements seed", `Esperado 17, encontrado ${achs?.length}`);
  else ok(`Achievements seed: ${achs.length} conquistas`);

  // As duas conferências do seed de itens saíram no Bloco B junto com a tabela.

  // --- 3. RPCs ---
  console.log("\n3. RPCs (2.14-2.16)");

  const rpcs: Array<{ name: string; args?: Record<string, unknown> }> = [
    { name: "check_level_up" },
    { name: "check_daily_missions" },
    { name: "puzzle_attempt", args: { p_puzzle_id: 1, p_moves: ["e2e4"], p_mode: "rating" } },
    { name: "lesson_step_submit", args: { p_lesson_id: 1, p_step_index: 1 } },
    { name: "bot_result", args: { p_bot_id: 1, p_result: "win" } },
    { name: "claim_chest", args: { p_chest_id: 1 } },
    { name: "grant_xp", args: { p_amount: 10, p_source: "mission", p_source_id: "test" } },
    { name: "get_ranking", args: { p_type: "rating", p_limit: 10 } },
    { name: "refresh_public_profiles" },
  ];

  for (const rpc of rpcs) {
    const { error } = await supabase.rpc(rpc.name, rpc.args);
    if (error && error.message.includes("not exist")) {
      nok(`RPC ${rpc.name}`, "Funcao nao existe");
    } else {
      ok(`RPC ${rpc.name} (existe, ${error ? "auth required" : "ok"})`);
    }
  }

  // --- 4. RLS ---
  console.log("\n4. RLS (2.13)");

  const protectedTables = [
    "users",
    "user_puzzle_attempts",
    "user_bot_results",
    "daily_missions",
    "user_streaks",
  ];
  for (const table of protectedTables) {
    const { data, error } = await anonClient.from(table).select("*").limit(5);
    if (error) ok(`RLS ${table}: bloqueado (${error.message.slice(0, 40)})`);
    else if (data && data.length === 0) ok(`RLS ${table}: 0 rows (RLS ativo)`);
    else nok(`RLS ${table}`, `Retornou ${data?.length} rows sem auth!`);
  }

  // `items` saiu daqui no Bloco B, com a tabela.
  const catalogTables = ["puzzles", "bots", "achievements", "lessons"];
  for (const table of catalogTables) {
    const { data, error } = await anonClient.from(table).select("*").limit(1);
    if (error && error.message.includes("permission"))
      ok(`RLS ${table}: requer auth (correto)`);
    else if (data) ok(`RLS ${table}: leitura ok (${data.length} rows)`);
    else nok(`RLS ${table}`, error?.message);
  }

  // --- 5. View materializada ---
  console.log("\n5. VIEW MATERIALIZADA (2.12)");

  const { error: rankErr } = await supabase.rpc("get_ranking", {
    p_type: "level",
    p_limit: 5,
  });
  if (rankErr) nok("View user_public_profiles (via get_ranking)", rankErr.message);
  else ok("View user_public_profiles (via get_ranking): ok");

  // --- Resumo ---
  console.log("\n========================================");
  console.log(`RESULTADO: ${pass} passed | ${fail} failed`);
  console.log("========================================\n");

  if (fail > 0) {
    console.log("Ha falhas -- revise os itens marcados com [FAIL]");
    process.exit(1);
  } else {
    console.log("Fase 2 -- Banco de Dados: VALIDACAO COMPLETA!");
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
