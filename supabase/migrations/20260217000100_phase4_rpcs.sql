-- ============================================================
-- FASE 4 — RPCs de PUZZLES
-- Glicko-2, matchmaking, skip, rush, revanche
-- Server-authority: client envia tentativas, servidor decide tudo
-- ============================================================

-- ============================================================
-- 1. calculate_glicko2 — Funcao auxiliar pura (IMMUTABLE)
-- Implementa o algoritmo Glicko-2 completo
-- Ref: http://www.glicko.net/glicko/glicko2.pdf
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_glicko2(
  p_player_rating numeric,
  p_player_rd numeric,
  p_player_vol numeric,
  p_opponent_rating numeric,
  p_opponent_rd numeric,
  p_score numeric  -- 1.0 = vitoria, 0.0 = derrota
)
RETURNS TABLE(new_rating numeric, new_rd numeric, new_vol numeric)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  -- Constantes Glicko-2
  v_tau numeric := 0.5;
  v_epsilon numeric := 0.000001;
  v_scale numeric := 173.7178;

  -- Glicko-2 scale
  v_mu numeric;
  v_phi numeric;
  v_sigma numeric;
  v_mu_j numeric;
  v_phi_j numeric;

  -- Calculos intermediarios
  v_g numeric;
  v_E numeric;
  v_v numeric;
  v_delta numeric;

  -- Volatilidade iterativa (Illinois method)
  v_ln_sigma2 numeric;
  v_il_x numeric;
  v_il_y numeric;
  v_il_z numeric;
  v_fx numeric;
  v_fy numeric;
  v_fz numeric;
  v_sigma_prime numeric;
  v_phi_star numeric;
  v_phi_prime numeric;
  v_mu_prime numeric;
  v_k integer;
BEGIN
  -- Converter para escala Glicko-2
  v_mu := (p_player_rating - 1500.0) / v_scale;
  v_phi := p_player_rd / v_scale;
  v_sigma := p_player_vol;
  v_mu_j := (p_opponent_rating - 1500.0) / v_scale;
  v_phi_j := p_opponent_rd / v_scale;

  -- Passo 3: g(phi_j)
  v_g := 1.0 / sqrt(1.0 + 3.0 * v_phi_j * v_phi_j / (pi() * pi()));

  -- Passo 3: E(mu, mu_j, phi_j)
  v_E := 1.0 / (1.0 + exp(-v_g * (v_mu - v_mu_j)));

  -- Passo 3: v (variancia estimada)
  v_v := 1.0 / (v_g * v_g * v_E * (1.0 - v_E));

  -- Passo 4: delta
  v_delta := v_v * v_g * (p_score - v_E);

  -- Passo 5: Atualizar volatilidade (Illinois method)
  v_ln_sigma2 := ln(v_sigma * v_sigma);
  v_il_x := v_ln_sigma2;

  IF (v_delta * v_delta) > (v_phi * v_phi + v_v) THEN
    v_il_y := ln(v_delta * v_delta - v_phi * v_phi - v_v);
  ELSE
    v_k := 1;
    WHILE (v_ln_sigma2 - v_k * v_tau) > ln(v_delta * v_delta - v_phi * v_phi - v_v)
      OR (v_delta * v_delta) <= (v_phi * v_phi + v_v) LOOP
      v_k := v_k + 1;
      EXIT WHEN v_k > 100;
    END LOOP;
    v_il_y := v_ln_sigma2 - v_k * v_tau;
  END IF;

  -- Funcao f(x) inline
  v_fx := (exp(v_il_x) * (v_delta * v_delta - v_phi * v_phi - v_v - exp(v_il_x))) /
           (2.0 * (v_phi * v_phi + v_v + exp(v_il_x)) * (v_phi * v_phi + v_v + exp(v_il_x)))
           - (v_il_x - v_ln_sigma2) / (v_tau * v_tau);

  v_fy := (exp(v_il_y) * (v_delta * v_delta - v_phi * v_phi - v_v - exp(v_il_y))) /
           (2.0 * (v_phi * v_phi + v_v + exp(v_il_y)) * (v_phi * v_phi + v_v + exp(v_il_y)))
           - (v_il_y - v_ln_sigma2) / (v_tau * v_tau);

  -- Iteracao Illinois
  FOR i IN 1..100 LOOP
    EXIT WHEN abs(v_il_y - v_il_x) <= v_epsilon;

    v_il_z := v_il_x + (v_il_x - v_il_y) * v_fx / (v_fy - v_fx);

    v_fz := (exp(v_il_z) * (v_delta * v_delta - v_phi * v_phi - v_v - exp(v_il_z))) /
             (2.0 * (v_phi * v_phi + v_v + exp(v_il_z)) * (v_phi * v_phi + v_v + exp(v_il_z)))
             - (v_il_z - v_ln_sigma2) / (v_tau * v_tau);

    IF v_fz * v_fy <= 0 THEN
      v_il_x := v_il_y;
      v_fx := v_fy;
    ELSE
      v_fx := v_fx / 2.0;
    END IF;

    v_il_y := v_il_z;
    v_fy := v_fz;
  END LOOP;

  v_sigma_prime := exp(v_il_x / 2.0);

  -- Passo 6: phi*
  v_phi_star := sqrt(v_phi * v_phi + v_sigma_prime * v_sigma_prime);

  -- Passo 7: Novo phi e mu
  v_phi_prime := 1.0 / sqrt(1.0 / (v_phi_star * v_phi_star) + 1.0 / v_v);
  v_mu_prime := v_mu + v_phi_prime * v_phi_prime * v_g * (p_score - v_E);

  -- Converter de volta para escala de rating
  new_rating := GREATEST(100, LEAST(3000, round(v_mu_prime * v_scale + 1500.0)));
  new_rd := GREATEST(30, LEAST(350, round((v_phi_prime * v_scale)::numeric, 2)));
  new_vol := GREATEST(0.01, LEAST(0.15, round(v_sigma_prime::numeric, 6)));

  RETURN NEXT;
