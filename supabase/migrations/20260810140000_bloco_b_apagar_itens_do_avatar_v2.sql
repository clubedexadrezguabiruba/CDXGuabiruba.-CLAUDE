-- ============================================================================
-- Bloco B da troca de pilha — apagar o catálogo de itens do avatar v2.
-- ============================================================================
--
-- ⚠️ PONTO DE NÃO-RETORNO. Esta migration APAGA dados: 69 itens, 73 linhas de
-- inventário e 16 equipamentos. Não há como desfazer por migration.
--
-- Resguardo tirado antes de aplicar (2026-08-10), fora do repositório:
--   ~/Desktop/recruta64-BACKUP-itens-avatar-v2-2026-08-10.json
-- Não é para reaproveitar — a decisão foi apagar sem reuso — é para que o que
-- existiu possa ser olhado depois.
--
-- POR QUE
-- -------
-- O Doug decidiu em 2026-08-10 que o avatar novo é novo: toda a arte e todos os
-- itens do boneco v2 são apagados, sem reaproveitar nada, nem os pets. O único
-- item vestível passa a ser o cabelo, que nasce no Bloco C.
-- Ver docs/avatar/20-troca-de-pilha-plano.md.
--
-- O PRECEDENTE
-- ------------
-- 20260731100000_remover_slot_hand.sql fez exatamente isto para o slot `hand`.
-- A ordem dos passos abaixo é a de lá, estendida para as três tabelas inteiras.
--
-- O QUE **NÃO** SAI DAQUI, e é deliberado
-- ---------------------------------------
--  · `users.avatar_config` fica, esvaziada. Dropar coluna de `users` é mexer na
--    tabela mais quente do sistema; ela vira legado e sai no Bloco C, junto com
--    a recriação da view materializada e das 3 RPCs de ranking que a leem.
--  · `user_eggs` e a Chocadeira ficam — decisão do Doug, os ovos passam a
--    sempre dar XP (já feito no Bloco A).
--  · XP, nível, rating, conquistas, streak e histórico **não são tocados**.
--
-- O QUE FOI MEDIDO ANTES, em vez de suposto
-- -----------------------------------------
-- Consulta a `pg_proc` e `pg_constraint` no banco vivo achou TODOS os objetos
-- que dependem das três tabelas. São 5 funções e 6 FKs — duas a mais do que a
-- leitura das migrations sugeria. Cada uma é tratada abaixo, nomeada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. As funções que sobrevivem, reescritas ANTES de a tabela sumir
-- ---------------------------------------------------------------------------

-- 1a. check_achievements — some o bloco de item, fica o de XP e o de baú.
--
-- O bloco removido NUNCA EXECUTOU: `achievements.reward_item_id` é NULL nas
-- conquistas todas desde o dia 1 (medido: 0 linhas com valor). Era código morto
-- com FK. `reward_egg` e `scrapped_xp` seguem no payload porque o cliente os
-- lê, e os valores constantes abaixo são o que eles sempre foram na prática.
--
-- Corpo extraído de pg_get_functiondef() do banco vivo em 2026-08-10.

