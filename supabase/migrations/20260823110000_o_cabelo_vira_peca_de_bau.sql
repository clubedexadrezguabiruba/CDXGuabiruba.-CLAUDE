-- =============================================================================
-- O CABELO VIRA PEÇA DE BAÚ — uma gramática só para tudo que se veste
-- =============================================================================
--
-- Até hoje o avatar tinha DUAS gramáticas para a mesma ideia. O cabelo tinha
-- tabela própria (avatar_hair_catalog), RPC própria (update_avatar_identity),
-- gate próprio, e era travado por NÍVEL — sem raridade e sem baú. Traje, rosto,
-- chapéu e pet viviam em avatar_catalogo, com raridade, posse em
-- avatar_guarda_roupa e o baú como porta.
--
-- A separação NUNCA FOI DECISÃO DE PRODUTO: está em
-- docs/avatar/21-slots-do-avatar-plano.md §3.3 (2026-08-11) e o motivo é CUSTO —
-- "migrá-lo seria refatoração além do pedido" —, com o preço assumido "duas
-- gramáticas convivem". O Doug revogou essa razão em 2026-08-22: TODO ITEM
-- VESTÍVEL TEM RARIDADE E VEM DE BAÚ, e o aluno começa podendo escolher entre
-- 2 cabelos common.
--
-- O QUE DECIDE A ARQUITETURA É UMA FK, NÃO GOSTO
-- ----------------------------------------------
--   avatar_guarda_roupa.slug text NOT NULL REFERENCES avatar_catalogo(slug)
--                            (20260811160000_bloco1_fundacao_dos_slots.sql:155)
--
-- Ter uma peça é ter linha no guarda-roupa; ter linha no guarda-roupa exige
-- estar em avatar_catalogo. "Cabelo com posse" e "cabelo fora de
-- avatar_catalogo" são incompatíveis POR CONSTRAINT. Manter as duas gramáticas
-- custaria um segundo guarda-roupa, um segundo sorteio e um segundo
-- equipar_peca.
--
-- O QUE VEM DE GRAÇA — a prova de que a gramática única é a barata:
--   * claim_chest sorteia cabelo com ZERO linha nova: o pool é
--     origem=bau AND raridade=?, SEM FILTRO DE SLOT (20260813160000:150-157).
--     Foi assim que a barba entrou no baú sem uma linha de SQL;
--   * verify:catalogo-slots compara os slugs nos dois sentidos com ZERO linha —
--     ele itera SLOTS;
--   * a vitrine (silhueta, cadeado, cor de raridade) não ganha mecânica nova.
--
-- A RARIDADE ESPELHA O GATE DE NÍVEL — é tradução, não redesenho:
--   nível 1     -> common    : espetado, assimetrico   (as 2 INICIAIS)
--   nível 10    -> rare      : coque
--   (sem linha) -> rare      : burst-fade
--   nível 20    -> epic      : moicano
--   nível 30    -> legendary : chanel
--
-- SEM GRANDFATHER, por decisão do Doug: não há aluno real, e quem estiver
-- vestindo peça que virou de baú é desequipado — mesmo gesto de
-- 20260821190000:70-72.
--
-- ESTA MIGRATION E O CÓDIGO SÃO UM SÓ DEPLOY. Entre uma e outro,
-- verify:catalogo-slots reprova com "slot cabelo: 6 slug(s) no banco que o
-- código não desenha" — é por construção, e é o "falha antes" desta frente.
--
-- O MOLDE é 20260813180000_matar_slot_fundo.sql, que já derrubou a matview,
-- mexeu numa coluna, recriou tudo e recolou equipar_peca.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda
-- em transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. O slot `cabelo` passa a existir
-- ---------------------------------------------------------------------------
ALTER TABLE public.avatar_catalogo
  DROP CONSTRAINT avatar_catalogo_slot_valido;

ALTER TABLE public.avatar_catalogo
  ADD CONSTRAINT avatar_catalogo_slot_valido
  CHECK (slot IN ('traje', 'chapeu', 'rosto', 'pet', 'cabelo'));


