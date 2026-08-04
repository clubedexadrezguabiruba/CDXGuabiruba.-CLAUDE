/**
 * O SVG DO CONVERSOR COMO FONTE DE MEDIÇÃO — ler, classificar, remontar, rasterizar.
 *
 * O pipeline padrão passa a ser PNG → conversor Adobe → SVG → a régua extrai traço,
 * curva e tom. Este arquivo é o lado do SVG; `tracar-cabelo.ts` continua sendo o lado
 * do PNG, e a geometria não sabe de qual dos dois veio o booleano.
 *
 * ---------------------------------------------------------------------------
 * POR QUE RASTERIZAR POR FAMÍLIA, E NÃO AMOSTRAR AS BÉZIER
 * ---------------------------------------------------------------------------
 *
 * Amostrar as curvas com `getPointAtLength` seria o caminho "exato", e ele cai por
 * três motivos medidos nesta arte:
 *
 *  - a silhueta do cabelo é a **união de 192 paths**, e união booleana de Bézier não
 *    existe aqui;
 *  - a amostragem devolveria a **borda do preenchimento**, e `cabelo.ts` guarda a
 *    **linha de centro do preto** — meia espessura de diferença, sistemática;
 *  - o preto do cabelo **não é um path**: ele está partido em 120 fragmentos que
 *    rasterizam em 88 componentes.
 *
 * Remontar um `<svg>` por família e rasterizar responde às três de uma vez: a união
 * acontece no raster, a linha de centro sai da mesma sondagem por normal que o PNG
 * usa, e fragmento é só mais um pedaço de máscara.
 *
 * A amostragem exata de Bézier fica para os dois papéis em que o alvo é **um** path
 * conhecido — os âncoras e a conferência de borda —, e para isso existe `dDoSubpath`.
 *
 * ---------------------------------------------------------------------------
 * AS TRÊS AMARRAS QUE NÃO SÃO ZELO
 * ---------------------------------------------------------------------------
 *
 * **1. A moldura cai por ÁREA, nunca por índice.** Neste arquivo ela é o subpath 0 do
 * path 0, mas o conversor não promete ordem, e a próxima arte pode não pô-la em
 * primeiro lugar. Ver `eMoldura`.
 *
 * **2. Comando desconhecido em `d` LANÇA.** Hoje o arquivo só tem `M C z`. Um `L` ou
 * um `a` pulado em silêncio deformaria o subpath sem sintoma nenhum: a curva sairia
 * mais curta, a área menor, e todo número derivado dela continuaria plausível.
 *
 * **3. O teal ESCURO é traço, e ele passaria no teste de matiz.** `#040D0C` tem matiz
 * 173,3° e saturação 0,53 — `eMatizDeCabelo` diz sim. Se ele entrar no
 * preenchimento, a máscara ganha meia espessura de gordura em todo o perímetro e a
 * linha de centro sai deslocada de forma **sistemática**, que é o erro invisível a
 * toda amarra de forma. Por isso ele vira família própria (`traco`) e vai para
 * `escuro`. Quem pega o engano é a conferência cruzada de `tracar-cabelo.ts`.
 */

import { readFileSync, statSync } from "fs";
import { ESCURO, type Bitmap, particao } from "./medir";
import { rasterizarSvg } from "./raster";
import { eMatizDeCabelo, hsl } from "./tracar-cabelo";

/** Área a partir da qual um subpath é moldura, em fração da área do `viewBox`. */
const MOLDURA = 0.95;

/**
 * O PISO DE ÁREA DE UM FRAGMENTO, em fração da área do `viewBox`.
 *
 * 0,002% de 1024² são ~21 px², um borrão de 4,6×4,6 — a espessura do traço desta arte
 * ao quadrado (3,7 u medidas por `medirMassa`, e 1 u vale ~1,29 px neste `viewBox`).
 * Abaixo disso o fragmento não carrega forma: ele é menor que a linha que o
 * desenharia.
 *
 * **O primeiro valor foi 0,01% e ele foi medido errando.** 105 px² derrubavam 318 dos
 * 437 paths, e entre eles não havia só emenda: o conversor desenha o rosto em dezenas
 * de manchas de 90 a 105 px². Piso alto some com peça, e some em silêncio — o
 * relatório continuaria plausível.
 *
 * Ele nunca sai calado: `Laudo.fragmentos` conta e soma a área.
 */
