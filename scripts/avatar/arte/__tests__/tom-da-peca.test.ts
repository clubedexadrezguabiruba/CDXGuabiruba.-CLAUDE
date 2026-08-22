/**
 * O TOM CONTÍNUO SAINDO DA ESTEIRA — as cinco coisas que quebram em silêncio.
 *
 * `construirRosto` deixou de traçar duas máscaras e passou a traçar **uma** silhueta
 * mais um PNG cinza de luminância (`barba-para-formas.ts`, passos 3 e 4). Todo defeito
 * dessa troca é invisível ao `typecheck`, ao contrato do SVG e ao censo de camadas —
 * eles medem estrutura, e aqui o que pode estar errado é **conteúdo**:
 *
 *  1. **os dois `d` divergirem.** A forma de baixo é o preto que aparece onde a
 *     máscara cede; se ela não for exatamente a de cima, o preto vaza pelas beiradas
 *     ou some. Um `d` diferente desenha, e desenha errado;
 *  2. **o PNG não bater com a caixa.** A máscara é esticada para `w × h` em unidades
 *     com `preserveAspectRatio="none"`. PNG na proporção errada põe o tom fora de
 *     registro — a barba fica com a luz deslocada, e nada acusa;
 *  3. **o esticão não agir.** Se `lo` e `hi` saírem colados nas pontas do intervalo
 *     (0 e 255), a peça fica lavada — foi o defeito que os percentis existem para
 *     matar. A prova de que agiram é haver preto E branco saturados no resultado;
 *  4. **`hi <= lo`.** Peça chapada; a esteira reprova, e este teste fixa que ela
 *     reprova por asserção e não por `NaN` silencioso;
 *  5. **a caixa não ser a da peça.** Ela sai de `paraUnidade` sobre a bbox da
 *     máscara — recalculada aqui pelo caminho independente, contra a que o campo diz.
 *
 * A cobaia é `barba-trancada.png`, que é **versionada** (ver `.gitignore` da pasta): um
 * gate que dependesse de arte de `.scratch/` passaria na máquina de quem o escreveu e
 * nunca rodaria no CI.
 */
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { ESTEIRA, construirPecaTonal, construirRosto } from "../barba-para-formas";
import { LADO, paraUnidade } from "../base";

const ARTE = "scripts/avatar/arte/barba-trancada.png";

/** Uma travessia só da esteira serve as cinco asserções — ela custa segundos. */
const peca = await construirRosto(ARTE);

