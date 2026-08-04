/**
 * DE PNG PARA `{t, y}` — a régua que substitui a vetorização.
 *
 * Escrita no Bloco 2a.5. O Doug reprovou os cinco cabelos do 2a.1 e a raiz está no
 * próprio `cabelo.ts`, linha 28: *"estes números são desenhados, não medidos"*.
 * Este arquivo é a régua que faltava.
 *
 * ---------------------------------------------------------------------------
 * DUAS RÉGUAS MORAM AQUI, E A SEGUNDA EXISTE PORQUE A PRIMEIRA FOI MEDIDA ERRANDO
 * ---------------------------------------------------------------------------
 *
 * **A paramétrica** (`medirFranja`, `montarPeca`) lê a arte como três coisas
 * separadas: uma franja que é função de `x`, uma curva de sombra e os lóbulos que
 * passam do crânio. Ela produziu o melhor traço paramétrico possível, e a folha de
 * fidelidade HSHC93 mediu o resultado contra a arte `curto-espetada`: **IoU 61,7%**,
 * desvio médio de borda **36,1 unidades** (≈ 3 px a 56). Quatro coisas da arte não
 * cabiam, e a maior delas — a **cortina**, a massa que desce ao lado do rosto até a
 * bochecha, DENTRO da silhueta — sozinha segurava ~220 unidades. O número não
 * respondia a critério nem a N porque não era decimação: era o modelo de dados.
 *
 * **A traçada** (`tracar`) lê a mesma arte como **um laço fechado só**. Ela é o
 * pipeline da base, aplicado ao cabelo: máscara → borda ordenada → linha de centro
 * do preto → suavizar → decimar por erro de corda → literal impresso para colar. Os
 * 42 pontos do contorno do crânio saíram assim, e a diferença entre os dois casos
 * nunca foi de método — era de `Cabelo` não ter onde guardar um laço.
 *
 * A paramétrica fica enquanto houver modelo paramétrico no catálogo: o
 * `--ida-e-volta` dela é a regressão que prova que nada quebrou pelo caminho, e
 * `fidelidade.ts` compara as duas contra a mesma arte.
 *
 * ---------------------------------------------------------------------------
 * POR QUE MEDIR E NÃO VETORIZAR
 * ---------------------------------------------------------------------------
 *
 * `Cabelo` tem quatro campos e nenhum é um path — `d: string` foi removido de
 * propósito, porque path emitido não se mede. Um traço da Adobe devolveria
 * `d="M…C…"`, que não compila. Então o PNG não vira asset: ele vira **tabela**.
 *
 * ---------------------------------------------------------------------------
 * O ÂNCORA É O TRONCO, E ISSO É A DECISÃO QUE MANDA NO ARQUIVO
 * ---------------------------------------------------------------------------
 *
 * `enquadramento()` (medir.ts) devolve `utilY0` e `fator` a partir da primeira
 * linha com contorno escuro — o topo da figura. **Isso é exatamente o que não
 * serve aqui.** Um cabelo com volume sobe acima da coroa: o topo da figura passa a
 * ser o topo do cabelo, `alturaUtilPx` cresce, e `fator` encolhe. A régua ficaria
 * errada justamente nas peças que têm volume, que são as que este bloco existe
 * para produzir — e erraria *para menos*, o que faria todo cabelo volumoso ser
 * medido como se fosse mais discreto do que é. Silenciosamente.
 *
 * Os dois marcos usados aqui são cegos ao cabelo:
 *
 *  - **`yCorte`**, a linha mais estreita entre 40% e 78% da altura — o pescoço;
 *  - **`utilY1`**, a última linha com contorno — a base do tronco.
 *
 * Nenhum cabelo do elenco alcança nenhum dos dois. A escala sai da distância entre
 * eles, medida no PNG e conhecida no `viewBox`, e o eixo horizontal sai de
 * `eixoTroncoPx`, que é do tronco e não da cabeça (a cabeça tem o `GIRO`).
 *
 * ---------------------------------------------------------------------------
 * O MATIZ É O QUE SEPARA CABELO DE CONTORNO
 * ---------------------------------------------------------------------------
 *
 * Segmentar por luminância não funciona: o contorno tem 12 unidades de espessura e
 * é preto, e cabelo escuro mora no mesmo limiar. Por isso o pedido ao gerador
 * (`scripts/avatar/estilo/gerar.ts`) exige o cabelo em **verde-azulado ~177°**, e a
 * pele mora em 17–29°. A separação vira um teste de matiz exato. É a regra 10 da
 * §7b usada ao contrário: como instrumento, não como estética.
 *
 * E são **dois tons** do mesmo matiz, não um. A fronteira entre o claro e o escuro
 * é a curva que vai para `Cabelo.sombra` — o campo que o Bloco 2a.5 acrescentou
 * para a sombra deixar de ser uma faixa paralela de 22 unidades.
 *
 * ---------------------------------------------------------------------------
 * COMO RODAR
 * ---------------------------------------------------------------------------
 *
 *   npm run avatar:tracar -- <arquivo.png>          # traçar (o laço fechado)
 *   npm run avatar:tracar -- --ida-e-volta-massa    # a régua traçada se prova
 *   npm run avatar:tracar -- --ida-e-volta          # a régua paramétrica se prova
 *   npm run avatar:tracar -- --parametrico <png>    # medir pela régua antiga
 *   npm run avatar:tracar -- --diag <png>           # matiz e âncoras, sem interpretar
 *
 * As duas idas e voltas provam as réguas **sem depender de gerador nenhum**:
 * renderizam o `curto` de hoje com o cabelo em teal, medem de volta, e comparam com
 * o que já está em `cabelo.ts`. Se a régua não recupera um cabelo que ela mesma
 * acabou de ver, ela não tem como medir um que nunca viu.
 */

import { existsSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import {
  CABELOS,
  FOLGA_ROSTO,
  ancoragemDasExtensoes,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  type Cabelo,
  type PontoFranja,
} from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  CABECA,
  CAIXA_CABECA,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SANGRIA,
  TRACO,
  VIEWBOX,
  bordasEm,
} from "../../../src/lib/avatar/estilo/geometria";
import { PELE } from "../../../src/lib/avatar/palette";
import {
  ESCURO,
  type Bitmap,
  corridas,
  decimarPorCorda,
  desvioDaCorda,
  enquadramento,
  lum,
} from "./medir";

/**
 * QUEM RASTERIZA É O CHROMIUM, E ISSO CUSTOU UMA RODADA.
 *
 * A primeira versão usava `rasterizarSvg` de `raster.ts` (sharp/librsvg) e devolveu
 * **zero pixel de cabelo**. O diagnóstico: `utilY1 = 972` num raster de 2048, ou
 * seja a régua enxergava só a cabeça, e o histograma de matiz não tinha nada na
 * janela do teal.
 *
 * A causa é que **o sharp não resolve custom property de CSS**. Este SVG pinta tudo
 * por `var(--av-pele)`, `var(--av-cabelo)`, `var(--av-cabelo-s)`; sem resolvê-las
 * sobra só o traço preto, e o traço preto é o que `silhueta()` mede. É a mesma
 * razão de `variantes.ts` e `folha-base.ts` tirarem screenshot do chromium em vez
 * de rasterizar com sharp — só que lá o motivo nunca precisou ser escrito, porque
 * eles nunca tentaram o outro caminho.
 *
 * `raster.ts` continua certo para o que ele faz: PNG de referência e line-art com
 * `fill=` literal. Composto do `compor()` não passa por lá.
 */
export async function rasterizar(svg: string, altura: number): Promise<Bitmap> {
  const larg = Math.round((altura * VIEWBOX.w) / VIEWBOX.h);
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.setViewportSize({ width: larg, height: altura });
  await pg.setContent(
    `<body style="margin:0;background:#FFF">` +
      svg.replace("<svg ", `<svg width="${larg}" height="${altura}" `) +
      `</body>`
  );
  const png = await pg.screenshot({ clip: { x: 0, y: 0, width: larg, height: altura } });
  await nav.close();
  return cru(png);
}

/** PNG (do disco ou do chromium) virando pixel cru, achatado sobre branco. */
export async function cru(entrada: Buffer | string): Promise<Bitmap> {
  const { data, info } = await sharp(entrada)
    // `flatten` ANTES de `removeAlpha`, e a ordem é a mesma que `raster.ts`
    // documenta: `removeAlpha` sozinho descarta o canal e deixa o RGB de baixo,
    // que num PNG transparente é PRETO — a imagem inteira viraria contorno.
    .flatten({ background: "#FFFFFF" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, canais: info.channels };
}

/** A altura de raster da régua. 2 px por unidade do `viewBox`. */
export const ALTURA = VIEWBOX.h * 2;

/** O teal que o pedido ao gerador exige, e o que a régua procura. */
export const CABELO_TEAL = "#19C7C0";
const MATIZ = [150, 205] as const;

/**
 * A JANELA DO TEAL, EXPORTADA — uma descrição só, para a fonte SVG usar a MESMA.
 *
 * `fonte-svg.ts` classifica por `fill=` e este arquivo classifica por pixel, e as
 * duas têm de concordar sobre o que é cabelo. Reescrever a janela lá faria a
 * conferência de fonte medir a diferença entre duas definições de teal em vez da
 * diferença entre duas fontes — que é exatamente o defeito que a invariante
 * *uma régua, duas imagens* existe para impedir.
 *
 * A saturação corta o cinza pelo mesmo motivo de `tomDoCabelo`: matiz de pixel
 * quase neutro é instável, e um `fill` quase neutro do conversor também.
 */
export const eMatizDeCabelo = (h: number, s: number) => h >= MATIZ[0] && h <= MATIZ[1] && s > 0.25;

/**
 * O PISO DE CROMA BRUTA — e sem ele a régua lia PRETO como teal.
 *
 * A saturação de `hsl()` é normalizada por `255 − |mx + mn − 255|`, e esse
 * denominador **colapsa** perto do preto: o pixel `(0, 2, 1)` tem `d = 2` e devolve
 * `s = 2 / 2 = 1,00`, saturação máxima. O matiz dele sai em exatos 150°, que é a
 * borda da janela do teal. Um pixel preto entrava na máscara de cabelo com nota
 * cheia, e a guarda `s > 0,25` não tinha como pegá-lo — ela é relativa, e o defeito
 * é absoluto.
 *
 * **Quem achou foi a conferência de fonte.** As colunas em que o PNG e o SVG mais
 * discordavam — x 220, 383, 426 — eram todas assim: o PNG via cabelo 150 unidades
 * abaixo do SVG, e o pixel de lá é `(0, 2, 1)`. Nenhuma amarra de forma pegaria
 * isso: a massa extra é conexa com a peça e sai como uma mecha plausível.
 *
 * O piso é em croma BRUTA (`max − min`), que é a grandeza que não colapsa.
 * Histograma dos 93 615 pixels que passavam na janela, nesta arte:
 *
 *   d = 2 → 1 586 pixels (1,69%)   ← um pico isolado, e é o defeito
 *   d = 3 →   179
 *   d = 4 →   703, e daí uma cauda lisa: a rampa de antialiasing teal↔preto
 *
 * O corte fica no vão entre o pico e a cauda. O teal escuro de verdade da arte
 * (`#040D0C`) tem `d = 9` e `#051A18` tem `d = 21`: os dois passam com folga.
 *
 * Varredura por `process.env`, nunca reescrevendo o arquivo — a mesma regra de
 * `PONTOS_FINAIS`.
 */
const CROMA_MINIMA = () => Number(process.env.CROMA ?? 4);

/**
 * QUANTOS PONTOS CADA CURVA TEM — e agora o número sai de medição, não de analogia.
 *
 * O valor antigo era 10, escolhido porque *"dez pontos são o dobro do que os cinco
 * modelos usam"*. Analogia não é medida, e o Bloco III do plano de 2026-08-03 trocou
 * o critério: varrer N e ficar com o primeiro em que o desvio contra a varredura
 * densa cai abaixo de **meio traço (6 unidades)** — o mesmo limiar que separa "borda
 * do preenchimento" de "linha de centro" no resto da régua.
 *
 * **Medido em `curto-espetada`, esse N é 20**, e as duas curvas chegam lá por
 * caminhos diferentes:
 *
 *  - a **franja** cruza o limiar entre 12 e 14 pontos (11,0 → 5,2 u) e segue caindo;
 *  - o **lóbulo** cai de 32,6 a 5,6 e ali **empaca**: 5,63 em N=20, em 32 e em 48.
 *
 * O platô do lóbulo foi investigado antes de aceitar o número, porque desvio que não
 * responde a mais pontos costuma ser bug. Não é: a ponta esquerda do lóbulo é uma
 * **parede quase vertical** — a varredura densa cai de `y` 187,6 para 123,9 em 1,6
 * unidade de `x` —, e erro de corda não tem como aproximar melhor uma vertical
 * gastando pontos em outro lugar. 5,63 u é 0,45 px no tamanho do ranking; é o piso da
 * arte, não um teto do critério. **N = 20 é o joelho onde o lóbulo encosta no piso**,
 * e não um ponto arbitrário da curva.
 *
 * Bytes: 9 478 no composto, contra o teto de 10 240 — folga de 762, sem conflito.
 *
 * A varredura vai por `process.env`, e nunca reescrevendo este arquivo: o
 * `.scratch/estilo/densidade.ts` fez isso e ficou sintaticamente quebrado no
 * repositório, e a skill `avatar-regua` o cita nominalmente como a forma errada.
 *
 *   PONTOS=24 npx tsx .scratch/estilo/franja.ts <png>
 *   npx tsx .scratch/estilo/varrer-n.ts <png>          # a varredura inteira
 *
 * **É função e não constante de propósito.** A varredura mexe em `process.env` entre
 * uma medição e a próxima, no mesmo processo: uma constante seria congelada na
 * importação do módulo e a varredura inteira mediria o mesmo N sem reclamar. Ler no
 * uso custa uma chamada e torna o engano impossível.
 */
const PONTOS_FINAIS = () => Number(process.env.PONTOS ?? 20);

/* ------------------------------------------------------------------ */
/* Matiz                                                               */
/* ------------------------------------------------------------------ */

export function hsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  const l = (mx + mn) / 2 / 255;
  if (d === 0) return { h: -1, s: 0, l };
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: d / (255 - Math.abs(mx + mn - 255)), l };
}

/**
 * O limiar de luminância que separa os dois tons do cabelo.
 *
 * Ele é o do MEIO dos três que `medirClara` varre. Ter o valor aqui e a varredura
 * lá é de propósito: a estabilidade só quer dizer alguma coisa se o limiar de
 * produção for um dos medidos, e não um quarto valor ao lado deles.
 */
const LIMIAR_CLARO = 0.42;

/** Matiz e luminância de um pixel, sem decidir nada — quem decide é quem chama. */
function tomDoCabelo(b: Bitmap, x: number, y: number): { eCabelo: boolean; l: number } {
  const i = (y * b.w + x) * b.canais;
  const r = b.data[i];
  const g = b.data[i + 1];
  const bl = b.data[i + 2];
  const { h, s, l } = hsl(r, g, bl);
  // Duas guardas, e cada uma pega um extremo. A saturação corta o cinza do meio da
  // escala; a croma bruta corta o quase-preto, onde a saturação normalizada colapsa
  // e devolve 1,00 para um pixel que não tem cor nenhuma. Ver `CROMA_MINIMA`.
  const croma = Math.max(r, g, bl) - Math.min(r, g, bl);
  return { eCabelo: croma >= CROMA_MINIMA() && eMatizDeCabelo(h, s), l };
}

/** `true` onde o pixel é cabelo. O terceiro valor diz se é o tom CLARO. */
export function amostrar(b: Bitmap, x: number, y: number) {
  const t = tomDoCabelo(b, x, y);
  return { eCabelo: t.eCabelo, claro: t.l > LIMIAR_CLARO };
}

/* ------------------------------------------------------------------ */
/* A bifurcação de fonte — e ela fica ANTES da geometria               */
/* ------------------------------------------------------------------ */

/**
 * DE ONDE VEM O BOOLEANO — a única coisa que muda entre medir PNG e medir SVG.
 *
 * `perfil`, `lobos`, `medirMassa`, `medirClara` e `tracar` faziam duas perguntas ao
 * pixel: *é cabelo?* e *é tinta escura?*. As duas nasciam aqui dentro — a primeira de
 * `tomDoCabelo` (matiz), a segunda de `lum() < ESCURO`. Este tipo as tira de dentro da
 * geometria e as põe na fronteira do arquivo, e é **só isso** que a fonte SVG troca:
 * nenhuma linha de geometria muda de lado nenhum.
 *
 * ---------------------------------------------------------------------------
 * `cabelo` E `escuro` PODEM SE SOBREPOR, E A DISJUNÇÃO É PROPRIEDADE DA FONTE
 * ---------------------------------------------------------------------------
 *
 * `medirMassa` perguntava `if (teal) … else if (escuro) …`, e o `else` embutia uma
 * suposição: *tinta escura e cabelo são coisas exclusivas*. No PNG isso é verdade por
 * construção da janela de matiz. No SVG **não é**: a família `traco` é o contorno DO
 * CABELO, ela é cabelo e é escura ao mesmo tempo, e o `else` a apagaria justamente do
 * lugar onde ela serve — a sondagem pela normal, que procura a corrida de preto para
 * achar a linha de centro. Sem ela, todo ponto cairia meio traço para dentro e a peça
 * inteira sairia encolhida, com o sintoma escondido em `semContorno`.
 *
 * Então a exclusividade desce para `segmentarPorMatiz`, que a garante no `escuro`
 * dele. A geometria passa a fazer duas perguntas independentes, o PNG continua
 * respondendo exatamente o que respondia, e o SVG passa a poder responder a verdade.
 */
export interface Segmentacao {
  bmp: Bitmap;
  /** Tinta de cabelo de qualquer tom: corpo ∪ sombra ∪ traço. */
  cabelo: (x: number, y: number) => boolean;
  /** O corpo — o tom CLARO, aquele de que a fronteira da sombra é a borda. */
  claro: (x: number, y: number) => boolean;
  /** Tinta escura de qualquer peça: o traço. Pode coincidir com `cabelo`. */
  escuro: (x: number, y: number) => boolean;
  /**
   * A luminância do pixel de cabelo, quando ela existe.
   *
   * Só a fonte de matiz a tem: ali a fronteira claro/escuro é um degradê que precisa
   * ser posterizado, e `medirClara` varre limiares dentro do vale entre os dois modos.
   * No SVG a fronteira é **exata** — cada path já traz o seu tom —, e varrer limiar
   * numa fronteira exata mediria o ruído do raster. Ausente quer dizer *não pergunte*.
   */
  tom?: (x: number, y: number) => number;
  /**
   * OS MARCOS DE TRONCO, EM PIXEL DESTE `bmp` — e eles nem sempre saem dele.
   *
   * `enquadramento()` acha o topo, a base e o pescoço pelo **contorno escuro**, e o
   * SVG do conversor não tem contorno: o fundo preto e o traço preto são a mesma
   * região para ele, e a pegada da figura termina na borda INTERNA do traço, não na
   * externa. Medido nesta arte, isso encolhe o vão tronco→pescoço em 3,3% e a régua
   * lê a arte inteira 3,3% maior — a conferência de fonte saiu com IoU 81,7% e borda
   * de 20,0 u por causa disso, com as áreas batendo em 0,08%.
   *
   * Então o enquadramento sai de onde o contorno EXISTE, que é o PNG, e é convertido
   * para o pixel do raster do SVG por uma razão exata (as duas imagens têm o mesmo
   * `viewBox` e alturas conhecidas). É a mesma divisão de trabalho da base: forma do
   * line-art, enquadramento de quem tem a silhueta.
   */
  ancoras: Ancoras;
  fonte: "matiz" | "path";
  /** Modas, cortes, descartes. Impresso, nunca calado. */
  laudo: string[];
}

