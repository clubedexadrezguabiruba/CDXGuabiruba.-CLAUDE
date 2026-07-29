import { describe, it, expect } from "vitest";
import { boneco } from "../prototipo/boneco";

/**
 * REGRESSÃO MEDIDA EM 2026-07-29.
 *
 * O `<style>` de um SVG inline é global à página. Enquanto as cores ficavam
 * dentro das regras (`.est .c-pele { fill: #D69763 }`), dois bonecos
 * diferentes na mesma página colidiam e o ÚLTIMO pintava todos: quatro alunos
 * de um ranking saíam idênticos, e a coroa de um herdava a cor do boné do
 * outro. Nada quebrava, nada aparecia no console — só a tela mentia.
 *
 * Isso inviabilizava o D30 inteiro (avatar em navbar, ranking, mural e
 * Companhia), que é a razão de o investimento em cosmético motivar alguém.
 *
 * A correção: cor vai em custom property no `<svg>`, e a regra referencia
 * `var()`. Assim todo `<style>` emitido é idêntico — duplicá-los deixa de ter
 * efeito — e a cor vem da variável de cada instância.
 *
 * Estes testes falham se alguém voltar a embutir cor na regra.
 */

function blocoStyle(svg: string): string {
  const m = svg.match(/<style>([\s\S]*?)<\/style>/);
  if (!m) throw new Error("SVG sem bloco <style>");
  return m[1];
}

function atributoStyle(svg: string): string {
  const m = svg.match(/<svg[^>]*\sstyle="([^"]*)"/);
  return m ? m[1] : "";
}

describe("boneco — isolamento de cor entre instâncias", () => {
  it("dois bonecos de configuração diferente emitem o MESMO <style>", () => {
    const claro = boneco({ cabecas: 3, pele: 0, cabelo: 0 });
    const escuro = boneco({ cabecas: 3, pele: 7, cabelo: 4 });
    expect(blocoStyle(claro)).toBe(blocoStyle(escuro));
  });

  it("a diferença de cor vive no atributo style do <svg>, por instância", () => {
    const claro = boneco({ cabecas: 3, pele: 0, cabelo: 0 });
    const escuro = boneco({ cabecas: 3, pele: 7, cabelo: 4 });
    expect(atributoStyle(claro)).not.toBe(atributoStyle(escuro));
    expect(atributoStyle(claro)).toMatch(/--av-pele:#/);
    expect(atributoStyle(escuro)).toMatch(/--av-cabelo:#/);
  });

  it("chapéu e uniforme também isolam — a coroa de um não pode virar o boné do outro", () => {
    const coroa = boneco({ cabecas: 3, chapeu: "coroa" });
    const bone = boneco({ cabecas: 3, chapeu: "bone" });
    const soldado = boneco({ cabecas: 3, uniforme: "soldado" });
    const general = boneco({ cabecas: 3, uniforme: "general" });

    expect(blocoStyle(coroa)).toBe(blocoStyle(bone));
    expect(blocoStyle(soldado)).toBe(blocoStyle(general));
    expect(atributoStyle(coroa)).not.toBe(atributoStyle(bone));
    expect(atributoStyle(soldado)).not.toBe(atributoStyle(general));
  });

  it("nenhuma cor concreta sobrou dentro das regras", () => {
    const css = blocoStyle(boneco({ cabecas: 3, pele: 5, cabelo: 2, chapeu: "elmo", uniforme: "general" }));
    // #FFFFFF é o único literal aceito: branco de olho e de brilho não é
    // recolorível por definição, então não tem por que virar variável.
    const cores = [...css.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
    expect(cores.filter((c) => c.toUpperCase() !== "#FFFFFF")).toEqual([]);
  });

  it("toda variável usada na regra é declarada na instância", () => {
    const svg = boneco({ cabecas: 3, chapeu: "coroa", uniforme: "general" });
    const usadas = new Set([...blocoStyle(svg).matchAll(/var\((--av-[a-z-]+)\)/g)].map((m) => m[1]));
    const declaradas = new Set([...atributoStyle(svg).matchAll(/(--av-[a-z-]+):/g)].map((m) => m[1]));
    for (const v of usadas) expect(declaradas).toContain(v);
  });
});
