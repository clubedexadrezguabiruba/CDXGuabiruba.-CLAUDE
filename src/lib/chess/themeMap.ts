export interface PuzzleTheme {
  key: string;
  lichessKeys: string[];
  name: string;
  description: string;
  icon: string;
  color: string;
  iconColor: string;
}

// Cores por família tática:
// Mates → Rose | Ataques táticos → Blue | Táticas posicionais → Amber
// Temas especiais → Violet | Finais → Emerald

const ROSE   = { color: "bg-rose-50 border-rose-200 hover:bg-rose-100", iconColor: "text-rose-600" };
const BLUE   = { color: "bg-blue-50 border-blue-200 hover:bg-blue-100", iconColor: "text-blue-600" };
const AMBER  = { color: "bg-amber-50 border-amber-200 hover:bg-amber-100", iconColor: "text-amber-600" };
const VIOLET = { color: "bg-violet-50 border-violet-200 hover:bg-violet-100", iconColor: "text-violet-600" };
const EMERALD = { color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", iconColor: "text-emerald-600" };

export const PUZZLE_THEMES: PuzzleTheme[] = [
  // — Mates (Rose) —
  { key: "mateIn1", lichessKeys: ["mateIn1"], name: "Mate em 1", description: "Dê o xeque-mate em 1 lance", icon: "crosshair", ...ROSE },
  { key: "mateIn2", lichessKeys: ["mateIn2"], name: "Mate em 2", description: "Dê o xeque-mate em 2 lances", icon: "target", ...ROSE },
  { key: "mateIn3plus", lichessKeys: ["mateIn3", "mateIn4", "mateIn5"], name: "Mate em 3+", description: "Dê o xeque-mate em 3 ou mais lances", icon: "zap", ...ROSE },
  // — Ataques táticos (Blue) —
  { key: "fork", lichessKeys: ["fork"], name: "Garfo (Fork)", description: "Ataque duplo com uma peça", icon: "git-branch", ...BLUE },
  { key: "pin", lichessKeys: ["pin"], name: "Cravada (Pin)", description: "Imobilize uma peça contra o rei ou peça valiosa", icon: "anchor", ...BLUE },
  { key: "skewer", lichessKeys: ["skewer"], name: "Espeto (Skewer)", description: "Ataque em linha forçando peça valiosa a mover", icon: "arrow-right", ...BLUE },
  { key: "discoveredAttack", lichessKeys: ["discoveredAttack"], name: "Ataque Descoberto", description: "Mova uma peça revelando ataque de outra", icon: "eye", ...BLUE },
  { key: "xRayAttack", lichessKeys: ["xRayAttack"], name: "Raio-X (X-Ray)", description: "Ataque através de uma peça intermediária", icon: "scan", ...BLUE },
  { key: "doubleCheck", lichessKeys: ["doubleCheck"], name: "Xeque Duplo", description: "Duas peças dão xeque simultaneamente", icon: "copy", ...BLUE },
  // — Táticas posicionais (Amber) —
  { key: "hangingPiece", lichessKeys: ["hangingPiece"], name: "Peça Pendurada", description: "Capture peça desprotegida", icon: "hand", ...AMBER },
  { key: "deflection", lichessKeys: ["deflection"], name: "Desvio (Deflection)", description: "Force uma peça a abandonar a defesa", icon: "corner-down-right", ...AMBER },
  { key: "attraction", lichessKeys: ["attraction"], name: "Atração", description: "Force o rei/peça a uma casa vulnerável", icon: "magnet", ...AMBER },
  { key: "intermezzo", lichessKeys: ["intermezzo"], name: "Intermediária", description: "Lance intermediário antes de recapturar", icon: "shuffle", ...AMBER },
  // — Temas especiais (Violet) —
  { key: "sacrifice", lichessKeys: ["sacrifice"], name: "Sacrifício", description: "Entregue material para ganhar vantagem decisiva", icon: "flame", ...VIOLET },
  { key: "zugzwang", lichessKeys: ["zugzwang"], name: "Zugzwang", description: "Force o adversário a fazer um lance ruim", icon: "lock", ...VIOLET },
  { key: "promotion", lichessKeys: ["promotion"], name: "Promoção de Peão", description: "Temas envolvendo promoção tática", icon: "arrow-up-circle", ...VIOLET },
  // — Finais (Emerald) —
  { key: "endgame", lichessKeys: ["endgame"], name: "Finais", description: "Técnicas de finais de partida", icon: "flag", ...EMERALD },
  { key: "pawnEndgame", lichessKeys: ["pawnEndgame"], name: "Finais: Rei e Peões", description: "Técnicas de finais de peões", icon: "footprints", ...EMERALD },
  { key: "rookEndgame", lichessKeys: ["rookEndgame"], name: "Finais: Torres", description: "Técnicas de finais de torre", icon: "castle", ...EMERALD },
  // — Mate especial (Rose) —
  { key: "backRankMate", lichessKeys: ["backRankMate"], name: "Mate na Última Fileira", description: "Xeque-mate na 1ª ou 8ª fileira", icon: "shield", ...ROSE },
];

export function getThemeByKey(key: string): PuzzleTheme | undefined {
  return PUZZLE_THEMES.find((t) => t.key === key);
}

export function getLichessThemeKey(themeKey: string): string {
  const theme = PUZZLE_THEMES.find((t) => t.key === themeKey);
  return theme?.lichessKeys[0] ?? themeKey;
}

/**
 * Return a random Lichess theme key for themes that map to multiple keys
 * (e.g., mateIn3plus → randomly picks from mateIn3, mateIn4, mateIn5).
 */
export function getRandomLichessThemeKey(themeKey: string): string {
  const theme = PUZZLE_THEMES.find((t) => t.key === themeKey);
  if (!theme) return themeKey;
  const keys = theme.lichessKeys;
  return keys[Math.floor(Math.random() * keys.length)];
}
