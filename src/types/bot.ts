export interface Bot {
  id: number;
  slug: string;
  name: string;
  personality: string;
  epithet: string;
  stage: string;
  emoji: string;
  elo: number;
  skill_level: number;
  depth: number;
  avatar_url: string;
  phrases_json: BotPhrases;
  unlock_order: number;
}

export interface BotPhrases {
  pre_game: string[];
  during: string[];
  on_win: string[];
  on_loss: string[];
}

export type TimeControl =
  | { type: "unlimited" }
  | { type: "timed"; initialMs: number; incrementMs: number };

export type PlayerColor = "white" | "black";
export type GameResult = "win" | "loss" | "draw";
export type GameOverReason =
  | "checkmate"
  | "stalemate"
  | "timeout"
  | "resign"
  | "insufficient"
  | "threefold"
  | "fifty-moves";

export interface GameOverInfo {
  result: GameResult;
  reason: GameOverReason;
}

export type BotStatus = "locked" | "available" | "defeated";

export const TIME_CONTROLS: { label: string; value: TimeControl }[] = [
  { label: "Sem relógio", value: { type: "unlimited" } },
  { label: "10+5", value: { type: "timed", initialMs: 10 * 60 * 1000, incrementMs: 5000 } },
  { label: "5+3", value: { type: "timed", initialMs: 5 * 60 * 1000, incrementMs: 3000 } },
];


export const REASON_LABELS: Record<GameOverReason, string> = {
  checkmate: "Xeque-mate",
  stalemate: "Afogamento",
  timeout: "Tempo esgotado",
  resign: "Rendição",
  insufficient: "Material insuficiente",
  threefold: "Repeti\u00E7\u00E3o tripla",
  "fifty-moves": "Regra dos 50 lances",
};
