/**
 * ============================================================
 * Diagnóstico — Revanche Queue
 * ============================================================
 *
 * Verifica por que puzzles errados no Rating não aparecem
 * em /puzzles/revanche.
 *
 * Checagens:
 *   1. TABLE DEFAULT de next_review_at (deve ser now(), não now()+1d)
 *   2. Corpo da função puzzle_attempt (deve conter next_review_at = now())
 *   3. Entries stuck na fila (review_count=0 e next_review_at > now())
 *   4. Fluxo real: errar puzzle via RPC → fila criada com due ≤ now()
 *
 * Pré-requisitos:
 *   - .env.local com SUPABASE_SERVICE_ROLE_KEY
 *   - Migrations aplicadas
 *
 * Uso:
 *   npm run diagnose:revanche
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "../phase2/load-env.js";

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
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
  console.log("=== DIAGNÓSTICO REVANCHE ===\n");
  console.log(`Supabase URL: ${URL}\n`);

  // --- 1. Check TABLE DEFAULT ---
  console.log("1. TABLE DEFAULT de next_review_at");

  // Insert a test row without specifying next_review_at, then read it back
  // First, get a puzzle id
  const { data: puzzles } = await admin
    .from("puzzles")
    .select("id")
    .limit(1);

  if (!puzzles || puzzles.length === 0) {
    nok("Sem puzzles na tabela puzzles — não é possível diagnosticar");
    printSummary();
    return;
  }

  const testPuzzleId = puzzles[0].id;

  // Create a temporary test user
  const testEmail = `diag-revanche-${Date.now()}@cdxguabiruba.test`;
  const testPassword = `DiagTest@${Date.now()}`;

  const { data: authData, error: authErr } =
    await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

  if (authErr || !authData.user) {
    nok("Criar user de teste", authErr?.message);
    printSummary();
    return;
  }

  const testUserId = authData.user.id;
  info(`User de teste criado: ${testUserId}`);

  try {
    // Ensure profile exists (call an RPC as the user)
    const userClient = createClient(URL, ANON_KEY);
    const { error: loginErr } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (loginErr) {
      nok("Login user de teste", loginErr.message);
      return;
    }

    // Ensure profile via RPC call (get_next_puzzle_rating calls ensure_user_profile)
    await userClient.rpc("get_next_puzzle_rating");

    // Test 1: Insert without next_review_at to check DEFAULT
    const { error: insertErr } = await admin
      .from("puzzle_revanche_queue")
      .insert({
        user_id: testUserId,
        puzzle_id: testPuzzleId,
      });

    if (insertErr) {
      nok("Insert sem next_review_at", insertErr.message);
    } else {
      const { data: entry } = await admin
        .from("puzzle_revanche_queue")
        .select("next_review_at")
        .eq("user_id", testUserId)
        .eq("puzzle_id", testPuzzleId)
        .single();

      if (entry) {
        const nextReview = new Date(entry.next_review_at);
        const now = new Date();
        const diffMinutes = (nextReview.getTime() - now.getTime()) / 1000 / 60;

        if (diffMinutes > 60) {
          nok(
            "TABLE DEFAULT",
            `next_review_at = ${entry.next_review_at} (${Math.round(diffMinutes / 60)}h no futuro — DEFAULT é now()+1day!)`
          );
        } else {
          ok(`TABLE DEFAULT: next_review_at = now() (diff: ${Math.round(diffMinutes)}min)`);
        }
      }

      // Clean up test entry
      await admin
        .from("puzzle_revanche_queue")
        .delete()
        .eq("user_id", testUserId)
        .eq("puzzle_id", testPuzzleId);
    }

    // --- 2. Check puzzle_attempt RPC behavior ---
    console.log("\n2. FLUXO puzzle_attempt → revanche queue");

    const { data: attemptResult, error: attemptErr } = await userClient.rpc(
      "puzzle_attempt",
      {
        p_puzzle_id: testPuzzleId,
        p_moves: ["wrong_move_1", "wrong_move_2"],
        p_mode: "category",
        p_time_spent_ms: 5000,
      }
    );

    if (attemptErr) {
      nok("puzzle_attempt RPC", attemptErr.message);
    } else {
      const result = attemptResult as { solved: boolean; attempt_id: number };
      if (result.solved) {
        nok("puzzle_attempt", "Retornou solved=true com moves errados!");
      } else {
        ok(`puzzle_attempt: solved=false (attempt_id=${result.attempt_id})`);
      }

      // Check revanche queue entry
      const { data: queueEntry } = await admin
        .from("puzzle_revanche_queue")
        .select("next_review_at, review_count, resolved")
        .eq("user_id", testUserId)
        .eq("puzzle_id", testPuzzleId)
        .single();

      if (!queueEntry) {
        nok(
          "Revanche enqueue",
          "Nenhuma entry na puzzle_revanche_queue após puzzle_attempt incorreto!"
        );
      } else {
        const nextReview = new Date(queueEntry.next_review_at);
        const now = new Date();
        const diffMinutes =
          (nextReview.getTime() - now.getTime()) / 1000 / 60;

        info(
          `Queue entry: next_review_at=${queueEntry.next_review_at}, review_count=${queueEntry.review_count}, resolved=${queueEntry.resolved}`
        );

        if (diffMinutes > 5) {
          nok(
            "Revanche next_review_at",
            `${Math.round(diffMinutes)}min no futuro — deveria ser <= now()!`
          );
        } else {
          ok(`Revanche next_review_at: due agora (diff: ${Math.round(diffMinutes)}min)`);
        }

        if (queueEntry.resolved) {
          nok("Revanche resolved", "resolved=true — deveria ser false!");
        } else {
          ok("Revanche resolved=false");
        }
      }
    }

    // --- 3. Check get_revanche_due ---
    console.log("\n3. get_revanche_due RPC");

    const { data: dueData, error: dueErr } =
      await userClient.rpc("get_revanche_due");

    if (dueErr) {
      nok("get_revanche_due RPC", dueErr.message);
    } else {
      const due = dueData as {
        due_puzzles: unknown[];
        due_count: number;
        total_pending: number;
      };

      info(
        `due_count=${due.due_count}, total_pending=${due.total_pending}`
      );

      if (due.due_count === 0 && due.total_pending > 0) {
        nok(
          "get_revanche_due",
          `total_pending=${due.total_pending} mas due_count=0 — puzzles com next_review_at no futuro!`
        );
      } else if (due.due_count > 0) {
        ok(`get_revanche_due: ${due.due_count} puzzle(s) due agora`);
      } else {
        nok(
          "get_revanche_due",
          "due_count=0 E total_pending=0 — puzzle não foi enfileirado!"
        );
      }
    }

    // --- 4. Entries stuck globais ---
    // Usa margem de 5 minutos para compensar clock skew client/server
    console.log("\n4. ENTRIES STUCK (globais, margem 5min)");

    const futureThreshold = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: stuckData, error: stuckErr } = await admin
      .from("puzzle_revanche_queue")
      .select("id", { count: "exact" })
      .eq("resolved", false)
      .eq("review_count", 0)
      .neq("user_id", testUserId)
      .gt("next_review_at", futureThreshold);

    if (stuckErr) {
      nok("Query entries stuck", stuckErr.message);
    } else {
      const stuckCount = stuckData?.length ?? 0;
      if (stuckCount > 0) {
        nok(
          "Entries stuck",
          `${stuckCount} entries com review_count=0 mas next_review_at no futuro`
        );
      } else {
        ok("Nenhuma entry stuck na fila");
      }
    }
  } finally {
    // Cleanup: delete test data and user
    await admin
      .from("puzzle_revanche_queue")
      .delete()
      .eq("user_id", testUserId);
    await admin
      .from("user_puzzle_attempts")
      .delete()
      .eq("user_id", testUserId);
    await admin.auth.admin.deleteUser(testUserId);
    info(`User de teste ${testUserId} removido`);
  }

  printSummary();
}

function printSummary() {
  console.log("\n========================================");
  console.log(`RESULTADO: ${pass} passed | ${fail} failed`);
  console.log("========================================\n");

  if (fail > 0) {
    console.log("DIAGNÓSTICO: Há falhas — revise os itens marcados com [FAIL]");
    console.log(
      "AÇÃO PROVÁVEL: Aplicar migration fix_revanche_queue_definitive"
    );
    process.exit(1);
  } else {
    console.log("DIAGNÓSTICO: Revanche queue está funcionando corretamente!");
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
