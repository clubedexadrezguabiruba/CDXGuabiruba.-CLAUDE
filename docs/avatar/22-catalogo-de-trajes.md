# 22 — O catálogo de trajes da Academia 64: 40 peças, com raridade

> **ISTO É UM MENU, NÃO UMA FILA DE PRODUÇÃO.**
>
> Nenhuma peça desta lista está encomendada. O documento existe para que a
> **próxima** arte tenha de onde ser escolhida, em vez de ser inventada na hora — e
> para que o catálogo inteiro tenha uma forma pensada antes de a primeira metade
> existir.
>
> A trava nº 1 do doc 21 §1.3 continua valendo inteira: **arte por demanda, nunca
> estoque.** Cada peça só vira pedido quando for chamada, e passa pela folha de
> contato antes de a seguinte começar. Foi assim que a v2 morreu — 8 uniformes no
> banco, 0 renderáveis — e é isso que não se repete.
>
> **Não prepare prompt de nada daqui sem o Doug pedir a peça pelo nome.**

Criado em 2026-08-13, junto com a emenda §0 do doc 21.

---

## 1. A economia, em uma linha

**1 traje inicial + 39 por baú.**

| | |
|---|---|
| **inicial** | `traje-farda` — `origem = 'marco_nivel'`, `min_level = 1`. Livre desde a criação do avatar, sem raridade |
| **os outros 39** | `origem = 'bau'`, com raridade. O baú é a **única** porta |
| **"sem traje"** | continua válido — `NULL` = o macacão de treino da base. Espelha o careca do cabelo: o inicial é **opção**, não obrigação |

O inicial **não** é semeado como "baú grátis". Peça de `origem = 'bau'` exige linha
em `avatar_guarda_roupa`, e a conferência 4 do `verify:avatar-db` reprovaria em
bloco.

**Por que a farda é a inicial:** é a peça lisa do catálogo, a de menos detalhe — e é
dela que a raridade sobe. Um aluno que começa com a peça mais ornamentada não tem
para onde subir. O **gambesão** entra como peça de baú acima de `common`, porque
carrega canaletas, ilhoses e cordão.

## 2. A pirâmide

Espelha exatamente as chances de sorteio de hoje (45 / 30 / 18 / 7%), para que o
tempo esperado até completar uma faixa seja parecido em todas:

| raridade | chance no baú | peças | por quê esse número |
|---|---|---|---|
| `common` | 45% | **17** | a faixa que o aluno vai ver muitas vezes; precisa de variedade para não repetir |
| `rare` | 30% | **12** | |
| `epic` | 18% | **7** | |
| `legendary` | 7% | **3** | raro de verdade: três peças que o aluno vai lembrar |
| | | **39** | + o inicial = **40** |

## 3. O que a raridade significa em desenho

**Mais raro = mais detalhe e ornamento.** Não "mais cor", não "mais brilho", não
"maior". A régua vem da lição que a farda e o gambesão pagaram:

> **Detalhe se ganha por repetição regular, nunca por tamanho.** Cinco canaletas
> iguais viram textura ao encolher; um brasãozinho no peito vira sujeira.

Por isso cada peça deste catálogo declara, na coluna **textura**, *qual é o padrão
repetido que ela tem e as outras não*. É essa coluna — não a descrição — que decide
se a peça lê a 56 px.

| raridade | quantos eventos de construção | exemplo |
|---|---|---|
| `common` | **1** padrão repetido, e nada mais | uma malha canelada; um xadrez miúdo |
| `rare` | **2** padrões, ou 1 padrão + 1 fecho de destaque | canaletas **+** cordão de ilhoses (o gambesão) |
| `epic` | **3** padrões, ou 2 + um material inesperado | alamares **+** botões de bola **+** debrum |
| `legendary` | a peça **inteira** é um sistema — cada campo é diferente e o conjunto tem uma lógica | vitral: chumbo preto separando painéis, cada painel de um tom |

## 4. As leis de arte que valem para TODA peça deste catálogo

Cinco, e as duas últimas nasceram com a paleta permissiva (doc 21 §0.4):

1. **Gate −1** — a peça não move o boneco.
2. **Transbordo obrigatório, alvo ~10%** — barra, gola, ombro ou punho. Peça inteira
   dentro da silhueta lê como tinta sobre madeira.
3. **Legibilidade a 56 px na folha.**
4. **Contraste com o fundo claro `#FBF8F5`.** Peça bege ou marfim **some** no card
   do editor. Isto elimina uma família inteira de cores do catálogo, e é de
   propósito.
5. **O contorno preto do boneco continua legível.** Peça muito escura come a
   silhueta que dá identidade ao personagem.

A aprovação final é **o olho do Doug na folha**. As cinco reprovam; nenhuma aprova.

### O que este boneco não pode vestir, e o motivo é técnico

**Nada com forma própria que mude a silhueta geral:** capa, manto, tabardo, capuz,
gola alta por trás, ombreira, cabelo ou pano passando por cima do ombro.

