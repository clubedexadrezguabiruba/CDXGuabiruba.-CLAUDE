-- ============================================================
-- Anti-flood: filtrar eventos ruidosos no mural
-- level_up: só a cada 5 níveis (5, 10, 15, 20...)
-- rush_record: só com score >= 5
-- ============================================================

-- 1. grant_xp — emite level_up no mural SOMENTE a cada 5 níveis
CREATE OR REPLACE FUNCTION public.grant_xp(
  p_amount integer,
  p_source text,
  p_source_id text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user record;
  v_xp_for_next integer;
  v_new_xp integer;
  v_new_level integer;
  v_old_level integer;
  v_levels_gained integer := 0;
  v_leveled_up boolean := false;
  v_i integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Quantidade de XP deve ser positiva';
  END IF;

  -- Idempotência: só concede XP uma vez por source+source_id
  INSERT INTO public.xp_grants (user_id, source, source_id, amount)
  VALUES (v_user_id, p_source, p_source_id, p_amount)
  ON CONFLICT (user_id, source, source_id) DO NOTHING;

  IF NOT FOUND THEN
    -- Já foi concedido anteriormente
    SELECT xp, level INTO v_user FROM public.users WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'xp_granted', 0,
      'already_granted', true,
      'source', p_source,
      'xp_current', v_user.xp,
      'level', v_user.level,
      'leveled_up', false,
      'levels_gained', 0
    );
  END IF;

  -- Busca estado atual
  SELECT * INTO v_user FROM public.users WHERE id = v_user_id FOR UPDATE;
  v_old_level := v_user.level;

  -- Calcula novo XP e nível
  v_new_xp := v_user.xp + p_amount;
  v_new_level := v_user.level;

  -- Verifica level ups (fórmula: 100 * 1.05^(n-1))
  LOOP
    v_xp_for_next := round(100 * power(1.05, v_new_level - 1))::integer;
    EXIT WHEN v_new_xp < v_xp_for_next OR v_new_level >= 100;
    v_new_xp := v_new_xp - v_xp_for_next;
    v_new_level := v_new_level + 1;
    v_levels_gained := v_levels_gained + 1;
    v_leveled_up := true;
  END LOOP;

  -- Atualiza user
  UPDATE public.users
  SET xp = v_new_xp, level = v_new_level
  WHERE id = v_user_id;

  -- Se subiu de nível, cria baú(s) de level-up em user_chests
  IF v_leveled_up THEN
    FOR v_i IN 1..v_levels_gained LOOP
      INSERT INTO public.user_chests (user_id, source_type, source_id)
      VALUES (v_user_id, 'level_up', 'level_' || (v_old_level + v_i)::text)
      ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
    END LOOP;

    -- Refresh ranking para refletir novo nível imediatamente
    PERFORM public.refresh_public_profiles();

    -- Emitir evento de level_up no mural SOMENTE a cada 5 níveis
    IF v_new_level % 5 = 0 THEN
      PERFORM public.emit_class_feed(
        v_user_id,
        'level_up',
        jsonb_build_object('new_level', v_new_level)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'xp_granted', p_amount,
    'already_granted', false,
    'source', p_source,
    'xp_current', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_leveled_up,
    'levels_gained', v_levels_gained
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. end_rush — emite rush_record no mural SOMENTE com score >= 5
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

  -- Validar tempo (com 10s de buffer)
  v_time_limit := CASE v_run.mode
    WHEN '3min' THEN interval '3 minutes 10 seconds'
    WHEN '5min' THEN interval '5 minutes 10 seconds'
    ELSE NULL
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

  -- CALCULAR SCORE REAL no servidor
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

  -- Emitir evento de rush_record no mural SOMENTE com score >= 5
  IF v_is_record AND v_actual_score >= 5 THEN
    PERFORM public.emit_class_feed(
      v_user_id,
      'rush_record',
      jsonb_build_object('mode', v_run.mode, 'score', v_actual_score)
    );
  END IF;

  -- Atualizar missões diárias
  PERFORM public.check_daily_missions();

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


-- 3. Cleanup: remover eventos ruidosos existentes
DELETE FROM public.class_feed
WHERE event_type = 'level_up'
  AND (event_data->>'new_level')::int % 5 != 0;

DELETE FROM public.class_feed
WHERE event_type = 'rush_record'
  AND (event_data->>'score')::int < 5;
