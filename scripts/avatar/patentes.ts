/**
 * A cor de cada patente — fonte única.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * Pela emenda à D27, **só pele e cabelo recolorem**. A cor do uniforme é assada
 * na arte de origem, e nada a harmoniza depois: duas patentes que saírem em cores
 * próximas ficam indistinguíveis no ranking, e o conserto é redesenhar a peça.
 * O runbook (doc 16, §10.2) já pedia que a cor de cada peça fosse registrada
 * "para as outras patentes não repetirem" — em texto. Texto não reprova nada.
 *
 * Aqui a régua vira dado, e `verify:paleta-patentes` a mede.
 *
 * ⚠️ **PARA ONDE ESTA PALETA MIGROU EM 2026-08-13.** A patente deixou de vestir o
 * boneco: ela passou a dar uma **moldura** em volta do avatar (doc 21 §0). As seis
 * cores continuam sendo a régua — mudou o suporte, de SVG para CSS. A consequência
 * está em `corDaMoldura()` mais abaixo, e ela apaga metade das leis deste
 * cabeçalho: **o parágrafo seguinte descreve o pipeline de SVG, que não é mais o
 * destino destas cores.** Ele fica porque `avatar:garment` e os SVGs de
 * `fonte/uniformes/` ainda existem no repositório.
 *
 * A LEI DAS CORES DO PIPELINE DE SVG (não vale para a moldura)
 *
 * `ehPano` (uniforme.ts) é um corte só: `matiz >= 45`. Abaixo disso a forma não é
 * pano — e **forma descartada não muda de cor, ela SOME**. Por isso:
 *
 *  - a faixa proibida é 0°–44°: marrom, caramelo, couro, creme, e o dourado
 *    `#C9B37E`, que reprova por 3° (42,4°);
 *  - cinza e branco NEUTROS (`R=G=B`) têm matiz 0° e somem também — todo tom
 *    claro precisa ser *tingido*, daí `MIN_DELTA_CANAL`;
 *  - vermelho fica fora de propósito: um bordô vive perto de 350° e passa, mas o
 *    traçador quebra o pano em vários tons e qualquer um que derive para 10°
 *    vira buraco.
 *
 * E a restrição visual: **a 56 px o uniforme é só massa de cor**. Gola, cinto e
 * galão somem nesse tamanho, então a separação entre patentes tem de estar na
 * cor. Daí os dois pisos de distância abaixo.
 *
 * O TIER 0 NÃO ESTÁ AQUI, E É DE PROPÓSITO
 *
 * O APRENDIZ veste o macacão de treino da própria base (`TRAJE_BASE` na paleta) —
 * ele está no Acampamento, ainda em traje de treino. São 6 uniformes, não 7.
 *
 * E não existe patente "Recruta": o tier 0 chama-se Aprendiz (doc 12, D9; doc 14,
 * §escada). "Recruta" é o nome da TRILHA de aulas, e confundir os dois foi o que
 * batizou de `recruta.svg` a peça que o tier 1 concede — que é o Soldado.
 */

import { distancia } from "../../src/lib/avatar/palette";

/**
 * Estado da cor do PANO — e só dele.
 *
 *  - `alvo`: intenção de design. Ainda não há arte, e nenhum gerador de imagem
 *    honra um hex: o valor exato é acertado no Canva, depois da geração.
 *  - `medido`: o valor que `corDominante` leu do SVG que está no repositório. A
 *    partir daí a tabela deixa de ser intenção e vira registro.
 *
 * O `detalhe` é sempre autoria — é instrução para quem desenha, não medição.
 */
export type EstadoCor = "alvo" | "medido";

export interface Patente {
  tier: number;
  patente: string;
  /**
   * O nome do arquivo e o valor de `UNIFORME_NOME`.
   *
   * Existe como dado em vez de sair de `patente.toLowerCase()` porque "Capitão"
   * transliterado à mão é uma linha de regex que ninguém revisa e que erra em
   * silêncio. Aqui ele é escrito uma vez e conferido pelo gate.
   */
  slug: string;
  /** Região da Bíblia Tonal (§6) que a patente habita. É de onde vem a cor. */
  regiao: string;
  /** Cor dominante do pano. É o sinal da patente. */
  pano: string;
  /** Cor da bota — a camada de oclusão do pé sai dela. */
  bota: string;
  /**
   * Debrum, galão ou cinto claro. `null` = a peça não tem detalhe claro.
   *
   * O Soldado é `null` **medido**: os cinco tons do arquivo dele são o mesmo
   * oliva, sem nenhuma forma clara. O primeiro galão nasce no Capitão, e isso
   * casa com a progressão de ornamento do doc 17.
   */
  detalhe: string | null;
  estado: EstadoCor;
}

