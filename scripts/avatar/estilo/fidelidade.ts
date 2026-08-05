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
 *   npm run avatar:fidelidade -- --inverter-folga # a franja sobre as sobrancelhas —
 *                                                 # o gate 3 TEM de reprovar
 *   npm run avatar:fidelidade -- --folha         # a folha de contato para o olho
 *   npm run avatar:fidelidade -- --folha cabelo/outro   # de outro alvo de fonte
 *
 * `--folha` recebe **alvo de fonte**, não PNG: ela compõe a peça IMPORTADA (o literal
 * de `peca.ts`), e não o traçado da rota antiga. Ver o docstring de `folha()`.
 */

import { mkdirSync, writeFileSync } from "fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  CABELOS,
  FOLGA_ROSTO,
  arcosDeTraco,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  pathCabelo,
  pathCabeloClaro,
  pathCabeloLinhas,
  type Cabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import {
  CAIXA_CABECA,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SOBRANCELHA,
  TRACO,
  VIEWBOX,
  bordasEm,
  pathCabeca,
} from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import type { Bitmap } from "./medir";
import {
  ALTURA,
  CABELO_TEAL,
  type Mapa,
  type Segmentacao,
  ancoras,
  ancorasDoViewBox,
  anisotropia,
  mapa,
  rasterizar,
  registroPelaCabeca,
  segmentarArquivo,
  segmentarPorMatiz,
  tracarArquivo,
} from "./tracar-cabelo";
import { ALTURA_SVG } from "./tracar-cabelo";
import { guiaChamada, lerFontePecaOuFalhar } from "./fonte-peca";
import { conferirLiteral, importarPeca } from "./importar-peca";
import type { OpcoesRota } from "./rotas/rota";

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
  seg: Segmentacao,
  m: Mapa,
  yPescoco: number,
  descomprimir: (uy: number) => number = (uy) => uy,
): Perfilada {
  const b = seg.bmp;
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
      if (seg.cabelo(px, py)) bruta[gy * GX + gx] = 1;
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

/** O topo do arco da sobrancelha, o mesmo dos dois lados da subtração do gate 3. */
const topoDaSobrancelha = (cyOlho: number) =>
  cyOlho - SOBRANCELHA.acimaDoOlho - SOBRANCELHA.espessura / 2 - SOBRANCELHA.sagita;

/**
 * A FOLGA SOBRE CADA SOBRANCELHA, LIDA DA MÁSCARA — a mesma conta nas duas imagens.
 *
 * É a conta de `folgaDoRosto()` (`cabelo.ts`), com as mesmas constantes, mas sobre a
 * grade em vez da poligonal: o gate 3 compara duas máscaras rasterizadas pela mesma
 * régua, e misturar espaço de polígono de um lado com raster do outro mediria a
 * diferença entre os dois espaços. `folgaDoRosto()` continua existindo, intacta,
 * para quem tem peça e não tem PNG.
 *
 * A sobrancelha NÃO é medida dentro do PNG: a canônica do `geometria.ts` entra dos
 * DOIS lados da subtração do gate 3, então o desvio do boneco do gerador cancela —
 * o mesmo argumento do `limiar()`, subtrair o erro comum não é circular.
 *
 * Dois detalhes que envenenariam o número:
 * - `base[gx]` é índice de célula; a célula cobre `[gy/S, (gy+1)/S)`. A borda de
 *   baixo real é `(base + 1) / S` — o viés de meia célula cancelaria na diferença,
 *   mas o número ABSOLUTO vai para o aviso e precisa ser honesto.
 * - a máscara termina na borda do teal, que é a linha de centro do contorno preto
 *   (`amostrar()` nunca vê o preto) — somar `TRACO/2` uma vez é o certo, nas duas.
 *
 * `Infinity` quando não há tinta na faixa daquela sobrancelha, como em
 * `folgaDoRosto`.
 *
 * ---------------------------------------------------------------------------
 * A BORDA É O FIM DO CORPO DA COLUNA, E AS DUAS RÉGUAS MAIS SIMPLES FALHARAM
 * ---------------------------------------------------------------------------
 *
 * **`base[gx]`, a célula mais baixa da coluna**, foi a primeira, e a cortina a
 * envenena: na máscara da ARTE ela cruza a faixa da sobrancelha e desce até y≈270,
 * o que dá folga −111 u; na do render, não. Veneno que entra de um lado só não
 * cancela na subtração, e a inversão de 40 u passava por baixo dele.
 *
 * **A primeira corrida a partir de `topo[gx]`** foi a segunda, e as espículas a
 * envenenam pelo outro lado: no render a coluna começa na ponta de uma espícula, a
 * corrida acaba no vale entre ela e o crânio, e a folga saía 115 u — o **mesmo
 * número com e sem a inversão**, que é a assinatura de uma régua medindo outra coisa.
 *
 * O que sobra é o **corpo**: a corrida contígua mais longa da coluna. Espícula é
 * corrida curta acima dele, cortina é corrida curta abaixo, e o fim do corpo é a
 * franja — que é justamente a borda que a folga do rosto sempre quis medir.
 */
function folgaNaGrade(p: Perfilada): { esq: number; dir: number } {
  /** O fim da corrida contígua mais longa da coluna, em unidades, ou `null`. */
  const fimDoCorpo = (gx: number): number | null => {
    let melhorFim: number | null = null;
    let melhorN = 0;
    let n = 0;
    for (let gy = 0; gy < GY; gy++) {
      if (p.massa[gy * GX + gx]) {
        n++;
        if (n > melhorN) {
          melhorN = n;
          melhorFim = gy;
        }
      } else {
        n = 0;
      }
    }
    return melhorFim === null ? null : (melhorFim + 1) / S;
  };

  const folga = (cx: number, cyOlho: number): number => {
    const topo = topoDaSobrancelha(cyOlho);
    const gx0 = Math.max(0, Math.ceil((cx - SOBRANCELHA.larg / 2) * S));
    const gx1 = Math.min(GX - 1, Math.floor((cx + SOBRANCELHA.larg / 2) * S));
    let baixo = -Infinity;
    for (let gx = gx0; gx <= gx1; gx++) {
      const fim = fimDoCorpo(gx);
      if (fim !== null) baixo = Math.max(baixo, fim);
    }
    if (baixo === -Infinity) return Infinity;
    return topo - (baixo + TRACO / 2);
  };
  return {
    esq: folga(OLHO_CX_ESQ, OLHO_CY_ESQ),
    dir: folga(OLHO_CX_DIR, OLHO_CY_DIR),
  };
}

interface Medicao {
  iou: number;
  base: Desvio;
  topo: Desvio;
  soNaArte: number;
  celulasArte: number;
  celulasRender: number;
  descartadas: { arte: number; render: number };
  /** O gate 3: a folga de testa nas DUAS imagens, cada uma da sua máscara. */
  folga: { arte: { esq: number; dir: number }; render: { esq: number; dir: number } };
  /**
   * As duas perfiladas cruas — só o `--onde` as usa.
   *
   * O relatório dos gates resume tudo em média e máximo, e média não tem lugar: ela
   * responde *quanto* e nunca *onde*. `--onde` precisa da coluna, então a coluna
   * sobe junto em vez de `comparar()` ser reimplementada ao lado dela — duas
   * montagens divergiriam, que é o defeito que o topo deste arquivo documenta.
   */
  perfis: { arte: Perfilada; render: Perfilada };
}

/**
 * A comparação de UMA peça contra UMA arte. `k` é a compressão que a peça sofreu.
 *
 * **O render nunca é segmentado por path, e isso não é economia.** O composto é
 * pintado com `CABELO_TEAL` chapado, e segmentá-lo por família de path exigiria
 * remontá-lo sem o `clip-path` do crânio — que é justamente uma das coisas que o
 * gate mede. Não existe SVG "do conversor" de um render. O lado do render fica em
 * matiz, sempre, e a invariante *uma régua, duas imagens* continua valendo porque o
 * que muda é a fonte de UM dos lados, declarada e impressa.
 */
/**
 * O REGISTRO DA ARTE, quando `--semantica` troca a régua de posição.
 *
 * É estado de módulo, e a razão é a que me custou uma medição errada: `comparar()`
 * é chamada de oito lugares, e o registro é escolha do PROCESSO, não de cada
 * comparação. Na primeira tentativa eu troquei o registro só da peça; a arte
 * continuou pelo tronco, e a comparação passou a medir duas coisas em referenciais
 * diferentes — **36,2 u onde o registro antigo dava 15,6**. O número piorou porque
 * a medição estava errada, não porque o registro estivesse.
 *
 * Uma variável só é o que garante que os dois lados nunca discordem.
 *
 * O render NÃO entra aqui: ele é o produto, medido contra o próprio `geometria.ts`,
 * e o registro dele por tronco é exato por construção.
 */
let REGISTRO_DA_ARTE: Mapa | undefined;

async function comparar(arte: Segmentacao, peca: Cabelo, k: number): Promise<Medicao> {
  const { vb } = await ancorasDoViewBox();
  const aArte = arte.ancoras;
  const mArte = REGISTRO_DA_ARTE ?? mapa(aArte, vb);

  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: peca, ns: "fid" });
  const bmpRender = await rasterizar(svg, ALTURA);
  const segRender = segmentarPorMatiz(bmpRender);
  const aRender = ancoras(bmpRender);
  const mRender = mapa(aRender, vb);

  const Y0 = CAIXA_CABECA.y0;
  const descomprimir = (uy: number) => (uy >= Y0 || k >= 1 ? uy : Y0 - (Y0 - uy) / k);

  const arteMassa = massaEmUnidades(arte, mArte, aArte.yPescoco, descomprimir);
  const render = massaEmUnidades(segRender, mRender, aRender.yPescoco);

  const base = desvio(arteMassa.base, render.base);
  const topo = desvio(arteMassa.topo, render.topo);
  const comMassa = base.colunasComuns + base.soNaArte + base.soNoRender;

  return {
    iou: iou(arteMassa.massa, render.massa),
    base,
    topo,
    soNaArte: comMassa ? base.soNaArte / comMassa : 0,
    celulasArte: arteMassa.celulas,
    celulasRender: render.celulas,
    descartadas: { arte: arteMassa.descartadas, render: render.descartadas },
    folga: { arte: folgaNaGrade(arteMassa), render: folgaNaGrade(render) },
    perfis: { arte: arteMassa, render },
  };
}

/** Interseção sobre união de duas máscaras da grade, em %. */
function iou(a: Uint8Array, b: Uint8Array): number {
  let inter = 0;
  let uniao = 0;
  for (let i = 0; i < a.length; i++) {
    const s = a[i] + b[i];
    if (s === 2) inter++;
    if (s > 0) uniao++;
  }
  return (100 * inter) / Math.max(1, uniao);
}

