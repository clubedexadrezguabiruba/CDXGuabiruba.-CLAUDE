/**
 * P4 — DA MÁSCARA AO TIPO DO PROJETO: `{t,y}` para a massa, `{x,y}` para o que
 * escapa do crânio.
 *
 * ---------------------------------------------------------------------------
 * A CONVERSÃO PIXEL → `viewBox` É FIXA, E É O GANHO DA ROTA INTEIRA
 * ---------------------------------------------------------------------------
 *
 * No pipeline vigente esta etapa é a mais cara: a arte vem de um gerador que
 * desenha outra cabeça, então `importar-peca.ts` acha os olhos por razão de
 * aspecto, acha a guia do crânio por contenção de caixas, e registra uma cabeça
 * contra a outra por marcos — e mesmo assim sobra o resíduo medido na `ficha.md`
 * (cúpula do gerador 163 u contra 246 do kokeshi, anisotropia cega em 0,56%,
 * coroa cobrindo 8,3% onde se exige 100).
 *
 * Aqui nada disso existe, porque a arte nasceu sobre um render do compositor: a
 * conversão é `u = (px − origem) / 1,2`, exata, e o Gate −1 já provou que a arte
 * devolvida está registrada (deslocamento 0, escala 100,00%). **`acharOlhos` não
 * é chamado. Guia de cabeça não é procurada. Não há duas cabeças para comparar.**
 *
 * ---------------------------------------------------------------------------
 * A PARTIÇÃO MASSA / EXTENSÃO É A DO COMPOSITOR, NÃO UMA INVENÇÃO
 * ---------------------------------------------------------------------------
 *
 * `compositor.ts` desenha a massa do cabelo DENTRO de `<g clip-path="cabeca">` e
 * as extensões FORA dele, antes e depois da cabeça. Ou seja: o produto já tem um
 * canal para tinta que rompe a silhueta — é o que o `moicano` usa hoje. O que não
 * havia era o caminho de importação: `importar-peca.ts` reprova toda `extensao`
 * com *"o caminho de extensão não está medido"*, dívida declarada do checkpoint D.
 *
 * Então a partição é geométrica e segue o clip:
 *
 *  - **massa** = peça ∩ crânio → `{t,y}`, porque `t` é fração da largura da cabeça
 *    naquela altura e só faz sentido onde a cabeça tem largura;
 *  - **extensões** = peça ∖ crânio → `{x,y}` absoluto, que é o que o tipo
 *    `Extensao` pede, dilatadas de volta `SANGRIA` unidades para dentro do crânio
 *    para não abrir costura entre as duas camadas.
 *
 * A sangria de 10 unidades não é folga estética: é o mesmo número que
 * `geometria.ts` declara como sobreposição mínima de tinta sobre clip, e o gate
 * de ancoragem do catálogo (`cabelo.test.ts`) cobra ≥ `SANGRIA`.
 *
 * ---------------------------------------------------------------------------
 * O TETO DE `y = 0` É UM FATO, E ELE APARECE COMO NÚMERO
 * ---------------------------------------------------------------------------
 *
 * A peça extraída sobe até **y = −40 u**, ou seja, 40 unidades ACIMA do `viewBox`.
 * Nada ali é desenhável: o viewport corta sem erro e sem aviso (doc 14, T1.5).
 *
 * Este arquivo NÃO escolhe entre comprimir e deixar cortar. Ele produz as duas
 * peças — `comprimida`, via o `comprimirNoTeto` que já existe, e `crua`, que
 * guilhotina — e a folha mostra as duas lado a lado. A escolha é visual e é do
 * Doug, porque comprimir 56% de altura de ponta é direção de arte, não medida.
 */

import { writeFileSync, mkdirSync } from "fs";

import sharp from "sharp";

