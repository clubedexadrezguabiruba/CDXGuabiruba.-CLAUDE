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
     * E ela cumpriu o CONTRATO: o ponto acabou além de meio traço para fora, que é o
     * que faz o clip cortar tinta cheia em vez de encostar na borda do traço.
     *
     * Não é `SANGRIA` cravado, e a diferença não é folga inventada: a sangria mede o
     * avanço na normal lida na projeção de ENTRADA, e este teste remede o ponto de
     * SAÍDA, que projeta em outro lugar do contorno. Um crânio curvo dá ~1 u de
     * diferença entre as duas leituras. Exigir 10 aqui seria exigir que o contorno
     * fosse reto.
     */
    const tocados = pts.filter((p, i) => p.x !== larga[i].x || p.y !== larga[i].y);
    for (const p of tocados) expect(contra(p).fora).toBeGreaterThan(MEIO_TRACO);
  });
});