CREATE OR REPLACE FUNCTION public.check_achievements()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_ach record;
  v_current_value integer;
  v_user record;
  v_streak record;
  v_unlock_id bigint;
  v_newly_unlocked jsonb := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT level, puzzle_rating, puzzle_best_streak
  INTO v_user
  FROM public.users WHERE id = v_user_id;

  SELECT longest_streak INTO v_streak
  FROM public.user_streaks WHERE user_id = v_user_id;

  FOR v_ach IN
    SELECT a.*
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.achievement_id = a.id AND ua.user_id = v_user_id
    )
    ORDER BY a.id
  LOOP
    v_current_value := 0;

    CASE v_ach.condition_type
      WHEN 'bots_defeated', 'bots_defeated_unique' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_bot_first_wins
        WHERE user_id = v_user_id;

      WHEN 'puzzles_solved' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_puzzle_attempts
        WHERE user_id = v_user_id AND solved = true;

      WHEN 'rating_reached' THEN
        v_current_value := COALESCE(v_user.puzzle_rating, 0);

      WHEN 'puzzle_streak' THEN
        v_current_value := COALESCE(v_user.puzzle_best_streak, 0);

      WHEN 'lessons_completed' THEN
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.user_lesson_progress
        WHERE user_id = v_user_id AND completed = true;

      WHEN 'rush_score' THEN
        SELECT COALESCE(MAX(score), 0)::integer INTO v_current_value
        FROM public.puzzle_rush_runs
        WHERE user_id = v_user_id AND status = 'completed';

      WHEN 'level_reached' THEN
        v_current_value := COALESCE(v_user.level, 1);

      WHEN 'day_streak' THEN
        v_current_value := COALESCE(v_streak.longest_streak, 0);

      ELSE
        v_current_value := 0;
    END CASE;

    IF v_current_value >= v_ach.condition_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (v_user_id, v_ach.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING id INTO v_unlock_id;

      IF v_unlock_id IS NOT NULL THEN
        IF v_ach.reward_xp > 0 THEN
          PERFORM public.grant_xp(
            p_amount := v_ach.reward_xp,
            p_source := 'achievement',
            p_source_id := 'ach_' || v_ach.key
          );
        END IF;

        -- BLOCO B: o bloco de `reward_item_id` saiu inteiro daqui.

        IF v_ach.reward_chest THEN
          INSERT INTO public.user_chests (user_id, source_type, source_id)
          VALUES (v_user_id, 'achievement', 'ach_' || v_ach.key)
          ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
        END IF;

        v_newly_unlocked := v_newly_unlocked || jsonb_build_object(
          'key', v_ach.key,
          'title', v_ach.title,
          'description', v_ach.description,
          'icon', v_ach.icon,
          'reward_xp', v_ach.reward_xp,
          'reward_chest', v_ach.reward_chest,
          'reward_egg', false,   -- BLOCO B: nenhuma conquista dá pet
          'category', v_ach.category,
          'scrapped_xp', 0       -- BLOCO B: não há item para forjar
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_newly_unlocked;
END;
$function$;

-- 1b. get_public_profile — some `equipped_items`.
--
-- A chave continua no retorno, sempre `[]`, porque removê-la quebraria o
-- cliente publicado antes do Bloco F. Ela sai de vez quando a tela do perfil
-- público for reescrita (Bloco E).
--
-- Corpo extraído de pg_get_functiondef() do banco vivo em 2026-08-10.

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
    avatar_config,
    avatar_base,
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
    'avatar_config', v_profile.avatar_config,
    'avatar_base', v_profile.avatar_base,
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
    'achievements', v_achievements,
    'equipped_items', '[]'::jsonb  -- BLOCO B: não há mais equipamento
  );
END;
$function$;

-- 1c. claim_chest — some a última menção a `user_chests.item_id`.
--
-- A coluna é dropada no passo 4, e o caminho de "baú já aberto" ainda a lia.
-- Achado por varredura de `pg_get_functiondef` atrás de `\bitem_id\b` em TODAS
-- as funções, depois de a primeira tentativa desta migration falhar: a lição é
-- que grep por nome de coluna específico (`pet_item_id`) não acha o nome geral.
--
-- O cliente já não lê esta chave — saiu do `useChests.ts` no Bloco A.2.

CREATE OR REPLACE FUNCTION public.claim_chest(p_chest_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_chest record;
  v_roll numeric;
  v_rarity text;
  v_xp integer;
  v_egg_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_chest
  FROM public.user_chests
  WHERE id = p_chest_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baú não encontrado ou não pertence a você';
  END IF;

  IF v_chest.claimed THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'rarity', v_chest.item_rarity   -- BLOCO B: `item_id` saiu, a coluna sumiu
    );
  END IF;

  v_roll := random();
  IF v_roll < 0.07 THEN
    v_rarity := 'legendary';
  ELSIF v_roll < 0.25 THEN
    v_rarity := 'epic';
  ELSIF v_roll < 0.55 THEN
    v_rarity := 'rare';
  ELSE
    v_rarity := 'common';
  END IF;

  IF v_rarity <> 'common' THEN
    v_egg_result := public._create_random_pet_egg(
      v_user_id, v_rarity, 'chest', p_chest_id::text
    );

    UPDATE public.user_chests
    SET claimed = true, claimed_at = now(), item_rarity = v_rarity
    WHERE id = p_chest_id;

    RETURN jsonb_build_object(
      'claimed', true,
      'is_egg', true,
      'rarity', v_rarity,
      'scrapped', false,
      'scrapped_xp', 0
    );
  END IF;

  v_xp := CASE v_rarity
    WHEN 'common'    THEN 5
    WHEN 'rare'      THEN 10
    WHEN 'epic'      THEN 20
    WHEN 'legendary' THEN 35
    ELSE 5
  END;

  PERFORM public.grant_xp(
    p_amount := v_xp,
    p_source := 'item_scrap',
    p_source_id := 'scrap_chest_' || p_chest_id::text
  );

  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(), item_rarity = v_rarity
  WHERE id = p_chest_id;

  RETURN jsonb_build_object(
    'claimed', true,
    'is_egg', false,
    'is_xp', true,
    'rarity', v_rarity,
    'scrapped', true,
    'scrapped_xp', v_xp
  );
END;
$function$;

-- 1d. _create_random_pet_egg — para de inserir na coluna que vai sumir.
--
-- No Bloco A ela passou a gravar `NULL` em `pet_item_id`. Com a coluna dropada,
-- o INSERT quebraria em runtime — e só na hora em que uma criança abrisse um
-- baú raro, que é o pior lugar para descobrir.

CREATE OR REPLACE FUNCTION public._create_random_pet_egg(p_user_id uuid, p_rarity text, p_source_type text, p_source_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_has_hatching boolean;
  v_xp_bonus integer;
  v_egg_id bigint;
  v_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  v_xp_bonus := CASE p_rarity
    WHEN 'common'    THEN 15
    WHEN 'rare'      THEN 25
    WHEN 'epic'      THEN 40
    WHEN 'legendary' THEN 60
    ELSE 15
  END;

  SELECT EXISTS (
    SELECT 1 FROM public.user_eggs
    WHERE user_id = p_user_id AND status = 'hatching'
  ) INTO v_has_hatching;

  IF v_has_hatching THEN
    v_status := 'queued';
  ELSE
    v_status := 'hatching';
  END IF;

  -- BLOCO B: `pet_item_id` saiu da lista de colunas.
  INSERT INTO public.user_eggs (
    user_id, rarity, status,
    hatch_start_at, xp_bonus, source_type, source_id
  )
  VALUES (
    p_user_id,
    p_rarity,
    v_status,
    CASE WHEN v_status = 'hatching' THEN now() ELSE NULL END,
    v_xp_bonus,
    p_source_type,
    p_source_id
  )
  RETURNING id INTO v_egg_id;

  RETURN jsonb_build_object(
    'egg_id', v_egg_id,
    'status', v_status,
    'is_egg', true
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- 2. As funções que morrem
-- ---------------------------------------------------------------------------
-- equip_item e unequip_slot existiam para o inventário. _create_specific_pet_egg
-- só era chamada pelo bloco de `reward_item_id` que acabou de sair — era código
-- morto com uma consulta a `items` dentro.

-- Assinaturas conferidas em pg_get_function_identity_arguments no banco vivo,
-- não deduzidas das migrations: `DROP` com assinatura errada não acha a função
-- e passa em silêncio, que é o pior desfecho possível aqui.

DROP FUNCTION IF EXISTS public.equip_item(p_item_id bigint);
DROP FUNCTION IF EXISTS public.unequip_slot(p_slot text);
DROP FUNCTION IF EXISTS public._create_specific_pet_egg(p_user_id uuid, p_pet_item_id bigint, p_source_type text, p_source_id text);

-- ---------------------------------------------------------------------------
-- 3. A única coluna que FICA e precisa ser zerada
-- ---------------------------------------------------------------------------
-- `avatar_config` sobrevive ao Bloco B (ver o cabeçalho). As outras quatro são
-- dropadas no passo 4, e anular coluna que vai sumir não faz nada.

UPDATE public.users SET avatar_config = '{}'::jsonb WHERE avatar_config <> '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 4. As colunas de FK saem
-- ---------------------------------------------------------------------------
-- Antes do DROP TABLE, senão o Postgres recusa por dependência.
--
-- ⚠️ A PRIMEIRA VERSÃO DESTA MIGRATION FALHOU AQUI, e o motivo vale registrar:
-- ela fazia `UPDATE user_eggs SET pet_item_id = NULL` antes de dropar a coluna,
-- e isso viola `user_eggs_check`:
--
--     CHECK ( (pet_item_id IS NOT NULL AND xp_bonus = 0)
--          OR (pet_item_id IS NULL     AND xp_bonus > 0) )
--
-- Um ovo é OU de pet OU de XP; anular o pet deixando o bônus em zero cria o
-- terceiro estado que a tabela proíbe. São 12 ovos assim hoje.
--
-- O conserto não é lutar com a constraint: é **dropar a coluna primeiro**. O
-- `DROP COLUMN` leva junto a FK e a própria `user_eggs_check`, que referencia a
-- coluna — e aí o estado inválido nunca chega a existir.

ALTER TABLE public.user_chests   DROP COLUMN IF EXISTS item_id;
ALTER TABLE public.user_eggs     DROP COLUMN IF EXISTS pet_item_id;
ALTER TABLE public.achievements  DROP COLUMN IF EXISTS reward_item_id;
ALTER TABLE public.title_tiers   DROP COLUMN IF EXISTS outfit_item_id;

-- Agora que a constraint velha se foi, os 12 ovos de pet viram ovos de XP de
-- verdade — com o bônus da própria raridade, a mesma régua do Bloco A. Sem
-- isto eles dependeriam do recálculo defensivo de `hatch_egg` para não pagar
-- zero, e dado que se pode consertar não se deixa para o runtime resolver.

UPDATE public.user_eggs
SET xp_bonus = CASE rarity
  WHEN 'common'    THEN 15
  WHEN 'rare'      THEN 25
  WHEN 'epic'      THEN 40
  WHEN 'legendary' THEN 60
  ELSE 15
END
WHERE xp_bonus <= 0;

-- E a invariante nova fica escrita como mecanismo, não como disciplina:
-- depois do Bloco B **todo ovo é ovo de XP**.
ALTER TABLE public.user_eggs
  ADD CONSTRAINT user_eggs_xp_positivo CHECK (xp_bonus > 0);

-- ---------------------------------------------------------------------------
-- 5. As três tabelas
-- ---------------------------------------------------------------------------
-- Na ordem das dependências: as duas que apontam para `items` primeiro.
-- Índices, CHECKs, UNIQUEs, policies de RLS e grants caem junto.

DROP TABLE IF EXISTS public.user_equipped;
DROP TABLE IF EXISTS public.user_inventory;
DROP TABLE IF EXISTS public.items;

-- ---------------------------------------------------------------------------
-- 6. O legado declarado
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN public.users.avatar_config IS
  'LEGADO, esvaziada no Bloco B (2026-08-10). Era o cache dos itens equipados '
  'do avatar v2, mantido por equip_item/unequip_slot — as duas foram dropadas e '
  'as três tabelas de item também. Fica como {} até o Bloco C, que recria a view '
  'materializada e as 3 RPCs de ranking sobre avatar_skin/avatar_hair/'
  'avatar_hair_color. Não escreva nada aqui.';
