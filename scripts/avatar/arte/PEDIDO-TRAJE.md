# O que fazer no Gemini — traje `traje-soldado-gambesao`

> **ESTE ARQUIVO É MOLDE.** Ele serviu à primeira peça e serve às 7 seguintes: o
> texto para colar é fixo, e só o **cabeçalho de preencher** muda de peça para
> peça. Antes de mandar a próxima, troque as quatro linhas abaixo e o bloco "a peça
> tem N elementos" — o resto **não se reescreve**, porque cada parágrafo dele foi
> pago com uma rodada reprovada.
>
> | preencher | nesta peça |
> |---|---|
> | **slug** | `traje-soldado-gambesao` |
> | **patente** | Soldado (tier 1) — pano `#78833B` oliva, sem cor clara e sem galão |
> | **o que a peça é** | a opção `ordem` 20 do Soldado — a **segunda** da patente, escolhível no editor |
> | **o mundo** | fantasia medieval **europeia**, sem exceção — a oriental era só da farda |
>
> A cor **não** entra no pedido: o ciano é o instrumento, e `arte:traje` pinta o
> pano lendo a patente do slug. Ver "Por que ciano".

**Arquivo para anexar:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024)
**Onde salvar o que voltar:** `scripts/avatar/arte/traje-soldado-gambesao.png`

É **a mesma base do cabelo**, byte a byte — hash conferido por
`npm run arte:base-tronco`. O que muda é o campo: lá era a cabeça e o ar em
volta, aqui é o tronco.

⚠️ **A migration ainda diz `traje-soldado-duas-pecas`.** Ela está commitada e não
aplicada, e o hook `bloqueia-migration-aplicada` impede editá-la. O renome entra na
reescrita que a promoção já devia — a mesma que corta os 9 slugs semeados para os
que têm arte (§7 de `esteira-traje.md`). **Não aplique a migration antes disso.**

---

## Antes de subir, olhe o campo uma vez

```
npm run arte:base-tronco
```

Ele escreve `base-tronco-campo.png`, com o campo de desenho em azul e a cabeça
intocável em vermelho. **Esse arquivo é para o seu olho. Não suba ele para o
Gemini** — o gerador copiaria as manchas.

⚠️ **Ignore a última seção que esse comando imprime** — a que diz *"O QUE O
SISTEMA REPÕE POR CIMA DA ARTE: sombra do queixo, plano lateral"*. Ela está
superada desde 2026-08-12 e diz o contrário do que este pedido pede. O compositor
**não repõe nada** em peça que tem arte; o volume é todo seu. Está registrado como
achado **G18** em `docs/achados.md`, e o texto do terminal é que ainda não foi
corrigido.

Os números que ele mede, para você conferir o que voltar:

| | |
|---|---|
| campo de desenho (o tronco) | x 355 → 668, y 476 → 852 px — **314 × 377** |
| o que a criança de fato vê | y 512 → 852 px — **314 × 341** (91,3% do campo) |
| escondido atrás da cabeça | 9 255 px, acima de y 512 |
| a cabeça, que não pode mudar | x 295 → 745, y 139 → 515 px |
| **as canaletas desta peça** | 5 sobre 314 px de largura → cerca de **63 px cada** no arquivo, ~7 px a 56 |

**E o campo não termina no tronco.** A roupa excede a silhueta — é a diretriz do
doc 21 §6.1, *"roupa veste, não pinta"*. Quanto ela pode exceder, medido:

| direção | folga |
|---|---|
| lateral, na cintura | **31 px** por lado (26 u — metade do transbordo da cabeça) |
| lateral, no ombro | 46 px (38 u) |
| para baixo, a barra | **21 px** (18 u) até o fim da sombra do chão |
| para cima, a gola | para no queixo, **y 515 px** — nem um pixel acima |

---

## Anexe duas imagens, nesta ordem