import type { Cabelo, PontoFranja } from "../../../src/lib/avatar/estilo/cabelo";
import { ESCALA_PADRAO } from "../../../src/lib/avatar/estilo/compositor";
import {
  CAIXA_CABECA,
  SANGRIA,
  TRACO,
  VIEWBOX,
  pathCabeca,
} from "../../../src/lib/avatar/estilo/geometria";
import { decimarPorCorda, desvioDaCorda } from "../estilo/medir";
import { arcosComPreto } from "../estilo/importar-peca";
import {
  aplicarK,
  autoIntersecoes,
  bordaOrdenada,
  comprimirNoTeto,
  escolherN,
  paraTY,
  suavizarLaco,
} from "../estilo/tracar-cabelo";
import { ESCALA, LADO, ORIGEM, PASTA, paraUnidade, regiaoDoPixel, saidaDaArte } from "./base";
import { extrair } from "./extrair";
import { componentes, dilatar } from "./pixels";

/** A máscara do crânio no MESMO canvas da arte. */
async function mascaraDoCranio(): Promise<Uint8Array> {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" width="${LADO}" height="${LADO}">` +
    `<rect width="${LADO}" height="${LADO}" fill="#000"/>` +
    `<svg x="${ORIGEM.x}" y="${ORIGEM.y}" width="${VIEWBOX.w * ESCALA}" height="${VIEWBOX.h * ESCALA}" ` +
    `viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}"><path d="${pathCabeca()}" fill="#fff"/></svg></svg>`;
  const { data, info } = await sharp(Buffer.from(svg), { density: 300 })
    .resize(LADO, LADO, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(info.width * info.height);
  for (let i = 0; i < m.length; i++) m[i] = data[i] > 127 ? 1 : 0;
  return m;
}

/**
 * ONDE A ARTE PÔS PRETO, ponto denso a ponto denso — a sonda pela normal.
 *
 * A extração já separou o traço da arte num papel próprio (`papeis === 4`,
 * `extrair.ts:130,266-269`); o que faltava era perguntar, para cada ponto do
 * laço, se há traço ali. A janela é meio traço para cada lado, que é a mesma
 * expectativa que o pipeline vigente declara em `CONFERENCIA = [4, 8]`: a borda
 * do preenchimento fica meio traço da linha de centro do preto.
 *
 * Sonda para os DOIS lados porque a máscara é `teal ∪ traço` — onde o preto
 * sobreviveu, a borda é a beira externa dele e o preto está para dentro; onde o
 * preto foi descartado por coincidir com o da base (`extrair.ts:188-190`), a
 * borda é a beira do teal e não há preto de lado nenhum. É essa segunda condição
 * que faz o arco NÃO nascer ali — e é o certo, porque ali quem desenha preto já é
 * o contorno da cabeça.
 */
function sondarTraco(
  borda: readonly { x: number; y: number }[],
  papeis: Uint8Array,
  w: number,
  h: number,
): boolean[] {
  const N = borda.length;
  const R = 4; // vizinhos de cada lado para estimar a tangente
  const PASSO = 0.5; // px, o mesmo de `PASSO_NORMAL` do pipeline vigente
  const ALCANCE = (TRACO / 2) * ESCALA; // meio traço, em pixels do canvas
  const fora: boolean[] = [];
  for (let k = 0; k < N; k++) {
    const a = borda[(k - R + N) % N];
    const b = borda[(k + R) % N];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    let achou = false;
    for (let t = -ALCANCE; t <= ALCANCE && !achou; t += PASSO) {
      const x = Math.round(borda[k].x + nx * t);
      const y = Math.round(borda[k].y + ny * t);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if (papeis[y * w + x] === 4) achou = true;
    }
    fora.push(achou);
  }
  return fora;
}

/**
 * QUANTO DA BORDA DA MÁSCARA É CORTE DE REGIÃO, e não desenho.
 *
 * `mascaraDaPeca` descarta o pixel da peça que cai sobre o `rosto` ANTES de
 * qualquer componente ser formada. Numa peça que cobre o olho, isso amputa a peça
 * — e a borda que sobra corre em linha reta sobre a fronteira da caixa do rosto.
 *
 * Sem este número, um erro de corda alto se lê como "a arte é ruim". Com ele, dá
 * para separar: borda amputada alta significa que quem desenhou aquela linha foi
 * a região protegida, não o Doug.
 *
 * **`corpo` SAIU desta conta no Bloco 12, e sair era obrigatório.** A extração
 * deixou de recortar o tronco, então contar o tronco aqui devolveria amputação
 * onde não há corte nenhum — a régua passaria a acusar um defeito que a decisão
 * de arte eliminou. É o modo de falha que esta rota já viu quatro vezes: régua
 * que sobrevive à mudança do que ela mede e passa a medir outra coisa.
 */
function bordaAmputada(m: Uint8Array, w: number, h: number): number {
  let borda = 0;
  let cortada = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!m[i]) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const q = (y + dy) * w + (x + dx);
        if (m[q]) continue;
        borda++;
        const r = regiaoDoPixel(x + dx, y + dy);
        if (r === "rosto") cortada++;
        break;
      }
    }
  }
  return borda ? cortada / borda : 0;
}

