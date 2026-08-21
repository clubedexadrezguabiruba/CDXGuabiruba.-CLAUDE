/**
 * O TRAÇO DO BONECO SUMIU? — a régua que faltava na rota, e o achado **G30**.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA EXISTE: O GATE −1 APROVOU UMA ARTE COM O QUEIXO APAGADO
 * ---------------------------------------------------------------------------
 *
 * Em 2026-08-19 um passo de translação por programa apagou o contorno do queixo numa
 * faixa de 2 u de altura por 140 u de largura, colando franja clara por cima.
 * **O Gate −1 aprovou**: ele mede forma por ladrilhos de 16 px, e uma faixa de 2 u não
 * move ladrilho nenhum. Quem pegou foi o olho do Doug.
 *
 * O contorno da cabeça é da BASE, não da peça. Pixel que era preto na base e virou
 * **material claro** da própria base, sem a peça estar por cima, é o boneco sendo
 * apagado — e a rota não compensa, ela reprova.
 *
 * ---------------------------------------------------------------------------
 * TRÊS FORMULAÇÕES FALHARAM ANTES DESTA, E CADA UMA ENSINOU UMA COISA
 * ---------------------------------------------------------------------------
 *
 * **1. "conta o total de pixels apagados".** O total não separa nada: as três barbas
 * dão ~0 e os três cabelos estacionam em 12–27 px por antialiasing legítimo, com
 * qualquer raio de máscara. Um piso por total reprovaria três peças que estão em
 * produção. → **é a CONTIGUIDADE que importa**, não o total: antialiasing é poeira
 * (ilhas de 1–3 px), traço apagado é uma corrida (um componente longo).
 *
 * **2. "a máscara da peça é tudo que difere da base".** Apagar o contorno TAMBÉM
 * difere da base — o controle sintético foi marcado como "a peça está por cima" e
 * passou. → a máscara é o **MAIOR COMPONENTE CONEXO** das diferenças, que é o que a
 * esteira chama de peça (`barba-para-formas.ts`: *"a peça em 1 componente(s)"*).
 *
 * **3. "sumiu = deixou de ser preto (lum < 90)".** Reprovava a `entrada.png`, que
 * está em produção, com 60 px numa lasca de 1 px × 50 u na têmpora esquerda.
 * Diagnosticado pixel a pixel: ali a base tem lum 0 e a arte tem lum **70** — o
 * gerador redesenhou o traço em cinza escuro em vez de preto, e só a borda de
 * antialiasing (38 → 97) cruzou o limiar. Não é apagamento, é re-renderização. → o
 * limiar de "sumiu" é `LUM_APAGADO`, e ele sai dos **materiais claros da base**.
 *
 * ---------------------------------------------------------------------------
 * A SEPARAÇÃO, MEDIDA — e o controle é FIEL, não degenerado
 * ---------------------------------------------------------------------------
 *
 * | alvo | apagado | ilhas | **maior componente** |
 * |---|---|---|---|
 * | `barba-cheia` · `barba-cavanhaque` · `barba-bigode` | 0 | 0 | **0** |
 * | `chanel` · `entrada` · `entrada-2` | 0 | 0 | **0** |
 * | `chanel` + queixo apagado **1 u** | 338 | 1 | **338** |
 * | `chanel` + queixo apagado **2 u** | 507 | 1 | **507** |
 * | `chanel` + queixo apagado **4 u** | 845 | 1 | **845** |
 *
 * **O controle não é a base contra ela mesma** — esse é degenerado, porque sem peça
 * o apagamento VIRA o maior componente e qualquer máscara o engole. Ele é uma arte
 * **aprovada** com o apagamento por cima, que é a forma exata do defeito de
 * 2026-08-19.
 *
 * ---------------------------------------------------------------------------
 * O PISO SAI DO TRAÇO DO BONECO, NUNCA DAS PEÇAS — a lição do G28
 * ---------------------------------------------------------------------------
 *
 * `PEDIDO-BARBAS.md` já pagou esse preço: o piso de "30 u de pele abaixo da boca" foi
 * medido **na `barba-cheia`**, a peça que ele deveria julgar, e reprovou as três
 * `cavanhaque` — uma das quais o Doug aprovou a olho.
 *
 * Aqui os dois números saem do BONECO:
 *
 *  - `PISO_COMPONENTE` = `TRACO × ESCALA ÷ 2` = **8 px**, metade da espessura com que
 *    o contorno é rasterizado neste canvas (12 u × 1,2 px/u = 14,4 px);
 *  - `LUM_APAGADO` = **180**, abaixo dos três materiais claros da base — sombra de
 *    pele 189, pele 205, fundo 249 — e acima de qualquer traço re-renderizado
 *    (medidos 62 a 126 na `entrada.png`).
 *
 * **Os zeros das seis artes aprovadas são CONSEQUÊNCIA desta régua, não a origem
 * dela.** Se as seis medissem 40, o piso continuaria 8 e as seis estariam reprovadas.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ O PONTO CEGO, DECLARADO E MEDIDO
 * ---------------------------------------------------------------------------
 *
 * **Apagamento DEBAIXO da peça é invisível para esta régua, e isso é correto.**
 * Medido: `barba-cheia` com o queixo apagado em 1, 2 e 4 u dá **0** nas três — a
 * faixa cai dentro da máscara da barba, que legitimamente cobre o queixo ali. A
 * régua responde *"o traço sumiu ONDE a peça não está"*, e é o que ela promete no
 * nome. Quem cobre o queixo com uma barba pode apagá-lo à vontade, porque ninguém
 * vai vê-lo de qualquer jeito.
 */

