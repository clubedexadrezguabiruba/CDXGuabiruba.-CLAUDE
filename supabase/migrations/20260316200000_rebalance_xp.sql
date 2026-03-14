-- ============================================================
-- Rebalanceamento de XP: fórmula 1.05→1.08 + missões -35%
-- ============================================================

-- 1. Recriar grant_xp com fator 1.08 (era 1.05)
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

  -- Verifica level ups (fórmula: 100 * 1.08^(n-1))
  LOOP
    v_xp_for_next := round(100 * power(1.08, v_new_level - 1))::integer;
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


-- 2. Recriar check_daily_missions com novos valores de XP no pool (~35% redução)
--    O pool é hardcoded na função, não numa tabela separada.
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
  v_streak_milestones integer[] := ARRAY[
    1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100,
    125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900,
    1000, 1200, 1500, 2000
  ];
  v_milestone_xp integer[] := ARRAY[
    5, 10, 15, 20, 25, 30, 35, 40, 50, 65, 80, 100, 150,
    175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900,
    1000, 1200, 1500, 2000
  ];
  v_m integer;

  -- Achievements
  v_new_achievements jsonb := '[]'::jsonb;

  -- Pool de 20 missões (XP rebalanceado ~35% menor)
  v_pool text[][] := ARRAY[
    ARRAY['solve_3_rating',   'Resolva 3 puzzles no Rating',       '3',  '25', 'puzzle_rating'],
    ARRAY['solve_5_rating',   'Resolva 5 puzzles no Rating',       '5',  '35', 'puzzle_rating'],
    ARRAY['solve_10_rating',  'Resolva 10 puzzles no Rating',      '10', '55', 'puzzle_rating'],
    ARRAY['complete_1_lesson','Complete 1 aula',                    '1',  '40', 'lesson'],
    ARRAY['complete_2_lessons','Complete 2 aulas',                  '2',  '55', 'lesson'],
    ARRAY['defeat_1_bot',     'Derrote 1 bot do seu nível ou acima','1', '45', 'bot'],
    ARRAY['defeat_2_bots',    'Derrote 2 bots do seu nível ou acima','2','70', 'bot'],
    ARRAY['streak_3_puzzles', 'Acerte 3 puzzles seguidos hoje',    '3',  '35', 'puzzle_streak'],
    ARRAY['streak_5_puzzles', 'Acerte 5 puzzles seguidos hoje',    '5',  '50', 'puzzle_streak'],
    ARRAY['do_1_rush',        'Faça 1 Puzzle Rush',                '1',  '35', 'rush_play'],
    ARRAY['do_2_rush',        'Faça 2 Puzzle Rush',                '2',  '50', 'rush_play'],
    ARRAY['solve_3_category', 'Resolva 3 puzzles de categoria',    '3',  '25', 'puzzle_category'],
    ARRAY['solve_5_category', 'Resolva 5 puzzles de categoria',    '5',  '35', 'puzzle_category'],
    ARRAY['rush_5_correct',   'Alcance 5 acertos num Rush',        '5',  '40', 'rush_score'],
    ARRAY['rush_10_correct',  'Alcance 10 acertos num Rush',       '10', '55', 'rush_score'],
    ARRAY['solve_1_mate2',    'Resolva 1 puzzle de mate em 2',     '1',  '35', 'puzzle_theme'],
    ARRAY['solve_1_fork',     'Resolva 1 puzzle de garfo (fork)',  '1',  '35', 'puzzle_theme'],
    ARRAY['solve_1_pin',      'Resolva 1 puzzle de cravada (pin)', '1',  '35', 'puzzle_theme'],
    ARRAY['solve_3_revanche', 'Resolva 3 puzzles na revanche',     '3',  '40', 'revanche'],
    ARRAY['solve_1_endgame',  'Resolva 1 puzzle de finais',        '1',  '35', 'puzzle_theme']
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
          INSERT INTO public.user_chests (user_id, source_type, source_id)
          VALUES (v_user_id, 'streak_bonus', 'streak_' || v_streak_milestones[v_m]::text)
          ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

          IF v_new_streak = v_streak_milestones[v_m] THEN
            PERFORM public.emit_class_feed(
              v_user_id,
              'streak_milestone',
              jsonb_build_object('streak', v_new_streak)
            );
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- CONQUISTAS
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

-- 2b. Atualizar reward_xp das missões já sorteadas para hoje (não completadas)
UPDATE public.daily_missions SET reward_xp = CASE mission_key
  WHEN 'solve_3_rating'     THEN 25
  WHEN 'solve_5_rating'     THEN 35
  WHEN 'solve_10_rating'    THEN 55
  WHEN 'complete_1_lesson'  THEN 40
  WHEN 'complete_2_lessons' THEN 55
  WHEN 'defeat_1_bot'       THEN 45
  WHEN 'defeat_2_bots'      THEN 70
  WHEN 'streak_3_puzzles'   THEN 35
  WHEN 'streak_5_puzzles'   THEN 50
  WHEN 'do_1_rush'          THEN 35
  WHEN 'do_2_rush'          THEN 50
  WHEN 'solve_3_category'   THEN 25
  WHEN 'solve_5_category'   THEN 35
  WHEN 'rush_5_correct'     THEN 40
  WHEN 'rush_10_correct'    THEN 55
  WHEN 'solve_1_mate2'      THEN 35
  WHEN 'solve_1_fork'       THEN 35
  WHEN 'solve_1_pin'        THEN 35
  WHEN 'solve_3_revanche'   THEN 40
  WHEN 'solve_1_endgame'    THEN 35
  ELSE reward_xp
END
WHERE completed = false
  AND mission_date >= (now() AT TIME ZONE 'America/Sao_Paulo')::date;


-- 3. Recalcular nível de todos os usuários com a nova fórmula
DO $$
DECLARE
  v_rec record;
  v_total_xp bigint;
  v_remaining_xp integer;
  v_level integer;
  v_xp_for_next integer;
BEGIN
  FOR v_rec IN SELECT id FROM public.users LOOP
    -- Somar todo o XP já concedido
    SELECT COALESCE(SUM(amount), 0) INTO v_total_xp
    FROM public.xp_grants
    WHERE user_id = v_rec.id;

    -- Recalcular nível com fórmula 1.08
    v_remaining_xp := v_total_xp::integer;
    v_level := 1;

    LOOP
      v_xp_for_next := round(100 * power(1.08, v_level - 1))::integer;
      EXIT WHEN v_remaining_xp < v_xp_for_next OR v_level >= 100;
      v_remaining_xp := v_remaining_xp - v_xp_for_next;
      v_level := v_level + 1;
    END LOOP;

    -- Atualizar usuário
    UPDATE public.users
    SET xp = v_remaining_xp, level = v_level
    WHERE id = v_rec.id;
  END LOOP;
END $$;
