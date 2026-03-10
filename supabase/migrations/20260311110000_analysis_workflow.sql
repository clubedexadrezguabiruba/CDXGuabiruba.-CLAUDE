-- ============================================================
-- Sprint 2.1: analysis_status em user_bot_results + metadados em bot_game_analysis
-- ============================================================

-- 1. Status do workflow em user_bot_results
ALTER TABLE public.user_bot_results
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.user_bot_results
  ADD CONSTRAINT chk_analysis_status
  CHECK (analysis_status IN ('none', 'completed', 'failed'));

-- 2. Backfill: resultados que já têm análise = 'completed'
UPDATE public.user_bot_results r
SET analysis_status = 'completed'
WHERE EXISTS (
  SELECT 1 FROM public.bot_game_analysis a
  WHERE a.bot_result_id = r.id
);

-- 3. Metadados em bot_game_analysis (só análises completas)
ALTER TABLE public.bot_game_analysis
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS engine_info text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_computed boolean NOT NULL DEFAULT true;

-- 4. Drop old signature to avoid PostgREST ambiguity, then recreate with metadata
DROP FUNCTION IF EXISTS public.save_bot_analysis(bigint, text, jsonb, numeric, integer, integer, integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.save_bot_analysis(
  p_bot_result_id bigint,
  p_pgn text,
  p_moves_analysis_json jsonb,
  p_accuracy_percent numeric,
  p_brilliant integer DEFAULT 0,
  p_great integer DEFAULT 0,
  p_good integer DEFAULT 0,
  p_inaccuracy integer DEFAULT 0,
  p_mistake integer DEFAULT 0,
  p_blunder integer DEFAULT 0,
  p_schema_version integer DEFAULT 1,
  p_engine_info text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result record;
  v_analysis_id bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Verifica que o resultado pertence ao usuário
  SELECT * INTO v_result
  FROM public.user_bot_results
  WHERE id = p_bot_result_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resultado não encontrado ou não pertence ao usuário';
  END IF;

  -- Insere ou atualiza (idempotente via UNIQUE em bot_result_id)
  INSERT INTO public.bot_game_analysis (
    user_id, bot_result_id, bot_id, pgn, moves_analysis_json,
    accuracy_percent, brilliant, great, good, inaccuracy, mistake, blunder,
    schema_version, engine_info, client_computed
  )
  VALUES (
    v_user_id, p_bot_result_id, v_result.bot_id, p_pgn, p_moves_analysis_json,
    p_accuracy_percent, p_brilliant, p_great, p_good, p_inaccuracy, p_mistake, p_blunder,
    p_schema_version, p_engine_info, true
  )
  ON CONFLICT (bot_result_id) DO UPDATE SET
    moves_analysis_json = EXCLUDED.moves_analysis_json,
    accuracy_percent = EXCLUDED.accuracy_percent,
    brilliant = EXCLUDED.brilliant,
    great = EXCLUDED.great,
    good = EXCLUDED.good,
    inaccuracy = EXCLUDED.inaccuracy,
    mistake = EXCLUDED.mistake,
    blunder = EXCLUDED.blunder,
    schema_version = EXCLUDED.schema_version,
    engine_info = EXCLUDED.engine_info,
    analyzed_at = now()
  RETURNING id INTO v_analysis_id;

  -- Atualizar analysis_status em user_bot_results
  UPDATE public.user_bot_results
  SET analysis_status = 'completed'
  WHERE id = p_bot_result_id;

  RETURN jsonb_build_object(
    'analysis_id', v_analysis_id,
    'bot_result_id', p_bot_result_id,
    'accuracy_percent', p_accuracy_percent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
