-- ============================================================
-- Sistema de Ovos para Pets
--
-- Pets não são mais entregues diretamente. Em vez disso,
-- o aluno recebe um ovo misterioso que choca em 72 horas.
-- A raridade e o pet são ocultos até a eclosão.
--
-- 1. Tabela user_eggs (com CHECK constraints de integridade)
-- 2. _create_random_pet_egg (para baús)
-- 3. _create_specific_pet_egg (para conquistas com pet específico)
-- 4. get_eggs() — retorna apenas metadados, sem revelar conteúdo
-- 5. hatch_egg() — revela o pet após 72h
-- 6. Reescrever claim_chest com desvio pet → ovo
-- 7. Reescrever check_achievements com desvio pet → ovo
-- 8. Atualizar grant_xp para aceitar source 'egg_bonus'
-- ============================================================

-- ============================================================
-- 1. Tabela user_eggs
-- ============================================================
CREATE TABLE public.user_eggs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_item_id bigint REFERENCES public.items(id),
  rarity text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  status text NOT NULL CHECK (status IN ('hatching','queued','hatched')),
  created_at timestamptz NOT NULL DEFAULT now(),
  hatch_start_at timestamptz,
  hatched_at timestamptz,
  xp_bonus integer NOT NULL DEFAULT 0,
  source_type text NOT NULL CHECK (source_type IN ('chest','achievement')),
  source_id text NOT NULL,

  -- Invariantes de estado
  CHECK (xp_bonus >= 0),
  CHECK (
    (pet_item_id IS NOT NULL AND xp_bonus = 0) OR
    (pet_item_id IS NULL AND xp_bonus > 0)
  ),
  CHECK (
    (status = 'queued' AND hatch_start_at IS NULL AND hatched_at IS NULL) OR
    (status = 'hatching' AND hatch_start_at IS NOT NULL AND hatched_at IS NULL) OR
    (status = 'hatched' AND hatch_start_at IS NOT NULL AND hatched_at IS NOT NULL)
  )
);

-- Apenas 1 ovo 'hatching' por usuário
CREATE UNIQUE INDEX idx_one_hatching_per_user
  ON public.user_eggs(user_id) WHERE status = 'hatching';

-- Impedir reserva duplicada de pet em ovos ativos
CREATE UNIQUE INDEX idx_unique_pet_reservation
  ON public.user_eggs(user_id, pet_item_id)
  WHERE status IN ('hatching','queued') AND pet_item_id IS NOT NULL;

CREATE INDEX idx_user_eggs_active
  ON public.user_eggs(user_id) WHERE status IN ('hatching','queued');

ALTER TABLE public.user_eggs ENABLE ROW LEVEL SECURITY;
-- SEM policy de SELECT direto — acesso APENAS via RPCs (get_eggs, hatch_egg)
-- Isso impede que o client consulte a tabela e veja pet_item_id/rarity/xp_bonus

-- ============================================================
-- 2. _create_random_pet_egg (para baús)
-- ============================================================
CREATE OR REPLACE FUNCTION public._create_random_pet_egg(
  p_user_id uuid,
  p_rarity text,
  p_source_type text,
  p_source_id text
)
RETURNS jsonb AS $$
DECLARE
  v_pet record;
  v_has_hatching boolean;
  v_xp_bonus integer := 0;
  v_egg_id bigint;
  v_status text;
