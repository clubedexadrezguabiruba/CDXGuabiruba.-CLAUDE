/**
 * A FIGURINHA TAPOU O ROSTO? — a régua que faltava, e ela nasce de uma reprovação
 * do Doug repetida duas vezes na mesma família de peça.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA EXISTE: DOIS COQUES MORRERAM E NENHUM GATE VIU
 * ---------------------------------------------------------------------------
 *
 * Em 2026-08-24, duas artes de coque duplo chegaram com **todos os gates verdes** —
 * Gate −1 aprovada com 0 ladrilho em rosto e corpo, `arte:traco` 0 px, `arte:borda`
 * 0 px de cinza — e as duas foram reprovadas pelo Doug **no render**, com a mesma
 * frase: *"onde indiquei deve ser o rosto do avatar"*. Uma mancha de cabelo na
 * bochecha.
 *
 * A arte estava certa nas duas: ali ela tem pele lisa. Quem inventa a mancha é o
 * passo **2c da esteira, a "figurinha"** (`barba-para-formas.ts`), que preenche todo
 * furo FECHADO que não tenha olho ou boca dentro. A regra é decisão do Doug de
 * 2026-08-22 (*"a barba é colada como figurinha, nada atrás dela pode ser visto"*) e
 * ela está certa — o que faltava era medir quando o furo deixa de ser artefato de
 * topologia e vira vão que a artista desenhou.
 *
 * Nenhum gate podia pegar isso, e o motivo é estrutural: **todos eles medem a ARTE
 * contra a BASE**, e a arte não tem defeito nenhum. O defeito nasce depois, na
 * máscara. Esta é a primeira régua da rota que mede a MÁSCARA FINAL contra a arte.
 *
 * ⚠️ Ela não conserta nada e não toca na esteira. A tentativa de consertar o passo 2c
 * foi feita em 2026-08-24, mudou a geometria de 15 peças, derrubou 18 testes e o Doug
 * mandou reverter: *"a esteira estava perfeita. agora que vc tentou consertar uma,
 * mexeu em 3 que estavam aprovadas. deixe como estava."* A saída que ficou é pelo
 * DESENHO — vão que desemboca na borda de fora do cabelo nunca é preenchido —, e o
 * papel desta régua é dizer isso ao Doug **antes** de ele ter de olhar.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELA MEDE, E POR QUE NÃO PRECISA DE LIMIAR INVENTADO
 * ---------------------------------------------------------------------------
 *
 * Depois do `restaurar-peca.ts`, fora da peça o pixel é **idêntico** ao da base.
 * Então "a máscara cobre, e a arte não tem peça aqui" é `mascara[i] && arte == base`
 * — a mesma identidade que a quarta saída garante, não um limiar escolhido a dedo.
 *
 * Sob o furo, três classes, e só uma é defeito:
 *
 *  - **base PRETA** (lum < 60) → furo falso, nasceu de preto-sobre-preto. É o caso
 *    que FUNDOU a regra da figurinha: os 4 maiores furos da `barba-trancada` têm
 *    100 · 100 · 99 · 100% de base preta dentro. Preencher é o certo;
 *  - **base FUNDO** (o bege do quadro) → vão do desenho fora do boneco;
 *  - **base PELE** → **o defeito**. É cabelo tapando rosto.
 *
 * ---------------------------------------------------------------------------
 * O EIXO É A LARGURA, NÃO A ÁREA — e a área foi tentada primeiro
 * ---------------------------------------------------------------------------
 *
 * A primeira formulação foi *"quantos pixels de cabelo caem sobre pele"*, e ela
 * **não separa nada**: a `cachos-anjo`, aprovada e em produção, mede 5 060 px sobre
 * pele — mais que os 3 390 px da arte que o Doug reprovou. Um piso por área
 * reprovaria peça aprovada, que é o erro do G28: medir o piso nas peças em vez de no
 * boneco.
 *
 * O eixo que separa sai da PROMESSA da figurinha. Ela existe para tapar fio que a
 * máscara perdeu por cair sobre traço preto, e **fio tem a espessura do traço**.
 * Então a pergunta certa é *que disco cabe dentro do furo*, e o piso é o traço do
 * boneco. Medido em 2026-08-24, sobre as 17 artes promovidas do dia:
 *
 * | alvo | maior bloco sobre pele | **largura inscrita** |
 * |---|---|---|
 * | `chanel` · `longo-unilateral` · `coque-simples` · `tigela-franja` · `maria-chiquinha` | 0 px | **0** |
 * | as outras 12 promovidas | 2 a 172 px | **2,0 a 6,7 px** |
 * | `cachos-anjo` — a pior das aprovadas | 640 px | **15,3 px** = 1,06× o traço |
 * | `duplo-coque-real`, reprovado pelo Doug no render | 3 160 px | acima do piso |
 *
 * **Os números baixos das 17 são consequência desta régua, não a origem dela.** Se
 * as 17 medissem 40 px, o piso continuaria `2 × TRACO × ESCALA` e as 17 estariam
 * reprovadas.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ O PONTO CEGO, DECLARADO
 * ---------------------------------------------------------------------------
 *
 * **Ela não julga ONDE o furo está.** O maior furo da `cachos-anjo` (640 px) fica no
 * alto da testa, dentro da massa de cabelo, e lê como cabelo; o da arte reprovada
 * ficava na bochecha e lia como mancha. A régua separa os dois pela LARGURA e acerta
 * nestes dois casos — mas um furo estreito e comprido sobre a bochecha passaria. Se
 * isso aparecer, o conserto é acrescentar região, não afrouxar o piso.
 */

