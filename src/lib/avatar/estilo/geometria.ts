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
 * ESTE ARQUIVO GUARDA LINHA DE CENTRO, E ISSO MUDOU NO BLOCO 1c
 * ---------------------------------------------------------------------------
 *
 * Até o Bloco 1b, as constantes daqui eram coordenadas de path e o resto do
 * sistema convertia para silhueta externa somando meio traço por toda parte —
 * `MEIO`, `entrada(banda)`, `cabecaRecuada(k)`. Três conversões, três lugares onde
 * errar, e uma consequência pior: **mudar `TRACO` mudava a forma**.
 *
 * Agora as constantes são a **linha que o desenhista traçou**, medida no line-art
 * da referência por `scripts/avatar/estilo/linha-de-centro.ts`. O `stroke` do SVG é
 * centrado no path, então a silhueta externa nasce meio traço para fora sozinha,
 * sem ninguém somar nada. Trocar a espessura do traço deixa de mexer na geometria.
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
 * quatro sinais independentes, todos medidos em pixel (unidades do `viewBox`,
 * altura útil normalizada em 600):
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
 * DE ONDE VIERAM OS NÚMEROS
 * ---------------------------------------------------------------------------
 *
 * De duas fontes, com uma divisão de trabalho que o Bloco 1c fixou: **forma vem do
 * line-art, cor vem do PNG.**
 *
 *  - `referencia-linha-de-centro.svg` — o trace do Adobe, 3 paths, o traço virado
 *    região preenchida. Dá linha de centro e espessura, medidas em vez de
 *    estimadas. É de onde saem `CABECA.contorno`, `TRONCO.perfil` e `TRACO`;
 *  - `referencia-base.png` (1254², altura útil **896 px**) — os tons chapados
 *    verdadeiros. É de onde saem `FACETAS`, `GIRO` e `SOMBRA_CHAO`.
 *
 * As duas são lidas por réguas independentes e **concordam dentro de 0,2 unidade**
 * na meia-largura da cabeça (182,0 contra 181,9), na do tronco (137,5 contra 137,7)
 * e na espessura do traço (12,7 contra 12,6). É esse acordo que autoriza tratar um
 * trace — que é um redesenho, não uma conversão — como fonte de geometria.
 *
 * A **altura útil** da referência é 896 px, do topo do contorno da cabeça à base do
 * contorno do tronco, e é ela que vira as 600 unidades daqui. Uma medição anterior
 * deu 837 px e todo número derivado saiu ~7% grande: ela lia a silhueta como "pixel
 * diferente do fundo", e por baixo do tronco existe a **sombra do chão**, que é
 * tinta clara. Aqui a silhueta é o CONTORNO ESCURO, e a sombra não entra.
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
 * Não é mais: a cabeça tem eixo próprio, e ele ainda **deriva** ao longo da altura
 * (+7 no corpo da cabeça, +15 no quarto de baixo). Quem espelhar às cegas neste
 * valor põe a peça no lugar errado — é exatamente o imposto que o plano nomeia.
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
 */
export const GIRO = {
  /** Quanto o eixo da cabeça fica à direita do eixo do tronco. Medido: 7,4. */
  eixoCabeca: 7,
  /** Quanto o par de olhos fica à direita do eixo da CABEÇA. Medido: 33,5. */
  desvioOlhos: 33,
  /** Quanto o olho direito fica mais ALTO que o esquerdo. Medido: 3,3. */
  desnivelOlhos: 3,
  /**
   * Quanto cada orelha sai da silhueta da cabeça. Medido: 24,1 e 14,7.
   *
   * **A da esquerda não é desenhada a partir deste número** — ela já está dentro
   * de `CABECA.contorno`, e o valor fica aqui para os acessórios lerem. A da
   * direita é forma própria e sai dele. A razão da diferença é a §"as duas
   * orelhas", abaixo.
   */
  saliencia: { esq: 24, dir: 15 },
} as const;

/** O eixo da cabeça no corpo dela. Não é `CENTRO_X`, e não é constante na altura. */
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
 * ---------------------------------------------------------------------------
 * ELE ERA 17, E OS 17 ERAM UM ARTEFATO DE MEDIÇÃO
 * ---------------------------------------------------------------------------
 *
 * A primeira rodada usou 10 e a folha desmentiu na hora — lado a lado a 425 px, o
 * SVG lia visivelmente mais pálido. A correção foi para 17, e o 17 saiu de estimar
 * o traço da referência em ~25 px de 896. **A estimativa contava a rampa oblíqua
 * como traço.**
 *
 * Uma varredura horizontal atravessa um traço inclinado na diagonal e mede
 * `t · √(1 + m²)`, onde `m` é a inclinação da borda. Na cúpula do alto da cabeça
 * `m` passa de 10 e a corrida mede **84 unidades** para este mesmo traço. O erro só
 * tem um sinal — a diagonal nunca mede a menos —, então qualquer média que misture
 * seções oblíquas com retas sai grossa.
 *
 * Corrigindo pela inclinação e descartando as bordas muito oblíquas, o traço da
 * referência mede **12,7 no line-art e 12,6 no PNG**: duas fontes independentes,
 * 0,1 de desacordo. Daí o 13.
 *
 * 13 não é 10. O que a folha reprovou foi um traço 23% mais fino que este, e o que
 * está saindo agora é um traço 31% mais grosso que o medido.
 */
