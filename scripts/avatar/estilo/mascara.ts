/**
 * A MÁSCARA BINÁRIA CONGELADA — a fonte que as rotas de traçado compartilham.
 *
 * ---------------------------------------------------------------------------
 * POR QUE CONGELAR ANTES DE COMPARAR ROTAS
 * ---------------------------------------------------------------------------
 *
 * Comparar potrace com line-art só quer dizer alguma coisa se os dois partirem da
 * **mesma** imagem binária. Sem isto, duas execuções podem partir de máscaras
 * diferentes sem ninguém perceber: basta o teto de croma mudar, o piso de alcance
 * mudar, ou o PNG do gerador ser regerado com outro seed — e a diferença entre as
 * duas rotas passaria a medir a diferença entre duas artes.
 *
 * Então este arquivo faz uma coisa só: transforma o PNG do gerador numa máscara
 * binária **declarada** e devolve o `hash` dela. O hash cobre as dimensões, os
 * parâmetros e o conteúdo — trocar qualquer um dos três muda o número, e o número
 * vai impresso em toda medição que a use.
 *
 * ---------------------------------------------------------------------------
 * AS QUATRO DECISÕES, DECLARADAS EM VEZ DE HERDADAS
 * ---------------------------------------------------------------------------
 *
 * **1. Quais matizes entram.** `amostrar()` de `tracar-cabelo.ts`, sem uma linha
 * reescrita: a janela de teal (150°–205°, saturação > 0,25) mais o piso de croma
 * bruta (≥ 4, o corte que impediu o preto de entrar como teal). Reimplementar a
 * janela aqui faria a rota nova medir a diferença entre duas definições de cabelo
 * em vez da diferença entre dois traçadores.
 *
 * **2. O contorno preto NÃO entra, e isto é a consequência mais importante.**
 * `amostrar()` nunca vê o preto: a máscara termina onde o teal termina, que é a
 * borda INTERNA do contorno da arte. Quem traçar esta máscara traça essa borda
 * interna — e `cabelo.ts` guarda a **linha de centro do preto**. A diferença é
 * meia espessura, sistemática, em todo o perímetro. Ela não é escondida: a
 * espessura do anel preto é **medida** aqui (`traco`) e devolvida, para o recuo
 * pela normal ser calibrado com número em vez de suposição.
 *
 * **3. O antialiasing não é tratado.** Nada de dilatar, erodir, fechar buraco ou
 * suavizar: um pixel é cabelo se e somente se o teste por pixel disser que sim.
 * Uma operação morfológica a mais aqui mudaria a forma que as duas rotas recebem, e
 * seria uma terceira variável escondida entre elas. O tamanho da faixa incerta vai
 * declarado como `rampa` — os pixels que reprovam no teste mas encostam em cabelo.
 *
 * **4. Só entra o que alcança a cabeça.** A cor instrumental vale para o boneco
 * inteiro, então a gola do uniforme do gerador **também é teal**. A regra é a mesma
 * de `soOCabelo` em `fidelidade.ts`, com a mesma constante: fica todo componente que
 * suba até dois traços acima do queixo; o que só vive abaixo é tronco. O descartado
 * é contado, nunca engolido.
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import sharp from "sharp";
import { CAIXA_CABECA, TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import type { Bitmap } from "./medir";
import { ESCURO, lum } from "./medir";
import { carregarPng } from "./raster";
import {
  type Ancoras,
  type Mapa,
  amostrar,
  ancoras,
  ancorasDoViewBox,
  conexas,
  mapa,
} from "./tracar-cabelo";

/** Onde a máscara congelada e o laudo dela ficam. `.scratch/` é ignorado pelo git. */
export const DIR_MASCARA = ".scratch/estilo/mascara";

/**
 * ATÉ ONDE UM COMPONENTE DE TEAL PRECISA SUBIR PARA SER CABELO, em unidades.
 *
 * A constante é a de `fidelidade.ts` — dois traços acima do queixo —, escrita aqui
 * pelo mesmo motivo pelo qual `eMatizDeCabelo` é importada e não copiada: as duas
 * réguas têm de discordar juntas ou concordar juntas. `fidelidade.ts` a mantém
 * privada, e a duplicação de UMA expressão aritmética custa menos que exportar um
 * detalhe interno da folha.
 */
const ALCANCE_DE_CABELO = CAIXA_CABECA.y1 - 2 * (TRACO / 2) * 2;

