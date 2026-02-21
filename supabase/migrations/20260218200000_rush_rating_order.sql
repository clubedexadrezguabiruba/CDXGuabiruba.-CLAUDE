-- ============================================================
-- Fix: Ordenar puzzles por rating crescente (dificuldade suave)
--
-- Mudança: start_rush ORDER BY rp.band, random() → rp.rating ASC
-- Afeta resistencia E rush (3min/5min)
-- ============================================================

CREATE OR REPLACE FUNCTION public.start_rush(p_mode text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_run_id bigint;
  v_puzzles jsonb;
  v_puzzle_ids bigint[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_mode NOT IN ('3min', '5min', 'resistencia') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  -- Ensure profile exists
  PERFORM public.ensure_user_profile();

  -- Expirar rush ativa anterior (se existir)
  UPDATE public.puzzle_rush_runs
  SET status = 'expired', ended_at = now()
  WHERE user_id = v_user_id AND status = 'active';

  -- Selecionar puzzles com progressão de dificuldade
  IF p_mode = 'resistencia' THEN
    -- Resistência: 60 puzzles, 5 tiers progressivos
    WITH ranked_puzzles AS (
      (SELECT id, fen, moves, rating, 1 as band
       FROM public.puzzles
       WHERE rating BETWEEN 400 AND 800
       ORDER BY random() LIMIT 5)
      UNION ALL
      (SELECT id, fen, moves, rating, 2 as band
       FROM public.puzzles
       WHERE rating BETWEEN 801 AND 1200
       ORDER BY random() LIMIT 5)
      UNION ALL
      (SELECT id, fen, moves, rating, 3 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1201 AND 1600
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 4 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1601 AND 2000
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 5 as band
       FROM public.puzzles
       WHERE rating > 2000
       ORDER BY random() LIMIT 30)
    )
    SELECT
      jsonb_agg(jsonb_build_object(
        'id', rp.id,
        'fen', rp.fen,
        'moves', rp.moves,
        'rating', rp.rating
      ) ORDER BY rp.rating ASC),
      array_agg(rp.id ORDER BY rp.rating ASC)
    INTO v_puzzles, v_puzzle_ids
    FROM ranked_puzzles rp;
  ELSE
    -- Rush (3min/5min): 35 puzzles, 4 tiers
    WITH ranked_puzzles AS (
      (SELECT id, fen, moves, rating, 1 as band
       FROM public.puzzles
       WHERE rating BETWEEN 400 AND 700
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 2 as band
       FROM public.puzzles
       WHERE rating BETWEEN 701 AND 1100
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 3 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1101 AND 1500
       ORDER BY random() LIMIT 10)
      UNION ALL
      (SELECT id, fen, moves, rating, 4 as band
       FROM public.puzzles
       WHERE rating BETWEEN 1501 AND 2200
       ORDER BY random() LIMIT 5)
    )
    SELECT
      jsonb_agg(jsonb_build_object(
        'id', rp.id,
        'fen', rp.fen,
        'moves', rp.moves,
        'rating', rp.rating
      ) ORDER BY rp.rating ASC),
      array_agg(rp.id ORDER BY rp.rating ASC)
    INTO v_puzzles, v_puzzle_ids
    FROM ranked_puzzles rp;
  END IF;

  INSERT INTO public.puzzle_rush_runs (
    user_id, mode, started_at, status, puzzle_ids, score, best_streak, lives_remaining
  ) VALUES (
    v_user_id, p_mode, now(), 'active', v_puzzle_ids, 0, 0, 3
  ) RETURNING id INTO v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'mode', p_mode,
    'puzzles', v_puzzles,
    'total_puzzles', jsonb_array_length(v_puzzles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
