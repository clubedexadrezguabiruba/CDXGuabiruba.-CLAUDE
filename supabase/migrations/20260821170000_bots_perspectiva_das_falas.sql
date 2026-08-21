-- ============================================================
-- FIX: on_win / on_loss estavam invertidos entre banco e código
--
-- O código lê as duas chaves na perspectiva DO BOT:
--   GameOverModal.tsx:94  ->  result === "win" ? "on_loss" : "on_win"
--   botGameLogic.ts:15    ->  result é o resultado DO ALUNO
--   (aluno vence  =>  o bot perdeu  =>  toca on_loss)
--
-- Os 10 bots semeados em 20260307120000_bots_new_canon.sql foram escritos
-- na perspectiva DO ALUNO — o on_win do Léo é "Boa! Você me pegou fácil!"
-- (quem falou perdeu) e o on_loss é "Opa, ganhei! Mas foi sorte, viu?"
-- (quem falou ganhou). Os 10 são consistentes entre si e contrários ao código.
--
-- Efeito em produção: o aluno dá xeque-mate no Sargento Pardo e ouve
-- "Revise os fundamentos, recruta."
--
-- A perspectiva do BOT é a que fica — é a leitura natural do nome do campo,
-- é a que o código já implementa, e está escrita na lei das falas:
-- docs/Academia64_Diretriz_dos_Bots_v2.md §5.
--
-- Esta migration troca as duas chaves de lugar. Ela NÃO é idempotente:
-- rodar duas vezes desfaz o conserto. O elenco novo do Bloco 3 reescreve
-- as 110 falas por cima dela, já na perspectiva certa.
-- ============================================================

UPDATE public.bots
   SET phrases_json = (phrases_json - 'on_win' - 'on_loss')
                      || jsonb_build_object(
                           'on_win',  phrases_json -> 'on_loss',
                           'on_loss', phrases_json -> 'on_win'
                         )
 WHERE phrases_json ? 'on_win'
   AND phrases_json ? 'on_loss';

COMMENT ON COLUMN public.bots.phrases_json IS
  'Falas do bot em 4 chaves: pre_game (saudação), during (reação a lance), '
  'on_win (o BOT venceu) e on_loss (o BOT perdeu). A perspectiva é a do bot, '
  'não a do aluno — ver docs/Academia64_Diretriz_dos_Bots_v2.md §5.';
