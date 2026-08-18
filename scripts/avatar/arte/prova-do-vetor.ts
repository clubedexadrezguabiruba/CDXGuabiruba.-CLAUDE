/**
 * P1 — A PROVA DO VETOR: uma roupa detalhada sobrevive à vetorização?
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA, E POR QUE ELA VEM ANTES DE TUDO
 * ---------------------------------------------------------------------------
 *
 * Este projeto tem **dois** modos de arte. O cabelo vira tabela de números e viaja
 * dentro do site; o traje vira PNG e viaja como download separado — 248 KB na peça
 * mais detalhada, 24× a mais chapada. Antes de investir em qualquer um dos dois
 * (otimizar o raster, ou desenhar as 38 peças que faltam), vale saber se **um**
 * caminho serve para os dois. Se servir, traje, chapéu, pet e óculos passam todos
 * pela cadeia do cabelo; se não servir, o PNG fica e a gente blinda o PNG.
 *
 * **A cobaia é o `traje-gambesao`** por três razões, e nenhuma é comodidade: é a peça
 * mais detalhada que existe (aerógrafo, 725 tons — o caso difícil de propósito), o
 * Doug **já a aprovou** na folha de 2026-08-13, o que dá verdade de referência, e ela
 * não custa nenhum desenho novo.
 *
 * ---------------------------------------------------------------------------
 * A PROVA É UM A/B, E POR ISSO NADA DO COMPOSITOR MUDA
 * ---------------------------------------------------------------------------
 *
 * `arteDoTraje()` emite **um** `<image>`, fora do clip do tronco e depois do contorno
 * (`compositor.ts:424`). Este programa compõe o boneco do jeito de sempre e troca
 * aquele `<image>` — e só ele — por um `<g>` de paths. Mesma posição na pilha, mesma
 * caixa, mesmo tudo: a única variável do experimento é raster × vetor.
 *
 * Trocar por regex é feio e é de propósito: **a alternativa seria mexer no compositor
 * para uma prova que pode terminar em "fica como está"**. O contrato é frágil e o
 * programa sabe disso — se não achar exatamente um `<image>`, ele lança.
 *
 * A conversão de coordenada é uma conta e não um ajuste: o PNG é o `viewBox` inteiro
 * recortado a 1,2 px/u (`traje.ts`, RECORTE 600 × 840), então 600 → 500 e 840 → 700
 * são a MESMA escala 5/6. Um `transform="scale(5/6)"` põe a arte no lugar 1 : 1.
 *
 * ---------------------------------------------------------------------------
 * O FUNDO SENTINELA — o VTracer não enxerga alfa
 * ---------------------------------------------------------------------------
 *
 * O PNG da peça é RGBA com alfa binário: 113 538 px opacos em 504 000, e o resto
 * transparente com RGB zerado. O VTracer ignora o canal alfa e lê aquilo como **preto
 * puro** — a peça sairia dentro de uma mancha preta do tamanho do `viewBox`.
 *
 * Então o transparente é achatado num magenta que a arte não tem (`#FF00FF`, matiz
 * 300° contra uma peça inteira de teal e marrom), e as formas que saem nessa cor são
 * descartadas pelo nome. Como o alfa é binário, o achatamento não inventa borda: não
 * há pixel meio-transparente para misturar com o magenta.
 *
 * O descarte é medido, nunca presumido: `magentaRestante` conta quanto de magenta
 * sobrou na peça reconstruída. Se sobrar, a sentinela vazou para a tela e o número de
 * fidelidade é ficção.
 *
 * ---------------------------------------------------------------------------
 * A BANCADA — três configurações, porque a calibração medida é de OUTRA arte
 * ---------------------------------------------------------------------------
 *
 * `estilo/vtracer.ts` traz `colorPrecision 5 · layerDifference 24 · filterSpeckle 8`,
 * com contra-exemplo para cada escolha. Aquilo foi calibrado numa arte **chapada**
 * (70,75% dos pixels em `#000000`, o resto em duas famílias de teal). O gambesão é o
 * oposto: gradiente de aerógrafo em 725 tons. Reaproveitar a configuração é o certo
 * como ponto de partida e seria errado como conclusão — então ela roda ao lado de uma
 * mais fiel e de uma mais leve, e as três aparecem na folha com o mesmo tratamento.
 */

import { gzipSync } from "zlib";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";

import sharp from "sharp";
import { ColorMode, Hierarchical, PathSimplifyMode, vectorize } from "@neplex/vectorizer";

import { CABELOS, ORCAMENTO_COMPOSTO } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CENTRO_X, TRACO, TRONCO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { TRAJES_DA_ARTE } from "../../../src/lib/avatar/estilo/trajes-da-arte";
import type { Traje } from "../../../src/lib/avatar/estilo/tipos";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarHtml, renderizarSvg } from "../render-svg";
import { CONFIG, prepararSvg } from "../estilo/vtracer";
import { CONFIG_ARTE } from "./peca-de-arte";
import { construir } from "./traje";
import { PASTA } from "./base";

