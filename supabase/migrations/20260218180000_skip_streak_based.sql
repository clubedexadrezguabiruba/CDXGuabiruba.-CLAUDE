-- Migration: Skip streak-based (não cumulativo)
-- Skip é ganho ao atingir streak >= 10 no modo rating.
-- Máximo 1 skip disponível por vez. Ao usar, precisa de outro 10-streak.

-- 1. Adicionar coluna para controlar skip streak-based
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS puzzle_skip_available boolean NOT NULL DEFAULT false;

-- ============================================================
-- 2. puzzle_attempt — adiciona concessão de skip ao atingir streak >= 10
-- ============================================================
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

    -- Conceder skip ao atingir 10-streak (se não tem skip pendente)
    IF v_streak >= 10 THEN
      UPDATE public.users SET puzzle_skip_available = true WHERE id = v_user_id;
    END IF;
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

-- ============================================================
-- 3. get_next_puzzle_rating — usa puzzle_skip_available (0 ou 1)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_puzzle_rating()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user record;
  v_puzzle record;
  v_range integer := 100;
  v_skips_available integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT puzzle_rating, puzzle_rd, puzzle_streak, puzzle_best_streak, puzzle_skip_available
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

  -- Skip disponível: 1 se tem, 0 se não
  v_skips_available := CASE WHEN v_user.puzzle_skip_available THEN 1 ELSE 0 END;

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

-- ============================================================
-- 4. skip_puzzle — consome puzzle_skip_available (boolean)
-- ============================================================
CREATE OR REPLACE FUNCTION public.skip_puzzle()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_available boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verificar se tem skip disponível (com lock)
  SELECT puzzle_skip_available INTO v_available
  FROM public.users WHERE id = v_user_id FOR UPDATE;

  IF NOT v_available THEN
    RAISE EXCEPTION 'Nenhum skip disponível (acerte 10 seguidos para ganhar)';
  END IF;

  -- Consumir skip
  UPDATE public.users
  SET puzzle_skip_available = false
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'skipped', true,
    'skips_remaining', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
