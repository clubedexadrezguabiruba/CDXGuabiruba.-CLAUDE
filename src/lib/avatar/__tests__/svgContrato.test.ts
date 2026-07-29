/**
 * Gate do Bloco 1: os dois defeitos que este projeto já pagou para aprender.
 *
 * Os dois falham em silêncio no navegador — nada no console, nada quebrado,
 * só a tela mentindo. É por isso que a conferência é código e não disciplina.
 */

import { describe, expect, it } from "vitest";
import { conferirSvg, exigirSvgValido } from "../svgContrato";
import { boneco } from "../prototipo/boneco";
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
  it("o boneco passa em todas as combinações do protótipo", () => {
    for (const chapeu of [undefined, "bone", "elmo", "coroa"] as const) {
      for (const uniforme of [undefined, "soldado", "general"] as const) {
        const svg = boneco({ cabecas: 3, chapeu, uniforme });
        expect(conferirSvg(svg), `chapéu=${chapeu} uniforme=${uniforme}`).toEqual([]);
      }
    }
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

describe("escopo de camada", () => {
  it("o uniforme redeclara --av-roupa no próprio <g>, não no <svg>", () => {
    // É o que faz a patente ganhar por cascata e o boneco sem uniforme cair
    // sozinho no traje da base — o fallback do 5.9, de graça.
    const svg = boneco({ cabecas: 3, uniforme: "general" });
    const camada = svg.match(/<g class="camada-outfit"[^>]*style="([^"]*)"/);
    expect(camada?.[1]).toContain("--av-roupa:");
    expect(camada?.[1]).toContain("--av-detalhe:");
  });

  it("o chapéu traz as suas cores na própria camada", () => {
    const svg = boneco({ cabecas: 3, chapeu: "coroa" });
    const camada = svg.match(/<g class="camada-head"[^>]*style="([^"]*)"/);
    expect(camada?.[1]).toContain("--av-item-a:");
    expect(camada?.[1]).toContain("--av-item-b:");
  });

  it("dois bonecos com chapéus diferentes não compartilham cor de item", () => {
    const coroa = boneco({ cabecas: 3, chapeu: "coroa" });
    const bone = boneco({ cabecas: 3, chapeu: "bone" });
    const cor = (s: string) => s.match(/--av-item-a:([^;"]+)/)?.[1];
    expect(cor(coroa)).not.toBe(cor(bone));
  });
});
