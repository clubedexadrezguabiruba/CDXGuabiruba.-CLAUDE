# O que uma forma LÊ COMO

Este é o arquivo mais valioso das duas skills, e é o único que só cresce olhando.

Cada entrada tem três partes: **o caso** que ensinou, **a causa** medida, e **a regra
generalizável** que sobrou. Ao terminar uma peça, se um defeito foi nomeado e
corrigido, a correção volta para cá — senão a próxima peça o repete.

---

## Forma ocluída lê pelo que SOBRA visível

**O caso.** O coque era uma elipse de 124 × 104 presa atrás da cabeça. Com o crânio
opaco comendo a metade de baixo, o que restava na tela era uma **laje de topo reto**.
Leu como boina, não como coque.

**A causa.** Ninguém desenhou uma laje. A laje é o que sobra de um ovo deitado depois
do corte — e o corte é horizontal, então o que aparece é a fatia mais larga e mais
chata da forma.

**A regra.** Ao desenhar peça parcialmente coberta, **desenhe a parte que aparece**,
não a peça inteira. Pergunte: *qual é a interseção da minha forma com a região
visível, e ela sozinha lê como o quê?*

**O conserto que generaliza:** uma **circunferência** — calota de círculo é redonda em
qualquer altura em que ela seja cortada. Formas cuja seção não depende de onde você
corta são as seguras para peça ocluída.

---

## Faixa estreita em cabeça grande lê como antena

**O caso.** O moicano era uma faixa de `t` constante subindo pelo meio do crânio. Leu
como **pluma de capacete**, e depois de encurtado, como chaminé.

**A causa, e ela não é de gosto.** `t` é fração da largura da cabeça *naquela altura*,
e essa largura despenca perto da coroa: **206 unidades em y 54 contra 362 em y 126**.
Uma faixa de `t` constante é, em pixel, um **funil que abre para baixo**. E funil é a
forma de uma pluma.

**A regra.** Parâmetro relativo é certo para curva que **atravessa** a referência
(uma franja de orelha a orelha) e errado para peça **estreita** perto de onde a
referência varia rápido. Em caso de dúvida, escreva a coordenada absoluta e meça a
largura em pixel nas duas pontas.

**Segunda regra, de proporção:** numa cabeça de 364 unidades de largura, uma peça de
72 vira **dois pixels a 56 px**. O que faz uma peça ser reconhecida naquele tamanho é
ela ser **larga**, não ser detalhada.

---

## Contorno liso lê como mancha — mas ziguezague lê como ONDA, não como trança

**O caso.** A trança era um contorno suave e afilado caindo do lado da cabeça. Leu
como borrão escuro colado na bochecha. Trocada por oito pontos alternando de lado,
passou a ler como **mecha ao vento** — melhor, e ainda errado.

**A causa, e ela corrige a versão anterior desta entrada.** Transferir textura para a
silhueta é certo, mas *qual* oscilação importa:

> **Numa onda, o EIXO se move. Numa trança, a LARGURA pulsa em torno de um eixo
> reto.**

Os oito pontos alternados moviam o eixo — daí a mecha. Uma trança é um ritmo de
segmentos idênticos: ela engorda e afina **dos dois lados ao mesmo tempo**, enquanto
o eixo apenas afina, sem nunca serpentear.

**A regra.** Antes de alternar pontos, pergunte se a peça é uma coisa que *ondula*
(mecha, fita, cauda) ou que *se repete em segmentos* (trança, corrente, vértebra,
crina). As duas se desenham de formas opostas.

Vale para o resto do elenco: cauda de pet ondula; corrente e trança segmentam.

---

## O pulso precisa de 24 unidades para existir na miniatura

**O caso.** A primeira trança "enfeixada" tinha seis nós com 14 unidades de amplitude
de meia-largura. Leu como **borda serrilhada** da cabeça, não como peça.

**A causa.** 14 unidades são **1,1 px a 56 px** — abaixo do limiar da tabela de escala
acima. O olho vê um contorno grosso e irregular, não segmentos.

