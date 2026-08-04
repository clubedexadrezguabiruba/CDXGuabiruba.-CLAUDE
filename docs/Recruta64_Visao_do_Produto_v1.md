# 🏰 Recruta 64 — Visão Geral do Produto v1.0

> **Recruta 64 — Plataforma Educacional de Xadrez**
> Documento de Visão do Produto | Fevereiro 2026

---

## 1. Visão do Produto

Uma plataforma web educacional de xadrez, responsiva (mobile-first), que funciona como extensão digital das aulas presenciais do Clube de Xadrez Guabiruba (Recruta 64). O aluno pratica, evolui e se diverte com gamificação completa — aulas interativas, puzzles, bots com personalidade e um sistema de progressão com avatar vestível.

### 1.1 Objetivos Estratégicos

| Objetivo | Como o site entrega |
|---|---|
| Extensão da aula presencial | Aulas globais progressivas + tarefas atribuídas pelo professor |
| Prática individual extra | Puzzles (Rating, Categorias, Rush) + Bots educacionais |
| Engajamento contínuo | Gamificação completa: XP, níveis, missões, baús, avatar vestível, pets |

### 1.2 Público-alvo

- Alunos do clube (crianças, adolescentes e adultos iniciantes a avançados)
- Professores do clube (acompanhamento e atribuição de tarefas)

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (React) + Tailwind CSS |
| Backend/Auth/DB | Supabase (PostgreSQL + Auth + Row Level Security) |
| Tabuleiro interativo | chessground (lib do Lichess) ou chess-board React |
| Engine de xadrez | Stockfish WASM (roda no navegador do aluno) |
| Banco de puzzles | CSV público do Lichess (pré-importado no Supabase) |
| Hospedagem | Vercel (frontend) + Supabase (backend) |
| PWA | Guia oficial Next.js PWA (Service Worker, manifest, cache) |
| Real-time (v2) | Supabase Realtime ou WebSockets para PvP |

---

## 3. Roles e Autenticação

### 3.1 Autenticação
- Login por **email/senha** e **Google OAuth**
- Todo novo cadastro é automaticamente **Aluno**
- Promoção para **Professor** é feita manualmente no Supabase (admin)

### 3.2 Roles

| Role | Permissões |
|---|---|
| **Aluno** | Acesso a todas as funcionalidades: aulas, puzzles, bots, gamificação, avatar |
| **Professor** | Tudo do aluno + seção **Turmas**: criar/gerenciar turmas, atribuir tarefas, ver relatório de progresso dos alunos |
| **Admin** | Acesso direto ao Supabase para gerenciar roles (sem painel dedicado na v1) |

---

## 4. Princípio de Integridade (Autoridade do Servidor)

Toda concessão de recompensa, cálculo de rating e progresso é feita **exclusivamente no servidor** (Supabase RPCs / Edge Functions). O client nunca decide se o aluno ganhou XP, acertou puzzle ou desbloqueou conquista.

### 4.1 Regra de Ouro

> **O client envia tentativas. O servidor decide resultados.**

### 4.2 Fluxo de Validação

| Ação do aluno | Client envia | Servidor valida e executa |
|---|---|---|
| Resolver puzzle | puzzle_id + sequência de lances | Compara lances com solução correta → calcula rating Glicko-2 → registra tentativa → verifica missões → concede XP se aplicável |
| Completar exercício de aula | lesson_id + step_id + lance | Valida lance correto → marca step concluído → se todos steps ok, marca aula concluída → verifica missões |
| Derrotar bot | bot_id + PGN da partida | Valida resultado (PGN consistente) → registra vitória → verifica desbloqueio do próximo bot → verifica missões |
| Completar missão diária | (automático) | Servidor detecta que condição foi cumprida via eventos → concede XP → verifica se todas 5 completas → concede baú |
| Abrir baú | chest_id | Servidor faz roll de raridade → seleciona item → adiciona ao inventário |
| Subir de nível | (automático) | Servidor detecta XP suficiente → sobe nível → concede baú de level-up → verifica conquistas |

### 4.3 Eventos Idempotentes

O sistema usa eventos idempotentes para evitar duplicação de recompensas:

- `puzzle_solved` — registrado uma vez por puzzle_id + user_id (anti-repetição por período)
- `lesson_completed` — registrado uma vez por lesson_id + user_id (permanente)
- `bot_defeated` — registrado a cada partida, mas conquistas verificam condições únicas
- `mission_completed` — registrado uma vez por mission_id + date + user_id
- `chest_opened` — registrado uma vez por chest_id (baú é consumido ao abrir)

### 4.4 Proteções Anti-Trapaça

- Todas as RPCs usam **Row Level Security** (RLS) — aluno só acessa/modifica seus próprios dados
- Rate limiting em RPCs de puzzle e missão (evita spam de tentativas)
- Validação server-side da sequência de lances (puzzle e aula) — client não informa "acertei", envia os lances
- Streak e missões calculados pelo servidor com base em timestamps reais
- Baú: roll de raridade acontece no servidor (aluno não pode manipular drop)

---

## 5. Core Feature: Aulas Globais

> ⚠️ **Esta seção inteira está superada.** A fonte de verdade do conteúdo
> pedagógico é `docs/curriculo/01-curriculo-definitivo-v1.md` (rev. 4,
> 2026-07-31): **126 aulas em 7 trilhas**, não as 100/30 descritas abaixo. Leia a
> §5 só como registro da intenção original.

### 5.1 Estrutura

- **100 aulas progressivas** (v1 lança com **30 aulas**, restante adicionado progressivamente)
- Conteúdo **interativo com tabuleiro embutido** (sem vídeo)
- Formato de cada aula: explicação textual → diagramas interativos → exercícios práticos dentro da aula ("agora faça esse lance")

### 5.2 Trilhas de Aprendizagem

As 100 aulas são organizadas em trilhas temáticas progressivas, estilo Duolingo/Chess.com:

| # | Trilha | Aulas | Rating Estimado |
|---|---|---|---|
| 1 | **Recruta** | 1–15 | 0–600 |
| 2 | **Soldado** | 16–30 | 600–900 |
| 3 | **Aspirante** | 31–45 | 900–1200 |
| 4 | **Capitão** | 46–60 | 1200–1500 |
| 5 | **Comandante** | 61–75 | 1500–1800 |
| 6 | **General** | 76–90 | 1800–2100 |
| 7 | **Mestre** | 91–100 | 2100+ |

Cada trilha é desbloqueada ao concluir a anterior. Dentro de cada trilha, as aulas são sequenciais.

### 5.3 Conteúdo de cada aula (modelo)

1. **Título e objetivo** (ex: "Garfo de Cavalo — Ataque Duplo")
2. **Explicação** com texto e tabuleiro interativo mostrando posições
3. **Demonstração guiada** — o aluno vê a sequência e pode avançar/voltar
4. **Exercícios integrados** (3 a 5 por aula) — o aluno precisa fazer o lance correto no tabuleiro
5. **Conclusão** com resumo do que foi aprendido (progresso na aula conta para missões diárias relacionadas)

---

## 6. Core Feature: Puzzles

> Todos os puzzles são pré-importados do banco CSV público do Lichess. Nenhuma chamada de API em tempo real. Tudo local/banco próprio.

### 6.1 Banco de Puzzles

- **50.000 puzzles importados** (subset filtrado do banco Lichess)
- Range de rating: **400 a 2800**
- Cada puzzle contém: FEN, sequência de lances, rating, temas/tags
- Armazenados no Supabase com índices por rating e tema

### 6.2 Modo Rating (principal)

**Sistema de Rating: Glicko-2** (mesmo do Lichess — mais justo que Elo puro, com desvio e volatilidade)

| Parâmetro | Valor |
|---|---|
| Rating inicial do aluno | **400** |
| Rating mínimo | 100 |
| Rating máximo | 3000 |
| Desvio inicial (RD) | 350 |
| Volatilidade inicial | 0.06 |

**Fluxo do Modo Rating:**

1. Sistema seleciona puzzle com rating próximo ao do aluno (±100 inicialmente, ajusta com RD)
2. Anti-repetição: exclui puzzles já tentados pelo aluno nos últimos 30 dias
3. Aluno resolve (ou erra)
4. Tela pós-puzzle imediata:
   - ✅ Certo ou ❌ Errado
   - Rating delta (ex: +12 / -9)
   - Streak atual (🔥 3)
   - Transição automática para o próximo puzzle
5. **Skip**: 1 skip gratuito a cada 10 puzzles. Skip não altera rating nem streak.

### 6.3 Modo Categorias (treino por tema)

**Categorias disponíveis:**

| Tema | Descrição |
|---|---|
| Mate em 1 | Dê o xeque-mate em 1 lance |
| Mate em 2 | Dê o xeque-mate em 2 lances |
| Mate em 3+ | Dê o xeque-mate em 3 ou mais lances |
| Garfo (Fork) | Ataque duplo com uma peça |
| Cravada (Pin) | Imobilize uma peça contra o rei ou peça valiosa |
| Espeto (Skewer) | Ataque em linha forçando peça valiosa a mover |
| Ataque Descoberto | Mova uma peça revelando ataque de outra |
| Xeque Descoberto | Ataque descoberto com xeque |
| Ataque Duplo | Duas peças atacam simultaneamente |
| Peça Pendurada | Capture peça desprotegida |
| Desvio (Deflection) | Force uma peça a abandonar a defesa |
| Atração (Attraction) | Force o rei/peça a uma casa vulnerável |
| Eliminação do Defensor | Remova a peça que protege outra |
| Raio-X (X-Ray) | Ataque através de uma peça intermediária |
| Sacrifício | Entregue material para ganhar vantagem decisiva |
| Zugzwang | Force o adversário a fazer um lance ruim |
| Promoção de Peão | Temas envolvendo promoção tática |
| Finais: Rei e Peões | Técnicas de finais de peões |
| Finais: Torres | Técnicas de finais de torre |
| Finais: Peças Menores | Técnicas com bispo e cavalo |

**Interface:**
- Cards visuais com ícone + nome + descrição simples (20 temas)
- Filtro de dificuldade dentro de cada categoria:
  - 🟢 Fácil (rating 400–1000)
  - 🟡 Médio (rating 1000–1600)
  - 🔴 Difícil (rating 1600+)
- Puzzles no modo categorias **não alteram o rating global** do aluno (prática livre)

### 6.4 Puzzle Rush (Solo)

**Modos disponíveis:** 3 minutos | 5 minutos

**Fluxo:**
1. Aluno seleciona o tempo → início em 1 clique
2. Puzzles pré-carregados em batch (mínimo 30 puzzles carregados de uma vez)
3. Progressão de dificuldade: começa com puzzles fáceis (rating 400-600) e sobe gradualmente
4. 3 vidas (3 erros = fim) OU tempo esgotado = fim
5. **Scoreboard final:**
   - Total de puzzles resolvidos
   - Melhor streak dentro da run
   - Tempo médio por puzzle
   - Recorde pessoal (comparação com melhor run)
6. **Histórico:** últimas 10 runs salvas

**Regras técnicas:**
- Puzzles do Rush **não alteram rating global**
- Preload obrigatório (batch de 30+ puzzles ao iniciar)
- Sem pausa permitida

### 6.5 Modo Revanche (Puzzles Errados)

Sistema de repetição espaçada para puzzles que o aluno errou — baseado no conceito do Anki.

- Quando o aluno **erra** um puzzle no Modo Rating ou Categorias, ele vai automaticamente para a fila de **"Puzzles para Revisar"**
- O aluno acessa essa fila a qualquer momento na seção de Puzzles
- Puzzles na fila são apresentados novamente após intervalos crescentes:
  - 1ª revisão: 1 dia depois
  - 2ª revisão: 3 dias depois
  - 3ª revisão: 7 dias depois
  - Se acertar nas 3 revisões: sai da fila permanentemente
  - Se errar em qualquer revisão: volta ao início do ciclo
- **Não altera rating** — é prática de revisão pura
- Interface: badge com contador no menu de Puzzles (ex: "🔄 12 para revisar")
- Resolver puzzles da revanche **conta para missões diárias** de puzzles

