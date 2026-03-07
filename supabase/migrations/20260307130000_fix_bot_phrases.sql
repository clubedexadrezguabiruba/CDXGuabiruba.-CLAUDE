-- ============================================================
-- FIX: Corrigir frases pre_game do Léo
-- A frase canônica ("Opa, não vi esse seu bispo aí...") é
-- reação de jogo, não saudação. Mover para during.
-- ============================================================

UPDATE public.bots
SET phrases_json = '{"pre_game":["E aí, parceiro! Bora treinar?","Ainda tô aprendendo, mas vamos nessa!","Senta aí, recruta! Hoje a gente treina junto."],"during":["Opa, não vi esse seu bispo aí. Boa leitura, recruta.","Opa, boa jogada!","Hmm, não vi essa peça ali...","Calma, deixa eu pensar...","Eita, minha dama ficou solta!"],"on_win":["Boa! Você me pegou fácil!","Parabéns, recruta! Mandou bem!"],"on_loss":["Opa, ganhei! Mas foi sorte, viu?","Hmm, acho que acertei sem querer!"]}'
WHERE slug = 'leo';
