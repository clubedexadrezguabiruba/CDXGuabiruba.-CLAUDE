# 24 — Cabelo e barba: a **ficha medida** da família que recolore

> **ISTO NÃO É UMA LEI NOVA.**
>
> A lei de arte de peça é o [doc 23](23-linha-de-arte.md), e ele vence este arquivo
> em tudo que for *como uma peça tem de ser desenhada*. Este documento é a **ficha do
> slot** que o próprio doc 23 pede duas vezes e não tinha como preencher:
>
> - §2.2 — *"o número é próprio do slot e ainda não está medido — sai da primeira peça"*;
> - §4.1 — *"cada slot tem direito ao seu, e o dia de medir é o da primeira peça dele"*.
>
> A primeira peça existe desde 2026-08-21. Isto é o que ela mede.

Criado em 2026-08-22.

---

## 0. Por que ele existe, e o que ele conserta

Em 2026-08-21 e 22 três artes de barba entraram na rota. **Todas as três obedeciam
tudo que estava escrito** — o traço em 12 u preto puro, o tom por amplitude, um
componente contínuo, o acabamento no nível da peça-padrão. Duas foram reprovadas
assim mesmo:

| | massa | largura ÷ cabeça | por que reprovou |
|---|---|---|---|
| `trancada` (a promovida) | 54 264 px | **0,89** | — |
| v7 | 100 121 px | **1,07** | cobre 16,1% do tronco; a arte do traje some por baixo dela |
| v8 | 96 530 px | 1,02 | **cobre a linha da boca** — 87,6% da caixa da boca, medido na arte nativa |

O que faltava não era lei de desenho: era **limite espacial**. Nenhum documento dizia
até onde a barba desce, quanto do tronco ela pode cobrir, ou que massa se espera —
então o gerador acertava a lei e errava a peça, e o defeito só aparecia depois de
gerar. As amarras que existiam eram todas de **reprovação**, nunca de **pedido**.

⚠️ **Um limite herdado sem medir é pior que nenhum** (doc 23 §2.2). Todo número
abaixo sai de peça que passou pela rota, e a coluna *medido em* diz de qual.

---

## 1. Cabelo e barba são a MESMA família, e isso não é arrumação

**A barba recolore junto com o cabelo** — `var(--av-cabelo)`, decisão **D17**, porque
barba é cabelo. É a única exceção aparente à Regra Inviolável nº 4 do `CLAUDE.md`, e
ela não é exceção: as duas cores que o aluno escolhe continuam sendo duas.

As duas famílias saem em `formas[]` com token de cor **mais** uma máscara de
luminosidade servida à parte, e não em `<image>` de cor assada. É a bifurcação da
Regra nº 4 lida do lado da esteira (doc 23 §4.4).

**A consequência manda no desenho, e é dura:** num mesmo aluno o cabelo e a barba
saem **do mesmo tom**. Cor não diferencia nada — nem uma barba de outra, nem a barba
do cabelo que encosta nela. **Só a silhueta separa.**

Daí as duas regras que atravessam este documento inteiro:

1. **a assinatura de cada peça é a borda**, não o miolo. O que distingue é o
   contorno de baixo, a largura e a altura — nunca a cor nem o brilho;
2. **cabelo e barba se encontram**, e o encontro tem dono: `cabeloPorCima: true`, a
   barba veste **sob** o cabelo. O custo está medido no achado **G33** — o `chanel`
   come 22,4% da silhueta da barba. Barba desenhada para ser vista inteira some
   embaixo de cabelo comprido, e isso não é defeito da barba.

---

## 2. A anatomia de referência — os marcos em `u`

Tudo abaixo é citado destes. Eles saem de `geometria.ts` e de
[`base.ts`](../../scripts/avatar/arte/base.ts), não de leitura de imagem.

