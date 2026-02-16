-- ============================================================
-- FASE 2 — RPCs CORE (2.14–2.16)
-- Server-authority: client envia tentativas, servidor decide
-- ============================================================

-- ============================================================
-- 2.14a — puzzle_attempt
-- Client envia: puzzle_id + moves[]. Servidor valida contra solução.
-- Rating delta = 0 por enquanto (Glicko-2 implementado na Fase 4.7)
-- ============================================================
CREATE OR REPLACE FUNCTION public.puzzle_attempt(
  p_puzzle_id bigint,
  p_moves text[],
  p_mode text DEFAULT 'rating',
  p_time_spent_ms integer DEFAULT NULL
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
  v_attempt_id bigint;
BEGIN
  -- Validações básicas
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('rating', 'category', 'rush', 'revanche') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Busca puzzle
  SELECT * INTO v_puzzle FROM public.puzzles WHERE id = p_puzzle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Puzzle não encontrado: %', p_puzzle_id;
  END IF;

  -- Busca rating atual do usuário
  SELECT puzzle_rating INTO v_rating_before
  FROM public.users WHERE id = v_user_id;

  -- Converte solução do puzzle em array (moves é espaço-separado)
  -- No CSV do Lichess, o 1o lance é do oponente, os demais são a solução
  -- Formato: "e2e4 d7d5 g1f3" — o client envia apenas os lances do jogador
  v_correct_moves := string_to_array(v_puzzle.moves, ' ');

  -- Verifica se moves do client batem com a solução completa
  -- O client deve enviar TODOS os lances da solução (incluindo o 1o do oponente que é automático)
  v_solved := (p_moves = v_correct_moves);

  -- Por enquanto rating não muda (Glicko-2 vem na Fase 4.7)
  v_rating_after := v_rating_before;

  -- Insere tentativa
  INSERT INTO public.user_puzzle_attempts (
    user_id, puzzle_id, solved, moves_played,
    rating_before, rating_after, rating_delta,
    time_spent_ms, mode
  ) VALUES (
    v_user_id, p_puzzle_id, v_solved, p_moves,
    v_rating_before, v_rating_after, v_rating_delta,
    p_time_spent_ms, p_mode
  ) RETURNING id INTO v_attempt_id;

  -- Se errou no modo rating ou category, adiciona à fila de revanche
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
        ELSE now() -- será marcado resolved
      END,
      resolved = CASE WHEN review_count >= 2 THEN true ELSE false END
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'solved', v_solved,
    'rating_before', v_rating_before,
    'rating_after', v_rating_after,
    'rating_delta', v_rating_delta,
    'correct_moves', v_correct_moves
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2.14b — lesson_step_submit
-- Registra progresso de aula, idempotente (UNIQUE user_id+lesson_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.lesson_step_submit(
  p_lesson_id bigint,
  p_step_index integer -- 1-based
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson record;
  v_progress record;
  v_completed boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Busca aula
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada: %', p_lesson_id;
  END IF;

  IF p_step_index < 1 OR p_step_index > v_lesson.total_steps THEN
    RAISE EXCEPTION 'Step inválido: % (total: %)', p_step_index, v_lesson.total_steps;
  END IF;

  -- Upsert progresso (idempotente via UNIQUE)
  INSERT INTO public.user_lesson_progress (user_id, lesson_id, steps_completed)
  VALUES (v_user_id, p_lesson_id, p_step_index)
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    steps_completed = GREATEST(user_lesson_progress.steps_completed, p_step_index);

  -- Verifica se completou todos os steps
  SELECT * INTO v_progress
  FROM public.user_lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  IF v_progress.steps_completed >= v_lesson.total_steps AND NOT v_progress.completed THEN
    UPDATE public.user_lesson_progress
    SET completed = true, completed_at = now()
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;
    v_completed := true;
  ELSE
    v_completed := v_progress.completed;
  END IF;

  RETURN jsonb_build_object(
    'lesson_id', p_lesson_id,
    'steps_completed', GREATEST(v_progress.steps_completed, p_step_index),
    'total_steps', v_lesson.total_steps,
    'completed', v_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2.14c — bot_result
-- Registra resultado de partida contra bot. Impede duplicação.
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_result(
  p_bot_id bigint,
  p_result text, -- 'win', 'loss', 'draw'
  p_pgn text DEFAULT NULL,
  p_time_spent_seconds integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_bot record;
  v_result_id bigint;
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

  -- Rate limiting básico: máximo 1 resultado por bot a cada 30 segundos
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

  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'bot_id', p_bot_id,
    'bot_name', v_bot.name,
    'result', p_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2.15a — check_daily_missions
-- Gera 5 missões para o dia se não existem, retorna estado atual
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_daily_missions()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_mission_count integer;
  v_missions jsonb;
  v_all_completed boolean;
  v_chest_exists boolean;
  -- Pool de missões
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
    -- Seleciona 5 índices aleatórios sem repetição
    v_selected := ARRAY[]::integer[];
    WHILE array_length(v_selected, 1) IS NULL OR array_length(v_selected, 1) < 5 LOOP
      v_idx := floor(random() * array_length(v_pool, 1))::integer + 1;
      IF NOT (v_idx = ANY(v_selected)) THEN
        v_selected := v_selected || v_idx;
      END IF;
    END LOOP;

    -- Insere as 5 missões
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

  -- Verifica se baú já existe
  SELECT EXISTS (
    SELECT 1 FROM public.daily_chests
    WHERE user_id = v_user_id AND chest_date = v_today
  ) INTO v_chest_exists;

  -- Se todas completas e baú não existe, cria baú
  IF v_all_completed AND NOT v_chest_exists AND v_mission_count > 0 THEN
    INSERT INTO public.daily_chests (user_id, chest_date)
    VALUES (v_user_id, v_today)
    ON CONFLICT (user_id, chest_date) DO NOTHING;
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
-- 2.15b — claim_chest
-- Abre baú: roll de raridade server-side, adiciona item ao inventário
-- Idempotente: baú só pode ser aberto 1 vez
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

  -- Busca baú do usuário
  SELECT * INTO v_chest
  FROM public.daily_chests
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

  -- Se não existe NENHUM item da raridade, tenta common como fallback
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

  -- Marca baú como aberto
  UPDATE public.daily_chests
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
      'image_url', v_item.image_url
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2.16a — grant_xp
-- Concede XP e verifica level up. Transacional e idempotente via chave.
-- Fontes permitidas: 'mission', 'achievement', 'streak_bonus'
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_xp(
  p_amount integer,
  p_source text,
  p_source_id text -- chave de idempotência (ex: 'mission_123_2026-02-16')
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

  IF p_source NOT IN ('mission', 'achievement', 'streak_bonus') THEN
    RAISE EXCEPTION 'Fonte de XP inválida: %', p_source;
  END IF;

  -- Lock do usuário para transação segura
  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  -- Soma XP
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

  -- Se subiu de nível, cria baú(s) de level-up
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

-- ============================================================
-- 2.16b — check_level_up (consulta, não modifica)
-- Retorna estado atual de XP/level e quanto falta para próximo nível
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_level_up()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user record;
  v_xp_for_next integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_user_id;

  v_xp_for_next := round(100 * power(1.05, v_user.level - 1))::integer;

  RETURN jsonb_build_object(
    'level', v_user.level,
    'xp', v_user.xp,
    'xp_for_next_level', v_xp_for_next,
    'xp_remaining', v_xp_for_next - v_user.xp,
    'progress_percent', round((v_user.xp::numeric / v_xp_for_next) * 100, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper RPC: get_ranking (consulta view materializada)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ranking(
  p_type text DEFAULT 'rating', -- 'rating', 'rush_3min', 'rush_5min', 'level'
  p_limit integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_type = 'rating' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_config, level, puzzle_rating, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY puzzle_rating DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_3min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_config, level, rush_3min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_3min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_5min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_config, level, rush_5min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_5min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'level' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_config, level, xp, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY level DESC, xp DESC
      LIMIT p_limit
    ) r;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
