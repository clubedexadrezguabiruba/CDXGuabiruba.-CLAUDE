-- LANCE DE LIVRO NA REVISAO DE BATALHA
--
-- A revisao passa a classificar como "livro" o lance que ainda esta dentro da
-- teoria de abertura. Ele nao e elogio nem culpa e sai da conta da precisao,
-- entao precisa de coluna propria: somar livro dentro de "bom" mentiria na
-- contagem, e nao somar em lugar nenhum faria as sete categorias nao fecharem
-- com o total de lances.
--
-- ORDEM DE IMPLANTACAO: esta migration PRIMEIRO, frontend depois. O
-- `DEFAULT 0` de `p_book` cobre o intervalo em que o cliente antigo, com 12
-- argumentos, ainda esta no ar.

-- 1. A coluna. IF NOT EXISTS porque re-rodar migration nao pode explodir.
ALTER TABLE public.bot_game_analysis
  ADD COLUMN IF NOT EXISTS book integer NOT NULL DEFAULT 0;

-- 2. Derrubar a assinatura de 12 argumentos antes de criar a de 13.
--
-- O PostgREST NAO escolhe entre duas sobrecargas que diferem so por argumento
-- com DEFAULT: uma chamada de 12 argumentos casaria com as duas e ele devolve
-- 300 Multiple Choices. Mesmo passo de 20260311110000_analysis_workflow.sql,
-- que ja derrubou a de 10 pelo mesmo motivo.
DROP FUNCTION IF EXISTS public.save_bot_analysis(
  bigint, text, jsonb, numeric,
  integer, integer, integer, integer, integer, integer,
  integer, text
);

-- 3. A assinatura nova. `p_book` vai POR ULTIMO e com DEFAULT, para que o
--    cliente antigo de 12 argumentos continue funcionando durante o deploy.
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
  p_engine_info text DEFAULT NULL,
  p_book integer DEFAULT 0
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
    accuracy_percent, brilliant, great, good, inaccuracy, mistake, blunder, book,
    schema_version, engine_info, client_computed
  )
  VALUES (
    v_user_id, p_bot_result_id, v_result.bot_id, p_pgn, p_moves_analysis_json,
    p_accuracy_percent, p_brilliant, p_great, p_good, p_inaccuracy, p_mistake, p_blunder, p_book,
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
    book = EXCLUDED.book,
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

-- 4. search_path fixo na assinatura NOVA.
--
-- `verify:privileges` exige search_path em toda funcao SECURITY DEFINER, e ele
-- olha por assinatura: a de 13 argumentos nasce sem herdar nada da de 12.
ALTER FUNCTION public.save_bot_analysis(
  p_bot_result_id bigint, p_pgn text, p_moves_analysis_json jsonb, p_accuracy_percent numeric,
  p_brilliant integer, p_great integer, p_good integer, p_inaccuracy integer,
  p_mistake integer, p_blunder integer, p_schema_version integer, p_engine_info text,
  p_book integer
) SET search_path = public, pg_temp;

-- POSTURA DE GRANTS INALTERADA, DE PROPOSITO: `save_bot_analysis` e RPC de
-- cliente, chamada direto pelo browser e guardada por `auth.uid()` por dentro.
-- As tres versoes anteriores nunca tiveram REVOKE, e a lista de funcoes que a
-- casa trata como internas esta em scripts/verify/security/verify-privileges.ts
-- (ela nao esta la). O reload do PostgREST e automatico no Supabase, por event
-- trigger de DDL; as tres trocas de assinatura anteriores passaram por aqui.