**A regra.** **Menos segmentos e maiores leem; mais segmentos e menores viram
textura, e textura some.** Quatro nós com amplitude 26 leem onde seis com 14 não
leem — e custam menos bytes.

Toda característica que se repete tem esse teto de resolução. Se o número de
repetições que você quer não cabe com amplitude ≥ 24, o que cabe é menos repetições.

---

## Massa lateral na altura dos olhos lê como ORELHA

**O caso.** As "chiquinhas" nasciam em y 204–210, uma de cada lado. Leram como duas
orelhas grandes.

**A causa, e ela é de catálogo, não de desenho.** A base **perdeu as orelhas no Bloco
1d de propósito** — orelha na base obriga cada um dos 92 itens de chapéu e cabelo a
decidir se cobre ou não. Uma peça que lê como orelha desfaz a decisão que custou uma
base inteira.

**A regra.** Massa colada à lateral do crânio **na faixa de altura dos olhos** lê como
orelha, qualquer que seja a forma dela. Peça lateral tem de nascer **abaixo da linha
da boca** e pendurar, ou ficar acima da linha da sobrancelha.

---

## Faixa sobre tinta da mesma cor: quem lê é a fronteira, e ela não pode ser reta

**O caso.** A coroa era uma faixa trançada por cima da touca, com o bordo de cima
pulsando e o de baixo liso. Leu como **aba de chapéu**.

**A causa.** Faixa e touca são a mesma cor (`--av-cabelo`). A única coisa que separa
as duas na tela é a **linha entre elas** — e essa linha era o bordo de baixo, que
saiu reto. Reto e contínuo é a assinatura de aba, não de trançado.

**A regra.** Ao pôr peça sobre tinta da mesma cor, identifique **qual bordo é a
fronteira visível** e ponha o detalhe nele. Detalhe no bordo que ninguém vê é byte
gasto: aqui o pulso estava no lado errado, e mover para o outro custou zero forma.

---

## Simetria sobre base assimétrica briga consigo mesma

**O caso.** A primeira tabela do `curto` era simétrica em `t`, e a folga sobre as
sobrancelhas saiu **25,5 à esquerda e 8,3 à direita**.

**A causa.** O `GIRO`: a sobrancelha direita fica 3 unidades mais alta, e o par de
olhos anda 33 para a direita do eixo da cabeça. Simetria em `t` não é simetria em
folga.

**A regra.** Toda peça que encoste no rosto precisa da régua **nos dois lados**. E a
assimetria da peça, quando houver, tem de **concordar** com o giro — as duas facetas
do rosto inclinam para o mesmo lado porque é a cabeça que está virada, não o par que
está franzido.

---

## Escala de leitura: o que existe e o que some a 56 px

O `viewBox` de 700 unidades a 56 px dá **12,5 unidades por pixel**. Régua para
decidir se vale desenhar:

| medida em unidades | a 56 px | lê? |
|---|---|---|
| 6 | 0,5 px | não |
| 12 (o traço) | 1,0 px | mal |
| 24 | 1,9 px | sim, como fio |
| 50 | 4 px | sim, como forma |
| 100+ | 8 px | sim, como massa |

**Duas peças pretas separadas por menos de 24 unidades encostam por antialiasing.** É
de onde sai `FOLGA_ROSTO`.

---

## Volume acima da coroa lê como LAJE, porque o canvas acaba a 39 unidades

Medido em 2026-08-03: a figura base ocupa de `y = 39` a `y = 655` num `viewBox` de
700, e o topo do crânio está em 45,5. **Sobram 39 unidades acima da cabeça — 3,1 px
no tamanho do ranking.** Quem desenha volume para cima está desenhando num espaço
que quase não existe.

O que acontece quando se ignora isso não é um erro: é uma **barra reta**. A primeira
rodada das três variantes do `curto` saiu com a primeira linha de tinta em `y = 0`
medindo **314, 324 e 341 px** de largura — 63 a 68% do quadro — e a leitura foi
unânime: *laje*, *topo de boné*, *cogumelo*. Os três tufos que davam nome à
"Espetada" tinham os vales acima do corte, e não foram encurtados: foram **fundidos
numa barra só**.

