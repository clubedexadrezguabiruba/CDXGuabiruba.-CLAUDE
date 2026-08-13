/**
 * O reparo do achado G20 — a tira de pele no decote do `traje-gambesao`.
 *
 * ## Por que este arquivo existe
 *
 * Ele é o único registro de procedência de uma arte que **não veio do gerador**.
 * A `traje-gambesao.png` que está no disco é a arte que o Gemini entregou MENOS
 * 3 151 pixels que este programa trocou, em 2026-08-13, com a aprovação do Doug na
 * folha. Sem ele, o PNG seria um arquivo que ninguém sabe explicar — e a rota de
 * arte inteira existe para que não haja arquivo assim.
 *
 * A saída do Gemini original continua no git, no commit anterior a este. Reverter é
 * `git checkout <commit>~1 -- scripts/avatar/arte/traje-gambesao.png`.
 *
 * ## O defeito, medido
 *
 * O gerador desenhou um PESCOÇO, e este boneco não tem pescoço. Foi **um gesto só**,
 * não dois defeitos: ele furou o traço do queixo e pintou a pele descendo pelo buraco.
 *
 *   - o traço do queixo, em y 502: a base tem corrida contínua de preto de x 363 a
 *     696; a arte tinha 362–432 e 615–698 — **vazio de 182 px**;
 *   - a pele: **2 006 px** de RGB (182,128,88) ± 40 abaixo de y 505, bbox
 *     x 487–596 × y 506–647, reaparecendo pelos vãos entre os travessões do laço.
 *
 * Na peça montada isso virava, a 56 px, um ponto pêssego isolado no pescoço — a
 * única pele abaixo da cabeça em toda a folha. Ver `docs/achados.md`, G20.
 *
 * ## As três operações, e por que são três
 *
 * `Y_QUEIXO` (515,84 px no canvas de 1024) separa o problema em duas metades de
 * natureza diferente, porque é ali que `noCampoDoTraje` começa a valer:
 *
 *   **A) y 502–515, ACIMA do queixo → RESTAURAR A BASE.** Aqui não se desenha nada:
 *   copia-se o pixel da base oficial de volta. Esta faixa está fora do campo do
 *   traje, então não muda um pixel da peça renderizada — muda o que o Gate −1 mede
 *   (a região `permitida` caiu de 7 ladrilhos para 1, e o "não explicado" de 2 867
 *   para 1 636 px).
 *
 *   **B) o V, dentro do campo → PREENCHER COM O PANO DA PRÓPRIA ARTE.** A cunha de
 *   pele sob o queixo é uma componente conexa. Cada pixel dela recebe a interpolação
 *   entre o pano teal mais próximo à esquerda e à direita **na mesma linha** — que é
 *   a sombra de contato que o gerador desenhou em toda a largura, menos ali.
 *
 *   **C) o canal do laço.** A barra escura do cordão em y 538–542 corta a componente
 *   do V, então a pele de baixo é OUTRA componente e o passo B não a alcança. Ela
 *   entra por régua de posição + luz, e as duas fronteiras são MEDIDAS:
 *     - `x 512–550` — os ilhoses ficam em x 486–504 e 558–572, fora daqui;
 *     - `R ≥ 100` — o histograma dos quentes em y 550–615 tem vale: miolo do cordão
 *       em R 32–95 (223 px), pele em R ≥ 144 (313 px), franja de antialias no meio.
 *       A barra horizontal do laço mede R máx 101 e sobrevive inteira.
 *
 * ## O que a primeira tentativa errou, e está aqui para não se repetir
 *
 * A versão 1 preencheu o canal com **balde de tinta** — uma cor medida, constante.
 * Deixou 417 px de tom único dentro de um pano que tem 212 tons na área equivalente,
 * e uma franja tan de 1 px contornando o remendo (o piso era R ≥ 160, alto demais
 * para pegar o antialias). O remendo se anunciava. A leitura da arte renderizada
 * pegou as duas coisas; o passo C passou a usar a mesma interpolação do B e o piso
 * desceu para 100. Resultado medido: **725 tons distintos** nos 1 262 px trocados.
 *
 * ## Uso
 *
 *   npx tsx scripts/avatar/arte/reparo-g20.ts            # só mede, não escreve
 *   npx tsx scripts/avatar/arte/reparo-g20.ts --aplicar  # escreve o .reparado.png
 *
 * Rodar de novo sobre a arte JÁ REPARADA é inócuo e não idempotente de propósito:
 * os passos B e C não acham mais pele, e o passo A não acha mais divergência. Se
 * algum deles voltar a contar acima de zero, a arte no disco não é a que foi
 * aprovada.
 */
