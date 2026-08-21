/**
 * A QUARTA SAÍDA DA ROTA, generalizada — restaurar, não desenhar.
 *
 * Substitui `restaurar-barba5.ts`, que reconhecia a peça pela COR e por isso
 * precisava saber de antemão que o gerador tinha pintado de verde. Ele pintou de
 * castanho na rodada seguinte, e a lição é que **a cor do gerador não é previsível**
 * — mas a estrutura é: a peça é UMA MANCHA GRANDE E CONEXA, e tudo o mais que
 * difere da base é ruído de reencode ou sombra projetada.
 *
 * Faz duas coisas, e só duas, as duas descritíveis em régua:
 *
 *  1. COR — o matiz da peça vai para 180° (o ciano instrumental), preservando
 *     saturação e luminância. Nenhum pixel muda de lugar, nenhuma forma muda. O
 *     preto do contorno continua preto: com max = min, a fórmula é identidade.
 *  2. RESTAURAR — fora da peça, o pixel volta a ser o da base. Isso apaga a sombra
 *     que o gerador projeta na túnica e o ruído de reencode, e é o gesto que o G20
 *     aprovou: restaurar o que a base já tem não é desenhar.
 *
 * O QUE NÃO SE TOCA: a silhueta. Se o gerador desenhou a forma errada, isso é caso
 * de gerador ou de achado — nunca de programa.
 *
 * A FRANJA é o risco conhecido (a primeira tentativa do G20 errou nisso): a máscara
 * é DILATADA antes de restaurar, para o antialias da borda sobreviver.
 *
 *
 * ⚠️ O QUE ELE NÃO SEPARA, e está medido: SOMBRA CONTÍGUA À PEÇA.
 *
 * A sombra que o gerador projeta na túnica encosta na barba, então cai no mesmo
 * componente conexo e sobrevive à restauração. Foi o caso da `barba-cheia`: a
 * versão dela no repositório saiu de uma variante anterior deste script, que
 * reconhecia a peça pela COR (o ciano instrumental) e por isso descartava a sombra.
 * Ele NÃO reproduz aquela arte — a `barba-cavanhaque`, sim, byte a byte.
 *
 * Trocar o critério para MATIZ foi tentado e é pior, também medido: aprova no
 * Gate −1 mas apaga parte da peça (a `cheia` cai de 38 505 px para 16 022).
 * Fica como achado, não como conserto.
 *
 * ⚠️ ELE RODA **ANTES** DO GATE −1, e é o contrário das rotas de cabelo e de traje.
 *
 * O Gate −1 reconhece a peça pelo **ciano** (passo 2 da ordem em três tempos,
 * `gate-menos-um.ts`), e quem cria o ciano é este programa. Na arte crua a máscara
 * sai parcial e o que sobra é contado como boneco redesenhado: medido na `rala` em
 * 2026-08-20, 84,3% da peça reconhecida, 660 px não explicados e 27 ladrilhos de
 * forma em "rosto" — **REPROVADA**. A mesma arte depois daqui: 100,0% da peça,
 * 0 px não explicados, APROVADA. A reprovação engana porque sai com a mensagem de
 * gerador que redesenhou o boneco. Ver doc 19 §13.
 *
 * Uso: npx tsx scripts/avatar/arte/restaurar-peca.ts <entrada.png> <saida.png> [franja_u]
 */
import sharp from "sharp";
import { PNG_BASE, FUNDO, ESCALA } from "./base";

const ent = process.argv[2], sai = process.argv[3];
const FRANJA_U = Number(process.argv[4] ?? 3);
const NIVEL = 24;              // o mesmo do Gate −1
const PISO_SOLTA = 0.05;       // componente < 5% da maior é ruído, não peça

const cru = (p: string) => sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: A, info } = await cru(ent);
const { data: B } = await cru(PNG_BASE);
const W = info.width, H = info.height, n = W * H;

// --- 1. o que difere da base ---
const dif = new Uint8Array(n);
for (let i = 0; i < n; i++) {
  const d = Math.max(Math.abs(A[i*3]-B[i*3]), Math.abs(A[i*3+1]-B[i*3+1]), Math.abs(A[i*3+2]-B[i*3+2]));
  if (d > NIVEL) dif[i] = 1;
}

// --- 2. a peça é a mancha grande e conexa (mesmo critério do extrair.ts) ---
const rotulo = new Int32Array(n).fill(-1);
const tam: number[] = [];
for (let i = 0; i < n; i++) {
  if (rotulo[i] >= 0 || !dif[i]) continue;
  const r = tam.length; let t = 0;
  const fila = [i]; rotulo[i] = r;
  while (fila.length) {
    const p = fila.pop()!; t++;
    const x = p % W, y = (p / W) | 0;
    for (const q of [x>0?p-1:-1, x<W-1?p+1:-1, y>0?p-W:-1, y<H-1?p+W:-1])
      if (q >= 0 && rotulo[q] < 0 && dif[q]) { rotulo[q] = r; fila.push(q); }
  }
  tam.push(t);
}
const maior = Math.max(...tam);
const peca = new Uint8Array(n);
let daPeca = 0, ruido = 0;
for (let i = 0; i < n; i++) {
  if (rotulo[i] < 0) continue;
  if (tam[rotulo[i]] >= maior * PISO_SOLTA) { peca[i] = 1; daPeca++; } else ruido++;
}
const quantos = tam.filter((t) => t >= maior * PISO_SOLTA).length;

// --- 3. matiz 180°, só na peça ---
let recolorido = 0;
for (let i = 0; i < n; i++) {
  if (!peca[i]) continue;
  const r = A[i*3], g = A[i*3+1], b = A[i*3+2];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) continue;                 // cinza e preto ficam como estão
  A[i*3] = min; A[i*3+1] = max; A[i*3+2] = max;
  recolorido++;
}

// --- 4. dilatar e restaurar ---
const folga = Math.round(FRANJA_U * ESCALA);
const dil = new Uint8Array(peca);
for (let p = 0; p < folga; p++) {
  const ant = new Uint8Array(dil);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W + x;
    if (ant[i]) continue;
    if ((x>0 && ant[i-1]) || (x<W-1 && ant[i+1]) || (y>0 && ant[i-W]) || (y<H-1 && ant[i+W])) dil[i] = 1;
  }
}
let restaurados = 0; const tons = new Set<string>();
for (let i = 0; i < n; i++) {
  if (dil[i]) continue;
  const d = Math.max(Math.abs(A[i*3]-B[i*3]), Math.abs(A[i*3+1]-B[i*3+1]), Math.abs(A[i*3+2]-B[i*3+2]));
  if (d === 0) continue;
  if (d > 8) restaurados++;
  A[i*3] = B[i*3]; A[i*3+1] = B[i*3+1]; A[i*3+2] = B[i*3+2];
  tons.add(`${A[i*3]},${A[i*3+1]},${A[i*3+2]}`);
}
await sharp(A, { raw: { width: W, height: H, channels: 3 } }).png().toFile(sai);
console.log(`peça:        ${daPeca} px em ${quantos} componente(s) · maior ${maior} px`);
console.log(`ruído:       ${ruido} px descartado (< ${(PISO_SOLTA*100).toFixed(0)}% da maior)`);
console.log(`recolorido:  ${recolorido} px → matiz 180°`);
console.log(`restaurado:  ${restaurados} px (${tons.size} tons da base) · franja ${FRANJA_U} u = ${folga} px`);
console.log(`saída:       ${sai}`);