BEGIN
  -- Lock por usuário para evitar race condition
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Busca pet da raridade rolada que o usuário NÃO possui e NÃO tem reservado
  SELECT i.* INTO v_pet
  FROM public.items i
  WHERE i.slot = 'pet' AND i.rarity = p_rarity
    AND NOT EXISTS (
      SELECT 1 FROM public.user_inventory ui
      WHERE ui.user_id = p_user_id AND ui.item_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_eggs ue
      WHERE ue.user_id = p_user_id AND ue.pet_item_id = i.id
        AND ue.status IN ('hatching','queued')
    )
  ORDER BY random()
  LIMIT 1;

  -- Se não encontrou pet elegível da raridade → ovo de XP (sem fallback de raridade)
  IF NOT FOUND THEN
    v_xp_bonus := CASE p_rarity
      WHEN 'common'    THEN 15
      WHEN 'rare'      THEN 25
      WHEN 'epic'      THEN 40
      WHEN 'legendary' THEN 60
      ELSE 15
    END;
  END IF;

  -- Verificar se já tem ovo hatching
  SELECT EXISTS (
    SELECT 1 FROM public.user_eggs
    WHERE user_id = p_user_id AND status = 'hatching'
  ) INTO v_has_hatching;

  IF v_has_hatching THEN
    v_status := 'queued';
  ELSE
    v_status := 'hatching';
  END IF;

  INSERT INTO public.user_eggs (
    user_id, pet_item_id, rarity, status,
    hatch_start_at, xp_bonus, source_type, source_id
  )
  VALUES (
    p_user_id,
    CASE WHEN v_pet.id IS NOT NULL THEN v_pet.id ELSE NULL END,
    p_rarity,
    v_status,
    CASE WHEN v_status = 'hatching' THEN now() ELSE NULL END,
    v_xp_bonus,
    p_source_type,
    p_source_id
  )
  RETURNING id INTO v_egg_id;

  RETURN jsonb_build_object(
    'egg_id', v_egg_id,
    'status', v_status,
    'is_egg', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 3. _create_specific_pet_egg (para conquistas com pet específico)
-- ============================================================
CREATE OR REPLACE FUNCTION public._create_specific_pet_egg(
  p_user_id uuid,
  p_pet_item_id bigint,
  p_source_type text,
  p_source_id text
)
RETURNS jsonb AS $$
DECLARE
  v_pet_rarity text;
  v_has_hatching boolean;
  v_xp_bonus integer := 0;
  v_egg_id bigint;
  v_status text;
  v_already_owned boolean;
  v_already_reserved boolean;
BEGIN
  -- Lock por usuário
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Busca raridade do pet
  SELECT rarity INTO v_pet_rarity
  FROM public.items WHERE id = p_pet_item_id AND slot = 'pet';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item % não é um pet válido', p_pet_item_id;
  END IF;

  -- Verifica se já possui ou já tem reservado
  SELECT EXISTS (
    SELECT 1 FROM public.user_inventory
    WHERE user_id = p_user_id AND item_id = p_pet_item_id
  ) INTO v_already_owned;

  SELECT EXISTS (
    SELECT 1 FROM public.user_eggs
    WHERE user_id = p_user_id AND pet_item_id = p_pet_item_id
      AND status IN ('hatching','queued')
  ) INTO v_already_reserved;

  -- Se já possui ou já reservado → ovo de XP
  IF v_already_owned OR v_already_reserved THEN
    v_xp_bonus := CASE v_pet_rarity
      WHEN 'common'    THEN 15
      WHEN 'rare'      THEN 25
      WHEN 'epic'      THEN 40
      WHEN 'legendary' THEN 60
      ELSE 15
    END;
  END IF;

  -- Status: hatching ou queued
  SELECT EXISTS (
    SELECT 1 FROM public.user_eggs
    WHERE user_id = p_user_id AND status = 'hatching'
  ) INTO v_has_hatching;

  IF v_has_hatching THEN
    v_status := 'queued';
  ELSE
    v_status := 'hatching';
  END IF;

  INSERT INTO public.user_eggs (
    user_id, pet_item_id, rarity, status,
    hatch_start_at, xp_bonus, source_type, source_id
  )
  VALUES (
    p_user_id,
    CASE WHEN v_xp_bonus = 0 THEN p_pet_item_id ELSE NULL END,
    v_pet_rarity,
    v_status,
    CASE WHEN v_status = 'hatching' THEN now() ELSE NULL END,
    v_xp_bonus,
    p_source_type,
    p_source_id
  )
  RETURNING id INTO v_egg_id;

  RETURN jsonb_build_object(
    'egg_id', v_egg_id,
    'status', v_status,
    'is_egg', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 4. get_eggs() — retorna apenas metadados, sem revelar conteúdo
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_eggs()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY created_at, id)
    FROM (
      SELECT
        e.id, e.created_at,
        jsonb_build_object(
          'id', e.id,
          'status', e.status,
          'hatch_start_at', e.hatch_start_at,
          'created_at', e.created_at,
          'queue_position', CASE
            WHEN e.status = 'hatching' THEN NULL
            ELSE ROW_NUMBER() OVER (
              PARTITION BY (e.status = 'queued')
              ORDER BY e.created_at, e.id
            )
          END
        ) AS row_data
      FROM public.user_eggs e
      WHERE e.user_id = v_user_id AND e.status IN ('hatching','queued')
    ) sub
  ), '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 5. hatch_egg() — revela o pet após 72h
