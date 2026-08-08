/**
 * OS SETE CABELOS — as amarras que substituem a régua que não existe.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * Todo o resto do estilo kokeshi sai de medição sobre a referência. O cabelo
 * paramétrico não pode: a `referencia-base.png` é um boneco CARECA, e não há fonte
 * de onde extrair a forma de cinco cabelos. As coordenadas paramétricas de
 * `cabelo.ts` são **desenhadas**, e chamar isso de medido seria a mesma falha que o
 * `rosto-cor.test.ts` foi criado para consertar — descrever uma intenção como se
 * fosse um fato.
 *
 * **Os dois promovidos em 2026-08-07 (`espetado`, `chanel`) são a exceção**: eles
 * saem de arte, pela rota de `scripts/avatar/arte/`, e ali existe régua de verdade
 * — mas ela mora lá, com o PNG do lado. Aqui eles são medidos pelas mesmas amarras
 * dos outros, com dois pisos que só valem para peça traçada, declarados abaixo:
 * a folga do rosto é **fato da arte** (o que o traço controla é não piorá-la), e o
 * teto de bytes **não veta arte aprovada** (decisão A).
 *
 * O que substitui a régua são as amarras daqui. Cada uma reprova um defeito que
 * este projeto já viu, e nenhuma delas depende de alguém olhar a folha:
 *
 *  1. a base careca **não paga nada** pelo slot (nem regra, nem variável, nem forma);
 *  2. a franja **atravessa** a cabeça — as pontas caem fora da silhueta, e é o clip
 *     que corta, nunca o cabelo que decide onde o crânio acaba;
 *  3. a franja **não invade o rosto**, medida sobre cada sobrancelha;
 *  4. toda extensão **entra** na cabeça ≥ `SANGRIA` — coque não flutua;
 *  5. o composto cabe no orçamento e passa no contrato de custom properties.
 */

import { describe, expect, it } from "vitest";
import {
  CABELOS,
  FOLGA_ROSTO,
  MODELOS_CABELO,
  ORCAMENTO_COMPOSTO,
  ancoragemDasExtensoes,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  pathCabelo,
  pathCabeloClaro,
  sobrancelhaEscondida,
  sombraSobreAFranja,
} from "../cabelo";
import type { Cabelo, PontoFranja } from "../cabelo";
import { compor } from "../compositor";
import { SANGRIA, bordasEm } from "../geometria";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";

const svgDe = (modelo?: (typeof MODELOS_CABELO)[number]) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t" });

