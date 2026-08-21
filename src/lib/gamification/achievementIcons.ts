/**
 * O emoji de cada insígnia, a partir da chave gravada em `achievements.icon`.
 *
 * Morava dentro de `PerfilClient.tsx`, e o perfil público —
 * `perfil/[userId]/PublicProfileClient.tsx` — não a enxergava: ele renderizava
 * `ach.icon` cru, o que punha a palavra "sword" na tela onde devia estar um
 * emoji. Duas leitoras justificam o módulo.
 *
 * ⚔️ e 👑 saíram em 2026-08-21: guerra e monarquia são imagens do reino que a
 * Bíblia Tonal v2 aposentou (§7 e §10). Entraram ♟️ e 🏅, que são de xadrez e
 * de escola. As chaves novas descem no mesmo commit que a migration
 * `20260821120000_academia_titulos.sql`, que as grava no banco.
 */
export const ACHIEVEMENT_ICON_MAP: Record<string, string> = {
  chess: "♟️", medal: "🏅", target: "🎯", puzzle: "🧩", brain: "🧠",
  "trending-up": "📈", zap: "⚡", flame: "🔥", "book-open": "📖",
  "graduation-cap": "🎓", star: "⭐", award: "🏆",
};

/** O fallback é o mesmo dos dois lados: chave desconhecida vira ⭐, nunca texto. */
export function emojiDaInsignia(icon: string | null | undefined): string {
  return (icon && ACHIEVEMENT_ICON_MAP[icon]) || "⭐";
}
