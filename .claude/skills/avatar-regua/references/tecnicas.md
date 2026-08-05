# As técnicas de medição

Cada uma responde a **uma pergunta**. Onde a técnica já vive em código estável, aqui
só está o endereço e o número que a provou — o porquê está no docstring, e recontá-lo
criaria duas versões de uma verdade numérica. Onde ela não vive em lugar nenhum, a
receita está inteira.

---

## T1 · Onde passa a linha, e quanto mede o traço

**Pergunta:** o traço da referência é uma região preenchida. Onde está o *centro*
dela, e qual a *largura*?

**Vive em:** `corridas(n, amostra)` / `naLinha` / `naColuna` — `scripts/avatar/estilo/medir.ts`.

Devolve, por travessia, `{ x0, x1, centro, espessura }`. O centro é a linha que o
desenhista traçou; a espessura é o traço. **Nenhum dos dois é estimado.** Corridas de
1 px são descartadas — são a rampa de antialiasing tocando o limiar.

`amostra` é indireta de propósito: a mesma função varre linha e coluna.

---

## T2 · Espessura corrigida pela inclinação

**Pergunta:** a varredura atravessou o traço na diagonal. Quanto ele mede de verdade?

**Vive em:** `linha-de-centro.ts` (`medirEspessura`) e `medir.ts` (`espessuraTraco`).

Se a borda anda `m` unidades em x por unidade de y, a corrida mede `t·√(1+m²)`:

```ts
if (Math.abs(m) > 1) continue;                 // descarta as muito oblíquas
out.push(c.espessura / Math.sqrt(1 + m * m));  // corrige o resto
```

**Corrige E descarta, e a redundância é deliberada:** acima de `|m| = 1` o fator passa
de 1,41 e amplifica ruído junto com sinal. Resultado é **mediana**, não média.

**O número que prova:** o erro só tem um sinal — a diagonal nunca mede a menos. Sem
correção, `TRACO` saiu **17** onde o traço mede 12. No ápice da cabeça a corrida mede
84 unidades.

---

## T3 · Contorno como quatro funções monovaloradas

**Pergunta:** como juntar as duas varreduras num contorno sem embaralhar a ordem?

**Vive em:** `linha-de-centro.ts` (`lado()`, `borda()`, `trecho()`).

Borda esquerda e direita como `x(y)`; cúpula e base como `y(x)`. Concatenadas no
sentido horário.

**Por que não uma nuvem de pontos ordenada por ângulo:** funciona para contorno
estrelado, e a cabeça não é. Numa junção, dois pontos caem no mesmo ângulo e a
ordenação os intercala — **zigue-zague de 12 unidades**. Com quatro funções, a ordem
não é inferida: é a ordem do parâmetro.

Dois parâmetros com papéis opostos: `SALTO` (quantos `null` seguidos toleram antes de
encerrar o trecho) e `degrau` (salto de valor entre vizinhos), este **só nas calotas**
— num lado, um salto de 24 unidades pode ser uma saliência legítima.

---

## T4 · Aresta sem supor o sinal

**Pergunta:** onde está a descontinuidade de tom?

**Vive em:** `particao(v, k)` — `medir.ts`. Partição ótima em `k` segmentos por erro
quadrático mínimo (programação dinâmica com somas de prefixo).

**A técnica existe porque a pergunta anterior estava errada.** A antiga era *"a partir
da borda, quantos pixels seguidos estão mais escuros que o platô?"* — tem o sinal
embutido. A faceta esquerda **atravessa** o tom frontal (+15 em cima, −32 embaixo):
mediu **zero**, e a conclusão foi que ela não existia.

Uso horizontal (facetas): `particao(v, 3)`, o segmento do meio é o platô frontal.
Guarda obrigatória: se a média do central for < 140, a linha pegou tinta e a leitura
inteira não vale.

Uso vertical (queixo, sombra): `particao(v, 2)` com o parâmetro `qual:
"inicio" | "fim"` — o queixo mora no fim da janela e a sombra no começo. Sem ele, a
sombra reportava **+45** em vez de −46, e **um marco com sinal errado não reprova o
desenho que esqueceu a sombra: reprova o que a desenhou.**

**As janelas de amostragem são parte da medida.** Escolhidas por varredura, testando
candidatas nas duas artes e reportando `n/3` leituras válidas. A janela `[0,26 · 0,30
· 0,34]` devolve "faceta esquerda de 103 u" — que é o **especular**, não faceta.

---

## T5 · Mancha por desfoque + componente conexa

**Pergunta:** onde está o brilho especular, e qual o tamanho dele?

**Não vive em código estável.** Usada uma vez (o especular). Receita:

