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
   * `png` é o caminho da imagem gerada pelo Doug — o interior, nunca a fronteira.
   * `cor` é o fallback chapado para quando ainda não há imagem, e é o que faz o
   * boneco nunca aparecer pelado (a lição do 5.9).
   */
  tinta: { png?: string; cor: string };
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
}