/* ------------------------------------------------------------------ */
/* `--onde` — os 27 u repartidos por banda de x                        */
/* ------------------------------------------------------------------ */

/**
 * AS CINCO BANDAS, e os dois cortes que importam saem do crânio CANÔNICO.
 *
 * `CAIXA_CABECA` é derivada de `CABECA.contorno`, então "fora do crânio" quer dizer
 * exatamente a região que o `clip-path` do compositor come — e é essa a hipótese que
 * este relatório existe para confirmar ou derrubar. Os três terços de dentro são
 * partição igual da largura da caixa: eles não têm marco próprio, e inventar um
 * (a têmpora do `GIRO`, por exemplo) faria a banda depender de uma segunda descrição
 * da cabeça.
 */
function bandas(): { nome: string; de: number; ate: number }[] {
  const { x0, x1 } = CAIXA_CABECA;
  const t = (x1 - x0) / 3;
  return [
    { nome: `fora do crânio esq (x < ${x0.toFixed(1)})`, de: -Infinity, ate: x0 },
    { nome: `têmpora esq (${x0.toFixed(1)}–${(x0 + t).toFixed(1)})`, de: x0, ate: x0 + t },
    { nome: `centro (${(x0 + t).toFixed(1)}–${(x0 + 2 * t).toFixed(1)})`, de: x0 + t, ate: x0 + 2 * t },
    { nome: `têmpora dir (${(x0 + 2 * t).toFixed(1)}–${x1.toFixed(1)})`, de: x0 + 2 * t, ate: x1 },
    { nome: `fora do crânio dir (x > ${x1.toFixed(1)})`, de: x1, ate: Infinity },
  ];
}

interface NaBanda {
  nome: string;
  colunas: number;
  soma: number;
  medio: number;
  /** Quanto desta banda pesa no MÉDIO global — a parcela que soma de volta ao total. */
  parcela: number;
  soNaArte: number;
  soNoRender: number;
}

/**
 * O DESVIO REPARTIDO, com a soma fechando — e "fechando" é o que torna a conta lida.
 *
 * `desvio()` divide a soma pelo número de colunas COMUNS, e é esse denominador que
 * mantém a decomposição aditiva: `parcela` de cada banda é a soma dela sobre o mesmo
 * denominador global, então as cinco parcelas somam exatamente o médio impresso pelo
 * gate. Dividir cada banda pelo próprio número de colunas daria cinco médias que não
 * somam nada, e o relatório passaria a sugerir em vez de decompor.
 *
 * As colunas de presença — massa em um lado só — entram por contagem e não por
 * desvio, pelo mesmo motivo que o gate 2 existe separado do gate 1.
 */
function decompor(a: (number | null)[], b: (number | null)[]) {
  const bs = bandas().map<NaBanda>((f) => ({
    nome: f.nome,
    colunas: 0,
    soma: 0,
    medio: 0,
    parcela: 0,
    soNaArte: 0,
    soNoRender: 0,
  }));
  const lista = bandas();
  const piores: { x: number; d: number; arte: number; render: number }[] = [];
  let comuns = 0;

  for (let gx = 0; gx < GX; gx++) {
    if (a[gx] === null && b[gx] === null) continue;
    const x = gx / S;
    const k = lista.findIndex((f) => x >= f.de && x < f.ate);
    if (k < 0) continue;
    if (a[gx] === null) {
      bs[k].soNoRender++;
      continue;
    }
    if (b[gx] === null) {
      bs[k].soNaArte++;
      continue;
    }
    const d = Math.abs(a[gx]! - b[gx]!) / S;
    bs[k].colunas++;
    bs[k].soma += d;
    comuns++;
    piores.push({ x, d, arte: a[gx]! / S, render: b[gx]! / S });
  }

  for (const f of bs) {
    f.medio = f.colunas ? f.soma / f.colunas : 0;
    f.parcela = comuns ? f.soma / comuns : 0;
  }
  piores.sort((p, q) => q.d - p.d);
  return { bandas: bs, piores: piores.slice(0, 10), comuns, total: comuns ? bs.reduce((s, f) => s + f.soma, 0) / comuns : 0 };
}

/**
 * ATÉ ONDE O CRÂNIO DESCE NAQUELA COLUNA — o `bordasEm` consultado pelo outro eixo.
 *
 * É o que transforma *"o clip come"* de asserção em fato medido. `bordasEm(y)`
 * responde "onde a cabeça começa e termina NAQUELA altura"; percorrendo `y` e
 * guardando onde `x` cai dentro, sai a extensão vertical do crânio naquela coluna —
 * que é exatamente o que o `clip-path` deixa passar. Uma coluna em que a arte tem
 * massa até `y` 276 e o crânio termina em `y` 95 não tem defeito de traço nenhum:
 * ela tem 180 unidades de tinta que o compositor apaga por construção.
 *
 * Passo de meia unidade, que é a célula da grade — a mesma resolução do resto.
 */
function cranioEm(x: number): { y0: number; y1: number } | null {
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let y = CAIXA_CABECA.y0; y <= CAIXA_CABECA.y1; y += 1 / S) {
    const { esq, dir } = bordasEm(y);
    if (x < esq || x > dir) continue;
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return y1 < y0 ? null : { y0, y1 };
}

/**
 * A MORDIDA DO CLIP, MEDIDA — o mesmo render com o `clip-path` da cabeça desligado.
 *
 * Sem isto, "o clip come" é asserção: a banda `fora do crânio` usa a **caixa**, e a
 * caixa não é a silhueta. Uma coluna a `x` 437 está dentro da caixa e ainda assim
 * pode ter 100 unidades de cabelo cortadas, porque a cabeça é redonda e naquela
 * altura ela já terminou.
 *
 * O experimento é o único que separa as duas hipóteses sem ambiguidade: **a mesma
 * peça, o mesmo compositor, a mesma régua**, com uma única coisa diferente. O que a
 * borda de baixo ganhar ao desligar o clip é, por construção, o que o clip tirava.
 *
 * A substituição é textual e é o `<g>` da cabeça inteiro que perde o atributo — a
 * pele e o traço do rosto vazam junto, e não importa: a máscara é de matiz, e nem
 * pele nem preto entram nela. O `ns` torna o alvo único dentro do documento.
 */
async function semClip(peca: Cabelo): Promise<Bitmap> {
  const ns = "nc";
  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: peca, ns });
  const alvo = ` clip-path="url(#${ns}-c-cabeca)"`;
  if (!svg.includes(alvo)) {
    throw new Error(`--onde: o clip da cabeça não foi encontrado no composto (ns=${ns})`);
  }
  return rasterizar(svg.replaceAll(alvo, ""), ALTURA);
}

function imprimirOnde(rotulo: string, med: Medicao) {
  return imprimirDecomposicao(rotulo, decompor(med.perfis.arte.base, med.perfis.render.base), med.base.medio);
}

