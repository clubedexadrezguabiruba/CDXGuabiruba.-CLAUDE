-- ============================================================
-- R1, passo 1 — fecha a escrita direta do browser nas nove tabelas
--               que nenhum código de cliente escreve
-- ============================================================
--
-- O PROBLEMA, medido em 2026-08-09 pelo gate `npm run verify:privileges`
-- (seção 5, nascida do G3) contra o banco de produção: das 30 tabelas de
-- `public`, **11 são escrevíveis de fato** por `authenticated` — grant de
-- INSERT/UPDATE/DELETE **e** policy PERMISSIVE do mesmo comando alcançando o
-- papel. Grant sem policy não escreve; policy sem grant não escreve; o par
-- escreve.
--
-- Isso fura a Regra Inviolável nº 1 (toda concessão é do servidor, via RPC) não
-- no ato de conceder, mas no **lastro**: três dessas tabelas alimentam contagem
-- que vira recompensa.
--
--   20260313300000_phase7_block4_achievements.sql:70-73 → COUNT(*) de
--     user_lesson_progress vira `lessons_completed`, e a linha 101-106 chama
--     grant_xp. O mesmo caminho serve `puzzles_solved` (:59-62, de
--     user_puzzle_attempts) e `rush_score` (:75-78, de puzzle_rush_runs).
--   20260729120000_patente_por_marcos.sql:131-133 → COUNT(*) da mesma tabela
--     decide a **patente**.
--   20260725140000_restaurar_xp_missoes.sql:154-246 → as missões diárias
--     repetem as três contagens.
--
-- Ou seja: um aluno que insere linhas em user_lesson_progress compra XP,
-- conquista e patente sem resolver nada.
--
-- Esta migration fecha **nove** das onze — as que nenhum arquivo de `src/`
-- escreve. As outras duas vêm em migration própria: `users` (passo 2, a
-- urgente) e `class_tasks` (passo 3). Ver docs/achados.md, R1.
--
-- POR QUE ISTO NÃO QUEBRA NADA — as três medições, todas de 2026-08-09:
--
--   1. **Ninguém escreve direto.** Em todo o `src/` existem duas escritas
--      diretas, e nenhuma é nestas nove: configuracoes/page.tsx:67 (users) e
--      TarefasClient.tsx:95 (class_tasks). Toda outra escrita do cliente é
--      `.rpc(...)`. O `e2e/` também não escreve direto em nenhuma delas.
--
--   2. **As RPCs não passam pela RLS.** As nove tabelas têm dono `postgres`,
--      `FORCE ROW LEVEL SECURITY` **desligado** nas nove, e as 20 funções que
--      escrevem nelas são SECURITY DEFINER de dono `postgres`. Postgres isenta
--      o dono da tabela da RLS quando FORCE está desligado — a policy nunca é
--      consultada nesse caminho. Dropar a policy não muda um byte do que a RPC
--      consegue fazer.
--
--   3. **Não há função INVOKER no meio.** Nenhuma função de `public` que seja
--      SECURITY INVOKER, chamável por `authenticated`, escreve em qualquer uma
--      das onze — medido em pg_proc. Se houvesse, ela escreveria como o
--      chamador e dependeria da policy.
--
-- O QUE **NÃO** SE TOCA: as policies de SELECT. Nenhuma linha abaixo mexe em
-- leitura — `user_lesson_progress` é lida por 5 telas de `src/`, entre elas o
-- relatório do professor, e essas leituras seguem exatamente como estavam.
--
-- Gate: `npm run verify:privileges`, seção 5 — sai de 11 falhas para 2 (users e
-- class_tasks, os passos 2 e 3). Se uma migration futura recriar qualquer uma
-- destas policies, o gate reprova de novo nomeando a tabela e a via.
-- ============================================================

-- ------------------------------------------------------------
-- Progresso e tentativas — o lastro que vira XP, conquista e patente.
-- Escrita legítima: complete_lesson_step, puzzle_attempt, skip_puzzle,
-- start_rush, end_rush, submit_review_gate, bot_result (todas DEFINER).
-- ------------------------------------------------------------

DROP POLICY lesson_progress_insert_own ON public.user_lesson_progress;
DROP POLICY lesson_progress_update_own ON public.user_lesson_progress;

