-- =============================================================================
-- DEZ CABELOS NOVOS ENTRAM NO CATÁLOGO — a primeira promoção em LOTE do slot
-- =============================================================================
--
-- Em 2026-08-24, de manhã, o elenco de cabelo foi cortado de 6 para 4:
-- `cabelo-espetado` e `cabelo-coque` saíram por
-- 20260824080000_espetado_e_coque_saem_do_catalogo.sql, reprovados pelo Doug. O
-- registro daquela migration termina assim: "o próximo passo é arte nova do
-- Doug, e ela não precisa se chamar espetado nem coque — o slot está livre".
--
-- É o que esta migration semeia. Dez artes novas atravessaram a rota
-- (scripts/avatar/arte/ESTADO-DA-ROTA.md, bloco de 2026-08-24) e o Doug aprovou
-- as dez. Com elas o slot vai de 4 para 14 peças — o piso encomendado em
-- CABELOS_MINIMO (scripts/estado.ts) é 10, e ele é batido com folga pela primeira
-- vez desde que foi fixado em 2026-08-07.
--
-- O QUE MUDOU NO LUGAR DO PARECER, e é o que fez o lote existir
-- -------------------------------------------------------------
-- Até aqui cada peça ia à folha de contato e o Doug julgava uma por vez — a
-- instrução literal era "arte a arte" (scripts/avatar/arte/cabelos.ts). Ele
-- trocou o lugar do parecer para o render do /dev/avatar-kokeshi, onde as peças
-- não promovidas aparecem no seletor "da arte · tonal". Julgar dez numa sessão
-- só passou a custar o mesmo que julgar uma, e a esteira, medida, custa 2
-- segundos por arte.
--
-- A RARIDADE VEIO DO NOME DO ARQUIVO, e é do Doug
-- -----------------------------------------------
-- Ele nomeou cada arte com a raridade entre parênteses — cachos_anjo(legendary),
-- longo_unilateral(epic), coque_simples(rare), os outros
-- sete (common). Raridade é do servidor pela
-- Regra Inviolável nº 1, então ela não existe em lugar nenhum do código do
-- client: entra aqui e só aqui.
--
--   legendary : cachos-anjo
--   epic      : longo-unilateral
--   rare      : coque-simples
--   common    : curto-repartido, pixie, rabo-baixo, trancas-duplas,
--               tigela-franja, espetado, maria-chiquinha
--
-- ⚠️ NENHUMA ENTRA COMO `inicial`, E ISSO É PENDÊNCIA DECLARADA, NÃO DECISÃO
-- --------------------------------------------------------------------------
-- O desenho do produto é "o aluno começa podendo escolher entre 2 cabelos
-- common" (20260823110000_o_cabelo_vira_peca_de_bau.sql). Hoje sobrou UM
-- (`cabelo-assimetrico`), porque a outra inicial era o `cabelo-espetado`, que foi
-- apagado — a migration de ontem declarou a queda como consequência, não como
-- escolha. Restaurar as duas exige eleger UMA entre os SETE commons novos, e
-- isso é decisão de produto do Doug, não derivável de nada aqui. Fica um UPDATE
-- de uma linha para quando ele escolher.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda
-- em transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. As dez peças
-- ---------------------------------------------------------------------------
--
-- `origem = 'bau'` nas dez: todo item vestível tem raridade e vem de baú desde
-- 2026-08-22. O CHECK avatar_catalogo_origem_coerente exige o conjunto inteiro
-- por linha (origem bau => raridade NOT NULL, min_level NULL, min_tier NULL).
--
-- `claim_chest` sorteia por `origem = 'bau' AND raridade = ?`, SEM filtro de
-- slot (20260813160000:150-157) — então as dez entram no sorteio sem uma linha
-- de SQL a mais, do mesmo jeito que a barba entrou.
INSERT INTO public.avatar_catalogo (slug, slot, raridade, origem, inicial) VALUES
  ('cabelo-cachos-anjo',      'cabelo', 'legendary', 'bau', false),
  ('cabelo-longo-unilateral', 'cabelo', 'epic',      'bau', false),
  ('cabelo-coque-simples',    'cabelo', 'rare',      'bau', false),
  ('cabelo-curto-repartido',  'cabelo', 'common',    'bau', false),
  ('cabelo-pixie',            'cabelo', 'common',    'bau', false),
  ('cabelo-rabo-baixo',       'cabelo', 'common',    'bau', false),
  ('cabelo-trancas-duplas',   'cabelo', 'common',    'bau', false),
  ('cabelo-tigela-franja',    'cabelo', 'common',    'bau', false),
  -- ⚠️ O slug `cabelo-espetado` está sendo REUSADO, e isso é legítimo: a migration
  -- 20260824080000 fez DELETE FROM avatar_catalogo, sem lápide, então não há linha
  -- antiga a colidir. A arte também é outra — é a 3ª tentativa do modelo, e a
  -- primeira que atravessou o Gate −1.
  ('cabelo-espetado',         'cabelo', 'common',    'bau', false),
  -- ⚠️ A SEGUNDA arte com este nome. A primeira atravessou os gates e o Doug
  -- reprovou o DESENHO, mandando apagar; nada dela chegou ao banco, porque esta
  -- migration nunca foi aplicada no meio do caminho. É a única peça do slot com
  -- três componentes.
  ('cabelo-maria-chiquinha',  'cabelo', 'common',    'bau', false);


-- ---------------------------------------------------------------------------
-- 2. A asserção: o slot fecha em CATORZE, e nenhuma peça nasceu órfã
-- ---------------------------------------------------------------------------
--
-- Ela existe porque o modo de falha desta migration é silencioso: um INSERT que
-- rodasse pela metade deixaria o código desenhando peça que o catálogo não tem,
-- e `verify:catalogo-slots` só acusaria no próximo push. O gate do banco é mais
-- barato aqui do que na esteira de CI.
--
-- O número 14 é escrito de propósito, e não contado a partir do INSERT acima:
-- contar o que eu mesmo acabei de inserir é a asserção vácua que este
-- repositório já pagou caro (ver "gate verde por vacuidade" em ESTADO-DA-ROTA).
DO $$
DECLARE
  n integer;
  iniciais integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.avatar_catalogo
  WHERE slot = 'cabelo';

  IF n <> 14 THEN
    RAISE EXCEPTION
      'o slot cabelo deveria fechar em 14 peças e tem %: o código desenha 14 '
      '(MODELOS_CABELO em src/lib/avatar/estilo/cabelo.ts) e catálogo que diverge '
      'do código faz o boneco pedir peça que não existe', n;
  END IF;

  -- A mesma guarda da migration de ontem, e ela continua valendo: zerar as
  -- iniciais não quebra nada de imediato — a conta nova nasce, o gate passa, e o
  -- defeito aparece semanas depois como "o cabelo não abre para ninguém".
  SELECT count(*) INTO iniciais
  FROM public.avatar_catalogo
  WHERE slot = 'cabelo' AND inicial;

  IF iniciais = 0 THEN
    RAISE EXCEPTION
      'nenhuma peça de cabelo com inicial = true: toda conta nova nasceria sem '
      'cabelo no guarda-roupa e equipar_peca recusaria qualquer escolha';
  END IF;

  RAISE NOTICE 'slot cabelo: % peças, % inicial(is)', n, iniciais;
END $$;
