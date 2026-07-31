/**
 * A FOLHA DE CONTATO DA BASE — `npm run avatar:folha-base`
 *
 * O artefato que o Doug julga no Bloco 1, e o doc 15 é explícito sobre por que
 * esta aprovação é a que mais amarra: **a silhueta desta base é compartilhada por
 * todas as peças.** Os 14 trajes clipam nela, os chapéus se apoiam nela, os gates
 * de pixel medem contra ela. Aprovar a base errada e descobrir no Bloco 6
 * significa refazer tudo que veio depois.
 *
 * O QUE SE APROVA AQUI É O SVG, NÃO O PNG. A `referencia-base.png` aparece na
 * folha para comparação, e só. Ela não recolore, não pisca e não entra em asset
 * nenhum — se o SVG ficar diferente dela, quem manda é o que está na tela.
 *
 * AS QUATRO LEITURAS, na mesma imagem:
 *
 *  1. a base nos 4 tamanhos (56, 100, 200, 425 px) — 56 px é o teste do ranking;
 *  2. lado a lado com a referência, **na mesma escala de figura**, para medir
 *     fidelidade de proporção, espessura de traço e canto do especular. O
 *     alinhamento é calculado (fator 0,678 e as duas origens), nunca ajustado a
 *     olho;
 *  3. as 8 peles × o careca, provando que `var(--av-pele)` recolore de verdade;
 *  4. closes de COORDENADA MEDIDA — cada `viewBox` sai das constantes de
 *     `geometria.ts`, não de um número escolhido olhando a tela.
 *
 * O que ela NÃO mostra, e por isso o Bloco 1 exige dois artefatos: o piscar, o
 * respiro, o DPR 2 e o `prefers-reduced-motion`. Isso é `/dev/avatar-kokeshi`.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { chromium, type Browser } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  CABECA,
  CENTRO_X,
  OLHO,
  OLHO_CX_ESQ,
  ORELHA,
  TRONCO,
  VIEWBOX,
} from "../../../src/lib/avatar/estilo/geometria";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { PELE } from "../../../src/lib/avatar/palette";

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-base.png`;
const REFERENCIA = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";

/** Os quatro tamanhos de leitura. 56 é o do ranking e é o que manda. */
const TAMANHOS = [56, 100, 200, 425] as const;

// ---------------------------------------------------------------------------
// O alinhamento da referência — calculado, não ajustado
// ---------------------------------------------------------------------------

/**
 * A referência tem 1254×1254 e a figura dela ocupa y 155→1040 (885 px), com o
 * eixo de simetria em x≈617. No nosso `viewBox` a figura ocupa y 45→645 (600
 * unidades), com o eixo em 250.
 *
 * Daí saem os três números abaixo, e todos são consequência desses seis: nenhum
 * foi mexido até "ficar bom". Se a folha mostrar as duas figuras em tamanhos
 * diferentes, o erro está numa das medidas da referência, não no ajuste.
 */
const REF = { lado: 1254, figuraY0: 155, figuraY1: 1040, eixoX: 617 } as const;
const REF_ESCALA = 600 / (REF.figuraY1 - REF.figuraY0); // 0,678
const REF_X = 250 - REF.eixoX * REF_ESCALA;
const REF_Y = 45 - REF.figuraY0 * REF_ESCALA;
const REF_LADO = REF.lado * REF_ESCALA;

// ---------------------------------------------------------------------------
// Os closes — cada `viewBox` sai de uma constante da geometria
// ---------------------------------------------------------------------------

interface Close {
  rotulo: string;
  origem: string;
  vb: string;
}

/** Uma caixa quadrada de lado `lado` centrada num ponto medido. */
function caixa(cx: number, cy: number, lado: number): string {
  return `${(cx - lado / 2).toFixed(0)} ${(cy - lado / 2).toFixed(0)} ${lado} ${lado}`;
}

function closes(): Close[] {
  return [
    {
      rotulo: "orelha esquerda",
      origem: `CABECA.x0=${CABECA.x0} · ORELHA.cy=${ORELHA.cy} · ry=${ORELHA.ry}`,
      vb: caixa(CABECA.x0, ORELHA.cy, ORELHA.ry * 2 + 60),
    },
    {
      rotulo: "canto do olho",
      origem: `OLHO_CX_ESQ=${OLHO_CX_ESQ} · topo em ${OLHO.cy - OLHO.h / 2}`,
      vb: caixa(OLHO_CX_ESQ, OLHO.cy - OLHO.h / 2, 96),
    },
    {
      rotulo: "cabeça ↔ tronco",
      origem: `ombro em x=${CENTRO_X - TRONCO.meioOmbro} · base da cabeça y=${CABECA.y1}`,
      vb: caixa(CENTRO_X - TRONCO.meioOmbro, CABECA.y1 + 8, 170),
    },
    {
      rotulo: "canto do especular",
      origem: `canto superior esquerdo da cabeça (LUZ)`,
      vb: caixa(CABECA.x0 + 60, CABECA.y0 + 60, 150),
    },
    {
      rotulo: "base do tronco",
      origem: `TRONCO.yBase=${TRONCO.yBase} · r=${TRONCO.r} · sombra do chão`,
      vb: caixa(CENTRO_X, TRONCO.yBase - 10, 330),
    },
  ];
}

// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(DIAG, { recursive: true });

  const svg = compor({ pele: PELE[2], cabelo: "#3A2F2A", animado: true });
  const problemas = conferirSvg(svg);
  const formas = (svg.match(/<(path|ellipse|rect|circle)\b/g) ?? []).length;
  const bytes = Buffer.byteLength(svg, "utf-8");

  console.log(`base autorada:`);
  console.log(`  formas ............ ${formas}   (teto do plano: 20)`);
  console.log(`  bytes ............. ${bytes} (${(bytes / 1024).toFixed(2)} KB)   (teto do plano: 8 KB)`);
  console.log(`  conferirSvg ....... ${problemas.length} problema(s)`);
  for (const p of problemas) console.log(`    - ${p.detalhe}`);
  writeFileSync(`${DIAG}/base.svg`, svg);

  const refB64 = readFileSync(REFERENCIA).toString("base64");
  const refUri = `data:image/png;base64,${refB64}`;

  const recortes = closes();
  console.log(`\ncloses de coordenada medida (nenhum número escolhido a olho):`);
  for (const c of recortes) console.log(`  ${c.rotulo.padEnd(20)} "${c.vb}"   ← ${c.origem}`);

  const nav: Browser = await chromium.launch();
  try {
    const pg = await nav.newPage();

    /** A base num tamanho e num `viewBox`. `estatica` desliga o piscar. */
    const base = (h: number, vb = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`, pele: string = PELE[2], ns = "kk") => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      const um = compor({ pele, cabelo: "#3A2F2A", ns })
        .replace(`viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}"`, `viewBox="${vb}"`)
        .replace("<svg ", `<svg width="${Math.round((h * w0) / h0)}" height="${h}" `);
      return um;
    };

    /** A referência recortada e escalada para a figura cair no mesmo lugar. */
    const refNoLugar = (h: number, vb = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`) => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round((h * w0) / h0)}" ` +
        `height="${h}" viewBox="${vb}" style="background:#F5F1EC">` +
        `<image href="${refUri}" x="${REF_X.toFixed(2)}" y="${REF_Y.toFixed(2)}" ` +
        `width="${REF_LADO.toFixed(2)}" height="${REF_LADO.toFixed(2)}"/></svg>`
      );
    };

    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:3px">${rot}</figcaption></figure>`;
    const titulo = (t: string, sub = "") =>
      `<p style="margin:20px 0 6px;font:13px system-ui"><b>${t}</b>` +
      (sub ? ` <span style="color:#888;font-weight:400">— ${sub}</span>` : "") + `</p>`;

    // 1. os 4 tamanhos, e a referência ao lado em cada um
    const secaoTamanhos = TAMANHOS.map((t) =>
      fig(
        `${t} px${t === 56 ? " · o do ranking" : ""}`,
        `<div style="display:flex;gap:6px;align-items:flex-end;background:#fff;` +
          `border:1px solid #eee;padding:6px;border-radius:4px">` +
          fig("SVG", base(t)) +
          fig("referência", refNoLugar(t)) +
          `</div>`,
      ),
    ).join("");

    // 2. as 8 peles
    const secaoPeles = PELE.map((p, i) =>
      fig(`${i + 1} · ${p}`, base(150, `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`, p, `kk${i}`)),
    ).join("");

    // 3. os closes, SVG contra referência, no mesmo recorte
    const secaoCloses = recortes
      .map(
        (c) =>
          `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px">` +
          `<div style="width:230px;font:11px system-ui;color:#555;padding-top:60px">` +
          `<b>${c.rotulo}</b><br><span style="color:#999">${c.origem}</span><br>` +
          `<span style="color:#bbb">viewBox "${c.vb}"</span></div>` +
          fig("SVG", base(190, c.vb)) +
          fig("referência", refNoLugar(190, c.vb)) +
          `</div>`,
      )
      .join("");

    await pg.setViewportSize({ width: 1500, height: 900 });
    await pg.setContent(
      `<body style="margin:0;background:#fff;padding:18px;font:12px system-ui;color:#555">` +
        `<h1 style="font:600 17px system-ui;margin:0 0 3px">Base kokeshi — a folha do Bloco 1</h1>` +
        `<p style="margin:0;color:#888">O que se aprova é o <b>SVG</b>. A referência está ao lado só para comparar, ` +
        `alinhada por cálculo (escala ${REF_ESCALA.toFixed(3)}), e nunca vira asset. ` +
        `${formas} formas · ${(bytes / 1024).toFixed(2)} KB · conferirSvg ${problemas.length}.</p>` +
        titulo("Os quatro tamanhos", "56 px é o teste do ranking — se ele falhar, os outros três não salvam") +
        `<div style="display:flex;gap:14px;align-items:flex-end">${secaoTamanhos}</div>` +
        titulo("As 8 peles", "prova que var(--av-pele) recolore de verdade, e que a sombra da pele acompanha") +
        `<div style="display:flex;gap:8px;flex-wrap:wrap">${secaoPeles}</div>` +
        titulo("Closes de coordenada medida", "cada viewBox sai de uma constante de geometria.ts") +
        secaoCloses +
        `</body>`,
    );
    await pg.screenshot({ path: FOLHA, fullPage: true });
    console.log(`\n${FOLHA}`);
    console.log(`${DIAG}/base.svg`);
    await pg.close();
  } finally {
    await nav.close();
  }

  if (problemas.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
