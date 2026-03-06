import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ============================================================
// Auth helpers
// ============================================================

export async function createTestUser(
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Falha ao criar user de teste: ${JSON.stringify(data)}`);
  return data.id;
}

export async function deleteTestUser(userId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

// ============================================================
// Lesson IDs — Recruta (hardcoded from DB)
// ============================================================

/** Recruta lesson IDs in trail_order 1-15 with their total_steps */
export const RECRUTA_LESSONS = [
  { id: 1, steps: 3 },
  { id: 3, steps: 4 },
  { id: 4, steps: 4 },
  { id: 5, steps: 3 },
  { id: 6, steps: 3 },
  { id: 7, steps: 4 },
  { id: 8, steps: 3 },
  { id: 9, steps: 4 },
  { id: 10, steps: 4 },
  { id: 11, steps: 3 },
  { id: 12, steps: 3 },
  { id: 13, steps: 4 },
  { id: 14, steps: 3 },
  { id: 15, steps: 4 },
  { id: 16, steps: 3 },
];

// ============================================================
// Force-complete lessons via direct DB insert (service_role)
// ============================================================

/**
 * Mark lessons as completed for a user by inserting/upserting into
 * user_lesson_progress. Uses service_role to bypass RLS.
 */
export async function forceCompleteLessons(
  userId: string,
  lessons: { id: number; steps: number }[],
  stars = 3
): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  for (const lesson of lessons) {
    await fetch(`${SUPABASE_URL}/rest/v1/user_lesson_progress`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id: userId,
        lesson_id: lesson.id,
        steps_completed: lesson.steps,
        completed: true,
        stars,
        errors: 0,
        hints_used: 0,
        completed_at: new Date().toISOString(),
      }),
    });
  }
}

/**
 * Delete all lesson progress for a user.
 */
export async function cleanupUserProgress(userId: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  await fetch(
    `${SUPABASE_URL}/rest/v1/user_lesson_progress?user_id=eq.${userId}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  await fetch(
    `${SUPABASE_URL}/rest/v1/review_gate_attempts?user_id=eq.${userId}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
}

// ============================================================
// Lesson IDs — Soldado (hardcoded from DB)
// ============================================================

/** Soldado lesson IDs in trail_order 1-15 with their total_steps */
export const SOLDADO_LESSONS = [
  { id: 17, steps: 5 },
  { id: 18, steps: 4 },
  { id: 19, steps: 4 },
  { id: 20, steps: 4 },
  { id: 21, steps: 4 },
  { id: 22, steps: 3 },
  { id: 23, steps: 4 },
  { id: 24, steps: 4 },
  { id: 25, steps: 5 },
  { id: 26, steps: 4 },
  { id: 27, steps: 4 },
  { id: 28, steps: 3 },
  { id: 29, steps: 3 },
  { id: 30, steps: 5 },
  { id: 31, steps: 5 },
];

// ============================================================
// Force pass review gate via direct DB insert (service_role)
// ============================================================

export async function forcePassReviewGate(
  userId: string,
  trail: string
): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  await fetch(`${SUPABASE_URL}/rest/v1/review_gate_attempts`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      trail,
      score: 10,
      passed: true,
      attempted_at: new Date().toISOString(),
    }),
  });
}

export function hasAdminAccess(): boolean {
  return !!(SUPABASE_URL && SERVICE_ROLE_KEY);
}
