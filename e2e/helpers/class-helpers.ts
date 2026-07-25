const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * createTestUser / deleteTestUser / loginUser eram CÓPIAS das versões de
 * lesson-helpers.ts. Essa duplicação foi a causa de um bug real: quando o gate
 * de avatar da Fase 8 (dashboard/page.tsx → /criar-personagem) quebrou o login
 * de todo usuário novo, a correção foi aplicada em lesson-helpers e esta cópia
 * ficou para trás — derrubando 36 testes de phase9-teacher e turmas-complete.
 *
 * Agora são reexports da fonte única. Só o que é específico de turma
 * (promoteToTeacher, deleteClass) vive aqui.
 */
export { createTestUser, deleteTestUser } from "./lesson-helpers";
export { loginAndSettle as loginUser } from "./auth-helpers";

/** Promove usuário para professor via service_role */
export async function promoteToTeacher(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ role: "professor" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao promover: ${text}`);
  }
}

/** Limpa turma criada via service_role */
export async function deleteClass(classId: number) {
  // Remove membros, tarefas, progresso, feed, depois a turma
  const tables = [
    "class_feed",
    "user_task_progress",
    "class_tasks",
    "class_members",
  ];
  for (const table of tables) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?class_id=eq.${classId}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    });
  }
  await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
  });
}