1. `base-oficial.png` — o boneco careca com o macacão bege. **Sempre primeiro.**
2. A sua imagem de referência de gambesão / gibão acolchoado.

---

## Cole este texto

> Edite a primeira imagem. Não crie um personagem novo.
>
> A primeira imagem é o avatar-base oficial. Não redesenhe, não recorte, não
> redimensione, não desloque e não reenquadre o avatar. A imagem que você devolver
> tem exatamente 1024 × 1024 pixels, e o boneco fica exatamente no mesmo lugar,
> do mesmo tamanho.
>
> A segunda imagem é referência **apenas do formato da roupa**. Ignore o
> personagem dela, o estilo dela, as cores dela e o fundo dela.
>
> Altere exclusivamente a roupa do corpo. Mantenha idênticos: as dimensões do
> arquivo, o canvas, o enquadramento, o tamanho do boneco, a posição do boneco, a
> cabeça inteira, o formato da cabeça, o rosto, os olhos, as sobrancelhas, a boca,
> a pele e o fundo bege claro.
>
> O corpo continua com a mesma forma e no mesmo lugar. A roupa é desenhada sobre
> ele e pode cruzar a borda dele em alguns pontos — isso é esperado, e está
> descrito abaixo. Não mude a forma do corpo; a roupa é que passa por cima dela.
> Não desloque nem redesenhe a sombra no chão: a barra da roupa pode cobrir um
> pedaço dela, mas a sombra em si fica onde está.
>
> **Nada acima do queixo pode mudar, nem um pixel.**
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem
> ombros salientes, não tem pernas, não tem pés, não tem orelhas e não tem
> pescoço. O corpo dele é uma peça só, em forma de sino, e a cabeça senta direto
> em cima dela. **Não acrescente nenhuma dessas partes**, nem desenhando, nem
> sugerindo com uma manga, um punho, uma costura de cava ou uma sombra. Se a sua
> imagem de referência tiver braços, ignore os braços dela por completo.
>
> Nada de manga, cava, punho, ombreira, luva, bota, calça ou barra de calça.
>
> **O mundo é fantasia medieval elegante.** Não é exército moderno, não é guerra
> realista, não é roupa de trabalho contemporânea. Este é o traje de um soldado
> de vila numa história de fantasia: pano simples, costurado à mão, sem metal e
> sem couro.
>
> **A peça é um GAMBESÃO: um gibão acolchoado de pano, costurado em canaletas
> verticais.** É a roupa de um soldado de vila — pano grosso costurado em tiras
> recheadas, que correm de cima até a barra. As canaletas são o assunto do desenho:
> é por elas que a peça se reconhece.
>
> **Desenhe cinco canaletas verticais**, da largura do corpo dividida em cinco,
> correndo do alto do peito até a barra de baixo sem interrupção. Cada canaleta é
> uma tira **estofada e arredondada**, não um risco: ela recebe luz numa das
> beiradas e sombra na outra, e a costura entre duas canaletas é uma linha preta
> fina. Cinco tiras cheias, iguais entre si, e uma linha preta em cada junta.
>
> **Nada de faixa larga na cintura e nada de divisão horizontal**: as canaletas
> atravessam a peça inteira de cima a baixo, sem nada as cortando no meio.
>
> **A peça é cheia, e a luz mostra isso.** As canaletas do lado que recebe luz ficam
> mais claras, as do outro lado ficam na sombra, e dentro de cada uma há a curvatura
> do estofo. Desenhe também as dobras do pano acumulando perto da barra. A peça não
> pode ficar chapada em lugar nenhum — pano acolchoado é volume, e é o volume que a
> faz parecer roupa.
>
> Desenhe o gambesão sobre o corpo bege que já existe, ocupando ele inteiro, do
> alto até a barra de baixo. Pinte por cima de tudo que está no corpo hoje,
> inclusive das sombras que ele já tem.
>
> **A roupa carrega o próprio sombreado, e ele é só seu.** Desenhe o volume
> inteiro da peça com os três tons: o estofo de cada canaleta, as dobras junto à
> barra, a sombra sob o decote, **e a sombra de contato logo abaixo do queixo**,
> onde a cabeça encosta no corpo. Nada de sombreado é acrescentado depois — o que
> você pintar é o que aparece.
>
> **A ROUPA TEM QUE PASSAR DA BORDA DO CORPO. Isto é obrigatório, não é
> permissão.** Uma roupa que termina exatamente na linha do corpo lê como tinta
> sobre madeira, e é motivo de reprovação sozinho — já aconteceu.
>
> Ela passa em **três lugares, e nos três**:
>
> - **a barra de baixo**, descendo além da base do corpo — é o transbordo mais
>   importante, o que faz a peça pousar sobre o boneco em vez de estar pintada nele;
> - **a lateral do alto do corpo**, dos dois lados, onde a espessura do pano
>   aparece;
> - **a lateral na cintura**, dos dois lados.
>
> Onde ela passa, ela ganha **contorno preto próprio**, da mesma espessura do
> contorno do boneco, e esse contorno passa a ser a borda externa do desenho
> naquele trecho.
>
> **Ela passa pouco, mas passa em toda a volta.** "Pouco" tem número: a barra desce
> até cerca de 20 pixels além da base, e as laterais alargam até cerca de 30 pixels
> por lado, num arquivo de 1024 × 1024. Nunca mais que isso — a cabeça tem que
> continuar sendo, com folga, a parte mais larga do boneco, e é isso que faz ele
> ser este boneco. Mas nunca zero, em lugar nenhum.
>
> **O decote não sobe acima do queixo**, nunca — nem um pouco. Ele para na base da
> cabeça.
>
> Sem capa, sem manto, sem tabardo, sem saiote, sem sobreveste solta, sem capuz:
> nada que mude a forma geral do boneco. O que passa da borda é a espessura da
> roupa, não uma peça nova por cima dela.
>
> A peça tem quatro elementos, e só estes quatro:
>
> - decote baixo e arredondado, ou em V raso, sem pontas, sem lapela e sem
>   colarinho, parando bem antes do queixo
> - um cordão simples fechando esse decote em **zigue-zague, passando por ilhoses
>   redondos e visíveis** — quatro ou cinco travessões, e os ilhoses grandes o
>   bastante para se ver
> - as **cinco canaletas verticais acolchoadas**, do peito até a barra, cada uma com
>   o próprio estofo em luz e sombra, e uma costura preta fina entre cada duas
> - a **barra de baixo**, com as dobras do pano se acumulando logo acima dela, e a
>   borda descendo um pouco além da base do corpo, com a linha de baixo visível
>
> **Não use, porque é o vocabulário do mundo errado:** botões, abotoamento de
> camisa, gola de camisa social com pontas, colarinho, cinto de couro, fivela,
> zíper, bolso, aba de bolso, galão, divisa, chevron, ombreira, brasão, corrente,
> fivela metálica, fita refletiva.
>
> **Não use, porque é de outro mundo:** quimono, hanfu, túnica oriental, gola
> mandarim, gola alta fechada, frentes cruzadas uma sobre a outra, faixa obi, nó de
> tecido chinês, botão-laço.
>
> **Não use, porque o boneco não tem:** braço, mão, dedo, ombro saliente, manga,
> cava, punho, luva, perna, pé, bota, calça, pescoço, colarinho em volta do
> pescoço, orelha.
>
> A peça é vista de perto na ficha do aluno e reduzida a 56 pixels de altura no
> ranking. **Detalhe pode e deve existir — mas repetido e regular:** uma fileira de
> ilhoses do mesmo tamanho, cinco canaletas iguais, dobras paralelas. Detalhe
> repetido vira textura quando a imagem encolhe. Um ornamento pequeno e sozinho
> vira sujeira.
>
> Pinte a roupa com uma paleta técnica de três tons de ciano mais as linhas:
>
> - pano principal: ciano médio, #00C8C8
> - sombra do pano (o lado escuro de cada canaleta, as dobras, sob o decote): ciano
>   escuro, #00696E
> - luz do pano (o alto de cada canaleta do lado iluminado): ciano claro, #7DF0F0
> - linhas da construção (decote, cordão, ilhoses, as costuras entre canaletas, a
>   barra): preto, #000000, da mesma espessura do contorno do boneco nas linhas
>   principais, e mais fina nas costuras entre canaletas
>
> Os três tons são volume, não enfeite: eles descrevem o estofo das canaletas e as
> dobras. Nenhum ornamento numa cor de contraste — a peça inteira é do mesmo pano.
>
> Onde a roupa acompanha a borda do corpo por dentro, não desenhe um contorno
> preto novo: o contorno do corpo já existe e não deve ficar mais grosso. Onde a
> roupa PASSA da borda do corpo, aí sim ela leva contorno próprio, da mesma
> espessura, e ele é a borda externa do boneco naquele trecho.
>
> Cores chapadas, sem gradiente, sem textura de trama, sem ruído, sem brilho
> metálico. Use os três tons como áreas de cor sólida — mas **muitas áreas**, uma
> por canaleta, não duas grandes.
>
> Não use ciano em nenhum outro lugar da imagem.
>
> Devolva um único PNG de 1024 × 1024.

