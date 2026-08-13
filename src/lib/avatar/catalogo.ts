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
 * POR QUE QUATRO DOS CINCO SLOTS AINDA NASCEM VAZIOS
 * --------------------------------------------------
 * Porque o Bloco 1 era encanamento e **não desenhou uma peça sequer** — o boneco
 * tinha de sair byte a byte igual ao de então. **O traje deixou de ser vazio em
 * 2026-08-13** (bloco B5 da virada): duas peças, `traje-farda` (a inicial) e
 * `traje-gambesao` (a primeira de baú). Os outros quatro chegam nos blocos deles —
 * fundo, rosto, chapéu, pet.
 *
 * A LISTA É DERIVADA ONDE JÁ EXISTE REGISTRO, E ISSO É DE PROPÓSITO
 * -----------------------------------------------------------------
 * `chapeu` e `rosto` já saem de `Object.keys()` dos seus registros: o slug é
 * consequência de existir a peça, não uma segunda declaração que pode discordar
 * dela. Os outros três ainda são lista escrita à mão porque o registro deles
 * nasce no bloco que os desenha — traje no 2, fundo no 3, pet no 8 —, e inventar
 * o formato do registro antes de haver uma peça é adivinhar. Cada um vira
 * derivado no seu bloco. O gate não muda: ele já compara conjuntos.
 */

import { TRAJES_DA_ARTE } from "./estilo/trajes-da-arte";
import type { PecaSobreposta } from "./estilo/tipos";

/** Os cinco slots do guarda-roupa. Iguais ao CHECK de `avatar_catalogo.slot`. */
export const SLOTS = ["traje", "chapeu", "rosto", "fundo", "pet"] as const;

export type Slot = (typeof SLOTS)[number];

/** Os chapéus desenhados. Vazio até o Bloco 7. */
export const CHAPEUS: Record<string, PecaSobreposta> = {};

/** As peças de rosto — óculos, bigode, barba. Vazio até o Bloco 5. */
export const ROSTOS: Record<string, PecaSobreposta> = {};

/**
 * O que o código sabe desenhar, slot a slot.
 *
 * O cabelo **não está aqui**: ele tem catálogo próprio (`MODELOS_CABELO` em
 * `estilo/cabelo.ts`), gate próprio (`verify:cabelo-catalogo`) e tabela própria
 * no banco. O doc 21 §3.3 decidiu não migrá-lo — mexer no que funciona seria
 * refatoração além do pedido, e o preço (duas gramáticas convivendo) está
 * declarado.
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
  fundo: [],
  pet: [],
};

/**
 * Slug → peça, com o desconhecido virando **ausência**.
 *
 * É o mesmo degradar de `modeloDe` no `<AvatarKokeshi>`, e existe pelo mesmo
 * motivo medido: a FK do banco impede slug inválido, mas não cobre o intervalo
 * em que uma peça sai do catálogo do CÓDIGO antes de sair do banco — foi o que a
 * poda de sete para cinco cabelos criou uma vez. Sem a peça, o boneco aparece
 * sem ela, que é um estado legítimo do produto; o que não pode é sumir inteiro.
 */
export function pecaDeCabeca(
  slot: "chapeu" | "rosto",
  slug: string | null | undefined,
): PecaSobreposta | undefined {
  if (!slug) return undefined;
  return (slot === "chapeu" ? CHAPEUS : ROSTOS)[slug];
}
