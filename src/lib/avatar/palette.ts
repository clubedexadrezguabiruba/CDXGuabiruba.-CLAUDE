/**
 * Paleta do avatar v4 — fonte única de verdade das cores.
 *
 * Antes disto, as cores viviam soltas dentro de `prototipo/boneco.ts` e
 * `prototipo/pet.ts`, duplicadas entre os dois. Este módulo é o que a arte, o
 * CSS global e o validador consomem.
 *
 * DUAS COISAS QUE ESTE ARQUIVO CONGELA:
 *
 *  1. **Os valores das cores.** Trocar aqui muda todo o elenco de uma vez.
 *  2. **Os nomes das custom properties.** Ver `PROPRIEDADES`. A partir do
 *     Bloco 5 as regras CSS sobem para a folha global e cada `<svg>` carrega
 *     só as variáveis — o nome vira o contrato entre os dois lados, e mudá-lo
 *     quebra em silêncio (a regra não encontra a variável, e o elemento
 *     renderiza com o fill padrão: preto).
 *
 * POR QUE UM VALIDADOR DE DISTÂNCIA (T0.8): duas cores próximas demais são
 * indistinguíveis a 56 px, e uma das definições de "pronto" é que todo item se
 * distinga dos irmãos de slot nesse tamanho. Uma criança que escolhe entre
 * "Cabelo Castanho" e "Cabelo Castanho Escuro" precisa ver a diferença no
 * ranking, não só na tela de escolha ampliada.
 *
 * A métrica é distância euclidiana em RGB. É grosseira — não corresponde à
 * percepção humana com precisão —, mas é a mesma que produziu o caso
 * documentado de fusão (`#4a3526` com `#3d2b1f`, distância 18) e serve ao
 * propósito: pegar o descuido, não julgar arte. **A conferência de verdade é a
 * folha de contato a 56 px.**
 */

// ---------------------------------------------------------------------------
// Contorno
// ---------------------------------------------------------------------------

/**
 * Cor do contorno de tudo. Precisa ficar longe de toda cor de preenchimento,
 * senão a silhueta some — cabelo preto sobre contorno quase preto vira um
 * borrão só.
 *
 * ---------------------------------------------------------------------------
 * ERA `#241610`, E O MARROM NÃO ESTAVA NA REFERÊNCIA
 * ---------------------------------------------------------------------------
 *
 * O `#241610` tem luminância 24,5 e veio de "contorno marrom-escuro", que era o
 * Style Anchor do avatar v3. A referência do estilo kokeshi não tem isso: contando
 * os pixels escuros da arte definitiva, as cores mais frequentes são `#010101`
 * (23 384 px), `#020202` (18 118) e `#000000` (16 517). É **preto**, e o traço medido
 * na borda lê luminância 3,0.
 *
 * A correção é a cor, e não a espessura. Um traço marrom parece mais fino que um
 * preto da mesma largura, e a tentação é compensar engrossando — foi assim que
 * `TRACO` virou 17 uma vez. Aqui os dois números são medidos em separado e cada um
 * responde pelo que é seu.
 *
 * **Todas as folgas do validador melhoram**: o cabelo preto `#3A2F2A` sai de 42,2
 * para **85,7** contra o contorno, o sapato para 101,6 e a calça para 138,7. O único
 * efeito colateral está em `palette.test.ts`, e é o exemplo do teste — não a regra.
 */
export const LINHA = "#000000";

// ---------------------------------------------------------------------------
// Rampas escolhíveis pelo aluno
// ---------------------------------------------------------------------------

/**
 * Oito tons de pele. Não é uma rampa decorativa: é a razão de o boneco não
 * excluir ninguém do clube, e é por isso que a cor mora numa variável em vez
 * de estar pintada no desenho.
 *
 * Do mais claro ao mais escuro, com passo perceptualmente regular.
 */
export const PELE = [
  "#FFE2C7",
  "#F7CBA4",
  "#E9B183",
  "#D69763",
  "#BC7B4A",
  "#9E6238",
  "#834E2C",
  "#6B3C22",
] as const;

/**
 * Oito cores de cabelo (D27): 5 modelos × 8 cores = 40 visuais a partir de 5
 * arquivos. O doc 15 dizia "cabelo (5)" — eram os 5 do protótipo, não a meta.
 *
 * As duas últimas são fantasia deliberada. Numa turma de 30 com catálogo
 * enxuto os bonecos ficariam parecidos, e é exatamente esse o problema que o
 * D27 existe para resolver. Se destoarem do tom do clube, são duas linhas.
 *
 * O preto é `#3A2F2A`, não preto de verdade: contra o contorno um preto real
 * apagaria a silhueta do cabelo. O validador reprova.
 */
