# O que fazer no Gemini — traje `traje-<nome>`

> **ESTE ARQUIVO É MOLDE.** O texto para colar é fixo; só o **cabeçalho de
> preencher** e o bloco *"a peça tem N elementos"* mudam de peça para peça. O resto
> **não se reescreve** — cada parágrafo dele foi pago com uma rodada reprovada.
>
> | preencher | nesta peça |
> |---|---|
> | **slug** | `traje-<nome>` (convenção nova: **sem patente no nome**) |
> | **raridade** | `common` / `rare` / `epic` / `legendary` — e ela decide **quantos padrões repetidos** a peça tem (doc 22 §3) |
> | **o que a peça é** | uma linha do menu de `docs/avatar/22-catalogo-de-pecas.md` |
> | **a paleta** | **as cores finais da peça**, escolhidas por você. Ver "A cor é final" abaixo |
>
> **REVISADO EM 2026-08-13**, com a virada de direção (doc 21 §0). Duas coisas
> grandes saíram deste pedido:
>
> - **a paleta de ciano** — a arte agora chega em **cor final**, e nada é recolorido
>   depois;
> - **o mundo medieval europeu** — o mundo agora é a **Academia 64**, e ele é muito
>   mais largo.
>
> Se você estiver lendo uma cópia antiga que pede ciano e fantasia medieval, ela
> está morta.

**Arquivo para anexar:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024)
**Onde salvar o que voltar:** `scripts/avatar/arte/traje-<nome>.png`

É **a mesma base do cabelo**, byte a byte — hash conferido por
`npm run arte:base-tronco`. O que muda é o campo: lá era a cabeça e o ar em volta,
aqui é o tronco.

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
2. A sua imagem de referência da peça.

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
> personagem dela, o estilo dela e o fundo dela.
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
> **O mundo é a Academia 64: uma academia extraordinária de estratégia.** É um
> lugar, não uma época — nele convivem gente moderna, gente excêntrica e gente de
> lugar nenhum. Fantasia leve, com um fio de mistério. Não é guerra realista, não é
> exército, não é brutalidade, não é humor pastelão, não é dark fantasy.
>
> **[AQUI ENTRA A DESCRIÇÃO DA PEÇA — o único bloco que muda de peça para peça.]**
>
> A peça é vista de perto na ficha do aluno e reduzida a 56 pixels de altura no
> ranking. **Detalhe pode e deve existir — mas repetido e regular:** uma fileira de
> ilhoses do mesmo tamanho, cinco canaletas iguais, dobras paralelas, losangos de
> tricô. Detalhe repetido vira textura quando a imagem encolhe. Um ornamento pequeno
> e sozinho vira sujeira.
>
> **A peça é cheia, e a luz mostra isso.** A roupa não pode ficar chapada em lugar
> nenhum — pano é volume, e é o volume que a faz parecer roupa. Desenhe as dobras do
> pano acumulando perto da barra.
>
> **A roupa carrega o próprio sombreado, e ele é só seu.** Desenhe o volume inteiro
> da peça: as dobras junto à barra, a sombra sob o decote, **e a sombra de contato
> logo abaixo do queixo**, onde a cabeça encosta no corpo. Nada de sombreado é
> acrescentado depois — o que você pintar é o que aparece.
>
> Desenhe a peça sobre o corpo bege que já existe, ocupando ele inteiro, do alto
> até a barra de baixo. Pinte por cima de tudo que está no corpo hoje, inclusive
> das sombras que ele já tem.
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
> Sem capa, sem manto, sem tabardo, sem capuz, sem gola alta por trás, sem
> sobreveste solta: nada que fique **atrás da cabeça** e nada que mude a forma geral
> do boneco. O que passa da borda é a espessura da roupa, não uma peça nova por cima
> dela.
>
> **Não use, porque o boneco não tem:** braço, mão, dedo, ombro saliente, manga,
> cava, punho, luva, perna, pé, bota, calça, pescoço, colarinho em volta do pescoço,
> orelha.
>
> **Pinte a peça nas cores finais dela.** Escolha uma paleta pequena — três a cinco
> tons, contando a sombra e a luz — e use os tons para descrever volume, não para
> enfeitar. As linhas de construção (decote, costuras, fechos, barra) são pretas,
> `#000000`, da mesma espessura do contorno do boneco nas linhas principais e mais
> finas nas internas.
>
> **A peça não pode ser bege, marfim, creme nem nenhum tom próximo do fundo** — ela
> aparece sobre um cartão quase branco, e um bege some nele.
>
> **A peça também não pode ser preta nem quase preta por inteiro** — o boneco tem
> contorno preto, e uma peça escura demais come a silhueta dele.
>
> Onde a roupa acompanha a borda do corpo por dentro, não desenhe um contorno
> preto novo: o contorno do corpo já existe e não deve ficar mais grosso. Onde a
> roupa PASSA da borda do corpo, aí sim ela leva contorno próprio, da mesma
> espessura, e ele é a borda externa do boneco naquele trecho.
>
> **PRETO PURO QUER DIZER PRETO PURO: `#000000`, e cinza escuro não serve.** Não
> redesenhe o contorno que já existe no boneco — e se redesenhar algum trecho dele,
> redesenhe em preto puro. Um traço cinza parece mais **fino** que um preto da mesma
> largura, e é o defeito mais comum desta rota: medido em lum 70 numa peça que está
> em produção. A régua é `npm run arte:borda`.
>
> Sem ruído, sem textura de trama fotográfica, sem brilho metálico exagerado. Um
> degradê suave é aceito quando ele é o assunto da peça; fora disso, prefira áreas
> de cor — **muitas áreas**, uma por evento de construção, não duas grandes.
>
> Devolva um único PNG de 1024 × 1024.

