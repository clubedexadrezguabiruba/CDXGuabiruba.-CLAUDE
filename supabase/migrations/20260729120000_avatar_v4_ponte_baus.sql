-- ============================================================================
-- Avatar v4 — T0.5: a ponte. Baú só sorteia item que aparece no boneco.
-- ============================================================================
--
-- O PROBLEMA
-- ----------
-- 45 dos 77 itens do catálogo não têm os arquivos que o render exige. A
-- criança abre um baú, ganha um Elmo de Cavaleiro, equipa, e nada muda. Para
-- criança o loop de recompensa é o coração da gamificação, e ele está
-- quebrado em 58% dos sorteios desde que o catálogo cresceu além da arte.
--
-- A SOLUÇÃO PROVISÓRIA (a ponte)
-- ------------------------------
-- `items.renderable` marca os 32 itens que hoje realmente vestem o boneco.
-- O sorteio passa a respeitar essa marca. O loop fica honesto AGORA, sem
-- esperar os 45 desenhos da F1/F4. Conforme a arte chega, uma migration nova
-- liga o flag e o pool cresce sozinho.
--
-- Default FALSE de propósito: item novo entra INVISÍVEL para o sorteio até
-- alguém provar que ele renderiza. Fail-closed. Um default `true` recriaria
-- exatamente o bug que esta migration fecha.
--
-- A marca é conferida contra o disco pelo gate `npm run verify:phase8`
-- (scripts/verify/phase8/verify-chest-pool.ts), que recalcula a
-- renderabilidade a partir de `public/items/` e falha se o banco divergir.
--
-- COMO OS CORPOS DE FUNÇÃO ABAIXO FORAM OBTIDOS
-- ---------------------------------------------
-- Extraídos de `pg_get_functiondef()` do banco VIVO em 2026-07-29, não
-- copiados de migration anterior. Copiar de migration antiga foi como a curva
-- de XP ficou revertida por 4 meses. A única alteração feita é a marcada com
-- `-- PONTE T0.5` — o resto é byte a byte o que está rodando.
--
-- Nota: pg_get_functiondef NÃO emite o `;` final depois de `$function$`.
-- Ele foi acrescentado à mão aqui.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A marca
-- ---------------------------------------------------------------------------

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS renderable boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.items.renderable IS
  'true quando todos os arquivos que o render exige existem em public/items/. '
  'Fail-closed: item novo nasce false e não entra em sorteio de baú até que '
  'a arte exista. Conferido contra o disco por verify:phase8.';

-- Os 32 itens que vestem o boneco hoje, calculados a partir de
-- public/items/ pela regra em src/lib/avatar/renderability.ts.
-- Distribuição: 8 comuns, 8 raros, 8 épicos, 8 lendários.
--   head        1  (Bandana Tática — única com as variantes -swap-*)
--   hand        8
--   background  8
--   frame       8  (renderiza como CSS por raridade, não precisa de arquivo)
--   pet         7
--   outfit      0  (nenhum uniforme tem as variantes por gênero)
UPDATE public.items SET renderable = true
WHERE id IN (
   2,
  17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32,
  33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47
);

