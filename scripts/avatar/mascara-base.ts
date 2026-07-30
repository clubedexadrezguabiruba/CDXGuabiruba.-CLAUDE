/**
 * As TRÊS máscaras do sistema de vestir, derivadas da base aprovada.
 *
 * O PRINCÍPIO: a silhueta do avatar pertence ao sistema, não à imagem gerada.
 * Todo uniforme é recortado por estas máscaras, então nenhum desenho decide onde
 * termina o ombro. É o que dispensa ajuste manual peça por peça — e o que salvou
 * o uniforme que já existe, sem arte nova.
 *
 * DE ONDE ELAS SAEM, e por isso não há autoria manual: o macacão de treino da
 * base já É a cobertura "manga longa + calça". Ele cobre tronco, braços até o
 * punho e pernas até o tornozelo, e exclui cabeça, mãos e pés — porque é isso que
 * ele veste. As máscaras saem da silhueta dele mais duas folgas medidas.
 *
 * AS TRÊS:
 *
 *  - `cobertura` — o TETO do pano. Macacão + folga de gola + folga de bota,
 *    dilatado, porque roupa é mais larga que corpo. Dilatar aqui é seguro: a
 *    máscara é teto, não piso. Sobra se remove; falta se inventaria.
 *  - `peleFrente` — cabeça, orelhas, pescoço e mãos. O uniforme é recortado para
 *    ter BURACO aqui, e a base aparece por baixo sozinha. É o que dispensa
 *    redesenhar a pele por cima e deixa gola e punho passarem por baixo dela.
 *  - `corpoVestido` — a região que o uniforme substitui, e o limite do fundo de
 *    segurança.
 *
 * AS DUAS MÁSCARAS DE RECORTE NÃO PODEM SER A MESMA. Medido: com uma só, o fundo
 * de segurança escorre para dentro da folga da bota, onde não há pano por cima, e
 * o boneco ganha um bloco verde sob os pés como um pedestal.
 *   - pano  → `cobertura`, folga de bota incluída
 *   - fundo → `corpoVestido`, sem a folga
 */

import { readFileSync } from "fs";
import { deflateSync } from "zlib";
import type { Browser } from "@playwright/test";

/** Bitmap booleano, uma posição por pixel. */
export type Mascara = Uint8Array;

export interface Marcos {
  /** Primeira linha do macacão — o ombro. */
  topoTraje: number;
  /** Última linha do macacão — o tornozelo. */
  tornozelo: number;
  /** Até onde a gola pode subir. */
  yGola: number;
  /** Onde a faixa da bota começa. */
  yBota: number;
}

export interface MascarasBase {
  /** Largura e altura em PIXELS da máscara. */
  w: number;
  h: number;
  /** Unidades do viewBox por pixel. */
  k: number;
  cobertura: Mascara;
  peleFrente: Mascara;
  corpoVestido: Mascara;
  marcos: Marcos;
}

/** Canvas da base. Vem do gerador do boneco. */
export const BASE_W = 2556;
export const BASE_H = 3840;
/** Pescoço e sola da base, medidos no alfa do PNG mestre. */
export const Y_PESCOCO = 1554;
export const Y_SOLA = 3530;

/** Folga da roupa sobre o corpo, em unidades do viewBox. */
export const FOLGA = 40;
/** Quanto a bota sobe acima do tornozelo. */
export const BOTA_ACIMA = 240;
/** Quanto a bota passa do pé, em todas as direções. */
export const BOTA_FOLGA = 240;

// ---------------------------------------------------------------------------
// Geometria pura — sem navegador, testável isolada
// ---------------------------------------------------------------------------

export interface Dim {
  w: number;
  h: number;
}

/** Primeira linha com algum pixel aceso. -1 se a máscara está vazia. */
export function primeiraLinha(m: Mascara, { w, h }: Dim): number {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) return y;
  return -1;
}

/** Última linha com algum pixel aceso. -1 se vazia. */
export function ultimaLinha(m: Mascara, { w, h }: Dim): number {
  for (let y = h - 1; y >= 0; y--) for (let x = 0; x < w; x++) if (m[y * w + x]) return y;
  return -1;
}

