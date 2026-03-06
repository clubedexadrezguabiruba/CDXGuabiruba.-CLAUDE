-- ============================================================
-- FASE 5.1 — Adicionar dim_kings: true à aula "A Torre"
-- Reis presentes nos FENs (fix migration anterior) mas
-- visualmente dimmed para não distrair o aluno.
-- ============================================================

UPDATE public.lessons
SET content_json = jsonb_set(content_json, '{dim_kings}', 'true')
WHERE trail = 'recruta' AND trail_order = 1;
