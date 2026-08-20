/**
 * A PILHA DE CAMADAS DO AVATAR — uma tabela só, e ela não emite nada.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------------------------------------------------------
 *
 * Em dois dias a ordem entre **barba e cabelo** virou três vezes (19/08 duas, 20/08
 * duas), sempre decidida olhando um zoom de uma junção. A causa não é indecisão: é
 * que **não existia uma tabela de ordem autoritativa**. Existiam duas, e elas
 * discordavam.
 *
 *  - `docs/avatar/12-avatar-v4-plano-completo.md` §2.3 — dez níveis z que descrevem
 *    um sistema que não existe mais: sem linha para `rosto`, com `hand` e
 *    `background` que já morreram, e com modos de render que nunca foram
 *    implementados;
 *  - o docstring de `compositor.ts` — treze itens em prosa. Era a mais próxima da
 *    verdade e mesmo assim **omitia três camadas emitidas** (a arte do traje e as
 *    duas passadas de extensão de cabelo).
 *
 * Sem tabela, cada par foi decidido no olho, e **nenhuma régua reprovou** — porque
 * não havia gate de ordem entre a maioria dos pares. A varredura que precedeu este
 * arquivo achou um defeito de ordem que ninguém tinha visto: o chapéu é emitido e
 * **depois** dele as extensões frontais do traje, contradizendo o comentário
 * "CHAPÉU POR ÚLTIMO" três linhas acima. Ver `emDisputa` na última linha.
 *
 * ---------------------------------------------------------------------------
 * O MÉTODO: DECLARAR + GATEAR, NÃO EMITIR POR DADOS
 * ---------------------------------------------------------------------------
 *
 * A tabela é **dado**; `compor()` continua emitindo como sempre emitiu, e
 * `__tests__/pilha-de-camadas.test.ts` prova que a emissão bate com a tabela.
 *
 * A razão é de sequência, e é dura: **os onze selos de `parametrico-congelado.ts`
 * são cegos exatamente onde o bug mora.** Todos compõem com `rosto: undefined`,
 * `chapeu: undefined`, `traje: undefined`. Um refactor pode ficar 100% verde nos
 * selos e no teto de 19 formas / 7 468 bytes da base careca **enquanto embaralha
 * rosto × chapéu × traje**. Reescrever a emissão antes de existir o gate é cirurgia
 * na única região sem cobertura. Com o gate de pé, emitir por dados vira um
 * refactor mecânico e totalmente gateado — se ainda parecer valer.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTA TABELA NÃO É
 * ---------------------------------------------------------------------------
 *
 * Ela **não julga se a ordem declarada está certa.** As três inversões da barba
 * teriam dado três verdes com três tabelas diferentes. O que ela torna impossível é
 * a tabela e o código discordarem em silêncio, e é isso que mata a deriva e a
 * pergunta "qual das duas listas é a verdadeira".
 *
 * Ela também **não é contrato de oclusão**: ordem de string é ordem de pintura, e
 * quem pinta depois cobre — mas *quanto* cobre é geometria, e geometria se mede em
 * render, não aqui.
 */

/** Quem responde pela camada — e é quem decide se ela pode mudar de lugar. */
export type DonoDeCamada = "sistema" | "traje" | "cabelo" | "rosto" | "chapeu";

/**
 * EM QUE FAMÍLIA DE CABELO A LINHA EXISTE.
 *
 * As duas famílias são **exclusivas por modelo** (`cabelo.ts`: um cabelo tem
 * `pontos` OU `massa`), e `compor()` propaga essa exclusividade para a pilha: a
 * linha `cabelo-parametrico` e a linha `cabelo-tracado` nunca são emitidas juntas.
 * É isso que este campo declara — não uma preferência, uma impossibilidade.
 */
export type FamiliaDeCabelo = "parametrico" | "tracado" | "qualquer";

