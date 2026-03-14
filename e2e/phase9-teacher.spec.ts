import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  promoteToTeacher,
  deleteClass,
  loginUser,
} from "./helpers/class-helpers";

const TS = Date.now();
const TEACHER_EMAIL = `prof+${TS}@cdxguabiruba.test`;
const STUDENT_EMAIL = `aluno+${TS}@cdxguabiruba.test`;
const PASSWORD = `Test@${TS}`;
const CLASS_NAME = `Companhia E2E ${TS}`;

let teacherId: string;
let studentId: string;
let classId: number;
let inviteCode: string;

test.describe.serial("Fase 9 — Painel do Professor", () => {
  test.beforeAll(async () => {
    teacherId = await createTestUser(TEACHER_EMAIL, PASSWORD);
    await promoteToTeacher(teacherId);
    studentId = await createTestUser(STUDENT_EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (classId) await deleteClass(classId);
    if (teacherId) await deleteTestUser(teacherId);
    if (studentId) await deleteTestUser(studentId);
  });

  test("professor vê link Turmas na navbar e acessa /turmas", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    const turmasLink = page.locator('a[href="/turmas"]');
    await expect(turmasLink).toBeVisible();
    await turmasLink.click();
    await page.waitForURL("**/turmas");
    await expect(page.getByRole("heading", { name: "Companhias" })).toBeVisible();
    await expect(page.locator("text=Criar Companhia")).toBeVisible();
  });

  test("professor cria companhia e vê código de convite", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto("/turmas");

    await page.click("text=Criar Companhia");
    await expect(page.locator('input[placeholder="Nome da companhia"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Nome da companhia"]', CLASS_NAME);
    await page.click('button[type="submit"]');

    // Espera modal de sucesso com invite code
    await expect(page.locator("text=Companhia Criada!")).toBeVisible({ timeout: 10000 });
    const codeEl = page.locator(".font-mono.text-2xl");
    await expect(codeEl).toBeVisible();
    inviteCode = (await codeEl.textContent()) ?? "";
    expect(inviteCode.length).toBeGreaterThan(0);

    await page.click('button:has-text("Fechar")');

    // Turma aparece na lista
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible();

    // Capturar classId da URL ao clicar na turma
    await page.click(`text=${CLASS_NAME}`);
    await page.waitForURL("**/turmas/*");
    const url = page.url();
    const match = url.match(/\/turmas\/(\d+)/);
    classId = match ? Number(match[1]) : 0;
    expect(classId).toBeGreaterThan(0);
  });

  test("aluno entra na turma com código de convite", async ({ page }) => {
    await loginUser(page, STUDENT_EMAIL, PASSWORD);
    await page.goto("/turmas");

    await expect(page.locator("text=Entrar em uma companhia")).toBeVisible();
    await page.fill('input[placeholder="Codigo de convite"]', inviteCode);
    await page.click('button:has-text("Entrar")');

    // Sucesso
    await expect(page.locator(`text=Voce entrou na companhia`)).toBeVisible({ timeout: 10000 });

    // Turma aparece na lista
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible();
  });

  test("professor vê aluno na lista de membros", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);

    await expect(page.getByRole("heading", { name: "Membros" })).toBeVisible();
    // Pelo menos 1 membro listado
    await expect(page.locator("text=1 membro")).toBeVisible();
  });

  test("professor acessa página de tarefas", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);

    await page.locator('a[href*="/tarefas"]').click();
    await page.waitForURL(`**/turmas/${classId}/tarefas`);
    await expect(page.locator("text=Nova Tarefa")).toBeVisible();
  });

  test("professor cria tarefa de tipo lesson", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/tarefas`);

    await page.click("text=Nova Tarefa");
    // Esperar form abrir e lessons carregarem no dropdown
    await expect(page.locator("select").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("option").nth(1)).toBeAttached({ timeout: 5000 });
    // Pequena espera para useEffect setar lessonId
    await page.waitForTimeout(500);

    // Tipo já é lesson por default
    await page.fill('input[placeholder="Ex: Completar aula de aberturas"]', "Completar aula 1");
    await page.click('button:has-text("Criar Tarefa")');

    // Tarefa aparece na lista
    await expect(page.locator("text=Completar aula 1")).toBeVisible({ timeout: 10000 });
  });

  test("professor vê progresso da tarefa", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}/tarefas`);

    await expect(page.locator("text=Completar aula 1")).toBeVisible();
    await page.click("text=Ver Progresso");

    // Espera o relatório expandir
    await expect(page.locator("text=completaram")).toBeVisible({ timeout: 5000 });
  });

  test("professor acessa mural da companhia", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);

    await page.locator('a[href*="/mural"]').click();
    await page.waitForURL(`**/turmas/${classId}/mural`);
    await expect(page.locator("text=Mural da Companhia")).toBeVisible();
  });

  test("professor acessa relatório da companhia", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);

    await page.locator('a[href*="/relatorio"]').click();
    await page.waitForURL(`**/turmas/${classId}/relatorio`);
    await expect(page.locator("text=Relatorio da Companhia")).toBeVisible();
    // Pelo menos 1 membro listado
    await expect(page.getByRole("heading", { name: "Membros" }).or(page.locator("text=Membros").first())).toBeVisible();
  });

  test("aluno vê turma na lista e acessa detalhe", async ({ page }) => {
    await loginUser(page, STUDENT_EMAIL, PASSWORD);
    await page.goto("/turmas");

    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible();
    await page.click(`text=${CLASS_NAME}`);
    await page.waitForURL(`**/turmas/${classId}`);

    // Aluno vê "Colegas" (não "Membros")
    await expect(page.getByRole("heading", { name: "Colegas" })).toBeVisible();
    // Aluno vê Mural mas NÃO vê Tarefas nem Relatorios
    await expect(page.locator('a[href*="/mural"]')).toBeVisible();
  });

  test("aluno vê tarefas no dashboard", async ({ page }) => {
    await loginUser(page, STUDENT_EMAIL, PASSWORD);
    await page.goto("/dashboard");

    // TaskPanel deve aparecer com a tarefa criada
    await expect(page.locator("text=Tarefas da Companhia")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Completar aula 1")).toBeVisible();
  });

  test("professor remove aluno da turma", async ({ page }) => {
    await loginUser(page, TEACHER_EMAIL, PASSWORD);
    await page.goto(`/turmas/${classId}`);

    await expect(page.locator("text=Remover")).toBeVisible();
    await page.click("text=Remover");

    // Membro removido — espera refresh
    await expect(page.locator("text=Nenhum membro ainda.")).toBeVisible({ timeout: 10000 });
  });
});
