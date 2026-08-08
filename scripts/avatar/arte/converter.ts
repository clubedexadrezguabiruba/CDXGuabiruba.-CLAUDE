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
import { ateAPoligonal, dentroDe } from "../../../src/lib/avatar/estilo/cabelo";
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
  conterAClara,
  distanciaDe,
  escolherN,
  paraTY,
  refinarPelaSpline,
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
 * QUÃO GROSSA É A BANDA PRETA DA ARTE, ponto a ponto — em unidades do `viewBox`.
 *
 * É `sondarTraco` devolvendo o **comprimento da corrida** de `papeis === 4` na
 * normal em vez de um `boolean`. A pergunta que ela responde é a que decide a
 * bifurcação de arte do Bloco 13: transcrever a banda da artista custa uma emenda
 * à lei do estilo (`tracar-cabelo.ts:1584-1596`, *"reproduzir a variação da arte
 * seria trocar a lei do estilo pelo capricho do modelo de difusão"*), e a emenda
 * só se paga se a banda for legível. Uma banda de 4 u é **0,32 px a 56**, metade da
 * sobrancelha inteira (0,66 px, `cabelo.ts:334-337`, descrita ali como o limite do
 * legível): transcrever isso é transcrever o serrilhado do gerador.
 *
 * **O alcance é o DOBRO do de `sondarTraco`** — `TRACO` inteiro para cada lado, e
 * não meio. Com meio traço a corrida bateria no fim da janela em toda banda
 * nominal e a régua devolveria 12 u para tudo, que é o mesmo modo de falha do
 * limiar de luminância de `coroa.ts`: número igual para coisas diferentes.
 * `fracaoSaturada` é o que prova que a folga bastou.
 *
 * **A semente é a mesma de `sondarTraco`** — meio traço a partir da borda. Não é
 * escolha nova: é a janela em que aquela função já declara procurar preto, e usar
 * outra faria as duas réguas discordarem sobre onde o traço está.
 */
function espessuraDoTraco(
  borda: readonly { x: number; y: number }[],
  papeis: Uint8Array,
  w: number,
  h: number,
): { u: number; saturada: boolean }[] {
  const N = borda.length;
  const R = 4; // os mesmos vizinhos de `sondarTraco`, pela mesma tangente
  const PASSO = 0.5;
  const M = Math.round((TRACO * ESCALA) / PASSO); // amostras de cada lado
  const JANELA = Math.round(((TRACO / 2) * ESCALA) / PASSO); // a semente de `sondarTraco`
  const out: { u: number; saturada: boolean }[] = [];
  for (let k = 0; k < N; k++) {
    const a = borda[(k - R + N) % N];
    const b = borda[(k + R) % N];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const am: boolean[] = [];
    for (let s = -M; s <= M; s++) {
      const x = Math.round(borda[k].x + nx * s * PASSO);
      const y = Math.round(borda[k].y + ny * s * PASSO);
      am.push(x >= 0 && y >= 0 && x < w && y < h && papeis[y * w + x] === 4);
    }
    const c = M; // o centro da janela É o ponto da borda
    let semente = am[c] ? c : -1;
    for (let d = 1; d <= JANELA && semente < 0; d++) {
      if (am[c - d]) semente = c - d;
      else if (am[c + d]) semente = c + d;
    }
    if (semente < 0) {
      out.push({ u: 0, saturada: false });
      continue;
    }
    let i = semente;
    while (i > 0 && am[i - 1]) i--;
    let j = semente;
    while (j < am.length - 1 && am[j + 1]) j++;
    out.push({ u: ((j - i + 1) * PASSO) / ESCALA, saturada: i === 0 || j === am.length - 1 });
  }
  return out;
}

/**
 * ABAIXO DISTO A BANDA NÃO É DESENHO, É SERRILHA: **8 unidades**.
 *
 * A 56 px o `viewBox` de 700 u dá 12,5 u por pixel, então 8 u são **0,64 px** —
 * logo abaixo da sobrancelha inteira (0,66 px), que `cabelo.ts:334-337` declara
 * como o limite do legível naquele tamanho. Não é teto de gate: é o corte que
 * separa "a artista desenhou uma linha fina ali" de "o antialias do gerador".
 */
const ESPESSURA_FINA = 8;

/** Percentil de uma lista JÁ ORDENADA, por índice linear. */
function percentil(ord: readonly number[], p: number): number {
  if (!ord.length) return 0;
  return ord[Math.max(0, Math.min(ord.length - 1, Math.round(p * (ord.length - 1))))];
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
  /**
   * A ESPESSURA DA BANDA PRETA DA ARTE, em unidades — ver `espessuraDoTraco`.
   *
   * Os percentis saem dos pontos **com** traço (`espessura > 0`); ponto sem traço
   * é ausência de banda, não banda de zero, e misturar os dois faria a mediana
   * medir a cobertura em vez da grossura. Quanto do perímetro tem traço já é
   * `densa.fracao`, e as duas perguntas ficam separadas de propósito.
   *
   * `fracaoFina` é a fração DESSES pontos abaixo de `ESPESSURA_FINA`.
   */
  espessura: { p05: number; p50: number; p95: number; fracaoFina: number; fracaoSaturada: number };
  /**
   * O DESVIO DA CURVA QUE O NAVEGADOR PINTA, e não o da corda — ver `desvioDaSpline`.
   *
   * `desvio` acima mede a poligonal, que é o que `escolherN` escolhe por. Este mede
   * a spline, que é o que se vê. Na `chanel` sem refino os dois dão **5,6 u** e
   * **23,3 u**. `refino` conta os pontos que o refino inseriu; `null` quando ele não
   * rodou (peça que não transcreve).
   */
  spline: { antes: number; depois: number; inseridos: number; bateuNoTeto: boolean } | null;
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
/**
 * O ALVO DO REFINO PELA SPLINE, e ele não é um número novo: é **meio traço**.
 *
 * `escolherN` já persegue `MEIO_TRACO` — só que medindo a corda. O refino persegue
 * o mesmo valor medindo a curva que o navegador pinta. Trocar o alvo junto faria
 * duas mudanças numa medição só.
 */
const ALVO_SPLINE = TRACO / 2;

/**
 * TETO DE PONTOS DO REFINO — 96, e o número tem razão medida.
 *
 * `escolherN` para em 64 porque a escala dele para ali. O refino só entra em peça
 * transcrita, e ali cada ponto a mais custa ~34 bytes; 96 são 32 acima do teto de
 * `escolherN`, ou seja **no máximo ~1 100 bytes** de folga para o pior laço. O
 * `bateuNoTeto` diz alto quando não bastou, em vez de a peça sair torta calada.
 */
const TETO_REFINO = 96;

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
  /**
   * REFINAR PELA CURVA DESENHADA — só para peça que transcreve o preto.
   *
   * Fora dela o comportamento é o de sempre, byte a byte, e é isso que mantém as
   * três peças congeladas do Bloco 9 exatamente onde estão. Ver `refinarPelaSpline`
   * para o defeito que ele mata e por que ele não move nenhum ponto de lugar.
   */
  refinar?: boolean,
): Laco | null {
  const borda = bordaOrdenada(mascara, w, h);
  if (borda.length < 12) return null;
  const emU = borda.map((p) => paraUnidade(p.x, p.y));
  const suave = suavizarLaco(emU, 5).map((p, i) => ({ ...p, i }));
  const esc = escolherN(suave, true);
  const n = nForcado && nForcado < suave.length ? nForcado : esc.n;
  // O REFINO ENTRA ANTES DOS ARCOS, e a ordem importa: `arcos` e `porTrecho` são
  // índices sobre este laço, e refinar depois deles apontaria para os pontos velhos.
  const ref = refinar
    ? refinarPelaSpline(suave, decimarPorCorda(suave, n, { fechado: true }), true, ALVO_SPLINE, TETO_REFINO)
    : null;
  const red = ref ? ref.pts : decimarPorCorda(suave, n, { fechado: true });
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

  // A ESPESSURA sai da borda DENSA, e não do laço decimado: a `chanel` tem 28
  // pontos para ~1 400 u de perímetro — um a cada ~50 u —, e uma banda de 10 u
  // amostrada a cada 50 u é a banda de outra peça.
  const esp = papeis ? espessuraDoTraco(borda, papeis, w, h) : [];
  const comTraco = esp.filter((e) => e.u > 0);
  const ord = comTraco.map((e) => e.u).sort((a, b) => a - b);

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
    espessura: {
      p05: percentil(ord, 0.05),
      p50: percentil(ord, 0.5),
      p95: percentil(ord, 0.95),
      fracaoFina: ord.length ? ord.filter((v) => v < ESPESSURA_FINA).length / ord.length : 0,
      fracaoSaturada: comTraco.length
        ? comTraco.filter((e) => e.saturada).length / comTraco.length
        : 0,
    },
    spline: ref && {
      antes: ref.erroAntes,
      depois: ref.erro,
      inseridos: ref.inseridos,
      bateuNoTeto: ref.bateuNoTeto,
    },
    componentes: componentes(mascara, w, h).length,
    areaFora: total - naPrimeira,
    amputada: bordaAmputada(mascara, w, h),
  };
}

