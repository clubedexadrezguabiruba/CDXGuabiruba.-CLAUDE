-- =============================================================================
-- O SLOT ÓCULOS CHEGA ÀS LEITURAS — a matview e as cinco funções que a leem
-- =============================================================================
--
-- A migration anterior (20260827160000) abriu o slot e o tornou EQUIPÁVEL: o CHECK,
-- a coluna users.avatar_oculos e o equipar_peca nos três lugares. O aluno já
-- consegue vestir — e ninguém, além dele, consegue VER.
--
-- Quatro telas leem o avatar de OUTRA pessoa, e todas param na matview
-- user_public_profiles: ranking geral, ranking de turma, mural de turma e perfil
-- público. Sem esta migration o óculos aparece só onde se lê a tabela users direto
-- (o layout e o /perfil do próprio aluno) — a peça existiria e sumiria ao ser vista
-- por outro, que é pior que não existir.
--
-- POR QUE A MATVIEW É DERRUBADA E NÃO ALTERADA
-- ---------------------------------------------
-- ALTER MATERIALIZED VIEW não acrescenta coluna. É DROP + CREATE, e com eles vêm os
-- seis índices — que não são enfeite: refresh_public_profiles() faz
-- REFRESH ... CONCURRENTLY, e o CONCURRENTLY EXIGE um índice único. Sem o
-- idx_public_profiles_user de volta, o refresh quebra na primeira peça equipada, e
-- só ali.
--
-- (!) GRANTS: não há o que restaurar, e isso foi CONFERIDO, não presumido.
-- information_schema.role_table_grants devolve ZERO linhas para esta matview: ela é
-- do postgres e o acesso acontece só por funções SECURITY DEFINER. Se houvesse grant
-- e eu não o recriasse, o ranking voltaria vazio para authenticated com todos os
-- testes verdes.
--
-- (!) As funções NÃO caem junto. Elas são LANGUAGE plpgsql com corpo em string, e o
-- Postgres não registra dependência de corpo de função para objeto — o DROP da
-- matview não as leva. Elas são reescritas abaixo porque precisam DEVOLVER a coluna
-- nova, não porque o DROP as tenha quebrado.
--
-- AS CINCO FUNÇÕES SÃO CÓPIA DA DEFINIÇÃO VIGENTE, COM UMA REGRA SÓ
-- ------------------------------------------------------------------
-- Elas foram lidas do banco por pg_get_functiondef e transformadas por uma regra
-- declarável: toda linha cujo conteúdo é <prefixo>avatar_rosto, ganha uma gêmea logo
-- abaixo com oculos no lugar de rosto — mesma indentação, mesmo prefixo. São 10
-- linhas em 5 funções (1 + 1 + 2 + 4 + 2), e o número bate com as 10 ocorrências que
-- o banco reportou.
--
-- Reescrevê-las à mão seria reconstruir de memória 300 linhas que o banco já tem
-- exatas, e é assim que uma validação some sem ninguém notar. Na migration anterior
-- essa mesma régua pegou três linhas do equipar_peca que teriam se perdido.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda em
-- transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. A matview, com a coluna nova
-- ---------------------------------------------------------------------------
--
-- O corpo é o vigente (pg_get_viewdef) com u.avatar_oculos ao lado de
-- u.avatar_rosto. Nada mais muda: mesmos JOINs, mesmo WHERE, mesma ordem.
DROP MATERIALIZED VIEW public.user_public_profiles;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
 SELECT u.id AS user_id,
    u.display_name,
    u.avatar_skin,
    u.avatar_cabelo,
    u.avatar_hair_color,
    u.avatar_traje,
    u.avatar_chapeu,
    u.avatar_rosto,
    u.avatar_oculos,
    u.avatar_pet,
    u.level,
    u.xp,
    u.puzzle_rating,
    u.rush_3min_record,
    u.rush_5min_record,
    u.rush_resistencia_record,
    u.ranking_visible,
    COALESCE(ut.current_title, 'Aprendiz'::text) AS title,
    COALESCE(ut.achieved_tier, 0) AS achieved_tier,
    COALESCE(us.current_streak, 0) AS current_streak,
    u.created_at AS member_since
   FROM users u
     LEFT JOIN user_titles ut ON ut.user_id = u.id
     LEFT JOIN user_streaks us ON us.user_id = u.id
  WHERE u.role = ANY (ARRAY['aluno'::text, 'professor'::text]);


