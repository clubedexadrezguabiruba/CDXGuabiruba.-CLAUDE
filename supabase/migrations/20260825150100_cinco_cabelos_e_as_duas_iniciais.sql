-- =============================================================================
-- CINCO CABELOS ENTRAM, DUAS RARIDADES TROCAM, E O SLOT VOLTA A TER DUAS INICIAIS
-- =============================================================================
--
-- Três coisas numa migration só porque são o mesmo slot e a mesma decisão do
-- Doug, tomada em 2026-08-25: "já olhei e todos aprovados", e as pastas de
-- entrega passam a mandar no catálogo.
--
-- 1. AS CINCO PEÇAS NOVAS — o slot vai de 14 para 19
-- --------------------------------------------------
-- Três (`coque-individual`, `coques-duplos`, `dreadlocks`) estavam no seletor
-- "da arte · tonal" desde 2026-08-24 esperando o parecer; duas (`elvis`,
-- `curto-penteado`) atravessaram a esteira no próprio dia 25, quando a §5-E do
-- doc 22 foi reescrita pela pasta e revelou que elas nunca tinham entrado.
--
-- A raridade veio do nome do arquivo, como nas dez de ontem:
--   legendary : dreadlocks
--   epic      : elvis
--   rare      : coque-individual, coques-duplos
--   common    : curto-penteado
--
-- 2. ⚠️ DUAS RARIDADES TROCAM DE LUGAR, E ISSO MEXE EM LINHA JÁ APLICADA
-- ----------------------------------------------------------------------
-- A pasta traz `assimetrico(legendary)` e `chanel(common)`. O banco tem o
-- inverso desde 20260823110000, quando a raridade foi TRADUZIDA do gate de nível
-- que existia antes (cabelo livre -> common; nível 30 -> legendary). O Doug
-- desenhou arte nova para as duas e reclassificou; a tradução do nível
-- envelheceu.
--
-- Isto NÃO é modificar migration aplicada — é uma migration nova fazendo UPDATE,
-- que é o caminho que o CLAUDE.md manda usar.
--
-- 3. ⚠️ AS INICIAIS: `rabo-baixo` e `curto-repartido`
-- ---------------------------------------------------
-- É consequência direta do item 2 e é um DEFEITO sendo consertado. O
-- `cabelo-assimetrico` era a ÚNICA inicial do slot e virou `legendary` — inicial
-- lendária não é inicial: o aluno começaria com uma peça de 7% de baú, ou só com
-- a careca. O comentário da coluna `inicial` já dizia a regra: "toda inicial é
-- common e de origem bau".
--
-- O Doug escolheu as duas substitutas, e são duas de novo, como antes de
-- 2026-08-24. A decisão mora na COLUNA e não em lista escrita no corpo de função
-- nenhuma (20260823110000:72-77) — por isso um UPDATE basta.
--
-- A ORDEM IMPORTA: a raridade do `assimetrico` sobe ANTES de ele perder o
-- `inicial`? Não — o inverso. As duas novas iniciais são marcadas primeiro, para
-- que o slot nunca passe por um estado com zero iniciais, nem por um instante.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda
-- em transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. As cinco peças novas
-- ---------------------------------------------------------------------------
INSERT INTO public.avatar_catalogo (slug, slot, raridade, origem, inicial) VALUES
  ('cabelo-dreadlocks',       'cabelo', 'legendary', 'bau', false),
  ('cabelo-elvis',            'cabelo', 'epic',      'bau', false),
  ('cabelo-coque-individual', 'cabelo', 'rare',      'bau', false),
  ('cabelo-coques-duplos',    'cabelo', 'rare',      'bau', false),
  ('cabelo-curto-penteado',   'cabelo', 'common',    'bau', false);


-- ---------------------------------------------------------------------------
-- 2. As duas iniciais novas — ANTES de o assimetrico perder a dele
-- ---------------------------------------------------------------------------
UPDATE public.avatar_catalogo
   SET inicial = true
 WHERE slug IN ('cabelo-rabo-baixo', 'cabelo-curto-repartido');


-- ---------------------------------------------------------------------------
-- 3. As duas raridades que trocam, e o assimetrico deixa de ser inicial
-- ---------------------------------------------------------------------------
--
-- O CHECK avatar_catalogo_origem_coerente é por linha e exige o conjunto inteiro
-- de uma vez: como só a raridade muda e `origem` continua 'bau', um UPDATE por
-- linha o satisfaz sem estado intermediário inválido.
UPDATE public.avatar_catalogo
   SET raridade = 'legendary', inicial = false
 WHERE slug = 'cabelo-assimetrico';

UPDATE public.avatar_catalogo
   SET raridade = 'common'
 WHERE slug = 'cabelo-chanel';


-- ---------------------------------------------------------------------------
-- 4. As asserções
-- ---------------------------------------------------------------------------
--
-- Os números são escritos de propósito, nunca contados a partir do INSERT acima:
-- contar o que eu mesmo inseri é a asserção vácua que este repositório já pagou
-- caro (ver "gate verde por vacuidade" em ESTADO-DA-ROTA).
DO $$
DECLARE
  n integer;
  iniciais integer;
  caras integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.avatar_catalogo
  WHERE slot = 'cabelo';

  IF n <> 19 THEN
    RAISE EXCEPTION
      'o slot cabelo deveria fechar em 19 peças e tem %: o código desenha 19 '
      '(MODELOS_CABELO em src/lib/avatar/estilo/cabelo.ts) e catálogo que diverge '
      'do código faz o boneco pedir peça que não existe', n;
  END IF;

  SELECT count(*) INTO iniciais
  FROM public.avatar_catalogo
  WHERE slot = 'cabelo' AND inicial;

  IF iniciais <> 2 THEN
    RAISE EXCEPTION
      'o slot cabelo deveria ter 2 iniciais e tem %: zerar as iniciais não quebra '
      'nada de imediato — a conta nova nasce, o gate passa, e o defeito aparece '
      'semanas depois como "o cabelo não abre para ninguém"', iniciais;
  END IF;

  -- A REGRA QUE O DEFEITO DE HOJE VIOLOU, agora com gate: o comentário da coluna
  -- diz "toda inicial é common e de origem bau", e até agora nada cobrava isso.
  SELECT count(*) INTO caras
  FROM public.avatar_catalogo
  WHERE inicial AND (raridade <> 'common' OR origem <> 'bau');

  IF caras <> 0 THEN
    RAISE EXCEPTION
      '% peça(s) marcada(s) como inicial não são common de baú: inicial cara não '
      'é inicial — o aluno começaria com uma peça de 7%% de chance de baú', caras;
  END IF;

  RAISE NOTICE 'slot cabelo: % peças, % iniciais, todas common de baú', n, iniciais;
END $$;
