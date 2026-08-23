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

/** Membro da turma — retornado por get_class_members RPC */
export interface ClassMember {
  user_id: string;
  display_name: string | null;
  level: number;
  puzzle_rating: number;
  is_teacher: boolean;
  joined_at: string;
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

/**
 * Uma linha do mural, como `get_class_feed` a devolve.
 *
 * Até o Bloco 6 isto era `class_feed` lido direto do navegador, e o nome vinha de
 * `event_data.display_name` — um retrato do dia do evento, gravado por
 * `emit_class_feed`. A identidade do avatar não tinha como chegar aqui: `users`
 * tem RLS e a matview teve o SELECT revogado de `authenticated`. Hoje quem serve é
 * a RPC, que junta `users` e devolve o nome **fresco** junto das três colunas.
 */
export interface FeedEvent {
  id: number;
  class_id: number;
  user_id: string;
  event_type: FeedEventType;
  event_data: Record<string, unknown>;
  created_at: string;
  display_name: string | null;
  /** A identidade kokeshi. `avatar_cabelo` NULL é a careca. */
  avatar_skin: number;
  avatar_cabelo: string | null;
  avatar_hair_color: number;
  /**
   * As duas peças que o recorte de cabeça mostra. Ver `RankingEntry` — o mural cai
   * no mesmo achado **G22** pela mesma porta: `get_class_feed` as devolve, e
   * `as FeedEvent[]` (`src/hooks/useClassFeed.ts:39`) as jogava fora.
   */
  avatar_chapeu: string | null;
  avatar_rosto: string | null;
  /**
   * O número da patente, para a `<MolduraPatente>`. Desde o B2 da moldura.
   *
   * O mural é a única das cinco telas que NÃO lê da matview — ele junta `users`
   * fresco —, então o tier vem de um LEFT JOIN em `user_titles` dentro da RPC, com
   * o mesmo `COALESCE(..., 0)` da view. As duas fontes concordam: sem linha de
   * título, o aluno é Aprendiz, tier 0.
   */
  achieved_tier: number;
}
