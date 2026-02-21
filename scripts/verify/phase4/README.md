# Verificacao — Fase 4 (Puzzles)

Scripts de verificacao end-to-end para a Fase 4 (modos de puzzle).

## Scripts

| Script | Comando | O que verifica |
|--------|---------|----------------|
| `verify-revanche.ts` | `npm run verify:revanche` | Fila de revanche: TABLE DEFAULT, enqueue apos erro, get_revanche_due |
| `verify-rush.ts` | `npm run verify:rush` | Rush server-authority: start_rush, rush_run_id, score servidor, tempo excedido |

## Pre-requisitos

1. `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Migrations aplicadas (incluindo `20260217210000_fix_rush_server_score.sql`)

3. Ao menos 3 puzzles seedados no banco (`npm run verify:seeds` para confirmar)

## Como rodar

```bash
# Verificacao revanche
npm run verify:revanche

# Verificacao rush (server-authority score)
npm run verify:rush

# Ambos + gates anteriores
npm run verify:phase2 && npm run verify:seeds && npm run verify:revanche && npm run verify:rush
```

## E2E Tests

Testes de UI via Playwright cobrem os 4 modos:

| Modo | Testes | IDs |
|------|--------|-----|
| Hub | 1 smoke | — |
| Rating | 5 gameplay | A1-A5 |
| Categorias | 6 gameplay | B1-B6 |
| Rush | 3 gameplay | C1-C3 |
| Revanche | 3 gameplay | D1-D3 |

```bash
npx playwright test e2e/puzzles.spec.ts
```