const formas = (svg: string) => (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/**
 * A FRANJA PARAMÉTRICA, CONGELADA AQUI — e a cópia é o ponto, não um descuido.
 *
 * Os testes de baixo mediam a família paramétrica lendo `CABELOS.curto.pontos`, e
 * isso amarrava o comportamento do MODELO ao conteúdo do CATÁLOGO: no dia em que o
 * `curto` fosse re-traçado — que é o dia inteiro para o qual o campo `massa` existe
 * — `pontos` viraria `undefined` e três testes quebrariam por um motivo que não tem
 * relação nenhuma com o que eles verificam. Um deles nem falharia: `.map` de
 * `undefined` lança, e o relatório diria "erro" onde o certo é "a peça mudou de
 * família".
 *
 * Com a tabela congelada aqui, o que eles medem passa a ser o que eles dizem medir:
 * como a touca se emite e como a sombra paramétrica se comporta. Ela pode divergir
 * do catálogo à vontade — divergir é o objetivo.
 */
const PONTOS_PARAMETRICO: readonly PontoFranja[] = [
  { t: -0.12, y: 232 },
  { t: 0.05, y: 178 },
  { t: 0.2, y: 134 },
  { t: 0.42, y: 124 },
  { t: 0.68, y: 123 },
  { t: 0.88, y: 130 },
  { t: 0.99, y: 176 },
  { t: 1.14, y: 228 },
];

const CURTO_PARAMETRICO: Cabelo = {
  id: "coque",
  nome: "curto (paramétrico congelado)",
  pontos: PONTOS_PARAMETRICO,
};

/**
 * QUANTAS CAMADAS A TOUCA EMITE — derivada do DADO, nunca do emissor.
 *
 * Se ela fosse lida do compositor, concordaria com qualquer coisa que ele fizesse.
 * As três famílias emitem números diferentes, e cada uma pelo próprio motivo:
 *
 * - **paramétrica**: sempre 2 — a escura e a clara (a franja subida `DEGRAU`);
 * - **traçada sintetizada**: a massa (1), a clara se houver, e o traço se houver
 *   arcos — `.kk-cabelo-l` só sai quando `linhas` existe, senão seria regra emitida
 *   à toa;
 * - **traçada transcrita**: a massa cheia de tinta (1) e o núcleo (1) são
 *   obrigatórios — a banda preta É a diferença entre as duas —, mais a clara e as
 *   pretas internas se houverem.
 *
 * As extensões pagam por GRUPO e entram por fora; as `formas` irmãs não pagam nada,
 * porque saem como subpaths no mesmo `<path>` da massa.
 */
const camadasDaTouca = (c: Cabelo): number => {
  if (c.pontos) return 2;
  if (!c.massa) return 0;
  if (c.nucleo?.length) return 2 + (c.clara ? 1 : 0) + (c.pretas?.length ? 1 : 0);
  return 1 + (c.clara ? 1 : 0) + (c.linhas?.length ? 1 : 0);
};

/**
 * OS BYTES DAS DUAS PEÇAS PROMOVIDAS, medidos na promoção (2026-08-07).
 *
 * Eles estouram `ORCAMENTO_COMPOSTO.bytes` (10 240) e **isso não veta** — decisão A
 * do Doug, e o doc 15:463 já dizia que teto de bytes não veta arte aprovada. O
 * número fica aqui como registro exato em vez de sumir num teto folgado.
 *
 * Quando um destes se mover, a pergunta é a mesma dos selos: *por que uma peça
 * aprovada mudou?* — e a resposta não é editar este número.
 */
const BYTES_TRACADOS = { espetado: 13319, chanel: 11867, assimetrico: 14074 } as const;

describe("a base careca não paga nada pelo slot de cabelo", () => {
  const careca = svgDe();

  it("não declara --av-cabelo nem --av-cabelo-s", () => {
    // O teto da base é de REGRESSÃO (19 formas, 7 418 bytes). Variável emitida à
    // toa é a base crescendo para pagar uma camada que ela não tem.
    expect(careca).not.toContain("--av-cabelo");
  });

  it("não emite nenhuma das três regras de CSS do cabelo", () => {
    expect(careca).not.toContain(".kk-cabelo");
  });

  it("tem exatamente as 19 formas do Bloco 1d", () => {
    expect(formas(careca)).toBe(19);
  });
});

describe("com modelo, o cabelo é o único leitor de --av-cabelo", () => {
  const svg = svgDe("coque");

  it("declara as duas custom properties", () => {
    expect(svg).toContain("--av-cabelo:");
    expect(svg).toContain("--av-cabelo-s:");
  });

  it("a camada clara lê --av-cabelo e a escura lê --av-cabelo-s", () => {
    expect(svg).toMatch(/\.t \.kk-cabelo\{fill:var\(--av-cabelo\)\}/);
    expect(svg).toMatch(/\.t \.kk-cabelo-s\{fill:var\(--av-cabelo-s\)/);
  });

  it("a sobrancelha continua em --av-linha, e não seguiu o cabelo", () => {
    // A decisão do 2a.0, conferida agora COM cabelo na composição — que é a
    // situação em que ela poderia ter sido desfeita sem ninguém notar.
    const risco = svg.match(/\.t \.kk-risco\{([^}]*)\}/)?.[1] ?? "";
    expect(risco).toContain("stroke:var(--av-linha)");
    expect(risco).not.toContain("--av-cabelo");
  });
});

describe.each(MODELOS_CABELO)("o modelo %s", (modelo) => {
  const cabelo = CABELOS[modelo];

  it("não declara a lateral do crânio: as pontas da franja caem FORA da silhueta", () => {
    if (!cabelo.pontos) return; // o moicano não tem touca — ver o docstring de cabelo.ts
    const pontas = [cabelo.pontos[0], cabelo.pontos[cabelo.pontos.length - 1]];
    for (const p of pontas) {
      const { esq, dir } = bordasEm(p.y);
      const x = esq + p.t * (dir - esq);
      expect(x < esq || x > dir).toBe(true);
    }
  });

  it("cobre a coroa inteira, ou é o moicano — que mostra couro cabeludo de propósito", () => {
    // A mesma exigência da it de cima, perguntada pelo defeito em vez de pela
    // ponta: um cabelo que pare no meio do crânio deixa couro cabeludo à mostra.
    // Vale para as duas famílias, e é a única forma da pergunta que sobrevive a um
    // laço fechado, onde "a última ponta" é vizinha da primeira.
    const cobertura = coberturaDaCoroa(modelo);
    if (cobertura === null) {
      expect(modelo).toBe("moicano");
      return;
    }
    expect(cobertura).toBe(1);
  });

  it("está em UMA família só: `pontos` ou `massa`, nunca os dois", () => {
    // Com os dois, existiriam duas descrições da mesma borda — e `pathCabelo`
    // desenharia uma delas em silêncio, enquanto as réguas mediriam a outra.
    expect(Boolean(cabelo.pontos) && Boolean(cabelo.massa)).toBe(false);
  });

  it("não tem região clara vazando da massa", () => {
    // `Infinity` é o caso "não há o que conter": peça paramétrica (medida por
    // `sombraSobreAFranja`) ou massa chapada, sem clara.
    expect(contencaoDaClara(modelo)).toBeGreaterThanOrEqual(0);
  });

  it(`deixa testa sobre cada sobrancelha — ${FOLGA_ROSTO} u na desenhada, a arte na traçada`, () => {
    const f = folgaDoRosto(modelo);
    if (cabelo.massa) {
      // O piso da peça TRAÇADA não é `FOLGA_ROSTO` e não é verificável aqui: a folga
      // dela é um fato da arte, e o que o traço controla é não piorá-la — `folga da
      // arte − meio traço`, que exige o PNG do lado e é o gate 3 de
      // `avatar:fidelidade`. Um piso absoluto aqui reprovaria a arte, não o traço.
      //
      // O que sobra é a não-vacuidade, e ela não é formalidade: sem a massa nos
      // trechos, `folgaDoRosto` devolveria `Infinity` por não ter o que medir — o
      // modo de falha que o R10 de `folgaDoRosto enxerga a massa` guarda.
      expect(f.esq).toBeLessThan(Infinity);
      expect(f.dir).toBeLessThan(Infinity);
      return;
    }
    expect(Math.min(f.esq, f.dir)).toBeGreaterThanOrEqual(FOLGA_ROSTO);
  });

  it(`ancora toda extensão ≥ ${SANGRIA} unidades dentro da cabeça`, () => {
    // Sem isto, um coque pode ficar tangente ao crânio: lê como adesivo, e meio
    // pixel de antialiasing abre uma fresta de fundo entre as duas peças.
    for (const fundo of ancoragemDasExtensoes(modelo)) {
      expect(fundo).toBeGreaterThanOrEqual(SANGRIA);
    }
  });

  it("passa no contrato de custom properties e cabe no orçamento de FORMAS", () => {
    // As formas valem para as duas famílias: o teto de 26 sai da conta do ranking, e
    // uma peça traçada não paga forma por ponto. Medido na promoção: espetado 22,
    // chanel 23.
    const svg = svgDe(modelo);
    expect(conferirSvg(svg)).toEqual([]);
    expect(formas(svg)).toBeLessThanOrEqual(ORCAMENTO_COMPOSTO.formas);
  });

  it(
    cabelo.massa
      ? "REGISTRA os bytes — o teto não veta arte aprovada (decisão A)"
      : "cabe no teto de bytes do orçamento composto",
    () => {
      const bytes = Buffer.byteLength(svgDe(modelo), "utf-8");
      if (cabelo.massa) {
        // DECISÃO A, 2026-08-06: `ORCAMENTO_COMPOSTO.bytes` é autoimposto e o doc
        // 15:463 declara que ele **não veta arte aprovada**. Uma peça traçada de arte
        // real tem mais pontos que uma paramétrica, e as duas promovidas estouram.
        //
        // O que substitui o teto é um assert de **valor exato**: o número não vira
        // teto folgado nem some do relatório — ele fica registrado, e cresce só
        // quando alguém o remede de propósito. É a mesma doutrina dos selos.
        //
        // Medido em 2026-08-07, na promoção:
        expect(bytes).toBe(BYTES_TRACADOS[modelo as keyof typeof BYTES_TRACADOS]);
        expect(bytes).toBeGreaterThan(ORCAMENTO_COMPOSTO.bytes); // o registro é do ESTOURO
        return;
      }
      expect(bytes).toBeLessThanOrEqual(ORCAMENTO_COMPOSTO.bytes);
    },
  );

  it("emite uma forma para cada peça declarada, e nenhuma vazia", () => {
    // O moicano não tem touca. Emitir `<path d="">` para ele custaria duas formas
    // do orçamento para desenhar nada — e um path vazio não acusa em lugar nenhum.
    //
    // A conta é derivada do DADO e não do emissor, senão ela concordaria com
    // qualquer coisa que o emissor fizesse. Paramétrico são sempre duas camadas (a
    // clara é a franja subida `DEGRAU`); traçado são duas com região clara e uma
    // quando a peça é chapada. As extensões pagam por GRUPO, não por peça: as do
    // mesmo lado da cabeça saem num `<path>` só, com subpaths.
    const svg = svgDe(modelo);
    expect(svg).not.toContain(`d=""`);
    const grupos = new Set((cabelo.extensoes ?? []).map((e) => Boolean(e.atras))).size;
    // A SOBRANCELHA QUE O CABELO COBRE NÃO É EMITIDA, e a conta desconta isso — do
    // DADO, como o resto desta linha. `assimetrico` cobre 97,6% da esquerda e sai com
    // 18 formas de base em vez de 19. Escrever "19 ou 18, tanto faz" seria a régua
    // concordando com o emissor, que é o que este teste existe para não fazer.
    const escondida = sobrancelhaEscondida(cabelo);
    const sobrancelhas = (escondida.esq ? 1 : 0) + (escondida.dir ? 1 : 0);
    expect(formas(svg)).toBe(19 - sobrancelhas + camadasDaTouca(cabelo) + grupos);
  });
});

describe("a touca é uma curva aberta fechada FORA da silhueta", () => {
  it("o fechamento são dois `L` e um `Z`, e nada mais", () => {
    // Se o fechamento virar curva, ele passa a ter custo de bytes e — pior —
    // deixa de ser obviamente invisível: alguém pode começar a desenhá-lo.
    const d = pathCabelo(CURTO_PARAMETRICO);
    expect(d.match(/L /g)?.length).toBe(2);
    expect(d.endsWith("Z")).toBe(true);
  });

  it("o moicano não tem touca, e `pathCabelo` devolve vazio", () => {
    expect(pathCabelo("moicano")).toBe("");
  });
});

/**
 * A SOMBRA QUE SEGUE A FORMA — a causa 4 da reprovação de 2026-08-03.
 *
 * O Doug reprovou os cinco com *"tudo muito quadrado, sem toque humano"*, e uma
 * das quatro causas era a sombra ser a mesma forma subida 22 unidades: faixa de
 * espessura constante, paralela em todo o percurso. O campo `Cabelo.sombra` deixa
 * a borda de baixo da camada clara ser uma curva própria.
 *
 * O primeiro teste daqui é o de REGRESSÃO e é o que garante que o campo saiu de
 * graça: sem `sombra` declarada, nada muda.
 */
describe("a faixa de sombra", () => {
  it("em todo modelo PARAMÉTRICO é paralela — min e max iguais a 22, a assinatura do defeito", () => {
    const parametricos = MODELOS_CABELO.filter((m) => CABELOS[m].pontos);
    // Se um dia não sobrar nenhum, é porque todos foram traçados — e aí quem mede
    // a mesma coisa é `contencaoDaClara`. Zero modelos aqui não pode passar calado.
    expect(parametricos.length).toBeGreaterThan(0);
    for (const modelo of parametricos) {
      const { min, max } = sombraSobreAFranja(modelo);
      expect(min).toBe(22);
      expect(max).toBe(22);
    }
  });

  /** A franja paramétrica, com a sombra afinando e engrossando ao longo dela. */
  const comSombra: Cabelo = {
    id: "coque",
    nome: "curto (sombra própria)",
    pontos: PONTOS_PARAMETRICO,
    sombra: PONTOS_PARAMETRICO.map((p, i) => ({ t: p.t, y: p.y - (12 + 22 * (i % 2)) })),
  };

  it("declarada, muda o path da camada clara — e não o da escura", () => {
    // O que falha antes do Bloco 2a.5: sem o campo, `pathCabeloClaro` só sabe
    // devolver a franja subida DEGRAU, e os dois lados seriam idênticos.
    expect(pathCabeloClaro(comSombra)).not.toBe(pathCabelo(comSombra, -22));
    expect(pathCabelo(comSombra)).toBe(pathCabelo(CURTO_PARAMETRICO));
  });

  it("declarada, a espessura VARIA ao longo da franja", () => {
    const { min, max } = sombraSobreAFranja(comSombra);
    expect(min).toBeGreaterThan(0);
    expect(max - min).toBeGreaterThan(10);
  });

  it("reprova quando a sombra desce abaixo da franja", () => {
    // Verificado invertendo o dado, como as três amarras do 2a.2. Este é o
    // vazamento que nenhuma outra régua enxerga: a camada clara é a única sem
    // contorno, então tinta clara abaixo da escura sai fora da silhueta preta —
    // e a folga do rosto continua verde, porque ela mede a franja.
    const invertida: Cabelo = {
      ...comSombra,
      sombra: PONTOS_PARAMETRICO.map((p) => ({ t: p.t, y: p.y + 15 })),
    };
    expect(sombraSobreAFranja(invertida).min).toBeLessThan(0);
  });
});

/**
 * A PEÇA TRAÇADA — o laço fechado que a arte obrigou a existir.
 *
 * A folha de fidelidade HSHC93 comparou a arte `curto-espetada` com o melhor traço
 * paramétrico possível e deu IoU 61,7%. A maior das quatro causas era a **cortina**
 * — a massa que desce ao lado do rosto até a bochecha, dentro da silhueta —, que
 * sozinha segurava ~220 unidades de desvio porque uma franja aberta é uma função de
 * `x` e cortina não é.
 *
 * A fixture daqui é um laço fechado COM cortina, feito à mão: ele não é arte, é a
 * topologia que a arte exige, para as réguas novas serem exercidas antes de existir
 * peça traçada no catálogo. Cada uma tem a sua inversão (R10) logo abaixo.
 */
describe("o laço fechado", () => {
  /** Borda de baixo da esquerda para a direita, cortina descendo, volta por cima. */
  const MASSA: readonly PontoFranja[] = [
    { t: -0.14, y: 236 },
    { t: 0.04, y: 300 }, // a cortina: desce DENTRO da silhueta e volta a subir
    { t: 0.14, y: 246 },
    { t: 0.24, y: 132 },
    { t: 0.5, y: 122 },
    { t: 0.78, y: 130 },
    { t: 1.0, y: 178 },
    { t: 1.16, y: 234 },
    { t: 1.2, y: 30 },
    { t: 0.5, y: 12 },
    { t: -0.2, y: 30 },
  ];

  /**
   * A região clara é um laço PRÓPRIO, e não a massa encolhida — e a tentativa de
   * encolher é que ensina por quê: com a cortina, a massa deixa de ser convexa, e
   * nem deslocar nem escalar em torno do centro mantém a curva dentro dela. O
   * traçador mede a clara na arte pelo mesmo motivo; ela não é derivável da massa.
   */
  const CLARA: readonly PontoFranja[] = [
    { t: 0.28, y: 108 },
    { t: 0.5, y: 100 },
    { t: 0.72, y: 106 },
    { t: 0.72, y: 52 },
    { t: 0.28, y: 52 },
  ];

  const tracado: Cabelo = {
    id: "coque",
    nome: "curto (traçado)",
    massa: MASSA,
    clara: CLARA,
  };

  it("desenha a massa como laço, sem o retângulo de fechamento da touca", () => {
    const d = pathCabelo(tracado);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).not.toContain("L "); // o fechamento por fora é do paramétrico
  });

  it("cobre a coroa, e uma massa que para no meio do crânio não cobre", () => {
    expect(coberturaDaCoroa(tracado)).toBe(1);

    // R10: o mesmo laço espremido para baixo do topo do crânio deixa a coroa nua.
    const baixa: Cabelo = { ...tracado, massa: MASSA.map((p) => ({ ...p, y: p.y + 140 })) };
    expect(coberturaDaCoroa(baixa)!).toBeLessThan(1);
  });

  it("contém a região clara, e reprova quando ela escapa da massa", () => {
    expect(contencaoDaClara(tracado)).toBeGreaterThanOrEqual(0);

    // R10: a clara descida para além da borda de baixo da massa. É o vazamento sem
    // contorno — a clara é a única camada sem traço, então ela sai como tinta solta
    // sobre o fundo, e nenhuma outra régua a enxerga.
    const vazando: Cabelo = { ...tracado, clara: CLARA.map((p) => ({ t: p.t, y: p.y + 40 })) };
    expect(contencaoDaClara(vazando)).toBeLessThan(0);
  });

  it("a folga do rosto enxerga a massa — não devolve `Infinity` por vacuidade", () => {
    // Sem a massa nos trechos, `folgaDoRosto` só olharia `pontos` e as extensões da
    // frente: uma peça traçada sem extensão nenhuma passaria por não ter nada a
    // medir, que é o modo de falha que este projeto já pagou duas vezes.
    const f = folgaDoRosto(tracado);
    expect(f.esq).toBeLessThan(Infinity);
    expect(f.dir).toBeLessThan(Infinity);

    // R10: a mesma peça com a borda de baixo empurrada 160 unidades sobre a testa
    // reprova. Sem esta metade, "finito" também sairia de um número medido no lugar
    // errado — é a inversão que prova que o que está sendo medido é a massa.
    const invadindo: Cabelo = {
      ...tracado,
      massa: MASSA.map((p) => (p.y > 100 && p.y < 200 ? { ...p, y: p.y + 160 } : p)),
    };
    expect(Math.min(...Object.values(folgaDoRosto(invadindo)))).toBeLessThan(FOLGA_ROSTO);
  });

  it("sem região clara, a peça é chapada e o compositor não emite forma vazia", () => {
    const chapado: Cabelo = { id: "coque", nome: "chapado", massa: MASSA };
    expect(pathCabeloClaro(chapado)).toBe("");
    expect(pathCabelo(chapado)).not.toBe("");
  });
});
