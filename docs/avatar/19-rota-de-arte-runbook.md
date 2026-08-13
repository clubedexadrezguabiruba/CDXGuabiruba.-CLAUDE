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
| 12 | **parecer do Doug** | `/dev/avatar-kokeshi` no navegador | aprovado ou não. **É a única aprovação que existe** |
| 13 | **promoção** | ver §7 | a peça entra em `CABELOS` |

Réguas de diagnóstico, fora da esteira, para quando algo não fecha:
`arte:silhueta` (a sonda da pele exposta), `arte:coroa` (o preto na calota),
`arte:escala` (os 92% e o hash da base), `arte:reguas` (as 15 asserções com
controle), `arte:cor-proibida` (nenhuma cor da base cai na janela do ciano).

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

## 11. As imagens vão por subagente

Folha de revisão, folha de escolha e closes são PNG grande. Quem lê o arquivo é o
subagente; o thread principal recebe a **descrição medida em texto**. É regra do
`~/.claude/CLAUDE.md` e ela já pagou nesta rota: a leitura por subagente do close
da coroa contradisse a régua da barra e estava certa — a régua é que agregava um
perfil não concêntrico.

**Número em imagem não serve.** Todo número da folha sai no terminal, onde é
copiável e buscável.
