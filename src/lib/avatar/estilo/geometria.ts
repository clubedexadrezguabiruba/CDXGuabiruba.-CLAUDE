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
 * A POSE NÃO É SIMÉTRICA, E A VERSÃO ANTERIOR DESTE ARQUIVO ERRAVA NISSO
 * ---------------------------------------------------------------------------
 *
 * O docstring que estava aqui afirmava, com todas as letras, que "a referência é
 * frontal: as duas orelhas aparecem, simétricas, e o tronco não gira". **Isso
 * está errado**, e o erro custou uma base inteira. Pior: o número que o desmentia
 * apareceu no raciocínio que escreveu a frase — os dois olhos estavam a
 * distâncias diferentes do eixo — e foi descartado por impressão visual.
 *
 * A referência tem um **giro mínimo para a direita da imagem**, e ele aparece em
 * quatro sinais independentes, todos medidos em pixel por `scripts/avatar/estilo/
 * medir.ts` (unidades do `viewBox`, altura útil normalizada em 600):
 *
 * | sinal                                   | medido |
 * |-----------------------------------------|--------|
 * | saliência da orelha esquerda            | 24,1   |
 * | saliência da orelha direita             | 14,7   |
 * | ponto médio dos olhos, contra o eixo    | +33,5  |
 * | plano lateral escuro, esquerda / direita| 0 / 16 |
 * | eixo da cabeça, contra o eixo do tronco | +7,4   |
 *
 * Quatro sinais concordantes não são ruído de gerador: é leitura espacial
 * deliberada. E adotá-la **revoga a D3 do doc 12** ("pose: frontal simétrica"),
 * revogação registrada lá com o imposto que ela cobra dos 92 itens de catálogo.
 *
 * A mitigação está logo abaixo: a assimetria vira `GIRO`, um dado do sistema ao
 * lado de `LUZ`. Todo acessório futuro lê dali em vez de o desenhista decidir.
 *
 * ---------------------------------------------------------------------------
 * DE ONDE VIERAM OS NÚMEROS, E POR QUE OS ANTIGOS ESTAVAM 7% GRANDES
 * ---------------------------------------------------------------------------
 *
 * De `scripts/avatar/fonte/estilo-kokeshi/referencia-base.png` (1254×1254), lida
 * por `medir.ts` — nunca a olho. A **altura útil** da referência é **896 px**, do
 * topo do contorno da cabeça (y 148) à base do contorno do tronco (y 1044), e é
 * ela que vira as 600 unidades da figura aqui. O fator é **0,6696**.
 *
 * Uma medição anterior deu 837 px para essa mesma altura, e todo número derivado
 * dela saiu ~7% grande. O motivo é instrutivo: ela leu a silhueta como "pixel
 * diferente do fundo", e por baixo do tronco existe a **sombra do chão**, que é
 * tinta clara. A sombra engordou a base, a base escondeu o fim do tronco, e o
 * tronco pareceu terminar em y 985. Aqui a silhueta é o CONTORNO ESCURO — a
 * sombra do chão nunca chega perto de escura, então ela simplesmente não entra.
 *
 * As medidas, todas em unidades do `viewBox`:
 *
 * | medida                                  | referência | onde vive          |
 * |-----------------------------------------|------------|--------------------|
 * | largura da cabeça (silhueta externa)    |   376      | `CABECA`           |
 * | altura da cabeça                        |   312      | `CABECA`           |
 * | chato no ápice (primeira linha de tinta)|    36 (10%)| `CABECA.rxTopo`    |
 * | altura até a largura plena              |    78      | `CABECA.ryTopo`    |
 * | largura do olho                         |    37      | `OLHO.w`           |
 * | altura do olho                          |    82      | `OLHO.h`           |
 * | separação entre os centros dos olhos    |   155      | `OLHO.separacao`   |
 * | centro do olho, em fração da cabeça     |  0,621     | `OLHO.cy`          |
 * | centro da orelha, em fração da cabeça   |  0,653     | `ORELHA.cy`        |
 * | tronco: ombro / mais largo / base       | 226/288/251| `TRONCO.perfil`    |
 * | ponto mais largo do tronco              | 57% da alt.| `TRONCO.perfil`    |
 * | sombra do chão: eixo                    | CENTRADA   | `SOMBRA_CHAO`      |
 * | sombra do chão: largura × altura        |  385 × 66  | `SOMBRA_CHAO`      |
 *
 * ---------------------------------------------------------------------------
 * A PROPORÇÃO 1:3 ESTÁ REVOGADA
 * ---------------------------------------------------------------------------
 *
 * A D1 do doc 12 escolheu 1:3 (cabeça = um terço da figura) na T0.12 do doc 14.
 * Aqui a cabeça é **0,52 da figura** — praticamente 1:2. A revogação é deliberada
 * e é consequência da troca de estilo, não um descuido: o boneco novo não tem
 * pernas, e sem pernas não existe a figura de três cabeças que a D1 media. O
 * ganho de legibilidade a 56 px vem junto; o custo é o item 8 da §2 do doc 15
 * (tudo que identifica o aluno passa a caber na cabeça), endereçado pelos slots
 * `emblema` e `rosto`.
 */

