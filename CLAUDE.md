# Recruta 64 — Plataforma Educacional de Xadrez

## Sobre o Projeto
Plataforma web educacional de xadrez do Clube de Xadrez Guabiruba (Recruta 64).
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
- Aplicar no banco remoto:
  `npx tsx scripts/apply-migration.ts supabase/migrations/<arquivo.sql>`
  - **O caminho é a partir da raiz do projeto** — só o nome do arquivo dá `ENOENT`
  - Conecta direto via connection string do .env.local (não requer Supabase CLI)
  - Supabase CLI NÃO está instalado nesta máquina
  - **Nunca escrever `BEGIN;`/`COMMIT;` na migration.** O postgres.js recusa
    transação explícita (`UNSAFE_TRANSACTION`) — e recusa DEPOIS de o servidor ter
    executado, então o terminal imprime erro sobre uma migration que aplicou. Um
    lote de comandos já roda em transação implícita; as 69 migrations anteriores
    não têm `BEGIN` e são atômicas do mesmo jeito

## Workflow
- Antes de iniciar fase/tarefa grande: `npm run build`
- Entregar arquivos completos (sem patches soltos)
- Commits em português: "feat: adicionar modo rating de puzzles"
- Se precisar de informação ou ação do usuário para avançar ou para realizar um tarefa de forma mais rápida e/ou efetiva, perguntar imediatamente — não assumir
- Se o prompt do usuário for ambíguo, incompleto ou puder ser melhorado, apontar antes de executar

## Skills — invocar, não torcer para lembrar

Este projeto tem skills escritas para si mesmo e elas quase nunca dispararam: em
45 sessões, o tool `Skill` foi chamado **4 vezes**, e nem `design-recruta64` nem
`/gate` estavam entre elas — inclusive nos commits de design em que a primeira
era obrigatória. Skill que depende de eu lembrar é skill que não roda. **Invoque
pelo gatilho abaixo, antes de começar, sem esperar o usuário pedir.**

| Gatilho | Invocar |
|---|---|
| Qualquer tela, componente, cor, tipografia, animação, texto de UI — e sempre ao trazer tela do v0.app/Gemini | `design-recruta64` (regras vinculantes) |
| Construir componente novo, migrar tela para os primitivos de `src/components/ui/`, ou mexer em espaçamento/hierarquia/estado vazio | `impeccable` |
| Bug, comportamento errado, "isso não devia acontecer" | `/gate` |
| Desenhar peça do elenco do avatar — cabelo, chapéu, traje, pet, fundo — ou refazer uma que lê errado | `avatar-desenho` (3 variantes, crítica renderizada) |
| **Já existe arte gerada e aprovada** para a peça — não desenhe variante: **trace** | `avatar-desenho`, e vá direto a `references/traco-fiel.md` (`avatar:tracar` → `avatar:fidelidade`) |
| Referência de arte nova, ou qualquer número de `geometria.ts` que precise sair de medição | `avatar-regua` |
| Detalhe de movimento, transição, o que faz a interface "sentir" bem | `emil-design-eng` |
| Antes de mexer em auth, RLS, RPC de recompensa, ou qualquer coisa que o repositório público exponha | `security-review` |

O usuário digita `/prototype` e `/review-animations` quando quiser — as duas têm
`disable-model-invocation` e **nunca** disparam sozinhas. Se o caso pedir uma
delas, sugira em uma linha em vez de tentar invocar.

**As três de avatar quase sempre olham PNG — a imagem vai por subagente.** Quem
lê o arquivo é o subagente; o thread principal recebe a descrição medida em
texto. As de `.scratch/` chegam a 500 KB e ficam sendo relidas até o fim da
sessão. Regra completa na seção **Imagens** do `~/.claude/CLAUDE.md`.

## Verificação (rodar antes de concluir)
- `npm run typecheck` (tsc --noEmit)
- `npm run lint`
- `npm test` (vitest)
- `npm run build`
- `npm run verify:all` (a cadeia inteira de gates — substitui rodar um a um)
- `npm run test:e2e` (quando mexer em UI/auth) — **ATENÇÃO: bate no Supabase de
  PRODUÇÃO**, cria e remove usuários reais. Rodar com intenção, nunca em CI.

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push/PR **exceto o e2e**,
pelo motivo acima. Os scripts de verify leem as credenciais de `process.env`
quando não há `.env.local` — é assim que funcionam em CI.

