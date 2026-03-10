/**
 * Validação isolada dos RPCs de bots (Nível A + Regressão)
 *
 * Cria um usuário de teste, executa os testes, e limpa ao final.
 * Uso: npx tsx scripts/validate-rpcs.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load env
const envPath = resolve(import.meta.dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
function getEnv(key: string): string {
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${key}=`)) {
      return trimmed.slice(key.length + 1);
    }
  }
  return "";
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

// Admin client for user management
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TIMESTAMP = Date.now();
const TEST_EMAIL = `bot-rpc-validate-${TIMESTAMP}@test.local`;
const TEST_PASSWORD = `TestValidate@${TIMESTAMP}`;
const VALID_PGN =
  '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 1/2-1/2';

// Bot IDs are dynamic (depend on seed order). Fetch them at runtime.
let BOT_1_ID = 0; // unlock_order=1
let BOT_2_ID = 0; // unlock_order=2
let BOT_5_ID = 0; // unlock_order=5 (intermediate)
let BOT_6_ID = 0; // unlock_order=6
let LAST_BOT_ID = 0; // last bot (highest unlock_order)
let LAST_BOT_ORDER = 0;

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function report(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${detail}`);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let userId = "";

  try {
    // ========== SETUP ==========
    console.log("\n=== SETUP: Creating test user ===");

    const { data: userData, error: userError } =
      await adminClient.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (userError || !userData.user) {
      console.error("Failed to create test user:", userError);
      process.exit(1);
    }
    userId = userData.user.id;
    console.log(`User created: ${userId} (${TEST_EMAIL})`);

    // Fetch bot IDs
    const { data: bots } = await adminClient
      .from("bots")
      .select("id, unlock_order")
      .order("unlock_order");
    if (!bots || bots.length < 2) {
      console.error("Bots not found in database");
      process.exit(1);
    }
    BOT_1_ID = bots.find((b: { unlock_order: number }) => b.unlock_order === 1)!.id;
    BOT_2_ID = bots.find((b: { unlock_order: number }) => b.unlock_order === 2)!.id;
    BOT_5_ID = bots.find((b: { unlock_order: number }) => b.unlock_order === 5)?.id ?? 0;
    BOT_6_ID = bots.find((b: { unlock_order: number }) => b.unlock_order === 6)?.id ?? 0;
    const lastBot = bots[bots.length - 1];
    LAST_BOT_ID = lastBot.id;
    LAST_BOT_ORDER = lastBot.unlock_order;
    console.log(`Bot IDs: bot_1=${BOT_1_ID}, bot_2=${BOT_2_ID}, bot_5=${BOT_5_ID}, bot_6=${BOT_6_ID}, last=${LAST_BOT_ID} (order=${LAST_BOT_ORDER})`);

    // Create authenticated client
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: loginError } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (loginError) {
      console.error("Failed to login:", loginError);
      process.exit(1);
    }
    console.log("Logged in as test user\n");

    // ========== REGRESSION CHECKS ==========
    console.log("=== REGRESSION CHECKS ===");

    // R1: grant_xp accepts bot_win
    // We can't call grant_xp directly (it checks auth.uid() and needs valid user record)
    // Instead, we verify indirectly via bot_result test A4 below
    // For now, check that bot_result function exists and is callable
    {
      const { error } = await anonClient.rpc("bot_result", {
        p_bot_id: 99999,
        p_result: "win",
        p_pgn: VALID_PGN,
      });
      const msg = error?.message ?? "";
      report(
        "R1: bot_result callable (function exists)",
        !!error && msg.includes("Bot não encontrado"),
        msg || "no error (unexpected)"
      );
    }

    // R2: bot_result compatible with normal usage (loss with valid PGN)
    {
      const { data, error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_1_ID,
        p_result: "loss",
        p_pgn: VALID_PGN,
      });
      report(
        "R2: bot_result accepts normal loss",
        !error && !!data?.result_id,
        error ? error.message : `result_id=${data?.result_id}`
      );
    }

    // R3: UNIQUE constraint no duplicates
    {
      const { data, error } = await adminClient
        .from("bot_game_analysis")
        .select("bot_result_id")
        .limit(1000);
      if (error) {
        report("R3: UNIQUE constraint check", false, error.message);
      } else {
        const ids = (data ?? []).map((r: { bot_result_id: number }) => r.bot_result_id);
        const dupes = ids.filter((id: number, i: number) => ids.indexOf(id) !== i);
        report(
          "R3: No duplicate bot_result_id in bot_game_analysis",
          dupes.length === 0,
          dupes.length === 0
            ? `${ids.length} rows, 0 duplicates`
            : `DUPLICATES FOUND: ${dupes}`
        );
      }
    }

    // R4: Tables not corrupted
    {
      const { count: c1, error: e1 } = await adminClient
        .from("user_bot_results")
        .select("*", { count: "exact", head: true });
      const { count: c2, error: e2 } = await adminClient
        .from("bot_game_analysis")
        .select("*", { count: "exact", head: true });
      report(
        "R4: Tables accessible",
        !e1 && !e2,
        `user_bot_results: ${c1 ?? "error"} rows, bot_game_analysis: ${c2 ?? "error"} rows`
      );
    }

    // Wait for rate limit from R2 loss
    console.log("\n=== Waiting 32s for rate limit... ===");
    await sleep(32000);

    // ========== NIVEL A: RPC TESTS ==========
    console.log("\n=== NIVEL A: RPC ISOLATED TESTS ===");

    // A1: bot_result rejects locked bot
    {
      const { error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_2_ID,
        p_result: "win",
        p_pgn: VALID_PGN,
      });
      const msg = error?.message ?? "";
      report(
        "A1: Rejects locked bot (bot 2 without beating bot 1)",
        !!error && msg.includes("bloqueado"),
        msg || "NO ERROR (should have rejected)"
      );
    }

    // A2: bot_result rejects short PGN
    {
      const { error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_1_ID,
        p_result: "win",
        p_pgn: "abc",
      });
      const msg = error?.message ?? "";
      report(
        "A2: Rejects short PGN",
        !!error && msg.includes("PGN"),
        msg || "NO ERROR (should have rejected)"
      );
    }

    // A3: bot_result rejects null PGN
    {
      const { error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_1_ID,
        p_result: "win",
        p_pgn: null,
      });
      const msg = error?.message ?? "";
      report(
        "A3: Rejects null PGN",
        !!error && msg.includes("PGN"),
        msg || "NO ERROR (should have rejected)"
      );
    }

    // A4: bot_result grants XP on first win
    // First, read current XP
    const { data: beforeXp } = await adminClient
      .from("users")
      .select("xp, level")
      .eq("id", userId)
      .single();
    const xpBefore = beforeXp?.xp ?? 0;
    console.log(`  XP before: ${xpBefore}`);

    // Need to wait for rate limit (A2/A3 may not have inserted, but just in case)
    console.log("  Waiting 32s for rate limit...");
    await sleep(32000);

    let firstWinResultId: number | null = null;
    {
      const { data, error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_1_ID,
        p_result: "win",
        p_pgn: VALID_PGN,
      });
      const isFirstWin = data?.first_win === true;
      firstWinResultId = data?.result_id ?? null;
      report(
        "A4: First win grants XP (first_win=true)",
        !error && isFirstWin,
        error
          ? error.message
          : `result_id=${data?.result_id}, first_win=${data?.first_win}`
      );

      // Check XP increased
      const { data: afterXp } = await adminClient
        .from("users")
        .select("xp, level")
        .eq("id", userId)
        .single();
      const xpAfter = afterXp?.xp ?? 0;
      console.log(`  XP after: ${xpAfter}`);
      report(
        "A4b: XP actually increased",
        xpAfter > xpBefore,
        `before=${xpBefore}, after=${xpAfter}, delta=${xpAfter - xpBefore}`
      );
    }

    // A5: bot_result does NOT grant XP on second win
    console.log("  Waiting 32s for rate limit...");
    await sleep(32000);

    {
      const { data: beforeXp2 } = await adminClient
        .from("users")
        .select("xp")
        .eq("id", userId)
        .single();
      const xp2Before = beforeXp2?.xp ?? 0;

      const { data, error } = await anonClient.rpc("bot_result", {
        p_bot_id: BOT_1_ID,
        p_result: "win",
        p_pgn: VALID_PGN,
      });
      const isNotFirst = data?.first_win === false;

      const { data: afterXp2 } = await adminClient
        .from("users")
        .select("xp")
        .eq("id", userId)
        .single();
      const xp2After = afterXp2?.xp ?? 0;

      report(
        "A5: Second win — first_win=false",
        !error && isNotFirst,
        error
          ? error.message
          : `first_win=${data?.first_win}`
      );
      report(
        "A5b: XP unchanged on second win",
        xp2After === xp2Before,
        `before=${xp2Before}, after=${xp2After}`
      );
    }

    // A6: save_bot_analysis persists (with metadata)
    if (firstWinResultId) {
      const { data, error } = await anonClient.rpc("save_bot_analysis", {
        p_bot_result_id: firstWinResultId,
        p_pgn: VALID_PGN,
        p_moves_analysis_json: JSON.stringify([
          { moveNumber: 1, moveSan: "e4", category: "best", moveAccuracy: 98 },
        ]),
        p_accuracy_percent: 85.5,
        p_brilliant: 0,
        p_great: 2,
        p_good: 3,
        p_inaccuracy: 1,
        p_mistake: 1,
        p_blunder: 0,
        p_schema_version: 1,
        p_engine_info: "stockfish-18.0.5-lite",
      });
      report(
        "A6: save_bot_analysis persists",
        !error && !!data?.analysis_id,
        error ? error.message : `analysis_id=${data?.analysis_id}`
      );

      // Verify in table
      const { data: rows } = await adminClient
        .from("bot_game_analysis")
        .select("*")
        .eq("bot_result_id", firstWinResultId);
      report(
        "A6b: Row exists in bot_game_analysis",
        rows !== null && rows.length === 1 && rows[0].accuracy_percent === 85.5,
        rows && rows.length > 0
          ? `accuracy=${rows[0].accuracy_percent}, rows=${rows.length}`
          : "no rows found"
      );

      // A7: save_bot_analysis is idempotent
      const { data: data2, error: error2 } = await anonClient.rpc(
        "save_bot_analysis",
        {
          p_bot_result_id: firstWinResultId,
          p_pgn: VALID_PGN,
          p_moves_analysis_json: JSON.stringify([
            {
              moveNumber: 1,
              moveSan: "e4",
              category: "brilliant",
              moveAccuracy: 100,
            },
          ]),
          p_accuracy_percent: 92.0,
          p_brilliant: 1,
          p_great: 3,
          p_good: 2,
          p_inaccuracy: 0,
          p_mistake: 1,
          p_blunder: 0,
          p_schema_version: 1,
          p_engine_info: "stockfish-18.0.5-lite",
        }
      );
      report(
        "A7: save_bot_analysis idempotent (no error on second call)",
        !error2,
        error2 ? error2.message : `analysis_id=${data2?.analysis_id}`
      );

      const { data: rows2 } = await adminClient
        .from("bot_game_analysis")
        .select("*")
        .eq("bot_result_id", firstWinResultId);
      report(
        "A7b: Only 1 row, accuracy updated to 92.0",
        rows2 !== null &&
          rows2.length === 1 &&
          rows2[0].accuracy_percent === 92.0,
        rows2 && rows2.length > 0
          ? `rows=${rows2.length}, accuracy=${rows2[0].accuracy_percent}`
          : "no rows"
      );
      // A11: Metadata persisted (schema_version, engine_info, client_computed)
      const { data: metaRows } = await adminClient
        .from("bot_game_analysis")
        .select("schema_version, engine_info, client_computed")
        .eq("bot_result_id", firstWinResultId);
      if (metaRows && metaRows.length > 0) {
        const row = metaRows[0];
        report(
          "A11: Metadata persisted (schema_version=1, engine_info, client_computed=true)",
          row.schema_version === 1 &&
            row.engine_info === "stockfish-18.0.5-lite" &&
            row.client_computed === true,
          `schema_version=${row.schema_version}, engine_info=${row.engine_info}, client_computed=${row.client_computed}`
        );
      } else {
        report("A11: Metadata persisted", false, "no analysis rows found");
      }

      // A12: analysis_status = 'completed' in user_bot_results
      const { data: statusRow } = await adminClient
        .from("user_bot_results")
        .select("analysis_status")
        .eq("id", firstWinResultId)
        .single();
      report(
        "A12: analysis_status = 'completed' after save_bot_analysis",
        statusRow?.analysis_status === "completed",
        statusRow
          ? `analysis_status=${statusRow.analysis_status}`
          : "result not found"
      );
    } else {
      report("A6: save_bot_analysis", false, "No result_id from A4");
      report("A7: save_bot_analysis idempotent", false, "No result_id from A4");
    }

    // A8: Concurrent wins — only 1 row in user_bot_first_wins
    // We already have 2 wins for bot 1 from A4+A5. Check the first_wins table.
    {
      const { data: firstWinRows } = await adminClient
        .from("user_bot_first_wins")
        .select("*")
        .eq("user_id", userId)
        .eq("bot_id", BOT_1_ID);
      report(
        "A8: Exactly 1 row in user_bot_first_wins after 2 wins",
        firstWinRows !== null && firstWinRows.length === 1,
        firstWinRows
          ? `rows=${firstWinRows.length}`
          : "query failed"
      );
    }

    // A9: nextBot resolution — intermediate bot (unlock_order=5) → next is unlock_order=6
    if (BOT_5_ID && BOT_6_ID) {
      const { data: nextForBot5 } = await adminClient
        .from("bots")
        .select("id, name")
        .eq("unlock_order", 6)
        .single();
      report(
        "A9: nextBot for bot_5 (order=5) is bot_6 (order=6)",
        nextForBot5 !== null && nextForBot5.id === BOT_6_ID,
        nextForBot5
          ? `nextBot.id=${nextForBot5.id}, expected=${BOT_6_ID}`
          : "no bot found"
      );
    } else {
      report("A9: nextBot intermediate", false, "Bot 5 or 6 not found in seeds");
    }

    // A10: Last bot → nextBot is null
    {
      const { data: nextForLast } = await adminClient
        .from("bots")
        .select("id, name")
        .eq("unlock_order", LAST_BOT_ORDER + 1)
        .single();
      report(
        "A10: Last bot has no nextBot (null)",
        nextForLast === null,
        nextForLast
          ? `UNEXPECTED: found bot with order=${LAST_BOT_ORDER + 1}`
          : "correctly null"
      );
    }

    // A13: mark_analysis_failed sets analysis_status to 'failed'
    if (firstWinResultId) {
      // Reset analysis_status to 'none' first (via admin) so we can test the RPC
      await adminClient
        .from("user_bot_results")
        .update({ analysis_status: "none" })
        .eq("id", firstWinResultId);

      const { error: markError } = await anonClient.rpc("mark_analysis_failed", {
        p_bot_result_id: firstWinResultId,
      });
      const { data: statusAfterMark } = await adminClient
        .from("user_bot_results")
        .select("analysis_status")
        .eq("id", firstWinResultId)
        .single();
      report(
        "A13: mark_analysis_failed sets status to 'failed'",
        !markError && statusAfterMark?.analysis_status === "failed",
        markError
          ? markError.message
          : `analysis_status=${statusAfterMark?.analysis_status}`
      );
    } else {
      report("A13: mark_analysis_failed", false, "No result_id from A4");
    }

    // A14: mark_analysis_failed does nothing for another user's result
    {
      // Create a second user
      const { data: user2Data } = await adminClient.auth.admin.createUser({
        email: `bot-rpc-validate-2-${TIMESTAMP}@test.local`,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (user2Data?.user && firstWinResultId) {
        const user2Client = createClient(SUPABASE_URL, ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await user2Client.auth.signInWithPassword({
          email: `bot-rpc-validate-2-${TIMESTAMP}@test.local`,
          password: TEST_PASSWORD,
        });

        // Reset to 'none' to have a clean baseline
        await adminClient
          .from("user_bot_results")
          .update({ analysis_status: "none" })
          .eq("id", firstWinResultId);

        // Try to mark as failed from different user
        await user2Client.rpc("mark_analysis_failed", {
          p_bot_result_id: firstWinResultId,
        });

        const { data: statusAfter } = await adminClient
          .from("user_bot_results")
          .select("analysis_status")
          .eq("id", firstWinResultId)
          .single();
        report(
          "A14: mark_analysis_failed rejects other user's result",
          statusAfter?.analysis_status === "none",
          `analysis_status=${statusAfter?.analysis_status} (expected 'none')`
        );

        // Cleanup second user
        await adminClient.auth.admin.deleteUser(user2Data.user.id);
      } else {
        report("A14: mark_analysis_failed ownership", false, "Setup failed");
      }
    }

    // ========== SUMMARY ==========
    console.log("\n========================================");
    console.log("SUMMARY");
    console.log("========================================");
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) {
      console.log("\nFailed tests:");
      for (const r of results.filter((r) => !r.passed)) {
        console.log(`  ❌ ${r.name}: ${r.detail}`);
      }
    }
    console.log("");
  } finally {
    // ========== CLEANUP ==========
    console.log("=== CLEANUP ===");
    if (userId) {
      // Delete analysis, first wins, and results for test user
      await adminClient
        .from("bot_game_analysis")
        .delete()
        .eq("user_id", userId);
      await adminClient
        .from("user_bot_first_wins")
        .delete()
        .eq("user_id", userId);
      await adminClient
        .from("user_bot_results")
        .delete()
        .eq("user_id", userId);
      // Delete XP log entries
      await adminClient.from("xp_log").delete().eq("user_id", userId);
      // Delete user
      const { error: delError } =
        await adminClient.auth.admin.deleteUser(userId);
      if (delError) {
        console.log(
          `⚠️  Failed to delete test user ${userId}: ${delError.message}`
        );
        console.log("  CLEANUP INCOMPLETE — test user remains in database");
      } else {
        console.log(`Deleted test user ${userId}`);
      }
    }
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