---

## Depois

Salve o arquivo em `scripts/avatar/arte/traje-soldado-gambesao.png` e me avise.
Eu rodo o resto.

**Se o Gemini oferecer escolha de tamanho/proporção, peça 1:1 e a maior
resolução.** Não passe por Canva nem por Adobe — a rota compara a arte com a base
pixel a pixel, e qualquer reamostragem estraga a comparação. O PNG cru do Gemini
é a entrada certa.

---

## A rodada reprovada de 2026-08-12, e a regra que ela derrubou

A peça anterior desta posição (`traje-soldado-duas-pecas`) voltou como **camiseta
com saia**: um bloco claro em cima, um bloco escuro embaixo, separados por uma
reta, sem uma dobra e sem transbordar. O Doug reprovou na tela — *"que roupa feia,
nada de tema de fantasia"* — antes de qualquer régua rodar.

**A causa foi este pedido, e o erro tem nome: desenhar para a régua.** O texto
mandava, com todas as letras, *"a divisão é uma linha reta e horizontal"* e *"as
duas áreas têm que ser grandes"*. Isso saiu de uma conta sobre a régua de distinção
a 56 px, não de como é um gibão. Duas peças da mesma patente saem no mesmo pano por
lei, então eu quis área chapada de tom para passar do piso de 5% — e produzi *color
block*.

