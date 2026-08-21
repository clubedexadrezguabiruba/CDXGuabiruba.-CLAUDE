# As 5 barbas — o elenco e os pedidos

O slot `rosto` fica em **6 barbas**: 5 decididas pelo Doug em 2026-08-18
(**2 common · 1 rare · 1 epic · 1 legendary**) mais o `bigode` (rare), aprovado em
2026-08-19 depois de a D16 cair por medição — ver o registro. Todas de baú — no banco, raridade só
existe com `origem = 'bau'` (`CHECK avatar_catalogo_origem_coerente`).

| raridade | slug | estado |
|---|---|---|
| legendary | `cheia` | ✅ **aprovada** — `barba-cheia.png` |
| common | `cavanhaque` | ✅ **aprovada** — `barba-cavanhaque.png` |
| rare | `bigode` | ✅ **aprovada** — `barba-bigode.png` (bigode em ferradura + cavanhaque pontudo) |
| common | `aparada` | a fazer |
| rare | `quadrada` | a fazer |
| epic | `bipartida` | a fazer |

O registro rodada a rodada de como a `cheia` chegou está em
[ESTADO-DA-ROTA.md](ESTADO-DA-ROTA.md), entrada de 2026-08-18.

---

## O fluxo, em duas ferramentas

**Duas imagens, sempre, nesta ordem:**

1. **`C:\Users\Lenovo\Downloads\barbas\BASE-OFICIAL.png`** — o avatar base oficial,
   **careca e sem barba**. É a moldura: o boneco dela é o único que o Gate −1
   aceita, e é ele que tem de sobreviver intacto.
2. **A barba nova, feita antes no ChatGPT** — o boneco com a barba que se quer.

O Gemini **transplanta**: fica com o boneco da primeira e a barba da segunda. É o
gesto que funcionou na `cheia` e a única coisa que seis rodadas provaram que ele faz
bem.

**Por que a segunda imagem manda, e o texto só a reforça:** medido nas rodadas 4 e
5 — instrução específica vence instrução genérica, e o gerador obedece ao texto
quando texto e imagem discordam. Por isso todo pedido abaixo diz, com todas as
letras, que em caso de dúvida se segue a imagem.

**Por que as cláusulas de cor e de "sem braços" estão nos quatro:** a segunda imagem
vem de **outro gerador**, com outra paleta e outro boneco. O ChatGPT vai devolver a
barba na cor que ele quiser, e pode dar braços, orelhas e pescoço ao boneco. As
cláusulas existem para o Gemini ignorar tudo isso e copiar **só a forma**.

Ordem sugerida: `cavanhaque` → `aparada` → `quadrada` → `bipartida`. As duas mais
distantes da lendária primeiro, porque é nelas que a rota pode falhar de um jeito
ainda não visto. **Uma por vez**, com folha de contato antes da seguinte.

---

## A restrição que manda no elenco inteiro

**As 5 recolorem com o cabelo** (D17, e é o que a Regra Inviolável nº 4 permite).
Num mesmo aluno, as cinco saem da mesma cor — então **cor não diferencia nada, e só
a silhueta separa uma barba da outra.**

E a silhueta útil está quase toda abaixo do queixo. Medido:

| | |
|---|---|
| da boca ao queixo | 51,8 u = **4,7 px** a 56 |
| do queixo ao fim do tronco | 249,8 u = **22,7 px** a 56 |
| 1 px a 56 px | **11 u** — nada menor existe |
| para LER como forma (3 px) | **33 u** |
| piso de distinção entre peças, a 56 px | **5%** (`folha-traje.ts:85`) — ele julga, não projeta |

Por isso as duas common se separam por **largura**, e as três de cima pela **borda de
baixo**: é a parte que tem espaço para ser lida.

## As amarras comuns às cinco

Todas medidas na peça que passou. Valem para toda barba nova, sem exceção.

| | |
|---|---|
| cápsulas dos olhos | **0 px** de tinta |
| linha da boca | **0 px** por cima |
| miolo acima da boca | **vazio nas cinco; o `bigode` é a exceção medida** — com o contorno pintado pelo gerador sobra 1 px de vão a 56 e a 32 px, e o Doug aprovou a olho; com o `kk-traco` de 12 u ele funde. A segunda morte do bigode (2026-08-18) foi medida com colunas fora da boca (G27) e com o traço que não foi decidido (G29) |
| pele nua abaixo da boca | **NÃO TEM PISO, e agora está medido por que** — ver o bloco logo abaixo (achado **G28**, fechado em 2026-08-20) |
| contorno | 12 u, igual ao do boneco |
| menor detalhe | ≥ 11 u para existir · ≥ 33 u para ler |
| tinta | 1 componente contínuo · ciano instrumental · sem sombra projetada |
| o boneco | não se mexe: 0 px de deslocamento, escala 100,00% |

