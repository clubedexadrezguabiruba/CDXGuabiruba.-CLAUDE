/**
 * A PEÇA TRANSCRITA — o preto que vem da ARTE, e as duas réguas que ele estreia.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, EM UMA FRASE
 * ---------------------------------------------------------------------------
 *
 * Enquanto o contorno da peça era **sintetizado**, o compositor traçava o laço da
 * massa com `stroke-width: 12` **centrado** nele. O preto do render ocupava então
 * `[borda−6, borda+6]` e o da arte ocupa `[borda, borda−10]`: sobreposição 6,
 * união 16, **IoU previsto 37,5%**. Medido na `chanel`: **34,4%**, com razão de
 * área **1,21×** contra 1,20 previsto. O modelo bate nos dois números — a forma
 * era transcrita bem, a tinta não era transcrita de jeito nenhum.
 *
 * Com `Cabelo.nucleo`, a `massa` é preenchida de tinta e o núcleo por cima com a
 * cor do cabelo: a banda preta vira a **diferença entre duas formas cheias**, com
 * a espessura que a arte tem. Sem `evenodd`, sem região com furo, sem tocar em
 * `bordaOrdenada`.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS RÉGUAS NOVAS, E POR QUE AS ANTIGAS NÃO BASTAM
 * ---------------------------------------------------------------------------
 *
 *  1. **`contencaoDoNucleo`** — sem stroke não há mais os ±6 u de folga que pagavam
 *     a tolerância de `escolherN`. Massa e núcleo são dois laços decimados
 *     independentes sobre uma banda de ~10 u, e onde eles cruzam o ciano aparece
 *     FORA do preto. É defeito novo, criado pelo desenho novo.
 *  2. **`contencaoDaClara` medindo contra o NÚCLEO** — com o desenho novo, medir a
 *     clara contra a massa vira **aprovação por vacuidade**: a massa agora é a
 *     silhueta inteira, incluindo a banda preta, e uma clara pintando por cima do
 *     contorno passaria.
 *
 * Cada uma entra com o **controle negativo ao lado**: uma régua sem o caso que a
 * reprova devolve zero e ninguém sabe se é conserto ou vacuidade — foi exatamente
 * assim que o `cobertos = 0` de `silhueta.ts` passou despercebido.
 */

import { describe, expect, it } from "vitest";
import { contencaoDaClara, contencaoDoNucleo, pathCabeloNucleo, pathCabeloPretas } from "../cabelo";
import type { Cabelo, PontoFranja } from "../cabelo";
import { compor } from "../compositor";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";

const svgDe = (modelo?: Parameters<typeof compor>[0]["modeloCabelo"]) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t" });

/**
 * A MASSA DA FIXTURE É UM CHANEL CHEIO, e ser cheio é requisito e não conveniência.
 *
 * `encolher` puxa para o centro, e isso só produz uma forma contida quando a
 * original é estrelada em relação a esse centro. Um laço em **arco** — a cortina
 * que desce dos dois lados e volta — tem o centro no vazio, e encolher joga a
 * cópia para dentro do buraco, ou seja para FORA da peça. O caso côncavo tem teste
 * próprio (`SEPARA: o defeito mora na CORDA`), com laço escrito à mão.
 */
const MASSA: readonly PontoFranja[] = [
  { t: -0.1, y: 320 },
  { t: -0.06, y: 180 },
  { t: 0.18, y: 108 },
  { t: 0.5, y: 96 },
  { t: 0.82, y: 108 },
  { t: 1.06, y: 180 },
  { t: 1.1, y: 320 },
  { t: 0.5, y: 340 },
];

/**
 * O NÚCLEO É A MASSA ENCOLHIDA, e o encolhimento é declarado aqui.
 *
 * `t` é fração da largura da cabeça e `y` é unidade absoluta, então encolher não é
 * multiplicar os dois pelo mesmo fator: `t` puxa para 0,5 e `y` para o centro da
 * peça. É uma fixture, não uma derivação do produto — quem deriva o núcleo de
 * verdade é `scripts/avatar/arte/converter.ts`, a partir da máscara da arte.
 */
function encolher(pts: readonly PontoFranja[], k: number): PontoFranja[] {
  const yc = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map((p) => ({ t: 0.5 + (p.t - 0.5) * k, y: yc + (p.y - yc) * k }));
}

const comNucleo = (extra: Partial<Cabelo> = {}): Cabelo => ({
  id: "chanel" as Cabelo["id"],
  nome: "fixture transcrita",
  massa: MASSA,
  nucleo: [encolher(MASSA, 0.86)],
  ...extra,
});