/**
 * Vãos acesos de uma linha, da esquerda para a direita.
 *
 * Uma linha na altura do braço tem TRÊS vãos — braço, tronco, braço — e não um.
 * Tratá-la como um só foi o que fez a primeira tentativa de deformação esticar o
 * pano por cima do vazio entre o braço e o tronco.
 */
export function vaos(m: Mascara, { w }: Dim, y: number): [number, number][] {
  const out: [number, number][] = [];
  let ini = -1;
  for (let x = 0; x < w; x++) {
    const aceso = m[y * w + x] === 1;
    if (aceso && ini < 0) ini = x;
    if (!aceso && ini >= 0) {
      out.push([ini, x - 1]);
      ini = -1;
    }
  }
  if (ini >= 0) out.push([ini, w - 1]);
  return out;
}

/**
 * Dilatação por distância de Chebyshev — quadrada, e é o que se quer aqui: a
 * folga é isotrópica e a máscara é teto, então canto quadrado não aparece.
 *
 * `so` limita a dilatação a certas linhas; fora delas o pixel é copiado sem
 * crescer. É como a folga da bota fica restrita à faixa do pé.
 */
export function dilatar(m: Mascara, dim: Dim, raioPx: number, so?: (y: number) => boolean): Mascara {
  const { w, h } = dim;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      if (so && !so(y)) {
        out[y * w + x] = 1;
        continue;
      }
      for (let dy = -raioPx; dy <= raioPx; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -raioPx; dx <= raioPx; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < w) out[yy * w + xx] = 1;
        }
      }
    }
  }
  return out;
}

/** `a` menos `b`. */
export function subtrair(a: Mascara, b: Mascara): Mascara {
  const out = new Uint8Array(a.length);
  for (let p = 0; p < a.length; p++) out[p] = a[p] && !b[p] ? 1 : 0;
  return out;
}

/** `a` mais `b`. */
export function unir(a: Mascara, b: Mascara): Mascara {
  const out = new Uint8Array(a.length);
  for (let p = 0; p < a.length; p++) out[p] = a[p] || b[p] ? 1 : 0;
  return out;
}

/** Quantos pixels acesos. */
export function area(m: Mascara): number {
  let n = 0;
  for (let p = 0; p < m.length; p++) if (m[p]) n++;
  return n;
}

/** Recorta uma máscara a uma faixa de linhas, inclusive nas duas pontas. */
export function faixa(m: Mascara, dim: Dim, y0: number, y1: number): Mascara {
  const { w, h } = dim;
  const out = new Uint8Array(m.length);
  for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++)
    for (let x = 0; x < w; x++) out[y * w + x] = m[y * w + x];
  return out;
}

// ---------------------------------------------------------------------------
// Derivação — precisa rasterizar a base, então precisa de navegador
// ---------------------------------------------------------------------------

