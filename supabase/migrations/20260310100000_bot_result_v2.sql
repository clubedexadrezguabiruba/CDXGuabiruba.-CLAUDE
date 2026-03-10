-- ============================================================
-- bot_result v2: unlock validation + PGN check + XP on first win
-- ============================================================

-- 1. Adicionar 'bot_win' às fontes permitidas de XP
CREATE OR REPLACE FUNCTION public.grant_xp(
  p_amount integer,
  p_source text,
  p_source_id text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user record;
  v_new_xp integer;
  v_new_level integer;
  v_xp_for_next integer;
  v_leveled_up boolean := false;
  v_levels_gained integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'XP deve ser positivo';
  END IF;

  IF p_source NOT IN ('mission', 'achievement', 'streak_bonus', 'bot_win') THEN
    RAISE EXCEPTION 'Fonte de XP inválida: %', p_source;
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  v_new_xp := v_user.xp + p_amount;
  v_new_level := v_user.level;

  LOOP
    v_xp_for_next := round(100 * power(1.05, v_new_level - 1))::integer;
    EXIT WHEN v_new_xp < v_xp_for_next OR v_new_level >= 100;
    v_new_xp := v_new_xp - v_xp_for_next;
    v_new_level := v_new_level + 1;
    v_levels_gained := v_levels_gained + 1;
    v_leveled_up := true;
  END LOOP;

  UPDATE public.users
  SET xp = v_new_xp, level = v_new_level
  WHERE id = v_user_id;

  IF v_leveled_up THEN
    FOR v_i IN 1..v_levels_gained LOOP
      INSERT INTO public.daily_chests (user_id, chest_date, claimed)
      VALUES (v_user_id, CURRENT_DATE, false)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'xp_granted', p_amount,
    'source', p_source,
    'xp_current', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_leveled_up,
    'levels_gained', v_levels_gained
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. bot_result v2: com validação de unlock, PGN e XP
CREATE OR REPLACE FUNCTION public.bot_result(
  p_bot_id bigint,
  p_result text,
  p_pgn text DEFAULT NULL,
  p_time_spent_seconds integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_bot record;
  v_result_id bigint;
  v_is_first_win boolean := false;
  v_xp_amount integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_result NOT IN ('win', 'loss', 'draw') THEN
    RAISE EXCEPTION 'Resultado inválido: %', p_result;
  END IF;

  -- Verifica bot
  SELECT * INTO v_bot FROM public.bots WHERE id = p_bot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bot não encontrado: %', p_bot_id;
  END IF;

  -- Validação de PGN: deve ter conteúdo mínimo
  IF p_pgn IS NULL OR length(trim(p_pgn)) < 10 THEN
    RAISE EXCEPTION 'PGN inválido ou ausente';
  END IF;

  -- Validação de unlock: bot com unlock_order > 1 requer vitória no anterior
  IF v_bot.unlock_order > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_bot_results ubr
      JOIN public.bots b ON b.id = ubr.bot_id
      WHERE ubr.user_id = v_user_id
        AND ubr.result = 'win'
        AND b.unlock_order = v_bot.unlock_order - 1
    ) THEN
      RAISE EXCEPTION 'Bot bloqueado. Derrote o anterior primeiro.';
    END IF;
  END IF;

  -- Rate limiting: máximo 1 resultado por bot a cada 30 segundos
  IF EXISTS (
    SELECT 1 FROM public.user_bot_results
    WHERE user_id = v_user_id
      AND bot_id = p_bot_id
      AND played_at > now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde antes de registrar outro resultado';
  END IF;

  -- Verifica se é a primeira vitória neste bot (para XP idempotente)
  IF p_result = 'win' THEN
    v_is_first_win := NOT EXISTS (
      SELECT 1 FROM public.user_bot_results
      WHERE user_id = v_user_id
        AND bot_id = p_bot_id
        AND result = 'win'
    );
  END IF;

  -- Insere resultado
  INSERT INTO public.user_bot_results (user_id, bot_id, result, pgn, time_spent_seconds)
  VALUES (v_user_id, p_bot_id, p_result, p_pgn, p_time_spent_seconds)
  RETURNING id INTO v_result_id;

  -- Concede XP apenas na primeira vitória contra cada bot
  IF p_result = 'win' AND v_is_first_win THEN
    v_xp_amount := GREATEST(10, v_bot.elo / 10);
    PERFORM public.grant_xp(
      p_amount := v_xp_amount,
      p_source := 'bot_win',
      p_source_id := 'bot_win_' || p_bot_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'bot_id', p_bot_id,
    'bot_name', v_bot.name,
    'result', p_result,
    'first_win', v_is_first_win
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
