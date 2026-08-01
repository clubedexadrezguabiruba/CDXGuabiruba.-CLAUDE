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
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { LINHA, PELE } from "../../../src/lib/avatar/palette";

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

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-base.png`;
const REFERENCIA = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";

/** Os quatro tamanhos de leitura. 56 é o do ranking e é o que manda. */
const TAMANHOS = [56, 100, 200, 425] as const;

/**
 * OS DOIS TETOS DO ORÇAMENTO, e eles **reprovam** — não são mais só impressos.
 *
 * Eram dois números no relatório, e número impresso é número que se aprende a
 * ignorar. Este projeto tem a lição medida: o `verify:avatar-assets` ficou vermelho
 * por meses sem ninguém saber. Um teto que não reprova não é teto.
 *
 * **20 formas** porque o boneco é a base de 60 desenhos e 30 deles aparecem juntos
 * no ranking a 56 px; **7 680 bytes** (7,5 KB) porque cada aluno carrega um destes e
 * o alvo do doc 15 é o app abrir em rede de escola.
 *
 * Onde o corte do Bloco 1d foi feito, e onde ele NÃO podia ser feito, está em
 * `pathPlanoLateralTronco()` — arredondar coordenada para inteiro pagaria 1,5 KB e
 * derruba o raio mínimo do contorno de 34,4 para 14,5.
 */
const TETO_FORMAS = 20;
const TETO_BYTES = 7680;

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

  const svg = compor({ pele: PELE_COMPARACAO, cabelo: "#3A2F2A", animado: true, ns: "kk" });
  const problemas = conferirSvg(svg);
  // `use` CONTA. A cabeça e o tronco viraram `<path>` em `<defs>` referenciados por
  // `<use>` para o contorno de 29 pontos não ser escrito três vezes; se o contador
  // ignorasse `use`, o orçamento de formas passaria a mentir para menos justamente
  // por causa da mudança que o fez caber.
  const formas = (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
  const bytes = Buffer.byteLength(svg, "utf-8");

  console.log(`base autorada:`);
  const estourou = [
    formas > TETO_FORMAS ? `formas: ${formas} contra o teto de ${TETO_FORMAS}` : "",
    bytes > TETO_BYTES ? `bytes: ${bytes} contra o teto de ${TETO_BYTES}` : "",
  ].filter(Boolean);
  console.log(
    `  formas ............ ${formas}   (teto ${TETO_FORMAS})${formas > TETO_FORMAS ? "   ✗ ESTOUROU" : ""}`,
  );
  console.log(
    `  bytes ............. ${bytes} (${(bytes / 1024).toFixed(2)} KB)   ` +
      `(teto ${TETO_BYTES})${bytes > TETO_BYTES ? "   ✗ ESTOUROU" : `   folga ${TETO_BYTES - bytes}`}`,
  );
  console.log(`  conferirSvg ....... ${problemas.length} problema(s)`);
  for (const p of problemas) console.log(`    - ${p.detalhe}`);
  writeFileSync(`${DIAG}/base.svg`, svg);

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
      return compor({ pele, cabelo: "#3A2F2A", ns })
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

    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:3px">${rot}</figcaption></figure>`;
    const titulo = (t: string, sub = "") =>
      `<p style="margin:20px 0 6px;font:13px system-ui"><b>${t}</b>` +
      (sub ? ` <span style="color:#888;font-weight:400">— ${sub}</span>` : "") + `</p>`;

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
