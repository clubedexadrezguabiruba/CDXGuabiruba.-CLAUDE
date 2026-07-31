# Currículo Recruta 64 — v1

> **Status:** aprovado em 2026-07-30 · **revisão 4** (2026-07-31): duas decisões de
> execução — prática contra o motor e posições vindas dos livros — mais as correções
> da auditoria externa (§16). A revisão 3 fica registrada na §15.
> **Escopo:** só o conteúdo pedagógico. O plano técnico é documento separado, ainda não escrito.
> **Supersede a §5 do `Recruta64_Visao_do_Produto_v1.md`.**

---

## 1. O diagnóstico do que existe hoje

| | |
|---|---|
| Aulas | 30, em 2 trilhas (Recruta 15, Soldado 15) |
| Exercícios | 113 — **todos de um lance só** |
| Demonstrações | 14 (o aluno assiste, não joga) |
| Mini-jogos | **nenhum** |
| Aulas de abertura nomeada | **nenhuma** |
| Aulas de estratégia | **nenhuma** |
| Aulas de defesa | **nenhuma** |
| Aulas de final | 3 |
| Trilhas 3 a 7 | existem no `CHECK` da coluna `lessons.trail`, **sem uma aula sequer** |

---

## 2. Os cinco princípios da grade

**1. Espiral, não gaveta.** Toda trilha toca as seis áreas — abertura, tática, defesa, estratégia, finais e treino. O que muda de uma trilha para a outra não é o assunto, é a profundidade.

**2. Uma competência principal por aula.** Conceitos auxiliares só entram quando forem necessários para completar essa competência.

**3. Aula apresenta; o volume consolida.** Concluir uma aula significa **demonstrar compreensão inicial**, não domínio. O domínio vem de prática independente, revisão espaçada e posições misturadas sem o nome do tema.

**4. O exercício é o conteúdo.** Nenhuma aula deste currículo é só leitura.

**5. Treinar conta como aprender.** Puzzles, mini-jogos, duelos com missão e **blocos de revisão** são nós obrigatórios da trilha. Não são extras puláveis.

---

## 3. A grade

**126 aulas · 7 trilhas · as seis áreas em todas elas.**

| # | Trilha | Vira | Referência | Aulas | Acum. | Faixa de referência |
|---|---|---|---|---|---|---|
| 1 | Recruta | Soldado | Passo 1 | 26 | 26 | iniciante absoluto |
| 2 | Soldado | Aspirante | Passo 2 | 21 | 47 | ~600–900 |
| 3 | Aspirante | Capitão | Passo 3 | 19 | 66 | ~900–1200 |
| 4 | Capitão | Comandante | Passo 4 | 18 | 84 | ~1200–1500 |
| 5 | Comandante | General | Passo 5 | 17 | 101 | ~1500–1800 |
| 6 | General | Grão-Mestre | Passo 6 | 14 | 115 | ~1800–2100 |
| 7 | Mestre | Lenda | autonomia | 11 | 126 | 2100+ |

> **Régua de patentes:** `title_tiers.lessons_required` passa de `tier * 15` para o
> acumulado real — **0 · 26 · 47 · 66 · 84 · 101 · 115 · 126**. É `UPDATE` em dados,
> nunca edição de função.

> **Sobre os dois rótulos que não coincidem:** completar a T6 veste a patente
> **Grão-Mestre** (`title_tiers`, tier 6), mas a trilha 7 se chama **Mestre** — o slug
> `mestre` no `CHECK` de `lessons.trail`. Os dois nomes são dados reais do produto,
> vindos de decisões diferentes. Fica registrado para ninguém "corrigir" um pelo outro.

### A ementa real do método holandês, e o que fazemos com ela

Lida do site oficial, por Passo. Cada Passo tem manual + caderno básico + cadernos *extra*, *plus* e *mix*.

| Passo | Aulas | Caderno básico | Temas |
|---|---|---|---|
| **1** | 15 | **486 posições** | tabuleiro e peças · movimentos · atacar e capturar · o peão · **defender** · xeque e sair do xeque · mate (1) · mate (2) · roque · troca vantajosa · ataque duplo · **empate** · mate com a dama · en passant · notação |
| **2** | 13 | **514** | atividade das peças · ataque duplo de dama (1 e 2) · a cravada · eliminação da defesa · **as 3 regras de ouro** · mate em dois · ataque duplo de T/B/C/R · mate com a torre · ataque descoberto · **defender-se do mate** · o lance intermediário · testes |
| **3** | 17 | *extra* 619 | completar a abertura · xeque duplo e descoberto · atacar a peça cravada · mate após ganhar acesso · **o quadrado do peão** · eliminar a defesa · **defender-se do ataque duplo** · mini-planos · empates · raio-X · a abertura · **defender-se da cravada** · mobilidade · casas-chave (1 e 2) · peças cravadas · ameaças |
| **4** | 17 | *extra* 629 | vantagem de abertura · interferência · atração · bloqueio · pensar à frente · cravada por atração · o peão passado · eliminar a defesa · o ímã · **peões fracos** · **vantagem material** · caçar e mirar · ataque ao rei · sétima fileira · estratégia de finais · desobstrução · dama contra peão |
| **5** | 16 | mais de 600 | material e tempo · mate · **ruptura** · como usar os peões · corrida de peões · sétima fileira · ataque descoberto · a cravada · a abertura · torre contra peão · casa forte · **defender** · final de torre · ataque ao rei · coluna aberta · empates |
| **6** | 14 | ~1.320 | **o rei no centro** · o peão passado · **estratégia** · mobilidade · empate · abertura · **tática** · finais de peão · bispo ou cavalo · ataque ao rei · vantagem no final · bispos · **defender** · finais de torre |

**O que isso muda no nosso currículo:**

- **Defesa vira coluna.** O método ensina defesa nos Passos 1, 2, 3, 5 e 6. Em 120 aulas nós tínhamos **duas** (T4 e T6). A coluna completa tem **seis — uma por trilha até a T6**: T1 a12, T2 a17, T3 a9, T4 a7, T5 a15 e T6 a6 (a §16 conserta a conta da revisão 3, que dizia "uma" e criou quatro sem fechar a T5).
- **Empate vira aula.** O Passo 1 tem "empate" como aula própria. Nós tínhamos afogamento espremido dentro de "Xeque, Mate e Afogamento".
- **"Passo 6 = tática sem dica" era falso.** Tática é 1 de 14 aulas do Passo 6; o programa dele é sobretudo estratégia e finais. A frase descrevia os cadernos *mix*, não o programa.
- **A comparação de volume precisa de ressalva.** Os 486 e 514 são **posições distintas**; a nossa contagem inclui repetições espaçadas da mesma posição. São grandezas parecidas, não iguais.

**Não adotamos equivalência integral com o Método Steps** — usamos a sequência dele, os temas e o princípio de prática extensa como referência. O nosso currículo tem 126 aulas contra as 92 do método porque inclui arenas de treino e aberturas nomeadas, que o método não trata como aula.

### Sobre "Passo N" e sobre as faixas

**O rótulo "Passo N" já é do produto**: está em `title_tiers.level_name` desde 2026-07-29, e a migration `20260729140000_patente_marcos_15_aulas.sql` registra o motivo. Ele fica. O que **não** afirmamos é equivalência de rating: as fontes públicas divergem entre si em até 500 pontos sobre as faixas de cada Passo.

**As faixas são referência pedagógica, não garantia**, e são medidas na régua do próprio site — o rating de puzzles do Recruta 64 e a escada de Elo dos bots (Léo 250 → Helena 1600). **Não são FIDE** e não se convertem para outras plataformas.

### As outras duas fontes

- **Yusupov** dá o **formato da aula avançada** (T4 a T7): lição focada, teste no fim, tema revisitado em três voltas.
- **de la Villa** dá a **coluna de finais** — uma seleção progressiva das principais famílias que ele aborda. O livro digital (*100 Endgames You Must Know*) **foi adquirido** e é fonte direta de posições (§4 e §12); a ressalva antiga sobre confundir os dois livros de título parecido deixa de valer para as posições — citamos da edição que temos. Mates elementares vêm da tradição escolar, não dele.

### Onde cada área aparece

| | T1 | T2 | T3 | T4 | T5 | T6 | T7 |
|---|---|---|---|---|---|---|---|
| Fundamentos (as regras) | 10 | — | — | — | — | — | — |
| Abertura | 2 | 3 | 3 | 3 | 3 | 3 | 2 |
| Tática | 3 | 8 | 5 | 3 | 3 | 2 | 2 |
| **Defesa** | **1** | **1** | **1** | **1** | **1** | **1** | — |
| Estratégia e meio-jogo | 2 | 3 | 4 | 4 | 4 | 4 | 3 |
| Finais | 4 | 2 | 3 | 4 | 4 | 3 | 2 |
| Arena (treino) | 4 | 4 | 3 | 3 | 2 | 1 | 2 |
| **Total** | **26** | **21** | **19** | **18** | **17** | **14** | **11** |

