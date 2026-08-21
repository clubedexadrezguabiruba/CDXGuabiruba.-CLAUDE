/**
 * Reparo da `trancada-v4`: as duas manchas que o Doug pegou a olho em 2026-08-20.
 *
 *   *"saiu uma bola preta (contorno preto) excessiva no queixo, lado direito"*
 *   *"pontos pretos deslocados dentro da barba, lado esquerdo, perto das linhas"*
 *
 * Localizadas com régua antes de qualquer conserto
 * (`.scratch/estilo/preto-no-render.ts` e `inchaco-da-banda.ts`):
 *
 *   A MANCHA SOLTA   53 px em u x 203–208, y 383–393, mais 11 pontos de 1 px.
 *                    São as ÚNICAS componentes de preto inteiramente cercadas de
 *                    miolo no render — 65 px numa peça de 54 264.
 *   O INCHAÇO        13 × 13 px em u x 394–404, y 372–382, com 18 px de espessura
 *                    de banda contra a mediana de 2 px da própria peça.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO É REPARO E NÃO DESENHO — o critério do G20
 * ---------------------------------------------------------------------------
 *
 * O G20 separa restaurar de desenhar, e o teste é: **o defeito é descritível em
 * régua?** Os dois são, e nenhuma das duas regras inventa forma:
 *
 *  1. **mancha interna** — componente de tinta que não encosta na borda da peça,
 *     compacta (lado maior < 3× o menor) e menor que 80 px vira miolo. Divisão de
 *     mecha é ALONGADA e sobrevive por construção; é o que separa o defeito do
 *     desenho, e o número de sobreviventes está no laudo para conferir;
 *  2. **cunho** — dentro de UMA caixa nomeada, a tinta cujo centro está a mais de
 *     `MEIA` px de qualquer pixel claro vira miolo. **O contorno não é apagado**:
 *     linha de até `2 × MEIA` px passa inteira, então a peça continua fechada ali.
 *     É afinar um caroço, não abrir a silhueta.
 *
 * A caixa é escrita à mão de propósito. Uma regra global de "afine toda banda
 * gorda" comeria a trança e as massas escuras da lateral esquerda, que são desenho.
 *
 * Asserção de procedência: rodar sobre a própria saída troca 0 px.
 *
 *   npx tsx scripts/avatar/arte/reparo-trancada.ts <entrada.png> <saida.png>
 */
import sharp from "sharp";

import { ESCALA, FUNDO, LADO, ORIGEM, PNG_BASE } from "./base";

const [ent, sai] = process.argv.slice(2);
if (!ent || !sai) {
  console.error("uso: reparo-trancada.ts <entrada.png> <saida.png>");
  process.exit(2);
}

/** Tinta é o que a esteira chama de contorno. A mesma régua de `barba-para-formas`. */
const LUM_CONTORNO = 60;
/** Componente interna maior que isto é desenho, não sujeira. */
const MANCHA_MAX = 80;
/** Lado maior sobre lado menor: acima disto é LINHA (divisão de mecha), e fica. */
const ALONGADA = 3;
/** A caixa do inchaço, em unidades do viewBox. Medida, não estimada. */
const CAIXA = { x0: 388, x1: 412, y0: 354, y1: 378 };
/**
 * Meia-espessura máxima da tinta dentro da caixa, em px.
 *
 * O mapa fino (`.scratch/estilo/mapa-regiao.ts`, u 380–420 × 358–396) mostrou o que a
 * "bola" é: a linha de divisão de mecha CONVERGE com o contorno externo e as duas se
 * fundem num cunho de ~10 px, contra os ~2 px da linha normal. Não é banda gorda —
 * por isso a primeira versão desta regra, que media a distância até FORA da peça,
 * achou 2 px e não consertou nada.
 *
 * A régua certa é a distância até o não-preto: a tinta cujo centro está a mais de
 * `MEIA` px de qualquer pixel claro é miolo de cunho, e é ela que engorda. Com 3 px,
 * uma linha de até 6 px de largura passa inteira e só o que excede isso afina.
 */
const MEIA = 3;

const cru = (p: string) =>
  sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: A, info } = await cru(ent);
const { data: B } = await cru(PNG_BASE);
const W = info.width,
  H = info.height,
  n = W * H;
if (W !== LADO || H !== LADO) throw new Error(`${ent} tem ${W}×${H} e a rota pressupõe ${LADO}²`);

const lum = (i: number) => 0.299 * A[i * 3] + 0.587 * A[i * 3 + 1] + 0.114 * A[i * 3 + 2];
const uDe = (x: number, y: number) => ({ x: (x - ORIGEM.x) / ESCALA, y: (y - ORIGEM.y) / ESCALA });

// --- a peça: o que difere da base, na mancha grande ---
const dif = new Uint8Array(n);
for (let i = 0; i < n; i++) {
  const d = Math.max(
    Math.abs(A[i * 3] - B[i * 3]),
    Math.abs(A[i * 3 + 1] - B[i * 3 + 1]),
    Math.abs(A[i * 3 + 2] - B[i * 3 + 2]),
  );
  if (d > 24) dif[i] = 1;
}
const rotP = new Int32Array(n).fill(-1);
const tam: number[] = [];
for (let i0 = 0; i0 < n; i0++) {
  if (rotP[i0] >= 0 || !dif[i0]) continue;
  const id = tam.length;
  let t = 0;
  const f = [i0];
  rotP[i0] = id;
  while (f.length) {
    const p = f.pop()!;
    t++;
    const x = p % W,
      y = (p / W) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if (q >= 0 && rotP[q] < 0 && dif[q]) {
        rotP[q] = id;
        f.push(q);
      }
  }
  tam.push(t);
}
const maior = Math.max(...tam);
const peca = new Uint8Array(n);
for (let i = 0; i < n; i++) if (rotP[i] >= 0 && tam[rotP[i]] >= maior * 0.05) peca[i] = 1;

