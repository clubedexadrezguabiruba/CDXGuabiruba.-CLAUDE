-- ============================================================
-- Revanche Improvements
--
-- Mudanças:
--   1. puzzle_attempt: reset parcial (bug 5), soft cap 30 (sobrecarga),
--      retorno enriquecido para mode=revanche
--   2. get_revanche_due: adiciona resolved_count ao retorno
-- ============================================================

-- 1. puzzle_attempt — recriar com melhorias revanche
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
  -- Revanche extras
  v_revanche_pending integer;
  v_rev_count integer;
  v_rev_resolved boolean;
  v_rev_next timestamptz;
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
  -- Com soft cap: se >= 30 pendentes, novos entram com delay de 1 dia
  -- ON CONFLICT (puzzle já existe): sempre now() (sem delay)
  IF NOT v_solved AND p_mode IN ('rating', 'category', 'rush', 'resistencia') THEN
    SELECT count(*) INTO v_revanche_pending
    FROM public.puzzle_revanche_queue
    WHERE user_id = v_user_id AND resolved = false;

    INSERT INTO public.puzzle_revanche_queue (user_id, puzzle_id, next_review_at)
    VALUES (
      v_user_id, p_puzzle_id,
      CASE WHEN v_revanche_pending >= 30
           THEN now() + interval '1 day'
           ELSE now()
      END
    )
    ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
      next_review_at = now(),
      review_count = CASE
        WHEN puzzle_revanche_queue.resolved = true THEN 0
        ELSE GREATEST(puzzle_revanche_queue.review_count - 1, 0)
      END,
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

  -- Retorno enriquecido: buscar estado revanche após update
  IF p_mode = 'revanche' THEN
    SELECT review_count, resolved, next_review_at
    INTO v_rev_count, v_rev_resolved, v_rev_next
    FROM public.puzzle_revanche_queue
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
    'correct_moves', v_correct_moves,
    'revanche_resolved', COALESCE(v_rev_resolved, false),
    'revanche_review_count', COALESCE(v_rev_count, 0),
    'revanche_next_review', v_rev_next
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_revanche_due — adicionar resolved_count
CREATE OR REPLACE FUNCTION public.get_revanche_due()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_due_puzzles jsonb;
  v_total_pending integer;
  v_resolved_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Puzzles prontos para revisao (due now)
  SELECT jsonb_agg(
    jsonb_build_object(
      'queue_id', rq.id,
      'puzzle_id', rq.puzzle_id,
      'added_at', rq.added_at,
      'review_count', rq.review_count,
      'next_review_at', rq.next_review_at,
      'puzzle', jsonb_build_object(
        'id', p.id,
        'lichess_id', p.lichess_id,
        'fen', p.fen,
        'moves', p.moves,
        'rating', p.rating,
        'themes', p.themes
      )
    ) ORDER BY rq.next_review_at ASC
  )
  INTO v_due_puzzles
  FROM public.puzzle_revanche_queue rq
  JOIN public.puzzles p ON p.id = rq.puzzle_id
  WHERE rq.user_id = v_user_id
    AND rq.resolved = false
    AND rq.next_review_at <= now();

  -- Total pendente (nao resolvidos)
  SELECT count(*) INTO v_total_pending
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = false;

  -- Total dominados (graduados)
  SELECT count(*) INTO v_resolved_count
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = true;

  RETURN jsonb_build_object(
    'due_puzzles', COALESCE(v_due_puzzles, '[]'::jsonb),
    'due_count', jsonb_array_length(COALESCE(v_due_puzzles, '[]'::jsonb)),
    'total_pending', v_total_pending,
    'resolved_count', v_resolved_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
