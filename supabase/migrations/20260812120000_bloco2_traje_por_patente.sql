-- ============================================================================
-- BLOCO 2 do doc 21 — traje por patente: a promoção veste
-- ============================================================================
--
-- ADITIVA. Nenhum aluno muda de aparência por causa desta migration: as 9 peças
-- entram no catálogo, mas `users.avatar_traje` continua NULL em todo mundo até
-- que alguém escolha ou seja promovido. E mesmo quando o Aprendiz for vestido
-- com a opção A, o SVG sai **byte a byte igual** ao de hoje — medido em 4
-- configurações, inclusive o modo do produto (ver §2 abaixo).
--
-- Ver docs/avatar/21-slots-do-avatar-plano.md, §7 (Bloco 2).
--
-- ⚠️ **ESTA MIGRATION NÃO PODE SER APLICADA SOZINHA.** O gate
-- `verify:catalogo-slots` exige que o conjunto de slugs do banco seja IGUAL ao
-- de `src/lib/avatar/catalogo.ts`, slot a slot, nos dois sentidos. Aplicá-la sem
-- o código das 9 peças deixa 9 slugs órfãos e o gate reprova na hora — que é
-- exatamente o comportamento desejado, e é a trava nº 2 do doc 21 §1.3.
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A coluna `ordem` — porque "a 1ª opção" não existia no banco
-- ---------------------------------------------------------------------------
--
-- O doc 21 §7 manda "auto-equipar a 1ª opção na promoção". Primeira por qual
-- régua? Ordenando por slug, `traje-soldado-avental` viria antes de
-- `traje-soldado-farda`, e a promoção vestiria o avental de oficina em vez da
-- farda lisa, que é a peça neutra da patente. O plano não previu isto porque
-- nomeava as opções "A, B, C"; os slugs saíram descritivos — que é melhor de
-- ler — e a ordem implícita morreu com o nome.
--
-- Uma coluna resolve os dois usos: o auto-equipar e a ordem dos cards no
-- editor. Sem ela o editor também ordenaria alfabeticamente, e a criança veria
-- as opções numa ordem que ninguém escolheu.

ALTER TABLE public.avatar_catalogo
  ADD COLUMN ordem smallint NOT NULL DEFAULT 100;

COMMENT ON COLUMN public.avatar_catalogo.ordem IS
  'Ordem de apresentação dentro do slot e do marco. Menor vem primeiro. É ela '
  'que define a "1ª opção" que a promoção veste automaticamente — sem ela a '
  'ordem seria a alfabética do slug, que não é escolha de ninguém. O default '
  '100 deixa peça sem ordem declarada cair no fim, nunca no começo.';