E não é defeito de peça nova. O **`moicano` do catálogo** sai com 147 px de largura
CONSTANTE nas seis primeiras linhas do raster — a crista (`y` −34, −76, −60) é
guilhotinada desde o 2a.1 — e o **`coque`** perde 34 unidades da calota do mesmo
jeito. Nenhum gate viu, porque nenhum gate olha o topo.

**A correção é comprimir, não cortar.** Cortar em `y = 8` achata os picos contra a
mesma reta, que é o defeito de origem com outro nome. Comprimir a saliência **em
torno da linha da coroa** — `y' = y0 − (y0 − y)·k`, e só onde `y < y0`, para não
encolher a massa lateral junto — preserva a razão entre pico e vale: três tufos
continuam três tufos, mais baixos.

Medido nas mesmas três, antes e depois: a distinção a 56 px **subiu** de 5,04–5,98%
para 6,70–7,41%. Contraintuitivo e tem causa: a barra guilhotinada era **idêntica
nas três**, então ela não separava — ela igualava. Tirar volume aumentou distinção.

**Onde há espaço é para os LADOS**: 68 unidades de margem de cada lado contra 39 em
cima. Volume lateral cabe; volume vertical quase não.

---

## Extensão só ancora onde a cabeça COBRE, e o teste é no destino

Uma extensão é empurrada para dentro do crânio para não ler como adesivo colado ao
lado (`ancoragemDasExtensoes`, piso `SANGRIA`). Três coisas que custaram rodada:

**Empurre um lado só.** A primeira versão empurrava todo ponto que caísse fora da
silhueta — e como o lóbulo inteiro é, por construção, feito de pontos fora da
silhueta, os dois lados iam para o mesmo lugar. Um lóbulo de têmpora medido de
`esq−40` a `esq` viraria uma tira em `esq+25`: o volume colapsa, sem erro e com a
ancoragem passando verde. O sentido se decide **uma vez por lóbulo**, pela posição
da massa.

**Ancore a partir da borda mais funda, não da medida.** Onde a arte já cobre a
cabeça, o empurrão sai da arte; onde ela para antes, sai do crânio —
`max(medido, borda) + ANCORA`. Sem isso a Domada deixava a borda de baixo da coroa
**24 unidades acima da cabeça**: uma faixa de fundo atravessando a coroa inteira,
com a ancoragem passando (19,8 contra piso de 10, medida em outro trecho do mesmo
laço). `ancoragemDasExtensoes` pergunta *"a peça entra na cabeça?"*, não *"a peça
encosta na cabeça em todo o percurso?"*.

**Pergunte se o destino é coberto, não se a coluna tem crânio.** A cabeça é redonda:
uma coluna que a cruza no meio da altura não a cruza embaixo. Empurrar para onde não
há cabeça atrás estica a silhueta visível e pendura um esporão no vazio.

---

## Ponta de laço fechada em esquadro lê como ABA

Cabelo não termina em canto reto. Quando os dois lados de um laço são amostrados nas
**mesmas** posições ao longo do eixo, a ponta fecha com um segmento perpendicular — e
se um dos lados foi empurrado para ancorar, esse segmento vira uma parede: medidas
25,8 unidades na Domada, que a 425 px é uma quina cega de 16 px pendurada na têmpora.

A parede não estava na arte. Na ponta do lóbulo a massa afina e os dois lados quase
se encostam — medidos, 116,5 e 117,3, oito décimos de distância. **A parede inteira
foi criada pela ancoragem.**

Amostrar o lado interno em `(i + ½)/n` em vez de `i/(n − 1)` mantém todos os pontos
no miolo: a ponta passa a ser feita só pelo lado externo e a spline fecha em bico.

---

## Amostragem uniforme mata recorte — mas a cura era N, não um critério novo