| marco | `u` |
|---|---|
| `viewBox` | 500 × 700 · centro em **x 250** |
| cabeça | x **75,2 → 439,2** · y **45,5 → 347,2** (364 × 301,7) |
| olho | cy **232** · altura 83 → y **190,5 → 273,5** · separação 155 |
| **boca** | y **296,2 → 301,5** · largura 37 |
| **queixo** | y **353,2** |
| **fim do tronco** | y **603** |
| região `ROSTO` (protegida) | x 187,5 → 392,5 · y 184,5 → 307,45 |

**1 px a 56 px vale 11 u.** Nada menor que isso existe no produto; para **ler** como
forma são precisos ~33 u (doc 23 §6 e `PEDIDO-BARBAS.md`).

---

## 3. O envelope da BARBA

Medido na `rosto-barba-trancada`, a peça promovida — p1/p99 da massa, não a caixa
crua (a caixa crua é puxada por dezenas de pixels soltos e mente).

| | a peça aprovada | **o limite** | por quê |
|---|---|---|---|
| massa | **54 264 px** | **≤ ~70 000 px** | o dobro já é outra peça: a v7 tinha 100 mil e engoliu o tronco |
| largura | 325 u — **0,89 da cabeça** | **≤ 1,00 da cabeça** (364 u) | barba mais larga que o crânio lê como cabeça peluda, não como barba (é a mesma razão do G33) |
| topo | y **270** — a base do olho | **≥ y 270**, e **nunca** dentro da região `ROSTO` protegida | acima disso ela encosta no olho |
| **a boca** | **0 px de tinta** | **0 px**, sem tolerância | linha da boca coberta = a peça reprova na esteira, não no gate |
| piso | y **530** | **≤ y 545** — deixa **≥ 58 u** até o fim do tronco (603) | ver §3.1 |
| cobertura do tronco | **8,93%** | **≤ 12%** | ver §3.1 |
| desce do queixo | **176,8 u** | — | é o que faz dela a lendária: o comprimento é a assinatura |

### 3.1 Por que existe teto de tronco, e ele não é estético

**A peça de rosto é pintada POR CIMA da arte do traje.** A ordem está declarada em
[`camadas.ts`](../../src/lib/avatar/estilo/camadas.ts): `traje-arte` é a camada 238,
`rosto-sob-cabelo` a 346 e `rosto-sobre-cabelo` a 364.

Então cada ponto percentual de tronco que a barba cobre é traje que **some**. E a
conta de catálogo é assimétrica: o slot `traje` tem **30 peças**, o slot `rosto` tem
**12** (doc 22 §5-B). Uma lendária de barba que esconde a túnica gasta o slot grande
para engordar o pequeno.

Os 12% saem daí: a aprovada mede 8,93%, e o teto dá folga de uma peça mais volumosa
sem chegar aos 16,1% da v7, em que a túnica deixa de ser vista.

### 3.2 O contorno de baixo — a metade que o gerador larga

Achado de 2026-08-20, e continua valendo: o gerador pinta o contorno nas laterais e
no topo e **deixa a barba morrer sem preto na borda de baixo**, onde ela encosta no
pescoço e na túnica. Medido, a correlação é limpa: a única barba com 12 px de banda
preta embaixo foi a única que não vazou cor no render.

**Piso: 8 px de canvas** (o contorno do boneco tem 12 u = 14,4 px). Régua:
`npx tsx .scratch/estilo/de-quem-e-a-borda.ts`.

O parágrafo que resolve isso no pedido está em `PEDIDO-BARBAS.md` e é **instrução de
forma, não de cor** — foi essa a lição: escrita como cor, o gerador a ignorava.

---

## 4. O envelope do CABELO

Medido nas três artes de cabelo do repositório, pelo mesmo método. **Elas ainda não
são uma peça-padrão** — o slot tem três artes e nenhuma foi eleita —, então o que
está aqui é a **faixa observada**, não teto aprovado.