/** Onde o SVG de origem daquela patente mora — exista ele ou não ainda. */
export function caminhoSvg(p: Patente): string {
  return `scripts/avatar/fonte/uniformes/${p.slug}.svg`;
}

/**
 * A escada, do primeiro uniforme ao último. A ORDEM É A DA PROMOÇÃO: o gate usa
 * a adjacência do array para exigir mais distância entre patentes vizinhas.
 */
export const PATENTES: readonly Patente[] = [
  {
    tier: 1,
    patente: "Soldado",
    slug: "soldado",
    regiao: "Vila dos Soldados",
    pano: "#78833B",
    bota: "#2d3012",
    detalhe: null,
    estado: "medido",
  },
  {
    tier: 2,
    patente: "Aspirante",
    slug: "aspirante",
    regiao: "Fortaleza dos Estrategistas",
    pano: "#384966",
    bota: "#1e2b44",
    // A listra clara da calça — a mesma forma que, sozinha, virou o fundo de
    // segurança da peça inteira antes da correção do §7.0 do runbook.
    detalhe: "#859DAB",
    estado: "medido",
  },
  {
    tier: 3,
    patente: "Capitão",
    slug: "capitao",
    regiao: "Fortaleza dos Estrategistas → transição para a Cidade",
    // Verde-petróleo: guarda o verde do campo do Soldado e já entra na família
    // fria da Fortaleza. É a única cor que faz essa ponte.
    pano: "#3E8C81",
    bota: "#1C4A45",
    detalhe: "#B4D2C9",
    estado: "alvo",
  },
  {
    tier: 4,
    patente: "Comandante",
    slug: "comandante",
    regiao: "Cidade dos Generais",
    // "Estandartes elaborados, guardas de elite": o azul mais saturado da escada,
    // o primeiro que não é discreto.
    pano: "#3A55B5",
    bota: "#1D2A63",
    detalhe: "#C6D2E2",
    estado: "alvo",
  },
  {
    tier: 5,
    patente: "General",
    slug: "general",
    regiao: "Cidade dos Generais → Cidadela",
    // Púrpura é a cor de comando sem cair em vermelho, que o pipeline não aguenta.
    pano: "#7A3168",
    bota: "#421539",
    detalhe: "#D9BCD1",
    estado: "alvo",
  },
  {
    tier: 6,
    patente: "Mestre",
    slug: "mestre",
    regiao: "Cidadela dos Mestres",
    // "Pedra e ouro", "luz controlada". A ÚNICA peça clara da escada, e a menos
    // ornamentada: a Bíblia pede "nobre, minimalista, econômico" no fim, então a
    // chegada é marcada por tirar ornamento e inverter o valor.
    pano: "#AEBCCE",
    bota: "#4B5A70",
    // Latão, não ouro: `#C9B37E` reprova por 3°. Este está em 56,1° e passa — mais
    // esverdeado que o ouro clássico, e é o preço de ter ouro nesta arquitetura.
    detalhe: "#B5AE4A",
    estado: "alvo",
  },
];

// ---------------------------------------------------------------------------
// A MOLDURA — para onde esta paleta migrou em 2026-08-13
// ---------------------------------------------------------------------------
//
// Esta tabela nasceu para pintar o UNIFORME do boneco, e essa era a lei que caiu:
// a patente deixou de vestir e passou a dar uma **moldura** em volta do avatar
// (doc 21 §0). As seis cores medidas não se perdem — elas mudam de suporte.
//
// O QUE MUDA COM O SUPORTE, e é por isso que o gate encolheu:
//
//  - **A faixa proibida de matiz 0°–44° NÃO se aplica.** Ela era lei do pipeline
//    de recoloração do SVG: `ehPano` é um corte só (`matiz >= 45`), e forma
//    descartada não muda de cor, ela SOME. Em CSS, fora do SVG, não há corte e não
//    há o que sumir — **a moldura pode usar dourado**.
//  - **`MIN_DELTA_CANAL` também cai** pelo mesmo motivo: cinza neutro tinha matiz
//    0° e desaparecia do asset. Um anel cinza em CSS desenha perfeitamente.
//  - **`bota` e `detalhe` deixam de ter uso.** A moldura é uma cor só por degrau.
//    Elas ficam na tabela como registro da arte que existiu, não como régua.
//
// O QUE **NÃO** MUDA: as distâncias. Duas patentes em cores próximas continuam
// indistinguíveis, e agora num elemento MENOR que o uniforme era — um anel de 2 px
// em volta de um recorte de 32 px. Se havia motivo para 40/60 no pano, há mais aqui.