export const CABELO = [
  "#3A2F2A", // preto
  "#6E4326", // castanho
  "#A9713F", // castanho claro
  "#E0B457", // loiro
  "#B4552A", // ruivo
  "#D8D2CB", // grisalho
  "#8C63A8", // roxo
  "#3E7CA8", // azul
] as const;

/**
 * Oito cores de fundo escolhíveis (D27).
 *
 * Todas dessaturadas de propósito: o fundo é pano de fundo, e um fundo
 * saturado brigaria com o boneco justamente no tamanho em que o boneco tem
 * menos pixels para se defender. Também precisam aguentar o nome do aluno
 * escrito por cima, no ranking.
 */
export const FUNDO = [
  "#BBD4E8", // azul
  "#C3DFB4", // verde
  "#EFD9AE", // areia
  "#EFC3CE", // rosa
  "#C6B0E0", // lilás
  "#95D2CB", // água
  "#F0E08A", // amarelo
  "#D0CFCB", // cinza
] as const;

// ---------------------------------------------------------------------------
// Cores não escolhíveis
// ---------------------------------------------------------------------------

/**
 * Traje da base — o que o boneco veste quando não há uniforme equipado.
 * É o fallback do 5.9: uniforme ausente cai para isto, nunca para boneco pelado.
 */
export const TRAJE_BASE = {
  roupa: "#C9BFA8",
  calca: "#4F5A46",
  sapato: "#3A3A3C",
} as const;

/**
 * Cor por raridade, para a moldura do avatar no ranking (Bloco 6.2).
 *
 * Os valores espelham `RARITY_STYLES` em `src/lib/constants/items.ts`, que já
 * pinta a borda e o badge do inventário — são as cores do Tailwind
 * (zinc-300, blue-400, purple-500, amber-400). Se divergirem, o mesmo item
 * aparece com uma cor no inventário e outra no ranking.
 *
 * ATENÇÃO: raridade **não pode ser sinalizada só por cor** (item 10.4 do
 * plano). Esta paleta é o reforço visual, não o sinal único.
 */
export const RARIDADE = {
  common: "#D4D4D8",
  rare: "#60A5FA",
  epic: "#A855F7",
  legendary: "#FBBF24",
} as const;

// ---------------------------------------------------------------------------
// Sombra
// ---------------------------------------------------------------------------

/**
 * Escurece uma cor para o degrau de sombra (item 2.4 do plano): sob o queixo,
 * dentro da manga, embaixo da franja. É o que separa "clipart vetorial" de
 * "storybook", e custa zero asset.
 *
 * Calculado aqui em vez de `color-mix()` no CSS de propósito: se o navegador
 * não suportar a função, o `fill` inteiro vira inválido e o elemento renderiza
 * preto. Valor pré-calculado não tem esse modo de falha.
 */
export function escurecer(hex: string, fator = 0.82): string {
  const [r, g, b] = paraRgb(hex);
  const passo = (c: number) => Math.round(Math.max(0, Math.min(255, c * fator)));
  return paraHex([passo(r), passo(g), passo(b)]);
}

// ---------------------------------------------------------------------------
// O contrato das custom properties
// ---------------------------------------------------------------------------

/**
 * Nomes congelados. Mudar qualquer um destes exige mudar a folha global junto.
 *
 * **SÓ PELE E CABELO RECOLOREM.** Decisão do usuário, permanente, mais restrita
 * que a D27 original — que também dava cor à escolha para o fundo. Roupa,
 * uniforme, chapéu, relíquia, pet e fundo têm **cor fixa, assada no desenho**.
 * A cor do uniforme é o que sinaliza a patente, e patente não é gosto.
 *
 * Por isso esta lista encolheu, e o encolhimento é o gate: `conferirSvg` reprova
 * qualquer SVG que leia uma propriedade fora daqui. Um desenho que tente
 * recolorir roupa **não passa** — a decisão deixou de depender de disciplina.
 *
 * O que sobrou, e por quê:
 *
 *  - `--av-pele` e `--av-cabelo` (com as sombras): os dois eixos de escolha.
 *  - `--av-traco` e `--av-linha`: não são escolha do aluno, são o traço do
 *    sistema. Existem para os 60 desenhos terem um contorno só, definido num
 *    lugar só.
 *
 * `--av-cabelo` é de escopo **avatar**, não de camada, e isso é deliberado:
 * quem lê essa cor não é só o cabelo, é também a **sobrancelha**, que mora na
 * base. Cabelo loiro com sobrancelha preta não lê como loiro — é o detalhe que
 * separa "trocou de cabelo" de "colocou uma peruca". Se a cor vivesse no `<g>`
 * do cabelo, a base não a alcançaria.
 *
 * O que saiu: `--av-roupa`, `--av-roupa-s`, `--av-detalhe`, `--av-calca`,
 * `--av-sapato`, `--av-item-a`, `--av-item-b`, `--av-fundo` e `--av-raridade`.
 * A moldura de raridade saiu porque ela é `frame_ui` — CSS na camada z=10, fora
 * do SVG (§2.3). Se um dia precisar entrar num desenho, é uma linha aqui, e o
 * gate vai exigir que se declare.
 *
 * **ESCOPO IMPORTA.** Compor o avatar é concatenar camadas num único `<svg>`
 * (D22), e um chapéu, uma relíquia e um pet podem estar na mesma composição. A
 * pele é do `<svg>` inteiro; o cabelo vive na camada dele.
 *
 *  - `avatar`: vai no `<svg>`. Vale para a composição inteira.
 *  - `camada`: vai no `<g>` daquela camada.
 */
