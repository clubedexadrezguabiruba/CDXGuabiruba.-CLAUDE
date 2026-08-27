/**
 * O GATE DA PILHA — a emissão de `compor()` contra a tabela de `camadas.ts`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ORDEM DE STRING, E NÃO PIXEL
 * ---------------------------------------------------------------------------
 *
 * Mesma escolha e mesma razão de `pecas-de-elenco.test.ts`: medir oclusão de
 * verdade pede render, e a relação entre a ordem da string e a ordem de pintura é
 * **determinística** — é a regra do SVG, não heurística. Aqui se mede o mecanismo.
 *
 * ---------------------------------------------------------------------------
 * OS QUATRO ELENCOS, E POR QUE SÃO QUATRO
 * ---------------------------------------------------------------------------
 *
 * É o produto cartesiano dos dois eixos que `compor()` torna **exclusivos**:
 *
 *   `familia ∈ {parametrico, tracado}` × `lado ∈ {sob, sobre}`
 *
 * Cada elenco preenche **todos os slots ao mesmo tempo** — cabelo com extensão dos
 * dois lados, traje com arte, decoração e extensão dos dois lados, rosto e chapéu.
 * **Nenhum outro teste deste repositório faz isso**, e é exatamente aí que o bug
 * mora: os onze selos de `parametrico-congelado.ts` compõem todos com `rosto`,
 * `chapeu` e `traje` ausentes, então um refactor pode embaralhar rosto × chapéu ×
 * traje e ficar 100% verde neles.
 *
 * O cabelo é um literal `Cabelo` sintético — a união `CabeloOuModelo` permite —, e
 * não um dos cinco do catálogo, por dois motivos: o catálogo não tem um cabelo com
 * extensão nos DOIS lados, e um modelo real amarraria este gate à arte dele.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE GATE **NÃO** PEGA — e vai escrito aqui, não num rodapé
 * ---------------------------------------------------------------------------
 *
 *  - **Ordem de string não é oclusão.** Quem pinta depois cobre, mas *quanto* cobre
 *    é geometria, e geometria se mede em render.
 *  - **Ele não julga se a ordem declarada está CERTA.** As três inversões da barba
 *    (19/08 duas, 20/08 duas) teriam dado três verdes com três tabelas diferentes.
 *    O que passa a ser impossível é a tabela e o código discordarem em silêncio.
 *  - **Ele não vê dentro de uma peça.** A ordem das quatro sub-camadas do cabelo
 *    traçado, ou das duas passadas de `sobrepor()`, é cobrada em outro lugar.
 *  - **Ele não vê dentro de um `<image>`.** Peça de arte é raster colado: o que está
 *    desenhado ali é problema da esteira de arte, não da pilha.
 *  - **`pet` não é buraco, é `FORA_DA_PILHA`.** Idem `moldura` e `fundo`.
 */

import { describe, expect, it } from "vitest";

import { ROSTOS } from "../../catalogo";
import { PILHA, type Camada, type FamiliaDeCabelo, type IdDeCamada } from "../camadas";
import type { Cabelo } from "../cabelo";
import { compor } from "../compositor";
import type {
  EstadoAvatar,
  PecaDeChapeu,
  PecaDeOculos,
  PecaDeRosto,
  Traje,
} from "../tipos";

// ---------------------------------------------------------------------------
// O ELENCO
// ---------------------------------------------------------------------------

/**
 * Todo marcador deste arquivo é escolhido para ser **único no SVG** — cores
 * `#FE00xx` que não existem na paleta, `d` que começam em coordenadas redondas que
 * geometria nenhuma produz. É o contrário de reaproveitar uma peça real: aqui o
 * marcador é uma etiqueta, e etiqueta que colide com desenho legítimo é o defeito
 * que `pecas-de-elenco.test.ts` já pagou uma vez (o `search` de união
 * `kk-(tinta|cabelo-m)` casava com duas camadas e dava verde errado).
 */
const NS = "zz";

const EXTENSAO_ATRAS = [
  { x: 11, y: 11 },
  { x: 60, y: 11 },
  { x: 60, y: 60 },
  { x: 11, y: 60 },
] as const;

const EXTENSAO_FRENTE = [
  { x: 22, y: 22 },
  { x: 70, y: 22 },
  { x: 70, y: 70 },
  { x: 22, y: 70 },
] as const;