function imprimirDecomposicao(rotulo: string, d: ReturnType<typeof decompor>, medioDoGate: number) {
  console.log(`\n${rotulo}`);
  console.log(`  banda                            colunas   médio    parcela do global`);
  for (const f of d.bandas) {
    console.log(
      `  ${f.nome.padEnd(32)} ${String(f.colunas).padStart(5)}   ` +
        `${f.medio.toFixed(1).padStart(6)}   ${f.parcela.toFixed(1).padStart(6)} u` +
        (f.soNaArte || f.soNoRender
          ? `   (+${f.soNaArte} só na arte, ${f.soNoRender} só no render)`
          : ""),
    );
  }
  console.log(
    `  ${"— soma das parcelas —".padEnd(32)} ${String(d.comuns).padStart(5)}   ` +
      `${" ".repeat(6)}   ${d.total.toFixed(1).padStart(6)} u   ` +
      `(o médio do gate 1: ${medioDoGate.toFixed(1)})`,
  );
  console.log(
    `  as 10 piores colunas — e até onde o CRÂNIO desce naquele x, que é o que o\n` +
      `  \`clip-path\` deixa passar:`,
  );
  for (const p of d.piores) {
    const c = cranioEm(p.x);
    const comeu = c ? Math.max(0, p.arte - c.y1) : p.arte;
    console.log(
      `    x ${p.x.toFixed(1).padStart(6)}   ${p.d.toFixed(1).padStart(6)} u   ` +
        `arte até y ${p.arte.toFixed(1)} · render até y ${p.render.toFixed(1)}   ` +
        `crânio ${c ? `y ${c.y0.toFixed(0)}–${c.y1.toFixed(0)}` : "ausente"}` +
        (comeu > MEIO_TRACO ? `   ← ${comeu.toFixed(0)} u de arte abaixo do crânio` : ""),
    );
  }
  return d;
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

  /**
   * GATE 3 — A FOLGA DE TESTA, RELATIVA À ARTE: o traço perdeu testa que a arte tem?
   *
   * O piso da peça traçada não é `FOLGA_ROSTO`: a folga é um fato da arte, e o que o
   * traço controla é não piorá-la. Por lado: **folga do render ≥ folga da arte − meio
   * traço**. Lado a lado, nunca no `Math.min` — os dois diferem pelo `GIRO`, e um
   * mínimo esconderia qual lado perdeu.
   *
   * Os casos de `Infinity`, cada um com o seu veredito:
   * - arte E render sem tinta na faixa → `—`, nunca `✓`: verde por vacuidade é o
   *   defeito que este repositório já pagou;
   * - só a ARTE sem tinta → ✗: é o traço inventando massa sobre o rosto, e a
   *   subtração dá isso de graça (finito < ∞ − 6);
   * - só o RENDER sem tinta → ✓: deixar MAIS testa que a arte nunca é invasão.
   */
  const lados = [
    ["folga esq", med.folga.arte.esq, med.folga.render.esq],
    ["folga dir", med.folga.arte.dir, med.folga.render.dir],
  ] as const;
  for (const [nome, arte, render] of lados) {
    if (arte === Infinity && render === Infinity) {
      console.log(
        `  gate 3 · ${nome.padEnd(14)} — (sem tinta sobre a sobrancelha nas duas imagens; ` +
          `nada a medir, e ✓ seria vacuidade)`,
      );
      continue;
    }
    if (arte === Infinity) {
      console.log(
        `  gate 3 · ${nome.padEnd(14)} ${render.toFixed(1)} u contra ∞ ` +
          `(a arte NÃO tem tinta ali — o traço inventou massa sobre o rosto)   ✗`,
      );
      falhas.push(`gate 3 · ${nome}: tinta sobre a sobrancelha que a arte não tem`);
      continue;
    }
    const pisoLado = arte - MEIO_TRACO;
    const passa = render >= pisoLado;
    console.log(
      `  gate 3 · ${nome.padEnd(14)} ${render === Infinity ? "∞" : render.toFixed(1)} u contra ` +
        `${pisoLado.toFixed(1)} (arte ${arte.toFixed(1)} − meio traço ${MEIO_TRACO})` +
        (passa ? "   ✓" : "   ✗"),
    );
    if (!passa) {
      falhas.push(`gate 3 · ${nome}: ${render.toFixed(1)} u < ${pisoLado.toFixed(1)}`);
    }
  }
  const piorArte = Math.min(med.folga.arte.esq, med.folga.arte.dir);
  if (piorArte < FOLGA_ROSTO) {
    console.log(
      `  ⚠ a ARTE deixa ${piorArte.toFixed(1)} u de testa = ${(piorArte / PX56).toFixed(2)} px a 56. ` +
        `Abaixo de ${FOLGA_ROSTO} u franja e\n    sobrancelha encostam por antialiasing e viram ` +
        `uma mancha só no tamanho do\n    ranking. O gate NÃO reprova por isso: a arte é a ` +
        `referência, e trocá-la é\n    direção de arte — item (f), o olho do Doug sobre a folha.`,
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
 *
 * `fundo` é parâmetro porque a folha compara nos DOIS fundos e a referência tem canal
 * alfa: achatá-la sempre sobre branco poria um selo branco em volta dela na linha
 * escura, e a pergunta "o penteado lê no escuro?" seria respondida por um retângulo
 * que o app não desenha.
 */
async function recortarNoViewBox(png: string, m: Mapa, fundo: string): Promise<string> {
  const PAD = 600;
  const dePx = (ux: number) => Math.round((ux - m.eu0) / m.kx + m.ex0);
  const deY = (uy: number) => Math.round((uy - m.tu0) / m.ky + m.ty0);

  const comMargem = await sharp(png)
    .flatten({ background: fundo })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: fundo })
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

/* ------------------------------------------------------------------ */
/* `--folha` — a PEÇA IMPORTADA diante da arte, para o olho do Doug     */
/* ------------------------------------------------------------------ */

const FONTE_RAIZ = "scripts/avatar/fonte/estilo-kokeshi";
const ALVO_PADRAO = "cabelo/curto-espetada";

/**
 * Os dois fundos da folha, e nenhum dos dois é inventado.
 *
 * Claro é `--color-warm-ivory`, escuro é `--color-deep-navy`: os dois tokens de
 * superfície de `globals.css`. Preto puro está fora de propósito — o preto do cabelo
 * é `#3A2F2A`, preto **não-preto** por decisão medida da paleta (*"contra o contorno
 * um preto real apagaria a silhueta do cabelo"*), e num fundo #000 a folha
 * responderia sobre uma superfície que o app não tem.
 */
const FUNDOS = [
  { nome: "fundo claro", cor: "#FAF8F3", texto: "#1B2432", fraco: "#8A8378", regua: "#E4DFD6" },
  { nome: "fundo escuro", cor: "#0F1A2E", texto: "#E7ECF4", fraco: "#8FA0BC", regua: "#25334B" },
] as const;

/** As três cores do mapa de divergência. Só arte, só render, e as duas. */
const DIV = {
  arte: [214, 40, 120],
  render: [0, 150, 190],
  ambas: [204, 210, 218],
  vazio: [255, 255, 255],
} as const;

/** Uma imagem do tamanho exato da grade da régua: 1000×1400, uma célula por pixel. */
async function pngDaGrade(cor: (i: number) => readonly number[]): Promise<string> {
  const raw = Buffer.alloc(GX * GY * 3);
  for (let i = 0; i < GX * GY; i++) {
    const c = cor(i);
    raw[i * 3] = c[0];
    raw[i * 3 + 1] = c[1];
    raw[i * 3 + 2] = c[2];
  }
  const buf = await sharp(raw, { raw: { width: GX, height: GY, channels: 3 } }).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * UMA MÁSCARA DA ARTE NA GRADE DA RÉGUA — o mesmo mapeamento inverso de `massaEmUnidades`.
 *
 * Da grade para o pixel, e nunca o contrário, pelo motivo que aquele docstring mede:
 * carimbar pixel na célula fura a máscara quando a imagem é menor que a grade, e o
 * furo devolve um número plausível (o primeiro IoU do projeto saiu 25,2% por isso).
 *
 * O que ela **não** faz é `soOCabelo` nem corte de pescoço: a entrada aqui já é um
 * papel declarado da peça, não o quadro inteiro do gerador. Não há gola para separar.
 */
function naGrade(
  em: (px: number, py: number) => boolean,
  m: Mapa,
  descomprimir: (uy: number) => number,
): Uint8Array {
  const g = new Uint8Array(GX * GY);
  const dePx = (ux: number) => Math.round((ux - m.eu0) / m.kx + m.ex0);
  const deY = (uy: number) => Math.round((uy - m.tu0) / m.ky + m.ty0);
  for (let gy = 0; gy < GY; gy++) {
    const py = deY(descomprimir(gy / S));
    for (let gx = 0; gx < GX; gx++) if (em(dePx(gx / S), py)) g[gy * GX + gx] = 1;
  }
  return g;
}

/**
 * UM PAPEL DO RENDER SOZINHO, COM O MESMO CLIP E O MESMO TRAÇO DO COMPOSITOR.
 *
 * Não é uma segunda montagem do cabelo: o `d` vem de `pathCabelo`, `pathCabeloClaro`
 * e `pathCabeloLinhas` — as mesmas três funções que `cabeloNoCranio()` chama — e o
 * clip é o mesmo `pathCabeca()`. Se a máscara daqui divergir do que a folha desenha
 * ao lado, o defeito é do compositor, não desta função.
 *
 * Segmentar o composto por cor seria a alternativa, e ela não separa: a massa sai em
 * `--av-cabelo-s` e a clara em `--av-cabelo`, que são o mesmo matiz com luminâncias
 * vizinhas, e o traço tem 12 unidades de espessura contra um fundo escuro.
 */
function svgDoPapel(ns: string, d: string, traco: boolean, fundo: string, tinta: string): string {
  const pintura = traco
    ? `fill="none" stroke="${tinta}" stroke-width="${TRACO}" stroke-linejoin="round" stroke-linecap="round"`
    : `fill="${tinta}"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}">` +
    `<defs><clipPath id="${ns}-cc"><path d="${pathCabeca()}"/></clipPath></defs>` +
    `<rect width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="${fundo}"/>` +
    `<g clip-path="url(#${ns}-cc)">` +
    (d ? `<path d="${d}" ${pintura}/>` : "") +
    `</g></svg>`
  );
}

/** Seis caracteres que só existem dentro do PNG. Mesma função de `variantes.ts`. */
function gerarSelo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
}

/** O literal de `peca.ts`, no mínimo que `conferirLiteral` e `Cabelo` precisam. */
type PecaColada = {
  massa?: readonly { t: number; y: number }[];
  clara?: readonly { t: number; y: number }[];
  linhas?: readonly (readonly [number, number])[];
};

/**
 * A FOLHA DO CHECKPOINT C — e a primeira coisa que ela conserta é o que desenha.
 *
 * ---------------------------------------------------------------------------
 * ELA COMPÕE A PEÇA IMPORTADA. A ROTA ANTIGA NÃO ENTRA AQUI.
 * ---------------------------------------------------------------------------
 *
 * Até o checkpoint B esta função montava a peça com `tracarArquivo(png)` — o
 * traçador que adivinha a peça a partir de pixel, e que o plano declarou
 * **diagnóstico**. Ele não lê `peca.ts` e não conhece `linhas`: a folha sairia
 * mostrando um artefato com o laço inteiro traçado, que é a barra preta falsa, e o
 * Doug julgaria um desenho que o pipeline não entrega. Aprovar ali seria aprovar a
 * coisa errada, e reprovar seria reprovar a coisa errada.
 *
 * O que ela desenha agora é o literal de `peca.ts` — o mesmo que iria para o catálogo
 * —, e ela **recusa desenhar** se ele divergir da fonte. `--check` já mede isso no
 * `verify:all`; aqui a conferência é repetida porque uma folha desenhada de um
 * literal velho é pior que uma folha que não sai.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTÁ NA FOLHA, E CONTRA QUE DECISÃO
 * ---------------------------------------------------------------------------
 *
 * Uma folha só, tudo lado a lado. Cada bloco existe para uma pergunta do checkpoint:
 *
 *  1. **leitura, fundo claro e escuro, 56/100/200/425** — as ~12 pontas sobrevivem à
 *     redução? Os 82,5% de traço leem, ou a coroa nua aparece? A 56 px é onde manda;
 *     os 425 existem para ver o que a 56 esconde, não para julgar;
 *  2. **máscara por papel** — massa, clara e traço, a arte declarada de um lado e o
 *     render do outro. A arte entra no registro de CAIXA e a peça está reancorada
 *     pela largura da linha, então a diferença na cúpula **é** o achado da coroa,
 *     desenhado em vez de contado;
 *  3. **mapa de divergência** — magenta é arte sem render, ciano é render sem arte;
 *  4. **dois closes de coordenada MEDIDA** — a faixa das sobrancelhas (o achado da
 *     folga) e a banda da coroa (o achado da cobertura). Nenhum recorte é escolhido
 *     a olho: os dois saem de `SOBRANCELHA`/`OLHO_CY` e do `COROA` de `cabelo.ts`.
 *
 * O selo de seis caracteres não é impresso no terminal: ele prova que a imagem foi
 * aberta, e o relatório da crítica começa citando ele — Fase 4 da `avatar-desenho`.
 */
async function folha(alvo: string) {
  mkdirSync(DIAG, { recursive: true });
  const pasta = `${FONTE_RAIZ}/${alvo}`;
  const semantica = `${pasta}/semantica.svg`;
  const referencia = `${pasta}/referencia.png`;

  // 1. A PEÇA — importada da fonte e conferida contra o literal colado ANTES de
  //    qualquer pixel. Ver o docstring: desenhar outra coisa põe o Doug julgando o
  //    artefato errado, e um selo dado ao artefato errado não se desfaz.
  const imp = await importarPeca(semantica);
  const { PECA } = (await import(`../fonte/estilo-kokeshi/${alvo}/peca.ts`)) as {
    PECA: PecaColada;
  };
  const difs = conferirLiteral(imp.peca, PECA);
  if (difs.length) {
    throw new Error(
      `a folha recusa desenhar: o literal de ${alvo}/peca.ts não é o que a fonte produz.\n` +
        difs.map((d) => `  · ${d}`).join("\n"),
    );
  }
  const peca: Cabelo = {
    id: "curto",
    nome: alvo,
    ...(PECA.massa ? { massa: PECA.massa } : {}),
    ...(PECA.clara ? { clara: PECA.clara } : {}),
    ...(PECA.linhas ? { linhas: PECA.linhas } : {}),
  };

  // 2. O REGISTRO — pela CABEÇA, que é do que um cabelo é peça. Pelo tronco a cabeça
  //    da arte cai 28% grande no viewBox, e a folha compararia dois enquadramentos.
  const fonte = lerFontePecaOuFalhar(semantica);
  const guia = guiaChamada(fonte, "cabeca");
  const meta = await sharp(referencia).metadata();
  const aspectoPng = meta.width! / meta.height!;
  const aspectoVb = fonte.viewBox.w / fonte.viewBox.h;
  if (Math.abs(aspectoPng / aspectoVb - 1) > 0.01) {
    throw new Error(
      `referencia.png é ${meta.width}×${meta.height} e o viewBox da fonte é ` +
        `${fonte.viewBox.w}×${fonte.viewBox.h}: enquadramentos diferentes. A guia \`cabeca\` ` +
        `está em unidades do viewBox, e sem o mesmo quadro ela não aponta para o mesmo lugar no PNG.`,
    );
  }
  const mArte = registroPelaCabeca(guia.caixa, fonte.viewBox, meta.height!, {
    x0: CAIXA_CABECA.x0,
    y0: CAIXA_CABECA.y0,
    x1: CAIXA_CABECA.x1,
    y1: CAIXA_CABECA.y1,
  });
  REGISTRO_DA_ARTE = mArte;

  // 3. A MEDIÇÃO — a mesma `comparar()` dos gates, sobre a mesma peça que a folha
  //    desenha. Números da folha e números do terminal não podem ter duas origens.
  const segArte = await segmentarArquivo(referencia, "png");
  const med = await comparar(segArte, peca, imp.teto.k);

  const Y0 = CAIXA_CABECA.y0;
  const kTeto = imp.teto.k;
  const descomprimir = (uy: number) => (uy >= Y0 || kTeto >= 1 ? uy : Y0 - (Y0 - uy) / kTeto);

  // 4. AS IMAGENS
  const svgTeal = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: peca, ns: "ft" });
  const svgReal = compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: peca, ns: "rt" });
  const formas = (svgReal.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
  const bytes = Buffer.byteLength(svgReal, "utf-8");

  const mas = imp.mascaras;
  const emRaster = (mask: Uint8Array) => (px: number, py: number) =>
    px >= 0 && py >= 0 && px < mas.w && py < mas.h && mask[py * mas.w + px] === 1;
  const uniaoDoPapel = (papel: string) => {
    const g = new Uint8Array(mas.w * mas.h);
    for (const c of mas.camadas) {
      if (c.camada.papel !== papel) continue;
      for (let i = 0; i < g.length; i++) if (c.mask[i]) g[i] = 1;
    }
    return g;
  };

  const papeis = [
    { nome: "massa", arte: uniaoDoPapel("massa"), d: pathCabelo(peca), traco: false },
    { nome: "clara", arte: mas.clara, d: pathCabeloClaro(peca), traco: false },
    { nome: "traço", arte: mas.linha, d: pathCabeloLinhas(peca), traco: true },
  ] as const;
  const papeisImg = await Promise.all(
    papeis.map(async (p) => {
      const g = naGrade(emRaster(p.arte), imp.mapa, descomprimir);
      let celulas = 0;
      for (let i = 0; i < g.length; i++) if (g[i]) celulas++;
      return { ...p, img: await pngDaGrade((i) => (g[i] ? [30, 30, 30] : [255, 255, 255])), celulas };
    }),
  );

  const gArte = med.perfis.arte.massa;
  const gRender = med.perfis.render.massa;
  const divergencia = await pngDaGrade((i) =>
    gArte[i] && gRender[i] ? DIV.ambas : gArte[i] ? DIV.arte : gRender[i] ? DIV.render : DIV.vazio,
  );

  // 5. OS RECORTES, DE COORDENADA MEDIDA — nenhum escolhido a olho.
  const topoSob = Math.min(topoDaSobrancelha(OLHO_CY_ESQ), topoDaSobrancelha(OLHO_CY_DIR));
  const corteSobrancelha = {
    nome: "a faixa das sobrancelhas",
    porque: `topo do arco em y ${topoSob.toFixed(1)} · FOLGA_ROSTO = ${FOLGA_ROSTO} u acima dele`,
    x0: OLHO_CX_ESQ - SOBRANCELHA.larg,
    x1: OLHO_CX_DIR + SOBRANCELHA.larg,
    y0: topoSob - 120,
    y1: topoSob + 60,
    z: 1.9,
  };
  // O mesmo quarto de cima da caixa da cabeça que `coberturaDaCoroa` mede.
  const limiteCoroa = CAIXA_CABECA.y0 + 0.25 * (CAIXA_CABECA.y1 - CAIXA_CABECA.y0);
  const corteCoroa = {
    nome: "a banda da coroa",
    porque: `y ${CAIXA_CABECA.y0.toFixed(0)} → ${limiteCoroa.toFixed(0)} — o quarto de cima da caixa da cabeça, o que \`coberturaDaCoroa\` mede`,
    x0: CAIXA_CABECA.x0 - 12,
    x1: CAIXA_CABECA.x1 + 12,
    y0: CAIXA_CABECA.y0 - 16,
    y1: limiteCoroa + 16,
    z: 1.5,
  };

  // 6. A MONTAGEM
  const selo = gerarSelo();
  const larg = (h: number) => Math.round((h * VIEWBOX.w) / VIEWBOX.h);
  const em = (s: string, h: number) => s.replace("<svg ", `<svg width="${larg(h)}" height="${h}" `);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const fig = (rot: string, dentro: string, cor: string) =>
    `<figure style="margin:0;text-align:center">${dentro}` +
    `<figcaption style="font:10px system-ui;color:${cor};margin-top:5px">${esc(rot)}</figcaption></figure>`;

  const h2 = (t: string, sub: string) =>
    `<h2 style="font:600 13px system-ui;margin:0 0 2px;color:#1B2432">${esc(t)}</h2>` +
    `<p style="font:11px system-ui;color:#8A8378;margin:0 0 12px;max-width:1100px">${esc(sub)}</p>`;

  const secao = (dentro: string) =>
    `<section style="padding:18px 20px;border-top:1px solid #E4DFD6">${dentro}</section>`;

  /** Uma janela sobre a composição inteira. `z` é pixel por unidade do viewBox. */
  const janela = (c: { x0: number; y0: number; x1: number; y1: number; z: number }, conteudo: (w: number, h: number) => string) =>
    `<div style="width:${Math.round((c.x1 - c.x0) * c.z)}px;height:${Math.round((c.y1 - c.y0) * c.z)}px;` +
    `overflow:hidden;position:relative;outline:1px solid #E4DFD6">` +
    `<div style="position:absolute;left:${-c.x0 * c.z}px;top:${-c.y0 * c.z}px">` +
    conteudo(Math.round(VIEWBOX.w * c.z), Math.round(VIEWBOX.h * c.z)) +
    `</div></div>`;

  // --- bloco 1 e 2: leitura, um por fundo. O recorte claro é reusado nos closes:
  // é a mesma imagem, e recortá-la duas vezes seria duas chances de divergir.
  const refs = new Map(
    await Promise.all(
      FUNDOS.map(
        async (f) => [f.nome, await recortarNoViewBox(referencia, mArte, f.cor)] as const,
      ),
    ),
  );
  const refClaro = refs.get(FUNDOS[0].nome)!;
  const blocosDeLeitura = FUNDOS.map((f) => {
    const ref = refs.get(f.nome)!;
    const linha = (rot: string, cel: (t: number) => string) =>
      `<div style="display:flex;align-items:flex-end;gap:16px">` +
      `<div style="width:96px;font:11px system-ui;color:${f.fraco};text-align:right;padding-bottom:16px">${esc(rot)}</div>` +
      TAMANHOS.map((t) => fig(`${t} px${t === 56 ? " · o ranking" : ""}`, cel(t), f.fraco)).join("") +
      `</div>`;
    return (
      `<div style="background:${f.cor};padding:16px 20px 18px;border-radius:6px">` +
      `<p style="font:600 12px system-ui;color:${f.texto};margin:0 0 12px">${esc(f.nome)}</p>` +
      linha("a arte", (t) => `<img src="${ref}" width="${larg(t)}" height="${t}" style="display:block">`) +
      `<div style="height:10px"></div>` +
      linha("a peça · teal", (t) => em(svgTeal, t)) +
      `<div style="height:10px"></div>` +
      linha("a peça · paleta", (t) => em(svgReal, t)) +
      `</div>`
    );
  });

  // --- bloco 3: máscara por papel
  const blocoPapeis = papeisImg
    .map((p, i) => {
      const parte = (rot: string, dentro: string) =>
        fig(rot, `<div style="outline:1px solid #E4DFD6">${dentro}</div>`, "#8A8378");
      return (
        `<div style="padding:0 16px;${i ? "border-left:1px solid #EEE9E0" : ""}">` +
        `<p style="font:600 12px system-ui;color:#1B2432;margin:0 0 8px;text-align:center">${esc(p.nome)}</p>` +
        `<div style="display:flex;gap:10px">` +
        parte("a arte declarada", `<img src="${p.img}" width="${larg(200)}" height="200" style="display:block">`) +
        parte("o render", em(svgDoPapel(`p${i}`, p.d, p.traco, "#FFFFFF", "#1E1E1E"), 200)) +
        `</div></div>`
      );
    })
    .join("");

  // --- bloco 4: divergência
  const legenda = (cor: readonly number[], rot: string) =>
    `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;font:11px system-ui;color:#5A5248">` +
    `<span style="width:11px;height:11px;background:rgb(${cor.join(",")});outline:1px solid #CFC8BC"></span>${esc(rot)}</span>`;

  // --- bloco 5: os dois closes medidos
  const close = (c: typeof corteSobrancelha) =>
    `<div style="padding:0 16px">` +
    `<p style="font:600 12px system-ui;color:#1B2432;margin:0 0 2px">${esc(c.nome)}</p>` +
    `<p style="font:10px ui-monospace,monospace;color:#8A8378;margin:0 0 8px">` +
    `x ${c.x0.toFixed(0)}–${c.x1.toFixed(0)} · y ${c.y0.toFixed(0)}–${c.y1.toFixed(0)} · ${esc(c.porque)}</p>` +
    `<div style="display:flex;gap:10px">` +
    fig("a arte", janela(c, (w, h) => `<img src="${refClaro}" width="${w}" height="${h}" style="display:block">`), "#8A8378") +
    fig("a peça · paleta", janela(c, (w, h) => em(svgReal, h)), "#8A8378") +
    fig("divergência", janela(c, (w, h) => `<img src="${divergencia}" width="${w}" height="${h}" style="display:block">`), "#8A8378") +
    `</div></div>`;

  const rodape =
    `IoU ${med.iou.toFixed(1)}% · borda de baixo ${u(med.base.medio)} médio, máx ${u(med.base.max)} · ` +
    `topo ${u(med.topo.medio)} médio · colunas só na arte ${(100 * med.soNaArte).toFixed(1)}% (teto ${100 * TETO_SO_NA_ARTE}%)  |  ` +
    `folga sobre a sobrancelha — arte esq ${med.folga.arte.esq.toFixed(1)} dir ${med.folga.arte.dir.toFixed(1)} · ` +
    `render esq ${med.folga.render.esq.toFixed(1)} dir ${med.folga.render.dir.toFixed(1)} u  |  ` +
    `cobertura da coroa ${((coberturaDaCoroa(peca) ?? 0) * 100).toFixed(1)}% · ` +
    `contenção da clara ${contencaoDaClara(peca).toFixed(2)} u · ` +
    `traço ${(100 * (arcosDeTraco(peca)?.fracao ?? 0)).toFixed(1)}% do laço em ${(peca.linhas ?? []).length} arco(s)  |  ` +
    `massa ${(peca.massa ?? []).length} pts · clara ${(peca.clara ?? []).length} pts · ${formas} formas · ${bytes} B`;

  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();
    await pg.setContent(
      `<body style="margin:0;background:#FFFFFF;display:inline-block;min-width:1180px">` +
        `<div style="padding:18px 20px 0">` +
        `<h1 style="font:600 15px system-ui;margin:0 0 2px;color:#1B2432">${esc(alvo)} — a peça IMPORTADA contra a arte</h1>` +
        `<p style="font:11px ui-monospace,monospace;color:#8A8378;margin:0">` +
        `composta do literal de peca.ts (conferido contra a fonte) · registro pela CABEÇA · ` +
        `kx ${mArte.kx.toFixed(4)} ky ${mArte.ky.toFixed(4)} · anisotropia ${(100 * anisotropia(mArte)).toFixed(2)}%</p>` +
        `</div>` +
        secao(
          h2(
            "1 · leitura, nos dois fundos",
            "a mesma peça e a mesma arte em 56/100/200/425 px. 56 é o tamanho do ranking e é o que manda; 425 existe para ver o que 56 esconde, não para julgar",
          ) + `<div style="display:flex;gap:16px;flex-wrap:wrap">${blocosDeLeitura.join("")}</div>`,
        ) +
        secao(
          h2(
            "2 · máscara por papel",
            "a arte declarada entra no registro de CAIXA; a peça está reancorada pela largura da linha. A diferença na cúpula é o achado da coroa, desenhado em vez de contado",
          ) + `<div style="display:flex">${blocoPapeis}</div>`,
        ) +
        secao(
          h2("3 · mapa de divergência", "as duas máscaras da grade da régua, 1000×1400, uma célula por pixel") +
            `<div style="display:flex;gap:20px;align-items:flex-start">` +
            `<img src="${divergencia}" width="${larg(420)}" height="420" style="display:block;outline:1px solid #E4DFD6">` +
            `<div style="padding-top:6px">` +
            legenda(DIV.arte, "só na arte") +
            legenda(DIV.render, "só no render") +
            legenda(DIV.ambas, "nas duas") +
            `<p style="font:11px system-ui;color:#5A5248;margin:12px 0 0;max-width:420px">` +
            `colunas com massa só na arte: <b>${(100 * med.soNaArte).toFixed(1)}%</b> · células — arte ${med.perfis.arte.celulas}, render ${med.perfis.render.celulas}</p>` +
            `</div></div>`,
        ) +
        secao(
          h2("4 · dois closes de coordenada medida", "nenhum recorte escolhido a olho: os dois saem das constantes de geometria.ts e de cabelo.ts") +
            `<div style="display:flex;gap:8px;flex-wrap:wrap">${close(corteSobrancelha)}${close(corteCoroa)}</div>`,
        ) +
        `<p style="font:11px ui-monospace,monospace;color:#5A5248;margin:0;padding:14px 20px;` +
        `border-top:1px solid #E4DFD6;line-height:1.7;max-width:1140px">${esc(rodape)}</p>` +
        `<p style="font:10px ui-monospace,monospace;color:#BBB;margin:0;padding:0 20px 12px">${selo}</p>` +
        `</body>`,
    );
    // A JANELA CRESCE ATÉ A FOLHA, e isto não é zelo: `clip` NÃO estica o viewport.
    // A folha antiga cabia nos 1280×720 do padrão; esta não, e o recorte saía cortado
    // no tamanho exato do viewport — um defeito que se lê como "a folha ficou pequena"
    // e não como "faltou metade dela".
    const caixa = (await pg.locator("body").boundingBox())!;
    const w = Math.ceil(caixa.width);
    const h = Math.ceil(caixa.height);
    await pg.setViewportSize({ width: w, height: h });
    const buf = await pg.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
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
          { nome: "a peça importada", eixo: "fidelidade contra a arte de origem", formas, bytes, svg: svgReal },
        ],
      },
      null,
      2,
    ),
  );

  console.log(`\nFOLHA — ${alvo}, peça IMPORTADA (literal de peca.ts, conferido contra a fonte)`);
  console.log(`  ${rodape.replace(/ {2}\| {2}/g, "\n  ")}`);
  if (imp.achados.length) {
    console.log(`\nos ${imp.achados.length} achado(s) que a folha existe para decidir:`);
    for (const a of imp.achados) console.log(`  · ${a}`);
  }
  console.log(`\nselo ${selo}`);
  console.log(FOLHA);
  console.log(`/dev/avatar-variantes  (public/dev/variantes.json)`);
}