/**
 * A cobaia. O padrão é o gambesão — o caso difícil de propósito —, e o argumento
 * existe porque a peça CHAPADA é a outra metade da pergunta: se o vetor só perde o
 * aerógrafo, a resposta deixa de ser "sim ou não" e vira uma regra por estilo de arte,
 * que é justamente o eixo em que o Doug já decidiu o catálogo (comuns chapadas,
 * raras/épicas aerografadas).
 */
const SLUG = process.argv.slice(2).find((a) => a.startsWith("traje-")) ?? "traje-gambesao";
const SAIDA = `.scratch/p1/${SLUG}`;

/** Os quatro tamanhos reais do produto, em altura de render. */
const TAMANHOS = [32, 56, 112, 425] as const;

/** O estado do boneco na prova. Um só, para a variável ser a arte. */
const EST = { pele: PELE[2], cabelo: CABELO[1], modeloCabelo: CABELOS.chanel } as const;

/** A cor que marca o vazio. A arte não tem magenta — ver o cabeçalho. */
const SENTINELA = { r: 255, g: 0, b: 255 };

/* ------------------------------------------------------------------ */
/* As configurações da bancada                                         */
/* ------------------------------------------------------------------ */

interface Variante {
  chave: string;
  rotulo: string;
  porque: string;
  cfg: Record<string, unknown>;
}

const VARIANTES: Variante[] = [
  {
    chave: "fiel",
    rotulo: "vetor FIEL",
    // NÃO é uma cópia: é a `CONFIG_ARTE` que a esteira usa de verdade. Se as duas
    // fossem escritas separado, a prova mediria uma peça e o produto desenharia
    // outra — que é o defeito nº 1 desta rota, o mesmo que `arte:trajes --check`
    // fecha do outro lado.
    //
    // (Ela se chamava `CONFIG_TRAJE` e mudou de nome em 2026-08-17, quando o passo 4
    // deixou de ser do traje. O valor não mudou — a prova continua sendo a mesma.)
    porque:
      "a configuração DE PRODUÇÃO (`CONFIG_ARTE`, em peca-de-arte.ts) — foi esta que o Doug aprovou",
    cfg: { ...CONFIG_ARTE },
  },
  {
    chave: "calibrado",
    rotulo: "vetor CALIBRADO",
    porque: "a configuração medida do cabelo, tal como está em estilo/vtracer.ts",
    cfg: { ...CONFIG, hierarchical: Hierarchical.Stacked },
  },
  {
    chave: "leve",
    rotulo: "vetor LEVE",
    porque: "colorPrecision 4 · layerDifference 32 · speckle 16 — menos paths, tom achatado",
    cfg: {
      ...CONFIG,
      hierarchical: Hierarchical.Stacked,
      colorPrecision: 4,
      layerDifference: 32,
      filterSpeckle: 16,
    },
  },
];

/* ------------------------------------------------------------------ */
/* A vetorização                                                       */
/* ------------------------------------------------------------------ */

const paraRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** Perto da sentinela dentro da quantização do traçador. */
function eSentinela(fill: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(fill)) return false;
  const [r, g, b] = paraRgb(fill);
  return r > 200 && g < 60 && b > 200;
}

export interface Forma {
  d: string;
  cor: string;
}

export interface Vetor {
  formas: Forma[];
  /** Formas descartadas por serem o fundo sentinela. */
  descartadas: number;
  /** Área somada das caixas, em fração da caixa da arte — só para o laudo. */
  bytesBruto: number;
  ms: number;
}

/**
 * O PNG da peça virando lista de formas, na coordenada da arte (600 × 840).
 *
 * A saída passa por `prepararSvg` de `estilo/vtracer.ts` — que soma o
 * `translate(dx,dy)` de cada camada dentro do `d` e lança se aparecer comando fora de
 * `M`/`C`/`Z`. Somar par a par só é exato nesses três, e um `H` pulado em silêncio
 * deslocaria a peça com todos os gates verdes.
 */
export async function vetorizar(png: string, cfg: Record<string, unknown>): Promise<Vetor> {
  const chapado = await sharp(png)
    .flatten({ background: SENTINELA })
    .png()
    .toBuffer();
  const { width, height } = await sharp(chapado).metadata();
  if (!width || !height) throw new Error(`prova-do-vetor: ${png} sem dimensão`);

  const t0 = Date.now();
  const bruto = await vectorize(chapado, cfg as never);
  const ms = Date.now() - t0;

  const pronto = prepararSvg(bruto, width, height);
  const formas: Forma[] = [];
  let descartadas = 0;
  for (const m of pronto.matchAll(/<path[^>]*\sd="([^"]*)"[^>]*\sfill="([^"]*)"[^>]*>/g)) {
    if (eSentinela(m[2])) {
      descartadas++;
      continue;
    }
    formas.push({ d: m[1], cor: m[2] });
  }
  // O casamento acima exige `d` antes de `fill`. Se o traçador inverter a ordem dos
  // atributos, o regex devolve zero formas e a folha sairia com o boneco pelado —
  // sem isto, em silêncio.
  const totalPaths = (pronto.match(/<path/g) ?? []).length;
  if (formas.length + descartadas !== totalPaths) {
    throw new Error(
      `prova-do-vetor: li ${formas.length + descartadas} de ${totalPaths} <path>. ` +
        `A ordem dos atributos do traçador mudou — o extrator precisa ser reescrito.`,
    );
  }

  return { formas, descartadas, bytesBruto: Buffer.byteLength(pronto), ms };
}