import { tmpdir } from "os";
import { join } from "path";

import sharp from "sharp";

import {
  ESCALA,
  FUNDO,
  PNG_BASE,
  naCapsulaDoOlho,
  naEspinhaDaBoca,
  paraUnidade,
} from "./base";
import { construirPecaTonal, type SlotTonal } from "./barba-para-formas";
import { ARTES_PROMOVIDAS } from "./promovidas";
import { TRACO } from "../../../src/lib/avatar/estilo/geometria";

/** "A arte não tem peça aqui": ela é igual à base, com folga de reencode. */
const IGUAL_A_BASE = 6;

/** Abaixo disto o pixel da base é traço, e o furo sobre ele é falso. */
const LUM_PRETA = 60;

/** Distância de canal até o bege do quadro para o pixel contar como FUNDO. */
const PERTO_DO_FUNDO = 10;

/**
 * O PISO, em pixels de largura inscrita: **duas espessuras de traço**.
 *
 * O furo que a figurinha se compromete a tapar é o rastro de um fio perdido, e o fio
 * tem `TRACO` (12 u × 1,2 px/u = 14,4 px). Dois traços perdidos lado a lado dão o
 * dobro, e é onde o benefício da dúvida acaba: acima disso o furo é vão desenhado, e
 * tapá-lo é desenhar por cima do rosto.
 */
export const PISO_LARGURA = 2 * TRACO * ESCALA;

const FUNDO_RGB = [
  parseInt(FUNDO.slice(1, 3), 16),
  parseInt(FUNDO.slice(3, 5), 16),
  parseInt(FUNDO.slice(5, 7), 16),
];

export interface FigurinhaSobrePele {
  /** Pixels que a máscara cobre e em que a arte não tem peça nenhuma. */
  furo: number;
  /** Desses, os que têm PELE da base embaixo. */
  sobrePele: number;
  /** Em quantos furos eles se partem. */
  ilhas: number;
  /** O maior furo, contado só na pele — é ele que decide. */
  maiorBloco: number;
  /** O disco que cabe dentro do maior furo, em pixels. É a régua. */
  largura: number;
  /** Onde o maior furo está, em unidades do `viewBox`. */
  onde: { x0: number; x1: number; y0: number; y1: number } | null;
  /** `largura >= PISO_LARGURA`. */
  reprova: boolean;
}

/**
 * O disco que cabe dentro do conjunto, por chanfro 3-4 em duas varreduras.
 *
 * A borda da imagem conta como fora — um furo que encosta na moldura já não é furo.
 */