/** Área da componente que `bordaOrdenada` de fato percorre — ela só percorre uma. */
function areaDaPrimeiraComponente(m: Uint8Array, w: number, h: number): number {
  let ini = -1;
  for (let i = 0; i < m.length; i++)
    if (m[i]) {
      ini = i;
      break;
    }
  if (ini < 0) return 0;
  const visto = new Uint8Array(m.length);
  const fila = new Int32Array(m.length);
  let a = 0,
    b = 0,
    area = 0;
  fila[b++] = ini;
  visto[ini] = 1;
  while (a < b) {
    const p = fila[a++];
    area++;
    const x = p % w;
    const y = (p / w) | 0;
    for (const q of [
      x > 0 ? p - 1 : -1,
      x < w - 1 ? p + 1 : -1,
      y > 0 ? p - w : -1,
      y < h - 1 ? p + w : -1,
    ])
      if (q >= 0 && m[q] && !visto[q]) (visto[q] = 1), (fila[b++] = q);
  }
  return area;
}

/**
 * Área mínima para uma componente virar forma: **~40 u²**. Abaixo disso é
 * serrilhado de borda, não desenho.
 */
const PISO_FORMA = 40 * ESCALA * ESCALA;

/** A máscara reduzida a UMA componente, a que contém `semente`. */
function soAComponente(m: Uint8Array, w: number, h: number, semente: number): Uint8Array {
  const so = new Uint8Array(m.length);
  const fila = new Int32Array(m.length);
  let ini = 0,
    fim = 0;
  fila[fim++] = semente;
  so[semente] = 1;
  while (ini < fim) {
    const p = fila[ini++];
    const x = p % w;
    const y = (p / w) | 0;
    for (const q of [
      x > 0 ? p - 1 : -1,
      x < w - 1 ? p + 1 : -1,
      y > 0 ? p - w : -1,
      y < h - 1 ? p + w : -1,
    ])
      if (q >= 0 && m[q] && !so[q]) (so[q] = 1), (fila[fim++] = q);
  }
  return so;
}

/** Ponto do laço decimado que ainda sabe de qual ponto denso ele veio. */
type PontoComIndice = { x: number; y: number; i: number };

