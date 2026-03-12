-- ============================================================
-- FASE 9 — Bloco 0: RPCs do Painel do Professor
-- ============================================================
-- 1. Correção RLS: class_tasks_select_member com filtro active=true
-- 2. emit_class_feed() helper SECURITY DEFINER
-- 3. create_class(), join_class(), remove_class_member()
-- 4. create_task() com auto-complete para lesson
-- 5. check_my_tasks() batch + check_task_progress() individual
-- 6. Recriação de 7 RPCs com integração de feed:
--    grant_xp, bot_result, puzzle_attempt, end_rush,
--    check_achievements, check_daily_missions, complete_lesson_step
-- ============================================================


-- ============================================================
-- SEÇÃO 1: Correção RLS — aluno só vê tarefas ATIVAS
-- ============================================================
DROP POLICY IF EXISTS class_tasks_select_member ON public.class_tasks;

CREATE POLICY class_tasks_select_member ON public.class_tasks
  FOR SELECT USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = class_tasks.class_id AND cm.user_id = auth.uid()
    )
  );


-- ============================================================
-- SEÇÃO 2: emit_class_feed() — helper para inserir eventos no mural
-- ============================================================
-- Insere 1 row por turma que o aluno pertence.
-- Se não é membro de nenhuma turma, não insere nada (zero overhead).
-- Chamado de dentro de RPCs SECURITY DEFINER, por isso recebe p_user_id.
-- ============================================================
CREATE OR REPLACE FUNCTION public.emit_class_feed(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.class_feed (class_id, user_id, event_type, event_data)
  SELECT cm.class_id, p_user_id, p_event_type, p_event_data
  FROM public.class_members cm
  WHERE cm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SEÇÃO 3: RPCs de gestão de turmas
-- ============================================================

-- 3.1 create_class: professor cria turma, retorna classe com invite_code
CREATE OR REPLACE FUNCTION public.create_class(p_name text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_class record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_user_id;
  IF v_role != 'professor' THEN
    RAISE EXCEPTION 'Apenas professores podem criar turmas';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Nome da turma deve ter pelo menos 2 caracteres';
  END IF;

  INSERT INTO public.classes (teacher_id, name)
  VALUES (v_user_id, trim(p_name))
  RETURNING * INTO v_class;

  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'invite_code', v_class.invite_code,
    'active', v_class.active,
    'created_at', v_class.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 join_class: aluno entra na turma por código de convite
CREATE OR REPLACE FUNCTION public.join_class(p_invite_code text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_class record;
  v_already_member boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION 'Código de convite inválido';
  END IF;

  -- Busca classe pelo invite_code
  SELECT * INTO v_class
  FROM public.classes
  WHERE invite_code = lower(trim(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada com este código';
  END IF;

  IF NOT v_class.active THEN
    RAISE EXCEPTION 'Esta turma não está mais ativa';
  END IF;

  -- Impedir professor de entrar como aluno na própria turma
  IF v_class.teacher_id = v_user_id THEN
    RAISE EXCEPTION 'Você é o professor desta turma';
  END IF;

  -- Verificar se já é membro
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = v_class.id AND user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN jsonb_build_object(
      'already_member', true,
      'class_id', v_class.id,
      'class_name', v_class.name
    );
  END IF;

  -- Inserir como membro
  INSERT INTO public.class_members (class_id, user_id)
  VALUES (v_class.id, v_user_id);

  -- Criar user_task_progress para tarefas ativas da turma
  INSERT INTO public.user_task_progress (user_id, task_id, progress, completed, completed_at)
  SELECT
    v_user_id,
    ct.id,
    CASE
      WHEN ct.task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = v_user_id
          AND ulp.lesson_id = (ct.config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN 1
      ELSE 0
    END,
    CASE
      WHEN ct.task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = v_user_id
          AND ulp.lesson_id = (ct.config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN true
      ELSE false
    END,
    CASE
      WHEN ct.task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = v_user_id
          AND ulp.lesson_id = (ct.config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN now()
      ELSE NULL
    END
  FROM public.class_tasks ct
  WHERE ct.class_id = v_class.id AND ct.active = true
  ON CONFLICT (user_id, task_id) DO NOTHING;

  RETURN jsonb_build_object(
    'already_member', false,
    'class_id', v_class.id,
    'class_name', v_class.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 remove_class_member: professor remove aluno da turma
CREATE OR REPLACE FUNCTION public.remove_class_member(
  p_class_id bigint,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_teacher_id uuid := auth.uid();
  v_class record;
  v_deleted boolean;
BEGIN
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verificar que o caller é o professor da turma
  SELECT * INTO v_class FROM public.classes
  WHERE id = p_class_id AND teacher_id = v_teacher_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada ou você não é o professor';
  END IF;

  -- Remover membro
  DELETE FROM public.class_members
  WHERE class_id = p_class_id AND user_id = p_user_id;

  v_deleted := FOUND;

  RETURN jsonb_build_object(
    'removed', v_deleted,
    'class_id', p_class_id,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SEÇÃO 4: RPCs de tarefas
-- ============================================================

-- 4.1 create_task: professor cria tarefa para a turma
-- Semântica: lesson=permanente (conta histórico); demais=repetível (conta >= task.created_at)
CREATE OR REPLACE FUNCTION public.create_task(
  p_class_id bigint,
  p_task_type text,
  p_config_json jsonb,
  p_title text,
  p_description text DEFAULT '',
  p_deadline timestamptz DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_teacher_id uuid := auth.uid();
  v_class record;
  v_task record;
BEGIN
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verificar turma e professor
  SELECT * INTO v_class FROM public.classes
  WHERE id = p_class_id AND teacher_id = v_teacher_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada ou você não é o professor';
  END IF;

  IF NOT v_class.active THEN
    RAISE EXCEPTION 'Turma inativa';
  END IF;

  -- Validar tipo
  IF p_task_type NOT IN ('lesson', 'puzzles_theme', 'puzzles_count', 'bot', 'rush') THEN
    RAISE EXCEPTION 'Tipo de tarefa inválido: %', p_task_type;
  END IF;

  -- Validar config_json por tipo
  CASE p_task_type
    WHEN 'lesson' THEN
      IF (p_config_json ->> 'lesson_id') IS NULL THEN
        RAISE EXCEPTION 'lesson requer config_json.lesson_id';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = (p_config_json ->> 'lesson_id')::bigint) THEN
        RAISE EXCEPTION 'Aula não encontrada: %', p_config_json ->> 'lesson_id';
      END IF;

    WHEN 'puzzles_count' THEN
      IF (p_config_json ->> 'count') IS NULL OR (p_config_json ->> 'count')::integer < 1 THEN
        RAISE EXCEPTION 'puzzles_count requer config_json.count >= 1';
      END IF;

    WHEN 'puzzles_theme' THEN
      IF (p_config_json ->> 'theme') IS NULL OR length(p_config_json ->> 'theme') = 0 THEN
        RAISE EXCEPTION 'puzzles_theme requer config_json.theme';
      END IF;
      IF (p_config_json ->> 'count') IS NULL OR (p_config_json ->> 'count')::integer < 1 THEN
        RAISE EXCEPTION 'puzzles_theme requer config_json.count >= 1';
      END IF;

    WHEN 'bot' THEN
      IF (p_config_json ->> 'bot_id') IS NULL THEN
        RAISE EXCEPTION 'bot requer config_json.bot_id';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.bots WHERE id = (p_config_json ->> 'bot_id')::bigint) THEN
        RAISE EXCEPTION 'Bot não encontrado: %', p_config_json ->> 'bot_id';
      END IF;

    WHEN 'rush' THEN
      IF (p_config_json ->> 'count') IS NULL OR (p_config_json ->> 'count')::integer < 1 THEN
        RAISE EXCEPTION 'rush requer config_json.count >= 1';
      END IF;
      -- mode é opcional (null = qualquer modo)
  END CASE;

  IF p_title IS NULL OR length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'Título da tarefa deve ter pelo menos 2 caracteres';
  END IF;

  -- Inserir tarefa
  INSERT INTO public.class_tasks (class_id, teacher_id, task_type, config_json, title, description, deadline)
  VALUES (p_class_id, v_teacher_id, p_task_type, p_config_json, trim(p_title), COALESCE(trim(p_description), ''), p_deadline)
  RETURNING * INTO v_task;

  -- Criar user_task_progress para todos os membros atuais
  -- Para lesson: auto-complete se aluno já completou a aula
  INSERT INTO public.user_task_progress (user_id, task_id, progress, completed, completed_at)
  SELECT
    cm.user_id,
    v_task.id,
    CASE
      WHEN p_task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = cm.user_id
          AND ulp.lesson_id = (p_config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN 1
      ELSE 0
    END,
    CASE
      WHEN p_task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = cm.user_id
          AND ulp.lesson_id = (p_config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN true
      ELSE false
    END,
    CASE
      WHEN p_task_type = 'lesson' AND EXISTS (
        SELECT 1 FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = cm.user_id
          AND ulp.lesson_id = (p_config_json ->> 'lesson_id')::bigint
          AND ulp.completed = true
      ) THEN now()
      ELSE NULL
    END
  FROM public.class_members cm
  WHERE cm.class_id = p_class_id
  ON CONFLICT (user_id, task_id) DO NOTHING;

  RETURN jsonb_build_object(
    'task_id', v_task.id,
    'class_id', v_task.class_id,
    'task_type', v_task.task_type,
    'title', v_task.title,
    'description', v_task.description,
    'deadline', v_task.deadline,
    'created_at', v_task.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 check_my_tasks: recalcula progresso de TODAS as tarefas ativas do aluno
-- Chamado pelo aluno ao abrir dashboard ou após ação relevante.
-- Progresso é recalculado do zero a cada chamada (não incremental).
CREATE OR REPLACE FUNCTION public.check_my_tasks()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_task record;
  v_progress integer;
  v_target integer;
  v_completed boolean;
  v_was_completed boolean;
  v_just_completed boolean;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Loop por todas as tarefas ativas das turmas do aluno
  FOR v_task IN
    SELECT ct.*, utp.completed AS prev_completed, utp.id AS progress_id
    FROM public.class_tasks ct
    JOIN public.class_members cm ON cm.class_id = ct.class_id AND cm.user_id = v_user_id
    LEFT JOIN public.user_task_progress utp ON utp.task_id = ct.id AND utp.user_id = v_user_id
    WHERE ct.active = true
    ORDER BY ct.created_at DESC
  LOOP
    v_was_completed := COALESCE(v_task.prev_completed, false);
    v_just_completed := false;

    -- Se já completada, não recalcular
    IF v_was_completed THEN
      v_results := v_results || jsonb_build_object(
        'task_id', v_task.id,
        'class_id', v_task.class_id,
        'task_type', v_task.task_type,
        'title', v_task.title,
        'description', v_task.description,
        'deadline', v_task.deadline,
        'progress', (SELECT progress FROM public.user_task_progress WHERE task_id = v_task.id AND user_id = v_user_id),
        'target', CASE v_task.task_type
          WHEN 'lesson' THEN 1
          WHEN 'bot' THEN 1
          WHEN 'puzzles_count' THEN (v_task.config_json ->> 'count')::integer
          WHEN 'puzzles_theme' THEN (v_task.config_json ->> 'count')::integer
          WHEN 'rush' THEN (v_task.config_json ->> 'count')::integer
        END,
        'completed', true,
        'just_completed', false
      );
      CONTINUE;
    END IF;

    -- Calcular progresso e target por tipo
    v_progress := 0;
    v_target := 1;

    CASE v_task.task_type
      -- lesson: permanente — conta histórico completo
      WHEN 'lesson' THEN
        v_target := 1;
        SELECT CASE WHEN ulp.completed THEN 1 ELSE 0 END INTO v_progress
        FROM public.user_lesson_progress ulp
        WHERE ulp.user_id = v_user_id
          AND ulp.lesson_id = (v_task.config_json ->> 'lesson_id')::bigint;
        v_progress := COALESCE(v_progress, 0);

      -- puzzles_count: repetível — conta >= task.created_at
      WHEN 'puzzles_count' THEN
        v_target := (v_task.config_json ->> 'count')::integer;
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        WHERE upa.user_id = v_user_id
          AND upa.mode = 'rating'
          AND upa.solved = true
          AND upa.attempted_at >= v_task.created_at;

      -- puzzles_theme: repetível — conta >= task.created_at
      WHEN 'puzzles_theme' THEN
        v_target := (v_task.config_json ->> 'count')::integer;
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.user_puzzle_attempts upa
        JOIN public.puzzles p ON p.id = upa.puzzle_id
        WHERE upa.user_id = v_user_id
          AND upa.solved = true
          AND upa.attempted_at >= v_task.created_at
          AND (v_task.config_json ->> 'theme') = ANY(p.themes);

      -- bot: repetível — vitória >= task.created_at
      WHEN 'bot' THEN
        v_target := 1;
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM public.user_bot_results ubr
          WHERE ubr.user_id = v_user_id
            AND ubr.bot_id = (v_task.config_json ->> 'bot_id')::bigint
            AND ubr.result = 'win'
            AND ubr.played_at >= v_task.created_at
        ) THEN 1 ELSE 0 END INTO v_progress;

      -- rush: repetível — runs completed >= task.created_at
      WHEN 'rush' THEN
        v_target := (v_task.config_json ->> 'count')::integer;
        SELECT COUNT(*)::integer INTO v_progress
        FROM public.puzzle_rush_runs prr
        WHERE prr.user_id = v_user_id
          AND prr.status = 'completed'
          AND prr.played_at >= v_task.created_at
          AND (
            (v_task.config_json ->> 'mode') IS NULL
            OR prr.mode = (v_task.config_json ->> 'mode')
          );
    END CASE;

    v_progress := LEAST(v_progress, v_target);
    v_completed := v_progress >= v_target;
    v_just_completed := v_completed AND NOT v_was_completed;

    -- UPSERT progresso
    INSERT INTO public.user_task_progress (user_id, task_id, progress, completed, completed_at)
    VALUES (
      v_user_id,
      v_task.id,
      v_progress,
      v_completed,
      CASE WHEN v_completed THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, task_id) DO UPDATE SET
      progress = EXCLUDED.progress,
      completed = EXCLUDED.completed,
      completed_at = CASE
        WHEN EXCLUDED.completed AND NOT user_task_progress.completed THEN now()
        WHEN EXCLUDED.completed AND user_task_progress.completed THEN user_task_progress.completed_at
        ELSE NULL
      END;

    v_results := v_results || jsonb_build_object(
      'task_id', v_task.id,
      'class_id', v_task.class_id,
      'task_type', v_task.task_type,
      'title', v_task.title,
      'description', v_task.description,
      'deadline', v_task.deadline,
      'progress', v_progress,
      'target', v_target,
      'completed', v_completed,
      'just_completed', v_just_completed
    );
  END LOOP;

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 check_task_progress: recalcula progresso de UMA tarefa específica
CREATE OR REPLACE FUNCTION public.check_task_progress(p_task_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_task record;
  v_progress integer := 0;
  v_target integer := 1;
  v_completed boolean;
  v_was_completed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Busca tarefa + verifica que aluno é membro da turma
  SELECT ct.*, utp.completed AS prev_completed
  INTO v_task
  FROM public.class_tasks ct
  JOIN public.class_members cm ON cm.class_id = ct.class_id AND cm.user_id = v_user_id
  LEFT JOIN public.user_task_progress utp ON utp.task_id = ct.id AND utp.user_id = v_user_id
  WHERE ct.id = p_task_id AND ct.active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada ou você não é membro da turma';
  END IF;

  v_was_completed := COALESCE(v_task.prev_completed, false);

  IF v_was_completed THEN
    RETURN jsonb_build_object(
      'task_id', v_task.id,
      'progress', (SELECT progress FROM public.user_task_progress WHERE task_id = v_task.id AND user_id = v_user_id),
      'target', CASE v_task.task_type
        WHEN 'lesson' THEN 1
        WHEN 'bot' THEN 1
        WHEN 'puzzles_count' THEN (v_task.config_json ->> 'count')::integer
        WHEN 'puzzles_theme' THEN (v_task.config_json ->> 'count')::integer
        WHEN 'rush' THEN (v_task.config_json ->> 'count')::integer
      END,
      'completed', true,
      'just_completed', false
    );
  END IF;

  -- Calcular progresso (mesma lógica de check_my_tasks)
  CASE v_task.task_type
    WHEN 'lesson' THEN
      v_target := 1;
      SELECT CASE WHEN ulp.completed THEN 1 ELSE 0 END INTO v_progress
      FROM public.user_lesson_progress ulp
      WHERE ulp.user_id = v_user_id
        AND ulp.lesson_id = (v_task.config_json ->> 'lesson_id')::bigint;
      v_progress := COALESCE(v_progress, 0);

    WHEN 'puzzles_count' THEN
      v_target := (v_task.config_json ->> 'count')::integer;
      SELECT COUNT(*)::integer INTO v_progress
      FROM public.user_puzzle_attempts upa
      WHERE upa.user_id = v_user_id AND upa.mode = 'rating' AND upa.solved = true
        AND upa.attempted_at >= v_task.created_at;

    WHEN 'puzzles_theme' THEN
      v_target := (v_task.config_json ->> 'count')::integer;
      SELECT COUNT(*)::integer INTO v_progress
      FROM public.user_puzzle_attempts upa
      JOIN public.puzzles p ON p.id = upa.puzzle_id
      WHERE upa.user_id = v_user_id AND upa.solved = true
        AND upa.attempted_at >= v_task.created_at
        AND (v_task.config_json ->> 'theme') = ANY(p.themes);

    WHEN 'bot' THEN
      v_target := 1;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM public.user_bot_results ubr
        WHERE ubr.user_id = v_user_id
          AND ubr.bot_id = (v_task.config_json ->> 'bot_id')::bigint
          AND ubr.result = 'win'
          AND ubr.played_at >= v_task.created_at
      ) THEN 1 ELSE 0 END INTO v_progress;

    WHEN 'rush' THEN
      v_target := (v_task.config_json ->> 'count')::integer;
      SELECT COUNT(*)::integer INTO v_progress
      FROM public.puzzle_rush_runs prr
      WHERE prr.user_id = v_user_id AND prr.status = 'completed'
        AND prr.played_at >= v_task.created_at
        AND ((v_task.config_json ->> 'mode') IS NULL OR prr.mode = (v_task.config_json ->> 'mode'));
  END CASE;

  v_progress := LEAST(v_progress, v_target);
  v_completed := v_progress >= v_target;

  INSERT INTO public.user_task_progress (user_id, task_id, progress, completed, completed_at)
  VALUES (
    v_user_id, p_task_id, v_progress, v_completed,
    CASE WHEN v_completed THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, task_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    completed = EXCLUDED.completed,
    completed_at = CASE
      WHEN EXCLUDED.completed AND NOT user_task_progress.completed THEN now()
      WHEN EXCLUDED.completed AND user_task_progress.completed THEN user_task_progress.completed_at
      ELSE NULL
    END;

  RETURN jsonb_build_object(
    'task_id', v_task.id,
    'progress', v_progress,
    'target', v_target,
    'completed', v_completed,
    'just_completed', v_completed AND NOT v_was_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SEÇÃO 5: Recriação de RPCs existentes com integração de feed
-- ============================================================

-- 5.1 grant_xp — adiciona emit_class_feed('level_up') ao subir de nível
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
  IF v_leveled_up THEN
    FOR v_i IN 1..v_levels_gained LOOP
      INSERT INTO public.user_chests (user_id, source_type, source_id)
      VALUES (v_user_id, 'level_up', 'level_' || (v_old_level + v_i)::text)
      ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
    END LOOP;

    -- Refresh ranking para refletir novo nível imediatamente
    PERFORM public.refresh_public_profiles();

    -- *** FASE 9: Emitir evento de level_up no mural ***
    PERFORM public.emit_class_feed(
      v_user_id,
      'level_up',
      jsonb_build_object('new_level', v_new_level)
    );
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

-- 5.2 bot_result — base: 20260313100000_phase7_block1_missions.sql L851-936
-- Mudanças vs fonte: apenas adição de emit_class_feed('bot_defeated')
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

  -- Validação de unlock (atômico via user_bot_first_wins)
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

  -- First-win atômico (tracking apenas, sem XP direto)
  IF p_result = 'win' THEN
    INSERT INTO public.user_bot_first_wins (user_id, bot_id)
    VALUES (v_user_id, p_bot_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_first_win_id;

    v_is_first_win := v_first_win_id IS NOT NULL;

    -- *** FASE 9: Emitir evento de bot_defeated no mural ***
    IF v_is_first_win THEN
      PERFORM public.emit_class_feed(
        v_user_id,
        'bot_defeated',
        jsonb_build_object('bot_name', v_bot.name, 'bot_elo', v_bot.elo)
      );
    END IF;
  END IF;

  -- NÃO concede XP aqui — XP vem de missões e conquistas

  -- Atualizar missões diárias
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

-- 5.3 puzzle_attempt — base: 20260313100000_phase7_block1_missions.sql L369-579
-- Mudanças vs fonte: apenas adição de emit_class_feed('rating_milestone')
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

    -- *** FASE 9: Emitir evento de rating_milestone ao cruzar centena para cima ***
    IF floor(v_rating_before::numeric / 100) < floor(v_rating_after::numeric / 100) THEN
      PERFORM public.emit_class_feed(
        v_user_id,
        'rating_milestone',
        jsonb_build_object('rating', (floor(v_rating_after::numeric / 100) * 100)::integer)
      );
    END IF;
  ELSE
    v_rating_after := v_rating_before;
    v_rd_after := v_rd_before;
    v_vol_after := v_vol_before;
  END IF;

  -- Insere tentativa (com rush_run_id)
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

  -- Atualizar missões diárias (não durante rush — end_rush cuida disso)
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

-- 5.4 end_rush — adiciona emit_class_feed('rush_record') ao bater recorde
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

  -- Validar tempo (com 10s de buffer)
  v_time_limit := CASE v_run.mode
    WHEN '3min' THEN interval '3 minutes 10 seconds'
    WHEN '5min' THEN interval '5 minutes 10 seconds'
    ELSE NULL
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

  -- CALCULAR SCORE REAL no servidor
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

  -- *** FASE 9: Emitir evento de rush_record no mural ***
  IF v_is_record THEN
    PERFORM public.emit_class_feed(
      v_user_id,
      'rush_record',
      jsonb_build_object('mode', v_run.mode, 'score', v_actual_score)
    );
  END IF;

  -- Atualizar missões diárias
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

-- 5.5 check_achievements — adiciona emit_class_feed('achievement_unlocked')
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

  -- Pre-fetch dados do usuário
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

    IF v_current_value >= v_ach.condition_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (v_user_id, v_ach.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING id INTO v_unlock_id;

      IF v_unlock_id IS NOT NULL THEN
        IF v_ach.reward_xp > 0 THEN
          PERFORM public.grant_xp(
            p_amount := v_ach.reward_xp,
            p_source := 'achievement',
            p_source_id := 'ach_' || v_ach.key
          );
        END IF;

        IF v_ach.reward_item_id IS NOT NULL THEN
          INSERT INTO public.user_inventory (user_id, item_id, source)
          VALUES (v_user_id, v_ach.reward_item_id, 'achievement')
          ON CONFLICT (user_id, item_id) DO NOTHING;
        END IF;

        IF v_ach.reward_chest THEN
          INSERT INTO public.user_chests (user_id, source_type, source_id)
          VALUES (v_user_id, 'achievement', 'ach_' || v_ach.key)
          ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
        END IF;

        -- *** FASE 9: Emitir evento de achievement_unlocked no mural ***
        PERFORM public.emit_class_feed(
          v_user_id,
          'achievement_unlocked',
          jsonb_build_object('achievement_key', v_ach.key, 'title', v_ach.title)
        );

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

-- 5.6 check_daily_missions — adiciona emit_class_feed('streak_milestone')
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

          -- *** FASE 9: Emitir evento de streak_milestone no mural ***
          -- Só emite quando atinge exatamente o milestone (não em dias subsequentes)
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

-- 5.7 complete_lesson_step — adiciona emit_class_feed('title_earned')
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
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

      SELECT * INTO v_progress
      FROM public.user_lesson_progress
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;
    ELSE
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

  -- Guard: step já resolvido
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

    -- Atualizar missões diárias
    PERFORM public.check_daily_missions();

    -- BLOCO 6: Verificar se trilha foi concluída → atualizar título
    SELECT COUNT(*) INTO v_trail_total
    FROM public.lessons WHERE trail = v_lesson.trail;

    SELECT COUNT(*) INTO v_trail_done
    FROM public.user_lesson_progress ulp
    JOIN public.lessons l ON l.id = ulp.lesson_id
    WHERE ulp.user_id = v_user_id
      AND l.trail = v_lesson.trail
      AND ulp.completed = true;

    IF v_trail_done >= v_trail_total THEN
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

        -- *** FASE 9: Emitir evento de title_earned no mural ***
        PERFORM public.emit_class_feed(
          v_user_id,
          'title_earned',
          jsonb_build_object('title', v_title_map[v_new_pos])
        );
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
