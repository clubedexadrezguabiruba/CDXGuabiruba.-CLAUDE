-- ============================================================
-- Forja de Experiência: itens duplicados → XP
--
-- Quando o jogador abre um baú e já possui o item sorteado,
-- o item é "forjado em experiência" — convertido em XP:
--   common=5, rare=10, epic=20, legendary=35
--
-- 1. Atualizar grant_xp para aceitar source 'item_scrap'
-- 2. Reescrever claim_chest com detecção de duplicata + scrap XP
-- 3. Atualizar check_achievements para scrap de item duplicado
-- ============================================================

-- ============================================================
-- 1. grant_xp: adicionar 'item_scrap' ao whitelist de sources
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
  v_new_xp integer;
  v_new_level integer;
  v_xp_for_next integer;
  v_leveled_up boolean := false;
  v_levels_gained integer := 0;
  v_old_level integer;
  v_i integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'XP deve ser positivo';
  END IF;

  IF p_source NOT IN ('mission', 'achievement', 'streak_bonus', 'item_scrap') THEN
    RAISE EXCEPTION 'Fonte de XP inválida: %', p_source;
  END IF;

  -- Idempotência: verificar se já concedeu XP para esta chave
  INSERT INTO public.xp_grants (user_id, source, source_id, amount)
  VALUES (v_user_id, p_source, p_source_id, p_amount)
  ON CONFLICT (user_id, source, source_id) DO NOTHING;

  -- Se não inseriu (já existia), retorna sem conceder
  IF NOT FOUND THEN
    SELECT xp, level INTO v_new_xp, v_new_level
    FROM public.users WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'xp_granted', 0,
      'already_granted', true,
      'source', p_source,
      'xp_current', v_new_xp,
      'level', v_new_level,
      'leveled_up', false,
      'levels_gained', 0
    );
  END IF;

  -- Lock do usuário para transação segura
  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  v_old_level := v_user.level;
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

