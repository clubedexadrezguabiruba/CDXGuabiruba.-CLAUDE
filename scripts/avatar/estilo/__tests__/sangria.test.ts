/**
 * A SANGRIA NÃO PODE DOBRAR O LAÇO — o gate que a `ida e volta` é incapaz de fazer.
 *
 * `idaEVoltaMassa()` já exige zero auto-interseções, e passava com o defeito presente
 * pelo motivo mais comum de todos: ela traça o `curto` do catálogo, e o `curto` tem
 * **0% de colunas com cortina**. Um gate que só olha uma peça sem língua nunca vê o
 * defeito das línguas. Verde por vacuidade.
 *
 * O defeito medido na `curto-espetada`: a cortina da esquerda tem ~10 unidades de
 * largura e atravessa a linha do crânio — um flanco a 1 u para DENTRO, o outro a 9 u
 * para FORA. `sangrarNaSilhueta` empurrava cada ponto até `SANGRIA` = 10 unidades
 * para fora, um de cada vez, sem saber que o laço tem outro lado: o flanco de dentro
 * andava 11,5 e pousava do outro lado do flanco de fora. O laço dobrava, o `nonzero`
 * do SVG esvaziava tudo entre os dois cruzamentos, e a cortina sumia de `y` 88 para
 * baixo numa coluna em que a arte desce até 268.
 *
 * O teste é a mesma língua, construída em cima do contorno de verdade e sem arte
 * nenhuma — nada em `.scratch/` entra aqui, senão o gate não roda no CI.
 */

import { describe, expect, it } from "vitest";
import { CABECA, CAIXA_CABECA, SANGRIA, TRACO } from "../../../../src/lib/avatar/estilo/geometria";

const MEIO_TRACO = TRACO / 2;
import { autoIntersecoes, sangrarNaSilhueta } from "../tracar-cabelo";

type P = { x: number; y: number };

const cx = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
const cy = (CAIXA_CABECA.y0 + CAIXA_CABECA.y1) / 2;

/** A distância do ponto ao contorno do crânio, e o quanto ele está para FORA dele. */
function contra(p: P): { dist: number; fora: number } {
  const c = CABECA.contorno;
  let melhor = { x: p.x, y: p.y };
  let dist = Infinity;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const a = c[i];
    const b = c[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < dist) {
      dist = d;
      melhor = q;
    }
  }
  const rx = melhor.x - cx;
  const ry = melhor.y - cy;
  const comp = Math.hypot(rx, ry) || 1;
  return { dist, fora: ((p.x - melhor.x) * rx + (p.y - melhor.y) * ry) / comp };
}

/**
 * UMA CORTINA: laço fechado, fino, descendo ao lado do rosto e voltando a subir.
 *
 * `largura` é a largura TOTAL da língua. Com 10 ela é mais estreita que duas
 * sangrias, que é a condição do defeito; com 40 ela é larga e serve de controle.
 */
function cortina(xCentro: number, yTopo: number, yPonta: number, largura: number): P[] {
  const meia = largura / 2;
  const passo = 1;
  const desce: P[] = [];
  const sobe: P[] = [];
  for (let y = yTopo; y <= yPonta; y += passo) {
    desce.push({ x: xCentro + meia, y });
    sobe.push({ x: xCentro - meia, y });
  }
  // A ponta arredondada, para o laço fechar sem quina de 180°. Os dois extremos do
  // arco ficam de fora: eles repetiriam o último ponto de `desce` e o primeiro de
  // `sobe`, e ponto repetido é segmento de comprimento zero — que `autoIntersecoes`
  // conta como cruzamento sem que nada esteja dobrado.
  const ponta: P[] = [];
  for (let a = 1; a < 8; a++) {
    const th = (Math.PI * a) / 8;
    ponta.push({ x: xCentro + meia * Math.cos(th), y: yPonta + meia * Math.sin(th) });
  }
  return [...desce, ...ponta, ...sobe.reverse()];
}

