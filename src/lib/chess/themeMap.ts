export interface PuzzleTheme {
  key: string;
  lichessKeys: string[];
  name: string;
  description: string;
  icon: string;
}

export const PUZZLE_THEMES: PuzzleTheme[] = [
  { key: "mateIn1", lichessKeys: ["mateIn1"], name: "Mate em 1", description: "Dê o xeque-mate em 1 lance", icon: "crosshair" },
  { key: "mateIn2", lichessKeys: ["mateIn2"], name: "Mate em 2", description: "Dê o xeque-mate em 2 lances", icon: "target" },
  { key: "mateIn3plus", lichessKeys: ["mateIn3", "mateIn4", "mateIn5"], name: "Mate em 3+", description: "Dê o xeque-mate em 3 ou mais lances", icon: "zap" },
  { key: "fork", lichessKeys: ["fork"], name: "Garfo (Fork)", description: "Ataque duplo com uma peça", icon: "git-branch" },
  { key: "pin", lichessKeys: ["pin"], name: "Cravada (Pin)", description: "Imobilize uma peça contra o rei ou peça valiosa", icon: "anchor" },
  { key: "skewer", lichessKeys: ["skewer"], name: "Espeto (Skewer)", description: "Ataque em linha forçando peça valiosa a mover", icon: "arrow-right" },
  { key: "discoveredAttack", lichessKeys: ["discoveredAttack"], name: "Ataque Descoberto", description: "Mova uma peça revelando ataque de outra", icon: "eye" },
  { key: "xRayAttack", lichessKeys: ["xRayAttack"], name: "Raio-X (X-Ray)", description: "Ataque através de uma peça intermediária", icon: "scan" },
  { key: "doubleCheck", lichessKeys: ["doubleCheck"], name: "Xeque Duplo", description: "Duas peças dão xeque simultaneamente", icon: "copy" },
  { key: "hangingPiece", lichessKeys: ["hangingPiece"], name: "Peça Pendurada", description: "Capture peça desprotegida", icon: "hand" },
  { key: "deflection", lichessKeys: ["deflection"], name: "Desvio (Deflection)", description: "Force uma peça a abandonar a defesa", icon: "corner-down-right" },
  { key: "attraction", lichessKeys: ["attraction"], name: "Atração", description: "Force o rei/peça a uma casa vulnerável", icon: "magnet" },
  { key: "intermezzo", lichessKeys: ["intermezzo"], name: "Intermediária", description: "Lance intermediário antes de recapturar", icon: "shuffle" },
  { key: "sacrifice", lichessKeys: ["sacrifice"], name: "Sacrifício", description: "Entregue material para ganhar vantagem decisiva", icon: "flame" },
  { key: "zugzwang", lichessKeys: ["zugzwang"], name: "Zugzwang", description: "Force o adversário a fazer um lance ruim", icon: "lock" },
  { key: "promotion", lichessKeys: ["promotion"], name: "Promoção de Peão", description: "Temas envolvendo promoção tática", icon: "arrow-up-circle" },
  { key: "endgame", lichessKeys: ["endgame"], name: "Finais", description: "Técnicas de finais de partida", icon: "flag" },
  { key: "pawnEndgame", lichessKeys: ["pawnEndgame"], name: "Finais: Rei e Peões", description: "Técnicas de finais de peões", icon: "footprints" },
  { key: "rookEndgame", lichessKeys: ["rookEndgame"], name: "Finais: Torres", description: "Técnicas de finais de torre", icon: "castle" },
  { key: "backRankMate", lichessKeys: ["backRankMate"], name: "Mate na Última Fileira", description: "Xeque-mate na 1ª ou 8ª fileira", icon: "shield" },
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