import { readFileSync } from "fs";
import sharp from "sharp";

import { ESCALA, FUNDO, LADO, ORIGEM, PNG_BASE, paraUnidade } from "./base";
import { TRACO } from "../../../src/lib/avatar/estilo/geometria";

/** O mesmo limiar de "isto difere da base" que `barba-para-formas.ts` usa. */
export const NIVEL = 24;

/** Luminância abaixo da qual o pixel conta como traço do boneco. */
export const LUM_TRACO = 90;

/**
 * Luminância a partir da qual o traço não ficou mais claro — ele SUMIU.
 *
 * Sai dos materiais claros da base, não das peças: sombra de pele **189**, pele
 * **205**, fundo **249**. 180 fica abaixo dos três com folga, e acima de qualquer
 * traço que o gerador tenha redesenhado em cinza (62 a 126, medidos na `entrada.png`
 * — ver a formulação 3 no topo).
 */
const LUM_APAGADO = 180;

/**
 * Quanto a máscara da peça se dilata antes de julgar, em pixels.
 *
 * A fronteira da peça é onde o rasterizador mistura a tinta dela com o contorno de
 * baixo. Dois pixels é a franja de mistura de uma borda — varrido de 2 a 5 em
 * 2026-08-20, e acima de 2 nada muda em nenhuma das nove medições.
 */
export const RAIO_DA_MASCARA = 2;

/**
 * O PISO, em pixels por componente conexo. `TRACO` (12 u) × `ESCALA` (1,2 px/u) ÷ 2.
 */
export const PISO_COMPONENTE = Math.ceil((TRACO * ESCALA) / 2);

export interface TracoIntacto {
  /** Preto da base coberto pela peça — legítimo. */
  cobertoPelaPeca: number;
  /** Preto da base que virou material claro, fora da peça. */
  apagado: number;
  /** Em quantas ilhas ele se parte. */
  ilhas: number;
  /** O maior componente conexo — é ele que decide. */
  maior: number;
  /** Onde o maior componente está, em unidades do `viewBox`. */
  onde: { x0: number; x1: number; y0: number; y1: number } | null;
  /** `maior >= PISO_COMPONENTE`. */
  reprova: boolean;
}

export const cru = async (p: string | Buffer) =>
  sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

export const lum = (d: Buffer, i: number) => 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];

export function dilatar(m: Uint8Array, W: number, H: number, r: number): Uint8Array {
  let cur = m;
  for (let passo = 0; passo < r; passo++) {
    const nx = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (
          cur[i] ||
          (x > 0 && cur[i - 1]) ||
          (x < W - 1 && cur[i + 1]) ||
          (y > 0 && cur[i - W]) ||
          (y < H - 1 && cur[i + W])
        )
          nx[i] = 1;
      }
    cur = nx;
  }
  return cur;
}

/** Componentes conexos por 4-vizinhança, do maior para o menor. */
export function componentes(m: Uint8Array, W: number, H: number): number[][] {
  const n = W * H;
  const visto = new Uint8Array(n);
  const fila = new Int32Array(n);
  const saida: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (!m[s] || visto[s]) continue;
    let ini = 0;
    let fim = 0;
    fila[fim++] = s;
    visto[s] = 1;
    const ids: number[] = [];
    while (ini < fim) {
      const i = fila[ini++];
      ids.push(i);
      for (const j of [i - 1, i + 1, i - W, i + W])
        if (j >= 0 && j < n && m[j] && !visto[j]) {
          visto[j] = 1;
          fila[fim++] = j;
        }
    }
    saida.push(ids);
  }
  return saida.sort((a, b) => b.length - a.length);
}

