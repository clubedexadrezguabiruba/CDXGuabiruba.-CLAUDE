/**
 * OS CINCO CABELOS — e nenhum deles sabe onde a cabeça termina.
 *
 * Este arquivo é o primeiro item de CATÁLOGO do estilo kokeshi, e ele existe para
 * provar, no menor item possível, a regra que o `geometria.ts` estabeleceu para os
 * 92: **quem desenha uma peça não declara a fronteira do corpo.**
 *
 * ---------------------------------------------------------------------------
 * COMO A REGRA É CUMPRIDA AQUI, E POR QUE NÃO É DISCIPLINA
 * ---------------------------------------------------------------------------
 *
 * Um cabelo tem duas bordas: a de baixo (a franja, que o aluno vê) e a dos lados
 * (que é a borda da CABEÇA). Se este arquivo escrevesse a segunda, existiriam duas
 * descrições da lateral do crânio — e a lição de seis medições do pipeline morto é
 * que duas descrições da mesma fronteira divergem sempre.
 *
 * Então ele não escreve. Cada ponto da franja é dado como `{ t, y }`, onde `y` é
 * altura em unidades do `viewBox` e **`t` é fração da largura da cabeça naquela
 * altura**, lida de `bordasEm(y)`. Um `t` de 0,5 fica no meio do crânio a qualquer
 * altura, e acompanha o `GIRO` sem ninguém somar deslocamento nenhum.
 *
 * E as pontas de toda franja têm `t` **fora de [0, 1]** — elas terminam do lado de
 * fora da silhueta de propósito, para o `clipPath` da cabeça ser quem corta. É o
 * mesmo modelo de sangria + faca de corte do tronco, um nível acima:
 * `__tests__/cabelo.test.ts` reprova o modelo cuja ponta caia dentro.
 *
 * ---------------------------------------------------------------------------
 * ESTES NÚMEROS SÃO DESENHADOS, NÃO MEDIDOS — E ISSO PRECISA ESTAR ESCRITO
 * ---------------------------------------------------------------------------
 *
 * Todo o resto do sistema sai de régua sobre a referência. **Aqui não há régua**: a
 * `referencia-base.png` é um boneco CARECA, e não existe fonte de onde extrair a
 * forma de cinco cabelos. Chamar isto de "medido" seria a mesma falha do docstring
 * da sobrancelha — descrever uma intenção como se fosse um fato.
 *
 * O que substitui a medição são três amarras, e as três reprovam no teste:
 *
 *  1. a franja **não invade o rosto**: o ponto mais baixo de qualquer modelo fica
 *     `FOLGA_ROSTO` acima do topo da sobrancelha mais alta, contado já com meio
 *     traço. Sem isso um cabelo tapa a testa e o boneco perde a expressão;
 *  2. a franja **atravessa a cabeça inteira**: as pontas caem fora da silhueta;
 *  3. o modelo cabe no **orçamento composto**, medido em `avatar:folha-base`.
 *
 * ---------------------------------------------------------------------------
 * O MOICANO NÃO TEM TOUCA, E A TENTATIVA DE DAR UMA A ELE FALHOU MEDIDO
 * ---------------------------------------------------------------------------
 *
 * Quatro modelos são touca: uma franja que atravessa a cabeça, e tudo ACIMA dela é
 * cabelo. Emitem a franja como spline aberta e fecham por um retângulo bem fora da
 * silhueta, que o clip come inteiro — dois `L` e um `Z`, o fechamento mais barato
 * que existe.
 *
 * O moicano não é isso: ele tem couro cabeludo à mostra dos dois lados. A primeira
 * versão o fez como um laço fechado no espaço `{t, y}`, e o resultado **leu como
 * pluma de capacete**. A causa não é de gosto e está no parâmetro: `t` é fração da
 * largura da cabeça *naquela altura*, e essa largura despenca perto da coroa — 206
 * unidades em y 54 contra 362 em y 126. Uma faixa de `t` constante é, em pixel, um
 * **funil que abre para baixo**, e funil é a forma de uma pluma.
 *
 * Então ele não tem touca: é **só extensão**, uma peça em coordenada absoluta que
 * nasce dentro do crânio e sobe. `pontos` é opcional por causa dele, e a topologia
 * `faixa` — que existia só para este caso — saiu do arquivo junto com o defeito.
 */

