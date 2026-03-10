-- Fix: drop old save_bot_analysis signature to avoid PostgREST ambiguity
-- The old 10-param version conflicts with the new 12-param version
DROP FUNCTION IF EXISTS public.save_bot_analysis(bigint, text, jsonb, numeric, integer, integer, integer, integer, integer, integer);

-- Recreate with metadata params
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

  SELECT * INTO v_result
  FROM public.user_bot_results
  WHERE id = p_bot_result_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resultado não encontrado ou não pertence ao usuário';
  END IF;

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
