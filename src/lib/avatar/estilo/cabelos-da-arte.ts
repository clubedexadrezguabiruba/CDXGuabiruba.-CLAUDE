/**
 * OS CABELOS TONAIS DA ARTE — silhueta em vetor, claro-escuro em máscara.
 *
 * ARQUIVO GERADO — não edite à mão. Escrito por `npm run arte:cabelos`
 * (`scripts/avatar/arte/cabelos.ts`). Cada peça nasce de um PNG desenhado pelo Doug
 * sobre a base oficial, aprovado no Gate −1, limpo pela quarta saída da rota
 * (`restaurar-peca.ts`) e traçado por `scripts/avatar/arte/barba-para-formas.ts`,
 * que é a esteira de quem RECOLORE — a mesma da barba, com dois parâmetros de slot
 * trocados.
 *
 * Corrigir algo aqui é corrigir o gerador. `npm run arte:cabelos -- --check` está em
 * `verify:arte` e reprova quando este arquivo defasa da esteira.
 *
 * ---------------------------------------------------------------------------
 * POR QUE `tonal` E NÃO `massa`, QUE É O QUE OS TRÊS CABELOS DE HOJE USAM
 * ---------------------------------------------------------------------------
 *
 * A família traçada (`massa`) posteriza: `potrace` traça CONTORNO, contorno é
 * binário, e uma arte de centenas de tons chegava ao boneco com dois ou três. A
 * `rosto-barba-trancada` provou a saída em 2026-08-22 — a mesma silhueta vetorial,
 * vestida por uma **máscara de luminosidade** servida como PNG cinza, entrega ~250
 * tons no render. O Doug aprovou olhando e decidiu o elenco inteiro neste padrão.
 *
 *  1. a silhueta INTEIRA, em `var(--av-linha)`. O preto de baixo;
 *  2. **o MESMO `d`**, em `var(--av-cabelo, #262626)`, vestido pela máscara.
 *
 *     A reserva é a rede para quando a propriedade não existir — sem ela o `fill`
 *     cai em preto e o cabelo vira mancha sólida. `#262626` é a que o Doug julgou
 *     na folha recolorida de 2026-08-19.
 *
 * **A máscara não tem cor** — é um canal de cinza —, então a peça recolore INTEIRA
 * e a Regra Inviolável nº 4 continua de pé: o aluno escolhe pele e cabelo, e o
 * cabelo é um dos dois. O argumento completo está em `TomDaPeca` (`tipos.ts`).
 *
 * **O que entra aqui é o CAMINHO do PNG, não os bytes.** O arquivo mora em
 * `public/items/cabelo/` e é servido à parte, como o `.svg` do traje. Embutir os
 * bytes em base64 quebrava o ranking: 30 bonecos fechavam em **753,0 KB** de gzip
 * contra **17,6 KB** com arquivo externo, porque o boneco composto passa da janela
 * de 32.768 B do DEFLATE e a dedução do blob morre.
 *
 * `semTraco: true` nas duas formas, pela decisão **G29**: peça de arte usa o
 * contorno que o gerador pintou (5,2 u), não o `kk-traco` de 12 u do compositor.
 *
 * ---------------------------------------------------------------------------
 * A IDENTIDADE É SOBRESCRITA NA PROMOÇÃO, E ISSO NÃO É DETALHE
 * ---------------------------------------------------------------------------
 *
 * A chave e o `id` daqui saem do NOME DO ARQUIVO. `CABELOS.<modelo>` espalha o
 * objeto e sobrescreve `id` e `nome` — sem isso, `CABELOS.espetado.id` seria
 * `"entrada"` em runtime, mascarado pelo cast deste arquivo. É o mesmo contrato de
 * `PECAS_DA_ARTE`, e `linhas-cabelo.test.ts` o cobra.
 */

import type { Cabelo } from "./cabelo";

export const CABELOS_DA_ARTE: Record<string, Cabelo> = {
};

/** Quantos cabelos tonais a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_CABELOS_DA_ARTE = Object.keys(CABELOS_DA_ARTE).length;
