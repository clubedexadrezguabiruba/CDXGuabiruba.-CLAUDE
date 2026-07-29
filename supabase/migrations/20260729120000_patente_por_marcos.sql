-- ============================================================
-- PATENTE — régua por marcos de aulas concluídas (bloco 7a do doc 15)
--
-- CONTEXTO MEDIDO EM 2026-07-29, contra este banco:
--
--   `teacherdoug001` concluiu as 15 aulas da trilha `recruta` (a última em
--   2026-07-29 01:10:27, pela RPC) e continuou "Aprendiz". Ele é o único dos
--   18 usuários SEM linha em `user_titles` — cadastrou-se em 2026-02-17, antes
--   de a tabela existir (a linha mais antiga é de 2026-02-21).
--
--   O bloco de título dentro de `complete_lesson_step` fazia
--   `UPDATE public.user_titles ... WHERE user_id = v_user_id` sem UPSERT.
--   Casou zero linhas. "Soldado" foi calculado e descartado em silêncio.
--   Nenhum gate cobria isso, então passou 4 meses despercebido.
--
-- SÃO TRÊS DEFEITOS, e esta migration fecha os três:
--
--   1. UPDATE sem UPSERT           → recompute_user_title() garante a linha
--   2. Concessão só no evento      → reconciliação idempotente + backfill
--   3. Régua hard-coded na função  → tabela `title_tiers`
--
--   O (3) é o que o doc 15 chamava de causa única: um
--   `ARRAY['recruta','soldado',...]` de 7 trilhas dentro do corpo da função,
--   contra 2 trilhas no banco. Era código carregando uma premissa sobre o
--   conteúdo sem ter como saber que ela mudou — a mesma família da curva de XP
--   que ficou 4 meses errada. Vira dado, e o gate confere a premissa.
--
-- RÉGUA (decisão do usuário, 2026-07-29): a patente vem de concluir uma
-- "trilha de nível", e cada nível são 30 aulas — Iniciante 1–30,
-- Intermediário 31–60, e assim por diante. Os nomes dos níveis acima do
-- Intermediário ainda não foram definidos: ficam NULL de propósito.
--
-- Implementado como CONTAGEM de aulas concluídas, não como "as 30 primeiras
-- aulas". São equivalentes hoje (o desbloqueio é sequencial), mas "as 30
-- primeiras" quebra se uma trilha for inserida no meio do currículo.
--
-- ATENÇÃO: com 30 aulas no banco, só a patente 1 (Soldado) é alcançável.
-- As outras 6 esperam conteúdo. Isso é intencional e o gate reporta —
-- é o que impede desenhar 6 uniformes que ninguém vestiria.
--
-- NÃO ENTRA AQUI: conceder e equipar o uniforme da patente (bloco 7b).
-- `items` tem 8 uniformes e 0 renderáveis — o item existiria invisível.
-- A coluna `outfit_item_id` já reserva o lugar.
--
-- Gate: npm run verify:avatar-db (falha antes desta migration, passa depois)
-- ============================================================

-- ------------------------------------------------------------
-- 1. A régua vira dado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.title_tiers (
  tier              integer PRIMARY KEY,
  title             text NOT NULL UNIQUE,
  level_name        text,
  lessons_required  integer NOT NULL,
  outfit_item_id    bigint REFERENCES public.items(id),
  CONSTRAINT title_tiers_tier_nao_negativo CHECK (tier >= 0),
  CONSTRAINT title_tiers_aulas_nao_negativas CHECK (lessons_required >= 0)
);

COMMENT ON TABLE public.title_tiers IS
  'Régua das patentes. Mudar marco ou acrescentar tier é INSERT/UPDATE aqui — nunca editar função.';
COMMENT ON COLUMN public.title_tiers.tier IS
  'Ordem da patente. 0 = base (todo aluno começa nela).';
COMMENT ON COLUMN public.title_tiers.level_name IS
  'Nome da trilha de nível que a patente fecha. NULL = nível ainda não nomeado.';
