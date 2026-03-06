import { test, expect, type Page } from "@playwright/test";
import { makeMove } from "./helpers/chess-helpers";
import {
  createTestUser,
  deleteTestUser,
  loginUser,
  cleanupUserProgress,
  forceCompleteLessons,
  forcePassReviewGate,
  hasAdminAccess,
  RECRUTA_LESSONS,
  SOLDADO_LESSONS,
} from "./helpers/lesson-helpers";
import {
  RECRUTA,
  SOLDADO,
  type LessonTestData,
} from "./data/lesson-exercises";

// ============================================================
// Helpers
// ============================================================

/**
 * Skip a demo section by clicking → until the last move, then clicking ▶.
 * Demo sections have "Próximo lance" (→) and "Lance anterior" (←) buttons.
 */
async function skipDemo(page: Page): Promise<void> {
  const demoForward = page.locator('button[title="Próximo lance"]');
  // Click → until disabled (all moves played)
  for (let i = 0; i < 20; i++) {
    if (!(await demoForward.isEnabled().catch(() => false))) break;
    await demoForward.click();
    await page.waitForTimeout(300);
  }
  // Now ▶ should be enabled
  const nextBtn = page.locator(
    'button[title="Próxima seção"]:not([disabled])'
  );
  await expect(nextBtn).toBeVisible({ timeout: 5_000 });
  await nextBtn.click();
  await page.waitForTimeout(500);
}

/**
 * Navigate to the first exercise section.
 * Handles text (click next), demos (skip via → button), until exercise loads.
 * Detects exercise by "Seu lance" text in the desktop panel.
 */
async function navigateToFirstExercise(page: Page): Promise<void> {
  const seuLance = page.getByText("Seu lance", { exact: true }).first();

  for (let attempt = 0; attempt < 30; attempt++) {
    if (await seuLance.isVisible().catch(() => false)) break;

    // Check if we're on a demo section (→ button visible = demo nav)
    const demoForward = page.locator('button[title="Próximo lance"]');
    if (await demoForward.isVisible().catch(() => false)) {
      await skipDemo(page);
      continue;
    }

    // Try clicking an enabled next button (text sections)
    const enabledDesktop = page.locator(
      'button[title="Próxima seção"]:not([disabled])'
    );
    const enabledFullwidth = page.locator(
      'button:has-text("PRÓXIMA"):not([disabled])'
    );

    const desktopOk = await enabledDesktop.isVisible().catch(() => false);
    const fullOk = await enabledFullwidth.isVisible().catch(() => false);

    if (desktopOk) {
      await enabledDesktop.click();
      await page.waitForTimeout(500);
    } else if (fullOk) {
      await enabledFullwidth.click();
      await page.waitForTimeout(500);
    } else {
      await page.waitForTimeout(1000);
    }
  }

  // Final assertion: exercise section loaded
  await expect(seuLance).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(500);
}

async function completeLesson(
  page: Page,
  lesson: LessonTestData
): Promise<void> {
  await page.goto(`/aulas/${lesson.id}`);
  // h1 contains lesson title — use locator('h1') to avoid strict mode
  await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

  await navigateToFirstExercise(page);

  const totalEx = lesson.exercises.length;

  for (let i = 0; i < totalEx; i++) {
    const ex = lesson.exercises[i];
    await makeMove(page, ex.from, ex.to, ex.orientation);

    if (i < totalEx - 1) {
      // Espera auto-avanço (2.5s) — detecta mudança no label de exercício
      const nextStep = i + 2; // exercícios são 1-indexed
      await expect(
        page
          .getByText(`Exercício ${nextStep} de ${totalEx}`)
          .first()
      ).toBeVisible({ timeout: 10_000 });
      // Buffer para board ficar interativo
      await page.waitForTimeout(300);
    }
  }

  await expect(page.getByText("Aula Completa!")).toBeVisible({
    timeout: 12_000,
  });
}

// ============================================================
// Recruta — completar todas as aulas (15 testes)
// ============================================================

test.describe("Recruta — completar todas as aulas", () => {
  const admin = hasAdminAccess();
  const TS = Date.now();
  const EMAIL = `aulas-rec+${TS}@cdxguabiruba.test`;
  const PASSWORD = `RecEx@${TS}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  for (let idx = 0; idx < RECRUTA.length; idx++) {
    const lesson = RECRUTA[idx];

    test(`Aula ${lesson.lessonNumber}: ${lesson.title} — completa todos os exercícios`, async ({
      page,
    }) => {
      test.setTimeout(60_000);

      await cleanupUserProgress(userId);
      // Desbloqueia aulas anteriores
      if (idx > 0) {
        await forceCompleteLessons(userId, RECRUTA_LESSONS.slice(0, idx));
      }

      await loginUser(page, EMAIL, PASSWORD);
      await completeLesson(page, lesson);
    });
  }
});

// ============================================================
// Soldado — completar todas as aulas (15 testes)
// ============================================================

test.describe("Soldado — completar todas as aulas", () => {
  const admin = hasAdminAccess();
  const TS = Date.now();
  const EMAIL = `aulas-sol+${TS}@cdxguabiruba.test`;
  const PASSWORD = `SolEx@${TS}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  for (let idx = 0; idx < SOLDADO.length; idx++) {
    const lesson = SOLDADO[idx];

    test(`Aula ${lesson.lessonNumber}: ${lesson.title} — completa todos os exercícios`, async ({
      page,
    }) => {
      test.setTimeout(60_000);

      await cleanupUserProgress(userId);
      // Completa todas as aulas recruta + review gate
      await forceCompleteLessons(userId, RECRUTA_LESSONS);
      await forcePassReviewGate(userId, "recruta");
      // Desbloqueia aulas soldado anteriores
      if (idx > 0) {
        await forceCompleteLessons(userId, SOLDADO_LESSONS.slice(0, idx));
      }

      await loginUser(page, EMAIL, PASSWORD);
      await completeLesson(page, lesson);
    });
  }
});