-- ---------------------------------------------------------------------------
-- 2. A coluna `inicial` — para que não exista lista escrita em lugar nenhum
-- ---------------------------------------------------------------------------
--
-- Ela existe por um motivo só: handle_new_user semeia com
-- INSERT ... SELECT ... WHERE inicial, e o gate CONSULTA a coluna em vez de ler
-- regex do corpo de uma função. Peça inicial nova é um UPDATE, não recolagem.
ALTER TABLE public.avatar_catalogo
  ADD COLUMN inicial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.avatar_catalogo.inicial IS
  'Peça dada na criação da conta, semeada em avatar_guarda_roupa com fonte '
  'inicial. Quem decide é ESTA COLUNA: não há lista escrita no corpo de '
  'handle_new_user nem em gate nenhum. Toda inicial é common e de origem bau — o '
  'aluno POSSUI a peça, e é por isso que equipar_peca a aceita.';


-- ---------------------------------------------------------------------------
-- 3. As 6 peças de cabelo, todas origem = bau
-- ---------------------------------------------------------------------------
-- A tabela NÃO tem coluna de nome, e isso é do desenho dela: o nome legível
-- mora no código (nomeDaPeca), porque é texto de interface e muda sem migration.
INSERT INTO public.avatar_catalogo (slug, slot, raridade, origem, inicial) VALUES
  ('cabelo-espetado',    'cabelo', 'common',    'bau', true),
  ('cabelo-assimetrico', 'cabelo', 'common',    'bau', true),
  ('cabelo-coque',       'cabelo', 'rare',      'bau', false),
  ('cabelo-burst-fade',  'cabelo', 'rare',      'bau', false),
  ('cabelo-moicano',     'cabelo', 'epic',      'bau', false),
  ('cabelo-chanel',      'cabelo', 'legendary', 'bau', false);


-- ---------------------------------------------------------------------------
-- 4. A farda deixa de ser peça de marco
-- ---------------------------------------------------------------------------
--
-- Ela era a ÚNICA peça sem raridade do catálogo inteiro. O CHECK
-- avatar_catalogo_origem_coerente é por linha e exige o conjunto inteiro de uma
-- vez (origem bau => raridade NOT NULL, min_level NULL, min_tier NULL): um
-- UPDATE só o satisfaz, dois o violariam no meio.
UPDATE public.avatar_catalogo
SET origem    = 'bau',
    raridade  = 'common',
    min_level = NULL,
    min_tier  = NULL,
    inicial   = true
WHERE slug = 'traje-farda';


-- ---------------------------------------------------------------------------
-- 5. A fonte `inicial` no guarda-roupa
-- ---------------------------------------------------------------------------
ALTER TABLE public.avatar_guarda_roupa
  DROP CONSTRAINT avatar_guarda_roupa_fonte_valida;

ALTER TABLE public.avatar_guarda_roupa
  ADD CONSTRAINT avatar_guarda_roupa_fonte_valida
  CHECK (fonte IN ('bau', 'ovo', 'inicial'));

-- Os dois COMMENTs de 20260811160000:168-182 afirmavam o CONTRÁRIO disto —
-- "Não existe fonte seed nem marco" — e passariam a mentir se ficassem.
COMMENT ON TABLE public.avatar_guarda_roupa IS
  'O que cada aluno TEM: o que o baú sorteou, o que o ovo chocou e o que a '
  'Academia deu de saída. Desde 2026-08-23 a peça inicial TEM linha aqui (fonte '
  'inicial): quando o cabelo virou peça de baú, POSSUIR passou a ser a única '
  'forma de vestir, e a farda deixou de ser peça de marco. O CHECK de '
  'avatar_catalogo ainda admite marco_nivel e marco_patente, mas nenhuma peça usa '
  'mais essa forma. Escrita só por RPC SECURITY DEFINER (claim_chest, hatch_egg, '
  'handle_new_user); o navegador não escreve nem lê a linha de ninguém além da '
  'própria.';

COMMENT ON COLUMN public.avatar_guarda_roupa.fonte IS
  'De onde veio: bau (claim_chest), ovo (hatch_egg) ou inicial (handle_new_user e '
  'ensure_user_profile, semeando avatar_catalogo.inicial). A fonte inicial nasceu '
  'em 2026-08-23 e é o que distingue a peça DADA da peça SORTEADA — as duas são '
  'posse de verdade, e as duas passam pela mesma conferência 4 do '
  'verify:avatar-db.';


