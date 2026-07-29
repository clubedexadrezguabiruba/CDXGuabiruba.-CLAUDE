/**
 * Gera as folhas de comparação que sustentam as decisões T0.12 e T0.14.
 *
 * Uso: npm run avatar:prototipo
 * Saída: .scratch/proporcao/ e .scratch/pet/ (pasta ignorada pelo git —
 * são material de decisão, não asset de produção).
 *
 * O ciclo é fechado: escrever SVG → renderizar no Chromium → LER o PNG →
 * criticar → refinar. Rodar de novo depois de mexer no boneco é como se
 * confere que a mudança melhorou de fato, em vez de julgar por descrição.
 */

import { readFileSync, statSync } from "fs";
import { boneco, type OpcoesBoneco } from "../../../src/lib/avatar/prototipo/boneco";
import { peaozinho } from "../../../src/lib/avatar/prototipo/pet";
import { CABELO, LINHA, PELE, menorDistancia } from "../../../src/lib/avatar/palette";
import { exigirSvgValido } from "../../../src/lib/avatar/svgContrato";
import { otimizar } from "../otimizar-svg";
import {
  abrirNavegador,
  renderizarSvg,
  renderizarHtml,
  salvar,
  TAMANHOS,
} from "../render-svg";

const DIR = ".scratch/proporcao";
const DIR_PET = ".scratch/pet";
const APNG = "public/items/pet/peaozinho-madeira-animated.png";
const PNG = "public/items/pet/peaozinho-madeira.png";

/** Proporção escolhida na T0.12. Ver o porquê em docs/avatar/14. */
export const CABECAS_ESCOLHIDA = 3;

const VARIANTES = [2, 3, 4];

const VESTIDOS: { chave: string; rotulo: string; opts: Partial<OpcoesBoneco> }[] = [
  { chave: "nu", rotulo: "base", opts: {} },
  { chave: "bone", rotulo: "boné", opts: { chapeu: "bone" } },
  { chave: "elmo", rotulo: "elmo", opts: { chapeu: "elmo" } },
  { chave: "coroa", rotulo: "coroa", opts: { chapeu: "coroa" } },
  { chave: "soldado", rotulo: "unif. Soldado", opts: { uniforme: "soldado" } },
  { chave: "general", rotulo: "unif. General", opts: { uniforme: "general" } },
  { chave: "cheio", rotulo: "coroa + General", opts: { chapeu: "coroa", uniforme: "general" } },
];

function b64(caminho: string): string {
  return "data:image/png;base64," + readFileSync(caminho).toString("base64");
}

async function folhaProporcoes(nav: Awaited<ReturnType<typeof abrirNavegador>>) {
  for (const n of VARIANTES) {
    const svg = boneco({ cabecas: n });
    // Confere o contrato ANTES de gravar: comentário dentro do <style> e
    // variável fora da lista congelada falham em silêncio no navegador.
    exigirSvgValido(svg, `boneco 1:${n}`);
    salvar(`${DIR}/boneco-${n}.svg`, otimizar(svg));
    for (const t of TAMANHOS) {
      await renderizarSvg(nav, svg, t.w, t.h, `${DIR}/${n}-${t.nome}.png`, "#EFEAE2");
    }
  }

  const linhas = VARIANTES.map(
    (n) => `<tr><th>1:${n}</th>${TAMANHOS.map(
      (t) => `<td><img src="${b64(`${DIR}/${n}-${t.nome}.png`)}" width="${t.w}" height="${t.h}"></td>`,
    ).join("")}</tr>`,
  ).join("");

  await renderizarHtml(
    nav,
    `<!doctype html><html><body style="margin:0;background:#fff;font:13px system-ui">
     <table style="border-collapse:collapse;margin:16px">
       <tr><th></th>${TAMANHOS.map((t) => `<th style="padding:6px 14px;color:#555">${t.nome} · ${t.w}px</th>`).join("")}</tr>
       ${linhas}
     </table>
     <style>td{padding:10px 14px;vertical-align:bottom;text-align:center}th{color:#333;font-weight:600}</style>
     </body></html>`,
    760,
    `${DIR}/folha-tamanho-real.png`,
  );

  const lupa = VARIANTES.map(
    (n) => `<figure style="margin:0 18px;text-align:center">
      <img src="${b64(`${DIR}/${n}-sm.png`)}" width="${56 * 7}" height="${70 * 7}"
           style="image-rendering:pixelated;border:1px solid #ccc">
      <figcaption style="margin-top:8px;font:14px system-ui;color:#333">1:${n}</figcaption>
    </figure>`,
  ).join("");

  await renderizarHtml(
    nav,
    `<!doctype html><html><body style="margin:0;background:#fff">
     <div style="display:flex;padding:20px">${lupa}</div></body></html>`,
    1300,
    `${DIR}/folha-lupa-56.png`,
  );
}