const distancias = (dentro: Uint8Array, W: number, H: number, px: Iterable<number>): Int32Array => {
  const GRANDE = 1 << 28;
  const D = new Int32Array(W * H);
  for (const i of px) D[i] = GRANDE;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!dentro[i]) continue;
      let m = D[i];
      if (x > 0) m = Math.min(m, (dentro[i - 1] ? D[i - 1] : 0) + 3);
      if (y > 0) m = Math.min(m, (dentro[i - W] ? D[i - W] : 0) + 3);
      if (y > 0 && x > 0) m = Math.min(m, (dentro[i - W - 1] ? D[i - W - 1] : 0) + 4);
      if (y > 0 && x < W - 1) m = Math.min(m, (dentro[i - W + 1] ? D[i - W + 1] : 0) + 4);
      if (x === 0 || y === 0) m = Math.min(m, 3);
      D[i] = m;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!dentro[i]) continue;
      let m = D[i];
      if (x < W - 1) m = Math.min(m, (dentro[i + 1] ? D[i + 1] : 0) + 3);
      if (y < H - 1) m = Math.min(m, (dentro[i + W] ? D[i + W] : 0) + 3);
      if (y < H - 1 && x < W - 1) m = Math.min(m, (dentro[i + W + 1] ? D[i + W + 1] : 0) + 4);
      if (y < H - 1 && x > 0) m = Math.min(m, (dentro[i + W - 1] ? D[i + W - 1] : 0) + 4);
      if (x === W - 1 || y === H - 1) m = Math.min(m, 3);
      D[i] = m;
    }
  return D;
};

/** O disco que cabe dentro do conjunto, em pixels: duas vezes a maior distância. */
const larguraInscrita = (dentro: Uint8Array, W: number, H: number, px: number[]): number => {
  const D = distancias(dentro, W, H, px);
  let mx = 0;
  for (const i of px) if (D[i] > mx) mx = D[i];
  return (mx / 3) * 2;
};

export const figurinhaSobrePele = async (
  arte: string,
  slot: SlotTonal,
): Promise<FigurinhaSobrePele> => {
  const p = await construirPecaTonal(arte, slot);
  const { data: A, info } = await sharp(arte)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const B = await sharp(PNG_BASE).resize(W, H).removeAlpha().raw().toBuffer();

  const furo = new Uint8Array(W * H);
  const pele = new Uint8Array(W * H);
  let nFuro = 0;
  let nPele = 0;
  for (let i = 0; i < W * H; i++) {
    if (!p.mascara[i]) continue;
    const j = i * 3;
    const dif = Math.max(
      Math.abs(A[j] - B[j]),
      Math.abs(A[j + 1] - B[j + 1]),
      Math.abs(A[j + 2] - B[j + 2]),
    );
    if (dif > IGUAL_A_BASE) continue;
    furo[i] = 1;
    nFuro++;
    const dF = Math.max(
      Math.abs(B[j] - FUNDO_RGB[0]),
      Math.abs(B[j + 1] - FUNDO_RGB[1]),
      Math.abs(B[j + 2] - FUNDO_RGB[2]),
    );
    if (dF <= PERTO_DO_FUNDO) continue;
    if (0.299 * B[j] + 0.587 * B[j + 1] + 0.114 * B[j + 2] < LUM_PRETA) continue;
    pele[i] = 1;
    nPele++;
  }

  const visto = new Uint8Array(W * H);
  let ilhas = 0;
  let maior: number[] = [];
  let maiorBloco = 0;
  for (let i0 = 0; i0 < W * H; i0++) {
    if (!furo[i0] || visto[i0]) continue;
    visto[i0] = 1;
    ilhas++;
    const pilha = [i0];
    const componente: number[] = [];
    while (pilha.length) {
      const i = pilha.pop()!;
      componente.push(i);
      const x = i % W;
      const y = (i / W) | 0;
      const vizinhos = [
        x > 0 ? i - 1 : -1,
        x < W - 1 ? i + 1 : -1,
        y > 0 ? i - W : -1,
        y < H - 1 ? i + W : -1,
      ];
      for (const q of vizinhos)
        if (q >= 0 && furo[q] && !visto[q]) {
          visto[q] = 1;
          pilha.push(q);
        }
    }
    let n = 0;
    for (const i of componente) if (pele[i]) n++;
    if (n > maiorBloco) {
      maiorBloco = n;
      maior = componente;
    }
  }

  // A largura sai do bloco de PELE, não do furo inteiro: a parte do furo que cai
  // sobre o traço preto é o artefato legítimo, e incluí-la engordaria a medida sem
  // motivo — é justamente o pedaço que a figurinha DEVE tapar.
  const soPele = maior.filter((i) => pele[i]);
  const dentro = new Uint8Array(W * H);
  for (const i of soPele) dentro[i] = 1;
  const largura = soPele.length ? larguraInscrita(dentro, W, H, soPele) : 0;

  let onde: FigurinhaSobrePele["onde"] = null;
  if (soPele.length) {
    const xs = soPele.map((i) => i % W);
    const ys = soPele.map((i) => (i / W) | 0);
    const a = paraUnidade(Math.min(...xs), Math.min(...ys));
    const b = paraUnidade(Math.max(...xs), Math.max(...ys));
    onde = { x0: a.x, x1: b.x, y0: a.y, y1: b.y };
  }

  return {
    furo: nFuro,
    sobrePele: nPele,
    ilhas,
    maiorBloco,
    largura,
    onde,
    reprova: largura >= PISO_LARGURA,
  };
};

