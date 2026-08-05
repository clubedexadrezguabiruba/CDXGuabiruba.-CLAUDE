/**
 * O TETO DA COROA, CALIBRADO EM FIXTURE SINTÉTICA — nunca na `curto-espetada`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------------------------------------------------------
 *
 * `coberturaDaCoroa` é exigida em **1,000**, e esse número nunca foi medido: ele é o
 * que os cinco cabelos paramétricos do catálogo devolvem **por construção**.
 * `poligonoDaTouca` fecha uma peça de `pontos` — curva ABERTA — com dois cantos 60
 * unidades acima do crânio, e aí todo ponto da coroa cai dentro do polígono sem que
 * a forma tenha sido olhada.
 *
 * Uma peça de `massa` — laço FECHADO, que é o que a importação de arte produz — não
 * tem essa folga: o polígono é a silhueta do cabelo, e onde o cabelo tem entalhe o
 * crânio aparece. Medido na `curto-espetada`, a **própria arte** cobre 0,852 da coroa
 * dela. Exigir 1,000 de um laço fechado traçado de arte espetada é exigir um cabelo
 * sem bico.
 *
 * ---------------------------------------------------------------------------
 * UM NÚMERO SÓ NÃO SEPARA OS DOIS DEFEITOS
 * ---------------------------------------------------------------------------
 *
 *  - **o entalhe** — corrida curta e funda entre dois bicos. É como cabelo espetado
 *    lê, e é a arte funcionando;
 *  - **o aro** — couro cabeludo em volta da coroa inteira, porque a touca ficou
 *    pequena. É o defeito de verdade, e foi ele que o gate nasceu para pegar.
 *
 * Então o teto é um **par**: a cobertura, e a fração do perímetro da coroa que o
 * **arco de falha mais comprido** ocupa. Aro é arco comprido; entalhe é arco curto,
 * por mais fundo que seja.
 *
 * ---------------------------------------------------------------------------
 * A TABELA MEDIDA, E É DELA QUE OS DOIS NÚMEROS SAEM
 * ---------------------------------------------------------------------------
 *
 * Perímetro da coroa: 458 unidades. O defeito de cada fixture é conhecido **antes**
 * de ser medido — é o que a torna capaz de calibrar.
 *
 * | fixture | cobertura | fração do pior arco |
 * |---|---|---|
 * | touca cheia | **1,000** | **0,000** |
 * | 3 entalhes de 12 u | 0,983 | 0,017 |
 * | 12 entalhes de 24 u | 0,900 | 0,017 |
 * | 6 entalhes de 24 u | 0,930 | 0,022 |
 * | 3 entalhes de 24 u | 0,961 | 0,035 |
 * | 6 entalhes de 48 u | 0,825 | 0,048 |
 * | **3 entalhes de 48 u** | **0,838** | **0,074**  ← o pior entalhe |
 * | **aro de 6 u** | **0,598** | **0,402**  ← o menor aro |
 * | aro de 12 u | 0,445 | 0,555 |
 * | aro de 24 u | 0,306 | 0,642 |
 * | aro de 48 u | 0,140 | 0,725 |
 *
 * As duas famílias **não se cruzam em nenhum dos dois eixos**:
 *
 *  - fração do arco: entalhe até 0,074 · aro a partir de 0,402 — **5,4× de vão**;
 *  - cobertura: entalhe a partir de 0,825 · aro até 0,598 — 0,23 de vão.
 *
 * `FRACAO_DE_ARCO = 0,20` e `PISO_DE_COBERTURA = 0,70` ficam no meio dos dois vãos,
 * a fatores de 2,7 e 2,0 de cada família. Não são números afinados: são a faixa
 * inteira entre "alguns bicos" e "a touca é pequena".
 *
 * ---------------------------------------------------------------------------
 * O QUE A `curto-espetada` TIRA NESTA RÉGUA — e por que ela ainda reprova
 * ---------------------------------------------------------------------------
 *
 * | | cobertura | fração do arco | veredito |
 * |---|---|---|---|
 * | a ARTE contra a cabeça DELA | 0,852 | — | família **entalhe** |
 * | a peça importada (M1M2, densa) | 0,520 | 0,218 | **entre as duas famílias** |
 *
 * O teto medido **não absolve a peça** — e é justamente por isso que ele vale: a arte
 * passa e a peça não, então o que reprova é a **transferência**, e não a arte. Um
 * teto escolhido para deixar a peça passar teria escondido exatamente isso.
 */

import { describe, expect, it } from "vitest";
import type { Cabelo } from "../../../../src/lib/avatar/estilo/cabelo";
import { CAIXA_CABECA, TRACO, bordasEm } from "../../../../src/lib/avatar/estilo/geometria";
import { FRACAO_DE_ARCO, PISO_DE_COBERTURA, ondeACoroaFalha } from "../mapear";

/**
 * `{t, y}` NÃO SABE FALAR ACIMA DO CRÂNIO — e a fixture teve de aprender isso.
 *
 * `bordasEm(CAIXA_CABECA.y0)` devolve largura **zero**: o topo do crânio é um ponto.
 * Uma fixture com vértice ali divide por zero e o polígono some. Acima de `y0`,
 * porém, `bordasEm` cai para a caixa da cabeça (largura 364), e ali a coordenada
 * absoluta volta a ser expressável. Por isso o topo de toda fixture fica em
 * `y0 − FORA`, e o fundo em 200 — nunca em `y1`, que também tem largura zero.
 */
const emT = (x: number, y: number) => {
  const { esq, dir } = bordasEm(y);
  return { t: (x - esq) / (dir - esq), y };
};

