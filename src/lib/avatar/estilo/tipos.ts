/**
 * OS TIPOS DO ESTILO — e o mais importante deles é definido pelo que NÃO tem.
 *
 * A `interface Traje` abaixo não declara silhueta, nem contorno, nem `viewBox`,
 * nem âncora. Não é omissão: é **a trava estrutural** do doc 15, §3.
 *
 * O QUE ELA SUBSTITUI. No pipeline morto, cada peça carregava a própria forma —
 * o uniforme trazia um SVG traçado com 591 paths, e a base outro com 1224 — e o
 * `registro()` de `mascara-base.ts` existia para fazer as duas COINCIDIREM.
 * Coincidir era o pedido errado: as duas divergiam de 8 a 52 unidades (medido), e
 * divergência dessa ordem não se corrige com transformação afim. Os 2851 px de
 * costura sem dono são o que sobra dessa tentativa.
 *
 * COMO A TRAVA FUNCIONA. Não há gate. Um traje que tente declarar silhueta
 * **não compila**, porque TypeScript reprova propriedade em excesso em literal de
 * objeto. O erro aparece no `npm run typecheck` — que desde o Bloco 0 cobre
 * `scripts/**` também —, não numa rodada de QA. E `__tests__/trava-silhueta.test.ts`
 * mantém a trava viva pelo caminho contrário: se alguém ACRESCENTAR o campo, o
 * `@ts-expect-error` de lá deixa de ter erro para consumir e o typecheck quebra.
 *
 * ATÉ ONDE ELA ALCANÇA, dito honestamente (registrado em 2026-08-03). A checagem
 * de propriedade em excesso do TypeScript vale para **literal de objeto atribuído
 * direto**. Passar por uma variável intermediária, `as`, `any`, ou dado vindo de
 * JSON escapa dela. Hoje isso não abre buraco nenhum, porque todo traje nasce como
 * literal neste repositório e não há catálogo carregado de fora — mas se um dia
 * um traje vier de arquivo ou de banco, a trava deixa de ser estrutural para
 * aquele caminho, e ali é preciso validação de schema, não tipo. O que **não**
 * muda em nenhum cenário é o efeito real: mesmo que um campo de silhueta passasse,
 * o `compositor.ts` não o leria — ele só desenha o que vem de `geometria.ts`.
 *
 * Foi assim que a identidade deixou de ser comparada e virou estrutural: não há
 * segunda cópia da silhueta para divergir da primeira.
 */

import type { CabeloOuModelo } from "./cabelo";

/**
 * O que uma peça que ocupa a silhueta do tronco pode declarar.
 *
 * Repare no que está aqui: só TINTA e DECORAÇÃO. A peça diz de que cor é e o que
 * desenha por cima; nunca onde termina.
 */
export interface Traje {
  /** Slug do arquivo e chave do catálogo. */
  id: string;
  /** Nome que o aluno lê. */
  nome: string;
  /**
   * A tinta do interior, clipada no `pathTronco()`.
   *
   * `arte` é o caminho da imagem gerada pelo Doug — o interior, nunca a fronteira.
   * `cor` é o fallback chapado para quando ainda não há imagem, e é o que faz o
   * boneco nunca aparecer pelado (a lição do 5.9).
   *
   * **O campo se chamava `png` e passou a `arte` em 2026-08-17**, quando a peça
   * virou `.svg` (P1 do plano, doc 21). O nome velho descrevia o formato, e um
   * campo chamado `png` guardando um `.svg` é a espécie de mentira que este
   * arquivo inteiro existe para não deixar acontecer. O compositor nunca soube o
   * formato: ele emite `<image href>`, e o navegador é quem decide como desenhar.
   */
  tinta: { arte?: string; cor: string };
  /**
   * Escala que o AUTO-AJUSTE mediu para essa tinta cobrir o clip mais a sangria.
   * Nunca escrita à mão: é saída do pipeline (doc 15, §4), com teto de 1,15.
   * Ausente enquanto a peça for só cor chapada.
   */
  escalaMedida?: number;
  /**
   * Decoração fina POR CIMA da tinta: gola, cinto, galão, debrum. Vetor, porque
   * linha nítida não é a praia do gerador de imagem.
   *
   * São paths de conteúdo, não de contorno — eles pintam dentro da silhueta e
   * são cortados pelo mesmo clip. Uma gola não é o encontro de duas formas; é
   * tinta sobre tinta, com uma linha decorativa por cima, e a tinta pode errar
   * ±2 unidades que o traço de 10 cobre.
   */
  decoracao?: { d: string; fill?: string; stroke?: string }[];
  /**
   * Peças que EXCEDEM a silhueta: capa, ombreira, gola alta.
   *
   * Estas SIM têm forma própria — e é lícito, porque elas não compartilham
   * fronteira com o tronco, elas o cobrem. A exigência não é registro exato, é
   * **sobreposição ≥ `SANGRIA`**, que o gate (c) do Bloco 2 mede. O contorno
   * delas continua sendo do compositor: `d` é preenchimento, não traço.
   *
   * `atras: true` põe a forma sob o tronco (a parte traseira de uma capa).
   */
  extensoes?: { d: string; cor: string; atras?: boolean }[];
}

