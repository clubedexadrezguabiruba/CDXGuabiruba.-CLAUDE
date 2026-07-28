/**
 * Gate de Verificação — Fase 5: Aulas Interativas
 *
 * Valida:
 *   1. 30 aulas existem (15 recruta + 15 soldado)
 *   2. content_json parseia corretamente
 *   3. total_steps = contagem de seções 'exercise'
 *   4. Cada exercício tem >=1 expected_move
 *   5. trail_order sequencial (1-15) em cada trilha
 *   6. Sem duplicata trail+trail_order
 *   7. RPCs complete_lesson_step, get_lesson_map, submit_review_gate existem
 *   8. Tabela review_gate_attempts existe com RLS
 *
 * Uso: npm run verify:phase5
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

const db = postgres(getDbUrl(), { ssl: "require" });

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
    // ========================================
    // Gate 1: 30 aulas existem
    // ========================================
    console.log("\n--- Gate 1: 30 aulas existem ---");

    const lessons = await db`
      SELECT id, title, trail, trail_order, total_steps, content_json
      FROM public.lessons
      WHERE trail IN ('recruta', 'soldado')
      ORDER BY trail, trail_order
    `;

    assert("Total de aulas >= 30", lessons.length >= 30, `Got: ${lessons.length}`);

    const recruta = lessons.filter((l) => l.trail === "recruta");
    const soldado = lessons.filter((l) => l.trail === "soldado");

    assert("15 aulas recruta", recruta.length === 15, `Got: ${recruta.length}`);
    assert("15 aulas soldado", soldado.length === 15, `Got: ${soldado.length}`);

    // ========================================
    // Gate 2: content_json parseia + total_steps correto
    // ========================================
    console.log("\n--- Gate 2: content_json + total_steps ---");

    let allContentValid = true;
    let allStepsCorrect = true;
    let allExercisesHaveMoves = true;

    for (const lesson of lessons) {
      const content = lesson.content_json;

      if (!content?.sections || !Array.isArray(content.sections)) {
        console.log(`    [FAIL] Aula #${lesson.id} "${lesson.title}": content_json invalido`);
        allContentValid = false;
        continue;
      }

      const exercises = content.sections.filter(
        (s: { type: string }) => s.type === "exercise"
      );
      const expectedSteps = exercises.length;
      const actualSteps = Number(lesson.total_steps);

      if (expectedSteps !== actualSteps) {
        console.log(
          `    [FAIL] Aula #${lesson.id} "${lesson.title}": total_steps=${actualSteps} mas exercises=${expectedSteps}`
        );
        allStepsCorrect = false;
      }

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (!Array.isArray(ex.expected_moves) || ex.expected_moves.length === 0) {
          console.log(
            `    [FAIL] Aula #${lesson.id} ex${i + 1}: sem expected_moves`
          );
          allExercisesHaveMoves = false;
        }
      }
    }

    assert("Todos content_json validos", allContentValid);
    assert("Todos total_steps corretos", allStepsCorrect);
    assert("Todos exercicios tem >=1 expected_move", allExercisesHaveMoves);

    // ========================================
    // Gate 3: trail_order sequencial + sem duplicatas
    // ========================================
    console.log("\n--- Gate 3: trail_order sequencial ---");

    for (const [trailName, trailLessons] of [
      ["recruta", recruta],
      ["soldado", soldado],
    ] as const) {
      const orders = trailLessons.map((l) => Number(l.trail_order));
      const expected = Array.from({ length: 15 }, (_, i) => i + 1);
      const isSequential = JSON.stringify(orders) === JSON.stringify(expected);
      assert(
        `${trailName}: trail_order 1-15 sequencial`,
        isSequential,
        `Got: [${orders.join(",")}]`
      );

      // Check duplicates
      const unique = new Set(orders);
      assert(
        `${trailName}: sem duplicatas trail_order`,
        unique.size === orders.length,
        `${orders.length} orders, ${unique.size} unique`
      );
    }

    // ========================================
    // Gate 4: RPCs existem
    // ========================================
    console.log("\n--- Gate 4: RPCs existem ---");

    const rpcs = await db`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('complete_lesson_step', 'get_lesson_map', 'submit_review_gate')
    `;
    const rpcNames = rpcs.map((r) => r.routine_name);
    assert("complete_lesson_step existe", rpcNames.includes("complete_lesson_step"));
    assert("get_lesson_map existe", rpcNames.includes("get_lesson_map"));
    assert("submit_review_gate existe", rpcNames.includes("submit_review_gate"));

    // ========================================
    // Gate 5: review_gate_attempts tabela + RLS
    // ========================================
    console.log("\n--- Gate 5: review_gate_attempts ---");

    const [rga] = await db`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'review_gate_attempts'
      ) AS exists
    `;
    assert("Tabela review_gate_attempts existe", rga?.exists === true);

    const [rlsEnabled] = await db`
      SELECT relrowsecurity FROM pg_class
      WHERE relname = 'review_gate_attempts' AND relnamespace = 'public'::regnamespace
    `;
    assert("RLS ativo em review_gate_attempts", rlsEnabled?.relrowsecurity === true);

    // ========================================
    // Gate 6: Colunas errors/hints_used/stars
    // ========================================
    console.log("\n--- Gate 6: Colunas user_lesson_progress ---");

    const columns = await db`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_lesson_progress'
        AND column_name IN ('errors', 'hints_used', 'stars')
    `;
    const colNames = columns.map((c) => c.column_name);
    assert("coluna errors existe", colNames.includes("errors"));
    assert("coluna hints_used existe", colNames.includes("hints_used"));
    assert("coluna stars existe", colNames.includes("stars"));

    // ========================================
    // Gate 7: Aulas tem seções de tipos variados
    // ========================================
    console.log("\n--- Gate 7: Aulas tem conteudo variado ---");

    let allHaveText = true;
    for (const lesson of lessons) {
      const content = lesson.content_json;
      if (!content?.sections) continue;
      const hasText = content.sections.some(
        (s: { type: string }) => s.type === "text"
      );
      if (!hasText) {
        console.log(
          `    [WARN] Aula #${lesson.id} "${lesson.title}": sem secao text`
        );
        allHaveText = false;
      }
    }
    assert("Todas aulas tem ao menos 1 secao text", allHaveText);

    // Count total exercises
    let totalExercises = 0;
    for (const lesson of lessons) {
      const content = lesson.content_json;
      if (!content?.sections) continue;
      totalExercises += content.sections.filter(
        (s: { type: string }) => s.type === "exercise"
      ).length;
    }
    console.log(`  Total de exercicios: ${totalExercises}`);
    assert("Total exercicios >= 100", totalExercises >= 100, `Got: ${totalExercises}`);

    // ========================================
    // Summary
    // ========================================
    console.log("\n" + "=".repeat(50));
    console.log(`  PASSED: ${passed}`);
    console.log(`  FAILED: ${failed}`);
    console.log("=".repeat(50));

    if (failed > 0) {
      console.log("\nVERIFICACAO FALHOU -- corrigir antes de avancar!");
      process.exit(1);
    } else {
      console.log("\nVERIFICACAO PASSOU -- Fase 5 esta solida!");
    }
  } catch (err) {
    console.error("\nErro inesperado:", err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
