/**
 * ============================================================
 * Gate de Verificação — Fase 4: Revanche Queue (expandido)
 * ============================================================
 *
 * Verifica que o fluxo revanche funciona end-to-end:
 *   1. TABLE DEFAULT de next_review_at é now()
 *   2. puzzle_attempt com erro → entry na fila com next_review_at <= now()
 *   3. get_revanche_due retorna o puzzle como due + resolved_count
 *   4. Bug 5: Reset parcial (não graduado: -1 estágio; graduado: reset total)
 *   5. Sobrecarga: soft cap 30 (novos entram com delay)
 *   6. Retorno enriquecido: revanche_resolved, revanche_review_count
 *
 * Pré-requisitos:
 *   - .env.local com SUPABASE_SERVICE_ROLE_KEY
 *   - Migration 20260220120000_revanche_improvements aplicada
 *   - Ao menos 2 puzzles no banco
 *
 * Uso:
 *   npm run verify:revanche
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
  console.log("=== VERIFICAÇÃO REVANCHE — FASE 4 (expandida) ===\n");
  console.log(`Supabase URL: ${URL}\n`);

  // Get puzzles to test with
  const { data: puzzles } = await admin
    .from("puzzles")
    .select("id, moves")
    .limit(2);

  if (!puzzles || puzzles.length < 1) {
    nok("Sem puzzles no banco");
    printSummary();
    return;
  }

  const testPuzzle = puzzles[0];
  const testPuzzle2 = puzzles[1] ?? puzzles[0]; // fallback if only 1 puzzle
  info(`Puzzle de teste: id=${testPuzzle.id}`);
  if (testPuzzle2.id !== testPuzzle.id) info(`Puzzle 2: id=${testPuzzle2.id}`);

  // Create test user
  const ts = Date.now();
  const email = `verify-revanche-${ts}@cdxguabiruba.test`;
  const password = `VerifyRev@${ts}`;

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

    // --- Test 1: TABLE DEFAULT ---
    console.log("\n1. TABLE DEFAULT");

    const { error: defaultInsertErr } = await admin
      .from("puzzle_revanche_queue")
      .insert({ user_id: userId, puzzle_id: testPuzzle.id });

    if (defaultInsertErr) {
      nok("Insert sem next_review_at", defaultInsertErr.message);
    } else {
      const { data: defaultEntry } = await admin
        .from("puzzle_revanche_queue")
        .select("next_review_at")
        .eq("user_id", userId)
        .eq("puzzle_id", testPuzzle.id)
        .single();

      if (defaultEntry) {
        const diff =
          (new Date(defaultEntry.next_review_at).getTime() - Date.now()) /
          1000 /
          60;
        if (diff > 60) {
          nok(
            "TABLE DEFAULT",
            `next_review_at ${Math.round(diff / 60)}h no futuro (deve ser ~now())`
          );
        } else {
          ok(`TABLE DEFAULT = now() (diff: ${Math.round(diff)}min)`);
        }
      }

      // Clean up for next test
      await admin
        .from("puzzle_revanche_queue")
        .delete()
        .eq("user_id", userId)
        .eq("puzzle_id", testPuzzle.id);
    }

    // --- Test 2: puzzle_attempt wrong → enqueue ---
    console.log("\n2. puzzle_attempt ERRADO → REVANCHE ENQUEUE");

    const { data: attemptData, error: attemptErr } = await userClient.rpc(
      "puzzle_attempt",
      {
        p_puzzle_id: testPuzzle.id,
        p_moves: ["x0x0"],
        p_mode: "category",
        p_time_spent_ms: 3000,
      }
    );

    if (attemptErr) {
      nok("puzzle_attempt RPC", attemptErr.message);
    } else {
      const result = attemptData as { solved: boolean };
      if (result.solved) {
        nok("puzzle_attempt", "solved=true com moves errados");
      } else {
        ok("puzzle_attempt: solved=false");
      }
    }

    // Check queue entry
    const { data: qEntry } = await admin
      .from("puzzle_revanche_queue")
      .select("next_review_at, review_count, resolved")
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id)
      .single();

    if (!qEntry) {
      nok("Revanche entry", "Não criada após puzzle_attempt incorreto");
    } else {
      const diff =
        (new Date(qEntry.next_review_at).getTime() - Date.now()) / 1000 / 60;

      if (diff > 5) {
        nok(
          "next_review_at",
          `${Math.round(diff)}min no futuro (deve ser <= now())`
        );
      } else {
        ok(`next_review_at <= now() (diff: ${Math.round(diff)}min)`);
      }

      if (qEntry.review_count !== 0) {
        nok("review_count", `${qEntry.review_count} (deve ser 0)`);
      } else {
        ok("review_count = 0");
      }

      if (qEntry.resolved !== false) {
        nok("resolved", `${qEntry.resolved} (deve ser false)`);
      } else {
        ok("resolved = false");
      }
    }

    // --- Test 3: get_revanche_due returns puzzle + resolved_count ---
    console.log("\n3. get_revanche_due RETORNA PUZZLE + resolved_count");

    const { data: dueData, error: dueErr } =
      await userClient.rpc("get_revanche_due");

    if (dueErr) {
      nok("get_revanche_due", dueErr.message);
    } else {
      const due = dueData as {
        due_puzzles: Array<{ puzzle_id: number }>;
        due_count: number;
        total_pending: number;
        resolved_count: number;
      };

      if (due.due_count === 0) {
        nok(
          "get_revanche_due",
          `due_count=0 (total_pending=${due.total_pending})`
        );
      } else {
        ok(`get_revanche_due: ${due.due_count} due, ${due.total_pending} pending`);
      }

      const found = due.due_puzzles?.some(
        (p) => p.puzzle_id === testPuzzle.id
      );
      if (found) {
        ok(`Puzzle ${testPuzzle.id} encontrado no due_puzzles`);
      } else {
        nok(
          "Puzzle no due_puzzles",
          `Puzzle ${testPuzzle.id} não está no array`
        );
      }

      // Check resolved_count exists
      if (typeof due.resolved_count === "number") {
        ok(`resolved_count presente: ${due.resolved_count}`);
      } else {
        nok("resolved_count", "Campo não existe no retorno");
      }
    }

    // --- Test 4: Bug 5 — Reset parcial (não graduado) ---
    console.log("\n4. BUG 5 — RESET PARCIAL (NÃO GRADUADO)");

    // Set review_count=2, resolved=false (estágio 3, não graduado)
    await admin
      .from("puzzle_revanche_queue")
      .update({ review_count: 2, resolved: false, next_review_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id);

    // Re-err in another mode → should decrement to 1 (not reset to 0)
    await userClient.rpc("puzzle_attempt", {
      p_puzzle_id: testPuzzle.id,
      p_moves: ["x0x0"],
      p_mode: "rating",
      p_time_spent_ms: 1000,
    });

    const { data: resetEntry1 } = await admin
      .from("puzzle_revanche_queue")
      .select("review_count, resolved, next_review_at")
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id)
      .single();

    if (!resetEntry1) {
      nok("Reset parcial", "Entry não encontrada");
    } else {
      if (resetEntry1.review_count === 1) {
        ok("Não graduado (2→1): review_count decrementou para 1");
      } else {
        nok("Não graduado (2→1)", `review_count=${resetEntry1.review_count} (esperado 1)`);
      }
      if (resetEntry1.resolved === false) {
        ok("resolved = false após reset parcial");
      } else {
        nok("resolved após reset", `${resetEntry1.resolved} (esperado false)`);
      }
    }

    // Re-err again → should decrement from 1 to 0
    await userClient.rpc("puzzle_attempt", {
      p_puzzle_id: testPuzzle.id,
      p_moves: ["x0x0"],
      p_mode: "rating",
      p_time_spent_ms: 1000,
    });

    const { data: resetEntry2 } = await admin
      .from("puzzle_revanche_queue")
      .select("review_count")
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id)
      .single();

    if (resetEntry2?.review_count === 0) {
      ok("Não graduado (1→0): review_count decrementou para 0");
    } else {
      nok("Não graduado (1→0)", `review_count=${resetEntry2?.review_count} (esperado 0)`);
    }

    // Re-err once more → should stay at 0 (GREATEST(..., 0))
    await userClient.rpc("puzzle_attempt", {
      p_puzzle_id: testPuzzle.id,
      p_moves: ["x0x0"],
      p_mode: "rating",
      p_time_spent_ms: 1000,
    });

    const { data: resetEntry3 } = await admin
      .from("puzzle_revanche_queue")
      .select("review_count")
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id)
      .single();

    if (resetEntry3?.review_count === 0) {
      ok("Não graduado (0→0): review_count permanece em 0");
    } else {
      nok("Não graduado (0→0)", `review_count=${resetEntry3?.review_count} (esperado 0)`);
    }

    // --- Test 5: Bug 5 — Reset parcial (graduado) ---
    console.log("\n5. BUG 5 — RESET TOTAL (GRADUADO)");

    // Set resolved=true (graduado)
    await admin
      .from("puzzle_revanche_queue")
      .update({ review_count: 3, resolved: true, next_review_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id);

    // Re-err → should reset to 0 (total reset for graduated)
    await userClient.rpc("puzzle_attempt", {
      p_puzzle_id: testPuzzle.id,
      p_moves: ["x0x0"],
      p_mode: "rating",
      p_time_spent_ms: 1000,
    });

    const { data: gradReset } = await admin
      .from("puzzle_revanche_queue")
      .select("review_count, resolved")
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id)
      .single();

    if (!gradReset) {
      nok("Reset graduado", "Entry não encontrada");
    } else {
      if (gradReset.review_count === 0) {
        ok("Graduado → reset total: review_count=0");
      } else {
        nok("Graduado reset", `review_count=${gradReset.review_count} (esperado 0)`);
      }
      if (gradReset.resolved === false) {
        ok("Graduado → resolved=false após reset");
      } else {
        nok("Graduado resolved", `${gradReset.resolved} (esperado false)`);
      }
    }

    // --- Test 6: Retorno enriquecido no modo revanche ---
    console.log("\n6. RETORNO ENRIQUECIDO (modo revanche)");

    // Make sure puzzle is in queue with review_count=0
    await admin
      .from("puzzle_revanche_queue")
      .update({ review_count: 0, resolved: false, next_review_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("puzzle_id", testPuzzle.id);

    // Attempt correct in revanche mode
    const correctMoves = testPuzzle.moves.split(" ");
    const { data: revAttempt, error: revErr } = await userClient.rpc("puzzle_attempt", {
      p_puzzle_id: testPuzzle.id,
      p_moves: correctMoves,
      p_mode: "revanche",
      p_time_spent_ms: 5000,
    });

    if (revErr) {
      nok("Revanche attempt RPC", revErr.message);
    } else {
      const r = revAttempt as {
        solved: boolean;
        revanche_resolved: boolean;
        revanche_review_count: number;
        revanche_next_review: string | null;
      };

      if (r.solved !== true) {
        nok("Revanche acerto", "solved=false com moves corretos");
      } else {
        ok("Revanche acerto: solved=true");
      }

      if (typeof r.revanche_resolved === "boolean") {
        ok(`revanche_resolved presente: ${r.revanche_resolved}`);
      } else {
        nok("revanche_resolved", "Campo não existe no retorno");
      }

      if (typeof r.revanche_review_count === "number") {
        ok(`revanche_review_count presente: ${r.revanche_review_count}`);
        if (r.revanche_review_count === 1) {
          ok("review_count incrementou de 0 para 1");
        } else {
          nok("review_count após acerto", `${r.revanche_review_count} (esperado 1)`);
        }
      } else {
        nok("revanche_review_count", "Campo não existe no retorno");
      }

      if (r.revanche_next_review) {
        ok(`revanche_next_review presente: ${r.revanche_next_review}`);
      } else {
        nok("revanche_next_review", "Campo não existe ou null");
      }
    }

    // --- Test 7: Sobrecarga (soft cap 30) ---
    console.log("\n7. SOBRECARGA — SOFT CAP 30");

    // Clean queue first
    await admin
      .from("puzzle_revanche_queue")
      .delete()
      .eq("user_id", userId);

    // Insert 30 dummy entries (need 30 distinct puzzle IDs)
    const { data: manyPuzzles } = await admin
      .from("puzzles")
      .select("id")
      .limit(31);

    if (!manyPuzzles || manyPuzzles.length < 31) {
      info(`Apenas ${manyPuzzles?.length ?? 0} puzzles disponíveis — pulando teste de sobrecarga (precisa de 31)`);
    } else {
      // Insert 30 entries directly
      const entries = manyPuzzles.slice(0, 30).map((p) => ({
        user_id: userId,
        puzzle_id: p.id,
        next_review_at: new Date().toISOString(),
        resolved: false,
      }));

      await admin.from("puzzle_revanche_queue").insert(entries);

      // Verify count
      const { count: preCount } = await admin
        .from("puzzle_revanche_queue")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("resolved", false);

      info(`Pendentes antes do cap: ${preCount}`);

      // Now fail puzzle #31 via RPC
      const puzzle31 = manyPuzzles[30];
      await userClient.rpc("puzzle_attempt", {
        p_puzzle_id: puzzle31.id,
        p_moves: ["x0x0"],
        p_mode: "category",
        p_time_spent_ms: 1000,
      });

      // Check puzzle #31 in queue
      const { data: capEntry } = await admin
        .from("puzzle_revanche_queue")
        .select("next_review_at")
        .eq("user_id", userId)
        .eq("puzzle_id", puzzle31.id)
        .single();

      if (!capEntry) {
        nok("Sobrecarga", "Puzzle #31 não entrou na fila");
      } else {
        const diffMin =
          (new Date(capEntry.next_review_at).getTime() - Date.now()) / 1000 / 60;

        if (diffMin > 60) {
          // Should be ~24h in future (1 day delay)
          ok(`Sobrecarga: puzzle #31 com delay (~${Math.round(diffMin / 60)}h no futuro)`);
        } else {
          nok(
            "Sobrecarga delay",
            `next_review_at apenas ${Math.round(diffMin)}min no futuro (esperado ~24h)`
          );
        }
      }

      // Verify total count is 31 (not dropped)
      const { count: postCount } = await admin
        .from("puzzle_revanche_queue")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("resolved", false);

      if (postCount === 31) {
        ok("Sobrecarga: puzzle não foi dropado (count=31)");
      } else {
        nok("Sobrecarga count", `${postCount} (esperado 31)`);
      }
    }

  } finally {
    // Cleanup
    await admin
      .from("puzzle_revanche_queue")
      .delete()
      .eq("user_id", userId);
    await admin
      .from("user_puzzle_attempts")
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
    console.log("Fase 4 — Revanche: VERIFICAÇÃO COMPLETA!");
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
