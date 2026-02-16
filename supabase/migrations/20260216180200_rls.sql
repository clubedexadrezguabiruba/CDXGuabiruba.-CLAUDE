-- ============================================================
-- FASE 2 — RLS POLICIES (2.13)
-- Regras: aluno só acessa seus dados; professor vê alunos da turma
-- ============================================================

-- Helper: verifica se user é professor de uma turma que contém target_user
CREATE OR REPLACE FUNCTION public.is_teacher_of(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    JOIN public.class_members cm ON cm.class_id = c.id
    WHERE c.teacher_id = auth.uid()
      AND cm.user_id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: verifica se users compartilham turma
CREATE OR REPLACE FUNCTION public.shares_class_with(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members cm1
    JOIN public.class_members cm2 ON cm2.class_id = cm1.class_id
    WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_select_teacher ON public.users
  FOR SELECT USING (public.is_teacher_of(id));

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- PUZZLES (leitura pública para todos autenticados)
-- ============================================================
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY puzzles_select ON public.puzzles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- USER_PUZZLE_ATTEMPTS
-- ============================================================
ALTER TABLE public.user_puzzle_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY attempts_select_own ON public.user_puzzle_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY attempts_select_teacher ON public.user_puzzle_attempts
  FOR SELECT USING (public.is_teacher_of(user_id));

CREATE POLICY attempts_insert_own ON public.user_puzzle_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- LESSONS (leitura pública)
-- ============================================================
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_select ON public.lessons
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- USER_LESSON_PROGRESS
-- ============================================================
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_progress_select_own ON public.user_lesson_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY lesson_progress_select_teacher ON public.user_lesson_progress
  FOR SELECT USING (public.is_teacher_of(user_id));

CREATE POLICY lesson_progress_insert_own ON public.user_lesson_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY lesson_progress_update_own ON public.user_lesson_progress
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- BOTS (leitura pública)
-- ============================================================
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY bots_select ON public.bots
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- USER_BOT_RESULTS
-- ============================================================
ALTER TABLE public.user_bot_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_results_select_own ON public.user_bot_results
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY bot_results_select_teacher ON public.user_bot_results
  FOR SELECT USING (public.is_teacher_of(user_id));

CREATE POLICY bot_results_insert_own ON public.user_bot_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- BOT_GAME_ANALYSIS
-- ============================================================
ALTER TABLE public.bot_game_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_select_own ON public.bot_game_analysis
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY analysis_select_teacher ON public.bot_game_analysis
  FOR SELECT USING (public.is_teacher_of(user_id));

CREATE POLICY analysis_insert_own ON public.bot_game_analysis
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ACHIEVEMENTS (leitura pública)
-- ============================================================
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_select ON public.achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- USER_ACHIEVEMENTS
-- ============================================================
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_achievements_select_own ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_achievements_select_teacher ON public.user_achievements
  FOR SELECT USING (public.is_teacher_of(user_id));

-- público via perfil (conquistas visíveis a todos da mesma turma)
CREATE POLICY user_achievements_select_classmate ON public.user_achievements
  FOR SELECT USING (public.shares_class_with(user_id));

-- ============================================================
-- DAILY_MISSIONS
-- ============================================================
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_missions_select_own ON public.daily_missions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY daily_missions_select_teacher ON public.daily_missions
  FOR SELECT USING (public.is_teacher_of(user_id));

-- ============================================================
-- DAILY_CHESTS
-- ============================================================
ALTER TABLE public.daily_chests ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_chests_select_own ON public.daily_chests
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- ITEMS (leitura pública)
-- ============================================================
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY items_select ON public.items
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- USER_INVENTORY
-- ============================================================
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_select_own ON public.user_inventory
  FOR SELECT USING (user_id = auth.uid());

-- visível para colegas de turma (ver avatar equipado)
CREATE POLICY inventory_select_classmate ON public.user_inventory
  FOR SELECT USING (public.shares_class_with(user_id));

-- ============================================================
-- USER_EQUIPPED
-- ============================================================
ALTER TABLE public.user_equipped ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipped_select_own ON public.user_equipped
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY equipped_select_classmate ON public.user_equipped
  FOR SELECT USING (public.shares_class_with(user_id));

CREATE POLICY equipped_insert_own ON public.user_equipped
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY equipped_update_own ON public.user_equipped
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY equipped_delete_own ON public.user_equipped
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- USER_STREAKS
-- ============================================================
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY streaks_select_own ON public.user_streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY streaks_select_teacher ON public.user_streaks
  FOR SELECT USING (public.is_teacher_of(user_id));

-- ============================================================
-- USER_TITLES
-- ============================================================
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY titles_select_own ON public.user_titles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY titles_select_classmate ON public.user_titles
  FOR SELECT USING (public.shares_class_with(user_id));

-- ============================================================
-- PUZZLE_REVANCHE_QUEUE
-- ============================================================
ALTER TABLE public.puzzle_revanche_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY revanche_select_own ON public.puzzle_revanche_queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY revanche_insert_own ON public.puzzle_revanche_queue
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY revanche_update_own ON public.puzzle_revanche_queue
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- CLASSES
-- ============================================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Professor vê suas turmas
CREATE POLICY classes_select_teacher ON public.classes
  FOR SELECT USING (teacher_id = auth.uid());

-- Aluno vê turmas das quais é membro
CREATE POLICY classes_select_member ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = id AND cm.user_id = auth.uid()
    )
  );

