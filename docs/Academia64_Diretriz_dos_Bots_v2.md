# Academia 64 — Diretriz dos Bots v2

> **Substitui** `Recruta64_Diretriz_Geral_dos_Bots_v1.md` (os 20 Mestres do Reino),
> que está marcada como superada desde 2026-08-20.
>
> **Deriva de** [`Academia64_Biblia_Tonal_v2.md`](Academia64_Biblia_Tonal_v2.md) —
> §5 (o mapa e as 5 alas), §11 (o elenco de bots) e §12.4 (a Sala de Duelos).
> Onde este doc divergir da Bíblia, **a Bíblia vence**. Este doc não cria lei
> tonal; ele aplica a lei ao elenco e diz o que vai para o banco.
>
> **Escrito em 2026-08-21, Bloco 3 da virada Academia 64.**

---

## 1. O que este documento decide, e o que ele não decide

**Decide:** a lei do elenco (quem pode ser bot, e o que o elenco precisa ter como
conjunto), a anatomia técnica de um bot, a lei das falas, a distribuição pelas 5
alas, e **os 10 personagens** — nome, epíteto, natureza, função, personalidade,
estilo de xadrez e função pedagógica.

**Não decide:**

- **A arte.** Os retratos são do Doug e não têm prazo. Os dez pedidos, no molde do
  `PEDIDO-TRAJE.md`, estão em
  [`Academia64_Pedidos_de_Retrato_dos_Bots.md`](Academia64_Pedidos_de_Retrato_dos_Bots.md)
  — inclusive a medição que mostra que o retrato é um **círculo de no máximo 96 px**,
  e a pendência de produto que sai dela.
- **As 110 falas.** A §5 fixa a *lei* das falas e dá **um bot escrito por
  inteiro** como referência de voz. As outras nove fichas de fala nascem junto
  com a migration — escrever 110 linhas de um elenco que ainda pode mudar é
  trabalho jogado fora.
- **A força de jogo.** `elo`, `skill_level`, `depth` e `unlock_order` **não
  mudam** — ver §3. A escada de dificuldade que existe hoje está calibrada e
  medida; o elenco novo entra por cima dela, não no lugar dela.

---

## 2. A lei do elenco

Herdada da Bíblia §11, sem afrouxar, e com o que a aplicação ao elenco novo
obriga a acrescentar:

1. **Cada bot tem um traço, não uma biografia.** O aluno tem de conseguir dizer
   quem é o bot em uma frase, depois de uma partida só.
2. **Um bot não precisa ser humano nem de época.** Coruja, autômato, criatura —
   tudo cabe, desde que **pertença à Academia**: aluno, professor, funcionário,
   morador, visitante ou adversário convidado.
3. **O que amarra o elenco é o lugar, nunca o século.** Não existe bot de outro
   universo, e não existe bot "de época" — nem medieval, nem militar, nem
   futurista. Se a peça só faz sentido dentro de um século, ela está errada.
4. **Variedade em três eixos ao mesmo tempo:** natureza (humano, animal,
   autômato, criatura), função (aluno, professor, funcionário, morador,
   visitante) e personalidade. Dez personagens bons da mesma natureza continuam
   sendo um elenco pobre. A conferência está na §7.
5. **O humor mora embaixo.** Leve e pontual, mais presente nas alas iniciais.
   Bot forte não faz piada boba, e **nenhum** bot humilha o aluno.
6. **Os bots avançados parecem notáveis, não aleatórios.** Quem chega ao
   Observatório e à Arena tem de sentir que subiu de andar.
7. **O estilo de xadrez é narrativa; a força é medida.** O motor só recebe
   `skill_level` e `depth` — "joga com armadilhas de abertura" é personagem, não
   configuração. Por isso o estilo escrito aqui **tem de ser compatível com a
   força do degrau**: um bot de 250 que "nunca entrega peça" é mentira que o
   aluno descobre no terceiro lance.
8. **O epíteto é curto, e é um cargo ou um traço** — não uma frase. "a Zeladora",
   "o Distraído", "a Coruja do Arquivo". Nunca "aquele que enxerga além do
   tabuleiro".

