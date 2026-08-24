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
  sobrancelhaCoberta,
  pathCabelo,
  pathCabeloClaro,
  pathCabeloNucleo,
  pathCabeloPretas,
  sobrancelhaEscondida,
  sombraSobreAFranja,
} from "../cabelo";
import type { Cabelo, PontoFranja } from "../cabelo";
import { compor } from "../compositor";
import { SANGRIA, bordasEm } from "../geometria";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";

// Aceita `Cabelo` além do nome de modelo desde 2026-08-24: com `MODELOS_PARAMETRICOS`
// vazia, os blocos que medem aquela família só têm fixture para compor.
const svgDe = (modelo?: Parameters<typeof compor>[0]["modeloCabelo"]) =>
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

/**
 * O `id` que as FIXTURAS sintéticas deste arquivo carregam — e ele é rótulo, não alvo.
 *
 * O que se mede abaixo é a geometria **declarada na fixture**: pontos, massa, sombra.
 * A peça do catálogo com esse nome nunca é lida. O campo existe porque `Cabelo["id"]`
 * é a união fechada `ModeloCabelo`, então a fixture precisa de UM nome vivo.
 *
 * Era `"coque"` até 2026-08-24, quando o Doug apagou aquele modelo. Ficar num só
 * lugar é o conserto: com o nome escrito em cinco fixtures, a próxima poda de elenco
 * volta a quebrar cinco linhas em vez de uma.
 */
const ID_FIXTURA = "chanel" as const;

const CURTO_PARAMETRICO: Cabelo = {
  id: ID_FIXTURA,
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
  // A TONAL NÃO TEM TOUCA — e devolver 0 aqui é o certo, não uma falta.
  //
  // Ela não é clipada pelo crânio: é peça sobreposta, e as duas passadas dela saem
  // por `sobrepor()`, longe de `cabeloNoCranio`. Quem conta as camadas dela é o
  // bloco "a família tonal" no fim deste arquivo, e o censo da pilha.
  if (c.tonal) return 0;
  if (!c.massa) return 0;
  if (c.nucleo?.length) return 2 + (c.clara ? 1 : 0) + (c.pretas?.length ? 1 : 0);
  return 1 + (c.clara ? 1 : 0) + (c.linhas?.length ? 1 : 0);
};

/**
 * OS BYTES DAS PEÇAS DE ARTE PROMOVIDAS, medidos na promoção de cada uma.
 *
 * Três dos quatro estouram `ORCAMENTO_COMPOSTO.bytes` (10 240) e **isso não veta** —
 * decisão A do Doug, e o doc 15:463 já dizia que teto de bytes não veta arte
 * aprovada. O número fica aqui como registro exato em vez de sumir num teto folgado.
 *
 * ⚠️ **O `moicano` CABE (9 731), e é o primeiro que cabe.** Até 2026-08-22 este
 * bloco afirmava o estouro com um `toBeGreaterThan`, como se peça de arte fosse
 * sempre mais pesada que paramétrica — e a tonal desmentiu: ela é o mesmo `d` duas
 * vezes, e quando o `d` é curto o composto sai menor que a crista de 11 pontos que
 * ela substituiu. A afirmação virou este parágrafo, que é onde ela sempre foi;
 * quem reprova é o valor exato abaixo, que não mudou de papel.
 *
 * Quando um destes se mover, a pergunta é a mesma dos selos: *por que uma peça
 * aprovada mudou?* — e a resposta não é editar este número.
 */