/**
 * O que uma peça que fica POR CIMA do boneco declara — chapéu e rosto.
 *
 * Repare que é quase a mesma forma de `Traje.extensoes`, e não é economia de
 * digitação: as duas são o mesmo conceito. A peça **excede** a
 * silhueta em vez de compartilhar fronteira com ela, então tem forma própria — o
 * que é lícito exatamente porque ela não precisa registrar com nada. Uma lente
 * pode ser maior que o rosto (decisão do Doug, doc 21 §2c) e um chapéu pode
 * passar da cabeça; nenhum dos dois é cortado por clip nenhum.
 *
 * **Ela continua sem `atras`, e ganhou outra coisa em 2026-08-19:** o slot `rosto`
 * passou a escolher de que lado do cabelo veste, por `cabeloPorCima` — e esse campo
 * NÃO mora aqui. Ver `PecaDeRosto` e `PecaDeChapeu`, logo abaixo: o par existe para
 * que um chapéu que tente escolher lado **não compile**.
 *
 * ---------------------------------------------------------------------------
 * SÃO DOIS MODOS, E A PERGUNTA QUE ESCOLHE ENTRE ELES É UMA SÓ: A PEÇA RECOLORE?
 * ---------------------------------------------------------------------------
 *
 * Desde 2026-08-17 esta peça é uma **união**, e não um formato só. A bifurcação é a
 * mesma que já parte a esteira de arte em duas, e é a Regra Inviolável nº 4 lida do
 * lado do código:
 *
 * | | `arte` | `formas` |
 * |---|---|---|
 * | a cor | **assada no desenho** | `var(--av-cabelo)`, em tempo de execução |
 * | o traço | **o da arte**, desenhado sobre a base | do compositor, `kk-traco`, 12 u |
 * | quem | chapéu, óculos, pet | **a barba, e só ela** |
 *
 * **Por que a arte pode trazer o próprio traço, e isso não é exceção.** A peça de
 * arte nasce desenhada POR CIMA de um render do próprio boneco, na escala dele — é
 * o que a rota de arte inteira existe para garantir, e o que o Gate −1 prova. A
 * caneta que desenhou a peça é a caneta do boneco. É o mesmo mecanismo que o traje
 * usa em produção desde 2026-08-17, e a colagem é literalmente a mesma função.
 *
 * **Por que quem recolore NÃO pode.** Um traço assado num `.svg` é preto fixo; uma
 * peça que muda de cor com o cabelo precisa que a borda seja emitida pelo
 * compositor, junto com o resto. Daí a barba ficar no modo `formas`.
 *
 * **A união é a trava.** Uma peça que declare os dois campos **não compila** — o
 * `never` do lado oposto de cada braço cobra isso do `typecheck`, que é a mesma
 * trava estrutural da `interface Traje` no topo deste arquivo, pelo mesmo motivo:
 * mecanismo em vez de disciplina.
 *
 * ---------------------------------------------------------------------------
 * NO MODO `formas`, O CONTORNO É DO COMPOSITOR
 * ---------------------------------------------------------------------------
 *
 * `d` é preenchimento, não traço — quem emite a borda preta é `sobrepor()`, na mesma
 * passada e com a mesma espessura de todo o resto. É o que impede uma peça
 * SINTETIZADA de chegar com traço de 1 px ao lado de um boneco de traço 12.
 *
 * **O que a peça escolhe é ONDE há contorno, nunca com que espessura** — é o que
 * `semTraco` diz, e ele não contradiz o parágrafo acima: é a versão booleana do
 * `FormaDaPeca.linhas` do cabelo (`cabelo.ts:128-141`), que existe pela razão
 * idêntica — *nem toda borda do laço é borda externa de alguma coisa*. Uma forma
 * que mora DENTRO de outra não tem borda externa para desenhar, e traçá-la põe
 * uma linha preta no meio da peça que ninguém desenhou.
 */

