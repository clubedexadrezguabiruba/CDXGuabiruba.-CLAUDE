# O que fazer no Gemini — cabelo `curto-espetada`

**Arquivo para anexar:** `.scratch/arte/base-oficial.png` (1024 × 1024)
**Onde salvar o que voltar:** `.scratch/arte/entrada.png`

---

## Anexe duas imagens, nesta ordem

1. `base-oficial.png` — o avatar careca. **Sempre primeiro.**
2. A sua imagem de referência do penteado.

---

## Cole este texto

> Edite a primeira imagem. Não crie um personagem novo.
>
> A primeira imagem é o avatar-base oficial. Não redesenhe, não recorte, não
> redimensione, não desloque e não reenquadre o avatar. A imagem que você devolver
> tem exatamente 1024 × 1024 pixels, e o boneco fica exatamente no mesmo lugar,
> do mesmo tamanho.
>
> A segunda imagem é referência **apenas do formato do cabelo**. Ignore o
> personagem dela, o estilo dela, as cores dela e o fundo dela.
>
> Altere exclusivamente o cabelo. Mantenha idênticos: as dimensões do arquivo, o
> canvas, o enquadramento, o tamanho do boneco, a posição do boneco, o formato da
> cabeça, o rosto, os olhos, as sobrancelhas, a boca, a pele, o corpo, a roupa,
> os contornos e o fundo bege claro.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem
> pernas, não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça
> só, em forma de sino, e a cabeça senta direto em cima dela. **Não acrescente
> nenhuma dessas partes**, nem desenhando, nem sugerindo com uma sombra. Se a sua
> imagem de referência tiver braços ou orelhas, ignore-os por completo — em
> especial as orelhas, que este boneco não tem e o cabelo não deve revelar.
>
> Desenhe o cabelo diretamente sobre a cabeça existente, encaixado nela.
>
> Preserve da referência: a silhueta externa do penteado, as pontas superiores, as
> pontas laterais, a franja e o volume. As pontas devem **ultrapassar** a linha do
> crânio e aparecer contra o fundo — é para elas existirem fora da cabeça, não
> presas dentro dela. Faça as pontas **grandes e poucas**, bem separadas umas das
> outras: a peça precisa ser reconhecível reduzida a 56 pixels de altura, e ponta
> fina demais desaparece nesse tamanho.
>
> Pinte o cabelo com uma paleta técnica de três tons de ciano mais o contorno:
>
> - massa principal: ciano médio, #00C8C8
> - sombra do cabelo: ciano escuro, #00696E
> - luz / brilho do cabelo: ciano claro, #7DF0F0
> - contorno do cabelo: preto, #000000, da mesma espessura do contorno do boneco
>
> Cores chapadas, sem gradiente, sem textura, sem ruído, sem fios finos, sem
> mechinhas soltas. Use os três tons como três áreas de cor sólida.
>
> Não use ciano em nenhum outro lugar da imagem.
>
> Devolva um único PNG de 1024 × 1024.

---

## Depois

Salve o arquivo em `.scratch/arte/entrada.png` e me avise. Eu rodo o resto.

**Se o Gemini oferecer escolha de tamanho/proporção, peça 1:1 e a maior resolução.**
Não passe por Canva nem por Adobe — a rota compara a arte com a base pixel a
pixel, e qualquer reamostragem estraga a comparação. O PNG cru do Gemini é a
entrada certa.

---

## Por que ciano, se o cabelo não vai ficar ciano

O ciano é **instrumento de medição**, não estética. Ele existe para o programa
saber, sem adivinhar, quais pixels são a peça: nada mais na imagem mora naquele
matiz — a pele está em 27°, o fundo e a roupa são quase sem cor, e o ciano está em
180°. Os três tons dizem qual parte é massa, qual é sombra e qual é luz.

No produto o cabelo é recolorido em tempo de execução pelos tokens do projeto
(`--av-cabelo` / `--av-cabelo-s`), nas 8 cores do catálogo. O ciano não chega ao
aluno. É a mesma ideia que `npm run avatar:gerar` já usa hoje, com o teal de 177°.
