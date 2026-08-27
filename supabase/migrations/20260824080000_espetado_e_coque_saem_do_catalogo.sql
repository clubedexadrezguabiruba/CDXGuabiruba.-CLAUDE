-- ===========================================================================
-- O ESPETADO E O COQUE SAEM DO CATÁLOGO — decisão do Doug, 2026-08-24
-- ===========================================================================
--
-- As duas eram as últimas peças de cabelo fora do padrão TONAL, e as duas já
-- tinham sido reprovadas por ele olhando o render:
--
--   * `espetado`  — a arte tonal de 2026-08-22 passou todos os gates e ele
--                   reprovou a olho: "cor vazando pelo contorno do cabelo em
--                   todo o rosto, especialmente acima da sobrancelha direita".
--                   Cinco réguas não separaram a peça reprovada da aprovada;
--   * `coque`     — reprovada duas vezes. Na segunda, medido: 8 921 px (9,0%
--                   da peça) ficavam FORA do `viewBox` de 500 × 700, cortados
--                   numa linha reta de 214 px de largura.
--
-- A regra do plano de 2026-08-22 era *"nenhuma peça some antes de ter
-- substituta"*, e ele a revogou com a razão à vista: manter peça reprovada em
-- produção esperando substituta é o contrário do que a régua serve para fazer.
-- Ele vai desenhar arte nova. O elenco de cabelo passa de 6 para 4, todas
-- tonais — `chanel`, `moicano`, `assimetrico`, `burst-fade`.
--
-- ---------------------------------------------------------------------------
-- O QUE ISTO ENCOSTA, MEDIDO NO BANCO ANTES DE ESCREVER
-- ---------------------------------------------------------------------------
--
--   contas .................................. 19
--   VESTINDO `cabelo-espetado` ..............  4   <- ficam CARECAS, decisão dele
--   VESTINDO `cabelo-coque` .................  0
--   guarda-roupa com `cabelo-espetado` ...... 19   <- era `inicial = true`
--   guarda-roupa com `cabelo-coque` .........  0
--
-- **As 4 ficam carecas, e foi escolha declarada.** A alternativa oferecida era
-- trocar pelo `cabelo-assimetrico`, que as 19 contas também possuem; ele
-- preferiu o desequipar. `avatar_cabelo = NULL` é CARECA — ausência de peça, e
-- não linha do catálogo —, então é estado válido e o aluno reescolhe quando
-- quiser.
--
-- ⚠️ **Sobra UMA peça inicial de cabelo**, o `cabelo-assimetrico`. O
-- `cabelo-espetado` era a outra, e toda conta nova nascia com as duas. O passo
-- 4 abaixo é uma asserção que reprova a migration se não sobrar nenhuma — sem
-- ela, apagar as duas iniciais deixaria toda conta futura sem cabelo no
-- guarda-roupa, e `equipar_peca` recusaria qualquer escolha em silêncio.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Quem está vestindo fica careca
-- ---------------------------------------------------------------------------
--
-- ANTES do DELETE do guarda-roupa e do catálogo, porque `users.avatar_cabelo`
-- referencia `avatar_catalogo(slug)`: apagar a linha do catálogo primeiro
-- violaria a FK e a migration morreria no meio.
UPDATE public.users
SET avatar_cabelo = NULL
WHERE avatar_cabelo IN ('cabelo-espetado', 'cabelo-coque');


-- ---------------------------------------------------------------------------
-- 2. A posse some junto com a peça
-- ---------------------------------------------------------------------------
--
-- `avatar_guarda_roupa.slug` também referencia `avatar_catalogo(slug)`. Deixar
-- a posse de pé seria pior que apagá-la: a peça não existiria em lugar nenhum
-- do código, e o guarda-roupa mostraria um cadeado aberto para nada.
DELETE FROM public.avatar_guarda_roupa
WHERE slug IN ('cabelo-espetado', 'cabelo-coque');


-- ---------------------------------------------------------------------------
-- 3. As linhas do catálogo
-- ---------------------------------------------------------------------------
DELETE FROM public.avatar_catalogo
WHERE slug IN ('cabelo-espetado', 'cabelo-coque');


-- ---------------------------------------------------------------------------
-- 4. A asserção: ainda existe cabelo INICIAL
-- ---------------------------------------------------------------------------
--
-- `handle_new_user` semeia o guarda-roupa a partir de `avatar_catalogo.inicial`
-- — não há lista escrita no corpo dela. Zerar as iniciais de um slot não
-- quebraria nada de imediato: a conta nova nasceria, o gate passaria, e o
-- defeito apareceria semanas depois como "o cabelo não abre para ninguém".
-- É o modo de falha por vacuidade, e aqui ele custa uma consulta.
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.avatar_catalogo
  WHERE slot = 'cabelo' AND inicial;

  IF n = 0 THEN
    RAISE EXCEPTION
      'nenhuma peça de cabelo com inicial = true sobrou: toda conta nova nasceria '
      'sem cabelo no guarda-roupa, e equipar_peca recusaria qualquer escolha';
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 5. O cache do perfil público carrega `avatar_cabelo`
-- ---------------------------------------------------------------------------
--
-- `user_public_profiles` é matview e guarda a coluna copiada. Sem o refresh, o
-- ranking e o perfil público continuariam servindo `cabelo-espetado` para as 4
-- contas do passo 1 — o cliente pediria uma peça que o catálogo não tem mais e
-- o boneco sairia sem cabelo de um jeito que nenhum gate acusa.
--
-- Sem CONCURRENTLY de propósito: o refresh concorrente recusa dentro de bloco
-- de transação, e um lote de comandos aqui roda em transação implícita.
REFRESH MATERIALIZED VIEW public.user_public_profiles;
