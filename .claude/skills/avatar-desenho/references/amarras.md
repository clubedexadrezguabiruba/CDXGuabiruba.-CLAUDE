# As amarras, por tipo de peça

Cada uma tem **um número** e **um teste**. Liste as que se aplicam antes de propor
qualquer direção: elas cortam o espaço de desenho, e propor fora delas é perder a
rodada.

Onde a amarra é computável, `npm run avatar:variantes` a mede sozinho. Onde não é,
está dito — e o script avisa em voz alta em vez de ficar verde por vacuidade.

---

## Toda peça, sem exceção

| amarra | número | quem mede |
|---|---|---|
| orçamento composto | **26 formas · 10 240 bytes** | `avatar:variantes`, `avatar:folha-base` |
| a base careca não muda | **19 formas · 7 418 bytes**, exatos | `avatar:folha-base` |
| contrato de custom properties | 0 problemas | `conferirSvg` |
| distinção contra as irmãs do slot, a 56 px | **≥ 5%** dos pixels de 40×56 | `avatar:folha-base` |
| a peça não declara silhueta do corpo | não compila se tentar | `typecheck` |
| **o topo da peça cabe no canvas** | nenhum ponto acima de **`y = 8`** | ninguém ainda — ver abaixo |
| **(f) o Doug aprovou a folha** | não é número, e não deve ser | o Doug |

**O teto da base é de REGRESSÃO, comparado com `!==`.** Ela não pode crescer *nem
encolher* — crescer significa alguém ter achado espaço na base para pagar uma camada
que não é dela.

**O canvas tem 39 unidades acima da cabeça, e elas acabam sem aviso.** Medido em
2026-08-03: a figura base ocupa de `y = 39` a `y = 655` num `viewBox` de 700, e
`CAIXA_CABECA.y0` é 45,5 — sobram **3,1 px acima da coroa no tamanho do ranking**.
Tudo que uma peça desenhe acima de `y = 0` é cortado pelo viewport, e o corte não
levanta erro: ele produz uma **barra reta**, que lê como *laje* e como *topo de
boné*. O piso é 8 e não 0 porque o traço tem 12 unidades — em `y = 8` a borda de
cima da tinta cai em `y = 2` e o contorno inteiro aparece; em `y = 0` some metade
dele e a peça volta a ler sem borda no topo.

**Não é hipótese e não é só de peça nova:** o `moicano` do catálogo sai com 147 px
de largura CONSTANTE nas seis primeiras linhas do raster — a crista dele (`y` −34,
−76, −60) é guilhotinada desde o 2a.1 —, e o `coque` perde 34 unidades da calota
pelo mesmo caminho. **Sobra que passa do teto se comprime em torno da linha da
coroa, não se corta**: comprimir preserva a razão entre pico e vale, e um perfil de
três tufos continua com três tufos, mais baixos. Cortar achata os três contra a
mesma reta, que é o defeito de origem.

**O (f) é o item que faltava existir, e ele fecha um buraco medido.** Os gates
mediram distinção, cor, geometria e verde de suíte, e **os cinco cabelos do 2a.1
passaram em todos e foram reprovados de olho pelo Doug**. Gate verde não fecha
peça. O que o (f) exige é registro, não sentimento: uma linha no
`docs/avatar/14-backlog-execucao.md` com o **selo da folha** que o Doug abriu, a
**data** e o **veredito em uma frase**. O que ele deliberadamente não é: uma
métrica — a regra 10 desta skill já diz que o gate julga número e o Doug julga
arte, e tentar escrever régua de beleza foi o que produziu cinco cabelos
matematicamente válidos e artisticamente quadrados.

**O composto é base + UM item**, medido, nunca somado: nunca há dois cabelos num
render, então somar os cinco orçaria uma composição que não existe.

**Os 5% saem de pixel, não do par mais parecido que existe**: 5% de 2 240 são 112 px,
um bloco de ~10 × 11 na miniatura. Calibrar o piso pelo desenho que ele julga é
justificativa circular — quando `curto × trança` mediu 3,66%, a resposta certa foi
engrossar a trança, não baixar o piso.

---

## Cabelo