**A conta estava errada, além de feia.** Dobras e canaletas são linhas de sombra
**distribuídas por uma área grande**: elas contam pixels diferentes tanto quanto um
bloco chapado, e ainda fazem a peça parecer pano. Não havia troca entre "passar na
régua" e "ser bonita". Eu inventei a troca e escolhi o lado errado.

**A regra que caiu:** o molde dizia *"poucos elementos, grandes e limpos: detalhe
pequeno vira sujeira"*, e eu usei isso para justificar dois retângulos. A
formulação certa, do Doug em 2026-08-12: **a roupa pode ter mais detalhe — a
primeira peça tinha cordão e dobras e leu bem.** O que separa detalhe bom de sujeira
não é o tamanho, é a **repetição regular**. Cinco canaletas iguais viram textura ao
encolher; um brasãozinho no peito vira sujeira.

**A regra que fica, para toda peça daqui em diante:** a régua julga a peça, a peça
nunca se desenha para a régua. Se uma opção não separar das outras a 56 px, isso é
**achado sobre o slot** — não licença para achatar o desenho.

---

## Por que gambesão, e por que não o capuz

Duas peças foram propostas ao Doug. A túnica cingida **com capuz caído nas costas**
foi descartada por motivo técnico, não estético: o capuz fica **atrás da cabeça**,
que o compositor desenha por cima e é opaca. Ele teria de ser uma `extensao` em
vetor (`atras: true`), e a esteira de traçado do traje não existe — seria pedir
arte que o programa não sabe montar. Vale para qualquer peça futura com capuz,
gola alta por trás, ou cabelo/pano que passe por cima do ombro.

