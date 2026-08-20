/**
 * Reparo da `barba-cheia`: UM tom de massa, em vez de dois.
 *
 * O gerador pintou a metade de baixo da barba (y ≥ 540 px) no tom de sombra —
 * medido em 2026-08-19: 10 876 px "escuros" contra 15 747 de massa, e 60–90% das
 * linhas inferiores no tom escuro. Recolorida, lê como barba de duas cores; o Doug
 * reprovou ("a barba cheia ficou com duas cores, arrume isso"). As outras duas
 * barbas têm um só tom agrupado.
 *
 * O que faz: todo pixel da peça que não é contorno (lum ≥ 60) vira a cor mediana
 * da massa. Contorno preto e tudo fora da peça ficam intactos.
 *
 *   npx tsx scripts/avatar/arte/reparo-cheia-um-tom.ts <entrada> <saida>
 *
 * Asserção de procedência: rodar sobre a própria saída tem de trocar 0 px.
 */
import sharp from "sharp";
const [ent, sai] = process.argv.slice(2);
if (!ent || !sai) { console.error("uso: reparo-cheia-um-tom.ts <entrada.png> <saida.png>"); process.exit(2); }
const FUNDO = "#FBF8F5";
const cru = (p: string) => sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: A, info } = await cru(ent);
const { data: B } = await cru("scripts/avatar/arte/base-oficial.png");
const W = info.width, H = info.height, n = W * H;
const lum = (i: number) => 0.299 * A[i*3] + 0.587 * A[i*3+1] + 0.114 * A[i*3+2];
const peca = new Uint8Array(n);
for (let i = 0; i < n; i++) if (Math.abs(A[i*3]-B[i*3]) > 40 || Math.abs(A[i*3+1]-B[i*3+1]) > 40 || Math.abs(A[i*3+2]-B[i*3+2]) > 40) peca[i] = 1;
// cor mediana da massa (lum 100–150)
const rs: number[] = [], gs: number[] = [], bs: number[] = [];
for (let i = 0; i < n; i++) if (peca[i]) { const L = lum(i); if (L >= 100 && L < 150) { rs.push(A[i*3]); gs.push(A[i*3+1]); bs.push(A[i*3+2]); } }
const med = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
const massa = [med(rs), med(gs), med(bs)];
const out = Buffer.from(A); let trocados = 0;
for (let i = 0; i < n; i++) if (peca[i] && lum(i) >= 60) {
  if (A[i*3] !== massa[0] || A[i*3+1] !== massa[1] || A[i*3+2] !== massa[2]) trocados++;
  out[i*3] = massa[0]; out[i*3+1] = massa[1]; out[i*3+2] = massa[2];
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(sai);
console.log(`massa: rgb(${massa.join(",")}) · pixels da peça: ${peca.reduce((a, b) => a + b, 0)} · trocados para a massa: ${trocados} · saída: ${sai}`);