### Por que a "pele nua abaixo da boca" não vira piso — medido, não abandonado

O 30 u que morava na tabela acima foi calibrado **na `cheia`**, a peça que ele deveria
julgar, e reprovou as três `cavanhaque` — uma das quais o Doug aprovou a olho. Isso já
bastava para tirá-lo. O que faltava era responder de onde um piso com lastro sairia, e
a resposta, medida em 2026-08-20 (`.scratch/estilo/g28-piso-sintetico.ts`), é que
**ele não sai de lugar nenhum, porque os tamanhos não o comportam.**

Um piso honesto seria: *meia boca + o contorno que a peça traz + pele que sobreviva a
um pixel renderizado*. Os dois primeiros são fixos (2,6 u e 5,2 u). O terceiro depende
de onde o boneco é servido:

| onde | 1 px vale | piso que isso exigiria | cabe nos 48,4 u de boca-a-queixo? |
|---|---|---|---|
| corpo inteiro no `/perfil`, 160 px | 3,1 u | **10,9 u** | sim, com folga |
| corpo inteiro a 56 px | 8,9 u | **16,7 u** | sim |
| recorte de cabeça a 40 px | 12,1 u | **19,9 u** | sim, apertado |
| recorte de cabeça a **32 px** | **15,1 u** | **22,9 u** | sobra 25 u para a barba inteira |

E com **dois** pixels de pele — que é o mínimo para uma faixa parecer faixa e não
serrilha — o piso a 32 px vai a **38,0 u** dentro de um vão de 48,4 u: a barba
precisaria caber inteira em 10 u. Impossível.

**A conclusão é a mesma que a rota já registrou por outro caminho:** o que sustenta a
leitura *"barbudo"* a 32 px **não é o vão sob a boca** — é a silhueta da barba contra a
PELE, na linha do maxilar. Pedir faixa de pele visível dentro de 3,2 px de vão é pedir
o que o tamanho não dá.

**Então a régua vira RELATO, como a `boca-livre.ts` virou depois do G29.** As sondas
continuam medindo e imprimindo o vão; nenhuma reprova por ele. Quem reprova é o olho
do Doug, e nas três vezes em que ele e um piso discordaram, o piso é que estava errado.

## ⚠️ O CONTORNO FECHA EM VOLTA — e a borda de baixo é a que o gerador larga

**Achado de 2026-08-20, medido, e vale para todo pedido de barba daqui em diante.**

O Doug olhou a folha da `cheia` e disse: *"o contorno da barba, que deveria ser um
traço preto, tem a cor fugindo, excedendo o traço"*, e depois *"ainda tem cor vazando
embaixo"*. Estava certo nas duas vezes. A causa é a arte, e é **local**: o gerador
pinta o contorno nas laterais e no topo e deixa a barba morrer sem preto **na borda
de baixo**, onde ela encosta no pescoço e na túnica.

A banda preta abaixo do último pixel de cor, por coluna, na máscara da própria peça:

| peça | banda embaixo (p50) | colunas SEM preto no render |
|---|---|---|
| `cheia` | **1 px** do canvas | 24,7% |
| `cheia-com-bigode` | **1 px** | 43,1% |
| `bigode-ferradura` | 6 px | 25,8% |
| **`rala`** | **12 px** | **0%** |

Referência: o contorno do boneco é **12 u = 14,4 px** do canvas. A `rala` é a única
que o gerador fechou por baixo — e é a única que não vaza no render. A correlação é a
prova.

**Por que a cláusula que já existe não bastou:** ela está na lista de cores
(*"contorno da barba: preto, da mesma espessura das outras linhas do boneco"*), e o
gerador a lê como instrução de COR. Ela tem de ser instrução de **forma**, com a borda
de baixo nomeada — é o que o parágrafo abaixo faz. **Cole-o em todo pedido**, junto
com o bloco de cores:

