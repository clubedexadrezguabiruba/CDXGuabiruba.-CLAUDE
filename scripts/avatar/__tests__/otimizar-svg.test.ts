/**
 * O SVGO precisa passar a arte pela faxina sem desmontar o que o recolorir e
 * a composição dependem. Cada teste aqui corresponde a um plugin do
 * preset-default que, ligado, quebraria alguma coisa em silêncio.
 */

import { describe, expect, it } from "vitest";
import { otimizar } from "../otimizar-svg";
import { boneco } from "../../../src/lib/avatar/prototipo/boneco";
import { peaozinho } from "../../../src/lib/avatar/prototipo/pet";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";

const vestido = () => boneco({ cabecas: 3, chapeu: "coroa", uniforme: "general" });

describe("o que a faxina não pode levar junto", () => {
  it("mantém as regras dentro do <style> em vez de inliná-las nos elementos", () => {
    // MEDIDO: com `inlineStyles` ligado (o default), o SVGO apagou .c-roupa,
    // .c-cabelo, .c-calca e .c-sapato do <style> e escreveu
    // style="fill:var(--av-sapato)" no elemento. Isso inviabiliza o 5.7, em
    // que as regras sobem para a folha global.
    const out = otimizar(vestido());
    for (const classe of [".c-pele", ".c-cabelo", ".c-roupa", ".c-calca", ".c-sapato"]) {
      expect(out, `regra ${classe}`).toContain(classe);
    }
    expect(out).not.toMatch(/style="fill:/);
  });

  it("preserva o viewBox, de que dependem os 4 tamanhos", () => {
    expect(otimizar(vestido())).toMatch(/viewBox="0 0 400 500"/);
  });

  it("preserva as camadas e as variáveis que elas declaram", () => {
    // `collapseGroups` funde um <g> nos filhos quando o julga vazio de
    // conteúdo. As camadas só carregam custom properties — se sumirem, o
    // chapéu e o uniforme voltam a brigar pelas mesmas variáveis.
    const out = otimizar(vestido());
    expect(out).toContain("camada-head");
    expect(out).toContain("camada-outfit");
    expect(out).toMatch(/--av-item-a:/);
    expect(out).toMatch(/--av-roupa:[^;"]+;--av-detalhe:/);
  });

  it("preserva as custom properties do <svg>", () => {
    const out = otimizar(vestido());
    for (const v of ["--av-traco", "--av-linha", "--av-pele", "--av-cabelo"]) {
      expect(out, v).toContain(v);
    }
  });

  it("preserva animação e @media do pet", () => {
    const out = otimizar(peaozinho());
    expect(out).toContain("@keyframes");
    expect(out).toContain("prefers-reduced-motion");
    // A pálpebra precisa continuar nascendo invisível: se o estado base
    // sumisse e sobrasse só o keyframe, o pet apareceria cego onde a
    // animação não roda.
    expect(out).toMatch(/\.palpebra\s*\{[^}]*opacity:\s*0/);
  });

  it("a saída continua passando no contrato", () => {
    expect(conferirSvg(otimizar(vestido()))).toEqual([]);
    expect(conferirSvg(otimizar(peaozinho()))).toEqual([]);
  });

  it("encolhe de verdade", () => {
    const antes = vestido().length;
    const depois = otimizar(vestido()).length;
    expect(depois).toBeLessThan(antes);
  });
});
