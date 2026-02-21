-- ============================================================
-- Fix: Rush score calculado no servidor (server-authority)
--
-- Problemas encontrados:
--   1. end_rush aceitava score do client sem verificar
--      contra tentativas reais registradas.
--   2. v_time_limit era computado mas NUNCA usado para rejeitar.
--   3. v_actual_score era declarado mas NUNCA atribuido.
--   4. user_puzzle_attempts nao tinha coluna rush_run_id,
--      impossibilitando correlacionar tentativas a um run.
--
-- Correcoes:
--   1. Adiciona coluna rush_run_id em user_puzzle_attempts
--   2. puzzle_attempt armazena rush_run_id no INSERT
--   3. end_rush calcula score real (count solved=true por run)
--   4. end_rush calcula best_streak real (max sequencia consecutiva)
--   5. end_rush enforca time limit
-- ============================================================

-- 1. Adicionar coluna rush_run_id
ALTER TABLE public.user_puzzle_attempts
  ADD COLUMN IF NOT EXISTS rush_run_id bigint
  REFERENCES public.puzzle_rush_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attempts_rush_run
  ON public.user_puzzle_attempts(rush_run_id)
  WHERE rush_run_id IS NOT NULL;

-- 2. Atualizar puzzle_attempt — incluir rush_run_id no INSERT
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
  -- Validacoes basicas
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('rating', 'category', 'rush', 'revanche') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Validar rush run se modo rush
  IF p_mode = 'rush' AND p_rush_run_id IS NOT NULL THEN
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

    -- Atualizar streak
    IF v_solved THEN
      v_streak := v_streak + 1;
      IF v_streak > v_best_streak THEN
        v_best_streak := v_streak;
      END IF;
    ELSE
      v_streak := 0;
    END IF;

    -- Atualizar usuario (rating + streak)
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

  -- Insere tentativa (AGORA COM rush_run_id)
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

  -- Se errou em rating, category ou rush → adiciona à fila de revanche
  -- next_review_at = now() para aparecer imediatamente
  IF NOT v_solved AND p_mode IN ('rating', 'category', 'rush') THEN
    INSERT INTO public.puzzle_revanche_queue (user_id, puzzle_id, next_review_at)
    VALUES (v_user_id, p_puzzle_id, now())
    ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
      next_review_at = now(),
      review_count = 0,
      resolved = false;
  END IF;

  -- Se acertou no modo revanche, atualiza queue com intervalos progressivos
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

  -- Se errou no modo revanche, reseta ciclo — disponível imediatamente
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

-- 3. Atualizar end_rush — score calculado no servidor
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
  -- Para calculo de best_streak
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
    -- Retornar resultado existente se já completada
    RETURN jsonb_build_object(
      'already_completed', true,
      'score', v_run.score,
      'best_streak', v_run.best_streak
    );
  END IF;

  -- Validar tempo (com 10s de buffer para latência)
  v_time_limit := CASE v_run.mode
    WHEN '3min' THEN interval '3 minutes 10 seconds'
    WHEN '5min' THEN interval '5 minutes 10 seconds'
  END;
  v_elapsed := now() - v_run.started_at;

  -- ENFORCAR TIME LIMIT (antes era computado mas nunca usado)
  IF v_elapsed > v_time_limit THEN
    -- Marcar como completed mesmo assim (não deixar active para sempre)
    UPDATE public.puzzle_rush_runs SET
      status = 'completed',
      ended_at = now(),
      score = 0,
      best_streak = 0,
      lives_remaining = 0
    WHERE id = p_rush_run_id;

    RAISE EXCEPTION 'Tempo excedido (% > %)', v_elapsed, v_time_limit;
  END IF;

  -- CALCULAR SCORE REAL no servidor (não confiar no client)
  SELECT count(*) INTO v_actual_score
  FROM public.user_puzzle_attempts
  WHERE rush_run_id = p_rush_run_id
    AND user_id = v_user_id
    AND solved = true;

  -- CALCULAR BEST_STREAK REAL (sequência máxima de solved=true consecutivos)
  -- Percorre tentativas na ordem de criação
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

  -- Atualizar run com dados do SERVIDOR
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

  -- Verificar se é novo recorde pessoal (usando score do servidor)
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
