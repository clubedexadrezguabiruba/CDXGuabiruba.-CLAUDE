-- ============================================================
-- FASE 5 — AULAS INTERATIVAS
-- Schema: colunas novas em user_lesson_progress + tabela review_gate_attempts
-- RPCs: complete_lesson_step, get_lesson_map, submit_review_gate
-- ============================================================

-- ============================================================
-- 5.1 — Colunas novas em user_lesson_progress
-- ============================================================
ALTER TABLE public.user_lesson_progress
  ADD COLUMN IF NOT EXISTS errors integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hints_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3);

-- ============================================================
-- 5.2 — Tabela review_gate_attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.review_gate_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trail text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, trail)
);

CREATE INDEX IF NOT EXISTS idx_review_gate_user ON public.review_gate_attempts(user_id);

-- RLS
ALTER TABLE public.review_gate_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_gate_select_own ON public.review_gate_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY review_gate_insert_own ON public.review_gate_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY review_gate_update_own ON public.review_gate_attempts
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- 5.3 — RPC complete_lesson_step
-- Substitui lesson_step_submit com validação de lance + erros/hints/estrelas/XP
-- SECURITY DEFINER, idempotente, transacional
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_lesson_step(
  p_lesson_id bigint,
  p_step_index integer,  -- 1-based (exercício N)
  p_move text,           -- lance UCI do aluno
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
  v_xp_gained integer := 0;
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
    -- Verifica que aula anterior está completa
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

  -- Guard: aula já completa → retorna estado atual sem side effects
  IF v_progress IS NOT NULL AND v_progress.completed THEN
    RETURN jsonb_build_object(
      'correct', true,
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', true,
      'stars', v_progress.stars,
      'xp_gained', 0
    );
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
    -- Upsert para garantir que o registro existe
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

  -- 8. Se completou todos os steps E ainda não estava completed (transição única)
  IF v_progress.steps_completed >= v_lesson.total_steps AND NOT v_progress.completed THEN
    -- Calcula estrelas
    IF v_progress.errors = 0 AND v_progress.hints_used = 0 THEN
      v_stars := 3;
    ELSIF v_progress.errors <= 2 THEN
      v_stars := 2;
    ELSE
      v_stars := 1;
    END IF;

    -- XP: 20 base + 10 bônus se 3 estrelas
    v_xp_gained := 20;
    IF v_stars = 3 THEN
      v_xp_gained := 30;
    END IF;

    -- Marca completed + stars + concede XP atomicamente
    UPDATE public.user_lesson_progress
    SET completed = true,
        completed_at = now(),
        stars = v_stars
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

    -- Concede XP diretamente na tabela users
    UPDATE public.users
    SET xp = xp + v_xp_gained
    WHERE id = v_user_id;

    v_lesson_completed := true;
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
    'xp_gained', v_xp_gained
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5.4 — RPC get_lesson_map
-- Retorna aulas + progresso do usuário para montar o mapa
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_lesson_map()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lessons jsonb;
  v_gates jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Aulas + progresso
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'trail', l.trail,
      'trail_order', l.trail_order,
      'total_steps', l.total_steps,
      'steps_completed', COALESCE(ulp.steps_completed, 0),
      'completed', COALESCE(ulp.completed, false),
      'stars', COALESCE(ulp.stars, 0)
    ) ORDER BY
      CASE l.trail WHEN 'recruta' THEN 1 WHEN 'soldado' THEN 2 ELSE 3 END,
      l.trail_order
  ) INTO v_lessons
  FROM public.lessons l
  LEFT JOIN public.user_lesson_progress ulp
    ON ulp.lesson_id = l.id AND ulp.user_id = v_user_id
  WHERE l.trail IN ('recruta', 'soldado');

  -- Review gates
  SELECT jsonb_agg(
    jsonb_build_object(
      'trail', rga.trail,
      'passed', rga.passed,
      'best_score', rga.score
    )
  ) INTO v_gates
  FROM public.review_gate_attempts rga
  WHERE rga.user_id = v_user_id;

  RETURN jsonb_build_object(
    'lessons', COALESCE(v_lessons, '[]'::jsonb),
    'review_gates', COALESCE(v_gates, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5.5 — RPC submit_review_gate
-- Valida respostas do review gate (10 exercícios mistos)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_review_gate(
  p_trail text,
  p_answers jsonb  -- array de { lesson_id, step_index, move }
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total_lessons integer;
  v_completed_lessons integer;
  v_answer jsonb;
  v_lesson record;
  v_exercise jsonb;
  v_expected jsonb;
  v_correct_count integer := 0;
  v_total_count integer := 0;
  v_passed boolean;
  v_score integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_trail NOT IN ('recruta', 'soldado') THEN
    RAISE EXCEPTION 'Trilha inválida: %', p_trail;
  END IF;

  -- Verifica que todas as aulas da trilha estão completas
  SELECT count(*) INTO v_total_lessons
  FROM public.lessons WHERE trail = p_trail;

  SELECT count(*) INTO v_completed_lessons
  FROM public.lessons l
  JOIN public.user_lesson_progress ulp
    ON ulp.lesson_id = l.id AND ulp.user_id = v_user_id
  WHERE l.trail = p_trail AND ulp.completed = true;

  IF v_completed_lessons < v_total_lessons THEN
    RAISE EXCEPTION 'Complete todas as aulas da trilha % antes do review gate (%/%)',
      p_trail, v_completed_lessons, v_total_lessons;
  END IF;

  -- Valida cada resposta
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_total_count := v_total_count + 1;

    -- Busca aula e verifica que pertence à trilha
    SELECT * INTO v_lesson
    FROM public.lessons
    WHERE id = (v_answer ->> 'lesson_id')::bigint
      AND trail = p_trail;

    IF NOT FOUND THEN
      CONTINUE; -- Ignora respostas com lesson_id inválido (contará como errado)
    END IF;

    -- Extrai exercício pelo step_index
    SELECT elem INTO v_exercise
    FROM (
      SELECT elem, ROW_NUMBER() OVER (ORDER BY ord) AS exercise_index
      FROM (
        SELECT elem, ord
        FROM jsonb_array_elements(v_lesson.content_json -> 'sections') WITH ORDINALITY AS t(elem, ord)
        WHERE elem ->> 'type' = 'exercise'
      ) exercises
    ) numbered
    WHERE exercise_index = (v_answer ->> 'step_index')::integer;

    IF v_exercise IS NULL THEN
      CONTINUE; -- Exercício inválido, conta como errado
    END IF;

    -- Compara move
    v_expected := v_exercise -> 'expected_moves';
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(v_expected) AS m
      WHERE m = (v_answer ->> 'move')
    ) THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  v_score := v_correct_count;
  v_passed := (v_score >= 7);

  -- Upsert: guarda melhor score
  INSERT INTO public.review_gate_attempts (user_id, trail, score, passed, attempted_at)
  VALUES (v_user_id, p_trail, v_score, v_passed, now())
  ON CONFLICT (user_id, trail) DO UPDATE SET
    score = GREATEST(review_gate_attempts.score, EXCLUDED.score),
    passed = review_gate_attempts.passed OR EXCLUDED.passed,
    attempted_at = now();

  RETURN jsonb_build_object(
    'score', v_score,
    'passed', v_passed,
    'required_score', 7
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
