# O que fazer no Gemini — traje `traje-soldado-farda`

> **ESTE ARQUIVO É MOLDE.** Ele serviu à primeira peça e serve às 8 seguintes: o
> texto para colar é fixo, e só o **cabeçalho de preencher** muda de peça para
> peça. Antes de mandar a próxima, troque as quatro linhas abaixo e o bloco "a peça
> tem N elementos" — o resto **não se reescreve**, porque cada parágrafo dele foi
> pago com uma rodada reprovada.
>
> | preencher | nesta peça |
> |---|---|
> | **slug** | `traje-soldado-farda` |
> | **patente** | Soldado (tier 1) — pano `#78833B` oliva, sem cor clara e sem galão |
> | **o que a peça é** | a opção `ordem` 10, a peça **lisa** da patente, que a promoção veste |
> | **o mundo** | fantasia medieval **europeia** — ver a ressalva do oriental no fim |
>
> A cor **não** entra no pedido: o ciano é o instrumento, e `arte:traje` pinta o
> pano lendo a patente do slug. Ver "Por que ciano".

**Arquivo para anexar:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024)
**Onde salvar o que voltar:** `scripts/avatar/arte/traje-soldado-farda.png`

É **a mesma base do cabelo**, byte a byte — hash conferido por
`npm run arte:base-tronco`. O que muda é o campo: lá era a cabeça e o ar em
volta, aqui é o tronco.

---

## Antes de subir, olhe o campo uma vez

```
npm run arte:base-tronco
```

Ele escreve `base-tronco-campo.png`, com o campo de desenho em azul e a cabeça
intocável em vermelho. **Esse arquivo é para o seu olho. Não suba ele para o
Gemini** — o gerador copiaria as manchas.

Os números que ele mede, para você conferir o que voltar:

| | |
|---|---|
| campo de desenho (o tronco) | x 355 → 668, y 476 → 852 px — **314 × 377** |
| o que a criança de fato vê | y 512 → 852 px — **314 × 341** (91,3% do campo) |
| escondido atrás da cabeça | 9 255 px, acima de y 512 |
| a cabeça, que não pode mudar | x 295 → 745, y 139 → 515 px |

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
2. A sua imagem de referência da farda.

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
> Desenhe um gibão de pano cingido sobre o corpo bege que já existe, ocupando ele
> inteiro, do ombro até a barra de baixo. Pinte por cima de tudo que está no
> corpo hoje, inclusive das sombras que ele já tem.
>
> **A roupa carrega o próprio sombreado, e ele é só seu.** Desenhe o volume
> inteiro da peça com os três tons: as dobras, a sombra sob a gola, a sombra sob a
> faixa, **e a sombra de contato logo abaixo do queixo**, onde a cabeça encosta no
> corpo. Nada de sombreado é acrescentado depois — o que você pintar é o que
> aparece.
>
> **A roupa VESTE o corpo, ela não é pintada nele.** Ela tem que passar da borda
> do corpo nos lugares em que roupa de verdade passa — a barra embaixo, a gola no
> alto, a lateral do alto do corpo —, e ali ela ganha contorno preto próprio, da mesma
> espessura do contorno do boneco, que passa a ser a borda externa do desenho. Uma
> roupa que termina exatamente na linha do corpo lê como tinta sobre madeira, e é o
> que não se quer.
>
> **Mas ela passa POUCO.** A cabeça tem que continuar sendo, com folga, a parte
> mais larga do boneco — é isso que faz ele ser este boneco. Na cintura, a roupa
> não pode alargar mais que um terço da diferença que existe hoje entre a largura
> da cabeça e a largura do corpo. Na dúvida, passe menos.
>
> **A gola não sobe acima do queixo**, nunca — nem um pouco. Ela para na base da
> cabeça.
>
> Sem capa, sem manto, sem tabardo, sem saiote, sem sobreveste solta: nada que
> mude a forma geral do boneco. O que passa da borda é a espessura da roupa, não
> uma peça nova por cima dela.
>
> A peça tem cinco elementos, e só estes cinco:
>
> - gola redonda baixa, sem pontas e sem lapela, subindo um pouco a partir do alto
>   do corpo e parando antes do queixo
> - o alto do corpo com a roupa passando um pouco da borda dos dois lados — é a
>   espessura do pano aparecendo, **não é ombro e não nasce braço dali**
> - dois painéis verticais de costura no peito, separados por uma linha
> - um cordão simples atravessando o painel central, cruzado em X ou dado em laço
> - uma faixa larga de pano na cintura, amarrada de lado, sem fivela, e uma barra
>   embaixo que desce um pouco além da base do corpo, com a borda de baixo visível
>
> **Não use, porque é o vocabulário do mundo errado:** botões, abotoamento de
> camisa, gola de camisa social com pontas, colarinho, cinto de couro, fivela,
> zíper, bolso, aba de bolso, galão, divisa, chevron, ombreira, brasão, corrente,
> fivela metálica, fita refletiva.
>
> **Não use, porque o boneco não tem:** braço, mão, dedo, ombro saliente, manga,
> cava, punho, luva, perna, pé, bota, calça, pescoço, colarinho em volta do
> pescoço, orelha.
>
> A peça é vista de perto na ficha do aluno e reduzida a 56 pixels de altura no
> ranking. Poucos elementos, grandes e limpos: detalhe pequeno vira sujeira nos
> dois tamanhos.
>
> Pinte a roupa com uma paleta técnica de três tons de ciano mais as linhas:
>
> - pano principal: ciano médio, #00C8C8
> - sombra do pano (dobras, sob a gola, sob a faixa): ciano escuro, #00696E
> - luz do pano: ciano claro, #7DF0F0
> - linhas da construção (gola, costuras, cordão, faixa): preto, #000000, da
>   mesma espessura do contorno do boneco. Poucas linhas, limpas.
>
> Os três tons são volume, não enfeite: o claro é a luz que bate no ombro e acima
> da faixa. Nenhum ornamento numa cor de contraste — a peça inteira é do mesmo
> pano.
>
> Onde a roupa acompanha a borda do corpo por dentro, não desenhe um contorno
> preto novo: o contorno do corpo já existe e não deve ficar mais grosso. Onde a
> roupa PASSA da borda do corpo, aí sim ela leva contorno próprio, da mesma
> espessura, e ele é a borda externa do boneco naquele trecho.
>
> Cores chapadas, sem gradiente, sem textura, sem trama de tecido, sem ruído, sem
> brilho metálico. Use os três tons como três áreas de cor sólida.
>
> Não use ciano em nenhum outro lugar da imagem.
>
> Devolva um único PNG de 1024 × 1024.

---

## Depois

Salve o arquivo em `scripts/avatar/arte/traje-soldado-farda.png` e me avise. Eu
rodo o resto.

**Se o Gemini oferecer escolha de tamanho/proporção, peça 1:1 e a maior
resolução.** Não passe por Canva nem por Adobe — a rota compara a arte com a base
pixel a pixel, e qualquer reamostragem estraga a comparação. O PNG cru do Gemini
é a entrada certa.

---

## Por que ciano, se a farda vai ser oliva

O ciano é **instrumento de medição**, não estética. Ele existe para o programa
saber, sem adivinhar, quais pixels são a peça: nada mais na imagem mora naquele
matiz — a pele está em 27°, o fundo e o macacão são quase sem cor, e o ciano está
em 180°. Os três tons dizem qual parte é pano, qual é sombra e qual é luz.