/**
 * O TOM CONTÍNUO DE UMA PEÇA QUE RECOLORE — o raster carrega o que o vetor não sabe.
 *
 * ---------------------------------------------------------------------------
 * O PROBLEMA: O POTRACE É BINÁRIO, E A BARBA SAÍA COM DUAS CORES
 * ---------------------------------------------------------------------------
 *
 * A esteira de arte converte raster em vetor pelo potrace, e o potrace decide por
 * limiar: todo tom intermediário arredonda para dentro ou para fora do laço. Uma
 * barba desenhada com 917 tons chegava ao boneco com **dois** — e a leitura de que
 * isso era exigência da D17 era falsa. A investigação de 2026-08-20 provou o
 * contrário: a **D17 proíbe cor ASSADA, não tom**. Quem escolhia duas cores era o
 * potrace, não a lei.
 *
 * A decisão: **o vetor carrega só o que precisa ser vetor, e o raster carrega o
 * tom.** A silhueta continua em `formas` — é ela que recolore, que ganha o traço do
 * compositor e que responde a `var(--av-cabelo)`. O claro-escuro vem por cima, como
 * uma máscara de LUMINOSIDADE: um PNG cinza em base64 dentro de um `<mask>`, que
 * modula a opacidade da tinta sem nunca dizer que cor ela é.
 *
 * **Por isso isto não fura a Regra Inviolável nº 4.** A máscara não tem cor: ela é
 * um canal de cinza. A cor continua vindo inteira de `var(--av-cabelo)`, que é a
 * escolha do aluno — o que a máscara faz é deixar parte dessa cor mais fraca onde a
 * arte era mais clara. Uma peça de cor ASSADA nunca usa este campo: ela é raster
 * inteiro, e o braço `arte` da união abaixo declara `tom?: never` justamente para
 * que o `typecheck` cobre isso.
 *
 * ---------------------------------------------------------------------------
 * O QUE O COMPOSITOR FAZ COM ISTO
 * ---------------------------------------------------------------------------
 *
 * `sobrepor()` emite um `<defs><mask id="{ns}-tom-{slot}" maskUnits="userSpaceOnUse"
 * x y width height><image href="data:image/png;base64,…" preserveAspectRatio="none"
 * /></mask></defs>` e veste com ele a **última** forma da peça — a de cima, a que
 * leva a tinta. Nunca o `kk-traco`: mascarar o contorno o comeria pelas beiradas.
 *
 * `maskUnits="userSpaceOnUse"` porque `x/y/w/h` são a caixa da tinta MEDIDA em
 * unidades do `viewBox`, não frações de bounding box; `preserveAspectRatio="none"`
 * porque o PNG foi recortado exatamente nessa caixa e esticá-lo para ela é a conta
 * certa, não um ajuste.
 *
 * ---------------------------------------------------------------------------
 * O PNG É ARQUIVO, NÃO `data:` — E ISSO SAIU DE UMA MEDIÇÃO, NÃO DE GOSTO
 * ---------------------------------------------------------------------------
 *
 * A primeira versão embutia o PNG em base64 dentro do próprio SVG. Funcionava, e
 * quebrava o ranking. Medido em 2026-08-21:
 *
 *   30 bonecos com `trancada-v4`, base64 embutido → **753,0 KB** de gzip
 *   30 bonecos com `trancada-v4`, arquivo externo →    17,6 KB
 *
 * **A causa é a janela do DEFLATE.** O gzip casa repetição dentro de 32.768 bytes;
 * se o boneco composto cabe nela, a cópia seguinte referencia o blob anterior em
 * poucos bytes. O boneco com a `trancada` mede 49.101 B — não cabe, e cada cópia
 * paga o blob inteiro. (O boneco com a `barba-cheia` mede 31.857 B: passava do lado
 * bom por **911 bytes**, o que é margem nenhuma.)
 *
 * E há o segundo custo, que compressão nenhuma alcança: `AvatarKokeshi.tsx` importa
 * `catalogo`, então **todo blob embutido viaja no bundle do cliente**. Como arquivo,
 * a peça leva 38 bytes de caminho em vez de 22.032 de base64.
 *
 * **Isto não é mecanismo novo — é o mecanismo do TRAJE.** `Traje.tinta.arte` já é um
 * caminho servido à parte (`/items/traje/traje-farda.svg`), colado pelo mesmo
 * `<image>`, com o mesmo gate de deploy. A barba passou a usar o corredor que já
 * existia, e é por isso que a troca custou pouco.
 *
 * ⚠️ **O preço, declarado:** uma requisição a mais por peça (cacheada — os 30
 * bonecos de uma lista apontam para a MESMA url) e o avatar aparecendo em dois
 * tempos, silhueta primeiro e tom quando o PNG chega. É exatamente o que o traje já
 * faz desde 2026-08-17.
 */
