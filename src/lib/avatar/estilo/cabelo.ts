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
import { PECAS_DA_ARTE } from "./pecas-da-arte";

/**
 * Os 7 do catálogo. O `criar-personagem` escolhe um destes.
 *
 * Eram 5 (D11 do doc 12), todos paramétricos. `espetado` e `chanel` entraram em
 * 2026-08-07, vindos da **rota de arte** (`docs/avatar/19-rota-de-arte-runbook.md`)
 * depois de aprovação visual do Doug — o espetado no Bloco 9, o chanel no 14.
 *
 * **As duas famílias convivem, e a diferença é medível:** as listas
 * `MODELOS_PARAMETRICOS` e `MODELOS_TRACADOS` dizem quem é quem, e elas são
 * **explícitas de propósito**. Um filtro automático por `massa` deixaria um
 * paramétrico que mudasse de família acidentalmente sumir do teste de selo que
 * existe justamente para pegar isso.
 */
export type ModeloCabelo =
  | "coque"
  | "moicano"
  | "espetado"
  | "chanel"
  | "assimetrico";

/** Um ponto da franja: altura absoluta, e fração da largura da cabeça NAQUELA altura. */
export interface PontoFranja {
  /** 0 = borda esquerda do crânio, 1 = borda direita. Fora de [0,1] é fora da silhueta. */
  t: number;
  /** Altura em unidades do `viewBox`. */
  y: number;
}

/** Um ponto em coordenada absoluta do `viewBox`. */
export interface Ponto {
  x: number;
  y: number;
}

/**
 * UMA FORMA FECHADA EM COORDENADA ABSOLUTA, com os arcos que ela traça.
 *
 * **É `forma: Ponto[]` e não `d: string`, e a troca tem consequência.** Guardando o
 * path já emitido, a régua de folga do rosto enxergava só a franja e ficava cega
 * para a peça — e o moicano, que é só extensão, cairia justamente na cegueira. Dado
 * guardado como dado é dado que o gate consegue medir.
 *
 * É o tipo comum das duas coisas que o compositor desenha fora do clip da cabeça:
 * a **extensão** de um cabelo paramétrico (um coque, uma crista) e cada **forma
 * irmã** de uma peça sobreposta. Elas têm a mesma natureza — um laço próprio, com
 * contorno próprio — e o que as separa é uma só coisa, `atras`, que a peça
 * sobreposta não usa.
 */
export interface FormaDaPeca {
  /** O laço fechado, em coordenada absoluta. */
  forma: readonly Ponto[];
  /**
   * ONDE ESTA FORMA CARREGA TRAÇO — mesmos arcos de índice de `Cabelo.linhas`.
   *
   * Ausente, o laço INTEIRO é traçado, que é o comportamento das extensões
   * paramétricas e o que mantém os cinco modelos do catálogo byte a byte iguais.
   * Presente, o traço vira um `<path>` próprio com um subpath por arco — o que uma
   * peça vinda de arte precisa, porque nela nem toda borda do laço é borda externa
   * de alguma coisa.
   */
  linhas?: readonly (readonly [number, number])[];
}

export interface Extensao extends FormaDaPeca {
  /**
   * Põe a peça SOB a cabeça. É o que faz um coque parecer preso atrás em vez de
   * colado na testa: a cabeça é opaca e come a emenda, oclusão em vez de máscara.
   */
  atras?: boolean;
}

