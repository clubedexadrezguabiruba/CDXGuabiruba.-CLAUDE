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
