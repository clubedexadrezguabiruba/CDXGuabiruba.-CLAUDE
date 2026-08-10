-- ============================================================================
-- E.2 da troca de pilha — o baú paga XP direto, e a fila de ovos é esvaziada.
-- ============================================================================
--
-- O QUE ESTA MIGRATION É
-- ----------------------
-- É a decisão do **T9** (docs/achados.md, 2026-08-10) virando SQL. O T9 mediu,
-- em produção, que 55% dos baús caíam numa fila que choca **em série, 72h por
-- ovo** — e que sem pet a espera não tem conteúdo: o aluno espera três dias
-- para receber **a mesma moeda** que o baú `common` já entrega na hora.
--
-- A decisão do Doug foi uma quinta saída, fora das quatro que o achado listava:
--
--   > "o xp não deve vir dentro do ovo (hoje deve ser lendário e vir um pet).
--   >  temos que arrumar isso. xp vem direto do baú, como se fosse um item
--   >  comum."
--
-- O ovo **não morre, hiberna**. `hatch_egg` e `_create_random_pet_egg` ficam
-- inteiras e inalteradas — é por elas que o pet volta no Bloco 8 do doc 15,
-- quando houver arte. O que muda é uma linha de comportamento: `claim_chest`
-- deixa de chamar `_create_random_pet_egg`, e com isso **nenhum baú cria ovo**.
--
-- Medido antes de escrever esta migration, no banco vivo: `_create_random_pet_egg`
-- é a **única** função que insere em `user_eggs`, e `claim_chest` é a **única**
-- que a chama. Não há trigger em `user_eggs` nem policy de INSERT (a tabela tem
-- RLS ligado e **zero** policies). Cortar essa chamada é, portanto, cortar a
-- criação de ovo inteira — não a maior parte dela.
--
-- A ESCALA: 15 / 25 / 40 / 60
-- ---------------------------
-- É a escala que **já era a do ovo** desde o Bloco A. Os 5/10/20/35 que o
-- `common` pagava eram valor de consolação da forja de item repetido — o preço
-- de receber duplicata, não o preço de abrir um baú. A §1.1 do doc 20 já
-- registrava que 5 XP por baú é pouco. Agora que a espera saiu, o que sobra é o
-- valor, e o valor certo é o que a raridade sempre prometeu.
--
-- POR QUE `p_source` CONTINUA SENDO `'item_scrap'`
-- ------------------------------------------------
-- Não há mais item para sucatear, e o nome mente. Mas `grant_xp` valida a fonte
-- contra uma lista fechada — `'mission','achievement','streak_bonus',
-- 'item_scrap','egg_bonus'` — e acrescentar um nome exigiria **recolar o corpo
-- inteiro de `grant_xp`**, que é exatamente como a curva de XP foi revertida em
-- silêncio por 4 meses (o gate `verify:no-dup-rpc` existe por causa disso).
-- Trocar o rótulo de uma fonte não vale o risco de reescrever a função mais
-- perigosa do sistema. O `source_id` (`scrap_chest_<id>`) também fica: ele é a
-- chave de idempotência em `xp_grants`, e mudá-la abriria a porta para um baú
-- já pago pagar de novo.
--
-- OS 16 OVOS PRESOS — e por que não são 13
-- -----------------------------------------
-- O T9 falava em 13. Medido no banco vivo em 2026-08-10, antes desta migration,
-- são **16 ovos em voo** (5 `hatching` + 11 `queued`), **445 XP** presos, em
-- **5 contas** — não só a do Doug:
--
--     suzanfbaron 5 ovos/135 XP · teacherdoug001 5/140 · gbitelbrun 3/75
--     pafischersgrott 2/55 · englishwithteacherdoug 1/40
--
-- O 13 era número velho; o que vale é o medido. Eles são pagos aqui, e a fila
-- fica vazia.
--
-- POR QUE O PAGAMENTO PERSONIFICA EM VEZ DE ESCREVER O XP NA MÃO
-- ---------------------------------------------------------------
-- `grant_xp` faz cinco coisas, não uma: grava o ledger idempotente em
-- `xp_grants`, trava o usuário, roda o laço de level-up com a curva
-- `100 * 1.05^(n-1)`, atualiza `users.xp`/`level` e cria os baús de level-up.
-- Um `UPDATE users SET xp = xp + ...` aqui reimplementaria a curva num sexto
-- lugar — e é assim que a curva já divergiu uma vez.
--
-- Então o pagamento chama a própria `grant_xp`, definindo
-- `request.jwt.claims` por usuário dentro da transação (é de onde `auth.uid()`
-- lê — medido: `coalesce(request.jwt.claim.sub, request.jwt.claims->>'sub')`).
-- É a mesma personificação que o `verify:chest-pool` usa há dois blocos. A
-- chave de idempotência é a **mesma** que `hatch_egg` usaria (`egg_bonus_<id>`),
-- então nenhum ovo pago aqui pode ser pago de novo por outro caminho.
--
-- ⚠️ A ARMADILHA QUE O ENSAIO A SECO PEGOU
-- -----------------------------------------
-- `user_eggs_check1` exige, para `status = 'hatched'`, que **`hatch_start_at`
-- seja NOT NULL** — e os 11 ovos `queued` têm `hatch_start_at IS NULL`, porque
-- ovo na fila ainda não começou a chocar. Marcar `hatched` sem preencher a
-- coluna viola a constraint e derruba a migration inteira. Daí o
-- `COALESCE(hatch_start_at, created_at)` abaixo. É a irmã da lição 1 do Bloco B,
-- que caiu na `user_eggs_check` antiga pelo mesmo motivo: a tabela tem opinião
-- sobre estados intermediários.
--
-- O QUE **NÃO** MUDA AQUI, e é deliberado
-- ----------------------------------------
--  · `hatch_egg` e `_create_random_pet_egg` ficam **byte a byte como estão**.
--    Dormentes, não apagadas. O Bloco 8 reabre por elas.
--  · A Chocadeira, o `EggCard` e o `EggHatchingModal` continuam no código. Com
--    a fila vazia, `get_eggs` devolve `[]`, `eggCount` é 0 e os dois componentes
--    retornam `null` na primeira linha — medido antes: a tela publicada **não
--    quebra**, o painel simplesmente desaparece. O E.4 põe o "em breve" no lugar.
--  · A distribuição de raridade (7% / 18% / 30% / 45%) é a da Visão do Produto
--    e continua intacta. O que ela decide agora é **quanto**, não **quando**.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. claim_chest — XP na hora, em toda raridade. Nunca ovo.
-- ---------------------------------------------------------------------------
-- Corpo obtido de `pg_get_functiondef()` do banco vivo em 2026-08-10 (a versão
-- que o Bloco B deixou), não de migration antiga. As mudanças estão marcadas
-- com `-- E.2`.

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

  -- E.2: o ramo do ovo saiu inteiro. `_create_random_pet_egg` continua viva e
  -- correta; ela é que fica sem chamador até o pet voltar. Nenhum baú, de
  -- nenhuma das 5 fontes, cria ovo a partir daqui.
  --
  -- E.2: a escala do ovo (15/25/40/60) passa a valer para toda raridade, paga
  -- na hora. Era 5/10/20/35 e só o `common` chegava a ser pago.
  v_xp := CASE v_rarity
    WHEN 'common'    THEN 15
    WHEN 'rare'      THEN 25
    WHEN 'epic'      THEN 40
    WHEN 'legendary' THEN 60
    ELSE 15
  END;

  -- Idempotente por `xp_grants UNIQUE (user_id, source, source_id)` — a chave é
  -- o baú, então reabrir não paga duas vezes (e a guarda de `claimed` acima já
  -- barra antes).
  PERFORM public.grant_xp(
    p_amount := v_xp,
    p_source := 'item_scrap',
    p_source_id := 'scrap_chest_' || p_chest_id::text
  );

  UPDATE public.user_chests
  SET claimed = true, claimed_at = now(), item_rarity = v_rarity
  WHERE id = p_chest_id;

  -- O contrato de retorno é o que o cliente publicado já lê (`useChests.ts`):
  -- `rarity`, `is_egg` e `scrapped_xp`. `is_egg` continua saindo — agora sempre
  -- `false` — porque o cliente ramifica nele, e sumir com o campo trocaria uma
  -- decisão por um `undefined`.
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
-- 2. A fila é paga e esvaziada
-- ---------------------------------------------------------------------------
-- Todo ovo em voo (`hatching` ou `queued`) paga o próprio `xp_bonus` agora, por
-- `grant_xp`, e vira `hatched`. Nenhum aluno espera 72h por XP que a decisão
-- acabou de pôr na mão de quem abrir um baú novo.
--
-- `xp_bonus > 0` é garantido pela constraint `user_eggs_xp_positivo`, criada no
-- Bloco B — então `grant_xp` não pode reprovar por `p_amount <= 0` aqui.