/** Paramétrico: `pontos`. A franja fica alta de propósito — ver `SOBRANCELHA` abaixo. */
const CABELO_PARAMETRICO: Cabelo = {
  id: "chanel",
  nome: "sintético paramétrico",
  pontos: [
    { t: -0.1, y: 200 },
    { t: 0.5, y: 170 },
    { t: 1.1, y: 200 },
  ],
  extensoes: [{ forma: EXTENSAO_ATRAS, atras: true }, { forma: EXTENSAO_FRENTE }],
};

/**
 * Traçado: `massa`. TRANSCRITO — massa + núcleo + pretas, e **sem `clara`**.
 *
 * A ausência da clara é deliberada e é a única concessão do elenco. A sub-camada
 * clara de uma peça traçada sai com `class="kk-cabelo"`, que é **a mesma classe** da
 * camada clara do cabelo paramétrico: com as duas presentes, o marcador do traçado
 * casaria uma vez no elenco paramétrico e a contagem de zero da linha inativa
 * deixaria de valer. Ela ocupa a MESMA posição de pilha das outras três (a linha
 * `cabelo-tracado` é uma só), então tirá-la não muda nada do que este gate mede.
 *
 * A massa fica **acima da sobrancelha** (y ≤ 150, e a sobrancelha mora em y ≈ 167)
 * porque `sobrancelhaEscondida()` é medida: uma massa que descesse à testa apagaria
 * uma sobrancelha num elenco e não no outro, e a supressão viraria ruído em cima da
 * contagem. A supressão tem teste próprio — aqui ela é `suprimidaPor` na tabela.
 */
const CABELO_TRACADO: Cabelo = {
  id: "chanel",
  nome: "sintético traçado",
  massa: [
    { t: -0.1, y: 70 },
    { t: 0.5, y: 50 },
    { t: 1.1, y: 70 },
    { t: 0.5, y: 150 },
  ],
  nucleo: [
    [
      { t: 0.1, y: 80 },
      { t: 0.5, y: 65 },
      { t: 0.9, y: 80 },
      { t: 0.5, y: 140 },
    ],
  ],
  pretas: [
    [
      { t: 0.3, y: 95 },
      { t: 0.5, y: 90 },
      { t: 0.6, y: 120 },
      { t: 0.4, y: 115 },
    ],
  ],
  extensoes: [{ forma: EXTENSAO_ATRAS, atras: true }, { forma: EXTENSAO_FRENTE }],
};

/**
 * O CABELO TONAL — a terceira família de `cabelo.ts`, na MESMA linha da pilha.
 *
 * Ela sai por `sobrepor()`, a mesma função da barba e do chapéu, e no mesmo lugar do
 * traçado (`cabelo-tracado`). Por isso o elenco é um TERCEIRO, e a tabela continua
 * com dois valores de `familiaCabelo` — ver o docstring de `FamiliaDeCabelo`.
 *
 * **Ela não tem extensão, e isso não é omissão:** peça sobreposta não é clipada, e
 * `Cabelo.tonal` não tem onde declarar `extensoes` — as formas irmãs entram no mesmo
 * `d`. As duas linhas de extensão ficam INATIVAS neste elenco, e é a asserção 2 que
 * prova que elas somem em vez de sair caladas.
 *
 * O `d` é um marcador único (`M 606 606 …`), como o do rosto e o do chapéu, porque a
 * peça tonal não pinta classe nenhuma: `sobrepor()` escreve `fill` direto, com a cor
 * que a peça declara. É essa ausência de classe que faz o marcador do traçado
 * (`class="kk-(tinta|cabelo-m)"`) não a alcançar.
 */
const D_TONAL = "M 606 606 L 646 606 L 646 646 Z";
const CABELO_TONAL: Cabelo = {
  id: "chanel",
  nome: "sintético tonal",
  tonal: {
    formas: [
      { d: D_TONAL, cor: "var(--av-linha)", semTraco: true },
      { d: D_TONAL, cor: "var(--av-cabelo, #262626)", semTraco: true },
    ],
    tom: {
      // O caminho da máscara — o que importa aqui é a MOLDURA, não os bytes. O
      // `<image>` dela mora num `<defs>` inline, e `corpoDe` o retira: máscara não
      // desenha, ela modula quem desenha.
      arte: "/items/cabelo/zz-cabelo-da-pilha-tom.png",
      x: 606,
      y: 606,
      w: 40,
      h: 40,
    },
  },
};

/** Traje COM arte, decoração e extensão dos dois lados — as cinco linhas dele de uma vez. */
const TRAJE: Traje = {
  id: "zz-traje-da-pilha",
  nome: "Traje da pilha",
  tinta: { arte: "/items/traje/zz-pilha.svg", cor: "#FE0003" },
  decoracao: [{ d: "M 303 303 L 343 303 L 343 343 Z", fill: "#FE0003" }],
  extensoes: [
    { d: "M 404 404 L 444 404 L 444 444 Z", cor: "#FE0004", atras: true },
    { d: "M 505 505 L 545 505 L 545 545 Z", cor: "#FE0005" },
  ],
};