export const TRACO = 13;

/**
 * Sangria mínima que a tinta de um PNG precisa exceder o clip, em unidades do
 * `viewBox`. É a "faca de corte" da §3 do doc 15: o overfill deixa de ser o
 * defeito de 1 px e vira o comportamento exigido.
 *
 * Vale ≥ metade do traço, porque é o traço que cobre a região de corte. Meio
 * traço são 6,5; 10 dá folga para o antialiasing do clip em DPR fracionário
 * (§8 item 6). O teste em `trava-silhueta.test.ts` mantém a relação amarrada:
 * quem mexer no traço sem mexer aqui quebra a suíte.
 */
export const SANGRIA = 10;

// ---------------------------------------------------------------------------
// A cabeça
// ---------------------------------------------------------------------------

/**
 * A CABEÇA — o contorno fechado da linha de centro, medido ponto a ponto.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA TABELA, E NÃO CANTOS ELÍPTICOS
 * ---------------------------------------------------------------------------
 *
 * A versão anterior era um retângulo de cantos elípticos: `x0/x1/y0/y1` mais quatro
 * raios. É uma família de formas com 8 graus de liberdade, e a cabeça da referência
 * não mora dentro dela. Três coisas medidas não cabem em nenhuma escolha de raios:
 *
 *  1. **o eixo deriva.** No corpo da cabeça ele está +7 do eixo do tronco; no
 *     quarto de baixo, +15. Um retângulo tem um eixo só;
 *  2. **a saliência da orelha esquerda é parte do contorno** (ver abaixo), e
 *     nenhum canto elíptico produz um abaulamento no meio de um lado;
 *  3. **a base não é simétrica.**
 *
 * O tronco já tinha aprendido isso: ele virou tabela medida no Bloco 1b e passou a
 * bater com a referência em meia unidade, enquanto a cabeça — ainda paramétrica —
 * seguia errando. Este é o mesmo movimento, um bloco depois.
 *
 * Os pontos vêm de `npm run avatar:linha-de-centro`, decimados **pelo erro de
 * corda**: sobrevive o ponto cuja remoção afastaria mais a curva, então a cúpula, a
 * orelha e o queixo ficam densos e as retas ficam esparsas. Nenhum foi escolhido a
 * olho, nenhum foi arredondado à mão.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS ORELHAS SÃO PEÇAS DE NATUREZA DIFERENTE, E ESSE É O CONSERTO
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou a base do 1b dizendo que a orelha esquerda estava "totalmente
 * errada, atrás da cabeça". A causa não era cor de preenchimento nem posição: era
 * **um traço a mais**.
 *
 * O line-art conta quantos traços cruzam cada lado na banda das orelhas:
 *
 * ```
 * frac      ESQUERDA                  DIREITA
 * 0.317     196,9(13,5)               187,5(11,9)  204,1(10,7)
 * 0.333     198,6(12,7)               187,3(12,3)  204,3(11,1)
 * 0.350     198,0(12,3)               187,3(12,3)  203,1(11,1)
 * ```
 *
 * **À esquerda existe UM traço, e ele está em 197–199, não em 173.** O contorno da
 * cabeça é *interrompido* ali: a borda da orelha **vira** a silhueta. Não há borda
 * de cabeça por trás dela. À direita são **dois**: a borda da cabeça continua em
 * 187 e a orelha é um arco fora dela.
 *
 * O 1b desenhava a borda da cabeça reta dos dois lados e punha uma elipse por cima
 * nos dois. Dois traços onde a referência tem um — e isso é o que faz a peça ler
 * como colada atrás, porque é literalmente o que um adesivo colado atrás mostra.
 * Trocar o `fill` não conserta; o traço a mais continua lá.
 *
 * Então: **a orelha esquerda está DENTRO desta tabela** (é a saliência entre y 209
 * e 283, chegando a x 52) e a direita é `ORELHA_DIR`, forma própria. A silhueta
 * externa é cega para a diferença — os dois desenhos têm o mesmo primeiro pixel
 * escuro —, e é por isso que o marco novo do gate é uma **contagem de traços**.
 */
