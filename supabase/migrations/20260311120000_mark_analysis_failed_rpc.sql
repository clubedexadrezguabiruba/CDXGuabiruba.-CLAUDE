-- RPC para marcar analysis_status como 'failed' via server-authority
-- Necessario porque user_bot_results nao tem policy de UPDATE (apenas SELECT/INSERT)

CREATE OR REPLACE FUNCTION public.mark_analysis_failed(p_bot_result_id bigint)
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.user_bot_results
  SET analysis_status = 'failed'
  WHERE id = p_bot_result_id
    AND user_id = v_user_id
    AND analysis_status != 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