const PISO_AREA = 0.00002;

/** Quantos segmentos por Bézier ao achatar. 8 dá erro bem abaixo de um pixel. */
const SEGMENTOS = 8;

export type Familia = "corpo" | "sombra" | "traco" | "pele" | "tinta" | "descartado";

export interface Caixa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Subpath {
  /** O `d` deste subpath sozinho, pronto para virar um `<path>` de um só. */
  d: string;
  /** Área com sinal, pela fórmula do sapateiro sobre a poligonal achatada. */
  area: number;
  caixa: Caixa;
  /** Nós de comando (`M` e `C`), não vértices da poligonal. */
  nos: number;
  eMoldura: boolean;
}

export interface PathSvg {
  i: number;
  fill: string;
  d: string;
  cor: { h: number; s: number; l: number };
  subpaths: Subpath[];
  /** Soma das áreas absolutas dos subpaths que NÃO são moldura. */
  area: number;
  caixa: Caixa;
  familia: Familia;
}

export interface Laudo {
  arquivo: string;
  mtime: string;
  viewBox: { w: number; h: number };
  paths: number;
  subpaths: number;
  molduras: number;
  fragmentos: { quantos: number; area: number };
  /** Os dois cortes de luminância que `particao` achou no teal, e os vãos entre modas. */
  cortes: number[];
  vaos: number[];
  porFamilia: { familia: Familia; paths: number; area: number; pctDoTeal: number }[];
  linhas: string[];
}

/* ------------------------------------------------------------------ */
/* O parser                                                            */
/* ------------------------------------------------------------------ */

/**
 * `d` VIRANDO SUBPATHS ACHATADOS — e um comando desconhecido para tudo.
 *
 * O achatamento serve a três perguntas que os nós sozinhos respondem mal: a área (o
 * sapateiro precisa da curva, não da corda), a caixa (o controle de uma Bézier fica
 * fora dela, e o nó fica dentro — as duas erram, uma para cada lado) e a razão de
 * aspecto que identifica os olhos no Bloco 3.
 */