/* ------------------------------------------------------------------ */
/* `--fonte-conferencia` — as duas fontes descrevem a mesma massa?     */
/* ------------------------------------------------------------------ */

/**
 * A MESMA ARTE, SEGMENTADA PELOS DOIS CAMINHOS — e nenhum render no meio.
 *
 * É a pergunta anterior a toda a troca de pipeline: *o SVG do conversor e o PNG de
 * origem descrevem a mesma massa de cabelo?* Se não descrevem, todo número que sair
 * da fonte nova mede a diferença entre duas artes, e não a distância à referência.
 *
 * O render fica de fora de propósito. Comparar `arte(PNG) × render` com
 * `arte(SVG) × render` deixaria o clip do crânio, a decimação e o laço vazado dentro
 * dos dois números, e a diferença entre eles ficaria enterrada sob 27 unidades de
 * coisas que não têm nada a ver com fonte. Aqui os dois lados são a arte.
 *
 * O piso é meio traço no desvio médio de borda — o mesmo limiar que separa "borda do
 * preenchimento" de "linha de centro" no resto da régua, e o mesmo que autorizou o
 * line-art a substituir o PNG na base.
 */
async function conferenciaDeFonte(png: string, semDescartarMoldura: boolean) {
  const { vb } = await ancorasDoViewBox();
  const porMatiz = await segmentarArquivo(png, "png");
  const porPath = await segmentarArquivo(png, "svg");
  if (semDescartarMoldura) {
    /**
     * A INVERSÃO: a moldura entra na máscara de cabelo, e o IoU TEM de despencar.
     *
     * Sem ela, um IoU alto não distingue *"as duas fontes concordam"* de *"as duas
     * fontes devolvem a mesma coisa porque a régua está medindo o quadro inteiro"*.
     * Com o retângulo do canvas dentro do cabelo, a máscara do SVG vira o quadro, e
     * o IoU cai para a fração que o cabelo ocupa dele — poucos por cento. Verde aqui
     * significaria que a conferência não mede máscara nenhuma.
     */
    porPath.cabelo = () => true;
    porPath.laudo = [...porPath.laudo, `INVERSÃO: a moldura do canvas ENTROU na máscara de cabelo`];
  }

  for (const seg of [porMatiz, porPath]) {
    console.log(`${seg.fonte === "path" ? "SVG " : "PNG "} —`);
    for (const l of seg.laudo) console.log(`  ${l.replace(/\n/g, "\n  ")}`);
  }

  const de = (seg: Segmentacao) => {
    const a = seg.ancoras;
    return massaEmUnidades(seg, mapa(a, vb), a.yPescoco);
  };
  const a = de(porMatiz);
  const b = de(porPath);

  const base = desvio(a.base, b.base);
  const topo = desvio(a.topo, b.topo);
  const valor = iou(a.massa, b.massa);

  console.log(`\nCONFERÊNCIA DE FONTE — ${png} (as duas máscaras da ARTE, sem render no meio)`);
  console.log(
    `  células: matiz ${a.celulas} · path ${b.celulas} ` +
      `(${(((100 * (b.celulas - a.celulas)) / (a.celulas || 1))).toFixed(2)}%)`,
  );
  console.log(`  IoU do maior componente ...... ${valor.toFixed(2)}%`);
  console.log(
    `  borda de BAIXO   máx ${u(base.max)}   médio ${u(base.medio)}` +
      (base.medio > MEIO_TRACO ? "   ✗" : "   ✓"),
  );
  console.log(
    `  borda de CIMA    máx ${u(topo.max)}   médio ${u(topo.medio)}` +
      (topo.medio > MEIO_TRACO ? "   ✗" : "   ✓"),
  );
  console.log(
    `  colunas em UM lado só: só no matiz ${base.soNaArte} · só no path ${base.soNoRender} ` +
      `(de ${base.colunasComuns} comuns)`,
  );

  // Média sem lugar não é acionável: um médio de 10 u pode ser viés de meia
  // espessura em todo o perímetro (que é fonte) ou três colunas de 150 (que é uma
  // mecha que uma das duas fontes viu e a outra não). Só a coluna distingue.
  imprimirDecomposicao("por banda de x, e as 10 piores colunas:", decompor(a.base, b.base), base.medio);

  const falhas: string[] = [];
  if (base.medio > MEIO_TRACO) falhas.push(`borda de baixo ${base.medio.toFixed(1)} u > ${MEIO_TRACO}`);
  if (topo.medio > MEIO_TRACO) falhas.push(`borda de cima ${topo.medio.toFixed(1)} u > ${MEIO_TRACO}`);

  if (semDescartarMoldura) {
    /**
     * O TETO DA INVERSÃO SAI DO QUE A CONFERÊNCIA APROVA, e não de um chute.
     *
     * Com a moldura dentro, a máscara de path vira *o quadro inteiro acima do
     * pescoço*, e o IoU cai para a fração que o cabelo ocupa dele — medido, 35,0%.
     * O plano previa ~2%, e 2% seria o número se a régua não recortasse no pescoço
     * nem exigisse componente que alcance a cabeça; ela faz as duas coisas.
     *
     * O teto não é o valor medido com margem: ele vem do outro lado. Duas máscaras
     * que concordem dentro de meio traço ao longo de um perímetro de ~1 600 u não
     * têm como ficar abaixo de ~85% de IoU — a conferência aprovada mede 93,0%.
     * Metade disso é território em que nenhuma discordância real de fonte cabe, e é
     * por isso que 50% separa "a régua mede máscara" de "a régua mede o quadro".
     */
    const TETO_DA_INVERSAO = 50;
    const caiu = valor < TETO_DA_INVERSAO;
    console.log(
      `\nINVERSÃO — IoU ${valor.toFixed(2)}% com a moldura dentro da máscara, contra ` +
        `${TETO_DA_INVERSAO}%` +
        (caiu ? `   ✓ despencou, a conferência mede máscara` : `   ✗ NÃO despencou`),
    );
    if (!caiu) process.exitCode = 1;
    return;
  }

  if (!falhas.length) {
    console.log(
      `\n✓ as duas fontes descrevem a mesma massa dentro de meio traço.\n` +
        `  É o mesmo argumento que autorizou o line-art a substituir o PNG na base.`,
    );
    return;
  }
  console.error(`\n✗ ${falhas.length} reprovação(ões):`);
  for (const f of falhas) console.error(`  · ${f}`);
  console.error(
    `\nAcima de meio traço as duas fontes não são a mesma arte, e trocar de fonte\n` +
      `passaria a mover números por um motivo que não é o traço. Ver \`--onde\`.`,
  );
  process.exitCode = 1;
}