/**
 * DE QUE MÁSCARA O NÚCLEO DE CIANO SAI — e a diferença é UMA linha.
 *
 *  - **`fiel`**: `mascara ∧ (papeis ≠ 4)`. A banda preta que sobra é a que a
 *    artista desenhou, filtrada pela decimação. Exige emenda declarada à lei do
 *    estilo (`tracar-cabelo.ts:1584-1596`), porque passam a conviver duas
 *    espessuras de linha na mesma figura: 12 u no crânio e a da arte no cabelo.
 *  - **`lei`**: erosão da máscara por **um traço inteiro**, então a banda sai com
 *    12 u constantes, iguais às do crânio. A lei do estilo fica intacta e a margem
 *    é garantida ANTES da decimação — o ciano não tem como vazar para fora do preto.
 *
 * ⚠️ **A erosão é por `TRACO`, e não pelo `TRACO/2` que o plano do Bloco 13
 * escreveu.** A fórmula dele contradizia a própria tabela dele, e a contradição é
 * geométrica: o contorno do crânio tem 12 u **centradas** na fronteira, então
 * metade mora fora da silhueta e metade dentro. A silhueta da PEÇA é a beira
 * EXTERNA do preto dela — `mascara = teal ∪ traço` —, logo o preto tem de descer
 * 12 u para dentro dali para o olho ver a mesma espessura de caneta. Erodir 6 u
 * entregaria uma banda de 6 u, metade da declarada. Medido: com 6 u a contenção
 * do núcleo à massa caía a **0,25 u** (a decimação quase cruzava os dois laços) e
 * a camada 4 recuperava **7 800 px** — que era a própria banda da artista sendo
 * redesenhada por dentro, não traço interno.
 *
 * As duas vão lado a lado na folha com o número embaixo. A escolha é direção de
 * arte, e o Passo 1 já mediu o que ela custa: na `chanel` a banda da artista tem
 * p50 **9,6 u** (0,77 px a 56) e só **2,3%** do perímetro abaixo de 8 u.
 */