// ---------------------------------------------------------------------------
// O canvas
// ---------------------------------------------------------------------------

/**
 * O `viewBox` de tudo. 500×700 é 5:7 — o mesmo `CANVAS_RATIO` que o
 * `SIZE_CONFIG`, os frames, o ranking e o Quadro de Honra já usam. O container
 * não muda; o que muda é o que se desenha dentro dele.
 */
export const VIEWBOX = { w: 500, h: 700 } as const;

/**
 * O eixo do TRONCO — e é só dele.
 *
 * Antes este era "o eixo de simetria da figura, tudo que é par se espelha nele".
 * Não é mais: a cabeça tem eixo próprio (`EIXO_CABECA`), deslocado de
 * `GIRO.eixoCabeca`. Quem espelhar às cegas neste valor põe a peça no lugar
 * errado — é exatamente o imposto que a §3 do plano nomeia.
 */
export const CENTRO_X = 250;

// ---------------------------------------------------------------------------
// O giro — a assimetria como DADO
// ---------------------------------------------------------------------------

/**
 * O GIRO. A leitura espacial da referência, em números, para que ela não precise
 * ser julgada de novo por ninguém.
 *
 * É o mesmo movimento que já foi feito para a `LUZ`: quando um chapéu novo
 * precisar decidir "quanto à direita ele senta", a resposta está aqui e não no
 * gosto de quem desenha. Um chapéu centrado em `CENTRO_X` fica visivelmente
 * errado nesta base.
 *
 * Todos os valores são o que se VÊ e o que `medir.ts` mede, não o que os paths
 * escrevem — a distinção importa nas orelhas, ver `ORELHA`.
 */
export const GIRO = {
  /** Quanto o eixo da cabeça fica à direita do eixo do tronco. Medido: 7,4. */
  eixoCabeca: 7,
  /** Quanto o par de olhos fica à direita do eixo da CABEÇA. Medido: 33,5. */
  desvioOlhos: 33,
  /** Quanto o olho direito fica mais ALTO que o esquerdo. Medido: 3,3. */
  desnivelOlhos: 3,
  /** Quanto cada orelha sai da silhueta da cabeça. Medido: 24,1 e 14,7. */
  saliencia: { esq: 24, dir: 15 },
  /**
   * Largura da faixa lateral escura, medida a partir da borda INTERNA do
   * contorno. Na cabeça só existe do lado direito (medido: 0 à esquerda, 16 à
   * direita); no tronco existe dos dois, com a direita mais larga em 3 de 3
   * alturas medidas.
   */
  planoLateral: { cabeca: 16, troncoEsq: 16, troncoDir: 19 },
} as const;

/** O eixo da cabeça. Não é `CENTRO_X`. */
export const EIXO_CABECA = CENTRO_X + GIRO.eixoCabeca; // 257

// ---------------------------------------------------------------------------
// O traço
// ---------------------------------------------------------------------------

