/**
 * O PASSO 4 DA ESTEIRA, para QUALQUER peça de cor assada.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO NASCEU, E O QUE ELE NÃO INVENTOU
 * ---------------------------------------------------------------------------
 *
 * Ele é o corpo de `traje.ts` sem a palavra "traje". Cada linha aqui rodou em
 * produção nas duas peças aprovadas em 2026-08-17; nada foi reescrito, e a régua de
 * que nada foi reescrito é dura: **regerar `traje-farda.svg` e `traje-gambesao.svg`
 * depois desta separação tem de dar byte a byte o mesmo arquivo.** Se um byte
 * mudar, a generalização mudou comportamento e não é generalização.
 *
 * O que ele existe para permitir é o que o plano chama de lado esquerdo da
 * bifurcação: **chapéu, óculos e pet** passam por aqui sem uma linha nova de
 * traçado. O passo 4 era a única parte da esteira que ainda sabia o nome de um slot.
 *
 * ---------------------------------------------------------------------------
 * O QUE MUDA DE SLOT PARA SLOT É **UMA** COISA: O CAMPO
 * ---------------------------------------------------------------------------
 *
 * A extração por diferença precisa de uma fronteira, e é só isso que distingue um
 * slot do outro. `extrair.ts` já explica por quê: diferença sozinha é ótima para
 * perguntar *"o boneco continua o mesmo?"* e ruim para responder *"quais pixels são
 * a peça?"* — ela levaria as feições repintadas, o ruído de reencode e a sombra do
 * chão redesenhada. O campo devolve a precisão que o ciano dava, e a fronteira dele
 * é teto publicado, não escolha.
 *
 * Tudo o mais — o recorte, o traçador, a sentinela, o controle negativo, a cor
 * dominante — é o mesmo para todo slot, e é por isso que mora aqui e não lá.
 *
 * ---------------------------------------------------------------------------
 * O RECORTE É O `viewBox` INTEIRO, EM TODO SLOT — e isso é amarra
 * ---------------------------------------------------------------------------
 *
 * `tintaTronco()` e o ramo novo de `sobrepor()` emitem `<image>` ocupando o
 * `viewBox` inteiro com `k = 1`. O recorte é `[ORIGEM, ORIGEM + VIEWBOX × ESCALA]`
 * = px 212→812 × 92→932, que mede 600 × 840 e é 5:7 cravado — a MESMA proporção.
 * `preserveAspectRatio` encaixa 1 : 1 sem sobra em nenhum eixo.
 *
 * **A colagem é conta, não ajuste**, e manter isso vale mais que economizar bytes
 * num slot: um recorte próprio por slot seria um segundo sistema de coordenadas
 * atravessando a rota, que é exatamente o que `base-tronco.ts` recusou em 2026-08-13.
 *
 * ⚠️ **Consequência declarada, e ela decide o chapéu:** peça que suba acima de
 * `y = 0` sai **medida, não colada** — o `viewBox` não tem teto livre até a Frente B
 * (P5). O número que sobra é `caixaUnidades.y0`, negativo, e é justamente o teto que
 * o P5 espera medir em vez de chutar.
 */

import { mkdirSync, writeFileSync } from "fs";
import { basename } from "path";
import { gzipSync } from "zlib";

import sharp from "sharp";
import { ColorMode, Hierarchical, PathSimplifyMode, vectorize } from "@neplex/vectorizer";

import { prepararSvg } from "../estilo/vtracer";
import { ESCALA, LADO, ORIGEM, PNG_BASE } from "./base";
import { type ExtracaoPorCampo, extrairPorCampo } from "./extrair";

/** O recorte: o `viewBox` inteiro, em pixels da base de edição. Ver o topo. */
export const RECORTE = {
  x: ORIGEM.x,
  y: ORIGEM.y,
  w: Math.round(500 * ESCALA),
  h: Math.round(700 * ESCALA),
} as const;