/**
 * A peça de rosto do elenco — e ela declara `tom` DE PROPÓSITO.
 *
 * O tom contínuo põe um `<mask>` com um `<image>` no meio do corpo, e é justamente o
 * tipo de emissão nova que o censo (asserção 4) existe para pegar. Declarar aqui é o
 * que mantém `corpoDe` honesto: sem o strip dos `<defs>` inline, este elenco reprova.
 */
const ROSTO = (sob: boolean): PecaDeRosto => ({
  id: "zz-rosto-da-pilha",
  nome: "Rosto da pilha",
  formas: [{ d: "M 101 101 L 141 101 L 141 141 Z", cor: "#FE0001" }],
  tom: {
    // O caminho da máscara — o que importa aqui é a MOLDURA, não os bytes.
    arte: "/items/rosto/zz-rosto-da-pilha-tom.png",
    x: 101,
    y: 101,
    w: 40,
    h: 40,
  },
  cabeloPorCima: sob,
});

const CHAPEU: PecaDeChapeu = {
  id: "zz-chapeu-da-pilha",
  nome: "Chapéu da pilha",
  formas: [{ d: "M 202 202 L 242 202 L 242 242 Z", cor: "#FE0002" }],
};

/**
 * O ÓCULOS — slot próprio desde 2026-08-27, e o marcador é PRÓPRIO também.
 *
 * ⚠️ **Ele não compartilha marcador com o rosto, e isso é o ponto do slot.** Enquanto
 * óculos e barba dividiam o slot `rosto`, as linhas `rosto-sob-cabelo` e
 * `rosto-sobre-cabelo` eram a mesma emissão em dois lugares da pilha e por isso
 * estavam em `MESMO_MARCADOR`. O óculos saiu de lá: agora ele é peça independente,
 * emitida no MESMO boneco que a barba, e é justamente isso que o Doug pediu —
 * *"preciso que dê para vestir a barba e o óculos, ao mesmo tempo."*
 *
 * Como ele aparece ao lado do rosto em todo elenco, a contagem dele é cobrada de
 * verdade: se a emissão sumisse, o marcador `M 707 707` daria zero e nenhuma outra
 * linha o cobriria.
 *
 * `formas` e não `arte`: o gate mede POSIÇÃO NA PILHA, e um `<image>` seria um
 * elemento desenhável a menos para contar. O óculos do produto é raster; o da
 * fixture é a mesma peça no lugar da pilha, que é o que este arquivo julga.
 */
const OCULOS: PecaDeOculos = {
  id: "zz-oculos-da-pilha",
  nome: "Óculos da pilha",
  // ⚠️ NEM O `d` NEM A COR SÃO LIVRES, e as duas primeiras versões desta fixture
  // provaram isso: `#FE0003` já é o marcador do `tronco-tinta` (o gate acusou
  // "emitiu 3 onde declara 2") e `M 303 303` já é a `decoracao` do TRAJE, lá em
  // cima na pilha (o gate acusou "oculos saiu antes de tudo", com índice 369).
  // Marcador é identidade: repetido, ele mede a linha errada. O gate pegou as duas.
  formas: [{ d: "M 707 707 L 747 707 L 747 747 Z", cor: "#FE0009" }],
};

/**
 * AS TRÊS FAMÍLIAS DE `cabelo.ts` — e a tabela fala em CONJUNTOS delas.
 *
 * `FamiliaDeCabelo` (`camadas.ts`) não enumera famílias, enumera conjuntos:
 * `sobreposto` = {tracado, tonal}, `temExtensao` = {parametrico, tracado}. Nenhuma
 * linha da pilha existe em exatamente uma família, e é por isso que os dois vocábulos
 * não são o mesmo. Esta tabela é a tradução, e ela é ESCRITA: um conjunto novo em
 * `camadas.ts` sem linha aqui não compila.
 */
type Variante = "parametrico" | "tracado" | "tonal";
const NAS_FAMILIAS = {
  qualquer: ["parametrico", "tracado", "tonal"],
  parametrico: ["parametrico"],
  sobreposto: ["tracado", "tonal"],
  temExtensao: ["parametrico", "tracado"],
} as const satisfies Record<FamiliaDeCabelo, readonly Variante[]>;
type Lado = "sob" | "sobre";