/**
 * A superfície em que a moldura é desenhada, e contra a qual ela tem de ler.
 *
 * `warm-ivory` é o fundo de card do produto inteiro (DESIGN.md, Colors). A moldura
 * de um Mestre é prata `#AEBCCE` — clara —, e um anel claro sobre marfim é a
 * mesma família de defeito que a lei nº 4 da arte de traje descreve ("peça bege
 * some no card marfim"). Aqui ela vira número.
 */
export const FUNDO_DA_MOLDURA = "#FAF8F3";

/**
 * Distância RGB mínima entre a moldura e o fundo em que ela vive.
 *
 * O mesmo 40 dos outros pisos desta tabela. **Ele continua aqui, e continua
 * medido — mas deixou de ser a régua que decide**, pelo motivo do bloco abaixo.
 * Fica como diagnóstico: distância RGB responde "são duas cores diferentes?", que
 * é uma pergunta de verdade, só não é a pergunta que um anel faz.
 */
export const MIN_CONTRA_FUNDO = 40;

// ---------------------------------------------------------------------------
// A RÉGUA DO ANEL CONTRA O FUNDO — por que ela deixou de ser RGB (G23)
// ---------------------------------------------------------------------------
//
// A conferência 2 nasceu certa na intenção e errada no instrumento. Ela mediu o
// anel do **Mestre `#AEBCCE`** contra o marfim e leu **103,7** de distância RGB,
// contra um piso de 40: verde com folga de 2,6×. Em razão de contraste o mesmo
// par dá **1,82** — prata sobre marfim, abaixo do piso 3 da WCAG 1.4.11 para
// objeto gráfico não-textual. O anel do aluno mais avançado do produto é o único
// que não se vê, e a régua dizia que estava ótimo.
//
// A causa é conhecida e o projeto já a tinha escrito, no doc 21 §7, um dia antes:
// **"dois tons podem estar longe em matiz e colados em valor"** — `#5E5442` e
// `#4F5A46` distam 17 em RGB e **1** em valor. Distância RGB soma os três canais
// como se os três pesassem igual para o olho, e eles não pesam: o verde responde
// por 71,5% da luminância e o azul por 7,2%. Duas cores podem estar longe no cubo
// e à mesma altura na única dimensão que faz uma forma aparecer sobre um fundo.
//
// AS DUAS FICAM, E NÃO SÃO A MESMA PERGUNTA:
//
//  - **entre patentes → RGB.** Ali a pergunta é *"o aluno distingue os dois
//    degraus?"*, e matiz distingue: verde-oliva e azul-marinho na mesma altura de
//    valor continuam sendo duas patentes diferentes, lado a lado no ranking.
//  - **contra o fundo → luminância.** Aqui a pergunta é *"a forma existe?"*, e
//    forma sobre fundo aparece por diferença de valor, não de matiz. Um anel de
//    2 px sem contraste de valor não é um anel discreto: é um anel ausente.
//
// O QUE ESTA RÉGUA **NÃO** RESOLVE, e fica dito: a WCAG 1.4.11 fala de objeto
// gráfico, sem tamanho mínimo. Se 3,0 é o piso certo para um anel de **2 px** é
// coisa que este número não sabe — a norma tende a ser generosa demais para um fio
// tão fino, não rigorosa demais. O piso 3,0 é, portanto, o mínimo do mínimo.

/**
 * Razão de contraste mínima entre o anel e a superfície sob ele.
 *
 * **3,0** é a WCAG 2.1, critério 1.4.11 (Non-text Contrast) — o piso para um
 * componente de interface ser percebido. Não é 4,5: 4,5 é piso de **texto**, e o
 * anel não se lê, se enxerga.
 */
export const MIN_CONTRASTE_FUNDO = 3;