// ---------------------------------------------------------------------------
// O CONTROLE — o defeito, montado sobre arte APROVADA
// ---------------------------------------------------------------------------

/**
 * A arte do controle, e ela é a mesma de `traco-intacto` e `cor-da-borda`.
 *
 * O `chanel` serve porque a massa dele desce ao lado do rosto até u y 385, então há
 * cabelo à altura da bochecha para o vão se fechar contra — que é a forma exata do
 * defeito.
 */
const ARTE_DO_CONTROLE = "scripts/avatar/arte/chanel.png";

/**
 * Fecha um vão de cabelo sobre a bochecha, do tamanho pedido.
 *
 * Desenha um ANEL da cor da peça (o ciano instrumental que a arte já tem) centrado na
 * bochecha, mais uma barra ligando o anel à massa de cabelo mais próxima — sem a
 * barra o anel viraria componente solto e a esteira o descartaria como ruído, e o
 * controle mediria zero por vacuidade em vez de por conserto.
 *
 * O miolo do anel continua sendo a PELE da base: é o furo fechado que a figurinha vai
 * preencher, e é o que esta régua tem de ver.
 *
 * Devolve um CAMINHO, não bytes: `construirPecaTonal` recebe caminho, e alargar a
 * assinatura dela seria mexer na esteira que está aprovando arte — o arquivo vai para
 * o temporário do sistema, que some sozinho.
 */
