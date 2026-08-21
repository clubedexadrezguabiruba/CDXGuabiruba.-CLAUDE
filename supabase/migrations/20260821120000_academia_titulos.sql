-- ============================================================================
-- ACADEMIA 64 — a patente vira TÍTULO, e a escada muda de nome
--
-- Bloco 2 da virada de 2026-08-20. A lei é docs/Academia64_Biblia_Tonal_v2.md
-- §6; o plano, .claude/plans/quero-mudar-a-tem-tica-serene-ripple.md.
--
-- O que muda é TEXTO EXIBIDO, e só. Os 8 degraus não mudam de número, de ordem,
-- de marco (`lessons_required`) nem de trilha (`trail`). Os slugs do banco
-- (`recruta`…`mestre`, presos em CHECK) ficam onde estão: slug é chave, nome é
-- texto de aluno.
--
--   tier 0  Aprendiz    → Calouro
--   tier 1  Soldado     → Aprendiz
--   tier 2  Aspirante   → Estudante
--   tier 3  Capitão     → Analista
--   tier 4  Comandante  → Estrategista
--   tier 5  General     → Mestre
--   tier 6  Grão-Mestre → Grão-Mestre   (fica)
--   tier 7  Lenda       → Lenda         (fica)
--
-- Repare que o nome "Aprendiz" DESCE UM DEGRAU: era o tier 0 e passa a ser o
-- tier 1. É isso que torna esta migration perigosa se aplicada pela metade —
-- toda linha que hoje diz 'Aprendiz' significa tier 0, e depois significaria
-- tier 1. É por isso que a seção 4 existe.
--
-- ----------------------------------------------------------------------------
-- O que foi MEDIDO no banco antes de escrever, e não presumido:
--
--   (1) `recompute_user_title` — a função de promoção vigente — LÊ o nome de
--       `title_tiers` (`SELECT t.* FROM title_tiers … ; UPDATE user_titles SET
--       current_title = v_tier.title`). Renomear a régua propaga sozinho na
--       próxima promoção; a função NÃO precisa ser recriada aqui.
--
--   (2) NENHUMA função viva cita `v_title_map` (medido em pg_get_functiondef
--       sobre todo o schema public, prokind='f': zero linhas). As duas que a
--       usavam — 20260313400000 e 20260315100000 — já foram substituídas. Não
--       há view com "title" no nome. Nada a recriar por causa dela.
--
--   (3) Havia TRÊS lugares no banco gravando 'Aprendiz' como título INICIAL,
--       e o plano só previa os UPDATEs de dado. São a seção 4 desta migration.
--       Sem ela, todo aluno novo nasceria com `current_title = 'Aprendiz'` e
--       `achieved_tier = 0` — nome do tier 1 sobre o degrau 0. A `Badge` casa
--       o título por STRING (`src/components/ui/Badge.tsx:45`), então o aluno
--       recém-matriculado ganharia o ponto de cor do Aprendiz sendo Calouro,
--       e a conferência (d) do `verify:avatar-db` reprovaria na primeira
--       matrícula depois desta migration.
--
--   (4) População no dia: 17 alunos em tier 0 ('Aprendiz') e 2 em tier 1
--       ('Soldado'). Os 19 são reescritos pela seção 2.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. A régua
-- ----------------------------------------------------------------------------
UPDATE public.title_tiers
SET title = CASE tier
  WHEN 0 THEN 'Calouro'
  WHEN 1 THEN 'Aprendiz'
  WHEN 2 THEN 'Estudante'
  WHEN 3 THEN 'Analista'
  WHEN 4 THEN 'Estrategista'
  WHEN 5 THEN 'Mestre'
  WHEN 6 THEN 'Grão-Mestre'
  WHEN 7 THEN 'Lenda'
  ELSE title
END
WHERE tier BETWEEN 0 AND 7;

-- ----------------------------------------------------------------------------
-- 2. Os alunos, reconciliados PELO TIER que já conquistaram
--
-- Não é "traduzir string por string": é reler o nome da régua a partir do
-- degrau gravado. Quem tivesse um `current_title` fora da escada (não há
-- ninguém hoje) volta para a escada por este UPDATE.
-- ----------------------------------------------------------------------------
UPDATE public.user_titles u
SET current_title = t.title,
    updated_at = now()
FROM public.title_tiers t
WHERE t.tier = u.achieved_tier
  AND u.current_title IS DISTINCT FROM t.title;