COMMENT ON COLUMN public.title_tiers.outfit_item_id IS
  'Uniforme concedido ao atingir a patente (bloco 7b). NULL enquanto não houver arte renderizável.';

ALTER TABLE public.title_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS title_tiers_select_all ON public.title_tiers;
CREATE POLICY title_tiers_select_all ON public.title_tiers
  FOR SELECT TO authenticated USING (true);

-- Dado de referência: leitura para todo aluno logado, escrita para ninguém.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.title_tiers FROM anon, authenticated;
GRANT SELECT ON public.title_tiers TO authenticated;

INSERT INTO public.title_tiers (tier, title, level_name, lessons_required) VALUES
  (0, 'Aprendiz',    NULL,             0),
  (1, 'Soldado',     'Iniciante',      30),
  (2, 'Aspirante',   'Intermediário',  60),
  (3, 'Capitão',     NULL,             90),
  (4, 'Comandante',  NULL,             120),
  (5, 'General',     NULL,             150),
  (6, 'Grão-Mestre', NULL,             180),
  (7, 'Lenda',       NULL,             210)
ON CONFLICT (tier) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Marca d'água da patente atingida
--
-- Monotônica de propósito: o modo retry de complete_lesson_step zera
-- `completed` antes de reconcluir a aula, então a contagem cai por um
-- instante. Sem marca d'água, o aluno seria rebaixado durante o próprio
-- retry e promovido de novo logo em seguida — com evento no mural das duas
-- vezes.
-- ------------------------------------------------------------
ALTER TABLE public.user_titles
  ADD COLUMN IF NOT EXISTS achieved_tier integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_titles.highest_trail_completed IS
  'DEPRECADA em 2026-07-29. A régua deixou de ser por trilha; use achieved_tier. Mantida para não quebrar leitura antiga.';