**Esta entrada corrige a versão anterior dela mesma.** A parte que continua valendo:
ponto a cada N colunas cai na encosta tanto quanto no extremo, e a spline liga duas
encostas por curva lisa — o recorte morre na interpolação, não na rasterização. Isso
vale para a borda de baixo do cabelo **e** para o contorno externo de uma extensão, e
esquecê-lo custou uma rodada: com amostragem uniforme a "Espetada" (três tufos) e a
"Tigela" (arco parelho) mediram **4,51%** de distinção contra piso de 5%. As duas
artes não são parecidas; foi a amostragem que as igualou.

A parte que **estava errada** era a conclusão. A rodada seguinte trocou a amostragem
uniforme por um critério de extremos com prominência, inventado no bloco, e mediu que
ele ajudava (4,51 → 5,04%). Um critério novo que melhora um número ruim parece a
resposta; era compensação. Medido contra o **erro de corda** — o mesmo critério que
reduziu o contorno do crânio a 42 pontos —, no mesmo N:

| critério | N | desvio da curva | IoU contra a arte |
|---|---|---|---|
| extremos com prominência | 10 | 33,0 u | 49,4% |
| erro de corda | 10 | 15,9 u | **61,1%** |
| erro de corda | 20 | **3,6 u** | 61,7% |

**O critério inventado perdia por 12 pontos de IoU antes de qualquer ajuste de N.**
Ele só parecia necessário porque 8 a 12 pontos são poucos demais para a forma existir:
a 20 pontos o erro de corda **subsome** os extremos sozinho, porque tirar um extremo
tem custo de corda alto e ele sobrevive sem regra especial.

Duas complicações somem junto com o critério, e as duas eram sintoma do mesmo aperto:
a rotação de 90° do lóbulo de têmpora (erro de corda é isotrópico, não tem eixo
preferido) e a decimação uniforme da sombra (com o mesmo critério nas duas, elas se
reduzem em fase).

**A regra generalizável:** antes de inventar critério, meça o que já existe no
repositório com pontos suficientes. Critério novo é a última hipótese, não a primeira.

---

## IoU não escolhe quantos pontos — desvio de borda escolhe

Duas réguas para a mesma peça, e elas discordam de propósito:

| N | IoU contra a arte | desvio da curva |
|---|---|---|
| 10 | 61,1% | 15,9 u |
| 20 | 61,7% | 3,6 u |

Dobrar os pontos moveu o IoU em **0,6 ponto** e o desvio em **12 unidades**. Os
números não brigam: **IoU mede área, e área é insensível a recorte.** Um dente de 15
unidades numa borda de 500 é ruído na conta de área e é a diferença entre "cabelo" e
"boina" no olho.

O que o Doug reprova é recorte. Então **o N sai do desvio de borda**, e o IoU serve
para outra pergunta — se a massa está no lugar certo. Escolher N por IoU teria parado
em 10, com o desenho que ele já tinha reprovado.

Limiar: **meio traço, 6 unidades.** Abaixo disso as duas curvas caem dentro da mesma
tinta preta e não há onde a diferença aparecer.

---

## Desvio que não cai com mais pontos é parede vertical, não bug

Numa varredura de N, o desvio do lóbulo caiu de 32,6 para 5,63 unidades e depois
**empacou**: 5,63 em N=20, em N=32 e em N=48. Desvio que ignora mais pontos é a
assinatura de um bug de régua, e valeu investigar antes de aceitar o número.

Não era bug: a ponta do lóbulo é uma **parede quase vertical** — a varredura densa cai
de `y` 187,6 para 123,9 em 1,6 unidade de `x`. Erro de corda não aproxima melhor uma
vertical gastando pontos em outro lugar, e os pontos *sobre* a parede são colineares
entre si, então custam pouco e saem primeiro.

**A leitura certa é que 5,63 é o piso da arte, não um teto do critério** — e o N que
importa é aquele em que a curva **encosta** no piso, não o primeiro que cruza um
limiar. A distinção entre piso e joelho é o que impede escolher N cedo demais.

---

## A cor do teste agrava a leitura de chapéu

