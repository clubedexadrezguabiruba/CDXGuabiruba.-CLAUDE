-- ============================================================================
-- F.2 — quem escolheu o avatar v2 volta a NÃO ter escolhido.
-- ============================================================================
--
-- ⚠️ ESTA MIGRATION NÃO É APLICADA NO E.3. Ela é escrita no E.3 e aplicada no
-- **F.2**, junto do push. Está separada exatamente por isso: uma migration que
-- espera é uma migration própria, não um bloco comentado dentro de outra.
--
-- É a terceira pendência que o Bloco C registrou (doc 20, Bloco C, segunda
-- ressalva) e a razão da espera está escrita lá: `avatar_chosen` é o que o
-- dashboard usa para mandar quem não escolheu para `/criar-personagem`
-- (src/app/(main)/dashboard/page.tsx:47). Zerada antes de a tela nova existir, ela
-- manda o aluno para a `/criar-personagem` da v2 — a que escolhe macho/fêmea e
-- chama a `update_avatar_base` deprecada. O aluno "escolheria" de novo o avatar
-- que este plano está apagando, e voltaria com avatar_chosen = true.
--
-- O QUE ELA CONSERTA
-- ------------------
-- Medido em 2026-08-10: **8 de 19 contas** têm avatar_chosen = true, e as 8 o
-- ganharam da `update_avatar_base` do avatar v2 — a única escritora até então.
-- Nenhuma delas escolheu identidade kokeshi nenhuma: as 19 estão no default
-- integral (avatar_skin = 2, avatar_hair = NULL, avatar_hair_color = 0). Sem esta
-- migration, essas 8 contas — a do Doug entre elas — nunca veriam a tela de
-- criação nova, e ficariam com o default para sempre.
--
-- A ORDEM DENTRO DO F.2, E ELA IMPORTA: **push primeiro, apply depois.**
--
--   push → apply  Entre o deploy e o apply, avatar_chosen segue true e ninguém é
--                 redirecionado: janela inofensiva. Depois do apply, todo mundo
--                 cai na tela NOVA. É a ordem segura.
--   apply → push  Abre uma janela em que o cliente no ar ainda é o do F.1 e o
--                 redirecionamento aponta para a `/criar-personagem` v2. Quem
--                 entrar nela escolhe male/female e volta a avatar_chosen = true
--                 — desfazendo esta migration por dentro.
--
-- POR QUE `WHERE avatar_chosen = true` E NÃO UMA CONDIÇÃO MAIS FINA
-- ----------------------------------------------------------------
-- Não existe, no banco, marca de QUAL das duas identidades foi escolhida:
-- `update_avatar_base` (v2) e `update_avatar_identity` (kokeshi) escrevem a mesma
-- coluna booleana. E o default integral não serve de prova — pele 2, careca e cor
-- 0 são uma escolha legítima que alguém pode fazer de propósito na tela nova.
--
-- O que sustenta o UPDATE largo é a ORDEM, não uma heurística: aplicada na janela
-- do F.2, nenhuma conta pode ter escolhido a identidade nova, porque a tela que a
-- grava está sendo publicada no mesmo push. Aplicada muito depois, ela rebaixaria
-- quem já escolheu — o custo é refazer uma tela de criação, e a única defesa
-- honesta contra isso é o `WHERE` abaixo mais este parágrafo.
--
-- Rodar duas vezes é inofensivo: a segunda não acha linha nenhuma.
--
-- NÃO refresca `user_public_profiles`: `avatar_chosen` não é coluna da matview
-- (conferido na definição do E.3). Refrescar aqui seria varredura por nada.
-- ============================================================================

UPDATE public.users
SET avatar_chosen = false
WHERE avatar_chosen = true;

COMMENT ON COLUMN public.users.avatar_chosen IS
  'true depois que o aluno passou pela tela de criação de personagem. Zerada para '
  'todos no F.2 (2026-08-10): os 8 true vinham da update_avatar_base do avatar '
  'v2, que a troca de pilha apagou. Quem a escreve agora é '
  'update_avatar_identity. Lida por dashboard/page.tsx e criar-personagem/page.tsx '
  '— false manda o aluno para /criar-personagem.';
