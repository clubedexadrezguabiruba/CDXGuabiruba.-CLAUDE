/**
 * CLOSE DE COORDENADA MEDIDA — base, arte e diferença lado a lado, na região que
 * o Gate −1 acusou.
 *
 * Existe para a pergunta *"o que exatamente mudou ali?"* não ser respondida
 * abrindo a arte inteira e olhando. O recorte sai da caixa que o gate mediu, não
 * de escolha a olho — a regra de close do projeto.
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import { FUNDO, LADO, PASTA, PNG_BASE, ROSTO, SOBRANCELHAS, paraPx, saidaDaArte } from "./base";
import { carregar, delta } from "./pixels";

const ZOOM = 3;
const FOLGA_PX = 40;

async function principal() {
  const arte = process.argv[2] ?? `${PASTA}/entrada.png`;
  const saida = saidaDaArte(arte);
  mkdirSync(saida, { recursive: true });

  const a = paraPx(ROSTO.x0, Math.min(ROSTO.y0, SOBRANCELHAS.y0));
  const b = paraPx(ROSTO.x1, ROSTO.y1);
  const left = Math.max(0, Math.round(a.x) - FOLGA_PX);
  const top = Math.max(0, Math.round(a.y) - FOLGA_PX);
  const width = Math.min(LADO - left, Math.round(b.x - a.x) + FOLGA_PX * 2);
  const height = Math.min(LADO - top, Math.round(b.y - a.y) + FOLGA_PX * 2);

  const base = await carregar(PNG_BASE, FUNDO);
  const art = await carregar(arte, FUNDO);

  // A diferença, pintada: vermelho onde mudou muito, cinza onde mudou pouco.
  const dif = Buffer.alloc(LADO * LADO * 3);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const d = art.w === LADO && art.h === LADO ? delta(base, art, x, y) : 0;
      const i = (y * LADO + x) * 3;
      if (d > 24) {
        dif[i] = 217;
        dif[i + 1] = 43;
        dif[i + 2] = 43;
      } else {
        const v = 255 - Math.min(255, d * 4);
        dif[i] = dif[i + 1] = dif[i + 2] = v;
      }
    }
  }

  const recorte = { left, top, width, height };
  const painel = async (src: Buffer | string, raw = false) =>
    (raw
      ? sharp(src as Buffer, { raw: { width: LADO, height: LADO, channels: 3 } })
      : sharp(src as string)
    )
      .extract(recorte)
      .resize(width * ZOOM, height * ZOOM, { kernel: "nearest" })
      .png()
      .toBuffer();

  const p1 = await painel(PNG_BASE);
  const p2 = await painel(arte);
  const p3 = await painel(dif, true);

  const w = width * ZOOM;
  const h = height * ZOOM;
  await sharp({
    create: { width: w * 3 + 40, height: h, channels: 3, background: "#FFFFFF" },
  })
    .composite([
      { input: p1, left: 0, top: 0 },
      { input: p2, left: w + 20, top: 0 },
      { input: p3, left: w * 2 + 40, top: 0 },
    ])
    .png()
    .toFile(`${saida}/close-rosto.png`);

  console.log(`recorte px: left ${left} top ${top} ${width}×${height}  (zoom ${ZOOM}×)`);
  console.log(`painéis: base | arte | diferença`);
  console.log(`escrito: ${saida}/close-rosto.png  (${w * 3 + 40} × ${h})`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
