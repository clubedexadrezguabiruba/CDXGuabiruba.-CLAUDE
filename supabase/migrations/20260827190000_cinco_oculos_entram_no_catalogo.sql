-- =============================================================================
-- CINCO ÓCULOS ENTRAM NO CATÁLOGO — o slot sai do zero
-- =============================================================================
--
-- O slot `oculos` nasceu em 2026-08-27 (`20260827160000`) e nunca teve uma linha. As
-- cinco artes atravessaram a esteira no mesmo dia e o Doug as batizou uma a uma.
--
-- Com esta migration `verify:catalogo-slots` para de reprovar no slot `oculos` — ele
-- compara os dois conjuntos NOS DOIS SENTIDOS, e código sem linha no banco reprova
-- tanto quanto linha no banco sem código.
--
-- A RARIDADE É DO DOUG, e é do SERVIDOR
-- --------------------------------------
-- Ele deu peça a peça, junto com os nomes. Raridade não existe em lugar nenhum do
-- código do client (Regra Inviolável nº 1): entra aqui e só aqui.
--
--   legendary : duplo-art-nouveau
--   epic      : quadrado-retro-rosa, aviator
--   rare      : escolar-simples
--   common    : redondo-simples
--
-- ⚠️ ELA SUBSTITUI UMA MIGRATION QUE NUNCA FOI APLICADA
-- ------------------------------------------------------
-- A `20260827130000_cinco_oculos_entram_no_catalogo.sql` foi escrita quando os slugs
-- eram provisórios (`rosto-oculos-1` a `-5`) e o slot ainda era `rosto`. Ela nunca
-- rodou — o Doug pediu para segurar até batizar as peças, e foi a decisão certa: os
-- slugs mudaram DUAS vezes desde então (de `rosto-oculos-N` para `oculos-N`, quando o
-- slot se separou, e daí para os nomes). Aplicá-la teria custado duas migrations de
-- `UPDATE ... SET slug` mexendo em FK.
--
-- ⚠️ A TERCEIRA ARTE DO LOTE NÃO ESTÁ AQUI
-- -----------------------------------------
-- Eram cinco artes e a terceira foi substituída — o Doug trocou a das volutas com
-- corrente por outra (*"aqui entrou, entrou no lugar"*). O elenco continua em CINCO
-- porque a nova (`aviator`) entrou no lugar dela, não além dela.
--
-- ⚠️ NENHUMA entra como `inicial`, pelo mesmo motivo do chapéu: o aluno começa sem
-- óculos, que é a ausência de peça. O CHECK `avatar_catalogo_origem_coerente` exige o
-- conjunto inteiro por linha (origem bau => raridade NOT NULL, min_level NULL,
-- min_tier NULL).
--
-- `claim_chest` sorteia por `origem = 'bau' AND raridade = ?`, SEM filtro de slot
-- (20260813160000:150-157) — então as cinco entram no sorteio sem uma linha de SQL a
-- mais. **Isso muda a chance de cada raridade**: o pool de `legendary` sai de 5 para
-- 6, o de `epic` de 5 para 7, o de `rare` de 8 para 9 e o de `common` de 13 para 14.
-- É consequência declarada de o sorteio ser por raridade e não por slot.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda em
-- transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. As cinco peças
-- ---------------------------------------------------------------------------
INSERT INTO public.avatar_catalogo (slug, slot, raridade, origem, inicial) VALUES
  ('oculos-duplo-art-nouveau',   'oculos', 'legendary', 'bau', false),
  ('oculos-quadrado-retro-rosa', 'oculos', 'epic',      'bau', false),
  ('oculos-aviator',             'oculos', 'epic',      'bau', false),
  ('oculos-escolar-simples',     'oculos', 'rare',      'bau', false),
  ('oculos-redondo-simples',     'oculos', 'common',    'bau', false);


-- ---------------------------------------------------------------------------
-- 2. As asserções
-- ---------------------------------------------------------------------------
--
-- O número 5 é escrito de propósito, e não contado a partir do INSERT acima: contar o
-- que eu mesmo acabei de inserir é a asserção vácua que este repositório já pagou caro
-- (ver "gate verde por vacuidade" em ESTADO-DA-ROTA).
DO $$
DECLARE
  n         integer;
  iniciais  integer;
  no_rosto  integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.avatar_catalogo
  WHERE slot = 'oculos';

  IF n <> 5 THEN
    RAISE EXCEPTION
      'o slot oculos deveria fechar em 5 peças e tem %: o código desenha 5 '
      '(OCULOS_DA_ARTE em src/lib/avatar/estilo/oculos-da-arte.ts) e catálogo que '
      'diverge do código faz o boneco pedir peça que não existe', n;
  END IF;

  -- A distribuição de raridade, peça a peça. Sem isto, trocar duas raridades entre si
  -- passaria — o total continuaria 5 e o sorteio de baú mudaria em silêncio.
  IF (SELECT raridade FROM public.avatar_catalogo WHERE slug='oculos-duplo-art-nouveau')
     IS DISTINCT FROM 'legendary' THEN
    RAISE EXCEPTION 'duplo-art-nouveau deveria ser legendary';
  END IF;
  IF (SELECT count(*) FROM public.avatar_catalogo
      WHERE slot='oculos' AND raridade='epic') <> 2 THEN
    RAISE EXCEPTION 'o slot oculos deveria ter 2 epic';
  END IF;

  -- Nenhuma inicial: o aluno começa sem óculos, que é a ausência de peça.
  SELECT count(*) INTO iniciais
  FROM public.avatar_catalogo WHERE slot = 'oculos' AND inicial;
  IF iniciais <> 0 THEN
    RAISE EXCEPTION
      'o slot oculos tem % peça(s) marcada(s) como inicial e deveria ter zero', iniciais;
  END IF;

  -- E o slot `rosto` NÃO ganhou óculos por engano. É a asserção do outro lado da
  -- separação de 2026-08-27: se um óculos caísse em `rosto`, ele voltaria a excluir a
  -- barba — exatamente o que o slot novo existe para impedir.
  SELECT count(*) INTO no_rosto
  FROM public.avatar_catalogo WHERE slot = 'rosto' AND slug LIKE '%oculos%';
  IF no_rosto <> 0 THEN
    RAISE EXCEPTION
      'há % peça(s) de óculos no slot rosto — elas voltariam a excluir a barba', no_rosto;
  END IF;

  RAISE NOTICE 'slot oculos: % peças, % inicial(is), nenhuma no slot rosto', n, iniciais;
END $$;