E aqui ele compra uma segunda coisa, que no cabelo não existia: **a cor do
uniforme é lei, não gosto.** O pano do Soldado é `#78833B`, medido no doc 17 e
travado por `verify:paleta-patentes`. Pedir esse hexadecimal ao Gemini seria uma
loteria a cada rodada; pedir ciano e trocar a cor depois entrega o tom medido
sempre, e faz as três opções da patente saírem no mesmo pano — que é a regra 14
do doc 15 (*"duas peças da mesma patente têm de sair na mesma cor, porque nada as
harmoniza depois"*).

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
sistema (`compositor.ts`, `tintaTronco`). Medido depois do conserto: o que era
1 933 px repintados por cima virou **10 px**.

**O que isso quer dizer para quem desenha:** o volume inteiro é seu, inclusive a
sombra de contato sob o queixo. O que você pintar é exatamente o que aparece.

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
tabela lá em cima (31 px na cintura, 21 px na barra), e o piso é ser visível.

## Como a roupa passa da silhueta, do lado do código

Duas camadas, e elas não são a mesma coisa:

| | **`tinta`** | **`extensoes`** |
|---|---|---|
| o que é | o interior da roupa | o que EXCEDE a silhueta |
| onde vive | dentro do `clipPath` do tronco | **fora do clip** |
| a fronteira | é a do tronco, redesenhada por cima | é a **dela**, e vira a borda externa ali |
| formato | pode ser PNG (`tinta.png`) | **vetor** (`{ d, cor }`), sempre |
| z | entre a cor chapada e a sombra do queixo | `atras: true` sob o tronco · `atras: false` **por cima de tudo** |

A exigência da extensão é sobreposição de no mínimo **10 u** (`SANGRIA`) com o
corpo: ela **cobre** o tronco, nunca encosta nele. O `atras: false` é a última
camada do SVG inteiro (`compositor.ts:971`) — depois do rosto e do chapéu. É por
isso que a gola para no queixo: uma gola alta na frente cobriria a boca.

⚠️ **E é aqui que o atalho do PNG direto morre.** `Traje.tinta.png` é, nas
palavras do tipo, *"o interior, nunca a fronteira"* (`tipos.ts:51`). O que passa
da silhueta é vetor, então **tem de ser traçado** — a esteira de traçado do traje
saiu de "a considerar" (doc 21 §7) e virou obrigatória. Isso não muda nada no que
você desenha; muda o que eu construo depois que a arte chegar.

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
existe (doc 19 §2, passo 12). O que muda no texto acima é a lei do doc 17 §5.2:
**a silhueta continua sendo o tronco; o medieval mora na construção dentro
dela** — painéis de costura, gola, cordão, faixa. Nunca uma peça com outro
contorno.

## O que esta peça é

A opção de `ordem` 10 do Soldado — a peça **lisa** da patente, que é a que a
promoção veste automaticamente. É de propósito a mais difícil: o Soldado é a
única patente **sem cor clara e sem galão** (doc 17 §3.1 — os cinco tons do
arquivo dele são o mesmo oliva; o primeiro galão nasce no Capitão). Se o volume
ler só com tons de oliva, lê em qualquer patente. É a primeira peça sugerida pelo
doc 21 §7.

⚠️ **O slug `traje-soldado-farda` está sob suspeita, e a decisão é do Doug.**
"Farda" é palavra de exército moderno, e foi ela que puxou o pedido para o mundo
errado. `traje-soldado-gibao` casa com o vocabulário do doc 17 §5.1. A migration
`20260812120000_bloco2_traje_por_patente.sql` **não está aplicada**, e ela mesma
diz que se a arte mudar os slugs, ela muda junto — então trocar hoje custa uma
linha, e depois de aplicar custa uma migration.

Ela vem sozinha. Folha de contato antes da seguinte — trava nº 1 do doc 21 §1.3,
arte por demanda, nunca estoque.

## Para a PRÓXIMA peça — o que trocar, e o que não

**Troque:** as quatro linhas do cabeçalho, e o bloco *"a peça tem cinco
elementos"*, que descreve a construção daquela peça.

**Não troque:** o bloco do "ESTE BONECO NÃO TEM BRAÇOS", a lista de negados, o
mundo medieval **europeu**, a paleta de ciano, a regra do volume próprio e a do
transbordo. Cada um desses parágrafos existe porque uma rodada voltou errada.

**A ressalva do oriental, que é decisão do Doug de 2026-08-12:** a farda do Soldado
voltou como túnica oriental — gola mandarim, faixa obi, nó chinês — e ele
**aprovou como exceção desta peça**. As próximas voltam ao medieval europeu. Então
o pedido da próxima leva, na lista de negados:

> **Não use, porque é de outro mundo:** quimono, hanfu, túnica oriental, gola
> mandarim, gola alta fechada, frentes cruzadas uma sobre a outra, faixa obi, nó de
> tecido chinês, botão-laço.

E leva, no lugar, as âncoras europeias: **cordão em zigue-zague por ilhoses**,
**decote baixo arredondado ou em V raso**, **barra reta**, **cinto simples de pano
no quadril**.
