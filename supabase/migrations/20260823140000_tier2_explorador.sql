-- ============================================================================
-- O tier 2 deixa de ser "Estudante" e passa a ser EXPLORADOR
--
-- Decisão D2 da revisão temática de 2026-08-22
-- (docs/Academia64_Revisao_Tematica_v1.md §8). A lei é a Bíblia Tonal v2 §6,
-- já emendada.
--
-- O QUE MUDA: uma string de texto exibido, num degrau. Mais nada.
--   - os 8 degraus não mudam de número, de ordem, de marco (`lessons_required`)
--     nem de trilha (`trail`);
--   - os slugs (`recruta`…`mestre`, presos em CHECK) ficam onde estão;
--   - nenhum outro nome da escada é tocado: Calouro, Aprendiz, Analista,
--     Estrategista, Mestre, Grão-Mestre e Lenda seguem como estão.
--
-- POR QUE, e o argumento não é estético — é de público:
--
--   O produto é para 7 a 15 anos. "Estudante" era o único degrau da escada que
--   premiava a criança com o que ela JÁ É — o aluno de uma escola de xadrez
--   recebe, como recompensa por concluir uma trilha inteira, o rótulo
--   "estudante". Não sobe o peito de ninguém no recreio.
--
--   "Explorador" lê sozinho aos 7, carrega bem aos 15, e é o único nome da
--   escada que serve os 25% de DESCOBERTA da fórmula tonal (Bíblia §3): o
--   aluno do degrau 2 é exatamente aquele que está abrindo as primeiras portas
--   da Academia.
--
--   "Analista" (tier 3) foi examinado no mesmo dia e MANTIDO: nenhum
--   substituto medido ganhava com folga — "Candidato" fica estranho dois
--   degraus antes de Mestre, "Calculista" é pejorativo em português. Trocar
--   por trocar é churn, e está registrado para não voltar.
--
-- ----------------------------------------------------------------------------
-- POR QUE ESTA MIGRATION É BARATA, e por que agora:
--
--   (1) É a MESMA forma da 20260821120000_academia_titulos.sql, que renomeou os
--       oito degraus dois dias atrás. Aquela era perigosa porque "Aprendiz"
--       DESCIA um degrau — toda linha que dizia 'Aprendiz' mudava de
--       significado. Esta não move nome nenhum de lugar: 'Estudante' sai da
--       escada e ninguém ocupa a vaga dele. Não há ambiguidade a resolver.
--
--   (2) `recompute_user_title` LÊ o nome de `title_tiers` — renomear a régua
--       propaga sozinho na próxima promoção. A função NÃO precisa ser recriada.
--       (Medido em 2026-08-21 e registrado na migration anterior.)
--
--   (3) `ensure_user_profile` e `handle_new_user` já leem o PRIMEIRO degrau da
--       régua por subquery desde 08-21, e o DEFAULT da coluna é 'Calouro'.
--       Nenhum dos três cita o tier 2. Nada a recriar.
--
--   (4) A população é pequena e o degrau está VAZIO: em 2026-08-21 eram 17
--       alunos em tier 0 e 2 em tier 1. A seção 2 abaixo reconcilia pelo TIER,
--       então ela é correta mesmo que alguém tenha subido desde então — e é
--       no-op se ninguém chegou ao tier 2.
--
-- ----------------------------------------------------------------------------
-- A JANELA QUE ESTA MIGRATION TEM DE FECHAR JUNTO COM O CÓDIGO:
--
--   `src/components/ui/Badge.tsx` casa o título por STRING contra
--   `scripts/avatar/patentes.ts`. O comentário da coluna `title_tiers.title`
--   diz, desde 08-21: "renomear aqui exige renomear em
--   scripts/avatar/patentes.ts na mesma janela".
--
--   JÁ FEITO no mesmo commit desta migration:
--     - scripts/avatar/patentes.ts   → PATENTES[tier 2].patente = "Explorador"
--     - src/app/design-lab/data.ts   → fixture da vitrine
--     - src/app/(main)/dev/avatar-uniforme/AvatarUniformeClient.tsx
--
-- ----------------------------------------------------------------------------
-- O GATE QUE FALTAVA, e nasceu junto com esta migration
--
--   Ao escrever isto descobriu-se que **nenhum gate comparava
--   `title_tiers.title` com `PATENTES[].patente`** — a lacuna estava registrada
--   em docs/ESTADO.md e tinha custo medido: a Badge perdeu o ponto de cor em
--   silêncio entre o Bloco 1 e a migration da virada, e ninguém viu porque nada
--   media. O comentário da coluna mandava "renomear na mesma janela"; mandar em
--   comentário não reprova nada.
--
--   A conferência (a2) de scripts/verify/phase8/verify-avatar-db.ts passa a
--   casar os dois donos do nome, nos 6 degraus com cor. Medido:
--
--     ANTES desta migration (com patentes.ts já em "Explorador"):
--       [FAIL] tier 2: banco diz "Estudante", régua diz "Explorador"
--
--     DEPOIS: [PASS] nos 6 degraus.
--
--   Rodar: npm run verify:avatar-db
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. A régua
--
-- Escrito com WHERE tier = 2 e não como CASE sobre os oito: esta migration tem
-- UM degrau para mexer, e um UPDATE que só toca nele não pode reescrever os
-- outros sete por engano.
-- ----------------------------------------------------------------------------
UPDATE public.title_tiers
SET title = 'Explorador'
WHERE tier = 2;

-- ----------------------------------------------------------------------------
-- 2. Os alunos, reconciliados PELO TIER — não por tradução de string
--
-- Mesma forma da migration de 08-21. Quem estiver no tier 2 relê o nome da
-- régua; quem tiver `current_title` fora da escada volta para ela. Se ninguém
-- chegou ao degrau 2 ainda, este UPDATE é no-op — e continua sendo a linha
-- certa a escrever, porque ela não depende de quem está lá hoje.
-- ----------------------------------------------------------------------------
UPDATE public.user_titles u
SET current_title = t.title,
    updated_at = now()
FROM public.title_tiers t
WHERE t.tier = u.achieved_tier
  AND u.current_title IS DISTINCT FROM t.title;

-- ----------------------------------------------------------------------------
-- 3. O comentário da tabela registra a segunda renomeação
--
-- O de 08-21 dizia "renomeado em 2026-08-21". Duas renomeações em três dias é
-- exatamente o tipo de coisa que alguém lendo daqui a seis meses precisa ver
-- escrita, em vez de deduzir de duas migrations.
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.title_tiers IS
  'A escada de TÍTULOS da Academia 64 — 8 degraus. Cada tier > 0 fecha exatamente uma trilha (coluna trail); o tier 0 (Calouro) é onde todo aluno começa e não fecha nada. `title` é texto de aluno: renomeado em 2026-08-21 (a virada Academia 64, Bíblia Tonal v2 §6) e emendado em 2026-08-23 no tier 2 (Estudante → Explorador, decisão D2 da revisão temática). `trail` é chave e não muda.';
