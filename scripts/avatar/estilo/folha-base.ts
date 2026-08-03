/**
 * A FOLHA DE CONTATO DA BASE — `npm run avatar:folha-base`
 *
 * O artefato que o Doug julga no Bloco 1, e o doc 15 é explícito sobre por que
 * esta aprovação é a que mais amarra: **a silhueta desta base é compartilhada por
 * todas as peças.** Os 14 trajes clipam nela, os chapéus se apoiam nela, os gates
 * de pixel medem contra ela. Aprovar a base errada e descobrir no Bloco 6
 * significa refazer tudo que veio depois.
 *
 * O QUE SE APROVA AQUI É O SVG, NÃO O PNG. A `referencia-base.png` aparece na
 * folha para comparação, e só. Ela não recolore, não pisca e não entra em asset
 * nenhum — se o SVG ficar diferente dela, quem manda é o que está na tela.
 *
 * AS QUATRO LEITURAS, na mesma imagem:
 *
 *  1. a base nos 4 tamanhos (56, 100, 200, 425 px) — 56 px é o teste do ranking;
 *  2. lado a lado com a referência, **na mesma escala de figura**, para medir
 *     fidelidade de proporção, espessura de traço e canto do especular. O
 *     alinhamento é calculado (`REF_ESCALA` e as duas origens, todas medidas na
 *     imagem), nunca ajustado a olho;
 *  3. as 8 peles × o careca, provando que `var(--av-pele)` recolore de verdade;
 *  4. closes de COORDENADA MEDIDA — cada `viewBox` sai das constantes de
 *     `geometria.ts`, não de um número escolhido olhando a tela.
 *
 * O que ela NÃO mostra, e por isso o Bloco 1 exige dois artefatos: o piscar, o
 * respiro, o DPR 2 e o `prefers-reduced-motion`. Isso é `/dev/avatar-kokeshi`.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
import { chromium, type Browser } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  BOCA,
  CAIXA_CABECA,
  ESPECULAR,
  CENTRO_X,
  FACETAS,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SOBRANCELHA,
  TRACO,
  TRONCO,
  VIEWBOX,
  bordasEm,
  pathCabeca,
  pathFacetaDir,
  pathFacetaEsq,
  pathSombraQueixoTronco,
  pathTronco,
} from "../../../src/lib/avatar/estilo/geometria";
import {
  CABELOS,
  FOLGA_ROSTO,
  MODELOS_CABELO,
  ORCAMENTO_COMPOSTO,
  folgaDoRosto,
  type ModeloCabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { CABELO, LINHA, PELE } from "../../../src/lib/avatar/palette";

/**
 * O contador de formas do orçamento. **`use` CONTA.**
 *
 * A cabeça e o tronco viraram `<path>` em `<defs>` referenciados por `<use>` para o
 * contorno de 29 pontos não ser escrito três vezes; se o contador ignorasse `use`, o
 * orçamento passaria a mentir para menos justamente por causa da mudança que o fez
 * caber.
 */
