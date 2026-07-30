/**
 * O SVGO precisa passar a arte pela faxina sem desmontar o que o recolorir e
 * a composição dependem. Cada teste aqui corresponde a um plugin do
 * preset-default que, ligado, quebraria alguma coisa em silêncio.
 *
 * As duas cobaias são as duas formas de arte que o projeto emite hoje, e elas
 * se complementam de propósito:
 *
 *  - o **pet** é desenhado em código, com `<style>`, classes e animação;
 *  - a **base** vem da arte vetorizada, sem `<style>`, com `var(--av-*)` em
 *    atributo e as camadas em `<g class>`.
 *
 * Antes elas eram o boneco do protótipo, que foi apagado quando a arte de
 * verdade chegou. O que cada teste guarda continua igual.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { otimizar } from "../otimizar-svg";
import { peaozinho } from "../../../src/lib/avatar/prototipo/pet";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { TRAJE_BASE } from "../../../src/lib/avatar/palette";

/** O arquivo que a aplicação serve. Já sai otimizado do `avatar:base`. */
const base = () => readFileSync("public/items/base/avatar-base-neutro.svg", "utf8");

describe("o que a faxina não pode levar junto", () => {
  it("mantém as regras dentro do <style> em vez de inliná-las nos elementos", () => {
    // MEDIDO: com `inlineStyles` ligado (o default), o SVGO apaga as regras do
    // <style> e escreve style="fill:..." no elemento. Isso inviabiliza o 5.7,
    // em que as regras sobem para a folha global.
    const out = otimizar(peaozinho());
    for (const classe of [".m1", ".m2", ".m3", ".folha", ".tinta"]) {
      expect(out, `regra ${classe}`).toContain(classe);
    }
    expect(out).not.toMatch(/style="fill:/);
  });

  it("preserva o viewBox, de que dependem os 4 tamanhos", () => {
    expect(otimizar(peaozinho())).toMatch(/viewBox="0 0 200 200"/);
    expect(base()).toMatch(/viewBox="0 0 2556 3840"/);
  });

  it("preserva as camadas da base", () => {
    // `collapseGroups` funde um <g> nos filhos quando o julga vazio de
    // conteúdo. As camadas da base só carregam a classe — se sumirem, o Bloco 5
    // perde o gancho por onde a folha global alcança cada uma.
    const out = base();
    for (const camada of ["av-forro", "av-pele", "av-roupa", "av-sobrancelha", "av-olho"]) {
      expect(out, camada).toContain(camada);
    }
  });

  it("preserva a leitura das custom properties", () => {
    // Se o SVGO resolvesse `var(--av-pele)` para um valor, o recolorir morria
    // sem nenhum erro: o boneco sairia sempre do mesmo tom.
    const out = base();
    expect(out).toContain("var(--av-pele)");
    // Com fallback, porque a sobrancelha sem `--av-cabelo` declarada cairia no
    // valor inicial de `fill` — preto, que é perto o bastante do certo para
    // ninguém notar.
    expect(out).toMatch(/var\(--av-cabelo,\s*#[0-9A-Fa-f]{3,6}\)/);
  });

  it("a roupa tem cor ASSADA, não variável", () => {
    // A emenda à D27 é permanente: só pele e cabelo recolorem. Este assert é a
    // decisão em forma de teste — se alguém devolver `--av-roupa` ao desenho,
    // isto falha antes de o boneco chegar na tela.
    const out = base();
    expect(out).not.toContain("var(--av-roupa)");
    expect(out).not.toContain("var(--av-fundo)");
    expect(out).toContain(TRAJE_BASE.roupa.toLowerCase());
  });

  it("preserva o fill preto da sombra da roupa", () => {
    // Preto é o VALOR INICIAL de `fill`, e `removeUnknownsAndDefaults` apagava
    // o atributo por parecer redundante. O desenho continuava preto por herança
    // do valor inicial — até o Bloco 5 concatenar as camadas num <svg> só, onde
    // um `fill` em qualquer <g> ancestral repintaria a sombra em silêncio.
    // O SVGO iça o atributo para o <g> do nível, o que é melhor ainda: a cor
    // fica declarada uma vez por camada de sombra. O que importa é ela existir.
    expect(base()).toContain('fill="#000"');
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
    expect(conferirSvg(otimizar(peaozinho()))).toEqual([]);
    expect(conferirSvg(base())).toEqual([]);
  });

  it("encolhe de verdade", () => {
    const antes = peaozinho().length;
    const depois = otimizar(peaozinho()).length;
    expect(depois).toBeLessThan(antes);
  });
});
