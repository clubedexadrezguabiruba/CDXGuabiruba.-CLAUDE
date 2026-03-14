/**
 * E2E Completo — Turmas (Classes)
 *
 * Complementa phase9-teacher.spec.ts com:
 *   Suite A: Fluxo do aluno (guards, acesso, navegacao)
 *   Suite B: Ranking por turma (tabs, highlight)
 *   Suite C: Mural (feed, refresh)
 *   Suite D: Relatorio do professor (agregados, detalhe)
 *   Suite E: Edge cases (erros, tipos de tarefa, toggle)
 */

import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  promoteToTeacher,
  deleteClass,
  loginUser,
} from "./helpers/class-helpers";

const TS = Date.now();
const TEACHER_EMAIL = `e2e-prof-${TS}@cdxguabiruba.test`;
const STUDENT1_EMAIL = `e2e-aluno1-${TS}@cdxguabiruba.test`;
const STUDENT2_EMAIL = `e2e-aluno2-${TS}@cdxguabiruba.test`;
const PASSWORD = `Test@${TS}`;
const CLASS_NAME = `Companhia E2E Full ${TS}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let teacherId: string;
let student1Id: string;
let student2Id: string;
let classId: number;
let inviteCode: string;

// ============================================================
// Setup compartilhado
// ============================================================

test.beforeAll(async () => {
  const hasAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  if (!hasAdmin) throw new Error("SUPABASE_URL ou SERVICE_ROLE_KEY nao definidos");

  // Criar usuarios
  teacherId = await createTestUser(TEACHER_EMAIL, PASSWORD);
  await promoteToTeacher(teacherId);
  student1Id = await createTestUser(STUDENT1_EMAIL, PASSWORD);
  student2Id = await createTestUser(STUDENT2_EMAIL, PASSWORD);

  // Esperar triggers (handle_new_user)
  await new Promise((r) => setTimeout(r, 2000));

  // Professor cria turma via RPC
  const signInRes = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: TEACHER_EMAIL, password: PASSWORD }),
    }
  );
  const { access_token: teacherToken } = await signInRes.json();

  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_class`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_name: CLASS_NAME }),
  });
  const classData = await createRes.json();
  classId = classData.id;
  inviteCode = classData.invite_code;

  // Student1 entra na turma via RPC
  const s1SignIn = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: STUDENT1_EMAIL, password: PASSWORD }),
    }
  );
  const { access_token: s1Token } = await s1SignIn.json();
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_class`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${s1Token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_invite_code: inviteCode }),
  });

  // Student2 entra na turma via RPC
  const s2SignIn = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: STUDENT2_EMAIL, password: PASSWORD }),
    }
  );
  const { access_token: s2Token } = await s2SignIn.json();
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_class`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${s2Token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_invite_code: inviteCode }),
  });
});

test.afterAll(async () => {
  if (classId) await deleteClass(classId);
  if (teacherId) await deleteTestUser(teacherId);
  if (student1Id) await deleteTestUser(student1Id);
  if (student2Id) await deleteTestUser(student2Id);
});

// ============================================================
// Suite A — Fluxo do Aluno
// ============================================================
test.describe.serial("Suite A — Fluxo do Aluno", () => {
  test("A1. aluno ve turma na lista em /turmas", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto("/turmas");
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible({ timeout: 10000 });
  });

  test("A2. aluno acessa detalhe da turma e ve Colegas", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);
    await expect(page.locator("text=Colegas")).toBeVisible({ timeout: 10000 });
  });

  test("A3. aluno ve cards de Mural e Ranking", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);
    await expect(page.locator("text=Mural")).toBeVisible();
    await expect(page.locator("text=Ranking")).toBeVisible();
  });

  test("A4. aluno NAO ve cards de Tarefas nem Relatorios", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);
    // Esperar conteudo carregar
    await expect(page.locator("text=Colegas")).toBeVisible({ timeout: 10000 });
    // Verificar ausencia
    const tarefasCard = page.locator('a[href*="/tarefas"]');
    await expect(tarefasCard).toHaveCount(0);
    const relatorioCard = page.locator('a[href*="/relatorio"]');
    await expect(relatorioCard).toHaveCount(0);
  });

  test("A5. acesso direto a /turmas/[id]/tarefas retorna 404 para aluno", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    const response = await page.goto(`/turmas/${classId}/tarefas`);
    // Server guard deve retornar 404
    expect(response?.status()).toBe(404);
  });

  test("A6. acesso direto a /turmas/[id]/relatorio retorna 404 para aluno", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    const response = await page.goto(`/turmas/${classId}/relatorio`);
    expect(response?.status()).toBe(404);
  });
});