export type VarianteNucleo = "fiel" | "lei";

/** A máscara do núcleo, pelas duas regras. Ver `VarianteNucleo`. */
function mascaraDoNucleo(
  variante: VarianteNucleo,
  mascara: Uint8Array,
  papeis: Uint8Array,
  w: number,
  h: number,
): Uint8Array {
  const out = new Uint8Array(mascara.length);
  if (variante === "fiel") {
    for (let i = 0; i < out.length; i++) out[i] = mascara[i] && papeis[i] !== 4 ? 1 : 0;
    return out;
  }
  // `distanciaDe` mede até o marco mais próximo; o marco aqui é o FORA da peça,
  // então o valor é a profundidade de cada pixel dentro dela. Eroder por meio
  // traço é exatamente pedir profundidade > `TRACO/2`.
  const fora = new Uint8Array(mascara.length);
  for (let i = 0; i < fora.length; i++) fora[i] = mascara[i] ? 0 : 1;
  const d = distanciaDe(fora, w, h);
  const R = TRACO * ESCALA; // um traço inteiro — ver a ⚠️ em `VarianteNucleo`
  for (let i = 0; i < out.length; i++) out[i] = d[i] > R ? 1 : 0;
  return out;
}

/**
 * OS FUROS DA MÁSCARA — e por que eles passam a importar agora.
 *
 * Hoje o furo é preenchido pelo laço da massa e sai **cor de cabelo**, porque
 * `bordaOrdenada` percorre só o contorno externo. Com o desenho novo a camada 1
 * (o mesmo laço) sai **preta**, e o núcleo é que fica com o furo — ou seja, o furo
 * inverte de cor. Na `chanel` isso é 1 px e não se vê; numa mecha vazada seria a
 * mancha inteira.
 *
 * Não conta a componente que toca a borda do quadro: aquela é o fundo, não furo.
 */
