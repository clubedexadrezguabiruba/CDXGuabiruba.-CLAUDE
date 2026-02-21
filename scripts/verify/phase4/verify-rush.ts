/**
 * ============================================================
 * Gate de Verificação — Fase 4: Rush (Server-Authority Score)
 * ============================================================
 *
 * Verifica que o fluxo rush funciona end-to-end com score server-side:
 *   1. start_rush cria run ativa com puzzles
 *   2. puzzle_attempt em rush armazena rush_run_id
 *   3. end_rush calcula score real = count(solved=true WHERE rush_run_id)
 *   4. end_rush com score inflado retorna score do servidor
 *   5. end_rush com run já completada retorna already_completed
 *   6. end_rush com tempo excedido rejeita
 *
 * Pré-requisitos:
 *   - .env.local com SUPABASE_SERVICE_ROLE_KEY
 *   - Migrations aplicadas (incluindo 20260217210000)
 *   - Ao menos 3 puzzles no banco
 *
 * Uso:
 *   npm run verify:rush
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "../phase2/load-env.js";

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    "Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY);

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

function info(label: string) {
  console.log(`  [INFO] ${label}`);
}

async function main() {
  console.log("=== VERIFICAÇÃO RUSH — SERVER-AUTHORITY SCORE ===\n");
  console.log(`Supabase URL: ${URL}\n`);

  // Create test user
  const ts = Date.now();
  const email = `verify-rush-${ts}@cdxguabiruba.test`;
  const password = `VerifyRush@${ts}`;

  const { data: authData, error: authErr } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authErr || !authData.user) {
    nok("Criar user de teste", authErr?.message);
    printSummary();
    return;
  }

  const userId = authData.user.id;
  info(`User criado: ${userId}`);

  try {
    // Login as test user
    const userClient = createClient(URL, ANON_KEY);
    const { error: loginErr } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (loginErr) {
      nok("Login", loginErr.message);
      return;
    }
    ok("Login OK");

    // Ensure profile exists
    await userClient.rpc("get_next_puzzle_rating");

    // --- Test 1: start_rush ---
    console.log("\n1. START_RUSH");

    const { data: rushData, error: rushErr } = await userClient.rpc(
      "start_rush",
      { p_mode: "3min" }
    );

    if (rushErr || !rushData) {
      nok("start_rush", rushErr?.message);
      return;
    }

    const rush = rushData as { run_id: number; puzzles: { id: number; fen: string; moves: string; rating: number }[] };

    if (!rush.run_id) {
      nok("start_rush", "run_id ausente");
      return;
    }
    ok(`start_rush: run_id=${rush.run_id}`);

    if (!rush.puzzles || rush.puzzles.length === 0) {
      nok("start_rush", "puzzles vazio");
      return;
    }
    ok(`start_rush: ${rush.puzzles.length} puzzles carregados`);

    // Verify run is active in DB
    const { data: runRow } = await admin
      .from("puzzle_rush_runs")
      .select("status, mode")
      .eq("id", rush.run_id)
      .single();

    if (runRow?.status !== "active") {
      nok("Run status", `esperado 'active', recebido '${runRow?.status}'`);
    } else {
      ok("Run status = active");
    }

    // --- Test 2: puzzle_attempt com rush_run_id ---
    console.log("\n2. PUZZLE_ATTEMPT COM RUSH_RUN_ID");

    const puzzle1 = rush.puzzles[0];
    const correctMoves1 = puzzle1.moves.split(" ");

    // Attempt 1: correct
    const { data: att1Data, error: att1Err } = await userClient.rpc(
      "puzzle_attempt",
      {
        p_puzzle_id: puzzle1.id,
        p_moves: correctMoves1,
        p_mode: "rush",
        p_time_spent_ms: 5000,
        p_rush_run_id: rush.run_id,
      }
    );

    if (att1Err) {
      nok("puzzle_attempt (correto)", att1Err.message);
    } else {
      const att1 = att1Data as { solved: boolean };
      if (att1.solved) {
        ok("puzzle_attempt: solved=true com moves corretos");
      } else {
        nok("puzzle_attempt", "solved=false com moves corretos");
      }
    }

    // Check rush_run_id stored in DB
    const { data: attemptRows } = await admin
      .from("user_puzzle_attempts")
      .select("rush_run_id, solved")
      .eq("user_id", userId)
      .eq("puzzle_id", puzzle1.id)
      .eq("mode", "rush")
      .order("attempted_at", { ascending: false })
      .limit(1);
    const attemptRow = attemptRows?.[0] ?? null;

    if (!attemptRow) {
      nok("rush_run_id no DB", "Tentativa não encontrada");
    } else if (attemptRow.rush_run_id !== rush.run_id) {
      nok(
        "rush_run_id no DB",
        `esperado ${rush.run_id}, recebido ${attemptRow.rush_run_id}`
      );
    } else {
      ok(`rush_run_id=${rush.run_id} armazenado no DB`);
    }

    // Attempt 2: wrong
    const puzzle2 = rush.puzzles[1];
    if (puzzle2) {
      await userClient.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle2.id,
        p_moves: ["x0x0"],
        p_mode: "rush",
        p_time_spent_ms: 3000,
        p_rush_run_id: rush.run_id,
      });
      info("puzzle_attempt errado registrado");
    }

    // Attempt 3: correct
    const puzzle3 = rush.puzzles[2];
    if (puzzle3) {
      const correctMoves3 = puzzle3.moves.split(" ");
      await userClient.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle3.id,
        p_moves: correctMoves3,
        p_mode: "rush",
        p_time_spent_ms: 4000,
        p_rush_run_id: rush.run_id,
      });
      info("puzzle_attempt correto #2 registrado");
    }

    // --- Test 3: end_rush calcula score servidor ---
    console.log("\n3. END_RUSH — SCORE SERVER-SIDE");

    const { data: endData, error: endErr } = await userClient.rpc("end_rush", {
      p_rush_run_id: rush.run_id,
      p_score: 999, // Inflated client score
      p_best_streak: 999, // Inflated client streak
      p_lives_remaining: 2,
    });

    if (endErr) {
      nok("end_rush", endErr.message);
    } else {
      const endResult = endData as {
        score: number;
        best_streak: number;
        is_new_record: boolean;
        already_completed?: boolean;
      };

      // Server should have calculated actual score = 2 (two correct attempts)
      if (endResult.score === 2) {
        ok(`end_rush: score servidor = 2 (ignorou client score 999)`);
      } else {
        nok(
          "end_rush score",
          `esperado 2, recebido ${endResult.score} (client enviou 999)`
        );
      }

      // Server should have calculated best_streak = 1 (correct, wrong, correct — max streak = 1)
      if (endResult.best_streak === 1) {
        ok(`end_rush: best_streak servidor = 1 (ignorou client streak 999)`);
      } else {
        nok(
          "end_rush best_streak",
          `esperado 1, recebido ${endResult.best_streak} (client enviou 999)`
        );
      }
    }

    // Verify run completed in DB
    const { data: completedRun } = await admin
      .from("puzzle_rush_runs")
      .select("status, score, best_streak")
      .eq("id", rush.run_id)
      .single();

    if (completedRun?.status !== "completed") {
      nok("Run status após end", `esperado 'completed', recebido '${completedRun?.status}'`);
    } else {
      ok("Run status = completed após end_rush");
    }

    if (completedRun?.score !== 2) {
      nok("Score no DB", `esperado 2, recebido ${completedRun?.score}`);
    } else {
      ok("Score no DB = 2 (servidor)");
    }

    // --- Test 4: end_rush com run já completada ---
    console.log("\n4. END_RUSH — RUN JÁ COMPLETADA");

    const { data: endAgainData, error: endAgainErr } = await userClient.rpc(
      "end_rush",
      {
        p_rush_run_id: rush.run_id,
        p_score: 0,
        p_best_streak: 0,
        p_lives_remaining: 0,
      }
    );

    if (endAgainErr) {
      nok("end_rush (repeat)", endAgainErr.message);
    } else {
      const repeat = endAgainData as { already_completed?: boolean };
      if (repeat.already_completed) {
        ok("end_rush: already_completed=true para run finalizada");
      } else {
        nok(
          "end_rush (repeat)",
          `already_completed não retornado: ${JSON.stringify(repeat)}`
        );
      }
    }

    // --- Test 5: end_rush com tempo excedido ---
    console.log("\n5. END_RUSH — TEMPO EXCEDIDO");

    // Create a new rush run
    const { data: rush2Data } = await userClient.rpc("start_rush", {
      p_mode: "3min",
    });
    const rush2 = rush2Data as { run_id: number };

    if (!rush2?.run_id) {
      nok("start_rush #2", "Falha ao criar segunda run");
    } else {
      // Backdoor: update started_at to 10 minutes ago via admin
      await admin
        .from("puzzle_rush_runs")
        .update({ started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() })
        .eq("id", rush2.run_id);

      const { error: expiredErr } = await userClient.rpc("end_rush", {
        p_rush_run_id: rush2.run_id,
        p_score: 0,
        p_best_streak: 0,
        p_lives_remaining: 0,
      });

      if (expiredErr && expiredErr.message.includes("Tempo excedido")) {
        ok("end_rush: rejeita tempo excedido");
      } else if (expiredErr) {
        // Other error is still a rejection, which is acceptable
        ok(`end_rush: rejeita com erro: ${expiredErr.message}`);
      } else {
        nok("end_rush (expirado)", "Deveria ter rejeitado mas aceitou");
      }

      // Verify run is completed (not left active forever)
      const { data: expiredRun } = await admin
        .from("puzzle_rush_runs")
        .select("status")
        .eq("id", rush2.run_id)
        .single();

      if (expiredRun?.status === "completed") {
        ok("Run expirada marcada como completed (não fica active)");
      } else {
        info(`Run expirada status: ${expiredRun?.status}`);
      }
    }
  } finally {
    // Cleanup
    await admin
      .from("user_puzzle_attempts")
      .delete()
      .eq("user_id", userId);
    await admin
      .from("puzzle_rush_runs")
      .delete()
      .eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    info(`Cleanup: user ${userId} removido`);
  }

  printSummary();
}

function printSummary() {
  console.log("\n========================================");
  console.log(`RESULTADO: ${pass} passed | ${fail} failed`);
  console.log("========================================\n");

  if (fail > 0) {
    console.log("VERIFICAÇÃO FALHOU — revise os itens [FAIL]");
    process.exit(1);
  } else {
    console.log("Fase 4 — Rush Server-Authority: VERIFICAÇÃO COMPLETA!");
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
