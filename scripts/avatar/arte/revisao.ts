/**
 * A FOLHA DE REVISÃO DE UMA PEÇA — a arte contra o render, sobrepostos.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA QUE NENHUMA FOLHA DESTE REPOSITÓRIO RESPONDIA
 * ---------------------------------------------------------------------------
 *
 * `arte:folha` compara as três artes ENTRE SI a 56 px: serve para escolher, não
 * para ajustar. Nada aqui sobrepunha o PNG que o Doug desenhou contra o boneco
 * que o produto emite — e sem isso "o render trai a arte?" não tem resposta, só
 * impressão.
 *
 * `avatar:fidelidade --folha` faz exatamente esta folha, e está amarrada ao
 * pipeline ANTIGO: precisa de `semantica.svg`, de `importarPeca`, de
 * `registroPelaCabeca`, e **recusa receber um PNG por escrito**
 * (`fidelidade.ts:1757-1766`). A parte cara dela — registrar a cabeça da arte
 * contra a cabeça do produto — é exatamente a que esta rota tornou desnecessária.
 *
 * ---------------------------------------------------------------------------
 * O REGISTRO NÃO É CALCULADO AQUI, PORQUE ELE JÁ ESTAVA ESCRITO
 * ---------------------------------------------------------------------------
 *
 * O grid comum é o próprio canvas 1024² da arte, e a função que põe o render
 * dentro dele é `embrulhar()` (`base.ts`), a mesma que gerou a base de edição.
 * Ela mete o `<svg>` do compositor em `x=212 y=92 width=600 height=840` mantendo
 * o `viewBox` intacto — ou seja, **ela É `paraPx`, aplicada pelo próprio SVG**.
 *
 * Uma chamada. Nenhuma conta nova, nenhuma segunda descrição da transformação —
 * que é o defeito que já custou 8% de sangria a esta rota (`folha.ts`).
 *
 * ---------------------------------------------------------------------------
 * A FIDELIDADE MEDE A `escala: 1`, E ISSO NÃO É DESCUIDO — É O ERRO QUE ELA JÁ DEU
 * ---------------------------------------------------------------------------
 *
 * A primeira versão desta folha compôs o render a **92%**, com o argumento de que
 * é o que o produto entrega. Medido: **IoU 29,8%**, desvio lateral p95 de 99,2 u,
 * e a peça aparecendo **30 u ABAIXO** da coroa contra 85 u acima na arte.
 *
 * Nada disso era infidelidade. `base-oficial.ts` compõe a base de edição com
 * `escala: 1`, então **a arte foi desenhada no sistema INTERNO**; um render a 92%
 * desce a figura inteira 74,6 unidades e a encolhe 8%. Comparar os dois mede a
 * transformação, não a peça — e como ela é uma semelhança aplicada a TUDO, ela
 * não consegue trair a arte de forma diferencial.
 *
 * Então a regra do repositório vale aqui inteira: **quem mede geometria interna
 * pede `escala: 1` explicitamente.** É o que `fidelidade.ts:485` já faz, e é o
 * mesmo motivo de `verify:pose` e de `coroa.ts` pedirem.
 *
 * Os 92% continuam medidos — na **escada de escala**, que é outra pergunta: não
 * *"a peça é fiel?"* mas *"a peça cabe no quadro que o produto entrega?"*. Ali a
 * escala é o objeto da medida, não o ruído dela.
 *
 * ---------------------------------------------------------------------------
 * UMA RÉGUA, DUAS IMAGENS
 * ---------------------------------------------------------------------------
 *
 * `mascaraDaPeca()` (`extrair.ts`) é aplicada aos DOIS lados:
 *
 *  - **arte:**   `mascaraDaPeca(entrada.png, base-oficial.png)`
 *  - **render:** `mascaraDaPeca(render_com_peça, render_careca)`
 *
 * Isso não é uso novo da função: o Gate −1 já a chama com duas imagens. O que
 * torna o lado do render legível pela mesma régua é a TINTA: o boneco é composto
 * com `CIANO_INSTRUMENTAL`, a cor que o pedido ao gerador manda usar na massa.
 * Com a cor real do produto a massa cairia em "escuro" e viraria traço.
 *
 * ---------------------------------------------------------------------------
 * A FOLHA PRECISA PODER FALHAR — OS CONTROLES RODAM PRIMEIRO
 * ---------------------------------------------------------------------------
 *
 * Régua sem controle negativo devolve 0% e ninguém sabe se é conserto ou
 * vacuidade: foi assim que o `cobertos = 0` de `silhueta.ts` passou despercebido
 * medindo contra denominador zero. Aqui os seis controles rodam ANTES de a peça
 * ser julgada, e três deles vão desenhados na folha.
 *
 * O controle 6 fecha um buraco real: `pecas-da-arte.ts` é gerado, foi colado à
 * mão e **nenhum gate o lê**. Se o literal divergir do que `converter()` produz
 * hoje, o navegador está mostrando um artefato velho — e a folha **recusa
 * desenhar** em vez de julgar a peça errada.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";

import type { Browser } from "@playwright/test";
import sharp from "sharp";

import type { Cabelo, PontoFranja } from "../../../src/lib/avatar/estilo/cabelo";
import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { compor, ESCALA_PADRAO, naTela } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { PECAS_DA_ARTE } from "../../../src/lib/avatar/estilo/pecas-da-arte";
import { CABELO, escurecer, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarHtml, renderizarSvg } from "../render-svg";
import {
  CIANO_INSTRUMENTAL,
  ESCALA,
  FUNDO,
  LADO,
  ORIGEM,
  PASTA,
  PNG_BASE,
  Y_QUEIXO,
  embrulhar,
  paraUnidade,
  saidaDaArte,
  selo,
} from "./base";
import { converter, type Convertido, type VarianteNucleo } from "./converter";
import { ehTeal, mascaraDaPeca } from "./extrair";
import { gateMenosUm } from "./gate-menos-um";
import { type Img, carregar } from "./pixels";

// ---------------------------------------------------------------------------
// Constantes de folha
// ---------------------------------------------------------------------------

const LARGURA_FOLHA = 1560;
const PAD_FOLHA = 16;
const GAP = 8;

/** O tamanho que manda: o boneco no ranking. */
const P56 = 56;
/** Ampliação do bitmap de 56 px, por CSS, sobre o bitmap — nunca por `scale()`. */
const ZOOM = 3;

/** A pele do render instrumental. Clara e longe do ciano: 28° contra 180°. */
const PELE_INSTRUMENTAL = PELE[1];

/**
 * O teto de desvio de borda: **meio traço**.
 *
 * Não é escolhido aqui — é o critério que o projeto inteiro já usa para "desvio
 * que o contorno não esconde". O contorno tem 12 unidades desenhadas centradas,
 * então metade dele mora de cada lado da linha: um desvio menor que isso some
 * debaixo do próprio traço.
 */
const MEIO_TRACO = TRACO / 2;

const b64 = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

// ---------------------------------------------------------------------------
// O registro: um render do produto, dentro do canvas da arte
// ---------------------------------------------------------------------------

