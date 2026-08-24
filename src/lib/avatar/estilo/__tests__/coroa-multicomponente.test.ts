/**
 * "DENTRO DA PEÇA" É DENTRO DE ALGUM COMPONENTE — a régua tem de somar mechas.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, medido em 2026-08-24
 * ---------------------------------------------------------------------------
 *
 * `poligonoDoTracado` achata o `d` do `potrace` numa lista de pontos só. Enquanto
 * toda peça do slot teve UM componente isso foi idêntico ao certo, e por isso passou
 * despercebido por 14 promoções. A `maria-chiquinha` chegou com **três** — a massa da
 * cabeça e as duas chiquinhas — e o achatamento emenda o fim de um componente no
 * começo do seguinte, criando arestas que não existem em desenho nenhum. O
 * ponto-em-polígono passa a responder sobre uma forma que ninguém desenhou.
 *
 *   `coberturaDaCoroa("maria-chiquinha")`   antes **0,8690**   depois **1,0000**
 *
 * 13,1% de coroa "descoberta" se lê como *couro cabeludo à mostra*, que é exatamente
 * o defeito que aquela régua existe para pegar. Ela estava acusando a arte de um
 * furo que era dela.
 *
 * ⚠️ **A `trancas-duplas`, com dois componentes, dava 1,0000 nas duas contas.** Foi
 * sorte da geometria — as arestas fantasma caíram fora da faixa medida —, e é o que
 * torna este arquivo necessário: régua que acerta por onde a arte calhou de ficar é
 * régua que ainda não errou. O controle sintético abaixo não depende de sorte.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O CONTROLE É SINTÉTICO, e não a peça real
 * ---------------------------------------------------------------------------
 *
 * ⚠️ **A `maria-chiquinha` não está no catálogo: o Doug reprovou o DESENHO no mesmo
 * dia e mandou apagar a arte.** Ela não volta, e é por isso que nenhuma asserção
 * daqui depende dela — o defeito que ela revelou é de programa e continua valendo.
 *
 * A peça real prova que o número mudou; ela não prova POR QUÊ. Duas metades
 * separadas, cada uma cobrindo metade da coroa e nenhuma cobrindo o meio, isolam o
 * mecanismo: se a régua somar componentes, a cobertura é total; se achatar, a aresta
 * que liga as duas metades atravessa o meio e o resultado deixa de descrever a
 * figura. E o contra-controle — UMA das metades sozinha — tem de ficar bem abaixo de
 * 1, senão o teste passaria mesmo com a régua respondendo qualquer coisa.
 */
import { describe, expect, it } from "vitest";

import { CABELOS, coberturaDaCoroa, coberturaDaSobrancelha, type Cabelo } from "../cabelo";
import { CAIXA_CABECA } from "../geometria";

/** Um `id` emprestado de peça viva — a união é fechada e a fixture não é vestível. */
const ID_FIXTURA = "chanel" as const;

/** Retângulo fechado como o `potrace` emite: `M` + `L` implícitos + `Z`. */
const retangulo = (x0: number, y0: number, x1: number, y1: number) =>
  `M${x0} ${y0} ${x1} ${y0} ${x1} ${y1} ${x0} ${y1}Z`;

/**
 * A faixa que `coberturaDaCoroa` amostra: o contorno do crânio acima de
 * `CAIXA_CABECA.y0 + 0,25 · alt`. Os retângulos abaixo a cobrem com folga em `y`
 * para que o teste meça a partição em `x`, que é onde o defeito mora.
 */
const TOPO = CAIXA_CABECA.y0 - 60;
const BASE = CAIXA_CABECA.y0 + 0.5 * CAIXA_CABECA.alt;
const MEIO = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
const ESQ = CAIXA_CABECA.x0 - 60;
const DIR = CAIXA_CABECA.x1 + 60;

const pecaCom = (d: string): Cabelo => ({
  id: ID_FIXTURA,
  nome: "tonal (fixture)",
  tonal: {
    formas: [
      { d, cor: "var(--av-linha)", semTraco: true },
      { d, cor: "var(--av-cabelo, #262626)", semTraco: true },
    ],
    tom: { arte: "/items/cabelo/fixture-tom.png", x: ESQ, y: TOPO, w: DIR - ESQ, h: BASE - TOPO },
  },
});

