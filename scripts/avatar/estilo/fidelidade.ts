/**
 * QUANTO O CABELO RENDERIZADO SE AFASTA DA ARTE — o número que não existia.
 *
 * Escrito como diagnóstico no Bloco I do plano de 2026-08-03 e promovido a **gate**
 * no Bloco C do plano do traço fiel. A diferença entre as duas coisas é o
 * `exitCode`: antes ele imprimia e saía verde sempre, e um número que nunca reprova
 * é um número que ninguém lê.
 *
 * ---------------------------------------------------------------------------
 * UMA RÉGUA, DUAS IMAGENS — a invariante 3 da skill `avatar-regua`
 * ---------------------------------------------------------------------------
 *
 * O PNG de origem e o composto renderizado passam pela **mesma** `amostrar()` de
 * `tracar-cabelo.ts` e pelos **mesmos** âncoras de tronco (`yCorte` e `utilY1`,
 * cegos ao cabelo). Se cada lado usasse a sua régua, a diferença medida seria a
 * diferença entre as réguas.
 *
 * Por isso este arquivo não reimplementa nada: ele importa `tracarArquivo()`, que
 * devolve a mesma peça que o traçador imprime. Duas montagens divergiriam, e o
 * número mediria a divergência entre elas em vez da distância à arte.
 *
 * ---------------------------------------------------------------------------
 * A COMPRESSÃO É DESCONTADA. O LEVANTE NÃO EXISTE MAIS.
 * ---------------------------------------------------------------------------
 *
 * A versão paramétrica descontava o **levante** de `liberarORosto()` — na Domada
 * foram 51,3 unidades — porque era uma translação deliberada que não tem nada a ver
 * com fidelidade de forma. O traçador não sobe mais a peça (ver `tracar()`), então
 * não há levante a descontar.
 *
 * O que sobrou de transformação deliberada é a **compressão no teto**: o `viewBox`
 * acaba 39 unidades acima da cabeça, e a arte não sabe disso. A máscara da arte entra
 * comprimida **pelo mesmo `k`** que o traçador aplicou — a inversa exata, célula a
 * célula. Sem isso, uma peça alta apareceria reprovando pelo encolhimento que a
 * própria régua fez nela, o que é medir a régua e não o traço.
 *
 * ---------------------------------------------------------------------------
 * SÃO DOIS NÚMEROS E ELES RESPONDEM PERGUNTAS DIFERENTES
 * ---------------------------------------------------------------------------
 *
 * **IoU e desvio de borda (aqui)** medem a ponta a ponta: decimação, mais o clip do
 * crânio, mais os lóbulos que o orçamento descartou, mais o fato de o boneco do
 * gerador não ser o boneco do `geometria.ts`. Há um **piso** que nenhuma decimação
 * remove, e é por isso que o primeiro run imprime esse piso em voz alta em vez de o
 * limiar ser afrouxado até passar.
 *
 * **O desvio da curva contra a varredura densa (`tracar-cabelo.ts`)** mede só a
 * decimação, e é ele que responde a "quantos pontos?". Confundir os dois seria a
 * mesma armadilha que o Bloco 1d pagou quatro vezes: régua que responde à pergunta
 * errada devolve número plausível.
 *
 * ---------------------------------------------------------------------------
 * COMO RODAR
 * ---------------------------------------------------------------------------
 *
 *   npm run avatar:fidelidade                    # os gates, contra a arte padrão
 *   npm run avatar:fidelidade -- <png>           # contra outra arte
 *   npm run avatar:fidelidade -- --inverter      # R10: o paramétrico TEM de reprovar
 *   npm run avatar:fidelidade -- --folha [png]   # a folha de contato para o olho
 */