/** A fonte de sempre: matiz no pixel. O `escuro` exclui o cabelo, como antes. */
export function segmentarPorMatiz(bmp: Bitmap, laudo: string[] = []): Segmentacao {
  return {
    bmp,
    cabelo: (x, y) => tomDoCabelo(bmp, x, y).eCabelo,
    claro: (x, y) => tomDoCabelo(bmp, x, y).l > LIMIAR_CLARO,
    // O `else if` de `medirMassa` mora aqui agora. Ver o docstring de `Segmentacao`.
    escuro: (x, y) => !tomDoCabelo(bmp, x, y).eCabelo && lum(bmp, x, y) < ESCURO,
    tom: (x, y) => tomDoCabelo(bmp, x, y).l,
    ancoras: ancoras(bmp),
    fonte: "matiz",
    laudo,
  };
}

/* ------------------------------------------------------------------ */
/* O mapa pixel → viewBox, ancorado no tronco                          */
/* ------------------------------------------------------------------ */

export interface Mapa {
  /** `viewBox = (px - px0) * k + u0` */
  kx: number;
  ky: number;
  ex0: number;
  eu0: number;
  ty0: number;
  tu0: number;
}

export interface Ancoras {
  yPescoco: number;
  yBase: number;
  eixo: number;
}

export function ancoras(b: Bitmap): Ancoras {
  const e = enquadramento(b);
  return { yPescoco: e.yCorte, yBase: e.utilY1, eixo: e.eixoTroncoPx };
}

export function mapa(daImagem: Ancoras, doViewBox: Ancoras): Mapa {
  const k = (doViewBox.yBase - doViewBox.yPescoco) / (daImagem.yBase - daImagem.yPescoco);
  return {
    kx: k,
    ky: k,
    ex0: daImagem.eixo,
    eu0: doViewBox.eixo,
    ty0: daImagem.yPescoco,
    tu0: doViewBox.yPescoco,
  };
}

export const paraX = (m: Mapa, px: number) => (px - m.ex0) * m.kx + m.eu0;
export const paraY = (m: Mapa, py: number) => (py - m.ty0) * m.ky + m.tu0;

/* ------------------------------------------------------------------ */
/* Extração                                                            */
/* ------------------------------------------------------------------ */

interface Perfil {
  /** Por coluna: o fim da PRIMEIRA corrida de cabelo — a borda de baixo da touca. */
  franja: (number | null)[];
  /** Idem, para o tom claro: a borda de baixo da camada clara. */
  sombra: (number | null)[];
  /** O `y` mais alto com massa de cabelo, no quadro todo. Para a expansão vertical. */
  topo: number | null;
  /** Quantas colunas têm mais de uma corrida — sinal de mecha lateral / extensão. */
  colunasComExtensao: number;
}

/**
 * Por coluna, o pixel de cabelo mais baixo — e o de tom claro mais baixo.
 *
 * A varredura para na altura do pescoço: abaixo dela não há cabelo em nenhum dos
 * cinco modelos, e o que houver ali é tronco. Sem esse corte, uma trança que
 * desce pelo ombro puxaria a franja para baixo do queixo.
 */
function perfil(seg: Segmentacao, yLimite: number): Perfil {
  const b = seg.bmp;
  const franja: (number | null)[] = new Array(b.w).fill(null);
  const sombra: (number | null)[] = new Array(b.w).fill(null);
  // Quantos pixels seguidos de cabelo uma coluna precisa ter para a corrida contar.
  // Ver o comentário abaixo: é o que separa massa de pixel perdido.
  const MINIMO = Math.max(3, Math.round(b.h * 0.008));
  const ate = Math.min(b.h, yLimite);
  let topo: number | null = null;
  let colunasComExtensao = 0;

  for (let x = 0; x < b.w; x++) {
    let vao = 0;
    /**
     * A ÚLTIMA CORRIDA DE VERDADE, não o último pixel.
     *
     * A primeira versão pegava o pixel de cabelo mais baixo da coluna, e um pixel
     * perdido corrompia a coluna inteira. Aconteceu: o `--diag` reportou teal indo
     * até `y` 853 num quadro de 1024 — abaixo do queixo, quase no rodapé —, e a
     * leitura das imagens mostrou que **nenhuma delas tem teal abaixo de 0,52**.
     * Eram outliers do antialiasing entre o contorno preto e o fundo achatado,
     * que caem na janela de matiz com saturação suficiente.
     *
     * Exigir uma corrida de `MINIMO` pixels seguidos transforma "havia um pixel
     * daquela cor" em "havia massa daquela cor", que é a grandeza que interessa.
     * É a mesma correção que o Bloco 1d aplicou ao especular: limiar + caixa dava
     * 241×54 por causa de pontinhos espalhados; desfoque + componente conexa deu
     * 39,8×28,6, estável em três limiares.
     */
    /**
     * A PRIMEIRA corrida, não a última — e esta é a correção que mais mudou número.
     *
     * Uma coluna que atravessa a cabeça pode encontrar cabelo, depois PELE (a
     * testa), depois cabelo de novo (a mecha lateral que desce ao lado do rosto).
     * Tomar a última corrida devolvia o fundo da mecha lateral no lugar da franja:
     * numa das artes medidas os `y` saíram alternando 80 e 341, que é a franja e a
     * cortina lidas como a mesma curva.
     *
     * A franja é a borda de baixo da **touca** — a massa contígua que vem da coroa.
     * O que aparece depois, separado por pele, é `Extensao`, e é assim que o modelo
     * de dados já separa as duas coisas: `pontos` é clipado pelo crânio, `extensoes`
     * não. A régua tinha de separar igual.
     */
    let fimFranja: number | null = null;
    let fimSombra: number | null = null;
    let corrida = 0;
    let corridaClara = 0;
    let corridas = 0;
    let fechou = false;

    for (let y = 0; y < ate; y++) {
      const a = { eCabelo: seg.cabelo(x, y), claro: seg.claro(x, y) };
      if (a.eCabelo) {
        corrida++;
        if (corrida === MINIMO) {
          corridas++;
          if (topo === null || y - MINIMO < topo) topo = y - MINIMO + 1;
        }
        if (corrida >= MINIMO && !fechou) {
          fimFranja = y;
          if (a.claro) {
            corridaClara++;
            if (corridaClara >= MINIMO) fimSombra = y;
          } else corridaClara = 0;
        }
      } else {
        // Só encerra a touca depois de uma interrupção REAL: um vão de menos de
        // `MINIMO` pixels é o antialiasing entre duas mechas, não o fim do cabelo.
        if (corrida >= MINIMO) vao = 0;
        vao++;
        if (corrida >= MINIMO && fimFranja !== null && vao >= MINIMO) fechou = true;
        corrida = 0;
        corridaClara = 0;
      }
    }
    if (corridas > 1) colunasComExtensao++;
    franja[x] = fimFranja;
    sombra[x] = fimSombra;
  }
  return { franja, sombra, topo, colunasComExtensao };
}

/**
 * Média móvel sobre a poligonal, ANTES de decimar — a lição 3 do Bloco 1d.
 *
 * Toda quebra do contorno da cabeça estava na emenda entre as duas varreduras, com
 * degrau de 1,3 a 1,9 unidade onde o passo típico é 0,2. Aqui o ruído é outro (o
 * antialiasing do gerador e a granulação do PNG), mas a correção é a mesma: suavizar
 * sobre o arco antes de escolher os pontos, nunca depois.
 */
function suavizar(v: (number | null)[], janela: number): (number | null)[] {
  const out = v.slice();
  for (let i = 0; i < v.length; i++) {
    if (v[i] === null) continue;
    let soma = 0;
    let n = 0;
    for (let j = Math.max(0, i - janela); j <= Math.min(v.length - 1, i + janela); j++) {
      if (v[j] !== null) {
        soma += v[j]!;
        n++;
      }
    }
    out[i] = soma / n;
  }
  return out;
}

/**
 * QUAL CRITÉRIO REDUZ AS CURVAS — e ele é escolhível porque foi MEDIDO, não decidido.
 *
 * `corda` é o padrão e é o mesmo `decimarPorCorda()` que reduziu o contorno do
 * crânio a 42 pontos. `extremos` é o critério que esta régua inventou no Bloco 2a.5,
 * mantido reachable só para a tabela do docstring de `reduzir()` poder ser
 * reproduzida — trocar um palpite por outro sem a linha de comparação ao lado seria
 * repetir o defeito que este bloco existe para corrigir.
 *
 *   CRITERIO=extremos npx tsx .scratch/estilo/franja.ts <png>
 */
const CRITERIO = () => (process.env.CRITERIO ?? "corda") as "corda" | "extremos";

/**
 * A REDUÇÃO DE UMA CURVA ABERTA — franja, sombra, lado externo de lóbulo.
 *
 * ---------------------------------------------------------------------------
 * ERRO DE CORDA VENCEU `extremos()`, E A TABELA ESTÁ NO DOCSTRING DE `medirFranja`
 * ---------------------------------------------------------------------------
 *
 * O contra-argumento a favor do `extremos()` era honesto e era MEDIDO: trocar
 * amostragem uniforme por extremos subiu a distinção entre a Espetada e a Tigela de
 * 4,51% para 5,04%. A tese que o substituiu é que, a 20+ pontos, o erro de corda
 * **subsome** os extremos — tirar um extremo tem custo de corda alto, então ele
 * sobrevive sozinho —, e que o `extremos()` só era necessário porque 8 a 12 pontos
 * são poucos demais para a forma existir.
 *
 * **A tese se mediu, e ela passou.** `curto-espetada.png`, as três configurações
 * pelo `fidelidade.ts` (IoU e desvio de borda contra a arte) e pelo próprio desvio
 * contra a varredura densa:
 *
 * | critério | N franja/lóbulo | desvio da corda (franja · sombra · lóbulo) | IoU | desvio de borda méd | bytes |
 * |---|---|---|---|---|---|
 * | extremos (o de ontem) | 10 / 8 | 33,0 · 13,8 · 39,6 | 49,4% | 42,2 u | 8 330 |
 * | erro de corda, mesmo N | 10 / 8 | 15,9 · 10,7 · 32,6 | **61,1%** | 37,6 u | 8 364 |
 * | erro de corda, N escolhido | 20 / 20 | **3,6 · 4,3 · 5,6** | **61,7%** | **36,1 u** | 9 478 |
 *
 * Duas leituras, e as duas importam:
 *
 *  - **no mesmo N o erro de corda ganha por 12 pontos de IoU** (49,4 → 61,1%), com
 *    34 bytes de diferença. Não é empate dentro do ruído: as colunas em que a arte
 *    tem massa e o render não caem de 76 para 25;
 *  - **subir N de 10 para 20 quase não mexe no IoU** (61,1 → 61,7%) e mexe muito no
 *    desvio da curva (15,9 → 3,6). Os dois números não discordam: IoU mede área, e
 *    área é insensível a um recorte de 15 unidades numa borda de 500. O que o Doug
 *    reprovou não foi área, foi recorte — e é por isso que o N sai do desvio.
 *
 * **O desvio de borda contra a arte fica em ~220 u nas TRÊS**, e essa é a descoberta
 * incômoda do bloco: ele não responde a critério nem a N porque não é decimação. É a
 * cortina lateral da arte, que desce ao lado do rosto até perto do queixo. Ela não
 * vira `Extensao` (está DENTRO da silhueta do crânio, e `lobos()` só recolhe o que
 * passa dela) e não vira franja (o `perfil()` toma a PRIMEIRA corrida por coluna, que
 * é a touca). O modelo de dados não tem onde guardá-la. Ver `imprimir()`.
 *
 * Duas coisas somem junto com ele, e as duas eram sintoma do mesmo aperto:
 *
 *  - **a rotação de 90° do lóbulo de têmpora.** `extremos()` olhava variação em `y`,
 *    que é o eixo certo num lóbulo de coroa e o errado num de têmpora — daí o
 *    `girar`. Erro de corda é isotrópico: ele mede distância ponto-a-corda em 2D e
 *    não tem eixo preferido, então o lóbulo entra como foi medido;
 *  - **a decimação uniforme da sombra.** Ela era uniforme porque não devia oscilar
 *    contra a franja. Com o mesmo critério nas duas, elas se reduzem em fase.
 */
function reduzir(pts: { x: number; y: number }[], quantos: number) {
  if (pts.length <= quantos) return pts;
  return CRITERIO() === "extremos"
    ? extremos(pts, quantos)
    : decimarPorCorda(pts, quantos, { fechado: false });
}

/** Quanto um pico ou vão precisa ter para contar como recorte, em unidades. */
const PROMINENCIA = 8;

/**
 * MEIO TRAÇO — o limiar de desvio, e ele já é o limiar de tudo mais nesta régua.
 *
 * `TRACO` é 12, então meio traço é 6 unidades: 0,48 px no tamanho do ranking. É a
 * mesma grandeza que `medirFranja` desconta para converter "borda do preenchimento"
 * em "linha de centro", e é a distância abaixo da qual duas curvas caem dentro da
 * mesma tinta preta. Desvio menor que isso não tem onde aparecer.
 */
const MEIO_TRACO = TRACO / 2;

/**
 * OS PONTOS CAEM NOS PICOS E NOS VÃOS, não em intervalos iguais.
 *
 * A primeira versão decimava uniformemente e a crítica da folha pegou o resultado:
 * *"a 56 px o recorte morre completamente — a borda inferior vira uma linha
 * praticamente reta, exatamente o defeito pelo qual o desenho anterior foi
 * reprovado"*. A causa é geométrica: um ponto a cada N colunas cai na ENCOSTA do
 * recorte tanto quanto no extremo dele, e a spline então liga duas encostas por uma
 * curva lisa — o vão desaparece na interpolação, não na rasterização.
 *
 * **Isto contraria a lição 2 do Bloco 1d, e contraria com motivo.** Lá, reamostrar
 * o contorno da cabeça por densidade de curvatura foi PIOR (raio mínimo 13,8 contra
 * 32,6 do uniforme). Mas aquele alvo é uma convexa lisa, em que curvatura alta é
 * ruído de amostragem, e gastar ponto nela é gastar ponto em nada. Numa franja os
 * extremos **são** a forma: o que distingue mecha de reta é onde ela sobe e onde
 * ela desce. A lição continua valendo para o contorno; ela não vale aqui, e a
 * diferença é o que a curva está descrevendo.
 *
 * O filtro é de zigue-zague com prominência: uma virada só conta se o `y` andou
 * `PROMINENCIA` unidades desde a última virada aceita. Isso descarta o serrilhado
 * do antialiasing sem tocar no recorte de verdade.
 */
function extremos(pts: { x: number; y: number }[], quantos: number) {
  if (pts.length <= 2) return pts;

  const marcos: number[] = [0];
  let dir = 0;
  let ancora = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].y - pts[ancora].y;
    if (Math.abs(d) < PROMINENCIA) continue;
    const novo = Math.sign(d);
    if (dir !== 0 && novo !== dir) marcos.push(ancora);
    dir = novo;
    ancora = i;
  }
  marcos.push(pts.length - 1);

  // Poucos extremos: completa com pontos uniformes nos maiores vãos, senão a
  // spline atravessa trechos longos sem controle e a curva descola da medição.
  const idx = [...new Set(marcos)].sort((a, b) => a - b);
  while (idx.length < quantos) {
    let maior = 0;
    let onde = 0;
    for (let i = 0; i < idx.length - 1; i++) {
      const vao = idx[i + 1] - idx[i];
      if (vao > maior) {
        maior = vao;
        onde = i;
      }
    }
    if (maior < 2) break;
    idx.splice(onde + 1, 0, Math.round((idx[onde] + idx[onde + 1]) / 2));
  }

  // Muitos extremos: fica com os de maior amplitude local, sempre com as pontas.
  if (idx.length > quantos) {
    const forca = (k: number) => {
      const i = idx[k];
      const a = pts[idx[Math.max(0, k - 1)]].y;
      const b = pts[idx[Math.min(idx.length - 1, k + 1)]].y;
      return Math.min(Math.abs(pts[i].y - a), Math.abs(pts[i].y - b));
    };
    const ranque = idx
      .map((_, k) => k)
      .slice(1, -1)
      .sort((a, b) => forca(b) - forca(a))
      .slice(0, quantos - 2);
    return [0, ...ranque.sort((a, b) => a - b), idx.length - 1].map((k) => pts[idx[k]]);
  }
  return idx.map((i) => pts[i]);
}

/* ------------------------------------------------------------------ */
/* A massa FORA do crânio — as extensões                               */
/* ------------------------------------------------------------------ */

/**
 * POR QUE ISTO EXISTE, e por que sem isto nada do resto adianta.
 *
 * A rodada de 2026-08-03 mediu três artes com expansão de 7,6 · 11,3 · 13,3% da
 * largura da cabeça, entregou as três como `pontos`, e o `avatar:variantes` reprovou
 * as três por distinção: 2,41 a 2,99% contra piso de 5%. O Doug olhou e disse a
 * mesma coisa que o número: *"as 3 parecem capacete, sem volume fora do crânio"*.
 *
 * A causa é o modelo de dados, e ela está escrita no compositor: `pontos` é emitido
 * dentro de `<g clip-path="#c-cabeca">` (compositor.ts:437) e `extensoes` fora
 * (:432 e :451). **Toda a expansão medida vive fora do crânio, então entregá-la como
 * `pontos` é entregá-la para o clip jogar fora.** Três franjas diferentes dentro da
 * mesma silhueta produzem a mesma mancha a 56 px, que é onde o gate mede.
 *
 * Volume só existe por extensão. É a quinta causa do 2a.4, e é a razão de o `curto`
 * de hoje — 8 pontos, zero extensões — ter silhueta idêntica à do boneco careca.
 */

/** Área mínima de um lóbulo, em fração do quadro. Abaixo disso é respingo. */
const AREA_MINIMA = 0.0006;

/** Quanto o laço entra no crânio, em unidades. `SANGRIA` é 10; folga de 2,5×. */
const ANCORA = 25;

/**
 * O TETO DO CANVAS — a altura mínima que um ponto de extensão pode ter.
 *
 * **Existe porque a arte não sabe onde o `viewBox` termina, e ele termina perto.**
 * Medido: a figura base ocupa de `y = 39` a `y = 655` num canvas de 700, ou seja
 * sobram **39 unidades acima da cabeça** — 3,1 px no tamanho do ranking. Tudo que
 * um lóbulo desenhe acima de `y = 0` é cortado pelo viewport, sem erro e sem aviso.
 *
 * A folha de selo 93ETYY mediu o estrago: a primeira linha com tinta das três
 * variantes é `y = 0` com **314, 324 e 341 pixels de largura** — uma barra reta
 * atravessando 63 a 68% do quadro, que lê como *laje* e como *topo de boné*. Os
 * três tufos da Espetada tinham vales em −10,6 e −37,1, **os dois acima do corte**:
 * eles não foram encurtados, foram fundidos numa barra só.
 *
 * **E o defeito não é destas três.** O `moicano` do catálogo sai com 147 px de
 * largura CONSTANTE nas seis primeiras linhas — a crista dele (`y` −34, −76, −60)
 * é guilhotinada desde o 2a.1, e o `coque` perde 34 unidades do mesmo jeito. É
 * achado que atravessa o bloco.
 *
 * 8 unidades, e não 0, porque o traço tem 12: um ponto em `y = 8` tem a borda de
 * cima da tinta em `y = 2`, e o contorno inteiro aparece. Em `y = 0` metade do
 * traço morre e a peça volta a ler sem borda no topo.
 */
const TETO_Y = 8;

/**
 * NO MÁXIMO TRÊS LÓBULOS, e o teto é de ORÇAMENTO — não de gosto.
 *
 * `formas = 19 (base) + 2 (touca) + N`, contra o teto de 26 medido em
 * `avatar:folha-base`: cabem 5. Mas os bytes apertam antes: as variantes estão em
 * ~7 920 contra teto de 10 240, e uma extensão de 12 pontos custa ~430 B (a
 * `pontosElipse` documenta 8 pontos ≈ 290). Três cabem com folga; cinco estouram.
 *
 * **Quando a régua acha mais, ficam os de maior área e o descarte é IMPRESSO.**
 * Corte silencioso lê como cobertura completa — é a regra §7.0 do runbook, a mesma
 * pela qual `variantes.ts` avisa em voz alta que não mede extensão de traje.
 */
