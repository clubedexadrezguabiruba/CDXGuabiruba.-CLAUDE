-- ============================================================
-- FASE 7 — BLOCO 6: Títulos por trilha concluída
-- ============================================================
-- Adiciona lógica de atualização de título em complete_lesson_step.
-- Quando o aluno completa TODAS as aulas de uma trilha, o título
-- é atualizado se a nova trilha for mais alta que a anterior.
--
-- Mapeamento (Visão do Produto):
--   nenhuma    → Aprendiz
--   recruta    → Soldado
--   soldado    → Aspirante
--   aspirante  → Capitão
--   capitao    → Comandante
--   comandante → General
--   general    → Grão-Mestre
--   mestre     → Lenda
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
  -- Bloco 6: variáveis de título
  v_trail_total integer;
  v_trail_done integer;
  v_trail_order_arr text[] := ARRAY['recruta','soldado','aspirante','capitao','comandante','general','mestre'];
  v_title_map text[] := ARRAY['Soldado','Aspirante','Capitão','Comandante','General','Grão-Mestre','Lenda'];
  v_current_highest text;
  v_new_pos integer;
  v_old_pos integer;
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
    v_lesson_completed := true;

    -- *** Atualizar missões diárias ***
    PERFORM public.check_daily_missions();

    -- *** BLOCO 6: Verificar se trilha foi concluída → atualizar título ***
    SELECT COUNT(*) INTO v_trail_total
    FROM public.lessons WHERE trail = v_lesson.trail;

    SELECT COUNT(*) INTO v_trail_done
    FROM public.user_lesson_progress ulp
    JOIN public.lessons l ON l.id = ulp.lesson_id
    WHERE ulp.user_id = v_user_id
      AND l.trail = v_lesson.trail
      AND ulp.completed = true;

    IF v_trail_done >= v_trail_total THEN
      -- Trilha concluída! Verificar se é mais alta que a atual
      v_new_pos := array_position(v_trail_order_arr, v_lesson.trail);

      SELECT highest_trail_completed INTO v_current_highest
      FROM public.user_titles
      WHERE user_id = v_user_id;

      IF v_current_highest IS NULL THEN
        v_old_pos := 0;
      ELSE
        v_old_pos := COALESCE(array_position(v_trail_order_arr, v_current_highest), 0);
      END IF;

      IF v_new_pos IS NOT NULL AND v_new_pos > v_old_pos THEN
        UPDATE public.user_titles
        SET current_title = v_title_map[v_new_pos],
            highest_trail_completed = v_lesson.trail,
            updated_at = now()
        WHERE user_id = v_user_id;

        -- Refresh materialized view para ranking
        PERFORM public.refresh_public_profiles();
      END IF;
    END IF;
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
    'xp_gained', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
