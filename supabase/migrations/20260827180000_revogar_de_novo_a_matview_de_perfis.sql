-- =============================================================================
-- REVOGAR DE NOVO A LEITURA DIRETA DA MATVIEW — conserto de regressão
-- =============================================================================
--
-- (!!) ESTA MIGRATION CONSERTA UM DEFEITO DE SEGURANÇA QUE A ANTERIOR ABRIU.
--
-- A `20260827170000` derrubou e recriou `user_public_profiles` para acrescentar
-- `avatar_oculos`. **Relação nova nasce com as DEFAULT PRIVILEGES do Supabase**, que
-- concedem tudo a `anon` e `authenticated`:
--
--     relacl depois do CREATE:
--       {postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--        authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}
--
-- Com isso, qualquer cliente com a chave pública passava a ler a matview DIRETO —
-- pulando `get_ranking` e `get_public_profile`, que são `SECURITY DEFINER` e aplicam
-- `mask_display_name`. O nome real dos alunos ficava exposto, e junto com ele a
-- coluna `ranking_visible` deixava de proteger quem pediu para não aparecer.
--
-- Quem pegou: `verify:perfil-publico`, com duas linhas —
--   [FAIL] anon LÊ a matview direto, e não deveria
--   [FAIL] authenticated LÊ a matview direto, e não deveria
--
-- CINCO MIGRATIONS ANTERIORES JÁ FAZIAM ISTO, E O PADRÃO ESTAVA ESCRITO
-- ----------------------------------------------------------------------
-- `20260806150000`, `20260810200000`, `20260811160000`, `20260813120000` e
-- `20260813180000` terminam todas com a MESMA linha. Toda vez que esta matview é
-- recriada, o REVOKE vem junto — porque o CREATE a re-concede. A migration anterior
-- foi a primeira a recriá-la sem ele.
--
-- (!!) A CAUSA RAIZ É `information_schema`, E ELA MORDEU DUAS VEZES NO MESMO DIA
-- ------------------------------------------------------------------------------
-- Antes de derrubar a matview eu conferi os grants por
-- `information_schema.role_table_grants` e obtive ZERO linhas — e concluí "não há
-- grant a restaurar". **O padrão SQL não cobre matview** (`pg_class.relkind = 'm'`):
-- zero ali não é ausência de grant, é cegueira da régua.
--
-- A MESMA cegueira já tinha derrubado a asserção 4.1 daquela migration, que
-- perguntava as colunas a `information_schema.columns` e recebia 0 de 8 sobre uma
-- matview correta. Ali o erro foi para o lado seguro — a transação desfez tudo. Aqui
-- foi para o lado inseguro, porque o que eu media era uma AUSÊNCIA: régua cega
-- confirma ausência de qualquer coisa.
--
-- **A lição, e ela vale para toda régua de permissão: matview se mede em `pg_class`,
-- pela coluna `relacl`.** É o que a asserção abaixo faz.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda em
-- transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. O REVOKE — a mesma linha das cinco migrations anteriores
-- ---------------------------------------------------------------------------
--
-- `PUBLIC` entra junto porque uma concessão a PUBLIC alcança todo papel, inclusive os
-- que ainda não existem. Ela é a que sobreviveria a um `REVOKE ... FROM anon,
-- authenticated` sozinho.
REVOKE ALL ON public.user_public_profiles FROM anon, authenticated, PUBLIC;


-- ---------------------------------------------------------------------------
-- 2. A asserção — em `pg_class.relacl`, que é o único lugar que enxerga matview
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_acl text;
  v_pode boolean;
BEGIN
  SELECT relacl::text INTO v_acl
  FROM pg_class WHERE oid = 'public.user_public_profiles'::regclass;

  -- 2.1 nem anon nem authenticated aparecem na ACL
  IF v_acl LIKE '%anon=%' OR v_acl LIKE '%authenticated=%' THEN
    RAISE EXCEPTION
      'anon ou authenticated ainda estão na ACL da matview: %. Eles leriam o nome '
      'real dos alunos sem passar por mask_display_name', v_acl;
  END IF;

  -- 2.2 O CONTROLE, e ele é o que impede esta asserção de passar por vacuidade:
  -- `has_table_privilege` responde a pergunta de verdade — "este papel CONSEGUE
  -- ler?" — em vez de procurar texto numa string. Se a ACL mudasse de formato, a
  -- 2.1 passaria calada e esta continuaria certa.
  SELECT has_table_privilege('anon', 'public.user_public_profiles', 'SELECT')
    INTO v_pode;
  IF v_pode THEN
    RAISE EXCEPTION 'anon AINDA consegue dar SELECT na matview — o REVOKE não pegou';
  END IF;

  SELECT has_table_privilege('authenticated', 'public.user_public_profiles', 'SELECT')
    INTO v_pode;
  IF v_pode THEN
    RAISE EXCEPTION 'authenticated AINDA consegue dar SELECT na matview';
  END IF;

  -- 2.3 e o DONO continua conseguindo — senão as funções SECURITY DEFINER, que
  -- rodam como postgres, parariam de servir o ranking e o defeito trocaria de lado.
  SELECT has_table_privilege('postgres', 'public.user_public_profiles', 'SELECT')
    INTO v_pode;
  IF NOT v_pode THEN
    RAISE EXCEPTION 'o REVOKE alcançou o DONO — as RPCs de ranking parariam de ler';
  END IF;

  RAISE NOTICE 'matview revogada: anon e authenticated fora, dono intacto. ACL agora: %',
    COALESCE(v_acl, 'NULL (só o dono)');
END $$;