// ---------------------------------------------------------------------------
// O FIO — a saída nº 1 do G23, escolhida pelo Doug em 2026-08-17
// ---------------------------------------------------------------------------
//
// Medidas as seis contra as duas superfícies do produto, a folha
// (`.scratch/estilo/folha-g23.png`) mostrou o que a tabela do achado já dizia:
//
//   patente      marfim #FAF8F3   navy #0F1A2E
//   Soldado           3,87            4,23
//   Aspirante         8,55            1,92 ✗
//   Capitão           3,75            4,37
//   Comandante        6,29            2,61 ✗
//   General           8,02            2,04 ✗
//   Mestre            1,82 ✗          9,01
//
// **As que reprovam num fundo passam no outro, e vice-versa.** Não é coincidência
// e não é escolha de arte: a luminância das seis vai de 0,066 a 0,494, e nenhuma
// superfície única cobre uma faixa dessa largura com CR 3 nas duas pontas. Trocar
// a cor do Mestre (saída nº 4) consertaria o marfim de hoje e deixaria as outras
// três reprovando na primeira superfície escura que aparecesse.
//
// A saída escolhida tira o problema do eixo da COR e o põe no da FORMA: o anel
// ganha um **fio de 1 px por fora**, e é o fio que responde pela existência da
// forma contra o fundo. As seis cores ficam intactas — inclusive a intenção do
// doc 17 de o Mestre ser a única clara da escada. É o que carta de baralho faz.
//
// COM O FIO, A RÉGUA VIRA DUAS, E CADA UMA MEDE UMA COISA DIFERENTE:
//
//   a) **o fio contra a superfície, em contraste.** É o que faz a forma existir.
//      Uma medição por superfície, não por patente — o fio é o mesmo para as seis.
//   b) **a patente contra o fio, em distância RGB.** Aqui a forma já existe: a
//      pergunta é se a cor da patente ainda se lê COMO COR ao lado do fio, e cor
//      se distingue por matiz também. É a mesma pergunta de "entre patentes", e
//      por isso o mesmo piso.

/**
 * O fio de contorno do anel — 1 px, por fora, sob todas as seis patentes.
 *
 * É o token **`ink`** do produto (`globals.css:30`, espelhado em
 * `scripts/design/tokens.ts:36` e medido por `verify:design-tokens`), não uma cor
 * nova: a direção A da `DESIGN.md` é literalmente *"fio de contorno finíssimo em
 * vez de peso"*, e o boneco já tem contorno preto próprio — um fio de tinta em
 * volta dele é a continuação do desenho, não um enfeite.
 *
 * ⚠️ **ELE É TOKEN DA SUPERFÍCIE, NÃO DA PATENTE.** Hoje o marfim é o único fundo
 * sob um anel, e por isso a constante é uma só. No dia em que um avatar aparecer
 * sobre o navy, o fio ali tem de ser claro — e o que muda é ESTA constante virando
 * um par, mais uma linha na conferência 2a. As seis cores de patente continuam
 * sem se mexer, que é o ponto inteiro da saída nº 1.
 */
export const FIO_DA_MOLDURA = "#1B2432";

/**
 * Distância RGB mínima entre a cor de uma patente e o fio que a contorna.
 *
 * O mesmo 40 de `MIN_ENTRE_PATENTES`, e pelo mesmo motivo: abaixo disso as duas
 * bandas viram uma banda só, e o anel de 2 px + fio de 1 px lê como um traço de
 * 3 px sem cor de patente nenhuma. A folga hoje é confortável — a mais apertada é
 * o Aspirante, em 70,1 —, mas ela existe para o dia em que alguém propuser uma
 * patente cor de tinta.
 */
export const MIN_DA_PATENTE_AO_FIO = 40;

/**
 * Luminância relativa de um hex, pela fórmula da WCAG 2.1.
 *
 * Os dois passos que a distância RGB pula, e que são exatamente o que faltava:
 * **linearizar** o canal (sRGB é codificado com gama, e 128 não é meia luz) e
 * **pesar** os três canais pela resposta do olho — 0,7152 no verde contra 0,0722
 * no azul.
 */
export function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste entre duas cores, de 1 (idênticas) a 21 (preto × branco).
 *
 * Simétrica de propósito: quem chama não precisa saber qual das duas é a mais
 * clara, e trocar a ordem dos argumentos não pode mudar um veredito.
 */