import { mkdirSync, writeFileSync } from "fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CABELOS, type Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { CAIXA_CABECA, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import type { Bitmap } from "./medir";
import {
  ALTURA,
  CABELO_TEAL,
  type Mapa,
  amostrar,
  ancoras,
  ancorasDoViewBox,
  cru,
  mapa,
  rasterizar,
  tracarArquivo,
} from "./tracar-cabelo";

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-fidelidade.png`;
const ARTE_PADRAO = `${DIAG}/gerado/curto-espetada.png`;

/** Células por unidade do `viewBox`. 2 é a resolução do próprio raster da régua. */
const S = 2;

const GX = VIEWBOX.w * S;
const GY = VIEWBOX.h * S;

/** Unidade do `viewBox` → pixel no tamanho do ranking. 700 / 56. */
const PX56 = 12.5;

/** Meio traço: o limiar do gate 1, e o mesmo do resto da régua. */
const MEIO_TRACO = 6;

/**
 * O TETO DO GATE 2, em % das colunas com massa.
 *
 * Coluna com massa **só na arte** é massa que o modelo de dados não representou — e
 * até o Bloco A ela tinha um nome: a cortina, que não cabia em `pontos` nem em
 * `extensoes`. Medida na folha HSHC93, ela segurava ~220 unidades de desvio sozinha.
 *
 * 2% porque a borda do crânio nunca casa exatamente entre os dois bonecos: sobram
 * uma ou duas colunas de cada lado, e exigir zero seria exigir que o boneco do
 * gerador fosse o do `geometria.ts`. Acima disso é massa de verdade faltando.
 */
const TETO_SO_NA_ARTE = 0.02;

/** Os quatro tamanhos da folha. 56 é o do ranking e é o que manda (regra 8 da §7). */
const TAMANHOS = [56, 100, 200, 425] as const;

interface Perfilada {
  massa: Uint8Array;
  /** Por coluna da grade: a célula de cabelo mais alta e a mais baixa, ou `null`. */
  topo: (number | null)[];
  base: (number | null)[];
  celulas: number;
  /** Células descartadas por não serem do componente do cabelo, em % do total. */
  descartadas: number;
}

/**
 * ATÉ ONDE UM COMPONENTE DE TEAL PRECISA SUBIR PARA SER CABELO.
 *
 * Dois traços acima do queixo. A gola do uniforme do gerador — que é teal, porque a
 * cor instrumental vale para o boneco inteiro — não chega lá; a touca, a cortina e
 * qualquer lóbulo chegam com folga de centenas de unidades.
 */
const ALCANCE_DE_CABELO = CAIXA_CABECA.y1 - 2 * MEIO_TRACO * 2;

/**
 * SÓ O QUE ALCANÇA A CABEÇA ENTRA — e as duas regras mais simples falharam antes.
 *
 * **Todo o teal** era a primeira, e o corte no pescoço não bastou: a gola do
 * uniforme do gerador sobe acima da linha do pescoço, a máscara da arte a pegava e a
 * do render não (o composto de fidelidade não veste uniforme). A borda de baixo saía
 * com 52,8 u de desvio médio e 229 de máximo — um número que não tem nada a ver com
 * cabelo e que reprovaria qualquer traço.
 *
 * **O maior componente** era a segunda, e ela derrubou 23,1% do render: todo lóbulo
 * vai com `atras: true`, e entre ele e a touca clipada passa o **traço do crânio**,
 * que tem 12 unidades e não é teal. A peça que a arte tem inteira chega ao render
 * partida em duas por construção — e ficar com a maior metade é jogar fora
 * justamente o volume que o Bloco 2a.4 existiu para produzir.
 *
 * O que separa cabelo de gola não é tamanho nem conexidade: é **altura**. Fica todo
 * componente que alcance a cabeça; o que só vive abaixo do queixo é tronco. O
 * descartado é contado e impresso, nunca engolido — e um cabelo que passe do queixo
 * (uma trança longa) vai aparecer aqui como descarte, com o número na tela.
 */
function soOCabelo(massa: Uint8Array): { massa: Uint8Array; descartadas: number } {
  const visto = new Uint8Array(massa.length);
  const saida = new Uint8Array(massa.length);
  let total = 0;
  let mantidas = 0;

  for (let i = 0; i < massa.length; i++) {
    if (!massa[i] || visto[i]) continue;
    const fila = [i];
    const meus: number[] = [];
    visto[i] = 1;
    let alcanca = false;
    while (fila.length) {
      const p = fila.pop()!;
      meus.push(p);
      const x = p % GX;
      const y = (p / GX) | 0;
      if (y / S <= ALCANCE_DE_CABELO) alcanca = true;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
        const q = ny * GX + nx;
        if (massa[q] && !visto[q]) {
          visto[q] = 1;
          fila.push(q);
        }
      }
    }
    total += meus.length;
    if (!alcanca) continue;
    mantidas += meus.length;
    for (const p of meus) saida[p] = 1;
  }
  return { massa: saida, descartadas: total ? (100 * (total - mantidas)) / total : 0 };
}

/**
 * A MASSA DE CABELO NO ESPAÇO DO `viewBox` — a mesma conta para as duas imagens.
 *
 * `descomprimir` leva uma altura do espaço COMPRIMIDO (que é onde o render vive) de
 * volta ao espaço da arte crua. Só o PNG de origem o recebe; o render já nasce
 * comprimido.
 *
 * O corte no pescoço é o mesmo de `perfil()`: abaixo dele não há cabelo em modelo
 * nenhum, e o que houver ali é tronco. Sem o corte, a gola do uniforme do gerador
 * entraria na máscara de um lado e não do outro.
 *
 * ---------------------------------------------------------------------------
 * O MAPEAMENTO É INVERSO — DA GRADE PARA O PIXEL, E A PRIMEIRA VERSÃO ERA DIRETA
 * ---------------------------------------------------------------------------
 *
 * Varrer o pixel e carimbar a célula **fura a máscara** quando a imagem é menor que
 * a grade, e as duas imagens têm tamanhos diferentes: o PNG do gerador é 1024×1024 e
 * o raster do composto é 1000×1400. Medida a escala, 1 pixel da arte vale 1,66
 * célula em cada eixo — 2,76 células de área —, então o carimbo direto deixava ~64%
 * das células internas vazias. O primeiro número que saiu foi **IoU 25,2%**, e a
 * causa não era o traço: era a régua.
 *
 * E o defeito é do tipo que este projeto já pagou — ele passa despercebido porque
 * devolve um número plausível, e porque penaliza **só um dos dois lados** (o
 * composto rasteriza 1:1 com a grade e sai cheio).
 *
 * Perguntar, para cada célula, "que pixel está aqui?" não tem esse buraco: toda
 * célula recebe uma resposta, e supersamplear a arte é o comportamento certo.
 */
function massaEmUnidades(
  b: Bitmap,
  m: Mapa,
  yPescoco: number,
  descomprimir: (uy: number) => number = (uy) => uy,
): Perfilada {
  const bruta = new Uint8Array(GX * GY);
  const ate = Math.min(b.h, yPescoco);

  // `paraX`/`paraY` ao contrário. Uma linha cada, e são as mesmas constantes —
  // inverter a conta não é reescrever a régua.
  const dePx = (ux: number) => (ux - m.eu0) / m.kx + m.ex0;
  const deY = (uy: number) => (uy - m.tu0) / m.ky + m.ty0;

  for (let gy = 0; gy < GY; gy++) {
    const py = Math.round(deY(descomprimir(gy / S)));
    if (py < 0 || py >= ate) continue;
    for (let gx = 0; gx < GX; gx++) {
      const px = Math.round(dePx(gx / S));
      if (px < 0 || px >= b.w) continue;
      if (amostrar(b, px, py).eCabelo) bruta[gy * GX + gx] = 1;
    }
  }

  const { massa, descartadas } = soOCabelo(bruta);
  const topo: (number | null)[] = new Array(GX).fill(null);
  const base: (number | null)[] = new Array(GX).fill(null);
  let celulas = 0;
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      if (!massa[gy * GX + gx]) continue;
      celulas++;
      if (topo[gx] === null || gy < topo[gx]!) topo[gx] = gy;
      if (base[gx] === null || gy > base[gx]!) base[gx] = gy;
    }
  }
  return { massa, topo, base, celulas, descartadas };
}

interface Desvio {
  max: number;
  medio: number;
  /** Colunas em que só UMA das duas tem massa — presença, não desvio. */
  soNaArte: number;
  soNoRender: number;
  colunasComuns: number;
}

/**
 * O DESVIO É POR COLUNA, e não distância entre bordas quaisquer.
 *
 * A alternativa óbvia — Hausdorff entre os contornos das duas máscaras — mede a
 * coisa errada aqui: o cabelo renderizado é **cortado pelo `clip-path` do crânio**,
 * então a borda dele inclui um trecho que é a silhueta da cabeça, e não uma borda de
 * cabelo. Cada ponto desse trecho acharia o vizinho mais próximo longe demais, e o
 * máximo passaria a medir o clip.
 *
 * Coluna a coluna, o que se compara é **a mesma grandeza que a régua extrai**: a
 * borda de baixo (a franja) e a de cima (o topo dos lóbulos). E colunas em que só um
 * lado tem massa não viram desvio infinito — viram contagem, que é o gate 2, porque
 * ausência de massa é um defeito de outra natureza que média nenhuma resume.
 */
function desvio(a: (number | null)[], b: (number | null)[]): Desvio {
  let max = 0;
  let soma = 0;
  let n = 0;
  let soNaArte = 0;
  let soNoRender = 0;
  for (let x = 0; x < GX; x++) {
    if (a[x] === null && b[x] === null) continue;
    if (a[x] === null) {
      soNoRender++;
      continue;
    }
    if (b[x] === null) {
      soNaArte++;
      continue;
    }
    const d = Math.abs(a[x]! - b[x]!) / S;
    max = Math.max(max, d);
    soma += d;
    n++;
  }
  return { max, medio: n ? soma / n : 0, soNaArte, soNoRender, colunasComuns: n };
}

const u = (v: number) => `${v.toFixed(1)} u (${(v / PX56).toFixed(2)} px)`;

interface Medicao {
  iou: number;
  base: Desvio;
  topo: Desvio;
  soNaArte: number;
  celulasArte: number;
  celulasRender: number;
  descartadas: { arte: number; render: number };
}

/** A comparação de UMA peça contra UMA arte. `k` é a compressão que a peça sofreu. */
async function comparar(png: string, peca: Cabelo, k: number): Promise<Medicao> {
  const { vb } = await ancorasDoViewBox();
  const bmp = await cru(png);
  const aArte = ancoras(bmp);
  const mArte = mapa(aArte, vb);

  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: peca, ns: "fid" });
  const bmpRender = await rasterizar(svg, ALTURA);
  const aRender = ancoras(bmpRender);
  const mRender = mapa(aRender, vb);

  const Y0 = CAIXA_CABECA.y0;
  const descomprimir = (uy: number) => (uy >= Y0 || k >= 1 ? uy : Y0 - (Y0 - uy) / k);

  const arte = massaEmUnidades(bmp, mArte, aArte.yPescoco, descomprimir);
  const render = massaEmUnidades(bmpRender, mRender, aRender.yPescoco);

  let inter = 0;
  let uniao = 0;
  for (let i = 0; i < arte.massa.length; i++) {
    const s = arte.massa[i] + render.massa[i];
    if (s === 2) inter++;
    if (s > 0) uniao++;
  }

  const base = desvio(arte.base, render.base);
  const topo = desvio(arte.topo, render.topo);
  const comMassa = base.colunasComuns + base.soNaArte + base.soNoRender;

  return {
    iou: (100 * inter) / Math.max(1, uniao),
    base,
    topo,
    soNaArte: comMassa ? base.soNaArte / comMassa : 0,
    celulasArte: arte.celulas,
    celulasRender: render.celulas,
    descartadas: { arte: arte.descartadas, render: render.descartadas },
  };
}

/**
 * O PISO É MEDIDO A CADA RODADA, E O GATE 1 É RELATIVO A ELE.
 *
 * O plano previa ancorar o limiar em "piso + margem, registrado no §2a.5". A
 * medição mostrou que registrar um número seria pior do que medi-lo: rodado na
 * `curto-espetada`, o laço **denso** — 1 193 pontos, decimação desligada — dá 27,6 u
 * na borda de baixo contra os 27,3 da peça entregue de 64 pontos. **A decimação
 * custa 0,3 unidade.** Os 27 restantes não respondem a N nem a critério: são o
 * boneco do gerador não ser o do `geometria.ts` mais o clip do crânio comendo massa
 * que a arte tem.
 *
 * Um piso registrado à mão valeria para uma arte só, e a próxima arte teria outro —
 * a régua passaria a medir a distância àquela constante em vez da distância à
 * referência. Medindo o piso na mesma rodada, o gate pergunta o que devia perguntar:
 * **o traço custou mais que meio traço acima do que ele não controla?**
 *
 * É a mesma escolha que o `PISO_DISTINCAO` de 5% documenta pelo lado contrário: lá,
 * derivar o limiar do par mais parecido seria calibrar o gate pelo desenho que ele
 * julga. Aqui o piso não é um desenho, é o erro comum aos dois lados da comparação —
 * derivá-lo é subtrair o que já se sabe, e não é circular.
 */
function limiar(piso: number): number {
  return piso + MEIO_TRACO;
}

function imprimir(rotulo: string, med: Medicao, piso?: Medicao): string[] {
  console.log(`\n${rotulo}`);
  console.log(
    `  arte ${med.celulasArte} células · render ${med.celulasRender} células ` +
      `(1 célula = ${(1 / S).toFixed(1)} u)`,
  );
  console.log(
    `  teal fora do componente do cabelo, descartado: arte ` +
      `${med.descartadas.arte.toFixed(1)}% · render ${med.descartadas.render.toFixed(1)}%` +
      (med.descartadas.arte > 20 ? "   ← a gola do uniforme do gerador" : ""),
  );
  console.log(`  IoU da massa de cabelo ....... ${med.iou.toFixed(2)}%   (informativo, não gate)`);
  console.log(`  borda de BAIXO (a franja)    máx ${u(med.base.max)}   médio ${u(med.base.medio)}`);
  console.log(`  borda de CIMA  (os lóbulos)  máx ${u(med.topo.max)}   médio ${u(med.topo.medio)}`);
  console.log(
    `  colunas com massa em UM lado só: só na arte ${med.base.soNaArte} ` +
      `(${(100 * med.soNaArte).toFixed(1)}%) · só no render ${med.base.soNoRender}`,
  );

  /**
   * O GATE É SOBRE O MÉDIO, E O MÁXIMO VAI IMPRESSO AO LADO.
   *
   * A amarra escrita em `amarras.md` diz meio traço **por curva**, e diz com razão
   * que média entre curvas esconde a curva que errou — por isso franja e lóbulos são
   * julgadas separadas, cada uma com o seu número.
   *
   * Dentro de uma curva, porém, o que gateia é o médio: o máximo ponta a ponta é
   * dominado por uma ou duas colunas na beirada da silhueta, onde o clip do crânio
   * corta a massa da arte em cheio. Gatear no máximo seria gatear no clip.
   */
  const falhas: string[] = [];
  if (!piso) return falhas;
  for (const [nome, d, p] of [
    ["borda de baixo", med.base, piso.base],
    ["borda de cima", med.topo, piso.topo],
  ] as const) {
    const teto = limiar(p.medio);
    console.log(
      `  gate 1 · ${nome.padEnd(14)} ${d.medio.toFixed(1)} u contra ${teto.toFixed(1)} ` +
        `(piso ${p.medio.toFixed(1)} + meio traço ${MEIO_TRACO})` +
        (d.medio > teto ? "   ✗" : "   ✓"),
    );
    if (d.medio > teto) {
      falhas.push(`gate 1 · ${nome}: ${d.medio.toFixed(1)} u > ${teto.toFixed(1)}`);
    }
  }
  const reprovaGate2 = med.soNaArte > TETO_SO_NA_ARTE;
  console.log(
    `  gate 2 · massa só na arte ${(100 * med.soNaArte).toFixed(1)}% contra ` +
      `${100 * TETO_SO_NA_ARTE}%${reprovaGate2 ? "   ✗" : "   ✓"}`,
  );
  if (reprovaGate2) {
    falhas.push(
      `gate 2 · massa só na arte: ${(100 * med.soNaArte).toFixed(1)}% > ${100 * TETO_SO_NA_ARTE}%`,
    );
  }
  return falhas;
}

/**
 * A PEÇA SEM DECIMAÇÃO — o laço denso, que mede o piso e não é entregável.
 *
 * Mil e duzentos pontos de controle não cabem em orçamento nenhum. Ela existe para o
 * gate 1 saber de quanto do desvio o traço é responsável. Ver `limiar()`.
 */
const pecaDensa = (t: Awaited<ReturnType<typeof tracarArquivo>>["tracado"]): Cabelo => ({
  id: "curto",
  nome: "densa",
  massa: t.denso.massa,
  ...(t.denso.clara.length ? { clara: t.denso.clara } : {}),
  ...(t.peca.extensoes ? { extensoes: t.peca.extensoes } : {}),
});

/**
 * O RECORTE DA ARTE NO RETÂNGULO DO `viewBox` — o que torna a folha honesta.
 *
 * O PNG do gerador é quadrado e o `viewBox` é 500×700: mostrá-lo inteiro ao lado dos
 * renders compararia dois enquadramentos, não dois desenhos.
 *
 * DOIS PIPELINES, e não um: numa mesma cadeia o sharp resolve `extract` ANTES de
 * `extend`, então o recorte cairia na imagem original — que é justamente a que não
 * contém o retângulo inteiro. O erro que isso dá é `bad extract area`, e ele é
 * enganoso: as coordenadas estão certas, a imagem é que ainda não foi ampliada.
 */
async function recortarNoViewBox(png: string, m: Mapa): Promise<string> {
  const PAD = 600;
  const dePx = (ux: number) => Math.round((ux - m.eu0) / m.kx + m.ex0);
  const deY = (uy: number) => Math.round((uy - m.tu0) / m.ky + m.ty0);

  const comMargem = await sharp(png)
    .flatten({ background: "#FFFFFF" })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: "#FFFFFF" })
    .png()
    .toBuffer();

  const buf = await sharp(comMargem)
    .extract({
      left: dePx(0) + PAD,
      top: deY(0) + PAD,
      width: dePx(VIEWBOX.w) - dePx(0),
      height: deY(VIEWBOX.h) - deY(0),
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Seis caracteres que só existem dentro do PNG. Mesma função de `variantes.ts`. */
function gerarSelo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
}

interface Coluna {
  nome: string;
  legenda: string;
  img?: string;
  svg?: string;
  svgReal?: string;
  rodape: string;
}

/**
 * A FOLHA DE ANTES-E-DEPOIS — duas colunas, quatro tamanhos, um selo.
 *
 * `avatar:variantes` **não serve para esta rodada**, e reprovaria com motivo: ele
 * exige três variantes e mede DIVERGÊNCIA entre elas. Aqui há uma arte só e a
 * pergunta é o contrário — não "estes três desenhos são diferentes?" mas "este traço
 * se parece com a arte?".
 *
 * As duas em TEAL, que é a cor instrumental que o pedido ao gerador exige: a pergunta
 * é de forma, e cor diferente entre as colunas faria o olho comparar cor. A última
 * linha repete a peça **na paleta de verdade a 56 px**, que é onde o gate mede e onde
 * o Doug julga.
 *
 * O selo de seis caracteres não é impresso no terminal: ele prova que a imagem foi
 * aberta, e o relatório da crítica começa citando ele — Fase 4 da skill
 * `avatar-desenho`.
 */
async function folha(png: string) {
  mkdirSync(DIAG, { recursive: true });
  const { tracado, mapa: m } = await tracarArquivo(png);
  const peca = tracado.peca;

  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: peca, ns: "ft" });
  const svgReal = compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: peca, ns: "rt" });
  const formas = (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
  const bytes = Buffer.byteLength(svgReal, "utf-8");
  const piorDesvio = Math.max(...tracado.desvio.map((d) => d.tratada));

  const colunas: Coluna[] = [
    {
      nome: "A arte de origem",
      legenda: "o PNG do gerador, recortado no retângulo do viewBox pelos âncoras de tronco",
      img: await recortarNoViewBox(png, m),
      rodape: png.split(/[\\/]/).pop() ?? png,
    },
    {
      nome: "O traço fiel",
      legenda:
        `massa como laço fechado, linha de centro do preto · massa ${tracado.n.massa.n} pts · ` +
        `clara ${tracado.n.clara.n} pts · ${tracado.lobos.length} lóbulo(s)`,
      svg,
      svgReal,
      rodape: `${formas} formas · ${bytes} B · desvio máx ${piorDesvio.toFixed(1)} u`,
    },
  ];

  const selo = gerarSelo();
  const larg = (h: number) => Math.round((h * VIEWBOX.w) / VIEWBOX.h);
  const em = (s: string, h: number) => s.replace("<svg ", `<svg width="${larg(h)}" height="${h}" `);
  const fig = (rot: string, dentro: string) =>
    `<figure style="margin:0;text-align:center">${dentro}` +
    `<figcaption style="font:10px system-ui;color:#777;margin-top:4px">${rot}</figcaption></figure>`;

  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();
    const html = colunas
      .map((c) => {
        const corpo = TAMANHOS.map((t) =>
          fig(
            `${t} px${t === 56 ? " · o ranking" : ""}`,
            c.svg
              ? em(c.svg, t)
              : `<img src="${c.img}" width="${larg(t)}" height="${t}" style="display:block">`,
          ),
        ).join("");
        const real = c.svgReal
          ? `<div style="border-top:1px dashed #ddd;padding-top:10px;margin-top:2px">` +
            fig("56 px · paleta de verdade", em(c.svgReal, 56)) +
            `</div>`
          : "";
        return (
          `<section style="flex:0 0 auto;padding:0 18px;border-right:1px solid #eee">` +
          `<h2 style="font:600 13px system-ui;margin:0 0 2px">${c.nome}</h2>` +
          `<p style="font:11px system-ui;color:#888;margin:0 0 12px;max-width:260px">${c.legenda}</p>` +
          `<div style="display:flex;align-items:flex-end;gap:14px">${corpo}</div>` +
          real +
          `<p style="font:11px ui-monospace,monospace;color:#555;margin:10px 0 0">${c.rodape}</p>` +
          `</section>`
        );
      })
      .join("");

    await pg.setContent(
      `<body style="margin:0;background:#FFF;display:inline-block">` +
        `<div style="display:flex;align-items:flex-start;padding:20px 0">${html}</div>` +
        `<p style="font:10px ui-monospace,monospace;color:#BBB;margin:0 0 8px 18px">${selo}</p>` +
        `</body>`,
    );
    const caixa = await pg.locator("body").boundingBox();
    const buf = await pg.screenshot({
      clip: { x: 0, y: 0, width: Math.ceil(caixa!.width), height: Math.ceil(caixa!.height) },
    });
    writeFileSync(FOLHA, buf);
  } finally {
    await nav.close();
  }

  // O MESMO schema de `public/dev/variantes.json` — é o contrato que a rota
  // `/dev/avatar-variantes` lê, e trocá-lo por causa de uma folha nova quebraria a
  // rota sem nenhum ganho.
  mkdirSync("public/dev", { recursive: true });
  writeFileSync(
    "public/dev/variantes.json",
    JSON.stringify(
      {
        selo,
        variantes: [
          { nome: "O traço fiel", eixo: "fidelidade contra a arte de origem", formas, bytes, svg: svgReal },
        ],
      },
      null,
      2,
    ),
  );

  console.log(`\nselo ${selo}`);
  console.log(FOLHA);
  console.log(`/dev/avatar-variantes  (public/dev/variantes.json)`);
}

async function main() {
  const args = process.argv.slice(2);
  const inverter = args.includes("--inverter");
  const querFolha = args.includes("--folha");
  const querPiso = args.includes("--piso");
  const png = args.find((a) => !a.startsWith("--")) ?? ARTE_PADRAO;

  if (querFolha) return folha(png);

  const { tracado } = await tracarArquivo(png);

  if (querPiso) {
    /**
     * O PISO, MEDIDO E NÃO ESTIMADO — a mesma peça com a decimação desligada.
     *
     * O número ponta a ponta soma duas causas de natureza diferente: a **decimação**,
     * que responde a mais pontos, e o **piso**, que não responde a nada — o boneco do
     * gerador não é o do `geometria.ts`, e o clip do crânio come massa que a arte tem.
     * Enquanto os dois estiverem somados, um limiar reprovando não diz se a resposta
     * é subir N ou re-gerar a arte.
     *
     * Rodar a mesma comparação com o laço DENSO separa os dois: o que sobrar ali é
     * piso por definição, porque não há redução nenhuma para culpar. A diferença
     * entre este número e o da peça entregue é o custo da decimação, e só esse
     * pedaço tem conserto barato.
     */
    console.log(`PISO — ${png}`);
    console.log(
      `a mesma peça com a decimação DESLIGADA: massa ${tracado.denso.massa.length} pontos, ` +
        `clara ${tracado.denso.clara.length}.\nNão é entregável — é o quanto do desvio ` +
        `NÃO é culpa da redução.`,
    );
    imprimir("o laço denso (o piso):", await comparar(png, pecaDensa(tracado), tracado.teto.k));
    imprimir("a peça entregue, para comparar:", await comparar(png, tracado.peca, tracado.teto.k));
    console.log(
      `\nA diferença entre os dois é o custo da DECIMAÇÃO. O que os dois têm em comum\n` +
        `é o piso, e o piso é o número que vai para o §2a.5 do doc 15 se ele impedir\n` +
        `meio traço — nunca o limiar afrouxado até passar.`,
    );
    return;
  }

  if (inverter) {
    /**
     * R10 — A INVERSÃO, e sem ela o verde não vale nada.
     *
     * O gate é alimentado com o `curto` PARAMÉTRICO do catálogo: 8 pontos
     * desenhados à mão, sem cortina, sem lóbulo, com silhueta idêntica à do boneco
     * careca. Ele é o desenho que a folha HSHC93 reprovou, e ele **tem** de sair
     * vermelho. Se sair verde, o que está errado é o gate, não a peça.
     */
    console.log(`INVERSÃO (R10) — o \`curto\` PARAMÉTRICO do catálogo contra ${png}`);
    // O piso é da ARTE, não da peça: ele sai do laço denso traçado da mesma imagem,
    // e é contra ele que o paramétrico é julgado. Um piso próprio do paramétrico não
    // existe — ele não foi medido de imagem nenhuma, que é o ponto todo.
    const piso = await comparar(png, pecaDensa(tracado), tracado.teto.k);
    const falhas = imprimir(
      "o paramétrico, que TEM de reprovar:",
      await comparar(png, CABELOS.curto, 1),
      piso,
    );
    if (falhas.length) {
      console.log(`\n✓ vermelho, como tem de ser — ${falhas.length} reprovação(ões):`);
      for (const f of falhas) console.log(`  · ${f}`);
      return;
    }
    console.error(
      `\n✗ O PARAMÉTRICO PASSOU. O gate não distingue o desenho reprovado do traço\n` +
        `  medido, e enquanto isso for verdade nenhum verde daqui significa nada.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`FIDELIDADE — ${png}`);
  console.log(
    `compressão do teto descontada: k = ${tracado.teto.k.toFixed(4)} ` +
      `(pico ${tracado.teto.antes.toFixed(1)} → ${tracado.teto.depois.toFixed(1)})`,
  );
  const piso = await comparar(png, pecaDensa(tracado), tracado.teto.k);
  console.log(
    `\npiso medido nesta arte (o mesmo laço com a decimação DESLIGADA, ` +
      `${tracado.denso.massa.length} pontos):` +
      `\n  borda de baixo ${piso.base.medio.toFixed(1)} u · borda de cima ` +
      `${piso.topo.medio.toFixed(1)} u   ← o que o traço NÃO controla`,
  );
  const falhas = imprimir("o traçado:", await comparar(png, tracado.peca, tracado.teto.k), piso);

  if (!falhas.length) {
    console.log(`\n✓ os dois gates passam.`);
    return;
  }
  console.error(`\n✗ ${falhas.length} reprovação(ões):`);
  for (const f of falhas) console.error(`  · ${f}`);
  console.error(
    `\nO limiar NÃO se afrouxa aqui, e ele já está ancorado no piso MEDIDO desta arte\n` +
      `(ver \`limiar()\`). Passar deste teto é o traço custando mais que meio traço\n` +
      `acima do que ele não controla — e aí a resposta é o traço ou a arte, nunca o\n` +
      `número. \`--piso\` mostra a separação; \`--inverter\` prova que o teto ainda\n` +
      `reprova o desenho que o Doug já reprovou.`,
  );
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
