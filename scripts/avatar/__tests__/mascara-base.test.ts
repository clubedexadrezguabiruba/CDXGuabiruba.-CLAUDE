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
  erodir,
  faixa,
  intersecao,
  primeiraLinha,
  recortes,
  recortesFundoNaMao,
  recortesLegado,
  subtrair,
  ultimaLinha,
  unir,
  vaoEntreCorridas,
  vaos,
  type Dim,
  type Mascara,
  type MascarasBase,
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

/** As posições acesas, como "x,y" — para asserção legível sobre bitmap. */
const acesos = (m: Mascara, { w }: Dim): string[] => {
  const out: string[] = [];
  for (let p = 0; p < m.length; p++) if (m[p]) out.push(`${p % w},${(p / w) | 0}`);
  return out;
};

/**
 * Um BONECO SINTÉTICO, com a costura que causou o defeito.
 *
 * O que ele tem de ter, e por quê:
 *  - `peleFrente` SOBREPONDO o topo de `corpoVestido` — é a costura em que a pele
 *    encosta no macacão, o lugar exato onde nenhuma camada pintava;
 *  - um vão largo o bastante para sobreviver a `erodir(1)`, senão o teste do vão
 *    passaria por acidente, medindo uma máscara vazia contra outra vazia.
 */
const BONECO_W = 12;
const BONECO_H = 16;

/** Desenho de 12×16, completando as linhas que faltam com vazio. */
function plano(linhas: string[]): Mascara {
  const cheias = Array.from({ length: BONECO_H }, (_, y) => (linhas[y] ?? "").padEnd(BONECO_W, "."));
  return desenhar(cheias).m;
}

function boneco(): MascarasBase {
  return {
    w: BONECO_W,
    h: BONECO_H,
    k: 1,
    // O macacão: tronco cheio, com o vazio entre os braços no meio.
    corpoVestido: plano([
      "............",
      ".##########.",
      ".##########.",
      ".##########.",
      ".###....###.",
      ".###....###.",
      ".###....###.",
      ".###....###.",
      ".##########.",
      ".##########.",
      ".##########.",
    ]),
    // A COSTURA e a MÃO. `peleFrente` é o corpo nu INTEIRO: inclui o forro de
    // pele, que passa por baixo da gola (linha 2) e do punho (linha 5, e a coluna
    // 2 do braço). Sem essa sobreposição os testes não medem nada.
    peleFrente: plano([
      "...####.....", // 0  cabeça, livre
      "...####.....", // 1  cabeça sobre o ombro do macacão
      "...####.....", // 2  forro de pele POR BAIXO da gola
      "............",
      "............",
      "###.........", // 5  forro de pele POR BAIXO do punho
      "###.........", // 6  mão + forro
      "###.........", // 7
      "###.........", // 8
    ]),
    // A PELE PRÓPRIA — o que fica À MOSTRA. Duas regiões disjuntas e não vazias,
    // com vereditos OPOSTOS: aqui nenhuma camada pode pintar; na costura que
    // sobra (`peleFrente − peleExposta`) alguma camada TEM de pintar. Sem as
    // duas, o teste não distingue esta correção da reabertura dos 2851 px.
    peleExposta: plano([
      "...####.....", // 0
      "...####.....", // 1  cabeça À MOSTRA sobre o macacão
      "............", // 2  fica de fora: é forro, e vai coberto
      "............",
      "............",
      "............", // 5  idem
      "##..........", // 6  MÃO à mostra; a coluna 1 cai dentro de corpoVestido
      "##..........", // 7
      "##..........", // 8
    ]),
    // TETO, e generoso: folga em volta do corpo mais a faixa da bota, que desce
    // além do macacão. É a folga da bota que faz o pano ter mais área que o fundo.
    cobertura: plano([
      "############",
      "############",
      "############",
      "############",
      "#####..#####",
      "#####..#####",
      "#####..#####",
      "#####..#####",
      "############",
      "############",
      "############",
      "############",
      "############",
      "############",
      "############",
    ]),
    pes: plano(["", "", "", "", "", "", "", "", "", "", "", "", ".##......##.", ".##......##."]),
    // Largo o bastante para sobreviver a `erodir(1)`: um vão de 2 px de largura
    // erodiria a nada, e o teste passaria medindo vazio contra vazio.
    vaoAnatomico: plano(["", "", "", "", "....####....", "....####....", "....####....", "....####...."]),
    marcos: { topoTraje: 1, tornozelo: 10, yGola: 0, yBota: 12 },
  };
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
});

