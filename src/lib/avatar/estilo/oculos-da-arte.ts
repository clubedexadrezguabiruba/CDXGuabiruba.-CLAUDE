/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por `npm run arte:oculos` (`scripts/avatar/arte/oculos-literal.ts`). Cada
 * peça nasce de um PNG desenhado pelo Doug sobre a base oficial, aprovado no Gate −1
 * e recortado por `peca-de-arte.ts` no braço RASTER.
 *
 * Corrigir algo aqui é corrigir o gerador. `npm run arte:oculos -- --check` está em
 * `verify:arte` e reprova quando este arquivo defasa da esteira.
 *
 * POR QUE ELAS SÃO `arte` E NÃO `formas`, que é o outro braço de `PecaSobreposta`:
 * o óculos **não recolore**. A Regra Inviolável nº 4 do CLAUDE.md dá ao aluno duas
 * cores — pele e cabelo — e nomeia o óculos entre os de cor assada. Peça de cor
 * assada sai como `<image>` WEBP dentro de um `.svg`, servido à parte, e o
 * compositor a cola por `colarArte()` — a mesma colagem do traje e do chapéu.
 *
 * ---------------------------------------------------------------------------
 * OS DOIS VÃOS DAS LENTES FICAM ABERTOS, E ISSO É A PEÇA
 * ---------------------------------------------------------------------------
 *
 * A esteira raster tapa todo furo cercado, porque *peça é figurinha, opaca por
 * dentro*. Para o óculos isso é o contrário: a peça É definida pelos dois vãos que
 * ela cerca, e o que aparece por eles tem de ser a pele que o ALUNO escolheu.
 *
 * Sem a regra, medido em 2026-08-27: **23 038 px de furo tapado** e cor dominante
 * `#E6AB7A` — a PELE da base de edição, assada dentro dos aros. Quem responde por
 * isso é `SlotDeArte.janela` (`peca-de-arte.ts`), com `noVaoDaLente` no slot.
 *
 * ---------------------------------------------------------------------------
 * SLOT PRÓPRIO, E NÃO O `rosto` COM OUTRO NOME
 * ---------------------------------------------------------------------------
 *
 * O óculos morou no slot `rosto` por um dia, junto com a barba. O Doug separou os
 * dois em 2026-08-27: *"óculos e barba não podem ser a mesma coisa. Eu preciso que
 * dê para vestir a barba e o óculos, ao mesmo tempo."* Slot é exclusivo — uma coluna
 * em `users`, um slug —, então dividir o slot era proibir a combinação.
 *
 * A peça vem DEPOIS do cabelo e ANTES do chapéu na pilha (linha `oculos` de
 * `camadas.ts`): sem haste não há o que apoiar (doc 21 §2c), e aba de chapéu por
 * cima de óculos é o que aba faz.
 *
 * `PecaDeOculos` carrega `cabeloPorCima?: never` — o óculos não tem lado a escolher,
 * e a trava é do `typecheck`, não de teste.
 */

import type { PecaDeOculos } from "./tipos";

export const OCULOS_DA_ARTE: Record<string, PecaDeOculos> = {
  "oculos-redondo-simples": {
    id: "oculos-redondo-simples",
    nome: "Óculos Redondo Simples",
    arte: "/items/oculos/oculos-redondo-simples.svg",
  },
  "oculos-escolar-simples": {
    id: "oculos-escolar-simples",
    nome: "Óculos Escolar Simples",
    arte: "/items/oculos/oculos-escolar-simples.svg",
  },
  "oculos-quadrado-retro-rosa": {
    id: "oculos-quadrado-retro-rosa",
    nome: "Quadrado Retrô Rosa",
    arte: "/items/oculos/oculos-quadrado-retro-rosa.svg",
  },
  "oculos-duplo-art-nouveau": {
    id: "oculos-duplo-art-nouveau",
    nome: "Duplo Art Nouveau",
    arte: "/items/oculos/oculos-duplo-art-nouveau.svg",
  },
  "oculos-aviator": {
    id: "oculos-aviator",
    nome: "Aviator",
    arte: "/items/oculos/oculos-aviator.svg",
  },
};

/** Quantos óculos a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_OCULOS_DA_ARTE = Object.keys(OCULOS_DA_ARTE).length;
