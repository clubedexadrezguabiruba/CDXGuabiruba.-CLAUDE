-- =============================================================================
-- O ÓCULOS VIRA SLOT PRÓPRIO — para dar de vestir barba E óculos ao mesmo tempo
-- =============================================================================
--
-- O Doug, em 2026-08-27: *"óculos e barba não podem ser a mesma coisa. Eu preciso
-- que dê para vestir a barba e o óculos, ao mesmo tempo."*
--
-- Ele está descrevendo o mundo — óculos e barba convivem numa cara —, e o que
-- impedia era o MODELO, não o desenho: `users` guarda UMA coluna por slot e
-- `equipar_peca` escreve UM slug nela. Enquanto as duas famílias dividissem o slot
-- `rosto`, vestir uma tirava a outra, por construção.
--
-- A ALTERNATIVA FOI CONSIDERADA E É PIOR
-- ---------------------------------------
-- Deixar o slot `rosto` guardar DUAS peças fura o modelo em todo lugar de uma vez: a
-- coluna vira array, `equipar_peca` vira dois caminhos, `avatar_guarda_roupa` perde a
-- chave e as funções de leitura passam a devolver lista onde devolvem valor. Um sexto
-- slot custa uma coluna e uma linha em cada enumeração.
--
-- ⚠️ ESTA MIGRATION É O ESQUELETO, E ELA NÃO INSERE PEÇA NENHUMA
-- ---------------------------------------------------------------
-- Ela abre o slot e o torna equipável. **As cinco artes de óculos NÃO entram aqui**,
-- e isso é de propósito: os slugs são provisórios (`oculos-1` a `oculos-5`) e o Doug
-- ainda vai batizá-las — *"depois eu digo qual é a peça, qual é o nome da peça"*.
-- Slug é chave e `users.avatar_oculos` o referencia por FK; entrar com o nome errado
-- custa duas migrations em vez de uma.
--
-- Consequência declarada: enquanto o `INSERT` não vier, `verify:catalogo-slots`
-- reprova no slot `oculos` — o código desenha cinco peças e o banco tem zero. É o
-- mesmo gate reprovando pelo outro sentido, e é o certo: catálogo e código divergem
-- de verdade.
--
-- ⚠️ AS LEITURAS FICAM PARA A PRÓXIMA, e a fronteira é técnica
-- -------------------------------------------------------------
-- Seis funções e a matview `user_public_profiles` enumeram `avatar_rosto`, e a
-- matview não aceita `ADD COLUMN` — ela precisa de `DROP` + `CREATE` + os seis
-- índices + os grants. Isso é cirurgia de outra natureza e vai numa migration
-- própria, para que esta possa ser conferida numa olhada.
--
-- O que já funciona sem elas: `equipar_peca` grava, e as telas que leem `users`
-- direto (o layout e o `/perfil`) enxergam. O que ainda não: ranking, mural e perfil
-- público, que leem da matview.
--
-- SEM BEGIN/COMMIT — o postgres.js recusa transação explícita, e um lote já roda em
-- transação implícita (regra do CLAUDE.md).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. O CHECK do catálogo aceita o slot novo
-- ---------------------------------------------------------------------------
--
-- A ordem da lista é a de nascimento dos slots, como em `SLOTS` (`catalogo.ts`) —
-- `verify:catalogo-slots` compara os dois conjuntos e não a ordem, mas manter as
-- duas listas na mesma sequência é o que faz a divergência saltar aos olhos.
ALTER TABLE public.avatar_catalogo
  DROP CONSTRAINT avatar_catalogo_slot_valido;

ALTER TABLE public.avatar_catalogo
  ADD CONSTRAINT avatar_catalogo_slot_valido
  CHECK (slot IN ('traje', 'chapeu', 'rosto', 'pet', 'cabelo', 'oculos'));


-- ---------------------------------------------------------------------------
-- 2. A coluna, no mesmo molde das outras cinco
-- ---------------------------------------------------------------------------
--
-- FK para o catálogo, NULL = sem a peça, NULL é o default. Nenhum aluno passa a
-- vestir nada por causa desta migration — é o que garante que o boneco de todo mundo
-- sai byte a byte igual ao de hoje.
--
-- NULL É ESTADO LEGÍTIMO, não dado faltando: "sem óculos" é ausência de peça, do
-- mesmo jeito que careca e sem chapéu.
ALTER TABLE public.users
  ADD COLUMN avatar_oculos text DEFAULT NULL
    CONSTRAINT users_avatar_oculos_fk REFERENCES public.avatar_catalogo(slug);

