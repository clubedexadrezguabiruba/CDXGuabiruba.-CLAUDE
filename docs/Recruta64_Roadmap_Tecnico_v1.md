# 🛠️ Recruta 64 — Roadmap Técnico de Implementação v1.0

> **Guia completo: setup do ambiente, workflow e fases de desenvolvimento**
> Documento complementar à Visão do Produto | Fevereiro 2026

---

## Estado real (julho/2026)

Este documento foi escrito **antes** do projeto começar. As estimativas de prazo e
as escolhas de stack refletem aquele momento; o que foi construído diverge em
pontos importantes. Use a tabela abaixo, não a Parte 1, para saber onde o projeto
está.

| fase | estado |
|---|---|
| 1. Setup | ✅ feita |
| 2. Banco de Dados | ✅ feita |
| 3. Autenticação | ✅ feita |
| 4. Puzzles | ✅ feita — **50.001 puzzles** importados do Lichess |
| 5. Aulas | ✅ feita — 30 aulas (15 recruta + 15 soldado) |
| 6. Bots | ✅ feita — 10 bots, Stockfish WASM no browser |
| 7. Gamificação | ✅ feita — missões, streak, 17 conquistas, baús, títulos |
| 8. Avatar/Inventário | ✅ feita (v2) — **v3 é o plano vigente**, ver `docs/avatar/10-avatar-v3-definitive.md` |
| 9. Painel do Professor | ✅ feita |
| 10. Rankings | ✅ feita |
| **11. Sound Design + PWA + Polish** | ❌ **não iniciada** — não existe manifest nem service worker |
| **12. Testes Finais e Lançamento** | ❌ **não iniciada** |

**Divergências de stack em relação ao que este doc previa:**

- **Next.js 16.1.6**, não 15. Next 16 usa **`src/proxy.ts`**, não `middleware.ts`.
- React 19.2, Tailwind CSS 4.
- **O Supabase CLI não é usado.** Migrations são aplicadas por
  `npx tsx scripts/apply-migration.ts <arquivo.sql>`, que conecta direto pela
  connection string.
- Testes: **Vitest** (unit) + **Playwright** (e2e). O e2e bate no Supabase de
  **produção** e por isso fica fora do CI.
- CI real: `.github/workflows/ci.yml` — typecheck, lint, test, build e os 11 gates
  de `npm run verify:all`.

**Só existem contas de teste no banco** — nenhum aluno real ainda. Decisões de
balanceamento e migração de dados são baratas agora e caras depois do lançamento.

---

## PARTE 1: SETUP DO AMBIENTE E WORKFLOW

---

## 1. Pré-requisitos (instalar antes de tudo)

### 1.1 Ferramentas obrigatórias

| Ferramenta | Para quê | Instalação |
|---|---|---|
| **Node.js 20+** (LTS) | Rodar Next.js e ferramentas JS | https://nodejs.org |
| **VS Code** | Editor principal | https://code.visualstudio.com |
| **Git** | Controle de versão | https://git-scm.com |
| **Extensão Claude para VS Code** | IA assistente no editor | VS Code Marketplace → "Claude" (Anthropic) |
| **Conta Supabase** | Backend, banco e auth | https://supabase.com (plano gratuito funciona) |
| **Conta Vercel** | Deploy do frontend | https://vercel.com (plano gratuito funciona) |
| **Conta GitHub** | Repositório do código | https://github.com |

### 1.2 Verificação rápida

Após instalar, abra o terminal e confirme:

```bash
node --version    # deve ser 20+
npm --version     # deve ser 10+
git --version     # qualquer versão recente
```

---

## 2. Ferramentas de apoio

> A versão original desta seção descrevia a configuração de três MCP servers
> (Supabase, Playwright, Context7) num arquivo `mcp_servers.json`. Nada disso é
> usado no projeto: o Supabase é acessado por `scripts/apply-migration.ts` e pelos
> gates em `scripts/verify/`, o Playwright roda como dependência normal
> (`npm run test:e2e`), e a documentação é consultada fora do repositório.
> Removida por ser instrução obsoleta que induz a montar um ambiente inexistente.

---


## 3. Estrutura do Projeto

### 3.1 Criação inicial

