-- ============================================================
-- Endurecimento de segurança do banco
--
-- Problema 1: 40 das 48 funções SECURITY DEFINER não fixavam search_path.
--   Uma função DEFINER com search_path mutável pode ser induzida a resolver
--   um nome de tabela/função para um objeto plantado pelo chamador.
--   É o `function_search_path_mutable` que o linter do Supabase sinaliza.
--
-- Problema 2: nenhuma das 64 migrations anteriores continha REVOKE ou
--   GRANT EXECUTE. Com o default do PostgreSQL (EXECUTE para PUBLIC),
--   helpers internos que MUTAM estado ficaram chamáveis direto do browser
--   por qualquer usuário logado — inclusive grant_xp.
--
-- Verificado antes de aplicar: nenhuma função DEFINER usa funções do schema
-- `extensions` sem qualificar, então search_path = public, pg_temp é seguro.
-- (pg_temp por último é o padrão recomendado na doc do PostgreSQL.)
--
-- Gate: npm run verify:privileges (falha antes desta migration, passa depois)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fixar search_path nas 40 funções SECURITY DEFINER que não tinham
-- ------------------------------------------------------------
ALTER FUNCTION public.bot_result(p_bot_id bigint, p_result text, p_pgn text, p_time_spent_seconds integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_daily_missions() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_level_up() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_my_tasks() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_task_progress(p_task_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_lesson_step(p_lesson_id bigint, p_step_index integer, p_move text, p_used_hint boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_class(p_name text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_task(p_class_id bigint, p_task_type text, p_config_json jsonb, p_title text, p_description text, p_deadline timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.debug_puzzle_state() SET search_path = public, pg_temp;
ALTER FUNCTION public.emit_class_feed(p_user_id uuid, p_event_type text, p_event_data jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.end_rush(p_rush_run_id bigint, p_score integer, p_best_streak integer, p_lives_remaining integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_user_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.equip_item(p_item_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_achievements() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_class_members(p_class_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_class_ranking(p_class_id bigint, p_type text, p_limit integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_lesson_map() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_next_puzzle_category(p_theme text, p_difficulty text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_next_puzzle_rating() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_public_profile(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_ranking(p_type text, p_limit integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_ranking_with_position(p_type text, p_limit integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_revanche_due() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_member_of_class(p_class_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_teacher_of(target_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_teacher_of_class(p_class_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_teacher_of_task(p_task_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.join_class(p_invite_code text) SET search_path = public, pg_temp;
ALTER FUNCTION public.lesson_step_submit(p_lesson_id bigint, p_step_index integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_analysis_failed(p_bot_result_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.puzzle_attempt(p_puzzle_id bigint, p_moves text[], p_mode text, p_time_spent_ms integer, p_rush_run_id bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_public_profiles() SET search_path = public, pg_temp;
ALTER FUNCTION public.remove_class_member(p_class_id bigint, p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.save_bot_analysis(p_bot_result_id bigint, p_pgn text, p_moves_analysis_json jsonb, p_accuracy_percent numeric, p_brilliant integer, p_great integer, p_good integer, p_inaccuracy integer, p_mistake integer, p_blunder integer, p_schema_version integer, p_engine_info text) SET search_path = public, pg_temp;
ALTER FUNCTION public.shares_class_with(target_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.skip_puzzle() SET search_path = public, pg_temp;
ALTER FUNCTION public.start_rush(p_mode text) SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_review_gate(p_trail text, p_answers jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.unequip_slot(p_slot text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_avatar_base(p_base text) SET search_path = public, pg_temp;

-- ------------------------------------------------------------
-- 2. Revogar EXECUTE dos helpers internos que MUTAM estado
--
-- Estas funções nunca são chamadas pelo client: são invocadas por outras
-- funções SECURITY DEFINER (que rodam como owner, então não precisam do
-- privilégio do chamador) ou por triggers (privilégio checado na criação
-- do trigger, não na execução).
--
-- Deliberadamente NÃO revogadas: mask_display_name e calculate_glicko2 —
-- são funções puras, sem estado, sem ganho de segurança em revogar e com
-- risco de quebrar views/rankings que as usam.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.grant_xp(p_amount integer, p_source text, p_source_id text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_level_up() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.emit_class_feed(p_user_id uuid, p_event_type text, p_event_data jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._create_random_pet_egg(p_user_id uuid, p_rarity text, p_source_type text, p_source_id text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public._create_specific_pet_egg(p_user_id uuid, p_pet_item_id bigint, p_source_type text, p_source_id text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_public_profiles() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, PUBLIC;

-- debug_puzzle_state() existe no banco mas NÃO consta de nenhuma migration
-- (foi criada ad hoc). Revogada aqui; candidata a DROP numa limpeza futura.
REVOKE EXECUTE ON FUNCTION public.debug_puzzle_state() FROM anon, authenticated, PUBLIC;

COMMENT ON FUNCTION public.grant_xp(integer, text, text) IS
  'Helper interno. EXECUTE revogado de anon/authenticated: só chamável por outras funções SECURITY DEFINER.';