-- ----------------------------------------------------------------------------
-- 3. O título de partida deixa de ser texto solto em três lugares
--
-- O DEFAULT da coluna, a `ensure_user_profile` e a `handle_new_user` gravavam
-- 'Aprendiz' escrito à mão. Duas delas passam a LER o primeiro degrau da
-- régua, como a `recompute_user_title` já faz — assim a próxima renomeação da
-- escada não precisa lembrar destas funções. O DEFAULT da coluna não aceita
-- subquery, então ele fica literal; é a última cópia manual, e ela só é usada
-- por INSERT que omita a coluna.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_titles
  ALTER COLUMN current_title SET DEFAULT 'Calouro';

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RETURN;
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  v_name := COALESCE(split_part(v_email, '@', 1), 'Usuário');

  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (v_user_id, COALESCE(v_email, ''), v_name, v_name, 'aluno', 0, 1, 400, 350.00, 0.060000)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- O título de partida vem da RÉGUA, não de uma string escrita aqui: é o
  -- degrau mais baixo de `title_tiers`, o mesmo que a recompute_user_title lê.
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT v_user_id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
  v_name text;
BEGIN
  -- Extrair nome do email (parte antes do @)
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  -- display_name: primeiro nome + inicial (privacidade/LGPD)
  v_display_name := split_part(v_name, ' ', 1);
  IF v_display_name = v_name AND length(v_name) > 0 THEN
    v_display_name := v_name;
  ELSIF length(v_name) > length(v_display_name) THEN
    v_display_name := v_display_name || ' ' || left(split_part(v_name, ' ', 2), 1) || '.';
  END IF;

  -- Inserir perfil em public.users
  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_display_name,
    'aluno',
    0,
    1,
    400,
    350.00,
    0.060000
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inicializar streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inicializar título pela RÉGUA (ver comentário gêmeo em ensure_user_profile)
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT NEW.id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;

  -- Baú de boas-vindas em user_chests
  INSERT INTO public.user_chests (user_id, source_type, source_id)
  VALUES (NEW.id, 'welcome', 'welcome')
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 4. Insígnias — o que era militar romano e os dois ícones de guerra e de reino
--
-- "Centurião" é oficial de legião; ⚔️ é guerra e 👑 é monarquia. As três
-- imagens vêm do reino que morreu (Bíblia v2 §7 e §10). O `key` NÃO muda —
-- ele é chave de concessão, lida por `user_achievements` e pelos gates de
-- seed; trocá-lo apagaria a conquista de quem já a tem.
--
-- "puzzle" vira "desafio" no texto do aluno pela mesma §7. Ficam de fora
-- "Modo Rating" e "Puzzle Rush", que são nomes próprios de tela.
-- ----------------------------------------------------------------------------
UPDATE public.achievements SET icon = 'chess'  WHERE key = 'defeat_first_bot';
UPDATE public.achievements SET icon = 'medal'  WHERE key = 'defeat_all_10_bots';

UPDATE public.achievements
SET title = 'Cem Desafios', description = 'Resolva 100 desafios'
WHERE key = 'solve_100_puzzles';

UPDATE public.achievements
SET title = 'Mestre dos Desafios', description = 'Resolva 500 desafios'
WHERE key = 'solve_500_puzzles';

UPDATE public.achievements
SET description = 'Alcance rating 800 em desafios'
WHERE key = 'rating_800';

UPDATE public.achievements
SET description = 'Alcance rating 1200 em desafios'
WHERE key = 'rating_1200';

-- ----------------------------------------------------------------------------
-- 5. Os comentários da tabela param de dizer "patente"
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.title_tiers IS
  'A escada de TÍTULOS da Academia 64 — 8 degraus. Cada tier > 0 fecha exatamente uma trilha (coluna trail); o tier 0 (Calouro) é onde todo aluno começa e não fecha nada. `title` é texto de aluno e foi renomeado em 2026-08-21 (Bíblia Tonal v2 §6); `trail` é chave e não muda.';

COMMENT ON COLUMN public.title_tiers.title IS
  'Nome EXIBIDO do título. A Badge do produto casa por esta string (src/components/ui/Badge.tsx) — renomear aqui exige renomear em scripts/avatar/patentes.ts na mesma janela.';

COMMENT ON COLUMN public.user_titles.current_title IS
  'Cópia do title_tiers.title do degrau em achieved_tier, gravada pela recompute_user_title. É texto de aluno, não chave.';

COMMENT ON COLUMN public.user_titles.achieved_tier IS
  'O NÚMERO do degrau, de 0 (Calouro) a 7 (Lenda). É ele — nunca o nome — que a moldura de título do avatar lê.';