### 6.6 Puzzle Rush PvP (v2 — NÃO incluído na v1)

> Documentado para roadmap futuro.

- Player vs Player em tempo real (5 min)
- Tela lado a lado, estilo Guitar Hero
- Sistema de poderes por streak:
  - Flip the Board (inverte o tabuleiro do oponente)
  - Freeze (congela oponente por 3s)
  - Steal Cursor (move o cursor do oponente)
- Requer: WebSockets, matchmaking, sync de estado
- **Dependência:** Supabase Realtime ou infraestrutura WebSocket dedicada

---

## 7. Core Feature: Bots Educacionais

### 7.1 Estrutura

- **20 bots progressivos** (v1 lança com **10 bots**, restante na v1.5)
- Engine: **Stockfish WASM** rodando no navegador
- Cada bot = Stockfish com Skill Level e Depth limitados

### 7.2 Tabela de Bots (v1: Bots 1–10)

| # | Nome | Personalidade | Elo Aprox. | Stockfish Skill | Stockfish Depth |
|---|---|---|---|---|---|
| 1 | Peãozinho | Distraído, erra muito, encoraja o aluno | ~250 | 0 | 1 |
| 2 | Torrinha | Tímido, joga devagar, comenta lances | ~400 | 1 | 2 |
| 3 | Cavalinho | Brincalhão, adora garfos | ~550 | 3 | 3 |
| 4 | Bispo Sábio | Calmo, filosófico, dá dicas | ~700 | 5 | 4 |
| 5 | Rainha Valente | Corajosa, joga agressivamente | ~900 | 7 | 5 |
| 6 | Guardião | Defensivo, posicional | ~1100 | 9 | 6 |
| 7 | Estrategista | Frio, calculista | ~1300 | 11 | 7 |
| 8 | Mestre da Torre | Especialista em finais | ~1500 | 13 | 8 |
| 9 | General Sombrio | Intimidador, pressiona | ~1700 | 15 | 9 |
| 10 | Arquimago | Misterioso, joga quase perfeito | ~1900 | 17 | 10 |

> Bots 11–20 (v1.5): seguem a progressão até ~2800, cobrindo nível de mestre.

Cada bot terá:
- **Avatar visual próprio** (arte dedicada, não usa o sistema de avatar do aluno)
- **Frases de personalidade** (pré-jogo, durante o jogo, pós-vitória/derrota)
- **Desbloqueio progressivo**: cada bot é desbloqueado ao derrotar o anterior

---

## 8. Sistema de Gamificação

### 8.1 XP e Níveis

**Metas de tempo (referência para calibração):**

| Perfil do aluno | XP/dia estimado | Nível 25 em | Nível 50 em | Nível 100 em |
|---|---|---|---|---|
| Casual (2-3 missões/dia) | ~150 XP | ~2 meses | ~6 meses | Improvável |
| Dedicado (5 missões/dia) | ~300 XP | ~1 mês | ~4 meses | ~2 anos |
| Hardcore (5 missões + conquistas) | ~450 XP | ~3 semanas | ~3 meses | ~18 meses |

**Parâmetros do sistema:**

| Parâmetro | Valor |
|---|---|
| Total de níveis | **100** |
| XP do nível 1→2 | 100 XP |
| Crescimento | **Exponencial moderado** — cada nível exige ~5% mais XP que o anterior |
| XP do nível 10 | ~155 XP |
| XP do nível 25 | ~323 XP |
| XP do nível 50 | ~1.047 XP |
| XP do nível 75 | ~3.397 XP |
| XP do nível 99→100 | ~10.920 XP |
| XP total acumulado para nível 50 | ~18.700 XP |
| XP total acumulado para nível 100 | ~210.500 XP |

**Fórmula de XP por nível:**
```
XP_necessário(n) = arredondamento(100 × 1.05^(n-1))
```

> Com crescimento de 5%, os primeiros ~15 níveis são rápidos (1-2 semanas para aluno ativo), gerando baús e engajamento inicial. A partir do nível 40+ o progresso exige dedicação consistente. Nível 100 é um troféu de longo prazo (~18-24 meses para aluno hardcore).

**Fontes de XP (EXCLUSIVAMENTE):**
- Missões diárias concluídas
- Recompensas de missões únicas (conquistas)

> Puzzles, aulas e bots **não dão XP diretamente** — apenas através de missões que os incluem.

### 8.2 Streak de Dias Consecutivos

Contador visível no dashboard de quantos dias seguidos o aluno entrou e completou pelo menos 1 missão diária.

| Parâmetro | Valor |
|---|---|
| Condição para manter streak | Completar pelo menos 1 missão diária no dia |
| Reset | Perde o streak se passar 1 dia sem completar nenhuma missão |
| Exibição | Ícone 🔥 + número no dashboard e perfil público |

**Bônus por milestones de streak:**

| Streak | Recompensa |
|---|---|
| 7 dias | +50 XP bônus |
| 14 dias | +100 XP bônus + item raro |
| 30 dias | +200 XP bônus + item épico |
| 60 dias | +400 XP bônus + pet exclusivo |
| 100 dias | +1000 XP bônus + item lendário exclusivo |

> O streak é um dos mecanismos mais poderosos de retenção. Aparece visível no dashboard e no perfil público do aluno.

### 8.3 Missões Diárias

- **5 missões por dia**, sorteadas de um pool de ~20 missões possíveis
- Nunca repetem no mesmo dia; podem repetir entre dias diferentes
- Resetam à meia-noite (horário de Brasília)
- **Ao completar todas as 5 → ganha 1 baú**

**Pool de Missões Diárias (exemplos):**

| Missão | XP |
|---|---|
| Resolva 5 puzzles no Modo Rating | 50 XP |
| Resolva 10 puzzles no Modo Rating | 80 XP |
| Complete 1 aula | 60 XP |
| Derrote 1 bot | 70 XP |

> **Anti-farming:** Missões diárias que envolvem bots exigem que o aluno derrote um bot **compatível com seu nível atual ou acima** (ex: se já derrotou até o Bot 5, a missão exige Bot 5+). Isso impede que o aluno repita o Bot 1 infinitamente para farming de XP.

