-- ============================================================
-- Modo Resistência: 3 erros = game over, dificuldade progressiva
--
-- Mudanças:
--   1. Coluna rush_resistencia_record em users
--   2. CHECK constraints atualizadas (puzzle_rush_runs + user_puzzle_attempts)
--   3. Índice parcial para ranking de resistência
--   4. View materializada recriada com nova coluna
--   5. start_rush aceita modo 'resistencia' (60 puzzles, 5 tiers)
--   6. end_rush suporta resistencia (sem time limit, novo recorde)
--   7. puzzle_attempt aceita modo 'resistencia' (revanche + run validation)
-- ============================================================

-- 1. Coluna no users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS rush_resistencia_record integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_rush_resistencia
  ON public.users(rush_resistencia_record DESC);

-- 2. CHECK constraints — aceitar 'resistencia'
ALTER TABLE public.puzzle_rush_runs
  DROP CONSTRAINT IF EXISTS puzzle_rush_runs_mode_check;
ALTER TABLE public.puzzle_rush_runs
  ADD CONSTRAINT puzzle_rush_runs_mode_check
  CHECK (mode IN ('3min', '5min', 'resistencia'));

ALTER TABLE public.user_puzzle_attempts
  DROP CONSTRAINT IF EXISTS user_puzzle_attempts_mode_check;
ALTER TABLE public.user_puzzle_attempts
  ADD CONSTRAINT user_puzzle_attempts_mode_check
  CHECK (mode IN ('rating', 'category', 'rush', 'revanche', 'resistencia'));

-- 3. Índice parcial para ranking
CREATE INDEX IF NOT EXISTS idx_rush_runs_score_resistencia
  ON public.puzzle_rush_runs(score DESC) WHERE mode = 'resistencia';

-- 4. Recriar view materializada com rush_resistencia_record
DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_config,
  u.level,
  u.xp,
  u.puzzle_rating,
  u.rush_3min_record,
  u.rush_5min_record,
  u.rush_resistencia_record,
  u.ranking_visible,
  COALESCE(ut.current_title, 'Aprendiz') AS title,
  COALESCE(us.current_streak, 0) AS current_streak,
  u.created_at AS member_since
FROM public.users u
LEFT JOIN public.user_titles ut ON ut.user_id = u.id
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE u.role IN ('aluno', 'professor');