/* ------------------------------------------------------------------ */
/* A troca do `<image>` pelo `<g>` de paths                            */
/* ------------------------------------------------------------------ */

/**
 * O grupo vetorial, na coordenada do `viewBox`.
 *
 * `k = VIEWBOX.w / w` e `VIEWBOX.h / h` são o MESMO número (500/600 = 700/840 = 5/6)
 * porque o recorte do PNG é o `viewBox` inteiro. A conferência é aqui e não num
 * comentário: se um dia o recorte deixar de ser 5:7, a peça sairia esticada e nada
 * acusaria.
 */
export function grupoVetorial(v: Vetor, w: number, h: number): string {
  const kx = VIEWBOX.w / w;
  const ky = VIEWBOX.h / h;
  if (Math.abs(kx - ky) > 1e-9) {
    throw new Error(
      `prova-do-vetor: o PNG (${w}×${h}) não tem a proporção do viewBox ` +
        `(${VIEWBOX.w}×${VIEWBOX.h}) — kx=${kx} ky=${ky}. A peça sairia esticada.`,
    );
  }
  return (
    `<g transform="scale(${kx})">` +
    v.formas.map((f) => `<path d="${f.d}" fill="${f.cor}"/>`).join("") +
    `</g>`
  );
}

const RE_IMAGE = /<image\b[^>]*\/>/;

/** Compõe o boneco e troca o `<image>` do traje pelo grupo vetorial. */
export function comporVetorial(traje: Traje, grupo: string, ns: string, animado = false): string {
  const svg = compor({ ...EST, traje, ns, animado });
  const achados = svg.match(new RegExp(RE_IMAGE.source, "g")) ?? [];
  if (achados.length !== 1) {
    throw new Error(
      `prova-do-vetor: esperava exatamente 1 <image> no composto, achei ${achados.length}. ` +
        `O compositor mudou — a prova não é mais um A/B.`,
    );
  }
  return svg.replace(RE_IMAGE, grupo);
}

/* ------------------------------------------------------------------ */
/* As réguas                                                           */
/* ------------------------------------------------------------------ */

