# As 5 barbas — o elenco e os pedidos

O slot `rosto` fica em **5 barbas**, decidido pelo Doug em 2026-08-18:
**2 common · 1 rare · 1 epic · 1 legendary**. Todas de baú — no banco, raridade só
existe com `origem = 'bau'` (`CHECK avatar_catalogo_origem_coerente`).

| raridade | slug | estado |
|---|---|---|
| legendary | `cheia` | ✅ **aprovada** — `.scratch/arte-aprovada/barba-6-limpa.png` |
| common | `cavanhaque` | ✅ **aprovada** — `.scratch/arte-aprovada/cavanhaque-3-limpa.png` |
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
| miolo acima da boca | **vazio** — o bigode reprovou duas vezes, a segunda medida no tamanho real: funde com o sorriso a 56 **e** a 32 px |
| pele nua abaixo da boca | **sem piso declarado** — o 30 u que estava aqui foi calibrado na `cheia` e reprovou três artes que o Doug aprovou (achado **G28**). Um piso com lastro sai de peça sintética, não do catálogo |
| contorno | 12 u, igual ao do boneco |
| menor detalhe | ≥ 11 u para existir · ≥ 33 u para ler |
| tinta | 1 componente contínuo · ciano instrumental · sem sombra projetada |
| o boneco | não se mexe: 0 px de deslocamento, escala 100,00% |

## O elenco, em número

| raridade | slug | assinatura | largura | desce do queixo | a 56 px |
|---|---|---|---|---|---|
| common | `cavanhaque` | mancha central no queixo, laterais do rosto nuas | ~120 u (0,33 cabeça) | ~30 u | 11 × 3 px |
| common | `aparada` | contorna a mandíbula de lado a lado, borda seguindo o queixo | ~300 u (0,82) | ~20 u | 27 × 2 px |
| rare | `quadrada` | **borda de baixo reta**, cortada a régua | ~260 u | ~70 u | 24 × 6 px |
| epic | `bipartida` | **duas pontas** com entalhe em V de ~40 u | ~310 u | ~100 u | 28 × 9 px |
| legendary | `cheia` | cobre a cara de bochecha a bochecha, sobe à altura dos olhos, **ponta única** | 356 u (0,98) | 74,5 u | 32 × 7 px |

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