export interface Laco {
  pts: PontoComIndice[];
  n: number;
  piso: number;
  desvio: number;
  /** Arcos `[primeiro, último]` em índice do laço decimado — vira `Cabelo.linhas`. */
  arcos: [number, number][];
  /** Fração do laço coberta por arco de traço. */
  fracaoTracada: number;
  /**
   * O QUE A ARTE DE FATO PINTOU DE PRETO, antes da regra de maioria decidir.
   *
   * `fracaoTracada` conta TRECHOS do laço decimado, e um trecho vira "traçado"
   * quando a MAIORIA dos ~75 pontos densos dele tem preto ao lado
   * (`arcosComPreto`, `importar-peca.ts:745`). Isso é a régua certa para EMITIR o
   * arco — mas quem lê `fracaoTracada = 1,00` não consegue distinguir dois casos
   * opostos: a arte contornou a peça inteira, ou a arte contornou 60% e todos os
   * trechos passaram raspando dos 50%.
   *
   * `densa` é a mesma sonda antes do arredondamento: a fração dos pontos DENSOS
   * com preto, e a fração de cada trecho separadamente. É a diferença entre um
   * contorno sólido e uma lista de arcos que está a um pixel de ser outra.
   */
  densa: { fracao: number; porTrecho: number[] };
  /**
   * A VARREDURA DE N, guardada — porque `piso` sozinho não diz se acabou.
   *
   * `escolherN` testa N em `[8…64]` e devolve o menor desvio alcançado. Quando o
   * escolhido é **64**, que é o último da escala, `piso === desvio` tem duas
   * leituras opostas e o número não as separa: ou a curva encostou no piso da
   * ARTE (mais pontos não compram nada — é o caso que o docstring de `escolherN`
   * descreve), ou ela ainda estava descendo e o teto a interrompeu.
   *
   * A varredura separa: se o desvio caiu de 48 para 64, a peça está **faltando
   * pontos**, e o que se perde é detalhe de ponta — exatamente o que um cabelo
   * espetado tem de mais caro.
   */
  varredura: { n: number; max: number }[];
  /** Componentes da máscara, e quanta área ficou FORA do laço traçado. */
  componentes: number;
  areaFora: number;
  /** Fração da borda que é corte de região protegida, não desenho. */
  amputada: number;
}

/**
 * Um contorno de máscara virando laço decimado em unidades do `viewBox`.
 *
 * **`bordaOrdenada` percorre UMA componente** (`tracar-cabelo.ts:1508-1516`: ela
 * acha o primeiro pixel em ordem de varredura e caminha um contorno de Moore).
 * Se a máscara tiver duas partes desconexas, a segunda não entra no laço — e até
 * aqui isso acontecia em silêncio. `areaFora` é essa perda, medida. Não é
 * consertada porque `Cabelo.massa` é UM laço fechado (`cabelo.ts:199`):
 * representar dois exigiria mudar o tipo do catálogo.
 */
