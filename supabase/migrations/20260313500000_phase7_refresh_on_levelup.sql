-- ============================================================
-- FASE 7 — Patch: refresh materialized view no level-up
-- ============================================================
-- Mitigação parcial de freshness do ranking.
-- Dispara refresh_public_profiles() apenas quando o aluno sobe de nível,
-- garantindo que o ranking reflita o novo level imediatamente.
--
-- Dados que continuam potencialmente stale:
-- - puzzle_rating (atualizado em puzzle_attempt, sem refresh)
-- - xp (atualizado em grant_xp sem level-up, sem refresh)
-- - current_streak (atualizado em check_daily_missions, sem refresh)
-- Solução completa requer cron ou refresh em mais pontos (futuro).
-- ============================================================

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
  -- Cada nível ganho gera um baú com source_id único (level_N)
  IF v_leveled_up THEN
    FOR v_i IN 1..v_levels_gained LOOP
      INSERT INTO public.user_chests (user_id, source_type, source_id)
      VALUES (v_user_id, 'level_up', 'level_' || (v_old_level + v_i)::text)
      ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
    END LOOP;

    -- Refresh ranking para refletir novo nível imediatamente
    PERFORM public.refresh_public_profiles();
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