/**
 * UM CABELO, EM UMA DE DUAS FAMÍLIAS — e a segunda existe porque a primeira não
 * tem onde guardar o que a arte tem.
 *
 * **Paramétrico** (`pontos` + `sombra`): uma franja aberta que atravessa a cabeça,
 * fechada por um retângulo fora da silhueta. É o que os cinco modelos de hoje são,
 * e o que a seção "estes números são desenhados, não medidos" do topo descreve.
 *
 * **Traçado** (`massa` + `clara`): um laço FECHADO, medido sobre a arte pelo mesmo
 * pipeline que produziu o contorno do crânio — PNG → linha de centro do preto →
 * decimação por erro de corda → literal colado aqui. Ele existe porque o
 * paramétrico reprovou medido: a folha de fidelidade HSHC93 comparou a arte
 * `curto-espetada` com o melhor traço paramétrico possível e deu **IoU 61,7%**, com
 * desvio médio de borda de 36,1 unidades (≈ 3 px a 56). Quatro coisas da arte não
 * cabiam no modelo, e a maior delas — a **cortina**, a massa que desce ao lado do
 * rosto até a bochecha, DENTRO da silhueta — sozinha segurava ~220 unidades de
 * desvio, porque uma franja aberta mais retângulo não consegue descrever uma borda
 * que volta a subir.
 *
 * Um laço fechado consegue. E ele não afrouxa a lei da fronteira: continua sendo
 * `{t, y}`, continua sem declarar onde o crânio termina, continua sendo o
 * `clipPath` quem corta. O que muda é que a curva pode ir e voltar.
 *
 * **As duas famílias são exclusivas por modelo**, e isso é gate: um cabelo tem
 * `pontos` OU `massa`, nunca os dois. Com os dois, existiriam duas descrições da
 * mesma borda — a lição de seis medições do pipeline morto, de novo.
 */
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
  /**
   * ONDE A SOMBRA TERMINA — a borda de baixo da camada CLARA, quando ela não é
   * simplesmente a franja subida `DEGRAU`.
   *
   * **Existe porque o degrau constante foi reprovado como arte.** O Doug olhou os
   * cinco modelos do 2a.1 e disse *"tudo muito quadrado, sem toque humano"*, e uma
   * das quatro causas é esta: com `DEGRAU` sozinho a sombra é a mesma forma subida
   * 22 unidades, ou seja uma faixa **de espessura constante, paralela em todo o
   * percurso**. Cabelo desenhado tem sombra que engrossa onde a mecha é grossa e
   * afina onde ela afina; espessura constante lê como impressão gráfica.
   *
   * Quando ausente, o comportamento é o de sempre — `pontos` subida `DEGRAU` —, e
   * é por isso que os cinco modelos existentes não mudaram um byte ao ganharem
   * este campo. Quando presente, ela é a borda de baixo da camada clara e o
   * degrau varia sozinho ao longo da franja.
   *
   * **Não custa forma nem byte de CSS:** a camada clara já era desenhada. O que
   * muda é de onde vêm os pontos dela.
   *
   * **Ela tem de ficar ACIMA da franja em todo o percurso**, e isso é gate
   * (`sombraSobreAFranja`), não convenção. A camada clara é a única do cabelo
   * desenhada **sem contorno** — se ela descer abaixo da escura, sobra tinta clara
   * fora da silhueta preta, e o defeito é um vazamento sem borda que nenhuma das
   * outras amarras enxerga.
   */
  sombra?: readonly PontoFranja[];
  /**
   * A MASSA DE CABELO COMO LAÇO FECHADO — touca e cortina na mesma curva.
   *
   * Mesmo espaço `{t, y}` da franja, e pelo mesmo motivo: `t` é fração da largura da
   * cabeça naquela altura, então a peça acompanha o `GIRO` sem ninguém somar
   * deslocamento. A diferença é topológica — o laço fecha em si mesmo, e é isso que
   * deixa a borda descer, virar e voltar a subir. A franja aberta não conseguia:
   * ela é uma função de `x`, e cortina não é.
   *
   * **Ela não substitui o `clipPath`, e as excursões fora dele são de propósito.**
   * O laço medido na arte passa por fora do crânio em vários trechos, exatamente
   * como as pontas da franja saíam por `t` fora de [0, 1]. Quem corta continua sendo
   * a faca do compositor. O que a peça declara é onde há cabelo, não onde há cabeça.
   *
   * Quem produz estes números é `scripts/avatar/estilo/tracar-cabelo.ts`, e a
   * colagem é manual — o mesmo pipeline dos 42 pontos do crânio, pelo mesmo motivo:
   * um literal colado aparece no diff, um literal gerado em tempo de build não.
   */
  massa?: readonly PontoFranja[];
  /**
   * A REGIÃO CLARA, também laço fechado — o par de `massa`, como `sombra` é de
   * `pontos`.
   *
   * Ela é a posterização do degradê da arte em fronteira medida: a regra 15c (o
   * efeito cubo) aplicada ao cabelo. Não é degradê, e não vira degradê — o estilo
   * inteiro é chapado, e um cabelo com rampa seria a única peça do sistema a ter uma.
   *
   * **Ela vive DENTRO da massa, e isso é gate (`contencaoDaClara`), não convenção.**
   * A camada clara é a única do cabelo desenhada sem contorno — o traço mora na
   * escura. Um ponto da clara fora da massa é tinta clara sem borda no meio do
   * fundo: não invade rosto, não estoura orçamento, não muda contagem de formas.
   * Passaria inteiro. É o mesmo defeito que `sombraSobreAFranja` pega no
   * paramétrico, medido do jeito que um laço fechado permite medir.
   *
   * Ausente, o cabelo é chapado — uma passada só. `pathCabeloClaro` devolve `""` e o
   * compositor não emite a forma, em vez de gastar uma do orçamento com `d=""`.
   */
  clara?: readonly PontoFranja[];
  /**
   * AS FORMAS CLARAS ADICIONAIS — a região clara partida em mais de um pedaço.
   *
   * `bordaOrdenada` percorre UMA componente (`tracar-cabelo.ts:1508-1516`), e até
   * aqui a segunda sumia em silêncio: medido na `entrada-2`, **3 165 u² de área
   * clara** ficavam fora do laço sem nenhum gate acusar. Um cabelo com uma mecha
   * iluminada destacada da massa principal é desenho comum, não caso raro.
   *
   * Ela vive no mesmo `<path>` da `clara`, como subpaths `M…Z M…Z` — o mesmo
   * mecanismo que `extensoesCabelo` já usa para agrupar formas irmãs. Não custa
   * forma do orçamento por pedaço e não muda uma linha de CSS.
   *
   * Ausente, o comportamento é o de sempre, e é por isso que os cinco modelos do
   * catálogo não veem este campo.
   */
  claras?: readonly (readonly PontoFranja[])[];
  /**
   * O CIANO DA PEÇA TRANSCRITA — e com ele a `massa` deixa de ser o cabelo e passa
   * a ser a TINTA.
   *
   * ---------------------------------------------------------------------------
   * O DEFEITO QUE ELE EXISTE PARA MATAR
   * ---------------------------------------------------------------------------
   *
   * Sem ele o contorno preto é **sintetizado**: o compositor traça o laço da massa
   * com `stroke-width: 12` **centrado**, então o preto ocupa `[borda−6, borda+6]`
   * enquanto o da arte ocupa `[borda, borda−10]`. Medido na `chanel`: sobreposição
   * 6, união 16, **IoU 34,4%** e razão de área **1,21×**. A forma era transcrita
   * bem; a tinta não era transcrita de jeito nenhum.
   *
   * Com `nucleo`, a `massa` é preenchida de `--av-linha` e o núcleo por cima com
   * `--av-cabelo-s`: **a banda preta vira a diferença entre duas formas cheias**, e
   * a espessura dela passa a ser a que a arte tem. Não há `evenodd`, não há região
   * com furo, e `bordaOrdenada` não muda.
   *
   * ---------------------------------------------------------------------------
   * POR QUE UMA LISTA, E NÃO UM LAÇO
   * ---------------------------------------------------------------------------
   *
   * O núcleo é **multi-componente por construção**: um traço interno que atravessa
   * a peça parte o ciano em dois. Medido na `chanel`: 2 componentes na variante
   * fiel à arte. Eles saem no mesmo `<path>`, como subpaths `M…Z M…Z`, pelo mesmo
   * mecanismo de `claras` — multi-componente não custa forma do orçamento.
   *
   * **Ausente, o caminho é o de hoje, byte a byte**, e é isso que deixa as peças
   * do Bloco 9 congeladas convivendo com as transcritas.
   */
  nucleo?: readonly (readonly PontoFranja[])[];
  /**
   * O PRETO QUE CORRE POR DENTRO DA PEÇA — a camada que `linhas` não sabe expressar.
   *
   * `Cabelo.linhas` são arcos **do laço da massa**: um traço que corre por dentro
   * do cabelo, e não pela borda dele, **não tem onde morar naquele tipo**. Era por
   * isso que o traço da mecha direita da `chanel`, perto do queixo, sumia — e sumia
   * por construção, não por limiar mal escolhido.
   *
   * Elas vão **depois da camada clara**, e a ordem é o ponto: o traço interno mais
   * aparece justamente na região iluminada, e emitido antes da clara ele seria
   * coberto ali.
   *
   * Só faz sentido com `nucleo` — sem ele a massa inteira já é cabelo, e uma forma
   * preta solta por cima seria um borrão sem borda.
   */
  pretas?: readonly (readonly PontoFranja[])[];
  /**
   * ONDE O LAÇO DA MASSA CARREGA TRAÇO — em ARCOS DE ÍNDICE, não numa segunda curva.
   *
   * ---------------------------------------------------------------------------
   * O DEFEITO QUE ELA EXISTE PARA MATAR
   * ---------------------------------------------------------------------------
   *
   * `.kk-cabelo-s` tem `fill` **e** `stroke`, e isso é a resposta certa para a
   * família paramétrica: a touca fecha por um retângulo a `FORA` da caixa da cabeça,
   * o clip come aquele trecho inteiro, e o que sobra traçado é exatamente a franja.
   * O perímetro matemático e o traço visível coincidem por construção.
   *
   * Num laço FECHADO eles deixam de coincidir. O laço tem borda em todo o percurso,
   * inclusive por cima, onde quem desenha o contorno na arte é a cabeça do BONECO —
   * que é `descarte` e não faz parte da peça. Medido na `curto-espetada`: em
   * **876 dos 3 028** pontos do laço a sonda pela normal não encontra preto nenhum.
   * Traçar o laço inteiro põe uma barra preta atravessando a coroa, com pele por
   * cima dela, que ninguém desenhou e a arte não tem.
   *
   * ---------------------------------------------------------------------------
   * POR QUE ÍNDICE, E NÃO UMA LISTA DE PONTOS
   * ---------------------------------------------------------------------------
   *
   * Cada par é `[primeiro, último]` em índices de `massa`, andando para a FRENTE e
   * dando a volta quando `último ≤ primeiro`. `[3, 9]` são os seis trechos de 3 a 9;
   * `[38, 2]` dá a volta pelo fim do vetor; `primeiro === último` é o laço inteiro.
   *
   * A alternativa óbvia — guardar os pontos da linha — cria **duas descrições da
   * mesma borda**, e a lição de seis medições do pipeline morto é que duas
   * descrições da mesma fronteira divergem sempre. Seria preciso então um gate
   * medindo "a linha corre sobre a massa?", que é justamente o tipo de amarra que
   * este arquivo troca por mecanismo sempre que dá. Com índice, o traço não *corre
   * sobre* a massa: ele **é** a massa, no trecho apontado, emitido pelos mesmos
   * comandos `C` (ver `de`/`ate` de `spline`). Não há o que divergir, e o literal
   * fica menor.
   *
   * Ausente, a peça traçada é **chapada de traço**: massa e clara sem contorno
   * nenhum. É legítimo e não é o padrão — quem produz os arcos é
   * `avatar:importar`, a partir da mesma sonda pela normal que mede a massa.
   */
  linhas?: readonly (readonly [number, number])[];
  /**
   * AS FORMAS IRMÃS DA PEÇA SOBREPOSTA — os pedaços que `massa` não alcança.
   *
   * `bordaOrdenada` percorre UMA componente (`tracar-cabelo.ts:1508-1516`), então
   * uma peça com um lóbulo destacado — uma mecha solta, um espeto separado — perdia
   * a segunda parte em silêncio. Elas saem no MESMO `<path>` da massa, como
   * subpaths `M…Z M…Z`, então multi-componente deixa de custar uma forma do
   * orçamento por pedaço.
   *
   * **Não são `extensoes`, e a diferença não é de nome.** Uma extensão é a parte da
   * peça que EXCEDE a silhueta, existe porque a massa é clipada, e pode ir atrás da
   * cabeça. Numa peça sobreposta não há clip nem "atrás": ela é desenhada inteira,
   * por cima, e estes são simplesmente os outros pedaços dela. Foi a partição
   * massa/extensão que saiu quando a peça virou dona da própria silhueta.
   */
  formas?: readonly FormaDaPeca[];
  extensoes?: readonly Extensao[];
}

/**
 * O TETO DO COMPOSTO — base mais UM cabelo, que é o que um aluno de verdade carrega.
 *
 * Ele morava em três lugares: `folha-base.ts`, `variantes.ts` e o teste. Três cópias
 * de um número que a peça traçada tem autorização para mudar (doc 15:463 — teto de
 * bytes não veta arte aprovada) são três chances de duas discordarem, e este
 * repositório já pagou esse erro com a contagem de gates aparecendo em seis
 * documentos com quatro valores.
 *
 * O racional dos números está no docstring do orçamento em `folha-base.ts`: 26
 * formas e 10 240 bytes, com a conta do ranking (30 bonecos a 56 px) explícita.
 */