END;
$$;

-- ============================================================
-- 2. puzzle_attempt — SUBSTITUIR existente
-- Agora com Glicko-2 real, streak, rush validation
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

-- ============================================================
-- 3. get_next_puzzle_rating — Matchmaking server-side
-- Seleciona puzzle por rating ±100, anti-repeticao 30 dias
-- ============================================================
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

-- ============================================================
-- 4. get_next_puzzle_category — Puzzle por tema + dificuldade
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_puzzle_category(
  p_theme text,
  p_difficulty text DEFAULT 'all'
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_puzzle record;
  v_min_rating integer;
  v_max_rating integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Definir range por dificuldade
  CASE p_difficulty
    WHEN 'easy' THEN v_min_rating := 400; v_max_rating := 1000;
    WHEN 'medium' THEN v_min_rating := 1000; v_max_rating := 1600;
    WHEN 'hard' THEN v_min_rating := 1600; v_max_rating := 3000;
    ELSE v_min_rating := 0; v_max_rating := 3000;
  END CASE;

  SELECT p.id, p.lichess_id, p.fen, p.moves, p.rating, p.rating_deviation, p.themes
  INTO v_puzzle
  FROM public.puzzles p
  WHERE p_theme = ANY(p.themes)
    AND p.rating BETWEEN v_min_rating AND v_max_rating
  ORDER BY random()
  LIMIT 1;

  IF v_puzzle.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhum puzzle encontrado para este tema/dificuldade');
  END IF;

  RETURN jsonb_build_object(
    'puzzle', jsonb_build_object(
      'id', v_puzzle.id,
      'lichess_id', v_puzzle.lichess_id,
      'fen', v_puzzle.fen,
      'moves', v_puzzle.moves,
      'rating', v_puzzle.rating,
      'themes', v_puzzle.themes
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. skip_puzzle — Skip 1 a cada 10 puzzles no rating mode
-- ============================================================
CREATE OR REPLACE FUNCTION public.skip_puzzle()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total_attempts bigint;
  v_skips_used integer;
  v_available integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT puzzle_skips_used INTO v_skips_used
  FROM public.users WHERE id = v_user_id FOR UPDATE;

  SELECT count(*) INTO v_total_attempts
  FROM public.user_puzzle_attempts
  WHERE user_id = v_user_id AND mode = 'rating';

  v_available := GREATEST(0, floor(v_total_attempts / 10.0)::integer - v_skips_used);

  IF v_available <= 0 THEN
    RAISE EXCEPTION 'Nenhum skip disponível (próximo em % puzzles)', (10 - (v_total_attempts % 10));
  END IF;

  UPDATE public.users
  SET puzzle_skips_used = puzzle_skips_used + 1
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'skipped', true,
    'skips_remaining', v_available - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. start_rush — Inicia rush com preload de puzzles
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_rush(
  p_mode text
)
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

  -- Expirar rush ativa anterior (se existir)
  UPDATE public.puzzle_rush_runs
  SET status = 'expired', ended_at = now()
  WHERE user_id = v_user_id AND status = 'active';

  -- Selecionar puzzles com progressao de dificuldade
  WITH ranked_puzzles AS (
    -- Faixa 1: Fácil (400-700) — 10 puzzles
    (SELECT id, fen, moves, rating, 1 as band
     FROM public.puzzles
     WHERE rating BETWEEN 400 AND 700
     ORDER BY random() LIMIT 10)
    UNION ALL
    -- Faixa 2: Médio-fácil (700-1100) — 10 puzzles
    (SELECT id, fen, moves, rating, 2 as band
     FROM public.puzzles
     WHERE rating BETWEEN 701 AND 1100
     ORDER BY random() LIMIT 10)
    UNION ALL
    -- Faixa 3: Médio (1100-1500) — 10 puzzles
    (SELECT id, fen, moves, rating, 3 as band
     FROM public.puzzles
     WHERE rating BETWEEN 1101 AND 1500
     ORDER BY random() LIMIT 10)
    UNION ALL
    -- Faixa 4: Difícil (1500-2200) — 5 puzzles
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

  -- Criar run
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

-- ============================================================
-- 7. end_rush — Finaliza rush run com validacao anti-cheat
-- ============================================================
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
  v_avg_time integer;
  v_is_record boolean := false;
  v_current_record integer;
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

  -- Atualizar run
  UPDATE public.puzzle_rush_runs SET
    status = 'completed',
    ended_at = now(),
    score = p_score,
    best_streak = p_best_streak,
    lives_remaining = p_lives_remaining,
    avg_time_per_puzzle = CASE
      WHEN p_score > 0 THEN (EXTRACT(EPOCH FROM v_elapsed) * 1000 / p_score)::integer
      ELSE NULL
    END
  WHERE id = p_rush_run_id;

  -- Verificar se e novo recorde pessoal
  IF v_run.mode = '3min' THEN
    SELECT rush_3min_record INTO v_current_record FROM public.users WHERE id = v_user_id;
    IF p_score > v_current_record THEN
      UPDATE public.users SET rush_3min_record = p_score WHERE id = v_user_id;
      v_is_record := true;
    END IF;
  ELSIF v_run.mode = '5min' THEN
    SELECT rush_5min_record INTO v_current_record FROM public.users WHERE id = v_user_id;
    IF p_score > v_current_record THEN
      UPDATE public.users SET rush_5min_record = p_score WHERE id = v_user_id;
      v_is_record := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'score', p_score,
    'best_streak', p_best_streak,
    'lives_remaining', p_lives_remaining,
    'elapsed_seconds', EXTRACT(EPOCH FROM v_elapsed)::integer,
    'avg_time_per_puzzle', CASE
      WHEN p_score > 0 THEN (EXTRACT(EPOCH FROM v_elapsed) * 1000 / p_score)::integer
      ELSE NULL
    END,
    'is_new_record', v_is_record,
    'previous_record', v_current_record
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. get_revanche_due — Puzzles de revanche prontos para revisao
-- ============================================================
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

  -- Total pendente (incluindo nao-due, para badge)
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
