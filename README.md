# CdxGuabiruba — Base

Base mínima para iniciar o MVP com:
- Next.js (App Router)
- Tailwind CSS v4
- Supabase Auth (SSR + middleware)

## Rodando local
```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra: http://localhost:3000

## OAuth (Google)
No Supabase, adicione o redirect:
- http://localhost:3000/auth/callback
