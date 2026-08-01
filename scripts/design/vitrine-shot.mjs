/**
 * Fotografa a vitrine de design (/design-lab) — o laço "construir, ver,
 * criticar, corrigir".
 *
 * Uso:  npm run dev   (em outro terminal)
 *       npm run shot:design
 *
 * ⚠️ NÃO confundir com `npm run test:e2e`. Aquele roda a suíte do Playwright
 * contra o Supabase de PRODUÇÃO e cria usuários reais — está bloqueado por
 * `deny` em .claude/settings.json, e o bloqueio é para ficar. Este script só
 * abre localhost:3000/design-lab, que não tem login nem toca no banco.
 *
 * Com o Playwright MCP ativo, o agente dirige o navegador direto e não precisa
 * deste script. Ele existe para quando o MCP não estiver carregado, e porque
 * encoda a reprovação de overflow horizontal em 375px.
 */
import { chromium } from "@playwright/test";

const OUT = process.argv[2] ?? ".validation-shots";
const BASE = process.env.SHOT_BASE_URL ?? "http://localhost:3000";

/** O indicador de dev do Next fica por cima do canto e suja o screenshot. */
const SEM_OVERLAY = "nextjs-portal, [data-nextjs-toast] { display: none !important; }";

/** Largura de projeto do produto. Ver DESIGN.md, seção Layout. */
const ALVO = 375;

const DIRECOES = [
  ["a", "A — Continuidade"],
  ["b", "B — Kokeshi"],
  ["c", "C — Patentes"],
];

const browser = await chromium.launch();
let reprovou = false;

// 1) Folha de contato — as três lado a lado, uma imagem só.
const wide = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const folha = await wide.newPage();
await folha.goto(`${BASE}/design-lab`, { waitUntil: "networkidle" });
await folha.addStyleTag({ content: SEM_OVERLAY });
await folha.waitForTimeout(600);
await folha.screenshot({ path: `${OUT}/design-folha-contato.png`, fullPage: true });
console.log("ok  folha-contato");

// 2) Cada direção sozinha, no alvo real.
const phone = await browser.newContext({
  viewport: { width: ALVO, height: 812 },
  deviceScaleFactor: 1,
});
for (const [id, nome] of DIRECOES) {
  const page = await phone.newPage();
  await page.goto(`${BASE}/design-lab`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: SEM_OVERLAY });
  await page.getByRole("button", { name: nome }).click();
  await page.waitForTimeout(400);

  // Overflow horizontal em 375px é reprovação — regra do DESIGN.md.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  await page.screenshot({ path: `${OUT}/design-${ALVO}-${id}.png`, fullPage: true });
  if (overflow) reprovou = true;
  console.log(`ok  ${ALVO} ${id}${overflow ? "   ✗ OVERFLOW HORIZONTAL" : ""}`);
  await page.close();
}

await browser.close();

if (reprovou) {
  console.error(`\n✗ Alguma direção estoura a largura de ${ALVO}px.`);
  process.exit(1);
}
console.log(`\n✓ Nenhum overflow horizontal em ${ALVO}px. Imagens em ${OUT}/`);
