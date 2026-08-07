/**
 * As contas de pixel que o Gate −1 e a extração dividem.
 *
 * Existe pelo mesmo motivo que `raster.ts` existe no pipeline vigente: os
 * parâmetros de leitura de imagem SÃO a medida. Se o gate carregasse o PNG de um
 * jeito e a extração de outro, as duas mediriam imagens diferentes e concordariam
 * ou discordariam por acidente.
 *
 * ---------------------------------------------------------------------------
 * `flatten` ANTES DE `removeAlpha`, E AQUI A ORDEM TEM UM SEGUNDO MOTIVO
 * ---------------------------------------------------------------------------
 *
 * Em `raster.ts` a razão é que `removeAlpha` sozinho deixa o RGB de baixo, que num
 * SVG transparente é preto — a imagem inteira viraria contorno. Aqui há mais: a
 * arte pode voltar do gerador **com** canal alfa (algumas rotas de exportação
 * acrescentam um) e a base não tem nenhum. Duas imagens compostas contra fundos
 * diferentes divergiriam em toda borda, e a divergência entraria na conta do gate
 * como se o boneco tivesse mudado. Compor as duas contra o MESMO fundo declarado
 * é o que torna a comparação uma comparação.
 */

import sharp from "sharp";

export interface Img {
  data: Buffer;
  w: number;
  h: number;
}

/** Um PNG virando RGB cru, no tamanho original e composto contra `fundo`. */
export async function carregar(caminho: string, fundo: string): Promise<Img> {
  const { data, info } = await sharp(caminho)
    .flatten({ background: fundo })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

export const rgb = (im: Img, x: number, y: number): [number, number, number] => {
  const i = (y * im.w + x) * 3;
  return [im.data[i], im.data[i + 1], im.data[i + 2]];
};

/** Rec. 601. É a mesma régua de luminância que `medir.ts` usa. */
export const luz = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * A maior diferença de canal entre dois pixels.
 *
 * Máximo por canal, e não distância euclidiana, porque o que interessa é "algum
 * canal mudou o bastante para o olho ver", e a euclidiana dilui uma mudança forte
 * num canal só — que é justamente como o ciano do cabelo aparece sobre pele.
 */
export function delta(a: Img, b: Img, x: number, y: number): number {
  const i = (y * a.w + x) * 3;
  return Math.max(
    Math.abs(a.data[i] - b.data[i]),
    Math.abs(a.data[i + 1] - b.data[i + 1]),
    Math.abs(a.data[i + 2] - b.data[i + 2]),
  );
}

/**
 * Matiz em graus e saturação em [0,1], no espaço HSL.
 *
 * É por aqui que a peça é reconhecida: o ciano instrumental vive em ~180° e nada
 * mais na base mora perto disso (a pele está em 27°, o fundo e a roupa têm
 * saturação baixa demais para ter matiz confiável). Comparar matiz é o que torna
 * a extração robusta ao gerador não devolver o hexadecimal exato que se pediu.
 */
export function matiz(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === R) h = 60 * (((G - B) / d) % 6);
  else if (max === G) h = 60 * ((B - R) / d + 2);
  else h = 60 * ((R - G) / d + 4);
  if (h < 0) h += 360;
  return { h, s, l };
}

/** Distância angular entre dois matizes, em graus. 350° e 10° distam 20. */
export const distanciaMatiz = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export interface Componente {
  area: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Índice de um pixel qualquer dela, para semear buscas. */
  semente: number;
}

/**
 * Componentes conexas de uma máscara, por 4-vizinhança.
 *
 * 4 e não 8 de propósito: com 8-vizinhança, duas manchas que se tocam só na
 * diagonal viram uma componente, e é assim que ruído de borda gruda na massa
 * principal e passa a ser contado como parte dela. A pergunta que a rota faz —
 * *"esta ponta está ligada ao resto do cabelo?"* — precisa que "ligada" signifique
 * ligada por área, não por um pixel de canto.
 *
 * Iterativa e não recursiva: uma máscara de 1024² estoura a pilha do Node numa
 * componente grande, e a falha aparece como `RangeError` longe da causa.
 */
export function componentes(mascara: Uint8Array, w: number, h: number): Componente[] {
  const visto = new Uint8Array(mascara.length);
  const achados: Componente[] = [];
  const fila = new Int32Array(mascara.length);
  for (let s = 0; s < mascara.length; s++) {
    if (!mascara[s] || visto[s]) continue;
    let ini = 0,
      fim = 0;
    fila[fim++] = s;
    visto[s] = 1;
    let area = 0,
      x0 = w,
      y0 = h,
      x1 = -1,
      y1 = -1;
    while (ini < fim) {
      const p = fila[ini++];
      const x = p % w,
        y = (p / w) | 0;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mascara[p - 1] && !visto[p - 1]) (visto[p - 1] = 1), (fila[fim++] = p - 1);
      if (x < w - 1 && mascara[p + 1] && !visto[p + 1]) (visto[p + 1] = 1), (fila[fim++] = p + 1);
      if (y > 0 && mascara[p - w] && !visto[p - w]) (visto[p - w] = 1), (fila[fim++] = p - w);
      if (y < h - 1 && mascara[p + w] && !visto[p + w]) (visto[p + w] = 1), (fila[fim++] = p + w);
    }
    achados.push({ area, x0, y0, x1, y1, semente: s });
  }
  return achados.sort((a, b) => b.area - a.area);
}

/**
 * Dilata uma máscara por `r` pixels, em cruz. Barato e suficiente.
 *
 * Morava em `converter.ts` e subiu para cá quando `extrair.ts` passou a precisar
 * dela: a segunda cópia de uma operação de máscara é o começo de duas operações
 * que divergem, e este arquivo existe justamente porque os parâmetros de leitura
 * de imagem SÃO a medida.
 */
export function dilatar(m: Uint8Array, w: number, h: number, r: number): Uint8Array {
  let atual = m;
  for (let passo = 0; passo < r; passo++) {
    const prox = new Uint8Array(atual.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (
          atual[i] ||
          (x > 0 && atual[i - 1]) ||
          (x < w - 1 && atual[i + 1]) ||
          (y > 0 && atual[i - w]) ||
          (y < h - 1 && atual[i + w])
        )
          prox[i] = 1;
      }
    }
    atual = prox;
  }
  return atual;
}

/** Escreve uma máscara como PNG preto-e-branco. Diagnóstico, não medida. */
export async function salvarMascara(
  mascara: Uint8Array,
  w: number,
  h: number,
  caminho: string,
): Promise<void> {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < mascara.length; i++) {
    const v = mascara[i] ? 255 : 0;
    buf[i * 3] = buf[i * 3 + 1] = buf[i * 3 + 2] = v;
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } }).png().toFile(caminho);
}

/** Escreve uma imagem RGB crua como PNG. */
export async function salvarImg(im: Img, caminho: string): Promise<void> {
  await sharp(im.data, { raw: { width: im.w, height: im.h, channels: 3 } }).png().toFile(caminho);
}