| amarra | número | onde | quem mede |
|---|---|---|---|
| folga sobre **cada** sobrancelha | **≥ 24 unidades** | `FOLGA_ROSTO`, `folgaDoRosto()` | `avatar:folha-base`, `avatar:variantes` |
| ancoragem de cada extensão dentro da cabeça | **≥ 10** (`SANGRIA`) | `ancoragemDasExtensoes()` | `avatar:variantes` |
| pontas da franja fora da silhueta (peça **paramétrica**) | `t` fora de [0, 1] | `bordasEm()` | `avatar:variantes`, `cabelo.test.ts` |
| cobertura da coroa (peça **traçada**) | **= 100%** | `coberturaDaCoroa()` | `avatar:variantes`, `cabelo.test.ts` |
| contenção da região clara (peça **traçada**) | **≥ 0** (com sinal) | `contencaoDaClara()` | `avatar:variantes`, `cabelo.test.ts` |
| auto-interseção do laço (peça **traçada**) | **= 0** | `autoIntersecoes()` | `avatar:tracar --ida-e-volta-massa` |
| degrau de sombra sob a franja | 22 unidades (`DEGRAU`) | `pathCabeloClaro()` | `sombraSobreAFranja()` |
| desvio da decimação contra a varredura densa | **≤ 6 u** (meio traço) | `desvioDaCorda()` | `avatar:tracar` |
| desvio do traço contra a arte de origem | **piso da arte + 6 u** | `limiar()` | `avatar:fidelidade` |
| massa que a arte tem e o traço não | **≤ 2% das colunas** | gate 2 | `avatar:fidelidade` |

**As duas últimas linhas eram uma só, e separá-las custou uma rodada.** "Desvio do
traço contra a arte" media duas coisas somadas: a decimação, que responde a mais
pontos, e o **piso** — o boneco do gerador não ser o do `geometria.ts` mais o clip do
crânio comendo massa que a arte tem. Rodada na `curto-espetada` com a decimação
DESLIGADA (1 193 pontos), a fidelidade dá 27,6 u contra os 27,3 da peça de 64: **a
decimação custa 0,3 unidade**. Um limiar de meio traço ponta a ponta seria inatingível
por um motivo que não tem nada a ver com o traço, e afrouxá-lo até passar esconderia
justamente o que ele deveria pegar. Por isso o piso é medido em toda rodada e o gate é
relativo a ele.

**A folga do rosto é re-ancorada por família.** Paramétrica: piso 24, e reprova — a
franja é desenhada, então folga curta é escolha de quem desenhou. Traçada: o número é
**da arte**, o piso vira aviso, e a decisão é do olho (item (f)). O traçador **não sobe
mais a peça**: `liberarORosto()` subia a franja inteira até o rosto respirar, e o que
apareceu na folha HSHC93 foi uma faixa de testa nua que não existe no PNG. Amarra que
briga com a arte se re-ancora na arte.

**A amarra 6 (`y ≥ 8`, o teto do `viewBox`) é cumprida por compressão, não por corte.**
O traçador calcula um `k` só para a peça inteira — massa e lóbulos —, aplica só em `y`,
só acima de `CAIXA_CABECA.y0`, e **imprime** `k`, o pico original e o comprimido.
Cortar achataria os picos contra uma reta, que é o defeito que o `viewBox` já produz
sozinho (folha 93ETYY: barra de 314 a 341 px na primeira linha).

**A amarra de desvio é a que faltava, e a falta dela é o que deixou passar um cabelo
que o Doug reprovou.** Toda peça traçada de PNG tem um número dizendo quanto ela se
afasta da referência — sem ele, trocar critério de traçado é trocar um palpite por
outro, e "parece melhor" é o que quem acabou de mexer sempre acha.

Meio traço porque abaixo disso as duas curvas caem dentro da mesma tinta preta. **Vale
por curva** — franja, sombra e contorno externo de cada lóbulo, cada uma com o seu
número —, e não como média: uma média esconde a curva que errou.

