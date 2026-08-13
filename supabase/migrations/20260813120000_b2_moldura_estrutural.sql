-- ============================================================================
-- B2 — o banco estrutural da virada: a patente sai da roupa e vira MOLDURA
-- ============================================================================
--
-- ESTRUTURAL E SÓ. **Zero INSERTs.** Nenhuma peça entra no catálogo, nenhum aluno
-- muda de aparência, nenhuma régua de concessão se move. Esta migration só faz
-- duas coisas: tira uma trava que a decisão de produto revogou, e leva
-- `achieved_tier` até as telas que vão desenhar a moldura.
--
-- Ver docs/avatar/21-slots-do-avatar-plano.md §0 (a emenda de 2026-08-13).
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Cai o CHECK que proibia traje no baú
-- ---------------------------------------------------------------------------
--
-- `avatar_catalogo_traje_nao_e_de_bau` nasceu no Bloco 1 como a versão em banco
-- da trava nº 3 do doc 21 §1.3: *"uniforme nunca sai de baú — traje é mérito de
-- patente, e misturar as duas coisas apaga o mérito"*.
--
-- **A premissa caiu inteira.** O traje deixou de ser mérito de patente; o mérito
-- de patente agora é a moldura, que ninguém sorteia e ninguém escolhe. Sem o
-- vínculo não há mérito a apagar, e o CHECK passa a proibir exatamente o que a
-- economia nova exige: **39 dos 40 trajes saem de baú**, e o baú é a única porta.
--
-- Dropar é seguro no pixel: `avatar_catalogo` tem **0 linhas** hoje, então não há
-- dado que a constraint estivesse segurando.
--
-- O QUE **NÃO** CAI, e é de propósito: `avatar_catalogo_origem_coerente`. Ele já
-- garante que peça de baú tenha raridade e não tenha marco — que é a régua de que
-- o sorteio do B6 depende. Dropar os dois de uma vez seria afrouxar duas coisas
-- quando só uma foi decidida.

ALTER TABLE public.avatar_catalogo
  DROP CONSTRAINT IF EXISTS avatar_catalogo_traje_nao_e_de_bau;

-- ---------------------------------------------------------------------------
-- 2. A matview: entra `achieved_tier`, sai `avatar_config`
-- ---------------------------------------------------------------------------
--
-- Definição anterior: 20260811160000_bloco1_fundacao_dos_slots.sql:377.
--
-- **POR QUE `achieved_tier` E NÃO `title`.** A view já carrega `title`, que é o
-- NOME da patente ("Soldado", "Aspirante"). A moldura precisa do NÚMERO: ela mapeia
-- tier → cor por índice, contra `scripts/avatar/patentes.ts`. Derivar o número do
-- nome no cliente seria uma segunda tabela de patentes escrita em TypeScript, que é
-- exatamente a duplicação que `verify:paleta-patentes` existe para impedir.
--
-- **`COALESCE(..., 0)`, e o zero é significado, não conserto.** Aluno sem linha em
-- `user_titles` é Aprendiz — o tier 0 é um degrau real da escada, não ausência de
-- dado. É a mesma decisão que o `COALESCE(ut.current_title, 'Aprendiz')` da linha
-- de cima já tomou para o nome, e as duas têm de concordar.
--
-- **`avatar_config` SAI.** O Bloco 6 tirou as leitoras da coluna; a view a
-- carregava só porque nenhuma migration a tinha recriado desde então — está escrito
-- no próprio COMMENT dela: *"sai na próxima migration que recriar a view"*. Esta é
-- essa migration. Medido antes de tirar: **nenhuma função de `public` cita
-- `avatar_config` no corpo**, e a conferência 6 do `verify:perfil-publico` se
-- aposenta sozinha quando isso acontece (`verify-perfil-publico.ts:84-91`).
-- `avatar_base` FICA — ele ainda é lido por `useUser`.
--
-- O DROP é SEM CASCADE de propósito, como no E.3 e no Bloco 1: CASCADE apaga em
-- silêncio o que apareceu depois da medição; o DROP simples ERRA, e erro é o que se
-- quer de uma surpresa.

DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_skin,
  u.avatar_hair,
  u.avatar_hair_color,
  u.avatar_traje,
  u.avatar_chapeu,
  u.avatar_rosto,
  u.avatar_fundo,
  u.avatar_pet,
  u.level,
  u.xp,
  u.puzzle_rating,
  u.rush_3min_record,
  u.rush_5min_record,
  u.rush_resistencia_record,
  u.ranking_visible,
  COALESCE(ut.current_title, 'Aprendiz') AS title,
  COALESCE(ut.achieved_tier, 0) AS achieved_tier,
  COALESCE(us.current_streak, 0) AS current_streak,
  u.created_at AS member_since
FROM public.users u
LEFT JOIN public.user_titles ut ON ut.user_id = u.id
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE u.role IN ('aluno', 'professor');

-- Os seis índices, idênticos. O UNIQUE em user_id NÃO é enfeite: sem ele o
-- REFRESH MATERIALIZED VIEW CONCURRENTLY recusa, e quem chama o refresh é
-- grant_xp a cada subida de nível — perdê-lo quebraria todo level-up do produto.
CREATE UNIQUE INDEX idx_public_profiles_user ON public.user_public_profiles(user_id);
CREATE INDEX idx_public_profiles_rating ON public.user_public_profiles(puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level ON public.user_public_profiles(level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3 ON public.user_public_profiles(rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5 ON public.user_public_profiles(rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia ON public.user_public_profiles(rush_resistencia_record DESC);

-- O REVOKE que o CREATE desfez. Matview não aceita RLS: o privilégio é a única
-- defesa, e o que sai por ali é display_name CRU e a coluna ranking_visible.
REVOKE ALL ON public.user_public_profiles FROM anon, authenticated, PUBLIC;

COMMENT ON MATERIALIZED VIEW public.user_public_profiles IS
  'Cache de perfil público. NÃO é legível por anon/authenticated: matview não '
  'aceita RLS, então o privilégio é a única defesa. Todo acesso passa por RPC '
  'SECURITY DEFINER, que aplica mask_display_name e o filtro de ranking_visible. '
  'Recriou a view? Repita o REVOKE — o privilégio default do Supabase volta. '
  'Carrega as 5 colunas de equipar (Bloco 1 dos slots), a identidade kokeshi do '
  'E.3 e, desde o B2 da moldura (2026-08-13), achieved_tier — o NÚMERO da patente, '
  'que é o que a <MolduraPatente> mapeia para cor. avatar_config saiu nesta mesma '
  'migration: nenhuma função de public a citava mais.';

-- ---------------------------------------------------------------------------
-- 3. get_public_profile — a moldura da tela grande
-- ---------------------------------------------------------------------------
-- Corpo de 20260811160000:437, com UMA mudança: `achieved_tier` entra no SELECT e
-- no jsonb_build_object. Nada mais se move.
--
-- É `/perfil/[userId]`, e a moldura ali é a maior do produto: o avatar tem 104 px.

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
    avatar_hair,
    avatar_hair_color,
    avatar_traje,
    avatar_chapeu,
    avatar_rosto,
    avatar_fundo,
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
    'avatar_hair', v_profile.avatar_hair,
    'avatar_hair_color', v_profile.avatar_hair_color,
    'avatar_traje', v_profile.avatar_traje,
    'avatar_chapeu', v_profile.avatar_chapeu,
    'avatar_rosto', v_profile.avatar_rosto,
    'avatar_fundo', v_profile.avatar_fundo,
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
$function$;

COMMENT ON FUNCTION public.get_public_profile(uuid) IS
  'Perfil público de um aluno, para /perfil/[userId]. Devolve a identidade do '
  'avatar kokeshi como ÍNDICE + SLUG, os 5 slugs de equipar (traje, chapeu, rosto, '
  'fundo, pet) e, desde o B2 da moldura (2026-08-13), achieved_tier — o número da '
  'patente, que é o que a moldura em volta do avatar lê. NULL em qualquer slug = '
  'sem a peça. Vigiada por npm run verify:perfil-publico.';

-- ---------------------------------------------------------------------------
-- 4. As 3 RPCs de ranking — a moldura nas listas
-- ---------------------------------------------------------------------------
--
-- São TRÊS lendo a mesma matview, e trocar duas esquecendo a terceira é a
-- divergência silenciosa que o cabeçalho de `verify-no-duplicate-rpc.ts` documenta
-- ter custado quatro meses de curva de XP errada. `verify:identidade-nas-listas`
-- passa a cobrar `achieved_tier` das três, CHAMADAS de verdade.
--
-- Corpo das três extraído de 20260811160000. Única linha alterada em cada: a
-- coluna nova entra ao lado de `title`. Nada de ordenação, autorização, máscara de
-- nome ou tratamento de p_type desconhecido se move.
--
-- **Por que `achieved_tier` vai à lista quando `avatar_traje` não foi.** O critério
-- do Bloco 1 era o recorte: a lista mostra a CABEÇA, então traje não muda um pixel
-- ali. A moldura é o contrário — ela é desenhada **em volta** do recorte, em CSS,
-- fora do SVG. Ela existe justamente onde o boneco é pequeno.

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
         avatar_chapeu,
         avatar_rosto,
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
           avatar_hair,
           avatar_hair_color,
           avatar_chapeu,
           avatar_rosto,
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
$function$;

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
         upp.avatar_chapeu,
         upp.avatar_rosto,
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
$function$;

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
             avatar_chapeu, avatar_rosto,
             level, puzzle_rating, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY puzzle_rating DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_3min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             level, rush_3min_record, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_3min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_5min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             level, rush_5min_record, title, achieved_tier
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_5min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'level' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             level, xp, title, achieved_tier
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
-- 5. get_class_feed — o mural também é call site da moldura
-- ---------------------------------------------------------------------------
--
-- **Esta é a quarta função, e o plano só previa três.** A decisão de incluí-la é
-- técnica, tomada na execução, e o motivo é evitar uma segunda migration: o mural
-- é um dos 8 call sites da `<MolduraPatente>` (doc 21 §0.6, bloco B3), e sem
-- `achieved_tier` ele seria o único avatar do produto sem moldura — uma inconsistência
-- visível que custaria outra migration para consertar uma semana depois.
--
-- **Ela não lê da matview**, e isso não muda: o mural lê `users` FRESCO, pela decisão
-- de 20260811140000:50-62. Então o tier vem de um LEFT JOIN em `user_titles`, com o
-- mesmo `COALESCE(..., 0)` da view — as duas fontes têm de concordar sobre o que é
-- um aluno sem linha de título, e as duas dizem "Aprendiz, tier 0".

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
      u.avatar_hair_color,
      u.avatar_chapeu,
      u.avatar_rosto,
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
$function$;

-- O REVOKE/GRANT repetido porque CREATE OR REPLACE não mexe em privilégio, mas
-- repetir é barato e a ausência custou uma reprovação medida no Bloco 6:
-- `FROM PUBLIC` sozinho não basta, porque o ALTER DEFAULT PRIVILEGES do schema
-- public concede EXECUTE a anon e authenticated NOMINALMENTE.
REVOKE EXECUTE ON FUNCTION public.get_class_feed(p_class_id bigint, p_limit integer)
  FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_feed(p_class_id bigint, p_limit integer)
  TO authenticated;

COMMENT ON FUNCTION public.get_class_feed(bigint, integer) IS
  'Mural da turma com a identidade do avatar kokeshi, chapéu e rosto (Bloco 1 dos '
  'slots) e achieved_tier (B2 da moldura, 2026-08-13). Junta users (fresco), não a '
  'matview (cache), então o tier vem de LEFT JOIN em user_titles com o mesmo '
  'COALESCE(..., 0) da view. SECURITY DEFINER com a mesma checagem de pertencimento '
  'de get_class_ranking.';
