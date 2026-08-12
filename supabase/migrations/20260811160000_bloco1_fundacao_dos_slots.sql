-- ============================================================================
-- BLOCO 1 do doc 21 — a fundação do guarda-roupa: traje, chapéu, rosto, fundo, pet
-- ============================================================================
--
-- ADITIVA, e ZERO MUDANÇA VISUAL. Nenhuma peça é semeada, nenhuma coluna
-- existente muda de valor, nenhum aluno passa a vestir nada. Quando esta
-- migration terminar, o boneco na tela é byte a byte o de antes dela — o que
-- muda é que existe onde guardar as peças que os Blocos 2 a 8 vão desenhar.
--
-- Ver docs/avatar/21-slots-do-avatar-plano.md, §3 (a arquitetura) e §7 (Bloco 1).
--
-- A ARQUITETURA, E O QUE ELA NÃO É
-- --------------------------------
-- Escolhida na bancada A×B do doc 21 §3.1: **1 catálogo + 1 guarda-roupa**, não
-- 5 tabelas no molde do cabelo. O que decidiu foi o baú: com 5 tabelas, sortear
-- uma peça vira `UNION` de quatro delas costurado à mão dentro do `claim_chest`,
-- que é a função mais delicada do sistema.
--
-- **Isto NÃO é a tabela `items` da v2 de volta.** Não há inventário genérico, não
-- há `equip_item`, não há slot livre: o slot é CHECK fechado de cinco valores, o
-- catálogo guarda só o desbloqueio, e a arte mora no código. As proibições do
-- `verify:avatar-db` (`items`, `user_inventory`, `user_equipped`, `equip_item`,
-- `unequip_slot`, as 4 colunas de FK) continuam valendo, intactas — os nomes
-- daqui são outros de propósito, e nenhum deles cai nas listas nem na regex.
--
-- O CABELO NÃO SE MEXE
-- --------------------
-- `avatar_hair_catalog`, as três colunas de identidade e `update_avatar_identity`
-- ficam exatamente como estão. São código provado, com gate próprio e conferido
-- na tela pelo Doug. Migrá-los para cá seria refatoração além do pedido (regra
-- nº 3 do CLAUDE.md). O preço é duas gramáticas convivendo, e está declarado no
-- doc 21 §3.3 — é mais barato que mexer no que funciona.
--
-- POR QUE A MATVIEW E AS 5 FUNÇÕES ENTRAM NA MESMA RODADA
-- -------------------------------------------------------
-- Porque recriar a matview derruba os índices e o REVOKE, e cada rodada extra é
-- outra chance de esquecer um dos dois. O E.3 e o Bloco 6 fizeram esse caminho
-- duas vezes; fazê-lo uma terceira e uma quarta separadas só multiplica o risco.
--
-- **Nada aqui quebra o site publicado.** Todas as mudanças de retorno são
-- ADITIVAS: as RPCs passam a devolver chaves NOVAS, e nenhuma chave existente
-- sai. O cliente no ar ignora o que não conhece. É a diferença desta migration
-- para as do Bloco B ao F.1, que quebraram produção de propósito.
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. avatar_catalogo — o que existe para vestir
-- ---------------------------------------------------------------------------
--
-- COMO NO CABELO: o banco guarda o DESBLOQUEIO, o código guarda a FORMA. O que
-- os dois lados compartilham é só o slug — e é exatamente isso que o gate novo
-- `verify:catalogo-slots` cobra, slot a slot, nos dois sentidos.
--
-- É a trava nº 2 do doc 21 §1.3, e ela existe por um pecado medido: a v2 tinha
-- 8 uniformes no banco e 0 renderáveis. Peça semeada sem arte é um cadeado que
-- abre para o nada; peça desenhada sem linha é uma opção que o servidor nega.
-- Nenhum dos dois quebra o `apply` — só a cara da criança.
--
-- A CONSISTÊNCIA ORIGEM × COLUNAS É CHECK, NÃO CONVENÇÃO
-- ------------------------------------------------------
-- Cada origem usa uma coluna de régua e ignora as outras duas. Sem o CHECK
-- composto, uma peça de baú com `min_level` preenchido é dado que ninguém lê e
-- que a próxima pessoa vai acreditar. O que não é da origem é NULL, e o banco
-- recusa o resto.

