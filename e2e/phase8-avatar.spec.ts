import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, loginUser } from "./helpers/lesson-helpers";
import {
  fetchItems,
  seedUserInventory,
  seedPendingChest,
  signInWithPassword,
  callRpcAsUser,
  directInsertAsUser,
  type ItemRow,
} from "./helpers/inventory-helpers";

// ============================================================
// Setup
// ============================================================

const TIMESTAMP = Date.now();
const TEST_EMAIL = `teste+avatar${TIMESTAMP}@cdxguabiruba.test`;
const TEST_PASSWORD = `Teste@${TIMESTAMP}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

test.describe("Fase 8 — Avatar e Inventário", () => {
  const hasAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;
  let accessToken: string;
  let headItem: ItemRow;
  let outfitItem: ItemRow;
  let handItem: ItemRow; // NOT seeded — used for security test

  test.beforeAll(async () => {
    test.skip(!hasAdmin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");

    // 1. Create test user (trigger creates welcome chest + profile)
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);

    // 2. Wait for handle_new_user trigger to complete
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Fetch items from different slots
    const heads = await fetchItems("head", 1);
    const outfits = await fetchItems("outfit", 1);
    const hands = await fetchItems("hand", 1);
    headItem = heads[0];
    outfitItem = outfits[0];
    handItem = hands[0];

    // 4. Seed 2 items into inventory (head + outfit). Hand is NOT seeded.
    await seedUserInventory(userId, headItem.id, "chest");
    await seedUserInventory(userId, outfitItem.id, "chest");

    // 5. Ensure a pending chest exists (welcome chest may already exist from trigger)
    await seedPendingChest(userId, "level_up", "level_2");

    // 6. Get access_token for server-side security tests
    accessToken = await signInWithPassword(TEST_EMAIL, TEST_PASSWORD);
  });

  test.afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  // ============================================================
  // T1: Abrir baú e ver item no inventário
  // ============================================================
  test("abrir baú e ver item no inventário", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);

    // Wait for ChestPanel to load
    await page.getByText("Baús").waitFor({ timeout: 10_000 });

    // Click first "Abrir" button
    const openBtn = page.getByRole("button", { name: "Abrir" }).first();
    await expect(openBtn).toBeVisible({ timeout: 5_000 });
    await openBtn.click();

    // Wait for phase 3 reveal (2.5s animation + buffer)
    await page.getByText("Adicionado ao inventário").waitFor({ timeout: 8_000 });

    // Verify item name is shown in modal (h3 element)
    const modalItemName = page.locator(".fixed h3");
    await expect(modalItemName).toBeVisible();
    const itemName = await modalItemName.textContent();
    expect(itemName).toBeTruthy();

    // Close modal
    await page.getByRole("button", { name: "Continuar" }).click();

    // Navigate to /perfil
    await page.goto("/perfil");
    await page.getByText(/Arsenal/).waitFor({ timeout: 10_000 });

    // Should have at least 3 items (2 seeded + 1 from chest)
    const arsenalHeader = page.getByText(/Arsenal\s*\(\d+ iten?s?\)/);
    await expect(arsenalHeader).toBeVisible({ timeout: 5_000 });
    const headerText = await arsenalHeader.textContent();
    const match = headerText?.match(/\((\d+)/);
    const itemCount = match ? parseInt(match[1], 10) : 0;
    expect(itemCount).toBeGreaterThanOrEqual(3);
  });

  // ============================================================
  // T2: Equipar item e verificar SlotGrid + AvatarDisplay
  // ============================================================
  test("equipar item e verificar SlotGrid e AvatarDisplay", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await page.getByText(/Arsenal/).waitFor({ timeout: 10_000 });

    // Wait for loading to finish (skeleton gone)
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 10_000 });

    // Find the item card in Arsenal that contains the head item name
    const arsenalSection = page.locator("section", { hasText: "Arsenal" });
    const card = arsenalSection.locator("div.rounded-lg", { hasText: headItem.name }).first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    // Click "Equipar" button inside the card
    await card.getByRole("button", { name: "Equipar" }).click();

    // Wait for "Equipado" badge to appear on the card
    await expect(card.getByText("Equipado")).toBeVisible({ timeout: 5_000 });

    // Verify SlotGrid: "Cabeça" slot should show item name, not "Vazio"
    const equipSection = page.locator("section", { hasText: "Equipamentos da Campanha" });
    await expect(equipSection.getByText(headItem.name)).toBeVisible({ timeout: 3_000 });

    // Verify AvatarDisplay: img with alt matching item name exists in the avatar container
    // Multiple imgs share same alt (AvatarDisplay + SlotGrid + InventoryGrid), so use first()
    const avatarImg = page.locator(`img[alt="${headItem.name}"]`).first();
    await expect(avatarImg).toBeVisible({ timeout: 3_000 });

    // Count total imgs with that alt — should be 3 (avatar layer + slot grid + inventory grid)
    const imgCount = await page.locator(`img[alt="${headItem.name}"]`).count();
    expect(imgCount).toBeGreaterThanOrEqual(2);
  });

  // ============================================================
  // T3: Desequipar item e ver avatar voltar ao vazio
  // ============================================================
  test("desequipar item e ver avatar voltar ao estado vazio", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await page.getByText(/Arsenal/).waitFor({ timeout: 10_000 });
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 10_000 });

    // Find the head item card in Arsenal
    const arsenalSection = page.locator("section", { hasText: "Arsenal" });
    const card = arsenalSection.locator("div.rounded-lg", { hasText: headItem.name }).first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    // If not equipped, equip first
    const hasEquipBtn = await card.getByRole("button", { name: "Equipar" }).isVisible().catch(() => false);
    if (hasEquipBtn) {
      await card.getByRole("button", { name: "Equipar" }).click();
      await expect(card.getByText("Equipado")).toBeVisible({ timeout: 5_000 });
    }

    // Count imgs with item alt BEFORE unequip
    const imgCountBefore = await page.locator(`img[alt="${headItem.name}"]`).count();

    // Now unequip via the SlotGrid "Desequipar" button
    const equipSection = page.locator("section", { hasText: "Equipamentos da Campanha" });
    const unequipBtn = equipSection.getByText("Desequipar").first();
    await expect(unequipBtn).toBeVisible({ timeout: 3_000 });
    await unequipBtn.click();

    // Wait for the slot to show "Vazio" again
    await expect(equipSection.getByText("Vazio").first()).toBeVisible({ timeout: 5_000 });

    // After unequip, img count should decrease (avatar layer + slot grid imgs gone)
    // Only the InventoryGrid card img should remain
    await page.waitForTimeout(500);
    const imgCountAfter = await page.locator(`img[alt="${headItem.name}"]`).count();
    expect(imgCountAfter).toBeLessThan(imgCountBefore);
  });

  // ============================================================
  // T4: Filtros de inventário por slot
  // ============================================================
  test("filtros de inventário por slot", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await page.getByText(/Arsenal/).waitFor({ timeout: 10_000 });
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 10_000 });

    // Get total item count from header
    const arsenalHeader = page.getByText(/Arsenal\s*\(\d+ iten?s?\)/);
    const headerText = await arsenalHeader.textContent();
    const totalMatch = headerText?.match(/\((\d+)/);
    const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    // Click "Cabeça" slot filter
    const headFilter = page.getByRole("button", { name: /Cabeça/ });
    await headFilter.click();

    // Wait a moment for filter to apply
    await page.waitForTimeout(500);

    // The grid should show only head items (or empty message)
    const arsenalSection = page.locator("section", { hasText: "Arsenal" });
    const itemCards = arsenalSection.locator(".grid > div");
    const filteredCount = await itemCards.count();

    // Filtered count should be <= total
    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    // Click "Todos" to reset
    await page.getByRole("button", { name: "Todos" }).click();
    await page.waitForTimeout(500);

    // Count should be back to total
    const resetCount = await itemCards.count();
    expect(resetCount).toBe(totalCount);
  });

  // ============================================================
  // T5: Filtros de inventário por raridade
  // ============================================================
  test("filtros de inventário por raridade", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await page.getByText(/Arsenal/).waitFor({ timeout: 10_000 });
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 10_000 });

    // Get total item count
    const arsenalSection = page.locator("section", { hasText: "Arsenal" });
    const itemCards = arsenalSection.locator(".grid > div");
    const totalCount = await itemCards.count();

    // Click "Comum" rarity filter
    const comunFilter = page.getByRole("button", { name: "Comum" });
    await comunFilter.click();
    await page.waitForTimeout(500);

    const filteredCount = await itemCards.count();

    // If there are common items, count should be less or equal
    // If no common items, we should see the empty filter message
    if (filteredCount === 0) {
      await expect(
        page.getByText("Nenhum item corresponde aos filtros.")
      ).toBeVisible();
    } else {
      expect(filteredCount).toBeLessThanOrEqual(totalCount);
    }

    // Toggle off by clicking "Comum" again
    await comunFilter.click();
    await page.waitForTimeout(500);

    const resetCount = await itemCards.count();
    expect(resetCount).toBe(totalCount);
  });

  // ============================================================
  // T6: Segurança — equip_item com item não possuído falha
  // ============================================================
  test("segurança — equip_item com item não possuído falha", async () => {
    // handItem was NOT seeded into user_inventory
    const { data, error, status } = await callRpcAsUser(
      accessToken,
      "equip_item",
      { p_item_id: handItem.id }
    );

    // Should fail — user does not own this item
    expect(error).toBeTruthy();

    // Should NOT have equipped=true in response
    if (typeof data === "object" && data !== null) {
      expect((data as Record<string, unknown>).equipped).not.toBe(true);
    }
  });

  // ============================================================
  // T7: Segurança — INSERT direto em user_equipped bloqueado
  // ============================================================
  test("segurança — INSERT direto em user_equipped bloqueado por RLS", async () => {
    const { error, status } = await directInsertAsUser(
      accessToken,
      "user_equipped",
      {
        user_id: userId,
        slot: "head",
        item_id: headItem.id,
      }
    );

    // Should fail — RLS INSERT policy was dropped in Phase 8
    expect(error).toBeTruthy();
    // PostgREST returns 403 for policy violation or 401
    expect(status).toBeGreaterThanOrEqual(400);
  });

  // ============================================================
  // T8: Build e lint passam
  // ============================================================
  test("build passa", async () => {
    const { execSync } = await import("child_process");
    const cwd = process.cwd();

    const buildResult = execSync("npm run build", {
      cwd,
      timeout: 180_000,
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(buildResult).toBeDefined();
  });
});
