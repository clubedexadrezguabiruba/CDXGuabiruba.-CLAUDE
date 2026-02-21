-- ============================================================
-- Fix definitivo: Revanche queue — puzzles devem aparecer
-- imediatamente após erro
--
-- Problemas encontrados (diagnose-revanche.ts):
--
--   1. TABLE DEFAULT de next_review_at era now() + 1 day.
--      Versões anteriores de puzzle_attempt omitiam next_review_at
--      no INSERT, usando esse default bugado.
--
--   2. OVERLOAD AMBÍGUO: migration 180300 (Fase 2) criou
--      puzzle_attempt com 4 params (sem p_rush_run_id).
--      Fase 4 criou versão com 5 params. CREATE OR REPLACE
--      NÃO substitui quando a assinatura é diferente — ambas
--      coexistem. PostgREST retorna "Could not choose the
--      best candidate function" e a RPC falha silenciosamente.
--
--   3. get_revanche_due filtra next_review_at <= now(), então
--      com DEFAULT de +1 day, puzzles nunca apareciam no dia.
--
--   4. calculate_glicko2 ELSE branch computava ln(negativo)
--      quando delta² <= phi² + v → crash "cannot take logarithm
--      of a negative number". Afeta toda derrota no modo rating
--      para certos perfis (ex: rating=400, RD=350).
--
-- Correções:
--   1. DROP da versão antiga (4 params) de puzzle_attempt
--   2. Altera TABLE DEFAULT para now() (sem delay)
--   3. Fix calculate_glicko2 ELSE branch (Illinois method)
--   4. Re-aplica puzzle_attempt canônico (5 params)
--   5. Resgata entries stuck (review_count=0 com due no futuro)
-- ============================================================

-- 1. DROP da versão antiga de puzzle_attempt (4 params, sem p_rush_run_id)
--    Resolve o overload ambíguo que fazia a RPC falhar
DROP FUNCTION IF EXISTS public.puzzle_attempt(bigint, text[], text, integer);

-- 2. Corrigir TABLE DEFAULT
ALTER TABLE public.puzzle_revanche_queue
  ALTER COLUMN next_review_at SET DEFAULT now();

-- 3. Fix calculate_glicko2 — ELSE branch do Illinois method
--    Bug: quando delta² <= phi² + v, computava ln(delta² - phi² - v)
--    que é ln(negativo) → crash. Fix: avaliar f(a - k*tau) diretamente
--    para encontrar B, conforme Glicko-2 paper Step 5.
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
  v_tmp_fy numeric;
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
    -- Glicko-2 paper Step 5: find smallest k where f(a - k*tau) < 0
    v_k := 1;
    LOOP
      v_il_y := v_ln_sigma2 - v_k * v_tau;
      -- Evaluate f(v_il_y) inline
      v_tmp_fy := (exp(v_il_y) * (v_delta * v_delta - v_phi * v_phi - v_v - exp(v_il_y))) /
                   (2.0 * (v_phi * v_phi + v_v + exp(v_il_y)) * (v_phi * v_phi + v_v + exp(v_il_y)))
                   - (v_il_y - v_ln_sigma2) / (v_tau * v_tau);
      EXIT WHEN v_tmp_fy < 0 OR v_k > 100;
      v_k := v_k + 1;
    END LOOP;
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

-- 4. Re-aplicar puzzle_attempt canônico (5 params)
--    (corpo de 20260217100000_consolidate_puzzle_attempt.sql)
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

-- 5. Resgatar entries stuck (review_count=0 com next_review_at no futuro)
UPDATE public.puzzle_revanche_queue
SET next_review_at = now()
WHERE resolved = false
  AND review_count = 0
  AND next_review_at > now();