describe("a peça transcrita emite quatro camadas de laços simples", () => {
  it("massa vira TINTA e o núcleo vira cabelo — a banda preta é a diferença", () => {
    const svg = svgDe(comNucleo());
    // A camada 1 sai com `kk-tinta`, que já é emitida em todo SVG (inclusive na
    // careca): zero regra nova, zero propriedade nova.
    expect(svg).toContain(`<path class="kk-tinta" d="M`);
    expect(svg).toContain(`<path class="kk-cabelo-m" d="M`);
    // E `.kk-cabelo-l` some: `temArco` gateia a regra por `linhas`, que a peça
    // transcrita não declara.
    expect(svg).not.toContain("kk-cabelo-l");
  });

  it("as pretas internas vêm DEPOIS da clara — senão somem na região iluminada", () => {
    const c = comNucleo({
      clara: encolher(MASSA, 0.6),
      pretas: [encolher(MASSA, 0.3)],
    });
    const svg = svgDe(c);
    const iClara = svg.indexOf(`class="kk-cabelo"`);
    const iPretas = svg.lastIndexOf(`class="kk-tinta"`);
    expect(iClara).toBeGreaterThan(0);
    expect(iPretas).toBeGreaterThan(iClara);
  });

  it("a silhueta preta e o núcleo saem COLADOS — byte a byte", () => {
    // ⚠️ VEIO DE `pecas-de-elenco.test.ts` EM 2026-08-23. Lá ela media uma peça
    // REAL, e quebrou quando a `assimetrico` migrou para o tonal: a técnica antiga
    // deixou de ter peça viva que a exercitasse. Aqui a fixture declara `nucleo`, e
    // é o único lugar onde a partição existe para ser medida.
    //
    // O que ela protege: os selos byte a byte de `parametrico-congelado.ts`. Nada
    // entra entre a silhueta preta e o núcleo colorido — um caractere a mais ali
    // mata os selos de uma vez, com a causa longe do sintoma. Foi escrita em
    // 2026-08-19, quando a peça saía partida em `{ fundo, frente }` e a barba
    // entrava no meio; a partição caiu em 2026-08-20, e a linha fica porque é ela
    // que reprova se alguém tentar de novo.
    const svg = svgDe(comNucleo());
    const iTinta = svg.indexOf(`<path class="kk-tinta"`);
    expect(iTinta).toBeGreaterThan(-1);
    expect(svg.indexOf(`<path class="kk-cabelo-m"`)).toBe(
      iTinta + svg.slice(iTinta).indexOf("/>") + 2,
    );
  });

  it("o núcleo multi-componente sai num `<path>` só, como subpaths", () => {
    const c = comNucleo({ nucleo: [encolher(MASSA, 0.86), encolher(MASSA, 0.4)] });
    const d = pathCabeloNucleo(c);
    expect(d.match(/M /g)?.length).toBe(2);
    expect(d.match(/Z/g)?.length).toBe(2);
    // Um `<path>` só no SVG — multi-componente não custa forma do orçamento.
    expect(svgDe(c).match(/class="kk-cabelo-m"/g)?.length).toBe(1);
  });

  it("o contrato de custom properties não se move", () => {
    const p = conferirSvg(svgDe(comNucleo({ pretas: [encolher(MASSA, 0.3)] })));
    expect(p).toEqual([]);
  });

  it("recolore como qualquer outra peça — a tinta é `--av-linha`, não hexadecimal", () => {
    for (const cor of CABELO.slice(0, 3)) {
      const svg = compor({ pele: PELE[1], cabelo: cor, modeloCabelo: comNucleo(), ns: "t" });
      expect(conferirSvg(svg)).toEqual([]);
      // A camada 1 não carrega cor própria: quem pinta é a classe.
      expect(svg).not.toMatch(/<path class="kk-tinta"[^>]*fill=/);
    }
  });
});

describe("a INÉRCIA: sem os campos novos, o caminho é o de hoje", () => {
  /**
   * É a asserção que sustenta a decisão 3 do Bloco 13 — só a `chanel` transcreve,
   * e as três peças do Bloco 9 ficam congeladas. Se um campo ausente mudasse um
   * byte, "congelado" seria promessa e não mecanismo.
   */
  const semNucleo: Cabelo = {
    id: "chanel" as Cabelo["id"],
    nome: "fixture sintetizada",
    massa: MASSA,
    clara: encolher(MASSA, 0.6),
    linhas: [[0, 4]],
  };

  it("peça sem `nucleo` emite `kk-cabelo-m` + `kk-cabelo-l`, como sempre", () => {
    const svg = svgDe(semNucleo);
    expect(svg).toContain(`<path class="kk-cabelo-m" d="M`);
    expect(svg).toContain(`<path class="kk-cabelo-l" d="M`);
    expect(pathCabeloNucleo(semNucleo)).toBe("");
    expect(pathCabeloPretas(semNucleo)).toBe("");
  });

  it("acrescentar `nucleo: []` não conta como transcrever", () => {
    // Lista vazia é ausência, não peça transcrita com zero componentes — senão a
    // massa sairia preta e o cabelo sumiria inteiro.
    expect(svgDe({ ...semNucleo, nucleo: [] })).toBe(svgDe(semNucleo));
  });
});