const MAX_LOBOS = 3;

/**
 * QUANTOS PONTOS EM CADA LADO — e os dois números são diferentes de propósito.
 *
 * O lado externo é o que aparece: é a silhueta nova, a coisa inteira que este bloco
 * existe para produzir, e ela precisa de pontos para ter recorte. O lado interno é o
 * que fica **atrás da cabeça opaca** (todo lóbulo vai com `atras: true`), e ele só
 * precisa de pontos suficientes para o laço fechar sem se cruzar.
 *
 * Gastar os dois lados igual seria pagar metade do orçamento por curva que ninguém
 * vê — e o orçamento é justamente o que limita a três lóbulos.
 */
const PONTOS_EXTERNOS = () => Number(process.env.PONTOS_EXT ?? 20);
const PONTOS_INTERNOS = 4;

/** Para onde o lado interno é empurrado, para entrar no crânio. */
type Sentido = "baixo" | "direita" | "esquerda";

interface Lobo {
  /** O lado que APARECE, medido e não tocado — a silhueta nova. */
  externo: { x: number; y: number }[];
  /** A varredura densa que gerou `externo`. Só para medir quanto a redução custou. */
  denso: { x: number; y: number }[];
  /** O lado que a cabeça oculta. É ele, e só ele, que a ancoragem empurra. */
  interno: { x: number; y: number }[];
  sentido: Sentido;
  area: number;
  /** `true` quando a massa é mais larga que alta — coroa, em vez de têmpora. */
  deitado: boolean;
}

/**
 * A massa de cabelo que passa da silhueta, virando laços fechados.
 *
 * Três passos, e cada um responde a uma exigência do tipo `Extensao`:
 *
 *  1. **fora do crânio** — um pixel só entra se `bordasEm(y)` disser que ele está
 *     além da borda naquela altura, ou acima do topo da caixa. É a mesma função que
 *     o `ponto()` usa para a franja, então não existe segunda descrição do crânio;
 *  2. **componente conexa** — lóbulos separados viram extensões separadas, porque é
 *     assim que a têmpora esquerda e a direita conseguem ter formas diferentes (e o
 *     `GIRO` garante que elas devem ter);
 *  3. **ancoragem** — o lado INTERNO do laço é empurrado `ANCORA` unidades para
 *     dentro do crânio. Sem isso `ancoragemDasExtensoes()` reprova: extensão
 *     tangente lê como adesivo colado ao lado, e meio pixel de antialiasing abre
 *     fresta de fundo entre as duas peças.
 *
 * A varredura do contorno muda de eixo conforme o lóbulo: massa em pé (têmpora) sai
 * por linha, massa deitada (coroa) sai por coluna. Varrer têmpora por coluna daria
 * dois pontos por coluna num lóbulo de 20 colunas — a forma vira serrilha.
 *
 * ---------------------------------------------------------------------------
 * SÓ UM DOS DOIS LADOS ANCORA, E A PRIMEIRA VERSÃO ANCORAVA OS DOIS
 * ---------------------------------------------------------------------------
 *
 * A tentativa anterior perguntava `bordasEm` ponto a ponto e empurrava para dentro
 * **todo** ponto que caísse fora da silhueta. Como o lóbulo inteiro é, por
 * construção, feito de pixels fora da silhueta, os dois lados iam para o mesmo
 * lugar: um lóbulo de têmpora medido de `esq−40` a `esq` viraria uma tira em
 * `esq+25`, e o volume que este bloco existe para produzir sairia colapsado — sem
 * erro, sem exceção, e com a ancoragem passando verde.
 *
 * Então o sentido é decidido **uma vez por lóbulo**, pela posição da massa: coroa
 * ancora para baixo, têmpora esquerda para a direita, têmpora direita para a
 * esquerda. O lado externo — a silhueta que aparece — sai como foi medido.
 */
function lobos(seg: Segmentacao, m: Mapa, yLimite: number): Lobo[] {
  const b = seg.bmp;
  const ate = Math.min(b.h, yLimite);
  const fora = new Uint8Array(b.w * ate);

  for (let y = 0; y < ate; y++) {
    const yU = paraY(m, y);
    if (yU < CAIXA_CABECA.y0 - 400 || yU > CAIXA_CABECA.y1) continue;
    const { esq, dir } = bordasEm(yU);
    const acimaDaCoroa = yU < CAIXA_CABECA.y0;
    for (let x = 0; x < b.w; x++) {
      if (!seg.cabelo(x, y)) continue;
      const xU = paraX(m, x);
      if (acimaDaCoroa || xU < esq || xU > dir) fora[y * b.w + x] = 1;
    }
  }

  // Componentes conexas por varredura em largura, vizinhança de 4.
  const marca = new Int32Array(b.w * ate).fill(-1);
  const grupos: number[][] = [];
  for (let i = 0; i < fora.length; i++) {
    if (!fora[i] || marca[i] >= 0) continue;
    const g = grupos.length;
    const fila = [i];
    const meus: number[] = [];
    marca[i] = g;
    while (fila.length) {
      const p = fila.pop()!;
      meus.push(p);
      const x = p % b.w;
      const y = (p / b.w) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= b.w || ny >= ate) continue;
        const q = ny * b.w + nx;
        if (fora[q] && marca[q] < 0) {
          marca[q] = g;
          fila.push(q);
        }
      }
    }
    grupos.push(meus);
  }

  const minimo = AREA_MINIMA * b.w * ate;
  const saida: Lobo[] = [];
  const meioDaCabeca = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;

  for (const g of grupos) {
    if (g.length < minimo) continue;
    // Em laço, e não por `Math.min(...xs)`: o espalhamento passa o array inteiro como
    // argumentos, e a 2048² um lóbulo tem centenas de milhares de pixels — o SVG
    // estourou a pilha exatamente aqui. Mesmos valores, sem o teto de aridade.
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of g) {
      const x = p % b.w;
      const y = (p / b.w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const deitado = x1 - x0 > y1 - y0;

    /**
     * O SENTIDO DA ANCORAGEM, decidido uma vez, pela massa toda.
     *
     * Massa deitada é coroa: ela só tem crânio EMBAIXO, então ancora para baixo.
     * Massa em pé é têmpora, e o lado do crânio depende de qual têmpora — o `GIRO`
     * garante que as duas não são espelho uma da outra, então a decisão é por
     * posição medida e não por simetria presumida.
     */
    const centroX = paraX(m, (x0 + x1) / 2);
    const sentido: Sentido = deitado
      ? "baixo"
      : centroX < meioDaCabeca
        ? "direita"
        : "esquerda";

    // Extremos por faixa, no eixo longo do lóbulo.
    const de = deitado ? x0 : y0;
    const ate2 = deitado ? x1 : y1;
    const menor = new Map<number, number>();
    const maior = new Map<number, number>();
    for (const p of g) {
      const x = p % b.w;
      const y = (p / b.w) | 0;
      const k = deitado ? x : y;
      const v = deitado ? y : x;
      menor.set(k, Math.min(menor.get(k) ?? Infinity, v));
      maior.set(k, Math.max(maior.get(k) ?? -Infinity, v));
    }

    const emU = (k: number, v: number) =>
      deitado ? { x: paraX(m, k), y: paraY(m, v) } : { x: paraX(m, v), y: paraY(m, k) };

    /**
     * As posições do lado INTERNO — e elas param antes das pontas de propósito.
     *
     * A crítica de selo 93ETYY nomeou uma *"quina vertical na ponta lateral, lê
     * como aba / orelheira, porque cabelo não termina em canto reto"*, e mediu
     * 25,8 unidades de parede vertical na Domada. A causa é aritmética: na ponta do
     * lóbulo a massa afina, e os dois lados quase se encostam — medidos, 116,5 e
     * 117,3. **A parede inteira foi criada pelo `ANCORA`**, que empurrou o ponto
     * interno 25 unidades para dentro enquanto o externo ficou onde estava.
     *
     * Amostrar o lado interno em `(i + ½) / n` em vez de `i / (n − 1)` mantém todos
     * os pontos no MIOLO do lóbulo: a ponta passa a ser feita só pelo lado externo,
     * e a spline fecha em bico em vez de em esquadro. O ponto interno mais externo
     * fica a 12,5% do comprimento, e a parede vira uma diagonal nesse trecho.
     */
    const faixas = (quantos: number): number[] => {
      const out: number[] = [];
      for (let i = 0; i < quantos; i++) {
        const k = Math.round(de + ((ate2 - de) * (i + 0.5)) / quantos);
        if (menor.has(k) && !out.includes(k)) out.push(k);
      }
      return out;
    };

    // Qual dos dois extremos é o que aparece. Coroa: o de cima (y menor). Têmpora
    // esquerda: o de x menor. Têmpora direita: o de x maior — e é só aqui que a
    // escolha inverte.
    const externoEhMenor = sentido !== "esquerda";
    const ladoDe = (k: number, oMenor: boolean) => emU(k, (oMenor ? menor : maior).get(k)!);

    /**
     * O LADO EXTERNO SAI DA VARREDURA DENSA REDUZIDA — e uniforme foi medida
     * reprovando.
     *
     * Amostrar as 8 posições em intervalos iguais deu 4,51% de distinção entre a
     * Espetada e a Tigela, contra piso de 5% — e as duas artes não são parecidas:
     * uma tem dois tufos acima da coroa (o perfil vai a −57,8, volta a −38,7, cai
     * de novo) e a outra é um arco parelho. **O que as igualou foi a amostragem**,
     * exatamente como a lição 7 do briefing descreve para a franja: ponto a cada N
     * cai na encosta tanto quanto no extremo, e a spline liga duas encostas por
     * curva lisa. O tufo morre na interpolação, não na rasterização.
     *
     * `reduzir()` é a mesma régua da franja, e ela vem por `denso` **sem giro**:
     * erro de corda mede distância ponto-a-corda em 2D e não tem eixo preferido. A
     * rotação de 90° existia porque o `extremos()` olhava só `y`, que é o eixo certo
     * num lóbulo de coroa e o errado num de têmpora — ver `reduzir()`.
     *
     * O lado interno continua uniforme: ele fica atrás da cabeça opaca, e preservar
     * recorte de coisa que ninguém vê é gastar byte à toa.
     */
    const girar = (p: { x: number; y: number }) => ({ x: p.y, y: p.x });
    const denso = [...menor.keys()]
      .sort((a, c) => a - c)
      .map((k) => ladoDe(k, externoEhMenor));
    const externo =
      CRITERIO() === "extremos"
        ? deitado
          ? extremos(denso, PONTOS_EXTERNOS())
          : extremos(denso.map(girar), PONTOS_EXTERNOS()).map(girar)
        : reduzir(denso, PONTOS_EXTERNOS());

    const kInt = faixas(PONTOS_INTERNOS);
    if (externo.length < 3 || kInt.length < 2) continue;

    saida.push({
      externo,
      denso,
      // Ao contrário, para o laço fechar sem se cruzar.
      interno: kInt.map((k) => ladoDe(k, !externoEhMenor)).reverse(),
      sentido,
      area: g.length / (b.w * ate),
      deitado,
    });
  }

  return saida.sort((a, c) => c.area - a.area);
}

/**
 * O TOPO DO CRÂNIO NUMA COLUNA — o `bordasEm` transposto.
 *
 * `bordasEm(y)` responde "onde a cabeça começa e termina NAQUELA altura", que é a
 * pergunta da franja. Um lóbulo de coroa faz a pergunta girada 90°: "onde a cabeça
 * começa NAQUELA coluna". Não é uma segunda descrição do crânio — é a mesma tabela
 * `CABECA.contorno`, consultada pelo outro eixo.
 *
 * Devolve `null` onde a cabeça não alcança aquela coluna, e quem chama trata: fora
 * da largura do crânio não há o que ancorar nem fresta que fechar.
 */
function topoEm(x: number): number | null {
  const p = CABECA.contorno;
  const ys: number[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    if (a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    if (t >= 0 && t < 1) ys.push(a.y + t * (b.y - a.y));
  }
  return ys.length ? Math.min(...ys) : null;
}

/**
 * O LAÇO FECHADO, pronto para `Extensao.forma` — com o lado interno ancorado.
 *
 * `dy` é o mesmo levante que `liberarORosto` aplica à franja, e ele **tem** de
 * chegar aqui: a extensão e a franja saíram da mesma arte, e subir uma sem a outra
 * abriria entre as duas um vão que não existe no PNG.
 *
 * ---------------------------------------------------------------------------
 * A ANCORAGEM PARTE DA BORDA MAIS FUNDA, E NÃO DA MEDIDA — POR CAUSA DA FRESTA
 * ---------------------------------------------------------------------------
 *
 * A primeira versão empurrava `ANCORA` a partir do que a régua mediu, e a Domada
 * mostrou o furo: no meio da coroa a massa externa termina em `y = −4`, e o topo do
 * crânio está em `y ≈ 45`. Somar 25 ali deixava a borda de baixo da extensão em 21 —
 * **24 unidades acima da cabeça**, ou seja uma faixa de fundo atravessando a coroa
 * inteira. A ancoragem passava (19,8 contra o piso de 10, medida em outro trecho do
 * mesmo laço) e o gate não teria como ver: `ancoragemDasExtensoes` pergunta *"a peça
 * entra na cabeça?"*, não *"a peça encosta na cabeça em todo o percurso?"*.
 *
 * Então a conta é `max(medido, borda do crânio) + ANCORA`: onde a arte já cobre a
 * cabeça, o empurrão sai da arte; onde ela para antes, sai do crânio. As duas viram
 * o mesmo caso, e o `max` garante que o laço nunca ENCOLHE — o lado externo, que é
 * o que aparece, continua exatamente como foi medido.
 *
 * **Não custa tinta visível** porque todo lóbulo vai com `atras: true`: o trecho
 * acrescentado nasce dentro do crânio, e a cabeça opaca o cobre.
 *
 * Acima da coroa a régua lateral não se aplica e o `bordasEm` ali devolve a caixa,
 * não a silhueta — por isso o clamp lateral só vale de `CAIXA_CABECA.y0` para baixo.
 * Um lóbulo de têmpora que suba acima da cabeça é empurrado só pelo `ANCORA`.
 */
function fecharLobo(l: Lobo, dy: number, kForcado?: number): { x: number; y: number }[] {
  /**
   * O EXCESSO ACIMA DO TETO É COMPRIMIDO, NÃO CORTADO — e a diferença é a forma.
   *
   * Cortar em `TETO_Y` achataria os picos contra uma reta, que é exatamente o
   * defeito que o `viewBox` já produz sozinho. Comprimir **em torno da linha da
   * coroa** encolhe a saliência inteira mantendo a proporção entre pico e vale:
   * um perfil de três tufos continua com três tufos, mais baixos.
   *
   * É o mesmo movimento de `liberarORosto`, e pelo mesmo motivo: o gerador não
   * conhece `FOLGA_ROSTO` e não conhece `VIEWBOX`. Sobra se remove de forma
   * determinística; falta exigiria inventar desenho, e isto a régua não faz.
   *
   * **Só o que está ACIMA da coroa é tocado.** A massa lateral — que é a que de
   * fato cabe no canvas, com 68 unidades de margem de cada lado contra 39 em cima —
   * sai como foi medida. Comprimir em torno da coroa sem esta guarda encolheria a
   * peça pelos lados também, e a lateral é justamente o que está funcionando.
   */
  const pico = Math.min(...l.externo.map((p) => p.y)) + dy;
  const y0 = CAIXA_CABECA.y0;
  // Na peça TRAÇADA o `k` vem de fora, e é um só para a peça inteira. Cada lóbulo
  // calculando o seu pelo próprio pico encolheria os altos e deixaria os baixos
  // intactos: a proporção entre eles mudaria, que é exatamente o que comprimir em
  // vez de cortar existe para preservar. Ver `comprimirNoTeto()`.
  const k = kForcado ?? (pico < TETO_Y ? (y0 - TETO_Y) / (y0 - pico) : 1);

  const mover = (p: { x: number; y: number }) => {
    const y = p.y + dy;
    return { x: p.x, y: y >= y0 ? y : y0 - (y0 - y) * k };
  };

  const ancorar = (p: { x: number; y: number }) => {
    const q = mover(p);
    if (l.sentido === "baixo") {
      // SÓ SE EMPURRA PARA ONDE A CABEÇA COBRE, e o teste é no DESTINO.
      //
      // Um lóbulo largo passa da largura do crânio — o da Tigela vai de x 25 a 485
      // —, e nas pontas não há cabeça atrás para ocultar coisa nenhuma. Empurrar
      // ali estica a silhueta visível para baixo: a Tigela ganhava um esporão de
      // 25 unidades pendurado no vazio em x 83.
      //
      // Perguntar só "existe crânio nesta coluna?" não basta: a cabeça é redonda,
      // e uma coluna que a cruza no meio da altura não a cruza embaixo. Quem
      // responde é `bordasEm` no `y` de destino.
      const topo = topoEm(q.x);
      if (topo === null) return q;
      const alvo = Math.max(q.y, topo) + ANCORA;
      const { esq, dir } = bordasEm(alvo);
      return q.x >= esq && q.x <= dir ? { x: q.x, y: alvo } : q;
    }
    if (q.y < CAIXA_CABECA.y0) {
      return { x: q.x + (l.sentido === "direita" ? ANCORA : -ANCORA), y: q.y };
    }
    const { esq, dir } = bordasEm(q.y);
    return l.sentido === "direita"
      ? { x: Math.max(q.x, esq) + ANCORA, y: q.y }
      : { x: Math.min(q.x, dir) - ANCORA, y: q.y };
  };

  return [...l.externo.map(mover), ...l.interno.map(ancorar)];
}

/* ------------------------------------------------------------------ */

interface Medida {
  pontos: { t: number; y: number }[];
  sombra: { t: number; y: number }[];
  /** Quanto a massa do cabelo passa da caixa da cabeça, em % da largura dela. */
  expansaoLateral: number;
  expansaoVertical: number;
  /** % de colunas com mais de uma corrida de cabelo — mecha lateral, coque, trança. */
  colunasComExtensao: number;
  /** A massa fora do crânio, já cortada em `MAX_LOBOS`. Ainda sem levante. */
  lobos: Lobo[];
  /** Quantos lóbulos o orçamento descartou. Impresso, nunca silencioso. */
  descartados: number;
  /**
   * QUANTO A REDUÇÃO CUSTOU — em unidades do `viewBox`, curva por curva.
   *
   * É o número que faltava, e é o que o Bloco III usa para escolher N. Ele mede a
   * poligonal reduzida contra a varredura DENSA da mesma arte, e por isso não tem o
   * piso que a fidelidade ponta a ponta tem: aqui não entra o clip do crânio, nem o
   * levante, nem o fato de o boneco do gerador não ser o do `geometria.ts`.
   *
   * Limiar: **meio traço, 6 unidades** — o mesmo que separa "borda do preenchimento"
   * de "linha de centro" no resto da régua.
   */
  desvio: {
    franja: { max: number; medio: number };
    sombra: { max: number; medio: number };
    lobos: { max: number; medio: number }[];
  };
}

export function medirFranja(seg: Segmentacao, m: Mapa, aImagem: Ancoras): Medida {
  const b = seg.bmp;
  const p = perfil(seg, aImagem.yPescoco);
  const todos = lobos(seg, m, aImagem.yPescoco);
  const franjaSuave = suavizar(p.franja, Math.round(b.w * 0.02));
  const sombraSuave = suavizar(p.sombra, Math.round(b.w * 0.02));

  /**
   * MEIO TRAÇO, e o número não é ajuste — é o que separa as duas grandezas.
   *
   * A régua acha o pixel de **preenchimento** mais baixo. O que `cabelo.ts` guarda
   * é a **linha de centro** do path, e entre as duas há metade do contorno preto,
   * que tem `TRACO = 12` unidades. Sem a correção a medida sai sistematicamente
   * 6 unidades alta — e "sistematicamente" é a palavra: na ida e volta o desvio deu
   * 6,8 · 6,5 · 6,5 nos três pontos centrais, antes de qualquer correção. Erro que
   * é constante em todo o percurso não é ruído, é uma grandeza diferente.
   *
   * **Só a franja.** A curva de sombra é a fronteira entre dois preenchimentos —
   * a camada clara não tem contorno —, então ali não há traço para descontar.
   */
  const emUnidades = (v: (number | null)[], correcao = 0) => {
    const out: { x: number; y: number }[] = [];
    for (let x = 0; x < v.length; x++) {
      if (v[x] === null) continue;
      out.push({ x: paraX(m, x), y: paraY(m, v[x]!) + correcao });
    }
    return out;
  };

  const franja = emUnidades(franjaSuave, TRACO / 2);
  const sombra = emUnidades(sombraSuave);

  /** `x` absoluto vira fração da largura da cabeça NAQUELA altura. */
  const paraT = (pt: { x: number; y: number }) => {
    const { esq, dir } = bordasEm(pt.y);
    return { t: (pt.x - esq) / (dir - esq), y: pt.y };
  };

  // A expansão: quanto a massa passa da caixa da cabeça. É o número que a nota
  // sobre volume trouxe — um cabelo que não passa de zero é tinta dentro do crânio,
  // e a silhueta dele é a do boneco careca.
  const xs = franja.map((q) => q.x);
  const larguraCabeca = CAIXA_CABECA.x1 - CAIXA_CABECA.x0;
  const passaEsq = Math.max(0, CAIXA_CABECA.x0 - Math.min(...xs));
  const passaDir = Math.max(0, Math.max(...xs) - CAIXA_CABECA.x1);

  /**
   * O TOPO vem do perfil, não da franja — e a primeira versão errou exatamente aqui.
   *
   * `franja` é a borda de BAIXO da touca. Tirar o mínimo dela dá o ponto mais alto
   * da *borda de baixo*, que fica sempre dentro do crânio: a conta devolvia
   * `expansão vertical 0,0%` para duas artes que visivelmente têm massa acima da
   * coroa. Régua que responde à pergunta errada dá número plausível — é a lição que
   * o Bloco 1d pagou quatro vezes.
   */
  const topoU = p.topo === null ? Infinity : paraY(m, p.topo) - TRACO / 2;

  /**
   * A REDUÇÃO RODA EM COORDENADA ABSOLUTA, E SÓ DEPOIS VIRA `{t, y}`.
   *
   * `t` é fração da largura da cabeça **naquela altura**, e a largura varia com a
   * altura. Decimar já em `{t, y}` mediria erro de corda num espaço reparametrizado:
   * a mesma distância em unidades custaria mais perto do queixo (onde a cabeça é
   * estreita) do que na coroa, e o critério gastaria pontos onde a cabeça afina em
   * vez de onde a mecha vira.
   *
   * É o erro que o Bloco 1d pagou quatro vezes com outros nomes — régua medindo a
   * grandeza errada devolve número plausível. Aqui ele não acontece porque `franja`
   * e `sombra` chegam em unidades do `viewBox` e o `.map(paraT)` vem DEPOIS.
   */
  const franjaFina = reduzir(franja, PONTOS_FINAIS());
  const sombraFina = reduzir(sombra, PONTOS_FINAIS());

  return {
    pontos: franjaFina.map(paraT),
    // A sombra usa o MESMO critério da franja desde o Bloco II. Antes ela era
    // uniforme, para não oscilar contra uma franja decimada por extremos; com as
    // duas no erro de corda elas se reduzem em fase, e a razão de divergir sumiu.
    sombra: sombraFina.map(paraT),
    desvio: {
      franja: desvioDaCorda(franja, franjaFina),
      sombra: desvioDaCorda(sombra, sombraFina),
      lobos: todos.slice(0, MAX_LOBOS).map((l) => desvioDaCorda(l.denso, l.externo)),
    },
    expansaoLateral: (100 * Math.max(passaEsq, passaDir)) / larguraCabeca,
    expansaoVertical: (100 * Math.max(0, CAIXA_CABECA.y0 - topoU)) / larguraCabeca,
    colunasComExtensao: (100 * p.colunasComExtensao) / b.w,
    lobos: todos.slice(0, MAX_LOBOS),
    descartados: Math.max(0, todos.length - MAX_LOBOS),
  };
}

/* ------------------------------------------------------------------ */
/* O TRAÇADO — a arte inteira como UM laço fechado                      */
/* ------------------------------------------------------------------ */

/**
 * OS TRÊS LIMIARES DE POSTERIZAÇÃO SAEM DA ARTE, e a primeira versão os fixou.
 *
 * A fronteira entre o tom claro e o escuro é um degradê macio na arte gerada — o
 * gerador não sabe fazer chapado. Escolher um limiar e seguir devolveria um número
 * plausível para qualquer valor, e é a lição que o especular do Bloco 1d pagou:
 * limiar + caixa deu 241×54 por causa de pontinhos, e a resposta certa foi exigir
 * que a medida **não se mexesse** entre limiares.
 *
 * **Mas os limiares não podem ser absolutos, e três medições provaram isso.** Com
 * `[0,38 · 0,42 · 0,46]` fixos, tanto a ida e volta (75,5% · 74,9% · 4,0%) quanto a
 * `curto-espetada` (66,7% · 66,2% · 15,5%) deram mais de 100% de instabilidade — não
 * porque a fronteira delas seja ruim, mas porque o tom claro das duas mora em ~0,44
 * e o terceiro limiar caía **do outro lado dele**. A régua estava medindo se o tom
 * claro passava de 0,46, que não é a pergunta.
 *
 * Então os três saem dos DOIS MODOS de luminância do próprio teal: o do meio no
 * fundo do vale entre eles, os outros dois a um quarto do vão para cada lado. Assim
 * a varredura pergunta o que devia perguntar desde o começo — *a fronteira anda se
 * eu mexer o limiar dentro do vale?* — e a resposta vale para arte chapada e para
 * arte com rampa, sem constante nenhuma no meio.
 */
const ESTABILIDADE = 0.03;

/** A largura da varredura, em fração do vão entre os dois modos. */
const VARREDURA_DO_VALE = 0.25;

/** Para onde um ponto da clara que vazou é empurrado, em unidades. */
const PROJECAO = 2;

/**
 * A janela em que a conferência cruzada tem de cair, em unidades.
 *
 * A régua mede a linha de centro do contorno PRETO; a borda do preenchimento TEAL
 * fica meio traço para dentro dela. `TRACO` é 12, então a distância esperada entre
 * as duas é 6 — e a janela [4, 8] é essa expectativa com a folga do antialiasing do
 * gerador, que engrossa ou afina o traço em até 2 unidades.
 *
 * Fora da janela, uma das duas coisas está errada, e as duas são graves: ou a
 * máscara está pegando preto que não é do cabelo (mediana alta), ou está pegando a
 * borda do teal em vez do centro do traço (mediana baixa). Nos dois casos a peça
 * sairia deslocada em relação à arte de forma sistemática — que é o erro que não
 * aparece em IoU e aparece na folha.
 */
const CONFERENCIA = [4, 8] as const;

/** Passo da sondagem ao longo da normal, em pixels. */
const PASSO_NORMAL = 0.5;

/** Componentes conexas de 4 vizinhos. A mesma varredura que `lobos()` faz. */
function conexas(mask: Uint8Array, w: number, h: number): number[][] {
  const marca = new Int32Array(mask.length).fill(-1);
  const grupos: number[][] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || marca[i] >= 0) continue;
    const g = grupos.length;
    const fila = [i];
    const meus: number[] = [];
    marca[i] = g;
    while (fila.length) {
      const p = fila.pop()!;
      meus.push(p);
      const x = p % w;
      const y = (p / w) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && marca[q] < 0) {
          marca[q] = g;
          fila.push(q);
        }
      }
    }
    grupos.push(meus);
  }
  return grupos.sort((a, b) => b.length - a.length);
}