interface Elenco {
  readonly variante: Variante;
  readonly lado: Lado;
  readonly nome: string;
  /** O CORPO do SVG: tudo depois de `</defs>`. O que está em `<defs>` não é camada. */
  readonly corpo: string;
}

/**
 * O corpo: tudo depois do `</defs>` do cabeçalho, **e sem nenhum `<defs>` de dentro**.
 *
 * O `slice` sozinho bastou enquanto todo `<defs>` morava no topo. Desde o tom
 * contínuo (Bloco 5) não mora: `sobrepor()` emite o `<mask>` da peça INLINE, ao lado
 * dos paths dela, porque o id precisa levar o `ns` e o slot e nenhum dos dois é
 * conhecido lá em cima.
 *
 * **Sem o strip o censo lê 3 onde a tabela declara 2 e reprova** — o `<image>` do
 * PNG cinza casa o `DESENHAVEL` e entra na conta como se fosse camada. E ele não é:
 * a máscara não desenha, ela modula quem desenha. É a mesma regra que o campo já
 * dizia em prosa desde o começo — *o que está em `<defs>` não é camada* —, agora
 * valendo para os `<defs>` que não estão no topo.
 */
const corpoDe = (estado: EstadoAvatar) => {
  const svg = compor(estado);
  return svg.slice(svg.indexOf("</defs>")).replace(/<defs>.*?<\/defs>/g, "");
};

const CABELO_DA_VARIANTE: Record<Variante, Cabelo> = {
  parametrico: CABELO_PARAMETRICO,
  tracado: CABELO_TRACADO,
  tonal: CABELO_TONAL,
};

const ELENCOS: readonly Elenco[] = (["parametrico", "tracado", "tonal"] as const).flatMap(
  (variante) =>
    (["sob", "sobre"] as const).map((lado) => ({
      variante,
      lado,
      nome: `${variante} × ${lado}`,
      corpo: corpoDe({
        ns: NS,
        pele: "#E9B183",
        cabelo: "#3A2F2A",
        modeloCabelo: CABELO_DA_VARIANTE[variante],
        traje: TRAJE,
        rosto: ROSTO(lado === "sob"),
        // OS DOIS JUNTOS, em todo elenco. É a asserção que o slot novo existe para
        // sustentar: barba e óculos no mesmo boneco.
        oculos: OCULOS,
        chapeu: CHAPEU,
      }),
    })),
);

// ---------------------------------------------------------------------------
// OS MARCADORES E AS CONTAGENS
// ---------------------------------------------------------------------------

/**
 * O MARCADOR DE CADA LINHA — e ele casa com **cada elemento desenhável** que a
 * linha emite, não com "algum sinal dela".
 *
 * `satisfies Record<IdDeCamada, RegExp>`: **linha nova em `PILHA` sem marcador não
 * compila.** É o que impede este gate de envelhecer em silêncio enquanto a tabela
 * cresce — e é por isso que o teste nunca lista par a par.
 */
const MARCA = {
  "sombra-do-chao": /<ellipse\b/g,
  "traje-extensoes-atras": /M 404 404 L 444 404 L 444 444 Z/g,
  "tronco-tinta": /fill="#FE0003"/g,
  "tronco-contorno": /<use href="#zz-p-tronco" class="kk-traco"\/>/g,
  "traje-arte": /<image href="\/items\/traje\/zz-pilha\.svg"/g,
  "cabelo-extensoes-atras": /d="M 11 11 /g,
  "cabeca-pele": /class="kk-pele"/g,
  "faceta-esq": /fill="url\(#zz-fe\)"/g,
  "faceta-dir": /fill="url\(#zz-fd\)"/g,
  // As duas classes do cabelo NO CRÂNIO: a escura com traço e a clara. O `"` de
  // fechamento é o que separa `kk-cabelo-s`/`kk-cabelo` de `kk-cabelo-e` (extensão)
  // e de `kk-cabelo-m` (peça sobreposta).
  "cabelo-parametrico": /class="kk-cabelo(-s)?"/g,
  especular: /class="kk-luz"/g,
  "cabeca-contorno": /<use href="#zz-p-cabeca" class="kk-traco"\/>/g,
  "cabelo-extensoes-frente": /d="M 22 22 /g,
  // `class="kk-tinta kk-olho"` inteiro: os olhos compartilham `kk-tinta` com a peça
  // traçada, e o marcador do traçado exige o `"` logo depois de `kk-tinta`.
  olhos: /class="kk-tinta kk-olho"/g,
  sobrancelhas: /stroke-width="8\.2"/g,
  boca: /stroke-width="5\.3"/g,
  "rosto-sob-cabelo": /M 101 101 L 141 101 L 141 141 Z/g,
  // AS DUAS EMISSÕES DA MESMA LINHA, numa alternância só.
  //
  // A traçada pinta por CLASSE (`kk-tinta` a silhueta preta, `kk-cabelo-m` o núcleo).
  // A tonal não pinta classe nenhuma: `sobrepor()` escreve `fill` direto com a cor
  // que a peça declara, porque a cor é dado da peça e não do CSS. Então o marcador
  // dela é o `d` sintético do elenco, como já é o do rosto e o do chapéu.
  //
  // O `"` depois de `kk-tinta` é o que separa a silhueta traçada dos OLHOS, que saem
  // como `class="kk-tinta kk-olho"`.
  "cabelo-sobreposto": /class="kk-(tinta|cabelo-m)"|M 606 606 L 646 606 L 646 646 Z/g,
  "rosto-sobre-cabelo": /M 101 101 L 141 101 L 141 141 Z/g,
  oculos: /M 707 707 L 747 707 L 747 747 Z/g,
  chapeu: /M 202 202 L 242 202 L 242 242 Z/g,
  "traje-extensoes-frente": /M 505 505 L 545 505 L 545 545 Z/g,
} satisfies Record<IdDeCamada, RegExp>;