/**
 * Espessura do contorno, em unidades do `viewBox`.
 *
 * É o número mais sensível do arquivo, e o doc 15 (§2 item 1) explica por quê:
 * 1 px de erro num traço grosso lê instantaneamente a 56 px. A defesa não é
 * precisão, é **haver um único traço**: este valor sai daqui, vira `--av-traco`
 * no `<svg>`, e só o compositor o desenha.
 *
 * A primeira rodada usou 10, estimando o traço da referência em 15 px. A folha de
 * contato desmentiu na hora — lado a lado a 425 px, o SVG lia visivelmente mais
 * pálido. O traço real da referência é ~25 px em 896 de altura útil, e
 * 25 × 0,6696 = 17.
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

/**
 * Metade do traço. Aparece o tempo todo porque o `stroke` do SVG é centrado no
 * path: a silhueta EXTERNA — que é a que `medir.ts` lê e a que o olho vê — fica
 * meio traço para fora de toda coordenada deste arquivo.
 */
const MEIO = TRACO / 2;

// ---------------------------------------------------------------------------
// A cabeça
// ---------------------------------------------------------------------------

/**
 * A cabeça: um retângulo de cantos elípticos, com o topo em CÚPULA e a base em
 * canto quase circular. Os dois raios são diferentes, e essa diferença é o
 * desenho.
 *
 * **O topo deixou de ser quadrado, e essa era a maior falha da base anterior.**
 * Ela usava um raio único de 96 numa cabeça de 370, o que deixava 178 unidades
 * de topo reto — **48% da largura**. A referência tem 36 em 376, ou **10%**.
 * Quatro vezes mais chata; a folha de contato não pegou, porque olho não mede
 * proporção.
 *
 * Os números abaixo são as coordenadas do PATH. A silhueta externa, que é o que
 * a medição compara, fica `MEIO` para fora em cada lado: 377 × 313.
 */
export const CABECA = {
  x0: EIXO_CABECA - 180, // 77
  x1: EIXO_CABECA + 180, // 437
  y0: 48,
  y1: 344,
  /**
   * O canto de cima é um arco elíptico largo e raso — uma cúpula. `rxTopo` sai
   * direto do chato do ápice: 360 de path menos 2 × 162 deixa os 36 medidos.
   */
  rxTopo: 168,
  ryTopo: 56,
  /**
   * O canto de baixo é ALTO e pouco fundo — o oposto do de cima. A cabeça fica
   * com a largura plena até quase 3/4 da altura e então recolhe depressa para
   * uma base reta de 241 unidades, que é o que cobre o ombro.
   */
  rxBase: 68,
  ryBase: 80,
} as const;

export const CABECA_W = CABECA.x1 - CABECA.x0; // 360
export const CABECA_H = CABECA.y1 - CABECA.y0; // 296

/**
 * As orelhas. Elipses cortadas pela cabeça: o que fica para fora é o que se vê,
 * o que fica para dentro some sob o preenchimento opaco da cabeça, que é
 * desenhada depois.
 *
 * É a mesma técnica dos braços da folhinha, que começam *dentro* do corpo para o
 * corpo cobrir a emenda (`prototipo/pet.ts`, linhas 89–96). Não há fronteira a
 * alinhar porque não há encontro: há sobreposição, e o de cima ganha.
 *
 * **A SALIÊNCIA É O CRITÉRIO, E `rx` É CONSEQUÊNCIA.** As duas orelhas têm o
 * MESMO tamanho — são a mesma orelha — e o que difere é o quanto cada uma está
 * escondida. A direita recua 11 unidades para dentro da cabeça e por isso mostra
 * 15 em vez de 24. Amarrar a saliência ao `rx` (dando à direita uma orelha
 * menor) produziria uma lasca em vez de uma orelha parcialmente oculta, que é o
 * que a referência tem — e travaria justamente a variável que produz a oclusão.
 */
export const ORELHA = {
  rx: 26,
  ry: 34,
  /** 0,653 da altura da cabeça, medido, contado da silhueta externa. */
  cy: Math.round(CABECA.y0 - MEIO + 0.653 * (CABECA_H + TRACO)), // 244
} as const;

/**
 * O centro de cada orelha, DERIVADO da saliência: a borda externa da orelha fica
 * `saliencia` para fora da borda externa da cabeça.
 */