```bash
npx create-next-app@latest cdx-guabiruba --typescript --tailwind --eslint --app --src-dir
cd cdx-guabiruba
```

### 3.2 Estrutura de pastas recomendada

```
cdx-guabiruba/
├── public/
│   ├── sounds/              # Efeitos sonoros (.mp3)
│   ├── bots/                # Avatares dos bots
│   ├── items/               # Imagens dos itens vestíveis
│   ├── icons/               # Ícones PWA
│   └── manifest.json        # PWA manifest
│
├── src/
│   ├── app/                 # Rotas (App Router do Next.js)
│   │   ├── (auth)/          # Grupo: login, registro
│   │   ├── (main)/          # Grupo: todas as telas logadas
│   │   │   ├── dashboard/
│   │   │   ├── aulas/
│   │   │   ├── puzzles/
│   │   │   ├── bots/
│   │   │   ├── ranking/
│   │   │   ├── perfil/
│   │   │   └── turmas/
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing page
│   │
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # Botões, cards, modais (design system)
│   │   ├── chess/           # Tabuleiro, peças, engine wrapper
│   │   ├── gamification/    # XP bar, baú, missões, streak
│   │   └── layout/          # Navbar, sidebar, footer
│   │
│   ├── lib/                 # Lógica compartilhada
│   │   ├── supabase/        # Client, server, types gerados
│   │   ├── chess/           # chess.js wrapper, Stockfish wrapper
│   │   ├── glicko2/         # Implementação do rating Glicko-2
│   │   ├── gamification/    # Cálculos de XP, missões, baús
│   │   └── sounds/          # Gerenciador de áudio
│   │
│   ├── hooks/               # React hooks customizados
│   ├── types/               # TypeScript types globais
│   └── styles/              # Estilos globais Tailwind
│
├── supabase/
│   ├── migrations/          # SQL migrations (versionadas)
│   ├── functions/           # Edge Functions (RPCs server-side)
│   └── seed.sql             # Dados iniciais (bots, puzzles, itens)
│
├── scripts/
│   └── import-puzzles.ts    # Script para importar CSV do Lichess
│
├── CLAUDE.md                # Instruções para o Claude (ver seção 4)
├── .env.local               # Variáveis de ambiente (NÃO commitar)
└── docs/
    ├── Recruta64_Visao_do_Produto_v1.md   # Documento de visão do produto
    └── Recruta64_Roadmap_Tecnico_v1.md    # Este documento
```

### 3.3 Dependências principais

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr

# Xadrez
npm install chess.js chessground

# UI
npm install lucide-react clsx tailwind-merge

# Utilitários
npm install zustand              # State management leve
npm install howler               # Gerenciamento de áudio
```

> **Stockfish WASM** será carregado via Web Worker, sem npm — o arquivo .wasm fica em `public/stockfish/`.

---

## 4. O Arquivo CLAUDE.md (Crucial)

O `CLAUDE.md` é um arquivo que fica na raiz do projeto e serve como **instruções permanentes para o Claude**. Toda vez que o Claude Code abre o projeto, ele lê esse arquivo automaticamente. É como um "prompt do sistema" específico para o seu projeto.

### 4.1 Conteúdo do CLAUDE.md

Crie o arquivo `CLAUDE.md` na raiz do projeto com:

> **O CLAUDE.md real está na raiz do repositório** — é a fonte da verdade e já
> divergiu do exemplo que ficava aqui (que ainda dizia Next.js 15 e apontava para
> `docs/VISAO_PRODUTO.md` e `docs/ROADMAP.md`, arquivos que nunca existiram: os
> nomes reais são `docs/Recruta64_Visao_do_Produto_v1.md` e este documento).
> Manter duas cópias garantia que uma ficasse errada — o exemplo foi removido.
>
> Leia [`CLAUDE.md`](../CLAUDE.md).

> **Por que isso importa:** Sem o CLAUDE.md, o Claude começa cada tarefa "do zero" e pode tomar decisões inconsistentes (ex: colocar lógica no client que deveria estar no servidor). Com o CLAUDE.md, ele sempre sabe as regras do projeto.

---

## 5. Workflow de Desenvolvimento

### 5.1 Como trabalhar com o Claude no VS Code

O fluxo ideal para cada tarefa é:

```
1. Você descreve a tarefa ao Claude
   → "Crie a migration do Supabase para a tabela de puzzles"