| arte | massa | largura (u) | y p1 → p99 | o que ela é |
|---|---|---|---|---|
| `chanel` | 145 438 px | 449 | **8 → 387** | bob curto: desce 34 u abaixo do queixo |
| `espetado` (`entrada`) | 113 764 px | 436 | **−28 → 239** | espetado: sobe 28 u **acima do `viewBox`** e não passa do olho |
| `entrada-2` | 196 305 px | 456 | 7 → 596 | comprido: quase o fim do tronco |

O que a faixa já ensina, e vale como limite até a primeira peça-padrão do slot:

- **o cabelo é 2 a 4× a massa da barba.** 113–196 mil px contra 54 mil. Cabelo que
  chega com massa de barba está ralo;
- **ele pode passar do topo do `viewBox`** (y negativo) e isso é de propósito: a base
  de edição tem 92 px de folga acima justamente para a ponta **chegar medida** e a
  folha poder mostrar que ela não cabe. O `viewBox` guilhotina em y = 0 no produto;
- **ele nunca é mais estreito que ~430 u** — o crânio tem 364 e o cabelo o veste por
  fora;
- **quem desce, desce muito** (596 u) ou **quase nada** (239 u). Não há meio-termo no
  elenco atual, e isso é o elenco, não uma lei.

⚠️ **O que o cabelo não pode**, e é do compositor, não de gosto (doc 23 §7.1): nada
de capuz, capa, gola por trás, nem cabelo passando **por cima do ombro**. O que fica
atrás da cabeça precisa ser `extensao` em vetor com `atras: true`, e **a esteira de
traçado disso não existe**. Pedir arte assim é pedir o que o programa não monta.

---

## 5. A DIREÇÃO DE ARTE — o acabamento em palavras, para não depender de imagem

**A referência é a `trancada`**, e esta seção é ela descrita em número. O objetivo é
poder pedir qualquer cabelo ou barba **sem anexar imagem de acabamento**: a 3ª imagem
do fluxo (doc 19) passa a ser opcional, e o que ela carregava vira texto.

Todo número abaixo foi medido em 2026-08-22 na arte castanha original
(`trancada-v4-bruta.png`), com o `chanel` ao lado como **contraexemplo**.

### 5.1 A estrutura tonal — e é ela que separa o padrão novo do velho

| faixa de luminância | o que é | **`trancada`** | `chanel` |
|---|---|---|---|
| **< 60** | traço: contorno externo **+** as linhas internas | **20,8%** | 21,9% |
| **60 – 120** | **a meia-luz modulada** — o corpo da peça | **75,4%** | **9,3%** |
| **≥ 120** | luz alta | **3,8%** | **68,7%** |
| | tons distintos | 251 | 228 |

**Lidas juntas, as duas colunas são a direção inteira:**

- **um quinto da peça é linha preta.** Os dois concordam nisso (20,8% e 21,9%), e é o
  único número que já era constante da família antes de alguém medir;
- **três quartos da peça são meia-luz que varia** — é aqui que mora o acabamento. A
  luz corre por dentro da forma, no sentido dos fios;
- **a luz alta é pontual, não é preenchimento**: 3,8%. No `chanel` ela é 68,7% e a
  meia-luz desaparece — isso é peça de **dois valores**, linha mais recheio chapado.
  É o estilo que a esteira de tom contínuo substituiu em 2026-08-20, e o pedido
  precisa dizer que não o quer;
- **~250 tons distintos.** Não são 3, não são 5. O alvo é amplitude contínua.

### 5.2 As sombras

**Não existe sombra projetada** — nem da peça sobre o boneco, nem do boneco sobre a
peça, nem no chão. O volume sai inteiro da modulação interna da §5.1: o escuro é o
**vale entre os fios**, não uma sombra desenhada por baixo da peça.

E **não existe brilho especular** — nada de mancha branca de reflexo. A luz alta dos
3,8% é a crista do fio, não um brilho colado por cima.

