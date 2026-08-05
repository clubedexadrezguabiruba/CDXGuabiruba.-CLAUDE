/**
 * DE ARQUIVO PARA `Bitmap` — o único lugar que abre imagem.
 *
 * Existe para o `medir.ts` continuar sendo o que o docstring dele promete: uma
 * régua **pura**, que recebe pixel e devolve número, sem tocar em disco. Quem
 * carrega é este arquivo, e é só ele.
 *
 * ---------------------------------------------------------------------------
 * OS PARÂMETROS DE RASTERIZAÇÃO SÃO A MEDIDA, NÃO PREFERÊNCIA
 * ---------------------------------------------------------------------------
 *
 * Os quatro estavam copiados em três scripts de `.scratch/estilo`, e trocar a
 * altura do raster em um só faria duas medidas concordarem **por acidente**. Cada
 * um responde por um defeito concreto:
 *
 *  - **`density: 300`** — sem ele o `sharp` rasteriza o SVG a 72 dpi e o `resize`
 *    sobe de um raster pequeno. A borda vira rampa, e a rampa entra na conta da
 *    espessura do traço, que é o número mais sensível do sistema;
 *  - **`resize({ height })` a 2048** — dá 0,29 unidade por pixel, então o erro de
 *    discretização da espessura fica em ±0,3 u. É uma ordem de grandeza abaixo da
 *    diferença que se quer resolver (12 contra 13), e é isso que torna a medição
 *    conclusiva em vez de sugestiva;
 *  - **`flatten({ background: "#FFFFFF" })` ANTES de `removeAlpha()`** — a ordem
 *    importa. `removeAlpha` sozinho descarta o canal e deixa o RGB de baixo, que
 *    num SVG transparente é **preto**: a imagem inteira viraria contorno para o
 *    limiar de `ESCURO`. `flatten` compõe sobre branco primeiro;
 *  - **`raw()`** — pixel cru, sem recompressão, porque o limiar de luminância é
 *    comparação exata e não sobrevive a JPEG.
 *
 * ---------------------------------------------------------------------------
 * O `sharp` NÃO ESTÁ DECLARADO EM `package.json`
 * ---------------------------------------------------------------------------
 *
 * Ele funciona por ser dependência transitiva do Next. Todo script de medição
 * deste diretório quebra se o Next parar de trazê-lo, e o sintoma vai ser um
 * `MODULE_NOT_FOUND` a quilômetros da causa. Está declarado aqui porque é aqui que
 * a dependência entra no pipeline de arte.
 */

import { readFileSync } from "fs";
import sharp from "sharp";
import type { Bitmap } from "./medir";

/** A altura de raster que torna a espessura do traço mensurável. Ver o topo. */
export const ALTURA_RASTER = 2048;

/**
 * Um SVG (string ou caminho) virando pixel, na altura que a régua espera.
 *
 * `altura` só se muda com motivo medido: ela é o que fixa a resolução da medição.
 */
export async function rasterizarSvg(svg: string, altura = ALTURA_RASTER): Promise<Bitmap> {
  const { data, info } = await sharp(Buffer.from(svg), { density: 300 })
    .resize({ height: altura })
    .flatten({ background: "#FFFFFF" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, canais: info.channels };
}

/**
 * Um PNG de referência virando pixel, **no tamanho original**.
 *
 * Sem `resize`, de propósito: a referência já É a resolução da medida, e
 * reamostrar introduziria uma rampa que a régua leria como traço. `removeAlpha`
 * sem `flatten` é seguro aqui só porque as referências deste projeto não têm canal
 * alfa — se um dia tiverem, esta função precisa do `flatten` como a de cima.
 */
export async function carregarPng(caminho: string): Promise<Bitmap> {
  const { data, info } = await sharp(readFileSync(caminho))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, canais: info.channels };
}