describe("coberturaDaCoroa soma os componentes da peça", () => {
  it("duas metades separadas cobrem a coroa INTEIRA — 1,0", () => {
    const duasMetades = retangulo(ESQ, TOPO, MEIO, BASE) + retangulo(MEIO, TOPO, DIR, BASE);
    expect(coberturaDaCoroa(pecaCom(duasMetades))).toBe(1);
  });

  it("CONTRA-CONTROLE: uma metade sozinha NÃO cobre — senão o teste acima é vácuo", () => {
    const metade = coberturaDaCoroa(pecaCom(retangulo(ESQ, TOPO, MEIO, BASE)));
    expect(metade).not.toBeNull();
    expect(metade!).toBeLessThan(0.75);
    expect(metade!).toBeGreaterThan(0.25);
  });

  it("um componente só continua dando o mesmo — a mudança não move peça de uma mecha", () => {
    // O retângulo inteiro é o caso de sempre: subcaminho único, resultado idêntico
    // ao da régua anterior. É o que garante que consertar o multi não mexeu no mono.
    expect(coberturaDaCoroa(pecaCom(retangulo(ESQ, TOPO, DIR, BASE)))).toBe(1);
  });

  it("A SOBRANCELHA: dois tufos longe dela não a cobrem — a aresta fantasma cobria", () => {
    // ⚠️ **Esta é a asserção que mostra o tamanho real do defeito**, e ela mede o
    // OUTRO consumidor de `subcaminhosDoTracado`, que pode regredir sozinho.
    //
    // O compositor OMITE a sobrancelha que a peça cobre em 85% ou mais
    // (`SOBRANCELHA_COBERTA`). Dois tufos em alturas DIFERENTES — um alto à esquerda,
    // outro descendo à direita, como uma chiquinha — deixam as sobrancelhas
    // completamente de fora do desenho. Mas a aresta que o achatamento inventa para
    // ligar um ao outro corta o rosto na diagonal e passa por cima delas.
    //
    // Na arte real que revelou isto, a conta era **esq 94,6% · dir 38,5%** com o `d`
    // achatado contra **5,4% · 2,4%** somando os componentes — e o boneco sairia com
    // **uma sobrancelha só**, com todos os testes verdes. A diferença no SVG composto
    // eram 87 bytes: o `path` da sobrancelha que deixava de existir.
    // Os dois tufos ficam INTEIRAMENTE fora do crânio em `x` — um à esquerda de
    // `CAIXA_CABECA.x0`, outro à direita de `x1` —, e as sobrancelhas moram dentro.
    // Nenhum dos dois encosta nelas. A aresta que liga um ao outro atravessa o rosto
    // de lado a lado, na altura delas.
    const tufoEsq = retangulo(ESQ, TOPO, CAIXA_CABECA.x0, CAIXA_CABECA.y0 + 200);
    const tufoDir = retangulo(CAIXA_CABECA.x1, TOPO, DIR, CAIXA_CABECA.y0 + 200);
    const { esq, dir } = coberturaDaSobrancelha(pecaCom(tufoEsq + tufoDir));
    expect(esq).toBeLessThan(0.1);
    expect(dir).toBeLessThan(0.1);
  });

  it("o catálogo ainda tem peça de vários componentes — senão o caso some do produto", () => {
    // Guarda contra o dia em que o slot voltar a ser só de peças de uma mecha: o
    // conserto continuaria coberto pelos sintéticos acima, mas o produto deixaria de
    // exercitá-lo, e é bom que isso seja dito em voz alta em vez de descoberto depois.
    //
    // ⚠️ **A peça real NÃO serve de controle**, e é medido: a `trancas-duplas` tem 2
    // componentes e dava 1,0000 nas duas versões da régua — as arestas fantasma dela
    // caíram fora da faixa medida. Quem prova o mecanismo são os sintéticos.
    const multi = Object.values(CABELOS).filter(
      (c) => (c.tonal?.formas[0].d ?? "").split(/(?=M)/).filter((p: string) => p.trim()).length > 1,
    );
    expect(multi.length, "nenhuma peça de vários componentes no catálogo").toBeGreaterThan(0);
    for (const c of multi) expect(coberturaDaCoroa(c)).toBe(1);
  });
});
