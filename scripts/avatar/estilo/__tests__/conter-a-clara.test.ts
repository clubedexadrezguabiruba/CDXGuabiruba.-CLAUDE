/**
 * A CONTENÇÃO DA CLARA MEDE A CORDA, E A CORREÇÃO MEDIA O VÉRTICE.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, MEDIDO
 * ---------------------------------------------------------------------------
 *
 * `conterAClara` testava cada VÉRTICE da clara contra o laço da massa e empurrava
 * para dentro o que estivesse fora. `contencaoDaClara` mede o SEGMENTO: amostra 12
 * pontos por corda. As duas réguas discordam sempre que a borda da massa é côncava,
 * porque uma corda **corta o canto** que a borda faz.
 *
 * Medido na `curto-espetada`, importada da fonte declarada: os **64 vértices da clara
 * estavam todos dentro**, o pior com 0,46 u de folga — e uma única corda das 64, de
 * 29 unidades, passava 4,52 u por fora no meio do percurso. O gate lia −4,58 u, e
 * reprovaria `cabelo.test.ts` no dia em que o literal fosse colado no catálogo.
 *
 * A fixture daqui é a mesma topologia em forma mínima: um laço com um entalhe em V, e
 * uma clara cujos quatro vértices estão dentro e cuja corda atravessa o entalhe.
 *
 * ---------------------------------------------------------------------------
 * A RÉGUA DESTE ARQUIVO É PRÓPRIA, DE PROPÓSITO
 * ---------------------------------------------------------------------------
 *
 * `dentroPor` abaixo é escrita aqui em vez de importada. Medir a correção com a mesma
 * função que a correção usa por dentro provaria só que ela é consistente consigo
 * mesma — e o defeito que este arquivo guarda nasceu exatamente de duas réguas
 * discordando. Quem julga tem de ser independente de quem conserta.
 */

import { describe, expect, it } from "vitest";
import { autoIntersecoes, conterAClara } from "../tracar-cabelo";

type P = { x: number; y: number };

