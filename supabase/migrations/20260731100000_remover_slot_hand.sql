-- ============================================================
-- BLOCO 2c — REMOÇÃO DO SLOT `hand`
-- ============================================================
-- Decisão D-E do docs/avatar/15-plano-ate-pronto.md, 2026-07-31.
--
-- POR QUÊ: o boneco kokeshi não tem braços nem mãos, e nunca terá — a proporção
-- 1:2 e a ausência de membros são o estilo. A alternativa considerada (virar um
-- emblema pintado no tronco) foi derrubada por medição, não por gosto: o tronco
-- mede 21,0 x 25,1 px a 56 px de canvas, e o traço do sistema já é 0,96 px ali.
-- Um emblema que não competisse com o uniforme caberia em ~7x7 px, e 6 relíquias
-- em 2 famílias x 3 tiers não se distinguem umas das outras nesse tamanho — que é
-- exatamente o que a definição 4 de "pronto" exige.
--
-- O canal de mérito que a relíquia ocupava passa para a MOLDURA (`frame`), que é
-- CSS na camada z=10, fora do SVG: não gasta superfície do boneco e lê a 56 px
-- porque é a borda do cartão inteiro.
--
-- ------------------------------------------------------------
-- A ORDEM IMPORTA, E O PASSO 1 É O QUE QUASE PASSOU DESPERCEBIDO
-- ------------------------------------------------------------
-- `user_inventory.item_id` e `user_equipped.item_id` são ON DELETE CASCADE, então
-- apagar as linhas de `items` já as levaria junto. Mas `users.avatar_config` é um
-- CACHE DERIVADO em jsonb, mantido só pelas RPCs `equip_item`/`unequip_slot` — e
-- nenhum CASCADE alcança um jsonb. Medido antes desta migration: 2 usuários com
-- a chave "hand" no cache, apontando para itens que estavam prestes a deixar de
-- existir. É a mesma família do `UPDATE` sem `UPSERT` da patente: a escrita que o
-- banco não faz sozinho e ninguém lembra de fazer à mão.
--
-- `user_chests.item_id` é a outra ponta: ele NÃO tem ON DELETE, então o DELETE em
-- `items` falharia nas 11 linhas de baú já sorteado. Ele vira NULL — o baú
-- continua `claimed`, que é o que impede resgatar de novo; o que se perde é só o
-- registro de qual relíquia saiu, e ela não existe mais.
--
-- Estado medido em produção em 2026-07-31, antes de rodar:
--   items com slot='hand' ......... 8 (ids 17-24)
--   conquistas apontando para eles . 0
--   user_inventory ................ 12 linhas, 7 usuários
--   user_equipped ................. 2
--   user_chests ................... 11
--   users.avatar_config com 'hand' . 2
--
-- ------------------------------------------------------------
-- ESTE ARQUIVO FOI EDITADO DEPOIS DE APLICADO, E O MOTIVO ESTÁ AQUI
-- ------------------------------------------------------------
-- A regra do projeto é não modificar migration já aplicada. A exceção está
-- registrada porque o arquivo original era uma ARMADILHA para o próximo
-- ambiente, não porque o conteúdo estava errado.
--
-- Ele abria com `BEGIN;` e fechava com `COMMIT;`. O `apply-migration.ts` usa
-- postgres.js, e a biblioteca RECUSA transação explícita fora de `sql.begin`:
-- ela lançou `UNSAFE_TRANSACTION` — depois de já ter mandado o texto ao
-- servidor. Resultado medido: o PostgreSQL executou e confirmou tudo, e o
-- terminal imprimiu um erro. **Cara de fracasso, resultado de sucesso**, que é
-- o pior par possível: convida a rodar de novo.
--
-- Tirar as duas linhas não afrouxa nada. Um lote de comandos enviado numa só
-- mensagem roda dentro de uma transação IMPLÍCITA — ou tudo, ou nada, do mesmo
-- jeito. É por isso que as outras 69 migrations deste repositório nunca
-- precisaram de `BEGIN`: esta era a única que tinha, e era a única que falhava.
-- ============================================================

-- ------------------------------------------------------------
-- 1. O CACHE — antes de tudo, porque nenhum CASCADE o alcança
-- ------------------------------------------------------------
UPDATE public.users
SET avatar_config = avatar_config - 'hand'
WHERE avatar_config ? 'hand';

-- ------------------------------------------------------------
-- 2. As referências que não cascateiam
-- ------------------------------------------------------------
UPDATE public.user_chests
SET item_id = NULL
WHERE item_id IN (SELECT id FROM public.items WHERE slot = 'hand');

-- ------------------------------------------------------------
-- 3. As que cascateiam — explícitas mesmo assim
-- ------------------------------------------------------------
-- Depender do CASCADE aqui funcionaria, e deixaria a auditoria desta migration
-- dependente de ler a definição de outra tabela. Explícito custa duas linhas.
DELETE FROM public.user_equipped WHERE slot = 'hand';

DELETE FROM public.user_inventory
WHERE item_id IN (SELECT id FROM public.items WHERE slot = 'hand');

-- ------------------------------------------------------------
-- 4. Os itens
-- ------------------------------------------------------------
DELETE FROM public.items WHERE slot = 'hand';

-- ------------------------------------------------------------
-- 5. Os dois CHECK
-- ------------------------------------------------------------
ALTER TABLE public.items DROP CONSTRAINT items_slot_check;
ALTER TABLE public.items ADD CONSTRAINT items_slot_check
  CHECK (slot IN ('head', 'outfit', 'background', 'frame', 'pet'));

ALTER TABLE public.user_equipped DROP CONSTRAINT user_equipped_slot_check;
ALTER TABLE public.user_equipped ADD CONSTRAINT user_equipped_slot_check
  CHECK (slot IN ('head', 'outfit', 'background', 'frame', 'pet'));

-- ------------------------------------------------------------
-- 6. A SEGUNDA CÓPIA DO CHECK — a lista dentro de unequip_slot
-- ------------------------------------------------------------
-- O `verify:avatar-db` compara esta lista com o CHECK justamente porque duas
-- cópias divergem. Corpo idêntico ao de 20260314100000, só sem 'hand'.
CREATE OR REPLACE FUNCTION public.unequip_slot(p_slot text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_config jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Validar slot
  IF p_slot NOT IN ('head', 'outfit', 'background', 'frame', 'pet') THEN
    RAISE EXCEPTION 'Slot inválido: %', p_slot;
  END IF;

  -- 2. Remover equipamento do slot
  DELETE FROM public.user_equipped
  WHERE user_id = v_user_id AND slot = p_slot;

  -- 3. Atualizar avatar_config
  SELECT jsonb_object_agg(ue.slot, ue.item_id)
  INTO v_config
  FROM public.user_equipped ue
  WHERE ue.user_id = v_user_id;

  UPDATE public.users SET avatar_config = COALESCE(v_config, '{}')
  WHERE id = v_user_id;

  RETURN jsonb_build_object('unequipped', true, 'slot', p_slot);
END;
-- O `SET search_path` precisa ser reescrito aqui: `CREATE OR REPLACE` substitui a
-- definição inteira da função, e o `ALTER FUNCTION ... SET search_path` de
-- 20260725120000 se perderia em silêncio. Os GRANTs, ao contrário, sobrevivem ao
-- REPLACE — e por isso esta migration não os toca: mexer neles seria mudar a
-- postura de segurança de carona numa remoção de slot.
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
