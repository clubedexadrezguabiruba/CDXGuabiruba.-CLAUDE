# Recruta 64

Plataforma web educacional de xadrez do **Clube de Xadrez Guabiruba**.
Mobile-first, com gamificação e progressão verificável pelo servidor.

Alunos resolvem puzzles, fazem aulas interativas, duelam contra bots de força
crescente e progridem por missões, streaks, conquistas e baús. Professores criam
turmas, atribuem tarefas e acompanham relatórios.

## Stack

| camada | tecnologia |
|---|---|
| App | Next.js 16.1.6 (App Router) + TypeScript strict + Tailwind CSS 4 |
| Dados/Auth | Supabase (PostgreSQL + Auth + RLS + RPCs) |
| Tabuleiro | chessground + chess.js |
| Engine | Stockfish WASM em Web Worker (browser-only) |
| Estado/Áudio | Zustand + Howler.js |
| Testes | Vitest (unit) + Playwright (e2e) |
| Deploy | Vercel + Supabase |

## Rodando local

```bash
cp .env.example .env.local   # preencher as 4 variáveis
npm install                  # o postinstall copia o Stockfish WASM p/ public/
npm run dev
```

Abra http://localhost:3000.

O `postinstall` (`scripts/setup-stockfish.ts`) copia `stockfish.js` e
`stockfish.wasm` de `node_modules/stockfish/bin` para `public/stockfish/` — que é
ignorado pelo git de propósito (7,3 MB de binário).

### OAuth (Google)
No Supabase, adicione o redirect: `http://localhost:3000/auth/callback`.

## Regras invioláveis do projeto

1. **Server-authority.** Toda concessão de recompensa (XP, rating, missões, baús,
   conquistas, streak) acontece **exclusivamente no servidor** via RPC/trigger. O
   client envia tentativas; o servidor valida e decide, de forma idempotente e
   transacional.
2. **Segurança.** RLS ativo em **todas** as tabelas. Nunca expor `service_role` no
   client. Nunca confiar no relógio do client para prazos. Sempre `@supabase/ssr`
   (nunca `@supabase/auth-helpers-nextjs`, deprecado).
3. **Não over-engineer.** Mínimo de complexidade para a tarefa atual.
4. **Regra de evidência.** Antes de corrigir qualquer bug: reproduzir, apontar a
   causa com arquivo+linhas ou query SQL, propor o fix mínimo, e criar um gate que
   **falha antes e passa depois**.

## Verificação

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
npm test             # vitest run
npm run build        # next build
npm run verify:all   # 11 gates contra o banco remoto
npm run test:e2e     # Playwright — ver aviso abaixo
```

O CI (`.github/workflows/ci.yml`) roda tudo isso **exceto o e2e**, a cada push e
pull request.

> **O e2e bate no Supabase de PRODUÇÃO.** Ele cria e remove usuários reais via
> admin API. Por isso está deliberadamente fora do CI. Pré-requisito para
> incluí-lo: um projeto Supabase separado para teste.

### Os gates

`npm run verify:all` encadeia 11 verificações. As mais importantes existem por
causa de bugs reais que passaram despercebidos:

| gate | o que protege |
|---|---|
| `verify:xp-curve` | a curva de XP do banco bater com a constante do client — foi revertida em silêncio e ficou 4 meses errada em produção |
| `verify:no-dup-rpc` | ratchet que impede uma função SQL passar a ser redefinida mais vezes que hoje (a causa raiz do item acima) |
| `verify:privileges` | `SECURITY DEFINER` com `search_path` fixo; helpers internos não chamáveis por `anon`/`authenticated` |
| `verify:puzzle-authority` | o client não devolver ao servidor a solução do puzzle que acabou de receber |
| `verify:phase2` / `verify:seeds` | tabelas, RPCs, RLS e dados iniciais |
| `verify:revanche` / `verify:rush` | fluxos de repetição espaçada e de rush com score server-side |
| `verify:phase5` / `verify:phase6` / `verify:turmas` | aulas, bots e turmas |

## Migrations

```bash
npx tsx scripts/apply-migration.ts supabase/migrations/<arquivo>.sql
```

Conecta direto pela connection string (`SUPABASE_DB_URL` ou `.env.local`) — o
Supabase CLI **não** é usado neste projeto.

- **Nunca modificar uma migration já aplicada** — sempre criar uma nova.
- Formato: `supabase/migrations/YYYYMMDDHHMMSS_descricao.sql`.
- **Nunca copiar o corpo de uma função SQL de uma migration antiga.** Extraia de
  `pg_get_functiondef` do banco vivo e altere só o necessário. (`pg_get_functiondef`
  não emite o `;` final depois de `$function$`.)

## Estrutura

```
src/app/                 rotas (App Router); (main)/ é a área autenticada
src/components/chess/    tabuleiro, puzzles, bots
src/components/avatar/   render em camadas do avatar
src/components/gamification/  XP, missões, streak, baús, conquistas
src/hooks/               useUser, useInventory, useMissions, useChests…
src/lib/supabase/        clients SSR + proxy de auth
src/lib/chess/           Stockfish, análise de partida, lógica de puzzle
supabase/migrations/     SQL versionado
scripts/verify/          os gates
e2e/                     Playwright
docs/                    visão de produto, roadmap, sistema de avatar
```

Auth e routing usam **`src/proxy.ts`** (Next 16), não `middleware.ts`.
Rotas públicas: `/`, `/login`, `/registro`, `/auth/*`; todo o resto exige sessão.

## Estado

Fases 1 a 10 implementadas (fundação, banco, puzzles, aulas, bots, gamificação,
avatar, turmas, ranking). **Pendentes: fase 11 (PWA) e fase 12 (lançamento).**

O subsistema de avatar tem um plano vigente de reestruturação —
[docs/avatar/10-avatar-v3-definitive.md](docs/avatar/10-avatar-v3-definitive.md) —
que supersede os docs 00–09 daquela pasta onde houver conflito.

## Referências

- [Visão do Produto](docs/Recruta64_Visao_do_Produto_v1.md)
- [Roadmap Técnico](docs/Recruta64_Roadmap_Tecnico_v1.md)
- [Sistema de Avatar](docs/avatar/)
