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
 *    decorativa por cima. Pode errar ±2 unidades — o traço de 17 cobre, e não há
 *    transparência embaixo para vazar.
 *
 * A regra 2, também em código: **a base é pintada inteira e opaca por baixo de
 * tudo; o traje pinta por cima e o clip corta.** É o modelo sangria + faca de
 * corte da gráfica. Um furo na tinta do traje mostra a cor da base — visível na
 * folha e medido pelo gate (a) — e nunca transparência. Os 2909 px de furo do
 * pipeline morto deixam de ser uma classe de defeito possível.
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
 *   3. tronco: base opaca → tinta do traje (clipada) → decoração → plano lateral
 *   4. **contorno do tronco**
 *   5. orelhas: preenchimento + contorno
 *   6. cabeça: preenchimento OPACO — cobre o topo do tronco e o contorno dele
 *   7. **contorno da cabeça**
 *   8. plano lateral da pele, especular, olhos
 *   9. extensões frontais        (fecho de capa, ombreira) + contorno
 *
 * A folga da oclusão encolheu nesta rodada, e é deliberado: com a cabeça fiel à
 * referência, a base dela mede 241 unidades de silhueta externa contra 227 do
 * ombro. Seriam 7 unidades de cobertura por lado; a `FOLGA_PROJETO` de 5% no
 * tronco leva para 13. Continua sendo sobreposição opaca, com a cabeça sempre
 * ganhando no z-order — e onde os dois contornos quase encostam o que se vê é um
 * traço um pouco mais grosso, que é o que a referência também mostra.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO NÃO FAZ
 * ---------------------------------------------------------------------------
 *
 * Não recorta, não dilata, não erode, não registra e não compara silhuetas. As
 * ~2.400 linhas que faziam isso (`gerar-base-recolorivel` 689, `mascara-base` 782,
 * `gerar-uniforme` 826) existiam para RECUPERAR uma fronteira que morava dentro
 * de uma imagem. Aqui a fronteira é escrita, então não há o que recuperar.
 *
 * Erosão e dilatação continuam existindo no Bloco 2 — mas lá são instrumento de
 * MEDIÇÃO do gate, e nunca reconstroem asset. É a diferença que matou o pipeline
 * anterior.
 */

import { LINHA, TRAJE_BASE, escurecer } from "../palette";
import {
  CABECA,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  ORELHA,
  ORELHA_CX_DIR,
  ORELHA_CX_ESQ,
  SOMBRA_CHAO,
  TRACO,
  VIEWBOX,
  pathCabeca,
  pathEspecular,
  pathPlanoLateralCabeca,
  pathPlanoLateralTronco,
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
function estilo(ns: string, animado: boolean): string {
  const respiro = animado
    ? `.${ns} .kk-respira{animation:${ns}-respira 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
      `.${ns} .kk-sombra{animation:${ns}-sombra 3.5s ease-in-out infinite;transform-origin:${SOMBRA_CHAO.cx}px ${SOMBRA_CHAO.cy}px}` +
      `.${ns} .kk-olho{animation:${ns}-pisca 5.2s ease-in-out infinite}` +
      `@keyframes ${ns}-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}` +
      `@keyframes ${ns}-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}` +
      `@keyframes ${ns}-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}` +
      `@media(prefers-reduced-motion:reduce){.${ns} .kk-respira,.${ns} .kk-sombra,.${ns} .kk-olho{animation:none}}`
    : "";

  return (
    `.${ns} .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);` +
    `stroke-linejoin:round;stroke-linecap:round}` +
    `.${ns} .kk-pele{fill:var(--av-pele)}` +
    `.${ns} .kk-pele-s{fill:var(--av-pele-s)}` +
    `.${ns} .kk-tinta{fill:var(--av-linha)}` +
    `.${ns} .kk-luz{fill:#FFFFFF;opacity:.30}` +
    `.${ns} .kk-olho{transform-box:fill-box;transform-origin:center}` +
    respiro
  );
}

/** Escapa o que vai para dentro de um atributo XML. */
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/**
 * A SOMBRA DO CHÃO — UMA elipse com `radialGradient`.
 *
 * Eram três elipses concêntricas, e a justificativa escrita era falsa: "gradiente
 * exige `id`, e `id` colide". O SVG já emite `id` (dois `clipPath`) e já os
 * namespaceia — recusar gradiente por causa de `id` era inconsistente com o
 * próprio arquivo. O argumento caiu e a solução melhor entrou.
 *
 * O que continua valendo é a recusa ao `<filter>`, por outro motivo: são **30
 * bonecos a 56 px no ranking**, e 30 `feGaussianBlur` numa lista é custo de GPU
 * real em mobile. Um gradiente é interpolação de cor, não convolução.
 *
 * E o ganho é dobrado: o gradiente é mais suave que a rampa de três degraus *e*
 * **baixa** a contagem de formas de 18 para 16, o que é justamente a folga que os
 * dois planos laterais novos consomem.
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
 * Tudo isto vive dentro do `clipPath` do tronco, aplicado por quem chama. O que
 * excede o clip é cortado — e exceder é o comportamento EXIGIDO, não o defeito.
 */
