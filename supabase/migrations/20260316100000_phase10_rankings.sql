-- ============================================================
-- FASE 10 — QUADRO DE HONRA E PERFIL PÚBLICO
-- ============================================================
-- 1. mask_display_name(text) — máscara LGPD server-side
-- 2. get_ranking_with_position(p_type, p_limit) — ranking global + posição do caller
-- 3. get_public_profile(p_user_id) — perfil público com escopo mínimo
-- 4. get_class_ranking(p_class_id, p_type, p_limit) — ranking por turma
-- ============================================================

-- ============================================================
-- 1. mask_display_name — LGPD: primeiro nome + inicial do sobrenome
-- ============================================================
-- "João Pedro Silva" → "João S."
-- "Maria" → "Maria"
-- NULL → "Jogador"
CREATE OR REPLACE FUNCTION public.mask_display_name(p_name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_name IS NULL OR trim(p_name) = '' THEN 'Jogador'
    WHEN array_length(string_to_array(trim(p_name), ' '), 1) = 1 THEN trim(p_name)
    ELSE (string_to_array(trim(p_name), ' '))[1]
         || ' '
         || left((string_to_array(trim(p_name), ' '))[array_length(string_to_array(trim(p_name), ' '), 1)], 1)
         || '.'
  END;
$$;

-- ============================================================
-- 2. get_ranking_with_position — ranking global com posição pessoal
-- ============================================================
-- Retorna { entries: [...], my_rank: {...} | null, is_hidden: bool }
-- Nomes já mascarados. Substitui get_ranking para uso no client.
CREATE OR REPLACE FUNCTION public.get_ranking_with_position(
  p_type text DEFAULT 'rating',
  p_limit integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_entries jsonb;
  v_my_rank jsonb;
  v_is_hidden boolean := false;
  v_metric_col text;
  v_order_clause text;
BEGIN
  -- Determinar coluna e ordenação
  IF p_type = 'rating' THEN
    v_metric_col := 'puzzle_rating';
    v_order_clause := 'puzzle_rating DESC';
  ELSIF p_type = 'rush_3min' THEN
    v_metric_col := 'rush_3min_record';
    v_order_clause := 'rush_3min_record DESC';
  ELSIF p_type = 'rush_5min' THEN
    v_metric_col := 'rush_5min_record';
    v_order_clause := 'rush_5min_record DESC';
  ELSIF p_type = 'level' THEN
    v_metric_col := 'level';
    v_order_clause := 'level DESC, xp DESC';
  ELSE
    RETURN jsonb_build_object('entries', '[]'::jsonb, 'my_rank', null, 'is_hidden', false);
  END IF;

  -- Verificar se o caller está oculto
  IF v_user_id IS NOT NULL THEN
    SELECT NOT COALESCE(ranking_visible, true) INTO v_is_hidden
    FROM public.user_public_profiles
    WHERE user_id = v_user_id;
    -- Se não encontrado, manter false
    v_is_hidden := COALESCE(v_is_hidden, false);
  END IF;

  -- Buscar top N (usando SQL dinâmico para ORDER BY variável)
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(ranked)), ''[]''::jsonb)
     FROM (
       SELECT
         user_id,
         public.mask_display_name(display_name) AS public_name,
         avatar_config,
         level,
         %I AS metric_value,
         title,
         ROW_NUMBER() OVER (ORDER BY %s) AS position
       FROM public.user_public_profiles
       WHERE ranking_visible = true
       ORDER BY %s
       LIMIT %L
     ) ranked',
    v_metric_col, v_order_clause, v_order_clause, p_limit
  ) INTO v_entries;

  -- Buscar posição do caller (se visível)
  IF v_user_id IS NOT NULL AND NOT v_is_hidden THEN
    EXECUTE format(
      'SELECT row_to_json(me) FROM (
         SELECT
           user_id,
           public.mask_display_name(display_name) AS public_name,
           avatar_config,
           level,
           %I AS metric_value,
           title,
           position
         FROM (
           SELECT *,
             ROW_NUMBER() OVER (ORDER BY %s) AS position
           FROM public.user_public_profiles
           WHERE ranking_visible = true
         ) ranked
         WHERE user_id = %L
       ) me',
      v_metric_col, v_order_clause, v_user_id
    ) INTO v_my_rank;
  END IF;

  RETURN jsonb_build_object(
    'entries', v_entries,
    'my_rank', v_my_rank,
    'is_hidden', v_is_hidden
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. get_public_profile — perfil público com escopo mínimo
-- ============================================================
-- NUNCA retorna: email, display_name completo, dados pessoais
-- Retorna: public_name mascarado, stats, conquistas, equipped items
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile record;
  v_bots_defeated integer;
  v_lessons_completed integer;
  v_achievements_count integer;
  v_achievements jsonb;
  v_equipped jsonb;
BEGIN
  -- Buscar dados públicos da view materializada
  SELECT
    public.mask_display_name(display_name) AS public_name,
    avatar_config,
    level,
    xp,
    puzzle_rating,
    rush_3min_record,
    rush_5min_record,
    rush_resistencia_record,
    title,
    current_streak,
    member_since
  INTO v_profile
  FROM public.user_public_profiles
  WHERE user_id = p_user_id;

  -- Se não encontrado, retorna null
  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Contar bots derrotados (distintos)
  SELECT COUNT(DISTINCT bot_id) INTO v_bots_defeated
  FROM public.user_bot_results
  WHERE user_id = p_user_id AND result = 'win';

  -- Contar aulas completadas
  SELECT COUNT(*) INTO v_lessons_completed
  FROM public.user_lesson_progress
  WHERE user_id = p_user_id AND completed = true;

  -- Conquistas desbloqueadas (lista resumida)
  SELECT COUNT(*) INTO v_achievements_count
  FROM public.user_achievements
  WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'key', a.key,
      'title', a.title,
      'icon', a.icon,
      'description', a.description,
      'unlocked_at', ua.unlocked_at
    ) ORDER BY ua.unlocked_at DESC
  ), '[]'::jsonb) INTO v_achievements
  FROM public.user_achievements ua
  JOIN public.achievements a ON a.id = ua.achievement_id
  WHERE ua.user_id = p_user_id
    AND NOT COALESCE(a.hidden, false);

  -- Equipped items (para renderização de avatar read-only)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'slot', ue.slot,
      'item_name', i.name,
      'rarity', i.rarity,
      'image_url', i.image_url
    ) ORDER BY ue.slot
  ), '[]'::jsonb) INTO v_equipped
  FROM public.user_equipped ue
  JOIN public.items i ON i.id = ue.item_id
  WHERE ue.user_id = p_user_id;

  RETURN jsonb_build_object(
    'public_name', v_profile.public_name,
    'avatar_config', v_profile.avatar_config,
    'level', v_profile.level,
    'xp', v_profile.xp,
    'puzzle_rating', v_profile.puzzle_rating,
    'rush_3min_record', v_profile.rush_3min_record,
    'rush_5min_record', v_profile.rush_5min_record,
    'rush_resistencia_record', v_profile.rush_resistencia_record,
    'title', v_profile.title,
    'current_streak', v_profile.current_streak,
    'member_since', v_profile.member_since,
    'bots_defeated', v_bots_defeated,
    'lessons_completed', v_lessons_completed,
    'achievements_count', v_achievements_count,
    'achievements', v_achievements,
    'equipped_items', v_equipped
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. get_class_ranking — ranking filtrado por turma
-- ============================================================
-- Autorização estrita: caller deve ser membro da turma
-- OU o professor DAQUELA turma específica.
-- Professor de outra turma NÃO tem acesso.
-- Ignora ranking_visible (turma sempre vê todos os membros).
CREATE OR REPLACE FUNCTION public.get_class_ranking(
  p_class_id bigint,
  p_type text DEFAULT 'rating',
  p_limit integer DEFAULT 30
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_metric_col text;
  v_order_clause text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Autorização estrita: membro da turma OU professor DAQUELA turma
  IF NOT EXISTS(
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND user_id = v_user_id
  ) AND NOT EXISTS(
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar ranking desta turma';
  END IF;

  -- Determinar coluna e ordenação
  IF p_type = 'rating' THEN
    v_metric_col := 'puzzle_rating';
    v_order_clause := 'puzzle_rating DESC';
  ELSIF p_type = 'rush_3min' THEN
    v_metric_col := 'rush_3min_record';
    v_order_clause := 'rush_3min_record DESC';
  ELSIF p_type = 'rush_5min' THEN
    v_metric_col := 'rush_5min_record';
    v_order_clause := 'rush_5min_record DESC';
  ELSIF p_type = 'level' THEN
    v_metric_col := 'level';
    v_order_clause := 'level DESC, xp DESC';
  ELSE
    RETURN '[]'::jsonb;
  END IF;

  -- JOIN class_members com user_public_profiles (ignora ranking_visible)
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(ranked)), ''[]''::jsonb)
     FROM (
       SELECT
         upp.user_id,
         public.mask_display_name(upp.display_name) AS public_name,
         upp.avatar_config,
         upp.level,
         upp.%I AS metric_value,
         upp.title,
         ROW_NUMBER() OVER (ORDER BY upp.%s) AS position
       FROM public.class_members cm
       JOIN public.user_public_profiles upp ON upp.user_id = cm.user_id
       WHERE cm.class_id = %L
       ORDER BY upp.%s
       LIMIT %L
     ) ranked',
    v_metric_col, v_order_clause, p_class_id, v_order_clause, p_limit
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