export const comBochechaFechada = async (arte: string, raioInterno: number): Promise<string> => {
  const { data, info } = await sharp(arte).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const B = await sharp(PNG_BASE).resize(W, H).removeAlpha().raw().toBuffer();

  const raioExterno = raioInterno + 12;
  const ePeca = (i: number) => {
    const j = i * 3;
    const dif = Math.max(
      Math.abs(data[j] - B[j]),
      Math.abs(data[j + 1] - B[j + 1]),
      Math.abs(data[j + 2] - B[j + 2]),
    );
    return dif > 24 && 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2] > 90;
  };
  // Pele VISÍVEL: a base tem pele ali e a arte não pôs peça em cima. É onde o anel
  // tem de caber, senão o miolo dele não seria `arte == base` e o furo não existiria.
  const peleVisivel = (i: number) => {
    const j = i * 3;
    const dF = Math.max(
      Math.abs(B[j] - FUNDO_RGB[0]),
      Math.abs(B[j + 1] - FUNDO_RGB[1]),
      Math.abs(B[j + 2] - FUNDO_RGB[2]),
    );
    if (dF <= PERTO_DO_FUNDO) return false;
    if (0.299 * B[j] + 0.587 * B[j + 1] + 0.114 * B[j + 2] < LUM_PRETA) return false;
    const dif = Math.max(
      Math.abs(data[j] - B[j]),
      Math.abs(data[j + 1] - B[j + 1]),
      Math.abs(data[j + 2] - B[j + 2]),
    );
    return dif <= IGUAL_A_BASE;
  };

  // O CENTRO SAI DE MEDIÇÃO, não de coordenada escrita à mão: é o ponto da metade
  // esquerda do rosto mais longe de qualquer borda — de fio de cabelo, do contorno do
  // boneco, do fundo, e das cápsulas de feição, que o recorte do passo 2 protege e que
  // rasgariam o anel (a primeira versão deste controle caiu dentro do olho esquerdo).
  const livre = new Uint8Array(W * H);
  const candidatos: number[] = [];
  for (let y = 330; y <= 560; y++)
    for (let x = 1; x < W / 2; x++) {
      const i = y * W + x;
      if (!peleVisivel(i)) continue;
      const p = paraUnidade(x, y);
      if (naCapsulaDoOlho(p.x, p.y) || naEspinhaDaBoca(p.x, p.y)) continue;
      livre[i] = 1;
      candidatos.push(i);
    }
  const D = distancias(livre, W, H, candidatos);
  let centro = -1;
  let folga = 0;
  for (const i of candidatos)
    if (D[i] > folga) {
      folga = D[i];
      centro = i;
    }
  // `folga` está em passos de chanfro (3 por pixel ortogonal).
  const folgaPx = folga / 3;
  if (centro < 0 || folgaPx < raioExterno + 3)
    throw new Error(
      `o controle não achou bochecha livre para um anel de raio ${raioExterno} px em ` +
        `${arte} — a maior folga mede ${folgaPx.toFixed(1)} px`,
    );

  const cx = centro % W;
  const cy = (centro / W) | 0;
  // A cor do anel é a que a artista usou na peça, colhida do pixel de peça mais
  // próximo à esquerda — pintar de uma cor inventada mudaria o tom, não a topologia.
  const cor = [0, 0, 0];
  let xPeca = -1;
  for (let x = cx - raioExterno; x >= 0; x--) {
    const i = cy * W + x;
    if (ePeca(i)) {
      xPeca = x;
      cor[0] = data[i * 3];
      cor[1] = data[i * 3 + 1];
      cor[2] = data[i * 3 + 2];
      break;
    }
  }
  if (xPeca < 0) throw new Error(`o controle não achou cabelo à esquerda da bochecha em ${arte}`);

  const pinta = (i: number) => {
    const j = i * 3;
    data[j] = cor[0];
    data[j + 1] = cor[1];
    data[j + 2] = cor[2];
  };
  for (let y = cy - raioExterno - 2; y <= cy + raioExterno + 2; y++)
    for (let x = cx - raioExterno - 2; x <= cx + raioExterno + 2; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= raioExterno && d > raioInterno) pinta(y * W + x);
    }
  // A barra que prende o anel ao cabelo — sem ela o anel vira componente solto e a
  // esteira o descarta como ruído, e o controle mediria zero por vacuidade.
  for (let y = cy - 6; y <= cy + 6; y++)
    for (let x = xPeca; x <= cx - raioInterno; x++) if (x >= 0 && x < W) pinta(y * W + x);

  const saida = join(tmpdir(), `figurinha-controle-r${raioInterno}.png`);
  await sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toFile(saida);
  return saida;
};

// ---------------------------------------------------------------------------
// O CLI
// ---------------------------------------------------------------------------

const u = (n: number) => n.toFixed(0).padStart(4);