/**
 * DE QUE LADO DO CABELO A PEÇA DE ROSTO VESTE — e a pergunta que decide é UMA.
 *
 * ---------------------------------------------------------------------------
 * A DIRETRIZ DO EMPILHAMENTO: **a peça NASCE da cabeça, ou é POSTA nela?**
 * ---------------------------------------------------------------------------
 *
 *  - **nasce → `sob`.** É PELO: barba, bigode, costeleta. Ele cresce no rosto e o
 *    cabelo cai por cima dele, como na vida. `cabeloPorCima: true`.
 *  - **é posta → `sobre`.** É ACESSÓRIO: o óculos. Ele é vestido por último e não
 *    pode depender de qual franja está embaixo — sem haste não há o que apoiar
 *    (doc 21 §2c). Campo ausente, que é o padrão histórico.
 *
 * **Decidida pelo Doug em 2026-08-20**, olhando os quatro casos lado a lado em
 * `.scratch/estilo/quatro-casos.png` — e ela encerra uma ordem que virou quatro
 * vezes em dois dias, sempre decidida no zoom de uma junção. O que o desenho mostra:
 * com a barba POR CIMA, ela e o cabelo têm a mesma cor (D17) e formam uma massa
 * contínua em volta do rosto — lê como cabeça peluda, não como bob com barba. Com
 * ela SOB, o bob mantém a silhueta e a barba que sobra fica contra a PELE, que é
 * onde ela lê.
 *
 * **O custo está medido e aceito** (`.scratch/estilo/quanto-da-barba-sobra.ts`):
 * sobrevivem 56,8% da `barba-cheia` sob o `chanel` e 75,3% sob o `assimetrico`. O
 * que some é a parte que ficaria encostada no cabelo — mesma cor, sem contraste,
 * ilegível de qualquer jeito. **Área visível não é leitura**, e medir área foi o erro
 * que levou esta ordem a virar duas vezes num só dia.
 *
 * ⚠️ **A diretriz é inerte para 2 dos 5 cabelos.** As linhas `cabelo-parametrico` e
 * `rosto-sob-cabelo` são exclusivas em z **diferentes**, e o rosto senta entre elas:
 * `coque` e `moicano` vivem dentro do clip do crânio, emitidos muito antes das
 * feições, e a peça de rosto fica por cima deles com bandeira ou sem. Hoje não produz
 * defeito — nenhum dos dois desce ao queixo. Torná-la verdadeira em 5 de 5 exige
 * tirar o paramétrico do clip do crânio, o que **move a maioria dos selos**: é
 * decisão, não refactor.
 *
 * O slot é UM e sai em dois lugares da pilha, então as duas linhas são a **mesma
 * emissão** e compartilham marcador no gate — ver `pilha-de-camadas.test.ts`,
 * asserção 2.
 */
export type LadoDoRosto = "sob" | "sobre" | "qualquer";

/** Os dois `clipPath` do arquivo. Uma linha sem grupo é emitida fora de todo clip. */
export type GrupoDeClip = "clip-tronco" | "clip-cabeca";

/**
 * UMA CAMADA DA PILHA.
 *
 * O campo que carrega o peso é o **`porQue`**, e ele é anatômico de propósito: a
 * razão pela qual esta camada fica ANTES da seguinte, em uma frase, no vocabulário
 * do desenho e não no do código. Uma fronteira sem razão anatômica é uma fronteira
 * que a próxima pessoa vai virar no olho — que é exatamente como a barba virou três
 * vezes.
 */
export interface Camada {
  /** Identidade da camada. `IdDeCamada` sai daqui, então id errado não compila. */
  readonly id: string;
  /** Quem responde por ela. */
  readonly dono: DonoDeCamada;
  /**
   * ONDE ELA É EMITIDA — **endereço, não contrato.**
   *
   * Função e ponto de chamada, nunca número de linha: número de linha envelhece a
   * cada edição do compositor e viraria uma segunda coisa a manter em dia. Quem
   * cobra a emissão é o gate, não este campo.
   */
  readonly onde: string;
  /** A razão ANATÔMICA da fronteira com a camada seguinte, em uma frase. */
  readonly porQue: string;
  /** Em que família de cabelo a linha existe. */
  readonly familiaCabelo: FamiliaDeCabelo;
  /** De que lado do cabelo a peça de rosto veste. */
  readonly ladoDoRosto: LadoDoRosto;
  /** Dentro de que `clipPath` ela é emitida. Ausente = fora de todo clip. */
  readonly grupo?: GrupoDeClip;
  /** O que APAGA esta camada sem mover ninguém de lugar. Supressão, não ordenação. */
  readonly suprimidaPor?: string;
  /**
   * A LINHA EXISTE E **NENHUMA PEÇA DO CATÁLOGO A USA** — com o porquê medido.
   *
   * É diferente de `suprimidaPor`, que é uma condição de render. Aqui a camada é
   * emitível, gateada e vazia: o slot dela não tem cliente. Declarar isso é o que
   * impede a linha de virar promessa — e o campo carrega a medição que a esvaziou,
   * para que encher de novo custe medir, não lembrar.
   */
  readonly semPecaHoje?: string;
  /** A contradição registrada, com as duas leituras. Ver a última linha. */
  readonly emDisputa?: string;
}