function laco(
  mascara: Uint8Array,
  w: number,
  h: number,
  papeis?: Uint8Array,
  /**
   * N FORÇADO — **só para experimento, e nunca para o literal que se cola.**
   *
   * `escolherN` escolhe pela varredura e a escala dela para em 64. Quando a
   * varredura mostra que o desvio AINDA CAÍA no último passo (é o caso do
   * espetado: 48→11,6 e 64→5,8), a pergunta *"quanto melhoraria com 96 ou 128?"*
   * só se responde medindo — e medir exige atravessar o teto uma vez, de propósito
   * e declarado.
   *
   * Passar isto NÃO muda o teto de ninguém: `escolherN` continua escolhendo, e a
   * peça que sai de `converter()` sem o argumento é exatamente a de sempre.
   */
  nForcado?: number,
): Laco | null {
  const borda = bordaOrdenada(mascara, w, h);
  if (borda.length < 12) return null;
  const emU = borda.map((p) => paraUnidade(p.x, p.y));
  const suave = suavizarLaco(emU, 5).map((p, i) => ({ ...p, i }));
  const esc = escolherN(suave, true);
  const n = nForcado && nForcado < suave.length ? nForcado : esc.n;
  const red = decimarPorCorda(suave, n, { fechado: true });
  const desvio = desvioDaCorda(suave, [...red, red[0]]).max;

  // A sonda densa sai UMA vez e alimenta duas coisas: os arcos (pela maioria) e a
  // fração crua (sem maioria). Sondar duas vezes seria medir a mesma coisa com
  // duas execuções que podem divergir por um `%` mal escrito.
  const sonda = papeis ? sondarTraco(borda, papeis, w, h) : [];
  const arcos = papeis ? arcosComPreto(red, sonda) : [];
  const trechos = arcos.reduce(
    (s, [de, ate]) => s + ((ate - de + red.length) % red.length || red.length),
    0,
  );

  // A fração densa por TRECHO: cada ponto do laço decimado sabe de qual ponto
  // denso veio (`PontoComIndice.i`), então o trecho k é o intervalo denso de
  // `red[k].i` a `red[k+1].i`, dando a volta no último.
  const porTrecho: number[] = [];
  if (sonda.length) {
    for (let k = 0; k < red.length; k++) {
      const de = red[k].i;
      const ate = red[(k + 1) % red.length].i;
      const passos = ((ate - de + sonda.length) % sonda.length) || sonda.length;
      let com = 0;
      for (let d = 0; d < passos; d++) if (sonda[(de + d) % sonda.length]) com++;
      porTrecho.push(com / passos);
    }
  }

  let total = 0;
  for (let i = 0; i < mascara.length; i++) total += mascara[i];
  const naPrimeira = areaDaPrimeiraComponente(mascara, w, h);

  return {
    pts: red,
    n,
    piso: esc.piso,
    desvio,
    arcos,
    fracaoTracada: red.length ? trechos / red.length : 0,
    densa: {
      fracao: sonda.length ? sonda.filter(Boolean).length / sonda.length : 0,
      porTrecho,
    },
    varredura: esc.varredura,
    componentes: componentes(mascara, w, h).length,
    areaFora: total - naPrimeira,
    amputada: bordaAmputada(mascara, w, h),
  };
}

export interface Convertido {
  peca: Cabelo;
  crua: Cabelo;
  k: number;
  picoAntes: number;
  picoDepois: number;
  /** Quantas formas irmãs a peça tem além da massa, e a área delas. */
  formasIrmas: number;
  areaIrmas: number;
  cruzamentos: number;
  desvios: { massa: number; clara: number };
  /**
   * O MENOR desvio que a curva alcança com QUALQUER N de 8 a 64.
   *
   * É a diferença entre "faltam pontos" e "a arte é assim". `escolherN` já
   * calcula (`tracar-cabelo.ts:2223`) e o valor era descartado aqui. Sem ele, um
   * erro de corda alto se lê como decimação mal escolhida; com ele, piso ≈ erro
   * significa que gastar pontos não compra nada.
   */
  pisos: { massa: number; clara: number };
  n: { massa: number; clara: number };
  /** A varredura de N da massa — ver `Laco.varredura`. Separa "acabou" de "faltou". */
  varredura: { n: number; max: number }[];
  /**
   * Defeito 1: os arcos de traço, e que fração do laço eles cobrem.
   *
   * `densa` é a mesma pergunta ANTES da regra de maioria — ver `Laco.densa`. Um
   * `fracao = 1,00` com `densa.fracao = 0,6` não é um contorno inteiro: é a
   * maioria arredondando 64 trechos para cima.
   */
  traco: { arcos: number; fracao: number; densa: number; porTrecho: number[] };
  /** Perda silenciosa por multi-componente, agora medida. Em px do canvas. */
  perda: { massa: number; clara: number; compsMassa: number; compsClara: number };
  /** Fração da borda da massa que é corte de região protegida, não desenho. */
  amputada: number;
}

