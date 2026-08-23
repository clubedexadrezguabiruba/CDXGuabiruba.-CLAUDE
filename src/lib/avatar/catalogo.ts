/**
 * O CATÁLOGO DO LADO DO CÓDIGO — a metade que o banco não sabe.
 *
 * A divisão é a mesma que o cabelo já usa e que vale escrever de novo: a FORMA
 * da peça é do código — o banco não sabe desenhar nada e nunca vai saber — mas
 * QUEM PODE USAR cada forma é decisão de servidor (Regra Inviolável nº 1). O que
 * os dois lados compartilham é só o **slug**.
 *
 * ESTE ARQUIVO EXISTE PARA UMA TRAVA, e ela é a nº 2 do doc 21 §1.3
 * -----------------------------------------------------------------
 * A pilha v2 morreu com **8 uniformes semeados no banco e 0 renderáveis**. O
 * conserto não é disciplina, é mecanismo: `npm run verify:catalogo-slots` exige
 * que o conjunto de slugs de `avatar_catalogo` seja **igual** ao daqui, slot a
 * slot, nos dois sentidos.
 *
 *   slug no banco e não aqui  → cadeado que abre para o nada; a tela oferece uma
 *                               peça que o compositor não sabe emitir
 *   slug aqui e não no banco  → o servidor nega uma peça que a tela oferece
 *
 * Nenhum dos dois quebra o `apply`. Os dois quebram na cara da criança.
 *
 * POR QUE TRÊS DOS QUATRO SLOTS AINDA NASCEM VAZIOS
 * -------------------------------------------------
 * Porque o Bloco 1 era encanamento e **não desenhou uma peça sequer** — o boneco
 * tinha de sair byte a byte igual ao de então. **O traje deixou de ser vazio em
 * 2026-08-13** (bloco B5 da virada): duas peças, `traje-farda` (a inicial) e
 * `traje-gambesao` (a primeira de baú). Os outros três chegam nos blocos deles —
 * rosto, chapéu, pet.
 *
 * ERAM CINCO. O `fundo` MORREU EM 2026-08-13, e não por falta de arte
 * ------------------------------------------------------------------
 * A peça de teste do Bloco 3 (`fundo-observatorio`, 3 variantes renderizadas e
 * criticadas) matou a premissa em vez da peça. O que a folha achou é o **G23**: a
 * `<MolduraPatente>` é um anel desenhado SOBRE o fundo do avatar, cada patente
 * proíbe uma faixa de luminância de fundo, e **as seis faixas cobrem [0 , 1]
 * inteiro** — não existe cor de fundo, clara ou escura, que faça os seis anéis
 * lerem. O Doug decidiu: fundo único, igual para todo aluno, e é o marfim que os
 * palcos já usam. Sem slot, sem catálogo, sem escolha, sem baú.
 *
 * O slot foi apagado do banco na mesma data, e não congelado: slot dormente é a
 * semente exata do erro que matou a v2 — 8 uniformes semeados, 0 renderáveis.
 *
 * A LISTA É DERIVADA ONDE JÁ EXISTE REGISTRO, E ISSO É DE PROPÓSITO
 * -----------------------------------------------------------------
 * `chapeu` e `rosto` já saem de `Object.keys()` dos seus registros: o slug é
 * consequência de existir a peça, não uma segunda declaração que pode discordar
 * dela. Só `pet` ainda é lista escrita à mão, porque o registro dele nasce no
 * bloco que o desenha (o 8) — e inventar o formato do registro antes de haver uma
 * peça é adivinhar. Ele vira derivado no bloco dele. O gate não muda: ele já
 * compara conjuntos.
 */

import { CABELOS, MODELOS_CABELO, type ModeloCabelo } from "./estilo/cabelo";
import { ROSTOS_DA_ARTE } from "./estilo/rostos-da-arte";
import { TRAJES_DA_ARTE } from "./estilo/trajes-da-arte";
import type { PecaDeChapeu, PecaDeRosto, PecaSobreposta } from "./estilo/tipos";

