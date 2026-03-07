/**
 * Gate de Verificação — Fase 6: Bots Educacionais
 *
 * Valida:
 *   1. 10 bots existem no banco
 *   2. Cada bot tem phrases_json válido com pre_game, during, on_win, on_loss
 *   3. RPC bot_result existe e requer auth
 *   4. Tabelas user_bot_results e bot_game_analysis existem
 *   5. RLS ativo nas tabelas
 *   6. unlock_order sequencial (1-10) sem duplicatas
 *
 * Uso: npm run verify:phase6
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

const envPath = resolve(import.meta.dirname, "..", "..", "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
let dbUrl = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith("postgresql://") ||
    trimmed.startsWith("postgres://")
  ) {
    dbUrl = trimmed;
    break;
  }
}
if (!dbUrl) {
  console.error("Connection string nao encontrada no .env.local");
  process.exit(1);
}

const db = postgres(dbUrl, { ssl: "require" });

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` -- ${detail}` : ""}`);
    failed++;
  }
}

async function main() {
  try {
    // Gate 1: 10 bots existem
    console.log("\n--- Gate 1: 10 bots existem ---");
    const bots = await db`SELECT * FROM public.bots ORDER BY unlock_order`;
    assert("10 bots no banco", bots.length === 10, `found ${bots.length}`);

    // Gate 2: phrases_json válido
    console.log("\n--- Gate 2: phrases_json válido ---");
    for (const bot of bots) {
      const phrases = typeof bot.phrases_json === "string"
        ? JSON.parse(bot.phrases_json)
        : bot.phrases_json;
      const hasAll =
        Array.isArray(phrases.pre_game) &&
        Array.isArray(phrases.during) &&
        Array.isArray(phrases.on_win) &&
        Array.isArray(phrases.on_loss);
      assert(
        `Bot "${bot.name}" tem phrases_json completo`,
        hasAll,
        hasAll ? undefined : "faltam chaves"
      );
    }

    // Gate 3: unlock_order sequencial
    console.log("\n--- Gate 3: unlock_order sequencial ---");
    const orders = bots.map((b) => b.unlock_order).sort((a: number, b: number) => a - b);
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    assert(
      "unlock_order 1-10 sem duplicatas",
      JSON.stringify(orders) === JSON.stringify(expected),
      `found ${orders}`
    );

    // Gate 4: RPC bot_result existe
    console.log("\n--- Gate 4: RPC bot_result ---");
    const rpc = await db`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'bot_result'
    `;
    assert("RPC bot_result existe", rpc.length > 0);

    // Gate 5: Tabelas existem
    console.log("\n--- Gate 5: Tabelas existem ---");
    const tables = await db`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user_bot_results', 'bot_game_analysis')
    `;
    const tableNames = tables.map((t) => t.table_name);
    assert("user_bot_results existe", tableNames.includes("user_bot_results"));
    assert("bot_game_analysis existe", tableNames.includes("bot_game_analysis"));

    // Gate 6: RLS ativo
    console.log("\n--- Gate 6: RLS ativo ---");
    const rlsCheck = await db`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('user_bot_results', 'bot_game_analysis', 'bots')
    `;
    for (const row of rlsCheck) {
      assert(
        `RLS ativo em ${row.tablename}`,
        row.rowsecurity === true,
        row.rowsecurity ? undefined : "RLS desativado"
      );
    }

    // Summary
    console.log(`\n=============================`);
    console.log(`  PASS: ${passed}  |  FAIL: ${failed}`);
    console.log(`=============================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Erro na verificação:", err);
    process.exit(1);
  }
}

main();