const linha = (nome: string, r: FigurinhaSobrePele): string =>
  `  ${nome.padEnd(30)} furo ${String(r.furo).padStart(5)} px   ` +
  `sobre pele ${String(r.sobrePele).padStart(5)} px em ${String(r.ilhas).padStart(3)} ilha(s)   ` +
  `maior ${String(r.maiorBloco).padStart(5)} px   ` +
  `largura ${r.largura.toFixed(1).padStart(5)} px   ` +
  `${r.reprova ? "✗ REPROVA" : "·        "}   ` +
  `${r.onde ? `u x ${u(r.onde.x0)}→${u(r.onde.x1)} · y ${u(r.onde.y0)}→${u(r.onde.y1)}` : "—"}`;

const slotDe = (arte: string): SlotTonal =>
  /[\\/](rosto-|barba-|bigode-|cavanhaque-)/.test(arte) ? "rosto" : "cabelo";

async function principal(): Promise<void> {
  const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  console.log(
    `\nA FIGURINHA TAPOU O ROSTO? — piso ${PISO_LARGURA.toFixed(1)} px de largura inscrita\n` +
      `                             (2 × TRACO ${TRACO} u × ESCALA ${ESCALA} px/u)\n` +
      `                             furo = a máscara cobre e a arte tem a BASE ali\n`,
  );

  // O CONTROLE vem primeiro, sempre. Se ele não reprovar, o resto da tela não quer
  // dizer nada. Dois raios: 16 px é o menor vão que esta régua se compromete a pegar.
  let controleOk = true;
  for (const raio of [16, 24]) {
    const c = await figurinhaSobrePele(await comBochechaFechada(ARTE_DO_CONTROLE, raio), "cabelo");
    console.log(linha(`CONTROLE chanel + bochecha r${raio}`, c));
    if (!c.reprova) controleOk = false;
  }
  // O contra-controle: a mesma arte sem o vão. Ela tem de PASSAR, senão a régua está
  // reprovando o chanel e não o defeito.
  const limpo = await figurinhaSobrePele(ARTE_DO_CONTROLE, "cabelo");
  console.log(linha("contra-controle: chanel limpo", limpo) + "   ← esperado PASSAR");
  if (!controleOk || limpo.reprova) {
    console.error(
      `\n  ✗ O CONTROLE NÃO SE COMPORTOU, e isso invalida a rodada inteira.\n` +
        `    A régua fechou um vão de cabelo sobre a bochecha de uma arte aprovada e\n` +
        `    não o viu (ou reprovou a arte limpa). Não confie em nenhum "·" desta tela.`,
    );
    process.exit(1);
  }
  console.log("");

  const lista = alvos.length ? alvos : ARTES_PROMOVIDAS;
  const ruins: string[] = [];
  for (const a of lista) {
    const r = await figurinhaSobrePele(a, slotDe(a));
    console.log(linha(a.split(/[\\/]/).pop() ?? a, r));
    if (r.reprova)
      ruins.push(`${a}: furo de ${r.largura.toFixed(1)} px de largura ≥ ${PISO_LARGURA.toFixed(1)}`);
  }

  if (ruins.length) {
    console.error(
      `\n  ✗ ${ruins.length} arte(s) com a figurinha tapando o rosto:\n` +
        ruins.map((r) => `    ${r}`).join("\n") +
        `\n\n    A ARTE ESTÁ CERTA — ali ela tem pele. Quem tapa é o passo 2c, e o\n` +
        `    conserto NÃO é mexer nele (foi tentado, moveu 15 peças, e o Doug mandou\n` +
        `    reverter). É pelo DESENHO: o vão entre a mecha e o rosto tem de desembocar\n` +
        `    na borda de FORA do cabelo. Furo aberto nunca é preenchido.`,
    );
    process.exit(1);
  }
  console.log(
    `\n  · ${lista.length} arte(s) sem rosto tapado, e o controle reprovou nos dois raios.`,
  );
}

// Só roda a linha de comando quando ESTE arquivo é o ponto de entrada — sem a guarda,
// importar `figurinhaSobrePele` de uma sonda dispara a rodada inteira e o
// `process.exit` mata o programa que importou.
if ((process.argv[1] ?? "").split("\\").join("/").endsWith("figurinha-sobre-pele.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
