-- ============================================================================
-- Bloco C da troca de pilha — a identidade do avatar kokeshi nasce no banco.
-- ============================================================================
--
-- ADITIVA. Nada é apagado, nada é dropado, nenhuma linha existente muda de
-- valor. Depois de dois blocos que só cortaram, este é o primeiro que constrói.
-- Ver docs/avatar/20-troca-de-pilha-plano.md, Bloco C.
--
-- O QUE ELA CRIA
-- --------------
--   1. `avatar_hair_catalog(slug, min_level)` — a régua de desbloqueio
--   2. `users.avatar_skin`, `users.avatar_hair`, `users.avatar_hair_color`
--   3. `update_avatar_identity(skin, hair, hair_color)` — a única via de escrita
--
-- Isto fecha o achado T8 (as três colunas do avatar novo tinham ZERO ocorrências
-- em supabase/migrations/, medido em 2026-08-10).
--
-- POR QUE A RÉGUA MORA NO BANCO E NÃO EM `cabelo.ts`
-- --------------------------------------------------
-- Regra Inviolável nº 1: quem concede é o servidor. Com o nível mínimo vivendo
-- só no client, "destravar o moicano" seria editar um número no devtools.
--
-- A divisão é limpa e vale escrever: a FORMA do cabelo é do código — o banco não
-- sabe desenhar nada e nunca vai saber — mas QUEM PODE USAR cada forma é decisão
-- de servidor. O que os dois lados compartilham é só o slug, e é exatamente isso
-- que `npm run verify:cabelo-catalogo` cobra, dos dois lados, a cada rodada.
--
-- A DECISÃO DE PRODUTO (Doug, 2026-08-10)
-- ---------------------------------------
-- Desbloqueio por NÍVEL de XP — não por patente, que é a régua ainda indecisa do
-- T1; amarrar aqui travaria esta frente atrás daquela.
--
--   LIVRES  (min_level 1)   careca · espetado · assimetrico
--   TRAVADOS                coque 10 · moicano 20 · chanel 30
--
-- A escada em números medidos, com a curva viva (100 × 1,08^(n−1), XP consumido)
-- e a calibração de ~300 XP/dia para aluno dedicado que o verify:xp-curve cobra:
--
--   nível 10 = 1.249 XP ≈ 4,2 dias dedicados
--   nível 20 = 4.146 XP ≈ 13,8 dias
--   nível 30 ≈ 10.400 XP ≈ 35 dias
--
-- Escolha consciente do Doug pela escada longa: o cabelo é marco raro. Com 5
-- modelos só, o terceiro degrau pode nunca ser visto por aluno casual — está
-- registrado, e a resposta é arte nova (Bloco 8 do doc 15), não escada curta.
--
-- A CARECA NÃO É LINHA DESTE CATÁLOGO, e é decisão de modelagem
-- -------------------------------------------------------------
-- Careca é a AUSÊNCIA de peça, não uma peça: `avatar_hair IS NULL`. Duas coisas
-- boas caem de graça daí — ela é sempre livre POR CONSTRUÇÃO, sem min_level a
-- comparar; e o gate pode exigir que os slugs do banco batam com `MODELOS_CABELO`
-- byte a byte, sem exceção escrita à mão dos dois lados. Uma linha 'careca' no
-- banco obrigaria as duas listas a discordarem de propósito, que é o começo de
-- toda divergência que este projeto já pagou.
--
-- O DEFAULT É NULL, E NÃO `coque` COMO O DOC 20 PREVIA
-- ----------------------------------------------------
-- O plano foi escrito quando o coque abria a lista e se presumia livre. A decisão
-- de 2026-08-10 o pôs no nível 10, e default não pode ser peça travada: o aluno
-- nasceria vestindo o que a régua lhe nega, e a primeira gravação legítima o
-- REBAIXARIA. NULL é o único valor que nenhuma escada alcança.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. O catálogo — a régua de desbloqueio
-- ---------------------------------------------------------------------------
-- Vem ANTES das colunas de `users` porque `avatar_hair` referencia esta tabela.

CREATE TABLE public.avatar_hair_catalog (
  slug      text    PRIMARY KEY,
  min_level integer NOT NULL DEFAULT 1
    CONSTRAINT avatar_hair_catalog_min_level_valido CHECK (min_level >= 1)
);

COMMENT ON TABLE public.avatar_hair_catalog IS
  'A régua de desbloqueio dos cabelos do avatar kokeshi. Os slugs têm de bater '
  'exatamente com MODELOS_CABELO de src/lib/avatar/estilo/cabelo.ts — a FORMA é '
  'do código, QUEM PODE USAR é do servidor (Regra Inviolável nº 1). A careca NÃO '
  'é linha daqui: é avatar_hair IS NULL, ausência de peça, sempre livre. '
  'Vigiada por npm run verify:cabelo-catalogo.';

