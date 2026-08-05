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
 * sinais independentes, todos medidos em pixel (unidades do `viewBox`, altura útil
 * normalizada em 600):
 *
 * | sinal                                    | medido |
 * |------------------------------------------|--------|
 * | ponto médio dos olhos, contra o eixo     | +33,9  |
 * | desnível entre os dois olhos             | 3,6    |
 * | desnível entre as duas sobrancelhas      | 3,5    |
 * | eixo da cabeça, contra o eixo do tronco  | +7,0   |
 * | razão entre as facetas laterais, no alto | 2:1    |
 *
 * Sinais concordantes não são ruído de gerador: é leitura espacial deliberada. E
 * adotá-la **revoga a D3 do doc 12** ("pose: frontal simétrica"), revogação
 * registrada lá com o imposto que ela cobra dos 92 itens de catálogo.
 *
 * **A lista encolheu no Bloco 1d, e não enfraqueceu.** Ela citava as saliências das
 * duas orelhas (24,1 e 14,7) como os dois primeiros sinais; a arte nova não tem
 * orelhas. Entraram no lugar o desnível das sobrancelhas — que a arte nova trouxe e
 * que concorda com o dos olhos dentro de 0,1 — e a razão das facetas, que já era
 * medida desde o 1c. Os quatro sinais que restam são todos medidos e todos estão no
 * gate; nenhum deles dependia da orelha.
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
 *  - `referencia-linha-de-centro.svg` — o trace do Adobe, **6 paths** (o contorno,
 *    os dois olhos, as duas sobrancelhas e a boca), o traço virado região
 *    preenchida. Dá linha de centro e espessura, medidas em vez de estimadas. É de
 *    onde saem `CABECA.contorno`, `TRONCO.perfil`, `TRACO`, `OLHO`, `SOBRANCELHA` e
 *    `BOCA`;
 *  - `referencia-base.png` (2038², altura útil **1449 px**) — os tons chapados
 *    verdadeiros. É de onde saem `FACETAS` e `GIRO`;
 *  - `referencia-sombra.png` — a arte ANTERIOR, e ela sobrevive por um motivo só.
 *    Ver a seção seguinte.
 *
 * As duas primeiras são lidas por réguas independentes e concordam na meia-largura
 * da cabeça (182,0 contra 182,4) e na do tronco (137,4 contra 137,3). É esse acordo
 * que autoriza tratar um trace — que é um redesenho, não uma conversão — como fonte
 * de geometria.
 *
 * A **altura útil** da referência é do topo do contorno da cabeça à base do contorno
 * do tronco, e é ela que vira as 600 unidades daqui. Uma medição anterior deu 837 px
 * onde o valor era 896 e todo número derivado saiu ~7% grande: ela lia a silhueta
 * como "pixel diferente do fundo", e por baixo do tronco existe a **sombra do
 * chão**, que é tinta clara. Aqui a silhueta é o CONTORNO ESCURO, e a sombra não
 * entra.
 *
 * ---------------------------------------------------------------------------
 * A ARTE MUDOU NO BLOCO 1d, E O CORPO NÃO SE MOVEU
 * ---------------------------------------------------------------------------
 *
 * O retoque foi localizado: **saíram as orelhas**, entraram **sobrancelhas e boca**.
 * A razão de tirar as orelhas é de catálogo, não de desenho — orelha na base obriga
 * cada um dos 92 itens de chapéu e cabelo a decidir se cobre ou não.
 *
 * Que o resto não se mexeu é medido, e não presumido:
 *
 * | | arte nova | arte anterior |
 * |---|---|---|
 * | largura da cabeça | 376,0 | 376,3 |
 * | largura do tronco | 285,7 | 287,9 |
 * | corte cabeça ↔ tronco | 0,519 | 0,520 |
 * | platô do rosto | 221,2 | 221,4 |
 *
 * Por isso `TRONCO`, `GIRO`, `FOLGA_PROJETO` e `SOMBRA_CHAO` atravessaram o bloco
 * sem mudar. **A exceção é o traço**, e ela está registrada em `TRACO`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE EXISTEM DUAS REFERÊNCIAS, E ISSO INCOMODA
 * ---------------------------------------------------------------------------
 *
 * O PNG novo foi exportado sem fundo, e **a sombra do chão era pintada no fundo**:
 * ela sumiu junto. Medida, a arte nova tem 69 px de ruído onde a anterior tem 7 940
 * px de sombra. Três marcos do gate — largura, eixo e escurecimento da sombra —
 * mediriam contra o nada e ficariam verdes por vacuidade, que é exatamente a classe
 * de defeito que este projeto já pagou caro.
 *
 * Então a arte anterior fica no repositório como `referencia-sombra.png`, usada **só
 * por esses três marcos**, com a tabela acima como prova de que o corpo é o mesmo.
 * Duas fontes para o mesmo desenho é uma dívida declarada; medir contra nada é pior.
 * Uma reexportação com fundo a quita, e a decisão de não fazê-la é do Doug.
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
  /**
   * Quanto o olho direito fica mais ALTO que o esquerdo. Medido: 3,6 nos olhos e
   * 3,5 nas sobrancelhas — duas peças diferentes, o mesmo número.
   *
   * `saliencia` morava aqui e saiu no Bloco 1d junto com as orelhas. Ela era o
   * dado que os acessórios liam para saber "quanto de orelha há para cobrir", e a
   * resposta agora é nenhuma, para todos os 92 itens de catálogo. Um chapéu que
   * ainda perguntasse pela saliência não compilaria, que é a forma certa de a
   * pergunta deixar de existir.
   */
  desnivelOlhos: 3,
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
 * arte do Bloco 1c mediu **12,7 no line-art e 12,6 no PNG**: duas fontes
 * independentes, 0,1 de desacordo. Daí o 13.
 *
 * ---------------------------------------------------------------------------
 * E ELE VIROU 12 NO BLOCO 1d, PORQUE A ARTE MUDOU DEBAIXO DELE
 * ---------------------------------------------------------------------------
 *
 * O 13 estava congelado por aprovação, e o congelamento tinha um conteúdo: *não
 * voltar para 17*. Ele não protegia o número 13 — protegia o método que o produziu,
 * que é medir em vez de estimar.
 *
 * A arte nova tem o contorno **~10% mais fino**, e isso não é leitura: é o desenho.
 * Três hipóteses de régua foram testadas e as três caíram:
 *
 *  1. **resolução.** Medido o mesmo desenho em cinco escalas (700 a 2038 px de
 *     lado), a arte nova dá 10,9–11,3 em todas e a anterior 12,0–12,6 em todas. Se
 *     fosse rampa de antialiasing, o número andaria com a escala. Não anda;
 *  2. **o recorte do fundo comendo a borda.** O PNG novo **não tem canal alpha** —
 *     achatá-lo sobre branco, cinza ou preto devolve 11,28 nos três casos;
 *  3. **exportação em px absoluto.** A figura nova é 1,63× maior que a anterior; se
 *     o traço fosse constante em px, mediria 7,7 e não 11,2.
 *
 * As duas réguas independentes concordam de novo, agora em outro valor: **11,9 no
 * line-art e 11,2 no PNG**. Manter o 13 seria desenhar 16% mais grosso que a fonte,
 * e o único jeito de o gate aceitar isso seria inventar um segundo fator de folga no
 * número mais sensível do arquivo — ou afrouxar a tolerância, que é a saída que este
 * projeto recusa por escrito.
 *
 * 12 não é 17, e não é 10. É a mesma pergunta de sempre respondida contra a fonte
 * que está no repositório hoje.
 */
