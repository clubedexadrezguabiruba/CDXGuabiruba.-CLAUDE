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
 *  - `tinta.arte` — o `.svg` da peça, colado por `<image>` sobre a silhueta.
 *    **Era um `.png` até 2026-08-17**, quando a P1 do plano mediu os dois e o Doug
 *    escolheu o vetor: mesma colagem, mesmo pixel, um quarto do peso e nítido em
 *    qualquer tamanho (doc 21, entrada de 2026-08-17);
 *  - `tinta.cor` — a cor dominante MEDIDA na arte (moda em baldes de 8 níveis por
 *    canal, com a média dentro do balde vencedor). É o fallback chapado se o PNG
 *    faltar, e é o que o compositor escurece para a sombra do queixo e o plano
 *    lateral quando não há arte. **Ela não vem mais de `patentes.ts`**: a patente
 *    deixou de vestir o boneco em 2026-08-13, e a cor do traje passou a ser final e
 *    livre (doc 21 §0);
 *  - **`escalaMedida` é ausente de propósito.** Com ela ausente o compositor usa
 *    `k = 1` (`colarArte`), e o `<image>` ocupa a `CAIXA_DA_ARTE` inteira — que
 *    é exatamente o retângulo em que o PNG foi recortado (px 212→812 × 2→932,
 *    600 × 930). A colagem é conta, não ajuste.
 *
 *    ⚠️ **A caixa era o `viewBox` até 2026-08-24** (px 92→932, 600 × 840, 5:7).
 *    Ela subiu para dar teto ao chapéu, que é peça de `<image>` e só alcançava
 *    39,5 unidades acima da coroa. Os dois trajes foram re-exportados no recorte
 *    novo no mesmo commit; o respingo medido no render foi de **3 px em 1,4 milhão**
 *    na farda e **0** no gambesão.
 */

import type { Traje } from "./tipos";

export const TRAJES_DA_ARTE: Record<string, Traje> = {
  "traje-farda": {
    id: "traje-farda",
    nome: "Farda da Academia",
    tinta: { arte: "/items/traje/traje-farda.svg", cor: "#78833B" },
  },
  "traje-gambesao": {
    id: "traje-gambesao",
    nome: "Gambesão Acolchoado",
    tinta: { arte: "/items/traje/traje-gambesao.svg", cor: "#13ABB3" },
  },
};

/** Quantas peças de traje a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_TRAJES_DA_ARTE = Object.keys(TRAJES_DA_ARTE).length;
