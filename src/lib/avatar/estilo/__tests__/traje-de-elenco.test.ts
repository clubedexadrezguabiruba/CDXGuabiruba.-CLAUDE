/**
 * O TRAJE — o análogo de `pecas-de-elenco.test.ts`, mais a pergunta que só ele tem.
 *
 * As duas pontas de lá valem aqui igual: **ausente não muda um byte**, senão o teto
 * de regressão da `folha-base` deixa de ser teto e vira folga; e **presente
 * aparece**, senão o gate da ausência passa por vacuidade e ninguém descobre que a
 * peça nunca foi emitida.
 *
 * ---------------------------------------------------------------------------
 * A PONTA QUE O CHAPÉU NÃO TEM: o traje NEGOCIA volume com o compositor
 * ---------------------------------------------------------------------------
 *
 * Chapéu e rosto só somam formas. O traje faz o compositor **abrir mão** de duas
 * que ele sempre desenhou: a sombra de contato do queixo e o plano lateral do
 * tronco. É decisão do Doug, de 2026-08-12 — *"a sombra do corpo ficou por cima da
 * roupa"* —, e está certa: uma arte de traje traz o próprio volume, e pintar os
 * dois por cima dobra o sombreado.
 *
 * E o compositor decide isso olhando **o campo `tinta.arte` declarado**, nunca o
 * arquivo existindo — porque, do lado do servidor, ele não tem como saber. Essa é a
 * escolha certa e é também a lâmina do defeito de 2026-08-13: a peça nascia numa
 * pasta que o `.gitignore` barrava, o navegador da criança levava 404, e o
 * compositor já tinha desligado o volume por conta do campo. **O aluno vestido saía
 * mais chapado que o aluno pelado** — 17 formas contra 19 —, e nada em código
 * reclamou.
 *
 * O endereço foi consertado e `arteDaPecaNoDeploy.test.ts` guarda a porta. O que
 * este arquivo guarda é o outro lado: que a supressão é **do campo**, não do
 * arquivo. Se alguém um dia "consertar" isso testando o disco, o compositor deixa
 * de ser puro e a folha de contato passa a mentir junto com o produto.
 */

import { describe, expect, it } from "vitest";
import { compor, naTela } from "../compositor";
import {
  CAIXA_CABECA,
  CAIXA_DA_ARTE,
  pathPlanoLateralTronco,
  pathSombraQueixoTronco,
  TRACO,
  VIEWBOX,
} from "../geometria";
import { conferirSvg } from "../../svgContrato";
import type { EstadoAvatar, Traje } from "../tipos";

const BASE: EstadoAvatar = {
  pele: "#E9B183",
  cabelo: "#3A2F2A",
  ns: "t",
};

/** Uma peça de mentira, só cor chapada. Magenta não existe no boneco. */
const CHAPADO: Traje = {
  id: "zz-traje-de-teste",
  nome: "Traje de teste",
  tinta: { cor: "#FF00FF" },
};

/** A mesma peça, agora com arte. O caminho é o que o browser pediria. */
const COM_ARTE: Traje = {
  ...CHAPADO,
  tinta: { ...CHAPADO.tinta, arte: "/items/traje/zz-traje-de-teste.svg" },
};

/**
 * O contador de formas do orçamento, **copiado de `folha-base.ts:74`** — e a cópia
 * é de propósito: importar o script de folha para dentro da suíte arrastaria
 * `sharp` e o Playwright para um teste que roda em 12 ms.
 *
 * `use` CONTA: cabeça e tronco viraram `<path>` em `<defs>` referenciados por
 * `<use>`, e um contador que os ignorasse mentiria para menos justamente por causa
 * da mudança que fez o boneco caber. `<image>` NÃO conta, e é por isso que a peça
 * com arte fecha em 17 e não em 18.
 *
 * ⚠️ **A razão pela qual `<image>` não conta MUDOU, e o número que ela esconde está
 * medido.** Este docstring dizia *"ele não é forma, é raster colado"*, e isso valeu
 * até 2026-08-17: desde a prova do vetor o `href` aponta para um `.svg`, e o
 * navegador pinta o documento inteiro que há dentro dele. Medido em 2026-08-20
 * (`.scratch/estilo/g16-nos-pintados.ts`), em nós que o navegador de fato pinta:
 *
 * | cena | no SVG do boneco | dentro do `<image>` | pintados |
 * |---|---|---|---|
 * | `chanel` + barba, sem traje | 25 | 0 | **25** |
 * | `chanel` + barba + `traje-farda` | 23 | 52 | **75** |
 * | `chanel` + barba + `traje-gambesao` | 23 | 530 | **553** |
 *
 * O teto de 3 camadas é **31 formas**, e o gambesão vestido custa 553 nós. **Não é
 * defeito hoje, e o motivo é preciso:** o teto de formas existe pela conta do
 * ranking — 30 bonecos numa lista —, e a lista serve o RECORTE DE CABEÇA, que não
 * leva traje. O boneco de corpo inteiro aparece **uma vez por página**. O que este
 * bloco impede é alguém reler "não é forma" e concluir que a arte do traje é grátis.
 * Fecha o **G16**; o teto para o corpo inteiro, se houver de existir, é do Doug.
 */