CREATE TABLE public.avatar_catalogo (
  slug      text    PRIMARY KEY,

  slot      text    NOT NULL
    CONSTRAINT avatar_catalogo_slot_valido
    CHECK (slot IN ('traje', 'chapeu', 'rosto', 'fundo', 'pet')),

  origem    text    NOT NULL
    CONSTRAINT avatar_catalogo_origem_valida
    CHECK (origem IN ('marco_nivel', 'marco_patente', 'bau')),

  raridade  text
    CONSTRAINT avatar_catalogo_raridade_valida
    CHECK (raridade IN ('common', 'rare', 'epic', 'legendary')),

  min_level integer
    CONSTRAINT avatar_catalogo_min_level_valido CHECK (min_level >= 1),

  min_tier  integer
    CONSTRAINT avatar_catalogo_min_tier_fk REFERENCES public.title_tiers(tier),

  -- Cada origem traz a sua régua e só a sua. O que não é da origem é NULL.
  CONSTRAINT avatar_catalogo_origem_coerente CHECK (
    (origem = 'marco_nivel'
       AND min_level IS NOT NULL AND min_tier IS NULL AND raridade IS NULL)
    OR
    (origem = 'marco_patente'
       AND min_tier IS NOT NULL AND min_level IS NULL AND raridade IS NULL)
    OR
    (origem = 'bau'
       AND raridade IS NOT NULL AND min_level IS NULL AND min_tier IS NULL)
  ),

  -- A trava nº 3 do doc 21 §1.3, e ela é do BANCO porque é regra de produto, não
  -- de tela: uniforme é mérito de patente. Sair de baú apagaria o mérito — quem
  -- vê o traje do Soldado num colega tem de saber que ele foi promovido, não que
  -- teve sorte. A lição D16 vira constraint em vez de disciplina.
  CONSTRAINT avatar_catalogo_traje_nao_e_de_bau
    CHECK (NOT (slot = 'traje' AND origem = 'bau'))
);

COMMENT ON TABLE public.avatar_catalogo IS
  'Catálogo fechado das peças do avatar kokeshi: traje, chapeu, rosto, fundo, '
  'pet. Guarda só o DESBLOQUEIO — a forma mora no código, como no cabelo. Os '
  'slugs têm de bater exatamente com o catálogo de src/lib/avatar/catalogo.ts, '
  'slot a slot, e quem cobra é npm run verify:catalogo-slots. NÃO é a tabela '
  '`items` da v2: não há slot livre, não há inventário genérico, não há '
  'equip_item. O cabelo NÃO está aqui — ele tem catálogo próprio e provado '
  '(avatar_hair_catalog), e o doc 21 §3.3 decidiu não migrá-lo.';

COMMENT ON COLUMN public.avatar_catalogo.origem IS
  'Como a peça se ganha. marco_nivel = nível de XP (usa min_level). '
  'marco_patente = promoção (usa min_tier). bau = sorteio (usa raridade, e a '
  'posse vira linha em avatar_guarda_roupa). O CHECK composto recusa mistura.';

COMMENT ON COLUMN public.avatar_catalogo.raridade IS
  'Só para origem=bau. É a pirâmide do claim_chest: 45% common, 30% rare, '
  '18% epic, 7% legendary. NULL em peça de marco — marco não é sorte.';

-- RLS com leitura aberta a quem está logado, pelo mesmo motivo do cabelo: o
-- editor mostra o cadeado E o que falta para abri-lo, então o aluno lê a régua
-- inteira, inclusive as linhas que ainda não alcança. O que ele não faz é
-- ESCREVER — sem isso, baixar o próprio min_level seria um UPDATE.
ALTER TABLE public.avatar_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatar_catalogo_leitura ON public.avatar_catalogo
  FOR SELECT TO authenticated USING (true);