COMMENT ON COLUMN public.users.avatar_oculos IS
  'Slug em avatar_catalogo (slot oculos), ou NULL = sem óculos. Escrita só por '
  'equipar_peca. Separado de avatar_rosto em 2026-08-27 para que barba e óculos '
  'possam ser vestidos ao mesmo tempo.';

COMMENT ON COLUMN public.users.avatar_rosto IS
  'Slug em avatar_catalogo (slot rosto: barba, bigode, costeleta), ou NULL = rosto '
  'limpo. Escrita só por equipar_peca. O ÓCULOS SAIU DAQUI em 2026-08-27 e tem '
  'coluna própria (avatar_oculos).';


-- ---------------------------------------------------------------------------
-- 3. `equipar_peca` ganha o slot — e são três linhas, como foi com o cabelo
-- ---------------------------------------------------------------------------
--
-- As TRÊS ORIGENS (marco_nivel, marco_patente, bau) já estão escritas e o óculos é
-- `bau`, então ele cai no ramo que já existe. O que muda é a lista de slots, o CASE
-- do UPDATE e a chave do jsonb de retorno.
--
-- O corpo abaixo é a definição VIGENTE lida do banco (`pg_get_functiondef`), com as
-- três linhas acrescentadas — não uma reescrita de memória a partir das migrations.
-- Esta função foi redefinida três vezes desde a fundação, e reconstruí-la do
-- histórico é como se perde uma validação sem ninguém notar.
CREATE OR REPLACE FUNCTION public.equipar_peca(p_slot text, p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_peca  public.avatar_catalogo%ROWTYPE;
  v_level integer;
  v_tier  integer;
  v_tem   boolean;
  v_row   public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  IF p_slot IS NULL OR p_slot NOT IN ('traje', 'chapeu', 'rosto', 'pet', 'cabelo', 'oculos') THEN
    RAISE EXCEPTION 'slot inválido: %', COALESCE(p_slot, 'NULL');
  END IF;

  SELECT level INTO v_level FROM public.users WHERE id = v_uid;

  IF v_level IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- p_slug NULL = tirar a peça. Não há o que validar: ausência não tem régua, e
  -- no slot cabelo essa ausência tem nome — é a careca, que continua não sendo
  -- linha do catálogo.
  IF p_slug IS NOT NULL THEN
    SELECT * INTO v_peca FROM public.avatar_catalogo WHERE slug = p_slug;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'peça inexistente: %', p_slug;
    END IF;

    -- Sem esta conferência, equipar um chapéu no slot do rosto grava um slug
    -- válido na coluna errada, a FK aceita, e o compositor recebe uma peça que
    -- não sabe desenhar naquela camada.
    IF v_peca.slot <> p_slot THEN
      RAISE EXCEPTION 'a peça % é do slot %, não do slot %',
        p_slug, v_peca.slot, p_slot;
    END IF;

    IF v_peca.origem = 'marco_nivel' THEN
      IF v_level < v_peca.min_level THEN
        RAISE EXCEPTION 'a peça % exige nível %, e você está no nível %',
          p_slug, v_peca.min_level, v_level;
      END IF;

    ELSIF v_peca.origem = 'marco_patente' THEN
      SELECT achieved_tier INTO v_tier
      FROM public.user_titles WHERE user_id = v_uid;

      -- COALESCE 0 porque tier 0 é a base que todo aluno tem: conta sem linha em
      -- user_titles não pode ser recusada por uma peça de Aprendiz. Que a linha
      -- exista é conferido pelo verify:avatar-db, não aqui.
      IF COALESCE(v_tier, 0) < v_peca.min_tier THEN
        RAISE EXCEPTION 'a peça % exige a patente de nível %, e você está em %',
          p_slug, v_peca.min_tier, COALESCE(v_tier, 0);
      END IF;

    ELSE  -- 'bau'
      SELECT EXISTS (
        SELECT 1 FROM public.avatar_guarda_roupa
        WHERE user_id = v_uid AND slug = p_slug
      ) INTO v_tem;

      IF NOT v_tem THEN
        RAISE EXCEPTION 'você ainda não tem a peça %', p_slug;
      END IF;
    END IF;
  END IF;

  UPDATE public.users
  SET avatar_traje  = CASE WHEN p_slot = 'traje'  THEN p_slug ELSE avatar_traje  END,
      avatar_chapeu = CASE WHEN p_slot = 'chapeu' THEN p_slug ELSE avatar_chapeu END,
      avatar_rosto  = CASE WHEN p_slot = 'rosto'  THEN p_slug ELSE avatar_rosto  END,
      avatar_pet    = CASE WHEN p_slot = 'pet'    THEN p_slug ELSE avatar_pet    END,
      avatar_cabelo = CASE WHEN p_slot = 'cabelo' THEN p_slug ELSE avatar_cabelo END,
      avatar_oculos = CASE WHEN p_slot = 'oculos' THEN p_slug ELSE avatar_oculos END
  WHERE id = v_uid
  RETURNING * INTO v_row;

  PERFORM public.refresh_public_profiles();

  RETURN jsonb_build_object(
    'avatar_traje',  v_row.avatar_traje,
    'avatar_chapeu', v_row.avatar_chapeu,
    'avatar_rosto',  v_row.avatar_rosto,
    'avatar_pet',    v_row.avatar_pet,
    'avatar_cabelo', v_row.avatar_cabelo,
    'avatar_oculos', v_row.avatar_oculos
  );
END;
$function$;


-- ---------------------------------------------------------------------------
-- 4. As asserções — e nenhuma delas conta o que eu mesmo acabei de escrever
-- ---------------------------------------------------------------------------
--
-- Contar o próprio INSERT é a asserção vácua que este repositório já pagou caro (ver
-- "gate verde por vacuidade" em ESTADO-DA-ROTA). As três abaixo perguntam ao
-- CATÁLOGO DO POSTGRES, que é outro lugar.
DO $$
DECLARE
  v_check text;
  v_col   integer;
  v_fn    text;
BEGIN
  -- 4.1 o CHECK aceita 'oculos' e continua recusando o que não existe
  SELECT pg_get_constraintdef(oid) INTO v_check
  FROM pg_constraint
  WHERE conrelid = 'public.avatar_catalogo'::regclass
    AND conname = 'avatar_catalogo_slot_valido';

  IF v_check IS NULL OR v_check NOT LIKE '%oculos%' THEN
    RAISE EXCEPTION 'o CHECK do slot não aceita oculos: %', COALESCE(v_check, 'NÃO EXISTE');
  END IF;

  IF v_check LIKE '%fundo%' THEN
    RAISE EXCEPTION 'o CHECK ressuscitou o slot fundo, que foi morto em 2026-08-13: %', v_check;
  END IF;

  -- 4.2 a coluna existe, é text, aceita NULL e tem a FK
  SELECT count(*) INTO v_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name = 'avatar_oculos' AND data_type = 'text' AND is_nullable = 'YES';

  IF v_col <> 1 THEN
    RAISE EXCEPTION 'users.avatar_oculos não existe como text nullable';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND conname = 'users_avatar_oculos_fk'
  ) THEN
    RAISE EXCEPTION 'a FK users_avatar_oculos_fk não foi criada — a coluna aceitaria slug inventado';
  END IF;

  -- 4.3 `equipar_peca` sabe do slot NOS TRÊS LUGARES. Um só não basta: a lista sem
  -- o CASE aceitaria o slot e não gravaria nada, em silêncio, que é o pior dos três
  -- estados possíveis.
  SELECT pg_get_functiondef(p.oid) INTO v_fn
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'equipar_peca';

  IF v_fn NOT LIKE '%''oculos''%' THEN
    RAISE EXCEPTION 'equipar_peca não menciona o slot oculos';
  END IF;
  IF v_fn NOT LIKE '%avatar_oculos = CASE%' THEN
    RAISE EXCEPTION 'equipar_peca aceita o slot oculos mas NÃO GRAVA a coluna';
  END IF;
  IF v_fn NOT LIKE '%''avatar_oculos'', v_row.avatar_oculos%' THEN
    RAISE EXCEPTION 'equipar_peca grava a coluna mas não a devolve ao cliente';
  END IF;

  RAISE NOTICE 'slot oculos aberto: CHECK, coluna com FK e equipar_peca nos três lugares';
END $$;
