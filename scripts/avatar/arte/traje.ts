/**
 * P4-T — A ARTE DO TRAJE VIRA PEÇA: recortar e **vetorizar**.
 *
 * É o passo 4 da esteira do traje, e o análogo do trio
 * `arte:contorno` → `arte:converter` → `arte:espessura` do cabelo.
 *
 * ---------------------------------------------------------------------------
 * O RASTER VIROU INTERMEDIÁRIO EM 2026-08-17, E O QUE VAI AO AR É O `.svg`
 * ---------------------------------------------------------------------------
 *
 * Até esta data o passo terminava no recorte: um RGBA de 600 × 840 escrito em
 * `public/items/traje/`, que o compositor colava por `<image>`. A P1 do plano
 * mediu a alternativa e o Doug decidiu por ela — o runbook da decisão é a entrada
 * de 2026-08-17 no doc 21, e `npm run arte:prova-vetor` refaz a medição inteira.
 *
 * **O que mudou, e o que NÃO mudou.** O recorte continua igual, byte a byte: a
 * máscara, a colagem 1 : 1 e o controle negativo são os mesmos. O que ele
 * alimenta é que mudou — em vez de virar arquivo, ele vira entrada do traçador, e
 * quem chega em `public/items/traje/` é um `.svg`.
 *
 * **O `<image>` do compositor não mudou de forma nenhuma.** Ele já aceitava SVG;
 * a P1 mediu os dois caminhos de render do navegador e eles pintam o mesmo pixel
 * (0,00–0,01% de diferença, com controle no laudo). A mudança de código no produto
 * foi a extensão do arquivo e o nome do campo — nada mais.
 *
 * **Os três números que a decisão comprou** (gambesão, a peça mais detalhada):
 * 248,2 KB → 60,6 KB comprimidos; nitidez em qualquer tamanho, com o vetor lendo
 * MELHOR que o raster a 56 px, que é o tamanho do ranking; e zero forma nova no
 * DOM, porque o `.svg` avulso é baixado uma vez e cacheado como o PNG era.
 *
 * **O que ela custou, dito com todas as letras:** o aerógrafo. Numa peça pintada
 * com gradiente, as canaletas deixam de ser vinco com volume e viram linha escura
 * sobre chapado (9 691 cores distintas no recorte viram 4 975). Em arte CHAPADA a
 * perda é indistinguível a 14× de zoom. O Doug viu as duas folhas e aprovou.
 *
 * ---------------------------------------------------------------------------
 * A RECOLORIZAÇÃO MORREU EM 2026-08-13, E O QUE SOBROU É MAIS SIMPLES
 * ---------------------------------------------------------------------------
 *
 * Até esta data o passo tinha duas metades. A arte chegava em três tons de **ciano
 * instrumental**, e aqui ela era repintada na cor da patente: `panoDoSlug()` lia o
 * slug `traje-<patente>-<nome>`, buscava o pano em `scripts/avatar/patentes.ts`, e
 * aplicava a razão de tom que a artista tinha posto na arte (sombra 0,3290 × massa,
 * luz 1,5506 ×). O ciano era instrumento de medição e não chegava ao aluno.
 *
 * **As duas metades caíram juntas, e por decisão de produto:**
 *
 *  - **não existe mais "a cor da patente".** A patente deixou de vestir o boneco —
 *    ela dá uma moldura em volta do avatar (doc 21 §0). Sem cor de destino, não há
 *    o que recolorir;
 *  - **a cor livre resolve o problema que a régua não resolvia.** Com todas as
 *    peças de uma patente no mesmo pano, a distinção entre duas delas a 56 px era
 *    arrancada a fórceps — e foi isso que produziu uma peça em *color block*,
 *    reprovada pelo Doug. Com cor própria, duas peças se separam trivialmente.
 *
 * **O que este arquivo faz agora:** recorta a máscara da peça no `viewBox` e escreve
 * um RGBA com **os pixels da arte, como a artista os pintou**. Nada é multiplicado,
 * nada é misturado com branco, nada é lido de `patentes.ts`.
 *
 * Com isso morrem também as duas contas que existiam só para a recolorização — a
 * partição ótima em três tons e o controle de quantização de 0,50 nível. Elas
 * mediam se a repintura tinha preservado o volume desenhado; sem repintura, o
 * volume desenhado é o que está no arquivo, byte a byte.
 *
 * ---------------------------------------------------------------------------
 * O CONTROLE NEGATIVO — e agora ele é OUTRO, porque a régua é outra
 * ---------------------------------------------------------------------------
 *
 * Régua nova entra com controle ao lado. É *o* modo de falha desta rota, e já
 * mordeu cinco vezes (doc 19 §5).
 *
 * O controle anterior remedia a luminância de cada papel no PNG de saída — ele
 * vigiava a recolorização, e some com ela. O que entra no lugar responde à pergunta
 * da régua nova: **extrair a PRÓPRIA BASE devolve zero pixels?**
 *
 * A máscara agora é `diferença contra a base ∩ campo do traje`. Uma base contra ela
 * mesma tem diferença zero em todo pixel, então a resposta certa é **0 px**. Se ela
 * devolver qualquer coisa, a régua está inventando peça onde não há nenhuma — e
 * todo número que sair dela em toda peça é ficção. Ele roda a cada peça, não uma
 * vez na vida: é barato (uma leitura de PNG) e é a única coisa que impede a régua
 * de degradar em silêncio.
 *
 * ---------------------------------------------------------------------------
 * A COLAGEM É CONTA, E É POR ISSO QUE O RECORTE É ESTE (não mudou)
 * ---------------------------------------------------------------------------
 *
 * `tintaTronco()` emite `<image x=(500−500k)/2 y=… width=500k height=700k
 * preserveAspectRatio="xMidYMid meet"/>`, com `k = traje.escalaMedida ?? 1`
 * (`compositor.ts:373`). **A peça não declara `escalaMedida`** — o campo diz
 * *"nunca escrita à mão"*, e o auto-ajuste que a produziria não existe em código.
 * Com `k = 1` o `<image>` ocupa `x=0 y=0 w=500 h=700`: o `viewBox` inteiro.
 *
 * E o `viewBox` inteiro, na base de edição, é exatamente
 * `[ORIGEM, ORIGEM + VIEWBOX × ESCALA]` = px **212→812 × 92→932**, que mede
 * **600 × 840** e é 5:7 cravado. Recortar ali põe a arte no lugar 1 : 1, sem
 * registro, sem ajuste e sem número escolhido a olho.
 *
 * 600 × 840 é 1,2 px/u; o maior render do produto tem 425 px de altura
 * (0,607 px/u). O PNG fica ~2× supersampleado, que é o que DPR 2 pede.
 */

