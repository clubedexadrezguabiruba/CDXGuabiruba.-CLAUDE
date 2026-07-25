/**
 * Curva de XP — FONTE ÚNICA DA VERDADE no client.
 *
 * Histórico (por que este arquivo existe):
 * a migration 20260316200000_rebalance_xp.sql mudou deliberadamente o fator
 * de 1.05 para 1.08. No dia seguinte, 20260317100000_duplicate_item_to_xp.sql
 * recolou um corpo antigo de grant_xp com 1.05, e 20260319100000 repetiu o
 * erro. Produção voltou a 1.05 sem que ninguém notasse — porque a fórmula
 * estava duplicada em 3 componentes do client, todos com 1.05, então a UI
 * concordava com o bug e não havia discrepância visível.
 *
 * Decisão de produto (2026-07-25): 1.05 é o valor oficial.
 *
 * O gate `npm run verify:xp-curve` compara esta constante com o corpo de
 * grant_xp em produção e falha se divergirem. Se você mudar a curva, mude
 * aqui E numa migration nova — o gate cobra os dois.
 */

/** Fator de crescimento do XP por nível. */
export const XP_GROWTH_FACTOR = 1.05;

/** XP base do nível 1. */
export const XP_BASE = 100;

/** Nível máximo. */
export const MAX_LEVEL = 100;

/** XP necessário para avançar do nível N → N+1: round(100 * 1.05^(N-1)) */
export function xpForLevel(level: number): number {
  return Math.round(XP_BASE * Math.pow(XP_GROWTH_FACTOR, level - 1));
}
