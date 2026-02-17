-- ============================================================
-- Fix: ensure_user_profile helper + update RPCs to auto-create profiles
-- Handles users created before the auth trigger was deployed
-- ============================================================

-- Helper: creates a minimal profile for the authenticated user if missing
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RETURN;
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  v_name := COALESCE(split_part(v_email, '@', 1), 'Usuário');

  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (v_user_id, COALESCE(v_email, ''), v_name, v_name, 'aluno', 0, 1, 400, 350.00, 0.060000)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_titles (user_id, current_title)
  VALUES (v_user_id, 'Aprendiz')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_next_puzzle_rating to auto-create profile
CREATE OR REPLACE FUNCTION public.get_next_puzzle_rating()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user record;
  v_puzzle record;
  v_range integer := 100;
  v_skips_available integer;
  v_total_attempts bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  SELECT puzzle_rating, puzzle_rd, puzzle_streak, puzzle_best_streak, puzzle_skips_used
  INTO v_user
  FROM public.users WHERE id = v_user_id;

  -- Tentar range ±100, expandir para ±200, depois ±400 se necessario
  FOREACH v_range IN ARRAY ARRAY[100, 200, 400] LOOP
    SELECT p.id, p.lichess_id, p.fen, p.moves, p.rating, p.rating_deviation, p.themes
    INTO v_puzzle
    FROM public.puzzles p
    WHERE p.rating BETWEEN (v_user.puzzle_rating - v_range) AND (v_user.puzzle_rating + v_range)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_puzzle_attempts a
        WHERE a.user_id = v_user_id
          AND a.puzzle_id = p.id
          AND a.mode = 'rating'
          AND a.attempted_at > now() - interval '30 days'
      )
    ORDER BY random()
    LIMIT 1;

    EXIT WHEN v_puzzle.id IS NOT NULL;
  END LOOP;

  IF v_puzzle.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhum puzzle disponível no momento');
  END IF;

  -- Calcular skips disponiveis
  SELECT count(*) INTO v_total_attempts
  FROM public.user_puzzle_attempts
  WHERE user_id = v_user_id AND mode = 'rating';

  v_skips_available := GREATEST(0, floor(v_total_attempts / 10.0)::integer - v_user.puzzle_skips_used);

  RETURN jsonb_build_object(
    'puzzle', jsonb_build_object(
      'id', v_puzzle.id,
      'lichess_id', v_puzzle.lichess_id,
      'fen', v_puzzle.fen,
      'moves', v_puzzle.moves,
      'rating', v_puzzle.rating,
      'themes', v_puzzle.themes
    ),
    'user_rating', v_user.puzzle_rating,
    'user_rd', v_user.puzzle_rd,
    'streak', v_user.puzzle_streak,
    'best_streak', v_user.puzzle_best_streak,
    'skips_available', v_skips_available
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update puzzle_attempt to auto-create profile
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

  -- Insere tentativa
  INSERT INTO public.user_puzzle_attempts (
    user_id, puzzle_id, solved, moves_played,
    rating_before, rating_after, rating_delta,
    rd_before, rd_after,
    time_spent_ms, mode
  ) VALUES (
    v_user_id, p_puzzle_id, v_solved, p_moves,
    v_rating_before, v_rating_after, v_rating_delta,
    v_rd_before, v_rd_after,
    p_time_spent_ms, p_mode
  ) RETURNING id INTO v_attempt_id;

  -- Se errou no modo rating ou category, adiciona a fila de revanche
  IF NOT v_solved AND p_mode IN ('rating', 'category') THEN
    INSERT INTO public.puzzle_revanche_queue (user_id, puzzle_id)
    VALUES (v_user_id, p_puzzle_id)
    ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
      next_review_at = now() + interval '1 day',
      review_count = 0,
      resolved = false;
  END IF;

  -- Se acertou no modo revanche, atualiza queue
  IF v_solved AND p_mode = 'revanche' THEN
    UPDATE public.puzzle_revanche_queue
    SET
      last_reviewed_at = now(),
      review_count = review_count + 1,
      next_review_at = CASE
        WHEN review_count = 0 THEN now() + interval '3 days'
        WHEN review_count = 1 THEN now() + interval '7 days'
        ELSE now()
      END,
      resolved = CASE WHEN review_count >= 2 THEN true ELSE false END
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  -- Se errou no modo revanche, reseta ciclo
  IF NOT v_solved AND p_mode = 'revanche' THEN
    UPDATE public.puzzle_revanche_queue
    SET
      last_reviewed_at = now(),
      review_count = 0,
      next_review_at = now() + interval '1 day'
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

-- Update start_rush to auto-create profile
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

  IF p_mode NOT IN ('3min', '5min') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Expirar rush ativa anterior (se existir)
  UPDATE public.puzzle_rush_runs
  SET status = 'expired', ended_at = now()
  WHERE user_id = v_user_id AND status = 'active';

  -- Selecionar puzzles com progressao de dificuldade
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

-- Update get_revanche_due to auto-create profile
CREATE OR REPLACE FUNCTION public.get_revanche_due()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_due_puzzles jsonb;
  v_total_pending integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

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

  SELECT count(*) INTO v_total_pending
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = false;

  RETURN jsonb_build_object(
    'due_puzzles', COALESCE(v_due_puzzles, '[]'::jsonb),
    'due_count', jsonb_array_length(COALESCE(v_due_puzzles, '[]'::jsonb)),
    'total_pending', v_total_pending
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