| Acerte 3 puzzles seguidos (streak) | 50 XP |
| Faça 1 Puzzle Rush | 60 XP |
| Resolva 5 puzzles de uma categoria | 50 XP |
| Alcance 5 acertos no Puzzle Rush | 80 XP |
| Jogue 10 minutos no total | 40 XP |
| Resolva 1 puzzle de mate em 2 | 50 XP |

### 8.4 Missões Únicas (Conquistas)

Conquistas permanentes que dão XP e/ou itens exclusivos. Cada uma é completada apenas 1 vez.

**Exemplos:**

| Conquista | Recompensa |
|---|---|
| Derrote seu primeiro bot | 100 XP + item comum |
| Derrote 5 bots diferentes | 300 XP + item raro |
| Derrote todos os 10 bots | 1000 XP + item lendário exclusivo |
| Resolva 100 puzzles | 200 XP |
| Resolva 500 puzzles | 500 XP + item épico |
| Alcance rating 800 em puzzles | 200 XP + item raro |
| Alcance rating 1200 em puzzles | 500 XP + item épico |
| Complete 10 aulas | 300 XP |
| Complete todas as 30 aulas (v1) | 1000 XP + item lendário |
| Streak de 10 no Modo Rating | 200 XP + item raro |
| Puzzle Rush: 15+ acertos | 300 XP + item épico |
| Alcance nível 10 | 100 XP + baú |
| Alcance nível 50 | 500 XP + item lendário |
| Alcance streak de 7 dias | 200 XP + item raro (via sistema de streak, seção 8.2) |
| Alcance streak de 30 dias | 500 XP + item épico + pet exclusivo (via sistema de streak, seção 8.2) |

### 8.5 Títulos e Patentes Visíveis

Além do nível numérico, o aluno recebe um **título/patente** baseado na trilha de aulas que completou. O título aparece no perfil público, no ranking e ao lado do nome em murais.

| Trilha Concluída | Título/Patente |
|---|---|
| Nenhuma (início) | Aprendiz |
| Recruta (aulas 1–15) | Soldado |
| Soldado (aulas 16–30) | Aspirante |
| Aspirante (aulas 31–45) | Capitão |
| Capitão (aulas 46–60) | Comandante |
| Comandante (aulas 61–75) | General |
| General (aulas 76–90) | Grão-Mestre |
| Mestre (aulas 91–100) | Lenda |

> O título dá mais significado ao progresso do que só um número. "General João" é mais impactante que "Nível 47".

### 8.6 Baú de Boas-Vindas

- Ao criar a conta, o aluno recebe **1 baú imediato** antes de fazer qualquer atividade
- Garante que o aluno conheça o sistema de recompensas e avatar logo na primeira experiência
- O baú de boas-vindas segue o mesmo drop rate dos baús normais

---

## 9. Sistema de Baús e Itens

### 9.1 Baús

- **Tipo único** de baú (sem variação de raridade do baú em si)
- Abre direto, sem chave
- **Fontes de baú:**
  - Completar as 5 missões diárias → 1 baú
  - **Passar de nível** → 1 baú (a cada nível alcançado)
  - Recompensa de missões únicas específicas
- Para evitar farming rápido de baús via level-up, a curva de XP exponencial garante que os primeiros níveis vêm rápido (engajamento inicial), mas a partir do nível ~15-20 o ritmo desacelera significativamente

### 9.2 Drop Rate do Baú

| Raridade | Chance | Cor visual |
|---|---|---|
| **Comum** | 45% | ⚪ Cinza/Branco |
| **Raro** | 30% | 🔵 Azul |
| **Épico** | 18% | 🟣 Roxo |
| **Lendário** | 7% | 🟡 Dourado |

> Cada baú dropa **1 item**. A raridade é determinada pelo roll acima.

### 9.3 Categorias de Itens Vestíveis

| Slot | Exemplos |
|---|---|
| **Acessório de Cabeça** | Chapéus, coroas, elmos, óculos, bandanas |
| **Roupa** (corpo completo) | Túnicas, armaduras, vestes de mago, uniformes |
| **Acessório de Mão** | Espada-peão, cetro de rainha, escudo de torre |
| **Fundo/Cenário** | Castelo, floresta, tabuleiro gigante, céu estrelado |
| **Moldura de Perfil** | Molduras temáticas (bronze, prata, ouro, diamante) |
| **Pet** | Companheiros ao lado do avatar (ver seção 9.4) |

### 9.4 Pets (sistema especial)

Pets ficam ao lado do avatar e são **100% cosméticos** na v1 (sem bônus mecânicos).

| Pet | Raridade | Descrição |
|---|---|---|
| Peãozinho de Madeira | Comum | Peão simpático que segue o aluno |
| Cavalo de Bronze | Raro | Cavalo em miniatura que galopa ao lado |
| Coruja Sábia | Raro | Coruja com óculos que pousa no ombro |
| Dragão de Cristal | Épico | Pequeno dragão translúcido que voa ao redor |
| Fênix Dourada | Épico | Fênix brilhante com trilha de faíscas |
| Rei Espectral | Lendário | Fantasma de rei com coroa flutuante |
| Grifo Ancestral | Lendário | Grifo majestoso com armadura dourada |

> Aluno pode equipar apenas **1 pet por vez**. Pets são obtidos em baús ou como recompensas de conquistas específicas.
>
> **Decisão de design:** Pets não concedem bônus de XP nem alteram drop rates na v1. Isso evita efeito "bola de neve" onde quem tem sorte cedo progride injustamente mais rápido. Bônus mecânicos podem ser avaliados em versões futuras com caps e balanceamento adequado.

### 9.5 Inventário

- Todos os itens ganhos ficam no inventário permanente do aluno
- Tela de inventário com avatar exibido ao lado para customização em tempo real
- Filtros por: slot (cabeça, roupa, etc.) e raridade
- **Não existe loja, moedas ou compra** — tudo é ganho por gameplay

---

## 10. Avatar do Aluno

