/**
 * A lógica de vestir, testada sem navegador e sem a arte real.
 *
 * Cada bloco aqui guarda um defeito que já apareceu nesta fase. A tabela de
 * variantes por DPR é o mais importante: a versão ingênua escolhia pela altura
 * CSS e mandava a variante de 128 para um ranking em tela retina, onde o
 * navegador precisava de 140 e AMPLIAVA.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import {
  CORRIGE_X,
  MATIZ_PANO,
  VARIANTES,
  corBota,
  corMedia,
  ehPano,
  formasDe,
  hsl,
  larguraDe,
  lerUniforme,
  registro,
  variantePara,
  type Forma,
} from "../uniforme";
import { BASE_H, BASE_W, Y_PESCOCO, Y_SOLA } from "../mascara-base";

describe("qual variante servir", () => {
  // Os oito casos obrigatórios: os quatro tamanhos do plano nos DPR que existem.
  it.each([
    [56, 1, 128],
    [56, 2, 128],
    [56, 3, 256],
    [70, 1, 128],
    [70, 2, 256],
    [125, 2, 256],
    [250, 2, 512],
    [425, 2, 1024],
    [425, 3, 1920],
  ])("%i px CSS em DPR %i → variante de %i", (css, dpr, esperado) => {
    expect(variantePara(css, dpr)).toBe(esperado);
  });

  it("NUNCA serve variante menor que o necessário — nada é ampliado", () => {
    for (const css of [32, 56, 70, 100, 125, 200, 250, 340, 425])
      for (const dpr of [1, 1.5, 2, 2.625, 3]) {
        const v = variantePara(css, dpr);
        const preciso = css * dpr;
        // a maior variante é o teto: acima dela, ampliar é inevitável
        if (preciso <= VARIANTES[VARIANTES.length - 1])
          expect(v, `${css}px @${dpr}x`).toBeGreaterThanOrEqual(preciso);
      }
  });

  it("DPR é limitado a 3 — acima disso a memória dobra sem ganho visível", () => {
    expect(variantePara(425, 3)).toBe(variantePara(425, 4));
    expect(variantePara(425, 3)).toBe(variantePara(425, 10));
  });

  it("DPR abaixo de 1 não encolhe a exigência", () => {
    expect(variantePara(128, 0.5)).toBe(variantePara(128, 1));
  });

  it("cai na maior variante quando nem ela basta", () => {
    expect(variantePara(4000, 3)).toBe(1920);
  });
});

describe("largura canônica", () => {
  it("sai sempre da razão do canvas da base", () => {
    for (const h of VARIANTES) expect(larguraDe(h)).toBe(Math.round((h * BASE_W) / BASE_H));
  });

  it("as cinco variantes têm a MESMA razão, a menos de arredondamento", () => {
    // É o que garante o mesmo enquadramento e o mesmo centro entre elas.
    const razoes = VARIANTES.map((h) => larguraDe(h) / h);
    const alvo = BASE_W / BASE_H;
    for (const r of razoes) expect(Math.abs(r - alvo)).toBeLessThan(0.01);
  });

  it("nenhuma largura é herdada de outra variante", () => {
    // Derivar 256 de 128 daria 170 por acidente; o teste fixa o valor canônico.
    expect(larguraDe(128)).toBe(85);
    expect(larguraDe(256)).toBe(170);
    expect(larguraDe(512)).toBe(341);
    expect(larguraDe(1024)).toBe(682);
    expect(larguraDe(1920)).toBe(1278);
  });
});

describe("classificação de pano", () => {
  const forma = (fill: string, cy: number, a = 5000): Forma => ({
    fill,
    d: "",
    a,
    bb: [0, cy - 10, 10, cy + 10],
  });

  it("oliva é pano", () => {
    expect(hsl("#78833B").h).toBeGreaterThanOrEqual(MATIZ_PANO);
    expect(ehPano(forma("#78833B", 900), 600)).toBe(true);
  });

  it("pele NÃO é pano, mesmo escura", () => {
    // A pele desta arte vive entre 17° e 29°. Nenhum desses tons pode virar pano.
    for (const pele of ["#FFC48F", "#F09A5E", "#E3884B", "#953C17", "#5A2610"]) {
      expect(hsl(pele).h).toBeLessThan(MATIZ_PANO);
      expect(ehPano(forma(pele, 900), 600), pele).toBe(false);
    }
  });

  it("marrom de bota seria entendido como PELE — é a razão da regra de arte", () => {
    // Uma bota marrom mudaria de cor junto com o tom do aluno. O teste registra
    // o comportamento para que ninguém o "conserte" sem entender.
    const marrom = "#6B4D2D";
    expect(hsl(marrom).h).toBeLessThan(MATIZ_PANO);
    expect(ehPano(forma(marrom, 900), 600)).toBe(false);
  });

  it("preto ABAIXO do pescoço é contorno, e é pano", () => {
    expect(ehPano(forma("#000000", 900), 600)).toBe(true);
  });

  it("preto ACIMA do pescoço é olho e sobrancelha, e vem da base", () => {
    // Sem este corte sobram fiapos escuros na testa do boneco vestido.
    expect(ehPano(forma("#000000", 300), 600)).toBe(false);
  });
});

describe("cor média do fundo de segurança", () => {
  const f = (fill: string, a: number): Forma => ({ fill, d: "", a, bb: [0, 0, 1, 1] });

  it("é ponderada pela ÁREA, não pela contagem", () => {
    // Uma forma grande decide a cor; cem lascas não.
    const media = corMedia([f("#000000", 1), f("#000000", 1), f("#78833B", 100000)]);
    expect(media).toBe("#78833b");
  });

  it("ignora o pano escuro do contorno e da bota", () => {
    // Só o pano grande, claro e de matiz de oliva entra na média — senão o fundo
    // sai quase preto e aparece como sombra onde o pano não alcança.
    const media = corMedia([f("#78833B", 50000), f("#1B1C0A", 40000)]);
    expect(hsl(media).lum).toBeGreaterThan(0.4);
  });

  it("cai para todas as formas quando nenhuma passa o filtro", () => {
    expect(() => corMedia([f("#1B1C0A", 100)])).not.toThrow();
  });
});

describe("cor de oclusão do pé", () => {
  const f = (fill: string, cy: number, a = 5000): Forma => ({ fill, d: "", a, bb: [0, cy - 5, 10, cy + 5] });
  const fig = [0, 0, 100, 1000] as [number, number, number, number];

  it("vem da BOTA, não do uniforme inteiro", () => {
    // Preencher a folga da bota com o oliva médio do uniforme recria o PEDESTAL
    // VERDE — o defeito oposto, que já custou uma rodada. A cor tem de ser escura.
    const pano = [f("#78833B", 500, 200000), f("#1B1C0A", 950, 30000)];
    const u = { pano, fig, corFundo: "#78833B" };
    expect(corBota(u)).not.toBe(corMedia(pano));
    expect(hsl(corBota(u)).lum).toBeLessThan(hsl(corMedia(pano)).lum);
  });

  it("olha só os 15% de baixo da figura", () => {
    const u = { pano: [f("#78833B", 100, 90000), f("#1B1C0A", 960, 9000)], fig, corFundo: "#78833B" };
    expect(corBota(u)).toBe("#1b1c0a");
  });

  it("ignora forma pequena, para o cadarço claro não clarear a média", () => {
    const u = {
      pano: [f("#1B1C0A", 950, 30000), f("#FFFFFF", 950, 100)],
      fig,
      corFundo: "#78833B",
    };
    expect(corBota(u)).toBe("#1b1c0a");
  });

  it("cai na cor de fundo quando não há bota", () => {
    const u = { pano: [f("#78833B", 100, 50000)], fig, corFundo: "#78833B" };
    expect(corBota(u)).toBe("#78833B");
  });
});

describe("registro", () => {
  const u = { fig: [100, 200, 900, 1400] as [number, number, number, number], pescoco: 400 };

  it("põe o pescoço do uniforme no pescoço da base", () => {
    const r = registro(u);
    expect(u.pescoco * r.escY + r.dy).toBeCloseTo(Y_PESCOCO, 6);
  });

  it("põe a sola do uniforme na sola da base", () => {
    const r = registro(u);
    expect(u.fig[3] * r.escY + r.dy).toBeCloseTo(Y_SOLA, 6);
  });

  it("a âncora dupla é o que resolve o pé aparecendo por baixo da bota", () => {
    // Com escala única, pescoço e sola não podem cair os dois no lugar.
    const r = registro(u);
    expect(r.escY).not.toBeCloseTo(r.escX, 4);
  });

  it("aplica a correção horizontal medida", () => {
    const r = registro(u);
    const centro = ((u.fig[0] + u.fig[2]) / 2) * r.escX + r.dx;
    expect(centro).toBeCloseTo(1278 + CORRIGE_X, 6);
  });

  it("reprova figura sem altura em vez de gerar NaN", () => {
    expect(() => registro({ fig: [0, 500, 10, 500], pescoco: 500 })).toThrow(/sem altura/);
  });
});

describe("a arte real de uniforme que está commitada", () => {
  const svg = readFileSync("scripts/avatar/fonte/uniformes/recruta.svg", "utf-8");

  it("é lida sem erro e tem pano", () => {
    const u = lerUniforme(svg);
    expect(u.pano.length).toBeGreaterThan(100);
    expect(u.arte.length).toBeGreaterThan(u.pano.length);
  });

  it("o retângulo de fundo do traçador é descartado", () => {
    const u = lerUniforme(svg);
    const [cw, ch] = u.canvas;
    expect(u.arte.some((p) => p.fill === "#000000" && p.a >= cw * ch * 0.25)).toBe(false);
    expect(formasDe(svg).some((p) => p.fill === "#000000" && p.a >= cw * ch * 0.25)).toBe(true);
  });

  it("o pescoço cai na metade de cima da figura", () => {
    const u = lerUniforme(svg);
    expect(u.pescoco).toBeGreaterThan(u.fig[1]);
    expect(u.pescoco).toBeLessThan((u.fig[1] + u.fig[3]) / 2);
  });

  it("a cor de fundo é o oliva do pano, não preto nem pele", () => {
    const { h, lum } = hsl(lerUniforme(svg).corFundo);
    expect(h).toBeGreaterThanOrEqual(MATIZ_PANO);
    expect(lum).toBeGreaterThan(0.3);
  });
});
