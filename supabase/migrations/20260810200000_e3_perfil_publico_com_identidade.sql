-- ============================================================================
-- E.3 da troca de pilha — o perfil público passa a carregar a identidade nova.
-- ============================================================================
--
-- Fecha as DUAS pendências que o Bloco C registrou e deixou de propósito para o
-- Bloco E (docs/avatar/20-troca-de-pilha-plano.md, Bloco C):
--
--   1. `user_public_profiles` não carregava avatar_skin/avatar_hair/
--      avatar_hair_color, e `get_public_profile` portanto não tinha o que servir.
--   2. `update_avatar_identity` não chamava `refresh_public_profiles()` — trocar
--      de cabelo mudava `users` e NÃO mudava o cache que o perfil público lê.
--
-- A terceira pendência do Bloco C — o `UPDATE avatar_chosen` de quem escolheu o
-- avatar v2 — **não está aqui**. Ela é migration própria
-- (20260810220000_f2_avatar_chosen_zerado.sql), aplicada só no F.2, junto do
-- push: zerada antes da tela, o dashboard manda o aluno para uma
-- `/criar-personagem` que ainda é a v2. Um assunto, uma migration.
--
-- ============================================================================
-- O QUE FOI MEDIDO NO BANCO VIVO ANTES DE ESCREVER (2026-08-10)
-- ============================================================================
--
-- Porque plpgsql NÃO valida corpo contra esquema — é a lição 2 do Bloco B, que
-- custou uma falha: duas funções citavam colunas que iam sumir e só quebrariam
-- em runtime, na hora de uma criança abrir um baú.
--
-- Varredura de `pg_get_functiondef` — quem depende da matview e das colunas:
--
--   get_class_ranking(bigint,text,integer)        → view + avatar_config
--   get_public_profile(uuid)                      → view + avatar_config + avatar_base
--   get_ranking(text,integer)                     → view + avatar_config
--   get_ranking_with_position(text,integer)       → view + avatar_config
--   recompute_user_title(uuid)                    → view
--   refresh_public_profiles()                     → view
--
-- **É por isso que `avatar_config` FICA na view e `avatar_base` SAI.** A conta é
-- por coluna, não por época:
--
--   avatar_config  4 leitoras — get_ranking, get_ranking_with_position,
--                  get_class_ranking e o próprio get_public_profile. As três
--                  primeiras são o caminho quente dos dois rankings e do
--                  dashboard. Tirá-la obrigaria a recolar o corpo de três RPCs de
--                  ranking dentro deste bloco — que é exatamente o movimento pelo
--                  qual a curva de XP deste projeto foi revertida em silêncio por
--                  4 meses. Ela sai quando essas três forem reescritas para
--                  SERVIR o avatar novo, que é o D30 / Bloco 6 do doc 15,
--                  explicitamente fora do Bloco E (doc 20, §5). Custo de ficar:
--                  zero — é `'{}'` em 100% dos usuários desde o Bloco B.
--
--   avatar_base    1 leitora, e é a que esta migration reescreve. Depois da seção
--                  2 abaixo, NINGUÉM lê `user_public_profiles.avatar_base` —
--                  medido, não presumido. A coluna `users.avatar_base` continua
--                  (deprecada, escrita pela update_avatar_base que a
--                  /criar-personagem v2 chama até o E.4); o que sai é a cópia dela
--                  no cache, que ficaria sendo varrida a cada refresh sem ter
--                  destino. É a seção 6 do gate que mede isto, e ela se aposenta
--                  sozinha: coluna legada só é exigida na view enquanto alguma
--                  função a citar.
--
-- O que SAI do que `get_public_profile` DEVOLVE são os três campos da v2 — ali não
-- há leitor nenhum (medido por grep em `src/`: `PublicProfileData` os declara e
-- `PublicProfileClient` não toca em nenhum).
--
-- Views/matviews dependentes da matview: **nenhuma**. Por isso o DROP abaixo é
-- SEM CASCADE, ao contrário do de 20260321100000_avatar_base.sql:14. CASCADE
-- apaga em silêncio o que apareceu depois da medição; o DROP simples ERRA, e erro
-- é o que se quer de uma surpresa.
--
-- Privilégios efetivos da matview HOJE, medidos em `pg_class.relacl`:
--
--   postgres=arwdDxtm/postgres | service_role=arwdDxtm/postgres
--   has_table_privilege(anon, SELECT)          = false
--   has_table_privilege(authenticated, SELECT) = false
--
-- E o ALTER DEFAULT PRIVILEGES do schema `public` no Supabase concede TUDO a
-- anon, authenticated e service_role. Ou seja: a matview recriada **nasce
-- legível pelo navegador**, e o REVOKE tem de vir junto do CREATE. Está escrito
-- em 20260806150000_revogar_leitura_perfis_publicos.sql:47-50 como aviso a esta
-- migration, e é o que `npm run verify:privileges` (seção 4) reprova. Matview não
-- aceita RLS no Postgres — o privilégio é a única defesa, e o que sai por ali é
-- `display_name` CRU e a coluna `ranking_visible` (o opt-out do ranking).
--
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A matview, com as três colunas da identidade nova
-- ---------------------------------------------------------------------------
-- Definição anterior: 20260321100000_avatar_base.sql:16. Duas mudanças, e as duas
-- estão contadas no cabeçalho: entram as três colunas da identidade kokeshi, sai
-- `avatar_base` (zero leitoras depois da seção 2). `avatar_config` fica.

DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_config,
  u.avatar_skin,
  u.avatar_hair,
  u.avatar_hair_color,
  u.level,
  u.xp,
  u.puzzle_rating,
  u.rush_3min_record,
  u.rush_5min_record,
  u.rush_resistencia_record,
  u.ranking_visible,
  COALESCE(ut.current_title, 'Aprendiz') AS title,
  COALESCE(us.current_streak, 0) AS current_streak,
  u.created_at AS member_since
FROM public.users u
LEFT JOIN public.user_titles ut ON ut.user_id = u.id
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE u.role IN ('aluno', 'professor');

-- Os seis índices, idênticos aos de antes. O UNIQUE em user_id NÃO é enfeite:
-- sem ele `REFRESH MATERIALIZED VIEW CONCURRENTLY` recusa, e quem chama o refresh
-- é `grant_xp` a cada subida de nível — perder o índice quebraria todo level-up
-- do produto, não só o avatar.
CREATE UNIQUE INDEX idx_public_profiles_user ON public.user_public_profiles(user_id);
CREATE INDEX idx_public_profiles_rating ON public.user_public_profiles(puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level ON public.user_public_profiles(level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3 ON public.user_public_profiles(rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5 ON public.user_public_profiles(rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia ON public.user_public_profiles(rush_resistencia_record DESC);

-- O REVOKE que o CREATE desfez. Ver o cabeçalho: sem esta linha a matview volta
-- a ser legível por anon e authenticated, contornando mask_display_name e o
-- filtro de ranking_visible que só existem nas RPCs.
REVOKE ALL ON public.user_public_profiles FROM anon, authenticated, PUBLIC;

COMMENT ON MATERIALIZED VIEW public.user_public_profiles IS
  'Cache de perfil público. NÃO é legível por anon/authenticated: matview não '
  'aceita RLS, então o privilégio é a única defesa. Todo acesso passa por RPC '
  'SECURITY DEFINER, que aplica mask_display_name e o filtro de ranking_visible. '
  'Recriou a view? Repita o REVOKE — o privilégio default do Supabase volta. '
  'Vigiado por npm run verify:privileges (seção 4) e por verify:perfil-publico. '
  'Carrega avatar_skin/avatar_hair/avatar_hair_color desde o E.3 (2026-08-10), '
  'quando avatar_base saiu por não ter mais leitora. avatar_config segue aqui '
  'porque get_ranking, get_ranking_with_position e get_class_ranking a devolvem.';

-- ---------------------------------------------------------------------------
-- 2. get_public_profile — serve a identidade nova, para de servir a v2
-- ---------------------------------------------------------------------------
-- Corpo de 20260810140000_bloco_b_apagar_itens_do_avatar_v2.sql:178 (a versão
-- viva), com três trocas e nada mais:
--
--   sai   'avatar_config'   → era o cache dos itens equipados do avatar v2,
--                             '{}' em 100% dos usuários desde o Bloco B
--   sai   'avatar_base'     → era male/female; o kokeshi não tem base sexuada
--   sai   'equipped_items'  → '[]' fixo desde o Bloco B, sem leitor nenhum
--   entra 'avatar_skin', 'avatar_hair', 'avatar_hair_color'
--
-- POR QUE REMOVER AGORA É SEGURO, e por que no Bloco B não era: o Bloco B
-- manteve `equipped_items` no retorno porque o cliente publicado ainda o lia, e
-- o site só voltaria a bater com o banco no Bloco F. O F.1 aconteceu — a `main`
-- publicada é o Bloco D —, e nesse cliente `PublicProfileClient` não toca em
-- nenhum dos três (grep em `src/`: só o tipo `PublicProfileData` os declarava).
--
-- ÍNDICE, NÃO HEX: avatar_skin e avatar_hair_color viajam como número, que é o
-- que as colunas guardam e o que `<AvatarKokeshi>` recebe. A tradução para hex
-- acontece UMA vez, dentro do componente (E.1). Devolver hex daqui criaria a
-- segunda cópia da paleta que o Bloco C recusou.
--
-- avatar_hair vem NULL para a careca, e isso não é dado faltando: é a ausência de
-- peça, o estado default de toda conta.

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
    level,
    xp,
    puzzle_rating,
    rush_3min_record,
    rush_5min_record,
    rush_resistencia_record,
    title,
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
    'level', v_profile.level,
    'xp', v_profile.xp,
    'puzzle_rating', v_profile.puzzle_rating,
    'rush_3min_record', v_profile.rush_3min_record,
    'rush_5min_record', v_profile.rush_5min_record,
    'rush_resistencia_record', v_profile.rush_resistencia_record,
    'title', v_profile.title,
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
  'avatar kokeshi como ÍNDICE + SLUG (avatar_skin, avatar_hair, '
  'avatar_hair_color) desde o E.3 — a tradução para hex é do <AvatarKokeshi>. '
  'avatar_hair NULL = careca. Saíram no E.3: avatar_config, avatar_base e '
  'equipped_items, os três da pilha v2 e nenhum com leitor. Vigiada por '
  'npm run verify:perfil-publico.';

-- ---------------------------------------------------------------------------
-- 3. update_avatar_identity — agora refresca o cache que ela invalida
-- ---------------------------------------------------------------------------
-- O Bloco C deixou o `PERFORM` de fora com a justificativa escrita na própria
-- migration (20260810160000:169-173): a view não carregava as três colunas, e
-- refrescá-la custaria uma varredura inteira a cada troca de cabelo **sem mudar
-- um byte do que ela devolve**. A seção 1 acima acabou de mudar o byte. Sem esta
-- chamada, o aluno troca de cabelo, o seu próprio `/perfil` mostra o novo (lê
-- `users` direto) e o `/perfil/[userId]` que os colegas abrem mostra o antigo até
-- alguém subir de nível — divergência silenciosa entre duas telas do mesmo dado.
--
-- REFRESCA SEM CONDIÇÃO, mesmo quando nada mudou. É o que `update_avatar_base`
-- fazia (20260321100000:57) e o que `grant_xp` faz a cada level-up. Um `IF ROW
-- IS DISTINCT FROM` economizaria uma varredura por gravação redundante e
-- acrescentaria um estado a entender; o seletor do E.4 grava no confirmar, não a
-- cada clique.
--
-- `refresh_public_profiles()` tem EXECUTE revogado de anon/authenticated
-- (20260725120000:82) e isto continua valendo: esta função é SECURITY DEFINER, e
-- quem executa o PERFORM é o OWNER, não o aluno. É a mesma escada que a
-- `update_avatar_base` já subia.
--
-- O resto do corpo é IDÊNTICO ao do Bloco C — a validação de slug e de nível não
-- muda uma vírgula. Vem colado inteiro porque CREATE OR REPLACE substitui o
-- corpo todo, e `verify:cabelo-catalogo` mede as duas negações depois disto.

CREATE OR REPLACE FUNCTION public.update_avatar_identity(
  p_skin       integer,
  p_hair       text,
  p_hair_color integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_level     integer;
  v_min_level integer;
  v_row       public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  IF p_skin IS NULL OR p_hair_color IS NULL THEN
    RAISE EXCEPTION 'tom de pele e cor de cabelo são obrigatórios';
  END IF;

  SELECT level INTO v_level FROM public.users WHERE id = v_uid;

  IF v_level IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- p_hair NULL = careca. Não há o que validar: ausência de peça não tem nível
  -- mínimo, e é por isso que a careca não é linha do catálogo.
  IF p_hair IS NOT NULL THEN
    SELECT min_level INTO v_min_level
    FROM public.avatar_hair_catalog
    WHERE slug = p_hair;

    IF v_min_level IS NULL THEN
      RAISE EXCEPTION 'cabelo inexistente: %', p_hair;
    END IF;

    IF v_level < v_min_level THEN
      RAISE EXCEPTION 'o cabelo % exige nível %, e você está no nível %',
        p_hair, v_min_level, v_level;
    END IF;
  END IF;

  -- `WHERE id = v_uid` é o que substitui a policy: escreve na linha de quem
  -- chamou e em nenhuma outra. Não há parâmetro de user_id, de propósito.
  UPDATE public.users
  SET avatar_skin       = p_skin,
      avatar_hair       = p_hair,
      avatar_hair_color = p_hair_color,
      avatar_chosen     = true
  WHERE id = v_uid
  RETURNING * INTO v_row;

  -- E.3: o cache do perfil público carrega as três colunas desde agora. Sem
  -- este PERFORM, o /perfil/[userId] dos colegas serve o cabelo antigo.
  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object(
    'avatar_skin',       v_row.avatar_skin,
    'avatar_hair',       v_row.avatar_hair,
    'avatar_hair_color', v_row.avatar_hair_color
  );
END;
$$;

COMMENT ON FUNCTION public.update_avatar_identity(integer, text, integer) IS
  'Única via de escrita de avatar_skin/avatar_hair/avatar_hair_color. Valida o '
  'slug contra avatar_hair_catalog e o nível do aluno contra min_level — é a '
  'metade servidor da Regra Inviolável nº 1. p_hair NULL = careca. Escreve só na '
  'linha de auth.uid(); não recebe user_id. Chama refresh_public_profiles() '
  'desde o E.3, porque a matview passou a carregar as três colunas. Vigiada por '
  'verify:cabelo-catalogo (a negação) e verify:perfil-publico (o refresh).';

REVOKE ALL ON FUNCTION public.update_avatar_identity(integer, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_avatar_identity(integer, text, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. O que continua deprecado, e a correção de um comentário do Bloco C
-- ---------------------------------------------------------------------------
-- O Bloco C escreveu em `users.avatar_config` que ela sai "quando as 3 RPCs de
-- ranking e o cliente pararem de lê-la (Bloco E/F)". O cliente parou — o F.1
-- publicou o Bloco D. As 3 RPCs de ranking NÃO pararam, e o E.3 acabou de
-- decidir por escrito que elas não param aqui. O comentário é reescrito para o
-- estado real, com o nome de quem herda: comentário que promete o que não
-- aconteceu é a segunda fonte de verdade nascendo (a mesma correção que o Bloco C
-- fez no comentário do Bloco B).

COMMENT ON COLUMN public.users.avatar_config IS
  'LEGADO, esvaziada no Bloco B (2026-08-10) — é ''{}'' em 100% dos usuários. Era '
  'o cache dos itens equipados do avatar v2. NÃO escreva nada aqui. Segue viva, e '
  'na matview user_public_profiles, porque get_ranking, get_ranking_with_position '
  'e get_class_ranking ainda a devolvem. Sai quando essas três forem reescritas '
  'para servir o avatar kokeshi — que é o D30 / Bloco 6 do doc 15, fora do Bloco '
  'E por decisão registrada (doc 20, §5).';

COMMENT ON COLUMN public.users.avatar_base IS
  'LEGADO desde o Bloco C (2026-08-10). Era male/female do avatar v2; o kokeshi '
  'não tem base sexuada — a identidade é avatar_skin + avatar_hair + '
  'avatar_hair_color. NÃO escreva nada aqui. Saiu de get_public_profile E da '
  'matview user_public_profiles no E.3, por não ter mais nenhuma leitora. O '
  'último escritor é a update_avatar_base deprecada, que a /criar-personagem v2 '
  'chama até o E.4 substituir a tela. A coluna sai quando a RPC sair.';
