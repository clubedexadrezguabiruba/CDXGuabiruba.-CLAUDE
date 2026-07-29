/**
 * Modelos do slot `hair`.
 *
 * POR QUE O CABELO É CAMADA E NÃO PARTE DA BASE — a pergunta do usuário em
 * 2026-07-29, e a razão de a base ser desenhada careca:
 *
 *  - Uma menina troca o modelo e o boneco vira dela. Se o cabelo estivesse na
 *    base, todo modelo feminino precisaria **esconder** o de baixo — que é o
 *    `headKnockout` do v2, o mesmo que já deixou bonecos decapitados quando o
 *    chapéu não renderizava.
 *  - As 8 cores da paleta valem para os 5 modelos: 40 visuais, 5 arquivos.
 *  - Ninguém vê o boneco careca: `users.avatar_hair` nasce com um modelo
 *    padrão (migration do Bloco 4).
 *
 * O Bloco 2 entrega o modelo 1. Os outros 4 vêm no Bloco 8, e pelo menos dois
 * deles são femininos — é o que torna a base sem gênero uma decisão e não uma
 * omissão.
 */

import { peca, type Ponto } from "./formas";
import { curvaFechada } from "./curvas";

export interface GeometriaCranio {
  /** Ponto no crânio por fração de largura/altura. */
  q: (fx: number, fy: number) => Ponto;
  /** Altura do crânio, para calibrar o raio de canto. */
  hCranio: number;
}

export type ModeloCabelo = 1;

/**
 * Modelo 1 — curto e revolto, com franja em pontas e um fio rebelde.
 *
 * Vem da referência do usuário: massas grandes varridas para um lado, pontas
 * longas e desiguais, costeleta na frente da orelha. O que faz a silhueta
 * funcionar a 56 px é o CONTRASTE entre ponta e vale — franja regular vira
 * tampa, que era o defeito do protótipo.
 */
function modelo1({ q, hCranio }: GeometriaCranio): string {
  // RODADA 4: a rodada 3 tinha CINCO pontas e vales fundos, e lia como coroa
  // de espinhos. A referência tem poucas massas grandes e varridas, com dois
  // ou três vales rasos. Menos recorte, mais volume — é o que faz ler como
  // cabelo e não como serrote.
  // RODADA 6: a franja continuava um serrote. A referência tem uma MASSA
  // VARRIDA com uma ponta só (o fio rebelde) e uma borda de baixo que ondula
  // de leve. Recorte é o que faz ler como espinho; onda é o que faz ler como
  // cabelo. Sobrou uma ponta, e ela é a assinatura da silhueta.
  const massa: Ponto[] = [
    q(-0.56, -0.06),
    q(-0.60, -0.34),
    q(-0.44, -0.56),
    q(-0.12, -0.66),
    q(0.14, -0.60),
    q(0.30, -0.90), // fio rebelde: a única ponta
    q(0.34, -0.56),
    q(0.52, -0.48),
    q(0.60, -0.28),
    q(0.58, -0.04),
    q(0.46, -0.22), // volta pela borda de dentro: a franja
    q(0.22, -0.20),
    q(-0.04, -0.30),
    q(-0.30, -0.22),
    q(-0.46, -0.26),
  ];

  // Costeleta: desce na frente da orelha. Sem ela o cabelo lê como capacete
  // pousado, porque nada o conecta ao rosto abaixo da linha dos olhos.
  const costeleta = (lado: 1 | -1): Ponto[] => [
    q(lado * 0.56, -0.18),
    q(lado * 0.61, 0.02),
    q(lado * 0.56, 0.12),
    q(lado * 0.48, 0.02),
    q(lado * 0.47, -0.16),
  ];

  // RODADA 7: a massa era sólida e lia como capacete. A referência tem MECHAS
  // separadas por dentro — é o que faz o olho ler "cabelo" em vez de "peça de
  // armadura". Três linhas acompanhando a varrida bastam; mais que isso vira
  // ruído a 56 px.
  const mecha = (a: Ponto, c: Ponto, b: Ponto): string =>
    `<path class="mecha" d="M ${a[0].toFixed(1)} ${a[1].toFixed(1)} ` +
    `Q ${c[0].toFixed(1)} ${c[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`;

  void hCranio;

  return (
    peca("c-cabelo contorno", curvaFechada(massa, 0.9)) +
    peca("c-cabelo contorno", curvaFechada(costeleta(-1), 0.9)) +
    peca("c-cabelo contorno", curvaFechada(costeleta(1), 0.9)) +
    mecha(q(-0.34, -0.52), q(-0.10, -0.44), q(0.06, -0.26)) +
    mecha(q(-0.02, -0.60), q(0.20, -0.48), q(0.30, -0.24)) +
    mecha(q(0.30, -0.54), q(0.46, -0.44), q(0.50, -0.24))
  );
}

/** Sombra do modelo: um degrau só, na massa que fica atrás da varrida. */
function sombra1({ q }: GeometriaCranio): string {
  return peca(
    "c-cabelo-s",
    curvaFechada(
      [q(-0.60, -0.34), q(-0.44, -0.56), q(-0.12, -0.66), q(-0.18, -0.44), q(-0.46, -0.28)],
      0.9,
    ),
  );
}

export function cabelo(modelo: ModeloCabelo, g: GeometriaCranio, comSombra: boolean): string {
  switch (modelo) {
    case 1:
      return modelo1(g) + (comSombra ? sombra1(g) : "");
  }
}