-- ---------------------------------------------------------------------------
-- 2. Os seis índices — e o ÚNICO não é opcional
-- ---------------------------------------------------------------------------
--
-- idx_public_profiles_user é UNIQUE porque REFRESH MATERIALIZED VIEW CONCURRENTLY o
-- exige. Os outros cinco são os da ordenação de cada ranking.
CREATE UNIQUE INDEX idx_public_profiles_user ON public.user_public_profiles USING btree (user_id);
CREATE INDEX idx_public_profiles_rating ON public.user_public_profiles USING btree (puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level ON public.user_public_profiles USING btree (level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3 ON public.user_public_profiles USING btree (rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5 ON public.user_public_profiles USING btree (rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia ON public.user_public_profiles USING btree (rush_resistencia_record DESC);


-- ---------------------------------------------------------------------------
-- 3. As cinco funções de leitura
-- ---------------------------------------------------------------------------

-- -------------------------------------------------------------------------
-- get_class_feed — 1 linha(s) acrescentada(s)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_class_feed(p_class_id bigint, p_limit integer DEFAULT 50)
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
      u.avatar_cabelo,
      u.avatar_hair_color,
      u.avatar_chapeu,
      u.avatar_rosto,
      u.avatar_oculos,
      COALESCE(ut.achieved_tier, 0) AS achieved_tier
    FROM public.class_feed cf
    JOIN public.users u ON u.id = cf.user_id
    LEFT JOIN public.user_titles ut ON ut.user_id = cf.user_id
    WHERE cf.class_id = p_class_id
    ORDER BY cf.created_at DESC
    LIMIT p_limit
  ) f;

  RETURN v_result;
END;
$function$
;


-- -------------------------------------------------------------------------
-- get_class_ranking — 1 linha(s) acrescentada(s)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_class_ranking(p_class_id bigint, p_type text DEFAULT 'rating'::text, p_limit integer DEFAULT 30)
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
         upp.avatar_cabelo,
         upp.avatar_hair_color,
         upp.avatar_chapeu,
         upp.avatar_rosto,
         upp.avatar_oculos,
         upp.level,
         upp.%I AS metric_value,
         upp.title,
         upp.achieved_tier,
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
$function$
;


-- -------------------------------------------------------------------------
-- get_public_profile — 2 linha(s) acrescentada(s)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_profile record;
  v_bots_defeated integer;
  v_lessons_completed integer;
  v_achievements_count integer;
  v_achievements jsonb;
BEGIN
  SELECT
    public.mask_display_name(display_name) AS public_name,
    avatar_skin,
    avatar_cabelo,
    avatar_hair_color,
    avatar_traje,
    avatar_chapeu,
    avatar_rosto,
    avatar_oculos,
    avatar_pet,
    level,
    xp,
    puzzle_rating,
    rush_3min_record,
    rush_5min_record,
    rush_resistencia_record,
    title,
    achieved_tier,
    current_streak,
    member_since
  INTO v_profile
  FROM public.user_public_profiles
  WHERE user_id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(DISTINCT bot_id) INTO v_bots_defeated
  FROM public.user_bot_results
  WHERE user_id = p_user_id AND result = 'win';

  SELECT COUNT(*) INTO v_lessons_completed
  FROM public.user_lesson_progress
  WHERE user_id = p_user_id AND completed = true;

  SELECT COUNT(*) INTO v_achievements_count
  FROM public.user_achievements
  WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'key', a.key,
      'title', a.title,
      'icon', a.icon,
      'description', a.description,
      'unlocked_at', ua.unlocked_at
    ) ORDER BY ua.unlocked_at DESC
  ), '[]'::jsonb) INTO v_achievements
  FROM public.user_achievements ua
  JOIN public.achievements a ON a.id = ua.achievement_id
  WHERE ua.user_id = p_user_id
    AND NOT COALESCE(a.hidden, false);

  RETURN jsonb_build_object(
    'public_name', v_profile.public_name,
    'avatar_skin', v_profile.avatar_skin,
    'avatar_cabelo', v_profile.avatar_cabelo,
    'avatar_hair_color', v_profile.avatar_hair_color,
    'avatar_traje', v_profile.avatar_traje,
    'avatar_chapeu', v_profile.avatar_chapeu,
    'avatar_rosto', v_profile.avatar_rosto,
    'avatar_oculos', v_profile.avatar_oculos,
    'avatar_pet', v_profile.avatar_pet,
    'level', v_profile.level,
    'xp', v_profile.xp,
    'puzzle_rating', v_profile.puzzle_rating,
    'rush_3min_record', v_profile.rush_3min_record,
    'rush_5min_record', v_profile.rush_5min_record,
    'rush_resistencia_record', v_profile.rush_resistencia_record,
    'title', v_profile.title,
    'achieved_tier', v_profile.achieved_tier,
    'current_streak', v_profile.current_streak,
    'member_since', v_profile.member_since,
    'bots_defeated', v_bots_defeated,
    'lessons_completed', v_lessons_completed,
    'achievements_count', v_achievements_count,
    'achievements', v_achievements
  );
END;
$function$
;


-- -------------------------------------------------------------------------
-- get_ranking — 4 linha(s) acrescentada(s)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ranking(p_type text DEFAULT 'rating'::text, p_limit integer DEFAULT 50)
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
      SELECT user_id, display_name, avatar_skin, avatar_cabelo, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             avatar_oculos,
             level, puzzle_rating, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY puzzle_rating DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_3min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_cabelo, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             avatar_oculos,
             level, rush_3min_record, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_3min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_5min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_cabelo, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             avatar_oculos,
             level, rush_5min_record, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_5min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'level' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_cabelo, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             avatar_oculos,
             level, xp, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY level DESC, xp DESC
      LIMIT p_limit
    ) r;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$
