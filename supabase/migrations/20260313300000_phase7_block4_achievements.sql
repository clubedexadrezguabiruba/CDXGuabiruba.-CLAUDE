-- ============================================================
-- Fase 7 — Bloco 4: Sistema de Conquistas
--
-- 1. Criar RPC check_achievements(): verifica todas as conquistas
--    não desbloqueadas contra dados reais, desbloqueia e concede
--    recompensas (XP, item, baú) de forma idempotente.
-- 2. Criar RPC get_achievements(): retorna todas as conquistas
--    com estado de unlock e progresso do usuário.
-- 3. Integrar check_achievements() no check_daily_missions()
--    (roda após missões e streak, antes do retorno).
-- ============================================================

-- ============================================================
-- 1. check_achievements()
-- Retorna array de conquistas recém-desbloqueadas (pode ser vazio)
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
        IF v_ach.reward_item_id IS NOT NULL THEN
          INSERT INTO public.user_inventory (user_id, item_id, source)
          VALUES (v_user_id, v_ach.reward_item_id, 'achievement')
          ON CONFLICT (user_id, item_id) DO NOTHING;
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
          'category', v_ach.category
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_newly_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. get_achievements(): retorna todas as conquistas com estado
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_achievements()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_user record;
  v_streak record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Pre-fetch para calcular progresso
  SELECT level, puzzle_rating, puzzle_best_streak
  INTO v_user
  FROM public.users WHERE id = v_user_id;

  SELECT longest_streak INTO v_streak
  FROM public.user_streaks WHERE user_id = v_user_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'key', a.key,
      'title', a.title,
      'description', a.description,
      'icon', a.icon,
      'category', a.category,
      'sort_order', a.sort_order,
      'hidden', a.hidden,
      'condition_type', a.condition_type,
      'condition_value', a.condition_value,
      'reward_xp', a.reward_xp,
      'reward_chest', a.reward_chest,
      'unlocked', ua.unlocked_at IS NOT NULL,
      'unlocked_at', ua.unlocked_at,
      'progress', CASE a.condition_type
        WHEN 'bots_defeated' THEN (SELECT COUNT(*)::integer FROM public.user_bot_first_wins WHERE user_id = v_user_id)
        WHEN 'bots_defeated_unique' THEN (SELECT COUNT(*)::integer FROM public.user_bot_first_wins WHERE user_id = v_user_id)
        WHEN 'puzzles_solved' THEN (SELECT COUNT(*)::integer FROM public.user_puzzle_attempts WHERE user_id = v_user_id AND solved = true)
        WHEN 'rating_reached' THEN COALESCE(v_user.puzzle_rating, 0)
        WHEN 'puzzle_streak' THEN COALESCE(v_user.puzzle_best_streak, 0)
        WHEN 'lessons_completed' THEN (SELECT COUNT(*)::integer FROM public.user_lesson_progress WHERE user_id = v_user_id AND completed = true)
        WHEN 'rush_score' THEN (SELECT COALESCE(MAX(score), 0)::integer FROM public.puzzle_rush_runs WHERE user_id = v_user_id AND status = 'completed')
        WHEN 'level_reached' THEN COALESCE(v_user.level, 1)
        WHEN 'day_streak' THEN COALESCE(v_streak.longest_streak, 0)
        ELSE 0
      END
    ) ORDER BY a.sort_order, a.id
  ) INTO v_result
  FROM public.achievements a
  LEFT JOIN public.user_achievements ua
    ON ua.achievement_id = a.id AND ua.user_id = v_user_id
  WHERE NOT a.hidden OR ua.unlocked_at IS NOT NULL;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Integrar check_achievements() no check_daily_missions()