export const ORELHA_CX_ESQ = CABECA.x0 - MEIO - GIRO.saliencia.esq + ORELHA.rx + MEIO;
export const ORELHA_CX_DIR = CABECA.x1 + MEIO + GIRO.saliencia.dir - ORELHA.rx - MEIO;

/**
 * Os olhos: cápsulas verticais pretas. Sem nariz, sem boca, sem sobrancelha — a
 * referência não tem nenhum dos três, e cada um seria escopo.
 *
 * Eles são do COMPOSITOR e não de uma imagem, e é isso que torna o piscar
 * possível de graça: `scaleY` numa forma que o sistema desenha. Um olho vindo de
 * PNG não piscaria (doc 15, §6).
 *
 * A base anterior os fez **simétricos e 24% estreitos** (28 contra os 37
 * medidos). O par inteiro anda `GIRO.desvioOlhos` para a direita do eixo da
 * cabeça, e o direito sobe `GIRO.desnivelOlhos` — os dois são o giro, não
 * descuido de quem desenhou a referência.
 */
export const OLHO = {
  w: 37,
  h: 82,
  /** Raio da cápsula: metade da largura, para as pontas serem semicírculos. */
  r: 18.5,
  /** 0,621 da altura da cabeça, medido, contado da silhueta externa. */
  cy: Math.round(CABECA.y0 - MEIO + 0.621 * (CABECA_H + TRACO)), // 234
  /** Distância entre os CENTROS dos dois olhos. */
  separacao: 155,
} as const;

/** O ponto médio do par, que anda com o giro. */
const OLHO_MEIO = EIXO_CABECA + GIRO.desvioOlhos; // 290
export const OLHO_CX_ESQ = OLHO_MEIO - OLHO.separacao / 2; // 212,5
export const OLHO_CX_DIR = OLHO_MEIO + OLHO.separacao / 2; // 367,5
export const OLHO_CY_ESQ = OLHO.cy + GIRO.desnivelOlhos / 2;
export const OLHO_CY_DIR = OLHO.cy - GIRO.desnivelOlhos / 2;

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
 * pela cabeça e pelos 14 trajes, e tem de ser constante.
 *
 * **O gate sabe desta folga.** `verificar-pose.ts` compara o tronco contra a
 * referência multiplicada por este mesmo fator; senão ele reportaria 5% de erro
 * para sempre, e um gate que acusa o que é deliberado é um gate que se aprende a
 * ignorar. Ela também resolve um aperto real: com a cabeça fiel à referência, a
 * base dela cobriria o ombro por só 7 unidades de cada lado. Com a folga, 13.
 */
export const FOLGA_PROJETO = 0.95;

/**
 * O tronco: uma cápsula que sai estreita do ombro, engorda até 57% da altura e
 * afunila num arremate raso e muito arredondado.
 *
 * **O perfil é uma tabela de medidas, não uma curva escolhida.** Cada linha é
 * uma meia-largura da silhueta EXTERNA da referência naquela altura, antes da
 * folga e antes do traço; `pathTronco()` aplica os dois e liga os pontos com uma
 * spline de Catmull-Rom. A base anterior usava duas cúbicas com números
 * ajustados até "ficar bom" e entregou um tronco com o ponto mais largo na BASE,
 * quando a referência o tem a 57% — e uma razão ombro/máximo de 0,877 contra os
 * 0,785 medidos.
 *
 * `yTopo` fica acima da base da cabeça de propósito. O topo do tronco não é uma
 * fronteira a alinhar — ele sobe atrás da cabeça e some sob ela. É a ÚNICA
 * fronteira pele↔pano que sobra no boneco (eram ~8), e ela é uma sobreposição
 * opaca em que a cabeça sempre ganha no z-order.
 */