CREATE UNIQUE INDEX idx_public_profiles_user ON public.user_public_profiles(user_id);
CREATE INDEX idx_public_profiles_rating ON public.user_public_profiles(puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level ON public.user_public_profiles(level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3 ON public.user_public_profiles(rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5 ON public.user_public_profiles(rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia ON public.user_public_profiles(rush_resistencia_record DESC);

-- 5. start_rush — aceitar 'resistencia' com 60 puzzles progressivos
CREATE OR REPLACE FUNCTION public.start_rush(p_mode text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_run_id bigint;
  v_puzzles jsonb;
  v_puzzle_ids bigint[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('3min', '5min', 'resistencia') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Expirar rush ativa anterior (se existir)
  UPDATE public.puzzle_rush_runs
  SET status = 'expired', ended_at = now()
  WHERE user_id = v_user_id AND status = 'active';

  -- Selecionar puzzles com progressão de dificuldade
  IF p_mode = 'resistencia' THEN
    -- Resistência: 60 puzzles, 5 tiers progressivos
    WITH ranked_puzzles AS (
      (SELECT id, fen, moves, rating, 1 as band
       FROM public.puzzles
       WHERE rating BETWEEN 400 AND 800
       ORDER BY random() LIMIT 5)
      UNION ALL
      (SELECT id, fen, moves, rating, 2 as band
       FROM public.puzzles
       WHERE rating BETWEEN 801 AND 1200
       ORDER BY random() LIMIT 5)
      UNION ALL
      (SELECT id, fen, moves, rating, 3 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1201 AND 1600
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 4 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1601 AND 2000
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 5 as band
       FROM public.puzzles
       WHERE rating > 2000
       ORDER BY random() LIMIT 30)
    )
    SELECT
      jsonb_agg(jsonb_build_object(
        'id', rp.id,
        'fen', rp.fen,
        'moves', rp.moves,
        'rating', rp.rating
      ) ORDER BY rp.band, random()),
      array_agg(rp.id ORDER BY rp.band, random())
    INTO v_puzzles, v_puzzle_ids
    FROM ranked_puzzles rp;
  ELSE
    -- Rush (3min/5min): 35 puzzles, 4 tiers
    WITH ranked_puzzles AS (
      (SELECT id, fen, moves, rating, 1 as band
       FROM public.puzzles
       WHERE rating BETWEEN 400 AND 700
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 2 as band
       FROM public.puzzles
       WHERE rating BETWEEN 701 AND 1100
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 3 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1101 AND 1500
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 4 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1501 AND 2200
       ORDER BY random() LIMIT 5)
    )
    SELECT
      jsonb_agg(jsonb_build_object(
        'id', rp.id,
        'fen', rp.fen,
        'moves', rp.moves,
        'rating', rp.rating
      ) ORDER BY rp.band, random()),
      array_agg(rp.id ORDER BY rp.band, random())
    INTO v_puzzles, v_puzzle_ids
    FROM ranked_puzzles rp;
  END IF;

  INSERT INTO public.puzzle_rush_runs (
    user_id, mode, started_at, status, puzzle_ids, score, best_streak, lives_remaining
  ) VALUES (
    v_user_id, p_mode, now(), 'active', v_puzzle_ids, 0, 0, 3
  ) RETURNING id INTO v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'mode', p_mode,
    'puzzles', v_puzzles,
    'total_puzzles', jsonb_array_length(v_puzzles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. end_rush — suportar resistencia (sem time limit, novo recorde)
CREATE OR REPLACE FUNCTION public.end_rush(
  p_rush_run_id bigint,
  p_score integer,
  p_best_streak integer,
  p_lives_remaining integer
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_run record;
  v_time_limit interval;
  v_elapsed interval;
  v_actual_score integer;
  v_actual_best_streak integer := 0;
  v_avg_time integer;
  v_is_record boolean := false;
  v_current_record integer;
  v_current_streak integer := 0;
  v_attempt record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Buscar run
  SELECT * INTO v_run
  FROM public.puzzle_rush_runs
  WHERE id = p_rush_run_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rush run não encontrada';
  END IF;

  IF v_run.status != 'active' THEN
    RETURN jsonb_build_object(
      'already_completed', true,
      'score', v_run.score,
      'best_streak', v_run.best_streak
    );
  END IF;

  -- Validar tempo (com 10s de buffer) — apenas para modos com timer
  v_time_limit := CASE v_run.mode
    WHEN '3min' THEN interval '3 minutes 10 seconds'
    WHEN '5min' THEN interval '5 minutes 10 seconds'
    ELSE NULL  -- resistencia: sem limite de tempo
  END;
  v_elapsed := now() - v_run.started_at;

  IF v_time_limit IS NOT NULL AND v_elapsed > v_time_limit THEN
    UPDATE public.puzzle_rush_runs SET
      status = 'completed',
      ended_at = now(),
      score = 0,
      best_streak = 0,
      lives_remaining = 0
    WHERE id = p_rush_run_id;

    RAISE EXCEPTION 'Tempo excedido (% > %)', v_elapsed, v_time_limit;
  END IF;

  -- CALCULAR SCORE REAL no servidor (por rush_run_id)
  SELECT count(*) INTO v_actual_score
  FROM public.user_puzzle_attempts
  WHERE rush_run_id = p_rush_run_id
    AND user_id = v_user_id
    AND solved = true;

  -- CALCULAR BEST_STREAK REAL
  FOR v_attempt IN
    SELECT solved
    FROM public.user_puzzle_attempts
    WHERE rush_run_id = p_rush_run_id
      AND user_id = v_user_id
    ORDER BY id ASC
  LOOP
    IF v_attempt.solved THEN
      v_current_streak := v_current_streak + 1;
      IF v_current_streak > v_actual_best_streak THEN
        v_actual_best_streak := v_current_streak;
      END IF;
    ELSE
      v_current_streak := 0;
    END IF;
  END LOOP;

  -- Atualizar run
  UPDATE public.puzzle_rush_runs SET
    status = 'completed',
    ended_at = now(),
    score = v_actual_score,
    best_streak = v_actual_best_streak,
    lives_remaining = p_lives_remaining,
    avg_time_per_puzzle = CASE
      WHEN v_actual_score > 0 THEN (EXTRACT(EPOCH FROM v_elapsed) * 1000 / v_actual_score)::integer
      ELSE NULL
    END
  WHERE id = p_rush_run_id;

  -- Verificar recorde pessoal
  IF v_run.mode = '3min' THEN
    SELECT rush_3min_record INTO v_current_record FROM public.users WHERE id = v_user_id;
    IF v_actual_score > COALESCE(v_current_record, 0) THEN
      UPDATE public.users SET rush_3min_record = v_actual_score WHERE id = v_user_id;
      v_is_record := true;
    END IF;
  ELSIF v_run.mode = '5min' THEN
    SELECT rush_5min_record INTO v_current_record FROM public.users WHERE id = v_user_id;
    IF v_actual_score > COALESCE(v_current_record, 0) THEN
      UPDATE public.users SET rush_5min_record = v_actual_score WHERE id = v_user_id;
      v_is_record := true;
    END IF;
  ELSIF v_run.mode = 'resistencia' THEN
    SELECT rush_resistencia_record INTO v_current_record FROM public.users WHERE id = v_user_id;
    IF v_actual_score > COALESCE(v_current_record, 0) THEN
      UPDATE public.users SET rush_resistencia_record = v_actual_score WHERE id = v_user_id;
      v_is_record := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'score', v_actual_score,
    'best_streak', v_actual_best_streak,
    'lives_remaining', p_lives_remaining,
    'elapsed_seconds', EXTRACT(EPOCH FROM v_elapsed)::integer,
    'avg_time_per_puzzle', CASE
      WHEN v_actual_score > 0 THEN (EXTRACT(EPOCH FROM v_elapsed) * 1000 / v_actual_score)::integer
      ELSE NULL
    END,
    'is_new_record', v_is_record,
    'previous_record', v_current_record
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. puzzle_attempt — aceitar 'resistencia', validar run, revanche
CREATE OR REPLACE FUNCTION public.puzzle_attempt(
  p_puzzle_id bigint,
  p_moves text[],
  p_mode text DEFAULT 'rating',
  p_time_spent_ms integer DEFAULT NULL,
  p_rush_run_id bigint DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_puzzle record;
  v_correct_moves text[];
  v_solved boolean;
  v_rating_before integer;
  v_rating_after integer;
  v_rating_delta integer := 0;
  v_rd_before numeric(8,2);
  v_rd_after numeric(8,2);
  v_vol_before numeric(8,6);
  v_vol_after numeric(8,6);
  v_attempt_id bigint;
  v_glicko record;
  v_user record;
  v_streak integer;
  v_best_streak integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('rating', 'category', 'rush', 'revanche', 'resistencia') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Validar rush run se modo rush ou resistencia
  IF p_mode IN ('rush', 'resistencia') AND p_rush_run_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.puzzle_rush_runs
      WHERE id = p_rush_run_id
        AND user_id = v_user_id
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Rush run inválida ou expirada';
    END IF;
  END IF;

  -- Busca puzzle
  SELECT * INTO v_puzzle FROM public.puzzles WHERE id = p_puzzle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Puzzle não encontrado: %', p_puzzle_id;
  END IF;

  -- Busca dados do usuario (lock para atomicidade)
  SELECT puzzle_rating, puzzle_rd, puzzle_volatility, puzzle_streak, puzzle_best_streak
  INTO v_user
  FROM public.users WHERE id = v_user_id FOR UPDATE;

  v_rating_before := v_user.puzzle_rating;
  v_rd_before := v_user.puzzle_rd;
  v_vol_before := v_user.puzzle_volatility;
  v_streak := v_user.puzzle_streak;
  v_best_streak := v_user.puzzle_best_streak;

  -- Converte solucao do puzzle em array
  v_correct_moves := string_to_array(v_puzzle.moves, ' ');

  -- Verifica se moves do client batem com a solucao
  v_solved := (p_moves = v_correct_moves);

  -- Glicko-2 apenas no modo rating
  IF p_mode = 'rating' THEN
    SELECT g.new_rating, g.new_rd, g.new_vol
    INTO v_glicko
    FROM public.calculate_glicko2(
      v_rating_before::numeric,
      v_rd_before::numeric,
      v_vol_before::numeric,
      v_puzzle.rating::numeric,
      v_puzzle.rating_deviation::numeric,
      CASE WHEN v_solved THEN 1.0 ELSE 0.0 END
    ) g;

    v_rating_after := v_glicko.new_rating::integer;
    v_rd_after := v_glicko.new_rd;
    v_vol_after := v_glicko.new_vol;
    v_rating_delta := v_rating_after - v_rating_before;

    IF v_solved THEN
      v_streak := v_streak + 1;
      IF v_streak > v_best_streak THEN
        v_best_streak := v_streak;
      END IF;
    ELSE
      v_streak := 0;
    END IF;

    UPDATE public.users SET
      puzzle_rating = v_rating_after,
      puzzle_rd = v_rd_after,
      puzzle_volatility = v_vol_after,
      puzzle_streak = v_streak,
      puzzle_best_streak = v_best_streak
    WHERE id = v_user_id;
  ELSE
    v_rating_after := v_rating_before;
    v_rd_after := v_rd_before;
    v_vol_after := v_vol_before;
  END IF;

  -- Insere tentativa
  INSERT INTO public.user_puzzle_attempts (
    user_id, puzzle_id, solved, moves_played,
    rating_before, rating_after, rating_delta,
    rd_before, rd_after,
    time_spent_ms, mode, rush_run_id
  ) VALUES (
    v_user_id, p_puzzle_id, v_solved, p_moves,
    v_rating_before, v_rating_after, v_rating_delta,
    v_rd_before, v_rd_after,
    p_time_spent_ms, p_mode, p_rush_run_id
  ) RETURNING id INTO v_attempt_id;

  -- Errou em rating/category/rush/resistencia → fila de revanche
  IF NOT v_solved AND p_mode IN ('rating', 'category', 'rush', 'resistencia') THEN
    INSERT INTO public.puzzle_revanche_queue (user_id, puzzle_id, next_review_at)
    VALUES (v_user_id, p_puzzle_id, now())
    ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
      next_review_at = now(),
      review_count = 0,
      resolved = false;
  END IF;

  -- Acertou no modo revanche → atualiza queue com intervalos progressivos
  IF v_solved AND p_mode = 'revanche' THEN
    UPDATE public.puzzle_revanche_queue
    SET
      last_reviewed_at = now(),
      review_count = review_count + 1,
      next_review_at = CASE
        WHEN review_count = 0 THEN now() + interval '1 day'
        WHEN review_count = 1 THEN now() + interval '3 days'
        ELSE now()
      END,
      resolved = CASE WHEN review_count >= 2 THEN true ELSE false END
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  -- Errou no modo revanche → reseta ciclo
  IF NOT v_solved AND p_mode = 'revanche' THEN
    UPDATE public.puzzle_revanche_queue
    SET
      last_reviewed_at = now(),
      review_count = 0,
      next_review_at = now()
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'solved', v_solved,
    'rating_before', v_rating_before,
    'rating_after', v_rating_after,
    'rating_delta', v_rating_delta,
    'rd_after', v_rd_after,
    'streak', v_streak,
    'best_streak', v_best_streak,
    'correct_moves', v_correct_moves
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