import sharp from "sharp";
import { Y_QUEIXO, paraPx } from "./base.js";
import { CENTRO_X } from "../../../src/lib/avatar/estilo/geometria.js";

const RAIZ = "scripts/avatar/arte/";
const APLICAR = process.argv.includes("--aplicar");

/** O queixo em pixels do canvas — a fronteira entre os passos A e B/C. */
const Y_QUEIXO_PX = paraPx(CENTRO_X, Y_QUEIXO).y;

type Imagem = { d: Buffer; w: number; h: number; c: number };
type Cor = [number, number, number, number];

async function ler(arquivo: string): Promise<Imagem> {
  const { data, info } = await sharp(RAIZ + arquivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { d: data, w: info.width, h: info.height, c: info.channels };
}

const idx = (im: Imagem, x: number, y: number) => (y * im.w + x) * im.c;
const em = (im: Imagem, x: number, y: number): Cor => {
  const i = idx(im, x, y);
  return [im.d[i], im.d[i + 1], im.d[i + 2], im.d[i + 3]];
};
const luz = (p: Cor) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];

/** A pele que o gerador pintou — RGB (182,128,88) com folga de 40 por canal. */
const PELE: readonly [number, number, number] = [182, 128, 88];
const TOL = 40;
const ehPele = (p: Cor) =>
  p[3] > 128 &&
  Math.abs(p[0] - PELE[0]) <= TOL &&
  Math.abs(p[1] - PELE[1]) <= TOL &&
  Math.abs(p[2] - PELE[2]) <= TOL;

/**
 * Pano é teal COM luz. O piso de luminância existe para pular o antialias do
 * contorno escuro do decote, que também é levemente teal e ficaria a 2 px do V —
 * sem ele o preenchimento sai quase preto (medido: (0,33,35)). 55 fica abaixo da
 * sombra de contato (platô 108 menos 42 = 66) e acima da moldura.
 */
const ehPano = (p: Cor) => p[3] > 128 && p[2] > p[0] + 20 && p[1] > p[0] + 20 && luz(p) >= 55;

/** A faixa do traço do queixo na base, e o alcance lateral dele. */
const BANDA = { y0: 502, y1: 515, x0: 340, x1: 720 } as const;
/** O canal do laço — ver o cabeçalho para a origem de cada número. */
const CANAL = { x0: 512, x1: 550, y0: 530, y1: 615, pisoR: 100 } as const;