/**
 * A CONFIGURAÇÃO DO TRAÇADOR PARA PEÇA DE COR ASSADA — e ela **não** é a do cabelo.
 *
 * **Ela se chamava `CONFIG_TRAJE`, e o nome era mais estreito que a coisa.** O
 * argumento que a justifica, escrito quando ela nasceu, nunca falou de traje: falou
 * de peça que **não recolore**. Renomear é fazer o nome dizer o que o docstring já
 * dizia — e é o que permite chapéu, óculos e pet usarem-na sem herdar a palavra
 * errada.
 *
 * `estilo/vtracer.ts` traz `colorPrecision 5 · layerDifference 24 · filterSpeckle 8`,
 * com contra-exemplo medido para cada escolha, e a P1 do plano previa reaproveitá-la.
 * **A medição reprovou o reaproveitamento**, e o motivo é que as duas calibrações
 * respondem a perguntas diferentes:
 *
 *  - a do cabelo foi calibrada para **encolher a curadoria** — 235 fragmentos viram
 *    46, e cada um precisa de um papel humano (`massa` ou `clara`) porque o cabelo
 *    recolore. Menos fragmento é menos trabalho;
 *  - peça de cor assada **não recolore** (emenda à D27): a cor de cada forma sai
 *    medida do pixel e ninguém rotula nada. Sem curadoria, fragmento não custa
 *    trabalho — e a única coisa que o número de fragmentos compra é **fidelidade**.
 *
 * Aplicada à `traje-farda`, a calibração do cabelo **apaga o pesponto tracejado da
 * carcela** (27 px escuros na coluna do tracejado viram 3) e inventa dois retalhos
 * de matiz errado na bainha. Com os valores abaixo, a mesma peça sai indistinguível
 * do raster a 14× de zoom: 13,7% dos pixels diferem, e depois de duas erosões sobram
 * 9 px — ou seja, **100% da diferença é linha de borda**, assinatura de antialiasing
 * e não de desenho perdido.
 *
 * `Hierarchical.Stacked` e não `Cutout`: em `Cutout` as camadas se recortam, o que
 * serve para *isolar* uma forma (é o que o cabelo precisa, e o docstring de lá
 * explica). Aqui a pergunta é reconstruir a imagem, e camada sobre camada
 * reconstrói; camada recortada deixa costura entre regiões vizinhas.
 *
 * `pathPrecision: 0` sobrevive intacto do cabelo, e pelo mesmo motivo: o traço veio
 * de um raster, e sub-pixel ali não descreve informação que o raster tinha.
 */
export const CONFIG_ARTE = {
  colorMode: ColorMode.Color,
  hierarchical: Hierarchical.Stacked,
  filterSpeckle: 4,
  colorPrecision: 6,
  layerDifference: 12,
  mode: PathSimplifyMode.Spline,
  cornerThreshold: 60,
  lengthThreshold: 4,
  maxIterations: 10,
  spliceThreshold: 45,
  pathPrecision: 0,
} as const;

/**
 * A COR SENTINELA — porque o traçador não enxerga alfa.
 *
 * O recorte é RGBA de alfa binário: ou o pixel é da peça, ou é vazio com RGB zerado.
 * O VTracer ignora o canal alfa e leria aquilo como **preto puro** — a peça sairia
 * dentro de uma mancha preta do tamanho do `viewBox`.
 *
 * Então o vazio é achatado num magenta que arte de peça não tem, e as formas que
 * saem nessa cor são descartadas pelo nome. Como o alfa é binário, o achatamento não
 * inventa borda: não existe pixel meio-transparente para misturar com o magenta.
 *
 * O descarte é conferido, nunca presumido — ver `vetorizarRecorte`.
 */
const SENTINELA = { r: 255, g: 0, b: 255 } as const;

export type Rgb = [number, number, number];