DROP POLICY attempts_insert_own ON public.user_puzzle_attempts;

DROP POLICY rush_runs_insert_own ON public.puzzle_rush_runs;

DROP POLICY revanche_insert_own ON public.puzzle_revanche_queue;
DROP POLICY revanche_update_own ON public.puzzle_revanche_queue;

DROP POLICY review_gate_insert_own ON public.review_gate_attempts;
DROP POLICY review_gate_update_own ON public.review_gate_attempts;

DROP POLICY bot_results_insert_own ON public.user_bot_results;

-- ------------------------------------------------------------
-- Análise de partida contra bot.
-- Escrita legítima: save_bot_analysis, mark_analysis_failed (DEFINER).
-- ------------------------------------------------------------

DROP POLICY analysis_insert_own ON public.bot_game_analysis;

-- ------------------------------------------------------------
-- Turmas. `classes_*_teacher` e `class_members_delete_teacher` conferiam
-- `role = 'professor'` lendo `public.users` — e `role` é coluna que o próprio
-- aluno podia gravar (é o passo 2). Escalada de privilégio de uma linha:
-- vira professor, cria turma. Fecha aqui e fecha na origem no passo 2.
-- Escrita legítima: create_class, join_class, remove_class_member (DEFINER).
-- ------------------------------------------------------------

DROP POLICY classes_insert_teacher ON public.classes;
DROP POLICY classes_update_teacher ON public.classes;

DROP POLICY class_members_insert ON public.class_members;
DROP POLICY class_members_delete_own ON public.class_members;
DROP POLICY class_members_delete_teacher ON public.class_members;

-- ------------------------------------------------------------
-- Marca em cada tabela o porquê, para quem chegar pelo `\d` e não pelo git.
-- ------------------------------------------------------------

COMMENT ON TABLE public.user_lesson_progress IS
  'Progresso de aula. SEM policy de escrita: o browser não grava aqui. COUNT(*) '
  'desta tabela vira lessons_completed em conquistas, missões diárias e patente — '
  'linha forjada aqui compra XP e patente. Escrita só por RPC SECURITY DEFINER '
  '(complete_lesson_step). Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.user_puzzle_attempts IS
  'Tentativas de puzzle. SEM policy de escrita: o browser não grava aqui. COUNT(*) '
  'vira puzzles_solved em conquistas e missões. Escrita só por RPC SECURITY DEFINER '
  '(puzzle_attempt). Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.puzzle_rush_runs IS
  'Corridas de rush. SEM policy de escrita: o browser não grava aqui. O score daqui '
  'vira rush_score em conquistas. Escrita só por RPC SECURITY DEFINER (start_rush, '
  'end_rush). Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.puzzle_revanche_queue IS
  'Fila de revanche. SEM policy de escrita: o browser não grava aqui. Escrita só por '
  'RPC SECURITY DEFINER (puzzle_attempt). Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.review_gate_attempts IS
  'Tentativas do portão de revisão. SEM policy de escrita: o browser não grava aqui. '
  'Escrita só por RPC SECURITY DEFINER (submit_review_gate). Vigiado por '
  'npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.user_bot_results IS
  'Resultados contra bot. SEM policy de escrita: o browser não grava aqui. Escrita só '
  'por RPC SECURITY DEFINER (bot_result). Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.bot_game_analysis IS
  'Análise de partida contra bot. SEM policy de escrita: o browser não grava aqui. '
  'Escrita só por RPC SECURITY DEFINER (save_bot_analysis, mark_analysis_failed). '
  'Vigiado por npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.classes IS
  'Turmas. SEM policy de escrita: o browser não grava aqui. As policies antigas '
  'conferiam role=professor lendo public.users, coluna que o próprio aluno gravava. '
  'Escrita só por RPC SECURITY DEFINER (create_class). Vigiado por '
  'npm run verify:privileges, seção 5.';

COMMENT ON TABLE public.class_members IS
  'Vínculo aluno-turma. SEM policy de escrita: o browser não grava aqui. Escrita só '
  'por RPC SECURITY DEFINER (join_class, remove_class_member). Vigiado por '
  'npm run verify:privileges, seção 5.';