import { mkdirSync, writeFileSync } from "fs";
import { basename } from "path";
import { gzipSync } from "zlib";

import sharp from "sharp";
import { ColorMode, Hierarchical, PathSimplifyMode, vectorize } from "@neplex/vectorizer";

import { escurecer } from "../../../src/lib/avatar/palette";
import { prepararSvg } from "../estilo/vtracer";
import { ESCALA, LADO, ORIGEM, PNG_BASE } from "./base";
import { extrairTraje } from "./extrair";
import { luz } from "./pixels";

/**
 * Onde os PNGs de peça nascem — **a prateleira do produto**, desde 2026-08-13.
 *
 * Era `public/dev/traje`, e a justificativa escrita aqui era *"`dev/` porque
 * `public/items/` é policiado"*: o `verify:avatar-assets` reprovava arquivo órfão
 * lá dentro. **Esse gate não existe mais** — o Bloco D o apagou junto com os 44
 * arquivos de `public/items/` (`scripts/estado.ts:263-267`), e a proibição
 * sobreviveu ao motivo dela por meses.
 *
 * O preço foi o defeito que `pngDaPecaNoDeploy.test.ts` fecha: `public/dev/` está
 * no `.gitignore` (linha 69), a Vercel builda a árvore do git, e a peça nunca
 * subiu. Na oficina tudo aparecia; no ar, 404 — e como `compositor.ts:391` decide
 * pelo campo declarado e não pelo arquivo existindo, o aluno vestido saía com
 * menos volume que o aluno sem traje.
 *
 * `public/items/` é onde a base do boneco já mora, e é o endereço que a criança
 * pede. Ele é versionado de propósito — o PNG é derivado, mas é derivado que vai
 * ao ar, e este projeto já tinha escolhido esse caminho uma vez: o livro de
 * aberturas (875 KB, gerado) está commitado em `public/chess/` com o `--check` do
 * `prebuild` provando que confere. Duas peças pesam 259 KB, e a saída é
 * determinística — duas rodadas do gerador dão o mesmo byte.
 */