-- O REVOKE é explícito e vem ANTES do GRANT: no Supabase o schema public tem
-- ALTER DEFAULT PRIVILEGES concedendo tudo a anon/authenticated, então tabela
-- nova NASCE escrevível. É o par que o R1 aprendeu a fechar junto.
REVOKE ALL ON public.avatar_catalogo FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.avatar_catalogo TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. avatar_guarda_roupa — o que o acaso deu a cada aluno
-- ---------------------------------------------------------------------------
--
-- **Peça de marco NÃO tem linha aqui**, e é a decisão de modelagem que faz esta
-- tabela ficar pequena para sempre. O direito de vestir um traje de patente se
-- verifica ao vivo contra `user_titles.achieved_tier`, exatamente como o cabelo
-- verifica `users.level`. Guardar a concessão duplicaria a régua e criaria a
-- pergunta "e quando as duas discordarem?".
--
-- Esta tabela guarda só o que não é derivável: o que o baú sorteou.

CREATE TABLE public.avatar_guarda_roupa (
  user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug     text        NOT NULL REFERENCES public.avatar_catalogo(slug),
  ganho_em timestamptz NOT NULL DEFAULT now(),
  fonte    text        NOT NULL
    CONSTRAINT avatar_guarda_roupa_fonte_valida CHECK (fonte IN ('bau', 'ovo')),

  -- A chave é o par, e ela É o UNIQUE que o doc 21 pede: a mesma peça duas vezes
  -- para o mesmo aluno é a falha que faria o baú "premiar" o que já se tem.
  PRIMARY KEY (user_id, slug)
);

COMMENT ON TABLE public.avatar_guarda_roupa IS
  'O que cada aluno GANHOU por sorteio — e só isso. Peça de marco (nível ou '
  'patente) não tem linha aqui: o direito se verifica ao vivo, como o cabelo já '
  'faz. Escrita só por RPC SECURITY DEFINER (claim_chest e hatch_egg, a partir '
  'dos Blocos 4 e 8); o navegador não escreve nem lê a linha de ninguém além da '
  'própria.';

COMMENT ON COLUMN public.avatar_guarda_roupa.fonte IS
  'De onde veio: bau (claim_chest) ou ovo (hatch_egg). Não existe fonte "seed" '
  'nem "marco" — peça de marco não tem linha nesta tabela.';

ALTER TABLE public.avatar_guarda_roupa ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatar_guarda_roupa_select_own ON public.avatar_guarda_roupa
  FOR SELECT TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public.avatar_guarda_roupa FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.avatar_guarda_roupa TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. As 5 colunas de equipar em `users`
-- ---------------------------------------------------------------------------
--
-- Mesmo molde de `users.avatar_hair`: FK para o catálogo, NULL = sem a peça, e
-- NULL é o default. Nenhum aluno passa a vestir nada por causa desta migration —
-- é o que garante que o boneco sai byte a byte igual ao de hoje.
--
-- NULL É ESTADO LEGÍTIMO, não dado faltando. Careca, sem chapéu e sem pet são
-- ausências de peça, do mesmo jeito que `avatar_hair IS NULL`.

ALTER TABLE public.users
  ADD COLUMN avatar_traje  text DEFAULT NULL
    CONSTRAINT users_avatar_traje_fk  REFERENCES public.avatar_catalogo(slug),
  ADD COLUMN avatar_chapeu text DEFAULT NULL
    CONSTRAINT users_avatar_chapeu_fk REFERENCES public.avatar_catalogo(slug),
  ADD COLUMN avatar_rosto  text DEFAULT NULL
    CONSTRAINT users_avatar_rosto_fk  REFERENCES public.avatar_catalogo(slug),
  ADD COLUMN avatar_fundo  text DEFAULT NULL
    CONSTRAINT users_avatar_fundo_fk  REFERENCES public.avatar_catalogo(slug),
  ADD COLUMN avatar_pet    text DEFAULT NULL
    CONSTRAINT users_avatar_pet_fk    REFERENCES public.avatar_catalogo(slug);

COMMENT ON COLUMN public.users.avatar_traje IS
  'Slug em avatar_catalogo (slot traje), ou NULL = macacão de treino da base. '
  'Escrita só por equipar_peca.';