import {
  CABECA,
  CAIXA_CABECA,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SOBRANCELHA,
  TRACO,
  bordasEm,
  n,
  spline,
} from "./geometria";

/** Os 5 do catálogo (D11 do doc 12). O `criar-personagem` escolhe um destes. */
export type ModeloCabelo = "curto" | "cacheado" | "tranca" | "coque" | "moicano";

/** Um ponto da franja: altura absoluta, e fração da largura da cabeça NAQUELA altura. */
interface PontoFranja {
  /** 0 = borda esquerda do crânio, 1 = borda direita. Fora de [0,1] é fora da silhueta. */
  t: number;
  /** Altura em unidades do `viewBox`. */
  y: number;
}

/** Um ponto em coordenada absoluta do `viewBox`. */
interface Ponto {
  x: number;
  y: number;
}

/**
 * Uma peça que EXCEDE a silhueta da cabeça: coque, trança, crista, volume de cacho.
 *
 * Mesma natureza — e mesma regra — das `extensoes` de `Traje`: elas não compartilham
 * fronteira com a cabeça, elas a COBREM, e por isso podem ter forma própria. O
 * contorno continua sendo do compositor.
 *
 * **É `forma: Ponto[]` e não `d: string`, e a troca tem consequência.** Guardando o
 * path já emitido, a régua de folga do rosto enxergava só a franja e ficava cega
 * para a peça — e o moicano, que passou a ser só extensão, cairia justamente na
 * cegueira. Dado guardado como dado é dado que o gate consegue medir.
 */
interface Extensao {
  /** O laço fechado, em coordenada absoluta. */
  forma: readonly Ponto[];
  /**
   * Põe a peça SOB a cabeça. É o que faz um coque parecer preso atrás em vez de
   * colado na testa: a cabeça é opaca e come a emenda, oclusão em vez de máscara.
   */
  atras?: boolean;
}

export interface Cabelo {
  /** Slug: chave do catálogo e do banco (`users.avatar_hair`). */
  id: ModeloCabelo;
  /** Nome que o aluno lê. */
  nome: string;
  /**
   * A franja, em espaço `{t, y}`. **Ausente no moicano**, que não tem touca — ver a
   * seção sobre ele no topo do arquivo.
   */
  pontos?: readonly PontoFranja[];
  extensoes?: readonly Extensao[];
}

// ---------------------------------------------------------------------------
// As amarras
// ---------------------------------------------------------------------------

/**
 * Quanto de testa tem de sobrar entre o traço da franja e o topo da sobrancelha.
 *
 * **24 unidades, e o número sai da escala de leitura, não do gosto.** A 56 px — o
 * tamanho do ranking, o que manda pela regra 8 da §7 — o `viewBox` de 700 unidades
 * dá 12,5 unidades por pixel, então 24 são **1,9 px de pele** entre duas peças
 * pretas. Menos de um pixel e as duas encostam por antialiasing no tamanho em que
 * o boneco mais aparece; a sobrancelha inteira tem 0,66 px de espessura ali, e uma
 * franja colada nela vira uma mancha só.
 */
export const FOLGA_ROSTO = 24;

/**
 * A espessura do degrau de sombra sob a franja (item 2a.2), em unidades.
 *
 * A sombra não é um path próprio: é a MESMA forma do cabelo, desenhada duas vezes —
 * a de baixo em `--av-cabelo-s`, a de cima subida `DEGRAU` unidades em
 * `--av-cabelo`. O que sobra entre as duas é a faixa escura, e ela tem a espessura
 * daqui em toda a extensão da franja de graça, sem ninguém desenhar uma segunda
 * curva paralela (que é o que o `cabecaRecuada(k)` provou não funcionar).
 *
 * 22 unidades porque metade do traço (6) fica por cima da emenda: sobram ~16
 * visíveis, ou 1,3 px a 56. Menos que isso, o degrau some justamente no tamanho em
 * que ele existe para dar volume.
 */
