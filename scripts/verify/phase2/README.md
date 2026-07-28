# Validacao — Fase 2: Banco de Dados

Scripts de gate para confirmar que a Fase 2 (tabelas, RLS, RPCs, seeds, view) esta corretamente aplicada no Supabase remoto.

## Como rodar

```bash
# Validacao completa (tabelas + seeds + RPCs + RLS + view)
npm run verify:phase2

# Apenas seeds (bots, achievements, itens) com detalhamento
npm run verify:seeds
```

## Pre-requisitos

- `.env.local` na raiz do projeto com:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (recomendado para bypasaar RLS e checar seeds)
- Migrations da Fase 2 aplicadas no Supabase remoto (`npx supabase db push`)

## O que cada script garante

### `validate-phase2.ts`
| Bloco | Verifica |
|---|---|
| 1. Tabelas | 24 tabelas existem e sao acessiveis |
| 2. Seeds | 10 bots, 17 achievements, 77 itens |
| 3. RPCs | 9 funcoes existem (puzzle_attempt, lesson_step_submit, bot_result, check_daily_missions, claim_chest, grant_xp, check_level_up, get_ranking, refresh_public_profiles) |
| 4. RLS | Tabelas protegidas bloqueiam anon; catalogo requer `authenticated` |
| 5. View | `user_public_profiles` funciona via `get_ranking` |

### `verify-seeds.ts`
| Bloco | Verifica |
|---|---|
| Bots | 10 bots com nome, elo e unlock_order corretos |
| Achievements | 17 conquistas com key, titulo e XP |
| Items | 77 itens distribuidos por slot e raridade |
| RLS | anon nao ve seeds, service_role ve |

## Exit codes

- `0` — todos os testes passaram
- `1` — ao menos 1 falha encontrada

## Seguranca

Estes scripts usam `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS e verificar dados.
**NUNCA** importe estes modulos em codigo client/browser.
Uso exclusivo: terminal local e CI.