/** Mede uma arte contra a base oficial. `arte` é caminho ou buffer já em memória. */
export async function tracoIntacto(arte: string | Buffer): Promise<TracoIntacto> {
  const { data: B } = await cru(PNG_BASE);
  const { data: A } = await cru(arte);
  const W = LADO;
  const H = LADO;
  const n = W * H;
  if (A.length !== n * 3) throw new Error(`a arte não tem ${LADO}² — esta rota pressupõe isso`);

  // 1. A MÁSCARA DA PEÇA = o MAIOR componente das diferenças, dilatado.
  //    Não é "tudo que difere": apagar o contorno também difere, e a formulação 2
  //    (ver o topo) engoliu o próprio controle por causa disso.
  const dif = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = Math.max(
      Math.abs(A[i * 3] - B[i * 3]),
      Math.abs(A[i * 3 + 1] - B[i * 3 + 1]),
      Math.abs(A[i * 3 + 2] - B[i * 3 + 2]),
    );
    if (d > NIVEL) dif[i] = 1;
  }
  const maiores = componentes(dif, W, H);
  const peca = new Uint8Array(n);
  for (const i of maiores[0] ?? []) peca[i] = 1;
  const mascara = dilatar(peca, W, H, RAIO_DA_MASCARA);

  // 2. O TRAÇO QUE SUMIU: era traço na base, virou material CLARO na arte, e a peça
  //    não está por cima.
  const apagadoM = new Uint8Array(n);
  let apagado = 0;
  let cobertoPelaPeca = 0;
  for (let i = 0; i < n; i++) {
    if (lum(B, i) >= LUM_TRACO) continue;
    if (mascara[i]) {
      cobertoPelaPeca++;
      continue;
    }
    if (lum(A, i) < LUM_APAGADO) continue;
    apagadoM[i] = 1;
    apagado++;
  }

  // 3. A CONTIGUIDADE decide: poeira é antialiasing, corrida é traço apagado.
  const ilhasA = componentes(apagadoM, W, H);
  const maior = ilhasA[0]?.length ?? 0;
  let onde: TracoIntacto["onde"] = null;
  if (ilhasA[0]) {
    const xs = ilhasA[0].map((i) => i % W);
    const ys = ilhasA[0].map((i) => (i / W) | 0);
    const a = paraUnidade(Math.min(...xs), Math.min(...ys));
    const b = paraUnidade(Math.max(...xs), Math.max(...ys));
    onde = { x0: a.x, x1: b.x, y0: a.y, y1: b.y };
  }

  return {
    cobertoPelaPeca,
    apagado,
    ilhas: ilhasA.length,
    maior,
    onde,
    reprova: maior >= PISO_COMPONENTE,
  };
}

/**
 * O CONTROLE — uma arte APROVADA com uma faixa do queixo apagada de propósito.
 *
 * Reproduz o defeito de 2026-08-19: faixa horizontal sobre o contorno do queixo
 * (u x 215→355 · y 343→345), pintada da cor do fundo.
 *
 * ⚠️ **A arte de partida importa, e é o que torna este controle honesto.** Um
 * controle feito sobre a base NUA é degenerado: sem peça, o apagamento vira o maior
 * componente das diferenças, a máscara o adota e a régua passa. Foi assim que a
 * segunda formulação desta régua se aprovou sozinha.
 */
export async function comQueixoApagado(arteBase: string, alturaU = 2): Promise<Buffer> {
  const { data, info } = await cru(readFileSync(arteBase));
  const emPx = (u: number, eixo: "x" | "y") => Math.round(u * ESCALA + ORIGEM[eixo]);
  const y0 = emPx(343, "y");
  const y1 = emPx(343 + alturaU, "y");
  const x0 = emPx(215, "x");
  const x1 = emPx(355, "x");
  const [fr, fg, fb] = [1, 3, 5].map((k) => parseInt(FUNDO.slice(k, k + 2), 16));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = (y * info.width + x) * 3;
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
    }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// A LINHA DE COMANDO
// ---------------------------------------------------------------------------

