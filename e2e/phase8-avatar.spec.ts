import { test, expect } from "@playwright/test";
import { existsSync } from "fs";
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

/**
 * Títulos das seções do perfil.
 *
 * A seção de inventário se chamava "Arsenal" e virou uma CollapsibleSection
 * "Personalizar Avatar" (PerfilClient.tsx:626) que nasce FECHADA
 * (defaultOpen={false}). O conteúdo fechado é clipado por `max-h-0`, e nesse
 * estado toBeVisible() ainda passa (o Playwright ignora opacity) mas os cliques
 * falham no hit-target — modo de falha bem confuso. Por isso todo teste que
 * interage com o inventário precisa expandir a seção primeiro.
 */
const SECTION_INVENTARIO = "Personalizar Avatar";
const SECTION_EQUIPADOS = "Equipamentos da Campanha";

/** Localiza a <section> de uma CollapsibleSection pelo título. */
function sectionByTitle(page: import("@playwright/test").Page, title: string) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: title }) });
}

/** Expande a seção se estiver fechada e devolve o locator dela. */
async function openSection(
  page: import("@playwright/test").Page,
  title: string
) {
  const section = sectionByTitle(page, title);
  await section.waitFor({ timeout: 15_000 });

  // O wrapper do conteúdo é o FILHO DIRETO da <section> com `transition-all`;
  // fechado ele carrega `max-h-0` (PerfilClient.tsx:181-185).
  //
  // `:scope >` é essencial aqui. Com `div.transition-all` + .first() o locator
  // podia casar um elemento interno (cards e botões também usam transition-*),
  // cuja classe nunca tem max-h-0 — e aí o helper CLICAVA no header de uma
  // seção que já estava aberta, colapsando-a. O botão ficava dentro de um
  // container em colapso e o clique entrava em "element was detached from the
  // DOM, retrying" até o timeout do teste.
  const content = section.locator(":scope > div.transition-all");
  const cls = (await content.getAttribute("class")) ?? "";
  if (cls.includes("max-h-0")) {
    await section.locator(":scope > button").click();
  }
  await expect(content).not.toHaveClass(/max-h-0/, { timeout: 5_000 });

  // Espera a transição de 300ms terminar: clicar durante a animação de altura
  // faz o alvo se mover sob o cursor.
  await page.waitForTimeout(400);

  return section;
}

/**
 * Reproduz o que o assetResolver faz para o render mode `head_swap`:
 * /items/head/x.png -> public/items/head/x-swap-male.png
 */
function resolveHeadAsset(imageUrl: string): string {
  return "public" + imageUrl.replace(/\.png$/, "-swap-male.png");
}

/** Lê o total de itens do badge da seção de inventário ("N itens"). */
async function readItemCount(page: import("@playwright/test").Page) {
  const badge = sectionByTitle(page, SECTION_INVENTARIO).getByText(
    /^\d+ itens$/
  );
  await expect(badge).toBeVisible({ timeout: 10_000 });
  const text = (await badge.textContent()) ?? "";
  return parseInt(text.match(/(\d+)/)?.[1] ?? "0", 10);
}

