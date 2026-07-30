/**
 * A lógica PURA de vestir um uniforme: variantes, leitura da arte, registro.
 *
 * Separada do CLI (`gerar-uniforme.ts`) porque o CLI rasteriza — precisa de
 * navegador, escreve arquivo, e roda `main()` ao ser importado. Nada disto cabe
 * num teste de unidade, e o que dá defeito de verdade mora aqui: a escolha da
 * variante, a classificação de pano contra pele, e a transformação de registro.
 */

import { BASE_H, BASE_W, Y_PESCOCO, Y_SOLA } from "./mascara-base";

/**
 * Alturas das variantes. Cobrem os 4 tamanhos do plano até DPR 3.
 *
 * Existem porque peso de arquivo não é memória: a de 1920 tem 265 KB comprimidos
 * e **9,36 MiB decodificados**, e trinta uniformes distintos na mesma tela
 * chegariam a 281 MiB de bitmap. Com a de 128 no ranking, são 1,2 MiB.
 */
export const VARIANTES = [128, 256, 512, 1024, 1920] as const;

/**
 * Largura canônica de uma altura.
 *
 * NUNCA herdada de outra variante: sai sempre da razão do canvas da base, para as
 * cinco terem o mesmo enquadramento e o mesmo centro.
 */
export function larguraDe(altura: number): number {
  return Math.round((altura * BASE_W) / BASE_H);
}

/**
 * Qual variante servir para uma altura em CSS.
 *
 * O QUE DECIDE É PIXEL FÍSICO, não pixel CSS. A 70 px com DPR 2 o navegador
 * precisa de 140, e servir a de 128 seria AMPLIAR — exatamente o defeito que a
 * tabela ingênua por altura CSS produzia.
 *
 * DPR é limitado a 3: acima disso o ganho é imperceptível e a memória dobra.
 */
export function variantePara(alturaCss: number, dpr: number): number {
  const preciso = alturaCss * Math.min(Math.max(dpr, 1), 3);
  return VARIANTES.find((h) => h >= preciso) ?? VARIANTES[VARIANTES.length - 1];
}

// ---------------------------------------------------------------------------
// Cor
// ---------------------------------------------------------------------------

export interface Cor {
  /** Matiz, 0 a 360. */
  h: number;
  /** Saturação, 0 a 1. */
  s: number;
  /** Luminosidade perceptual, 0 a 1. */
  lum: number;
}

export function hsl(hex: string): Cor {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let q = 0;
  if (d) q = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const [R, G, B] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return {
    h: (q * 60 + 360) % 360,
    s: mx === 0 ? 0 : d / mx,
    lum: (0.299 * R + 0.587 * G + 0.114 * B) / 255,
  };
}

/**
 * Matiz mínimo para uma forma ser PANO.
 *
 * A pele desta família de arte vive entre 17° e 29°. 45 dá 16° de folga e ainda
 * pega a bota, que é oliva escura. Nada abaixo disso pode ser pano: uma bota
 * marrom seria entendida como PELE e mudaria de cor junto com o tom do aluno —
 * é a razão da regra de arte "pele e pano em matizes distantes".
 */
export const MATIZ_PANO = 45;

export interface Forma {
  fill: string;
  d: string;
  /** Área aproximada pela fórmula do laço sobre os nós. */
  a: number;
  bb: [number, number, number, number];
}

export interface Uniforme {
  /** Todas as formas menos o retângulo de fundo do traçador. */
  arte: Forma[];
  /** As formas que são pano. */
  pano: Forma[];
  /** Caixa da figura inteira: x0, y0, x1, y1. */
  fig: [number, number, number, number];
  /** Linha mais estreita da silhueta na metade de cima — o marco de registro. */
  pescoco: number;
  /** Cor média do pano grande, ponderada pela área. É o fundo de segurança. */
  corFundo: string;
  canvas: [number, number];
}

/** Extrai as formas de um SVG de traçador. */
export function formasDe(svg: string): Forma[] {
  return [...svg.matchAll(/<path\s+fill="(#[0-9A-Fa-f]{6})"[^>]*?d="\s*([^"]+)"/g)].map(([, f, d]) => {
    const n = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const xs = n.filter((_, i) => !(i % 2));
    const ys = n.filter((_, i) => i % 2);
    let a = 0;
    for (let i = 0; i + 3 < n.length; i += 2) a += n[i] * n[i + 3] - n[i + 2] * n[i + 1];
    return {
      fill: f.toUpperCase(),
      d,
      a: Math.abs(a) / 2,
      bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as [number, number, number, number],
    };
  });
}

/**
 * A linha mais estreita da silhueta na metade de cima.
 *
 * É o mesmo critério que acha o pescoço da base, e é o que torna o registro
 * independente de o gerador de imagem acertar tamanho ou enquadramento.
 */
