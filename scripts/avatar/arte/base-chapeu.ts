/**
 * P0-C — A BASE DE EDIÇÃO DO CHAPÉU: onde ele pode ser desenhado, e onde não.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE, E O QUE ELE IMPEDE
 * ---------------------------------------------------------------------------
 *
 * O chapéu é a primeira peça a ser desenhada **acima do `viewBox`**, e ali mora
 * uma armadilha nova: o canvas de edição tem 1024 px de altura, mas a peça só
 * chega ao boneco dentro da `CAIXA_DA_ARTE` — px 212→812 × **2→932**. Tinta
 * desenhada acima da linha dos 2 px existe no arquivo e **não existe no produto**.
 *
 * É o mesmo papel que `base-tronco-campo.png` faz para o traje e
 * `base-barba-campo.png` para a barba, e a assimetria com os dois é o ponto: no
 * traje o campo é onde a peça PODE estar; na barba o que importa é o retângulo
 * proibido; aqui o que importa é **o teto**, porque é ele que acabou de mudar e é
 * ele que o olho não vê.
 *
 * ---------------------------------------------------------------------------
 * O TETO É NOVO, E ESTE ARQUIVO NASCEU COM ELE
 * ---------------------------------------------------------------------------
 *
 * Até 2026-08-24 a colagem parava em `y = 0` do sistema interno — um chapéu tinha
 * **39,5 unidades acima da coroa**, 12,6% de uma altura de cabeça, e não havia
 * chapéu que coubesse. A `CAIXA_DA_ARTE` subiu para −75 e são **114,6 unidades**,
 * 36,5%. O diagnóstico existe para essa folga ser usada inteira e não ser
 * ultrapassada — as duas coisas custam uma arte.
 *
 * ---------------------------------------------------------------------------
 * ELE NÃO REESCREVE A BASE, E ISSO É AMARRA
 * ---------------------------------------------------------------------------
 *
 * `arte:base` regeraria `base-oficial.png` de caminho, e esse arquivo é a régua
 * contra a qual o Gate −1 compara TODA arte já aprovada. Então este programa só
 * **lê** a base e escreve um arquivo separado, com nome próprio.
 *
 * O que ele escreve é diagnóstico e **não sobe ao gerador**: qualquer marca aqui
 * seria copiada pelo Gemini para dentro da arte.
 */

import { readFileSync, writeFileSync } from "fs";

import sharp from "sharp";

import {
  CAIXA_CABECA,
  CAIXA_DA_ARTE,
  TRACO,
} from "../../../src/lib/avatar/estilo/geometria";
import { LADO, PASTA, PNG_BASE, Y_PISO_DO_CHAPEU, paraPx } from "./base";

const SAIDA = `${PASTA}/base-chapeu-campo.png`;

/** Uma linha horizontal de borda a borda, com rótulo. */
function linha(yUnidade: number, cor: string, rotulo: string, ancora: "start" | "end"): string {
  const y = paraPx(0, yUnidade).y;
  const x = ancora === "end" ? LADO - 12 : 12;
  return (
    `<line x1="0" y1="${y.toFixed(1)}" x2="${LADO}" y2="${y.toFixed(1)}" ` +
    `stroke="${cor}" stroke-width="3" stroke-dasharray="14 10"/>` +
    `<text x="${x}" y="${(y + 26).toFixed(1)}" text-anchor="${ancora}" ` +
    `font-family="sans-serif" font-size="19" font-weight="bold" fill="${cor}">${rotulo}</text>`
  );
}

/** Uma faixa morta, pintada por cima: o que o produto não vai mostrar. */
function faixaMorta(y0: number, y1: number, rotulo: string): string {
  const a = paraPx(0, y0);
  const b = paraPx(0, y1);
  return (
    `<rect x="0" y="${a.y.toFixed(1)}" width="${LADO}" height="${(b.y - a.y).toFixed(1)}" ` +
    `fill="#D92B2B" fill-opacity="0.34"/>` +
    `<text x="${LADO / 2}" y="${((a.y + b.y) / 2 + 7).toFixed(1)}" text-anchor="middle" ` +
    `font-family="sans-serif" font-size="19" font-weight="bold" fill="#8A1414">${rotulo}</text>`
  );
}

/** As duas colunas mortas dos lados. */
function colunasMortas(): string {
  const e = paraPx(CAIXA_DA_ARTE.x, 0).x;
  const d = paraPx(CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w, 0).x;
  const topo = paraPx(0, CAIXA_DA_ARTE.y).y;
  const base = paraPx(0, Y_PISO_DO_CHAPEU).y;
  return (
    `<rect x="0" y="${topo.toFixed(1)}" width="${e.toFixed(1)}" height="${(base - topo).toFixed(1)}" ` +
    `fill="#D92B2B" fill-opacity="0.34"/>` +
    `<rect x="${d.toFixed(1)}" y="${topo.toFixed(1)}" width="${(LADO - d).toFixed(1)}" ` +
    `height="${(base - topo).toFixed(1)}" fill="#D92B2B" fill-opacity="0.34"/>`
  );
}

