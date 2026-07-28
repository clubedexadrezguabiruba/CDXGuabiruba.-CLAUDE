/**
 * GATE: os contadores do perfil não podem ter total hardcoded.
 *
 * O bug que este teste impede de voltar:
 *
 *   PerfilClient.tsx mostrava `${unlockedCount}/17` para insígnias e
 *   `${items.length}/47` para a coleção. O 47 estava errado desde que o catálogo
 *   passou de 47 para 77 itens — o aluno via "12/47" quando eram 12 de 77. O 17
 *   por acaso coincidia com o banco, mas quebra na 18ª conquista.
 *
 *   Ninguém notou porque nada verificava. É o mesmo padrão da curva de XP: um
 *   número constante no client discordando do banco, em silêncio.
 *
 * O total sempre vem do dado (achievements.length, catalogTotal), nunca de um
 * literal. Mesma abordagem de asserção estática sobre código-fonte usada em
 * scripts/verify/security/verify-puzzle-authority.ts.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const PERFIL_CLIENT = "src/app/(main)/perfil/PerfilClient.tsx";

function lerPerfilClient(): string[] {
  return readFileSync(resolve(process.cwd(), PERFIL_CLIENT), "utf-8").split("\n");
}

/**
 * Casa um total literal logo depois do fim de uma interpolação: `${x}/17`.
 *
 * Ancorar no `}` é o que separa um contador de uma classe do Tailwind — em
 * `bg-white/90` ou `border-stone-200/80` o `/` nunca vem depois de `}`.
 */
const TOTAL_HARDCODED = /\}\s*\/\s*(\d+)/;

describe("PerfilClient — contadores", () => {
  it("não usa total hardcoded em contador de conquistas ou de itens", () => {
    const linhas = lerPerfilClient();
    const ofensores: string[] = [];

    linhas.forEach((linha, i) => {
      const m = linha.match(TOTAL_HARDCODED);
      if (!m) return;
      // /10 de bots é fixo por design (10 bots na campanha).
      if (m[1] === "10") return;
      ofensores.push(`${PERFIL_CLIENT}:${i + 1} → ${linha.trim()}`);
    });

    expect(
      ofensores,
      `Total hardcoded em contador. Use o tamanho do dado ` +
        `(achievements.length, catalogTotal), não um literal:\n${ofensores.join("\n")}`
    ).toEqual([]);
  });

  it("o total da coleção vem do catálogo, não do inventário do aluno", () => {
    const src = lerPerfilClient().join("\n");
    // items.length é quantos o aluno TEM; o denominador precisa ser o catálogo.
    expect(src).toContain("catalogTotal");
  });
});