export const CABECA = {
  contorno: [
    { x: 122.3, y: 62.7 },
    { x: 146.9, y: 56.1 },
    { x: 221.5, y: 47.3 },
    { x: 280.1, y: 46.3 },
    { x: 360.0, y: 53.6 },
    { x: 385.0, y: 59.6 },
    { x: 405.5, y: 69.0 },
    { x: 422.5, y: 81.7 },
    { x: 431.4, y: 94.4 },
    { x: 438.3, y: 124.7 },
    // Entre estes dois pontos passa a orelha DIREITA, e a borda da cabeça segue
    // reta por trás dela — medida em 437,5. Ela não entra aqui: é `ORELHA_DIR`. A
    // corda entre os dois vizinhos passa em 438 no meio da banda, meia unidade da
    // borda medida, então tirar os seis pontos da orelha não desloca a cabeça.
    { x: 439.1, y: 199.3 },
    { x: 436.9, y: 279.7 },
    { x: 433.6, y: 300.2 },
    { x: 425.0, y: 319.4 },
    { x: 417.8, y: 327.2 },
    { x: 398.2, y: 338.9 },
    { x: 362.1, y: 345.2 },
    { x: 223.6, y: 347.3 },
    { x: 138.3, y: 342.6 },
    { x: 134.6, y: 338.9 },
    { x: 109.8, y: 326.8 },
    { x: 101.0, y: 319.8 },
    { x: 91.8, y: 307.1 },
    // A ORELHA ESQUERDA começa aqui e vai até y 209. Ela é o contorno, e os seis
    // pontos abaixo são o que a faz ler como orelha em vez de bico: uma primeira
    // extração com metade da densidade punha a saliência no lugar certo e com a
    // curvatura errada — o gate media 24,0 de saliência contra os 24,1 da
    // referência, e a folha mostrava uma ponta.
    { x: 79.9, y: 284.2 },
    { x: 69.1, y: 280.5 },
    { x: 61.3, y: 273.5 },
    { x: 56.1, y: 264.5 },
    { x: 52.0, y: 249.7 },
    { x: 53.1, y: 228.8 },
    { x: 61.1, y: 215.3 },
    { x: 75.4, y: 209.2 },
    { x: 76.8, y: 198.9 },
    { x: 75.6, y: 119.0 },
    { x: 80.7, y: 98.5 },
    { x: 88.7, y: 85.4 },
    { x: 96.5, y: 77.6 },
  ],
} as const;

/**
 * A caixa da cabeça, DERIVADA do contorno — nunca escrita à mão.
 *
 * Existe para posicionar o que se apoia na cabeça (os olhos, os closes da folha) em
 * fração de altura, que é como a referência foi medida. Derivar em vez de repetir é
 * o que impede a segunda descrição da forma: mexer no contorno move os olhos junto.
 */
export const CAIXA_CABECA = (() => {
  const xs = CABECA.contorno.map((p) => p.x);
  const ys = CABECA.contorno.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return { x0, x1, y0, y1, larg: x1 - x0, alt: y1 - y0 };
})();

/** Altura da silhueta EXTERNA da cabeça: a linha de centro mais um traço inteiro. */
export const CABECA_H_EXTERNA = CAIXA_CABECA.alt + TRACO;

/**
 * A ORELHA DIREITA — a que é forma própria, e só ela.
 *
 * Um arco pequeno FORA da borda contínua da cabeça, com o interior no tom da faceta
 * direita e a linha interna da dobra. A esquerda não tem entrada aqui de propósito:
 * ela é contorno da cabeça, e uma constante para ela seria a segunda descrição que
 * este arquivo existe para não ter.
 *
 * Os três pontos são medidos: a orelha nasce na borda da cabeça em y 213, alcança
 * x 454,3 em y 231 e volta à borda em y 260.
 */
export const ORELHA_DIR = {
  yTopo: 213.7,
  yBase: 259.6,
  /** Onde a borda da cabeça passa, por trás dela. Medido: 437,5. */
  xBorda: 437.5,
  /** O ponto mais externo do arco. */
  xPonta: 454.3,
  yPonta: 240.3,
} as const;

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
  /**
   * 0,621 da altura EXTERNA da cabeça, medido na referência.
   *
   * É a única conversão de meio traço que sobrou no arquivo, e ela é local: a
   * fração foi medida contra a silhueta externa, então virar coordenada absoluta
   * exige tirar meio traço uma vez. As três conversões espalhadas de antes
   * (`MEIO`, `entrada()`, `cabecaRecuada()`) sumiram.
   */
  cy: Math.round(CAIXA_CABECA.y0 - TRACO / 2 + 0.621 * CABECA_H_EXTERNA),
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
 * **O perfil é uma tabela de medidas, não uma curva escolhida.** Foi ele que fez o
 * tronco bater com a referência em meia unidade no Bloco 1b, e é o modelo que a
 * cabeça agora segue. O que mudou no 1c: as meias-larguras passaram a ser de
 * **linha de centro** em vez de silhueta externa, então `meioPath()` não subtrai
 * mais meio traço — a silhueta externa nasce do `stroke`.
 *
 * O tronco é tratado como simétrico em torno de `CENTRO_X`. A assimetria medida é
 * de 3,7 unidades e está **toda na linha mais alta**, que fica escondida sob a
 * cabeça; nas alturas visíveis os dois lados concordam dentro de meia unidade.
 *
 * `yTopo` fica acima da base da cabeça de propósito. O topo do tronco não é uma
 * fronteira a alinhar — ele sobe atrás da cabeça e some sob ela. É a ÚNICA
 * fronteira pele↔pano que sobra no boneco (eram ~8), e ela é uma sobreposição
 * opaca em que a cabeça sempre ganha no z-order.
 */