/**
 * QUANTOS ELEMENTOS DESENHÁVEIS a linha emite **quando está ativa**, neste elenco.
 *
 * `satisfies Record<IdDeCamada, number>`: **linha nova sem contagem não compila.**
 * E os números não são folga — eles são a asserção 1 (não-vacuidade por CONTAGEM,
 * não por presença) e a asserção 4 (censo) ao mesmo tempo.
 *
 * Onde vale 2 é quase sempre a mesma razão: `sobrepor()` e `extensoes()` fazem
 * DUAS passadas — todo preenchimento, depois todo traço.
 */
const VEZES = {
  "sombra-do-chao": 1,
  "traje-extensoes-atras": 2, // preenchimento + traço
  "tronco-tinta": 2, // a cor chapada (`<use>`) + uma decoração
  "tronco-contorno": 1,
  "traje-arte": 1, // `<image>`, e ele não é forma — ver o censo
  "cabelo-extensoes-atras": 1, // as do mesmo grupo saem num `<path>` só
  "cabeca-pele": 1,
  "faceta-esq": 1,
  "faceta-dir": 1,
  "cabelo-parametrico": 2, // a escura (com traço) + a clara
  especular: 1,
  "cabeca-contorno": 1,
  "cabelo-extensoes-frente": 1,
  olhos: 2,
  sobrancelhas: 2,
  boca: 1,
  "rosto-sob-cabelo": 2, // preenchimento + traço
  "cabelo-sobreposto": 3, // traçada: silhueta preta + núcleo + pretas (sem clara — ver o elenco)
  "rosto-sobre-cabelo": 2,
  oculos: 2, // preenchimento + traço
  chapeu: 2,
  "traje-extensoes-frente": 2,
} satisfies Record<IdDeCamada, number>;

/**
 * ONDE A CONTAGEM MUDA POR VARIANTE — e é UMA linha, não uma tabela paralela.
 *
 * `cabelo-sobreposto` é a mesma linha da pilha nas duas famílias que a habitam, e
 * emite número diferente em cada uma: a traçada empilha até quatro sub-camadas de
 * laço simples, a tonal empilha DUAS — a mesma curva duas vezes, a de baixo preta e
 * a de cima vestida pela máscara de luminosidade.
 *
 * Escrever isso como override de uma linha, em vez de dobrar `VEZES`, é o que
 * mantém o `satisfies Record<IdDeCamada, number>` acima fazendo o trabalho dele:
 * linha nova sem contagem continua não compilando.
 */
const VEZES_NA_VARIANTE: Partial<Record<Variante, Partial<Record<IdDeCamada, number>>>> = {
  tonal: { "cabelo-sobreposto": 2 },
};

const quantas = (e: Elenco, id: IdDeCamada) => VEZES_NA_VARIANTE[e.variante]?.[id] ?? VEZES[id];