/**
 * Os slots do guarda-roupa. Iguais ao CHECK de `avatar_catalogo.slot`.
 *
 * Eram quatro; **o `cabelo` entrou em 2026-08-23**, quando ele deixou de ter
 * tabela própria e virou peça de baú como as outras. A ordem não é alfabética de
 * propósito: é a ordem em que os slots nasceram, e é a ordem em que
 * `verify:catalogo-slots` imprime.
 */
export const SLOTS = ["traje", "chapeu", "rosto", "pet", "cabelo"] as const;

export type Slot = (typeof SLOTS)[number];

/**
 * Os chapéus desenhados. Vazio até o Bloco 7.
 *
 * `PecaDeChapeu` e não `PecaSobreposta`: o tipo carrega `cabeloPorCima?: never`, e é
 * ele que faz um chapéu que tente escolher de que lado do cabelo veste **não
 * compilar**. O chapéu é sempre o último. A trava vale com o catálogo vazio, que é
 * exatamente quando um teste não valeria nada.
 */
export const CHAPEUS: Record<string, PecaDeChapeu> = {};

/**
 * As peças de rosto — óculos, bigode, barba.
 *
 * DERIVADO desde 2026-08-19, e pelo mesmo motivo que o traje: `ROSTOS_DA_ARTE` é
 * GERADO por `npm run arte:rostos` a partir dos PNGs que o Doug desenhou sobre a
 * base oficial, então o slug é consequência de existir arte renderizável, nunca uma
 * segunda declaração que pode discordar dela. É a trava nº 2 fechada na origem.
 *
 * A `barba-cheia` (legendary) é a **primeira peça de arte deste projeto a virar peça
 * de catálogo**. O elenco decidido do slot são 6 barbas — 2 common · 2 rare · 1 epic
 * · 1 legendary —, e as outras cinco entram uma a uma, cada uma pela mesma esteira.
 * O registro número a número está em `scripts/avatar/arte/ESTADO-DA-ROTA.md`.
 *
 * ⚠️ **O slug `rosto-barba-cavanhaque` já está tomado** por uma barba PARAMÉTRICA
 * antiga (`estilo/rosto.ts`, `BARBAS.vertical`), que nunca entrou aqui. Quando a
 * arte do cavanhaque for promovida, uma das duas troca de slug — e é decisão, não
 * conserto de esteira.
 */
export const ROSTOS: Record<string, PecaDeRosto> = { ...ROSTOS_DA_ARTE };

/**
 * O que o código sabe desenhar, slot a slot.
 *
 * O CABELO ENTROU EM 2026-08-23, e este docstring dizia o contrário até então:
 * *"o cabelo não está aqui — ele tem catálogo próprio, gate próprio e tabela
 * própria"*, citando o doc 21 §3.3. Aquela seção foi **revogada**. O motivo dela
 * era custo, e o Doug decidiu que todo item vestível tem raridade e vem de baú —
 * o que é incompatível com ficar fora de `avatar_catalogo`, por constraint:
 * `avatar_guarda_roupa.slug` referencia essa tabela, então *ter* uma peça exige
 * estar nela.
 *
 * O cabelo é o único slot cujo slug **não é** a chave do registro: no código o
 * modelo é `espetado`, no banco a peça é `cabelo-espetado`. O prefixo é fronteira
 * de sistema, não renome — `CABELOS[m].id` continua igual a `m`, e é isso que
 * `linhas-cabelo.test.ts` afirma. Quem atravessa a fronteira é `modeloDoSlug`,
 * num lugar só.
 */
export const CATALOGO: Record<Slot, readonly string[]> = {
  // DERIVADO desde o B5 (2026-08-13), e é o que a nota acima previa: "cada um vira
  // derivado no seu bloco". O registro das peças de traje é `TRAJES_DA_ARTE`, que
  // por sua vez é GERADO por `npm run arte:trajes` a partir dos PNGs da esteira —
  // então o slug é consequência de existir arte renderizável, nunca uma segunda
  // declaração que pode discordar dela. É a trava nº 2 fechada na origem.
  traje: Object.keys(TRAJES_DA_ARTE),
  chapeu: Object.keys(CHAPEUS),
  rosto: Object.keys(ROSTOS),
  pet: [],
  // DERIVADO de `MODELOS_CABELO`, que é `Object.keys(CABELOS)`: mesma regra dos
  // outros dois derivados, com o prefixo aplicado na saída. Cabelo desenhado é
  // cabelo no catálogo, sem segunda declaração para discordar.
  cabelo: MODELOS_CABELO.map(slugDoModelo),
};