export async function converter(
  caminhoArte: string,
  /** N forçado da MASSA — experimento, ver `laco`. A clara segue `escolherN`. */
  nForcado?: number,
): Promise<Convertido> {
  const e = await extrair(caminhoArte);
  const w = e.arte.w;
  const h = e.arte.h;

  // ----------------------------------------------------------- massa e clara
  //
  // **O CONVERTER NÃO DIVIDE MAIS.** A peça é desenhada por cima, sem clip, então
  // não existe fronteira em que cortá-la — e junto com a divisão saíram a máscara
  // do crânio, a dilatação e a `SANGRIA`. Eram três passos que existiam só para
  // costurar duas camadas que agora são uma.
  //
  // As componentes soltas viram formas irmãs do mesmo `<path>` (`M…Z M…Z`).
  const dentro = e.mascara;

  // A clara: os dois tons mais claros do ciano. O tom escuro fica de baixo, que é
  // como o compositor pinta — `massa` recebe `--av-cabelo-s` e `clara`, por cima,
  // recebe `--av-cabelo`.
  const claraMask = new Uint8Array(w * h);
  for (let i = 0; i < claraMask.length; i++) {
    const p = e.papeis[i];
    if (!dentro[i]) continue;
    if (p === 1 || p === 3) claraMask[i] = 1; // massa (tom médio) ou luz
  }

  // Só a MASSA recebe os papéis: é a única camada que leva traço. A clara nunca
  // tem contorno (`compositor.ts:144-146`) e a extensão ganha o dela do próprio
  // compositor (`compositor.ts:168`).
  const lMassa = laco(dentro, w, h, e.papeis, nForcado);
  const lClara = laco(claraMask, w, h);
  if (!lMassa) throw new Error("a peça não tem massa dentro do crânio");

  // AS FORMAS CLARAS ALÉM DA PRIMEIRA — a perda que sumia em silêncio.
  //
  // `bordaOrdenada` percorre uma componente só, e na `entrada-2` isso descartava
  // 3 165 u² de área clara sem nenhum gate acusar. Agora elas têm para onde ir: a
  // peça é multi-forma por construção, e cada pedaço vira um subpath do mesmo
  // `<path>`, sem custar forma do orçamento.
  const clarasExtras: { x: number; y: number }[][] = [];
  let areaRecuperada = 0;
  for (const c of componentes(claraMask, w, h).slice(1)) {
    if (c.area < PISO_FORMA) continue;
    const l = laco(soAComponente(claraMask, w, h, c.semente), w, h);
    if (l) (clarasExtras.push(l.pts), (areaRecuperada += c.area));
  }

  // ------------------------------------------------------- as formas irmãs
  //
  // As componentes ALÉM da primeira: a primeira é o laço da massa, e repeti-la
  // aqui desenharia a peça duas vezes. Elas recebem os papéis como a massa, e é
  // isso que dá a cada uma o próprio contorno declarado — `arcosComPreto` sobre
  // `sondarTraco` pergunta, ponto a ponto, se a ARTE pôs preto ali.
  const formas: { pts: { x: number; y: number }[]; arcos: [number, number][] }[] = [];
  let areaIrmas = 0;
  for (const c of componentes(e.mascara, w, h).slice(1)) {
    if (c.area < PISO_FORMA) continue;
    const l = laco(soAComponente(e.mascara, w, h, c.semente), w, h, e.papeis);
    if (l) {
      formas.push({ pts: l.pts, arcos: l.arcos });
      areaIrmas += c.area;
    }
  }

  // ------------------------------------------------------------- o teto de y
  const todos = [...lMassa.pts, ...formas.flatMap((f) => f.pts)];
  const picoAntes = Math.min(...todos.map((p) => p.y));
  // O TETO É MEDIDO NA ESCALA EM QUE A PEÇA É ENTREGUE, e não no sistema interno.
  //
  // Esta rota produz peça para o produto, e o produto entrega a `ESCALA_PADRAO`
  // desde o Bloco 5. Passar a escala é o que faz a guarda parar de comprimir peça
  // que já cabe: a `entrada` sobra 33 unidades abaixo do teto a 92% e vinha sendo
  // achatada por `k = 0,445` assim mesmo. Ver o docstring de `comprimirNoTeto`.
  const k = comprimirNoTeto(picoAntes, ESCALA_PADRAO);
  const ap = aplicarK(k);
  const picoDepois = Math.min(...todos.map((p) => ap(p).y));

  // O rótulo sai do nome do arquivo. Três artes não podem gerar três literais que
  // se dizem o mesmo `id` do catálogo — era o que acontecia com `"curto"` fixo.
  const rotulo = (caminhoArte.split(/[\\/]/).pop() ?? caminhoArte).replace(/\.png$/i, "");

  const monta = (comprimir: boolean): Cabelo => {
    const f = comprimir ? ap : (p: { x: number; y: number }) => p;
    const massa = lMassa.pts.map((p) => paraTY(f(p))) as PontoFranja[];
    const clara = lClara ? (lClara.pts.map((p) => paraTY(f(p))) as PontoFranja[]) : undefined;
    return {
      id: rotulo as Cabelo["id"],
      nome: `Importado de ${rotulo}.png`,
      massa,
      clara,
      ...(clarasExtras.length
        ? { claras: clarasExtras.map((forma) => forma.map((p) => paraTY(f(p))) as PontoFranja[]) }
        : {}),
      // DEFEITO 1: sem esta lista a peça sai sem traço nenhum na franja — a massa
      // traçada é `fill` puro e quem desenha o preto é `.kk-cabelo-l`, alimentada
      // por `Cabelo.linhas`.
      ...(lMassa.arcos.length ? { linhas: lMassa.arcos } : {}),
      // AS FORMAS IRMÃS, não extensões — e a diferença é o Bloco 4 inteiro.
      //
      // Não há `atras`, porque não há cabeça opaca no caminho: a peça é desenhada
      // por cima de tudo. Não há sangria, porque não há duas camadas para costurar.
      // Cada uma declara os próprios arcos, pelo mesmo `arcosComPreto` da massa.
      ...(formas.length
        ? {
            formas: formas.map((forma) => ({
              forma: forma.pts.map(f),
              ...(forma.arcos.length ? { linhas: forma.arcos } : {}),
            })),
          }
        : {}),
    };
  };

  const cruzamentos =
    autoIntersecoes(lMassa.pts).length + (lClara ? autoIntersecoes(lClara.pts).length : 0);

  return {
    peca: monta(true),
    crua: monta(false),
    k,
    picoAntes,
    picoDepois,
    formasIrmas: formas.length,
    areaIrmas: areaIrmas / (ESCALA * ESCALA),
    cruzamentos,
    desvios: { massa: lMassa.desvio, clara: lClara?.desvio ?? 0 },
    pisos: { massa: lMassa.piso, clara: lClara?.piso ?? 0 },
    n: { massa: lMassa.pts.length, clara: lClara?.pts.length ?? 0 },
    varredura: lMassa.varredura,
    traco: {
      arcos: lMassa.arcos.length,
      fracao: lMassa.fracaoTracada,
      densa: lMassa.densa.fracao,
      porTrecho: lMassa.densa.porTrecho,
    },
    perda: {
      massa: lMassa.areaFora,
      // Em A a área das formas extras deixa de ser perda: ela tem para onde ir.
      clara: Math.max(0, (lClara?.areaFora ?? 0) - areaRecuperada),
      compsMassa: lMassa.componentes,
      compsClara: lClara?.componentes ?? 0,
    },
    amputada: lMassa.amputada,
  };
}