/* ------------------------------------------------------------------ */
/* `--rota` — a TERCEIRA fonte, e ela é a máscara contra o traçador     */
/* ------------------------------------------------------------------ */

/**
 * UMA MÁSCARA CRUA VIRANDO `Segmentacao` — sem tronco, sem tom, sem contorno.
 *
 * `massaEmUnidades` pergunta duas coisas a uma segmentação: o `bmp` (para saber o
 * tamanho) e `cabelo(x,y)`. Os outros campos existem para quem sonda pela normal, e
 * aqui ninguém sonda: a pergunta do bloco 0 é de REGIÃO, não de linha de centro.
 *
 * `ancoras` vem de fora porque a máscara não tem tronco para achá-los — e vem do PNG
 * da mesma arte, no mesmo pixel. É a mesma divisão de trabalho de `segmentarArquivo`
 * com a fonte SVG: forma de quem tem a forma, enquadramento de quem tem a silhueta.
 */
function segmentacaoDeMascara(
  mask: Uint8Array,
  w: number,
  h: number,
  a: Segmentacao["ancoras"],
  laudo: string[],
): Segmentacao {
  const bmp: Bitmap = { data: Buffer.alloc(w * h * 3, 255), w, h, canais: 3 };
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    bmp.data[i * 3] = 0;
    bmp.data[i * 3 + 1] = 0;
    bmp.data[i * 3 + 2] = 0;
  }
  const em = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  return {
    bmp,
    cabelo: em,
    claro: () => false,
    escuro: () => false,
    ancoras: a,
    fonte: "path",
    laudo,
  };
}