export interface TomDaPeca {
  /**
   * O `.png` cinza da máscara — o caminho que o BROWSER pede.
   *
   * Mesma forma e mesma exigência de `Traje.tinta.arte` e de `PecaSobreposta.arte`:
   * começa em `/items/`, mora em `public/`, e **precisa ser rastreado pelo git** ou
   * não chega ao ar. `arteDaPecaNoDeploy.test.ts` cobra as três coisas.
   */
  arte: string;
  /** Borda esquerda da caixa da tinta, em unidades do `viewBox`. */
  x: number;
  /** Borda superior da caixa da tinta, em unidades do `viewBox`. */
  y: number;
  /** Largura da caixa da tinta, em unidades do `viewBox`. */
  w: number;
  /** Altura da caixa da tinta, em unidades do `viewBox`. */
  h: number;
}

export type PecaSobreposta = {
  /** Slug do catálogo — a mesma chave que o banco guarda em `avatar_catalogo`. */
  id: string;
  /** Nome que o aluno lê. */
  nome: string;
} & (
  | {
      /**
       * As formas, de trás para a frente. Preenchimento; o traço é do compositor.
       *
       * `semTraco` tira ESTA forma da passada de contorno, e só dela. Ver o
       * parágrafo sobre ele no docstring do tipo: é para a forma que vive dentro de
       * outra — o núcleo cuja borda é a banda preta da forma de baixo, não uma borda
       * externa. Ausente e `false` são o mesmo, e o mesmo de sempre.
       */
      formas: { d: string; cor: string; semTraco?: boolean }[];
      /**
       * O claro-escuro da peça, por máscara de luminosidade. Ver `TomDaPeca`.
       *
       * Ele veste a **ÚLTIMA** forma — a de cima, a da tinta. Ausente é o modo de
       * sempre, e o SVG sai byte a byte igual ao de antes deste campo existir.
       */
      tom?: TomDaPeca;
      arte?: never;
    }
  | {
      /**
       * O `.svg` da peça, colado por `<image>` — o caminho que o BROWSER pede.
       *
       * É o mesmo campo, o mesmo formato e a mesma colagem de `Traje.tinta.arte`:
       * `colarArte()` no compositor serve os dois, porque duas descrições da mesma
       * conta é o defeito que este arquivo inteiro existe para não deixar acontecer.
       *
       * A peça ocupa o `viewBox` inteiro com `k = 1`, que é exatamente o retângulo em
       * que ela foi recortada (600 × 840, 5:7). A colagem é conta, não ajuste.
       *
       * ⚠️ **Ele precisa viajar até o deploy.** `arteDaPecaNoDeploy.test.ts` cobra
       * `git ls-files`: arquivo em `public/dev/` não chega ao ar, e o compositor
       * decide pelo campo declarado e não pelo arquivo existindo — a peça sumiria
       * em silêncio, que é o defeito que aquele teste fecha.
       */
      arte: string;
      formas?: never;
      /**
       * ⚠️ Peça de cor ASSADA não tem tom a declarar — ela É o raster inteiro.
       *
       * O `never` é a trava estrutural de sempre: `arte` + `tom` **não compila**, e
       * o `typecheck` cobra isso sem depender de teste nenhum.
       */
      tom?: never;
    }
);

/**
 * DE QUE LADO DO CABELO A PEÇA VESTE — e por que são DOIS tipos e não um campo.
 *
 * ---------------------------------------------------------------------------
 * O SLOT `rosto` GUARDA DUAS FAMÍLIAS COM NECESSIDADES OPOSTAS
 * ---------------------------------------------------------------------------
 *
 *  - **barba** — o cabelo cai POR CIMA dela, como na vida. Pedido do Doug em
 *    2026-08-19, depois de a folha de contato da `rosto-barba-cheia` mostrar o
 *    avesso: a serrilha da barba cortava a curva lisa do `chanel`;
 *  - **óculos** — por cima do cabelo, e isso é decisão dele também (doc 21 §2c):
 *    sem haste não há o que apoiar, a lente é livre para exceder o rosto, e a peça
 *    que a criança desbloqueou não pode depender de qual franja está por baixo.
 *
 * **Isto não reabre a D17** (`docs/achados.md`). A fusão entre barba e cabelo
 * continua aceita; o que `cabeloPorCima` escolhe é **quem vence a sobreposição**,
 * não se ela existe.
 *
 * ---------------------------------------------------------------------------
 * O `never` DO CHAPÉU É A TRAVA, E ELA É ESTRUTURAL COMO A UNIÃO ACIMA
 * ---------------------------------------------------------------------------
 *
 * O chapéu é SEMPRE o último — ele disputa o crânio e vence, que é o que "esconde
 * o cabelo" quer dizer. Ele não tem lado a escolher, e a regra fina dele é outra,
 * com nome próprio (`escondeCabelo`, logo abaixo em `PecaDeChapeu`).
 *
 * Se o campo morasse em `PecaSobreposta`, um chapéu **poderia** declará-lo, e a
 * única defesa seria um teste — sobre um catálogo (`CHAPEUS`) que hoje está vazio,
 * ou seja, um teste vácuo. Com `cabeloPorCima?: never` o `typecheck` fecha os dois
 * sentidos, e nenhum deles depende de haver peça:
 *
 *  - literal de chapéu com o campo → excesso de propriedade, **e** `boolean` não
 *    atribuível a `never | undefined`;
 *  - um valor já tipado `PecaDeRosto` entregue ao slot chapéu → também reprova,
 *    porque `?: boolean` não é atribuível a `?: never`. É por isso que o `never`
 *    vale mais que só separar os dois nomes.
 *
 * É a mesma trava da união `formas` | `arte` logo acima, e da `interface Traje` no
 * topo deste arquivo, pelo mesmo motivo de sempre: **mecanismo em vez de
 * disciplina.** `pecas-de-elenco.test.ts` mantém a trava viva pelo caminho
 * contrário, com um `@ts-expect-error` que deixa de ter erro para consumir se
 * alguém tirar o `never` daqui.
 */
