-- ============================================================
-- PATENTE — calibragem da régua: níveis de 15 aulas, nomes do método holandês
--
-- A migration 20260729120000 seeded marcos de 30 em 30 aulas. Eram exemplo,
-- não decisão. Decisão do usuário em 2026-07-29: o nível são **15 aulas**.
--
-- Isso encaixa a régua no conteúdo que existe:
--   nível 1 = a trilha `recruta` (15 aulas)
--   nível 2 = a trilha `soldado` (15 aulas, 30 acumuladas)
-- As duas trilhas do banco viram exatamente os dois primeiros níveis, e as
-- patentes Soldado e Aspirante passam a ser alcançáveis hoje.
--
-- NOMES: o método holandês (Stappenmethode, de Brunia e van Wijgerden) numera
-- os níveis de 1 a 6 — é a nomenclatura que escolas de xadrez usam. Adotada
-- aqui como "Passo N", inclusive nos níveis 1 e 2, que estavam como
-- "Iniciante" e "Intermediário": uma escada com dois sistemas de nome
-- misturados confunde mais do que informa. O nível 7 é extensão nossa; o
-- método propriamente vai até o 6.
--
-- A patente (Soldado, Aspirante, ...) continua sendo a recompensa temática;
-- o nível é o rótulo pedagógico. São coisas diferentes de propósito.
--
-- Efeito imediato: `teacherdoug001` tem 15 aulas concluídas e passa a
-- "Soldado" — a primeira patente concedida na história do banco.
--
-- Gate: npm run verify:avatar-db
-- ============================================================

UPDATE public.title_tiers SET
  level_name = CASE tier WHEN 0 THEN NULL ELSE 'Passo ' || tier END,
  lessons_required = tier * 15;

-- Reconciliação: quem já passou do marco novo é promovido agora.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.users LOOP
    PERFORM public.recompute_user_title(r.id);
  END LOOP;
END $$;