A régua pede o cabelo num **teal instrumental** (~177°) para separar cabelo de
contorno por matiz. Julgar forma nessa cor é certo — e julgar *"lê como chapéu?"*
nela **não é**.

Teal é de croma alta e se separa do contorno preto: a massa vira um objeto discreto
pousado na cabeça. No marrom da paleta de verdade, contorno e cabelo ficam próximos em
valor, a massa lê mais espessa e mais orgânica, e a mesma peça melhora sem um byte de
diferença. É a mesma entrada de *"quem lê é a fronteira"*, aplicada à cor do
instrumento em vez de à do desenho.

**Toda folha de crítica repete a peça na paleta de verdade a 56 px.** Sem essa linha,
parte do defeito que se nomeia é da tinta do teste — e parte é forma de verdade, que é
o que interessa. Sem as duas lado a lado não dá para separar.

---

## Mecha ao lado do rosto POR DENTRO da silhueta não cabe no modelo

`Cabelo` tem três lugares para pôr massa: `pontos` (a franja, clipada pelo crânio),
`sombra` (a fronteira entre os dois tons) e `extensoes` (o que passa da silhueta). A
**cortina** — a mecha que desce ao lado do rosto sem sair do contorno da cabeça — não
entra em nenhum: a extração de lóbulos só recolhe o que passa do crânio, e o perfil por
coluna toma a **primeira** corrida, que é a touca (foi corrigido justamente para não
confundir a cortina com a franja).

Medido: ela segura o desvio de borda contra a arte em **~220 unidades** em três
configurações diferentes de critério e de N. Número que não responde a critério nem a
N **não é decimação** — é falta de campo onde guardar a forma.

Consequência prática: ao pedir arte, ou o pedido proíbe cortina, ou o modelo de dados
ganha um campo. Traçar melhor não resolve, e insistir em N é gastar bytes contra uma
massa que o compositor não tem como desenhar.

---

## Herdadas da fase anterior, e continuam valendo

**Esclera fina em pele escura.** Olho totalmente preenchido some contra pele escura;
esclera cheia dá olho arregalado. Uma amêndoa branca fina nas laterais resolve.

**Braço é linha, e linha não tem contorno.** Duas passadas: traço grosso escuro por
baixo, fino colorido por cima. Contornar uma linha produz costura dupla.

**Fills primeiro, strokes depois, no mesmo elemento.** Desenhar todos os
preenchimentos e depois todos os traços cria costura dupla nas emendas.

**Cinza e branco neutros somem.** Contra o contorno preto e a pele clara não sobra
contraste. Tinja tudo que precise existir a 56 px.

**Sem textura de tecido.** O que quase não se vê no grande vira sujeira no pequeno.

---

## Vocabulário de crítica

As respostas da ficha nomeiam **o que a forma lê como**. Um substantivo do mundo, não
um juízo.

| responde nada | responde alguma coisa |
|---|---|
| "ficou legal" | "lê como boina" |
| "não gostei" | "lê como antena de dois pixels" |
| "está genérico" | "lê como o `curto` com um caroço em cima" |
| "precisa melhorar" | "some contra o contorno a 56 px" |
| "está bonito" | "lê como coque, e é o único dos três que lê" |

**Se você não consegue nomear o que a forma lê como, você ainda não olhou.** Volte
para o menor tamanho — é lá que a leitura fica óbvia, porque não sobra detalhe para
distrair.

---

## Um achado ainda em aberto

O `npm run avatar:curvatura` mede que o **`cacheado`** tem quatro pontos com raio de
9,5 a 16,2 unidades no trecho visível — **abaixo do traço de 12**. Os vales dos
festões fecham mais apertado que a linha que os desenha, e a 56 px isso tende a
empastar num borrão em vez de ler como cacho.

Não foi corrigido, e está registrado aqui porque é exatamente o tipo de coisa que se
perde: nenhum gate reprova (a distinção passa, a folga passa, o orçamento passa) e a
folha de contato não mostra, porque a 425 px o vale aparece limpo.