A T7 não tem aula de defesa porque a trilha inteira é sobre autonomia; a defesa lá é o que o aluno diagnostica sozinho.

---

## 4. O volume de prática

O caderno básico do Passo 1 tem **486 posições**; o do Passo 2, **514**. A primeira versão deste currículo entregava ~150 na trilha 1 — **um terço**. Aula que apresenta o garfo em 5 posições fáceis não faz ninguém reconhecer um garfo numa partida.

**A correção não é escrever mais aulas. É usar o banco — e os livros.** O site tem **50.001 puzzles do Lichess** com tema e rating indexados; a estante tem os cadernos que já validaram essas posições em sala (§ "De onde vêm as posições", abaixo).

### Os quatro momentos de cada competência

| Momento | Onde acontece | Quem carrega |
|---|---|---|
| **Demonstração guiada** | dentro da aula | demo ou lição interativa |
| **Prática com feedback** | dentro da aula | exercícios com dica e explicação |
| **Prática independente** | dentro da aula e nas arenas | blocos de puzzles do banco sem dica de tema, e **prática contra o motor** |
| **Revisão misturada e espaçada** | **blocos obrigatórios da trilha** | ver abaixo |

### A revisão espaçada é obrigatória — e como isso não trava a criança

**Decisão:** os blocos de revisão são **nós obrigatórios da trilha**. Sem fazê-los, o aluno não chega ao Desafio Final. É o que torna os números abaixo um piso, e não uma expectativa.

O risco óbvio de tornar isso obrigatório é a trilha parar porque o intervalo ainda não venceu. A saída, e é assim que fica escrito:

- Cada trilha tem **3 blocos de revisão** em pontos fixos — T1: depois das aulas **10, 18 e 26** · T2: **7, 14 e 21** · T3: **6, 12 e 19** · T4: **6, 12 e 18** · T5: **6, 12 e 17** · T6: **5, 10 e 14** · T7: **4, 8 e 11**.
- Cada bloco tem **~⅓ da coluna "Revisão" da trilha** (30 a 45 posições). Posição **errada volta** em bloco seguinte; posição acertada gradua com **intervalo crescente** (base 1 → 3 → 7 dias). O terceiro bloco de cada trilha inclui **~um terço de posições da trilha anterior** — a retenção não morre no Desafio Final.
- Um bloco só abre quando as posições que ele revisa **venceram o intervalo**.
- Se o aluno chega e o bloco ainda não venceu, ele vê *"volte amanhã"* e **pode seguir para a próxima aula normalmente**.
- O bloco fica pendente e **trava apenas o Desafio Final**, não a trilha inteira.

Obrigatório para concluir, nunca bloqueante no dia a dia. Quem some por uma semana volta com os blocos vencidos e prontos, não travado.

### De onde vêm as posições

Três origens, nesta ordem:

1. **Os livros comprados.** Os cadernos digitais do **Método Steps** (por Passo) e o **de la Villa** (*100 Endgames You Must Know*) foram adquiridos e são fonte direta (§12). **Posição e sequência de lances são fato — não têm direito autoral. Texto, título e explicação são obra — têm.** As três regras do pipeline:
   - posição entra; explicação **nunca** — todo texto é redigido do zero, na nossa voz (Bíblia Tonal);
   - **nunca reproduzir um caderno inteiro na ordem dele** — a seleção em bloco de uma obra é onde mora o risco; as posições entram misturadas entre fontes, reordenadas pela nossa grade e re-selecionadas por competência;
   - a origem fica num campo interno (`source`), que nunca aparece na tela.

   O que sai de onde: fundamentos e técnica da T1–T2, dos cadernos dos Passos 1–2; a coluna de finais (lições e prática contra o motor), do de la Villa; as posições de missão (o final ganho da Helena, os mates contra o motor), idem — sempre com **validação por motor antes de entrar**: o objetivo declarado tem que ser verdadeiro (mate em N é mate em N; ganho ganha; empate segura).
2. **O banco Lichess** (50.001 puzzles, CC0, tema + rating): blocos de prática independente, arenas e revisão — mediante o gate abaixo.
3. **Posição gerada (à mão ou por IA): último recurso.** Só entra com validação automática por motor **e** revisão humana. Gerar é barato; validar é caro — por isso as origens 1 e 2 vêm primeiro.

**O gate do lastro** (`verify:curriculo-banco`, a criar no plano técnico): antes de cada entrega, para cada bloco do banco daquela trilha, contar quantos puzzles existem com o tema e a faixa de rating pedidos. Bloco sem **3× a dose** de lastro não entra como banco — a dose migra para os livros. A conta da tabela não muda; muda a origem. Motivo: a taxonomia do Lichess é majoritariamente tática de quem ataca; defesa, temas posicionais e a faixa do iniciante absoluto podem não ter lastro, e ninguém auditou ainda.

### A regra de dose — o que cada tipo de aula entrega

- Aula de **tema com tag no banco** (tática, mate, final com tema): fecha com bloco do banco de **10 a 25 puzzles**, escrito na coluna Treino.
- Aula de **técnica** (mates elementares, finais teóricos): fecha com **prática contra o motor** (§5) — 2 a 3 posições jogadas até o objetivo. Posições dos livros, não do banco.
- Aula de **estratégia ou abertura sem tag**: a prática é da própria aula (exercícios, lições, quiz). Sem bloco do banco fantasma.
- **Arena de puzzles**: 25 a 30 do banco.
- **Bloco de revisão**: ~⅓ da coluna "Revisão" da trilha.

### Meta de posições por trilha

Cada linha é **a soma das células da §6** — a tabela deixou de ser promessa para ser conta. "Nas aulas" é a única coluna estimada (~): soma exercícios, demos, quizzes e lições interativas. Cada posição "contra o motor" é uma partida-técnica inteira (10 a 30 lances de decisão): conta como 1 e rende mais que 1.

| Trilha | Nas aulas | Do banco | Contra o motor | Revisão obrigatória | **Total** |
|---|---|---|---|---|---|
| 1 Recruta | ~130 | 115 | 8 | ~130 | **~383** |
| 2 Soldado | ~110 | 220 | 5 | ~135 | **~470** |
| 3 Aspirante | ~95 | 185 | 5 | ~120 | **~405** |
| 4 Capitão | ~90 | 160 | 11 | ~120 | **~381** |
| 5 Comandante | ~90 | 125 | 10 | ~100 | **~325** |
| 6 General | ~65 | 85 | 9 | ~90 | **~249** |
| 7 Mestre | ~60 | 25 | 6 | ~60 | **~151** |

**Ressalva honesta:** a revisão 3 prometia ~535 na T1 com ~270 "do banco" que nenhuma aula especificava — o mesmo defeito de "um terço" que este documento confessa lá em cima, só que mudado de coluna. Agora o número é menor e **verdadeiro**: ~383 posições especificadas na T1, contra 486 posições distintas do caderno do Passo 1. A diferença encolhe quando se contam as repetições dos mini-jogos (sem dose fixa) e as novas tentativas — e, quando os dados de uso pedirem mais volume, o caminho é **subir dose de bloco**, nunca inflar a tabela.

### A regra que fica escrita no produto

> **Concluir uma aula significa demonstrar compreensão inicial. O domínio é confirmado
> por prática independente, revisão espaçada e aplicação posterior em posições
> misturadas — sem o nome do tema na tela.**

Consequência: **o Desafio Final, os blocos de revisão e as arenas mistas nunca dizem qual é o motivo.** Arena de tema único (Caça ao Mate em 1, Finais de Torre) existe e é legítima — treina velocidade de padrão *depois* da aula. O que não existe é dica de tema em prova, em revisão ou em arena mista: dizer "esta é de garfo" transforma reconhecimento em execução, que é o exercício errado.

---

## 5. Do que uma aula é feita

| Formato | O que é | Para quê |
|---|---|---|
| **Texto com diagrama** | explicação curta, casas destacadas, setas | dar o nome à coisa |
| **Demonstração** | sequência que o aluno assiste, comentada lance a lance | mostrar antes de pedir |
| **Exercício** | uma posição, um lance certo | fixar o padrão |
| **Lição interativa** | o aluno joga, **o adversário responde**, o erro diz "tente de novo" com explicação, e a linha segue até o fim | ensinar tudo que leva mais de um lance: técnica de mate, plano, defesa, conversão |
| **Prática contra o motor** | uma posição dada, um lado, um objetivo — mate, converter, segurar o empate — e o aluno joga **contra o motor** até cumprir ou estourar o orçamento de lances | provar execução contra resistência de verdade: técnica só é sua quando funciona fora do trilho |
| **Quiz** | pergunta de escolha, sobre conceito | o tabuleiro ensina *o quê*; o quiz ensina *por quê* |
| **Mini-jogo** | regra própria, curta, com placar | treinar uma habilidade isolada até virar automática |
| **Arena** | aula inteira de treino: puzzles, mini-jogo ou duelo com bot | fazer muito da mesma coisa |
| **Bloco de revisão** | posições vencidas de aulas anteriores, misturadas | consolidar |