COMMENT ON COLUMN public.avatar_hair_catalog.min_level IS
  'Nível de XP mínimo. 1 = livre na criação do personagem. O nível começa em 1, '
  'então não existe min_level 0 — o CHECK recusa.';

-- Nível 1 é livre: é o nível com que todo aluno nasce.
INSERT INTO public.avatar_hair_catalog (slug, min_level) VALUES
  ('espetado',    1),
  ('assimetrico', 1),
  ('coque',      10),
  ('moicano',    20),
  ('chanel',     30);

-- RLS ligada com leitura aberta a quem está logado: o Bloco E precisa mostrar o
-- cadeado E o nível que falta, então o aluno lê a régua inteira, inclusive as
-- linhas que ainda não alcança. O que ele não faz é ESCREVER nela — sem isso,
-- baixar o próprio min_level seria um UPDATE.
ALTER TABLE public.avatar_hair_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatar_hair_catalog_leitura ON public.avatar_hair_catalog
  FOR SELECT TO authenticated USING (true);

-- O REVOKE é explícito de propósito: no Supabase o schema public tem ALTER
-- DEFAULT PRIVILEGES concedendo tudo a anon/authenticated, então tabela nova
-- NASCE escrevível. Confiar só na ausência de policy deixaria a metade do grant
-- armada para uma policy distraída amanhã — é o par que o R1 aprendeu a fechar
-- junto.
REVOKE INSERT, UPDATE, DELETE ON public.avatar_hair_catalog FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.avatar_hair_catalog TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. As três colunas de `users`
-- ---------------------------------------------------------------------------
--
-- POR QUE ÍNDICE, E NÃO HEX, em `avatar_skin` e `avatar_hair_color`
-- ------------------------------------------------------------------
-- As 8 peles e as 8 cores de cabelo vivem em `src/lib/avatar/palette.ts`, e é de
-- lá que o compositor as lê. Guardar '#E9B183' aqui criaria uma SEGUNDA cópia da
-- paleta — e duas descrições da mesma coisa divergem sempre, que é a lição de
-- seis medições que o `geometria.ts` inteiro existe para não repetir.
--
-- Guarda-se o índice, e `verify:cabelo-catalogo` cobra que a faixa do CHECK tenha
-- exatamente o tamanho da paleta do código. Paleta que cresça sem migration
-- reprova; migration que abra faixa que a paleta não tem, também.
--
-- O preço está declarado: REORDENAR `PELE` ou `CABELO` muda a aparência de quem
-- já escolheu. Com 5 contas no banco isso é barato hoje. A partir do dia em que
-- não for, as duas listas são append-only.

ALTER TABLE public.users
  ADD COLUMN avatar_skin smallint NOT NULL DEFAULT 2
    CONSTRAINT users_avatar_skin_faixa CHECK (avatar_skin BETWEEN 0 AND 7),
  ADD COLUMN avatar_hair text DEFAULT NULL
    CONSTRAINT users_avatar_hair_fk REFERENCES public.avatar_hair_catalog(slug),
  ADD COLUMN avatar_hair_color smallint NOT NULL DEFAULT 0
    CONSTRAINT users_avatar_hair_color_faixa CHECK (avatar_hair_color BETWEEN 0 AND 7);

COMMENT ON COLUMN public.users.avatar_skin IS
  'Índice em PELE de src/lib/avatar/palette.ts (8 tons). Default 2 é ponto de '
  'partida, não decisão de produto: quem escolhe é a tela de criação (Bloco E). '
  'Escrita só por update_avatar_identity.';

COMMENT ON COLUMN public.users.avatar_hair IS
  'Slug em avatar_hair_catalog, ou NULL = CARECA. NULL é o default porque careca '
  'é o único estado que nenhuma escada de nível pode negar — o doc 20 previa '
  'coque, mas coque virou cabelo de nível 10 na decisão de 2026-08-10. '
  'Escrita só por update_avatar_identity.';

COMMENT ON COLUMN public.users.avatar_hair_color IS
  'Índice em CABELO de src/lib/avatar/palette.ts (8 cores). Default 0 = preto '
  '(#3A2F2A, que não é preto de verdade — ver o docstring da paleta). '
  'Escrita só por update_avatar_identity.';

-- ---------------------------------------------------------------------------
-- 3. A RPC — a única via de escrita das três colunas
-- ---------------------------------------------------------------------------
--
-- OS TRÊS PARÂMETROS SEMPRE GRAVAM. Não há o COALESCE de `set_preferencias`
-- ("NULL não mexe na coluna") **de propósito**: aqui NULL é um valor legítimo —
-- `p_hair IS NULL` é a careca. As duas convenções na mesma assinatura fariam o
-- mesmo NULL significar coisas opostas em parâmetros vizinhos, e quem chama tem
-- o estado inteiro do avatar na tela de qualquer jeito.
--
-- ELA NÃO REVALIDA A FAIXA DE `p_skin` / `p_hair_color`. Quem recusa índice fora
-- de 0..7 é o CHECK da coluna, que é a régua única — repeti-la aqui criaria a
-- segunda descrição que a seção 2 acabou de recusar. O que a função valida é o
-- que só ela pode: **existência do slug e nível do aluno**.
--
-- NÃO CHAMA `refresh_public_profiles()`, diferente da `update_avatar_base` que
-- ela sucede: a view materializada ainda não carrega as três colunas novas. Ela
-- é recriada no Bloco E, que é quem terá tela de perfil público para servir.
-- Refrescá-la aqui custaria uma varredura inteira a cada troca de cabelo sem
-- mudar um byte do que ela devolve.

