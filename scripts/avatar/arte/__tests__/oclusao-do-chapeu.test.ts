/**
 * A REGIÃO DE OCLUSÃO E A MÃO DO DOUG — o gate da esteira do `escondeCabelo`.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELE COBRA, E POR QUE CADA UM
 * ---------------------------------------------------------------------------
 *
 * A correção à mão (`oclusao/<slug>.png`) é **entrada** da esteira, e é isso que
 * mantém `chapeus-da-arte.ts` sendo arquivo gerado. Três propriedades sustentam
 * essa promessa, e as três reprovam aqui se caírem:
 *
 *  1. **os dois sentidos funcionam** — verde esconde, vermelho mostra. Um gate que
 *     só medisse "a mão mudou alguma coisa" passaria com o vermelho inerte;
 *  2. **ausência ≡ máquina, byte a byte.** Apagar o PNG tem de devolver exatamente
 *     a região de antes de existir mão. Sem isso a correção é irreversível, e
 *     irreversível num arquivo gerado é uma armadilha;
 *  3. **o traçado é determinístico.** A mesma região tem de dar o mesmo `d`, senão
 *     `arte:chapeus --check` acusaria defasagem a cada rodada e o Doug perderia a
 *     régua que avisa quando a arte de verdade mudou.
 *
 * ⚠️ **A cobaia é escolhida por MEDIÇÃO, não por nome.** O teste acha a primeira
 * coluna com região e pinta ali — foi essa a diferença entre a primeira versão
 * deste gate, que pintava em x 0..40 e media "a mão mudou 0 px" achando que estava
 * verde, e esta. A região do `bone` só começa na coluna 156 de 780.
 */
import { readFileSync } from "fs";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { CHAPEUS_DA_ARTE } from "../../../../src/lib/avatar/estilo/chapeus-da-arte";
import { conferirOclusao, linhaDeOclusao, medirOclusao } from "../oclusao-do-chapeu";

const SLUG = "chapeu-bone";
const svgDaPeca = () => readFileSync(`public${CHAPEUS_DA_ARTE[SLUG].arte!}`, "utf-8");

const conta = (m: Uint8Array) => {
  let n = 0;
  for (let i = 0; i < m.length; i++) if (m[i]) n++;
  return n;
};

/** Uma faixa vertical de 40 colunas a partir de `x0`, na cor pedida. */
async function pincelada(
  w: number,
  h: number,
  x0: number,
  cor: "verde" | "vermelho",
): Promise<Buffer> {
  const buf = Buffer.alloc(w * h * 4, 0);
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < Math.min(w, x0 + 40); x++) {
      const k = (y * w + x) * 4;
      if (cor === "verde") buf[k + 1] = 255;
      else buf[k] = 255;
      buf[k + 3] = 255;
    }
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

describe("a região de oclusão do chapéu", () => {
  it("a máquina propõe região não-vazia para todo chapéu do elenco", async () => {
    for (const [slug, peca] of Object.entries(CHAPEUS_DA_ARTE)) {
      const o = await medirOclusao(readFileSync(`public${peca.arte!}`, "utf-8"));
      expect(conta(o.regiao), slug).toBeGreaterThan(0);
      expect(o.correcao, slug).toEqual({ escondeu: 0, mostrou: 0 });
    }
  }, 60_000);

  it("a construção alternativa continua empatando — 0 colunas divergindo", async () => {
    for (const [slug, peca] of Object.entries(CHAPEUS_DA_ARTE)) {
      const o = await medirOclusao(readFileSync(`public${peca.arte!}`, "utf-8"));
      // O dia em que isto deixar de ser 0, a peça nova tem enfeite pendurado com
      // vão acima — e aí a proposta da máquina precisa de olho antes de promover.
      expect(conferirOclusao(o), slug).toEqual({ colunas: 0, maiorEmU: 0 });
    }
  }, 60_000);

  it("VERDE esconde: a região cresce fora dela", async () => {
    const svg = svgDaPeca();
    const sem = await medirOclusao(svg);
    let x0 = -1;
    for (let x = 0; x < sem.w && x0 < 0; x++) if (sem.limite[x] >= 0) x0 = x;
    expect(x0).toBeGreaterThan(0);

    const com = await medirOclusao(svg, await pincelada(sem.w, sem.h, Math.max(0, x0 - 40), "verde"));
    expect(com.correcao.escondeu).toBeGreaterThan(0);
    expect(com.correcao.mostrou).toBe(0);
    expect(conta(com.regiao)).toBeGreaterThan(conta(sem.regiao));
  }, 30_000);

  it("VERMELHO mostra: a região encolhe dentro dela", async () => {
    const svg = svgDaPeca();
    const sem = await medirOclusao(svg);
    let x0 = -1;
    for (let x = 0; x < sem.w && x0 < 0; x++) if (sem.limite[x] >= 0) x0 = x;

    const com = await medirOclusao(svg, await pincelada(sem.w, sem.h, x0, "vermelho"));
    expect(com.correcao.mostrou).toBeGreaterThan(0);
    expect(com.correcao.escondeu).toBe(0);
    expect(conta(com.regiao)).toBeLessThan(conta(sem.regiao));
  }, 30_000);

  it("sem correção ≡ máquina, byte a byte — e é o que torna a mão reversível", async () => {
    const svg = svgDaPeca();
    const a = await medirOclusao(svg);
    const b = await medirOclusao(svg, undefined);
    expect(conta(b.regiao)).toBe(conta(a.regiao));
    expect(await linhaDeOclusao(b)).toBe(await linhaDeOclusao(a));
  }, 30_000);

  it("o traçado é determinístico — mesma região, mesmo `d`", async () => {
    const svg = svgDaPeca();
    const o = await medirOclusao(svg);
    expect(await linhaDeOclusao(o)).toBe(await linhaDeOclusao(o));
  }, 30_000);

  it("a mão MUDA o `d` que o catálogo receberia", async () => {
    const svg = svgDaPeca();
    const sem = await medirOclusao(svg);
    let x0 = -1;
    for (let x = 0; x < sem.w && x0 < 0; x++) if (sem.limite[x] >= 0) x0 = x;
    const com = await medirOclusao(svg, await pincelada(sem.w, sem.h, x0, "vermelho"));
    expect(await linhaDeOclusao(com)).not.toBe(await linhaDeOclusao(sem));
  }, 30_000);

  it("região vazia não declara o campo — ausente é o padrão histórico", async () => {
    const svg = svgDaPeca();
    const o = await medirOclusao(svg);
    o.regiao.fill(0);
    expect(await linhaDeOclusao(o)).toBeUndefined();
  }, 30_000);
});
