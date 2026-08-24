/**
 * A CONTA DE CABELOS DO PAINEL TEM DE BATER COM O CATÁLOGO.
 *
 * `medirCabelos` alimenta `docs/ESTADO.md`, que o `CLAUDE.md` manda ler primeiro —
 * *"comece por aqui"*. Ele nasceu para matar um "tem 7" escrito à mão, e por isso
 * um número errado aqui é pior que nenhum: ele parece medido.
 *
 * O defeito que fundou este arquivo (2026-08-24): a regex exigia uma **barra antes
 * de cada nome** (`/\|\s*"[^"]+"/g`), e o primeiro membro de uma união não tem barra
 * à frente. A conta saía sempre **uma a menos** — 3 para os 4 cabelos do catálogo —
 * e com um modelo só ela diria **0**, que é o valor de "não há catálogo".
 *
 * A asserção que importa é a primeira: o painel contra a realidade. As outras três
 * existem porque um erro de fronteira só se prova nas pontas.
 */
import { readFileSync } from "fs";

import { describe, expect, it } from "vitest";

import { medirCabelos } from "../estado";
import { MODELOS_CABELO } from "../../src/lib/avatar/estilo/cabelo";

const FONTE = "src/lib/avatar/estilo/cabelo.ts";

describe("medirCabelos", () => {
  it("conta o mesmo que o catálogo vivo — o painel não pode discordar do produto", () => {
    const { tem } = medirCabelos(readFileSync(FONTE, "utf8"));
    expect(tem).toBe(MODELOS_CABELO.length);
  });

  it("conta o PRIMEIRO membro da união, que não tem barra à frente", () => {
    const um = `export type ModeloCabelo = "moicano";`;
    expect(medirCabelos(um).tem).toBe(1);
  });

  it("conta os quatro de uma união escrita em várias linhas", () => {
    const quatro = [
      "export type ModeloCabelo =",
      '  | "moicano"',
      '  | "chanel"',
      '  | "assimetrico"',
      '  | "burst-fade";',
    ].join("\n");
    expect(medirCabelos(quatro).tem).toBe(4);
  });

  it("ignora ASPAS dentro de comentário — prosa não é membro da união", () => {
    // O caso real: `aprovou as catorze de uma vez ("os 13 aprovados", mais esta)`.
    const comAspas = [
      "export type ModeloCabelo =",
      '  // o Doug aprovou de uma vez ("os 13 aprovados", mais esta)',
      '  | "moicano"',
      '  | "chanel";',
    ].join("\n");
    expect(medirCabelos(comAspas).tem).toBe(2);
  });

  it("ignora PONTO E VÍRGULA dentro de comentário — senão a união fecha cedo", () => {
    // O caso real: `ela reusa o slug limpo; a arte que reprovou ficou no disco`.
    // Sem o conserto isto devolve 1: a união "acaba" no `;` da prosa.
    const comPontoEVirgula = [
      "export type ModeloCabelo =",
      '  | "moicano"',
      "  // ela reusa o slug limpo; a arte que reprovou ficou no disco",
      '  | "espetado"',
      '  | "maria-chiquinha";',
    ].join("\n");
    expect(medirCabelos(comPontoEVirgula).tem).toBe(3);
  });

  it("ignora comentário de BLOCO, que é como o resto do arquivo documenta", () => {
    const comBloco = [
      "export type ModeloCabelo =",
      '  /** o primeiro; e o "segundo" */',
      '  | "moicano"',
      '  | "chanel";',
    ].join("\n");
    expect(medirCabelos(comBloco).tem).toBe(2);
  });

  it("contra-controle: fonte sem a união devolve 0, e 0 quer dizer 'não medi'", () => {
    expect(medirCabelos("export type Outra = 'x';").tem).toBe(0);
    expect(medirCabelos(null).tem).toBe(0);
  });
});