const BYTES_DA_ARTE = {
  espetado: 13319,
  // TONAL, promovida em 2026-08-22 — e o número CAIU de 14 074 para 12 176 nessa
  // migração, o que é o padrão da família e não uma peça que encolheu: a tonal
  // troca massa + núcleo + claras + pretas por silhueta + máscara, e o DEFLATE
  // deduz a repetição do `d`. Ver as duas linhas abaixo, que caíram do mesmo jeito.
  assimetrico: 12176,
  // TONAL, promovida em 2026-08-22. Ela paga o `d` DUAS VEZES — a silhueta preta e a
  // mesma forma vestida pela máscara — e ainda assim o boneco composto sai mais leve
  // em gzip que a versão traçada (16,9 contra 17,8 KB em 30 bonecos, bancada do Bloco
  // A): o DEFLATE deduz a repetição, e não deduzia massa + núcleo + claras + pretas.
  chanel: 12620,
  // TONAL, promovida em 2026-08-22, e a PRIMEIRA peça de arte que CABE no teto:
  // 9 731 contra os 10 240 de `ORCAMENTO_COMPOSTO.bytes`. Ver o `it` abaixo — a
  // asserção que dizia "o registro é do estouro" caiu com ela.
  moicano: 9731,
  // TONAL desde a origem, e a PRIMEIRA peça que ENTRA no elenco em vez de
  // substituir — as outras eram um elenco fechado sendo refeito peça a peça. Por
  // isso ela é a primeira que exigiu migration: `avatar_hair_catalog` guardava uma
  // linha por slug, e um cabelo desenhado e não semeado é opção que a tela oferece
  // e o servidor nega. Ela entrou no catálogo em 20260823110000, já na gramática
  // nova, como `rare`.
  "burst-fade": 11616,
} as const;

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
  // A peça é a FIXTURE paramétrica, e não uma do catálogo. O bloco mede as duas
  // classes da touca — `.kk-cabelo` (clara) e `.kk-cabelo-s` (escura) —, que só a
  // família paramétrica emite. Ele compunha `svgDe("coque")` até 2026-08-24; com o
  // `coque` apagado, apontar para uma peça viva põe uma TONAL aqui, e a tonal não
  // emite nenhuma das duas: o teste reprovaria por trocar de família, não por defeito.
  const svg = svgDe(CURTO_PARAMETRICO);

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
    // ⚠️ `null` ERA A SAÍDA DO MOICANO, e ela aprovava por VACUIDADE.
    //
    // Enquanto ele era paramétrico não havia tabela de pontos nem `d` para amostrar,
    // então a régua não tinha o que medir e devolvia nada — e este teste dava por
    // atendida a exceção sem ter olhado um pixel. Desde a promoção tonal dele
    // (2026-08-22) `poligonoDoTracado` alimenta a régua, e nenhum dos cinco modelos
    // devolve `null`. Esta linha existe para que voltar àquele estado REPROVE.
    expect(cobertura, "a régua não teve o que medir — aprovar aqui é vacuidade").not.toBeNull();
    if (modelo === "moicano") {
      // O couro cabeludo à mostra dos dois lados **é** o moicano, e a exceção
      // continua sendo dele. O que mudou é que ela passou a ser um NÚMERO: a peça
      // cobre 48,5% da coroa, medido na arte aprovada pelo Doug em 2026-08-22.
      // Antes a exceção era "a régua não mediu", que valia para qualquer coisa.
      expect(cobertura).toBeCloseTo(0.4847, 4);
      return;
    }
    expect(cobertura).toBe(1);
  });

  it("está em UMA família só: `pontos`, `massa` ou `tonal` — nunca duas", () => {
    // Com duas, existiriam duas descrições da mesma borda — e `pathCabelo`
    // desenharia uma delas em silêncio, enquanto as réguas mediriam a outra.
    //
    // O par mais caro é `massa` + `tonal`: a máscara de luminosidade é recortada na
    // silhueta EXATA que o `potrace` devolveu, então uma massa decimada por corda ao
    // lado dela poria o claro-escuro fora de registro com a peça que o pinta.
    const familias = [
      cabelo.pontos && "pontos",
      cabelo.massa && "massa",
      cabelo.tonal && "tonal",
    ].filter(Boolean);
    expect(familias.length, `declara ${familias.join(" + ")}`).toBeLessThanOrEqual(1);
  });

  it("não tem região clara vazando da massa", () => {
    // `Infinity` é o caso "não há o que conter": peça paramétrica (medida por
    // `sombraSobreAFranja`) ou massa chapada, sem clara.
    expect(contencaoDaClara(modelo)).toBeGreaterThanOrEqual(0);
  });

  it(`deixa testa sobre cada sobrancelha — ${FOLGA_ROSTO} u na desenhada, a arte na traçada`, () => {
    const f = folgaDoRosto(modelo);
    if (cabelo.massa || cabelo.tonal) {
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
    cabelo.massa || cabelo.tonal
      ? "REGISTRA os bytes — o teto não veta arte aprovada (decisão A)"
      : "cabe no teto de bytes do orçamento composto",
    () => {
      const bytes = Buffer.byteLength(svgDe(modelo), "utf-8");
      if (cabelo.massa || cabelo.tonal) {
        // DECISÃO A, 2026-08-06: `ORCAMENTO_COMPOSTO.bytes` é autoimposto e o doc
        // 15:463 declara que ele **não veta arte aprovada**. Uma peça traçada de arte
        // real tem mais pontos que uma paramétrica, e as duas promovidas estouram.
        //
        // O que substitui o teto é um assert de **valor exato**: o número não vira
        // teto folgado nem some do relatório — ele fica registrado, e cresce só
        // quando alguém o remede de propósito. É a mesma doutrina dos selos.
        //
        // Medido em 2026-08-07, na promoção:
        expect(bytes).toBe(BYTES_DA_ARTE[modelo as keyof typeof BYTES_DA_ARTE]);
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
    // A TONAL PAGA PELO QUE DECLARA, e não por uma constante: ela não tem touca (não é
    // clipada pelo crânio — ver `camadasDaTouca`), e o que ela emite são as passadas de
    // `tonal.formas`. Escrever "2" aqui seria a régua repetindo o emissor; `formas.length`
    // é o DADO, e o dia em que uma peça tonal tiver três passadas a conta acompanha.
    const passadas = cabelo.tonal?.formas.length ?? 0;
    expect(formas(svg)).toBe(19 - sobrancelhas + camadasDaTouca(cabelo) + passadas + grupos);
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
  it("na franja PARAMÉTRICA é paralela — min e max iguais a 22, a assinatura do defeito", () => {
    // ⚠️ **O CATÁLOGO FICOU SEM PARAMÉTRICO em 2026-08-24**, quando o Doug apagou o
    // `coque`. Este teste percorria `MODELOS_CABELO.filter(m => CABELOS[m].pontos)` e
    // tinha uma guarda contra vacuidade — `expect(parametricos.length).toBeGreaterThan(0)`
    // —, que fez o que devia: reprovou em vez de passar medindo lista vazia.
    //
    // A saída NÃO é apagar a guarda: o comportamento medido aqui é do EMISSOR, e ele
    // continua vivo em `sombraSobreAFranja`. O que mudou é de onde vem a franja —
    // fixture congelada, como o resto deste arquivo já faz desde `PONTOS_PARAMETRICO`.
    // A guarda vira a linha abaixo, que declara o estado e reprova se ele mudar sem
    // ninguém olhar: no dia em que um paramétrico voltar ao catálogo, este teste cobra
    // que ele seja medido junto.
    expect(
      MODELOS_CABELO.filter((m) => CABELOS[m].pontos),
      "voltou a existir paramétrico no catálogo — meça-o aqui, não só a fixture",
    ).toEqual([]);

    const { min, max } = sombraSobreAFranja(CURTO_PARAMETRICO);
    expect(min).toBe(22);
    expect(max).toBe(22);
  });

  /** A franja paramétrica, com a sombra afinando e engrossando ao longo dela. */
  const comSombra: Cabelo = {
    id: ID_FIXTURA,
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
    id: ID_FIXTURA,
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

  /**
   * O ACHADO G5, PRESO EM TESTE — a folga negativa de uma peça traçada NÃO é invasão.
   *
   * `folgaDoRosto` devolve o `y` mais baixo de qualquer trecho na faixa de `x` da
   * sobrancelha. Numa peça de laço fechado quem está lá embaixo é a CORTINA lateral,
   * ao lado da bochecha, e não a franja sobre o olho — e o número sai muito negativo
   * numa peça que não encosta no rosto. `sobrancelhaCoberta` responde a pergunta que
   * importa, e este teste prende as duas juntas para que ninguém "conserte" uma
   * arte aprovada por causa da leitura errada da outra.
   */
  it("folga negativa é a cortina, não a franja — e a sobrancelha segue livre", () => {
    const f = folgaDoRosto(tracado);
    const c = sobrancelhaCoberta(tracado);

    // A peça traçada tem folga MUITO negativa nas duas...
    expect(Math.min(f.esq, f.dir)).toBeLessThan(FOLGA_ROSTO);
    // ...e mesmo assim não põe um único ponto de tinta sobre nenhuma das duas.
    expect(c.esq).toBe(0);
    expect(c.dir).toBe(0);
    expect(c.de).toBe(21);

    // R10, e sem ela a asserção acima passaria por vacuidade: a MESMA peça com a
    // borda de cima empurrada para baixo sobre a testa cobre a sobrancelha de
    // verdade, e aí a régua tem de acusar.
    const invadindo: Cabelo = {
      ...tracado,
      massa: MASSA.map((p) => (p.y > 100 && p.y < 200 ? { ...p, y: p.y + 160 } : p)),
    };
    const ci = sobrancelhaCoberta(invadindo);
    expect(Math.max(ci.esq, ci.dir)).toBeGreaterThan(0);
  });

  it("sem região clara, a peça é chapada e o compositor não emite forma vazia", () => {
    const chapado: Cabelo = { id: ID_FIXTURA, nome: "chapado", massa: MASSA };
    expect(pathCabeloClaro(chapado)).toBe("");
    expect(pathCabelo(chapado)).not.toBe("");
  });

  /**
   * LAÇO VAZIO É AUSÊNCIA DE LAÇO — e até 2026-08-24 ele derrubava o compositor.
   *
   * `clara: []` é um array **truthy**, então `pathCabeloClaro` o tratava como "tem
   * clara", chamava `lacoTY([])` e `laco` lia `pts[0].x` de um array vazio:
   * `TypeError: Cannot read properties of undefined (reading 'x')`, com a pilha
   * inteira passando por `compor()`.
   *
   * Não é caso hipotético. `converter()` — a esteira traçada — devolve
   * exatamente isso ao traçar a arte `chanel.png`: massa de 43 pontos, **`clara`
   * com 0**, 27 `claras`, 18 `nucleo`, 26 `pretas`. Foi assim que o `arte:reguas`
   * estourou, e a reprovação estava certa.
   *
   * As quatro asserções cobrem os quatro caminhos que chegam a `laco`, porque a
   * guarda que as fecha é uma só e a régua tem de provar que ela vale para todos:
   * `massa` (:1042), `clara`/`claras` (:1061), `nucleo` (:1078) e `pretas` (:1085).
   */
  it("laço VAZIO não derruba o compositor — ele não emite forma, que é o mesmo que não ter", () => {
    const base = { id: ID_FIXTURA, nome: "laço vazio", massa: MASSA } as const;

    expect(pathCabeloClaro({ ...base, clara: [] })).toBe("");
    expect(pathCabeloClaro({ ...base, claras: [[]] })).toBe("");
    expect(pathCabeloNucleo({ ...base, nucleo: [[]] })).toBe("");
    expect(pathCabeloPretas({ ...base, pretas: [[]] })).toBe("");

    // E a massa vazia, que é o caminho mais fatal dos quatro: sem esta linha a peça
    // inteira derrubava `compor()` em vez de sair chapada.
    expect(pathCabelo({ id: ID_FIXTURA, nome: "massa vazia", massa: [] })).toBe("");

    // O CONTRA-CONTROLE, e sem ele as cinco linhas acima passariam por vacuidade:
    // uma guarda que devolvesse "" para TUDO satisfaria todas elas.
    expect(pathCabeloClaro({ ...base, clara: MASSA })).not.toBe("");
    expect(pathCabelo(base)).not.toBe("");
  });
});

/**
 * A FAMÍLIA TONAL — silhueta em vetor, claro-escuro em máscara de luminosidade.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA É MEDIDA POR UM LITERAL SINTÉTICO, E NÃO POR UM MODELO DO CATÁLOGO
 * ---------------------------------------------------------------------------
 *
 * Porque **o catálogo não tem nenhum**, e esse é o estado correto de 2026-08-22: o
 * Doug decidiu refazer os cinco modelos neste padrão, arte a arte, com parecer dele
 * entre uma e outra. `MODELOS_TONAIS` está vazia de propósito.
 *
 * Um teste que esperasse a primeira promoção para nascer deixaria a espinha inteira
 * — o tipo, o ramo do compositor, o CSS que ela **não** emite — sem gate no bloco em
 * que ela foi escrita. A união `CabeloOuModelo` já permite compor um literal, e é o
 * mesmo recurso que `pilha-de-camadas.test.ts` usa pelo mesmo motivo.
 *
 * O `d` é um triângulo qualquer: aqui não se mede desenho, mede-se EMISSÃO.
 */
describe("a família tonal", () => {
  const D = "M 120 120 L 380 120 L 380 300 Z";
  const TONAL: Cabelo = {
    id: "chanel",
    nome: "sintético tonal",
    tonal: {
      formas: [
        { d: D, cor: "var(--av-linha)", semTraco: true },
        { d: D, cor: "var(--av-cabelo, #262626)", semTraco: true },
      ],
      tom: { arte: "/items/cabelo/zz-tonal-tom.png", x: 120, y: 120, w: 260, h: 180 },
    },
  };
  const svg = compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: TONAL, ns: "t" });

  it("emite as duas formas com o MESMO `d`, e a de cima vestida pela máscara", () => {
    // A de baixo é o preto que aparece onde a máscara cede; a de cima é a cor do
    // cabelo. `d` diferentes fariam o preto vazar pelas beiradas ou sumir.
    const paths = [...svg.matchAll(/<path d="([^"]+)"([^/]*)\/>/g)].filter((m) => m[1] === D);
    expect(paths, "as duas passadas da silhueta").toHaveLength(2);
    expect(paths[0][2]).toContain('fill="var(--av-linha)"');
    expect(paths[0][2]).not.toContain("mask=");
    expect(paths[1][2]).toContain('fill="var(--av-cabelo, #262626)"');
    expect(paths[1][2]).toContain('mask="url(#t-tom-cabelo)"');
  });

  it("a máscara leva o SLOT no id — é o que a impede de colidir com a do rosto", () => {
    // Um aluno de barba E cabelo põe DUAS máscaras no mesmo `<svg>`, e o ranking põe
    // 30 bonecos num documento só. `${ns}-tom-${slot}` é único nos dois eixos, pelo
    // mesmo motivo que `${ns}-fe` e `${ns}-fd` já são.
    expect(svg).toContain('<mask id="t-tom-cabelo"');
    expect(svg).not.toContain('id="t-tom-rosto"');
    expect(svg).toContain('href="/items/cabelo/zz-tonal-tom.png"');
  });

  it("`fill-rule=\"evenodd\"` nas duas — sem ela a janela de feição vira mancha", () => {
    // O `d` vem do `potrace`, que declara a regra na saída dele; a esteira extrai só
    // o `d`, então quem reemite é o compositor. Sem ela o SVG cai em `nonzero`, que
    // PREENCHE os buracos — foi assim que 100% do traço do sorriso virou barba em
    // 2026-08-20.
    const comRegra = [...svg.matchAll(/<path d="([^"]+)" fill-rule="evenodd"/g)].filter(
      (m) => m[1] === D,
    );
    expect(comRegra).toHaveLength(2);
  });

  it("NÃO emite regra de CSS de cabelo — a cor mora no dado, não na classe", () => {
    // `sobrepor()` escreve `fill` direto. Emitir `.kk-cabelo*` aqui seria CSS morto:
    // regra sem elemento correspondente, que ninguém vê e todo boneco paga. É o
    // avesso do que `folha-unica.test.ts` mede, e o avesso também custa.
    for (const classe of ["kk-cabelo", "kk-cabelo-s", "kk-cabelo-m", "kk-cabelo-l", "kk-cabelo-e"])
      expect(svg, `${classe} saiu sem elemento que a use`).not.toContain(`.${classe}{`);
    expect(svg).not.toContain('class="kk-cabelo');
  });

  it("`semTraco` nas duas: nenhum `kk-traco` por cima da peça (G29)", () => {
    // Peça de arte usa o contorno que o gerador pintou (5,2 u), não o `kk-traco` de
    // 12 u do compositor — com ele, bigode e boca fundem a 56 e a 32 px.
    const traco = [...svg.matchAll(/<path class="kk-traco"[^>]*d="([^"]+)"/g)];
    expect(traco.filter((m) => m[1] === D)).toHaveLength(0);
  });

  it("recolore: `--av-cabelo` e `--av-cabelo-s` continuam sendo emitidas", () => {
    // A cor é escolha do aluno (emenda à D27) e chega por custom property. Sem elas
    // o `fill` cai na reserva `#262626` e o boneco aparece de cabelo preto com loiro
    // escolhido — o defeito que `rosto-cor.test.ts` mede do lado da barba.
    expect(svg).toContain(`--av-cabelo:${CABELO[1]}`);
    expect(svg).toContain("--av-cabelo-s:");
  });

  it("passa no contrato do SVG e cabe no orçamento de FORMAS", () => {
    // Nenhuma custom property nova: a Regra Inviolável nº 4 continua de pé, e
    // `svgContrato.ts` reprovaria qualquer `--av-*` fora do contrato.
    expect(conferirSvg(svg)).toEqual([]);
    expect(formas(svg)).toBeLessThanOrEqual(ORCAMENTO_COMPOSTO.formas);
  });

  it("não emite touca nem extensão — a peça é UMA silhueta", () => {
    // `cabeloNoCranio` não é chamada (o ramo gateia antes), e `Cabelo.tonal` não tem
    // onde declarar extensão. Ver `temExtensao` em `camadas.ts`: uma extensão numa
    // peça tonal sairia como classe sem regra.
    expect(camadasDaTouca(TONAL)).toBe(0);
    expect(pathCabelo(TONAL)).toBe("");
    expect(pathCabeloClaro(TONAL)).toBe("");
  });

  it("a base careca continua intocada — o tonal não vaza para quem não tem cabelo", () => {
    // O teto de regressão da base é o teto absoluto do estilo, e o controle negativo
    // de todo bloco que mexe no slot.
    const careca = svgDe();
    expect(careca).not.toContain("--av-cabelo");
    expect(careca).not.toContain("-tom-cabelo");
    expect(formas(careca)).toBe(19);
  });
});
