# Plano Técnico dos Formatos — Trilha 1 · v1

> Aprovado em 2026-08-04. **Revisão 2 em 2026-08-04**, após parecer externo
> adversarial (13 pontos) — o que mudou e o que foi rejeitado está na §11.
> **Revisão 3 em 2026-08-04**, após revisão interna com verificação claim a
> claim contra o repositório e o currículo — o que mudou está na §12.
> Este é o documento que o currículo
> (`01-curriculo-definitivo-v1.md`, §13) declara não existir: o desenho técnico
> dos formatos pedagógicos da Trilha 1. **Conteúdo pedagógico é do currículo —
> onde este doc citar dose, ordem ou critério de aula, a fonte é a §6 de lá.
> Mecanismo é deste doc** — e onde o currículo assumiu algo do código que a
> medição desmentiu (a esteira de PGN, §3.2), este doc registra a correção.
>
> **Este documento é plano, não execução.** Nenhum bloco da §7 começa sem o
> Doug abrir a tarefa. A base de tudo aqui foi medida no repositório em
> 2026-08-04 (branch `avatar/estilo-kokeshi`), não estimada.

---

# 0. O que este documento é — e o que não é

**É:** o desenho dos 7 formatos da T1 (lição interativa, prática contra o
motor, quiz, mini-jogo, bloco de puzzles, bloco de revisão espaçada, duelo com
missão), mais o Desafio Final novo, a camada transversal de competência, o mapa
tema×faixa dos blocos de banco, o gate do lastro (`verify:curriculo-banco`), as
seis decisões de execução e os oito blocos de trabalho com gate e critério de
observação em piloto.

**Não é:** nada de T2–T7 (os formatos exclusivos delas estão adiados na §9,
com todas as letras), nada de gamificação nova (streak, missões diárias, baús e
ranking seguem congelados até haver dado de aluno real — decisão de
2026-08-04), nada de avatar.

**Piloto:** Clube de Xadrez Guabiruba e Colégio São Luiz, uma ou duas turmas,
alunos reais de 6 a 14 anos, celulares simples. O piloto não é a última etapa —
ele acontece **três vezes**, uma ao fim de cada onda de construção (§6, D4).

Vocabulário mínimo, explicado uma vez: **RPC** é uma função que roda dentro do
banco de dados — o aplicativo a chama, ela valida e decide (é assim que a regra
"o servidor decide" é cumprida hoje). **FEN** é um texto curto que descreve uma
posição de xadrez. **PGN** é o texto com a lista de lances de uma partida
inteira. **Seed** é a carga inicial de dados no banco. **`content_json`** é o
miolo da aula, guardado como texto estruturado dentro do banco.

---

# 1. O que existe e o que falta

Medido no código em 2026-08-04:

| Formato do currículo | O que já existe e será reaproveitado | O que falta construir |
|---|---|---|
| Texto, demo, exercício de 1 lance | **Tudo** — player (`LessonViewer`), tabuleiro (`LessonBoard`), validação server-side (`complete_lesson_step`), progresso (`user_lesson_progress`) | nada |
| Lição interativa | player, tabuleiro, RPC de passo como molde | o tipo de seção, a resposta roteirizada do adversário, a RPC irmã |
| Prática contra o motor | Stockfish no browser (`StockfishEngine.ts`, presets de força dos bots), tabuleiro | o tipo de seção, o avaliador de objetivo (D6), a tela de objetivo/orçamento |
| Quiz | painel de texto, RPC de passo como molde | o tipo de seção, a RPC irmã |
| Mini-jogo | tabuleiro, chess.js, registro de tentativa como padrão | o motor comum, as regras por jogo, a revalidação (§4) |
| Bloco de puzzles na aula | banco de ~50 mil puzzles com tema e rating indexados (dois índices separados — GIN de temas + btree de rating; composto não existe, e a contagem exata não tem gate), esteira `puzzle_attempt`, `PuzzleBoard` | o tipo de seção, o sorteio server-side por tema×faixa, o vínculo tentativa↔aula |
| Bloco de revisão espaçada | fila de revanche (`puzzle_revanche_queue` + `get_revanche_due`), régua imediato→1d→3d | a régua 1→3→7, a fila por bloco, os nós na trilha, "volte amanhã" |
| Duelo com missão | esteira de bots (`bot_result`, `BotGameClient`), Léo seedado (`slug='leo'`, elo 250), mural (`emit_class_feed`) | o avaliador de missão (D6), o painel de critérios, o feedback do lance 10 |
| Desafio Final | prova de trilha (`submit_review_gate`), tela (`ReviewGate`) | blueprint de 12 itens, corte 10/12, competências críticas, treino corretivo, histórico |
| Camada de competência | **nada** — o conceito não existe no código (medido: zero ocorrências) | tudo, uma vez só (§2) |

**O princípio de recompensa, honrado por construção:** nenhum formato novo cria
caminho novo de XP, baú ou missão diária. Concluir aula já não dá XP direto
(medido: a RPC devolve `xp_gained: 0`; o XP vem das missões diárias
`complete_1_lesson`/`complete_2_lessons`, que continuam funcionando sem mexer).
Os formatos novos escrevem **progresso** e **evento de competência** — a
gamificação congelada nem é tocada.

---

# 2. A camada de competência — transversal, uma vez só

**Não é um oitavo formato.** É a camada que atravessa os sete: cada formato,
ao validar uma tentativa, registra qual competência o aluno demonstrou ou
errou. É deste dado — e só dele — que nascem as três respostas que faltam ao
professor.

## 2.1 O catálogo (`competencias`)

Uma tabela pequena, seedada por migration, com uma linha por competência da
T1. A fonte é a coluna **"O aluno sai sabendo"** da §6 do currículo — as
competências nascem das aulas de conteúdo a1–a22 (as arenas a23–a26
**reaplicam** competências anteriores, não criam novas). Campos: chave estável
(ex.: `t1_mate_escada`), trilha, nome curto, descrição.

**A competência é atômica, não é "a competência da aula".** A ligação com a
aula é `aulas_origem` — uma lista de 1..N aulas, não uma coluna única. Isso
existe porque três situações do próprio currículo quebram o vínculo 1:1: as
5 competências críticas nascem de pares de aulas (a8/a9, a8/a10), a arena
mista a26 e o Desafio Final avaliam competências de aulas que não são a que o
aluno está fazendo, e o bloco de revisão mistura itens de origens diferentes.
Se o servidor tivesse de inferir a competência a partir da aula em curso, nesses
três casos ele inferiria errado.

A consequência prática: **cada item avaliável carrega sua própria
`competencia_key`** — declarada na seção do `content_json` (exercício, quiz,
lição interativa, mini-jogo) ou atribuída **no momento do sorteio** (puzzle de
bloco, item de revisão, item do Desafio) e persistida na tentativa junto com o
item. O client nunca informa competência; ele só devolve a resposta do item que
o servidor já sabe qual é.

As **5 competências críticas** do Desafio Final (currículo §5) não são linhas
extras: são marcação `critica = true` sobre as competências correspondentes
(lance legal sob restrição → a7/a8/a9 · sair do xeque pelas três vias → a8 ·
mate × afogamento → a8/a10 · capturar peça sem defensor → a11 · salvar peça
atacada → a12). **O mapeamento por aula é atribuição deste plano** — o
currículo lista as 5 sem apontar aula nenhuma. E uma emenda que a conferência
com o currículo impôs *(rev. 3)*: o texto da crítica 1 cita "peça cravada",
tema que a T1 não ensina (cravada é T2 a5). Na T1, a crítica 1 cobre xeque e
casa atacada; cravada entra na régua quando a T2 existir — **o Desafio não
cobra o que nenhuma aula ensinou**. A lista final, palavra por palavra, é
trabalho de autoria do B0 — a regra está aqui, o texto sai de lá.

## 2.2 Os eventos (`competencia_eventos`)

Cada linha: aluno, competência, contexto (formato + referência — qual aula,
qual bloco, qual duelo), acerto ou erro, `tema_visivel`, data. **Quem escreve é
o servidor**, dentro das mesmas RPCs que já validam a tentativa — o client
nunca marca competência. Isso custa um INSERT dentro de funções que já existem,
não uma superfície nova.

**`tema_visivel` é derivado pelo servidor a partir do contexto**, nunca
enviado: bloco de puzzles da aula do tema → verdadeiro; bloco de revisão,
arena mista, Desafio Final → falso; **missão de duelo → falso, por exceção
declarada** *(rev. 3)* — o painel exibe os critérios da missão, mas cumpri-los
ao longo de uma partida inteira contra resistência é aplicação sustentada, não
reconhecimento provocado. A decisão pedagógica é a da §3.7; a exceção mora
aqui para o servidor ter uma regra só. É essa coluna, e não a aula, que separa
*praticada* de *consolidada* na escada da §2.3 — por isso ela não pode vir de
um client que tem interesse em dizer que o tema estava oculto.

## 2.3 A escada de status — derivada da regra escrita no produto