DO $$
DECLARE
  v_egg record;
  v_ovos integer := 0;
  v_xp integer := 0;
  v_contas integer := 0;
BEGIN
  SELECT count(DISTINCT user_id) INTO v_contas
  FROM public.user_eggs
  WHERE status IN ('hatching', 'queued');

  FOR v_egg IN
    SELECT id, user_id, xp_bonus
    FROM public.user_eggs
    WHERE status IN ('hatching', 'queued')
    ORDER BY user_id, created_at, id
  LOOP
    -- `auth.uid()` lê daqui; `is_local := true` mantém tudo dentro da transação
    -- desta migration.
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_egg.user_id::text, 'role', 'authenticated')::text,
      true
    );

    -- Mesma chave que `hatch_egg` usaria: um ovo nunca paga duas vezes.
    PERFORM public.grant_xp(
      p_amount := v_egg.xp_bonus,
      p_source := 'egg_bonus',
      p_source_id := 'egg_bonus_' || v_egg.id::text
    );

    -- `hatch_start_at` precisa ser NOT NULL para `status = 'hatched'`
    -- (`user_eggs_check1`), e ovo `queued` nunca começou a chocar.
    UPDATE public.user_eggs
    SET status = 'hatched',
        hatch_start_at = COALESCE(hatch_start_at, created_at),
        hatched_at = now()
    WHERE id = v_egg.id;

    v_ovos := v_ovos + 1;
    v_xp := v_xp + v_egg.xp_bonus;
  END LOOP;

  -- Nada depois desta migration roda personificado.
  PERFORM set_config('request.jwt.claims', '', true);

  RAISE NOTICE 'E.2: % ovos pagos, % XP entregues, % contas. Fila vazia.',
    v_ovos, v_xp, v_contas;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. O que fica dormente
-- ---------------------------------------------------------------------------
-- `hatch_egg` e `_create_random_pet_egg` NÃO são tocadas por esta migration, e
-- não é esquecimento. Sem chamador, `_create_random_pet_egg` é código à espera;
-- `hatch_egg` idem, e ambas continuam corretas para o dia em que o ovo voltar
-- com pet dentro (Bloco 8 do doc 15). Apagá-las obrigaria a reescrevê-las do
-- zero depois, e o `EggHatchingModal` que as serve já está construído — é o
-- achado **D6**, que com esta decisão deixa de ser código morto e vira código à
-- espera.
--
-- A propriedade de segurança da `_create_random_pet_egg` (sem EXECUTE para
-- `anon`/`authenticated`, garantida desde a 20260725120000 e reafirmada no
-- Bloco A) continua valendo: nada aqui recria a função, então nada aqui mexe
-- nos grants dela.