-- ---------------------------------------------------------------------------
-- 2. As 9 peças
-- ---------------------------------------------------------------------------
--
-- SÃO 9 E NÃO 11, e a diferença é decisão do Doug em 2026-08-12, tomada com a
-- medição na mesa. O plano previa 3 + 4 + 4; a régua de SILHUETA BINÁRIA — que
-- mede forma e ignora tinta — mostrou que a quarta opção de Soldado e de
-- Aspirante repetia a terceira:
--
--   ENTALHE × PONTAS, no Soldado     silhueta 1,47%   (a régua de cor dizia 10,18%)
--   ENTALHE × PONTAS, no Aspirante   silhueta 1,56%   (a régua de cor dizia 14,91%)
--
-- Trinta pixels de diferença de forma. A régua antiga media TINTA e teria
-- aprovado as duas; o olho tinha visto antes de a régua existir ("entalhe e
-- pontas são a mesma palavra"). As duas peças foram cortadas em vez de
-- redesenhadas, porque o teto de silhueta deste boneco é 4,2 px e não há
-- terceiro evento genuíno para pôr no lugar.
--
-- `origem = 'marco_patente'` nas nove. **O Aprendiz é `min_tier = 0`, que todo
-- aluno satisfaz** — sem caso especial no código e sem exceção na RPC, que é a
-- decisão do doc 21 §1.2. A `equipar_peca` já trata isso: ela faz
-- `COALESCE(achieved_tier, 0) >= min_tier`, então conta sem linha em
-- `user_titles` também passa.
--
-- A ORDEM 10 É SEMPRE A PEÇA LISA de cada patente — Macacão, Farda,
-- Sobrecasaca. É ela que a promoção veste, e ser a mais neutra é o ponto:
-- quem foi promovido ganha o uniforme da patente, não uma variação dele.

INSERT INTO public.avatar_catalogo (slug, slot, origem, min_tier, ordem) VALUES
  -- Aprendiz (tier 0) — o Acampamento dos Recrutas, traje de TREINO.
  -- A opção A é o macacão que o boneco já veste: `tinta.cor = TRAJE_BASE.roupa`
  -- e nenhuma decoração. `tintaTronco()` resolve "com traje" e "sem traje" na
  -- mesma linha (compositor.ts:369), então o SVG sai byte a byte igual ao de
  -- antes deste bloco — medido em 4 configurações, incluindo `folhaExterna`
  -- (o modo do produto) e o caso com cabelo. Custo de arte zero.
  ('traje-aprendiz-macacao',      'traje', 'marco_patente', 0, 10),
  ('traje-aprendiz-avental',      'traje', 'marco_patente', 0, 20),
  ('traje-aprendiz-calca',        'traje', 'marco_patente', 0, 30),

  -- Soldado (tier 1) — a Vila dos Soldados. Pano oliva #78833B (doc 17).
  ('traje-soldado-farda',         'traje', 'marco_patente', 1, 10),
  ('traje-soldado-duas-pecas',    'traje', 'marco_patente', 1, 20),
  ('traje-soldado-avental',       'traje', 'marco_patente', 1, 30),

  -- Aspirante (tier 2) — a Fortaleza dos Estrategistas. Ardósia #384966.
  ('traje-aspirante-sobrecasaca', 'traje', 'marco_patente', 2, 10),
  ('traje-aspirante-peitilho',    'traje', 'marco_patente', 2, 20),
  ('traje-aspirante-sobretudo',   'traje', 'marco_patente', 2, 30);

-- As patentes 3 a 6 (Capitão, Comandante, General, Mestre) NÃO recebem traje
-- aqui, e a ausência é a trava nº 1 do doc 21 §1.3: arte por demanda, nunca
-- estoque. Elas ganham as suas quando a trilha delas tiver conteúdo — e é isso
-- que a conferência nova do `verify:avatar-db` passa a exigir no sentido
-- inverso: nenhum traje pode existir para patente que ninguém alcança.

-- ---------------------------------------------------------------------------
-- 3. recompute_user_title v2 — a promoção VESTE
-- ---------------------------------------------------------------------------
--
-- Corpo de 20260729120000_patente_por_marcos.sql:115-180, com UM bloco novo.
--
-- POR QUE AQUI E NÃO NO CLIENTE. Regra Inviolável nº 1: toda concessão acontece
-- no servidor. A promoção já é servidor — ela nasce de `complete_lesson_step`,
-- que conta aulas dentro da transação. Vestir do lado do cliente exigiria que a
-- tela soubesse que houve promoção, e o aluno que fechasse o navegador entre a
-- última aula e o próximo login ficaria com o uniforme velho.
--
-- POR QUE NÃO CHAMA `equipar_peca`. Aquela RPC lê `auth.uid()` — ela é a porta
-- do CLIENTE, e valida o direito de quem está pedindo. Aqui quem veste é o
-- servidor concedendo um marco que ele mesmo acabou de conferir, sobre um
-- `p_user_id` que pode nem ser o do caller (a reconciliação roda em lote). O
-- UPDATE direto é o certo; o que ele não pode é pular a régua, e não pula: o
-- `WHERE min_tier = v_tier.tier` só encontra peça daquela patente.
--
-- SOBRESCREVE A ESCOLHA ANTERIOR, E É O COMPORTAMENTO PEDIDO. "A promoção
-- veste" (doc 21 §7). O traje que o aluno tinha era de uma patente INFERIOR;
-- mantê-lo faria a promoção não aparecer, que é o oposto do ponto do bloco. Ele
-- troca depois no perfil, e as outras opções da patente nova já estão liberadas.
--
-- IDEMPOTENTE COMO A IRMÃ. O bloco vive DENTRO do `IF v_tier.tier > v_atual`
-- que já existe, então rodar a reconciliação dez vezes veste uma vez só — e uma
-- chamada que não promove não mexe no traje de ninguém.

CREATE OR REPLACE FUNCTION public.recompute_user_title(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_concluidas integer;
  v_tier record;
  v_atual integer;
  v_titulo text;
  v_traje text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_concluidas
  FROM public.user_lesson_progress
  WHERE user_id = p_user_id AND completed;

  SELECT t.* INTO v_tier
  FROM public.title_tiers t
  WHERE t.lessons_required <= v_concluidas
  ORDER BY t.tier DESC
  LIMIT 1;

  -- Régua vazia ou mal seeded: não inventa título.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Garante a linha antes de qualquer comparação. É exatamente o passo cuja
  -- ausência fez a patente do teacherdoug001 sumir.
  INSERT INTO public.user_titles (user_id, current_title, achieved_tier)
  SELECT p_user_id, t.title, t.tier
  FROM public.title_tiers t
  ORDER BY t.tier
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;

  SELECT ut.achieved_tier, ut.current_title INTO v_atual, v_titulo
  FROM public.user_titles ut
  WHERE ut.user_id = p_user_id;

  IF v_tier.tier <= v_atual THEN
    RETURN v_titulo;
  END IF;

  UPDATE public.user_titles
  SET current_title = v_tier.title,
      achieved_tier = v_tier.tier,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- ------------------------------------------------------------------
  -- A PROMOÇÃO VESTE (Bloco 2 do doc 21)
  -- ------------------------------------------------------------------
  -- A 1ª opção da patente nova, pela coluna `ordem`. Se a patente ainda não tem
  -- traje desenhado — o caso do Capitão para cima enquanto a trilha 3 não tiver
  -- conteúdo —, `v_traje` fica NULL e o aluno mantém o que vestia. Nada quebra,
  -- e é por isso que a busca não é obrigatória: arte por demanda (doc 21 §1.3,
  -- trava nº 1) significa que patente sem peça é estado NORMAL, não erro.
  SELECT c.slug INTO v_traje
  FROM public.avatar_catalogo c
  WHERE c.slot = 'traje'
    AND c.origem = 'marco_patente'
    AND c.min_tier = v_tier.tier
  ORDER BY c.ordem, c.slug
  LIMIT 1;

  IF v_traje IS NOT NULL THEN
    UPDATE public.users
    SET avatar_traje = v_traje
    WHERE id = p_user_id;
  END IF;

  -- O ranking lê de user_public_profiles, que é materializada. O refresh já
  -- estava aqui e agora carrega também o traje novo — uma chamada só, depois
  -- das duas escritas, e não uma por escrita.
  PERFORM public.refresh_public_profiles();

  PERFORM public.emit_class_feed(
    p_user_id,
    'title_earned',
    jsonb_build_object('title', v_tier.title)
  );

  RETURN v_tier.title;
END;
$function$;

COMMENT ON FUNCTION public.recompute_user_title(uuid) IS
  'Helper interno idempotente. Recalcula a patente a partir das aulas '
  'concluídas e, desde o Bloco 2 dos slots (2026-08-12), VESTE a 1ª opção de '
  'traje da patente nova (menor `ordem`). Patente sem traje desenhado não é '
  'erro: o aluno mantém o que vestia. EXECUTE revogado de anon/authenticated: '
  'recebe user_id arbitrário, só chamável por outra função SECURITY DEFINER.';

REVOKE EXECUTE ON FUNCTION public.recompute_user_title(uuid) FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. Os alunos que JÁ têm patente passam a vestir
-- ---------------------------------------------------------------------------
--
-- Sem isto, o traje só apareceria para quem fosse promovido DEPOIS desta
-- migration — e os alunos que já são Soldado ou Aspirante hoje ficariam de
-- macacão para sempre, porque `recompute_user_title` só veste no degrau.
--
-- É o mesmo formato do achado R4, um andar abaixo: código novo que só age no
-- futuro deixa o passado inconsistente, e ninguém percebe porque nada falha.
--
-- Só age em quem tem `avatar_traje IS NULL` — se alguém já escolheu, a escolha
-- manda. Hoje isso é o banco inteiro (a coluna nasceu NULL no Bloco 1), mas a
-- condição fica porque a migration pode ser reaplicada num banco restaurado.

UPDATE public.users u
SET avatar_traje = (
  SELECT c.slug
  FROM public.avatar_catalogo c
  WHERE c.slot = 'traje'
    AND c.origem = 'marco_patente'
    AND c.min_tier = COALESCE(
      (SELECT ut.achieved_tier FROM public.user_titles ut WHERE ut.user_id = u.id),
      0
    )
  ORDER BY c.ordem, c.slug
  LIMIT 1
)
WHERE u.role IN ('aluno', 'professor')
  AND u.avatar_traje IS NULL;

-- A matview carrega `avatar_traje`, e o UPDATE acima a deixou vencida. Sem este
-- refresh, `/perfil` (que lê `users` direto) mostraria o traje novo e
-- `/perfil/[userId]` mostraria o antigo — o mesmo defeito medido no E.3.
SELECT public.refresh_public_profiles();