export const paraRgb = (h: string): Rgb => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const hex = (c: Rgb) =>
  `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/** Perto da sentinela dentro da quantização do traçador. */
function eSentinela(fill: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(fill)) return false;
  const [r, g, b] = paraRgb(fill);
  return r > 200 && g < 60 && b > 200;
}

/**
 * O recorte RGBA virando `.svg` — a peça que vai ao ar.
 *
 * O `viewBox` é o do recorte (600 × 840), e é ele que faz a colagem continuar sendo
 * conta e não ajuste: o `<image>` do compositor ocupa o `viewBox` inteiro (500 × 700,
 * 5:7), e 600 × 840 é a MESMA proporção, então `preserveAspectRatio` encaixa 1 : 1
 * sem sobra em nenhum eixo.
 */
export async function vetorizarRecorte(
  rgba: Buffer,
  w: number,
  h: number,
): Promise<{ svg: string; formas: number; descartadas: number }> {
  const chapado = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .flatten({ background: SENTINELA })
    .png()
    .toBuffer();

  const pronto = prepararSvg(await vectorize(chapado, { ...CONFIG_ARTE }), w, h);

  const formas: string[] = [];
  let descartadas = 0;
  for (const m of pronto.matchAll(/<path[^>]*\sd="([^"]*)"[^>]*\sfill="([^"]*)"[^>]*>/g)) {
    if (eSentinela(m[2])) descartadas++;
    else formas.push(`<path d="${m[1]}" fill="${m[2]}"/>`);
  }

  // O casamento acima exige `d` antes de `fill`. Se o traçador inverter a ordem dos
  // atributos, a peça sairia VAZIA e o boneco apareceria sem ela com todos os gates
  // verdes — o modo de falha nº 1 desta rota, e o único jeito de fechá-lo é conferir
  // a conta em vez de confiar no regex.
  const total = (pronto.match(/<path/g) ?? []).length;
  if (formas.length + descartadas !== total) {
    throw new Error(
      `li ${formas.length + descartadas} de ${total} <path> do traçador. A ordem dos ` +
        `atributos mudou — o extrator precisa ser reescrito antes de confiar na peça.`,
    );
  }
  if (!descartadas) {
    throw new Error(
      `nenhuma forma na cor sentinela foi descartada. O fundo magenta não virou forma ` +
        `própria, o que quer dizer que ele se fundiu com a peça — a peça sairia com um ` +
        `retângulo magenta em volta.`,
    );
  }

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ` +
      `width="${w}" height="${h}">${formas.join("")}</svg>`,
    formas: formas.length,
    descartadas,
  };
}

/**
 * O QUE UM SLOT PRECISA DECLARAR PARA PASSAR POR AQUI — e são quatro linhas.
 *
 * Repare no que NÃO está aqui: recorte, escala, âncora, configuração de traçador.
 * É a mesma trava de `interface Traje` (`tipos.ts`) pelo mesmo motivo — um slot que
 * tentasse declarar o próprio recorte estaria abrindo o segundo sistema de
 * coordenadas que esta rota recusa desde 2026-08-13.
 */
export interface SlotDeArte {
  /** O nome do slot, para a mensagem de erro dizer de quem ela fala. */
  nome: string;
  /** A convenção de slug. O nome do arquivo de arte tem de casar com ela. */
  slug: RegExp;
  /** Onde o `.svg` é escrito. Sempre sob `public/items/` — ver `arteDaPecaNoDeploy`. */
  pasta: string;
  /**
   * Onde a peça pode legitimamente existir, em unidades do `viewBox`.
   *
   * **É a única coisa que muda de slot para slot.** Fora dele nada é peça, por teto
   * publicado, e os candidatos descartados saem contados no relatório — descarte em
   * silêncio é o modo de falha que esta rota inteira existe para fechar.
   */
  campo: (x: number, y: number) => boolean;
}

/**
 * A TINTA — a ponte por onde a recolorização entra, e ela é opcional de propósito.
 *
 * Toda peça nova chega em cor final, e para ela a tinta é a **identidade**: a cor
 * que sai é a que a artista pintou, sem uma conta entre a leitura e a escrita. A
 * única exceção viva é a `traje-farda`, desenhada no tempo do ciano, e a conta dela
 * mora em `traje.ts` — não aqui, porque ela é resíduo de uma transição e não um
 * mecanismo.
 */
export interface Tinta {
  /** Índice do pixel → a cor que vai para o recorte. */
  aplicar: (i: number) => Rgb;
  /** A cor declarada, ou `null` se a arte já veio final. Só para o relatório. */
  declarada: string | null;
}

