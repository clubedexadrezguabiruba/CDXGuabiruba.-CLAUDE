# 23 — A linha de arte do avatar: a lei de **peça**, não de traje

> **ISTO É LEI, NÃO MENU.**
>
> O menu — quais peças existem — é o [doc 22](22-catalogo-de-pecas.md). Este
> documento diz **como uma peça tem de ser desenhada** para entrar no boneco, em
> qualquer um dos quatro slots.
>
> Ele é a **fonte única** de cinco leis que até 2026-08-21 estavam escritas três
> vezes, quase palavra por palavra: doc 22 §4, doc 21 §0.4 e Bíblia Tonal v2 §10.
> As três viraram ponteiro para cá no mesmo commit em que este arquivo nasceu.

Criado em 2026-08-21.

---

## 0. Por que ele existe, e por que só agora

O Bloco H precisa de um item lendário em **cada um dos quatro slots** — `rosto`,
`traje`, `chapeu`, `pet` — e estava parado. O que o travava não era arte: era que
**não existia linguagem visual escrita para três dos quatro slots**.

Tudo que o projeto tinha de lei de arte foi escrito **para traje**, e dizia isso
com todas as letras: o doc 22 §4 se auto-limitava a *"toda peça deste catálogo"*, e
a Bíblia chamava a seção de *"A lei da arte de traje"*. Chapéu, pet e a família
óculos não tinham equivalente. `CHAPEUS = {}` e `pet: []`.

E há uma **causa técnica** que explica por que é justamente aí que uma peça deriva
de família. Está escrita em
[`compositor.ts`](../../src/lib/avatar/estilo/compositor.ts):

> *"O traço de uma peça de `arte` fica sem rede, e por isso ele é medido. […]
> Chapéu, óculos e pet **não têm silhueta do compositor por baixo**."*

A barba não pode derivar assim, porque ela é `formas`: o compositor emite o contorno
dela a 12 u, sempre. Chapéu, pet e óculos são `arte` — cor assada, `<image>` colado
— e **o traço é o que o desenho trouxer**. O precedente está medido: o traje saiu
com **p50 7,5 u contra os 12 u do boneco** (achado G17), e só não apareceu porque o
contorno do tronco fica desenhado por baixo. Chapéu e pet não teriam esse socorro.

---

## 1. A peça-padrão: a `rosto-barba-trancada`

**Toda régua deste documento é citada de uma peça real**, e ela é a trancaça —
promovida em 2026-08-21, quando o Doug cortou o elenco de barbas de seis para uma
justamente para que existisse **um** padrão em vez de seis médias.

| | medido |
|---|---|
| peça | **54 264 px**, em **1 componente** |
| cortado nas feições | **0 px** |
| esticão do tom (p2/p98 da própria arte) | lum **0 → 140** |
| máscara de tom, a 50% da caixa | **213 × 184** px · **16 516 B** de PNG · **256 tons distintos** |
| `d` das duas formas | **14 800 B** (7 400 cada — o *mesmo* `d`) |
| no fio | **16,2 KB** de gzip |
| Gate −1 | **0** ladrilhos de 125 em `rosto`, **1** de 1 104 em `corpo` |
| traço do boneco | cobre 8 032 px, apaga **0** |
| cor da borda | **0 px** de cinza |

O registro número a número, comando a comando, está em
[`ESTADO-DA-ROTA.md`](../../scripts/avatar/arte/ESTADO-DA-ROTA.md), na entrada de
2026-08-21.

**Por que ela, e não outra.** É a peça de maior massa que a rota já produziu (54 264
px contra 38 505 da `barba-cheia`), tem a maior amplitude de luz, e é feita de
**fios** — o acabamento mais difícil de qualquer peça deste catálogo. Uma
peça-padrão fácil não serve de régua: ela aprovaria tudo.

⚠️ **Ela define o NÍVEL de acabamento, não a TEXTURA.** O nível atravessa slots; a
textura não. A trancaça é uma barba, e usá-la como referência de textura para um
chapéu de feltro arrastaria pelo para onde não cabe. Ver §9.

