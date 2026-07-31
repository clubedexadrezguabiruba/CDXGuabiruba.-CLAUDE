/**
 * A GEOMETRIA DO BONECO — todo número que define uma forma mora aqui.
 *
 * Este arquivo é a resposta a uma pergunta única: **onde termina o boneco?**
 *
 * No pipeline morto essa pergunta era respondida por traçado — a silhueta vivia
 * dentro de um PNG gerado e precisava ser *recuperada* por máscara, dilatação,
 * erosão e registro. Toda recuperação é aproximada, e as seis medições da fase
 * anterior (2851 px de costura, 1889 px de fundo sobre as mãos, 2909 px de furo,
 * 2696 px de pé sob a bota, 466 px de vazamento, 66–94 px de sangria) são o mesmo
 * defeito seis vezes: uma fronteira que ninguém era dono.
 *
 * Aqui a fronteira tem dono, e o dono é este arquivo. Nenhum traje, chapéu ou
 * uniforme declara silhueta — a `interface Traje` (tipos.ts) não tem o campo, e
 * um traje que tente declarar **não compila**. A trava é o `typecheck`, não um
 * gate: não existe segunda cópia da silhueta para divergir da primeira.
 *
 * ---------------------------------------------------------------------------
 * DE ONDE VIERAM OS NÚMEROS
 * ---------------------------------------------------------------------------
 *
 * Da `scripts/avatar/fonte/estilo-kokeshi/referencia-base.png` (1254×1254), lida
 * uma vez e medida. As proporções da referência, que são o que este arquivo
 * preserva:
 *
 * | medida na referência (px)          | valor | razão preservada        |
 * |------------------------------------|-------|-------------------------|
 * | altura da figura (topo → base)     |  885  | —                       |
 * | altura da cabeça                   |  450  | **0,508 da figura**     |
 * | largura da cabeça                  |  535  | 1,19 × a própria altura |
 * | altura do tronco                   |  435  | 0,492 da figura         |
 * | largura do tronco no ombro         |  370  | 0,69 da cabeça          |
 * | largura do tronco na base          |  420  | 0,79 da cabeça          |
 * | altura do olho                     |  118  | 0,26 da cabeça          |
 * | largura do olho                    |   40  | 0,075 da cabeça         |
 * | separação entre centros dos olhos  |  232  | 0,43 da cabeça          |
 * | centro do olho, do topo da cabeça  |  276  | 0,61 da cabeça          |
 * | centro da orelha, do topo          |  300  | 0,667 da cabeça         |
 * | espessura do contorno              |   15  | —                       |
 *
 * O fator de conversão é **0,69** (610 unidades de figura para 885 px de
 * referência), aplicado igual em x e y para não distorcer.
 *
 * ---------------------------------------------------------------------------
 * A POSE É FRONTAL, E ISSO CORRIGE O PLANO
 * ---------------------------------------------------------------------------
 *
 * O plano (doc 15, §2 item 3) descreve a referência como "levemente em 3/4,
 * orelha visível de um lado, leve giro de cabeça e tronco". **A referência medida
 * não é isso.** Ela é frontal: as duas orelhas aparecem, simétricas, e o tronco
 * não gira. A única assimetria é de LUZ — o especular no canto superior esquerdo
 * e a sombra do chão deslocada para a direita.
 *
 * A referência vence, porque é ela que vai anexada em todo pedido de imagem: um
 * prompt pedindo 3/4 produziria peças que não casam com a base. A assimetria que
 * o sistema herda como dado é a da luz, não a do giro — ver `LUZ`.
 *
 * ---------------------------------------------------------------------------
 * A PROPORÇÃO 1:3 ESTÁ REVOGADA
 * ---------------------------------------------------------------------------
 *
 * A D1 do doc 12 escolheu 1:3 (cabeça = um terço da figura) na T0.12 do doc 14.
 * Aqui a cabeça é **0,508 da figura** — praticamente 1:2. A revogação é
 * deliberada e é consequência da troca de estilo, não um descuido: o boneco novo
 * não tem pernas, e sem pernas não existe a figura de três cabeças que a D1
 * media. O ganho de legibilidade a 56 px vem junto; o custo é o item 8 da §2 do
 * doc 15 (tudo que identifica o aluno passa a caber na cabeça), endereçado pelos
 * slots `emblema` e `rosto`.
 */

// ---------------------------------------------------------------------------
// O canvas
// ---------------------------------------------------------------------------

