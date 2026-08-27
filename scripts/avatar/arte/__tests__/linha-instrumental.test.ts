/**
 * A LINHA INSTRUMENTAL — o defeito reproduzido, o conserto medido.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO GUARDA
 * ---------------------------------------------------------------------------
 *
 * Extração é *diferença contra a base*, e **preto sobre preto difere ~0**. Onde o
 * contorno da peça cai por cima do contorno do boneco, a linha é comida. O Doug
 * pegou o defeito a olho duas vezes, com um slot de distância — no cabelo em
 * 2026-08-22, no chapéu em 2026-08-24 (*"a borda da arte se misturou com a borda da
 * cabeça e a esteira se confundiu e eliminou a borda"*).
 *
 * O chapéu é o slot em que isso é **regra e não azar**: ele senta na cabeça, então a
 * borda dele corre por cima da borda dela por construção.
 *
 * A fixture é o caso difícil na sua forma pura: um gorro cuja linha de baixo é
 * desenhada **exatamente sobre a tabela do contorno do crânio** — a mesma
 * `CABECA.contorno` que o compositor usa, não uma curva parecida. Duas artes
 * idênticas, e a única diferença é a cor da linha.
 *
 * ⚠️ **O braço PRETO é o controle negativo, e ele precisa continuar reprovando.**
 * Uma régua consertada sem o erro ao lado é uma régua que ninguém consegue conferir
 * que está consertada — é o mesmo princípio de `MetodoDePreto` e do controle na base
 * de `construirPeca`.
 */

import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, rmSync, writeFileSync } from "fs";

import sharp from "sharp";

import { ESCALA, LADO, PASTA, PNG_BASE, paraPx } from "../base";
import { CHAPEU, tintaDoChapeu } from "../chapeu";
import { extrairPorCampo } from "../extrair";
import {
  ehLinhaInstrumental,
  marcar,
  neutralizar,
} from "../linha-instrumental";
import { construirPeca } from "../peca-de-arte";
import { CABECA, TRACO } from "../../../../src/lib/avatar/estilo/geometria";

/** O contorno do crânio em pixels do canvas — a MESMA tabela que o boneco usa. */
const contorno = CABECA.contorno.map((p) => paraPx(p.x, p.y));
const meio = contorno.reduce((s, p) => s + p.y, 0) / contorno.length;
/** Só a metade de CIMA: é ali que a borda de um gorro corre. */
const arco = contorno.filter((p) => p.y < meio);

const escritos: string[] = [];

function gorro(cor: string): Buffer {
  const linha = arco.map((p, k) => `${k ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const topo = paraPx(0, -60).y;
  const tampa =
    `${linha} L ${arco[arco.length - 1].x.toFixed(1)} ${topo.toFixed(1)} ` +
    `L ${arco[0].x.toFixed(1)} ${topo.toFixed(1)} Z`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}">` +
      `<path d="${tampa}" fill="#B8563C"/>` +
      `<path d="${linha}" fill="none" stroke="${cor}" ` +
      `stroke-width="${(TRACO * ESCALA).toFixed(1)}" stroke-linecap="round"/>` +
      `</svg>`,
  );
}

/** Quantos pixels da FAIXA da borda sobreviveram à extração. */
async function bordaQueSobrevive(cor: string, slug: string) {
  const arq = `${PASTA}/${slug}.png`;
  const png = await sharp(readFileSync(PNG_BASE))
    .composite([{ input: gorro(cor), top: 0, left: 0 }])
    .png()
    .toBuffer();
  writeFileSync(arq, png);
  escritos.push(arq);

  const p = await construirPeca(arq, CHAPEU, tintaDoChapeu, "raster");
  escritos.push(p.arte);

  const raio = Math.round((TRACO * ESCALA) / 2);
  const naFaixa = new Uint8Array(LADO * LADO);
  for (const q of arco)
    for (let dy = -raio; dy <= raio; dy++)
      for (let dx = -raio; dx <= raio; dx++) {
        const x = Math.round(q.x + dx);
        const y = Math.round(q.y + dy);
        if (x >= 0 && x < LADO && y >= 0 && y < LADO) naFaixa[y * LADO + x] = 1;
      }

  const e = await extrairPorCampo(arq, CHAPEU.campo);
  let total = 0;
  let comPeca = 0;
  for (let i = 0; i < naFaixa.length; i++)
    if (naFaixa[i]) {
      total++;
      if (e.mascara[i]) comPeca++;
    }
  return { pct: (comPeca / total) * 100, comPeca, total, arte: p.arte };
}

afterAll(() => {
  for (const f of escritos) rmSync(f, { force: true });
});

describe("a linha instrumental, no slot que precisa dela por construção", () => {
  it(
    "CONTROLE: com a linha PRETA sobre o contorno do crânio, a borda é COMIDA",
    { timeout: 180_000 },
    async () => {
      const r = await bordaQueSobrevive("#000000", "chapeu-zz-teste-preto");
      // Medido em 2026-08-24: 370 de 4 897 px, 7,6%. O teto é folgado de propósito —
      // o número exato depende do antialias do rasterizador, o FENÔMENO não.
      expect(r.pct).toBeLessThan(25);
    },
  );

  it(
    "CONSERTO: com a linha AZUL, a mesma borda SOBREVIVE",
    { timeout: 180_000 },
    async () => {
      const r = await bordaQueSobrevive("#0000C8", "chapeu-zz-teste-azul");
      // Medido: 4 739 de 4 897 px, 96,8%.
      expect(r.pct).toBeGreaterThan(85);
    },
  );

  it("a conversão da linha depende do DESTINO, e são duas", () => {
    // `#0000C8` puro: luminância 0,0722 × 200 = 14,4 → 14.
    expect(neutralizar(0, 0, 200)).toEqual([14, 14, 14]);
    expect(marcar(0, 0, 200)).toEqual([14, 14, 62]);

    // Quem tem cor assada NÃO pode levar os 48 de azul: eles chegariam ao avatar.
    const [, , bNeutro] = neutralizar(0, 0, 200);
    const [, , bMarcado] = marcar(0, 0, 200);
    expect(bNeutro).toBeLessThan(bMarcado);

    // As duas preservam a luminância, que é o produto inteiro desta linha de arte:
    // marcar a linha é dizer "esta linha é da peça", não "esta linha é toda igual".
    for (const [r, g, b] of [
      [0, 0, 200],
      [10, 12, 160],
      [4, 6, 90],
    ]) {
      const L = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      expect(neutralizar(r, g, b)[0]).toBe(L);
      expect(marcar(r, g, b)[0]).toBe(L);
    }
  });

  it("o predicado separa a MARCAÇÃO da peça pintada de azul", () => {
    // A marcação: azul dominante E escura.
    expect(ehLinhaInstrumental(0, 0, 200)).toBe(true);
    expect(ehLinhaInstrumental(0, 0, 128)).toBe(true);
    // Um chapéu PINTADO de azul claro não é marcação — é peça, e sai azul no aluno.
    expect(ehLinhaInstrumental(90, 110, 240)).toBe(false);
    // O preto do boneco não é marcação: não há azul dominante.
    expect(ehLinhaInstrumental(0, 0, 0)).toBe(false);
    // Nem o ciano da massa do cabelo.
    expect(ehLinhaInstrumental(0, 200, 200)).toBe(false);
  });
});