export const TRONCO = {
  /** Escondido sob a cabeça. Não é fronteira, é sobreposição. */
  yTopo: 320,
  perfil: [
    /**
     * Extrapolada, e é a única linha desta tabela que não foi medida: nesta altura
     * o tronco está atrás da cabeça e não há tinta para ler. Sai da inclinação
     * entre as duas linhas medidas seguintes (0,319 unidade de largura por unidade
     * de altura), estendida 43,7 unidades para cima.
     */
    { y: 320, meio: 97.7 },
    { y: 363.7, meio: 111.7 },
    { y: 411.6, meio: 127.0 },
    { y: 483.4, meio: 136.4 },
    { y: 543.2, meio: 136.9 },
    { y: 579.3, meio: 133.1 },
    { y: 603.0, meio: 122.5 },
    { y: 615.3, meio: 108.8 },
  ],
  /** Onde o path fecha embaixo. A silhueta externa vai a `yBase + TRACO/2`. */
  yBase: 634,
  /**
   * Altura do arremate, do último ponto do perfil até a base. Raso de propósito: a
   * referência colapsa de 218 de largura para uma ponta, o que é um arco largo e
   * baixo, não um canto arredondado.
   */
  ryArremate: 18.7,
} as const;

/** Converte uma meia-largura MEDIDA de linha de centro em meia-largura de path. */
const meioPath = (meio: number) => meio * FOLGA_PROJETO;

// ---------------------------------------------------------------------------
// A luz e o volume
// ---------------------------------------------------------------------------

/**
 * A assimetria de ILUMINAÇÃO, que é diferente da de pose (`GIRO`) e não pode ser
 * confundida com ela: a luz vem de CIMA-ESQUERDA.
 *
 * Dela sai o canto do especular na cabeça. O que NÃO sai mais dela é a sombra do
 * chão: a medição diz que ela é centrada (eixo em 611, contra 611,5 do tronco), e
 * o `desvioSombra` de 12 unidades que existia aqui era invenção.
 *
 * É também o que vai escrito no prompt-template fixo (doc 15, §4): "um brilho
 * especular discreto na cabeça, no mesmo canto da referência".
 */
export const LUZ = {
  canto: "superior-esquerdo",
} as const;

/**
 * AS FACETAS — o rosto é um CUBO, e este é o dado que descreve o volume.
 *
 * ---------------------------------------------------------------------------
 * O QUE O BLOCO 1b ERROU, E POR QUE A MEDIÇÃO DELE DAVA ZERO
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou a base do 1b assim: *"não há sombreamento lateral do rosto do
 * lado esquerdo — **efeito cubo**, e é um dos principais fatores para entender que
 * o rosto está levemente de lado"*.
 *
 * O 1b não deixou de medir. Ele mediu com a pergunta errada: *"a partir da borda,
 * quantos pixels seguidos estão **mais escuros** que o platô do rosto?"*. A pergunta
 * tem o sinal embutido. Trocada por *"onde está a **aresta**?"* — uma partição ótima
 * em três segmentos, que acha a descontinuidade para qualquer sinal — a faceta
 * esquerda aparece na primeira leitura.
 *
 * ---------------------------------------------------------------------------
 * A PRIMITIVA: ARESTA NA LARGURA, RAMPA NA ALTURA
 * ---------------------------------------------------------------------------
 *
 * Cada faceta é um **path de borda dura** — a aresta está lá, medida — preenchido
 * com um **gradiente vertical**, porque o tom varia ao longo da altura, também
 * medido. Nem degrau chapado (que era a minha posição no 1b) nem rampa horizontal:
 * as duas estão erradas por medição, e em direções opostas.
 *
 * **A razão entre as larguras é o giro.** A faceta esquerda é o dobro da direita no
 * alto (32 contra 15): o lado esquerdo é o que vira para o observador, o direito é o
 * que foge. Isso é informação que a silhueta não carrega — dois desenhos com o mesmo
 * contorno podem ter um o rosto virado e o outro chapado.
 *
 * Os deltas são em níveis de luminância contra o platô da peça (`PLATO_PELE` no
 * rosto, `PLATO_TRONCO` no corpo), e viram fator multiplicativo de cor no
 * compositor. É o que permite as 8 peles com um jogo de números só.
 *
 * **Uma correção ao plano do bloco:** ele registrava a faceta esquerda como *mais
 * clara* que o rosto no alto (+15). Não é. O que está claro ali é o **especular**,
 * uma faixa de 20 unidades que começa 32 unidades PARA DENTRO da borda — a faceta
 * encosta na borda, o especular não. Medida em faixas que evitam o especular e os
 * olhos, a faceta esquerda vai de −4,8 no alto a −28,4 embaixo, e nunca é mais
 * clara que o rosto.
 */
