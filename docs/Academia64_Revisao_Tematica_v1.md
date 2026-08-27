# Revisão Temática — Academia 64 (v1 · 2026-08-22)

> **O que este documento é:** análise e propostas. **Nada aqui é lei** até o
> Doug aprovar; onde este doc divergir da Bíblia Tonal v2, **a Bíblia vence**.
> Toda afirmação sobre o produto foi medida em 2026-08-22 com arquivo:linha —
> os números envelhecem, o argumento não. Público confirmado: **7 a 15 anos**.
>
> Perguntas que esta revisão responde, do pedido original: a experiência é
> mesmo "entrar e viver numa academia de fantasia"? os lugares fazem sentido?
> a escada pode melhorar? o vocabulário está bom? tudo se conversa? o aluno
> explora com objetivo e se sente acolhido? e que perguntas faltam responder?

---

## 1. Veredito em uma página

**A Academia 64 hoje existe como lei, não como experiência.** O mundo está
inteiro nos documentos, metade na landing, e quase nada no produto que o aluno
logado usa todo dia.

O que o aluno logado encontra do mundo, medido: **oito nomes de tela** (Saguão,
Trilhas, Sala de Duelos, Quadro de Honra, Matrícula, Missões do Dia, Sequência
de Presença, Insígnias), **um título** na navbar com **um anel de cor** em volta
do avatar — e acabou. Nenhum lugar do mapa além de "Saguão" aparece em rota
logada; Salas de Treino, Oficinas, Estufa, Cozinha e Visitantes têm **zero
ocorrências** em `src/`. Os únicos personagens do produto são os 10 bots — e
eles ainda são o elenco **do reino**, com "Acampamento dos Recrutas" renderizado
em `<h2>` ([BotGrid.tsx:63](../src/components/bots/BotGrid.tsx)) e falas dizendo
"recruta" e "soldado" em produção. Ou seja: a única presença viva de "mundo" no
produto hoje é **a era que a Bíblia §13 existe para impedir**.