- Estilo: **boneco fofo/chibi** (referência: Chess Universe)
- Cada aluno começa com avatar base (sem itens)
- Customização por equipamento nos 6 slots (cabeça, roupa, mão, fundo, moldura, pet)
- Avatar é exibido em: perfil, ranking/turma, tela pré-jogo contra bots

---

## 11. Sound Design (Feedback Sonoro)

Feedback sonoro é essencial para a gamificação. Cada ação importante do aluno deve ter um som satisfatório e distinto.

### 11.1 Sons do Sistema

| Contexto | Evento | Estilo do Som |
|---|---|---|
| **Puzzles** | Acerto | Som curto e satisfatório (tipo "ding" positivo) |
| **Puzzles** | Erro | Som suave de falha (não punitivo, leve) |
| **Puzzles** | Streak crescendo (3, 5, 10...) | Som progressivo mais intenso a cada milestone |
| **Puzzle Rush** | Tick do timer (últimos 10s) | Ticking acelerando, cria urgência |
| **Puzzle Rush** | Fim de tempo / Game Over | Som de encerramento dramático |
| **Bots** | Captura de peça | Som de captura (madeira/impacto) |
| **Bots** | Xeque | Som de alerta (tenso) |
| **Bots** | Xeque-mate (vitória) | Som épico de vitória + fanfarra curta |
| **Bots** | Derrota | Som melancólico suave |
| **Gamificação** | Level up | Som grandioso (fanfarra + brilho) |
| **Gamificação** | Baú abrindo | Sequência em 3 fases: (1) som de suspense/antecipação enquanto baú treme, (2) som de abertura com brilho, (3) som final que varia conforme raridade do item revelado (comum=sutil, lendário=épico com fanfarra) |
| **Gamificação** | Item lendário obtido | Som especial diferenciado (mais épico que os outros) |
| **Gamificação** | Missão diária concluída | Som de check/confirmação |
| **Gamificação** | Conquista desbloqueada | Som de medalha/troféu |
| **Aulas** | Exercício correto dentro da aula | Som positivo (similar ao puzzle) |
| **Geral** | Clique em botão/navegação | Sem som (apenas ações significativas têm feedback) |

### 11.2 Regras de Áudio

- **Opção de mudo global** nas configurações (respeitando preferência do usuário)
- Sons devem ser **curtos** (0.3s a 1.5s máximo, exceto level up e baú)
- Formato: MP3 ou OGG (leves, compatíveis com todos os browsers)
- Sem música de fundo na v1 (apenas efeitos sonoros pontuais)
- Volume reduzido automaticamente em sequência rápida (ex: Puzzle Rush) para não saturar

---

## 12. Rankings

### 12.1 Ranking Global

Rankings públicos onde todos os alunos da plataforma podem ver e comparar desempenho. Ao clicar em qualquer aluno no ranking, é possível **ver o perfil público** dele (avatar, nível, rating, conquistas).

| Ranking | Critério | Exibição |
|---|---|---|
| **Rating de Puzzles** | Rating Glicko-2 do Modo Rating | Top 50 + posição do aluno |
| **Puzzle Rush (3min)** | Recorde pessoal (maior score) | Top 50 + posição do aluno |
| **Puzzle Rush (5min)** | Recorde pessoal (maior score) | Top 50 + posição do aluno |
| **Nível/XP** | Nível atual (desempate por XP) | Top 50 + posição do aluno |

**Perfil público do aluno (visível no ranking):**
- Avatar completo (com itens equipados e pet)
- Nível e XP
- Rating de puzzles
- Recorde de Puzzle Rush
- Bots derrotados
- Conquistas desbloqueadas (badges)
- Membro desde (data)

### 12.2 Ranking por Turma

Mesmos rankings do global, mas filtrados apenas pelos membros da turma.
- Professor e alunos da turma podem ver
- Incentiva competição saudável dentro do grupo
- Exibido dentro da seção de cada turma

---

## 13. Análise Pós-Partida (contra Bots)

Após cada partida contra um bot, o aluno tem acesso a uma **análise leve** focada nos momentos mais importantes da partida.

> **Escopo v1 (Review Leve):** Análise focada nos top 3 blunders/erros + melhor lance de cada, com accuracy geral. Análise completa lance-a-lance (estilo Chess.com) fica para v1.5.

### 13.1 Avaliação da Partida (v1)

| Elemento | Descrição |
|---|---|
| **Resumo de accuracy** | % de precisão geral do aluno na partida |
| **Top 3 piores lances** | Os 3 maiores erros/blunders do aluno, com o melhor lance sugerido para cada |
| **Melhor lance da partida** | O lance mais preciso do aluno (se houve algum brilhante/ótimo) |
| **Contagem por tipo** | Total de cada categoria: brilhante, ótimo/bom, imprecisão, erro, blunder |

### 13.2 Funcionamento Técnico

- Análise feita por **Stockfish WASM** no navegador do aluno (mesma engine dos bots)
- Após a partida, **os lances dos dois lados** são analisados com depth 14 — uma busca por *posição*, não por lance (a avaliação depois do lance i é a de antes do lance i+1). Só o candidato a Brilhante custa uma busca extra, em depth 16
- O aluno pode ver os 3 piores lances no tabuleiro, com seta mostrando o lance ideal
- A análise é gerada **automaticamente** ao fim da partida (com opção de pular)

### 13.3 Classificação dos Lances

O modelo é próprio do Recruta 64, montado de três partes com procedência distinta.
**Não prometemos equivalência com o CAPS do chess.com** — o CAPS é proprietário e
depende do rating do jogador. Prometemos o mesmo espírito: Brilhante raro e
precisão que pune blunder.

**Precisão** — porte do algoritmo aberto do Lichess (`AccuracyPercent.scala` do lila
e `eval.scala` do scalachess). A avaliação em centipeões vira probabilidade de
vitória por uma sigmoide com teto em ±1000cp (mate lê 97,5%, nunca 100%); cada
lance recebe uma nota pela curva exponencial deles; a nota da partida é a **média
entre uma média ponderada pela volatilidade da posição e uma média harmônica** —
é a harmônica que faz um único blunder derrubar o número, coisa que a média
aritmética antiga não fazia.

