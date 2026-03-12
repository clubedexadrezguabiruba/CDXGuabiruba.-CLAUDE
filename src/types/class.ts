// Types do módulo de turmas (Fase 9)

// ── Unions literais ──────────────────────────────────────────

export type TaskType = 'lesson' | 'puzzles_theme' | 'puzzles_count' | 'bot' | 'rush';

export type FeedEventType =
  | 'bot_defeated'
  | 'level_up'
  | 'rating_milestone'
  | 'title_earned'
  | 'streak_milestone'
  | 'rush_record'
  | 'achievement_unlocked';

// ── TaskConfig — união discriminada pelos 5 tipos ────────────

export interface LessonConfig {
  lesson_id: number;
}

export interface PuzzlesCountConfig {
  count: number;
}

export interface PuzzlesThemeConfig {
  theme: string;
  count: number;
}

export interface BotConfig {
  bot_id: number;
}

export interface RushConfig {
  count: number;
  mode?: '3min' | '5min' | 'resistencia';
}

export type TaskConfig =
  | LessonConfig
  | PuzzlesCountConfig
  | PuzzlesThemeConfig
  | BotConfig
  | RushConfig;

// ── Interfaces de dados ──────────────────────────────────────

/** Tabela classes — SELECT direto */
export interface Class {
  id: number;
  teacher_id: string;
  name: string;
  invite_code: string;
  active: boolean;
  created_at: string;
}

/** Class + member_count agregado (usado em useClasses para professor) */
export interface ClassWithCount extends Class {
  member_count: number;
}

/** class_members JOIN users — SELECT explícito no hook */
export interface ClassMember {
  id: number;
  class_id: number;
  user_id: string;
  joined_at: string;
  // JOIN users (SELECT explícito)
  display_name: string | null;
  level: number;
  puzzle_rating: number;
}

/** Tabela class_tasks — SELECT direto */
export interface ClassTask {
  id: number;
  class_id: number;
  teacher_id: string;
  task_type: TaskType;
  config_json: TaskConfig;
  title: string;
  description: string;
  deadline: string | null;
  active: boolean;
  created_at: string;
}

/** Retorno de check_my_tasks() — cada item do array */
export interface TaskProgress {
  task_id: number;
  class_id: number;
  task_type: TaskType;
  title: string;
  description: string;
  deadline: string | null;
  progress: number;
  target: number;
  completed: boolean;
  just_completed: boolean;
}

/** class_feed JOIN users — SELECT explícito no hook */
export interface FeedEvent {
  id: number;
  class_id: number;
  user_id: string;
  event_type: FeedEventType;
  event_data: Record<string, unknown>;
  created_at: string;
  // JOIN users (SELECT explícito)
  display_name: string | null;
}