-- ============================================================
CREATE OR REPLACE FUNCTION public.hatch_egg(p_egg_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_egg record;
  v_pet record;
  v_elapsed interval;
  v_next_egg_id bigint;
  v_scrap_xp integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Lock do ovo
  SELECT * INTO v_egg
  FROM public.user_eggs
  WHERE id = p_egg_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ovo não encontrado';
  END IF;

  -- Idempotência: se já chocou
  IF v_egg.status = 'hatched' THEN
    RETURN jsonb_build_object('already_hatched', true);
  END IF;

  IF v_egg.status != 'hatching' THEN
    RAISE EXCEPTION 'Este ovo ainda está na fila';
  END IF;

  -- Validar 72h (server-side, anti-cheat)
  v_elapsed := now() - v_egg.hatch_start_at;
  IF v_elapsed < interval '72 hours' THEN
    RAISE EXCEPTION 'O ovo ainda não está pronto (faltam % horas)',
      round(EXTRACT(EPOCH FROM (interval '72 hours' - v_elapsed)) / 3600);
  END IF;

  -- Conceder recompensa
  IF v_egg.pet_item_id IS NOT NULL THEN
    -- Tentar inserir pet no inventário
    INSERT INTO public.user_inventory (user_id, item_id, source)
    VALUES (v_user_id, v_egg.pet_item_id, 'chest')
    ON CONFLICT (user_id, item_id) DO NOTHING;

    -- Safety net: se já possuía (edge case raro), scrap XP
    IF NOT FOUND THEN
      v_scrap_xp := CASE v_egg.rarity
        WHEN 'common'    THEN 5
        WHEN 'rare'      THEN 10
        WHEN 'epic'      THEN 20
        WHEN 'legendary' THEN 35
        ELSE 5
      END;

      PERFORM public.grant_xp(
        p_amount := v_scrap_xp,
        p_source := 'item_scrap',
        p_source_id := 'egg_scrap_' || p_egg_id::text
      );

      -- Marcar como chocado
      UPDATE public.user_eggs
      SET status = 'hatched', hatched_at = now()
      WHERE id = p_egg_id;

      -- Iniciar próximo ovo da fila
      SELECT id INTO v_next_egg_id
      FROM public.user_eggs
      WHERE user_id = v_user_id AND status = 'queued'
      ORDER BY created_at ASC, id ASC
      LIMIT 1;

      IF v_next_egg_id IS NOT NULL THEN
        UPDATE public.user_eggs
        SET status = 'hatching', hatch_start_at = now()
        WHERE id = v_next_egg_id;
      END IF;

      RETURN jsonb_build_object(
        'hatched', true,
        'is_xp_egg', true,
        'xp_bonus', v_scrap_xp,
        'pet', NULL,
        'next_egg_started', (v_next_egg_id IS NOT NULL)
      );
    END IF;

    -- Pet inserido com sucesso
    SELECT id, name, rarity, image_url, description
    INTO v_pet
    FROM public.items WHERE id = v_egg.pet_item_id;
  ELSE
    -- Ovo de XP (todos os pets já coletados)
    PERFORM public.grant_xp(
      p_amount := v_egg.xp_bonus,
      p_source := 'egg_bonus',
      p_source_id := 'egg_bonus_' || p_egg_id::text
    );
  END IF;

  -- Marcar como chocado
  UPDATE public.user_eggs
  SET status = 'hatched', hatched_at = now()
  WHERE id = p_egg_id;

  -- Iniciar próximo ovo da fila (FIFO por created_at, id)
  SELECT id INTO v_next_egg_id
  FROM public.user_eggs
  WHERE user_id = v_user_id AND status = 'queued'
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF v_next_egg_id IS NOT NULL THEN
    UPDATE public.user_eggs
    SET status = 'hatching', hatch_start_at = now()
    WHERE id = v_next_egg_id;
  END IF;

  RETURN jsonb_build_object(
    'hatched', true,
    'is_xp_egg', (v_egg.pet_item_id IS NULL),
    'xp_bonus', v_egg.xp_bonus,
    'pet', CASE WHEN v_pet.id IS NOT NULL THEN jsonb_build_object(
      'id', v_pet.id,
      'name', v_pet.name,
      'rarity', v_pet.rarity,
      'image_url', v_pet.image_url,
      'description', v_pet.description
    ) ELSE NULL END,
    'next_egg_started', (v_next_egg_id IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 6. grant_xp: adicionar 'egg_bonus' ao whitelist
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

  IF p_source NOT IN ('mission', 'achievement', 'streak_bonus', 'item_scrap', 'egg_bonus') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 7. claim_chest: desviar pet → ovo
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
  v_egg_result jsonb;
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

  -- ========== DESVIO PET → OVO ==========
  IF v_item.slot = 'pet' THEN
    -- Criar ovo — _create_random_pet_egg escolhe o pet elegível real
    -- v_item NÃO é o pet do ovo; apenas indica que o roll caiu em "pet"
    v_egg_result := public._create_random_pet_egg(
      v_user_id, v_rarity, 'chest', p_chest_id::text
    );

    -- Marcar baú como claimed — NÃO gravar item_id para não vazar pet real
    UPDATE public.user_chests
    SET claimed = true, claimed_at = now(), item_rarity = v_rarity
    WHERE id = p_chest_id;

    -- Retorno NÃO contém dados do pet — apenas sinaliza que é ovo
    RETURN jsonb_build_object(
      'claimed', true,
      'is_egg', true,
      'scrapped', false,
      'scrapped_xp', 0
    );
  END IF;
  -- ========== FIM DESVIO PET ==========

  -- Lógica normal para itens não-pet
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
    'is_egg', false,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 8. check_achievements: desviar pet → ovo
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
  v_reward_slot text;
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
        v_reward_slot := NULL;

        IF v_ach.reward_item_id IS NOT NULL THEN
          -- Verificar se é pet → desviar para ovo
          SELECT slot INTO v_reward_slot
          FROM public.items WHERE id = v_ach.reward_item_id;

          IF v_reward_slot = 'pet' THEN
            -- Criar ovo específico (pet da conquista)
            PERFORM public._create_specific_pet_egg(
              v_user_id, v_ach.reward_item_id, 'achievement', 'ach_' || v_ach.key
            );
          ELSE
            -- Item não-pet: lógica original
            INSERT INTO public.user_inventory (user_id, item_id, source)
            VALUES (v_user_id, v_ach.reward_item_id, 'achievement')
            ON CONFLICT (user_id, item_id) DO NOTHING;

            -- Detectar duplicata
            IF NOT FOUND THEN
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
        END IF;

        -- Conceder baú se reward_chest = true
        IF v_ach.reward_chest THEN
          INSERT INTO public.user_chests (user_id, source_type, source_id)
          VALUES (v_user_id, 'achievement', 'ach_' || v_ach.key)
          ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
        END IF;

        -- Adicionar à lista de recém-desbloqueadas
        -- NÃO incluir dados do pet quando é ovo
        v_newly_unlocked := v_newly_unlocked || jsonb_build_object(
          'key', v_ach.key,
          'title', v_ach.title,
          'description', v_ach.description,
          'icon', v_ach.icon,
          'reward_xp', v_ach.reward_xp,
          'reward_chest', v_ach.reward_chest,
          'reward_egg', (v_reward_slot = 'pet'),
          'category', v_ach.category,
          'scrapped_xp', v_scrap_xp
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_newly_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
