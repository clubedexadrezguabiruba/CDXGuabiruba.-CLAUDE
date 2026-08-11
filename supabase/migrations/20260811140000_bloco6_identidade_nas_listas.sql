-- ============================================================================
-- BLOCO 6 — A IDENTIDADE CHEGA ÀS LISTAS
--
-- O QUE ESTA MIGRATION EXISTE PARA CONSERTAR
-- ------------------------------------------
-- O aluno monta o boneco em /criar-personagem, confirma, cai no Quartel-General
-- — e o boneco **some**. Ele existe em três telas (as de perfil) e em nenhuma das
-- cinco onde a criança aparece ao lado dos colegas: navbar, Quadro de Honra, os
-- dois rankings e o mural. Nessas, ela é duas letras num círculo.
--
-- A metade de baixo do problema é esta: **as RPCs não falam a língua nova.** O
-- `user_public_profiles` já carrega `avatar_skin`/`avatar_hair`/`avatar_hair_color`
-- desde o E.3 (20260810200000_e3_perfil_publico_com_identidade.sql:94-101). As três
-- RPCs de ranking continuam devolvendo `avatar_config` — o cache de itens da pilha
-- v2, cujos 69 itens o Bloco B apagou. Elas servem um campo que não descreve mais
-- nada.
--
-- AS QUATRO MUDANÇAS
-- ------------------
--  1. `get_ranking_with_position` — `avatar_config` sai, as três colunas entram, no
--     SELECT do top N **e** no do `my_rank`. É a RPC do Quadro de Honra e do
--     ranking global.
--  2. `get_class_ranking` — a mesma troca. É a RPC do ranking de turma.
--  3. `get_ranking` — a legada, **sem nenhuma leitora em `src/`** (medido por grep
--     em 2026-08-11). Trocada junto, e de propósito: deixar UMA RPC servindo o
--     campo morto enquanto as irmãs servem o novo é a divergência silenciosa que
--     este projeto já pagou caro (ver o cabeçalho de verify-no-duplicate-rpc.ts).
--     Com esta migration `avatar_config` fica sem leitora nenhuma, e a conferência
--     6 do `verify:perfil-publico` passa a dizer, sozinha, que a coluna pode cair
--     numa migration futura.
--  4. `get_class_feed` — **nova**. O mural hoje lê `class_feed` direto do navegador
--     (src/hooks/useClassFeed.ts:24-29) e **não tem como chegar à identidade**:
--     `public.users` tem RLS, e a matview teve o SELECT revogado de `authenticated`
--     em 20260806150000. Sem uma RPC, o boneco não entra no mural.
--
-- O QUE NÃO MUDA, E POR QUÊ
-- -------------------------
--  * **O corpo das três** saiu de `pg_get_functiondef` do banco vivo (2026-08-11) e
--    só as linhas do avatar foram alteradas. Nada de ordenação, autorização,
--    máscara de nome ou tratamento de `p_type` desconhecido se move.
--  * **`get_class_ranking` continua SEM filtrar `ranking_visible`**, como está
--    declarado desde 20260316100000_phase10_rankings.sql:232 (*"turma sempre vê
--    todos os membros"*) e registrado como **achado D1** em docs/achados.md. Esta
--    migration não decide o D1 — decidi-lo aqui seria mudar o produto por dentro de
--    uma mudança de avatar. `get_ranking_with_position` e `get_ranking` continuam
--    filtrando.
--  * **Sem `BEGIN`/`COMMIT`.** O postgres.js recusa transação explícita, e um lote
--    de comandos já roda em transação implícita (regra do CLAUDE.md).
--
-- POR QUE NÃO JUNTAR O MURAL À MATVIEW
-- ------------------------------------
-- `get_class_feed` junta `class_feed` a **`public.users`**, não a
-- `user_public_profiles`. Dois motivos, e os dois são medidos:
--   - a matview é um cache refrescado por `refresh_public_profiles()`. O mural é a
--     tela onde a criança acabou de fazer algo; a identidade ali tem de ser a de
--     agora, não a do último refresh.
--   - a matview carrega `ranking_visible`, e o mural é por turma, onde esse opt-out
--     já é ignorado de propósito (o mesmo D1). Ler de `users` deixa isso explícito
--     em vez de escondido atrás de uma coluna que a query não usa.
-- A defesa é a mesma de `get_class_ranking`: SECURITY DEFINER com a checagem de
-- pertencimento (membro da turma OU professor daquela turma) antes de qualquer
-- leitura.
--
-- O QUE ELA NÃO FAZ
-- -----------------
-- Não apaga `avatar_config` de `users` nem da matview. Apagar coluna e trocar
-- leitor na mesma migration não tem como ser desfeito pela metade — e a conferência
-- 6 do `verify:perfil-publico` já vigia o par (coluna na view × função que a cita),
-- então a queda pode sair sozinha depois, com o gate verde dos dois lados.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. get_ranking_with_position — o Quadro de Honra e o ranking global
-- ---------------------------------------------------------------------------
-- Corpo de 20260321100000_avatar_base.sql, extraído do banco vivo. Únicas linhas
-- alteradas: `avatar_config,` vira as três colunas, nas duas queries dinâmicas.

CREATE OR REPLACE FUNCTION public.get_ranking_with_position(
  p_type text DEFAULT 'rating'::text,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_entries jsonb;
  v_my_rank jsonb;
  v_is_hidden boolean := false;
  v_metric_col text;
  v_order_clause text;
BEGIN
  -- Determinar coluna e ordenação
  IF p_type = 'rating' THEN
    v_metric_col := 'puzzle_rating';
    v_order_clause := 'puzzle_rating DESC';
  ELSIF p_type = 'rush_3min' THEN
    v_metric_col := 'rush_3min_record';
    v_order_clause := 'rush_3min_record DESC';
  ELSIF p_type = 'rush_5min' THEN
    v_metric_col := 'rush_5min_record';
    v_order_clause := 'rush_5min_record DESC';
  ELSIF p_type = 'level' THEN
    v_metric_col := 'level';
    v_order_clause := 'level DESC, xp DESC';
  ELSE
    RETURN jsonb_build_object('entries', '[]'::jsonb, 'my_rank', null, 'is_hidden', false);
  END IF;

  -- Verificar se o caller está oculto
  IF v_user_id IS NOT NULL THEN
    SELECT NOT COALESCE(ranking_visible, true) INTO v_is_hidden
    FROM public.user_public_profiles
    WHERE user_id = v_user_id;
    -- Se não encontrado, manter false
    v_is_hidden := COALESCE(v_is_hidden, false);
  END IF;

  -- Buscar top N (usando SQL dinâmico para ORDER BY variável)
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(ranked)), ''[]''::jsonb)
     FROM (
       SELECT
         user_id,
         public.mask_display_name(display_name) AS public_name,
         avatar_skin,
         avatar_hair,
         avatar_hair_color,
         level,
         %I AS metric_value,
         title,
         ROW_NUMBER() OVER (ORDER BY %s) AS position
       FROM public.user_public_profiles
       WHERE ranking_visible = true
       ORDER BY %s
       LIMIT %L
     ) ranked',
    v_metric_col, v_order_clause, v_order_clause, p_limit
  ) INTO v_entries;

  -- Buscar posição do caller (se visível)
  IF v_user_id IS NOT NULL AND NOT v_is_hidden THEN
    EXECUTE format(
      'SELECT row_to_json(me) FROM (
         SELECT
           user_id,
           public.mask_display_name(display_name) AS public_name,
           avatar_skin,
           avatar_hair,
           avatar_hair_color,
           level,
           %I AS metric_value,
           title,
           position
         FROM (
           SELECT *,
             ROW_NUMBER() OVER (ORDER BY %s) AS position
           FROM public.user_public_profiles
           WHERE ranking_visible = true
         ) ranked
         WHERE user_id = %L
       ) me',
      v_metric_col, v_order_clause, v_user_id
    ) INTO v_my_rank;
  END IF;

  RETURN jsonb_build_object(
    'entries', v_entries,
    'my_rank', v_my_rank,
    'is_hidden', v_is_hidden
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- 2. get_class_ranking — o ranking de turma
-- ---------------------------------------------------------------------------
-- Corpo de 20260316190000_ranking_teacher_badge.sql, extraído do banco vivo. A
-- autorização estrita e a ausência do filtro de `ranking_visible` (D1) ficam
-- exatamente como estavam.

CREATE OR REPLACE FUNCTION public.get_class_ranking(
  p_class_id bigint,
  p_type text DEFAULT 'rating'::text,
  p_limit integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_metric_col text;
  v_order_clause text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Autorização estrita: membro da turma OU professor DAQUELA turma
  IF NOT EXISTS(
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND user_id = v_user_id
  ) AND NOT EXISTS(
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar ranking desta turma';
  END IF;

  -- Determinar coluna e ordenação
  IF p_type = 'rating' THEN
    v_metric_col := 'puzzle_rating';
    v_order_clause := 'puzzle_rating DESC';
  ELSIF p_type = 'rush_3min' THEN
    v_metric_col := 'rush_3min_record';
    v_order_clause := 'rush_3min_record DESC';
  ELSIF p_type = 'rush_5min' THEN
    v_metric_col := 'rush_5min_record';
    v_order_clause := 'rush_5min_record DESC';
  ELSIF p_type = 'level' THEN
    v_metric_col := 'level';
    v_order_clause := 'level DESC, xp DESC';
  ELSE
    RETURN '[]'::jsonb;
  END IF;

  -- JOIN class_members + professor com user_public_profiles
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(ranked)), ''[]''::jsonb)
     FROM (
       SELECT
         upp.user_id,
         public.mask_display_name(upp.display_name) AS public_name,
         upp.avatar_skin,
         upp.avatar_hair,
         upp.avatar_hair_color,
         upp.level,
         upp.%I AS metric_value,
         upp.title,
         all_members.is_teacher,
         ROW_NUMBER() OVER (ORDER BY upp.%s) AS position
       FROM (
         -- Alunos
         SELECT user_id, false AS is_teacher FROM public.class_members WHERE class_id = %L
         UNION ALL
         -- Professor
         SELECT teacher_id, true AS is_teacher FROM public.classes WHERE id = %L
       ) all_members
       JOIN public.user_public_profiles upp ON upp.user_id = all_members.user_id
       ORDER BY upp.%s
       LIMIT %L
     ) ranked',
    v_metric_col, v_order_clause, p_class_id, p_class_id, v_order_clause, p_limit
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. get_ranking — a legada, trocada para o campo morto ficar sem leitora
-- ---------------------------------------------------------------------------
-- Zero chamadas em `src/` (medido por grep em 2026-08-11: só `get_ranking_with_position`
-- aparece). Ela continua existindo porque o `verify:perfil-publico` a CHAMA como
-- prova de que ninguém lê da matview uma coluna que a matview não tem.

CREATE OR REPLACE FUNCTION public.get_ranking(
  p_type text DEFAULT 'rating'::text,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF p_type = 'rating' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             level, puzzle_rating, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY puzzle_rating DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_3min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             level, rush_3min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_3min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_5min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             level, rush_5min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_5min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'level' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             level, xp, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY level DESC, xp DESC
      LIMIT p_limit
    ) r;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. get_class_feed — nova, e é o único caminho do mural até a identidade
-- ---------------------------------------------------------------------------
-- Molde: a autorização é a de `get_class_ranking`, linha por linha. O que muda é a
-- fonte (class_feed JOIN users) e o que sai.
--
-- `display_name` vai **cru**, e isso é o comportamento de hoje, não uma decisão
-- nova: `emit_class_feed` grava o nome dentro de `event_data` desde
-- 20260316140000_fix_mural_display_name.sql, e o mural o mostra sem máscara. A
-- diferença é que aqui ele vem de `users` e portanto está **fresco** — o de
-- `event_data` é um retrato do dia do evento e não acompanha troca de nome.
--
-- `event_data` continua indo inteiro: o cliente lê `bot_name`, `new_level`,
-- `rating`, `title`, `streak`, `score`, `mode` e `achievement_key` de lá
-- (src/app/(main)/turmas/[id]/mural/MuralClient.tsx:22-44).

CREATE OR REPLACE FUNCTION public.get_class_feed(
  p_class_id bigint,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Autorização estrita: membro da turma OU professor DAQUELA turma.
  -- É a mesma de get_class_ranking, e tem de ser: SECURITY DEFINER passa por cima
  -- da RLS de class_feed e de users, então a checagem aqui é a única que resta.
  IF NOT EXISTS(
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND user_id = v_user_id
  ) AND NOT EXISTS(
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar o mural desta turma';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(f)), '[]'::jsonb) INTO v_result
  FROM (
    SELECT
      cf.id,
      cf.class_id,
      cf.user_id,
      cf.event_type,
      cf.event_data,
      cf.created_at,
      u.display_name,
      u.avatar_skin,
      u.avatar_hair,
      u.avatar_hair_color
    FROM public.class_feed cf
    JOIN public.users u ON u.id = cf.user_id
    WHERE cf.class_id = p_class_id
    ORDER BY cf.created_at DESC
    LIMIT p_limit
  ) f;

  RETURN v_result;
END;
$function$;

-- O REVOKE/GRANT no molde de 20260725120000_security_search_path_revokes.sql:77-84.
--
-- **`FROM PUBLIC` sozinho NÃO basta, e isto foi medido**, não deduzido: o ensaio a
-- seco desta migration (aplicada dentro de uma transação, gate rodado na mesma
-- transação, ROLLBACK) reprovou com *"anon EXECUTA get_class_feed"* depois de um
-- `REVOKE ALL ... FROM PUBLIC`. O motivo é que o ALTER DEFAULT PRIVILEGES do schema
-- `public` no Supabase concede EXECUTE a `anon` e `authenticated` **nominalmente** —
-- e revogar de PUBLIC não toca em concessão nominal. É o mesmo descuido que a
-- migration 20260806150000 pegou na matview, na forma de função.
--
-- `anon` não deve chegar aqui nem para levar 'Não autenticado': a função é SECURITY
-- DEFINER e passa por cima da RLS de `class_feed` E da de `users`.
REVOKE EXECUTE ON FUNCTION public.get_class_feed(p_class_id bigint, p_limit integer)
  FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_feed(p_class_id bigint, p_limit integer)
  TO authenticated;

COMMENT ON FUNCTION public.get_class_feed(bigint, integer) IS
  'Mural da turma com a identidade do avatar kokeshi. SECURITY DEFINER com a mesma '
  'checagem de pertencimento de get_class_ranking. Junta users (fresco), não a '
  'matview (cache) — Bloco 6, 2026-08-11.';