A **lição interativa** é a peça que mais muda o currículo. Hoje o exercício aceita um lance e o adversário não responde — por isso não existe uma única aula que ensine *técnica*.

A **prática contra o motor** é a segunda peça nova, e responde o que a lição interativa não responde: a lição tem trilho — o adversário joga o que o roteiro previu. O formato (inspirado na seção *Practice* do lichess, "play with the computer") define **cinco campos por posição**: posição inicial, lado do aluno, objetivo, orçamento de lances e força do motor. Errou, recomeça a posição — não a aula. O Stockfish já roda no navegador do site; contra rei solitário ele defende no máximo, que é exatamente o que testa a caixa que encolhe. Concluir vale progresso, então a validação do resultado é a mesma esteira server-side que já valida o PGN dos bots. Dois parentes que o currículo já tinha: o **Treino de Ataque** (T4 a17) é prática contra o motor com placar; a **missão da Helena** (T5 a17) é prática contra o motor com missão.

### O checklist que atravessa o currículo

A partir da T1 a11, toda aula termina com a mesma pergunta, e ela reaparece nas arenas:

> **O que ele ameaça? Tem xeque? Tem captura? Tem peça solta?**

Não é uma aula: é um hábito. De 0 a 900 rende mais que qualquer nomenclatura.

### Desafio Final — blueprint por trilha

Uma distribuição única não serve para todas: a T1 tem 10 aulas de fundamentos e a T6 nenhuma. Cada trilha tem o seu, e a **missão de bot sai da prova** — uma partida leva minutos e não equivale a um exercício de segundos.

| Trilha | Itens | Composição | Corte | Missão prática à parte |
|---|---|---|---|---|
| 1 | 12 | 4 regras e visão · 3 tática · 2 finais · 2 abertura · 1 defesa/empate | 10 | duelo com Léo |
| 2 | 12 | 5 tática · 2 defesa e mate · 2 finais · 2 abertura · 1 estratégia | 10 | duelo com Skippy |
| 3 | 12 | 4 tática · 2 defesa · 3 finais · 2 abertura · 1 estratégia | 10 | duelo com Íris |
| 4 | 14 | 4 tática · 4 finais · 3 estratégia · 2 abertura · 1 defesa | 12 | Treino de Ataque (a17), contra o motor |
| 5 | 14 | 3 cálculo · 4 finais · 4 estratégia · 3 abertura | 12 | duelo com Helena |
| 6 | 14 | 5 sem tema · 4 decisão e estratégia · 3 finais · 2 abertura | 12 | torneio simulado |
| 7 | 16 | 6 sem tema · 4 finais · 4 avaliação · 2 abertura | 14 | — |

O corte fica **entre 83% e 88%** (10/12, 12/14, 14/16) — sempre acima do piso de 80% da literatura de *mastery learning*; o sistema atual (7/10) está abaixo disso. **Tentativas são ilimitadas** e a reprovação leva a **treino corretivo dirigido** ao que o aluno errou; a prova volta com posições diferentes.

**Competências críticas da Trilha 1** — erro nelas reprova mesmo com a nota:

1. **Executar um lance legal** em posição com xeque, casa atacada ou peça cravada.
2. Sair do xeque pelas três vias: fugir, capturar, tapar.
3. Distinguir xeque-mate de afogamento.
4. Capturar uma peça sem defensor quando a captura é segura.
5. Salvar a própria peça atacada quando existe resposta que a salva.

> A competência 1 mudou de redação. "Não tentar lance ilegal" **não é avaliável**: o
> tabuleiro bloqueia lances ilegais por construção, então a tentativa nunca chega a
> ser registrada. A redação nova mede a mesma coisa por uma via que existe.

---

# 6. AS 126 AULAS

## Trilha 1 — Recruta · 26 aulas · iniciante absoluto

**Meta:** conhece todas as regras, sabe o que fazer quando a peça dele é atacada, dá os mates elementares, não perde partida ganha por afogamento e adquire o hábito do checklist.

**Todo mundo começa na aula 1.** Por isso as 10 aulas de fundamentos são **deliberadamente curtas**: 4 a 6 exercícios cada (a dos três lances especiais é a exceção — 9, três por regra), com o mini-jogo carregando a repetição.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | O Tabuleiro, as Casas e a Notação | nomear qualquer casa de olhos fechados — *ler lances completos vem com o uso, ao longo da trilha* | 4 exercícios · *Ache a Casa* |
| 2 | O Peão | anda uma casa (duas na estreia) e captura na diagonal — *o que acontece quando chega ao fim fica para a aula 9* | demo · 5 exercícios · *Balões do Peão* |
| 3 | A Torre | anda em linha e coluna, e o que a bloqueia | demo · 5 exercícios · *Balões da Torre* |
| 4 | O Bispo | anda na diagonal e **nunca muda de cor** | demo · 5 exercícios · *Balões do Bispo* |
| 5 | A Dama | é torre e bispo na mesma peça | demo · 5 exercícios · *Balões da Dama* |
| 6 | O Cavalo | o pulo em L, e que ele **pula por cima** | demo · 4 exercícios · *Cavalo Faminto* |
| 7 | O Rei e as Casas Atacadas | o rei anda uma casa e **nunca entra em casa atacada** | demo · 5 exercícios · *Zona Proibida* |
| 8 | Xeque e Xeque-Mate | o que é xeque, as três saídas, e quando não há saída | 2 demos · 6 exercícios |
| 9 | Roque, En Passant e Promoção | os três lances especiais e quando cada um é permitido — *as proibições do roque usam o xeque da aula 8; por isso ela vem depois* | 2 demos · 9 exercícios (3 por regra) |
| 10 | **Empate — as cinco formas** ⊕ | afogamento, repetição, 50 lances, material insuficiente, acordo — e **não afogar quando está ganhando** | demo · 6 exercícios · 10 puzzles |
| 11 | Peça Pendurada — e o checklist | ver o que está solto **antes** de jogar; o checklist entra aqui e não sai mais | 6 exercícios · 15 puzzles |
| 12 | **Sua Peça Está Atacada — as cinco respostas** ⊕ | fugir, **capturar o atacante**, defender, tapar a linha, contra-atacar — e escolher qual | demo · 7 exercícios · 15 puzzles |
| 13 | O Valor das Peças | a tabela — e as duas situações em que ela mente | quiz · 4 exercícios |
| 14 | Mate em 1 | reconhecer os padrões de mate imediato | 8 exercícios · 20 puzzles |
| 15 | Contar Defensores | decidir se a troca vale a pena — *usa a tabela da aula 13* | demo · 5 exercícios · 10 puzzles · *Vale ou Não Vale* |
| 16 | O Centro | por que e4, d4, e5 e d5 valem mais que as outras 60 casas | demo · 4 exercícios |
| 17 | **As Três Regras de Ouro da Abertura** | centro, desenvolver, rei seguro — **três prioridades, não uma receita fixa** | 2 demos · quiz · 5 exercícios |
| 18 | Mate do Pastor e como não cair nele | reconhecer a ameaça e ter as duas defesas na ponta da língua | lição interativa · 4 exercícios |
| 19 | **O Mate da Escada** ⊛ | duas torres (ou dama e torre) alternando barreiras até a borda — o primeiro mate técnico, antes dos que precisam do rei | lição interativa · 2 posições contra o motor |
| 20 | Mate com Dama e Rei | a caixa que encolhe, sem afogar | lição interativa até o mate · 3 posições contra o motor |
| 21 | Mate com Torre e Rei | cortar o rei e empurrar com o apoio do próprio rei | lição interativa até o mate · 3 posições contra o motor |
| 22 | A Corrida dos Peões | contar tempos numa corrida de promoção com peões dos dois lados | demo · 5 exercícios |
| 23 | **Arena: Duelo com Léo** | vencer o bot construindo a base — a aula 17 na prática | partida com missão |
| 24 | Arena: Guerra de Peões | promover antes do adversário, só com peões | mini-jogo contra bot |
| 25 | Arena: Caça ao Mate em 1 | velocidade no padrão de mate em 1 | 25 puzzles |
| 26 | Arena: Come-Peões e o Checklist | capturar todos os peões; a arena cobra o checklist a cada lance | mini-jogo · 20 puzzles mistos |