/** Distância COM SINAL de um ponto ao laço: positiva dentro, negativa fora. */
function dentroPor(laco: readonly P[], p: P): number {
  let bate = false;
  let perto = Infinity;
  for (let i = 0, j = laco.length - 1; i < laco.length; j = i++) {
    const a = laco[i];
    const b = laco[j];
    if (a.y > p.y !== b.y > p.y) {
      const x = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (p.x < x) bate = !bate;
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    perto = Math.min(perto, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return bate ? perto : -perto;
}

/** O menor `dentroPor` ao longo das CORDAS — a régua do gate. */
const aoLongoDasCordas = (laco: readonly P[], poli: readonly P[]) => {
  let menor = Infinity;
  const pts = [...poli, poli[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k <= 12; k++) {
      const p = {
        x: pts[i].x + ((pts[i + 1].x - pts[i].x) * k) / 12,
        y: pts[i].y + ((pts[i + 1].y - pts[i].y) * k) / 12,
      };
      menor = Math.min(menor, dentroPor(laco, p));
    }
  }
  return menor;
};

/** O menor `dentroPor` nos VÉRTICES — a régua que a correção antiga usava. */
const nosVertices = (laco: readonly P[], poli: readonly P[]) =>
  Math.min(...poli.map((p) => dentroPor(laco, p)));

/**
 * Um quadrado com um entalhe em V entrando pela direita, ápice em (50, 50).
 *
 * Na altura do ápice, tudo com `x > 50` está FORA — é o canto que a corda corta.
 */
const MASSA: P[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 40 },
  { x: 50, y: 50 },
  { x: 100, y: 60 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

/** Quatro vértices, todos dentro. A corda da direita passa por (60, 50), que não está. */
const CLARA: P[] = [
  { x: 60, y: 20 },
  { x: 60, y: 80 },
  { x: 20, y: 80 },
  { x: 20, y: 20 },
];

describe("a fixture reproduz o defeito antes de qualquer correção", () => {
  it("todos os vértices da clara estão DENTRO da massa", () => {
    // É esta linha que dá sentido ao teste seguinte: se um vértice estivesse fora, a
    // correção antiga já o pegaria e a fixture não estaria medindo o defeito certo.
    expect(nosVertices(MASSA, CLARA)).toBeGreaterThan(0);
  });

  it("e mesmo assim uma CORDA sai da massa — a discordância entre as duas réguas", () => {
    expect(aoLongoDasCordas(MASSA, CLARA)).toBeLessThan(0);
    // O ponto exato: o meio da corda da direita, na altura do ápice do entalhe.
    expect(dentroPor(MASSA, { x: 60, y: 50 })).toBeLessThan(0);
  });
});

describe("`conterAClara` fecha a corda", () => {
  const r = conterAClara(CLARA.map((p) => ({ ...p })), MASSA);

  it("devolve a clara inteira dentro da massa, medida ao longo das cordas", () => {
    expect(aoLongoDasCordas(MASSA, r.pts)).toBeGreaterThanOrEqual(0);
  });

  it("chega ao ponto fixo dentro do teto de passadas", () => {
    // `convergiu: false` é reprovação em `importarPeca`: teto estourado quer dizer
    // que a clara e a massa discordam de FORMA, e isso não é ruído de amostragem.
    expect(r.convergiu).toBe(true);
  });

  it("conserta transladando, e não inserindo ponto — a clara não ganha vértice", () => {
    // Partir a corda foi tentado e medido: levou o resíduo da `curto-espetada` de
    // −4,58 a −2,29 e produziu 1 auto-interseção na clara, porque o ponto inserido
    // nasce num canto côncavo e faz dois vértices consecutivos apontarem para lados
    // opostos. O `nonzero` do SVG vaza aquele trecho e sai um entalhe.
    expect(r.pts.length).toBe(CLARA.length);
  });

  it("conta as cordas que precisou mover, e não mexe em vértice que já estava dentro", () => {
    expect(r.cordas).toBeGreaterThan(0);
    expect(r.projetados).toBe(0);
  });

  it("não mexe numa clara que já estava contida — nem um ponto", () => {
    // A regressão da rota antiga em miniatura: sem corda vazando, a passada nova é
    // um laço que não faz nada, e é isso que mantém `--ida-e-volta-massa` idêntica.
    const folgada: P[] = [
      { x: 20, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 80 },
      { x: 20, y: 80 },
    ];
    const s = conterAClara(folgada.map((p) => ({ ...p })), MASSA);
    expect(s.pts).toEqual(folgada);
    expect(s.cordas).toBe(0);
    expect(s.projetados).toBe(0);
  });

  it("continua projetando o vértice que nasce fora — a correção antiga não se perdeu", () => {
    const vazando: P[] = [
      { x: 130, y: 20 }, // fora da massa pela direita
      { x: 40, y: 20 },
      { x: 40, y: 80 },
      { x: 20, y: 80 },
    ];
    const s = conterAClara(vazando.map((p) => ({ ...p })), MASSA);
    expect(s.projetados).toBe(1);
    expect(aoLongoDasCordas(MASSA, s.pts)).toBeGreaterThanOrEqual(0);
  });
});

/**
 * ---------------------------------------------------------------------------
 * A TRANSLAÇÃO DE CORDA DOBRA O LAÇO — o defeito que substituiu o que ela consertou
 * ---------------------------------------------------------------------------
 *
 * O docstring de `conterAClara` **recusa** partir a corda por um motivo nomeado: a
 * tentativa *"produziu 1 auto-interseção na clara"*, e a auto-interseção é o pior dos
 * dois defeitos porque o `nonzero` do SVG vaza o trecho entre o cruzamento e a ponta.
 * A alternativa que ficou no lugar — transladar a corda inteira — nunca foi medida
 * contra essa mesma régua.
 *
 * Ela dobra igual, e dobra na topologia que este pipeline existe para importar. Numa
 * massa de **pente** — torres separadas por vãos fundos, que é o que cabelo espetado
 * é — cada corda da clara viola um vão diferente. Um vértice pertence a duas cordas,
 * e a passada guarda só o MAIOR dos dois deslocamentos: o vizinho anda para um lado, o
 * seguinte para o outro, e os dois segmentos trocam de ordem.
 *
 * **A grade foi varrida antes de a fixture ser escolhida**, para o número não ser uma
 * coincidência de um parâmetro: 4 contagens de torre × 4 profundidades × 3 larguras de
 * vão × 4 tamanhos de clara × 3 alturas = 576 combinações, e **101 delas dobram**. A
 * escolhida abaixo é a mais limpa das 101 — `projetados: 0`, ou seja **todos os
 * vértices já nascem dentro da massa**, e a dobra é inteiramente da translação.
 *
 * Medido na `curto-espetada` pelo M4, que é o mapeamento que sobe a peça acima da
 * coroa: o laço da clara sai da decimação com **0** auto-interseções em todos os N da
 * escala (8 a 64), e sai de `conterAClara` com **11** em N = 40 e N = 48.
 */
describe("a contenção nunca devolve um laço mais cruzado do que recebeu", () => {
  /** Massa em pente: `n` torres de altura total, separadas por vãos até `fundo`. */
  function pente(n: number, fundo: number, vao: number): P[] {
    const L = 300;
    const passo = L / n;
    const pts: P[] = [{ x: 0, y: 0 }];
    for (let k = 0; k < n; k++) {
      const c = passo * (k + 0.5);
      pts.push({ x: c - vao / 2, y: 0 }, { x: c, y: fundo }, { x: c + vao / 2, y: 0 });
    }
    pts.push({ x: L, y: 0 }, { x: L, y: 200 }, { x: 0, y: 200 });
    return pts;
  }

  /** Clara: uma faixa retangular de `m` vértices por lado, atravessando os vãos. */
  function faixa(m: number, yCima: number, yBaixo: number): P[] {
    const a = 20;
    const b = 280;
    const x = (k: number) => a + ((b - a) * k) / (m - 1);
    return [
      ...Array.from({ length: m }, (_, k) => ({ x: x(k), y: yCima })),
      ...Array.from({ length: m }, (_, k) => ({ x: x(m - 1 - k), y: yBaixo })),
    ];
  }

  const PENTE = pente(5, 100, 20);
  const FAIXA = faixa(6, 10, 70);

  it("a fixture nasce simples, e todos os vértices dela já estão DENTRO da massa", () => {
    // As duas linhas são o que dá sentido ao teste seguinte. Sem a primeira, a dobra
    // poderia ser a que já existia; sem a segunda, seria a projeção de vértice, e não
    // a translação de corda, que é o passo em julgamento.
    expect(autoIntersecoes(FAIXA)).toHaveLength(0);
    expect(nosVertices(PENTE, FAIXA)).toBeGreaterThan(0);
  });

  it("e mesmo assim as CORDAS dela vazam pelos vãos do pente", () => {
    expect(aoLongoDasCordas(PENTE, FAIXA)).toBeLessThan(0);
  });

  it("a contenção não introduz auto-interseção nenhuma", () => {
    const r = conterAClara(FAIXA.map((p) => ({ ...p })), PENTE);
    expect(autoIntersecoes(r.pts)).toHaveLength(0);
  });

  /**
   * O PREÇO DA GUARDA, DECLARADO — ela para, e a parada tem nome.
   *
   * Quando a única forma de fechar a corda seria dobrar o laço, a contenção devolve o
   * último estado simples e `convergiu: false`. Isso **reprova** em `importarPeca`, que
   * é o comportamento certo: uma clara que só entra na massa dobrando não é ruído de
   * amostragem, é a clara e a massa discordando de forma. O que não se pode é entregar
   * a dobra calada.
   */
  it("declara a parada em vez de entregar a dobra calada", () => {
    const r = conterAClara(FAIXA.map((p) => ({ ...p })), PENTE);
    expect(r.convergiu).toBe(false);
    expect(r.pts).toHaveLength(FAIXA.length);
  });
});
