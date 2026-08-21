-- ============================================================================
-- BLOCO A — a barba fica sendo UMA: a `Barba Trancada` entra e a `Barba Cheia` sai
-- ============================================================================
--
-- Decisão do Doug em 2026-08-21: o elenco de 6 barbas decidido em 2026-08-19 é
-- cortado para **uma**. A trancaça vira a **peça-padrão da linha de arte** — a peça
-- de que o `docs/avatar/23-linha-de-arte.md` cita toda régua —, e as outras saem
-- inteiras, arte e catálogo.
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
--
-- ---------------------------------------------------------------------------
-- POR QUE O DELETE E O INSERT ESTÃO NA MESMA MIGRATION
-- ---------------------------------------------------------------------------
--
-- `verify:catalogo-slots` compara `CATALOGO.rosto` com `avatar_catalogo` **nos dois
-- sentidos**: peça no banco e não no código reprova, e peça no código e não no banco
-- também. Do lado do código as duas mudanças são um arquivo gerado só
-- (`rostos-da-arte.ts`, escrito por `npm run arte:rostos`), então elas viajam juntas
-- por construção — o gate não admite meio caminho, e é para isso que ele existe.
--
-- A migration `20260819120000_bloco5_primeira_barba_no_catalogo.sql` **já foi
-- aplicada e não se toca** (regra do CLAUDE.md). Ela continua sendo o registro de
-- que a `cheia` existiu e de por que ela era a legendary; esta aqui é o registro de
-- que ela saiu.
--
-- ---------------------------------------------------------------------------
-- A ORDEM É OBRIGATÓRIA, E CADA PASSO EXISTE POR UMA CHAVE
-- ---------------------------------------------------------------------------
--
--  1. **desequipar** — `users.avatar_rosto` referencia o slug. Aluno com a `cheia`
--     vestida ficaria apontando para peça que o catálogo não tem mais, e o
--     compositor renderizaria o boneco sem barba com o banco dizendo que ele tem
--     uma. Volta a NULL, que é o padrão e um estado válido;
--  2. **tirar do guarda-roupa** — `avatar_guarda_roupa` guarda o que cada aluno
--     conquistou, e a FK para `avatar_catalogo` recusaria o DELETE de baixo;
--  3. **apagar do catálogo**;
--  4. **inserir a trancaça**;
--  5. **refrescar a matview** — `public_profiles` cacheia o avatar de cada aluno
--     para o mural e o ranking. Sem o refresh, a lista mostraria a barba apagada
--     até o próximo `equipar_peca` de alguém.
--
-- ⚠️ **O aluno que tinha a `cheia` PERDE a peça, e não ganha a trancaça no lugar.**
-- Isso é escolha e não descuido: dar a lendária de graça a quem calhou de abrir um
-- baú antes de 2026-08-21 furaria a conquista para todo o resto. Quem tinha volta
-- ao pool com a chance de tirar a nova. O produto ainda não está no ar com alunos
-- reais, então a população afetada é a de teste.
--
-- ---------------------------------------------------------------------------
-- POR QUE `legendary`, DE NOVO
-- ---------------------------------------------------------------------------
--
-- `origem = 'bau'` e `raridade = 'legendary'` andam juntas por CHECK composto
-- (`avatar_catalogo_origem_coerente`): quem sai de baú declara raridade e deixa
-- `min_level` e `min_tier` nulos.
--
-- A trancaça é a legendary do slot `rosto` na distribuição do doc 22 (5 common ·
-- 4 rare · 2 epic · 1 legendary). É a peça de maior massa que a rota já produziu —
-- **54 264 px contra os 38 505 da `cheia`** —, tem 917 tons de luz na arte e é a
-- que mais muda o boneco. Medida em `scripts/avatar/arte/ESTADO-DA-ROTA.md`.
--
-- ⚠️ **`common` e `epic` do slot `rosto` nascem VAZIOS**, e isso é o estado esperado
-- de arte por demanda: o catálogo do doc 22 é menu, não estoque. `claim_chest` já
-- paga XP onde o pool da raridade sorteada está vazio, e é o que
-- `verify:chest-pool` mede.
-- ============================================================================

-- 1. ninguém fica vestindo peça que o catálogo não tem mais
UPDATE public.users
SET avatar_rosto = NULL
WHERE avatar_rosto = 'rosto-barba-cheia';

-- 2. sai do guarda-roupa de quem a conquistou (a FK recusaria o DELETE abaixo)
DELETE FROM public.avatar_guarda_roupa
WHERE slug = 'rosto-barba-cheia';

-- 3. sai do catálogo
DELETE FROM public.avatar_catalogo
WHERE slug = 'rosto-barba-cheia';

-- 4. entra a peça-padrão da linha de arte
INSERT INTO public.avatar_catalogo (slug, slot, origem, raridade, min_level, min_tier) VALUES
  ('rosto-barba-trancada', 'rosto', 'bau', 'legendary', NULL, NULL);

-- 5. o mural e o ranking leem a matview, não a tabela
SELECT public.refresh_public_profiles();