/**
 * DISTÂNCIA EM PIXELS ATÉ O MARCO MAIS PRÓXIMO, por chanfro de duas passadas.
 *
 * Serve a duas perguntas do arquivo: quais pixels pretos estão perto o bastante do
 * teal para serem o contorno DELE (e não o do rosto), e quanto a linha de centro
 * medida dista da borda do teal — a conferência cruzada.
 *
 * Duas passadas com pesos 1 e √2 erram menos de 4% contra a distância euclidiana
 * exata, e as duas perguntas comparam com limiares de 20 e 6 unidades. É folga de
 * sobra, e o exato custaria uma varredura por marco.
 */
function distanciaDe(marco: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(marco.length).fill(INF);
  for (let i = 0; i < marco.length; i++) if (marco[i]) d[i] = 0;
  const R = Math.SQRT2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) v = Math.min(v, d[i - w] + 1);
      if (x > 0 && y > 0) v = Math.min(v, d[i - w - 1] + R);
      if (x < w - 1 && y > 0) v = Math.min(v, d[i - w + 1] + R);
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < h - 1) v = Math.min(v, d[i + w] + 1);
      if (x < w - 1 && y < h - 1) v = Math.min(v, d[i + w + 1] + R);
      if (x > 0 && y < h - 1) v = Math.min(v, d[i + w - 1] + R);
      d[i] = v;
    }
  }
  return d;
}

/**
 * A BORDA DE UMA MÁSCARA, **EM ORDEM** — o kernel que a cortina obrigou a existir.
 *
 * A régua paramétrica lia a arte por coluna: para cada `x`, o fim da primeira
 * corrida de cabelo. Isso pressupõe que a borda é uma **função de `x`**, e é
 * exatamente o que a cortina desmente: a massa que desce ao lado do rosto e volta a
 * subir tem dois `y` na mesma coluna, e a varredura por coluna precisa escolher um.
 * Escolhendo o de cima, a cortina some (o caso medido, ~220 unidades de desvio);
 * escolhendo o de baixo, a franja e a cortina viram a mesma curva serrilhada.
 *
 * Traçado de borda não escolhe: ele **anda** pela fronteira e devolve os pixels na
 * ordem em que aparecem, e a ordem é o que um laço fechado precisa. É o Moore
 * clássico, com o pixel de retrocesso guardado explicitamente em vez de um índice
 * de direção — a aritmética de índice é onde este algoritmo costuma sair torto, e o
 * pixel não tem convenção para errar.
 *
 * O início sai da varredura em ordem de linha, então o vizinho da ESQUERDA dele
 * está fora da máscara por construção: é o retrocesso inicial, de graça.
 */
function bordaOrdenada(mask: Uint8Array, w: number, h: number): { x: number; y: number }[] {
  let inicio = -1;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) {
      inicio = i;
      break;
    }
  }
  if (inicio < 0) return [];

  const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  // Os 8 vizinhos em ordem horária, começando pela direita.
  const VIZ = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const sx = inicio % w;
  const sy = (inicio / w) | 0;
  const out = [{ x: sx, y: sy }];
  let c = { x: sx, y: sy };
  let b = { x: sx - 1, y: sy };
  const TETO = mask.length * 2;

  for (let passo = 0; passo < TETO; passo++) {
    const k = VIZ.findIndex(([dx, dy]) => c.x + dx === b.x && c.y + dy === b.y);
    if (k < 0) break;
    let proximo: { x: number; y: number } | null = null;
    let anterior = b;
    for (let j = 1; j <= 8; j++) {
      const d = VIZ[(k + j) % 8];
      const p = { x: c.x + d[0], y: c.y + d[1] };
      if (dentro(p.x, p.y)) {
        proximo = p;
        break;
      }
      anterior = p;
    }
    if (!proximo) break;
    b = anterior;
    c = proximo;
    if (c.x === sx && c.y === sy) break;
    out.push(c);
  }
  return out;
}

/** Média móvel circular sobre uma poligonal fechada, ANTES de decimar. */
function suavizarLaco(pts: { x: number; y: number }[], janela: number): { x: number; y: number }[] {
  const n = pts.length;
  if (n === 0 || janela < 1) return pts;
  return pts.map((_, i) => {
    let sx = 0;
    let sy = 0;
    for (let j = -janela; j <= janela; j++) {
      const p = pts[(i + j + n * (Math.abs(j) + 1)) % n];
      sx += p.x;
      sy += p.y;
    }
    const q = 2 * janela + 1;
    return { x: sx / q, y: sy / q };
  });
}

interface Conferencia {
  p10: number;
  mediana: number;
  p90: number;
  semContorno: number;
  /**
   * A ESPESSURA DO TRAÇO DA ARTE, medida — e ela quase nunca é `TRACO`.
   *
   * O compositor desenha com `TRACO = 12` constante, e a arte gerada tem a espessura
   * que o gerador quis. A diferença é **desvio aceito e declarado** — o estilo tem
   * uma espessura só, e reproduzir a variação da arte seria trocar a lei do estilo
   * pelo capricho do modelo de difusão.
   *
   * Mas ela precisa ser medida, porque é ela que dá sentido à conferência cruzada: a
   * distância entre a linha de centro e a borda do preenchimento é metade do traço
   * **DA ARTE**, não metade de 12. Comparar com 6 quando o traço da arte tem 2
   * reprovaria uma medição perfeita.
   */
  espessura: { p10: number; mediana: number; p90: number };
}

interface Massa {
  /** O laço denso, em unidades do `viewBox`, já na linha de centro do preto. */
  denso: { x: number; y: number }[];
  conferencia: Conferencia;
  /** Buracos internos descartados, em % da área da massa. Impressos, nunca calados. */
  furos: number[];
  /** Componentes de teal que não são a massa principal, em % da área dela. */
  ilhas: number[];
}

/**
 * A MASSA DE CABELO COMO LAÇO FECHADO — o método que a base usou, aplicado ao cabelo.
 *
 * Três passos, e cada um é uma escolha que já foi medida errando de outro jeito:
 *
 *  1. **a máscara é teal ∪ o preto DELE.** Só o teal daria a borda do preenchimento,
 *     que fica meio traço para dentro da linha que `cabelo.ts` guarda. Todo o preto
 *     daria o rosto junto. O preto que conta é o que está a menos de um traço de
 *     distância do teal — a mesma pergunta que `corridas()` responde num eixo, feita
 *     no plano por transformada de distância;
 *  2. **a ordem vem do traçado de borda**, nunca da varredura por coluna. É o item
 *     que a cortina obriga: ver `bordaOrdenada()`;
 *  3. **a posição vem do centro da corrida de preto na normal local** — a mecânica
 *     de `corridas()` em `medir.ts`, que é como os 42 pontos do crânio foram medidos.
 *     Andar meio traço para dentro seria supor a espessura em vez de medi-la, e a
 *     espessura do traço da arte gerada varia.
 *
 * Onde a normal não encontra preto nenhum — a massa encostando na borda do quadro,
 * ou uma emenda em que o gerador não fechou o contorno — o ponto cai meio traço para
 * dentro e o caso entra em `conferencia.semContorno`, impresso.
 */
function medirMassa(seg: Segmentacao, m: Mapa, yLimite: number): Massa {
  const b = seg.bmp;
  const ate = Math.min(b.h, yLimite);
  const n = b.w * ate;
  const teal = new Uint8Array(n);
  const escuro = new Uint8Array(n);
  for (let y = 0; y < ate; y++) {
    for (let x = 0; x < b.w; x++) {
      const i = y * b.w + x;
      // DUAS perguntas independentes, e o `else` que havia aqui virou propriedade da
      // fonte de matiz. Ver o docstring de `Segmentacao`: no SVG a família `traco` é
      // cabelo E é escura, e apagá-la de `escuro` encolheria a peça inteira.
      if (seg.cabelo(x, y)) teal[i] = 1;
      if (seg.escuro(x, y)) escuro[i] = 1;
    }
  }

  /**
   * O CABELO É O MAIOR COMPONENTE DE **TEAL**, e a primeira versão partia da união.
   *
   * Ela dilatava o preto em torno de todo teal e só então achava componentes — e o
   * preto é conexo. Medido na `curto-espetada`: o contorno do rosto ficava a menos
   * de um traço da mecha lateral, entrava na máscara, e por ele a peça atravessava a
   * bochecha inteira até **o queixo**, onde reencontrava o teal da gola. O laço
   * saía com um tentáculo de ida e volta pelo meio da cara; a decimação o comia
   * primeiro (ida e volta são pontos colineares, custo de corda ~0) e o desvio
   * empacava em 96,8 unidades sem responder a N — o platô 174,9 → 124,4 → 96,8.
   *
   * O preto só pode ser ponte para o cabelo se estiver perto do cabelo. Então o
   * componente sai do teal, que a pele separa de graça, e o preto entra depois.
   */
  const gruposTeal = conexas(teal, b.w, ate);
  if (!gruposTeal.length) {
    const vazio = { p10: 0, mediana: 0, p90: 0 };
    return { denso: [], conferencia: { ...vazio, semContorno: 0, espessura: vazio }, furos: [], ilhas: [] };
  }
  const cabelo = new Uint8Array(n);
  for (const i of gruposTeal[0]) cabelo[i] = 1;
  const ilhas = gruposTeal
    .slice(1)
    .map((g) => (100 * g.length) / gruposTeal[0].length)
    .filter((p) => p > 0.05);

  // Um traço inteiro em pixels: é a distância máxima a que o contorno do cabelo
  // pode estar do preenchimento dele. `m.kx` leva pixel a unidade, então o inverso
  // leva unidade a pixel.
  const tracoPx = TRACO / m.kx;
  const doCabelo = distanciaDe(cabelo, b.w, ate);

  const massa = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (cabelo[i] || (escuro[i] && doCabelo[i] <= tracoPx)) massa[i] = 1;
  }

  const grupos = conexas(massa, b.w, ate);
  const soAPeca = new Uint8Array(n);
  for (const i of grupos[0]) soAPeca[i] = 1;

  // Os furos: fundo cercado pela massa. O laço externo os engole por construção —
  // então o que importa é que o tamanho deles apareça, para uma mecha vazada não
  // virar mancha sólida sem ninguém saber.
  const fundo = new Uint8Array(n);
  for (let i = 0; i < n; i++) fundo[i] = soAPeca[i] ? 0 : 1;
  const furos = conexas(fundo, b.w, ate)
    .filter((g) => g.every((i) => i % b.w > 0 && i % b.w < b.w - 1 && (i / b.w | 0) > 0 && (i / b.w | 0) < ate - 1))
    .map((g) => (100 * g.length) / grupos[0].length)
    .filter((p) => p > 0.05);

  const borda = bordaOrdenada(soAPeca, b.w, ate);

  // Um ponto a cada 2 px de borda: a 2 px por unidade, é um ponto por unidade do
  // `viewBox`, e a decimação por erro de corda escolhe de lá. Amostrar cada pixel
  // dobraria o custo da normal sem acrescentar forma nenhuma.
  const PASSO = 2;
  const JANELA = 6;
  const alcance = Math.ceil(2.5 * tracoPx);
  const denso: { x: number; y: number }[] = [];
  const cruzamento: number[] = [];
  const espessuras: number[] = [];
  let semContorno = 0;

  for (let i = 0; i < borda.length; i += PASSO) {
    const p = borda[i];
    const a = borda[(i - JANELA + borda.length) % borda.length];
    const c = borda[(i + JANELA) % borda.length];
    const tx = c.x - a.x;
    const ty = c.y - a.y;
    const comp = Math.hypot(tx, ty) || 1;
    // A normal, com o sinal escolhido pelo teste: aquela das duas que aponta para
    // dentro da máscara. Presumir o sentido pela ordem do traçado funciona até a
    // primeira concavidade, e a cortina é uma concavidade.
    let nx = -ty / comp;
    let ny = tx / comp;
    const dentroDaMassa = (x: number, y: number) => {
      const ix = Math.round(x);
      const iy = Math.round(y);
      return ix >= 0 && iy >= 0 && ix < b.w && iy < ate && soAPeca[iy * b.w + ix] === 1;
    };
    if (!dentroDaMassa(p.x + nx * 3, p.y + ny * 3)) {
      nx = -nx;
      ny = -ny;
    }

    const passos = Math.ceil(alcance / PASSO_NORMAL);
    const emK = (k: number) => {
      const x = Math.round(p.x + nx * k * PASSO_NORMAL);
      const y = Math.round(p.y + ny * k * PASSO_NORMAL);
      return x >= 0 && y >= 0 && x < b.w && y < ate ? y * b.w + x : -1;
    };
    const corrida = corridas(passos, (k) => {
      const i = emK(k);
      return i >= 0 && escuro[i] === 1;
    })[0];

    const off = corrida ? corrida.centro * PASSO_NORMAL : tracoPx / 2;
    if (corrida) espessuras.push(corrida.espessura * PASSO_NORMAL * m.kx);
    else semContorno++;
    denso.push({ x: paraX(m, p.x + nx * off), y: paraY(m, p.y + ny * off) });

    /**
     * A CONFERÊNCIA CRUZADA ANDA NO MESMO RAIO — e medi-la no plano não funcionou.
     *
     * A primeira versão calculava a distância da linha de centro à borda do teal por
     * transformada de distância sobre a imagem inteira, e devolveu mediana 0,8 u
     * onde o traço da arte tem 8,3: o antialiasing entre o preto e o teal produz
     * pixels que ainda passam no teste de matiz, então "borda do teal" existia
     * espalhada por dentro do próprio traço, e todo ponto tinha uma a zero unidade.
     *
     * Na mesma normal isso não acontece: a corrida de preto e o começo do teal DEPOIS
     * dela são duas leituras independentes do mesmo lugar, e a distância entre elas é
     * meia espessura por construção. É a mesma ideia de `corridas()` — perguntar ao
     * longo de uma varredura em vez de ao plano todo.
     */
    if (corrida) {
      const teals = corridas(passos, (k) => {
        const i = emK(k);
        return i >= 0 && cabelo[i] === 1;
      });
      const depois = teals.find((c) => c.x0 > corrida.x1);
      if (depois) cruzamento.push((depois.x0 - corrida.centro) * PASSO_NORMAL * m.kx);
    }
  }

  const quantis = (v: number[]) => {
    const o = v.slice().sort((x, y) => x - y);
    const q = (f: number) => o[Math.min(o.length - 1, Math.floor(f * o.length))] ?? 0;
    return { p10: q(0.1), mediana: q(0.5), p90: q(0.9) };
  };
  const cruz = quantis(cruzamento);

  return {
    denso: suavizarLaco(denso, Math.max(1, Math.round(denso.length * 0.01))),
    conferencia: { ...cruz, semContorno, espessura: quantis(espessuras) },
    furos,
    ilhas,
  };
}

