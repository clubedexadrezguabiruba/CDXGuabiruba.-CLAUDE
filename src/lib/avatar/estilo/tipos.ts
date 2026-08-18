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
 * Repare que é a mesma forma de `Traje.extensoes` menos o `atras`, e não é
 * economia de digitação: as duas são o mesmo conceito. A peça **excede** a
 * silhueta em vez de compartilhar fronteira com ela, então tem forma própria — o
 * que é lícito exatamente porque ela não precisa registrar com nada. Uma lente
 * pode ser maior que o rosto (decisão do Doug, doc 21 §2c) e um chapéu pode
 * passar da cabeça; nenhum dos dois é cortado por clip nenhum.
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
    }
);

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
   * (`criar-personagem`, 5.10) e duas colunas separadas no banco (`users.avatar_hair`
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
   * As duas peças que ficam POR CIMA da cabeça — rosto (óculos, bigode, barba) e
   * chapéu.
   *
   * **Opcionais como `modeloCabelo`, e pelo mesmo motivo exato.** Ausentes,
   * `compor()` não emite camada nenhuma e o SVG sai byte a byte igual ao de
   * hoje — é isso que mantém o teto de regressão da `folha-base` sendo teto de
   * regressão e não de folga, e os 11 selos de `parametrico-congelado.ts` de pé.
   *
   * As duas ficam FORA de todo clip, que é o mecanismo já provado do cabelo
   * traçado. Fundo e pet **não estão aqui de propósito**: eles não tocam a
   * geometria do boneco e são componentes irmãos, fora do SVG (doc 21 §3.4).
   */
  rosto?: PecaSobreposta;
  chapeu?: PecaSobreposta;
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
