/**
 * A REGIÃO DE OCLUSÃO — o que um chapéu CONTÉM, derivada da arte e corrigível à mão.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA QUE A MÁQUINA RESPONDE
 * ---------------------------------------------------------------------------
 *
 * `escondeCabelo` (`tipos.ts`) é uma REGIÃO e não um enum: acima dela o chapéu
 * contém o cabelo, abaixo dela o cabelo sai inteiro — franja, costeleta, rabo,
 * trança. A máquina propõe a região a partir do alfa da própria peça; a mão do
 * Doug a corrige onde o julgamento é de forma e não de medida.
 *
 * A proposta da máquina tem DUAS metades, e a segunda nasceu um dia depois da
 * primeira porque ninguém tinha medido o lado:
 *
 *  1. **para cima** — *"tudo acima do pixel mais baixo da coluna"*. Fecha o cabelo
 *     que atravessa o chapéu: escape médio de **5,62% para 0,12%** nos 171 pares;
 *  2. **para os lados** — *"tudo ao lado da peça, acima do ponto mais largo dela,
 *     de cada lado"*. Fecha o cabelo que estoura o chapéu: **43 868 px** nos mesmos
 *     171 pares, por 333 px de borda de corte. Ver o comentário longo em
 *     `medirOclusao`.
 *
 * ⚠️ **A metade 1 sozinha é cega para o lado, por construção.** Onde o chapéu não
 * tem tinta, `limite[x] = -1` e não há linha nenhuma naquela coluna. Foi assim que a
 * `boina` passou um dia inteiro deixando 78 247 px de cabelo à direita com a régua
 * do par jurando que estava limpo — ela media a mesma coisa que a metade 1.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA É TRAÇADA, E NÃO UM PERFIL POR COLUNA
 * ---------------------------------------------------------------------------
 *
 * A primeira versão emitia só a fronteira DE BAIXO e fechava o caminho no topo do
 * quadro. Duas consequências, e a segunda é que derrubou o desenho:
 *
 *  1. o `d` saía com 243 B — barato;
 *  2. **no extremo em x do chapéu o caminho subia reto por ~265 u.** Ali a peça tem
 *     só a ponta da aba, e cabelo que passasse por aquela coluna era cortado numa
 *     vertical perfeita, com trecho de cor chapada contra o fundo, sem contorno.
 *     Medido: `dreadlocks` + `bone` cortado em x 57–63 contra a borda da oclusão em
 *     **55,4**; `elvis` + `touca-de-la` em x 459–461 contra **462,1**. Três cabelos
 *     de forma completamente diferente cortando no mesmo x — assinatura de esteira,
 *     não de arte.
 *
 * Um perfil por coluna **não consegue** descrever um topo que afina: ele é, por
 * definição, "daqui para cima". Só uma região com as DUAS fronteiras consegue — e
 * região se emite traçando. Custa ~1,3 a 2,5 KB por chapéu, contra folga de 10 KB
 * no `ORCAMENTO_COM_CHAPEU`.
 *
 * ⚠️ **Duas construções alternativas foram medidas e caíram**, e ficam escritas
 * para ninguém repropor:
 *
 *  - **a região de alcance** (*"dá para chegar aqui vindo de baixo sem atravessar o
 *    chapéu?"*) é **no-op**: os px ocultos batem com a massa do próprio chapéu
 *    (`bone`: 96 862 = 96 862). A maré contorna a peça pelas bordas do quadro e não
 *    oclui nada além do que já é opaco;
 *  - **limitar a proposta às colunas do crânio** piora: a borda de corte contra o
 *    fundo vai de 6 243 para **12 948 px**, porque a parede migra para a borda do
 *    crânio, onde há mais cabelo.
 *
 * A terceira tentativa não foi feita de propósito: seria escolher forma pela régua.
 * O que resolve isso é a mão, e é para ela que serve a correção abaixo.
 *
 * ---------------------------------------------------------------------------
 * A CORREÇÃO À MÃO — ENTRADA DA ESTEIRA, NUNCA SAÍDA
 * ---------------------------------------------------------------------------
 *
 * `oclusao/<slug>.png` é opcional e mora ao lado da arte. Ela é **mais uma
 * entrada**, como o `.png` da peça: a esteira lê máquina + mão e produz o `d`.
 *
 * É isso que mantém `chapeus-da-arte.ts` sendo arquivo GERADO. Se a pincelada
 * substituísse o `d` no catálogo, o `arte:chapeus --check` brigaria com o Doug a
 * cada regeração — e apagar o PNG não voltaria ao estado anterior. Assim volta.
 *
 * O vocabulário é de duas cores, e serve tanto ao editor do navegador quanto a um
 * editor externo:
 *
 * | pincel | pixel | efeito |
 * |---|---|---|
 * | **esconder** | verde (G > R) | entra na região: o chapéu passa a conter |
 * | **mostrar** | vermelho (R > G) | sai da região: o cabelo volta a aparecer |
 * | — | transparente | a máquina decide, como sempre |
 */