COMMENT ON COLUMN public.users.avatar_chapeu IS
  'Slug em avatar_catalogo (slot chapeu), ou NULL = sem chapéu. Escrita só por '
  'equipar_peca.';
COMMENT ON COLUMN public.users.avatar_rosto IS
  'Slug em avatar_catalogo (slot rosto: óculos, bigode, barba), ou NULL = rosto '
  'limpo. Escrita só por equipar_peca.';
COMMENT ON COLUMN public.users.avatar_fundo IS
  'Slug em avatar_catalogo (slot fundo), ou NULL = sem cena atrás. NÃO entra no '
  'recorte de cabeça (navbar, rankings) — ver doc 21 §3.4. Escrita só por '
  'equipar_peca.';
COMMENT ON COLUMN public.users.avatar_pet IS
  'Slug em avatar_catalogo (slot pet), ou NULL = sem pet. Escrita só por '
  'equipar_peca; a POSSE vem de hatch_egg (Bloco 8).';

-- ---------------------------------------------------------------------------
-- 4. equipar_peca — a única via de escrita das cinco colunas
-- ---------------------------------------------------------------------------
--
-- Regra Inviolável nº 1: o client envia a intenção, o servidor decide. Uma RPC
-- para os cinco slots, e não cinco RPCs, porque a validação é a mesma nos cinco
-- — o que muda é qual coluna recebe, e isso é um CASE.
--
-- O QUE ELA VALIDA (e o cliente não valida nada):
--   1. o slot é um dos cinco;
--   2. o slug existe E é daquele slot;
--   3. o dono TEM DIREITO — marco de nível, marco de patente, ou linha no
--      guarda-roupa, conforme a origem da peça;
--   4. `p_slug IS NULL` = tirar a peça, sempre permitido.
--
-- SEM PARÂMETRO DE user_id, como a irmã `update_avatar_identity`: o `WHERE id =
-- v_uid` é o que substitui a policy. Escreve na linha de quem chamou e em
-- nenhuma outra.
--
-- UM SLOT POR CHAMADA, e o CASE preserva os outros quatro. A alternativa —
-- receber os cinco de uma vez — obrigaria o editor a mandar o estado inteiro a
-- cada troca, e uma aba que ainda não existe mandaria NULL por não saber.
--
-- CHAMA `refresh_public_profiles()` como a irmã, e pelo mesmo motivo medido no
-- E.3: sem isso o aluno troca de peça, o próprio /perfil mostra a nova (lê
-- `users` direto) e o /perfil/[userId] que os colegas abrem mostra a antiga.