function furosDaMascara(mascara: Uint8Array, w: number, h: number): number {
  const fora = new Uint8Array(mascara.length);
  for (let i = 0; i < fora.length; i++) fora[i] = mascara[i] ? 0 : 1;
  let area = 0;
  for (const c of componentes(fora, w, h)) {
    if (c.x0 === 0 || c.y0 === 0 || c.x1 === w - 1 || c.y1 === h - 1) continue;
    area += c.area;
  }
  return area;
}

/** Cada laço de uma máscara, um por componente acima do piso, em unidades. */
function lacosPorComponente(
  m: Uint8Array,
  w: number,
  h: number,
  nForcado?: number,
  refinar?: boolean,
): { pts: { x: number; y: number }[]; area: number }[] {
  const out: { pts: { x: number; y: number }[]; area: number }[] = [];
  for (const c of componentes(m, w, h)) {
    if (c.area < PISO_FORMA) continue;
    const l = laco(soAComponente(m, w, h, c.semente), w, h, undefined, nForcado, refinar);
    if (l) out.push({ pts: l.pts, area: c.area });
  }
  return out;
}

/** Um ponto está dentro de QUALQUER um dos laços? */
const dentroDeAlgum = (polis: readonly { x: number; y: number }[][], p: { x: number; y: number }) =>
  polis.some((poli) => dentroDe(poli, p));

/**
 * De uma lista de laços, o que mais contém os pontos dados. `[]` se a lista é vazia.
 *
 * Não é "o maior": numa peça com mecha destacada, a componente maior do núcleo pode
 * não ser a que fica debaixo daquela região clara, e conter a clara contra o laço
 * errado a arrastaria para o outro lado da peça.
 */
function maisContem(
  polis: readonly { x: number; y: number }[][],
  pts: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  if (!polis.length) return [];
  let melhor = polis[0];
  let mais = -1;
  for (const poli of polis) {
    const n = pts.filter((p) => dentroDe(poli, p)).length;
    if (n > mais) (mais = n), (melhor = poli);
  }
  return [...melhor];
}

/**
 * O NÚCLEO E AS PRETAS INTERNAS de uma variante, com tudo que se mede neles.
 *
 * ---------------------------------------------------------------------------
 * A ORDEM DAS DUAS OPERAÇÕES DA CAMADA 4 É O PASSO 3 INTEIRO
 * ---------------------------------------------------------------------------
 *
 * ```
 * CERTO:   pretas = componentes( (papeis === 4) ∧ dentro(polígono do núcleo) )
 * ERRADO:  pretas = componentes(papeis === 4).filtrar(está dentro do núcleo)
 * ```
 *
 * O preto da arte da `chanel` é **1 componente conexo**: o traço interno da mecha
 * direita **encosta** no contorno externo, porque contorno interno nasce da borda.
 * Selecionar componente primeiro e testar depois reprova essa componente única e
 * devolve **camada vazia** — que é exatamente o defeito que este plano existe para
 * consertar. Recortar primeiro parte o objeto único nos pedaços que ficaram dentro
 * do núcleo, e cada pedaço vira forma.
 *
 * `recuperadoInvertido` é o número da ordem errada, calculado de propósito e
 * impresso ao lado do certo: é como esta rota prova que um conserto conserta.
 */
export interface Nucleo {
  variante: VarianteNucleo;
  /** Os laços do núcleo, um por componente, em unidades do `viewBox`. */
  formas: { x: number; y: number }[][];
  /** Os laços das pretas internas (camada 4), idem. */
  pretas: { x: number; y: number }[][];
  pontos: number;
  componentes: number;
  /** Menor distância COM SINAL do núcleo à massa. Negativo = ciano FORA do preto. */
  contencao: number;
  /** Amostras do núcleo com distância ≤ 0. **Teto 0.** */
  vazando: number;
  cruzamentos: number;
  /** Área dos furos da máscara, em u² — eles passam a sair pretos. */
  furos: number;
  /** Pixels de preto da arte que a camada 4 recupera, pela ordem CERTA. */
  recuperado: number;
  /** O mesmo, pela ordem ERRADA. Ver o docstring acima. */
  recuperadoInvertido: number;
}