interface Pintura {
  peca?: Cabelo;
  escala: number;
  /** Cor do cabelo. Ausente = o ciano instrumental, que é o que a régua lê. */
  cabelo?: string;
  pele?: string;
  /**
   * Desliga o recorte do `viewBox`. **Só para a pergunta de FORMA.**
   *
   * Sem isto, uma peça de ponta alta volta cortada em reta a `escala: 1` e a
   * fidelidade mede o viewport. Foi o que aconteceu no minuto seguinte a tirar a
   * compressão: o controle 4 acusou **41,3 u** entre o topo medido e o previsto
   * por `naTela`, porque um dos dois lados estava guilhotinado.
   *
   * A escada de escala usa o recorte NORMAL de propósito — ali o corte é o objeto
   * da medida.
   */
  semRecorte?: boolean;
}

/**
 * O RENDER NO CANVAS DA ARTE — e é aqui que o registro acontece, sem conta.
 *
 * `embrulhar()` posiciona o `<svg>` do compositor exatamente onde `paraPx` diz
 * que o `viewBox` cai no PNG de 1024². Ele mantém o `viewBox` interno, então o
 * recorte do produto (o que o `viewport` guilhotina) é preservado — e isso é a
 * verdade que a folha quer mostrar, não um defeito a contornar.
 */
async function renderNoCanvasDaArte(
  nav: Browser,
  ns: string,
  p: Pintura,
  arq: string,
): Promise<Img> {
  const svg = compor({
    pele: p.pele ?? PELE_INSTRUMENTAL,
    cabelo: p.cabelo ?? CIANO_INSTRUMENTAL,
    ...(p.peca ? { modeloCabelo: p.peca } : {}),
    ns,
    // SEMPRE explícita. Um medidor que herda o padrão mede o padrão, não a
    // escala — é a régua que quebrou no Bloco 5 e o modo de falha se repete.
    escala: p.escala,
  });
  await renderizarSvg(nav, embrulhar(svg, p.semRecorte), LADO, LADO, arq, FUNDO);
  return carregar(arq, FUNDO);
}

// ---------------------------------------------------------------------------
// As máscaras e a comparação
// ---------------------------------------------------------------------------

interface Par {
  peca: Uint8Array;
  traco: Uint8Array;
}

/**
 * A régua, aplicada a um par (imagem com peça, imagem sem peça).
 *
 * ---------------------------------------------------------------------------
 * `limitar: true` — E A PRIMEIRA VERSÃO USAVA `false`, COM PREÇO MEDIDO
 * ---------------------------------------------------------------------------
 *
 * O argumento para `false` parecia bom: *"a arte é a verdade, então não corte
 * nada dela"*. O mapa de divergência mostrou o que isso custa — **magenta
 * tracejado contornando o TRONCO INTEIRO**, de ombro a ombro e até a base.
 *
 * A causa: o PNG volta do gerador reencodado, e o preto do contorno do boneco
 * não sai idêntico ao da base. Preto que a base "não tinha" entra na peça **sem
 * âncora** (`extrair.ts`: desenho novo é da peça), e como o contorno do cabelo
 * encosta no da cabeça, a inundação desceu pelo queixo, pelo pescoço e deu a
 * volta no tronco. Medido: **11 492 px = 9,3%** da máscara da arte, tudo lido
 * como "o render perdeu isto".
 *
 * Não perdeu. Aquilo nunca foi peça: `extrair.ts` limita, e é da máscara
 * limitada que o literal nasceu. Comparar a arte ILIMITADA contra um render da
 * peça limitada é comparar duas definições diferentes de peça — exatamente o que
 * a invariante *uma régua, duas imagens* existe para impedir.
 *
 * Com `true` a regra de região vale dos dois lados, simetricamente.
 */
function mascaras(com: Img, sem: Img): Par {
  const m = mascaraDaPeca(com, sem, true);
  return { peca: m.peca, traco: m.traco };
}

interface Comparacao {
  iou: number;
  soA: number;
  soB: number;
  ambos: number;
  nA: number;
  nB: number;
}

/**
 * IoU e as duas diferenças, dentro de um domínio.
 *
 * `nA` e `nB` viajam junto e são impressos **sempre**: IoU com denominador
 * minúsculo é uma mentira plausível, e a lição é o `de 0` que `gate-menos-um.ts`
 * imprimia antes de `considerados` passar a viajar no laudo.
 */
function comparar(a: Uint8Array, b: Uint8Array, dentro: Uint8Array): Comparacao {
  let soA = 0,
    soB = 0,
    ambos = 0,
    nA = 0,
    nB = 0;
  for (let i = 0; i < a.length; i++) {
    if (!dentro[i]) continue;
    const x = a[i],
      y = b[i];
    if (x) nA++;
    if (y) nB++;
    if (x && y) ambos++;
    else if (x) soA++;
    else if (y) soB++;
  }
  const uniao = ambos + soA + soB;
  return { iou: uniao ? ambos / uniao : 0, soA, soB, ambos, nA, nB };
}

/**
 * OS TRÊS DOMÍNIOS, e nenhum deles sozinho responde.
 *
 *  - **canvas**: o número implacável. Inclui as 92 px de folga acima do `viewBox`,
 *    que são espaço da ARTE e que o render corta por construção;
 *  - **viewBox**: separa *"o render traiu"* de *"o viewport cortou"*;
 *  - **cabeça**: acima do queixo, onde a leitura a 56 px se decide. `Y_QUEIXO`
 *    vem de `base.ts` e é derivado de `CAIXA_CABECA`, não escrito à mão.
 */
function dominios(): { nome: string; mascara: Uint8Array }[] {
  const canvas = new Uint8Array(LADO * LADO).fill(1);
  const vb = new Uint8Array(LADO * LADO);
  const cab = new Uint8Array(LADO * LADO);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const u = paraUnidade(x, y);
      const noVb = u.x >= 0 && u.x <= VIEWBOX.w && u.y >= 0 && u.y <= VIEWBOX.h;
      const i = y * LADO + x;
      if (noVb) vb[i] = 1;
      if (noVb && u.y <= Y_QUEIXO) cab[i] = 1;
    }
  }
  return [
    { nome: "canvas inteiro", mascara: canvas },
    { nome: "dentro do viewBox", mascara: vb },
    { nome: "acima do queixo", mascara: cab },
  ];
}

interface Desvio {
  p95: number;
  max: number;
  amostras: number;
}