export function acharPescoco(formas: Forma[]): number {
  const colunas: [number, number][] = [];
  for (const p of formas)
    for (let y = Math.floor(p.bb[1]); y <= Math.ceil(p.bb[3]); y++) {
      const c = colunas[y] ?? [Infinity, -Infinity];
      colunas[y] = [Math.min(c[0], p.bb[0]), Math.max(c[1], p.bb[2])];
    }
  const topo = colunas.findIndex(Boolean);
  if (topo < 0) return 0;
  const fim = colunas.length - 1;
  let pescoco = topo;
  let menor = Infinity;
  for (let y = Math.floor(topo + (fim - topo) * 0.1); y < topo + (fim - topo) * 0.5; y++) {
    const c = colunas[y];
    if (!c) continue;
    const w = c[1] - c[0];
    if (w < menor) {
      menor = w;
      pescoco = y;
    }
  }
  return pescoco;
}

/** Decide se uma forma é pano, dado o pescoço da figura. */
export function ehPano(p: Forma, pescoco: number): boolean {
  const { h, s, lum } = hsl(p.fill);
  const cy = (p.bb[1] + p.bb[3]) / 2;
  // Preto ACIMA do pescoço é olho e sobrancelha da arte do uniforme — esses vêm
  // da base. Sem este corte, sobram fiapos escuros na testa do boneco vestido.
  if (p.fill === "#000000") return cy > pescoco;
  if (h >= MATIZ_PANO) return true;
  return false;
}

/** Cor média do pano grande, ponderada pela área. */
export function corMedia(pano: Forma[]): string {
  const grandes = pano.filter((p) => p.a > 2000 && hsl(p.fill).h >= MATIZ_PANO && hsl(p.fill).lum > 0.3);
  const alvo = grandes.length ? grandes : pano;
  const soma = alvo.reduce(
    (acc, p) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(p.fill.slice(i, i + 2), 16));
      return [acc[0] + r * p.a, acc[1] + g * p.a, acc[2] + b * p.a, acc[3] + p.a];
    },
    [0, 0, 0, 0],
  );
  if (!soma[3]) throw new Error("cor média: nenhuma forma com área");
  const hx = (v: number) => Math.round(v / soma[3]).toString(16).padStart(2, "0");
  return `#${hx(soma[0])}${hx(soma[1])}${hx(soma[2])}`;
}

export function lerUniforme(svg: string): Uniforme {
  const vb = svg.match(/viewBox="([^"]+)"/);
  if (!vb) throw new Error("SVG do uniforme sem viewBox");
  const [, , cw, ch] = vb[1].split(" ").map(Number);

  const todas = formasDe(svg);
  if (!todas.length) throw new Error("SVG do uniforme sem nenhum <path fill>");

  // O traçador põe um retângulo preto no lugar da transparência. Ele é a maior
  // forma do arquivo, e dentro de qualquer camada pintaria a página inteira.
  const arte = todas.filter((p) => !(p.fill === "#000000" && p.a >= cw * ch * 0.25));
  const pescoco = acharPescoco(arte);
  const pano = arte.filter((p) => ehPano(p, pescoco));
  if (!pano.length)
    throw new Error(
      `nenhuma forma de pano: matiz >= ${MATIZ_PANO} não achou nada. ` +
        `A arte está em matiz de pele? Ver a regra "pele e pano em matizes distantes".`,
    );

  const fig = arte.reduce(
    (c, p) => [Math.min(c[0], p.bb[0]), Math.min(c[1], p.bb[1]), Math.max(c[2], p.bb[2]), Math.max(c[3], p.bb[3])],
    [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number],
  );

  return { arte, pano, fig, pescoco, corFundo: corMedia(pano), canvas: [cw, ch] };
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/**
 * Correção horizontal, em unidades da base.
 *
 * MEDIDA: o centro da caixa da figura MENTE, porque as botas abrem para os lados
 * e puxam esse centro para fora do eixo do corpo. Sem a correção o uniforme cai
 * 40 unidades à esquerda, o que ficou visível como orla de pele no braço.
 */
export const CORRIGE_X = 40;

export interface Registro {
  escX: number;
  escY: number;
  dx: number;
  dy: number;
  transform: string;
}

/**
 * Escala X pela altura da figura, escala Y por DOIS marcos: pescoço e sola.
 *
 * A âncora dupla resolve o pé aparecendo por baixo da bota, que é folga VERTICAL
 * e nenhuma dilatação corrige. A anisotropia que sobra é de ~1,5%, invisível.
 */
export function registro(u: Pick<Uniforme, "fig" | "pescoco">): Registro {
  const alturaFig = u.fig[3] - u.fig[1];
  const pescocoASola = u.fig[3] - u.pescoco;
  if (alturaFig <= 0 || pescocoASola <= 0) throw new Error("figura do uniforme sem altura");
  const escX = 3060 / alturaFig;
  const escY = (Y_SOLA - Y_PESCOCO) / pescocoASola;
  const dx = 1278 + CORRIGE_X - ((u.fig[0] + u.fig[2]) / 2) * escX;
  const dy = Y_PESCOCO - u.pescoco * escY;
  return {
    escX,
    escY,
    dx,
    dy,
    transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) scale(${escX.toFixed(4)} ${escY.toFixed(4)})`,
  };
}