export type FabricaDeTinta = (e: ExtracaoPorCampo) => Tinta;

export interface Peca {
  slug: string;
  /** O `.svg` que vai ao ar — o caminho de disco, a partir da raiz. */
  arte: string;
  /**
   * O recorte RGBA como PNG, **em memória e de propósito**.
   *
   * Ele foi arquivo em `public/items/traje/` até 2026-08-17, e deixou de ser quando
   * o `.svg` virou a peça do produto: um raster de 248 KB no deploy que ninguém pede
   * é peso morto, e foi ele o achado de peso que o P1 matou sem conserto.
   *
   * Continua existindo porque é a **verdade de referência** — é contra este buffer
   * que a `arte:folha-traje` mede a colagem e a `arte:prova-vetor` mede a
   * fidelidade. Não precisa ser commitado para isso: a saída é determinística, e
   * quem quiser o raster roda a esteira e o tem de volta idêntico.
   */
  raster: Buffer;
  /** Quantas formas o traçador produziu. É o custo da peça, e ele é medido. */
  formas: number;
  /** A cor dominante MEDIDA no recorte. Vai para `tinta.cor`, o fallback chapado. */
  cor: string;
  /** A cor declarada pela fábrica de tinta, ou `null` se a arte já veio final. */
  recolorida: string | null;
  pixels: number;
  /** Candidatos que diferiam da base mas caíram fora do campo do slot. */
  foraDoCampo: number;
  salpico: number;
  descartadas: number;
  foraDoRecorte: number;
  caixaUnidades: { x0: number; y0: number; x1: number; y1: number };
  /** O controle negativo: quantos pixels a régua acha na PRÓPRIA base. */
  controleNaBase: number;
  /** O peso do `.svg` que vai ao ar, cru. */
  bytes: number;
  /**
   * O peso do `.svg` COMPRIMIDO, e é este que se compara com o PNG.
   *
   * PNG já é um formato comprimido; SVG é texto, e todo servidor o entrega em gzip
   * ou brotli. Pôr o SVG cru ao lado do PNG seria comparar maçã com laranja — e a
   * conta sairia ao contrário na peça chapada, onde o cru é 3× MAIOR e o comprimido
   * é menor.
   */
  bytesGzip: number;
  /** O peso que o raster teria — o que a decisão do vetor economizou. */
  bytesRaster: number;
}

/**
 * O SLUG É O NOME DO ARQUIVO DE ARTE, e esta é a única descrição dessa regra.
 *
 * Ela mora aqui porque tem dois leitores — `construirPeca`, que valida, e quem
 * precisa do slug ANTES de construir (a fábrica de tinta do traje). Duas cópias de
 * um `replace` divergiriam na primeira vez que a extensão mudasse, e este
 * repositório já pagou por esse tipo de segunda cópia.
 */
export const slugDaArte = (caminhoArte: string): string =>
  basename(caminhoArte).replace(/\.png$/i, "");