/**
 * A MÁSCARA CONGELADA CONTRA O QUE UM TRAÇADOR DEVOLVE — a régua do bloco 0.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTA É A MESMA RÉGUA DE `--fonte-conferencia`, E NÃO UMA PARECIDA
 * ---------------------------------------------------------------------------
 *
 * `massaEmUnidades`, `desvio`, `iou` e `decompor` são as mesmas funções, sobre a
 * mesma grade, com o mesmo piso de meio traço. O que muda é só **quem é o segundo
 * lado**: ali era o SVG do conversor, aqui é o contorno devolvido pelo traçador,
 * rasterizado 1:1 de volta. Sem render de peça no meio, pelo mesmo motivo escrito
 * em `conferenciaDeFonte`: um render carregaria o clip do crânio, a reancoragem e a
 * decimação para dentro de um número que existe para medir traçado.
 *
 * ---------------------------------------------------------------------------
 * TRÊS COISAS QUE SÓ ESTE RELATÓRIO MEDE
 * ---------------------------------------------------------------------------
 *
 * **O controle.** A máscara congelada é comparada com `segmentarPorMatiz` do mesmo
 * PNG. Elas têm de ser a MESMA coisa — o congelamento adiciona o filtro de alcance e
 * mais nada. Um IoU abaixo de 100% aqui quer dizer que congelar mudou a arte, e aí
 * nenhum outro número da folha vale.
 *
 * **As pontas, uma a uma.** São o defeito que o Doug reprovou, e média nenhuma as
 * resume: 12 bicos num perímetro de ~2 900 px movem o médio global em frações de
 * unidade. Cada ponta é achada na máscara (máximo local da borda de cima com um
 * traço de proeminência) e o desvio é medido **naquela coluna**.
 *
 * **Componentes desconectados.** O importador de hoje REPROVA componente extra como
 * ilha (`PISO_ILHA`), e a §3.3 do plano argumenta que as pontas talvez só existam
 * como componentes separados. Contar aqui é o insumo dessa decisão, e ela é do
 * bloco 2 — aqui é diagnóstico, não gate.
 */
async function conferenciaDeRota(png: string, nomeDaRota: string, opcoes: OpcoesRota) {
  const { congelarMascara, gravarMascara } = await import("./mascara");
  const { mascaraDoTracado, ilhasDe, pontasDaMascara } = await import("./rotas/rota");
  const { rotaPotrace } = await import("./rotas/potrace");
  const { rotaLineArt } = await import("./rotas/line-art");

  const rotas: Record<string, (typeof rotaPotrace)> = {
    potrace: rotaPotrace,
    "line-art": rotaLineArt,
  };
  const rota = rotas[nomeDaRota];
  if (!rota) {
    throw new Error(`--rota aceita ${Object.keys(rotas).join(" ou ")} — não "${nomeDaRota}"`);
  }

  const mc = await congelarMascara(png);
  for (const l of mc.laudo) console.log(l);
  console.log(`  gravada em ${gravarMascara(mc, "curto-espetada")}`);

  // O CONTROLE: congelar não pode ter mudado a arte.
  const porMatiz = segmentarPorMatiz(mc.bmp, []);
  const congelada = segmentacaoDeMascara(mc.mask, mc.w, mc.h, mc.ancoras, []);
  const a = massaEmUnidades(porMatiz, mc.mapa, mc.ancoras.yPescoco);
  const c = massaEmUnidades(congelada, mc.mapa, mc.ancoras.yPescoco);
  const controle = iou(a.massa, c.massa);
  console.log(
    `\nCONTROLE — máscara congelada × segmentação por matiz do mesmo PNG: IoU ${controle.toFixed(2)}%` +
      (controle >= 99.9 ? `   ✓ congelar não mudou a arte` : `   ✗ CONGELAR MUDOU A ARTE`),
  );
  if (controle < 99.9) process.exitCode = 1;

  console.log(``);
  const t = await rota.tracar(mc, opcoes);
  for (const l of t.laudo) console.log(l);

  const volta = await mascaraDoTracado(t, mc.w, mc.h);
  const ilhas = ilhasDe(volta.mask, volta.w, volta.h);
  const b = massaEmUnidades(
    segmentacaoDeMascara(volta.mask, volta.w, volta.h, mc.ancoras, []),
    mc.mapa,
    mc.ancoras.yPescoco,
  );

  const base = desvio(c.base, b.base);
  const topo = desvio(c.topo, b.topo);
  const valor = iou(c.massa, b.massa);

  console.log(`\nROTA ${t.rota} — a máscara congelada ${mc.hash} contra o contorno devolvido`);
  console.log(
    `  células: máscara ${c.celulas} · traçado ${b.celulas} ` +
      `(${((100 * (b.celulas - c.celulas)) / (c.celulas || 1)).toFixed(2)}%)`,
  );
  console.log(`  IoU do maior componente ...... ${valor.toFixed(2)}%`);
  console.log(
    `  borda de BAIXO   máx ${u(base.max)}   médio ${u(base.medio)}` +
      (base.medio > MEIO_TRACO ? "   ✗" : "   ✓"),
  );
  console.log(
    `  borda de CIMA    máx ${u(topo.max)}   médio ${u(topo.medio)}` +
      (topo.medio > MEIO_TRACO ? "   ✗" : "   ✓"),
  );
  console.log(
    `  colunas em UM lado só: só na máscara ${base.soNaArte} · só no traçado ${base.soNoRender} ` +
      `(de ${base.colunasComuns} comuns)`,
  );
  console.log(
    `  componentes desconectados do traçado: ${ilhas.length}` +
      (ilhas.length > 1 ? ` — ${ilhas.slice(1, 6).map((p) => `${p.toFixed(2)}%`).join(" · ")}` : ``) +
      `\n    (diagnóstico do bloco 2, não gate: \`PISO_ILHA\` do importador reprova ilha hoje)`,
  );
  console.log(`  pontos depois da conversão: ${t.pontos} em ${t.contornos.length} contorno(s)`);
  console.log(
    `  bytes da peça final: só depois da decimação e da composição — bloco 2. ` +
      `Contar aqui seria inventar.`,
  );

  imprimirDecomposicao("por banda de x, e as 10 piores colunas:", decompor(c.base, b.base), base.medio);

  /* As pontas, uma a uma. */
  const proemU = Number(opcoes.proeminencia ?? TRACO);
  const { pontas } = pontasDaMascara(mc, proemU);
  // A distribuição existe porque o número de pontas é o insumo do bloco 2, e um
  // limiar único esconde se 12 viraram 3 por serem rasas ou por não existirem.
  const escada = [TRACO * 2, TRACO, TRACO / 2, TRACO / 4]
    .map((v) => `≥${v.toFixed(1)} u: ${pontasDaMascara(mc, v).pontas.length}`)
    .join(" · ");
  console.log(`\nAS PONTAS — proeminência ${escada}`);
  console.log(`${pontas.length} bico(s) acima de ${proemU} u:`);
  if (!pontas.length) {
    console.log(`  nenhuma. A borda de cima desta máscara não tem máximo local com 12 u de proeminência.`);
  }
  let piorPonta = 0;
  let perdidas = 0;
  for (const p of pontas) {
    // Do pixel da máscara para a coluna da grade — a mesma conversão de `massaEmUnidades`.
    const ux = (p.x - mc.mapa.ex0) * mc.mapa.kx + mc.mapa.eu0;
    const gx = Math.round(ux * S);
    if (gx < 0 || gx >= GX) continue;
    const na = c.topo[gx];
    const nb = b.topo[gx];
    if (na === null) continue;
    if (nb === null) {
      perdidas++;
      console.log(`  x ${ux.toFixed(1).padStart(6)} u   proem ${(p.proeminencia * mc.mapa.kx).toFixed(1).padStart(5)} u   PERDIDA — o traçado não tem massa nesta coluna`);
      continue;
    }
    const d = Math.abs(na - nb) / S;
    piorPonta = Math.max(piorPonta, d);
    console.log(
      `  x ${ux.toFixed(1).padStart(6)} u   proem ${(p.proeminencia * mc.mapa.kx).toFixed(1).padStart(5)} u   ` +
        `desvio do topo ${d.toFixed(1).padStart(5)} u` + (d > MEIO_TRACO ? "   ✗" : "   ✓"),
    );
  }

  const falhas: string[] = [];
  if (base.medio > MEIO_TRACO) falhas.push(`borda de baixo ${base.medio.toFixed(1)} u > ${MEIO_TRACO}`);
  if (topo.medio > MEIO_TRACO) falhas.push(`borda de cima ${topo.medio.toFixed(1)} u > ${MEIO_TRACO}`);
  if (perdidas) falhas.push(`${perdidas} ponta(s) sem massa nenhuma no traçado`);
  if (piorPonta > MEIO_TRACO) falhas.push(`pior ponta ${piorPonta.toFixed(1)} u > ${MEIO_TRACO}`);

  if (!falhas.length) {
    console.log(
      `\n✓ ${t.rota} descreve a máscara congelada dentro de meio traço, e as ${pontas.length} pontas\n` +
        `  sobrevivem. O que sobra para reprovar a peça não é o traçador.`,
    );
    return;
  }
  console.error(`\n✗ ${falhas.length} reprovação(ões) da rota ${t.rota}:`);
  for (const f of falhas) console.error(`  · ${f}`);
  process.exitCode = 1;
}

