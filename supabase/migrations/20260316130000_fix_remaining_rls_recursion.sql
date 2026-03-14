-- ============================================================
-- FIX v3: policies restantes que ainda usam subquery inline
-- em class_members/classes, causando recursão RLS silenciosa
-- ============================================================
-- Policies afetadas:
--   class_tasks_select_member  (BUG: aluno não vê tarefas)
--   class_feed_select_member
--   class_feed_select_teacher
--   task_progress_select_teacher
--
-- Solução: substituir EXISTS inline por helpers SECURITY DEFINER
-- já existentes (is_member_of_class, is_teacher_of_class)
-- + novo helper is_teacher_of_task para user_task_progress.
-- ============================================================

-- 1. class_tasks_select_member (BUG PRINCIPAL — aluno não vê tarefas)
DROP POLICY IF EXISTS class_tasks_select_member ON public.class_tasks;
CREATE POLICY class_tasks_select_member ON public.class_tasks
  FOR SELECT USING (active = true AND public.is_member_of_class(class_id));

-- 2. class_feed_select_member
DROP POLICY IF EXISTS class_feed_select_member ON public.class_feed;
CREATE POLICY class_feed_select_member ON public.class_feed
  FOR SELECT USING (public.is_member_of_class(class_id));

-- 3. class_feed_select_teacher
DROP POLICY IF EXISTS class_feed_select_teacher ON public.class_feed;
CREATE POLICY class_feed_select_teacher ON public.class_feed
  FOR SELECT USING (public.is_teacher_of_class(class_id));

-- 4. Helper: checar se caller é teacher de uma tarefa (via class_tasks→classes)
CREATE OR REPLACE FUNCTION public.is_teacher_of_task(p_task_id bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_tasks ct
    JOIN public.classes c ON c.id = ct.class_id
    WHERE ct.id = p_task_id AND c.teacher_id = auth.uid()
  );
$$;

-- 5. task_progress_select_teacher
DROP POLICY IF EXISTS task_progress_select_teacher ON public.user_task_progress;
CREATE POLICY task_progress_select_teacher ON public.user_task_progress
  FOR SELECT USING (public.is_teacher_of_task(task_id));