2. Claude lê o CLAUDE.md (automático) e entende o contexto

3. Claude aplica no banco e valida:
   → npx tsx scripts/apply-migration.ts <arquivo>.sql  (aplica a migration)
   → npm run verify:all                               (11 gates contra o banco)
   → npm run test:e2e                                 (Playwright — bate em produção)

4. Claude escreve o código e aplica no projeto

5. Você revisa, testa, e pede ajustes se necessário

6. Commit quando estiver satisfeito
```

### 5.2 Boas práticas de comunicação com o Claude

**Seja específico:**
- ❌ "Faça a parte de puzzles"
- ✅ "Crie o componente PuzzleBoard que usa chessground para renderizar um puzzle. O componente recebe FEN e sequência de lances como props. Use a seção 6.2 do documento de visão como referência."

**Referencie o documento de visão:**
- ✅ "Implemente o fluxo de Modo Rating conforme descrito na seção 6.2 do Recruta64_Visao_do_Produto_v1.md"
- ✅ "Crie as RPCs de validação conforme a seção 4.2 (Fluxo de Validação)"

**Peça testes junto com o código:**
- ✅ "Crie o componente e depois use o Playwright para verificar se renderiza corretamente"

**Uma tarefa por vez:**
- ❌ "Faça todo o sistema de gamificação"
- ✅ "Crie a RPC de cálculo de XP ao completar uma missão diária"

### 5.3 Controle de versão (Git)

```bash
# Crie o repositório
git init
git remote add origin https://github.com/SEU_USUARIO/cdx-guabiruba.git

# Padrão de commits (em português)
git commit -m "feat: criar tabelas de puzzles e attempts no Supabase"
git commit -m "fix: corrigir cálculo de rating Glicko-2 em streaks altos"
git commit -m "style: ajustar layout do tabuleiro para mobile"
git commit -m "refactor: mover lógica de missões para Edge Function"