/**
 * O `viewBox` de tudo. 500×700 é 5:7 — o mesmo `CANVAS_RATIO` que o
 * `SIZE_CONFIG`, os frames, o ranking e o Quadro de Honra já usam. O container
 * não muda; o que muda é o que se desenha dentro dele.
 *
 * `CANVAS_PRODUCTION` (800×1120) e o 2556×3840 do pipeline morto não têm
 * equivalente aqui: SVG autorado não tem resolução de produção.
 */
export const VIEWBOX = { w: 500, h: 700 } as const;

/** O eixo de simetria da figura. Tudo que é par se espelha nele. */
export const CENTRO_X = 250;

// ---------------------------------------------------------------------------
// O traço
// ---------------------------------------------------------------------------

/**
 * Espessura do contorno, em unidades do `viewBox`.
 *
 * É o número mais sensível do arquivo, e o doc 15 (§2 item 1) explica por quê:
 * 1 px de erro num traço grosso lê instantaneamente a 56 px. A defesa não é
 * precisão, é **haver um único traço**: este valor sai daqui, vira
 * `--av-traco` no `<svg>`, e só o compositor o desenha.
 *
 * A primeira rodada usou 10, estimando o traço da referência em 15 px. A folha
 * de contato desmentiu na hora — lado a lado a 425 px, o SVG lia visivelmente
 * mais pálido que a referência, e a 56 px a diferença virava perda de silhueta.
 * O traço real da referência é ~25 px em 1254, e 25 × 0,69 = 17. É exatamente o
 * tipo de erro que só a comparação lado a lado pega: nenhum gate reprovaria um
 * boneco de traço fino, porque estruturalmente não há nada errado com ele.
 */
export const TRACO = 17;

/**
 * Sangria mínima que a tinta de um PNG precisa exceder o clip, em unidades do
 * `viewBox`. É a "faca de corte" da §3 do doc 15: o overfill deixa de ser o
 * defeito de 1 px e vira o comportamento exigido.
 *
 * Vale ≥ metade do traço, porque é o traço que cobre a região de corte. Meio
 * traço são 8,5; 10 dá folga para o antialiasing do clip em DPR fracionário
 * (§8 item 6). O teste em `trava-silhueta.test.ts` mantém a relação amarrada:
 * quem mexer no traço sem mexer aqui quebra a suíte.
 */
export const SANGRIA = 10;

// ---------------------------------------------------------------------------
// A cabeça
// ---------------------------------------------------------------------------

/**
 * Retângulo de cantos muito arredondados — o "kokeshi". Mais larga que alta
 * (1,19:1), como a referência.
 *
 * `r` é o raio dos quatro cantos. 96 são 0,26 da largura; a curva é emitida como
 * quadrática com o vértice do canto por controle, que fica ligeiramente mais
 * "quadrada" que um arco de círculo — e é assim que a referência lê.
 */
export const CABECA = {
  x0: 65,
  y0: 45,
  x1: 435,
  y1: 355,
  r: 96,
} as const;

export const CABECA_W = CABECA.x1 - CABECA.x0; // 370
export const CABECA_H = CABECA.y1 - CABECA.y0; // 310

/**
 * As orelhas. Elipses centradas NA BORDA da cabeça: metade fica fora (é o que se
 * vê) e metade fica dentro (coberta pela cabeça, que é desenhada depois e é
 * opaca).
 *
 * É a mesma técnica dos braços da folhinha, que começam *dentro* do corpo para o
 * corpo cobrir a emenda (`prototipo/pet.ts`, linhas 89–96). Não há fronteira a
 * alinhar porque não há encontro: há sobreposição, e o de cima ganha.
 */
export const ORELHA = {
  cy: CABECA.y0 + Math.round(0.655 * CABECA_H), // 248
  rx: 36,
  ry: 40,
} as const;
/**
 * A primeira rodada usou `rx 30 / ry 45` e o close de coordenada medida mostrou
 * uma lasca fina e alongada onde a referência tem uma orelha quase redonda,
 * saindo mais da cabeça. Trocado por `36 / 40`. O close é a razão de o defeito
 * ter aparecido: nos 4 tamanhos a orelha some, e nenhuma leitura de corpo
 * inteiro o teria pego.
 */

/**
 * Os olhos: cápsulas verticais pretas. Sem nariz, sem boca, sem sobrancelha —
 * a referência não tem nenhum dos três, e cada um seria escopo.
 *
 * Eles são do COMPOSITOR e não de uma imagem, e é isso que torna o piscar
 * possível de graça: `scaleY` numa forma que o sistema desenha. Um olho vindo de
 * PNG não piscaria (doc 15, §6).
 */