O gambesão mora inteiro dentro da silhueta, é raster como a farda, e o que o
define — canaletas verticais — é detalhe repetido em área grande. É a peça que
resolve o mundo e a régua ao mesmo tempo, sem ninguém ceder.

---

## O que esta peça está testando, além de ser bonita

Esta é a **primeira vez que a régua de distinção entre peças roda**. Ela existe
desde a primeira peça e nunca teve o que medir, porque havia uma só.

E ela é mais dura do que parece. `distinguir()`
(`scripts/avatar/arte/folha-traje.ts:81-102`) conta os pixels em que dois renders
de 56 px diferem em mais de 8 níveis, **dividido pela união de tudo que os dois
pintam** — cabeça, cabelo, sombra do chão, tronco. Os **38,93%** da farda contra o
boneco sem traje vieram de o tronco inteiro trocar de cor, de bege para oliva.

Aqui não há troca de cor nenhuma: as duas peças do Soldado saem no **mesmo pano
oliva**, por construção (regra 14 do doc 15, travada em `PATENTES`). O que sobra
para diferenciar é sombra, luz e traço preto — sobre o mesmo denominador.

**A aposta desta peça:** as cinco canaletas cobrem o tronco inteiro de luz e sombra
alternadas, e a farda tem painéis no peito e uma faixa horizontal na cintura. São
duas texturas diferentes na mesma área, não um detalhe contra outro. Se isso não
passar dos 5%, nada de honesto passa.

**E se ficar abaixo dos 5%**, a conclusão não é redesenhar até passar. É um fato
sobre o slot: duas opções da mesma patente talvez não separem a 56 px, e aí a
decisão é do Doug — aceitar que a distinção entre opções só existe na ficha de
perfil (340 px), ou mudar a regra da cor. **Nenhuma das duas se resolve desenhando
mais.**

---

## Por que ciano, se a farda vai ser oliva

O ciano é **instrumento de medição**, não estética. Ele existe para o programa
saber, sem adivinhar, quais pixels são a peça: nada mais na imagem mora naquele
matiz — a pele está em 27°, o fundo e o macacão são quase sem cor, e o ciano está
em 180°. Os três tons dizem qual parte é pano, qual é sombra e qual é luz.

**O azul que você vê no arquivo que volta do Gemini nunca chega na tela.** Se ele
parecer feio, isso não é informação sobre a peça — julgue a forma, e a cor só
depois de `arte:traje` rodar.