```
1. sharp(PNG).blur(3)          → mata a granulação da ilustração
2. sharp(PNG) sem blur         → silhueta e enquadramento
3. platô = mediana do interior entre 20% e 45% da cabeça, margem de 30 px
4. para cada limiar em {+4, +6, +8}:
     flood fill 4-conexo com um Uint8Array `visto`,
     sementes só dentro do rosto,
     guarda a MAIOR componente por área
5. folga = menor distância horizontal do blob à borda interna do contorno
```

**O critério de validação é a estabilidade em três limiares.** Limiarizar o tom cru
devolvia uma mancha de 241 × 54 unidades — quase metade da cabeça — porque o limiar
pega pontinhos claros espalhados pela granulação. Com blur + componente conexa, o
centro não se move um décimo nos três limiares: (138,7 · 92,4).

---

## T6 · Raio de curvatura da curva EMITIDA

**Pergunta:** a minha spline tem quina, depois da conversão Catmull-Rom → Bézier?

**Vive em:** `npm run avatar:curvatura` — `scripts/avatar/estilo/curvatura.ts`.

Amostra com `getPointAtLength` no Chromium e ajusta o círculo circunscrito a três
pontos espaçados por **arco** (4 unidades), não por índice: espaçando por índice, a
janela encolhe onde a amostragem adensa e a mesma curva reporta raios diferentes em
trechos diferentes.

**Ela mede só o trecho VISÍVEL de cada peça**, e isso não é conveniência: rodando
sobre o path inteiro ela reprovava tudo — os cabelos por causa do canto do retângulo
de fechamento (que o clip come) e o tronco por causa do ombro (que a cabeça cobre).

---

## T7 · Inversão de curvatura

**Pergunta:** onde a curva volta sobre si mesma?

**Vive em:** mesmo arquivo. **O critério é REVERSÃO DE SINAL, não virada grande.**

Num contorno fechado a soma das viradas é ±360°, então o sinal dominante é o sentido
do laço; curvatura com sinal contrário é a curva repuxando, em qualquer escala.

A primeira versão marcava toda virada acima de 18° e gritava no canto do queixo, onde
os pontos estão a 26 u e o raio é 48 — **31,7° é exatamente a curva que a forma tem.**

**O raio impresso junto separa dois consertos:** reversão com raio grande é degrau de
emenda (alise); raio menor que o traço é ponto no lugar errado.

**Inversão não é erro por si.** Uma franja recortada em festões tem curvatura
invertida nos vales, e isso é o desenho.

---

## T8 · Decimação por erro de corda

**Pergunta:** como reduzir 2 600 pontos a 42 sem perder a forma?

**Vive em:** `linha-de-centro.ts`.

**Passo 1, colapso de coincidentes:** vizinhos a menos de 5 u → descarta. Aparecem
nas emendas, e o erro de corda **não os remove** (dois pontos colados são colineares
com quase tudo). Uma Catmull-Rom que passa por dois pontos a 3 u ganha um laço.
Distância bruta é o critério certo aqui, não curvatura.

**Passo 2, remoção gulosa:** a cada rodada some o ponto de menor custo, onde custo é a
distância perpendicular à corda dos vizinhos.

**As alternativas foram medidas no path emitido:**

| critério | raio mínimo | caixa preservada |
|---|---|---|
| **erro de corda** | **32,6** | sim |
| arco uniforme | 31,4 | sim |
| densidade ∝ curvatura | 13,8 | **não** — o ápice cai 1,7 u |

A densidade por curvatura é a que parece mais certa no papel e é a pior: adensa os
cantos e deixa a cúpula, gentil e longa, com pontos de menos.

**E mais pontos pioram:** 48 dão raio 16,8; 88 dão 16,4.

---

## T9 · Suavização por média móvel em comprimento de arco

**Pergunta:** o contorno tem um degrau na emenda entre as duas varreduras. Como tirar?

**Vive em:** `linha-de-centro.ts`.

**O defeito não é ruído** — o contorno cru tem resíduo de 0,09 u contra ajuste local.
É um **degrau sistemático de ~1 u** entre as varreduras: as duas descrevem a mesma
borda perto dos 45° mas discretizam em direções diferentes, e o viés de cada uma tem
sinal próprio.

Spline melhor não conserta isso — a troca para centrípeta **alisou o topo e deixou o
queixo como estava**, porque ali o defeito está no dado, não na curva.

A janela é medida em **unidades de arco, não em número de amostras**: a densidade
varia muito ao longo do contorno.

**Roda ANTES de decimar.** Alisar 2 600 pontos distribui o degrau; alisar 42 mexe na
forma. Custo em forma, calculado: uma média móvel numa curva de raio R atalha
`j²/8R` — com R ≈ 30, dá 0,15 u, três ordens abaixo do degrau removido.