async function principal() {
  const arte = await ler("traje-gambesao.png");
  const base = await ler("base-oficial.png");
  const saida = Buffer.from(arte.d);

  // A) restaurar o traço do queixo -----------------------------------------
  let restaurados = 0;
  for (let y = BANDA.y0; y <= BANDA.y1; y++) {
    for (let x = BANDA.x0; x <= BANDA.x1; x++) {
      const a = em(arte, x, y);
      const b = em(base, x, y);
      if (!((luz(b) < 60 && luz(a) >= 60) || ehPele(a))) continue;
      const i = idx(arte, x, y);
      for (let k = 0; k < arte.c; k++) saida[i + k] = base.d[i + k];
      restaurados++;
    }
  }
  console.log(`A) traço do queixo restaurado da base: ${restaurados} px (y ${BANDA.y0}–${BANDA.y1})`);

  // B) a componente conexa do V --------------------------------------------
  const visto = new Uint8Array(arte.w * arte.h);
  const fila: Array<[number, number]> = [];
  for (let y = 516; y <= 522; y++) {
    for (let x = 470; x <= 570; x++) {
      if (ehPele(em(arte, x, y)) && !visto[y * arte.w + x]) {
        visto[y * arte.w + x] = 1;
        fila.push([x, y]);
      }
    }
  }
  const sementes = fila.length;
  const alvo: Array<[number, number]> = [];
  let yMax = 0;
  const VIZINHOS = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
  ] as const;
  while (fila.length) {
    const [x, y] = fila.pop()!;
    alvo.push([x, y]);
    if (y > yMax) yMax = y;
    for (const [dx, dy] of VIZINHOS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= arte.w || ny >= arte.h) continue;
      if (ny <= Y_QUEIXO_PX) continue; // acima do queixo é a operação A
      if (visto[ny * arte.w + nx]) continue;
      if (!ehPele(em(arte, nx, ny))) continue;
      visto[ny * arte.w + nx] = 1;
      fila.push([nx, ny]);
    }
  }
  console.log(
    `B) componente do V: ${alvo.length} px a partir de ${sementes} sementes, desce até y=${yMax}`,
  );
  if (yMax >= 543) {
    console.log(`   ⚠️  a componente passou de y=543 — pode ter vazado para o cordão. PARE e olhe.`);
  }

  // C) o canal do laço ------------------------------------------------------
  let noCanal = 0;
  for (let y = CANAL.y0; y <= CANAL.y1; y++) {
    for (let x = CANAL.x0; x <= CANAL.x1; x++) {
      if (visto[y * arte.w + x]) continue;
      const p = em(arte, x, y);
      if (p[3] <= 128) continue;
      if (!(p[0] > p[2] + 25 && p[0] >= CANAL.pisoR)) continue;
      visto[y * arte.w + x] = 1;
      alvo.push([x, y]);
      noCanal++;
    }
  }
  console.log(
    `C) canal do laço: +${noCanal} px quentes (R≥${CANAL.pisoR}) em ` +
      `x ${CANAL.x0}–${CANAL.x1} · y ${CANAL.y0}–${CANAL.y1}`,
  );

  // o preenchimento — interpolação do pano vizinho na própria linha ---------
  const porLinha = new Map<number, number[]>();
  for (const [x, y] of alvo) {
    const l = porLinha.get(y) ?? [];
    l.push(x);
    porLinha.set(y, l);
  }
  let preenchidos = 0;
  let semVizinho = 0;
  for (const [y, xs] of [...porLinha.entries()].sort((a, b) => a[0] - b[0])) {
    let esq: Cor | null = null;
    let xEsq = 0;
    for (let x = Math.min(...xs); x >= 300; x--) {
      const p = em(arte, x, y);
      if (ehPano(p)) { esq = p; xEsq = x; break; }
    }
    let dir: Cor | null = null;
    let xDir = 0;
    for (let x = Math.max(...xs); x <= 760; x++) {
      const p = em(arte, x, y);
      if (ehPano(p)) { dir = p; xDir = x; break; }
    }
    if (!esq && !dir) { semVizinho += xs.length; continue; }
    for (const x of xs) {
      const t = esq && dir ? (x - xEsq) / (xDir - xEsq) : esq ? 0 : 1;
      const a = (esq ?? dir)!;
      const b = (dir ?? esq)!;
      const i = idx(arte, x, y);
      for (let k = 0; k < 3; k++) saida[i + k] = Math.round(a[k] + (b[k] - a[k]) * t);
      saida[i + 3] = 255;
      preenchidos++;
    }
  }
  console.log(
    `   preenchidos: ${preenchidos} px` +
      (semVizinho ? `, SEM vizinho de pano: ${semVizinho} px` : ""),
  );

  const total = restaurados + preenchidos;
  const area = arte.w * arte.h;
  console.log(`\nTOTAL tocado: ${total} px de ${area} (${((total / area) * 100).toFixed(4)}%)`);

  if (!APLICAR) {
    console.log("\n(ensaio — nada foi escrito. --aplicar para gravar)");
    return;
  }
  const destino = `${RAIZ}traje-gambesao.reparado.png`;
  await sharp(saida, { raw: { width: arte.w, height: arte.h, channels: arte.c as 4 } })
    .png()
    .toFile(destino);
  console.log(`\nescrito: ${destino}`);
  console.log(`  para promover:  mv ${destino} ${RAIZ}traje-gambesao.png`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