export type PecaDeRosto = PecaSobreposta & {
  /**
   * DESENHA ANTES DO CABELO — o cabelo cobre a peça onde os dois se encontram.
   *
   * O nome descreve o MECANISMO, que é oclusão: o cabelo pinta depois e tapa. Não
   * descreve a posição, e isso é deliberado — `sobOCabelo` foi considerado e
   * recusado por estar a uma letra de `sobreOCabelo`, que significa o oposto exato
   * do que este campo faz. Um par mínimo invertido bem no campo que existe para
   * codificar essa distinção é a pior escolha possível de nome.
   *
   * `atras` também foi recusado: ele já quer dizer *sob o tronco* (`Traje.extensoes`)
   * e *atrás da cabeça* (`Extensao` em `cabelo.ts`), e um terceiro sentido faz a
   * palavra não significar nada.
   *
   * **QUEM DECLARA, E É DIRETRIZ, NÃO GOSTO.** A pergunta é *a peça nasce da cabeça,
   * ou é posta nela?* — pelo (barba, bigode, costeleta) nasce e veste por baixo;
   * acessório (óculos) é posto e vai por cima. A regra inteira, com o custo medido,
   * está no docstring de `LadoDoRosto` em `camadas.ts`, que é a tabela autoritativa
   * da pilha. Decidida pelo Doug em 2026-08-20, depois de a ordem ter virado quatro
   * vezes em dois dias por ser julgada no zoom de uma junção.
   *
   * ⚠️ **Só alcança o cabelo TRAÇADO.** O paramétrico mora dentro do clip do crânio
   * e é emitido muito antes das feições, então a peça de rosto continua por cima
   * dele com bandeira ou sem. Não é defeito hoje — nenhum paramétrico desce ao
   * queixo —, mas é limitação, não garantia. A causa está em `compor()`.
   *
   * Ausente e `false` são o mesmo, e o mesmo de sempre: a peça sai depois do cabelo.
   */
  cabeloPorCima?: boolean;
};

/**
 * O ÓCULOS — slot próprio desde 2026-08-27, e a separação é do Doug.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE SAIU DO SLOT `rosto`
 * ---------------------------------------------------------------------------
 *
 * As duas famílias moravam juntas no slot `rosto`, e o doc 22 §5-B chamava isso de
 * "duas famílias no mesmo slot". Elas cabiam ali por serem as duas peças de cara —
 * mas **slot é exclusivo por construção**: `users` guarda UMA coluna por slot e
 * `equipar_peca` escreve UM slug nela. Enquanto barba e óculos dividissem o slot,
 * vestir um tirava o outro.
 *
 * O Doug, em 2026-08-27: *"óculos e barba não podem ser a mesma coisa. Eu preciso que
 * dê para vestir a barba e o óculos, ao mesmo tempo."* Ele está descrevendo o mundo:
 * óculos e barba convivem numa cara, e nada no desenho os opõe.
 *
 * **A alternativa foi considerada e é pior:** deixar o slot `rosto` guardar DUAS
 * peças. Isso fura o modelo em todo lugar de uma vez — a coluna vira array, o
 * `equipar_peca` vira dois caminhos, o guarda-roupa perde a chave, e as views de
 * perfil passam a devolver lista onde devolviam valor. Um quinto slot custa uma
 * coluna e uma linha em cada enumeração; duas peças num slot custam o modelo.
 *
 * ---------------------------------------------------------------------------
 * `cabeloPorCima?: never` — A MESMA TRAVA DO CHAPÉU, PELO MESMO MOTIVO
 * ---------------------------------------------------------------------------
 *
 * O óculos é SEMPRE por cima do cabelo, e isso já era decisão do Doug antes do slot
 * existir (doc 21 §2c): sem haste não há o que apoiar, a lente é livre para exceder o
 * rosto, e a peça que a criança desbloqueou não pode depender de qual franja está por
 * baixo. Ele não tem lado a escolher — então não pode declarar a bandeira.
 *
 * O `never` fecha os dois sentidos sem depender de teste: um literal de óculos com o
 * campo não compila, e um valor já tipado `PecaDeRosto` entregue ao slot óculos
 * também não, porque `?: boolean` não é atribuível a `?: never`. É mecanismo em vez
 * de disciplina, como a união `formas | arte` acima.
 */
