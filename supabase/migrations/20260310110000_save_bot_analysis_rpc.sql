-- ============================================================
-- save_bot_analysis: persiste análise pós-jogo no banco
-- Idempotente via UNIQUE constraint em bot_result_id
-- ============================================================

-- 1. Adicionar UNIQUE constraint em bot_result_id para idempotência
ALTER TABLE public.bot_game_analysis
  ADD CONSTRAINT uq_analysis_bot_result_id UNIQUE (bot_result_id);

-- 2. RPC para salvar análise
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
  p_blunder integer DEFAULT 0
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
    accuracy_percent, brilliant, great, good, inaccuracy, mistake, blunder
  )
  VALUES (
    v_user_id, p_bot_result_id, v_result.bot_id, p_pgn, p_moves_analysis_json,
    p_accuracy_percent, p_brilliant, p_great, p_good, p_inaccuracy, p_mistake, p_blunder
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
    analyzed_at = now()
  RETURNING id INTO v_analysis_id;

  RETURN jsonb_build_object(
    'analysis_id', v_analysis_id,
    'bot_result_id', p_bot_result_id,
    'accuracy_percent', p_accuracy_percent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
