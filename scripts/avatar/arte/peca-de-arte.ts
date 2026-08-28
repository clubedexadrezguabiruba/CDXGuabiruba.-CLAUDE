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
 * O RECORTE É A `CAIXA_DA_ARTE` INTEIRA, EM TODO SLOT — e isso é amarra
 * ---------------------------------------------------------------------------
 *
 * `tintaTronco()` e o ramo novo de `sobrepor()` emitem `<image>` ocupando a
 * `CAIXA_DA_ARTE` inteira com `k = 1`. O recorte é o mesmo retângulo em pixels —
 * px 212→812 × 2→932, que mede 600 × 930 —, e `preserveAspectRatio` encaixa
 * 1 : 1 sem sobra em nenhum eixo.
 *
 * **A colagem é conta, não ajuste**, e manter isso vale mais que economizar bytes
 * num slot: um recorte próprio por slot seria um segundo sistema de coordenadas
 * atravessando a rota, que é exatamente o que `base-tronco.ts` recusou em 2026-08-13.
 * O recorte **cresceu**; o sistema continua sendo um só, e `RECORTE` deriva da caixa
 * em vez de espelhá-la.
 *
 * ⚠️ **A caixa era o `viewBox`, e o parágrafo que ficava aqui dizia que peça acima
 * de `y = 0` saía "medida, não colada", esperando a Frente B.** A medição de
 * 2026-08-24 mostrou que o `viewBox` não era o gargalo: o quadro já mostrava 114,6
 * unidades acima da coroa e a **colagem** só alcançava 39,5 — 12,6% de uma altura de
 * cabeça, e é isso que não deixava chapéu existir. A caixa subiu para −75, o chapéu
 * ganhou 3× de teto, e o `viewBox` não foi tocado. Ver `CAIXA_DA_ARTE`
 * (`src/lib/avatar/estilo/geometria.ts`).
 */

import { mkdirSync, writeFileSync } from "fs";
import { basename } from "path";
import { gzipSync } from "zlib";

import sharp from "sharp";
import { ColorMode, Hierarchical, PathSimplifyMode, vectorize } from "@neplex/vectorizer";

import { prepararSvg } from "../estilo/vtracer";
import { CAIXA_DA_ARTE } from "../../../src/lib/avatar/estilo/geometria";
import { ESCALA, LADO, ORIGEM, PNG_BASE, paraUnidade } from "./base";
import { type ExtracaoPorCampo, extrairPorCampo } from "./extrair";

/**
 * O recorte: a `CAIXA_DA_ARTE` inteira, em pixels da base de edição. Ver o topo.
 *
 * **DERIVADO, nunca escrito.** A caixa mora em `geometria.ts` porque é o compositor
 * quem cola; aqui ela só é convertida para pixel pela mesma `ESCALA`/`ORIGEM` que
 * toda a rota usa. Os quatro números saem inteiros — x 212, y **2**, w 600, h **930**
 * —, e é essa exatidão que decidiu o −75 lá (92 − 75 × 1,2 = 2).
 */