function tintaTronco(traje: Traje | undefined): string {
  const cor = traje?.tinta.cor ?? TRAJE_BASE.roupa;
  let out = `<path d="${pathTronco()}" fill="${cor}"/>`;

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

/** Um olho. Cápsula vertical, com o `rx` fazendo as pontas semicirculares. */
function olho(cx: number, cy: number): string {
  return (
    `<rect class="kk-tinta kk-olho" x="${cx - OLHO.w / 2}" y="${cy - OLHO.h / 2}" ` +
    `width="${OLHO.w}" height="${OLHO.h}" rx="${OLHO.r}"/>`
  );
}

/** Uma orelha, com o centro recuado para dentro da cabeça pela `GIRO.saliencia`. */
function orelha(cx: number, classe: string): string {
  return (
    `<ellipse class="${classe}" cx="${cx}" cy="${ORELHA.cy}" ` +
    `rx="${ORELHA.rx}" ry="${ORELHA.ry}"/>`
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
 * impedir: a `folha-base.ts` compõe NOVE renders no mesmo documento (4 tamanhos
 * + 5 closes) e todos herdavam o mesmo prefixo, então os `clipPath` de um
 * venciam os do outro. Ninguém viu porque as nove geometrias eram idênticas — a
 * colisão resolvia para o primeiro clip e nada mudava na tela.
 *
 * Tirar o padrão faz o `typecheck` cobrar de quem compõe: de onde vem a
 * unicidade? É a mesma trava estrutural da `interface Traje`, pelo mesmo motivo
 * — mecanismo em vez de disciplina. O teste de DOM entra junto mesmo assim,
 * porque o tipo não impede alguém de passar a mesma string duas vezes.
 */
export function compor(estado: EstadoAvatar): string {
  const { ns, traje, animado = false } = estado;
  const idTronco = `${ns}-clip-tronco`;
  const idCabeca = `${ns}-clip-cabeca`;

  const vars =
    `--av-traco:${TRACO};--av-linha:${LINHA};` +
    `--av-pele:${estado.pele};--av-pele-s:${escurecer(estado.pele, 0.88)}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" ` +
    `class="${ns}" style="${vars}">` +
    `<style>${estilo(ns, animado)}</style>` +
    `<defs>` +
    `<clipPath id="${idTronco}"><path d="${pathTronco()}"/></clipPath>` +
    `<clipPath id="${idCabeca}"><path d="${pathCabeca()}"/></clipPath>` +
    `<radialGradient id="${ns}-sombra">` +
    SOMBRA_CHAO.paradas
      .map(
        (p) =>
          `<stop offset="${p.em}" stop-color="${LINHA}" stop-opacity="${p.opacidade}"/>`,
      )
      .join("") +
    `</radialGradient>` +
    `</defs>` +
    sombraChao(ns) +
    `<g class="kk-respira">` +
    extensoes(traje, true) +
    `<g clip-path="url(#${idTronco})">${tintaTronco(traje)}</g>` +
    `<path class="kk-traco" d="${pathTronco()}"/>` +
    orelha(ORELHA_CX_ESQ, "kk-pele-s") +
    orelha(ORELHA_CX_DIR, "kk-pele-s") +
    orelha(ORELHA_CX_ESQ, "kk-traco") +
    orelha(ORELHA_CX_DIR, "kk-traco") +
    `<path class="kk-pele" d="${pathCabeca()}"/>` +
    `<g clip-path="url(#${idCabeca})">` +
    `<path class="kk-pele-s" d="${pathPlanoLateralCabeca()}" opacity=".40"/>` +
    `<path class="kk-luz" d="${pathEspecular()}"/>` +
    `</g>` +
    `<path class="kk-traco" d="${pathCabeca()}"/>` +
    olho(OLHO_CX_ESQ, OLHO_CY_ESQ) +
    olho(OLHO_CX_DIR, OLHO_CY_DIR) +
    extensoes(traje, false) +
    `</g>` +
    `</svg>`
  );
}