⊕ = aula nova na revisão 3 · ⊛ = aula nova na revisão 4. Blocos de revisão obrigatórios após as aulas **10, 18 e 26**.

## Trilha 2 — Soldado · 21 aulas · ~600–900

**Meta:** tem os oito motivos táticos na mão, sabe rocar na hora certa, ganha um final de rei e peão, não perde por mate na última fileira e sabe se defender de uma ameaça de mate.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | Desenvolvimento com Ameaça | desenvolver ganhando tempo, em vez de só desenvolver | demo · 5 exercícios |
| 2 | Cinco Erros Típicos de Abertura e como puni-los | reconhecer o erro e a punição — não decorar armadilha | 5 lições interativas curtas |
| 3 | Por que não sair com a dama cedo | o custo real dos tempos perdidos | demo · quiz · 4 exercícios |
| 4 | Garfo | atacar duas peças de uma vez, com qualquer peça | 6 exercícios · 25 puzzles |
| 5 | Cravada | a absoluta e a relativa, e por que são diferentes | 6 exercícios · 25 puzzles |
| 6 | Espeto | a cravada ao contrário | 5 exercícios · 20 puzzles |
| 7 | Ataque Descoberto e Xeque Duplo | a peça que sai e a que fica | demo · 6 exercícios · 20 puzzles |
| 8 | Eliminar o Defensor | derrubar quem sustenta | 5 exercícios · 20 puzzles |
| 9 | Mate em 2 | ver dois lances à frente numa sequência forçada | 8 exercícios · 25 puzzles |
| 10 | A Coluna Aberta e a Torre | onde a torre pertence | demo · 5 exercícios |
| 11 | Rei Seguro | quando rocar, para que lado, e quando **não** rocar | quiz · 5 exercícios |
| 12 | Peça Boa, Peça Ruim | a primeira leitura posicional: quem está trabalhando? | quiz · 4 exercícios |
| 13 | **Rei contra Peão — a Regra do Quadrado** | decidir de olho se o rei alcança o peão | lição interativa · 5 exercícios · 2 posições contra o motor |
| 14 | A Oposição | tomar e ceder a oposição em rei e peão contra rei | lição interativa · 6 exercícios · 3 posições contra o motor |
| 15 | Mate na Última Fileira e a Casa de Fuga | o mate que mais decide partida nessa faixa, e como se prevenir | demo · 6 exercícios · 20 puzzles |
| 16 | Rede de Mate | tirar as casas antes de dar o xeque | demo · 6 exercícios |
| 17 | **Defender-se do Mate** ⊕ | as cinco saídas quando o mate está ameaçado: capturar o atacante, **defender a casa do mate**, bloquear a linha, dar casa ao rei, ganhar tempo com xeque ou ameaça maior | demo · 7 exercícios · 20 puzzles |
| 18 | **Arena: Duelo com Skippy** | vencer sem entregar peça de graça | partida com missão |
| 19 | Arena: Táticas em Série | 30 posições misturando tudo, **sem dizer qual é qual** | 30 puzzles |
| 20 | Arena: Zona Proibida Avançada | atravessar sem pisar em casa atacada, com mais peças | mini-jogo |
| 21 | Arena: Escolta do Peão | levar o peão à promoção com o rei ajudando | mini-jogo · 15 puzzles de final |

⊕ = aula nova na revisão 3. Blocos de revisão obrigatórios após as aulas **7, 14 e 21**.

> **Mate com Dois Bispos não está aqui** — é técnica rara e difícil para essa faixa;
> foi para a **Biblioteca de Finais** (§9).

## Trilha 3 — Aspirante · 19 aulas · ~900–1200

**Meta:** tem um **repertório-base** de três posições iniciais, faz um plano de três lances, sabe se defender de uma tática e sabe de véspera se o final está ganho.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | **A Italiana** | a primeira abertura de brancas, pelas ideias e não por lances decorados | 2 demos · 3 lições interativas |
| 2 | **Contra 1.e4 — a Escandinava** | uma resposta que ele entende e repete sempre — **e a exceção que confirma a T2 a3**: aqui a dama sai cedo porque sai *em segurança* e volta *com tempo*; a aula abre explicando isso | 2 demos · 3 lições interativas |
| 3 | **Contra 1.d4 — o Gambito da Dama Recusado** | ...d5, ...e6, ...Cf6, ...Be7, roque e a ruptura ...c5 | 2 demos · 3 lições interativas |
| 4 | Atacar a Peça Cravada | a peça cravada é alvo, não obstáculo | 6 exercícios · 20 puzzles |
| 5 | Raio-X | enxergar através da peça | 5 exercícios · 20 puzzles |
| 6 | Desvio e Atração | tirar do lugar certo, levar ao lugar errado — duas faces do mesmo recurso; **o ímã é a atração em série** | 6 exercícios · 25 puzzles |
| 7 | Lance Intermediário | o lance que vem antes do lance óbvio | demo · 5 exercícios · 15 puzzles |
| 8 | Sacrifício de Desvio | dar material para ganhar mais | 5 exercícios · 20 puzzles |
| 9 | **Defender-se do Ataque Duplo e da Cravada** ⊕ | antecipar o garfo antes de ele existir; desfazer uma cravada de quatro maneiras | demo · 7 exercícios · 25 puzzles |
| 10 | O Mini-Plano | as três perguntas antes de escolher o lance | quiz · 5 exercícios |
| 11 | Peão Passado | criar, bloquear e empurrar | demo · 5 exercícios · 15 puzzles |
| 12 | A Sétima Fileira | por que a torre ali vale **um peão a mais — e duas na sétima decidem** | demo · 5 exercícios |
| 13 | Trocar, Não Trocar, e Converter | a regra de quem está pior e a de quem está melhor — **e como transformar peça a mais em vitória** | quiz · 6 exercícios |
| 14 | Casas-Chave nos Finais de Peão | saber de véspera se o final está ganho | lição interativa · 6 exercícios · 3 posições contra o motor |
| 15 | A Estrutura de Peões — a primeira leitura | ligados, isolados, maioria: **reconhecer**, não ainda planejar | quiz · 5 exercícios |
| 16 | Final de Torre — o rei ativo | por que a torre passiva perde | lição interativa · 5 exercícios · 15 puzzles · 2 posições contra o motor |
| 17 | **Arena: Repertório-base — as três frentes** | a Italiana, a Escandinava e o GDR de cabeça, **e eles voltam amanhã** | move trainer |
| 18 | **Arena: Duelo com Íris** | sobreviver à abertura de um bot que só joga truque | partida com missão |
| 19 | Arena: Mate em 2 e Táticas Mistas | 30 posições sem tema declarado | 30 puzzles |

⊕ = aula nova na revisão 3. Blocos de revisão obrigatórios após as aulas **6, 12 e 19**.

## Trilha 4 — Capitão · 18 aulas · ~1200–1500

**Meta:** ataca o rei — rocado ou preso no centro — com método, lê uma estrutura de peões para fazer plano, e sabe Philidor e Lucena de cor.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | Vantagem de Abertura | o que é, medida em quatro coisas concretas | quiz · 5 exercícios |
| 2 | A estrutura que a sua abertura gera | escolher a abertura pelo meio-jogo que ela dá | 2 demos · quiz · 1 lição interativa |
| 3 | Punir o Erro de Abertura | os três tipos de erro e a punição de cada um | 6 lições interativas |
| 4 | Interferência, Bloqueio e Desobstrução | cortar a linha de quem defende — e abrir a linha de quem ataca | 5 exercícios · 20 puzzles |
| 5 | **Ataque ao Rei — rocado e no centro** | as três alavancas contra o roque; e como punir o rei que não rocou | 2 demos · 7 exercícios · 20 puzzles |
| 6 | Sacrifício Grego (Bxh7+) | reconhecer quando funciona **e quando não** | lição interativa · 6 exercícios · 10 puzzles |
| 7 | Táticas de Defesa | sair de um ataque em vez de aceitar o mate | 6 exercícios · 25 puzzles |
| 8 | Peões Fracos e o que fazer com eles | a competência é *explorar a fraqueza*; isolado, dobrado e atrasado são o vocabulário | quiz · 6 exercícios · 20 puzzles |
| 9 | Casas Fracas e o Posto Avançado | achar o buraco e pôr o cavalo nele | demo · 5 exercícios |
| 10 | Bispo contra Cavalo | quando cada um é melhor, e como forçar a troca certa | quiz · 5 exercícios |
| 11 | Espaço, Restrição — e a Peça Presa | ganhar espaço sem perder o controle, e levar a restrição ao fim: **prender e ganhar a peça** | demo · 5 exercícios · 15 puzzles |
| 12 | Torre e Peão contra Torre — **Philidor** | **a posição defensiva fundamental** de torre e peão contra torre | lição interativa · 5 exercícios · 2 posições contra o motor |
| 13 | Torre e Peão contra Torre — **Lucena e a Ponte** | **a posição vencedora fundamental** de torre e peão contra torre | lição interativa · 5 exercícios · 2 posições contra o motor |
| 14 | A Torre Atrás do Peão Passado | a regra que vale nos dois lados | demo · 5 exercícios · 10 puzzles |
| 15 | Bispos de Cores Opostas | por que **até dois peões a mais** podem não ganhar | lição interativa · 5 exercícios · 10 puzzles · 2 posições contra o motor |
| 16 | **Arena: Caça às Fraquezas** | marcar as fraquezas de uma posição em segundos | mini-jogo |
| 17 | **Arena: Treino de Ataque** | dar mate contra um motor defendendo de verdade | mini-jogo · 5 posições contra o motor |
| 18 | Arena: Finais de Torre | 30 posições | 30 puzzles |