Então a resposta à pergunta central é: **não — hoje a experiência não é viver
numa academia extraordinária.** É usar uma plataforma limpa, bem escrita, com
nomes de academia. A promessa da landing ("uma academia inteira, e 64 casas
para explorar") e os 25% de descoberta da fórmula tonal não têm contrapartida
atrás do login.

**O que já está bem — e é muito:** o vocabulário v2 desceu consistente (Bloco 2,
53 arquivos); a moldura de título é elegante, automática e acessível; a lei das
duas linguagens de cor (título × raridade) é rara de tão certa; a curva de tom
funciona onde há copy; e o mapa cumpriu em silêncio sua primeira função real —
dar coerência às 56 peças do catálogo sem precisar de época. A fundação é boa.
O problema não é qualidade: é **entrega** — o mundo não chega a quem ele foi
feito para encantar.

**A tese desta revisão:** não é "mais tema em toda tela" (a regra da dose única,
§9, está certa). É escolher os **poucos pontos onde a descoberta acontece de
verdade** — personagens, conquista rara, primeira entrada, insinuação — e
entregá-los na ordem do custo: primeiro o que é só copy, depois o que é feature
pequena, por último o que depende de arte.

---

## 2. Os lugares, um a um

Três taxonomias de lugar convivem e **divergem**: o mapa da Bíblia (10
entradas), os corredores do catálogo de peças (8 — doc 22 §5) e as alas dos
bots (5). A própria Bíblia afirma "absorver" os corredores do catálogo, mas sua
tabela não contém dois deles ("a Casa" e "o Torneio"). Antes das propostas, o
raio-X:

| lugar (Bíblia) | corredor (doc 22) | ala de bots | peças | telas logadas | veredito |
|---|---|---|---|---|---|
| o Pátio | — | ★ (papel) | 0 | — | forte no papel, órfão no produto |
| as Salas de Treino | — | ★★ (papel) | 0 | — | necessário como degrau, nome sem charme |
| as Oficinas | as Oficinas | — | 8 | — | forte; espera os mini-jogos |
| a Biblioteca | — | ★★★ (papel) | 0 | — | forte; ponte acidental com o currículo |
| a Estufa / os Jardins | a Estufa | — | 7 | — | boa ficção com tela ideal já existente |
| a Cozinha | a Cozinha | — | 2 | — | sabor sem função |
| o Observatório | o Observatório | ★★★★ (papel) | 6 | — | o mais forte do mapa |
| a Arena | **o Torneio** | ★★★★★ (papel) | 5 | — | forte, nome sobrecarregado (3 usos) |
| o Arquivo | o Arquivo | — | 4 | — | a melhor ideia do mapa, a menos construída |
| os Visitantes | os Visitantes | — | 4 | — | funciona, mas não é lugar (é gente) |
| — | **a Casa** | — | 8 | — | o maior corredor do catálogo, sem lugar no mapa |

(As 12 peças do slot `rosto` não têm corredor — e está certo: **o rosto é do
aluno, não da Academia**. Vale escrever essa frase no doc 22 para a ausência
parar de parecer esquecimento.)

### 2.1 Julgamentos individuais

- **o Pátio** — a função (chegada, acolhimento) é a certa e o lugar natural
  dele já existe: a Matrícula e a primeira ala de bots. Só falta ser dito em
  tela. Fica.
- **as Salas de Treino** — é o único lugar batizado pela função, sem imagem
  própria; num produto que é inteiro treino, o nome quase não diferencia. Mas
  como degrau ★★ ele é necessário, e o charme pode vir dos personagens (o Pip
  "mora atrás dos armários das salas de treino"). Recomendação: **fica como
  está** — trocar por trocar é churn; se um dia incomodar, a hora é junto com
  a migration dos bots.
- **as Oficinas** — identidade fortíssima (engenhoca, tentativa, mão na massa)
  e destino claro: os 10 mini-jogos do currículo, ainda não construídos. É o
  lugar que mais ganha de graça quando os mini-jogos chegarem. Fica.
- **a Biblioteca** — o currículo já tem, por acaso, "a Biblioteca de Finais"
  (§9 do currículo: prateleira aberta com 7 finais clássicos). É a **ponte
  acidental mais barata do projeto**: uma superfície de conteúdo que já carrega
  o nome de um lugar do mapa. Vale tornar a ponte oficial — custo zero. Fica.
- **a Estufa / os Jardins** — único lugar com dois nomes; o catálogo já
  escolheu ("a Estufa"). Recomendação: **a Estufa**, um nome só. E a tela ideal
  já existe: `/puzzles/revanche` é repetição espaçada — "revisões agendadas",
  coisas que amadurecem com o tempo — a metáfora da estufa pronta, sem uso.
- **a Cozinha** — 2 peças, nenhuma superfície, nenhum bot. O humor (10% da
  fórmula) merece uma casa, então **fica no mapa como sabor** — mas registrado
  que ela não gera tarefa nenhuma. Se um dia as Turmas ganharem vida social, é
  a candidata natural.
- **o Observatório** — identidade completa: sensação própria (noite, cálculo),
  6 peças incluindo o único traje lendário, ala ★★★★, e a Madame Véspera. É o
  modelo do que os outros lugares deveriam ser. Fica.
- **a Arena** — ver §2.3, a colisão de nome.
- **o Arquivo** — "o que ainda não foi mostrado" é a materialização exata dos
  25% de descoberta, e hoje não tem mecânica nenhuma: as conquistas raras que
  ele deveria guardar não existem, e a palavra nunca aparece logada. **É a
  aposta de maior retorno do mapa** — ver proposta na §5.
- **os Visitantes** — é a única entrada do mapa que não é lugar, é gente. O
  erro de categoria é benigno (funciona como origem de peça e de bot) e
  consertar renomearia catálogo à toa. Fica, com a natureza anotada.

### 2.2 Reconciliar as três taxonomias — opções

O problema real não é ter 10 lugares; é **três listas sem dono**. Opções:

- **Opção A — a Bíblia vira a tabela única (recomendada).** A tabela do mapa
  (§5) ganha uma coluna "corredor do catálogo", declarando as duas
  equivalências e as duas entradas especiais: *a Casa* = a própria instituição
  (peças institucionais: farda, gambesão, alamares — "jogador da casa"), e
  *o Torneio* ↔ *a Arena* (resolvido na §2.3). O doc 22 passa a apontar para
  ela. **Custo: edição de 2 docs.** Nenhum banco, porque corredor não é coluna
  — é ficção de organização (medido: o sorteio do baú ignora corredor,
  `b6_bau_da_peca.sql:151-156`).
- **Opção B — renomear os corredores do catálogo para os nomes do mapa.**
  Mata a divergência por fusão. Custo igualmente baixo, mas perde "a Casa",
  que é uma ideia boa (a Academia como origem das peças institucionais) sem
  substituto no mapa.
- **Opção C — deixar como está.** Custo zero hoje, e a divergência cresce a
  cada peça e bot novos. É a única opção ruim.

### 2.3 A colisão "Arena" — três usos para uma palavra

Hoje "Arena" é, ao mesmo tempo: **lugar do mapa** (Bíblia §5), **ala ★★★★★ dos
bots** (papel) e **formato de aula** no currículo — 15 ocorrências, em títulos
de aula que já existem no banco ("Arena: Caça ao Mate em 1"). Para um aluno de
7–15, duas "Arenas" com significados diferentes na mesma plataforma é confusão
gratuita.

- **Opção A — o lugar cede: vira "o Torneio" (recomendada, com ressalva).**
  O catálogo **já chama** o corredor de "o Torneio"; a campeã da ala se chama
  Ísis, *a Campeã do Torneio*; e "Você venceu alguém do Torneio" lê tão bem
  quanto a frase da Bíblia. O momento é único: **a migration dos bots ainda não
  desceu**, então renomear a ala 5 hoje custa editar 2 documentos e 1 card da
  landing ([page.tsx:100-104](../src/app/page.tsx)) — depois da migration,
  custa dados. A ressalva honesta: "Arena" é palavra de lugar e "Torneio" é
  palavra de evento; perde-se um pouco de pedra-e-arquibancada.
- **Opção B — o formato cede.** Renomear o formato de aula ("Treino livre",
  "Prática") preserva "a Arena" como lugar. Custo: emenda no currículo
  aprovado **mais migration de dados** (os títulos de aula "Arena: …" já estão
  no banco). Mais caro que A, e o currículo é fonte de verdade estável.
- **Opção C — conviver.** De graça hoje, e paga em confusão para sempre —
  exatamente o tipo de dívida que a v1 ensinou a não deixar.

---

## 3. A escada, nome a nome

A estrutura está certa — 8 degraus, slugs travados, concessão no servidor, o
achado D11 morto. A revisão é sobre **os nomes lidos por quem tem 7 a 15 anos**
e sobre **a escada como experiência**, onde os defeitos são maiores que nos
nomes.

### 3.1 O teste do recreio, degrau a degrau

O teste: a criança conta no recreio — *"virei X!"* — e isso soa conquista?

| tier | nome | veredito no teste |
|---|---|---|
| 0 | Calouro | **bom** — palavra de faculdade que o de 7 talvez não conheça, mas aprende no primeiro dia; quente, sem humilhação |
| 1 | Aprendiz | **ótimo** — perfeito para a faixa |
| 2 | Estudante | **fraco** — é o único degrau que premia a criança com o que ela já é; "virei Estudante!" não sobe o peito de ninguém |
| 3 | Analista | **médio** — para adulto lê escritório (analista de sistemas); salva-o que *analisar* é verbo real do xadrez que o aluno aprende nessa faixa |
| 4 | Estrategista | **forte** — palavra grande que criança gosta de carregar |
| 5 | Mestre | **forte** |
| 6 | Grão-Mestre | **forte** — e é o título real do xadrez, o que dá lastro à escada inteira |
| 7 | Lenda | **forte** |

O padrão: **a metade de cima é aspiracional e a metade de baixo é burocrática —
e é na metade de baixo que os alunos de 7–10 vivem.** A curva emocional da
escada está invertida em relação a quem mais precisa dela.

### 3.2 Opções para os nomes

- **Escada A — manter as 8 (custo zero).** Defensável: a coerência
  escola-inteira é real, e o defeito maior da escada não está nos nomes (ver
  §3.3). Contra: o degrau 2 continua premiando com obviedade.
- **Escada B — um conserto só: Estudante → Explorador (recomendada).**
  Calouro · Aprendiz · **Explorador** · Analista · Estrategista · Mestre ·
  Grão-Mestre · Lenda. "Explorador" passa no teste do recreio com folga, o de
  7 lê sem ajuda, e é o único nome da escada que **serve os 25% de descoberta**
  — o aluno do degrau 2 é exatamente o que está abrindo portas da Academia.
  Custo: migration de nome de exibição, igual à de 2026-08-21 (slugs intactos),
  com 19 alunos no banco — **nunca será mais barato que agora**.
- **Sobre "Analista":** tem defeito, mas nenhum substituto medido ganha com
  folga — *Candidato* (palavra real do xadrez, Torneio de Candidatos) fica
  estranho dois degraus antes de Mestre; *Calculista* é pejorativo em
  português. Recomendação: **registrar e não trocar** — trocar por trocar é o
  erro que esta revisão não quer cometer.

### 3.3 Os defeitos que não são de nome — e valem mais

1. **O próximo título é invisível.** Não existe em `src/` nenhum "faltam X
   aulas para se tornar Analista" (grep zero por `next_title`/equivalentes). A
   escada é a espinha aspiracional do produto e o aluno não vê o próximo
   degrau em lugar nenhum. Uma linha na faixa do Saguão ou no perfil resolve —
   é a feature pequena de maior retorno desta revisão inteira.
2. **A trilha diz quem você é, não quem você vai virar.** A regra da Bíblia §6
   (trilha nomeada pelo título de quem a cursa) é coerente e deve ficar — mas
   sozinha ela esconde o prêmio. O conserto não é renomear: é a copy declarar
   o destino — *"Conclua esta trilha para se tornar Estudante"* — no topo da
   trilha e no Desafio Final. Combina com o item 1.
3. **Nível e título são duas escadas sem ponte explicada.** A navbar mostra
   `Nv. 12` e `Estudante` lado a lado ([layout.tsx:134-137](../src/app/(main)/layout.tsx))
   e nenhuma tela diz a relação. A verdade do produto cabe numa frase de
   perfil: *nível mede presença e volume (XP); título mede formação concluída
   (trilhas)* — explicar é grátis; fundir seria obra e não é recomendado.
4. **A Lenda não tem cor.** A paleta tem 6 cores (tiers 1–6); tiers 0 e 7 usam
   fio neutro. Para o Calouro é decisão certa; para o **topo absoluto da
   escada**, o anel neutro lê como *menos* que Mestre. Sem urgência (não há
   nenhum aluno perto), mas registrado: quando houver, as opções são cor nova
   medida na paleta ou tratamento de forma (o fio já resolveu problema por
   forma uma vez, no G23).
5. **A landing esquece a Lenda.** "De Calouro a Grão-Mestre…"
   ([page.tsx:69](../src/app/page.tsx)). Pode ser conserto de uma linha — ou
   decisão deliberada: a Lenda como segredo que só se descobre dentro, no
   espírito do Arquivo. As duas leituras são defensáveis; hoje é acidente.

---

## 4. Vocabulário das telas — a lei §7 contra a tela medida

O vocabulário oficial desceu bem no Bloco 2. O que segue são os vazamentos que
sobraram, cada um com gravidade e conserto de uma linha. Quase tudo aqui é
**copy pura — custo zero além do cuidado**.

| # | vazamento | onde (medido) | gravidade | conserto |
|---|---|---|---|---|
| V1 | **Stages do reino em tela** — "Acampamento dos Recrutas"… | [BotGrid.tsx:9-21,63](../src/components/bots/BotGrid.tsx) + `bots.stage` no banco + falas com "recruta"/"soldado" | **grave** — palavra banida renderizada todo dia | é o Bloco 3 (travado na arte do Doug); ver decisão Q2 na §6 |
| V2 | **"Puzzles" como título e breadcrumb** — a lei diz Desafios; a navbar já diz "Desafios" e a tela diz outra coisa | h1 em [puzzles/page.tsx:82](../src/app/(main)/puzzles/page.tsx); breadcrumbs em rush:341, revanche:358/532, rating:211 | média — inconsistência diária | trocar por "Desafios" nas 5 ocorrências |
| V3 | **"Desafio Tático" no atalho do Saguão** — "tático" foi banido como jargão militar disfarçado | [dashboard/page.tsx:15](../src/app/(main)/dashboard/page.tsx) (e cópia no design-lab) | média | "Resolver Desafios" ou "Desafio do Dia" |
| V4 | **"Histórico de Combate"** — combate é família de guerra | [PublicProfileClient.tsx:108](../src/app/(main)/perfil/[userId]/PublicProfileClient.tsx) | média-alta | "Histórico de Partidas" |
| V5 | **"Conquista(s)" × "Insígnias" convivendo** — a mesma coisa com dois nomes em ~8 arquivos | AchievementPanel:81, ChestPanel:12, MuralClient:21/86/101, PublicProfileClient:147/158, landing:54, etc. | média | escolher **Insígnias** (é o nome oficial) e varrer |
| V6 | **Inglês residual** — "Streak:", "Game Over" | rating:293/327, rush:349 | baixa | "Sequência:", "Fim de jogo" |
| V7 | **"Honra" encurtado na navbar** — a lei §7 lista "Quadro de Honra"; "Honra" sozinho lê solene e vago | [layout.tsx:177](../src/app/(main)/layout.tsx) | baixa | decisão de espaço: manter curto ou "Ranking"… não — a palavra é do produto; opções: "Q. de Honra" é pior; manter "Honra" e aceitar, ou medir se "Quadro de Honra" cabe |
| V8 | **A navbar não tem "Início"** — a lei §7 lista Início como primeiro item; hoje o Saguão só se alcança pelo logo | [layout.tsx:153-194](../src/app/(main)/layout.tsx) (links medidos) | média — navegação, não tema | adicionar "Início" ou emendar a lei declarando o logo como Início |
| V9 | **`/puzzles/rating` sem h1 nenhum** — a tela mais usada do produto não tem nome | [rating/page.tsx](../src/app/(main)/puzzles/rating/page.tsx) (grep sem h1) | média | dar nome ("Modo Rating" no mínimo; melhor junto com V2) |
| V10 | **A matrícula quebra no meio** — a landing promete "Fazer minha matrícula" e a tela seguinte diz "Criar Conta", sem uma palavra do mundo; "Matrícula" só reaparece 2 telas depois | landing [page.tsx:227](../src/app/page.tsx) → [registro/page.tsx:75](../src/app/(auth)/registro/page.tsx) → login → [CriarPersonagemClient.tsx:67](../src/app/(main)/criar-personagem/CriarPersonagemClient.tsx) | **alta para acolhimento** — é o primeiro contato | `/registro` vira "Matrícula" (título) com "Criar conta" de subtítulo funcional; sucesso diz "Bem-vindo à Academia 64" |
| V11 | typo "aparecerao" | MuralClient:101 | trivial | acento |

Fora isso, medições que **absolvem**: "quartel", "tropa", "companhia",
"batalha" e "falha tática" têm zero ocorrências em `src/`; os rótulos de
análise dizem "Erro Grave", nunca "falha tática"; e "derrotados"/"Vitória
sobre…" são conflito **do jogo**, que a regra de ouro autoriza.

---

## 5. Integração — onde o mundo toca o aluno, e onde deveria

### 5.1 O mapa de toques atual (tudo que existe)

1. Nomes de tela e de sistema (§7) — consistentes, exceto os vazamentos da §4.
2. O título: navbar + moldura de cor em 6 superfícies + nome de trilha.
3. A faixa "Academia 64" — em **4 telas** (Saguão, Trilhas, Quadro de Honra,
   Matrícula); Desafios, Sala de Duelos e Perfil não a têm. A dose única por
   tela (§9) hoje é irregular: metade das telas tem dose zero.
4. A landing — o único lugar onde o mundo aparece inteiro (5 lugares, escada,
   slogan). **O aluno logado nunca mais a vê.**

E os não-toques que definem a experiência: nenhum personagem fala com o aluno
fora de partida; nenhum lugar é nomeado em rota logada; nenhum segredo é
insinuado; o baú entrega peça sem origem ("de onde veio este avental de
forja?" — das Oficinas, mas nenhuma tela diz); as conquistas raras não têm
casa.

### 5.2 As lacunas, ranqueadas

- **G1 — os únicos personagens do produto são da era morta** (bots do reino).
  Gravidade máxima: personagem é o embaixador natural de um mundo, e o nosso
  trabalha contra.
- **G2 — a descoberta (25% da fórmula) não existe logada.** A promessa da
  landing não tem contrapartida.
- **G3 — a aspiração é invisível** (sem próximo título, §3.3.1-2).
- **G4 — o acolhimento falha na porta** (V10: o primeiro contato é a tela com
  menos mundo de todas).
- **G5 — o ciclo de recompensa é mudo sobre o mundo** (peça sem origem,
  Arquivo sem mecânica, Chocadeira vazia em tela).

### 5.3 Propostas, na ordem do custo

**P0 — só copy (grátis, uma sessão de trabalho):**
- Os consertos V2–V11 da §4.
- Matrícula de ponta a ponta (V10) — maior ganho de acolhimento por real
  investido no projeto.
- **Uma assinatura de lugar em 3 telas onde o encaixe já existe**, respeitando
  a dose única: Revanche ↔ a Estufa (subtítulo: *"O que você revisa aqui,
  cresce."*), a Biblioteca de Finais ↔ a Biblioteca (ponte oficial, §2.1), e
  Insígnias raras ↔ o Arquivo (*"Guardada no Arquivo."* na conquista rara).
  São propostas de direção — a copy final passa pela `design-recruta64`.
- Uma linha de insinuação no Saguão, do exemplo pronto da Bíblia §8: *"Há uma
  sala da Academia que você ainda não visitou."*

**P1 — features pequenas (dias, não semanas):**
- **"Próximo título" na faixa e no perfil** (§3.3.1) + a copy de destino no
  topo da trilha (§3.3.2). O elo perdido da aspiração.
- **Origem da peça no card** — vitrine e modal do baú dizem o corredor
  (*"vinda das Oficinas"*). O corredor vira constante de código a partir do
  doc 22; sem banco novo. É descoberta de graça: cada peça sorteada apresenta
  um lugar.
- **Faixa nas telas que faltam** (Desafios, Sala de Duelos, Perfil) — a dose
  única vira regra cumprida, não intenção.
- A frase nível × título no perfil (§3.3.3).

**P2 — as obras (registradas, não empurradas):**
- **O Arquivo como mecânica** — a casa das conquistas raras e segredos; é a
  maior promessa não construída do mapa, e a materialização dos 25%.
- O elenco novo de bots — já planejado, travado na arte do Doug, sem prazo.
- Mini-jogos → Oficinas; Ovo/Chocadeira → pets. Já planejados em seus docs.

*(Nada em P0–P1 cria feature grande, coluna de banco ou slot novo — regra 3 do
projeto. E cada item termina em decisão do Doug, não em execução automática.)*

---

## 6. As perguntas que faltam responder

As que o pedido original não fez e esta revisão deixou expostas — cada uma com
recomendação, para o Doug confirmar ou derrubar:

- **Q1. A descoberta precisa de um mapa visível, ou copy basta?** Rec.: copy
  primeiro (P0, grátis, testável com alunos reais); uma tela de mapa só se um
  dia houver o que *fazer* nela — mapa clicável sem conteúdo é promessa quebrada
  duas vezes.
- **Q2. O que fazer com os bots do reino enquanto a arte não sai?** As opções
  honestas: (a) aceitar o interregno — palavra banida em tela até a arte
  chegar; (b) conserto provisório de dados — renomear só os `stage` para as
  alas novas, mantendo os bots velhos (mistura eras de outro jeito: "Léo, o
  Companheiro de Tenda" morando "no Pátio"); (c) priorizar os 10 retratos como
  o próximo bloco de arte do Doug. Rec.: **(c)** — é o desbloqueio de maior
  efeito do produto inteiro; (b) só se (c) não tiver data.
- **Q3. Estudante → Explorador entra?** É a única troca de nome recomendada
  (§3.2), e nunca será mais barata que agora (19 alunos). Decisão dele.
- **Q4. Quem fica com o nome "Arena"?** Rec.: o formato de aula fica, o
  lugar/ala vira "o Torneio" (§2.3, opção A) — **e a decisão precisa sair
  antes da migration dos bots**, enquanto ainda é papel.
- **Q5. Insígnias ou Conquistas?** Rec.: Insígnias, e varrer as ~8 sobras.
- **Q6. Quem é o dono da taxonomia de lugares?** Rec.: a tabela da Bíblia §5
  com a coluna de corredores (§2.2, opção A); doc 22 aponta para ela.
- **Q7. O aluno de 7 lê "Calouro"?** Não dá para responder de mesa — mas o
  clube tem alunos reais de 7. Rec.: teste de corredor de 10 minutos — mostrar
  a escada impressa a 3 alunos e ouvir. Barato e definitivo.
- **Q8. A Lenda fica secreta na landing de propósito?** Rec.: sim, se for
  assumido por escrito (vira charme de Arquivo); senão, consertar a linha.
- **Q9. Quando o Arquivo vira mecânica?** Fora do escopo desta revisão — mas é
  a resposta estrutural à pergunta "o aluno explora com objetivo?", e merece
  lugar no backlog com nome, não como ideia solta.
- **Q10. O professor-guia do currículo será um personagem do elenco?** Hoje
  currículo e elenco não se falam (medido: zero referências cruzadas). Se o
  Professor Abelardo ou a Noctua guiarem aulas um dia, o mundo entra na
  superfície onde o aluno passa mais tempo — sem custo de arte nova além dos
  retratos já previstos. Registrar para o plano da T3+.

---

## 7. Síntese das recomendações (o que fica com o Doug)

| decisão | recomendação | custo se aprovada |
|---|---|---|
| Taxonomia única de lugares | Bíblia §5 vira tabela-mãe com corredores | 2 docs |
| "Arena" | lugar/ala → "o Torneio"; formato de aula fica | 2 docs + 1 linha de landing |
| "a Estufa / os Jardins" | um nome só: a Estufa | 1 doc |
| Escada | manter, com uma troca: Estudante → **Explorador** | migration de nome de exibição |
| Próximo título na UI | fazer (P1) | feature pequena |
| Vazamentos de copy (V2–V11) | varrer em uma sessão | copy |
| Matrícula de ponta a ponta (V10) | fazer junto com a varredura | copy |
| Assinaturas de lugar (3 telas) + insinuação no Saguão | fazer (P0) | copy |
| Origem da peça no card do baú/vitrine | fazer (P1) | feature pequena |
| Bots do reino | priorizar os 10 retratos (Q2-c) | arte do Doug |
| O Arquivo como mecânica | registrar no backlog com nome | obra futura |

O que esta revisão **não** propõe: slot novo, coluna nova, recolorização,
mapa-tela, renomear slugs, ou qualquer coisa que a regra 4 do `CLAUDE.md`
proíbe. E nada acima é execução automática — cada linha espera o "sim" ou o
"não" dele.

---

## 8. Vereditos do Doug (2026-08-22)

Registrado no dia. **Nada foi executado ainda** — esta seção é a decisão, não a
entrega. Quando cada item descer, a lei que ele altera (Bíblia, doc 22,
currículo) é emendada na mesma passada.

| # | decisão | veredito | o que isso altera |
|---|---|---|---|
| D1 | colisão "Arena" | **o lugar e a ala viram "o Torneio"**; o formato de aula fica | Bíblia §5 e §5-alas, doc 22, 1 card da landing |
| D2 | escada de títulos | **Estudante → Explorador** | migration de nome de exibição (slugs intactos), Bíblia §6, `patentes.ts`, `TRAILS.name` |
| D3 | bots do reino em tela | **priorizar os 10 retratos — mas só depois de o avatar fechar** | ordem de trabalho: avatar primeiro, Bloco 3 dos bots depois |
| D4 | dono da taxonomia de lugares | **sim — a tabela da Bíblia §5 vira a lista única**, com uma coluna apontando o corredor do catálogo | Bíblia §5, doc 22 |
| D5 | "a Estufa / os Jardins" | **fica "os Jardins"**, um nome só | Bíblia §5; doc 22 renomeia o corredor "a Estufa" (7 peças) |
| D6 | Insígnias × Conquistas | **fica "Conquistas"** | **emenda à Bíblia §7**, que hoje declara "Insígnias" como oficial; varredura nos ~5 pontos que já dizem Insígnias |
| D7 | a Lenda na landing | **fica secreta, e isso passa a ser escrito** — descobre-se dentro, no espírito do Arquivo | Bíblia (nota na §6) |
| D8 | vazamentos de copy V2–V11 | **aprovado em princípio; executar na hora certa** — junto com a passada de copy de D1/D2/D9/D10 | `src/`, copy apenas |
| D9 | a matrícula | **aprovado, com direção de tom: "embarcar na aventura"** | `/registro` + tela de sucesso; copy passa pela `design-recruta64` |
| D10 | o Arquivo | **vira estante de troféus** — deixa de ser assinatura de copy e passa a ser superfície real | sobe de P0 para bloco próprio, com design; casa com D6 (é onde as Conquistas moram) |
| D11 | próximo título na interface | **A + D** — destino sempre nomeado, contagem só na reta final, formatura como momento, e a frase que explica nível × título | feature pequena (§9); **decisão irmã**: aplicar `lessons_required` acumulado quando a T1 tiver as 26 aulas |

**Nota sobre D4.** O Doug respondeu, na primeira rodada, que *os trajes não se
limitam mais ao nível; o nível só é indicado pela moldura*. Isso é lei vigente
(doc 21 §0, a patente saiu da roupa e virou moldura) e **nada nesta revisão a
toca** — D4 decide apenas **qual documento é dono da lista de lugares**, e "a
Casa" é etiqueta de prateleira do catálogo, sem gate, sem nível, sem
desbloqueio. Reapresentada e **aprovada** na segunda rodada.

**Ordem de execução acordada.** Os vereditos descem em blocos, com número
medido no fim de cada um: **(1) a lei** — Bíblia e doc 22; **(2) a copy das
telas** — V2–V11, matrícula, assinaturas de lugar; **(3) a migration do
Explorador** — toca 19 alunos em produção e **espera go explícito**; **(4) o
próximo título na interface**; **(5) a estante de troféus**, com design próprio.

**Nota sobre D10.** Duas assinaturas de lugar da proposta original seguem de pé
e não foram contraditadas: os Jardins ↔ `/puzzles/revanche` e a Biblioteca ↔ a
Biblioteca de Finais do currículo.

---

## 9. D11 — a progressão lenta (a decisão que ficou para pensar)

O Doug: *"quero que meus alunos demorem para evoluir e 'patente', como em uma
escola real de semestres."*

**O que está medido no banco hoje:**

- `title_tiers.lessons_required = tier * 15` — o primeiro título sai em **15
  aulas** (migration `20260729140000`).
- A promoção vem de **concluir uma trilha**, não de contar aulas soltas
  (decisão de 2026-08-11, migration `20260811120000`). Os marcos 15 e 30 são as
  fronteiras reais das duas trilhas que existem.
- O currículo planeja o acumulado real: **0 · 26 · 47 · 66 · 84 · 101 · 115 ·
  126**. O `UPDATE` **não foi aplicado de propósito** — ele entra junto com as
  26 aulas da T1, e a própria migration de 08-11 explica por quê: aplicá-lo
  hoje poria o marco 26 no meio da trilha `soldado`, e o aluno ganharia o título
  onze aulas antes do fim dela.
- Só existem **30 das 126 aulas**. Um aluno que consumir tudo hoje para no tier
  2 — por falta de conteúdo, não por ritmo.

**A conta do semestre.** A 2 aulas por semana, ritmo realista de clube:

| marco | aulas | tempo | leitura |
|---|---|---|---|
| primeiro título, hoje | 15 | ~8 semanas | meio semestre |
| primeiro título, plano do currículo | 26 | **~13 semanas** | **um semestre exato** |
| Grão-Mestre (tier 6) | 115 | ~57 semanas | ~3 anos de clube |
| Lenda (tier 7) | 126 | ~63 semanas | — |

**Conclusão: o ritmo que ele quer já está projetado.** Não é preciso inventar
lentidão — é preciso **aplicar o acumulado do currículo** quando as aulas da T1
existirem. Essa é a alavanca real de ritmo, e ela é uma linha de migration já
prevista.

**Por isso D11 não é uma decisão sobre ritmo — é sobre visibilidade**, e as duas
não brigam: mostrar o destino não acelera nada, só torna a lentidão legível.

**O argumento que vem da metáfora dele.** Numa escola real de semestres,
ninguém esconde o calendário. O aluno sabe quando o semestre acaba e o que vai
ser quando acabar — é isso que faz a espera valer. Lento **e** invisível não é
escola: é o aluno remando sem enxergar a margem. O risco de progressão lenta
nunca é pressa; é **abandono**.

**As opções de como mostrar:**

- **Opção A — destino sempre, número só na reta final.** O topo da trilha diz
  *"Trilha Calouro · você estuda para Explorador"*; a barra corre sem número
  durante quase toda a trilha; nas últimas ~5 aulas aparece *"faltam 4 aulas
  para você virar Explorador"*. Aspiração o tempo todo, contagem só quando ela
  vira reta final.
- **Opção B — contagem sempre visível.** Mais claro; mas 26 aulas de distância
  lidas como número, para um aluno de 7, leem como muro.
- **Opção C — nada antes da formatura.** Mistério máximo, risco de abandono
  máximo. É o estado de hoje, e é o defeito G3 desta revisão.
- **Opção D — o semestre explícito** (combina com A): a trilha é apresentada
  como o semestre da Academia, com um momento nomeado de **formatura** no fim.
  Isso põe a metáfora dele na tela em vez de deixá-la só na cabeça.

**Recomendação: A + D.** Destino sempre nomeado, contagem só na reta final,
formatura como momento — e a frase que explica o par que hoje ninguém explica:
*nível mede presença (você apareceu); título mede formação (você concluiu)*.

**Decisão irmã, que é a de ritmo de verdade:** aplicar `lessons_required =
0·26·47·66·84·101·115·126` quando as 26 aulas da T1 existirem. Sem isso, o
primeiro título continua saindo em 15 aulas — metade do semestre que ele quer.
