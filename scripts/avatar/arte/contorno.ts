/**
 * CANDIDATO A — CONTORNO DIRETO DA MÁSCARA, sem vetorizador nenhum.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA QUE ELE RESPONDE
 * ---------------------------------------------------------------------------
 *
 * O caminho longo é `máscara → SVG genérico → interpretar o SVG → {t,y}`. Cada
 * seta é uma tradução, e cada tradução é uma chance de perder forma — a rodada
 * anterior gastou uma investigação inteira em cima da terceira (quais dos 235
 * subpaths são cabelo).
 *
 * O caminho curto é `máscara → contorno ordenado → simplificação → {t,y}`. Ele
 * pula o SVG genérico porque **o formato de destino não é SVG**: é uma lista de
 * pontos. Pedir a um vetorizador que produza curvas de Bézier para depois
 * reamostrá-las em pontos é trabalho que se desfaz.
 *
 * ---------------------------------------------------------------------------
 * NADA AQUI É NOVO — TUDO JÁ EXISTE NO REPOSITÓRIO
 * ---------------------------------------------------------------------------
 *
 * `bordaOrdenada` (traçado de Moore), `suavizarLaco`, `escolherN` e
 * `decimarPorCorda` são as funções que o pipeline vigente já usa, e `paraTY` é a
 * conversão oficial. Este arquivo é a cola entre elas e a régua de comparação —
 * por isso ele é curto, e por isso não há biblioteca nova.
 *
 * A simplificação é por ERRO, não por contagem: `escolherN` varre 8…64 pontos,
 * mede o desvio máximo da corda em cada N e escolhe o primeiro que fica dentro de
 * meio traço (6 unidades). É o critério do projeto, e ele responde à exigência do
 * pedido de "simplificar conforme o erro visual, não por número fixo de pontos".
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import { VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { decimarPorCorda, desvioDaCorda } from "../estilo/medir";
import {
  bordaOrdenada,
  escolherN,
  suavizarLaco,
} from "../estilo/tracar-cabelo";
import { ESCALA, LADO, ORIGEM, PASTA, paraUnidade, saidaDaArte } from "./base";
import { extrair } from "./extrair";

export interface MedidaContorno {
  pontosDensos: number;
  pontos: number;
  erroMax: number;
  iou: number;
  perdido: number;
  inventado: number;
  ms: number;
}

/** O laço decimado, em unidades do `viewBox`, e o `d` correspondente. */
export function contornoDireto(mascara: Uint8Array, w: number, h: number) {
  const denso = bordaOrdenada(mascara, w, h).map((p) => paraUnidade(p.x, p.y));
  const suave = suavizarLaco(denso, 5);
  const esc = escolherN(suave, true);
  const pts = decimarPorCorda(suave, esc.n, { fechado: true });
  const erroMax = desvioDaCorda(suave, [...pts, pts[0]]).max;
  const d =
    pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  return { denso: suave, pts, erroMax, d, varredura: esc.varredura };
}

export async function medirCandidato(caminhoArte: string): Promise<{
  contorno: MedidaContorno;
}> {
  const SAIDA = `${saidaDaArte(caminhoArte)}/contorno`;
  mkdirSync(SAIDA, { recursive: true });
  const t = Date.now();
  const e = await extrair(caminhoArte);
  const c = contornoDireto(e.mascara, e.arte.w, e.arte.h);
  const ms = Date.now() - t;

  // Rasteriza o laço no MESMO canvas da máscara, pela mesma transformação.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" width="${LADO}" height="${LADO}">` +
    `<rect width="${LADO}" height="${LADO}" fill="#000"/>` +
    `<svg x="${ORIGEM.x}" y="${ORIGEM.y}" width="${VIEWBOX.w * ESCALA}" height="${VIEWBOX.h * ESCALA}" ` +
    `viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" overflow="visible"><path d="${c.d}" fill="#fff"/></svg></svg>`;
  const { data } = await sharp(Buffer.from(svg), { density: 300 })
    .resize(LADO, LADO, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let inter = 0,
    uniao = 0,
    perdido = 0,
    inventado = 0;
  const sobre = Buffer.alloc(LADO * LADO * 3, 255);
  for (let i = 0; i < LADO * LADO; i++) {
    const a = e.mascara[i];
    const b = data[i] > 127 ? 1 : 0;
    if (a || b) uniao++;
    if (a && b) inter++;
    if (a && !b) perdido++;
    if (!a && b) inventado++;
    const j = i * 3;
    if (a && b) (sobre[j] = 30), (sobre[j + 1] = 150), (sobre[j + 2] = 80);
    else if (a) (sobre[j] = 200), (sobre[j + 1] = 40), (sobre[j + 2] = 40);
    else if (b) (sobre[j] = 40), (sobre[j + 1] = 90), (sobre[j + 2] = 210);
  }

  await sharp(Buffer.from(svg), { density: 300 })
    .resize(LADO, LADO, { fit: "fill" })
    .png()
    .toFile(`${SAIDA}/a-contorno.png`);
  await sharp(sobre, { raw: { width: LADO, height: LADO, channels: 3 } })
    .png()
    .toFile(`${SAIDA}/b-sobreposicao.png`);

  return {
    contorno: {
      pontosDensos: c.denso.length,
      pontos: c.pts.length,
      erroMax: c.erroMax,
      iou: uniao ? inter / uniao : 0,
      perdido,
      inventado,
      ms,
    },
  };
}

if (process.argv[1]?.endsWith("contorno.ts")) {
  const arte = process.argv[2] ?? `${PASTA}/entrada.png`;
  medirCandidato(arte)
    .then(({ contorno: m }) => {
      console.log(`CANDIDATO A — CONTORNO DIRETO DA MÁSCARA\n`);
      console.log(`  pontos densos (Moore)   ${m.pontosDensos}`);
      console.log(`  pontos após simplificar ${m.pontos}`);
      console.log(`  erro máx da corda       ${m.erroMax.toFixed(2)} u   (teto: 6 u = meio traço)`);
      console.log(`  IoU contra a máscara    ${(m.iou * 100).toFixed(1)}%`);
      console.log(`  perdido / inventado     ${m.perdido} / ${m.inventado} px`);
      console.log(`  tempo                   ${m.ms} ms`);
      console.log(`\n  artefatos em ${saidaDaArte(arte)}/contorno/`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
