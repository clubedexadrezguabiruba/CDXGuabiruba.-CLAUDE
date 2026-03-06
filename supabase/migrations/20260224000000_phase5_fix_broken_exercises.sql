-- FASE 5E — Corrigir 11 exercícios com FEN/expected_moves inválidos
-- Encontrados via validação chess.js nos testes E2E

-- 1. Lesson 8 (O Rei), Section 4: Adicionar rei preto em h8
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,4,fen}', '"7k/8/8/8/8/5q2/8/4K3 w - - 0 1"') WHERE id = 8;

-- 2. Lesson 8 (O Rei), Section 5: Adicionar rei preto em h8
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,5,fen}', '"7k/8/8/8/8/4n3/8/4K3 w - - 0 1"') WHERE id = 8;

-- 3. Lesson 9 (Xeque), Section 4: Torre dá xeque na coluna b, bispo bloqueia
UPDATE public.lessons SET content_json = jsonb_set(jsonb_set(content_json, '{sections,4,fen}', '"1r5k/8/8/8/8/8/3B4/1K6 w - - 0 1"'), '{sections,4,expected_moves}', '["d2b4"]') WHERE id = 9;

-- 4. Lesson 10 (Xeque-Mate), Section 5: Mate na última fileira com peões
UPDATE public.lessons SET content_json = jsonb_set(jsonb_set(content_json, '{sections,5,fen}', '"6k1/5ppp/8/8/8/8/8/R4R1K w - - 0 1"'), '{sections,5,expected_moves}', '["a1a8"]') WHERE id = 10;

-- 5. Lesson 12 (Valor das Peças), Section 3: Peão de d4 para a3
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,3,fen}', '"7k/8/5r2/8/8/p7/1B6/7K w - - 0 1"') WHERE id = 12;

-- 6. Lesson 17 (Garfo), Section 5: Garfo válido cavalo b2→c4
UPDATE public.lessons SET content_json = jsonb_set(jsonb_set(content_json, '{sections,5,fen}', '"4k3/8/3q4/8/8/r7/1N6/7K w - - 0 1"'), '{sections,5,expected_moves}', '["b2c4"]') WHERE id = 17;

-- 7. Lesson 23 (Desvio), Section 2: Rei de h1 para f1 (evitar xeque)
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,2,fen}', '"7k/6qr/8/8/8/8/8/4RK2 w - - 0 1"') WHERE id = 23;

-- 8. Lesson 26 (Promoção), Section 3: Bispo preto em f8 para captura-promoção
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,3,fen}', '"r4b1k/4P3/8/8/8/8/8/7K w - - 0 1"') WHERE id = 26;

-- 9. Lesson 27 (Finais), Section 3: Rei preto de e5 para e6
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,3,fen}', '"8/8/4k3/8/8/4K3/4P3/8 w - - 0 1"') WHERE id = 27;

-- 10. Lesson 27 (Finais), Section 5: Adicionar rei preto h8
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,5,fen}', '"7k/8/8/8/8/4K3/4p3/8 w - - 0 1"') WHERE id = 27;

-- 11. Lesson 31 (Revisão), Section 4: Cavalo de d5 para f4
UPDATE public.lessons SET content_json = jsonb_set(content_json, '{sections,4,fen}', '"r1bqk2r/ppp2ppp/2n5/4p3/2B2N2/8/PPPP1PPP/R1BQK2R w KQkq - 0 1"') WHERE id = 31;