describe("sangrarNaSilhueta não pode dobrar o laço sobre si mesmo", () => {
  // x 78 é a coluna que o `--onde` aponta como a pior da `curto-espetada`; y 200–268
  // é o trecho em que a arte desce e o render parava.
  const fina = cortina(78, 200, 268, 10);

  it("a língua do teste de fato atravessa a linha do crânio", () => {
    // ANTI-VACUIDADE: sem isto o teste passaria contra uma língua que a sangria nem
    // toca, e um gate que não exercita o defeito é um gate que aprova qualquer coisa.
    const s = fina.map(contra);
    expect(s.filter((v) => v.dist <= MEIO_TRACO).length).toBeGreaterThan(10);
    expect(s.filter((v) => v.fora < 0).length).toBeGreaterThan(10);
    expect(s.filter((v) => v.fora > 0).length).toBeGreaterThan(10);
  });

  it("o laço entra sem se cruzar", () => {
    expect(autoIntersecoes(fina)).toHaveLength(0);
  });

  it("e sai sem se cruzar", () => {
    // ESTE é o gate. Antes do conserto: 100 auto-interseções.
    const { pts } = sangrarNaSilhueta(fina);
    expect(autoIntersecoes(pts)).toHaveLength(0);
  });

  it("nenhum ponto anda mais que a sangria", () => {
    // O teletransporte para a projeção andava MAIS que `SANGRIA` — 15,7 u medidos na
    // `curto-espetada` — porque jogava fora a coordenada tangencial do ponto.
    const { pts } = sangrarNaSilhueta(fina);
    const andou = pts.map((p, i) => Math.hypot(p.x - fina[i].x, p.y - fina[i].y));
    expect(Math.max(...andou)).toBeLessThanOrEqual(SANGRIA + 1e-9);
  });

  it("numa língua estreita o teto trava, e ele é IMPRESSO", () => {
    // Travar é a escolha certa e é uma perda declarada: sobra fresta onde não cabia
    // sangria. O número precisa sair, senão a peça entrega a fresta em silêncio.
    const { travados } = sangrarNaSilhueta(fina);
    expect(travados).toBeGreaterThan(0);
  });

  it("numa mecha larga o teto não morde: a sangria sai inteira", () => {
    const larga = cortina(78, 200, 268, 40);
    const { pts, travados, quantos } = sangrarNaSilhueta(larga);
    expect(quantos).toBeGreaterThan(0);
    expect(travados).toBe(0);
    expect(autoIntersecoes(pts)).toHaveLength(0);
    /**
     * E ela cumpriu o CONTRATO: quem estava DENTRO da faixa acabou do lado de fora.
     *
     * A régua é "quem estava na faixa", e não "quem se mexeu", porque o empurrão virou
     * um CAMPO suavizado ao longo do laço (ver `sangrarNaSilhueta`): um vizinho logo
     * fora da faixa recebe hoje uma fração do empurrão, de propósito — é essa fração
     * que substitui o degrau de 16 unidades por uma rampa. Exigir dele o contrato de
     * quem estava dentro seria exigir que a rampa não existisse.
     *
     * Nesta língua **um** ponto cai na faixa, e por isso o contrato de chegar além de
     * meio traço para fora não se mede aqui: uma faixa de um ponto só é diluída pelos
     * vizinhos que não pedem nada. Quem mede aquele contrato é a borda RENTE abaixo,
     * onde a faixa é longa — que é a geometria em que ele importa.
     */
    const naFaixa = larga.map((p, i) => i).filter((i) => contra(larga[i]).dist <= MEIO_TRACO);
    expect(naFaixa.length).toBeGreaterThan(0);
    for (const i of naFaixa) expect(contra(pts[i]).fora).toBeGreaterThan(0);
  });
});

/**
 * A BORDA RENTE — a geometria em que a decisão POR PONTO virava um pente de dentes.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, MEDIDO
 * ---------------------------------------------------------------------------
 *
 * No alto da cabeça o cabelo da arte **é** a silhueta, então a borda da peça corre
 * paralela ao contorno do crânio, a poucas unidades dele. O traçado denso tem passo de
 * ~0,4 u e uma serrilha de sub-unidade herdada do pixel. Contra um limiar duro
 * (`dist > MEIO_TRACO`), essa serrilha atravessa a faixa para os dois lados de um
 * ponto para o outro: um pede o empurrão inteiro, o vizinho a 0,4 u não pede nada, e
 * os dois saem a `SANGRIA + MEIO_TRACO` = 16 unidades um do outro.
 *
 * Medido nesta fixture, com o laço de entrada tendo passo máximo de 0,87 u:
 *
 * | | maior salto entre vizinhos, depois da sangria |
 * |---|---|
 * | decisão por ponto | **16,31 u** |
 * | campo suavizado | **1,14 u** |
 *
 * E o estrago não parava no laço denso: `decimarPorCorda` remove o ponto que custa
 * menos, então um dente de 16 u é a coisa mais CARA de remover e sobrevive até o fim.
 * Na `curto-espetada`, 8 dos 48 vértices iam para um zigue-zague de 1,8 u de largura e
 * a cúpula direita inteira ficava sem vértice — `coberturaDaCoroa` caía de 0,865 no
 * laço denso para 0,742 na peça.
 *
 * A fixture é construída em cima do contorno de verdade e sem arte nenhuma, pelo mesmo
 * motivo da cortina acima: nada em `.scratch/` entra aqui, senão o gate não roda no CI.
 */
