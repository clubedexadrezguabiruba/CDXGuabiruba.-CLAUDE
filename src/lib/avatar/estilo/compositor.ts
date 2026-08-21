/**
 * O COMPOSITOR — o único lugar do sistema que desenha contorno.
 *
 * A regra 1 do doc 15, §3, em código: **toda fronteira tem um dono.**
 *
 *  - **Borda de silhueta** (o traço de `TRACO` unidades) pertence ao sistema.
 *    Só `geometria.ts` a define e só este arquivo a desenha. Nenhum traje, gola,
 *    chapéu ou uniforme emite `stroke` de silhueta, nunca.
 *  - **Costura interna** (o decote, a barra, o cinto) não é encontro de duas
 *    formas: é tinta sobre tinta dentro do mesmo `clipPath`, com uma linha
 *    decorativa por cima. Pode errar ±2 unidades — o traço cobre, e não há
 *    transparência embaixo para vazar.
 *
 * A regra 2, também em código: **a base é pintada inteira e opaca por baixo de
 * tudo; o traje pinta por cima e o clip corta.** É o modelo sangria + faca de
 * corte da gráfica. Um furo na tinta do traje mostra a cor da base — visível na
 * folha e medido pelo gate (a) — e nunca transparência. Os 2909 px de furo do
 * pipeline morto deixam de ser uma classe de defeito possível.
 *
 * ---------------------------------------------------------------------------
 * CADA SILHUETA É ESCRITA UMA VEZ E REFERENCIADA TRÊS
 * ---------------------------------------------------------------------------
 *
 * A cabeça e o tronco entram em `<defs>` como `<path>` e são usados por `<use>`:
 * uma vez para clipar, uma para a tinta, uma para o contorno.
 *
 * Não é micro-otimização, é o que torna o Bloco 1c possível dentro do teto. A
 * cabeça deixou de ser um retângulo de cantos elípticos (8 números) e virou um
 * contorno medido de 29 pontos, que emite ~1,1 KB de `d=`. Escrito três vezes são
 * 3,3 KB num arquivo com teto de 8 KB — o contorno sozinho comeria o orçamento das
 * facetas. Com `<use>`, 1,2 KB.
 *
 * O ganho colateral importa mais: **passa a ser impossível as três cópias
 * divergirem**, porque não há três cópias. É a mesma razão de a `interface Traje`
 * não ter campo de silhueta, um nível abaixo.
 *
 * ---------------------------------------------------------------------------
 * A ORDEM DAS CAMADAS, E POR QUE ELA BASTA
 * ---------------------------------------------------------------------------
 *
 * O plano pede o contorno "uma vez, por cima de tudo". Ao escrever, uma
 * literalidade apareceu: o topo do tronco fica ATRÁS da cabeça, e um contorno
 * único desenhado por último traçaria aquela aresta escondida POR CIMA do rosto.
 *
 * A solução não precisa de máscara. **A ordem resolve por oclusão**, que é o mesmo
 * mecanismo que o estilo inteiro usa.
 *
 * **A ORDEM MORA EM `camadas.ts`, E NÃO AQUI.** A tabela `PILHA` é a única
 * autoritativa; cada linha carrega o dono, o endereço de emissão e a razão
 * *anatômica* da fronteira, e `__tests__/pilha-de-camadas.test.ts` prova que esta
 * função obedece a ela. Esta lista já morou neste docstring em prosa, omitia três
 * camadas emitidas e afirmava o contrário do código em vários pontos — que é
 * exatamente como a ordem barba × cabelo virou três vezes em dois dias.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO NÃO FAZ
 * ---------------------------------------------------------------------------
 *
 * Não recorta, não dilata, não erode, não registra e não compara silhuetas. As
 * ~2.400 linhas que faziam isso (`gerar-base-recolorivel` 689, `mascara-base` 782,
 * `gerar-uniforme` 826) existiam para RECUPERAR uma fronteira que morava dentro
 * de uma imagem. Aqui a fronteira é escrita, então não há o que recuperar.
 */

import { LINHA, TRAJE_BASE, escurecer } from "../palette";
import {
  pathCabelo,
  pathCabeloClaro,
  pathCabeloLinhas,
  pathCabeloNucleo,
  pathCabeloPretas,
  pathExtensao,
  pathExtensaoLinhas,
  resolverCabelo,
  sobrancelhaEscondida,
  type CabeloOuModelo,
} from "./cabelo";
import {
  BOCA,
  FACETAS,
  CAIXA_CABECA,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  FAIXA_FACETA,
  SOBRANCELHA,
  SOMBRA_CHAO,
  TRACO,
  VIEWBOX,
  fatorDeTom,
  n,
  pathBoca,
  pathCabeca,
  pathEspecular,
  pathFacetaDir,
  pathFacetaEsq,
  pathPlanoLateralTronco,
  pathSobrancelha,
  pathSombraQueixoTronco,
  pathTronco,
} from "./geometria";
import type { EstadoAvatar, PecaSobreposta, Traje } from "./tipos";

/**
 * O CSS da composição — UMA DECLARAÇÃO, DUAS MONTAGENS.
 *
 * NENHUM COMENTÁRIO AQUI DENTRO. Um `/* ... *​/` dentro de `<style>` já fez o
 * Chromium descartar em silêncio todas as regras seguintes neste projeto, e
 * `conferirSvg` reprova. As explicações moram nos comentários de TypeScript.
 *
 * ---------------------------------------------------------------------------
 * POR QUE OS CORPOS SÃO CONSTANTES, E NÃO TEXTO ESCRITO DUAS VEZES
 * ---------------------------------------------------------------------------
 *
 * A partir do Bloco E o mesmo CSS sai por dois caminhos: **embutido** no `<svg>`
 * (o de sempre, que os 11 selos de `parametrico-congelado.ts` medem byte a byte) e
 * na **folha única** que o produto emite uma vez por página. Escrever as regras
 * duas vezes é a segunda descrição da mesma coisa — e o congelado vigia só uma
 * delas, então a divergência sairia calada justamente do lado que ninguém mede.
 *
 * Aqui só os CORPOS são compartilhados. O que difere entre os dois caminhos é o
 * escopo (`.${ns}` × `.kk`), quais regras saem (condicional × união) e o nome dos
 * `@keyframes` — e essas três diferenças são o assunto de cada montagem.
 *
 * O piscar usa `transform-box: fill-box`, que faz `transform-origin: center`
 * significar o centro da própria forma — assim os dois olhos compartilham UMA
 * regra em vez de uma origem escrita à mão para cada. E o estado base é
 * `scaleY(1)`: sem animação (motor pausado, `prefers-reduced-motion`,
 * screenshot de gate) o olho fica ABERTO. A folhinha ensinou isso pelo caminho
 * caro — pálpebra que nasce fechada entrega um boneco cego na folha de contato.
 */

/** O traço de silhueta, repetido em quatro corpos. */
const RISCO_SILHUETA =
  `stroke:var(--av-linha);stroke-width:var(--av-traco);` +
  `stroke-linejoin:round;stroke-linecap:round`;

/**
 * O corpo de cada regra, sem seletor. A chave é a classe que o SVG emite.
 *
 * `kk-risco` é sobrancelha e boca. É `stroke` e não `fill` porque as duas são
 * cápsulas, e uma cápsula é o que `stroke-linecap:round` desenha de graça — sem
 * path fechado, sem `transform` para inclinar, sem caso especial para a curva do
 * sorriso. A espessura de cada uma vai no elemento: são duas medidas diferentes
 * (8,2 e 5,3) e uma classe por medida custaria mais que o atributo.
 */
const CORPO_DA_REGRA = {
  "kk-traco": `fill:none;${RISCO_SILHUETA}`,
  "kk-cabelo": `fill:var(--av-cabelo)`,
  "kk-cabelo-m": `fill:var(--av-cabelo-s)`,
  "kk-cabelo-l": `fill:none;${RISCO_SILHUETA}`,
  "kk-cabelo-s": `fill:var(--av-cabelo-s);${RISCO_SILHUETA}`,
  "kk-cabelo-e": `fill:var(--av-cabelo);${RISCO_SILHUETA}`,
  "kk-pele": `fill:var(--av-pele)`,
  "kk-pele-s": `fill:var(--av-pele-s)`,
  "kk-tinta": `fill:var(--av-linha)`,
  "kk-risco": `fill:none;stroke:var(--av-linha);stroke-linecap:round`,
  "kk-luz": `fill:#FFFFFF;opacity:.30`,
  "kk-olho": `transform-box:fill-box;transform-origin:center`,
} as const;

/** As classes de `CORPO_DA_REGRA`, para o gate de completude da folha. */
export type ClasseDoAvatar = keyof typeof CORPO_DA_REGRA;

/** Uma regra escopada. `escopo` é a classe do `<svg>` raiz. */
const regra = (escopo: string, classe: ClasseDoAvatar) =>
  `.${escopo} .${classe}{${CORPO_DA_REGRA[classe]}}`;

/**
 * AS TRÊS ANIMAÇÕES, e por que `escopo` e `kf` são parâmetros separados.
 *
 * No caminho embutido os dois são o `ns` da instância: cada SVG traz os próprios
 * `@keyframes`, porque não há onde mais pô-los. Na folha única o escopo passa a ser
 * a classe-interruptor (`.kk-anima`, presente no `<svg>` só quando animado) e os
 * keyframes ficam com nome fixo, emitidos uma vez para a página inteira.
 *
 * É a diferença entre "estas regras só existem se houver animação" e "estas regras
 * existem sempre e se aplicam a quem pedir" — a mesma folha serve os 30 do ranking
 * (parados) e o boneco grande do perfil (animado) sem sair duas vezes.
 */