export interface MascaraCongelada {
  /** 1 onde é cabelo. Índice `y * w + x`. */
  mask: Uint8Array;
  /** O PNG de origem em pixel cru — o controle da conferência sai daqui. */
  bmp: Bitmap;
  w: number;
  h: number;
  /** sha256 de dimensões + parâmetros + conteúdo. */
  hash: string;
  /** O PNG preto-no-branco desta máscara, que é o que os traçadores comem. */
  png: Buffer;
  pixels: number;
  /** Componentes que não alcançaram a cabeça: quantos, e quantos pixels levaram. */
  descartados: { quantos: number; pixels: number };
  /** Pixels que reprovam no teste de matiz e encostam em cabelo. A faixa incerta. */
  rampa: number;
  /**
   * A ESPESSURA DO ANEL PRETO ao redor da máscara, em pixels e em unidades.
   *
   * Medida por caminhada horizontal para fora, a partir de cada pixel de borda
   * esquerda e direita de cada linha: quantos pixels escuros existem antes de sair
   * para o fundo. É o número que diz de quanto é o viés entre a borda que um
   * traçador devolve e a linha de centro que `cabelo.ts` guarda.
   */
  traco: { medianaPx: number; medianaU: number; amostras: number };
  /** Os âncoras de tronco do PNG, para quem for mapear. */
  ancoras: Ancoras;
  mapa: Mapa;
  laudo: string[];
}

/** A caminhada para fora, num sentido: quantos pixels escuros antes do fundo. */
function corridaEscura(b: Bitmap, x: number, y: number, dx: number, teto: number): number | null {
  let n = 0;
  for (let k = 1; k <= teto; k++) {
    const px = x + dx * k;
    if (px < 0 || px >= b.w) return null;
    if (amostrar(b, px, y).eCabelo) return null; // voltou para dentro: não é a borda externa
    if (lum(b, px, y) < ESCURO) {
      n++;
      continue;
    }
    return n; // saiu para o fundo claro
  }
  return null; // preto demais: não é anel de contorno
}

/**
 * O PNG DO GERADOR VIRANDO MÁSCARA CONGELADA.
 *
 * `carregarPng` lê no tamanho original de propósito (ver o docstring dele): a
 * referência já É a resolução da medida, e reamostrar introduziria uma rampa que a
 * régua leria como traço.
 */
