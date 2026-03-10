-- ============================================================
-- Sprint 1.1: Atomic first-win detection
-- Elimina race condition no NOT EXISTS da bot_result v2
-- ============================================================

-- 1. Tabela de first wins (source of truth atômica)
CREATE TABLE IF NOT EXISTS public.user_bot_first_wins (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id bigint NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  won_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, bot_id)
);

ALTER TABLE public.user_bot_first_wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own first wins"
  ON public.user_bot_first_wins
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Backfill from existing wins (primeira vitória de cada par user+bot)
INSERT INTO public.user_bot_first_wins (user_id, bot_id, won_at)
SELECT DISTINCT ON (user_id, bot_id) user_id, bot_id, played_at
FROM public.user_bot_results
WHERE result = 'win'
ORDER BY user_id, bot_id, played_at
ON CONFLICT DO NOTHING;

-- 3. Rewrite bot_result: usar INSERT atômico em vez de NOT EXISTS
CREATE OR REPLACE FUNCTION public.bot_result(
  p_bot_id bigint,
  p_result text,
  p_pgn text DEFAULT NULL,
  p_time_spent_seconds integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_bot record;
  v_result_id bigint;
  v_is_first_win boolean := false;
  v_first_win_id bigint;
  v_xp_amount integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_result NOT IN ('win', 'loss', 'draw') THEN
    RAISE EXCEPTION 'Resultado inválido: %', p_result;
  END IF;

  -- Verifica bot
  SELECT * INTO v_bot FROM public.bots WHERE id = p_bot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bot não encontrado: %', p_bot_id;
  END IF;

  -- Validação de PGN: deve ter conteúdo mínimo
  IF p_pgn IS NULL OR length(trim(p_pgn)) < 10 THEN
    RAISE EXCEPTION 'PGN inválido ou ausente';
  END IF;

  -- Validação de unlock: bot com unlock_order > 1 requer vitória no anterior
  IF v_bot.unlock_order > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_bot_first_wins
      WHERE user_id = v_user_id
        AND bot_id IN (
          SELECT id FROM public.bots
          WHERE unlock_order = v_bot.unlock_order - 1
        )
    ) THEN
      RAISE EXCEPTION 'Bot bloqueado. Derrote o anterior primeiro.';
    END IF;
  END IF;

  -- Rate limiting: máximo 1 resultado por bot a cada 30 segundos
  IF EXISTS (
    SELECT 1 FROM public.user_bot_results
    WHERE user_id = v_user_id
      AND bot_id = p_bot_id
      AND played_at > now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde antes de registrar outro resultado';
  END IF;

  -- Insere resultado
  INSERT INTO public.user_bot_results (user_id, bot_id, result, pgn, time_spent_seconds)
  VALUES (v_user_id, p_bot_id, p_result, p_pgn, p_time_spent_seconds)
  RETURNING id INTO v_result_id;

  -- First-win atômico: INSERT com ON CONFLICT DO NOTHING
  -- Se outra transação já inseriu, RETURNING retorna NULL → v_first_win_id IS NULL
  IF p_result = 'win' THEN
    INSERT INTO public.user_bot_first_wins (user_id, bot_id)
    VALUES (v_user_id, p_bot_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_first_win_id;

    v_is_first_win := v_first_win_id IS NOT NULL;
  END IF;

  -- Concede XP apenas na primeira vitória contra cada bot
  IF p_result = 'win' AND v_is_first_win THEN
    v_xp_amount := GREATEST(10, v_bot.elo / 10);
    PERFORM public.grant_xp(
      p_amount := v_xp_amount,
      p_source := 'bot_win',
      p_source_id := 'bot_win_' || p_bot_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'bot_id', p_bot_id,
    'bot_name', v_bot.name,
    'result', p_result,
    'first_win', v_is_first_win
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