/**
 * AS LINHAS QUE COMPARTILHAM MARCADOR — e é UM par, não uma família.
 *
 * `rosto-sob-cabelo` e `rosto-sobre-cabelo` são **a mesma emissão** em dois lugares
 * da pilha: o slot `rosto` é um só, partido por `cabeloPorCima`. A peça é idêntica
 * nos dois casos, então o marcador também é — e a linha INATIVA não pode ser cobrada
 * por contagem zero, porque a ativa casa o mesmo marcador.
 *
 * Quem prova o `lado` não é a contagem: é a **ordem** (asserção 3), que inverte entre
 * o elenco `sob` e o `sobre` com o mesmo marcador. Foi por isso que o controle
 * negativo (asserção 2) teve de ser por diferença de CONJUNTOS e não por linha.
 */
const MESMO_MARCADOR: readonly (readonly IdDeCamada[])[] = [
  ["rosto-sob-cabelo", "rosto-sobre-cabelo"],
];

// ---------------------------------------------------------------------------
// AS RÉGUAS
// ---------------------------------------------------------------------------

/**
 * A tabela lida como `Camada[]`, e não pelo tipo literal que `as const` produz.
 *
 * `as const satisfies readonly Camada[]` é o que dá `IdDeCamada` de graça — cada
 * elemento fica com o tipo EXATO das chaves que declarou, e uma linha sem
 * `emDisputa` não tem a propriedade no tipo. Ótimo para os ids, inútil para ler um
 * campo opcional: `PILHA.filter((c) => c.emDisputa)` não compila. Alargar aqui, uma
 * vez, é mais honesto que espalhar `as` pelo arquivo. A interseção com
 * `{ id: IdDeCamada }` é o que impede o alargamento de levar o `id` junto — sem ela
 * `c.id` viraria `string` e os dois `Record` deixariam de indexar.
 */
const LINHAS: readonly (Camada & { id: IdDeCamada })[] = PILHA;

const camadaDe = (id: IdDeCamada) => LINHAS.find((c) => c.id === id) as Camada;

/** A linha existe neste elenco? É a tabela quem responde — os dois eixos exclusivos. */
const ativa = (c: Camada, e: Elenco) =>
  (NAS_FAMILIAS[c.familiaCabelo] as readonly Variante[]).includes(e.variante) &&
  (c.ladoDoRosto === "qualquer" || c.ladoDoRosto === e.lado);

const ativas = (e: Elenco) => LINHAS.filter((c) => ativa(c, e));

const conta = (e: Elenco, id: IdDeCamada) => (e.corpo.match(MARCA[id]) ?? []).length;

/** `search` ignora a flag `g` e sempre começa do zero — ao contrário de `exec`. */
const onde = (e: Elenco, id: IdDeCamada) => e.corpo.search(MARCA[id]);

/** Alguma linha ATIVA compartilha marcador com esta? Então zero não se pode cobrar. */
const marcadorRoubado = (e: Elenco, id: IdDeCamada) =>
  MESMO_MARCADOR.some(
    (par) => par.includes(id) && par.some((outro) => outro !== id && ativa(camadaDe(outro), e)),
  );