**Categorias** — as faixas públicas de *expected points* do chess.com, medidas em
perda de probabilidade de vitória (não em peões):

| Tipo | Critério | Equivale a, de posição igual | Ícone |
|---|---|---|---|
| Brilhante | Sacrifício real + melhor lance confirmado + posição disputada | — | 💎 |
| Ótimo/Bom | Melhor lance, ou perda até 5pp | até ~55cp | 🟢 |
| **Livro** | **Ainda dentro da teoria de abertura** | **—** | 📖 |
| Imprecisão | Perda de 5 a 10pp | ~55 a 110cp | 🟡 |
| Erro | Perda de 10 a 20pp | ~110 a 230cp | 🔴 |
| Blunder | Perda acima de 20pp | acima de ~230cp | ❌ |

**Livro** — procedência, não qualidade, e por isso a única categoria que **sai da
conta da precisão**: o aluno não pensou aquele lance, ele o repetiu. O nome da
abertura aparece no cabeçalho da revisão (família em português + código ECO).

A base é a do `lichess-org/chess-openings` (CC0, ~3.800 linhas nomeadas),
indexada por **aresta** — "a partir desta posição, este lance é teoria?" —, não
por posição resultante. Duas travas impedem que ela vire desculpa, porque é uma
base de *nomenclatura* e nomeia até o Mate do Louco: **Livro nunca vence Erro
Grave**, e o motor continua avaliando toda posição; e uma lista de linhas-piada
vetadas cobre o que fica em nível de Erro e escaparia da primeira trava. Gambito
de verdade não é atingido — o Gambito do Rei custa ~8pp e o Evans ~7pp, longe
dos 20pp de Erro Grave.

Saiu da teoria, o selo **não volta**, mesmo que o jogo retorne a uma posição
conhecida. O **nome** da abertura é independente disso: ele atualiza sempre que
a posição exata bater numa nomeada, inclusive por transposição depois do desvio.

**Canal de material** — a sigmoide satura além de ±1000cp: com a posição já
decidida, pendurar mais uma peça perde ~0pp e leria "Bom". Por isso todo lance
também é julgado pela perda bruta em centipeões, em três regimes: quem segue
ganhando folgado (≥ 90%) tem folga de conversão (só perda ≥ 900cp vira
Imprecisão — é onde cai o mate perdido); quem já estava perdido (≤ 10%) leva
**Erro** por peça pendurada (≥ 250cp), nunca Erro Grave — o mesmo "?" que o
chess.com dá nesses lances; no meio, 150/300/900cp valem
Imprecisão/Erro/Erro Grave. A categoria e a precisão do lance ficam com o pior
dos dois canais. Lance forçado (1 legal) é isento.

**Brilhante** — regra conservadora nossa, com todos estes gates ao mesmo tempo:
sacrifício de material de fato (troca calculada na casa de destino, saldo ≥ 2
peões — peça defendida em casa atacada **não** conta), lance exatamente igual ao
do motor **e reconfirmado em profundidade 16**, fora da abertura, posição
disputada antes (25%–75%) e ainda saudável depois.

### 13.4 Tela de Resumo Pós-Partida

```
┌─────────────────────────────────────┐
│  Resultado: Vitória! vs Cavalinho   │
│                                     │
│  Precisão: 78.4%                    │
│  ──────────────────────────────     │
│  💎 Brilhante: 1                    │
│  🟢 Ótimo/Bom: 18                  │
│  🟡 Imprecisões: 4                 │
│  🔴 Erros: 2                       │
│  ❌ Blunders: 1                     │
│                                     │
│  ⚠️ Seus 3 piores momentos:        │
│  [Lance 12] [Lance 24] [Lance 31]  │
│                                     │
│  [🔄 Jogar novamente]              │
│  [➡️ Próximo bot]                   │
└─────────────────────────────────────┘
```

### 13.5 Análise Completa (v1.5)

> Na v1.5, expandir para análise completa lance-a-lance: barra de eval contínua, navegação por todos os lances, melhor lance sugerido para cada posição, depth ~18. Requer otimização de performance para mobile.

---

## 14. Seção do Professor

### 14.1 Funcionalidades do Professor

O professor tem **acesso completo a tudo do aluno** + seção exclusiva **Turmas**.

### 14.2 Turmas

- Professor cria turmas com nome (ex: "Turma Sábado Manhã")
- Alunos entram por **código de convite** (gerado pelo professor)
- Professor pode remover alunos da turma

### 14.3 Tarefas

O professor atribui tarefas que apontam para atividades já existentes no site:

| Tipo de Tarefa | Exemplo |
|---|---|
| Completar aula | "Complete a aula 12 — Garfo de Cavalo" |
| Resolver puzzles por tema | "Resolva 10 puzzles de Cravada" |
| Resolver puzzles por quantidade | "Resolva 20 puzzles no Modo Rating" |
| Derrotar bot | "Derrote o Bot Cavalinho" |
| Puzzle Rush | "Faça 1 Puzzle Rush de 3 minutos" |

- Cada tarefa tem **prazo** definido pelo professor
- Aluno vê as tarefas pendentes em uma seção dedicada no seu painel
- Professor vê relatório: quem completou, quem não, desempenho

### 14.4 Mural da Turma (Feed Social)

Feed de atividades dentro de cada turma, mostrando conquistas dos colegas em tempo real. Gera competição saudável sem precisar de chat (evita necessidade de moderação).

**Eventos exibidos no mural:**

| Evento | Exemplo |
|---|---|
| Bot derrotado | "🤖 João derrotou o Estrategista!" |
| Rating milestone | "📈 Maria alcançou rating 1000 em puzzles!" |
| Nível alcançado | "⭐ Pedro subiu para o nível 15!" |
| Título conquistado | "🎖️ Ana se tornou Aspirante!" |
| Streak milestone | "🔥 Lucas está com streak de 14 dias!" |
| Puzzle Rush recorde | "⚡ Carla fez 18 pontos no Puzzle Rush!" |
| Conquista desbloqueada | "🏆 Bruno completou todas as aulas da trilha Recruta!" |