export const FACETAS = {
  /** O tom chapado do rosto, contra o qual todos os deltas são medidos. */
  PLATO_PELE: 221,
  /** O mesmo, no tronco. A sombra do queixo é medida contra ele. */
  PLATO_TRONCO: 199,
  /** A que vira para o observador: larga no alto, e escurece muito descendo. */
  esq: { larguraTopo: 32.1, larguraBase: 25.7, deltaTopo: -4.8, deltaBase: -28.4 },
  /** A que foge: metade da largura, e já nasce escura. */
  dir: { larguraTopo: 15.0, larguraBase: 23.4, deltaTopo: -31.3, deltaBase: -34.7 },
  /** A faixa no fim do rosto, acima do contorno. Tom constante. */
  queixo: { altura: 8.0, delta: -35.6 },
  /**
   * A sombra projetada da cabeça no tronco, **abaixo** do contorno. É a mais escura
   * do boneco inteiro, e é ela que assenta a cabeça sobre o corpo — sem ela a
   * cabeça flutua, que é o que o 1b entregou.
   */
  sombraQueixo: { altura: 14.1, delta: -45.2 },
  /**
   * A dobra dentro da orelha esquerda. É TOM, e não linha: entre y 232 e 278 nada
   * separa a orelha do rosto além da mudança de 221 para 192. Desenhá-la como traço
   * seria o segundo contorno que faz a orelha ler como peça colada.
   */
  concha: { yTopo: 232, yBase: 278, deDentro: 12, largura: 24, delta: -29 },
} as const;

/** Converte um delta de luminância em fator multiplicativo de cor. */
export const fatorDeTom = (delta: number, plato: number) => (plato + delta) / plato;

/**
 * A sombra no chão. UMA elipse, achatada, **centrada no eixo do tronco**.
 *
 * A base anterior a fez com metade do tamanho (300 × 52 contra os 385 × 66
 * medidos) e deslocada 12 unidades. Os dois defeitos passaram na folha de contato.
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
   * unidades de largura e os 48 níveis de escurecimento da referência.
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
 * Uma spline de Catmull-Rom por pontos, emitida como cúbicas de Bézier.
 *
 * Existe para que a cabeça e o tronco possam ser TABELAS DE MEDIDAS em vez de
 * pontos de controle ajustados no olho. A conversão é a padrão: o controle de
 * cada ponto é a sexta parte da diferença entre os vizinhos.
 *
 * `fechada` muda o vizinho das pontas: em vez de clampar no próprio extremo, ele dá
 * a volta. Sem isso o contorno da cabeça teria um bico onde a curva se fecha — a
 * emenda cai no meio da cúpula, que é o lugar mais visível do desenho.
 */