const DEGRAU = 22;

/**
 * Quanto o fechamento da touca sai da caixa da cabeça.
 *
 * Ele é lixo geométrico de propósito — três comandos que o clip come inteiros. 60
 * unidades dão folga para o traço (12) e para o antialiasing do clip em DPR
 * fracionário, sem custar byte: `L` de coordenada inteira é o comando mais curto.
 */
const FORA = 60;

// ---------------------------------------------------------------------------
// Os construtores de extensão
// ---------------------------------------------------------------------------

/** Um ponto `{t, y}` virando coordenada, perguntando a borda ao contorno da cabeça. */
function ponto(p: PontoFranja, dy: number): { x: number; y: number } {
  const y = p.y + dy;
  const { esq, dir } = bordasEm(y);
  return { x: esq + p.t * (dir - esq), y };
}

/**
 * Uma elipse como OITO PONTOS, e não como dois comandos `A`.
 *
 * Os dois arcos custam ~90 bytes e os oito pontos ~290, e mesmo assim são os pontos:
 * `Extensao` guarda dado, não path emitido, para a régua de folga conseguir medir a
 * peça. Um caso especial em `A` seria a única extensão que o gate não enxerga —
 * exatamente a forma de defeito silencioso que este projeto já pagou.
 *
 * Oito pontos numa spline centrípeta fechada erram o círculo em menos de meio por
 * cento do raio, que a 56 px é um centésimo de pixel.
 */
function pontosElipse(cx: number, cy: number, rx: number, ry: number): Ponto[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 2 * Math.PI;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
}

/** Uma forma livre em coordenada absoluta, fechada por spline. */
function laco(pts: readonly Ponto[]): string {
  return `M ${n(pts[0].x)} ${n(pts[0].y)} ` + spline(pts, true) + `Z`;
}

// ---------------------------------------------------------------------------
// O catálogo
// ---------------------------------------------------------------------------

/**
 * OS CINCO MODELOS.
 *
 * A ordem é a do `criar-personagem`, e `curto` é o primeiro porque é o padrão: um
 * aluno que não escolha nada não pode aparecer careca (D5).
 */