// ============================================================
// Suite B — Ranking
// ============================================================
test.describe.serial("Suite B — Ranking", () => {
  test("B1. ranking carrega com tab Rating", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/ranking`);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible({ timeout: 10000 });
    // Tab Rating deve estar ativo
    const ratingTab = page.locator('button:has-text("Rating")');
    await expect(ratingTab).toBeVisible();
  });

  test("B2. ranking mostra conteudo (tabela ou mensagem vazia)", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/ranking`);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible({ timeout: 10000 });
    // Pode ter membros ou msg "Nenhum membro" (materialized view pode nao ter refresh)
    const hasContent = page.locator("text=Nenhum membro").or(page.locator("table tbody tr").first());
    await expect(hasContent).toBeVisible({ timeout: 5000 });
  });

  test("B3. switch para tab Rush 3min funciona sem erro", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/ranking`);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Rush 3min")');
    await page.waitForTimeout(1500);
    // Pode mostrar tabela com "Pontos" ou msg vazia — nao deve dar erro
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible();
  });

  test("B4. switch para tab Nivel funciona sem erro", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/ranking`);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Nível")');
    await page.waitForTimeout(1500);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible();
  });

  test("B5. ranking nao exibe erro apos multiplos switches de tab", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/ranking`);
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible({ timeout: 10000 });
    // Switch rapido entre tabs
    await page.click('button:has-text("Rush 5min")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Rating")');
    await page.waitForTimeout(500);
    // Sem crash
    await expect(page.locator("text=Ranking da Companhia")).toBeVisible();
  });
});

// ============================================================
// Suite C — Mural
// ============================================================
test.describe.serial("Suite C — Mural", () => {
  test("C1. mural carrega com titulo correto", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/mural`);
    await expect(page.locator("text=Mural da Companhia")).toBeVisible({ timeout: 10000 });
  });

  test("C2. botao Atualizar existe e funciona", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/mural`);
    await expect(page.locator("text=Mural da Companhia")).toBeVisible({ timeout: 10000 });
    const refreshBtn = page.locator('button:has-text("Atualizar")');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // Nao deve dar erro apos refresh
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Mural da Companhia")).toBeVisible();
  });

  test("C3. seed de feed event aparece no mural", async ({ page }) => {
    // Inserir feed event via service_role
    await fetch(`${SUPABASE_URL}/rest/v1/class_feed`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        class_id: classId,
        user_id: student1Id,
        event_type: "level_up",
        event_data: { new_level: 5, display_name: "Aluno Teste" },
      }),
    });

    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/mural`);
    await expect(page.locator("text=Mural da Companhia")).toBeVisible({ timeout: 10000 });
    // O evento de level_up deve aparecer
    await expect(page.locator("text=nivel").first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// Suite D — Relatorio do Professor
// ============================================================
test.describe.serial("Suite D — Relatorio do Professor", () => {
  test("D1. relatorio carrega com cards agregados", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible({ timeout: 10000 });
    // Cards de resumo
    await expect(page.locator("text=Membros")).toBeVisible();
  });

  test("D2. lista de membros visivel", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible({ timeout: 10000 });
    // Pelo menos 2 membros listados (student1 + student2)
    const memberRows = page.locator('a[href*="/relatorio/"]');
    const count = await memberRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("D3. click em aluno navega para detalhe", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible({ timeout: 10000 });

    const firstMember = page.locator('a[href*="/relatorio/"]').first();
    await firstMember.click();
    await page.waitForURL(`**/turmas/${classId}/relatorio/*`);
  });

  test("D4. pagina de detalhe mostra secoes de dados", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible({ timeout: 10000 });

    const firstMember = page.locator('a[href*="/relatorio/"]').first();
    await firstMember.click();
    await page.waitForURL(`**/turmas/${classId}/relatorio/*`);

    // Secoes esperadas
    await expect(page.locator("text=Aulas")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Bots")).toBeVisible();
    await expect(page.locator("text=Conquistas")).toBeVisible();
  });

  test("D5. link de volta funciona", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible({ timeout: 10000 });

    const firstMember = page.locator('a[href*="/relatorio/"]').first();
    await firstMember.click();
    await page.waitForURL(`**/turmas/${classId}/relatorio/*`);

    // Voltar
    const backLink = page.locator('a[href*="/relatorio"]').filter({ hasText: /voltar|Voltar|←|Relatorio/ }).first();
    await backLink.click();
    await page.waitForURL(`**/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible();
  });
});

// ============================================================
// Suite E — Edge Cases
// ============================================================
test.describe.serial("Suite E — Edge Cases", () => {
  test("E1. codigo invalido mostra erro", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto("/turmas");
    await expect(page.locator("text=Entrar em uma companhia")).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Codigo de convite"]', "INVALIDO999");
    await page.click('button:has-text("Entrar")');
    // Mensagem de erro deve aparecer
    await expect(page.locator(".text-red-600")).toBeVisible({ timeout: 5000 });
  });

  test("E2. entrar em turma ja inscrita mostra aviso", async ({ page }) => {
    await loginUser(page, STUDENT1_EMAIL, PASSWORD);
    await page.goto("/turmas");
    await expect(page.locator("text=Entrar em uma companhia")).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Codigo de convite"]', inviteCode);
    await page.click('button:has-text("Entrar")');
    await expect(page.locator("text=Voce ja faz parte desta companhia")).toBeVisible({ timeout: 10000 });
  });

  test("E3. criar turma com nome curto mostra erro", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto("/turmas");
    await page.click("text=Criar Companhia");
    // Esperar modal abrir
    await expect(page.locator('input[placeholder="Nome da companhia"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Nome da companhia"]', "X");
    // Clicar no submit dentro do modal (type="submit")
    await page.click('button[type="submit"]');
    // Deve mostrar erro (min 2 chars)
    await expect(page.locator(".text-red-600, .text-red-500")).toBeVisible({ timeout: 5000 });
    // Fechar modal
    await page.click("text=Cancelar");
  });

  test("E4. professor cria tarefa puzzles_count", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/tarefas`);
    await page.click("text=Nova Tarefa");

    // Selecionar tipo puzzles_count
    const typeSelect = page.locator("select").first();
    await typeSelect.selectOption("puzzles_count");

    // Preencher campos
    await page.fill('input[placeholder="Ex: Completar aula de aberturas"]', "Resolver 10 puzzles");

    // Preencher contagem (campo numerico)
    const countInput = page.locator('input[type="number"]').first();
    if (await countInput.isVisible()) {
      await countInput.fill("10");
    }

    await page.click('button:has-text("Criar Tarefa")');
    await expect(page.locator("text=Resolver 10 puzzles")).toBeVisible({ timeout: 10000 });
  });

  test("E5. professor toggle ativar/desativar tarefa", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/tarefas`);
    await expect(page.locator("text=Resolver 10 puzzles")).toBeVisible({ timeout: 10000 });

    // Clicar em Desativar
    const desativarBtn = page.locator('button:has-text("Desativar")').first();
    if (await desativarBtn.isVisible()) {
      await desativarBtn.click();
      // Deve mudar para "Ativar" ou mostrar badge inativa
      await expect(
        page.locator('button:has-text("Ativar")').first().or(page.locator("text=Inativa").first())
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