describe("o tom contínuo que a esteira emite", () => {
  it("as duas formas têm o MESMO `d` — a de baixo é o preto da de cima", () => {
    expect(peca.formas).toHaveLength(2);
    expect(peca.formas[0].d).toBe(peca.formas[1].d);
    expect(peca.formas[0].d.length).toBeGreaterThan(0);

    // E as cores continuam sendo as duas do contrato: linha embaixo, cabelo em cima.
    expect(peca.formas[0].cor).toBe("var(--av-linha)");
    expect(peca.formas[1].cor).toContain("var(--av-cabelo");
  });

  it("o campo guarda BYTES de PNG — não base64, não caminho", () => {
    // A esteira devolve o buffer; quem grava o arquivo em `public/items/rosto/` e
    // põe o CAMINHO no catálogo é `rostos.ts`. Uma função de medição que escrevesse
    // no deploy sujaria a prateleira toda vez que alguém medisse alguma coisa.
    expect(Buffer.isBuffer(peca.tom.png)).toBe(true);
    expect(peca.tom.png).toHaveLength(peca.tomPx.bytes);

    // Assinatura PNG: os 8 bytes de cabeçalho. Um WEBP aqui passaria em tudo que é
    // tamanho e falharia só na tela.
    expect([...peca.tom.png.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  });

  it("o PNG decodifica na fração declarada da caixa — e ela vem de `ESTEIRA`", async () => {
    const meta = await sharp(peca.tom.png).metadata();

    // A bbox da máscara, recalculada aqui pelo caminho independente.
    let x0 = LADO;
    let x1 = -1;
    let y0 = LADO;
    let y1 = -1;
    for (let i = 0; i < peca.mascara.length; i++)
      if (peca.mascara[i]) {
        const x = i % LADO;
        const y = (i / LADO) | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    const MW = x1 - x0 + 1;
    const MH = y1 - y0 + 1;

    // A fração sai da TABELA do slot, não de um literal: os 50% são número da
    // barba, e `EsteiraDoSlot.resolucaoDoTom` existe justamente porque cada slot tem
    // direito ao próprio. Um teste com `0.5` escrito à mão reprovaria a primeira
    // medição legítima do slot cabelo.
    expect(meta.width).toBe(Math.round(MW * ESTEIRA.rosto.resolucaoDoTom));
    expect(meta.width).toBe(peca.tomPx.w);
    expect(meta.height).toBe(peca.tomPx.h);

    // A proporção sobrevive ao resize dentro de 1 px — é o que mantém o tom em
    // registro com a silhueta, já que o `<image>` entra com `preserveAspectRatio="none"`.
    expect(Math.abs(meta.height! - (MH * meta.width!) / MW)).toBeLessThanOrEqual(1);
  });

  it("a caixa em unidades é a da peça, dentro de 0,1 u", async () => {
    let x0 = LADO;
    let x1 = -1;
    let y0 = LADO;
    let y1 = -1;
    for (let i = 0; i < peca.mascara.length; i++)
      if (peca.mascara[i]) {
        const x = i % LADO;
        const y = (i / LADO) | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    // `x1 + 1` porque a caixa vai até a borda EXTERNA do último pixel.
    const a = paraUnidade(x0, y0);
    const b = paraUnidade(x1 + 1, y1 + 1);

    expect(Math.abs(peca.tom.x - a.x)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(peca.tom.y - a.y)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(peca.tom.w - (b.x - a.x))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(peca.tom.h - (b.y - a.y))).toBeLessThanOrEqual(0.1);
  });

  it("o esticão agiu: a máscara passa de onde a ARTE parou", async () => {
    // Âncoras coladas nas pontas seriam mapeamento direto, e é ele que sai lavado:
    // na `trancada-v4` a peça mora entre lum 0 e 140, e sem esticão o miolo pousaria
    // em 55% de opacidade.
    expect(peca.esticao.lo).toBeGreaterThanOrEqual(0);
    expect(peca.esticao.lo).toBeLessThan(peca.esticao.hi);
    // `hi < 255` é o que dá folga para o esticão consumir. Sem ela não há o que
    // esticar, e a asserção seguinte passaria por vacuidade.
    expect(peca.esticao.hi).toBeLessThan(255);

    const { data, info } = await sharp(peca.tom.png)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const n = info.width * info.height;
    let zeros = 0;
    let max = 0;
    const distintos = new Set<number>();
    for (let i = 0; i < n; i++) {
      if (data[i] === 0) zeros++;
      if (data[i] > max) max = data[i];
      distintos.add(data[i]);
    }

    // 1. A PROVA DE QUE O ESTICÃO AGIU, e ela não usa constante escolhida: a arte
    //    não passa de `hi`, e a máscara passa. Um mapeamento direto não conseguiria.
    //    Medido: cheia hi 159 → max 255 · bigode 155 → 244 · cavanhaque 146 → 251.
    //    (`max === 255` seria régua errada: o resize a 50% interpola, e um pico
    //    isolado de 255 vira 244 sem que nada esteja errado.)
    expect(max, "a máscara tem de passar de onde a arte parou").toBeGreaterThan(peca.esticao.hi);

    // 2. O fundo da caixa e o que fica sob `lo` — a âncora de baixo.
    expect(zeros).toBeGreaterThan(0);

    // 3. O PONTO INTEIRO DESTE BLOCO, em uma asserção: a máscara carrega tom
    //    CONTÍNUO. A esteira de paths entregava **2** valores; esta entrega metade
    //    da grade de 8 bits ou mais. O piso é a metade de 256 porque é a metade da
    //    grade, não porque as artes de hoje medem tanto — elas medem de 180 a 256.
    expect(distintos.size, "tons distintos na máscara").toBeGreaterThanOrEqual(128);
  });

  it("o recorte das feições não custou pixel nenhum nesta arte", () => {
    // O gate da aresta nua (passo 2b) reprova quando o recorte corta o miolo. Aqui a
    // asserção é o outro lado: a `cheia` não encosta nas feições, e se um dia
    // encostar isto muda antes de alguém descobrir pela folha.
    expect(peca.pxNoRosto).toBe(0);
    expect(peca.componentes).toBe(1);
  });
});

/**
 * A ESTEIRA É **UMA**, E O SLOT SÓ TROCA DOIS PARÂMETROS — medido, não declarado.
 *
 * Este é o bloco que impede a generalização de 2026-08-22 de ser só uma afirmação de
 * docstring. A tese de `construirPecaTonal` é que o slot escolhe **duas** coisas da
 * tabela `ESTEIRA` — prefixo do slug e resolução do tom — e mais nada: base careca,
 * diferença contra a base, recorte de feições, aresta nua, figurinha, esticão por
 * percentil e traçado são idênticos nos dois slots.
 *
 * A prova é passar a MESMA arte pelos dois e exigir que a saída geométrica seja
 * igual. Se algum dia o slot vazar para dentro da esteira — um recorte diferente, um
 * limiar diferente —, é aqui que cai, e cai antes de qualquer peça ser desenhada.
 *
 * A cobaia é `chanel.png`, arte de CABELO versionada. Ela é do elenco velho e tem
 * poucos tons: serve para medir a mecânica, nunca o padrão tonal (que é o que a
 * suíte acima cobra sobre a `barba-trancada`).
 */
describe("a esteira é uma só, parametrizada por slot", () => {
  const ARTE_CABELO = "scripts/avatar/arte/chanel.png";

  it("a tabela declara os dois slots que recolorem, e só eles", () => {
    // Slot novo aqui é DECISÃO: chapéu e pet têm cor assada e saem por
    // `peca-de-arte.ts`. Um terceiro aparecendo sem medição própria de resolução é o
    // que esta linha pega.
    expect(Object.keys(ESTEIRA).sort()).toEqual(["cabelo", "rosto"]);
    expect(ESTEIRA.rosto.prefixo).toBe("rosto-");
    expect(ESTEIRA.cabelo.prefixo).toBe("cabelo-");
  });

  it("`construirRosto` é o mesmo que `construirPecaTonal(…, \"rosto\")` — o wrapper não desvia", () => {
    // A barba não pode ter mudado um byte ao slot cabelo nascer, e o selo que prova
    // isso é `arte:rostos --check`. Esta linha prova o degrau anterior: as duas
    // portas de entrada levam à mesma esteira.
    expect(peca.slot).toBe("rosto");
    expect(peca.slug).toBe("rosto-barba-trancada");
  });

  it("a MESMA arte pelos dois slots dá a MESMA geometria — só o nome muda", async () => {
    const comoRosto = await construirPecaTonal(ARTE_CABELO, "rosto");
    const comoCabelo = await construirPecaTonal(ARTE_CABELO, "cabelo");

    // O que o slot muda:
    expect(comoRosto.slug).toBe("rosto-chanel");
    expect(comoCabelo.slug).toBe("cabelo-chanel");
    expect(comoCabelo.slot).toBe("cabelo");

    // O que ele NÃO muda — e é o arquivo inteiro:
    expect(comoCabelo.formas[0].d).toBe(comoRosto.formas[0].d);
    expect(comoCabelo.formas[1].d).toBe(comoRosto.formas[1].d);
    expect(comoCabelo.esticao).toEqual(comoRosto.esticao);
    expect(comoCabelo.pxPeca).toBe(comoRosto.pxPeca);
    expect(comoCabelo.pxNoRosto).toBe(comoRosto.pxNoRosto);
    expect(comoCabelo.pxPreenchidos).toBe(comoRosto.pxPreenchidos);
    expect(comoCabelo.componentes).toBe(comoRosto.componentes);
    expect(Buffer.from(comoCabelo.mascara).equals(Buffer.from(comoRosto.mascara))).toBe(true);
    // A caixa do tom é geometria, não parâmetro: ela é a bbox da máscara.
    expect(comoCabelo.tom.x).toBe(comoRosto.tom.x);
    expect(comoCabelo.tom.y).toBe(comoRosto.tom.y);
    expect(comoCabelo.tom.w).toBe(comoRosto.tom.w);
    expect(comoCabelo.tom.h).toBe(comoRosto.tom.h);

    // ⚠️ O PNG **não** entra na lista acima, e a ausência é a tese: ele depende de
    // `resolucaoDoTom`, que é justamente um dos dois parâmetros. Hoje os dois slots
    // carregam 0,5 e o buffer sai igual; no dia em que o cabelo medir o próprio
    // número, esta linha é a que declara que a diferença é legítima.
    expect(comoCabelo.tomPx.w).toBe(
      Math.round((comoRosto.tomPx.w * ESTEIRA.cabelo.resolucaoDoTom) / ESTEIRA.rosto.resolucaoDoTom),
    );
  });

  it("o slug do cabelo carrega o prefixo do slot — e o PNG de tom mora na pasta dele", async () => {
    // `avatar_catalogo` não tem linha de cabelo (ele é escolha livre da D27), então o
    // prefixo aqui não é chave primária: é o que faz laudo, folha, literal e arquivo
    // de máscara falarem o mesmo nome. `public/items/cabelo/cabelo-chanel-tom.png`.
    const p = await construirPecaTonal(ARTE_CABELO, "cabelo");
    expect(p.slug.startsWith(ESTEIRA.cabelo.prefixo)).toBe(true);
    expect(p.formas).toHaveLength(2);
    expect(p.formas[0].d).toBe(p.formas[1].d);
    expect(p.formas.every((f) => f.semTraco)).toBe(true);
  });
});