export const TRACO = 12;

/**
 * Sangria mínima que a tinta de um PNG precisa exceder o clip, em unidades do
 * `viewBox`. É a "faca de corte" da §3 do doc 15: o overfill deixa de ser o
 * defeito de 1 px e vira o comportamento exigido.
 *
 * Vale ≥ metade do traço, porque é o traço que cobre a região de corte. Meio
 * traço são 6; 10 dá folga para o antialiasing do clip em DPR fracionário
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
 *  2. **os quatro cantos têm raios diferentes** — o alto-esquerdo abre por 27
 *     unidades de altura e o alto-direito por 48;
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
 * AS ORELHAS SAÍRAM NO BLOCO 1d, E É O CONTORNO QUE FICA MAIS SIMPLES
 * ---------------------------------------------------------------------------
 *
 * A arte anterior tinha duas orelhas, e elas eram **peças de natureza diferente**: a
 * esquerda era saliência do próprio contorno (um traço, entre y 209 e 283, chegando
 * a x 52) e a direita era forma própria por fora da borda contínua (dois traços). A
 * distinção custou o Bloco 1b inteiro — desenhar dois traços à esquerda é
 * literalmente o que um adesivo colado atrás mostra, e foi assim que o Doug leu a
 * peça.
 *
 * A arte nova não tem nenhuma das duas, e o motivo não é de desenho: **orelha na
 * base obriga todo chapéu e todo cabelo a decidir se cobre ou não**, e essa decisão
 * é imposta a 92 itens de catálogo, um por um. Tirar a orelha da base tira a
 * pergunta de todos eles de uma vez.
 *
 * O que some junto: `ORELHA_DIR`, `pathOrelhaDir()`, `pathConchaEsq()`,
 * `FACETAS.concha`, `GIRO.saliencia`, os marcos de saliência e de contagem de
 * traços no gate, e a fixture da orelha colada. **Ficam quatro fixtures, e não
 * cinco** — a da orelha perdeu objeto, e substituí-la por outra sem um defeito real
 * por trás seria teatro. Este gate já teve uma fixture assim e ela foi corrigida no
 * 1c justamente por isso.
 *
 * Os 42 pontos abaixo saem de `npm run avatar:linha-de-centro` sobre o line-art
 * novo, decimados **pelo erro de corda**. A caixa fecha em x 75,4–439,2 e
 * y 45,5–347,5; a anterior ia a x 52,0, e a diferença é exatamente a orelha.
 */
