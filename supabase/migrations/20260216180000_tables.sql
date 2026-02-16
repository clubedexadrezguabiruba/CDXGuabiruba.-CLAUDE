-- ============================================================
-- FASE 2 — TABELAS CORE (2.1 a 2.11)
-- CdxGuabiruba — Plataforma Educacional de Xadrez
-- ============================================================

-- 2.1 — users (perfil do aluno/professor)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  display_name text, -- nome parcial público (ex: "João S.")
  role text NOT NULL DEFAULT 'aluno' CHECK (role IN ('aluno', 'professor', 'admin')),
  avatar_config jsonb NOT NULL DEFAULT '{}',
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  puzzle_rating integer NOT NULL DEFAULT 400 CHECK (puzzle_rating >= 100 AND puzzle_rating <= 3000),
  puzzle_rd numeric(8,2) NOT NULL DEFAULT 350.00,
  puzzle_volatility numeric(8,6) NOT NULL DEFAULT 0.060000,
  rush_3min_record integer NOT NULL DEFAULT 0,
  rush_5min_record integer NOT NULL DEFAULT 0,
  ranking_visible boolean NOT NULL DEFAULT true,
  sound_muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_puzzle_rating ON public.users(puzzle_rating DESC);
CREATE INDEX idx_users_level ON public.users(level DESC, xp DESC);
CREATE INDEX idx_users_rush_3min ON public.users(rush_3min_record DESC);
CREATE INDEX idx_users_rush_5min ON public.users(rush_5min_record DESC);

-- 2.2 — puzzles (importados do Lichess CSV)
CREATE TABLE public.puzzles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lichess_id text NOT NULL UNIQUE,
  fen text NOT NULL,
  moves text NOT NULL, -- espaço-separado (ex: "e2e4 e7e5 d1h5")
  rating integer NOT NULL CHECK (rating >= 0),
  rating_deviation integer NOT NULL DEFAULT 75,
  popularity integer NOT NULL DEFAULT 0,
  nb_plays integer NOT NULL DEFAULT 0,
  themes text[] NOT NULL DEFAULT '{}',
  game_url text,
  opening_tags text[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_puzzles_rating ON public.puzzles(rating);
CREATE INDEX idx_puzzles_themes ON public.puzzles USING GIN(themes);
CREATE INDEX idx_puzzles_lichess_id ON public.puzzles(lichess_id);

-- 2.3 — user_puzzle_attempts
CREATE TABLE public.user_puzzle_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  puzzle_id bigint NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  solved boolean NOT NULL,
  moves_played text[] NOT NULL DEFAULT '{}',
  rating_before integer NOT NULL,
  rating_after integer NOT NULL,
  rating_delta integer NOT NULL DEFAULT 0,
  rd_before numeric(8,2),
  rd_after numeric(8,2),
  time_spent_ms integer,
  mode text NOT NULL DEFAULT 'rating' CHECK (mode IN ('rating', 'category', 'rush', 'revanche')),
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_user ON public.user_puzzle_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_attempts_user_puzzle ON public.user_puzzle_attempts(user_id, puzzle_id);
CREATE INDEX idx_attempts_mode ON public.user_puzzle_attempts(user_id, mode);

-- 2.4 — lessons + user_lesson_progress
CREATE TABLE public.lessons (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  trail text NOT NULL CHECK (trail IN ('recruta','soldado','aspirante','capitao','comandante','general','mestre')),
  trail_order integer NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}',
  total_steps integer NOT NULL DEFAULT 1 CHECK (total_steps >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lessons_trail_order ON public.lessons(trail, trail_order);

CREATE TABLE public.user_lesson_progress (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id bigint NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  steps_completed integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON public.user_lesson_progress(user_id);

-- 2.5 — bots + user_bot_results
CREATE TABLE public.bots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  personality text NOT NULL DEFAULT '',
  elo integer NOT NULL CHECK (elo >= 0),
  skill_level integer NOT NULL CHECK (skill_level >= 0 AND skill_level <= 20),
  depth integer NOT NULL CHECK (depth >= 1 AND depth <= 30),
  avatar_url text,
  phrases_json jsonb NOT NULL DEFAULT '{"pre_game":[],"during":[],"on_win":[],"on_loss":[]}',
  unlock_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_bots_unlock_order ON public.bots(unlock_order);

CREATE TABLE public.user_bot_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id bigint NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  pgn text,
  time_spent_seconds integer,
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_results_user ON public.user_bot_results(user_id, played_at DESC);
CREATE INDEX idx_bot_results_user_bot ON public.user_bot_results(user_id, bot_id);

-- 2.6 — bot_game_analysis
CREATE TABLE public.bot_game_analysis (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_result_id bigint NOT NULL REFERENCES public.user_bot_results(id) ON DELETE CASCADE,
  bot_id bigint NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  pgn text NOT NULL,
  moves_analysis_json jsonb NOT NULL DEFAULT '[]',
  accuracy_percent numeric(5,2),
  brilliant integer NOT NULL DEFAULT 0,
  great integer NOT NULL DEFAULT 0,
  good integer NOT NULL DEFAULT 0,
  inaccuracy integer NOT NULL DEFAULT 0,
  mistake integer NOT NULL DEFAULT 0,
  blunder integer NOT NULL DEFAULT 0,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_user ON public.bot_game_analysis(user_id);
CREATE INDEX idx_analysis_result ON public.bot_game_analysis(bot_result_id);

-- 2.7 — daily_missions, achievements, user_achievements
CREATE TABLE public.achievements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL UNIQUE, -- chave estável para referência (ex: 'defeat_first_bot')
  title text NOT NULL,
  description text NOT NULL,
  condition_type text NOT NULL, -- tipo de condição (ex: 'bots_defeated', 'puzzles_solved', 'rating_reached')
  condition_value integer NOT NULL DEFAULT 1, -- valor necessário
  reward_xp integer NOT NULL DEFAULT 0,
  reward_item_id bigint, -- FK adicionada após criação de items
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_achievements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id bigint NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- Missões diárias — cada registro = 1 missão sorteada para o user naquele dia
CREATE TABLE public.daily_missions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_date date NOT NULL DEFAULT CURRENT_DATE,
  mission_key text NOT NULL, -- referência ao template de missão
  mission_title text NOT NULL,
  mission_target integer NOT NULL DEFAULT 1, -- quantidade necessária
  mission_progress integer NOT NULL DEFAULT 0, -- progresso atual
  reward_xp integer NOT NULL DEFAULT 50,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, mission_date, mission_key)
);

CREATE INDEX idx_daily_missions_user_date ON public.daily_missions(user_id, mission_date);

-- Controle de baú diário (1 por dia ao completar 5 missões)
CREATE TABLE public.daily_chests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chest_date date NOT NULL DEFAULT CURRENT_DATE,
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  item_id bigint, -- item recebido (preenchido ao abrir)
  item_rarity text,
  UNIQUE(user_id, chest_date)
);

CREATE INDEX idx_daily_chests_user ON public.daily_chests(user_id, chest_date);

-- 2.8 — items, user_inventory, user_equipped
CREATE TABLE public.items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slot text NOT NULL CHECK (slot IN ('head', 'outfit', 'hand', 'background', 'frame', 'pet')),
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  image_url text,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_slot ON public.items(slot);
CREATE INDEX idx_items_rarity ON public.items(rarity);
CREATE INDEX idx_items_slot_rarity ON public.items(slot, rarity);

-- Adiciona FK de achievements para items
ALTER TABLE public.achievements
  ADD CONSTRAINT fk_achievements_reward_item
  FOREIGN KEY (reward_item_id) REFERENCES public.items(id) ON DELETE SET NULL;

CREATE TABLE public.user_inventory (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id bigint NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'chest' CHECK (source IN ('chest', 'achievement', 'level_up', 'welcome', 'streak')),
  obtained_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_inventory_user ON public.user_inventory(user_id);

CREATE TABLE public.user_equipped (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('head', 'outfit', 'hand', 'background', 'frame', 'pet')),
  item_id bigint NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot)
);

