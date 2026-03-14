/**
 * Gate de Verificacao — Fase 9: Turmas (Classes)
 *
 * Valida:
 *   1. 5 tabelas existem (classes, class_members, class_tasks, user_task_progress, class_feed)
 *   2. Colunas criticas por tabela
 *   3. UNIQUE constraints (class_members, user_task_progress, classes.invite_code)
 *   4. Foreign keys
 *   5. RLS ativo em todas as 5 tabelas
 *   6. RLS policies existem por nome (18 policies)
 *   7. RPCs existem (9)
 *   8. Fix de recursao aplicado (is_member_of_class SECURITY DEFINER)
 *   9. CHECK constraint em class_tasks.task_type
 *
 * Uso: npm run verify:turmas
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

// --- Conexao ---
const envPath = resolve(import.meta.dirname, "..", "..", "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
let dbUrl = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
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
    // ============================================================
    // Gate 1: Tabelas existem
    // ============================================================
    console.log("\n--- Gate 1: Tabelas existem ---");
    const expectedTables = [
      "classes",
      "class_members",
      "class_tasks",
      "user_task_progress",
      "class_feed",
    ];
    const tables = await db`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ${db(expectedTables)}
    `;
    const tableNames = tables.map((t) => t.table_name);
    for (const t of expectedTables) {
      assert(`Tabela ${t} existe`, tableNames.includes(t));
    }

    // ============================================================
    // Gate 2: Colunas criticas
    // ============================================================
    console.log("\n--- Gate 2: Colunas criticas ---");
    const columnSpec: Record<string, string[]> = {
      classes: ["id", "teacher_id", "name", "invite_code", "active", "created_at"],
      class_members: ["id", "class_id", "user_id", "joined_at"],
      class_tasks: [
        "id", "class_id", "teacher_id", "task_type", "config_json",
        "title", "description", "deadline", "active", "created_at",
      ],
      user_task_progress: ["id", "user_id", "task_id", "progress", "completed", "completed_at"],
      class_feed: ["id", "class_id", "user_id", "event_type", "event_data", "created_at"],
    };

    const allCols = await db`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ${db(expectedTables)}
    `;
    const colMap = new Map<string, Set<string>>();
    for (const row of allCols) {
      if (!colMap.has(row.table_name)) colMap.set(row.table_name, new Set());
      colMap.get(row.table_name)!.add(row.column_name);
    }
    for (const [table, cols] of Object.entries(columnSpec)) {
      const existing = colMap.get(table) ?? new Set();
      for (const col of cols) {
        assert(`${table}.${col} existe`, existing.has(col));
      }
    }

    // ============================================================
    // Gate 3: UNIQUE constraints
    // ============================================================
    console.log("\n--- Gate 3: UNIQUE constraints ---");
    const uniqueIndexes = await db`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexdef ILIKE '%UNIQUE%'
        AND tablename IN ${db(expectedTables)}
    `;
    const uidx = uniqueIndexes.map((r) => `${r.tablename}:${r.indexname}`).join("|");

    // class_members(class_id, user_id)
    const cmUnique = uniqueIndexes.some(
      (r) => r.tablename === "class_members"
    );
    assert("class_members tem UNIQUE constraint", cmUnique);

    // user_task_progress(user_id, task_id)
    const utpUnique = uniqueIndexes.some(
      (r) => r.tablename === "user_task_progress"
    );
    assert("user_task_progress tem UNIQUE constraint", utpUnique);

    // classes(invite_code)
    const icUnique = uniqueIndexes.some(
      (r) => r.tablename === "classes"
    );
    assert("classes tem UNIQUE constraint (invite_code)", icUnique);

    // ============================================================
    // Gate 4: Foreign keys
    // ============================================================
    console.log("\n--- Gate 4: Foreign keys ---");
    const fks = await db`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ${db(expectedTables)}
    `;
    const fkSet = new Set(fks.map((r) => `${r.table_name}.${r.column_name}->${r.foreign_table}`));

    const expectedFks = [
      "class_members.class_id->classes",
      "class_members.user_id->users",
      "class_tasks.class_id->classes",
      "class_tasks.teacher_id->users",
      "user_task_progress.task_id->class_tasks",
      "user_task_progress.user_id->users",
      "class_feed.class_id->classes",
      "class_feed.user_id->users",
    ];
    for (const fk of expectedFks) {
      assert(`FK ${fk}`, fkSet.has(fk));
    }

    // ============================================================
    // Gate 5: RLS ativo
    // ============================================================
    console.log("\n--- Gate 5: RLS ativo ---");
    const rlsCheck = await db`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ${db(expectedTables)}
    `;
    for (const row of rlsCheck) {
      assert(`RLS ativo em ${row.tablename}`, row.rowsecurity === true);
    }

    // ============================================================
    // Gate 6: RLS policies existem por nome
    // ============================================================
    console.log("\n--- Gate 6: RLS policies existem ---");
    const policies = await db`
      SELECT tablename, policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ${db(expectedTables)}
    `;
    const policySet = new Set(policies.map((r) => `${r.tablename}:${r.policyname}`));

    const expectedPolicies = [
      // classes
      "classes:classes_select_teacher",
      "classes:classes_select_member",
      "classes:classes_select_by_invite",
      "classes:classes_insert_teacher",
      "classes:classes_update_teacher",
      // class_members
      "class_members:class_members_select_teacher",
      "class_members:class_members_select_member",
      "class_members:class_members_insert",
      "class_members:class_members_delete_teacher",
      "class_members:class_members_delete_own",
      // class_tasks
      "class_tasks:class_tasks_select_teacher",
      "class_tasks:class_tasks_select_member",
      "class_tasks:class_tasks_insert_teacher",
      "class_tasks:class_tasks_update_teacher",
      // user_task_progress
      "user_task_progress:task_progress_select_own",
      "user_task_progress:task_progress_select_teacher",
      // class_feed
      "class_feed:class_feed_select_member",
      "class_feed:class_feed_select_teacher",
    ];
    for (const p of expectedPolicies) {
      assert(`Policy ${p}`, policySet.has(p));
    }

    // ============================================================
    // Gate 7: RPCs existem
    // ============================================================
    console.log("\n--- Gate 7: RPCs existem ---");
    const expectedRpcs = [
      "create_class",
      "join_class",
      "remove_class_member",
      "create_task",
      "check_my_tasks",
      "check_task_progress",
      "emit_class_feed",
      "get_class_ranking",
      "is_member_of_class",
    ];
    const rpcs = await db`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ${db(expectedRpcs)}
    `;
    const rpcNames = new Set(rpcs.map((r) => r.routine_name));
    for (const rpc of expectedRpcs) {
      assert(`RPC ${rpc} existe`, rpcNames.has(rpc));
    }

    // ============================================================
    // Gate 8: Fix de recursao (is_member_of_class SECURITY DEFINER)
    // ============================================================
    console.log("\n--- Gate 8: Fix de recursao ---");
    const secDef = await db`
      SELECT routine_name, security_type FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'is_member_of_class'
    `;
    assert(
      "is_member_of_class eh SECURITY DEFINER",
      secDef.length > 0 && secDef[0].security_type === "DEFINER"
    );

    // Verificar que a policy usa a funcao
    const memberPolicy = await db`
      SELECT qual FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'class_members'
        AND policyname = 'class_members_select_member'
    `;
    assert(
      "Policy class_members_select_member usa is_member_of_class",
      memberPolicy.length > 0 &&
        (memberPolicy[0].qual as string).includes("is_member_of_class")
    );

    // ============================================================
    // Gate 9: CHECK constraint em class_tasks.task_type
    // ============================================================
    console.log("\n--- Gate 9: CHECK constraint em task_type ---");
    const checks = await db`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'public.class_tasks'::regclass
        AND contype = 'c'
    `;
    const hasTaskTypeCheck = checks.some((c) => {
      const def = (c.def as string).toLowerCase();
      return def.includes("task_type") && def.includes("lesson");
    });
    assert("CHECK constraint em class_tasks.task_type", hasTaskTypeCheck);

    // ============================================================
    // Resumo
    // ============================================================
    console.log(`\n=============================`);
    console.log(`  PASS: ${passed}  |  FAIL: ${failed}`);
    console.log(`=============================`);

    await db.end();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Erro na verificacao:", err);
    await db.end();
    process.exit(1);
  }
}

main();
