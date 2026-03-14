-- Fix: remover policy que vaza inventário de colegas de turma
-- A policy inventory_select_classmate permitia que qualquer colega de turma
-- visse todo o inventário de outros colegas. Visualização de avatar equipado
-- já é coberta por user_equipped + get_public_profile().
DROP POLICY IF EXISTS inventory_select_classmate ON public.user_inventory;