E aqui o ciano compra uma segunda coisa, que no cabelo não existia: **a cor do
uniforme é lei, não gosto.** O pano do Soldado é `#78833B`, medido no doc 17 e
travado por `verify:paleta-patentes`. Pedir esse hexadecimal ao Gemini seria uma
loteria a cada rodada; pedir ciano e trocar a cor depois entrega o tom medido
sempre, e faz as três opções da patente saírem no mesmo pano — que é a regra 14
do doc 15 (*"duas peças da mesma patente têm de sair na mesma cor, porque nada as
harmoniza depois"*).

**A razão de tom também sai da sua arte, e não de um número fixo.**
`traje.ts:192` calcula sombra ÷ massa e luz ÷ massa **na arte que chegou** — na
farda deu sombra 0,3290 × e luz 1,5506 ×. Se você pintar os três cianos nos hexes
pedidos, esta peça cai na mesma razão, e as duas opções do Soldado ficam
comparáveis por construção. É mais uma razão para não improvisar a paleta.

## O volume é TODO seu — e esta regra virou do avesso em 2026-08-12

**A versão anterior deste pedido dizia o contrário**, e produziu um defeito que o
Doug pegou na primeira folha: *"a sombra do corpo ficou por cima da roupa, não foi
ajustado/eliminado"*.

Ela mandava não pintar a sombra do queixo nem o escurecimento da lateral, porque
o compositor as repunha. Repunha mesmo — `pathSombraQueixoTronco()` e
`pathPlanoLateralTronco()` eram desenhados **depois** da arte. Só que essas duas
camadas foram feitas para o macacão CHAPADO da base, que não tem volume nenhum de
si. Uma arte de traje traz o próprio: a farda do Soldado chegou com 29 790 px de
sombra e 11 626 de luz, medidos. Pintar as duas por cima **dobrava o sombreado** —
sumia o que a artista desenhou e aparecia um degrau que não era de ninguém.

**Consertado no compositor:** quem tem `tinta.png` não recebe sombra nenhuma do
sistema (`compositor.ts:391`, `if (!traje?.tinta.png)`). Medido depois do
conserto: o que era 1 933 px repintados por cima virou **10 px**.

**O que isso quer dizer para quem desenha:** o volume inteiro é seu, inclusive a
sombra de contato sob o queixo. O que você pintar é exatamente o que aparece — e
uma peça chapada sai chapada na tela, sem ninguém para salvá-la.

## A roupa PASSA da silhueta, e o programa não corta mais

A outra metade da mesma ressalva: *"a imagem PNG passa sim da silhueta, mesmo que
pouco; a arte feita por você eliminou essa silhueta e desenhou apenas dentro do
corpo"*.

A arte entrava dentro do `clipPath` do tronco, então tudo que passava da silhueta
era cortado — 5 767 px, dos quais 1 497 de sombra e luz sumiam de verdade. Com
eles sumia o transbordo que faz roupa parecer roupa, que é a diretriz §6.1 do
doc 21 (*"roupa veste, não pinta"*).

**Consertado:** a arte é desenhada **fora do clip**, depois do contorno do tronco.
Onde a roupa transborda, o traço dela vira a borda externa — a mesma regra que
`extensoes()` já enuncia para capa e ombreira. Medido depois: **95,38% da arte
visível**, e só a cabeça esconde alguma coisa.

**O que isso quer dizer para quem desenha:** transborde de verdade. O teto está na
tabela lá em cima (31 px na cintura, 21 px na barra), e o piso **não é zero**.

### O transbordo é DIRETRIZ, e virou uma por decisão do Doug em 2026-08-12

A rodada reprovada transbordou **zero** — a roupa terminava na linha do corpo e leu
como tinta sobre madeira. **A causa está neste pedido**, e é uma frase que eu mesmo
escrevi duas linhas depois de mandar transbordar:

> *"Na dúvida, passe menos."*

Um gerador em dúvida passa **zero**, e foi o que ele fez. A frase saiu.

**A régua e o alvo, para não ficar no adjetivo:** `arte:folha-traje` imprime `ALÉM
DA SILHUETA` como percentual da arte. A farda, aprovada, mediu **10,75%**. Esse é o
**alvo**, não a tolerância — uma peça perto de zero ali está errada mesmo com todos
os outros números verdes, e uma peça muito acima está engordando o boneco.

Vale para **toda peça de traje**, desta em diante, e está registrado como a quarta
amarra da §12 do doc 19.

### E o outro lado da mesma diretriz: a roupa NÃO ABRE PARA FORA EMBAIXO

Decisão do Doug, 2026-08-12, junto com a de cima. **Ela é critério de aceitação,
não texto de prompt** — e a distinção é dele: *"não precisa dizer isso no prompt,
pois as artes já vêm sem abrir para fora por baixo"*. O pedido colado já é longo, e
proibição que o gerador não estava violando só dilui as que importam. Quem confere
é o olho e a régua, na hora de aceitar.

**O que a diretriz diz:** quem manda na forma geral do boneco é o boneco. A roupa
engrossa a borda dele; não vira saia, vestido evasê ou túnica que alarga descendo.
A cabeça continua sendo, com folga, a parte mais larga.

⚠️ **E aqui falta número, o que é o próprio assunto.** A tabela de folgas mede
**cintura (31 px)**, **ombro (46 px)** e **a descida da barra (21 px)**. Ela **não
tem linha para a largura na altura da barra** — e é ali que a pergunta mora, porque
o corpo da base **curva para dentro** embaixo e pano pendurado não acompanha curva
para dentro. A candidata do Gemini mediu **+20/+23 na cintura (dentro do teto)** e
**+59/+69 na barra (território não medido)**. Aplicar o teto da cintura ali seria
inventar régua.

**A medição que falta:** uma linha nova na tabela de `base-tronco.ts`, com a folga
lateral na altura da barra. Ela anda junto com o conserto do **G18**, que é no
mesmo arquivo.

## Como a roupa passa da silhueta, do lado do código

*Este parágrafo foi reescrito em 2026-08-12, depois da execução. A versão anterior
concluía que o transbordo **obrigava** a esteira de traçado; a farda provou que
não.*

Duas camadas, e elas não são a mesma coisa:

| | **`tinta`** | **`extensoes`** |
|---|---|---|
| o que é | o pano da roupa, o desenho inteiro | uma forma PRÓPRIA, com contorno que não é o do tronco |
| onde vive | `arteDoTraje()`, **fora do clip**, depois do contorno do tronco | fora do clip, por cima ou por baixo |
| formato | pode ser PNG (`tinta.png`) | **vetor** (`{ d, cor }`), sempre |
| z | depois do tronco inteiro | `atras: true` sob o tronco · `atras: false` **por cima de tudo** |

O tipo diz que `tinta.png` é *"o interior, nunca a fronteira"* (`tipos.ts:51`), e
foi lendo isso que a versão anterior deste texto concluiu que o transbordo teria de
ser traçado. **A execução mostrou que não:** `arteDoTraje()` emite o `<image>` fora
do `clipPath`, então o PNG carrega o próprio transbordo e o traço dele vira a borda
externa onde passa. A farda transbordou **10,75%** em raster, com 95,38% da arte
visível, e o Doug aprovou.

**O traçado continua devendo — mas para outra coisa.** Ele é necessário quando a
peça tiver **forma própria**: uma capa, uma ombreira, um capuz, um manto que muda a
silhueta geral do boneco. Não para a espessura do pano passando da borda. Enquanto
as peças forem trajes dentro da silhueta, o raster serve — e é por isso que o capuz
foi descartado desta peça.

A exigência da extensão, quando ela existir, é sobreposição de no mínimo **10 u**
(`SANGRIA`) com o corpo: ela **cobre** o tronco, nunca encosta nele. O `atras:
false` é a última camada do SVG inteiro (`compositor.ts:971`) — depois do rosto e
do chapéu. É por isso que a gola para no queixo: uma gola alta na frente cobriria a
boca.

## Por que a primeira rodada saiu camisa social — e o doc já sabia

A rodada de 2026-08-12 voltou com **gola de camisa social, três botões redondos e
cinto de fivela quadrada**. Reprovada pelo Doug: *"não combina com a temática de
fantasia do site"*.

A causa não foi o gerador. Foi este pedido, que dizia "a gola, a abertura central
com botões, e o cinto na cintura" — a descrição de uma roupa contemporânea. E o
projeto **já tinha pago por esse erro**, com o mesmo vocabulário, no doc 17 §5.0:

> *"A primeira rodada do Capitão saiu macacão de mecânico: bolso com aba no
> peito, cinto de fivela retangular... A causa não foi o gerador. **Foi o
> pedido**, que dizia literalmente 'gola, cinto e um bolso no peito'. A Bíblia
> pede **fantasia medieval elegante** (§12) e manda evitar 'guerra realista'. O
> runbook garante que a arte ENTRE no pipeline; ele não garante que ela
> **pertença ao mundo**. São duas conferências diferentes, e só uma delas tem
> gate."*

A conferência que não tem gate é a do olho do Doug, e ela é a única aprovação que
existe (doc 19 §2, passo 12). **Duas rodadas reprovadas nesta esteira tiveram a
mesma causa e nenhuma delas foi o gerador: foi o pedido.** Uma descreveu roupa
contemporânea; a outra descreveu geometria em vez de roupa.

O que muda no texto acima é a lei do doc 17 §5.2: **a silhueta continua sendo o
tronco; o medieval mora na construção dentro dela** — decote, cordão de ilhoses,
canaletas de acolchoado, barra. Nunca uma peça com outro contorno.

## A exceção oriental morreu com a farda

A farda do Soldado voltou como túnica oriental — gola mandarim, faixa obi, nó
chinês — e o Doug **aprovou como exceção daquela peça**, em 2026-08-12. A decisão
foi explícita: *as próximas voltam ao medieval europeu*. Por isso esta leva a lista
de negados orientais no texto colado, e leva no lugar as âncoras europeias:
**cordão em zigue-zague por ilhoses**, **decote baixo arredondado ou em V raso**,
**canaletas de acolchoado**, **barra reta**.

⚠️ **Duas peças no mesmo pano, com vocabulários de mundos diferentes, é risco
declarado.** Se na folha a farda oriental e este gambesão europeu não parecerem da
mesma família, a causa é essa exceção, e a saída é redesenhar a farda — não esta.

## Pendência de nome, que continua aberta

O slug `traje-soldado-farda` está sob suspeita desde 2026-08-12, e **a decisão é do
Doug**. "Farda" é palavra de exército moderno, e foi ela que puxou a primeira
rodada para o mundo errado; `traje-soldado-gibao` casa com o vocabulário do doc 17
§5.1. A migration `20260812120000_bloco2_traje_por_patente.sql` **não está
aplicada**, então trocar custa uma linha de SQL e renomear dois PNGs; depois de
aplicar, custa uma migration.

Os dois renomes — `farda` (se você decidir) e `duas-pecas` → `gambesao` (já
decidido) — entram na **mesma reescrita** que a promoção já devia.

## Para a PRÓXIMA peça — o que trocar, e o que não

**Troque:** as quatro linhas do cabeçalho, e o bloco *"a peça tem quatro
elementos"*, que descreve a construção daquela peça.

**Não troque:** o bloco do "ESTE BONECO NÃO TEM BRAÇOS", as três listas de
negados, o mundo medieval **europeu**, a paleta de ciano, a regra do volume próprio
e a do transbordo. Cada um desses parágrafos existe porque uma rodada voltou
errada.

**E há duas regras novas, das rodadas de 2026-08-12:**

1. **A peça nunca se desenha para a régua.** Se a próxima opção parecer que não vai
   separar das anteriores a 56 px, isso é assunto para a folha e para o Doug — não
   licença para achatar o desenho em blocos de cor.
2. **Detalhe se ganha por repetição, não por tamanho.** Ao escrever o bloco de
   elementos, pergunte: *qual é a textura repetida desta peça que as outras não
   têm?* Canaletas, ilhoses, dobras paralelas, pregas — todas encolhem bem. Um
   ornamento pequeno e sozinho, não.

A próxima do Soldado é `traje-soldado-avental` (`ordem` 30), e ela vem **sozinha**,
depois da folha desta — trava nº 1 do doc 21 §1.3, arte por demanda, nunca estoque.
