-- ============================================================================
-- B5 — a vitrine do traje: a primeira peça inicial e a primeira peça de baú
-- ============================================================================
--
-- **DUAS LINHAS, E SÓ.** Nenhum aluno muda de aparência: `users.avatar_traje`
-- continua NULL em todo mundo, e NULL é o macacão de treino da base — um estado
-- legítimo do produto, que espelha o careca do cabelo. Quem quiser vestir escolhe.
--
-- ⚠️ **ESTA MIGRATION NÃO PODE SER APLICADA SOZINHA.** O gate
-- `verify:catalogo-slots` exige que o conjunto de slugs do banco seja IGUAL ao de
-- `src/lib/avatar/catalogo.ts`, slot a slot, nos dois sentidos. Aplicá-la sem o
-- código das duas peças deixa 2 slugs órfãos e o gate reprova na hora — que é
-- exatamente o comportamento desejado, e é a trava nº 2 do doc 21 §1.3.
--
-- Ver docs/avatar/21-slots-do-avatar-plano.md §0.6 (bloco B5) e
-- docs/avatar/22-catalogo-de-trajes.md §1 (a economia).
--
-- SEM `BEGIN`/`COMMIT` — o postgres.js recusa transação explícita e um lote de
-- comandos já roda em transação implícita (regra do CLAUDE.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- As duas peças
-- ---------------------------------------------------------------------------
--
-- **`traje-farda` é a INICIAL, e ela é `marco_nivel` com `min_level = 1`.**
--
-- Não é "baú grátis", e a distinção tem consequência medida: peça de `origem =
-- 'bau'` exige linha em `avatar_guarda_roupa` para ser equipável (`equipar_peca`
-- confere), e a conferência 4 do `verify:avatar-db` reprovaria em bloco um aluno
-- vestindo peça de baú sem a linha. `marco_nivel` com nível 1 é a única origem que
-- significa "livre desde sempre" sem mentir sobre a porta por onde a peça veio.
--
-- **Por que a farda e não o gambesão** (doc 22 §1): ela é a peça LISA, a de menos
-- detalhe — e é dela que a raridade sobe. Um aluno que começa com a peça mais
-- ornamentada não tem para onde subir. O gambesão carrega canaletas, ilhoses e
-- cordão, então ele entra de baú, acima de `common`.
--
-- **`traje-gambesao` é `rare`.** A pirâmide do doc 22 §2 espelha as chances do
-- sorteio (45/30/18/7%), e `rare` é a faixa de 30% — a primeira acima da comum. Ele
-- é a primeira peça de baú do produto inteiro.
--
-- ⚠️ **Entre esta migration e o B6 existe VITRINE SEM PORTA:** o gambesão aparece
-- no editor como peça de baú e o baú ainda não a dá. Janela curta e prevista — é a
-- mesma que a §7, Bloco 3 do doc 21 já avisava para o fundo, e o B6 vem logo atrás.
--
-- O CHECK `avatar_catalogo_traje_nao_e_de_bau` caiu no B2
-- (`20260813120000_b2_moldura_estrutural.sql`). Sem aquela migration esta linha
-- seria recusada pelo banco.

INSERT INTO public.avatar_catalogo (slug, slot, origem, min_level, raridade) VALUES
  ('traje-farda',    'traje', 'marco_nivel', 1,    NULL),
  ('traje-gambesao', 'traje', 'bau',         NULL, 'rare');

-- Nenhum UPDATE em `users`, e a ausência é decisão: "sem traje" continua sendo um
-- estado válido e é o padrão. Vestir a farda em todo mundo mudaria a aparência de
-- cada aluno do produto sem ninguém ter escolhido — o oposto do que um guarda-roupa
-- é. A matview não fica vencida porque nada mudou nela.