export const RECORTE = {
  x: Math.round(ORIGEM.x + CAIXA_DA_ARTE.x * ESCALA),
  y: Math.round(ORIGEM.y + CAIXA_DA_ARTE.y * ESCALA),
  w: Math.round(CAIXA_DA_ARTE.w * ESCALA),
  h: Math.round(CAIXA_DA_ARTE.h * ESCALA),
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
 * O RECORTE RGBA VIRANDO `.svg` COM UM `<image>` DENTRO — o braço RASTER.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA PEÇA DE COR ASSADA NÃO PRECISA SER VETOR
 * ---------------------------------------------------------------------------
 *
 * O traçado existia para uma coisa: dar ao compositor um `d` que ele pudesse pintar
 * com token de cor. Peça de cor ASSADA não é pintada por ninguém — ela chega pronta
 * do desenho, e o compositor só a cola. Vetorizá-la é converter um raster em milhares
 * de polígonos chapados **para imitar de volta o degradê que o raster já tinha**.
 *
 * Medido em 2026-08-20 (`.scratch/estilo/_preco-do-traje.ts`):
 *
 *   peça             vetor (paths)      raster WEBP q82
 *   traje-gambesao   228,2 KB / 530     **15,1 KB**   (15× menor)
 *   traje-farda       28,7 KB           **16,9 KB**
 *
 * E o ganho não é só peso: o vetor perde tom pelo mesmo motivo que a barba perdia —
 * quantização em cores chapadas. O raster carrega o desenho inteiro.
 *
 * **O invólucro continua sendo `.svg`, e isso não é cerimônia.** É o que mantém uma
 * colagem só: `colarArte()` no compositor serve traje, chapéu, óculos e pet pelo
 * mesmo `<image>` com o mesmo `viewBox` de 600 × 840, e trocar a extensão por peça
 * abriria um segundo caminho de colagem para a primeira divergência acontecer.
 *
 * ⚠️ **Só para arte NOVA.** `traje-farda` e `traje-gambesao` estão congeladas no
 * vetor — já foram aprovadas pelo Doug, e o ganho delas seria de custo e não de
 * qualidade visível. A trava mecânica disso é `CONGELADAS_NO_VETOR` em `traje.ts`,
 * e ela precisa ser mecânica porque `arte:trajes --check` reescreve os `.svg`.
 */
export async function embrulharRaster(
  rgba: Buffer,
  w: number,
  h: number,
): Promise<{ svg: string; bytes: number }> {
  // Alfa preservado — é ele que recorta a peça, e o WEBP carrega alfa nativo. (O
  // braço vetor precisa da sentinela magenta porque o VTracer é cego a alfa; aqui
  // não há traçador, então não há o que enganar.)
  const webp = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: QUALIDADE_WEBP })
    .toBuffer();

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ` +
      `width="${w}" height="${h}">` +
      `<image href="data:image/webp;base64,${webp.toString("base64")}" ` +
      `x="0" y="0" width="${w}" height="${h}"/></svg>`,
    bytes: webp.length,
  };
}

/**
 * A qualidade do WEBP da peça de cor assada. **82, e é o número da medição.**
 *
 * Foi a que produziu os 15,1 KB do gambesão contra 228,2 KB de paths — a comparação
 * que decidiu o braço. Subir para 90 devolve bytes sem devolver desenho que o olho
 * distinga a 425 px; descer para 70 começa a sujar a borda da peça, que é onde o
 * traço preto do gerador mora e onde o olho do Doug vai primeiro.
 */
const QUALIDADE_WEBP = 82;

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
  /**
   * O QUE UM FURO CERCADO PODE TER DENTRO PARA CONTINUAR ABERTO — e é o vão da lente.
   *
   * ---------------------------------------------------------------------------
   * A ESTEIRA TONAL JÁ TINHA ESTA REGRA; A RASTER NÃO TINHA
   * ---------------------------------------------------------------------------
   *
   * `taparFurosCercados` tapa todo vão que não alcança a borda, porque *peça é
   * figurinha, opaca por dentro*. Isso é certo para toca, túnica e aba — e é
   * **errado para óculos**, cuja peça é definida pelos dois vãos que ela cerca.
   *
   * Medido no primeiro óculos, em 2026-08-27, com o campo já excluindo a cápsula do
   * olho e a espinha da boca:
   *
   * | | com a regra | sem ela |
   * |---|---|---|
   * | furos tapados | (o vão fica aberto) | **23 038 px** |
   * | cor dominante da peça | a armação | **`#E6AB7A` — PELE** |
   * | anel em volta dos olhos | aberto | **98,1% opaco** |
   *
   * O campo sozinho não basta, e o número acima é o porquê: a cápsula do olho tem
   * 38 × 83 u e o vão da lente é muito maior que ela. Proteger a feição deixa o
   * RESTO do vão ser assado — e o que é assado ali é a pele e o olho da base de
   * edição, não a pele que o aluno escolheu. A peça chegaria ao produto com um
   * retrato da base dentro de cada lente.
   *
   * A esteira que RECOLORE já resolvia isto desde 2026-08-22, e com esta mesma
   * régua: `construirPecaTonal` conta `janelasDeFeicao` e deixa aberto o furo que
   * contém feição (`barba-para-formas.ts`, passo 2c). O que entra aqui não é regra
   * nova — é a mesma regra, do outro lado da bifurcação da Regra Inviolável nº 4.
   *
   * ⚠️ **Ela é OPCIONAL, e isso é o que a torna inerte para quem já foi aprovado.**
   * Traje e chapéu não a declaram, então `taparFurosCercados` recebe `undefined` e
   * roda o laço de sempre — nenhum byte dos `.svg` no ar pode mudar, e não por
   * medição feita depois, e sim por construção. `arte:trajes --check` e
   * `arte:chapeus --check` são a prova, e estão no `verify:arte`.
   */
  janela?: (x: number, y: number, slug: string) => boolean;
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
  /** Por qual braço ela saiu. No `raster`, `formas` é 0 e não é falta de dado. */
  formato: FormatoDaPeca;
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
  /**
   * Pixels de furo CERCADO que a esteira tapou com a tinta da própria arte.
   *
   * Não é erro nem é sempre zero: é o preço de a extração ser diferença contra a
   * base. Ver `taparFurosCercados`. Alto (dezenas de milhares) quer dizer que a
   * peça foi pintada numa cor perto da que estava atrás dela.
   */
  furosTapados: number;
  /**
   * Vãos que a peça cerca e deixou ABERTOS — a lente do óculos, e nada mais hoje.
   *
   * Sem `SlotDeArte.janela` ele é sempre 0, porque o tapa-furo não deixa vão nenhum
   * de pé: é o valor certo para toca, aba e túnica, e é o valor que traje e chapéu
   * medem. Para o óculos o esperado é **2**, e 0 ali quer dizer peça cega.
   */
  janelasAbertas: number;
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

