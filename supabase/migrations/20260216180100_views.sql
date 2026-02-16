-- ============================================================
-- FASE 2 — VIEW MATERIALIZADA (2.12)
-- ============================================================

CREATE MATERIALIZED VIEW public.user_public_profiles AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.avatar_config,
  u.level,
  u.xp,
  u.puzzle_rating,
  u.rush_3min_record,
  u.rush_5min_record,
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

-- Função para refresh da view (chamar após mudanças relevantes)
CREATE OR REPLACE FUNCTION public.refresh_public_profiles()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_public_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
