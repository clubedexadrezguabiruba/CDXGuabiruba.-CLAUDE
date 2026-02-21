# CdxGuabiruba — Plataforma Educacional de Xadrez

## Sobre o Projeto
Plataforma web educacional de xadrez do Clube de Xadrez Guabiruba.
Mobile-first, com gamificação e progressão verificável pelo servidor.

## Stack
- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS + RPCs)
- chessground + chess.js (tabuleiro e lógica)
- Stockfish WASM (Web Worker, browser-only)
- Zustand (state) + Howler.js (áudio)
- Deploy: Vercel + Supabase

## REGRAS INVIOLÁVEIS

### 1. Server-authority
Toda concessão de recompensa (XP, rating, missões, baús, conquistas, streak)
acontece EXCLUSIVAMENTE no servidor via RPC/trigger.
O client envia tentativas. O servidor valida e decide.
- Client envia: puzzle_id + lances; bot_id + PGN; lesson_step + resposta
- Servidor: valida, calcula, concede (idempotente, transacional)

### 2. Segurança
- RLS ativo em TODAS as tabelas (aluno só vê/edita seus dados)
- NUNCA expor service_role key ou segredos no client
- NUNCA confiar no relógio do client para prazos/expiração
- SEMPRE usar @supabase/ssr (createBrowserClient / createServerClient com getAll/setAll)
- NUNCA usar @supabase/auth-helpers-nextjs (deprecado)

### 3. Não over-engineer
- Não adicionar features, refactors ou abstrações além do pedido
- Mínimo de complexidade necessária para a tarefa atual
- Não criar helpers/utils para operações usadas uma única vez

#### 4. Regra de Evidência (anti-hallucination)
Antes de alterar qualquer bug/fluxo:
1) Reproduzir (passos).
2) Apontar 1 causa provável com **arquivo+linhas** e/ou **query SQL**.
3) Propor fix mínimo.
4) Criar/rodar Gate de verificação que falha antes e passa depois.

## Padrões do Projeto

### Auth e Routing
- Next.js 16 usa proxy.ts (NÃO middleware.ts)
- Entry point: src/proxy.ts → src/lib/supabase/proxy.ts
- Rotas públicas: /, /login, /registro, /auth/*
- Tudo mais requer autenticação

### Componentes
- Preferir Server Components; Client Components só com interatividade/hooks
- Puzzles pré-importados do Lichess CSV (nunca API em tempo real)
- Stockfish roda no browser via Web Worker (nunca no servidor)
- Sons respeitam configuração de mudo do usuário

### Migrations
- NUNCA modificar uma migration já aplicada — sempre criar nova
- Formato: supabase/migrations/YYYYMMDDHHMMSS_descricao.sql
- Aplicar no banco remoto: `npx tsx scripts/apply-migration.ts <arquivo.sql>`
  - Conecta direto via connection string do .env.local (não requer Supabase CLI)
  - Supabase CLI NÃO está instalado nesta máquina

## Workflow
- Antes de iniciar fase/tarefa grande: `npm run build`
- Entregar arquivos completos (sem patches soltos)
- Commits em português: "feat: adicionar modo rating de puzzles"
- Se precisar de informação ou ação do usuário para avançar ou para realizar um tarefa de forma mais rápida e/ou efetiva, perguntar imediatamente — não assumir
- Se o prompt do usuário for ambíguo, incompleto ou puder ser melhorado, apontar antes de executar

## Verificação (rodar antes de concluir)
- `npm run build`
- `npm run lint`
- `npm run verify:phase2` (gate de banco)
- `npm run verify:seeds` (dados iniciais)
- `npm run test:e2e` (quando mexer em UI/auth)

## Estrutura-chave
- src/app/ → rotas (App Router)
- src/components/chess/ → componentes do tabuleiro
- src/lib/supabase/ → clients SSR + proxy de auth
- src/hooks/ → useUser, useSound, etc.
- supabase/migrations/ → SQL migrations versionadas
- scripts/verify/ → gates de validação por fase

## Referências (ler antes de mudanças grandes)
- Visão do Produto: docs/CdxGuabiruba_Visao_do_Produto_v1.md
- Roadmap Técnico: docs/CdxGuabiruba_Roadmap_Tecnico_v1.md
