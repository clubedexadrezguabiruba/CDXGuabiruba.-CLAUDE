# 22 — O catálogo de peças da Academia 64: 56 peças nos 4 slots, com raridade

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

> **O título diz 4 slots, e desde 2026-08-23 os slots vestíveis são 5.** O quinto
> é o `cabelo`, e ele não está no título nem nas tabelas de pirâmide **de
> propósito**: as 6 peças dele **já existem e já estão desenhadas** — não são menu,
> são inventário. Elas ficam na **§5-E**, que é uma seção de natureza diferente das
> outras quatro. Quando o Doug fechar o elenco, a recontagem acontece de uma vez só
> e o título muda junto (§2).

Criado em 2026-08-13 como *catálogo de trajes*, junto com a emenda §0 do doc 21.
**Estendido aos quatro slots em 2026-08-21**, quando o Bloco H precisou de um
lendário em cada um e ficou claro que três dos quatro não tinham menu nenhum.

> **A LEI DE ARTE SAIU DAQUI.** As §3 e §4 eram a terceira cópia das mesmas cinco
> leis, e agora moram num lugar só: [doc 23 — a linha de arte](23-linha-de-arte.md).
> Este documento voltou a ser **só o menu**.

---

## 1. A economia, em uma linha

**As peças iniciais são as marcadas `inicial` no catálogo, e toda peça vestível
tem raridade.** Não há mais peça sem raridade e não há mais lista de iniciais
escrita à mão em lugar nenhum.

| | |
|---|---|
| **iniciais** | as linhas com `inicial = true` em `avatar_catalogo` — hoje `traje-farda`, `cabelo-espetado` e `cabelo-assimetrico`, todas `common`. `handle_new_user` as semeia com `INSERT … SELECT … WHERE inicial`: **quem decide é a coluna, não uma lista no corpo da função** |
| **as demais** | `origem = 'bau'`, com raridade. O baú é a **única** porta |
| **"sem traje" e "careca"** | continuam válidos — `NULL` nos dois. O inicial é **opção**, não obrigação |

