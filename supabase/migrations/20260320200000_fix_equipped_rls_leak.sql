-- Fix: remover policy que vaza equipamentos de colegas no perfil
-- A policy equipped_select_classmate faz a query do useInventory retornar
-- itens equipados de colegas, que aparecem como itens fantasma no perfil.
-- Visualização de avatar de colegas já é coberta por get_public_profile() (SECURITY DEFINER).
DROP POLICY IF EXISTS equipped_select_classmate ON public.user_equipped;