// ============================================================
// Grupo G — Lances especiais
// ============================================================

test.describe("Lances especiais", () => {
  const admin = hasAdminAccess();
  const TS = Date.now();
  const EMAIL = `aulas-spec+${TS}@cdxguabiruba.test`;
  const PASSWORD = `Spec@${TS}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  test("G1: promoção de peão (Aula 2, ex.4)", async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupUserProgress(userId);
    // Desbloqueia aula 2 (id=3)
    await forceCompleteLessons(userId, [RECRUTA_LESSONS[0]]);

    await loginUser(page, EMAIL, PASSWORD);
    const lesson = RECRUTA[1]; // O Peão
    await completeLesson(page, lesson);
  });

  test("G2: roque (Aula 10, ex.1)", async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupUserProgress(userId);
    // Desbloqueia aulas 1-9
    await forceCompleteLessons(userId, RECRUTA_LESSONS.slice(0, 9));

    await loginUser(page, EMAIL, PASSWORD);
    const lesson = RECRUTA[9]; // Roque
    await completeLesson(page, lesson);
  });

  test("G3: exercício como pretas (Aula 15, ex.2-3)", async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupUserProgress(userId);
    // Desbloqueia aulas 1-14
    await forceCompleteLessons(userId, RECRUTA_LESSONS.slice(0, 14));

    await loginUser(page, EMAIL, PASSWORD);
    const lesson = RECRUTA[14]; // Mate do Pastor e Defesa
    await completeLesson(page, lesson);
  });
});

// ============================================================
// Grupo H — Refazer aula
// ============================================================

test.describe("Refazer aula", () => {
  const admin = hasAdminAccess();
  const TS = Date.now();
  const EMAIL = `aulas-redo+${TS}@cdxguabiruba.test`;
  const PASSWORD = `Redo@${TS}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  test("H1: refazer aula com estrelas melhores", async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupUserProgress(userId);
    // Completa aula 1 com 1 estrela
    await forceCompleteLessons(userId, [RECRUTA_LESSONS[0]], 1);

    await loginUser(page, EMAIL, PASSWORD);
    await page.goto("/aulas/1");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    // Verifica botão "Refazer"
    const refazerBtn = page.getByText("Refazer");
    await expect(refazerBtn).toBeVisible({ timeout: 5_000 });
    await refazerBtn.click();

    // Navega e completa
    await navigateToFirstExercise(page);

    const totalEx = RECRUTA[0].exercises.length;
    for (let i = 0; i < totalEx; i++) {
      const ex = RECRUTA[0].exercises[i];
      await makeMove(page, ex.from, ex.to, ex.orientation);

      if (i < totalEx - 1) {
        const nextStep = i + 2;
        await expect(
          page.getByText(`Exercício ${nextStep} de ${totalEx}`).first()
        ).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(300);
      }
    }

    await expect(page.getByText("Aula Completa!")).toBeVisible({
      timeout: 12_000,
    });
    // Deve ter 3 estrelas (sem erros)
    await expect(page.getByText("★").first()).toBeVisible();
  });
});

// ============================================================
// Grupo I — Lance errado
// ============================================================

test.describe("Lance errado", () => {
  const admin = hasAdminAccess();
  const TS = Date.now();
  const EMAIL = `aulas-err+${TS}@cdxguabiruba.test`;
  const PASSWORD = `Err@${TS}`;
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!admin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(EMAIL, PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserProgress(userId);
      await deleteTestUser(userId);
    }
  });

  test("I1: lance errado snap-back em aula com dim_kings", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await cleanupUserProgress(userId);
    // Desbloqueia aula 2 (O Peão, id=3, dim_kings=true)
    await forceCompleteLessons(userId, [RECRUTA_LESSONS[0]]);

    await loginUser(page, EMAIL, PASSWORD);
    await page.goto("/aulas/3");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    await navigateToFirstExercise(page);

    // Lance errado: d2→d3 em vez de d2→d4
    await makeMove(page, "d2", "d3", "white");

    // Feedback de erro no painel desktop
    const panel = page.locator(".rounded-xl.bg-zinc-700 .bg-white");
    await expect(panel.getByText("Tente novamente!")).toBeVisible({
      timeout: 5_000,
    });

    // Snap-back (espera animação)
    await page.waitForTimeout(1500);

    // Lance correto: d2→d4
    await makeMove(page, "d2", "d4", "white");

    // Avança para próximo exercício — espera label mudar
    await expect(
      page.getByText("Exercício 2 de 4").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
