-- ============================================================
-- FIX v2: recursão indireta entre class_members e classes
-- ============================================================
-- Caminho de recursão:
--   class_members_select_teacher → EXISTS(classes) → classes_select_member → EXISTS(class_members) → loop
--
-- Fix: todas as policies que cruzam entre classes↔class_members
-- agora usam funções SECURITY DEFINER que bypassam RLS.
-- ============================================================

-- 1. Helper: checar se caller é teacher de uma turma (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  );
$$;

-- 2. classes_select_member: evitar subquery direta em class_members
DROP POLICY IF EXISTS classes_select_member ON public.classes;
CREATE POLICY classes_select_member ON public.classes
  FOR SELECT USING (public.is_member_of_class(id));

-- 3. class_members_select_teacher: evitar subquery direta em classes
DROP POLICY IF EXISTS class_members_select_teacher ON public.class_members;
CREATE POLICY class_members_select_teacher ON public.class_members
  FOR SELECT USING (public.is_teacher_of_class(class_id));

-- 4. class_members_delete_teacher: mesma correção
DROP POLICY IF EXISTS class_members_delete_teacher ON public.class_members;
CREATE POLICY class_members_delete_teacher ON public.class_members
  FOR DELETE USING (public.is_teacher_of_class(class_id));
