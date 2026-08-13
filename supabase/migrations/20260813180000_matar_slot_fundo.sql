-- ===========================================================================
-- O SLOT `fundo` MORRE — todo aluno fica com o marfim que os palcos já usam
-- ===========================================================================
--
-- Decisão do Doug em 2026-08-13, depois da peça de teste do Bloco 3.
--
-- POR QUE, E NÃO É FALTA DE ARTE
-- ------------------------------
-- A peça de teste (`fundo-observatorio`, 3 variantes renderizadas e criticadas)
-- matou a premissa em vez da peça. O que a folha achou é o **G23**:
--
--   A <MolduraPatente> é um anel desenhado SOBRE o fundo do avatar, nos palcos.
--   Para uma patente de luminância Lp, um fundo de luminância Lb só dá contraste
--   ≥ 3 fora da faixa ((Lp+0,05)/3 − 0,05 ; 3·(Lp+0,05) − 0,05). Medidas as seis:
--
--     Aspirante  L 0,066   proíbe [0,000 · 0,297]
--     General    L 0,073   proíbe [0,000 · 0,320]
--     Comandante L 0,107   proíbe [0,002 · 0,422]
--     Soldado    L 0,205   proíbe [0,035 · 0,716]
--     Capitão    L 0,214   proíbe [0,038 · 0,741]
--     Mestre     L 0,494   proíbe [0,131 · 1,000]
--
--   A união cobre [0 , 1] INTEIRO. Não existe cor de fundo — clara, escura,
--   nenhuma — que faça os seis anéis lerem. Não é escolha de arte: é a aritmética
--   das seis cores que já estão no produto.
--
-- O fundo único é o `bg-warm-stone` (#F5F0E8) que os palcos já usam. Zero arte,
-- zero componente novo, zero pixel muda para o aluno.
--
-- POR QUE APAGAR E NÃO CONGELAR
-- -----------------------------
-- Slot dormente no banco é a semente exata do erro que matou a pilha v2 — 8
-- uniformes semeados, 0 renderáveis. O `verify:catalogo-slots` passaria por
-- vacuidade num slot que agora é DEFINITIVAMENTE vazio, e não `ainda` vazio, e
-- isso é promessa sem lastro com aparência de gate verde.
--
-- O MOLDE É O DO PRÓPRIO PROJETO
-- ------------------------------
-- `20260731100000_remover_slot_hand.sql` já removeu um slot, e a seção 6 dele
-- nomeia a armadilha: **A SEGUNDA CÓPIA DO CHECK**. Aqui ela é a lista literal
-- dentro de `equipar_peca` (`20260811160000:274`), e ela cai no passo 5.
--
-- A ORDEM IMPORTA: a matview lê `u.avatar_fundo`, então ela cai antes da coluna
-- e volta depois. Sem `BEGIN;`/`COMMIT;` — o postgres.js recusa transação
-- explícita, e recusa DEPOIS de o servidor ter executado.

-- ---------------------------------------------------------------------------
-- 1. As peças do slot
-- ---------------------------------------------------------------------------
-- No-op hoje: `avatar_catalogo` nunca teve linha de fundo. Está aqui porque é o
-- passo 4 do precedente do `hand`, e sem ele o ADD CONSTRAINT do passo 7 falharia
-- se alguém tivesse semeado entre a medição e a aplicação.
DELETE FROM public.avatar_catalogo WHERE slot = 'fundo';

-- ---------------------------------------------------------------------------
-- 2. A matview sai (sem CASCADE, de propósito)
-- ---------------------------------------------------------------------------
-- CASCADE apaga em silêncio o que apareceu depois da medição; o DROP simples
-- ERRA, e erro é o que se quer de uma surpresa. É o que o E.3, o Bloco 1 e o B2
-- já fazem.
DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles;

-- ---------------------------------------------------------------------------
-- 3. A coluna
-- ---------------------------------------------------------------------------
-- A FK `users_avatar_fundo_fk` e o COMMENT ON COLUMN caem junto com ela.
-- Todos os valores são NULL: o catálogo do slot esteve vazio a vida inteira e a
-- FK impedia qualquer outro valor.
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_fundo;

-- ---------------------------------------------------------------------------
-- 4. A matview volta — sem a coluna, COM os seis índices e o REVOKE
-- ---------------------------------------------------------------------------
-- Corpo de 20260813120000:71-121, com UMA linha a menos (`u.avatar_fundo`).
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
  'Carrega as 4 colunas de equipar (eram 5: avatar_fundo saiu em 2026-08-13, com '
  'o slot inteiro — achado G23), a identidade kokeshi do E.3 e achieved_tier, que '
  'é o que a <MolduraPatente> mapeia para cor.';

-- ---------------------------------------------------------------------------
-- 5. equipar_peca — e aqui mora A SEGUNDA CÓPIA DO CHECK
-- ---------------------------------------------------------------------------
-- Corpo de 20260811160000:250, com TRÊS mudanças e nada mais: a lista literal de
-- slots, o ramo do CASE no UPDATE e a chave do jsonb de retorno.
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

  IF p_slot IS NULL OR p_slot NOT IN ('traje', 'chapeu', 'rosto', 'pet') THEN
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
      avatar_pet    = CASE WHEN p_slot = 'pet'    THEN p_slug ELSE avatar_pet    END
  WHERE id = v_uid
  RETURNING * INTO v_row;

  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object(
    'avatar_traje',  v_row.avatar_traje,
    'avatar_chapeu', v_row.avatar_chapeu,
    'avatar_rosto',  v_row.avatar_rosto,
    'avatar_pet',    v_row.avatar_pet
  );
END;
$$;

COMMENT ON FUNCTION public.equipar_peca(text, text) IS
  'Única via de escrita das 4 colunas de equipar de users (eram 5: o slot fundo '
  'morreu em 2026-08-13, achado G23). Valida slot, existência do slug, '
  'pertencimento do slug ao slot e o DIREITO do aluno (nível, patente ou linha no '
  'guarda-roupa, conforme a origem da peça) — é a Regra Inviolável nº 1 em código. '
  'p_slug NULL tira a peça. Negação medida por npm run verify:catalogo-slots.';

-- ---------------------------------------------------------------------------
-- 6. get_public_profile — a única RPC que expunha a coluna
-- ---------------------------------------------------------------------------
-- Corpo de 20260813120000:131, com `avatar_fundo` fora do SELECT e do jsonb.
-- As 4 RPCs de lista (get_ranking, get_ranking_with_position, get_class_ranking,
-- get_class_feed) NÃO entram aqui: elas param em avatar_chapeu/avatar_rosto e
-- nunca nomearam a coluna. Medido antes de escrever esta migration.
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
  'avatar kokeshi como ÍNDICE + SLUG, os 4 slugs de equipar (traje, chapeu, rosto, '
  'pet — eram 5 até o slot fundo morrer em 2026-08-13, achado G23) e achieved_tier, '
  'o número da patente que a moldura em volta do avatar lê. NULL em qualquer slug = '
  'sem a peça. Vigiada por npm run verify:perfil-publico.';

-- ---------------------------------------------------------------------------
-- 7. O CHECK do catálogo
-- ---------------------------------------------------------------------------
ALTER TABLE public.avatar_catalogo
  DROP CONSTRAINT IF EXISTS avatar_catalogo_slot_valido;

ALTER TABLE public.avatar_catalogo
  ADD CONSTRAINT avatar_catalogo_slot_valido
  CHECK (slot IN ('traje', 'chapeu', 'rosto', 'pet'));

COMMENT ON TABLE public.avatar_catalogo IS
  'O que existe para vestir, e SÓ o desbloqueio: nome e arte moram no código '
  '(src/lib/avatar/catalogo.ts), e é isso que permite ao verify:catalogo-slots '
  'comparar os dois conjuntos slot a slot — a trava contra o pecado da v2 (8 '
  'uniformes no banco, 0 renderáveis). Quatro slots: traje, chapeu, rosto, pet. '
  'Eram cinco — `fundo` foi removido em 2026-08-13 pelo achado G23: nenhuma cor '
  'de fundo faz os seis anéis de patente lerem, e o fundo passou a ser único e '
  'igual para todo aluno, fora do guarda-roupa.';