export const PASTA_TRAJE = "public/items/traje";

/** O recorte: o `viewBox` inteiro, em pixels da base de edição. */
export const RECORTE = {
  x: ORIGEM.x,
  y: ORIGEM.y,
  w: Math.round(500 * ESCALA),
  h: Math.round(700 * ESCALA),
} as const;

/**
 * A CONFIGURAÇÃO DO TRAÇADOR PARA TRAJE — e ela **não** é a do cabelo.
 *
 * `estilo/vtracer.ts` traz `colorPrecision 5 · layerDifference 24 · filterSpeckle 8`,
 * com contra-exemplo medido para cada escolha, e a P1 do plano previa reaproveitá-la.
 * **A medição reprovou o reaproveitamento**, e o motivo é que as duas calibrações
 * respondem a perguntas diferentes:
 *
 *  - a do cabelo foi calibrada para **encolher a curadoria** — 235 fragmentos viram
 *    46, e cada um precisa de um papel humano (`massa` ou `clara`) porque o cabelo
 *    recolore. Menos fragmento é menos trabalho;
 *  - o traje **não recolore** (emenda à D27): a cor de cada forma sai medida do
 *    pixel e ninguém rotula nada. Sem curadoria, fragmento não custa trabalho — e a
 *    única coisa que o número de fragmentos compra é **fidelidade**.
 *
 * Aplicada à `traje-farda`, a calibração do cabelo **apaga o pesponto tracejado da
 * carcela** (27 px escuros na coluna do tracejado viram 3) e inventa dois retalhos
 * de matiz errado na bainha. Com os valores abaixo, a mesma peça sai
 * indistinguível do raster a 14× de zoom: 13,7% dos pixels diferem, e depois de
 * duas erosões sobram 9 px — ou seja, **100% da diferença é linha de borda**,
 * assinatura de antialiasing e não de desenho perdido.
 *
 * `Hierarchical.Stacked` e não `Cutout`: em `Cutout` as camadas se recortam, o que
 * serve para *isolar* uma forma (é o que o cabelo precisa, e o docstring de lá
 * explica). Aqui a pergunta é reconstruir a imagem, e camada sobre camada
 * reconstrói; camada recortada deixa costura entre regiões vizinhas.
 *
 * `pathPrecision: 0` sobrevive intacto do cabelo, e pelo mesmo motivo: o traço veio
 * de um raster, e sub-pixel ali não descreve informação que o raster tinha.
 */
