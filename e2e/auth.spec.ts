import { test, expect } from "@playwright/test";
import { settleAfterLogin } from "./helpers/auth-helpers";

// Gera credenciais únicas por run para auto-registro
const TIMESTAMP = Date.now();
const TEST_EMAIL = `teste+${TIMESTAMP}@cdxguabiruba.test`;
const TEST_PASSWORD = `Teste@${TIMESTAMP}`;

// Supabase Admin API — cria usuário confirmado via service_role
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function createTestUser(
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
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Falha ao criar user de teste: ${JSON.stringify(data)}`);
  return data.id;
}

async function deleteTestUser(userId: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

// ============================================================
// Teste 1: Redirect anônimo (SEMPRE ativo)
// ============================================================
test("anônimo acessando /dashboard é redirecionado para /login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toBe("/dashboard");
});

// ============================================================
// Testes 2-3: Fluxo completo com usuário auto-criado
// ============================================================
test.describe("fluxo autenticado", () => {
  const hasAdminAccess = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;

  test.beforeAll(async () => {
    test.skip(!hasAdminAccess, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  test("login exibe dashboard com display_name e navbar com nível", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Aguarda redirect para /dashboard
    await settleAfterLogin(page);

    // A navbar mostra display_name, NÃO o email: o trigger handle_new_user
    // deriva display_name da parte antes do @ por LGPD
    // (20260216180500_auth_trigger.sql:19-32). Assertar o email completo
    // aqui era expectativa obsoleta.
    const displayName = TEST_EMAIL.split("@")[0];
    await expect(page.getByText(displayName)).toBeVisible();

    // Email completo não deve aparecer na UI
    await expect(page.getByText(TEST_EMAIL)).toHaveCount(0);

    // Navbar com nível visível (criado pelo trigger).
    // .first(): "Nv. 1" aparece duas vezes quando o dashboard termina de
    // renderizar — uma na navbar, outra no card de progressão. Sem o .first()
    // isto vira violação de modo estrito. Passava antes porque o helper de login
    // retornava com o dashboard ainda em branco, e só a navbar existia.
    await expect(page.getByText("Nv. 1").first()).toBeVisible();
  });

  test("signout redireciona para /login e bloqueia /dashboard", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await settleAfterLogin(page);

    // Clica em "Sair" (navbar do layout)
    await page.click('button:has-text("Sair")');

    // Deve voltar para /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // /dashboard deve redirecionar
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