export const TRONCO = {
  /** Escondido sob a cabeça. Não é fronteira, é sobreposição. */
  yTopo: 320,
  /**
   * Meia-largura da silhueta externa medida na referência. A primeira linha é
   * extrapolada — naquela altura o tronco está sob a cabeça e não há o que medir.
   */
  perfil: [
    { y: 320, meio: 104 },
    { y: 353, meio: 113.5 },
    { y: 410, meio: 133 },
    { y: 463, meio: 141 },
    { y: 523, meio: 145 },
    { y: 570, meio: 141 },
    { y: 611, meio: 126 },
  ],
  /** Onde o path fecha embaixo. A silhueta externa vai a `yBase + MEIO`. */
  yBase: 632,
  /**
   * Altura do arremate. Raso de propósito: a referência colapsa de 251 de
   * largura para uma ponta em 43 px, o que é um arco largo e baixo, não o canto
   * arredondado de raio 74 que a base anterior desenhou.
   */
  ryArremate: 21,
} as const;

/** Converte uma meia-largura MEDIDA em meia-largura de PATH. */
const meioPath = (meio: number) => meio * FOLGA_PROJETO - MEIO;

// ---------------------------------------------------------------------------
// A luz
// ---------------------------------------------------------------------------

/**
 * A assimetria de ILUMINAÇÃO, que é diferente da de pose (`GIRO`) e não pode ser
 * confundida com ela: a luz vem de CIMA-ESQUERDA.
 *
 * Dela sai o canto do especular na cabeça. O que NÃO sai mais dela é a sombra do
 * chão: a medição diz que ela é centrada (eixo em 611, contra 611,5 do tronco), e
 * o `desvioSombra` de 12 unidades que existia aqui era invenção — eu havia
 * escrito no plano que a sombra da referência era deslocada, e ela não é.
 *
 * É também o que vai escrito no prompt-template fixo (doc 15, §4): "um brilho
 * especular discreto na cabeça, no mesmo canto da referência".
 */
export const LUZ = {
  canto: "superior-esquerdo",
} as const;

/**
 * A sombra no chão. UMA elipse, achatada, **centrada no eixo do tronco**.
 *
 * A base anterior a fez com metade do tamanho (300 × 52 contra os 385 × 66
 * medidos) e deslocada 12 unidades. Os dois defeitos passaram na folha de
 * contato.
 *
 * Ela fica FORA do grupo que respira, e é o que vende a flutuação: quando o
 * boneco sobe, a sombra encolhe (doc 15, §6).
 */
export const SOMBRA_CHAO = {
  cx: CENTRO_X,
  cy: 622,
  rx: 205,
  ry: 36,
  /**
   * As paradas do gradiente radial. Não são estética: são o que faz a parte
   * VISÍVEL da sombra — a que sobra abaixo da base do tronco — medir os 329
   * unidades de largura e os 48 níveis de escurecimento da referência. O centro
   * da elipse fica atrás do tronco, então uma rampa que começa a cair cedo
   * entrega uma sombra pálida e curta mesmo com o `rx` certo.
   */
  paradas: [
    { em: 0, opacidade: 0.24 },
    { em: 0.75, opacidade: 0.21 },
    { em: 1, opacidade: 0 },
  ],
} as const;

// ---------------------------------------------------------------------------
// Os paths
// ---------------------------------------------------------------------------

const n = (v: number) => (Math.round(v * 10) / 10).toString();

/**
 * A cabeça, com um recuo opcional para dentro.
 *
 * `k = 0` é a silhueta. Valores positivos encolhem e negativos engordam, e é
 * assim que o plano lateral (`pathPlanoLateralCabeca`) consegue acompanhar a
 * borda sem que exista uma segunda descrição da forma da cabeça — que é
 * exatamente a segunda cópia que este arquivo existe para não ter.
 */
function cabecaRecuada(k: number) {
  return {
    x0: CABECA.x0 + k,
    x1: CABECA.x1 - k,
    y0: CABECA.y0 + k,
    y1: CABECA.y1 - k,
    rxT: Math.max(2, CABECA.rxTopo - k),
    ryT: Math.max(2, CABECA.ryTopo - k),
    rxB: Math.max(2, CABECA.rxBase - k),
    ryB: Math.max(2, CABECA.ryBase - k),
  };
}

/**
 * O contorno da cabeça, fechado. Arcos elípticos (`A`), não quadráticas.
 *
 * A quadrática que estava aqui passa a 0,25·r da diagonal do canto e produz um
 * canto mais quadrado — o que era certo quando se acreditava que o topo da
 * referência fosse chato. Com a cúpula medida (rx 162 contra ry 70), a
 * quadrática não tem como descrever a forma: ela não sabe fazer um canto mais
 * largo que alto sem virar um bico.
 */
