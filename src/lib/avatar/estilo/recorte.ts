/**
 * O RECORTE DE CABEÇA — o mesmo boneco, visto de perto.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * As telas pequenas pedem cabeça, não corpo: navbar 32 px, mural 32 px, rankings
 * 40 px. Um kokeshi inteiro (`viewBox` 500 × 700, figura a 92%) a 32 px de altura
 * deixa a cabeça com **13,2 px** — abaixo de qualquer leitura. O mesmo boneco no
 * recorte deixa **19,2 px**, e é essa diferença que decide se a criança se
 * reconhece no ranking ou vê uma bolinha.
 *
 * ---------------------------------------------------------------------------
 * SÓ O `viewBox` MUDA — E ISSO É O PROJETO INTEIRO DESTE ARQUIVO
 * ---------------------------------------------------------------------------
 *
 * Não há segundo compositor, segunda folha de estilo, segunda geometria. O SVG é
 * o **mesmo** que `<AvatarKokeshi>` desenha; o que muda é a janela por onde se
 * olha. Qualquer outra forma de recortar — um `compor()` alternativo, um clip, uma
 * peça "versão pequena" — seria uma segunda descrição do boneco, e este
 * repositório já pagou por ter duas descrições da mesma forma.
 *
 * ---------------------------------------------------------------------------
 * AS COORDENADAS SÃO DO QUADRO, NÃO DAS CONSTANTES
 * ---------------------------------------------------------------------------
 *
 * `geometria.ts` descreve o boneco num sistema interno, e `compor()` entrega a
 * figura **reancorada e a 92%**. O ponto `(x, y)` das constantes não está em
 * `(x, y)` do quadro — quem recorta tem de passar por `naTela()`, e foi
 * exatamente isso que a folha do Bloco 6 errou uma vez (close recortado a 100%
 * sobre um render a 92%, arte sangrando pelos dois lados).
 *
 * ---------------------------------------------------------------------------
 * O TETO É `y = 0`, E ISSO É DELIBERADO
 * ---------------------------------------------------------------------------
 *
 * O moicano é desenhado com a crista em `y = −76` no sistema interno, e o
 * viewport do corpo inteiro a corta: os três bicos viram barra reta (T1.5,
 * `docs/avatar/14-backlog-execucao.md:252-268`). O recorte **não conserta isso**,
 * e não deve: se ele mostrasse uma crista que o `/perfil` não mostra, a navbar e
 * o perfil discordariam sobre a mesma criança. Quem devolve a crista é a decisão
 * do espaço da cabeça — e quando ela vier, este arquivo **deriva** das mesmas
 * constantes e acompanha sozinho, sem ninguém editar número aqui.
 *
 * ---------------------------------------------------------------------------
 * A FOLGA LATERAL É MEDIDA, E ESTÁ ESCRITA
 * ---------------------------------------------------------------------------
 *
 * A caixa da cabeça tem 364 unidades de largura, mas **o cabelo passa dela**. O
 * quanto foi medido em 2026-08-11, rasterizando as 6 opções **no Chromium** e
 * lendo a caixa da tinta na região da cabeça (unidades do quadro):
 *
 * | opção | tinta x0 | tinta x1 | meia-extensão máxima do eixo |
 * |---|---|---|---|
 * | careca · coque · moicano | 83,5 | 430,0 | 173,6 |
 * | espetado | 34,0 | 474,0 | 222,4 |
 * | chanel | 33,5 | 466,0 | 222,9 |
 * | **assimetrico** | **26,0** | 461,0 | **230,4** |
 *
 * (a caixa da cabeça no quadro vai de x 89,2 a 424,1; o eixo, a 256,4)
 *
 * O pior caso pede **230,4 unidades de quadro** a partir do eixo, ou **250,4
 * internas**. A folga de 80 dá 262 internas — **10,6 unidades de quadro de
 * sobra**, e não um número ajustado para o catálogo de hoje passar raspando.
 *
 * ⚠️ **A primeira medição destes números usou `sharp`, e estava curta em 5,5
 * unidades de cada lado.** O librsvg não resolve custom property, então
 * `stroke-width: var(--av-traco)` cai de 12 para 1 e a tinta encolhe. A mesma
 * careca dá x0 = 89,0 no `sharp` e 83,5 no Chromium. O repositório já tinha a
 * lição escrita duas vezes (`scripts/avatar/arte/folha.ts:37`,
 * `tracar-cabelo.ts:150`) e ela foi repetida assim mesmo.
 *
 * Quem garante que a folga continua bastando é o teste `recorte-cabeca.test.ts`,
 * que rasteriza as 6 opções no Chromium e reprova se um pixel escapar. **Se um
 * modelo não couber, a folga cresce — nunca a peça encolhe.**
 */

import { ESCALA_PADRAO, naTela } from "./compositor";
import { CAIXA_CABECA, EIXO_CABECA, VIEWBOX } from "./geometria";

/**
 * Quanto o cabelo passa da caixa da cabeça, em unidades INTERNAS.
 *
 * Medido: 68,7 no pior caso do catálogo (o `assimetrico`). Ver a tabela no topo.
 */
export const FOLGA_LATERAL_DO_CABELO = 80;

export interface Recorte {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A janela do recorte, em unidades do QUADRO.
 *
 * Quadrada de propósito: os cinco lugares que a consomem são cápsulas redondas de
 * 32 e 40 px, e uma janela retangular obrigaria cada uma a decidir sozinha o que
 * fazer com a sobra — cinco decisões onde cabe uma.
 *
 * Centrada em `EIXO_CABECA`, que **não é** `CENTRO_X`: a cabeça tem eixo próprio,
 * 7 unidades à direita do tronco (o giro). Centrar no tronco poria a cabeça
 * visivelmente à esquerda da cápsula.
 */
export const RECORTE_CABECA: Recorte = (() => {
  const meiaLarguraInterna = CAIXA_CABECA.larg / 2 + FOLGA_LATERAL_DO_CABELO;
  const meia = meiaLarguraInterna * ESCALA_PADRAO;
  const lado = 2 * meia;
  return { x: naTela({ x: EIXO_CABECA }).x - meia, y: 0, w: lado, h: lado };
})();

/** O `viewBox` que `compor()` emite hoje. Trocá-lo é o recorte inteiro. */
const VIEWBOX_INTEIRO = `viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}"`;

const n = (v: number) => (Math.round(v * 10) / 10).toString();

/**
 * Troca o `viewBox` do corpo inteiro pelo da cabeça.
 *
 * **Lança se não encontrar o `viewBox` esperado**, e isso não é zelo: um
 * `String.replace` que não casa devolve a string original *em silêncio*, e o
 * sintoma seria um boneco de corpo inteiro espremido em 32 px na navbar — feio o
 * bastante para alguém notar, sutil o bastante para atravessar um deploy.
 */
export function recortarNaCabeca(svg: string, recorte: Recorte = RECORTE_CABECA): string {
  if (!svg.includes(VIEWBOX_INTEIRO)) {
    throw new Error(
      `recortarNaCabeca: não achei ${VIEWBOX_INTEIRO} no SVG. ` +
        "compor() mudou o formato do viewBox e este recorte precisa acompanhar.",
    );
  }
  return svg.replace(
    VIEWBOX_INTEIRO,
    `viewBox="${n(recorte.x)} ${n(recorte.y)} ${n(recorte.w)} ${n(recorte.h)}"`,
  );
}
