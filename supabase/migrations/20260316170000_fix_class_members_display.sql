-- ============================================================
-- Fix: RPC para buscar membros da turma com display_name
-- Problema: RLS da tabela users bloqueia alunos de ver colegas
-- Solução: SECURITY DEFINER bypassa RLS, inclui professor
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_class_members(p_class_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_member boolean;
  v_teacher_id uuid;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verificar acesso
  SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;
  IF v_teacher_id IS NULL THEN RAISE EXCEPTION 'Turma não encontrada'; END IF;

  v_is_member := (v_user_id = v_teacher_id) OR EXISTS (
    SELECT 1 FROM public.class_members WHERE class_id = p_class_id AND user_id = v_user_id
  );
  IF NOT v_is_member THEN RAISE EXCEPTION 'Sem acesso'; END IF;

  -- Buscar professor + membros (professor primeiro)
  SELECT jsonb_agg(row_data ORDER BY is_teacher DESC, joined_at ASC) INTO v_result
  FROM (
    -- Professor
    SELECT jsonb_build_object(
      'user_id', u.id,
      'display_name', u.display_name,
      'level', u.level,
      'puzzle_rating', u.puzzle_rating,
      'is_teacher', true,
      'joined_at', c.created_at
    ) AS row_data, true AS is_teacher, c.created_at AS joined_at
    FROM public.users u
    JOIN public.classes c ON c.teacher_id = u.id
    WHERE c.id = p_class_id

    UNION ALL

    -- Alunos
    SELECT jsonb_build_object(
      'user_id', u.id,
      'display_name', u.display_name,
      'level', u.level,
      'puzzle_rating', u.puzzle_rating,
      'is_teacher', false,
      'joined_at', cm.joined_at
    ), false, cm.joined_at
    FROM public.class_members cm
    JOIN public.users u ON u.id = cm.user_id
    WHERE cm.class_id = p_class_id
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
