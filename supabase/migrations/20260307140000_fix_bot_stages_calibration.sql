-- ============================================================
-- FIX: Corrigir estagios e recalibrar elo/skill/depth
--
-- Redistribuicao:
--   1-4  Acampamento dos Recrutas
--   5-8  Vila dos Soldados
--   9-10 Fortaleza dos Estrategistas
--
-- Nenhum bot ativo usa Cidade dos Generais ou Cidadela dos
-- Mestres nesta v1 (logica do grid ja suporta 5 estagios).
-- ============================================================

-- Acampamento dos Recrutas (1-4) — sem mudanca de estagio
UPDATE public.bots SET elo = 250, skill_level = 0,  depth = 1, stage = 'Acampamento dos Recrutas' WHERE slug = 'leo';
UPDATE public.bots SET elo = 400, skill_level = 1,  depth = 2, stage = 'Acampamento dos Recrutas' WHERE slug = 'skippy';
UPDATE public.bots SET elo = 550, skill_level = 2,  depth = 3, stage = 'Acampamento dos Recrutas' WHERE slug = 'tome';
UPDATE public.bots SET elo = 700, skill_level = 4,  depth = 4, stage = 'Acampamento dos Recrutas' WHERE slug = 'sargento-pardo';

-- Vila dos Soldados (5-8)
UPDATE public.bots SET elo = 850,  skill_level = 6,  depth = 5, stage = 'Vila dos Soldados' WHERE slug = 'iris';
UPDATE public.bots SET elo = 1000, skill_level = 8,  depth = 6, stage = 'Vila dos Soldados' WHERE slug = 'breno';
UPDATE public.bots SET elo = 1150, skill_level = 10, depth = 7, stage = 'Vila dos Soldados' WHERE slug = 'silas';
UPDATE public.bots SET elo = 1300, skill_level = 12, depth = 8, stage = 'Vila dos Soldados' WHERE slug = 'capita-lucia';

-- Fortaleza dos Estrategistas (9-10)
UPDATE public.bots SET elo = 1450, skill_level = 13, depth = 9,  stage = 'Fortaleza dos Estrategistas' WHERE slug = 'cassio';
UPDATE public.bots SET elo = 1600, skill_level = 14, depth = 10, stage = 'Fortaleza dos Estrategistas' WHERE slug = 'helena';