export const CABELOS: Record<ModeloCabelo, Cabelo> = {
  /**
   * O corte-cuia clássico da boneca kokeshi: franja reta e laterais que descem.
   *
   * É o modelo de CALIBRAÇÃO — o mais barato dos cinco, e foi ele que fixou o teto
   * composto medindo o próprio custo em vez de ser espremido num teto adivinhado.
   */
  curto: {
    id: "curto",
    nome: "Corte curto",
    pontos: [
      { t: -0.12, y: 232 },
      { t: 0.05, y: 178 },
      { t: 0.2, y: 134 },
      { t: 0.42, y: 124 },
      { t: 0.68, y: 123 },
      { t: 0.88, y: 130 },
      { t: 0.99, y: 176 },
      { t: 1.14, y: 228 },
    ],
  },

  /**
   * Cachos: a franja é recortada em quatro festões e o volume passa do crânio.
   *
   * O festão tem 24 unidades de amplitude — quase 2 px a 56. Com menos ele vira uma
   * franja reta borrada, que é o mesmo desenho do `curto` pagando o dobro.
   */
  cacheado: {
    id: "cacheado",
    nome: "Cachos",
    pontos: [
      { t: -0.12, y: 236 },
      { t: 0.03, y: 184 },
      { t: 0.12, y: 140 },
      { t: 0.22, y: 112 },
      { t: 0.33, y: 132 },
      { t: 0.45, y: 111 },
      { t: 0.57, y: 132 },
      { t: 0.69, y: 111 },
      { t: 0.79, y: 130 },
      { t: 0.89, y: 113 },
      { t: 0.99, y: 172 },
      { t: 1.14, y: 230 },
    ],
    extensoes: [
      {
        atras: true,
        forma: [
          { x: 96, y: 148 },
          { x: 88, y: 92 },
          { x: 126, y: 44 },
          { x: 150, y: 8 },
          { x: 208, y: 18 },
          { x: 262, y: -4 },
          { x: 318, y: 14 },
          { x: 372, y: 6 },
          { x: 406, y: 48 },
          { x: 432, y: 96 },
          { x: 424, y: 150 },
        ],
      },
    ],
  },

  /**
   * Repartido ao meio, com uma trança caindo do lado esquerdo da imagem.
   *
   * O pico central é o que faz ler como repartido: três pontos apertados em torno
   * de `t` 0,5, com 16 unidades entre o pico e os vizinhos. Uma franja arqueada
   * suave já existe — é o `curto` —, e dois modelos com a mesma silhueta a 56 px
   * reprovam o gate (a).
   */
  tranca: {
    id: "tranca",
    nome: "Trança",
    pontos: [
      { t: -0.12, y: 226 },
      { t: 0.05, y: 176 },
      { t: 0.19, y: 136 },
      { t: 0.37, y: 128 },
      { t: 0.5, y: 108 },
      { t: 0.63, y: 128 },
      { t: 0.88, y: 128 },
      { t: 1.0, y: 174 },
      { t: 1.14, y: 226 },
    ],
    extensoes: [
      {
        // A trança ZIGUEZAGUEIA de propósito: os oito pontos alternam de lado, e a
        // spline centrípeta os liga numa corda ondulada em vez de num charuto. A
        // primeira tentativa era um contorno suave e leu como uma mancha escura
        // colada na bochecha — trança sem trançado é borrão.
        forma: [
          { x: 96, y: 182 },
          { x: 58, y: 218 },
          { x: 82, y: 262 },
          { x: 48, y: 306 },
          { x: 70, y: 352 },
          { x: 52, y: 396 },
          { x: 98, y: 404 },
          { x: 104, y: 348 },
          { x: 100, y: 266 },
          { x: 124, y: 212 },
        ],
      },
    ],
  },

  /**
   * Cabelo preso: a franja sobe e mostra testa, e o coque fica ATRÁS da cabeça.
   *
   * `atras: true` não é detalhe de ordem — é o que separa "coque preso atrás" de
   * "bola colada na testa". A cabeça é opaca e cobre a emenda, que é o mesmo
   * mecanismo de oclusão que o estilo inteiro usa em vez de máscara.
   */
  coque: {
    id: "coque",
    nome: "Coque",
    pontos: [
      { t: -0.12, y: 206 },
      { t: 0.05, y: 152 },
      { t: 0.24, y: 108 },
      { t: 0.52, y: 100 },
      { t: 0.86, y: 110 },
      { t: 1.0, y: 158 },
      { t: 1.14, y: 204 },
    ],
    // O coque é uma BOLA, e a primeira versão era um ovo deitado de 124 × 104 —
    // com o crânio comendo a metade de baixo, o que sobrava na tela era uma laje de
    // topo reto, que lê como boina e não como coque. Uma circunferência de raio 50
    // resolve: o que passa do crânio é uma calota, e calota de círculo é redonda em
    // qualquer altura em que ela seja cortada.
    extensoes: [{ atras: true, forma: pontosElipse(228, 14, 50, 48) }],
  },

  /**
   * Moicano: a única `faixa` dos cinco, com o crânio à mostra dos dois lados.
   *
   * O laço é uma faixa que sobe do meio da testa até o alto, alargando — e a crista
   * que passa do crânio é extensão à frente, porque ela cruza a silhueta pelo topo,
   * onde não há cabeça atrás para ocultar emenda nenhuma.
   */
  moicano: {
    id: "moicano",
    nome: "Moicano",
    extensoes: [
      {
        // UMA peça só, em coordenada absoluta, que nasce dentro do crânio (y 136, com
        // folga de sobra sobre as sobrancelhas) e sobe a 44 acima dele em três bicos.
        //
        // Absoluta, e não em `{t, y}`, porque é justamente o `t` que produzia o funil
        // descrito no topo do arquivo. Aqui a largura da crista é a que está escrita:
        // ~100 unidades constantes contra os 364 da cabeça, do começo ao fim.
        forma: [
          { x: 198, y: 96 },
          { x: 184, y: 30 },
          { x: 176, y: -34 },
          { x: 216, y: 8 },
          { x: 230, y: -76 },
          { x: 264, y: -4 },
          { x: 290, y: -60 },
          { x: 314, y: 12 },
          { x: 310, y: 54 },
          { x: 306, y: 96 },
          { x: 252, y: 108 },
        ],
      },
    ],
  },
};

