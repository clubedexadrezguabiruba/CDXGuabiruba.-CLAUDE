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
 *  - `tinta.cor` — a cor dominante MEDIDA na arte (moda em baldes de 8 níveis por
 *    canal, com a média dentro do balde vencedor). É o fallback chapado se o PNG
 *    faltar, e é o que o compositor escurece para a sombra do queixo e o plano
 *    lateral quando não há arte. **Ela não vem mais de `patentes.ts`**: a patente
 *    deixou de vestir o boneco em 2026-08-13, e a cor do traje passou a ser final e
 *    livre (doc 21 §0);
 *  - **`escalaMedida` é ausente de propósito.** Com ela ausente o compositor usa
 *    `k = 1` (`compositor.ts:373`), e o `<image>` ocupa o `viewBox` inteiro — que
 *    é exatamente o retângulo em que o PNG foi recortado (px 212→812 × 92→932,
 *    600 × 840, 5:7). A colagem é conta, não ajuste.
 */

import type { Traje } from "./tipos";

export const TRAJES_DA_ARTE: Record<string, Traje> = {
  "traje-farda": {
    id: "traje-farda",
    nome: "Farda da Academia",
    tinta: { png: "/items/traje/traje-farda.png", cor: "#78833B" },
  },
  "traje-gambesao": {
    id: "traje-gambesao",
    nome: "Gambesão Acolchoado",
    tinta: { png: "/items/traje/traje-gambesao.png", cor: "#13ABB3" },
  },
};

/** Quantas peças de traje a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_TRAJES_DA_ARTE = Object.keys(TRAJES_DA_ARTE).length;
