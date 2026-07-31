/**
 * MEDE A ANIMAÇÃO DA BASE NO CHROMIUM — `npm run avatar:animacao`
 *
 * Três coisas que nenhum gate de estrutura pega, porque todas passam por
 * qualquer conferência de string:
 *
 *  1. **o olho nasce fechado** — a lição cara da folhinha. Se a pálpebra tem o
 *     estado correto só dentro do `@keyframes`, o boneco aparece cego em toda
 *     screenshot, com o motor pausado e com `prefers-reduced-motion`. Ou seja:
 *     aparece cego exatamente onde a arte se aprova;
 *  2. **a animação não roda** — CSS emitido, `transform` inválido, e nada acusa;
 *  3. **a animação roda mesmo quando o usuário pediu para parar.**
 *
 * A medida não é a string do CSS, é a CAIXA RENDERIZADA da forma, amostrada ao
 * longo de dois ciclos. `/dev/avatar-kokeshi` fica atrás de auth como as outras
 * páginas `/dev`; o que precisa de prova é o SVG, e a página injeta exatamente
 * esta string.
 */

import { mkdirSync } from "fs";
import { chromium, type Page } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { PELE } from "../../../src/lib/avatar/palette";
import { VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";

const DIAG = ".scratch/estilo";

/** Duas voltas do ciclo mais longo (5,2 s do piscar), amostradas a 60 ms. */
const AMOSTRAS = 190;
const PASSO = 60;

const svg = compor({ pele: PELE[2], cabelo: "#3A2F2A", animado: true, ns: "kk" }).replace(
  "<svg ",
  `<svg width="${VIEWBOX.w}" height="${VIEWBOX.h}" `,
);

async function amostrar(pg: Page, reduzido: boolean) {
  await pg.emulateMedia({ reducedMotion: reduzido ? "reduce" : "no-preference" });
  await pg.setContent(`<body style="margin:0;background:#EFEAE2">${svg}</body>`);
  const olho = pg.locator("rect.kk-olho").first();
  const corpo = pg.locator("g.kk-respira").first();
  await olho.waitFor();

  const inicial = (await olho.boundingBox())!.height;
  const olhos: number[] = [];
  const alturas: number[] = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    olhos.push((await olho.boundingBox())!.height);
    alturas.push((await corpo.boundingBox())!.y);
    await pg.waitForTimeout(PASSO);
  }
  return { inicial, olhos, alturas };
}

async function main() {
  mkdirSync(DIAG, { recursive: true });
  const nav = await chromium.launch();
  const falhas: string[] = [];
  try {
    const pg = await nav.newPage({
      viewport: { width: VIEWBOX.w + 200, height: VIEWBOX.h + 200 },
      deviceScaleFactor: 2,
    });

    const on = await amostrar(pg, false);
    const aberto = Math.max(...on.olhos);
    const fechado = Math.min(...on.olhos);
    const piscadas = on.olhos.filter((h) => h < aberto * 0.5).length;
    const respiro = Math.max(...on.alturas) - Math.min(...on.alturas);

    console.log(`animação LIGADA · ${((AMOSTRAS * PASSO) / 1000).toFixed(1)} s de amostra, DPR 2`);
    console.log(`  altura do olho AO ENTRAR ........... ${on.inicial.toFixed(1)} px`);
    console.log(`  máximo (aberto) .................... ${aberto.toFixed(1)} px`);
    console.log(`  mínimo (fechado) ................... ${fechado.toFixed(1)} px`);
    console.log(`  amostras com olho fechado .......... ${piscadas} de ${AMOSTRAS}`);
    console.log(`  amplitude do respiro ............... ${respiro.toFixed(1)} px`);

    if (on.inicial < aberto * 0.95)
      falhas.push(
        `o olho NASCE FECHADO (${on.inicial.toFixed(1)} px contra ${aberto.toFixed(1)} aberto) — ` +
          `o boneco apareceria cego em toda folha de contato`,
      );
    if (fechado >= aberto * 0.3)
      falhas.push(`o olho NÃO PISCA: mínimo ${fechado.toFixed(1)} px de ${aberto.toFixed(1)}`);
    if (respiro <= 2) falhas.push(`o boneco NÃO RESPIRA: amplitude ${respiro.toFixed(1)} px`);

    const off = await amostrar(pg, true);
    const aberto2 = Math.max(...off.olhos);
    const fechado2 = Math.min(...off.olhos);
    const respiro2 = Math.max(...off.alturas) - Math.min(...off.alturas);

    console.log(`\nprefers-reduced-motion: reduce`);
    console.log(`  olho: min ${fechado2.toFixed(1)} · max ${aberto2.toFixed(1)} px`);
    console.log(`  amplitude do respiro ............... ${respiro2.toFixed(1)} px`);

    if (fechado2 < aberto2 * 0.98 || respiro2 >= 1)
      falhas.push(`com reduced-motion algo AINDA ANIMA (olho ${fechado2.toFixed(1)}–${aberto2.toFixed(1)}, respiro ${respiro2.toFixed(1)})`);
    if (fechado2 < aberto * 0.95)
      falhas.push(`com reduced-motion o olho ficou FECHADO — o estado parado não é o correto`);

    await pg.emulateMedia({ reducedMotion: "no-preference" });
    await pg.setContent(`<body style="margin:0;background:#EFEAE2">${svg}</body>`);
    await pg.waitForTimeout(300);
    await pg.screenshot({
      path: `${DIAG}/base-dpr2.png`,
      clip: { x: 0, y: 0, width: VIEWBOX.w, height: VIEWBOX.h },
    });
    console.log(`\n${DIAG}/base-dpr2.png  (DPR 2 — ${VIEWBOX.w}×${VIEWBOX.h} CSS, o dobro em pixel real)`);
    await pg.close();
  } finally {
    await nav.close();
  }

  if (falhas.length) {
    console.error(`\n${falhas.length} REPROVAÇÃO(ÕES):`);
    for (const f of falhas) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log(`\nanimação limpa: nasce aberto, pisca, respira, e para quando pedem para parar`);
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