/** A lista na ordem do catálogo, para as folhas e para o `criar-personagem`. */
export const MODELOS_CABELO = Object.keys(CABELOS) as ModeloCabelo[];

// ---------------------------------------------------------------------------
// Os paths
// ---------------------------------------------------------------------------

/**
 * O PATH DA TOUCA. `dy` sobe a forma inteira para a camada clara.
 *
 * Fecha por um retângulo a `FORA` da caixa da cabeça — invisível por construção,
 * porque quem chama o desenha dentro do `clipPath` do crânio.
 *
 * Devolve `""` para o modelo sem touca (o moicano), e quem emite trata a string
 * vazia. É mais barato que um `null` para o compositor concatenar.
 */
export function pathCabelo(modelo: ModeloCabelo, dy = 0): string {
  const franja = CABELOS[modelo].pontos;
  if (!franja) return "";
  const pts = franja.map((p) => ponto(p, dy));

  const x0 = CAIXA_CABECA.x0 - FORA;
  const x1 = CAIXA_CABECA.x1 + FORA;
  const yTopo = CAIXA_CABECA.y0 - FORA;
  return (
    `M ${n(pts[0].x)} ${n(pts[0].y)} ` +
    spline(pts) +
    `L ${n(x1)} ${n(yTopo)} L ${n(x0)} ${n(yTopo)} Z`
  );
}

/** A camada clara: a mesma forma, subida o degrau de sombra. */
export function pathCabeloClaro(modelo: ModeloCabelo): string {
  return pathCabelo(modelo, -DEGRAU);
}

/** O path de uma extensão. Laço fechado, coordenada absoluta, sem clip. */
export function pathExtensao(e: Extensao): string {
  return laco(e.forma);
}

/**
 * QUANTO CADA EXTENSÃO ENTRA NA CABEÇA — a amarra que impede um coque flutuando.
 *
 * É o análogo, um slot acima, do gate (d) que o `tipos.ts:65` promete aos trajes:
 * *"a exigência não é registro exato, é sobreposição ≥ `SANGRIA`"*. Uma extensão que
 * só encoste na silhueta lê como adesivo colado ao lado da cabeça, e basta meio
 * pixel de antialiasing para aparecer uma fresta de fundo entre as duas.
 *
 * A medida é a **penetração mais funda**: entre os pontos da peça que caem dentro do
 * contorno do crânio, a maior distância até esse contorno. Devolve 0 se nenhum ponto
 * entra — que é o caso a reprovar.
 */