# Branches por fase
git checkout -b fase-1/setup
git checkout -b fase-2/banco-de-dados
git checkout -b fase-3/auth
# etc.
```

### 5.4 Deploy contínuo

Conecte o repositório GitHub à Vercel:
1. Vá em vercel.com → Import Project → selecione o repo do GitHub
2. Configure as variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3. Todo push para `main` faz deploy automático

---

## PARTE 2: FASES DE IMPLEMENTAÇÃO

---

## Fase 1 — Setup do Projeto (1-2 dias)

**Objetivo:** Ter o esqueleto do projeto rodando localmente e deployado na Vercel.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 1.1 | Criar projeto Next.js com TypeScript + Tailwind | `npm run dev` funciona em localhost:3000 |
| 1.2 | Criar repositório GitHub e conectar | Push funciona, repo visível no GitHub |
| 1.3 | Criar projeto Supabase | Dashboard acessível, URL e chaves disponíveis |
| 1.4 | Configurar variáveis de ambiente (.env.local) | Supabase client conecta sem erros |
| 1.5 | Criar estrutura de pastas (conforme seção 3.2) | Pastas criadas e organizadas |
| 1.6 | Criar CLAUDE.md na raiz | Arquivo existe e está completo |
| 1.7 | Copiar a Visão do Produto para docs/ | Documento acessível no projeto |
| 1.9 | Deploy inicial na Vercel | Site acessível em URL pública (página em branco ok) |
| 1.10 | Instalar dependências (chess.js, chessground, etc.) | `npm install` sem erros |

**Dependências:** Nenhuma (é a primeira fase).

---

## Fase 2 — Banco de Dados (2-3 dias)

**Objetivo:** Todas as tabelas, RLS policies e RPCs core criadas no Supabase.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 2.1 | Criar tabela `users` (com campos de XP, rating, level) | Tabela existe, RLS ativo |
| 2.2 | Criar tabela `puzzles` (FEN, moves, rating, themes) | Tabela existe com índices por rating e themes |
| 2.3 | Criar tabela `user_puzzle_attempts` | Tabela existe com FK para users e puzzles |
| 2.4 | Criar tabela `lessons` e `user_lesson_progress` | Tabelas existem |
| 2.5 | Criar tabela `bots` e `user_bot_results` | Tabelas existem |
| 2.6 | Criar tabela `bot_game_analysis` | Tabela existe |
| 2.7 | Criar tabelas de gamificação: `daily_missions`, `achievements`, `user_achievements` | Tabelas existem |
| 2.8 | Criar tabelas de itens: `items`, `user_inventory`, `user_equipped` | Tabelas existem |
| 2.9 | Criar tabelas auxiliares: `user_streaks`, `user_titles`, `puzzle_revanche_queue` | Tabelas existem |
| 2.10 | Criar tabelas de turmas: `classes`, `class_members`, `class_tasks`, `user_task_progress`, `class_feed` | Tabelas existem |
| 2.11 | Criar tabela `puzzle_rush_runs` | Tabela existe |
| 2.12 | Criar view materializada `user_public_profiles` | View existe e retorna dados corretos |
| 2.13 | Configurar RLS policies em TODAS as tabelas | Aluno só acessa/modifica seus dados; professor vê alunos da turma |
| 2.14 | Criar RPCs core de validação (puzzle_attempt, lesson_complete, bot_result) | RPCs existem e validam corretamente |
| 2.15 | Criar RPC de missões (check_daily_missions, claim_chest) | RPCs existem |
| 2.16 | Criar RPC de XP/level (grant_xp, check_level_up) | RPCs existem |
| 2.17 | Gerar types TypeScript do Supabase | Arquivo de types gerado e importável |
| 2.18 | Importar puzzles do CSV do Lichess (50k subset) | Puzzles no banco, queries por rating funcionam |
| 2.19 | Seed de dados: bots (10), achievements, itens base | Dados iniciais inseridos |

**Dependências:** Fase 1 completa.

> **Nota:** Esta é a fase mais crítica. Se o banco estiver mal estruturado, tudo acima sofre. Invista tempo aqui.

---

## Fase 3 — Autenticação (1-2 dias)

**Objetivo:** Login/registro funcionando, roles aplicados, rotas protegidas.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 3.1 | Configurar Supabase Auth (email/senha + Google OAuth) | Ambos os métodos funcionam no dashboard |
| 3.2 | Criar páginas /login e /registro | Formulários renderizam e funcionam |
| 3.3 | Implementar auth middleware (proteger rotas logadas) | Redireciona para /login se não autenticado |
| 3.4 | Criar trigger no Supabase: novo cadastro → insert na tabela users (role=aluno, rating=400, level=1) | Novo usuário aparece na tabela users |
| 3.5 | Criar hook useUser() para acessar dados do usuário logado | Hook retorna user com role, XP, rating, level |
| 3.6 | Criar layout base com navbar (nome, avatar placeholder, nível) | Navbar aparece em todas as páginas logadas |
| 3.7 | Conceder baú de boas-vindas no primeiro login | Trigger cria 1 baú para novo usuário |
| 3.8 | Testar com Playwright: fluxo completo de registro → login → dashboard | Teste passa |

**Dependências:** Fases 1 e 2 completas.

---

## Fase 4 — Puzzles (5-7 dias)

**Objetivo:** Os 3 modos de puzzle + revanche funcionando completos.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| **Componente base** | | |
| 4.1 | Criar componente PuzzleBoard (chessground + chess.js) | Tabuleiro renderiza FEN, aceita lances, valida sequência |
| 4.2 | Implementar feedback visual: lance certo (verde), lance errado (vermelho) | Cores aparecem corretamente |
| 4.3 | Implementar sons: acerto e erro | Sons tocam (respeitando mudo) |
| **Modo Rating** | | |
| 4.4 | Criar página /puzzles/rating | Página renderiza |
| 4.5 | Implementar matchmaking: selecionar puzzle por rating do aluno (±100) | Puzzle selecionado está no range correto |
| 4.6 | Implementar anti-repetição (excluir tentados nos últimos 30 dias) | Puzzles já tentados não aparecem |
| 4.7 | Implementar cálculo Glicko-2 na RPC server-side | Rating atualiza corretamente após tentativa |
| 4.8 | Criar tela pós-puzzle: certo/errado, rating delta, streak, auto-next | Tela aparece e transiciona |
| 4.9 | Implementar skip (1 a cada 10 puzzles) | Botão skip funciona, não altera rating |
| 4.10 | Implementar som de streak crescendo | Som toca em 3, 5, 10... |
| **Modo Categorias** | | |
| 4.11 | Criar página /puzzles/categorias com cards dos 20 temas | Cards renderizam com ícone e descrição |
| 4.12 | Criar página /puzzles/categorias/[tema] | Puzzles do tema carregam corretamente |
| 4.13 | Implementar filtro fácil/médio/difícil | Filtro funciona, puzzles mudam |
| 4.14 | Confirmar que categorias NÃO alteram rating global | Rating não muda |
| **Puzzle Rush** | | |
| 4.15 | Criar página /puzzles/rush | Página renderiza com seleção de tempo |
| 4.16 | Implementar preload de 30+ puzzles em batch | Puzzles carregam antes do início |
| 4.17 | Implementar timer (3min/5min) com display visual | Timer funciona e conta regressivo |
| 4.18 | Implementar progressão de dificuldade (começa fácil, sobe) | Rating dos puzzles sobe ao longo da run |
| 4.19 | Implementar 3 vidas (3 erros = fim) | Jogo termina após 3 erros |
| 4.20 | Criar scoreboard final (total, streak, tempo médio, recorde) | Scoreboard renderiza corretamente |
| 4.21 | Implementar histórico de últimas 10 runs | Histórico salva e exibe |
| 4.22 | Implementar sons de rush (tick timer, game over) | Sons funcionam |
| **Revanche** | | |
| 4.23 | Implementar fila de puzzles errados (auto-inserção) | Puzzle errado vai para a fila |
| 4.24 | Criar página /puzzles/revanche com badge de contador | Badge mostra quantidade correta |
| 4.25 | Implementar intervalos de revisão (1d, 3d, 7d) | Puzzles aparecem no timing correto |
| 4.26 | Testar com Playwright: fluxo completo de cada modo | Testes passam |

**Dependências:** Fases 1-3 completas.

---

## Fase 5 — Aulas Globais (5-7 dias)

**Objetivo:** Sistema de aulas interativas funcionando com as primeiras 30 aulas.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 5.1 | Definir schema JSON para conteúdo das aulas | Schema documentado e tipado em TypeScript |
| 5.2 | Criar componente LessonViewer (texto + tabuleiro interativo) | Componente renderiza conteúdo JSON |
| 5.3 | Criar componente LessonExercise (exercício prático dentro da aula) | Aluno faz lance, sistema valida |
| 5.4 | Criar página /aulas com mapa de trilhas (estilo Duolingo) | Trilhas renderizam com estado (bloqueada/atual/concluída) |
| 5.5 | Implementar desbloqueio sequencial (trilha anterior precisa estar concluída) | Desbloqueio funciona |
| 5.6 | Criar página /aulas/[id] com viewer + exercícios | Aula completa renderiza |
| 5.7 | Implementar validação server-side de conclusão de aula | RPC valida todos os steps |
| 5.8 | Criar conteúdo das aulas 1-10 (trilha Recruta, parte 1) | Aulas jogáveis |
| 5.9 | Criar conteúdo das aulas 11-20 (trilha Recruta, parte 2 + Soldado início) | Aulas jogáveis |
| 5.10 | Criar conteúdo das aulas 21-30 (trilha Soldado + Aspirante início) | Aulas jogáveis |
| 5.11 | Sons de exercício correto dentro da aula | Sons funcionam |
| 5.12 | Testar com Playwright: fluxo de aula completa | Teste passa |

**Dependências:** Fases 1-3. Pode ser feita em paralelo com a Fase 4 (puzzles).

> **Nota:** As aulas 1-30 são o trabalho mais demorado desta fase. O schema JSON precisa ser flexível o suficiente para: texto narrativo, posições de tabuleiro para demonstração, lances guiados (avançar/voltar), e exercícios interativos.

---

## Fase 6 — Bots (4-5 dias)

**Objetivo:** 10 bots funcionando com Stockfish WASM, personalidade e análise leve.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| **Engine** | | |
| 6.1 | Configurar Stockfish WASM em Web Worker | Engine responde a comandos UCI |
| 6.2 | Criar wrapper StockfishEngine com métodos: setSkill(), bestMove(), evaluate() | Wrapper funciona |
| 6.3 | Testar performance em mobile (Chrome Android) | Tempo de resposta < 3s para depth 10 |
| **Jogo** | | |
| 6.4 | Criar página /bots com cards dos 10 bots (avatar, nome, elo, cadeado) | Cards renderizam com estado de desbloqueio |
| 6.5 | Implementar desbloqueio progressivo (derrotar anterior desbloqueia próximo) | Desbloqueio funciona |
| 6.6 | Criar componente BotGame (tabuleiro + engine + frases do bot) | Partida jogável contra bot |
| 6.7 | Implementar frases de personalidade (pré-jogo, durante, pós) | Frases aparecem em balões |
| 6.8 | Configurar os 10 bots com Skill Level e Depth corretos | Cada bot joga no nível esperado |
| 6.9 | Sons de partida: captura, xeque, xeque-mate, derrota | Sons funcionam |
| **Análise leve** | | |
| 6.10 | Salvar PGN da partida no servidor | PGN salvo na tabela user_bot_results |
| 6.11 | Implementar análise pós-partida leve (Stockfish depth ~12, top 3 blunders) | Análise gera resultados corretos |
| 6.12 | Criar tela de resumo pós-partida (accuracy, contagem, top 3 erros) | Tela renderiza |
| 6.13 | Criar visualização dos 3 piores lances no tabuleiro | Aluno vê o lance errado e o ideal |
| 6.14 | Validação server-side do resultado (RPC verifica PGN) | Resultado validado |
| 6.15 | Testar com Playwright: jogar partida → ver análise | Teste passa |

**Dependências:** Fases 1-3. Pode ser feita em paralelo com Fases 4-5.

---

## Fase 7 — Gamificação (5-7 dias)

**Objetivo:** Sistema completo de XP, níveis, missões, conquistas, baús, streak e títulos.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| **XP e Níveis** | | |
| 7.1 | Implementar fórmula de XP por nível (100 × 1.05^(n-1)) | Cálculo correto para todos os 100 níveis |
| 7.2 | Criar RPC grant_xp (valida, soma XP, verifica level up) | RPC funciona, level up automático |
| 7.3 | Criar componente XPBar (barra de progresso no dashboard) | Barra renderiza com XP atual/necessário |
| 7.4 | Implementar som de level up | Som toca ao subir de nível |
| 7.5 | Conceder baú ao subir de nível (server-side) | Baú aparece no inventário |
| **Missões Diárias** | | |
| 7.6 | Criar pool de ~20 missões possíveis | Missões definidas no banco |
| 7.7 | Implementar sorteio diário (5 missões, sem repetição no dia) | Missões sorteadas corretamente |
| 7.8 | Criar RPC check_daily_missions (verifica conclusão via eventos) | Missões marcam como concluídas |
| 7.9 | Criar componente MissionPanel no dashboard | Painel mostra 5 missões com estado |
| 7.10 | Implementar concessão de baú ao completar as 5 | Baú concedido server-side |
| 7.11 | Anti-farming: missões de bot exigem bot do nível ou acima | Validação funciona |
| **Conquistas** | | |
| 7.12 | Criar sistema de conquistas (condições verificadas por eventos) | Conquistas desbloqueiam corretamente |
| 7.13 | Criar página de conquistas no perfil (com badges) | Badges renderizam |
| 7.14 | Som de conquista desbloqueada | Som toca |
| **Streak** | | |
| 7.15 | Implementar streak de dias (verificação server-side) | Streak incrementa/reseta corretamente |
| 7.16 | Criar componente StreakDisplay (🔥 + número) | Componente renderiza no dashboard |
| 7.17 | Implementar bônus de milestones (7d, 14d, 30d, 60d, 100d) | Bônus concedidos |
| **Baús** | | |
| 7.18 | Implementar RPC open_chest (roll de raridade server-side) | Roll funciona com drop rates corretos |
| 7.19 | Criar componente/animação de abertura de baú | Animação + som + revelação do item |
| 7.20 | Integrar com inventário (item vai pro inventário automaticamente) | Item aparece no inventário |
| **Títulos** | | |
| 7.21 | Implementar sistema de títulos baseado em trilha concluída | Título atualiza ao concluir trilha |
| 7.22 | Exibir título no perfil e ranking | Título visível |
| 7.23 | Testar fluxo completo: puzzle → missão → XP → level up → baú | Tudo encadeia corretamente |

**Dependências:** Fases 4, 5 e 6 (precisa das atividades existindo para que missões e conquistas funcionem).

---

## Fase 8 — Avatar e Inventário (3-4 dias)

**Objetivo:** Avatar vestível com 6 slots, inventário funcional, equipamento.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 8.1 | Criar componente AvatarDisplay (boneco base + slots sobrepostos) | Avatar renderiza com itens |
| 8.2 | Criar ~50 itens iniciais (~8 por slot, distribuídos por raridade) | Itens no banco com imagens |
| 8.3 | Criar página /perfil com avatar + inventário lado a lado | Página renderiza |
| 8.4 | Implementar equipar/desequipar item (click no inventário) | Avatar atualiza em tempo real |
| 8.5 | Filtros no inventário (por slot, por raridade) | Filtros funcionam |
| 8.6 | Criar componente PetDisplay (pet ao lado do avatar) | Pet renderiza |
| 8.7 | Implementar efeito visual por raridade (brilho dourado para lendário, etc.) | Efeitos visuais |
| 8.8 | Testar com Playwright: abrir baú → equipa item → avatar muda | Teste passa |

**Dependências:** Fase 7 (baús precisam existir para gerar itens).

---

## Fase 9 — Painel do Professor (4-5 dias)

**Objetivo:** Professor cria turmas, atribui tarefas, vê relatórios, mural funciona.

> **Nota:** Ranking por turma (leaderboard filtrado) é implementado na Fase 10 (tarefa 10.4). A Fase 9 entrega relatórios de progresso individuais e agregados.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| **RLS e Segurança** | | |
| 9.1 | RLS: professor só vê alunos de suas turmas; aluno só vê turmas que pertence | Policies ativas, queries filtram corretamente |
| **Turmas** | | |
| 9.2 | Criar página /turmas (lista de turmas do professor) | Página renderiza |
| 9.3 | Implementar criação de turma (nome + código de convite gerado) | Turma criada com código |
| 9.4 | Implementar entrada de aluno por código de convite | Aluno entra na turma |
| 9.5 | Implementar remoção de aluno da turma | Professor remove aluno |
| **Tarefas** | | |
| 9.6 | Criar interface de criação de tarefa (tipo + config + prazo). Tipos fechados: completar aula, resolver N puzzles (rating ou tema), derrotar bot, fazer puzzle rush. Tarefas apontam para atividades já existentes no site. | Professor cria tarefa com tipo, configuração e prazo |
| 9.7 | Implementar exibição de tarefas pendentes no dashboard do aluno | Aluno vê tarefas |
| 9.8 | Implementar verificação automática de conclusão de tarefa. Verificação server-side via RPC que consulta eventos já persistidos (user_puzzle_attempts, user_lesson_progress, user_bot_results, puzzle_rush_runs). | Tarefa marca como concluída ao detectar eventos reais |
| 9.9 | Criar relatório de tarefas (quem completou, quem não) | Relatório funciona |
| **Mural** | | |
| 9.10 | Implementar inserção automática de eventos no feed (triggers) | Eventos aparecem ao derrotar bot, subir nível, etc. |
| 9.11 | Criar página /turmas/[id]/mural com feed cronológico | Mural renderiza |
| **Relatório** | | |
| 9.12 | Criar página de relatório de progresso por aluno | Dados corretos por aluno |
| 9.13 | Criar visão geral da turma (métricas agregadas) | Dashboard da turma funciona |
| 9.14 | Testar com Playwright: criar turma → adicionar aluno → atribuir tarefa | Teste passa |

**Dependências:** Fases 3-7 (precisa de auth, puzzles, aulas, bots, gamificação).

---

## Fase 10 — Rankings e Perfis Públicos (2-3 dias)

**Objetivo:** Leaderboards global e por turma, perfis públicos clicáveis.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 10.1 | Criar página /ranking com tabs (Rating, Rush 3min, Rush 5min, Nível) | Página renderiza com tabs |
| 10.2 | Implementar queries otimizadas para Top 50 + posição do aluno | Performance < 500ms |
| 10.3 | Criar página /perfil/[user_id] (perfil público) | Perfil renderiza com avatar, stats, conquistas |
| 10.4 | Implementar ranking por turma (mesmas categorias, filtrado) | Ranking da turma funciona |
| 10.5 | Implementar privacidade: nome parcial por padrão, opt-out de ranking | Configurações funcionam |
| 10.6 | Testar com Playwright: ver ranking → clicar perfil → verificar dados | Teste passa |

**Dependências:** Fases 4-8 (precisa de dados para popular rankings).

---

## Fase 11 — Sound Design + PWA + Polish (3-4 dias)

**Objetivo:** Feedback sonoro completo, PWA instalável, responsividade perfeita.

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| **Sons** | | |
| 11.1 | Criar/obter todos os efeitos sonoros (licença livre) | Arquivos .mp3 em public/sounds/ |
| 11.2 | Implementar SoundManager (Howler.js) com opção de mudo global | Gerenciador funciona |
| 11.3 | Integrar sons em todos os pontos (puzzle, bot, gamificação) | Sons tocam corretamente |
| 11.4 | Testar volume em sequência rápida (Puzzle Rush) | Sem saturação |
| **PWA** | | |
| 11.5 | Criar manifest.json com nome, ícones, cores | Manifest válido |
| 11.6 | Configurar Service Worker (cache de assets estáticos) | Assets em cache |
| 11.7 | Testar instalação no Android e iOS | App instala e abre corretamente |
| **Polish** | | |
| 11.8 | Testar responsividade em: mobile (320px), tablet (768px), desktop (1280px) | Layout correto em todos |
| 11.9 | Testar performance em dispositivo low-end (Android) | Sem travamentos |
| 11.10 | Verificar todas as telas com Playwright (screenshots) | Screenshots aprovados |
| 11.11 | Corrigir bugs encontrados nos testes | Zero bugs bloqueantes |

**Dependências:** Todas as fases anteriores.

---

## Fase 12 — Testes Finais e Lançamento (2-3 dias)

### Tarefas:

| # | Tarefa | Critério de "Feito" |
|---|---|---|
| 12.1 | Teste end-to-end completo: registro → aula → puzzle → bot → level up → baú → equip item | Fluxo inteiro funciona |
| 12.2 | Teste de professor: criar turma → add aluno → tarefa → relatório | Fluxo do professor funciona |
| 12.3 | Teste de segurança: tentar manipular XP/rating via console | Servidor bloqueia |
| 12.4 | Teste de carga: 20 usuários simultâneos | Sem degradação |
| 12.5 | Revisar LGPD: nomes parciais, opt-out, sem dados expostos | Conformidade ok |
| 12.6 | Deploy final para produção | Site live e acessível |
| 12.7 | Criar 3-5 contas de teste para professores | Contas prontas |
| 12.8 | Documentação de acesso para o clube | Doc entregue |

---

## Resumo de Timeline

| Fase | Duração Estimada | Acumulado |
|---|---|---|
| 1. Setup | 1-2 dias | 1-2 dias |
| 2. Banco de Dados | 2-3 dias | 3-5 dias |
| 3. Auth | 1-2 dias | 4-7 dias |
| 4. Puzzles | 5-7 dias | 9-14 dias |
| 5. Aulas | 5-7 dias | 14-21 dias |
| 6. Bots | 4-5 dias | 18-26 dias |
| 7. Gamificação | 5-7 dias | 23-33 dias |
| 8. Avatar/Inventário | 3-4 dias | 26-37 dias |
| 9. Professor | 4-5 dias | 30-42 dias |
| 10. Rankings | 2-3 dias | 32-45 dias |
| 11. Polish | 3-4 dias | 35-49 dias |
| 12. Testes/Lançamento | 2-3 dias | 37-52 dias |

**Estimativa total: 8-12 semanas** para v1 completa.

> As fases 4, 5 e 6 (Puzzles, Aulas, Bots) podem ser parcialmente paralelas se trabalhadas alternadamente. A timeline assume trabalho sequencial com dedicação parcial.

---

> **Como usar este documento:** Ao iniciar cada fase, referencie tanto este roadmap quanto a seção correspondente do documento de Visão do Produto. Peça ao Claude: "Estamos na Fase X, tarefa X.Y — implemente conforme o roadmap e a seção Z da visão do produto."