A razão está no compositor: o que fica **atrás da cabeça** precisa ser uma
`extensao` em vetor (`atras: true`), e a esteira de traçado do traje **não existe**.
Pedir arte assim é pedir o que o programa não sabe montar. Foi por isso que a túnica
com capuz caído foi descartada em 2026-08-12.

**E o boneco não tem:** braço, mão, dedo, ombro saliente, manga, cava, punho, luva,
perna, pé, bota, calça, pescoço, orelha. O corpo é uma peça só, em forma de sino.
Toda peça deste catálogo tem de fazer sentido **sem mangas** — é o filtro que mais
corta ideia boa, e é melhor descobrir aqui do que no Gemini.

**A gola para no queixo (y 515 px na base de edição), nem um pixel acima.**

---

## 5. As 40 peças

Organizadas por **corredor da Academia**, que é o que dá coerência ao conjunto sem
precisar de época. Um aluno com o traje da forja e outro com o do observatório
pertencem visivelmente ao mesmo lugar.

A coluna **textura** é o padrão repetido que faz a peça ler a 56 px. Se uma peça
nova não tiver o que escrever ali, ela ainda não está desenhada.

### 5.0 A inicial

| slug | corredor | textura | construção |
|---|---|---|---|
| `traje-farda` | a Casa | painéis no peito + faixa na cintura | **já existe e está aprovada.** É a peça lisa: dois painéis, uma faixa horizontal, barra reta. Recebe o slug novo no Bloco B4 (era `traje-soldado-farda`) |

### 5.1 `common` — 17 peças

Um padrão repetido, e nada mais. São as peças que o aluno vê muitas vezes: elas
existem para dar variedade, não para impressionar.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 1 | `traje-gola-role` | a Casa | canelado vertical fino, de cima a baixo | malha de gola rolê baixa; o canelado é o desenho inteiro |
| 2 | `traje-colete-estudo` | a Casa | fileira de 4 botões + as duas bordas do colete | colete sobre camisa clara, decote em V |
| 3 | `traje-listrado` | a Casa | listras horizontais largas, iguais | malha de listras; a barra corta no meio de uma listra |
| 4 | `traje-vichy` | a Casa | xadrez miúdo — repetição por definição | camisa de tecido vichy, decote reto |
| 5 | `traje-suspensorios` | a Casa | duas tiras verticais paralelas | camisa clara com suspensórios e fivelas pequenas |
| 6 | `traje-jaleco` | as Oficinas | fileira vertical de botões + a lapela | jaleco de laboratório, comprido, barra reta abaixo do corpo |
| 7 | `traje-avental-forja` | as Oficinas | fileira de rebites nas tiras | avental de couro grosso, tira no peito, barra irregular |
| 8 | `traje-macacao-oficina` | as Oficinas | pespontos duplos correndo por toda a peça | macacão de brim, peitilho quadrado |
| 9 | `traje-guarda-po` | o Arquivo | pregas verticais soltas | guarda-pó longo, cordão fino na cintura |
| 10 | `traje-tunica-linho` | o Arquivo | franzido regular do cordão | túnica de linho cru cingida — cor **não** pode ser bege (lei 4) |
| 11 | `traje-flanela` | a Estufa | xadrez grande de flanela | camisa de flanela, decote aberto |
| 12 | `traje-tricot-trancado` | a Estufa | tranças verticais de tricô | suéter pesado de tranças |
| 13 | `traje-sueter-nordico` | a Estufa | faixa de padrão nórdico repetido no peito | suéter liso com uma faixa de padrão |
| 14 | `traje-avental-cozinha` | a Cozinha | a tira cruzada + a barra dupla | avental de peito claro sobre peça escura |
| 15 | `traje-camisa-time` | o Torneio | duas faixas laterais correndo do alto à barra | camisa de time, gola careca |
| 16 | `traje-moletom` | o Torneio | o franzido do cordão + o bolso canguru | moletom, capuz **caído não** — sem capuz (§4) |
| 17 | `traje-kurta` | os Visitantes | fileira de bordado de linha no decote | kurta de algodão comprida, fenda lateral |

### 5.2 `rare` — 12 peças

Dois padrões, ou um padrão mais um fecho que se destaca.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 18 | `traje-gambesao` | a Casa | 5 canaletas acolchoadas **+** cordão em zigue-zague por 8 ilhoses | **a arte já existe e está aprovada** (2026-08-12). Entra pelo Bloco B4 |
| 19 | `traje-blazer-academia` | a Casa | debrum de contraste em toda a borda **+** fileira de botões | blazer da Academia, lapela pequena |
| 20 | `traje-corselete` | a Casa | ilhoses em duas colunas **+** cadarço cruzado entre elas | corselete sobre peça clara |
| 21 | `traje-colete-arquivista` | o Arquivo | fileira dupla de bolsos pequenos, todos iguais | colete de muitos bolsos, cada um com sua costura |
| 22 | `traje-tunica-runica` | o Arquivo | faixa de sinais repetidos no decote **+** a mesma na barra | túnica escura com bordado de runas |
| 23 | `traje-cotele` | as Oficinas | canelas grossas de veludo cotelê **+** botões forrados | conjunto de cotelê, decote reto |
| 24 | `traje-jardineira` | a Estufa | duas alças com fivela **+** fileira de bolsos no peitilho | jardineira de trabalho sobre camisa |
| 25 | `traje-argyle` | a Estufa | losangos de argyle **+** as linhas finas cruzando | suéter de losangos — a textura mais forte do catálogo a 56 px |
| 26 | `traje-quimono-escola` | os Visitantes | franzido da faixa **+** o nó | quimono de treino, faixa larga na cintura |
| 27 | `traje-dashiki` | os Visitantes | painel geométrico bordado no peito **+** barra bordada igual | dashiki, decote em V com bordado |
| 28 | `traje-anorak` | o Torneio | franzido do cordão na cintura **+** faixa refletiva horizontal | anorak de expedição, sem capuz (§4) |
| 29 | `traje-marinheiro` | o Torneio | gola marinheira quadrada **+** três galões paralelos na barra | peça clara, gola de outro tom |