export const ORCAMENTO_COMPOSTO = { formas: 26, bytes: 10240 } as const;

// ---------------------------------------------------------------------------
// OS COMPOSTOS DE TRÊS E QUATRO CAMADAS — o D15, fechado em 2026-08-17
// ---------------------------------------------------------------------------
//
// `ORCAMENTO_COMPOSTO` diz de si mesmo que mede "base mais UM cabelo, que é o que
// um aluno de verdade carrega". **Deixou de ser verdade quando o slot de rosto
// nasceu**, e o número mostrou isso sem folga nenhuma: base + `chanel` dá 23
// formas, a receita da barba custa 3 `<path>` (massa cheia + massa traçada +
// núcleo sem traço) e o composto bate **26 exatos**. Passava raspando, e o chapéu
// não cabia. Era o G16 chegando na conta de outro slot.
//
// A CONTA DO RANKING, REFEITA — e ela mudou o que o teto de bytes significa.
//
// O ranking mostra o RECORTE DE CABEÇA, que não leva traje: o pior composto que
// uma lista pode montar é base + cabelo + rosto + chapéu. Medidos 30 bonecos
// distintos, com pele, cabelo e barba variando (`.scratch/estilo/medir-ranking.ts`):
//
//   cenário                          formas     cru      gzip    razão
//   base + cabelo                      654    322 KB   48,9 KB   6,6×
//   base + cabelo + rosto              744    394 KB   51,1 KB   7,7×
//   base + cabelo + rosto + chapéu     834    482 KB   56,0 KB   8,6×
//
// **Os 10 240 B prometiam 300 KB de marcação para a lista inteira, e a lista com
// só cabelo já está em 322 KB.** O teto estava furado antes de o rosto existir. E
// o que o docstring sempre disse sem medir — *"que comprime como texto"* — é o que
// salva a conta: 482 KB crus são **56 KB no fio**, e a razão de compressão MELHORA
// com as camadas (6,6× → 8,6×), porque cada peça nova repete estrutura que o
// dicionário do gzip já tem. Trinta avatares com tudo ligado custam menos que uma
// foto. **Byte cru nunca foi o custo real; ele é registro de regressão, e é só
// isso que estes números são.**
//
// O QUE CONTINUA SENDO TETO DE VERDADE É FORMA, e por outro motivo: cada forma é
// um nó de DOM que o navegador do celular barato pinta 30 vezes. Aí o número
// morde.

/**
 * O que UMA peça sobreposta pode custar ao composto.
 *
 * **Medido: 3 formas.** `sobrepor()` emite um `<path>` de preenchimento por forma
 * mais um de traço por forma que não declare `semTraco` — a receita de duas formas
 * cheias (massa + núcleo) dá 2 + 1 = 3, e as duas barbas custam exatamente isso.
 *
 * **Declarado: 5.** A folga não é arredondamento: é a peça de três formas com um
 * núcleo sem traço (3 + 2 = 5), que é o próximo degrau de complexidade real — um
 * chapéu com copa, aba e fita. Orçar o medido seria calibrar o teto pelo desenho
 * que ele deveria julgar, que é o erro que `PISO_DISTINCAO` nomeia em
 * `folha-base.ts`.
 *
 * Em bytes, a barba mais cara custou 3 010 B; os 4 500 declarados dão a mesma
 * ordem de folga. Vale a regra de sempre (doc 15:463): **byte não veta arte
 * aprovada** — ele registra.
 */
export const CUSTO_DE_SOBREPOSTA = { formas: 5, bytes: 4500 } as const;

/**
 * BASE + CABELO + ROSTO — três camadas, e é o que o produto renderiza hoje.
 *
 * Derivado, nunca escrito à mão: se o custo de uma sobreposta mudar, os dois
 * compostos abaixo acompanham juntos. É o mesmo movimento que tirou o teto do
 * cabelo de três cópias para uma.
 *
 * O pior medido hoje é `vertical` × `chanel`, com **26 formas** — exatamente o teto
 * antigo. Contra este, sobram 5.
 */
export const ORCAMENTO_COM_ROSTO = {
  formas: ORCAMENTO_COMPOSTO.formas + CUSTO_DE_SOBREPOSTA.formas,
  bytes: ORCAMENTO_COMPOSTO.bytes + CUSTO_DE_SOBREPOSTA.bytes,
} as const;

/**
 * BASE + CABELO + ROSTO + CHAPÉU — quatro camadas, o pior caso que uma lista monta.
 *
 * **O nome diz "com chapéu" e a conta inclui o rosto de propósito:** quem usa
 * chapéu pode usar barba, e o ranking mostra as duas. Orçar o chapéu sozinho seria
 * orçar uma composição que o produto não impede.
 *
 * ⚠️ **DECLARADO, AINDA NÃO MEDIDO CONTRA ARTE REAL.** Não existe chapéu no
 * catálogo (Bloco 6/7). A procuração usada na conta do ranking foi a barba mais
 * cara, e ela é defensável porque `sobrepor()` é a MESMA função para rosto e
 * chapéu — o compositor não sabe qual slot está desenhando. Assim que o primeiro
 * chapéu existir, `avatar:folha-base` passa a medir este número em vez de anunciá-lo.
 */
export const ORCAMENTO_COM_CHAPEU = {
  formas: ORCAMENTO_COM_ROSTO.formas + CUSTO_DE_SOBREPOSTA.formas,
  bytes: ORCAMENTO_COM_ROSTO.bytes + CUSTO_DE_SOBREPOSTA.bytes,
} as const;

// ---------------------------------------------------------------------------
// As amarras
// ---------------------------------------------------------------------------

/**
 * Quanto de testa tem de sobrar entre o traço da franja e o topo da sobrancelha,
 * **na peça DESENHADA**.
 *
 * **24 unidades, e o número sai da escala de leitura, não do gosto.** A 56 px — o
 * tamanho do ranking, o que manda pela regra 8 da §7 — o `viewBox` de 700 unidades
 * dá 12,5 unidades por pixel, então 24 são **1,9 px de pele** entre duas peças
 * pretas. Menos de um pixel e as duas encostam por antialiasing no tamanho em que
 * o boneco mais aparece; a sobrancelha inteira tem 0,66 px de espessura ali, e uma
 * franja colada nela vira uma mancha só.
 *
 * **NA PEÇA TRAÇADA (`massa`) O PISO É OUTRO, e ele não mora neste arquivo.** Ali a
 * folga é um **fato da arte** — o gerador não conhece este número, e a
 * `curto-espetada` deixa 6,2 u —, e o que o traço controla é não piorá-la. O piso
 * dela é `folga da arte − meio traço`, medido lado a lado pelo **gate 3 de
 * `avatar:fidelidade`**, o único lugar onde arte e render convivem. Reancorado em
 * 2026-08-04; a régua paramétrica resolvia subindo a peça inteira, e foi isso que
 * produziu a faixa de testa nua da folha HSHC93.
 *
 * O número absoluto continua valendo como **legibilidade** nas duas famílias: abaixo
 * de 24 u a peça traçada avisa alto (em `avatar:tracar`, `avatar:variantes`,
 * `avatar:folha-base` e no próprio gate 3), e trocar a arte é direção de arte.
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

/**
 * Um ponto `{t, y}` virando coordenada, perguntando a borda ao contorno da cabeça.
 *
 * **Exportada** porque o slot de rosto (`rosto.ts`) nasce no mesmo espaço `{t, y}`
 * e pelo mesmo motivo — é assim que o `GIRO` chega na peça sem ninguém somar
 * deslocamento. Uma segunda cópia aqui seria uma segunda leitura de `bordasEm`,
 * livre para divergir desta na primeira vez que o contorno mudar.
 */
