-- =============================================================================
-- NOVE CHAPÉUS ENTRAM NO CATÁLOGO — o slot sai do zero
-- =============================================================================
--
-- O slot `chapeu` existia na tabela e nunca teve uma linha. Em 2026-08-25 nove
-- artes atravessaram a rota (scripts/avatar/arte/ESTADO-DA-ROTA.md, partes 9 a 13)
-- e o Doug aprovou as nove: "ficam as nove".
--
-- Com esta migration `verify:catalogo-slots` para de reprovar no slot chapeu —
-- ele compara os dois conjuntos NOS DOIS SENTIDOS, e código sem linha no banco
-- reprova tanto quanto linha no banco sem código.
--
-- A RARIDADE VEIO DO NOME DO ARQUIVO, e é do Doug
-- -----------------------------------------------
-- Ele nomeou cada entrega como nome(raridade) em Downloads/chapéus/, e cada arte
-- foi casada com a sua por MD5, não por horário. Raridade é do servidor pela
-- Regra Inviolável nº 1: ela não existe em lugar nenhum do código do client —
-- entra aqui e só aqui.
--
--   legendary : mago
--   epic      : bone, pirata
--   rare      : boina, cartola, cowboy
--   common    : touca-de-la, chapeu-de-palha, toca-de-cozinha
--
-- ⚠️ TRÊS RARIDADES DIVERGEM DO MENU DO DOC 22, E A PASTA VENCE
-- -------------------------------------------------------------
-- O doc 22 tinha `chapeu-bone` e `chapeu-boina` como common e
-- `chapeu-chapeu-de-palha` como rare. A pasta os traz como epic, rare e common.
-- O doc foi reescrito pela pasta na mesma sessão, por decisão dele: "mude o menu
-- e adapte de acordo com a pasta".
--
-- ⚠️ `chapeu-gorro` NÃO EXISTE — ele virou `chapeu-touca-de-la`, mesma peça com o
-- nome que o Doug deu. E `chapeu-coroa-de-vitral` SAIU do menu: o slot tinha duas
-- legendary, e ele escolheu o `mago`, que é o que tem arte.
--
-- ⚠️ NENHUMA ENTRA COMO `inicial`, e é decisão, não esquecimento
-- --------------------------------------------------------------
-- Chapéu não é peça de partida: o aluno começa de cabeça descoberta, que é a
-- ausência de peça — o mesmo desenho do "sem traje" e da careca. O CHECK
-- avatar_catalogo_origem_coerente exige o conjunto inteiro por linha
-- (origem bau => raridade NOT NULL, min_level NULL, min_tier NULL).
--
-- `claim_chest` sorteia por `origem = 'bau' AND raridade = ?`, SEM filtro de slot
-- (20260813160000:150-157) — então as nove entram no sorteio sem uma linha de SQL
-- a mais.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda
-- em transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. As nove peças
-- ---------------------------------------------------------------------------
INSERT INTO public.avatar_catalogo (slug, slot, raridade, origem, inicial) VALUES
  ('chapeu-mago',             'chapeu', 'legendary', 'bau', false),
  ('chapeu-bone',             'chapeu', 'epic',      'bau', false),
  ('chapeu-pirata',           'chapeu', 'epic',      'bau', false),
  ('chapeu-boina',            'chapeu', 'rare',      'bau', false),
  ('chapeu-cartola',          'chapeu', 'rare',      'bau', false),
  ('chapeu-cowboy',           'chapeu', 'rare',      'bau', false),
  ('chapeu-touca-de-la',      'chapeu', 'common',    'bau', false),
  ('chapeu-chapeu-de-palha',  'chapeu', 'common',    'bau', false),
  ('chapeu-toca-de-cozinha',  'chapeu', 'common',    'bau', false);


-- ---------------------------------------------------------------------------
-- 2. A asserção: o slot fecha em NOVE
-- ---------------------------------------------------------------------------
--
-- O número 9 é escrito de propósito, e não contado a partir do INSERT acima:
-- contar o que eu mesmo acabei de inserir é a asserção vácua que este
-- repositório já pagou caro (ver "gate verde por vacuidade" em ESTADO-DA-ROTA).
DO $$
DECLARE
  n integer;
  iniciais integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.avatar_catalogo
  WHERE slot = 'chapeu';

  IF n <> 9 THEN
    RAISE EXCEPTION
      'o slot chapeu deveria fechar em 9 peças e tem %: o código desenha 9 '
      '(CHAPEUS_DA_ARTE em src/lib/avatar/estilo/chapeus-da-arte.ts) e catálogo '
      'que diverge do código faz o boneco pedir peça que não existe', n;
  END IF;

  -- A guarda ao contrário da do cabelo: aqui inicial TEM de ser zero. Um chapéu
  -- inicial poria peça na cabeça de toda conta nova sem ninguém ter pedido.
  SELECT count(*) INTO iniciais
  FROM public.avatar_catalogo
  WHERE slot = 'chapeu' AND inicial;

  IF iniciais <> 0 THEN
    RAISE EXCEPTION
      'o slot chapeu tem % peça(s) marcada(s) como inicial e deveria ter zero: '
      'o aluno começa de cabeça descoberta, que é a ausência de peça', iniciais;
  END IF;

  RAISE NOTICE 'slot chapeu: % peças, % inicial(is)', n, iniciais;
END $$;
