-- ============================================================
-- Fase 7 — Bloco 0: user_chests + xp_grants + correções
--
-- 1. Cria tabela user_chests (substitui daily_chests)
-- 2. Migra dados existentes de daily_chests → user_chests
-- 3. Cria tabela xp_grants (idempotência de grant_xp)
-- 4. Reescreve claim_chest para usar user_chests
-- 5. Reescreve grant_xp com idempotência real + user_chests
-- 6. Reescreve check_daily_missions com timezone Brasília + user_chests
-- 7. Reescreve handle_new_user para usar user_chests
-- 8. Remove XP direto de bot_result e complete_lesson_step
-- 9. Adiciona colunas flexíveis em achievements
-- ============================================================

-- ============================================================
-- 1. TABELA user_chests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_chests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('welcome', 'level_up', 'daily_missions', 'achievement', 'streak_bonus')),
  source_id text NOT NULL,  -- ex: 'welcome', 'level_5', '2026-03-10', 'ach_defeat_all_10_bots'
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  item_id bigint REFERENCES public.items(id),
  item_rarity text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_type, source_id)
);

CREATE INDEX idx_user_chests_user_unclaimed ON public.user_chests(user_id) WHERE NOT claimed;
CREATE INDEX idx_user_chests_user ON public.user_chests(user_id, granted_at DESC);

ALTER TABLE public.user_chests ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_chests_select_own ON public.user_chests
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 2. MIGRAR DADOS de daily_chests → user_chests
-- ============================================================
INSERT INTO public.user_chests (user_id, source_type, source_id, claimed, claimed_at, item_id, item_rarity, granted_at)
SELECT
  dc.user_id,
  CASE
    WHEN dc.chest_date = '0001-01-01' THEN 'welcome'
    ELSE 'daily_missions'
  END,
  CASE
    WHEN dc.chest_date = '0001-01-01' THEN 'welcome'
    ELSE dc.chest_date::text
  END,
  dc.claimed,
  dc.claimed_at,
  dc.item_id,
  dc.item_rarity,
  COALESCE(dc.claimed_at, now())
FROM public.daily_chests dc
ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