export function ancoragemDasExtensoes(modelo: ModeloCabelo): number[] {
  const contorno = CABECA.contorno;

  /** Ray casting horizontal: quantas vezes a semirreta para a direita cruza. */
  const dentro = (p: Ponto): boolean => {
    let bate = false;
    for (let i = 0, j = contorno.length - 1; i < contorno.length; j = i++) {
      const a = contorno[i];
      const b = contorno[j];
      if (a.y > p.y !== b.y > p.y) {
        const x = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
        if (p.x < x) bate = !bate;
      }
    }
    return bate;
  };

  /** Distância de um ponto ao contorno, medida segmento a segmento. */
  const ateOContorno = (p: Ponto): number => {
    let melhor = Infinity;
    for (let i = 0, j = contorno.length - 1; i < contorno.length; j = i++) {
      const a = contorno[i];
      const b = contorno[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
      melhor = Math.min(melhor, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
    }
    return melhor;
  };

  return (CABELOS[modelo].extensoes ?? []).map((e) => {
    let fundo = 0;
    const pts = [...e.forma, e.forma[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k <= 12; k++) {
        const p = {
          x: pts[i].x + ((pts[i + 1].x - pts[i].x) * k) / 12,
          y: pts[i].y + ((pts[i + 1].y - pts[i].y) * k) / 12,
        };
        if (dentro(p)) fundo = Math.max(fundo, ateOContorno(p));
      }
    }
    return fundo;
  });
}

/**
 * A FOLGA ENTRE A FRANJA E CADA SOBRANCELHA — a amarra 1, medida.
 *
 * A régua ingênua ("o `y` mais alto da tabela") mede a coisa errada, e o erro tem
 * sinal: a ponta de toda franja desce a 230 para sair da silhueta pelos lados, e
 * aquele ponto está a 130 unidades de distância horizontal da sobrancelha mais
 * próxima. Reprovar por causa dele reprovaria os cinco modelos por um trecho que
 * ninguém vê como invasão de rosto.
 *
 * O que importa é **vertical, sobre a sobrancelha e só ali**: para cada uma das
 * duas, a franja é amostrada na faixa horizontal que aquela sobrancelha ocupa, e a
 * folga é a distância do ponto mais baixo da franja (com meio traço) ao topo da
 * sobrancelha (com meio traço dela e a sagita).
 *
 * **As duas folgas são diferentes, e é o `GIRO` aparecendo.** A sobrancelha direita
 * fica `GIRO.desnivelOlhos` mais ALTA, então sobra menos testa daquele lado — um
 * cabelo simétrico em `t` sai assimétrico em folga. Foi essa conta que reprovou a
 * primeira tabela do `curto`, que dava 25,5 à esquerda e **8,3** à direita.
 *
 * A amostragem é sobre a poligonal, não sobre a spline emitida: a centrípeta se
 * afasta da corda menos que um traço em todo o percurso (o mesmo argumento de
 * `bordasEm`), e a folga tem margem de sobra para isso.
 *
 * **Ela mede a franja E as extensões da frente**, e a segunda metade não é zelo: o
 * moicano deixou de ter franja, e uma régua que só olhasse `pontos` daria `Infinity`
 * para ele — aprovação por vacuidade, o defeito que este projeto já pagou duas
 * vezes. As de trás ficam de fora com motivo: peça atrás da cabeça é ocultada por
 * ela, e o que a cabeça oculta não invade rosto nenhum.
 */
export function folgaDoRosto(modelo: ModeloCabelo): { esq: number; dir: number } {
  const m = CABELOS[modelo];
  const trechos: { x: number; y: number }[][] = [];
  if (m.pontos) trechos.push(m.pontos.map((p) => ponto(p, 0)));
  for (const e of m.extensoes ?? []) {
    if (!e.atras) trechos.push([...e.forma, e.forma[0]]);
  }

  /** O `y` mais baixo de toda poligonal dentro de uma faixa de `x`. */
  const maisBaixo = (x0: number, x1: number): number => {
    let y = -Infinity;
    for (const pts of trechos) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        for (let k = 0; k <= 20; k++) {
          const x = a.x + ((b.x - a.x) * k) / 20;
          if (x >= x0 && x <= x1) y = Math.max(y, a.y + ((b.y - a.y) * k) / 20);
        }
      }
    }
    return y;
  };

  const folga = (cx: number, cyOlho: number): number => {
    const topo =
      cyOlho - SOBRANCELHA.acimaDoOlho - SOBRANCELHA.espessura / 2 - SOBRANCELHA.sagita;
    const baixo = maisBaixo(cx - SOBRANCELHA.larg / 2, cx + SOBRANCELHA.larg / 2);
    // Nenhuma tinta do cabelo passa por cima daquela sobrancelha: o moicano é
    // estreito e não alcança a direita. Não invadir é o melhor resultado possível.
    if (baixo === -Infinity) return Infinity;
    return topo - (baixo + TRACO / 2);
  };

  return {
    esq: folga(OLHO_CX_ESQ, OLHO_CY_ESQ),
    dir: folga(OLHO_CX_DIR, OLHO_CY_DIR),
  };
}