---

## Depois

Salve o arquivo em `scripts/avatar/arte/traje-<nome>.png` e me avise. Eu rodo o
resto.

**Se o Gemini oferecer escolha de tamanho/proporção, peça 1:1 e a maior
resolução.** Não passe por Canva nem por Adobe — a rota compara a arte com a base
pixel a pixel, e qualquer reamostragem estraga a comparação. O PNG cru do Gemini
é a entrada certa.

---

## A cor é final — e isto mudou em 2026-08-13

**A versão anterior deste pedido mandava pintar tudo em três tons de ciano.** O
ciano era instrumento de medição: nada mais na imagem morava naquele matiz (a pele
está em 27°, o fundo e o macacão são quase sem cor, o ciano em 180°), então o
programa sabia sem adivinhar quais pixels eram a peça — e depois **recolorira** o
pano na cor da patente.

**Duas coisas mataram o esquema, e as duas são decisão do Doug:**

1. **O traje deixou de ser por patente** (doc 21 §0). Não existe mais "a cor do
   Soldado". Sem cor de destino, não há o que recolorir.
2. **A cor livre resolve o problema que a régua não resolvia.** Com todas as peças
   de uma patente no mesmo pano, a distinção entre duas delas a 56 px era arrancada
   a fórceps — e foi isso que produziu uma peça em *color block*, reprovada. Com cor
   própria, duas peças se separam trivialmente, e a régua volta a **julgar** em vez
   de projetar.

**O que substitui o ciano, do lado do programa:** a máscara sai de um **diff contra
a base** — o que mudou em relação a `base-oficial.png`, restrito ao campo do tronco
expandido —, mais salpico e conectividade. A saída é RGBA final. É o Bloco B4 do
plano, e o controle negativo dele é: extrair a própria base devolve **0 px**.

**O que isso quer dizer para quem desenha:** o que você pintar é exatamente o que
aparece na tela, na cor que você pintou. Não há mais "julgue a forma e ignore a
cor" — **agora a cor é sua e é definitiva.**

E há duas leis novas por causa disso, as duas já no texto colado: **nada de bege**
(some no cartão marfim `#FBF8F5`) e **nada de quase-preto por inteiro** (come o
contorno do boneco).

