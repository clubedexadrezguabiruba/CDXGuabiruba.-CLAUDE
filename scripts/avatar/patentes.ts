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
 * A LEI DAS CORES, EM UMA LINHA
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