const contarFormas = (svg: string) =>
  (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/**
 * A PELE DA COMPARAÇÃO. `PELE[1]` (#F7CBA4) e não `PELE[2]`, e a troca é medida.
 *
 * O platô do rosto na referência é `#FED9A9`. Contra ele, `PELE[1]` dista 16,4 e
 * `PELE[2]` dista 59,0 — três vezes e meia mais. Os painéis que existem para
 * comparar o SVG com a referência lado a lado (o traço, os 4 tamanhos, os closes e o
 * mapa de facetas) usavam a pele errada, e uma diferença de tom de 59 níveis entre
 * as duas metades da comparação é ruído por cima do que se quer julgar.
 *
 * O painel das 8 peles continua com as oito: ele não compara com a referência, ele
 * prova que `var(--av-pele)` recolore.
 */
const PELE_COMPARACAO = PELE[1];

/**
 * O cabelo dos painéis: `CABELO[0]`, o preto `#3A2F2A`.
 *
 * Era o literal `"#3A2F2A"` escrito à mão em quatro lugares deste arquivo. É a mesma
 * cor, e é exatamente por isso que era um problema: no dia em que a paleta mexer no
 * preto, esta folha continuaria desenhando o antigo e a comparação passaria a ser
 * contra uma cor que não está mais no catálogo. Segunda cópia de um valor é a que
 * diverge.
 */
const CABELO_COMPARACAO = CABELO[0];

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-base.png`;
const REFERENCIA = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";

/** Os quatro tamanhos de leitura. 56 é o do ranking e é o que manda. */
const TAMANHOS = [56, 100, 200, 425] as const;

/**
 * O ORÇAMENTO, PARTIDO EM DOIS NO BLOCO 2a.1 — e a partição corrigiu o que ele media.
 *
 * Ele era um teto só (20 formas, 7 680 bytes) sobre a saída de `compor()`, e o
 * racional escrito aqui era sobre o **ranking**: 30 bonecos juntos a 56 px. Só que
 * ninguém no ranking é careca — todo avatar carrega um cabelo. O teto media a base
 * e o texto falava do composto, e no dia em que o cabelo entrasse ele reprovaria por
 * uma folga (262 bytes) que nunca foi orçamento de nada: era o resto da conta do
 * Bloco 1d.
 *
 * **A BASE, 19 formas e 7 418 bytes — o valor MEDIDO, não um teto com folga.**
 * É teto de REGRESSÃO: a base careca não pode crescer nem um byte, porque crescer
 * significa alguém tendo achado espaço na base para pagar uma camada que não é dela.
 * Quem precisar mexer na base muda estes dois números de propósito, e a mudança
 * aparece no diff.
 *
 * **O COMPOSTO, 26 formas e 10 240 bytes** — base mais UM cabelo, que é o que um
 * aluno de verdade carrega. Nunca há dois cabelos num render, então somar os cinco
 * seria orçar uma composição que não existe. Os 10 KB saem do mesmo alvo de sempre
 * (o app abrir em rede de escola) com a conta do ranking explícita: 30 × 10 KB são
 * 300 KB de marcação, que comprime como texto.
 *
 * **Os dois números do composto moram em `cabelo.ts`** (`ORCAMENTO_COMPOSTO`), e não
 * aqui, porque este script, o `variantes.ts` e o teste de unidade os liam de três
 * cópias — três chances de duas discordarem, sobre um número que a peça traçada tem
 * autorização para mudar. O racional continua sendo este parágrafo; o valor é de lá.
 *
 * Medido em 2026-08-01, com os 5 modelos do Bloco 2a.1: o mais caro é o `cacheado`,
 * com 22 formas e 8 995 bytes. A folga do composto é real e é para os 39 desenhos
 * do Bloco 8, não para o cabelo.
 *
 * Onde o corte do Bloco 1d foi feito, e onde ele NÃO podia ser feito, está em
 * `pathPlanoLateralTronco()` — arredondar coordenada para inteiro pagaria 1,5 KB e
 * derruba o raio mínimo do contorno de 34,4 para 14,5.
 */
const TETO_BASE_FORMAS = 19;
const TETO_BASE_BYTES = 7418;
const TETO_COMPOSTO_FORMAS = ORCAMENTO_COMPOSTO.formas;
const TETO_COMPOSTO_BYTES = ORCAMENTO_COMPOSTO.bytes;

/**
 * O GATE (a) DO BLOCO 2, EM NÚMERO: quanto dois cabelos precisam diferir a 56 px.
 *
 * "Os 5 se distinguem entre si a 56 px" é a exigência do plano, e ela não se cumpre
 * olhando — a folha do Bloco 1b passou verde com as duas orelhas idênticas numa
 * referência que tem 24 de um lado e 15 do outro, justamente porque alguém olhou.
 *
 * A régua: renderiza cada modelo a 56 px, conta os pixels que diferem em mais de 24
 * níveis em algum canal, e divide pela área do quadro (40 × 56 = 2 240 px).
 *
 * **5% é o piso, e ele NÃO sai do par mais parecido que existe** — essa seria a
 * justificativa circular de calibrar o gate pelo desenho que ele deveria julgar.
 * Sai de pixel: 5% de 2 240 são **112 pixels**, um bloco de ~10 × 11 na miniatura.
 * Menos que isso é uma diferença que se acha comparando as duas lado a lado e não se
 * acha numa lista de 30 — e a lista de 30 é o caso de uso, não a comparação.
 *
 * A primeira rodada mediu `Corte curto × Trança` em 3,66%, e a resposta certa foi
 * engrossar a trança até ela ser outra silhueta, não baixar o piso até ela passar.
 */
const PISO_DISTINCAO = 0.05;

/**
 * O piso CONTRA A BASE CARECA, e ele é outro de propósito — 2%.
 *
 * A careca não é um dos cinco: pela **D5**, nenhum aluno aparece sem cabelo, e o
 * `criar-personagem` obriga a escolher um modelo. Exigir 5% entre "moicano" e
 * "careca" seria cobrar distinção entre duas opções que nunca disputam a mesma
 * escolha, e o moicano — que é uma crista estreita sobre um crânio à mostra —
 * reprovaria por ser justamente o que ele é.
 *
 * O que a comparação contra a careca testa é outra coisa, e essa sim importa: **o
 * cabelo aparece?** 2% de 2 240 são 45 pixels, e uma camada que mova menos que isso
 * a 56 px está desenhada e não está sendo vista. É o gate contra a peça que existe
 * no código, passa em todo teste de unidade e some na tela — o modo de falha que
 * este projeto pagou com o `verify:avatar-assets` vermelho por meses.
 */
const PISO_VISIBILIDADE = 0.02;

// ---------------------------------------------------------------------------
// O alinhamento da referência — calculado, não ajustado
// ---------------------------------------------------------------------------

/**
 * A referência definitiva tem 2038×2038 e o CONTORNO ESCURO dela ocupa
 * y 244→1692 (1449 px), com o eixo do tronco em x = 994,5. No nosso `viewBox` a
 * silhueta externa ocupa y 39,5→640,5 (601 unidades), com o eixo do tronco em 250.
 *
 * **Os quatro números são medidos, e nenhum deles é o da arte anterior** — ela tinha
 * 1254×1254, y 149→1044 e eixo em 611,5. Trocar a imagem sem trocá-los desalinharia
 * a comparação inteira por ~30%, e o painel lado a lado é justamente o que existe
 * para julgar proporção.
 *
 * Uma rodada anterior usava y 155→1040 porque lia a silhueta como "pixel diferente
 * do fundo", e por baixo do tronco existe a **sombra do chão**, que é tinta clara.
 * Ela engordava a figura e escondia o fim do tronco. `medir.ts` explica em detalhe;
 * o efeito aqui era a referência ficar ~7% pequena ao lado do SVG, o que faz TODA
 * comparação de proporção mentir a favor.
 *
 * O eixo é o do TRONCO e não o da figura: a cabeça tem eixo próprio, 7 unidades à
 * direita (`GIRO`), e alinhar pela cabeça desalinharia os ombros.
 */
const REF = { lado: 2038, tintaY0: 244, tintaY1: 1692, eixoTronco: 994.5 } as const;
const REF_ESCALA = 600 / (REF.tintaY1 - REF.tintaY0); // 0,4144
const REF_X = CENTRO_X - REF.eixoTronco * REF_ESCALA;
const REF_Y = CAIXA_CABECA.y0 - TRACO / 2 - REF.tintaY0 * REF_ESCALA;
const REF_LADO = REF.lado * REF_ESCALA;

// ---------------------------------------------------------------------------
// Os closes — cada `viewBox` sai de uma constante da geometria
// ---------------------------------------------------------------------------

interface Close {
  rotulo: string;
  origem: string;
  vb: string;
}

/** Uma caixa quadrada de lado `lado` centrada num ponto medido. */
function caixa(cx: number, cy: number, lado: number): string {
  return `${(cx - lado / 2).toFixed(0)} ${(cy - lado / 2).toFixed(0)} ${lado} ${lado}`;
}

/** O centro de cada sobrancelha, derivado do olho do mesmo lado. */
const CENHO_ESQ_CY = OLHO_CY_ESQ - SOBRANCELHA.acimaDoOlho;
const CENHO_DIR_CY = OLHO_CY_DIR - SOBRANCELHA.acimaDoOlho;

function closes(): Close[] {
  const yQueixo = CAIXA_CABECA.y1 - FACETAS.queixo.altura;
  return [
    {
      rotulo: "sobrancelha esquerda",
      origem: `OLHO_CY_ESQ − ${SOBRANCELHA.acimaDoOlho} · ${SOBRANCELHA.larg}×${SOBRANCELHA.espessura} · sobe ${SOBRANCELHA.subida}`,
      vb: caixa(OLHO_CX_ESQ, CENHO_ESQ_CY, 110),
    },
    {
      rotulo: "sobrancelha direita",
      origem: `OLHO_CY_DIR − ${SOBRANCELHA.acimaDoOlho} · o desnível de ${CENHO_ESQ_CY - CENHO_DIR_CY} entre as duas é o giro`,
      vb: caixa(OLHO_CX_DIR, CENHO_DIR_CY, 110),
    },
    {
      rotulo: "boca",
      origem: `${BOCA.larg}×${BOCA.espessura} · sagita ${BOCA.sagita} · centrada no ponto médio dos olhos`,
      vb: caixa(CENTRO_X + 40, OLHO.cy + BOCA.abaixoDoOlho, 120),
    },
    {
      rotulo: "aresta esquerda",
      origem: `borda esq da cabeça · faceta de ${FACETAS.esq.larguraTopo} a ${FACETAS.esq.larguraBase}`,
      vb: caixa(bordasEm(CAIXA_CABECA.y0 + 0.35 * CAIXA_CABECA.alt).esq + 20, CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.35, 170),
    },
    {
      rotulo: "aresta direita",
      origem: `borda dir da cabeça · faceta de ${FACETAS.dir.larguraTopo} a ${FACETAS.dir.larguraBase}`,
      vb: caixa(bordasEm(CAIXA_CABECA.y0 + 0.45 * CAIXA_CABECA.alt).dir - 20, CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.45, 170),
    },
    {
      rotulo: "queixo",
      origem: `faixa de ${FACETAS.queixo.altura} u a ${FACETAS.queixo.delta} níveis, acima de y=${CAIXA_CABECA.y1.toFixed(0)}`,
      vb: caixa(CENTRO_X + 20, yQueixo, 200),
    },
    {
      rotulo: "sombra abaixo do queixo",
      origem: `${FACETAS.sombraQueixo.altura} u a ${FACETAS.sombraQueixo.delta} níveis, no clip do tronco`,
      vb: caixa(CENTRO_X, CAIXA_CABECA.y1 + 10, 260),
    },
    {
      rotulo: "canto do olho",
      origem: `OLHO_CX_ESQ=${OLHO_CX_ESQ} · topo em ${OLHO_CY_ESQ - OLHO.h / 2}`,
      vb: caixa(OLHO_CX_ESQ, OLHO_CY_ESQ - OLHO.h / 2, 96),
    },
    {
      rotulo: "canto do especular",
      origem: `LUZ · mancha medida ${ESPECULAR.rx * 2}×${ESPECULAR.ry * 2} em (${ESPECULAR.cx}, ${ESPECULAR.cy}), a 31 u do contorno`,
      vb: caixa(ESPECULAR.cx, ESPECULAR.cy, 150),
    },
    {
      rotulo: "base do tronco",
      origem: `TRONCO.yBase=${TRONCO.yBase} · arremate ry=${TRONCO.ryArremate} · sombra do chão`,
      vb: caixa(CENTRO_X, TRONCO.yBase - 10, 330),
    },
  ];
}

/**
 * O recorte de cada SOBRANCELHA, no MESMO tamanho de caixa, para irem um ao lado do
 * outro na mesma escala.
 *
 * Este painel era das duas orelhas, e existia para mostrar a assimetria que passou
 * verde no 1b: elas saíam idênticas quando a referência tem 24 de um lado e 15 do
 * outro. A arte definitiva não tem orelhas, e o par que carrega a assimetria agora é
 * este — **as duas sobrancelhas estão a alturas diferentes**, e a diferença é o
 * mesmo giro.
 *
 * Vale a mesma lição de leitura: um close por peça em painéis distantes não deixa
 * comparar, e comparar é a única coisa que revela desnível.
 */
function caixasDasSobrancelhas(): { esq: string; dir: string; desnivel: number } {
  const lado = 120;
  return {
    esq: caixa(OLHO_CX_ESQ, CENHO_ESQ_CY, lado),
    dir: caixa(OLHO_CX_DIR, CENHO_DIR_CY, lado),
    desnivel: CENHO_ESQ_CY - CENHO_DIR_CY,
  };
}

/**
 * O MAPA DAS FACETAS — cada faceta pintada de cor sinalizadora.
 *
 * É a folha que teria pegado o "efeito cubo" faltando. A folha normal mostra o
 * boneco ao lado da referência e o olho compara tom com tom, que é justamente o que
 * ele faz mal: a faceta esquerda da referência tem −5 níveis no alto, e cinco níveis
 * de 221 não se veem lado a lado. Pintadas de magenta e ciano, existir ou não existir
 * é binário.
 *
 * As cores são deliberadamente feias e fora da paleta: ninguém confunde este painel
 * com o desenho.
 */
function mapaDeFacetas(ns: string): string {
  // `LINHA` importado, e não o literal `#241610` que estava escrito aqui à mão. Ele
  // ficou defasado no instante em que a paleta mudasse, e este painel passaria a
  // desenhar um contorno de cor diferente do resto da folha sem ninguém notar — a
  // segunda cópia de um valor é sempre a que diverge.
  const traco = `fill="none" stroke="${LINHA}" stroke-width="${TRACO}" stroke-linejoin="round" stroke-linecap="round"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" ` +
    `width="${Math.round((260 * VIEWBOX.w) / VIEWBOX.h)}" height="260">` +
    `<defs><clipPath id="${ns}-mc"><path d="${pathCabeca()}"/></clipPath>` +
    `<clipPath id="${ns}-mt"><path d="${pathTronco()}"/></clipPath></defs>` +
    `<path d="${pathTronco()}" fill="#EDE7DC"/>` +
    `<g clip-path="url(#${ns}-mt)">` +
    `<path d="${pathSombraQueixoTronco()}" fill="#1B5E20"/>` +
    `</g>` +
    `<path d="${pathTronco()}" ${traco}/>` +
    `<path d="${pathCabeca()}" fill="#F2E9DA"/>` +
    `<g clip-path="url(#${ns}-mc)">` +
    `<path d="${pathFacetaEsq()}" fill="#E91E8C" opacity=".85"/>` +
    `<path d="${pathFacetaDir()}" fill="#00B8D4" opacity=".85"/>` +
    `</g>` +
    `<path d="${pathCabeca()}" ${traco}/>` +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(DIAG, { recursive: true });

  const svg = compor({ pele: PELE_COMPARACAO, cabelo: CABELO_COMPARACAO, animado: true, ns: "kk" });
  const problemas = conferirSvg(svg);
  const formas = contarFormas(svg);
  const bytes = Buffer.byteLength(svg, "utf-8");
  const estourou: string[] = [];

  console.log(`base careca — teto de REGRESSÃO, o valor medido no Bloco 1d:`);
  if (formas !== TETO_BASE_FORMAS) {
    estourou.push(`formas da base: ${formas} contra as ${TETO_BASE_FORMAS} congeladas`);
  }
  if (bytes !== TETO_BASE_BYTES) {
    estourou.push(`bytes da base: ${bytes} contra os ${TETO_BASE_BYTES} congelados`);
  }
  console.log(
    `  formas ............ ${formas}   (congelado ${TETO_BASE_FORMAS})` +
      `${formas !== TETO_BASE_FORMAS ? "   ✗ MUDOU" : ""}`,
  );
  console.log(
    `  bytes ............. ${bytes} (${(bytes / 1024).toFixed(2)} KB)   ` +
      `(congelado ${TETO_BASE_BYTES})${bytes !== TETO_BASE_BYTES ? "   ✗ MUDOU" : ""}`,
  );
  console.log(`  conferirSvg ....... ${problemas.length} problema(s)`);
  for (const p of problemas) console.log(`    - ${p.detalhe}`);
  writeFileSync(`${DIAG}/base.svg`, svg);

  // ---- o composto: base + UM cabelo, que é o que um aluno carrega -------------
  console.log(
    `\ncomposto — base + 1 cabelo (teto ${TETO_COMPOSTO_FORMAS} formas / ${TETO_COMPOSTO_BYTES} bytes):`,
  );
  for (const m of MODELOS_CABELO) {
    const comCabelo = compor({
      pele: PELE_COMPARACAO,
      cabelo: CABELO_COMPARACAO,
      modeloCabelo: m,
      animado: true,
      ns: "kk",
    });
    const f = contarFormas(comCabelo);
    const b = Buffer.byteLength(comCabelo, "utf-8");
    const folga = folgaDoRosto(m);
    const ruimSvg = conferirSvg(comCabelo);
    if (f > TETO_COMPOSTO_FORMAS) estourou.push(`${m}: ${f} formas`);
    if (b > TETO_COMPOSTO_BYTES) estourou.push(`${m}: ${b} bytes`);
    if (ruimSvg.length) estourou.push(`${m}: ${ruimSvg.length} problema(s) de contrato`);
    // A folga do rosto é a amarra 1 de `cabelo.ts`: franja que encosta na
    // sobrancelha apaga a expressão no tamanho do ranking.
    const pior = Math.min(folga.esq, folga.dir);
    if (pior < FOLGA_ROSTO) estourou.push(`${m}: folga do rosto ${pior.toFixed(1)}`);
    const fmt = (v: number) => (v === Infinity ? "  —  " : v.toFixed(1).padStart(5));
    console.log(
      `  ${CABELOS[m].nome.padEnd(12)} ${String(f).padStart(2)} formas (+${f - formas})   ` +
        `${String(b).padStart(5)} bytes (+${String(b - bytes).padStart(4)})   ` +
        `folga do rosto esq ${fmt(folga.esq)} dir ${fmt(folga.dir)}` +
        `${pior < FOLGA_ROSTO ? "   ✗" : ""}`,
    );
  }

  // A referência entra na folha uma vez POR PAINEL, e são treze. O PNG original
  // tem 964 KB, e treze cópias em base64 passam de 16 MB de HTML — o
  // `setContent` do Chromium estoura os 30 s nisso. Requantizar para 64 cores
  // resolve sem perder nada que importe: a referência é ilustração de cor
  // chapada, e a resolução (1254 px) fica intacta, que é o que os closes usam.
  const refPng = await sharp(readFileSync(REFERENCIA)).png({ palette: true, colours: 64 }).toBuffer();
  const refUri = `data:image/png;base64,${refPng.toString("base64")}`;
  console.log(
    `\nreferência embutida: ${(refPng.length / 1024).toFixed(0)} KB requantizados × 13 painéis`,
  );

  const recortes = closes();
  console.log(`\ncloses de coordenada medida (nenhum número escolhido a olho):`);
  for (const c of recortes) console.log(`  ${c.rotulo.padEnd(20)} "${c.vb}"   ← ${c.origem}`);

  const nav: Browser = await chromium.launch();
  try {
    const pg = await nav.newPage();

    /**
     * A base num tamanho e num `viewBox`.
     *
     * `ns` é o SEGUNDO parâmetro, e não o último com valor padrão, de propósito.
     * Ele era o último e tinha padrão `"kk"`, e esta folha renderiza NOVE
     * bonecos no mesmo documento — os quatro tamanhos e os cinco closes saíam
     * todos com o mesmo prefixo, e portanto com `clipPath` de `id` repetido. O
     * navegador resolve a colisão para o primeiro, e como as nove geometrias
     * eram idênticas, nada mudava na tela. Era a colisão de `id` real do
     * projeto, invisível.
     */
    const base = (h: number, ns: string, vb = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`, pele: string = PELE_COMPARACAO) => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      return compor({ pele, cabelo: CABELO_COMPARACAO, ns })
        .replace(`viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}"`, `viewBox="${vb}"`)
        .replace("<svg ", `<svg width="${Math.round((h * w0) / h0)}" height="${h}" `);
    };

    /** A referência recortada e escalada para a figura cair no mesmo lugar. */
    const refNoLugar = (h: number, vb = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`) => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round((h * w0) / h0)}" ` +
        `height="${h}" viewBox="${vb}" style="background:#F5F1EC">` +
        `<image href="${refUri}" x="${REF_X.toFixed(2)}" y="${REF_Y.toFixed(2)}" ` +
        `width="${REF_LADO.toFixed(2)}" height="${REF_LADO.toFixed(2)}"/></svg>`
      );
    };

    /** A base com um cabelo, num tamanho. */
    const comCabelo = (
      h: number,
      ns: string,
      modelo: ModeloCabelo | undefined,
      cor: string = CABELO_COMPARACAO,
    ) =>
      compor({ pele: PELE_COMPARACAO, cabelo: cor, modeloCabelo: modelo, ns }).replace(
        "<svg ",
        `<svg width="${Math.round((h * VIEWBOX.w) / VIEWBOX.h)}" height="${h}" `,
      );

    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:3px">${rot}</figcaption></figure>`;
    const titulo = (t: string, sub = "") =>
      `<p style="margin:20px 0 6px;font:13px system-ui"><b>${t}</b>` +
      (sub ? ` <span style="color:#888;font-weight:400">— ${sub}</span>` : "") + `</p>`;

    // ---- GATE (a): distinguibilidade a 56 px, MEDIDA ------------------------
    //
    // Não há como fazer isto sem renderizar: o que decide é o pixel, e dois paths
    // muito diferentes podem colapsar no mesmo desenho a 40 × 56. É o tamanho do
    // ranking, e pela regra 8 da §7 é o que manda.
    const L56 = { w: Math.round((56 * VIEWBOX.w) / VIEWBOX.h), h: 56 };
    const chapas: [string, Buffer][] = [];
    await pg.setViewportSize({ width: 120, height: 120 });
    for (const m of [undefined, ...MODELOS_CABELO] as (ModeloCabelo | undefined)[]) {
      await pg.setContent(
        `<body style="margin:0;background:#FFFFFF">${comCabelo(56, `g${m ?? "careca"}`, m)}</body>`,
      );
      const png = await pg.screenshot({ clip: { x: 0, y: 0, width: L56.w, height: L56.h } });
      chapas.push([m ? CABELOS[m].nome : "careca", await sharp(png).ensureAlpha().raw().toBuffer()]);
    }

    /** Fração de pixels que diferem em mais de 24 níveis em algum canal. */
    const distancia56 = (a: Buffer, b: Buffer): number => {
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        const d = Math.max(
          Math.abs(a[i] - b[i]),
          Math.abs(a[i + 1] - b[i + 1]),
          Math.abs(a[i + 2] - b[i + 2]),
        );
        if (d > 24) n++;
      }
      return n / (a.length / 4);
    };

    console.log(
      `\ndistinção a 56 px (${L56.w}×${L56.h} = ${L56.w * L56.h} px) — ` +
        `entre modelos ${(PISO_DISTINCAO * 100).toFixed(0)}%, contra a careca ` +
        `${(PISO_VISIBILIDADE * 100).toFixed(0)}%:`,
    );
    // `careca` é a primeira chapa, e comparar com ela testa VISIBILIDADE, não
    // distinção de catálogo. Os dois pisos são diferentes porque as duas perguntas
    // são diferentes — ver os docstrings das constantes.
    let piorPar = { a: "", b: "", d: 1 };
    for (let i = 0; i < chapas.length; i++) {
      for (let j = i + 1; j < chapas.length; j++) {
        const contraCareca = i === 0;
        const piso = contraCareca ? PISO_VISIBILIDADE : PISO_DISTINCAO;
        const d = distancia56(chapas[i][1], chapas[j][1]);
        if (!contraCareca && d < piorPar.d) piorPar = { a: chapas[i][0], b: chapas[j][0], d };
        if (d < piso) {
          estourou.push(
            `${chapas[i][0]} × ${chapas[j][0]}: ${(d * 100).toFixed(2)}% a 56 px, ` +
              `abaixo do piso de ${(piso * 100).toFixed(0)}%`,
          );
        }
        console.log(
          `  ${chapas[i][0].padEnd(12)} × ${chapas[j][0].padEnd(12)} ${(d * 100).toFixed(2)}%` +
            `${contraCareca ? "   (visibilidade)" : ""}${d < piso ? "   ✗" : ""}`,
        );
      }
    }
    console.log(
      `  par de catálogo mais parecido: ${piorPar.a} × ${piorPar.b} — ` +
        `${(piorPar.d * 100).toFixed(2)}%`,
    );

    // ---- os painéis do cabelo ----------------------------------------------
    const fileiraCabelo = (h: number, tag: string) =>
      `<div style="display:flex;gap:10px;align-items:flex-end">` +
      fig("careca", comCabelo(h, `${tag}careca`, undefined)) +
      MODELOS_CABELO.map((m) => fig(CABELOS[m].nome, comCabelo(h, `${tag}${m}`, m))).join("") +
      `</div>`;

    const secaoCabeloCor = MODELOS_CABELO.map((m) =>
      fig(
        CABELOS[m].nome,
        `<div style="display:flex;gap:2px">` +
          CABELO.map((c, i) => fig("", comCabelo(84, `cc${m}${i}`, m, c))).join("") +
          `</div>`,
      ),
    ).join("");

    // 1. os 4 tamanhos, e a referência ao lado em cada um
    const secaoTamanhos = TAMANHOS.map((t) =>
      fig(
        `${t} px${t === 56 ? " · o do ranking" : ""}`,
        `<div style="display:flex;gap:6px;align-items:flex-end;background:#fff;` +
          `border:1px solid #eee;padding:6px;border-radius:4px">` +
          fig("SVG", base(t, `tam${t}`)) +
          fig("referência", refNoLugar(t)) +
          `</div>`,
      ),
    ).join("");

    // 2. as 8 peles
    const secaoPeles = PELE.map((p, i) =>
      fig(`${i + 1} · ${p}`, base(150, `pele${i}`, `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`, p)),
    ).join("");

    // 3. os closes, SVG contra referência, no mesmo recorte
    const secaoCloses = recortes
      .map(
        (c, i) =>
          `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px">` +
          `<div style="width:230px;font:11px system-ui;color:#555;padding-top:60px">` +
          `<b>${c.rotulo}</b><br><span style="color:#999">${c.origem}</span><br>` +
          `<span style="color:#bbb">viewBox "${c.vb}"</span></div>` +
          fig("SVG", base(190, `close${i}`, c.vb)) +
          fig("referência", refNoLugar(190, c.vb)) +
          `</div>`,
      )
      .join("");

    // 4. as duas sobrancelhas, na mesma escala e uma ao lado da outra
    const ce = caixasDasSobrancelhas();
    const secaoSobrancelhas =
      `<div style="display:flex;gap:18px;align-items:flex-start">` +
      fig(
        `esquerda · centro y ${CENHO_ESQ_CY.toFixed(1)}`,
        `<div style="display:flex;gap:4px">` +
          fig("SVG", base(200, "ceE", ce.esq)) +
          fig("ref", refNoLugar(200, ce.esq)) +
          `</div>`,
      ) +
      fig(
        `direita · centro y ${CENHO_DIR_CY.toFixed(1)}`,
        `<div style="display:flex;gap:4px">` +
          fig("SVG", base(200, "ceD", ce.dir)) +
          fig("ref", refNoLugar(200, ce.dir)) +
          `</div>`,
      ) +
      `</div>`;

    // 5. O PAINEL DO TRAÇO — a leitura que decide, e é do Doug.
    //
    // Os dois lados saem do MESMO SVG, com `--av-traco` trocado por substituição de
    // texto. Isso não é conveniência: é a prova em imagem de que a geometria deixou
    // de depender da espessura do traço. Até o Bloco 1b, trocar `TRACO` mexia em
    // `MEIO`, e `MEIO` mexia na silhueta — os dois painéis teriam formas diferentes,
    // e a comparação não seria sobre o traço.
    const comTraco = (t: number) =>
      base(425, `tr${t}`).replace(`--av-traco:${TRACO}`, `--av-traco:${t}`);
    const secaoTraco =
      `<div style="display:flex;gap:10px;align-items:flex-end;background:#fff;` +
      `border:1px solid #eee;padding:8px;border-radius:4px">` +
      fig(`traço ${TRACO} — o medido na arte nova`, comTraco(TRACO)) +
      fig("traço 13 — o da arte anterior", comTraco(13)) +
      fig("referência", refNoLugar(425)) +
      `</div>`;

    // 6. O MAPA DAS FACETAS
    const secaoFacetas =
      `<div style="display:flex;gap:14px;align-items:flex-start">` +
      fig("mapa das facetas", mapaDeFacetas("mapa")) +
      fig("o SVG", base(260, "cmp")) +
      fig("referência", refNoLugar(260)) +
      `<div style="font:11px system-ui;color:#666;max-width:330px;line-height:1.5">` +
      `<b style="color:#E91E8C">■</b> faceta esquerda + queixo — ` +
      `${FACETAS.esq.larguraTopo} u a ${FACETAS.esq.deltaTopo} no topo, ` +
      `${FACETAS.esq.larguraBase} u a ${FACETAS.esq.deltaBase} na base<br>` +
      `<b style="color:#00B8D4">■</b> faceta direita — ` +
      `${FACETAS.dir.larguraTopo} u a ${FACETAS.dir.deltaTopo} no topo, ` +
      `${FACETAS.dir.larguraBase} u a ${FACETAS.dir.deltaBase} na base<br>` +
      `<b style="color:#1B5E20">■</b> sombra da cabeça no tronco — ` +
      `${FACETAS.sombraQueixo.altura} u a ${FACETAS.sombraQueixo.delta}<br><br>` +
      `<span style="color:#999">A faceta esquerda é o DOBRO da direita no topo. ` +
      `Essa razão é o giro: o lado esquerdo é o que vira para o observador, o ` +
      `direito é o que foge. Sumiram deste mapa a concha e a orelha direita — a ` +
      `arte definitiva não tem orelhas, e o giro passou a ler pelos olhos, pelas ` +
      `sobrancelhas e por esta razão de larguras.</span>` +
      `</div></div>`;

    await pg.setViewportSize({ width: 1500, height: 900 });
    await pg.setContent(
      `<body style="margin:0;background:#fff;padding:18px;font:12px system-ui;color:#555">` +
        `<h1 style="font:600 17px system-ui;margin:0 0 3px">Base kokeshi — a folha do Bloco 1d: ` +
        `sem orelhas, com sobrancelha e boca</h1>` +
        `<p style="margin:0;color:#888">O que se aprova é o <b>SVG</b>. A referência está ao lado só para comparar, ` +
        `alinhada por cálculo (escala ${REF_ESCALA.toFixed(3)}), e nunca vira asset. ` +
        `${formas} formas · ${(bytes / 1024).toFixed(2)} KB · conferirSvg ${problemas.length}.</p>` +
        titulo(
          "O TRAÇO — a leitura que decide",
          `na arte definitiva ele mede 11,9 no line-art e 11,2 no PNG, contra 12,7/12,6 na anterior; ` +
            `daí ${TRACO} onde era 13`,
        ) +
        secaoTraco +
        titulo(
          "O MAPA DAS FACETAS",
          "o rosto é um cubo: existir ou não existir cada faceta é binário aqui, e invisível na comparação lado a lado",
        ) +
        secaoFacetas +
        titulo(
          "OS CINCO CABELOS a 56 px — o gate (a)",
          `o par mais parecido é ${piorPar.a} × ${piorPar.b}, com ${(piorPar.d * 100).toFixed(2)}% ` +
            `de pixels diferentes contra o piso de ${(PISO_DISTINCAO * 100).toFixed(1)}%`,
        ) +
        fileiraCabelo(56, "a") +
        titulo("Os mesmos a 200 px", "a franja, o degrau de sombra e o encontro com a sobrancelha") +
        fileiraCabelo(200, "b") +
        titulo("As 8 cores de cabelo, em cada modelo", "var(--av-cabelo) e o degrau var(--av-cabelo-s)") +
        `<div style="display:flex;gap:12px;flex-wrap:wrap">${secaoCabeloCor}</div>` +
        titulo("Os quatro tamanhos", "56 px é o teste do ranking — se ele falhar, os outros três não salvam") +
        `<div style="display:flex;gap:14px;align-items:flex-end">${secaoTamanhos}</div>` +
        titulo("As 8 peles", "prova que var(--av-pele) recolore de verdade, e que a sombra da pele acompanha") +
        `<div style="display:flex;gap:8px;flex-wrap:wrap">${secaoPeles}</div>` +
        titulo(
          "As duas sobrancelhas, na mesma escala",
          `o giro em uma leitura só: elas estão a alturas diferentes, ${ce.desnivel.toFixed(1)} unidade de desnível`,
        ) +
        secaoSobrancelhas +
        titulo("Closes de coordenada medida", "cada viewBox sai de uma constante de geometria.ts") +
        secaoCloses +
        `</body>`,
    );
    await pg.screenshot({ path: FOLHA, fullPage: true });
    console.log(`\n${FOLHA}`);
    console.log(`${DIAG}/base.svg`);
    await pg.close();
  } finally {
    await nav.close();
  }

  if (problemas.length || estourou.length) {
    for (const e of estourou) console.error(`  ✗ ${e}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
