export const RARITY_STYLES: Record<string, { border: string; badge: string; bg: string; glow: string }> = {
  common: {
    border: "border-zinc-300",
    badge: "bg-zinc-200 text-zinc-600",
    bg: "bg-zinc-50",
    glow: "",
  },
  rare: {
    border: "border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    bg: "bg-blue-50",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
  },
  epic: {
    border: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
    bg: "bg-purple-50",
    glow: "shadow-[0_0_16px_rgba(168,85,247,0.3)]",
  },
  legendary: {
    border: "border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    bg: "bg-amber-50",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.4)]",
  },
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const SLOT_LABELS: Record<string, string> = {
  head: "Cabeça",
  outfit: "Roupa",
  background: "Fundo",
  frame: "Moldura",
  pet: "Pet",
};

export const SLOT_EMOJIS: Record<string, string> = {
  head: "👑",
  outfit: "🎽",
  background: "🏰",
  frame: "🖼️",
  pet: "🐾",
};

export const ALL_SLOTS = ["head", "outfit", "background", "frame", "pet"] as const;
export const ALL_RARITIES = ["common", "rare", "epic", "legendary"] as const;

// --- Egg Hatching System ---

export const EGG_HATCH_HOURS = 72;

export const EGG_STAGES = [
  { hours: 0,  label: "Ovo Intacto",       crack: 0 },
  { hours: 12, label: "Primeira Rachadura", crack: 1 },
  { hours: 24, label: "Mais Rachaduras",    crack: 2 },
  { hours: 36, label: "Rachando Bastante",  crack: 3 },
  { hours: 48, label: "Prestes a Chocar",   crack: 4, tremble: true },
  { hours: 72, label: "Pronto!",            crack: 5, tremble: true },
] as const;