export async function congelarMascara(png: string): Promise<MascaraCongelada> {
  const bmp = await carregarPng(png);
  const { vb } = await ancorasDoViewBox();
  const aImg = ancoras(bmp);
  const m = mapa(aImg, vb);

  // Da unidade do `viewBox` de volta ao pixel deste PNG. É a inversa de `paraY`.
  const yDoAlcance = (ALCANCE_DE_CABELO - m.tu0) / m.ky + m.ty0;

  const bruta = new Uint8Array(bmp.w * bmp.h);
  for (let y = 0; y < bmp.h; y++) {
    for (let x = 0; x < bmp.w; x++) {
      if (amostrar(bmp, x, y).eCabelo) bruta[y * bmp.w + x] = 1;
    }
  }

  // Decisão 4: só o que alcança a cabeça. `conexas` devolve os componentes já
  // ordenados por tamanho, e o critério aqui não é tamanho — é altura.
  const grupos = conexas(bruta, bmp.w, bmp.h);
  const mask = new Uint8Array(bmp.w * bmp.h);
  let pixels = 0;
  let descQuantos = 0;
  let descPixels = 0;
  for (const g of grupos) {
    const alcanca = g.some((i) => Math.floor(i / bmp.w) <= yDoAlcance);
    if (!alcanca) {
      descQuantos++;
      descPixels += g.length;
      continue;
    }
    for (const i of g) mask[i] = 1;
    pixels += g.length;
  }

  // Decisão 3: a faixa incerta, contada e não corrigida.
  let rampa = 0;
  for (let y = 0; y < bmp.h; y++) {
    for (let x = 0; x < bmp.w; x++) {
      const i = y * bmp.w + x;
      if (mask[i]) continue;
      const vizinho =
        (x > 0 && mask[i - 1]) ||
        (x < bmp.w - 1 && mask[i + 1]) ||
        (y > 0 && mask[i - bmp.w]) ||
        (y < bmp.h - 1 && mask[i + bmp.w]);
      if (vizinho) rampa++;
    }
  }

  // Decisão 2: a espessura do anel preto, medida em vez de suposta.
  const corridas: number[] = [];
  const TETO_ANEL = 40;
  for (let y = 0; y < bmp.h; y++) {
    let a = -1;
    let z = -1;
    for (let x = 0; x < bmp.w; x++) {
      if (!mask[y * bmp.w + x]) continue;
      if (a < 0) a = x;
      z = x;
    }
    if (a < 0) continue;
    for (const [x, dx] of [
      [a, -1],
      [z, 1],
    ] as const) {
      const n = corridaEscura(bmp, x, y, dx, TETO_ANEL);
      if (n !== null && n > 0) corridas.push(n);
    }
  }
  corridas.sort((p, q) => p - q);
  const medianaPx = corridas.length ? corridas[Math.floor(corridas.length / 2)] : 0;

  // Preto onde é cabelo, branco fora. É o que `potrace` come, e o que um humano
  // consegue abrir para conferir que a máscara é a peça e não outra coisa.
  const cru = Buffer.alloc(bmp.w * bmp.h, 255);
  for (let i = 0; i < mask.length; i++) if (mask[i]) cru[i] = 0;
  const pngMascara = await sharp(cru, { raw: { width: bmp.w, height: bmp.h, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const caixa = { x0: bmp.w, y0: bmp.h, x1: -1, y1: -1 };
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % bmp.w;
    const y = (i / bmp.w) | 0;
    if (x < caixa.x0) caixa.x0 = x;
    if (x > caixa.x1) caixa.x1 = x;
    if (y < caixa.y0) caixa.y0 = y;
    if (y > caixa.y1) caixa.y1 = y;
  }

  const parametros = [
    `matiz=amostrar/eCabelo`,
    `croma=${process.env.CROMA ?? 4}`,
    `contornoPreto=fora`,
    `antialiasing=cru`,
    `alcance=${ALCANCE_DE_CABELO.toFixed(2)}u`,
  ].join(" · ");

  const h = createHash("sha256");
  h.update(`${bmp.w}x${bmp.h}|${parametros}|`);
  h.update(Buffer.from(mask.buffer, mask.byteOffset, mask.byteLength));
  const hash = h.digest("hex").slice(0, 16);

  const laudo = [
    `MÁSCARA CONGELADA — ${png}`,
    `  ${bmp.w}×${bmp.h} · ${pixels} px de cabelo (${((100 * pixels) / mask.length).toFixed(2)}% do quadro)`,
    `  parâmetros: ${parametros}`,
    `  componentes de teal: ${grupos.length} · maior ${grupos[0]?.length ?? 0} px · ` +
      `caixa x ${caixa.x0}–${caixa.x1} · y ${caixa.y0}–${caixa.y1}`,
    `  componentes descartados por não alcançar a cabeça (y ≤ ${yDoAlcance.toFixed(0)} px): ` +
      `${descQuantos} · ${descPixels} px ` +
      `(${((100 * descPixels) / (pixels + descPixels || 1)).toFixed(2)}% do teal que alcança)`,
    `  rampa de antialiasing (reprova no matiz e encosta em cabelo): ${rampa} px ` +
      `= ${((100 * rampa) / (pixels || 1)).toFixed(2)}% da massa`,
    `  anel preto em volta da máscara: mediana ${medianaPx} px = ` +
      `${(medianaPx * m.kx).toFixed(2)} u  (${corridas.length} amostras)` +
      `\n  → é o viés entre a BORDA que um traçador devolve e a LINHA DE CENTRO que ` +
      `\`cabelo.ts\` guarda`,
    `  hash ${hash}`,
  ];

  return {
    mask,
    bmp,
    w: bmp.w,
    h: bmp.h,
    hash,
    png: pngMascara,
    pixels,
    descartados: { quantos: descQuantos, pixels: descPixels },
    rampa,
    traco: { medianaPx, medianaU: medianaPx * m.kx, amostras: corridas.length },
    ancoras: aImg,
    mapa: m,
    laudo,
  };
}

/** Grava o PNG da máscara e o laudo, e devolve o caminho do PNG. */
export function gravarMascara(mc: MascaraCongelada, nome: string): string {
  if (!existsSync(DIR_MASCARA)) mkdirSync(DIR_MASCARA, { recursive: true });
  const alvo = `${DIR_MASCARA}/${nome}-${mc.hash}.png`;
  writeFileSync(alvo, mc.png);
  writeFileSync(
    `${DIR_MASCARA}/${nome}-${mc.hash}.txt`,
    `${mc.laudo.join("\n")}\n`,
  );
  return alvo;
}

/** Unidade do `viewBox` por pixel desta máscara — a razão que as rotas usam. */
export function unidadePorPixel(mc: MascaraCongelada): number {
  return mc.mapa.kx;
}

/** O `viewBox` do produto, para quem precisa da razão sem abrir a geometria. */
export const VIEWBOX_PRODUTO = VIEWBOX;

async function main() {
  const png = process.argv[2] ?? ".scratch/estilo/gerado/curto-espetada.png";
  const mc = await congelarMascara(png);
  for (const l of mc.laudo) console.log(l);
  const alvo = gravarMascara(mc, "curto-espetada");
  console.log(`\n${alvo}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/avatar/estilo/mascara.ts")) {
  void main();
}