export type PecaDeOculos = PecaSobreposta & {
  cabeloPorCima?: never;
};

/** O chapéu é sempre o último, e o `never` é o que impede que ele escolha. */
export type PecaDeChapeu = PecaSobreposta & {
  cabeloPorCima?: never;

  /**
   * `escondeCabelo` — O QUE ESTE CHAPÉU CONTÉM, e é uma LINHA MEDIDA, não um enum.
   *
   * ---------------------------------------------------------------------------
   * POR QUE NÃO É `"nada" | "franja" | "tudo"`
   * ---------------------------------------------------------------------------
   *
   * O doc 23 §8 abriu a decisão com três palavras e `camadas.ts` já tinha derrubado
   * uma delas: `"franja"` não se implementa por sub-caminho, porque nem a franja
   * paramétrica nem a massa traçada declaram um separável. Sobravam os extremos, e
   * os dois são ruins:
   *
   *  - **`"nada"`** é o comportamento de hoje, e ele QUEBRA. Medido nos 9 chapéus
   *    contra os 19 cabelos: o `moicano` deixa 29,2% da própria massa visível acima
   *    da linha da `touca-de-la`, e o `coque-individual` atravessa a `cartola` com
   *    0,2% da massa subindo 238 u — pouco pixel, defeito enorme. Cabelo saindo por
   *    cima da copa lê como cabelo NASCENDO ATRAVÉS do chapéu;
   *  - **`"tudo"`** apaga o cabelo inteiro, e com ele **uma das duas cores que o
   *    aluno escolhe**. Colide com a Regra Inviolável nº 4 na prática, e o próprio
   *    doc 23 §8 marca a colisão.
   *
   * A saída não é escolher entre os dois: é notar que os dois são casos degenerados
   * da MESMA coisa — uma linha. `"nada"` é a linha no infinito, `"tudo"` é a linha
   * no queixo, e toca, cartola e boina são linhas diferentes entre as duas. Um enum
   * de três palavras não consegue dizer que a touca corta baixo e a cartola corta
   * alto; uma linha consegue, e sem inventar vocabulário.
   *
   * ---------------------------------------------------------------------------
   * O VALOR É DERIVADO DA PRÓPRIA ARTE — NINGUÉM ESCOLHE ESTE NÚMERO
   * ---------------------------------------------------------------------------
   *
   * É o `d` da região que o chapéu contém: **acima dela o cabelo não sai, abaixo
   * dela ele sai inteiro** — que é a franja, o costeleta e o rabo, e é por isso que
   * a cor do aluno continua na tela em todo chapéu do elenco.
   *
   * `oclusao-do-chapeu.ts` a extrai do alfa do mesmo `.svg` que a peça já publica,
   * pela pergunta *"dá para chegar aqui vindo de baixo sem atravessar o chapéu?"*.
   * Não há decisão de arte nova, não há campo para o Doug preencher e não há como a
   * linha divergir do desenho: mudou a arte, mudou a linha, na mesma esteira.
   *
   * ⚠️ **Ausente ≡ o comportamento histórico, byte a byte.** Sem o campo o
   * compositor não emite `clipPath` nenhum e o chapéu segue pintado por cima do
   * cabelo inteiro — é a 4ª condição que `camadas.ts` cobra de toda válvula nova.
   *
   * ⚠️ **Isto é SUPRESSÃO, não ordenação.** Ele não move ninguém na pilha: pluga
   * nas quatro linhas de `dono: "cabelo"` apagando o que cai dentro da região. A
   * tabela de `camadas.ts` continua sendo a autoridade sobre *ordem*.
   */
  escondeCabelo?: string;
  /**
   * `abaSobreOculos` — ESTE chapéu tem aba que desce sobre os olhos, e ela ganha do óculos.
   *
   * ---------------------------------------------------------------------------
   * POR QUE ELE EXISTE, E POR QUE É DO CHAPÉU E NÃO DO ÓCULOS
   * ---------------------------------------------------------------------------
   *
   * Até 2026-08-28 o óculos vinha ANTES do chapéu na pilha, com o argumento de que
   * *"aba de chapéu por cima de óculos é o que aba faz"*. O Doug olhou os 45 pares
   * renderizados e reprovou: na maioria dos chapéus a aba que cruza o óculos é a de
   * TRÁS — a que contorna o crânio pelo outro lado —, e aba de trás por cima da
   * armação é impossível. Medido antes da troca: 8,29% da pegada do óculos comida à
   * esquerda e 9,23% à direita, somados os 45 pares.
   *
   * O óculos subiu, e **um** chapéu reprovou a subida: o `bone`. A pala dele projeta
   * para a FRENTE, abaixo da linha da testa, e ali a aba está mesmo na frente do
   * rosto. *"O boné, por ter uma aba que desce abaixo da testa. O óculos por cima
   * dessa aba não faz sentido."*
   *
   * O campo é do CHAPÉU porque o fato é do chapéu: pala para a frente é propriedade
   * do desenho da peça, e não muda com qual óculos o aluno escolheu. Um campo no
   * óculos seria 5 declarações para descrever 1 fato de 9.
   *
   * ---------------------------------------------------------------------------
   * ELE É ORDENAÇÃO, E POR ISSO MORA NA TABELA
   * ---------------------------------------------------------------------------
   *
   * Ao contrário de `escondeCabelo`, que é SUPRESSÃO e não move ninguém, este campo
   * escolhe entre DUAS linhas de `camadas.ts` — `oculos-sob-chapeu` e
   * `oculos-sobre-chapeu` —, exatamente como `cabeloPorCima` parte o slot `rosto`.
   * A tabela continua sendo a autoridade sobre ordem; o campo só diz por qual das
   * duas portas esta peça manda o óculos passar.
   *
   * ⚠️ **Ausente ≡ o óculos POR CIMA**, que é o caso de 8 dos 9. O `never` do
   * `cabeloPorCima` logo acima continua valendo: este campo não é aquele, e um
   * chapéu não escolhe lado do rosto.
   */
  abaSobreOculos?: boolean;
};

