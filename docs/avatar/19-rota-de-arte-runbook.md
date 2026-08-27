# 19 — A rota de arte, do PNG à peça de catálogo (runbook)

> **Este é o processo vigente.** Ele substitui o traçado antigo
> (`avatar:tracar` → `avatar:fidelidade`, docs 14 e 15) como caminho para arte
> nova. O antigo não foi apagado e não deve ser: `tracar-cabelo.ts` é biblioteca
> compartilhada, e o refino da spline do Bloco 14 mora lá.
>
> **O registro de execução — cada número, medido, contra que teto — fica em
> [`scripts/avatar/arte/ESTADO-DA-ROTA.md`](../../scripts/avatar/arte/ESTADO-DA-ROTA.md).**
> Este doc é o *como fazer*; aquele é o *o que aconteceu*. Quando divergirem, o
> ESTADO-DA-ROTA vence sobre fatos medidos e este vence sobre procedimento.

**Duas peças saíram por aqui e foram aprovadas pelo Doug:** o espetado
(`entrada`, 2026-08-06, Bloco 9) e o chanel (`chanel`, 2026-08-07, Bloco 14).

> **São TRÊS esteiras, e a §2 é só a primeira.** Antes de mexer, veja em qual você
> está: **cabelo → §2** · **traje → §12** · **rosto/barba → §13**. A do rosto
> **inverte a ordem dos dois primeiros passos** (a limpeza vem antes do Gate −1), e
> rodar a ordem das outras duas ali reprova artes boas em lote.

---

## 1. A ideia, em uma frase

O Doug edita o cabelo **em cima de um render do próprio compositor**; o programa
prova que o boneco não se mexeu, isola a peça pela **cor instrumental**, tira o
contorno da máscara e converte para `{t,y}`.

Sem procurar olhos, sem procurar guia de cabeça, sem registrar uma cabeça contra
a outra. É o passo caro que a rota antiga fazia e esta tornou desnecessário: se a
arte foi desenhada sobre o render, o registro **já está feito por construção**, e
o Gate −1 só precisa provar que ele não se quebrou.

## 2. A esteira, comando a comando

Todos os caminhos são a partir da raiz do projeto. `<ARTE>` é o nome do arquivo
sem extensão (`entrada`, `chanel`, …); o PNG mora em `scripts/avatar/arte/`.

| # | passo | comando | o que ele decide |
|---|---|---|---|
| 0 | **a base de edição** | `npm run arte:base` | gera `base-oficial.png` (1024²) e o manifesto. **Uma só para todas as artes** |
| 1 | **a edição** | — (Gemini, pelo `PEDIDO-GEMINI.md`) | a arte volta como `scripts/avatar/arte/<ARTE>.png` |
| 2 | **Gate −1** | `npm run arte:gate -- scripts/avatar/arte/<ARTE>.png` | o boneco se mexeu? Reprovou aqui, **não siga** |
| 3 | *(se reprovou)* **a causa** | `npm run arte:causa -- scripts/avatar/arte/<ARTE>.png` | de que **cor** é a reprovação |
| 4 | **extração** | `npm run arte:extrair -- scripts/avatar/arte/<ARTE>.png` | ciano ∩ região permitida → máscara + papéis |
| 5 | **contorno** | `npm run arte:contorno -- scripts/avatar/arte/<ARTE>.png` | `bordaOrdenada` (Moore) → decimação por erro |
| 6 | **conversão** | `npm run arte:converter -- scripts/avatar/arte/<ARTE>.png` | massa `{t,y}`, clara, formas, e o preto |
| 7 | **a régua da espessura** | `npm run arte:espessura` | **decide a variante** — ver §3 |
| 8 | *(se transcreve)* **`TRANSCREVEM`** | editar `converter.ts` | a lista das artes que transcrevem o preto |
| 9 | **gerar o literal** | `npm run arte:pecas` | reescreve `src/lib/avatar/estilo/pecas-da-arte.ts` |
| 10 | **a folha de revisão** | `npm run arte:revisao -- <ARTE>` | 6 controles + a arte contra o render, sobrepostos |
| 11 | **a folha de escolha** | `npm run arte:folha` | as artes **entre si** a 56 px, nos 4 fundos |
| 11b | **a conferência do Claude** | ver **§14** | a folha bate com o PNG que foi ao gerador? **Teto de 2 min.** Não se pula para o 12 sem isto |
| 12 | **parecer do Doug** | `/dev/avatar-kokeshi` no navegador | aprovado ou não. **É a única aprovação que existe** |
| 13 | **promoção** | ver §7 | a peça entra em `CABELOS` |

Réguas de diagnóstico, fora da esteira, para quando algo não fecha:
`arte:silhueta` (a sonda da pele exposta), `arte:coroa` (o preto na calota),
`arte:escala` (os 92% e o hash da base), `arte:reguas` (as 15 asserções com
controle), `arte:cor-proibida` (nenhuma cor da base cai na janela do ciano).

