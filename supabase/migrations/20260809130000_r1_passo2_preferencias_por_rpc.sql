-- ============================================================
-- R1, passo 2 — `users` deixa de ser escrevível pelo browser
-- ============================================================
--
-- O PIOR DOS ONZE, medido em 2026-08-09. Nas outras dez tabelas a escrita
-- direta forja o **lastro** — a contagem que a RPC lê para decidir a
-- recompensa. Em `public.users` ela forja a **recompensa em si**.
--
-- A policy `users_update_own` é `FOR UPDATE USING (id = auth.uid())` e **não
-- restringe coluna nenhuma**. `authenticated` tinha UPDATE nas 26 de 26 colunas.
-- O único trigger da tabela é `trg_users_updated_at`. Ou seja, um aluno
-- autenticado gravava, na própria linha:
--
--   xp · level · puzzle_rating · puzzle_rd · puzzle_volatility · puzzle_streak ·
--   puzzle_best_streak · rush_3min_record · rush_5min_record ·
--   rush_resistencia_record · **role**
--
-- Não era preciso comprar XP inserindo aulas concluídas: dava para escrever o
-- XP. E `role` é escalada de privilégio — virar 'professor' satisfazia o
-- `EXISTS (... role = 'professor')` das policies de `classes` e `class_tasks`
-- (fechadas no passo 1 e no passo 3; a origem fecha aqui).
--
-- POR QUE NÃO SE REGRANTA COLUNA A COLUNA. Seria a saída curta:
-- `GRANT UPDATE (sound_muted, ...) ON public.users TO authenticated`. Ela fecha
-- o buraco e **cega o gate**: `has_table_privilege(...,'UPDATE')` é table-level
-- e passaria a dar verde numa tabela ainda escrevível. Gate que passa com o
-- problema em pé é o G2 de novo. Fechar por RPC mantém a régua honesta.
--
-- O QUE A TELA DE CONFIGURAÇÕES ESCREVE — medido em
-- src/app/(main)/configuracoes/page.tsx, onde `updatePreference` (:61-75) é
-- chamada de exatamente quatro lugares:
--
--   sound_muted (:80) · premove_enabled (:85) · auto_queen (:90) ·
--   ranking_visible (:95)
--
-- Quatro colunas, todas boolean. É a lista fechada abaixo, e ela é a
-- **assinatura da função**: não existe parâmetro que carregue nome de coluna,
-- então não existe caminho para escrever numa quinta. Coluna nova amanhã é
-- migration nova — de propósito.
--
-- `avatar_base` fica de fora: já tem RPC própria (`update_avatar_base`,
-- 20260321100000). Nenhuma outra tela de `src/` escreve em `users` — medido.
--
-- POR QUE O REVOKE NÃO QUEBRA NADA:
--   - `users` tem dono `postgres` e `FORCE ROW LEVEL SECURITY` desligado; as
--     RPCs que escrevem nela são SECURITY DEFINER de dono `postgres`. Nem a
--     policy nem o grant de `authenticated` participam desse caminho.
--   - O cadastro (`handle_new_user`) é trigger DEFINER sobre `auth.users`.
--   - SELECT **não é tocado**: 9 telas de `src/` leem `users` direto e seguem
--     lendo. O que fecha é só escrita.
--
-- Gate: `npm run verify:privileges` — a seção 5 sai de 2 falhas para 1
-- (`class_tasks`, o passo 3), e a seção 3 passa a provar que `set_preferencias`
-- segue chamável por `authenticated`.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A RPC — lista fechada de quatro booleanos. NULL = não mexe na coluna.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_preferencias(
  p_sound_muted     boolean DEFAULT NULL,
  p_premove_enabled boolean DEFAULT NULL,
  p_auto_queen      boolean DEFAULT NULL,
  p_ranking_visible boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  -- `WHERE id = v_uid` é o que substitui a policy: a RPC escreve na linha de
  -- quem chamou e em nenhuma outra. Não há parâmetro de user_id, de propósito.
  UPDATE public.users
  SET sound_muted     = COALESCE(p_sound_muted,     sound_muted),
      premove_enabled = COALESCE(p_premove_enabled, premove_enabled),
      auto_queen      = COALESCE(p_auto_queen,      auto_queen),
      ranking_visible = COALESCE(p_ranking_visible, ranking_visible)
  WHERE id = v_uid
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN jsonb_build_object(
    'sound_muted',     v_row.sound_muted,
    'premove_enabled', v_row.premove_enabled,
    'auto_queen',      v_row.auto_queen,
    'ranking_visible', v_row.ranking_visible
  );
END;
$$;

COMMENT ON FUNCTION public.set_preferencias(boolean, boolean, boolean, boolean) IS
  'Única via de escrita do browser em public.users. Quatro preferências booleanas '
  'da tela de configurações; a assinatura É o whitelist de colunas. Escreve só na '
  'linha de auth.uid() — não recebe user_id. NULL não mexe na coluna. '
  'Vigiado por npm run verify:privileges, seções 3 e 5.';

REVOKE ALL ON FUNCTION public.set_preferencias(boolean, boolean, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_preferencias(boolean, boolean, boolean, boolean) TO authenticated;

-- ------------------------------------------------------------
-- 2. Fecha a escrita direta: primeiro o grant, depois as policies que ficaram
--    sem grant. As duas metades saem juntas porque o gate mede o PAR — deixar
--    a policy viva seria deixar armada a metade que uma migration futura
--    reativaria com um GRANT distraído.
-- ------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.users FROM authenticated, anon, PUBLIC;

DROP POLICY users_insert_own ON public.users;
DROP POLICY users_update_own ON public.users;

COMMENT ON TABLE public.users IS
  'Perfil do aluno. SEM grant e SEM policy de escrita para anon/authenticated: o '
  'browser não grava aqui. A policy antiga não restringia coluna, então o aluno '
  'gravava o próprio xp, puzzle_rating, os recordes de rush e o próprio role — '
  'recompensa e escalada de privilégio na mesma linha. Escrita só por RPC SECURITY '
  'DEFINER: set_preferencias (as 4 preferências) e update_avatar_base. NÃO regrante '
  'UPDATE coluna a coluna: has_table_privilege é table-level e isso cega o gate. '
  'SELECT segue liberado. Vigiado por npm run verify:privileges, seção 5.';