**O inicial É semeado no guarda-roupa, com `fonte = 'inicial'`** — e isto inverte,
em 2026-08-23, a nota que este parágrafo trazia desde 2026-08-13 (*"o inicial não é
semeado como baú grátis"*). O motivo da inversão é o mesmo que sustentava a nota
antiga, lido ao contrário: peça de `origem = 'bau'` **exige** linha em
`avatar_guarda_roupa`, e a conferência 4 do `verify:avatar-db` reprova quem veste o
que não tem. Enquanto a única inicial era a farda, dava para mantê-la fora do baú
como `origem = 'marco_nivel'`; com o cabelo dentro do catálogo, o aluno precisa
**possuir** os dois cabelos iniciais para vesti-los. A `fonte = 'inicial'` é o que
distingue, no guarda-roupa, a peça dada de saída da peça sorteada — e a conferência
4 passa a ser a prova de que o seed aconteceu.

**A farda deixou de ser peça de marco.** Ela era a única peça sem raridade do
catálogo inteiro; virou `origem = 'bau'`, `raridade = 'common'`, `inicial = true`.
O `min_level` continua existindo na tabela, e o CHECK ainda admite peça de marco —
mas nenhuma peça usa mais essa forma.

**Por que a farda é inicial:** é a peça lisa do catálogo, a de menos detalhe — e é
dela que a raridade sobe. Um aluno que começa com a peça mais ornamentada não tem
para onde subir. O **gambesão** entra como peça de baú acima de `common`, porque
carrega canaletas, ilhoses e cordão. O mesmo raciocínio escolheu os dois cabelos
iniciais (§5-E).

## 2. A pirâmide — e ela é **GLOBAL**, não do traje

> ⚠️ **Nada nesta seção foi recontado em 2026-08-23, e é decisão do Doug.** O
> cabelo entrou no catálogo naquele dia (§5-E), e a tentação seria refazer a
> pirâmide e as contagens por slot para acomodá-lo. Não se fez: *"não mude a regra
> de quantidade de arte nem a porcentagem de raridade agora — estou elaborando as
> artes e isso vai variar"*. As porcentagens 45/30/18/7 e as contagens por slot
> ficam **exatamente** como estavam, e o slot `cabelo` fica **fora** das duas
> tabelas abaixo até o elenco fechar. Menu não é estoque, e contagem em revisão
> não vira número escrito.


⚠️ **A correção de 2026-08-21, e ela muda a conta.** A pirâmide 45/30/18/7 é do
**baú inteiro**, somando os quatro slots — não de cada slot. Está no SQL:
[`b6_bau_da_peca.sql:151-156`](../../supabase/migrations/20260813160000_b6_bau_da_peca.sql#L151-L156)
monta o pool filtrando por `origem = 'bau'` e `raridade`, **sem filtrar slot**. O
aluno tira uma peça `rare` de qualquer slot com a mesma chance.

Os 17/12/7/3 que este documento trazia desde 2026-08-13 eram a fatia do **traje**
lida como se fosse o todo.

### A conta que fecha, nos dois eixos

| raridade | chance no baú | peças | real |
|---|---|---|---|
| `common` | 45% | **25** | 45,5% |
| `rare` | 30% | **16** | 29,1% |
| `epic` | 18% | **10** | 18,2% |
| `legendary` | 7% | **4** | 7,3% |
| | | **55 de baú** | + `traje-farda` (marco) = **56** |

E a distribuição por slot, que é o outro eixo da mesma tabela:

| slot | c | r | e | l | de baú | total |
|---|---|---|---|---|---|---|
| traje | 14 | 8 | 6 | 1 | 29 | **30** (+ a farda) |
| rosto | 5 | 4 | 2 | 1 | 12 | **12** |
| chapéu | 5 | 3 | 1 | 1 | 10 | **10** |
| pet | 1 | 1 | 1 | 1 | 4 | **4** |
| **soma** | **25** | **16** | **10** | **4** | **55** | **56** |

**A camada `legendary` inteira é o Bloco H** — quatro peças, uma por slot.

⚠️ **O pet é 4, uma por raridade, e está marcado EXPANSÍVEL** por decisão do Doug em
2026-08-21. Quando ele crescer, a coluna dele cresce e as outras encolhem — a
pirâmide global é que tem de continuar fechando.

## 3 e 4. A lei de arte — SAIU DAQUI

As duas seções eram a terceira cópia do mesmo texto (as outras duas: doc 21 §0.4 e
Bíblia Tonal v2 §10). Desde 2026-08-21 elas moram num lugar só:

| o que era aqui | onde está agora |
|---|---|
| §3 — o que a raridade significa em desenho | [doc 23 §5](23-linha-de-arte.md), **estendida aos quatro slots** |
| §4 — as cinco leis de arte | [doc 23 §2](23-linha-de-arte.md), **com o que cada uma quer dizer em cada slot** |
| §4b — o que este boneco não pode vestir | [doc 23 §7](23-linha-de-arte.md), **com uma linha por slot** |

E o doc 23 acrescenta o que não existia em nenhuma das três cópias: a **cor** do
traço ao lado da espessura (§3), as regras do **tom** (§4), os três **tamanhos de
julgamento** (§6) e a decisão aberta do `escondeCabelo` (§8).

## 5. As 56 peças, slot a slot

Organizadas por **corredor da Academia**, que é o que dá coerência ao conjunto sem
precisar de época. Um aluno com o traje da forja e outro com o do observatório
pertencem visivelmente ao mesmo lugar.

> **A lista de corredores não mora aqui.** Desde a decisão D4 (2026-08-22), a
> tabela de lugares da [Bíblia Tonal v2 §5](../Academia64_Biblia_Tonal_v2.md) é
> a **fonte única**, e a coluna *corredor* deste catálogo lê de lá. Existiam
> três listas divergentes — o mapa, este catálogo e as alas dos bots — e a
> própria Bíblia dizia absorver corredores que a tabela dela não continha.
>
> Duas consequências já aplicadas neste documento: **"a Estufa" virou "os
> Jardins"** (D5, um lugar com um nome só) e **"o Torneio"** passa a ser também
> o nome do lugar e da ala ★★★★★ dos bots, onde a Bíblia dizia "a Arena" (D1 —
> *Arena* ficou reservada ao **formato de aula** do currículo, que já está
> gravado em títulos de aula no banco).
>
> **"a Casa" continua existindo, e só aqui**: quer dizer *a própria Academia* —
> a peça que ela dá a quem entra (`traje-farda`, `traje-gambesao`,
> `traje-alamares`). É **etiqueta de prateleira, nunca gate**: não desbloqueia
> por nível, por título nem por lugar visitado. Traje não presta contas a
> degrau — só a moldura marca o título (doc 21 §0).
>
> **O slot `rosto` não tem corredor, e isso é decisão**: barba e óculos são do
> aluno, não da Academia. A ausência da coluna nas tabelas 5-B.1 e 5-B.2 é
> deliberada, não esquecimento.

A coluna **textura** é o padrão repetido que faz a peça ler no tamanho de julgamento
— 56 px para o traje, **32 px para peça de cabeça** (doc 23 §6). **Se uma peça nova
não tiver o que escrever ali, ela ainda não está desenhada.** É a régua que decide se
uma linha deste menu é peça ou é vontade.

---

## 5-A. TRAJE — 30 peças (era 40)

Dez cortes em 2026-08-21, e cada um com razão nomeada. O §6 deste próprio documento
já os previa: *"é um alvo, e alvo se revisa depois de as primeiras dez existirem"*.

**O que saiu, e por quê:**

| peça | era | por que sai |
|---|---|---|

**`traje-vitral` fica sendo a única `legendary` do slot.** O argumento já estava
escrito aqui: é a peça que melhor resolve a lei 5, fazendo o traço preto do boneco
virar parte do desenho em vez de disputar com ele.

### 5-A.0 A inicial

| slug | corredor | textura | construção |
|---|---|---|---|
| `traje-farda` | a Casa | painéis no peito + faixa na cintura | **já existe e está aprovada.** É a peça lisa: dois painéis, uma faixa horizontal, barra reta. Recebe o slug novo no Bloco B4 (era `traje-soldado-farda`) |

### 5-A.1 `common` — 14 peças

Um padrão repetido, e nada mais. São as peças que o aluno vê muitas vezes: elas
existem para dar variedade, não para impressionar.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 1 | `traje-colete-estudo` | a Casa | fileira de 4 botões + as duas bordas do colete | colete sobre camisa clara, decote em V |
| 2 | `traje-listrado` | a Casa | listras horizontais largas, iguais | malha de listras; a barra corta no meio de uma listra |
| 3 | `traje-suspensorios` | a Casa | duas tiras verticais paralelas | camisa clara com suspensórios e fivelas pequenas |
| 4 | `traje-jaleco` | as Oficinas | fileira vertical de botões + a lapela | jaleco de laboratório, comprido, barra reta abaixo do corpo |
| 5 | `traje-avental-forja` | as Oficinas | fileira de rebites nas tiras | avental de couro grosso, tira no peito, barra irregular |
| 6 | `traje-macacao-oficina` | as Oficinas | pespontos duplos correndo por toda a peça | macacão de brim, peitilho quadrado |
| 7 | `traje-guarda-po` | o Arquivo | pregas verticais soltas | guarda-pó longo, cordão fino na cintura |
| 8 | `traje-flanela` | os Jardins | xadrez grande de flanela | camisa de flanela, decote aberto |
| 9 | `traje-tricot-trancado` | os Jardins | tranças verticais de tricô | suéter pesado de tranças |
| 10 | `traje-sueter-nordico` | os Jardins | faixa de padrão nórdico repetido no peito | suéter liso com uma faixa de padrão |
| 11 | `traje-avental-cozinha` | a Cozinha | a tira cruzada + a barra dupla | avental de peito claro sobre peça escura |
| 12 | `traje-camisa-time` | o Torneio | duas faixas laterais correndo do alto à barra | camisa de time, gola careca |
| 13 | `traje-moletom` | o Torneio | o franzido do cordão + o bolso canguru | moletom, capuz **caído não** — sem capuz (§4) |
| 14 | `traje-kurta` | os Visitantes | fileira de bordado de linha no decote | kurta de algodão comprida, fenda lateral |

### 5-A.2 `rare` — 8 peças

Dois padrões, ou um padrão mais um fecho que se destaca.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 15 | `traje-gambesao` | a Casa | 5 canaletas acolchoadas **+** cordão em zigue-zague por 8 ilhoses | **a arte já existe e está aprovada** (2026-08-12). Entra pelo Bloco B4 |
| 16 | `traje-blazer-academia` | a Casa | debrum de contraste em toda a borda **+** fileira de botões | blazer da Academia, lapela pequena |
| 17 | `traje-colete-arquivista` | o Arquivo | fileira dupla de bolsos pequenos, todos iguais | colete de muitos bolsos, cada um com sua costura |
| 18 | `traje-cotele` | as Oficinas | canelas grossas de veludo cotelê **+** botões forrados | conjunto de cotelê, decote reto |
| 19 | `traje-argyle` | os Jardins | losangos de argyle **+** as linhas finas cruzando | suéter de losangos — a textura mais forte do catálogo a 56 px |
| 20 | `traje-quimono-escola` | os Visitantes | franzido da faixa **+** o nó | quimono de treino, faixa larga na cintura |
| 21 | `traje-dashiki` | os Visitantes | painel geométrico bordado no peito **+** barra bordada igual | dashiki, decote em V com bordado |
| 22 | `traje-anorak` | o Torneio | franzido do cordão na cintura **+** faixa refletiva horizontal | anorak de expedição, sem capuz (§4) |

### 5-A.3 `epic` — 6 peças

Três padrões, ou dois mais um material inesperado. Aqui a peça passa a ter **ideia**,
não só construção.

| # | slug | corredor | textura repetida | construção |
|---|---|---|---|---|
| 23 | `traje-alamares` | a Casa | 6 alamares horizontais **+** botões de bola **+** debrum | casaca de banda da Academia — a peça mais cerimonial do catálogo |
| 24 | `traje-astronomo` | o Observatório | constelações em fileira **+** barra de estrelas **+** o azul-noite chapado | robe do observatório; as constelações são pontos ligados por linha fina |
| 25 | `traje-origami` | o Observatório | vincos geométricos **+** as faces claras e escuras que eles criam **+** as pontas na barra | traje de dobras de papel — a peça é feita de planos, não de pano |
| 26 | `traje-tabuleiro` | o Torneio | quadriculado 8×8 preto e branco **+** a borda de casas numeradas | o xadrez virando roupa. Cuidado com a lei 5: o preto do tabuleiro não pode comer o contorno |
| 27 | `traje-nebulosa` | o Observatório | gradiente de nebulosa **+** pontos de estrela em densidade regular **+** a barra mais escura | a única peça do catálogo em que o aerógrafo é o assunto. **Desceu de `legendary` em 2026-08-21**: é um sistema, mas o raster do Bloco E devolveu o aerógrafo e ela deixou de ser a única que sabe fazer isso |
| 28 | `traje-automato` | as Oficinas | placas de latão rebitadas **+** a fileira de rebites de cada placa **+** as faixas horizontais articuladas | o corpo do boneco lido como máquina. Metal é o material que o catálogo inteiro evita. **Desceu de `legendary` em 2026-08-21** |

### 5-A.4 `legendary` — 1 peça

A peça inteira é **um sistema**. Cada campo dela é diferente do vizinho, e o conjunto
tem uma lógica que se entende olhando. É **uma**, e ela é do Bloco H.

| # | slug | corredor | o sistema | construção |
|---|---|---|---|---|
| 29 | `traje-vitral` | o Observatório | **chumbo preto separando painéis coloridos**, cada painel de um tom, com a espessura do chumbo igual à do contorno do boneco | o traço preto que o boneco já tem passa a ser parte do desenho, em vez de disputar com ele — é a peça que melhor resolve a lei 5 |

---

## 5-B. ROSTO — 12 peças: 8 barbas + 4 óculos

**Duas famílias no mesmo slot, e elas não são a mesma coisa** — é a bifurcação da
Regra Inviolável nº 4 caindo dentro de um slot só:

| família | recolore? | formato | esteira |
|---|---|---|---|
| **barba** | **sim**, junto com o cabelo (D17 — barba é cabelo) | `formas` + máscara de tom | doc 19 §13 |
| **óculos** | **não**, cor final assada | `<image>` WEBP no `.svg` | doc 19 §12 |

Tamanho de julgamento: **32 px** (doc 23 §6).

⚠️ **`rosto-barba-cavanhaque` está TOMADO** por uma barba paramétrica que já existe
em `rosto.ts` — o slug não pode ser reusado por arte.

### 5-B.1 Barbas — 8

A `trancada` é a peça-padrão da linha de arte inteira (doc 23 §1) e a única já
promovida.

| # | slug | raridade | textura repetida | construção |
|---|---|---|---|---|
| 30 | `rosto-barba-trancada` | `legendary` | **fios contados**, com serrilha na borda e luz correndo por dentro | **já existe e está promovida** (2026-08-21). 54 264 px, 917 tons. É de onde toda régua do doc 23 é citada |
| 31 | `rosto-bigode-guidao` | `rare` | as duas voltas simétricas **+** a divisão de mecha dentro de cada uma | bigode de pontas enroladas para cima; a boca fica à vista entre as duas |
| 32 | `rosto-barba-anelada` | `epic` | anéis regulares correndo do queixo à altura da boca **+** o contorno próprio | barba encaracolada em anéis contados — o irmão da trancada com outra unidade |
| 33 | `rosto-barba-tranca-unica` | `rare` | a trança **+** o nó da ponta | barba longa recolhida numa trança só, caindo abaixo do queixo |
| 34 | `rosto-cavanhaque-pontudo` | `common` | a divisão central, e é o desenho inteiro | cavanhaque triangular; passa da linha do queixo e transborda no tronco |
| 35 | `rosto-costeleta` | `common` | as duas faixas laterais paralelas | costeletas largas ligadas ao cabelo, sem barba no queixo |
| 36 | `rosto-barba-por-fazer` | `common` | o pontilhado regular da barba de dois dias | a peça de menos massa do elenco; existe para ser a sutil |
| 37 | `rosto-bigode-fino` | `common` | uma linha, e é o desenho inteiro | bigode fino sobre a boca. A peça `common` do slot: uma forma, sem sub-estrutura |

### 5-B.2 Óculos — 4

**Elenco novo em 2026-08-21** — o slot nunca teve um. Cor final, assada.

⚠️ **A moldura pode ser escura, mas não pode ser o preto do boneco:** óculos com aro
`#000000` na espessura do contorno funde com a sobrancelha a 32 px. O aro é escuro,
não é `LINHA`.

| # | slug | raridade | textura repetida | construção |
|---|---|---|---|---|
| 38 | `rosto-oculos-redondo` | `common` | o aro fino, e nada mais | dois círculos e a ponte. A peça de referência do slot |
| 39 | `rosto-oculos-quadrado` | `rare` | o aro grosso **+** a dobradiça visível de cada lado | armação de acetato retangular |
| 40 | `rosto-oculos-meia-lua` | `rare` | o meio-aro **+** o cordão que passa por trás | óculos de leitura baixos no nariz — o cordão **não** passa atrás da cabeça (doc 23 §7.1) |
| 41 | `rosto-oculos-lentes-de-vitral` | `epic` | o aro **+** as lentes de painéis coloridos separados por chumbo | o sistema do `traje-vitral` numa peça de cabeça, e é por isso que ele é `epic` e não `legendary`: o lendário do slot já é a trancada |

---

## 5-C. CHAPÉU — 10 peças

**O slot com ZERO infraestrutura hoje** — `CHAPEUS = {}`, e o corredor
(`noCampoDoChapeu()`, `chapeus.ts`, `arte:chapeus`) é o H3. Este menu existe para
que, quando o corredor abrir, haja de onde escolher.

Cor final, assada. Tamanho de julgamento: **32 px**.

⚠️ **Cada linha declara `escondeCabelo`, e a decisão de política é a §8 do doc 23.**
Enquanto ela não for tomada, a coluna é proposta, não lei.

⚠️ **Transbordo para os LADOS e para CIMA, nunca para baixo** (doc 23 §2.2): chapéu
que desce come a testa e as sobrancelhas.

| # | slug | raridade | corredor | `escondeCabelo` | textura repetida | construção |
|---|---|---|---|---|---|---|
| 42 | `chapeu-boina` | `common` | a Casa | `franja` | uma forma, mais o cabinho no topo | boina inclinada; a aba não existe |
| 43 | `chapeu-gorro` | `common` | os Jardins | `franja` | o canelado da barra virada | gorro de tricô, barra dobrada |
| 44 | `chapeu-bone` | `common` | o Torneio | `franja` | a aba **+** as costuras dos gomos | boné de gomos, aba para a frente |
| 45 | `chapeu-bandana` | `common` | as Oficinas | `franja` | o nó **+** as pontas | bandana amarrada — **o nó fica de LADO**, nunca atrás da cabeça |
| 46 | `chapeu-toca-de-cozinha` | `common` | a Cozinha | `tudo` | o franzido regular da copa | toca alta e franzida; é a peça que testa o `tudo` |
| 47 | `chapeu-chapeu-de-palha` | `rare` | os Jardins | `franja` | o trançado da palha **+** a fita da copa | aba larga e plana; o transbordo lateral é o assunto da peça |
| 48 | `chapeu-capelo` | `rare` | o Arquivo | `tudo` | a placa quadrada **+** a borla pendente | o capelo de formatura — a peça mais reconhecível do slot |
| 49 | `chapeu-turbante` | `rare` | os Visitantes | `tudo` | as voltas do pano, contadas **+** a dobra da frente | turbante de voltas visíveis |
| 50 | `chapeu-oculos-de-forja` | `epic` | as Oficinas | `nada` | as duas lentes **+** a tira **+** os rebites da tira | óculos de forja **erguidos na testa** — não é óculos: mora no slot da cabeça e não cobre os olhos |
| 51 | `chapeu-coroa-de-vitral` | `legendary` | o Observatório | `franja` | **painéis de vidro separados por chumbo**, cada ponta da coroa de um tom, com a luz atravessando | a peça tem **estrutura**, não só forma: o aro, as pontas e os painéis são três planos que o olho desmonta. É o `legendary` do slot |

---

## 5-D. PET — 4 peças, uma por raridade

**Marcado EXPANSÍVEL** por decisão do Doug em 2026-08-21: quatro é onde ele começa,
não onde ele termina.

⚠️ **O pet é render IRMÃO — ele não está dentro do SVG do boneco.** Consequências que
mudam o que se pode pedir (doc 23 §2.1, §2.2 e §7.3):

- **Gate −1 e transbordo são inaplicáveis** — não há boneco por baixo para não se
  mexer, nem silhueta de onde sair;
- **nada pode encostar no boneco.** Pet no colo, no ombro ou na mão é pedir
  composição que não existe;
- **o traço do pet não tem rede nenhuma** — nem `kk-traco`, nem contorno de tronco
  por baixo. É o slot em que a §3 do doc 23 mais morde.

A régua de raridade aqui é **atitude legível na silhueta**, não detalhe: um pet a
32 px é quase só contorno.

| # | slug | raridade | corredor | textura repetida | construção |
|---|---|---|---|---|---|
| 52 | `pet-passarinho` | `common` | os Jardins | uma silhueta, uma cor, uma pose | pardal pousado, de perfil. A peça de referência do slot |
| 53 | `pet-gato-de-arquivo` | `rare` | o Arquivo | a silhueta **+** as listras contadas | gato sentado, enrolado na própria cauda |
| 54 | `pet-tartaruga-de-bronze` | `epic` | as Oficinas | a silhueta **+** as placas do casco **+** os rebites de cada placa | tartaruga mecânica; o casco é o `traje-automato` em miniatura |
| 55 | `pet-coruja-do-observatorio` | `legendary` | o Observatório | as penas contadas **+** o disco facial **+** a constelação no peito | a coruja é um **personagem**: a atitude está na silhueta, e ela lê a 32 px sem detalhe nenhum. É o `legendary` do slot |

---

## 5-E. CABELO — as 6 peças que EXISTEM

> **Esta seção é de natureza diferente das quatro acima.** As §5-A a §5-D são
> **menu**: peças pensadas, nenhuma desenhada. Esta é **inventário**: as 6 peças
> aqui já existem, já passaram pela folha de contato e já estão em
> `MODELOS_CABELO`. Ela não propõe nada e não entra nas tabelas de pirâmide do §2 —
> ver a nota daquela seção.

O slot `cabelo` entrou em `avatar_catalogo` em **2026-08-23**, quando o Doug
revogou a razão de custo que o mantinha numa gramática à parte (doc 21 §3.3). Até
ali ele tinha tabela própria (`avatar_hair_catalog`), era travado **por nível** e
não caía no baú. Agora é peça como qualquer outra: raridade, posse em
`avatar_guarda_roupa`, e o baú como porta.

**A raridade espelha o gate de nível que existia** — é tradução, não redesenho.
Cabelo livre virou `common`; nível 10 virou `rare`; nível 20, `epic`; nível 30,
`legendary`. O `burst-fade` nunca teve linha de nível (chegou depois da última
migration) e entra como `rare`, ao lado do `coque`.

| # | slug | raridade | inicial | era | família | textura repetida |
|---|---|---|---|---|---|---|
| — | `cabelo-espetado` | `common` | ✅ | nível 1 | traçada | as pontas repetidas, todas do mesmo comprimento, saindo em leque do topo |
| — | `cabelo-assimetrico` | `common` | ✅ | nível 1 | tonal | a mecha longa de um lado só **+** a queda contínua de luz dentro dela |
| — | `cabelo-coque` | `rare` | | nível 10 | paramétrica | o volume enrolado do coque **+** o contorno próprio que o separa da massa |
| — | `cabelo-burst-fade` | `rare` | | *(sem linha)* | tonal | o degradê em leque atrás da orelha — o tom mais contínuo do elenco, 256 valores distintos |
| — | `cabelo-moicano` | `epic` | | nível 20 | tonal | a crista central **+** as laterais rentes, com a luz correndo pela crista |
| — | `cabelo-chanel` | `legendary` | | nível 30 | tonal | as pontas contadas da barra reta **+** a luz descendo por dentro de cada mecha |

**A coluna `#` fica vazia de propósito:** a numeração 1–56 é do menu, e estas peças
não são menu. Elas ganham número quando o elenco fechar e a recontagem acontecer de
uma vez só.

**Por que estas duas são as iniciais:** mesmo raciocínio da farda (§1). São as duas
que já eram livres — o aluno nunca teve de subir de nível para usá-las —, e são as
de menos sub-estrutura do elenco: uma forma em leque e uma mecha só. É delas que a
raridade sobe. O aluno começa podendo escolher entre as duas, **mais a careca**,
que continua sendo `NULL` e não é peça.

**A careca não é linha do catálogo.** Ela é a ausência de peça, como o "sem traje" —
e o gate `verify:cabelo-catalogo` guarda essa asserção desde que existe.

**O prefixo `cabelo-` é fronteira, não renome.** No banco a peça é
`cabelo-espetado`; no código o modelo continua sendo `espetado`, e `CABELOS[m].id`
continua igual a `m`. Quem traduz é `modeloDoSlug()`, num lugar só.

---

## 6. O que este documento NÃO decide

- **Ordem de produção.** Nenhuma. A próxima peça é a que o Doug pedir pelo nome.
- **Prompt de nenhuma peça.** O molde do traje é `scripts/avatar/arte/PEDIDO-TRAJE.md`
  e o do rosto é `PEDIDO-BARBAS.md`; os dois só se preenchem quando a peça for
  chamada. **Chapéu e pet não têm molde**, e não terão até a primeira peça de cada —
  pedido nasce com a peça, não antes dela.
- **A cor de nenhuma peça.** A paleta é livre e final, e vem da arte. As únicas leis
  de cor são as 4 e 5 do [doc 23 §2](23-linha-de-arte.md).
- **Nada de lei de arte.** Saiu inteira daqui em 2026-08-21 — ver as §3 e 4 acima.
- **Se 56 é o número certo.** É um alvo, e alvo se revisa: foi assim que os 40
  trajes viraram 30 nesta mesma revisão. O **pet** já está marcado expansível.
- **Quando cada peça nasce.** O catálogo é menu; o banco tem hoje **3 linhas**
  (`traje-farda`, `traje-gambesao`, `rosto-barba-trancada`), e `common` e `epic`
  nascem em **zero**. Isso é o estado esperado de arte por demanda: `claim_chest`
  paga XP onde o pool da raridade sorteada está vazio, e `verify:chest-pool` mede.

## 7. Onde isto encosta no resto

| | |
|---|---|
| **a lei de arte, na fonte** | **[doc 23 — a linha de arte](23-linha-de-arte.md)** |
| a emenda que autorizou este catálogo | [doc 21](21-slots-do-avatar-plano.md) §0 |
| a esteira que transforma PNG em peça | [doc 19](19-rota-de-arte-runbook.md) — §12 traje, §13 rosto |
| o molde de pedido de traje | `scripts/avatar/arte/PEDIDO-TRAJE.md` |
| o molde de pedido de barba | `scripts/avatar/arte/PEDIDO-BARBAS.md` |
| a peça-padrão, medida | [`ESTADO-DA-ROTA.md`](../../scripts/avatar/arte/ESTADO-DA-ROTA.md), 2026-08-21 |
| a pirâmide, no SQL que a executa | [`b6_bau_da_peca.sql`](../../supabase/migrations/20260813160000_b6_bau_da_peca.sql) |
| a paleta dos títulos, que **não** é deste catálogo | [doc 17](17-patentes-uniformes-design.md) — ela migrou para a **moldura** |

⚠️ **O ponteiro para "Bíblia Tonal §12" que esta tabela trazia estava quebrado desde
a v2**: lá a lei de arte é a **§10** (a §12 virou "aplicação por área do produto"). E
desde 2026-08-21 a §10 é ela própria um ponteiro para o doc 23.