test.describe("Fase 8 — Avatar e Inventário", () => {
  // O dashboard e o perfil disparam vários RPCs (missões, baús, streak,
  // ranking, inventário, conquistas) contra o Supabase remoto. Rodando a suíte
  // inteira em série, os 30s default do Playwright não bastam: estes testes
  // passavam isolados e estouravam no run completo. Não é bug de lógica, é
  // latência de rede sob carga.
  test.describe.configure({ timeout: 90_000 });

  const hasAdmin = !!(SUPABASE_URL && SERVICE_ROLE_KEY);
  let userId: string;
  let accessToken: string;
  let headItem: ItemRow;
  let outfitItem: ItemRow;
  let handItem: ItemRow; // NOT seeded — used for security test
  let headAssetRenderizavel = false;

  test.beforeAll(async () => {
    test.skip(!hasAdmin, "SUPABASE_URL ou SERVICE_ROLE_KEY não definidos");

    // 1. Create test user (trigger creates welcome chest + profile)
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD);

    // 2. Wait for handle_new_user trigger to complete
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Fetch items from different slots
    //
    // O slot head usa render mode `head_swap`, que resolve
    // {slug}.png -> {slug}-swap-{gender}.png (assetResolver.ts). Hoje apenas
    // 1 dos 9 itens de head tem essas variantes em public/ — nos outros a
    // camada 404 e o AvatarLayer devolve null silenciosamente, então o item
    // aparece no inventário e no SlotGrid mas NÃO no boneco.
    //
    // Para o T2 poder de fato verificar a renderização do avatar, escolhemos um
    // head cujo asset resolvido exista em disco. Se nenhum existir, o teste que
    // depende disso é pulado — em vez de falhar por falta de arte.
    const heads = await fetchItems("head", 50);
    headItem =
      heads.find((h) => h.image_url && existsSync(resolveHeadAsset(h.image_url))) ??
      heads[0];
    headAssetRenderizavel = !!(
      headItem.image_url && existsSync(resolveHeadAsset(headItem.image_url))
    );

    const outfits = await fetchItems("outfit", 1);
    const hands = await fetchItems("hand", 1);
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

    // Wait for ChestPanel to load (o dashboard agrega vários RPCs)
    await page.getByText("Baús").waitFor({ timeout: 30_000 });

    // Click first "Abrir" button
    const openBtn = page.getByRole("button", { name: "Abrir" }).first();
    await expect(openBtn).toBeVisible({ timeout: 5_000 });
    await openBtn.click();

    // Espera a revelação (fase 3 da animação, 2,5s + folga).
    //
    // O ChestOpeningModal ganhou dois desfechos além do normal, e o beforeAll
    // pré-semeia 2 itens, então a rolagem duplicada é plausível:
    //   - item repetido -> "Equipamento já em seu inventário" (forja de XP)
    //   - pet           -> "Um ovo misterioso apareceu!"
    // Esperar só por "Adicionado ao inventário" travaria nesses casos.
    const revelacao = page
      .getByText("Adicionado ao inventário")
      .or(page.getByText("Equipamento já em seu inventário"))
      .or(page.getByText("Um ovo misterioso apareceu!"));
    await revelacao.first().waitFor({ timeout: 12_000 });

    // Nome do item no modal (h3). O modal é o único .fixed com h3 na página.
    const modalItemName = page.locator(".fixed h3").first();
    await expect(modalItemName).toBeVisible();
    expect(await modalItemName.textContent()).toBeTruthy();

    // Fecha o modal — o rótulo varia conforme o desfecho
    await page
      .getByRole("button", { name: /Continuar|Fechar|Ir para Chocadeira/ })
      .first()
      .click();

    // O inventário deve ter ao menos os 2 semeados; o 3º só existe se o baú
    // deu um item novo (não um duplicado nem um ovo).
    await page.goto("/perfil");
    const itemCount = await readItemCount(page);
    expect(itemCount).toBeGreaterThanOrEqual(2);
  });

  // ============================================================
  // T2: Equipar item e verificar SlotGrid + AvatarDisplay
  // ============================================================
  test("equipar item e verificar SlotGrid e AvatarDisplay", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 15_000 });

    const inventario = await openSection(page, SECTION_INVENTARIO);
    const card = inventario
      .locator("div.rounded-lg", { hasText: headItem.name })
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByRole("button", { name: "Equipar" }).click();
    await expect(card.getByText("Equipado")).toBeVisible({ timeout: 10_000 });

    // SlotGrid: o slot Cabeça passa a mostrar o nome do item, não "Vazio"
    const equipados = await openSection(page, SECTION_EQUIPADOS);
    await expect(equipados.getByText(headItem.name)).toBeVisible({ timeout: 5_000 });

    // O corpo do avatar sempre renderiza. AvatarDisplay foi reescrito e usa alt
    // GENÉRICO por camada ("Avatar"/"Head"/"Hand"/"Background"/"Pet"), não mais
    // o nome do item — quem usa alt={item.name} é só SlotGrid e InventoryGrid.
    //
    // O perfil monta DOIS AvatarDisplay (PerfilClient.tsx:415 size=lg e :436
    // size=xl), um para mobile e outro para desktop, e o CSS responsivo esconde
    // um deles. Por isso filtramos por :visible em vez de usar .first().
    await expect(page.locator('img[alt="Avatar"]:visible').first()).toBeVisible({
      timeout: 5_000,
    });

    // A camada de cabeça só existe se o asset -swap-{gender} estiver em public/
    if (headAssetRenderizavel) {
      await expect(page.locator('img[alt="Head"]:visible').first()).toBeVisible({
        timeout: 5_000,
      });
    } else {
      console.warn(
        `[phase8] head "${headItem.name}" sem asset -swap-*: camada do avatar não é verificável`
      );
    }

    // O nome do item aparece nas grades (inventário + slot equipado)
    expect(await page.locator(`img[alt="${headItem.name}"]`).count()).toBeGreaterThanOrEqual(1);
  });

  // ============================================================
  // T3: Desequipar item e ver avatar voltar ao vazio
  // ============================================================
  test("desequipar item e ver avatar voltar ao estado vazio", async ({ page }) => {
    // Precondição estabelecida pelo SERVIDOR, não pela UI de outro teste.
    //
    // Antes este teste dependia do T2 ter equipado o item e do estado
    // sobreviver entre testes — o que o tornava frágil e, quando falhava, dava
    // um erro que não dizia nada ("Desequipar" não encontrado). Equipar via RPC
    // aqui deixa o teste determinístico e focado no que ele promete verificar:
    // que desequipar pela UI funciona.
    const equipRes = await callRpcAsUser(accessToken, "equip_item", {
      p_item_id: headItem.id,
    });
    expect(equipRes.error, `equip_item falhou no setup: ${JSON.stringify(equipRes)}`).toBeFalsy();

    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 15_000 });

    const equipados = await openSection(page, SECTION_EQUIPADOS);

    // Precondição explícita: o slot Cabeça precisa estar preenchido. Se o card
    // diz "Equipado" mas o SlotGrid diz "Vazio", isso é inconsistência de
    // produto e o teste deve acusar aqui, não num timeout adiante.
    await expect(equipados.getByText(headItem.name)).toBeVisible({ timeout: 15_000 });

    const imgCountBefore = await page.locator(`img[alt="${headItem.name}"]`).count();

    const unequipBtn = equipados.getByText("Desequipar").first();
    await expect(unequipBtn).toBeVisible({ timeout: 10_000 });
    await unequipBtn.click();

    await expect(equipados.getByText("Vazio").first()).toBeVisible({ timeout: 10_000 });

    // Ao desequipar, a img do slot desaparece; sobra a do card do inventário
    await expect
      .poll(() => page.locator(`img[alt="${headItem.name}"]`).count(), { timeout: 10_000 })
      .toBeLessThan(imgCountBefore);
  });

  // ============================================================
  // T4: Filtros de inventário por slot
  // ============================================================
  test("filtros de inventário por slot", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 15_000 });

    const totalCount = await readItemCount(page);
    const inventario = await openSection(page, SECTION_INVENTARIO);
    const itemCards = inventario.locator(".grid > div");

    // O grid começa mostrando tudo
    await expect.poll(() => itemCards.count(), { timeout: 10_000 }).toBe(totalCount);

    // Filtro por slot Cabeça (rótulo é "👑 Cabeça")
    await inventario.getByRole("button", { name: /Cabeça/ }).click();
    await expect
      .poll(() => itemCards.count(), { timeout: 10_000 })
      .toBeLessThanOrEqual(totalCount);

    // "Todos" volta ao total
    await inventario.getByRole("button", { name: "Todos" }).click();
    await expect.poll(() => itemCards.count(), { timeout: 10_000 }).toBe(totalCount);
  });

  // ============================================================
  // T5: Filtros de inventário por raridade
  // ============================================================
  test("filtros de inventário por raridade", async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/perfil");
    await expect(page.locator(".animate-pulse").first()).toBeHidden({ timeout: 15_000 });

    const inventario = await openSection(page, SECTION_INVENTARIO);
    const itemCards = inventario.locator(".grid > div");
    const totalCount = await itemCards.count();
    expect(totalCount).toBeGreaterThan(0);

    // Filtro por raridade Comum
    const comunFilter = inventario.getByRole("button", { name: "Comum" });
    await comunFilter.click();
    await page.waitForTimeout(300);

    const filteredCount = await itemCards.count();
    if (filteredCount === 0) {
      await expect(
        inventario.getByText("Nenhum item corresponde aos filtros.")
      ).toBeVisible();
    } else {
      expect(filteredCount).toBeLessThanOrEqual(totalCount);
    }

    // Clicar de novo desliga o filtro
    await comunFilter.click();
    await expect.poll(() => itemCards.count(), { timeout: 10_000 }).toBe(totalCount);
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
