-- ============================================================================
-- B6 — `claim_chest` v3: o baú volta a dar PEÇA
-- ============================================================================
--
-- É o bloco que fecha a economia da virada. Desde o E.2 (2026-08-10) o baú só
-- paga XP: o ramo do item saiu junto com a pilha v2, e a mecânica de raridade
-- ficou órfã de coisa para sortear. O traje devolve o objeto — **39 das 40 peças
-- do catálogo saem daqui** (doc 22 §1), e o baú passa a ser a única porta.
--
-- Ver docs/avatar/21-slots-do-avatar-plano.md §4 (o desenho) e §0.6 (bloco B6).
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- O desenho, e por que ele é este
-- ---------------------------------------------------------------------------
--
-- **1. Sorteia a RARIDADE, com as chances de hoje intactas** — 7% legendary, 18%
-- epic, 30% rare, 45% common. Elas não se mexem: a pirâmide do catálogo (doc 22
-- §2: 17/12/7/3 peças) foi construída para espelhá-las, e mudar um dos dois lados
-- sem o outro desalinha o tempo esperado até completar uma faixa.
--
-- **2. Monta o POOL daquela raridade**, e o XP é um prêmio dentro dele:
--
--   - peças de baú **inéditas** para aquele aluno (`origem = 'bau'`, sem linha em
--     `avatar_guarda_roupa`) — de qualquer slot, não só traje;
--   - **o prêmio "XP"**, presente só no pool `common`, pagando os 15 de hoje.
--
-- O XP como prêmio comum é decisão do Doug, e é o que mantém a lição da T9 — *o
-- baú nunca sai de mãos vazias* — sem criar duas economias. Nas raridades altas
-- ele não entra: um baú lendário que paga 60 de XP em vez de dar a peça lendária
-- é a decepção que a raridade existe para não produzir.
--
-- **3. Sorteio UNIFORME dentro do pool.** Não há peso por peça: quem já pesa é a
-- raridade, e um segundo peso aqui seria uma régua que ninguém consegue conferir.
--
-- **4. Concede:** linha no guarda-roupa, ou `grant_xp`.
--
-- **5. POOL VAZIO → XP da raridade** (15/25/40/60, a escala do E.2). Este é o
-- ramo que faz **seeds e função pousarem em qualquer ordem**: aplicar esta
-- migration num banco sem nenhuma peça de baú não quebra nada, o baú continua
-- pagando exatamente o que pagava, e o catálogo esgotado degrada sozinho quando o
-- aluno tiver tudo.
--
-- **O ovo NÃO entra ainda.** O doc 21 §4 o prevê nas raridades altas, mas ele
-- depende de `user_eggs.pet_slug` e de pet inédito, que são o Bloco 8.
-- `_create_random_pet_egg` continua viva, dormente e **sem chamador** — que é o
-- que `verify:chest-pool` cobra desde o E.2, e continua cobrando.
--
-- ---------------------------------------------------------------------------
-- A IDEMPOTÊNCIA, e ela é a parte que mais pode errar em silêncio
-- ---------------------------------------------------------------------------
--
-- A guarda de `claimed` continua sendo a primeira barreira, e ela devolve o
-- resultado anterior sem reexecutar nada. Por baixo dela:
--
--  - **o XP** por `xp_grants UNIQUE (user_id, source, source_id)`, com a chave
--    sendo o baú — reabrir não paga duas vezes;
--  - **a peça** por `ON CONFLICT DO NOTHING` no guarda-roupa, cuja PK é
--    `(user_id, slug)`. Duas chamadas concorrentes no mesmo baú não criam duas
--    linhas, e a segunda não erra.
--
-- `p_source` continua `'item_scrap'` mesmo mentindo o nome. Trocá-lo obriga a
-- recolar o corpo de `grant_xp`, e o motivo de não fazer isso está escrito em
-- `20260810180000_e2_bau_paga_xp_direto.sql:37-49`.
--
-- ---------------------------------------------------------------------------
-- O CONTRATO DE RETORNO — o cliente publicado já lê três chaves
-- ---------------------------------------------------------------------------
--
-- `useChests.ts` ramifica em `already_claimed`, `is_egg` e lê `rarity` e
-- `scrapped_xp`. As quatro **continuam saindo**, com os mesmos tipos: `is_egg`
-- sempre `false` (o ovo é do Bloco 8), e `scrapped_xp` = 0 quando o prêmio é peça.
--
-- Entram **duas chaves novas e opcionais**: `item_slug` e `item_slot`. Cliente
-- antigo as ignora e continua mostrando a tela de XP com 0 — feio, e é por isso
-- que o `ChestOpeningModal` entra no mesmo bloco. O que ele NÃO faz é quebrar.

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
  v_pool_n integer;
  v_sorteio integer;
  -- DUAS VARIÁVEIS ESCALARES, e não um `record` — o ensaio a seco reprovou a
  -- primeira versão por causa disso: `record` que nunca recebeu um `SELECT INTO`
  -- lança `record "v_peca" is not assigned yet` ao ser LIDO, e o ramo do XP lê
  -- `v_peca.slug` para decidir. Escalar nasce NULL, que é a resposta certa para
  -- "não sorteou peça". Medido: 60 aberturas quebravam na primeira.
  v_slug text;
  v_slot text;
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
  IF v_chest.claimed THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'rarity', v_chest.item_rarity
    );
  END IF;

  -- Roll de raridade — inalterado (drop rates da Visão do Produto).
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

  -- A escala do E.2, que continua valendo para o prêmio "XP" e para o fallback.
  v_xp := CASE v_rarity
    WHEN 'common'    THEN 15
    WHEN 'rare'      THEN 25
    WHEN 'epic'      THEN 40
    WHEN 'legendary' THEN 60
    ELSE 15
  END;

  -- ------------------------------------------------------------------
  -- O POOL: peças inéditas daquela raridade
  -- ------------------------------------------------------------------
  --
  -- `origem = 'bau'` já garante `raridade IS NOT NULL` pelo CHECK
  -- `avatar_catalogo_origem_coerente`, então não há linha sem faixa a tratar.
  SELECT count(*) INTO v_pool_n
  FROM public.avatar_catalogo c
  WHERE c.origem = 'bau'
    AND c.raridade = v_rarity
    AND NOT EXISTS (
      SELECT 1 FROM public.avatar_guarda_roupa g
      WHERE g.user_id = v_user_id AND g.slug = c.slug
    );

  -- O prêmio "XP" ocupa UMA vaga no pool `common`, e concorre de igual para
  -- igual com as peças. Com 17 peças comuns inéditas, ele sai em 1 de 18.
  IF v_rarity = 'common' THEN
    v_pool_n := v_pool_n + 1;
  END IF;

  -- ------------------------------------------------------------------
  -- O sorteio
  -- ------------------------------------------------------------------
  --
  -- `v_pool_n = 0` só acontece fora do `common` (que sempre tem o XP dentro), e
  -- é o pool vazio: nenhuma peça inédita naquela raridade. Aí cai no fallback,
  -- que é o comportamento de hoje inteiro.
  IF v_pool_n = 0 THEN
    v_sorteio := 0;  -- força o ramo do XP
  ELSE
    v_sorteio := floor(random() * v_pool_n)::integer;  -- 0 .. v_pool_n-1
  END IF;

  -- No `common`, o índice 0 é o prêmio XP e os demais são peças; fora dele, todos
  -- os índices são peças. Com `v_pool_n = 0` nenhuma peça é buscada e `v_slug`
  -- fica NULL, que é o que manda no `IF` abaixo.
  IF v_pool_n > 0 AND NOT (v_rarity = 'common' AND v_sorteio = 0) THEN
    SELECT c.slug, c.slot INTO v_slug, v_slot
    FROM public.avatar_catalogo c
    WHERE c.origem = 'bau'
      AND c.raridade = v_rarity
      AND NOT EXISTS (
        SELECT 1 FROM public.avatar_guarda_roupa g
        WHERE g.user_id = v_user_id AND g.slug = c.slug
      )
    -- A ordem é ESTÁVEL de propósito: `slug` é único, e sem `ORDER BY` o
    -- `OFFSET` percorreria uma ordem que o planner escolhe. Um sorteio que
    -- depende do plano de execução não é sorteio, é acaso.
    ORDER BY c.slug
    OFFSET (CASE WHEN v_rarity = 'common' THEN v_sorteio - 1 ELSE v_sorteio END)
    LIMIT 1;
  END IF;

  -- ------------------------------------------------------------------
  -- A concessão
  -- ------------------------------------------------------------------
  IF v_slug IS NOT NULL THEN
    -- `ON CONFLICT DO NOTHING` sobre a PK `(user_id, slug)`: duas chamadas
    -- concorrentes no mesmo baú não criam duas linhas, e a segunda não erra.
    INSERT INTO public.avatar_guarda_roupa (user_id, slug, fonte)
    VALUES (v_user_id, v_slug, 'bau')
    ON CONFLICT DO NOTHING;

    UPDATE public.user_chests
    SET claimed = true, claimed_at = now(), item_rarity = v_rarity
    WHERE id = p_chest_id;

    RETURN jsonb_build_object(
      'claimed', true,
      'is_egg', false,
      'is_xp', false,
      'rarity', v_rarity,
      'scrapped', false,
      'scrapped_xp', 0,
      'item_slug', v_slug,
      'item_slot', v_slot
    );
  END IF;

  -- O ramo do XP: o prêmio comum sorteado, ou o pool vazio. Os dois pagam a
  -- escala da raridade — e é por isso que um pool esgotado não é castigo.
  --
  -- Idempotente por `xp_grants UNIQUE (user_id, source, source_id)`.
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

COMMENT ON FUNCTION public.claim_chest(bigint) IS
  'Abre um baú. v3 desde o B6 da virada (2026-08-13): sorteia a raridade com as '
  'chances de sempre (45/30/18/7), monta o pool daquela faixa com as peças de '
  'origem=bau INÉDITAS para o aluno mais — só no common — o prêmio XP, e sorteia '
  'uniforme dentro dele. Pool vazio paga o XP da raridade (15/25/40/60), que é o '
  'que faz seeds e função pousarem em qualquer ordem. O ovo é do Bloco 8: '
  '_create_random_pet_egg continua viva e SEM CHAMADOR. Idempotente por claimed, '
  'por xp_grants UNIQUE e por ON CONFLICT no guarda-roupa. Vigiada por '
  'npm run verify:chest-pool.';