const lit = (p: PontoFranja) => `{ t: ${p.t.toFixed(3)}, y: ${p.y.toFixed(3)} }`;
const litXY = (p: { x: number; y: number }) => `{ x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)} }`;

if (process.argv[1]?.endsWith("converter.ts")) {
  const caminho = process.argv[2] ?? `${PASTA}/entrada.png`;
  const SAIDA = `${saidaDaArte(caminho)}/peca`;
  converter(caminho)
    .then((c) => {
      mkdirSync(SAIDA, { recursive: true });
      const corpo =
        `// GERADO por scripts/avatar/arte/converter.ts — NÃO COLAR no catálogo sem a folha.\n` +
        `export const PECA = {\n  massa: [\n    ${c.peca.massa!.map(lit).join(",\n    ")},\n  ],\n` +
        (c.peca.clara
          ? `  clara: [\n    ${c.peca.clara.map(lit).join(",\n    ")},\n  ],\n`
          : "") +
        (c.peca.linhas?.length
          ? `  linhas: [${c.peca.linhas.map(([a, b]) => `[${a}, ${b}]`).join(", ")}],\n`
          : "") +
        (c.peca.claras?.length
          ? `  claras: [\n${c.peca.claras.map((f) => `    [\n      ${f.map(lit).join(",\n      ")},\n    ]`).join(",\n")}\n  ],\n`
          : "") +
        (c.peca.formas?.length
          ? `  formas: [\n${c.peca.formas
              .map(
                (x) =>
                  `    { forma: [\n      ${x.forma.map(litXY).join(",\n      ")},\n    ]` +
                  (x.linhas?.length
                    ? `, linhas: [${x.linhas.map(([a, b]) => `[${a}, ${b}]`).join(", ")}]`
                    : "") +
                  ` }`,
              )
              .join(",\n")}\n  ],\n`
          : "") +
        `} as const;\n`;
      writeFileSync(`${SAIDA}/peca.ts`, corpo, "utf-8");

      console.log(`P4 — CONVERSÃO — ${caminho}\n`);
      const comPiso = (d: number, p: number) =>
        `${d.toFixed(2)} u   piso da curva ${p.toFixed(2)} u` +
        (p > 6 ? "  ← mais pontos NÃO ajudam" : "");
      console.log(
        `  massa            ${c.n.massa} pontos {t,y}   desvio da corda ${comPiso(c.desvios.massa, c.pisos.massa)}`,
      );
      console.log(
        `  clara            ${c.n.clara} pontos {t,y}   desvio da corda ${comPiso(c.desvios.clara, c.pisos.clara)}`,
      );
      console.log(`  formas irmãs     ${c.formasIrmas}   área ${c.areaIrmas.toFixed(0)} u²`);
      console.log(`  auto-interseções ${c.cruzamentos}   (teto do catálogo: 0)`);
      console.log(
        `  traço da peça    ${c.traco.arcos} arco(s) cobrindo ${(100 * c.traco.fracao).toFixed(1)}% do laço`,
      );
      console.log(
        `  borda amputada   ${(100 * c.amputada).toFixed(1)}% da borda da massa corre sobre` +
          ` rosto/corpo — essa linha quem desenhou foi a região, não a arte`,
      );
      console.log(`\n  perda por multi-componente (bordaOrdenada percorre UMA)`);
      console.log(
        `    massa   ${c.perda.compsMassa} componente(s), ${c.perda.massa} px fora do laço` +
          ` = ${(c.perda.massa / (ESCALA * ESCALA)).toFixed(0)} u²`,
      );
      console.log(
        `    clara   ${c.perda.compsClara} componente(s), ${c.perda.clara} px fora do laço` +
          ` = ${(c.perda.clara / (ESCALA * ESCALA)).toFixed(0)} u²`,
      );
      console.log(`\n  teto de y=0`);
      console.log(`    pico da peça       ${c.picoAntes.toFixed(1)} u   (${c.picoAntes < 0 ? "ACIMA do viewBox" : "dentro"})`);
      console.log(`    k da compressão    ${c.k.toFixed(4)}`);
      console.log(`    pico comprimido    ${c.picoDepois.toFixed(1)} u`);
      console.log(
        `    altura de ponta acima da coroa: ${(CAIXA_CABECA.y0 - c.picoAntes).toFixed(0)} u crua → ` +
          `${(CAIXA_CABECA.y0 - c.picoDepois).toFixed(0)} u comprimida`,
      );
      console.log(`\n  literal em ${SAIDA}/peca.ts`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