-- ------------------------------------------------------------
-- 3. A reconciliação
--
-- Idempotente: pode ser chamada quantas vezes for, em qualquer momento, e
-- converge para o mesmo estado. É o que faltava — a concessão antiga só
-- existia dentro da transação exata que concluía a trilha, então qualquer
-- coisa que fizesse aquela transação errar o alvo perdia a patente para
-- sempre.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_user_title(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_concluidas integer;
  v_tier record;
  v_atual integer;
  v_titulo text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_concluidas
  FROM public.user_lesson_progress
  WHERE user_id = p_user_id AND completed;

  SELECT t.* INTO v_tier
  FROM public.title_tiers t
  WHERE t.lessons_required <= v_concluidas
  ORDER BY t.tier DESC
  LIMIT 1;

  -- Régua vazia ou mal seeded: não inventa título.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Garante a linha antes de qualquer comparação. É exatamente o passo cuja
  -- ausência fez a patente do teacherdoug001 sumir.
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT p_user_id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;

  SELECT ut.achieved_tier, ut.current_title INTO v_atual, v_titulo
  FROM public.user_titles ut
  WHERE ut.user_id = p_user_id;

  IF v_tier.tier <= v_atual THEN
    RETURN v_titulo;
  END IF;

  UPDATE public.user_titles
  SET current_title = v_tier.title,
      achieved_tier = v_tier.tier,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- O ranking lê de user_public_profiles, que é materializada.
  PERFORM public.refresh_public_profiles();

  PERFORM public.emit_class_feed(
    p_user_id,
    'title_earned',
    jsonb_build_object('title', v_tier.title)
  );

  RETURN v_tier.title;
END;
$function$;

COMMENT ON FUNCTION public.recompute_user_title(uuid) IS
  'Helper interno idempotente. EXECUTE revogado de anon/authenticated: recebe user_id arbitrário, só chamável por outra função SECURITY DEFINER.';

REVOKE EXECUTE ON FUNCTION public.recompute_user_title(uuid) FROM anon, authenticated, PUBLIC;

-- ------------------------------------------------------------
-- 4. complete_lesson_step passa a delegar
--
-- Corpo extraído de pg_get_functiondef() do banco vivo em 2026-07-29 e
-- alterado em dois pontos: as variáveis do bloco de título saíram do DECLARE,
-- e o bloco inteiro virou um PERFORM. Nada mais foi tocado.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_lesson_step(p_lesson_id bigint, p_step_index integer, p_move text, p_used_hint boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson record;
  v_progress record;
  v_content jsonb;
  v_exercise jsonb;
  v_expected jsonb;
  v_correct boolean := false;
  v_stars integer := 0;
  v_lesson_completed boolean := false;
  v_prev_lesson record;
  v_review_gate record;
BEGIN
  -- 1. Auth check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 2. Busca aula
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada: %', p_lesson_id;
  END IF;

  -- Validação de step_index
  IF p_step_index < 1 OR p_step_index > v_lesson.total_steps THEN
    RAISE EXCEPTION 'Step inválido: % (total: %)', p_step_index, v_lesson.total_steps;
  END IF;

  -- 3. Guard unlock: verifica que a aula está desbloqueada
  IF v_lesson.trail_order > 1 THEN
    SELECT ulp.completed INTO v_prev_lesson
    FROM public.lessons l
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.lesson_id = l.id AND ulp.user_id = v_user_id
    WHERE l.trail = v_lesson.trail
      AND l.trail_order = v_lesson.trail_order - 1;

    IF NOT FOUND OR NOT COALESCE(v_prev_lesson.completed, false) THEN
      RETURN jsonb_build_object(
        'correct', false,
        'error', 'lesson_locked',
        'steps_completed', 0,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', false,
        'stars', null,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Guard unlock para Soldado: requer Review Gate da Recruta
  IF v_lesson.trail = 'soldado' THEN
    SELECT * INTO v_review_gate
    FROM public.review_gate_attempts
    WHERE user_id = v_user_id AND trail = 'recruta';

    IF NOT FOUND OR NOT v_review_gate.passed THEN
      RETURN jsonb_build_object(
        'correct', false,
        'error', 'lesson_locked',
        'steps_completed', 0,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', false,
        'stars', null,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Busca progresso existente
  SELECT * INTO v_progress
  FROM public.user_lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  -- Guard: aula já completa
  IF v_progress IS NOT NULL AND v_progress.completed THEN
    IF p_step_index = 1 THEN
      -- RETRY MODE: reset progress but keep stars for MAX comparison
      UPDATE public.user_lesson_progress
      SET steps_completed = 0,
          completed = false,
          completed_at = NULL,
          errors = 0,
          hints_used = 0
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

      SELECT * INTO v_progress
      FROM public.user_lesson_progress
      WHERE user_id = v_user_id AND lesson_id = p_lesson_id;
    ELSE
      RETURN jsonb_build_object(
        'correct', true,
        'steps_completed', v_progress.steps_completed,
        'total_steps', v_lesson.total_steps,
        'lesson_completed', true,
        'stars', v_progress.stars,
        'xp_gained', 0
      );
    END IF;
  END IF;

  -- Guard: step já resolvido
  IF v_progress IS NOT NULL AND v_progress.steps_completed >= p_step_index THEN
    RETURN jsonb_build_object(
      'correct', true,
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', v_progress.completed,
      'stars', v_progress.stars,
      'xp_gained', 0
    );
  END IF;

  -- Guard sequencial: não pode pular exercícios
  IF v_progress IS NOT NULL AND p_step_index > v_progress.steps_completed + 1 THEN
    RETURN jsonb_build_object(
      'correct', false,
      'error', 'step_locked',
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  IF v_progress IS NULL AND p_step_index > 1 THEN
    RETURN jsonb_build_object(
      'correct', false,
      'error', 'step_locked',
      'steps_completed', 0,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  -- 4. Extrai o N-ésimo exercício do content_json
  v_content := v_lesson.content_json;

  SELECT elem INTO v_exercise
  FROM (
    SELECT elem, ROW_NUMBER() OVER (ORDER BY ord) AS exercise_index
    FROM (
      SELECT elem, ord
      FROM jsonb_array_elements(v_content -> 'sections') WITH ORDINALITY AS t(elem, ord)
      WHERE elem ->> 'type' = 'exercise'
    ) exercises
  ) numbered
  WHERE exercise_index = p_step_index;

  IF v_exercise IS NULL THEN
    RAISE EXCEPTION 'Exercício % não encontrado na aula %', p_step_index, p_lesson_id;
  END IF;

  -- 5. Compara p_move contra expected_moves[]
  v_expected := v_exercise -> 'expected_moves';
  v_correct := EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_expected) AS m
    WHERE m = p_move
  );

  -- 6. Se errado → incrementa errors, retorna
  IF NOT v_correct THEN
    INSERT INTO public.user_lesson_progress (user_id, lesson_id, steps_completed, errors)
    VALUES (v_user_id, p_lesson_id, 0, 1)
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      errors = user_lesson_progress.errors + 1;

    SELECT * INTO v_progress
    FROM public.user_lesson_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

    RETURN jsonb_build_object(
      'correct', false,
      'steps_completed', v_progress.steps_completed,
      'total_steps', v_lesson.total_steps,
      'lesson_completed', false,
      'stars', null,
      'xp_gained', 0
    );
  END IF;

  -- 7. Certo: upsert progresso + hint tracking
  INSERT INTO public.user_lesson_progress (
    user_id, lesson_id, steps_completed,
    hints_used
  )
  VALUES (
    v_user_id, p_lesson_id, p_step_index,
    CASE WHEN p_used_hint THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    steps_completed = GREATEST(user_lesson_progress.steps_completed, p_step_index),
    hints_used = user_lesson_progress.hints_used + CASE WHEN p_used_hint THEN 1 ELSE 0 END;

  -- Re-busca progresso atualizado
  SELECT * INTO v_progress
  FROM public.user_lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  -- 8. Se completou todos os steps E ainda não estava completed
  IF v_progress.steps_completed >= v_lesson.total_steps AND NOT v_progress.completed THEN
    -- Calcula estrelas da tentativa atual
    IF v_progress.errors = 0 AND v_progress.hints_used = 0 THEN
      v_stars := 3;
    ELSIF v_progress.errors <= 2 THEN
      v_stars := 2;
    ELSE
      v_stars := 1;
    END IF;

    -- Retry detection: stars column still has old value from previous completion
    IF v_progress.stars IS NOT NULL THEN
      v_stars := GREATEST(v_stars, v_progress.stars);
    END IF;

    -- Marca completed + stars
    UPDATE public.user_lesson_progress
    SET completed = true,
        completed_at = now(),
        stars = v_stars
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

    -- NÃO concede XP direto — XP vem de missões e conquistas
    v_lesson_completed := true;

    -- Atualizar missões diárias
    PERFORM public.check_daily_missions();

    -- PATENTE: reconciliação idempotente.
    --
    -- Substitui o bloco inline que existia aqui. Ele comparava a trilha
    -- concluída contra um array de 7 trilhas hard-coded e fazia UPDATE (não
    -- UPSERT) em user_titles. Quem não tinha linha na tabela — o caso de
    -- quem se cadastrou antes de ela existir — perdia a patente em silêncio.
    -- Ver recompute_user_title().
    PERFORM public.recompute_user_title(v_user_id);
  ELSE
    v_lesson_completed := v_progress.completed;
    v_stars := v_progress.stars;
  END IF;

  -- 9. Retorna resultado
  RETURN jsonb_build_object(
    'correct', true,
    'steps_completed', v_progress.steps_completed,
    'total_steps', v_lesson.total_steps,
    'lesson_completed', v_lesson_completed,
    'stars', CASE WHEN v_lesson_completed THEN v_stars ELSE null END,
    'xp_gained', 0
  );
END;
$function$;

-- ------------------------------------------------------------
-- 5. Backfill
--
-- Cria a linha de quem não tem (hoje: 1 usuário) e promove quem já passou do
-- marco. Idempotente — rodar de novo não muda nada.
-- ------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.users LOOP
    PERFORM public.recompute_user_title(r.id);
  END LOOP;
END $$;
