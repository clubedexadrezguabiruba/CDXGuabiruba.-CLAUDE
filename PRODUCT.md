# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alunos do **Clube de Xadrez Guabiruba** (Santa Catarina, Brasil) — em maioria
**crianças e adolescentes** de escola pública, que treinam entre as aulas
presenciais do clube. Acessam quase sempre pelo **celular**, muitas vezes em
aparelho compartilhado e conexão instável. Mobile-first não é preferência de
estilo: é a condição real de uso.

O trabalho deles no produto é **treinar sozinho e ver que avançou** — resolver
desafios táticos, completar aulas, jogar contra bots — entre um encontro
presencial e o seguinte.

Segundo público: o **professor do clube**, que cria turmas, passa tarefas e lê
relatórios de progresso da turma e de cada aluno.

Idioma: **português do Brasil**, em todo o produto.

## Product Purpose

Dar ao aluno de um clube pequeno uma trilha de formação em xadrez que ele
consegue percorrer sozinho, com progresso que **o servidor verifica** — não que
ele declara. O sucesso é o aluno voltando sem ser cobrado, e chegando à aula
presencial mais forte do que saiu da anterior.

## Positioning

Não é mais um site de puzzles. É o **currículo do clube**, versionado e
verificável: 126 aulas em 7 trilhas, com posições vindas de livros comprados
(cadernos do Steps, de la Villa) e do banco Lichess, prática contra o motor em 20
aulas de técnica, e blocos de revisão espaçada obrigatórios. Um site genérico de
xadrez não tem o currículo do professor dentro dele, nem o professor lendo o
relatório da turma no dia seguinte.

## Operating Context

- **Celular, em pé, em intervalos curtos.** A sessão típica é de minutos, não de
  uma hora. Nada que exija mouse ou tela larga pode ser essencial.
- O tabuleiro é o objeto central de quase toda tela de prática — arrastar peça em
  tela de 375px é o gesto mais executado do produto.
- O aluno usa em paralelo à aula presencial; o professor referencia o site na aula.
- Áudio existe e **respeita o mudo do usuário** — muitos usam em sala de aula.

## Capabilities and Constraints

**Superfícies existentes** (~24 telas de produto, App Router do Next.js 16):
landing pública · login/registro · Quartel-General (dashboard) · Trilhas de
Formação (lista, aula, revisão) · Desafios Táticos (rating, rush, revanche,
categorias) · Bots (lista, partida com análise) · Quadro de Honra · Perfil
(próprio e de terceiros) · Turmas (mural, ranking, tarefas, relatório) ·
configurações · criação de personagem. O mapa planejado está em
`docs/Recruta64_Visao_do_Produto_v1.md` §15.

**Regra inviolável — server-authority.** Toda recompensa (XP, rating, missão,
baú, conquista, streak) é concedida **exclusivamente no servidor**, via RPC ou
trigger, de forma idempotente. O client envia tentativa; o servidor decide. Isso
tem consequência de design: **nenhuma tela pode exibir recompensa antes da
confirmação do servidor** — animação de baú, barra de XP e level-up são reação a
um fato já concedido, nunca uma promessa otimista.

**Segurança:** RLS ativo em todas as tabelas; nunca confiar no relógio do client
para prazo ou expiração.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 ·
Supabase · chessground + chess.js · Stockfish WASM em Web Worker (browser-only) ·
Zustand · Howler.js. Deploy em Vercel + Supabase.

**Restrições técnicas que limitam o design:**
- O tabuleiro é do **chessground**, biblioteca externa com CSS próprio. Ele não se
  redesenha à vontade.
- **Sem dark mode** hoje (`color-scheme: light` fixo). Introduzir tema escuro é
  decisão em aberto, não um dado.
- Não existe biblioteca de componentes de terceiros (sem shadcn, sem Radix).
  `src/components/ui/` tem a **wave 1 própria** — `Button`, `Card`, `Badge`,
  `ProgressBar` — construída em 2026-08-03. A wave 2 declarada no `DESIGN.md`
  (Modal, Field, Toast, Spinner, EmptyState) ainda não existe, e o produto
  continua majoritariamente à mão: `verify:design-tokens` mede **1.154 cores
  cruas em 59 arquivos** (baseline 1.331), contra 107 usos de token — e apenas
  **1 primitivo** é usado em tela real de produto (`ProgressBar` em
  `FaixaDeComando.tsx`). O número que vale é o do gate, não uma contagem à mão.
