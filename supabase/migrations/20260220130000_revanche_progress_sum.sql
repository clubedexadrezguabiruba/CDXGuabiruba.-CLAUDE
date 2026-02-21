-- ============================================================
-- get_revanche_due — adicionar progress_sum para barra ponderada
--
-- progress_sum = SUM(LEAST(review_count, 3)) dos puzzles pendentes
-- Permite calcular progresso gradual: cada acerto contribui 1 ponto,
-- graduação = 3 pontos. Barra reflete progresso imediato.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_revanche_due()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_due_puzzles jsonb;
  v_total_pending integer;
  v_resolved_count integer;
  v_progress_sum integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Puzzles prontos para revisao (due now)
  SELECT jsonb_agg(
    jsonb_build_object(
      'queue_id', rq.id,
      'puzzle_id', rq.puzzle_id,
      'added_at', rq.added_at,
      'review_count', rq.review_count,
      'next_review_at', rq.next_review_at,
      'puzzle', jsonb_build_object(
        'id', p.id,
        'lichess_id', p.lichess_id,
        'fen', p.fen,
        'moves', p.moves,
        'rating', p.rating,
        'themes', p.themes
      )
    ) ORDER BY rq.next_review_at ASC
  )
  INTO v_due_puzzles
  FROM public.puzzle_revanche_queue rq
  JOIN public.puzzles p ON p.id = rq.puzzle_id
  WHERE rq.user_id = v_user_id
    AND rq.resolved = false
    AND rq.next_review_at <= now();

  -- Total pendente (nao resolvidos)
  SELECT count(*) INTO v_total_pending
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = false;

  -- Total dominados (graduados)
  SELECT count(*) INTO v_resolved_count
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = true;

  -- Soma ponderada de progresso dos pendentes (cada review_count contribui pontos, max 3)
  SELECT COALESCE(SUM(LEAST(review_count, 3)), 0) INTO v_progress_sum
  FROM public.puzzle_revanche_queue
  WHERE user_id = v_user_id AND resolved = false;

  RETURN jsonb_build_object(
    'due_puzzles', COALESCE(v_due_puzzles, '[]'::jsonb),
    'due_count', jsonb_array_length(COALESCE(v_due_puzzles, '[]'::jsonb)),
    'total_pending', v_total_pending,
    'resolved_count', v_resolved_count,
    'progress_sum', v_progress_sum
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
