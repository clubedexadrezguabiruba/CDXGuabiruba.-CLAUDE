/**
 * Gates estruturais do Bloco 2.
 *
 * Não julgam arte — isso é a folha de contato e o olho do usuário. Estes
 * travam o que, se quebrar, quebra em silêncio: o contrato do SVG, a
 * separação do cabelo em camada, e a âncora da mão.
 */

import { describe, expect, it } from "vitest";
import { ANCORAS, base } from "../arte/base";
import { conferirSvg } from "../svgContrato";
import { PELE, CABELO } from "../palette";

describe("contrato", () => {
  it("passa em todas as combinações de pele e cor de cabelo", () => {
    for (let p = 0; p < PELE.length; p++) {
      for (let c = 0; c < CABELO.length; c++) {
        expect(conferirSvg(base({ pele: p, corCabelo: c })), `pele ${p} cabelo ${c}`).toEqual([]);
      }
    }
  });

  it("passa nos dois acabamentos, na silhueta e sem cabelo", () => {
    for (const svg of [
      base({ acabamento: "chapado" }),
      base({ acabamento: "cel" }),
      base({ silhueta: true }),
      base({ modeloCabelo: null }),
      base({ reliquiaTeste: true }),
    ]) {
      expect(conferirSvg(svg)).toEqual([]);
    }
  });
});

/** Só os elementos desenhados, sem o bloco <style> — que é igual em todos. */
function desenho(svg: string): string {
  return svg.slice(svg.indexOf("</style>"));
}

describe("o cabelo é camada, não parte da base", () => {
  it("a base sem modelo não desenha um path de cabelo sequer", () => {
    const careca = desenho(base({ modeloCabelo: null }));
    expect(careca).not.toContain("camada-hair");
    expect(careca).not.toContain('class="c-cabelo');
  });

  it("com modelo, o cabelo vem dentro da própria camada", () => {
    const svg = base({ modeloCabelo: 1 });
    expect(svg).toContain('<g class="camada-hair">');
    // É o que permite a um modelo feminino simplesmente substituir esta
    // camada, sem precisar esconder cabelo de baixo — o headKnockout do v2.
    const camada = svg.slice(svg.indexOf('<g class="camada-hair">'));
    expect(camada).toContain('class="c-cabelo');
  });

  it("o corpo é idêntico com e sem cabelo", () => {
    // Compara os elementos desenhados antes da camada de cabelo. Trocar de
    // modelo não pode mexer em nada do corpo — é o que garante que os 5
    // modelos sejam intercambiáveis de verdade.
    const corpo = (s: string) => {
      const d = desenho(s);
      const i = d.indexOf('<g class="camada-hair">');
      return [...(i >= 0 ? d.slice(0, i) : d).matchAll(/<path[^>]*>/g)].map((m) => m[0]);
    };
    expect(corpo(base({ modeloCabelo: 1 }))).toEqual(corpo(base({ modeloCabelo: null })));
  });
});

describe("âncoras", () => {
  it("a mão fica dentro do canvas e abaixo do quadril", () => {
    const [x, y] = ANCORAS.mao;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(400);
    expect(y).toBeGreaterThan(250);
    expect(y).toBeLessThan(500);
  });

  it("a âncora da mão é simétrica ao eixo", () => {
    // O item de `hand` vai na mão esquerda de quem olha. Se a âncora saísse
    // do eixo por engano, a relíquia flutuaria — foi o bug da rodada 1, em
    // que a conta somava CX duas vezes.
    expect(ANCORAS.mao[0]).toBeLessThan(200);
    expect(400 - ANCORAS.mao[0]).toBeGreaterThan(200);
  });

  it("o recorte de cabeça é quadrado e cabe no canvas", () => {
    const { x, y, lado } = ANCORAS.recorteCabeca;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + lado).toBeLessThanOrEqual(400);
    expect(y + lado).toBeLessThanOrEqual(500);
  });
});

describe("isolamento de cor entre instâncias", () => {
  it("dois bonecos diferentes emitem o MESMO bloco <style>", () => {
    const bloco = (s: string) => s.slice(s.indexOf("<style>"), s.indexOf("</style>"));
    expect(bloco(base({ pele: 0, corCabelo: 0 }))).toBe(bloco(base({ pele: 7, corCabelo: 7 })));
  });

  it("nenhuma cor concreta sobrou dentro das regras, fora o branco", () => {
    const css = base().slice(base().indexOf("<style>"), base().indexOf("</style>"));
    const cores = [...css.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0].toUpperCase());
    expect(cores.filter((c) => c !== "#FFFFFF")).toEqual([]);
  });
});