---

## 2. As cinco leis, promovidas de *traje* para *peça*

São as mesmas cinco de sempre. O que este documento acrescenta é a coluna que nunca
existiu: **o que cada uma quer dizer em cada slot.**

### 2.1 Gate −1 — a peça não move o boneco

| slot | vale como está? |
|---|---|
| rosto | **sim**, contra `base-oficial.png` |
| traje | **sim**, contra `base-tronco-campo` — outra base, e o gate dele protege a CABEÇA em vez do corpo |
| chapéu | **sim**, e é a lei que mais importa ali: chapéu encosta na calota, que é a região que o gate mais protege |
| pet | **inaplicável** — o pet não está dentro do SVG do boneco. Ver §2.2 |

### 2.2 Transbordo obrigatório, alvo ~10%

**Esta é a lei que NÃO se promove literalmente**, e dizer isso é metade do valor
deste documento.

Ela nasceu do tronco: peça inteira dentro da silhueta lê como *tinta sobre madeira*,
não como roupa vestida. O gesto é barra, gola, ombro ou punho saindo da linha.

| slot | o que a lei vira |
|---|---|
| traje | **literal.** ~10%, e é `TRANSBORDO_LATERAL` (26 u) / `TRANSBORDO_BARRA` (18 u) em `base.ts` |
| rosto | **não se aplica.** A barba nasce no rosto e o excesso dela cai sobre o tronco, que já é transbordo por construção. A trancaça mede 0 px descartados nas feições, e é assim que tem de ser |
| chapéu | **sim, mas para os LADOS e para CIMA**, nunca para baixo. Chapéu que transborda para baixo come a testa e as sobrancelhas. O número é próprio do slot e ainda não está medido — sai da primeira peça |
| pet | **inaplicável.** O pet nem está dentro do SVG |

⚠️ **Um alvo herdado sem medir é pior que nenhum.** Foi assim que um piso de 5%
ditou a forma de uma peça e saiu color-block: a régua julga, nunca projeta.

### 2.3 Legibilidade no tamanho de julgamento

**Não é "56 px" para todo mundo.** Ver §6 — o tamanho depende de onde a peça mora
no quadro.

### 2.4 Contraste com o fundo claro `#FBF8F5`

Peça bege ou marfim **some** no card do editor. Isto elimina uma família inteira de
cores do catálogo, e é de propósito.

Vale igual nos quatro slots, porque a lei é do **card**, não da peça: os quatro
aparecem sobre o mesmo fundo na vitrine.

### 2.5 O contorno preto do boneco continua legível

Peça muito escura come a silhueta que dá identidade ao personagem.

| slot | a rede que existe |
|---|---|
| traje | o `<use class="kk-traco"/>` do tronco é desenhado **sempre**, por baixo |
| rosto (`formas`) | o compositor emite a borda em `var(--av-linha)`, 12 u, por construção |
| chapéu · óculos · pet | **nenhuma.** É por isso que existe a §3 |

---

## 3. O traço — espessura E cor, medidas em separado

Duas perguntas, dois números, duas réguas. Até 2026-08-21 só a primeira tinha dono.

### 3.1 Espessura

