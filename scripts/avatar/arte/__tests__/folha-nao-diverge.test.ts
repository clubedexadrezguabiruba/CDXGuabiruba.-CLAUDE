/**
 * A COLUNA `traçado` DA FOLHA NÃO PODE DIVERGIR DO PRODUTO — e já divergiu duas vezes.
 *
 * A folha do rosto (`arte:folha-rosto`) é, por escrito no doc 23 §6, *"a única
 * aprovação que existe"*. Ela desenha a peça de duas maneiras: pelas colunas do
 * compositor, que é o código do produto, e por uma coluna `traçado` montada À MÃO
 * dentro de `folha-rosto.ts` — as duas formas nas cores da arte, sobre a base, para
 * o Doug comparar traçado com desenho lado a lado.
 *
 * **Essa coluna à mão é o risco**, e o histórico é curto e feio:
 *
 *  1. 2026-08-22 — ela era a ÚNICA certa: o `<image>` do tom entrava embutido em
 *     `data:` aqui e por URL nas colunas do compositor, que sem servidor não
 *     resolvia. As três colunas do compositor saíam com a barba preta;
 *  2. 2026-08-22, no mesmo dia — ela virou a ÚNICA errada: faltava
 *     `fill-rule="evenodd"`, então a janela da boca era PREENCHIDA e a coluna
 *     desenhava a boca preta. Medido: 100% da espinha da boca preta sem a regra,
 *     0% com ela. O Doug pegou a olho, na folha, perguntando *"a boca ficou preta,
 *     isso é normal?"*.
 *
 * Os dois defeitos são a mesma doença: **um atributo que o compositor emite e a
 * cópia à mão não.** Este teste não desenha nada — ele compara os dois emissores
 * atributo a atributo, que é a única coisa capaz de pegar o terceiro caso antes de
 * ele chegar aos olhos de alguém.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";

import { ROSTOS } from "../../../../src/lib/avatar/catalogo";
import { compor } from "../../../../src/lib/avatar/estilo/compositor";

const SLUG = "rosto-barba-trancada";
const peca = ROSTOS[SLUG];

/** O que o PRODUTO emite para esta peça. */
const doProduto = compor({ pele: "#E9B183", cabelo: "#D8D2CB", rosto: peca, ns: "t" });

/** A fonte da folha, lida como TEXTO — é o emissor à mão que precisa ser vigiado. */
const fonteDaFolha = readFileSync("scripts/avatar/arte/folha-rosto.ts", "utf8");

describe("a coluna `traçado` da folha não diverge do produto", () => {
  it("a peça tem janela de feição — sem isso este teste não prova nada", () => {
    // Se a silhueta virasse um subcaminho só, `evenodd` deixaria de importar e o
    // teste passaria por vacuidade. A asserção existe para o teste morrer alto
    // nesse dia, em vez de virar verde permanente.
    const sub = (peca!.formas![0].d.match(/M/g) ?? []).length;
    expect(sub, "a silhueta precisa ter contorno + ao menos uma janela").toBeGreaterThan(1);
  });

  it("o produto pinta a silhueta com `fill-rule=\"evenodd\"`", () => {
    // O lado de lá do contrato. Se o compositor deixar de emitir, é aqui que se vê.
    expect(doProduto).toContain('fill-rule="evenodd"');
  });

  it("a folha emite a MESMA regra nos dois `<path>` do traçado", () => {
    // A coluna monta `<path d="${peca.formas[N].d}"...>`. Cada um desses precisa
    // carregar a regra — foi exatamente isso que faltou.
    const paths = [...fonteDaFolha.matchAll(/<path d="\$\{peca\.formas\[\d\]\.d\}"([^`]*?)fill=/g)];
    expect(paths, "os dois `<path>` do traçado montados à mão").toHaveLength(2);
    for (const [, atributos] of paths)
      expect(atributos, "`fill-rule` faltando num `<path>` do traçado").toContain("REGRA");
  });

  it("a folha embute o tom em `data:` — o produto serve por URL, e a folha não tem servidor", () => {
    // O primeiro dos dois defeitos. A folha monta a página com `setContent`, sem
    // servidor: um `href="/items/…"` não resolve, a máscara sai vazia e a peça
    // inteira cede para `var(--av-linha)`.
    expect(doProduto).toContain('href="/items/rosto/');
    expect(fonteDaFolha).toContain("data:image/png;base64,");
    expect(fonteDaFolha, "a cópia da peça com o tom em `data:` para o compositor").toContain(
      "pecaServida",
    );
  });
});