-- ---------------------------------------------------------------------------
-- 6. Backfill: as iniciais para as contas que já existem
-- ---------------------------------------------------------------------------
--
-- SEM ESTE PASSO A CONFERÊNCIA 4 DO verify:avatar-db REPROVA EM BLOCO: todo
-- mundo que já veste traje-farda passaria a vestir o que não tem, porque o passo
-- 4 acabou de tirar a farda do regime de marco. O CROSS JOIN não tem lista
-- escrita pelo mesmo motivo da coluna `inicial`.
INSERT INTO public.avatar_guarda_roupa (user_id, slug, fonte)
SELECT u.id, c.slug, 'inicial'
FROM public.users u
CROSS JOIN public.avatar_catalogo c
WHERE c.inicial
ON CONFLICT (user_id, slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 7. A matview cai — SEM CASCADE, de propósito
-- ---------------------------------------------------------------------------
--
-- Ela depende de users.avatar_hair, então bloquearia o RENAME. Sem CASCADE
-- porque CASCADE derrubaria em silêncio o que dependesse dela: se houver
-- dependente novo, o certo é a migration reprovar aqui e alguém olhar.
DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;


-- ---------------------------------------------------------------------------
-- 8. avatar_hair vira avatar_cabelo, e passa a apontar para o catálogo único
-- ---------------------------------------------------------------------------
--
-- POR QUE RENOMEAR, e não manter avatar_hair. Manter custaria TRÊS EXCEÇÕES
-- PERMANENTES, cada uma exatamente onde o repositório já nomeia a armadilha:
--   * o CASE de equipar_peca viraria a "segunda cópia do CHECK" que
--     20260813180000:125-128 batizou;
--   * verify-avatar-db.ts:505 perderia o replace(coluna,'avatar_','') cujo
--     comentário diz existir para não haver lista copiada;
--   * COLUNAS_EQUIPAR ganharia um membro fora do padrão.
-- Renomear é 5 objetos SQL + 13 linhas de TypeScript, contra 3 exceções que toda
-- régua futura teria de reencodar.
ALTER TABLE public.users DROP CONSTRAINT users_avatar_hair_fk;

-- O prefixo cabelo- é FRONTEIRA, não renome: no código o modelo continua sendo
-- `espetado`, e CABELOS[m].id continua igual a m. Quem traduz é modeloDoSlug().
UPDATE public.users
SET avatar_hair = 'cabelo-' || avatar_hair
WHERE avatar_hair IS NOT NULL;

ALTER TABLE public.users RENAME COLUMN avatar_hair TO avatar_cabelo;

ALTER TABLE public.users
  ADD CONSTRAINT users_avatar_cabelo_fk
  FOREIGN KEY (avatar_cabelo) REFERENCES public.avatar_catalogo(slug);

COMMENT ON COLUMN public.users.avatar_cabelo IS
  'O cabelo vestido, como slug de avatar_catalogo — NULL = careca, que é ausência '
  'de peça e não linha do catálogo. Chamava-se avatar_hair e era travado por '
  'NÍVEL contra avatar_hair_catalog, tabela que deixou de existir em 2026-08-23. '
  'Escrita só por equipar_peca, que cobra a linha em avatar_guarda_roupa: '
  'update_avatar_identity NÃO toca mais nesta coluna, e é isso que a tira de '
  'porta dos fundos do guarda-roupa.';


-- ---------------------------------------------------------------------------
-- 9. Desequipar sem grandfather
-- ---------------------------------------------------------------------------
--
-- Com o passo 6 feito, isto atinge EXATAMENTE quem usava coque, burst-fade,
-- moicano ou chanel: as duas iniciais acabaram de virar posse de todo mundo.
-- Se o passo 6 tivesse sido esquecido, esta linha limparia o cabelo de todos, e
-- é mais um controle de que ele é obrigatório.
UPDATE public.users u
SET avatar_cabelo = NULL
WHERE u.avatar_cabelo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.avatar_guarda_roupa g
    WHERE g.user_id = u.id AND g.slug = u.avatar_cabelo
  );


-- ---------------------------------------------------------------------------
-- 10. A tabela do cabelo morre
-- ---------------------------------------------------------------------------
DROP TABLE public.avatar_hair_catalog;