Blocos de revisão obrigatórios após as aulas **6, 12 e 18**.

## Trilha 5 — Comandante · 17 aulas · ~1500–1800

**Meta:** tem repertório-base nas três frentes, calcula com lista de candidatos, sabe abrir uma posição fechada com ruptura, defende posição pior sem desmoronar e converte finais de torre com técnica.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | **Repertório-base de Brancas** | a linha principal e as três respostas mais comuns | 4 lições interativas |
| 2 | **Repertório-base contra 1.e4** | idem | 4 lições interativas |
| 3 | **Repertório-base contra 1.d4** | idem | 4 lições interativas |
| 4 | Cálculo | listar candidatos antes de calcular, e podar | quiz · 6 exercícios · 15 puzzles |
| 5 | Zugzwang e o Lance de Espera | ganhar por obrigar o outro a jogar | lição interativa · 6 exercícios · 15 puzzles |
| 6 | Combinações de Dois Motivos | quando a tática exige encaixar duas ideias | 6 exercícios · 25 puzzles |
| 7 | **A Estrutura Decide o Plano — e a Ruptura que a Abre** | ler a estrutura, derivar o plano, e usar a ruptura de peões para executá-lo. Carlsbad, **peão de dama isolado** e cadeia francesa são três exemplos da mesma competência | 3 demos · quiz · 7 exercícios |
| 8 | Profilaxia | perguntar o que **ele** quer antes de decidir o que você quer | quiz · 6 exercícios |
| 9 | A Sua Peça Pior | o hábito que mais rende nessa faixa | demo · 5 exercícios |
| 10 | Os Dois Bispos | abrir a posição para eles, e trocá-los pela coisa certa | demo · 5 exercícios |
| 11 | Torre com Vários Peões | os princípios que valem quando a teoria acaba | lição interativa · 6 exercícios · 20 puzzles · 3 posições contra o motor |
| 12 | Vancura e as Defesas de Torre | salvar finais que parecem perdidos | lição interativa · 5 exercícios · 3 posições contra o motor |
| 13 | Finais de Dama | xeque perpétuo e o escudo do rei | lição interativa · 5 exercícios · 15 puzzles · 2 posições contra o motor |
| 14 | Cavalo e o Peão de Torre | o final que engana | lição interativa · 5 exercícios · 10 puzzles · 2 posições contra o motor |
| 15 | **Defender uma Posição Pior** ⊛ | as quatro ferramentas de quem está pior: trocar as peças certas, atividade máxima, o perpétuo como recurso, e escolher o final que se segura | demo · 6 exercícios · 25 puzzles |
| 16 | **Arena: Repertório-base Completo** | as três frentes de cabeça, revisadas no tempo certo | move trainer |
| 17 | **Arena: Duelo com Helena** | converter um final que o bot te entregou de propósito | partida com missão |

⊛ = aula nova na revisão 4 — a aula de defesa que a §3 prometia e a trilha não tinha; o Passo 5 tem "defender" na ementa. Blocos de revisão obrigatórios após as aulas **6, 12 e 17**.

> "Repertório-base", não "repertório completo": quatro linhas interativas dão a espinha
> de uma abertura, não um repertório de torneio.

## Trilha 6 — General · 14 aulas · ~1800–2100

**Meta:** acha a tática **sem que ninguém diga o motivo**, e decide entre estrutura e iniciativa com critério.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | Escolher a Abertura pelo Meio-Jogo | montar repertório por tipo de posição, não por moda | quiz · 2 demos |
| 2 | Ordem de Lances e Transposição | chegar onde quer evitando o que não quer | 4 lições interativas |
| 3 | Novidade e Preparação | como se prepara para um adversário | demo · quiz |
| 4 | Táticas Sem Dica | 30 posições sem tema declarado | 30 puzzles |
| 5 | Sacrifício Posicional | dar material por algo que não é mate | 2 demos · 6 exercícios · 15 puzzles |
| 6 | Defesa Ativa e Contra-Ataque | quando defender é atacar | 6 exercícios · 25 puzzles |
| 7 | Dinâmica contra Estrutura | a troca central e o que ela custa | 2 demos · quiz · 1 lição interativa |
| 8 | Ataque de Minorias | o plano que vence sem tática | lição interativa · 5 exercícios |
| 9 | O Princípio das Duas Fraquezas | por que uma fraqueza raramente basta | demo · 5 exercícios |
| 10 | Transição para o Final | escolher qual final você quer antes de trocar | quiz · 6 exercícios |
| 11 | Bispo contra Cavalo nos Dois Flancos | o final que decide torneio | lição interativa · 5 exercícios · 15 puzzles · 3 posições contra o motor |
| 12 | Dama contra Peão na Sétima | **os dois peões que empatam — o de torre e o de bispo** | lição interativa · 5 exercícios · 3 posições contra o motor |
| 13 | Torre contra Peça Menor | quando ganha, quando empata | lição interativa · 5 exercícios · 3 posições contra o motor |
| 14 | **Arena: Torneio Simulado** | três duelos seguidos, cada um com uma missão diferente | 3 partidas com missão |

Blocos de revisão obrigatórios após as aulas **5, 10 e 14**.

## Trilha 7 — Mestre · 11 aulas · 2100+

**Meta.** Esta trilha **não promete levar ninguém de 2100 a lugar nenhum.** Onze aulas não fazem isso. O que ela faz é ensinar o aluno a **treinar sozinho**: manter repertório, diagnosticar a própria fraqueza, **estudar as próprias partidas**, organizar rotina e não perder ponto por final teórico.

| # | Aula | O aluno sai sabendo | Treino |
|---|---|---|---|
| 1 | Manter um Repertório Vivo | atualizar sem refazer tudo | quiz · move trainer |
| 2 | Sair do Livro | jogar bem posição que ninguém preparou | 2 demos · 6 exercícios |
| 3 | Cálculo Profundo | podar cedo e verificar no fim | 12 exercícios longos |
| 4 | O Estudo Artístico como Treino | usar composição para treinar imaginação | 8 estudos |
| 5 | Avaliação | os cinco fatores e o peso de cada um numa posição concreta | quiz · 8 exercícios |
| 6 | Sacrifício de Qualidade | quando a torre vale menos que o cavalo | 2 demos · 6 exercícios |
| 7 | Duas Fraquezas na Prática | conduzir a partida inteira por esse plano | 2 lições interativas longas |
| 8 | Dama contra Torre | a técnica, até o fim | lição interativa · 5 exercícios · 3 posições contra o motor |
| 9 | Fortalezas | reconhecer e construir | lição interativa · 6 exercícios · 3 posições contra o motor |
| 10 | **Arena: Monte o Seu Plano de Estudo** | diagnosticar a própria fraqueza **analisando as próprias partidas** — o site já mede accuracy e blunders — e montar a rotina | análise de 3 partidas próprias · quiz · checklist · relatório |
| 11 | **Arena: Prova Final** | 25 posições de todas as áreas, sem aviso de tema | 25 puzzles |

Blocos de revisão obrigatórios após as aulas **4, 8 e 11**.

---

## 7. Os mini-jogos

| Mini-jogo | Regra | Treina | Onde entra |
|---|---|---|---|
| **Ache a Casa** | clicar na casa ditada, contra o relógio | notação | T1 a1 |
| **Balões** | a peça "estoura" só as casas que alcança; errar é falta. Um por peça — peão, torre, bispo e dama | geometria de cada peça | T1 a2–a5 |
| **Cavalo Faminto** | capturar todos os alvos com o cavalo em N lances | rota do cavalo, planejamento | T1 a6 |
| **Zona Proibida** | atravessar sem pisar em casa atacada | ver o controle do adversário | T1 a7 · T2 a20 |
| **Vale ou Não Vale** | dada uma captura, dizer em 5 segundos se a troca é boa | contagem de defensores | T1 a15 |
| **Guerra de Peões** | só peões; ganha quem promover primeiro | estrutura, peão passado, oposição | T1 a24 |
| **Come-Peões** | capturar todos os peões antes do adversário | contagem, segurança, checklist | T1 a26 |
| **Escolta do Peão** | levar o peão à promoção em N lances | peão passado, tempos | T2 a21 |
| **Caça às Fraquezas** | marcar as casas e peões fracos da posição | vocabulário posicional | T4 a16 |
| **Treino de Ataque** | dar mate em N lances contra um motor defendendo | ataque ao rei | T4 a17 |