CREATE OR REPLACE FUNCTION public.update_avatar_identity(
  p_skin       integer,
  p_hair       text,
  p_hair_color integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_level     integer;
  v_min_level integer;
  v_row       public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;

  IF p_skin IS NULL OR p_hair_color IS NULL THEN
    RAISE EXCEPTION 'tom de pele e cor de cabelo são obrigatórios';
  END IF;

  SELECT level INTO v_level FROM public.users WHERE id = v_uid;

  IF v_level IS NULL THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- p_hair NULL = careca. Não há o que validar: ausência de peça não tem nível
  -- mínimo, e é por isso que a careca não é linha do catálogo.
  IF p_hair IS NOT NULL THEN
    SELECT min_level INTO v_min_level
    FROM public.avatar_hair_catalog
    WHERE slug = p_hair;

    IF v_min_level IS NULL THEN
      RAISE EXCEPTION 'cabelo inexistente: %', p_hair;
    END IF;

    IF v_level < v_min_level THEN
      RAISE EXCEPTION 'o cabelo % exige nível %, e você está no nível %',
        p_hair, v_min_level, v_level;
    END IF;
  END IF;

  -- `WHERE id = v_uid` é o que substitui a policy: escreve na linha de quem
  -- chamou e em nenhuma outra. Não há parâmetro de user_id, de propósito.
  UPDATE public.users
  SET avatar_skin       = p_skin,
      avatar_hair       = p_hair,
      avatar_hair_color = p_hair_color,
      avatar_chosen     = true
  WHERE id = v_uid
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'avatar_skin',       v_row.avatar_skin,
    'avatar_hair',       v_row.avatar_hair,
    'avatar_hair_color', v_row.avatar_hair_color
  );
END;
$$;

COMMENT ON FUNCTION public.update_avatar_identity(integer, text, integer) IS
  'Única via de escrita de avatar_skin/avatar_hair/avatar_hair_color. Valida o '
  'slug contra avatar_hair_catalog e o nível do aluno contra min_level — é a '
  'metade servidor da Regra Inviolável nº 1. p_hair NULL = careca. Escreve só na '
  'linha de auth.uid(); não recebe user_id. Vigiada por verify:cabelo-catalogo, '
  'que mede a negação como o papel authenticated.';

REVOKE ALL ON FUNCTION public.update_avatar_identity(integer, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_avatar_identity(integer, text, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. O que fica deprecado — e por que NADA é dropado
-- ---------------------------------------------------------------------------
-- Convenção do projeto: coluna e função de `users` viram legado por comentário,
-- não por DROP. `users` é a tabela mais quente do sistema, e o cliente publicado
-- na `main` ainda lê `avatar_base` — o site só volta a bater com o banco no
-- Bloco F. Dropar aqui trocaria "quebrado de propósito" por "quebrado de um
-- jeito novo", sem ganho nenhum.

COMMENT ON COLUMN public.users.avatar_base IS
  'LEGADO desde o Bloco C (2026-08-10). Era male/female do avatar v2; o kokeshi '
  'não tem base sexuada — a identidade agora é avatar_skin + avatar_hair + '
  'avatar_hair_color. Não escreva nada aqui. Sai quando o cliente parar de lê-la '
  '(Bloco E/F).';

COMMENT ON FUNCTION public.update_avatar_base(text) IS
  'DEPRECADA no Bloco C (2026-08-10). Substituída por update_avatar_identity. '
  'Continua de pé porque o cliente publicado na main ainda a chama até o Bloco F.';

-- Correção de rota, e vale registrar por quê: o comentário que o Bloco B deixou
-- em `avatar_config` prometia que o Bloco C dropava a coluna e recriava a view
-- materializada. Não é o que o plano manda (doc 20, Bloco C é aditivo) nem o que
-- esta migration faz. Comentário que promete o que não aconteceu é a segunda
-- fonte de verdade nascendo — então ele é reescrito para o estado real.
COMMENT ON COLUMN public.users.avatar_config IS
  'LEGADO, esvaziada no Bloco B (2026-08-10). Era o cache dos itens equipados do '
  'avatar v2, mantido por equip_item/unequip_slot — as duas foram dropadas e as '
  'três tabelas de item também. O Bloco C NÃO a dropou: é aditivo, e a view '
  'materializada segue como estava. Ela sai quando as 3 RPCs de ranking e o '
  'cliente pararem de lê-la (Bloco E/F). Não escreva nada aqui.';