function derivarNucleo(
  variante: VarianteNucleo,
  mascara: Uint8Array,
  papeis: Uint8Array,
  w: number,
  h: number,
  massaEmU: readonly { x: number; y: number }[],
  /**
   * N FORÇADO, e ele vale para os DOIS laços — massa e núcleo — de propósito.
   *
   * A banda preta é a **diferença** entre eles. Afinar só a massa mede a
   * discordância entre uma curva fina e uma grossa, não a banda: medido na
   * `chanel`, com a massa a N = 64 e o núcleo em `escolherN`, a barra da franja
   * volta em três colunas de cinco e continua ausente em x = 620, porque ali quem
   * avança sobre a banda é o núcleo. Régua que afina um lado só devolve o defeito
   * do outro lado com outro nome.
   */
  nForcado?: number,
): Nucleo {
  // O NÚCLEO E AS PRETAS SEMPRE REFINAM PELA SPLINE: elas só existem em peça
  // transcrita, e é justamente a curva desenhada que define a banda preta.
  const mn = mascaraDoNucleo(variante, mascara, papeis, w, h);
  const formas = lacosPorComponente(mn, w, h, nForcado, true);
  const polis = formas.map((f) => f.pts);

  // ------------------------------------------------- a camada 4, na ordem CERTA
  const recortado = new Uint8Array(mascara.length);
  for (let i = 0; i < mascara.length; i++) {
    if (papeis[i] !== 4) continue;
    const p = paraUnidade(i % w, (i / w) | 0);
    if (dentroDeAlgum(polis, p)) recortado[i] = 1;
  }
  const pretas = lacosPorComponente(recortado, w, h, nForcado, true);

  // ------------------------------------------ o mesmo, na ordem ERRADA, medido
  //
  // "A componente está dentro do núcleo?" por fração de pixels: ≥ 90% dentro. É a
  // leitura mais generosa do critério ingênuo, e mesmo assim ele devolve zero.
  const soPreto = new Uint8Array(mascara.length);
  for (let i = 0; i < mascara.length; i++) soPreto[i] = papeis[i] === 4 ? 1 : 0;
  let recuperadoInvertido = 0;
  for (const c of componentes(soPreto, w, h)) {
    if (c.area < PISO_FORMA) continue;
    let dentro = 0;
    const so = soAComponente(soPreto, w, h, c.semente);
    for (let i = 0; i < so.length; i++)
      if (so[i] && dentroDeAlgum(polis, paraUnidade(i % w, (i / w) | 0))) dentro++;
    if (dentro >= 0.9 * c.area) recuperadoInvertido += c.area;
  }

  // -------------------------------------- o núcleo está DENTRO da massa? teto 0
  //
  // A mesma amostragem de `contencaoDaClara` (12 subdivisões por segmento): sem
  // ela, um ponto de controle dentro esconderia um trecho de corda fora.
  let contencao = Infinity;
  let vazando = 0;
  for (const poli of polis) {
    const seq = [...poli, poli[0]];
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i];
      const b = seq[i + 1];
      for (let k = 0; k <= 12; k++) {
        const p = { x: a.x + ((b.x - a.x) * k) / 12, y: a.y + ((b.y - a.y) * k) / 12 };
        const d = ateAPoligonal(massaEmU, p);
        const s = dentroDe(massaEmU, p) ? d : -d;
        contencao = Math.min(contencao, s);
        if (s <= 0) vazando++;
      }
    }
  }

  return {
    variante,
    formas: polis,
    pretas: pretas.map((p) => p.pts),
    pontos: polis.reduce((s, p) => s + p.length, 0),
    componentes: polis.length,
    contencao,
    vazando,
    cruzamentos: polis.reduce((s, p) => s + autoIntersecoes(p).length, 0),
    furos: furosDaMascara(mascara, w, h) / (ESCALA * ESCALA),
    recuperado: pretas.reduce((s, p) => s + p.area, 0),
    recuperadoInvertido,
  };
}