async function principal(): Promise<void> {
  const base = readFileSync(PNG_BASE);
  const meta = await sharp(base).metadata();
  if (meta.width !== LADO || meta.height !== LADO) {
    throw new Error(
      `a base tem ${meta.width}×${meta.height} e a rota inteira pressupõe ${LADO}×${LADO}. ` +
        `Rode \`npm run arte:base\` de propósito e re-congele os gates antes de seguir.`,
    );
  }

  const topoDoCanvas = (0 - paraPx(0, 0).y) / 1.2;
  const overlay =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}">` +
    // Acima do teto: existe no arquivo, não existe no boneco.
    faixaMorta(topoDoCanvas, CAIXA_DA_ARTE.y, "MORTO — o produto não mostra nada daqui para cima") +
    colunasMortas() +
    // Abaixo do piso: chega no olho. A sobrancelha o chapeu PODE cruzar desde
    // 2026-08-25 — a regra do produto e o olho, e foi decisao do Doug.
    faixaMorta(Y_PISO_DO_CHAPEU, CAIXA_CABECA.y1, "MORTO — daqui para baixo o chapéu chega no olho") +
    linha(CAIXA_DA_ARTE.y, "#0B7285", "TETO — a última linha que chega ao boneco", "start") +
    linha(CAIXA_CABECA.y0 - TRACO / 2, "#2B8C3A", "a coroa — o chapéu senta aqui", "end") +
    linha(Y_PISO_DO_CHAPEU, "#0B7285", "PISO — o topo do olho mais alto", "start") +
    `</svg>`;

  const png = await sharp(base)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
  writeFileSync(SAIDA, png);

  // ------------------------------------------------------------------ os números
  const coroa = CAIXA_CABECA.y0 - TRACO / 2;
  const teto = paraPx(0, CAIXA_DA_ARTE.y);
  const piso = paraPx(0, Y_PISO_DO_CHAPEU);
  const alturaCabeca = CAIXA_CABECA.alt + TRACO;

  console.log(`P0-C — O CAMPO DO CHAPÉU\n`);
  console.log(`  O TETO — a CAIXA_DA_ARTE, e ele mudou em 2026-08-24`);
  console.log(`    em unidades          y ${CAIXA_DA_ARTE.y}`);
  console.log(`    em pixels do canvas  y ${teto.y.toFixed(0)}   (sobram ${teto.y.toFixed(0)} px de margem até a borda do arquivo)`);
  console.log(
    `    acima da coroa       ${(coroa - CAIXA_DA_ARTE.y).toFixed(1)} u   ` +
      `= ${(((coroa - CAIXA_DA_ARTE.y) / alturaCabeca) * 100).toFixed(1)}% de uma altura de cabeça`,
  );
  console.log(`    antes eram           ${coroa.toFixed(1)} u = ${((coroa / alturaCabeca) * 100).toFixed(1)}%`);

  console.log(`\n  O PISO — o topo do olho mais alto, com meio traço`);
  console.log(`    em unidades          y ${Y_PISO_DO_CHAPEU.toFixed(1)}`);
  console.log(`    em pixels do canvas  y ${piso.y.toFixed(0)}`);
  console.log(`    altura útil da testa ${(Y_PISO_DO_CHAPEU - coroa).toFixed(1)} u abaixo da coroa`);

  console.log(`\n  OS LADOS — a CAIXA_DA_ARTE, e desde 2026-08-25 ela é MAIS LARGA que o retrato`);
  console.log(
    `    em unidades          x ${CAIXA_DA_ARTE.x} → ${CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w}` +
      `   (px ${paraPx(CAIXA_DA_ARTE.x, 0).x.toFixed(0)} → ${paraPx(CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w, 0).x.toFixed(0)})`,
  );
  console.log(
    `    transbordo livre     ${(CAIXA_CABECA.x0 - TRACO / 2 - CAIXA_DA_ARTE.x).toFixed(1)} u à esquerda · ` +
      `${(CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w - CAIXA_CABECA.x1 - TRACO / 2).toFixed(1)} u à direita`,
  );

  console.log(`\n  escrito em ${SAIDA}`);
  console.log(`  ⚠️ diagnóstico. NÃO anexe este arquivo ao gerador — anexe ${PNG_BASE}.`);
}

principal();