const percentil = (v: number[], q: number): number => {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

/**
 * DESVIO LATERAL — a diferença de borda esquerda e direita, linha a linha.
 *
 * Em unidades do `viewBox`, contra `MEIO_TRACO`. **O que ele não mede:** um
 * deslocamento puramente vertical numa borda horizontal dá zero aqui, e é
 * exatamente por isso que existe o desvio de topo abaixo. As duas réguas juntas
 * cobrem as duas direções; uma sozinha esconde metade do erro.
 */
function desvioLateral(a: Uint8Array, b: Uint8Array): Desvio {
  const v: number[] = [];
  for (let y = 0; y < LADO; y++) {
    let ea = -1,
      da = -1,
      eb = -1,
      db = -1;
    for (let x = 0; x < LADO; x++) {
      const i = y * LADO + x;
      if (a[i]) {
        if (ea < 0) ea = x;
        da = x;
      }
      if (b[i]) {
        if (eb < 0) eb = x;
        db = x;
      }
    }
    if (ea < 0 || eb < 0) continue;
    v.push(Math.abs(ea - eb) / ESCALA, Math.abs(da - db) / ESCALA);
  }
  return { p95: percentil(v, 0.95), max: v.length ? Math.max(...v) : 0, amostras: v.length };
}

/** DESVIO DE TOPO — a diferença da primeira linha com tinta, coluna a coluna. */
function desvioDeTopo(a: Uint8Array, b: Uint8Array): Desvio {
  const v: number[] = [];
  for (let x = 0; x < LADO; x++) {
    let ta = -1,
      tb = -1;
    for (let y = 0; y < LADO && (ta < 0 || tb < 0); y++) {
      const i = y * LADO + x;
      if (ta < 0 && a[i]) ta = y;
      if (tb < 0 && b[i]) tb = y;
    }
    if (ta < 0 || tb < 0) continue;
    v.push(Math.abs(ta - tb) / ESCALA);
  }
  return { p95: percentil(v, 0.95), max: v.length ? Math.max(...v) : 0, amostras: v.length };
}

/** A primeira linha com tinta de uma máscara, em unidades do `viewBox`. */
function topoEmUnidades(m: Uint8Array): number | null {
  for (let y = 0; y < LADO; y++)
    for (let x = 0; x < LADO; x++) if (m[y * LADO + x]) return paraUnidade(x, y).y;
  return null;
}

/** A caixa de uma máscara, em px do canvas. */
function caixaDaMascara(m: Uint8Array): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = LADO,
    y0 = LADO,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < LADO; y++)
    for (let x = 0; x < LADO; x++)
      if (m[y * LADO + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

// ---------------------------------------------------------------------------
// O mapa de divergência
// ---------------------------------------------------------------------------

/**
 * As três cores, e o azul é deliberado.
 *
 * `fidelidade.ts` usa ciano para "só no render". Aqui não dá: **ciano é a cor da
 * própria peça** nos dois painéis ao lado, e o olho leria o mapa como mais um
 * render. Azul não aparece em lugar nenhum da paleta instrumental.
 */
const DIV = {
  fundo: [251, 248, 245],
  ambos: [190, 185, 178],
  soArte: [255, 0, 170],
  soRender: [46, 123, 224],
} as const;

async function salvarMapa(a: Uint8Array, b: Uint8Array, arq: string): Promise<void> {
  const buf = Buffer.alloc(LADO * LADO * 3);
  for (let i = 0; i < LADO * LADO; i++) {
    const c = a[i] && b[i] ? DIV.ambos : a[i] ? DIV.soArte : b[i] ? DIV.soRender : DIV.fundo;
    buf[i * 3] = c[0];
    buf[i * 3 + 1] = c[1];
    buf[i * 3 + 2] = c[2];
  }
  await sharp(buf, { raw: { width: LADO, height: LADO, channels: 3 } }).png().toFile(arq);
}

// ---------------------------------------------------------------------------
// O controle 6: o literal que o navegador mostra é o que o conversor produz?
// ---------------------------------------------------------------------------

/**
 * A tolerância é **5e-4**: metade da última casa que o literal imprime.
 *
 * `converter.ts` escreve com `toFixed(3)`, então uma diferença menor que meia
 * casa é o arredondamento da escrita e não divergência de conteúdo. Qualquer
 * coisa acima disso é literal velho.
 */
const TOL_LITERAL = 5e-4;

function mesmoLaco(a: readonly PontoFranja[] | undefined, b: readonly PontoFranja[] | undefined) {
  if (!a || !b) return a === b || (!a?.length && !b?.length);
  if (a.length !== b.length) return false;
  return a.every(
    (p, i) => Math.abs(p.t - b[i].t) <= TOL_LITERAL && Math.abs(p.y - b[i].y) <= TOL_LITERAL,
  );
}

function conferirLiteral(fresco: Cabelo, colado: Cabelo | undefined): string[] {
  if (!colado) return ["a peça não está em `pecas-da-arte.ts`"];
  const q: string[] = [];
  if (!mesmoLaco(fresco.massa, colado.massa))
    q.push(`massa: ${fresco.massa?.length ?? 0} pontos frescos × ${colado.massa?.length ?? 0} colados`);
  if (!mesmoLaco(fresco.clara, colado.clara))
    q.push(`clara: ${fresco.clara?.length ?? 0} × ${colado.clara?.length ?? 0}`);
  if (JSON.stringify(fresco.linhas ?? []) !== JSON.stringify(colado.linhas ?? []))
    q.push(`linhas: ${JSON.stringify(fresco.linhas)} × ${JSON.stringify(colado.linhas)}`);
  if ((fresco.claras?.length ?? 0) !== (colado.claras?.length ?? 0))
    q.push(`claras: ${fresco.claras?.length ?? 0} × ${colado.claras?.length ?? 0}`);
  if ((fresco.formas?.length ?? 0) !== (colado.formas?.length ?? 0))
    q.push(`formas: ${fresco.formas?.length ?? 0} × ${colado.formas?.length ?? 0}`);
  // AS CAMADAS DA PEÇA TRANSCRITA — e sem elas aqui o controle 6 aprovaria literal
  // velho pelos campos que não conhece, que é o buraco exato que ele existe para
  // não ter. Comparadas laço a laço, não por contagem: mesmo número de formas com
  // outras coordenadas é literal envelhecido do mesmo jeito.
  for (const campo of ["nucleo", "pretas"] as const) {
    const a = fresco[campo];
    const b = colado[campo];
    if ((a?.length ?? 0) !== (b?.length ?? 0)) {
      q.push(`${campo}: ${a?.length ?? 0} forma(s) frescas × ${b?.length ?? 0} coladas`);
      continue;
    }
    const ruim = (a ?? []).findIndex((f, i) => !mesmoLaco(f, b![i]));
    if (ruim >= 0) q.push(`${campo}[${ruim}]: ${a![ruim].length} pontos frescos × ${b![ruim].length} colados`);
  }
  return q;
}

// ---------------------------------------------------------------------------
// O programa
// ---------------------------------------------------------------------------

const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const u = (v: number) => `${v.toFixed(1)} u`;

async function principal(): Promise<void> {
  const bruto = process.argv[2] ?? "entrada";
  const arte = bruto.endsWith(".png") ? bruto : `${PASTA}/${bruto}.png`;
  const nome = (arte.split(/[\\/]/).pop() ?? arte).replace(/\.png$/i, "");
  // A VARIANTE DE NÚCLEO FORÇADA — o que põe as duas folhas do Bloco 13 lado a
  // lado. Sem a bandeira, quem manda é `TRANSCREVEM` e o que sai é o que o produto
  // vê; com ela, o **destino muda junto**, senão a segunda folha escreveria por
  // cima da primeira e a comparação compararia uma imagem com ela mesma — o
  // defeito 5 que o Bloco 12 achou na seção 5 da outra folha.
  const variante = process.argv
    .find((a) => a.startsWith("--variante="))
    ?.split("=")[1] as VarianteNucleo | undefined;
  if (variante && variante !== "fiel" && variante !== "lei")
    throw new Error(`--variante= aceita \`fiel\` ou \`lei\`, recebeu \`${variante}\``);
  const destino = `${saidaDaArte(arte)}/revisao${variante ? `-${variante}` : ""}`;
  mkdirSync(destino, { recursive: true });

  // ------------------------------------------------- a tinta cai na janela?
  //
  // A AMARRA DE COR, e ela roda antes de qualquer medida. Se o ciano que pinta o
  // render não passar no mesmo teste que define a peça na arte, os dois lados
  // estão sendo classificados por réguas diferentes e todo número abaixo é ruído.
  const hex = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const claro = hex(CIANO_INSTRUMENTAL);
  const escuro = hex(escurecer(CIANO_INSTRUMENTAL));
  if (!ehTeal(...claro) || !ehTeal(...escuro)) {
    throw new Error(
      `a tinta do render não passa em \`ehTeal\`: ` +
        `${CIANO_INSTRUMENTAL} ${ehTeal(...claro)} · ${escurecer(CIANO_INSTRUMENTAL)} ${ehTeal(...escuro)}`,
    );
  }

  console.log(`\nREVISÃO DE \`${nome}\` — arte × render, mesma régua nos dois lados\n`);
  console.log(
    `  tinta do render: ${CIANO_INSTRUMENTAL} (massa) e ${escurecer(CIANO_INSTRUMENTAL)} (sombra) — ` +
      `as duas passam em \`ehTeal\``,
  );

  // ------------------------------------------------------------- as medidas
  const laudo = await gateMenosUm(arte);
  const c: Convertido = await converter(arte, undefined, variante);
  const colada = (PECAS_DA_ARTE as Record<string, Cabelo | undefined>)[nome];

  console.log(
    `  Gate −1: ${laudo.aprovada ? "APROVADA" : "REPROVADA"}   ` +
      `selo da arte ${selo(readFileSync(arte)).slice(0, 8)}   ` +
      `selo da base ${selo(readFileSync(PNG_BASE)).slice(0, 8)}`,
  );

  // ----------------------------------------------- CONTROLE 6, antes de tudo
  //
  // Com `--variante` forçada, a peça medida NÃO é a que está colada — é a outra
  // metade da bancada de arte. Comparar as duas acusaria divergência correta e
  // inútil, então o controle é **dispensado com o motivo dito**, e não silenciado.
  const queixas = variante ? [] : conferirLiteral(c.peca, colada);
  console.log(`\n  ── controle 6 · o literal colado é o que o conversor produz hoje?`);
  if (variante) {
    console.log(
      `     — dispensado: rodando a variante \`${variante}\` FORÇADA, que não é a colada.` +
        ` A folha desta rodada é bancada de arte, não conferência de literal.`,
    );
  } else if (queixas.length) {
    console.log(`     ✗ DIVERGE — a folha recusa desenhar:`);
    for (const q of queixas) console.log(`       · ${q}`);
    console.log(
      `\n     O navegador está mostrando um literal velho. Rode \`npm run arte:converter ${arte}\`` +
        ` e cole de novo em \`src/lib/avatar/estilo/pecas-da-arte.ts\` antes de julgar a peça.`,
    );
    process.exitCode = 1;
    return;
  } else {
    console.log(`     · confere — ${c.peca.massa!.length} pontos de massa, ponto a ponto`);
  }

  const nav = await abrirNavegador();
  const doms = dominios();

  // -------------------------------------------------------- os renders 1024²
  //
  // DOIS carecas, um por escala. `mascaraDaPeca` compara duas imagens pixel a
  // pixel: a base tem de estar na MESMA escala da imagem com peça, senão o boneco
  // inteiro entra na conta como "mudou".
  const png = (k: string) => `${destino}/.r-${k}.png`;
  // A FIDELIDADE, a `escala: 1` e SEM RECORTE — o sistema em que a arte foi
  // desenhada, e sem a guilhotina que responderia outra pergunta.
  const forma = { escala: 1, semRecorte: true };
  const rCareca1 = await renderNoCanvasDaArte(nav, "c1", forma, png("careca-1"));
  const rCareca92 = await renderNoCanvasDaArte(
    nav,
    "c92",
    { escala: ESCALA_PADRAO },
    png("careca-92"),
  );

  const rPeca = await renderNoCanvasDaArte(nav, "rp", { ...forma, peca: c.peca }, png("peca"));
  // O gêmeo do controle 1: render INDEPENDENTE da mesma coisa. Comparar um buffer
  // com ele mesmo provaria só que `===` funciona.
  const rGemeo = await renderNoCanvasDaArte(nav, "rg", { ...forma, peca: c.peca }, png("gemeo"));
  // A ISCA — uma peça PROPOSITALMENTE DIFERENTE, para provar que a comparação
  // enxerga diferença. Sem ela o controle mediria só que `===` funciona.
  //
  // Era a `entrada-3`, apagada em 2026-08-08 junto com a poda do catálogo. A isca
  // passou a ser uma peça PARAMÉTRICA, e a troca é melhoria: a `entrada-3` era outra
  // arte, e no dia em que alguém a revisasse a isca seria a própria peça sob exame —
  // o controle compararia uma coisa com ela mesma e passaria por vacuidade. Um
  // paramétrico nunca é a peça sob exame, porque esta rota só revisa arte.
  const rTrocada = await renderNoCanvasDaArte(
    nav,
    "rt",
    { ...forma, peca: CABELOS.coque },
    png("trocada"),
  );

  // A ESCADA, a 92% — aqui a escala é o OBJETO da medida, não o ruído dela.
  const rCrua92 = await renderNoCanvasDaArte(
    nav,
    "r92",
    { peca: c.crua, escala: ESCALA_PADRAO },
    png("crua-92"),
  );
  const rPeca92 = await renderNoCanvasDaArte(
    nav,
    "p92",
    { peca: c.peca, escala: ESCALA_PADRAO },
    png("peca-92"),
  );
  const rCrua1 = await renderNoCanvasDaArte(nav, "r1", { ...forma, peca: c.crua }, png("crua-1"));
  // O par do controle 4: a MESMA peça a 92%, também sem recorte. Comparar um lado
  // recortado com um lado inteiro foi o que fez o controle acusar 41,3 u.
  const rPeca92sr = await renderNoCanvasDaArte(
    nav,
    "p92s",
    { peca: c.peca, escala: ESCALA_PADRAO, semRecorte: true },
    png("peca-92-sr"),
  );
  const rCareca92sr = await renderNoCanvasDaArte(
    nav,
    "c92s",
    { escala: ESCALA_PADRAO, semRecorte: true },
    png("careca-92-sr"),
  );

  const imgArte = await carregar(arte, FUNDO);
  const imgBase = await carregar(PNG_BASE, FUNDO);

  const mArte = mascaras(imgArte, imgBase);
  const mPeca = mascaras(rPeca, rCareca1);
  const mGemeo = mascaras(rGemeo, rCareca1);
  const mTrocada = mascaras(rTrocada, rCareca1);
  const mCrua1 = mascaras(rCrua1, rCareca1);
  const mCrua92 = mascaras(rCrua92, rCareca92);
  const mPeca92 = mascaras(rPeca92, rCareca92);
  const mPeca92sr = mascaras(rPeca92sr, rCareca92sr);
  const vazia = new Uint8Array(LADO * LADO);

  // --------------------------------------------------------- OS CONTROLES
  const noVb = doms[1].mascara;
  const ctl = {
    identidade: comparar(mPeca.peca, mGemeo.peca, noVb),
    careca: comparar(mArte.peca, vazia, noVb),
    trocada: comparar(mArte.peca, mTrocada.peca, noVb),
    certa: comparar(mArte.peca, mPeca.peca, noVb),
  };
  const topo1 = topoEmUnidades(mPeca.peca);
  /** O topo a 92% **sem recorte** — é o par honesto do `topo1` para o controle 4. */
  const topo92sr = topoEmUnidades(mPeca92sr.peca);
  /** O topo a 92% COM recorte: o que o produto entrega. Vai para a escada. */
  const topo92 = topoEmUnidades(mPeca92.peca);

  console.log(`\n  ── os controles da régua (todos dentro do viewBox, a escala 1)\n`);
  console.log(`     # controle              IoU        só-A        só-B     células A / B`);
  const linhaCtl = (n: string, r: Comparacao) =>
    console.log(
      `     ${n.padEnd(22)} ${pct(r.iou).padStart(6)}  ${String(r.soA).padStart(9)}  ` +
        `${String(r.soB).padStart(9)}   ${String(r.nA).padStart(7)} / ${r.nB}`,
    );
  linhaCtl("1 identidade", ctl.identidade);
  linhaCtl("2 careca (sem peça)", ctl.careca);
  linhaCtl("3 peça trocada", ctl.trocada);
  linhaCtl("   — a peça certa —", ctl.certa);
  // O controle 4 é o único que fala das DUAS escalas, e é o que prova que `naTela`
  // e o rasterizador concordam: a mesma peça, medida a 1 e a 0,92, tem de bater
  // com a previsão da transformação. Se não bater, o registro é suspeito.
  const previsto = topo1 === null ? null : naTela({ y: topo1 }, ESCALA_PADRAO).y;
  console.log(
    `\n     4 escala (os dois lados SEM recorte): topo a 100% ${topo1 === null ? "—" : u(topo1)} · ` +
      `a ${pct(ESCALA_PADRAO)} ${topo92sr === null ? "—" : u(topo92sr)} ` +
      `(previsto por \`naTela\` ${previsto === null ? "—" : u(previsto)}, ` +
      `diferença ${previsto === null || topo92sr === null ? "—" : u(Math.abs(previsto - topo92sr))})`,
  );

  const vereditos: [string, boolean, string][] = [
    ["1 identidade = 100%", ctl.identidade.iou > 0.999, pct(ctl.identidade.iou)],
    ["2 careca ≈ 0%", ctl.careca.iou < 0.005, pct(ctl.careca.iou)],
    ["3 trocada < certa", ctl.trocada.iou < ctl.certa.iou - 0.05, `${pct(ctl.trocada.iou)} < ${pct(ctl.certa.iou)}`],
    [
      "4 naTela bate no raster",
      previsto !== null && topo92sr !== null && Math.abs(previsto - topo92sr) <= 2,
      previsto === null || topo92sr === null ? "—" : u(Math.abs(previsto - topo92sr)),
    ],
    ["5 denominadores > 0", ctl.certa.nA > 0 && ctl.certa.nB > 0, `${ctl.certa.nA} / ${ctl.certa.nB}`],
    ["6 literal confere", true, "sim"],
  ];
  console.log("");
  for (const [n, ok, v] of vereditos) console.log(`     ${ok ? "·" : "✗"} ${n.padEnd(24)} ${v}`);
  const controlesOk = vereditos.every(([, ok]) => ok);
  if (!controlesOk) {
    console.log(
      `\n     ✗ UM CONTROLE FALHOU. Os números da peça abaixo não valem — a régua` +
        ` está medindo outra coisa. Conserte a régua antes de olhar a peça.`,
    );
  }

  // ---------------------------------------------------------- A FIDELIDADE
  console.log(
    `\n  ── fidelidade: a arte contra o render, a escala 1 ` +
      `(o sistema em que a arte foi desenhada)\n`,
  );
  console.log(`     domínio                  IoU      só na arte   só no render   células arte / render`);
  for (const d of doms) {
    const r = comparar(mArte.peca, mPeca.peca, d.mascara);
    console.log(
      `     ${d.nome.padEnd(22)} ${pct(r.iou).padStart(6)}  ${String(r.soA).padStart(11)}  ` +
        `${String(r.soB).padStart(12)}   ${String(r.nA).padStart(9)} / ${r.nB}`,
    );
  }

  const dLat = desvioLateral(mArte.peca, mPeca.peca);
  const dTop = desvioDeTopo(mArte.peca, mPeca.peca);
  console.log(
    `\n     desvio lateral (linha a linha)   p95 ${u(dLat.p95)}  máx ${u(dLat.max)}  ` +
      `${dLat.amostras} amostras   ${dLat.p95 <= MEIO_TRACO ? "·" : "✗"} teto ${u(MEIO_TRACO)}`,
  );
  console.log(
    `     desvio de topo (coluna a coluna) p95 ${u(dTop.p95)}  máx ${u(dTop.max)}  ` +
      `${dTop.amostras} amostras   ${dTop.p95 <= MEIO_TRACO ? "·" : "✗"} teto ${u(MEIO_TRACO)}`,
  );

  // A PONTA: onde a arte chega e onde a peça chega, acima da coroa. Tudo a
  // escala 1, que é onde a arte mora.
  const topoArte = topoEmUnidades(mArte.peca);
  const topoCrua1 = topoEmUnidades(mCrua1.peca);
  const coroa = CAIXA_CABECA.y0;
  const acima = (t: number | null) => (t === null ? "—" : u(coroa - t));
  console.log(
    `\n     a ponta, acima da coroa (y ${coroa.toFixed(1)}), a escala 1:  ` +
      `arte ${acima(topoArte)}  ·  peça crua ${acima(topoCrua1)}  ·  ` +
      `peça comprimida ${acima(topo1)}`,
  );
  console.log(
    `     compressão k = ${c.k.toFixed(3)}   pico ${c.picoAntes.toFixed(1)} → ${c.picoDepois.toFixed(1)} u` +
      (topoArte !== null && topo1 !== null && coroa - topoArte > 0
        ? `   — a peça guardou ${pct((coroa - topo1) / (coroa - topoArte))} da ponta da arte`
        : ""),
  );

  // A ESCADA DE ESCALA — a pergunta que os 92% abriram: a compressão ainda se paga?
  //
  // "Encosta no teto" = a máscara tem tinta na primeira linha do `viewBox`, que no
  // canvas da arte é `ORIGEM.y`. É a assinatura da guilhotina: o viewport corta
  // ali sem erro e sem aviso.
  const encosta = (m: Uint8Array) => {
    for (let x = 0; x < LADO; x++) if (m[Math.round(ORIGEM.y) * LADO + x]) return true;
    return false;
  };
  const topoCrua92 = topoEmUnidades(mCrua92.peca);
  console.log(
    `\n     a escada de escala, no quadro do produto:` +
      `\n       crua  a ${pct(ESCALA_PADRAO)}: começa em ${topoCrua92 === null ? "—" : u(topoCrua92)}  ` +
      `${encosta(mCrua92.peca) ? "✗ ENCOSTA no teto" : "· cabe"}` +
      `\n       peça  a ${pct(ESCALA_PADRAO)}: começa em ${topo92 === null ? "—" : u(topo92)}  ` +
      `${encosta(mPeca92.peca) ? "✗ ENCOSTA no teto" : "· cabe"}` +
      `\n       peça  a 100%: começa em ${topo1 === null ? "—" : u(topo1)}  ` +
      `${encosta(mPeca.peca) ? "✗ ENCOSTA no teto" : "· cabe"}`,
  );

  // O PRETO — a segunda trinca.
  const tArte = comparar(mArte.traco, mPeca.traco, noVb);
  console.log(
    `\n     o preto: IoU ${pct(tArte.iou)}   área render ÷ arte ` +
      `${tArte.nA ? (tArte.nB / tArte.nA).toFixed(2) : "—"}×   ` +
      `(${tArte.nA} px na arte, ${tArte.nB} no render)`,
  );

  // ------------------------------------------------------------------------
  // O VAZAMENTO ABAIXO DO QUEIXO — o que esta régua CONTAMINA, medido
  // ------------------------------------------------------------------------
  //
  // `mascaraDaPeca` devolve à peça o preto que ENCOSTA nela, com âncora de um
  // traço a partir do ciano. No lado do render isso é assimétrico e a assimetria
  // é conhecida: o traço da peça é preto NOVO (a careca não o tem ali), então
  // entra sem âncora — e de dentro dele a inundação pode seguir pelo contorno da
  // cabeça, descer o queixo e o pescoço, e trazer junto pedaço de boneco que não
  // é peça nenhuma.
  //
  // A massa desta peça termina no queixo, então tinta MUITO abaixo de `Y_QUEIXO`
  // não é cabelo: é a régua vazando. O número existe para que uma mecha
  // fantasma no colarinho seja lida como artefato — e não vá para a lista de
  // defeitos da peça, que é o erro que esta rota já cometeu cinco vezes.
  const abaixoDoQueixo = (m: Uint8Array) => {
    let n = 0;
    for (let y = 0; y < LADO; y++) {
      if (paraUnidade(0, y).y <= Y_QUEIXO) continue;
      for (let x = 0; x < LADO; x++) if (m[y * LADO + x]) n++;
    }
    return n;
  };
  const vazArte = abaixoDoQueixo(mArte.peca);
  const vazRender = abaixoDoQueixo(mPeca.peca);
  console.log(
    `\n     vazamento da régua abaixo do queixo (y ${Y_QUEIXO.toFixed(1)}):  ` +
      `arte ${vazArte} px (${pct(vazArte / (ctl.certa.nA || 1))})  ·  ` +
      `render ${vazRender} px (${pct(vazRender / (ctl.certa.nB || 1))})` +
      `${Math.abs(vazRender - vazArte) > 2000 ? "   ✗ ASSIMÉTRICO — trate como artefato, não como defeito" : "   · simétrico"}`,
  );

  // A FRAÇÃO DENSA — o número que decide o `linhas`.
  const piores = c.traco.porTrecho
    .map((f, i) => [i, f] as [number, number])
    .sort((a, b) => a[1] - b[1])
    .slice(0, 8);
  console.log(
    `\n     o traço declarado: ${c.traco.arcos} arco(s), ${pct(c.traco.fracao)} dos trechos   ` +
      `${JSON.stringify(c.peca.linhas ?? [])}`,
  );
  console.log(
    `     a arte pintou de preto ${pct(c.traco.densa)} do perímetro DENSO  ` +
      `— é a mesma sonda antes da regra de maioria`,
  );
  console.log(
    `     os 8 trechos mais fracos: ${piores.map(([i, f]) => `#${i} ${pct(f)}`).join("  ")}`,
  );

  // O resto do que já vinha medido.
  console.log(
    `\n     massa ${c.n.massa} pts · desvio de corda ${u(c.desvios.massa)} (piso ${u(c.pisos.massa)})   ` +
      `clara ${c.n.clara} pts   formas irmãs ${c.formasIrmas}   cruzamentos ${c.cruzamentos}`,
  );

  // A VARREDURA — "acabou" ou "faltou ponto"? `piso` sozinho não separa os dois.
  const varr = c.varredura;
  const ultimo = varr[varr.length - 1];
  const penult = varr[varr.length - 2];
  console.log(
    `     varredura de N: ${varr.map((v) => `${v.n}→${v.max.toFixed(1)}`).join("  ")}`,
  );
  if (ultimo && penult) {
    const caiu = penult.max - ultimo.max;
    console.log(
      `     ${caiu > 0.5 ? "✗" : "·"} do penúltimo N ao teto o desvio ` +
        `${caiu > 0.5 ? `AINDA CAIU ${u(caiu)}` : `só caiu ${u(caiu)}`} — ` +
        `${caiu > 0.5 ? "a curva foi interrompida pelo teto de pontos, não pela arte" : "o piso é da arte"}`,
    );
  }
  console.log(
    `     perda: massa ${c.perda.massa} px · clara ${c.perda.clara} px   ` +
      `borda amputada por região ${pct(c.amputada)}`,
  );

  const svgProduto = compor({
    pele: PELE[2],
    cabelo: CABELO[1],
    modeloCabelo: c.peca,
    ns: "pr",
    escala: ESCALA_PADRAO,
  });
  const formas = (svgProduto.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
  console.log(
    `     o composto do produto: ${formas} formas · ` +
      `${Buffer.byteLength(svgProduto, "utf-8")} bytes (teto 10 240)`,
  );

  // ------------------------------------------------------------- A FOLHA
  // O RECORTE É UM SÓ para todos os painéis de todas as seções, e sai da UNIÃO das
  // máscaras que vão aparecer — incluindo a crua, que é a mais alta das três da
  // escada. Recortes diferentes lado a lado fazem o olho comparar enquadramentos.
  const rec = (() => {
    const caixas = [mArte.peca, mPeca.peca, mCrua1.peca, mCrua92.peca, mPeca92.peca, mTrocada.peca]
      .map(caixaDaMascara)
      .filter((b): b is NonNullable<typeof b> => b !== null);
    const m = Math.round(TRACO * ESCALA);
    const x0 = Math.max(0, Math.min(...caixas.map((b) => b.x0)) - m);
    const y0 = Math.max(0, Math.min(...caixas.map((b) => b.y0)) - m);
    const x1 = Math.min(LADO - 1, Math.max(...caixas.map((b) => b.x1)) + m);
    const y1 = Math.min(LADO - 1, Math.max(...caixas.map((b) => b.y1)) + m);
    return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  })();
  console.log(
    `\n  recorte dos painéis, UM só: x ${rec.left} y ${rec.top} ${rec.width}×${rec.height} px ` +
      `(união das máscaras que aparecem, mais um traço)`,
  );

  const mapaArq = `${destino}/.r-mapa.png`;
  await salvarMapa(mArte.peca, mPeca.peca, mapaArq);

  // O PRETO, nos mesmos três painéis e nas mesmas três cores da seção 1: a mesma
  // função desenha "só a arte" (magenta contra vazio), "só o render" (azul contra
  // vazio) e a divergência. Um segundo desenhador de máscara divergiria do
  // primeiro no dia em que uma das cores mudasse.
  const pretoArte = `${destino}/.r-preto-arte.png`;
  const pretoRender = `${destino}/.r-preto-render.png`;
  const pretoMapa = `${destino}/.r-preto-mapa.png`;
  await salvarMapa(mArte.traco, vazia, pretoArte);
  await salvarMapa(vazia, mPeca.traco, pretoRender);
  await salvarMapa(mArte.traco, mPeca.traco, pretoMapa);

  const recortar = async (origem: string, chave: string) => {
    const alvo = `${destino}/.c-${chave}.png`;
    await sharp(origem).extract(rec).png().toFile(alvo);
    return b64(alvo);
  };

  const trinca = [
    ["a arte — o modelo", await recortar(arte, "arte")],
    ["o render — a peça, a escala 1", await recortar(png("peca"), "render")],
    ["a divergência", await recortar(mapaArq, "mapa")],
  ];
  const trincaPreto = [
    ["o preto da arte", await recortar(pretoArte, "pa")],
    ["o preto do render", await recortar(pretoRender, "pr")],
    ["a divergência do preto", await recortar(pretoMapa, "pm")],
  ];
  const escada = [
    [`crua a ${pct(ESCALA_PADRAO)} — sem compressão`, await recortar(png("crua-92"), "e-crua")],
    [`peça a ${pct(ESCALA_PADRAO)} — o que o produto entrega`, await recortar(png("peca-92"), "e92")],
    ["peça a 100% — o sistema interno", await recortar(png("peca"), "e100")],
  ];
  const controles = [
    ["controle 2 — careca, sem peça nenhuma", await recortar(png("careca-1"), "cctl")],
    ["controle 3 — outra peça no lugar desta", await recortar(png("trocada"), "tctl")],
  ];

  // ------------------------------------------------------------------------
  // OS CANDIDATOS DE N — o experimento, e ele NÃO muda o teto de ninguém
  // ------------------------------------------------------------------------
  //
  // A varredura mostrou que o desvio ainda caía no último N da escala. Isso diz
  // que faltou ponto, mas **não** diz quanto 96 ou 128 comprariam — e subir um
  // teto global com base numa peça engordaria todas as próximas sem necessidade.
  //
  // Então: mede-se aqui, lado a lado, e a escolha é do Doug. `escolherN` continua
  // como está; quem atravessa o teto é este experimento, uma vez, declarado.
  const pedidos = (process.argv.find((a) => a.startsWith("--candidatos="))?.split("=")[1] ?? "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  interface Candidato {
    n: number;
    conv: Convertido;
    iou: number;
    /**
     * O IoU DO PRETO — a coluna que a transcrição do Bloco 13 tornou a que decide.
     *
     * Com o contorno sintetizado, N mexia só na forma: o stroke de 12 u saía do
     * mesmo jeito em qualquer decimação. Com o preto TRANSCRITO ele é a diferença
     * entre dois laços decimados, e a tolerância de `escolherN` (meio traço, 6 u)
     * come a banda por fora — medido na `chanel`: déficit de 5 459 px de preto
     * contra 5 131 px que a decimação da massa perde sozinha.
     */
    iouPreto: number;
    razaoPreto: number;
    latP95: number;
    topP95: number;
    bytes: number;
    formas: number;
    png: string;
  }
  const candidatos: Candidato[] = [];
  for (const n of pedidos) {
    // A VARIANTE VIAJA JUNTO. Sem ela, a tabela de candidatos mediria sempre a
    // variante do produto enquanto o resto da folha mede a forçada — régua que
    // sobrevive à mudança do que ela mede e passa a medir outra coisa.
    const cv = await converter(arte, n, variante);
    const arq = png(`cand-${n}`);
    const im = await renderNoCanvasDaArte(nav, `k${n}`, { ...forma, peca: cv.peca }, arq);
    const m = mascaras(im, rCareca1);
    const svg = compor({
      pele: PELE[2],
      cabelo: CABELO[1],
      modeloCabelo: cv.peca,
      ns: `k${n}`,
      escala: ESCALA_PADRAO,
    });
    const tk = comparar(mArte.traco, m.traco, noVb);
    candidatos.push({
      n: cv.n.massa,
      conv: cv,
      iou: comparar(mArte.peca, m.peca, noVb).iou,
      iouPreto: tk.iou,
      razaoPreto: tk.nA ? tk.nB / tk.nA : 0,
      latP95: desvioLateral(mArte.peca, m.peca).p95,
      topP95: desvioDeTopo(mArte.peca, m.peca).p95,
      bytes: Buffer.byteLength(svg, "utf-8"),
      formas: (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length,
      png: arq,
    });
  }
  if (candidatos.length) {
    console.log(`\n  ── os candidatos de N (experimento; \`escolherN\` não foi tocada)\n`);
    console.log(
      `     N     desvio da corda   IoU vs arte   IoU do preto   razão   lat. p95   topo p95    bytes   formas`,
    );
    for (const k of candidatos) {
      console.log(
        `     ${String(k.n).padStart(3)}   ${u(k.conv.desvios.massa).padStart(13)}   ` +
          `${pct(k.iou).padStart(11)}   ${pct(k.iouPreto).padStart(12)}   ` +
          `${k.razaoPreto.toFixed(2).padStart(5)}×   ${u(k.latP95).padStart(8)}   ${u(k.topP95).padStart(8)}   ` +
          `${String(k.bytes).padStart(6)}   ${String(k.formas).padStart(6)}`,
      );
    }
  }

  // Os 56 px, na cor do PRODUTO — é o único lugar da folha onde a cor real entra,
  // porque é o único painel que pergunta como o aluno vê.
  const larg56 = Math.round((P56 * VIEWBOX.w) / VIEWBOX.h);
  const em56 = async (chave: string, peca: Cabelo | undefined) => {
    const arq = `${destino}/.s-${chave}.png`;
    await renderizarSvg(
      nav,
      compor({
        pele: PELE[2],
        cabelo: CABELO[1],
        ...(peca ? { modeloCabelo: peca } : {}),
        ns: `s${chave}`,
        escala: ESCALA_PADRAO,
      }),
      larg56,
      P56,
      arq,
      "transparent",
    );
    return b64(arq);
  };
  const tira: [string, string][] = [
    [nome, await em56("peca", c.peca)],
    ["[curto] — aprovado", await em56("curto", CABELOS.coque)],
    ["careca — o piso", await em56("careca", undefined)],
  ];
  const cand56: Record<number, string> = {};
  for (const k of candidatos) cand56[k.n] = await em56(`c${k.n}`, k.conv.peca);
  const FUNDOS: [string, string][] = [
    ["claro", "#FBF8F5"],
    ["magenta", "#FF00AA"],
    ["escuro", "#1B1B1F"],
    ["xadrez", "repeating-conic-gradient(#DDD 0% 25%, #FFF 0% 50%) 50% / 12px 12px"],
  ];

  const fig = ([rot, dado]: [string, string] | string[]) =>
    `<figure><img src="${dado}">${rot ? `<figcaption>${rot}</figcaption>` : ""}</figure>`;

  // OS CANDIDATOS: cada um com o render grande, os 56 px no magenta ao lado, e os
  // TRÊS números que decidem no rótulo. É a única exceção à regra de "número vai
  // para o terminal", e ela é deliberada: a pergunta desta seção é comparativa, e
  // obrigar o olho a ir e voltar ao terminal para cada painel é o que a folha
  // existe para evitar. Os mesmos três saem na tabela do terminal, copiáveis.
  const secaoCandidatos = candidatos.length
    ? `<h2>2 · os candidatos de N — quanto cada ponto a mais compra</h2>` +
      `<div class="fila">` +
      (
        await Promise.all(
          candidatos.map(async (k) => {
            const grande = await recortar(k.png, `k${k.n}`);
            return (
              `<figure><img src="${grande}">` +
              `<div style="background:#FF00AA;padding:6px;display:flex;justify-content:center">` +
              `<img src="${cand56[k.n]}" width="${larg56 * ZOOM}" height="${P56 * ZOOM}" ` +
              `style="image-rendering:pixelated">` +
              `</div>` +
              `<figcaption><b>N = ${k.n}</b> · IoU ${pct(k.iou)} · desvio ${u(k.conv.desvios.massa)} · ` +
              `${k.bytes} bytes</figcaption></figure>`
            );
          }),
        )
      ).join("") +
      `</div>` +
      `<p class="leg">O teto de <code>escolherN</code> continua em 64 — estes são experimento. ` +
      `A varredura da peça mostrou o desvio <b>ainda caindo</b> no último N da escala, ` +
      `e é isso que esta linha existe para pôr em número.</p>`
    : "";

  const html =
    `<style>` +
    `body{margin:0;background:#F7F5F2;font:13px/1.45 system-ui,-apple-system,sans-serif;color:#222}` +
    `h1{font-size:15px;margin:14px ${PAD_FOLHA}px 2px}` +
    `h2{font-size:11px;margin:16px ${PAD_FOLHA}px 6px;color:#666;font-weight:600;` +
    `text-transform:uppercase;letter-spacing:.06em}` +
    `.fila{display:flex;gap:${GAP}px;padding:0 ${PAD_FOLHA}px;align-items:flex-start}` +
    `figure{margin:0;background:#fff;border:1px solid #E3DFD9;border-radius:8px;` +
    `flex:1;min-width:0;overflow:hidden;box-sizing:border-box}` +
    `figure img{width:100%;display:block}` +
    `figcaption{font-size:10px;color:#666;padding:4px 6px;border-top:1px solid #EEE}` +
    `.p56{display:flex;gap:6px;flex-direction:column;align-items:center}` +
    `.p56 .cx{display:flex;align-items:center;justify-content:center;border-radius:4px;padding:4px}` +
    `.p56 img{image-rendering:pixelated;display:block}` +
    `.leg{font-size:10px;color:#777;padding:0 ${PAD_FOLHA}px;margin:4px 0 0}` +
    `ul{margin:4px ${PAD_FOLHA}px 14px;padding-left:18px;color:#555;font-size:11px}` +
    `b{color:#222}` +
    `</style>` +
    `<h1>Revisão de <b>${nome}</b> — arte × render, a mesma régua nos dois lados</h1>` +
    `<h2>1 · a trinca — o modelo, o resultado, a diferença</h2>` +
    `<div class="fila">${trinca.map(fig).join("")}</div>` +
    `<p class="leg">No mapa: <b style="color:#FF00AA">magenta</b> = só na arte · ` +
    `<b style="color:#2E7BE0">azul</b> = só no render · cinza = nos dois. ` +
    `O render é pintado no ciano instrumental e composto a <b>escala 1</b> de propósito: ` +
    `a arte foi desenhada sobre uma base a escala 1, e comparar contra 92% mediria o ` +
    `encolhimento em vez da peça.</p>` +
    secaoCandidatos +
    `<h2>3 · o tamanho que manda — 56 px, na cor do produto</h2>` +
    `<div class="fila">` +
    FUNDOS.map(
      ([rot, css]) =>
        `<figure><div style="padding:8px;display:flex;gap:10px;justify-content:center;` +
        `background:${css}">` +
        tira
          .map(
            ([, dado]) =>
              `<img src="${dado}" width="${larg56 * ZOOM}" height="${P56 * ZOOM}" ` +
              `style="image-rendering:pixelated">`,
          )
          .join("") +
        `</div><figcaption>${rot} — ${tira.map(([r]) => r).join(" · ")}</figcaption></figure>`,
    ).join("") +
    `</div>` +
    `<h2>4 · o preto — o traço da arte, o do render, e a diferença</h2>` +
    `<div class="fila">${trincaPreto.map(fig).join("")}</div>` +
    `<h2>5 · a escada de escala — a peça cabe no quadro do produto?</h2>` +
    `<div class="fila">${escada.map(fig).join("")}</div>` +
    // OS CONTROLES DESCEM PARA O FIM, e a razão é de uso e não de importância.
    //
    // Eles provam que a régua reprova quando tem de reprovar, e sem isso todo
    // número acima é suspeito. Mas depois de provados eles não mudam de rodada
    // para rodada, e ocupavam metade da área de decisão de uma folha que existe
    // para responder "qual destes preserva melhor o cabelo". Continuam aqui,
    // inteiros, embaixo do que se decide.
    `<h2>6 · os controles — a prova de que esta folha não é vácua</h2>` +
    `<div class="fila">${controles.map(fig).join("")}</div>` +
    `<p class="leg">O controle 2 é a careca: a régua tem de dar IoU ≈ 0 contra ela. ` +
    `O controle 3 é outra peça no lugar desta: tem de dar muito menos que a certa. ` +
    `Os seis números estão no terminal, e o 6 recusa desenhar esta folha se o literal ` +
    `de <code>pecas-da-arte.ts</code> não for o que o conversor produz hoje.</p>` +
    `<h2>7 · o que esta folha NÃO mede</h2>` +
    `<ul>` +
    `<li><b>Tom.</b> A máscara junta massa, sombra e luz numa silhueta só. A arte tem 3 tons + traço; ` +
    `o produto tem 2 + traço. O papel <code>luz</code> não tem correspondente.</li>` +
    `<li><b>Cor.</b> Nada aqui julga se o ciano vira um castanho bonito.</li>` +
    `<li><b>A leitura.</b> Nenhum pixel diz se a 56 px lê como o cabelo que devia ser. ` +
    `Isso é a seção 4 e é o olho.</li>` +
    `<li><b>Defeito da própria arte.</b> Uma ponta desenhada sobre o olho volta como ` +
    `<code>amputada</code>, não como conserto.</li>` +
    `<li><b>Deslocamento diagonal puro.</b> O desvio lateral é medido por linha e o de topo por ` +
    `coluna; uma borda que só se moveu na direção dela mesma some nas duas.</li>` +
    `<li><b>As regiões internas de luz e sombra.</b> A silhueta é medida; as manchas claras ` +
    `dentro dela não. A <code>clara</code> passa pela mesma decimação da massa e pode ter mudado ` +
    `de forma e de posição sem nenhum número acusar. <b>Revisar depois que a silhueta for ` +
    `aprovada</b> — a 56 px boa parte disso some, e o cabelo é recolorível, então fidelidade ` +
    `cromática absoluta não é o alvo.</li>` +
    `</ul>`;

  const arqHtml = `${destino}/folha.html`;
  writeFileSync(arqHtml, html, "utf-8");
  const arqPng = `${destino}/folha.png`;
  await renderizarHtml(nav, html, LARGURA_FOLHA, arqPng);
  await nav.close();

  console.log(`\n  A FOLHA — ${arqPng}`);
  console.log(`  HTML em ${arqHtml}\n`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