**A folga é medida nos DOIS lados, e os dois números diferem.** O `GIRO` deixa a
sobrancelha direita 3 unidades mais alta, então sobra menos testa daquele lado: a
primeira tabela do `curto` deu **25,5 à esquerda e 8,3 à direita**, e três dos cinco
modelos reprovaram na primeira medição. Um cabelo simétrico em `t` sai assimétrico em
folga.

**As 24 unidades saem da escala de leitura:** são 1,9 px de pele entre duas peças
pretas a 56 px. Menos de um pixel e elas encostam por antialiasing — e a sobrancelha
inteira tem 0,66 px de espessura ali.

**A ancoragem impede o coque flutuante.** Extensão tangente ao crânio lê como adesivo
colado ao lado, e meio pixel de antialiasing abre uma fresta de fundo entre as duas
peças. É o análogo, um slot acima, do gate (d) que o `tipos.ts` promete aos trajes.

**As extensões guardam PONTOS, não `d: string`.** Foi a troca que permitiu ao gate
enxergar a peça — guardando path emitido, a régua de folga ficava cega justamente
para o moicano, que é só extensão.

---

## Traje

| amarra | número | quem mede |
|---|---|---|
| matiz longe da pele | **fora de 18–28°** | ninguém — é olho |
| a cor é definitiva | a da tabela de patentes | `verify:paleta-patentes` |
| folgado, nunca justo | alguns por cento maior | ninguém |
| sem textura de tecido | — | ninguém |
| sobreposição das extensões | ≥ 10 (`SANGRIA`) | **ninguém, e isto é dívida** |

**A dívida é real e está declarada.** `Traje.extensoes` ainda guarda `d: string`, e
path emitido não se mede. A amarra que o `tipos.ts:65` promete ao Bloco 2 é, hoje,
olho e não gate. A correção é a mesma que `Cabelo.extensoes` já recebeu: guardar
pontos. O `avatar:variantes` imprime esse aviso toda vez que uma variante de traje
aparece, para ninguém confundir silêncio com aprovação.

**Por que nada que não seja pele pode morar em 18–28°:** o pipeline separa pele de
pano por matiz, e é a pele que troca de cor. Uma bota marrom não seria "pano de cor
fixa" — seria **entendida como pele** e mudaria de cor junto com o aluno. Na rodada em
que o macacão saiu creme-pêssego, pele e pano ficaram ambos em ~30° e o tronco saiu
salpicado de manchas cor de pele.

**Por que a cor é definitiva:** pela emenda à D27 só pele e cabelo recolorem. A cor do
uniforme **é** o sinal da patente, e duas peças da mesma patente precisam sair na
mesma cor entre pedidos diferentes, porque nada as harmoniza depois.

---

## Animação, quando a peça tiver

| amarra | número | quem mede |
|---|---|---|
| o olho nasce ABERTO | ≥ 95% da altura aberta | `avatar:animacao` |
| pisca | mínimo ≤ 30% | `avatar:animacao` |
| respira | amplitude > 2 px | `avatar:animacao` |
| `prefers-reduced-motion` para tudo | zero animação ativa | `avatar:animacao` |

**Estado inicial explícito em tudo que a animação esconde.** Pálpebra com `opacity: 0`
dentro do `@keyframes` apaga os olhos quando a animação não roda — e ela não roda na
folha de contato, no gate, e para quem pediu movimento reduzido.

---

## Composição

| amarra | quem mede |
|---|---|
| `id` único com 30 instâncias no mesmo documento | `avatar:pose` |
| nenhum comentário dentro do `<style>` | `conferirSvg` |
| toda custom property lida está congelada em `PROPRIEDADES` | `conferirSvg` |

**O `conferirSvg` é cego de um lado:** ele reprova propriedade **a mais**, nunca **a
menos**. Foi assim que `--av-cabelo` ficou congelada na paleta desde o Bloco 1 e nunca
foi emitida. Se a sua peça declara que lê uma variável, confira você que ela sai.

**A colisão de `id` resolve para o primeiro em silêncio.** Com geometrias idênticas
nada muda na tela, e por isso ela sobreviveu a um bloco inteiro. `ns` é obrigatório no
tipo por causa disso, e mesmo assim nada impede passar a mesma string duas vezes — daí
o gate medir no DOM.
