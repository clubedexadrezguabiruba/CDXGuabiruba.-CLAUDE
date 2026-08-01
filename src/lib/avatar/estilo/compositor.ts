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
 * A solução não precisa de máscara. A ordem abaixo resolve por oclusão, que é o
 * mesmo mecanismo que o estilo inteiro usa:
 *
 *   1. sombra do chão            (fora do grupo que respira)
 *   2. extensões traseiras       (a parte de trás de uma capa)
 *   3. tronco: base opaca → tinta do traje (clipada) → decoração →
 *      **sombra projetada da cabeça** → planos laterais
 *   4. **contorno do tronco**
 *   5. cabeça: preenchimento OPACO — cobre o topo do tronco e o contorno dele
 *   6. facetas e especular, dentro do clip da cabeça
 *   7. **contorno da cabeça**
 *   8. olhos, sobrancelhas e boca
 *   9. extensões frontais        (fecho de capa, ombreira) + contorno
 *
 * **A lista encurtou no Bloco 1d.** Saíram a orelha direita (que era um passo
 * próprio, com preenchimento e contorno) e a concha da orelha esquerda: a arte nova
 * não tem orelhas, e o motivo é de catálogo — orelha na base obriga cada um dos 92
 * itens de chapéu e cabelo a decidir se cobre ou não. Entraram as sobrancelhas e a
 * boca, no mesmo passo dos olhos, porque são a mesma natureza de peça: tinta da cor
 * do contorno, por cima do contorno da cabeça, fora de todo clip.
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
  CABELOS,
  pathCabelo,
  pathCabeloClaro,
  pathExtensao,
  type ModeloCabelo,
} from "./cabelo";
import {
  BOCA,
  FACETAS,
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
import type { EstadoAvatar, Traje } from "./tipos";

/**
 * O CSS da composição.
 *
 * NENHUM COMENTÁRIO AQUI DENTRO. Um `/* ... *​/` dentro de `<style>` já fez o
 * Chromium descartar em silêncio todas as regras seguintes neste projeto, e
 * `conferirSvg` reprova. As explicações moram nos comentários de TypeScript.
 *
 * O piscar usa `transform-box: fill-box`, que faz `transform-origin: center`
 * significar o centro da própria forma — assim os dois olhos compartilham UMA
 * regra em vez de uma origem escrita à mão para cada. E o estado base é
 * `scaleY(1)`: sem animação (motor pausado, `prefers-reduced-motion`,
 * screenshot de gate) o olho fica ABERTO. A folhinha ensinou isso pelo caminho
 * caro — pálpebra que nasce fechada entrega um boneco cego na folha de contato.
 */
function estilo(ns: string, animado: boolean, temCabelo: boolean): string {
  const respiro = animado
    ? `.${ns} .kk-respira{animation:${ns}-respira 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
      `.${ns} .kk-sombra{animation:${ns}-sombra 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
      `.${ns} .kk-olho{animation:${ns}-pisca 5.2s ease-in-out infinite}` +
      `@keyframes ${ns}-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}` +
      `@keyframes ${ns}-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}` +
      `@keyframes ${ns}-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}` +
      `@media(prefers-reduced-motion:reduce){.${ns} .kk-respira,.${ns} .kk-sombra,.${ns} .kk-olho{animation:none}}`
    : "";

  // AS TRÊS REGRAS DO CABELO SÓ SAEM QUANDO HÁ CABELO, como o `respiro`.
  //
  // Não é economia de byte por esporte: o teto da base é de REGRESSÃO (7 418, o
  // valor medido no Bloco 1d), e regra emitida à toa faria a base careca crescer
  // para pagar uma camada que ela não tem. O mesmo vale para as duas custom
  // properties lá embaixo.
  //
  // São três e não duas porque o cabelo tem três papéis de tinta: a camada de baixo
  // é escura E carrega o contorno (é a borda dela que vira a linha da franja), a de
  // cima é clara e não tem contorno nenhum (um traço ali riscaria o meio do cabelo),
  // e a extensão é clara COM contorno, porque ela é a borda externa da figura onde
  // passa do crânio.
  const cabelo = temCabelo
    ? `.${ns} .kk-cabelo{fill:var(--av-cabelo)}` +
      `.${ns} .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);` +
      `stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}` +
      `.${ns} .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);` +
      `stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}`
    : "";

  return (
    `.${ns} .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);` +
    `stroke-linejoin:round;stroke-linecap:round}` +
    cabelo +
    `.${ns} .kk-pele{fill:var(--av-pele)}` +
    `.${ns} .kk-pele-s{fill:var(--av-pele-s)}` +
    `.${ns} .kk-tinta{fill:var(--av-linha)}` +
    // O RISCO: sobrancelha e boca. É `stroke` e não `fill` porque as duas são
    // cápsulas, e uma cápsula é o que `stroke-linecap:round` desenha de graça — sem
    // path fechado, sem `transform` para inclinar, sem caso especial para a curva do
    // sorriso. A espessura de cada uma vai no elemento: são duas medidas diferentes
    // (8,2 e 5,3) e uma classe por medida custaria mais que o atributo.
    `.${ns} .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}` +
    `.${ns} .kk-luz{fill:#FFFFFF;opacity:.30}` +
    `.${ns} .kk-olho{transform-box:fill-box;transform-origin:center}` +
    respiro
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
 *  3. **Traje com PNG:** a imagem entra por `<image>`, escalada pela
 *     `escalaMedida` do auto-ajuste em torno do centro do tronco, POR CIMA da
 *     cor chapada. A cor continua embaixo: se a tinta tiver furo, aparece cor de
 *     traje, nunca transparência.
 *
 * A **sombra projetada da cabeça** entra por último, depois da arte do traje: ela é
 * sombra de contato e cai sobre o que estiver ali, seja o macacão bege ou o uniforme
 * de General. Pintá-la antes da arte a apagaria justamente nos trajes que têm PNG.
 *
 * Tudo isto vive dentro do `clipPath` do tronco, aplicado por quem chama. O que
 * excede o clip é cortado — e exceder é o comportamento EXIGIDO, não o defeito.
 */
function tintaTronco(ns: string, traje: Traje | undefined): string {
  const cor = traje?.tinta.cor ?? TRAJE_BASE.roupa;
  let out = `<use href="#${ns}-p-tronco" fill="${cor}"/>`;

  if (traje?.tinta.png) {
    const k = traje.escalaMedida ?? 1;
    const w = VIEWBOX.w * k;
    const h = VIEWBOX.h * k;
    const dx = (VIEWBOX.w - w) / 2;
    const dy = (VIEWBOX.h - h) / 2;
    out +=
      `<image href="${attr(traje.tinta.png)}" x="${dx.toFixed(2)}" y="${dy.toFixed(2)}" ` +
      `width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  for (const dec of traje?.decoracao ?? []) {
    out +=
      `<path d="${attr(dec.d)}" fill="${dec.fill ?? "none"}"` +
      (dec.stroke ? ` stroke="${dec.stroke}" stroke-width="4" stroke-linejoin="round"` : "") +
      `/>`;
  }

  out +=
    `<path d="${pathSombraQueixoTronco()}" ` +
    `fill="${escurecer(cor, fatorDeTom(FACETAS.sombraQueixo.delta, FACETAS.PLATO_TRONCO))}"/>`;
  out += `<path d="${pathPlanoLateralTronco()}" fill="${escurecer(cor, 0.9)}" opacity=".42"/>`;
  return out;
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
 */
function cabeloNoCranio(modelo: ModeloCabelo | undefined): string {
  if (!modelo) return "";
  const escuro = pathCabelo(modelo);
  // O moicano não tem touca — ele é só extensão. Emitir dois `<path d="">` vazios
  // custaria duas formas do orçamento para desenhar nada.
  if (!escuro) return "";
  return (
    `<path class="kk-cabelo-s" d="${escuro}"/>` +
    `<path class="kk-cabelo" d="${pathCabeloClaro(modelo)}"/>`
  );
}

/**
 * As extensões do cabelo: coque, trança, crista, volume de cacho.
 *
 * Mesma natureza das extensões de traje — elas EXCEDEM a silhueta, então têm forma
 * própria e contorno próprio, emitido aqui e não pela peça. `atras` põe a forma sob
 * a cabeça, e é o que faz um coque parecer preso atrás em vez de colado na testa: a
 * cabeça é opaca e come a emenda, oclusão em vez de máscara.
 */
function extensoesCabelo(modelo: ModeloCabelo | undefined, atras: boolean): string {
  if (!modelo) return "";
  const lista = (CABELOS[modelo].extensoes ?? []).filter((e) => Boolean(e.atras) === atras);
  return lista.map((e) => `<path class="kk-cabelo-e" d="${pathExtensao(e)}"/>`).join("");
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
 * sozinho (folha de contato, gate, `<img>`) e continuar recolorível quando o app
 * sobrescreve `--av-pele` mais acima na árvore. Todas as quatro estão em
 * `PROPRIEDADES.avatar`, então `conferirSvg` aprova.
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
export function compor(estado: EstadoAvatar): string {
  const { ns, traje, animado = false, modeloCabelo } = estado;
  const pele = estado.pele;

  // As duas do cabelo entram SÓ quando há cabelo. `escurecer` sem fator é o 0,82 do
  // item 2.4, e o docstring dele já nomeia "embaixo da franja" como um dos três
  // lugares para que existe — este é o terceiro a usar a mesma régua.
  const varsCabelo = modeloCabelo
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
    `class="${ns}" style="${vars}">` +
    `<style>${estilo(ns, animado, Boolean(modeloCabelo))}</style>` +
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
    sombraChao(ns) +
    `<g class="kk-respira">` +
    extensoes(traje, true) +
    `<g clip-path="url(#${ns}-c-tronco)">${tintaTronco(ns, traje)}</g>` +
    `<use href="#${ns}-p-tronco" class="kk-traco"/>` +
    extensoesCabelo(modeloCabelo, true) +
    `<use href="#${ns}-p-cabeca" class="kk-pele"/>` +
    `<g clip-path="url(#${ns}-c-cabeca)">` +
    `<path d="${pathFacetaEsq()}" fill="url(#${ns}-fe)"/>` +
    `<path d="${pathFacetaDir()}" fill="url(#${ns}-fd)"/>` +
    cabeloNoCranio(modeloCabelo) +
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
    `<path class="kk-risco" stroke-width="${SOBRANCELHA.espessura}" d="${pathSobrancelha(OLHO_CX_ESQ, OLHO_CY_ESQ)}"/>` +
    `<path class="kk-risco" stroke-width="${SOBRANCELHA.espessura}" d="${pathSobrancelha(OLHO_CX_DIR, OLHO_CY_DIR)}"/>` +
    `<path class="kk-risco" stroke-width="${BOCA.espessura}" d="${pathBoca()}"/>` +
    extensoes(traje, false) +
    `</g>` +
    `</svg>`
  );
}