/**
 * QUAIS ARTES TRANSCREVEM O PRETO — a lista declarada, e é ela que cumpre a
 * decisão 3 do Bloco 13.
 *
 * `entrada`, `entrada-2` e `entrada-3` ficam no contorno sintetizado, e isso é
 * **permanente**: o Passo 7 (a limpeza do sintetizado) foi **cancelado pelo Doug em
 * 2026-08-07**, e `Cabelo.linhas` passou a ser campo definitivo do tipo. A lista
 * abaixo não é um estágio a caminho de crescer — é a resposta final para estas
 * quatro artes.
 *
 * **Por que o espetado não entra: a `lei` foi TENTADA e MEDIDA, e reprova.** A banda
 * preta da arte tem p50 de 6,3 u com 79,8% do perímetro abaixo de 8 u — fina demais
 * para a `fiel` —, então a `lei` era a única variante restante. Ela reprova por outro
 * lado: o núcleo da `lei` erode por `TRACO` inteiro, a clara não cabe nele, e
 * `conterAClara` **desiste** (`convergiu: false`, 18 vértices, 8 cordas) porque conter
 * dobraria o laço. O docstring dela já nomeava o caso — *"a topologia do pente, que é
 * exatamente o que cabelo espetado é"*, 101 de 576 combinações dobram. Resultado
 * medido: `contencaoDaClara` em **−9,2 u**, tom claro sobre a banda preta.
 *
 * A única saída seria redesenhar a arte com o contorno de 12 u que o
 * `PEDIDO-GEMINI.md` exige, como o chanel fez; o Doug decidiu **não redesenhar**. O
 * espetado fica com IoU do preto de 34,4% contra a arte — perda de fidelidade, não
 * peça quebrada, porque o stroke de 12 u centrado é o que encobre o erro da régua da
 * corda, e é ele que fica.
 *
 * **Para ARTE NOVA nada disso muda:** a resposta segue sendo transcrever, com a
 * variante decidida pela régua da espessura (§3 do runbook 19). Banda fina pede
 * redesenho, não `lei` — a `lei` é rede com furo, e este caso é o furo.
 *
 * **Ela mora aqui, e não em `pecas.ts`, porque três programas precisam da mesma
 * resposta.** `arte:pecas` gera o literal, o **controle 6** de `arte:revisao`
 * reconverte para conferir se o literal envelheceu, e `arte:folha` desenha. Se a
 * lista morasse no gerador, o controle compararia um literal transcrito com uma
 * conversão sintetizada e acusaria divergência para sempre. Chave visível, num
 * lugar só, em vez de disciplina em três.
 */
export const TRANSCREVEM: Record<string, VarianteNucleo> = { chanel: "fiel" };

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
  /** O desvio da CURVA DESENHADA, e o refino que o baixou. Ver `Laco.spline`. */
  spline: Laco["spline"];
  /**
   * Defeito 1: os arcos de traço, e que fração do laço eles cobrem.
   *
   * `densa` é a mesma pergunta ANTES da regra de maioria — ver `Laco.densa`. Um
   * `fracao = 1,00` com `densa.fracao = 0,6` não é um contorno inteiro: é a
   * maioria arredondando 64 trechos para cima.
   */
  traco: { arcos: number; fracao: number; densa: number; porTrecho: number[] };
  /** A espessura da banda preta da ARTE, em unidades — ver `Laco.espessura`. */
  espessura: Laco["espessura"];
  /** O núcleo de ciano pelas DUAS regras, e as pretas internas. Ver `Nucleo`. */
  nucleo: Record<VarianteNucleo, Nucleo>;
  /** Perda silenciosa por multi-componente, agora medida. Em px do canvas. */
  perda: { massa: number; clara: number; compsMassa: number; compsClara: number };
  /** Fração da borda da massa que é corte de região protegida, não desenho. */
  amputada: number;
  /**
   * A CONTENÇÃO DA CLARA CHEGOU AO PONTO FIXO? — `null` quando a peça não transcreve.
   *
   * `conterAClara` tem uma guarda declarada: **nenhuma passada que aumente as
   * auto-interseções é aplicada**. Ao bater nela ela devolve a clara como chegou e
   * `convergiu: false` — o que é a resposta certa, porque uma clara que só entra no
   * núcleo dobrando é a clara e o núcleo discordando de forma, não ruído de amostragem.
   *
   * **O campo existe porque o valor era descartado aqui.** `importarPeca` sempre
   * reprovou em `convergiu: false`; esta rota consumia só `.pts` e emitia a clara
   * não-contida calada. Medido em 2026-08-07 no espetado pela `lei`: `convergiu=false`,
   * 18 vértices projetados, 8 cordas — e a reprovação só apareceu dois passos adiante,
   * em `contencaoDaClara` (−9,2 u), onde ela não diz de onde veio.
   */
  claraConvergiu: boolean | null;
}