-- ---------------------------------------------------------------------------
-- 11. A matview volta — com os 6 índices, o REVOKE e o COMMENT
-- ---------------------------------------------------------------------------
--
-- O CREATE DESFAZ O REVOKE: o privilégio default do Supabase volta junto com a
-- view, e sem o REVOKE abaixo anon e authenticated leriam o cache do perfil
-- público SEM passar pelo mask_display_name nem pelo filtro de ranking_visible.
-- Matview não aceita RLS — o privilégio é a única defesa. Está escrito no
-- COMMENT dela desde 2026-08-13, e esta é a segunda vez que a regra é exercida.
CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT u.id AS user_id,
       u.display_name,
       u.avatar_skin,
       u.avatar_cabelo,
       u.avatar_hair_color,
       u.avatar_traje,
       u.avatar_chapeu,
       u.avatar_rosto,
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

-- O UNIQUE é o que permite REFRESH CONCURRENTLY; os outros 5 servem as ordens de
-- ranking. Recriar a view apaga todos.
CREATE UNIQUE INDEX idx_public_profiles_user
  ON public.user_public_profiles (user_id);
CREATE INDEX idx_public_profiles_rating
  ON public.user_public_profiles (puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level
  ON public.user_public_profiles (level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3
  ON public.user_public_profiles (rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5
  ON public.user_public_profiles (rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia
  ON public.user_public_profiles (rush_resistencia_record DESC);

REVOKE ALL ON public.user_public_profiles FROM anon, authenticated, PUBLIC;

COMMENT ON MATERIALIZED VIEW public.user_public_profiles IS
  'Cache de perfil público. NÃO é legível por anon/authenticated: matview não '
  'aceita RLS, então o privilégio é a única defesa. Todo acesso passa por RPC '
  'SECURITY DEFINER, que aplica mask_display_name e o filtro de ranking_visible. '
  'Recriou a view? Repita o REVOKE — o privilégio default do Supabase volta. '
  'Carrega as 5 colunas de equipar — avatar_traje, avatar_chapeu, avatar_rosto, '
  'avatar_pet e avatar_cabelo —, a identidade kokeshi do E.3 e achieved_tier, que '
  'é o que a <MolduraPatente> mapeia para cor. A conta já foi 5, caiu para 4 '
  '(avatar_fundo saiu em 2026-08-13 com o slot inteiro, achado G23) e voltou a 5 '
  'em 2026-08-23, quando avatar_hair virou avatar_cabelo e o cabelo passou a ser '
  'peça de baú como as outras.';


-- ---------------------------------------------------------------------------
-- 12. equipar_peca ganha o slot cabelo — e são 3 linhas, não uma esteira nova
-- ---------------------------------------------------------------------------
--
-- As TRÊS ORIGENS (marco_nivel, marco_patente, bau) já estavam escritas: o
-- cabelo é `bau`, e cai no ramo que já existia. O que muda é a lista de slots, o
-- CASE do UPDATE e a chave do jsonb de retorno.
CREATE OR REPLACE FUNCTION public.equipar_peca(p_slot text, p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_peca  public.avatar_catalogo%ROWTYPE;
  v_level integer;
  v_tier  integer;
  v_tem   boolean;
  v_row   public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  IF p_slot IS NULL OR p_slot NOT IN ('traje', 'chapeu', 'rosto', 'pet', 'cabelo') THEN
    RAISE EXCEPTION 'slot inválido: %', COALESCE(p_slot, 'NULL');
  END IF;

  SELECT level INTO v_level FROM public.users WHERE id = v_uid;

  IF v_level IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- p_slug NULL = tirar a peça. Não há o que validar: ausência não tem régua, e
  -- no slot cabelo essa ausência tem nome — é a careca, que continua não sendo
  -- linha do catálogo.
  IF p_slug IS NOT NULL THEN
    SELECT * INTO v_peca FROM public.avatar_catalogo WHERE slug = p_slug;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'peça inexistente: %', p_slug;
    END IF;

    -- Sem esta conferência, equipar um chapéu no slot do rosto grava um slug
    -- válido na coluna errada, a FK aceita, e o compositor recebe uma peça que
    -- não sabe desenhar naquela camada.
    IF v_peca.slot <> p_slot THEN
      RAISE EXCEPTION 'a peça % é do slot %, não do slot %',
        p_slug, v_peca.slot, p_slot;
    END IF;

    IF v_peca.origem = 'marco_nivel' THEN
      IF v_level < v_peca.min_level THEN
        RAISE EXCEPTION 'a peça % exige nível %, e você está no nível %',
          p_slug, v_peca.min_level, v_level;
      END IF;

    ELSIF v_peca.origem = 'marco_patente' THEN
      SELECT achieved_tier INTO v_tier
      FROM public.user_titles WHERE user_id = v_uid;

      -- COALESCE 0 porque tier 0 é a base que todo aluno tem: conta sem linha em
      -- user_titles não pode ser recusada por uma peça de Aprendiz. Que a linha
      -- exista é conferido pelo verify:avatar-db, não aqui.
      IF COALESCE(v_tier, 0) < v_peca.min_tier THEN
        RAISE EXCEPTION 'a peça % exige a patente de nível %, e você está em %',
          p_slug, v_peca.min_tier, COALESCE(v_tier, 0);
      END IF;

    ELSE  -- 'bau'
      SELECT EXISTS (
        SELECT 1 FROM public.avatar_guarda_roupa
        WHERE user_id = v_uid AND slug = p_slug
      ) INTO v_tem;

      IF NOT v_tem THEN
        RAISE EXCEPTION 'você ainda não tem a peça %', p_slug;
      END IF;
    END IF;
  END IF;

  UPDATE public.users
  SET avatar_traje  = CASE WHEN p_slot = 'traje'  THEN p_slug ELSE avatar_traje  END,
      avatar_chapeu = CASE WHEN p_slot = 'chapeu' THEN p_slug ELSE avatar_chapeu END,
      avatar_rosto  = CASE WHEN p_slot = 'rosto'  THEN p_slug ELSE avatar_rosto  END,
      avatar_pet    = CASE WHEN p_slot = 'pet'    THEN p_slug ELSE avatar_pet    END,
      avatar_cabelo = CASE WHEN p_slot = 'cabelo' THEN p_slug ELSE avatar_cabelo END
  WHERE id = v_uid
  RETURNING * INTO v_row;

  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object(
    'avatar_traje',  v_row.avatar_traje,
    'avatar_chapeu', v_row.avatar_chapeu,
    'avatar_rosto',  v_row.avatar_rosto,
    'avatar_pet',    v_row.avatar_pet,
    'avatar_cabelo', v_row.avatar_cabelo
  );
END;
$function$;


-- ---------------------------------------------------------------------------
-- 13. update_avatar_identity deixa de escrever o cabelo
-- ---------------------------------------------------------------------------
--
-- O DROP É OBRIGATÓRIO, e não é limpeza: o Postgres sobrecarrega por assinatura,
-- então um CREATE com 2 parâmetros deixaria as DUAS vivas — e o PostgREST, que
-- resolve a RPC pelo nome e pelo corpo do POST, ficaria ambíguo. Pior: a antiga
-- continuaria sendo porta dos fundos do guarda-roupa, gravando avatar_cabelo sem
-- passar pela conferência de posse.
--
-- ELA CONTINUA SENDO A ÚNICA ESCRITORA DE avatar_chosen = true, e continua
-- chamando refresh_public_profiles(). É por isso que dashboard/page.tsx:64-65
-- não muda um byte.
DROP FUNCTION public.update_avatar_identity(integer, text, integer);

CREATE FUNCTION public.update_avatar_identity(p_skin integer, p_hair_color integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  IF p_skin IS NULL OR p_hair_color IS NULL THEN
    RAISE EXCEPTION 'tom de pele e cor de cabelo são obrigatórios';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- O MODELO de cabelo SAIU DAQUI em 2026-08-23. Ele é peça de avatar_catalogo e
  -- se veste por equipar_peca('cabelo', ...), que cobra a linha no guarda-roupa.
  -- Esta RPC ficou com o que de fato é IDENTIDADE e não é peça: as duas cores que
  -- o aluno escolhe (emenda à D27). O nível deixou de ser lido porque não há mais
  -- nada aqui que dependa dele.
  --
  -- WHERE id = v_uid é o que substitui a policy: escreve na linha de quem chamou
  -- e em nenhuma outra. Não há parâmetro de user_id, de propósito.
  UPDATE public.users
  SET avatar_skin       = p_skin,
      avatar_hair_color = p_hair_color,
      avatar_chosen     = true
  WHERE id = v_uid
  RETURNING * INTO v_row;

  -- E.3: o cache do perfil público carrega estas colunas. Sem este PERFORM, o
  -- /perfil/[userId] dos colegas serve a identidade antiga.
  PERFORM public.refresh_public_profiles();

  -- Devolve o que escreve, e só. O cabelo NÃO aparece aqui de propósito: uma RPC
  -- que devolvesse avatar_cabelo convidaria o cliente a tratá-la como dona dele.
  RETURN jsonb_build_object(
    'avatar_skin',       v_row.avatar_skin,
    'avatar_hair_color', v_row.avatar_hair_color
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.update_avatar_identity(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_avatar_identity(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 14. As 5 leitoras recoladas — RENOME PURO
-- ---------------------------------------------------------------------------
--
-- Nenhuma linha destas cinco foi transcrita à mão: os corpos saíram de
-- pg_get_functiondef do banco vivo e passaram por uma substituição
-- avatar_hair -> avatar_cabelo que TEM de morder (zero ocorrências seria erro, e
-- o montador reprova). Foram 11 ocorrências: 3 + 4 + 2 + 1 + 1.
--
-- A chave do jsonb muda junto SOZINHA nas quatro que usam row_to_json(r) — o
-- nome da chave é o nome da coluna. Só get_public_profile tem a chave escrita, e
-- ela está entre as 3 ocorrências dele.
-- get_public_profile(uuid)
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

-- get_ranking(text,integer)
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

-- get_ranking_with_position(text,integer)
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

-- get_class_ranking(bigint,text,integer)
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

-- get_class_feed(bigint,integer)
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

-- ---------------------------------------------------------------------------
-- 15. O seed das iniciais na criação da conta
-- ---------------------------------------------------------------------------
--
-- As duas funções ganham o MESMO bloco, e ele não tem lista escrita: quem decide
-- é avatar_catalogo.inicial. Uma peça inicial nova é um UPDATE numa coluna, não
-- uma recolagem destas duas funções.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
  v_name text;
BEGIN
  -- Extrair nome do email (parte antes do @)
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  -- display_name: primeiro nome + inicial (privacidade/LGPD)
  v_display_name := split_part(v_name, ' ', 1);
  IF v_display_name = v_name AND length(v_name) > 0 THEN
    v_display_name := v_name;
  ELSIF length(v_name) > length(v_display_name) THEN
    v_display_name := v_display_name || ' ' || left(split_part(v_name, ' ', 2), 1) || '.';
  END IF;

  -- Inserir perfil em public.users
  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_display_name,
    'aluno',
    0,
    1,
    400,
    350.00,
    0.060000
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inicializar streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inicializar título pela RÉGUA (ver comentário gêmeo em ensure_user_profile)
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT NEW.id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;

  -- AS PEÇAS INICIAIS, pela COLUNA e nunca por lista escrita aqui. Sem este
  -- bloco o aluno nasce sem poder vestir nada: desde 2026-08-23 toda peça é de
  -- origem bau, e equipar_peca cobra a linha do guarda-roupa.
  INSERT INTO public.avatar_guarda_roupa (user_id, slug, fonte)
  SELECT NEW.id, c.slug, 'inicial'
  FROM public.avatar_catalogo c
  WHERE c.inicial
  ON CONFLICT (user_id, slug) DO NOTHING;

  -- Baú de boas-vindas em user_chests
  INSERT INTO public.user_chests (user_id, source_type, source_id)
  VALUES (NEW.id, 'welcome', 'welcome')
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.ensure_user_profile()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RETURN;
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  v_name := COALESCE(split_part(v_email, '@', 1), 'Usuário');

  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (v_user_id, COALESCE(v_email, ''), v_name, v_name, 'aluno', 0, 1, 400, 350.00, 0.060000)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- O título de partida vem da RÉGUA, não de uma string escrita aqui: é o
  -- degrau mais baixo de `title_tiers`, o mesmo que a recompute_user_title lê.
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT v_user_id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;

  -- As peças iniciais — bloco gêmeo do de handle_new_user, e pela mesma coluna.
  -- Esta função é a rede para a conta que existe no auth e não no perfil; sem o
  -- bloco, essa conta nasceria sem guarda-roupa e sem nada para vestir.
  INSERT INTO public.avatar_guarda_roupa (user_id, slug, fonte)
  SELECT v_user_id, c.slug, 'inicial'
  FROM public.avatar_catalogo c
  WHERE c.inicial
  ON CONFLICT (user_id, slug) DO NOTHING;
END;
$function$;


-- ---------------------------------------------------------------------------
-- 16. O cache volta a valer
-- ---------------------------------------------------------------------------
SELECT public.refresh_public_profiles();