const X0 = CAIXA_CABECA.x0;
const X1 = CAIXA_CABECA.x1;
const Y0 = CAIXA_CABECA.y0;
const FORA = 40;
const FUNDO = 200;

/** A touca cheia: cobre a coroa inteira com folga nos três lados. */
function toucaCheia(): Cabelo {
  return {
    id: "curto",
    nome: "cheia",
    massa: [
      emT(X0 - FORA, Y0 - FORA),
      emT(X1 + FORA, Y0 - FORA),
      emT(X1 + FORA, FUNDO),
      emT(X0 - FORA, FUNDO),
    ],
  };
}

/** O ARO: a mesma touca com o topo `d` unidades mais baixo — a touca pequena demais. */
function toucaComAro(d: number): Cabelo {
  return {
    id: "curto",
    nome: `aro-${d}`,
    massa: [
      emT(X0 - FORA, Y0 + d),
      emT(X1 + FORA, Y0 + d),
      emT(X1 + FORA, FUNDO),
      emT(X0 - FORA, FUNDO),
    ],
  };
}

/** OS ENTALHES: a touca cheia com `n` cortes em V de profundidade `d` e largura `larg`. */
function toucaComEntalhes(n: number, d: number, larg: number): Cabelo {
  const a = X0 - FORA;
  const b = X1 + FORA;
  const passo = (b - a) / n;
  const topo = [emT(a, Y0 - FORA)];
  for (let k = 0; k < n; k++) {
    const c = a + passo * (k + 0.5);
    topo.push(emT(c - larg / 2, Y0 - FORA), emT(c, Y0 + d), emT(c + larg / 2, Y0 - FORA));
  }
  topo.push(emT(b, Y0 - FORA));
  return {
    id: "curto",
    nome: `entalhes-${n}x${d}`,
    massa: [...topo, emT(b, FUNDO), emT(a, FUNDO)],
  };
}

const medir = (c: Cabelo) => {
  const d = ondeACoroaFalha(c);
  return {
    cobertura: d.dentro / d.total,
    fracaoDoArco: d.piorArco / d.perimetro,
    arcos: d.arcos.length,
  };
};

/** Os entalhes que a fixture sabe construir, do mais raso ao mais fundo. */
const ENTALHES: [number, number, number][] = [
  [3, TRACO, 40],
  [3, 2 * TRACO, 40],
  [6, 2 * TRACO, 28],
  [12, 2 * TRACO, 20],
  [6, 4 * TRACO, 40],
  [3, 4 * TRACO, 60],
];

/** Os aros, do menor ao maior. Meio traço é o menor defeito que o produto desenha. */
const AROS = [TRACO / 2, TRACO, 2 * TRACO, 4 * TRACO];

describe("o teto da coroa sai da fixture, e a fixture separa entalhe de aro", () => {
  it("a touca CHEIA cobre a coroa inteira — o piso do método é zero, não um resíduo", () => {
    const m = medir(toucaCheia());
    expect(m.cobertura).toBe(1);
    expect(m.fracaoDoArco).toBe(0);
    expect(m.arcos).toBe(0);
  });

  it.each(AROS)("o ARO de %i u reprova pelos DOIS números", (d) => {
    const m = medir(toucaComAro(d));
    expect(m.cobertura).toBeLessThan(PISO_DE_COBERTURA);
    expect(m.fracaoDoArco).toBeGreaterThan(FRACAO_DE_ARCO);
  });

  it.each(ENTALHES)("o ENTALHE %ix%i u passa pelos DOIS números", (n, d, larg) => {
    const m = medir(toucaComEntalhes(n, d, larg));
    expect(m.cobertura).toBeGreaterThan(PISO_DE_COBERTURA);
    expect(m.fracaoDoArco).toBeLessThan(FRACAO_DE_ARCO);
    // E o defeito CHEGOU a acontecer: uma fixture que não produz falha nenhuma não
    // calibra nada — ela só provaria que a régua está cega.
    expect(m.arcos).toBeGreaterThanOrEqual(1);
  });

  /**
   * O VÃO ENTRE AS DUAS FAMÍLIAS — é ele que autoriza o teto, e não o teto que
   * autoriza o vão.
   *
   * Um teto entre duas famílias que quase se encostam é afinação disfarçada de
   * medida. Este teste exige **fator 2** de folga para cada lado, nos dois eixos, e
   * quebra no dia em que uma fixture nova aproximar as famílias — que é o dia em que
   * o teto precisa ser repensado, e não silenciosamente mantido.
   */
  it("as duas famílias não se cruzam, e o teto tem fator 2 de folga para cada lado", () => {
    const ent = ENTALHES.map(([n, d, l]) => medir(toucaComEntalhes(n, d, l)));
    const aro = AROS.map((d) => medir(toucaComAro(d)));

    const piorEntalheArco = Math.max(...ent.map((m) => m.fracaoDoArco));
    const melhorAroArco = Math.min(...aro.map((m) => m.fracaoDoArco));
    expect(piorEntalheArco * 2).toBeLessThan(FRACAO_DE_ARCO);
    expect(melhorAroArco).toBeGreaterThan(FRACAO_DE_ARCO * 2);

    const piorEntalheCob = Math.min(...ent.map((m) => m.cobertura));
    const melhorAroCob = Math.max(...aro.map((m) => m.cobertura));
    expect(piorEntalheCob).toBeGreaterThan(PISO_DE_COBERTURA);
    expect(melhorAroCob).toBeLessThan(PISO_DE_COBERTURA);
  });
});
