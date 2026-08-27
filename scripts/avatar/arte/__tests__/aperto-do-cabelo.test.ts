/**
 * A TABELA DE APERTO — o arquivo é ENTRADA da esteira, e entrada tem de voltar
 * exatamente como entrou.
 *
 * Estes testes existem por um modo de falha já visto nesta rota duas vezes: entrada
 * que se perde em silêncio. A correção de oclusão nasceu dentro de um `.gitignore`
 * que a engolia, e a mão do Doug na `boina` envelheceu contra uma proposta nova sem
 * nada reprovar. Aqui a trava é a ida-e-volta: o que o editor grava é o que a
 * esteira lê, byte a byte, e `1` nunca ocupa uma linha.
 */

import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { afterAll, describe, expect, it } from "vitest";

import {
  APERTO_MAX,
  APERTO_MIN,
  apertoDoPar,
  chaveDoPar,
  gravarAperto,
  lerAperto,
} from "../aperto-do-cabelo";

const pasta = mkdtempSync(join(tmpdir(), "aperto-"));
const arq = join(pasta, "aperto.json");
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

describe("a tabela de aperto", () => {
  it("arquivo ausente é tabela vazia, não erro", () => {
    expect(lerAperto(join(pasta, "não-existe.json"))).toEqual({});
  });

  it("ida e volta preserva o valor", () => {
    gravarAperto({ "chapeu-bone|chanel": 0.92 }, arq);
    expect(lerAperto(arq)).toEqual({ "chapeu-bone|chanel": 0.92 });
  });

  it("⚠️ `1` OCUPA linha — é decisão, e é o que separa dela o par que ninguém olhou", () => {
    // Este teste já afirmou o CONTRÁRIO, e a inversão é a correção de um buraco: com
    // o 1 fora do arquivo, um cabelo novo entrava com nove pares indistinguíveis de
    // "decidido: não aperta", e `arte:apertos` não tinha como reprovar. Quem apaga o
    // 1 é o gerador do catálogo, para o SVG continuar saindo byte a byte igual.
    gravarAperto({ "chapeu-bone|chanel": 0.92, "chapeu-boina|pixie": APERTO_MAX }, arq);
    expect(lerAperto(arq)).toEqual({ "chapeu-bone|chanel": 0.92, "chapeu-boina|pixie": APERTO_MAX });
  });

  it("valor abaixo do piso não entra — abaixo dele o penteado deixa de ser ele", () => {
    gravarAperto({ "chapeu-bone|chanel": APERTO_MIN - 0.01 }, arq);
    expect(lerAperto(arq)).toEqual({});
  });

  it("sai ordenado, para o diff mostrar a decisão que mudou", () => {
    gravarAperto({ "z|z": 0.9, "a|a": 0.9, "m|m": 0.9 }, arq);
    const cru = lerAperto(arq);
    expect(Object.keys(cru)).toEqual(["a|a", "m|m", "z|z"]);
  });

  it("arquivo corrompido é tabela vazia, nunca exceção", () => {
    writeFileSync(arq, "isto não é json {{{");
    expect(lerAperto(arq)).toEqual({});
  });

  it("linha que não é número é descartada, não confiada", () => {
    writeFileSync(arq, JSON.stringify({ "a|a": "0.9", "b|b": null, "c|c": 0.9 }));
    expect(lerAperto(arq)).toEqual({ "c|c": 0.9 });
  });

  it("par ausente vale 1 — é o que faz o SVG sair byte a byte igual", () => {
    expect(apertoDoPar({}, "chapeu-bone", "chanel")).toBe(APERTO_MAX);
    expect(apertoDoPar({ [chaveDoPar("chapeu-bone", "chanel")]: 0.88 }, "chapeu-bone", "chanel")).toBe(0.88);
  });
});