export const OLHO = {
  w: 28,
  h: 81,
  /** Raio da cápsula: metade da largura, para as pontas serem semicírculos. */
  r: 14,
  cy: CABECA.y0 + Math.round(0.61 * CABECA_H), // 234
  /** Distância entre os CENTROS dos dois olhos. */
  separacao: 160,
} as const;

export const OLHO_CX_ESQ = CENTRO_X - OLHO.separacao / 2; // 170
export const OLHO_CX_DIR = CENTRO_X + OLHO.separacao / 2; // 330

// ---------------------------------------------------------------------------
// O tronco
// ---------------------------------------------------------------------------

/**
 * A FOLGA DE PROJETO — o primeiro dos três mecanismos da §4 do doc 15.
 *
 * O tronco canônico é desenhado 5% para DENTRO da figura de referência. A folga
 * nasce embutida, antes de qualquer imagem existir: quando o Doug gerar um traje
 * seguindo a mesma referência, a tinta dele já cobre este clip com sobra, sem
 * ninguém ter medido nada.
 *
 * Encolher é feito UMA VEZ, aqui, e não por peça: a silhueta é compartilhada
 * pela cabeça e pelos 14 trajes, e tem de ser constante. Um traje que encolhesse
 * a própria silhueta reintroduziria a segunda cópia que este arquivo existe para
 * eliminar.
 */
export const FOLGA_PROJETO = 0.95;

/**
 * A cápsula do tronco: estreita no ombro, abrindo até a base, com os dois cantos
 * de baixo bem arredondados.
 *
 * `yTopo` fica 35 unidades ACIMA da base da cabeça de propósito. O topo do
 * tronco não é uma fronteira a alinhar — ele sobe atrás da cabeça e some sob
 * ela. Conferido: a 320 a cabeça vai de x 87 a 413, e o tronco de 128 a 372.
 * Coberto com 41 unidades de folga de cada lado.
 *
 * É a ÚNICA fronteira pele↔pano que sobra no boneco (eram ~8), e ela é uma
 * sobreposição opaca em que a cabeça sempre ganha no z-order.
 */
export const TRONCO = {
  /** Escondido sob a cabeça. Não é fronteira, é sobreposição. */
  yTopo: 320,
  yBase: 645,
  /** Meia-largura no ombro e na base — já com a folga de 5% aplicada. */
  meioOmbro: Math.round((370 * 0.69 * FOLGA_PROJETO) / 2), // 121
  meioBase: Math.round((420 * 0.69 * FOLGA_PROJETO) / 2), // 138
  /**
   * Raio dos dois cantos de baixo.
   *
   * A primeira rodada usou 46 e o close da base do tronco mostrou um retângulo
   * de cantos suaves onde a referência tem uma CÁPSULA — os cantos dela são
   * quase semicírculos, e é isso que faz o boneco ler como peça de madeira
   * torneada em vez de caixa. 74 são 0,27 da largura da base.
   */
  r: 74,
} as const;

// ---------------------------------------------------------------------------
// A luz
// ---------------------------------------------------------------------------

/**
 * A assimetria do sistema, e a única que existe: a luz vem de CIMA-ESQUERDA.
 *
 * Dela saem três coisas, e nenhuma pode divergir das outras — o canto do
 * especular na cabeça, o lado da faixa de sombra (o oposto, baixo-direita) e o
 * deslocamento da sombra no chão. Quando um item novo precisar decidir "de que
 * lado fica o brilho", a resposta está aqui e não no gosto de quem desenha.
 *
 * É também o que vai escrito no prompt-template fixo (doc 15, §4): "um brilho
 * especular discreto na cabeça, no mesmo canto da referência".
 */
export const LUZ = {
  canto: "superior-esquerdo",
  /** Para onde a sombra do chão escorre, em unidades do `viewBox`. */
  desvioSombra: 12,
} as const;

/**
 * A sombra no chão. Elipse achatada sob o tronco, deslocada pela `LUZ`.
 *
 * Feita de três elipses concêntricas com opacidade decrescente em vez de um
 * `<filter>` com `feGaussianBlur`: filtro exige `id`, e `id` colide quando as
 * camadas são concatenadas num `<svg>` só (D22; doc 15, §8 item 4). Três elipses
 * não têm `id`, não têm custo de filtro em mobile, e a 56 px ninguém distingue.
 *
 * Ela fica FORA do grupo que respira, e é o que vende a flutuação: quando o
 * boneco sobe, a sombra encolhe (doc 15, §6).
 */