/**
 * QUANTO O PONTO `i` PODE ANDAR NA DIREÇÃO `n` SEM ATRAVESSAR O PRÓPRIO LAÇO.
 *
 * Metade da distância até o lugar onde o raio que sai do ponto reencontra o laço.
 * Numa borda lisa o raio aponta para fora e não reencontra nada perto: o teto é
 * infinito e não morde. Ele só aparece onde a peça é uma **língua** — a cortina que
 * desce ao lado do rosto — e ali é a diferença entre uma mecha e um entalhe.
 *
 * Medido na `curto-espetada`: a cortina da esquerda tem ~10 unidades de largura e a
 * sangria empurrava o flanco de dentro **11,5** — ele pousava do outro lado do flanco
 * de fora, o laço dobrava, e o `nonzero` do SVG esvaziava tudo entre os dois
 * cruzamentos. É a peça inteira sumindo de `y` 88 para baixo numa coluna em que a
 * arte desce até 268.
 *
 * **Pela direção, e não por distância em arco.** A primeira versão tomava metade da
 * distância ao ponto mais próximo fora de uma janela de arco, e ela erra dos dois
 * lados ao mesmo tempo: numa reta o vizinho logo fora da janela está à distância da
 * própria janela, e o teto travava toda borda lisa em metade dela; na PONTA de uma
 * língua estreita os dois flancos distam menos que a janela em arco, o outro lado era
 * excluído por vizinhança, e ali — justamente onde o defeito mora — o teto sumia.
 * O raio não tem esse problema: ele sai do laço e só volta a encontrá-lo de verdade.
 *
 * Metade, e não a distância inteira, porque o outro flanco também anda: os dois vêm
 * um na direção do outro no pior caso, e meia distância para cada um os deixa
 * encostados em vez de trocados.
 */
function alcanceNaDirecao(
  pts: { x: number; y: number }[],
  i: number,
  nx: number,
  ny: number,
): number {
  const n = pts.length;
  const p = pts[i];
  // O raio nasce EM CIMA do laço: os segmentos que tocam o próprio ponto o cruzam em
  // t = 0 e não dizem nada sobre para onde ele pode ir.
  const encosta = (k: number) => {
    const d = Math.abs(k - i);
    return Math.min(d, n - d) <= 1;
  };

  let mais = Infinity;
  for (let a = 0; a < n; a++) {
    const b = (a + 1) % n;
    if (encosta(a) || encosta(b)) continue;
    const q = pts[a];
    const ex = pts[b].x - q.x;
    const ey = pts[b].y - q.y;
    const den = nx * ey - ny * ex;
    if (Math.abs(den) < 1e-12) continue; // paralelo: não há encontro
    const qx = q.x - p.x;
    const qy = q.y - p.y;
    const t = (qx * ey - qy * ex) / den;
    const u = (qx * ny - qy * nx) / den;
    if (t > 0 && u >= 0 && u <= 1) mais = Math.min(mais, t);
  }
  return mais / 2;
}

/**
 * A SANGRIA DA PEÇA TRAÇADA — o `t` fora de [0, 1] da franja, generalizado.
 *
 * O modelo paramétrico exige que as pontas da franja caiam FORA da silhueta, e o
 * teste reprova o modelo cuja ponta caia dentro. O motivo não é topológico, é de
 * tinta: quem corta a lateral é o `clipPath`, e uma borda que termine EXATAMENTE na
 * linha do crânio tem o traço de 12 unidades cortado ao meio — sobra meia espessura,
 * e meio pixel de antialiasing abre uma fresta de fundo entre o cabelo e a cabeça.
 *
 * O traçado tropeça nisso sozinho, e a ida e volta mostra por quê: o `curto` foi
 * renderizado JÁ CLIPADO, então a borda que a régua mede ali **é** o contorno do
 * crânio. Medida fielmente, a peça encosta e não passa — `coberturaDaCoroa` saiu em
 * 1,7%, com metade dos pontos caindo do lado de dentro por arredondamento.
 *
 * Então todo ponto que a régua encontrar a menos de meio traço do contorno é
 * empurrado `SANGRIA` unidades para fora, radialmente a partir do centro da caixa da
 * cabeça — que numa forma convexa como o crânio é a normal externa com erro bem
 * abaixo do próprio empurrão. **Isto não afasta a peça da arte**: o trecho movido é
 * justamente o que o clip come. O que muda no render é a fresta deixar de existir.
 *
 * Onde a arte de fato passa do crânio — que é o caso das artes geradas, medidas sem
 * clip nenhum — o ponto está longe do contorno e sai como foi medido.
 *
 * **O empurrão tem teto, e o teto é o próprio laço.** Ver `alcanceNoLaco()`: numa
 * mecha mais estreita que duas sangrias o flanco de dentro passaria do de fora, e o
 * laço dobraria sobre si mesmo. Quantos pontos o teto travou sai impresso — é a
 * medida de "esta arte tem uma língua fina demais para a sangria caber".
 */
export function sangrarNaSilhueta(pts: { x: number; y: number }[]): {
  pts: { x: number; y: number }[];
  quantos: number;
  travados: number;
} {
  const cx = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
  const cy = (CAIXA_CABECA.y0 + CAIXA_CABECA.y1) / 2;
  const contorno = CABECA.contorno;
  let quantos = 0;
  let travados = 0;

  const saida = pts.map((p, k) => {
    let melhor = { x: p.x, y: p.y };
    let dist = Infinity;
    for (let i = 0, j = contorno.length - 1; i < contorno.length; j = i++) {
      const a = contorno[i];
      const b = contorno[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
      const q = { x: a.x + t * dx, y: a.y + t * dy };
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < dist) {
        dist = d;
        melhor = q;
      }
    }
    if (dist > MEIO_TRACO) return p;
    quantos++;
    const rx = melhor.x - cx;
    const ry = melhor.y - cy;
    const comp = Math.hypot(rx, ry) || 1;
    const nx = rx / comp;
    const ny = ry / comp;
    /**
     * O QUE FALTA para chegar a `SANGRIA` para fora — e não a POSIÇÃO da projeção.
     *
     * A versão anterior devolvia `melhor + n·SANGRIA`, isto é, jogava fora a
     * coordenada tangencial do ponto. Numa língua de cabelo os dois flancos projetam
     * no MESMO trecho do contorno: os dois saíam na mesma linha, e o laço percorria
     * ida e volta por cima dela. Medido na `curto-espetada`: 22 auto-interseções no
     * laço denso, contra 4 quando só a componente normal é corrigida.
     */
    const s = (p.x - melhor.x) * nx + (p.y - melhor.y) * ny;
    if (s >= SANGRIA) return p;
    const anda = Math.min(SANGRIA - s, alcanceNaDirecao(pts, k, nx, ny));
    if (anda < SANGRIA - s) travados++;
    return { x: p.x + nx * anda, y: p.y + ny * anda };
  });

  return { pts: saida, quantos, travados };
}

interface Clara {
  denso: { x: number; y: number }[];
  /** Área da região clara em cada limiar, em % do teal. */
  areas: number[];
  /** Os três limiares varridos, derivados do vale entre os dois modos. */
  limiares: number[];
  /** A variação relativa entre os três. Acima de `ESTABILIDADE` é aviso. */
  instabilidade: number;
  /**
   * A ARTE JÁ ESTAVA CHAPADA — e aí a varredura de limiares não mede nada.
   *
   * Os três limiares existem porque o gerador entrega degradê macio, e escolher um
   * ponto da rampa sem conferir se a medida se mexe é o erro que o especular do
   * Bloco 1d pagou. Mas a ida e volta renderiza o `curto` com **duas cores exatas**:
   * não há rampa, e os três limiares medem 75,5% · 74,9% · 4,0% — 139% de
   * instabilidade sobre uma fronteira que é perfeita.
   *
   * O número não estava errado, a pergunta estava. Quando a luminância do teal se
   * concentra em dois picos com o vale vazio entre eles, a fronteira é um DEGRAU e o
   * limiar certo é o meio do vale — medido, não herdado da constante.
   */
  chapada: boolean;
  /** O limiar de fato usado: `LIMIAR_CLARO`, ou o meio do vale na arte chapada. */
  limiar: number;
}

/**
 * A REGIÃO CLARA — o degradê da arte posterizado em fronteira medida.
 *
 * É a regra 15c (o efeito cubo) aplicada ao cabelo: o estilo inteiro é chapado, e
 * um cabelo com rampa seria a única peça do sistema a ter uma. A fronteira sai de
 * onde o degradê cruza o limiar, e o limiar só vale se a medida **não se mexer**
 * entre os três — ver `LIMIARES_CLARO`.
 *
 * Ela não leva desconto de meio traço, e a diferença é de natureza: a borda da massa
 * é a linha de centro de um traço PRETO, e esta é a fronteira entre dois
 * preenchimentos. Não há traço ali para descontar — a camada clara é a única do
 * cabelo desenhada sem contorno, que é justamente o que torna o vazamento dela
 * invisível para todas as outras réguas.
 */
function medirClara(seg: Segmentacao, m: Mapa, yLimite: number): Clara {
  const b = seg.bmp;
  const ate = Math.min(b.h, yLimite);
  const n = b.w * ate;

  /**
   * A FONTE DE PATH NÃO TEM RAMPA, E VARRER LIMIAR NELA MEDIRIA O RASTER.
   *
   * Os três limiares existem porque o gerador entrega degradê macio e escolher um
   * ponto da rampa sem conferir se a medida se mexe é o erro que o especular do Bloco
   * 1d pagou. No SVG cada path **já traz o seu tom**: a fronteira entre corpo e sombra
   * é a borda entre dois paths, e é exata por construção. Varrer limiar ali mediria a
   * largura do antialiasing do raster, que é uma pergunta sobre o rasterizador.
   *
   * Então a varredura não roda, e o que sai impresso diz isso — nunca uma
   * instabilidade de 0,0% que o leitor confundiria com uma medição estável.
   */
  if (!seg.tom) {
    const mask = new Uint8Array(n);
    let doTeal = 0;
    let daClara = 0;
    for (let y = 0; y < ate; y++) {
      for (let x = 0; x < b.w; x++) {
        if (!seg.cabelo(x, y)) continue;
        doTeal++;
        if (!seg.claro(x, y)) continue;
        daClara++;
        mask[y * b.w + x] = 1;
      }
    }
    const area = doTeal ? (100 * daClara) / doTeal : 0;
    const grupos = conexas(mask, b.w, ate);
    const vazio = { areas: [area], limiares: [], instabilidade: 0, chapada: true, limiar: -1 };
    if (!grupos.length) return { denso: [], ...vazio };
    const soAClara = new Uint8Array(n);
    for (const i of grupos[0]) soAClara[i] = 1;
    const borda = bordaOrdenada(soAClara, b.w, ate);
    const denso: { x: number; y: number }[] = [];
    for (let i = 0; i < borda.length; i += 2) {
      denso.push({ x: paraX(m, borda[i].x), y: paraY(m, borda[i].y) });
    }
    return { denso: suavizarLaco(denso, Math.max(1, Math.round(denso.length * 0.01))), ...vazio };
  }

  const tons = new Float32Array(n).fill(-1);
  let doTeal = 0;
  for (let y = 0; y < ate; y++) {
    for (let x = 0; x < b.w; x++) {
      if (!seg.cabelo(x, y)) continue;
      tons[y * b.w + x] = seg.tom(x, y);
      doTeal++;
    }
  }

  // Os dois modos de luminância do teal, e quanto pixel mora no vale entre eles.
  // Vale vazio = a arte já veio chapada, e não há rampa a posterizar.
  const BINS = 64;
  const hist = new Array<number>(BINS).fill(0);
  for (let i = 0; i < n; i++) if (tons[i] >= 0) hist[Math.min(BINS - 1, Math.floor(tons[i] * BINS))]++;
  const pico1 = hist.indexOf(Math.max(...hist));
  const pico2 = hist.reduce((melhor, v, i) => (Math.abs(i - pico1) >= 4 && v > (hist[melhor] ?? -1) ? i : melhor), -1);
  const [a1, a2] = [Math.min(pico1, pico2), Math.max(pico1, pico2)];
  const noVale = pico2 < 0 ? doTeal : hist.slice(a1 + 1, a2).reduce((s, v) => s + v, 0);
  const chapada = pico2 >= 0 && doTeal > 0 && noVale / doTeal < 0.05;

  // Sem dois modos não há vale, e o único limiar defensável é a constante — com o
  // aviso de que a varredura ali não mede nada.
  const meio = pico2 >= 0 ? ((a1 + a2) / 2 + 0.5) / BINS : LIMIAR_CLARO;
  const vao = pico2 >= 0 ? (a2 - a1) / BINS : 0;
  const limiares = [meio - vao * VARREDURA_DO_VALE, meio, meio + vao * VARREDURA_DO_VALE];

  const areas = limiares.map((limiar) => {
    let q = 0;
    for (let i = 0; i < n; i++) if (tons[i] > limiar) q++;
    return doTeal ? (100 * q) / doTeal : 0;
  });
  const mediaArea = areas.reduce((a, c) => a + c, 0) / areas.length;
  const instabilidade = mediaArea ? (Math.max(...areas) - Math.min(...areas)) / mediaArea : 0;
  const limiar = meio;

  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (tons[i] > limiar) mask[i] = 1;
  const grupos = conexas(mask, b.w, ate);
  if (!grupos.length) return { denso: [], areas, limiares, instabilidade, chapada, limiar };

  const soAClara = new Uint8Array(n);
  for (const i of grupos[0]) soAClara[i] = 1;
  const borda = bordaOrdenada(soAClara, b.w, ate);
  const denso: { x: number; y: number }[] = [];
  for (let i = 0; i < borda.length; i += 2) {
    denso.push({ x: paraX(m, borda[i].x), y: paraY(m, borda[i].y) });
  }
  return {
    denso: suavizarLaco(denso, Math.max(1, Math.round(denso.length * 0.01))),
    areas,
    limiares,
    instabilidade,
    chapada,
    limiar,
  };
}

/* ------------------------------------------------------------------ */
/* As duas entradas                                                    */
/* ------------------------------------------------------------------ */

const num = (v: number) => Number(v.toFixed(3));

/**
 * SUBIR A FRANJA ATÉ ELA LIBERAR O ROSTO — determinístico, e declarado em voz alta.
 *
 * O gerador não conhece `FOLGA_ROSTO`, e não teria como: são 24 unidades porque a
 * 56 px isso dá 1,9 px de pele entre duas peças pretas, e a sobrancelha inteira tem
 * 0,66 px de espessura ali. A primeira rodada medida reprovou nas duas artes —
 * folga −6,9 e −3,4 —, e a causa é exatamente o que torna a peça humana: os
 * recortes em V descem em direção à testa.
 *
 * **Subir a curva inteira preserva a forma e resolve a folga.** A variação ao longo
 * da franja — os 93 unidades que separam esta peça da reta de 11 unidades que foi
 * reprovada — é diferença entre pontos, e translação não mexe em diferença. O que
 * some é altura absoluta, que é o que estava errado.
 *
 * É o análogo da regra 15 da §7b, um slot acima: *"peça o uniforme FOLGADO, nunca
 * justo — sobra se remove de forma determinística e falta exigiria inventar
 * desenho"*. Franja baixa demais é sobra; franja alta demais exigiria inventar
 * mecha, e isso a régua não faz.
 *
 * A medição dos DOIS lados é o que manda: o `GIRO` deixa a sobrancelha direita 3
 * unidades mais alta, então um levante calculado só pela esquerda deixa a direita
 * reprovando. Por isso o `Math.min`.
 */
function liberarORosto(med: Medida): { med: Medida; levante: number } {
  const antes = folgaDoRosto({ id: "curto", nome: "medido", pontos: med.pontos });
  // Meia unidade a mais que o déficit exato. Subtrair exatamente deixa a folga em
  // 23,999999 e o gate reprova com a mensagem "24.0 contra o piso de 24", que é
  // ilegível — o número impresso passa e o teste não. Meia unidade é 0,04 px a 56.
  const deficit = FOLGA_ROSTO + 0.5 - Math.min(antes.esq, antes.dir);
  if (deficit <= 0) return { med, levante: 0 };

  const sobe = <T extends { t: number; y: number }>(ps: T[]) =>
    ps.map((p) => ({ ...p, y: p.y - deficit }));
  return {
    med: { ...med, pontos: sobe(med.pontos), sombra: sobe(med.sombra) },
    levante: deficit,
  };
}

/**
 * A MEDIDA BRUTA VIRANDO PEÇA — a única montagem, e é dela que todo mundo bebe.
 *
 * `imprimir()` e `.scratch/estilo/fidelidade.ts` precisam da MESMA peça: se a folha
 * de fidelidade compusesse a sua por conta própria, existiriam duas montagens livres
 * para divergir, e o número de fidelidade mediria a divergência entre elas em vez da
 * distância à arte. É a mesma razão pela qual `variantes.ts` publica o SVG já
 * composto em vez de deixar a rota compor de novo.
 */
export function montarPeca(bruta: Medida) {
  const { med, levante } = liberarORosto(bruta);

  /**
   * TODO LÓBULO VAI COM `atras: true`, e isso é oclusão em vez de máscara.
   *
   * A cabeça é opaca e é desenhada por cima: ela come a emenda, que é exatamente o
   * que faz o coque do catálogo parecer preso atrás em vez de colado na testa. O
   * trecho ancorado 25 unidades para dentro do crânio fica escondido de graça, sem
   * clip, sem máscara e sem byte.
   *
   * E é também o que mantém `folgaDoRosto` correta: ela ignora extensão de trás com
   * motivo — peça que a cabeça oculta não invade rosto nenhum.
   */
  const extensoes = med.lobos.map((l) => ({ atras: true, forma: fecharLobo(l, -levante) }));
  const peca = {
    id: "curto" as const,
    nome: "medido",
    pontos: med.pontos,
    sombra: med.sombra,
    extensoes,
  };
  return { peca, med, levante };
}