/**
 * A PILHA, DE TRÁS PARA A FRENTE. Quem vem depois pinta por cima.
 *
 * ---------------------------------------------------------------------------
 * AS QUATRO VÁLVULAS QUE PARTICIONAM ESTA LISTA, E A REGRA PARA UMA QUINTA
 * ---------------------------------------------------------------------------
 *
 * `Traje.extensoes[].atras`, `Extensao.atras` (cabelo), `PecaDeRosto.cabeloPorCima`
 * e o `PecaDeChapeu.cabeloPorCima?: never` que é o par de trava da terceira. Cada
 * uma parte uma lista entre **linhas que já existem** aqui.
 *
 * `semTraco` **não é válvula de z** e por isso não aparece nesta tabela: ele
 * responde *"esta forma tem borda externa"*, não *"onde ela entra"*.
 * `sobrancelhaEscondida` também não: é supressão medida, e entra como
 * `suprimidaPor` de uma linha, nunca como linha própria.
 *
 * **Uma válvula nova só é legítima se as quatro valerem:**
 *
 *  1. o slot tem peças com necessidades **opostas** contra o mesmo vizinho;
 *  2. a resposta **não** se lê do slot — se todas as peças querem o mesmo lado, a
 *     resposta é uma **linha** desta tabela, não uma bandeira;
 *  3. ela particiona uma lista entre linhas que já existem;
 *  4. **ausente ≡ o padrão histórico, byte a byte.**
 *
 * Senão, a resposta é da tabela.
 *
 * ---------------------------------------------------------------------------
 * `escondeCabelo` — DECLARADA AQUI, IMPLEMENTADA NO BLOCO 7
 * ---------------------------------------------------------------------------
 *
 * O chapéu disputa o crânio e vence, e a regra fina — *mostra tudo / esconde tudo* —
 * mora no ITEM. Ela é **supressão**, não ordenação: pluga nas quatro linhas de
 * `dono: "cabelo"` (`cabelo-extensoes-atras`, `cabelo-parametrico`,
 * `cabelo-extensoes-frente`, `cabelo-tracado`) apagando-as, sem mover ninguém.
 *
 * **O campo honesto é `"nada" | "tudo"`, e as duas alternativas caem por medição:**
 * `"franja"` não é implementável — nem a franja paramétrica nem a massa traçada
 * declaram sub-caminho separável, e recortá-lo pediria a máscara que o doc 15 §7c
 * item 17 veta —, e `"achatada"` é direção de arte, não bandeira.
 */
