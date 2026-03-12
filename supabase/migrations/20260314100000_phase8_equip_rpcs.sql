-- ============================================================
-- FASE 8 — RPCs de equipar/desequipar + correção de RLS
-- ============================================================
-- user_equipped tinha INSERT/UPDATE/DELETE via RLS direto,
-- sem validar posse do item nem compatibilidade de slot.
-- Agora toda escrita passa por RPCs com SECURITY DEFINER.
-- ============================================================

-- 1. Revogar escrita direta em user_equipped
DROP POLICY IF EXISTS equipped_insert_own ON public.user_equipped;
DROP POLICY IF EXISTS equipped_update_own ON public.user_equipped;
DROP POLICY IF EXISTS equipped_delete_own ON public.user_equipped;

-- SELECT policies mantidas (own + classmate)
-- equipped_select_own: user_id = auth.uid()
-- equipped_select_classmate: shares_class_with(user_id)

-- ============================================================
-- 2. RPC equip_item — equipar item validando posse e slot
-- ============================================================
CREATE OR REPLACE FUNCTION public.equip_item(p_item_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_item record;
  v_config jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Buscar item e validar que existe
  SELECT * INTO v_item FROM public.items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item não encontrado';
  END IF;

  -- 2. Validar que o usuário possui o item
  IF NOT EXISTS (
    SELECT 1 FROM public.user_inventory
    WHERE user_id = v_user_id AND item_id = p_item_id
  ) THEN
    RAISE EXCEPTION 'Você não possui este item';
  END IF;

  -- 3. UPSERT no slot correto (items.slot determina o slot, não o client)
  INSERT INTO public.user_equipped (user_id, slot, item_id, equipped_at)
  VALUES (v_user_id, v_item.slot, p_item_id, now())
  ON CONFLICT (user_id, slot)
  DO UPDATE SET item_id = EXCLUDED.item_id, equipped_at = EXCLUDED.equipped_at;

  -- 4. Atualizar avatar_config como cache derivado
  SELECT jsonb_object_agg(ue.slot, ue.item_id)
  INTO v_config
  FROM public.user_equipped ue
  WHERE ue.user_id = v_user_id;

  UPDATE public.users SET avatar_config = COALESCE(v_config, '{}')
  WHERE id = v_user_id;

  -- 5. Retornar resultado
  RETURN jsonb_build_object(
    'equipped', true,
    'slot', v_item.slot,
    'item', jsonb_build_object(
      'id', v_item.id,
      'name', v_item.name,
      'slot', v_item.slot,
      'rarity', v_item.rarity,
      'image_url', v_item.image_url
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. RPC unequip_slot — desequipar slot
-- ============================================================
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
  IF p_slot NOT IN ('head', 'outfit', 'hand', 'background', 'frame', 'pet') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