/**
 * O estado do boneco no momento de compor. Tudo que NÃO é forma.
 *
 * `pele` e `cabelo` são hex porque recolorem por `var()` — são os dois únicos
 * eixos de escolha do aluno (emenda à D27). Todo o resto do elenco tem cor
 * assada no desenho.
 */
export interface EstadoAvatar {
  pele: string;
  cabelo: string;
  /**
   * QUAL dos 5 cabelos, contra o `cabelo` acima, que é a COR de um.
   *
   * São dois campos e não um objeto porque são duas escolhas separadas na tela
   * (`criar-personagem`, 5.10) e duas colunas separadas no banco (`users.avatar_cabelo`
   * e `avatar_hair_color`, Bloco 4). Um objeto aqui teria de ser desmontado nas duas
   * pontas.
   *
   * **Opcional, e o opcional é a base careca.** Sem modelo, `compor()` não emite
   * nem a camada, nem as duas regras de CSS, nem `--av-cabelo`/`--av-cabelo-s` — o
   * SVG sai byte a byte igual ao que o Bloco 1d aprovou, e é isso que mantém o teto
   * da base em 7 418 sendo teto de regressão e não de folga. `rosto-cor.test.ts`
   * confere justamente essa ausência.
   */
  modeloCabelo?: CabeloOuModelo;
  traje?: Traje;
  /**
   * As TRÊS peças que ficam POR CIMA da cabeça — rosto (barba, bigode), óculos e
   * chapéu.
   *
   * **Opcionais como `modeloCabelo`, e pelo mesmo motivo exato.** Ausentes,
   * `compor()` não emite camada nenhuma e o SVG sai byte a byte igual ao de
   * hoje — é isso que mantém o teto de regressão da `folha-base` sendo teto de
   * regressão e não de folga, e os 11 selos de `parametrico-congelado.ts` de pé.
   *
   * As três ficam FORA de todo clip, que é o mecanismo já provado do cabelo
   * traçado. Fundo e pet **não estão aqui de propósito**: eles não tocam a
   * geometria do boneco e são componentes irmãos, fora do SVG (doc 21 §3.4).
   *
   * ⚠️ **`oculos` era `rosto` até 2026-08-27, e o Doug separou os dois:** *"óculos e
   * barba não podem ser a mesma coisa. Eu preciso que dê para vestir a barba e o
   * óculos, ao mesmo tempo."* Slot é exclusivo por construção — uma coluna em
   * `users`, um valor —, então enquanto as duas famílias dividiam o slot `rosto` uma
   * excluía a outra. Ver `PecaDeOculos`.
   */
  rosto?: PecaDeRosto;
  oculos?: PecaDeOculos;
  chapeu?: PecaDeChapeu;
  /**
   * QUANTO O CHAPÉU ACHATA O CABELO — escala em x, em volta do eixo da cabeça.
   *
   * `escondeCabelo` resolve o cabelo que atravessa a peça e o que estoura pela
   * lateral acima dela. O que sobra é de largura: **os 19 penteados vão de 105% a
   * 133% da cabeça, e os chapéus mais estreitos não têm folga para eles**. Abaixo
   * da aba não há o que esconder — o chapéu acabou —, e esconder ali cortaria a
   * silhueta contra o fundo. Estreitar não corta: a mecha continua inteira e passa
   * a caber sob a peça, que é o que um boné faz com o cabelo de verdade.
   *
   * **Só vale com chapéu**, e `1` (ou ausente) é o SVG de sempre, byte a byte.
   */
  apertoDoCabelo?: number;
  /**
   * Liga o piscar e o respiro. Desligado no ranking, onde 30 bonecos numa lista
   * pagariam 30 animações por nada — a `flag` já existe no render por isso
   * (doc 15, §6, regra 2).
   */
  animado?: boolean;
  /**
   * Prefixo de todo `id` que o SVG emitir, e **obrigatório de propósito**.
   *
   * Existe porque compor o avatar é concatenar camadas num `<svg>` só (D22), e
   * dois `clipPath` chamados `tronco` numa mesma página fazem o segundo vencer
   * em silêncio — o modo de falha do §8 item 4.
   *
   * Ele já teve valor padrão (`"kk"`), e o padrão criou exatamente a colisão que
   * ele existia para impedir: a `folha-base.ts` compõe NOVE renders no mesmo
   * documento (4 tamanhos + 5 closes) e todos herdavam o mesmo prefixo. Ninguém
   * viu, porque as nove geometrias eram idênticas — a colisão resolvia para o
   * primeiro clip e nada mudava na tela.
   *
   * Sem padrão, o `typecheck` cobra de quem compõe: de onde vem a unicidade? É a
   * mesma trava estrutural da `interface Traje` acima, pelo mesmo motivo —
   * mecanismo em vez de disciplina. Ela não basta sozinha (nada impede passar a
   * mesma string duas vezes), e por isso `npm run avatar:pose` mede unicidade de
   * `id` no DOM com as instâncias renderizadas juntas.
   */
  ns: string;
  /**
   * ENCOLHE A FIGURA INTEIRA DENTRO DO MESMO `viewBox`, para caber peça alta.
   *
   * O `viewBox` deixa só 39 unidades acima da cabeça (doc 14, T1.5), e um cabelo
   * espetado medido sobe 85 u acima da coroa: o viewport corta sem erro e sem
   * aviso. Comprimir a peça foi descartado por direção de arte — `k = 0,440`
   * tirava metade do espeto. Encolher a figura resolve sem tocar na peça.
   *
   * **É transformação EXTERNA, e essa é a parte que importa.** O sistema de
   * coordenadas interno — o `viewBox` de 500×700 e todas as constantes de
   * `geometria.ts` — fica intacto, então as peças continuam em `{t,y}` sem
   * reconversão e a arte já gerada sobre a base de edição continua válida. São
   * dois conceitos que moram no mesmo `compor()`: a **base de edição** (o que vai
   * ao gerador, escala interna congelada, este campo AUSENTE) e a **base de
   * render** (o que o produto desenha, com o campo presente).
   *
   * **Opcional, e o padrão é 1** — ausente, nenhum `<g transform>` é emitido e a
   * string sai idêntica. Mesmo motivo do campo acima.
   */
  escala?: number;
  /**
   * TIRA O `<style>` DE DENTRO DO SVG — o modo do produto (doc 15, 5.7).
   *
   * Trinta avatares num ranking emitem hoje 30 blocos `<style>` idênticos, ~1 KB
   * cada. Com este campo ligado, o SVG sai sem bloco nenhum e passa a depender da
   * folha única que `folhaAvatar()` produz e `<AvatarKokeshi>` emite uma vez por
   * página. Cada `<svg>` continua carregando as custom properties, que são a parte
   * que muda de aluno para aluno.
   *
   * **Opcional, e o ausente é o SVG de sempre** — byte a byte. É essa ausência que
   * mantém os 11 selos de `parametrico-congelado.ts`, o teto de regressão da base
   * careca e os gates de arte medindo a mesma string que sempre mediram. Ligado, o
   * SVG muda de bytes **por construção**, e não há selo que faça sentido cobrar
   * disso: quem responde pela aparência aqui é o congelado do modo embutido e o
   * `npm run avatar:pose`.
   *
   * ⚠️ **Ligado sem a folha na página, o boneco sai preto.** As regras deixam de
   * existir, os `fill` caem para o valor inicial, e nada acusa — é o modo de falha
   * nº 2 de `svgContrato.ts`, uma camada acima. Por isso quem liga não é o
   * chamador solto: é o componente, que emite a folha na mesma respiração.
   */
  folhaExterna?: boolean;
}