describe("a sangria responde em rampa, e não em degrau", () => {
  /**
   * O contorno do crânio reamostrado fino e recuado `recuo` para dentro, com serrilha
   * de `jitter` alternando de ponto para ponto. O laço fecha 60 unidades mais para
   * dentro, longe do contorno — a volta não pode pedir sangria nenhuma.
   */
  function bordaRente(recuo: number, jitter: number): P[] {
    const c = CABECA.contorno;
    const limite = CAIXA_CABECA.y0 + 0.45 * CAIXA_CABECA.alt;
    const paraDentro = (p: P, quanto: number) => {
      const rx = p.x - cx;
      const ry = p.y - cy;
      const comp = Math.hypot(rx, ry) || 1;
      return { x: p.x - (rx / comp) * quanto, y: p.y - (ry / comp) * quanto };
    };

    const alto: P[] = [];
    for (let i = 0; i < c.length; i++) {
      const a = c[i];
      const b = c[(i + 1) % c.length];
      const passos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.4));
      for (let k = 0; k < passos; k++) {
        const p = { x: a.x + ((b.x - a.x) * k) / passos, y: a.y + ((b.y - a.y) * k) / passos };
        if (p.y > limite) continue;
        alto.push(paraDentro(p, recuo + (alto.length % 2 === 0 ? jitter : -jitter)));
      }
    }
    // O contorno não começa numa ponta do arco de cima, então o trecho acima do limite
    // sai em dois pedaços; remontar por ângulo em torno do centro devolve o arco
    // contíguo, que é o que um laço de peça é.
    alto.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    const volta = [...alto].reverse().map((p) => paraDentro(p, 60));
    return [...alto, ...volta];
  }

  /** O maior salto entre vizinhos no ARCO de cima — as duas emendas do laço ficam fora. */
  const saltoNoArco = (v: P[]) =>
    Math.max(
      ...v.slice(0, v.length / 2 - 1).map((p, i) => Math.hypot(p.x - v[i + 1].x, p.y - v[i + 1].y)),
    );

  const serrilhada = bordaRente(MEIO_TRACO, 0.3);

  it("a fixture de fato serrilha em cima do limiar", () => {
    // ANTI-VACUIDADE, e ela tem três pernas: o laço entra LISO (senão o salto de saída
    // não é da sangria), e os dois lados do limiar são exercitados (senão não há
    // degrau nenhum a espalhar).
    const arco = serrilhada.slice(0, serrilhada.length / 2);
    expect(saltoNoArco(serrilhada)).toBeLessThan(1);
    const dentro = arco.filter((p) => contra(p).dist <= MEIO_TRACO).length;
    expect(dentro).toBeGreaterThan(100);
    expect(arco.length - dentro).toBeGreaterThan(100);
  });

  it("vizinhos rentes ao contorno não saem a um degrau de distância", () => {
    // ESTE é o gate. Pela decisão por ponto: 16,31 u — e `SANGRIA + MEIO_TRACO` é 16.
    const { pts } = sangrarNaSilhueta(serrilhada);
    expect(saltoNoArco(pts)).toBeLessThanOrEqual(MEIO_TRACO);
  });

  it("e o laço não se cruza por causa disso", () => {
    const { pts } = sangrarNaSilhueta(serrilhada);
    expect(autoIntersecoes(pts)).toHaveLength(0);
  });

  it("numa faixa uniforme a rampa não cobra nada: o empurrão sai inteiro", () => {
    /**
     * O CONTROLE do gate acima, e sem ele a suavização poderia ter comprado lisura
     * jogando fora a sangria.
     *
     * Média de um pedido CONSTANTE é o próprio pedido: onde a faixa é uniforme — que é
     * o caso de uma borda inteira rente ao crânio — o campo suavizado devolve o
     * empurrão cheio. O que sobra de diferença para `SANGRIA` é o crânio ser curvo: a
     * normal gira dentro da janela, e o vetor médio encolhe ~1 u. Medido: mínimo 7,29 ·
     * mediana 9,16 · máximo 9,97, contra `SANGRIA` = 10.
     */
    const uniforme = bordaRente(2, 0);
    const arco = uniforme.slice(0, uniforme.length / 2);
    const { pts } = sangrarNaSilhueta(uniforme);
    const naFaixa = arco.map((_, i) => i).filter((i) => contra(arco[i]).dist <= MEIO_TRACO);
    expect(naFaixa.length).toBe(arco.length);
    for (const i of naFaixa) expect(contra(pts[i]).fora).toBeGreaterThan(MEIO_TRACO);
  });
});
