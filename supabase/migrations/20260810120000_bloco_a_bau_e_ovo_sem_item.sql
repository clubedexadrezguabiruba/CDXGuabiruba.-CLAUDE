-- ============================================================================
-- Bloco A da troca de pilha — o baú e o ovo param de depender de `items`.
-- ============================================================================
--
-- POR QUE ESTA MIGRATION VEM ANTES DE TUDO
-- ----------------------------------------
-- O Doug decidiu em 2026-08-10 apagar todo o catálogo de itens do avatar v2
-- (docs/avatar/20-troca-de-pilha-plano.md). Só que `claim_chest` NÃO degrada
-- para XP quando o catálogo está vazio: ela faz
--
--     RAISE EXCEPTION 'Nenhum item disponível no sistema'
--
-- (20260729120000_avatar_v4_ponte_baus.sql:154-156). Com `items` vazia, a
-- transação inteira falha, o baú fica eternamente `claimed = false` e a criança
-- não consegue abrir. O baú é a ÚNICA fonte de item do produto — não há loja —
-- e CINCO coisas dão baú: cadastro, subir de nível, missões do dia, conquista e
-- ofensiva. Apagar item antes de consertar isto para o jogo inteiro.
--
-- Esta migration corta a dependência. NADA é apagado aqui; o Bloco B é que
-- apaga.
--
-- A REGRA NOVA DO BAÚ, E DE ONDE ELA SAIU
-- ---------------------------------------
-- Medido em 2026-08-10, rodando o `claim_chest` VIVO 300 vezes em transação
-- revertida (`.scratch/medir-taxa-ovo.ts`): 55,7% dos baús já viram ovo hoje, e
-- a raridade decide quase sozinha —
--
--     common 13,1% | rare 97,7% | epic 94,1% | legendary 88,9%
--
-- A regra abaixo — `common` paga XP na hora, `rare` para cima vira ovo — dá
-- 55% de ovos contra os 55,7% medidos. **Não é chute: é a taxa de hoje escrita
-- como regra**, em vez de emergir por acidente de quais itens são renderáveis.
--
-- O que a criança perde: hoje um baú `common` entrega um COLECIONÁVEL em 87%
-- dos casos, e amanhã entrega 5 XP. Não há como evitar — não existem mais
-- itens. Os 5/10/20/35 eram valor de consolação da forja, e viram o valor
-- principal. Registrado como ressalva no doc 20, §1.1.
--
-- COMO OS CORPOS FORAM OBTIDOS
-- ----------------------------
-- Partindo de `pg_get_functiondef()` do banco vivo em 2026-08-10, não de
-- migration antiga — foi copiando de migration antiga que a curva de XP ficou
-- revertida por 4 meses. As mudanças estão marcadas com `-- BLOCO A`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. claim_chest — XP na hora, ou ovo. Nunca item, nunca exceção.
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

  -- Idempotência: se já foi aberto, devolve o resultado anterior.
  -- `item_id` continua no retorno por compatibilidade com baús antigos, que
  -- têm o campo preenchido. Baú novo grava NULL ali.
  IF v_chest.claimed THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'item_id', v_chest.item_id,
      'rarity', v_chest.item_rarity
    );
  END IF;

  -- Roll de raridade — inalterado (drop rates da Visão do Produto)
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

  -- BLOCO A: o sorteio de item saiu inteiro. Não há mais consulta a `items`,
  -- e por isso não há mais o `RAISE EXCEPTION` de pool vazio.
  IF v_rarity <> 'common' THEN
    -- rare / epic / legendary → ovo (a recompensa que vale a espera)
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

  -- common → XP na hora, pela régua da forja
  v_xp := CASE v_rarity
    WHEN 'common'    THEN 5
    WHEN 'rare'      THEN 10
    WHEN 'epic'      THEN 20
    WHEN 'legendary' THEN 35
    ELSE 5
  END;

  -- Idempotente por `xp_grants UNIQUE` — a chave é o baú, então reabrir não
  -- paga duas vezes (e a guarda de `claimed` acima já barra antes).
  PERFORM public.grant_xp(
    p_amount := v_xp,
    p_source := 'item_scrap',
    p_source_id := 'scrap_chest_' || p_chest_id::text
  );

  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(), item_rarity = v_rarity
  WHERE id = p_chest_id;

  -- `is_xp` é o campo NOVO que o cliente usa para escolher a animação. Os
  -- `scrapped`/`scrapped_xp` seguem preenchidos porque a fase 5 do
  -- ChestOpeningModal já lê deles, e reaproveitá-la é o que evita inventar
  -- uma segunda tela de "ganhou XP".
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

