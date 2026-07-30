/**
 * A geometria das máscaras, testada sem navegador.
 *
 * A derivação precisa rasterizar a base e por isso não cabe num teste de
 * unidade. O que cabe — e é onde os defeitos moraram — são as operações de
 * bitmap: contar vãos por linha, dilatar dentro de uma faixa, e subtrair. Os dois
 * defeitos que custaram rodada nesta fase foram exatamente disto:
 *
 *  - tratar uma linha de braço como UM vão quando ela tem TRÊS;
 *  - usar a MESMA máscara para o pano e para o fundo de segurança.
 */

import { describe, expect, it } from "vitest";
import {
  area,
  dilatar,
  faixa,
  primeiraLinha,
  subtrair,
  ultimaLinha,
  unir,
  vaos,
  type Dim,
  type Mascara,
} from "../mascara-base";

/** Constrói uma máscara a partir de um desenho em texto. `#` acende. */
function desenhar(linhas: string[]): { m: Mascara; dim: Dim } {
  const h = linhas.length;
  const w = Math.max(...linhas.map((l) => l.length));
  const m = new Uint8Array(w * h);
  linhas.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) if (linha[x] === "#") m[y * w + x] = 1;
  });
  return { m, dim: { w, h } };
}

describe("vãos por linha", () => {
  it("acha os TRÊS vãos de uma linha de braço", () => {
    // braço, tronco, braço — o caso que a primeira deformação errou
    const { m, dim } = desenhar(["##...####...##"]);
    expect(vaos(m, dim, 0)).toEqual([
      [0, 1],
      [5, 8],
      [12, 13],
    ]);
  });

  it("fecha o vão que toca a borda direita", () => {
    const { m, dim } = desenhar(["..####"]);
    expect(vaos(m, dim, 0)).toEqual([[2, 5]]);
  });

  it("linha vazia não tem vão", () => {
    const { m, dim } = desenhar(["....", "####"]);
    expect(vaos(m, dim, 0)).toEqual([]);
  });
});

describe("dilatação", () => {
  it("cresce em todas as direções", () => {
    const { m, dim } = desenhar([".....", ".....", "..#..", ".....", "....."]);
    const d = dilatar(m, dim, 1);
    expect(area(d)).toBe(9);
    expect(vaos(d, dim, 1)).toEqual([[1, 3]]);
    expect(vaos(d, dim, 3)).toEqual([[1, 3]]);
  });

  it("`so` limita a dilatação a certas linhas, e fora delas apenas copia", () => {
    // É como a folga da bota fica presa à faixa do pé em vez de engordar o corpo.
    const { m, dim } = desenhar(["..#..", "..#..", "..#.."]);
    const d = dilatar(m, dim, 1, (y) => y === 2);
    expect(vaos(d, dim, 0)).toEqual([[2, 2]]);
    expect(vaos(d, dim, 1)).toEqual([[1, 3]]); // alcançada pela linha 2
    expect(vaos(d, dim, 2)).toEqual([[1, 3]]);
  });

  it("fecha um vão estreito — é por isso que a máscara é TETO, não piso", () => {
    // Medido na base: o vão entre braço e tronco tem menos de 44 unidades, então
    // qualquer folga razoável o fecha. Isso é inofensivo numa máscara de teto,
    // porque quem decide se o vão existe é o desenho do uniforme. Seria um
    // defeito se a máscara fosse usada para PINTAR.
    const { m, dim } = desenhar(["##..##"]);
    expect(vaos(m, dim, 0)).toHaveLength(2);
    expect(vaos(dilatar(m, dim, 1), dim, 0)).toHaveLength(1);
  });
});

describe("faixa", () => {
  it("mantém só as linhas pedidas", () => {
    const { m, dim } = desenhar(["###", "###", "###"]);
    const f = faixa(m, dim, 1, 1);
    expect(vaos(f, dim, 0)).toEqual([]);
    expect(vaos(f, dim, 1)).toEqual([[0, 2]]);
    expect(vaos(f, dim, 2)).toEqual([]);
  });

  it("tolera limites fora do bitmap", () => {
    const { m, dim } = desenhar(["##", "##"]);
    expect(area(faixa(m, dim, -5, 99))).toBe(4);
  });
});

describe("as duas máscaras de recorte", () => {
  it("subtrair remove a região da pele", () => {
    const corpo = desenhar(["####"]);
    const pele = desenhar(["..##"]);
    expect(vaos(subtrair(corpo.m, pele.m), corpo.dim, 0)).toEqual([[0, 1]]);
  });

  it("pano e fundo NÃO podem ser a mesma máscara", () => {
    // O defeito do pedestal verde: com uma máscara só, o fundo de segurança
    // escorre para a folga da bota, onde não há pano por cima para cobri-lo.
    const corpoVestido = desenhar([
      "..##..",
      "..##..",
      "......", // a folga da bota mora aqui, e o corpo vestido NÃO chega nela
    ]);
    const cobertura = desenhar([
      "..##..",
      "..##..",
      ".####.", // o pano PODE ir até aqui
    ]);
    const semPele = new Uint8Array(corpoVestido.m.length);
    const pano = subtrair(cobertura.m, semPele);
    const fundo = subtrair(corpoVestido.m, semPele);

    // O pano alcança a faixa da bota; o fundo, não. É o invariante inteiro.
    expect(vaos(pano, cobertura.dim, 2)).toEqual([[1, 4]]);
    expect(vaos(fundo, corpoVestido.dim, 2)).toEqual([]);
    expect(area(pano)).toBeGreaterThan(area(fundo));
  });
});

describe("primeira e última linha", () => {
  it("acham o topo e a base do desenho", () => {
    const { m, dim } = desenhar(["....", "..#.", "###.", "...."]);
    expect(primeiraLinha(m, dim)).toBe(1);
    expect(ultimaLinha(m, dim)).toBe(2);
  });

  it("devolvem -1 para máscara vazia", () => {
    const { m, dim } = desenhar(["..", ".."]);
    expect(primeiraLinha(m, dim)).toBe(-1);
    expect(ultimaLinha(m, dim)).toBe(-1);
  });
});

describe("unir", () => {
  it("soma as duas", () => {
    const a = desenhar(["##.."]);
    const b = desenhar(["..##"]);
    expect(vaos(unir(a.m, b.m), a.dim, 0)).toEqual([[0, 3]]);
  });
});