export const CONFIG_TRAJE = {
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
 * Então o vazio é achatado num magenta que arte de traje não tem, e as formas que
 * saem nessa cor são descartadas pelo nome. Como o alfa é binário, o achatamento
 * não inventa borda: não existe pixel meio-transparente para misturar com o magenta.
 *
 * O descarte é conferido, nunca presumido — ver `vetorizarRecorte`.
 */
const SENTINELA = { r: 255, g: 0, b: 255 } as const;

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

  const pronto = prepararSvg(await vectorize(chapado, { ...CONFIG_TRAJE }), w, h);

  const formas: string[] = [];
  let descartadas = 0;
  for (const m of pronto.matchAll(/<path[^>]*\sd="([^"]*)"[^>]*\sfill="([^"]*)"[^>]*>/g)) {
    if (eSentinela(m[2])) descartadas++;
    else formas.push(`<path d="${m[1]}" fill="${m[2]}"/>`);
  }

  // O casamento acima exige `d` antes de `fill`. Se o traçador inverter a ordem dos
  // atributos, a peça sairia VAZIA e o boneco apareceria de macacão com todos os
  // gates verdes — o modo de falha nº 1 desta rota, e o único jeito de fechá-lo é
  // conferir a conta em vez de confiar no regex.
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
 * A convenção de slug, desde 2026-08-13: **`traje-<nome>`**, sem patente.
 *
 * `traje-soldado-farda` virou `traje-farda`. O nome da patente saía do slug porque
 * era dele que a cor era derivada; sem recolorização, ele só sobreviveria como
 * lembrança de um vínculo que não existe mais. Renomear custou zero — nenhuma linha
 * no banco —, e depois do seed do B5 custaria migration de dados.
 */
const SLUG = /^traje-[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * ---------------------------------------------------------------------------
 * A ÚNICA PEÇA QUE AINDA SE RECOLORE — e a lista só encolhe
 * ---------------------------------------------------------------------------
 *
 * A `traje-farda` foi desenhada **antes** da virada, no tempo em que o pedido
 * mandava pintar tudo em três tons de ciano instrumental e a esteira aplicava a cor
 * da patente por cima. O que o Doug aprovou na folha de 2026-08-12 foi o resultado
 * OLIVA, não a arte ciano.
 *
 * **Assar o oliva na arte de origem foi tentado, e reprovou duas vezes na mesma
 * rodada** — está registrado aqui porque custou o experimento:
 *
 *  1. **O Gate −1 passou a reprovar a peça.** Ele reconhece a peça pelo ciano
 *     (`mascaraDaPeca`, teste HSL puro que não olha para a base) justamente para
 *     poder julgar o boneco *fora* dela. Sem ciano, o oliva vira "o corpo foi
 *     redesenhado": **72 ladrilhos de forma, maior grupo 24**, contra teto 1.
 *  2. **A máscara encolheu 11 122 px** (90 510 → 79 388). Achatar a arte em três
 *     tons exatos aproxima o oliva do bege da base em parte do tronco, e a
 *     diferença cai abaixo dos 24 níveis. Informação perdida para sempre.
 *
 * Então o ciano fica na arte, e a cor final é **declarada aqui**. Uma linha, para
 * uma peça, com data de nascimento e sem sucessora: toda arte nova chega em cor
 * final e não entra nesta tabela. Ela é o resíduo de uma transição, não um
 * mecanismo.
 *
 * (O PNG de saída passou a ser commitado em 2026-08-13, mas continua não sendo
 * fonte canônica: quem manda é a arte, e o `--check` regera do zero a cada rodada
 * e compara. Se um dia os dois divergirem, o certo é a arte.)
 */
const COR_FINAL_DECLARADA: Record<string, string> = {
  // O oliva `#78833B` que o Doug aprovou na folha de 2026-08-12. Ele nasceu em
  // `patentes.ts` como pano do Soldado; aqui ele é só a cor desta peça, e a patente
  // não tem mais nada a ver com isso.
  "traje-farda": "#78833B",
};

const hex = (c: [number, number, number]) =>
  `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

type Rgb = [number, number, number];

const paraRgb = (h: string): Rgb => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/**
 * Clareia até a luminância alvo misturando com branco.
 *
 * `L` é linear em RGB (Rec. 601), então `c' = c + t(255 − c)` dá
 * `L' = L + t(255 − L)`, e `t = (alvo − L) / (255 − L)` acerta o alvo exato sem
 * estourar canal nenhum. Multiplicar estouraria: um pano claro × 1,55 satura os três
 * canais e vira branco, perdendo o matiz.
 */
function clarearAte(cor: Rgb, alvo: number): Rgb {
  const L = luz(cor[0], cor[1], cor[2]);
  if (alvo <= L) return cor;
  const t = Math.min(1, (alvo - L) / (255 - L));
  return cor.map((c) => Math.round(c + t * (255 - c))) as Rgb;
}

/**
 * Partição ótima da luminância em três classes — sombra, massa, luz.
 *
 * Não por limiar escolhido: um limiar fixo calibrado nesta arte não vale na
 * próxima, porque o gerador nunca devolve o mesmo tom duas vezes. Dois cortes num
 * histograma de 256 níveis, escolhidos por menor soma das variâncias internas. São
 * 32 mil combinações — exaustivo é barato e não tem mínimo local.
 */
function tresTons(lums: number[]): [number, number] {
  const hist = new Float64Array(256);
  for (const v of lums) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  const n = new Float64Array(257),
    s1 = new Float64Array(257),
    s2 = new Float64Array(257);
  for (let i = 0; i < 256; i++) {
    n[i + 1] = n[i] + hist[i];
    s1[i + 1] = s1[i] + hist[i] * i;
    s2[i + 1] = s2[i] + hist[i] * i * i;
  }
  const custo = (a: number, b: number) => {
    const c = n[b] - n[a];
    if (c <= 0) return 0;
    const m = (s1[b] - s1[a]) / c;
    return s2[b] - s2[a] - m * (s1[b] - s1[a]);
  };
  let melhor = Infinity;
  let corte: [number, number] = [85, 170];
  for (let a = 1; a < 255; a++)
    for (let b = a + 1; b < 256; b++) {
      const v = custo(0, a) + custo(a, b) + custo(b, 256);
      if (v < melhor) (melhor = v), (corte = [a, b]);
    }
  return corte;
}

export interface Peca {
  slug: string;
  /** O `.svg` que vai ao ar — o caminho de disco, a partir da raiz. */
  arte: string;
  /**
   * O recorte RGBA como PNG, **em memória e de propósito**.
   *
   * Ele foi arquivo em `public/items/traje/` até 2026-08-17, e deixou de ser quando
   * o `.svg` virou a peça do produto: um raster de 248 KB no deploy que ninguém
   * pede é peso morto, e foi ele o achado de peso que o P1 matou sem conserto.
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
  /** A cor declarada em `COR_FINAL_DECLARADA`, ou `null` se a arte já veio final. */
  recolorida: string | null;
  pixels: number;
  /** Candidatos que diferiam da base mas caíram fora do campo do traje. */
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

export async function construir(caminhoArte: string): Promise<Peca> {
  const slug = basename(caminhoArte).replace(/\.png$/i, "");
  if (!SLUG.test(slug)) {
    throw new Error(
      `slug "${slug}" fora da convenção traje-<nome> (2026-08-13). ` +
        `A patente saiu do nome quando saiu da roupa — ver doc 21 §0.7`,
    );
  }

  const e = await extrairTraje(caminhoArte);
  const recolorida = COR_FINAL_DECLARADA[slug] ?? null;

  // -------------------------------- a recolorização, SÓ para peça declarada
  //
  // Para toda peça que não está na tabela, `tinta` é a identidade: a cor que sai é a
  // que a artista pintou, sem uma conta entre a leitura e a escrita.
  let tinta: (i: number) => Rgb;
  if (!recolorida) {
    tinta = (i) => [e.arte.data[i * 3], e.arte.data[i * 3 + 1], e.arte.data[i * 3 + 2]];
  } else {
    // O traço da peça — preto que a base não tinha — vira preto puro. Ele não entra
    // na partição: um contorno preto no histograma puxaria o corte de sombra para
    // baixo e comeria a classe.
    const ESCURO = 90;
    const lumArte = (i: number) => luz(e.arte.data[i * 3], e.arte.data[i * 3 + 1], e.arte.data[i * 3 + 2]);
    const lumBase = (i: number) => luz(e.base.data[i * 3], e.base.data[i * 3 + 1], e.base.data[i * 3 + 2]);
    const ehTraco = (i: number) => lumArte(i) < ESCURO && lumBase(i) >= ESCURO;

    const lums: number[] = [];
    for (let i = 0; i < e.mascara.length; i++)
      if (e.mascara[i] && !ehTraco(i)) lums.push(lumArte(i));
    const [c1, c2] = lums.length ? tresTons(lums) : [85, 170];

    const soma: Record<string, [number, number]> = { sombra: [0, 0], massa: [0, 0], luz: [0, 0] };
    for (const v of lums) {
      const k = v < c1 ? "sombra" : v < c2 ? "massa" : "luz";
      soma[k]![0] += v;
      soma[k]![1]++;
    }
    const med = (k: string) => (soma[k]![1] ? soma[k]![0] / soma[k]![1] : 0);
    const lMassa = med("massa") || 1;

    // Sombra e luz NÃO se escolhem: saem da razão de luminância que a artista já pôs
    // na arte. Aplicá-las à cor declarada preserva o volume desenhado.
    const pano = paraRgb(recolorida);
    const lPano = luz(pano[0], pano[1], pano[2]);
    const cores: Record<string, Rgb> = {
      massa: pano,
      sombra: paraRgb(escurecer(recolorida, med("sombra") / lMassa)),
      luz: clarearAte(pano, lPano * (med("luz") / lMassa)),
      traco: [0, 0, 0],
    };
    tinta = (i) => {
      if (ehTraco(i)) return cores.traco!;
      const v = lumArte(i);
      return v < c1 ? cores.sombra! : v < c2 ? cores.massa! : cores.luz!;
    };
  }

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
      const c = tinta(i);
      const k = (yr * W + xr) * 4;
      saida[k] = c[0];
      saida[k + 1] = c[1];
      saida[k + 2] = c[2];
      saida[k + 3] = 255;
    }
  }

  mkdirSync(PASTA_TRAJE, { recursive: true });
  const raster = await sharp(saida, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const vetor = await vetorizarRecorte(saida, W, H);
  const arte = `${PASTA_TRAJE}/${slug}.svg`;
  writeFileSync(arte, vetor.svg, "utf-8");

  // ------------------------------- o controle negativo: a base contra si mesma
  const naBase = await extrairTraje(PNG_BASE);
  let controleNaBase = 0;
  for (let i = 0; i < naBase.mascara.length; i++) if (naBase.mascara[i]) controleNaBase++;

  // A dominante é medida no PNG DE SAÍDA, não na arte: numa peça recolorida a
  // dominante da arte é o ciano instrumental, que não chega à tela. `tinta.cor` é o
  // fallback chapado que o produto desenha quando o PNG falta — ele tem de ser a
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
  const dominante: Rgb = sn ? [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)] : [0, 0, 0];

  return {
    slug,
    arte,
    raster,
    formas: vetor.formas,
    cor: hex(dominante),
    recolorida,
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

async function principal() {
  const artes = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!artes.length) {
    console.error(
      "uso: npm run arte:traje -- scripts/avatar/arte/traje-<nome>.png [outra.png …]\n" +
        "     (uma ou mais; a cor é a DA ARTE — nada é recolorido desde 2026-08-13)",
    );
    process.exit(1);
  }

  let reprovou = false;
  for (const arte of artes) {
    const p = await construir(arte);
    console.log(`\nP4-T — A PEÇA DE TRAJE — ${arte}\n`);
    console.log(`  slug                ${p.slug}`);
    console.log(
      `  cor dominante       ${p.cor}   (medida no PNG de SAÍDA — vai para tinta.cor)`,
    );
    console.log(
      p.recolorida
        ? `  RECOLORIDA          para ${p.recolorida} — peça herdada do tempo do ciano ` +
            `(a única; ver COR_FINAL_DECLARADA)`
        : `  cor final da arte   nada foi recolorido — a cor é a que a artista pintou`,
    );
    console.log(
      `  recorte             px ${RECORTE.x}→${RECORTE.x + RECORTE.w} × ` +
        `${RECORTE.y}→${RECORTE.y + RECORTE.h}  =  ${RECORTE.w} × ${RECORTE.h}` +
        `   (o viewBox inteiro, 5:7)`,
    );
    console.log(`  escalaMedida        ausente de propósito → k = 1 no compositor`);
    console.log(
      `\n  A PEÇA VETORIAL — o que vai ao ar desde 2026-08-17 (P1 do plano)\n` +
        `    formas              ${p.formas}\n` +
        `    peso NO FIO         ${(p.bytesGzip / 1024).toFixed(1)} KB comprimido   ` +
        `contra ${(p.bytesRaster / 1024).toFixed(1)} KB do raster que ela substituiu ` +
        `(${(p.bytesRaster / p.bytesGzip).toFixed(1)}× menor)\n` +
        `    peso em disco       ${(p.bytes / 1024).toFixed(1)} KB crus — SVG é texto e viaja\n` +
        `                        comprimido; PNG já vem comprimido. A régua honesta é a de cima.`,
    );

    console.log(`\n  A MÁSCARA — diferença contra a base, dentro do campo do traje`);
    console.log(`    pixels da peça      ${p.pixels.toLocaleString("pt-BR")}`);
    console.log(
      `    caixa em unidades   x ${p.caixaUnidades.x0.toFixed(0)}→${p.caixaUnidades.x1.toFixed(0)}  ` +
        `y ${p.caixaUnidades.y0.toFixed(0)}→${p.caixaUnidades.y1.toFixed(0)}`,
    );
    console.log(
      `    fora do campo       ${p.foraDoCampo.toLocaleString("pt-BR")} px   ` +
        `(mudou, mas onde roupa não pode estar — feição repintada, sombra do chão, ruído)`,
    );
    console.log(`    salpico removido    ${p.salpico.toLocaleString("pt-BR")} px`);
    console.log(`    componentes soltas  ${p.descartadas} descartada(s) abaixo de 5% da maior`);

    console.log(`\n  O CONTROLE NEGATIVO — a régua aplicada à PRÓPRIA base`);
    const okControle = p.controleNaBase === 0;
    if (!okControle) reprovou = true;
    console.log(
      `    peça achada na base ${p.controleNaBase} px   ` +
        `${okControle ? "· confere (a base não veste nada)" : "✗ A RÉGUA INVENTA PEÇA"}`,
    );

    console.log(
      `\n  fora do recorte     ${p.foraDoRecorte} px` +
        (p.foraDoRecorte ? `   ✗ a peça sai do viewBox — seria cortada` : `   · nada perdido`),
    );
    console.log(`  escrito             ${p.arte}`);
    if (p.foraDoRecorte) reprovou = true;
    if (p.pixels === 0) {
      reprovou = true;
      console.log(`\n  ✗ a peça saiu VAZIA — a arte não difere da base dentro do campo do traje`);
    }
  }

  if (reprovou) {
    console.error(
      `\n✗ A extração não fecha. Não siga para o literal: o PNG na tela não é a arte\n` +
        `  que o Doug aprovou. Peça achada na base quer dizer régua inventando; pixel\n` +
        `  fora do recorte quer dizer arte fora do viewBox; peça vazia quer dizer que a\n` +
        `  arte não mudou nada onde uma roupa poderia estar.`,
    );
    process.exit(1);
  }
}

if (process.argv[1] && basename(process.argv[1]) === "traje.ts") {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