> **O CONTORNO DA BARBA DÁ A VOLTA COMPLETA NELA.** A linha preta que envolve a barba
> tem a **mesma espessura da linha preta que contorna o corpo do boneco** e não
> afina em lugar nenhum. Ela existe nos quatro lados, e a **borda de baixo é a mais
> importante**: onde a barba termina e começa a roupa ou o pescoço, tem de haver a
> mesma linha preta grossa que existe nas laterais. A barba **nunca** termina com a
> cor dela encostando direto na roupa, na pele ou no fundo. Se em algum ponto a linha
> preta ficar mais fina que a do corpo do boneco, engrosse-a até ficar igual.

**Como conferir sem abrir a imagem:** `npx tsx .scratch/estilo/de-quem-e-a-borda.ts`
imprime a banda de baixo por peça. Abaixo de ~8 px do canvas, a peça vaza no render.

---

## O elenco, em número

| raridade | slug | assinatura | largura | desce do queixo | a 56 px |
|---|---|---|---|---|---|
| common | `cavanhaque` | mancha central no queixo, laterais do rosto nuas | ~120 u (0,33 cabeça) | ~30 u | 11 × 3 px |
| common | `aparada` | contorna a mandíbula de lado a lado, borda seguindo o queixo | ~300 u (0,82) | ~20 u | 27 × 2 px |
| rare | `quadrada` | **borda de baixo reta**, cortada a régua | ~260 u | ~70 u | 24 × 6 px |
| epic | `bipartida` | **duas pontas** com entalhe em V de ~40 u | ~310 u | ~100 u | 28 × 9 px |
| legendary | `cheia` | cobre a cara de bochecha a bochecha, sobe à altura dos olhos, **ponta única** | 356 u (0,98) | 74,5 u | 32 × 7 px |
| rare | `bigode` | **ferradura em volta da boca** + cavanhaque pontudo; a única acima da boca | 154 u (0,41) | 70 u | 14 × 6 px |

**A lendária não é a mais longa, e é de propósito** — decisão do Doug em 2026-08-18.
A `bipartida` desce mais; a `cheia` é a mais larga e a única que sobe até a altura
dos olhos, que é o que se vê primeiro num rosto.

---

# Pedido 1 — `cavanhaque` (common)

**No ChatGPT, peça antes:** *um cavanhaque — só uma mancha de barba no meio do
queixo, com cerca de um terço da largura da cabeça, descendo pouco abaixo do queixo.
As bochechas e as laterais do rosto ficam sem barba nenhuma. A boca fica livre, sem
bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/cavanhaque-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** é **uma única mancha
> compacta no meio do queixo**, com cerca de **um terço da largura da cabeça**. Ela
> começa abaixo da boca, cobre o queixo, e desce só um pouco abaixo dele — cerca de
> **um décimo da altura da cabeça**. A borda de baixo dela é arredondada. É uma peça
> só, cheia, sem divisões. **As bochechas e as laterais do rosto ficam sem barba
> nenhuma** — nada de pelo subindo pelos lados da cabeça. Se a descrição e a segunda
> imagem discordarem em algum detalhe, **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **IGNORE COMPLETAMENTE AS CORES DA SEGUNDA IMAGEM.** Pinte a barba com esta paleta
> técnica:
>
> - massa principal: ciano médio, #00C8C8
> - sombra: ciano escuro, #00696E
> - luz: ciano claro, #7DF0F0
> - contorno da barba: preto, #000000, da mesma espessura das outras linhas do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído — cada tom é uma área única e
> contínua, de borda nítida. Sem fios, sem ranhuras, sem mechas, sem textura de pelo,
> sem pontas finas. Não use ciano em nenhum outro lugar da imagem.
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 2 — `aparada` (common)

**No ChatGPT, peça antes:** *uma barba curta e aparada — ela cobre as laterais do
rosto e o queixo, de lado a lado, mas é cortada rente ao queixo e não cai sobre o
peito. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/aparada-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** é uma **barba curta e
> aparada, colada ao rosto**. Ela cobre as laterais do rosto e o queixo, de lado a
> lado, quase tão larga quanto a cabeça. A borda de baixo **acompanha a linha do
> queixo** e desce só um pouquinho além dele — cerca de **um quinze avos da altura da
> cabeça**. **Ela não cai sobre o peito**, e não tem ponta. É uma peça só, cheia, sem
> divisões. Se a descrição e a segunda imagem discordarem em algum detalhe, **siga a
> segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **IGNORE COMPLETAMENTE AS CORES DA SEGUNDA IMAGEM.** Pinte a barba com esta paleta
> técnica:
>
> - massa principal: ciano médio, #00C8C8
> - sombra: ciano escuro, #00696E
> - luz: ciano claro, #7DF0F0
> - contorno da barba: preto, #000000, da mesma espessura das outras linhas do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído — cada tom é uma área única e
> contínua, de borda nítida. Sem fios, sem ranhuras, sem mechas, sem textura de pelo,
> sem pontas finas. Não use ciano em nenhum outro lugar da imagem.
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 3 — `quadrada` (rare)