import { existsSync, readFileSync } from "fs";

import sharp from "sharp";

import { CAIXA_DA_ARTE } from "../../../src/lib/avatar/estilo/geometria";
import { tracar, paraUnidades } from "./barba-para-formas";
import { ESCALA, LADO, ORIGEM } from "./base";

/** O mesmo piso de "este pixel existe" que o resto da esteira usa. */
const ALFA = 8;

/** Onde a mão do Doug mora. Opcional: sem o arquivo, a máquina decide sozinha. */
export const PASTA_CORRECAO = "scripts/avatar/arte/oclusao";

export const caminhoDaCorrecao = (slug: string) => `${PASTA_CORRECAO}/${slug}.png`;

/**
 * Onde o raster da arte cai no canvas de 1024 — derivado, nunca escrito.
 *
 * `tracar` e `paraUnidades` (de `barba-para-formas.ts`) falam em pixels do canvas de
 * edição. A arte cobre a `CAIXA_DA_ARTE`, que começa em (−75, −75); em canvas isso é
 * (122, 2). Escrever esses dois números à mão seria a segunda descrição da mesma
 * transformação, que é o defeito nº 1 desta esteira.
 */
export const OFFSET = {
  x: Math.round(ORIGEM.x + ESCALA * CAIXA_DA_ARTE.x),
  y: Math.round(ORIGEM.y + ESCALA * CAIXA_DA_ARTE.y),
} as const;

export interface Oclusao {
  /** A região, no raster da arte. 1 = o chapéu contém. */
  regiao: Uint8Array;
  w: number;
  h: number;
  /** Quantos px a mão mudou, nos dois sentidos. Zero sem arquivo de correção. */
  correcao: { escondeu: number; mostrou: number };
  /** A checagem da construção alternativa — ver `conferirOclusao`. */
  ingenuo: Int32Array;
  limite: Int32Array;
}

/** Lê o `<image>` que o `.svg` da peça carrega e devolve o alfa como máscara. */
async function mascaraDaArte(svgDaPeca: string): Promise<{ m: Uint8Array; w: number; h: number }> {
  const emb = svgDaPeca.match(/href="data:image\/(?:webp|png);base64,([^"]+)"/);
  if (!emb) {
    throw new Error("o `.svg` da peça não traz `<image>` base64 — a esteira mudou de formato");
  }
  const r = await sharp(Buffer.from(emb[1], "base64"))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = r.info;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (r.data[i * channels + 3] >= ALFA) m[i] = 1;
  return { m, w, h };
}

/**
 * A REGIÃO, com a correção já aplicada.
 *
 * `correcaoPng` entra como Buffer para o editor do navegador poder passar a
 * pincelada sem gravar arquivo — é o que faz a prévia dele ser o produto, e não uma
 * aproximação. A esteira passa o arquivo do disco pelo mesmo caminho.
 */