## Estrutura-chave
- src/app/ → rotas (App Router)
- src/components/chess/ → componentes do tabuleiro
- src/lib/supabase/ → clients SSR + proxy de auth
- src/hooks/ → useUser, useSound, etc.
- supabase/migrations/ → SQL migrations versionadas
- scripts/verify/ → gates de validação por fase

## Referências (ler antes de mudanças grandes)
- **Onde estamos: `docs/ESTADO.md` — comece por aqui.** É **gerado**, não escrito:
  `npm run estado` reconta tudo do repositório, e `verify:estado` reprova se
  envelhecer. Existe porque o estado deste projeto vivia em 13 documentos que
  discordavam — a contagem de gates do `verify:all` aparecia à mão em seis lugares,
  com quatro valores diferentes. **Não escreva número de progresso em doc nenhum:
  ou o painel já mede, ou é caso de ensinar `scripts/estado.ts` a medir**
- Visão do Produto: docs/Recruta64_Visao_do_Produto_v1.md — **a §5 (aulas) está
  superada** pelo currículo abaixo
- Currículo das aulas: `docs/curriculo/01-curriculo-definitivo-v1.md` — **aprovado em
  2026-07-30, revisão 4 em 2026-07-31; é a fonte de verdade do conteúdo pedagógico.**
  126 aulas em 7 trilhas (26·21·19·18·17·14·11), coluna de defesa da trilha 1 à 6,
  **meta de volume derivável célula a célula** (§4), 3 blocos de revisão espaçada
  obrigatórios por trilha, 10 mini-jogos, 5 duelos com missão, **prática contra o
  motor** em 20 aulas de técnica (modelo lichess Practice) e o professor-guia.
  **Posições vêm dos livros comprados** (cadernos do Steps + de la Villa; posição é
  fato, explicação se redige do zero — regras na §4) e do banco Lichess mediante o
  gate de lastro. §15 = changelog da rev. 3; §16 = da rev. 4. Só conteúdo: o plano
  técnico dos formatos novos (lição interativa, prática contra o motor, quiz,
  mini-jogo, blocos, duelo com missão, move trainer, `verify:curriculo-banco`)
  ainda não existe
- Roadmap Técnico: docs/Recruta64_Roadmap_Tecnico_v1.md (a seção "Estado real" é a
  única parte confiável — a Parte 1 é um guia de setup pré-projeto)
- Avatar: **o plano vigente é o v4**, e são cinco documentos com papéis distintos:
  - `docs/avatar/15-plano-ate-pronto.md` — **comece por aqui.** O plano de
    execução do estado atual até pronto, em 10 blocos com gate. Onde divergir
    dos outros, ele vence. As §7, §7b e §7c são as regras de arte e de composição
  - `docs/avatar/16-uniformes-runbook.md` — **antes de gerar arte de uniforme,
    leia este.** O processo de ponta a ponta: o que pedir ao gerador, a tabela de
    matiz, as três camadas do asset, as variantes por DPR, os oito gates e o que
    cada reprovação significa
  - `docs/avatar/17-patentes-uniformes-design.md` — o design das 6 patentes: a lei
    das cores do pipeline, a paleta medida e o racional pela Bíblia Tonal. A régua
    de verdade é `scripts/avatar/patentes.ts`, medida por `verify:paleta-patentes`
  - `docs/avatar/18-uniformes-blocos.md` — **para abrir, copiar e fechar.** Os 4
    pedidos prontos (Capitão, Comandante, General, Mestre) e a esteira até o gate
  - `docs/avatar/12-avatar-v4-plano-completo.md` — as 30 decisões e o porquê,
    mais a **emenda à D27**: só pele e cabelo recolorem
  - `docs/avatar/13-checklist-de-verificacao.md` — os ~90 itens de auditoria
  - `docs/avatar/14-backlog-execucao.md` — **é onde o progresso fica marcado**,
    tarefa a tarefa. Quantas são e quantas fecharam: `docs/ESTADO.md`
  - As gerações v2 e v3 (os antigos docs 00–11) foram arquivadas em
    `docs/avatar/_superado/` — **não valem como instrução**, e o README de lá diz
    o que substituiu cada uma. O mesmo para `docs/_superado/` (Art Guide e
    Relatório da v2). Não leia nenhum dos dois sem motivo histórico