## O mundo mudou, e ficou mais largo

**A versão anterior dizia "fantasia medieval europeia, sem exceção".** Ela precisava
de uma lista de negados orientais, de uma exceção declarada para a farda, e ainda
assim o gerador devolvia camisa social. Uma direção que precisa de lista de exceções
para ser obedecida está descrevendo mal o que quer.

**A Academia 64 é um lugar, não uma época.** Quimono, jaleco, moletom, dashiki,
avental de forja e robe de observatório pertencem todos a ela, porque o que os
amarra é o corredor em que estão, não o século. A **exceção oriental morreu
naturalmente**: a túnica pertence ao mundo.

**O que continua proibido** é o que sempre esteve, e não afrouxou: guerra realista,
brutalidade, humor pastelão, estética caótica, dark fantasy no core.

O menu de peças que a Academia comporta está em
`docs/avatar/22-catalogo-de-pecas.md` — **e ele é menu, não fila**: só vira pedido
a peça que o Doug chamar pelo nome.

## O volume é TODO seu

**Uma versão deste pedido dizia o contrário**, e produziu um defeito que o Doug pegou
na primeira folha: *"a sombra do corpo ficou por cima da roupa, não foi
ajustado/eliminado"*.

Ela mandava não pintar a sombra do queixo nem o escurecimento da lateral, porque o
compositor as repunha. Repunha mesmo — `pathSombraQueixoTronco()` e
`pathPlanoLateralTronco()` eram desenhados **depois** da arte. Só que essas duas
camadas foram feitas para o macacão CHAPADO da base, que não tem volume nenhum de
si. Uma arte de traje traz o próprio: a farda chegou com 29 790 px de sombra e
11 626 de luz, medidos. Pintar as duas por cima **dobrava o sombreado**.

**Consertado no compositor:** quem tem `tinta.png` não recebe sombra nenhuma do
sistema (`compositor.ts:391`, `if (!traje?.tinta.png)`). Medido depois do conserto:
o que era 1 933 px repintados por cima virou **10 px**.

## A roupa PASSA da silhueta, e o programa não corta mais

A outra metade da mesma ressalva: *"a imagem PNG passa sim da silhueta, mesmo que
pouco; a arte feita por você eliminou essa silhueta e desenhou apenas dentro do
corpo"*.

A arte entrava dentro do `clipPath` do tronco, então tudo que passava da silhueta
era cortado — 5 767 px, dos quais 1 497 de sombra e luz sumiam de verdade.

**Consertado:** a arte é desenhada **fora do clip**, depois do contorno do tronco.
Onde a roupa transborda, o traço dela vira a borda externa. Medido depois: **95,38%
da arte visível**, e só a cabeça esconde alguma coisa.

### O transbordo é DIRETRIZ, com alvo

A rodada reprovada transbordou **zero** — a roupa terminava na linha do corpo e leu
como tinta sobre madeira. **A causa foi este pedido**, e era uma frase escrita duas
linhas depois de mandar transbordar: *"Na dúvida, passe menos."* Um gerador em dúvida
passa **zero**. A frase saiu.

**A régua e o alvo:** `arte:folha-traje` imprime `ALÉM DA SILHUETA` como percentual
da arte. A farda, aprovada, mediu **10,75%**; o gambesão aprovado ficou dentro de
todos os tetos. Esse é o **alvo**, não a tolerância — uma peça perto de zero ali está
errada mesmo com todos os outros números verdes, e uma peça muito acima está
engordando o boneco.

### E o outro lado: a roupa NÃO ABRE PARA FORA EMBAIXO

Decisão do Doug, 2026-08-12. **É critério de aceitação, não texto de prompt** — e a
distinção é dele: *"não precisa dizer isso no prompt, pois as artes já vêm sem abrir
para fora por baixo"*. Proibição que o gerador não estava violando só dilui as que
importam.

**O que a diretriz diz:** quem manda na forma geral do boneco é o boneco. A roupa
engrossa a borda dele; não vira saia, vestido evasê ou túnica que alarga descendo. A
cabeça continua sendo, com folga, a parte mais larga.

