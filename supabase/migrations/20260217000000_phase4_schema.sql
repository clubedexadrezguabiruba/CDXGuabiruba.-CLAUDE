-- ============================================================
-- FASE 4 — SCHEMA CHANGES (Puzzles)
-- Adiciona colunas para streak, skip e rush lifecycle
-- ============================================================

-- 1. Colunas de puzzle streak e skip na tabela users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS puzzle_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS puzzle_best_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS puzzle_skips_used integer NOT NULL DEFAULT 0;

-- 2. Lifecycle de rush na tabela puzzle_rush_runs
ALTER TABLE public.puzzle_rush_runs
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS puzzle_ids bigint[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- Constraint de status (precisa dropar se existir para ser idempotente)
DO $$ BEGIN
  ALTER TABLE public.puzzle_rush_runs
    ADD CONSTRAINT puzzle_rush_runs_status_check
    CHECK (status IN ('active', 'completed', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Indice para matchmaking eficiente por rating
CREATE INDEX IF NOT EXISTS idx_puzzles_rating_id ON public.puzzles(rating, id);
