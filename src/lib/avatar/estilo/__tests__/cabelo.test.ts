/**
 * OS CINCO CABELOS — as amarras que substituem a régua que não existe.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * Todo o resto do estilo kokeshi sai de medição sobre a referência. O cabelo não
 * pode: a `referencia-base.png` é um boneco CARECA, e não há fonte de onde extrair
 * a forma de cinco cabelos. As coordenadas de `cabelo.ts` são **desenhadas**, e
 * chamar isso de medido seria a mesma falha que o `rosto-cor.test.ts` foi criado
 * para consertar — descrever uma intenção como se fosse um fato.
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
  ancoragemDasExtensoes,
  folgaDoRosto,
  pathCabelo,
} from "../cabelo";
import { compor } from "../compositor";
import { SANGRIA, bordasEm } from "../geometria";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";

const svgDe = (modelo?: (typeof MODELOS_CABELO)[number]) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t" });

const formas = (svg: string) => (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

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
  const svg = svgDe("curto");

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

  it(`deixa ≥ ${FOLGA_ROSTO} unidades de testa sobre cada sobrancelha`, () => {
    const f = folgaDoRosto(modelo);
    expect(Math.min(f.esq, f.dir)).toBeGreaterThanOrEqual(FOLGA_ROSTO);
  });

  it(`ancora toda extensão ≥ ${SANGRIA} unidades dentro da cabeça`, () => {
    // Sem isto, um coque pode ficar tangente ao crânio: lê como adesivo, e meio
    // pixel de antialiasing abre uma fresta de fundo entre as duas peças.
    for (const fundo of ancoragemDasExtensoes(modelo)) {
      expect(fundo).toBeGreaterThanOrEqual(SANGRIA);
    }
  });

  it("passa no contrato de custom properties e cabe no orçamento composto", () => {
    const svg = svgDe(modelo);
    expect(conferirSvg(svg)).toEqual([]);
    expect(formas(svg)).toBeLessThanOrEqual(26);
    expect(Buffer.byteLength(svg, "utf-8")).toBeLessThanOrEqual(10240);
  });

  it("emite uma forma para cada peça declarada, e nenhuma vazia", () => {
    // O moicano não tem touca. Emitir `<path d="">` para ele custaria duas formas
    // do orçamento para desenhar nada — e um path vazio não acusa em lugar nenhum.
    const svg = svgDe(modelo);
    expect(svg).not.toContain(`d=""`);
    const camadasDeTouca = cabelo.pontos ? 2 : 0;
    const esperado = 19 + camadasDeTouca + (cabelo.extensoes?.length ?? 0);
    expect(formas(svg)).toBe(esperado);
  });
});

describe("a touca é uma curva aberta fechada FORA da silhueta", () => {
  it("o fechamento são dois `L` e um `Z`, e nada mais", () => {
    // Se o fechamento virar curva, ele passa a ter custo de bytes e — pior —
    // deixa de ser obviamente invisível: alguém pode começar a desenhá-lo.
    const d = pathCabelo("curto");
    expect(d.match(/L /g)?.length).toBe(2);
    expect(d.endsWith("Z")).toBe(true);
  });

  it("o moicano não tem touca, e `pathCabelo` devolve vazio", () => {
    expect(pathCabelo("moicano")).toBe("");
  });
});