-- ============================================================
-- 2. claim_chest: detectar duplicata e converter em XP
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_chest(
  p_chest_id bigint
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_chest record;
  v_roll numeric;
  v_rarity text;
  v_item record;
  v_is_duplicate boolean := false;
  v_scrap_xp integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Busca baú do usuário em user_chests
  SELECT * INTO v_chest
  FROM public.user_chests
  WHERE id = p_chest_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baú não encontrado ou não pertence a você';
  END IF;

  -- Idempotência: se já foi aberto, retorna resultado anterior
  IF v_chest.claimed THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'item_id', v_chest.item_id,
      'rarity', v_chest.item_rarity
    );
  END IF;

  -- Roll de raridade (drop rates da Visão do Produto)
  v_roll := random();
  IF v_roll < 0.07 THEN
    v_rarity := 'legendary';  -- 7%
  ELSIF v_roll < 0.25 THEN
    v_rarity := 'epic';       -- 18%
  ELSIF v_roll < 0.55 THEN
    v_rarity := 'rare';       -- 30%
  ELSE
    v_rarity := 'common';     -- 45%
  END IF;

  -- Seleciona item aleatório da raridade
  -- Prioriza itens que o user NÃO tem
  SELECT i.* INTO v_item
  FROM public.items i
  WHERE i.rarity = v_rarity
    AND NOT EXISTS (
      SELECT 1 FROM public.user_inventory ui
      WHERE ui.user_id = v_user_id AND ui.item_id = i.id
    )
  ORDER BY random()
  LIMIT 1;

  -- Se tem todos da raridade, pega qualquer um (será duplicata)
  IF NOT FOUND THEN
    SELECT i.* INTO v_item
    FROM public.items i
    WHERE i.rarity = v_rarity
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Fallback: qualquer item
  IF NOT FOUND THEN
    SELECT i.* INTO v_item
    FROM public.items i
    ORDER BY random()
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum item disponível no sistema';
  END IF;

  -- Tenta adicionar ao inventário (idempotente via UNIQUE)
  INSERT INTO public.user_inventory (user_id, item_id, source)
  VALUES (v_user_id, v_item.id, 'chest')
  ON CONFLICT (user_id, item_id) DO NOTHING;

  -- Detectar duplicata: se ON CONFLICT pulou o insert, FOUND = false
  IF NOT FOUND THEN
    v_is_duplicate := true;
    -- Calcular XP de forja baseado na raridade do item
    v_scrap_xp := CASE v_item.rarity
      WHEN 'common'    THEN 5
      WHEN 'rare'      THEN 10
      WHEN 'epic'      THEN 20
      WHEN 'legendary' THEN 35
      ELSE 5
    END;

    -- Conceder XP de forja (idempotente via xp_grants UNIQUE)
    PERFORM public.grant_xp(
      p_amount := v_scrap_xp,
      p_source := 'item_scrap',
      p_source_id := 'scrap_chest_' || p_chest_id::text
    );
  END IF;

  -- Marca baú como aberto em user_chests
  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(),
      item_id = v_item.id, item_rarity = v_rarity
  WHERE id = p_chest_id;

  RETURN jsonb_build_object(
    'claimed', true,
    'rarity', v_rarity,
    'scrapped', v_is_duplicate,
    'scrapped_xp', CASE WHEN v_is_duplicate THEN v_scrap_xp ELSE 0 END,
    'item', jsonb_build_object(
      'id', v_item.id,
      'name', v_item.name,
      'slot', v_item.slot,
      'rarity', v_item.rarity,
      'image_url', v_item.image_url,
      'description', v_item.description
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. check_achievements: scrap de item duplicado de conquista
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ach record;
  v_current_value integer;
  v_user record;
  v_streak record;
  v_unlock_id bigint;
  v_newly_unlocked jsonb := '[]'::jsonb;
  v_item_inserted boolean;
  v_scrap_xp integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Pre-fetch dados do usuário (usados por várias conquistas)
  SELECT level, puzzle_rating, puzzle_best_streak
  INTO v_user
  FROM public.users WHERE id = v_user_id;

  SELECT longest_streak INTO v_streak
  FROM public.user_streaks WHERE user_id = v_user_id;

  -- Loop por conquistas não desbloqueadas
  FOR v_ach IN
    SELECT a.*
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.achievement_id = a.id AND ua.user_id = v_user_id
    )
    ORDER BY a.id
  LOOP
    v_current_value := 0;

    -- Calcular valor atual baseado no condition_type
    CASE v_ach.condition_type
      WHEN 'bots_defeated', 'bots_defeated_unique' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_bot_first_wins
        WHERE user_id = v_user_id;

      WHEN 'puzzles_solved' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id AND solved = true;

      WHEN 'rating_reached' THEN
        v_current_value := COALESCE(v_user.puzzle_rating, 0);

      WHEN 'puzzle_streak' THEN
        v_current_value := COALESCE(v_user.puzzle_best_streak, 0);

      WHEN 'lessons_completed' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_lesson_progress
        WHERE user_id = v_user_id AND completed = true;

      WHEN 'rush_score' THEN
        SELECT COALESCE(MAX(score), 0)::integer INTO v_current_value
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id AND status = 'completed';

      WHEN 'level_reached' THEN
        v_current_value := COALESCE(v_user.level, 1);

      WHEN 'day_streak' THEN
        v_current_value := COALESCE(v_streak.longest_streak, 0);

      ELSE
        v_current_value := 0;
    END CASE;

    -- Verificar se atingiu o threshold
    IF v_current_value >= v_ach.condition_value THEN
      -- Desbloquear (idempotente via UNIQUE constraint)
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (v_user_id, v_ach.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING id INTO v_unlock_id;

      -- Se realmente inseriu (primeira vez)
      IF v_unlock_id IS NOT NULL THEN
        -- Conceder XP se reward_xp > 0
        IF v_ach.reward_xp > 0 THEN
          PERFORM public.grant_xp(
            p_amount := v_ach.reward_xp,
            p_source := 'achievement',
            p_source_id := 'ach_' || v_ach.key
          );
        END IF;

        -- Conceder item específico se reward_item_id IS NOT NULL
        v_item_inserted := false;
        v_scrap_xp := 0;
        IF v_ach.reward_item_id IS NOT NULL THEN
          INSERT INTO public.user_inventory (user_id, item_id, source)
          VALUES (v_user_id, v_ach.reward_item_id, 'achievement')
          ON CONFLICT (user_id, item_id) DO NOTHING;

          -- Detectar duplicata
          IF NOT FOUND THEN
            -- Item duplicado: forjar em XP baseado na raridade
            SELECT CASE i.rarity
              WHEN 'common'    THEN 5
              WHEN 'rare'      THEN 10
              WHEN 'epic'      THEN 20
              WHEN 'legendary' THEN 35
              ELSE 5
            END INTO v_scrap_xp
            FROM public.items i WHERE i.id = v_ach.reward_item_id;

            IF v_scrap_xp > 0 THEN
              PERFORM public.grant_xp(
                p_amount := v_scrap_xp,
                p_source := 'item_scrap',
                p_source_id := 'scrap_ach_' || v_ach.key
              );
            END IF;
          ELSE
            v_item_inserted := true;
          END IF;
        END IF;

        -- Conceder baú se reward_chest = true
        IF v_ach.reward_chest THEN
          INSERT INTO public.user_chests (user_id, source_type, source_id)
          VALUES (v_user_id, 'achievement', 'ach_' || v_ach.key)
          ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
        END IF;

        -- Adicionar à lista de recém-desbloqueadas
        v_newly_unlocked := v_newly_unlocked || jsonb_build_object(
          'key', v_ach.key,
          'title', v_ach.title,
          'description', v_ach.description,
          'icon', v_ach.icon,
          'reward_xp', v_ach.reward_xp,
          'reward_chest', v_ach.reward_chest,
          'category', v_ach.category,
          'scrapped_xp', v_scrap_xp
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_newly_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
