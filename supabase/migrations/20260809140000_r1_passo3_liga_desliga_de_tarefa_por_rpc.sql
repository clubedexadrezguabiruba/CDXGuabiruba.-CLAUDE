-- ============================================================
-- R1, passo 3 — `class_tasks` deixa de ser escrevível pelo browser
-- ============================================================
--
-- A última das onze. É a de menor gravidade: quem escreve é o professor, na
-- própria tarefa, e o uso é legítimo — o liga-desliga da tarefa em
-- src/app/(main)/turmas/[id]/tarefas/TarefasClient.tsx:92-99.
--
-- As duas policies medidas em 2026-08-09:
--
--   class_tasks_insert_teacher  FOR INSERT  (rls.sql:340)
--   class_tasks_update_teacher  FOR UPDATE USING (teacher_id = auth.uid())
--                                           (rls.sql:348)
--
-- A de INSERT é porta sem visita: a criação de tarefa já passa por
-- `create_task` (20260315100000:231), que é DEFINER — `CreateTaskForm.tsx`
-- chama `.rpc("create_task")` e nenhum arquivo de `src/` insere direto.
--
-- A de UPDATE é usada, e não restringe coluna: por ela o professor grava
-- qualquer coluna da tarefa — `config_json`, `deadline`, `task_type` —, não só
-- `active`. Ninguém quis isso; foi o que sobrou de uma policy escrita para o
-- dono da linha, não para a operação.
--
-- POR QUE RPC E NÃO A LISTA DE PERMITIDAS. O achado deixava as duas saídas
-- abertas. Vai de RPC porque `ESCRITA_PELO_BROWSER_PERMITIDA` cega o gate
-- **na tabela inteira**: com `class_tasks` na lista, a seção 5 passaria a dar
-- verde para essa tabela para sempre — inclusive para uma policy de escrita
-- nova, de outro assunto, criada daqui a um ano. A lista está vazia hoje e o
-- barato é mantê-la vazia. A RPC custa 20 linhas e fecha por operação: uma
-- coluna, uma regra.
--
-- A REGRA DE AUTORIZAÇÃO É A MESMA DE ANTES, palavra por palavra:
-- `teacher_id = auth.uid()`. Nada fica mais permissivo nem mais restrito para
-- quem já usava a tela — o que muda é que agora só a coluna `active` se move.
--
-- Gate: `npm run verify:privileges` — a seção 5 sai de 1 falha para **zero**, e
-- com ela `verify:all` volta a verde. Fim do R1.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A RPC — uma coluna, uma regra.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_task_active(
  p_task_id bigint,
  p_active  boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_task record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_active IS NULL THEN
    RAISE EXCEPTION 'p_active é obrigatório';
  END IF;

  -- Mesma condição da policy que esta função substitui.
  UPDATE public.class_tasks
  SET active = p_active
  WHERE id = p_task_id AND teacher_id = v_uid
  RETURNING * INTO v_task;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Tarefa não encontrada ou você não é o professor dela';
  END IF;

  RETURN jsonb_build_object('id', v_task.id, 'active', v_task.active);
END;
$$;

COMMENT ON FUNCTION public.set_task_active(bigint, boolean) IS
  'Liga e desliga uma tarefa de turma. Única via de escrita do browser em '
  'public.class_tasks. Move só a coluna `active`, e só em tarefa cujo '
  'teacher_id = auth.uid() — mesma regra da policy class_tasks_update_teacher, '
  'que não restringia coluna. Vigiado por npm run verify:privileges, seções 3 e 5.';

REVOKE ALL ON FUNCTION public.set_task_active(bigint, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_task_active(bigint, boolean) TO authenticated;

-- ------------------------------------------------------------
-- 2. Fecha a escrita direta — grant e policy juntos, como no passo 2.
-- ------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.class_tasks FROM authenticated, anon, PUBLIC;

DROP POLICY class_tasks_insert_teacher ON public.class_tasks;
DROP POLICY class_tasks_update_teacher ON public.class_tasks;

COMMENT ON TABLE public.class_tasks IS
  'Tarefas de turma. SEM grant e SEM policy de escrita para anon/authenticated: o '
  'browser não grava aqui. Escrita só por RPC SECURITY DEFINER — create_task (criar) '
  'e set_task_active (ligar/desligar). A policy antiga de UPDATE não restringia '
  'coluna: por ela o professor gravava config_json, deadline e task_type, não só '
  'active. SELECT segue liberado. Vigiado por npm run verify:privileges, seção 5.';