-- Aluno pode ver turma pelo invite_code (para entrar)
CREATE POLICY classes_select_by_invite ON public.classes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY classes_insert_teacher ON public.classes
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor'
    )
  );

CREATE POLICY classes_update_teacher ON public.classes
  FOR UPDATE USING (teacher_id = auth.uid());

-- ============================================================
-- CLASS_MEMBERS
-- ============================================================
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Professor da turma vê membros
CREATE POLICY class_members_select_teacher ON public.class_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

-- Membro vê colegas da mesma turma
CREATE POLICY class_members_select_member ON public.class_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = class_id AND cm.user_id = auth.uid()
    )
  );

-- Aluno pode entrar (insert) em turma
CREATE POLICY class_members_insert ON public.class_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Professor remove aluno da turma
CREATE POLICY class_members_delete_teacher ON public.class_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

-- Aluno pode sair da turma
CREATE POLICY class_members_delete_own ON public.class_members
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- CLASS_TASKS
-- ============================================================
ALTER TABLE public.class_tasks ENABLE ROW LEVEL SECURITY;

-- Professor vê tarefas da sua turma
CREATE POLICY class_tasks_select_teacher ON public.class_tasks
  FOR SELECT USING (teacher_id = auth.uid());

-- Aluno vê tarefas das turmas das quais é membro
CREATE POLICY class_tasks_select_member ON public.class_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = class_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY class_tasks_insert_teacher ON public.class_tasks
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor'
    )
  );

CREATE POLICY class_tasks_update_teacher ON public.class_tasks
  FOR UPDATE USING (teacher_id = auth.uid());

-- ============================================================
-- USER_TASK_PROGRESS
-- ============================================================
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_progress_select_own ON public.user_task_progress
  FOR SELECT USING (user_id = auth.uid());

-- Professor vê progresso de alunos da turma na tarefa
CREATE POLICY task_progress_select_teacher ON public.user_task_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_tasks ct
      WHERE ct.id = task_id AND ct.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- CLASS_FEED
-- ============================================================
ALTER TABLE public.class_feed ENABLE ROW LEVEL SECURITY;

-- Membros da turma veem o feed
CREATE POLICY class_feed_select_member ON public.class_feed
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id = class_id AND cm.user_id = auth.uid()
    )
  );

-- Professor da turma vê o feed
CREATE POLICY class_feed_select_teacher ON public.class_feed
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- PUZZLE_RUSH_RUNS
-- ============================================================
ALTER TABLE public.puzzle_rush_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rush_runs_select_own ON public.puzzle_rush_runs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY rush_runs_select_teacher ON public.puzzle_rush_runs
  FOR SELECT USING (public.is_teacher_of(user_id));

CREATE POLICY rush_runs_insert_own ON public.puzzle_rush_runs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- USER_PUBLIC_PROFILES (view materializada — leitura pública)
-- ============================================================
-- Nota: materialized views não suportam RLS nativamente.
-- Acesso controlado via função refresh_public_profiles (SECURITY DEFINER)
-- e a view só expõe dados públicos (display_name, avatar, stats).
-- Para rankings, usaremos RPCs com SECURITY DEFINER que consultam a view.