;


-- -------------------------------------------------------------------------
-- get_ranking_with_position — 2 linha(s) acrescentada(s)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ranking_with_position(p_type text DEFAULT 'rating'::text, p_limit integer DEFAULT 50)
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
         avatar_cabelo,
         avatar_hair_color,
         avatar_chapeu,
         avatar_rosto,
         avatar_oculos,
         level,
         %I AS metric_value,
         title,
         achieved_tier,
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
           avatar_cabelo,
           avatar_hair_color,
           avatar_chapeu,
           avatar_rosto,
           avatar_oculos,
           level,
           %I AS metric_value,
           title,
           achieved_tier,
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
$function$
;

-- ---------------------------------------------------------------------------
-- 4. As asserções
-- ---------------------------------------------------------------------------
--
-- Nenhuma delas conta o que esta migration acabou de escrever: elas perguntam ao
-- catálogo do Postgres e ao CONTEÚDO da matview, que são outros lugares.
DO $$
DECLARE
  v_n     integer;
  v_idx   integer;
  v_fn    text;
  v_nome  text;
BEGIN
  -- 4.1 a matview tem a coluna nova, e continua tendo as antigas
  --
  -- ⚠️ A COLUNA SAI DE `pg_attribute`, E ISSO CUSTOU UMA TENTATIVA.
  -- A primeira versão perguntava a `information_schema.columns`, que **não enxerga
  -- matview**: o padrão SQL cobre tabelas e views comuns, e matview é extensão do
  -- Postgres (`pg_class.relkind = 'm'`). A asserção devolvia 0 de 8 sobre uma
  -- matview recém-criada e correta, e derrubava a migration inteira.
  --
  -- O erro foi para o lado seguro — a transação implícita desfez tudo e a matview
  -- vigente ficou intacta, conferido depois: 20 colunas, 6 índices, 19 linhas. Mas o
  -- modo de falha é o que interessa: **régua quebrada acusa o alvo errado**, e a
  -- mensagem dizia "o DROP levou alguma junto", que é a coisa que ela existe para
  -- pegar e a única que não estava acontecendo.
  --
  -- `pg_indexes` (4.2) NÃO tem esse problema — ele é construído sobre `pg_class` e
  -- enxerga índice de matview. Foi conferido, não presumido.
  SELECT count(*) INTO v_n
  FROM pg_attribute
  WHERE attrelid = 'public.user_public_profiles'::regclass
    AND attnum > 0 AND NOT attisdropped
    AND attname IN ('avatar_oculos','avatar_rosto','avatar_chapeu','avatar_traje',
                    'avatar_cabelo','avatar_pet','avatar_skin','avatar_hair_color');
  IF v_n <> 8 THEN
    RAISE EXCEPTION 'a matview tem % das 8 colunas de avatar — o DROP levou alguma junto', v_n;
  END IF;

  -- 4.2 os SEIS índices voltaram, e um deles é UNIQUE
  SELECT count(*) INTO v_idx FROM pg_indexes
  WHERE schemaname='public' AND tablename='user_public_profiles';
  IF v_idx <> 6 THEN
    RAISE EXCEPTION 'a matview tem % índices e deveria ter 6', v_idx;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'idx_public_profiles_user' AND i.indisunique
  ) THEN
    RAISE EXCEPTION
      'idx_public_profiles_user não é UNIQUE: REFRESH CONCURRENTLY quebraria na '
      'primeira peça equipada, e o erro só apareceria ali';
  END IF;

  -- 4.3 as CINCO funções devolvem a coluna nova E não perderam a antiga
  FOREACH v_nome IN ARRAY ARRAY['get_class_feed','get_class_ranking','get_public_profile',
                                'get_ranking','get_ranking_with_position'] LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_fn
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname = v_nome;

    IF v_fn IS NULL THEN
      RAISE EXCEPTION 'a função % sumiu', v_nome;
    END IF;
    IF v_fn NOT LIKE '%avatar_oculos%' THEN
      RAISE EXCEPTION 'a função % não devolve avatar_oculos', v_nome;
    END IF;
    IF v_fn NOT LIKE '%avatar_rosto%' THEN
      RAISE EXCEPTION 'a função % perdeu avatar_rosto — a barba sumiria do ranking', v_nome;
    END IF;
  END LOOP;

  -- 4.4 o refresh funciona DE VERDADE, não em tese. É o único jeito de provar o
  -- índice único agora, em vez de descobrir na primeira peça equipada em produção.
  PERFORM public.refresh_public_profiles();

  SELECT count(*) INTO v_n FROM public.user_public_profiles;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'a matview refrescou VAZIA — o CREATE perdeu o WHERE ou os JOINs';
  END IF;

  RAISE NOTICE 'leituras abertas ao slot oculos: matview com % linhas, 6 indices, 5 funcoes', v_n;
END $$;
