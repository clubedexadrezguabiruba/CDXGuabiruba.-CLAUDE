-- ============================================================
-- FIX: infinite recursion in class_members RLS policy
-- ============================================================
-- A policy class_members_select_member fazia subquery em class_members
-- dentro de si mesma, causando recursão infinita no Postgres.
-- Fix: usar função SECURITY DEFINER que bypassa RLS para o check.
-- ============================================================

-- 1. Helper SECURITY DEFINER — verifica se caller é membro de uma turma
--    Roda como definer (bypassa RLS), quebrando a recursão.
CREATE OR REPLACE FUNCTION public.is_member_of_class(p_class_id bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND user_id = auth.uid()
  );
$$;

-- 2. Recriar a policy problemática usando a função helper
DROP POLICY IF EXISTS class_members_select_member ON public.class_members;

CREATE POLICY class_members_select_member ON public.class_members
  FOR SELECT USING (public.is_member_of_class(class_id));

-- 3. Também corrigir classes_select_member que causa recursão indireta:
--    class_members_select_teacher → classes → classes_select_member → class_members → loop!
-- Helper SECURITY DEFINER para checar teacher_id sem RLS
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  );
$$;

-- 3a. classes_select_member: evitar subquery em class_members (recursão indireta)
DROP POLICY IF EXISTS classes_select_member ON public.classes;
CREATE POLICY classes_select_member ON public.classes
  FOR SELECT USING (public.is_member_of_class(id));

-- 3b. class_members_select_teacher: evitar subquery em classes (recursão indireta)
DROP POLICY IF EXISTS class_members_select_teacher ON public.class_members;
CREATE POLICY class_members_select_teacher ON public.class_members
  FOR SELECT USING (public.is_teacher_of_class(class_id));

-- 3c. class_members_delete_teacher: mesma correção
DROP POLICY IF EXISTS class_members_delete_teacher ON public.class_members;
CREATE POLICY class_members_delete_teacher ON public.class_members
  FOR DELETE USING (public.is_teacher_of_class(class_id));