export function ponto(p: PontoFranja, dy = 0): { x: number; y: number } {
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

/**
 * Uma forma livre em coordenada absoluta, fechada por spline.
 *
 * **Exportada pelo mesmo motivo de `ponto`**: `rosto.ts` fecha os laços dele com
 * esta spline centrípeta, e não com uma segunda. Duas parametrizações da mesma
 * curva emitem `C` diferentes, e a emenda entre duas peças do mesmo boneco
 * apareceria.
 */
export function laco(pts: readonly Ponto[]): string {
  return `M ${n(pts[0].x)} ${n(pts[0].y)} ` + spline(pts, true) + `Z`;
}

/**
 * O mesmo laço, para pontos em `{t, y}` — a peça traçada.
 *
 * É `laco()` sobre `ponto()`, e não uma segunda emissão: a spline centrípeta
 * fechada já existia para as extensões, e a única diferença de uma massa de cabelo
 * é de onde vem a coordenada. `dy` sobe a forma inteira, como na touca.
 */
function lacoTY(pts: readonly PontoFranja[], dy: number): string {
  return laco(pts.map((p) => ponto(p, dy)));
}

// ---------------------------------------------------------------------------
// O catálogo
// ---------------------------------------------------------------------------

/**
 * OS CINCO MODELOS — dois paramétricos e três vindos da arte.
 *
 * **Eram sete, e o Doug podou para cinco em 2026-08-08**, mantendo só o que ele
 * aprovou olhando o render: saíram `curto`, `cacheado` e `tranca`. Com a careca — que
 * não é peça, é a ausência de uma — o aluno vê **seis opções**.
 *
 * ⚠️ **`curto` era o primeiro porque era o padrão**: um aluno que não escolhesse nada
 * não podia aparecer careca (D5). Com ele fora, quem abre a lista é `coque`.
 *
 * **Nada quebrou no banco, e isso foi conferido:** a coluna `users.avatar_hair` que
 * os docstrings deste arquivo citam **ainda não existe** — as colunas de avatar hoje
 * são `avatar_config`, `avatar_base`, `avatar_url` e `avatar_chosen`. Não há default
 * apontando para uma peça apagada. Quando a coluna nascer, o default tem de ser um
 * `ModeloCabelo` vivo, e a lista acima é a fonte.
 *
 * Os três últimos entram por espalhamento de `PECAS_DA_ARTE`, com a identidade
 * sobrescrita. Ver `MODELOS_PARAMETRICOS` / `MODELOS_TRACADOS` logo abaixo do
 * catálogo para quem é de qual família, e por que a lista é escrita e não filtrada.
 */
export const CABELOS: Record<ModeloCabelo, Cabelo> = {
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

  /**
   * ESPETADO — a primeira peça de ARTE do catálogo, aprovada pelo Doug no Bloco 9.
   *
   * A geometria vem inteira de `PECAS_DA_ARTE.entrada`, e ela **não é recopiada
   * aqui**: o literal é gerado por `npm run arte:pecas` a partir do PNG versionado,
   * e ter duas descrições da mesma borda é o defeito que este arquivo inteiro
   * evita. O que o catálogo declara é a **identidade** — `id` e `nome` —, porque o
   * gerador grava o `id` a partir do nome do ARQUIVO (`entrada.png` → `"entrada"`),
   * e sem esta linha `CABELOS.espetado.id` seria `"entrada"` em runtime, mascarado
   * pelo cast do arquivo gerado.
   *
   * **Família sintetizada (legada), congelada por decisão C de 2026-08-06:** o preto
   * dela é um `stroke` de 12 u sobre o laço (`linhas`), não a banda transcrita da
   * arte. Transcrevê-la exige a variante `lei` — a banda preta do PNG tem p50 de
   * 6,3 u e **79,8% do perímetro abaixo de 8 u**, fina demais para a `fiel` — e uma
   * re-aprovação visual.
   */
  espetado: {
    ...PECAS_DA_ARTE.entrada,
    id: "espetado",
    nome: "Espetado",
  },

  /**
   * CHANEL — a primeira peça com o preto **transcrito**, aprovada no Bloco 14.
   *
   * `nucleo` + `pretas`: a banda preta é a diferença entre duas formas cheias, com a
   * espessura que a artista desenhou, em vez de um stroke de largura fixa. IoU do
   * preto **80,1%** contra 34,4% da família sintetizada, e o traço interno — 866 px
   * em 4 formas — que na outra família não tem onde morar.
   *
   * É o pipeline permanente para arte nova. Mesma regra de identidade do espetado.
   */
  chanel: {
    ...PECAS_DA_ARTE.chanel,
    id: "chanel",
    nome: "Chanel",
  },

  /**
   * ASSIMÉTRICO — promovida em 2026-08-08, e a primeira peça que o Doug corrigiu
   * **olhando o render** em vez de mexendo na arte.
   *
   * Ela entrou pela `fiel`, e por medição: a queixa dele era *"traço grosso demais
   * comparado ao chanel"*, e a `fiel` bate o chanel na casa decimal — **2,00 px**
   * contra 2,00 px na lateral, a 280 px de altura. A `lei` erra por 63%.
   *
   * **Duas coisas ficam declaradas, e as duas foram decisão dele:**
   *
   * 1. O contorno tem **2 vãos e 18 focos de traço fino**, herdados da arte, cuja
   *    banda vai de 4,6 a 10,4 u. A variante `faixa` foi construída para isso e
   *    reprovou por piorar a uniformidade — ver o G8 em `docs/achados.md`. A 56 px,
   *    que é o tamanho que o aluno vê, os vãos não aparecem.
   * 2. `contencaoDoNucleo` mede **−1,88 u** nela: o ciano ultrapassa o preto em 4
   *    pontos de 1 a 2 px. O catálogo não cobra esse eixo hoje (o teste dele roda
   *    contra fixtures), então isto é **dívida declarada, não gate furado**.
   *
   * A sobrancelha esquerda **não é desenhada** quando esta peça está no boneco: a
   * massa cobre 97,6% dela, e o resto lia como rebarba. Ver `sobrancelhaEscondida`.
   */
  assimetrico: {
    ...PECAS_DA_ARTE["entrada-2"],
    id: "assimetrico",
    nome: "Assimétrico",
  },
};

/** A lista na ordem do catálogo, para as folhas e para o `criar-personagem`. */
export const MODELOS_CABELO = Object.keys(CABELOS) as ModeloCabelo[];

/**
 * QUEM É PARAMÉTRICO E QUEM VEIO DA ARTE — **por lista escrita, nunca por filtro.**
 *
 * A tentação é derivar isto de `CABELOS[m].massa === undefined`, e ela custa
 * exatamente o que o selo existe para pegar: no dia em que um paramétrico ganhar
 * `massa` por acidente, o filtro o tira da lista dos congelados e o teste passa a
 * não conferir nada sobre ele — em silêncio, e justamente no caso em que ele mudou.
 *
 * Com as listas escritas, esse mesmo acidente reprova em duas amarras: a de família
 * (*"os paramétricos continuam paramétricos"*) e a de bytes.
 *
 * `completudeDasFamilias` cobra que as duas somem `MODELOS_CABELO` — sem isso um
 * modelo novo nasceria fora das duas e escaparia dos dois blocos de selo.
 */
export const MODELOS_PARAMETRICOS = ["coque", "moicano"] as const satisfies readonly ModeloCabelo[];

/** Os promovidos pela rota de arte. Ver `docs/avatar/19-rota-de-arte-runbook.md`. */
export const MODELOS_TRACADOS = [
  "espetado",
  "chanel",
  "assimetrico",
] as const satisfies readonly ModeloCabelo[];

/**
 * UM CABELO DO CATÁLOGO, **ou um literal** — e o "ou" existe para o desenho.
 *
 * Em produção o aluno escolhe um dos cinco, e é um slug que viaja até o banco. Mas
 * uma peça que ainda não está no catálogo não tem slug: é justamente o que se está
 * desenhando. Sem esta união, `avatar:variantes` teria de montar o SVG por conta
 * própria para mostrar três candidatos — e aí existiriam duas composições, que é o
 * defeito que o `compositor.ts` inteiro existe para não ter.
 *
 * A união não afrouxa nada: continua sendo `Cabelo` dos dois lados, com as mesmas
 * amarras medidas pelas mesmas funções. O que ela permite é o literal viver fora
 * do `CABELOS` enquanto ninguém escolheu.
 */
export type CabeloOuModelo = ModeloCabelo | Cabelo;

export const resolverCabelo = (m: CabeloOuModelo): Cabelo =>
  typeof m === "string" ? CABELOS[m] : m;

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
function touca(franja: readonly PontoFranja[], dy: number): string {
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

/**
 * O PATH DA CAMADA ESCURA. Laço fechado se a peça é traçada, touca se é paramétrica.
 *
 * O ramo da massa vem primeiro porque ele é o estado-alvo: quando o último modelo
 * paramétrico for re-traçado, `touca()`, `FORA`, `DEGRAU` e `liberarORosto` saem do
 * arquivo junto com o ramo de baixo. Enquanto isso os dois convivem, e o gate de
 * exclusividade garante que nenhum modelo esteja nos dois.
 */
export function pathCabelo(modelo: CabeloOuModelo, dy = 0): string {
  const c = resolverCabelo(modelo);
  if (c.massa) return lacoTY(c.massa, dy);
  return c.pontos ? touca(c.pontos, dy) : "";
}

/**
 * A CAMADA CLARA. Duas origens possíveis, e a segunda é a que existe para a arte.
 *
 * Sem `sombra` declarada, é a franja subida `DEGRAU` — o comportamento do 2a.2, e
 * o dos cinco modelos de hoje, byte a byte. Com ela, a borda de baixo da camada
 * clara é a curva declarada, e a espessura da faixa escura passa a variar ao longo
 * da franja em vez de ser paralela. Ver o docstring de `Cabelo.sombra`.
 */
export function pathCabeloClaro(modelo: CabeloOuModelo): string {
  const c = resolverCabelo(modelo);
  // Peça traçada: a região clara é um laço próprio, ou não existe. Um cabelo
  // chapado é legítimo — o que não pode é a clara ser inventada por deslocamento,
  // que é justamente a faixa paralela reprovada como arte.
  if (c.massa) {
    const formas = [...(c.clara ? [c.clara] : []), ...(c.claras ?? [])];
    return formas.map((f) => lacoTY(f, 0)).join(" ");
  }
  if (!c.pontos) return "";
  return c.sombra ? touca(c.sombra, 0) : touca(c.pontos, -DEGRAU);
}

/**
 * O NÚCLEO DE CIANO da peça transcrita. Vazio quando ela não é transcrita.
 *
 * É `pathCabeloClaro` com outra lista: mesmo `lacoTY`, mesmos subpaths `M…Z M…Z`,
 * mesma união por `join(" ")`. Duas funções de três linhas em vez de um genérico
 * com parâmetro de campo — as camadas são três coisas diferentes e o compositor
 * pergunta por elas pelo nome.
 */
export function pathCabeloNucleo(modelo: CabeloOuModelo): string {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.nucleo?.length) return "";
  return c.nucleo.map((f) => lacoTY(f, 0)).join(" ");
}

/** As pretas internas da peça transcrita. Ver `Cabelo.pretas`. */
export function pathCabeloPretas(modelo: CabeloOuModelo): string {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.pretas?.length) return "";
  return c.pretas.map((f) => lacoTY(f, 0)).join(" ");
}