/** O modelo, prefixado: `espetado` -> `cabelo-espetado`. A ida da fronteira. */
export function slugDoModelo(modelo: ModeloCabelo): string {
  return `cabelo-${modelo}`;
}

/**
 * A volta da fronteira: `cabelo-espetado` -> `espetado`, com o desconhecido
 * virando **careca**.
 *
 * Aceita o slug com prefixo e o modelo nu, e é de propósito: o valor nu ainda
 * chega de `MODELOS_CABELO` e das folhas de arte, e uma função que só entendesse
 * o prefixado obrigaria cada chamador a saber de que lado da fronteira está.
 *
 * O degradar para careca é o mesmo de `pecaDeCabeca` e pelo mesmo motivo medido:
 * a FK impede slug inválido no banco, mas não cobre o intervalo em que uma peça
 * sai do catálogo do CÓDIGO antes de sair do banco — foi o que a poda de sete
 * para cinco cabelos criou uma vez. Sem o modelo, o boneco aparece careca, que é
 * um estado legítimo do produto; o que não pode é sumir inteiro.
 */
export function modeloDoSlug(slug: string | null | undefined): ModeloCabelo | undefined {
  if (!slug) return undefined;
  const nu = slug.startsWith("cabelo-") ? slug.slice("cabelo-".length) : slug;
  return (MODELOS_CABELO as readonly string[]).includes(nu)
    ? (nu as ModeloCabelo)
    : undefined;
}

/**
 * Slug → peça, com o desconhecido virando **ausência**.
 *
 * É o mesmo degradar de `modeloDe` no `<AvatarKokeshi>`, e existe pelo mesmo
 * motivo medido: a FK do banco impede slug inválido, mas não cobre o intervalo
 * em que uma peça sai do catálogo do CÓDIGO antes de sair do banco — foi o que a
 * poda de sete para cinco cabelos criou uma vez. Sem a peça, o boneco aparece
 * sem ela, que é um estado legítimo do produto; o que não pode é sumir inteiro.
 */
/**
 * Slug → nome que o aluno lê, em qualquer slot da vitrine.
 *
 * **A tabela `avatar_catalogo` não tem coluna de nome, e isso é do desenho dela**:
 * o nome é texto de interface e muda sem migration. Ele vem sempre do registro que
 * também carrega o desenho — `TRAJES_DA_ARTE` e `ROSTOS` são GERADOS pela esteira
 * de arte, então o nome é consequência de existir peça renderizável, nunca uma
 * segunda lista que pode discordar do banco.
 *
 * Mora aqui, e não no `<EditorDeAparencia>`, porque tem **dois consumidores
 * reais**: a vitrine e o `<ChestOpeningModal>`. Sem isto, o modal do baú anunciava
 * um cabelo sorteado pelo slug cru — ele lia o nome só de `TRAJES_DA_ARTE`.
 *
 * O slug desconhecido sai como ele mesmo: é o degradar de sempre, e não inventa
 * nome para peça que o código ainda não desenha.
 */
export function nomeDaPeca(slot: string, slug: string): string {
  if (slot === "cabelo") {
    const modelo = modeloDoSlug(slug);
    return modelo ? CABELOS[modelo].nome : slug;
  }
  const registro = slot === "traje" ? TRAJES_DA_ARTE[slug] : ROSTOS[slug];
  return registro?.nome ?? slug;
}

export function pecaDeCabeca(
  slot: "chapeu" | "rosto",
  slug: string | null | undefined,
): PecaSobreposta | undefined {
  if (!slug) return undefined;
  return (slot === "chapeu" ? CHAPEUS : ROSTOS)[slug];
}
