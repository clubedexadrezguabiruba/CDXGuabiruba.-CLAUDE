-- ============================================================
-- T1 — a patente vem de concluir uma TRILHA. O princípio vira dado.
--
-- DECISÃO DO USUÁRIO, 2026-08-11: a promoção acontece ao completar uma trilha
-- de nível. Fecha o achado T1 de docs/achados.md, que travava o Bloco 7b do
-- avatar e o B0.5 do currículo.
--
-- O QUE A MEDIÇÃO CONTRA PRODUÇÃO MOSTROU, e é o motivo desta migration não
-- mexer em nenhum marco:
--
--   `title_tiers.lessons_required` é `tier * 15`. As trilhas do banco são
--   `recruta` (15 aulas) e `soldado` (15). Ou seja: os marcos 15 e 30 JÁ SÃO
--   as fronteiras das duas trilhas. A régua viva já obedece ao princípio — 15
--   não é uma alternativa a "por trilha", é a consequência dele com o conteúdo
--   de hoje.
--
--   Trocar agora para o acumulado do currículo (26·47·66·84·101·115·126)
--   colocaria o marco 26 no MEIO da trilha `soldado`, que vai da aula 16 à 30.
--   O aluno terminaria a trilha inteira sem ganhar nada, e ganharia a patente
--   onze aulas antes, sem nada na tela para explicar. É exatamente o defeito
--   que a decisão existe para evitar.
--
-- O QUE MUDA, ENTÃO: a relação tier ↔ trilha deixa de ser coincidência
-- posicional e vira coluna. Sem ela, "a patente vem da trilha" é uma frase em
-- documento; com ela, é dado que o gate consegue conferir contra `lessons`.
--
-- O NÚMERO CONTINUA ONDE ESTÁ. `lessons_required` não é tocado:
--   - tiers 1 e 2 (15 e 30) já batem com as fronteiras reais;
--   - tiers 3 a 7 (45, 60, 75, 90, 105) são placeholder de trilha que ainda não
--     tem uma única aula no banco. Eles mudam no B0.5 do currículo, na mesma
--     migration que trouxer as 26 aulas da T1 — e o gate desta migration é o
--     que impede alguém de esquecer.
--
-- A ORDEM DAS TRILHAS não é invenção daqui: é a do CHECK de `lessons.trail`,
-- que declara recruta · soldado · aspirante · capitao · comandante · general ·
-- mestre. São 7, e são exatamente os tiers 1 a 7.
--
-- SOBRE O TIER 7: a trilha 7 chama-se `mestre` e a patente que ela veste chama-
-- se `Lenda`. Os dois rótulos são dados reais, vindos de decisões diferentes, e
-- a §3 do currículo já registra o par para ninguém "corrigir" um pelo outro.
--
-- Gate: npm run verify:avatar-db (a conferência (e) falha antes, passa depois)
-- ============================================================

-- ------------------------------------------------------------
-- 1. A trilha que cada patente fecha
-- ------------------------------------------------------------
ALTER TABLE public.title_tiers
  ADD COLUMN IF NOT EXISTS trail text;

COMMENT ON COLUMN public.title_tiers.trail IS
  'Trilha de lessons.trail que esta patente fecha. NULL só no tier 0, que é a base e não fecha trilha. O marco em lessons_required é a CONTAGEM acumulada de aulas até esta trilha — quem confere é verify:avatar-db.';

-- ------------------------------------------------------------
-- 2. O mapeamento
--
-- Escrito por tier, não por posição: a coluna existe justamente para a relação
-- parar de ser inferida.
-- ------------------------------------------------------------
UPDATE public.title_tiers SET trail = CASE tier
  WHEN 1 THEN 'recruta'
  WHEN 2 THEN 'soldado'
  WHEN 3 THEN 'aspirante'
  WHEN 4 THEN 'capitao'
  WHEN 5 THEN 'comandante'
  WHEN 6 THEN 'general'
  WHEN 7 THEN 'mestre'
  ELSE NULL
END;

-- ------------------------------------------------------------
-- 3. As travas
--
-- O CHECK repete os 7 slugs do CHECK de `lessons.trail` de propósito: uma FK
-- não é possível (`lessons.trail` não é chave — são muitas aulas por trilha), e
-- deixar a coluna como texto livre devolveria ao banco a chance de guardar uma
-- trilha que não existe. Se o currículo acrescentar trilha, os dois CHECKs
-- mudam juntos, na mesma migration.
-- ------------------------------------------------------------
ALTER TABLE public.title_tiers
  DROP CONSTRAINT IF EXISTS title_tiers_trail_valida;

ALTER TABLE public.title_tiers
  ADD CONSTRAINT title_tiers_trail_valida CHECK (
    trail IS NULL OR trail IN (
      'recruta', 'soldado', 'aspirante', 'capitao',
      'comandante', 'general', 'mestre'
    )
  );

-- Só o tier 0 pode ficar sem trilha. Um tier de patente sem trilha é uma
-- patente que ninguém sabe como se ganha.
ALTER TABLE public.title_tiers
  DROP CONSTRAINT IF EXISTS title_tiers_base_sem_trilha;

ALTER TABLE public.title_tiers
  ADD CONSTRAINT title_tiers_base_sem_trilha CHECK (
    (tier = 0 AND trail IS NULL) OR (tier > 0 AND trail IS NOT NULL)
  );

-- Duas patentes não podem fechar a mesma trilha.
DROP INDEX IF EXISTS title_tiers_trail_unica;
CREATE UNIQUE INDEX title_tiers_trail_unica
  ON public.title_tiers (trail) WHERE trail IS NOT NULL;