> **Ressalva sobre os Balões.** O Chessmatec virou chessworld.io e é uma página de
> marketing — a mecânica de balões **não está documentada publicamente**. O que está
> documentado é a família "capturar todos os alvos com a peça". Os Balões deste
> catálogo são **dedução**, não cópia verificada.

---

## 8. As missões de bot

Vencer o bot é aula da trilha, mas **nunca é só vencer**. A missão amarra a partida à aula anterior, e cada uma tem cinco campos.

### T1 a23 — Léo (250) · **Construa a Base**
- **Início:** posição inicial padrão, aluno de brancas.
- **Sucesso:** até o lance 10, ter **um peão seu em e4 ou d4** (ou o peão que capturou para uma delas), **duas peças menores desenvolvidas** e **o rei rocado** — e depois vencer a partida.
- **Falha:** faltar qualquer um dos três no lance 10, ou não vencer.
- **Quando:** os três critérios no lance 10; o resultado no fim.
- **Feedback:** o tabuleiro do lance 10 com os três critérios marcados como cumpridos ou não.

> Antes a missão exigia "peão em duas das quatro casas centrais". Isso ensinaria a
> criança a empurrar peão para cumprir tabela, mesmo quando a posição não pede. A
> revisão 3 trocou por "ocupando ou controlando o centro" — mas isso 1.c3 já satisfaz,
> era critério inócuo. A redação da revisão 4 pede o que a aula 17 pede de um recruta
> de brancas: um peão de verdade numa casa central.

### T2 a18 — Skippy (400) · **Sem Entregar de Graça**
- **Início:** posição inicial, aluno de brancas.
- **Sucesso:** vencer **sem perder uma peça de valor 3 ou mais numa captura simples sem compensação** — a peça é capturada, não há recaptura que reequilibre, e o saldo material fica negativo.
- **Falha:** uma única perda assim, mesmo vencendo.
- **Quando:** a cada captura do adversário, acumulado.
- **Feedback:** o lance exato e o saldo material depois dele.

> Antes a missão dizia "peça sem defesa". Está errado: peça defendida também se perde,
> e peça sem defensor pode ser sacrifício. O que importa é **perda material sem
> compensação**. E a régua é declaradamente **material pura, computável**: a janela é a
> sequência de capturas encadeadas na mesma região da troca; compensação é o material
> recuperado nessa janela. Um sacrifício genuíno **pode reprovar a missão — e está
> certo assim**: na faixa do Skippy, o hábito-alvo é não entregar de graça; sacrifício
> correto é assunto das trilhas de cima.

### T3 a18 — Íris (850) · **Sobreviva à Abertura**
- **Início:** posição inicial, aluno de pretas (Íris joga as armadilhas).
- **Sucesso:** chegar ao **lance 12** sem sofrer mate e com desvantagem material **não maior que 3 pontos**.
- **Falha:** qualquer uma das duas coisas.
- **Quando:** no lance 12. **A partida pode continuar depois** — a missão é só a abertura.
- **Feedback:** o balanço material no lance 12 e o lance em que a armadilha apareceu.

> A revisão 4 removeu "sem perder dama nem torre": o saldo de 3 pontos já mede isso —
> perder a dama sem compensação estoura o limite sozinho — e, lido ao pé da letra, o
> critério antigo reprovava uma troca igual de damas, que não é erro nenhum.

### T5 a17 — Helena (1600) · **Converta o Final**
- **Início:** posição de final dada, com vantagem técnica para o aluno — posição do de la Villa, validada por motor (§4).
- **Sucesso:** vencer a partir dela.
- **Falha:** empate ou derrota.
- **Quando:** no fim.
- **Feedback:** o lance em que a avaliação virou, se virou.

### T6 a14 — Torneio Simulado
Três duelos seguidos, cada um com uma das missões acima **em versão mais dura — os mesmos critérios, com margem menor**, contra bots diferentes. Passa quem cumpre **duas de três**. Os parâmetros exatos (quais bots, quais margens) são do plano técnico; o critério de aprovação é deste documento.

Isto implementa o que a `Recruta64_Diretriz_Geral_dos_Bots_v1.md` especificou e nunca saiu do papel: cada bot tem uma "Força" e uma "Função pedagógica". Hoje eles só diferem em força bruta.

---

## 9. A Biblioteca de Finais

Nem todo final merece aula obrigatória. Alguns são raros e difíceis: ocupar um número da trilha atrasa todo mundo por um conteúdo que a maioria não vai encontrar tão cedo.

A Biblioteca é uma **prateleira aberta**, fora da progressão: o aluno entra quando quiser, cada item é uma lição interativa curta (com prática contra o motor quando for técnica), e nada bloqueia nada. Começa com:

- Mate com Dois Bispos *(saiu da T2)*
- Mate com Bispo e Cavalo
- **Torre contra peão — a corrida, o corte e quem chega primeiro**
- **O bispo da cor errada e o peão de torre**
- Os finais raros que decidem torneio
- Dama contra dois peões ligados na sétima
- Torre e bispo contra torre

O professor pode apontar um item da Biblioteca como tarefa de turma sem mexer na trilha de ninguém.

---

## 10. O professor-guia

**Decisão:** um **instrutor novo, exclusivo das aulas**. Nome e identidade a definir (§14).

**Ilustração — sim.** O efeito não vem da narração, vem de **ter alguém ali reagindo**. Seis expressões bastam: explicando, apontando, comemorando, pensando, corrigindo, orgulhoso. Fica no painel de texto, **nunca sobre o tabuleiro**. E **não é nenhum dos 10 bots**: quem te derrota não é quem te ensina.

**Voz em texto — sim.** Uma frase de abertura, uma quando erra, uma na dica, uma quando termina. Curtas, com personalidade, como as `phrases_json` dos bots já são. Custa quatro linhas por aula.

**Narração em áudio — prioridade na trilha 1.** Estimativa interna: 126 aulas × ~8 blocos de texto ≈ **1.000 clipes**. O problema não é gravar, é que **toda edição de texto deixa um clipe mentindo**, e currículo novo se edita muito. A trilha 1 é onde o áudio muda o resultado — o aluno tem 6 a 10 anos e lê devagar. São ~210 clipes em vez de mil. **Nas trilhas 5 a 7, áudio não é conteúdo padrão** — mas isso é decisão de prioridade, não proibição: acessibilidade é razão legítima para gravar qualquer trilha. Sons respeitam o mudo do usuário.

**O que não fazer:** vídeo, avatar animado, e o professor falando durante o exercício. Os três competem com a única coisa que o aluno precisa fazer, que é olhar a posição e pensar.

---

## 11. O que muda em relação a hoje

| | Hoje | Este currículo |
|---|---|---|
| Aulas | 30 | 126 |
| Trilhas com conteúdo | 2 de 7 | 7 de 7 |
| Posições de prática | ~113 nas duas trilhas | ~383 só na T1 — e **cada número derivável da grade** (§4) |
| Aulas de abertura | 3 de princípios, 0 nomeadas | 19, com repertório-base |
| Aulas de defesa | 0 | 6, uma por trilha até a T6 |
| Aulas de estratégia | 0 | 24 |
| Aulas de final | 3 | 22 + biblioteca opcional |
| Mini-jogos | 0 | 10, em 14 aulas |
| Duelos com missão | 0 | 5, com critério mensurável |
| Prática contra o motor | 0 | 20 aulas de técnica fecham nele |
| Formatos de exercício | 1 (um lance) | 6 (lance, lição interativa, quiz, mini-jogo, prática contra o motor, move trainer) |
| Revisão espaçada nas aulas | não existe | 3 blocos obrigatórios por trilha, com pontos e doses escritos |
| Corte do Desafio Final | 7/10 (70%), sorteio livre | 83–88%, blueprint por trilha, tema oculto |

### Faseamento — 126 é o alvo, não a próxima entrega

| Entrega | Conteúdo | Por que parar aqui |
|---|---|---|
| **1** | Trilha 1 completa (26 aulas) | observar aluno de verdade antes de escrever mais 100 |
| **2** | Trilha 2 completa (21) | fecha a faixa em que está a maioria do clube |
| **3** | Trilha 3 completa (19) | primeiro repertório; primeira validação do move trainer |
| **4+** | Trilhas 4 a 7 | **depois de dados reais de uso** |

---

## 12. Fontes consultadas

