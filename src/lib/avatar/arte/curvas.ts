/**
 * Primitivo de curva — a peça que faltava depois de seis rodadas do Bloco 2.
 *
 * DIAGNÓSTICO QUE MOTIVOU ESTE ARQUIVO: o corpo inteiro era montado com
 * `poligono()`, que produz retângulos de cantos arredondados. A referência
 * aprovada é feita de formas que curvam e AFINAM. Retângulo arredondado nunca
 * lê como braço — lê como barra, e o resultado saía com cara de quebra-nozes
 * de madeira em vez do boneco macio da referência. Nenhuma rodada a mais na
 * primitiva antiga resolveria isso.
 *
 * Duas funções, e elas cobrem o catálogo inteiro:
 *
 *  - `curvaFechada` — contorno macio passando POR uma lista de pontos.
 *    Serve para crânio, orelha, mão, massa de cabelo, tronco.
 *  - `formaAfilada` — tubo em volta de uma espinha, com largura variável.
 *    Serve para braço, perna, mecha de cabelo, rabo de pet. É o que separa
 *    "membro" de "barra".
 *
 * `poligono()` continua existindo para o que é duro de verdade: bota, cinto,
 * fivela, moldura.
 */

import { n1, type Ponto } from "./formas";

/**
 * Curva fechada e macia passando por todos os pontos (Catmull-Rom convertido
 * para Bézier cúbica).
 *
 * `tensao` 1 é a curva canônica. Abaixo de 1 aperta em direção às retas;
 * acima de 1 estufa e pode criar laço — 1,2 é o teto útil.
 */
export function curvaFechada(pts: Ponto[], tensao = 1): string {
  const n = pts.length;
  if (n < 3) throw new Error("curvaFechada precisa de ao menos 3 pontos");

  const at = (i: number): Ponto => pts[((i % n) + n) % n];
  let d = `M ${n1(pts[0][0])} ${n1(pts[0][1])} `;

  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const c1: Ponto = [
      p1[0] + ((p2[0] - p0[0]) / 6) * tensao,
      p1[1] + ((p2[1] - p0[1]) / 6) * tensao,
    ];
    const c2: Ponto = [
      p2[0] - ((p3[0] - p1[0]) / 6) * tensao,
      p2[1] - ((p3[1] - p1[1]) / 6) * tensao,
    ];

    d += `C ${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])} `;
  }

  return d + "Z";
}

export interface NoDaEspinha {
  /** Ponto no eixo do membro. */
  p: Ponto;
  /** Meia-largura do membro neste ponto. */
  w: number;
}

/**
 * Tubo macio em volta de uma espinha, com largura variável.
 *
 * O membro é descrito pelo EIXO e pela grossura, que é como um membro
 * realmente é — em vez de por quatro cantos, que é como uma caixa é. Afinar no
 * meio e engrossar na junta é o que faz ler como braço.
 *
 * As pontas ficam arredondadas sozinhas: a curva fechada passa pelos pontos de
 * extremidade que a função acrescenta meia-largura além do primeiro e do
 * último nó.
 */
export function formaAfilada(espinha: NoDaEspinha[], tensao = 1): string {
  const n = espinha.length;
  if (n < 2) throw new Error("formaAfilada precisa de ao menos 2 nós");

  /** Normal unitária no nó i, perpendicular à direção local da espinha. */
  const normal = (i: number): Ponto => {
    const a = espinha[Math.max(0, i - 1)].p;
    const b = espinha[Math.min(n - 1, i + 1)].p;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  };

  /** Tangente unitária, para empurrar as tampas para fora. */
  const tangente = (i: number, j: number): Ponto => {
    const dx = espinha[j].p[0] - espinha[i].p[0];
    const dy = espinha[j].p[1] - espinha[i].p[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };

  const direita: Ponto[] = [];
  const esquerda: Ponto[] = [];

  for (let i = 0; i < n; i++) {
    const [nx, ny] = normal(i);
    const { p, w } = espinha[i];
    direita.push([p[0] + nx * w, p[1] + ny * w]);
    esquerda.push([p[0] - nx * w, p[1] - ny * w]);
  }

  // Tampas: um ponto no eixo, empurrado meia-largura além da ponta. É ele que
  // faz a extremidade sair redonda em vez de cortada em quina.
  const tIni = tangente(1, 0);
  const tFim = tangente(n - 2, n - 1);
  const tampaIni: Ponto = [
    espinha[0].p[0] + tIni[0] * espinha[0].w,
    espinha[0].p[1] + tIni[1] * espinha[0].w,
  ];
  const tampaFim: Ponto = [
    espinha[n - 1].p[0] + tFim[0] * espinha[n - 1].w,
    espinha[n - 1].p[1] + tFim[1] * espinha[n - 1].w,
  ];

  return curvaFechada([tampaIni, ...direita, tampaFim, ...esquerda.reverse()], tensao);
}

/**
 * Espinha reta entre dois pontos, com largura interpolada.
 * Atalho para o caso comum — um membro sem dobra.
 */
export function espinhaReta(
  de: Ponto,
  para: Ponto,
  wDe: number,
  wPara: number,
  nos = 3,
): NoDaEspinha[] {
  return Array.from({ length: nos }, (_, i) => {
    const t = i / (nos - 1);
    return {
      p: [de[0] + (para[0] - de[0]) * t, de[1] + (para[1] - de[1]) * t] as Ponto,
      w: wDe + (wPara - wDe) * t,
    };
  });
}
