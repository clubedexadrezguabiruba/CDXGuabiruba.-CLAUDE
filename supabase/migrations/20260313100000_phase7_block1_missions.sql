-- ============================================================
-- Fase 7 — Bloco 1: Missões Diárias
--
-- 1. ALTER daily_missions: adicionar mission_metadata jsonb
-- 2. Reescrever check_daily_missions():
--    - Pool de 20 missões agrupadas em famílias (max 1/família/dia)
--    - Anti-farming de bot: snapshot required_min_unlock_order no sorteio
--    - Streak diário: recalcular do zero pelas tentativas do dia
--    - Recálculo de progresso a partir de tabelas de evento
--    - XP por missão individual concluída (via grant_xp idempotente)
--    - Baú apenas ao completar 5/5
-- 3. Adicionar PERFORM check_daily_missions() ao final de:
--    puzzle_attempt, complete_lesson_step, bot_result, end_rush
-- 4. Remover XP direto de complete_lesson_step (faltou no Bloco 0)
-- ============================================================

-- ============================================================
-- 1. ADICIONAR COLUNA mission_metadata em daily_missions
-- Guarda dados snapshotados no momento do sorteio (ex: required_min_unlock_order)
-- ============================================================
ALTER TABLE public.daily_missions
  ADD COLUMN IF NOT EXISTS mission_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 2. REESCREVER check_daily_missions()
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

  -- Pool de 20 missões: [key, title, target, reward_xp, family]
  -- Família impede colisões (max 1 por família por dia)
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

  -- Verifica se já tem missões hoje
  SELECT count(*) INTO v_mission_count
  FROM public.daily_missions
  WHERE user_id = v_user_id AND mission_date = v_today;

  -- ============================================================
  -- SORTEIO: Se não tem missões, sorteia 5 do pool (max 1/família)
  -- ============================================================
  IF v_mission_count = 0 THEN
    -- Snapshot anti-farming: maior unlock_order de bots já derrotados
    SELECT COALESCE(MAX(b.unlock_order), 0) INTO v_max_bot_unlock
    FROM public.user_bot_first_wins fw
    JOIN public.bots b ON b.id = fw.bot_id
    WHERE fw.user_id = v_user_id;

    v_metadata := jsonb_build_object('required_min_unlock_order', v_max_bot_unlock);

    v_selected := ARRAY[]::integer[];
    v_selected_families := ARRAY[]::text[];

    WHILE array_length(v_selected, 1) IS NULL OR array_length(v_selected, 1) < 5 LOOP
      v_idx := floor(random() * array_length(v_pool, 1))::integer + 1;

      -- Pular se já selecionou este índice
      IF v_idx = ANY(v_selected) THEN
        CONTINUE;
      END IF;

      -- Pular se já tem missão desta família
      v_family := v_pool[v_idx][5];
      IF v_family = ANY(v_selected_families) THEN
        CONTINUE;
      END IF;

      v_selected := v_selected || v_idx;
      v_selected_families := v_selected_families || v_family;
    END LOOP;

    -- Insere as 5 missões
    FOR v_idx IN 1..5 LOOP
      INSERT INTO public.daily_missions (
        user_id, mission_date, mission_key, mission_title,
        mission_target, reward_xp, mission_metadata
      ) VALUES (
        v_user_id,
        v_today,
        v_pool[v_selected[v_idx]][1],
        v_pool[v_selected[v_idx]][2],
        v_pool[v_selected[v_idx]][3]::integer,
        v_pool[v_selected[v_idx]][4]::integer,
        -- Guardar metadata de anti-farming apenas para missões de bot
        CASE
          WHEN v_pool[v_selected[v_idx]][5] = 'bot' THEN v_metadata
          ELSE '{}'::jsonb
        END
      ) ON CONFLICT (user_id, mission_date, mission_key) DO NOTHING;
    END LOOP;
  END IF;

  -- ============================================================
  -- RECÁLCULO: Para cada missão do dia, recalcular progresso
  -- ============================================================
  FOR v_mission IN
    SELECT id, mission_key, mission_target, completed, reward_xp, mission_metadata
    FROM public.daily_missions
    WHERE user_id = v_user_id AND mission_date = v_today
    ORDER BY id
  LOOP
    -- Pular missões já completadas (progresso já concedido)
    IF v_mission.completed THEN
      CONTINUE;
    END IF;

    -- Recalcular progresso baseado no mission_key
    v_progress := 0;

    CASE v_mission.mission_key
      -- PUZZLES RATING
      WHEN 'solve_3_rating', 'solve_5_rating', 'solve_10_rating' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id
          AND mode = 'rating'
          AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      -- AULAS
      WHEN 'complete_1_lesson', 'complete_2_lessons' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_lesson_progress
        WHERE user_id = v_user_id
          AND completed = true
          AND (completed_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      -- BOTS (anti-farming: usar threshold snapshotado)
      WHEN 'defeat_1_bot', 'defeat_2_bots' THEN
        DECLARE
          v_req_unlock integer;
        BEGIN
          v_req_unlock := COALESCE(
            (v_mission.mission_metadata ->> 'required_min_unlock_order')::integer,
            0
          );
          -- Para quem nunca derrotou nenhum bot (v_req_unlock=0), qualquer bot conta
          -- Para os demais, exige bot com unlock_order >= threshold
          SELECT COUNT(DISTINCT ubr.bot_id)::integer INTO v_progress
          FROM public.user_bot_results ubr
          JOIN public.bots b ON b.id = ubr.bot_id
          WHERE ubr.user_id = v_user_id
            AND ubr.result = 'win'
            AND (ubr.played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
            AND (v_req_unlock = 0 OR b.unlock_order >= v_req_unlock);
        END;

      -- STREAK DE PUZZLES (recalcular do dia, não do global)
      WHEN 'streak_3_puzzles', 'streak_5_puzzles' THEN
        DECLARE
          v_cur_streak integer := 0;
          v_max_streak integer := 0;
          v_attempt_rec record;
        BEGIN
          FOR v_attempt_rec IN
            SELECT solved
            FROM public.user_puzzle_attempts
            WHERE user_id = v_user_id
              AND mode = 'rating'
              AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
            ORDER BY attempted_at ASC
          LOOP
            IF v_attempt_rec.solved THEN
              v_cur_streak := v_cur_streak + 1;
              IF v_cur_streak > v_max_streak THEN
                v_max_streak := v_cur_streak;
              END IF;
            ELSE
              v_cur_streak := 0;
            END IF;
          END LOOP;
          v_progress := v_max_streak;
        END;

      -- RUSH PLAY
      WHEN 'do_1_rush', 'do_2_rush' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id
          AND status = 'completed'
          AND (played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      -- PUZZLES CATEGORIA
      WHEN 'solve_3_category', 'solve_5_category' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id
          AND mode = 'category'
          AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      -- RUSH SCORE
      WHEN 'rush_5_correct', 'rush_10_correct' THEN
        SELECT COALESCE(MAX(score), 0)::integer INTO v_progress
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id
          AND status = 'completed'
          AND (played_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      -- PUZZLE TEMAS (mate em 2, garfo, cravada, finais)
      WHEN 'solve_1_mate2' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id
          AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'mateIn2' = ANY(p.themes);

      WHEN 'solve_1_fork' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id
          AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'fork' = ANY(p.themes);

      WHEN 'solve_1_pin' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id
          AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'pin' = ANY(p.themes);

      WHEN 'solve_1_endgame' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id
          AND upa.solved = true
          AND (upa.attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
          AND 'endgame' = ANY(p.themes);

      -- REVANCHE
      WHEN 'solve_3_revanche' THEN
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id
          AND mode = 'revanche'
          AND solved = true
          AND (attempted_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

      ELSE
        v_progress := 0;
    END CASE;

    -- Clamp progresso ao target
    v_progress := LEAST(v_progress, v_mission.mission_target);

    -- Atualizar progresso no banco (cache para UI)
    UPDATE public.daily_missions
    SET mission_progress = v_progress
    WHERE id = v_mission.id;

    -- Se completou a missão, conceder XP
    IF v_progress >= v_mission.mission_target THEN
      UPDATE public.daily_missions
      SET completed = true, completed_at = now()
      WHERE id = v_mission.id;

      -- XP idempotente via grant_xp (xp_grants UNIQUE constraint)
      PERFORM public.grant_xp(
        p_amount := v_mission.reward_xp,
        p_source := 'mission',
        p_source_id := 'mission_' || v_mission.mission_key || '_' || v_today::text
      );

      v_newly_completed_count := v_newly_completed_count + 1;
    END IF;
  END LOOP;

  -- ============================================================
  -- RETORNO: Busca missões atualizadas e verifica 5/5
  -- ============================================================
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

  -- Verifica se TODAS 5 estão completas
  SELECT NOT EXISTS (
    SELECT 1 FROM public.daily_missions
    WHERE user_id = v_user_id AND mission_date = v_today AND NOT completed
  ) INTO v_all_completed;

  -- Verifica se baú já existe
  SELECT EXISTS (
    SELECT 1 FROM public.user_chests
    WHERE user_id = v_user_id
      AND source_type = 'daily_missions'
      AND source_id = v_today::text
  ) INTO v_chest_exists;

  -- Se todas completas e baú não existe, cria baú
  IF v_all_completed AND NOT v_chest_exists THEN
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
-- 3. REESCREVER puzzle_attempt — adicionar check_daily_missions()
-- Cópia exata da versão mais recente (20260220120000_revanche_improvements)
-- com PERFORM check_daily_missions() no final
-- ============================================================
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
  -- Revanche extras
  v_revanche_pending integer;
  v_rev_count integer;
  v_rev_resolved boolean;
  v_rev_next timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('rating', 'category', 'rush', 'revanche', 'resistencia') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Validar rush run se modo rush ou resistencia
  IF p_mode IN ('rush', 'resistencia') AND p_rush_run_id IS NOT NULL THEN
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

    IF v_solved THEN
      v_streak := v_streak + 1;
      IF v_streak > v_best_streak THEN
        v_best_streak := v_streak;
      END IF;
    ELSE
      v_streak := 0;
    END IF;

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
    time_spent_ms, mode, rush_run_id
  ) VALUES (
    v_user_id, p_puzzle_id, v_solved, p_moves,
    v_rating_before, v_rating_after, v_rating_delta,
    v_rd_before, v_rd_after,
    p_time_spent_ms, p_mode, p_rush_run_id
  ) RETURNING id INTO v_attempt_id;

  -- Errou em rating/category/rush/resistencia → fila de revanche
  -- Com soft cap: se >= 30 pendentes, novos entram com delay de 1 dia
  -- ON CONFLICT (puzzle já existe): sempre now() (sem delay)
  IF NOT v_solved AND p_mode IN ('rating', 'category', 'rush', 'resistencia') THEN
    SELECT count(*) INTO v_revanche_pending
    FROM public.puzzle_revanche_queue
    WHERE user_id = v_user_id AND resolved = false;

    INSERT INTO public.puzzle_revanche_queue (user_id, puzzle_id, next_review_at)
    VALUES (
      v_user_id, p_puzzle_id,
      CASE WHEN v_revanche_pending >= 30
           THEN now() + interval '1 day'
           ELSE now()
      END
    )
    ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
      next_review_at = now(),
      review_count = CASE
        WHEN puzzle_revanche_queue.resolved = true THEN 0
        ELSE GREATEST(puzzle_revanche_queue.review_count - 1, 0)
      END,
      resolved = false;
  END IF;

  -- Acertou no modo revanche → atualiza queue com intervalos progressivos
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

  -- Errou no modo revanche → reseta ciclo
  IF NOT v_solved AND p_mode = 'revanche' THEN
    UPDATE public.puzzle_revanche_queue
    SET
      last_reviewed_at = now(),
      review_count = 0,
      next_review_at = now()
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  -- Retorno enriquecido: buscar estado revanche após update
  IF p_mode = 'revanche' THEN
    SELECT review_count, resolved, next_review_at
    INTO v_rev_count, v_rev_resolved, v_rev_next
    FROM public.puzzle_revanche_queue
    WHERE user_id = v_user_id AND puzzle_id = p_puzzle_id;
  END IF;

  -- *** NOVO: Atualizar missões diárias ***
  -- Não chamar durante rush (puzzle_attempt no rush é chamado muitas vezes;
  -- end_rush cuida das missões ao finalizar a run)
  IF p_mode NOT IN ('rush', 'resistencia') THEN
    PERFORM public.check_daily_missions();
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
    'correct_moves', v_correct_moves,
    'revanche_resolved', COALESCE(v_rev_resolved, false),
    'revanche_review_count', COALESCE(v_rev_count, 0),
    'revanche_next_review', v_rev_next
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. REESCREVER complete_lesson_step
-- Remover XP direto (UPDATE users SET xp = xp + ...) + adicionar check_daily_missions
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_lesson_step(
  p_lesson_id bigint,
  p_step_index integer,
  p_move text,
  p_used_hint boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson record;
  v_progress record;
  v_content jsonb;
  v_exercise jsonb;
  v_expected jsonb;
  v_correct boolean := false;
  v_stars integer := 0;
  v_lesson_completed boolean := false;
  v_prev_lesson record;
  v_review_gate record;
BEGIN
  -- 1. Auth check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 2. Busca aula
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada: %', p_lesson_id;
  END IF;

  -- Validação de step_index
  IF p_step_index < 1 OR p_step_index > v_lesson.total_steps THEN
    RAISE EXCEPTION 'Step inválido: % (total: %)', p_step_index, v_lesson.total_steps;
  END IF;

  -- 3. Guard unlock: verifica que a aula está desbloqueada
  IF v_lesson.trail_order > 1 THEN
    SELECT ulp.completed INTO v_prev_lesson
    FROM public.lessons l
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.lesson_id = l.id AND ulp.user_id = v_user_id
    WHERE l.trail = v_lesson.trail
      AND l.trail_order = v_lesson.trail_order - 1;

    IF NOT FOUND OR NOT COALESCE(v_prev_lesson.completed, false) THEN
      RETURN jsonb_build_object(
        'correct', false,
        'error', 'lesson_locked',
        'steps_completed', 0,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', false,
        'stars', null,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Guard unlock para Soldado: requer Review Gate da Recruta
  IF v_lesson.trail = 'soldado' THEN
    SELECT * INTO v_review_gate
    FROM public.review_gate_attempts
    WHERE user_id = v_user_id AND trail = 'recruta';

    IF NOT FOUND OR NOT v_review_gate.passed THEN
      RETURN jsonb_build_object(
        'correct', false,
        'error', 'lesson_locked',
        'steps_completed', 0,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', false,
        'stars', null,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Busca progresso existente
  SELECT * INTO v_progress
  FROM public.user_lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  -- Guard: aula já completa
  IF v_progress IS NOT NULL AND v_progress.completed THEN
    IF p_step_index = 1 THEN
      -- RETRY MODE: reset progress but keep stars for MAX comparison
      UPDATE public.user_lesson_progress
      SET steps_completed = 0,
          completed = false,
          completed_at = NULL,
          errors = 0,
          hints_used = 0
          -- stars preserved intentionally for best-score comparison
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

      -- Re-fetch reset progress
      SELECT * INTO v_progress
      FROM public.user_lesson_progress
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;
      -- Fall through to normal move validation below
    ELSE
      -- Not step 1 on completed lesson → return current state
      RETURN jsonb_build_object(
        'correct', true,
        'steps_completed', v_progress.steps_completed,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', true,
        'stars', v_progress.stars,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Guard: step já resolvido → retorna estado atual
  IF v_progress IS NOT NULL AND v_progress.steps_completed >= p_step_index THEN
    RETURN jsonb_build_object(
      'correct', true,
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', v_progress.completed,
      'stars', v_progress.stars,
      'xp_gained', 0
    );
  END IF;

  -- Guard sequencial: não pode pular exercícios
  IF v_progress IS NOT NULL AND p_step_index > v_progress.steps_completed + 1 THEN
    RETURN jsonb_build_object(
      'correct', false,
      'error', 'step_locked',
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  IF v_progress IS NULL AND p_step_index > 1 THEN
    RETURN jsonb_build_object(
      'correct', false,
      'error', 'step_locked',
      'steps_completed', 0,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  -- 4. Extrai o N-ésimo exercício do content_json
  v_content := v_lesson.content_json;

  SELECT elem INTO v_exercise
  FROM (
    SELECT elem, ROW_NUMBER() OVER (ORDER BY ord) AS exercise_index
    FROM (
      SELECT elem, ord
      FROM jsonb_array_elements(v_content -> 'sections') WITH ORDINALITY AS t(elem, ord)
      WHERE elem ->> 'type' = 'exercise'
    ) exercises
  ) numbered
  WHERE exercise_index = p_step_index;

  IF v_exercise IS NULL THEN
    RAISE EXCEPTION 'Exercício % não encontrado na aula %', p_step_index, p_lesson_id;
  END IF;

  -- 5. Compara p_move contra expected_moves[]
  v_expected := v_exercise -> 'expected_moves';
  v_correct := EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_expected) AS m
    WHERE m = p_move
  );

  -- 6. Se errado → incrementa errors, retorna
  IF NOT v_correct THEN
    INSERT INTO public.user_lesson_progress (user_id, lesson_id, steps_completed, errors)
    VALUES (v_user_id, p_lesson_id, 0, 1)
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      errors = user_lesson_progress.errors + 1;

    SELECT * INTO v_progress
    FROM public.user_lesson_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

    RETURN jsonb_build_object(
      'correct', false,
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  -- 7. Certo: upsert progresso + hint tracking
  INSERT INTO public.user_lesson_progress (
    user_id, lesson_id, steps_completed,
    hints_used
  )
  VALUES (
    v_user_id, p_lesson_id, p_step_index,
    CASE WHEN p_used_hint THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    steps_completed = GREATEST(user_lesson_progress.steps_completed, p_step_index),
    hints_used = user_lesson_progress.hints_used + CASE WHEN p_used_hint THEN 1 ELSE 0 END;

  -- Re-busca progresso atualizado
  SELECT * INTO v_progress
  FROM public.user_lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  -- 8. Se completou todos os steps E ainda não estava completed
  IF v_progress.steps_completed >= v_lesson.total_steps AND NOT v_progress.completed THEN
    -- Calcula estrelas da tentativa atual
    IF v_progress.errors = 0 AND v_progress.hints_used = 0 THEN
      v_stars := 3;
    ELSIF v_progress.errors <= 2 THEN
      v_stars := 2;
    ELSE
      v_stars := 1;
    END IF;

    -- Retry detection: stars column still has old value from previous completion
    IF v_progress.stars IS NOT NULL THEN
      -- Retry: keep best stars
      v_stars := GREATEST(v_stars, v_progress.stars);
    END IF;

    -- Marca completed + stars
    UPDATE public.user_lesson_progress
    SET completed = true,
        completed_at = now(),
        stars = v_stars
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

    -- NÃO concede XP direto — XP vem de missões e conquistas
    -- (removido: UPDATE public.users SET xp = xp + v_xp_gained)

    v_lesson_completed := true;

    -- *** NOVO: Atualizar missões diárias ***
    PERFORM public.check_daily_missions();
  ELSE
    v_lesson_completed := v_progress.completed;
    v_stars := v_progress.stars;
  END IF;

  -- 9. Retorna resultado
  RETURN jsonb_build_object(
    'correct', true,
    'steps_completed', v_progress.steps_completed,
    'total_steps', v_lesson.total_steps,
    'lesson_completed', v_lesson_completed,
    'stars', CASE WHEN v_lesson_completed THEN v_stars ELSE null END,
    'xp_gained', 0  -- XP agora vem de missões, não de aulas diretamente
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. REESCREVER bot_result — adicionar check_daily_missions()
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

  -- *** NOVO: Atualizar missões diárias ***
  PERFORM public.check_daily_missions();

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
-- 6. REESCREVER end_rush — adicionar check_daily_missions()
-- ============================================================
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

  -- Validar tempo (com 10s de buffer) — apenas para modos com timer
  v_time_limit := CASE v_run.mode
    WHEN '3min' THEN interval '3 minutes 10 seconds'
    WHEN '5min' THEN interval '5 minutes 10 seconds'
    ELSE NULL  -- resistencia: sem limite de tempo
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

  -- CALCULAR SCORE REAL no servidor (por rush_run_id)
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

  -- *** NOVO: Atualizar missões diárias ***
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
