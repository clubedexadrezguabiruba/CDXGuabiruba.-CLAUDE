/**
 * Gate do Bloco 1: os dois defeitos que este projeto já pagou para aprender.
 *
 * Os dois falham em silêncio no navegador — nada no console, nada quebrado,
 * só a tela mentindo. É por isso que a conferência é código e não disciplina.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { conferirSvg, exigirSvgValido } from "../svgContrato";
import { peaozinho } from "../prototipo/pet";

describe("comentário dentro do <style>", () => {
  it("reprova o caso que custou tempo real", () => {
    // Um `/* ... <path> ... */` fez o navegador descartar TODAS as regras
    // seguintes: `.b` nunca chegou a existir.
    const svg = `<svg><style>
      .a { fill: red }
      /* ajusta o traço do <path> do braço */
      .b { fill: blue }
    </style></svg>`;
    const problemas = conferirSvg(svg);
    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("comentario-no-style");
  });

  it("não confunde comentário fora do <style>", () => {
    const svg = `<svg><!-- isto é inofensivo --><style>.a{fill:red}</style></svg>`;
    expect(conferirSvg(svg)).toEqual([]);
  });
});

describe("custom property fora do contrato", () => {
  it("pega o erro de digitação que renderizaria preto", () => {
    const svg = `<svg style="--av-pelle:#FFF"><style>.a{fill:var(--av-pelle)}</style></svg>`;
    const problemas = conferirSvg(svg);
    expect(problemas.every((p) => p.tipo === "propriedade-fora-do-contrato")).toBe(true);
    expect(problemas[0].detalhe).toContain("--av-pelle");
  });

  it("aceita as congeladas", () => {
    const svg = `<svg style="--av-pele:#FFF"><style>.a{fill:var(--av-pele)}</style></svg>`;
    expect(conferirSvg(svg)).toEqual([]);
  });

  it("reprova variável do app, porque o SVG tem de ser autossuficiente", () => {
    // Um SVG que lê `--cor-do-tema` funciona dentro do app e quebra em
    // qualquer outro lugar — aberto sozinho, na folha de contato, no e-mail.
    // Toda cor que ele lê precisa vir do contrato.
    const svg = `<svg><style>.a{color:var(--cor-do-tema)}</style></svg>`;
    const problemas = conferirSvg(svg);
    expect(problemas).toHaveLength(1);
    expect(problemas[0].detalhe).toContain("--cor-do-tema");
  });
});

describe("o que o projeto emite hoje", () => {
  it("a base que a aplicação serve passa", () => {
    // Antes a cobaia era o boneco do protótipo, gerado em código. Ele foi
    // apagado quando a arte vetorizada chegou, e a cobaia passou a ser o
    // arquivo de verdade — o mesmo que o navegador baixa.
    const svg = readFileSync("public/items/base/avatar-base-neutro.svg", "utf8");
    expect(conferirSvg(svg)).toEqual([]);
  });

  it("o pet passa", () => {
    expect(conferirSvg(peaozinho())).toEqual([]);
  });

  it("exigirSvgValido lança com a origem no texto", () => {
    expect(() => exigirSvgValido(`<svg><style>/* x */</style></svg>`, "pet raposa")).toThrow(
      /pet raposa/,
    );
  });
});

/*
 * DÍVIDA REGISTRADA — escopo de camada.
 *
 * Aqui viviam três testes que provavam o desenho de cascata do protótipo: o
 * uniforme redeclarando `--av-roupa` no PRÓPRIO `<g>` em vez de no `<svg>`, o
 * chapéu trazendo as cores na própria camada, e dois chapéus diferentes não
 * brigando pela mesma variável. É o que fazia a patente ganhar por cascata e o
 * boneco sem uniforme cair sozinho no traje da base — o fallback do 5.9, de
 * graça.
 *
 * Eles foram apagados com o protótipo porque o alvo deixou de existir: a base
 * de hoje não tem camada de item nenhuma. A GARANTIA continua necessária, e
 * volta a ser testável no Bloco 5, quando a composição empilhar as camadas.
 * Sem isto escrito, ela desapareceria em silêncio junto com o código morto.
 */