/* ------------------------------------------------------------------ */
/* A montagem da peça TRAÇADA                                          */
/* ------------------------------------------------------------------ */

interface EscolhaDeN {
  n: number;
  /** O menor desvio que a curva alcança com QUALQUER N da escala. */
  piso: number;
  varredura: { n: number; max: number }[];
}

/**
 * QUANTOS PONTOS ESTA CURVA PRECISA — medido nela, e não herdado da vizinha.
 *
 * O `PONTOS_FINAIS` da régua paramétrica é um número só para todas as curvas, e ele
 * foi medido: 20, o joelho em que o lóbulo da `curto-espetada` encosta no piso. Só
 * que "o joelho daquele lóbulo" não é o joelho de uma cortina nem o de uma calota
 * de doze espículas, e herdar por analogia foi o defeito que aquele mesmo docstring
 * corrigiu quando trocou o 10 antigo.
 *
 * **O piso é da ARTE, não do critério**, e essa é a parte contraintuitiva. Uma
 * parede quase vertical — a ponta de uma espícula, em que a varredura densa cai 60
 * unidades em 1,6 de `x` — não melhora com mais pontos: erro de corda não aproxima
 * vertical gastando ponto em outro lugar. Quando o desvio para de responder a N, o
 * que sobrou é a arte, e insistir só compra bytes.
 *
 * Então o alvo é `max(meio traço, piso × 1,1)`: meio traço quando a curva alcança,
 * e o piso da própria curva quando não alcança. O N escolhido é o **primeiro** que
 * chega lá, e a varredura inteira é impressa para a escolha ser conferível.
 */
function escolherN(denso: { x: number; y: number }[], fechado: boolean): EscolhaDeN {
  const ESCALA = [8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64];
  const varredura = ESCALA.filter((n) => n < denso.length).map((n) => {
    const r = decimarPorCorda(denso, n, { fechado });
    return { n, max: desvioDaCorda(denso, fechado ? [...r, r[0]] : r).max };
  });
  if (!varredura.length) return { n: denso.length, piso: 0, varredura: [] };
  const piso = Math.min(...varredura.map((v) => v.max));
  const alvo = Math.max(MEIO_TRACO, piso * 1.1);
  const escolhido = varredura.find((v) => v.max <= alvo) ?? varredura[varredura.length - 1];
  return { n: escolhido.n, piso, varredura };
}

/**
 * O `k` DA COMPRESSÃO, calculado UMA VEZ para a peça inteira.
 *
 * `TETO_Y` documenta por que o teto existe: sobram 39 unidades acima da cabeça no
 * `viewBox`, e tudo que passar de `y = 0` o viewport corta sem erro e sem aviso — a
 * folha de selo 93ETYY mediu três variantes com uma barra reta de 314 a 341 px na
 * primeira linha, lendo como laje e como topo de boné.
 *
 * Comprimir em vez de cortar preserva a proporção entre pico e vale: um perfil de
 * três tufos continua com três tufos, mais baixos. E o `k` é um só porque a peça é
 * uma: massa e lóbulos saíram da mesma arte, e comprimir cada um pelo próprio pico
 * mudaria a relação entre eles, que é justamente o que a compressão preserva.
 *
 * Só acima de `CAIXA_CABECA.y0`, e só em `y`. A massa lateral cabe no canvas com 68
 * unidades de margem de cada lado contra 39 em cima: encolher os lados junto seria
 * mexer no que está funcionando.
 */
function comprimirNoTeto(pico: number): number {
  const y0 = CAIXA_CABECA.y0;
  return pico < TETO_Y ? (y0 - TETO_Y) / (y0 - pico) : 1;
}

const aplicarK =
  (k: number) =>
  (p: { x: number; y: number }) => ({
    x: p.x,
    y: p.y >= CAIXA_CABECA.y0 ? p.y : CAIXA_CABECA.y0 - (CAIXA_CABECA.y0 - p.y) * k,
  });

/** `x` absoluto vira fração da largura da cabeça NAQUELA altura. */
const paraTY = (p: { x: number; y: number }): PontoFranja => {
  const { esq, dir } = bordasEm(p.y);
  return { t: (p.x - esq) / (dir - esq), y: p.y };
};

/**
 * O LAÇO SE CRUZA? — o risco que a topologia nova trouxe, e que só ela tem.
 *
 * Uma curva ABERTA não pode se auto-intersectar de forma que mude o preenchimento:
 * ela não preenche nada sozinha. Um laço fechado preenche, e o SVG usa `nonzero` por
 * padrão — dois trechos que se cruzam invertem o sentido de giro entre o cruzamento
 * e a ponta, e aquele pedaço sai **vazado**. É um entalhe que ninguém desenhou.
 *
 * O lugar onde isso acontece é previsível e foi medido: a **ponta de uma cortina**.
 * Ali a massa afina até os dois lados quase se encostarem, e a decimação, que remove
 * o ponto de menor custo de corda, come a largura antes de comer o comprimento —
 * sobra um espeto de ida e volta cujos lados se cruzam. Medido na `curto-espetada`:
 * 2 cruzamentos, um em cada cortina, nas duas pontas.
 *
 * Devolve os cruzamentos em coordenada absoluta, para o número virar lugar.
 */
export function autoIntersecoes(pts: readonly { x: number; y: number }[]): { i: number; j: number; onde: string }[] {
  type P = { x: number; y: number };
  const lado = (p: P, q: P, r: P) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const cruza = (a: P, b: P, c: P, d: P) =>
    lado(a, b, c) !== lado(a, b, d) && lado(c, d, a) !== lado(c, d, b);

  const out: { i: number; j: number; onde: string }[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 2; j < pts.length; j++) {
      if (i === 0 && j === pts.length - 1) continue; // vizinhos pelo fechamento
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const c = pts[j];
      const d = pts[(j + 1) % pts.length];
      if (cruza(a, b, c, d)) {
        out.push({ i, j, onde: `(${a.x.toFixed(0)}, ${a.y.toFixed(0)})` });
      }
    }
  }
  return out;
}

/** Um laço `{t, y}` de volta a coordenada absoluta, pela mesma `bordasEm`. */
const paraXY = (q: PontoFranja): { x: number; y: number } => {
  const { esq, dir } = bordasEm(q.y);
  return { x: esq + q.t * (dir - esq), y: q.y };
};

interface Tracado {
  peca: Cabelo;
  massa: Massa;
  clara: Clara;
  /** O `k` aplicado, o pico antes e o pico depois. */
  teto: { k: number; antes: number; depois: number };
  /** Por curva: o N escolhido, o piso e a varredura inteira. */
  n: { massa: EscolhaDeN; clara: EscolhaDeN; lobos: EscolhaDeN[] };
  /**
   * Desvio da decimação, medido DUAS vezes e nunca somado.
   *
   * `original` compara a poligonal reduzida com a varredura densa como ela saiu da
   * arte. `tratada` compara com a mesma varredura já com as transformações
   * DECLARADAS aplicadas — a compressão do teto e a sangria na silhueta.
   *
   * As duas divergem exatamente na medida das transformações, e é por isso que elas
   * não se somam nem se substituem: `tratada` é o erro do CRITÉRIO, e é ele que o
   * limiar de meio traço julga; `original` é a distância à arte crua, e ele inclui
   * de propósito o que a régua moveu por decisão escrita. Misturar os dois faria uma
   * peça bem traçada de arte alta aparecer reprovando por um número que não é dela.
   */
  desvio: { original: number; tratada: number; onde: { x: number; y: number } }[];
  /**
   * AS CURVAS DENSAS, já tratadas e em `{t, y}` — a peça que a decimação ainda não
   * tocou.
   *
   * Ela não é entregável: mil e duzentos pontos de controle não cabem em orçamento
   * nenhum. Ela existe para `avatar:fidelidade --piso` poder separar duas causas que
   * o número ponta a ponta soma: quanto do desvio é a **decimação** e quanto é o
   * **piso** — o boneco do gerador não ser o do `geometria.ts` mais o clip do crânio
   * comer massa que a arte tem. Sem a separação, um limiar reprovando não diz se a
   * resposta é mais pontos ou outra arte.
   */
  denso: { massa: PontoFranja[]; clara: PontoFranja[] };
  /** Cruzamentos do laço entregue, por curva. Zero é a exigência. */
  cruzamentos: { massa: ReturnType<typeof autoIntersecoes>; clara: ReturnType<typeof autoIntersecoes> };
  /** Quantos pontos da clara precisaram ser projetados para dentro da massa. */
  projetados: number;
  /** Quantos pontos da massa sangraram para fora da silhueta. */
  sangrados: number;
  /**
   * Desses, quantos o teto de `alcanceNoLaco()` impediu de andar a sangria inteira.
   *
   * Zero é o caso normal. Diferente de zero é um FATO DA ARTE, e não um defeito da
   * régua: a peça tem uma língua mais estreita que duas sangrias, e ali a escolha é
   * entre a fresta e o entalhe. A régua escolhe a fresta — ela é meio pixel de
   * antialiasing; o entalhe é a cortina inteira sumindo — e diz que escolheu.
   */
  travados: number;
  /** A folga que a ARTE tem, sem levante nenhum. */
  folga: { esq: number; dir: number };
  /** % de colunas com uma segunda corrida — a cortina, agora representável. */
  cortina: number;
  lobos: Lobo[];
  descartados: number;
  /** De onde veio o booleano. Impresso sempre — um par PNG/SVG trocado aparece aqui. */
  fonte: Segmentacao["fonte"];
  laudo: string[];
}

/**
 * A ARTE VIRANDO PEÇA TRAÇADA — e o que esta função **não** faz é metade dela.
 *
 * Ela não sobe a franja. `liberarORosto` existe na régua paramétrica porque o
 * gerador não conhece `FOLGA_ROSTO`, e subir a curva inteira resolvia a folga sem
 * mexer na forma. Só que translação determinística ainda é a régua decidindo o
 * enquadramento da arte por conta própria — no `curto-espetada` ela subiu a peça
 * 43,5 unidades, e o que apareceu na folha foi uma **faixa de testa nua** que não
 * existe no PNG.
 *
 * A decisão do plano é que fidelidade manda: a folga da arte é **medida e impressa**
 * por sobrancelha, e um valor abaixo de `FOLGA_ROSTO` vira aviso e item para o olho
 * do Doug — não um levante silencioso. Amarra que briga com a arte se re-ancora na
 * arte; ela não move a arte para caber nela.
 */
function tracar(seg: Segmentacao, m: Mapa, aImagem: Ancoras): Tracado {
  const b = seg.bmp;
  const massa = medirMassa(seg, m, aImagem.yPescoco);
  const clara = medirClara(seg, m, aImagem.yPescoco);
  const perfilDaArte = perfil(seg, aImagem.yPescoco);
  const todos = lobos(seg, m, aImagem.yPescoco);
  const usados = todos.slice(0, MAX_LOBOS);

  const picos = [
    ...massa.denso.map((p) => p.y),
    ...usados.flatMap((l) => l.externo.map((p) => p.y)),
  ];
  const antes = picos.length ? Math.min(...picos) : CAIXA_CABECA.y0;
  const k = comprimirNoTeto(antes);
  const mover = aplicarK(k);

  // A sangria vem DEPOIS da compressão: comprimir move os pontos altos, e um ponto
  // que já tivesse sangrado sangraria de um lugar que a compressão ia mudar.
  const sangria = sangrarNaSilhueta(massa.denso.map(mover));
  const massaC = sangria.pts;
  const claraC = clara.denso.map(mover);

  const nMassa = escolherN(massaC, true);
  const nClara = claraC.length ? escolherN(claraC, true) : { n: 0, piso: 0, varredura: [] };
  const nLobos = usados.map((l) => escolherN(l.denso, false));

  const massaFina = decimarPorCorda(massaC, nMassa.n, { fechado: true });
  const claraFina = claraC.length ? decimarPorCorda(claraC, nClara.n, { fechado: true }) : [];

  /**
   * A CONTENÇÃO É CORRIGIDA AQUI, E O AJUSTE É IMPRESSO.
   *
   * A clara nasce de uma posterização e a massa de uma linha de centro: as duas
   * saíram da mesma arte por caminhos diferentes, então um ponto da clara pode cair
   * meio pixel fora da massa por ruído de amostragem, sem que nada esteja errado.
   * Projetar `PROJECAO` unidades para dentro resolve esse caso.
   *
   * O que ele **não** resolve, e por isso a contagem sai impressa: um ponto que
   * precise andar dezenas de unidades não é ruído — é a região clara medida no
   * lugar errado, e corrigir isso calado entregaria uma peça plausível e errada.
   * `contencaoDaClara` diz quanto, e não só se.
   */
  let projetados = 0;
  const claraContida = claraFina.map((p) => {
    if (!massaFina.length) return p;
    let melhor = { x: p.x, y: p.y };
    let dist = Infinity;
    let dentro = false;
    for (let i = 0, j = massaFina.length - 1; i < massaFina.length; j = i++) {
      const a = massaFina[i];
      const c = massaFina[j];
      if (a.y > p.y !== c.y > p.y) {
        const x = a.x + ((p.y - a.y) * (c.x - a.x)) / (c.y - a.y);
        if (p.x < x) dentro = !dentro;
      }
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
      const q = { x: a.x + t * dx, y: a.y + t * dy };
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < dist) {
        dist = d;
        melhor = q;
      }
    }
    if (dentro) return p;
    projetados++;
    const comp = Math.hypot(melhor.x - p.x, melhor.y - p.y) || 1;
    return {
      x: melhor.x + ((melhor.x - p.x) / comp) * PROJECAO,
      y: melhor.y + ((melhor.y - p.y) / comp) * PROJECAO,
    };
  });

  // O N escolhido por curva TEM de chegar ao lóbulo. `lobos()` reduz o lado externo
  // com `PONTOS_EXTERNOS()`, que é o número da régua paramétrica: deixá-lo passar
  // faria a varredura de N ser impressa e ignorada — pior que não tê-la.
  const lobosFinos = usados.map((l, i) => ({
    ...l,
    externo: decimarPorCorda(l.denso, nLobos[i].n, { fechado: false }),
  }));

  const peca: Cabelo = {
    id: "curto",
    nome: "traçado",
    massa: massaFina.map(paraTY),
    ...(claraContida.length ? { clara: claraContida.map(paraTY) } : {}),
    ...(lobosFinos.length
      ? { extensoes: lobosFinos.map((l) => ({ atras: true, forma: fecharLobo(l, 0, k) })) }
      : {}),
  };

  const desvio = [
    { crua: massa.denso, tratada: massaC, reduzido: massaFina, fechado: true },
    ...(claraC.length
      ? [{ crua: clara.denso, tratada: claraC, reduzido: claraContida, fechado: true }]
      : []),
    // O lóbulo é comparado com a própria curva já comprimida dos dois lados: aqui
    // `mover` é a única transformação, e aplicá-la só de um lado contaria a
    // compressão como erro do critério.
    ...lobosFinos.map((l) => ({
      crua: l.denso,
      tratada: l.denso.map(mover),
      reduzido: l.externo.map(mover),
      fechado: false,
    })),
  ].map((c) => {
    const fecha = (v: { x: number; y: number }[]) => (c.fechado ? [...v, v[0]] : v);
    const alvo = fecha(c.reduzido);
    // ONDE está o pior desvio, e não só quanto. Um número alto tem duas causas
    // opostas — a curva tem detalhe demais para o N, ou o laço tem um tentáculo que
    // não devia existir — e só a coordenada distingue as duas.
    let onde = { x: 0, y: 0 };
    let pior = -1;
    for (const p of c.tratada) {
      const d = desvioDaCorda([p], alvo).max;
      if (d > pior) {
        pior = d;
        onde = p;
      }
    }
    return {
      original: desvioDaCorda(c.crua, alvo).max,
      tratada: desvioDaCorda(c.tratada, alvo).max,
      onde,
    };
  });

  return {
    peca,
    massa,
    clara,
    teto: { k, antes, depois: antes >= CAIXA_CABECA.y0 ? antes : CAIXA_CABECA.y0 - (CAIXA_CABECA.y0 - antes) * k },
    n: { massa: nMassa, clara: nClara, lobos: nLobos },
    desvio,
    denso: { massa: massaC.map(paraTY), clara: claraC.map(paraTY) },
    // Medido no laço ENTREGUE e em coordenada absoluta: é ali que o `nonzero` do
    // SVG resolve o preenchimento, e é ali que o entalhe aparece.
    cruzamentos: {
      massa: autoIntersecoes((peca.massa ?? []).map(paraXY)),
      clara: autoIntersecoes((peca.clara ?? []).map(paraXY)),
    },
    projetados,
    sangrados: sangria.quantos,
    travados: sangria.travados,
    folga: folgaDoRosto(peca),
    cortina: (100 * perfilDaArte.colunasComExtensao) / b.w,
    lobos: lobosFinos,
    descartados: Math.max(0, todos.length - MAX_LOBOS),
    fonte: seg.fonte,
    laudo: seg.laudo,
  };
}