const contarFormas = (s: string) => (s.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/**
 * OS DEGRAUS DA DIFERENÇA — porque um número só para uma peça de GRADIENTE mente.
 *
 * A régua de 8 níveis nasceu para responder *"estas duas peças separam a 56 px?"*, e
 * ali ela está certa. Aplicada a um aerógrafo de 725 tons ela mede outra coisa: o
 * traçador reagrupa tons vizinhos, e um pixel que era 143 vira 149 — diferença de 6
 * em lugar nenhum, de 12 em muitos lugares, e **invisível nos dois casos**.
 *
 * Ler só "23% diferem" leria como peça diferente. Os degraus separam *tom deslocado*
 * (a massa em 8–24) de *desenho perdido* (o que passa de 64): um ilhós que sumiu não
 * difere por 12, difere por 200.
 */
const DEGRAUS = [8, 24, 64, 128] as const;

interface Diferenca {
  /** Pixels que diferem acima do limiar, sobre os que alguma das duas pinta. */
  fracao: number;
  /** A mesma fração, em cada degrau de `DEGRAUS`. */
  degraus: number[];
  /** Diferença média por canal, na união. */
  media: number;
  /** Pior canal em qualquer pixel. */
  pior: number;
  uniao: number;
}

/**
 * A fidelidade entre dois renders — a MESMA régua de `folha-traje.ts` (`distinguir`).
 *
 * O limiar de 8 níveis não é gosto: é o mesmo que a esteira do traje já usa para
 * dizer "isto mudou". Reutilizá-lo mantém os números desta prova comparáveis com os
 * que o Doug já viu.
 */
async function diferenca(a: string, b: string): Promise<Diferenca> {
  const [ia, ib] = await Promise.all(
    [a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  if (ia.data.length !== ib.data.length) throw new Error("prova-do-vetor: renders de tamanho diferente");
  let uniao = 0;
  let soma = 0;
  let pior = 0;
  const acima = DEGRAUS.map(() => 0);
  for (let i = 0; i < ia.info.width * ia.info.height; i++) {
    const j = i * 4;
    if (ia.data[j + 3] === 0 && ib.data[j + 3] === 0) continue;
    uniao++;
    let d = 0;
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(ia.data[j + c] - ib.data[j + c]));
    soma += d;
    if (d > pior) pior = d;
    for (let k = 0; k < DEGRAUS.length; k++) if (d > DEGRAUS[k]) acima[k]++;
  }
  return {
    fracao: uniao ? acima[0] / uniao : 0,
    degraus: acima.map((n) => (uniao ? n / uniao : 0)),
    media: uniao ? soma / uniao : 0,
    pior,
    uniao,
  };
}

/**
 * O REGISTRO — a peça vetorial caiu no MESMO pixel que o PNG?
 *
 * É a mesma busca de `folha-traje.ts`, e existe pelo mesmo motivo: sem ela, "23% dos
 * pixels diferem" tem duas causas possíveis — tom reagrupado ou peça deslocada — e
 * **um número para duas causas é o modo de falha desta rota inteira** (doc 19 §5).
 *
 * Corre sobre o PRETO, não sobre a massa. A massa de um traje é mancha larga e
 * chapada: deslocá-la 2 px muda uma fração do total e a busca não separa nada. As
 * linhas pretas são finas e de contraste máximo — um pixel de desvio já derruba a
 * concordância.
 */
async function registro(a: string, b: string): Promise<{ dx: number; dy: number; separacao: number }> {
  const [ia, ib] = await Promise.all(
    [a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  const { width: w, height: h } = ia.info;
  const preto = (d: Buffer) => {
    const m = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const j = i * 4;
      if (d[j + 3] > 128 && d[j] < 40 && d[j + 1] < 40 && d[j + 2] < 40) m[i] = 1;
    }
    return m;
  };
  const pa = preto(ia.data);
  const pb = preto(ib.data);
  const busca: { dx: number; dy: number; n: number }[] = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      let n = 0;
      for (let y = 2; y < h - 2; y++)
        for (let x = 2; x < w - 2; x++)
          if (pb[y * w + x] && pa[(y + dy) * w + (x + dx)]) n++;
      busca.push({ dx, dy, n });
    }
  }
  busca.sort((p, q) => q.n - p.n);
  const [m1, m2] = busca;
  return { dx: m1.dx, dy: m1.dy, separacao: m1.n ? (m1.n - m2.n) / m1.n : 0 };
}

/** Quanto de magenta sobrou na tela — o controle do descarte da sentinela. */
async function magentaNaTela(arq: string): Promise<number> {
  const { data, info } = await sharp(arq).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const j = i * 4;
    if (data[j + 3] === 0) continue;
    if (data[j] > 200 && data[j + 1] < 60 && data[j + 2] > 200) n++;
  }
  return n;
}