export const CABECA = {
  contorno: [
    { x: 129.7, y: 59.6 },
    { x: 144.7, y: 56.0 },
    { x: 181.7, y: 50.4 },
    { x: 213.8, y: 47.3 },
    { x: 256.2, y: 45.5 },
    { x: 288.2, y: 46.1 },
    { x: 330.2, y: 48.9 },
    { x: 356.9, y: 52.5 },
    { x: 382.2, y: 57.9 },
    { x: 403.7, y: 67.3 },
    { x: 412.9, y: 72.8 },
    { x: 424.9, y: 83.7 },
    { x: 430.6, y: 92.1 },
    { x: 434.7, y: 101.6 },
    { x: 437.3, y: 111.9 },
    { x: 439.2, y: 154.2 },
    // A lateral direita é uma reta longa: entre y 154,2 e 271,9 a borda anda 1,8
    // unidade em 118 de altura. Era aqui que a orelha direita saía da cabeça, e o
    // contorno de agora atravessa a banda sem nenhum ponto — a decimação por erro de
    // corda gasta ponto onde a curva vira, e aqui ela não vira.
    { x: 437.4, y: 271.9 },
    { x: 435.5, y: 292.4 },
    { x: 433.4, y: 302.5 },
    { x: 429.7, y: 312.2 },
    { x: 423.8, y: 321.2 },
    { x: 411.9, y: 331.3 },
    { x: 391.5, y: 340.6 },
    { x: 355.1, y: 345.7 },
    { x: 301.8, y: 347.2 },
    { x: 205.6, y: 347.1 },
    { x: 168.4, y: 345.7 },
    { x: 142.1, y: 343.0 },
    { x: 116.0, y: 330.2 },
    { x: 106.8, y: 324.5 },
    { x: 98.7, y: 317.1 },
    { x: 92.7, y: 308.5 },
    // Onde a orelha esquerda ficava. A borda agora desce reta de y 204 a 293,9,
    // ganhando 10,8 unidades para dentro — a curvatura suave que a saliência
    // escondia.
    { x: 87.5, y: 293.9 },
    { x: 79.8, y: 247.2 },
    { x: 76.7, y: 204.4 },
    { x: 75.2, y: 140.3 },
    { x: 76.4, y: 113.9 },
    { x: 78.7, y: 103.7 },
    { x: 82.7, y: 94.0 },
    { x: 88.4, y: 85.4 },
    { x: 95.6, y: 77.7 },
    { x: 108.5, y: 69.1 },
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
 * Os olhos: cápsulas verticais pretas.
 *
 * Eles são do COMPOSITOR e não de uma imagem, e é isso que torna o piscar
 * possível de graça: `scaleY` numa forma que o sistema desenha. Um olho vindo de
 * PNG não piscaria (doc 15, §6).
 *
 * A base anterior os fez **simétricos e 24% estreitos** (28 contra os 37
 * medidos). O par inteiro anda `GIRO.desvioOlhos` para a direita do eixo da
 * cabeça, e o direito sobe `GIRO.desnivelOlhos` — os dois são o giro, não
 * descuido de quem desenhou a referência.
 *
 * As medidas saem agora dos **paths 1 e 2 do line-art**, isolados e rasterizados um
 * a um, em vez de inferidas do PNG: 38,2 × 83,1 os dois, centros em x 213,4 e 368,4,
 * separação 155,0. É a mesma fonte que dá o contorno, lida da mesma maneira.
 */
export const OLHO = {
  w: 38,
  h: 83,
  /** Raio da cápsula: metade da largura, para as pontas serem semicírculos. */
  r: 19,
  /**
   * 0,613 da altura EXTERNA da cabeça, medido na referência.
   *
   * É a única conversão de meio traço que sobrou no arquivo, e ela é local: a
   * fração foi medida contra a silhueta externa, então virar coordenada absoluta
   * exige tirar meio traço uma vez. As três conversões espalhadas de antes
   * (`MEIO`, `entrada()`, `cabecaRecuada()`) sumiram.
   *
   * Era 0,621, e a correção de 0,008 é medida: os centros dos dois olhos no
   * line-art novo estão em y 233,7 e 230,1, média 231,9, e 0,621 punha o par 2,1
   * unidades abaixo disso. Ninguém teria pego — **o gate não tem marco de altura
   * do olho contra o rosto**, só de altura DO olho. Apareceu porque o Bloco 1d
   * passou a extrair as peças do rosto do line-art uma a uma.
   */
  cy: Math.round(CAIXA_CABECA.y0 - TRACO / 2 + 0.613 * CABECA_H_EXTERNA),
  /** Distância entre os CENTROS dos dois olhos. */
  separacao: 155,
} as const;

/** O ponto médio do par, que anda com o giro. */
const OLHO_MEIO = EIXO_CABECA + GIRO.desvioOlhos; // 290
export const OLHO_CX_ESQ = OLHO_MEIO - OLHO.separacao / 2; // 212,5
export const OLHO_CX_DIR = OLHO_MEIO + OLHO.separacao / 2; // 367,5
export const OLHO_CY_ESQ = OLHO.cy + GIRO.desnivelOlhos / 2;
export const OLHO_CY_DIR = OLHO.cy - GIRO.desnivelOlhos / 2;

/**
 * AS SOBRANCELHAS E A BOCA — as duas peças que o Bloco 1d ganhou.
 *
 * Este docstring dizia, com todas as letras: *"Sem nariz, sem boca, sem sobrancelha
 * — a referência não tem nenhum dos três, e cada um seria escopo."* Dois dos três
 * passaram a existir na arte nova, e o registro da mudança é este bloco. O nariz
 * continua não existindo.
 *
 * ---------------------------------------------------------------------------
 * A PRIMITIVA É TRAÇO COM PONTA REDONDA, E ELA FOI ESCOLHIDA POR ÁREA
 * ---------------------------------------------------------------------------
 *
 * Cada peça foi isolada do line-art, rasterizada sozinha e medida em caixa, área e
 * perfil. A área decide a forma sem ninguém olhar para o desenho:
 *
 * | peça        | caixa       | área medida | retângulo | elipse | **cápsula** |
 * |-------------|-------------|-------------|-----------|--------|-------------|
 * | sobrancelha | 46,5 × 10,3 | **363**     | 478       | 375    | **367**     |
 * | boca        | 37,0 ×  8,2 | **190**     | 304       | 239    | **190**     |
 * |
 *
 * A cápsula acerta as duas, e a da boca acerta na casa das unidades. Cápsula é o que
 * um `stroke` com `stroke-linecap="round"` desenha de graça — então as três peças
 * são **um segmento traçado**, e não uma forma preenchida. Sai mais barato em bytes
 * que `<rect>` mais `transform`, e resolve inclinação e curvatura sem caso especial.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS SÃO CURVAS, E EU ERREI ISSO NA PRIMEIRA FOLHA
 * ---------------------------------------------------------------------------
 *
 * A primeira rodada ajustou uma **reta** ao eixo de cada peça. Ela devolveu
 * inclinações de −0,0296 e −0,0209 nas sobrancelhas e −0,0009 na boca, e a conclusão
 * tirada foi "sobrancelha inclinada, boca curva". A sobrancelha saiu um bastão reto,
 * e o Doug leu na folha o que a régua não tinha perguntado.
 *
 * **Uma reta não tem como reportar curvatura.** Num arco simétrico ela devolve
 * inclinação zero e um resíduo que ninguém olha — é o mesmo modo de falha do
 * `banda()` do Bloco 1b, que perguntava "quanto é mais escuro?" e por isso era cego
 * para uma faceta mais clara. Pergunta errada, resposta plausível.
 *
 * Ajustando uma **parábola** ao eixo, com o termo linear e o quadrático separados:
 *
 * | peça            | largura | espessura | inclinação | sagita |
 * |-----------------|---------|-----------|------------|--------|
 * | sobrancelha esq | 46,5    | 8,2       | −0,0296    | **−1,71** |
 * | sobrancelha dir | 45,2    | 8,2       | −0,0209    | **−1,76** |
 * | boca            | 36,6    | 5,3       | −0,0009    | **+3,62** |
 *
 * As três são curvas. As sobrancelhas **arqueiam para cima** (o meio acima da reta
 * das pontas) e a boca **para baixo** — é um sorriso, e ele é 25% mais fundo do que
 * a estimativa por caixa dizia. As sobrancelhas ainda são inclinadas por cima disso,
 * e a boca não é: cada peça leva só o que foi medido nela.
 *
 * ---------------------------------------------------------------------------
 * ELAS NÃO TÊM COORDENADA PRÓPRIA — PENDURAM NO OLHO
 * ---------------------------------------------------------------------------
 *
 * Medidos, os centros em x da sobrancelha e do olho coincidem (212,6 contra 213,4 à
 * esquerda; 368,6 contra 368,4 à direita), e o afastamento vertical é o **mesmo dos
 * dois lados**: 62,7 e 62,6. A boca fica em x 291,1, que é o ponto médio do par de
 * olhos (290,9) dentro de 0,2.
 *
 * Então nada disso é escrito de novo. As três peças são deslocamentos a partir do
 * olho, e é por isso que **o giro chega nelas sozinho**: o desnível de 3,5 entre as
 * duas sobrancelhas não é uma constante daqui, é o `GIRO.desnivelOlhos` que elas
 * herdam. Uma sobrancelha com y próprio seria a segunda descrição da mesma pose.
 */
export const SOBRANCELHA = {
  /** Largura ponta a ponta, de centro a centro das duas pontas redondas. */
  larg: 46,
  /** Espessura do traço. Medida constante em toda coluna, nas duas. */
  espessura: 8.2,
  /** Quanto ela fica ACIMA do centro do olho do mesmo lado. Medido: 62,7 e 62,6. */
  acimaDoOlho: 62.7,
  /**
   * Subida da ponta esquerda para a direita, em unidades. Medido: 1,4 e 1,0.
   *
   * Positivo sobe para a DIREITA DA IMAGEM nas duas — não é espelhado. As duas
   * sobrancelhas inclinam para o mesmo lado, como as duas facetas do rosto e pelo
   * mesmo motivo: é a cabeça que está virada, não o par que está franzido.
   */
  subida: 1.2,
  /** O arco: quanto o meio sobe acima da reta das pontas. Medido: 1,71 e 1,76. */
  sagita: 1.7,
} as const;

export const BOCA = {
  /** Largura ponta a ponta. Medido: 37,0. */
  larg: 37,
  /** Espessura do traço. Medido: 5,3 constante. */
  espessura: 5.3,
  /** Quanto ela fica ABAIXO do centro do par de olhos. Medido: 298,7 − 231,9. */
  abaixoDoOlho: 66.8,
  /**
   * A sagita do sorriso: quanto o meio desce abaixo da reta das pontas.
   *
   * **3,6 e não 2,9.** O 2,9 saía de subtrair a espessura da altura da caixa, e essa
   * conta só vale para um arco cujo eixo é horizontal nas pontas — o que não é o
   * caso. O ajuste quadrático do eixo dá 3,62, e é ele que manda.
   */
  sagita: 3.6,
} as const;

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
  /**
   * A que vira para o observador: larga no alto, e escurece muito descendo.
   *
   * Os quatro números foram remedidos no Bloco 1d, e não porque o desenho mudou —
   * porque **as janelas de amostragem mudaram**. Elas tiveram de sair de cima da
   * sobrancelha (`fracCab` 0,398–0,438) e da boca (0,822–0,844), e um valor medido
   * numa janela só vale naquela janela. Ver `medir.ts`, `janela()`.
   */
  esq: { larguraTopo: 32.7, larguraBase: 25.8, deltaTopo: -4.6, deltaBase: -29.9 },
  /** A que foge: metade da largura no alto, e já nasce escura. */
  dir: { larguraTopo: 16.0, larguraBase: 22.5, deltaTopo: -29.9, deltaBase: -33.2 },
  /** A faixa no fim do rosto, acima do contorno. Tom constante. */
  queixo: { altura: 8.7, delta: -33.1 },
  /**
   * A sombra projetada da cabeça no tronco, **abaixo** do contorno. É a mais escura
   * do boneco inteiro, e é ela que assenta a cabeça sobre o corpo — sem ela a
   * cabeça flutua, que é o que o 1b entregou.
   */
  sombraQueixo: { altura: 14.5, delta: -45.3 },
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

/**
 * Uma coordenada, com uma casa decimal.
 *
 * **Exportada no Bloco 2a.1**, junto com `spline()`. As duas são PRIMITIVAS de
 * emissão, não formas: quem as importa (`cabelo.ts`) não ganha com isso nenhum
 * poder de declarar silhueta — ele continua obrigado a perguntar a borda da cabeça
 * a `bordasEm()`. Compartilhar a primitiva é o contrário de duplicar a forma: se o
 * cabelo tivesse a própria spline, duas curvas do mesmo desenho passariam a ser
 * parametrizadas diferente, e a emenda entre elas apareceria.
 */
export const n = (v: number) => (Math.round(v * 10) / 10).toString();

/**
 * Uma spline de Catmull-Rom **CENTRÍPETA**, emitida como cúbicas de Bézier.
 *
 * Existe para que a cabeça e o tronco possam ser TABELAS DE MEDIDAS em vez de
 * pontos de controle ajustados no olho.
 *
 * `fechada` muda o vizinho das pontas: em vez de clampar no próprio extremo, ele dá
 * a volta. Sem isso o contorno da cabeça teria um bico onde a curva se fecha — a
 * emenda cai no meio da cúpula, que é o lugar mais visível do desenho.
 *
 * ---------------------------------------------------------------------------
 * ELA ERA UNIFORME, E A UNIFORME QUEBRAVA O CONTORNO EM DOIS LUGARES
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou a primeira folha do Bloco 1d assim: *"as linhas da cabeça não
 * estão 100% arredondadas, há pequenas quebras, principalmente na parte de baixo
 * (queixo) e no topo da cabeça esquerda"*. As duas regiões que ele nomeou são
 * exatamente as duas em que o espaçamento entre pontos salta:
 *
 *  - **na base**, o contorno vem com 58 unidades entre pontos (a reta do queixo) e
 *    passa a 13,9 de uma linha para a outra, onde o canto começa a virar;
 *  - **no topo esquerdo**, o ponto que fecha o laço fica a 4,9 unidades do vizinho
 *    de um lado e a 17 do outro.
 *
 * A versão anterior punha o controle de cada ponto em `(P[i+1] − P[i−1])/6`, **sem
 * olhar a distância até os vizinhos**. Onde um lado é 4× mais curto que o outro, a
 * alça de controle sai longa demais para o lado curto: a curva passa do ponto,
 * volta, e o que se vê é um repuxo. Não é falta de pontos — é a parametrização.
 *
 * A centrípeta pesa o parâmetro de cada trecho por `|ΔP|^0,5`. É a variante que
 * existe justamente para não produzir cúspide nem laço com pontos mal distribuídos,
 * e ela **contém a anterior**: com espaçamento uniforme os três `d` são iguais e a
 * fórmula abaixo colapsa em `(P[i+1] − P[i−1])/6`, ponto por ponto. Onde o contorno
 * já estava liso, nada muda; onde ele repuxava, a alça encurta na medida do trecho.
 *
 * ---------------------------------------------------------------------------
 * `de`/`ate` — EMITIR UM PEDAÇO DA MESMA CURVA, E NÃO UMA CURVA PARECIDA
 * ---------------------------------------------------------------------------
 *
 * Ausentes, a emissão é a de sempre, comando a comando. Presentes, saem só os
 * trechos `de … ate−1` — **calculados com os mesmos vizinhos do laço inteiro**,
 * porque `em()` continua dando a volta.
 *
 * Isso existe para o traço da peça traçada (`Cabelo.linhas`), e a exigência é a
 * regra 1 do doc 15 lida ao pé da letra: o traço corre SOBRE a massa, então ele não
 * pode ser uma segunda curva pelos mesmos pontos. Emitido por aqui, o arco não
 * *aproxima* a borda da massa — ele **é** os mesmos comandos `C` que o laço fechado
 * emite naquele trecho, byte a byte. Não há duas descrições que possam divergir,
 * que é o mesmo mecanismo do `<use>` no compositor.
 *
 * `ate` pode passar de `N` para o arco dar a volta pelo fim do vetor.
 */
export function spline(
  pts: readonly { x: number; y: number }[],
  fechada = false,
  de = 0,
  ate = fechada ? pts.length : pts.length - 1,
): string {
  const N = pts.length;
  const em = (i: number) =>
    fechada ? pts[((i % N) + N) % N] : pts[Math.min(N - 1, Math.max(0, i))];
  /** `|ΔP|^0,5` — o expoente 0,5 é o que faz a parametrização ser centrípeta. */
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.max(1e-6, Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)));
  let d = "";
  for (let i = de; i < ate; i++) {
    const p0 = em(i - 1);
    const p1 = em(i);
    const p2 = em(i + 1);
    const p3 = em(i + 2);
    const d1 = dist(p0, p1);
    const d2 = dist(p1, p2);
    const d3 = dist(p2, p3);
    // A conversão de Catmull-Rom não uniforme para Bézier cúbica (Barry-Goldman).
    // Com d1 = d2 = d3 os denominadores viram 6·d² e sobra `(p2 − p0)/6`.
    const eixo = (a: number, b: number, c: number, e1: number, e2: number) =>
      (e1 * e1 * c - e2 * e2 * a + (2 * e1 * e1 + 3 * e1 * e2 + e2 * e2) * b) / (3 * e1 * (e1 + e2));
    const c1 = {
      x: eixo(p0.x, p1.x, p2.x, d1, d2),
      y: eixo(p0.y, p1.y, p2.y, d1, d2),
    };
    const c2 = {
      x: eixo(p3.x, p2.x, p1.x, d3, d2),
      y: eixo(p3.y, p2.y, p1.y, d3, d2),
    };
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
 * O ARREMATE, amostrado como PONTOS do quarto de elipse — e não como um `A`.
 *
 * ---------------------------------------------------------------------------
 * O `A` PRODUZIA UM ENTALHE NOS DOIS CANTOS DE BAIXO, E ELE ERA VISÍVEL
 * ---------------------------------------------------------------------------
 *
 * O tronco fechava assim: `spline(dir)` até o último ponto do perfil, depois
 * `A rx ryArremate ... ` atravessando por baixo, depois `spline(esq)`. Parece o
 * arremate arredondado que a referência tem, e não é.
 *
 * **A tangente não casa na emenda.** No ponto mais à direita de uma elipse a
 * tangente é VERTICAL, por construção. O perfil chega lá descendo e fechando: entre
 * as duas últimas alturas ele anda 13 unidades para dentro em 12,3 de queda, ou 43°.
 * São ~47° de quebra, num canto, nos dois lados.
 *
 * Medida na curva emitida — amostrando o path com `getPointAtLength` e calculando o
 * círculo circunscrito — ela aparece como **inversão de curvatura com raio 10,7**,
 * em (146, 615) e (354, 615). Raio menor que o próprio traço, que é a definição
 * operacional de bico. O Doug viu na folha e chamou de "pequenas quebras na parte de
 * baixo".
 *
 * ---------------------------------------------------------------------------
 * E A ELIPSE TAMBÉM ERA O MODELO ERRADO — MEDIDO NA REFERÊNCIA
 * ---------------------------------------------------------------------------
 *
 * Trocar o `A` por pontos amostrados da MESMA elipse melhorou o raio de 10,7 para
 * 18, e não resolveu. A causa é anterior: **uma elipse de 103 × 18,7 tem raio de
 * curvatura 3,4 na ponta lateral** (`a/b²`), que é um quarto de traço. O arremate da
 * referência não é isso.
 *
 * Varrendo a base do tronco da referência por coluna e calculando o raio local, os
 * cantos medem **40 a 60 unidades** e o fundo é quase reto (80 a ∞). O modelo certo é
 * "lados que fecham com raio moderado num fundo chato", e não "meia elipse achatada".
 *
 * Este bloco NÃO refaz `TRONCO`: a tabela do tronco é geometria aprovada e a §"o que
 * não muda" do plano é explícita. O que ele faz é parar de emitir um bico onde a
 * referência tem uma curva. Com **uma amostra só** — a elipse em `t = 0,7`, entre o
 * fim do perfil e o fundo — a spline fecha com raio de canto **80**, sem inversão de
 * curvatura em lugar nenhum da base. É a opção medida mais próxima dos 40–60 da
 * referência entre as que não invertem; amostragens mais densas reproduzem o bico da
 * elipse e as mais esparsas achatam o canto até 1 400.
 *
 * O ponto do fundo (`t = 1`, em `CENTRO_X`) é compartilhado pelos dois lados: ali a
 * tangente sai horizontal por simetria, sem ninguém pedir.
 *
 * **Fica declarado o que sobra:** o arremate ainda é 80 onde a referência tem 40–60,
 * e fechar essa diferença é remedir `TRONCO.ryArremate` contra a base extraída por
 * coluna. É trabalho de um bloco que tenha o tronco no escopo, não deste.
 */
const AMOSTRAS_ARREMATE = [0.7] as const;

function arremateTronco(lado: 1 | -1): { x: number; y: number }[] {
  const ult = TRONCO.perfil[TRONCO.perfil.length - 1];
  const rx = meioPath(ult.meio);
  return AMOSTRAS_ARREMATE.map((t) => ({
    x: CENTRO_X + lado * rx * Math.sqrt(1 - t * t),
    y: ult.y + TRONCO.ryArremate * t,
  }));
}

/**
 * **O PATH CANÔNICO DO TRONCO.** É este, e só este, que os 14 trajes clipam.
 *
 * Não existe segunda cópia em lugar nenhum do sistema — nem no traje (o tipo não
 * tem o campo), nem no gate (que rasteriza esta mesma função), nem no asset (que
 * é tinta, não forma). É a diferença entre `registro()`, que exigia que duas
 * silhuetas COINCIDISSEM, e este arquivo, que só tem uma.
 *
 * Ele é UMA spline aberta do ombro direito ao ombro esquerdo, passando pelo fundo,
 * mais a reta do topo que fecha. O fundo não é mais um comando de arco — ver
 * `arremateTronco()` para o entalhe que isso produzia.
 */
export function pathTronco(): string {
  const ult = TRONCO.perfil[TRONCO.perfil.length - 1];
  const pts = [
    ...perfilTronco(1),
    ...arremateTronco(1),
    // O fundo, compartilhado pelos dois lados. É o que dá a tangente horizontal ali.
    { x: CENTRO_X, y: ult.y + TRONCO.ryArremate },
    ...arremateTronco(-1).reverse(),
    ...perfilTronco(-1).reverse(),
  ];
  return (
    `M ${n(pts[pts.length - 1].x)} ${n(TRONCO.yTopo)} ` +
    `L ${n(pts[0].x)} ${n(TRONCO.yTopo)} ` +
    spline(pts) +
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
 * UM ARCO RASO entre duas pontas, com a flecha medida no MEIO.
 *
 * O ponto de controle vai ao **dobro** da sagita porque uma Bézier quadrática passa
 * na metade do caminho até ele no parâmetro 0,5. Pôr o controle na sagita medida
 * entregaria metade da curva — é o mesmo erro de fator que a rampa das facetas
 * cometeu no Bloco 1c, num lugar em que ele custa uma unidade de forma em vez de
 * cinco níveis de tom.
 *
 * A sobrancelha e a boca compartilham esta função porque são a mesma primitiva com
 * sinais diferentes: uma arqueia para cima, a outra para baixo. Escrever as duas
 * separadas seria duas descrições do mesmo arco.
 */
function arco(cx: number, cy: number, larg: number, sagita: number, inclinacao = 0): string {
  const meia = larg / 2;
  const dy = inclinacao / 2;
  return (
    `M ${n(cx - meia)} ${n(cy + dy)} ` +
    `Q ${n(cx)} ${n(cy + 2 * sagita)} ${n(cx + meia)} ${n(cy - dy)}`
  );
}

/**
 * UMA SOBRANCELHA: arqueada para CIMA e inclinada, virando cápsula pelo
 * `stroke-linecap`.
 *
 * Recebe o centro do olho do mesmo lado e sobe `SOBRANCELHA.acimaDoOlho`. Não há
 * versão esquerda e versão direita — as duas arqueiam e inclinam para o mesmo lado,
 * e o que as diferencia é só de qual olho elas penduram. Uma segunda função seria a
 * segunda descrição da mesma peça.
 *
 * A sagita entra **negativa**: em SVG o y cresce para baixo, e o arco da sobrancelha
 * sobe no meio.
 */
export function pathSobrancelha(cxOlho: number, cyOlho: number): string {
  return arco(
    cxOlho,
    cyOlho - SOBRANCELHA.acimaDoOlho,
    SOBRANCELHA.larg,
    -SOBRANCELHA.sagita,
    SOBRANCELHA.subida,
  );
}

/** A BOCA: o mesmo arco, para baixo, e sem inclinação — a régua mediu −0,0009. */
export function pathBoca(): string {
  return arco(OLHO_MEIO, OLHO.cy + BOCA.abaixoDoOlho, BOCA.larg, BOCA.sagita);
}

/**
 * O ESPECULAR — uma mancha oval, **para dentro do rosto**, no canto da `LUZ`.
 *
 * ---------------------------------------------------------------------------
 * ELE ERA UMA VÍRGULA COLADA NO CONTORNO, E ISSO ERA DUAS COISAS ERRADAS
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou a folha do Bloco 1d por *"um mini kink na parte de cima da cabeça,
 * lado esquerdo, acima do reflexo da luz — quase imperceptível"*, e a localização
 * dele estava certa: o defeito mora entre o traço e o especular, não no traço.
 *
 * A vírgula anterior tinha 54 × 59 unidades e subia até y 59, e a **folga entre a
 * borda interna do traço e o topo dela afinava para 1,8 unidade** em x 164, reabrindo
 * dos dois lados. Uma nesga de pele que estreita e engorda entre duas manchas escuras
 * lê como a linha engrossando — que é exatamente o que se vê.
 *
 * ---------------------------------------------------------------------------
 * O QUE A REFERÊNCIA TEM, MEDIDO
 * ---------------------------------------------------------------------------
 *
 * O `medir.ts` registra por que o gate NÃO mede o especular: limiarizar tom devolvia
 * uma mancha de 241 × 54 unidades, quase metade da cabeça. A causa é a granulação da
 * ilustração — o limiar pega pontinhos claros espalhados por todo lado, e a caixa
 * deles não descreve mancha nenhuma.
 *
 * Desfocando 3 px antes de limiarizar e ficando com a **componente conexa** maior, a
 * leitura fica estável e ela é outra:
 *
 * | limiar | caixa | área | centro | folga até o contorno |
 * |--------|-------|------|--------|----------------------|
 * | +4 | 39,8 × 28,6 | 781 | (138,7 · 92,4) | 30,6 |
 * | +6 | 38,5 × 26,9 | 723 | (138,7 · 92,4) | 31,5 |
 * | +8 | 37,7 × 26,1 | 681 | (138,7 · 92,4) | 31,9 |
 *
 * O centro não se move um décimo em três limiares. É uma **mancha compacta a 31
 * unidades da linha**, e não uma faixa que a acompanha. Metade da altura e metade da
 * folga do que estava desenhado.
 *
 * A elipse da caixa tem 894 u² contra os 781 medidos: os 13% de sobra são um
 * entalhe na base da mancha que não é modelado. A 56 px são 0,4 pixel, e modelá-lo
 * custaria dois pontos de controle numa forma que já é a menor do desenho.
 *
 * É `#FFFFFF` com opacidade, não uma cor: assim ele clareia qualquer um dos 8 tons de
 * pele sem precisar de 8 valores.
 */
export const ESPECULAR = {
  cx: 139.9,
  cy: 93.4,
  rx: 19.9,
  ry: 14.3,
} as const;

export function pathEspecular(): string {
  const { cx, cy, rx, ry } = ESPECULAR;
  return (
    `M ${n(cx - rx)} ${n(cy)} ` +
    `A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)} ` +
    `A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`
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
     * de `medir.ts` (**0,34 e 0,89** da altura externa da cabeça; eram 0,35 e 0,88,
     * e andaram no Bloco 1d junto com as janelas, pelo motivo registrado lá).
     *
     * Ancorar o gradiente nos EXTREMOS do path em vez de aqui foi um erro de uma
     * rodada: `deltaTopo` é o tom medido em `frac` 0,35, e declará-lo como o tom do
     * topo da faixa (`frac` 0,16) faz a rampa já ter descido 5,5 níveis quando chega
     * ao ponto onde o gate mede. O gate acusou exatamente isso — −10,3 onde a
     * referência tem −4,8 — e a correção não é afrouxar a tolerância: é a rampa
     * passar pelos dois pontos que foram medidos.
     */
    yAmostraTopo: em(0.34),
    yAmostraBase: em(0.89),
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
 * Segurar em vez de extrapolar é deliberado: acima de `frac` 0,34 a cúpula fecha e a
 * faixa some sozinha; abaixo de 0,89 vem o queixo, que tem tom próprio. Extrapolar
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

/**
 * METADE DOS PONTOS, e é aqui que o orçamento de bytes é pago.
 *
 * Estas duas faixas eram o maior `d=` do boneco depois do contorno da cabeça: 1 383
 * bytes, 44 comandos, quatro bordas de dez pontos cada. Com um ponto sim, um não —
 * mais o último, que fecha o arremate — elas caem para seis pontos por borda.
 *
 * **Onde o corte é seguro e onde não é.** O plano do bloco propunha economizar
 * arredondando TODA coordenada do SVG para inteiro (~1,5 KB). Medido, isso derruba o
 * raio mínimo da cabeça de 34,4 para **14,5** — abaixo do traço, que é o bico que o
 * Bloco 1d existe para eliminar. Meia unidade derruba para 21,4. A precisão do
 * contorno não é onde se economiza.
 *
 * Aqui é: a faixa é pintada a 42% de opacidade **dentro do clip do tronco**, a borda
 * de fora é desenhada 20 unidades para fora e cortada, e o que o gate mede nela é a
 * LARGURA em três alturas — não a forma da borda. O perfil do tronco é uma cápsula
 * suave, e uma spline por seis pontos dela erra frações de unidade contra uma por
 * dez.
 */
const ralo = (pts: { x: number; y: number }[]) =>
  pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);

export function pathPlanoLateralTronco(): string {
  const faixa = (lado: 1 | -1, banda: number) => {
    const fora = ralo(perfilTronco(lado, -20, true));
    const dentro = ralo(perfilTronco(lado, banda + TRACO / 2 + 2, true)).reverse();
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