### 5.3 `epic` — 7 peças

Três padrões, ou dois mais um material inesperado. Aqui a peça passa a ter **ideia**,
não só construção.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 30 | `traje-alamares` | a Casa | 6 alamares horizontais **+** botões de bola **+** debrum | casaca de banda da Academia — a peça mais cerimonial do catálogo |
| 31 | `traje-relojoeiro` | as Oficinas | fileira de engrenagens **+** correntinhas paralelas **+** pespontos | colete de relojoeiro; as engrenagens são vazadas e mostram o pano de baixo |
| 32 | `traje-astronomo` | o Observatório | constelações em fileira **+** barra de estrelas **+** o azul-noite chapado | robe do observatório; as constelações são pontos ligados por linha fina |
| 33 | `traje-herbario` | a Estufa | folhas prensadas em padrão regular **+** as nervuras dentro de cada uma **+** costura visível | traje de herbário: cada folha é costurada no pano |
| 34 | `traje-origami` | o Observatório | vincos geométricos **+** as faces claras e escuras que eles criam **+** as pontas na barra | traje de dobras de papel — a peça é feita de planos, não de pano |
| 35 | `traje-mosaico` | o Arquivo | tesselas quadradas, cada uma de um tom **+** o rejunte escuro entre elas | traje de mosaico; as tesselas acompanham a curva do corpo |
| 36 | `traje-tabuleiro` | o Torneio | quadriculado 8×8 preto e branco **+** a borda de casas numeradas | o xadrez virando roupa. Cuidado com a lei 5: o preto do tabuleiro não pode comer o contorno |

### 5.4 `legendary` — 3 peças

A peça inteira é **um sistema**. Cada campo dela é diferente do vizinho, e o conjunto
tem uma lógica que se entende olhando. São três, e são para lembrar.

| # | slug | corredor | o sistema | construção |
|---|---|---|---|---|
| 37 | `traje-vitral` | o Observatório | **chumbo preto separando painéis coloridos**, cada painel de um tom, com a espessura do chumbo igual à do contorno do boneco | o traço preto que o boneco já tem passa a ser parte do desenho, em vez de disputar com ele — é a peça que melhor resolve a lei 5 |
| 38 | `traje-nebulosa` | o Observatório | **gradiente de nebulosa** com pontos de estrela distribuídos em densidade regular, mais escuro na barra | a única peça do catálogo em que o aerógrafo é o assunto. Só é possível porque a paleta ficou permissiva |
| 39 | `traje-automato` | as Oficinas | **placas de latão rebitadas**, cada placa com a sua fileira de rebites, articuladas em faixas horizontais | o corpo do boneco lido como máquina. Metal é o material que o catálogo inteiro evita — por isso ele é `legendary` |

---

## 6. O que este documento NÃO decide

- **Ordem de produção.** Nenhuma. A próxima peça é a que o Doug pedir pelo nome.
- **Prompt de nenhuma peça.** O molde é `scripts/avatar/arte/PEDIDO-TRAJE.md`; ele
  só se preenche quando a peça for chamada.
- **A cor de nenhuma peça.** A paleta é livre e final, e vem da arte. As únicas leis
  de cor são as 4 e 5 da §4 (contraste com `#FBF8F5`, contorno legível).
- **Se 40 é o número certo.** É um alvo, e alvo se revisa depois de as primeiras dez
  existirem. Se a folha mostrar que 17 `common` é repetição demais, corta-se.

## 7. Onde isto encosta no resto

| | |
|---|---|
| a emenda que autorizou este catálogo | `docs/avatar/21-slots-do-avatar-plano.md` §0 |
| as leis de arte, na fonte | Bíblia Tonal §12 ("a lei da arte de traje") |
| a esteira que transforma PNG em peça | `docs/avatar/19-rota-de-arte-runbook.md` §12 |
| o molde de pedido | `scripts/avatar/arte/PEDIDO-TRAJE.md` |
| a arte já aprovada e à espera | `scripts/avatar/arte/gambesao-aprovado.png` + `.md` |
| a paleta das patentes, que **não** é deste catálogo | `docs/avatar/17-patentes-uniformes-design.md` — ela migrou para a **moldura** |