---

## T10 · Escolha de primitiva por ÁREA

**Pergunta:** esta peça é um retângulo, uma elipse ou uma cápsula?

**Não vive em código estável** — é um julgamento de três linhas. Isole o path,
rasterize, conte pixels de tinta e compare:

```
retângulo = W·H     elipse = πWH/4     cápsula = H(W−H) + πH²/4
```

| peça | caixa | medida | retângulo | elipse | **cápsula** |
|---|---|---|---|---|---|
| sobrancelha | 46,5 × 10,3 | **363** | 478 | 375 | **367** |
| boca | 37,0 × 8,2 | **190** | 304 | 239 | **190** |

Cápsula ganha — e cápsula é o que `stroke-linecap="round"` desenha **de graça**. Por
isso as duas peças são um segmento traçado, não forma preenchida.

---

## T11 · Sagita por ajuste QUADRÁTICO

**Pergunta:** esta peça é inclinada ou arqueada, e quanto?

**Não vive em código estável.** Receita: extraia o eixo (centro vertical de cada
coluna com altura > 2 u), ajuste mínimos quadrados de grau 2, e

```
sagita     = y(meio) − média de y(pontas)     ← com o termo linear cancelado
inclinação = B + 2A·xm
```

**Uma RETA não tem como reportar curvatura.** A primeira rodada ajustou reta e
concluiu "sobrancelha inclinada, boca curva" — num arco simétrico a reta devolve
inclinação zero e um resíduo que ninguém olha. Mesmo modo de falha do T4: pergunta
errada, resposta plausível.

Medido: sobrancelhas −1,71/−1,76 (arqueiam para cima); boca **+3,62**, 25% mais funda
do que a estimativa por caixa dizia.

**A emissão paga o dobro:** o controle de uma Bézier quadrática vai a `2 × sagita`,
porque a curva passa na metade do caminho até ele em t = 0,5.

---

## T12 · Varredura de constante

**Pergunta:** este parâmetro (42 pontos? janela 15?) é herança ou é medido?

**A forma certa:** a constante lê de `process.env` com valor padrão, e a varredura é
um laço de shell que roda o script e mede o resultado no path emitido.

```ts
const JANELA = Number(process.env.JANELA ?? 15);
```

**A forma errada, que está no repositório e não deve ser copiada:**
`.scratch/estilo/janela.ts` e `sweep.ts` fazem `writeFileSync` no **próprio
script-fonte**, substituindo a linha da constante por regex, e restauram num
`finally`. Funciona, e foi assim que `ALVO_PONTOS` e `JANELA_SUAVE` deixaram de ser
herança — mas `densidade.ts` ficou sintaticamente quebrado por esse caminho e ainda
está lá.

---

## T13 · Conferência cruzada

**Pergunta:** eu posso confiar neste trace, que é um redesenho?

**Vive em:** `linha-de-centro.ts`. É o número que autoriza tudo.

Duas leituras independentes do mesmo desenho, por réguas independentes: corridas de
tinta sobre Béziers rasterizadas (line-art) contra `medir()` sobre os pixels
originais (PNG). Três detalhes que fazem valer:

- **a cabeça é medida no terço superior nas duas fontes** — `medir()` define largura
  da cabeça como a maior do terço de cima justamente para excluir saliências;
- **é meia largura total, não distância ao eixo do tronco** — a cabeça tem eixo
  próprio (+7), e medir do eixo do tronco devolveria 189,1 contra 181,9: a
  discordância de 7,2 seria o **giro**, não erro;
- **o traço descontado da meia-largura do PNG é o que o PNG mede**, não o que o
  line-art mede — senão a conferência usa um número da fonte que ela quer conferir.

Resultado registrado: cabeça 182,0 × 182,4; tronco 137,4 × 137,3; traço 11,9 × 11,2.

---

## Os sete princípios que atravessam todas

1. **A pergunta não pode ter o sinal embutido.** "Quanto mais escuro?" mediu zero
   numa faceta que existe. "Onde está a descontinuidade?" achou.
2. **Um marco que mede a coisa errada e concorda consigo mesmo é indistinguível de
   um que funciona.** Daí as janelas serem varridas nas duas artes.
3. **Erro com sinal único nunca some na média.**
4. **Meça no artefato emitido, não na tabela de entrada.**
5. **Duas réguas independentes que concordam em fração de unidade não estão as duas
   erradas do mesmo jeito.**
6. **A ordem das operações é parte da receita.** Alisar antes de decimar; colapsar
   coincidentes antes do erro de corda; medir espessura grosseira antes de extrair
   contorno.
7. **Gate intermitente é pior que gate ausente** — ensina a ignorar o vermelho.
