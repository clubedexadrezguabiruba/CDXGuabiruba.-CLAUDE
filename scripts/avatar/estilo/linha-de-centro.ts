/**
 * A LINHA DE CENTRO — `npm run avatar:linha-de-centro`
 *
 * Lê o line-art da referência e imprime, já em unidades do `viewBox` e no
 * enquadramento da figura, **o path que o desenhista traçou** e a **espessura do
 * traço**. Roda sob demanda; a tabela que ele imprime é colada em `geometria.ts` à
 * mão. **Não roda em CI**, e o line-art **não vira asset** — mesmo papel da
 * `referencia-base.png`: fonte de medida, nunca arquivo de saída.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE, E O DEFEITO QUE ELE CORRIGE
 * ---------------------------------------------------------------------------
 *
 * `medir.ts` lê **silhueta externa**: o primeiro e o último pixel escuro de cada
 * linha. Isso serve para comparar dois desenhos entre si — é o que o gate faz — e
 * é ruim para *extrair* geometria, por três motivos:
 *
 *  1. **depende da espessura do traço.** A silhueta externa fica meio traço para
 *     fora da linha desenhada. Mudar `TRACO` muda a silhueta sem que a forma tenha
 *     mudado, e obriga o resto do sistema a somar e subtrair `MEIO` por toda parte
 *     — cada conversão dessas é um lugar onde errar;
 *  2. **esconde a linha.** O que se quer saber é onde o traço passa, não onde a
 *     tinta acaba;
 *  3. **é cega para o que está DENTRO.** Uma orelha que interrompe o contorno da
 *     cabeça e uma orelha colada por cima dele produzem a mesma silhueta externa.
 *     Essa cegueira custou o Bloco 1b inteiro: o gate ficou verde com a orelha
 *     esquerda desenhada como peça separada atrás da cabeça, quando a referência
 *     tem ali **um traço só**.
 *
 * O line-art resolve os três. Ele é um trace do Adobe com **3 paths** — o contorno
 * e os dois olhos — em curvas de Bézier, `fill="#000000"` e `stroke="none"`: o
 * traço virou uma REGIÃO preenchida, com borda de fora e borda de dentro. Varrer e
 * achar as corridas de tinta devolve, por corrida, o **centro** (a linha) e a
 * **largura** (a espessura). Nenhum dos dois precisa ser estimado.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS VARREDURAS, E POR QUE UMA SÓ NÃO BASTA
 * ---------------------------------------------------------------------------
 *
 * Uma varredura horizontal atravessa um traço inclinado **na diagonal**. Onde a
 * borda é quase vertical isso é inofensivo; onde ela é quase horizontal — a cúpula
 * do alto da cabeça, o arremate da base — a corrida deixa de descrever o traço.
 * No ápice a corrida mede **84 unidades** para um traço de 13: é o mesmo traço,
 * cortado de viés. Pior que impreciso, é **ambíguo**: a corrida do ápice é uma só
 * e atravessa o eixo, então não há "lado esquerdo" e "lado direito" para separar.
 *
 * A saída não é filtrar, é **virar a varredura**: onde a borda é rasa, varre-se por
 * COLUNA, e o centro da corrida vertical é o mesmo centro de traço que a varredura
 * horizontal daria se pudesse. As duas leituras se encontram por volta dos 45°,
 * onde ambas valem, e `contornoCabeca()` escolhe entre elas pela inclinação local.
 *
 * **É daí que veio o `TRACO` 17.** A medição que o produziu misturou seções
 * diagonais com seções retas e tirou a média. O erro tem sinal — a diagonal só mede
 * a MAIS —, então a média saiu grossa, e um traço 31% grosso embota todo canto do
 * desenho. Aqui a espessura é corrigida pela inclinação **e** as bordas muito
 * oblíquas ficam de fora; a redundância é deliberada, é o número mais sensível.
 *
 * ---------------------------------------------------------------------------
 * POR QUE DÁ PARA CONFIAR NUM TRACE
 * ---------------------------------------------------------------------------
 *
 * Um trace é um **redesenho**, não uma conversão: ele ajusta curvas aos pixels e
 * quantiza a cor. Para **cor** isso é fatal, e é por isso que o SVG colorido do
 * mesmo desenho não serve (640 paths, 558 tons distintos numa ilustração de 8 tons
 * chapados, com a cor assada em `fill=` literais que não recolorem).
 *
 * Para **forma** ele é excelente, e o número que autoriza confiar está impresso no
 * fim deste script: a meia-largura de centro da cabeça e a do tronco medidas aqui
 * são comparadas com as mesmas medidas tiradas da `referencia-base.png` pela régua
 * independente de `medir.ts`. Duas medições independentes que concordam em meia
 * unidade não são as duas erradas do mesmo jeito.
 *
 * **A divisão vale para o Bloco 1c inteiro: forma vem do line-art, cor vem do PNG.**
 */

import { readFileSync } from "fs";
import sharp from "sharp";
import { CENTRO_X, TRACO } from "../../../src/lib/avatar/estilo/geometria";
import {
  ALTURA_CANONICA,
  decimarPorCorda,
  medir,
  naColuna,
  naLinha,
  type Bitmap,
  type Corrida,
} from "./medir";

const LINE_ART = "scripts/avatar/fonte/estilo-kokeshi/referencia-linha-de-centro.svg";
const PNG = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";

/**
 * Altura de rasterização, em pixel. 2048 dá ~0,29 unidades de `viewBox` por pixel,
 * o que põe o erro de discretização da espessura (±1 px) em ±0,3 unidades — uma
 * ordem de grandeza abaixo da diferença que se quer resolver (13 contra 17).
 */
