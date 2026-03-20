-- ============================================================
-- Avatar Base: suporte a masculino/feminino
-- ============================================================

-- 1. Colunas avatar_base e avatar_chosen na tabela users
ALTER TABLE public.users
ADD COLUMN avatar_base text NOT NULL DEFAULT 'male'
  CHECK (avatar_base IN ('male', 'female'));

ALTER TABLE public.users
ADD COLUMN avatar_chosen boolean NOT NULL DEFAULT false;

-- 2. Recriar materialized view com avatar_base
DROP MATERIALIZED VIEW IF EXISTS public.user_public_profiles CASCADE;

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_config,
  u.avatar_base,
  u.level,
  u.xp,
  u.puzzle_rating,
  u.rush_3min_record,
  u.rush_5min_record,
  u.rush_resistencia_record,
  u.ranking_visible,
  COALESCE(ut.current_title, 'Aprendiz') AS title,
  COALESCE(us.current_streak, 0) AS current_streak,
  u.created_at AS member_since
FROM public.users u
LEFT JOIN public.user_titles ut ON ut.user_id = u.id
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE u.role IN ('aluno', 'professor');

CREATE UNIQUE INDEX idx_public_profiles_user ON public.user_public_profiles(user_id);
CREATE INDEX idx_public_profiles_rating ON public.user_public_profiles(puzzle_rating DESC);
CREATE INDEX idx_public_profiles_level ON public.user_public_profiles(level DESC, xp DESC);
CREATE INDEX idx_public_profiles_rush3 ON public.user_public_profiles(rush_3min_record DESC);
CREATE INDEX idx_public_profiles_rush5 ON public.user_public_profiles(rush_5min_record DESC);
CREATE INDEX idx_public_profiles_resistencia ON public.user_public_profiles(rush_resistencia_record DESC);

-- 3. RPC para trocar avatar base
CREATE OR REPLACE FUNCTION public.update_avatar_base(p_base text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_base NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'avatar_base deve ser male ou female';
  END IF;

  UPDATE public.users
  SET avatar_base = p_base, avatar_chosen = true
  WHERE id = auth.uid();

  -- Refresh da view materializada
  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object('updated', true, 'avatar_base', p_base);
END;
$$;

-- 4. Atualizar get_public_profile para incluir avatar_base
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
    avatar_base,
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

  -- Conquistas desbloqueadas
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

  -- Equipped items
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
    'avatar_base', v_profile.avatar_base,
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
