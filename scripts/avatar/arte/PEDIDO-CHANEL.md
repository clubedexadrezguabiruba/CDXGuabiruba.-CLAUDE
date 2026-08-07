# O que fazer no Gemini — cabelo `chanel`, segunda rodada

**Anexar, nesta ordem:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024,
**sempre primeiro**) e a referência do corte chanel.
**Onde salvar o que voltar:** `scripts/avatar/arte/chanel.png` (sobrescreve).

**Se o Gemini oferecer tamanho/proporção: 1:1, maior resolução.** Não passar por
Canva nem Adobe — a rota compara arte e base pixel a pixel, e qualquer
reamostragem estraga a comparação. O PNG cru do Gemini é a entrada certa.

---

## Por que existe uma segunda rodada

A primeira arte do chanel passou em todos os gates numéricos e **reprovou no
olho** (Bloco 10 de `ESTADO-DA-ROTA.md`). Seis dos dez defeitos são do gerador
desobedecendo este pedido, não da rota. Os **quatro parágrafos marcados 🆕**
abaixo nasceram de defeito medido, um por um:

| defeito medido na rodada 1 | o parágrafo que responde |
|---|---|
| ponta esquerda 4–5% mais longa que a direita; degrau quadrado na lateral direita | 🆕 **simetria como espelho** |
| 6 906 px de cabelo abaixo da linha do queixo; 4 770 px descartados por cair sobre o corpo; 7,1% da borda desenhada pela região e não pela artista | 🆕 **o cabelo não toca a roupa** |
| contorno pontilhado no arco superior direito (a sonda achou trechos a 23%, 30% e 33% de preto); um traço solto pendurado no canto inferior direito | 🆕 **contorno fechado e contínuo** |
| a abertura do rosto veio como retângulo de cantos vivos | 🆕 **sem canto reto** |

---

## Cole este texto

> Edite a primeira imagem. Não crie um personagem novo.
>
> A primeira imagem é o avatar-base oficial. Não redesenhe, não recorte, não
> redimensione, não desloque e não reenquadre o avatar. A imagem que você devolver
> tem exatamente 1024 × 1024 pixels, e o boneco fica exatamente no mesmo lugar, do
> mesmo tamanho.
>
> A segunda imagem é referência **apenas do formato do cabelo**. Ignore o
> personagem dela, o estilo dela, as cores dela e o fundo dela.
>
> Altere exclusivamente o cabelo. Mantenha idênticos: as dimensões do arquivo, o
> canvas, o enquadramento, o tamanho do boneco, a posição do boneco, o formato da
> cabeça, o rosto, os olhos, as sobrancelhas, a boca, a pele, o corpo, a roupa, os
> contornos e o fundo bege claro.
>
> Desenhe o cabelo diretamente sobre a cabeça existente, encaixado nela.
>
> Preserve da referência: a silhueta externa do corte, a franja, a queda lateral e
> a curva inferior das pontas. O corte é um chanel: liso, com as duas laterais do
> mesmo comprimento e do mesmo formato.
>
> **As duas metades do cabelo são espelhadas.** Dobrando a imagem ao meio pela
> linha vertical que passa pelo nariz, os dois lados coincidem: mesmo comprimento,
> mesma altura, mesmo formato, mesma curva. A silhueta é toda curva — nenhum
> degrau, nenhum ombro reto, nenhum ressalto de um lado só.
>
> O cabelo tem volume **acima** da linha do crânio: a massa sobe sobre a cabeça, e
> a silhueta do penteado é maior que a silhueta da cabeça careca, não colada nela.
>
> As laterais descem pelos lados do rosto e **terminam acima da linha do queixo**.
> **Nenhuma parte do cabelo toca o pescoço, os ombros, o corpo ou a roupa.** Entre
> a ponta do cabelo e a gola tem de sobrar um espaço visível de fundo bege.
>
> A curva inferior das pontas é **uma linha só**, contínua e limpa, virando
> levemente para dentro. Sem escadinha, sem bico, sem pontas separadas.
>
> **O contorno preto do cabelo é uma linha única, fechada e contínua**, da mesma
> espessura em todo o percurso. Sem falhas, sem trechos apagados, sem pontilhado, e
> sem nenhum traço solto que não feche em nada.
>
> **A abertura em volta do rosto é curva, e a borda de baixo da franja também.**
> Sem canto reto, sem ângulo de 90 graus, sem formato de retângulo.
>
> A peça precisa ser reconhecível reduzida a 56 pixels de altura: mantenha a franja
> e a curva inferior como formas grandes e claras.
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

## Nada é dito sobre a luz, e isso é deliberado

O pedido **não** diz onde pôr o brilho nem quanto dele usar. É de propósito: o
render de 2 tons não tem correspondente para o papel `luz`, e na rodada 1 a mancha
de brilho da arte (20–25% da cúpula) voltou como um filete junto da franja. Dirigir
a luz no pedido **mascararia essa régua** — o defeito continuaria lá, invisível.
Deixando livre, cada rodada mede o que o conversor faz com a luz que vier.

Rodada 1: 9 000 px no papel `luz`, **6,4%** da peça.

## Depois que a arte voltar

```bash
npm run arte:gate -- scripts/avatar/arte/chanel.png     # Gate −1, e a causa vem junto
npm run arte:extrair -- scripts/avatar/arte/chanel.png
npm run arte:contorno -- scripts/avatar/arte/chanel.png
npm run arte:converter -- scripts/avatar/arte/chanel.png
npm run arte:pecas                                       # regera pecas-da-arte.ts
npm run arte:revisao -- chanel                           # a folha
```

A folha sai em `scripts/avatar/arte/chanel/revisao/folha.png` e é lida por
**subagente** — a imagem morre no contexto dele e o principal recebe só a descrição
medida.

**Os 6 controles primeiro.** Se algum ficar vermelho, a régua está medindo outra
coisa: conserte a régua antes de olhar a peça. Nunca mostrar número com controle
vermelho.

## Os números da rodada 1, para comparar — não para bater

Baseline, não barra. Uma amostra não estabelece limite, e um chanel diverge do
espetado por construção (mais perímetro por unidade de área, e mais do contorno
correndo sobre o preto da base).

| medida | rodada 1 | o que se espera da rodada 2 |
|---|---|---|
| Gate −1 | APROVADA | igual |
| descartado fora da permitida | 4 770 px | **bem menor** — é o cabelo sobre a roupa |
| vazamento abaixo do queixo (arte) | 6 906 px · 4,9% | **perto de zero** |
| borda amputada por região | 7,1% | **perto de zero** |
| `só na arte` | 5 063 px · 3,6% | igual ou menor |
| perímetro pintado de preto na arte | 95,1% | **100%** — é o contorno furado |
| IoU dentro do `viewBox` | 89,6% | diagnóstico, não meta |
| N · k · cobertura de arco | 28 · 1,000 · 89,3% | diagnóstico, não meta |
| bytes do composto | 9 929 de 10 240 | risco declarado, decisão do Doug |