const ALTURA_RASTER = 2048;

/**
 * Onde a silhueta EXTERNA da figura começa, em unidades do `viewBox`.
 *
 * É o enquadramento vigente e ele não muda neste bloco: a figura ocupa 601
 * unidades de altura externa a partir daqui. Mantê-lo fixo é o que permite trocar
 * `TRACO` sem que a figura mude de tamanho na tela — que é metade do ganho de
 * passar a guardar linha de centro.
 */
const Y_TOPO = 39.5;

/**
 * Quantos pontos o contorno da cabeça leva para `geometria.ts`.
 *
 * 42 veio do Bloco 1c e foi escolhido pelo orçamento de bytes. O Bloco 1d
 * **verificou o número em vez de herdá-lo**, e a resposta surpreende: mais pontos
 * pioram. Medido no path emitido, o menor raio de curvatura cai de 32,6 com 42
 * pontos para 16,8 com 48 e 16,4 com 88 — passado certo limite, o erro de corda
 * gasta ponto reproduzindo detalhe de amostragem em vez de forma. Ver `decimar()`.
 */
const ALVO_PONTOS = 42;

/**
 * Janela da média móvel que alisa o degrau das emendas, em unidades de arco.
 *
 * 15 unidades, e o número saiu de varredura, não de estimativa: as emendas têm
 * degrau de 1,3 a 1,9 unidade, e a curvatura só para de inverter a partir de 15
 * (com 6 restavam duas inversões, com 9 e 12 uma). Ver `suavizar()` para o que a
 * janela custa em forma — 0,15 unidade de atalho no canto mais fechado, um terço de
 * pixel do raster.
 */
const JANELA_SUAVE = 15;

// ---------------------------------------------------------------------------
// A leitura
// ---------------------------------------------------------------------------

/** Um ponto da linha de centro, em unidades do `viewBox`, no lugar da figura. */
interface Ponto {
  x: number;
  y: number;
  /** De onde veio: `linha` (borda íngreme) ou `coluna` (borda rasa). */
  via: "linha" | "coluna";
}

interface Amostra {
  frac: number;
  esq: Corrida[];
  dir: Corrida[];
}

interface Leitura {
  fator: number;
  alturaUtilPx: number;
  fracCabeca: number;
  /** Contorno fechado da cabeça, em ordem angular. */
  cabeca: Ponto[];
  /** O tronco continua por linha: as bordas dele são íngremes em toda a altura. */
  tronco: { y: number; esq: number; dir: number }[];
  amostras: Amostra[];
  espessuras: number[];
}

