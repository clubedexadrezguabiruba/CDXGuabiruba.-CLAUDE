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
landing pública · login/registro · Saguão (dashboard) · Trilhas (lista, aula,
revisão) · Desafios (rating, rush, revanche, categorias) · Sala de Duelos (lista
de bots, partida com análise) · Quadro de Honra · Perfil (próprio e de terceiros)
· Turmas (mural, ranking, tarefas, relatório) · configurações · Matrícula. O mapa
planejado está em `docs/Recruta64_Visao_do_Produto_v1.md` §15.

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
`docs/Academia64_Biblia_Tonal_v2.md`. É brand commitment, não sugestão. Os pontos
que constrangem qualquer trabalho visual futuro:

- **O produto e o universo se chamam "Academia 64"** — uma academia
  extraordinária de estratégia: fantasia leve, descoberta e mistério, **sem
  época**. **Não é militarismo.** Aluno pode ser moderno ou excêntrico; bot pode
  ser coruja, autômato ou criatura — o que amarra o elenco é o lugar
  compartilhado. (*Recruta 64* / *O Reino das 64 Casas* são nomes históricos; o
  porquê medido está no Apêndice A da Bíblia v2.) Slogan: *"Uma academia inteira,
  e 64 casas para explorar."*
- **Fórmula tonal** (§3): 50% academia e aprendizado · 25% descoberta e mistério ·
  15% competição e domínio · 10% humor e calor humano.
- **O título aparece na moldura em volta do avatar, não na roupa.** Duas
  linguagens de cor que nunca ocupam o mesmo elemento: título na moldura, raridade
  na vitrine do editor. O traje é peça de catálogo com **cor final livre**.
- **Vocabulário obrigatório** (§7). A navegação principal usa palavras claras —
  Início, Trilhas, Desafios, Bots, Quadro de Honra, Perfil, Turmas — e a camada
  temática aparece em títulos e blocos internos:
  Dashboard → **Saguão** · Aulas → **Trilhas** · Puzzles → **Desafios** · Missões
  diárias → **Missões do Dia** · Análise pós-jogo → **Revisão da Partida** ·
  Ranking → **Quadro de Honra** · Streak → **Sequência de Presença** · Badges →
  **Insígnias** · Itens → **Guarda-roupa** · Turmas → **Turmas** · Bots → **Sala
  de Duelos** · Criar personagem → **Matrícula**.
  **Palavras banidas de texto de aluno:** campanha, patente, recruta, companhia,
  quartel, batalha, tropa, reino, "falha tática".
- **Escada de títulos de 8 degraus**, que é o eixo de progressão do produto:
  Calouro (tier 0) → Aprendiz → Estudante → Analista → Estrategista → Mestre →
  Grão-Mestre → Lenda. Os 6 degraus do meio têm cor medida; os slugs de trilha no
  banco (`recruta`…`mestre`) **não mudam** — são chave, não texto.
- **Curva tonal obrigatória** (§8): início acolhedor e humano → meio curioso e
  preciso → fim econômico e marcante. Vale para texto, ilustração, ambientação,
  animação e recompensa.
- **Tom no ranking: prestígio, nunca humilhação** (§12.5). O Quadro de Honra é
  visto por crianças de uma turma que se conhecem pessoalmente.

## Evidence on Hand

Real, no repositório:

- `docs/Academia64_Biblia_Tonal_v2.md` — identidade verbal e tonal completa.
  (A v1, escrita para o reino, está em `docs/_superado/`.)
- `docs/curriculo/01-curriculo-definitivo-v1.md` — as 126 aulas, aprovado.
- `scripts/avatar/patentes.ts` — a **única paleta medida e travada por gate** do
  projeto (os 6 títulos com cor), com lei de distância mínima de matiz entre
  títulos vizinhos, medida por `npm run verify:paleta-patentes`. O arquivo e o
  script npm mantêm o nome antigo de propósito: são chave interna, não texto.
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
