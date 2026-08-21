/**
 * Dados estáticos da vitrine de design.
 *
 * Nada aqui toca Supabase. A vitrine existe para poder ser fotografada sem
 * login e sem tocar em produção — ver DESIGN.md e a skill design-recruta64.
 *
 * O conteúdo é o do Quartel-General real (src/app/(main)/dashboard/page.tsx):
 * cabeçalho com patente, três atalhos, Ordens do Dia, Sequência de Campanha e
 * a prévia do Quadro de Honra. Comparar direções em conteúdo diferente não
 * compara nada.
 */

/**
 * A tabela dos títulos MORAVA AQUI, copiada à mão — e a cópia divergiu da
 * fonte em silêncio (o tier 1 ganhou um `detalhe` que em `patentes.ts` é
 * `null`). Régua se importa, não se copia: quem precisa de cor de título usa
 * o `<Badge patente>`, que lê `scripts/avatar/patentes.ts` direto.
 *
 * É o segundo dos dois incidentes que `verify:design-tokens` nomeia.
 */

export const ALUNO = {
  nome: "Ana",
  patente: "Analista",
  nivel: 12,
  xpAtual: 340,
  xpProximo: 500,
  streak: 6,
} as const;

export const ATALHOS = [
  { titulo: "Continuar Treinamento", legenda: "Trilha do Cavalo · aula 7", href: "/aulas" },
  { titulo: "Desafio Tático", legenda: "rating 1420", href: "/puzzles/rating" },
  { titulo: "Enfrentar Bot", legenda: "Sargento Torre", href: "/bots" },
] as const;

export const ORDENS = [
  { texto: "Concluir 10 desafios táticos", feito: 7, total: 10, xp: 40 },
  { texto: "Completar 1 treinamento", feito: 1, total: 1, xp: 25 },
  { texto: "Vencer 1 duelo da campanha", feito: 0, total: 1, xp: 60 },
] as const;

export const HONRA = [
  { pos: 1, nome: "L. Martins", patente: "Mestre", rating: 1712 },
  { pos: 2, nome: "R. Souza", patente: "Estrategista", rating: 1655 },
  { pos: 3, nome: "Ana", patente: "Analista", rating: 1420, eu: true },
  { pos: 4, nome: "P. Xavier", patente: "Analista", rating: 1388 },
  { pos: 5, nome: "M. Duarte", patente: "Estudante", rating: 1301 },
] as const;

export const INSIGNIAS = [
  { nome: "Primeira Campanha", ganha: true },
  { nome: "Sete Dias", ganha: true },
  { nome: "Cem Desafios", ganha: true },
  { nome: "Duelo Perfeito", ganha: false },
] as const;