/**
 * `recortes()` CHAMADA DE VERDADE.
 *
 * O teste antigo daqui montava as duas máscaras à mão e nunca tocava na função:
 * ele provava que `subtrair` subtrai. A geometria compartilhada mudou duas vezes
 * nesta fase e a suíte inteira não teria pego nenhuma das duas.
 *
 * Cada invariante é medido nos DOIS recortes — o canônico e o de `6e3feb6`. É o
 * que transforma o teste em prova de que ele enxerga o defeito: se um dia os dois
 * derem o mesmo resultado, o teste reprova.
 */
describe("recortes() contra recortesLegado()", () => {
  const m = boneco();
  const dim: Dim = { w: m.w, h: m.h };
  /**
   * A COSTURA tem DUAS METADES, com vereditos opostos, e é isso que a correção
   * do fundo-sobre-a-mão introduziu:
   *
   *  - `coberta` — o FORRO de pele sob a gola e sob o punho. Região vestida por
   *    direito: alguma camada tem de pintar, senão volta o defeito de 2851 px;
   *  - `aMostra` — a MÃO e o rosto. Ninguém pode pintar: é o buraco de desenho.
   *
   * Um teste que meça só a costura inteira não distingue as duas, e por isso
   * passaria tanto na correção certa quanto na reabertura do defeito antigo.
   */
  const costura = intersecao(m.peleFrente, m.corpoVestido);
  const aMostra = intersecao(m.corpoVestido, m.peleExposta);
  const coberta = intersecao(m.corpoVestido, subtrair(m.peleFrente, m.peleExposta));

  it("a fixture tem as DUAS metades da costura, e o vão, senão nada abaixo mede nada", () => {
    expect(area(aMostra)).toBeGreaterThan(0);
    expect(area(coberta)).toBeGreaterThan(0);
    expect(area(intersecao(aMostra, coberta))).toBe(0); // disjuntas
    expect(area(erodir(m.vaoAnatomico, dim, 1))).toBeGreaterThan(0);
  });

  it("peleExposta é contida em peleFrente — a invariante da construção", () => {
    // Mesma rasterização, mesmo limiar, uma camada a menos visível: esconder
    // camada só pode clarear pixel. Se isto falhar, `silhueta` casou a classe
    // errada e todas as máscaras estão erradas junto.
    expect(area(subtrair(m.peleExposta, m.peleFrente))).toBe(0);
  });

  it("o fundo cobre a costura COBERTA e não toca a pele À MOSTRA", () => {
    const fundo = recortes(m).fundo;
    expect(area(intersecao(fundo, coberta))).toBe(area(coberta));
    expect(area(intersecao(fundo, aMostra))).toBe(0);
    // e o legado subtraía a costura inteira, as duas metades junto
    expect(area(intersecao(recortesLegado(m).fundo, costura))).toBe(0);
  });

  it("NINGUÉM pinta sobre a pele à mostra — e o recorte de 1403143 pinta", () => {
    const r = recortes(m);
    expect(area(intersecao(unir(r.pano, r.fundo), aMostra))).toBe(0);
    expect(area(intersecao(recortesFundoNaMao(m).fundo, aMostra))).toBeGreaterThan(0);
  });

  it("a costura coberta continua com uma camada pintando; no legado, NENHUMA", () => {
    // Os 2851 px não voltam. É a metade do argumento que a correção da mão
    // poderia ter quebrado, e o assert existe para provar que não quebrou.
    const r = recortes(m);
    const l = recortesLegado(m);
    expect(area(subtrair(coberta, unir(r.pano, r.fundo)))).toBe(0);
    expect(area(subtrair(coberta, unir(l.pano, l.fundo)))).toBe(area(coberta));
  });

  it("fora do vão E da pele à mostra, o fundo é corpoVestido dilatado em 1 px", () => {
    const util = (x: Mascara) => subtrair(subtrair(x, m.vaoAnatomico), m.peleExposta);
    expect(acesos(util(recortes(m).fundo), dim)).toEqual(
      acesos(util(dilatar(m.corpoVestido, dim, 1)), dim),
    );
  });

  it("os dois recortes excluem o vão anatômico — e o legado não exclui", () => {
    const r = recortes(m);
    // O pano exclui o vão inteiro; o fundo exclui o vão EROÍDO, e a assimetria é
    // deliberada: o que preenche é generoso em 1 px, o que testa é estrito em 1 px.
    expect(area(intersecao(r.pano, m.vaoAnatomico))).toBe(0);
    expect(area(intersecao(r.fundo, erodir(m.vaoAnatomico, dim, 1)))).toBe(0);
    expect(area(intersecao(recortesLegado(m).pano, m.vaoAnatomico))).toBeGreaterThan(0);
  });

  it("o pano tem mais ÁREA que o fundo, mas não o CONTÉM", () => {
    const { pano, fundo } = recortes(m);
    // É o invariante que o gerador confere — e é sobre área, não sobre contenção.
    expect(area(pano)).toBeGreaterThan(area(fundo));
    // Contenção estrita seria FALSA, e é o sinal de que a correção está lá: na
    // costura o fundo pinta e o pano não.
    expect(area(subtrair(fundo, pano))).toBeGreaterThan(0);
  });

  it("o legado não subtrai o vão da oclusão do pé; o canônico não traz oclusão", () => {
    // Era assim antes do `3745c4f`, e reproduzir metade do estado antigo não
    // reproduz o estado antigo.
    expect(recortesLegado(m).oclusao).toBeDefined();
    expect(area(intersecao(recortesLegado(m).oclusao!, m.cobertura))).toBe(
      area(recortesLegado(m).oclusao!),
    );
    expect(recortes(m)).not.toHaveProperty("oclusao");
  });
});