⚠️ **"Sem sombra" abstrato não segura o gerador — medido no mesmo dia em que esta
seção nasceu.** A primeira arte pedida com este bloco voltou com sombra da barba
pintada sobre a túnica: **3 433 px**, 96% mais escuros que a base, delta médio de luz
**−73,7**, saturação 17 (cinza). Ela reprovou o Gate −1 em **15 ladrilhos** com causa
*"a FORMA mudou"* — e o traço estava impecável, 0 px apagado e 0 px de cinza.

Para referência, a peça aprovada tem o mesmo fenômeno em escala 3× menor (1 080 px,
−48,3): **um pouco disso é o antialias da própria borda e é inevitável.** O que
reprova é a sombra desenhada de propósito.

Por isso a §5.6 diz **"não escureça a roupa em volta da peça"** com todas as letras,
e não só *"sem sombra"*: instrução concreta e nomeada vence instrução de princípio —
é a mesma lição da cláusula do contorno de baixo, que só passou a funcionar quando
deixou de ser instrução de cor e virou instrução de forma.

### 5.3 O traço

| | |
|---|---|
| **contorno externo** | a **mesma espessura** do contorno do boneco — 12 u, e o boneco está na própria imagem para comparar. **Preto puro `#000000`**, nunca cinza escuro |
| **onde ele vai** | dá a **volta completa** na peça, sem afinar em ponto nenhum — inclusive na **borda de baixo**, onde a peça encosta na roupa, no pescoço ou no fundo. É a borda que o gerador larga, medido |
| **linhas internas** | mesma cor preta, **mais finas** que o contorno. Elas **dividem sem cortar**: separam mecha de mecha e a peça continua sendo **um componente contínuo** |
| **piso do legível** | 8 u de espessura. Abaixo disso não é desenho, é serrilha |
| **menor detalhe** | ≥ 11 u para existir, ≥ 33 u para **ler** — ou seja, nada menor que ~1/33 da largura da cabeça |

### 5.4 A unidade — o que faz a peça não ser uma mancha

A peça é feita de **unidades contadas** — fios, mechas, tranças, anéis —, nunca de
massa lisa. Duas consequências que se pedem com todas as letras:

1. **a borda é serrilhada pela unidade.** Ela não é curva lisa de vetor nem reta de
   régua: o contorno acompanha o fim de cada fio;
2. **quantas unidades depende da raridade**, e a escada é do doc 23 §5 — `common` é
   uma forma sem sub-estrutura, `legendary` é feita de unidades contadas com luz
   correndo por dentro.

### 5.5 A cor

**Irrelevante, e isto é liberdade, não descuido.** A peça recolore com a escolha do
aluno (`var(--av-cabelo)`), então a arte pode voltar em qualquer matiz — o que a
esteira aproveita é a **luminância**. Entregue na cor que sair, contanto que ela
tenha a amplitude da §5.1.

⚠️ **Não peça ciano.** Ele é a língua interna da esteira e quem o cria é
`restaurar-peca.ts`; pedi-lo ao gerador é uma das quatro coisas que a Regra
Inviolável nº 4 proíbe por nome.

### 5.6 O bloco para colar no pedido

Este é o texto que vai ao gerador — o resto deste documento é o porquê dele:

> **O acabamento.** A peça é feita de **fios (ou mechas) contados**, não de massa
> lisa. Cerca de **um quinto** dela é linha preta — o contorno externo mais as
> linhas finas que separam as mechas por dentro. **Todo o resto é meia-luz que
> varia**: a luz corre por dentro da forma, no sentido dos fios, em muitos tons
> contínuos. **Não pinte a peça com uma cor chapada e não use degradê liso de
> aerógrafo.** O brilho é pontual, na crista dos fios — **sem mancha de reflexo**.
>
> **Sem sombra. NÃO ESCUREÇA A ROUPA NEM A PELE EM VOLTA DA PEÇA.** Não desenhe
> sombra da peça sobre o boneco, nem do boneco sobre a peça, nem sombra no chão. A
> roupa encostada na peça fica **exatamente com a cor que já tem**. O volume vem da
> própria luz interna da peça.
>
> **O contorno.** A peça é contornada por uma linha preta **da mesma espessura da
> linha que contorna o corpo do boneco** — compare com ela na imagem e iguale.
> **Preto puro, não cinza escuro.** A linha **dá a volta completa** e não afina em
> lugar nenhum, **inclusive embaixo**, onde a peça encosta na roupa, no pescoço ou
> no fundo. A peça nunca termina com a cor dela encostando direto em outra coisa.
>
> **A borda é serrilhada** pelo fim de cada fio — não é curva lisa nem reta.
>
> **A cor não importa** — desenhe na cor que preferir, contanto que ela tenha muitos
> tons de claro e escuro por dentro.

