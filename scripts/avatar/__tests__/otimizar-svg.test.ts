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

/**
 * O terceiro modo de arte do Bloco 5: o vetor carrega só o que precisa ser
 * vetor, e o RASTER carrega o tom. Duas formas novas atravessam a faxina —
 *
 *  - a peça que RECOLORE (barba) sai como silhueta em `<path>` mais uma
 *    máscara de luminosidade: um `<image>` PNG cinza em base64 dentro de um
 *    `<mask>`, aplicada por `mask="url(#…)"` no path pintado de
 *    `var(--av-cabelo)`;
 *  - a peça de cor ASSADA sai como um `<image>` WEBP direto, sem path nenhum.
 *
 * Os dois dependem de coisas que o preset-default do SVGO adoraria mexer: id
 * (`cleanupIds: false`), `maskUnits`/`preserveAspectRatio` (que só sobrevivem
 * porque `removeUnknownsAndDefaults.defaultAttrs` está desligado) e o payload
 * base64, que precisa sair byte a byte igual — um caractere trocado é uma
 * imagem corrompida, e nenhum gate de FORMA pegaria isso.
 *
 * As cobaias são minúsculas de propósito (8×10 px), geradas pelo mesmo sharp
 * da esteira: PNG paleta compressionLevel 9 e WEBP quality 82.
 */

/** PNG cinza 8×10, paleta, compressionLevel 9 — o formato da máscara de tom. */
const PNG_TOM =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAMAAAC+Ge+yAAAA8FBMVEWenp63t7e0tLTR0dHu7u7Ozs6amprY2Ninp6fV1dXr6+vo6Oi7u7u+vr6UlJShoaGRkZGrq6ukpKTBwcHy8vKurq74+PiXl5fe3t7////l5eWxsbH19fV6enqKiorLy8t3d3fIyMhwcHB9fX10dHT7+/vb29vh4eGBgYGEhISHh4eOjo7ExMQmJiZTU1MtLS1aWlojIyMQEBBXV1dDQ0M6OjpkZGQpKSk9PT1qamowMDBQUFBnZ2cWFhYMDAxtbW1gYGBKSkpAQEBHR0cTExNdXV1NTU02NjYGBgYzMzMZGRkdHR0gICAAAAAJCQkDAwO9tMoVAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAYklEQVR42mPw9ffwszNysWXw8vYx1DXXt2LwdDe1cDJxdmRws9YzNnB1MGOwsbRXUlGQVWbQ0NSS0xbgE2dgY+AX4hAUlWZgYuThFdZRlGdgZeZkV5NQl2Lg5mIRkRFTlQQAxKMMWSidARAAAAAASUVORK5CYII=";

/** WEBP RGBA 8×10, quality 82 — o formato da peça de cor assada. */
const WEBP_ASSADO =
  "UklGRmgAAABXRUJQVlA4WAoAAAAQAAAABwAACQAAQUxQSBMAAAABDzD/ERFCIJAQr5fMYhH9D601AFZQOCAuAAAA0AEAnQEqCAAKAAFAIiWgAnS6AfgAA7AA/uHDf/n5nduL+q3/2Dv6Vj6Vj9egAA==";

/** A silhueta da barba: um `d` só, servido a dois paths (traço e tinta). */
const D_SILHUETA = "M12.5 30.25h75v40.5h-75z";

const svgComTom = () =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840">' +
  '<defs><mask id="kk-tom-rosto" maskUnits="userSpaceOnUse" x="12.5" y="30.25" width="75" height="40.5">' +
  `<image href="data:image/png;base64,${PNG_TOM}" x="12.5" y="30.25" width="75" height="40.5" preserveAspectRatio="none"/>` +
  "</mask></defs>" +
  `<path class="kk-traco" d="${D_SILHUETA}" fill="var(--av-linha)"/>` +
  `<path d="${D_SILHUETA}" fill="var(--av-cabelo, #262626)" mask="url(#kk-tom-rosto)"/>` +
  "</svg>";

const svgAssado = () =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840">' +
  `<image href="data:image/webp;base64,${WEBP_ASSADO}" x="0" y="0" width="600" height="840"/>` +
  "</svg>";

describe("o tom contínuo e a cor assada atravessam a faxina", () => {
  it("preserva a máscara de tom inteira: id, url(#), href e o base64 byte a byte", () => {
    const out = otimizar(svgComTom());

    // A moldura da máscara. `cleanupIds: false` é o que segura o id — renomeado,
    // o `mask="url(#…)"` aponta para o nada e a barba perde o tom em silêncio.
    expect(out).toContain("<mask");
    expect(out).toContain('id="kk-tom-rosto"');
    expect(out).toContain('mask="url(#kk-tom-rosto)"');

    // `maskUnits` e `preserveAspectRatio` não são default; sobrevivem porque
    // `removeUnknownsAndDefaults.defaultAttrs` está desligado. Sem o primeiro
    // a caixa vira fração do bounding box; sem o segundo o PNG entra deformado.
    expect(out).toContain('maskUnits="userSpaceOnUse"');
    expect(out).toContain('preserveAspectRatio="none"');

    // O payload. Um caractere trocado no base64 é imagem corrompida, e nenhum
    // gate de FORMA pegaria isso — por isso a comparação é do texto inteiro.
    expect(out).toContain("<image");
    expect(out).toContain(`href="data:image/png;base64,${PNG_TOM}"`);
  });

  it("mantém os dois paths da silhueta com o MESMO d, e a máscara só no de tinta", () => {
    const out = otimizar(svgComTom());

    // A peça continua declarando formas: são 2 paths do mesmo `d`, um por
    // baixo em `--av-linha` e um por cima em `--av-cabelo`. `mergePaths: false`
    // é o que impede o SVGO de fundir os dois e apagar a diferença.
    const paths = out.match(/<path/g) ?? [];
    expect(paths).toHaveLength(2);
    expect(out).toContain("var(--av-linha)");
    expect(out).toMatch(/var\(--av-cabelo,\s*#[0-9A-Fa-f]{3,6}\)/);

    // A máscara veste UMA forma só. Vestir o traço junto comeria o contorno.
    expect(out.match(/mask="url\(/g) ?? []).toHaveLength(1);
    expect(out).not.toMatch(/class="kk-traco"[^>]*mask=/);
  });

  it("preserva o `<image>` WEBP da peça de cor assada, sem path nenhum", () => {
    const out = otimizar(svgAssado());
    expect(out).toContain(`href="data:image/webp;base64,${WEBP_ASSADO}"`);
    expect(out).toContain('viewBox="0 0 600 840"');
    expect(out).not.toContain("<path");
  });

  it("as duas formas novas continuam passando no contrato", () => {
    // O `conferirSvg` não tem allowlist de elemento: ele trava custom property
    // fora do contrato e comentário dentro do `<style>`. O alfabeto do base64
    // (A–Z a–z 0–9 + / =) não colide com as regexes de `var(--…)`.
    expect(conferirSvg(otimizar(svgComTom()))).toEqual([]);
    expect(conferirSvg(otimizar(svgAssado()))).toEqual([]);
  });
});