export async function medirOclusao(svgDaPeca: string, correcaoPng?: Buffer): Promise<Oclusao> {
  const { m: chapeu, w, h } = await mascaraDaArte(svgDaPeca);

  // A PROPOSTA DA MÁQUINA: por coluna, tudo acima do pixel mais baixo com tinta.
  const limite = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    for (let y = h - 1; y >= 0; y--) {
      if (chapeu[y * w + x]) {
        limite[x] = y;
        break;
      }
    }
  }
  const regiao = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y <= limite[x]; y++) regiao[y * w + x] = 1;
  }

  // ---------------------------------------------------------------------------
  // A SEGUNDA METADE DA REGIÃO: O QUE ESTÁ AO LADO DA PEÇA, ACIMA DO PONTO MAIS
  // LARGO DELA.
  // ---------------------------------------------------------------------------
  //
  // A proposta acima só sabe olhar PARA CIMA, e foi cega por um dia inteiro: onde o
  // chapéu não tem tinta, `limite[x] = -1` e nada é contido. **Cabelo AO LADO do
  // chapéu passava inteiro** — e é o defeito que o Doug via na `boina` enquanto a
  // régua jurava que estava limpo.
  //
  // A regra é do desenho, não de constante: **abaixo do ponto mais largo de cada
  // lado a aba está ABRINDO**, e cabelo que aparece ali é cabelo saindo por baixo do
  // chapéu — que é o que todo chapéu de verdade deixa. **Acima dele o chapéu está
  // sobre a cabeça**, e cabelo por fora é cabelo mais largo que o chapéu.
  //
  // Os dois lados têm ponto mais largo próprio, e é isso que faz a regra servir a
  // peça torta: na `boina` o lado esquerdo é mais largo em y 208 e o direito em
  // y 69, porque ela pende. Uma linha só, comum aos dois lados, comeria o lado
  // baixo ou pouparia o alto.
  //
  // Medido nos 171 pares: fecha **43 868 px** de cabelo estourando o chapéu por
  // **333 px** de borda de corte contra o fundo, e **0 px** contra a pele. A
  // alternativa de constante de cabeça (*"tudo que está ao lado acima de meia
  // cabeça"*) come 266 282 px — seis vezes mais, e a maior parte é cabelo legítimo
  // ao lado do rosto — por 3 598 px de borda. Fica descartada.
  const esq = new Int32Array(h).fill(-1);
  const dir = new Int32Array(h).fill(-1);
  let larguraEsq = w;
  let larguraDir = -1;
  let linhaEsq = -1;
  let linhaDir = -1;
  for (let y = 0; y < h; y++) {
    const base = y * w;
    for (let x = 0; x < w; x++) {
      if (!chapeu[base + x]) continue;
      if (esq[y] < 0) esq[y] = x;
      dir[y] = x;
    }
    if (esq[y] < 0) continue;
    // `<=` e `>=` de propósito: no empate fica a linha MAIS BAIXA, que é onde a aba
    // termina de abrir. Com `<` estrito, uma aba de lado reto guardaria a linha do
    // topo dela e a regra comeria a aba inteira.
    if (esq[y] <= larguraEsq) {
      larguraEsq = esq[y];
      linhaEsq = y;
    }
    if (dir[y] >= larguraDir) {
      larguraDir = dir[y];
      linhaDir = y;
    }
  }
  for (let y = 0; y < h; y++) {
    if (esq[y] < 0) continue;
    const base = y * w;
    if (y <= linhaEsq) for (let x = 0; x < esq[y]; x++) regiao[base + x] = 1;
    if (y <= linhaDir) for (let x = dir[y] + 1; x < w; x++) regiao[base + x] = 1;
  }

  // A ALTERNATIVA, medida a cada peça para `conferirOclusao` comparar. Ver o topo.
  const exposto = new Uint8Array(w * h);
  for (let y = h - 1; y >= 0; y--) {
    const base = y * w;
    for (let x = 0; x < w; x++) {
      if (chapeu[base + x]) continue;
      if (y === h - 1 || exposto[base + w + x]) exposto[base + x] = 1;
    }
    for (let x = 1; x < w; x++) if (!chapeu[base + x] && exposto[base + x - 1]) exposto[base + x] = 1;
    for (let x = w - 2; x >= 0; x--) if (!chapeu[base + x] && exposto[base + x + 1]) exposto[base + x] = 1;
  }
  const ingenuo = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    for (let y = h - 1; y >= 0; y--) {
      if (!exposto[y * w + x]) {
        ingenuo[x] = y;
        break;
      }
    }
  }

  const correcao = { escondeu: 0, mostrou: 0 };
  if (correcaoPng) {
    const c = await sharp(correcaoPng)
      .resize(w, h, { fit: "fill", kernel: "nearest" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ch = c.info.channels;
    for (let i = 0; i < w * h; i++) {
      const k = i * ch;
      if (c.data[k + 3] < ALFA) continue;
      const vermelho = c.data[k];
      const verde = c.data[k + 1];
      if (verde > vermelho) {
        if (!regiao[i]) correcao.escondeu++;
        regiao[i] = 1;
      } else if (vermelho > verde) {
        if (regiao[i]) correcao.mostrou++;
        regiao[i] = 0;
      }
    }
  }

  return { regiao, w, h, correcao, ingenuo, limite };
}

/** A esteira lê a correção do disco; o editor passa a dele em memória. */
export async function medirOclusaoDoSlug(slug: string, svgDaPeca: string): Promise<Oclusao> {
  const arq = caminhoDaCorrecao(slug);
  return medirOclusao(svgDaPeca, existsSync(arq) ? readFileSync(arq) : undefined);
}

/**
 * Quantas colunas a construção alternativa discorda da proposta da máquina.
 *
 * Enquanto der 0, a nota do topo continua sendo verdade; no dia em que der outra
 * coisa, a peça nova tem enfeite pendurado com vão acima e o relatório precisa
 * dizer isso em voz alta. Mede a PROPOSTA, nunca a região corrigida — a mão do
 * Doug não é defeito de máquina e não deve acionar aviso de máquina.
 */
export function conferirOclusao(o: Oclusao): { colunas: number; maiorEmU: number } {
  const uY = (y: number) => CAIXA_DA_ARTE.y + ((y + 0.5) / o.h) * CAIXA_DA_ARTE.h;
  let colunas = 0;
  let maiorEmU = 0;
  for (let x = 0; x < o.w; x++) {
    if (o.limite[x] === o.ingenuo[x]) continue;
    colunas++;
    const d = Math.abs(uY(o.limite[x]) - uY(o.ingenuo[x]));
    if (d > maiorEmU) maiorEmU = d;
  }
  return { colunas, maiorEmU };
}

/**
 * A região em `d`, pronta para `escondeCabelo`.
 *
 * Traçada pelo MESMO `potrace` que produz as peças, com os mesmos parâmetros — uma
 * segunda configuração de traçado neste repositório seria uma segunda descrição de
 * "como uma máscara vira caminho".
 *
 * Devolve `undefined` quando a região está vazia: peça que não contém nada não
 * declara o campo, e ausente é o comportamento histórico, byte a byte.
 */
export async function linhaDeOclusao(o: Oclusao): Promise<string | undefined> {
  let algum = false;
  for (let i = 0; i < o.regiao.length && !algum; i++) if (o.regiao[i]) algum = true;
  if (!algum) return undefined;

  const canvas = new Uint8Array(LADO * LADO);
  for (let y = 0; y < o.h; y++) {
    const cy = y + OFFSET.y;
    if (cy < 0 || cy >= LADO) continue;
    for (let x = 0; x < o.w; x++) {
      if (!o.regiao[y * o.w + x]) continue;
      const cx = x + OFFSET.x;
      if (cx < 0 || cx >= LADO) continue;
      canvas[cy * LADO + cx] = 1;
    }
  }
  return paraUnidades(await tracar(canvas, LADO, LADO));
}

/** A esteira inteira, de um `.svg` de peça ao `d` — o que `chapeus.ts` chama. */
export async function oclusaoDoSvg(
  slug: string,
  caminho: string,
): Promise<{
  d: string | undefined;
  divergencia: { colunas: number; maiorEmU: number };
  correcao: { escondeu: number; mostrou: number };
}> {
  const o = await medirOclusaoDoSlug(slug, readFileSync(caminho, "utf-8"));
  return { d: await linhaDeOclusao(o), divergencia: conferirOclusao(o), correcao: o.correcao };
}