export function pathCabeca(): string {
  const c = cabecaRecuada(0);
  return (
    `M ${n(c.x0 + c.rxT)} ${n(c.y0)} ` +
    `L ${n(c.x1 - c.rxT)} ${n(c.y0)} ` +
    `A ${n(c.rxT)} ${n(c.ryT)} 0 0 1 ${n(c.x1)} ${n(c.y0 + c.ryT)} ` +
    `L ${n(c.x1)} ${n(c.y1 - c.ryB)} ` +
    `A ${n(c.rxB)} ${n(c.ryB)} 0 0 1 ${n(c.x1 - c.rxB)} ${n(c.y1)} ` +
    `L ${n(c.x0 + c.rxB)} ${n(c.y1)} ` +
    `A ${n(c.rxB)} ${n(c.ryB)} 0 0 1 ${n(c.x0)} ${n(c.y1 - c.ryB)} ` +
    `L ${n(c.x0)} ${n(c.y0 + c.ryT)} ` +
    `A ${n(c.rxT)} ${n(c.ryT)} 0 0 1 ${n(c.x0 + c.rxT)} ${n(c.y0)} Z`
  );
}

/**
 * Uma spline de Catmull-Rom por pontos, emitida como cúbicas de Bézier.
 *
 * Existe para que o perfil do tronco possa ser uma TABELA DE MEDIDAS em vez de
 * pontos de controle ajustados no olho. A conversão é a padrão: o controle de
 * cada ponto é a sexta parte da diferença entre os vizinhos.
 */