export const PILHA = [
  {
    id: "sombra-do-chao",
    dono: "sistema",
    onde: "compor() → sombraChao()",
    porQue:
      "fora do grupo que respira: ela encolhe quando o boneco sobe, e é isso que vende a flutuação",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "traje-extensoes-atras",
    dono: "traje",
    onde: "compor() → extensoes(traje, true)",
    porQue: "as costas da capa ficam atrás: a tinta opaca do tronco come a emenda",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "tronco-tinta",
    dono: "traje",
    onde: "compor() → <g clip-path=c-tronco> tintaTronco()",
    porQue:
      "cor chapada → decoração → sombra do queixo e plano lateral, tudo dentro do clip; o que excede é cortado, e exceder é o comportamento exigido",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    grupo: "clip-tronco",
    suprimidaPor:
      "traje.tinta.arte apaga as DUAS últimas formas (sombra do queixo e plano lateral): arte traz o próprio volume, e pintar o do compositor por cima dobra o sombreado",
  },
  {
    id: "tronco-contorno",
    dono: "sistema",
    onde: "compor() → <use href=p-tronco class=kk-traco>",
    porQue:
      "fora do clip, sempre: a borda de silhueta é do sistema, e sem ela a borda cai para p50 7,5 u — reprovado na tela pelo Doug em 2026-08-12",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "traje-arte",
    dono: "traje",
    onde: "compor() → arteDoTraje()",
    porQue:
      "depois do contorno porque onde a roupa transborda é o traço DELA que vira a borda externa; antes da cabeça porque a cabeça é opaca, e é o que faz a gola sumir atrás do queixo em vez de flutuar sobre ele",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    suprimidaPor: "ausência de traje.tinta.arte — sem ela a função devolve string vazia",
  },
  {
    id: "cabelo-extensoes-atras",
    dono: "cabelo",
    onde: "compor() → extensoesCabelo(modelo, true)",
    porQue: "o coque fica preso atrás: a cabeça opaca come a emenda, oclusão em vez de máscara",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "cabeca-pele",
    dono: "sistema",
    onde: "compor() → <use href=p-cabeca class=kk-pele>",
    porQue:
      "A OCLUSÃO QUE SUSTENTA O ARQUIVO: o preenchimento opaco apaga o topo do tronco E o contorno dele, e é o que dispensa máscara no boneco inteiro",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "faceta-esq",
    dono: "sistema",
    onde: "compor() → <path fill=url(#ns-fe)>",
    porQue: "volume do rosto; é pele, então vai sob o cabelo",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    grupo: "clip-cabeca",
  },
  {
    id: "faceta-dir",
    dono: "sistema",
    onde: "compor() → <path fill=url(#ns-fd)>",
    porQue: "a irmã da anterior; a esquerda carrega o queixo junto, e por isso vem primeiro",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    grupo: "clip-cabeca",
  },
  {
    id: "cabelo-parametrico",
    dono: "cabelo",
    onde: "compor() → cabeloNoCranio()",
    porQue:
      "dentro do clip do crânio, porque a peça não sabe onde o crânio termina — e é de propósito (cabelo.ts). EXCLUSIVA com `cabelo-tracado`",
    familiaCabelo: "parametrico",
    ladoDoRosto: "qualquer",
    grupo: "clip-cabeca",
  },
  {
    id: "especular",
    dono: "sistema",
    onde: "compor() → <path class=kk-luz>",
    porQue:
      "depois do cabelo: a mancha mora acima da franja dos cinco modelos, e desenhada antes seria brilho de pele sob cabelo opaco — invisível justamente nos avatares que têm cabelo, que são todos",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    grupo: "clip-cabeca",
  },
  {
    id: "cabeca-contorno",
    dono: "sistema",
    onde: "compor() → <use href=p-cabeca class=kk-traco>",
    porQue: "a borda do crânio, fora do clip — mesma doutrina do contorno do tronco",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "cabelo-extensoes-frente",
    dono: "cabelo",
    onde: "compor() → extensoesCabelo(modelo, false)",
    porQue: "massa que excede a silhueta pela frente, com borda própria emitida junto",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "olhos",
    dono: "sistema",
    onde: "compor() → olho() × 2",
    porQue: "tinta da cor do contorno, POR CIMA dele, fora de todo clip",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "sobrancelhas",
    dono: "sistema",
    onde: "compor() → pathSobrancelha() × 2",
    porQue:
      "a mesma natureza dos olhos; fora de `kk-olho` de propósito, porque sobrancelha que encolhe com a piscada lê como careta",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    suprimidaPor:
      "sobrancelhaEscondida(modelo), lado a lado — supressão MEDIDA, não declarada por peça: tapar quase toda a sobrancelha lê como rebarba no contorno do cabelo, pior que tapar nenhuma",
  },
  {
    id: "boca",
    dono: "sistema",
    onde: "compor() → pathBoca()",
    porQue: "a última feição — todo o elenco de cima entra depois dela",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "rosto-sob-cabelo",
    dono: "rosto",
    onde: "compor() → rosto(true)",
    porQue:
      "**O PELO — barba, bigode, costeleta.** Ele NASCE da cabeça, então o cabelo cai sobre ele, como na vida. É a diretriz do empilhamento do slot (ver o docstring de `LadoDoRosto`), não uma escolha peça a peça. EXCLUSIVA com `rosto-sobre-cabelo`: é o mesmo slot, partido por `cabeloPorCima`",
    familiaCabelo: "qualquer",
    ladoDoRosto: "sob",
  },
  {
    id: "cabelo-tracado",
    dono: "cabelo",
    onde: "compor() → pecaSobreposta()",
    porQue:
      "peça sobreposta, fora de todo clip, dona da própria silhueta. Depois das feições desde 2026-08-08, porque cabelo que cai sobre a testa tem de tapar a sobrancelha. UMA linha da pilha, até QUATRO sub-camadas dentro dela (silhueta preta → núcleo → clara → pretas), e elas não se partem",
    familiaCabelo: "tracado",
    ladoDoRosto: "qualquer",
  },
  {
    id: "rosto-sobre-cabelo",
    dono: "rosto",
    onde: "compor() → rosto(false)",
    porQue:
      "O ÓCULOS. Sem haste não há o que apoiar (doc 21 §2c), e a peça que a criança desbloqueou não pode depender de qual franja está embaixo",
    familiaCabelo: "qualquer",
    ladoDoRosto: "sobre",
  },
  {
    id: "chapeu",
    dono: "chapeu",
    onde: "compor() → sobrepor(estado.chapeu)",
    porQue:
      "ele disputa o crânio e vence: é o que 'esconde o cabelo' quer dizer. Não participa da partição do rosto, e isso é trava de tipo (`PecaDeChapeu.cabeloPorCima?: never`), não disciplina",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
  },
  {
    id: "traje-extensoes-frente",
    dono: "traje",
    onde: "compor() → extensoes(traje, false)",
    porQue:
      "a camada mais externa da figura, hoje DEPOIS do chapéu — e é a posição que o gate trava, não a que alguém decidiu",
    familiaCabelo: "qualquer",
    ladoDoRosto: "qualquer",
    emDisputa:
      "CONTRADIÇÃO REGISTRADA, NÃO CONSERTADA. O compositor emite o chapéu e DEPOIS esta linha, então uma ombreira ou fecho de capa pinta por cima do chapéu. " +
      "As duas leituras: (a) FICA ONDE ESTÁ — a extensão frontal é a camada mais externa da figura, e uma ombreira sobre a aba do chapéu pode ser exatamente o desenho certo; " +
      "(b) DESCE PARA JUNTO DE `traje-arte` — 'o bloco do tronco fecha antes de o bloco da cabeça abrir', que é a regra que a arte do traje já usa. " +
      "Não se decide sem peça na mão: nenhum traje do catálogo declara `extensoes` hoje, `extensoes(undefined, false)` devolve string vazia, e a contradição é INERTE até a primeira capa. " +
      "O dia em que a decisão vier, ela é uma linha desta tabela e o gate fica vermelho nomeando o par.",
  },
] as const satisfies readonly Camada[];

/** O id de uma camada, tirado da própria tabela: id errado é erro de compilação. */
export type IdDeCamada = (typeof PILHA)[number]["id"];

/** Todos os ids, na ordem da pilha. */
export const IDS_DA_PILHA: readonly IdDeCamada[] = PILHA.map((c) => c.id);

/**
 * O QUE **NÃO** ESTÁ NO SVG, E POR QUÊ — e isto mata a pergunta "e o pet?" na origem.
 *
 * Uma tabela de camadas que lista só o que existe deixa o leitor sem saber se a
 * ausência é decisão ou esquecimento. Estas três são decisão, cada uma com data.
 */
export const FORA_DA_PILHA = [
  {
    id: "pet",
    porQue:
      "componente IRMÃO, fora do <svg> do boneco: ele não toca a geometria da figura (doc 21 §3.4). Um slot dentro do SVG o obrigaria a entrar no orçamento de formas do composto por nada",
  },
  {
    id: "moldura",
    porQue: "anel de CSS em volta do avatar — não é forma, não é camada, não entra no SVG",
  },
  {
    id: "fundo",
    porQue:
      "slot APAGADO (G23). A emenda à D27 revogou a cor de fundo, e `avatar_bg_color` não existe no banco",
  },
] as const;