async function folhaVestidos(nav: Awaited<ReturnType<typeof abrirNavegador>>) {
  const ZOOM = 6;
  for (const n of VARIANTES) {
    for (const c of VESTIDOS) {
      const svg = boneco({ cabecas: n, ...c.opts });
      await renderizarSvg(nav, svg, 56, 70, `${DIR}/vestidos/${n}-${c.chave}.png`, "#EFEAE2");
    }
  }

  const linhas = VARIANTES.map(
    (n) => `<tr><th style="padding-right:14px">1:${n}</th>${VESTIDOS.map(
      (c) => `<td><img src="${b64(`${DIR}/vestidos/${n}-${c.chave}.png`)}" width="${56 * ZOOM}" height="${70 * ZOOM}" style="image-rendering:pixelated;border:1px solid #d5d0c8"></td>`,
    ).join("")}</tr>`,
  ).join("");

  await renderizarHtml(
    nav,
    `<!doctype html><html><body style="margin:0;background:#fff;font:15px system-ui">
     <p style="margin:16px 20px 4px;color:#444">Todos renderizados a <b>56&times;70 px reais</b> e ampliados ${ZOOM}&times; sem suavização.</p>
     <table style="border-collapse:separate;border-spacing:12px;margin:8px">
       <tr><th></th>${VESTIDOS.map((c) => `<th style="color:#555;font-weight:600">${c.rotulo}</th>`).join("")}</tr>
       ${linhas}
     </table></body></html>`,
    56 * ZOOM * VESTIDOS.length + 200,
    `${DIR}/vestidos/folha-vestidos.png`,
  );
}

async function folhaPaleta(nav: Awaited<ReturnType<typeof abrirNavegador>>) {
  // O veredito de aprovado/reprovado é do validador em palette.ts, coberto por
  // `npm test`. Aqui só mostramos a folga que sobrou, porque é o número que
  // encolhe quando alguém acrescenta uma cor sem perceber.
  console.log(`\nFolga da paleta (contorno ${LINHA}, mínimo exigido 25)`);
  for (const [nome, lista] of [["pele", PELE], ["cabelo", CABELO]] as const) {
    console.log(`  ${nome.padEnd(7)} menor distância entre irmãos: ${menorDistancia(lista).toFixed(1)}`);
  }

  for (let i = 0; i < PELE.length; i++) {
    const svg = boneco({ cabecas: CABECAS_ESCOLHIDA, pele: i });
    await renderizarSvg(nav, svg, 56, 70, `${DIR}/paleta/pele-${i}-sm.png`, "#EFEAE2");
    await renderizarSvg(nav, svg, 200, 250, `${DIR}/paleta/pele-${i}-lg.png`, "#EFEAE2");
  }
  for (let i = 0; i < CABELO.length; i++) {
    const svg = boneco({ cabecas: CABECAS_ESCOLHIDA, pele: 3, cabelo: i });
    await renderizarSvg(nav, svg, 200, 250, `${DIR}/paleta/cabelo-${i}-lg.png`, "#EFEAE2");
  }

  const sm = PELE.map((_, i) => `<td><img src="${b64(`${DIR}/paleta/pele-${i}-sm.png`)}" width="168" height="210" style="image-rendering:pixelated"></td>`).join("");
  const lg = PELE.map((_, i) => `<td><img src="${b64(`${DIR}/paleta/pele-${i}-lg.png`)}" width="140" height="175"></td>`).join("");
  const cab = CABELO.map((_, i) => `<td><img src="${b64(`${DIR}/paleta/cabelo-${i}-lg.png`)}" width="140" height="175"></td>`).join("");

  await renderizarHtml(
    nav,
    `<!doctype html><html><body style="margin:0;background:#fff;font:14px system-ui;color:#333">
     <p style="margin:16px 20px 2px"><b>8 tons de pele</b> &mdash; a 56 px, ampliado 3&times;. Um arquivo, oito cores.</p>
     <table style="border-spacing:8px;margin:4px"><tr>${sm}</tr></table>
     <p style="margin:20px 20px 2px">Os mesmos 8 a 200 px.</p>
     <table style="border-spacing:8px;margin:4px"><tr>${lg}</tr></table>
     <p style="margin:20px 20px 2px"><b>${CABELO.length} cabelos</b> &mdash; preto, castanho, castanho claro, loiro, ruivo, grisalho, roxo, azul.</p>
     <table style="border-spacing:8px;margin:4px"><tr>${cab}</tr></table>
     </body></html>`,
    1420,
    `${DIR}/paleta/folha-paleta.png`,
  );
}

