-- ============================================================
-- Fase 3 — Tarefa 3.4 + 3.7
-- Trigger: novo cadastro em auth.users → insert em public.users
-- + user_streaks, user_titles, baú de boas-vindas
-- Idempotente: ON CONFLICT DO NOTHING em todos os inserts
-- ============================================================

-- Função chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- 3.4: Inserir perfil em public.users com defaults do Roadmap
  INSERT INTO public.users (id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_volatility)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_display_name,
    'aluno',     -- role padrão
    0,           -- xp inicial
    1,           -- level inicial
    400,         -- puzzle_rating inicial (Visão seção 6.2)
    350.00,      -- puzzle_rd inicial
    0.060000     -- puzzle_volatility inicial
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inicializar streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inicializar título
  INSERT INTO public.user_titles (user_id, current_title)
  VALUES (NEW.id, 'Aprendiz')
  ON CONFLICT (user_id) DO NOTHING;

  -- 3.7: Baú de boas-vindas (1 por usuário, data sentinela '0001-01-01')
  -- Usa a tabela daily_chests existente com data impossível para não conflitar
  -- com baús diários reais. Pode ser aberto via claim_chest RPC normalmente.
  INSERT INTO public.daily_chests (user_id, chest_date, claimed)
  VALUES (NEW.id, '0001-01-01', false)
  ON CONFLICT (user_id, chest_date) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: dispara após insert em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
