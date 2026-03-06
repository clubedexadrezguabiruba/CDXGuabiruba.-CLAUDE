-- ============================================================
-- FASE 5D — Fix sub-promoção: Aula "Promoção de Peão" (id=26)
--
-- O exercício 2 (sections[3]) espera e7f8n (sub-promoção a cavalo),
-- mas o LessonBoard auto-promove a dama (envia e7f8q).
-- Adiciona e7f8q como lance aceito.
-- ============================================================

UPDATE public.lessons
SET content_json = jsonb_set(
  content_json,
  '{sections,3,expected_moves}',
  '["e7f8n", "e7f8q"]'
)
WHERE trail = 'soldado' AND trail_order = 10;