const contarFormas = (svg: string) => (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/**
 * Os números CONGELADOS, e eles não saem daqui — são medidos por dois programas
 * independentes deste teste: o `TETO_BASE_FORMAS` da `avatar:folha-base` e o
 * orçamento do composto que a `arte:folha-traje` imprime a cada rodada
 * (*"sem traje 19 formas · traje-farda 17 formas (−2 formas)"*).
 *
 * Estarem aqui é o que faz este arquivo valer alguma coisa. A primeira versão dele
 * comparava `compor(BASE)` com `compor({...BASE, traje: undefined})` — os dois
 * lados passam pelo MESMO ramo do compositor, então a comparação não podia falhar.
 * Provado por mutação em 2026-08-13: `arteDoTraje()` devolvendo `"<g/>"` na
 * ausência — um grupo vazio emitido em todo boneco do produto — **passou verde**.
 * Âncora que depende do próprio código que ela vigia não é âncora.
 */
const FORMAS_SEM_TRAJE = 19;
const FORMAS_COM_ARTE = 17;

describe("traje ausente", () => {
  it("não emite NADA — nem `<image>`, nem grupo vazio", () => {
    const semNada = compor(BASE);

    expect(contarFormas(semNada)).toBe(FORMAS_SEM_TRAJE);
    expect(semNada).not.toContain("<image");
    // Um `<g>` vazio não pinta e não conta forma: ele passaria pelo orçamento e
    // ficaria em toda composição do produto para sempre. É o defeito nominal do
    // cabeçalho de `pecas-de-elenco.test.ts`, e é o que a mutação acima produziu.
    expect(semNada).not.toMatch(/<g\s*\/>|<g>\s*<\/g>/);
  });

  it("`undefined` explícito é indistinguível do campo omitido", () => {
    // O caminho de todo aluno que ainda não equipou peça nenhuma, que é a maioria.
    // Sozinha esta asserção não prova ausência — as duas chamadas passam pelo mesmo
    // ramo. Ela prova que `traje: undefined` não abre um ramo TERCEIRO.
    expect(compor({ ...BASE, traje: undefined })).toBe(compor(BASE));
  });

  it("desenha o macacão de treino COM volume — as duas formas do compositor", () => {
    // O controle da supressão testada adiante. Sem isto, o teste da arte passaria
    // por vacuidade no dia em que as duas formas sumissem por outro motivo.
    const semNada = compor(BASE);
    expect(semNada).toContain(pathSombraQueixoTronco());
    expect(semNada).toContain(pathPlanoLateralTronco());
  });
});

describe("traje presente", () => {
  it("só cor chapada: a tinta troca, e o volume do compositor FICA", () => {
    const svg = compor({ ...BASE, traje: CHAPADO });

    expect(svg).not.toBe(compor(BASE));
    expect(svg).toContain(`#FF00FF`);
    // Peça sem arte não tem volume próprio, então o do compositor continua sendo
    // o único que ela tem. Tirá-lo aqui devolveria o papel recortado do 5.9.
    expect(svg).toContain(pathSombraQueixoTronco());
    expect(svg).toContain(pathPlanoLateralTronco());
    expect(contarFormas(svg)).toBe(FORMAS_SEM_TRAJE);
  });

  it("com arte: a arte entra e o compositor abre mão das duas formas", () => {
    const svg = compor({ ...BASE, traje: COM_ARTE });

    expect(svg).toContain(`<image href="/items/traje/zz-traje-de-teste.svg"`);
    expect(svg).not.toContain(pathSombraQueixoTronco());
    expect(svg).not.toContain(pathPlanoLateralTronco());
    // −2 formas contra o boneco sem traje, e o `<image>` não repõe nenhuma. É o
    // número que a `arte:folha-traje` imprime como orçamento do composto.
    expect(contarFormas(svg)).toBe(FORMAS_COM_ARTE);
    expect(FORMAS_SEM_TRAJE - FORMAS_COM_ARTE).toBe(2);
  });

  it("a supressão é do CAMPO, não do arquivo — a lâmina do defeito de 2026-08-13", () => {
    // Um caminho que não existe em disco nenhum produz o MESMO SVG que um válido.
    // É o comportamento correto (o compositor é puro e roda no servidor, onde o
    // disco do navegador não é consultável) e é por isso que endereço errado vira
    // boneco sem volume em silêncio, em vez de erro.
    const inexistente = compor({
      ...BASE,
      traje: { ...COM_ARTE, tinta: { ...COM_ARTE.tinta, arte: "/nao/existe.svg" } },
    });

    expect(inexistente).toBe(
      compor({ ...BASE, traje: COM_ARTE }).replace(
        "/items/traje/zz-traje-de-teste.svg",
        "/nao/existe.svg",
      ),
    );
  });

  it("a arte entra DEPOIS do contorno do tronco", () => {
    // Onde a roupa transborda, é o traço DELA que vira a borda externa. Invertido,
    // o contorno do tronco cortaria o transbordo — os 17,64% do gambesão.
    const svg = compor({ ...BASE, traje: COM_ARTE });
    const contorno = svg.indexOf(`<use href="#t-p-tronco" class="kk-traco"/>`);
    const arte = svg.indexOf("<image href=");

    expect(contorno).toBeGreaterThan(-1);
    expect(arte).toBeGreaterThan(contorno);
  });

  it("sem `escalaMedida`, o <image> ocupa a CAIXA_DA_ARTE inteira — a colagem é conta", () => {
    // `k = 1`. O PNG é recortado exatamente no retângulo da `CAIXA_DA_ARTE` na base
    // de edição (px 212→812 × 2→932), então x=0 y=−75 w=500 h=775 põe a arte 1 : 1,
    // sem registro e sem número escolhido a olho. Um `escalaMedida` que aparecesse
    // sozinho aqui deslocaria toda peça já aprovada.
    //
    // ⚠️ A caixa era o `VIEWBOX` até 2026-08-24, e trocá-la foi o conserto do teto
    // do chapéu: no retângulo velho uma peça de arte só alcançava 39,5 unidades
    // acima da coroa. Ver `CAIXA_DA_ARTE` em `geometria.ts`.
    const svg = compor({ ...BASE, traje: COM_ARTE });

    expect(svg).toContain(
      `x="${CAIXA_DA_ARTE.x.toFixed(2)}" y="${CAIXA_DA_ARTE.y.toFixed(2)}" ` +
        `width="${CAIXA_DA_ARTE.w.toFixed(2)}" height="${CAIXA_DA_ARTE.h.toFixed(2)}"`,
    );
  });

  it("a caixa da arte alcança ACIMA DA COROA — é o teto que o chapéu precisa", () => {
    // A régua que faltava, e é ela que guarda o ganho de 2026-08-24. Sem esta
    // asserção, alguém que devolvesse `colarArte` ao `VIEWBOX` veria os dois testes
    // acima continuarem verdes (eles casam o retângulo, qualquer que seja ele) e o
    // chapéu voltaria a não caber, em silêncio.
    //
    // A coroa está em `CAIXA_CABECA.y0 − TRACO/2` = 39,5 no sistema interno. A caixa
    // tem de começar ACIMA disso, e com folga que valha uma peça: metade de uma
    // altura de cabeça acima da coroa era 12,6% no retângulo velho.
    const coroa = CAIXA_CABECA.y0 - TRACO / 2;
    const acimaDaCoroa = coroa - CAIXA_DA_ARTE.y;

    expect(CAIXA_DA_ARTE.y).toBeLessThan(0);
    expect(acimaDaCoroa).toBeGreaterThan(100);
    // E ela não pode passar do que o QUADRO mostra: `naTela({y})` a 92% leva o topo
    // do quadro a interno −81,1. Arte desenhada acima disso sairia do arquivo para
    // ser cortada pelo viewport, que é o defeito silencioso do T1.5.
    expect(naTela({ y: CAIXA_DA_ARTE.y }).y).toBeGreaterThanOrEqual(0);
  });

  it("não quebra o contrato do SVG", () => {
    expect(conferirSvg(compor({ ...BASE, traje: COM_ARTE }))).toEqual([]);
    expect(conferirSvg(compor({ ...BASE, traje: CHAPADO }))).toEqual([]);
  });
});