⚠️ **`arte:figurinha` NÃO é diagnóstico — ela está no `verify:arte` e reprova.**
É a única régua da rota que mede a **máscara final contra a arte**, e não a arte
contra a base: ela pergunta se o passo 2c tapou rosto que a artista deixou à mostra.
Nasceu em 2026-08-24, depois de **duas** artes de coque duplo passarem em todos os
gates e serem reprovadas pelo olho do Doug com a mesma frase — *"onde indiquei deve
ser o rosto do avatar"*. Custa 6 s sobre o elenco inteiro. O piso é `2 × TRACO ×
ESCALA` (28,8 px de largura inscrita) e a pior arte aprovada mede 15,3 px; quando ela
reprovar, **o conserto é pelo DESENHO** — vão que desemboca na borda de fora do cabelo
nunca é preenchido. Ver o docstring de `figurinha-sobre-pele.ts` e a parte 5 do
`ESTADO-DA-ROTA.md`.

## 3. A régua da espessura decide a variante — e ela decide antes de custar tipo

`espessuraDoTraco` mede a **banda preta da arte** pela normal do contorno denso, e
publica os percentis. `fracaoFina` é a fração do perímetro abaixo de **8 u** —
0,64 px a 56, logo abaixo da sobrancelha inteira (0,66 px), que é o limite do
legível medido em `cabelo.ts:334-337`.

| medido | variante | o que fazer |
|---|---|---|
| banda **legível** (p50 ≳ 9 u, `< 8 u` baixo) | **`fiel`** | transcreve a banda da artista; preserva a modulação de peso |
| banda **fina** | **redesenhar** ou **`lei`** | a `fiel` some a 56 px |

Os números que fundam a régra, na rodada de 2026-08-07:

| arte | p05 | p50 | p95 | `< 8 u` | veredito |
|---|---|---|---|---|---|
| `entrada` (espetado) | 3,8 u | 6,3 u | 12,9 u | **79,8%** | não sobrevive à `fiel` |
| `entrada-2` | 4,6 u | 8,3 u | 10,4 u | 46,2% | **na fronteira** |
| **`chanel`** | 8,3 u | **9,6 u** | 12,1 u | **2,3%** | **`fiel`** |

**A saída preferida para banda fina é redesenhar, não a `lei`.** O
`PEDIDO-GEMINI.md` já exige *"contorno do cabelo da mesma espessura do contorno do
boneco"* — 12 u. O chanel obedeceu, e é por isso que a `fiel` funcionou nele. A
`lei` existe como rede: ela erode a máscara por `TRACO` **inteiro** (não `TRACO/2`
— ver §5) e entrega banda constante de 12 u, ao preço de achatar as laterais em
13–16 px. O Doug escolheu `fiel` sobre `lei` no chanel exatamente por isso.

⛔ **E a rede tem furo, medido em 2026-08-07 no espetado.** A `lei` não é saída
garantida para banda fina: erodir por `TRACO` inteiro encolhe o núcleo, e numa arte
cuja clara chega perto da borda ela **sobra para fora**. `conterAClara` desiste
(`convergiu: false`) porque conter dobraria o laço — a topologia do **pente**, que é
o que cabelo espetado é. Resultado: `contencaoDaClara` em **−9,2 u**, tom claro sobre
a banda preta, e `arte:pecas` reprova nomeando a arte. **Banda fina com clara junto
da borda não tem variante que sirva; tem redesenho.** Ver **T5** em
`docs/achados.md`.

## 4. As duas famílias de peça traçada, e por que as duas convivem — para sempre

| | **sintetizada** | **transcrita** |
|---|---|---|
| o preto | `stroke` de 12 u **centrado** no laço da massa (`Cabelo.linhas`) | diferença entre duas formas cheias: massa preta + **núcleo** de ciano por cima (`Cabelo.nucleo`), mais as **pretas internas** (`Cabelo.pretas`) |
| decimação | régua da **corda** (`escolherN`) | corda + **`refinarPelaSpline`** |
| a clara | direto da máscara | contida no núcleo (`conterAClara`) |
| IoU do preto | **34,4%** | **80,1%** |
| traço **interno** à peça | impossível — não tem onde morar no tipo | **866 px** em 4 formas |
| quem usa | `entrada` (espetado) | `entrada-2` (assimétrico) e `chanel` |

**A transcrita é a melhor das duas, por medição, e é o pipeline permanente para
arte nova.** A sintetizada tem um defeito de gênero: o stroke de 12 u **esconde**
o que está por baixo dele. A franja torta do chanel atravessou três blocos
invisível por causa disso — só apareceu quando o preto passou a ser transcrito.

⛔ **A sintetizada NÃO vai ser apagada — o Passo 7 saiu do plano em 2026-08-07, por
decisão do Doug.** Ele dependia de o espetado transcrever, e o espetado **não tem
variante que sirva**: a `fiel` some a 56 px e a `lei` vaza a clara (ver §3). A única
saída era redesenhar a arte, e o Doug decidiu não redesenhar.

**Consequência, e ela muda como se lê esta tabela:** as duas famílias são caminhos
válidos, não uma legada e uma vigente. `Cabelo.linhas` é campo **permanente** do
tipo. Para **arte nova** a resposta continua sendo a transcrita — a §3 decide a
variante, e banda fina pede redesenho, não `lei`. O espetado fica no sintetizado
com IoU 34,4%, e isso é fidelidade à arte perdida, **não peça quebrada**: o stroke
de 12 u centrado é o que encobre o erro da régua da corda, então mantê-lo mantém o
render que foi aprovado no Bloco 9.

## 5. O que cada reprovação quer dizer

### Gate −1 — o boneco se mexeu

`arte:gate` roda em três tempos: **hash + dimensão** → **ciano** (máscara
preliminar, sem olhar a base) → **registro + NCC sobre `região ∧ ¬peça`**.
`arte:causa` sai no laudo sempre, aprovada ou reprovada — é o que quebra a
circularidade de a peça ser *definida* pelo teste de matiz.

| reprovou em | quer dizer | o que fazer |
|---|---|---|
| **dimensão** | o gerador reenquadrou | repetir o pedido; a primeira linha dele proíbe |
| **deslocamento / escala** | o boneco andou ou mudou de tamanho | idem |
| **rosto / corpo, e `arte:causa` diz "repintura"** | o gerador redesenhou o boneco | arte inservível, refazer |
| **rosto / corpo, e `arte:causa` diz "a própria peça"** | a peça cobre região protegida | **não é defeito da arte.** Foi o caso da `entrada-2`: 97,4% do que mudou era a peça. O Bloco 12 tirou o tronco da extração e ela passou a aprovar |

O `arte:causa` de uma arte boa dá **repintura ≈ 98%**. O de uma arte que cobre o
tronco dá **peça ≈ 97%**. A fixture F (quadrado preto colado no tronco, sem um
pixel de ciano) é a isca: ela tem de **reprovar**, e reprova — preto que não
encosta em ciano não é peça.

### Extração — `descartado fora da permitida` alto

A peça está sendo **amputada**. Rio abaixo isso vira piso de simplificação que não
cai nem com N = 64 — não é decimação mal escolhida, é forma que a poligonal não
representa. Medido na `entrada-2` antes do conserto: 26 354 px descartados, piso
de 28,56 u. Depois: piso de **1,14 u**.

### Conversão — `perda da massa` ou `perda da clara` > 0

Massa multi-componente. `Cabelo.claras` e `Cabelo.formas` existem para isso; se
ainda perde, a segunda componente não achou onde morar.

### `arte:revisao` — um controle falhou

**Os números da peça não valem.** A régua está medindo outra coisa; conserte a
régua antes de olhar a peça. Os seis:

| # | controle | teto | o que ele pega |
|---|---|---|---|
| 1 | identidade (dois renders da mesma coisa) | IoU > 99,9% | a régua é determinística? |
| 2 | careca (sem peça nenhuma) | IoU < 0,5% | denominador vazio disfarçado de acerto |
| 3 | peça trocada no lugar desta | < a certa − 5 pp | a régua distingue peças? |
| 4 | `naTela` bate no raster | ≤ 2 u | o registro entre as escalas é confiável |
| 5 | denominadores > 0 | — | **aprovação por vacuidade** — o modo de falha nº 1 desta rota |
| 6 | o literal colado é o que o conversor produz | ponto a ponto | `pecas-da-arte.ts` defasado |

O controle 6 **recusa desenhar a folha**: julgar uma peça enquanto o navegador
mostra outra é pior que não julgar. Ele é dispensado, **com o motivo impresso**,
quando se roda `--variante` forçada — ali a folha é bancada de arte, não
conferência de literal.

### O modo de falha que se repete nesta rota, e ele é sempre o mesmo

**Régua que devolve o mesmo número para coisas diferentes.** Aconteceu cinco vezes
e todas as cinco estão registradas no ESTADO-DA-ROTA:

- `coroa.ts` com limiar de luminância calibrado na **arte** aplicado no **render**
  → 89,0 u para as duas configurações;
- `silhueta.ts` medindo contra denominador **zero** → "não há aro", por vacuidade,
  de qualquer peça;
- `silhueta.ts` classificando **fundo** como pele exposta → 100,0% numa touca;
- `escala.ts` **omitindo** o campo no caso "100%" depois que o padrão virou 92% →
  os dois lados iguais;
- a régua da barra agregando um perfil que só é concêntrico na careca → disse que
  A era 3× pior quando a leitura visual dizia o contrário.

**A defesa é uma só: toda régua nova entra com controle negativo ao lado, e o
número errado fica impresso junto do certo.** `arte:reguas` são 15 asserções
nesse formato; `nucleo-cabelo.test.ts` e `refino-spline.test.ts` são as do
Bloco 13–14.

## 6. Os tetos que **não** vetam

- **Bytes do composto.** `ORCAMENTO_COMPOSTO` é autoimposto, e o doc 15:463
  declara que ele **não veta arte aprovada** (decisão A de 2026-08-06). Uma peça
  traçada de arte real tem mais pontos que uma paramétrica. O valor é
  **registrado**, não bloqueante.
- **Barra enterrada.** Não chega a zero (14,1 / 8,8 / 6,1%). O resíduo é contorno
  de mecha cruzando a fronteira do crânio, não o traço do crânio — e a régua não
  os separa. Item 4 da lista aberta.

## 7. Promoção — a peça entra em `CABELOS`

O modelo é o do Bloco II de 2026-08-07 (espetado e chanel, 5 → 7 modelos):

1. **Reusar geometria, sobrescrever identidade.** `PECAS_DA_ARTE.<arte>` carrega
   `id` do **nome do arquivo** (`pecas.ts`). O catálogo espalha os dados e declara
   o `id` e o nome de catálogo dele. Sem helper novo.
2. `ModeloCabelo` e `MODELOS_CABELO` ganham a peça; as contagens do doc 15
   (Bloco 8 e Bloco 9) são auditadas, não só a linha "5 hair".
3. `cabelo.test.ts` — o `describe.each` cobre a peça nova, eixo a eixo.
4. **Selos.** Os paramétricos continuam congelados **por lista explícita**
   (`MODELOS_PARAMETRICOS`), nunca por filtro automático; os promovidos ganham
   selos próprios num bloco separado.
5. `folha-base.ts` passa a renderizar a peça nova, então *"folha inalterada"* é
   impossível — o rebase é declarado, não silencioso.
6. **Critério de fronteira:** rodar a esteira de outra arte **não move um byte** do
   render das peças já promovidas.
7. **VESTIR A PEÇA — o aperto de cada chapéu.** Ver §7b. **Sem isto o
   `verify:arte` reprova**, e é de propósito.

## 7b. Vestir a peça — o cabelo se adapta ao chapéu, par a par

⚠️ **Um cabelo novo NÃO está pronto quando entra em `CABELOS`.** Ele nasce com nove
pares por decidir, um por chapéu do elenco, e até 2026-08-26 saía desenhado com
aperto 1,00 nos nove sem nada reprovar — trabalho de vestir a peça sumindo em
silêncio, com a cadeia toda verde.

### Por que existe um aperto, e por que não é derivado

`escondeCabelo` (§ do chapéu) fecha o cabelo que **atravessa** a peça e o que
**estoura pela lateral acima** dela. O que sobra é de LARGURA: os penteados do elenco
têm de **105% a 133%** da largura da cabeça, e **abaixo da aba não há chapéu para
esconder nada**. Esconder ali cortaria a silhueta contra o fundo — o defeito que esta
rota já mediu duas vezes. **Estreitar não corta**: a mecha continua inteira, com a
forma desenhada, e passa a caber sob a peça. É o que um boné faz com o cabelo.

**Não tente derivar o número** (largura do chapéu ÷ largura do cabelo). Medido e
descartado: o `elvis` fecha em 0,95 sob a `touca-de-la` porque o que sobra é UMA mecha
na têmpora; o `dreadlocks` precisaria de 0,85, e ali as cordas perdem **57%** do
volume. Mesma largura, aperto diferente — decide **onde** está a massa e o que a peça
deixa de ser ao encolher. E os números do Doug provam: a `toca-de-cozinha` pediu
**0,83** para `cachos-anjo` e **0,99** para `coque-simples`.

⚠️ **Nem tente derivar do "cabe dentro do chapéu".** O Doug aprovou pares em que o
cabelo ainda passa da largura da peça — `dreadlocks` + `bone` passa **27 u** e está
aprovado. Régua de contenção reprovaria a decisão dele.

### A esteira, comando a comando

| # | passo | onde | o que decide |
|---|---|---|---|
| 1 | pôr o par na mesa | `/dev/avatar-oclusao` — clique no chapéu e no cabelo, ou na célula da tabela | qual par |
| 2 | achar o aperto | os botões `1,00 … 0,84` e o `−`/`+` de 0,01 | o número, **no olho**, com os 19 a 56 px ao lado |
| 3 | gravar | `gravar par` | grava em `scripts/avatar/arte/aperto.json` |
| 4 | repetir | os nove chapéus | **inclusive os que não precisam apertar** |
| 5 | gerar o catálogo | `npm run arte:apertos` | escreve `src/lib/avatar/estilo/apertos-da-arte.ts` |

**`1,00` também se grava.** "Este par não precisa apertar" é resposta, e ela tem de
ficar registrada — senão não há como distingui-la de um par que ninguém abriu. Quem
apaga o `1` é o gerador do catálogo, para o SVG do produto sair byte a byte igual.

### O que reprova, e o que a reprovação quer dizer

| gate | reprova quando |
|---|---|
| `arte:apertos --check` | o `aperto.json` mudou e o catálogo não foi regerado — o Doug decide um número e o produto desenha outro |
| `arte:apertos` (cobertura) | **algum par do elenco não tem linha** — é o cabelo novo sendo pego |
| `arte:apertos` (chave órfã) | há linha para peça que não existe mais |
| `arte:par` | cabelo ESTOURANDO o chapéu acima de um px de ranking (225 px no quadro da arte) |

**Chapéu novo custa o mesmo:** ele entra com 19 pares por decidir, e a mesma
reprovação o pega.

### Onde ler mais

`aperto-do-cabelo.ts` (o livro de decisões), `apertos.ts` (o gerador), o campo
`apertoDoCabelo` em `tipos.ts`, e a parte de 2026-08-26 do `ESTADO-DA-ROTA.md`.

## 8. Reentrada — uma arte que volta retocada

É o caso da `entrada-2` (Assimétrico): ela **não será refeita**. A arte atual
recebe ajuste fino do Doug e a versão retocada passa pela esteira de sempre.

Rode, na ordem: **2 → 3 → 4 → 5 → 6 → 7** (§2). A régua da espessura **re-mede e
decide de novo** — a medição atual está na fronteira (p50 8,3 u, 46,2% abaixo de
8 u), então o retoque pode mudar a variante. Depois **8 → 9 → 10 → 11 → 12**, e
aprovando, **13**.

**A asserção negativa é obrigatória a cada passo**, e ela é o que separa reentrada
de rebase acidental:

- as OUTRAS artes **byte a byte paradas** em
  `pecas-da-arte.ts` — `git diff` com uma hunk só, dentro do bloco da arte que
  voltou;
- os selos de `parametrico-congelado.ts` **verdes**;
- `npm run avatar:folha-base` nos números congelados do dia.

Se algo além da arte retocada se mexer, **pare e mostre**. Um paramétrico que
muda um byte quer dizer que a mudança veio do conversor e vale para todos — isso
é achado, não rebase.

> ### O retoque NO PIXEL — a quarta saída, aberta em 2026-08-13
>
> Nem toda arte defeituosa precisa voltar ao gerador. Quando o defeito é
> **descritível em régua**, ele se conserta por programa e reentra pela mesma
> esteira. Foi assim que o achado **G20** fechou — a tira de pele no decote do
> gambesão, 3 151 px trocados por `scripts/avatar/arte/reparo-g20.ts`.
>
> **Vale quando** a operação é (a) *restaurar* o que a base já tem — copiar o pixel
> de volta não é desenhar —, ou (b) trocar uma cor que **um número medido** separa
> da vizinhança. No G20 o vale do histograma separava o miolo do cordão (R 32–95) da
> pele (R ≥ 144).
>
> **Não vale** para forma nova. Desenhar por programa é o que a rota inteira existe
> para evitar; a arte é do Doug e do gerador.
>
> **Três amarras, e as três custaram uma reprovação para aparecer:**
>
> 1. **o preenchimento sai da própria arte** — interpolação do vizinho na mesma
>    linha, nunca uma cor constante. A 1ª tentativa usou balde de tinta e deixou
>    417 px de tom único dentro de um pano com 212 tons: o remendo se anunciava;
> 2. **o piso da máscara tem que pegar o antialias.** Piso alto deixa franja de 1 px
>    contornando o remendo — pior que o defeito original, que ao menos tinha
>    gradiente;
> 3. **procedência é obrigatória.** O script fica no repositório, o cabeçalho
>    explica de onde sai cada número, e ele **roda como asserção**: sobre a arte já
>    reparada tem que contar 0 px. A saída crua do gerador fica no git.
>
> **Nenhum gate desta rota reprova chapado ou franja.** Quem pegou as duas foi a
> leitura da arte renderizada, por subagente. Retoque no pixel **não dispensa o
> olho** — dispensa a rodada de gerador.

## 9. As amarras que não se negocia

1. **A base de edição não encolhe.** `base-oficial.ts` pede `escala: 1`
   explicitamente. Desde que `ESCALA_PADRAO = 0.92` virou padrão (Bloco 5), isso
   deixou de ser estrutural e virou **uma linha que alguém pode apagar** — e
   `arte:escala`, que confere o hash do PNG contra o manifesto, é a única coisa
   entre o gerador e uma base encolhida. Ela está em `verify:arte`.
2. **Quem mede geometria interna pede `escala: 1`.** `folha-base.ts`,
   `verificar-pose.ts`, `fidelidade.ts`, `arte/silhueta.ts`, `arte/coroa.ts`,
   `arte/fixtures.ts`, `arte/base-oficial.ts`. O teto de bytes de `folha-base.ts` é
   a exceção deliberada: ele mede o que o **produto** emite.
3. **Nenhuma cor da base pode cair na janela do ciano** (180° ± 30°, saturação
   ≥ 0,18). Margem medida hoje: **138,2°**. Três cores da paleta cairiam dentro se
   fossem emitidas — `FUNDO[5]` água (173°, a **6,9°**), `CABELO[7]` azul (205°),
   `FUNDO[0]` azul (207°). `arte:cor-proibida` guarda isso.
4. **`TRANSCREVEM` mora em `converter.ts`, não no gerador.** Três programas
   precisam da mesma resposta: `arte:pecas` gera, o controle 6 de `arte:revisao`
   confere, `arte:folha` desenha. Com a lista no gerador, o controle compararia
   literal transcrito com conversão sintetizada e acusaria divergência para
   sempre.
5. **`pecas-da-arte.ts` é gerado.** Corrigir o cabeçalho dele é corrigir
   `pecas.ts`, nunca o arquivo. `npm run arte:pecas -- --check` está em
   `verify:arte` e reprova quando ele defasa do `converter()`.
6. **TODO PEDIDO NOMEIA O QUE O BONECO NÃO TEM.** Um bloco fixo, em toda arte,
   com estas palavras: *"este boneco não tem braços, mãos, ombros salientes,
   pernas, pés, orelhas nem pescoço; o corpo é uma peça só em forma de sino e a
   cabeça senta direto em cima dela; não acrescente nenhuma dessas partes, nem
   desenhando, nem sugerindo com manga, cava, punho ou sombra; se a referência
   tiver braços, ignore os braços dela"*.

   **Não é zelo, é medido:** na primeira tentativa do traje, em 2026-08-12, o
   gerador acrescentou braços — decisão do Doug de endurecer os pedidos a partir
   dali. E a lista tem duas ausências que só existem no **nosso** boneco e nenhum
   gerador supõe: **as orelhas saíram no Bloco 1d** (`geometria.ts:188-192`,
   *"a resposta agora é nenhuma, para todos os 92 itens de catálogo"*) e **não há
   pescoço** — o topo do tronco desaparece sob a cabeça (`geometria.ts`, `TRONCO.yTopo`).

   Duas travas de redação vêm junto, aprendidas na mesma rodada:

   - **repetir a proibição em dois lugares** — no bloco fixo, e de novo na lista
     de "não use" do fim. Proibição dita uma vez só o gerador atropela;
   - **não usar a palavra que convida o defeito.** O pedido dizia *"a linha do
     ombro marcada"*, e ombro é onde braço nasce. Virou *"o alto do corpo"*.
     É o mesmo mecanismo do doc 17 §5.0, um andar acima: **o pedido é a causa**.

## 10. O CI

`verify:arte` está em `verify:all` e roda, nesta ordem:

```
arte:fixtures  →  arte:reguas  →  arte:cor-proibida  →  arte:escala  →  arte:pecas --check
```

As duas direções que ele fecha: **um literal promovido que mude** cai nos selos de
`parametrico-congelado.ts` (via `npm test`); **`pecas-da-arte.ts` que defase do
conversor** cai no `--check`. Nenhum dos dois exige render.

## 12. A rota do TRAJE — o que muda, e o que não muda

> ### ⚠️ EMENDA DE 2026-08-20 — arte NOVA sai em raster; as duas antigas ficam
>
> **O invólucro continua `.svg` e a colagem continua a mesma.** O que muda é o que
> vai dentro dele: em vez de milhares de paths chapados imitando o degradê que a
> arte já tinha, **um `<image>` WEBP** com o recorte inteiro.
>
> | peça | vetor (cru / gzip / formas) | raster (cru / gzip / formas) |
> |---|---|---|
> | `traje-farda` | 152,0 KB / 42,8 KB / 473 | **21,9 KB / 16,0 KB / 0** |
> | `traje-gambesao` | 228,2 KB / 60,6 KB / 530 | **20,0 KB / 14,6 KB / 0** |
>
> **Por que:** é a mesma descoberta que mudou a rota do rosto (§13). Traçar arte de
> cor assada é converter raster em polígonos **para imitar de volta o tom que o
> raster já carregava** — custa peso e perde desenho. Peça de cor assada não é
> pintada pelo compositor; ele só a cola. Não há nada ali que precise ser vetor.
>
> **⚠️ `traje-farda` e `traje-gambesao` estão CONGELADAS no vetor.** Foram
> desenhadas, medidas e aprovadas pelo Doug no traçado, e regerá-las gastaria o olho
> dele para devolver a mesma peça mais leve — ganho de custo, não de qualidade. Foi
> a **opção 3**, escolhida por ele. A tabela acima é o que elas *custariam*, medido
> em pasta temporária; no disco elas continuam vetor.
>
> A trava é **mecânica**, `CONGELADAS_NO_VETOR` em `traje.ts`, e precisa ser: o
> `arte:trajes --check` **reescreve** os `.svg` mesmo no modo `--check`, então uma
> decisão escrita só aqui seria desfeita pelo primeiro `verify:arte` de quem não a
> leu. Quem escolhe o braço é `formatoDoTraje(slug)` — função pura, prendida por
> `scripts/avatar/arte/__tests__/peca-raster.test.ts`.
>
> **Qualidade do WEBP: 82.** Subir para 90 devolve bytes sem devolver desenho que o
> olho distinga a 425 px; descer para 70 suja a borda, que é onde o traço preto do
> gerador mora e onde o olho vai primeiro.

> ### ⚠️ EMENDA DE 2026-08-17 — o passo 4 deixou de terminar em raster
>
> **A peça que vai ao ar é um `.svg`.** Onde o resto desta seção disser PNG,
> `tinta.png` ou "raster", esta caixa vence.
>
> | | antes (raster) | **agora (vetor)** |
> |---|---|---|
> | o que o passo 4 escreve | `public/items/traje/<slug>.png` | **`public/items/traje/<slug>.svg`** |
> | o campo do literal | `tinta.png` | **`tinta.arte`** |
> | o recorte | 600 × 840 RGBA, arquivo | **o mesmo recorte, agora em memória** — entrada do traçador |
> | o traçador | — | `CONFIG_TRAJE`, em `traje.ts` — **NÃO é a do cabelo** |
> | peso no fio (gambesão) | 248,2 KB | **60,6 KB** |
>
> **Por que:** a P1 do plano mediu o gambesão (aerografado, o caso difícil) e a
> farda (chapada) nas duas rotas, e o Doug escolheu o vetor olhando as folhas. O
> laudo inteiro, com os quatro números e o que cada variante perde, está na entrada
> de 2026-08-17 do doc 21. `npm run arte:prova-vetor [slug]` refaz a medição.
>
> **O que NÃO mudou, e é o que fez a troca ser barata:** a colagem. O `<image>` do
> compositor já aceitava SVG, e a peça continua ocupando o `viewBox` inteiro com
> `k = 1`. A régua da colagem (`arte:folha-traje`) mede o desenho na tela contra o
> raster que a esteira regenera, e deu **(0, 0) nas duas peças** depois da troca.
>
> **A configuração do traçador é OUTRA, e isso é medido, não gosto.** A do cabelo
> foi calibrada para encolher a curadoria — 235 fragmentos viram 46 —, porque cabelo
> recolore e cada fragmento pede um papel humano. Traje não recolore: fragmento não
> custa trabalho, e a única coisa que ele compra é fidelidade. Aplicada à farda, a
> calibração do cabelo **apaga o pesponto tracejado da carcela**. Ver `CONFIG_TRAJE`.
>
> **O raster não morreu — saiu do deploy.** Ele é a verdade de referência das
> réguas, e `construir()` o devolve em memória a cada rodada. Não é commitado porque
> a esteira é determinística: quem quiser o raster roda a esteira e o tem de volta.

> ### ⚠️ EMENDA DE 2026-08-13 — o ciano saiu, e com ele metade do passo 4
>
> **O passo 3 e o passo 4 mudaram, e a tabela abaixo ainda descreve os antigos.**
> Onde ela divergir desta caixa, a caixa vence.
>
> | | antes (ciano instrumental) | **agora (cor final)** |
> |---|---|---|
> | como a peça é reconhecida | matiz 180° ∩ saturação — o ciano do pedido | **diferença contra a base ∩ campo do traje** (`noCampoDoTraje`, base.ts) |
> | o que o passo 4 faz | recolore na cor da patente + recorta | **só recorta** — a cor é a que a artista pintou |
> | de onde vem a cor | `scripts/avatar/patentes.ts` | da própria arte |
> | o slug | `traje-<patente>-<nome>` | **`traje-<nome>`** |
> | o controle negativo | remedir a luminância de cada papel na saída | **extrair a PRÓPRIA base devolve 0 px** |
>
> **Por que:** a patente deixou de vestir o boneco (doc 21 §0). Sem cor de destino
> não há o que recolorir, e sem ciano no pedido não há matiz reservado para
> reconhecer a peça.
>
> **O campo do traje é o que devolve a precisão que a cor dava.** A diferença sozinha
> levaria as feições repintadas, o ruído de reencode e a sombra do chão redesenhada —
> é o que `extrair.ts` sempre disse dela. As três fronteiras do campo são teto
> publicado, não escolha: o queixo em cima, `meioDoTronco + 26 u` dos lados,
> `yBase + traço/2 + 18 u` embaixo.
>
> **Uma peça ainda se recolore, e a lista só encolhe.** A `traje-farda` foi desenhada
> em ciano, e o que o Doug aprovou foi o resultado oliva. Assar o oliva na arte de
> origem **foi tentado e reprovou duas vezes**: o Gate −1 passou a acusar 72
> ladrilhos de forma no corpo (ele reconhece a peça pelo ciano, justamente para
> julgar o boneco fora dela), e a máscara encolheu 11 122 px. Então o ciano fica na
> arte e o oliva é **declarado** em `COR_FINAL_DECLARADA` (`traje.ts`) — uma linha,
> para uma peça, sem sucessora.
>
> **O passo 2 também mudou, e antes de tudo:** o Gate −1 tirou do alvo do registro o
> que a peça **escureceu** na faixa de rodapé. É o conserto do achado **G19**, e sem
> ele nenhum traje com barra passa. Ver `docs/achados.md`.

*Escrita em 2026-08-12, quando `traje-soldado-farda` passou por aqui. A rota nasceu
para cabelo; esta seção é a metade que difere. A esteira comando a comando, com os
números e as três ressalvas, está em
[`.claude/skills/avatar-importar-arte/references/esteira-traje.md`](../../.claude/skills/avatar-importar-arte/references/esteira-traje.md).*

| # | passo | cabelo | **traje** |
|---|---|---|---|
| 0 | base de edição | `arte:base` | **`arte:base-tronco`** — a mesma base, o campo medido |
| 1 | o pedido | `PEDIDO-GEMINI.md` | **`PEDIDO-TRAJE.md`** |
| 2 | Gate −1 | `arte:gate` | **igual** |
| 3 | extração | `arte:extrair` | **igual** |
| 4 | a peça | `arte:contorno` → `arte:converter` → `arte:espessura` | **`arte:traje`** |
| 5 | o literal | `arte:pecas` | **`arte:trajes`** |
| 6 | o `--check` no CI | `arte:pecas --check` | **`arte:trajes --check`** |
| 7 | a folha | `arte:folha` | **`arte:folha-traje`** |
| 8 | **a conferência do Claude** | §14 | **igual** |

**Os passos 2 e 3 não precisaram de uma linha de mudança**, e isso contraria o que
esta rota previa. `base-tronco.ts` foi escrito dizendo que a inversão de
`REGIOES_QUE_REPROVAM` viria depois — para traje o corpo é o campo e a cabeça é que
tem de ficar intacta. Não veio: a regra do Bloco 12 (o tronco fora da extração)
atribuiu **99,1%** do que mudou à própria peça, e o Gate −1 aprovou de primeira. **A
inversão só entra se alguma arte reprovar por ela.**

**Onde o traje vira raster, e o cabelo não.** A §6.1 do doc 21 diz que o que excede
a silhueta é `extensoes`, e extensão é vetor. Esta peça transbordou 10,75% e o
raster serviu, porque `arteDoTraje()` desenha o `<image>` **fora do clip**, depois do
contorno do tronco — onde a roupa passa, o traço dela vira a borda externa. O
traçado continua devendo para uma peça que precise de **forma própria** (capa,
ombreira), não para o transbordo do pano.

**Quatro amarras que só existem aqui:**

1. **a cor não se escreve** — sai do slug (`traje-<patente>-<nome>`) via `PATENTES`,
   travada por `verify:paleta-patentes`. As três opções de uma patente saem no mesmo
   pano por construção;
2. **a arte carrega o próprio volume**, inclusive a sombra sob o queixo. O
   compositor não sombreia peça com `tinta.png` — pintar por cima dobrava o
   sombreado (1 933 px repintados → 10);
3. **o contorno do tronco é do compositor, sempre.** Tirá-lo derrubou a borda para
   p50 7,5 u; reconstruí-lo no PNG subiu para 15,0 u. As duas reprovaram na tela. A
   causa real — a extração entrega o miolo do traço — é o achado **G17**;
4. **o transbordo é obrigatório, e tem alvo medido.** Decisão do Doug em
   2026-08-12: *"deve passar da silhueta, que nem a primeira arte. isso deve ser
   padrão e diretriz"*. A farda aprovada mediu **10,75%** em `ALÉM DA SILHUETA`, e
   esse é o alvo — não a tolerância. Peça perto de zero ali é reprovação sozinha,
   mesmo com todos os outros números verdes: roupa que termina na linha do corpo lê
   como tinta sobre madeira (doc 21 §6.1, *"roupa veste, não pinta"*). Ela passa em
   **três lugares e nos três** — barra, lateral do alto, lateral da cintura —, com
   teto de 21 px na barra e 31 px por lado. **O `PEDIDO-TRAJE.md` não pode conter a
   frase "na dúvida, passe menos"**, que foi a causa medida da rodada de transbordo
   zero: gerador em dúvida passa zero.

   **O outro lado, e ele é critério de aceitação, não texto de prompt:** a roupa
   **não abre para fora embaixo**. Quem manda na forma geral do boneco é o boneco;
   a roupa engrossa a borda dele, não vira saia nem vestido evasê, e a cabeça
   continua sendo com folga a parte mais larga. O Doug decidiu em 2026-08-12 que
   isso **não entra no texto colado** — *"as artes já vêm sem abrir para fora por
   baixo"* —, porque proibição que o gerador não estava violando dilui as que
   importam. ⚠️ **E falta a régua:** a tabela de folgas mede cintura, ombro e a
   descida da barra, mas **não a largura na altura da barra**, que é onde o corpo
   da base curva para dentro e o pano pendurado legitimamente não acompanha.
   Enquanto essa linha não for medida em `base-tronco.ts`, aplicar o teto da
   cintura ali é inventar régua — foi o erro do Claude na 2ª rodada do gambesão.

## 13. A rota do ROSTO (barba) — e a ordem que ela inverte

*Escrita em 2026-08-20, com nove artes de barba já passadas pela esteira. Vale para
todo o slot `rosto`: barba, bigode, e o que mais for desenhado ali.*

### ⚠️ A LIMPEZA VEM ANTES DO GATE −1 — e é o contrário das outras duas rotas

| rota | ordem |
|---|---|
| cabelo (§2) | edição → **Gate −1** → extração |
| traje (§12) | edição → **Gate −1** → extração |
| **rosto** | edição → **`restaurar-peca.ts`** → **Gate −1** → esteira |

**Rodar o Gate −1 na arte crua reprova TODAS as artes, inclusive as boas.** Não é
tolerância mal calibrada; é a ordem em três tempos do próprio gate
(`gate-menos-um.ts`, a inversão do Bloco 2b):

1. hash + dimensão;
2. **ciano → máscara preliminar da peça**;
3. registro + NCC sobre `região ∧ ¬peça`.

O passo 2 reconhece a peça **pelo ciano instrumental** (matiz 180°). A barba que
volta do gerador vem no matiz que ele quis — castanho, verde, preto —, então a
máscara preliminar sai **parcial**, e o pedaço de barba que ela não reconhece é
contado como *o gerador redesenhou o boneco*. A arte reprova por estar certa, que é
o mesmo modo de falha da `entrada-2` (§5, "a própria peça").

**Medido na `rala`, em 2026-08-20** — a mesma arte, com e sem a limpeza antes:

| | peça reconhecida | não explicado | forma em "rosto" | veredito |
|---|---|---|---|---|
| arte crua | 84,3% (3 799 px) | **14,7% (660 px)** | **27 ladrilhos** (teto 1) | **REPROVADA** |
| depois de `restaurar-peca` | **100,0%** (4 120 px) | 0 px | 0 | APROVADA |

Repare que a máscara **não** vai a zero — o ciano acerta a maior parte da mancha por
acaso de matiz. É o resto que reprova, e é por isso que a reprovação engana: ela sai
com a mensagem *"a FORMA mudou — 27 ladrilhos"*, que é a mensagem de gerador que
redesenhou o boneco, sobre uma arte em que o boneco está intacto.

Quem cria o ciano é `restaurar-peca.ts`: ele leva o matiz da mancha grande e conexa
para 180° preservando saturação e luminância — **nenhum pixel muda de lugar** — e
restaura o resto contra a base. Só depois disso o passo 2 tem o que reconhecer.

**No cabelo e no traje a inversão não aparece** porque lá o ciano já vem do pedido
(cabelo) ou o campo do traje substitui a cor como critério (§12, emenda de
2026-08-13). No rosto não há nem um nem outro: o pedido pede a barba **em cor
final**, e o campo do rosto é pequeno demais para carregar o reconhecimento sozinho.

**Esta ordem já foi errada uma vez**, e o sintoma é o da tabela acima: o lote
inteiro reprovando com "a FORMA mudou" sobre artes boas. Se um lote reprovar em
peso, a primeira pergunta é a ordem, não o gerador.

### A esteira, comando a comando

| # | passo | comando | o que ele decide |
|---|---|---|---|
| 0 | a base de edição | `npm run arte:base-barba` | o render careca e sem barba que vai ao gerador |
| 1 | a edição | — (ChatGPT desenha a barba, Gemini transplanta; `PEDIDO-BARBAS.md`) | a arte volta em `scripts/avatar/arte/<PEÇA>.png` |
| 2 | **a limpeza** | `npx tsx scripts/avatar/arte/restaurar-peca.ts <bruta> <limpa> [franja_u]` | matiz → ciano, resto → base. **Sem ele o passo 3 reprova tudo** |
| 3 | Gate −1 | `npm run arte:gate -- <limpa>` | o boneco se mexeu? Reprovou aqui, **não siga** |
| 4 | o traço | `npm run arte:traco -- <limpa>` | o contorno do boneco sobreviveu à limpeza |
| 5 | a peça | `construirRosto()` (`barba-para-formas.ts`) | potrace → **uma** silhueta, servida a duas formas do mesmo `d`, mais o PNG de tom |
| 6 | o literal | `npm run arte:rostos` | reescreve `src/lib/avatar/estilo/rostos-da-arte.ts` |
| 7 | o `--check` no CI | `npm run arte:rostos-check` | entra em `verify:arte` |
| 8 | a folha do elenco | `npx tsx .scratch/estilo/folha-elenco.ts` | as peças entre si, um cartão por barba |
| 8b | **a conferência do Claude** | ver **§14** | a folha bate com o PNG? **Teto de 2 min.** Não se pula para o 9 sem isto |
| 9 | parecer do Doug | a folha | aprovado ou não. **É a única aprovação que existe** |

Para passar a pasta inteira de uma vez, `.scratch/estilo/lote-barbas.ts` roda os
passos 2 a 5 em cada arte e imprime onde cada uma parou.

### O tom vem por MÁSCARA, e a partição contorno/miolo morreu

**Isto mudou em 2026-08-20 e revoga o que esta seção dizia antes.** Até ali a
esteira partia a peça em duas — contorno preto fixo (lum < 60) e miolo recolorível —
e traçava as duas. O Doug perguntou por que uma arte de **917 tons** chegava ao
boneco com **dois**, e a causa não era a D17: era o `potrace`. Ele traça CONTORNO, e
contorno é binário — todo tom intermediário arredonda para uma das cores. A borda
dura era escolha da esteira, não regra. **A D17 proíbe cor assada, não tom.**

O que `construirRosto` emite hoje:

```
<path d=silhueta fill="var(--av-linha)"/>            ← o preto, por baixo
<path d=silhueta fill="var(--av-cabelo)" mask=…/>    ← a cor, com a luz da arte
```

As duas formas têm o **mesmo `d`**. O claro-escuro é um PNG **cinza** da luminância
da arte, dentro de um `<mask maskUnits="userSpaceOnUse">` na caixa da peça — e o
PNG é **servido à parte**, como o `.svg` do traje: o SVG carrega o caminho
(`/items/rosto/<slug>-tom.png`, 38 bytes), nunca os bytes. Onde a arte é clara a cor do cabelo aparece cheia; onde escurece ela cede e o
preto de baixo aparece. **A máscara não tem cor** — é um canal de cinza —, então a
peça recolore inteira e a Regra Inviolável nº 4 continua de pé.

Dois números que decidem o resto:

- **o esticão sai de PERCENTIL desta arte** (p2 / p98), não de constante. Mapear
  0–255 direto sai lavado: na `trancada-v4` a peça mora entre lum 0 e 140, e o miolo
  pousaria em 55% de opacidade. `hi <= lo` **reprova** — peça chapada não tem tom;
- **a resolução é 50% da caixa**. Medido: 100% → 1.038 tons, 50% → 917, 35% → 916.
  Metade custa 12% dos tons e devolve metade dos bytes. Vale para a BARBA; cada slot
  tem direito ao próprio número.

**Consequência para o pedido ao gerador, e ela INVERTEU.** Antes: *"peça escura de
qualquer matiz recolore pouco"* — a `cavanhaque-antiga` recolorindo 7,6% era o
achado **G31**. Agora o percentil normaliza o contraste peça a peça, e a
`cavanhaque` volta a ter tom: **180 tons distintos, esticão lum 0 → 146**. O G31 se
dissolve por construção, sem caso especial e sem a saída `divisao: "erosao"`, que
foi apagada junto com a partição.

⚠️ **Isso é consequência declarada, não efeito colateral livre:** normalizar
contraste significa que uma arte desenhada escura passa a ler como uma clara. Medir
quanto tom a peça tem é fácil; decidir se ela ficou boa é o olho do Doug, na folha.

O pedido ao gerador continua falando de **valor**, nunca de cor — mas o alvo deixou
de ser uma faixa (`lum 100–130`) e passou a ser **amplitude**: peça com variação de
luz lê melhor que peça chapada, porque é a variação que a máscara carrega.

### O que o compositor exige da peça, e já custou um defeito

Toda forma vinda do potrace precisa sair com `fill-rule="evenodd"`. O potrace
declara a regra na tag que a esteira descarta, e sem ela o SVG cai em `nonzero`, que
**preenche os buracos** — numa barba que cerca a boca (bigode em ferradura mais
queixo) o sorriso é um buraco no laço, e some inteiro. Medido em 2026-08-20:
`bigode-ferradura`, `rala` e `cheia-com-bigode` apagavam **100%** do traço da boca.
Consertado em `compositor.ts`, gateado por `pecas-de-elenco.test.ts` ("o buraco da
peça sobrevive"). O defeito ficou latente até existir um bigode: num laço sem buraco
`evenodd` e `nonzero` desenham igual.

### As amarras que só existem aqui

1. **a barba recolore com o CABELO** (D17), então cor não diferencia nada: num mesmo
   aluno todas as barbas saem do mesmo tom, e **só a silhueta separa uma da outra**;
2. **a peça vive na geometria declarada, não em `.svg` avulso.** É a bifurcação da
   Regra Inviolável nº 4: quem tem cor assada vira arquivo pela rota do traje; quem
   recolore fica em formas com token de cor;
3. **`cabeloPorCima: true`** — a barba nasce da cabeça e veste **sob** o cabelo. Custo
   declarado e medido (G33): o `chanel` come 22,4% da silhueta da barba. Já foi
   reaberto duas vezes e as quatro saídas estão medidas no ESTADO-DA-ROTA;
4. **as cápsulas dos olhos e a linha da boca levam 0 px de tinta** — e desde
   2026-08-20 as duas regiões são a **forma da feição**, não uma caixa em volta
   (a caixa da boca protegia 80% de ar; a dos olhos, 41%);
5. ~~**a franja da borda nunca é miolo**~~ — **revogada em 2026-08-20, junto com a
   partição.** Ela existia porque o anel externo da peça é antialias entre o preto do
   contorno (lum 18) e a pele (lum 183), a mistura lê lum ≈ 100, e o corte binário a
   declarava MIOLO — a cor terminava pintada em cima do traço (*"a cor está fugindo
   do traço"*, o Doug, olhando a `cheia`). Com o tom contínuo não há corte: aquele
   anel é simplesmente um cinza intermediário, que é o que ele sempre foi. O passo 3b
   e o gate `franja-da-borda.test.ts` foram apagados — um gate de um caminho que
   deixou de existir passa por vacuidade e mente sobre o que protege;
6. **o `tom` guarda o CAMINHO do PNG, não os bytes** — e isto saiu de medição, não
   de gosto. A primeira versão embutia base64, e 30 bonecos com a `trancada-v4`
   fechavam em **753,0 KB** de gzip contra **17,6 KB** com o arquivo externo: o
   boneco composto passava da janela de 32.768 B do DEFLATE e a dedução do blob
   morria. Com o arquivo, o boneco caiu de 31.857 para **22.913 B** — a folga dentro
   da janela foi de 911 para **9.855 bytes**, que é o que impede um chapéu somado à
   barba de cruzá-la. O arquivo **precisa ser rastreado pelo git**
   (`arteDaPecaNoDeploy.test.ts`), e `arte:rostos --check` compara o PNG do disco
   byte a byte. Gate do conteúdo: `scripts/avatar/arte/__tests__/tom-da-peca.test.ts`,
   que prende os dois `d` idênticos, a proporção do PNG contra a caixa e o esticão
   tendo agido;
7. **o id da máscara leva `ns` e slot** (`${ns}-tom-${slot}`). O ranking põe 30
   bonecos num `<svg>` só e um mesmo boneco pode ter tom no rosto E no chapéu — id
   repetido faz a segunda máscara vestir o desenho da primeira, em silêncio. Gates:
   `pecas-de-elenco.test.ts` e `folha-unica.test.ts`.

## 14. A conferência antes do parecer — o Claude olha primeiro

*Decidida pelo Doug em 2026-08-20. Vale para as **três** esteiras: passo 11b do
cabelo (§2), passo 8 do traje (§12), passo 8b do rosto (§13).*

**A folha não vai ao Doug sem passar pelo olho do Claude.** Até aqui ela ia: a
esteira terminava na folha e o parecer humano era o primeiro filtro visual que
existia. Isso fazia o Doug gastar rodada de gerador com peça que tinha defeito
**objetivo** — descritível, mensurável, consertável sem redesenhar nada.

### O teto: 2 minutos, e ele é vinculante

O Doug fixou **2 minutos** para esta conferência. Não é meta, é teto: se estourar,
**a parte de imagem cai fora** e o passo fica só com as réguas de script. Uma
conferência que custa 10 minutos por peça é mais cara que o defeito que ela pega.

⚠️ **O teto ainda não foi medido.** O número que existe é de outra coisa: leitura
por subagente de PNG grande com tarefa aberta custou **8 a 12 minutos**. Esta
conferência é o oposto — imagem pequena, pergunta fechada, sem exploração —, mas
isso é hipótese até a primeira peça cronometrar. **Quem rodar primeiro anota o
tempo no ESTADO-DA-ROTA.** Estourou 2 min duas vezes seguidas: corta a leitura,
mantém as réguas, e registra aqui.

### A ordem: barato antes de caro

| # | o quê | custo | quando para |
|---|---|---|---|
| 1 | **as réguas que já existem** — `arte:revisao` (6 controles), `arte:reguas` (21 asserções), `arte:espessura` | segundos | reprovou → conserta **sem abrir imagem nenhuma** |
| 2 | **uma leitura, por subagente** — a folha a 56 px contra o PNG que foi ao gerador | o teto de 2 min | achou defeito → §14.3 |

O passo 1 sozinho já pega boa parte, e é grátis. **Só se manda ler imagem depois
que ele passa** — o que sobrou aí é genuinamente visual.

### As cinco perguntas — fechadas, e são só estas

O subagente recebe a folha **no tamanho do jogo** (56 px por peça, poucos KB, os 4
fundos) e o PNG que foi ao gerador, e responde sim/não:

1. A peça tem as **mesmas partes** que o PNG? Sumiu alguma?
2. A **cor** bate?
3. O **contorno** é contínuo — sem buraco, sem fio solto?
4. Alguma parte do boneco **que não devia mudar** mudou?
5. A peça **cobre** algo que devia aparecer? (boca, olho — o defeito de 2026-08-20)

**Pergunta aberta é proibida aqui.** "O que você acha da peça" custa o mesmo e
devolve opinião que não é do subagente para dar — e nem minha. A régua *lê bem a
56 px, é bonita, serve ao elenco* é do Doug, e continua sendo.

### O que eu conserto, e o que sobe com o defeito nomeado

| o achado | o que fazer |
|---|---|
| tem régua por trás — tira de pele, dois tons onde devia haver um, buraco preenchido | **conserto pela quarta saída** (§8: restaurar o que a base tem, ou trocar cor que um número separa), refaço a folha, e **só então** chamo o Doug |
| é forma nova, ou é "está feio" | **não tento consertar.** Sobe ao Doug com o problema apontado — redesenhar é dele |

A fronteira é a mesma da §8 e não se move: **desenhar por programa é o que a rota
inteira existe para evitar.**

### A amarra que faz o custo cair: reprovação do Doug vira régua

**Toda vez que o Doug reprovar uma peça, o defeito vira asserção em `arte:reguas`
antes de a próxima arte entrar na esteira.** É esta linha que paga a seção: um
defeito que hoje custa 2 minutos de leitura passa a custar segundos de script, e
para sempre.

O caso que a fundou: a barba com bigode **apagava 100% do traço da boca** e nenhum
gate reprovou (§13). Se aquilo tivesse virado régua na hora, as duas artes
seguintes teriam pego de graça. Régua nova entra com **controle negativo** ao
lado, como todas — §5.

**Esta amarra vale mesmo se a leitura cair fora por custo.** Ela é a parte que não
depende de imagem.

## 11. As imagens vão por subagente

Folha de revisão, folha de escolha e closes são PNG grande. Quem lê o arquivo é o
subagente; o thread principal recebe a **descrição medida em texto**. É regra do
`~/.claude/CLAUDE.md` e ela já pagou nesta rota: a leitura por subagente do close
da coroa contradisse a régua da barra e estava certa — a régua é que agregava um
perfil não concêntrico.

**Número em imagem não serve.** Todo número da folha sai no terminal, onde é
copiável e buscável.
