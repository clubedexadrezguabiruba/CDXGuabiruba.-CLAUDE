-- ============================================================
-- Fix: denormalizar display_name no event_data do class_feed
-- Problema: JOIN com users falha por RLS, mostrando "Jogador"
-- Solução: emit_class_feed() injeta display_name no event_data
-- ============================================================

-- 1. Recria emit_class_feed com display_name embutido
CREATE OR REPLACE FUNCTION public.emit_class_feed(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb
)
RETURNS void AS $$
DECLARE
  v_name text;
BEGIN
  SELECT display_name INTO v_name FROM public.users WHERE id = p_user_id;

  INSERT INTO public.class_feed (class_id, user_id, event_type, event_data)
  SELECT cm.class_id, p_user_id, p_event_type,
         p_event_data || jsonb_build_object('display_name', COALESCE(v_name, 'Jogador'))
  FROM public.class_members cm
  WHERE cm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill eventos existentes que não têm display_name
UPDATE public.class_feed cf
SET event_data = cf.event_data || jsonb_build_object('display_name', COALESCE(u.display_name, 'Jogador'))
FROM public.users u
WHERE u.id = cf.user_id
  AND cf.event_data->>'display_name' IS NULL;