async function folhaPet(nav: Awaited<ReturnType<typeof abrirNavegador>>) {
  const svg = peaozinho();
  salvar(`${DIR_PET}/peaozinho.svg`, otimizar(svg));

  const kb = (c: string) => (statSync(c).size / 1024).toFixed(1);
  const apngPng = statSync(APNG).size + statSync(PNG).size;

  console.log("\nPeso do mesmo pet, nos três formatos:");
  console.log(`  APNG animado : ${kb(APNG).padStart(8)} KB`);
  console.log(`  PNG estático : ${kb(PNG).padStart(8)} KB`);
  console.log(`  SVG animado  : ${(svg.length / 1024).toFixed(1).padStart(8)} KB  (um arquivo serve aos dois usos)`);
  console.log(`  20 pets em APNG+PNG = ${((apngPng * 20) / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  20 pets em SVG      = ${((svg.length * 20) / 1024).toFixed(1)} KB`);

  const instantes = [0, -1.1, -1.6].map(
    (d) => `<figure style="margin:0 10px;text-align:center">
      <div style="width:110px;height:110px;background:#EFEAE2;border:1px solid #ddd">
        ${svg.replace("<svg ", `<svg width="110" height="110" `)}
      </div>
      <figcaption style="font:12px system-ui;color:#666;margin-top:6px">t=${(-d).toFixed(1)}s</figcaption>
    </figure>`,
  ).join("");

  await renderizarHtml(
    nav,
    `<!doctype html><html><head><style>
      figure:nth-of-type(2) .flutua, figure:nth-of-type(2) .acena, figure:nth-of-type(2) .broto { animation-delay: -1.1s; }
      figure:nth-of-type(3) .flutua, figure:nth-of-type(3) .acena, figure:nth-of-type(3) .broto { animation-delay: -1.6s; }
     </style></head><body style="margin:0;background:#fff;font:14px system-ui;color:#333">
     <p style="margin:16px 20px 4px"><b>SVG animado por CSS</b> &mdash; três instantes do ciclo de 3,2 s, a 110 px.</p>
     <div style="display:flex;padding:6px 16px">${instantes}</div>
     <p style="margin:20px 20px 4px"><b>APNG existente</b> (3,2 MB) e <b>PNG estático</b> (785 KB), a 110 px.</p>
     <div style="display:flex;padding:6px 16px;gap:20px">
       <div style="width:110px;height:110px;background:#EFEAE2;border:1px solid #ddd"><img src="${b64(APNG)}" width="110" height="110"></div>
       <div style="width:110px;height:110px;background:#EFEAE2;border:1px solid #ddd"><img src="${b64(PNG)}" width="110" height="110"></div>
     </div>
     <p style="margin:20px 20px 4px"><b>A 56 px</b>, que é o tamanho que manda &mdash; SVG, APNG, PNG.</p>
     <div style="display:flex;padding:6px 16px;gap:16px;align-items:flex-start">
       <div style="width:56px;height:56px;background:#EFEAE2">${svg.replace("<svg ", '<svg width="56" height="56" ')}</div>
       <div style="width:56px;height:56px;background:#EFEAE2"><img src="${b64(APNG)}" width="56" height="56"></div>
       <div style="width:56px;height:56px;background:#EFEAE2"><img src="${b64(PNG)}" width="56" height="56"></div>
     </div></body></html>`,
    620,
    `${DIR_PET}/folha-pet.png`,
  );
}

async function main() {
  const nav = await abrirNavegador();
  try {
    await folhaProporcoes(nav);
    await folhaVestidos(nav);
    await folhaPaleta(nav);
    await folhaPet(nav);
  } finally {
    await nav.close();
  }

  console.log("\nFolhas geradas:");
  console.log(`  ${DIR}/folha-tamanho-real.png      as 3 proporções nos 4 tamanhos`);
  console.log(`  ${DIR}/folha-lupa-56.png           as 3 a 56 px, ampliadas 7x`);
  console.log(`  ${DIR}/vestidos/folha-vestidos.png as 3 com chapéu e uniforme, a 56 px  <- decide a T0.12`);
  console.log(`  ${DIR}/paleta/folha-paleta.png     8 tons de pele e 5 cabelos`);
  console.log(`  ${DIR_PET}/folha-pet.png                SVG animado x APNG              <- decide a T0.14`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