function spline(pts: readonly { x: number; y: number }[], fechada = false): string {
  const N = pts.length;
  const em = (i: number) => (fechada ? pts[(i + N) % N] : pts[Math.min(N - 1, Math.max(0, i))]);
  let d = "";
  for (let i = 0; i < (fechada ? N : N - 1); i++) {
    const p0 = em(i - 1);
    const p1 = em(i);
    const p2 = em(i + 1);
    const p3 = em(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C ${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(p2.x)} ${n(p2.y)} `;
  }
  return d;
}

/**
 * **O PATH CANÔNICO DA CABEÇA.** Linha de centro, fechada, com a orelha esquerda.
 *
 * Não tem mais parâmetro de recuo. O `cabecaRecuada(k)` que existia aqui servia às
 * faixas laterais, e recuar um retângulo de cantos elípticos subtraindo dos raios
 * **não produz uma curva paralela** — perto da cúpula a recuada corria para dentro
 * muito mais depressa que a original. As facetas do Bloco 1c não precisam dele: são
 * paths próprios, desenhados folgados e cortados pelo clip da cabeça.
 */
export function pathCabeca(): string {
  const p = CABECA.contorno;
  return `M ${n(p[0].x)} ${n(p[0].y)} ` + spline(p, true) + `Z`;
}

/**
 * Os pontos do perfil do tronco de um lado, já com a folga aplicada.
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
 * AS BORDAS DA CABEÇA numa altura, lidas do MESMO contorno que o path usa.
 *
 * As facetas e a concha precisam saber onde a cabeça começa e acaba em cada altura.
 * Elas poderiam ter coordenadas próprias — e aí haveria uma segunda descrição da
 * forma da cabeça, que é exatamente o defeito que este arquivo inteiro existe para
 * não ter. Aqui elas perguntam ao contorno.
 *
 * A leitura é a interseção da poligonal com a horizontal `y`. Usa os pontos e não a
 * spline: a diferença entre a corda e a curva é menor que um traço em toda a altura,
 * e as facetas são desenhadas folgadas e cortadas pelo clip — quem resolve a borda é
 * o corte, não esta função.
 */
export function bordasEm(y: number): { esq: number; dir: number } {
  const p = CABECA.contorno;
  const xs: number[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    if (a.y === b.y) continue;
    const t = (y - a.y) / (b.y - a.y);
    if (t >= 0 && t < 1) xs.push(a.x + t * (b.x - a.x));
  }
  if (!xs.length) return { esq: CAIXA_CABECA.x0, dir: CAIXA_CABECA.x1 };
  return { esq: Math.min(...xs), dir: Math.max(...xs) };
}

/**
 * A ORELHA DIREITA: o arco que sai da borda contínua da cabeça e volta a ela.
 *
 * Fecha sobre a própria borda, e não sobre uma elipse inteira: o que se vê da
 * orelha direita na referência é a lasca de fora, e uma elipse completa por trás
 * seria de novo o traço a mais — o mesmo defeito da esquerda, do outro lado.
 */
export function pathOrelhaDir(): string {
  const o = ORELHA_DIR;
  return (
    `M ${n(o.xBorda)} ${n(o.yTopo)} ` +
    `C ${n(o.xPonta - 2)} ${n(o.yTopo + 2)} ${n(o.xPonta)} ${n(o.yPonta - 6)} ${n(o.xPonta)} ${n(o.yPonta)} ` +
    `C ${n(o.xPonta)} ${n(o.yPonta + 12)} ${n(o.xPonta - 4)} ${n(o.yBase - 2)} ${n(o.xBorda)} ${n(o.yBase)} ` +
    `Z`
  );
}

/**
 * O especular: uma vírgula fina acompanhando o canto superior esquerdo.
 *
 * A caixa é medida: x 121–175 · y 61–108. A vírgula anterior estava 15 unidades
 * baixa e larga demais (x 104–156 · y 76–132), e o desvio importa porque a
 * partição de tom a confundia com a faceta esquerda — ela é uma faixa clara que
 * começa 32 unidades PARA DENTRO da borda, e a faceta encosta na borda.
 *
 * É `#FFFFFF` com opacidade, não uma cor: assim ele clareia qualquer um dos 8
 * tons de pele sem precisar de 8 valores.
 */
export function pathEspecular(): string {
  return (
    `M 124 108 ` +
    `C 121 87 138 66 165 61 ` +
    `C 173 59 175 67 169 71 ` +
    `C 149 78 138 94 136 112 ` +
    `C 135 118 126 117 124 108 Z`
  );
}

// ---------------------------------------------------------------------------
// O volume — as quatro facetas, a concha e a sombra que assenta a cabeça
// ---------------------------------------------------------------------------

/**
 * Onde cada faceta começa e acaba na altura, e onde o queixo entra.
 *
 * O topo não é o ápice da cabeça: acima de `yTopoFaceta` a cúpula fecha e não há
 * largura para uma faixa — a referência mostra a faceta sumindo ali, e uma faixa que
 * subisse até o ápice viraria uma tampa escura que a referência não tem.
 */
const FORA = 40;

/**
 * As três alturas que descrevem a rampa das facetas. **Exportadas de propósito.**
 *
 * O compositor precisa delas para posicionar as paradas do gradiente, e a fixture do
 * gate precisa das mesmas para reproduzir a base errada. As duas as recalculavam por
 * conta própria, e duas cópias de uma altura derivada divergem no primeiro ajuste —
 * é o mesmo argumento que tirou a silhueta de dentro da `interface Traje`, três
 * ordens de grandeza menor.
 *
 * `yQueixo` desconta meio traço além da altura medida: os 8 unidades do queixo foram
 * medidos como faixa **visível**, e o contorno da cabeça come meio traço para dentro
 * a partir de `y1`. Sem o desconto, sobrariam 1,5 unidades de queixo na tela.
 */
export const FAIXA_FACETA = (() => {
  // As janelas de medição são frações da altura EXTERNA da cabeça, contadas do topo
  // da silhueta — é assim que `medir.ts` amostra, e é a conversão que põe as duas
  // pontas da rampa exatamente onde a régua vai lê-las.
  const externaY0 = CAIXA_CABECA.y0 - TRACO / 2;
  const externaAlt = CAIXA_CABECA.alt + TRACO;
  const em = (frac: number) => externaY0 + frac * externaAlt;
  return {
    yTopo: CAIXA_CABECA.y0 + 0.16 * CAIXA_CABECA.alt,
    /**
     * ONDE A RAMPA VALE `deltaTopo` E `deltaBase` — o centro das janelas de medição
     * de `medir.ts` (0,35 e 0,88 da altura externa da cabeça).
     *
     * Ancorar o gradiente nos EXTREMOS do path em vez de aqui foi um erro de uma
     * rodada: `deltaTopo` é o tom medido em `frac` 0,35, e declará-lo como o tom do
     * topo da faixa (`frac` 0,16) faz a rampa já ter descido 5,5 níveis quando chega
     * ao ponto onde o gate mede. O gate acusou exatamente isso — −10,3 onde a
     * referência tem −4,8 — e a correção não é afrouxar a tolerância: é a rampa
     * passar pelos dois pontos que foram medidos.
     */
    yAmostraTopo: em(0.35),
    yAmostraBase: em(0.88),
    yQueixo: CAIXA_CABECA.y1 - TRACO / 2 - FACETAS.queixo.altura,
    yFundo: CAIXA_CABECA.y1,
  };
})();

const yTopoFaceta = FAIXA_FACETA.yTopo;
const yQueixo = FAIXA_FACETA.yQueixo;

/**
 * Interpola entre o valor medido no topo e o medido na base, **ancorando nas alturas
 * em que cada um foi medido** e segurando o valor fora delas.
 *
 * Segurar em vez de extrapolar é deliberado: acima de `frac` 0,35 a cúpula fecha e a
 * faixa some sozinha; abaixo de 0,88 vem o queixo, que tem tom próprio. Extrapolar
 * inventaria tom nos dois trechos onde a referência não tem faceta para medir.
 */
const naAltura = (y: number, noTopo: number, naBase: number) => {
  const { yAmostraTopo, yAmostraBase } = FAIXA_FACETA;
  const t = Math.min(1, Math.max(0, (y - yAmostraTopo) / (yAmostraBase - yAmostraTopo)));
  return noTopo + t * (naBase - noTopo);
};

/**
 * MEIO TRAÇO ENTRA NA LARGURA DAS FACETAS, e é a diferença entre o medido e o visto.
 *
 * As larguras de `FACETAS` foram medidas a partir da **borda interna do contorno** —
 * é lá que a faixa de tom começa a aparecer, porque o traço cobre tudo que está sob
 * ele. Os paths daqui partem da **linha de centro**, que fica meio traço mais para
 * fora. Uma faceta desenhada com a largura medida sai meio traço estreita na tela.
 *
 * O gate mediu exatamente isso na primeira rodada: 22,8 unidades visíveis onde a
 * referência tem 32,1, e 32,1 − 6,5 = 25,6. É o mesmo desconto que some do resto do
 * arquivo por a geometria ter virado linha de centro, e que aqui precisa existir —
 * porque aqui a fronteira que interessa é a do que se VÊ, não a do que se desenha.
 */
const MEIO_TRACO = TRACO / 2;

/**
 * A FACETA ESQUERDA **mais o queixo**, num path só.
 *
 * Os dois entram juntos porque se encontram: na base da cabeça a lateral esquerda
 * está em −28,4 e o queixo em −35,6, e um gradiente vertical de três paradas serve
 * aos dois exatamente — a última parada é a do queixo. Separá-los custaria uma forma
 * do orçamento e um segundo gradiente para descrever a mesma rampa.
 *
 * A borda interna acompanha o contorno da cabeça (`bordasEm`) com a largura medida
 * em cada altura; a externa vai muito para fora e o clip da cabeça resolve. Abaixo
 * de `yQueixo` o path atravessa para o outro lado: é ali que ele deixa de ser faixa
 * lateral e vira a faixa do queixo, que ocupa a largura inteira.
 */
export function pathFacetaEsq(): string {
  const passos = 9;
  const dentro: { x: number; y: number }[] = [];
  for (let i = 0; i <= passos; i++) {
    const y = yTopoFaceta + ((yQueixo - yTopoFaceta) * i) / passos;
    const larg = naAltura(y, FACETAS.esq.larguraTopo, FACETAS.esq.larguraBase);
    dentro.push({ x: bordasEm(y).esq + larg + MEIO_TRACO, y });
  }
  return (
    `M ${n(-FORA)} ${n(yTopoFaceta)} ` +
    `L ${n(dentro[0].x)} ${n(dentro[0].y)} ` +
    spline(dentro) +
    `L ${n(VIEWBOX.w + FORA)} ${n(yQueixo)} ` +
    `L ${n(VIEWBOX.w + FORA)} ${n(CAIXA_CABECA.y1 + FORA)} ` +
    `L ${n(-FORA)} ${n(CAIXA_CABECA.y1 + FORA)} Z`
  );
}

/**
 * A FACETA DIREITA. Metade da largura da esquerda no alto, e já nasce escura.
 *
 * Substitui a `pathPlanoLateralCabeca()` de tom chapado. O tom chapado não era
 * gosto: era o que a medição do 1b dizia, porque ela lia uma banda só e tirava a
 * média dela. Medida no topo e na base em separado, a faceta anda de −31,3 para
 * −34,7 — pouco, mas na mesma direção da esquerda, e é a rampa que faz as duas
 * lerem como o mesmo volume.
 */
export function pathFacetaDir(): string {
  const passos = 9;
  const dentro: { x: number; y: number }[] = [];
  for (let i = 0; i <= passos; i++) {
    const y = yTopoFaceta + ((yQueixo - yTopoFaceta) * i) / passos;
    const larg = naAltura(y, FACETAS.dir.larguraTopo, FACETAS.dir.larguraBase);
    dentro.push({ x: bordasEm(y).dir - larg - MEIO_TRACO, y });
  }
  return (
    `M ${n(VIEWBOX.w + FORA)} ${n(yTopoFaceta)} ` +
    `L ${n(dentro[0].x)} ${n(dentro[0].y)} ` +
    spline(dentro) +
    `L ${n(VIEWBOX.w + FORA)} ${n(yQueixo)} Z`
  );
}

/**
 * A CONCHA — a dobra dentro da orelha esquerda.
 *
 * É a peça que substitui o traço a mais. A orelha esquerda não tem linha separando-a
 * do rosto: o que existe é a mudança de 221 para 192, começando 12 unidades para
 * dentro do traço da orelha. Desenhar essa mudança como TOM é o que faz a orelha ler
 * como dobra da cabeça; desenhá-la como linha é o que a fazia ler como adesivo.
 */
export function pathConchaEsq(): string {
  const c = FACETAS.concha;
  const passos = 5;
  const esq: { x: number; y: number }[] = [];
  const dir: { x: number; y: number }[] = [];
  for (let i = 0; i <= passos; i++) {
    const y = c.yTopo + ((c.yBase - c.yTopo) * i) / passos;
    // Estreita nas pontas: a concha é uma lente, não um retângulo. O fator sai do
    // seno do progresso, o mesmo que fecha as duas extremidades em zero.
    const k = Math.sin((Math.PI * i) / passos);
    const x0 = bordasEm(y).esq + c.deDentro;
    esq.push({ x: x0 + (c.largura / 2) * (1 - k), y });
    dir.push({ x: x0 + c.largura * (0.5 + k / 2), y });
  }
  return (
    `M ${n(esq[0].x)} ${n(esq[0].y)} ` +
    spline(esq) +
    spline([...dir].reverse()) +
    `Z`
  );
}

/**
 * A SOMBRA PROJETADA DA CABEÇA NO TRONCO — a faixa mais escura do boneco.
 *
 * −45 níveis contra o tom do tronco, quando a mais escura da cabeça tem −36. Ela não
 * existia no 1b, e a ausência dela é o motivo de a cabeça parecer pousada em cima do
 * corpo em vez de assentada nele: sem sombra de contato, dois volumes que se tocam
 * lem como dois adesivos sobrepostos.
 *
 * Ela é desenhada dentro do clip do TRONCO e segue a base da cabeça — 14 unidades no
 * meio, abrindo para as pontas, onde a base da cabeça sobe e a sombra acompanha.
 */
export function pathSombraQueixoTronco(): string {
  const alt = FACETAS.sombraQueixo.altura;
  const passos = 8;
  const cima: { x: number; y: number }[] = [];
  const baixo: { x: number; y: number }[] = [];
  const x0 = CAIXA_CABECA.x0 - FORA;
  const x1 = CAIXA_CABECA.x1 + FORA;
  for (let i = 0; i <= passos; i++) {
    const x = x0 + ((x1 - x0) * i) / passos;
    // A base da cabeça naquela coluna. Fora da cabeça a sombra continua na altura
    // do canto, que é o que o clip do tronco vai cortar de todo jeito.
    const y = alturaDaBaseEm(x) + MEIO_TRACO;
    cima.push({ x, y });
    baixo.push({ x, y: y + alt });
  }
  return (
    `M ${n(cima[0].x)} ${n(cima[0].y)} ` +
    spline(cima) +
    spline([...baixo].reverse()) +
    `Z`
  );
}

/** A base da cabeça numa coluna. Lida do contorno, como `bordasEm`. */
function alturaDaBaseEm(x: number): number {
  const p = CABECA.contorno;
  let fundo = -Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    if (a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    if (t >= 0 && t < 1) fundo = Math.max(fundo, a.y + t * (b.y - a.y));
  }
  return fundo === -Infinity ? CAIXA_CABECA.y1 - 30 : fundo;
}

/**
 * O PLANO LATERAL DO TRONCO — dois, e o da direita é mais largo.
 *
 * A referência tem faixa dos dois lados do tronco (ao contrário da cabeça, cujo
 * volume é descrito por `FACETAS` no Bloco 1c), e a direita é mais larga em **3 de
 * 3 alturas medidas**. Como o path é recortado pelo clip do tronco, os dois são
 * desenhados folgados para fora e o corte resolve a borda.
 */
export const PLANO_TRONCO = { esq: 16, dir: 19 } as const;

export function pathPlanoLateralTronco(): string {
  const faixa = (lado: 1 | -1, banda: number) => {
    const fora = perfilTronco(lado, -20, true);
    const dentro = perfilTronco(lado, banda + TRACO / 2 + 2, true).reverse();
    return (
      `M ${n(fora[0].x)} ${n(fora[0].y)} ` +
      spline(fora) +
      `L ${n(dentro[0].x)} ${n(dentro[0].y)} ` +
      spline(dentro) +
      `Z`
    );
  };
  return faixa(1, PLANO_TRONCO.dir) + faixa(-1, PLANO_TRONCO.esq);
}
