# O que fazer no Gemini — barba

**Arquivo para anexar:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024)
**Onde salvar o que voltar:** `.scratch/arte/barba-1.png` (`-2`, `-3` se fizer mais
de uma rodada)

**Antes de desenhar, olhe:** `scripts/avatar/arte/base-barba-campo.png`
(`npm run arte:base-barba`). Ele mostra em vermelho a zona onde a barba **não pode
existir**. ⚠️ **Esse arquivo é diagnóstico e NÃO vai para o Gemini** — qualquer marca
dele seria copiada para dentro da arte. O que sobe é a base limpa.

---

## Anexe as imagens nesta ordem

1. `base-oficial.png` — o avatar careca. **Sempre primeiro.**
2. (opcional) A sua imagem de referência do formato da barba.

---

## Cole este texto

> Edite a primeira imagem. Não crie um personagem novo.
>
> A primeira imagem é o avatar-base oficial. Não redesenhe, não recorte, não
> redimensione, não desloque e não reenquadre o avatar. A imagem que você devolver
> tem exatamente 1024 × 1024 pixels, e o boneco fica exatamente no mesmo lugar, do
> mesmo tamanho.
>
> A segunda imagem, se houver, é referência **apenas do formato da barba**. Ignore o
> personagem dela, o estilo dela, as cores dela e o fundo dela.
>
> Acrescente exclusivamente uma **barba**. Mantenha idênticos: as dimensões do
> arquivo, o canvas, o enquadramento, o tamanho do boneco, a posição do boneco, o
> formato da cabeça, os olhos, as sobrancelhas, **a boca**, a pele, o corpo, a
> roupa, os contornos e o fundo bege claro.
>
> **A BOCA FICA COMPLETAMENTE LIVRE E VISÍVEL.** Não desenhe bigode. Não desenhe
> pelo acima da boca, nem nos cantos dela, nem encostando nela. Não cubra, não some,
> não desloque e não redesenhe a boca. Entre a boca e a barba tem de sobrar uma
> faixa de pele à mostra. Os olhos e as sobrancelhas também ficam inteiramente
> livres, com pele à mostra em volta.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em
> forma de sino, e a cabeça senta direto em cima dela. **Não acrescente nenhuma
> dessas partes**, nem desenhando, nem sugerindo com uma sombra.
>
> A barba nasce na linha da mandíbula, contorna o queixo e fica **abaixo da boca**.
> Ela **desce abaixo do queixo e cai sobre o peito** — é para ela existir fora da
> cabeça, contra o fundo e sobre o corpo, não presa dentro do rosto. Uma barba que
> só ocupe a cara fica fina demais e desaparece quando o boneco é reduzido.
>
> Faça a forma **grande e simples, com poucos volumes bem separados**: a peça
> precisa ser reconhecível reduzida a 56 pixels de altura. Sem fios, sem mechinhas
> soltas, sem textura de pelo, sem pontas finas.
>
> Pinte a barba com uma paleta técnica de três tons de ciano mais o contorno:
>
> - massa principal: ciano médio, #00C8C8
> - sombra da barba: ciano escuro, #00696E
> - luz / brilho da barba: ciano claro, #7DF0F0
> - contorno da barba: preto, #000000, da mesma espessura do contorno do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído. Use os três tons como três
> áreas de cor sólida.
>
> Não use ciano em nenhum outro lugar da imagem.
>
> Devolva um único PNG de 1024 × 1024.

---

## Três formas que valem a pena pedir

Uma por rodada, **nunca as três juntas** — a esteira julga uma peça de cada vez, e
folha de contato entre peças vem depois de cada uma passar.

1. **Cheia** — da mandíbula ao queixo, descendo sobre o peito.
2. **Cavanhaque largo** — só no queixo, mas com massa que desça abaixo dele.
3. **Comprida** — desce bastante sobre o peito, silhueta em cunha.

---

## Depois

Salve em `.scratch/arte/barba-1.png` e me avise. Eu rodo o resto.

**Se o Gemini oferecer escolha de tamanho/proporção, peça 1:1 e a maior resolução.**
Não passe por Canva nem por Adobe — a rota compara a arte com a base pixel a pixel,
e qualquer reamostragem estraga a comparação. O PNG cru do Gemini é a entrada certa.

---

## Por que ciano, se a barba não vai ficar ciana

O ciano é **instrumento de medição**, não estética. Ele existe para o programa
saber, sem adivinhar, quais pixels são a peça: nada mais na imagem mora naquele
matiz — a pele está em 27°, o fundo e a roupa são quase sem cor, e o ciano está em
180°. Os três tons dizem qual parte é massa, qual é sombra e qual é luz.

**A barba recolore com o cabelo** (`var(--av-cabelo)`, decisão D17), porque ela *é*
cabelo. É por isso que ela vem em cor instrumental e não em cor final: cor final é a
regra das peças que **não** recolorem — traje, chapéu, óculos, pet. A barba é a
única peça do rosto que fica do lado do cabelo na bifurcação.

## Por que a boca é intocável, e o que acontece se ela for tocada

Não é preferência de desenho: é mecânica da extração. `mascaraDaPeca` roda com
`limitar = true` e **zera** todo pixel de peça que caia na região `rosto`
(`extrair.ts:366`). Ciano pintado sobre a boca ou sobre os olhos não vira peça — ele
some, e a barba chega ao código amputada, sem ninguém reclamar na hora.

Os números do campo, medidos por `npm run arte:base-barba`:

| | |
|---|---|
| zona proibida | x 187,5→392,5 · y 184,5→307,4 (205,0 × 122,9 u) |
| folga sob a boca | **8,6 u** até a zona proibida terminar |
| queixo termina em | y 347,2 u |
| livre a partir de | y 353,2 u — inclusive sobre o corpo (Bloco 12) |
| contorno do boneco | **12 u** — a barba tem de chegar na mesma espessura |

A faixa central utilizável no rosto tem **39,8 u** de altura. É pouco: é a conta que
diz, com número, por que a barba precisa descer sobre o peito para ter massa.