describe("contencaoDoNucleo — e o controle negativo", () => {
  it("PASSA: núcleo contido na massa devolve folga positiva", () => {
    expect(contencaoDoNucleo(comNucleo())).toBeGreaterThan(0);
  });

  it("REPROVA: núcleo furando a massa devolve negativo", () => {
    // 1,04 põe o núcleo por FORA da massa em todo o percurso: é o ciano vazando do
    // preto, o defeito que o fim do stroke de 12 u tornou possível.
    const furando = comNucleo({ nucleo: [encolher(MASSA, 1.04)] });
    expect(contencaoDoNucleo(furando)).toBeLessThan(0);
  });

  it("SEPARA: o defeito mora na CORDA, não no vértice", () => {
    // Os vértices do núcleo ficam dentro; uma corda dele atravessa o entalhe que a
    // massa faz entre os dois picos. É o mesmo modo de falha que
    // `conter-a-clara.test.ts` mediu na `curto-espetada` (64 vértices dentro, uma
    // corda 4,52 u fora).
    const entalhe: PontoFranja[] = [
      { t: 0.1, y: 300 },
      { t: 0.35, y: 300 },
      { t: 0.5, y: 150 },
      { t: 0.65, y: 300 },
      { t: 0.9, y: 300 },
      { t: 0.9, y: 120 },
      { t: 0.1, y: 120 },
    ];
    const nucleoNosVertices: PontoFranja[] = [
      { t: 0.2, y: 280 },
      { t: 0.8, y: 280 },
      { t: 0.8, y: 140 },
      { t: 0.2, y: 140 },
    ];
    const c: Cabelo = {
      id: "chanel" as Cabelo["id"],
      nome: "entalhe",
      massa: entalhe,
      nucleo: [nucleoNosVertices],
    };
    expect(contencaoDoNucleo(c)).toBeLessThan(0);
  });

  it("Infinity pelo caso NOMEADO, nunca por vacuidade", () => {
    // Peça traçada sem núcleo: o contorno dela é sintetizado, e não há o que vazar.
    expect(contencaoDoNucleo({ id: "chanel" as Cabelo["id"], nome: "x", massa: MASSA })).toBe(
      Infinity,
    );
    // Peça paramétrica: quem mede é `sombraSobreAFranja`.
    //
    // A fixture é sintética desde 2026-08-24, e a troca é obrigatória, não estilo: era
    // `contencaoDoNucleo("coque")`, e o catálogo ficou SEM paramétrico quando o Doug
    // apagou aquele modelo. Apontar para uma peça viva do catálogo mediria a família
    // tonal com o nome de paramétrica — verde, e medindo outra coisa.
    expect(
      contencaoDoNucleo({
        id: "chanel" as Cabelo["id"],
        nome: "paramétrico (fixture)",
        pontos: [
          { t: -0.1, y: 200 },
          { t: 0.5, y: 170 },
          { t: 1.1, y: 200 },
        ],
      }),
    ).toBe(Infinity);
  });
});

describe("contencaoDaClara passa a medir contra o NÚCLEO", () => {
  it("REPROVA a clara que cabe na massa mas sai do núcleo — a vacuidade fechada", () => {
    // 0,95 é maior que o núcleo (0,86) e menor que a massa: a clara estaria
    // pintando tom claro EM CIMA do contorno preto. Contra a massa isso passava.
    const c = comNucleo({ clara: encolher(MASSA, 0.95) });
    expect(contencaoDaClara(c)).toBeLessThan(0);
    // E a prova de que a régua antiga aprovava: sem `nucleo`, a mesma clara passa.
    const semNucleo: Cabelo = { ...c, nucleo: undefined };
    expect(contencaoDaClara(semNucleo)).toBeGreaterThan(0);
  });

  it("PASSA a clara contida no núcleo", () => {
    expect(contencaoDaClara(comNucleo({ clara: encolher(MASSA, 0.6) }))).toBeGreaterThan(0);
  });

  it("núcleo multi-componente é UM continente de dois pedaços, não dois continentes", () => {
    // A clara dentro de um dos pedaços tem de passar. Se a régua exigisse estar
    // dentro de TODOS, um núcleo partido pelo traço interno reprovaria sempre.
    const c = comNucleo({
      nucleo: [encolher(MASSA, 0.86), [
        { t: 0.45, y: 400 },
        { t: 0.55, y: 400 },
        { t: 0.55, y: 380 },
        { t: 0.45, y: 380 },
      ]],
      clara: encolher(MASSA, 0.6),
    });
    expect(contencaoDaClara(c)).toBeGreaterThan(0);
  });
});