function acharSubpaths(d: string, ondeErro: string): Subpath[] {
  const toks = d.match(/[MmCcZzLlHhVvSsQqTtAa]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
  const saida: Subpath[] = [];

  let i = 0;
  let atual: { comandos: string[]; pts: { x: number; y: number }[]; nos: number } | null = null;
  let cx = 0;
  let cy = 0;
  let ix = 0;
  let iy = 0;

  const numero = () => {
    const v = Number(toks[i++]);
    if (!Number.isFinite(v)) throw new Error(`${ondeErro}: número inválido em "${toks[i - 1]}"`);
    return v;
  };
  const fechar = () => {
    if (!atual || atual.pts.length < 2) return;
    const pts = atual.pts;
    let area = 0;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k];
      const b = pts[(k + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
      x0 = Math.min(x0, a.x);
      y0 = Math.min(y0, a.y);
      x1 = Math.max(x1, a.x);
      y1 = Math.max(y1, a.y);
    }
    saida.push({
      d: atual.comandos.join(" "),
      area: area / 2,
      caixa: { x0, y0, x1, y1 },
      nos: atual.nos,
      eMoldura: false,
    });
    atual = null;
  };

  while (i < toks.length) {
    const cmd = toks[i];
    if (!/^[A-Za-z]$/.test(cmd)) throw new Error(`${ondeErro}: número solto fora de comando ("${cmd}")`);
    i++;
    // Comandos repetidos sem repetir a letra: `C a b c d e f a b c d e f`.
    do {
      switch (cmd) {
        case "M":
        case "m": {
          fechar();
          const x = numero();
          const y = numero();
          cx = cmd === "M" ? x : cx + x;
          cy = cmd === "M" ? y : cy + y;
          ix = cx;
          iy = cy;
          atual = { comandos: [`M${cx},${cy}`], pts: [{ x: cx, y: cy }], nos: 1 };
          break;
        }
        case "C":
        case "c": {
          if (!atual) throw new Error(`${ondeErro}: "C" antes de qualquer "M"`);
          const rel = cmd === "c";
          const x1 = numero() + (rel ? cx : 0);
          const y1 = numero() + (rel ? cy : 0);
          const x2 = numero() + (rel ? cx : 0);
          const y2 = numero() + (rel ? cy : 0);
          const x = numero() + (rel ? cx : 0);
          const y = numero() + (rel ? cy : 0);
          const ax = cx;
          const ay = cy;
          for (let k = 1; k <= SEGMENTOS; k++) {
            const t = k / SEGMENTOS;
            const u = 1 - t;
            atual.pts.push({
              x: u * u * u * ax + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
              y: u * u * u * ay + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
            });
          }
          atual.comandos.push(`C${x1},${y1} ${x2},${y2} ${x},${y}`);
          atual.nos++;
          cx = x;
          cy = y;
          break;
        }
        case "Z":
        case "z": {
          if (atual) atual.comandos.push("z");
          cx = ix;
          cy = iy;
          break;
        }
        default:
          // A amarra 2. Um `L`, um `a` ou um `s` pulado em silêncio deforma o subpath
          // sem sintoma, e todo número derivado dele continua plausível.
          throw new Error(
            `${ondeErro}: comando "${cmd}" não implementado. O conversor mudou de ` +
              `repertório — implemente-o antes de medir, nunca ignore.`,
          );
      }
    } while (cmd !== "Z" && cmd !== "z" && i < toks.length && !/^[A-Za-z]$/.test(toks[i]));
  }
  fechar();
  return saida;
}

/**
 * A MOLDURA — o retângulo do canvas que o conversor põe atrás de tudo.
 *
 * Ela cai por **área**, e nunca por índice: neste arquivo ela é o subpath 0 do path 0,
 * mas isso é acidente do conversor. 95% do `viewBox` é folga larga — a maior peça de
 * verdade desta arte (a silhueta externa da cabeça) fica em outra ordem de grandeza.
 */
function eMoldura(s: Subpath, vb: { w: number; h: number }): boolean {
  return Math.abs(s.area) >= MOLDURA * vb.w * vb.h;
}

export function lerSvg(caminho: string) {
  const src = readFileSync(caminho, "utf8");
  const corte = src.indexOf("<path");
  if (corte < 0) throw new Error(`${caminho}: nenhum <path>`);
  // O cabeçalho guarda o `viewBox`, então todo subconjunto remontado cai na posição
  // EXATA da arte inteira. É a técnica de `.scratch/estilo/pecas.ts`.
  const cabecalho = src.slice(0, corte);

  const vbm = cabecalho.match(/viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"/);
  if (!vbm) throw new Error(`${caminho}: sem viewBox no cabeçalho`);
  const vb = { w: Number(vbm[3]), h: Number(vbm[4]) };

  if (/<g[\s>]/.test(src)) {
    throw new Error(
      `${caminho}: o arquivo tem <g>. Um \`transform\` de grupo exigiria compor matriz, ` +
        `e nenhuma coordenada daqui seria confiável sem isso.`,
    );
  }

  const brutos = [...src.matchAll(/<path[\s\S]*?\/>/g)].map((m) => m[0]);
  const paths: PathSvg[] = brutos.map((bruto, i) => {
    const fill = (bruto.match(/fill="([^"]*)"/) ?? [])[1];
    const d = (bruto.match(/\bd="([\s\S]*?)"/) ?? [])[1];
    if (!fill || !d) throw new Error(`${caminho}: path #${i} sem fill ou sem d`);
    const rgb = fill.match(/^#([0-9a-fA-F]{6})$/);
    if (!rgb) throw new Error(`${caminho}: path #${i} com fill "${fill}", que não é #RRGGBB`);
    const v = parseInt(rgb[1], 16);
    const cor = hsl((v >> 16) & 255, (v >> 8) & 255, v & 255);

    const subpaths = acharSubpaths(d, `${caminho} path #${i}`);
    for (const s of subpaths) s.eMoldura = eMoldura(s, vb);
    const uteis = subpaths.filter((s) => !s.eMoldura);
    const area = uteis.reduce((a, s) => a + Math.abs(s.area), 0);
    const caixa = uteis.reduce<Caixa>(
      (a, s) => ({
        x0: Math.min(a.x0, s.caixa.x0),
        y0: Math.min(a.y0, s.caixa.y0),
        x1: Math.max(a.x1, s.caixa.x1),
        y1: Math.max(a.y1, s.caixa.y1),
      }),
      { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
    );
    return { i, fill, d, cor, subpaths, area, caixa, familia: "descartado" as Familia };
  });

  return { caminho, cabecalho, vb, paths, mtime: statSync(caminho).mtime.toISOString() };
}

/* ------------------------------------------------------------------ */
/* A classificação                                                     */
/* ------------------------------------------------------------------ */

/**
 * AS TRÊS MODAS DO TEAL, POR PARTIÇÃO ÓTIMA — nunca por limiar escolhido.
 *
 * `particao(v, 3)` (medir.ts) é a partição exata em três segmentos por erro quadrático
 * mínimo, e ela já existe neste repositório pela mesma razão: a pergunta certa não tem
 * sinal nem valor de corte embutido, é *onde estão as descontinuidades?*.
 *
 * **Ponderada por área**, e isto não é detalhe: o conversor produz centenas de
 * fraguinhos de traço e algumas dezenas de manchas grandes de corpo. Contando path a
 * path, a moda do traço domina por número e os cortes migram para dentro dela; contando
 * por área, cada moda pesa o quanto de tinta ela é.
 *
 * O vetor tem `AMOSTRAS` casas ordenadas por luminância, cada path ocupando um número
 * de casas proporcional à sua área. É o histograma, achatado no formato que a
 * `particao` come.
 */
const AMOSTRAS = 600;

function cortesDoTeal(teal: PathSvg[]): { cortes: number[]; vaos: number[] } {
  const total = teal.reduce((a, p) => a + p.area, 0);
  if (!total || teal.length < 6) return { cortes: [], vaos: [] };

  const ordenados = [...teal].sort((a, b) => a.cor.l - b.cor.l);
  const v: number[] = [];
  for (const p of ordenados) {
    const quantas = Math.max(1, Math.round((AMOSTRAS * p.area) / total));
    for (let k = 0; k < quantas; k++) v.push(p.cor.l);
  }
  if (v.length < 6) return { cortes: [], vaos: [] };

  const part = particao(v, 3);
  // O corte é o MEIO entre a última luminância de um segmento e a primeira do
  // seguinte: os índices da partição caem entre duas amostras, e escolher uma das
  // duas poria a fronteira em cima de um path real.
  const limites = part.cortes.map((c) => (v[c - 1] + v[c]) / 2);
  const vaos = part.cortes.map((c) => v[c] - v[c - 1]);
  return { cortes: limites, vaos };
}

/**
 * CADA PATH NA SUA FAMÍLIA — teal primeiro, e a ordem é a amarra 3.
 *
 * O teal escuro do contorno passa no teste de matiz, então perguntar "é escuro?" antes
 * de "é teal?" o mandaria para a tinta genérica e ele sumiria do `cabelo`. Perguntar
 * "é teal?" primeiro o mantém no cabelo E o separa do preenchimento, que são as duas
 * coisas que precisam ser verdade ao mesmo tempo.
 */
export function classificar(paths: PathSvg[], vb: { w: number; h: number }) {
  const piso = PISO_AREA * vb.w * vb.h;
  const teal = paths.filter((p) => eMatizDeCabelo(p.cor.h, p.cor.s) && p.area >= piso);
  const { cortes, vaos } = cortesDoTeal(teal);

  const fragmentos = { quantos: 0, area: 0 };
  for (const p of paths) {
    if (p.area < piso) {
      p.familia = "descartado";
      fragmentos.quantos++;
      fragmentos.area += p.area;
      continue;
    }
    if (eMatizDeCabelo(p.cor.h, p.cor.s)) {
      p.familia =
        cortes.length < 2
          ? "corpo"
          : p.cor.l <= cortes[0]
            ? "traco"
            : p.cor.l <= cortes[1]
              ? "sombra"
              : "corpo";
      continue;
    }
    // `ESCURO` é o mesmo limiar de luminância que `medir.ts` usa no pixel — uma
    // descrição só de "isto é tinta preta", nas duas fontes.
    p.familia = p.cor.l * 255 < ESCURO ? "tinta" : "pele";
  }
  return { cortes, vaos, fragmentos, teal: teal.reduce((a, p) => a + p.area, 0) };
}

/* ------------------------------------------------------------------ */
/* A remontagem e o raster                                             */
/* ------------------------------------------------------------------ */

/**
 * UM `<svg>` COM SÓ UMA FAMÍLIA — o cabeçalho intacto, então a posição é a mesma.
 *
 * O `d` vai **inteiro**, moldura inclusive, e isso é deliberado: o preenchimento é
 * `nonzero`, e a moldura é justamente o que faz o interior da figura ficar VAZIO no
 * path do contorno. Arrancá-la do `d` inverteria o enrolamento e a cabeça inteira
 * sairia preta. Quem tira a moldura do resultado é `semAMoldura`, no raster, onde a
 * pergunta tem resposta topológica em vez de aritmética.
 */
export function svgDaFamilia(
  svg: ReturnType<typeof lerSvg>,
  quais: (p: PathSvg) => boolean,
): string {
  const corpo = svg.paths
    .filter(quais)
    .map((p) => `<path fill="#000000" stroke="none" d="${p.d}"/>`)
    .join("");
  return `${svg.cabecalho}${corpo}</svg>`;
}

/**
 * A PEGADA DA FIGURA — a união sólida de todo subpath que não é moldura.
 *
 * ---------------------------------------------------------------------------
 * A INUNDAÇÃO PELA BORDA FOI MEDIDA ERRANDO, E O ERRO ERA GRANDE
 * ---------------------------------------------------------------------------
 *
 * A primeira versão tirava a moldura inundando o preto a partir da borda do quadro.
 * O raciocínio era que a moldura é o único componente que toca a borda — e ele é
 * falso pela razão mais simples possível: **o contorno preto da figura encosta no
 * fundo preto da moldura**, porque num traço o fundo e o contorno são a MESMA região
 * conexa (o conversor pinta os dois de uma vez e o preenchimento de pele passa por
 * cima do miolo). A inundação levava o contorno junto.
 *
 * O estrago foi medido: os âncoras do SVG saíram em pescoço 0,298 e base 0,450 da
 * altura, contra 0,488 e 0,828 no PNG da mesma arte. Não é desvio, é outra figura —
 * `enquadramento()` procura contorno escuro e não havia mais contorno nenhum.
 *
 * A pergunta certa é geométrica e não topológica: **onde está a figura?** É a união
 * de todos os subpaths úteis, cada um pintado sozinho — sem enrolamento a cancelar,
 * um subpath sólido é a área que ele ocupa. Tudo fora dela é moldura, e a conta não
 * depende de orientação, de ordem, nem de o contorno tocar coisa nenhuma.
 */
async function mascaraDaFigura(
  svg: ReturnType<typeof lerSvg>,
  altura: number,
): Promise<{ mask: Uint8Array; w: number; h: number }> {
  const corpo = svg.paths
    .flatMap((p) => p.subpaths.filter((s) => !s.eMoldura))
    .map((s) => `<path fill="#000000" stroke="none" d="${s.d}"/>`)
    .join("");
  const bmp = await rasterizarSvg(`${svg.cabecalho}${corpo}</svg>`, altura);
  return { ...binarizar(bmp), w: bmp.w, h: bmp.h };
}

/** Pixel escuro vira 1. O mesmo `ESCURO` de `medir.ts` — uma descrição só de tinta. */
function binarizar(bmp: Bitmap): { mask: Uint8Array } {
  const mask = new Uint8Array(bmp.w * bmp.h);
  for (let i = 0; i < mask.length; i++) {
    const j = i * bmp.canais;
    const l = 0.2126 * bmp.data[j] + 0.7152 * bmp.data[j + 1] + 0.0722 * bmp.data[j + 2];
    if (l < ESCURO) mask[i] = 1;
  }
  return { mask };
}

async function mascaraDe(
  svg: ReturnType<typeof lerSvg>,
  quais: (p: PathSvg) => boolean,
  altura: number,
  figura: Uint8Array,
): Promise<{ mask: Uint8Array; w: number; h: number; daMoldura: number }> {
  const bmp = await rasterizarSvg(svgDaFamilia(svg, quais), altura);
  const { mask } = binarizar(bmp);
  // O recorte pela pegada só tira moldura: a pegada é superconjunto de toda tinta de
  // toda família, por construção. Contar quanto ele tirou é o que impede o recorte
  // de comer peça um dia sem ninguém saber.
  let daMoldura = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !figura[i]) {
      mask[i] = 0;
      daMoldura++;
    }
  }
  return { mask, w: bmp.w, h: bmp.h, daMoldura };
}

export interface MascarasSvg {
  /** A pegada da figura pintada sólida, para os âncoras. Ver `mascarasDoSvg`. */
  bmp: Bitmap;
  cabelo: Uint8Array;
  claro: Uint8Array;
  escuro: Uint8Array;
  /** A pegada da figura — a união sólida de todo subpath útil. Tudo fora é moldura. */
  figura: Uint8Array;
  w: number;
  h: number;
  laudo: Laudo;
}

/**
 * AS TRÊS MÁSCARAS, e o `bmp` que dá os âncoras.
 *
 * ---------------------------------------------------------------------------
 * O `bmp` É A PEGADA SÓLIDA, PORQUE O CONVERSOR NÃO DESENHOU CONTORNO NENHUM
 * ---------------------------------------------------------------------------
 *
 * A versão anterior entregava a arte com as cores originais e a moldura branqueada,
 * contando que `enquadramento()` achasse ali o mesmo contorno escuro que acha no PNG.
 * Medido, ele não acha: o SVG saiu com **metade** da tinta escura do PNG (2,4% do
 * quadro contra 4,97%), e nas linhas do tronco — 0,50 · 0,60 · 0,78 da altura — com
 * **zero**. Os âncoras vinham em 0,448 e 0,716 da altura contra 0,488 e 0,828 no PNG.
 *
 * A causa é do conversor, e é estrutural: ele **não traçou o contorno preto da figura
 * como peça**. O fundo preto e o contorno preto são a MESMA região para ele — um só
 * `{winding ≠ 0}` do path #0 —, e os subpaths dele traçam a fronteira interna dessa
 * região, que é onde o preenchimento de cor começa. Medido: path #0 com moldura pinta
 * 72,7% do quadro, os subpaths úteis dele sólidos pintam 27,0%, e 72,7 + 27,0 = 99,7.
 * Não sobra banda. As únicas peças escuras de verdade são os olhos, as sobrancelhas, a
 * boca e o traço do próprio cabelo.
 *
 * Então o enquadramento não pode sair de "onde está o contorno". Ele sai de **onde
 * está a figura**, e a figura é a pegada — pintada sólida, `enquadramento()` lê nela
 * exatamente as quatro grandezas que usa (primeira e última linha com tinta, a linha
 * mais estreita entre 40% e 78%, e o meio da mais larga abaixo dela), todas
 * definidas pelos extremos externos de cada linha.
 *
 * O desvio que sobra é meia espessura de traço, e ele é declarado: a pegada termina na
 * borda INTERNA do contorno da arte, e o PNG termina na externa. É a mesma ordem de
 * grandeza das correções de `TRACO/2` que a régua já faz, e o Bloco 3 mede o resíduo.
 */
export async function mascarasDoSvg(caminho: string, altura: number): Promise<MascarasSvg> {
  const svg = lerSvg(caminho);
  const c = classificar(svg.paths, svg.vb);

  const de = (f: Familia | Familia[]) => {
    const fs = Array.isArray(f) ? f : [f];
    return (p: PathSvg) => fs.includes(p.familia);
  };

  const figura = await mascaraDaFigura(svg, altura);
  const cabelo = await mascaraDe(svg, de(["corpo", "sombra", "traco"]), altura, figura.mask);
  const claro = await mascaraDe(svg, de("corpo"), altura, figura.mask);
  const escuro = await mascaraDe(svg, de(["traco", "tinta"]), altura, figura.mask);

  // A pegada, em pixel cru de 3 canais: preto onde há figura, branco fora. É o que
  // `ancoras()` recebe, e ver o topo desta função para o porquê.
  const cheio: Bitmap = {
    data: Buffer.alloc(figura.w * figura.h * 3, 255),
    w: figura.w,
    h: figura.h,
    canais: 3,
  };
  let pixelsDaMoldura = 0;
  for (let i = 0; i < figura.mask.length; i++) {
    if (!figura.mask[i]) {
      pixelsDaMoldura++;
      continue;
    }
    cheio.data[i * 3] = 0;
    cheio.data[i * 3 + 1] = 0;
    cheio.data[i * 3 + 2] = 0;
  }

  const familias: Familia[] = ["corpo", "sombra", "traco", "pele", "tinta", "descartado"];
  const porFamilia = familias.map((familia) => {
    const ps = svg.paths.filter((p) => p.familia === familia);
    const area = ps.reduce((a, p) => a + p.area, 0);
    return {
      familia,
      paths: ps.length,
      area,
      pctDoTeal: c.teal ? (100 * area) / c.teal : 0,
    };
  });

  const linhas = [
    `fonte SVG · ${caminho} · ${svg.mtime}`,
    `viewBox ${svg.vb.w}×${svg.vb.h} · ${svg.paths.length} paths · ` +
      `${svg.paths.reduce((a, p) => a + p.subpaths.length, 0)} subpaths · ` +
      `${svg.paths.reduce((a, p) => a + p.subpaths.filter((s) => s.eMoldura).length, 0)} moldura(s)`,
    `cortes de luminância do teal: ${c.cortes.map((v) => v.toFixed(3)).join(" / ") || "—"} ` +
      `(vãos ${c.vaos.map((v) => v.toFixed(2)).join(" / ") || "—"})`,
    ...porFamilia.map(
      (f) =>
        `  ${f.familia.padEnd(11)} ${String(f.paths).padStart(4)} paths · ` +
        `${f.pctDoTeal.toFixed(1).padStart(5)}% do teal`,
    ),
    `fragmentos abaixo do piso de área: ${c.fragmentos.quantos} ` +
      `(${((100 * c.fragmentos.area) / (c.teal || 1)).toFixed(2)}% do teal)`,
    `recortado pela pegada da figura: cabelo ${cabelo.daMoldura} · claro ${claro.daMoldura} · ` +
      `escuro ${escuro.daMoldura} px` +
      `\nfora da pegada (a moldura): ${pixelsDaMoldura} px = ` +
      `${((100 * pixelsDaMoldura) / (cheio.w * cheio.h)).toFixed(1)}% do quadro`,
  ];

  return {
    bmp: cheio,
    cabelo: cabelo.mask,
    claro: claro.mask,
    escuro: escuro.mask,
    figura: figura.mask,
    w: cabelo.w,
    h: cabelo.h,
    laudo: {
      arquivo: caminho,
      mtime: svg.mtime,
      viewBox: svg.vb,
      paths: svg.paths.length,
      subpaths: svg.paths.reduce((a, p) => a + p.subpaths.length, 0),
      molduras: svg.paths.reduce((a, p) => a + p.subpaths.filter((s) => s.eMoldura).length, 0),
      fragmentos: c.fragmentos,
      cortes: c.cortes,
      vaos: c.vaos,
      porFamilia,
      linhas,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Os dois papéis de amostragem exata                                  */
/* ------------------------------------------------------------------ */

/**
 * UM subpath sozinho, rasterizado sólido — o alvo nomeado dos âncoras.
 *
 * Serve para as peças que a régua sabe endereçar: a silhueta externa da cabeça
 * (subpath 1 do path #0 nesta arte, 333 nós) e as cápsulas dos olhos. Elas são
 * **um** path conhecido, e é aí que a amostragem exata vale — ao contrário da
 * silhueta do cabelo, que é a união de 192.
 */
export async function mascaraDoSubpath(
  svg: ReturnType<typeof lerSvg>,
  path: number,
  subpath: number,
  altura: number,
): Promise<{ mask: Uint8Array; w: number; h: number }> {
  const d = dDoSubpath(svg, path, subpath);
  const bmp = await rasterizarSvg(`${svg.cabecalho}<path fill="#000000" stroke="none" d="${d}"/></svg>`, altura);
  return { ...binarizar(bmp), w: bmp.w, h: bmp.h };
}

/** O `d` de UM subpath, para quem vai amostrar Bézier em vez de rasterizar. */
export function dDoSubpath(svg: ReturnType<typeof lerSvg>, path: number, subpath: number): string {
  const p = svg.paths[path];
  if (!p) throw new Error(`dDoSubpath: não há path #${path}`);
  const s = p.subpaths[subpath];
  if (!s) throw new Error(`dDoSubpath: o path #${path} não tem subpath #${subpath}`);
  return s.d;
}

/**
 * OS OLHOS, POR GEOMETRIA PURA — sem cor, sem ordem, sem nome de camada.
 *
 * Eles são as duas cápsulas verticais pretas do rosto, e a assinatura que os separa de
 * todo o resto é a **razão de aspecto**: `OLHO.w / OLHO.h` do `geometria.ts` é 0,458, e
 * nenhuma outra peça desta arte é um oval três vezes mais alto que largo.
 *
 * O critério é razão + tamanho, e não posição: posição é justamente o que se quer
 * MEDIR no Bloco 3, e derivá-la de uma posição presumida seria circular.
 */
export function acharOlhos(
  svg: ReturnType<typeof lerSvg>,
  razaoAlvo: number,
  tolerancia = 0.05,
): { path: number; subpath: number; caixa: Caixa; razao: number }[] {
  const cands: { path: number; subpath: number; caixa: Caixa; razao: number; area: number }[] = [];
  const piso = PISO_AREA * svg.vb.w * svg.vb.h;
  for (const p of svg.paths) {
    if (p.cor.l * 255 >= ESCURO) continue;
    for (const [k, s] of p.subpaths.entries()) {
      if (s.eMoldura || Math.abs(s.area) < piso) continue;
      const w = s.caixa.x1 - s.caixa.x0;
      const h = s.caixa.y1 - s.caixa.y0;
      if (h <= 0) continue;
      const razao = w / h;
      if (Math.abs(razao - razaoAlvo) > tolerancia) continue;
      cands.push({ path: p.i, subpath: k, caixa: s.caixa, razao, area: Math.abs(s.area) });
    }
  }
  // Os dois maiores, na ordem de `x`: sobrancelha e boca não têm esta razão, mas uma
  // mecha fina pode ter — e mecha fina é pequena.
  return cands
    .sort((a, b) => b.area - a.area)
    .slice(0, 2)
    .sort((a, b) => a.caixa.x0 - b.caixa.x0)
    .map(({ path, subpath, caixa, razao }) => ({ path, subpath, caixa, razao }));
}