/** O mapa de diferença, para o olho ver ONDE o vetor se afasta. */
async function mapaDeDiferenca(a: string, b: string, saida: string): Promise<void> {
  const [ia, ib] = await Promise.all(
    [a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  const out = Buffer.alloc(ia.data.length);
  for (let i = 0; i < ia.info.width * ia.info.height; i++) {
    const j = i * 4;
    let d = 0;
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(ia.data[j + c] - ib.data[j + c]));
    // Branco onde é igual, vermelho na proporção da diferença: o olho lê a MANCHA,
    // não o valor. Escala saturando em 64 níveis — acima disso já é gritante.
    const t = Math.min(1, d / 64);
    out[j] = 255;
    out[j + 1] = Math.round(255 * (1 - t));
    out[j + 2] = Math.round(255 * (1 - t));
    out[j + 3] = 255;
  }
  await sharp(out, { raw: { width: ia.info.width, height: ia.info.height, channels: 4 } })
    .png()
    .toFile(saida);
}

/* ------------------------------------------------------------------ */
/* O recorte do tronco — coordenada MEDIDA, nunca escolhida a olho     */
/* ------------------------------------------------------------------ */

/**
 * A caixa do close, em FRAÇÃO do render — é o que faz o mesmo recorte valer nos
 * quatro tamanhos. Os limites saem de `folha-traje.ts`: a meia-largura máxima do
 * perfil do tronco mais o traço, e de logo abaixo do ombro até a base.
 */
const meioMax = Math.max(...TRONCO.perfil.map((q) => q.meio)) * 0.95 + TRACO / 2;
const CAIXA = {
  x0: (CENTRO_X - meioMax - 8) / VIEWBOX.w,
  x1: (CENTRO_X + meioMax + 8) / VIEWBOX.w,
  y0: (TRONCO.perfil[0].y + 20) / VIEWBOX.h,
  y1: (TRONCO.yBase + TRACO) / VIEWBOX.h,
} as const;

async function recortar(arq: string, saida: string, larguraFinal?: number): Promise<string> {
  const { width, height } = await sharp(arq).metadata();
  const w = width!;
  const h = height!;
  const left = Math.max(0, Math.round(CAIXA.x0 * w));
  const top = Math.max(0, Math.round(CAIXA.y0 * h));
  const cw = Math.max(1, Math.min(w - left, Math.round((CAIXA.x1 - CAIXA.x0) * w)));
  const ch = Math.max(1, Math.min(h - top, Math.round((CAIXA.y1 - CAIXA.y0) * h)));
  let img = sharp(arq).extract({ left, top, width: cw, height: ch });
  if (larguraFinal) img = img.resize({ width: larguraFinal, kernel: "nearest" });
  await img.toFile(saida);
  return saida;
}

/* ------------------------------------------------------------------ */
/* O programa                                                          */
/* ------------------------------------------------------------------ */

const b64 = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

interface Laudo {
  chave: string;
  rotulo: string;
  porque: string;
  formasNaPeca: number;
  descartadas: number;
  formasNoComposto: number;
  bytesComposto: number;
  bytesGzip: number;
  /** A peça sozinha, como arquivo `.svg` — o caminho "download separado", igual ao PNG. */
  bytesAvulso: number;
  gzipAvulso: number;
  /** A página do ranking: 30 bonecos, que é o caso real de pior custo. */
  bytesRanking: number;
  gzipRanking: number;
  ms: number;
  fid425: Diferenca;
  fidClose: Diferenca;
  reg: { dx: number; dy: number; separacao: number };
  /** O controle da terceira coluna: o `.svg` avulso pinta o mesmo que o embutido? */
  avulsoVsEmbutido: Diferenca;
  magenta: number;
}

async function principal() {
  const traje = TRAJES_DA_ARTE[SLUG];
  if (!traje?.tinta.arte) throw new Error(`${SLUG} não tem tinta.arte — rode \`npm run arte:trajes\``);

  mkdirSync(SAIDA, { recursive: true });

  // ---------------------------------------------------------- o referencial
  //
  // O RASTER É REGENERADO PELA ESTEIRA, e desde 2026-08-17 é só assim que ele
  // existe: o `.svg` tomou o lugar dele em `public/items/traje/`, e commitá-lo de
  // volta só para servir de régua seria pôr no deploy um arquivo que ninguém pede.
  // `construir()` o devolve em memória a partir da MESMA arte, e o arquivo abaixo é
  // temporário porque o `sharp` e o navegador querem um caminho.
  const { raster } = await construir(`${PASTA}/${SLUG}.png`);
  const pngPeca = `${SAIDA}/.referencia.png`;
  writeFileSync(pngPeca, raster);
  const { width: pw, height: ph } = await sharp(pngPeca).metadata();
  const bytesPng = statSync(pngPeca).size;

  const nav = await abrirNavegador();
  const larg = (h: number) => Math.round((h * VIEWBOX.w) / VIEWBOX.h);

  // O PNG entra em data-URI: `setContent` deixa a página em `about:blank`, e um
  // href relativo falharia EM SILÊNCIO — `<image>` de SVG não emite erro, só deixa
  // a área vazia (a lição já escrita em `folha-traje.ts`).
  const trajeFolha: Traje = {
    ...traje,
    tinta: { ...traje.tinta, arte: `data:image/png;base64,${raster.toString("base64")}` },
  };

  const renders: Record<string, Record<number, string>> = {};
  const closes: Record<string, Record<number, string>> = {};

  const renderizar = async (chave: string, svgDe: (ns: string) => string) => {
    renders[chave] = {};
    closes[chave] = {};
    for (const t of TAMANHOS) {
      const arq = `${SAIDA}/.r-${chave}-${t}.png`;
      await renderizarSvg(nav, svgDe(`${chave.replace(/\W/g, "")}${t}`), larg(t), t, arq);
      renders[chave][t] = arq;
      closes[chave][t] = await recortar(arq, `${SAIDA}/.c-${chave}-${t}.png`);
    }
  };

  await renderizar("raster", (ns) => compor({ ...EST, traje: trajeFolha, ns }));

  const laudos: Laudo[] = [];
  const svgSemTraje = compor({ ...EST, ns: "s0" });
  const svgRaster = compor({ ...EST, traje, ns: "s1" });

  for (const v of VARIANTES) {
    const vet = await vetorizar(pngPeca, v.cfg);
    const grupo = grupoVetorial(vet, pw!, ph!);
    await renderizar(v.chave, (ns) => comporVetorial(trajeFolha, grupo, ns));

    const composto = comporVetorial(traje, grupo, "s2");
    const fid425 = await diferenca(renders.raster[425], renders[v.chave][425]);
    const fidClose = await diferenca(closes.raster[425], closes[v.chave][425]);
    // A peça sozinha como arquivo, para o caminho "download separado" — o mesmo que o
    // PNG faz hoje. Ela existe no laudo porque VETOR e EMBUTIDO são duas escolhas
    // separadas, e juntá-las esconderia uma opção do Doug.
    const avulso =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pw} ${ph}" width="${pw}" height="${ph}">` +
      vet.formas.map((f) => `<path d="${f.d}" fill="${f.cor}"/>`).join("") +
      `</svg>`;
    writeFileSync(`${SAIDA}/${SLUG}-${v.chave}.svg`, avulso, "utf-8");
    // O CONTROLE DA TERCEIRA COLUNA. "Avulso" só é uma opção de verdade se o mesmo
    // vetor, entregue como ARQUIVO dentro do `<image>` que já existe, pintar o mesmo
    // pixel que o vetor embutido. O navegador desenha SVG-em-`<image>` em modo
    // estático seguro, que é outro caminho de código — presumir que dá igual seria
    // exatamente o tipo de suposição que esta rota já pagou cinco vezes.
    const arqAvulso = `${SAIDA}/.a-${v.chave}.png`;
    await renderizarSvg(
      nav,
      compor({
        ...EST,
        traje: {
          ...traje,
          tinta: {
            ...traje.tinta,
            arte: `data:image/svg+xml;base64,${Buffer.from(avulso).toString("base64")}`,
          },
        },
        ns: `av${v.chave}`,
      }),
      larg(425),
      425,
      arqAvulso,
    );
    const avulsoVsEmbutido = await diferenca(renders[v.chave][425], arqAvulso);
    // O ranking: 30 bonecos na mesma página. O `ns` muda em cada um (é o que impede
    // colisão de `clipPath`), então as 30 cópias NÃO são byte a byte iguais.
    const ranking = Array.from({ length: 30 }, (_, i) => comporVetorial(traje, grupo, `r${i}`)).join("");
    laudos.push({
      chave: v.chave,
      rotulo: v.rotulo,
      porque: v.porque,
      formasNaPeca: vet.formas.length,
      descartadas: vet.descartadas,
      formasNoComposto: contarFormas(composto),
      bytesComposto: Buffer.byteLength(composto),
      bytesGzip: gzipSync(Buffer.from(composto)).length,
      bytesAvulso: Buffer.byteLength(avulso),
      gzipAvulso: gzipSync(Buffer.from(avulso)).length,
      bytesRanking: Buffer.byteLength(ranking),
      gzipRanking: gzipSync(Buffer.from(ranking)).length,
      ms: vet.ms,
      fid425,
      fidClose,
      reg: await registro(renders.raster[425], renders[v.chave][425]),
      avulsoVsEmbutido,
      magenta: await magentaNaTela(renders[v.chave][425]),
    });
  }

  // ------------------------------------------------------ os mapas de diferença
  for (const l of laudos) {
    await mapaDeDiferenca(closes.raster[425], closes[l.chave][425], `${SAIDA}/.d-${l.chave}.png`);
  }

  await nav.close();

  /* ---------------------------------------------------------------- a folha */
  const colunas = ["raster", ...VARIANTES.map((v) => v.chave)];
  const nomeCol = (c: string) =>
    c === "raster" ? "PNG aprovado (o que está no ar)" : VARIANTES.find((v) => v.chave === c)!.rotulo;

  let html = `<style>
    body{margin:0;background:#F4F1EC;font:12px/1.45 ui-sans-serif,system-ui;color:#2A2A2E}
    h1{font:600 16px system-ui;margin:0 0 4px}
    h2{font-size:12px;margin:26px 0 8px;letter-spacing:.06em;text-transform:uppercase;color:#6B6560}
    p.n{margin:0 0 14px;color:#6B6560;font-size:11px}
    table{border-collapse:collapse}
    td,th{padding:8px 12px;vertical-align:bottom;text-align:center}
    th{font:600 11px system-ui;color:#3A3A3E;border-bottom:1px solid #DAD5CE}
    td.lab{font:600 11px ui-monospace,monospace;color:#8A837D;text-align:right;vertical-align:middle}
    .bl{background:#FFF;border-radius:8px;padding:14px 16px;display:inline-block}
    .z{image-rendering:pixelated}
    .wrap{padding:20px 24px}
    .cap{font-size:10px;color:#8A837D}
  </style><div class="wrap">
  <h1>P1 — a prova do vetor · ${SLUG}</h1>
  <p class="n">a pergunta é uma só: as canaletas, os ilhoses e o cordão continuam lá,
  e a peça continua bonita? · os números estão no terminal, nunca aqui</p>`;

  html += `<h2>1 · o boneco inteiro, nos quatro tamanhos reais</h2><div class="bl"><table><tr><th></th>`;
  for (const c of colunas) html += `<th>${nomeCol(c)}</th>`;
  html += `</tr>`;
  for (const t of TAMANHOS) {
    html += `<tr><td class="lab">${t} px</td>`;
    for (const c of colunas) html += `<td><img src="${b64(renders[c][t])}" style="height:${t}px"></td>`;
    html += `</tr>`;
  }
  html += `</table></div>`;

  html += `<h2>2 · o mesmo recorte do tronco, ampliado 4× sem suavizar — o que sobrevive em cada tamanho</h2>
  <p class="n">é o pixel REAL de cada tamanho, esticado. a 32 e 56 px a pergunta é se a peça ainda lê como gambesão</p>
  <div class="bl"><table><tr><th></th>`;
  for (const c of colunas) html += `<th>${nomeCol(c)}</th>`;
  html += `</tr>`;
  for (const t of TAMANHOS) {
    const alt = t <= 112 ? t * 4 : 420;
    html += `<tr><td class="lab">${t} px</td>`;
    for (const c of colunas)
      html += `<td><img class="z" src="${b64(closes[c][t])}" style="height:${alt}px"></td>`;
    html += `</tr>`;
  }
  html += `</table></div>`;

  html += `<h2>3 · onde o vetor se afasta do PNG — recorte a 425 px</h2>
  <p class="n">branco = idêntico · vermelho = diferente, saturando em 64 níveis de canal</p>
  <div class="bl"><table><tr><th>PNG aprovado</th>`;
  for (const l of laudos) html += `<th>${l.rotulo}</th>`;
  html += `</tr><tr><td><img src="${b64(closes.raster[425])}" style="height:420px"></td>`;
  for (const l of laudos) html += `<td><img src="${b64(`${SAIDA}/.d-${l.chave}.png`)}" style="height:420px"></td>`;
  html += `</tr></table></div></div>`;

  const arqHtml = `${SAIDA}/folha-prova-vetor.html`;
  const arqPng = `${SAIDA}/folha-prova-vetor.png`;
  writeFileSync(arqHtml, html, "utf-8");
  const nav2 = await abrirNavegador();
  await renderizarHtml(nav2, html, 1400, arqPng);
  await nav2.close();

  /* ---------------------------------------------------------------- o laudo */
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  const pct = (n: number) => `${(100 * n).toFixed(2)}%`;

  console.log(`\nP1 — A PROVA DO VETOR — ${SLUG}\n`);
  console.log(`  a arte de partida   ${pngPeca}   ${pw}×${ph}   ${kb(bytesPng!)}`);
  console.log(`  o referencial       o mesmo PNG que está no ar, aprovado em 2026-08-13`);
  console.log(`  o composto sem traje ${contarFormas(svgSemTraje)} formas   ${kb(Buffer.byteLength(svgSemTraje))}`);
  console.log(
    `  o composto raster    ${contarFormas(svgRaster)} formas   ${kb(Buffer.byteLength(svgRaster))}` +
      `   + ${kb(bytesPng!)} de download separado`,
  );

  console.log(`\n  (a) O CUSTO DE CURADORIA — quantos fragmentos pedem papel humano`);
  console.log(
    `      Para o CABELO a resposta foi 46, e cada um precisa de um papel (massa ou clara)\n` +
      `      porque o cabelo RECOLORE. O traje não recolore: a cor é assada no desenho\n` +
      `      (emenda à D27), e a cor de cada forma sai medida do pixel. Ninguém rotula nada.\n` +
      `      Custo de curadoria por peça de traje: ZERO. O número abaixo é só o tamanho da peça.`,
  );

  console.log(`\n  (b) AS FORMAS — contra o teto declarado no P0`);
  console.log(
    `      ${"variante".padEnd(16)}${"na peça".padStart(9)}${"no composto".padStart(13)}` +
      `${"traçar".padStart(9)}`,
  );
  for (const l of laudos) {
    console.log(
      `      ${l.rotulo.padEnd(16)}${String(l.formasNaPeca).padStart(9)}` +
        `${String(l.formasNoComposto).padStart(13)}${`${l.ms} ms`.padStart(9)}`,
    );
  }
  console.log(
    `\n      ORCAMENTO_COMPOSTO = ${ORCAMENTO_COMPOSTO.formas} formas / ${ORCAMENTO_COMPOSTO.bytes} B, e ele é ` +
      `de base + 1 cabelo.\n` +
      `      Hoje o traje custa ZERO forma, porque é um <image>: o composto raster tem ` +
      `${contarFormas(svgRaster)}.\n` +
      `      Todo número acima disso é teto NOVO a declarar — e é a conta a ver antes de escolher.`,
  );

  console.log(`\n  (c) O PESO — e ele tem três colunas porque há três jeitos de entregar`);
  console.log(
    `      ${"variante".padEnd(16)}${"embutido".padStart(11)}${"gzip".padStart(9)}` +
      `${"avulso .svg".padStart(13)}${"gzip".padStart(9)}${"ranking ×30".padStart(13)}${"gzip".padStart(9)}`,
  );
  console.log(
    `      ${"PNG (hoje)".padEnd(16)}${"—".padStart(11)}${"—".padStart(9)}` +
      `${kb(bytesPng).padStart(13)}${kb(gzipSync(readFileSync(pngPeca)).length).padStart(9)}` +
      `${kb(bytesPng).padStart(13)}${kb(gzipSync(readFileSync(pngPeca)).length).padStart(9)}`,
  );
  for (const l of laudos) {
    console.log(
      `      ${l.rotulo.padEnd(16)}${kb(l.bytesComposto).padStart(11)}${kb(l.bytesGzip).padStart(9)}` +
        `${kb(l.bytesAvulso).padStart(13)}${kb(l.gzipAvulso).padStart(9)}` +
        `${kb(l.bytesRanking).padStart(13)}${kb(l.gzipRanking).padStart(9)}`,
    );
  }
  console.log(
    `\n      "embutido" = um boneco dentro do HTML, que é o que o vetor faz hoje com o cabelo.\n` +
      `      "avulso" = a peça como ARQUIVO, baixada uma vez e cacheada — o que o PNG faz hoje.\n` +
      `        É a coluna que separa duas decisões que parecem uma: **vetor** e **embutido**.\n` +
      `        O <image> do compositor já aceita .svg: nada muda no código, só o arquivo.\n` +
      `        CONTROLE — o avulso pinta o mesmo que o embutido? ` +
      laudos.map((l) => `${l.chave} ${pct(l.avulsoVsEmbutido.fracao)}`).join(" · ") +
      `\n        (tem de ser ~0%; acima disso o navegador desenha os dois caminhos diferente)\n` +
      `      "ranking ×30" = 30 bonecos na mesma página, o pior caso real. O PNG é baixado UMA\n` +
      `        vez e as 30 cópias custam um <image> cada; o embutido paga as 30.`,
  );

  console.log(`\n  (d) A FIDELIDADE contra o raster aprovado, a 425 px`);
  console.log(
    `      ${"variante".padEnd(16)}${"registro".padStart(11)}${"separa".padStart(9)}` +
      `${"médio".padStart(8)}` +
      DEGRAUS.map((g) => `>${g}`.padStart(9)).join("") +
      `${"pior".padStart(7)}${"magenta".padStart(9)}`,
  );
  for (const l of laudos) {
    console.log(
      `      ${l.rotulo.padEnd(16)}${`(${l.reg.dx}, ${l.reg.dy})`.padStart(11)}` +
        `${pct(l.reg.separacao).padStart(9)}${l.fid425.media.toFixed(1).padStart(8)}` +
        l.fid425.degraus.map((f) => pct(f).padStart(9)).join("") +
        `${String(l.fid425.pior).padStart(7)}${String(l.magenta).padStart(9)}`,
    );
  }
  console.log(`\n      o mesmo, só no RECORTE do tronco — onde a peça de fato está`);
  for (const l of laudos) {
    console.log(
      `      ${l.rotulo.padEnd(16)}${"".padStart(11)}${"".padStart(9)}` +
        `${l.fidClose.media.toFixed(1).padStart(8)}` +
        l.fidClose.degraus.map((f) => pct(f).padStart(9)).join("") +
        `${String(l.fidClose.pior).padStart(7)}`,
    );
  }
  console.log(
    `\n      "registro" tem de ser (0, 0): é a prova de que a peça vetorial caiu no MESMO pixel\n` +
      `        que o PNG. Sem ela, uma diferença de tom e uma peça deslocada dariam o mesmo\n` +
      `        número — um número para duas causas é o modo de falha desta rota (doc 19 §5).\n` +
      `        "separa" é o controle da própria busca: perto de zero quer dizer empate, e aí\n` +
      `        o registro não vale.\n` +
      `      os DEGRAUS: ">8" é a régua que a esteira já usa para dizer "isto mudou", e num\n` +
      `        aerógrafo de 725 tons ela acende com tom reagrupado, que ninguém vê. ">64" é\n` +
      `        desenho perdido de verdade: um ilhós que sumiu não difere por 12, difere por 200.\n` +
      `      "magenta" é o controle da sentinela: tem de ser 0 px. Qualquer valor acima quer\n` +
      `        dizer que o fundo descartado vazou para a tela, e aí toda esta tabela é ficção.`,
  );

  const desregistrado = laudos.filter((l) => l.reg.dx !== 0 || l.reg.dy !== 0);
  if (desregistrado.length) {
    console.error(
      `\n  ✗ DESREGISTRADA: ${desregistrado.map((l) => l.rotulo).join(", ")}. ` +
        `A prova deixou de ser um A/B.`,
    );
    process.exitCode = 1;
  }

  const vazou = laudos.filter((l) => l.magenta > 0);
  if (vazou.length) {
    console.error(
      `\n  ✗ SENTINELA NA TELA em ${vazou.map((l) => l.rotulo).join(", ")}. ` +
        `Os números de fidelidade não valem.`,
    );
    process.exitCode = 1;
  }

  console.log(`\n  as configurações da bancada`);
  for (const v of VARIANTES) console.log(`    ${v.rotulo.padEnd(16)} ${v.porque}`);

  console.log(`\n  escritos            ${arqPng}\n                      ${arqHtml}`);
  console.log(
    `\n  QUEM DECIDE É O DOUG, OLHANDO A FOLHA. Os números acima são diagnóstico e\n` +
      `  orçamento — se ele aprovar e um número doer, o número vira decisão dele.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