/** O path de uma extensão. Laço fechado, coordenada absoluta, sem clip. */
export function pathExtensao(e: FormaDaPeca): string {
  return laco(e.forma);
}

/**
 * O TRAÇO DE UMA EXTENSÃO que declara arcos. Vazio quando ela não declara.
 *
 * É `pathCabeloLinhas` para `{x, y}` em vez de `{t, y}`, e a duplicação de quatro
 * linhas é preferível a um genérico: os dois espaços têm origens diferentes e
 * juntá-los pediria um parâmetro de conversão que só existiria para satisfazer o
 * compilador. Os comandos `C` emitidos são os MESMOS de `pathExtensao` no trecho
 * apontado — mesma `spline`, mesmos pontos —, então não há duas descrições da
 * mesma borda para divergirem.
 */
export function pathExtensaoLinhas(e: FormaDaPeca): string {
  if (!e.linhas?.length) return "";
  const pts = e.forma;
  const N = pts.length;
  return e.linhas
    .map((arco) => {
      const de = ((arco[0] % N) + N) % N;
      return (
        `M ${n(pts[de].x)} ${n(pts[de].y)} ` + spline(pts, true, de, de + trechosDoArco(arco, N))
      );
    })
    .join("");
}

/**
 * Quantos trechos do laço um arco cobre. `primeiro === último` é o laço INTEIRO.
 *
 * Zero trechos seria um arco que não desenha nada, e um `M` solto no `d` — então o
 * caso degenerado é lido como a volta completa, que é o único sentido que ele pode
 * ter num laço fechado.
 */
const trechosDoArco = (arco: readonly [number, number], N: number) =>
  (((arco[1] - arco[0]) % N) + N) % N || N;

/**
 * O TRAÇO DA PEÇA TRAÇADA — um `<path>` com um subpath por arco.
 *
 * Cada arco sai por `spline(pts, true, de, ate)`, que emite **os mesmos comandos
 * `C`** que `pathCabelo` emite naquele trecho. Não é uma curva paralela nem uma
 * reamostragem: é o mesmo pedaço da mesma curva, e é isso que dispensa um gate de
 * "a linha está sobre a massa?".
 *
 * Devolve `""` quando não há arcos — e aí o compositor não emite a forma, em vez de
 * gastar uma do orçamento com `d=""`, como já faz com a camada clara.
 */
export function pathCabeloLinhas(modelo: CabeloOuModelo): string {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.linhas?.length) return "";
  const pts = c.massa.map((p) => ponto(p, 0));
  const N = pts.length;
  return c.linhas
    .map((arco) => {
      const de = arco[0];
      return (
        `M ${n(pts[de].x)} ${n(pts[de].y)} ` + spline(pts, true, de, de + trechosDoArco(arco, N))
      );
    })
    .join("");
}

/**
 * OS ARCOS SÃO LEGÍVEIS? — e note o que esta régua NÃO precisa medir.
 *
 * Ela não pergunta se o traço corre sobre a massa: com arco de índice isso é
 * verdade por construção, e uma amarra que não pode falhar é a aprovação por
 * vacuidade que este projeto já pagou duas vezes. O que sobra são as duas coisas
 * que o produtor dos arcos ainda consegue errar:
 *
 *  1. **índice fora da massa** — o emissor leria `undefined` e o `d` sairia com
 *     `NaN`, que nenhum navegador acusa: o path simplesmente não aparece;
 *  2. **arcos sobrepostos** — o mesmo trecho traçado duas vezes. Invisível na tela
 *     (dois traços coincidentes são um traço) e por isso mesmo perigoso: é a
 *     assinatura de um produtor que não fechou as corridas direito, e paga bytes
 *     do orçamento para desenhar o que já estava desenhado.
 *
 * `fracao` é o número que a crítica lê: a parte do laço que sai traçada. **1,0 é a
 * barra preta falsa de volta**, escrita de outro jeito — mas ela não reprova aqui,
 * porque só é defeito quando a arte não tem preto em todo o perímetro, e a arte não
 * mora neste arquivo. Quem tem as duas do lado é `avatar:importar`.
 *
 * `null` quando não há laço nem arcos: peça paramétrica, ou traçada sem traço.
 */
export function arcosDeTraco(
  modelo: CabeloOuModelo,
): { fracao: number; falhas: string[] } | null {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.linhas?.length) return null;

  const N = c.massa.length;
  const falhas: string[] = [];
  const trechos = new Uint8Array(N);

  for (const arco of c.linhas) {
    const [de, ate] = arco;
    if (!Number.isInteger(de) || !Number.isInteger(ate) || de < 0 || de >= N || ate < 0 || ate >= N) {
      falhas.push(
        `arco [${de}, ${ate}] fora da massa, que tem ${N} pontos. O emissor leria ` +
          `\`undefined\` e o \`d\` sairia com NaN — e um path com NaN não desenha e não acusa.`,
      );
      continue;
    }
    const q = trechosDoArco(arco, N);
    for (let k = 0; k < q; k++) {
      const i = (de + k) % N;
      if (trechos[i]) {
        falhas.push(
          `o trecho ${i} do laço é traçado por mais de um arco. Dois traços coincidentes ` +
            `são indistinguíveis na tela, então o defeito só aparece no orçamento — e ele ` +
            `denuncia um produtor que não fechou as corridas.`,
        );
      }
      trechos[i] = 1;
    }
  }

  return { fracao: trechos.reduce((a: number, b) => a + b, 0) / N, falhas };
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
/**
 * Ray casting horizontal: um ponto está dentro do laço fechado `poli`?
 *
 * Nasceu local à `ancoragemDasExtensoes` e subiu quando a peça traçada passou a
 * precisar do mesmo contra a massa — copiá-lo criaria duas versões da mesma
 * pergunta, que é o defeito que este arquivo inteiro existe para não ter.
 */
export function dentroDe(poli: readonly Ponto[], p: Ponto): boolean {
  let bate = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i];
    const b = poli[j];
    if (a.y > p.y !== b.y > p.y) {
      const x = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (p.x < x) bate = !bate;
    }
  }
  return bate;
}