/**
 * COMO A PEÇA CHEGA AO AR — e a bifurcação é do SLUG, nunca desta função.
 *
 * `vetor` traça o recorte em paths; `raster` embrulha o recorte num `<image>` WEBP.
 * Os dois escrevem o MESMO `.svg` no MESMO lugar, com o mesmo `viewBox` — é o que
 * mantém `colarArte()` sendo uma conta só.
 *
 * Quem escolhe é quem sabe da peça: `formatoDoTraje()` em `traje.ts`, porque a
 * escolha é "esta arte é nova, ou já foi aprovada no vetor?" — e isso é história do
 * catálogo, não propriedade da esteira.
 */
export type FormatoDaPeca = "vetor" | "raster";

/**
 * TAPAR FURO CERCADO — a peça é figurinha, e figurinha é opaca por dentro.
 *
 * ---------------------------------------------------------------------------
 * O QUE É UM FURO CERCADO, E POR QUE ELE NUNCA É DESENHO
 * ---------------------------------------------------------------------------
 *
 * A extração é *diferença contra a base*: entra na máscara o pixel que difere em
 * mais de `NIVEL_TRAJE` = 24 níveis. Isso responde bem "onde a artista pintou?" e
 * responde MAL uma pergunta específica — **e se ela pintou uma cor parecida com a
 * que já estava lá?**
 *
 * O caso que abriu esta função, medido na `chapeu-toca-de-cozinha` em 2026-08-25:
 *
 * | | |
 * |---|---|
 * | a copa da toca, pintada | `rgb(240,245,249)` — branco |
 * | o fundo da base, atrás dela | `rgb(251,248,245)` — bege |
 * | diferença mediana | **11** — o corte é 24 |
 *
 * **40 238 px da copa — 34,2% da peça — não entraram na máscara.** Não porque a
 * artista tenha deixado vão: porque branco sobre bege quase não difere. O `.svg`
 * saiu vazado, e o vazamento era invisível só porque o fundo da PÁGINA é do mesmo
 * bege. Renderizado sobre magenta, 22 905 px do casco continuavam magenta.
 *
 * A lei do projeto já resolvia isto e ninguém a tinha escrito em código: **peça é
 * figurinha, opaca por dentro** — furo na silhueta é falha da esteira, não arte
 * (`arte:figurinha` mede o mesmo defeito nas peças de cabelo e rosto).
 *
 * ---------------------------------------------------------------------------
 * CERCADO É O ADJETIVO QUE FAZ ISTO SER MEDIDA E NÃO DESENHO
 * ---------------------------------------------------------------------------
 *
 * Só é tapado o vazio que **não alcança a borda do canvas por caminho nenhum**. Um
 * vão que se abre para fora — a fresta entre o braço e o tronco de uma túnica, o
 * buraco do meio de uma rosquinha que encoste na borda — continua aberto, porque
 * ele se comunica com o lado de fora e o algoritmo o vê como lado de fora.
 *
 * E a cor com que se tapa **não é inventada**: o laço de `construirPeca` pinta todo
 * pixel de máscara com `tinta.aplicar(i)`, que lê a arte da artista naquele pixel.
 * O que estava lá é o que sai. Tapar aqui é *reconhecer* tinta que a régua não viu,
 * o mesmo gesto que o `restaurar-peca` faz do outro lado.
 *
 * ---------------------------------------------------------------------------
 * O RESPINGO NAS PEÇAS APROVADAS, MEDIDO ANTES DE ACEITAR
 * ---------------------------------------------------------------------------
 *
 * | peça | máscara | furo cercado | maior furo |
 * |---|---|---|---|
 * | `traje-farda` | 90 510 px | **196 px (0,2%)** | 101 px |
 * | `traje-gambesao` | 113 538 px | **1 001 px (0,9%)** | 991 px |
 * | `chapeu-toca-de-cozinha` | 77 249 px | **40 238 px (34,2%)** | 22 565 px |
 *
 * As duas aprovadas mudam, e mudam pouco: furo de menos de 1% em tamanho de
 * alfinete é o mesmo ruído de reencode que a rota já persegue. **O respingo no
 * render está medido em `ESTADO-DA-ROTA.md`** — a regra é medir antes de aceitar,
 * nunca aceitar e medir depois.
 *
 * ⚠️ **Ele NÃO é silencioso.** O número volta em `Peca.furosTapados` e os P5
 * imprimem. Descarte — e remendo — em silêncio é o modo de falha que esta rota
 * inteira existe para fechar.
 */
