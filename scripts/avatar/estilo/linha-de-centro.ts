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
import { ALTURA_CANONICA, medir, naColuna, naLinha, type Bitmap, type Corrida } from "./medir";

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
 * Reduz o contorno a `alvo` pontos, **pelo erro de corda** e não por passo fixo.
 *
 * Passo fixo gasta pontos onde a curva é reta e falta onde ela vira — e é
 * justamente nas viradas (a cúpula, a saliência da orelha, o queixo) que a forma
 * mora. Aqui um ponto só sobrevive se removê-lo afastasse a curva mais que os
 * outros: a cada rodada some o ponto cuja retirada custa menos.
 */
function decimar(pts: Ponto[], alvo: number): Ponto[] {
  // Primeiro colapsa vizinhos quase coincidentes. Eles aparecem nas EMENDAS entre a
  // varredura por linha e a por coluna — os dois trechos descrevem o mesmo pedaço de
  // borda e cada um contribui o seu ponto final. Erro de corda não os remove (dois
  // pontos colados são colineares com quase tudo, então custam pouco pelos dois
  // lados), e uma Catmull-Rom que passa por dois pontos a 3 unidades de distância
  // ganha um laço ali. Distância bruta é o critério certo, e não curvatura — 5
  // unidades é menos de meio traço, então nada que se veja cabe entre eles.
  const juntos: Ponto[] = [];
  for (const p of pts) {
    const ult = juntos[juntos.length - 1];
    if (ult && Math.hypot(p.x - ult.x, p.y - ult.y) < 5) continue;
    juntos.push(p);
  }
  const v = juntos;
  while (v.length > alvo) {
    let pior = 1;
    let menorCusto = Infinity;
    for (let i = 0; i < v.length; i++) {
      const a = v[(i - 1 + v.length) % v.length];
      const p = v[i];
      const c = v[(i + 1) % v.length];
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const custo = Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x)) / len;
      if (custo < menorCusto) {
        menorCusto = custo;
        pior = i;
      }
    }
    v.splice(pior, 1);
  }
  return v;
}

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
  const alvo = decimar(bruto, 42);
  console.log(`  decimado para ${alvo.length} pontos pelo erro de corda:\n`);
  console.log(`  contorno: [`);
  for (const p of alvo) console.log(`    { x: ${n1(p.x)}, y: ${n1(p.y)} },`);
  console.log(`  ],`);

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
