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

/** As 6 patentes, na ordem da escada. Fonte: scripts/avatar/patentes.ts. */
export const PATENTES = [
  { nome: "Soldado", pano: "#78833B", bota: "#2d3012", detalhe: "#C3CE8E" },
  { nome: "Aspirante", pano: "#384966", bota: "#1e2b44", detalhe: "#859DAB" },
  { nome: "Capitão", pano: "#3E8C81", bota: "#1C4A45", detalhe: "#B4D2C9" },
  { nome: "Comandante", pano: "#3A55B5", bota: "#1D2A63", detalhe: "#C6D2E2" },
  { nome: "General", pano: "#7A3168", bota: "#421539", detalhe: "#D9BCD1" },
  { nome: "Mestre", pano: "#AEBCCE", bota: "#4B5A70", detalhe: "#B5AE4A" },
] as const;

export type Patente = (typeof PATENTES)[number];

export const ALUNO = {
  nome: "Ana",
  patente: "Capitão",
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
  { pos: 1, nome: "L. Martins", patente: "General", rating: 1712 },
  { pos: 2, nome: "R. Souza", patente: "Comandante", rating: 1655 },
  { pos: 3, nome: "Ana", patente: "Capitão", rating: 1420, eu: true },
  { pos: 4, nome: "P. Xavier", patente: "Capitão", rating: 1388 },
  { pos: 5, nome: "M. Duarte", patente: "Aspirante", rating: 1301 },
] as const;

export const INSIGNIAS = [
  { nome: "Primeira Campanha", ganha: true },
  { nome: "Sete Dias", ganha: true },
  { nome: "Cem Desafios", ganha: true },
  { nome: "Duelo Perfeito", ganha: false },
] as const;

export function patentePorNome(nome: string): Patente {
  return PATENTES.find((p) => p.nome === nome) ?? PATENTES[0];
}
