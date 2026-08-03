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
  pathCabeloClaro,
  sombraSobreAFranja,
} from "../cabelo";
import type { Cabelo } from "../cabelo";
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
  it("nos cinco de hoje é paralela — min e max iguais a 22, que é a assinatura do defeito", () => {
    for (const modelo of MODELOS_CABELO) {
      const { min, max } = sombraSobreAFranja(modelo);
      if (!CABELOS[modelo].pontos) {
        expect(min).toBe(Infinity); // moicano: não há touca para ter sombra
        continue;
      }
      expect(min).toBe(22);
      expect(max).toBe(22);
    }
  });

  /** A franja do `curto`, com a sombra afinando e engrossando ao longo dela. */
  const comSombra: Cabelo = {
    id: "curto",
    nome: "curto (sombra própria)",
    pontos: CABELOS.curto.pontos,
    sombra: CABELOS.curto.pontos!.map((p, i) => ({ t: p.t, y: p.y - (12 + 22 * (i % 2)) })),
  };

  it("declarada, muda o path da camada clara — e não o da escura", () => {
    // O que falha antes do Bloco 2a.5: sem o campo, `pathCabeloClaro` só sabe
    // devolver a franja subida DEGRAU, e os dois lados seriam idênticos.
    expect(pathCabeloClaro(comSombra)).not.toBe(pathCabelo(comSombra, -22));
    expect(pathCabelo(comSombra)).toBe(pathCabelo("curto"));
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
      sombra: CABELOS.curto.pontos!.map((p) => ({ t: p.t, y: p.y + 15 })),
    };
    expect(sombraSobreAFranja(invertida).min).toBeLessThan(0);
  });
});