export function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)];
  const [claro, escuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * A cor do anel de patente de um `achieved_tier`. `null` = sem cor de patente.
 *
 * TRÊS CASOS, E OS TRÊS SÃO DECISÃO:
 *
 *  - **tier 0 (Aprendiz) → `null`.** O Aprendiz não tem cor nesta tabela e nunca
 *    teve (ver "O TIER 0 NÃO ESTÁ AQUI" acima). A moldura dele é um fio neutro,
 *    desenhado pelo componente com token, não com cor de patente. Inventar um
 *    sétimo degrau aqui seria dizer que Aprendiz é uma patente, e não é.
 *  - **tier acima do último → SATURA na última.** O banco tem **8 tiers**
 *    (0 Aprendiz … 6 Grão-Mestre, 7 Lenda) contra as 6 cores desta tabela — é o
 *    achado **D11**, e ele continua aberto. Saturar é a saída conservadora: um
 *    Lenda vê o anel de Mestre, que é caro e não é errado. Devolver `null` faria
 *    o aluno mais avançado do produto perder a moldura ao ser promovido, que é o
 *    oposto do ponto.
 *  - **tier negativo ou não-número → `null`.** Dado ausente não inventa degrau.
 *
 * A saturação é medida por `verify:paleta-patentes`, para que o dia em que o D11
 * for decidido não passe em branco.
 */
export function corDaMoldura(tier: number | null | undefined): string | null {
  if (typeof tier !== "number" || !Number.isFinite(tier) || tier < 1) return null;
  const exata = PATENTES.find((p) => p.tier === tier);
  if (exata) return exata.pano;
  const ultima = PATENTES[PATENTES.length - 1]!;
  return tier > ultima.tier ? ultima.pano : null;
}

// ---------------------------------------------------------------------------
// Os pisos
// ---------------------------------------------------------------------------

/**
 * Distância RGB mínima entre os panos de DUAS PATENTES QUAISQUER.
 *
 * É o mesmo 40 que a paleta usa em `MIN_CONTORNO` para "contorno e preenchimento
 * não se fundem". Aqui vale pelo mesmo motivo: abaixo disso as duas massas de cor
 * viram a mesma coisa a 56 px.
 */
export const MIN_ENTRE_PATENTES = 40;

/**
 * Distância mínima entre patentes VIZINHAS na escada.
 *
 * Mais alta porque a promoção é comparada com o que veio logo antes: o aluno que
 * sobe de Aspirante para Capitão precisa VER que subiu. Entre patentes distantes,
 * a confusão custa pouco — ele nunca vai ter as duas lado a lado no próprio boneco.
 */
export const MIN_ENTRE_VIZINHAS = 60;

/**
 * Amplitude mínima entre o maior e o menor canal de uma cor.
 *
 * Zero significa cinza neutro, e cinza neutro tem matiz 0°: a forma cai abaixo do
 * corte de `MATIZ_PANO` e **some** do asset. Um galão branco ou um cinto cinza
 * desaparece, e ninguém antevê isso — daí o piso, e não só o teste de matiz.
 */
export const MIN_DELTA_CANAL = 20;

/**
 * Tolerância entre a cor registrada e a cor medida no SVG.
 *
 * O mesmo 40 do gate de "fundo representativo" no `avatar:garment`: é a distância
 * a partir da qual duas cores deixam de ser a mesma cor com outro nome.
 */
export const TOLERANCIA_MEDIDA = 40;

/** Os pares de patentes vizinhas, na ordem da escada. */
export function vizinhas(): [Patente, Patente][] {
  return PATENTES.slice(1).map((p, i) => [PATENTES[i], p]);
}

/** Todo par de patentes, para a conferência de distância. */
export function pares(): [Patente, Patente][] {
  const out: [Patente, Patente][] = [];
  for (let i = 0; i < PATENTES.length; i++)
    for (let j = i + 1; j < PATENTES.length; j++) out.push([PATENTES[i], PATENTES[j]]);
  return out;
}

/** As cores de uma patente, com nome, pulando o detalhe ausente. */
export function coresDe(p: Patente): { papel: string; cor: string }[] {
  const cs = [
    { papel: "pano", cor: p.pano },
    { papel: "bota", cor: p.bota },
  ];
  if (p.detalhe) cs.push({ papel: "detalhe", cor: p.detalhe });
  return cs;
}

/** Amplitude entre o maior e o menor canal. Zero = cinza neutro. */
export function deltaCanal(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** Reexportado para o gate não precisar conhecer a paleta. */
export { distancia };