export const PROPRIEDADES = {
  avatar: [
    "--av-traco", // espessura do contorno
    "--av-linha", // cor do contorno
    "--av-pele",
    "--av-pele-s", // sombra da pele
    "--av-cabelo", // lido pelo cabelo E pela sobrancelha da base
    "--av-cabelo-s",
  ],
  /**
   * VAZIO, e isto é a decisão em forma de código: nada mais é escopado por
   * camada porque nenhum item recolore. O escopo continua existindo para o dia
   * em que voltar a fazer falta, com o motivo escrito acima.
   */
  camada: [] as readonly string[],
} as const;

// ---------------------------------------------------------------------------
// Validador (T0.8)
// ---------------------------------------------------------------------------

/**
 * Distância mínima entre duas cores que o aluno escolhe **dentro do mesmo
 * conjunto**. Abaixo disto, as duas opções não se distinguem a 56 px.
 *
 * Comparar conjuntos diferentes entre si não faz sentido: um tom de pele claro
 * e um fundo claro nunca aparecem como opções irmãs, e exigir distância entre
 * eles reprovaria uma paleta correta.
 */
export const MIN_DISTINGUIVEL = 25;

/**
 * Distância mínima entre o contorno e qualquer preenchimento. Maior que a
 * anterior porque a função do contorno é justamente separar formas: quando ele
 * se aproxima do que contorna, a silhueta some antes de a cor sumir.
 */
export const MIN_CONTORNO = 40;

export interface ParProximo {
  conjunto: string;
  a: string;
  b: string;
  distancia: number;
  minimo: number;
}

function paraRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(`Cor fora do formato #RRGGBB: ${hex}`);
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function paraHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");
}

/** Distância euclidiana em RGB. O caso documentado que fundiu dista 18. */
export function distancia(a: string, b: string): number {
  const [r1, g1, b1] = paraRgb(a);
  const [r2, g2, b2] = paraRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

/** Todo par de um conjunto que está perto demais. Vazio = conjunto aprovado. */
export function paresProximos(
  conjunto: string,
  cores: readonly string[],
  minimo: number = MIN_DISTINGUIVEL,
): ParProximo[] {
  const achados: ParProximo[] = [];
  for (let i = 0; i < cores.length; i++) {
    for (let j = i + 1; j < cores.length; j++) {
      const d = distancia(cores[i], cores[j]);
      if (d < minimo) {
        achados.push({ conjunto, a: cores[i], b: cores[j], distancia: d, minimo });
      }
    }
  }
  return achados;
}

/**
 * Valida a paleta inteira. Devolve todos os problemas de uma vez — listar um
 * por execução transformaria o conserto de uma paleta em muitas rodadas.
 */
export function validarPaleta(): ParProximo[] {
  const problemas: ParProximo[] = [
    ...paresProximos("pele", PELE),
    ...paresProximos("cabelo", CABELO),
    ...paresProximos("fundo", FUNDO),
    ...paresProximos("raridade", Object.values(RARIDADE)),
  ];

  // O contorno contra todo preenchimento que pode encostar nele.
  const preenchimentos = [
    ...PELE,
    ...CABELO,
    ...Object.values(TRAJE_BASE),
  ];
  for (const cor of preenchimentos) {
    const d = distancia(LINHA, cor);
    if (d < MIN_CONTORNO) {
      problemas.push({
        conjunto: "contorno",
        a: LINHA,
        b: cor,
        distancia: d,
        minimo: MIN_CONTORNO,
      });
    }
  }

  return problemas;
}

/** A menor distância dentro de um conjunto. Serve para ver a folga que sobrou. */
export function menorDistancia(cores: readonly string[]): number {
  let menor = Infinity;
  for (let i = 0; i < cores.length; i++) {
    for (let j = i + 1; j < cores.length; j++) {
      menor = Math.min(menor, distancia(cores[i], cores[j]));
    }
  }
  return menor;
}