⚠️ **E aqui falta número.** A tabela de folgas mede **cintura (31 px)**, **ombro
(46 px)** e **a descida da barra (21 px)**. Ela **não tem linha para a largura na
altura da barra** — e é ali que a pergunta mora, porque o corpo da base **curva para
dentro** embaixo e pano pendurado não acompanha curva para dentro. O gambesão
aprovado mediu **+33/+27 esq · +30/+25 dir** ali, em território não medido. Aplicar o
teto da cintura seria inventar régua.

## Duas regras que valem para toda peça, e as duas custaram uma rodada

1. **A peça nunca se desenha para a régua.** A rodada de `traje-soldado-duas-pecas`
   voltou como *color block* — um bloco claro em cima, um escuro embaixo, separados
   por uma reta — porque este pedido mandava *"a divisão é uma linha reta e
   horizontal"* e *"as duas áreas têm que ser grandes"*. Isso saiu de uma conta sobre
   a régua de distinção, não de como é uma roupa. **A conta ainda estava errada:**
   dobras e canaletas são sombra distribuída por área grande, contam tantos pixels
   quanto um bloco chapado, e ainda parecem pano. Não havia troca entre passar na
   régua e ser bonita.

   Se uma opção parecer que não vai separar das outras a 56 px, isso é **achado sobre
   o slot** — não licença para achatar o desenho.

2. **Detalhe se ganha por repetição, não por tamanho.** Ao escrever o bloco de
   elementos, pergunte: *qual é a textura repetida desta peça que as outras não têm?*
   Canaletas, ilhoses, dobras paralelas, pregas, losangos, tesselas — todas encolhem
   bem. Um ornamento pequeno e sozinho, não.

   O doc 22 pede essa resposta por escrito, na coluna **textura**, antes de a peça
   ser desenhada. Peça sem resposta ali ainda não está pronta para virar pedido.

## Como a roupa passa da silhueta, do lado do código

Duas camadas, e elas não são a mesma coisa:

| | **`tinta`** | **`extensoes`** |
|---|---|---|
| o que é | o pano da roupa, o desenho inteiro | uma forma PRÓPRIA, com contorno que não é o do tronco |
| onde vive | `arteDoTraje()`, **fora do clip**, depois do contorno do tronco | fora do clip, por cima ou por baixo |
| formato | pode ser PNG (`tinta.png`) | **vetor** (`{ d, cor }`), sempre |
| z | depois do tronco inteiro | `atras: true` sob o tronco · `atras: false` **por cima de tudo** |

O tipo diz que `tinta.png` é *"o interior, nunca a fronteira"*, e uma versão anterior
deste texto concluiu daí que o transbordo obrigaria a esteira de traçado. **A
execução mostrou que não:** `arteDoTraje()` emite o `<image>` fora do `clipPath`,
então o PNG carrega o próprio transbordo.

**O traçado continua devendo — para outra coisa.** Ele é necessário quando a peça
tiver **forma própria**: capa, ombreira, capuz, manto. É por isso que o doc 22 §4
proíbe essas peças no catálogo enquanto a esteira não existir.

A exigência da extensão, quando ela existir, é sobreposição de no mínimo **10 u**
(`SANGRIA`) com o corpo: ela **cobre** o tronco, nunca encosta nele. O `atras: false`
é a última camada do SVG inteiro (`compositor.ts:971`) — depois do rosto e do chapéu.
É por isso que a gola para no queixo: uma gola alta na frente cobriria a boca.

## Os slugs perderam a patente

`traje-soldado-farda` → `traje-farda`. Convenção nova: **`traje-<nome>`**, sem
patente. Renomear custou zero porque nenhuma linha existia no banco; depois do seed
custaria migration de dados.

A pendência de nome que estava aberta aqui — *"farda é palavra de exército
moderno"* — **caducou junto com o mundo medieval**. Na Academia 64 uma farda é o
uniforme da casa, e o nome serve.
