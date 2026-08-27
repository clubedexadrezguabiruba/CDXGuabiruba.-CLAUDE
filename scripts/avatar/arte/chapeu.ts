/**
 * O SLOT `chapeu` — o segundo consumidor do braço de cor assada.
 *
 * ---------------------------------------------------------------------------
 * ELE É QUATRO LINHAS, E ISSO É O PONTO
 * ---------------------------------------------------------------------------
 *
 * `peca-de-arte.ts` foi separado de `traje.ts` em 2026-08-17 exatamente para isto:
 * *"chapéu, óculos e pet passam por aqui sem uma linha nova de traçado"*. O
 * recorte, o traçador, a sentinela, o controle negativo e a cor dominante são os
 * mesmos; **o que muda de slot para slot é uma coisa só, o campo.**
 *
 * Este arquivo é a prova de que aquela separação pagou: o slot inteiro cabe num
 * literal, e não há um passo de esteira escrito duas vezes.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELE NÃO TEM, E É DE PROPÓSITO
 * ---------------------------------------------------------------------------
 *
 * **Não há `CONGELADAS_NO_VETOR` aqui.** Aquela lista existe no traje porque duas
 * peças foram desenhadas, medidas e aprovadas no traçado antes de o braço raster
 * existir; regerá-las gastaria o olho do Doug para devolver a mesma peça mais
 * leve. O chapéu não tem passado: **toda peça dele nasce raster**, que é a regra
 * da arte nova desde 2026-08-20 (`CLAUDE.md`, regra 4).
 *
 * **A fábrica de tinta NÃO recolore — ela só neutraliza a linha instrumental.** A
 * `traje-farda` se recolore porque foi desenhada no tempo do ciano; o chapéu chega em
 * **cor final**, e a massa dele passa pela identidade. O que a fábrica faz é uma
 * coisa só, e ver `tintaDoChapeu` logo abaixo.
 *
 * **`escondeCabelo` NÃO é campo de slot, e desde 2026-08-25 ele existe.** Ele mora
 * no ITEM, e o valor não é escolha de ninguém: `oclusao-do-chapeu.ts` o extrai do
 * alfa do `.svg` que esta esteira acabou de escrever, respondendo *"dá para chegar
 * aqui vindo de baixo sem atravessar o chapéu?"*. `chapeus.ts` chama e grava; este
 * arquivo, que é o slot, continua sendo as quatro linhas de sempre.
 */

import { noCampoDoChapeu } from "./base";
import { mascaraDaLinha, neutralizar } from "./linha-instrumental";
import { type FabricaDeTinta, type SlotDeArte } from "./peca-de-arte";

/** Onde o `.svg` da peça é escrito. Sob `public/items/`, como todo slot. */
export const PASTA_CHAPEU = "public/items/chapeu";

/**
 * A convenção de slug: **`chapeu-<nome>`**, a mesma forma do traje.
 *
 * O nome do arquivo de arte É o slug do catálogo (doc 19 §12) — é o que faz uma
 * arte nova entrar na esteira só de existir, sem ninguém editar uma lista.
 */
export const CHAPEU: SlotDeArte = {
  nome: "chapeu",
  slug: /^chapeu-[a-z0-9]+(-[a-z0-9]+)*$/,
  pasta: PASTA_CHAPEU,
  campo: noCampoDoChapeu,
};

/**
 * A TINTA DO CHAPÉU — identidade na massa, cinza neutro na LINHA INSTRUMENTAL.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O CHAPÉU PRECISA DA LINHA AZUL, E É A PRIMEIRA PEÇA QUE PRECISA MESMO
 * ---------------------------------------------------------------------------
 *
 * O Doug, olhando a `toca-de-cozinha` no render em 2026-08-24: *"a borda da arte se
 * misturou com a borda da cabeça e a esteira se confundiu e eliminou a borda."*
 *
 * Ele está literalmente certo, e o mecanismo já tinha nome: extração é *diferença
 * contra a base*, e **preto sobre preto difere ~0**. O que muda de slot para slot é a
 * frequência com que isso acontece:
 *
 *  - o **traje** mora no tronco e a fronteira dele quase nunca encosta na do boneco —
 *    por isso ele atravessou duas peças com contorno preto sem ninguém notar;
 *  - o **chapéu SENTA na cabeça**. A borda de baixo dele corre por cima do contorno
 *    do crânio **por construção**, não por azar. É o slot em que o defeito é a regra.
 *
 * Com a linha em azul `#0000C8`, ela difere do preto da base por 200 níveis no canal
 * azul contra um limiar de 24 — a linha é extraída inteira, e a silhueta fecha.
 *
 * ---------------------------------------------------------------------------
 * E POR QUE ELA SAI **NEUTRA**, E NÃO MARCADA COMO NO CABELO
 * ---------------------------------------------------------------------------
 *
 * `marcar` devolve `(L, L, L+48)` porque na peça que recolore ainda há uma etapa
 * pela frente que precisa distinguir a linha do preto da base. **No chapéu não há
 * etapa seguinte**: o pixel que sai daqui é o pixel que a criança vê, e 48 níveis de
 * azul seriam um contorno azulado no avatar dela.
 *
 * `neutralizar` devolve `(L, L, L)` — cinza da própria luminância. Uma linha
 * `#0000C8` pura sai `(14, 14, 14)`, praticamente o `#000000` do boneco, e o
 * antialias dela sai em degradê em vez de degrau. **É a mesma técnica do cabelo com
 * o destino trocado**, e é o que faz o contorno do chapéu ler igual ao do cabelo no
 * produto — que é a coleção que o Doug pediu.
 *
 * ⚠️ **A massa não é tocada.** Um `map` sobre a cor da peça a faria recolorir, e
 * chapéu tem cor assada pela Regra Inviolável nº 4. Fora da linha, `aplicar` é a
 * identidade — o mesmo que `construirPeca` faria sem fábrica nenhuma.
 */
export const tintaDoChapeu: FabricaDeTinta = (e) => {
  const { linha } = mascaraDaLinha(e.arte.data, e.arte.w, e.arte.h, (i) => e.mascara[i] === 1);
  return {
    aplicar: (i) => {
      const j = i * 3;
      const c: [number, number, number] = [e.arte.data[j], e.arte.data[j + 1], e.arte.data[j + 2]];
      return linha[i] ? neutralizar(c[0], c[1], c[2]) : c;
    },
    // A peça já chega em cor final: não há cor declarada, e o relatório diz isso.
    declarada: null,
  };
};