-- ============================================================
-- 3. TABELA xp_grants (idempotência de grant_xp)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.xp_grants (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_id text NOT NULL,
  amount integer NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

CREATE INDEX idx_xp_grants_user ON public.xp_grants(user_id);

ALTER TABLE public.xp_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY xp_grants_select_own ON public.xp_grants
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 4. REESCREVER claim_chest → usa user_chests
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

  -- Se tem todos da raridade, pega qualquer um
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

  -- Adiciona ao inventário (idempotente via UNIQUE)
  INSERT INTO public.user_inventory (user_id, item_id, source)
  VALUES (v_user_id, v_item.id, 'chest')
  ON CONFLICT (user_id, item_id) DO NOTHING;

  -- Marca baú como aberto em user_chests
  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(),
      item_id = v_item.id, item_rarity = v_rarity
  WHERE id = p_chest_id;

  RETURN jsonb_build_object(
    'claimed', true,
    'rarity', v_rarity,
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
-- 5. REESCREVER grant_xp com idempotência real + user_chests
-- Fontes permitidas: 'mission', 'achievement', 'streak_bonus'
-- (bot_win removido — XP só vem de missões e conquistas)
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

  IF p_source NOT IN ('mission', 'achievement', 'streak_bonus') THEN
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
  -- Cada nível ganho gera um baú com source_id único (level_N)
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
-- 6. REESCREVER check_daily_missions com timezone Brasília + user_chests
-- Pool mantido em 10 por agora (será expandido no Bloco 1)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_daily_missions()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_mission_count integer;
  v_missions jsonb;
  v_all_completed boolean;
  v_chest_exists boolean;
  -- Pool de missões (10 iniciais — será expandido para ~20 no Bloco 1)
  v_pool text[][] := ARRAY[
    ARRAY['solve_5_rating', 'Resolva 5 puzzles no Modo Rating', '5', '50'],
    ARRAY['solve_10_rating', 'Resolva 10 puzzles no Modo Rating', '10', '80'],
    ARRAY['complete_1_lesson', 'Complete 1 aula', '1', '60'],
    ARRAY['defeat_1_bot', 'Derrote 1 bot', '1', '70'],
    ARRAY['streak_3_puzzles', 'Acerte 3 puzzles seguidos', '3', '50'],
    ARRAY['do_1_rush', 'Faça 1 Puzzle Rush', '1', '60'],
    ARRAY['solve_5_category', 'Resolva 5 puzzles de uma categoria', '5', '50'],
    ARRAY['rush_5_correct', 'Alcance 5 acertos no Puzzle Rush', '5', '80'],
    ARRAY['solve_1_mate2', 'Resolva 1 puzzle de mate em 2', '1', '50'],
    ARRAY['play_10_minutes', 'Jogue 10 minutos no total', '10', '40']
  ];
  v_selected integer[];
  v_idx integer;
  v_i integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verifica se já tem missões hoje
  SELECT count(*) INTO v_mission_count
  FROM public.daily_missions
  WHERE user_id = v_user_id AND mission_date = v_today;

  -- Se não tem, sorteia 5 do pool
  IF v_mission_count = 0 THEN
    v_selected := ARRAY[]::integer[];
    WHILE array_length(v_selected, 1) IS NULL OR array_length(v_selected, 1) < 5 LOOP
      v_idx := floor(random() * array_length(v_pool, 1))::integer + 1;
      IF NOT (v_idx = ANY(v_selected)) THEN
        v_selected := v_selected || v_idx;
      END IF;
    END LOOP;

    FOR v_i IN 1..5 LOOP
      INSERT INTO public.daily_missions (
        user_id, mission_date, mission_key, mission_title,
        mission_target, reward_xp
      ) VALUES (
        v_user_id,
        v_today,
        v_pool[v_selected[v_i]][1],
        v_pool[v_selected[v_i]][2],
        v_pool[v_selected[v_i]][3]::integer,
        v_pool[v_selected[v_i]][4]::integer
      ) ON CONFLICT (user_id, mission_date, mission_key) DO NOTHING;
    END LOOP;
  END IF;

  -- Retorna missões do dia
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', dm.id,
      'mission_key', dm.mission_key,
      'title', dm.mission_title,
      'target', dm.mission_target,
      'progress', dm.mission_progress,
      'reward_xp', dm.reward_xp,
      'completed', dm.completed
    ) ORDER BY dm.id
  ) INTO v_missions
  FROM public.daily_missions dm
  WHERE dm.user_id = v_user_id AND dm.mission_date = v_today;

  -- Verifica se todas 5 estão completas
  SELECT NOT EXISTS (
    SELECT 1 FROM public.daily_missions
    WHERE user_id = v_user_id AND mission_date = v_today AND NOT completed
  ) INTO v_all_completed;

  -- Verifica se baú já existe em user_chests
  SELECT EXISTS (
    SELECT 1 FROM public.user_chests
    WHERE user_id = v_user_id
      AND source_type = 'daily_missions'
      AND source_id = v_today::text
  ) INTO v_chest_exists;

  -- Se todas completas e baú não existe, cria baú
  IF v_all_completed AND NOT v_chest_exists AND v_mission_count > 0 THEN
    INSERT INTO public.user_chests (user_id, source_type, source_id)
    VALUES (v_user_id, 'daily_missions', v_today::text)
    ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'date', v_today,
    'missions', COALESCE(v_missions, '[]'::jsonb),
    'all_completed', v_all_completed,
    'chest_available', (v_all_completed AND NOT v_chest_exists)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. REESCREVER handle_new_user → usa user_chests para welcome
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_name text;
BEGIN
  -- Extrair nome do email (parte antes do @)
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  -- display_name: primeiro nome + inicial (privacidade/LGPD)
  v_display_name := split_part(v_name, ' ', 1);
  IF v_display_name = v_name AND length(v_name) > 0 THEN
    v_display_name := v_name;
  ELSIF length(v_name) > length(v_display_name) THEN
    v_display_name := v_display_name || ' ' || left(split_part(v_name, ' ', 2), 1) || '.';
  END IF;

  -- Inserir perfil em public.users
  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_display_name,
    'aluno',
    0,
    1,
    400,
    350.00,
    0.060000
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inicializar streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inicializar título
  INSERT INTO public.user_titles (user_id, current_title)
  VALUES (NEW.id, 'Aprendiz')
  ON CONFLICT (user_id) DO NOTHING;

  -- Baú de boas-vindas em user_chests
  INSERT INTO public.user_chests (user_id, source_type, source_id)
  VALUES (NEW.id, 'welcome', 'welcome')
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. REESCREVER bot_result — remover XP direto
-- Manter validação de unlock, PGN, rate limiting, first-win tracking
-- Mas NÃO chamar grant_xp (XP só vem de missões/conquistas)
-- ============================================================
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
  v_first_win_id bigint;
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

  -- Validação de PGN
  IF p_pgn IS NULL OR length(trim(p_pgn)) < 10 THEN
    RAISE EXCEPTION 'PGN inválido ou ausente';
  END IF;

  -- Validação de unlock
  IF v_bot.unlock_order > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_bot_first_wins
      WHERE user_id = v_user_id
        AND bot_id IN (
          SELECT id FROM public.bots
          WHERE unlock_order = v_bot.unlock_order - 1
        )
    ) THEN
      RAISE EXCEPTION 'Bot bloqueado. Derrote o anterior primeiro.';
    END IF;
  END IF;

  -- Rate limiting
  IF EXISTS (
    SELECT 1 FROM public.user_bot_results
    WHERE user_id = v_user_id
      AND bot_id = p_bot_id
      AND played_at > now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde antes de registrar outro resultado';
  END IF;

  -- Insere resultado
  INSERT INTO public.user_bot_results (user_id, bot_id, result, pgn, time_spent_seconds)
  VALUES (v_user_id, p_bot_id, p_result, p_pgn, p_time_spent_seconds)
  RETURNING id INTO v_result_id;

  -- First-win atômico (tracking apenas, sem XP)
  IF p_result = 'win' THEN
    INSERT INTO public.user_bot_first_wins (user_id, bot_id)
    VALUES (v_user_id, p_bot_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_first_win_id;

    v_is_first_win := v_first_win_id IS NOT NULL;
  END IF;

  -- NÃO concede XP aqui — XP vem de missões e conquistas

  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'bot_id', p_bot_id,
    'bot_name', v_bot.name,
    'result', p_result,
    'first_win', v_is_first_win
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. ADICIONAR COLUNAS FLEXÍVEIS em achievements
-- ============================================================
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS reward_chest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- Setar reward_chest = true para as 4 conquistas maiores
UPDATE public.achievements SET reward_chest = true WHERE key IN (
  'defeat_all_10_bots', 'complete_30_lessons', 'reach_level_50', 'streak_30_days'
);

-- Setar categorias
UPDATE public.achievements SET category = 'bots' WHERE key IN ('defeat_first_bot', 'defeat_5_bots', 'defeat_all_10_bots');
UPDATE public.achievements SET category = 'puzzles' WHERE key IN ('solve_100_puzzles', 'solve_500_puzzles', 'rating_800', 'rating_1200', 'streak_10_rating', 'rush_15_correct');
UPDATE public.achievements SET category = 'lessons' WHERE key IN ('complete_10_lessons', 'complete_30_lessons');
UPDATE public.achievements SET category = 'progression' WHERE key IN ('reach_level_10', 'reach_level_25', 'reach_level_50');
UPDATE public.achievements SET category = 'streak' WHERE key IN ('streak_7_days', 'streak_14_days', 'streak_30_days');

-- Setar sort_order por categoria
UPDATE public.achievements SET sort_order = condition_value;