CREATE INDEX idx_equipped_user ON public.user_equipped(user_id);

-- 2.9 — user_streaks, user_titles, puzzle_revanche_queue
CREATE TABLE public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_titles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_title text NOT NULL DEFAULT 'Aprendiz',
  highest_trail_completed text, -- null = nenhuma trilha completa
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.puzzle_revanche_queue (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  puzzle_id bigint NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  review_count integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  resolved boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, puzzle_id)
);

CREATE INDEX idx_revanche_user_next ON public.puzzle_revanche_queue(user_id, next_review_at)
  WHERE resolved = false;

-- 2.10 — classes, class_members, class_tasks, user_task_progress, class_feed
CREATE TABLE public.classes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);
CREATE UNIQUE INDEX idx_classes_invite ON public.classes(invite_code);

CREATE TABLE public.class_members (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

CREATE INDEX idx_class_members_user ON public.class_members(user_id);
CREATE INDEX idx_class_members_class ON public.class_members(class_id);

CREATE TABLE public.class_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('lesson', 'puzzles_theme', 'puzzles_count', 'bot', 'rush')),
  config_json jsonb NOT NULL DEFAULT '{}',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  deadline timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_tasks_class ON public.class_tasks(class_id);

CREATE TABLE public.user_task_progress (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id bigint NOT NULL REFERENCES public.class_tasks(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_task_progress_user ON public.user_task_progress(user_id);
CREATE INDEX idx_task_progress_task ON public.user_task_progress(task_id);

CREATE TABLE public.class_feed (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'bot_defeated', 'level_up', 'rating_milestone', 'title_earned', 'streak_milestone', 'rush_record', 'achievement_unlocked'
  event_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_feed_class ON public.class_feed(class_id, created_at DESC);

-- 2.11 — puzzle_rush_runs
CREATE TABLE public.puzzle_rush_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('3min', '5min')),
  score integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  avg_time_per_puzzle integer, -- ms
  lives_remaining integer NOT NULL DEFAULT 0,
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rush_runs_user ON public.puzzle_rush_runs(user_id, played_at DESC);
CREATE INDEX idx_rush_runs_score_3min ON public.puzzle_rush_runs(score DESC) WHERE mode = '3min';
CREATE INDEX idx_rush_runs_score_5min ON public.puzzle_rush_runs(score DESC) WHERE mode = '5min';

-- Trigger para atualizar updated_at em users
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