// --- a cor do miolo: a mediana do que não é tinta ---
const rs: number[] = [], gs: number[] = [], bs: number[] = [];
for (let i = 0; i < n; i++)
  if (peca[i] && lum(i) >= LUM_CONTORNO) {
    rs.push(A[i * 3]);
    gs.push(A[i * 3 + 1]);
    bs.push(A[i * 3 + 2]);
  }
const med = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
const MIOLO = [med(rs), med(gs), med(bs)];

const out = Buffer.from(A);
let trocados = 0;
const pintar = (i: number) => {
  if (out[i * 3] !== MIOLO[0] || out[i * 3 + 1] !== MIOLO[1] || out[i * 3 + 2] !== MIOLO[2]) trocados++;
  out[i * 3] = MIOLO[0];
  out[i * 3 + 1] = MIOLO[1];
  out[i * 3 + 2] = MIOLO[2];
};

// --- REGRA 1: mancha de tinta solta dentro da peça ---
const tinta = new Uint8Array(n);
for (let i = 0; i < n; i++) if (peca[i] && lum(i) < LUM_CONTORNO) tinta[i] = 1;

const rot = new Int32Array(n).fill(-1);
let apagadas = 0,
  apagadasPx = 0,
  linhasMantidas = 0,
  grandesMantidas = 0;
for (let i0 = 0; i0 < n; i0++) {
  if (rot[i0] >= 0 || !tinta[i0]) continue;
  const id = i0;
  const px: number[] = [];
  let borda = false,
    x0 = W, x1 = 0, y0 = H, y1 = 0;
  const f = [i0];
  rot[i0] = id;
  while (f.length) {
    const p = f.pop()!;
    px.push(p);
    const x = p % W,
      y = (p / W) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    if (x > 0 && !peca[p - 1]) borda = true;
    if (x < W - 1 && !peca[p + 1]) borda = true;
    if (y > 0 && !peca[p - W]) borda = true;
    if (y < H - 1 && !peca[p + W]) borda = true;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if (q >= 0 && rot[q] < 0 && tinta[q]) {
        rot[q] = id;
        f.push(q);
      }
  }
  if (borda) continue; // faz parte da banda externa
  const l = x1 - x0 + 1,
    a = y1 - y0 + 1;
  if (Math.max(l, a) / Math.min(l, a) >= ALONGADA) {
    linhasMantidas++;
    continue;
  }
  if (px.length > MANCHA_MAX) {
    grandesMantidas++;
    continue;
  }
  apagadas++;
  apagadasPx += px.length;
  for (const p of px) pintar(p);
}

// --- REGRA 2: afinar o cunho, dentro da caixa nomeada ---
// distância de cada pixel de TINTA até o não-tinta mais próximo (BFS a partir do claro)
const distClaro = new Int32Array(n).fill(-1);
let fila: number[] = [];
for (let i = 0; i < n; i++)
  if (!peca[i] || lum(i) >= LUM_CONTORNO) {
    distClaro[i] = 0;
    fila.push(i);
  }
while (fila.length) {
  const prox: number[] = [];
  for (const p of fila) {
    const x = p % W,
      y = (p / W) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if (q >= 0 && distClaro[q] < 0) {
        distClaro[q] = distClaro[p] + 1;
        prox.push(q);
      }
  }
  fila = prox;
}
let afinados = 0;
let maisFundo = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!peca[i] || lum(i) >= LUM_CONTORNO) continue;
    const u = uDe(x, y);
    if (u.x < CAIXA.x0 || u.x > CAIXA.x1 || u.y < CAIXA.y0 || u.y > CAIXA.y1) continue;
    if (distClaro[i] > maisFundo) maisFundo = distClaro[i];
    if (distClaro[i] > MEIA) {
      afinados++;
      pintar(i);
    }
  }

await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(sai);
console.log(
  `\nREPARO trancada — ${ent}\n\n` +
    `  cor do miolo            rgb(${MIOLO.join(", ")})\n` +
    `  1. manchas soltas       ${apagadas} apagada(s), ${apagadasPx} px\n` +
    `     mantidas por FORMA   ${linhasMantidas} alongada(s) — divisão de mecha\n` +
    `     mantidas por TAMANHO ${grandesMantidas} acima de ${MANCHA_MAX} px — desenho\n` +
    `  2. cunho afinado        ${afinados} px na caixa u x ${CAIXA.x0}–${CAIXA.x1}, y ${CAIXA.y0}–${CAIXA.y1}\n` +
    `     tinta mais funda     ${maisFundo} px do claro — linha de até ${2 * MEIA} px passa inteira\n\n` +
    `  total trocado           ${trocados} px de ${peca.reduce((a: number, b) => a + b, 0)} da peça\n` +
    `  saída                   ${sai}\n`,
);
