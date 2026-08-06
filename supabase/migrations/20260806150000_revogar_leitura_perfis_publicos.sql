-- ============================================================
-- Fecha a leitura direta de public.user_public_profiles
-- ============================================================
--
-- O PROBLEMA, medido em 2026-08-06 pelo gate `npm run verify:privileges`:
--
--   [FAIL] user_public_profiles não deve ser legível pelo browser
--          SELECT exposto a: anon, authenticated
--
-- `user_public_profiles` é MATERIALIZED VIEW. Matview **não aceita RLS** no
-- Postgres — `ALTER ... ENABLE ROW LEVEL SECURITY` nem existe para ela. A
-- única defesa possível é o privilégio, e nenhuma das 71 migrations anteriores
-- escreveu GRANT ou REVOKE sobre ela: ela nasceu com o privilégio default do
-- Supabase, que concede em `public` para anon e authenticated.
--
-- O que sai por ali, de todo usuário com role 'aluno' ou 'professor'
-- (definição vigente em 20260321100000_avatar_base.sql:16):
--
--   display_name **cru**, avatar_config, avatar_base, level, xp,
--   puzzle_rating, os três recordes de rush, title, current_streak,
--   member_since — e a coluna `ranking_visible`.
--
-- As duas consequências que importam:
--
--   1. `mask_display_name` é aplicada **nas RPCs**, sobre um display_name que
--      na matview está inteiro. Ler a matview direto contorna a máscara.
--   2. `ranking_visible` é uma COLUNA do que está exposto, não um filtro sobre
--      ele. Quem filtra são as RPCs. Ou seja, o opt-out do ranking era
--      cortesia da camada de RPC, não garantia: lendo a matview, aparece
--      quem pediu para não aparecer.
--
-- A chave `anon` viaja no pacote do navegador por design. Na prática, qualquer
-- um com o endereço do projeto lia a tabela inteira. O repositório é público e
-- o produto vai guardar dados de alunos menores de idade.
--
-- POR QUE ISTO NÃO QUEBRA NADA:
--
--   - Nenhum arquivo de `src/` lê a matview direto — verificado por grep. Todo
--     acesso do app passa por RPC.
--   - `get_ranking` (20260216180300_rpcs.sql:544), `get_class_ranking`
--     (20260316190000_ranking_teacher_badge.sql:6) e `get_public_profile`
--     (20260321100000_avatar_base.sql:64) são **SECURITY DEFINER**: leem como
--     owner, não como o chamador. O REVOKE não as alcança.
--   - `service_role` não é tocado — é como `scripts/verify/phase2/validate-phase2.ts`
--     continua funcionando.
--
-- Gate: `npm run verify:privileges` (seção 4) — falha antes desta migration,
-- passa depois. Se uma migration futura recriar a matview, o privilégio
-- default volta e o gate reprova de novo; o REVOKE tem que vir junto do
-- CREATE.
-- ============================================================

REVOKE ALL ON public.user_public_profiles FROM anon, authenticated, PUBLIC;

COMMENT ON MATERIALIZED VIEW public.user_public_profiles IS
  'Cache de perfil público. NÃO é legível por anon/authenticated: matview não '
  'aceita RLS, então o privilégio é a única defesa. Todo acesso passa por RPC '
  'SECURITY DEFINER, que aplica mask_display_name e o filtro de ranking_visible. '
  'Recriou a view? Repita o REVOKE — o privilégio default do Supabase volta. '
  'Vigiado por npm run verify:privileges, seção 4.';