**No ChatGPT, peça antes:** *uma barba de borda reta — em vez de terminar em ponta,
ela termina numa linha horizontal reta, como cortada com régua, um pouco mais
estreita que a cabeça. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/quadrada-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** ela cobre as laterais do
> rosto e o queixo, ficando **um pouco mais estreita que a cabeça**, e desce sobre o
> peito cerca de **um quarto da altura da cabeça** abaixo do queixo. **A borda de
> baixo é uma linha horizontal reta**, de lado a lado, como se a barba tivesse sido
> cortada com régua, com os cantos levemente arredondados. **Ela não tem ponta.** Os
> lados são quase retos, e a silhueta inteira é um bloco de base reta. É uma peça só,
> cheia, sem divisões. Se a descrição e a segunda imagem discordarem em algum detalhe,
> **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **IGNORE COMPLETAMENTE AS CORES DA SEGUNDA IMAGEM.** Pinte a barba com esta paleta
> técnica:
>
> - massa principal: ciano médio, #00C8C8
> - sombra: ciano escuro, #00696E
> - luz: ciano claro, #7DF0F0
> - contorno da barba: preto, #000000, da mesma espessura das outras linhas do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído — cada tom é uma área única e
> contínua, de borda nítida. Sem fios, sem ranhuras, sem mechas, sem textura de pelo,
> sem pontas finas. Não use ciano em nenhum outro lugar da imagem.
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 4 — `bipartida` (epic)

**No ChatGPT, peça antes:** *uma barba comprida terminada em duas pontas — ela desce
sobre o peito e se divide no meio, com um entalhe em V bem aberto separando as duas
pontas. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/bipartida-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** ela cobre as laterais do
> rosto e o queixo, quase tão larga quanto a cabeça, e **desce bastante sobre o
> peito** — cerca de **um terço da altura da cabeça** abaixo do queixo. Em baixo ela
> **termina em duas pontas, separadas por um entalhe em V no meio**. O entalhe é bem
> aberto e bem visível: ele sobe pelo menos até **a metade do comprimento que a barba
> tem abaixo do queixo**. As duas pontas são iguais e simétricas. Acima do entalhe a
> barba é uma peça só, cheia, sem divisões. Se a descrição e a segunda imagem
> discordarem em algum detalhe, **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **IGNORE COMPLETAMENTE AS CORES DA SEGUNDA IMAGEM.** Pinte a barba com esta paleta
> técnica:
>
> - massa principal: ciano médio, #00C8C8
> - sombra: ciano escuro, #00696E
> - luz: ciano claro, #7DF0F0
> - contorno da barba: preto, #000000, da mesma espessura das outras linhas do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído — cada tom é uma área única e
> contínua, de borda nítida. Sem fios, sem ranhuras, sem mechas, sem textura de pelo,
> sem pontas finas. Não use ciano em nenhum outro lugar da imagem.
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

## A esteira de cada uma

```
npm run arte:gate .scratch/arte/<slug>-1.png      # Gate −1: registro e forma
npx tsx .scratch/medir-modelo-barba.ts <png>      # largura, altura, componentes
npx tsx .scratch/modelo-detalhe.ts <png>          # boca, olhos, caixa ROSTO
npx tsx .scratch/bigode-no-tamanho.ts <png>       # a boca sobrevive a 56 e 32 px?
```

**Mais um passo, aprendido na `cavanhaque` (achado G31):**

```
npx tsx .scratch/quanto-recolore.ts     # que fracao da peca REcolore?
```

A `cavanhaque` chegou do gerador quase toda **preta** em vez de ciano, e recolore só
**8%** de si mesma — sai preta nas 8 cores de cabelo. O Gate −1 não pega isso, porque
mede forma, não saturação. Piso de referência: `bigode` 80%, `cheia` 83%.

**Reprovou por sombra ou por cor?** É caso da quarta saída — `restaurar-barba5.ts`
troca matiz e restaura a base, sem tocar na silhueta.
**Reprovou por forma?** Volta ao gerador, ou vira achado. Nunca se desenha por
programa.