- `npm run test:e2e` bate no **Supabase de produção** e cria usuários reais.
  Verificação visual não pode depender dele.

**Público infantil:** o repositório é público hoje e guarda dados de alunos
menores de idade — decisão registrada para revisitar antes do lançamento.

## Brand Commitments

O produto tem uma **bíblia tonal escrita e vinculante**:
`docs/Recruta64_Biblia_Tonal_v1.md` (1054 linhas). É brand commitment, não
sugestão. Os pontos que constrangem qualquer trabalho visual futuro:

- **O universo é "O Reino das 64 Casas"** — fantasia medieval elegante com
  vocabulário de campanha. **Não é militarismo realista.**
- **Vocabulário de navegação obrigatório** (§8). A navegação principal usa
  palavras claras — Início, Trilhas, Desafios, Bots, Quadro de Honra, Perfil,
  Turmas — e a camada temática aparece em títulos e blocos internos:
  Dashboard → **Quartel-General** · Aulas → **Trilhas de Formação** · Puzzles →
  **Desafios Táticos** · Missões diárias → **Ordens do Dia** · Análise pós-jogo →
  **Revisão de Batalha** · Ranking → **Quadro de Honra** · Streak → **Sequência de
  Campanha** · Badges → **Insígnias** · Itens → **Equipamentos** · Turmas →
  **Companhias**.
- **Escada de patentes de 6 degraus**, que é o eixo de progressão do produto:
  Soldado → Aspirante → Capitão → Comandante → General → Mestre. (O tier de
  entrada chama-se **Aprendiz**; "Recruta" é o nome da *trilha* de aulas, não de
  uma patente.)
- **Curva tonal obrigatória** (§14): início acolhedor e humano → meio firme e
  técnico → fim nobre, silencioso e memorável. Vale para texto, ilustração,
  ambientação, animação e recompensa.
- **Tom no ranking: prestígio, nunca humilhação** (§16.5). O Quadro de Honra é
  visto por crianças de uma turma que se conhecem pessoalmente.

## Evidence on Hand

Real, no repositório:

- `docs/Recruta64_Biblia_Tonal_v1.md` — identidade verbal e tonal completa.
- `docs/curriculo/01-curriculo-definitivo-v1.md` — as 126 aulas, aprovado.
- `scripts/avatar/patentes.ts` — a **única paleta medida e travada por gate** do
  projeto (as 6 patentes), com lei de distância mínima de matiz entre patentes
  vizinhas, medida por `npm run verify:paleta-patentes`.
- `docs/avatar/15-plano-ate-pronto.md` — o avatar em estilo **kokeshi/chibi**, com
  base visual já aprovada: contorno `#000000`, cor chapada, sem orelhas.
- `src/app/page.tsx` — a landing, hoje a **única** superfície que usa os tokens de
  marca.
- 50 mil puzzles importados do Lichess.

**Não existe e não pode ser inventado:** depoimento de aluno, número de usuários,
caso de sucesso, prêmio, imprensa, foto de aluno real. O produto ainda só tem
contas de teste. Qualquer prova social em tela é fabricação.

## Product Principles

1. **O servidor decide, a tela relata.** Nenhum elemento visual promete
   recompensa que o servidor ainda não concedeu.
2. **Celular primeiro, e a sério.** 375px é o alvo de projeto, não o caso
   degradado. Se só funciona bem no desktop, não funciona.
3. **Progresso tem que ser visível sem ser lido.** O aluno precisa enxergar que
   avançou antes de interpretar um número.
4. **Mérito sem humilhação.** Destaque para quem sobe; nunca vergonha para quem
   está atrás.
5. **A ambientação serve à clareza, não o contrário.** O tema entra em título,
   bloco e feedback — nunca ao custo de o aluno entender onde clicar.

## Accessibility & Inclusion

- **Alvo de contraste WCAG AA** em texto e em estado de acerto/erro — a tela é
  usada sob luz de sala de aula e em celulares baratos.
- **Cor nunca sozinha como sinal.** Acerto, erro, bloqueado e concluído precisam
  de forma ou ícone além da cor: o produto é de xadrez e daltonismo é comum.
- **Alvo de toque de 44px** no mínimo — a mão é de criança e a tela é pequena.
- **Áudio sempre dispensável**, e o mudo do usuário é respeitado.
- **Leitura em português para leitor iniciante:** frase curta, voz ativa, e o
  rótulo diz o que o aluno controla.