/**
 * A TESTA: quanto acima da sobrancelha ainda é franja, e não volta do laço.
 *
 * Cem unidades, ou oito traços. O laço da massa passa DUAS vezes pela faixa de `x` de
 * cada sobrancelha — na ida, que é a franja sobre a testa, e na volta, que é o alto
 * do crânio, ~150 u acima. Empurrar a volta não simula invasão de rosto: abre couro
 * cabeludo, que é outro defeito, com outro gate (`coberturaDaCoroa`).
 */
const TESTA = 100;

/**
 * A MESMA PEÇA, COM A FRANJA EMPURRADA SOBRE AS SOBRANCELHAS — a inversão do gate 3.
 *
 * A primeira versão empurrava a massa INTEIRA, e a medição reprovou a inversão, não o
 * gate: uma translação global de 40 u leva a borda de baixo média de 27,3 a 44,4 u e o
 * **gate 1** pega (teto 33,6). O buraco que existe de verdade é a invasão LOCALIZADA —
 * só a franja sobre as faixas das duas sobrancelhas, que são ~⅕ das colunas com massa:
 * pouco demais para mover a média do gate 1, invisível para o gate 2 (presença, não
 * posição), e exatamente o defeito que a folga mede.
 *
 * A clara desce junto nos mesmos pontos: ela mora dentro da massa, e deixá-la para trás
 * mudaria a silhueta da máscara (tinta clara acima do laço), que não é o defeito que se
 * quer simular.
 */
