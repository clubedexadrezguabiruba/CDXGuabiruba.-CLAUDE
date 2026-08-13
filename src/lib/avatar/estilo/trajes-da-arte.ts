/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por `npm run arte:trajes` (`scripts/avatar/arte/trajes.ts`), o passo 5
 * da esteira de traje do doc 19. Cada peça nasce de um PNG desenhado pelo Doug
 * sobre a base oficial, aprovado no Gate −1 e recolorido por `npm run arte:traje`.
 *
 * Corrigir algo aqui é corrigir o gerador. `npm run arte:trajes -- --check` está
 * em `verify:arte` e reprova quando este arquivo defasa da esteira.
 *
 * O QUE CADA CAMPO É, E O QUE ELE NÃO É:
 *
 *  - `tinta.png` — o INTERIOR da peça, clipado no `pathTronco()`. Nunca a
 *    fronteira: o que excede a silhueta é `extensoes`, e extensão é vetor
 *    (doc 21 §6.1, e `tipos.ts:51`);
 *  - `tinta.cor` — o pano da patente, lido de `scripts/avatar/patentes.ts` e
 *    travado por `verify:paleta-patentes`. É o fallback chapado se o PNG faltar,
 *    e é o que o compositor escurece para a sombra do queixo e o plano lateral;
 *  - **`escalaMedida` é ausente de propósito.** Com ela ausente o compositor usa
 *    `k = 1` (`compositor.ts:373`), e o `<image>` ocupa o `viewBox` inteiro — que
 *    é exatamente o retângulo em que o PNG foi recortado (px 212→812 × 92→932,
 *    600 × 840, 5:7). A colagem é conta, não ajuste.
 */

import type { Traje } from "./tipos";

export const TRAJES_DA_ARTE: Record<string, Traje> = {
  "traje-soldado-farda": {
    id: "traje-soldado-farda",
    nome: "Farda de Soldado",
    tinta: { png: "/dev/traje/traje-soldado-farda.png", cor: "#78833B" },
  },
};

/** Quantas peças de traje a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_TRAJES_DA_ARTE = Object.keys(TRAJES_DA_ARTE).length;