export const SOMBRA_CHAO = {
  cx: CENTRO_X + LUZ.desvioSombra,
  cy: TRONCO.yBase + 8,
  rx: 150,
  ry: 26,
} as const;

// ---------------------------------------------------------------------------
// Os paths — as três formas que são a silhueta
// ---------------------------------------------------------------------------

/**
 * O contorno da cabeça, fechado.
 *
 * Quadráticas com o vértice do canto por controle. Um arco de círculo passaria
 * a 0,293·r da diagonal; a quadrática passa a 0,25·r, o que deixa o canto um
 * traço mais quadrado — e é o que a referência mostra.
 */
export function pathCabeca(): string {
  const { x0, y0, x1, y1, r } = CABECA;
  return (
    `M ${x0 + r} ${y0} ` +
    `L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} ` +
    `L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} ` +
    `L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} ` +
    `L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`
  );
}

/**
 * **O PATH CANÔNICO DO TRONCO.** É este, e só este, que os 14 trajes clipam.
 *
 * Não existe segunda cópia em lugar nenhum do sistema — nem no traje (o tipo não
 * tem o campo), nem no gate (que rasteriza esta mesma função), nem no asset (que
 * é tinta, não forma). É a diferença entre `registro()`, que exigia que duas
 * silhuetas COINCIDISSEM, e este arquivo, que só tem uma.
 */
export function pathTronco(): string {
  const { yTopo, yBase, meioOmbro, meioBase, r } = TRONCO;
  const xoE = CENTRO_X - meioOmbro; // 129
  const xoD = CENTRO_X + meioOmbro; // 371
  const xbE = CENTRO_X - meioBase; // 112
  const xbD = CENTRO_X + meioBase; // 388
  const yReto = yBase - r; // 599
  // A lateral é uma cúbica com barriga: sai do ombro, abre depressa nos
  // primeiros 80 e depois quase se verticaliza. Uma reta daria o retângulo que
  // a primeira folha entregou.
  return (
    `M ${xoE} ${yTopo} ` +
    `L ${xoD} ${yTopo} ` +
    `C ${xoD + 20} ${yTopo + 70} ${xbD + 4} ${yTopo + 170} ${xbD} ${yReto} ` +
    `Q ${xbD} ${yBase} ${xbD - r} ${yBase} ` +
    `L ${xbE + r} ${yBase} ` +
    `Q ${xbE} ${yBase} ${xbE} ${yReto} ` +
    `C ${xbE - 4} ${yTopo + 170} ${xoE - 20} ${yTopo + 70} ${xoE} ${yTopo} Z`
  );
}

/**
 * O especular: uma vírgula fina acompanhando o canto superior esquerdo.
 *
 * Os dois extremos foram conferidos contra a curva da cabeça — em x=100 a borda
 * está em y≈60 e em x=145 está em y≈45,6; a vírgula anda de (100,120) a (145,64),
 * dentro com folga. É `#FFFFFF` com opacidade, não uma cor: assim ele clareia
 * qualquer um dos 8 tons de pele sem precisar de 8 valores.
 */
export function pathEspecular(): string {
  return (
    `M 104 116 ` +
    `C 100 94 118 73 143 68 ` +
    `C 150 66 153 73 147 77 ` +
    `C 127 85 116 103 114 120 ` +
    `C 113 126 105 125 104 116 Z`
  );
}

/**
 * A faixa de sombra da cabeça — o lado oposto ao da `LUZ`.
 *
 * Desenhada FOLGADA de propósito: ela é recortada pelo clip da cabeça, então os
 * pontos podem sair da forma sem consequência. Um degrau de cor chapada, e não
 * um `<linearGradient>`, porque gradiente precisa de `id` (§8 item 4) e porque
 * um degrau recolore junto com `--av-pele-s` sem nenhuma parada intermediária.
 */
export function pathSombraCabeca(): string {
  return `M 470 190 C 470 300 410 380 230 380 L 40 380 L 40 330 C 270 372 415 330 428 185 Z`;
}

/**
 * A faixa de sombra do tronco. Mesma lógica e mesma folga da cabeça: recortada
 * pelo clip do tronco.
 */
export function pathSombraTronco(): string {
  return `M 410 330 C 420 470 380 670 250 670 L 90 670 L 90 600 C 250 640 350 520 360 320 Z`;
}