/** Rasteriza a base com um subconjunto de camadas e devolve a silhueta. */
async function silhueta(
  nav: Browser,
  folha: string,
  esconder: string[],
  k: number,
): Promise<{ m: Mascara; w: number; h: number }> {
  const w = Math.round(BASE_W / k);
  const h = Math.round(BASE_H / k);
  const pg = await nav.newPage({ viewport: { width: w, height: h } });
  try {
    const css = esconder.length
      ? `<style>${esconder.map((c) => `.${c}`).join(",")}{display:none}</style>`
      : "";
    // A cor não importa: a silhueta é "o que não é o branco do fundo".
    await pg.setContent(
      `<body style="margin:0">` +
        `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
        `<svg width="${w}" height="${h}" viewBox="0 0 ${BASE_W} ${BASE_H}" ` +
        `style="--av-pele:#000;--av-cabelo:#000;background:#fff">${css}` +
        `<use href="#avatar-base-neutro" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></svg></body>`,
    );
    const buf = await pg.screenshot();
    const bruto = await pg.evaluate(async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const m: number[] = [];
      for (let i = 0; i < d.length; i += 4)
        m.push(d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240 ? 0 : 1);
      return { m, w: c.width, h: c.height };
    }, buf.toString("base64"));
    return { m: Uint8Array.from(bruto.m), w: bruto.w, h: bruto.h };
  } finally {
    await pg.close();
  }
}

/**
 * Deriva as três máscaras da base.
 *
 * `k` é a resolução: unidades do viewBox por pixel. 2 dá 1278×1920, que é fino o
 * bastante para o recorte e barato o bastante para dilatar em milissegundos.
 */
export async function derivarMascaras(
  nav: Browser,
  arquivoBase = "public/items/base/avatar-base-neutro.svg",
  k = 2,
): Promise<MascarasBase> {
  const folha = readFileSync(arquivoBase, "utf-8");

  // O macacão sozinho, e a pele sozinha. As classes vêm do gerador da base.
  const traje = await silhueta(nav, folha, ["av-forro-pele", "av-pele", "av-sobrancelha", "av-olho"], k);
  const pele = await silhueta(nav, folha, ["av-forro-roupa", "av-roupa"], k);
  const dim: Dim = { w: traje.w, h: traje.h };

  const topoTraje = primeiraLinha(traje.m, dim);
  const tornozelo = ultimaLinha(traje.m, dim);
  if (topoTraje < 0 || tornozelo < 0)
    throw new Error(
      "macacão não encontrado na base — as classes av-roupa/av-forro-roupa mudaram?",
    );

  const yGola = Math.round((Y_PESCOCO / k + topoTraje) / 2);
  const yBota = tornozelo - Math.round(BOTA_ACIMA / k);

  // COBERTURA: macacão + gola, dilatado; mais a faixa da bota, com folga própria.
  const comGola = unir(traje.m, faixa(pele.m, dim, yGola, topoTraje - 1));
  const regiaoBota = dilatar(
    faixa(unir(traje.m, pele.m), dim, yBota, dim.h - 1),
    dim,
    Math.round(BOTA_FOLGA / k),
    (y) => y >= yBota,
  );
  const limiteBaixo = Math.round((Y_SOLA + 150) / k);
  const cobertura = unir(
    dilatar(comGola, dim, Math.round(FOLGA / k)),
    faixa(regiaoBota, dim, yBota, limiteBaixo),
  );

  // PELE FRONTAL: pele acima da faixa da bota. O pé fica de fora — vai por baixo.
  const peleFrente = faixa(pele.m, dim, 0, yBota - 1);

  return {
    w: dim.w,
    h: dim.h,
    k,
    cobertura,
    peleFrente,
    corpoVestido: traje.m,
    marcos: { topoTraje, tornozelo, yGola, yBota },
  };
}

/**
 * As duas máscaras de RECORTE do asset de uniforme.
 *
 * Separadas de propósito — ver o cabeçalho. Confundi-las põe um pedestal verde
 * sob as botas.
 */
export function recortes(m: MascarasBase): { pano: Mascara; fundo: Mascara } {
  return {
    pano: subtrair(m.cobertura, m.peleFrente),
    fundo: subtrair(m.corpoVestido, m.peleFrente),
  };
}

/** Máscara para PNG de alfa: branco onde acesa, transparente onde não. */
export function paraPngAlfa(m: Mascara, dim: Dim): Buffer {
  // PNG mínimo em escala de cinza com alfa seria mais compacto, mas o consumidor
  // é o `<mask>` do SVG, que lê alfa. Gerar aqui evita depender de biblioteca.
  const { w, h } = dim;
  const linhas: Buffer[] = [];
  for (let y = 0; y < h; y++) {
    const linha = Buffer.alloc(1 + w * 2);
    for (let x = 0; x < w; x++) {
      const on = m[y * w + x] === 1;
      linha[1 + x * 2] = 255;
      linha[1 + x * 2 + 1] = on ? 255 : 0;
    }
    linhas.push(linha);
  }
  return pngCinzaAlfa(Buffer.concat(linhas), w, h);
}

/** PNG cinza+alfa, 8 bits, sem filtro. Escrito à mão para não trazer dependência. */
function pngCinzaAlfa(dados: Buffer, w: number, h: number): Buffer {
  const crcTab: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTab[n] = c >>> 0;
  }
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTab[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const bloco = (tipo: string, corpo: Buffer) => {
    const t = Buffer.from(tipo, "ascii");
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(corpo.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(Buffer.concat([t, corpo])));
    return Buffer.concat([tam, t, corpo, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 4; // cinza + alfa
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(dados, { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}