- Visível para todos os membros da turma (alunos e professor)
- Feed cronológico (mais recente primeiro)
- Sem comentários ou interação direta (apenas visualização)
- Limitado aos últimos 50 eventos para performance

### 14.5 Relatório de Progresso

O professor visualiza por aluno e por turma:

- Nível e XP atual
- Rating de puzzles
- Aulas concluídas
- Bots derrotados
- Tarefas pendentes/concluídas
- Frequência de acesso (dias ativos na semana)

---

## 15. Estrutura de Telas (Mapa do Site)

```
/ (Landing / Login)
├── /dashboard (Painel do aluno)
│   ├── Resumo: nível, XP, rating, streak, missões do dia
│   ├── Atalhos rápidos: continuar aula, puzzle rápido
│   └── Tarefas pendentes (se atribuídas pelo professor)
│
├── /aulas
│   ├── Mapa de trilhas (Recruta → Mestre)
│   └── /aulas/[id] (aula individual interativa)
│
├── /puzzles
│   ├── /puzzles/rating (Modo Rating)
│   ├── /puzzles/categorias (Treino por tema)
│   │   └── /puzzles/categorias/[tema] (puzzles do tema)
│   ├── /puzzles/rush (Puzzle Rush solo)
│   └── /puzzles/revanche (Fila de puzzles errados para revisar)
│
├── /bots
│   ├── Seleção de bots (cards com avatar + nome + elo)
│   ├── /bots/[id] (partida contra o bot)
│   └── /bots/[id]/analise (análise pós-partida)
│
├── /ranking
│   ├── /ranking/rating (Ranking de Rating de Puzzles)
│   ├── /ranking/rush-3min (Ranking Puzzle Rush 3min)
│   ├── /ranking/rush-5min (Ranking Puzzle Rush 5min)
│   └── /ranking/nivel (Ranking por Nível/XP)
│
├── /perfil
│   ├── Avatar + equipamento
│   ├── Inventário
│   ├── Estatísticas
│   └── Conquistas
│
├── /perfil/[user_id] (perfil público de outro aluno)
│
├── /turmas (somente Professor e alunos membros)
│   ├── Lista de turmas
│   ├── /turmas/[id] (detalhes, alunos, relatório, ranking da turma)
│   ├── /turmas/[id]/mural (feed social de conquistas)
│   └── /turmas/[id]/tarefas (criar/gerenciar tarefas — professor)
│
└── /auth
    ├── /login
    └── /registro
```

---

## 16. Modelo de Dados (Simplificado)

### Tabelas principais no Supabase:

```
users
  - id, email, name, role (aluno|professor), avatar_config,
    xp, level, puzzle_rating, puzzle_rd, puzzle_volatility,
    created_at

puzzles
  - id, fen, moves, rating, themes[], rating_deviation

user_puzzle_attempts
  - user_id, puzzle_id, solved, rating_before, rating_after, attempted_at

lessons
  - id, title, trail, order, content_json

user_lesson_progress
  - user_id, lesson_id, completed, completed_at

bots
  - id, name, personality, elo, skill_level, depth, avatar_url, phrases_json

user_bot_results
  - user_id, bot_id, result (win|loss|draw), played_at

bot_game_analysis
  - id, user_id, bot_id, pgn, moves_analysis_json,
    accuracy_percent, brilliant, great, good, inaccuracy,
    mistake, blunder, analyzed_at

daily_missions
  - id, user_id, date, missions_json[], completed_count, chest_claimed

achievements
  - id, title, description, condition, reward_xp, reward_item_id

user_achievements
  - user_id, achievement_id, unlocked_at

items
  - id, name, slot (head|outfit|hand|background|frame|pet),
    rarity (common|rare|epic|legendary), image_url

user_inventory
  - user_id, item_id, obtained_at, source (chest|achievement|level_up)

user_equipped
  - user_id, slot, item_id

user_streaks
  - user_id, current_streak, longest_streak, last_active_date

user_titles
  - user_id, current_title, highest_trail_completed

puzzle_revanche_queue
  - user_id, puzzle_id, added_at, next_review_at,
    review_count, last_reviewed_at

class_feed (mural da turma)
  - id, class_id, user_id, event_type, event_data_json, created_at

classes (turmas)
  - id, teacher_id, name, invite_code, created_at

class_members
  - class_id, user_id, joined_at

class_tasks
  - id, class_id, teacher_id, type, config_json, deadline, created_at

user_task_progress
  - user_id, task_id, completed, completed_at

puzzle_rush_runs
  - id, user_id, mode (3min|5min), score, best_streak,
    avg_time_per_puzzle, played_at

user_public_profiles (view materializada para rankings)
  - user_id, name, avatar_config, level, xp,
    puzzle_rating, rush_3min_record, rush_5min_record
```

---

## 17. PWA (Progressive Web App)

O site será configurado como PWA, permitindo que alunos "instalem" no celular como um app nativo.

| Recurso PWA | Descrição |
|---|---|
| **Instalável** | Ícone na home screen do celular, abre sem barra do navegador |
| **Manifest** | Nome "Recruta 64", ícone do clube, tema de cores do site |
| **Service Worker** | Cache de assets estáticos (CSS, JS, imagens, fontes, sons) |
| **Splash screen** | Tela de carregamento com logo do clube |

**Benefícios:**
- Sensação de app nativo sem precisar publicar na App Store/Play Store
- Carregamento mais rápido após primeira visita (assets em cache)
- Custo de implementação baixo com Next.js (guia oficial de PWA do Next.js, sem dependência de next-pwa)

> **Decisão de design:** Modo offline para puzzles com sincronização foi removido da v1. Além de adicionar complexidade significativa, o sync offline é vetor de trapaça (aluno poderia manipular resultados localmente). Todas as funcionalidades requerem conexão ativa. Modo offline pode ser avaliado em versões futuras com validação server-side robusta.

---

## 18. Privacidade e Proteção de Menores (LGPD)

Como o clube atende crianças e adolescentes, o site deve respeitar a LGPD e proteger dados de menores.

### 18.1 Perfil Público — Privacidade por Padrão