/**
 * As artes que a rota já promoveu SOBRE A BASE OFICIAL, e é sobre elas que o
 * `--check` roda.
 *
 * O traje está de fora por construção: ele é editado sobre `base-tronco-campo`,
 * outra base, e o Gate −1 dele protege a CABEÇA em vez do corpo. A régua vale igual
 * lá — o que muda é a base de comparação, e ela não é esta.
 */
const APROVADAS = [
  "scripts/avatar/arte/barba-trancada.png",
  "scripts/avatar/arte/chanel.png",
  "scripts/avatar/arte/entrada.png",
  "scripts/avatar/arte/entrada-2.png",
];

/** A arte sobre a qual o controle é construído. Cabelo, porque o queixo fica à vista. */
const ARTE_DO_CONTROLE = "scripts/avatar/arte/chanel.png";

const n1 = (v: number) => v.toFixed(0).padStart(5);

function linha(nome: string, r: TracoIntacto): string {
  const onde = r.onde
    ? `x ${r.onde.x0.toFixed(0)}→${r.onde.x1.toFixed(0)} · y ${r.onde.y0.toFixed(0)}→${r.onde.y1.toFixed(0)}`
    : "—";
  return (
    `  ${nome.padEnd(30)} coberto ${n1(r.cobertoPelaPeca)} px   ` +
    `apagado ${n1(r.apagado)} px em ${String(r.ilhas).padStart(2)} ilha(s)   ` +
    `maior ${n1(r.maior)} px   ${r.reprova ? "✗ REPROVA" : "·        "}   ${onde}`
  );
}

async function principal(): Promise<void> {
  const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  console.log(
    `TRAÇO INTACTO — piso ${PISO_COMPONENTE} px por componente ` +
      `(TRACO ${TRACO} u × ESCALA ${ESCALA} px/u ÷ 2)\n` +
      `                 "sumiu" a partir de lum ${LUM_APAGADO}, máscara dilatada ${RAIO_DA_MASCARA} px\n`,
  );

  // O CONTROLE vem primeiro, sempre. Se ele não reprovar, o resto da rodada não quer
  // dizer nada — é a régua que não está olhando. Duas alturas: 1 u é o menor
  // apagamento que esta régua se compromete a pegar.
  let controleOk = true;
  for (const altura of [1, 2]) {
    const c = await tracoIntacto(await comQueixoApagado(ARTE_DO_CONTROLE, altura));
    console.log(linha(`CONTROLE chanel + queixo ${altura}u`, c));
    if (!c.reprova) controleOk = false;
  }
  // O ponto cego, medido na mesma rodada e ANUNCIADO — para ninguém o descobrir
  // como surpresa no dia em que uma barba esconder um defeito.
  const cego = await tracoIntacto(await comQueixoApagado("scripts/avatar/arte/barba-trancada.png", 2));
  console.log(
    linha("ponto cego: barba + queixo 2u", cego) +
      "   ← esperado passar: a barba cobre o queixo",
  );
  if (!controleOk) {
    console.error(
      `\n  ✗ O CONTROLE PASSOU, e isso invalida a rodada inteira.\n` +
        `    A régua apagou ela mesma uma faixa do queixo sobre arte aprovada e não a\n` +
        `    viu. Não confie em nenhum "·" desta tela até isto reprovar.`,
    );
    process.exit(1);
  }
  console.log("");

  const lista = alvos.length ? alvos : APROVADAS;
  const ruins: string[] = [];
  for (const a of lista) {
    const r = await tracoIntacto(a);
    console.log(linha(a.split(/[\\/]/).pop() ?? a, r));
    if (r.reprova) ruins.push(`${a}: maior componente ${r.maior} px ≥ ${PISO_COMPONENTE}`);
  }

  if (ruins.length) {
    console.error(
      `\n  ✗ ${ruins.length} arte(s) com o traço do boneco apagado:\n` +
        ruins.map((r) => `    ${r}`).join("\n") +
        `\n\n    O contorno da cabeça é da BASE. Apagá-lo é redesenhar o boneco, e a rota\n` +
        `    não compensa — ela reprova. Ver o docstring deste arquivo (achado G30).`,
    );
    process.exit(1);
  }
  console.log(
    `\n  · ${lista.length} arte(s) com o traço do boneco inteiro, ` +
      `e o controle reprovou nas duas alturas.`,
  );
}

// Só roda a linha de comando quando ESTE arquivo é o ponto de entrada. Sem a guarda,
// importar `tracoIntacto` de uma sonda dispara a rodada inteira e o `process.exit`
// mata o programa que importou — custou uma medição.
if ((process.argv[1] ?? "").split("\\").join("/").endsWith("traco-intacto.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
