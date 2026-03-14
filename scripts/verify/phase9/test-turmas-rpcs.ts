/**
 * Testes Funcionais — RPCs de Turmas
 *
 * Testa criacao, ingresso, tarefas, ranking, remocao e autorizacao.
 * Cria usuarios de teste via Admin API, executa RPCs como cada role,
 * e limpa tudo ao final.
 *
 * Uso: npm run test:turmas-rpcs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// --- Carregar .env.local ---
const envPath = resolve(import.meta.dirname, "..", "..", "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("Variaveis de ambiente faltando (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY)");
  process.exit(1);
}

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

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

// --- Helpers ---

async function createTestUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Falha ao criar user: ${JSON.stringify(data)}`);
  return data.id;
}

async function deleteTestUser(userId: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: serviceHeaders,
  });
}

async function promoteToTeacher(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...serviceHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ role: "professor" }),
  });
  if (!res.ok) throw new Error(`Falha ao promover: ${await res.text()}`);
}

async function signIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`signIn failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function callRpc(
  token: string,
  rpcName: string,
  params: Record<string, unknown>
): Promise<{ data: unknown; error: string | null; status: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const body = await res.text();
  let data: unknown;
  try { data = JSON.parse(body); } catch { data = body; }
  const error = !res.ok && typeof data === "object" && data !== null && "message" in data
    ? (data as { message: string }).message
    : !res.ok ? body : null;
  return { data, error, status: res.status };
}

async function directInsert(
  token: string,
  table: string,
  row: Record<string, unknown>
): Promise<{ error: string | null; status: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  return { error: res.ok ? null : await res.text(), status: res.status };
}

async function deleteClassCascade(classId: number) {
  for (const table of ["class_feed", "user_task_progress", "class_tasks", "class_members"]) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?class_id=eq.${classId}`, {
      method: "DELETE",
      headers: { ...serviceHeaders, Prefer: "return=minimal" },
    });
  }
  await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`, {
    method: "DELETE",
    headers: { ...serviceHeaders, Prefer: "return=minimal" },
  });
}

// --- Buscar uma lesson valida para testes de create_task ---
async function getFirstLessonId(): Promise<number | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lessons?select=id&order=id.asc&limit=1`,
    { headers: serviceHeaders }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0].id : null;
}

// ============================================================
// Main
// ============================================================
async function main() {
  const TS = Date.now();
  const TEACHER_EMAIL = `rpc-prof-${TS}@cdxguabiruba.test`;
  const STUDENT_EMAIL = `rpc-aluno-${TS}@cdxguabiruba.test`;
  const OUTSIDER_EMAIL = `rpc-outsider-${TS}@cdxguabiruba.test`;
  const PASSWORD = `Test@${TS}`;

  let teacherId = "";
  let studentId = "";
  let outsiderId = "";
  let classId = 0;
  let inviteCode = "";
  let taskId = 0;

  try {
    // Setup: criar usuarios
    console.log("\n--- Setup: criar usuarios ---");
    teacherId = await createTestUser(TEACHER_EMAIL, PASSWORD);
    await promoteToTeacher(teacherId);
    studentId = await createTestUser(STUDENT_EMAIL, PASSWORD);
    outsiderId = await createTestUser(OUTSIDER_EMAIL, PASSWORD);

    // Esperar triggers de criacao de perfil
    await new Promise((r) => setTimeout(r, 2000));

    const teacherToken = await signIn(TEACHER_EMAIL, PASSWORD);
    const studentToken = await signIn(STUDENT_EMAIL, PASSWORD);
    const outsiderToken = await signIn(OUTSIDER_EMAIL, PASSWORD);

    console.log("  Usuarios criados: professor, aluno, outsider");

    // ============================================================
    // Teste 1: create_class como professor
    // ============================================================
    console.log("\n--- Teste 1: create_class como professor ---");
    const createRes = await callRpc(teacherToken, "create_class", { p_name: "Turma RPC Test" });
    assert("create_class retorna sucesso", createRes.error === null, createRes.error ?? undefined);
    if (createRes.data && typeof createRes.data === "object") {
      const d = createRes.data as Record<string, unknown>;
      classId = Number(d.id) || 0;
      inviteCode = String(d.invite_code ?? "");
      assert("Retorna id", classId > 0, `id=${classId}`);
      assert("Retorna invite_code", inviteCode.length > 0);
      assert("Retorna name", d.name === "Turma RPC Test");
    }

    // ============================================================
    // Teste 2: create_class como aluno → erro
    // ============================================================
    console.log("\n--- Teste 2: create_class como aluno (deve falhar) ---");
    const createStudent = await callRpc(studentToken, "create_class", { p_name: "Hack" });
    assert("Aluno nao pode criar turma", createStudent.error !== null);

    // ============================================================
    // Teste 3: join_class com codigo valido
    // ============================================================
    console.log("\n--- Teste 3: join_class com codigo valido ---");
    const joinRes = await callRpc(studentToken, "join_class", { p_invite_code: inviteCode });
    assert("join_class retorna sucesso", joinRes.error === null, joinRes.error ?? undefined);
    if (joinRes.data && typeof joinRes.data === "object") {
      const d = joinRes.data as Record<string, unknown>;
      assert("already_member = false", d.already_member === false);
      assert("class_name correto", String(d.class_name) === "Turma RPC Test");
    }

    // ============================================================
    // Teste 4: join_class repetido → already_member
    // ============================================================
    console.log("\n--- Teste 4: join_class repetido ---");
    const joinAgain = await callRpc(studentToken, "join_class", { p_invite_code: inviteCode });
    assert("join_class repetido nao da erro", joinAgain.error === null, joinAgain.error ?? undefined);
    if (joinAgain.data && typeof joinAgain.data === "object") {
      const d = joinAgain.data as Record<string, unknown>;
      assert("already_member = true", d.already_member === true);
    }

    // ============================================================
    // Teste 5: join_class com codigo invalido
    // ============================================================
    console.log("\n--- Teste 5: join_class com codigo invalido ---");
    const joinBad = await callRpc(studentToken, "join_class", { p_invite_code: "INVALID999" });
    assert("join_class invalido retorna erro", joinBad.error !== null);

    // ============================================================
    // Teste 6: create_task como professor
    // ============================================================
    console.log("\n--- Teste 6: create_task como professor ---");
    const lessonId = await getFirstLessonId();
    if (lessonId) {
      const taskRes = await callRpc(teacherToken, "create_task", {
        p_class_id: classId,
        p_task_type: "lesson",
        p_config_json: { lesson_id: lessonId },
        p_title: "Completar aula teste",
        p_description: "Tarefa de teste RPC",
        p_deadline: null,
      });
      assert("create_task retorna sucesso", taskRes.error === null, taskRes.error ?? undefined);
      if (taskRes.data && typeof taskRes.data === "object") {
        const d = taskRes.data as Record<string, unknown>;
        taskId = Number(d.task_id) || 0;
        assert("Retorna task_id", taskId > 0, `task_id=${taskId}`);
      }
    } else {
      console.log("  [SKIP] Nenhuma lesson no banco — pulando teste de create_task lesson");
    }

    // ============================================================
    // Teste 7: create_task como aluno → erro
    // ============================================================
    console.log("\n--- Teste 7: create_task como aluno (deve falhar) ---");
    const taskStudent = await callRpc(studentToken, "create_task", {
      p_class_id: classId,
      p_task_type: "puzzles_count",
      p_config_json: { count: 5 },
      p_title: "Hack task",
      p_description: "",
      p_deadline: null,
    });
    assert("Aluno nao pode criar tarefa", taskStudent.error !== null);

    // ============================================================
    // Teste 8: check_my_tasks como aluno
    // ============================================================
    console.log("\n--- Teste 8: check_my_tasks como aluno ---");
    const myTasks = await callRpc(studentToken, "check_my_tasks", {});
    assert("check_my_tasks retorna sucesso", myTasks.error === null, myTasks.error ?? undefined);
    assert("Retorna array", Array.isArray(myTasks.data), `tipo=${typeof myTasks.data}`);

    // ============================================================
    // Teste 9: check_task_progress como aluno
    // ============================================================
    console.log("\n--- Teste 9: check_task_progress ---");
    if (taskId > 0) {
      const progress = await callRpc(studentToken, "check_task_progress", { p_task_id: taskId });
      assert("check_task_progress retorna sucesso", progress.error === null, progress.error ?? undefined);
      if (progress.data && typeof progress.data === "object") {
        const d = progress.data as Record<string, unknown>;
        assert("Retorna task_id", Number(d.task_id) === taskId);
        assert("Retorna progress (number)", typeof d.progress === "number");
        assert("Retorna completed (boolean)", typeof d.completed === "boolean");
      }
    } else {
      console.log("  [SKIP] Sem task_id — pulando");
    }

    // ============================================================
    // Teste 10: get_class_ranking como membro
    // ============================================================
    console.log("\n--- Teste 10: get_class_ranking como membro ---");
    const rankMember = await callRpc(studentToken, "get_class_ranking", {
      p_class_id: classId,
      p_type: "rating",
      p_limit: 30,
    });
    assert("get_class_ranking como membro retorna sucesso", rankMember.error === null, rankMember.error ?? undefined);
    assert("Retorna array", Array.isArray(rankMember.data), `tipo=${typeof rankMember.data}`);

    // ============================================================
    // Teste 11: get_class_ranking como nao-membro → erro
    // ============================================================
    console.log("\n--- Teste 11: get_class_ranking como nao-membro (deve falhar) ---");
    const rankOutsider = await callRpc(outsiderToken, "get_class_ranking", {
      p_class_id: classId,
      p_type: "rating",
      p_limit: 30,
    });
    assert("Outsider nao pode ver ranking da turma", rankOutsider.error !== null);

    // ============================================================
    // Teste 12: remove_class_member como aluno → erro
    // ============================================================
    console.log("\n--- Teste 12: remove_class_member como aluno (deve falhar) ---");
    const removeStudent = await callRpc(studentToken, "remove_class_member", {
      p_class_id: classId,
      p_user_id: studentId,
    });
    assert("Aluno nao pode remover membro", removeStudent.error !== null);

    // ============================================================
    // Teste 13: remove_class_member como professor
    // ============================================================
    console.log("\n--- Teste 13: remove_class_member como professor ---");
    const removeTeacher = await callRpc(teacherToken, "remove_class_member", {
      p_class_id: classId,
      p_user_id: studentId,
    });
    assert("Professor remove membro com sucesso", removeTeacher.error === null, removeTeacher.error ?? undefined);
    if (removeTeacher.data && typeof removeTeacher.data === "object") {
      const d = removeTeacher.data as Record<string, unknown>;
      assert("Retorna removed = true", d.removed === true);
    }

    // ============================================================
    // Teste 14: RLS — aluno tenta INSERT direto em class_tasks
    // ============================================================
    console.log("\n--- Teste 14: RLS — INSERT direto em class_tasks (bloqueado) ---");
    const directTask = await directInsert(studentToken, "class_tasks", {
      class_id: classId,
      teacher_id: studentId,
      task_type: "lesson",
      config_json: {},
      title: "Hack",
    });
    assert("INSERT direto em class_tasks bloqueado", directTask.status >= 400);

    // ============================================================
    // Teste 15: RLS — outsider tenta DELETE em class_members (sem efeito)
    // ============================================================
    console.log("\n--- Teste 15: RLS — DELETE direto em class_members (sem efeito) ---");
    // Re-adicionar aluno para testar
    await callRpc(studentToken, "join_class", { p_invite_code: inviteCode });

    // Outsider tenta deletar o membro
    await fetch(
      `${SUPABASE_URL}/rest/v1/class_members?class_id=eq.${classId}&user_id=eq.${studentId}`,
      {
        method: "DELETE",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${outsiderToken}`,
          Prefer: "return=minimal",
        },
      }
    );

    // Verificar que o membro ainda existe (RLS filtrou o DELETE)
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/class_members?class_id=eq.${classId}&user_id=eq.${studentId}&select=id`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const remaining = await checkRes.json();
    assert("Membro ainda existe apos DELETE do outsider", Array.isArray(remaining) && remaining.length > 0);

    // ============================================================
    // Resumo
    // ============================================================
    console.log(`\n=============================`);
    console.log(`  PASS: ${passed}  |  FAIL: ${failed}`);
    console.log(`=============================`);
  } catch (err) {
    console.error("\nErro inesperado:", err);
    failed++;
  } finally {
    // Cleanup
    console.log("\n--- Cleanup ---");
    if (classId > 0) await deleteClassCascade(classId);
    if (teacherId) await deleteTestUser(teacherId);
    if (studentId) await deleteTestUser(studentId);
    if (outsiderId) await deleteTestUser(outsiderId);
    console.log("  Cleanup concluido");

    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