function imprimirTracado(id: string, t: Tracado) {
  const p = t.peca;
  console.log(`\n// ${id} — traçado (massa como laço fechado, linha de centro do preto)`);
  // A fonte NUNCA sai calada: um par PNG/SVG trocado é o risco 4 do plano, e o laudo
  // com caminho e mtime é a primeira coisa que o pega.
  console.log(`// fonte: ${t.fonte === "path" ? "SVG (família de path)" : "PNG (matiz)"}`);
  for (const l of t.laudo) console.log(`//   ${l.replace(/\n/g, "\n//   ")}`);
  console.log(`// folga da arte sobre as sobrancelhas: esq ${t.folga.esq.toFixed(1)} · dir ${t.folga.dir.toFixed(1)}`);
  if (t.teto.k < 1) {
    console.log(
      `// comprimido k=${t.teto.k.toFixed(4)} acima de y=${CAIXA_CABECA.y0.toFixed(1)}: ` +
        `pico ${t.teto.antes.toFixed(1)} → ${t.teto.depois.toFixed(1)}`,
    );
  }
  console.log(`massa: [`);
  for (const q of p.massa ?? []) console.log(`  { t: ${num(q.t)}, y: ${num(q.y)} },`);
  console.log(`],`);
  if (p.clara?.length) {
    console.log(`clara: [`);
    for (const q of p.clara) console.log(`  { t: ${num(q.t)}, y: ${num(q.y)} },`);
    console.log(`],`);
  }
  if (p.extensoes?.length) {
    console.log(`extensoes: [`);
    for (const [i, e] of p.extensoes.entries()) {
      const l = t.lobos[i];
      console.log(
        `  // ${l.deitado ? "coroa" : "têmpora"} · ancora para ${l.sentido} · ` +
          `${(l.area * 100).toFixed(2)}% do quadro`,
      );
      console.log(`  { atras: true, forma: [`);
      for (const q of e.forma) console.log(`    { x: ${num(q.x)}, y: ${num(q.y)} },`);
      console.log(`  ] },`);
    }
    console.log(`],`);
  }

  const c = t.massa.conferencia;
  const meia = c.espessura.mediana / 2;
  // A janela acompanha a espessura MEDIDA. O traço da arte gerada não é `TRACO`, e
  // comparar com 6 quando a arte tem 2 reprovaria uma medição perfeita.
  const janela = [Math.max(0.5, meia - 2), meia + 2] as const;
  const foraDaJanela = c.mediana < janela[0] || c.mediana > janela[1];
  console.log(
    `\nespessura do traço DA ARTE (o compositor desenha com TRACO = ${TRACO}, constante):` +
      `\n  p10 ${c.espessura.p10.toFixed(1)} u · mediana ${c.espessura.mediana.toFixed(1)} u · ` +
      `p90 ${c.espessura.p90.toFixed(1)} u` +
      (Math.abs(c.espessura.mediana - TRACO) > 2
        ? `   ← desvio aceito e declarado: o estilo tem UMA espessura`
        : ""),
  );
  console.log(
    `conferência cruzada — borda do teal × linha de centro do preto ` +
      `(esperado ≈ metade do traço medido = ${meia.toFixed(1)}, janela ` +
      `[${janela[0].toFixed(1)}, ${janela[1].toFixed(1)}]):`,
  );
  console.log(
    `  p10 ${c.p10.toFixed(1)} u · mediana ${c.mediana.toFixed(1)} u · p90 ${c.p90.toFixed(1)} u` +
      (foraDaJanela ? "   ✗ FORA DA JANELA — a máscara ou a normal estão erradas" : ""),
  );
  if (c.semContorno) {
    console.log(`  ${c.semContorno} ponto(s) sem preto na normal — caíram meio traço para dentro`);
  }
  for (const f of t.massa.furos) console.log(`  furo interno de ${f.toFixed(2)}% da massa — engolido pelo laço externo`);
  for (const i of t.massa.ilhas) console.log(`  ⚠ ilha de teal solta, ${i.toFixed(2)}% da massa — NÃO entrou na peça`);

  if (t.sangrados) {
    console.log(
      `  ${t.sangrados} ponto(s) da massa a menos de meio traço do contorno — ` +
        `empurrados até ${SANGRIA} u para fora, para o clip cortar em vez de encostar`,
    );
    if (t.travados) {
      console.log(
        `  desses, ${t.travados} travado(s) pelo alcance do laço: a mecha ali é mais estreita ` +
          `que duas sangrias, e andar tudo dobraria o laço em vez de fechar a fresta`,
      );
    }
  }

  console.log(
    `\nposterização da clara — limiares ${t.clara.limiares.map((l) => l.toFixed(3)).join(" / ")} ` +
      `(o do meio é o fundo do vale entre os dois modos):` +
      `\n  áreas ${t.clara.areas.map((a) => `${a.toFixed(1)}%`).join(" · ")} · instabilidade ` +
      `${(100 * t.clara.instabilidade).toFixed(1)}%` +
      (t.clara.instabilidade > ESTABILIDADE
        ? `   ✗ acima de ${100 * ESTABILIDADE}% — a fronteira anda dentro do próprio vale`
        : ""),
  );
  if (t.clara.chapada) {
    console.log(`  arte JÁ CHAPADA: o vale entre os dois modos está vazio, não há rampa a posterizar`);
  }
  if (t.projetados) {
    console.log(`  ${t.projetados} ponto(s) da clara projetado(s) ${PROJECAO} u para dentro da massa`);
  }
  console.log(`  contenção da clara: ${contencaoDaClara(t.peca).toFixed(2)} u (piso 0)`);
  console.log(`  cobertura da coroa: ${((coberturaDaCoroa(t.peca) ?? 0) * 100).toFixed(1)}% (exigido 100)`);

  for (const [nome, xs] of [
    ["massa", t.cruzamentos.massa],
    ["clara", t.cruzamentos.clara],
  ] as const) {
    if (!xs.length) continue;
    console.log(
      `  ✗ ${nome}: ${xs.length} auto-interseção(ões) — o \`nonzero\` do SVG VAZA o trecho\n` +
        `    entre o cruzamento e a ponta, e sai um entalhe que ninguém desenhou:`,
    );
    for (const x of xs) console.log(`      segmentos ${x.i} e ${x.j}, perto de ${x.onde}`);
  }

  const caixa = t.massa.denso.reduce(
    (a, p) => ({ x0: Math.min(a.x0, p.x), x1: Math.max(a.x1, p.x), y0: Math.min(a.y0, p.y), y1: Math.max(a.y1, p.y) }),
    { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
  );
  const perimetro = t.massa.denso.reduce(
    (s, p, i, v) => s + (i ? Math.hypot(p.x - v[i - 1].x, p.y - v[i - 1].y) : 0),
    0,
  );
  console.log(
    `\nlaço denso da massa: ${t.massa.denso.length} pontos · perímetro ${perimetro.toFixed(0)} u · ` +
      `caixa x ${caixa.x0.toFixed(0)}–${caixa.x1.toFixed(0)} y ${caixa.y0.toFixed(0)}–${caixa.y1.toFixed(0)}`,
  );

  const nomes = ["massa", ...(t.peca.clara?.length ? ["clara"] : []), ...t.lobos.map((_, i) => `lóbulo ${i + 1}`)];
  const escolhas = [t.n.massa, ...(t.peca.clara?.length ? [t.n.clara] : []), ...t.n.lobos];
  console.log(`\nN por curva (limiar meio traço = ${MEIO_TRACO}; alvo = max(meio traço, piso × 1,1)):`);
  escolhas.forEach((e, i) => {
    const d = t.desvio[i];
    console.log(
      `  ${nomes[i].padEnd(9)} N=${String(e.n).padStart(2)} · piso da arte ${e.piso.toFixed(1)} u · ` +
        `desvio vs arte crua ${d.original.toFixed(1)} u · vs tratada ${d.tratada.toFixed(1)} u ` +
        `@ (${d.onde.x.toFixed(0)}, ${d.onde.y.toFixed(0)})` +
        (d.tratada > MEIO_TRACO && d.tratada > e.piso * 1.1 ? "   ✗" : ""),
    );
    console.log(`    varredura: ${e.varredura.map((v) => `${v.n}:${v.max.toFixed(1)}`).join("  ")}`);
  });

  console.log(
    `\ncortina (colunas com uma 2ª corrida de cabelo): ${t.cortina.toFixed(1)}% — ` +
      `agora representável, porque a massa é um laço fechado`,
  );
  const anc = ancoragemDasExtensoes(t.peca);
  if (anc.length) {
    console.log(
      `ancoragem de cada lóbulo (piso SANGRIA = ${SANGRIA}): ` +
        anc.map((a) => `${a.toFixed(1)}${a < SANGRIA ? " ✗" : ""}`).join(" · "),
    );
  }
  if (t.descartados) {
    console.log(`⚠ ${t.descartados} lóbulo(s) DESCARTADO(s) pelo orçamento — ver MAX_LOBOS`);
  }
  if (Math.min(t.folga.esq, t.folga.dir) < FOLGA_ROSTO) {
    console.log(
      `\n⚠ a ARTE deixa ${Math.min(t.folga.esq, t.folga.dir).toFixed(1)} u de testa = ` +
        `${(Math.min(t.folga.esq, t.folga.dir) / 12.5).toFixed(2)} px a 56.\n` +
        `  Na peça TRAÇADA o piso não é ${FOLGA_ROSTO}: é a folga DA ARTE, e quem gateia é\n` +
        `  \`avatar:fidelidade\` (gate 3), que exige folga do traço ≥ folga da arte − meio traço.\n` +
        `  A régua NÃO sobe a peça: subir foi o que produziu a faixa de testa nua da rodada\n` +
        `  HSHC93. O número absoluto abaixo de ${FOLGA_ROSTO} é legibilidade a 56 px — franja e\n` +
        `  sobrancelha encostando por antialiasing —, e trocar a arte é item (f), o olho do Doug.`,
    );
  }

  const menorPeriodo = (() => {
    const q = t.peca.massa ?? [];
    let menor = Infinity;
    for (let i = 1; i < q.length; i++) {
      const a = bordasEm(q[i - 1].y);
      const c = bordasEm(q[i].y);
      const dx = (c.esq + q[i].t * (c.dir - c.esq)) - (a.esq + q[i - 1].t * (a.dir - a.esq));
      menor = Math.min(menor, Math.hypot(dx, q[i].y - q[i - 1].y));
    }
    return menor;
  })();
  console.log(
    `menor período de recorte: ${menorPeriodo.toFixed(1)} u = ${(menorPeriodo / 12.5).toFixed(2)} px a 56` +
      (menorPeriodo / 12.5 < 1 ? "   ⚠ abaixo de 1 px: some no tamanho do ranking" : ""),
  );
}

function imprimir(id: string, bruta: Medida) {
  const { peca, med, levante } = montarPeca(bruta);
  const extensoes = peca.extensoes;
  const f = folgaDoRosto(peca);

  console.log(`\n// medido de ${id}`);
  if (levante > 0) {
    console.log(
      `// franja subida ${levante.toFixed(1)} u para liberar o rosto ` +
        `(FOLGA_ROSTO = ${FOLGA_ROSTO})`
    );
  }
  console.log(`pontos: [`);
  for (const p of med.pontos) console.log(`  { t: ${num(p.t)}, y: ${num(p.y)} },`);
  console.log(`],`);
  console.log(`sombra: [`);
  for (const p of med.sombra) console.log(`  { t: ${num(p.t)}, y: ${num(p.y)} },`);
  console.log(`],`);
  if (extensoes.length) {
    console.log(`extensoes: [`);
    for (const [i, e] of extensoes.entries()) {
      const l = med.lobos[i];
      console.log(
        `  // ${l.deitado ? "coroa" : "têmpora"} · ancora para ${l.sentido} · ` +
          `${(l.area * 100).toFixed(2)}% do quadro`
      );
      console.log(`  { atras: true, forma: [`);
      for (const p of e.forma) console.log(`    { x: ${num(p.x)}, y: ${num(p.y)} },`);
      console.log(`  ] },`);
    }
    console.log(`],`);
  }
  console.log(`\nfolga do rosto — esq ${f.esq.toFixed(1)} · dir ${f.dir.toFixed(1)}`);

  // A ancoragem é o número que fecha o bloco: sem ela a extensão lê como adesivo
  // colado ao lado da cabeça, e é o que `avatar:variantes` reprova.
  const anc = ancoragemDasExtensoes(peca);
  if (anc.length) {
    console.log(
      `ancoragem de cada lóbulo (piso SANGRIA = ${SANGRIA}): ` +
        anc.map((a) => `${a.toFixed(1)}${a < SANGRIA ? " ✗" : ""}`).join(" · ")
    );
  } else {
    console.log(`SEM lóbulo: toda a massa cabe dentro do crânio, e o clip a devolve inteira`);
  }
  if (med.descartados > 0) {
    console.log(
      `⚠ ${med.descartados} lóbulo(s) DESCARTADO(s) pelo orçamento — ficaram os ` +
        `${MAX_LOBOS} de maior área. Ver MAX_LOBOS.`
    );
  }
  const ys = med.pontos.map((p) => p.y);
  console.log(
    `variação da franja: ${(Math.max(...ys) - Math.min(...ys)).toFixed(0)} unidades ` +
      `(o \`curto\` de hoje tem 11 — é a "reta" que foi reprovada)`
  );

  // O CUSTO DA REDUÇÃO — o número que faltava, e o que escolhe N (Bloco III).
  const d = med.desvio;
  const marca = (v: number) => (v <= MEIO_TRACO ? "" : "   ✗ acima de meio traço");
  console.log(
    `\ndesvio contra a varredura densa (critério ${CRITERIO()} · ` +
      `franja/sombra ${PONTOS_FINAIS()} pts · lóbulo ${PONTOS_EXTERNOS()} pts · ` +
      `limiar meio traço = ${MEIO_TRACO}):`
  );
  console.log(
    `  franja   máx ${d.franja.max.toFixed(1)} u   médio ${d.franja.medio.toFixed(1)} u` +
      marca(d.franja.max)
  );
  console.log(
    `  sombra   máx ${d.sombra.max.toFixed(1)} u   médio ${d.sombra.medio.toFixed(1)} u` +
      marca(d.sombra.max)
  );
  d.lobos.forEach((l, i) =>
    console.log(
      `  lóbulo ${i + 1} máx ${l.max.toFixed(1)} u   médio ${l.medio.toFixed(1)} u` + marca(l.max)
    )
  );
  console.log(
    `\nexpansão sobre a caixa da cabeça — lateral ${med.expansaoLateral.toFixed(1)}% · ` +
      `vertical ${med.expansaoVertical.toFixed(1)}%\n` +
      `massa separada da touca (mecha lateral / coque): ` +
      `${med.colunasComExtensao.toFixed(1)}% das colunas`
  );

  /**
   * A CORTINA LATERAL NÃO CABE NO MODELO DE DADOS, E O AVISO É EM VOZ ALTA.
   *
   * `Cabelo` tem três lugares para pôr massa: `pontos` (a franja, clipada pelo
   * crânio), `sombra` (a fronteira entre os dois tons) e `extensoes` (o que passa da
   * silhueta). A mecha que desce **ao lado do rosto, por dentro da silhueta** não
   * entra em nenhum: `lobos()` só recolhe o que passa do crânio, e `perfil()` toma a
   * PRIMEIRA corrida por coluna, que é a touca — a segunda corrida, que é a cortina,
   * é justamente o que ele foi corrigido para NÃO confundir com a franja.
   *
   * Medido no `curto-espetada`, é ela que segura o desvio de borda em ~220 unidades
   * nas três configurações do bloco: o número não responde a critério nem a N porque
   * não é decimação. Corte silencioso lê como cobertura completa — regra §7.0 do
   * runbook —, então quando houver cortina, ela é impressa.
   */
  if (med.colunasComExtensao > 5) {
    console.log(
      `\n⚠ ${med.colunasComExtensao.toFixed(1)}% das colunas têm uma SEGUNDA corrida de\n` +
        `  cabelo — mecha descendo ao lado do rosto, por dentro da silhueta. O modelo de\n` +
        `  dados não tem onde guardá-la: não é franja (é a 2ª corrida) e não é extensão\n` +
        `  (não passa do crânio). Ela some no traço, e nenhum N a traz de volta.`
    );
  }
}

/** O SVG de referência do enquadramento: a base CARECA, que o cabelo não altera. */
export async function ancorasDoViewBox(): Promise<{ img: Ancoras; vb: Ancoras }> {
  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, ns: "ref" });
  const bmp = await rasterizar(svg, ALTURA);
  const a = ancoras(bmp);
  // O mesmo raster, agora lido em unidades: a altura do raster é conhecida, então a
  // conversão é exata e não depende de nenhuma outra medida.
  const k = VIEWBOX.h / bmp.h;
  return {
    img: a,
    vb: { yPescoco: a.yPescoco * k, yBase: a.yBase * k, eixo: a.eixo * k },
  };
}

async function idaEVolta() {
  const { vb } = await ancorasDoViewBox();

  const svg = compor({
    pele: PELE[1],
    cabelo: CABELO_TEAL,
    modeloCabelo: "curto",
    ns: "iv",
  });
  const bmp = await rasterizar(svg, ALTURA);
  writeFileSync(".scratch/estilo/ida-e-volta.svg", svg);

  const aImg = ancoras(bmp);
  const med = medirFranja(segmentarPorMatiz(bmp), mapa(aImg, vb), aImg);

  const esperado = CABELOS.curto.pontos!;
  console.log("IDA E VOLTA — o `curto` de hoje, renderizado em teal e medido de volta");
  console.log(`raster ${bmp.w}x${bmp.h} · pescoço ${aImg.yPescoco}px · base ${aImg.yBase}px`);

  console.log("\n  t esperado → t medido        (só nos t dentro da silhueta)");
  let pior = 0;
  for (const alvo of esperado) {
    if (alvo.t < 0 || alvo.t > 1) continue; // as pontas caem fora e o clip as come
    const perto = med.pontos.reduce((a, p) =>
      Math.abs(p.t - alvo.t) < Math.abs(a.t - alvo.t) ? p : a
    );
    const erro = Math.abs(perto.y - alvo.y);
    pior = Math.max(pior, erro);
    console.log(
      `  t ${alvo.t.toFixed(2)}  y ${String(alvo.y).padStart(5)} → ` +
        `t ${perto.t.toFixed(2)}  y ${perto.y.toFixed(1)}   erro ${erro.toFixed(1)} u`
    );
  }
  console.log(`\n  pior erro em y: ${pior.toFixed(1)} unidades (${(pior / 12.5).toFixed(2)} px a 56)`);
  console.log(
    `  expansão medida: lateral ${med.expansaoLateral.toFixed(1)}% · ` +
      `vertical ${med.expansaoVertical.toFixed(1)}%  ← o curto de hoje não tem volume`
  );
  // A extração de lóbulos tem de devolver ZERO aqui, e o zero é a prova pelo lado
  // de fora: o `curto` de hoje não tem um pixel fora do crânio, e uma régua que
  // inventasse lóbulo para ele inventaria para qualquer um.
  console.log(
    `  lóbulos fora do crânio: ${med.lobos.length}` +
      (med.lobos.length ? "  ← ERRADO: o curto de hoje é todo dentro da silhueta" : "")
  );
}

/**
 * A IDA E VOLTA DA RÉGUA TRAÇADA — quatro números, e nenhum depende de gerador.
 *
 * O `curto` de hoje é renderizado com o cabelo em teal e traçado de volta. Ele é o
 * caso mais simples que existe — uma touca sem cortina, sem volume, sem lóbulo — e é
 * justamente por isso que ele serve de regressão: **a régua tem de devolver
 * exatamente isso**, e não a ideia que ela tem de um cabelo.
 *
 * Os quatro:
 *
 *  1. **desvio ≤ meio traço por curva** — a decimação não pode custar mais que a
 *     espessura da linha que ela descreve;
 *  2. **zero lóbulos** — o `curto` não tem um pixel fora do crânio, e uma régua que
 *     inventasse volume para ele inventaria para qualquer um;
 *  3. **zero colunas de cortina** — ele não tem segunda corrida em coluna nenhuma.
 *     Este é o número que a régua nova acrescenta: se ela vê cortina onde não há,
 *     ela veria cortina em toda arte, e a peça sairia com uma mecha imaginária;
 *  4. **contenção ≥ 0** — a região clara medida não escapa da massa medida.
 *
 * Sai com código 1 quando qualquer um falha. `--ida-e-volta` (a paramétrica)
 * continua ao lado, e os 0,2 / 0,7 u dela não podem piorar.
 */
async function idaEVoltaMassa(): Promise<number> {
  const { vb } = await ancorasDoViewBox();
  const svg = compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: "curto", ns: "ivm" });
  const bmp = await rasterizar(svg, ALTURA);
  const aImg = ancoras(bmp);
  const t = tracar(segmentarPorMatiz(bmp), mapa(aImg, vb), aImg);

  console.log("IDA E VOLTA DA MASSA — o `curto` de hoje, renderizado em teal e traçado de volta");
  console.log(`raster ${bmp.w}x${bmp.h} · pescoço ${aImg.yPescoco}px · base ${aImg.yBase}px`);
  imprimirTracado("ida-e-volta", t);

  const piorDesvio = Math.max(...t.desvio.map((d) => d.tratada));
  const contencao = contencaoDaClara(t.peca);
  const falhas: string[] = [];
  if (piorDesvio > MEIO_TRACO) falhas.push(`desvio ${piorDesvio.toFixed(1)} u acima de meio traço`);
  if (t.lobos.length) falhas.push(`${t.lobos.length} lóbulo(s) inventado(s) — o curto é todo dentro do crânio`);
  if (t.cortina > 0) falhas.push(`${t.cortina.toFixed(1)}% de colunas com cortina — o curto não tem`);
  if (contencao < 0) falhas.push(`contenção da clara ${contencao.toFixed(2)} u`);
  const cruzou = t.cruzamentos.massa.length + t.cruzamentos.clara.length;
  if (cruzou) falhas.push(`${cruzou} auto-interseção(ões) no laço entregue`);

  console.log("\n— os cinco números da regressão —");
  console.log(`  pior desvio por curva ... ${piorDesvio.toFixed(1)} u   (piso meio traço = ${MEIO_TRACO})`);
  console.log(`  lóbulos ................. ${t.lobos.length}   (exigido 0)`);
  console.log(`  colunas de cortina ...... ${t.cortina.toFixed(1)}%   (exigido 0)`);
  console.log(`  contenção da clara ...... ${contencao.toFixed(2)} u   (piso 0)`);
  console.log(`  auto-interseções ........ ${cruzou}   (exigido 0)`);
  if (falhas.length) {
    console.log(`\n✗ ${falhas.length} reprovação(ões):`);
    for (const f of falhas) console.log(`  · ${f}`);
    return 1;
  }
  console.log("\n✓ a régua traçada devolve o `curto` que ela mesma acabou de ver");
  return 0;
}

/**
 * O QUE A RÉGUA ESTÁ VENDO — histograma de matiz e os âncoras, sem interpretação.
 *
 * Existe porque a primeira rodada devolveu zero pontos e a pergunta "por quê?" tem
 * três respostas possíveis (a cor não saiu, o matiz está fora da janela, o âncora
 * está errado) que só se distinguem olhando o número cru.
 */