export async function construirPeca(
  caminhoArte: string,
  slot: SlotDeArte,
  fabricaDeTinta?: FabricaDeTinta,
): Promise<Peca> {
  const slug = slugDaArte(caminhoArte);
  if (!slot.slug.test(slug)) {
    throw new Error(
      `slug "${slug}" fora da convenção do slot ${slot.nome} (${slot.slug.source}). ` +
        `O nome do arquivo de arte É o slug do catálogo — ver doc 19 §12`,
    );
  }

  const e = await extrairPorCampo(caminhoArte, slot.campo);

  // Sem fábrica, a tinta é a IDENTIDADE: a cor que sai é a que a artista pintou.
  const tinta: Tinta = fabricaDeTinta
    ? fabricaDeTinta(e)
    : {
        aplicar: (i) => [e.arte.data[i * 3], e.arte.data[i * 3 + 1], e.arte.data[i * 3 + 2]],
        declarada: null,
      };

  // ------------------------------------------------------------- o recorte
  const { x: X0, y: Y0, w: W, h: H } = RECORTE;
  const saida = Buffer.alloc(W * H * 4); // RGBA, tudo alfa 0 por padrão
  let pixels = 0;
  let foraDoRecorte = 0;

  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const i = y * LADO + x;
      if (!e.mascara[i]) continue;
      pixels++;
      const xr = x - X0;
      const yr = y - Y0;
      if (xr < 0 || xr >= W || yr < 0 || yr >= H) {
        foraDoRecorte++;
        continue;
      }
      const c = tinta.aplicar(i);
      const k = (yr * W + xr) * 4;
      saida[k] = c[0];
      saida[k + 1] = c[1];
      saida[k + 2] = c[2];
      saida[k + 3] = 255;
    }
  }

  mkdirSync(slot.pasta, { recursive: true });
  const raster = await sharp(saida, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const vetor = await vetorizarRecorte(saida, W, H);
  const arte = `${slot.pasta}/${slug}.svg`;
  writeFileSync(arte, vetor.svg, "utf-8");

  // ------------------------------- o controle negativo: a base contra si mesma
  //
  // Régua nova entra com controle ao lado. É *o* modo de falha desta rota, e já
  // mordeu cinco vezes (doc 19 §5). A máscara é `diferença contra a base ∩ campo`;
  // uma base contra ela mesma tem diferença zero em todo pixel, então a resposta
  // certa é **0 px**. Se ela devolver qualquer coisa, a régua está inventando peça
  // onde não há nenhuma — e todo número que sair dela em toda peça é ficção.
  //
  // Ele roda a cada peça, não uma vez na vida: é barato (uma leitura de PNG) e é a
  // única coisa que impede a régua de degradar em silêncio. E ele roda com o campo
  // **do slot**, porque é a régua do slot que está sendo conferida.
  const naBase = await extrairPorCampo(PNG_BASE, slot.campo);
  let controleNaBase = 0;
  for (let i = 0; i < naBase.mascara.length; i++) if (naBase.mascara[i]) controleNaBase++;

  // A dominante é medida no PNG DE SAÍDA, não na arte: numa peça recolorida a
  // dominante da arte é o ciano instrumental, que não chega à tela. `tinta.cor` é o
  // fallback chapado que o produto desenha quando a arte falta — ele tem de ser a
  // cor que o aluno veria.
  const balde = new Map<number, number>();
  for (let i = 0; i < W * H; i++) {
    if (saida[i * 4 + 3] === 0) continue;
    const k =
      ((saida[i * 4] >> 3) << 10) | ((saida[i * 4 + 1] >> 3) << 5) | (saida[i * 4 + 2] >> 3);
    balde.set(k, (balde.get(k) ?? 0) + 1);
  }
  let melhorK = -1,
    melhorN = -1;
  for (const [k, c] of balde) if (c > melhorN) (melhorN = c), (melhorK = k);
  let sr = 0,
    sg = 0,
    sb = 0,
    sn = 0;
  for (let i = 0; i < W * H; i++) {
    if (saida[i * 4 + 3] === 0) continue;
    const k =
      ((saida[i * 4] >> 3) << 10) | ((saida[i * 4 + 1] >> 3) << 5) | (saida[i * 4 + 2] >> 3);
    if (k !== melhorK) continue;
    sr += saida[i * 4];
    sg += saida[i * 4 + 1];
    sb += saida[i * 4 + 2];
    sn++;
  }
  const dominante: Rgb = sn
    ? [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)]
    : [0, 0, 0];

  return {
    slug,
    arte,
    raster,
    formas: vetor.formas,
    cor: hex(dominante),
    recolorida: tinta.declarada,
    pixels,
    foraDoCampo: e.foraDoCampo,
    salpico: e.salpico,
    descartadas: e.descartadas.length,
    foraDoRecorte,
    caixaUnidades: e.caixaUnidades,
    controleNaBase,
    bytes: Buffer.byteLength(vetor.svg),
    bytesGzip: gzipSync(Buffer.from(vetor.svg)).length,
    bytesRaster: raster.length,
  };
}