-- ---------------------------------------------------------------------------
-- 2. _create_random_pet_egg — sempre ovo de XP
-- ---------------------------------------------------------------------------
--
-- O NOME MENTE A PARTIR DE AGORA, e isso é deliberado: renomear obrigaria a
-- mexer em `claim_chest`, no `rpc-baseline.json` e nos gates no mesmo passo em
-- que se troca o comportamento — duas mudanças embaralhadas. O rename vai no
-- Bloco B, junto com o `DROP` do slot `pet`.
--
-- O ramo de "ovo de XP" já existia aqui como fallback (quando não havia pet
-- elegível da raridade). Ele passa a ser o único caminho: some a consulta a
-- `items`, some o filtro `renderable`, some a checagem de pet já reservado.

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

  -- BLOCO A: sem consulta a `items`. O ovo é sempre de XP.
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

  INSERT INTO public.user_eggs (
    user_id, pet_item_id, rarity, status,
    hatch_start_at, xp_bonus, source_type, source_id
  )
  VALUES (
    p_user_id,
    NULL,               -- BLOCO A: nunca mais reserva pet
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
-- 3. hatch_egg — sempre XP, e defensiva com os ovos legados
-- ---------------------------------------------------------------------------
--
-- O PROBLEMA QUE ESTA PARTE RESOLVE, e que só aparece depois do Bloco B:
-- ovos criados ANTES desta migration têm `pet_item_id` preenchido e
-- `xp_bonus = 0`. Quando o Bloco B anular o `pet_item_id`, esses ovos cairiam
-- no ramo de XP com bônus zero — e `grant_xp` reprova `p_amount <= 0` com
-- 'XP deve ser positivo'. A criança ficaria com um ovo impossível de chocar.
--
-- Por isso o valor é recalculado da raridade quando `xp_bonus` não for
-- positivo, em vez de confiar na coluna.

CREATE OR REPLACE FUNCTION public.hatch_egg(p_egg_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_egg record;
  v_elapsed interval;
  v_next_egg_id bigint;
  v_xp integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_egg
  FROM public.user_eggs
  WHERE id = p_egg_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ovo não encontrado';
  END IF;

  IF v_egg.status = 'hatched' THEN
    RETURN jsonb_build_object('already_hatched', true);
  END IF;

  IF v_egg.status != 'hatching' THEN
    RAISE EXCEPTION 'Este ovo ainda está na fila';
  END IF;

  -- 72h server-side, anti-cheat — inalterado
  v_elapsed := now() - v_egg.hatch_start_at;
  IF v_elapsed < interval '72 hours' THEN
    RAISE EXCEPTION 'O ovo ainda não está pronto (faltam % horas)',
      round(EXTRACT(EPOCH FROM (interval '72 hours' - v_elapsed)) / 3600);
  END IF;

  -- BLOCO A: sem consulta a `items`. Todo ovo paga XP.
  v_xp := v_egg.xp_bonus;
  IF v_xp IS NULL OR v_xp <= 0 THEN
    v_xp := CASE v_egg.rarity
      WHEN 'common'    THEN 15
      WHEN 'rare'      THEN 25
      WHEN 'epic'      THEN 40
      WHEN 'legendary' THEN 60
      ELSE 15
    END;
  END IF;

  PERFORM public.grant_xp(
    p_amount := v_xp,
    p_source := 'egg_bonus',
    p_source_id := 'egg_bonus_' || p_egg_id::text
  );

  UPDATE public.user_eggs
  SET status = 'hatched', hatched_at = now()
  WHERE id = p_egg_id;

  -- Próximo da fila (FIFO por created_at, id) — inalterado
  SELECT id INTO v_next_egg_id
  FROM public.user_eggs
  WHERE user_id = v_user_id AND status = 'queued'
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF v_next_egg_id IS NOT NULL THEN
    UPDATE public.user_eggs
    SET status = 'hatching', hatch_start_at = now()
    WHERE id = v_next_egg_id;
  END IF;

  RETURN jsonb_build_object(
    'hatched', true,
    'is_xp_egg', true,
    'xp_bonus', v_xp,
    'pet', NULL,
    'next_egg_started', (v_next_egg_id IS NOT NULL)
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Privilégios
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE preserva grants, mas a 20260725120000 revogou EXECUTE de
-- _create_random_pet_egg para anon e authenticated. Reafirmado aqui para que a
-- propriedade não dependa da ordem de aplicação — verify:privileges assere.

REVOKE EXECUTE ON FUNCTION public._create_random_pet_egg(uuid, text, text, text) FROM anon, authenticated;