| | |
|---|---|
| `TRACO` | **12 u** = **0,96 px** a 56 ([`geometria.ts:259`](../../src/lib/avatar/estilo/geometria.ts#L259)) |
| `ESPESSURA_FINA` | **8 u** = **0,64 px** — o piso do legível ([`converter.ts:227`](../../scripts/avatar/arte/converter.ts#L227)) |
| a referência do piso | a sobrancelha inteira tem **0,66 px** a 56, e `cabelo.ts` a declara como o limite do legível naquele tamanho |

Abaixo de 8 u a banda **não é desenho, é serrilha** — é o corte que separa "a artista
desenhou uma linha fina ali" de "o antialias do gerador".

**Quem tem rede e quem não tem** — a tabela é
[`tipos.ts:114-118`](../../src/lib/avatar/estilo/tipos.ts#L114-L118), e é a Regra
Inviolável nº 4 lida do lado do código:

| | `arte` | `formas` |
|---|---|---|
| a cor | **assada no desenho** | `var(--av-cabelo)`, em tempo de execução |
| **o traço** | **o da arte**, desenhado sobre a base | do compositor, `kk-traco`, **12 u** |
| quem | chapéu, óculos, pet, traje | **a barba, e só ela** |

Régua: `npm run arte:espessura` publica p05/p50/p95 da banda pelo perímetro.

### 3.2 Cor

**`LINHA` = `#000000`, preto puro** ([`palette.ts:58`](../../src/lib/avatar/palette.ts#L58)).

**Por que os dois números respondem por si, e não um pelo outro:** um traço cinza ou
marrom **parece mais fino** que um preto da mesma largura, e a tentação é compensar
engrossando — foi assim que `TRACO` virou 17 uma vez. Medir só a largura deixa
passar a peça que está fina *de cor*; medir só a cor deixa passar a que está fina de
verdade.

#### A lacuna que estava no ar, e que este doc fechou

Em `formas` a borda é `var(--av-linha)` emitida pelo compositor — garantida por
construção. Em `arte` ela é **o que o gerador desenhou**, e até 2026-08-21 **ninguém
media a cor**: `arte:traco` mede apagamento de propósito, `arte:espessura` mede
largura.

A prova está em
[`traco-intacto.ts:32-37`](../../scripts/avatar/arte/traco-intacto.ts#L32-L37), na
`entrada.png` — a arte do cabelo `espetado`, **em produção**:

> *"ali a base tem lum 0 e a arte tem lum **70** — o gerador redesenhou o traço em
> cinza escuro em vez de preto, e só a borda de antialiasing (38 → 97) cruzou o
> limiar. Não é apagamento, é re-renderização."*

Aquele diagnóstico foi usado para **afrouxar** o limiar do `arte:traco` (90 → 180),
porque aquela régua julga outra coisa. O cinza ficou sem dono por um ano.

#### `npm run arte:borda` — a régua nova

Escrita em 2026-08-21, em `scripts/avatar/arte/cor-da-borda.ts`, e ela entra em
`verify:arte`. As três réguas do traço agora partem a luminância em três faixas que
não se sobrepõem e não deixam vão:

| luminância na arte | o que é | quem julga |
|---|---|---|
| `< 40` | preto, dentro do ruído de reencode | ninguém precisa |
| **40 a 180** | **repintado em CINZA** — nem preto, nem apagado | **`arte:borda`** |
| `>= 180` | material claro: o traço SUMIU | `arte:traco` |

**Os dois limiares são medidos, e o caminho até eles está no docstring do arquivo.**
Vale repetir aqui a lição, porque ela é de método:

- **o piso de 40 não é herdado.** A primeira versão herdou o `LUM_TRACO` = 90 do
  `arte:traco`, e **o controle não se comportou** — o defeito real mora em **70**,
  abaixo de 90. Herdar o número da régua vizinha pôs a janela inteira do lado errado
  do defeito que ela existe para pegar. Medido, o vão entre as duas populações é de
  **300×**: arte boa tem 1 a 38 px acima de 40; a `entrada` tem **9 296**;
- **o lado da base é o NÚCLEO** (`lum < 20`), não o `LUM_TRACO`. A franja da base é
  um gradiente por construção, e re-renderizar um gradiente em outro ponto dele não
  é defeito. Com o critério frouxo a arte boa sobe de 38 para 999 px e a separação
  cai para 10×;
- **a máscara da peça dilata 4 px**, o dobro da do `arte:traco`, porque a janela
  desta régua cai exatamente na zona em que o rasterizador mistura tinta. A
  varredura separa as duas coisas sem dúvida — franja **some** quando a máscara
  cresce, repintura **não se mexe**:

  | arte | raio 2 | 3 | **4** | 5 | 8 |
  |---|---|---|---|---|---|
  | `barba-trancada` | 20 | 4 | **0** | 0 | 0 |
  | `entrada` | 3 945 | 3 945 | **3 945** | 3 945 | 3 945 |

#### O achado que ela produziu, e ele fica registrado

**O `espetado` está em produção com um trecho do contorno redesenhado em cinza.**
9 296 px, maior componente 3 945, em u x 349→385 · y 189→271.

O número está **congelado por catraca** em `DEFEITO_REGISTRADO`, e isso **não é
tolerância afrouxada**: o piso não se moveu um número: quem entra na lista é uma
ARTE nomeada, com a medida escrita, e o gate reprova no instante em que ela piorar.
É o mesmo desenho de `CONGELADAS_NO_VETOR` (`traje.ts`).

**Consertar tem duas saídas defensáveis, e a escolha é do Doug:**

1. **repintar por programa** — os pixels são descritíveis em régua, então cabe no
   critério do G20, que separa restaurar de desenhar; é o mesmo gesto do passo 2 do
   `restaurar-peca`. Mas mexe numa peça **já promovida**: `pecas-da-arte.ts` seria
   regerado e o `espetado` mudaria em produção;
2. **redesenhar** — o Doug repinta o trecho em preto puro sobre a arte, e a peça
   reentra pela rota.

---

## 4. O tom — o raster carrega a luz, e isso não fura a Regra nº 4

Mudou em 2026-08-20, e é mudança de espinha. Até ali a esteira partia a peça em
silhueta preta e miolo colorido e traçava as duas — o que fazia uma arte de **917
tons** chegar ao boneco com **dois**.

**A causa não era a D17: era o `potrace`**, que traça CONTORNO, e contorno é
binário. Toda a partição contorno × miolo existia para dar duas cores a uma arte de
muitas.

Hoje, para quem **recolore** (a barba):

```
<path d=silhueta fill="var(--av-linha)"/>            ← o preto, por baixo
<path d=silhueta fill="var(--av-cabelo)" mask=…/>    ← a cor, com a luz da arte
```

### 4.1 As três regras do tom

1. **o alvo é AMPLITUDE, não faixa.** Não se pede "três tons"; pede-se variação de
   luz que sobreviva ao esticão. A esteira **reprova peça chapada** por construção
   (`hi <= lo`);
2. **o esticão é por PERCENTIL da própria arte** — p2/p98, e fora disso grampeado.
   É o que normaliza o contraste peça a peça e o que dissolveu o achado **G31** (a
   `cavanhaque` saindo preta chapada por partição de luminância);
3. **a resolução da máscara é 50% da caixa**, e esse número é **da barba**. Medido:
   100% → 1 038 tons, 50% → **917**, 35% → 916 — o platô começa em 50%. **Cada slot
   tem direito ao seu**, e o dia de medir é o da primeira peça dele.

### 4.2 Por que isto não fura a Regra Inviolável nº 4

A regra proíbe **cor assada** onde o aluno escolhe. Ela nunca proibiu **tom**.

A máscara **não tem cor** — é um canal de cinza. A cor continua vindo inteira de
`var(--av-cabelo)`, que é a escolha do aluno. O `typecheck` cobra isso: o braço
`arte` da união declara `tom?: never`.

O argumento longo mora em `TomDaPeca`
([`tipos.ts`](../../src/lib/avatar/estilo/tipos.ts)).

### 4.3 O tom é ARQUIVO, nunca base64

O que entra no catálogo é o **caminho** do PNG. O arquivo mora em
`public/items/rosto/` e é servido à parte, como o `.svg` do traje.

Embutir os bytes em base64 foi a primeira versão, e ela quebrava o ranking: 30
bonecos com a trancaça fechavam em **753,0 KB** de gzip contra **17,6 KB** com
arquivo externo, porque o boneco composto passa da janela de 32 768 B do DEFLATE e a
dedução do blob morre. E o base64 viajava no bundle do cliente, onde compressão
nenhuma o alcança.

⚠️ O arquivo **precisa ser rastreado pelo git**. A Vercel builda a árvore do git, e
arquivo ignorado não chega ao ar por mais que exista nesta máquina. O modo de falha
é silencioso: o compositor decide pelo campo declarado, nunca pelo arquivo
existindo, então a máscara sumiria e a barba sairia chapada em produção **com todos
os gates verdes**. `arteDaPecaNoDeploy.test.ts` mede.

### 4.4 A bifurcação que decide o formato de toda peça nova

É a única pergunta que parte a esteira de arte em duas, e ela é a Regra Inviolável
nº 4 lida do lado da esteira:

| a peça recolore? | formato | onde |
|---|---|---|
| **não** (traje, chapéu, óculos, pet) | `<image>` WEBP dentro do `.svg` — **arte NOVA só** | doc 19 §12 |
| **sim** (a barba) | silhueta em `formas` com token de cor **+** máscara de luminosidade | doc 19 §13 |

`traje-farda` e `traje-gambesao` estão **congeladas no vetor** por decisão do Doug,
com trava mecânica em `traje.ts`.

### 4.5 A PEÇA É FIGURINHA — opaca por dentro, e vale para os dois lados

*Decidida em 2026-08-22, depois de a `trancada` v10 chegar ao render com o traço do
maxilar do boneco aparecendo dentro da barba.*

> **"A peça é colada como figurinha: nada atrás dela pode ser visto."** — o Doug

A peça cobre o que ela cobre, inteiro. As **únicas** janelas que uma peça de rosto
mantém abertas são as **feições** — a espinha da boca e as cápsulas dos olhos —, e
elas são abertas de propósito pelo recorte da esteira, porque a linha da boca é da
base e nunca da peça (doc 24 §3: *0 px de tinta na boca, sem tolerância*).

**Por que isto virou lei e não conserto de uma peça:** a esteira reconhece a peça
pelo que *difere da base careca*, então **fio escuro pintado sobre o traço preto do
boneco não entra na peça** — a diferença é ~0. O furo que sobra não é escolha de
ninguém: é o critério de reconhecimento falhando em silêncio, e ele **piora quanto
maior a peça** (a `trancada` v4 tinha 2 furos, a v10 tinha 4). Nenhuma régua de arte
pega isso, porque a arte está certa.

Quem garante é a esteira, no **passo 2c** de `barba-para-formas.ts`: furo interior
sem feição dentro é preenchido, e o pixel preenchido carrega a luminância que a arte
tem ali — então o tom continua saindo do desenho, e a Regra Inviolável nº 4 continua
de pé. **Não se pede isso ao gerador e não se conserta na arte** — as duas coisas
foram tentadas em 2026-08-22 e as duas foram reprovadas a olho.

⚠️ **A régua que decide é a PROVA DA FIGURINHA, e ela é do render:** trocar a cor da
pele do boneco não pode mudar pixel nenhum dentro da pegada da silhueta, fora das
janelas de feição. Ela não precisa saber a causa nem olhar a arte. Gate:
`scripts/avatar/arte/__tests__/figurinha.test.ts`.

---

## 5. Raridade em desenho, por slot

**Mais raro = mais detalhe e ornamento.** Não "mais cor", não "mais brilho", não
"maior". A régua vem da lição que a farda e o gambesão pagaram:

> **Detalhe se ganha por repetição regular, nunca por tamanho.** Cinco canaletas
> iguais viram textura ao encolher; um brasãozinho no peito vira sujeira.

Por isso toda peça do doc 22 declara, na coluna **textura**, *qual é o padrão
repetido que ela tem e as outras não*. É essa coluna — não a descrição — que decide
se a peça lê no tamanho de julgamento.

A escada de eventos de construção, **por slot**. A coluna do traje é a que já
existia; as outras três são o que faltava para o Bloco H:

| raridade | traje | rosto | chapéu | pet |
|---|---|---|---|---|
| `common` | **1** padrão repetido, e nada mais | uma forma simples, sem sub-estrutura — bigode chapado, óculos de aro fino | uma forma, uma cor, uma aba | uma silhueta, uma cor, uma pose |
| `rare` | **2** padrões, ou 1 + um fecho de destaque | 1 padrão **+** um contorno próprio — barba com divisão de mecha visível | forma **+** uma faixa, fita ou aba trabalhada | silhueta **+** uma marca repetida (manchas, listras) |
| `epic` | **3** padrões, ou 2 + um material inesperado | 2 padrões **+** variação de luz que se lê a 32 px | forma **+** 2 elementos, ou um material inesperado | silhueta **+** 2 elementos, ou um acessório próprio |
| `legendary` | a peça **inteira** é um sistema — cada campo é diferente e o conjunto tem lógica | a peça é feita de **fios** ou de unidades contadas, com luz correndo por dentro — **a trancaça** | a peça tem **estrutura**, não só forma: camadas, aba com dobra, algo que o olho desmonta | o pet é um **personagem**, não um ícone: tem atitude legível na silhueta |

**A régua transversal, e é ela que decide de verdade:** a peça `legendary` é a que o
aluno consegue **descrever de memória** depois de ver uma vez. A `common` é a que ele
reconhece sem descrever.

---

## 6. Os tamanhos de julgamento

Não é um número só, e nunca foi — o que muda é onde a peça mora no quadro.

| tamanho | quem se julga ali | por quê |
|---|---|---|
| **56 px** | traje | é o tamanho do boneco no ranking e nas listas — o tronco ocupa a maior parte do quadro |
| **32 px** | **peça de cabeça** — chapéu, rosto, óculos | a cabeça é ~metade da altura do boneco. Uma peça de cabeça julgada a 56 px está sendo julgada com o dobro da resolução que ela terá |
| **340 px** | todas, no extremo | o editor e o perfil. É onde o detalhe que some a 32 px tem de valer a pena |

⚠️ **Sempre Chromium, NUNCA `sharp`.** O librsvg não resolve `var(--av-*)`: o rosto
sai preto e o traço cai de 12 para 1. Uma folha renderizada por `sharp` mede outra
peça.

**A folha de contato para o olho do Doug é a única aprovação que existe.** As réguas
reprovam; nenhuma aprova.

---

## 7. O que este boneco não pode usar, por slot

### 7.1 A regra geral, e ela é do compositor

**Nada com forma própria que mude a silhueta geral:** capa, manto, tabardo, capuz,
gola alta por trás, ombreira, cabelo ou pano passando por cima do ombro.

O que fica **atrás da cabeça** precisa ser uma `extensao` em vetor (`atras: true`), e
a esteira de traçado do traje **não existe**. Pedir arte assim é pedir o que o
programa não sabe montar.

### 7.2 O que o boneco não tem

**braço, mão, dedo, ombro saliente, manga, cava, punho, luva, perna, pé, bota,
calça, pescoço, orelha.** O corpo é uma peça só, em forma de sino.

Toda peça tem de fazer sentido **sem mangas** — é o filtro que mais corta ideia boa,
e é melhor descobrir aqui do que no gerador.

### 7.3 Por slot

| slot | o que não cabe, e a razão é técnica |
|---|---|
| **traje** | a gola para no queixo (**y 515 px** na base de edição), nem um pixel acima |
| **rosto** | nada que **saia da cabeça para trás ou para cima** — é `formas` dentro do clip. E nada que dependa de **orelha**, que o boneco não tem |
| **chapéu** | nada que passe **atrás** da cabeça (mesma razão da §7.1). E a peça declara `escondeCabelo` — ver §8 |
| **pet** | nada que **encoste no boneco**: o pet é render irmão, fora do SVG. Pet no colo, no ombro ou na mão é pedir composição que não existe |

---

## 8. `escondeCabelo` — DECIDIDO em 2026-08-25, e não é um enum

Este documento registrava a decisão como aberta, com três valores possíveis. Ela
foi decidida medindo, e a resposta **não é nenhum dos três**: é uma linha.

### 8.1 Por que os três valores caíram

| valor | o que quer dizer | por que caiu |
|---|---|---|
| `"nada"` | o cabelo aparece inteiro sob o chapéu | **é o que estava em produção, e quebra.** Medido nos 171 pares: o `moicano` deixava 29,2% da própria massa acima da linha da `touca-de-la`; o `coque-individual` furava o topo da `cartola` com 0,2% da massa subindo 238 u. Lê como cabelo *nascendo através* do chapéu |
| `"franja"` | some a calota, fica a franja | caiu por falta de sub-caminho separável (`camadas.ts`), e **a razão caducou** — o tonal trouxe `<mask>` em runtime de qualquer forma. Mas ela já não bastava: franja é *uma* altura de corte, e cada chapéu corta na sua |
| `"tudo"` | o chapéu substitui o cabelo | apaga **uma das duas cores que o aluno escolhe**. Colide com a Regra Inviolável nº 4 na prática |

**O que os três não conseguem dizer:** que a touca corta baixo e a cartola corta
alto. Medido nos 9 chapéus, a linha de baixo sobre o crânio vai de **y 130**
(`mago`) a **y 170** (`cartola`) no ponto mais alto, e de 183 a 290 no mais baixo —
uma faixa de 160 unidades. Um enum de três palavras não cabe nisso.

### 8.2 O que ficou no lugar

**`escondeCabelo` é o `d` da região que o chapéu contém.** Abaixo dela o cabelo sai
inteiro — franja, costeleta, rabo, trança —, acima dela o chapéu o contém. `"nada"`
e `"tudo"` viram casos degenerados da mesma coisa: a linha no infinito e a linha no
queixo.

**Ninguém escreve esse valor.** `oclusao-do-chapeu.ts` o extrai do alfa do próprio
`.svg` da peça, respondendo ponto a ponto *"dá para chegar aqui vindo de baixo sem
atravessar o chapéu?"*. Não há campo novo para preencher no pedido de arte, não há
decisão por peça, e a linha não tem como divergir do desenho: mudou a arte, mudou a
linha, na mesma passada da esteira. Custa ~243 B por chapéu.

Resultado medido, antes → depois, nos 171 pares: escape médio de **5,62% → 0,12%**.

### 8.3 O que a decisão NÃO resolve, e é decisão de produto

Um penteado cuja identidade mora **em cima da cabeça** não tem o que sobrar debaixo
de um chapéu. Medido: em **11 dos 171 pares** sobra menos de 3% da massa do cabelo —
e 9 deles são o `moicano`, que some inteiro debaixo dos nove chapéus.

Isso é fisicamente correto (um moicano sob uma touca some na vida real também) e é
**produto ruim**: a criança que desbloqueou a peça não a vê, e perde junto a cor que
escolheu. `npm run arte:par` conta e nomeia esses pares **sem reprovar** — régua que
reprova decisão de produto é régua decidindo pelo dono.

---

## 9. O acabamento: como pedir o NÍVEL sem pedir a TEXTURA

A trancaça entra nos pedidos ao gerador como a **3ª imagem**, e o papel dela é
nomeado: ela é **o acabamento**. Os traços que se citam dela são:

- **os fios** — a peça é feita de unidades contadas, não de massa;
- **a serrilha** da borda, que não é reta nem lisa;
- **a variação de luz** correndo por dentro da forma;
- **a espessura da linha interna**, que divide sem cortar.

⚠️ **Nível, não textura.** O nível atravessa slots; a textura não. Para chapéu e
pet, **o primeiro pedido de cada slot vira o padrão daquele slot**, e a trancaça
segue sendo a régua de *quanto*.

O bloco de estilo comum dos pedidos vive **aqui**, na §10, e cada `PEDIDO-*.md` o
cola. Antes disto o mesmo parágrafo estava repetido em quatro pedidos.

---

## 10. O bloco de estilo comum — para colar em qualquer PEDIDO

> **O estilo.** Kokeshi: formas fechadas, contorno preto contínuo, sem sombra
> projetada, sem gradiente de fundo, sem brilho especular. O contorno da peça tem a
> mesma espessura do contorno do boneco — **preto puro**, e preto puro quer dizer
> `#000000`, não cinza escuro.
>
> **A luz.** A peça tem variação de luz por dentro — não três tons chapados, e não
> um degradê de aerógrafo liso: a luz acompanha a forma. Amplitude, não faixa.
>
> **O acabamento.** No nível da imagem de referência de acabamento: unidades
> contadas em vez de massa, borda que não é reta, luz correndo por dentro.
>
> **O que não fazer:** não mude o boneco de baixo em pixel nenhum. Não desenhe
> sombra dele na peça nem da peça nele. Não acrescente fundo. Não escreva texto.

---

## 11. Quem este doc vence, e quem ele NÃO revoga

**Ele vence** — e as três viraram ponteiro de uma linha no commit em que ele nasceu:

| onde | o que era | agora |
|---|---|---|
| doc 22 §3 e §4 | a raridade em desenho e as cinco leis, escritas para traje | ponteiro para as §5 e §2 daqui |
| doc 21 §0.4 | *"Permissiva não é sem lei"* — as mesmas cinco | ponteiro para a §2 daqui |
| Bíblia Tonal v2 §10, *"A lei da arte de traje"* | as mesmas cinco, terceira cópia | renomeada para *"A lei da arte de peça"*, e ponteiro para cá |

**Ele NÃO revoga, e ninguém deve ler nada aqui como se revogasse:**

- **o `CLAUDE.md`**, que está acima de tudo — em especial a Regra Inviolável nº 4.
  A §4.2 daqui **deriva** dela, não a emenda;
- **a Bíblia Tonal v2** em tudo que não seja a §10: identidade, paleta, tipografia,
  vocabulário e tom de voz continuam sendo dela;
- **o doc 15**, que é o plano de execução. Onde este documento divergir do 15 em
  matéria de *ordem de trabalho*, o 15 vence;
- **o doc 19**, que é a esteira. Aqui está o *quê*; lá está o *como*, comando a
  comando;
- **o doc 22**, que é o menu. Aqui está a lei; lá está a lista.

⚠️ **Esta cláusula é o que impede este arquivo de virar o 14º documento superado.**
Os docs 21 e 22 já a trazem, e é por causa dela que eles ainda valem.

---

## 12. Onde isto encosta no código

| | |
|---|---|
| `TRACO` = 12 u | [`geometria.ts:259`](../../src/lib/avatar/estilo/geometria.ts#L259) |
| `ESPESSURA_FINA` = 8 u | [`converter.ts:227`](../../scripts/avatar/arte/converter.ts#L227) |
| `LINHA` = `#000000` | [`palette.ts:58`](../../src/lib/avatar/palette.ts#L58) |
| `arte` × `formas`, a tabela | [`tipos.ts:114-118`](../../src/lib/avatar/estilo/tipos.ts#L114-L118) |
| o traço sem rede | [`compositor.ts:678-684`](../../src/lib/avatar/estilo/compositor.ts#L678-L684) |
| a régua da espessura | `npm run arte:espessura` |
| **a régua da cor da borda** | `npm run arte:borda` — em `verify:arte` |
| a régua do apagamento | `npm run arte:traco` |
| o tom, e por que ele é arquivo | `TomDaPeca` em `tipos.ts` |
| a peça-padrão, medida | [`ESTADO-DA-ROTA.md`](../../scripts/avatar/arte/ESTADO-DA-ROTA.md), 2026-08-21 |
| a esteira, comando a comando | [doc 19](19-rota-de-arte-runbook.md) — §12 traje, §13 rosto |
| o menu de peças | [doc 22](22-catalogo-de-pecas.md) |