async function diagnosticar(caminho?: string) {
  const bmp = caminho
    ? await cru(caminho)
    : await rasterizar(
        compor({ pele: PELE[1], cabelo: CABELO_TEAL, modeloCabelo: "curto", ns: "d" }),
        ALTURA
      );
  const e = enquadramento(bmp);
  console.log(`raster ${bmp.w}x${bmp.h} canais=${bmp.canais}`);
  console.log(
    `utilY0=${e.utilY0} utilY1=${e.utilY1} altura=${e.alturaUtilPx} ` +
      `fator=${e.fator.toFixed(4)} yCorte=${e.yCorte} eixo=${e.eixoTroncoPx}`
  );

  const cont = new Map<number, number>();
  let teal = 0;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let y = 0; y < bmp.h; y++) {
    for (let x = 0; x < bmp.w; x++) {
      const i = (y * bmp.w + x) * bmp.canais;
      const { h, s } = hsl(bmp.data[i], bmp.data[i + 1], bmp.data[i + 2]);
      if (h < 0 || s <= 0.25) continue;
      const bucket = Math.floor(h / 30) * 30;
      cont.set(bucket, (cont.get(bucket) ?? 0) + 1);
      if (h >= MATIZ[0] && h <= MATIZ[1]) {
        teal++;
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
      }
    }
  }
  console.log("\nmatiz (bucket de 30°) → pixels com s > 0.25:");
  [...cont.entries()]
    .sort((a, c) => c[1] - a[1])
    .slice(0, 8)
    .forEach(([k, v]) => console.log(`  ${String(k).padStart(3)}°  ${v}`));
  console.log(`\npixels na janela [${MATIZ[0]},${MATIZ[1]}]: ${teal}`);
  if (teal) console.log(`  y de ${yMin} a ${yMax}`);
}

/**
 * MEDIR UM PNG E DEVOLVER A PEÇA — a entrada de biblioteca, sem imprimir nada.
 *
 * O `fidelidade.ts` chama esta, e não a `main()`: ele precisa do objeto, do `levante`
 * (para descontar a translação deliberada antes de comparar formas) e do bitmap de
 * origem, que ele torna a segmentar com a MESMA `amostrar()`.
 */
export async function medirArquivo(caminho: string) {
  const { vb } = await ancorasDoViewBox();
  const bmp = await cru(caminho);
  const aImg = ancoras(bmp);
  const m = mapa(aImg, vb);
  const bruta = medirFranja(segmentarPorMatiz(bmp), m, aImg);
  return { ...montarPeca(bruta), bmp, mapa: m, ancoras: aImg };
}

/** A altura de raster da fonte SVG. O dobro do PNG do gerador, que é 1024. */
export const ALTURA_SVG = 2048;

/**
 * A SEGMENTAÇÃO DE UM ARQUIVO, escolhendo a fonte — e `auto` imprime qual escolheu.
 *
 * `auto` procura o mesmo nome de base com `.svg` ao lado do PNG. A escolha nunca é
 * silenciosa: um par trocado (o SVG de uma arte ao lado do PNG de outra) é o risco 4
 * do plano, e quem o pega é o laudo impresso mais a conferência de fonte.
 */
export async function segmentarArquivo(
  caminho: string,
  fonte: "png" | "svg" | "auto" = "auto",
): Promise<Segmentacao> {
  const { mascarasDoSvg } = await import("./fonte-svg");
  const svgIrmao = caminho.replace(/\.png$/i, ".svg");
  const querSvg =
    fonte === "svg" || (fonte === "auto" && /\.svg$/i.test(caminho)) ||
    (fonte === "auto" && svgIrmao !== caminho && existsSync(svgIrmao));

  if (!querSvg) {
    if (/\.svg$/i.test(caminho)) {
      throw new Error(`--fonte png com um arquivo .svg (${caminho}): a régua de matiz lê pixel de PNG.`);
    }
    const bmp = await cru(caminho);
    return segmentarPorMatiz(bmp, [`fonte de MATIZ · ${caminho} · ${statSync(caminho).mtime.toISOString()}`]);
  }

  const alvo = /\.svg$/i.test(caminho) ? caminho : svgIrmao;
  const pngIrmao = alvo.replace(/\.svg$/i, ".png");
  if (!existsSync(pngIrmao)) {
    throw new Error(
      `${alvo}: a fonte de path precisa do PNG irmão (${pngIrmao}) para o enquadramento.\n` +
        `O conversor não traça contorno — ver o campo \`ancoras\` de \`Segmentacao\`.`,
    );
  }
  const m = await mascarasDoSvg(alvo, ALTURA_SVG);
  const bmpPng = await cru(pngIrmao);
  const aPng = ancoras(bmpPng);
  // Exata: as duas imagens são o mesmo `viewBox` e as duas alturas são conhecidas.
  const escala = m.h / bmpPng.h;
  const em = (mask: Uint8Array) => (x: number, y: number) =>
    x >= 0 && y >= 0 && x < m.w && y < m.h && mask[y * m.w + x] === 1;
  return {
    bmp: m.bmp,
    cabelo: em(m.cabelo),
    claro: em(m.claro),
    escuro: em(m.escuro),
    ancoras: {
      yPescoco: aPng.yPescoco * escala,
      yBase: aPng.yBase * escala,
      eixo: aPng.eixo * escala,
    },
    fonte: "path",
    laudo: [
      ...m.laudo.linhas,
      `enquadramento do PNG irmão · ${pngIrmao} · ${statSync(pngIrmao).mtime.toISOString()} ` +
        `· escala ${escala.toFixed(4)}`,
    ],
  };
}

/** Traçar um arquivo e devolver a peça, sem imprimir. A entrada de biblioteca da régua nova. */
export async function tracarArquivo(caminho: string, fonte: "png" | "svg" | "auto" = "png") {
  const { vb } = await ancorasDoViewBox();
  const seg = await segmentarArquivo(caminho, fonte);
  const aImg = seg.ancoras;
  const m = mapa(aImg, vb);
  return { tracado: tracar(seg, m, aImg), bmp: seg.bmp, seg, mapa: m, ancoras: aImg };
}

/* ------------------------------------------------------------------ */
/* `--ancoras` — as três ancoragens candidatas, medidas lado a lado    */
/* ------------------------------------------------------------------ */

/**
 * O ÂNCORA É UMA ESCOLHA, E ATÉ AGORA ELA NÃO TINHA NÚMERO.
 *
 * O topo deste arquivo argumenta que o tronco é o âncora certo — os dois marcos dele
 * são cegos ao cabelo, e `enquadramento()` não é. O argumento continua bom e nunca
 * foi **medido**: ninguém sabia de quanto era o resíduo dele contra o canônico, nem
 * se outra ancoragem faria melhor.
 *
 * Este relatório põe as três lado a lado sobre os mesmos marcos. O resultado provável
 * é *"o âncora fica onde está, e agora há número"* — e isso é um resultado: no dia em
 * que uma arte abrir o resíduo acima de meio traço, a troca passa a ter causa.
 *
 * **Ancoragem por olhos é a candidata mais frágil, e o número mostra por quê**: dois
 * pontos quase horizontais condicionam mal a escala vertical. Se ela um dia vencer,
 * tem de ser olho + queixo.
 */
async function ancorasDeArquivo(caminho: string) {
  const { lerSvg, acharOlhos, mascaraDoSubpath } = await import("./fonte-svg");
  if (!/\.svg$/i.test(caminho)) {
    throw new Error(`--ancoras precisa do SVG: os marcos saem de path nomeado, não de pixel.`);
  }
  const { vb } = await ancorasDoViewBox();
  const svg = lerSvg(caminho);
  const seg = await segmentarArquivo(caminho, "svg");

  // Do espaço do `viewBox` do conversor para o pixel do raster. Exato: a altura do
  // raster é conhecida e o `viewBox` também.
  const px = (v: number) => (v * ALTURA_SVG) / svg.vb.h;

  const olhos = acharOlhos(svg, OLHO.w / OLHO.h);
  if (olhos.length < 2) throw new Error(`--ancoras: achei ${olhos.length} olho(s), preciso de 2`);
  const centro = olhos.map((o) => ({
    x: px((o.caixa.x0 + o.caixa.x1) / 2),
    y: px((o.caixa.y0 + o.caixa.y1) / 2),
  }));

  // A silhueta EXTERNA da cabeça: o maior subpath do path que tem a moldura. Ele é
  // nomeado por área e não por índice, pelo mesmo motivo que a moldura é.
  const comMoldura = svg.paths.find((p) => p.subpaths.some((s) => s.eMoldura));
  if (!comMoldura) throw new Error(`--ancoras: nenhum path com moldura, não sei achar a cabeça`);
  const uteis = comMoldura.subpaths
    .map((s, k) => ({ s, k }))
    .filter((v) => !v.s.eMoldura)
    .sort((a, b) => Math.abs(b.s.area) - Math.abs(a.s.area));
  const cabecaMask = await mascaraDoSubpath(svg, comMoldura.i, uteis[0].k, ALTURA_SVG);

  /** Os extremos de tinta de uma linha da máscara da cabeça, em pixel. */
  const linha = (py: number): { esq: number; dir: number } | null => {
    let a = Infinity;
    let z = -Infinity;
    const y = Math.round(py);
    if (y < 0 || y >= cabecaMask.h) return null;
    for (let x = 0; x < cabecaMask.w; x++) {
      if (!cabecaMask.mask[y * cabecaMask.w + x]) continue;
      if (x < a) a = x;
      if (x > z) z = x;
    }
    return z < a ? null : { esq: a, dir: z };
  };
  const cx = px((uteis[0].s.caixa.x0 + uteis[0].s.caixa.x1) / 2);
  const cabeca = {
    y0: px(uteis[0].s.caixa.y0),
    y1: px(uteis[0].s.caixa.y1),
    x0: px(uteis[0].s.caixa.x0),
    x1: px(uteis[0].s.caixa.x1),
    cx,
  };

  const aTronco = seg.ancoras;
  const mTronco = mapa(aTronco, vb);

  /** A ancoragem pelos olhos: escala pela separação, origem no meio do par. */
  const sepPx = Math.hypot(centro[1].x - centro[0].x, centro[1].y - centro[0].y);
  const kOlhos = OLHO.separacao / sepPx;
  const mOlhos: Mapa = {
    kx: kOlhos,
    ky: kOlhos,
    ex0: (centro[0].x + centro[1].x) / 2,
    eu0: (OLHO_CX_ESQ + OLHO_CX_DIR) / 2,
    ty0: (centro[0].y + centro[1].y) / 2,
    tu0: (OLHO_CY_ESQ + OLHO_CY_DIR) / 2,
  };

  /** A ancoragem pela cabeça: escala pela altura da caixa dela, origem no centro. */
  const kCabeca = CAIXA_CABECA.alt / (cabeca.y1 - cabeca.y0);
  const mCabeca: Mapa = {
    kx: kCabeca,
    ky: kCabeca,
    ex0: cabeca.cx,
    eu0: (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2,
    ty0: (cabeca.y0 + cabeca.y1) / 2,
    tu0: (CAIXA_CABECA.y0 + CAIXA_CABECA.y1) / 2,
  };

  const FRACOES = [0.25, 0.45, 0.65, 0.85];
  const marcos = (m: Mapa) => {
    const olho = (i: number, cxU: number, cyU: number) => ({
      nome: i === 0 ? "olho esquerdo" : "olho direito",
      erro: Math.hypot(paraX(m, centro[i].x) - cxU, paraY(m, centro[i].y) - cyU),
      detalhe:
        `dx ${(paraX(m, centro[i].x) - cxU).toFixed(1)} · dy ${(paraY(m, centro[i].y) - cyU).toFixed(1)}`,
    });
    const sepMedida = Math.abs(paraX(m, centro[1].x) - paraX(m, centro[0].x));
    const linhas = [
      olho(0, OLHO_CX_ESQ, OLHO_CY_ESQ),
      olho(1, OLHO_CX_DIR, OLHO_CY_DIR),
      {
        nome: "separação dos olhos",
        erro: Math.abs(sepMedida - OLHO.separacao),
        detalhe: `${sepMedida.toFixed(1)} contra ${OLHO.separacao} (${((100 * (sepMedida - OLHO.separacao)) / OLHO.separacao).toFixed(1)}%)`,
      },
      {
        nome: "base da cabeça",
        erro: Math.abs(paraY(m, cabeca.y1) - CAIXA_CABECA.y1),
        detalhe: `${paraY(m, cabeca.y1).toFixed(1)} contra ${CAIXA_CABECA.y1.toFixed(1)}`,
      },
    ];
    // A bochecha: a largura do crânio em quatro alturas, contra `bordasEm`. É o marco
    // que pega escala errada — os olhos sozinhos não pegam, porque são um ponto só.
    const bochechas: number[] = [];
    for (const f of FRACOES) {
      const py = cabeca.y0 + f * (cabeca.y1 - cabeca.y0);
      const l = linha(py);
      if (!l) continue;
      const yU = paraY(m, py);
      const { esq, dir } = bordasEm(yU);
      bochechas.push(Math.abs(paraX(m, l.esq) - esq), Math.abs(paraX(m, l.dir) - dir));
    }
    return {
      /**
       * OS MARCOS QUE RESPONDEM AO ÂNCORA — e a bochecha não é um deles.
       *
       * Medida, ela dá ~35 a 39 u nas TRÊS ancoragens, inclusive na que acerta os
       * olhos em 0,5 u. Um resíduo que não se mexe quando o âncora muda não está
       * medindo o âncora: está medindo o **crânio da arte contra o crânio
       * canônico**, que são formas diferentes — o boneco do gerador nunca foi o do
       * `geometria.ts`, e este arquivo diz isso desde o topo.
       *
       * Deixá-la dentro do veredito faria a inversão mentir: escalar a arte 5%
       * aproxima o crânio largo do canônico e o pior resíduo CAI, o que leria como
       * "o âncora não acusa escala" quando o que aconteceu foi outra coisa. Ela
       * continua impressa, porque é o número que diz o quanto a arte diverge do
       * boneco — só não vota.
       */
      doAncora: linhas,
      bochecha: {
        nome: `bochecha, ${FRACOES.length} alturas`,
        erro: bochechas.length ? Math.max(...bochechas) : Infinity,
        detalhe: bochechas.length ? bochechas.map((v) => v.toFixed(1)).join(" · ") : "sem tinta",
      },
    };
  };

  console.log(`ÂNCORAS — ${caminho}`);
  for (const l of seg.laudo) console.log(`  ${l.replace(/\n/g, "\n  ")}`);
  console.log(
    `\nolhos achados por razão de aspecto (alvo ${(OLHO.w / OLHO.h).toFixed(3)}): ` +
      olhos.map((o) => `#${o.path} r=${o.razao.toFixed(3)}`).join(" · "),
  );

  const candidatas: [string, Mapa][] = [
    ["tronco (o de hoje)", mTronco],
    ["olhos", mOlhos],
    ["cabeça", mCabeca],
  ];
  for (const [nome, m] of candidatas) {
    const r = marcos(m);
    console.log(`\n${nome} — k = ${m.kx.toFixed(5)}`);
    for (const l of r.doAncora) {
      console.log(
        `  ${l.nome.padEnd(22)} ${l.erro.toFixed(1).padStart(6)} u   ${l.detalhe}` +
          (l.erro > TRACO / 2 ? "   ✗ acima de meio traço" : ""),
      );
    }
    console.log(
      `  ${r.bochecha.nome.padEnd(22)} ${r.bochecha.erro.toFixed(1).padStart(6)} u   ` +
        `${r.bochecha.detalhe}   (informativo: é a arte contra o crânio canônico)`,
    );
  }

  /**
   * A INVERSÃO: a mesma arte, 5% maior. Um âncora que MEÇA escala tem de acusar.
   *
   * Escalar 5% em torno da origem do mapa é multiplicar `k` por 1/1,05: a arte cresce,
   * a régua a lê encolhida na mesma proporção. Sobre um crânio de 364 u, 5% são ~18
   * unidades — três vezes meio traço. Um âncora que continue verde aqui não está
   * medindo escala, está medindo posição.
   */
  /**
   * O VEREDITO DA INVERSÃO É CRUZAR MEIO TRAÇO, e não crescer um tanto.
   *
   * "Crescer mais que meio traço" foi o primeiro critério e ele é mal-posto: os
   * marcos ficam ~130 u acima da origem do mapa (o pescoço), então 5% de escala os
   * move ~6,5 u — o crescimento medido é 5,3, e exigir +6 reprovaria um âncora que
   * fez exatamente o que devia. O número que interessa não é o salto, é o lado da
   * linha: um âncora que MEÇA escala tem de sair de aprovado e chegar reprovado.
   */
  console.log(
    `\nINVERSÃO — a mesma arte 5% maior (k ÷ 1,05). O pior resíduo DE ÂNCORA tem de\n` +
      `cruzar meio traço (${TRACO / 2} u); a bochecha fica de fora, e o docstring de\n` +
      `\`marcos\` diz por quê:`,
  );
  for (const [nome, m] of candidatas) {
    const pior = (mm: Mapa) => Math.max(...marcos(mm).doAncora.map((l) => l.erro));
    const antes = pior(m);
    const depois = pior({ ...m, kx: m.kx / 1.05, ky: m.ky / 1.05 });
    console.log(
      `  ${nome.padEnd(22)} ${antes.toFixed(1)} → ${depois.toFixed(1)} u` +
        (antes > TRACO / 2
          ? "   — já reprovava sem a inversão; nada a provar aqui"
          : depois > TRACO / 2
            ? "   ✓ cruzou"
            : "   ✗ NÃO acusou a escala"),
    );
  }
  console.log(
    `\nO resultado esperado era "o âncora fica onde está, e agora há número", e é ele.\n` +
      `A troca passa a ter causa no dia em que uma arte abrir o resíduo de tronco\n` +
      `acima de meio traço — e aí a candidata é olho + queixo, nunca olho sozinho:\n` +
      `dois pontos quase horizontais condicionam mal a escala vertical.`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const arg = args[0];
  if (arg === "--diag") return diagnosticar(args[1]);
  if (arg === "--ida-e-volta") return idaEVolta();

  const iFonte = args.indexOf("--fonte");
  const fonte = (iFonte >= 0 ? args[iFonte + 1] : "png") as "png" | "svg" | "auto";
  if (!["png", "svg", "auto"].includes(fonte)) {
    throw new Error(`--fonte aceita png, svg ou auto — não "${fonte}"`);
  }
  // O valor de `--fonte` não é caminho. `iFonte < 0` tem de virar um índice que não
  // existe, senão a comparação come o argumento 0 — que é justamente o caminho.
  const valorDaFonte = iFonte >= 0 ? iFonte + 1 : -1;
  const livres = args.filter((a, i) => !a.startsWith("--") && i !== valorDaFonte);

  if (args.includes("--ancoras")) return ancorasDeArquivo(livres[0]);
  if (!livres.length) {
    process.exitCode = await idaEVoltaMassa();
    return;
  }

  // A régua paramétrica continua alcançável enquanto houver modelo paramétrico no
  // catálogo — ela é o outro lado da comparação em `fidelidade.ts`.
  if (args.includes("--parametrico")) {
    const caminho = livres[0];
    const { vb } = await ancorasDoViewBox();
    const bmp = await cru(caminho);
    const aImg = ancoras(bmp);
    imprimir(caminho, medirFranja(segmentarPorMatiz(bmp), mapa(aImg, vb), aImg));
    return;
  }

  const { tracado } = await tracarArquivo(livres[0], fonte);
  imprimirTracado(livres[0], tracado);
}

/**
 * SÓ RODA QUANDO É O ARQUIVO CHAMADO — senão importar a régua a executaria.
 *
 * `fidelidade.ts` e `folha-fidelidade.ts` importam daqui. Sem esta guarda, cada
 * `import` dispararia uma medição inteira (chromium, raster de 1000×1400) antes de a
 * primeira linha do script que importou rodar.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
