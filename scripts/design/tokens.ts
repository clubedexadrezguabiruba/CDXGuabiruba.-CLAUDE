/**
 * A régua dos tokens de design — fonte única.
 *
 * O DESIGN.md descreve a paleta em prosa, e prosa não reprova nada. Aqui a
 * régua vira dado, e `verify:design-tokens` a mede — o mesmo par régua+medidor
 * de `scripts/avatar/patentes.ts` × `verify:paleta-patentes`.
 *
 * Dois incidentes reais que esta régua existe para impedir de voltar:
 *
 *  1. Os 8 tokens de marca ficaram declarados em DOIS lugares por meses
 *     (`tailwind.config.ts` + um `:root` no globals.css com ZERO usos). Os
 *     hexes batiam por sorte; nada media. Metade da declaração era código
 *     morto esperando divergir.
 *
 *  2. `src/app/design-lab/data.ts` copiou à mão a tabela de PATENTES e a cópia
 *     divergiu da fonte (Soldado com `detalhe: "#C3CE8E"`; na fonte é null).
 *     Cópia de tabela sem gate é onde o drift mora.
 *
 * A cor de cada token é a do DESIGN.md (direção A — Continuidade). `ok` e
 * `erro` entraram com o matiz DOMINANTE do código atual (green-600/red-600);
 * o refinamento de matiz é decisão de design registrada para o plano seguinte.
 */

/** Tokens de cor da marca. Nome = utility do Tailwind (`bg-gold`, `text-ink`). */
export const TOKENS: ReadonlyArray<{ nome: string; hex: string }> = [
  { nome: "brand-cyan", hex: "#00D4AA" },
  { nome: "brand-teal", hex: "#0A8F7F" },
  { nome: "deep-navy", hex: "#0F1A2E" },
  { nome: "dark-base", hex: "#060F18" },
  { nome: "gold", hex: "#C9A84C" },
  { nome: "gold-light", hex: "#E8D48B" },
  { nome: "warm-stone", hex: "#F5F0E8" },
  { nome: "warm-ivory", hex: "#FAF8F3" },
  // Direção A: a cor de texto do app. Antes vivia como valor arbitrário
  // repetido 13× na VariantA.
  { nome: "ink", hex: "#1B2432" },
  // Semânticos provisórios — matiz = o dominante do código de hoje.
  { nome: "ok", hex: "#16A34A" },
  { nome: "erro", hex: "#DC2626" },
];

/**
 * Radicais que identificam uma utility "de marca". Se o nome depois do prefixo
 * (`bg-`, `text-`…) começa com um destes, ele TEM de resolver para um token da
 * régua — senão é typo virando no-op silencioso (`bg-warm-ivroy` compila).
 */
export const RADICAIS_MARCA = [
  "brand-",
  "deep-",
  "dark-",
  "warm-",
  "gold",
  "ink",
  "ok",
  "erro",
] as const;

/** As animações do sistema (antes no tailwind.config, depois `--animate-*`). */
export const ANIMACOES = [
  "scale-in",
  "item-shake",
  "item-shatter",
  "fragment-fly",
  "xp-reveal",
  "egg-tremble",
  "egg-hatch-tremble",
  "egg-glow",
] as const;

/** As sombras nomeadas do sistema (`shadow-glow-*`). */
export const SOMBRAS = ["glow-cyan", "glow-gold"] as const;

/**
 * Famílias cruas do Tailwind: contadas pelo ratchet (S4). A dívida atual está
 * congelada no baseline; o gate falha só no CRESCIMENTO.
 */
export const FAMILIAS_CRUAS = [
  "slate",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

/**
 * Proibições DURAS, sem ratchet — hoje já estão em zero, e zero fica:
 *  - `gray-`: a família neutra convergiu para zinc; gray voltando é regressão.
 *  - `dark:`: o produto é light-only por decisão (`color-scheme: light`).
 */
export const FAMILIA_BANIDA = "gray";
export const VARIANTE_BANIDA = "dark:";

/** Prefixos de utility que carregam cor. */
export const PREFIXOS_COR = [
  "bg",
  "text",
  "border",
  "from",
  "to",
  "via",
  "ring",
  "fill",
  "stroke",
  "shadow",
  "outline",
  "divide",
  "placeholder",
  "decoration",
  "accent",
  "caret",
] as const;

/**
 * Diretórios isentos do ratchet: bancadas de dev, não produto. A vitrine de
 * design entra aqui porque o chrome dela (abas, molduras) é ferramenta.
 */
export const ISENTOS = ["src/app/(main)/dev/", "src/app/design-lab/"] as const;

/**
 * Regex de uma utility de cor crua (núcleo). Casa também dentro de variantes
 * (`hover:bg-blue-50` contém `bg-blue-50`) — variantes CONTAM, e é por isso
 * que a contagem oficial é maior do que um grep sem prefixos.
 */
export function regexCoresCruas(): RegExp {
  return new RegExp(
    `\\b(?:${PREFIXOS_COR.join("|")})-(?:${FAMILIAS_CRUAS.join("|")})-\\d{2,3}(?:/\\d{1,3})?`,
    "g"
  );
}

/** Regex de candidato a utility de marca: prefixo + nome iniciado por radical. */
export function regexCandidatoMarca(): RegExp {
  return new RegExp(
    `\\b(?:${PREFIXOS_COR.join("|")})-((?:${RADICAIS_MARCA.join("|")})[a-z0-9-]*)`,
    "g"
  );
}