**Método Steps / Stappenmethode — ementa oficial por Passo, lida diretamente:**
[Passo 1](https://www.stappenmethode.nl/en/step1.php) · [Passo 2](https://www.stappenmethode.nl/en/step2.php) · [Passo 3](https://www.stappenmethode.nl/en/step3.php) · [Passo 4](https://www.stappenmethode.nl/en/step4.php) · [Passo 5](https://www.stappenmethode.nl/en/step5.php) · [Passo 6](https://www.stappenmethode.nl/en/step6.php)

**Fontes adquiridas (posições):** os cadernos digitais do Método Steps, por Passo, e o
*100 Endgames You Must Know* (de la Villa) — comprados em 2026-07-31, fonte direta de
posições sob as regras da §4 (posição é fato; explicação é obra e se redige do zero).

Outras:
- Faixas de rating por Passo (divergentes entre si) — [nextlevelchess](https://nextlevelchess.com/steps-method-explained/) · [Princeton Chess Academy](https://www.princetonchessacademy.com/steps.html)
- Yusupov — [estrutura da série em 9 volumes](https://www.chess.com/blog/beccrajoy/book-review-yusupovs-build-up-your-chess-the-fundamentals)
- de la Villa, *100 Endgames You Must Know* — [resenha com a estrutura](https://www.chess.com/blog/ala984/100-endgames-you-must-know-jesus-de-la-villa)
- chess.com Lessons — [iniciante](https://www.chess.com/lessons/skill-level/beginner) · [intermediário](https://www.chess.com/lessons/skill-level/intermediate)
- ChessKid — [guia completo das lições por nível](https://www.chesskid.com/learn/articles/lessons-guide-all-levels-topics)
- Duolingo — [o caminho de aprendizado](https://duoplanet.com/duolingo-learning-path/) · [repetição espaçada](https://blog.duolingo.com/spaced-repetition-for-learning)
- Chessable MoveTrainer — [a escada de 8 níveis](https://support.chess.com/en/articles/10319322-how-does-the-spaced-repetition-scheduling-work)
- lichess — [seção Practice](https://lichess.org/practice) — **referência direta da prática contra o motor** · [lição interativa](https://www.theschoolofrook.com/lichess-interactive-lesson/)
- Chess Universe — [as 21 torres temáticas](https://www.chess-universe.shop/en-us/blogs/news/chess-universe-getting-started)
- ChessWorld / Chessmatec — [descrição do produto](https://apps.apple.com/us/app/chessworld-chess-for-kids/id1112656776)
- Mini-jogos escolares — [catálogo para iniciantes](https://www.chess.com/blog/capatalfish3/learning-chess-the-easy-way)

---

## 13. O que este documento não cobre

Alguns formatos **não existem no site hoje**: lição interativa, **prática contra o motor**, quiz, mini-jogo, bloco de puzzle dentro da aula, bloco de revisão, duelo com missão, move trainer, **exercício longo** (T7 a3), e o **checklist/relatório de diagnóstico** (T7 a10). O exercício atual aceita um lance só. Também é do plano técnico o **gate do lastro do banco** (`verify:curriculo-banco`, §4). Tudo isso é assunto do **plano técnico**, ainda não escrito.

---

## 14. O que ainda falta definir

1. **Nome e identidade do professor.** Passar pela `Recruta64_Biblia_Tonal_v1.md` antes de batizar.
2. **Os Balões.** A mecânica real do Chessmatec, se alguém a tiver visto funcionando.
3. **A régua de rating do site.** Fixar qual número é: o rating de puzzles do aluno, o Elo do bot que ele vence, ou os dois.
4. **As três linhas do repertório-base da T5.** A T3 fixa Italiana, Escandinava e Gambito da Dama Recusado; a T5 aprofunda, mas ainda não diz em quais variantes.
5. **O bot da T4.** O salto Íris (850) → Helena (1600) deixa a T4 sem duelo de missão; o Treino de Ataque (a17) cobre com o motor. Um bot ~1200 fecharia o buraco — decisão de produto, não deste documento.

---

## 15. O que mudou na revisão 3

> **Registro histórico** (2026-07-30). Os números citados abaixo refletem o documento
> daquela data (120 → 124 aulas); a §16 corrige dois deles e leva o total a 126.

### Erros factuais de xadrez, corrigidos

| # | Estava | Ficou |
|---|---|---|
| 1 | T3: "Contra 1.d4 — o **Sistema Londres**" | **Gambito da Dama Recusado.** O Londres é abertura **de brancas** (1.d4 e Bf4); não existe como resposta das pretas a 1.d4 |
| 2 | T4 a15: "por que **duas peças** a mais podem não ganhar" | "por que **até dois peões** a mais podem não ganhar". Com duas peças a mais ganha-se; o fenômeno dos bispos de cores opostas é sobre peões |
| 3 | T4 a12/a13: Philidor "salva metade dos finais", Lucena "ganha a outra metade" | "a posição **defensiva** fundamental" e "a posição **vencedora** fundamental". A frase antiga era efeito retórico sem base |
| 4 | T1: "Mate com Torre e Rei — o **rolo compressor**" | "cortar o rei e empurrar com o apoio do próprio rei". Rolo compressor/escada é com **duas** peças pesadas alternando barreiras, não torre e rei |
| 5 | Promoção ensinada em **duas** aulas (a2 e a8) | a2 só antecipa; a promoção é ensinada junto com roque e en passant |
| 6 | T1 ensinava "quando o rei alcança o peão" e T2 ensinava a Regra do Quadrado — **a mesma coisa** | T1 vira "A Corrida dos Peões — contar tempos", com peões dos dois lados; a Regra do Quadrado fica só na T2 a13 |

### A ementa real do método, e o buraco que ela expôs

| # | Mudança | Motivo |
|---|---|---|
| 7 | **Coluna de defesa: 4 aulas novas** (T1 a10 empate, T1 a12, T2 a17, T3 a9). Total 120 → **124** | o método holandês ensina defesa nos Passos 1, 2, 3, 5 e 6. Nós tínhamos pouquíssima defesa em 120 |
| 8 | **"Passo 6 = tática sem dica" removido** | a ementa oficial do Passo 6 tem 14 aulas e tática é **uma** delas; o programa é sobretudo estratégia e finais |
| 9 | **"As fontes públicas são rasas" removido**, e a §3 ganhou a **ementa real dos 6 Passos** | a afirmação estava errada: o site oficial lista tudo |
| 10 | Absorvidos sem aula nova: **rei no centro** (T4 a5), **converter vantagem** (T3 a13), **ruptura** (T5 a7) | são temas do método que faltavam, mas cabem dentro de competência que já existe |
| 11 | Régua de patentes recalculada para o acumulado real | consequência de 124 aulas |

### Avaliação e missões

| # | Mudança | Motivo |
|---|---|---|
| 12 | **Blueprint de prova por trilha** em vez de uma distribuição única para todas | a T1 tem 10 aulas de fundamentos e a T6 nenhuma; a mesma distribuição não representa as duas |
| 13 | **A missão de bot sai da prova** e vira atividade separada | uma partida leva minutos e não equivale a um exercício de segundos |
| 14 | Competência crítica 1: "não tentar lance ilegal" → **"executar um lance legal em posição com xeque, casa atacada ou peça cravada"** | o tabuleiro bloqueia lance ilegal por construção — a tentativa nunca é registrada, logo a competência não era avaliável |
| 15 | **Revisão espaçada vira obrigatória**, com 3 blocos por trilha que travam só o Desafio Final | o documento prometia ~490 posições sem dizer se eram exigidas. Agora são — sem travar a trilha no dia a dia |
| 16 | Missão do Léo: de "peão em 2 casas centrais" para critérios da aula 17 | a métrica antiga ensinaria a empurrar peão para cumprir tabela |
| 17 | Missão do Skippy: de "peça sem defesa" para **perda material sem compensação** | peça defendida também se perde; peça sem defensor pode ser sacrifício |

### Editorial

| # | Mudança | Motivo |
|---|---|---|
| 18 | "centro, desenvolver, rei seguro — **nessa ordem**" → "**três prioridades, não uma receita fixa**" | são prioridades simultâneas, não uma sequência rígida |
| 19 | "áudio nas trilhas 5 a 7 **nunca**" → "não é conteúdo padrão; **acessibilidade é razão legítima**" | "nunca" fechava a porta para um aluno com dislexia ou baixa visão |
| 20 | "conteúdo que **5%** vai usar" → sem número | estimativa sem base |
| 21 | Comparação de volume: "**batem** o número do caderno holandês" → "**aproximam**, mas não são a mesma grandeza" | 486 e 514 são posições **distintas**; a nossa conta inclui revisão da mesma posição |
| 22 | Status: "aprovado" → "**aprovado · revisão 3 com correções factuais**" | o documento foi aprovado e depois corrigido; as duas coisas ficam registradas |

### O que não mudou, e por quê

- **"Passo N" continua sendo o rótulo.** Não é invenção deste documento: está em `title_tiers.level_name` desde 2026-07-29, e a migration registra o motivo. O que saiu foi a alegação de equivalência com o método, não o nome.
- **Nomenclatura dos documentos.** Foi apontada uma suposta mistura entre `Recruta64_*` e `CdxGuabiruba_*`. **Não existe:** todos os documentos em `docs/` são `Recruta64_*`; `CDXGuabiruba` é só o nome do repositório no GitHub. Nada a reconciliar.

---

## 16. O que mudou na revisão 4

A revisão 4 (2026-07-31) tem duas origens: **duas decisões de execução** tomadas pelo
dono do projeto, e a **auditoria externa** do documento (6 lentes independentes, com
os achados mais graves verificados adversarialmente). Nenhum achado exigiu redesenho;
todos foram corrigidos por edição local.

### As duas decisões de execução

| # | Decisão | O que muda |
|---|---|---|
| 1 | **Prática contra o motor** vira formato (§5) | técnica se prova fora do trilho: posição + lado + objetivo + orçamento de lances + força do motor, no modelo da seção *Practice* do lichess. Fecha 20 aulas de técnica (mates elementares, finais teóricos) e ganha coluna própria na meta da §4 |
| 2 | **Posições vêm dos livros comprados** (§4, §12) | cadernos do Steps + de la Villa adquiridos. Posição é fato (sem direito autoral); explicação é obra e se redige do zero; nunca um caderno inteiro na ordem dele; IA só como último recurso, sempre com validação por motor |

### Aulas novas e renumeração — 124 → 126

| # | Mudança | Motivo |
|---|---|---|
| 3 | **T1 a19 — O Mate da Escada** ⊛; T1 vai a 26 aulas | o mate técnico mais fácil não existia em nenhuma das 124 aulas nem na Biblioteca — a T1 ia direto aos mates que precisam do rei (achado confirmado). A revisão 3 tinha até definido a técnica ao corrigir o rótulo "rolo compressor", sem incluí-la |
| 4 | **T5 a15 — Defender uma Posição Pior** ⊛; T5 vai a 17 aulas | a tabela da §3 e a §11 prometiam 1 aula de defesa na T5 e **nenhuma das 16 aulas era de defesa** (achado confirmado); o Passo 5 tem "defender" na ementa oficial |
| 5 | Acumulados e régua de patentes recalculados: **0 · 26 · 47 · 66 · 84 · 101 · 115 · 126**; áreas: estratégia 23→24, finais 21→22; blocos da T1 após 10, 18 e **26** | consequência das duas aulas novas |

### Sequência e listas

| # | Mudança | Motivo |
|---|---|---|
| 6 | T1: **a13 ↔ a15** — O Valor das Peças agora vem antes de Contar Defensores | "decidir se a troca vale a pena" era pedido duas aulas **antes** de a tabela de valores ser ensinada — inversão de pré-requisito confirmada |
| 7 | T1: **a8 ↔ a9** — Xeque e Xeque-Mate antes dos lances especiais; especiais com 9 exercícios (3 por regra) | as proibições do roque (em xeque, através de casa atacada) usam o conceito de xeque, que era formalizado só depois; e 6 exercícios para 3 regras era pouco |
| 8 | T1 a12: quatro → **cinco respostas** à peça atacada (+ capturar o atacante) | a resposta mais direta faltava na lista — e o próprio documento a lista nas saídas do xeque |
| 9 | T2 a17: as cinco saídas reformuladas (+ **defender a casa do mate**; contra-xeque fundido em "ganhar tempo") | a defesa mais comum na prática não cabia em nenhuma das cinco categorias (achado confirmado); contra-xeque e ganhar tempo eram o mesmo recurso contado duas vezes |
| 10 | **Balões da Dama** (T1 a5) | a dama — geometria composta, a mais sujeita a erro de alcance — era a única peça sem mini-jogo, contrariando "o mini-jogo carrega a repetição" |
| 11 | T1 a1 não promete mais "ler um lance escrito" | impossível antes de conhecer as peças; a notação completa consolida ao longo da trilha |

### Volume: a meta virou soma

| # | Mudança | Motivo |
|---|---|---|
| 12 | **Dose escrita em cada aula** (§4 "regra de dose") e **meta recalculada célula a célula** — cada linha da tabela é a soma da §6 | a revisão 3 prometia 1.570 posições "do banco" e as aulas especificavam 640 (41%) — o mesmo defeito de "um terço" que o documento confessa, mudado de coluna (achado confirmado 2×) |
| 13 | **Gate do lastro** `verify:curriculo-banco` (§4) | ninguém auditou se o banco tem puzzles por tema × faixa; bloco sem 3× a dose migra para os livros |
| 14 | Revisão espaçada com **pontos fixos nas 7 trilhas**, tamanho de bloco (~⅓ da coluna), intervalos (1→3→7 dias), reentrada por erro e **retenção entre trilhas** (⅓ do bloco 3) | só a T1 tinha pontos definidos; nenhum bloco tinha tamanho; os números codificavam uma exposição única por posição |
| 15 | Arenas de tema único **legitimadas**; regra do tema oculto re-escopada para prova, revisão e arenas mistas | a regra antiga dizia "as arenas nunca dizem o motivo" e quatro arenas tinham o tema no título — a a25 chegava a dizer "sem dizer o tema" dentro de "Caça ao Mate em 1" |

### Missões

| # | Mudança | Motivo |
|---|---|---|
| 16 | Léo: centro = **peão em e4/d4** (ou a recaptura para lá) | "ocupando ou controlando" era satisfeito por 1.c3 — critério inócuo |
| 17 | Skippy: régua **material pura** com janela declarada; sacrifício pode reprovar, e isso fica assumido | "sem compensação" sem definição não era computável; a alternativa (avaliação de motor com limiar) não vale a complexidade na faixa 400 |
| 18 | Íris: cai "sem perder dama nem torre" | redundante com o saldo de 3 pontos, e reprovava troca igual de damas |
| 19 | Torneio Simulado: critérios herdados "com margem menor"; parâmetros exatos delegados ao plano técnico | era a única missão sem campos executáveis |

### Cobertura e precisão enxadrística

| # | Mudança | Motivo |
|---|---|---|
| 20 | **Peça presa** (T4 a11), **desobstrução** (T4 a4), **ímã** (T3 a6) absorvidos | temas da ementa do Passo 4 sem destino na grade; peça presa é tema indexado do banco |
| 21 | Biblioteca ganha **Torre contra peão** e **O bispo da cor errada** | torre contra peão é ementa oficial do Passo 5 e família central do de la Villa; o bispo da cor errada é o empate elementar mais famoso dele |
| 22 | T7 a10 ganha **análise das próprias partidas** | a meta da T7 prometia "estudar partida" sem aula que o entregasse — e o site já mede accuracy e blunders sem uso curricular |
| 23 | Escandinava **reconciliada** com a T2 a3, na própria aula | a T2 ensina "dama cedo não" e a T3 fixava a abertura cuja dama sai no lance 2, sem uma palavra — a exceção agora é explicada de frente |
| 24 | Torre na sétima: "vale mais que uma peça" → "**vale um peão a mais — e duas decidem**" | sobrevalorização retórica do mesmo gênero que a revisão 3 removeu de Philidor/Lucena |
| 25 | "dama isolada" → "**peão de dama isolado**"; "as duas colunas que empatam" → "**os dois peões que empatam — torre e bispo**" | a estrutura chama-se peão de dama isolado; as colunas de empate são quatro (a, c, f, h) — dois **tipos** de peão |
| 26 | Números declarados corrigidos: mini-jogos "em 22 aulas" → **14**; corte "~83% em todas" → **83–88%**; formatos "4" → **6**; a conta da defesa ("tínhamos uma") → tínhamos **duas** (T4, T6), a revisão 3 somou três diretas + o empate, a revisão 4 fechou a T5 | nenhuma das contagens antigas batia com as próprias tabelas |
| 27 | Nota sobre **Grão-Mestre × Mestre** (§3) | completar a T6 veste Grão-Mestre (`title_tiers`); a trilha 7 chama-se Mestre (`lessons.trail`). Os dois rótulos são dados reais — documentado para ninguém "corrigir" um pelo outro |

### O que não mudou, e por quê

- **A grade de 7 trilhas, os cinco princípios, o blueprint por trilha, o faseamento e o professor-guia.** A auditoria confirmou essas estruturas como os pontos fortes do documento.
- **A T7 sem aula de defesa.** Decisão deliberada e justificada (autonomia), mantida.
- **A §15 fica como registro histórico da revisão 3** — inclusive onde a revisão 4 a corrige.