---

## 3. Anatomia técnica de um bot

Um bot é **uma linha em `public.bots`** mais **um PNG em `public/bots/`**. Não há
código por bot.

| campo | muda no Bloco 3? | observação |
|---|---|---|
| `id` | **NUNCA** | É FK com `ON DELETE CASCADE` em `user_bot_results` e `user_bot_first_wins`. Apagar um bot **some com o histórico dos alunos**. |
| `elo` | **NUNCA** | Escada calibrada: 250 · 400 · 550 · 700 · 850 · 1000 · 1150 · 1300 · 1450 · 1600. |
| `skill_level` | **NUNCA** | Stockfish: 0 · 1 · 2 · 4 · 6 · 8 · 10 · 12 · 13 · 14. |
| `depth` | **NUNCA** | 1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10. |
| `unlock_order` | **NUNCA** | 1 a 10, na ordem do elo. |
| `slug` | sim | Chave do retrato: [`BotAvatar.tsx:47`](../src/components/bots/BotAvatar.tsx#L47) monta `public/bots/{slug}.png`. **Trocar o slug sem o PNG novo no disco dá 404 na cara do aluno.** |
| `name` | sim | Nome exibido. |
| `epithet` | sim | Ver §2, regra 8. |
| `personality` | sim | Uma frase. É texto de produto, não anotação interna. |
| `stage` | sim | Uma das **5 alas** da §4. É `text` livre, casado **por string** com `BotGrid.tsx` — ver §4. |
| `emoji` | sim | Um caractere. Zero época. |
| `phrases_json` | sim | Ver §5. |
| `avatar_url` | não | Está vazio nos 10 e continua vazio; o retrato vem pelo slug. |

**A migration é `UPDATE` no lugar, dez vezes. Nunca `DELETE`+`INSERT`.**
A chave do `WHERE` é o **`slug` antigo**, que é `UNIQUE` e conhecido — evita ter
de descobrir `id` no banco e é igualmente inequívoca:

```sql
UPDATE public.bots
   SET slug = 'bia', name = 'Bia', epithet = 'a Caloura', ...
 WHERE slug = 'leo';
```

**Os 10 PNG têm de estar no disco antes de a migration descer.** Não há banco
separado (D3): toda migration bate em produção na hora. A janela entre o banco e
o código publicado tem de durar minutos — o caminho medido no Bloco 2 foi
*código pronto e verde primeiro, migration depois, merge e push em seguida.*

---

## 4. As 5 alas

Da Bíblia §5, em ordem crescente de dificuldade:

**1 o Pátio → 2 as Salas de Treino → 3 a Biblioteca → 4 o Observatório → 5 a Arena.**

Substituem as 5 regiões do Reino (Acampamento dos Recrutas, Vila dos Soldados,
Fortaleza dos Estrategistas, Cidade dos Generais, Cidadela dos Mestres), que hoje
estão gravadas em `bots.stage` **e duplicadas em TypeScript** em
[`BotGrid.tsx:8-22`](../src/components/bots/BotGrid.tsx#L8-L22) (`STAGE_ORDER` e
`STAGE_STARS`), com fallback `"Acampamento dos Recrutas"` na
[linha 35](../src/components/bots/BotGrid.tsx#L35). O casamento é **por string**:
o banco e o TS mudam no mesmo commit, ou a ala some da tela sem erro nenhum.

**Distribuição: 2 bots por ala.** As estrelas do `BotGrid` vão de 1 a 5, e hoje só
3 alas têm bot — os degraus ★★★★ e ★★★★★ nunca aparecem, e a copy da Bíblia §12.4
("Você venceu alguém do Observatório") não tem a quem se referir. Com 2 por ala a
escada de estrelas fica inteira, a Arena existe, e sobra sala em cada ala para o
elenco crescer.

| ala | estrelas | bots | faixa de elo |
|---|---|---|---|
| o Pátio | ★ | Bia · Bolt | 250–400 |
| as Salas de Treino | ★★ | Pip · Dona Filó | 550–700 |
| a Biblioteca | ★★★ | Professor Abelardo · Noctua | 850–1000 |
| o Observatório | ★★★★ | Gael · Madame Véspera | 1150–1300 |
| a Arena | ★★★★★ | Ísis · O Visitante | 1450–1600 |

---

## 5. A lei das falas

`phrases_json` tem **4 chaves**, e o total por bot é **11 falas**:

| chave | quantas | quando toca | quem fala |
|---|---|---|---|
| `pre_game` | **3** | tela de pré-jogo, [`BotPreGame.tsx:30`](../src/components/bots/BotPreGame.tsx#L30) | o bot, cumprimentando |
| `during` | **4** | balão durante a partida | o bot, reagindo ao tabuleiro |
| `on_win` | **2** | fim de partida | o bot **quando o bot vence** |
| `on_loss` | **2** | fim de partida | o bot **quando o bot perde** |

**A perspectiva é a do bot — e isto precisa estar escrito, porque hoje o banco e o
código discordam.** Ver §8.

**Regras de escrita:**

- `pre_game` é **saudação ou provocação leve**, nunca reação a lance — a tela de
  pré-jogo acontece antes do primeiro lance. Foi exatamente esse o conserto da
  migration `20260307130000_fix_bot_phrases.sql`, que tirou uma reação de jogo do
  `pre_game` do Léo.
- `during` é curta — cabe num balão, sem vírgula demais.
- `on_loss` (o bot perdeu) **reconhece o aluno**. Nunca desculpa esfarrapada em
  bot forte; nunca amargura.
- `on_win` (o bot venceu) **aponta o que faltou**, sem humilhar. Bíblia §12.4:
  evitar humilhação do jogador.
- Zero época e zero patente: saem "recruta", "soldado", "companhia", "campanha".
  O bot chama o aluno de **aluno**, pelo título quando fizer sentido, ou de nada.
- Cada bot tem **vocabulário próprio**. Se duas fichas de fala trocarem de dono
  sem ninguém notar, uma das duas está errada.

### Referência de voz — a ficha completa da Bia

As outras nove nascem junto com a migration. Esta existe para o Doug julgar o tom
agora:

```json
{
  "pre_game": [
    "Oi! Eu sou a Bia, cheguei semana passada. Vamos?",
    "Ainda tô decorando onde fica cada sala. E cada peça.",
    "Se eu fizer besteira, finge que não viu."
  ],
  "during": [
    "Opa. Isso eu não tinha visto.",
    "Espera, deixa eu contar de novo...",
    "Achei que dava certo!",
    "Anotado. Da próxima eu não caio nessa."
  ],
  "on_win": [
    "Ganhei?! Eu ganhei! Desculpa, é a primeira vez.",
    "Boa partida. Faltou olhar a casa do lado, acho."
  ],
  "on_loss": [
    "Você jogou bem demais. Me ensina esse lance?",
    "Perdi, mas foi divertido. Bora de novo!"
  ]
}
```

---

## 6. O elenco

Dez personagens. `elo`, `skill_level`, `depth` e `unlock_order` são os que já
estão no banco — a linha **substitui** diz de qual registro cada um toma o lugar.

---

### Ala 1 — o Pátio ★

#### 1. Bia, *a Caloura* — `bia` 🎒

- **elo** 250 · skill 0 · depth 1 · unlock 1 · **substitui** `leo`
- **Natureza** humana · **Função** aluna · **Personalidade** calorosa, falante, insegura
- **Traço:** chegou semana passada e ainda se perde nos corredores.
- **Xadrez:** joga rápido demais, deixa peça solta, não vê ameaça de um lance.
- **Ensina:** capturar peça pendurada; enxergar a ameaça mais simples.

#### 2. Bolt, *o Autômato de Corda* — `bolt` ⚙

- **elo** 400 · skill 1 · depth 2 · unlock 2 · **substitui** `skippy`
- **Natureza** autômato · **Função** engenhoca da Academia · **Personalidade** literal, obstinado, sem malícia
- **Traço:** dá-se corda antes da partida, e vai perdendo o fôlego no meio dela.
- **Xadrez:** empurra peões sem apoio, ataca cedo e esquece a segurança do rei.
- **Ensina:** atacar sem base abre buracos.

---

### Ala 2 — as Salas de Treino ★★

#### 3. Pip, *o Bicho do Armário* — `pip` 👀

- **elo** 550 · skill 2 · depth 3 · unlock 3 · **substitui** `tome`
- **Natureza** criatura · **Função** morador clandestino · **Personalidade** rápido, atrevido, sumido
- **Traço:** mora atrás dos armários das salas de treino, e ninguém nunca o viu inteiro.
- **Xadrez:** ataca sempre, nunca recua, agarra material e sai correndo.
- **Ensina:** punir ataque precipitado; coordenar em vez de correr.

#### 4. Dona Filó, *a Zeladora* — `dona-filo` 🧹

- **elo** 700 · skill 4 · depth 4 · unlock 4 · **substitui** `sargento-pardo`
- **Natureza** humana · **Função** funcionária · **Personalidade** seca, prática, sem paciência para firula
- **Traço:** trabalha na Academia há mais tempo que qualquer professor, e aprendeu vendo.
- **Xadrez:** não entrega peça de graça, ocupa o centro e desenvolve sem pressa.
- **Ensina:** é o primeiro filtro real de fundamentos.

---

### Ala 3 — a Biblioteca ★★★

#### 5. Professor Abelardo, *o Distraído* — `prof-abelardo` 📖

- **elo** 850 · skill 6 · depth 5 · unlock 5 · **substitui** `iris`
- **Natureza** humano · **Função** professor · **Personalidade** erudito, gentil, disperso
- **Traço:** esquece o nome de todo mundo, mas sabe de cor toda armadilha de abertura já publicada.
- **Xadrez:** joga armadilhas de abertura e pune ordem de lances errada.
- **Ensina:** a ordem dos lances na abertura conta mais do que parece.

#### 6. Noctua, *a Coruja do Arquivo* — `noctua` 🦉

- **elo** 1000 · skill 8 · depth 6 · unlock 6 · **substitui** `breno`
- **Natureza** animal · **Função** guardiã do Arquivo · **Personalidade** silenciosa, paciente, enigmática
- **Traço:** fala pouco, e o pouco que fala parece que já sabia como ia terminar.
- **Xadrez:** defesa sólida, estrutura firme, não se abala com pressão.
- **Ensina:** romper defesa paciente sem se afobar.

---

### Ala 4 — o Observatório ★★★★

#### 7. Gael, *o Relojoeiro* — `gael` ⏱

- **elo** 1150 · skill 10 · depth 7 · unlock 7 · **substitui** `silas`
- **Natureza** humano · **Função** funcionário/artesão · **Personalidade** preciso, econômico, sem pressa
- **Traço:** cuida dos relógios e do mecanismo do telescópio; monta a posição como monta engrenagem.
- **Xadrez:** linhas longas, cravadas, ameaças que já estavam montadas dez lances antes.
- **Ensina:** diagonais e ameaças à distância.

#### 8. Madame Véspera, *a Astrônoma* — `vespera` 🔭

- **elo** 1300 · skill 12 · depth 8 · unlock 8 · **substitui** `capita-lucia`
- **Natureza** humana · **Função** professora · **Personalidade** noturna, exigente, fala pouco
- **Traço:** só dá aula depois que escurece, e calcula mais longe do que conta.
- **Xadrez:** clássico e central, princípios acima de improviso, precisão alta.
- **Ensina:** método vence talento sem preparo.

---

### Ala 5 — a Arena ★★★★★

#### 9. Ísis, *a Campeã do Torneio* — `isis` 🏆

- **elo** 1450 · skill 13 · depth 9 · unlock 9 · **substitui** `cassio`
- **Natureza** humana · **Função** aluna veterana · **Personalidade** competitiva, rápida, respeitosa
- **Traço:** ganhou o torneio da Academia três vezes e trata cada partida como a quarta.
- **Xadrez:** repertório de abertura afiado, precisão alta, não improvisa.
- **Ensina:** ter repertório é diferente de saber abrir.

#### 10. O Visitante — `visitante` 🎭

- **elo** 1600 · skill 14 · depth 10 · unlock 10 · **substitui** `helena`
- **Natureza** não declarada · **Função** visitante · **Personalidade** cortês, silencioso, impossível de ler
- **Traço:** **não tem epíteto, de propósito** — a identidade é a descoberta. Passa
  uma temporada na Academia, joga com quem chegou até aqui, e ninguém sabe de
  onde veio.
- **Xadrez:** posicional puro; toma espaço casa por casa, e você percebe tarde.
- **Ensina:** espaço e domínio de casas.
- **Nota de arte:** é o único retrato que pode esconder o rosto. Ele continua
  pertencendo à Academia (Bíblia §11, regra 7) — é estranho, não é de outro
  universo.

---

## 7. Conferência de variedade (Bíblia §11, regra 6)

| eixo | distribuição |
|---|---|
| **Natureza** | humano 6 (Bia, Dona Filó, Abelardo, Gael, Véspera, Ísis) · autômato 1 (Bolt) · criatura 1 (Pip) · animal 1 (Noctua) · não declarada 1 (O Visitante) |
| **Função** | aluno 3 (Bia, Ísis, e Pip como clandestino) · professor 2 (Abelardo, Véspera) · funcionário 2 (Dona Filó, Gael) · morador/guardião 2 (Pip, Noctua) · engenhoca 1 (Bolt) · visitante 1 (O Visitante) |
| **Personalidade** | calorosa · literal · atrevida · seca · dispersa · silenciosa · precisa · exigente · competitiva · ilegível |
| **Época** | **nenhuma.** Zero patente, zero armadura, zero campanha. |
| **Humor** | concentrado nas alas 1–2 (Bia, Bolt, Pip); ausente das alas 4–5. |

---

## 8. Um defeito medido, encontrado ao escrever esta diretriz

**`on_win` e `on_loss` estão invertidos entre o banco e o código.** Hoje, quando o
aluno **vence**, o bot comemora a própria vitória.

- **Código:** [`GameOverModal.tsx:94`](../src/components/bots/GameOverModal.tsx#L94)
  faz `result === "win" ? "on_loss" : "on_win"`. E `result` é o resultado **do
  aluno** ([`botGameLogic.ts:15`](../src/lib/chess/botGameLogic.ts#L15):
  `loserColor === playerColor ? "loss" : "win"`). Ou seja: o código lê as chaves
  na **perspectiva do bot**.
- **Dados:** os 10 bots semeados em `20260307120000_bots_new_canon.sql` foram
  escritos na **perspectiva do aluno**. O `on_win` do Léo é *"Boa! Você me pegou
  fácil!"* (o bot perdeu) e o `on_loss` é *"Opa, ganhei! Mas foi sorte, viu?"* (o
  bot ganhou). Os 10 são consistentes entre si e contrários ao código.
- **Efeito:** o aluno dá xeque-mate no Sargento Pardo e ouve *"Revise os
  fundamentos, recruta."*

Este doc fixa a **perspectiva do bot** (§5) — é a leitura natural do nome do campo
e é a que o código já implementa. Portanto **o conserto é de dados**.

**Medido no banco antes do conserto** (`.scratch/medir-perspectiva-falas.ts`), os 10
bots, primeira fala de cada chave:

| slug | `on_win` (deveria ser o bot vencendo) | `on_loss` (deveria ser o bot perdendo) |
|---|---|---|
| leo | "Boa! Você me pegou fácil!" | "Opa, ganhei! Mas foi sorte, viu?" |
| sargento-pardo | "Aprovado, soldado. Pode seguir." | "Revise os fundamentos, recruta." |
| helena | "Você redesenhou o mapa. Bela conquista." | "O território era meu desde o início." |

Os 10 seguem o mesmo padrão: **as duas colunas estão trocadas em todos**.

**O conserto, APLICADO em 2026-08-21:**
`supabase/migrations/20260821170000_bots_perspectiva_das_falas.sql` troca as duas
chaves de lugar nos 10 bots e escreve a perspectiva no `COMMENT ON COLUMN`. Medido no
banco depois de aplicar, os mesmos três: o `on_win` do `leo` virou *"Opa, ganhei! Mas
foi sorte, viu?"*, o do `sargento-pardo` virou *"Revise os fundamentos, recruta."* e o
da `helena` virou *"O território era meu desde o início."* — **os 10 trocaram, e agora
`on_win` é o bot vencendo.** `verify:phase6` 18/0 e `verify:seeds` OK depois. A migration **não é idempotente** — rodar duas vezes desfaz o
conserto. O elenco novo reescreve as 110 falas por cima dela, já na perspectiva
certa. O site do código ganhou o comentário que faltava, em
[`GameOverModal.tsx:93-98`](../src/components/bots/GameOverModal.tsx#L93-L98).

**Por que não há gate permanente para isto.** "Esta frase foi dita por quem venceu?"
não é decidível por máquina a partir da prosa. A evidência é a medição antes/depois
acima. O que **é** verificável e entra junto com a migration do elenco é a
**contagem por chave** da §5 (3 · 4 · 2 · 2): hoje 9 dos 10 bots já batem, e só o
`leo` tem `during` 5 — por isso o gate não pode entrar antes, ou reprovaria o
`verify:all` de hoje.

---

## 9. As três decisões que estavam abertas — e como ficaram (2026-08-21)

1. **2 bots por ala × 5 alas.** ✅ Escolhido. A alternativa era manter 3 alas cheias
   (4+4+2), como hoje. Pesou a expansão futura: com 4 por ala o elenco chega a 20 —
   o tamanho da escada que a v1 já tinha desenhado — sem que nenhuma ala precise
   nascer depois. E pesou a progressão sentida: com 3 alas, o aluno que vence o bot
   mais forte do produto continua na Biblioteca, e os degraus ★★★★ e ★★★★★ nunca
   aparecem na tela.
2. **Pip, o Bicho do Armário, no lugar de "Tico, o Punk do Pátio"** (o rascunho do
   plano). ✅ Escolhido. Com Tico o elenco fechava em **7 humanos de 10**, e a Bia já
   ocupava o arquétipo do aluno-criança — a regra 6 da Bíblia não fechava.
3. **Quando consertar a inversão da §8.** ✅ Saída (a): migration mínima agora —
   **aplicada e medida em 2026-08-21**. Mata
   o defeito hoje, e a migration do elenco a substitui de qualquer jeito. As
   descartadas: *(b)* esperar a migration do elenco — custo zero, mas o defeito ficava
   no ar enquanto a arte não chega, e a arte não tem prazo; *(c)* virar o código —
   uma linha, mas o nome do campo passaria a mentir para sempre.

---

## Apêndice — o que morreu da v1, e por quê

A v1 descrevia **20 Mestres** de uma campanha militar num reino medieval. Cai
inteira — não por qualidade, mas porque o produto trocou de mundo em 2026-08-20.
O motivo medido está no Apêndice A da Bíblia v2.

O que especificamente não sobrevive:

- **As 5 regiões** (Acampamento dos Recrutas → Cidadela dos Mestres) viram as 5
  alas da Academia. São dado de banco, não texto: migram com o elenco.
- **A escada de 20** vira uma escada de 10 com **sala para crescer dentro de cada
  ala**. Os 10 ids do banco são os que existem; os outros 10 nunca foram semeados.
- **A patente por estágio** ("Estágio 1 — Patente: Recruta") morre: a patente
  virou **título** (Bíblia §6), e o título é do aluno, não do bot.
- **O elenco inteiro.** Léo, Skippy, Tomé, Sargento Pardo, Íris, Breno, Silas,
  Capitã Lúcia, Cássio e Helena saem do banco por `UPDATE`. Os PNG antigos saem do
  repositório quando os novos entrarem — o git guarda.

O que sobrevive, e é o que fez a v1 valer a pena: **a calibração**. A escada de
elo/skill/depth e a função pedagógica de cada degrau foram desenhadas ali, estão
medidas, e o elenco novo entra por cima delas sem tocar em um número.