| Configuração | Padrão | Pode alterar? |
|---|---|---|
| Nome exibido publicamente | **Primeiro nome + inicial do sobrenome** (ex: "João S.") | Sim, pode usar apelido |
| Visibilidade no ranking | **Ativada** por padrão | Sim, pode fazer **opt-out** (sai do ranking público, mas continua visível para professor e turma) |
| Perfil público | Mostra: avatar, nível, título, conquistas | Não mostra: email, nome completo, idade |
| Dados visíveis pelo professor | Tudo: nome completo, progresso, frequência, stats | — |
| Dados visíveis por outros alunos | Apenas perfil público (nome parcial, avatar, stats) | — |

### 18.2 Regras de Dados

- Nenhum dado pessoal (email, nome completo) é exposto publicamente
- Professor vê dados completos apenas dos alunos de suas turmas
- Dados de menores tratados com proteção extra conforme LGPD Art. 14
- Consentimento: ao cadastrar, aluno (ou responsável, se menor) aceita termos de uso com linguagem clara
- Dados podem ser excluídos a pedido (direito ao esquecimento)

### 18.3 Definições Técnicas de Conclusão

Para evitar ambiguidade na implementação e na validação server-side:

| Ação | Definição técnica de "concluído" |
|---|---|
| **Aula concluída** | Todos os exercícios integrados (3-5) respondidos corretamente. Se errar, pode tentar novamente. Aula só é marcada como concluída quando todos os steps são validados pelo servidor. |
| **Puzzle resolvido (acerto)** | Toda a sequência de lances correta enviada ao servidor. Acertar apenas o primeiro lance não conta — precisa completar a linha inteira. |
| **Puzzle errado** | Qualquer lance incorreto na sequência. O puzzle é marcado como errado e vai para a fila de revanche (se Rating/Categorias). |
| **Bot derrotado** | Partida completa (não abandonada) com resultado de vitória. Empate não conta como derrota do bot. PGN da partida é salvo para análise. |
| **Missão diária concluída** | Condição específica da missão verificada pelo servidor via eventos (ex: 5× evento `puzzle_solved` no dia = missão "Resolva 5 puzzles" concluída). |

---

## 19. Escopo de Lançamento

### v1.0 (MVP)

| Feature | Escopo |
|---|---|
| Aulas Globais | 30 de 100 (trilhas Recruta, Soldado, Aspirante) |
| Puzzles — Rating Mode | Completo (Glicko-2, anti-repetição, skip) |
| Puzzles — Categorias | Completo (20 temas, filtro de dificuldade) |
| Puzzles — Rush Solo | Completo (3min/5min, preload, scoreboard) |
| Puzzles — Revanche | Completo (fila de errados, repetição espaçada) |
| Bots | 10 de 20 (até ~1900 Elo) |
| Análise Pós-Partida | Review leve (top 3 blunders + accuracy + melhor lance) |
| Gamificação | Completa (XP com curva 5%, 100 níveis, missões, baús por missão + level-up + boas-vindas, streak de dias, títulos/patentes) |
| Avatar + Inventário | Completo (6 slots, pets cosméticos) |
| Rankings | Global + por turma (rating, rush, nível) |
| Perfis Públicos | Visível via ranking (avatar, stats, conquistas) |
| Mural da Turma | Feed social de conquistas dentro da turma |
| Auth | Email/senha + Google |
| Professor — Turmas | Completo (criar, gerenciar, tarefas, relatório, ranking, mural) |
| PWA | Instalável, cache de assets (guia oficial Next.js) |
| Sound Design | Efeitos sonoros para puzzles, bots, gamificação (com opção mudo) |
| Integridade | Servidor como autoridade, validação server-side, anti-trapaça |
| Privacidade/LGPD | Nome parcial por padrão, opt-out de ranking, proteção de menores |
| Admin | Via Supabase direto |

### v1.5

| Feature | Escopo |
|---|---|
| Análise Pós-Partida Completa | Lance-a-lance, barra de eval, depth ~18 |
| Pets com poderes | Bônus de XP e drop rate (com caps e balanceamento) |
| Bots 11–20 | Progressão até ~2800 |
| Aulas 31–60 | Trilhas Capitão e Comandante |
| Mais conquistas e itens | Expansão do pool |

### v2.0

| Feature | Escopo |
|---|---|
| Puzzle Rush PvP | Real-time, poderes, matchmaking |
| Aulas 61–100 | Trilhas General e Mestre |
| Sistema de amigos | Adicionar amigos, ver perfil, comparar stats |
| Painel Admin dedicado | Interface web para gestão |

---

## 20. Métricas de Sucesso

| Métrica | Alvo |
|---|---|
| Alunos ativos semanais | 70%+ dos matriculados |
| Missões diárias completas | Média de 3+ por aluno/dia |
| Retenção semanal | 60%+ retorna na semana seguinte |
| Aulas concluídas/mês | Média de 4+ por aluno |
| Satisfação do professor | Relatórios úteis, tarefas funcionando |

---

## 21. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Stockfish WASM pesado em mobile antigo | Testar em dispositivos low-end; fallback para depths menores |
| 50k puzzles = banco pesado | Índices otimizados no Supabase; queries paginadas |
| Gamificação pode distrair do aprendizado | Missões sempre ligadas a atividades educacionais |
| Aluno não volta após novidade inicial | Missões diárias + streak + baús diários criam hábito |
| Puzzle Rush trava por latência | Preload obrigatório de 30+ puzzles em batch |
| Análise pós-partida lenta em mobile | v1 usa review leve (depth ~12, apenas top 3 blunders); análise completa na v1.5 |
| Trapaça / manipulação de dados | Servidor como autoridade (seção 4); client nunca concede recompensa |
| Privacidade de menores | Nome parcial por padrão, opt-out de ranking, LGPD Art. 14 |
| Criação de 100 aulas = muito conteúdo | Lançar com 30; crescer organicamente |
| Assets de avatar = muito trabalho artístico | Começar com ~50 itens (10 por slot); expandir por versão |

---

> **Próximo passo:** Com esta visão aprovada, iniciar o desenvolvimento pelo setup do projeto (Next.js + Supabase + Auth) e estrutura do banco de dados.