/**
 * Distância de um ponto a um laço fechado, medida segmento a segmento.
 *
 * **Exportada junto com `dentroDe`** porque a rota de arte precisa da mesma
 * distância com sinal ANTES de a peça virar `Cabelo` — o núcleo de ciano do Bloco
 * 13 é medido contra a massa ainda em unidades do `viewBox`, e uma segunda cópia
 * ali responderia à mesma pergunta com outra conta.
 */
export function ateAPoligonal(poli: readonly Ponto[], p: Ponto): number {
  let melhor = Infinity;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i];
    const b = poli[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    melhor = Math.min(melhor, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return melhor;
}

/**
 * O LAÇO DA CAMADA ESCURA, como polígono — o que as réguas medem.
 *
 * Peça traçada: é a massa. Peça paramétrica: é a franja mais os dois cantos do
 * retângulo de fechamento, que é literalmente o que `touca()` emite — repetir a
 * geometria aqui em vez de derivá-la dela seria a segunda descrição de sempre, e
 * por isso os três números saem das mesmas constantes.
 *
 * `null` para o modelo que não tem camada de touca nenhuma (o moicano, que é só
 * extensão). Quem chama trata o `null` pelo nome, em vez de receber um número que
 * aprova por vacuidade.
 */
function poligonoDaTouca(c: Cabelo): Ponto[] | null {
  if (c.massa) return c.massa.map((p) => ponto(p, 0));
  if (!c.pontos) return null;
  return [
    ...c.pontos.map((p) => ponto(p, 0)),
    { x: CAIXA_CABECA.x1 + FORA, y: CAIXA_CABECA.y0 - FORA },
    { x: CAIXA_CABECA.x0 - FORA, y: CAIXA_CABECA.y0 - FORA },
  ];
}

export function ancoragemDasExtensoes(modelo: CabeloOuModelo): number[] {
  const dentro = (p: Ponto) => dentroDe(CABECA.contorno, p);
  const ateOContorno = (p: Ponto) => ateAPoligonal(CABECA.contorno, p);

  return (resolverCabelo(modelo).extensoes ?? []).map((e) => {
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
 * **O número que ela devolve é julgado por régua diferente em cada família.**
 * Desenhada: `≥ FOLGA_ROSTO`, absoluto, e reprova — a franja é desenhada, então folga
 * curta é escolha de quem desenhou. Traçada: o piso é `folga da arte − meio traço`, e
 * quem o mede é o **gate 3 de `avatar:fidelidade`**, sobre as duas máscaras
 * rasterizadas — não sobre o número daqui. Esta função continua servindo a quem tem
 * peça e não tem PNG, e nas duas famílias ela é a régua da não-vacuidade.
 *
 * **Ela mede a franja (ou a massa) E as extensões da frente**, e a segunda metade
 * não é zelo: o
 * moicano deixou de ter franja, e uma régua que só olhasse `pontos` daria `Infinity`
 * para ele — aprovação por vacuidade, o defeito que este projeto já pagou duas
 * vezes. As de trás ficam de fora com motivo: peça atrás da cabeça é ocultada por
 * ela, e o que a cabeça oculta não invade rosto nenhum.
 */
export function folgaDoRosto(modelo: CabeloOuModelo): { esq: number; dir: number } {
  const m = resolverCabelo(modelo);
  const trechos: { x: number; y: number }[][] = [];
  if (m.pontos) trechos.push(m.pontos.map((p) => ponto(p, 0)));
  // A massa entra fechada, e o fechamento não é zelo: a cortina desce ao lado do
  // rosto pelo trecho de VOLTA do laço, e uma régua que parasse no último ponto
  // mediria justamente o lado que não chega perto da sobrancelha. Sem esta linha, a
  // peça traçada devolveria `Infinity` — aprovação por vacuidade, de novo.
  if (m.massa) {
    const pts = m.massa.map((p) => ponto(p, 0));
    trechos.push([...pts, pts[0]]);
  }
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

/**
 * A SOBRANCELHA ESTÁ COBERTA? — a pergunta que `folgaDoRosto` NÃO responde.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA PRECISA EXISTIR AO LADO DA OUTRA — o achado G5
 * ---------------------------------------------------------------------------
 *
 * `folgaDoRosto` devolve o `y` **mais baixo de qualquer trecho** da poligonal dentro
 * da faixa de `x` da sobrancelha. Numa franja paramétrica isso é exatamente a franja,
 * e o número quer dizer o que parece querer. Numa peça de **laço fechado** vinda de
 * arte, a **cortina lateral** atravessa a mesma coluna de `x` bem mais abaixo — ao
 * lado da bochecha, não sobre o olho — e é ela que o `Math.max` encontra.
 *
 * Medido na promoção de 2026-08-07, e é o par de números que nomeia o defeito:
 *
 * | peça | `folgaDoRosto` | sobrancelha coberta |
 * |---|---|---|
 * | `coque` | esq +53,4 · dir +43,6 | 0/21 · 0/21 |
 * | `moicano` | esq +55,2 · dir — | 0/21 · 0/21 |
 * | `espetado` | esq **+7,0** · dir **+3,7** | **0/21** · **0/21** |
 * | `chanel` | esq **−233,9** · dir **−238,2** | **0/21** · **0/21** |
 * | `assimetrico` | esq **−373,6** · dir +14,0 | **21/21** · 0/21 |
 *
 * ⚠️ **A última linha é o que a régua velha não sabia dizer, e ela vale a função
 * inteira.** `chanel` e `assimetrico` saem os dois com um negativo enorme, e são
 * casos OPOSTOS: no `chanel` é a cortina passando ao lado da bochecha, e a
 * sobrancelha está livre; no `assimetrico` a mecha longa cobre a sobrancelha
 * esquerda **inteira**. Isso não é defeito — é o que um corte assimétrico faz, e o
 * `ROSTO` protegido exclui a sobrancelha de propósito pelo mesmo motivo (`base.ts`:
 * proteger a sobrancelha reprovaria toda franja legítima). O ponto é que agora os
 * dois casos são **distinguíveis**, e antes não eram.
 *
 * **Nenhuma das duas invade o rosto**, e o −233,9 do `chanel` é a borda interna da
 * cortina do bob descendo ao lado da bochecha, a `y 392,9`. Quem lê a linha da
 * `avatar:folha-base` — *"folga do rosto esq −233.9"* — entende *"a arte enterra o
 * rosto"*, que é falso, e a leitura errada convida a "consertar" arte aprovada.
 *
 * **Esta função pergunta o que importa de verdade:** *há tinta SOBRE a sobrancelha?*
 * Ela amostra 21 pontos ao longo do arco de cada uma e conta quantos caem dentro de
 * alguma poligonal FECHADA da peça (`massa` e extensões da frente). `pontos` não
 * entra: a franja paramétrica é uma linha aberta, não um laço, e "dentro" não tem
 * sentido nela — para essa família a régua certa continua sendo `folgaDoRosto`.
 *
 * **`folgaDoRosto` fica intacta, e é decisão.** Doze lugares medem por ela e
 * `FOLGA_ROSTO` é a amarra 1 do paramétrico; trocar a semântica dela por esta seria
 * mexer numa régua viva para consertar um problema de LEITURA. As duas convivem, e é
 * a segunda que desfaz o mal-entendido da primeira.
 */
export function sobrancelhaCoberta(modelo: CabeloOuModelo): { esq: number; dir: number; de: number } {
  const m = resolverCabelo(modelo);
  const lacos: Ponto[][] = [];
  if (m.massa) lacos.push(m.massa.map((p) => ponto(p, 0)));
  for (const e of m.extensoes ?? []) if (!e.atras) lacos.push([...e.forma]);

  const AMOSTRAS = 21;
  const conta = (cx: number, cyOlho: number): number => {
    const cy = cyOlho - SOBRANCELHA.acimaDoOlho;
    let dentro = 0;
    for (let k = 0; k < AMOSTRAS; k++) {
      const t = k / (AMOSTRAS - 1);
      const x = cx - SOBRANCELHA.larg / 2 + SOBRANCELHA.larg * t;
      // O arco: a sagita sobe no meio, e a subida inclina a corda. Mesmo desenho de
      // `pathSobrancelha`, amostrado em vez de emitido.
      const y = cy - SOBRANCELHA.subida * (t - 0.5) - SOBRANCELHA.sagita * 4 * t * (1 - t);
      if (lacos.some((poli) => dentroDe(poli, { x, y }))) dentro++;
    }
    return dentro;
  };

  return {
    esq: conta(OLHO_CX_ESQ, OLHO_CY_ESQ),
    dir: conta(OLHO_CX_DIR, OLHO_CY_DIR),
    de: AMOSTRAS,
  };
}

/**
 * A ESPESSURA DA FAIXA DE SOMBRA, ponta a ponta — a amarra que o campo `sombra`
 * obriga a existir.
 *
 * Devolve `{ min, max }` da distância vertical entre a franja (borda de baixo da
 * camada escura) e a curva de sombra (borda de baixo da camada clara), em unidades.
 *
 * **`min` NEGATIVO é o defeito, e ele é invisível para todas as outras amarras.**
 * A camada clara é a única peça do cabelo desenhada **sem contorno** — o traço
 * mora na escura. Se a clara descer abaixo da escura em algum trecho, sobra tinta
 * clara fora da silhueta preta: um vazamento sem borda, que não invade rosto (a
 * `folgaDoRosto` continua verde, porque ela mede a franja), não estoura orçamento
 * e não muda a contagem de formas. Passaria inteiro.
 *
 * **`min` ZERO é legítimo, e é por isso que o piso é 0 e não `TRACO/2`.** Uma mecha
 * cuja sombra afina até sumir na ponta é exatamente o desenho que se está
 * procurando — foi a espessura *constante* que reprovou, não a espessura pequena.
 * Um piso de meio traço proibiria justamente o afinamento.
 *
 * `max` não é gate: é o número que a crítica lê para saber se a sombra chegou a
 * existir. Com `DEGRAU` sozinho, `min` e `max` são ambos 22 — e os dois iguais são
 * a assinatura numérica da faixa paralela que o Doug reprovou.
 *
 * A comparação é por faixa de `x` e não ponto a ponto: as duas curvas não têm o
 * mesmo número de pontos nem os mesmos `t`, e parear por índice compararia lugares
 * diferentes da testa. Mesma escolha, e mesmo motivo, do `maisBaixo` acima.
 *
 * **Ela é PARAMÉTRICA-ONLY, e o motivo é geométrico.** Perfil por faixa de `x`
 * pressupõe que cada curva tem um único `y` por coluna, e é exatamente isso que
 * deixa de valer num laço fechado com cortina. Quem mede o mesmo defeito na peça
 * traçada é `contencaoDaClara`, e ela mede melhor: distância com sinal ao laço
 * inteiro, em vez de diferença vertical coluna a coluna.
 */
export function sombraSobreAFranja(modelo: CabeloOuModelo): { min: number; max: number } {
  const m = resolverCabelo(modelo);
  if (!m.pontos) return { min: Infinity, max: Infinity }; // moicano: não há touca
  if (!m.sombra) return { min: DEGRAU, max: DEGRAU };

  const FAIXAS = 60;

  /** O `y` mais baixo de uma poligonal em cada faixa vertical da caixa da cabeça. */
  const perfil = (pts: readonly PontoFranja[]): number[] => {
    const out = new Array<number>(FAIXAS).fill(-Infinity);
    const xy = pts.map((p) => ponto(p, 0));
    const larg = CAIXA_CABECA.x1 - CAIXA_CABECA.x0;
    for (let i = 0; i < xy.length - 1; i++) {
      const a = xy[i];
      const b = xy[i + 1];
      for (let k = 0; k <= 20; k++) {
        const x = a.x + ((b.x - a.x) * k) / 20;
        const y = a.y + ((b.y - a.y) * k) / 20;
        const f = Math.floor(((x - CAIXA_CABECA.x0) / larg) * FAIXAS);
        if (f >= 0 && f < FAIXAS) out[f] = Math.max(out[f], y);
      }
    }
    return out;
  };

  const pf = perfil(m.pontos);
  const ps = perfil(m.sombra);

  let min = Infinity;
  let max = -Infinity;
  for (let f = 0; f < FAIXAS; f++) {
    if (pf[f] === -Infinity || ps[f] === -Infinity) continue;
    const d = pf[f] - ps[f];
    min = Math.min(min, d);
    max = Math.max(max, d);
  }
  return { min, max };
}

/**
 * A CLARA ESTÁ CONTIDA NA MASSA? — o vazamento sem contorno, virado número.
 *
 * Devolve a **menor distância COM SINAL** entre a borda da região clara e a borda
 * da massa: positiva onde a clara está dentro, negativa onde ela saiu. O gate é
 * `≥ 0`, e um zero é legítimo — a clara encostando na borda da massa é uma mecha
 * cuja luz vai até o traço, que é desenho, não defeito.
 *
 * **O defeito que ela pega é invisível para todas as outras réguas.** A camada
 * clara é a única peça do cabelo desenhada sem contorno: o traço mora na escura. Um
 * trecho de clara fora da massa é tinta clara sem borda sobre o fundo — não invade
 * rosto, não estoura orçamento, não muda a contagem de formas, não muda uma linha do
 * contrato de custom properties. Passaria inteiro, e só apareceria na folha.
 *
 * **Por que com sinal, e não "quantos pontos vazaram".** Contar pontos fora diz que
 * há defeito, e não diz quanto — e "quanto" é a diferença entre um ponto que passou
 * 0,3 unidade (ruído da decimação, projeta e segue) e um que passou 40 (a região
 * clara foi medida no lugar errado). O traçador usa este mesmo número para decidir
 * qual dos dois é o caso, e imprime o ajuste quando projeta.
 *
 * `Infinity` quando não há o que conter: peça paramétrica (quem mede é
 * `sombraSobreAFranja`) ou massa sem clara (cabelo chapado, e sem clara não há como
 * vazar). Os dois casos são nomeados, e nenhum deles é o `Infinity` por vacuidade
 * que este projeto já pagou duas vezes.
 */
export function contencaoDaClara(modelo: CabeloOuModelo): number {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.clara) return Infinity;
  // NA PEÇA TRANSCRITA O CONTINENTE É O NÚCLEO, E MEDIR CONTRA A MASSA APROVARIA
  // POR VACUIDADE.
  //
  // Com `nucleo`, a `massa` deixa de ser cabelo e passa a ser TINTA: quem pinta
  // ciano é o núcleo, e a banda preta é a diferença entre os dois. Uma clara que
  // saísse do núcleo mas coubesse dentro da massa estaria pintando tom claro **em
  // cima do contorno preto** — o vazamento sem borda que esta régua existe para
  // pegar — e a régua antiga diria que está tudo bem.
  return menorDistanciaAoLaco(continenteDaClara(c), c.clara.map((p) => ponto(p, 0)));
}

/** Contra quem a clara é medida: o núcleo quando há, a massa quando não há. */
function continenteDaClara(c: Cabelo): Ponto[][] {
  if (c.nucleo?.length) return c.nucleo.map((f) => f.map((p) => ponto(p, 0)));
  return [c.massa!.map((p) => ponto(p, 0))];
}

/**
 * A MENOR DISTÂNCIA COM SINAL de um laço a um continente de uma ou mais partes.
 *
 * Amostra 12 pontos por corda porque o defeito mora **na corda, não no vértice**:
 * `conter-a-clara.test.ts` mediu os 64 vértices da `curto-espetada` todos dentro,
 * e uma corda de 29 u passando 4,52 u por fora no meio do percurso.
 *
 * Com continente multi-parte, o ponto está dentro se estiver dentro de **alguma**
 * parte, e a distância é a da parte mais próxima — um núcleo partido em dois pelo
 * traço interno é um continente com dois pedaços, não dois continentes.
 */
function menorDistanciaAoLaco(continente: readonly (readonly Ponto[])[], laco: readonly Ponto[]): number {
  const pts = [...laco, laco[0]];
  let menor = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    for (let k = 0; k <= 12; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / 12, y: a.y + ((b.y - a.y) * k) / 12 };
      let melhor = -Infinity;
      for (const poli of continente) {
        const d = ateAPoligonal(poli, p);
        melhor = Math.max(melhor, dentroDe(poli, p) ? d : -d);
      }
      menor = Math.min(menor, melhor);
    }
  }
  return menor;
}

/**
 * O NÚCLEO ESTÁ DENTRO DA MASSA? — o vazamento que o desenho transcrito estreia.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ELA EXISTE PARA MATAR, e ele é NOVO
 * ---------------------------------------------------------------------------
 *
 * Enquanto o contorno era sintetizado, o stroke de 12 u **centrado** cobria ±6 u
 * de folga em volta do laço, e a tolerância de `escolherN` (meio traço, 6 u) era
 * paga por ele. Sem stroke, a massa e o núcleo são dois laços decimados
 * independentes: cada um pode desviar até 6 u da sua borda verdadeira, e sobre uma
 * banda de ~10 u os dois podem **cruzar**. Onde cruzam, o ciano do núcleo aparece
 * FORA do preto da massa — tinta de cabelo sem contorno, do lado de fora da peça.
 *
 * É o mesmo defeito de `contencaoDaClara` uma camada acima, e é invisível para
 * todas as outras réguas pelo mesmo motivo: não invade rosto, não estoura
 * orçamento, não muda contagem de formas nem o contrato de custom properties.
 *
 * **O gate é ≥ 0**, e zero é legítimo — o núcleo encostando na borda da massa é
 * uma banda que afina até nada num ponto, o que a decimação produz e o olho não vê.
 *
 * `Infinity` pelos casos NOMEADOS: peça paramétrica, ou peça traçada sem núcleo
 * (a que continua com o contorno sintetizado). Nenhum dos dois é vacuidade — sem
 * núcleo não há o que vazar.
 */
export function contencaoDoNucleo(modelo: CabeloOuModelo): number {
  const c = resolverCabelo(modelo);
  if (!c.massa || !c.nucleo?.length) return Infinity;
  const massa = [c.massa.map((p) => ponto(p, 0))];
  let menor = Infinity;
  for (const forma of c.nucleo) {
    menor = Math.min(menor, menorDistanciaAoLaco(massa, forma.map((p) => ponto(p, 0))));
  }
  return menor;
}

/**
 * Onde a coroa começa: o quarto de cima da caixa da cabeça.
 *
 * Não é escolha de gosto e não é a peça que a define — é a região do crânio que
 * **nenhum** dos modelos com touca deixa à mostra, nem o coque, que é o de franja
 * mais alta. Definir a coroa pela peça faria o gate se calibrar pelo desenho que ele
 * deveria julgar, que é o mesmo erro que o piso de distinção de 5% evitou quando foi
 * derivado de pixel em vez do par mais parecido.
 */
const COROA = 0.25;

/**
 * A MASSA COBRE A COROA? — a amarra que substitui "as pontas caem fora da silhueta".
 *
 * A régua antiga perguntava se o primeiro e o último ponto da franja tinham `t` fora
 * de [0, 1], e ela media a coisa certa enquanto a peça era uma curva aberta que
 * atravessava a cabeça: pontas dentro significavam cabelo que para no meio do crânio
 * e deixa um degrau de couro cabeludo aparecendo do lado.
 *
 * Num laço fechado a pergunta não faz sentido — o laço volta, então o "último ponto"
 * é vizinho do primeiro e os dois podem estar em qualquer lugar. O que continua
 * fazendo sentido é o **defeito** que ela pegava, e ele se pergunta direto: a coroa
 * do crânio está dentro da peça? Devolve a fração do arco superior do
 * `CABECA.contorno` contida na camada escura, e o gate é **1.0** — qualquer pedaço
 * de fora é couro cabeludo à mostra onde não devia haver.
 *
 * A fração é por comprimento de arco e não por ponto do contorno: os 42 pontos são
 * decimados por erro de corda, então eles são densos onde a curva vira e esparsos na
 * reta. Contar ponto pesaria a cúpula muito mais que a lateral, e é a lateral que a
 * cortina de um cabelo traçado cobre ou não.
 *
 * `null` para o modelo sem camada de touca — o moicano, que mostra couro cabeludo
 * dos dois lados de propósito. Ele é `null` e não zero porque zero seria uma
 * reprovação, e o que ele tem não é defeito: é a peça.
 */
/**
 * ACIMA DESTA FRAÇÃO COBERTA, A SOBRANCELHA NÃO É DESENHADA.
 *
 * **O limiar mora num vão vazio**, e isso é o que o torna honesto em vez de
 * arbitrário: medido no catálogo de hoje, toda peça dá **0%** de cobertura, e a
 * `entrada-2` dá **~96%**. Qualquer valor entre os dois se comporta igual — não há
 * peça na faixa do meio para o número decidir.
 *
 * A regra que moveria este valor, se um dia aparecer peça no vão: **o pedaço
 * visível tem de continuar lendo como sobrancelha.** Medido em close a 4× na
 * `entrada-2` antes do conserto, o resto de 4,4% lia como *rebarba no contorno do
 * cabelo* — quina reta de 3 px encostada no preto, sem afilar e sem pele em volta.
 * Sobrancelha meio coberta só funciona enquanto o resto guarda a assinatura da
 * forma: comprimento e afilamento **sobre pele**.
 */
const SOBRANCELHA_COBERTA = 0.85;

/**
 * QUANTO DA SOBRANCELHA ESTÁ SOB A MASSA DO CABELO, de cada lado, em fração.
 *
 * Existe porque cabelo que cai sobre a testa tem de **tapar** a sobrancelha, como
 * tapa na vida real — e tapar quase toda deixa um resto que lê pior que tapar
 * nenhuma. A oclusão de SVG resolve a parte de baixo (a peça sobreposta é emitida
 * depois das feições desde 2026-08-08); esta régua resolve o resto.
 *
 * **Só a `massa` conta.** O paramétrico vive dentro do clip do crânio e não alcança
 * a testa — devolver 0 para ele não é vacuidade, é o fato, e o teste de controle
 * cobra exatamente isso. As extensões também ficam de fora: a de trás é ocultada
 * pela cabeça, e nenhuma peça do catálogo tem extensão frontal sobre a testa.
 *
 * Amostra a faixa inteira da sobrancelha — 41 passos ao longo do comprimento × 5
 * através da espessura —, e não só a linha de centro: uma franja que corta a
 * sobrancelha ao meio na horizontal cobriria metade da área e nenhum ponto da
 * linha de centro.
 */
export function coberturaDaSobrancelha(modelo: CabeloOuModelo): { esq: number; dir: number } {
  const m = resolverCabelo(modelo);
  if (!m.massa) return { esq: 0, dir: 0 };
  const pts = m.massa.map((p) => ponto(p, 0));

  const AO_LONGO = 41;
  const ATRAVES = 5;

  const cobertura = (cx: number, cyOlho: number): number => {
    let dentro = 0;
    let total = 0;
    for (let i = 0; i < AO_LONGO; i++) {
      const u = i / (AO_LONGO - 1);
      const x = cx - SOBRANCELHA.larg / 2 + u * SOBRANCELHA.larg;
      // A reta das pontas sobe para a direita (`subida`), e o meio sobe mais
      // `sagita` acima dela — a mesma parábola que `pathSobrancelha` desenha.
      const yCentro =
        cyOlho -
        SOBRANCELHA.acimaDoOlho -
        (u - 0.5) * SOBRANCELHA.subida -
        SOBRANCELHA.sagita * 4 * u * (1 - u);
      for (let j = 0; j < ATRAVES; j++) {
        const v = j / (ATRAVES - 1);
        const y = yCentro + (v - 0.5) * SOBRANCELHA.espessura;
        total++;
        if (dentroDe(pts, { x, y })) dentro++;
      }
    }
    return total ? dentro / total : 0;
  };

  return {
    esq: cobertura(OLHO_CX_ESQ, OLHO_CY_ESQ),
    dir: cobertura(OLHO_CX_DIR, OLHO_CY_DIR),
  };
}

/** A sobrancelha some quando o cabelo a cobre — ver `SOBRANCELHA_COBERTA`. */
export function sobrancelhaEscondida(modelo: CabeloOuModelo | undefined): {
  esq: boolean;
  dir: boolean;
} {
  if (!modelo) return { esq: false, dir: false };
  const c = coberturaDaSobrancelha(modelo);
  return { esq: c.esq >= SOBRANCELHA_COBERTA, dir: c.dir >= SOBRANCELHA_COBERTA };
}

export function coberturaDaCoroa(modelo: CabeloOuModelo): number | null {
  const poli = poligonoDaTouca(resolverCabelo(modelo));
  if (!poli) return null;

  const limite = CAIXA_CABECA.y0 + COROA * CAIXA_CABECA.alt;
  const contorno = CABECA.contorno;

  let dentro = 0;
  let total = 0;
  for (let i = 0; i < contorno.length; i++) {
    const a = contorno[i];
    const b = contorno[(i + 1) % contorno.length];
    // Um passo a cada ~2 unidades: um sexto de traço, e o que sobra de erro de
    // amostragem é menor que a espessura da linha que se está medindo.
    const passos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
    for (let k = 0; k < passos; k++) {
      const p = {
        x: a.x + ((b.x - a.x) * k) / passos,
        y: a.y + ((b.y - a.y) * k) / passos,
      };
      if (p.y > limite) continue;
      total++;
      if (dentroDe(poli, p)) dentro++;
    }
  }
  return total ? dentro / total : 0;
}
