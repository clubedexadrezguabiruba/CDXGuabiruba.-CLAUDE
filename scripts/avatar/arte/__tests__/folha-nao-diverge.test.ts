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

/**
 * A MESMA VIGILÂNCIA NA FOLHA DO CABELO — e ela nasce vigiada.
 *
 * `arte:folha-cabelo` tem a mesma coluna `traçado` montada à mão, com o mesmo par de
 * `<path>` e a mesma máscara. Os dois defeitos de 2026-08-22 são reproduzíveis nela
 * letra por letra, e o segundo — `fill-rule` faltando — é ainda mais fácil de
 * cometer numa cópia.
 *
 * ⚠️ **Este bloco lê TEXTO, e é de propósito.** Em 2026-08-22 nenhum cabelo tonal
 * está promovido (`CABELOS_DA_ARTE` nasce vazio, arte a arte), então não há peça de
 * onde montar as duas colunas e comparar pixel. O que existe para vigiar é o
 * emissor, e o emissor é código-fonte. No dia em que a primeira peça for promovida,
 * este bloco ganha o par de colunas de verdade — e até lá ele não é vácuo: a
 * asserção que pegou o defeito real do rosto era exatamente desta forma.
 *
 * O primeiro defeito daquela folha — o `href="/items/…"` que não resolve sem
 * servidor — **não é reproduzível aqui**, e isso é estrutura e não sorte:
 * `folha-cabelo.ts` monta a peça a partir do BUFFER que a esteira devolveu
 * (`construirPecaTonal`), então o `data:` não é uma troca que alguém precise lembrar
 * de fazer. A asserção abaixo trava esse desenho.
 */
describe("a coluna `traçado` da folha do CABELO não diverge do produto", () => {
  const fonte = readFileSync("scripts/avatar/arte/folha-cabelo.ts", "utf8");

  it("os dois `<path>` do traçado carregam a MESMA regra de preenchimento", () => {
    const paths = [...fonte.matchAll(/<path d="\$\{peca\.tonal!\.formas\[\d\]\.d\}"([^`]*?)fill=/g)];
    expect(paths, "os dois `<path>` do traçado montados à mão").toHaveLength(2);
    for (const [, atributos] of paths)
      expect(atributos, "`fill-rule` faltando num `<path>` do traçado").toContain("REGRA");
  });

  it("a folha embute o tom em `data:` — e o embute a partir do BUFFER da esteira", () => {
    // `uri()` é `data:image/png;base64,…`. O que importa é de onde vêm os bytes: de
    // `p.tom.png`, que é o que a esteira acabou de produzir. Ler o arquivo de
    // `public/` obrigaria a peça a estar promovida, e a folha existe justamente para
    // decidir se ela merece ser.
    expect(fonte).toContain("tom: { ...p.tom, arte: uri(p.tom.png) }");
    expect(fonte).toContain("data:image/png;base64,");
  });

  it("a folha recusa desenhar quando o literal e a esteira divergem", () => {
    // O defeito nº 1 da rota é o produto desenhar uma peça e a folha julgar outra.
    // Aqui isso não vira aviso: vira `process.exit(1)`.
    expect(fonte).toContain("CABELOS_DA_ARTE[chave]");
    expect(fonte).toContain("o defeito nº 1 desta rota");
  });

  it("a coluna do par traz a barba APROVADA, e não uma qualquer", () => {
    // Refazer o cabelo muda a leitura da `rosto-barba-trancada`, que já passou pelo
    // olho do Doug. A folha que não mostrasse o par pediria uma aprovação cega.
    expect(fonte).toContain('const BARBA_DO_PAR = "rosto-barba-trancada"');
    expect(ROSTOS["rosto-barba-trancada"], "a barba do par saiu do catálogo").toBeDefined();
  });
});