async function ler(): Promise<Leitura> {
  const png = await sharp(readFileSync(LINE_ART), { density: 300 })
    .resize({ height: ALTURA_RASTER })
    .flatten({ background: "#FFFFFF" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const b: Bitmap = { data: png.data, w: png.info.width, h: png.info.height, canais: png.info.channels };

  const linhas: Corrida[][] = [];
  let y0 = -1;
  let y1 = -1;
  for (let y = 0; y < b.h; y++) {
    const c = naLinha(b, y);
    linhas.push(c);
    if (c.length) {
      if (y0 < 0) y0 = y;
      y1 = y;
    }
  }
  if (y0 < 0) throw new Error("linha-de-centro: nenhuma tinta no line-art rasterizado");

  const alturaUtilPx = y1 - y0 + 1;
  const fator = ALTURA_CANONICA / alturaUtilPx;

  // --- o corte cabeça ↔ tronco: a linha mais estreita entre 40% e 78% ---
  //
  // Mesmo procedimento de `medir.ts`, e não por preguiça: ler as duas fontes com o
  // mesmo critério é o que torna os números comparáveis. Um critério diferente aqui
  // devolveria uma discordância que seria da régua, não do desenho.
  let yCortePx = y0 + Math.round(alturaUtilPx * 0.5);
  let menor = Infinity;
  for (let y = y0 + Math.round(alturaUtilPx * 0.4); y <= y0 + Math.round(alturaUtilPx * 0.78); y++) {
    const c = linhas[y];
    if (!c.length) continue;
    const larg = c[c.length - 1].x1 - c[0].x0 + 1;
    if (larg < menor) {
      menor = larg;
      yCortePx = y;
    }
  }

  // --- o eixo do tronco, em pixel: o meio da silhueta externa mais larga ---
  let tMax = 0;
  let eixoPx = b.w / 2;
  for (let y = yCortePx; y <= y1; y++) {
    const c = linhas[y];
    if (!c.length) continue;
    const larg = c[c.length - 1].x1 - c[0].x0 + 1;
    if (larg > tMax) {
      tMax = larg;
      eixoPx = (c[0].x0 + c[c.length - 1].x1) / 2;
    }
  }

  // --- daqui para baixo tudo sai em unidades do viewBox, no lugar da figura ---
  const ux = (px: number) => CENTRO_X + (px - eixoPx) * fator;
  const uy = (py: number) => Y_TOPO + (py - y0) * fator;
  const ul = (px: number) => px * fator;

  // --- a espessura do traço em PIXEL, para os filtros de corrida larga ---
  //
  // Grosseira de propósito, e medida antes de tudo: as bordas laterais do meio da
  // figura são verticais em qualquer desenho desta família, então a mediana das
  // corridas de ponta ali é o traço com folga de sobra para servir de escala a um
  // filtro que corta em 3×. A espessura FINA, corrigida pela inclinação, é outra
  // conta e sai no relatório.
  const larguras: number[] = [];
  for (let y = y0 + Math.round(alturaUtilPx * 0.15); y < y0 + Math.round(alturaUtilPx * 0.45); y++) {
    const c = linhas[y];
    if (c.length >= 2) larguras.push(c[0].espessura, c[c.length - 1].espessura);
  }
  larguras.sort((a, c) => a - c);
  const espessuraPx = larguras[Math.floor(larguras.length / 2)] || 8;

  const cabeca = contornoCabeca(b, linhas, y0, yCortePx, ux, uy, espessuraPx, fator);

  // --- o tronco, por linha ---
  //
  // O filtro de corrida larga importa aqui tanto quanto no contorno da cabeça: nas
  // primeiras linhas abaixo do corte a **base da cabeça** ainda está no quadro, como
  // uma faixa horizontal de centenas de pixels. Sem o filtro, o centro dessa faixa
  // entra como se fosse a borda direita do tronco e a primeira linha do perfil sai
  // em x 264 — dentro da figura, a 100 unidades do lugar.
  const tronco: { y: number; esq: number; dir: number }[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = yCortePx + Math.round(((y1 - yCortePx) * i) / 24);
    const c = linhas[y];
    if (c.length < 2) continue;
    const e = c[0];
    const d = c[c.length - 1];
    if (e.espessura > 3 * espessuraPx || d.espessura > 3 * espessuraPx) continue;
    tronco.push({ y: uy(y), esq: ux(e.centro), dir: ux(d.centro) });
  }

  // --- as amostras cruas, para a banda das orelhas ---
  const AMOSTRAS = 121;
  const amostras: Amostra[] = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    const frac = i / (AMOSTRAS - 1);
    const y = Math.min(y1, y0 + Math.round(frac * (alturaUtilPx - 1)));
    const todas = linhas[y].map((c) => ({
      x0: ux(c.x0),
      x1: ux(c.x1),
      centro: ux(c.centro),
      espessura: ul(c.espessura),
    }));
    amostras.push({
      frac,
      esq: todas.filter((c) => c.centro < CENTRO_X),
      dir: todas.filter((c) => c.centro >= CENTRO_X),
    });
  }

  return {
    fator,
    alturaUtilPx,
    fracCabeca: (yCortePx - y0) / alturaUtilPx,
    cabeca,
    tronco,
    amostras,
    espessuras: medirEspessura(amostras),
  };
}

/**
 * O CONTORNO FECHADO DA CABEÇA, ponto de linha de centro por ponto de linha de
 * centro.
 *
 * O contorno é montado como **quatro funções monovaloradas** — a borda esquerda e a
 * direita como `x(y)`, a cúpula e a base como `y(x)` — e depois concatenado na
 * ordem do relógio. Nenhuma das quatro é ambígua: para um dado `y` existe **um**
 * primeiro pixel de tinta, e para um dado `x` existe **um** pixel mais alto.
 *
 * A primeira versão disto juntava tudo numa nuvem e ordenava por ÂNGULO em torno do
 * centroide. Funciona para um contorno estrelado e a cabeça **não é**: na junção da
 * orelha esquerda a borda dobra sobre si, dois pontos caem no mesmo ângulo, e a
 * ordenação os intercala — o contorno saía com um zigue-zague de 12 unidades
 * exatamente na região que este bloco existe para consertar. Concatenar quatro
 * funções monovaloradas não tem como produzir esse defeito, porque a ordem não é
 * inferida: ela é a ordem do parâmetro.
 *
 * A escolha entre `x(y)` e `y(x)` é a **inclinação local da borda**. Cada trecho é
 * o intervalo contíguo, em torno de uma semente onde a orientação é inequívoca, em
 * que a borda continua daquele tipo. Os quatro trechos se encontram por volta dos
 * 45°, onde as duas leituras valem e concordam.
 */
function contornoCabeca(
  b: Bitmap,
  linhas: Corrida[][],
  y0: number,
  yCortePx: number,
  ux: (px: number) => number,
  uy: (py: number) => number,
  espessuraPx: number,
  fator: number,
): Ponto[] {
  /**
   * A borda de um lado, numa linha. `null` onde a corrida é larga demais para ser
   * um traço cruzado: ali a linha atravessa uma seção oblíqua, e o centro dela não
   * é ponto de contorno nenhum. É a mesma regra que salva o perfil do tronco de ler
   * a faixa da base da cabeça como se fosse borda.
   */
  const lado = (y: number, qual: 0 | 1): number | null => {
    const c = linhas[y];
    if (c.length < 2) return null;
    const r = qual === 0 ? c[0] : c[c.length - 1];
    return r.espessura > 3 * espessuraPx ? null : r.centro;
  };
  const borda = (x: number, qual: 0 | 1): number | null => {
    const c = naColuna(b, x, y0, yCortePx - 1);
    if (!c.length) return null;
    const r = qual === 0 ? c[0] : c[c.length - 1];
    return r.espessura > 3 * espessuraPx ? null : r.centro;
  };

  /**
   * O intervalo contíguo em torno de `semente` onde a borda é legível.
   *
   * **O critério é o `null` das funções acima, e não a inclinação da borda.** A
   * versão anterior parava quando `|dx/dy|` passava de 1, e com isso abria dois
   * buracos de mais de 100 unidades no contorno — um em cada orelha. O motivo é que
   * a saliência da orelha é uma **descontinuidade legítima** de `x(y)`: entre `frac`
   * 0,283 e 0,292 a borda esquerda salta de 76 para 62 porque a orelha passou a ser
   * a tinta mais à esquerda. Inclinação infinita, contorno perfeitamente correto.
   *
   * O que de fato torna uma linha ilegível é outra coisa: **não haver duas corridas
   * estreitas para separar**. No ápice existe uma corrida só, que atravessa o eixo;
   * na base da cabeça as duas se fundem numa faixa de centenas de pixels. Nos dois
   * casos o filtro de largura devolve `null`, o trecho termina sozinho, e é a
   * varredura por coluna que cobre o pedaço — que é exatamente o que ela existe para
   * fazer. Um critério; nenhum caso especial.
   *
   * Crescer a partir de uma semente, em vez de filtrar o domínio inteiro, é o que
   * impede um trecho distante que por acaso satisfaz a condição de entrar no mesmo
   * pedaço de contorno.
   *
   * **`SALTO` é o que faz a orelha esquerda existir.** Nas duas linhas em que a
   * borda da cabeça encontra a borda da orelha, as duas corridas se fundem numa de
   * 39–43 unidades e a leitura sai `null` — legitimamente, porque o centro de um
   * borrão de dois traços não é ponto de contorno. Parar no primeiro `null`
   * encerrava o lado esquerdo em y 207, **quatro unidades antes da saliência**, e o
   * contorno saía com um buraco de 100 unidades justamente na peça que este bloco
   * existe para consertar. Um `null` isolado quer dizer "esta amostra é ilegível",
   * e não "o contorno acabou"; a diferença entre as duas leituras é uma tolerância.
   *
   * Ela é curta de propósito. A junção da orelha tem ~4 unidades; a fusão da base
   * da cabeça com o ombro tem dezenas, e precisa mesmo encerrar o trecho para a
   * varredura por coluna assumir. `SALTO` fica entre as duas, e por isso separa uma
   * da outra sem que nenhuma das duas precise ser nomeada.
   *
   * ---------------------------------------------------------------------------
   *
   * `degrau` é o oposto, e vale só para as CALOTAS. Nelas um salto de valor entre
   * amostras vizinhas nunca é contorno: a cúpula e a base são curvas suaves, com
   * inclinação no máximo 1 por construção (acima disso quem lê são os lados). Um
   * salto de 11 unidades numa coluna é outra peça entrando na janela — na base da
   * cabeça, é o **ombro do tronco**, que surge por trás em x 136 e aparece como uma
   * espiga de uma coluna só. Ela puxava o fundo da cabeça 11 unidades para baixo e
   * abria um degrau no contorno bem na emenda.
   *
   * Nos LADOS o mesmo guarda seria errado, e é por isso que ele é opcional: a
   * saliência da orelha é um salto legítimo de 24 unidades em duas linhas. O que
   * distingue os dois casos não é o tamanho do salto, é a varredura em que ele
   * aparece — e é a razão de as quatro funções serem separadas.
   */
  const SALTO = 20; // amostras (≈ 8 unidades a 2048 px de altura)
  const trecho = (
    f: (i: number) => number | null,
    semente: number,
    de: number,
    ate: number,
    degrau = Infinity,
  ) => {
    const pts: { i: number; v: number }[] = [];
    for (const passo of [-1, 1] as const) {
      let vazios = 0;
      let ult: { i: number; v: number } | null = null;
      for (let i = passo === -1 ? semente : semente + 1; i >= de && i <= ate; i += passo) {
        const v = f(i);
        const salta = v !== null && ult !== null && Math.abs(v - ult.v) > degrau + Math.abs(i - ult.i);
        if (v === null || salta) {
          if (++vazios > SALTO) break;
          continue;
        }
        vazios = 0;
        ult = { i, v };
        pts.push({ i, v });
      }
    }
    return pts.sort((p, q) => p.i - q.i);
  };

  let xMin = Infinity;
  let xMax = -Infinity;
  for (let y = y0; y < yCortePx; y++) {
    const c = linhas[y];
    if (!c.length) continue;
    xMin = Math.min(xMin, c[0].x0);
    xMax = Math.max(xMax, c[c.length - 1].x1);
  }

  // As sementes: a meia-altura da cabeça para os lados (onde a borda é vertical) e
  // o eixo para a cúpula e a base (onde ela é horizontal).
  const yMeio = Math.round((y0 + yCortePx) / 2);
  const xMeio = Math.round((xMin + xMax) / 2);

  const esqBruta = trecho((y) => lado(y, 0), yMeio, y0 + 2, yCortePx - 3);
  const dirBruta = trecho((y) => lado(y, 1), yMeio, y0 + 2, yCortePx - 3);
  /** 6 unidades do `viewBox`, em pixel. Ver `degrau` acima. */
  const DEGRAU = 6 / fator;
  const topoBruto = trecho(
    (x) => borda(x, 0),
    xMeio,
    Math.round(xMin) + 2,
    Math.round(xMax) - 2,
    DEGRAU,
  );
  const baseBruta = trecho(
    (x) => borda(x, 1),
    xMeio,
    Math.round(xMin) + 2,
    Math.round(xMax) - 2,
    DEGRAU,
  );

  if (!esqBruta.length || !dirBruta.length || !topoBruto.length || !baseBruta.length)
    throw new Error("linha-de-centro: um dos quatro trechos do contorno da cabeça saiu vazio");

  /**
   * ONDE A CABEÇA ACABA — e a varredura por linha não sabe sozinha.
   *
   * A janela dos lados vai até o corte cabeça↔tronco, e nas últimas linhas antes
   * dele **a tinta mais à esquerda já é o ombro do tronco**, não a base da cabeça:
   * o ombro sai de trás por volta de x 136, que é quase exatamente onde a base da
   * cabeça está passando. A leitura é uma corrida estreita e legítima, só que de
   * outra peça — e ela puxava o lado esquerdo 8 unidades abaixo do fundo real,
   * fazendo o contorno voltar sobre si na emenda.
   *
   * O fundo da cabeça é a varredura por COLUNA que sabe: ela vê o contorno inteiro
   * de cima para baixo e para no último traço da cabeça. O ponto mais fundo dela é o
   * fim da cabeça, e nenhum ponto de lado pode estar abaixo disso. Mesma coisa no
   * alto, por simetria de argumento.
   */
  const yFundo = Math.max(...baseBruta.map((p) => p.v));
  const yTeto = Math.min(...topoBruto.map((p) => p.v));
  const esq = esqBruta.filter((p) => p.i >= yTeto && p.i <= yFundo);
  const dir = dirBruta.filter((p) => p.i >= yTeto && p.i <= yFundo);

  if (!esq.length || !dir.length)
    throw new Error("linha-de-centro: os lados da cabeça sumiram ao cortar pelo fundo");

  /**
   * As calotas e os lados se SOBREPÕEM, e a sobreposição tem de ser cortada.
   *
   * Perto dos 45° as duas varreduras são legíveis, então a cúpula continua válida
   * descendo pelo flanco e o lado continua válido subindo pela cúpula. Concatenar as
   * quatro tal como saem faz o contorno andar até 45°, **voltar** pelo mesmo trecho
   * e seguir — um laço que dobra sobre si, com pontos fora de ordem no meio.
   *
   * O corte é o único que não precisa de constante: a calota fica com o que está
   * ACIMA da linha mais alta que os lados conseguiram ler, e a base com o que está
   * abaixo da mais baixa. Cada pedaço do contorno passa a ter um dono só, e a emenda
   * cai exatamente sobre os pontos que as duas varreduras compartilham.
   */
  const cortar = (cap: { i: number; v: number }[], yLim: number, ladoDe: number, ladoAte: number) =>
    cap.filter((p) => p.i > ladoDe && p.i < ladoAte && (yLim < 0 ? p.v < -yLim : p.v > yLim));
  const topo = cortar(topoBruto, -esq[0].i, esq[0].v, dir[0].v);
  const base = cortar(
    baseBruta,
    esq[esq.length - 1].i,
    esq[esq.length - 1].v,
    dir[dir.length - 1].v,
  );

  // Sentido horário a partir da cúpula: topo →, direita ↓, base ←, esquerda ↑.
  const P = (x: number, y: number, via: "linha" | "coluna"): Ponto => ({ x: ux(x), y: uy(y), via });
  return [
    ...topo.map((p) => P(p.i, p.v, "coluna")),
    ...dir.map((p) => P(p.v, p.i, "linha")),
    ...[...base].reverse().map((p) => P(p.i, p.v, "coluna")),
    ...[...esq].reverse().map((p) => P(p.v, p.i, "linha")),
  ];
}

/**
 * A ESPESSURA DO TRAÇO, corrigida pela inclinação da borda.
 *
 * Se a borda anda `m` unidades em x por unidade de y, a corrida horizontal mede
 * `t · √(1 + m²)`. A correção divide por esse fator; e ainda assim as bordas com
 * `|m| > 1` ficam de fora, porque lá o fator passa de 1,41 e amplifica o ruído de
 * discretização junto com o sinal.
 */
function medirEspessura(amostras: Amostra[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < amostras.length - 1; i++) {
    const a = amostras[i];
    const ant = amostras[i - 1];
    const pos = amostras[i + 1];
    if (!a.esq.length || !a.dir.length) continue;
    if (!ant.esq.length || !ant.dir.length || !pos.esq.length || !pos.dir.length) continue;
    const dy = (pos.frac - ant.frac) * ALTURA_CANONICA;
    const lados = [
      { c: a.esq[0], m: (pos.esq[0].centro - ant.esq[0].centro) / dy },
      {
        c: a.dir[a.dir.length - 1],
        m: (pos.dir[pos.dir.length - 1].centro - ant.dir[ant.dir.length - 1].centro) / dy,
      },
    ];
    for (const { c, m } of lados) {
      if (Math.abs(m) > 1) continue;
      out.push(c.espessura / Math.sqrt(1 + m * m));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// O relatório — a tabela pronta para colar
// ---------------------------------------------------------------------------

const n1 = (v: number) => v.toFixed(1);

function percentil(xs: number[], p: number): number {
  const ord = [...xs].sort((a, b) => a - b);
  return ord[Math.min(ord.length - 1, Math.floor(ord.length * p))];
}

/**
 * ALISA O DEGRAU DAS EMENDAS, com uma média móvel por comprimento de arco.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ELA CONSERTA, E POR QUE ELE NÃO É RUÍDO
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou a primeira folha do Bloco 1d por "pequenas quebras" no contorno,
 * no queixo e no topo esquerdo. O diagnóstico de suavidade, no fim deste arquivo,
 * localizou **três** e deu a elas uma assinatura única: uma virada de mais de 20°
 * seguida imediatamente de uma virada negativa — a curva passa do ponto e volta. E
 * as três caem no MESMO tipo de lugar: onde um ponto vindo da varredura por `linha`
 * encosta num vindo da varredura por `coluna`.
 *
 * A causa não é falta de pontos nem ruído de extração. O contorno cru é limpo: o
 * resíduo contra um ajuste local mede **0,09 unidade**, um quinto de pixel do raster.
 * O que existe é um **degrau sistemático de ~1 unidade entre as duas varreduras**.
 * Perto dos 45° as duas são legíveis e descrevem a mesma borda, mas discretizam em
 * direções diferentes — uma acha o centro do traço percorrendo x, a outra percorrendo
 * y —, e o viés de cada uma tem sinal próprio. `cortar()` escolhe onde uma acaba e a
 * outra começa, e o degrau fica inteiro naquele ponto.
 *
 * Uma spline melhor não conserta isso, e foi o que a troca para Catmull-Rom
 * centrípeta mostrou: ela alisou o topo e **deixou o queixo como estava**, porque
 * ali o defeito está no dado e não na curva.
 *
 * ---------------------------------------------------------------------------
 * POR QUE MÉDIA MÓVEL, E POR QUE ELA NÃO CUSTA FORMA
 * ---------------------------------------------------------------------------
 *
 * O degrau é uma descontinuidade de 1 unidade num contorno amostrado a cada 0,4
 * unidade: é o componente de frequência mais alta que existe no dado. Uma média
 * móvel de janela curta o distribui pelos vizinhos e não tem o que fazer com o
 * resto, porque o resto varia devagar.
 *
 * A janela é de 6 unidades de arco — **meio traço**. O que ela custa é atalho de
 * canto, e o atalho de uma média móvel numa curva de raio `R` vale `j²/8R`: nos
 * cantos mais fechados da cabeça (`R` ≈ 30) isso dá **0,15 unidade**, ou um terço de
 * pixel do raster. Está abaixo do próprio ruído de extração, e três ordens de
 * grandeza abaixo do degrau que ela remove.
 *
 * Ela roda **antes** de decimar, e a ordem importa: alisar 2 600 pontos distribui o
 * degrau; alisar 42 mexeria na forma.
 */
function suavizar(pts: Ponto[], janela: number): Ponto[] {
  const N = pts.length;
  if (N < 8) return pts;
  // Comprimento de arco acumulado, para a janela ser medida em unidades do
  // `viewBox` e não em número de amostras — a densidade de pontos varia muito ao
  // longo do contorno, e uma janela em amostras alisaria demais onde eles são densos.
  const passo: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % N];
    passo.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  const meia = janela / 2;
  return pts.map((p, i) => {
    let sx = p.x;
    let sy = p.y;
    let n = 1;
    for (const sentido of [1, -1] as const) {
      let d = 0;
      for (let k = 1; k < N / 2; k++) {
        const j = (i + sentido * k + N * N) % N;
        d += passo[sentido === 1 ? (i + k - 1 + N * N) % N : j];
        if (d > meia) break;
        sx += pts[j].x;
        sy += pts[j].y;
        n++;
      }
    }
    return { x: sx / n, y: sy / n, via: p.via };
  });
}

/**
 * Reduz o contorno a `alvo` pontos, pelo erro de corda.
 *
 * **O critério não mora mais aqui** — ele foi para `decimarPorCorda()` em `medir.ts`
 * quando a régua de cabelo passou a precisar do mesmo, e a alternativa era ter duas
 * cópias livres para divergir. A tabela das três alternativas medidas, e o porquê de
 * mais pontos piorarem no contorno do crânio, estão no docstring de lá.
 *
 * Os dois parâmetros que sobram aqui são os que descrevem ESTA curva, e não o
 * critério: o contorno do crânio é **fechado**, e as emendas entre a varredura por
 * linha e a por coluna pedem o colapso de 5 unidades — menos de meio traço, então
 * nada que se veja cabe entre dois pontos colapsados.
 */
const decimar = (pts: Ponto[], alvo: number): Ponto[] =>
  decimarPorCorda(pts, alvo, { fechado: true, colapso: 5 });

/**
 * A CONFERÊNCIA CRUZADA — as mesmas medidas, nas duas fontes.
 *
 * É o número que autoriza tratar um trace como fonte de geometria. O line-art e o
 * PNG são leituras **independentes** do mesmo desenho, por réguas independentes:
 * aqui, corridas de tinta sobre curvas de Bézier rasterizadas; lá, `medir()` sobre
 * os pixels originais. Se as duas concordarem em fração de unidade, nenhuma das
 * duas está inventando forma — e se discordarem, o trace não serve e é melhor
 * saber disso antes de a tabela dele virar a silhueta de 14 trajes.
 *
 * A meia-largura do PNG é a da silhueta EXTERNA, então ela leva meio traço de
 * desconto para virar linha de centro. O traço descontado é o que o PNG mede, não o
 * que o line-art mede: senão a conferência estaria usando um número da fonte que
 * ela quer conferir.
 */
async function conferir(L: Leitura) {
  const { data, info } = await sharp(readFileSync(PNG))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const m = medir({ data, w: info.width, h: info.height, canais: info.channels });

  // A cabeça é medida no TERÇO SUPERIOR nas duas fontes, e a restrição não é
  // detalhe: `medir()` define a largura da cabeça como a maior do terço de cima
  // justamente para **excluir as orelhas**, e o contorno daqui as inclui. Comparar
  // o máximo do contorno inteiro contra aquele número acusa 22 unidades de
  // discordância que são só a saliência da orelha direita — um desacordo de régua,
  // não de desenho, e do tipo que faz desconfiar da fonte certa.
  //
  // E é **meia largura total**, não distância ao eixo do tronco: a cabeça tem eixo
  // próprio, 7 unidades à direita (`GIRO.eixoCabeca`), então medir do eixo do tronco
  // devolve o lado direito, 189,1, contra os 181,9 do PNG — e a discordância de 7,2
  // é o giro, que os dois desenhos têm igual.
  const yCabecaTopo = Y_TOPO + 0.42 * ALTURA_CANONICA * L.fracCabeca;
  const noTopo = L.cabeca.filter((p) => p.y <= yCabecaTopo).map((p) => p.x);
  const meiaCabecaTrace = (Math.max(...noTopo) - Math.min(...noTopo)) / 2;
  const meiaTroncoTrace = Math.max(
    ...L.tronco.map((t) => Math.max(CENTRO_X - t.esq, t.dir - CENTRO_X)),
  );
  const meiaCabecaPng = (m.cabeca.larg - m.espessuraTraco) / 2;
  const meiaTroncoPng = (m.tronco.largMax - m.espessuraTraco) / 2;

  console.log(`\nCONFERÊNCIA CRUZADA — line-art contra ${PNG}`);
  const linha = (rot: string, a: number, c: number) =>
    console.log(
      `  ${rot.padEnd(28)} trace ${n1(a).padStart(6)}   PNG ${n1(c).padStart(6)}   ` +
        `discordância ${n1(Math.abs(a - c))}`,
    );
  linha("meia-largura da cabeça", meiaCabecaTrace, meiaCabecaPng);
  linha("meia-largura do tronco", meiaTroncoTrace, meiaTroncoPng);
  linha("espessura do traço", percentil(L.espessuras, 0.5), m.espessuraTraco);
}

async function main() {
  const L = await ler();

  console.log(`line-art lido: ${LINE_ART}`);
  console.log(
    `  altura útil ${L.alturaUtilPx} px → ${ALTURA_CANONICA} unidades (fator ${L.fator.toFixed(4)})`,
  );
  console.log(`  corte cabeça ↔ tronco em frac ${L.fracCabeca.toFixed(3)}`);

  // --- a espessura do traço ---
  const esp = L.espessuras;
  console.log(`\nESPESSURA DO TRAÇO — corrigida pela inclinação, ${esp.length} leituras`);
  console.log(
    `  p10 ${n1(percentil(esp, 0.1))}   mediana ${n1(percentil(esp, 0.5))}   ` +
      `p90 ${n1(percentil(esp, 0.9))}   (TRACO hoje: ${TRACO})`,
  );

  await conferir(L);

  // --- o contorno da cabeça, pronto para colar ---
  const bruto = L.cabeca;
  const daLinha = bruto.filter((p) => p.via === "linha").length;
  console.log(
    `\nCONTORNO DA CABEÇA — ${bruto.length} pontos de linha de centro ` +
      `(${daLinha} por varredura de linha, ${bruto.length - daLinha} por coluna)`,
  );
  console.log(
    `  caixa: x ${n1(Math.min(...bruto.map((p) => p.x)))}–${n1(Math.max(...bruto.map((p) => p.x)))}   ` +
      `y ${n1(Math.min(...bruto.map((p) => p.y)))}–${n1(Math.max(...bruto.map((p) => p.y)))}`,
  );
  // --- AS EMENDAS, CRUAS: onde uma varredura passa a bola para a outra ---
  //
  // As quebras que o Doug viu na folha do Bloco 1d caíam todas em junção de
  // varredura, e "degrau" era só a primeira hipótese. Um degrau, uma lacuna e uma
  // sobreposição produzem o mesmo sintoma na folha e pedem consertos diferentes:
  //
  //  - **degrau** — as duas varreduras discordam de ~1 unidade na mesma posição de
  //    arco. Alisa com média móvel;
  //  - **lacuna** — falta um pedaço de borda entre a última leitura de uma e a
  //    primeira da outra. A curva corta reto e vira de uma vez;
  //  - **sobreposição** — as duas descrevem o mesmo pedaço e o contorno DOBRA SOBRE
  //    SI. Nenhuma suavização conserta: é preciso cortar o trecho repetido.
  //
  // Isto imprime o salto de posição em cada junção, que é o que separa os três.
  console.log(`\n  AS EMENDAS — o salto no contorno cru onde a varredura troca`);
  for (let i = 0; i < bruto.length; i++) {
    const a = bruto[i];
    const b = bruto[(i + 1) % bruto.length];
    if (a.via === b.via) continue;
    const passo = Math.hypot(b.x - a.x, b.y - a.y);
    const tipico = 600 / bruto.length;
    console.log(
      `    ${a.via} → ${b.via}  em (${n1(a.x)}, ${n1(a.y)}) → (${n1(b.x)}, ${n1(b.y)})   ` +
        `salto ${n1(passo)} u   (passo típico ${n1(tipico)})` +
        (passo > 8 * tipico ? "   <- LACUNA" : ""),
    );
  }

  const alvo = decimar(suavizar(bruto, JANELA_SUAVE), ALVO_PONTOS);
  console.log(`  decimado para ${alvo.length} pontos pelo erro de corda:\n`);
  console.log(`  contorno: [`);
  for (const p of alvo) console.log(`    { x: ${n1(p.x)}, y: ${n1(p.y)} },`);
  console.log(`  ],`);

  // --- O DIAGNÓSTICO DA SUAVIDADE, e ele existe por uma reprovação concreta ---
  //
  // O Doug reprovou a primeira folha do Bloco 1d por "pequenas quebras" no contorno,
  // no queixo e no topo esquerdo. Duas causas eram possíveis e a tabela acima não
  // distingue as duas: parametrização da spline (consertada em `geometria.ts`) ou a
  // **emenda entre as duas varreduras** — a por linha e a por coluna descrevem o
  // mesmo pedaço de borda perto dos 45°, e um desacordo de uma unidade entre elas
  // vira um repuxo que nenhuma spline conserta.
  //
  // Isto imprime, para cada ponto que sobreviveu: de qual varredura ele veio, quanto
  // a direção da borda vira ali, e o **raio de curvatura local** que essa virada
  // implica.
  //
  // O CRITÉRIO É A REVERSÃO DE SINAL, E NÃO O TAMANHO DA VIRADA. A primeira versão
  // deste diagnóstico marcava toda virada acima de 18° e gritava à toa: no canto do
  // queixo, com os pontos a 26 unidades e o canto com raio 48, 31,7° é exatamente a
  // curva que a forma tem. Virada grande com passo grande é canto; o defeito é
  // outro.
  //
  // O contorno desta cabeça é convexo em toda parte, então **a direção só pode virar
  // para um lado**. Uma reversão de sinal é a curva passando do ponto e voltando, que
  // é literalmente o repuxo que se vê na tela. Ela não depende de quantos pontos há
  // nem de quão fechado é o canto, e por isso é o critério certo.
  //
  // O raio vai junto porque separa dois consertos: reversão com raio grande é degrau
  // de emenda (alisa); com raio menor que um traço, é ponto no lugar errado.
  const ang = (a: Ponto, b: Ponto) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  console.log(`\n  SUAVIDADE — virada da borda em cada ponto; reversão de sinal é o defeito`);
  console.log(`   #   x        y       via      passo   virada    raio`);
  let reversoes = 0;
  const viradas: number[] = [];
  for (let i = 0; i < alvo.length; i++) {
    const ant = alvo[(i - 1 + alvo.length) % alvo.length];
    const p = alvo[i];
    const pos = alvo[(i + 1) % alvo.length];
    let vira = ang(p, pos) - ang(ant, p);
    while (vira > 180) vira -= 360;
    while (vira < -180) vira += 360;
    viradas.push(vira);
  }
  // O sinal dominante é o do contorno inteiro: a soma das viradas de um laço fechado
  // é ±360°, e o sinal dela diz para que lado esta cabeça é convexa.
  const sentido = Math.sign(viradas.reduce((s, v) => s + v, 0));
  for (let i = 0; i < alvo.length; i++) {
    const ant = alvo[(i - 1 + alvo.length) % alvo.length];
    const p = alvo[i];
    const passo = Math.hypot(p.x - ant.x, p.y - ant.y);
    const rad = Math.abs((viradas[i] * Math.PI) / 180);
    const raio = rad > 1e-6 ? passo / (2 * Math.sin(rad / 2)) : Infinity;
    const inverteu = Math.sign(viradas[i]) === -sentido && Math.abs(viradas[i]) > 1.5;
    if (inverteu) reversoes++;
    console.log(
      `  ${String(i).padStart(2)}  ${n1(p.x).padStart(6)}  ${n1(p.y).padStart(6)}  ` +
        `${p.via.padEnd(7)}  ${n1(passo).padStart(5)}  ${viradas[i].toFixed(1).padStart(6)}°  ` +
        `${(isFinite(raio) ? n1(raio) : "—").padStart(6)}` +
        (inverteu ? "   <- REVERSÃO" : ""),
    );
  }
  console.log(
    `\n  ${reversoes} reversão(ões) de curvatura em ${alvo.length} pontos` +
      (reversoes ? "   — o contorno REPUXA nesses pontos" : "   — o contorno é convexo em toda parte"),
  );

  // --- o tronco ---
  //
  // O tronco sai como **meia-largura de linha de centro por altura**, e não como as
  // duas bordas: uma tabela de meias larguras é metade dos números para a mesma
  // forma. A assimetria vem impressa junto para que a simplificação seja auditável e
  // não presumida — ela é de 3,7 unidades, e está toda na linha mais alta, que fica
  // ESCONDIDA sob a cabeça (o tronco só passa a aparecer em y ≈ 347). Nas alturas
  // visíveis os dois lados concordam dentro de meia unidade.
  //
  // A decimação é a mesma do contorno, pelo erro de corda, e pelo mesmo motivo: o
  // perfil é lido em 22 alturas e cada uma vira um segmento cúbico por lado no path.
  // 44 cúbicas para uma cápsula é desperdício de bytes num arquivo com teto de 8 KB.
  const perfilTronco: Ponto[] = L.tronco.map((t) => ({
    x: (t.dir - t.esq) / 2,
    y: t.y,
    via: "linha",
  }));
  const troncoMagro = decimar(perfilTronco, 7);
  const desvio = Math.max(
    ...L.tronco.map((t) => Math.abs(CENTRO_X - t.esq - (t.dir - CENTRO_X))),
  );
  console.log(
    `\nTRONCO — meia-largura de linha de centro; assimetria máxima entre os lados ${n1(desvio)}`,
  );
  console.log(`  ${L.tronco.length} alturas lidas, decimado para ${troncoMagro.length}:\n`);
  console.log(`  perfil: [`);
  for (const t of troncoMagro) console.log(`    { y: ${n1(t.y)}, meio: ${n1(t.x)} },`);
  console.log(`  ],`);

  // --- a banda das orelhas: quantos traços existem de cada lado ---
  //
  // É a leitura que decide a orelha esquerda, e ela é uma CONTAGEM, não uma medida
  // de posição. Do lado esquerdo, entre frac 0,32 e 0,37, a referência tem UM traço
  // — a borda da orelha *vira* a silhueta, e não há borda de cabeça por trás dela.
  // Do lado direito são dois: a borda da cabeça continua, e a orelha é um arco fora
  // dela. Desenhar dois à esquerda é o que faz a orelha ler como peça colada.
  console.log(`\nBANDA DAS ORELHAS — distância do eixo do tronco, espessura entre parênteses`);
  console.log(`\n   frac    ESQUERDA                              DIREITA`);
  for (const a of L.amostras) {
    if (a.frac < 0.24 || a.frac > 0.42) continue;
    if (!a.esq.length || !a.dir.length) continue;
    const fmt = (cs: Corrida[]) =>
      cs
        .map((c) => `${n1(Math.abs(c.centro - CENTRO_X))}(${n1(c.espessura)})`)
        .join("  ")
        .padEnd(36);
    console.log(`  ${a.frac.toFixed(3)}  ${fmt(a.esq)}  ${fmt(a.dir)}`);
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