function spline(pts: { x: number; y: number }[]): string {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C ${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(p2.x)} ${n(p2.y)} `;
  }
  return d;
}

/**
 * Os pontos do perfil do tronco de um lado, já com folga e traço aplicados.
 *
 * `ateBase` acrescenta dois pontos que acompanham o arremate. Só os planos
 * laterais usam: o path do tronco fecha embaixo com o arco, e repetir a curva
 * como pontos daria duas descrições da mesma borda.
 */
function perfilTronco(lado: 1 | -1, recuo = 0, ateBase = false): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = TRONCO.perfil.map((p) => ({
    x: CENTRO_X + lado * Math.max(4, meioPath(p.meio) - recuo),
    y: p.y,
  }));
  if (ateBase) {
    const rx = meioPath(TRONCO.perfil[TRONCO.perfil.length - 1].meio);
    const yA = TRONCO.perfil[TRONCO.perfil.length - 1].y;
    for (const t of [0.5, 0.95]) {
      const dy = TRONCO.ryArremate * t;
      pts.push({
        x: CENTRO_X + lado * Math.max(2, rx * Math.sqrt(1 - t * t) - recuo),
        y: yA + dy,
      });
    }
  }
  return pts;
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
  const dir = perfilTronco(1);
  const esq = perfilTronco(-1).reverse();
  const ultimo = dir[dir.length - 1];
  const rx = ultimo.x - CENTRO_X;
  return (
    `M ${n(esq[esq.length - 1].x)} ${n(TRONCO.yTopo)} ` +
    `L ${n(dir[0].x)} ${n(TRONCO.yTopo)} ` +
    spline(dir) +
    `A ${n(rx)} ${n(TRONCO.ryArremate)} 0 0 1 ${n(CENTRO_X - rx)} ${n(ultimo.y)} ` +
    spline(esq) +
    `Z`
  );
}

/**
 * O especular: uma vírgula fina acompanhando o canto superior esquerdo.
 *
 * Conferido contra a cúpula nova — em x=108 a borda da cabeça está em y≈77 e em
 * x=152 está em y≈59; a vírgula anda de (108,128) a (156,76), dentro com folga.
 * É `#FFFFFF` com opacidade, não uma cor: assim ele clareia qualquer um dos 8
 * tons de pele sem precisar de 8 valores.
 */
export function pathEspecular(): string {
  return (
    `M 108 128 ` +
    `C 104 104 124 82 152 76 ` +
    `C 160 74 163 82 156 86 ` +
    `C 134 94 122 112 120 132 ` +
    `C 119 139 110 138 108 128 Z`
  );
}

/**
 * Quanto um plano lateral precisa entrar a partir da borda do path para que
 * `medir.ts` leia `banda` unidades.
 *
 * A medição começa logo DEPOIS do contorno — e o contorno come `MEIO` unidades
 * para dentro do path, mais 2 de folga contra antialiasing. Sem esta conversão o
 * plano sairia meio traço estreito e o gate acusaria um defeito que é só de
 * régua.
 */
const entrada = (banda: number) => MEIO + 2 + banda;

/**
 * O PLANO LATERAL DA CABEÇA — substitui a `pathSombraCabeca()`, que era uma
 * mancha diagonal atravessando o rosto.
 *
 * A diferença não é de gosto: a medição diz que o interior da cabeça é **chapado
 * em 221 ao longo de toda a largura**, com a queda concentrada nos ~16 pixels da
 * borda direita — e que a coluna central do rosto está no platô, sem sombra
 * nenhuma. Um degrau na borda é um PLANO; a mancha antiga escurecia o meio do
 * rosto, e é o que o marco `faixaNoEixo` do gate passa a reprovar.
 *
 * Também não é `<linearGradient>`, e o motivo mudou: a objeção antiga era o `id`
 * (argumento que caiu — o SVG já namespaceia `clipPath`). A objeção que vale é a
 * medição: uma rampa suave seria *menos* fiel que um degrau ao que está lá.
 *
 * O path é desenhado FOLGADO para fora e recortado pelo clip da cabeça. Ele
 * começa e termina em chanfro para não virar uma tampa escura no alto da cabeça,
 * que a referência não tem (medido: à altura do ápice a faixa some).
 */
export function pathPlanoLateralCabeca(): string {
  const f = cabecaRecuada(-20); // folgado para fora: o clip corta
  const d = cabecaRecuada(entrada(GIRO.planoLateral.cabeca));
  // A borda interna é uma VERTICAL, e não a cúpula recuada. Recuar uma elipse
  // rasa (rx 162, ry 70) subtraindo dos dois raios não produz uma curva
  // paralela: perto do ápice a recuada corre para dentro muito mais depressa que
  // a original, e a faixa fecharia em zero justo onde ela precisa existir. Uma
  // vertical com chanfro no alto acompanha a borda onde ela é reta e some
  // sozinha na cúpula, que é o que a referência mostra.
  return (
    `M ${n(f.x1)} ${n(CABECA.y0 + 40)} ` +
    `L ${n(f.x1)} ${n(f.y1 - f.ryB)} ` +
    `A ${n(f.rxB)} ${n(f.ryB)} 0 0 1 ${n(f.x1 - f.rxB)} ${n(f.y1)} ` +
    `L ${n(d.x1 - d.rxB)} ${n(d.y1)} ` +
    `A ${n(d.rxB)} ${n(d.ryB)} 0 0 0 ${n(d.x1)} ${n(d.y1 - d.ryB)} ` +
    `L ${n(d.x1)} ${n(CABECA.y0 + 74)} Z`
  );
}

/**
 * O PLANO LATERAL DO TRONCO — dois, e o da direita é mais largo.
 *
 * A referência tem faixa dos dois lados do tronco (ao contrário da cabeça, que
 * só tem à direita), e a direita é mais larga em **3 de 3 alturas medidas**. Como
 * o path é recortado pelo clip do tronco, os dois são desenhados folgados para
 * fora e o corte resolve a borda.
 */
export function pathPlanoLateralTronco(): string {
  const faixa = (lado: 1 | -1, banda: number) => {
    const fora = perfilTronco(lado, -20, true);
    const dentro = perfilTronco(lado, entrada(banda), true).reverse();
    return (
      `M ${n(fora[0].x)} ${n(fora[0].y)} ` +
      spline(fora) +
      `L ${n(dentro[0].x)} ${n(dentro[0].y)} ` +
      spline(dentro) +
      `Z`
    );
  };
  return faixa(1, GIRO.planoLateral.troncoDir) + faixa(-1, GIRO.planoLateral.troncoEsq);
}