-- ---------------------------------------------------------------------------
-- 2. claim_chest — o sorteio respeita a marca
-- ---------------------------------------------------------------------------

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
  v_item record;
  v_is_duplicate boolean := false;
  v_scrap_xp integer := 0;
  v_egg_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Busca baú do usuário em user_chests
  SELECT * INTO v_chest
  FROM public.user_chests
  WHERE id = p_chest_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baú não encontrado ou não pertence a você';
  END IF;

  -- Idempotência: se já foi aberto, retorna resultado anterior
  IF v_chest.claimed THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'item_id', v_chest.item_id,
      'rarity', v_chest.item_rarity
    );
  END IF;

  -- Roll de raridade (drop rates da Visão do Produto)
  v_roll := random();
  IF v_roll < 0.07 THEN
    v_rarity := 'legendary';  -- 7%
  ELSIF v_roll < 0.25 THEN
    v_rarity := 'epic';       -- 18%
  ELSIF v_roll < 0.55 THEN
    v_rarity := 'rare';       -- 30%
  ELSE
    v_rarity := 'common';     -- 45%
  END IF;

  -- Seleciona item aleatório da raridade
  -- Prioriza itens que o user NÃO tem
  SELECT i.* INTO v_item
  FROM public.items i
  WHERE i.rarity = v_rarity
    AND i.renderable  -- PONTE T0.5: item invisível não entra no sorteio
    AND NOT EXISTS (
      SELECT 1 FROM public.user_inventory ui
      WHERE ui.user_id = v_user_id AND ui.item_id = i.id
    )
  ORDER BY random()
  LIMIT 1;

  -- Se tem todos da raridade, pega qualquer um (será duplicata)
  IF NOT FOUND THEN
    SELECT i.* INTO v_item
    FROM public.items i
    WHERE i.rarity = v_rarity
      AND i.renderable  -- PONTE T0.5
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Fallback: qualquer item
  IF NOT FOUND THEN
    SELECT i.* INTO v_item
    FROM public.items i
    WHERE i.renderable  -- PONTE T0.5
    ORDER BY random()
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum item disponível no sistema';
  END IF;

  -- ========== DESVIO PET → OVO ==========
  IF v_item.slot = 'pet' THEN
    -- Criar ovo — _create_random_pet_egg escolhe o pet elegível real
    -- v_item NÃO é o pet do ovo; apenas indica que o roll caiu em "pet"
    v_egg_result := public._create_random_pet_egg(
      v_user_id, v_rarity, 'chest', p_chest_id::text
    );

    -- Marcar baú como claimed — NÃO gravar item_id para não vazar pet real
    UPDATE public.user_chests
    SET claimed = true, claimed_at = now(), item_rarity = v_rarity
    WHERE id = p_chest_id;

    -- Retorno NÃO contém dados do pet — apenas sinaliza que é ovo
    RETURN jsonb_build_object(
      'claimed', true,
      'is_egg', true,
      'scrapped', false,
      'scrapped_xp', 0
    );
  END IF;
  -- ========== FIM DESVIO PET ==========

  -- Lógica normal para itens não-pet
  -- Tenta adicionar ao inventário (idempotente via UNIQUE)
  INSERT INTO public.user_inventory (user_id, item_id, source)
  VALUES (v_user_id, v_item.id, 'chest')
  ON CONFLICT (user_id, item_id) DO NOTHING;

  -- Detectar duplicata: se ON CONFLICT pulou o insert, FOUND = false
  IF NOT FOUND THEN
    v_is_duplicate := true;
    -- Calcular XP de forja baseado na raridade do item
    v_scrap_xp := CASE v_item.rarity
      WHEN 'common'    THEN 5
      WHEN 'rare'      THEN 10
      WHEN 'epic'      THEN 20
      WHEN 'legendary' THEN 35
      ELSE 5
    END;

    -- Conceder XP de forja (idempotente via xp_grants UNIQUE)
    PERFORM public.grant_xp(
      p_amount := v_scrap_xp,
      p_source := 'item_scrap',
      p_source_id := 'scrap_chest_' || p_chest_id::text
    );
  END IF;

  -- Marca baú como aberto em user_chests
  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(),
      item_id = v_item.id, item_rarity = v_rarity
  WHERE id = p_chest_id;

  RETURN jsonb_build_object(
    'claimed', true,
    'is_egg', false,
    'rarity', v_rarity,
    'scrapped', v_is_duplicate,
    'scrapped_xp', CASE WHEN v_is_duplicate THEN v_scrap_xp ELSE 0 END,
    'item', jsonb_build_object(
      'id', v_item.id,
      'name', v_item.name,
      'slot', v_item.slot,
      'rarity', v_item.rarity,
      'image_url', v_item.image_url,
      'description', v_item.description
    )
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. _create_random_pet_egg — o ovo também respeita a marca
-- ---------------------------------------------------------------------------
--
-- Sem isto a ponte teria um furo: claim_chest sorteia "caiu em pet", e QUEM
-- escolhe o pet de verdade é esta função. Filtrar só no claim_chest deixaria
-- a criança chocar um ovo de 72 horas para receber um pet invisível — pior
-- que o baú, porque a espera aumenta a expectativa.

CREATE OR REPLACE FUNCTION public._create_random_pet_egg(p_user_id uuid, p_rarity text, p_source_type text, p_source_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pet record;
  v_has_hatching boolean;
  v_xp_bonus integer := 0;
  v_egg_id bigint;
  v_status text;
BEGIN
  -- Lock por usuário para evitar race condition
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Busca pet da raridade rolada que o usuário NÃO possui e NÃO tem reservado
  SELECT i.* INTO v_pet
  FROM public.items i
  WHERE i.slot = 'pet' AND i.rarity = p_rarity
    AND i.renderable  -- PONTE T0.5: pet invisível não vira ovo
    AND NOT EXISTS (
      SELECT 1 FROM public.user_inventory ui
      WHERE ui.user_id = p_user_id AND ui.item_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_eggs ue
      WHERE ue.user_id = p_user_id AND ue.pet_item_id = i.id
        AND ue.status IN ('hatching','queued')
    )
  ORDER BY random()
  LIMIT 1;

  -- Se não encontrou pet elegível da raridade → ovo de XP (sem fallback de raridade)
  IF NOT FOUND THEN
    v_xp_bonus := CASE p_rarity
      WHEN 'common'    THEN 15
      WHEN 'rare'      THEN 25
      WHEN 'epic'      THEN 40
      WHEN 'legendary' THEN 60
      ELSE 15
    END;
  END IF;

  -- Verificar se já tem ovo hatching
  SELECT EXISTS (
    SELECT 1 FROM public.user_eggs
    WHERE user_id = p_user_id AND status = 'hatching'
  ) INTO v_has_hatching;

  IF v_has_hatching THEN
    v_status := 'queued';
  ELSE
    v_status := 'hatching';
  END IF;

  INSERT INTO public.user_eggs (
    user_id, pet_item_id, rarity, status,
    hatch_start_at, xp_bonus, source_type, source_id
  )
  VALUES (
    p_user_id,
    CASE WHEN v_pet.id IS NOT NULL THEN v_pet.id ELSE NULL END,
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
-- 4. Privilégios
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE preserva os grants existentes, mas a migration
-- 20260725120000 revogou EXECUTE de _create_random_pet_egg para anon e
-- authenticated. Reafirmado aqui para que a propriedade não dependa da ordem
-- de aplicação — verify:privileges assere isso.

REVOKE EXECUTE ON FUNCTION public._create_random_pet_egg(uuid, text, text, text) FROM anon, authenticated;