export async function converter(
  caminhoArte: string,
  /** N forçado da MASSA — experimento, ver `laco`. A clara segue `escolherN`. */
  nForcado?: number,
  /**
   * A variante de núcleo FORÇADA — só para a folha mostrar as duas lado a lado.
   *
   * Sem ela, quem manda é `TRANSCREVEM`, e a peça que sai é a que o produto vê.
   */
  varianteForcada?: VarianteNucleo,
): Promise<Convertido> {
  const e = await extrair(caminhoArte);
  const w = e.arte.w;
  const h = e.arte.h;

  // O rótulo sai do nome do arquivo. Três artes não podem gerar três literais que
  // se dizem o mesmo `id` do catálogo — era o que acontecia com `"curto"` fixo.
  const rotulo = (caminhoArte.split(/[\\/]/).pop() ?? caminhoArte).replace(/\.png$/i, "");
  // A VARIANTE DE TRANSCRIÇÃO, decidida pela lista declarada — ver `TRANSCREVEM`.
  //
  // Ela é lida ANTES dos laços porque decide também o **refino pela spline**: a
  // peça transcrita tem a banda preta definida pela curva desenhada, e nela o
  // desvio da corda deixa de ser régua suficiente. A peça que não transcreve segue
  // pelo caminho de sempre, byte a byte.
  const variante = varianteForcada ?? TRANSCREVEM[rotulo];
  const refinar = Boolean(variante);

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
  const lMassa = laco(dentro, w, h, e.papeis, nForcado, refinar);
  const lClara = laco(claraMask, w, h, undefined, undefined, refinar);
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
    const l = laco(soAComponente(claraMask, w, h, c.semente), w, h, undefined, undefined, refinar);
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
    const l = laco(soAComponente(e.mascara, w, h, c.semente), w, h, e.papeis, undefined, refinar);
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

  const monta = (comprimir: boolean): Cabelo => {
    const f = comprimir ? ap : (p: { x: number; y: number }) => p;
    const massa = lMassa.pts.map((p) => paraTY(f(p))) as PontoFranja[];
    // A clara da peça transcrita sai CONTIDA no núcleo — ver `claraContida`.
    const claraPts: readonly { x: number; y: number }[] | undefined = claraContida
      ? claraContida.pts
      : lClara?.pts;
    const clara = claraPts ? (claraPts.map((p) => paraTY(f(p))) as PontoFranja[]) : undefined;
    const nu = variante ? nucleo[variante] : undefined;
    const emTY = (formas: readonly { x: number; y: number }[][]) =>
      formas.map((forma) => forma.map((p) => paraTY(f(p))) as PontoFranja[]);
    return {
      id: rotulo as Cabelo["id"],
      nome: `Importado de ${rotulo}.png`,
      massa,
      clara,
      ...(clarasExtras.length
        ? { claras: clarasExtras.map((forma) => forma.map((p) => paraTY(f(p))) as PontoFranja[]) }
        : {}),
      // AS CAMADAS DA PEÇA TRANSCRITA — e elas EXCLUEM `linhas`.
      //
      // Com `nucleo`, a massa acima já é a tinta e a banda preta é a diferença
      // entre ela e o núcleo. Emitir `linhas` junto poria um stroke de 12 u
      // centrado POR CIMA disso — o defeito que a transcrição existe para matar,
      // desenhado duas vezes.
      ...(nu
        ? {
            nucleo: emTY(nu.formas),
            ...(nu.pretas.length ? { pretas: emTY(nu.pretas) } : {}),
          }
        : // DEFEITO 1: sem esta lista a peça sai sem traço nenhum na franja — a
          // massa traçada é `fill` puro e quem desenha o preto é `.kk-cabelo-l`,
          // alimentada por `Cabelo.linhas`.
          lMassa.arcos.length
          ? { linhas: lMassa.arcos }
          : {}),
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

  // ------------------------------------------------------------- o NÚCLEO
  //
  // Derivado pelas DUAS regras e MEDIDO. Quem escolhe entre as duas variantes é a
  // folha, e a escolha é direção de arte.
  const nucleo: Record<VarianteNucleo, Nucleo> = {
    fiel: derivarNucleo("fiel", dentro, e.papeis, w, h, lMassa.pts, nForcado),
    lei: derivarNucleo("lei", dentro, e.papeis, w, h, lMassa.pts, nForcado),
  };

  // ------------------------------------------- A CLARA CONTIDA NO NÚCLEO
  //
  // **Em pixel a clara já está dentro do núcleo por construção** — `claraMask` é
  // `papeis ∈ {1,3}` e o núcleo é `papeis ≠ 4`, então a diferença entre os dois é a
  // faixa de `sombra`, que na `chanel` mede 2 a 3 px. O que vaza é a **decimação**:
  // dois laços refinados cada um contra a sua borda, com alvo de meio traço, podem
  // se cruzar sobre uma folga de 3 px.
  //
  // Enquanto o contorno era sintetizado isso não aparecia (a clara vazava por baixo
  // de um stroke de 12 u). Com o preto transcrito, clara fora do núcleo é tom claro
  // pintado **em cima da banda preta**, e `contencaoDaClara` mede −3,35 u.
  //
  // `conterAClara` é a função que já existe para exatamente isto, com o teste que já
  // existe (`conter-a-clara.test.ts`): ela projeta só os pontos de fora, mede a
  // corda e não o vértice, e **desiste sem piorar** se a projeção dobrar o laço.
  // O continente é a componente do núcleo que mais contém a clara — não a maior,
  // porque numa peça com mecha destacada a maior pode não ser a de baixo dela.
  const claraContida = variante
    ? conterAClara(
        (lClara?.pts ?? []).map((p) => ({ ...p })),
        maisContem(nucleo[variante].formas, lClara?.pts ?? []),
      )
    : null;

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
    espessura: lMassa.espessura,
    spline: lMassa.spline,
    nucleo,
    perda: {
      massa: lMassa.areaFora,
      // Em A a área das formas extras deixa de ser perda: ela tem para onde ir.
      clara: Math.max(0, (lClara?.areaFora ?? 0) - areaRecuperada),
      compsMassa: lMassa.componentes,
      compsClara: lClara?.componentes ?? 0,
    },
    amputada: lMassa.amputada,
    claraConvergiu: claraContida ? claraContida.convergiu : null,
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
      const px56 = (u: number) => (u / (VIEWBOX.h / 56)).toFixed(2);
      console.log(
        `  espessura        p05 ${c.espessura.p05.toFixed(1)} u (${px56(c.espessura.p05)} px a 56) · ` +
          `p50 ${c.espessura.p50.toFixed(1)} u (${px56(c.espessura.p50)}) · ` +
          `p95 ${c.espessura.p95.toFixed(1)} u (${px56(c.espessura.p95)})`,
      );
      console.log(
        `                   abaixo de ${ESPESSURA_FINA} u: ${(100 * c.espessura.fracaoFina).toFixed(1)}%` +
          `   saturada: ${(100 * c.espessura.fracaoSaturada).toFixed(1)}%` +
          `   (TRACO nominal = ${TRACO} u = ${px56(TRACO)} px a 56)`,
      );
      if (c.spline)
        console.log(
          `  desvio da SPLINE ${c.spline.antes.toFixed(1)} u ANTES do refino → ` +
            `${c.spline.depois.toFixed(1)} u depois   (+${c.spline.inseridos} pontos, alvo ${ALVO_SPLINE} u)` +
            (c.spline.bateuNoTeto ? `   ✗ BATEU NO TETO de ${TETO_REFINO}` : ""),
        );
      console.log(
        `  borda amputada   ${(100 * c.amputada).toFixed(1)}% da borda da massa corre sobre` +
          ` rosto/corpo — essa linha quem desenhou foi a região, não a arte`,
      );
      console.log(`\n  O NÚCLEO — as duas variantes, medidas (Passos 2 e 3)`);
      console.log(
        `    variante   N     comps  contenção   vazando   cruzam.  furos     camada 4 (ordem certa × invertida)`,
      );
      for (const v of ["fiel", "lei"] as const) {
        const nu = c.nucleo[v];
        console.log(
          `    ${v.padEnd(10)} ${String(nu.pontos).padStart(3)}   ` +
            `${String(nu.componentes).padStart(4)}   ` +
            `${nu.contencao.toFixed(2).padStart(8)} u  ` +
            `${String(nu.vazando).padStart(6)}    ` +
            `${String(nu.cruzamentos).padStart(5)}   ` +
            `${nu.furos.toFixed(0).padStart(5)} u²  ` +
            `${nu.pretas.length} forma(s) · ${nu.recuperado} px  ×  ${nu.recuperadoInvertido} px`,
        );
      }
      console.log(
        `    tetos: vazando 0 · cruzamentos 0. N da massa = ${c.n.massa}` +
          `   (equilíbrio de bytes em N′ ≈ 30)`,
      );
      if (c.claraConvergiu !== null) {
        console.log(
          `    a clara contida no núcleo: ${
            c.claraConvergiu
              ? "convergiu"
              : "NÃO CONVERGIU ⚠  a guarda de dobra impediu a contenção — a clara sai como chegou"
          }`,
        );
      }

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