-- Reescrever para chamar check_achievements() e incluir no retorno
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
  v_mission record;
  v_progress integer;
  v_newly_completed_count integer := 0;

  -- Streak vars
  v_streak record;
  v_new_streak integer;
  v_streak_milestones integer[] := ARRAY[7, 14, 30, 60, 100];
  v_milestone_xp integer[] := ARRAY[50, 100, 200, 400, 1000];
  v_milestone_chest boolean[] := ARRAY[false, true, true, true, true];
  v_m integer;

  -- Achievements
  v_new_achievements jsonb := '[]'::jsonb;

  -- Pool de 20 missões
  v_pool text[][] := ARRAY[
    ARRAY['solve_3_rating',   'Resolva 3 puzzles no Rating',       '3',  '40', 'puzzle_rating'],
    ARRAY['solve_5_rating',   'Resolva 5 puzzles no Rating',       '5',  '50', 'puzzle_rating'],
    ARRAY['solve_10_rating',  'Resolva 10 puzzles no Rating',      '10', '80', 'puzzle_rating'],
    ARRAY['complete_1_lesson','Complete 1 aula',                    '1',  '60', 'lesson'],
    ARRAY['complete_2_lessons','Complete 2 aulas',                  '2',  '80', 'lesson'],
    ARRAY['defeat_1_bot',     'Derrote 1 bot do seu nível ou acima','1', '70', 'bot'],
    ARRAY['defeat_2_bots',    'Derrote 2 bots do seu nível ou acima','2','100','bot'],
    ARRAY['streak_3_puzzles', 'Acerte 3 puzzles seguidos hoje',    '3',  '50', 'puzzle_streak'],
    ARRAY['streak_5_puzzles', 'Acerte 5 puzzles seguidos hoje',    '5',  '70', 'puzzle_streak'],
    ARRAY['do_1_rush',        'Faça 1 Puzzle Rush',                '1',  '50', 'rush_play'],
    ARRAY['do_2_rush',        'Faça 2 Puzzle Rush',                '2',  '70', 'rush_play'],
    ARRAY['solve_3_category', 'Resolva 3 puzzles de categoria',    '3',  '40', 'puzzle_category'],
    ARRAY['solve_5_category', 'Resolva 5 puzzles de categoria',    '5',  '50', 'puzzle_category'],
    ARRAY['rush_5_correct',   'Alcance 5 acertos num Rush',        '5',  '60', 'rush_score'],
    ARRAY['rush_10_correct',  'Alcance 10 acertos num Rush',       '10', '80', 'rush_score'],
    ARRAY['solve_1_mate2',    'Resolva 1 puzzle de mate em 2',     '1',  '50', 'puzzle_theme'],
    ARRAY['solve_1_fork',     'Resolva 1 puzzle de garfo (fork)',  '1',  '50', 'puzzle_theme'],
    ARRAY['solve_1_pin',      'Resolva 1 puzzle de cravada (pin)', '1',  '50', 'puzzle_theme'],
    ARRAY['solve_3_revanche', 'Resolva 3 puzzles na revanche',     '3',  '60', 'revanche'],
    ARRAY['solve_1_endgame',  'Resolva 1 puzzle de finais',        '1',  '50', 'puzzle_theme']
  ];

  v_selected integer[];
  v_selected_families text[];
  v_idx integer;
  v_family text;
  v_max_bot_unlock integer;
  v_metadata jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT count(*) INTO v_mission_count
  FROM public.daily_missions
  WHERE user_id = v_user_id AND mission_date = v_today;

  -- SORTEIO
  IF v_mission_count = 0 THEN
    SELECT COALESCE(MAX(b.unlock_order), 0) INTO v_max_bot_unlock
    FROM public.user_bot_first_wins fw
    JOIN public.bots b ON b.id = fw.bot_id
    WHERE fw.user_id = v_user_id;

    v_metadata := jsonb_build_object('required_min_unlock_order', v_max_bot_unlock);

    v_selected := ARRAY[]::integer[];
    v_selected_families := ARRAY[]::text[];

    WHILE array_length(v_selected, 1) IS NULL OR array_length(v_selected, 1) < 5 LOOP
      v_idx := floor(random() * array_length(v_pool, 1))::integer + 1;
      IF v_idx = ANY(v_selected) THEN CONTINUE; END IF;
      v_family := v_pool[v_idx][5];
      IF v_family = ANY(v_selected_families) THEN CONTINUE; END IF;
      v_selected := v_selected || v_idx;
      v_selected_families := v_selected_families || v_family;
    END LOOP;

    FOR v_idx IN 1..5 LOOP
      INSERT INTO public.daily_missions (
        user_id, mission_date, mission_key, mission_title,
        mission_target, reward_xp, mission_metadata
      ) VALUES (
        v_user_id, v_today,
        v_pool[v_selected[v_idx]][1],
        v_pool[v_selected[v_idx]][2],
        v_pool[v_selected[v_idx]][3]::integer,
        v_pool[v_selected[v_idx]][4]::integer,
        CASE WHEN v_pool[v_selected[v_idx]][5] = 'bot' THEN v_metadata ELSE '{}'::jsonb END
      ) ON CONFLICT (user_id, mission_date, mission_key) DO NOTHING;
    END LOOP;
  END IF;

  -- RECÁLCULO
  FOR v_mission IN
    SELECT id, mission_key, mission_target, completed, reward_xp, mission_metadata
    FROM public.daily_missions
    WHERE user_id = v_user_id AND mission_date = v_today
    ORDER BY id
  LOOP
    IF v_mission.completed THEN CONTINUE; END IF;

    v_progress := 0;

    CASE v_mission.mission_key
      WHEN 'solve_3_rating', 'solve_5_rating', 'solve_10_rating' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id AND mode = 'rating' AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      WHEN 'complete_1_lesson', 'complete_2_lessons' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_lesson_progress
        WHERE user_id = v_user_id AND completed = true
          AND (completed_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      WHEN 'defeat_1_bot', 'defeat_2_bots' THEN
        DECLARE v_req_unlock integer;
        BEGIN
          v_req_unlock := COALESCE((v_mission.mission_metadata ->> 'required_min_unlock_order')::integer, 0);
          SELECT COUNT(DISTINCT ubr.bot_id)::integer INTO v_progress
          FROM public.user_bot_results ubr
          JOIN public.bots b ON b.id = ubr.bot_id
          WHERE ubr.user_id = v_user_id AND ubr.result = 'win'
            AND (ubr.played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
            AND (v_req_unlock = 0 OR b.unlock_order >= v_req_unlock);
        END;

      WHEN 'streak_3_puzzles', 'streak_5_puzzles' THEN
        DECLARE
          v_cur_streak integer := 0;
          v_max_streak integer := 0;
          v_attempt_rec record;
        BEGIN
          FOR v_attempt_rec IN
            SELECT solved FROM public.user_puzzle_attempts
            WHERE user_id = v_user_id AND mode = 'rating'
              AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
            ORDER BY attempted_at ASC
          LOOP
            IF v_attempt_rec.solved THEN
              v_cur_streak := v_cur_streak + 1;
              IF v_cur_streak > v_max_streak THEN v_max_streak := v_cur_streak; END IF;
            ELSE v_cur_streak := 0;
            END IF;
          END LOOP;
          v_progress := v_max_streak;
        END;

      WHEN 'do_1_rush', 'do_2_rush' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id AND status = 'completed'
          AND (played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      WHEN 'solve_3_category', 'solve_5_category' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id AND mode = 'category' AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      WHEN 'rush_5_correct', 'rush_10_correct' THEN
        SELECT COALESCE(MAX(score), 0)::integer INTO v_progress
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id AND status = 'completed'
          AND (played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      WHEN 'solve_1_mate2' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'mateIn2' = ANY(p.themes);

      WHEN 'solve_1_fork' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'fork' = ANY(p.themes);

      WHEN 'solve_1_pin' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'pin' = ANY(p.themes);

      WHEN 'solve_1_endgame' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'endgame' = ANY(p.themes);

      WHEN 'solve_3_revanche' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id AND mode = 'revanche' AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      ELSE v_progress := 0;
    END CASE;

    v_progress := LEAST(v_progress, v_mission.mission_target);

    UPDATE public.daily_missions SET mission_progress = v_progress WHERE id = v_mission.id;

    IF v_progress >= v_mission.mission_target THEN
      UPDATE public.daily_missions SET completed = true, completed_at = now() WHERE id = v_mission.id;
      PERFORM public.grant_xp(
        p_amount := v_mission.reward_xp,
        p_source := 'mission',
        p_source_id := 'mission_' || v_mission.mission_key || '_' || v_today::text
      );
      v_newly_completed_count := v_newly_completed_count + 1;
    END IF;
  END LOOP;

  -- STREAK
  IF v_newly_completed_count > 0 THEN
    SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = v_user_id FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
      VALUES (v_user_id, 0, 0, NULL) ON CONFLICT (user_id) DO NOTHING;
      SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = v_user_id FOR UPDATE;
    END IF;

    IF v_streak.last_active_date IS NULL OR v_streak.last_active_date < v_today THEN
      IF v_streak.last_active_date = v_today - 1 THEN
        v_new_streak := v_streak.current_streak + 1;
      ELSE
        v_new_streak := 1;
      END IF;

      UPDATE public.user_streaks
      SET current_streak = v_new_streak,
          longest_streak = GREATEST(v_streak.longest_streak, v_new_streak),
          last_active_date = v_today,
          updated_at = now()
      WHERE user_id = v_user_id;

      FOR v_m IN 1..array_length(v_streak_milestones, 1) LOOP
        IF v_new_streak >= v_streak_milestones[v_m] THEN
          PERFORM public.grant_xp(
            p_amount := v_milestone_xp[v_m],
            p_source := 'streak_bonus',
            p_source_id := 'streak_milestone_' || v_streak_milestones[v_m]::text
          );
          IF v_milestone_chest[v_m] THEN
            INSERT INTO public.user_chests (user_id, source_type, source_id)
            VALUES (v_user_id, 'streak_bonus', 'streak_' || v_streak_milestones[v_m]::text)
            ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- CONQUISTAS: verificar após missões e streak
  v_new_achievements := public.check_achievements();

  -- RETORNO
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

  SELECT NOT EXISTS (
    SELECT 1 FROM public.daily_missions
    WHERE user_id = v_user_id AND mission_date = v_today AND NOT completed
  ) INTO v_all_completed;

  SELECT EXISTS (
    SELECT 1 FROM public.user_chests
    WHERE user_id = v_user_id AND source_type = 'daily_missions' AND source_id = v_today::text
  ) INTO v_chest_exists;

  IF v_all_completed AND NOT v_chest_exists THEN
    INSERT INTO public.user_chests (user_id, source_type, source_id)
    VALUES (v_user_id, 'daily_missions', v_today::text)
    ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
  END IF;

  SELECT current_streak, longest_streak, last_active_date
  INTO v_streak
  FROM public.user_streaks WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'date', v_today,
    'missions', COALESCE(v_missions, '[]'::jsonb),
    'all_completed', v_all_completed,
    'chest_available', (v_all_completed AND NOT v_chest_exists),
    'streak', jsonb_build_object(
      'current', COALESCE(v_streak.current_streak, 0),
      'longest', COALESCE(v_streak.longest_streak, 0),
      'last_active_date', v_streak.last_active_date
    ),
    'new_achievements', v_new_achievements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