Mais **onde a peça cabe**, que é o único parágrafo que muda entre barba e cabelo:

> **Onde a barba pode existir.** Ela começa **na altura da base dos olhos** e desce
> até **um pouco acima do fim do corpo**, deixando roupa visível embaixo. Ela **não é
> mais larga que a cabeça**. Ela **não cobre a boca** — a linha da boca fica inteira
> e visível. Ela não toca os olhos.

> **Onde o cabelo pode existir.** Ele veste o crânio por fora e pode passar do topo
> da imagem. Ele **não passa por cima do ombro** nem por trás da cabeça, e não vira
> capuz, capa nem gola.

**Não alongue o pedido além disto.** Medido nas rodadas 4 e 5 da rota: instrução
específica vence instrução genérica, e **gerador em dúvida passa zero** — foi assim
que *"na dúvida, passe menos"* produziu transbordo zero num pedido de traje.

---

## 6. O que reprova, e com que régua

Em ordem de custo — o mais barato primeiro, e cada um sem abrir imagem nenhuma:

| # | o que | régua | reprovou? |
|---|---|---|---|
| 0 | a lona não é 1024 × 1024 | `ls` | não começa. Reamostrar **não** salva: medido em 2026-08-21, a arte já aprovada dando a volta por 1254 reprova em 6 ladrilhos |
| 1 | o boneco se mexeu | `npm run arte:gate` | teto **1 ladrilho** de 16 px |
| 2 | o traço do boneco sumiu | `npm run arte:traco` | apagamento em corrida |
| 3 | o traço foi repintado em cinza | `npm run arte:borda` | lum 40 a 180, piso 8 px por componente |
| 4 | a peça cobre boca ou olho | a esteira (`construirRosto`) | **aresta nua** — a peça sai aberta no render |
| 5 | peça chapada | a esteira | `hi <= lo` no esticão p2/p98 |
| 6 | o envelope da §3 / §4 | **este documento** | é o olho do Doug, com o número ao lado |
| 7 | o contorno de baixo | `de-quem-e-a-borda.ts` | banda < 8 px |

**Nenhuma delas aprova.** A folha de contato no olho do Doug é a única aprovação que
existe (doc 23 §6) — e nas três vezes em que ele e um piso discordaram, o piso é que
estava errado.

---

## 7. Quem vence, e o que este doc não revoga

**Ele NÃO revoga:**

- o `CLAUDE.md`, que está acima de tudo — em especial a Regra Inviolável nº 4;
- **o doc 23**, que é a lei de arte de peça. Onde este divergir dele em matéria de
  *como desenhar*, o 23 vence. Aqui está **onde cabe**, lá está **como é**;
- o doc 19, que é a esteira comando a comando (§13 rosto, §2 cabelo);
- o doc 22, que é o menu — as 8 barbas e o que cada uma tem de textura repetida.

**O que é dele, e de mais ninguém:** os números da §2, §3 e §4, e a quadra da §5.

⚠️ **Esta cláusula é o que impede este arquivo de virar o 15º documento superado.**
Quando a primeira peça-padrão de **cabelo** for eleita, a §4 deixa de ser faixa
observada e vira teto — e é aqui que ela é reescrita, não num doc 25.