Depois de aprovada: folha de contato ao olho do Doug, **duas colunas — careca e com
cabelo** — porque a barba cai no castanho de reserva `#5A4632` quando não há cabelo,
e esse salto de cor nunca foi visto.

## Se o Gemini vier em outra cor

Aconteceu na `barba-5`: ele pintou a barba em verde apesar dos hexadecimais no
pedido. **Não é motivo para refazer a arte** — a troca de matiz preserva saturação e
luminância e não move um pixel, e está medida: sozinha, ela derrubou os ladrilhos do
rosto de 30 para 0. Rode `restaurar-barba5.ts` e siga.

## Não passe por Canva nem por Adobe

A rota compara a arte com a base pixel a pixel, e qualquer reamostragem estraga a
comparação. O PNG cru do Gemini é a entrada certa. **Formato nunca é a causa de
reprovação — redesenho é:** a base oficial passada por JPEG q95, q85, q75 e q60
aprova no Gate −1 nas quatro qualidades, com 0,0 px de deslocamento.

---

# Retoque cirúrgico — fechar o contorno de baixo

**Para quem:** `cheia`, `cheia-com-bigode` e `bigode-ferradura`, medidas em 2026-08-20.
A `rala` **não** precisa: ela já tem 12 px de banda embaixo.

**Não é um pedido de barba nova.** A forma das três está aprovada; o que falta é a
linha preta na borda de baixo. Pedir uma barba nova troca um defeito conhecido por uma
rodada inteira de incerteza — e a `cheia` é a única peça que já está no banco.

**Anexe UMA imagem:** a própria arte da peça (`scripts/avatar/arte/barba-cheia.png`,
ou a do lote em `.scratch/arte/lote/<peça>.png`). **Salve o retorno em**
`.scratch/arte/<peça>-contorno-1.png` e passe pela rota: `restaurar-peca.ts` →
`arte:gate` → `de-quem-e-a-borda.ts`.

> Edite esta imagem. Não crie um personagem novo, não redesenhe nada, não reenquadre.
>
> Esta imagem está quase certa. **O único problema é a linha preta de contorno da
> barba: ela some na borda de baixo.** Nas laterais e em cima a barba tem uma linha
> preta em volta; embaixo, onde a barba termina e começa a roupa, a cor da barba
> encosta direto na roupa, sem linha nenhuma.
>
> **A sua tarefa, e é a única: desenhar a linha preta que falta na borda de baixo da
> barba.**
>
> A linha nova tem exatamente **a mesma espessura da linha preta que contorna o corpo
> do boneco** — compare com ela na própria imagem e iguale. Ela acompanha a borda de
> baixo da barba de ponta a ponta, sem interrupção, e se encontra com as linhas que já
> existem nas laterais, formando um contorno fechado em volta da barba inteira.
>
> **A BARBA NÃO MUDA DE TAMANHO NEM DE FORMATO.** A linha nova ocupa a beirada da
> barba que já existe — ela come um pouco da cor da barba, e **não** avança sobre a
> roupa, sobre o pescoço nem sobre o fundo. A silhueta da barba na imagem que você
> devolver é a mesma da imagem que eu mandei.
>
> **NADA MAIS NA IMAGEM MUDA.** A imagem que você devolver será comparada com esta
> pixel a pixel. Ficam idênticos: o tamanho do arquivo (1024 × 1024), o enquadramento,
> o tamanho e a posição do boneco, o formato da cabeça e do corpo, os olhos, as
> sobrancelhas, a boca, a cor da pele, a cor da roupa, o fundo, a cor da barba, e todas
> as linhas pretas que já existem. Não "melhore" nada. Não acrescente sombra, textura,
> fios, brilho nem gradiente. Não escureça a roupa em volta da barba.
>
> Devolva um único PNG de 1024 × 1024.

**O que reprova o retorno, em ordem de gravidade:**

| sintoma | o que aconteceu | régua |
|---|---|---|
| Gate −1 reprova em "rosto/corpo" com causa *repintura* | o gerador redesenhou o boneco | `arte:gate` |
| a banda de baixo continua < 8 px | ele ignorou o pedido | `de-quem-e-a-borda.ts` |
| a peça cresceu para baixo | a linha foi desenhada POR FORA | comparar `pxPeca` antes/depois |
| o recolorimento despencou | a linha comeu a barba inteira | `barba-para-formas.ts`, laudo |
