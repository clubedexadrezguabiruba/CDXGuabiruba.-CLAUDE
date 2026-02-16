# CdxGuabiruba — Plataforma Educacional de Xadrez

## Sobre o Projeto
Plataforma web educacional de xadrez do Clube de Xadrez Guabiruba.
Mobile-first, responsivo, com gamificação completa.

## Stack
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Tabuleiro: chessground (lib do Lichess)
- Engine: Stockfish WASM (via Web Worker no browser)
- State: Zustand
- Áudio: Howler.js
- Deploy: Vercel (frontend) + Supabase (backend)

## Princípios Fundamentais

### Autoridade do Servidor
TODA concessão de recompensa (XP, rating, missões, baús, conquistas) é feita
exclusivamente no servidor via Supabase RPCs/Edge Functions.
O client NUNCA decide se o aluno ganhou algo — apenas envia tentativas.
O servidor valida e executa.

### Anti-Trapaça
- Client envia: puzzle_id + lances, lesson_id + lance, bot_id + PGN
- Servidor valida: compara com solução correta, calcula rating, concede XP
- RLS ativo em todas as tabelas (aluno só acessa seus dados)
- Rate limiting em RPCs de puzzle e missão

## Estrutura de Pastas
- src/app/ → Rotas (App Router)
- src/components/ → Componentes (ui/, chess/, gamification/, layout/)
- src/lib/ → Lógica compartilhada (supabase/, chess/, glicko2/, gamification/)
- src/hooks/ → React hooks customizados
- supabase/migrations/ → SQL migrations versionadas
- supabase/functions/ → Edge Functions

## Convenções de Código
- TypeScript strict mode sempre
- Componentes: PascalCase (PuzzleBoard.tsx)
- Hooks: camelCase com prefixo use (usePuzzleRating.ts)
- Lib/utils: camelCase (calculateGlicko.ts)
- Supabase types gerados com: npx supabase gen types typescript
- Commits em português: "feat: adicionar modo rating de puzzles"

## Regras Importantes
- Sempre usar Server Components quando possível (Next.js App Router)
- Client Components apenas quando necessário (interatividade, hooks)
- Nunca expor chaves secretas do Supabase no client
- Sempre usar @supabase/ssr para auth no server side
- Puzzles são pré-importados do Lichess CSV, nunca API em tempo real
- Stockfish WASM roda no browser via Web Worker, nunca no servidor
- Todos os sons devem respeitar a configuração de mudo do usuário

## Documentação de Referência
- Visão do Produto: docs/CdxGuabiruba_Visao_do_Produto_v1.md
- Roadmap: docs/CdxGuabiruba_Roadmap_Tecnico_v1.md
- Supabase: usar Context7 MCP para doc atualizada
- Next.js: usar Context7 MCP para doc atualizada