function empurrada(peca: Cabelo, dy: number): Cabelo {
  const naFranjaDaSobrancelha = (p: { t: number; y: number }): boolean => {
    const { esq, dir } = bordasEm(p.y);
    const x = esq + p.t * (dir - esq);
    return [
      [OLHO_CX_ESQ, OLHO_CY_ESQ],
      [OLHO_CX_DIR, OLHO_CY_DIR],
    ].some(
      ([cx, cy]) =>
        Math.abs(x - cx) <= SOBRANCELHA.larg / 2 && p.y > topoDaSobrancelha(cy) - TESTA,
    );
  };
  const desce = (pts: readonly { t: number; y: number }[]) =>
    pts.map((p) => (naFranjaDaSobrancelha(p) ? { ...p, y: p.y + dy } : p));
  return {
    ...peca,
    ...(peca.massa ? { massa: desce(peca.massa) } : {}),
    ...(peca.clara ? { clara: desce(peca.clara) } : {}),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const inverter = args.includes("--inverter");
  const inverterFolga = args.includes("--inverter-folga");
  const querFolha = args.includes("--folha");
  const querPiso = args.includes("--piso");
  const querOnde = args.includes("--onde");
  const querConferencia = args.includes("--fonte-conferencia");
  const iFonte = args.indexOf("--fonte");
  const fonte = (iFonte >= 0 ? args[iFonte + 1] : "png") as "png" | "svg" | "auto";
  if (!["png", "svg", "auto"].includes(fonte)) {
    throw new Error(`--fonte aceita png, svg ou auto — não "${fonte}"`);
  }
  // Os índices que são VALOR de um flag, e portanto não são o caminho da arte.
  // Enumerar os flags com valor num só lugar é o que impede o próximo flag de
  // roubar o posicional em silêncio — que é o tipo de erro que sai plausível.
  const comValor = ["--fonte", "--semantica", "--png", "--rota", "--rota-opcoes"];
  const valores = new Set(comValor.map((f) => args.indexOf(f)).filter((i) => i >= 0).map((i) => i + 1));
  const posicional = args.find((a, i) => !a.startsWith("--") && !valores.has(i));
  const png = posicional ?? ARTE_PADRAO;

  /**
   * `--folha` PASSOU A RECEBER UM ALVO DE FONTE, e não um PNG — de propósito.
   *
   * Ela compõe a peça IMPORTADA, que mora ao lado da fonte versionada. Um PNG solto
   * não tem `semantica.svg` nem `peca.ts`, então não existe peça para desenhar: a
   * única coisa que a folha poderia fazer com ele é voltar à rota antiga, que é
   * justamente o que o checkpoint C proíbe. Recusar em voz alta é melhor que aceitar
   * e desenhar outra coisa — foi assim que a folha chegou aqui mostrando o artefato
   * errado.
   */
  if (querFolha) {
    if (posicional && /\.(png|svg)$/i.test(posicional)) {
      throw new Error(
        `--folha não recebe mais arquivo de imagem ("${posicional}"). Ela compõe a PEÇA ` +
          `IMPORTADA — o literal de peca.ts, conferido contra semantica.svg —, então o que ela ` +
          `recebe é um alvo de fonte, como o \`avatar:importar\`:\n` +
          `  npm run avatar:fidelidade -- --folha                        # ${ALVO_PADRAO}\n` +
          `  npm run avatar:fidelidade -- --folha cabelo/outro-penteado`,
      );
    }
    return folha(posicional ?? ALVO_PADRAO);
  }
  /**
   * `--rota <nome>` — a TERCEIRA fonte da conferência, e ela é aditiva.
   *
   * Sem ela, `--fonte-conferencia` faz exatamente o que fazia: PNG por matiz contra
   * o SVG do conversor. Com ela, o segundo lado passa a ser o contorno que um
   * traçador devolveu sobre a máscara congelada, e o primeiro passa a ser a própria
   * máscara — com o controle que prova que congelar não mudou a arte.
   *
   *   npm run avatar:fidelidade -- --fonte-conferencia --rota potrace
   *   npm run avatar:fidelidade -- --fonte-conferencia --rota potrace --rota-opcoes alphaMax=0.6,optCurve=1
   *   npm run avatar:fidelidade -- --fonte-conferencia --rota line-art --rota-opcoes lado=externo
   */
  const iRota = args.indexOf("--rota");
  const nomeDaRota = iRota >= 0 ? args[iRota + 1] : undefined;
  const iOpc = args.indexOf("--rota-opcoes");
  const opcoesDaRota: OpcoesRota = {};
  if (iOpc >= 0) {
    for (const par of (args[iOpc + 1] ?? "").split(",").filter(Boolean)) {
      const [k, v] = par.split("=");
      if (!k || v === undefined) throw new Error(`--rota-opcoes: "${par}" não é \`chave=valor\``);
      opcoesDaRota[k] = v;
    }
  }
  if (nomeDaRota && !querConferencia) {
    throw new Error(`--rota só vale junto de --fonte-conferencia: ela é a terceira fonte da conferência.`);
  }
  if (querConferencia && nomeDaRota) return conferenciaDeRota(png, nomeDaRota, opcoesDaRota);
  if (querConferencia) return conferenciaDeFonte(png, args.includes("--sem-descartar-moldura"));

  /**
   * `--semantica <arquivo>` TROCA O REGISTRO, e é a única coisa que ele troca.
   *
   * A mesma arte, a mesma segmentação, a mesma decimação — medidas contra a cabeça
   * em vez de contra o tronco. Ver `mapaPelaCaixa` em `tracar-cabelo.ts` para os
   * 28% de escala que o registro pelo tronco custava.
   *
   * Ele é um FLAG e não o padrão porque todo número aprovado do avatar foi medido
   * pelo registro antigo. Trocar o padrão por baixo deslocaria a régua de todo
   * mundo de uma vez — o inverso do que este arquivo existe para fazer.
   */
  const iSem = args.indexOf("--semantica");
  const semantica = iSem >= 0 ? args[iSem + 1] : undefined;
  const iPng = args.indexOf("--png");
  const pngDoEnquadramento = iPng >= 0 ? args[iPng + 1] : undefined;

  let registro: Mapa | undefined;
  if (semantica) {
    const peca = lerFontePecaOuFalhar(semantica);
    const guia = guiaChamada(peca, "cabeca");
    registro = registroPelaCabeca(guia.caixa, peca.viewBox, ALTURA_SVG, {
      x0: CAIXA_CABECA.x0,
      y0: CAIXA_CABECA.y0,
      x1: CAIXA_CABECA.x1,
      y1: CAIXA_CABECA.y1,
    });
    REGISTRO_DA_ARTE = registro;
    console.log(
      `REGISTRO PELA CABEÇA · guia de ${semantica} · caixa ` +
        `(${guia.caixa.x0.toFixed(0)},${guia.caixa.y0.toFixed(0)})-(${guia.caixa.x1.toFixed(0)},${guia.caixa.y1.toFixed(0)}) · ` +
        `kx ${registro.kx.toFixed(4)} · ky ${registro.ky.toFixed(4)} · ` +
        `anisotropia ${(100 * anisotropia(registro)).toFixed(2)}%`,
    );
  }

  const { tracado } = await tracarArquivo(png, fonte, { registro, png: pngDoEnquadramento });
  const segArte = await segmentarArquivo(png, fonte, pngDoEnquadramento);
  console.log(`fonte da ARTE: ${segArte.fonte === "path" ? "SVG (família de path)" : "PNG (matiz)"}`);
  for (const l of segArte.laudo) console.log(`  ${l.replace(/\n/g, "\n  ")}`);

  if (querOnde) {
    /**
     * ONDE MORAM OS 27 u — e a pergunta é anterior a trocar a fonte da medição.
     *
     * O plano do traço por SVG mediu, antes de escrever uma linha, que o SVG e o PNG
     * descrevem a MESMA massa (IoU 92,76%, borda 4,36 u) e que o alinhamento de
     * tronco já cai sobre o canônico dentro de meio traço. Se as duas coisas são
     * verdade, os 27,3 u da borda de baixo não são fonte nem âncora — e este
     * relatório existe para dizer, com a soma fechando, o que eles são.
     *
     * A peça DENSA entra ao lado porque só ela separa decimação de piso: o que
     * aparecer nas duas é piso por definição, porque na densa não há redução para
     * culpar.
     */
    console.log(`ONDE — ${png}`);
    console.log(
      `a borda de baixo repartida por banda de x, nas duas peças. As cinco parcelas\n` +
        `somam o médio que o gate 1 imprime — é decomposição, não amostra.`,
    );
    const dPeca = imprimirOnde("a peça entregue:", await comparar(segArte, tracado.peca, tracado.teto.k));
    const dDensa = imprimirOnde(
      "o laço denso (decimação DESLIGADA — o que sobrar aqui é piso):",
      await comparar(segArte, pecaDensa(tracado), tracado.teto.k),
    );

    // A mordida do clip, medida na MESMA peça: o que a borda de baixo ganha quando
    // a única coisa que muda é o `clip-path` da cabeça.
    const { vb } = await ancorasDoViewBox();
    const aArte = segArte.ancoras;
    const Y0 = CAIXA_CABECA.y0;
    const k = tracado.teto.k;
    const arteMassa = massaEmUnidades(segArte, REGISTRO_DA_ARTE ?? mapa(aArte, vb), aArte.yPescoco, (uy) =>
      uy >= Y0 || k >= 1 ? uy : Y0 - (Y0 - uy) / k,
    );
    const bmpNC = await semClip(tracado.peca);
    const segNC = segmentarPorMatiz(bmpNC);
    const aNC = ancoras(bmpNC);
    const semCorte = massaEmUnidades(segNC, mapa(aNC, vb), aNC.yPescoco);
    const dSemClip = decompor(arteMassa.base, semCorte.base);
    imprimirDecomposicao(
      "a MESMA peça com o `clip-path` da cabeça desligado — o resto é a peça vs a arte:",
      dSemClip,
      dSemClip.total,
    );

    /**
     * O TERCEIRO SUSPEITO, E ELE É O CULPADO — o laço vazando na ponta da cortina.
     *
     * Descontados o clip e a decimação sobram 22 das 27 unidades, e elas moram em
     * colunas (x 77, x 437) onde o crânio desce bem abaixo do que o render alcança:
     * o clip está inocente ali e a peça TEM os pontos. O que ela não tem é
     * PREENCHIMENTO — `autoIntersecoes` marca um cruzamento na ponta de cada
     * cortina, e o `nonzero` do SVG esvazia o trecho entre o cruzamento e a ponta.
     *
     * A prova é a coluna do próprio cruzamento: acima dele o render tem tinta, e
     * abaixo dele não tem nenhuma. Imprimir os dois números lado a lado é o que
     * transforma o aviso do traçador em causa medida — e é o que impede a próxima
     * rodada de gastar o bloco inteiro atrás da fonte, que não é o problema.
     */
    const fundo = (p: Perfilada, x: number): number | null => {
      const gx = Math.round(x * S);
      return gx >= 0 && gx < GX && p.base[gx] !== null ? (p.base[gx]! + 1) / S : null;
    };
    console.log(`\nOS CRUZAMENTOS DO LAÇO — e o que o render tem em cada coluna deles:`);
    if (!tracado.cruzamentos.massa.length) {
      console.log(`  nenhum. A hipótese do laço vazado não se aplica a esta arte.`);
    }
    for (const c of tracado.cruzamentos.massa) {
      const x = Number(c.onde.replace(/[()]/g, "").split(",")[0]);
      const y = Number(c.onde.replace(/[()]/g, "").split(",")[1]);
      const a = fundo(arteMassa, x);
      const r = fundo(semCorte, x);
      console.log(
        `  cruzamento em ${c.onde.padEnd(14)} arte até y ${a === null ? "—" : a.toFixed(1)} · ` +
          `render SEM CLIP até y ${r === null ? "—" : r.toFixed(1)}` +
          (r !== null && r < y + MEIO_TRACO ? `   ← a tinta para NO cruzamento` : ""),
      );
    }

    const fora = (d: ReturnType<typeof decompor>) => d.bandas[0].parcela + d.bandas[4].parcela;
    const dentro = (d: ReturnType<typeof decompor>) =>
      d.bandas[1].parcela + d.bandas[2].parcela + d.bandas[3].parcela;
    const mordida = dPeca.total - dSemClip.total;
    const pct = (v: number) => `${((100 * v) / (dPeca.total || 1)).toFixed(0)}%`;
    /**
     * A TERCEIRA LINHA É UM RESTO, E CHAMÁ-LA DE CAUSA JÁ CUSTOU UMA RODADA.
     *
     * Ela nunca foi medida: é `total − clip − decimação`, o que sobra depois de tirar
     * as duas parcelas que se sabe isolar. Enquanto o laço tinha cruzamento, batizá-la
     * de "laço vazado" parecia atribuição — e era palpite. O cruzamento foi consertado
     * (`sangrarNaSilhueta`, o teto de `alcanceNaDirecao`), a peça saiu com ZERO
     * cruzamentos, **e o resto não se mexeu**: 15,9 u antes, 15,9 u depois.
     *
     * Então o nome só aparece quando há cruzamento para sustentá-lo. Sem cruzamento a
     * linha diz o que ela de fato é — resto sem causa apontada — e a próxima rodada
     * começa sabendo que ainda não sabe.
     */
    const cruzou = tracado.cruzamentos.massa.length;
    const terceiro = cruzou
      ? `  O LAÇO VAZADO — o que sobra .......... ${dSemClip.total.toFixed(1)} u = ${pct(dSemClip.total)}, ` +
        `com ${cruzou} cruzamento(s)`
      : `  O RESTO, SEM CAUSA APONTADA .......... ${dSemClip.total.toFixed(1)} u = ${pct(dSemClip.total)}\n` +
        `     (o laço NÃO se cruza: não é vazamento de \`nonzero\`. É peça que não tem\n` +
        `      os pontos, e as 10 piores colunas acima dizem em que x procurar)`;
    console.log(
      `\nA CAUSA, NOMEADA:\n` +
        `  o CLIP da cabeça ..................... ${mordida.toFixed(1)} u de ` +
        `${dPeca.total.toFixed(1)} = ${pct(mordida)}\n` +
        `     (a mesma peça sem clip fica em ${dSemClip.total.toFixed(1)} u — é a única coisa que mudou)\n` +
        `  a DECIMAÇÃO custa .................... ${(dPeca.total - dDensa.total).toFixed(1)} u ` +
        `(peça ${dPeca.total.toFixed(1)} − densa ${dDensa.total.toFixed(1)})\n` +
        `${terceiro}\n` +
        `  por banda, na peça entregue: fora da caixa do crânio ${fora(dPeca).toFixed(1)} u · ` +
        `dentro ${dentro(dPeca).toFixed(1)} u\n` +
        `  cortina, colunas com 2ª corrida ...... ${tracado.cortina.toFixed(1)}%\n\n` +
        `TROCAR A FONTE NÃO MEXE NOS DOIS PRIMEIROS: o clip opera depois de qualquer\n` +
        `medição, e a decimação já custa zero. O TERCEIRO agora está em aberto — com o\n` +
        `cruzamento morto, o resto pode ser borda, e borda é justamente o que o SVG\n` +
        `compra. É contra ESTES números que ele tem de se justificar no Bloco 4.`,
    );
    return;
  }

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
    imprimir("o laço denso (o piso):", await comparar(segArte, pecaDensa(tracado), tracado.teto.k));
    imprimir("a peça entregue, para comparar:", await comparar(segArte, tracado.peca, tracado.teto.k));
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
    const piso = await comparar(segArte, pecaDensa(tracado), tracado.teto.k);
    const falhas = imprimir(
      "o paramétrico, que TEM de reprovar:",
      await comparar(segArte, CABELOS.curto, 1),
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

  /**
   * `--inverter-folga` — A INVERSÃO DO GATE 3, no molde do R10.
   *
   * A mesma peça traçada, com a franja empurrada 40 unidades sobre as sobrancelhas
   * (ver `empurrada`): um traço que come testa que a arte não come. Rodada ANTES do
   * gate 3 existir, ela saía VERDE — a invasão localizada é fração pequena demais das
   * colunas para mover a média do gate 1 (29,0 u contra o teto de 33,6, medido em
   * 2026-08-04), e o gate 2 mede presença, não posição.
   *
   * Medido depois: a folga do render vai de **12,0 u** para **−6,5 (esq) e −7,0
   * (dir)**, contra pisos de −2,0 e −5,0. Os 40 u no ponto de controle viram ~18 na
   * borda rasterizada — a spline centrípeta redistribui o empurrão entre os vizinhos
   * que ficaram parados, e é a borda que o gate mede.
   *
   * O exit code aqui é o dos gates, sem inverter: o par que prova a mudança é este
   * comando verde antes do gate 3 e vermelho depois.
   */
  const peca = inverterFolga ? empurrada(tracado.peca, 40) : tracado.peca;
  console.log(
    `FIDELIDADE — ${png}` +
      (inverterFolga ? `\nINVERSÃO DA FOLGA — a franja empurrada 40 u sobre as sobrancelhas` : ""),
  );
  console.log(
    `compressão do teto descontada: k = ${tracado.teto.k.toFixed(4)} ` +
      `(pico ${tracado.teto.antes.toFixed(1)} → ${tracado.teto.depois.toFixed(1)})`,
  );
  const piso = await comparar(segArte, pecaDensa(tracado), tracado.teto.k);
  console.log(
    `\npiso medido nesta arte (o mesmo laço com a decimação DESLIGADA, ` +
      `${tracado.denso.massa.length} pontos):` +
      `\n  borda de baixo ${piso.base.medio.toFixed(1)} u · borda de cima ` +
      `${piso.topo.medio.toFixed(1)} u   ← o que o traço NÃO controla`,
  );
  const falhas = imprimir("o traçado:", await comparar(segArte, peca, tracado.teto.k), piso);

  if (!falhas.length) {
    console.log(`\n✓ os três gates passam.`);
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