describe("a pilha de camadas — a emissão contra a tabela", () => {
  /**
   * ASSERÇÃO 1 — NÃO-VACUIDADE POR CONTAGEM, NÃO POR PRESENÇA.
   *
   * O repositório já pagou por essa distinção: em `pecas-de-elenco.test.ts` um
   * marcador de união (`kk-(tinta|cabelo-m)`) casava com DUAS camadas, e um teste que
   * só perguntava "apareceu?" dizia *"a barba saiu depois do cabelo"* quando ela tinha
   * saído no meio dele. Presença é uma régua grossa demais para uma pilha.
   */
  it.each(ELENCOS)("$nome — cada linha ativa emite exatamente o que declarou", (elenco) => {
    for (const c of LINHAS) {
      const id = c.id;
      if (ativa(c, elenco)) {
        expect(conta(elenco, id), `${id} — emitiu o número errado de elementos`).toBe(
          quantas(elenco, id),
        );
        continue;
      }
      if (marcadorRoubado(elenco, id)) continue;
      expect(conta(elenco, id), `${id} — linha INATIVA neste elenco, e mesmo assim saiu`).toBe(0);
    }
  });

  /**
   * ASSERÇÃO 2 — CONTROLE NEGATIVO POR DIFERENÇA DE CONJUNTOS DE MARCADOR.
   *
   * É o que prova que os quatro elencos são de fato quatro, e que as duas
   * exclusividades da tabela são exclusividades de verdade. Ele é por CONJUNTO e não
   * por linha porque as duas linhas do slot `rosto` compartilham marcador — ver
   * `MESMO_MARCADOR`. Escrito por linha, ele falsearia: diria que a bandeira
   * `cabeloPorCima` some ou aparece, quando o que ela faz é MUDAR DE LUGAR.
   */
  it("os dois eixos são exclusivos, e a diferença de conjuntos diz exatamente onde", () => {
    const presentes = (e: Elenco) =>
      new Set(LINHAS.map((c) => c.id).filter((id) => conta(e, id) > 0));
    const acha = (variante: Variante, lado: Lado) =>
      ELENCOS.find((e) => e.variante === variante && e.lado === lado) as Elenco;

    const diferenca = (a: Set<string>, b: Set<string>) =>
      [...new Set([...a, ...b])].filter((x) => a.has(x) !== b.has(x)).sort();

    /**
     * O QUE MUDA ENTRE DUAS VARIANTES, PAR A PAR — e a lista é ESCRITA.
     *
     * Nem uma linha a mais: uma linha a mais aqui significa que alguma outra camada
     * depende da família sem estar declarada na tabela. E nem uma a menos: com três
     * variantes, um par que não diferisse em nada seria um elenco duplicado fingindo
     * ser um terceiro.
     *
     * Os três pares dizem, em conjunto, o que os conjuntos de `FamiliaDeCabelo`
     * afirmam — `sobreposto` = {tracado, tonal} e `temExtensao` = {parametrico,
     * tracado} — medidos na emissão em vez de lidos da tabela.
     */
    const PARES: [Variante, Variante, string[]][] = [
      // O paramétrico mora no clip do crânio; o traçado é peça sobreposta. Trocam de
      // linha, e as extensões existem nos dois.
      ["parametrico", "tracado", ["cabelo-parametrico", "cabelo-sobreposto"]],
      // Traçado e tonal são a MESMA linha da pilha. O que os separa é só a extensão:
      // a peça tonal é uma silhueta só, e `Cabelo.tonal` não tem onde declarar
      // extensão — nem poderia (ver `temExtensao` em `camadas.ts`).
      ["tracado", "tonal", ["cabelo-extensoes-atras", "cabelo-extensoes-frente"]],
      // A soma dos dois de cima, e é isso que prova que os conjuntos fecham.
      [
        "parametrico",
        "tonal",
        [
          "cabelo-extensoes-atras",
          "cabelo-extensoes-frente",
          "cabelo-parametrico",
          "cabelo-sobreposto",
        ],
      ],
    ];

    for (const lado of ["sob", "sobre"] as const)
      for (const [a, b, esperado] of PARES)
        expect(
          diferenca(presentes(acha(a, lado)), presentes(acha(b, lado))),
          `${a} × ${b}, lado ${lado}`,
        ).toEqual(esperado);

    // LADO: os conjuntos são IDÊNTICOS, e isso é o fato honesto sobre o marcador
    // compartilhado — a peça de rosto não some nem aparece, ela troca de posição.
    // Quem prova o lado é a asserção 3.
    for (const variante of ["parametrico", "tracado", "tonal"] as const)
      expect(
        diferenca(presentes(acha(variante, "sob")), presentes(acha(variante, "sobre"))),
        `variante ${variante}`,
      ).toEqual([]);
  });

  /**
   * ASSERÇÃO 3 — ORDEM POR PARES ADJACENTES DA LISTA FILTRADA.
   *
   * Adjacentes bastam: a ordem é transitiva, então provar `n < n+1` para toda a lista
   * prova todos os pares. E a mensagem de falha carrega o **`porQue` da linha
   * seguinte** — quem quebrar isto lê a razão anatômica da fronteira que quebrou, no
   * mesmo instante, em vez de ir procurar de que lado o desenho queria ficar.
   */
  it.each(ELENCOS)("$nome — a emissão sobe na ordem da tabela, par a par", (elenco) => {
    const lista = ativas(elenco);
    for (let i = 0; i + 1 < lista.length; i++) {
      const a = lista[i];
      const b = lista[i + 1];
      const ia = onde(elenco, a.id);
      const ib = onde(elenco, b.id);

      expect(ia, `${a.id} não foi emitida — a comparação mediria o nada`).toBeGreaterThan(-1);
      expect(ib, `${b.id} não foi emitida — a comparação mediria o nada`).toBeGreaterThan(-1);
      expect(ia, `${a.id} saiu DEPOIS de ${b.id}. ${b.id} vem depois porque: ${b.porQue}`).toBeLessThan(ib);
    }
  });

  /**
   * ASSERÇÃO 4 — O CENSO. É esta que pega **camada nova emitida sem linha na tabela**.
   *
   * As três primeiras cobram o que a tabela DIZ. Só esta cobra o que ela **não** diz:
   * um `<path>` a mais no meio de `compor()`, sem linha em `PILHA`, passa incólume
   * pelas outras três — nenhum marcador o procura — e some no censo.
   *
   * **O contador inclui `<image>`, e o do orçamento não.** São réguas de coisas
   * diferentes: `contarFormas()` da `folha-base` e de `traje-de-elenco.test.ts` mede
   * o custo de RENDER (`<image>` é raster colado, não é forma, e é por isso que a peça
   * com arte fecha em 17 e não em 18); aqui se mede o CENSO DE CAMADAS, e uma peça de
   * arte é uma camada como qualquer outra. Um `<image>` fora do censo seria um slot
   * inteiro do elenco fora da contabilidade.
   *
   * **O que ele não pega, e é limitação, não descuido:** uma camada emitida como `<g>`
   * puro, sem elemento desenhável dentro. Hoje isso não desenha nada — um grupo vazio
   * não pinta —, e `traje-de-elenco.test.ts` já cobra que nenhum seja emitido.
   */
  it.each(ELENCOS)("$nome — o censo fecha: nada é emitido fora da tabela", (elenco) => {
    const DESENHAVEL = /<(path|ellipse|rect|circle|use|image)\b/g;
    const emitidos = (elenco.corpo.match(DESENHAVEL) ?? []).length;
    const declarados = ativas(elenco).reduce((a, c) => a + quantas(elenco, c.id), 0);

    expect(
      emitidos,
      `há ${emitidos} elementos desenháveis no corpo e a tabela declara ${declarados}: ` +
        `ou uma camada foi emitida sem linha em PILHA, ou uma linha mudou de tamanho`,
    ).toBe(declarados);
  });

  /**
   * A LINHA VAZIA É DECLARADA COMO VAZIA — e é a que já custou quatro reviravoltas.
   *
   * `rosto-sob-cabelo` é emitível e não tem cliente: nenhuma peça do catálogo declara
   * `cabeloPorCima`. Isso não é defeito — é o resultado de uma medição (sob o
   * `chanel` a `barba-cheia` sobrevive 56,8%) —, mas uma linha de pilha sem peça é
   * exatamente o tipo de coisa que vira promessa se ninguém escrever que está vazia.
   *
   * O que este teste fecha: alguém enche a linha (uma peça passa a declarar a
   * bandeira) e **esquece de tirar o `semPecaHoje`**, deixando a tabela dizendo o
   * contrário do catálogo. É a mesma família de defeito que a tabela inteira existe
   * para matar, um andar acima.
   */
  it("`semPecaHoje` e o catálogo concordam — linha vazia declarada, linha cheia sem a nota", () => {
    const comBandeira = Object.values(ROSTOS).filter((p) => p.cabeloPorCima);

    for (const c of LINHAS) {
      if (c.ladoDoRosto !== "sob") continue;
      if (c.semPecaHoje)
        expect(
          comBandeira.map((p) => p.id),
          `${c.id} está declarada VAZIA e o catálogo tem peça pedindo este lado`,
        ).toEqual([]);
      else
        expect(
          comBandeira.length,
          `${c.id} deixou de ser vazia sem ninguém tirar o \`semPecaHoje\``,
        ).toBeGreaterThan(0);
    }
  });

  /**
   * A CONTRADIÇÃO DA ÚLTIMA LINHA — travada onde está, e nomeada.
   *
   * `traje-extensoes-frente` é emitida DEPOIS do chapéu: uma ombreira ou fecho de
   * capa pinta por cima da aba. A tabela registra a disputa em `emDisputa` em vez de
   * resolvê-la, porque **nenhum traje do catálogo declara `extensoes` hoje** — não há
   * peça na mão para olhar, e `extensoes(undefined, false)` devolve string vazia, o
   * que torna a contradição inerte.
   *
   * Este teste trava a posição de HOJE. No dia em que a decisão vier, ele fica
   * vermelho nomeando o par — que é o comportamento certo para uma decisão de arte
   * que alguém tomou de propósito.
   */
  it("a linha em disputa está declarada, e é a única", () => {
    const disputadas = LINHAS.filter((c) => c.emDisputa);
    expect(disputadas.map((c) => c.id)).toEqual(["traje-extensoes-frente"]);
    expect(disputadas[0].emDisputa).toContain("DESCE PARA JUNTO");

    for (const elenco of ELENCOS)
      expect(
        onde(elenco, "chapeu"),
        `${elenco.nome} — o chapéu deixou de ser coberto pela extensão frontal do traje`,
      ).toBeLessThan(onde(elenco, "traje-extensoes-frente"));
  });
});