function regrasDeAnimacao(escopo: string, kf: string): string {
  return (
    `.${escopo} .kk-respira{animation:${kf}-respira 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
    `.${escopo} .kk-sombra{animation:${kf}-sombra 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
    `.${escopo} .kk-olho{animation:${kf}-pisca 5.2s ease-in-out infinite}` +
    `@keyframes ${kf}-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}` +
    `@keyframes ${kf}-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}` +
    `@keyframes ${kf}-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}` +
    `@media(prefers-reduced-motion:reduce){.${escopo} .kk-respira,.${escopo} .kk-sombra,.${escopo} .kk-olho{animation:none}}`
  );
}

function estilo(ns: string, animado: boolean, modelo: CabeloOuModelo | undefined): string {
  const respiro = animado ? regrasDeAnimacao(ns, ns) : "";

  // AS REGRAS DO CABELO SÓ SAEM QUANDO HÁ CABELO, como o `respiro`.
  //
  // Não é economia de byte por esporte: o teto da base é de REGRESSÃO (7 418, o
  // valor medido no Bloco 1d), e regra emitida à toa faria a base careca crescer
  // para pagar uma camada que ela não tem. O mesmo vale para as duas custom
  // properties lá embaixo — e é a mesma razão de `.kk-cabelo-l` só sair quando há
  // arcos declarados, e de as duas famílias emitirem regras diferentes.
  //
  // **A folha única não herda essa economia, e é de propósito:** ela sai uma vez
  // por página e não passa pelo teto de regressão, que mede o SVG da base careca.
  //
  // A camada clara nunca tem contorno (um traço ali riscaria o meio do cabelo) e a
  // extensão sempre tem, porque ela é a borda externa da figura onde passa do
  // crânio. O que muda entre as famílias é a camada de baixo:
  //
  //  - **paramétrica** (`.kk-cabelo-s`): fill E stroke na mesma regra, e está certo.
  //    A touca fecha por um retângulo a `FORA` da caixa da cabeça, o clip come aquele
  //    trecho inteiro, e o que sobra traçado é exatamente a franja. Perímetro
  //    matemático e traço visível coincidem por construção;
  //  - **traçada** (`.kk-cabelo-m` + `.kk-cabelo-l`): num laço FECHADO eles deixam de
  //    coincidir — o laço tem borda também por cima, onde quem desenha o contorno na
  //    arte é a cabeça do BONECO, que é `descarte`. Fill e stroke passam a ser dois
  //    elementos porque passam a ter GEOMETRIA diferente: a massa inteira pintada,
  //    e só os arcos que a arte traça de fato levando linha. Ver `Cabelo.linhas`.
  const c = modelo ? resolverCabelo(modelo) : undefined;
  // O arco pode vir da massa OU de uma das formas irmãs, e a regra do traço sai se
  // qualquer uma declarar — senão uma peça cuja única linha está numa forma extra
  // sairia sem contorno nenhum.
  const temArco = Boolean(c?.linhas?.length) || Boolean(c?.formas?.some((f) => f.linhas?.length));
  const cabelo = !c
    ? ""
    : regra(ns, "kk-cabelo") +
      (c.massa
        ? // A peça sobreposta não tem extensão: as formas irmãs são a própria peça,
          // pintadas pela mesma `.kk-cabelo-m`, então `.kk-cabelo-e` não sai.
          regra(ns, "kk-cabelo-m") + (temArco ? regra(ns, "kk-cabelo-l") : "")
        : regra(ns, "kk-cabelo-s") + regra(ns, "kk-cabelo-e"));

  return (
    regra(ns, "kk-traco") +
    cabelo +
    regra(ns, "kk-pele") +
    regra(ns, "kk-pele-s") +
    regra(ns, "kk-tinta") +
    regra(ns, "kk-risco") +
    regra(ns, "kk-luz") +
    regra(ns, "kk-olho") +
    respiro
  );
}

/**
 * A CLASSE DO `<svg>` NO MODO FOLHA ÚNICA — fixa, e é isso que a torna única.
 *
 * No modo embutido a raiz leva o `ns` da instância, porque as regras vêm escopadas
 * por ele. Aqui a raiz leva sempre a mesma classe: é o que permite **uma** folha
 * servir N bonecos. O `ns` continua existindo e continua obrigatório — ele passou a
 * ter um papel só, prefixar `id`, e esse papel não some. Ver `compor()`.
 */
export const CLASSE_AVATAR = "kk";

/** O interruptor da animação, no lugar da emissão condicional do modo embutido. */
export const CLASSE_ANIMADO = "kk-anima";

/** O prefixo dos `@keyframes` da folha. Fixo: eles saem uma vez para a página. */
const KEYFRAMES_DA_FOLHA = "kk";

/**
 * A FOLHA ÚNICA — o mesmo CSS, emitido uma vez por página em vez de uma por boneco.
 *
 * Trinta avatares num ranking emitiriam 30 blocos `<style>` idênticos (doc 15, 5.7).
 * Aqui a chapa é uma só, e cada `<svg>` carrega apenas as custom properties com a
 * cor daquele aluno — que é exatamente o contrato que `palette.ts:11-15` já
 * antecipava.
 *
 * **Três diferenças em relação ao embutido, e as três são obrigatórias:**
 *
 *  1. **escopo fixo** (`.kk`), senão não haveria o que compartilhar;
 *  2. **união das duas famílias de cabelo.** É seguro porque elas usam classes
 *     DISJUNTAS — paramétrica `-s`/`-e`, traçada `-m`/`-l` —, então a união não
 *     cria regra conflitante, só regra sem elemento correspondente;
 *  3. **animação sempre presente**, ligada pela classe `.kk-anima` no `<svg>`. Uma
 *     folha estática não pode ser condicional a um estado que varia por instância.
 *
 * Quem a emite é `<AvatarKokeshi>`, e quem garante que ela saia **uma vez** é o
 * React, que deduplica `<style href precedence>`. Mecanismo, não disciplina.
 */
export function folhaAvatar(): string {
  const e = CLASSE_AVATAR;
  return (
    regra(e, "kk-traco") +
    regra(e, "kk-cabelo") +
    regra(e, "kk-cabelo-m") +
    regra(e, "kk-cabelo-l") +
    regra(e, "kk-cabelo-s") +
    regra(e, "kk-cabelo-e") +
    regra(e, "kk-pele") +
    regra(e, "kk-pele-s") +
    regra(e, "kk-tinta") +
    regra(e, "kk-risco") +
    regra(e, "kk-luz") +
    regra(e, "kk-olho") +
    regrasDeAnimacao(CLASSE_ANIMADO, KEYFRAMES_DA_FOLHA)
  );
}

/** Escapa o que vai para dentro de um atributo XML. */
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Um tom de pele com um delta de luminância medido aplicado. */
const tomPele = (pele: string, delta: number) =>
  escurecer(pele, fatorDeTom(delta, FACETAS.PLATO_PELE));

/**
 * A SOMBRA DO CHÃO — UMA elipse com `radialGradient`.
 *
 * O que continua valendo é a recusa ao `<filter>`: são **30 bonecos a 56 px no
 * ranking**, e 30 `feGaussianBlur` numa lista é custo de GPU real em mobile. Um
 * gradiente é interpolação de cor, não convolução.
 *
 * Ela fica FORA do grupo que respira e encolhe quando o boneco sobe — é isso que
 * vende a flutuação (§6). Se subisse junto, o boneco pareceria colado num adesivo.
 */
function sombraChao(ns: string): string {
  const { cx, cy, rx, ry } = SOMBRA_CHAO;
  return (
    `<g class="kk-sombra">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${ns}-sombra)"/>` +
    `</g>`
  );
}

/**
 * A TINTA DO TRONCO — o interior, e só ele.
 *
 * Três casos, na ordem em que o pipeline os produz:
 *
 *  1. **Sem traje:** o macacão de treino da base (`TRAJE_BASE.roupa`, que é
 *     exatamente o bege da referência). Nunca boneco pelado.
 *  2. **Traje só com cor:** chapado. É o estado de toda peça antes de a imagem
 *     do Doug chegar, e é o que faz o sistema ficar utilizável entre um pedido
 *     de imagem e o seguinte.
 *  3. **Traje com arte:** o `.svg` da peça, que **não entra aqui**. Ele é colado por
 *     `arteDoTraje()`, FORA deste clip e depois do contorno do tronco — a linha
 *     `traje-arte` de `camadas.ts`. A cor chapada continua embaixo: se a tinta tiver
 *     furo, aparece cor de traje, nunca transparência.
 *
 * A **sombra de contato do queixo** e o **plano lateral** entram por último, e só no
 * caso 1 e 2: quem declara `tinta.arte` responde pelo próprio volume, e pintar o do
 * compositor por cima dobraria o sombreado. É a `suprimidaPor` da linha
 * `tronco-tinta` em `camadas.ts`, e o porquê está no comentário dentro da função.
 *
 * ⚠️ Este docstring já disse que a sombra entrava *"depois da arte do traje"*. Deixou
 * de ser verdade em 2026-08-17, quando a arte saiu de dentro desta função para fora
 * do clip — as duas coisas nem se encontram mais.
 *
 * Tudo isto vive dentro do `clipPath` do tronco, aplicado por quem chama. O que
 * excede o clip é cortado — e exceder é o comportamento EXIGIDO, não o defeito.
 */
function tintaTronco(ns: string, traje: Traje | undefined): string {
  const cor = traje?.tinta.cor ?? TRAJE_BASE.roupa;
  let out = `<use href="#${ns}-p-tronco" fill="${cor}"/>`;

  for (const dec of traje?.decoracao ?? []) {
    out +=
      `<path d="${attr(dec.d)}" fill="${dec.fill ?? "none"}"` +
      (dec.stroke ? ` stroke="${dec.stroke}" stroke-width="4" stroke-linejoin="round"` : "") +
      `/>`;
  }

  // O VOLUME DO COMPOSITOR SÓ EXISTE QUANDO NÃO HÁ ARTE, e a decisão é do Doug,
  // em 2026-08-12, olhando a primeira folha de traje: *"a sombra do corpo ficou
  // por cima da roupa, não foi ajustado/eliminado"*.
  //
  // A sombra de contato do queixo e o plano lateral foram desenhados para o
  // macacão CHAPADO da base, que não tem volume nenhum de si. Uma arte de traje
  // traz o próprio — a farda do Soldado chegou com 29 790 px de sombra e 11 626
  // de luz, medidos —, e pintar os dois por cima **dobra o sombreado**: some o
  // que a artista desenhou e aparece um degrau que não é de ninguém.
  //
  // Então quem tem `tinta.arte` responde pelo próprio volume, inclusive pela
  // sombra sob o queixo. É o que o `PEDIDO-TRAJE.md` passa a pedir.
  if (!traje?.tinta.arte) {
    out +=
      `<path d="${pathSombraQueixoTronco()}" ` +
      `fill="${escurecer(cor, fatorDeTom(FACETAS.sombraQueixo.delta, FACETAS.PLATO_TRONCO))}"/>`;
    out += `<path d="${pathPlanoLateralTronco()}" fill="${escurecer(cor, 0.9)}" opacity=".42"/>`;
  }
  return out;
}

/**
 * A ARTE DO TRAJE — **fora do clip**, e é o conserto da segunda ressalva do Doug.
 *
 * Ela morava dentro de `tintaTronco()`, logo dentro do `clipPath` do tronco. O
 * resultado foi medido na primeira folha e o Doug viu antes da régua: *"a imagem
 * PNG passa sim da silhueta, mesmo que pouco; a arte feita por você eliminou essa
 * silhueta e desenhou apenas dentro do corpo"*.
 *
 * Ele tem razão, e o número concorda: 5 767 px da arte caíam fora do clip. A maior
 * parte era o traço da própria peça — que o contorno do tronco redesenhava por
 * cima, então não se notava —, mas **1 497 px de sombra e luz sumiam**, e com eles
 * o transbordo que faz roupa parecer roupa em vez de tinta no tronco (doc 21 §6.1,
 * *"roupa veste, não pinta"*).
 *
 * Fora do clip a arte guarda o que a artista desenhou, inclusive o que passa da
 * silhueta. **E ela entra DEPOIS do contorno do tronco**: onde a roupa transborda,
 * o traço dela vira a borda externa, que é exatamente a regra que `extensoes()` já
 * enuncia para capa e ombreira. A diferença é só o formato — ali vetor, aqui
 * raster —, e a regra de composição é a mesma.
 *
 * O que NÃO muda: sem `tinta.arte` esta função devolve string vazia, e o SVG sai
 * byte a byte igual ao de sempre. É o que mantém os 19 formas / 7 468 bytes da
 * `folha-base` e os 11 selos parados.
 */
function arteDoTraje(traje: Traje | undefined): string {
  if (!traje?.tinta.arte) return "";
  return colarArte(traje.tinta.arte, traje.escalaMedida ?? 1);
}

/**
 * A COLAGEM DE UMA PEÇA DE ARTE — e há **uma** descrição dela, para todos os slots.
 *
 * Ela era o corpo de `arteDoTraje()` e saiu de lá em 2026-08-17, quando chapéu,
 * óculos e pet passaram a colar do mesmo jeito. Duas cópias desta conta é o defeito
 * que a `interface Traje` (`tipos.ts`) inteira existe para não deixar acontecer: a
 * segunda divergiria da primeira no dia em que uma delas fosse ajustada, e o
 * sintoma seria uma peça caindo alguns pixels fora do lugar — o tipo de coisa que
 * ninguém vê a 56 px e todo mundo vê a 425.
 *
 * **A colagem é conta, não ajuste.** Com `k = 1` — que é o caso de toda peça de
 * hoje, porque nenhuma declara `escalaMedida` — o `<image>` ocupa `x=0 y=0 w=500
 * h=700`: o `viewBox` inteiro. E o `viewBox` inteiro é exatamente o retângulo em que
 * a esteira recortou a arte (px 212→812 × 92→932, 600 × 840, a MESMA proporção 5:7),
 * então `preserveAspectRatio="xMidYMid meet"` encaixa 1 : 1 sem sobra em eixo nenhum.
 * Sem registro, sem ajuste e sem número escolhido a olho.
 */
function colarArte(href: string, k: number): string {
  const w = VIEWBOX.w * k;
  const h = VIEWBOX.h * k;
  const dx = (VIEWBOX.w - w) / 2;
  const dy = (VIEWBOX.h - h) / 2;
  return (
    `<image href="${attr(href)}" x="${dx.toFixed(2)}" y="${dy.toFixed(2)}" ` +
    `width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`
  );
}

/**
 * As EXTENSÕES — capa, ombreira, gola alta: o que EXCEDE a silhueta.
 *
 * Estas têm forma própria, e é lícito: elas não compartilham fronteira com o
 * tronco, elas o COBREM. Onde cruzam, o preenchimento delas tapa o traço de
 * baixo e o traço delas vira a nova borda externa — na mesma passada, porque
 * quem desenha os dois é este arquivo.
 *
 * A exigência não é registro exato, é **sobreposição ≥ SANGRIA**, que o gate (c)
 * do Bloco 2 mede. É o mesmo truque dos braços da folhinha, que começam dentro
 * do corpo para o corpo cobrir a emenda.
 */
function extensoes(traje: Traje | undefined, atras: boolean): string {
  const lista = (traje?.extensoes ?? []).filter((e) => Boolean(e.atras) === atras);
  if (!lista.length) return "";
  return (
    lista.map((e) => `<path d="${attr(e.d)}" fill="${e.cor}"/>`).join("") +
    lista.map((e) => `<path class="kk-traco" d="${attr(e.d)}"/>`).join("")
  );
}

/**
 * O CABELO SOBRE O CRÂNIO — duas passadas da MESMA forma, e é isso que dá o volume.
 *
 * A de baixo sai em `--av-cabelo-s` e leva o traço; a de cima é a mesma curva subida
 * `DEGRAU` unidades, em `--av-cabelo`. O que sobra entre as duas é uma faixa escura
 * de espessura constante ao longo de toda a franja — o degrau de sombra do item
 * 2a.2 — sem ninguém desenhar uma segunda curva paralela. Desenhar a paralela é o
 * que o `cabecaRecuada(k)` tentou e não funciona: recuar uma curva subtraindo de
 * raios não produz uma paralela, ela corre para dentro depressa demais onde a
 * curvatura aperta.
 *
 * As duas vivem dentro do `clipPath` da cabeça, que é quem resolve a lateral. O
 * cabelo não sabe onde o crânio termina, e é de propósito (ver `cabelo.ts`).
 *
 * **Ela só vê cabelo PARAMÉTRICO**, e isso é do chamador: `compor()` gateia por
 * `massa` e manda a peça traçada para `pecaSobreposta()`. Esta função teve um
 * segundo ramo, para a peça traçada dentro do clip, e ele ficou **inalcançável** no
 * dia em que o gate do chamador passou a testar a mesma condição — o único caminho
 * até aqui é `!massa`, que era exatamente a guarda do primeiro ramo. O ramo morto
 * saiu em 2026-08-20, junto com a tabela da pilha; a ordem das três passadas da peça
 * traçada é escrita onde ela de fato acontece, em `pecaSobreposta()`.
 */
function cabeloNoCranio(modelo: CabeloOuModelo | undefined): string {
  if (!modelo) return "";
  const escuro = pathCabelo(modelo);
  // O moicano não tem touca — ele é só extensão. Emitir dois `<path d="">` vazios
  // custaria duas formas do orçamento para desenhar nada.
  if (!escuro) return "";
  // Uma peça pode ser CHAPADA: massa sem região clara. Ela não é o degrau com a
  // sombra zerada — é uma camada a menos, e cobrar dela uma forma vazia seria o
  // mesmo desperdício que o moicano acabou de não pagar.
  const claro = pathCabeloClaro(modelo);
  const clara = claro ? `<path class="kk-cabelo" d="${claro}"/>` : "";
  return `<path class="kk-cabelo-s" d="${escuro}"/>` + clara;
}

/**
 * As extensões do cabelo: coque, trança, crista, volume de cacho.
 *
 * Mesma natureza das extensões de traje — elas EXCEDEM a silhueta, então têm forma
 * própria e contorno próprio, emitido aqui e não pela peça. `atras` põe a forma sob
 * a cabeça, e é o que faz um coque parecer preso atrás em vez de colado na testa: a
 * cabeça é opaca e come a emenda, oclusão em vez de máscara.
 *
 * **As do mesmo grupo saem num `<path>` só, com subpaths `M…Z M…Z`.** Elas
 * compartilham classe, ordem e — por definição do grupo — a mesma posição na pilha,
 * então dividi-las em elementos separados não muda um pixel e cobra uma forma do
 * orçamento por peça. Com os modelos de hoje, que têm no máximo uma extensão por
 * grupo, a saída é byte a byte a mesma de antes; com uma peça traçada de três
 * lóbulos espetados, a diferença é 3 formas contra 1.
 */
function extensoesCabelo(modelo: CabeloOuModelo | undefined, atras: boolean): string {
  if (!modelo) return "";
  const lista = (resolverCabelo(modelo).extensoes ?? []).filter((e) => Boolean(e.atras) === atras);
  if (!lista.length) return "";
  return `<path class="kk-cabelo-e" d="${lista.map(pathExtensao).join(" ")}"/>`;
}

/**
 * A PEÇA SOBREPOSTA — desenhada por cima, sem clip, dona da própria silhueta.
 *
 * ---------------------------------------------------------------------------
 * ESTE É O MODELO QUE OS CHAPÉUS VÃO USAR, e não "o jeito do cabelo"
 * ---------------------------------------------------------------------------
 *
 * Cabelo e chapéu são as únicas peças do catálogo que batem no problema da fronteira
 * do crânio — traje, pet e moldura são imunes por construção, porque não compartilham
 * borda com a cabeça (e as duas últimas nem estão no SVG: ver `FORA_DA_PILHA` em
 * `camadas.ts`). Escrever isto como caminho do cabelo obrigaria a inventar um segundo
 * caminho para o chapéu; escrito como peça sobreposta, é um só.
 *
 * ---------------------------------------------------------------------------
 * O ACHADO QUE O JUSTIFICA
 * ---------------------------------------------------------------------------
 *
 * **Conteúdo CLIPADO nunca alcança os 6 u externos do contorno.** O traço tem 12 u
 * centradas na linha de centro do crânio (`geometria.ts:851`), a massa é clipada
 * nessa mesma linha, e SVG não tem `stroke-alignment` — zero ocorrências de
 * `stroke-alignment`, `paint-order` e `vector-effect` no repositório. Não existe
 * conserto por dentro do clip; foi por isso que a tentativa de pôr a massa por cima
 * DENTRO do clip só conseguiu levar a barra de 12 u a 6 u, e nunca a zero. (O campo
 * que ligava aquilo não existe mais — o achado é que fica, não o nome.)
 *
 * Conteúdo NÃO clipado desenhado depois cobre os 12 u inteiros. Este arquivo já usa
 * esse mecanismo em dois lugares — a linha `cabeca-pele`, onde o preenchimento opaco
 * da cabeça apaga o contorno do tronco, e as extensões de traje — sob a doutrina
 * declarada no topo: *a ordem resolve por oclusão, que é o mesmo mecanismo que o
 * estilo inteiro usa*. Os dois estão na tabela `PILHA` de `camadas.ts`, que é onde a
 * ordem mora. Máscara e filtro continuam vetados por escrito (doc 15 §7c item 17).
 *
 * ---------------------------------------------------------------------------
 * O QUE SAIU JUNTO
 * ---------------------------------------------------------------------------
 *
 * O ganho de simplificação só é real se o perdedor sair, e saíram quatro coisas: a
 * bandeira de massa por cima em `EstadoAvatar`, o `atras` da peça traçada, a
 * **sangria** da conversão e a **partição massa/extensão**. Os três donos possíveis
 * do contorno do cabelo viraram um: a própria peça.
 *
 * As formas saem num `<path>` só, com subpaths `M…Z M…Z` — o mesmo mecanismo de
 * `extensoesCabelo`. Multi-componente passa a ser representável sem custar uma
 * forma do orçamento por lóbulo. Medido na bancada do Bloco 3: a perda por
 * multi-componente foi de 3 165 u² a 1 u², e o composto ficou com 22 formas contra
 * 23 do arranjo anterior e 24 da alternativa que mantinha o clip.
 */
function pecaSobreposta(modelo: CabeloOuModelo | undefined): string {
  const nada = "";
  if (!modelo) return nada;
  const c = resolverCabelo(modelo);
  if (!c.massa) return nada;
  const desenhadas = [pathCabelo(modelo), ...(c.formas ?? []).map(pathExtensao)]
    .filter(Boolean)
    .join(" ");
  if (!desenhadas) return nada;
  const claro = pathCabeloClaro(modelo);

  // ------------------------------------------------------- a peça TRANSCRITA
  //
  // Quatro camadas de laços SIMPLES empilhadas, e é a doutrina que este arquivo já
  // declara lá em cima: **a ordem resolve por oclusão**. A banda preta visível é a
  // DIFERENÇA entre a camada 1 (a massa, cheia de tinta) e a camada 2 (o núcleo) —
  // não há `evenodd`, não há região com furo, e `bordaOrdenada` não muda.
  //
  // A camada 4 vem DEPOIS da clara de propósito: o traço interno mais aparece na
  // região iluminada, e emitido antes dela seria coberto justamente ali.
  //
  // `.kk-tinta` já é emitida em todo SVG, inclusive na careca — zero regra nova,
  // zero propriedade nova. E `.kk-cabelo-l` some sozinha, porque `temArco` já
  // gateia a regra por `linhas` existir e a peça transcrita não declara arcos.
  //
  // ---------------------------------------------------------------------------
  // A CAMADA 1 NÃO SE PARTE, E ISSO É O CONSERTO DE 2026-08-20
  // ---------------------------------------------------------------------------
  //
  // A camada 1 é uma silhueta PRETA CHEIA, e o que se vê dela é só o anel que o
  // núcleo não cobre: **o contorno de oclusão do cabelo**. Contra a pele ele é a
  // borda da peça; contra uma barba passando por baixo, ele é a aresta que diz onde
  // o cabelo acaba — e é a mesma coisa que um desenhista traça quando uma mecha
  // passa na frente de outra massa da mesma cor.
  //
  // Entre 2026-08-19 e 2026-08-20 esta função devolveu `{ fundo, frente }`, para que
  // `compor()` intercalasse a barba entre a camada 1 e as outras três e o anel não
  // caísse sobre ela. **A premissa era que esse anel media ~18 u e lia como barra.**
  //
  // `.scratch/largura-do-anel.ts` mediu, em 2026-08-20: **p50 11,7 u · p90 12,2 u**,
  // contra o `TRACO` de 12 u do compositor. Não é barra — é a espessura de linha de
  // todo o resto do boneco. Dos 12 733 px que a barba apagava, só 205 (1,6%) passam
  // de 16 u, e ficam num trecho de queixo em u x 181→353.
  //
  // O preço de tê-lo apagado foram os dois defeitos que o Doug pegou a olho em
  // 2026-08-20: o cabelo sem aresta sobre a barba, e — porque a linha preta era o
  // que separava os dois tons — o núcleo escuro do chanel (`--av-cabelo-s`)
  // encostando direto na massa clara da barba (`--av-cabelo`) por 489 px de costura,
  // de u x 156 a 424. Um defeito só, com dois sintomas.
  //
  // **A D17 continua de pé, e `cabeloPorCima` também.** A barba veste e o cabelo
  // cobre — o que voltou é o cabelo cobrir INTEIRO, contorno junto, em vez de só com
  // as camadas coloridas. `pecas-de-elenco.test.ts` cobra a ordem barba → silhueta
  // preta → núcleo colorido, e o comentário de lá guarda os números.
  const nucleo = pathCabeloNucleo(modelo);
  if (nucleo) {
    const pretas = pathCabeloPretas(modelo);
    return (
      `<path class="kk-tinta" d="${desenhadas}"/>` +
      `<path class="kk-cabelo-m" d="${nucleo}"/>` +
      (claro ? `<path class="kk-cabelo" d="${claro}"/>` : "") +
      (pretas ? `<path class="kk-tinta" d="${pretas}"/>` : "")
    );
  }

  // O traço vai por ÚLTIMO, e não junto com a massa: a clara é desenhada depois da
  // massa, então um traço emitido antes dela seria coberto em todo trecho onde as
  // duas se encostam. Ele é a borda externa da peça e fica acima do que a peça
  // pinta. `cabeloNoCranio` já usou a mesma ordem, num ramo para peça traçada que
  // ficou inalcançável e saiu em 2026-08-20 — hoje a razão vive só aqui.
  //
  // A família SINTETIZADA não tem camada preta cheia para separar: o preto dela é um
  // `stroke` (`kk-cabelo-l`), não um laço. Então ela vai inteira na frente, como
  // sempre foi. Medido, isso custa pouco: o `espetado` cobre **1,2%** da barba, e o
  // risco dele sobre esses 1,2% é um traço fino, não um anel de 12 u.
  const risco = pathCabeloLinhas(modelo) + (c.formas ?? []).map(pathExtensaoLinhas).join("");
  return (
    `<path class="kk-cabelo-m" d="${desenhadas}"/>` +
    (claro ? `<path class="kk-cabelo" d="${claro}"/>` : "") +
    (risco ? `<path class="kk-cabelo-l" d="${risco}"/>` : "")
  );
}

/**
 * As PEÇAS DE CIMA — chapéu e rosto (óculos, bigode, barba).
 *
 * Duas passadas da mesma lista, exatamente como `extensoes()` faz com a capa do
 * traje: primeiro todos os preenchimentos, depois todos os traços. Fazer as duas
 * forma a forma deixaria o traço de uma peça por baixo do preenchimento da
 * seguinte — e é justamente onde duas formas se encostam que a borda tem de ler.
 *
 * ---------------------------------------------------------------------------
 * SÃO DOIS MODOS, E O QUE ESCOLHE ENTRE ELES É SE A PEÇA RECOLORE
 * ---------------------------------------------------------------------------
 *
 * **`arte`** — um `.svg` de cor assada, colado por `<image>` como o traje já faz.
 * **Nenhuma passada de traço**, e isso não é esquecimento: a peça foi desenhada por
 * cima de um render do próprio boneco, na escala dele, então o traço que ela traz
 * **é** o traço do boneco. Emitir `kk-traco` por cima dela poria uma segunda borda
 * sobre a que já existe. É o caminho de chapéu, óculos e pet.
 *
 * **`formas`** — paths declarados, com o traço do compositor. É o caminho de quem
 * **recolore**, e hoje isso é a barba e mais ninguém: um traço assado num `.svg` é
 * preto fixo, e uma peça que muda de cor com o cabelo precisa da borda emitida aqui,
 * junto com o resto.
 *
 * ⚠️ **O traço de uma peça de `arte` fica sem rede, e por isso ele é medido.** No
 * traje, o contorno da própria peça saiu com p50 7,5 u contra os 12 u do boneco (o
 * achado **G17**: a extração entrega o miolo do traço onde ele coincide com o
 * contorno preto do tronco), e o que salva ali é o `<use class="kk-traco"/>` do
 * tronco, desenhado sempre. Chapéu, óculos e pet **não têm silhueta do compositor
 * por baixo** — a esteira mede a espessura de cada peça contra `TRACO` antes de ela
 * chegar ao catálogo.
 *
 * ---------------------------------------------------------------------------
 * NO MODO `formas`: DUAS PASSADAS, E O TRAÇO VEM DEPOIS DE TODO PREENCHIMENTO
 * ---------------------------------------------------------------------------
 *
 * Exatamente como `extensoes()` faz com a capa do traje: primeiro todos os
 * preenchimentos, depois todos os traços. Fazer as duas forma a forma deixaria o
 * traço de uma peça por baixo do preenchimento da seguinte — e é justamente onde
 * duas formas se encostam que a borda tem de ler.
 *
 * **A peça escolhe ONDE há traço, e é só isso que `semTraco` faz.** A segunda
 * passada pula as formas que o declaram — a espessura continua sendo a mesma para
 * todo mundo. Sem ele, uma peça de duas camadas é impossível de desenhar: o
 * núcleo de uma barba ganharia uma linha preta de 12 u no meio da massa, e uma
 * mecha de 6 u viraria blob. É o `FormaDaPeca.linhas` do cabelo em booleano, pela
 * razão idêntica que `cabelo.ts:128-141` já escreve.
 *
 * AUSENTE devolve string vazia — sem `<g>` vazio, sem nada. É a condição para o
 * SVG de hoje continuar saindo byte a byte, e o teste `pecas-de-elenco.test.ts`
 * cobra as TRÊS pontas: ausente não muda um byte, `formas` sai como sempre saiu, e
 * `arte` emite `<image>` sem um único `kk-traco`.
 *
 * ---------------------------------------------------------------------------
 * O TERCEIRO MODO: `formas` + `tom` — A SILHUETA VETOR, O CLARO-ESCURO RASTER
 * ---------------------------------------------------------------------------
 *
 * Quando a peça declara `tom` (ver `TomDaPeca` em `tipos.ts`), sai um `<defs>` com
 * um `<mask>` de luminosidade e ele veste a **ÚLTIMA** forma de preenchimento — a
 * de cima, a que carrega `var(--av-cabelo)`. Nunca o `kk-traco`: mascarar o
 * contorno o comeria pelas beiradas justamente onde ele existe para ler.
 *
 * **`ns` e `slot` são o que impede a colisão de id**, e por isso entraram na
 * assinatura em vez de virar constante: o `ranking` põe 30 bonecos num `<svg>` só, e
 * um mesmo boneco pode ter tom no rosto E no chapéu. `${ns}-tom-${slot}` é único nos
 * dois eixos, pelo mesmo motivo que `${ns}-fe` e `${ns}-fd` já são.
 *
 * **Sem `tom`, byte a byte o de sempre**: `defs` é string vazia e o atributo `mask`
 * não é escrito. É o que mantém os selos parados.
 */
function sobrepor(peca: PecaSobreposta | undefined, ns: string, slot: string): string {
  if (!peca) return "";
  // `k = 1` explícito: a peça de cabeça não tem `escalaMedida` e não vai ter — ela
  // ocupa o `viewBox` inteiro, que é o retângulo em que a esteira a recortou.
  if (peca.arte) return colarArte(peca.arte, 1);
  if (!peca.formas?.length) return "";
  // ⚠️ **`fill-rule="evenodd"`, e sem ele a peça APAGA O ROSTO.**
  //
  // O `d` de uma peça `formas` vem do potrace, e o potrace declara a regra na saída
  // dele: `<path stroke="none" fill="black" fill-rule="evenodd"/>`. A esteira extrai
  // só o `d` (`barba-para-formas.ts`), então quem tem de reemitir a regra é aqui.
  //
  // Sem ela o SVG cai no `nonzero`, que é o padrão — e `nonzero` **preenche os
  // buracos**. Numa barba que cerca a boca (bigode em ferradura mais queixo) a boca é
  // um buraco no laço, e ela some inteira: medido em 2026-08-20, **100% do traço do
  // sorriso virava barba** em `bigode-ferradura`, `cheia-com-bigode` e `rala`, com a
  // pele em volta indo de lum 183 a 77. O Doug viu na folha antes de qualquer régua.
  //
  // **O defeito ficou latente até existir um bigode:** `cheia` e `cavanhaque` não
  // cercam nada, e num laço sem buraco `evenodd` e `nonzero` desenham igual — por
  // isso as duas saem byte a byte iguais com esta linha e sem ela.
  const REGRA = ` fill-rule="evenodd"`;

  // A caixa da máscara é a MESMA no `<mask>` e no `<image>`: o `<mask>` a usa para
  // recortar a região de efeito, o `<image>` para se esticar dentro dela. Duas
  // grafias da mesma caixa é a divergência silenciosa que este arquivo evita em
  // todo lugar — daí a string sair de uma variável só.
  const tom = peca.tom;
  const idTom = `${ns}-tom-${slot}`;
  const caixa = tom
    ? ` x="${n(tom.x)}" y="${n(tom.y)}" width="${n(tom.w)}" height="${n(tom.h)}"`
    : "";
  const defs = tom
    ? `<defs><mask id="${idTom}" maskUnits="userSpaceOnUse"${caixa}>` +
      `<image href="data:image/png;base64,${attr(tom.png)}"${caixa} ` +
      `preserveAspectRatio="none"/></mask></defs>`
    : "";
  // A ÚLTIMA forma é a de cima — a da tinta. O tom veste ela e só ela.
  const ultima = peca.formas.length - 1;

  return (
    defs +
    peca.formas
      .map(
        (f, i) =>
          `<path d="${attr(f.d)}"${REGRA} fill="${f.cor}"` +
          (tom && i === ultima ? ` mask="url(#${idTom})"` : "") +
          `/>`,
      )
      .join("") +
    peca.formas
      .filter((f) => !f.semTraco)
      .map((f) => `<path class="kk-traco"${REGRA} d="${attr(f.d)}"/>`)
      .join("")
  );
}

/** Um olho. Cápsula vertical, com o `rx` fazendo as pontas semicirculares. */
function olho(cx: number, cy: number): string {
  return (
    `<rect class="kk-tinta kk-olho" x="${cx - OLHO.w / 2}" y="${cy - OLHO.h / 2}" ` +
    `width="${OLHO.w}" height="${OLHO.h}" rx="${OLHO.r}"/>`
  );
}

/**
 * Um gradiente vertical de duas ou três paradas, ao longo da altura das facetas.
 *
 * `gradientUnits="userSpaceOnUse"` porque as paradas são posições MEDIDAS em
 * unidades do `viewBox`, e não frações da caixa da forma: o queixo está a 8 unidades
 * do fundo da cabeça, não a 3% da altura de um path que se estende para fora do
 * desenho para o clip cortar. Com o padrão (`objectBoundingBox`) a rampa seguiria a
 * caixa do path folgado, e o queixo cairia no lugar errado.
 */
function gradiente(id: string, y0: number, y1: number, paradas: [number, string][]): string {
  return (
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ` +
    `x1="0" y1="${y0.toFixed(1)}" x2="0" y2="${y1.toFixed(1)}">` +
    paradas.map(([em, cor]) => `<stop offset="${em}" stop-color="${cor}"/>`).join("") +
    `</linearGradient>`
  );
}

/**
 * A composição inteira, como string de `<svg>`.
 *
 * Emite as custom properties no elemento raiz, o que faz o arquivo funcionar
 * sozinho (folha de contato, gate, embutido numa tag de imagem) e continuar
 * recolorível quando o app sobrescreve `--av-pele` mais acima na árvore.
 *
 * São **quatro sem cabelo e seis com** — `--av-cabelo` e `--av-cabelo-s` só saem
 * quando há modelo, para a base careca não pagar bytes por uma camada que ela não
 * tem (ver `estilo()` e o teto de regressão em `folha-base.ts`). Todas estão em
 * `PROPRIEDADES.avatar`, então `conferirSvg` aprova.
 *
 * **Cuidado com o que ele NÃO aprova:** o `conferirSvg` reprova propriedade a
 * MAIS, nunca a menos. Foi por isso que `--av-cabelo` ficou congelada na paleta
 * desde o Bloco 1 sem nunca ser emitida, e nada acusou até o 2a.1.
 *
 * **`estado.ns` é obrigatório, e isso é a trava e não uma chatice.** Ele tinha
 * um valor padrão (`"kk"`), e o padrão criava a colisão que ele existia para
 * impedir: a `folha-base.ts` compõe muitos renders no mesmo documento e todos
 * herdavam o mesmo prefixo, então os `clipPath` de um venciam os do outro. Ninguém
 * viu porque as geometrias eram idênticas — a colisão resolvia para o primeiro clip
 * e nada mudava na tela.
 *
 * Tirar o padrão faz o `typecheck` cobrar de quem compõe: de onde vem a
 * unicidade? É a mesma trava estrutural da `interface Traje`, pelo mesmo motivo
 * — mecanismo em vez de disciplina. O teste de DOM entra junto mesmo assim,
 * porque o tipo não impede alguém de passar a mesma string duas vezes.
 */
/**
 * ONDE A FIGURA COMEÇA E ACABA EM `y` — as duas pontas do que se desenha.
 *
 * `geometria.ts` não tem constante de "altura da figura": a extensão vertical é
 * emergente das tabelas, e é justamente por isso que encolher tem de ser
 * transformação externa e não ajuste de constante. Estas duas derivam do que já
 * está lá, sem número novo.
 *
 * O topo é a silhueta EXTERNA, não a linha de centro: o contorno tem 12 unidades
 * e é desenhado centrado, então meio traço mora acima de `CAIXA_CABECA.y0` —
 * a mesma conta de `CABECA_H_EXTERNA` e de `folha-base.ts:213`.
 *
 * O fim é a sombra do chão, não o pé do tronco. Ela é a última tinta do
 * documento, e ancorar no tronco deixaria a sombra pendurada para fora.
 */
const FIGURA_Y0 = CAIXA_CABECA.y0 - TRACO / 2;
const FIGURA_Y1 = SOMBRA_CHAO.cy + SOMBRA_CHAO.ry;

/**
 * QUANTO SOBRA EMBAIXO quando a figura encolhe — e por que não é proporcional.
 *
 * Encolher existe para ganhar espaço EM CIMA, para peça alta e para chapéu. Uma
 * redução proporcional devolveria metade do ganho para o rodapé, onde não há o
 * que caber. Então a figura é reancorada: a base pousa a esta distância do pé do
 * quadro e todo o resto do ganho vai para o topo.
 *
 * A 92% isto dá 119 unidades acima da coroa, contra as 45,5 de hoje.
 */
const FOLGA_BASE = 20;

/**
 * A ESCALA PADRÃO DA FIGURA: **92%**, e ela deixou de ser opcional em 2026-08-06.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O PADRÃO MUDOU
 * ---------------------------------------------------------------------------
 *
 * O `viewBox` deixa **45,5 unidades** acima da coroa, e a peça traçada da primeira
 * arte real sobe a **−38,9 u** — ou seja, 38,9 unidades ACIMA do topo do quadro. O
 * viewport corta ali sem erro e sem aviso (doc 14, T1.5): medido no render, a
 * tinta da peça crua a 100% começa em **y = 0,0**, que é a assinatura da
 * guilhotina. A 92% ela começa em **y = 33,0** e cabe.
 *
 * Enquanto isto era campo opcional ausente, o produto continuava cortando cabelo
 * alto em silêncio — e o silêncio é o problema, não o corte.
 *
 * ---------------------------------------------------------------------------
 * A BASE DE EDIÇÃO PEDE `escala: 1`, E ISSO É O QUE MANTÉM A ARTE JÁ GERADA
 * ---------------------------------------------------------------------------
 *
 * São dois conceitos no mesmo `compor()`, e agora os dois são explícitos:
 *
 *  - a **base de render** — o que o produto desenha, a 92%;
 *  - a **base de edição** — o que vai ao gerador, a 100%, com o sistema de
 *    coordenadas interno intacto para a arte voltar registrada.
 *
 * `base-oficial.ts` passa `escala: 1` com o motivo escrito ao lado. A amarra
 * mudou de natureza — era "o caminho não existe", virou "a base pede" — e por isso
 * ela ganhou um gate que roda sempre: `arte:escala` confere o hash do PNG da base
 * contra o manifesto, e `verify:arte` o executa.
 *
 * O mesmo vale para os gates de GEOMETRIA (`verify:pose`, `avatar:fidelidade`):
 * eles medem o sistema de coordenadas interno, que a escala não toca, então pedem
 * `escala: 1` de propósito. Encolher a figura antes de medir a pose seria medir a
 * régua, não o boneco.
 */
export const ESCALA_PADRAO = 0.92;

/**
 * ONDE UM PONTO DO SISTEMA INTERNO CAI NA TELA, dada a escala da composição.
 *
 * O `viewBox` continua sendo 500 × 700 e `geometria.ts` continua descrevendo o
 * boneco nele — mas com a figura reancorada e encolhida, o ponto `(x, y)` das
 * constantes **não está mais em `(x, y)` do quadro**. Quem quiser recortar um
 * close, posicionar uma seta ou desenhar uma guia sobre o render precisa desta
 * conta, e escrevê-la de novo em cada chamador é a segunda descrição da mesma
 * transformação — o defeito que este repositório evita por princípio.
 *
 * É exatamente a inversa do que `abre` emite, e as duas leem as mesmas três
 * constantes. A folha do Bloco 6 nasceu sem ela e o resultado foi medido: o
 * close recortava a largura da cabeça a 100% sobre um render a 92%, e a arte
 * sangrava para fora do quadro nos dois lados.
 */
export function naTela(
  p: { x?: number; y?: number },
  s: number = ESCALA_PADRAO,
): { x: number; y: number } {
  if (s === 1) return { x: p.x ?? 0, y: p.y ?? 0 };
  return {
    x: (VIEWBOX.w * (1 - s)) / 2 + (p.x ?? 0) * s,
    y: VIEWBOX.h - FOLGA_BASE - FIGURA_Y1 * s + (p.y ?? 0) * s,
  };
}

/**
 * A INVERSA DE `naTela`: onde um ponto do QUADRO cai no sistema interno.
 *
 * Ela existe pelo mesmo motivo que a direta: escrever a conta de novo em cada
 * chamador é a segunda descrição da mesma transformação. E existe AGORA por um
 * caso concreto — **um teto expresso em unidades de quadro, lido em unidades
 * internas.**
 *
 * `TETO_Y = 8` (`tracar-cabelo.ts`) diz *"a tinta da peça tem de começar 8
 * unidades abaixo do topo do QUADRO, senão o viewport come metade do traço"*.
 * Enquanto o produto entregava a 100% os dois sistemas coincidiam e ninguém
 * precisou distinguir. A 92% eles deixaram de coincidir: o topo do quadro passou
 * a ser `y = −72,4` em coordenada interna, e um teto de 8 comprime peça que caberia
 * com 80 unidades de sobra.
 *
 * As duas leem as mesmas três constantes, e `s === 1` é identidade nas duas —
 * porque a 100% `compor()` não emite transformação nenhuma.
 */
export function daTela(
  p: { x?: number; y?: number },
  s: number = ESCALA_PADRAO,
): { x: number; y: number } {
  if (s === 1) return { x: p.x ?? 0, y: p.y ?? 0 };
  return {
    x: ((p.x ?? 0) - (VIEWBOX.w * (1 - s)) / 2) / s,
    y: ((p.y ?? 0) - (VIEWBOX.h - FOLGA_BASE - FIGURA_Y1 * s)) / s,
  };
}

export function compor(estado: EstadoAvatar): string {
  const { ns, traje, animado = false, modeloCabelo } = estado;
  const pele = estado.pele;

  // ---------------------------------------------------- os dois modos de estilo
  //
  // AUSENTE é o modo de sempre, e isso não é cortesia com o legado: é o que os 11
  // selos de `parametrico-congelado.ts`, o teto de regressão da `folha-base.ts` e
  // os ~30 chamadores de `scripts/` medem. Uma bandeira que mudasse a saída padrão
  // moveria todos eles de uma vez, e o movimento não seria sobre o desenho.
  //
  // No modo folha, a raiz troca o `ns` pela classe fixa e ganha o interruptor da
  // animação. O que NÃO muda é o prefixo dos `id`: `${ns}-fe` e `${ns}-fd` são os
  // gradientes das facetas, e eles carregam o TOM DE PELE daquele boneco. Trinta
  // avatares com o mesmo `ns` sairiam todos com a pele do primeiro — a colisão do
  // §8 item 4, agora com consequência visível em vez de silenciosa.
  const folhaExterna = estado.folhaExterna === true;
  const classeRaiz = folhaExterna
    ? animado
      ? `${CLASSE_AVATAR} ${CLASSE_ANIMADO}`
      : CLASSE_AVATAR
    : ns;

  // ---------------------------------------------------------- os dois opcionais
  // Os dois são construídos para que AUSENTE signifique "a string de sempre". O
  // `escala === 1` cai no mesmo lugar que o campo ausente de propósito: não há
  // motivo para emitir um `<g transform>` que não transforma nada.
  const s = estado.escala ?? ESCALA_PADRAO;
  const abre =
    s === 1
      ? ""
      : `<g transform="translate(${n((VIEWBOX.w * (1 - s)) / 2)} ` +
        `${n(VIEWBOX.h - FOLGA_BASE - FIGURA_Y1 * s)}) scale(${s})">`;
  const fecha = s === 1 ? "" : `</g>`;

  // AS DUAS FAMÍLIAS SEGUEM CAMINHOS DIFERENTES, e é o `massa` que decide qual.
  //
  //  - **paramétrica** (`pontos`): dentro do clip da cabeça, como sempre. É o que
  //    os cinco modelos do catálogo são, e nada aqui os toca;
  //  - **traçada** (`massa`): peça sobreposta, depois do contorno, sem clip.
  const traçada = modeloCabelo ? Boolean(resolverCabelo(modeloCabelo).massa) : false;
  const cabeloNoLugarDeSempre = traçada ? "" : cabeloNoCranio(modeloCabelo);
  const sobreposta = traçada ? pecaSobreposta(modeloCabelo) : "";

  /**
   * O SLOT `rosto`, PARTIDO EM DUAS PASSADAS pelo `cabeloPorCima` da própria peça.
   *
   * É o mesmo idioma de `extensoes(traje, atras)` e `extensoesCabelo(modelo, atras)`
   * logo acima: uma função, chamada duas vezes, particionando por booleano. E existe
   * pela mesma razão que aqueles — o slot guarda peças com necessidades opostas de
   * camada, e a resposta é da PEÇA, nunca um `if` por item aqui dentro.
   *
   * `Boolean(...)` porque ausente e `false` têm de ser o mesmo, como em todo o resto
   * deste arquivo. Uma peça sem a bandeira sai por cima do cabelo, que é a ordem de
   * sempre — e é isso que mantém os selos byte a byte de pé.
   */
  const rosto = (sob: boolean) =>
    sobrepor(
      estado.rosto && Boolean(estado.rosto.cabeloPorCima) === sob ? estado.rosto : undefined,
      ns,
      "rosto",
    );
  const semSobrancelha = sobrancelhaEscondida(modeloCabelo);

  // As duas do cabelo entram SÓ quando há cabelo. `escurecer` sem fator é o 0,82 do
  // item 2.4, e o docstring dele já nomeia "embaixo da franja" como um dos três
  // lugares para que existe — este é o terceiro a usar a mesma régua.
  // AS DUAS DO CABELO SAEM QUANDO HÁ QUEM AS LEIA — e o cabelo não é o único leitor.
  //
  // A peça de rosto no modo `formas` **recolore com o cabelo** (D17: barba é cabelo),
  // e ela existe sem `modeloCabelo`: um aluno CARECA de barba continua tendo escolhido
  // a cor dela, porque `users.avatar_hair_color` é coluna própria e a careca é uma das
  // seis opções do seletor, não um caso de canto.
  //
  // ⚠️ **Enquanto isto dependia só de `modeloCabelo`, a barba do careca saía PRETA** —
  // `var(--av-cabelo, #262626)` caía na reserva —, e saía preta mesmo com loiro
  // escolhido. Os dois SVGs eram byte a byte iguais: a escolha do aluno não chegava ao
  // desenho, e nenhum gate media isso. `rosto-cor.test.ts` passa a medir.
  //
  // A peça de `arte` fica de fora de propósito: ela tem cor assada e não lê var
  // nenhuma (Regra Inviolável nº 4), então emitir para ela seria byte por nada.
  const recoloreComOCabelo = Boolean(modeloCabelo) || Boolean(estado.rosto?.formas?.length);
  const varsCabelo = recoloreComOCabelo
    ? `;--av-cabelo:${estado.cabelo};--av-cabelo-s:${escurecer(estado.cabelo)}`
    : "";
  const vars =
    `--av-traco:${TRACO};--av-linha:${LINHA};` +
    `--av-pele:${pele};--av-pele-s:${escurecer(pele, 0.88)}` +
    varsCabelo;

  // A rampa vai de uma âncora de medição à outra, e não de ponta a ponta do path.
  // `spreadMethod` padrão é `pad`, então acima e abaixo das âncoras o tom segura —
  // que é o que a referência mostra, e o contrário de extrapolar tom onde não houve
  // o que medir.
  const { yAmostraTopo, yAmostraBase, yQueixo, yFundo } = FAIXA_FACETA;
  const emT = (y: number) =>
    Number(((y - yAmostraTopo) / (yFundo - yAmostraTopo)).toFixed(3));
  /** Onde o queixo começa, em fração da rampa. As duas paradas ali fazem a ARESTA. */
  const tQ = emT(yQueixo);
  const tB = emT(yAmostraBase);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" ` +
    `class="${classeRaiz}" style="${vars}">` +
    (folhaExterna ? "" : `<style>${estilo(ns, animado, modeloCabelo)}</style>`) +
    `<defs>` +
    `<path id="${ns}-p-cabeca" d="${pathCabeca()}"/>` +
    `<path id="${ns}-p-tronco" d="${pathTronco()}"/>` +
    `<clipPath id="${ns}-c-cabeca"><use href="#${ns}-p-cabeca"/></clipPath>` +
    `<clipPath id="${ns}-c-tronco"><use href="#${ns}-p-tronco"/></clipPath>` +
    `<radialGradient id="${ns}-sombra">` +
    SOMBRA_CHAO.paradas
      .map(
        (p) => `<stop offset="${p.em}" stop-color="${LINHA}" stop-opacity="${p.opacidade}"/>`,
      )
      .join("") +
    `</radialGradient>` +
    // A faceta esquerda leva QUATRO paradas porque ela carrega o queixo junto, e
    // porque a fronteira entre os dois é uma ARESTA e não uma rampa. Duas paradas no
    // mesmo `offset` é como um gradiente escreve um degrau: acima dele a lateral
    // termina em -28,4, abaixo o queixo começa em -35,6, e não há transição. Uma
    // terceira parada só, interpolando até o fundo, deixaria o queixo com o tom da
    // lateral em quase toda a sua altura — foi o que o gate mediu (-25,0 onde a
    // referência tem -35,6) na primeira rodada.
    gradiente(`${ns}-fe`, yAmostraTopo, yFundo, [
      [0, tomPele(pele, FACETAS.esq.deltaTopo)],
      [tB, tomPele(pele, FACETAS.esq.deltaBase)],
      [tQ, tomPele(pele, FACETAS.esq.deltaBase)],
      [tQ, tomPele(pele, FACETAS.queixo.delta)],
      [1, tomPele(pele, FACETAS.queixo.delta)],
    ]) +
    gradiente(`${ns}-fd`, yAmostraTopo, yAmostraBase, [
      [0, tomPele(pele, FACETAS.dir.deltaTopo)],
      [1, tomPele(pele, FACETAS.dir.deltaBase)],
    ]) +
    `</defs>` +
    abre +
    sombraChao(ns) +
    `<g class="kk-respira">` +
    extensoes(traje, true) +
    `<g clip-path="url(#${ns}-c-tronco)">${tintaTronco(ns, traje)}</g>` +
    // O CONTORNO DO TRONCO É SEMPRE DESENHADO, e a tentativa de tirá-lo quando há
    // arte foi REVERTIDA por decisão do Doug em 2026-08-12: *"regrediu e muito,
    // deixa a borda como estava"*.
    //
    // O que se tentou: com a arte por cima, o traço do tronco parecia brigar com o
    // contorno do PNG, e a ideia era dar preferência ao PNG. Reprovado na tela.
    // A régua explica por quê — sem este traço a borda cai para p50 7,5 u, com
    // metade do perímetro abaixo de 8 u, contra os 11,7 u limpos que ele entrega.
    // Reconstruí-lo dentro do PNG por um anel foi pior ainda: 15,0 u, um quarto
    // mais pesado que o contorno da cabeça, e o Doug pegou a olho.
    //
    // A fina do contorno da arte fica REGISTRADA como achado, não consertada aqui.
    `<use href="#${ns}-p-tronco" class="kk-traco"/>` +
    // A ARTE DO TRAJE ENTRA AQUI, depois do contorno do tronco e antes da cabeça.
    //
    // Depois do contorno porque onde a roupa transborda é o traço DELA que vira a
    // borda externa; antes da cabeça porque a cabeça é opaca, vem por cima, e é o
    // que faz a gola sumir atrás do queixo em vez de flutuar sobre ele.
    //
    // Vazia quando não há `tinta.arte` — nenhum byte muda no boneco de sempre.
    arteDoTraje(traje) +
    extensoesCabelo(modeloCabelo, true) +
    `<use href="#${ns}-p-cabeca" class="kk-pele"/>` +
    `<g clip-path="url(#${ns}-c-cabeca)">` +
    `<path d="${pathFacetaEsq()}" fill="url(#${ns}-fe)"/>` +
    `<path d="${pathFacetaDir()}" fill="url(#${ns}-fd)"/>` +
    cabeloNoLugarDeSempre +
    // O ESPECULAR PASSOU A SER DESENHADO DEPOIS DO CABELO, e a base careca não
    // mudou um byte com isso — a camada some quando não há modelo, e a ordem entre
    // as facetas e a luz continua a mesma.
    //
    // A mancha mora em (139,9 · 93,4), que é ACIMA da franja dos cinco modelos: com
    // cabelo, ela cai inteira sobre o cabelo. É o certo, e de graça — ela é
    // `#FFFFFF` com opacidade, não uma cor, então clareia a superfície que estiver
    // ali, seja pele em 8 tons ou cabelo em 8. Desenhada antes, seria um brilho de
    // pele por baixo de um cabelo opaco: invisível, e a cabeça perderia o ponto de
    // luz justamente nos avatares que têm cabelo, que são todos.
    `<path class="kk-luz" d="${pathEspecular()}"/>` +
    `</g>` +
    `<use href="#${ns}-p-cabeca" class="kk-traco"/>` +
    extensoesCabelo(modeloCabelo, false) +
    olho(OLHO_CX_ESQ, OLHO_CY_ESQ) +
    olho(OLHO_CX_DIR, OLHO_CY_DIR) +
    // AS SOBRANCELHAS NÃO PISCAM E NÃO RESPIRAM DE FORMA PRÓPRIA. Elas ficam fora da
    // classe `kk-olho` de propósito: o `scaleY(.08)` do piscar numa sobrancelha a
    // achataria junto com o olho, e uma sobrancelha que encolhe quando o olho fecha
    // lê como careta, não como piscada. Elas sobem e descem com o respiro porque
    // estão dentro de `kk-respira`, que move a figura inteira — isso é a figura
    // flutuando, e é o certo.
    // A SOBRANCELHA COBERTA PELO CABELO NÃO É DESENHADA — e isso é o par da ordem
    // de camadas acima, não uma segunda solução para o mesmo problema.
    //
    // A ordem resolve a parte de baixo: o cabelo tapa o que está sob ele. O que ela
    // não resolve é o RESTO — na `entrada-2` a massa cobre 97,6% da sobrancelha
    // esquerda e sobravam 19 px da ponta interna. Medido em close a 4×, esse resto
    // não lia como sobrancelha: lia como **rebarba no contorno do cabelo**, uma quina
    // reta encostada no preto, sem afilar e sem pele em volta. Tapar quase toda
    // ficava pior que tapar nenhuma.
    //
    // `sobrancelhaEscondida` é medida, não declarada por peça: um cabelo novo entra
    // no catálogo e a régua responde sozinha. Hoje ela devolve `false` para as sete
    // peças do catálogo — nenhuma alcança a testa — e `true` só para a esquerda da
    // `entrada-2`. É por isso que isto **não move o render de nenhuma peça
    // promovida**, e os selos byte a byte cobram essa imobilidade.
    (semSobrancelha.esq
      ? ""
      : `<path class="kk-risco" stroke-width="${SOBRANCELHA.espessura}" d="${pathSobrancelha(OLHO_CX_ESQ, OLHO_CY_ESQ)}"/>`) +
    (semSobrancelha.dir
      ? ""
      : `<path class="kk-risco" stroke-width="${SOBRANCELHA.espessura}" d="${pathSobrancelha(OLHO_CX_DIR, OLHO_CY_DIR)}"/>`) +
    `<path class="kk-risco" stroke-width="${BOCA.espessura}" d="${pathBoca()}"/>` +
    // A PEÇA SOBREPOSTA ENTRA AQUI — DEPOIS DAS FEIÇÕES, e a posição é o conserto
    // de um defeito medido em 2026-08-08.
    //
    // Ela ficava logo após o contorno da cabeça, antes dos olhos. A posição vinha da
    // lista de camadas do topo deste arquivo, escrita quando cabelo só existia na
    // família PARAMÉTRICA — e ali ele vive **dentro do clip do crânio**, então nunca
    // alcança a sobrancelha e a ordem não importava. A peça sobreposta nasceu depois,
    // fora de todo clip, podendo cobrir a testa; as feições nunca foram remexidas.
    //
    // O que se via: na `entrada-2` (Assimétrico), **315 dos 753 px visíveis de
    // sobrancelha — 41,8% — eram pintados EM CIMA do cabelo**. Nas outras peças o
    // defeito não aparecia porque a massa delas não chega à sobrancelha: `chanel`,
    // `espetado`, `curto` e a base careca medem 0 px. É por isso que mover isto **não
    // muda o render de nenhuma delas**, e o gate abaixo cobra exatamente essa
    // imobilidade.
    //
    // A razão que a posição antiga alegava continua honrada: a peça precisa vir
    // depois do `<use ... class="kk-traco"/>` da cabeça para o traço do crânio sumir
    // por oclusão. Depois das feições é **ainda mais tarde** — a oclusão continua.
    // A BARBA VESTE PRIMEIRO, E O CABELO VEM POR CIMA — pedido do Doug, 2026-08-19.
    //
    // *"A camada barba veste, depois a camada cabelo deve vir e cobrir a barba (se
    // houver o que cobrir)"*. A folha de contato da `rosto-barba-cheia` mostrou o
    // avesso disso: a serrilha da barba cortava a curva lisa do `chanel`.
    //
    // **Isto não reabre a D17.** A fusão entre barba e cabelo continua aceita — o
    // que muda é quem vence a sobreposição, não se ela existe.
    //
    // ⚠️ **Só alcança o cabelo TRAÇADO.** O paramétrico (`coque`, `moicano`) mora
    // dentro do clip do crânio, lá em cima, e a barba continua por cima dele com
    // bandeira ou sem. Hoje não produz defeito porque nenhum dos dois desce ao
    // queixo; no dia em que um descer, a causa está aqui e não na peça.
    rosto(true) +
    sobreposta +
    // O RESTO DO ROSTO — o que NÃO declarou `cabeloPorCima`, e é o óculos.
    //
    // A linha `rosto-sobre-cabelo` de `camadas.ts`. Ela e a `rosto-sob-cabelo` acima
    // são o MESMO slot em dois lugares da pilha, e é por isso que compartilham
    // marcador no gate — ver `MESMO_MARCADOR` em `pilha-de-camadas.test.ts`.
    //
    // Óculos por cima do cabelo: sem haste (decisão do Doug, doc 21 §2c) não há o
    // que apoiar, e a lente é livre para exceder o rosto. Posta ANTES do cabelo,
    // uma franja tapava a peça que a criança desbloqueou — hoje isso não
    // aconteceria (a massa de `chanel`, `espetado` e `curto` mede 0 px sobre a
    // sobrancelha), mas a peça que aparece é a que ela escolheu, e essa ordem não
    // depende de qual cabelo está por baixo.
    //
    // ⚠️ Esta linha dizia "ROSTO E CHAPÉU ENTRAM DEPOIS DO CABELO" e valia para o
    // slot inteiro. Deixou de valer em 2026-08-19: metade dele sobe, e a metade que
    // sobe é a barba — ver o `rosto(true)` acima.
    rosto(false) +
    // O CHAPÉU, e ele NÃO participa da partição acima.
    //
    // ⚠️ **ELE NÃO É O ÚLTIMO, e este comentário já afirmou que era.** Logo abaixo
    // vem `extensoes(traje, false)`: uma ombreira ou fecho de capa pinta POR CIMA da
    // aba do chapéu. As duas afirmações não podiam ser verdadeiras ao mesmo tempo, e
    // quem escrevia "CHAPÉU POR ÚLTIMO" aqui era a prosa, não o código.
    //
    // A contradição está **registrada, não consertada**: `emDisputa` na linha
    // `traje-extensoes-frente` de `camadas.ts` guarda as duas leituras. Ela é INERTE
    // até a primeira capa — nenhum traje do catálogo declara `extensoes`, e
    // `extensoes(undefined, false)` devolve string vazia —, e não se decide sem peça
    // na mão. O gate trava a posição de hoje.
    //
    // O que continua verdadeiro: ele disputa o crânio e vence, que é o que "esconde
    // o cabelo" quer dizer. A regra fina — mostra tudo, esconde tudo — mora no ITEM e
    // não aqui (`escondeCabelo`), e é decisão obrigatória ANTES do primeiro chapéu,
    // no Bloco 7. Este arquivo só garante o lugar.
    //
    // **Por que ele não passa por `rosto()`, e não é descuido.** Se a partição fosse
    // um parâmetro de `sobrepor()`, esta chamada viraria `sobrepor(estado.chapeu,
    // false)` — e um chapéu que um dia declarasse `cabeloPorCima: true` **sumiria do
    // boneco em silêncio**, porque nenhuma das duas passadas o emitiria. Filtrando
    // só do lado do rosto, a bandeira num chapéu é inerte em vez de fatal.
    // `pecas-de-elenco.test.ts` cobra exatamente isso.
    sobrepor(estado.chapeu, ns, "chapeu") +
    extensoes(traje, false) +
    `</g>` +
    fecha +
    `</svg>`
  );
}