export function taparFurosCercados(
  mascara: Uint8Array,
  w: number,
  h: number,
  noCampo: (i: number) => boolean,
  /**
   * O furo que contém isto fica ABERTO — o vão da lente. Ver `SlotDeArte.janela`.
   *
   * Ausente é o modo de sempre: o laço não muda de forma, e traje e chapéu saem byte
   * a byte iguais. É o que faz esta regra nascer inerte para quem já foi aprovado.
   */
  janela?: (i: number) => boolean,
): number {
  // O lado de FORA: o vazio conexo à borda do canvas, por varredura em pilha.
  const fora = new Uint8Array(mascara.length);
  const pilha: number[] = [];
  const empilhar = (i: number) => {
    if (!mascara[i] && !fora[i]) {
      fora[i] = 1;
      pilha.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    empilhar(x);
    empilhar((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    empilhar(y * w);
    empilhar(y * w + w - 1);
  }
  while (pilha.length) {
    const i = pilha.pop() as number;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) empilhar(i - 1);
    if (x < w - 1) empilhar(i + 1);
    if (y > 0) empilhar(i - w);
    if (y < h - 1) empilhar(i + w);
  }

  // O que sobrou — vazio que não é fora — é furo. O campo do slot continua
  // mandando: tapar não é licença para a peça crescer para onde ela não pode ir.
  //
  // SEM `janela`, o laço é o de sempre e nada mais precisa ser dito.
  if (!janela) {
    let tapados = 0;
    for (let i = 0; i < mascara.length; i++) {
      if (mascara[i] || fora[i]) continue;
      if (!noCampo(i)) continue;
      mascara[i] = 1;
      tapados++;
    }
    return tapados;
  }

  // COM `janela`, a pergunta passa a ser POR FURO e não por pixel: um vão que contém
  // feição fica aberto INTEIRO. Perguntar por pixel deixaria a cápsula do olho aberta
  // e o resto do vão da lente assado — foram os 23 038 px medidos no primeiro óculos.
  const visto = new Uint8Array(mascara.length);
  let tapados = 0;
  for (let semente = 0; semente < mascara.length; semente++) {
    if (mascara[semente] || fora[semente] || visto[semente]) continue;
    visto[semente] = 1;
    const furo: number[] = [];
    const pilha2 = [semente];
    let temJanela = false;
    while (pilha2.length) {
      const i = pilha2.pop() as number;
      furo.push(i);
      if (janela(i)) temJanela = true;
      const x = i % w;
      const y = (i / w) | 0;
      for (const q of [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1,
      ])
        if (q >= 0 && !mascara[q] && !fora[q] && !visto[q]) {
          visto[q] = 1;
          pilha2.push(q);
        }
    }
    if (temJanela) continue;
    for (const i of furo) {
      if (!noCampo(i)) continue;
      mascara[i] = 1;
      tapados++;
    }
  }
  return tapados;
}

/**
 * QUANTOS VÃOS A PEÇA CERCA E DEIXOU ABERTOS — contados no RESULTADO, não no caminho.
 *
 * O número podia sair de dentro de `taparFurosCercados`, que já sabe quantos furos
 * pulou. Sai daqui de propósito: ali ele seria a contagem do que o algoritmo *quis*
 * fazer, e aqui é a contagem do que a máscara *ficou*. Quando as duas discordam, é a
 * segunda que está certa — a lição de medir o render e não a arte.
 *
 * Para o óculos ele tem valor esperado: **2**, um por lente. Zero quer dizer peça
 * cega, e é o defeito que `SlotDeArte.janela` existe para não deixar acontecer.
 */
export function janelasAbertas(mascara: Uint8Array, w: number, h: number): number {
  const fora = new Uint8Array(mascara.length);
  const pilha: number[] = [];
  const empilhar = (i: number) => {
    if (!mascara[i] && !fora[i]) {
      fora[i] = 1;
      pilha.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    empilhar(x);
    empilhar((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    empilhar(y * w);
    empilhar(y * w + w - 1);
  }
  while (pilha.length) {
    const i = pilha.pop() as number;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) empilhar(i - 1);
    if (x < w - 1) empilhar(i + 1);
    if (y > 0) empilhar(i - w);
    if (y < h - 1) empilhar(i + w);
  }

  const visto = new Uint8Array(mascara.length);
  let quantas = 0;
  for (let semente = 0; semente < mascara.length; semente++) {
    if (mascara[semente] || fora[semente] || visto[semente]) continue;
    quantas++;
    visto[semente] = 1;
    const p = [semente];
    while (p.length) {
      const i = p.pop() as number;
      const x = i % w;
      const y = (i / w) | 0;
      for (const q of [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1,
      ])
        if (q >= 0 && !mascara[q] && !fora[q] && !visto[q]) {
          visto[q] = 1;
          p.push(q);
        }
    }
  }
  return quantas;
}

export async function construirPeca(
  caminhoArte: string,
  slot: SlotDeArte,
  fabricaDeTinta?: FabricaDeTinta,
  formato: FormatoDaPeca = "vetor",
): Promise<Peca> {
  const slug = slugDaArte(caminhoArte);
  if (!slot.slug.test(slug)) {
    throw new Error(
      `slug "${slug}" fora da convenção do slot ${slot.nome} (${slot.slug.source}). ` +
        `O nome do arquivo de arte É o slug do catálogo — ver doc 19 §12`,
    );
  }

  const e = await extrairPorCampo(caminhoArte, slot.campo);

  // A peça é figurinha: furo cercado pela própria peça é falha da régua, não vão
  // desenhado. Ver o docstring de `taparFurosCercados` — e o número volta em
  // `furosTapados`, porque remendo em silêncio é tão ruim quanto descarte em
  // silêncio.
  const furosTapados = taparFurosCercados(e.mascara, LADO, LADO, (i) => {
    const u = paraUnidade(i % LADO, Math.floor(i / LADO));
    return slot.campo(u.x, u.y);
  }, slot.janela && ((i) => {
    const u = paraUnidade(i % LADO, Math.floor(i / LADO));
    // O SLUG VAI JUNTO desde 2026-08-28, e é o que permite exceção POR PEÇA em vez
    // de regra de slot. O `aviator` tem um vão entre as lentes que nenhuma outra
    // armação tem; uma regra de slot para abri-lo mexeria nas cinco — foi tentado,
    // e reabriu poeira em três peças que estavam aprovadas.
    return slot.janela!(u.x, u.y, slug);
  }));
  const janelas = janelasAbertas(e.mascara, LADO, LADO);

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

  // A BIFURCAÇÃO. No raster não há traçador, então não há forma: `formas` sai 0, e
  // isso é o dado certo — `<image>` não é forma, e os contadores de orçamento do
  // projeto já o excluem (`/(path|ellipse|rect|circle|use)/`, `cabelo.ts`).
  const embrulhado = formato === "raster" ? await embrulharRaster(saida, W, H) : null;
  const vetor = embrulhado ? null : await vetorizarRecorte(saida, W, H);
  const svg = embrulhado ? embrulhado.svg : vetor!.svg;
  const arte = `${slot.pasta}/${slug}.svg`;
  writeFileSync(arte, svg, "utf-8");

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
    formato,
    raster,
    formas: vetor?.formas ?? 0,
    cor: hex(dominante),
    recolorida: tinta.declarada,
    pixels,
    furosTapados,
    janelasAbertas: janelas,
    foraDoCampo: e.foraDoCampo,
    salpico: e.salpico,
    descartadas: e.descartadas.length,
    foraDoRecorte,
    caixaUnidades: e.caixaUnidades,
    controleNaBase,
    bytes: Buffer.byteLength(svg),
    bytesGzip: gzipSync(Buffer.from(svg)).length,
    bytesRaster: raster.length,
  };
}