O currículo §4 já define a régua ("concluir uma aula significa demonstrar
compreensão inicial; o domínio é confirmado por prática independente, revisão
espaçada e aplicação posterior em posições misturadas — sem o nome do tema na
tela").
A escada é a tradução direta:

| Status | O que prova | De onde vem o evento |
|---|---|---|
| **vista** | compreensão inicial | concluiu a aula que a ensina |
| **praticada** | executa com o tema visível | acertos no bloco de puzzles da aula, na prática contra o motor, no mini-jogo |
| **consolidada** | executa **sem** o nome do tema na tela | acertos em bloco de revisão, arena mista ou Desafio Final; missão de duelo cumprida (exceção declarada — §2.2) |
| **em dificuldade** | erro recorrente em qualquer degrau | derivado dos erros, pela régua provisória v1 abaixo |

**A régua provisória v1 de "em dificuldade"** — escrita agora, de propósito.
Deixá-la para o B3 seria circular: o B3 entrega o relatório do professor, e o
relatório precisa da régua para existir. Então ela nasce aqui, rotulada como
provisória, e é **recalibrada com dado do piloto 1**, não inventada de novo:

> Uma competência está *em dificuldade* quando o aluno tem **≥ 3 eventos de
> erro** nela **e** a taxa de erro das **últimas 10 tentativas** dessa
> competência é **≥ 50%**. Erro em item com `tema_visivel = false` (revisão,
> arena, Desafio) conta **dobrado** no numerador — errar sem o nome do tema na
> tela é o sinal mais forte que temos.

As duas condições juntas existem para matar os dois falsos positivos óbvios: o
aluno que errou 3 vezes em 40 tentativas (taxa baixa) e o aluno que errou 1 de
2 (amostra ridícula). **Por isso o relatório sempre mostra o denominador** —
"2 de 2" e "2 de 30" nunca aparecem com a mesma cara na tela do professor. O
que o piloto recalibra é o par de números (3 e 50%), não a forma da régua.
Nota de forma *(rev. 3)*: com o dobro no numerador, o quociente pode passar de
100% — leia-o como **peso**, não taxa estrita; a comparação com o corte de 50%
continua bem definida.

## 2.4 As três respostas que faltam ao professor

O relatório por aluno hoje (medido): 6 consultas diretas do client, mostrando
nome/nível/XP/rating, streak, aulas concluídas, bots derrotados, tarefas e
conquistas. Sem nada de puzzle, sem estrelas/erros/dicas por aula (as colunas
existem e não são lidas), sem última atividade. Sobre essa base:

1. **"Qual competência está causando dificuldade?"** — agregado por turma:
   X de Y alunos em dificuldade na competência Z, ordenado do pior.
2. **"O que trabalhar na próxima aula presencial?"** — as 3 piores
   competências da turma, cada uma com o link da aula/bloco que a treina.
   É a mesma consulta da resposta 1, cortada em 3 e com link.
3. **"Quem está pronto para avançar?"** — por aluno: blocos de revisão
   vencidos e feitos + competências críticas demonstradas + estado do
   Desafio Final. (D5: aluno posicionado pelo professor aparece como
   "posicionado", nunca como "demonstrou".)

Entram como **dado primeiro, tela mínima**: uma view/RPC de agregação e uma
seção nova no relatório existente da fase 9 — não um painel novo. De carona no
mesmo mexido: o conserto do bug das Conquistas — medido *(rev. 3)*: o
relatório (`AlunoRelatorioClient.tsx`) pede a coluna `achievement_key`, que
não existe em `user_achievements` (o schema tem `achievement_id`); o erro do
Supabase é engolido e o card mostra sempre "0 conquistas" — e passar a exibir
estrelas/erros/dicas que o banco já guarda.

## 2.5 O contrato de tentativa — o que vale para toda RPC nova

Este documento cria ~8 tabelas e ~6 RPCs. A casa já pratica as regras abaixo
(RLS está ativo em todas as tabelas; `grant_xp` deduplica por
`UNIQUE(user_id, source, source_id)` com `ON CONFLICT DO NOTHING`; o passo de
aula é idempotente) — mas **praticar por costume não é contrato**. Escrito uma
vez aqui, vale para tudo que as §3 e §4 encomendam, e o revisor de cada bloco
cobra por esta lista:

1. **`submission_id` em toda tentativa.** O client gera um UUID por envio e o
   repete no retry. A tabela tem UNIQUE sobre ele; reenvio **devolve o
   resultado já gravado** em vez de conceder de novo. Rede caindo no meio da
   resposta é o caso normal no celular do piloto, não a exceção.
2. **Relógio só do banco** onde o relógio decide concessão. Vencimento de
   revisão e data de tentativa: `now()` do servidor, sempre. É regra inviolável
   da casa, e vale em especial para a régua 1→3→7, onde o relógio do client é
   literalmente o incentivo a burlar. **A exceção declarada é o relógio de
   jogo** *(rev. 3)*: os 5 segundos do *Vale ou Não Vale* correm no client por
   natureza — um round-trip por rodada mataria o jogo. O servidor confere a
   **duração total** da tentativa contra a meta da config e recusa o
   impossível; dentro disso, é o mesmo modelo de confiança já aceito no quiz e
   no exercício (§3.3), com a mesma condição: endurece se aparecer burla.
3. **RLS em toda tabela nova**, com a política de sempre: o aluno lê e escreve
   só o que é dele; o professor lê pela via de turma que já existe.
4. **Escrita direta revogada** nas tabelas de progresso e competência —
   `competencia_eventos`, `revisao_itens`, `revisao_blocos`,
   `minigame_tentativas`, `pratica_motor_attempts`, `duelo_missao_resultados`
   e o histórico do Desafio não aceitam INSERT/UPDATE de `authenticated`.
   Quem escreve são as RPCs `SECURITY DEFINER`.
5. **`search_path` fixado** em toda função nova (`SET search_path = public,
   pg_temp`), como a migration `20260725120000` já fez com as antigas.
6. **Sorteio vira tentativa persistida.** Isto é a generalização do defeito
   medido no `submit_review_gate`, onde o denominador vem do client. Iniciar
   um bloco de puzzles, um bloco de revisão ou o Desafio Final **cria a
   tentativa no servidor com a lista de itens sorteados** (e a
   `competencia_key` de cada um, §2.1). Daí em diante: resposta só é aceita se
   o item pertencer à lista; o denominador sai da lista, nunca do envio;
   recarregar a página **retoma a mesma tentativa** em vez de sortear de novo;
   e um sorteio novo só acontece depois de concluir ou abandonar
   explicitamente a tentativa anterior. Sem isso, "errei 3 de 12" é uma
   afirmação do client.
7. **Seção interativa recomeça no refresh** — e isso é declarado, não
   esquecido: lição interativa e prática contra o motor não guardam estado
   parcial; recarregar volta ao início da seção. Guardar meia-lição é
   complexidade que o piloto não pede.

## 2.6 Critério de aceite da camada

A camada está pronta quando as cinco perguntas da §10 têm resposta no
relatório — as três acima somadas às duas que já funcionam hoje.

---

# 3. Os sete formatos, um a um

Regra comum a todos: cada formato valida por **RPC própria** (irmãs de
`complete_lesson_step`, cuja assinatura só carrega um lance), e todas escrevem
o **mesmo progresso de aula** + o **evento de competência** (§2). Toda RPC
irmã que conclui uma aula herda o rabo obrigatório da atual:
`check_daily_missions()` + `recompute_user_title()`. **Cuidado medido
*(rev. 3)*:** o gate `verify:avatar-db` vigia isso **pelo nome da função** —
ele lê a definição de `complete_lesson_step` e só dela. As RPCs irmãs nascem
fora da vigilância, e "por costume" é exatamente o que este documento não
aceita (§2.5). Por isso o B0.0 encomenda a extensão do gate para uma **lista
de RPCs que concluem aula**, alimentada a cada formato novo.
`total_steps`, que hoje conta só exercícios,
passa a contar **seções avaliáveis** — exercício, quiz, lição interativa,
mini-jogo, bloco de puzzles e **prática contra o motor** (`engine_practice`).
A prática contra o motor faltava nesta lista na v1: implementada ao pé da
letra, as aulas 19–21 nunca chegariam a 100%. E todas obedecem o **contrato de
tentativa da §2.5** — `submission_id`, relógio do banco, RLS, sorteio
persistido.

## 3.1 Lição interativa — aulas 18, 19, 20, 21

- **Problema pedagógico:** hoje o exercício aceita um lance e o adversário não
  responde — por isso não existe uma única aula que ensine *técnica*
  (currículo §5). Mate da escada, dama+rei, torre+rei: tudo que leva mais de
  um lance precisa de um adversário que reaja.
- **O que o aluno vê:** tabuleiro + instrução curta. Ele joga o lance; o
  adversário responde sozinho (resposta roteirizada, animada como no demo
  atual); a linha segue até o fim. Lance errado: "tente de novo" + uma frase
  de explicação, e a posição volta — sem avançar, sem punição além do
  registro.
- **O que o servidor valida:** cada jogada do aluno contra o roteiro
  (RPC irmã: aula, seção, número da jogada, lance). O roteiro fica no
  `content_json`; a resposta é legível no client, como no exercício de hoje —
  risco aceito, a concessão continua sendo só do servidor.
- **Como o dado fica guardado:** no mesmo `user_lesson_progress` (erros e
  dicas somam nas colunas que já existem). Shape da seção nova:
  `{ type: "interactive", fen, side, intro?, outro?, script: [{ expect: [lances aceitos], reply?: lance do adversário, wrong_hint?, note? }] }`.
- **Competência marcada:** a da aula (ex.: `t1_mate_dama_rei`), acerto ao
  concluir a seção; erro a cada jogada errada.
- **Reaproveita:** `LessonViewer`/`LessonBoard` (o auto-play do demo vira a
  resposta do adversário) e o molde da RPC de passo com o rabo de conclusão.
  **Correção de reuso *(rev. 3)*:** a v2 prometia "o utilitário de FEN sem reis
  que o player já tem" — medido, é um `catch` inline dentro do `LessonViewer`,
  não exportado, e a cópia do `ReviewGate` nem o tem; pior, tabuleiro sem reis
  perde os lances legais (chess.js recusa a posição). O mecanismo real da casa
  é `dim_kings` — rei presente, apagado no CSS. A lição interativa usa
  `dim_kings`; extrair o utilitário é trabalho, não herança.

## 3.2 Prática contra o motor — aulas 19, 20, 21 (8 posições)

- **Problema pedagógico:** a lição interativa tem trilho — o adversário joga o
  que o roteiro previu. Técnica só é sua quando funciona contra resistência de
  verdade (currículo §5; modelo: seção *Practice* do lichess).
- **O que o aluno vê:** uma posição dada, o objetivo declarado ("dê mate em
  até 12 lances"), o contador de orçamento, e o Stockfish do outro lado (força
  do campo `engine`). Cumpriu → celebração e próxima posição. Estourou o
  orçamento, afogou ou perdeu → **recomeça a posição, não a aula**.
- **O que o servidor valida:** o PGN da partida, reexecutado pelo **avaliador
  de objetivo** (D6) — a partida foi legal, saiu da posição declarada, e o
  objetivo foi cumprido dentro do orçamento. **Correção ao currículo:** a rev. 4
  diz "a validação é a mesma esteira server-side que já valida o PGN dos
  bots"; medido, `bot_result` confere apenas `length(pgn) ≥ 10` — não há
  replay em lugar nenhum. A esteira aponta para o lugar certo, mas o avaliador
  é construção nova (compartilhada — ver §4, família C).
- **Como o dado fica guardado:** tabela nova `pratica_motor_attempts` (aluno,
  aula, posição, PGN, cumpriu, lances usados, data) — **com histórico**, porque
  "tentou e não conseguiu" é exatamente o que o professor precisa ver.
- **Competência marcada:** a da aula, status *praticada* (o objetivo está
  declarado na tela).
- **Reaproveita:** `StockfishEngine.ts` (`setSkill`/`bestMove`) com os presets
  skill/depth já calibrados — que moram nas **colunas `skill_level`/`depth` da
  tabela `bots`**, não no módulo; a seção traz os seus próprios —
  `LessonBoard`, e o shape de seção:
  `{ type: "engine_practice", positions: [{ fen, side, objective, budget, engine: { skill, depth } }] }`.

## 3.3 Quiz — aulas 13, 17

- **Problema pedagógico:** o tabuleiro ensina *o quê*; o quiz ensina *por quê*
  (currículo §5). Valor das peças e as três regras de ouro são conceitos, não
  lances.
- **O que o aluno vê:** pergunta + 2 a 4 alternativas + diagrama opcional.
  Certo → explicação curta e segue. Errado → a explicação daquela
  alternativa e tenta de novo (o erro fica registrado; aprender é o objetivo,
  não pegar).
- **O que o servidor valida:** a alternativa enviada contra o gabarito do
  `content_json` (RPC irmã). Mesmo modelo de confiança do exercício atual —
  aceito no piloto assistido; endurece só se aparecer burla.
- **Como o dado fica guardado:** progresso normal + eventos. Shape:
  `{ type: "quiz", question, fen?, choices: [{ text, explain }], correct }`.
- **Competência marcada:** a da aula (a13 `t1_valor_das_pecas`, a17
  `t1_regras_de_ouro`).
- **Reaproveita:** o painel de texto do player, o molde da RPC de passo.
  **Vale ou Não Vale (a15) é este formato com relógio** — família B dos
  mini-jogos (§4), não um motor novo.

## 3.4 Mini-jogo — aulas 1–7, 15, 24, 26

Seção própria: **§4**. Aqui só o contrato com a aula: o mini-jogo é uma seção
`{ type: "minigame", game, config }` dentro do `content_json`, conta como
seção avaliável, e concluir a meta da config completa o passo pela RPC do
núcleo comum.

## 3.5 Bloco de puzzles dentro da aula — aulas 10, 11, 12, 14, 15, 25, 26 (115 puzzles)

- **Problema pedagógico:** dose. "Aula que apresenta o garfo em 5 posições
  fáceis não faz ninguém reconhecer um garfo numa partida" (currículo §4). A
  T1 pede 115 posições do banco, escritas aula a aula na coluna Treino.
- **O que o aluno vê:** ao fim da aula, uma sequência de N puzzles na
  interface de puzzle que ele já conhece, com barra de progresso ("7 de 15").
  Errou um puzzle: segue o fluxo normal de erro do puzzle — e a posição entra
  na fila de revisão (§3.6).
- **O que o servidor valida:** cada lance pela esteira `puzzle_attempt` que já
  existe (valor novo no CHECK de `mode` — as listas por modo dentro da RPC
  são conferidas na execução). O **sorteio é do servidor**: uma RPC nova
  sorteia N puzzles do banco por tema×faixa (§5.2), excluindo os resolvidos
  recentemente — retentativa vem com posições diferentes, sem custo de
  curadoria. O sorteio **grava a tentativa** com a lista de ids e a
  `competencia_key` de cada item (§2.5, item 6): o denominador da barra "7 de
  15" é o da lista gravada, resposta fora dela é recusada, e recarregar retoma
  o mesmo bloco.
- **Como o dado fica guardado:** `user_puzzle_attempts` como hoje, mais o
  vínculo tentativa↔aula (campo novo na tentativa ou tabela-ponte — decisão
  fina da execução; o requisito é o professor poder ver "errou 4 dos 15 da
  aula 12").
- **Competência marcada:** a da aula, status *praticada* (o tema é visível —
  o bloco pertence à aula do tema). Exceção: os 20 mistos da a26 marcam
  *consolidada* (tema oculto, regra da §4 do currículo).
- **Reaproveita:** quase tudo — banco, esteira, `PuzzleBoard`, fila de
  revanche. Atenção da casa: `puzzle_attempt` é a RPC mais recolada do
  repositório (12×) — mexer nela obedece o ratchet do `verify:no-dup-rpc`.

## 3.6 Bloco de revisão espaçada — após as aulas 10, 18 e 26

- **Problema pedagógico:** retenção. Sem revisão espaçada e misturada, a
  competência morre com a aula (currículo §4 — os blocos são obrigatórios,
  ~⅓ da coluna Revisão cada, ~130 posições na T1).
- **O que o aluno vê:** um **nó na trilha** (não uma aula — não infla a régua
  de 26 da patente), no estilo do balão de prova que já existe no mapa. Aberto:
  30–45 posições misturadas, **sem nome de tema**. Intervalo ainda não venceu:
  "volte amanhã" — e **a próxima aula segue liberada**; o bloco pendente trava
  só o Desafio Final. Quem some uma semana volta com tudo vencido, não travado.
- **O que o servidor valida:** monta o conjunto vencido (fila própria), valida
  cada resposta (puzzle → esteira de puzzle em modo revisão; exercício de aula
  → comparação com o gabarito, como no exercício), reagenda: acertou gradua
  **1 → 3 → 7 dias**; errou volta no bloco seguinte. Completar a sessão marca
  o bloco feito — o bloco consolida, quem aprova é o Desafio.
- **Como o dado fica guardado:** `revisao_itens` (aluno, item — puzzle ou
  exercício de aula —, `competencia_key`, estágio, vence em, tropeços) +
  `revisao_blocos` (aluno, trilha, bloco 1/2/3, status, data).
- **Competência marcada:** é **aqui que nasce o status *consolidada*** —
  acerto sem tema na tela (`tema_visivel = false`, derivado pelo servidor
  — §2.2). Erro aqui pesa dobrado no "em dificuldade" (§2.3).
- **Reaproveita:** a mecânica da revanche medida (agenda no erro, gradua no
  3º acerto, imediato→1d→3d; o "teto de 30 pendentes" de lá é **atraso, não
  bloqueio** — com 30 na fila o item entra com +1 dia, e nada é recusado. O
  teto de 45 da alínea (c) é semântica **nova**, não herdada) — a extensão para 1→3→7
  com fila por bloco é incremento, não reescrita. O terço "da trilha anterior"
  no 3º bloco (regra geral do currículo) **não se aplica à T1** — é a
  primeira trilha.

### O contrato executável da revisão

A v1 dizia "todo item praticado entra na fila" — vago demais para
implementar. As quatro regras abaixo fecham isso:

**(a) O que é elegível.** Entram na fila: **puzzles de bloco de aula** (§3.5)
e **exercícios de aula marcados `review_eligible`** no `content_json` — a
marcação é decisão de autoria, item a item, e o padrão é *não elegível*.
**Não entram, nunca:** toques de mini-jogo (a unidade é a rodada, não uma
posição revisável), alternativas de quiz (revisar conceito é papel do texto,
não da fila), partidas contra bot e posições de prática contra o motor (a
unidade leva minutos; a fila é feita de itens de segundos). O item entra ao
ser **respondido pela primeira vez**, certo ou errado.

**(b) O que "errou" faz.** Errar zera o estágio — o item volta ao começo da
régua 1→3→7 — e o torna elegível para o **próximo nó de revisão**, não para o
mesmo. Item errado no bloco 2 reaparece no bloco 3; item errado no bloco 3
(o último da trilha) reaparece no **treino corretivo do Desafio Final**
(§3.8), que é onde a T1 fecha a conta. Nada de reabrir o bloco recém-feito
para o aluno errar de novo na mesma sessão.

**(c) Como o bloco é montado.** Ao abrir o nó, o servidor toma os itens
**vencidos**, ordenados por **antiguidade do vencimento** (a mesma ordenação
que a fila de revanche já usa), até o teto de **45**. Menos de 30 vencidos: o
bloco abre com o que houver — sessão curta é melhor que "volte amanhã" para
quem está em dia. Excedente acima de 45 **fica na fila** e vence de novo no
bloco seguinte; a sessão não cresce sem limite para quem sumiu um mês.
**Bloco concluído não reabre** — o conjunto sorteado é a tentativa persistida
da §2.5, e o "feito" é do bloco, não do item.

**(d) A régua do tempo é do banco.** Vencimento calculado com `now()` do
servidor (§2.5, item 2); "volte amanhã" é a diferença entre `vence_em` e o
relógio do banco. É por isso que a parada do B2 é uma simulação de relógio
manipulado, e não um teste que espera três dias.

## 3.7 Duelo com missão — aula 23 (Léo) · variante na 24

- **Problema pedagógico:** vencer o bot nunca é só vencer — a missão amarra a
  partida à aula 17 (currículo §8). "Construa a Base": até o lance 10, um peão
  em e4/d4 (ou o que capturou para lá), duas peças menores desenvolvidas, rei
  rocado — e depois vencer.
- **O que o aluno vê:** a partida normal contra o Léo (tela de bot que já
  existe) + um painel discreto com os 3 critérios. **No lance 10, o feedback
  do currículo:** o tabuleiro daquele momento com cada critério marcado
  cumprido ou não. No fim, missão cumprida/falhou — a partida pode ter sido
  vencida e a missão não (e vice-versa nunca: vencer é parte da missão).
- **O que o servidor valida:** o avaliador de missão (D6) reexecuta o PGN e
  computa os critérios no lance 10 + o resultado. `bot_result` continua
  registrando a partida como hoje (não muda a esteira dos outros 9 bots).
- **Como o dado fica guardado:** `duelo_missoes` (catálogo — a missão do Léo é
  a primeira) + `duelo_missao_resultados` (aluno, missão, critérios um a um,
  cumprida, referência da partida, data), com histórico. **Nome do conceito no
  código: "missão de duelo"** — "missão" sozinha já significa missão diária
  (`daily_missions`, gamificação congelada); a colisão de nomes fica proibida
  por batismo.
- **Competência marcada:** `t1_regras_de_ouro` (a17), status *consolidada*
  quando a missão cumpre (aplicação em partida real é o degrau mais alto).
  O painel mostra os critérios, então este é o **único caso de *consolidada*
  com algo escrito na tela** — a exceção está declarada na §2.2, para o
  servidor ter uma regra só. O que a sustenta: reconhecer o tema não basta,
  é preciso conduzir dez lances e vencer.
- **Reaproveita:** `BotGameClient`, o seed do Léo (chave estável `slug='leo'`
  — o id numérico não é estável, medido), `emit_class_feed` para o mural.
  A **a24 (Guerra de Peões contra bot)** é família C dos mini-jogos — mesma
  esteira, objetivo diferente (§4).

## 3.8 Desafio Final novo — o fecho da trilha *(acréscimo deste plano)*

- **Problema pedagógico:** o corte atual (7 de 10, sorteio livre das próprias
  aulas) está abaixo do piso de *mastery learning* e não tem blueprint — o
  currículo §5 exige 12 itens (4 regras e visão · 3 tática · 2 finais · 2
  abertura · 1 defesa/empate), corte **10/12**, tema oculto, e as 5
  competências críticas reprovando sozinhas. Sem isso, "quem está pronto para
  avançar" não tem resposta honesta.
- **O que o aluno vê:** a prova de 12 posições, sem nome de tema. Reprovou:
  **treino corretivo dirigido** ao que errou (um mini-bloco montado das
  competências falhas), e a prova volta com posições diferentes. Tentativas
  ilimitadas. O duelo com o Léo fica **fora da prova** (partida leva minutos;
  exercício leva segundos) — é requisito paralelo da trilha.
- **O que o servidor valida:** RPC nova (`submit_desafio_final`): sorteia pelo
  blueprint (server-side) **gravando a tentativa com os 12 itens e a
  `competencia_key` de cada um** (§2.5, item 6), valida item a item
  **incluindo o denominador** (medido: hoje o "de 10" vem do client), aplica a
  regra das críticas (errou crítica → reprova mesmo com 10/12), monta o
  corretivo com as competências falhas — inclusive as que vêm da alínea (b) do
  contrato de revisão (§3.6). É a tentativa persistida que permite o aluno
  fechar o app no meio da prova e voltar à mesma prova.
- **De onde saem as posições** *(lacuna fechada na rev. 3 — o currículo
  também não a fecha: a tabela da §4 de lá não tem coluna de Desafio Final)*.
  Tentativa ilimitada com "posições diferentes" e treino corretivo por
  competência falha exigem **pool por categoria, não 12 posições**. A régua:
  cada uma das 5 categorias do blueprint precisa de **pool ≥ 5× o seu número
  de itens** (20 · 15 · 10 · 10 · 5 = **60 posições**), origem decidida no
  **B0.3, no mesmo passo do mapa 5.2** — as categorias com lastro no banco
  (tática, regras e visão) saem de tema×faixa como os blocos; as sem lastro
  (abertura, defesa/empate, e o que a medição reprovar) saem dos livros pelo
  pipeline do B0.4. O pool ganha **linha própria no mapa 5.2** e é cobrado
  pelo `verify:curriculo-banco`. **Formato do item: um lance, sempre** — o
  Desafio é prova de reconhecimento; técnica de vários lances é medida na
  prática contra o motor, e por isso os 2 itens de "finais" são posições de
  decisão única (a jogada que ganha ou que salva), não mates conduzidos.
- **Como o dado fica guardado:** histórico de tentativas (tabela nova — a
  atual guarda só a melhor, sem memória do que foi errado), compatível com a
  trava de trilha existente.
- **Competência marcada:** tudo que aparece na prova marca *consolidada* (ou
  *em dificuldade*); as críticas alimentam a resposta 3 do professor.
- **Reaproveita:** a tela `ReviewGate`, o sorteio server-side que já existe
  (evolui de "10 aleatórios" para "12 pelo blueprint"), a trava de trilha da
  RPC de passo.

---

# 4. Os mini-jogos: um motor, três famílias, sete jogos

Dos 10 mini-jogos do currículo, **7 estão na T1** — e as 10 primeiras aulas
são deliberadamente curtas "com o mini-jogo carregando a repetição" (§6). Sem
eles, as aulas ficam ocas. O desenho abaixo existe para que 7 jogos não virem
7 projetos.

**Padronização de contagem, porque os dois números confundem e ambos estão
certos:** a T1 tem **7 mecânicas distribuídas em 10 aulas** (a1, a2–a5, a6,
a7, a15, a24, a26). O currículo conta Balões como **1 jogo** nos seus 10
totais — aqui ele é 1 mecânica em 4 configs, uma por peça. Quando este
documento disser "7", são mecânicas; quando disser "10", são usos por aula.
**A onda 1 constrói 4 mecânicas** (Ache a Casa, Balões, Cavalo Faminto, Zona
Proibida), que cobrem as aulas 1–7.

## 4.1 O núcleo comum (constrói-se uma vez)

- **Config pela aula:** o jogo é a seção `minigame` do `content_json` — jogo +
  parâmetros + meta (rodadas, tempo, placar mínimo). Nada de tabela de catálogo
  nova: a aula é o catálogo.
- **Placar, relógio, contagem de erro, tela de resultado** — componentes
  únicos, com a config dizendo quais aparecem.
- **Registro de tentativa:** tabela `minigame_tentativas` (aluno, aula, jogo,
  placar, erros, duração, detalhe por rodada em JSON, data) — o detalhe por
  rodada é dado do relatório do professor ("errou as casas da coluna f").
- **Concessão:** RPC do núcleo (`submit_minigame`) — valida contra o gabarito
  da config (abaixo), grava a tentativa, completa o passo, escreve o evento de
  competência, herda o rabo de conclusão.

## 4.2 As três famílias

**Família A — solo no tabuleiro** (motor de "conjunto de casas-alvo"; onda 1):

| Jogo | Aula | Regra própria (só isto é código novo por jogo) |
|---|---|---|
| **Ache a Casa** | a1 | sequência de casas **em texto grande** + relógio; sem peças no tabuleiro — sem áudio o jogo continua inteiro, porque ler "e4" é o exercício da a1 |
| **Balões** ×4 | a2–a5 | o conjunto-alvo são as casas alcançáveis da peça na posição dada (com bloqueios); tocar fora é falta; um jogo por peça = **4 configs, 1 regra** |
| **Cavalo Faminto** | a6 | alvos espalhados + orçamento de N lances; valida a rota real do cavalo |
| **Zona Proibida** | a7 | mapa de casas atacadas na posição; atravessar de origem a destino sem pisar nelas |

O que é comum aos quatro: tabuleiro com conjunto-alvo, toque = tentativa,
placar/erro, rodadas. **Validação server-side sem xadrez no servidor:** a
config de cada rodada carrega o **gabarito precomputado** (as casas do
conjunto, a rota ótima, o mapa de ataque) — gerado por script na autoria e
**conferido pelo gate**, que refaz o cômputo e reprova config errada. A RPC só
compara o registro de toques com o gabarito guardado. Nenhuma dependência do
avaliador da onda 3.

**Família B — julgamento rápido** (onda 2): **Vale ou Não Vale** (a15) =
pergunta binária com FEN + relógio de 5 segundos. É o formato quiz com timer e
banco de posições de troca — zero motor novo.

**Família C — contra o motor com objetivo** (onda 3): **Guerra de Peões**
(a24 — só peões, promover primeiro) e **Come-Peões** (a26 — capturar todos os
peões primeiro; o checklist aparece a cada lance). São a esteira da prática
contra o motor (§3.2) com objetivos `promover_primeiro` e
`capturar_todos_primeiro`. **O avaliador de objetivo é um só** e serve a
prática contra o motor, a missão do Léo e estes dois jogos — três formatos,
um julgador.

## 4.3 Balões — validar barato antes de construir

A ressalva é do próprio currículo (§7): a mecânica do Chessmatec não está
documentada publicamente; **os Balões deste catálogo são dedução, não cópia
verificada** — e sustentam 4 das 5 primeiras aulas. Três degraus, do mais
barato:

1. **Protótipo físico na aula do clube** (custo: papel). Tabuleiro impresso,
   professor dita a peça e a casa dela, criança marca com lápis as casas que a
   peça alcança. Mede o que importa — a criança entende a instrução? o jogo
   tem graça? — antes de qualquer código.
2. **Uma fatia vertical no app:** só o Balões do Peão, observado no celular de
   criança real. Torre, bispo e dama são a mesma regra com outra config — o
   risco é a mecânica, não o código, então valida-se a mecânica uma vez.
3. **Fallback documentado:** se os Balões não funcionarem com criança, a
   mecânica documentada da família ("capturar todos os alvos com a peça" — o
   Cavalo Faminto generalizado) roda **no mesmo motor de conjunto-alvo**.
   Troca-se a regra, não a engenharia.

## 4.4 O checklist não é formato

"O que ele ameaça? Tem xeque? Tem captura? Tem peça solta?" (a11 em diante) é
um **micro-componente de ritual**: um banner de um toque no fim das aulas e a
cada lance na arena a26. Se o ritual ajuda ou irrita é critério de observação
do piloto (§7, B5/B7), não de script.

---

# 5. As posições: origem, autoria e o gate do lastro

## 5.1 O pipeline de autoria (posições dos livros)

A regra é do currículo §4: **posição é fato, explicação é obra.** Fundamentos
e técnica da T1 saem dos cadernos do Passo 1 (comprados); todo texto é redigido
do zero, na nossa voz; a origem fica no campo interno `source`.

O caminho da posição até o aluno: quem tem os cadernos digita a posição num
**arquivo de dados por aula** (FEN + solução + source — formato definido no
B0), um script de autoria **valida por motor** que o objetivo declarado é
verdadeiro (mate em N é mate em N; ganho ganha) e **precomputa os gabaritos**
dos mini-jogos (§4.2), e o seed da aula é gerado desse arquivo. Nota de
arquitetura: a validação por motor é passo de **autoria** — roda na máquina de
quem prepara o conteúdo, uma vez — e não fere a regra "Stockfish nunca no
servidor", que é sobre o app em produção.

## 5.2 O mapa tema×faixa — a tabela que faltava

O currículo escreve a dose ("15 puzzles" na a12) mas não diz **quais tags do
Lichess** nem **qual faixa de rating** definem cada bloco. Esse mapa é deste
documento, vira **dado** (arquivo consumido pelo sorteio e pelo gate — uma
fonte só), e cada tag abaixo é **hipótese até o gate medir**:

| Aula | Dose (§6) | Treina | Tags candidatas | Expectativa honesta |
|---|---|---|---|---|
| a10 | 10 | não afogar quando ganha; as 5 formas de empate | tag de afogamento/empate — **provavelmente não existe** no banco | migrar para livros/autoradas com validação por motor |
| a11 | 15 | peça pendurada | `hangingPiece` | lastro provável; a dúvida é a faixa |
| a12 | 15 | salvar a peça atacada (defesa) | `defensiveMove` e vizinhas | **a suspeita central do currículo** — taxonomia Lichess é de quem ataca |
| a14 | 20 | mate em 1 | `mateIn1` | lastro certo; sobra escolher a faixa |
| a15 | 10 | contar defensores / troca boa | sem tag limpa conhecida | provável migração para os cadernos (contagem é o forte do Steps) |
| a25 | 25 | velocidade em mate em 1 (arena temática — legítimo, §4) | `mateIn1` | lastro certo |
| a26 | 20 | mistos, tema oculto | união das tags aprovadas da trilha | depende dos blocos acima |
| **Desafio Final** *(rev. 3)* | **pool 60** (5× o blueprint: 20·15·10·10·5) | as 5 categorias do blueprint (§3.8) | fora dos 115 — **pool, não dose**; sorteia-se 12 por tentativa. Tática e regras/visão pelo banco; abertura e defesa/empate provavelmente pelos livros |

Soma das doses de aula: **115 — bate com a coluna "Do banco" da §4 do
currículo.** O pool do Desafio **não entra nessa soma** e não altera a conta da
§4: ele é reservatório de prova, sorteado a cada tentativa, e o gate confere as
duas coisas separadamente. Faixa de
rating proposta como ponto de partida: **a banda mais fácil disponível que
tenha 3× a dose** (regra, não número — o número sai da medição; o banco começa
em torno de 600, e a T1 é iniciante absoluto, então a régua é "quanto mais
fácil, melhor, desde que haja lastro"). Os 3 blocos de revisão **não precisam
de lastro próprio**: revisam o que o aluno praticou, que já passou pelo funil.

## 5.3 `verify:curriculo-banco` — o gate do lastro

O que o currículo §4 encomendou, com o desenho da casa (docblock contando o
incidente que o motiva — a rev. 3 prometia 270 posições "do banco" que ninguém
tinha contado —, `checar()`, exit 1):

- Para **cada linha do mapa 5.2**, conta no banco os puzzles com as tags e a
  faixa declaradas.
- **Reprova bloco com menos de 3× a dose** — e a mensagem diz a consequência:
  a dose migra para os livros (a conta da §4 não muda; muda a origem).
- **Confere o pool do Desafio Final** *(rev. 3)*: categoria a categoria,
  ≥ 5× os itens do blueprint, somando banco e livros — é a linha do mapa que
  não é dose, e ela reprova pela mesma régua.
- Confere que a soma das doses do mapa bate com a coluna da §4 do currículo
  (mesmo espírito do `verify:curriculo`, que já refaz somas — mas em script
  separado: o daquele gate tem o doc 01 fixado no código).
- Roda **primeiro** (B0): é barato — consultas de contagem — e o resultado
  muda decisões de autoria antes de qualquer aula ser escrita.

---

# 6. As seis decisões

Cada uma com recomendação e custo de errar. Vetar qualquer uma custa uma
linha; o plano segue com a recomendação onde não houver veto.

## D1 — As 30 aulas antigas: descartar como conteúdo (e a `soldado` sai de vista)

São 15 `recruta` + 15 `soldado` do modelo antigo. **Recomendação: descartar
como conteúdo; aproveitar texto como matéria-prima onde o tema coincidir;
player, tabelas e RPCs ficam intactos.** Adaptar custaria mais que reescrever —
ordem, dose, mini-jogo e competência mudaram tudo — e não há aluno real com
progresso a preservar (medido: só contas de teste).

**As duas trilhas antigas saem de formas diferentes, e a diferença é do
schema, não de preferência:**

- A **`recruta`** é substituída **fisicamente, por força do banco**: existe
  `CREATE UNIQUE INDEX idx_lessons_trail_order ON public.lessons(trail,
  trail_order)` (migration `20260216180000`), e as 26 aulas novas ocupam
  `('recruta', 1..26)` — as **posições 1..15 colidem** com as 15 antigas, e as
  16..26 são inserção limpa. Nas 15 que colidem não há versão de "esconder em
  vez de apagar": o índice único obriga a linha antiga a sair para a nova
  entrar. A troca é o `ON CONFLICT (trail, trail_order) DO UPDATE` que os
  seeds já usam, no B3.2.
- A **`soldado`** não é substituída por nada ainda, então ela apenas **sai de
  vista**: some do mapa (`get_lesson_map`), da constante `TRAILS` e da lógica
  de unlock, e a patente correspondente aparece como "em preparação". As
  linhas continuam na tabela; a remoção física pega carona no seed da T2 nova,
  quando houver T2. Ninguém fica olhando uma trilha de modelo velho ao
  terminar a T1, e nada é apagado antes da hora.

**A reversibilidade já existe, por outra via:** todo o conteúdo antigo está nas
migrations versionadas no git — `20260222100000` em diante. Recuperar uma aula
descartada é abrir o arquivo, não desfazer um DELETE. Custo de errar: se adaptássemos, cada
divergência futura do currículo cobraria edição dupla; descartando, o custo é
o texto antigo que se perde — e ele fica no histórico do git de qualquer
forma.

## D2 — Piloto: aulas 1–10 + bloco de revisão 1

O primeiro corte natural da trilha (o bloco de revisão cai após a a10). É o
trecho de **maior risco pedagógico** (Balões deduzidos, criança de 6 anos,
celular simples) com a **menor construção** (a onda 1 não precisa de quiz,
lição interativa, motor nem duelo). Custo de errar para cima: semanas a mais
sem criança de verdade — o risco de morte do projeto é dispersão, não técnica.
Para baixo: piloto que não alcança o bloco de revisão não testa retenção, que
é a hipótese central do currículo.

## D3 — Mini-jogos no piloto: 4 dos 7

Ache a Casa, Balões (×4 configs), Cavalo Faminto e Zona Proibida — os das
aulas 1–10, todos da família A. **Vale ou Não Vale (a15), Guerra de Peões
(a24) e Come-Peões (a26) vêm nas ondas 2 e 3 sem deixar nenhuma aula oca** —
as aulas deles ainda não existirão no piloto 1. Custo de errar: construir os 7
antes do piloto adia o contato real por 3 jogos que a onda 1 nem usa.

## D4 — Ordem de construção: a ordem da própria trilha, em três ondas

- **Onda 0 — fundação** (sem superfície de aluno): competência, tipos de
  seção, mapa tema×faixa, gate do lastro **rodado e medido**.
- **Onda 1 — aulas 1–10:** motor família A + 4 jogos, bloco de puzzles,
  revisão espaçada, conteúdo, relatório mínimo → **piloto 1**.
- **Onda 2 — aulas 11–18:** quiz, lição interativa, família B, conteúdo,
  revisão 2 → **piloto 2**.
- **Onda 3 — aulas 19–26:** avaliador de objetivo (D6), prática contra o
  motor, missão do Léo, família C, Desafio Final novo, revisão 3 →
  **piloto 3 / T1 completa**.

Cada onda termina com criança usando. Custo de errar: qualquer ordem por
"formato mais interessante" deixa aulas inteiras sem conteúdo executável — e o
formato tecnicamente mais interessante (o avaliador) é justamente o que as
primeiras 18 aulas não usam.

## D5 — Aluno que já joga: posicionamento pelo professor

RPC de posicionamento (professor escolhe trilha e aula inicial; registro fica
guardado com autor e data). As aulas puladas ficam **"dispensadas", nunca
"concluídas"** — o relatório distingue o demonstrado do assumido, e a fila de
revisão do aluno posicionado começa vazia (revisa-se o que se praticou). A
rede de segurança é o **Desafio Final integral**: posicionamento otimista
esbarra nas competências críticas, e o treino corretivo recoloca o aluno no
lugar certo. Teste de posicionamento self-serve: **adiado** até existir aluno
sem professor (§9). Custo de errar: sem isso, o piloto começa com jogadores de
clube na aula "como anda o peão" — a quebra que o parecer estratégico apontou
no próprio clube.

## D6 — Onde a partida é reavaliada *(a decisão que a medição impôs)*

Medido: **não existe replay de partida no servidor** — `bot_result` valida
comprimento de texto, não xadrez. Missão de duelo, prática contra o motor e
família C precisam computar o tabuleiro a partir do PGN em lugar confiável.

**Recomendação: um módulo TypeScript único de avaliação (chess.js), usado em
três lugares:** feedback instantâneo no client (a criança vê o critério na
hora), **veredito autoritativo numa rota de servidor** — a primeira rota
server-compute do projeto — e fixtures de teste do gate (PGNs que cumprem e
que não cumprem, verificados no `npm test`).

### Como a RPC sabe que o veredito é legítimo

A v1 dizia "a RPC de concessão só aceita veredito vindo dela" sem dizer como —
lacuna real, e a resposta não precisa ser inventada: **é o padrão que a casa já
usa.** A migration `20260725120000` revoga a execução de `grant_xp`,
`emit_class_feed`, `check_level_up` e outras de `anon, authenticated, PUBLIC` —
essas funções são chamáveis **apenas** por `service_role`. O mesmo tratamento
vale aqui, e o fluxo completo é:

1. O client envia **só** `{ attempt_id, pgn, submission_id }`. Nada de
   veredito, nada de FEN, nada de "cumpri o objetivo".
2. A rota autentica o aluno com `@supabase/ssr` (`createServerClient`,
   `getAll/setAll`) e confere que a tentativa é dele.
3. A rota **carrega do banco** a FEN de partida, o objetivo, o orçamento e os
   critérios da missão — pela `attempt_id`, nunca pelo corpo do pedido. É isto
   que fecha a porta da "posição adulterada": o client não tem como propor a
   posição em que jogou.
4. A rota reexecuta o PGN com chess.js: partida legal, saiu daquela FEN,
   objetivo cumprido dentro do orçamento, critérios avaliados no lance 10.
5. **Só a rota** — com a chave `service_role`, que nunca vai ao client — chama
   a RPC privada de concessão, numa transação, com o `submission_id` do
   contrato da §2.5. A RPC tem
   `REVOKE EXECUTE ... FROM anon, authenticated, PUBLIC`: um aluno que tente
   chamá-la direto do browser com o token dele recebe erro de permissão, não um
   veredito falso.
6. Retry com o mesmo `submission_id` devolve o resultado já gravado — sem
   segunda concessão.

### O que este desenho **não** prova — e por que assim mesmo *(rev. 3)*

Os 6 passos fecham a posição adulterada e o veredito forjado. **Não fecham o
adversário simulado:** os lances do motor chegam dentro do PGN, vindos do
client. O replay prova que a partida é legal, saiu da FEN declarada e cumpriu o
objetivo — **não prova que do outro lado jogou o Stockfish na força declarada**.
Um aluno capaz de editar o PGN pode entregar um "motor" que se deixa matar, e a
rota carimba "cumpriu". Vale para os três formatos da família do avaliador:
prática contra o motor, missão do Léo, Guerra de Peões e Come-Peões.

O buraco fica **aceito e escrito**, não fechado, por três razões: o piloto é
assistido e o público é criança de 6 a 14 anos aprendendo, não adversário;
fechar de verdade exigiria motor no servidor, que a regra da casa veta; e
heurística de "lance bom demais" é projeto próprio, com falso positivo caro
(aluno bom reprovado). **A consequência honesta é de leitura**: no relatório do
professor, *praticada* por prática contra o motor vale menos que *consolidada*
por bloco de revisão — lá o servidor sorteia a posição e conhece a resposta.
Se aparecer burla no piloto, a válvula é a mesma do quiz: endurecer o formato
específico, não reescrever o avaliador.

Alternativa considerada e descartada: manter a validação fraca no piloto.
Barateia a onda 3, mas grava "demonstrou" falso **exatamente no dado que o
relatório do professor promete** — e relatório mentiroso por construção é pior
que relatório atrasado. Custo da recomendação: a rota nova passa por
`security-review` na execução (é superfície nova com chave privilegiada).
`bot_result` dos outros 9 bots fica como está — endurecê-lo é assunto de
pós-piloto, fora deste plano.

---

# 7. Execução em blocos — propostos, não iniciados

Oito blocos, B0–B7. Cada um cabe em poucas sessões, fecha com 🔒 **gate**
(automatizado) e, quando tem superfície de aluno, com 👁 **observação no
piloto** — o que nenhum script mede: se a criança entendeu a instrução,
acertou o toque, entendeu o erro, manteve a atenção. Cada bloco declara também
o **resultado esperado** no formato aluno/professor e a ✋ **parada** — o
número ou artefato que o Doug vê antes de liberar o próximo.

Gates novos no total: **3 entradas** — `verify:curriculo-banco` (B0),
`verify:trilha1` (nasce no B2 e cresce por onda), `verify:competencia` (B3).
O resto é `npm test`. **Sem gate por formato.**

> Regra herdada do plano do avatar (emenda de 2026-08-03 do doc 15): gate
> reprovado trava **aquela entrega**, nunca a construção do bloco seguinte que
> não dependa dela tecnicamente.

## B0 — Fundação (onda 0)

*Sem superfície de aluno. Tudo aqui destrava as três ondas.*

- **B0.0** O **contrato de tentativa** (§2.5) escrito antes de qualquer tabela:
  a convenção de `submission_id` + UNIQUE, o molde de política RLS para as
  tabelas novas, a revogação de escrita direta, `SET search_path` em toda
  função, e o helper de tentativa persistida que os três sorteios (bloco,
  revisão, Desafio) vão reusar. Vem primeiro porque retrofitar idempotência em
  6 RPCs já escritas custa mais que nascer com ela. **Junto, a extensão do
  `verify:avatar-db`** (§3): trocar a checagem fixada em `complete_lesson_step`
  por uma **lista de RPCs que concluem aula**, à qual cada formato novo se
  acrescenta — senão o rabo obrigatório fica valendo por costume nas irmãs.
- **B0.1** Migration do catálogo `competencias` + `competencia_eventos` (§2),
  com a redação das competências da T1 (autoria: coluna "sai sabendo" da §6 +
  as 5 críticas como flag). Competência é **atômica**, com `aulas_origem`
  1..N (§2.1) — não uma coluna "aula".
- **B0.2** Tipos TS das seções novas (`interactive`, `engine_practice`,
  `quiz`, `minigame`, `puzzle_block`) + validador puro de `content_json` que o
  gate e os testes consomem. `total_steps` redefinido como seções avaliáveis.
- **B0.3** Mapa tema×faixa (§5.2), em **três passos que não se confundem**:
  **(i) medir** — rodar as contagens do banco para cada linha do mapa, com as
  tags e faixas candidatas, **inclusive as 5 categorias do pool do Desafio
  Final** (§3.8); **(ii) decidir** — bloco a bloco e categoria a categoria, com
  o número na mão, se a origem é banco ou livros, e gravar a decisão no arquivo
  de dados;
  **(iii) cobrar** — só então o `verify:curriculo-banco` entra no `verify:all`,
  exigindo que o banco continue sustentando o que o mapa decidiu. Na v1 os três
  vinham num item só, o que fazia o gate nascer reprovando aquilo que ele
  deveria estar ajudando a decidir.
- **B0.4** Formato do arquivo de autoria por aula (§5.1) + script de validação
  por motor e precômputo de gabaritos.
- **B0.5** Régua da patente: `title_tiers.lessons_required` → 0·26·47·66·84·101·115·126.
  ✅ **Decidido pelo Doug em 2026-08-11 — não há mais veto a dar.** O princípio é
  *a patente vem de concluir uma trilha*, e 26·47·… é o que ele significa com a
  T1 de 26 aulas. O achado **T1** fechou nesse dia.
  **Só que este `UPDATE` não é o começo do B0.5 — é a última linha dele.** Com as
  30 aulas de hoje o marco 26 cairia no meio da trilha `soldado`; ele entra na
  mesma migration que trouxer as 26 aulas da T1, nunca antes.
  **E não depende mais de memória:** `title_tiers.trail` já amarra cada patente à
  trilha que ela fecha (migration `20260811120000`), e a conferência (e) do
  `verify:avatar-db` mede o acumulado real em `lessons`. **Subir as 26 aulas sem
  o `UPDATE` deixa o `verify:all` vermelho**, nomeando o tier e o número que
  faltou. O B0.5 se cobra sozinho.
- **B0.6** Ensinar `scripts/estado.ts` a contar os blocos deste doc (mesma
  convenção de tarefa numerada do doc 14 do avatar).

**Resultado esperado:** nenhum para aluno; para nós, o lastro vira número.
🔒 `verify:curriculo-banco` no `verify:all` + testes do validador de seção.
👁 n/a.
✋ **Parada: o relatório do lastro** — a tabela 5.2 preenchida com contagens
reais, bloco a bloco **e categoria a categoria do pool do Desafio**, mais a
lista do que migra para os livros. É esse número que dimensiona a autoria do
B3.1 e do B7.3.

## B1 — Motor de mini-jogo (família A) + os 4 jogos (onda 1)

- **B1.0** **Protótipo físico dos Balões na aula do clube** (§4.3, degrau 1) —
  papel, lápis, professor ditando. **Vem antes**, e é **pré-condição da regra
  Balões**, não trabalho paralelo: a v1 mandava construir em paralelo, o que
  contradizia a própria escada barata da §4.3.
- **B1.1** Núcleo comum (§4.1): config, placar, relógio, resultado,
  `minigame_tentativas`, RPC `submit_minigame` com o rabo de conclusão.
- **B1.2** Motor de conjunto-alvo (família A). **Não depende do B1.0** — os
  outros três jogos precisam dele de qualquer forma, e é isso que limita o
  estrago se os Balões falharem no papel: perde-se a regra Balões e a autoria
  das aulas 2–5, não a engenharia.
- **B1.3** As três regras que não dependem do protótipo: Ache a Casa, Cavalo
  Faminto, Zona Proibida.
- **B1.4** **Balões do Peão** — uma config só, no app, observada em celular de
  criança real (§4.3, degrau 2).
- **B1.5** As outras três configs de Balões (torre, bispo, dama) — **só depois
  do B1.4 passar**. É a mesma regra com outra config; se a mecânica não
  funciona com o peão, multiplicar por quatro não conserta.

**Resultado esperado:** aluno joga os 4 no celular; professor ainda não vê
nada novo.
🔒 `npm test` — regras com teste unitário (gabarito precomputado × registro de
toques; config inválida reprovada pelo validador do B0.2).
👁 o protótipo físico (B1.0): a criança entendeu a instrução ditada? quis jogar
de novo? e o B1.4: acertou o toque no tabuleiro pequeno?
✋ **Duas paradas.** A primeira, **depois do B1.0**: o protótipo de papel
funcionou com criança? Reprovou → o fallback documentado da §4.3 (degrau 3)
entra no lugar da regra Balões, no mesmo motor. A segunda, **depois do B1.4**:
Balões do Peão no celular de uma criança, antes de gastar as outras três
configs — e uma sessão de 10 minutos no seu celular com os 4 jogos, antes de
qualquer aula usá-los.

## B2 — Bloco de puzzles + revisão espaçada (onda 1)

- **B2.1** Seção `puzzle_block` + RPC de sorteio server-side por tema×faixa,
  **gravando a tentativa persistida** do B0.0 + modo novo na esteira de puzzle
  + vínculo tentativa↔aula.
- **B2.2** Fila de revisão: tabelas, régua 1→3→7 e as quatro alíneas do
  **contrato executável da §3.6** — elegibilidade declarada (puzzle de bloco e
  exercício `review_eligible`; mini-jogo, quiz e partida ficam fora), "errou"
  zera o estágio e joga para o **próximo** nó, montagem por antiguidade com
  teto de 45 e excedente na fila, bloco feito não reabre.
- **B2.3** Nós de revisão no mapa da trilha (a cirurgia medida:
  `get_lesson_map`, unlock e `TRAILS` só conhecem 2 trilhas e nenhum nó
  intermediário) + estado "volte amanhã" + trava só no Desafio.

**Resultado esperado:** aluno fecha a a10 com 10 puzzles e vê o primeiro nó de
revisão; professor ainda não.
🔒 `verify:trilha1` (nasce aqui): dose por aula = tabela do currículo;
intervalos e destravas corretos; item errado reaparece; "volte amanhã" não
trava aula seguinte.
👁 n/a (a superfície chega ao aluno no B3).
✋ **Parada: simulação da régua inteira com conta de teste**, relógio
manipulado no banco. A v1 dizia "3 dias", que não fecha a conta: a régua 1→3→7
com um erro no meio precisa de **D0 → D1 → D4 → D11** para mostrar os três
estágios graduando e um item errado voltando ao começo. São quatro saltos de
relógio, não três dias.

## B3 — Conteúdo das aulas 1–10 + competência + relatório mínimo → **PILOTO 1**

> ⛔ **Pré-condição — consentimento.** O piloto 1 põe criança real de 6 a 14
> anos, parte dela fora do clube (Colégio São Luiz), dentro do produto. Na v1
> isto era uma linha na lista de riscos; **é uma parada obrigatória**, e o B3.5
> não começa antes dela. O checklist, todo ele por escrito antes do primeiro
> encontro:
>
> 1. Autorização das **duas instituições** — clube e colégio — por escrito.
> 2. Autorização dos responsáveis pelos menores, dizendo o que será coletado
>    (progresso de aula, acertos e erros, tempo) e para quê.
> 3. **Quem vê o relatório:** nominalmente definido — professor da turma, e
>    mais ninguém.
> 4. **Nome exibido:** política escrita de apelido — nome completo de criança
>    não aparece em mural, ranking ou tela compartilhada.
> 5. **Contas do piloto** criadas e listadas, separadas das contas de teste.
> 6. **Retenção e remoção:** o que acontece com os dados ao fim do piloto, e
>    como um responsável pede a remoção dos dados do filho.
> 7. **Nenhum dado de aluno no repositório público** — o repo guarda código,
>    docs e fixtures sintéticas; dado de criança fica no banco. Nada de FEN
>    com nome, nada de dump em `docs/`, nada de captura de tela do relatório
>    com nome real.
>
> **O piloto 1 é declaradamente assistido:** o professor está presente e narra
> o que for preciso. Autonomia da criança é o que a folha de observação
> **mede**, não o que o bloco promete entregar.

- **B3.1** Autoria das aulas 1–10 (posições do caderno do Passo 1 pelo
  pipeline do B0.4; textos do zero; 4–6 exercícios por aula, 9 na a9 — doses
  da §6 do currículo; mini-jogos das aulas 1–7; bloco de 10 puzzles na a10).
- **B3.2** A troca de seed (D1): a `recruta` antiga é substituída pela T1 nova
  (as 15 posições que colidem saem por `ON CONFLICT DO UPDATE`; as aulas 16–26
  entram por inserção), e a `soldado` **sai de vista sem sair da tabela** —
  mapa, `TRAILS` e unlock; nada de DELETE nela. Fixtures do e2e atualizadas (os
  ids das 30 aulas antigas estão gravados em `e2e/data` e `e2e/helpers` —
  medido).
- **B3.3** Fiação de competência: as RPCs de exercício, mini-jogo, puzzle de
  bloco e revisão passam a escrever `competencia_eventos`.
- **B3.4** Relatório mínimo do professor: as 3 respostas da §2.4 no relatório
  da fase 9, com a **régua provisória v1** da §2.3 e o **denominador sempre
  visível** ("2 de 2" não pode parecer com "2 de 30") + conserto do bug das
  Conquistas (causa medida na §2.4: `achievement_key` não existe em
  `user_achievements` — o embed correto parte de `achievement_id`, e o erro
  precisa deixar de ser engolido) + exibir estrelas/erros/dicas já guardados.
- **B3.5** Folha de observação do piloto (1 página, imprimível) + piloto 1 nas
  turmas, **com duração declarada: no mínimo 3 encontros ao longo de ao menos
  2 semanas**. Uma sessão única não testa a hipótese central do currículo —
  retenção — e não alcança o primeiro vencimento da fila de revisão.

**Resultado esperado:** *"aluno de 7 anos faz a aula 3 no celular, com o
professor por perto; o professor vê no relatório quem errou as casas do
bispo"* — o formato de pedido do método (resultado para aluno e professor,
validação humana). **A promessa não é autonomia:** o piloto 1 é assistido, e
quanto o professor precisou narrar é um **número que a folha traz**, não um
critério que o bloco cumpre. Esse número é o que decide a prioridade do áudio
(§8).
🔒 `verify:trilha1` (dose e integridade das 10 aulas) + `verify:competencia`
(nasce aqui, **sobre conta de teste**: cada formato escreve evento, a régua
provisória classifica como esperado, as 3 consultas do professor retornam dado
com denominador). Dado de criança real é leitura humana, não gate — ver B7.
👁 **a folha do piloto 1:** entendeu a instrução do mini-jogo sem ler? acertou
o toque no tabuleiro pequeno? entendeu a mensagem de erro ou chamou o
professor? quanto o professor precisou narrar (mede a falta do áudio)? "volte
amanhã" frustrou ou aliviou? em que aula a atenção caiu?
✋ **Parada: a folha preenchida + o relatório do professor com dado real** —
decisão conjunta de ajustar a onda 1 ou abrir a onda 2, e a **recalibração dos
dois números da régua provisória** (§2.3) com o que o piloto mostrou.

## B4 — Quiz + lição interativa + Vale ou Não Vale (onda 2)

- **B4.1** Seção `quiz` + RPC irmã; Vale ou Não Vale como quiz com relógio
  (família B) sobre banco de posições de troca autoradas.
- **B4.2** Seção `interactive` + RPC irmã validando jogada a jogada; o
  auto-play do demo vira resposta do adversário.

**Resultado esperado:** os dois formatos jogáveis em aula de desenvolvimento.
🔒 `npm test`: todo roteiro interativo reproduz legalmente do FEN à última
jogada (chess.js nos testes); quiz valida gabarito e explicações existem para
toda alternativa.
👁 herda do B5 (chegam ao aluno juntos).
✋ **Parada: você jogando uma lição interativa de amostra inteira no celular**
— roteiro de teste, com erro no meio para ver a explicação e a volta da
posição. *(rev. 3: a v2 pedia a lição do Mate do Pastor, que só é autorada no
B5.1 — a parada não pode depender do bloco seguinte.)* A a18 real vira a
primeira aplicação, no B5.

## B5 — Conteúdo das aulas 11–18 + revisão 2 → **PILOTO 2**

- **B5.1** Autoria das aulas 11–18 (blocos de 15/15/20/10 puzzles nas
  a11/a12/a14/a15 conforme o lastro medido no B0; quiz nas a13/a17; lição
  interativa na a18; checklist entra na a11 e não sai mais).
- **B5.2** Bloco de revisão 2 (após a18) — já é só config da fila do B2.
- **B5.3** Piloto 2.

**Resultado esperado:** *"aluno erra 2 posições de casas atacadas → professor
vê a competência em dificuldade no relatório da turma"*.
🔒 `verify:trilha1` estendido até a a18.
👁 na lição interativa: a criança entendeu que **o adversário respondeu**?
releu a explicação do erro ou chutou de novo? no quiz: leu as alternativas ou
tocou a primeira? o ritual do checklist ajuda ou irrita?
✋ **Parada: folha do piloto 2 + primeira resposta real de "o que trabalhar na
próxima aula"** vinda do relatório, conferida com o professor.

## B6 — O avaliador de objetivo + prática contra o motor + missão do Léo + família C (onda 3)

- **B6.1** O módulo de avaliação (D6): replay de PGN + objetivos (`mate`,
  `promover_primeiro`, `capturar_todos_primeiro`) + critérios de missão
  (lance 10 do Léo).
- **B6.2** A rota server-side autoritativa + a RPC privada de concessão,
  **exatamente pelos 6 passos do D6** (client manda só `{attempt_id, pgn,
  submission_id}`; a rota carrega FEN/objetivo/orçamento/critérios do banco;
  `REVOKE EXECUTE ... FROM anon, authenticated, PUBLIC` na RPC; concessão numa
  transação, idempotente pelo `submission_id`). **Passa por `security-review`
  antes de subir.**
- **B6.3** Seção `engine_practice` no player (objetivo, orçamento, recomeço
  de posição).
- **B6.4** Missão do Léo (§3.7): painel de critérios + feedback do lance 10.
- **B6.5** Guerra de Peões e Come-Peões sobre a mesma esteira (família C);
  checklist a cada lance na a26.

**Resultado esperado:** *"aluno dá o mate de torre contra o motor; o
professor vê quantas tentativas custou"*.
🔒 `npm test` com fixtures de PGN: partidas que cumprem e que não cumprem cada
objetivo e cada critério de missão, veredito conferido; rota recusa PGN ilegal
e posição adulterada; **chamada direta à RPC de concessão com token de aluno é
recusada por permissão** (o teste do REVOKE), e reenvio do mesmo
`submission_id` não concede duas vezes.
👁 herda do B7.
✋ **Parada: medição do Stockfish no celular do piloto** (o mais fraco
disponível) — tempo de resposta por lance em **posições de amostra do tipo da
a20** (mate com dama e rei), com os presets de força que a T1 pretende usar.
*(rev. 3: a v2 dizia "as posições da a20", autoradas só no B7.1 — a medição
existe justamente para acontecer antes.)* Se passar de frustrante, a
força/profundidade cai antes da autoria do B7.

## B7 — Conteúdo das aulas 19–26 + revisão 3 + Desafio Final novo → **PILOTO 3 · T1 completa**

- **B7.1** Autoria das aulas 19–26 (lições interativas + 8 posições contra o
  motor nas a19–a21 — 2·3·3, do caderno e do de la Villa; arenas a23–a26).
- **B7.2** Bloco de revisão 3 (após a26).
- **B7.3** Desafio Final novo (§3.8): blueprint 12 itens, corte 10/12,
  críticas, corretivo, histórico — **sobre o pool de 60 posições** decidido no
  B0.3 e autorado aqui (o que não vier do banco sai dos livros pelo pipeline do
  B0.4), com o item de prova sempre de **um lance**.

**Resultado esperado:** *"aluno fecha a trilha; o professor responde 'quem
está pronto para avançar' olhando uma tela"*.
🔒 `verify:trilha1` fecha a trilha inteira (26 aulas, doses, 8 posições de
motor, 3 nós de revisão, Desafio com blueprint) + `verify:competencia`
respondendo as 3 perguntas **sobre as fixtures de conta de teste** — trilha
percorrida de ponta a ponta por conta sintética, as três consultas devolvendo
o dado esperado. **Gate roda sobre fixture; dado de criança real não é gate** —
turma de piloto varia de tamanho, de assiduidade e de desempenho, e um gate
amarrado a isso reprovaria por motivo pedagógico, não técnico. A leitura do
dado real é a parada humana abaixo.
👁 a criança aguenta a partida inteira contra o Léo (atenção, minutos)?
entendeu o feedback do lance 10? quem reprova no Desafio volta pelo corretivo
ou desiste? perder para o Léo dói quanto?
✋ **Parada: T1 inteira jogada de ponta a ponta por você + relatório final do
piloto 3** — é a porta da decisão sobre a Trilha 2, que não é deste documento.

---

# 8. Riscos vivos e armadilhas de execução

**Riscos (podem mudar o plano):**

- **Balões é dedução** e sustenta 4 das 5 primeiras aulas — por isso o degrau
  físico e a fatia vertical antes das 4 configs (§4.3), e por isso o fallback
  fica escrito.
- **Lastro do Lichess na faixa do iniciante** — a suspeita do currículo (§4)
  vira número no B0; a consequência (migrar dose para livros) já tem regra e
  não muda a conta.
- **Stockfish em celular simples** — medido só no B6, de propósito antes da
  autoria do B7; a válvula é baixar força/profundidade das posições da T1.
- **O adversário do PGN não é verificável** *(rev. 3)* — o avaliador do D6
  prova legalidade, posição de origem e objetivo, mas não que quem jogou do
  outro lado foi o motor. Risco aceito e escrito (D6, "o que este desenho não
  prova"); consequência prática: *praticada* por prática contra o motor é
  evidência mais fraca que *consolidada* por revisão, e o relatório não deve
  tratar as duas como iguais.
- **Criança de 6 anos lê devagar e o áudio fica para depois** (o texto ainda
  vai mudar — currículo §10): o piloto 1 é **assistido** e o professor narra; a
  folha de observação **mede quanto** — esse número decide a prioridade do
  áudio. Nenhum formato depende de áudio para funcionar: em *Ache a Casa*, a
  casa-alvo aparece como **texto grande na tela**, e ler "e4" **é** o exercício
  da a1, não um obstáculo a ele.
  **A válvula, pré-aprovada:** se a folha mostrar pré-leitor travado, sai um
  **pacote mínimo de primitivas estáveis** — os 64 nomes de casa, "acertou",
  "errou", "tente de novo". São clipes que **nenhuma edição de texto torna
  mentirosos**, então a razão pela qual o currículo §10 adia o áudio (gravar
  antes de o texto estabilizar é pagar duas vezes) simplesmente não os alcança.
  O adiamento continua valendo para a fala do professor-guia, que é o texto que
  muda.
- **Colégio São Luiz = menores fora do clube:** deixou de ser risco e virou
  **pré-condição obrigatória do B3**, com checklist de 7 itens — nenhum
  encontro do piloto 1 acontece antes dele. A pendência maior (repositório
  público × dados de menores) continua flagada no painel como "revisitar antes
  do lançamento"; o item 7 do checklist é a parte dela que este plano cumpre.

**Armadilhas já medidas (para quem for implementar):**

- `get_lesson_map`, `unlockLogic` e `TRAILS` são hard-coded em 2 trilhas e não
  conhecem nós intermediários — a cirurgia é do B2.3, e mexe em RPC recolada
  (o ratchet `verify:no-dup-rpc` vigia).
- O e2e tem os **ids das 30 aulas antigas gravados** (`e2e/helpers` e
  `e2e/data`) — a troca de seed do B3.2 sem atualizar fixtures quebra o e2e, e
  o e2e bate em produção (rodar com intenção).
- Toda RPC que concluir aula tem de manter o rabo `check_daily_missions()` +
  `recompute_user_title()` — `verify:avatar-db` reprova se a segunda sumir.
- "Missão" no código é missão **diária** (gamificação congelada). O conceito
  novo chama-se **missão de duelo** em toda parte — tabela, tipo, tela.
- O id numérico dos bots **não é estável** (seed com DELETE + identity); a
  chave do Léo é `slug='leo'`.
- Este doc não escreve contagem de entradas do `verify:all` em lugar nenhum —
  o painel mede, e o gate do painel lê todos os `.md` do repositório atrás
  exatamente dessa frase.

---

# 9. O que este plano adia, com todas as letras

| Adiado | Até quando |
|---|---|
| **Move trainer** (1º uso: T3, repertório) | plano técnico da T3 |
| **Exercício longo** (T7 a3) | plano da T7 |
| **Checklist/relatório de diagnóstico** (T7 a10) | plano da T7 |
| **Áudio do professor-guia** (~210 clipes da T1) | depois que o texto estabilizar nos pilotos — gravar antes é pagar duas vezes (currículo §10); o campo de fala fica reservado no conteúdo desde o B0 |
| **Ilustração do professor-guia** (6 expressões) | idem — o slot no painel fica reservado; nome e identidade são a pendência §14.1 do currículo |
| **Teste de posicionamento self-serve** | existir aluno sem professor (D5 cobre o piloto) |
| **Endurecer `bot_result` dos 9 bots restantes** | pós-piloto (D6 cobre o que a T1 exige) |
| **Bot ~1200 para a T4** (currículo §14.5) | decisão de produto, fora da T1 |
| **Trilhas 2–7** | dados reais do piloto da T1 (faseamento §11 do currículo) |
| **Qualquer gamificação nova** | dado de aluno real (direção de 2026-08-04) |

---

# 10. Critério de aceite — as cinco perguntas do professor

O conjunto está pronto quando o professor responde as cinco olhando o
relatório:

| # | Pergunta | Onde a resposta mora |
|---|---|---|
| 1 | Quem está com tarefa pendente? | **já responde hoje** (tarefas da fase 9) |
| 2 | Quem tentou e não conseguiu? | **já responde hoje** (progresso de tarefa); fica mais rica com as tentativas com histórico (prática contra o motor, missão de duelo, Desafio) |
| 3 | Qual competência está causando dificuldade? | **entregue pela §2.4** — agregado por turma (B3, dado real no piloto 1) |
| 4 | O que trabalhar na próxima aula? | **entregue pela §2.4** — piores competências com link da aula (B3; conferida com o professor no B5) |
| 5 | Quem está pronto para avançar? | **entregue pela §2.4 + §3.8** — revisões + críticas + Desafio (fecha no B7) |

---

# 11. O que mudou na revisão 2 (2026-08-04)

A v1 foi submetida a um **parecer externo adversarial** (ChatGPT Plus, 13
pontos), pedido de propósito para atacar o plano antes de o plano virar código.
O parecer declara não ter conseguido ler o repositório — o que faz dele um bom
leitor de **contratos implícitos** e um mau juiz de **fato medido**. Foi julgado
nessa chave: **10 pontos acatados, 2 acatados com ajuste, 1 rejeitado no
centro**. O maior serviço que ele prestou não foi apontar erro de desenho; foi
mostrar quanta coisa a v1 dava por sabida porque "a casa já faz assim".

## O que entrou

| # | O que estava frouxo na v1 | O que a rev. 2 escreve | Onde |
|---|---|---|---|
| 1 | "uma competência por aula" — mas a a26, o Desafio e os blocos avaliam competências de outras aulas | competência **atômica** com `aulas_origem` 1..N; `competencia_key` por item, atribuída no sorteio e persistida; `tema_visivel` derivado pelo servidor | §2.1, §2.2 |
| 2 | ~8 tabelas e ~6 RPCs sem uma palavra sobre idempotência, RLS ou relógio | **§2.5, o contrato de tentativa** — `submission_id` + UNIQUE devolvendo o já gravado, relógio do banco, RLS, escrita direta revogada, `search_path` fixado | §2.5, B0.0 |
| 3 | "a RPC só aceita veredito da rota" — sem dizer **como** ela sabe | os 6 passos do D6: client manda 3 campos, rota carrega o resto do banco, RPC privada com `REVOKE EXECUTE ... FROM anon, authenticated, PUBLIC` (o padrão da migration `20260725120000`), transação, idempotência | D6, B6.2 |
| 4 | sorteio efêmero — o defeito que a v1 já tinha achado no `submit_review_gate` (denominador do client) só estava consertado num lugar | **sorteio vira tentativa persistida** nos três lugares: bloco de puzzles, revisão, Desafio Final | §2.5·6, §3.5, §3.8 |
| 5 | revisão espaçada sem contrato executável | as quatro alíneas: elegibilidade declarada, "errou" zera e joga para o **próximo** nó, montagem por antiguidade com teto 45, bloco feito não reabre; parada do B2 corrigida para **D0/D1/D4/D11** | §3.6, B2 |
| 7 | `engine_practice` fora das seções contáveis | entra — sem isso as aulas 19–21 nunca fechariam | §3 intro |
| 8 | "7 jogos" × "10 usos" sem padronizar | 7 **mecânicas** em 10 aulas; onda 1 = 4 mecânicas cobrindo a1–a7 | §4 intro |
| 9 | protótipo físico dos Balões "em paralelo ao código" — contradizendo a escada barata da própria §4.3 | físico vira **B1.0, pré-condição da regra Balões**; parada intermediária no **Balões do Peão** antes das outras três configs | B1 |
| 10 | "em dificuldade" definido no B3, que é o bloco que já precisa dele | **régua provisória v1 escrita agora** (≥3 erros **e** ≥50% nas últimas 10; erro sem tema visível conta dobrado), recalibrada com dado do piloto; denominador sempre na tela | §2.3, B3.4 |
| 11 | áudio adiado × "casa ditada" × "criança faz sozinha" não cabiam juntos | piloto 1 declarado **assistido**; *Ache a Casa* com a casa em **texto grande**; válvula pré-aprovada das **primitivas estáveis** | §4.2, §8, B3 |
| 12 (metade) | `soldado` some junto com a `recruta`, sem distinguir os casos | `soldado` **sai de vista** (mapa, `TRAILS`, unlock) e só é apagada com o seed da T2 | D1 |
| 13 | consentimento como linha de risco | **pré-condição obrigatória do B3**, checklist de 7 itens | B3 |

## O que foi rejeitado, e com que fato

**Ponto 6 — "o gate não pode depender do banco remoto; crie um manifesto
versionado".** Rejeitado no centro. A cadeia de gates desta casa é
**deliberadamente** ligada ao banco: `verify:turmas`, `verify:revanche` e
`verify:seeds` conectam via `postgres` + `getDbUrl()` e rodam assim no CI, com
as credenciais vindo de `process.env` (documentado no CLAUDE.md). E o incidente
que este projeto registrou é o **oposto** do medo do parecer — "gate verde não é
banco migrado": foi o gate **cego ao banco real** que deixou passar um deploy
quebrado. Um manifesto versionado do conteúdo do banco seria uma segunda fonte
de verdade divergindo em silêncio, que é exatamente a doença que o
`docs/ESTADO.md` existe para matar.
**O que foi acatado do ponto 6:** a separação entre **medir** e **cobrar** — o
B0.3 agora tem três passos (medir → decidir origem → cobrar) — e a separação
entre **gate sobre fixture** e **leitura humana de dado real**, no `verify:competencia`
do B7.

**Ponto 12 (a outra metade) — "vete a remoção física da trilha antiga; esconda
em vez de apagar".** Rejeitado para a `recruta`, por fato de schema que o
parecer não tinha como ver: existe `CREATE UNIQUE INDEX idx_lessons_trail_order
ON public.lessons(trail, trail_order)`. As 26 aulas novas ocupam
`('recruta', 1..15)`; a linha antiga **tem** de sair para a nova entrar. Não há
opção "esconder" disponível. A reversibilidade que o parecer queria já existe
por outra via: o conteúdo antigo está nas migrations versionadas no git.

## O que não mudou

As **doses não foram tocadas** — nenhum ponto do parecer mexe em quantidade de
posição, e as somas continuam sendo as da §6 do currículo (115 do banco,
conferidas na §5.2). As seis decisões continuam seis. Os oito blocos continuam
oito; B0 e B1 ganharam itens, nenhum bloco nasceu ou morreu. E o status do
documento é o do cabeçalho: **plano, não execução** — nenhum bloco da §7 começa
sem tarefa aberta.

---

# 12. O que mudou na revisão 3 (2026-08-04)

Revisão interna, com método diferente do da rev. 2: em vez de parecer sobre o
texto, **verificação claim a claim contra o repositório e contra o currículo**
— três varreduras paralelas cobrindo migrations, `src/`, gates, e a tabela da
§6 do doc 01. O resultado inverte o da rev. 2: **a base factual da v2 se
sustentou quase inteira** (índice único das aulas, REVOKEs da `20260725120000`,
`xp_gained: 0`, `bot_result` só medindo comprimento, denominador do
`submit_review_gate` vindo do client, as 12 cópias de `puzzle_attempt`, o Léo
por `slug`, as 2 trilhas hard-coded, "primeira rota server-compute", zero
ocorrências de competência, e a soma 115). O que a verificação achou foi **uma
contradição interna, duas lacunas de desenho e sete imprecisões de reuso**.

## Os três de fundo

| # | O defeito | O que a rev. 3 escreve | Onde |
|---|---|---|---|
| 1 | **Contradição:** a §2.2/§2.3 derivavam *consolidada* só de revisão, arena e Desafio; a §3.7 marcava *consolidada* no duelo do Léo, que exibe os critérios na tela. Quem implementasse pela §2.2 gravaria *praticada* | a missão de duelo entra na §2.2 como **exceção declarada**, com o motivo (conduzir dez lances e vencer ≠ reconhecer tema provocado) — o servidor volta a ter uma regra só | §2.2, §2.3, §3.7 |
| 2 | **Lacuna:** o D6 fechava posição adulterada e veredito forjado, mas os lances do motor chegam dentro do PGN — o replay não prova que o adversário foi o Stockfish. E o plano declarava os riscos aceitos dos outros formatos, não este | seção nova **"o que este desenho não prova"**: risco aceito e escrito, com a razão de não fechá-lo (motor no servidor é vetado; heurística tem falso positivo caro) e a consequência de leitura — *praticada* por motor é evidência mais fraca que *consolidada* por revisão | D6, §8 |
| 3 | **Lacuna:** o Desafio Final exigia 12 itens, retry "com posições diferentes" e corretivo por competência — sem dizer de onde sai o pool. O currículo também não diz (a §4 de lá não tem coluna de Desafio) | régua **pool ≥ 5× itens por categoria = 60 posições**, origem decidida no B0.3 junto com o mapa, **linha própria na tabela 5.2**, cobrança no `verify:curriculo-banco`, e **formato do item fixado em um lance** (técnica de vários lances é medida na prática contra o motor) | §3.8, §5.2, §5.3, B0.3, B7.3 |

## Os três de execução

| # | O defeito | O que a rev. 3 escreve | Onde |
|---|---|---|---|
| 4 | "o gate `verify:avatar-db` já reprova se `recompute_user_title` sumir" — medido, ele lê **só a definição de `complete_lesson_step`**; as ~6 RPCs irmãs nasceriam fora da vigilância, com o rabo valendo por costume | o B0.0 encomenda a **extensão do gate para uma lista de RPCs que concluem aula**, alimentada a cada formato | §3, B0.0 |
| 5 | duas paradas dependiam de conteúdo de bloco **posterior**: B4 pedia a lição do Mate do Pastor (autorada no B5.1) e B6 media o Stockfish "nas posições da a20" (autoradas no B7.1) | ambas passam a medir **amostra do tipo certo** — lição de teste com erro no meio; posições do tipo da a20 com os presets pretendidos. A intenção era sempre medir antes de autorar | B4, B6 |
| 6 | o bug das Conquistas era referência pendurada ("§8", que não fala disso) e sem causa | causa medida no doc, pela Regra de Evidência: o relatório pede `achievement_key`, coluna inexistente em `user_achievements` (o schema tem `achievement_id`); o erro é engolido e o card mostra sempre "0 conquistas" | §2.4, B3.4 |

## As imprecisões de reuso, corrigidas

Todas do mesmo tipo — o plano prometia herdar pronto o que é trabalho:

- **índice tema+rating dos puzzles** não existe como composto; são dois
  separados (GIN de temas, btree de rating). A contagem "50.001" só vive em
  docs, sem gate — virou "~50 mil". *(§1)*
- **teto de 30 da revanche** é atraso (+1 dia), não bloqueio; o teto de 45 do
  bloco de revisão é semântica **nova**. *(§3.6)*
- **utilitário de FEN sem reis** é um `catch` inline não exportado do
  `LessonViewer` (a cópia do `ReviewGate` nem o tem), e sem reis o tabuleiro
  perde os lances legais — o mecanismo real da casa é `dim_kings`. *(§3.1)*
- **presets do Stockfish** não moram no `StockfishEngine.ts`: são colunas
  `skill_level`/`depth` da tabela `bots`; a seção traz os seus. *(§3.2)*
- **D1** dizia que as 26 aulas ocupam `('recruta', 1..15)` — ocupam 1..26; só
  15 colidem com o índice único, e o B3.2 dizia "sai o conteúdo antigo das duas
  trilhas", contradizendo a própria D1 (a `soldado` fica na tabela). *(D1, B3.2)*
- **relógio do banco** não cabe no timer de 5s do *Vale ou Não Vale*: exceção
  declarada — o client conta, o servidor confere a duração total. *(§2.5)*
- **as 5 competências críticas** não têm aula atribuída pelo currículo (o
  mapeamento é deste plano, agora dito), e o texto da crítica 1 cita **peça
  cravada**, tema de T2 — na T1 ela cobre xeque e casa atacada, para o Desafio
  não cobrar o que nenhuma aula ensinou. *(§2.1)*
- a régua de "em dificuldade" chama de taxa um quociente que, com o erro
  dobrado, passa de 100%: é **peso**, e a comparação com 50% segue definida.
  A citação da regra do produto recupera a palavra "posterior" do original.
  *(§2.3)*

## O que não mudou

**Nenhuma dose, nenhuma decisão, nenhum bloco.** As seis decisões continuam
seis (D6 ganhou limite declarado, não outra recomendação); os oito blocos
continuam oito; a soma 115 do banco está conferida contra a §6 do currículo
célula a célula, e o pool do Desafio **não entra nela** — é reservatório de
prova, não dose de aula. O status também não muda: **plano, não execução**.