CREATE OR REPLACE FUNCTION public.equipar_peca(
  p_slot text,
  p_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  IF p_slot IS NULL OR p_slot NOT IN ('traje', 'chapeu', 'rosto', 'fundo', 'pet') THEN
    RAISE EXCEPTION 'slot inválido: %', COALESCE(p_slot, 'NULL');
  END IF;

  SELECT level INTO v_level FROM public.users WHERE id = v_uid;

  IF v_level IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- p_slug NULL = tirar a peça. Não há o que validar: ausência não tem régua.
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
      avatar_fundo  = CASE WHEN p_slot = 'fundo'  THEN p_slug ELSE avatar_fundo  END,
      avatar_pet    = CASE WHEN p_slot = 'pet'    THEN p_slug ELSE avatar_pet    END
  WHERE id = v_uid
  RETURNING * INTO v_row;

  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object(
    'avatar_traje',  v_row.avatar_traje,
    'avatar_chapeu', v_row.avatar_chapeu,
    'avatar_rosto',  v_row.avatar_rosto,
    'avatar_fundo',  v_row.avatar_fundo,
    'avatar_pet',    v_row.avatar_pet
  );
END;
$$;

COMMENT ON FUNCTION public.equipar_peca(text, text) IS
  'Única via de escrita das 5 colunas de equipar de users. Valida slot, '
  'existência do slug, pertencimento do slug ao slot e o DIREITO do aluno '
  '(nível, patente ou linha no guarda-roupa, conforme a origem da peça) — é a '
  'metade servidor da Regra Inviolável nº 1. p_slug NULL = tirar a peça. '
  'Escreve só na linha de auth.uid(); não recebe user_id. Chama '
  'refresh_public_profiles(). Vigiada por verify:catalogo-slots, que mede as '
  'três recusas como o papel authenticated.';

REVOKE ALL ON FUNCTION public.equipar_peca(text, text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.equipar_peca(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. A matview, com as 5 colunas novas
-- ---------------------------------------------------------------------------
-- Definição anterior: 20260810200000_e3_perfil_publico_com_identidade.sql:94.
-- Única mudança: entram as 5 colunas de equipar. `avatar_config` FICA — o Bloco 6
-- tirou as leitoras da coluna, mas tirá-la da view é migration própria, e a
-- conferência 6 do verify:perfil-publico já vigia o par.
--
-- O DROP é SEM CASCADE de propósito, como no E.3: CASCADE apaga em silêncio o
-- que apareceu depois da medição; o DROP simples ERRA, e erro é o que se quer de
-- uma surpresa.

DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_config,
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
  'Carrega as 5 colunas de equipar desde o Bloco 1 dos slots (2026-08-11), além '
  'da identidade kokeshi do E.3. avatar_config segue aqui sem leitora desde o '
  'Bloco 6 — sai na próxima migration que recriar a view.';

-- ---------------------------------------------------------------------------
-- 6. get_public_profile — serve as 5 peças
-- ---------------------------------------------------------------------------
-- Corpo de 20260810200000:169, com UMA mudança: as 5 chaves de equipar entram no
-- SELECT e no jsonb_build_object. Nada mais se move.
--
-- É o perfil INTEIRO — as cinco vão, inclusive fundo e pet, que são componentes
-- irmãos do boneco (doc 21 §3.4) e existem justamente na tela grande.

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
  'avatar kokeshi como ÍNDICE + SLUG e, desde o Bloco 1 dos slots, os 5 slugs '
  'de equipar (traje, chapeu, rosto, fundo, pet). NULL em qualquer um = sem a '
  'peça. Vigiada por npm run verify:perfil-publico.';

-- ---------------------------------------------------------------------------
-- 7. As 3 RPCs de ranking e o mural — só chapéu e rosto
-- ---------------------------------------------------------------------------
--
-- POR QUE SÓ DUAS DAS CINCO, e isto é decisão, não economia: as cinco telas de
-- lista mostram o RECORTE DE CABEÇA (`<AvatarCabeca>`, que só muda o viewBox).
-- Nesse recorte o tronco não aparece, então traje não muda um pixel; e fundo e
-- pet são componentes IRMÃOS, fora do SVG — mandá-los seria oferecer à lista um
-- dado que ela não tem onde desenhar. Doc 21 §7, Bloco 1.
--
-- Corpo das quatro extraído de 20260811140000_bloco6_identidade_nas_listas.sql,
-- que por sua vez saiu do banco vivo. Únicas linhas alteradas: as duas colunas
-- novas entram ao lado das três da identidade. Nada de ordenação, autorização,
-- máscara de nome ou tratamento de p_type desconhecido se move.

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
             level, puzzle_rating, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY puzzle_rating DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_3min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             level, rush_3min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_3min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'rush_5min' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
             level, rush_5min_record, title
      FROM public.user_public_profiles
      WHERE ranking_visible = true
      ORDER BY rush_5min_record DESC
      LIMIT p_limit
    ) r;
  ELSIF p_type = 'level' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (
      SELECT user_id, display_name, avatar_skin, avatar_hair, avatar_hair_color,
             avatar_chapeu, avatar_rosto,
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

-- O mural lê de `users` (fresco), não da matview (cache) — a decisão e os dois
-- motivos estão em 20260811140000:50-62 e não mudam aqui.

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
      u.avatar_rosto
    FROM public.class_feed cf
    JOIN public.users u ON u.id = cf.user_id
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
  'Mural da turma com a identidade do avatar kokeshi mais chapéu e rosto — as '
  'duas peças que o recorte de cabeça mostra (Bloco 1 dos slots). SECURITY '
  'DEFINER com a mesma checagem de pertencimento de get_class_ranking. Junta '
  'users (fresco), não a matview (cache).';