describe("erodir", () => {
  it("encolhe em todas as direções", () => {
    const { m, dim } = desenhar([
      ".......",
      ".#####.",
      ".#####.",
      ".#####.",
      ".#####.",
      ".#####.",
      ".......",
    ]);
    const e = erodir(m, dim, 1);
    expect(area(e)).toBe(9);
    expect(vaos(e, dim, 1)).toEqual([]);
    expect(vaos(e, dim, 3)).toEqual([[2, 4]]);
    expect(vaos(e, dim, 5)).toEqual([]);
  });

  it("NÃO encolhe onde a forma encosta na borda do bitmap", () => {
    // A borda do canvas não conta como "fora": ali o complemento é vazio, e não há
    // o que dilatar de volta para dentro. Inofensivo no uso real — o vão anatômico
    // mora entre braço e tronco e nunca toca a borda —, mas quem erodir uma
    // máscara colada na borda não verá encolhimento nenhum naquele lado.
    const { m, dim } = desenhar(["###", "###", "###"]);
    expect(area(erodir(m, dim, 1))).toBe(9);
  });

  it("desfaz a dilatação numa forma sem buraco", () => {
    const { m, dim } = desenhar([
      ".......",
      ".......",
      "..###..",
      "..###..",
      "..###..",
      ".......",
      ".......",
    ]);
    expect(acesos(erodir(dilatar(m, dim, 1), dim, 1), dim)).toEqual(acesos(m, dim));
  });

  it("some com forma mais fina que o raio", () => {
    // É por isso que o vão da fixture precisa ser largo: erodir um vão de 2 px
    // devolve vazio, e um teste contra vazio passa sem medir nada.
    const { m, dim } = desenhar([".....", ".....", ".###.", ".....", "....."]);
    expect(area(erodir(m, dim, 1))).toBe(0);
  });
});

describe("vaoEntreCorridas", () => {
  it("declara o vão pela topologia, e NÃO confunde o entalhe do pescoço", () => {
    // O defeito real da primeira versão: ela usava uma faixa de altura de 36% a
    // 62% e capturou o entalhe do pescoço, enquanto os resíduos moravam fora dela.
    const { m, dim } = desenhar([
      "..####..", // 0  cabeça — uma corrida
      "...##...", // 1  pescoço — UMA corrida, por mais estreito que seja
      "########", // 2  ombros — uma corrida
      "##.##.##", // 3  braço, tronco, braço — TRÊS corridas
      "##.##.##", // 4
      "..####..", // 5  quadril — uma corrida
      "..#..#..", // 6  duas pernas — duas corridas
    ]);
    const vao = vaoEntreCorridas(m, dim);

    // Só os espaços ENTRE corridas, e em nenhuma outra linha.
    expect(acesos(vao, dim)).toEqual(["2,3", "5,3", "2,4", "5,4", "3,6", "4,6"]);
    // O entalhe do pescoço é fundo da página, não vão anatômico.
    expect(vaos(vao, dim, 1)).toEqual([]);
    expect(vaos(vao, dim, 0)).toEqual([]);
  });

  it("silhueta sem buraco não produz vão nenhum", () => {
    const { m, dim } = desenhar(["####", "####", "####"]);
    expect(area(vaoEntreCorridas(m, dim))).toBe(0);
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
