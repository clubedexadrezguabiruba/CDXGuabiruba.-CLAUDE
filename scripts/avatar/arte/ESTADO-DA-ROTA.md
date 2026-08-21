# Rota de importação de arte — estado em 2026-08-06

> **A rota GRADUOU no Bloco 4.** Ela morava em `.scratch/arte/`, que o
> `.gitignore` ignorava, e agora vive em `scripts/avatar/arte/` com entradas no
> `package.json` — histórico, CI e um caminho que não some num `git clean`.
>
> **Isto ainda não é documentação do projeto.** É o registro de execução da rota:
> o que foi medido, o valor, e contra que teto. Nada aqui foi colado no catálogo
> `CABELOS` e nenhum doc de `docs/` foi tocado.

---

## O que a rota faz, em uma frase

O Doug edita o cabelo **em cima de um render do próprio compositor**; o programa
prova que o boneco não se mexeu, isola a peça pela cor instrumental, tira o
contorno da máscara e converte para `{t,y}` — sem procurar olhos, sem procurar
guia de cabeça, sem registrar uma cabeça contra a outra.

## O caminho, do PNG à peça

```
base-oficial.png (1024², gerado pelo compositor, UM só para todas as artes)
   ↓ Doug edita no Gemini com o pedido de PEDIDO-GEMINI.md
entrada.png · entrada-2.png · entrada-3.png
   ↓ gate-menos-um.ts     GATE −1: dimensões, deslocamento, escala, forma
   ↓ porque-reprovou.ts   se reprovou: de que COR é a reprovação
   ↓ extrair.ts           ciano ∩ região permitida → máscara + papéis
   ↓ contorno.ts          bordaOrdenada (Moore) → decimação por erro
   ↓ converter.ts         massa {t,y} + clara {t,y} + extensões {x,y} + linhas
   ↓ silhueta.ts          a sonda do defeito 3
   ↓ coroa.ts             as réguas dos defeitos 2 e 4
   ↓ escala.ts            os 92%, medidos no render
   ↓ folha.ts             a folha, N artes, todo número ao vivo
```

**Cada arte tem a própria pasta agora**, derivada do nome do arquivo
(`saidaDaArte` em `base.ts`). `PASTA` continua sendo uma só porque a base
oficial e o manifesto são um só — é contra o hash deles que o Gate −1 confere.

## Os comandos

```bash
npx tsx .scratch/arte/base-oficial.ts                       # gera a base p/ o Gemini
npx tsx .scratch/arte/gate-menos-um.ts   .scratch/arte/entrada-2.png
npx tsx .scratch/arte/porque-reprovou.ts .scratch/arte/entrada-2.png
npx tsx .scratch/arte/extrair.ts         .scratch/arte/entrada-2.png
npx tsx .scratch/arte/contorno.ts        .scratch/arte/entrada-2.png
npx tsx .scratch/arte/converter.ts       .scratch/arte/entrada-2.png
npx tsx .scratch/arte/silhueta.ts        .scratch/arte/entrada.png
npx tsx .scratch/arte/coroa.ts           .scratch/arte/entrada.png
npx tsx .scratch/arte/escala.ts          .scratch/arte/entrada.png
npx tsx .scratch/arte/folha.ts                              # as três, sem argumento
```

Nenhum entrou no `package.json`.

---

## R0 — AS TRÊS ARTES, MEDIDAS (2026-08-06)

| medida | `entrada` | `entrada-2` | `entrada-3` |
|---|---|---|---|
| tipo | espetado | larga, assimétrica, desce | lisa, chanel |
| Gate −1 · deslocamento / escala | 0,0 px · 100,00% | 0,0 px · 100,00% | 0,0 px · 100,00% |
| Gate −1 · rosto (difer./de/maior) | 0 / 144 / 0 | **13 / 144 / 12** | 0 / 144 / 0 |
| Gate −1 · corpo | 1 / 1221 / 1 | **87 / 1221 / 87** | 5 / 1221 / 1 |
| **Gate −1 · veredito** | **APROVADA** | **REPROVADA** | **APROVADA** |
| causa da mudança: peça | 0,0% | **97,4%** | 82,2% |
| causa da mudança: repintura | 98,4% | 0,0% | 1,2% |
| extração · descartado fora da permitida | 442 px | **26 354 px** | 2 702 px |
| contorno direto · erro máx | 7,00 u | 8,22 u | **2,65 u** |
| massa · pontos · desvio · piso | 32 · 4,60 u · 1,48 | 10 · **28,99 u** · **28,56** | 14 · 5,80 u · 0,56 |
| borda amputada por região | 0,0% | 6,5% | 0,0% |
| clara · perda multi-componente | 0 u² | **3 165 u²** | 0 u² |
| traço da peça (defeito 1) | 1 arco, 71,9% | 1 arco, 50,0% | 1 arco, 35,7% |
| pico cru · k | −39,7 u · 0,440 | −5,8 u · 0,731 | +9,2 u · 1,000 |

### O que isso quer dizer

1. **`entrada-2` não sobrevive a esta rota, e a causa não é a arte.** Ela reprova
   o Gate −1 em rosto e corpo, e `porque-reprovou.ts` mostra que **97,4% do que
   mudou nas regiões protegidas é a própria peça** (ciano + preto novo), não
   boneco redesenhado. Ou seja: a reprovação é do desenho estar certo. A dívida
   já estava declarada em `base.ts:174-189` — a região do corpo virou silhueta
   justamente para salvar cabelo que cai AO LADO do tronco, e nada salva cabelo
   que cai NA FRENTE dele.
2. **A consequência é irrecuperável rio abaixo.** A extração descarta 26 354 px
   da peça, e o que sobra tem **piso de simplificação de 28,56 u** — ou seja,
   nem com N = 64 o erro cai. Não é decimação mal escolhida: é forma que uma
   poligonal fechada não representa. `escolherN` (`tracar-cabelo.ts:2223`) já
   sabia disso; o piso é que não era impresso.
3. **`entrada-3` é a mais limpa das três** — erro de 2,65 u, k = 1, sem perda por
   multi-componente, e cabe no `viewBox` sem encolher nada.
4. **A cobertura de traço cai com o tipo de peça** (71,9% → 50,0% → 35,7%), e
   isso é correto: peça colada na cabeça tem o contorno correndo sobre o preto da
   base, que `extrair.ts:188-190` descarta de propósito — ali quem desenha preto
   já é o contorno da cabeça.

---

## OS QUATRO DEFEITOS — causa medida e conserto

| # | o que o Doug viu | causa MEDIDA | conserto | número |
|---|---|---|---|---|
| 1 | traço preto ausente na franja | `converter.ts` nunca gerou `Cabelo.linhas`; a massa traçada é `fill` puro (`compositor.ts:165`) e quem desenha o preto é `.kk-cabelo-l` (`compositor.ts:324-328`) | `converter.ts` reusa `arcosComPreto` (`importar-peca.ts:760`) com uma sonda pela normal sobre `papeis === 4` | 0 arcos → **1 arco cobrindo 71,9%** do laço |
| 2 | traço preto muito grosso em cima | **HIPÓTESE CONFIRMADA: é o mesmo defeito 1.** A faixa no eixo mede **12,0 u = `TRACO` nominal** — um traço, não dois encostados. O traço de cima não estava grosso, estava sozinho | o do defeito 1 | faixa 12,0 u → 11,0 u (nominal 12) |
| 3 | silhueta da cabeça de leve, sem risco preto | **AS DUAS HIPÓTESES DO PLANO ESTAVAM ERRADAS.** Não é pele exposta (a sonda achou 5 066 dos 5 080 px "iguais à careca" sobre PRETO, não sobre pele) e não é degrau de tom. É **um arco preto de 12 u concêntrico com o crânio, 9 u para dentro**: a extensão é dilatada `SANGRIA` = 10 u para dentro (`converter.ts`), e `.kk-cabelo-e` leva contorno de 12 u no laço INTEIRO (`compositor.ts:168`), inclusive nessa emenda enterrada | `converter.ts` emite `atras: true` — a extensão entra antes do preenchimento opaco da cabeça (`compositor.ts:474-475`) e a emenda some sem clip, sem máscara e sem byte. O pipeline vigente já sabia (`tracar-cabelo.ts:2166-2175`) | aro **100,0% → 0,0%** do trecho coberto |
| 4 | faixa escura na coroa | o compositor desenha o contorno da cabeça e o especular DEPOIS da massa (`compositor.ts:476-492`) | `EstadoAvatar.massaPorCima` — a massa vai para depois do contorno, no mesmo clip | preto na coroa a 56 px **32 px → 13 px** |

Progressão medida na `entrada` (`coroa.ts`):

| configuração | escuros a 56 px | faixa no eixo |
|---|---|---|
| hoje (como o Doug viu) | 32 px | 12,0 u |
| + `linhas` (defeito 1) | 38 px | 12,0 u |
| + `atras:true` (defeitos 2 e 3) | 22 px | 11,0 u |
| + `massaPorCima` (defeito 4) | **13 px** | 11,0 u |

Nas outras duas: `entrada-2` 33 → 11 px, `entrada-3` 34 → 18 px.

### O defeito 4 fica pela METADE, e isso é geometria, não descuido

A leitura do close mediu: com `massaPorCima` a barra preta na coroa cai de
**12 u para 6 u**, não a zero. O que sobra é a **metade EXTERNA** do contorno da
cabeça. A causa é estrutural: o traço tem 12 u **centradas na linha de centro do
crânio** (`geometria.ts:851`, e `CABECA_H_EXTERNA = alt + TRACO` em `:401-402`),
e a massa é clipada nessa mesma linha (`compositor.ts:476`) — ela só pode cobrir
os 6 u de dentro. Não existe `stroke-alignment` em SVG e não há path paralelo no
repositório.

O que `massaPorCima` de fato entrega, medido: some o brilho especular vazando por
cima do cabelo, e a barra cai à metade. **Eliminar os 6 u restantes é decisão de
arte** — é dizer se o contorno da cabeça deve ou não aparecer por dentro do
cabelo — e não conserto de bug. Fica para o Doug.

---

## OS 92% — aplicados, e a AMARRA cumprida por construção

`EstadoAvatar` ganhou **dois campos opcionais**, `massaPorCima` e `escala`.
**Ausentes, `compor()` emite a mesma string byte a byte.** Medido:

| medida | valor |
|---|---|
| `compor()` sem `escala` | **7 418 bytes** — o congelado de `folha-base.ts:145` |
| `compor()` com `escala` | 7 468 bytes (+50) |
| `avatar:folha-base` | **19 formas / 7 418 bytes**, os dois congelados |
| `npm test` | **441 passando**, inclusive os 11 bytes+SHA de `parametrico-congelado.ts` |
| espaço acima da coroa | 46 u → **116 u** |
| boneco no quadro 56 × 70 | 61,7 px → **56,8 px** |
| traço no quadro | 1,20 px → 1,10 px |
| **peça crua a 100%** | tinta começa em y **0,0** — ✗ o viewport corta |
| **peça crua a 92%** | tinta começa em y **32,0** — · cabe |
| hash de `base-oficial.png` | `d8694eac68fa16ee` — **inalterado** |

O `<g transform="translate(20 74.6) scale(0.92)">` entra entre `</defs>` e a
sombra do chão, e fecha antes de `</svg>`. `FIGURA_Y0`/`FIGURA_Y1`/`FOLGA_BASE`
em `compositor.ts` derivam de `geometria.ts` — nenhum número mágico.

**A AMARRA é estrutural e não disciplina:** `base-oficial.ts` chama `compor()`
sem o campo, e o campo ausente não emite transformação nenhuma. A base de edição
não encolhe nem que alguém esqueça — não há ordem a obedecer, há um caminho que
não existe. `escala.ts` confere o hash mesmo assim.

---

## Verificação (rodada em 2026-08-06)

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` (arquivo não tocado) |
| `npm test` | **441 passando**, 24 arquivos |
| `npm run avatar:folha-base` | 19 formas / 7 418 bytes — os congelados |
| `npm run verify:pose` | perfil, marcos e unicidade de id, com as 4 fixtures reprovando |
| `npm run verify:all` | **1 violação: `verify:estado`** — e ela é **anterior**, provado restaurando os dois arquivos e reprovando igual. Consertar exige `npm run estado`, que escreve em `docs/` |

---

## O que está aberto

| # | pendência | quem decide |
|---|---|---|
| 1 | **Ligar `massaPorCima` e `escala` como padrão do produto.** Custa rebase de 7 418 bytes (`folha-base.ts:145`), dos 11 pares bytes+SHA (`parametrico-congelado.ts:46-102`, cobrados em CI), do alinhamento de `referencia-base.png` (`folha-base.ts:210-214`) e dos closes/mapa de facetas (`folha-base.ts:235-349`). E `.scratch/estilo/b4-dump-parametricos.ts`, o gerador dos SHAs, **não existe mais** | Doug |
| 2 | **`entrada-2` e as peças que cobrem rosto/tronco.** Ou a região protegida ganha exceção medida, ou artes desse tipo não entram por esta rota. Hoje elas amputam e o piso de simplificação estoura | Doug |
| 3 | **Massa multi-componente** continua perda medida e não consertada: `Cabelo.massa` é UM laço (`cabelo.ts:199`); representar dois é mexer no tipo do catálogo | Doug |
| 4 | **Os 92% seguem dimensionados contra necessidade não medida** — nenhum chapéu desenhado. Ressalva já aceita | Doug |
| 5 | **T1.5** (`docs/avatar/14-backlog-execucao.md:245-263`) continua aberta. Ela prevê duas saídas (re-traçar pela régua, vetada; crescer o `viewBox`, caro). Os 92% são uma **terceira** via, que não está escrita lá | Doug |
| 6 | Papel `luz` (3,6% na `entrada`, **30% na `entrada-3`**) sem correspondente no render de 2 tons | eu |
| 7 | `tresTons` sempre parte em três, mesmo em arte chapada — na `entrada-3` isso pôs 30% da peça em "luz" | eu |
| 8 | Fixtures G, H e I sintéticas não escritas | eu |
| 9 | `@visioncortex/vtracer` é **alpha**; `@neplex/vectorizer` deve sair (regressão de 62 px no topo) | risco |

## Duas réguas que erraram e foram consertadas nesta rodada

Ficam registradas porque o modo de falha se repete: **limiar de luminância
calibrado na ARTE não vale no RENDER.**

1. `coroa.ts` usava luminância < 90 para dizer "preto". `CABELO[1]` é `#6E4326`,
   luminância 76,5 — a massa inteira contava como traço e a régua devolveu
   144,0 u nas quatro configurações, o mesmo número para coisas visivelmente
   diferentes. Passou a classificar por distância em RGB até `--av-linha`,
   `--av-cabelo` e `--av-cabelo-s`.
2. `silhueta.ts` dizia "pele exposta" só por o render com peça ser igual ao
   careca. Dos 5 080 px marcados, **5 066 estavam sobre preto** — era traço
   coincidindo com traço. Passou a exigir que a careca tenha superfície ali.
3. `gate-menos-um.ts` imprimia o denominador de ladrilhos por divisão
   (`diferentes / fracao`); com zero diferentes a conta é 0/0 e saía `de 0`, que
   se lê como "nenhum ladrilho foi conferido". Agora `considerados` viaja no
   laudo.
4. `folha.ts` tinha **doze números da `entrada.png` escritos à mão no HTML** e um
   título fixo. Rodada em outra arte, ela mentia. Todo número agora é calculado
   na hora, e o Gate −1 é executado em vez de transcrito.

## O que NÃO fazer ainda

Virar skill, escrever em `docs/`, colar em `CABELOS`, adicionar script ao
`package.json`, ligar os dois campos novos como padrão.

---
---

# EXECUÇÃO DO PLANO — bloco a bloco, com o número medido

> Regra 6 do plano: cada bloco termina escrevendo aqui o que mediu, o valor e
> contra que teto. Não é relatório — é o único jeito de o Bloco 5 saber o que o
> Bloco 1 descobriu depois de um resumo de contexto.

## BLOCO 1 — as réguas ganham controles (2026-08-06)

**Comando:** `npx tsx .scratch/arte/reguas-conferidas.ts`
**Número do bloco: 15 de 15 asserções passando** — as 12 do plano (4 réguas × 3)
mais 3 da régua nova da **barra**, que a regra 2 manda existir antes do Bloco 3.

### As 15 asserções, e o que cada uma mede

| régua | papel | o que afirma | medido |
|---|---|---|---|
| `coroa` | PASSA | careca é o PISO da régua | careca **1 px** · curto 17 · com faixa 51 |
| `coroa` | REPROVA | faixa injetada sobe acima do piso | **51 px** contra piso 1 (+50) |
| `coroa` | SEPARA | `faixaU` separa 1 traço de 2 encostados | curto **11,0 u** · com faixa **23,0 u** (fronteira 18) |
| `silhueta` | PASSA | `CABELOS.coque` sem extensão: o preto CRUZA a normal | aro **6,8%** em −10 u |
| `silhueta` | REPROVA | extensão sem `atras`: a emenda corre junto | aro **99,7%** em −7 u (**15×**) |
| `silhueta` | SEPARA | o que separa é o ARO, não a pele | aro 15× · pele 4,7 → 6,0% (**1,3×**) |
| `barra` | REPROVA | com `massaPorCima` a barra NÃO some | **6,0 u**, de +0,5 a +6,0 |
| `barra` | SEPARA | sem `massaPorCima` ela é mais grossa | **12,0 u** → **6,0 u** (nominal 12) |
| `barra` | PASSA | o que sobra é a metade EXTERNA | de +0,5 a +6,0 contra −5,5 a +6,0 |
| `escala` | PASSA | careca 100% e 92% | 61,7 → **56,8 px** (razão **0,9206**) |
| `escala` | REPROVA | peça crua a 100% encosta no teto | y **0,0** ✗ (pico −39,7 u) |
| `escala` | SEPARA | a mesma peça a 92% cabe | y **32,0** · cabe |
| `porque` | PASSA | `entrada` é repintura | **98,4%** repintura, 8 735 px |
| `porque` | REPROVA | `entrada-2` é a própria peça | **97,4%** peça, 26 857 px |
| `porque` | SEPARA | fixture F cai em "preto novo" | **289 px** preto novo · **0 px** ciano |

### O NÚMERO ERRADO, reproduzido — é o que prova que o conserto conserta

Os dois métodos defeituosos ficaram **preservados no código** (`MetodoDePreto` e
`MetodoDePele`), e a folha de conferência roda os dois:

| régua | método antigo | o que ele devolve |
|---|---|---|
| `coroa` | `luminancia` (limiar 90 da ARTE no RENDER) | curto **89,0 u** e com faixa **89,0 u** — **diferença 0,0** contra 12,0 do método por cor |
| `silhueta` | `igualdade` ("igual à careca" basta) | pele **90,1%** contra 6,0% do método que exige superfície |

### QUATRO ERROS NOVOS que só os controles pegaram

Nenhum destes aparecia rodando a régua na arte real. Todos apareceram no primeiro
minuto em que um controle conhecido foi passado por elas.

1. **`silhueta.ts` media contra denominador ZERO — vacuidade total.** `cobertos`
   perguntava se, a **±4 u** da fronteira, o render com peça diferia do careca.
   Ali os dois são pretos nos dois casos, porque o contorno da cabeça tem 12 u
   **centradas** na fronteira e vai por cima de tudo. `CABELOS.coque`, que cobre a
   coroa inteira, devolvia **`cobertos = 0`** e com isso `aro = 0/0 = 0`. A régua
   dizia "não há aro" **por vacuidade**, e teria dito o mesmo de qualquer peça.
   Conserto: coberto = a peça pinta **logo por dentro** da fronteira, de meio traço
   para dentro até o alcance. `curto` passou de 0 para **1 095 de 2 262** pontos.
2. **`silhueta.ts` classificava FUNDO como pele exposta.** Fora do crânio, onde a
   peça não chega, o render com peça é idêntico ao careca — os dois mostram fundo,
   que tem luminância alta. `CABELOS.coque` acusava **100,0% de pele exposta** numa
   touca que não deixa um milímetro de testa à mostra. Conserto: pele só existe
   **dentro da máscara do crânio**, que a sonda já carregava. 100,0% → **4,7%**.
3. **A janela do `aro` começava EM CIMA da borda interna do traço.** Ela ia até
   −6 u, e −6 é exatamente onde o contorno de 12 u centradas acaba. `CABELOS.coque`,
   sem extensão nenhuma e portanto sem emenda de sangria possível, acusava **9,3%
   de aro em −6 u**. Era o contorno legítimo medido no último pixel dele. Conserto:
   a janela começa em `−TRACO/2 − PASSO`, o primeiro deslocamento estritamente fora
   do traço. 9,3% → **6,8%**, e o que sobra é a borda da própria franja.
4. **`coroa.ts` não tem piso zero, e o plano supunha que tinha.** A régua conta
   preto **dentro da calota**, e na careca o arco superior do contorno da cabeça
   corre por ali legitimamente. O piso medido é **1 px**, não 0 — pequeno, mas o
   zero da régua é a careca e não o número 0.

E um quinto, que era erro do **controle** e não da régua: a faixa preta injetada
usava os 4 cantos de um retângulo, e `laco()` fecha por spline centrípeta. Com
lado longo de 204 u contra 12 u de altura a spline dá **overshoot** — pontos de
controle em y 68,2 e 106,8 para uma forma declarada de 81,5 a 93,5. O render
mostrava **duas** barras de 12 u separadas por fill claro, não uma de 24. Com um
ponto a cada 24 u a spline segue o retângulo e a barra sai com **23,0 u**.

### O que isto muda para os blocos seguintes

- **A barra é a régua do Bloco 3.** Ela nasceu vermelha como a regra 2 manda: na
  build de hoje, com `massaPorCima` ligado, ela acusa **6,0 u de +0,5 a +6,0** — a
  metade EXTERNA do contorno da cabeça, exatamente o que a leitura do close viu. O
  alvo de A e de B é **0,0 u**.
- **Os números de `aro` e `pele` da tabela R0 estão obsoletos** para as três artes,
  porque o denominador mudou. Os da tabela acima são os válidos.
- `escala.ts` e `porque-reprovou.ts` passaram a exportar `medirEscala()` e
  `porqueReprovou()`. Antes só sabiam imprimir, e um número que só existe dentro de
  um `console.log` não pode ser conferido nem consumido por gate.

---

## BLOCO 2 — o traço volta, o gate inverte, a cor ganha amarra (2026-08-06)

### 2a — cobertura de arco: o traço coincidente voltou

`extrair.ts` só aceitava como traço o que era *escuro agora **e** não escuro
antes*. Onde o contorno da peça corre sobre o preto da base, ele era descartado —
e quanto mais o cabelo abraça a cabeça, mais do próprio contorno dele ia fora.

O critério de volta é **conectividade 4-vizinhança ancorada no ciano**: preto que
encosta na peça é da peça, preto solto é do boneco. A âncora de alcance é `TRACO`
unidades a partir do ciano — sem ela, o contorno do crânio conduziria a inundação
para o queixo, o pescoço e o tronco, e o boneco inteiro viraria peça pelo caminho
de um pixel de encosto.

| arte | cobertura de arco | desvio da massa | **piso da curva** |
|---|---|---|---|
| `entrada` | 71,9% → **80,0%** (1 arco) | 4,60 → 5,56 u | 1,48 → 2,71 u |
| `entrada-2` | 50,0% → **54,2%** (2 arcos) | 28,99 → **5,88 u** | 28,56 → **1,14 u** |
| `entrada-3` | 35,7% → **70,8%** (3 arcos) | 5,80 → 3,99 u | 0,56 → 0,80 u |

**O piso de simplificação da `entrada-2` desabou de 28,56 u para 1,14 u.** A regra
4 do plano previa que a inversão do gate sozinha não resolveria o piso, e estava
certa — quem resolveu foi o 2a. Com o contorno devolvido, a máscara deixa de ser
uma forma amputada e a poligonal fechada passa a representá-la: não era decimação
mal escolhida nem forma impossível, era **falta de metade da tinta**.

Regressão pequena e declarada: a `entrada` passou a ter **2 componentes** na massa
(eram 1), com **678 px = 471 u²** fora do laço. `bordaOrdenada` percorre uma só.

### 2b — o Gate −1 em três tempos, e a `entrada-2` deixa de reprovar

A ordem passou a ser: **hash + dimensão** → **ciano** (máscara preliminar, sem
olhar a base) → **registro + NCC sobre `região ∧ ¬peça`** → e só então, com o
registro provado, o traço completa o contorno.

Três consertos de viés junto:

- **a máscara de registro saiu do tronco e foi para o rodapé** (abaixo de
  `Y_FIM_TRONCO`, y ≥ 815,6 px, mais a sombra do chão). O tronco pode ser coberto
  pela peça, e cada pixel de peça entrava no `sad` como resíduo que não zera em
  (0, 0, 1) — com `TOL_DESLOCAMENTO = 1`, bastavam 2 px de viés para acusar um
  gerador que não mexeu em nada;
- **piso de área declarado** (`PISO_AREA_REGISTRO = 50%` do rodapé). Medido:
  **99,9% · 99,8% · 100,0%** nas três artes. É rede, não teto — existe para o dia
  em que alguém desenhar uma peça que desça até o chão;
- **`porque-reprovou` entrou no laudo e não sai mais**, aprovada ou reprovada.
  Com a inversão a peça passa a ser *definida* pelo teste de matiz em vez de
  conferida, e imprimir sempre a causa é o que quebra a circularidade.

E uma **orla de 2 px** na máscara da peça, para a NCC: toda borda vetorial
rasterizada tem ~1 px de antialiasing que não é ciano o bastante nem escuro o
bastante, e sem a orla a `entrada-2` continuava marcando ladrilhos ao longo de
todo o contorno da mecha.

| arte | rosto: ladrilhos / maior grupo | corpo: ladrilhos / maior grupo | veredito |
|---|---|---|---|
| `entrada` | 0 / 0 (era 0 / 0) | 3 / **1** (era 1 / 1) | **APROVADA** |
| `entrada-2` | **0 / 0** (era 13 / 4) | **2 / 1** (era 87 / 8) | REPROVADA → **APROVADA** |
| `entrada-3` | 0 / 0 | **0 / 0** (era 5 / 1) | **APROVADA** |

**AS SEIS FIXTURES MANTIVERAM OS SEIS VEREDITOS EXATOS** — é a asserção que
importa neste bloco, e é o que separa "o gate ficou certo" de "o gate afrouxou":

| A dimensões | B desloc. | C escala | D recorte | E antialias | F corpo |
|---|---|---|---|---|---|
| REPROVA | REPROVA | REPROVA | REPROVA | **APROVA** | REPROVA |

**Um buraco foi aberto e fechado no mesmo bloco.** A primeira versão de
`mascaraDaPeca` tinha uma exceção: preto novo, mesmo sem encostar em ciano
nenhum, virava peça. A fixture F é um quadrado **preto** de 14 u colado no tronco,
sem um pixel de ciano — com aquela exceção ela era lida como cabelo legítimo e o
gate aprovava. A regra ficou a do plano, sem cláusula. Custo nas artes reais:
**zero** — os três números de cobertura acima são idênticos com e sem a exceção,
porque nelas o preto sempre encosta no ciano.

### 2c — cor proibida na base de edição

`npx tsx .scratch/arte/cor-proibida.ts` roda a régua de matiz de `extrair.ts` sobre
**toda cor emitida** no `base-oficial.svg` (`fill`, `stroke`, `stop-color`,
`--av-*`) e reprova se alguma cair em 180° ± 30° com saturação ≥ 0,18.

**Margem medida hoje: 138,2° — 4,6× a tolerância.** A cor mais próxima do ciano na
base é `#c9bfa8` (o pano) a 42°.

E o aviso, que é a razão de o teste existir — três cores da paleta cairiam
**dentro** da janela se fossem emitidas:

| cor | matiz | distância |
|---|---|---|
| `FUNDO[5]` água `#95D2CB` | 173° | **6,9°** |
| `CABELO[7]` azul `#3E7CA8` | 205° | 24,9° |
| `FUNDO[0]` azul `#BBD4E8` | 207° | 26,7° |

### O que continuou intocado (a asserção negativa)

| gate | resultado |
|---|---|
| `npm test` | **441 passando**, 24 arquivos — os 11 pares bytes+SHA inclusive |
| `npm run avatar:folha-base` | **19 formas / 7 418 bytes** — os dois congelados |
| `reguas-conferidas.ts` | **15 de 15**, depois de o Bloco 2 mexer na extração |

Nenhum dos cinco `CABELOS` passa por `extrair()`, e é por isso que a inversão não
podia movê-los — mas medir foi o que provou.

### Um quinto erro de régua, achado pelo Bloco 2

`silhueta.ts` media **pele em qualquer profundidade** e chamava isso de fresta.
Com a peça nova a `entrada` acusou **42,7%** — e não havia fresta nenhuma: a 18 u
para dentro do crânio simplesmente não há cabelo, porque a franja é fina.

A hipótese (b) é específica — *"sobra um crescente de pele ENTRE a massa e o
traço"* —, então a régua passou a olhar a **primeira amostra estritamente fora do
traço** (−6,5 u). Medido: **0,2%** no `curto` e **0,1%** na peça. A hipótese (b)
cai, e o que separa os dois controles é o aro (6,8% → 99,9%, **15×**).

A `peleBruta` ficou como diagnóstico separado, e é onde o método antigo continua
errando: **19,8% contra 7,7%**.

---

## BLOCO 3 — a bancada A × B (2026-08-06)

**Comando:** `npx tsx .scratch/arte/bancada-ab.ts`
**Chave:** `EstadoAvatar.arquitetura?: "A" | "B"` — temporária, o Bloco 4 remove.

### A TABELA

| eixo | hoje | **A** | B | vence |
|---|---|---|---|---|
| barra enterrada · `entrada` / `-2` / `-3` | 31,1 / 31,9 / 31,0% | 23,9 / 13,4 / 11,4% | **21,1 / 10,9 / 10,5%** | B, por 2–3 pontos |
| preto na coroa a 56 px | 14 / 13 / 25 px | **9 / 8 / 12 px** | 12 / 8 / 17 px | **A** |
| perda da clara | 0 / **3 165** / 0 u² | **1 / 1 / 2 u²** | 0 / **3 165** / 0 u² | **A** |
| perda da massa | **471** / 0 / 0 u² | **0 / 0 / 0** | **471** / 0 / 0 u² | **A** |
| multi-componente representável | não | **SIM** | não | **A** |
| serve chapéu sem invenção nova | — | **SIM** | não | **A** |
| formas do composto (teto 26) | 23 | **22** | 24 | **A** |
| bytes do composto (teto 10 240) | 13 282 / 11 027 / 10 932 | 13 357 / 11 207 / **10 169** | 15 077 / 11 967 / 11 849 | A ≈ hoje; B é a pior |
| 30 bonecos a 56 px (mediana de 3) | 199 ms | 229 ms | 176 ms | **não decide** — ver abaixo |
| conceitos que a peça declara | 7 | **4** | 7 | **A** |
| passos do converter | 6 | **4** | 7 | **A** |

**A vence 7 eixos, B vence 1, e 2 não decidem. Não houve empate, então a regra 7
não disparou e a execução seguiu.**

**O tempo não decide, e isso é resultado e não omissão.** Três rodadas da bancada
deram, para (hoje · A · B): 221/177/172, depois 162/203/195, depois as medianas
199/229/176 com amostras de 178 a 282 ms para A. **A ordem inverteu entre
rodadas.** A dispersão de um render de navegador é da ordem da diferença que se
queria medir; reportar isso como vantagem seria decidir por sorteio. Passou a ser
mediana de 3, e o registro é: as três faixas se sobrepõem.

**Os bytes estouram o teto nas três configurações**, e isso é anterior à bancada —
uma peça traçada de arte real tem mais pontos que uma paramétrica. O doc 15:463 já
declara que teto de bytes não veta arte aprovada. A única combinação que cabe é
**A com a `entrada-3`: 10 169 bytes, 71 de folga.**

### Invariantes — nenhum se moveu

| invariante | resultado |
|---|---|
| os cinco paramétricos byte a byte com a chave ligada | **5/5** em A e em B |
| as fixtures A–F | os **seis vereditos exatos** |
| `npm run verify:pose` | perfil, marcos e unicidade, com as 4 fixtures reprovando |
| `npm run typecheck` | limpo (inclui `tsconfig.scripts.json`) |

### A RÉGUA DA BARRA ERROU DUAS VEZES, e as duas correções são o achado do bloco

**Primeira versão** — largura a meia altura do perfil de preto agregado ao longo do
perímetro. Ela mediu **A 24,5 u contra hoje 6,0 u**, ou seja, disse que A era três
vezes pior. A leitura do close por subagente disse o contrário, e com detalhe:

> *hoje*: arco preto atravessando a coroa de ponta a ponta, castanho dos dois
> lados em todo o percurso, mesmo raio de ombro do crânio do painel careca.
> *A*: nenhum traço preto com castanho dos dois lados; coroa limpa.
> *B*: só um fragmento à direita, x≈1595–1615.

A causa: a agregação **só funciona quando o preto é concêntrico** com o crânio. Em
A o traço corre pela borda da PEÇA, que não é concêntrica, e um perfil estreito em
cada ponto vira um perfil largo no conjunto.

**Segunda versão** — traço com cabelo dos dois lados, ponto a ponto. Melhor, mas
ainda contava o contorno legítimo de uma mecha desenhada **sobre** a massa: A dava
33,9% num render descrito como limpo.

**Versão final** — traço com cabelo dos dois lados **que cruza d = 0**. O contorno
do crânio tem 12 u CENTRADAS na fronteira por construção (`geometria.ts:851`): se a
corrida não contém a fronteira, ela não é ele. Nenhum limiar, nenhuma janela
escolhida.

E o controle que separa esta régua da anterior é a **careca**: o contorno dela está
lá, inteiro e visível, e uma régua de "preto perto da fronteira" acusaria 12 u. A
que mede "cabelo dos dois lados" dá **0,0%**, que é a resposta certa.

### Por que A vence, em uma frase por eixo

- **coroa**: A cobre os 12 u inteiros por oclusão; B cobre o que a extensão alcança;
- **perda**: em A a peça é multi-forma por construção, então a segunda componente
  tem para onde ir. Foi preciso implementar `Cabelo.claras` para isso — antes do
  conserto A perdia **5 939 u²** na `entrada-2`, pior que hoje;
- **chapéu**: um chapéu não tem "massa dentro do crânio" para o clip cortar. Em A é
  o mesmo caminho da peça sobreposta; em B precisaria de um terceiro caminho;
- **simples**: A declara 4 conceitos contra 7, e o converter dá 4 passos contra 6.
  Somem `atras`, `sangria`, `massaPorCima` e a partição massa/extensão.

**Verdade desconfortável registrada:** B ganha o eixo que abriu o bloco, por 2 a 3
pontos percentuais de barra enterrada. O resíduo das duas é o mesmo tipo de coisa —
contorno de mecha cruzando a fronteira do crânio — e nenhuma das duas chega ao alvo
de 0,0%. A diferença entre elas nesse eixo é menor que a diferença entre qualquer
uma delas e o estado de hoje (31%).

---

## BLOCO 4 — A vence, o perdedor sai, a rota gradua (2026-08-06)

### O que SAIU — porque o ganho de simplificação só é real se o perdedor sair

| o quê | onde morava | por que morreu |
|---|---|---|
| `EstadoAvatar.massaPorCima` | `tipos.ts` | só conseguia levar a barra de 12 u a 6 u; a peça sobreposta a leva a zero por oclusão |
| `EstadoAvatar.arquitetura` | `tipos.ts` | a chave da bancada, temporária por escrito desde que nasceu |
| o `atras` da peça traçada | `converter.ts` | não há cabeça opaca no caminho de uma peça desenhada por cima |
| a **sangria** da conversão | `converter.ts` | ela costurava duas camadas que viraram uma |
| a **partição massa/extensão** | `converter.ts` | não existe fronteira em que cortar uma peça sem clip |
| `bancada-ab.ts` | `.scratch/arte/` | mede uma chave que não existe mais; o registro dela é esta seção |
| `bancada.ts` | `.scratch/arte/` | comparava vetorizadores, e a rota não usa nenhum — converte por `bordaOrdenada` + decimação |

**Os três donos possíveis do contorno do cabelo viraram um: a própria peça.**

### O modelo novo, escrito como PEÇA SOBREPOSTA e não como "o jeito do cabelo"

É ele que os 6 chapéus vão usar — cabelo e chapéu são as únicas 11 de 33 peças do
catálogo que batem no problema da fronteira do crânio. Escrito como caminho do
cabelo, obrigaria a inventar um segundo caminho para o chapéu.

| conceito | o que é |
|---|---|
| `Cabelo.massa` | o laço principal, em `{t,y}` |
| `Cabelo.clara` + `Cabelo.claras` | a região clara, multi-forma |
| `Cabelo.linhas` | os arcos de índice que a massa traça |
| `Cabelo.formas` | as formas irmãs (`FormaDaPeca`), cada uma com arcos próprios |

`FormaDaPeca` é o tipo comum de uma extensão paramétrica e de uma forma irmã;
`Extensao` passou a ser `FormaDaPeca & { atras? }`. Um tipo em vez de dois.

### As três artes pelo modelo final

| medida | `entrada` | `entrada-2` | `entrada-3` |
|---|---|---|---|
| cobertura de arco | **100,0%** (1 arco) | **82,5%** (2 arcos) | **87,5%** (2 arcos) |
| perda da massa | **0 u²** | **0 u²** | **0 u²** |
| perda da clara | **1 u²** | **1 u²** | **2 u²** |
| Gate −1 | APROVADA | APROVADA | APROVADA |

Comparado ao fim do Bloco 2 (80,0 / 54,2 / 70,8% de arco): o laço agora é a peça
inteira, então a sonda encontra preto em quase toda a borda — que é o certo, porque
agora **toda** essa borda é externa.

### A rota GRADUOU

`.scratch/arte/` → **`scripts/avatar/arte/`**, 25 arquivos versionados. Entradas
novas no `package.json`:

```
arte:base · arte:fixtures · arte:gate · arte:causa · arte:extrair · arte:contorno
arte:converter · arte:silhueta · arte:coroa · arte:escala · arte:folha
arte:reguas · arte:cor-proibida · verify:arte
```

**A graduação já pagou no primeiro minuto:** `tsconfig.scripts.json` cobre
`scripts/`, então `npm run typecheck` passou a checar a rota — e acusou na hora um
resto de `massaPorCima` na `folha.ts` que o `.scratch/` escondia (o `tsconfig.json`
só inclui `src/`).

Um `.gitignore` próprio separa o que gradua do que se regenera: as pastas por arte,
as fixtures, os painéis e a folha ficam de fora.

**O backup de `C:\Users\Lenovo\Desktop\recruta64-arte-backup\` foi APAGADO**, depois
de conferir hash a hash que as três artes, a base, o SVG, o manifesto e o pedido ao
Gemini estavam byte a byte idênticos no destino.

**Um passo que o plano não previu, e que era risco real:** apagar o backup antes de
`git add` deixaria as três artes irreproduzíveis expostas a um `git clean -xdf`, que
remove arquivos NÃO RASTREADOS. A rota foi posta no índice primeiro. Elas continuam
sem commit — commitar não foi pedido.

### ✗ A PROMESSA QUE NÃO SE CUMPRIU

O plano dizia: *"o `git diff` mostrando mais linhas removidas que acrescentadas"*.
**Não é o que aconteceu.** Medido nos arquivos de produto:

| | acrescentado | removido | saldo |
|---|---|---|---|
| **código** | 51 | 15 | **+36** |
| comentário | 123 | 28 | +95 |

O `converter.ts` também cresceu — 534 → 546 linhas — apesar de ter perdido a
divisão e a sangria.

**A simplificação é real, mas ela não mora em contagem de linha:** a peça declara
**4 conceitos contra 7** e o converter dá **4 passos contra 6** (medido no Bloco 3).
O que subiu foram funções e tipos novos no compositor — `pecaSobreposta`,
`FormaDaPeca`, `pathExtensaoLinhas`, `Cabelo.formas`, `Cabelo.claras` — enquanto a
economia se concentrou no converter, cujo ganho não aparece no diff porque ele
mudou de pasta no mesmo bloco. Contar linha era a régua errada, e o plano a
escolheu antes de saber disso.

### Verificação do bloco

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, agora **incluindo a rota** |
| `npm test` | **441 passando** |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm run avatar:folha-base` | **19 formas / 7 418 bytes** — os congelados |
| `npm run verify:pose` | perfil, marcos e as 4 fixtures reprovando |
| `npm run arte:reguas` | **15 de 15** |
| `npm run arte:cor-proibida` | PASSA, margem 138,2° |
| `npm run arte:gate` × 3 | as três APROVADAS |

**O controle negativo da barra teve de ser RECONSTRUÍDO**, e isso é consequência
direta do bloco: o arranjo que produzia o defeito — massa clipada, extensão por
fora, contorno da cabeça exposto entre as duas — deixou de existir. Uma régua sem
controle negativo devolve 0% e ninguém sabe se é conserto ou vacuidade; foi
exatamente assim que o `cobertos` zerado passou despercebido. O controle novo é um
**anel derivado de `CABECA.contorno`** (nunca desenhado à mão), em duas versões: de
`+TRACO/2` para a barra e de `−SANGRIA` para o aro. Medido:

| régua | controle que reprova | careca | peça sobreposta |
|---|---|---|---|
| barra enterrada | anel externo **93,8%** | **0,0%** | 23,9% |
| aro da sangria | anel enterrado **94,2%** | — | 6,8% (o `curto`) |

---

## BLOCO 5 — os 92% viram padrão (2026-08-06)

`ESCALA_PADRAO = 0.92` em `compositor.ts`. O campo `escala` continua opcional, mas
**ausente agora significa 92%**, não 100%.

### Os números do bloco

| medida | antes | depois |
|---|---|---|
| espaço acima da coroa | 46 u | **116 u** |
| boneco no quadro 56 × 70 | 61,7 px | **56,8 px** |
| traço no quadro | 1,20 px | **1,10 px** |
| peça crua, tinta começa em | **y 0,0 ✗ encosta** | **y 33,0 · cabe** |
| `compor()` da base de edição | 7 418 bytes | **7 418 bytes** (inalterado) |
| `compor()` do produto | — | **7 468 bytes** (+50, o `<g transform>`) |
| hash de `base-oficial.png` | `d8694eac68fa16ee` | **CONFERE** |

### O rebase — e ele foi EXATAMENTE o que o plano autorizou

| o quê | de | para |
|---|---|---|
| teto da base careca (`folha-base.ts`) | 7 418 | **7 468** |
| formas da base | 19 | **19** (um `<g>` não pinta) |
| os 11 pares bytes+SHA | — | **regerados**, todos +50 bytes |

**Nenhum outro selo se moveu.** `verify:pose` passou, os outros 435 testes também,
e `conferirSvg` continua com 0 problemas. A regra 7 não disparou.

### O gerador dos SHAs foi REESCRITO, e ele nasceu versionado

O original morava em `.scratch/estilo/b4-dump-parametricos.ts` e tinha sumido — o
arquivo congelado dizia "gerado por" um script que não existe, o que é a mesma
coisa que dizer "escrito à mão". O novo é
**`scripts/avatar/estilo/dump-parametricos.ts`**, com entrada `npm run
avatar:congelar`.

O docstring do arquivo gerado ganhou o **segundo motivo legítimo** de regerar:
*"quando uma decisão declarada muda o que `compor()` emite para todos"* — antes só
existia o primeiro (um dos cinco ser re-traçado).

### A DECISÃO DE ARQUITETURA QUE O PLANO NÃO NOMEOU: quem pede `escala: 1`

O plano listava rebase de `REF_X/REF_Y/REF_ESCALA` e dos closes/mapa de facetas.
**Não foi preciso rebasear nenhum deles**, e a razão é conceitual: a escala é
transformação **externa**, e esses números descrevem o **sistema de coordenadas
interno**, que não mudou. Medir a pose depois de encolher seria medir a régua.

Então quem mede geometria interna passou a pedir `escala: 1` **explicitamente**,
com o motivo escrito ao lado:

| arquivo | por quê |
|---|---|
| `folha-base.ts` (closes e matriz) | comparam com `referencia-base.png`, que é a arte no sistema interno |
| `verificar-pose.ts` | perfil, marcos e unicidade de `id` são do sistema interno |
| `fidelidade.ts` | compara arte × render, e a arte foi medida a 100% |
| `arte/silhueta.ts` | a sonda anda pela fronteira que ela desenha de `pathCabeca()` |
| `arte/coroa.ts` | a `CALOTA` sai de `CAIXA_CABECA` em coordenadas do `viewBox` |
| `arte/fixtures.ts` | a simulada é desenhada sobre a base de edição |
| `arte/base-oficial.ts` | **a amarra** — a base de edição não encolhe |

O teto de bytes de `folha-base.ts` é a exceção deliberada: ele mede o que o
**produto** emite, então usa o padrão e foi rebaseado.

### A AMARRA MUDOU DE NATUREZA, e isso é um enfraquecimento declarado

Antes: `base-oficial.ts` chamava sem o campo, o campo ausente não emitia
transformação, e a base não encolhia **nem que alguém esquecesse** — não havia
ordem a obedecer, havia um caminho que não existia.

Agora é **uma linha que alguém pode apagar**. A troca foi consciente e tem preço, e
o preço é `arte:escala`: a conferência do hash do PNG contra o manifesto deixou de
ser zelo e virou a única coisa entre o gerador e uma base encolhida. Por isso ela
entrou no `verify:arte`, que agora roda **fixtures → réguas → cor proibida →
escala**.

### Uma régua quebrou na hora, e o modo de falha é o de sempre

`escala.ts` foi escrito quando o padrão era 1, e por isso o caso "100%" **omitia** o
campo. Com o padrão a 92%, ele passou a renderizar 92% nos dois lados e a folha
mostrou `careca 100%` e `careca 92%` com **o mesmo número**. É a terceira vez nesta
rota que uma régua devolve o mesmo valor para coisas diferentes.

Conserto: a escala é explícita nos dois lados. **Um medidor de escala que herda o
padrão mede o padrão, não a escala.**

### Os dois riscos que o plano mandou medir renderizando — os dois fechados

| risco | medido | veredito |
|---|---|---|
| `transform-origin: 250px 622px` de `.kk-respira` dentro do wrapper | parado y 110,5–678,5 · meio do respiro y 100,5–678,5 → topo **−10,0 u**, base **0,0 u** | · a figura **se move, não se deforma** — e a base ficar parada é o certo, a origem está no chão |
| `fidelidade.ts:491` mistura `CAIXA_CABECA.y0` cru com coordenada do render | valor cru **39,5 u** · medido no render a 100% **39,5 u** | · diferença **0,0 u**, os dois falam do mesmo ponto |

### Verificação do bloco

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo |
| `npm test` | **441 passando**, com os 11 SHAs **remedidos de propósito** |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm run avatar:folha-base` | **19 formas / 7 468 bytes**, `conferirSvg` 0 problemas |
| `npm run verify:pose` | perfil, marcos e as 4 fixtures reprovando |
| `npm run verify:arte` | **15/15**, cor proibida PASSA, hash da base CONFERE |

---

## BLOCO 6 — a folha em forma de decisão (2026-08-06) — **PARCIAL**

**Comando:** `npm run arte:folha`

### O que ficou pronto

| medida | antes | depois |
|---|---|---|
| altura da folha | **5 911 px** (fatiada em 3 para ler) | **541 px** |
| largura | 1 280 | 1 560 |
| lida por subagente **sem fatiar** | não | **SIM** — o número do bloco |

Organizada pelas três decisões abertas e não pelas etapas do programa:
**(1)** as três artes a 56 px com o `[curto]` aprovado **ao lado**, nos quatro fundos
do doc 16 §8; **(2)** a faixa de closes da coroa, cinco painéis lado a lado sem
quebra; **(3)** o que não está resolvido, nomeado. Os números foram para o
terminal — número em imagem não é copiável nem buscável.

Os 56 px são **rasterizados no tamanho real** e ampliados por
`image-rendering: pixelated` sobre o bitmap, nunca por `transform: scale()`, que
reamostra do vetor e entrega uma imagem mais nítida do que o produto mostra.

### ✗ O QUE FALTA — e é só enquadramento, não medição

O recorte do close ainda **aperta o ápice**. Três leituras por subagente, e a
última ainda disse *"o topo da massa toca ou é cortado pela borda superior"* em 4
dos 5 painéis. Duas causas já consertadas (o `clip-path` com duas unidades na
mesma conta; o close renderizado a 100%, onde o `viewBox` guilhotina) e uma que
ficou: a altura de 188 px é apertada para um domo, e reduzida a ~300 px de largura
o painel vira uma fatia fina. `naTela()` já existe para resolver — falta usá-la
para o fundo do recorte também.

**Nada disso bloqueia decisão de arte:** a folha gera, cabe numa tela e os cinco
painéis são comparáveis entre si.

---

## BLOCO 6b — o enquadramento vira número, e duas coisas escritas acima estão erradas (2026-08-06)

**Comando:** `npm run arte:folha`

### As DUAS correções ao que está escrito na seção acima

A seção do Bloco 6 foi escrita antes da última rodada de conserto e ficou velha em
dois pontos. Medido agora, a régua nova é quem está certa:

| o que a seção acima diz | o que a medição diz |
|---|---|
| *"a altura de 188 px"* | o recorte já era **718 × 383 px** — `naTela` **já estava** aplicada ao fundo |
| *"o topo da massa toca ou é cortado"* | **nada era cortado**: havia **24 px = 12,0 u** de ar acima da tinta mais alta |

**A impressão de leitura não estava mentindo — estava respondendo outra pergunta.**
Um traço inteiro de ar prova que o ápice está dentro do quadro, e prova mesmo. Só
que o painel não é olhado a 718 px: são cinco lado a lado em 1 560, ou seja ~299 px
cada, e 12 u viram **10 px de ar num painel de 159**. A geometria estava certa e o
enquadramento estava apertado ao mesmo tempo, porque são duas perguntas diferentes.

### O DEFEITO QUE NINGUÉM TINHA REGISTRADO: o corte é LATERAL, não no topo

Medido na faixa do recorte, no render de 1 400 px:

| painel | tinta em x | cortada esq / dir |
|---|---|---|
| `entrada` | 72–947 | **82 / 75 px** |
| `entrada-2` | 42–947 | **112 / 60 px** |
| `entrada-3` | 110–896 | **44 / 24 px** |
| `[curto]` · careca | 167–859 | 0 / 0 |

A causa é a mesma que o comentário do topo já nomeava, aplicada ao lado errado: as
laterais saem de `CAIXA_CABECA`, que descreve o **CRÂNIO** (x 178–848 na tela),
enquanto o que precisa caber é a **PEÇA**.

**E o conserto foi recusado, com o preço medido.** Enquadrar a peça inteira pede
**953 dos 1 000 px** do render — deixaria de ser close e viraria a figura em faixa:

| recorte | dimensão | proporção | ampliação na tela |
|---|---|---|---|
| hoje (crânio + 1 traço) | 718 × 383 | 1,87:1 | **0,83 px/u** |
| peça inteira, meia cabeça | 953 × 383 | 2,49:1 | 0,63 px/u (**−24%**) |
| peça inteira, sobrancelha | 953 × 333 | 2,86:1 | 0,63 px/u |

Subir o fundo do recorte não estreita: a mecha larga já está lá em cima — com o
fundo a y 340 a união ainda mede x 89–947.

Perder 24% de ampliação **no lugar que o painel existe para julgar**, para mostrar
mecha que a seção 1 já mostra inteira nos quatro fundos, é troca ruim. Close corta;
o que não pode ser cortado é o ápice. O corte lateral ficou **escrito como
deliberado** no código, porque sem isso ele volta como bug na próxima leitura.

### O conserto, e a régua que ele deixa para trás

A folga passou de **1 para 2 traços**, e o segundo está declarado como escolha de
enquadramento e não como medida — é o tamanho em que a folha é olhada que o pede.

O que virou medida é a linha nova no terminal: `caixaDaTinta` roda **no bitmap já
recortado** e diz, painel a painel, quanto ar sobrou. "O topo aperta o ápice?" foi
três vezes impressão de leitura e nenhuma vez número; agora é número.

| painel | ar acima do ápice | em tela | laterais |
|---|---|---|---|
| `entrada` | 48 px = 24,0 u | **20 px** | corta / corta |
| `entrada-2` | 48 px = 24,0 u | **20 px** | corta / corta |
| `entrada-3` | 51 px = 25,5 u | **21 px** | corta / corta |
| `[curto]` · careca | 117 px = 58,5 u | 49 px | 13 / 12 px |

Recorte final: **x 154 y 104, 718 × 407 px**. Nenhum painel toca o topo.

### Três coisas menores, no mesmo caminho

- `topoDaTinta` virou `caixaDaTinta` — **uma** régua de tinta para as duas
  perguntas (onde o ápice começa, quanto ar sobrou), em vez de duas descrições do
  mesmo limiar;
- a largura da folha, o padding e o gap saíram do CSS e viraram constantes que o
  **programa também lê** — é dividindo a largura pelos painéis que ele calcula o
  "em tela". Escritas duas vezes, divergiriam no primeiro ajuste e a conta passaria
  a descrever uma folha que não existe;
- os 15 PNGs intermediários da folha (`.f-`, `.fc-`, `.fx-`) entraram no
  `.gitignore` da rota. Eram derivados aparecendo como não rastreados, a um
  `git add .` distraído de entrar no histórico.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo (inclui `tsconfig.scripts.json`) |
| `npm run arte:folha` | gera, e o enquadramento sai conferido painel a painel |

**Nenhum arquivo de produto foi tocado.** `compositor.ts`, `cabelo.ts`,
`geometria.ts`, `pecas-da-arte.ts` e as três artes estão como estavam — o que mudou
é a folha e o `.gitignore` da rota.

---

## ⚠ O QUINTO ERRO DE RÉGUA, e ele contamina a tabela do BLOCO 3

Achado ao pôr o `[curto]` ao lado das outras na folha — ele acusou **97,6% de
barra enterrada**, o que é impossível: ele é clipado e não tem um pixel de cabelo
fora do crânio.

**A causa, em dois níveis:**

1. A sonda tinha **três referências de cor** (traço, cabelo claro, cabelo escuro) e
   atribuía todo pixel à mais próxima. O fundo `#FBF8F5` dista **529** do castanho
   `#6E4326` e **744** do preto: **fundo era classificado como CABELO CLARO**.
2. Acrescentar o fundo à lista baixou para 52,2% e não resolveu: a **pele
   sombreada** `#CD9C73` dista **261** do castanho contra **268** do fundo. E não
   adianta listar tons de pele — as facetas são **gradientes**, sem cor única.

**O conserto:** a quarta referência é **dinâmica** — a cor que o render CARECA tem
**naquele mesmo pixel**. Cobre fundo, pele, faceta, queixo e rampa de uma vez, e
não envelhece com a paleta.

| medida | com 3 referências | + fundo fixo | **+ careca por pixel** |
|---|---|---|---|
| `[curto]` (clipado, controle) | 97,6% | 52,2% | **0,0%** |
| careca | 0,0% | 0,0% | **0,0%** |
| `entrada` | 23,9% | 18,1% | **14,1%** |
| `entrada-2` | 13,4% | 10,9% | **8,8%** |
| `entrada-3` | 11,4% | 9,8% | **6,1%** |
| controle do anel | 93,8% | 91,1% | **82,3%** |

**O que isso faz com a decisão do Bloco 3:** a coluna **"barra enterrada"** daquela
tabela (hoje 31,1% · A 23,9% · B 21,1%) foi medida com a régua contaminada e está
**inflada**. O erro afeta as três configurações do mesmo jeito — todas têm contorno
externo com fundo de um lado —, então a **ordem não muda**.

E a barra era **o único eixo em que B ganhava**, por 2 a 3 pontos. **A venceu os
outros 7** (coroa a 56 px, perda da clara, perda da massa, multi-componente,
chapéu, formas, conceitos/passos), e nenhum deles passa por esta régua. **A decisão
continua de pé.** Se alguém quiser o número exato desse eixo, é preciso restaurar a
chave `arquitetura` — ela foi removida no Bloco 4.

---

## AS TRÊS PEÇAS ESTÃO NO SITE LOCAL (2026-08-06)

**`http://localhost:3000/dev/avatar-kokeshi`** — rota autenticada, o `?next=` devolve
para lá depois do login.

`src/lib/avatar/estilo/pecas-da-arte.ts` — **gerado**, 325 linhas, as três peças
juntadas dos literais de `npm run arte:converter`. Elas **NÃO estão em `CABELOS`**,
e o seletor da página as mostra em âmbar, separadas do catálogo em preto: colar no
catálogo é decisão do Doug, e a rota só produz o literal.

A página ganhou duas seções: as três a **280 px com o `[curto]` na mesma linha**, e
as mesmas quatro a **56 px**. O que conferir é a coroa, com o fundo em **magenta**.

---

## BLOCO 7 — a revisão peça a peça começa, e o espetado é o primeiro (2026-08-06)

**Comando novo:** `npm run arte:revisao -- entrada` → `scripts/avatar/arte/<arte>/revisao/`

A folha que faltava: **arte │ render │ divergência**, registrados. O registro não é
conta nova — é `embrulhar()` (`base.ts`), a mesma função que gerou a base de edição,
que põe o `<svg>` do compositor exatamente onde `paraPx` diz. E a régua é
`mascaraDaPeca` aplicada aos dois lados, com o render pintado no
`CIANO_INSTRUMENTAL` da própria rota (`#00C8C8`, o que `PEDIDO-GEMINI.md:43` pede).

`avatar:fidelidade --folha` faz esta folha e não pôde ser reusada: cinco costuras no
pipeline antigo, e ela recusa PNG por escrito (`fidelidade.ts:1757`).

### DUAS RÉGUAS ERRARAM ANTES DE MEDIR QUALQUER COISA — e as duas são a mesma lição

| # | o erro | o que devolvia | conserto |
|---|---|---|---|
| 1 | **render composto a 92%** contra arte que vive a `escala: 1` | IoU **29,8%**, desvio lateral p95 99,2 u, a peça **30 u ABAIXO** da coroa | fidelidade mede a `escala: 1`; os 92% ficam na escada, que é outra pergunta |
| 2 | **`limitar: false`** na máscara da arte | **11 492 px (9,3%)** de magenta contornando o tronco inteiro, lido como "o render perdeu isto" | `limitar: true` dos dois lados |

O erro 1 é o que o plano nomeava e eu cometi mesmo assim: a base de edição é composta
a `escala: 1`, então **a arte mora no sistema interno**, e um render a 92% desce a
figura 74,6 u. Comparar os dois mede a transformação — e como ela é uma semelhança
aplicada a tudo, não consegue trair a arte de forma diferencial.

O erro 2 tem causa nova e vale registrar: **o PNG volta do gerador reencodado**, e o
preto do contorno do boneco não sai idêntico ao da base. Preto que a base "não tinha"
entra na peça **sem âncora**, e como o contorno do cabelo encosta no da cabeça, a
inundação desceu pelo queixo, pelo pescoço e deu a volta no tronco.
**Quem pegou foi o olho, no mapa de divergência** — nenhum número acusou.

| medida | com o erro | corrigido |
|---|---|---|
| IoU dentro do `viewBox` | 74,3% | **82,1%** |
| vazamento abaixo do queixo (arte) | 11 492 px | **0 px** |
| preto: área render ÷ arte | 1,25× | **1,82×** |

### OS SEIS CONTROLES, e é o que separa esta folha de uma que diz "tudo bate"

| controle | exigido | medido |
|---|---|---|
| 1 identidade (render × render independente) | 100% | **100,0%**, só-A = só-B = 0 |
| 2 careca (arte × boneco sem peça) | ≈ 0% | **0,0%** |
| 3 peça trocada < peça certa | folga | **53,3% < 82,1%** |
| 4 `naTela` bate no rasterizador | ≤ 2 u | **0,3 u** |
| 5 denominadores | > 0 | 111 599 / 116 610 |
| 6 **o literal de `pecas-da-arte.ts` é o que o conversor produz hoje** | idêntico | confere, ponto a ponto |

O controle 6 fecha o buraco 3 (nenhum gate lia `pecas-da-arte.ts`): se divergir, a
folha **recusa desenhar** em vez de julgar um artefato velho.

### TRÊS NÚMEROS NOVOS QUE NINGUÉM IMPRIMIA

1. **`traco.densa`** — a fração do perímetro DENSO com preto, antes da regra de
   maioria. Separa "a arte contornou tudo" de "todos os trechos passaram raspando";
2. **`varredura`** — os 12 N testados por `escolherN`, guardados. Separa
   *"o piso é da arte"* de *"o teto interrompeu a curva"*, que `piso` sozinho não faz;
3. **vazamento abaixo do queixo**, nos dois lados — o que a régua CONTAMINA, medido.

### O VEREDITO DO ESPETADO

| # | achado | número |
|---|---|---|
| **F1** | **a peça está com falta de pontos, e o teto é a causa** | varredura `40→16,9  48→11,6  64→5,8` — ainda **caindo pela metade** no último passo. Teto = 64 (`tracar-cabelo.ts:2217`). Os 3 picos do centro da arte viram **1 bossa** |
| **F2** | **a compressão custa metade do espeto e não é mais necessária** | `k = 0,445`, a peça guardou **51,3%** da ponta. A **crua** a 92% começa em y 33,3 e **cabe** |
| **F3** | **o traço do render é 1,82× o da arte** | 21 341 px na arte × 38 778 no render; IoU do preto 31,8%. O render desenha 12 u no laço inteiro; a arte pintou ~5,7 u de média |
| **F4** | IoU 82,1% acima do queixo; desvio lateral p95 **40,0 u** contra teto de 6 | consequência de F1 + F2 |
| **F5** | **`linhas: [[0,0]]` é FIEL — a hipótese cai** | a arte pintou preto em **100,0%** do perímetro denso. Confirmado no runtime: `getTotalLength()` do traço = 2620 = o da massa, `stroke-width: 12px` |
| **P1** | bytes | **13 407** contra teto 10 240 (+31%); 22 formas de 26 |
| **P2** | a 56 px lê como espetado | sem halo no magenta, sem buraco, sem borda clara no escuro |

**Nada foi consertado.** Esta rodada é diagnóstico.

---

## BLOCO 8 — F2 consertado, e o experimento DERRUBA o F1 (2026-08-06)

Uma alteração por vez, pela Regra de Evidência. E a segunda parte não virou
alteração nenhuma — virou medida que desaconselha a alteração.

### O conserto: o teto da compressão é do QUADRO, e o quadro encolheu no Bloco 5

`TETO_Y = 8` foi medido quando o produto entregava a 100%, e naquele mundo o
sistema interno e o quadro eram o mesmo. Desde os 92% não são: o topo do quadro
virou **y = −72,4** em coordenada interna. Ler o teto no sistema errado comprime
peça que cabe com folga.

`comprimirNoTeto(pico, escala = 1)` — **o padrão preserva byte a byte** todo
chamador de hoje (os cinco paramétricos, `importar-peca`, `mapear`); quem entrega
a 92% declara. A conta usa `daTela()`, a **inversa de `naTela`**, que não existia
e agora mora ao lado dela em `compositor.ts`.

**A régua 6 de `arte:reguas`** reproduz o defeito e prova o conserto:

| papel | afirma | medido |
|---|---|---|
| REPROVA | teto no sistema interno comprime a `entrada` | pico −38,9 → **k = 0,444** |
| PASSA | teto no quadro de entrega não toca a mesma peça | sobra 33,5 u → **k = 1,000** |
| SEPARA | a guarda continua inteira | pico −120 a 92% → **k = 0,713** |

Placar de `arte:reguas`: **18 de 18**.

### O efeito, medido antes e depois

| medida | antes | depois |
|---|---|---|
| IoU dentro do `viewBox` | 82,1% | **85,4%** |
| só na arte (o que o render perdeu) | 8 696 px | **3 723 px** (−57%) |
| desvio lateral p95 | 40,0 u | **22,5 u** |
| ponta guardada da arte | 51,3% | **105,8%** |
| `k` das três artes | 0,445 · 0,731 · 1,0 | **1,0 · 1,0 · 1,0** |

Os 105,8% não são erro: o render traça 12 u onde a arte pintou ~5,7, e o traço
mais grosso empurra a silhueta ~5 u acima da ponta da arte.

### UMA TERCEIRA RÉGUA ERROU, e o controle 4 pegou sozinho

Tirada a compressão, o controle 4 acusou **41,3 u** entre o topo medido e o
previsto por `naTela`. Causa: sem compressão a peça a `escala: 1` **encosta no
teto do `viewBox`**, então o render de fidelidade estava guilhotinado — a régua
media o viewport em vez da forma.

Conserto: `embrulhar(svg, semRecorte)` desliga o recorte **só na pergunta de
forma**. A escada de escala continua com o recorte normal, porque ali o corte é o
objeto da medida. Controle 4 voltou a **0,1 u**.

### O EXPERIMENTO DE N — e ele diz o CONTRÁRIO do que a varredura sugeria

`npm run arte:revisao -- entrada --candidatos=64,96,128`

| N | desvio da corda | **IoU contra a arte** | desvio lat. p95 | bytes |
|---|---|---|---|---|
| **64** | 5,8 u | **85,4%** | **22,5 u** | **13 480** |
| 96 | 2,8 u | 84,3% | 25,0 u | 15 722 |
| 128 | 1,8 u | 83,5% | 26,7 u | 17 979 |

**Mais pontos melhoram a corda e PIORAM a fidelidade.** Monotônico nos três, nas
duas réguas independentes, com o controle de identidade em 100,0% — não é ruído.

A causa é a pergunta F4, que ninguém tinha medido: **`desvioDaCorda` mede uma
poligonal que o produto nunca desenha.** O compositor traça `spline()` centrípeta
pelos mesmos pontos (`geometria.ts:812`); com mais pontos sobre uma borda de
pixel, a spline segue o ruído em vez de suavizá-lo.

**Consequência: o F1 cai.** "A curva foi interrompida pelo teto de pontos" era
leitura de uma régua que aponta para o lado errado neste pipeline. **N = 64 vence
os três eixos** e custa 33% menos bytes que 128. **`escolherN` não foi tocada.**

Fica declarado, sem conserto: `escolherN` escolhe por desvio de corda, e para peça
de borda ruidosa esse critério pode pedir mais ponto do que ajuda. Trocá-lo por um
critério de spline é decisão de arquitetura, não ajuste desta peça.

### O gerador que faltava

`src/lib/avatar/estilo/pecas-da-arte.ts` se dizia GERADO desde que nasceu e nunca
teve gerador — as três peças foram coladas à mão. Uma linha em `comprimirNoTeto`
mudou o `k` das três, e o conserto teria sido transcrever 144 pares de números
três vezes. **`npm run arte:pecas`** (`scripts/avatar/arte/pecas.ts`) reescreve o
arquivo inteiro a partir dos três PNGs. Mesmo caso do `dump-parametricos.ts` do
Bloco 5, mesma solução.

### A folha virou área de decisão

Ordem nova: **trinca → candidatos de N → 56 px → preto → escada → controles → o que
não mede.** Os controles desciam metade da página e não mudam de rodada para
rodada; depois de provados, o que se decide vem primeiro.

**F6 registrado, sem conserto:** as regiões internas de luz e sombra não são
medidas por esta folha. A `clara` passa pela mesma decimação da massa e pode ter
mudado de forma sem nenhum número acusar. Revisar depois que a silhueta for
aprovada.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo |
| `npm test` | **441 passando** |
| `npm run arte:reguas` | **18 de 18** |
| `npm run verify:arte` | passa, hash da base CONFERE |
| `npm run avatar:folha-base` | **19 formas / 7 468 bytes**, os congelados, 0 problemas |

---

## BLOCO 9 — a barba, e o ESPETADO É APROVADO (2026-08-06)

> **O olho do Doug: *"há cabelo na linha do queixo, parece ter barba"* e *"cabelo
> desce pelas bochechas"*.** Foi o terceiro defeito desta rota achado por alguém
> olhando, e não por um número.

### A régua que devia ter pego estava VAZIA — e é o modo de falha de sempre

`arte:revisao` media "vazamento abaixo do queixo" e devolvia **0 px** nos dois
lados, com o rótulo `· simétrico`. Ela media **abaixo de `Y_QUEIXO`** — a faixa
que `limitar: true` zera por construção. Zero por vacuidade, exatamente como o
`cobertos = 0` de `silhueta.ts`. A régua não estava errada: ela olhava para onde
o defeito não podia estar.

### A causa, isolada em duas medições

| faixa | teal de verdade | preto NOVO | **preto velho ANCORADO** |
|---|---|---|---|
| bochechas (y 200–307) | 4 234 px (48,0%) | 1 949 px (22,1%) | 2 646 px (30,0%) |
| **queixo (y 307–353)** | 125 px (**2,3%**) | 14 px (0,3%) | **5 240 px (97,4%)** |

O "cabelo" do queixo era **97,4% contorno do próprio boneco**, puxado para dentro
da peça pela âncora — `perto`, a dilatação de um traço em volta do teal. O laço
fechou por baixo do rosto e o preenchimento pintou o queixo.

E o que ancorava eram **salpicos**: `entrada.png` tem **314 componentes de teal** —
a maior com 94 919 px, **a segunda com 21**. As outras 313 somam 898 px. Ruído de
reencode do gerador, e cada speck de 3 px sobre a linha do queixo ancora o contorno
inteiro, porque a inundação é conexa.

### O conserto, e o piso NÃO foi escolhido — ele mora num abismo

`mascaraDaPeca` limpa o salpico antes de tudo. Entre ruído (21 px) e desenho
(94 919 px) há um fator de **4 500×**: qualquer piso de 50 a 800 px dá resultado
idêntico. `PISO_TEAL = (TRACO · ESCALA)²` — **um quadrado de um traço de lado**,
derivado, porque menor que a ponta da caneta que desenhou a arte não pode ser
marca deliberada.

**Régua 7** (`arte:reguas`), com o método defeituoso preservado em `comSalpico`:

| papel | afirma | medido |
|---|---|---|
| REPROVA | com o salpico o queixo entra na peça | **5 379 px** |
| PASSA | limpo, o queixo esvazia | 5 379 → **0 px** (−100,0%) |
| SEPARA | **a mecha da bochecha sobrevive** | 8 829 → 6 929 px (guardou **78,5%**) |

A terceira é a que importa: sem ela, uma limpeza que apagasse a peça inteira
ficaria verde. Placar: **21 de 21**.

### O efeito foi muito além do queixo

| medida | Bloco 8 | **agora** |
|---|---|---|
| IoU dentro do `viewBox` | 85,4% | **89,8%** |
| **só na arte** (o que o render perdeu) | 3 723 px | **3 px** |
| borda amputada por região | 3,1% | **0,0%** |
| controle 4 (`naTela` × raster) | 0,1 u | **0,0 u** |
| massa termina em (interno) | y 359,2 — **12 u abaixo do queixo** | y **278,3** — 68,9 u **acima** |

**Três pixels.** O traçado agora reproduz praticamente tudo que a arte desenhou;
o que sobra é `só no render` (11 816 px), e é o traço de 12 u contra os ~5,7 da
arte — o F3, que o Doug decidiu manter no render.

### VEREDITO: ESPETADO APROVADO

Conferido no runtime da página: massa de y **−40,2** a **278,3**, ponta inteira e
sem recorte (o transform é `translate(20 74.6) scale(0.92)` e a tinta mais alta
cai a 11,7 px do topo de um SVG de 280).

**N = 64 fica.** O experimento do Bloco 8 mostrou que mais pontos pioram a
fidelidade; `escolherN` não foi tocada.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo |
| `npm test` | **441 passando** |
| `npm run arte:reguas` | **21 de 21** |
| `npm run verify:arte` | passa, hash da base CONFERE |
| `npm run avatar:folha-base` | **19 formas / 7 468 bytes**, os congelados, 0 problemas |
| `npm run arte:gate` | **APROVADA** |

---

## AS DECISÕES DO DOUG — 2026-08-06, depois da revisão do espetado

**Ditas em uma mensagem só, e só existiam nela. Escritas aqui antes de um `/clear`.**

| # | decisão | consequência |
|---|---|---|
| 1 | **A rota do espetado é o pipeline permanente.** Provou manter alta fidelidade ao PNG modelo — contorno, sombra, tonalidade | vira **guia/skill**, e é o próximo trabalho |
| 2 | **`entrada-2` (Assimétrico) e `entrada-3` (Chanel) REPROVARAM** e serão apagadas | ele gera artes novas. Some a arte, a pasta derivada e a entrada em `pecas-da-arte.ts` |
| 3 | **`coque` e `moicano` ficam** — feitos direto em código, "ficaram excelentes" | intocados |
| 4 | **`curto`, `cacheado` e `tranca` saem do catálogo** | ⚠ ver o risco abaixo |
| 5 | **Espetado APROVADO** (Bloco 9) | primeira peça de arte real aprovada da rota |

> ⚠️ **AS DECISÕES 2 E 4 FORAM REVOGADAS em 2026-08-07**, depois da aprovação do
> chanel: *"não deletar nenhum, na verdade, do catálogo atual."* Ninguém sai — nem
> as artes, nem os cinco paramétricos. A `entrada-2` (Assimétrico) **será arrumada
> por AJUSTE FINO, não refeita**: o Doug disse que ela está quase boa, então a arte
> atual fica e recebe retoque — não uma geração nova. Qualquer versão retocada
> passa pela mesma esteira (Gate −1 → revisão → folha → aprovação visual). Com isso
> o risco da decisão 4 (o `curto` como controle de régua e valor de banco) deixa de
> precisar de resposta. As linhas acima ficam como história.

### ⚠ O RISCO DA DECISÃO 4, e ele precisa de resposta antes de executar

`CABELOS.coque` **não é só um cabelo do catálogo — é o controle aprovado de que a
rota inteira depende.** Ele aparece como referência em:

- `reguas-conferidas.ts` — `sondar(CABELOS.coque)` e `medirCoroa(CABELOS.coque)`
  sustentam as asserções PASSA/REPROVA/SEPARA das réguas da coroa e da silhueta;
- `arte/folha.ts` e `arte/revisao.ts` — é o "[curto] — aprovado" que vai ao lado de
  toda peça nova a 56 px;
- `folha-base.ts` e os **11 selos bytes+SHA** de `parametrico-congelado.ts`;
- `cabelo.test.ts`, que itera `MODELOS_CABELO`.

E `ModeloCabelo` é **valor de banco**: `cabelo.ts:162` declara que o id é "slug do
catálogo **e do banco** (`users.avatar_hair`)". Aluno com `curto` salvo passa a
apontar para modelo inexistente.

**Nada disso veta a decisão** — veta executá-la sem plano. As três perguntas que o
plano tem de responder: quem vira o controle das réguas no lugar do `curto`; o que
acontece com aluno que já escolheu um dos três; e se os selos são regerados ou se
os três saem também de `parametrico-congelado.ts`.

---

## BLOCO 10 — o CHANEL NOVO, medido e NÃO aprovado (2026-08-06)

> **A regra da rodada: parar na primeira folha.** Gerar, ler, reportar — sem
> consertar, sem afinar limiar, sem trocar régua, sem re-rodar com outro N para
> melhorar o placar, sem colar em `CABELOS`. Número ruim aqui é **resultado**, não
> convite a mexer. Esta seção é o dado; o que fazer com ele é decisão do Doug.

Arte nova gerada no Gemini sobre a `base-oficial.png`, salva em
`scripts/avatar/arte/chanel.png`. **Não confundir com `entrada-3`**, o chanel
velho que a decisão 2 mandou apagar — os dois coexistem no `pecas-da-arte.ts` de
hoje, sob os rótulos "Chanel" (velho) e "Chanel novo".

### O único toque em código

`arte/pecas.ts:38-43` — o gerador conhecia 3 PNGs, passa a conhecer 4. **Sem isso
não há folha**: o controle 6 (*o literal colado é o que o conversor produz hoje*)
recusa desenhar. As três frases de cabeçalho que diziam "as três peças" foram
ajustadas junto, porque texto gerado que mente é o M7.

**A isca do controle 3 NÃO foi trocada**, de propósito: mexer em régua antes de
medir era o que a rodada proibia. A ressalva declarada — *isca do mesmo corte
torna a folga otimista* — **não mordeu**: a folga saiu **18,7 pontos** (trocada
70,9% contra certa 89,6%). Não há conserto a fazer ali.

### Os portões, em ordem

| # | gate | resultado |
|---|---|---|
| −1 | `arte:gate` | **APROVADA** — hash `d8694eac` confere · 1024² · deslocamento 0,0 px · escala 100,00% · rodapé 100,0% |
| −1 | causa do que mudou nas protegidas (4 967 px) | **peça 93,0%** · repintura 0,2% · **não explicado 6,7% (335 px)** |
| 2 | `arte:extrair` | 141 519 px · **4 770 px descartados** fora da permitida · 1 componente, 0 descartadas |
| 3 | `arte:contorno` | 2 313 pts densos → 28 · erro máx **5,94 u** (teto 6) · IoU contra a máscara 95,9% |
| 4 | `arte:converter` | massa 28 pts · clara 24 · formas irmãs 0 · **auto-interseções 0** · k = 1,0000 |
| 5 | `arte:revisao` | **os 6 controles verdes** — a folha aceitou julgar |

Papéis da extração: massa 89 879 px (63,5%) · sombra 18 489 (13,1%) · **luz 9 000
(6,4%)** · traço 24 151 (17,1%) · não classificados **0**.

### A TABELA DE TRÊS FAIXAS — adotada nesta rodada, e é a régua daqui para a frente

A revisão externa do plano estava certa: **os números do espetado não são barra
universal.** `escolherN` escolhe N por peça, e o 64 do espetado foi o **último
degrau da escada**, não uma escolha. Escrever "N = 64" como teto era herdar por
analogia — o defeito que o docstring de `tracar-cabelo.ts:2216-2226` já nomeava.
Mas `IoU` e `só na arte` não são a mesma categoria, então são **três faixas**, não
duas:

| faixa | o que é | quem entra |
|---|---|---|
| **GATE** — reprova | invariante do pipeline, resposta certa igual para toda peça | hash · registro · **os 6 controles** · denominador > 0 · simetria dos dois lados · sistema de coordenadas · 441 testes / 19 formas / 7 468 bytes · **o olho a 56 px** |
| **PISO COM CAUSA** — não reprova sozinho, exige **causa nomeada** | direção-livre: só há um lado bom | `só na arte` · borda amputada · vazamento no queixo |
| **DIAGNÓSTICO** — imprime, não julga | depende da geometria da peça | IoU · N · k · bytes · cobertura de arco · fração no papel `luz` · desvio lateral p95 |

**GATE: todos verdes.** identidade 100,0% · careca 0,0% · trocada 70,9% < certa
89,6% · `naTela` bate no raster com 0,2 u · denominadores 141 487 / 147 253 ·
literal confere ponto a ponto.

**PISO COM CAUSA — três valores materiais, três causas nomeadas:**

| medida | valor | a causa |
|---|---|---|
| `só na arte` | 5 063 px (3,6%) | **a franja subiu.** A maior mancha da folha corre na aresta superior da abertura do rosto, 3–6% da altura da peça, mais aberta à direita. Não é massa perdida como na cortina de 79% — é deslocamento |
| borda amputada | 7,1% | **a arte desceu sobre a roupa.** 7,1% do contorno foi desenhado pela região, não pela artista (caixa de corpo y 353→638) |
| vazamento no queixo | arte 4,9% · render 5,7% · **simétrico** | **a arte desobedeceu o pedido.** 6 906 px da própria arte estão abaixo de `Y_QUEIXO`; o pedido dizia "terminam na altura do queixo ou acima". O render só reproduziu |

**DIAGNÓSTICO:** IoU 89,6% (canvas 89,1% · acima do queixo 90,0%) · **N = 28** ·
**k = 1,000** (pico 1,4 u) · cobertura de arco **89,3%** · fração no papel `luz`
**6,4%** · desvio lateral p95 16,7 u (máx 283,3) · desvio de topo p95 29,2 u ·
preto do render **1,25×** a área do da arte (IoU do preto 34,3%).

**As quatro previsões escritas ANTES de medir bateram** — e é isso que separa
previsão de racionalização:

| previsto para um chanel | medido |
|---|---|
| cobertura de arco menor que a do espetado, ~87,5% | **89,3%** |
| `k = 1,000` por não precisar comprimir, não por mérito | **1,000**, pico 1,4 u — nunca chegou perto do teto |
| `escolherN` escolhe menos que 64 numa curva inferior limpa | **28** |
| ~30% no papel `luz` (o da `entrada-3`) | **6,4%** — errou para melhor |

### O QUE A FOLHA MOSTROU — lida por subagente, com a separação número × olho

**Erros da ARTE** (o gerador desobedeceu o pedido de `PEDIDO-GEMINI.md`):

1. **Assimetria** — *olho*. Ponta esquerda desce 4–5% da altura da peça a mais que
   a direita; e a lateral direita tem um **degrau quadrado** à altura da
   sobrancelha, uma quina reta numa peça de vocabulário todo curvo. Sobreviveu à
   conversão, arredondada. O pedido dizia "diferença imperceptível".
2. **As laterais caem sobre a roupa** — *número + olho*. É a causa de dois dos três
   itens do piso com causa.
3. **Contorno preto furado** — *olho + número*. Trechos pontilhados no arco
   superior direito; a sonda concorda: a arte pintou **95,1%** do perímetro denso,
   com os trechos #18 a 23,1%, #17 a 29,6%, #9 a 32,7%.
4. **Traço solto** pendurado no canto inferior direito, sem fechar em nada —
   *olho*. O conversor descartou.
5. **A abertura do rosto é um retângulo de cantos vivos** — *olho*. O render
   arredondou; divergência de forma, não de espessura.
6. **A curva inferior não é uma linha só** — *olho*. O pedido pedia contínua,
   virando para dentro.

**Erros da ROTA — e o item 7 é o achado do bloco:**

7. **A LUZ SUMIU, E NENHUMA RÉGUA ACUSOU** — *olho*. A arte pôs brilho cobrindo
   **20–25% da cúpula esquerda** mais um ponto isolado; o render devolveu **um
   filete de 3–5 px correndo junto da franja**: outro lugar, outra forma, área
   menor em mais de uma ordem de grandeza. Chapada assim, a peça a 100% lê como
   **capacete, não cabelo**. É o F6 declarado no Bloco 8 — e **o mesmo filete
   aparece no controle 3**, ou seja é padrão do conversor, não acidente desta arte.
   É o quarto defeito desta rota achado por olho e nenhum por número.
8. **A franja subiu** — *número + olho*. Sobra testa nua entre franja e
   sobrancelha, mais à direita; no quadro do produto lê como cabeça torta.
9. **O corte cabelo×corpo não bate** entre arte e render nos dois degraus
   inferiores — *olho*.
10. **Leitura a 56 px: passa no limite, e o `[curto]` lê melhor** — *olho*.
    Sobrevivem a tigela, as duas colunas laterais e a aresta da franja; somem
    brilho, sombra, pontas e o degrau. **No fundo escuro o contorno preto funde com
    o fundo** e o vão entre a coluna lateral e a bochecha quase fecha — o pior dos
    quatro fundos.

### Bytes e escala

**22 formas · 9 929 bytes**, teto 10 240 — folga de **311 bytes (3%)**. Seria a
peça mais pesada do catálogo (Cachos faz 9 045). Risco declarado; quem decide é o
Doug. A peça a 100% encosta no teto (−6,7 u), mas o quadro que manda é o de 92%,
onde ela começa em **68,3 u** e cabe — é a razão de o teto ser lido na escala de
entrega.

### VEREDITO: MEDIDO, NÃO APROVADO

Nenhum gate reprovou e o olho reprovou. **Número verde não é peça aprovada** — foi
a quarta vez nesta rota. Recomendação registrada: **regerar a arte antes de
escrever a régua da luz ou o guia.** Seis dos dez erros são da arte, custam um
pedido ao Gemini e zero código, e os três itens do piso com causa descendem todos
do mesmo defeito. A régua da luz continua dívida real — mas a 56 px o brilho não
lê, então ela não bloqueia o chanel, e se calibra nas fixtures A–F e não nesta arte.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm run arte:reguas` | **21 de 21** |
| `npm run verify:arte` | exit 0 — réguas, cor proibida (margem 138,2°), hash da base **CONFERE** |
| `npm test` | **441 passando**, 24 arquivos |
| `npm run avatar:folha-base` | **19 formas · 7 468 bytes** — os dois congelados parados |

### As emendas ao plano do guia que esta rodada deixa prontas

1. **`references/esteira.md`** nasce como *"baseline do primeiro cabelo aprovado"*,
   não *"barra que a próxima peça tem de bater"*, com as três faixas acima. Os
   números do espetado vão para uma coluna de comparação: **uma amostra positiva
   não estabelece limite.**
2. **`references/reguas.md`, regra 5** — obrigatório é o `SEPARA` + a fixture do
   incidente; o método defeituoso preservado fica **só quando o contraste é o único
   controle**. A proteção contra regressão mora no `SEPARA`, não no método velho.
   Os três casos de hoje (`coroa`, `barra`, salpico) **têm** controle independente,
   logo os três são opcionais pela regra nova.
3. **`verify:arte` entra no `verify:all` depois de medido** — duas rodadas, delta
   abaixo de ~90 s e estável → entra inteiro. **O Chromium já é dependência
   hoje**: `verify:all` → `verify:pose` → `verificar-pose.ts:71,577`. Splitar
   "estrutural dentro, browser fora" entregaria aparência de cobertura: das quatro
   etapas de `verify:arte`, só `cor-proibida` e `fixtures` dispensam browser, e as
   **21 asserções** de `arte:reguas` — o objeto inteiro — precisam renderizar.

---

## BLOCO 11 — o CHANEL, RODADA 2: cinco dos seis defeitos de desenho caem, e o sexto não se move (2026-08-06)

> **A mesma regra da rodada anterior: parar na primeira folha.** Gerar, ler,
> reportar — sem consertar, sem afinar limiar, sem trocar régua, sem re-rodar com
> outro N, sem colar em `CABELOS`. Nada foi consertado nesta rodada.

Arte nova gerada no Gemini com o pedido emendado de `PEDIDO-CHANEL.md` (os quatro
parágrafos 🆕, um por defeito medido no Bloco 10), salva por cima de
`scripts/avatar/arte/chanel.png`. **A arte da rodada 1 está commitada em `ba18dd0`**
— sobrescrever foi conferido como reversível antes de copiar.

**Nenhum arquivo de código foi tocado.** `pecas-da-arte.ts` foi regerado por
`arte:pecas`, que é o que o controle 6 exige.

### O PLACAR DOS QUATRO PARÁGRAFOS 🆕 — 2 de 4

É a régua que importa neste bloco: o pedido nasceu de defeito medido, então ele se
mede pelo defeito que derrubou.

| parágrafo 🆕 | veredito | a prova |
|---|---|---|
| **simetria como espelho** | **obedecido** | 0 saltos ≥ 4 px na faixa da sobrancelha; pontas a 0,25% (arte) e 0,74% (render) da altura da peça, contra 4–5% na rodada 1 |
| **o cabelo não toca a roupa** | **desobedecido** | as pontas terminam 43–48 px abaixo do queixo e sobrepõem a roupa em ~30 px; **zero fundo bege** entre a ponta e a gola |
| **contorno fechado e contínuo** | **obedecido ao olho** | espessura mínima 11 px nas três bordas, nenhuma linha < 8 px; mas a sonda de perímetro ainda dá **95,2%** e três trechos fracos. **As duas réguas discordam e não foi investigado qual está certa** |
| **sem canto reto** | **desobedecido na arte** | a pele salta de 0 px em y=248 para 248 px em y=252 — quatro linhas; a borda de baixo da franja é reta (y=247 constante em 190 px de largura). Quem arredonda é o **render**, com raio ~30 px |

### Os portões, em ordem

| # | gate | resultado |
|---|---|---|
| −1 | `arte:gate` | **APROVADA** — hash `d8694eac` confere · 1024² · deslocamento 0,0 px · escala 100,00% · rodapé 100,0% |
| −1 | causa do que mudou nas protegidas (4 865 px) | **peça 95,1%** · repintura 0,2% · **não explicado 4,7% (229 px)** |
| 2 | `arte:extrair` | 141 424 px · **4 776 px descartados** fora da permitida · 1 componente, 0 descartadas |
| 3 | `arte:contorno` | 2 305 pts densos → 28 · erro máx **5,60 u** (teto 6) · IoU contra a máscara 95,7% |
| 4 | `arte:converter` | massa 28 pts · clara 28 · formas irmãs 0 · **auto-interseções 0** · k = 1,0000 |
| 5 | `arte:revisao` | **os 6 controles verdes** — a folha aceitou julgar |

Papéis da extração: massa 89 682 px (63,4%) · sombra 17 007 (12,0%) · **luz 8 961
(6,3%)** · traço 25 774 (18,2%) · não classificados **0**.

**GATE: todos verdes.** identidade 100,0% · careca 0,0% · trocada 70,9% < certa
90,0% (folga **19,1 pontos**) · `naTela` bate no raster com 0,2 u · denominadores
141 393 / 150 522 · literal confere ponto a ponto.

### A TABELA DA RODADA — e os quatro números que o pedido mandou derrubar não se moveram

| medida | rodada 1 | **rodada 2** | o que o pedido esperava |
|---|---|---|---|
| Gate −1 | APROVADA | **APROVADA** | igual · |
| não explicado nas protegidas | 335 px (6,7%) | **229 px (4,7%)** | — |
| descartado fora da permitida | 4 770 px | **4 776 px** | "bem menor" **✗** |
| vazamento no queixo (arte) | 6 906 px · 4,9% | **6 917 px · 4,9%** | "perto de zero" **✗** |
| borda amputada por região | 7,1% | **7,2%** | "perto de zero" **✗** |
| perímetro pintado de preto | 95,1% | **95,2%** | "100%" **✗** |
| `só na arte` | 5 063 px · 3,6% | **3 151 px · 2,2%** | "igual ou menor" · |
| IoU dentro do `viewBox` | 89,6% | **90,0%** | diagnóstico |
| erro máx do contorno | 5,94 u | **5,60 u** (teto 6) | diagnóstico |
| N · k · cobertura de arco | 28 · 1,000 · 89,3% | **28 · 1,000 · 89,3%** | diagnóstico |
| fração no papel `luz` (extração) | 9 000 px · 6,4% | **8 961 px · 6,3%** | diagnóstico |
| desvio lateral p95 | 16,7 u (máx 283,3) | **16,7 u** (máx 280,0) | diagnóstico ✗ teto 6 |
| desvio de topo p95 | 29,2 u | **31,7 u** (máx 51,7) | diagnóstico ✗ teto 6 |
| preto do render ÷ arte | 1,25× (IoU 34,3%) | **1,18×** (IoU 34,6%) | diagnóstico |
| bytes do composto | 9 929 (folga 311) | **10 100 (folga 140)** | risco, **piorou** |

**Os quatro ✗ têm uma causa só: a arte continua descendo sobre a roupa.** Não são
quatro defeitos, é um defeito medido por quatro réguas.

### O QUE A FOLHA MOSTROU — lida por subagente, com a separação número × olho

**CORRIGIDO contra a rodada 1** — cinco dos seis defeitos de desenho:

1. **O degrau quadrado na sobrancelha sumiu** — *número*. Varredura de salto ≥ 4 px
   no contorno: **zero ocorrências** na faixa da sobrancelha, na arte e no render.
   Os únicos saltos estão no topo da cúpula, e são curvatura.
2. **As pontas terminam na mesma altura** — *número*. Arte **1 px = 0,25%** da
   altura da peça; render **3 px = 0,74%**. Era 4–5%.
3. **O contorno furado sumiu** — *número*. Mínimo **11 px** nas bordas esquerda,
   direita e topo; **nenhuma linha abaixo de 8 px**. O arco superior direito
   pontilhado não existe mais. *Ressalva registrada:* a sonda de perímetro ainda dá
   95,2% e três trechos fracos (#19 a 17,0%, #18 a 32,1%, #8 a 34,0%).
4. **O traço solto do canto inferior direito sumiu** — *número*. O preto da arte é
   **1 componente conexo de 17 639 px** mais um pixel isolado.
5. **A curva inferior virou uma linha só** — *número*. Borda externa das duas pontas
   monotônica, sem repetição nem salto. Uma quebra de 1 px em y=485 à esquerda.

**NÃO CORRIGIDO:**

6. **As laterais continuam caindo sobre a roupa** — *número + olho*. É a causa dos
   quatro ✗ da tabela. **Ver o Bloco 12: o Doug decidiu que esta mecha FICA**, e com
   isso este item deixa de ser defeito da arte e vira dívida do pipeline.
7. **A abertura do rosto ainda é retângulo de canto vivo na arte** — *número*. O
   render arredonda; nesse item o render está melhor que o modelo.
8. **A franja subiu, e agora está medida** — *número*. O render põe a franja **14–16
   px acima** da arte; a testa nua vai de **9 px (2,9% da cabeça) para 20 px (6,4%)**.
   A **única** região "só na arte" no painel da divergência é uma tira de
   **222 × 16 px** — exatamente a barra da franja.
9. **A LUZ PIOROU, e o item 9 dos abertos sobe de preço outra vez** — *olho +
   número*. A arte tem **6 075 px de tom claro = 7,9% da peça e 12,4% da cúpula**,
   com **99,2% dele à esquerda**, em três manchas. O render devolve **6 pixels**. A
   paleta do render tem exatamente **dois** tons de ciano: **não existe terceiro
   tom**. Na rodada 1 sobrava um filete de 3–5 px; agora não sobra nada.
10. **O corte cabelo × corpo não bate no entalhe** — *número*. Na ponta esquerda a
    arte desce até y=486 e o render para em y=444: **42 px mais alto**, e a ponta
    perde **35% da largura** (132 → 86 px). É a amputação aparecendo.
11. **A 56 px o fundo escuro continua o pior** — *número*. Contraste do contorno
    preto contra o fundo escuro **1,22**; do cabelo, **2,04**. No claro é 19,85 e
    7,96. Separa bem dos controles: **3 051 px** de cabelo contra **612** do
    `[curto]` e **0** do careca.

**DEFEITOS NOVOS, e os três primeiros são da ROTA e não da arte:**

12. **Dois slivers de fundo nas pontas do render** — *número*. ~90 px cada
    (3–4 px × 34 px), em x659–670 e x892–903, entre o preenchimento ciano e o traço
    preto interno. **Não existem na arte** — é desregistro fill/stroke do vetor.
    Simétricos entre si.
13. **Rebordo de sombra que a arte não tem** — *número*. O render acompanha todo o
    contorno com 5–6 px do tom escuro (12–17 px por linha entre y=147 e y=207, onde
    a arte tem 1–3). É o antialiasing da arte virado segundo caminho pelo tracer.
14. **O render descartou um traço interno da arte** — *número*. A arte tem três
    faixas pretas na ponta direita entre y=435–470 (a do meio, x415–429, sem espelho
    à esquerda); o render tem duas em todas as linhas.
15. **A varredura de N foi interrompida pelo teto, não pela arte** — *número*, e a
    própria folha marca com ✗: de N=48 (2,1 u) para N=64 (1,3 u) o desvio **ainda
    caiu 0,8 u**.

### O ACHADO DO BLOCO: o pedido mandava dobrar por um eixo que não é o eixo

**A instrução *"dobrando pela linha vertical que passa pelo nariz, os dois lados
coincidem"* é impossível de obedecer nesta base**, e a rodada 1 julgou a simetria
contra ela.

O subagente mediu a linha do nariz **40,3 px à direita do eixo do corpo** — e mediu
o mesmo no **controle 2, a careca sem peça nenhuma**. A causa está declarada em
`geometria.ts:179-183`: `GIRO.eixoCabeca = 7` mais `GIRO.desvioOlhos = 33`, **40
unidades**, o número exato. A base tem um giro de três quartos por decisão de arte.

| dobra | desbalanço |
|---|---|
| pela linha do **nariz** | **30,9%** dos pixels sem par na arte, 30,3% no render; faixa de cabelo 136 px à esquerda contra 45 à direita |
| pelo **eixo próprio da peça** | mediana **2,0 px** (arte) e **1,0 px** (render); p90 de 9 e 8 px |

**A peça está simétrica; o pedido é que media contra o eixo errado.** E isso se
propaga: a 56 px a banda de cabelo lê ~15 px à esquerda contra ~5 à direita. Isso é
o `GIRO` aparecendo, não a peça torta — se ler como "cabeça torta" no produto, o
item a rever é o `GIRO`, e é decisão de arte.

**Emenda ao pedido, para a rodada 3:** trocar "a linha vertical que passa pelo
nariz" por "o eixo de simetria do próprio cabelo".

### Bytes e escala

**22 formas · 10 100 bytes**, teto 10 240 — folga de **140 bytes (1,4%)**, contra
311 na rodada 1. Continua sendo a peça mais pesada do catálogo (Cachos faz 9 045).
A peça a 100% encosta no teto (−6,7 u); no quadro de 92%, que é o que manda, ela
começa em **68,3 u** e cabe. **A compressão não tira nada**: as áreas de ciano de
"crua a 92%" e "peça a 92%" são idênticas pixel a pixel (69 699 px).

A ponta acima da coroa: arte 46,3 u · peça 52,2 u — a peça **guardou 112,6%** da
ponta da arte.

### VEREDITO: MEDIDO, e o julgamento MUDOU DE OBJETO

Nenhum gate reprovou, e a arte melhorou em cinco dos seis defeitos de desenho. O
sexto — cabelo sobre a roupa — **não se moveu um pixel**, e é ele que segura os
quatro ✗ da tabela.

**Mas o Doug olhou a folha e decidiu o contrário do que o pedido pedia: a mecha
FICA.** Com isso, `descartado`, `borda amputada` e `vazamento no queixo` deixam de
ser piso com causa da ARTE e viram **dívida do pipeline** — é o Bloco 12.

Os defeitos que sobram são mais da rota que da arte: a luz sumiu de vez, e
apareceram três divergências arte × render que a rodada 1 não tinha (12, 13 e 14).

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **441 passando**, 24 arquivos |
| `npm run avatar:folha-base` | **19 formas · 7 468 bytes** — os dois congelados parados, `conferirSvg` 0 problemas |

---

## BLOCO 12 — a mecha FICA: o tronco sai da extração, e a peça deixa de ser amputada (2026-08-06)

**Decisão do Doug, olhando a folha da rodada 2:** o cabelo que cai sobre o tronco
não é defeito da arte, é peça — e quem o matava era o pipeline.

### A causa, uma linha

`extrair.ts` descartava da máscara todo ciano que caísse sobre a região `corpo`.
A dívida estava declarada desde a R0: *"a região do corpo virou silhueta justamente
para salvar cabelo que cai AO LADO do tronco, e nada salva cabelo que cai NA FRENTE
dele."*

```
-  permitida[i] = limitar && (reg === "rosto" || reg === "corpo") ? 0 : 1;
+  permitida[i] = limitar && reg === "rosto" ? 0 : 1;
```

### A BANCADA — e ela decidiu quase tudo sozinha

Varridos como pisos possíveis os pontos de `TRONCO.perfil` abaixo do queixo —
**medidas do desenho, não desta arte**. `Y_QUEIXO` é o de hoje; `Infinity` é tirar
o tronco de vez.

| piso | y | descartado | amputada | pts | desvio | bytes |
|---|---|---|---|---|---|---|
| hoje | 353,2 | **4 776 px** | **7,2%** | 28 | 5,60 u | 10 100 |
| perfil | 363,7 | 3 813 px | 6,7% | 28 | 5,61 u | 10 069 |
| **perfil** | **411,6** | 51 px | **0,0%** | 28 | 5,61 u | **10 335** |
| perfil | 483,4 → 615,3 | 43 → 28 px | 0,0% | 28 | 5,61 u | 10 335 |
| **sem piso** | ∞ | **21 px** | **0,0%** | 28 | 5,61 u | **10 335** |

**Do piso 411,6 para cima a peça sai IDÊNTICA — conferido por string, não por
contagem de bytes.** Sete pisos emitem o mesmo SVG byte a byte. Os 21 px que sobram
são recorte de **rosto**, que a bancada não move de propósito.

Com a peça idêntica, sobrou um eixo só: **manutenção.** Um piso finito limpa a peça
de hoje e teria de ser re-derivado para uma mais comprida — a armadilha que esta
rota já pisou ("uma amostra não estabelece limite"). Tirar o tronco não tem esse
custo. **Escolhida a variante sem piso.** A chave de bancada foi removida junto,
como o `arquitetura` do Bloco 3; o registro dela é esta seção.

**O que se perdeu, com todas as letras:** se o gerador pintar a roupa de ciano, a
roupa vira cabelo e nada reclama. Risco aceito — o defeito é berrante.

**O que NÃO se perdeu, e é estrutural e não empírico:** o Gate −1 chama
`mascaraDaPeca` com `limitar = false` (`gate-menos-um.ts:624`), o `&&` curto-circuita
e `permitida` fica 1 em todo pixel. **O gate nunca enxergou esta linha.** `corpo`
continua inteiro em `REGIOES_QUE_REPROVAM`, e quem prova que o gerador não redesenhou
o tronco é a NCC sobre `região ∧ ¬peça`.

### Uma régua teve de mudar junto, e não mudar seria o erro

`bordaAmputada` contava borda que encosta em `rosto` **ou** `corpo`. Com o tronco
fora da extração, contar o tronco devolveria amputação onde não há corte. É o modo
de falha que esta rota já viu quatro vezes: **régua que sobrevive à mudança do que
ela mede e passa a medir outra coisa.** Passou a contar só `rosto`.

### AS QUATRO ARTES, e todas as quatro mudaram

Conferido peça a peça no literal de `pecas-da-arte.ts`, **antes × depois** — porque
contagem de pontos igual não prova coordenada igual:

| arte | descartado | borda amputada | cobertura de arco | literal |
|---|---|---|---|---|
| `entrada` (espetado) | 442 → **0 px** | 0,0% → 0,0% | 100,0% → **100,0%** (1 arco) | **MUDOU** 3 686 → 3 806 b |
| `entrada-2` | 26 354 → **2 396 px** | 6,5% → **3,6%** | 82,5% → **97,5%** (1 arco) | **MUDOU** 2 825 → 2 908 b |
| `entrada-3` | 2 702 → **27 px** | 0,0% → 0,0% | 87,5% → **100,0%** (1 arco) | **MUDOU** 1 794 → 1 845 b |
| `chanel` | 4 776 → **21 px** | 7,2% → **0,0%** | 89,3% → **100,0%** (1 arco) | **MUDOU** 1 794 → 2 108 b |

**Consequência que precisa ficar escrita: o espetado foi APROVADO no Bloco 9 contra
uma peça que não existe mais.** Mudou pouco (442 px de 113 165 = 0,4%, +120 bytes) e
mudou. Ou a aprovação se estende por analogia, ou o espetado é rejulgado. **É decisão
do Doug, e ninguém deve presumir a primeira.**

E a `entrada-2`, que a R0 dizia que *"não sobrevive a esta rota"*, hoje tem **3,6%**
de amputação — e esses 3,6% são `rosto`, que é o certo: ela cobre o rosto.

### O `chanel` pela esteira inteira

| medida | rodada 2 (amputada) | **rodada 2 (a mecha fica)** |
|---|---|---|
| pixels da peça | 141 424 | **146 963** (+5 539) |
| descartado | 4 776 px | **21 px** |
| borda amputada | 7,2% | **0,0%** |
| perímetro pintado de preto | 95,2% | **100,0%** |
| traço declarado | 2 arcos · 89,3% | **1 arco · 100,0%** |
| `só na arte` | 3 151 px | **2 390 px** |
| IoU acima do queixo | 90,5% | **91,2%** |
| IoU no `viewBox` | 90,0% | 89,9% |
| clara | 28 pts · 5,18 u | **32 pts · 3,14 u** |
| controle 3 (folga) | 70,9 < 90,0 (19,1 pt) | **67,4 < 89,9 (22,5 pt)** |
| bytes do composto | 10 100 | **10 335** ✗ estoura o teto de 10 240 |
| vazamento abaixo do queixo | arte 4,9% · render 5,6% · simétrico | arte **8,5%** · render **10,1%** · ✗ **assimétrico** |

**O vazamento abaixo do queixo virou régua obsoleta na interpretação, não na conta.**
O valor absoluto agora mede o que a decisão de arte **autorizou** — a leitura "a arte
desobedeceu o pedido" do Bloco 11 morreu. O que continua valendo é a comparação
arte × render, e ela ficou assimétrica: o render põe 1,6 ponto a mais abaixo do
queixo que a arte.

### A FOLHA — lida por subagente, medida nas máscaras e não a olho

**A amputação acabou de verdade** (*número*): as regiões "só na arte" somam 2 390 px
em **três** regiões, e **nenhuma delas está nas pontas ou sobre o tronco**. O render
não para acima da arte em lugar nenhum — passa **6 a 8 px abaixo**, que é o traço
vetorial correndo por fora da máscara. As duas pontas voltaram igualmente (esquerda
+8 px de profundidade e +25 de largura; direita +6 e +22). Sobre a roupa: arte
5 970 px, render **7 241 px**.

**O entalhe caiu de 42 px para 7–8 px** (*número*). **Os dois slivers de fundo
sumiram** (*número*): sobrou **um furo de 1 px** em (642, 560).

**O contorno do render é UM componente de 34 485 px**, curva fechada única, sem
trecho falhado nem traço solto, espessura entre 13 e 18 px em 90% do percurso
(mediana 14). O da arte é 1 componente de 28 456 px mais 4 fagulhas de antialias.

### O QUE NÃO MELHOROU — e é tudo a mesma coisa: a TINTA não é transcrita

Este é o achado do bloco, e ele reorganiza três defeitos soltos num só.

**A forma é transcrita bem. A tinta não é transcrita de jeito nenhum.**

| camada | a ARTE tem | o RENDER devolve |
|---|---|---|
| **luz** | **9 072 px = 6,17%**, em 3 manchas, todas na metade esquerda: crescente de borda 5 191 px (x249–605, y105–393), **oval do domo alto-esquerdo 3 456 px (x311–416, y151–251)**, pingo 419 px | **55 px = 0,03%**, em 11 fraturas de ≤12 px, todas em y264–273 — **é serrilha de antialias, não brilho** |
| **sombra** | **13 131 px = 8,9%**, em 3 massas: mecha inferior esquerda (x243–445, y353–553), faixa da borda direita (x696–777, y277–543), gancho direito (x643–702, y500–551) | **não é a sombra da arte**: é uma faixa de 2–6 px abraçando o traço preto pela peça inteira, mais massa sólida nos 60 px de baixo das mechas. **Sombreamento sistêmico do compositor** |
| **traço interno** | a arte desenha traço preto **dentro** da peça | **descartado** — ver abaixo |
| tons de ciano | **3** + traço | **2** + traço |

**O traço interno é estruturalmente impossível hoje, e isso não é limiar mal
escolhido.** `Cabelo.linhas` são arcos **do laço da massa**: um traço que corre por
dentro da peça, e não pela borda dela, não tem onde morar no tipo. É por isso que o
traço da mecha direita perto do queixo some — e some por construção.

### A PERGUNTA DO DOUG, registrada: *"o preto da arte está perfeito, não daria para usar direto?"*

**Daria, e é o mesmo conserto dos três itens da tabela acima.** O preto da arte é
uma curva fechada única de 28 456 px que o `Cabelo.formas` (Bloco 4) já sabe
representar como forma irmã preenchida. Isso deixaria de sintetizar o contorno e
passaria a **transcrevê-lo** — com a espessura que a artista deu, e com os traços
internos que hoje não têm onde caber.

**O preço, medido antes de qualquer decisão:** a faixa preta é um anel — borda
externa **mais** borda interna —, então ela custa da ordem do dobro dos pontos da
massa, e o composto **já está 95 bytes acima do teto**. Não foi medido; é a bancada
do bloco seguinte.

### Defeitos novos que a folha mostrou

1. **A franja virou o déficit inteiro** (*número*). Ela é **2 301 dos 2 390 px** de
   "só na arte" — **96,3%**. Resolvida ela, o magenta desabaria para 89 px.
2. **A franja do render está TORTA** (*número*, novo). Na arte a base é uma barra
   nivelada: y=278 constante em 57 colunas amostradas, sem um pixel de variação. No
   render é uma rampa monotônica de 263 a 273 — **10 px de inclinação**. A testa nua
   vai de **10 px constantes** (arte) para **15 a 25 px** (render). É defeito de
   forma, não só de altura.
3. **Lasca de 5 × 48 px** (*número*, novo) em x402–406, y304–351 — o render recuou
   5 px por 48 linhas na aresta interna da mecha esquerda. É a única perda fora da
   franja.
4. **Furo de agulha de 1 px** em (642, 560) — sujeira de conversão que a arte não tem.
5. **A seção 5 da folha compara uma imagem com ela mesma** (*número*, e é defeito da
   FOLHA): `.r-crua-1.png`, `.r-peca.png` e `.r-gemeo.png` são **byte-idênticos**
   (md5 `fcc556da…`), e `.r-crua-92.png` = `.r-peca-92.png`. Os painéis *"crua a
   92%"* e *"peça a 92%"* são o mesmo arquivo. **A escada de escala, como está, não
   prova nada sobre compressão.**
6. **O controle `[curto]` é um piso baixo demais** (*número*, colateral): ele e o
   careca têm **silhueta idêntica nas 56 linhas** a 56 px — é uma touca pintada, não
   altera o contorno em um pixel. O `chanel` muda a silhueta em **26 das 56**.

### A 56 px: LÊ COMO CABELO

O subagente respondeu a pergunta que decide, e com razão medida: as duas mechas
descem abaixo da linha do queixo e **terminam em pontas destacadas sobre a roupa**,
com recorte visível entre a ponta e o ombro — capacete é massa que abraça o crânio e
para na orelha. As pontas recuperadas **sobrevivem até a linha 34** e alargam a
silhueta em ~4 px por lado. Nas duas últimas linhas elas são mais traço que cabelo
(linha 34: 6 px de cabelo contra 10 de preto).

**Pior fundo: o escuro**, de novo — castanho e preto colapsam e a aresta externa das
mechas some. A ponta da direita é sempre a mais frágil.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **441 passando**, 24 arquivos |
| `npm run verify:arte` | **21 de 21**, cor proibida PASSA, hash da base CONFERE |
| `npm run avatar:folha-base` | **19 formas · 7 468 bytes**, `conferirSvg` 0 problemas |
| Gate −1 nas 6 fixtures | **REPROVA·REPROVA·REPROVA·REPROVA·APROVA·REPROVA** — os seis exatos |
| `arte:revisao -- chanel` | **os 6 controles verdes** |

---

## BLOCO 13 — o preto passa a ser TRANSCRITO, e a franja perde o encobrimento (2026-08-07)

**Passos 1 a 6 do plano executados. A PARADA da folha foi alcançada** —
`docs`/`CABELOS` intocados, nada commitado.

### O que mudou, em uma frase

O contorno preto da peça deixou de ser um `stroke` de 12 u **centrado** no laço da
massa e passou a ser a **diferença entre duas formas cheias**: a massa preenchida
com `--av-linha` (camada 1) e o **núcleo** de ciano por cima (camada 2), com a
clara (3) e as **pretas internas** (4) depois. Sem `evenodd`, sem região com furo,
sem tocar em `bordaOrdenada`.

Dois campos opcionais em `Cabelo` — `nucleo` e `pretas` — e um ramo em
`pecaSobreposta`. `.kk-tinta` já saía em todo SVG, inclusive na careca: **zero
regra nova, zero propriedade nova**, e `.kk-cabelo-l` some sozinha porque `temArco`
já gateia a regra por `linhas` existir.

### PASSO 1 — a régua da espessura, e ela SALVA a variante fiel

`espessuraDoTraco` (`converter.ts`) é `sondarTraco` devolvendo o comprimento da
corrida de `papeis === 4` na normal, com o **dobro** do alcance para não saturar.
Percentis sobre os pontos com traço; `fracaoFina` é a fração deles abaixo de 8 u
(= 0,64 px a 56, logo abaixo da sobrancelha inteira, 0,66 px).

| arte | p05 | p50 | p95 | < 8 u | saturada | com traço |
|---|---|---|---|---|---|---|
| `entrada` | 3,8 u / 0,30 px | 6,3 u / 0,50 px | 12,9 u / 1,03 px | **79,8%** | 12,7% | 100,0% |
| `entrada-2` | 4,6 u / 0,37 px | 8,3 u / 0,67 px | 10,4 u / 0,83 px | 46,2% | 1,4% | 97,9% |
| `entrada-3` | 7,1 u / 0,57 px | 9,2 u / 0,73 px | 10,8 u / 0,87 px | 17,0% | 1,0% | 100,0% |
| **`chanel`** | **8,3 u / 0,67 px** | **9,6 u / 0,77 px** | **12,1 u / 0,97 px** | **2,3%** | 4,4% | 100,0% |

**A `chanel` tem banda legível** — p50 de 0,77 px contra 0,66 px da sobrancelha, e
só 2,3% do perímetro abaixo do corte. A variante fiel sobrevive ao Passo 1. O
**espetado não sobreviveria** (79,8% abaixo de 8 u), e ele está congelado por
decisão do Doug de qualquer forma.

`medirCoroa` nas quatro, a mesma régua no render: faixa no eixo 1,0 / 0,0 / 11,0 /
**12,0 u**, contra 11,0 u da careca (o piso). A banda do render da `chanel` era
**12,0 u contra 9,6 u da arte** — a razão de área de 1,21× vista de outro ângulo.

### ⚠️ O PLANO ESCREVEU UMA FÓRMULA QUE CONTRADIZ A PRÓPRIA TABELA DELE

A variante `lei` estava escrita como `distanciaDe(¬mascara) > TRACO/2`. Isso entrega
banda de **6 u**, e a tabela do mesmo plano declara **12 u, iguais às do crânio** —
e a previsão de IoU dele (~83%) também só fecha com 12. A geometria decide: o
contorno do crânio tem 12 u **centradas** na fronteira, metade fora e metade dentro;
a silhueta da PEÇA é a beira **externa** do preto dela, então o preto tem de descer
12 u para dentro dali. **Erodido por `TRACO` inteiro.**

O número da fórmula errada, preservado: com 6 u a contenção do núcleo à massa caía a
**0,25 u** (os dois laços quase cruzavam) e a camada 4 recuperava **7 800 px** — que
era a banda da própria artista sendo redesenhada por dentro, não traço interno.

### PASSO 2 — o GATE que decidia se o plano seguia, e ele passou

A camada 1 depende de `Cabelo.massa` ser a **borda externa** e não a linha de centro
do preto (as duas rotas do repositório definem `massa` de formas opostas). O teste
discriminante não tem nenhum número escolhido: se fosse linha de centro, `perdido`
seria ≈ metade da área do papel `traco`.

| | previsto | medido |
|---|---|---|
| hipótese **linha de centro** | `perdido ≈ 14 231 px` | — |
| hipótese **borda externa** | escala da decimação | **5 131 px** |

**Margem 2,77×.** `massa` é a borda externa. O plano seguiu.

### PASSOS 2 e 3 — o núcleo e as pretas internas, medidos na `chanel`

| variante | N | comps | contenção | vazando | cruzam. | furos | camada 4 (ordem CERTA × INVERTIDA) |
|---|---|---|---|---|---|---|---|
| **fiel** | 32 | 2 | **3,47 u** | **0** | **0** | 16 u² | 4 formas · **866 px** × **0 px** |
| **lei** | 40 | 1 | **7,13 u** | **0** | **0** | 16 u² | 2 formas · **837 px** × **0 px** |

Tetos de `vazando` e `cruzamentos` são 0, e os dois são 0. O núcleo fiel é
**multi-componente por construção** (2), como o plano previu.

**A ordem do Passo 3 é o passo inteiro, e o número ao lado prova.** Recortar antes
de componentizar recupera **866 px** de preto interno; componentizar antes e filtrar
depois recupera **0 px** — o preto da arte da `chanel` é uma componente conexa só, e
o critério ingênuo a reprova inteira. O número errado fica impresso ao lado do certo.

### PASSO 4 — o tipo e o compositor, com a INÉRCIA MEDIDA

Ao fim do passo, com os campos existindo e **ninguém emitindo**:

| selo | resultado |
|---|---|
| `npm test` | **441 passando**, com os 11 pares bytes+SHA e o `__careca` parados |
| `npm run avatar:folha-base` | **19 formas / 7 468 bytes**, `conferirSvg` 0 |
| `pecas-da-arte.ts` | **`git diff` vazio** — byte a byte |
| `npm run typecheck` | limpo, os dois tsconfig |

### PASSO 5 — as duas réguas novas, e as duas REPROVAM a peça de hoje

- **`contencaoDoNucleo`** (nova): sem stroke não há mais os ±6 u de folga que
  pagavam a tolerância de `escolherN`.
- **`contencaoDaClara` passou a medir contra o NÚCLEO.** Contra a massa ela vira
  aprovação por vacuidade: a massa agora é a silhueta inteira **incluindo a banda
  preta**, e uma clara pintando por cima do contorno passaria.

`src/lib/avatar/estilo/__tests__/nucleo-cabelo.test.ts`, **14 asserções**, cada
régua com o controle negativo ao lado (núcleo furando a massa reprova; clara que
cabe na massa e sai do núcleo reprova, **e a mesma clara sem `nucleo` passa** — é a
prova de que a régua antiga aprovava). `npm test`: **441 → 455**.

Medido nas peças de verdade:

| peça | `contencaoDoNucleo` | `contencaoDaClara` |
|---|---|---|
| `entrada` / `-2` / `-3` (congeladas) | Infinity (caso nomeado) | 5,49 / 1,11 / 6,23 u |
| **`chanel` fiel** | 3,60 u · | **−3,32 u ✗** |
| **`chanel` lei** | 7,13 u · | **−12,94 u ✗** |

**A clara vaza para cima da banda preta**, e na variante `lei` ela vaza 12,94 u —
mais que a banda inteira. É defeito real, achado por régua e não por olho.

### PASSO 6 — a `chanel` transcrita, e só ela

`TRANSCREVEM = { chanel: "fiel" }` mora em `converter.ts` e **não** no gerador,
porque três programas precisam da mesma resposta: `arte:pecas` gera, o **controle
6** de `arte:revisao` confere e `arte:folha` desenha. Com a lista no gerador, o
controle compararia literal transcrito com conversão sintetizada e acusaria
divergência para sempre. `conferirLiteral` conhece os dois campos novos, laço a
laço — sem isso ele aprovaria literal velho pelos campos que não conhece.

**Asserção negativa cumprida:** o `git diff` de `pecas-da-arte.ts` é **uma hunk
só**, dentro do bloco `chanel` — sai `linhas: [[0,0]]`, entram `nucleo` (2 formas /
32 pts) e `pretas` (4 formas). `entrada`, `entrada-2` e `entrada-3` **byte a byte
idênticas**, e a `massa` da própria `chanel` também: só a camada de tinta mudou.

### A BANCADA DE ARTE — as duas variantes, medidas

`npm run arte:revisao -- chanel [--variante=lei] [--candidatos=N,...]`. O destino
muda junto com a variante, senão a segunda folha escreveria por cima da primeira —
o defeito 5 que o Bloco 12 achou na seção 5 da outra folha.

| N da massa **e** do núcleo | IoU da forma | **IoU do preto** | **razão de área** | bytes |
|---|---|---|---|---|
| hoje, sintetizado | 89,4% | **34,4%** | **1,21×** | 10 335 |
| **fiel**, 28 (o de hoje) | 96,2% | **68,8%** | 0,81× | 11 638 |
| fiel, 48 | 97,3% | 72,5% | 0,83× | 12 368 |
| fiel, 64 | 98,3% | **76,5%** | 0,87× | 12 926 |
| **lei**, 28 | 96,1% | **66,1%** | **0,98×** | 11 267 |
| lei, 48 | 97,2% | 69,3% | **1,01×** | 11 997 |
| lei, 64 | 98,1% | 72,9% | 1,05× | 12 555 |

**Os dois alvos do plano: um cumprido, um não.** A razão de área (alvo 1,00 ± 0,05)
é cumprida pela `lei` em todo N. O IoU do preto (alvo ≥ 80%) **não é alcançado por
nenhuma das duas** — o melhor é 76,5%.

⚠️ **O alvo de 80% era número escolhido, não medido** — o mesmo defeito que este
plano corrigiu duas vezes em si mesmo. IoU de um anel fino é dominado por registro
sub-pixel: para dois anéis de largura `w` deslocados de `d`, `IoU ≈ (w−d)/(w+d)`, e
80% exige `d ≤ w/9` — **1,4 px numa banda de 12,6 px**. Fica registrado como
diagnóstico, não como teto.

**Um erro de bancada, achado e consertado no bloco:** a tabela de candidatos de N
chamava `converter(arte, n)` sem a variante, então media sempre a do produto
enquanto o resto da folha media a forçada. É a quinta vez que esta rota vê régua
que sobrevive à mudança do que ela mede. E o `nForcado` passou a valer para os
**dois** laços: a banda é a diferença entre eles, e afinar um lado só mede a
discordância, não a banda.

### A FOLHA, lida por subagente — e o defeito que os números não mostravam

**A barra preta da franja não aparece em NENHUMA das duas variantes.** A arte tem
uma barra de 328 × 13 px em x 401–729, y 267–279 (3 198 px); nos dois renders não há
um pixel de preto entre x 435 e 700.

**A causa está medida, e ela NÃO é a transcrição.** Perfil de coluna, arte × render:

| coluna | arte (ciano \| preto) | render fiel | render lei |
|---|---|---|---|
| x=430 | y200-267 \| **y268-279** | y200-261 \| y262-268 | y200-262 \| y263-268 |
| x=550 | y200-267 \| **y268-278** | y200-269 \| **(nada)** | y200-269 \| **(nada)** |
| x=620 | y200-266 \| **y267-278** | y200-272 \| **(nada)** | y200-272 \| **(nada)** |

A peça do render **acaba em y 269–272**; a da arte acaba em **y 279**. É o item 16
desta lista, medido no Bloco 12 com outras palavras: *"a arte tem base nivelada
(y=278 constante em 57 colunas), o render tem rampa de 263 a 273"*. Os números
batem.

**O `stroke` de 12 u centrado ENCOBRIA isso.** Centrado numa borda em y ≈ 269, ele
pintava preto de y 263 a 275 — bem onde a arte tem a barra. A transcrição não criou
o defeito da franja: **ela tirou o encobrimento**. O deslocamento de 6 u que o plano
mediu como defeito era, na franja, o que fazia a peça parecer certa.

Prova de que a forma não se moveu: o literal da `massa` da `chanel` é **byte a byte
o mesmo** antes e depois — só a camada de tinta mudou.

Forçar N nos dois laços recupera a barra em parte e não fecha: a 64, ela volta com
11 px em x=430, 10 em x=480, 5 em x=550 e **continua ausente em x=620**.

### O resto da leitura, em números

| | fiel | lei |
|---|---|---|
| massa de preto contra a arte (28 461 px) | 23 010 px (**80,8%**) | 27 997 px (**98,4%**) |
| mediana da espessura (arte 11,7 px) | **10,0 px** | 12,6 px |
| lateral direita, onde a artista desenhou leve (8–11 px) | 10 px — preserva | **13–16 px — achata** |
| buracos fechados (arte tem 2) | 1 | **0** — o laço da mecha direita abre em (683,544), vão de 13 px |
| rim externo a 56 px | meia-tinta em **6 de ~26 linhas** | preto cheio em todas |
| barra atravessando a coroa | **não** | **não** |
| ciano fora da silhueta | **0 px** | **0 px** |
| diferença entre as duas a 56 px | **107 de 2 240 px (4,8%)**, tudo acima da linha 18 | idem |

**A leitura recomenda a `fiel`**, por razão visual: ela preserva a modulação de peso
da artista (lateral direita mais leve que a esquerda), e a `lei` achata as duas em
13–16 px, devolvendo justamente a aparência de espessura fixa que a transcrição veio
matar — além de abrir um buraco novo no cachinho da direita.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **455 passando**, 25 arquivos (441 + as 14 do núcleo) |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm run avatar:folha-base` | **19 formas · 7 468 bytes**, `conferirSvg` 0 |
| `npm run verify:arte` | **21 de 21**, cor proibida PASSA, hash da base CONFERE |
| `npm run verify:pose` | perfil, marcos e as 4 fixtures reprovando |
| Gate −1 nas 6 fixtures | **REPROVA·REPROVA·REPROVA·REPROVA·APROVA·REPROVA** |
| `arte:revisao -- chanel` | **os 6 controles verdes**, controle 3 67,4% < 96,2% |
| `arte:revisao -- entrada` | controle 6 confere, 64 pontos — a congelada não se moveu |

### ⛔ A PARADA — e o que o Doug decidiu nela (2026-08-07)

Ele olhou `/dev/avatar-kokeshi` e **aprovou a variante `fiel`**, com um pedido: a
barra preta da franja. As três pendências da parada viraram o BLOCO 14.

---

## BLOCO 14 — a régua media a corda, o desenho era a spline (2026-08-07)

**Pedido do Doug, olhando o site:** *"o resultado ficou muito bom! só faltou mesmo a
barra preta da franja."* E depois, com a franja consertada: **APROVADO.**

### A CAUSA, e ela é anterior a todo o Bloco 13

`escolherN` (`tracar-cabelo.ts:2216`) varre N pelo `desvioDaCorda`, que mede a
**poligonal**. O compositor desenha `spline(pts, true)` (`cabelo.ts`, via `lacoTY`),
uma Catmull-Rom centrípeta. **A régua mede uma curva e o desenho é outra.**

O teste que separa as duas — os **MESMOS 29 pontos** da `chanel`, ligados de dois
jeitos:

| coluna | arte | corda (`L`) | spline (`C`) | spline − arte |
|---|---|---|---|---|
| x=480 | 278 | **278** | 255 | **−23 px** |
| x=550 | 278 | **278** | 250 | **−28 px** |
| x=620 | 278 | **278** | 253 | **−25 px** |

**A reta é o pior caso desta régua, e é onde ela é mais confiante.** A base da franja
é uma **reta de 246 u entre os vértices 12 e 13**; numa reta a corda erra exatamente
zero, então a decimação não gasta um único ponto ali — e as tangentes dos vizinhos
(o 11 a 72 u abaixo, o 14 a 123 u abaixo) arqueiam a curva 23 u para cima.

**Por que ninguém viu antes:** o contorno era um `stroke` de 12 u **centrado** no
laço. Ele pintava preto dos dois lados da curva errada e a peça parecia certa.
Transcrever o preto não criou o defeito — **tirou o encobrimento**. Prova: o literal
da `massa` era byte a byte o mesmo antes e depois da transcrição.

### O CONSERTO — `refinarPelaSpline`, e ele não move nenhum ponto

- `geometria.ts`: `spline()` virou a **forma-texto** de `arcosDaSpline()`, que
  devolve os mesmos controles de Bézier antes de virarem string. `amostrarSpline()`
  amostra dali. **Zero segunda descrição da curva** — e o `d` emitido é byte a byte
  o de antes, provado pelos **11 pares bytes+SHA** de `parametrico-congelado.ts`.
- `tracar-cabelo.ts`: `desvioDaSpline()` (o irmão honesto de `desvioDaCorda`) e
  `refinarPelaSpline()`, que **insere pontos da borda densa** onde a curva mais se
  afasta dela, até o desvio cair abaixo de meio traço. Guloso, converge por
  construção, e `bateuNoTeto` diz alto quando não bastou.

**Inserir, e não mover**, é o ponto: cada ponto novo é um pixel da `bordaOrdenada`.
A garantia de que todo ponto do literal é um ponto medido continua de pé.

**Escopado a quem transcreve.** `refinar = Boolean(variante)` em `converter()` — a
mesma chave `TRANSCREVEM` que já decidia a transcrição. As três peças do Bloco 9
seguem pelo caminho de sempre, e o `git diff` de `pecas-da-arte.ts` prova: `entrada`,
`entrada-2` e `entrada-3` **idênticas byte a byte**.

### E A CLARA, que a régua nova do Passo 5 tinha reprovado

Em pixel a clara **já estava** dentro do núcleo por construção (`papeis ∈ {1,3}`
contra `papeis ≠ 4`; a diferença é a faixa de `sombra`, 2–3 px). O que vazava era a
decimação: dois laços refinados cada um contra a sua borda, com alvo de meio traço,
cruzando sobre uma folga de 3 px.

Conserto por função que já existia, com teste que já existia: **`conterAClara`**,
contra a componente do núcleo que mais contém a clara — não a maior, porque numa
peça com mecha destacada a maior pode não ser a de baixo dela.

### OS NÚMEROS

| | Bloco 13 | **Bloco 14** | alvo |
|---|---|---|---|
| desvio da SPLINE da massa | **22,7 u** | **3,3 u** (+3 pontos) | 6 u · |
| **IoU do preto** | 68,8% | **80,1%** | ≥ 80% · |
| razão de área do preto | 0,81× | **0,91×** | 1,00 ± 0,05 |
| IoU da forma | 96,2% | **98,2%** | — |
| "só na arte" | 4 845 px | **1 940 px** | — |
| `contencaoDoNucleo` | 3,47 u | 3,47 u | ≥ 0 · |
| `contencaoDaClara` | **−3,32 u ✗** | **+0,26 u** | ≥ 0 · |
| bytes do composto | 11 638 | 11 901 | registrado, não veta |

**A banda preta da franja, coluna a coluna** — é o número que o Doug pediu:

| coluna | banda da ARTE | banda do RENDER |
|---|---|---|
| x=430 | 12 px | **12 px** |
| x=480 | 11 px | **11 px** |
| x=550 | 11 px | **11 px** |
| x=620 | 12 px | **12 px** |
| x=700 | 12 px | 14 px |

⚠️ **Uma correção ao que o Bloco 13 escreveu:** eu tinha rebaixado o alvo de IoU
≥ 80% a diagnóstico, chamando-o de número escolhido. O argumento geométrico continua
válido (IoU de anel fino é dominado por registro sub-pixel), mas a conclusão prática
estava errada — **com a curva desenhada medida, o alvo é alcançado: 80,1%.** O que
faltava não era teto folgado, era régua certa.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **463 passando**, 26 arquivos (455 + as 8 do refino) |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm run avatar:folha-base` | **19 formas · 7 468 bytes**, `conferirSvg` 0 |
| `npm run verify:arte` | **21 de 21**, cor proibida PASSA, hash da base CONFERE |
| `npm run verify:pose` | perfil, marcos e as 4 fixtures reprovando |
| Gate −1 nas 6 fixtures | **REPROVA·REPROVA·REPROVA·REPROVA·APROVA·REPROVA** |
| `arte:revisao -- chanel` | **os 6 controles verdes**, controle 3 67,4% < 98,2% |
| `arte:revisao -- entrada` | controle 6 confere, 64 pontos — a congelada não se moveu |

### O QUE FICA ABERTO DEPOIS DA APROVAÇÃO

1. **As três peças congeladas ainda usam a régua da corda.** Consertar move os
   literais delas e invalida a aprovação do espetado no Bloco 9. É decisão do Doug,
   e o custo é uma re-aprovação visual.
2. **Os Passos 7 (matar o sintetizado) e 8 (a luz)** continuam não iniciados. O 7
   segue bloqueado por construção até as quatro transcreverem.
3. **Os bytes seguem acima do teto** (11 901 contra 10 240), registrados e não
   vetando pela decisão A.

---

# O QUE VEM AGORA — depois da APROVAÇÃO DUPLA (2026-08-07)

> O plano do Bloco 13 (transcrever o preto) **foi executado** — Blocos 13 e 14
> acima — e o Doug aprovou o resultado olhando `/dev/avatar-kokeshi`. **Duas peças
> aprovadas: o espetado (Bloco 9) e o chanel (Bloco 14).** A decisão 1 de
> 2026-08-06 — *"a rota é o pipeline permanente, vira guia/skill"* — agora tem a
> segunda prova que faltava e passa a ser executável.

## As respostas às perguntas do Doug em 2026-08-07, antes do `/clear`

**As duas peças aprovadas NÃO saíram do mesmo caminho inteiro.** A rota de medição
é uma só (base oficial → edição no Gemini → Gate −1 → extração → contorno →
conversão); a **emissão** é que difere, e a chave é `TRANSCREVEM` em
`converter.ts`:

| | espetado (`entrada`) | chanel (`chanel`) |
|---|---|---|
| contorno | **sintetizado** — stroke de 12 u sobre o laço (`Cabelo.linhas`) | **transcrito** — 4 camadas (`nucleo` + `pretas`) |
| decimação | régua da **corda** (`escolherN`) | corda + **refino pela spline** |
| clara | direto da máscara | contida no núcleo (`conterAClara`) |
| aprovado | Bloco 9, congelado por decisão C | Bloco 14, variante `fiel` |

**A família transcrita é a melhor das duas, por medição:** IoU do preto 34,4% →
80,1%, traço interno impossível → 866 px, e a sintetizada **esconde** defeito sob
o stroke — a franja torta atravessou três blocos invisível por causa dele. O
espetado só não transcreve porque a banda preta da arte dele é fina demais para a
variante `fiel` (p50 6,3 u; **79,8% do perímetro abaixo de 8 u** — Passo 1 do
Bloco 13); transcrevê-lo um dia = variante `lei` + nova aprovação visual.

**Os erros já viraram mecanismo** — é o método da rota: cada régua nova entrou com
controle negativo (`nucleo-cabelo.test.ts`, `refino-spline.test.ts`), e o número
errado fica impresso ao lado do certo (ordem invertida da camada 4, fórmula
`TRACO/2`, corda × spline).

**Limpar ou congelar o antigo:** congelar agora, limpar em rodada própria. O
Passo 7 (a morte do sintetizado) segue **bloqueado por construção** enquanto
qualquer peça usar `Cabelo.linhas` — e três usam. `tracar-cabelo.ts` é biblioteca
compartilhada (o refino mora lá): não é "pipeline velho", não apagar.

## A sequência recomendada (o plano nasce em plan mode)

> **Atualizada em 2026-08-07, segunda mensagem do Doug:** as decisões 2 e 4 de
> 06/08 foram revogadas — **ninguém é apagado**, nem arte, nem paramétrico. A
> `entrada-2` (Assimétrico) será **arrumada** por ele. E a recomendação dada e
> registrada: **a emissão transcrita é o pipeline permanente para arte nova**, com
> a régua da espessura (Passo 1 do Bloco 13) decidindo a variante — banda legível
> → `fiel`; banda fina → redesenhar a arte com contorno de 12 u (o pedido ao
> Gemini já exige; o chanel obedeceu e é por isso que a `fiel` funcionou nele) ou
> entrar pela `lei`. O sintetizado fica como família legada congelada.

1. **Commitar os Blocos 13–14** — nada está commitado, e dois testes novos estão
   fora do índice.
2. **Institucionalizar o pipeline** (decisão 1 de 2026-08-06): promover o processo
   a doc/runbook, e **atualizar a skill `avatar-importar-arte`, que hoje descreve a
   rota VELHA** (fonte semântica SVG do gerador externo) — do jeito que está, ela
   ensina o caminho morto.
3. **Arrumar a `entrada-2` por AJUSTE FINO** — ela está quase boa e **não será
   refeita**: a arte atual recebe retoque, e a versão retocada passa pela esteira
   de sempre. Aprovando, entra em `TRANSCREVEM` como as próximas. Nada é apagado
   — a `entrada-3` continua como isca do controle 3.
4. **Colar os aprovados em `CABELOS`** — item 3 da lista aberta; custa os 11
   selos, as amarras de `cabelo.test.ts` e o orçamento (bytes estouram: decisão A
   já cobre). É o passo que põe as peças no produto.
5. **Rodada de unificação** (quando quiser, e agora SEM apagar ninguém): espetado
   re-emitido pela variante `lei` + nova aprovação visual → só quando todas as
   peças traçadas transcreverem o Passo 7 (matar o sintetizado) desbloqueia.
6. **A luz (Passo 8)** — decisão B: entra por último.

## AS TRÊS DECISÕES DO DOUG — 2026-08-06, e elas mandam no plano

| # | decisão | consequência |
|---|---|---|
| **A** | **O teto de bytes fica como está.** `ORCAMENTO_COMPOSTO` (`cabelo.ts:322`) é autoimposto; `docs/avatar/15-plano-ate-pronto.md:463` já declara que ele **não veta arte aprovada**, e nenhum gate de CI enxerga `PECAS_DA_ARTE`. Levantado e conferido: **nada em produção consome `compor()`** — a única chamada fora de teste é `/dev/avatar-kokeshi`, o banco guarda o *slug*, e o `AvatarDisplay` monta `<img>` de `public/` | o valor medido é **registrado**, não vetando. O número só muda quando o benchmark do 10.6 existir |
| **B** | **A luz entra, como último passo** | Passo 8 do plano, **depois da parada da folha**, separável e cortável |
| **C** | **O espetado fica CONGELADO no estado de hoje** | só a `chanel` transcreve. `entrada`, `entrada-2` e `entrada-3` mantêm o contorno sintetizado. ⚠️ **Custo declarado: duas famílias de peça traçada convivendo**, e o Passo 7 (a limpeza do sintetizado) fica **bloqueado por construção** até as quatro transcreverem |

---

# O QUE FICA ABERTO — o próximo a mexer aqui lê isto

| # | o quê | quem decide |
|---|---|---|
| 1 | **O parecer visual do Doug sobre as três peças** no site local. É o próximo passo | Doug |
| ~~2~~ | ~~**O recorte do close da folha** ainda aperta o ápice~~ — **fechado no Bloco 6b.** A folga foi a 2 traços (20 px de ar em tela), o enquadramento virou número conferido painel a painel, e o corte lateral ficou declarado como deliberado com o preço da alternativa medido (−24% de ampliação) | fechado |
| 3 | **Nenhuma peça foi colada em `CABELOS`** | Doug |
| 4 | **Barra enterrada não chega a zero** (14,1 / 8,8 / 6,1%). O resíduo é contorno de mecha cruzando a fronteira, não o traço do crânio — mas a régua não os separa | eu |
| 5 | **O orçamento de bytes estoura** em 2 das 3 artes. Doc 15:463 já declara que teto de bytes não veta arte aprovada | risco declarado |
| 6 | **A amarra da base de edição virou disciplina** (`escala: 1` explícito). `arte:escala` é o que sobra guardando | risco declarado |
| ~~7~~ | ~~`npm run estado`~~ — **rodado**, `docs/ESTADO.md` recontado (123 linhas, bloco "Agora" preservado). `verify:estado`: **0 violações** | fechado |
| 8 | **Nada foi commitado.** A rota está no índice (`git add`), não commitada | Doug |
| ~~9~~ | ~~**Papel `luz` sem correspondente no render de 2 tons; `tresTons` sempre parte em três.** O Bloco 10 subiu o preço disto e **o Bloco 11 subiu de novo**: na rodada 1 a mancha de brilho (20–25% da cúpula) virava um filete de 3–5 px; na rodada 2 ela é **7,9% da peça e 12,4% da cúpula, e o render devolve 6 pixels**. A paleta do render tem exatamente **dois** tons de ciano — não existe terceiro. **Nenhuma das 21 asserções toca nisso.** É a régua que falta~~ — **FECHADO POR DECISÃO em 2026-08-11: a luz morreu.** A régua deixa de ser pendência porque o Passo 8 deixa de existir. Ver a seção "⛔ A LUZ MORRE" no fim deste arquivo | fechado |
| ~~10~~ | ~~**O chanel novo foi MEDIDO e NÃO aprovado** (Bloco 10)~~ — **a rodada 2 rodou (Bloco 11).** Cinco dos seis defeitos de desenho caíram; o sexto (cabelo sobre a roupa) não se moveu, e o Doug decidiu que **ele fica** — ver item 12. Sobram três defeitos NOVOS de rota (slivers de fundo, rebordo de sombra, traço interno descartado) e a franja alta | parcial |
| ~~12~~ | ~~**A MECHA SOBRE O TRONCO FICA**~~ — **feito no Bloco 12.** O tronco saiu da extração; descartado 4 776 → **21 px**, borda amputada 7,2% → **0,0%**, perímetro de preto 95,2% → **100,0%**. As pontas voltaram inteiras e o entalhe caiu de 42 px para 7–8 | fechado |
| ~~14~~ | ~~**O ESPETADO FOI APROVADO CONTRA UMA PEÇA QUE NÃO EXISTE MAIS**~~ — **decidido: CONGELAR** (decisão C acima). O espetado não passa pelo caminho novo e a aprovação do Bloco 9 vale para o literal de hoje (3 806 bytes, com a mecha recuperada). O preço é duas famílias de peça traçada convivendo | fechado |
| 15 | **A TINTA NÃO É TRANSCRITA — e são três defeitos que viraram um.** A forma vai bem (IoU 89,4%, contorno 100%); a tinta não vai. **Luz:** arte 6,17% em 3 manchas, render **55 px de serrilha**. **Sombra:** a arte tem 3 massas medidas, o render devolve sombreamento **sistêmico** do compositor abraçando o traço — não é a sombra da arte. **Traço interno:** descartado por construção — `Cabelo.linhas` são arcos DO LAÇO DA MASSA, e traço que corre por dentro da peça não tem onde morar no tipo. **PLANO ESCRITO** — ver o bloco no topo desta seção. **Duas correções ao que eu havia dito:** o anel **não** custa o dobro dos pontos (a borda externa já é o laço da massa, e o stroke de hoje já re-emite o laço inteiro — fica ~neutro, equilíbrio em N′ ≈ 30 a ~34 bytes por comando `C`); e o furo **não some, muda de lado** — passa a ser do ciano, e ali é barato. **FEITO no Bloco 13, Passos 1–6:** o traço interno voltou (866 px em 4 formas, contra 0 px da ordem invertida), o preto passou de IoU 34,4% / 1,21× para **68,8% / 0,81×** (fiel) ou **66,1% / 0,98×** (lei). **A luz (Passo 8) NÃO entrou** — e em 2026-08-11 ela **morreu**: o item 9 fechou por decisão, não por conserto | parcial |
| 16 | **A franja é 96,3% de todo o déficit** (2 301 de 2 390 px), e no render ela está **torta**: a arte tem base nivelada (y=278 constante em 57 colunas), o render tem rampa de 10 px. Testa nua 10 px constantes → 15–25 px. **O Bloco 13 subiu MUITO o preço disto:** enquanto o contorno era um `stroke` de 12 u centrado, ele pintava preto de y 263 a 275 e **encobria** a franja curta; com o preto transcrito, a barra preta da franja da arte (328 × 13 px) **simplesmente não aparece** em nenhuma das duas variantes. É o item que reprova as duas antes de qualquer escolha entre elas. **FECHADO no Bloco 14:** a causa era `escolherN` medir a corda enquanto o compositor desenha spline — numa reta a corda erra zero e a decimação não põe ponto. `refinarPelaSpline` levou o desvio de 22,7 u a 3,3 u e a banda da franja bate com a da arte coluna a coluna | fechado |
| ~~19~~ | ~~**A CLARA VAZA PARA CIMA DA BANDA PRETA**~~ — **FECHADO no Bloco 14.** Em pixel ela já estava dentro; vazava por decimação. `conterAClara` contra a componente do núcleo que mais a contém: **−3,32 u → +0,26 u** | fechado |
| ~~20~~ | ~~**A escolha entre `fiel` e `lei`**~~ — **decidido: `fiel`**, pelo Doug, olhando `/dev/avatar-kokeshi` em 2026-08-07. Ela preserva a modulação de peso da artista; a `lei` achata as duas laterais em 13–16 px e devolve a aparência de espessura fixa que a transcrição veio matar | fechado |
| ~~21~~ | ~~**O alvo de IoU do preto ≥ 80% era número escolhido**~~ — **eu estava errado na conclusão prática.** O argumento geométrico vale (IoU de anel fino é dominado por registro sub-pixel), mas com a curva desenhada medida o alvo é alcançado: **80,1%**. O que faltava era régua certa, não teto folgado | fechado |
| 22 | **As três peças congeladas ainda decimam pela régua da CORDA**, que o Bloco 14 provou medir a curva errada. Consertar move os literais delas e invalida a aprovação do espetado no Bloco 9 — o custo é uma re-aprovação visual | Doug |
| 17 | **A seção 5 da folha compara uma imagem com ela mesma.** `.r-crua-1.png` = `.r-peca.png` = `.r-gemeo.png` (md5 `fcc556da…`) e `.r-crua-92.png` = `.r-peca-92.png`. A escada de escala não prova nada sobre compressão hoje | eu |
| 18 | **O controle `[curto]` é piso baixo demais**: a 56 px ele tem silhueta **idêntica ao careca** nas 56 linhas — é touca pintada. Como referência de "o que passa", não separa nada | eu |
| 13 | **O pedido mandava dobrar pela linha do nariz, e ela não é o eixo** (Bloco 11). `GIRO.eixoCabeca + GIRO.desvioOlhos = 40 u`, e o desvio medido é 40,3 px — aparece no controle 2, a careca sem peça. Emenda pronta para a rodada 3: trocar por "o eixo de simetria do próprio cabelo". **Se o giro ler como cabeça torta a 56 px, o item a rever é o `GIRO`** | Doug |
| ~~11~~ | ~~**`pecas-da-arte.ts` tem 4 peças, e a decisão 2 mandou apagar duas.**~~ — **REVOGADO em 2026-08-07: ninguém é apagado.** A `entrada-2` será arrumada por **ajuste fino** (a arte atual fica; retoque, não geração nova), passando pela mesma esteira; a `entrada-3` fica, inclusive como isca do controle 3 | fechado |

---
---

# BLOCO I — o pipeline vira instituição (2026-08-07)

> Regra 6: o bloco fecha registrando o número medido. O deste é a **defasagem que
> o CI passou a enxergar** — antes ela era invisível fora de um render.

## O que passou a existir

| o quê | onde |
|---|---|
| **runbook** | `docs/avatar/19-rota-de-arte-runbook.md` — a esteira comando a comando, o que cada reprovação quer dizer, a régua que decide `fiel` × `lei`, a promoção, a reentrada |
| **skill reescrita no lugar** | `avatar-importar-arte` v1.0 → **v2.0**. A rota semântica virou `references/rota-semantica-legado.md`; `references/gates.md` foi reescrita para os gates desta rota; `contrato-fonte.md` ganhou cabeçalho de legado e **fica**, porque `verify:fonte-peca` está no `verify:all` |
| **`arte:espessura`** | `espessura.ts` era rodado por `npx tsx` e não tinha entrada. O gate do bloco exige que todo comando citado exista |
| **`arte:pecas -- --check`** | modo novo em `pecas.ts`: gera as quatro em memória e compara a string com o disco. **Sem render** |
| **`arte:pecas-check`** | a entrada que `verify:arte` chama |

## O NÚMERO DO BLOCO — o `--check` nasceu vermelho

A regra 2 da rota manda a régua nascer reprovando. Medido, trocando **um dígito**
(`t: 0.500` → `t: 0.501`) em `pecas-da-arte.ts`:

| | exit code | laudo |
|---|---|---|
| com um byte trocado | **1** | `DEFASOU` · primeira divergência na **linha 78** · disco 15 560 × gerado 15 560 bytes |
| restaurado | **0** | `confere byte a byte` · `git diff` vazio |

Ele diz **em que linha** divergiu, e não só que divergiu — sem isso o conserto é
reger o arquivo inteiro e torcer.

**Por que ele existe se o controle 6 de `arte:revisao` já pegava:** o controle 6
**renderiza** (abre navegador, compõe SVG, desenha folha) e só roda para a arte
passada por argumento. Caro demais para CI, e nunca para as quatro.

## As duas direções que o CI passou a fechar

`verify:arte` entrou em `verify:all` — ele existia desde o Bloco 4 e **não estava
lá** (`package.json:45` × `:82`). A cadeia agora é:

```
arte:fixtures → arte:reguas → arte:cor-proibida → arte:escala → arte:pecas --check
```

| se isto mudar | quem fica vermelho |
|---|---|
| o render de um literal **promovido** | os selos de `parametrico-congelado.ts`, via `npm test` |
| `pecas-da-arte.ts` **defasar** do `converter()` | `arte:pecas --check`, via `verify:arte` |

Antes deste bloco a segunda não tinha guarda nenhuma no CI.

## Os gatilhos corrigidos — a rota morta saiu de quatro lugares

| arquivo | dizia | diz |
|---|---|---|
| `CLAUDE.md` (tabela de gatilhos) | `avatar-desenho` + `references/traco-fiel.md` (`avatar:tracar` → `avatar:fidelidade`) | **`avatar-importar-arte`** + o runbook 19 |
| `CLAUDE.md` (referências) | cinco docs de avatar | **seis**, com o 19 |
| `avatar-desenho/SKILL.md` | *"traçar: `npm run avatar:tracar -- <png>`"* | **importar** pela rota de arte; o `traco-fiel.md` fica marcado como legado |
| `avatar-regua/SKILL.md` | `avatar:tracar` / `avatar:fidelidade` na tabela de técnicas | `arte:revisao` e `arte:espessura`; a linha antiga fica riscada |
| `avatar-desenho/references/traco-fiel.md` | abria como caminho vigente | cabeçalho de **rota legada**, com o aviso de não apagar |

**Conferido mecanicamente: 102 citações de comando nos oito arquivos, 1 ausente** —
`verify:curriculo-banco`, no `CLAUDE.md`, que é o achado **G1** já registrado
(gate prometido por nome que não existe) e anterior a este bloco.

## O ACHADO DO BLOCO — registrado, não consertado

**G4:** `gate-menos-um.ts:796` ainda tem `.scratch/arte/entrada.png` escrito
literalmente como caminho padrão — resíduo da graduação do Bloco 4. Os outros oito
scripts da rota usam `${PASTA}`. `npm run arte:gate` **sem argumento** falha com
ENOENT, ou lê um arquivo de uma pasta que o git ignora. Nada em execução depende
disto (o runbook sempre passa caminho explícito). Foi para `docs/achados.md`.

## O bloco "Agora" do `docs/ESTADO.md` estava três semanas atrás

Ele ainda dizia branch `avatar/estilo-kokeshi`, *"a arte reprovou em 2026-08-03"* e
listava **"por qual caminho a arte volta"** como decisão travando trabalho — uma
decisão tomada em 06/08 e provada duas vezes desde então. Reescrito à mão (é a
única parte do arquivo que é), e `npm run estado` recontou o resto: **128 linhas**,
e a tabela de gates passou de 21 para **26 scripts** sozinha, porque ela é medida.

## Verificação do bloco

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm test` | **463 passando**, 26 arquivos — os 11 pares bytes+SHA inclusive |
| `npm run verify:all` | **exit 0**, agora com `verify:arte` dentro |
| `arte:reguas` | **21 de 21** |
| `arte:cor-proibida` | PASSA |
| `arte:escala` | hash da base **CONFERE** |
| `arte:pecas --check` | confere byte a byte |
| `verify:estado` | **0 violações** |

**A asserção negativa:** este bloco não tocou em `converter.ts`, em `CABELOS` nem
em literal nenhum. `pecas-da-arte.ts` com `git diff` **vazio** — e agora isso é
conferido por gate, não por disciplina.

---
---

# BLOCO II — o catálogo vai de 5 a 7 (2026-08-07)

> Regra 6: o número do bloco é a **asserção negativa** — quantos selos antigos se
> moveram na promoção. A resposta é **zero**.

## O NÚMERO DO BLOCO

```
11 selos antes, 15 depois.  MOVIDOS: 0.  NOVOS: 4.
```

Conferido pares `bytes + sha` um a um contra `git show HEAD:…`, não por olhar a
tabela. Os dez paramétricos e a careca saíram **byte a byte idênticos**:

| caso | bytes | sha (12) |
|---|---|---|
| curto · animado | 7 765 · 8 382 | `b8b9659be2b5` · `f892ee5f71c4` |
| cacheado · animado | 8 387 · 9 004 | `6b704e66542e` · `e7c1004a5903` |
| tranca · animado | 8 195 · 8 812 | `72e8e5da1274` · `4bdbaabc7d40` |
| coque · animado | 7 963 · 8 580 | `d32dfbd2a961` · `1df800ab59f4` |
| moicano · animado | 7 525 · 8 142 | `3e11df56c6fc` · `d177baa6929b` |
| `__careca` | 6 813 | `e96995516ba3` |

E os quatro que nasceram:

| caso | bytes | sha (12) |
|---|---|---|
| **espetado** · animado | **13 319** · 13 936 | `cff8a3afb67d` · `7bf5ddac41cd` |
| **chanel** · animado | **11 867** · 12 484 | `c6241c9b642f` · `62f101f73336` |

## A PROMOÇÃO — geometria reusada, identidade sobrescrita

`CABELOS.espetado` e `CABELOS.chanel` **espalham** `PECAS_DA_ARTE.entrada` e
`PECAS_DA_ARTE.chanel` e declaram só `id` e `nome`. A geometria não foi recopiada:
duas descrições da mesma borda é o defeito que a rota inteira evita.

**O `id` tinha de ser sobrescrito, e o motivo é runtime e não estilo.** O gerador
grava o `id` a partir do nome do ARQUIVO (`entrada.png` → `"entrada"`), com um
`as Cabelo["id"]` que **mascara no tipo**. Importar o objeto inteiro poria
`CABELOS.espetado.id === "entrada"` em produção — o slug que viaja para
`users.avatar_hair`. Há teste para isso agora.

`pecas-da-arte.ts` foi regerado com o cabeçalho corrigido **no gerador**
(`arte/pecas.ts`), nunca à mão. Medido no diff: **24 inserções, 13 remoções, e
0 linhas de DADO** — só comentário.

## OS SELOS PASSARAM A SAIR POR LISTA ESCRITA, E ISSO É O PONTO

`MODELOS_PARAMETRICOS` e `MODELOS_TRACADOS` moram em `cabelo.ts`, escritas nome a
nome. **Não** é `MODELOS_CABELO` filtrado por `massa`, e a diferença é o defeito:

> com o filtro, um paramétrico que ganhasse `massa` por acidente **sairia da lista**
> e deixaria de ser conferido — em silêncio, e exatamente no caso em que ele mudou.
> O teste concordaria com o defeito que ele existe para pegar.

O buraco que a lista escrita abre em troca — um modelo novo nascer fora das duas —
fechou junto, com a amarra *"toda peça do catálogo está em EXATAMENTE uma das duas
listas"*. `dump-parametricos.ts` aprendeu as duas e imprime em três grupos.

O bloco de teste novo, *"os traçados promovidos continuam byte a byte"*, pega
**outra** coisa que o de cima: lá vermelho quer dizer *"uma regra de CSS vazou"*;
aqui quer dizer *"a saída da rota de arte mudou"* — arte redesenhada ou
`converter()` diferente. Nos dois casos, uma peça aprovada mudando sem o Doug olhar
de novo.

## OS EIXOS DE `cabelo.test.ts` NAS DUAS PEÇAS

| eixo | espetado | chanel | veredito |
|---|---|---|---|
| `coberturaDaCoroa` | **1** | **1** | · cobre a coroa inteira |
| `contencaoDaClara` | **5,49 u** | **0,16 u** | · dentro da massa |
| `contencaoDoNucleo` | Infinity (não transcrita) | **3,60 u** | · |
| formas do composto (teto 26) | **22** | **23** | · cabe |
| bytes do composto (teto 10 240) | **13 319** | **11 867** | ▲ **registrado**, não veta |
| `conferirSvg` | 0 | 0 | · |
| distinção a 56 px, par mais próximo | 17,6% | 20,2% | · piso 5% |

**A distinção a 56 px cobre os 21 pares dos 7.** O par mais parecido do catálogo
continua sendo **Corte curto × Trança, 5,18%**, contra o piso de 5,0% — os dois novos
não apertaram nada: o menor par que envolve um deles é 15,5%.

## O TETO DE BYTES VIROU REGISTRO, e ele é assert de valor EXATO

Decisão A: o teto não veta arte aprovada. O que substitui o veto **não** é um teto
folgado — é `expect(bytes).toBe(13319)`. Teto folgado deixa a peça engordar até ele
calada; valor exato faz qualquer movimento aparecer, e a pergunta continua sendo *"por
que uma peça aprovada mudou?"*. `folha-base.ts` imprime `▲ registrado` em vez de `✗`,
e só para as traçadas.

## A FÓRMULA DE FORMAS APRENDEU AS TRÊS FAMÍLIAS

`19 + camadas + grupos` só conhecia `pontos`, `massa`, `clara` e `extensoes` — e
teria reprovado as duas, porque nenhuma delas emite o que ela previa:

| família | camadas | conferido |
|---|---|---|
| paramétrica | 2 (escura + clara) | 5/5 |
| traçada **sintetizada** | massa + clara + traço (só se `linhas`) = **3** | espetado 19+3 = **22** |
| traçada **transcrita** | massa-tinta + núcleo + clara + pretas = **4** | chanel 19+4 = **23** |

Ela continua derivada do **dado** e não do emissor — lida do compositor, concordaria
com qualquer coisa que ele fizesse.

## CRITÉRIO DE FRONTEIRA — cumprido, medido por hash

Rodada a esteira das artes **não** promovidas (`arte:extrair` → `arte:contorno` →
`arte:converter` em `entrada-2` e `entrada-3`), mais `arte:pecas` e
`avatar:congelar`:

| arquivo | md5 antes | md5 depois |
|---|---|---|
| `pecas-da-arte.ts` | `c93801ee839a7704739bee456bb8556e` | **idêntico** |
| `parametrico-congelado.ts` | `1db6ce5541c3b40702de6fd704cf967d` | **idêntico** |

Zero bytes movidos. E o `arte:revisao` das duas promovidas, com os 6 controles:
**controle 6 confere ponto a ponto** (64 e 31 pontos de massa), IoU da peça certa
**89,8%** e **98,2%**, controle 2 em 0,0% e controle 3 abaixo da certa nas duas.

## ⚠ DOIS ACHADOS, registrados e NÃO consertados

**G5 — `folgaDoRosto` não separa franja de cortina num laço fechado.** A régua
devolve o `y` mais baixo de qualquer trecho na faixa de `x` da sobrancelha; num bob,
quem ela encontra é a **cortina lateral passando pela mesma coluna**, não a franja.

| peça | `folgaDoRosto` | sobrancelha sob a massa (`dentroDe`, 21 amostras) |
|---|---|---|
| espetado | +7,0 · +3,7 | **0/21** e **0/21** |
| chanel | **−233,9 · −238,2** | **0/21** e **0/21** |

**Nenhuma das duas invade o rosto.** O −233,9 é o segmento 21→22 da massa do chanel,
a `y 392,9`, dentro da faixa `x 189,5…235,5`. Nada quebra — o teste exige só finitude
para peça traçada, de propósito —, mas a linha do `avatar:folha-base` lê como *"a arte
enterra o rosto"*, e isso é falso.

**G6 — `npm run build` já estava vermelho antes deste bloco.** O `prebuild` reprova em
`gen-manifest --check` (*"a lista bate, mas o arquivo difere"*). Provado com `git stash
-u` num HEAD limpo: reprova igual. `npx next build` compila e passa. O que preocupa
mais é o `verify:all` não enxergar isso.

## A INTENÇÃO DO DOC 15, corrigida em vez de só o número

A linha `| 2 | Cabelos | 5 |` do Bloco 8 **perdeu o número** e ganhou emenda: ela foi
escrita quando cabelo nascia de desenho paramétrico meu, e hoje cabelo novo nasce pela
rota de arte, com arte do Doug. **O que ela ainda encomenda é decisão dele**, e fica
como pendência aberta em vez de resolvida em silêncio.

Corrigidos junto, porque descrevem o estado de hoje e não intenção:

| onde | era | é |
|---|---|---|
| 9.1, reseed | 54 itens · **5 hair** | **56** itens · **7 hair** |
| Bloco 8, chapéu × cabelo | 6 × 5 = **30** combinações | 6 × 7 = **42** — o argumento engordou |

E ficou escrito que o reseed deve **ler `MODELOS_CABELO`**, não repetir "7" à mão.

## Verificação do bloco

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm test` | **491 passando**, 26 arquivos (era 463) |
| `npm run verify:all` | **exit 0** |
| `npm run avatar:folha-base` | base careca **19 formas / 7 468 bytes** — os congelados |
| `npx next build` | compila (o `npm run build` cai no G6, anterior) |
| `arte:revisao` × 2 | 6 controles, controle 6 confere nas duas |
| `verify:estado` | 0 violações |

---
---

# BLOCO III — a esteira de reentrada da `entrada-2` (2026-08-07)

> **Escrita agora, roda quando o retoque chegar.** A `entrada-2` **não será
> refeita**: a arte atual recebe ajuste fino do Doug, e a versão retocada passa
> pela esteira de sempre.

O procedimento mora no runbook — **[§8 do
`docs/avatar/19-rota-de-arte-runbook.md`](../../../docs/avatar/19-rota-de-arte-runbook.md)** —
e não aqui, porque runbook é o que se abre para executar. Aqui fica o que a
execução precisa saber que é **específico desta arte**.

## A régua da espessura re-mede, e ela pode mudar a resposta

A `entrada-2` está **na fronteira**: p50 **8,3 u**, com **46,2%** do perímetro
abaixo de 8 u. Para comparação, na mesma régua:

| arte | p50 | `< 8 u` | variante |
|---|---|---|---|
| `entrada` (espetado) | 6,3 u | 79,8% | não sobrevive à `fiel` |
| **`entrada-2`** | **8,3 u** | **46,2%** | **decide no retoque** |
| `chanel` | 9,6 u | 2,3% | `fiel` |

**Não decida a variante pela medição de hoje.** O retoque muda a banda, e
`npm run arte:espessura` re-mede as quatro. Se ela subir para a faixa da `chanel`,
entra por `fiel`; se continuar na fronteira, a saída preferida é **engrossar o
contorno na arte** (o `PEDIDO-GEMINI.md` já exige 12 u) e não cair na `lei`.

## O que ela já resolveu, e que não se perde no retoque

O Bloco 12 tirou o tronco da extração, e é por isso que ela deixou de ser amputada:
descartado **4 776 → 21 px**, borda amputada **7,2% → 0,0%**, perímetro de preto
**95,2% → 100,0%**. E o Gate −1, que a reprovava em rosto e corpo, passou a
**APROVÁ-LA** depois da inversão do Bloco 2b — a reprovação era *"a peça está
certa"*, não *"o boneco se mexeu"*.

Um retoque que volte a pôr massa sobre o tronco não reprova: a região saiu da
extração. Um que mexa no **boneco** reprova, e `arte:causa` diz qual dos dois foi.

## A ASSERÇÃO NEGATIVA, e ela agora tem gate

A cada passo, três coisas **paradas**:

| o quê | como se confere |
|---|---|
| `entrada`, `entrada-3` e `chanel` byte a byte | `git diff` de `pecas-da-arte.ts` com **uma hunk só**, dentro do bloco da arte que voltou |
| os 15 selos | `npm test` — e **4 deles agora são de peça promovida**, então mexer no espetado ou no chanel reprova por nome |
| a base careca | `npm run avatar:folha-base` — 19 formas / 7 468 bytes |

**O que mudou desde que este procedimento foi pensado:** `espetado` e `chanel`
estão no **catálogo** (Bloco II). A reentrada da `entrada-2` deixou de ser operação
sobre arquivo de conferência e passou a poder mover **peça de produto** — se o
`converter()` mudar para atender ao retoque, ele muda para todas. Aí o número novo
não é rebase: é **achado**, e a decisão é do Doug.

---
---

# BLOCO IV — a ponte para o produto, REGISTRADA (2026-08-07)

> **Nada aqui foi executado.** É registro para quem executar a F2, que está
> **0 de 16** e não vai ter este contexto.

Escrito em dois lugares: aqui, e como emenda ao **T2.10** do
[`docs/avatar/14-backlog-execucao.md`](../../../docs/avatar/14-backlog-execucao.md).

## A tela do aluno é do Bloco 5 / F2 — não deste plano

E há uma distância real entre o que a rota produz e o que o produto mostra:

| | hoje |
|---|---|
| o que o produto monta | `<img>` de `public/` — a arquitetura **v2** |
| o que consome `compor()` | **nada em produção.** A única chamada fora de teste é `/dev/avatar-kokeshi` |
| o que o banco guarda | o **slug** (`users.avatar_hair`), não a geometria |
| F2 | **0 de 16** — não há evidência de integração automática |

**A promoção do Bloco II é o que a F2 deve consumir.** Não há PNG novo, não há
asset novo, e não há UI tocada por este plano.

## As três coisas que a F2 precisa saber

**1. Ela lê `MODELOS_CABELO` / `CABELOS`, e não uma lista de cinco.** O catálogo foi
de 5 para 7 hoje e vai mudar de novo — cabelo novo nasce pela rota de arte. Lista
escrita à mão numa tela **nasce errada**. O default `'curto'` de `avatar_hair` não
mudou com a promoção.

**2. Não existe PNG de cabelo, e não vai existir.** O cabelo **recolore em runtime**
(doc 15:168-170), e PNG não recolore — é a razão de a peça ser geometria em código.
`avatar:gerar` e `avatar:variantes` são folhas de conferência: **nenhum dos dois
produz asset**, e chamá-los de exportadores é o erro que este registro previne.

**3. Quando a F2 tocar UI:** `design-recruta64` é **obrigatória**, e o
`npm run test:e2e` entra no gate — rodado com intenção, porque bate no Supabase de
**produção** e cria usuários reais.

---
---

# BLOCO V — a rodada de unificação, REGISTRADA (2026-08-07)

> **Nada aqui foi executado**, e nada aqui é executável hoje: as pré-condições
> incluem duas aprovações visuais que não existem.

O registro completo, com a tabela das duas famílias, foi para o **"Adiado
conscientemente"** do [backlog 14](../../../docs/avatar/14-backlog-execucao.md) —
que é onde quem planeja olha. Aqui fica a ordem e o porquê de cada trava.

| # | pré-condição | por que ela trava |
|---|---|---|
| 1 | **espetado re-emitido pela `lei`** + nova aprovação visual | a banda dele tem p50 6,3 u e 79,8% abaixo de 8 u: a `fiel` some a 56 px. Re-emitir muda a aparência de uma peça **que já está no catálogo** e tem selo |
| 2 | **`entrada-2` retocada e aprovada**, entrando por `TRANSCREVEM` | é o Bloco III. A `entrada-3` **fica** — ela é a isca do controle 3 |
| 3 | **Passo 7** (matar o sintetizado) | **bloqueado por construção**: `Cabelo.linhas` não pode sair enquanto três peças o usarem |
| 4 | **Passo 8, a luz** | decisão B: por último. E ele depende de uma régua **que não existe** |

**A luz é a que tem menos chão.** A arte tem três tons de ciano; a paleta do render
tem **dois** — não existe terceiro. Medido na rodada 2 do chanel: a mancha de brilho
é **7,9% da peça e 12,4% da cúpula**, e o render devolve **6 pixels**. **Nenhuma das
21 asserções toca nisso.** Antes de desenhar a luz, alguém tem de escrever a régua
que diz se ela apareceu — senão o Passo 8 fecha por opinião.

**E o item vizinho, que é decisão do Doug e não pré-condição:** as três peças
congeladas ainda decimam pela **régua da corda**, que o Bloco 14 provou medir a
curva errada — `escolherN` mede a corda enquanto o compositor desenha spline, e numa
reta a corda erra zero, então a decimação não põe ponto. Consertar move os literais
delas e **invalida a aprovação do espetado no Bloco 9**. O custo é uma re-aprovação
visual, e ela é a mesma da pré-condição 1 — fazer as duas juntas é mais barato que
fazer cada uma no seu dia.

---
---

# OS ACHADOS DA EXECUÇÃO — dois consertados, um registrado (2026-08-07)

O Doug mandou decidir entre seguir e consertar. Decisão: **consertar G4 e G6,
deixar G5 registrado.** O critério foi *o conserto é mecânico e o defeito atrapalha
a própria rota?* — G5 é decisão de arte sobre o que a régua deve medir, e mexe numa
régua que três testes usam.

## ⛔ G6 — A CAUSA QUE EU ESCREVI ESTAVA ERRADA, e o erro é o de sempre

Registrei o G6 como *"o manifesto está defasado; conserto: `npm run avatar:manifest`"*.
**Rodar não mudou um byte** — `git diff` vazio — e o check continuou vermelho.

A causa real: `gen-manifest --check` compara **bytes crus** contra a string que o
gerador produz. O gerador escreve `\n`; o git desta máquina tem
`core.autocrlf=true` e devolve `\r\n` no `checkout`. **Todo arquivo que o git
tivesse tocado reprovava.**

| arquivo | LF | CRLF |
|---|---|---|
| `assetManifest.ts` (recém-gerado) | 69 | 0 |
| `pecas-da-arte.ts` (passou pelo git) | 496 | **496** |

A assinatura é inconfundível e estava impressa: *"primeira divergência na linha 1"*
com **16 702 contra 16 206 bytes** — diferença de **496**, exatamente o número de
linhas.

### E o defeito era meu, no gate que o BLOCO I acabou de criar

`arte:pecas --check` entrou em `verify:arte` e em `verify:all` no Bloco I com a
mesma comparação de bytes crus. Ele passou naquele dia porque o arquivo tinha
acabado de ser escrito com `\n`; **num checkout limpo, ele reprovaria.** Foi o
`git stash`/`pop` da investigação do build que trouxe o CRLF e expôs os dois.

**O conserto não é novo — é precedente do próprio repositório.**
`gerar-livro-aberturas.ts:116` já normalizava com `.replace(/\r\n?/g, "\n")`. A
lição existia e não tinha chegado aos outros dois `--check`.

### Provado nos dois sentidos, nos dois gates

| gate | arquivo em CRLF | com defeito injetado |
|---|---|---|
| `gen-manifest --check` | **exit 0** — *"manifesto em dia (48 arquivos)"* | **exit 1** — *"1 caminho no manifesto que sumiu do disco: `/items/fantasma.png`"* |
| `arte:pecas --check` | **exit 0** — confere caractere a caractere | **exit 1** — *"primeira divergência na linha 83"* |

O laudo continua nomeando **o quê** e **onde**, que é o que separa um gate de um
alarme.

## G4 — o resíduo da graduação, uma linha

`gate-menos-um.ts` tinha `.scratch/arte/entrada.png` escrito à mão como caminho
padrão; os outros oito scripts da rota usam `${PASTA}`.

| | comando | resultado |
|---|---|---|
| antes | `npm run arte:gate` | `Input file is missing: .scratch/arte/entrada.png` · **exit 1** |
| depois | `npm run arte:gate` | `Resultado: APROVADA` · **exit 0** |

Pior que o ENOENT era o caso silencioso: `.scratch/` **não é versionado**, então
quem tivesse um arquivo lá conferiria uma arte que mais ninguém tem.

## G5 — fica registrado, e o motivo de não consertar é escrito

`folgaDoRosto` devolve o `y` mais baixo de **qualquer trecho** na faixa de `x` da
sobrancelha. Numa franja paramétrica isso é a franja; num laço fechado vindo de
arte, é a **cortina lateral passando pela mesma coluna**, muito mais abaixo.

| peça | `folgaDoRosto` | sobrancelha sob a massa (`dentroDe`, 21 amostras) |
|---|---|---|
| espetado | +7,0 · +3,7 | **0/21** e **0/21** |
| chanel | **−233,9 · −238,2** | **0/21** e **0/21** |

**Nenhuma das duas invade o rosto.** Nada quebra — o teste exige só finitude para
peça traçada, de propósito, porque o piso da traçada é fato da arte. O custo é de
**leitura**: a linha do `avatar:folha-base` lê como *"a arte enterra o rosto"*.

Consertar é trocar *"há tinta ABAIXO da sobrancelha nesta coluna?"* por *"há tinta
SOBRE a sobrancelha?"* — `dentroDe` na altura dela. É régua nova numa função que
`cabelo.test.ts`, `folha-base.ts` e `variantes.ts` usam, e muda o número impresso de
todos os sete. **É decisão do Doug, e está em `docs/achados.md`.**

---

## Verificação final do plano

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm run lint` | 1 warning **anterior** em `GameReview.tsx:285` |
| `npm test` | **491 passando**, 26 arquivos |
| `npm run verify:all` | **exit 0** |
| `npm run build` | **verde** — pela primeira vez desde que o G6 existia |
| `npm run avatar:folha-base` | 19 formas / 7 468 bytes |
| `verify:estado` | 0 violações |

Sem UI e sem auth tocadas → **sem e2e**, pela regra do `CLAUDE.md`.

---

# BLOCO 15 — a `lei` foi tentada no espetado e a arte fechou a porta (2026-08-07)

> **A tentativa foi revertida. `pecas-da-arte.ts` está byte a byte no HEAD.** O que
> sobrou do bloco é um gate que faltava e um documento que dizia coisa falsa.

## O QUE SE IA FAZER, E POR QUE PARECIA BARATO

A pré-condição 1 do Passo 7 mandava re-emitir o espetado pela `lei`. O argumento que
abriu o bloco: esse custo — **uma re-aprovação visual do Doug** — já estava na conta,
e a mesma emissão entregaria de brinde o `refinarPelaSpline`, porque
`refinar = Boolean(variante)` acopla as duas coisas em `converter()`. Uma operação
pagando duas dívidas. O Doug concordou e mandou rodar a `lei` sobre a arte atual, em
vez de redesenhar.

## A ESTEIRA RODOU INTEIRA E OS QUATRO PRIMEIROS PASSOS PASSARAM

| passo | resultado |
|---|---|
| Gate −1 | **APROVADA** — deslocamento 0/0 px, escala 100,00%, forma das protegidas 0 e 1 ladrilho |
| extração | 113 165 px, **0 fora da região permitida**, 0 não classificados, 1 componente |
| contorno | 64 pontos, IoU **95,6%**, erro da corda 4,60 u sob o teto de 6 |
| régua da espessura | re-mediu e **manteve o veredito**: p50 **6,3 u**, 79,8% `< 8 u` → `lei` |

O `refinarPelaSpline` fez o que promete: massa 64 → **65** pontos, clara 48 → **50**,
três pontos **inseridos** da borda densa, nenhum movido.

## ONDE ELA REPROVOU — e não é o conversor, é a arte

`cabelo.test.ts` reprovou em **"não tem região clara vazando da massa"**:
`contencaoDaClara` = **−9,22 u**.

A sonda, com o chanel de controle:

| peça | variante | `conterAClara` |
|---|---|---|
| espetado (`entrada`) | `lei` | **`convergiu=false`** · 18 projetados · **8 cordas** |
| chanel | `fiel` | `convergiu=true` · 6 projetados · 0 cordas |

**`conterAClara` desistiu, e desistir era o certo.** A guarda dela é declarada:
*nenhuma passada que aumente as auto-interseções é aplicada*. A `lei` erode o núcleo
por `TRACO` inteiro; a clara desta arte chega perto demais da borda e sobra para fora;
conter dobraria o laço. O docstring já nomeava o caso três blocos antes — *"a
topologia do **pente**, que é exatamente o que cabelo espetado é: torres separadas por
vãos fundos"*, com 101 de 576 combinações medidas dobrando.

**Clara fora do núcleo é tom claro pintado em cima da banda preta** — e a banda da
`lei` tem 12 u = 0,96 px a 56. Os 9,2 u que vazam comem ~77% da largura dela onde
vazam.

## O ACHADO DE VERDADE — a rota descartava a resposta

`conterAClara` sempre devolveu `convergiu`, e `importarPeca` sempre reprovou nele.
**`converter.ts` consumia só `.pts`.** A conversão emitiu clara não-contida sem uma
palavra, e quem reprovou foi o teste dois passos depois, com um número que não diz de
onde veio.

Consertado, e é o que sobra do bloco:

- `Convertido.claraConvergiu` carrega a resposta (`null` quando a peça não transcreve);
- `arte:converter` imprime a linha no bloco do núcleo;
- **`arte:pecas` reprova**, nomeando a arte e dizendo que a saída é a arte, não o
  conversor.

**Provado nos dois sentidos**, que é o que a Regra de Evidência pede:

```
com  entrada: "lei"   → ⛔ a contenção da clara NÃO CONVERGIU em: entrada     EXIT=1
sem  entrada          → escrito.                                              EXIT=0
```

## A ASSERÇÃO NEGATIVA, medida por hash de bloco

Enquanto a tentativa esteve de pé, só o `entrada` se mexeu — comparado bloco a bloco,
com **quebras normalizadas** (a lição do G6):

```
MUDOU   entrada     d85fb448ca71 → 14638939bc5b
PARADA  entrada-2   79254acc1a25
PARADA  entrada-3   6e04530c049a
PARADA  chanel      71fa206113c1
```

Revertida a variante, `git diff` em `pecas-da-arte.ts` é **vazio**.

## O QUE FICA ABERTO — e é decisão do Doug

**O espetado não tem variante que sirva.** A `fiel` some a 56 px, a `lei` vaza a
clara. A saída é **redesenhar a arte** com o contorno de 12 u que o
`PEDIDO-GEMINI.md` já exige — o caminho do chanel, que é o único que fechou até hoje.
Registrado como **T5** em `docs/achados.md`; a pré-condição 1 do Passo 7 foi corrigida
no `14-backlog-execucao.md` e a §3 do runbook 19 ganhou o furo da rede.

Enquanto isso o espetado fica congelado no sintetizado — IoU do preto **34,4%**,
decimando pela régua da corda que o Bloco 14 provou medir a curva errada — e o
**Passo 7 segue bloqueado**.

## Verificação do bloco

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **491 passando**, 26 arquivos |
| `git diff src/lib/avatar/estilo/pecas-da-arte.ts` | **vazio** |
| `npm run arte:pecas` | exit 0 |

`verify:all` **não foi rodado** — o Doug recusou a chamada. Fica como pendência do
bloco, e é o que separa trabalho verde de trabalho completo.

---

## ⛔ A DECISÃO DO DOUG SOBRE O BLOCO 15 — 2026-08-07

Colocadas as duas saídas, ele escolheu a segunda:

> **aceitar o espetado congelado no sintetizado (IoU 34,4%, régua da corda errada) e
> tirar o Passo 7 do plano**

### O que a decisão fecha

| | |
|---|---|
| **Passo 7** (matar o sintetizado) | **CANCELADO** — sai do plano, não é mais "bloqueado" |
| **espetado** | fica no sintetizado, IoU do preto 34,4%, decimando pela régua da corda |
| **`Cabelo.linhas`** | campo **permanente** do tipo, não dívida a remover |
| **as duas famílias** | convivem em caráter **definitivo** — nem legada nem vigente, duas válidas |
| **T5** em `docs/achados.md` | fechado **por decisão**, não por conserto |

### Por que isto NÃO é entregar peça quebrada

O `stroke` de 12 u **centrado** é exatamente o que encobre o erro da régua da corda —
foi por isso que o defeito atravessou três blocos invisível, e o Bloco 14 só o
descobriu quando a transcrição **tirou o encobrimento**. Mantendo o stroke,
mantém-se o encobrimento: **a peça que o aluno vê é a peça aprovada no Bloco 9.** O
que se perde é fidelidade à arte de origem, não qualidade do render.

### O que continua vivo, e mudou de motivo

A **`entrada-2`** (Assimétrico) segue valendo a reentrada da §8 do runbook — mas
agora como **cabelo novo do catálogo**, não como pré-condição de um passo que não
existe mais. A **`entrada-3`** fica onde está: é a isca do controle 3 de
`arte:revisao`. O **Passo 8** (a luz) segue não iniciado, pela decisão B.

### Onde a decisão foi escrita

`docs/avatar/14-backlog-execucao.md` (a rodada de unificação, reescrita como
cancelada) · `docs/avatar/19-rota-de-arte-runbook.md` §3 e §4 ·
`docs/achados.md` (T5 para os fechados) · `scripts/avatar/arte/converter.ts`
(docstring de `TRANSCREVEM`).

**Não se mexeu em código de produção:** `src/lib/avatar/estilo/pecas-da-arte.ts` e
`cabelo.ts` seguem byte a byte no HEAD.

---

## ✂️ A PODA DO CATÁLOGO — 2026-08-08

O Doug olhou o catálogo em `/dev/avatar-kokeshi` e mandou deixar **só o que ele
aprovou olhando o render**:

> careca, coque, moicano, espetado, chanel e assimétrico. delete os outros.

### O que entrou e o que saiu

| | |
|---|---|
| **entrou** | `assimetrico`, promovida da `entrada-2` pela `fiel` |
| **saíram** | `curto`, `cacheado`, `tranca` — os três paramétricos que ele não aprovou |
| **apagada** | `entrada-3.png` e a pasta de artefatos dela |
| **catálogo** | 7 → **5 peças**. Com a careca, **6 opções** para o aluno |

`careca` não é peça: é a ausência de uma. Por isso `CABELOS` tem 5 e a tela mostra 6.

### As três coisas que a poda quase quebrou, e como cada uma foi fechada

1. **O `curto` era o CONTROLE APROVADO das ferramentas de medição** — `folha.ts`,
   `reguas-conferidas.ts`, `mapear.ts` — e o padrão da página `/dev/avatar-kokeshi`.
   Um controle que aponta para peça apagada **não reprova: ele deixa de existir**, e
   o gate passa por vacuidade. O controle passou a ser o `coque`.
2. **A `entrada-3` era a isca do controle 3 de `arte:revisao`** — a peça
   propositalmente diferente que prova que a comparação enxerga diferença. A isca
   passou a ser uma peça **paramétrica**, e a troca é melhoria: a `entrada-3` era
   outra arte, e no dia em que alguém a revisasse a isca seria a própria peça sob
   exame — o controle compararia uma coisa com ela mesma.
3. **O default do banco.** `curto` era o primeiro da lista porque era o padrão (D5).
   Conferido: a coluna `users.avatar_hair` que os docstrings citam **ainda não
   existe** — as colunas de avatar hoje são `avatar_config`, `avatar_base`,
   `avatar_url` e `avatar_chosen`. Nenhum default aponta para peça apagada.

### A asserção negativa

Os selos das peças que ficaram **não se moveram um byte**. Foram de 15 para 11: os
4 dos paramétricos que sobraram, os 6 dos três traçados, e o da careca.

### Verificação

| gate | resultado |
|---|---|
| `npm run typecheck` | limpo, os dois tsconfig |
| `npm test` | **478 passando** (eram 496 com 7 peças — menos peças, menos iterações) |
| `npm run verify:estado` | 0 violações · painel em **5 de 10** |
| `arte:pecas --check` | confere caractere a caractere |

---

## ⛔ A LUZ MORRE — 2026-08-11

Decisão do Doug, na revisão do plano da V1 do avatar nas telas. **Não é adiamento:
o Passo 8 deixa de existir.**

> Sem luz para cabelos — decisão FINAL.

### Por que ela morre em vez de esperar

Ela nunca teve chão. A arte tem **três** tons de ciano; a paleta do render tem
**dois** — não existe terceiro. Medido na rodada 2 do chanel: a mancha de brilho é
**7,9% da peça e 12,4% da cúpula**, e o render devolve **6 pixels**. E **nenhuma das
21 asserções toca nisso**: sem régua, o Passo 8 só poderia fechar por opinião.

Escrever a régua primeiro era o caminho honesto, e ele custa uma frente inteira para
uma peça que o boneco não pede a 32, 40 ou 56 px — que são os tamanhos onde o avatar
de fato aparece.

### O que isto fecha

| # | pendência | como fechou |
|---|---|---|
| 9 | a régua da luz (papel `luz` sem correspondente no render de 2 tons) | **por decisão** — não há mais o que medir |
| 15 | "a luz (Passo 8) NÃO entrou" | deixa de ser parcial por este motivo |

**A rota de arte fica com ZERO pontas soltas.** As outras três já tinham morrido:
colagem do espetado e do chanel **feita** em 2026-08-07 (`068303b`), reentrada da
`entrada-2` **superada** em 2026-08-08 (entrou pela `fiel`, sem retoque), rodada de
unificação **cancelada** em 2026-08-07 (achado T5, fechado).

### Onde a decisão foi escrita

`docs/ESTADO.md` (bloco AGORA — a lista de pontas zera) ·
`docs/avatar/14-backlog-execucao.md` ("o que sobra vivo") · aqui.

**Não se mexeu em código:** nenhuma linha de `pecas-da-arte.ts`, `cabelo.ts` ou do
compositor depende do Passo 8 — ele nunca começou.

---

## 2026-08-13 — a esteira de CORES FINAIS, e a segunda peça de traje entrou

O Bloco B4 da virada de direção (doc 21 §0). Quatro coisas, nesta ordem.

### 1. O G19 fechou, e ele era pré-requisito

O Gate −1 media o registro num SAD sobre a faixa de rodapé, menos o que a peça
cobrisse — e "o que a peça cobrisse" era só o **ciano**. O contorno preto da barra
não é ciano, ficava dentro do alvo, e o mínimo escorregava. Com a diretriz do
transbordo obrigatória, ia acontecer em toda peça de traje.

O conserto: sai também o que **escureceu** em relação à base, dentro da faixa
(`ESCURECEU = NIVEL = 24`). Assimétrico de propósito — excluir tudo que *mudou*
faria o SAD valer 0 em (0,0) por construção e o registro aprovaria qualquer coisa.

| entrada | antes | depois |
|---|---|---|
| farda (controle negativo) | 0 / 0 · 100,00% | **0 / 0 · 100,00%** |
| a própria base (controle negativo) | 0 / 0 · 100,00% | **0 / 0 · 100,00%** |
| gambesão | 0 / **2** · REPROVADA | **0 / 0 · APROVADA** |
| fixtures b, c, d | reprovam | reprovam |
| fixtures e, f | passam no registro | passam no registro |

**Preço declarado:** a fixture d (recorte de 60 px) caiu de (−18, 3) para (−2, 0).
Ainda reprova duas vezes, mas a margem do registro foi de 18× para 2× a tolerância.
O limite de profundidade que consertaria isso derruba o gambesão, e escolhê-lo maior
seria calibrar na peça que se quer aprovar.

### 2. Os slugs perderam a patente

`traje-soldado-farda` → **`traje-farda`**. Custou zero: nenhuma linha no banco.
Depois do seed do B5 custaria migration de dados.

### 3. A rota de cores finais

| | antes | agora |
|---|---|---|
| máscara | matiz 180° ∩ saturação | **diff contra a base ∩ `noCampoDoTraje`** + salpico + conectividade |
| passo 4 | recolore + recorta | **só recorta** |
| saída | RGBA na cor da patente | **RGBA na cor da arte** |
| controle | luminância por papel na saída | **extrair a própria base = 0 px** |

O campo do traje sai de teto publicado: queixo em cima, `meioDoTronco + 26 u` dos
lados, `yBase + traço/2 + 18 u` embaixo.

**A farda continua sendo recolorida, e é a única.** `COR_FINAL_DECLARADA` tem uma
entrada. Assar o oliva na arte foi tentado e reprovou: o Gate −1 acusou 72 ladrilhos
de forma (ele reconhece a peça pelo ciano) e a máscara encolheu 11 122 px.

### 4. As duas peças, medidas

| | `traje-farda` | `traje-gambesao` |
|---|---|---|
| Gate −1 | aprovada, 0/0/100,00% | aprovada, 0/0/100,00% |
| máscara | 90 510 px | 113 533 px |
| fora do campo | 813 px | 5 957 px |
| controle na base | **0 px** | **0 px** |
| cor de saída | `#78833B` (declarada) | `#13ABB3` (da arte) |
| colagem | 1 : 1, no pixel | 1 : 1, no pixel |
| transbordo | **3,86%** | **17,64%** |
| distinção a 56 px vs. sem traje | 36,45% | 43,90% |
| distinção entre as duas | **43,47%** | |
| composto | 17 formas / 5 537 bytes | 17 formas / 5 540 bytes |

**As duas pontas que ficaram para o Doug** (e não são régua, são olho): o transbordo
das duas cai fora do alvo de ~10% em direções opostas, e os dois vocabulários de
arte destoam na folha. Ver o parecer no fim do Bloco B4.

### O parecer do Doug, 2026-08-13 — as duas peças passaram

> *"analisei a folha traje e aprovo os dois trajes! apenas arrume a parte do
> pescoço do traje azul, mas faremos isso em um novo chat."*

**A esteira do traje tem duas peças aprovadas e uma ponta.** A ponta é o achado
**G20** (a tira de pele no decote do gambesão), e ela é a única de
`docs/achados.md` com "sim" do Doug — trabalho encomendado, em sessão própria.

**As duas ressalvas que eu tinha levantado morreram na tela, e é onde deviam
morrer:**

| ressalva | veredito |
|---|---|
| transbordo fora do alvo de ~10% nos dois sentidos (farda 3,86%, gambesão 17,64%) | **aceito** |
| dois vocabulários de arte destoando lado a lado | **aceito** — estilo misto está decidido na folha, como o doc 21 §0.4 mandava |

**A rota volta a ter zero pontas de processo.** O que existe é uma peça com um
retoque encomendado, e o caminho dele é o de sempre: retoque de geometria no
Gemini → Gate −1 → `arte:traje` → `arte:trajes` → folha. O slug não muda.

---

## 2026-08-13 — o G20 fechou, e a rota ganhou uma quarta saída para arte defeituosa

O retoque encomendado pelo Doug ao aprovar as duas peças. Ele saiu **sem rodada de
gerador** — e é a novidade de método desta entrada.

### A descoberta que mudou o conserto

O achado descrevia dois defeitos (traço do queixo cortado, tira de pele no decote).
São **um gesto só**: o gerador desenhou um pescoço, furando o traço e pintando pele
pelo buraco. E `Y_QUEIXO` = 515,84 px parte esse gesto em duas metades de natureza
diferente, porque é onde `noCampoDoTraje` passa a valer:

| | onde | o que se faz | px | efeito |
|---|---|---|---|---|
| A | y 502–515, **acima** do queixo | restaurar a base — copiar o pixel de volta | 1 889 | **fora do campo**: não muda a peça, muda o Gate −1 |
| B | o V do decote, **dentro** do campo | preencher com o pano da arte, interpolado na linha | 655 | é o defeito que se via |
| C | o canal do laço | idem — a barra do cordão em y 538–542 cortava a componente | 607 | idem |

**Restaurar não é desenhar.** O passo A copia `base-oficial.png`; e como aquela
faixa está acima do queixo, ela sai da máscara — pixel igual à base deixa de
divergir. O contorno ali é do compositor, como sempre foi (amarra nº 3 da §12).

### A régua que separou pele de couro

O difícil não era achar a pele, era **não apagar o cordão**: os dois têm o mesmo
matiz (R/G ≈ 1,35), só a luz separa. O histograma dos quentes em y 550–615 tem vale
— miolo do cordão em **R 32–95** (223 px), pele em **R ≥ 144** (313 px), franja de
antialias no meio. Piso em **100** apaga pele e franja, e poupa o cordão e a barra
horizontal do laço (R máx 101). As colunas de ilhoses (x 486–504 e 558–572) ficam
fora da janela x 512–550 por construção.

### A primeira tentativa reprovou, e o registro é o que importa

Ela preencheu o canal com **balde de tinta** — uma cor medida, constante: 417 px de
tom único dentro de um pano que tem 212 tons na área equivalente, mais uma franja
tan de 1 px contornando o remendo (piso R ≥ 160, alto demais para pegar o
antialias). O remendo se anunciava. **Quem pegou foi a leitura da arte renderizada,
não a régua** — nenhum gate desta rota reprova chapado nem franja.

A versão que passou usa a mesma interpolação do passo B no canal: **725 tons
distintos** em 1 262 px trocados.

### Os números da reentrada

| passo | antes do reparo | depois |
|---|---|---|
| Gate −1 | APROVADA · `permitida` 7 ladrilhos / 8 798 px · não explicado 2 867 px | **APROVADA** · `permitida` **1** / **6 909 px** · não explicado **1 636 px** |
| pele dentro do campo do traje | 1 344 px | **0** |
| traço do queixo em y 502 | 362–432 + 615–698 (vazio de 182 px) | **362–698 contínuo** (base: 363–696) |
| `arte:traje` — máscara | 113 533 px | 113 538 px |
| `arte:traje` — fora do campo | 5 957 px | **4 068 px** |
| cor · controle negativo · fora do recorte | `#13ABB3` · 0 · 0 | **idênticos** |
| folha — colagem · transbordo · distinção 56 px | 1:1 · 17,64% · 43,90% | **idênticos** |

**O parecer do Doug:** *"aprovado"*.

### A quarta saída, e quando ela vale

A rota tinha três caminhos para arte defeituosa: refazer no gerador, retocar no
gerador, ou recusar. Agora tem um quarto — **retoque no pixel, por programa** — e
ele vale quando **o defeito é descritível em régua**: restaurar o que a base já tem,
ou trocar uma cor que um número separa da vizinhança. Aqui evitou uma rodada de
gerador, que traria de volta o risco de mexer no que já estava aprovado.

**O preço é procedência**, e ele se paga com um arquivo: `reparo-g20.ts` fica no
repositório com o cabeçalho explicando cada número, e roda como asserção — sobre a
arte reparada ele conta **0 px**. Se contar mais, o PNG no disco não é o aprovado. A
saída crua do Gemini continua no git, no commit anterior.

**O que isto NÃO autoriza:** desenhar forma nova por programa. Os defeitos nº 3, 4 e
5 do sidecar (decote 19 px fora do centro, seis canaletas em vez de cinco, contorno
fino) continuam abertos e **continuam sendo caso de gerador ou de nada** — o Doug
decidiu que ficam como estão.

---

## 2026-08-18 — a barba entrou pela rota, em seis rodadas, e a quarta saída fez metade do trabalho

A primeira peça do slot `rosto`, e a primeira em que **o gerador e o programa
dividiram a arte**: o Gemini deu a forma, a restauração por régua deu a cor e a
limpeza. O arquivo aprovado é `.scratch/arte/barba-6-limpa.png`.

### As seis rodadas, e o que cada uma ensinou

| rodada | o que chegou | veredito | a lição |
|---|---|---|---|
| `barba-1` | JPEG do Gemini | REPROVADA — deslocamento (3, 8) px · escala 101,00% · rosto 50 ladrilhos · corpo 125 | **redesenho, não formato** |
| `barba-2` | a mesma arte reexportada em PNG pelo Canva | REPROVADA com os **mesmos** números | reexportar não desfaz redesenho |
| `barba-1-remoldada` | registro consertado por programa | REPROVADA — 0 px · 1 px · 100,00%, mas rosto 57 e corpo 59 | consertar registro não conserta desenho |
| `barba-3` | PNG nativo do Gemini | REPROVADA — registro **perfeito**, mas 9 ladrilhos em `corpo` | a sombra projetada na túnica |
| `barba-5` | pedido reescrito, forma copiada do modelo | REPROVADA — rosto 30 · corpo 75 | **a cor veio verde**, e o Gate −1 separa peça de redesenho pelo ciano |
| `barba-6` | mesma arte, bigode apagado | REPROVADA por 9 ladrilhos → **APROVADA depois da restauração** | — |

*(Não houve `barba-4`: a rodada 4 foi um pedido, não uma arte.)*

### A CAUSA que quatro rodadas esconderam, e ela era do pedido

O Doug anexava ao Gemini uma "imagem de modelo" pedindo que a barba dela fosse
copiada. Medido: esse arquivo (`Downloads/barbas/Gemini_Generated_Image_rduci8….jpg`)
é **byte a byte a própria `barba-1`** — diferença máxima **0** em 3 145 728 canais.
Ou seja, pedia-se ao gerador que copiasse um desenho dele mesmo, que é exatamente a
tarefa em que ele é pior.

E o pedido da rodada 4 **exigia bigode**, com um ajuste inteiro em caixa alta, **num
modelo que não tem bigode** — medido: 0 px de tinta nas colunas acima da boca, 0 px
sobre a linha da boca. Instrução específica vence instrução genérica: o texto ganhou
da imagem, e a barba voltou irreconhecível.

**O conserto do pedido foi de moldura, não de adjetivo.** O modelo deixou de ser
"referência de estilo" e passou a ser declarado pelo que é: *"as duas imagens são o
MESMO boneco; a segunda é o resultado que eu quero, e o único problema dela é que o
boneco por baixo saiu de lugar"*. A forma voltou fiel na primeira tentativa:

| | modelo (`barba-1`) | `barba-6` |
|---|---|---|
| caixa | x 79,2→435,0 · y 250,8→421,7 | **x 79,2→435,0** · y 252,5→421,7 |
| largura ÷ cabeça | 0,98× | **0,98×** |
| desce abaixo do queixo | 74,5 u = 0,25 cabeça | **74,5 u = 0,25 cabeça** |
| tinta sobre a linha da boca | 0 px | **0 px** |
| folga de pele abaixo da boca | 30,2 u | **30,2 u** |
| dentro das cápsulas dos olhos | 0 px | **0 px** |
| componentes | 1 | 1 |

### A quarta saída fez metade do trabalho, e a régua é o matiz

`restaurar-barba5.ts` (em `.scratch/`, **ainda não promovido**) faz duas coisas, e
só duas — as duas descritíveis em régua:

1. **cor** — o gerador pintou a barba em verde (`#204020`, `#306040`, `#306030`;
   zero pixel ciano na imagem inteira). A troca é de **matiz**: o pixel mantém
   saturação e luminância e o matiz vai para 180°. Nenhum pixel muda de lugar.
   **Provado isoladamente:** só a troca de cor derruba `rosto` de 30 ladrilhos para
   **0** e `corpo` de 75 para 9 — a cor sozinha respondia por 66 dos 75.
2. **sombra** — restaurar o pixel da base onde o gerador projetou degradê na túnica.
   É o gesto do G20: *restaurar não é desenhar*.

**A franja é o risco conhecido**, e o conserto é dilatar a máscara da peça em **3 u**
antes de restaurar, para o antialias da borda sobreviver. A restauração devolveu
**1 262 tons distintos** da base — não um chapado, que foi o erro da primeira
tentativa do G20.

**O que ela NÃO faz:** tocar na silhueta. O bigode que o gerador acrescentou contra o
pedido ficou **exatamente como veio** — apagá-lo seria desenhar, e forma é do gerador
ou de ninguém. Ele saiu na rodada 6, pelo gerador.

### O bigode morreu de novo, agora com número no tamanho certo

A D16 tinha matado o bigode por medição em 2026-08-13; a decisão de 2026-08-18
reabriu ("barba cheia acompanha bigode"), e a medição fechou outra vez — desta vez
sobre arte real, não sonda sintética.

`.scratch/bigode-no-tamanho.ts` simula o `kk-traco` de 12 u que o compositor aplica
(6 u para fora), reduz até o boneco ter 56 e 32 px, e conta pele intacta entre o
preto do bigode e o preto do sorriso:

| | 56 px | 32 px |
|---|---|---|
| `barba-5-limpa` (com bigode) | **0 px — funde** | **0 px — funde** |
| base careca (**controle negativo**) | nada acima da boca | nada acima da boca |
| `barba-6-limpa` (sem bigode) | **sobrevive** | **sobrevive** |

O controle negativo é o que dá valor ao número: sem ele, o "escuro acima da boca"
poderia ser a própria boca espalhada pela redução.

**A extração não salvaria.** Testado: deixar a região `rosto` apagar o bigode remove
só **36,4%** dele — as pontas laterais ficam, porque estão fora da caixa em x — e
deixa uma **aresta horizontal de 63 u (5,7 px a 56 px)** na fronteira `ROSTO.y1`.

### Os números da aprovação

`npm run arte:gate .scratch/arte/barba-6-limpa.png`

| | |
|---|---|
| deslocamento · escala · rodapé | **0 px · 0 px · 100,00% · 100,0%** |
| `rosto` | **0** ladrilhos · 226 px |
| `corpo` | **2** ladrilhos, maior grupo **1** (teto 1) · 15 592 px |
| `sobrancelha` | 0 ladrilhos · **4 px** |
| `permitida` | 1 ladrilho |
| peça cobrindo o boneco | 14 811 px — **93,6%** |
| não explicado | 998 px — 6,3% |
| dentro de `ROSTO` (o que a extração zeraria) | **53 px** |

**O parecer do Doug:** *"ficou perfeita"*.

### O que isto muda no plano do bigode (aprovado em 2026-08-18)

O **Bloco 2** — a barba consultando uma região própria em vez de `ROSTO`, por
parâmetro — **sai do caminho crítico**. Ele existia porque a `barba-3` perdia
2 697 px (7,5% da peça) na extração; a peça aprovada perde **53 px**. Continua sendo
dívida boa da rota, e o achado permanece válido: `ROSTO` é uma caixa só, e o miolo da
cara está protegido por acidente. Só não bloqueia mais nada.

O **Bloco 1** (a sonda P1 dando um `PISO_DA_BOCA`) foi **substituído por medição
melhor**: `bigode-no-tamanho.ts` mede a arte real com o traço do compositor
simulado, em vez de barras sintéticas. Se um piso vier a ser declarado, é dessa
régua que ele sai.

### O que fica aberto

- **`restaurar-barba5.ts` não está promovido.** A arte no disco é fruto de duas
  etapas, e a procedência precisa de arquivo no repositório com asserção, como o
  `reparo-g20.ts` — sobre a arte já limpa ele tem de contar **0 px** a trocar.
- **A peça ainda não é peça:** falta o traçado para `formas[]`, a entrada em
  `ROSTOS`, e a linha em `avatar_catalogo`.
- **O elenco do slot `rosto` não tem número.** O doc 15 §9 declara *"rosto
  composível, barba, micro-slots"* fora do plano, e a tabela dos 39 desenhos do
  Bloco 8 não tem linha de rosto. Quantas barbas e quantos óculos o catálogo quer é
  decisão do Doug, como o piso de 10 cabelos foi em 2026-08-07.

---

## 2026-08-19 — a segunda barba entrou, e três réguas minhas caíram no caminho

O `cavanhaque` (common) foi aprovado pelo Doug. As artes das duas barbas estão
**versionadas** em `scripts/avatar/arte/`: `barba-cheia.png` e `barba-cavanhaque.png`,
com as saídas cruas do gerador ao lado (`-crua.png`) para procedência.

### O elenco, decidido

**5 barbas: 2 common · 1 rare · 1 epic · 1 legendary**, todas de baú — no banco,
raridade só existe com `origem = 'bau'`. Duas prontas (`cheia`, `cavanhaque`), três
a fazer (`aparada`, `quadrada`, `bipartida`). O elenco e os quatro pedidos prontos
estão em [PEDIDO-BARBAS.md](PEDIDO-BARBAS.md).

### O fluxo que se firmou, em duas ferramentas

O Doug gera a barba no **ChatGPT** (o boneco redesenhado, com a forma que ele quer) e
leva ao **Gemini** junto com a base oficial. O Gemini **transplanta**: fica com o
boneco da primeira imagem e a barba da segunda. É o único gesto que seis rodadas
provaram que ele faz bem — copiar um desenho, não.

O que ele **não** obedece, medido em quatro rodadas: a paleta (veio verde na
`barba-5`, castanho na `cavanhaque-1` e na `-3`) e a cláusula da sombra. As duas
falhas são baratas — a quarta saída da rota resolve as duas sem tocar na silhueta.

### `restaurar-peca.ts` promovido, com a limitação escrita

Substitui o `restaurar-barba5.ts` de `.scratch/`, que reconhecia a peça pela COR e
por isso precisava saber de antemão o que o gerador tinha pintado. O novo reconhece
a peça como **o maior componente conexo que difere da base** e faz duas coisas: troca
o matiz para 180° (preservando saturação e luminância) e restaura a base fora da
peça dilatada.

**Prova de procedência:** `barba-cavanhaque-crua.png` → o script → **byte a byte** a
`barba-cavanhaque.png` versionada.

⚠️ **Ele NÃO reproduz a `barba-cheia`.** A sombra que o gerador projetou na túnica
dela **encosta na barba**, então cai no mesmo componente conexo e sobrevive. Aquela
arte saiu da variante anterior, que separava por cor. Trocar o critério para **matiz**
foi tentado e é pior, medido: aprova no Gate −1 mas apaga parte da peça — a `cheia`
cai de 38 505 px para 16 022. Fica como dívida declarada, não como conserto.

### Os números das duas peças

| | `cheia` (legendary) | `cavanhaque` (common) |
|---|---|---|
| Gate −1 | APROVADA | APROVADA |
| deslocamento · escala | 0 px · 100,00% | 0 px · 100,00% |
| `rosto` | 0 ladrilhos · 226 px | 0 ladrilhos · **0 px** |
| `corpo` | 2 ladrilhos, grupo 1 | 0 ladrilhos |
| tinta | 38 505 px | 14 221 px |
| largura ÷ cabeça | 0,96× | 0,42× |
| desce do queixo | 81,7 u = 0,26 cabeça | 82,5 u = 0,27 cabeça |
| eixo × boca | −34,6 u (ela cobre a cabeça: −2 u do eixo dela) | **−7,5 u = 0,68 px a 56** |
| dentro de `ROSTO` | 53 px | 0 px |
| traço da base sumido | 8 px | 21 px |

**A observação de elenco que fica de pé:** as duas descem quase igual (0,26 e 0,27
cabeça). Como common, o `cavanhaque` deveria ser visivelmente a curta; hoje a
diferença entre as duas é só largura. **O Doug viu e aprovou** — fica como fato do
elenco, não como defeito de arte.

### As três réguas que caíram, e por que isso importa

O Doug aprovou a olho uma peça que as minhas réguas reprovaram, e mandou revê-las.
As três caíram, cada uma por um motivo diferente — e os quatro achados estão em
[docs/achados.md](../../../docs/achados.md):

- **G28** — o piso de "30 u de pele sob a boca" foi **calibrado na `cheia`**, a peça
  que ele deveria julgar. É o defeito que `gates.md` nomeia. Ele reprovou três artes
  e só a peça de origem passava, por construção. **Saiu do pedido.**
- **G29** — a sonda da boca reprovou por um **parâmetro que eu escolhi**: os 6 u de
  traço simulado. Varrendo limiar × dilatação, o veredito "o sorriso morre" existe em
  **2 de 9 células**; nas outras 7 a peça empata com a aprovada. E os 6 u supõem uma
  decisão de promoção **que ainda não foi tomada** (peça de arte emite `kk-traco` ou
  usa o contorno pintado?).
- **G27** — `CENTRO_X = 250` **não é o eixo do rosto**. Medido na base: olhos e boca
  em **289,6**, silhueta da cabeça em 257,1 — o boneco é desenhado de lado, de
  propósito. As sondas amostravam as colunas 238/250/262, e **nenhuma passa pela
  boca**, que está em 269→310. A acusação de "41 u fora do eixo" era da régua.
- **G30** — nenhuma régua mede **"o traço do boneco sumiu"**. Um passo de translação
  apagou 279 px do contorno do queixo e o **Gate −1 aprovou** — ele mede forma por
  ladrilhos de 16 px, e uma faixa de 2 u não move ladrilho. Quem pegou foi o olho do
  Doug. `.scratch/traco-do-queixo.ts` é candidata a gate.

### A rota por código foi tentada e reprovada

O Doug pediu, depois de dois defeitos de traço nascidos de mexer em pixel: *"tente
desenhar diretamente por código, pode usar o PNG como modelo"*. Feito — potrace sobre
a máscara, `formas[]` com massa em `var(--av-linha)` e núcleo em
`var(--av-cabelo, #5A4632)`, traço do compositor. Custou **3 paths / 4 037 bytes**,
dentro do custo declarado de sobreposta (5 formas / 4 500 B), com IoU de **96,5%**.

**Veredito do Doug: "ficou ruim."** A peça e os scripts foram apagados. O que fica
registrado é o que se aprendeu: a rota é viável e cabe no orçamento; o que ela não
entrega é a **sombra**, porque a barba recolore e a sombra exigiria `--av-cabelo-s`,
que está vetado com número em `rosto.ts` (sem fallback declarado, o careca sai preto
chapado). Se a sombra vier a ser exigida, o caminho é declarar o fallback — e isso é
decisão, não conserto.

## 2026-08-19 (tarde) — o bigode voltou, com régua certa, e entrou como sexta barba

O Doug perguntou por que o limite "miolo acima da boca vazio" existia e pediu para
testar uma arte com bigode (`.scratch/arte/bigode-1.png`, Gemini sobre a base). A
resposta mudou a conta: das duas mortes do bigode, a **segunda** (2026-08-18,
`bigode-no-tamanho.ts`) estava medida com as colunas 238/250/262 — **nenhuma passa
pela boca**, que fica em x 269→310 (G27) — e com os 6 u de traço de uma decisão que
não tinha sido tomada (G29). A primeira (D16) era sobre bigode **flutuante**, e
deixava escrito que o bigode **encostado** nunca foi olhado.

### O que se mediu desta vez (`.scratch/perfil-boca.ts`)

Peça = o que difere da base; pintada no pior caso (cabelo `#2B1B0E`); colunas
**550/560/569**, que passam pela boca; controles: base careca e `cavanhaque`.
Luminância (pele ≈ 189):

| | bigode | vão | boca | |
|---|---|---|---|---|
| 56 px, contorno pintado | 102 · 55 | **149** | 122 | 1 px de cinza separa |
| 32 px, contorno pintado | 63 | **144** | 105 | 1 px separa |
| 56 px, `kk-traco` 6 u fora | 30 · 23 · 56 | — | 87 · 73 | **funde** |
| 32 px, `kk-traco` 6 u fora | 16 | 69 | 50 | funde |

Folha a 56 e 32 px: `.scratch/arte/folha-bigode-1.png`. **Leitura:** sem o traço do
compositor a boca vira um furo claro dentro de um anel escuro — "barba em
ferradura"; com o traço, mancha única. O motivo físico continua o da D16: entre a
base dos olhos (y 416) e o topo da boca (y 452) há **36 px = 2,7 px a 56**; bigode,
vão e boca têm de caber aí.

**O parecer do Doug, sobre a folha completa** (`folha-bigode-completa.png`, ao lado
das duas aprovadas): *"perfeita! pode adicionar no catálogo tb (mais uma opção de
rare)"*.

### Consequência que a peça impõe

Aprovar o bigode **decide o contorno**: peça de arte que recolore usa o **contorno
pintado pelo gerador** (5,2 u), não o `kk-traco` de 12 u — com o traço ela morre,
medido acima. Vale para as três barbas de arte. O G29 fecha por esta decisão.

### A esteira, e os números

`arte:gate` na crua: REPROVADA por redesenho (rosto 24 ladrilhos, corpo 40 — cabeça
quadrada e roupa), deslocamento 0 px, escala 100,00%; **olhos e boca idênticos à
base pixel a pixel**. `restaurar-peca.ts` (franja 3 u): 16 811 px em 1 componente,
957 px de ruído descartado, matiz → 180°, 19 751 px restaurados. `arte:gate` na
limpa: **APROVADA** (rosto 0 ladrilhos, corpo 1). Largura 0,41× cabeça, desce 70 u
do queixo, eixo × boca **6,7 u = 0,61 px a 56**, traço da base sumido **11 px**.

Versionada: `barba-bigode.png` + `barba-bigode-crua.png`; a limpa se reproduz da crua
**byte a byte** pelo `restaurar-peca.ts`.

### O elenco agora

**6 barbas — 2 common · 2 rare · 1 epic · 1 legendary.** Três prontas (`cheia`,
`cavanhaque`, `bigode`), três a fazer (`aparada`, `quadrada`, `bipartida`). A
promoção ao catálogo (extração, `ROSTOS`, migration com `origem='bau'`) continua
por começar, agora para três peças.

### A folha recolorida, e o que ela custou para ficar certa (2026-08-19, fim do dia)

O Doug pediu para ver como as três barbas ficam recoloridas antes de promover. A
folha é `.scratch/folha-recolorida.ts` → `.scratch/arte/folha-barbas-recoloridas.png`:
**3 barbas × 9 colunas** (careca com a reserva, mais as 8 cores de cabelo da D27),
cada célula em recorte grande e a 56 px ampliado 4×.

**Aprovada** — *"está ótimo agora"*. A reserva do careca fica em **`#262626`**, preta,
como o Doug pediu (*"a cor reserva será preta com tons de preto mais fraco"*).

Três coisas se aprenderam, e duas foram erro meu:

1. **A `cheia` tinha dois tons de verdade.** Medido: 10 876 px no tom de sombra
   contra 15 747 de massa, e as linhas de baixo (y ≥ 540) com 60–90% no tom escuro —
   o gerador pintou a metade inferior inteira como sombra. Recolorida, lê como barba
   de duas cores. **Consertado por `scripts/avatar/arte/reparo-cheia-um-tom.ts`**
   (versionado, com asserção de idempotência: rodar sobre a saída troca 0 px), Gate
   −1 **APROVADA**. A arte anterior fica como `barba-cheia-dois-tons.png`.
   **Este reparo roda na promoção**, por instrução do Doug (*"e já arrume quando
   promover"*).
2. **Metade do defeito era da minha folha, não da arte.** A máscara de recolorir
   tinha uma caixa (x 380→740, y ≥ 380) e a `cheia` transborda dela — as laterais
   ficavam em ciano cru. Sem caixa, ela recolore inteira. Régua com recorte arbitrário
   errando sobre a peça é o mesmo erro do G27 e do G28, terceira vez na semana.
3. **Tentei uma regra uniforme de contorno e piorei o que estava bom.** A ideia era
   "silhueta = borda, 5 u para dentro = traço preto, miolo = cor do cabelo", para
   resolver o G31 de tabela. Aplicada às três, comeu a textura do `bigode` e da
   `cheia`. **Reprovada pelo Doug** (*"piorou, afetou as outras barbas que estavam
   perfeitas"*) e revertida — a folha aprovada preserva a textura e o contorno
   pintado de cada peça.

**Fica aberto o G31:** a `cavanhaque` recolore só **8%** de si mesma (12 910 dos
13 984 px são preto de contorno) e sai preta nas 8 cores de cabelo. É defeito da arte,
não da régua, e está registrado em `docs/achados.md` — não consertado, pela regra 9.

**A opção 1 continua necessária, e por quê:** o `bigode` (80% recolorível, com sombra
e luz) e a `cavanhaque` têm mais de um tom, e a folha os simula multiplicando a cor do
cabelo pela luminância de cada pixel — isso é **raster, e o compositor é SVG**. Para
o SVG reproduzir a folha, a peça sai em caminhos separados: massa em `var(--av-cabelo)`,
sombra em `var(--av-cabelo-s)` **com o fallback preto declarado**, luz em branco a 30%
(`kk-luz`, que já existe). A `cheia`, agora de um tom só, precisa apenas da massa.

---

## 2026-08-19 (fim do dia) — a PRIMEIRA peça de arte deste projeto virou peça de catálogo

A `barba-cheia` (legendary) saiu de PNG aprovado e entrou em `ROSTOS`. É a primeira
vez que uma arte do Doug atravessa a rota inteira até o catálogo — o traje já tinha
feito o caminho, mas por **outra esteira**, a de cor assada. Esta é a estreia do
braço de quem **recolore**.

### A bifurcação que decidiu o formato, e é a única pergunta que importa

| | traje, chapéu, óculos, pet | **barba** |
|---|---|---|
| recolore? | não — cor assada | **sim, junto com o cabelo (D17)** |
| formato | `.svg` avulso, `<image>` | **`formas[]` com token de cor** |
| esteira | `peca-de-arte.ts` → `arte:trajes` | **`barba-para-formas.ts` → `arte:rostos`** |

Não é outra configuração de traçador: é outro **destino de tipo**. Um `.svg` de cor
assada seria preto fixo, e a Regra Inviolável nº 4 diz que a barba é cabelo.

### A esteira nova, em dois programas

`scripts/avatar/arte/barba-para-formas.ts` — a arte vira duas formas:

1. a **silhueta inteira**, em `var(--av-linha)`. O que sobra dela à vista, com a
   forma 2 por cima, é a banda de contorno que o gerador pintou;
2. o **miolo**, em `var(--av-cabelo, #262626)`.

O corte entre as duas é **luminância < 60** — não é régua nova, é exatamente a da
folha recolorida que o Doug aprovou (`.scratch/folha-recolorida.ts`). Reproduzir no
SVG a mesma partição que ele julgou no raster é o ponto inteiro.

`scripts/avatar/arte/rostos.ts` gera `src/lib/avatar/estilo/rostos-da-arte.ts`, com
`--check` em `verify:arte`, como `arte:trajes`. **Uma assimetria deliberada com o
traje:** lá a lista sai do `readdir` e a arte sem nome reprova; aqui a lista sai dos
`NOMES`, porque a pasta guarda de propósito arte aprovada que ainda não foi promovida.
Descobrir por arquivo promoveria as três de uma vez.

### As três decisões que a peça carrega, e cada uma tem gate

- **`semTraco: true` nas duas formas** — o contorno é o **pintado pelo gerador**
  (5,2 u), não o `kk-traco` de 12 u. Fecha o **G29**, e `rostos-da-arte.test.ts`
  cobra do SVG emitido: o boneco com a peça tem o mesmo número de `kk-traco` que o
  boneco sem ela;
- **a reserva do careca é `#262626`, DECLARADA** — `--av-cabelo` só é emitido quando
  há `modeloCabelo`; sem reserva o `fill` cai em preto e a barba vira mancha da cor
  do próprio contorno, sem nenhuma régua acusar;
- **o `reparo-cheia-um-tom.ts` rodou** — e a prova é de idempotência: rodá-lo sobre a
  `barba-cheia.png` versionada troca **0 px**. A arte no repositório já é a de um tom.

### O `turdSize` entrou, e ele tem número próprio

O miolo da `cheia` são **389 ilhas**, e duas delas — 30 421 px e 846 px — somam
**97,4%** da tinta. As outras 387 medem no máximo 33 px, que é **0,28 px de lado num
boneco de 56 px**; o limite do legível ali é a sobrancelha inteira, 0,66 px, que dá
**50 px² de área** no canvas de 1024. Traçá-las custava **25 274 bytes de `d` contra
8 338** — quatro vezes o desenho, para pintar o que ninguém vê em tamanho nenhum.

`turdSize = 50`. Em `estilo/rotas/potrace.ts` ele é 0, e o argumento de lá continua de
pé: o destino ali é lista de pontos, e um `turdSize` "razoável" decapitava a ponta da
coroa. Aqui o destino é o `d` que o navegador pinta. **Duas respostas diferentes para
a mesma constante, cada uma com a sua medição.**

### Os números da peça

`npm run arte:gate` → **APROVADA** (0 px · 100,00% · rosto 0 ladrilhos · corpo 2,
maior grupo 1).

| | |
|---|---|
| tinta | **38 288 px** em 1 componente |
| contorno pintado (`var(--av-linha)`) | 6 239 px · **16,3%** |
| miolo (`var(--av-cabelo, #262626)`) | 32 049 px · **83,7%** |
| descartado em `ROSTO` | **217 px · 0,56%** — ver **G32** |
| `d` das duas formas | **13 608 bytes** · 3 + 4 subcaminhos |
| ruído descartado | 104 px |

`npm run arte:folha-rosto` desenha a folha de contato: cinco colunas — a arte, o
traçado nas cores da arte, e o compositor em careca · chanel preto · chanel castanho
—, cada uma grande, a 56 px e a 56 px ampliada 4×. As duas primeiras colunas são o
**mesmo recorte** (px 212→812 × 92→932, que é o `viewBox` de 500 × 700), então a
comparação é conta e não enquadramento.

### A leitura da folha, por subagente

- **arte × traçado: indistinguíveis.** Topo, pontas laterais, largura, o V do fundo, a
  janela da boca, a contagem de tufos — todos no mesmo lugar. A única divergência é
  qualidade de aresta: as pontas de tufo do traçado são mais angulosas que as do
  raster. Banda preta na mesma espessura, e nenhuma linha preta a mais no miolo;
- **careca**: a barba lê pela **silhueta**, não pelo desenho interno — `#262626` e o
  contorno preto ficam perto demais e o miolo vira mancha. Foi o que o Doug aprovou na
  folha recolorida, e fica **registrado como fato do elenco**, não como defeito;
- **56 px**: a peça sobrevive sozinha (careca) e sobre a arte; com **chanel preto** ela
  **funde com o cabelo** e o par lê como "cabelo comprido que fecha embaixo"; com
  chanel castanho funde menos. É fato de par cabelo × barba, não da peça;
- **a aresta reta no topo da barba existe na COLUNA 1 também** — ela é do gerador, não
  da esteira.

### O catálogo, e o que ficou vermelho de propósito

- `src/lib/avatar/estilo/rostos-da-arte.ts` (gerado) · `ROSTOS` em `catalogo.ts`
  passa a espalhá-lo · `CATALOGO.rosto` deriva, como o traje;
- `supabase/migrations/20260819120000_bloco5_primeira_barba_no_catalogo.sql` —
  `origem = 'bau'`, `raridade = 'legendary'`. **ESCRITA E NÃO APLICADA**: a peça
  esperava o parecer do Doug sobre a folha, e semear no banco de produção uma peça de
  baú antes disso é conceder o que ninguém aprovou;
- por isso `verify:catalogo-slots` reprova em **1 de 34**, e a mensagem é exatamente a
  certa: *"slot rosto: 1 peça(s) do código sem linha no banco — rosto-barba-cheia"*.
  Ele volta ao verde no comando de aplicar a migration.

### ⚠️ Os dois achados que a esteira trouxe, medidos e NÃO consertados

- **G32 (novo)** — `ROSTO` é uma caixa só e come **23,1% da `barba-bigode`** (3 877 px)
  na extração, contra 0,56% da `cheia` e 0% da `cavanhaque`. O bigode inteiro mora
  acima da boca, que é o miolo da caixa. Traz de volta o **Bloco 2** do plano de
  2026-08-18 (região própria por parâmetro), que tinha saído do caminho crítico;
- **G31** — a hipótese *"a extração é onde isso se resolve"* foi medida e é **falsa**.
  O histograma da `cavanhaque` é escuro de ponta a ponta (moda em 40–49, 92,4% abaixo
  de 60, cauda de 1,4% entre 60 e 100). Não há massa para devolver: mover o limiar de
  60 para 90 recupera **1,4%** da peça. As saídas continuam sendo regerar a arte ou
  decidir tratar o preto interno como massa **só nela** — e nenhuma é da esteira.

### O que fica aberto

- **aplicar a migration**, depois do parecer;
- o slug **`rosto-barba-cavanhaque` já está tomado** por uma barba paramétrica antiga
  (`estilo/rosto.ts`, `BARBAS.vertical`) que nunca entrou em `ROSTOS`. Quando a arte
  do cavanhaque for promovida, uma das duas troca de slug — é decisão, não conserto;
- as outras **cinco barbas**: `cavanhaque` (presa ao G31), `bigode` (preso ao G32), e
  `aparada`, `quadrada`, `bipartida`, que ainda não têm arte.

---

## 2026-08-19 (fim do dia, depois da folha) — a barba VESTE, e o cabelo cobre

O Doug olhou a folha de contato e reprovou a ordem das camadas: *"a camada barba
veste, depois a camada cabelo deve vir e cobrir a barba (se houver o que cobrir)"*.
Até aqui o slot `rosto` inteiro saía **depois** do cabelo, e nas colunas com `chanel`
a serrilha da barba cortava a curva lisa do cabelo — o avesso do que a vida faz.

### O conflito era real, e tinha decisão dele dos dois lados

O slot `rosto` guarda **barbas e óculos** (doc 21:1232), e os dois querem lados
opostos da mesma camada:

| peça | de que lado | por quê |
|---|---|---|
| **barba** | sob o cabelo | pedido de 2026-08-19, acima |
| **óculos** | por cima do cabelo | decisão do Doug, doc 21 §2c — sem haste não há o que apoiar, a lente é livre para exceder o rosto, e a peça que a criança desbloqueou não pode depender de qual franja está por baixo |

Mover o slot inteiro resolveria a barba **revogando** a decisão dos óculos. O Doug
escolheu a outra saída: **bandeira por peça**. Quem escolhe é a peça; o compositor
obedece. É o mesmo idioma do `atras` das extensões.

**Isto não reabre a D17.** A fusão entre barba e cabelo continua aceita — o que a
bandeira decide é **quem vence a sobreposição**, não se ela existe.

### `cabeloPorCima`, e o nome custou uma troca

O campo nasceu `sobOCabelo` e foi renomeado antes de sair do papel: ele fica a **uma
letra** de `sobreOCabelo`, que significa o oposto exato — e é justamente essa
distinção que o campo existe para codificar. `cabeloPorCima` nomeia o **mecanismo**
(oclusão: o cabelo pinta depois e tapa) e não tem par mínimo invertido.

`atras` foi recusado por já querer dizer duas coisas (*sob o tronco*, `Traje.extensoes`;
*atrás da cabeça*, `Extensao` em `cabelo.ts`) — um terceiro sentido faz a palavra não
significar nada.

### A trava do chapéu é do TIPO, não de teste

`PecaSobreposta` **não** ganhou o campo. Quem ganhou foi um par novo em `tipos.ts`:

```
export type PecaDeRosto  = PecaSobreposta & { cabeloPorCima?: boolean };
export type PecaDeChapeu = PecaSobreposta & { cabeloPorCima?: never };
```

O motivo é que o chapéu é sempre o último e não tem lado a escolher. Se o campo
morasse no tipo comum, um chapéu **poderia** declará-lo, e a única defesa seria um
teste sobre `CHAPEUS` — que está **vazio**, ou seja, um teste vácuo, que é o modo de
falha nº 1 desta casa. Com o `never`, o `typecheck` fecha os dois sentidos e nenhum
deles depende de haver peça. `EstadoAvatar`, `ROSTOS` e `CHAPEUS` passaram a usar os
tipos precisos; `pecas-de-elenco.test.ts` mantém a trava viva pelo caminho contrário,
com um `@ts-expect-error` que fica sem erro para consumir se alguém tirar o `never`.

### O que se moveu no compositor, e o que NÃO se moveu

`sobreposta` — o cabelo traçado — **não saiu do lugar**, e é isso que mantém os 11
selos byte a byte de `parametrico-congelado.ts` e o teste *"a massa sai depois da
sobrancelha"* (`linhas-cabelo.test.ts`) intactos. O que se partiu em dois foi o rosto:

```
… boca …
rosto(true)  +   ← a barba, sob o cabelo
sobreposta   +   ← o cabelo traçado (parado)
rosto(false) +   ← o óculos, por cima
sobrepor(estado.chapeu) +
```

**O chapéu não passa pelo filtro, e é deliberado.** Se a partição fosse um segundo
parâmetro de `sobrepor()`, a chamada dele viraria `sobrepor(estado.chapeu, false)` — e
um chapéu que um dia declarasse a bandeira **sumiria do boneco em silêncio**, porque
nenhuma das duas passadas o emitiria. Filtrando só do lado do rosto, a bandeira num
chapéu é inerte em vez de fatal.

**A lista de camadas do docstring foi corrigida de dois jeitos**: ela parava no item 9
e **não mencionava rosto nem chapéu** desde que os dois slots nasceram — mentia por
omissão. Agora vai até 13, com os dois lados do rosto numerados separadamente.

### Os 9 testes novos, e as duas pernas da não-vacuidade

Em `pecas-de-elenco.test.ts`, um bloco novo. O que carrega o peso são os **controles
negativos**, não a régua positiva:

- com a bandeira, a peça sai **antes** da massa do cabelo e depois da boca;
- **sem** a bandeira, a MESMA peça sai **depois** da massa — a desigualdade *inverte*.
  Sem esta linha o bloco passaria no dia em que alguém pusesse todo rosto sob o cabelo
  e a bandeira virasse enfeite;
- a peça é emitida **uma vez só**, nas 4 combinações de bandeira × família de cabelo.
  A partição é sobre UMA peça, não sobre uma lista: emitir nas duas pontas sem filtro
  desenharia a barba duas vezes, uma exatamente sobre a outra — **idêntico na tela**, e
  dois `<path>` a mais × 30 bonecos no ranking;
- careca: a bandeira **não muda um byte**;
- paramétrico: a bandeira é **inerte**, e o teste prende isso como limitação em vez de
  deixar alguém "consertar" por engano;
- o chapéu continua sendo o último;
- o **traço viaja junto** com o preenchimento — `sobrepor()` emite os dois na mesma
  chamada, e se alguém juntar as passadas de traço "para economizar", o contorno da
  barba volta para cima do cabelo e só esta linha acusa;
- a trava de tipo do chapéu, por `@ts-expect-error`.

Em `rostos-da-arte.test.ts`, a peça real declara a bandeira.

### ⚠️ A limitação, declarada e não consertada

**A bandeira só alcança o cabelo TRAÇADO** (`espetado`, `chanel`, `assimetrico`). Os
paramétricos (`coque`, `moicano`) moram **dentro do clip do crânio** e são emitidos
muito antes das feições, então a barba continua por cima deles com bandeira ou sem.

Hoje isso não produz defeito, porque nenhum dos dois desce ao queixo — mas é
**limitação, não garantia**, e nenhum gate mede isso: a régua `FOLGA_ROSTO` de
`folha-base.ts` mede a **testa contra a sobrancelha**, não o alcance ao queixo. No dia
em que um paramétrico descer, a causa está no compositor e não na peça.

### Verificação

`npm run typecheck` · `npm run lint` · **554 testes** (eram 545) · `npm run build` ·
`npm run verify:arte` (com `arte:rostos --check` conferindo o literal regerado) ·
`npm run avatar:folha-base` — os 11 selos parados, o teto da base em 7 468 intacto, e
a contagem de formas do composto de 3 camadas igual: reordenar não cria nem apaga
forma nenhuma.

`npm run arte:folha-rosto` regerada para o parecer.

### A leitura da folha depois da troca, por subagente

**O efeito pedido aconteceu.** Nas duas colunas com `chanel`, a curva externa e a
interna do cabelo passam **contínuas e lisas**; nenhuma ponta de tufo da barba
interrompe ou serrilha a linha do cabelo. Antes era o avesso. A silhueta do conjunto
virou a do cabelo sozinho, sem degrau e sem buraco: a barba passa por trás e emerge
abaixo das pontas.

**E ele tem um preço, que é do elenco e não da peça.** O cabelo cobre as pontas
laterais da barba — o que sobra visível é a faixa do maxilar para baixo, ~55–60% da
altura que ela tem no careca. A leitura muda de gênero: no careca a barba é uma moldura
em U que sobe às bochechas; com `chanel` ela lê como massa presa ao queixo.

**A 56 px, com cabelo, o par vira massa escura única** — o careca comunica "barba", os
com cabelo comunicam "cabeça peluda". No preto (`#3A2F2A` × `#262626`) barba e cabelo
são quase o mesmo valor e o único separador é o contorno pintado, que some na redução;
no castanho o 4× ainda separa pelo sombreado interno.

**Isto é a D17 acontecendo, não um defeito novo.** A fusão foi aceita em 2026-08-17,
com as saídas 2 e 3 mortas por decisão, e ela deixa escrito que *"se um dia alguma
delas ficar feia, é caso de desenho, não de régua"*. A leitura anterior — com a ordem
antiga — já media a mesma fusão. **Não vira achado; vira fato do par cabelo × barba,
para o Doug decidir se quer desenho diferente.**

**Uma fresta a conferir:** no castanho, lateral esquerda, ~4–6 px de pele entre a
serrilha da barba e a borda interna do cabelo (2–3 px no preto, e nada do lado
direito). **Buraco na união é independente da ordem** — só existe onde nenhuma das duas
peças pinta —, então ele não veio desta troca: vem da forma da arte contra a do
`chanel`. Fica registrado para quando alguém olhar de perto.

**As colunas 1 e 2 continuam indistinguíveis**, com as mesmas duas divergências de
sempre: o ciano do traçado é chapado (a arte tem a variação tonal do gerador) e as
pontas de tufo saem 1–2 px mais agudas.

### O defeito que o Doug pegou na folha, e o conserto (2026-08-19, fim do dia)

*"tem um problema na barba em si (falta um contorno no lado direito, abaixo do olho
direito). e o chanel come a barba"* — dois problemas, e só um é bug.

**O primeiro é bug, e reproduziu na primeira tentativa.** O recorte da região `ROSTO`
cortava a peça **pelo miolo** e deixava **27 px de aresta nua**: massa terminando sem
o contorno preto que o gerador pintou, em px x 666→684 · y 453→462 — **84 px abaixo do
olho direito**, exatamente onde ele apontou.

A causa é o **G32**: `ROSTO` é uma caixa só, e o conjunto que ela deveria proteger
— dois olhos e uma boca — **não é convexo**. Os quatro cantos da caixa estão vazios, e
a barba entrava pelo canto inferior direito, a 67 u da boca e 84 px abaixo do olho.

**O conserto** é `FEICOES` em `base.ts`: as mesmas constantes de `ROSTO`, partidas em
três caixas. A da boca inclui a **sagita** do sorriso, que `ROSTO` não incluía — a
única fronteira em que a régua nova protege MAIS que a antiga. `ROSTO` fica intacto,
porque é o que o Gate −1 e a extração de cabelo medem.

| peça | descartado antes | depois |
|---|---|---|
| `barba-cheia` | 217 px · **27 de aresta nua** | **0 px** |
| `barba-cavanhaque` | 0 px | 0 px |
| `barba-bigode` | 3 877 px · 23,1% | **reprova** |

**O gate mora em `barba-para-formas.ts` e reprova, não relata.** Ele conta a aresta nua
antes e depois do recorte e cobra só a **diferença** — o número absoluto não serve de
teto, porque a arte tem aresta nua legítima onde a peça sai pela borda do canvas.
Aresta que **o recorte criou** é sempre defeito, porque o recorte corta por dentro.

Rodado nos dois estados:

```
ANTES  Error: o recorte das feições cortou o MIOLO da peça: 27 px de aresta nua
         caixa px x 666→684  y 453→462
DEPOIS dentro das FEIÇÕES  0 px   ·  peça 38 505 px  ·  13 674 bytes de `d`
```

**Ele não é vácuo:** passa na `cheia` e na `cavanhaque`, e **reprova no `bigode`** —
que de fato mora em cima da boca. Antes o descarte só era contado no laudo, e a peça
saía amputada com todos os gates verdes.

**O que este gate NÃO enxerga:** ele mede a fronteira da MÁSCARA, não o `d` traçado —
se o `potrace` inventar uma aresta, ele não vê. Também não mede oclusão: uma peça
inteira coberta por outra passa nele. E ele não sabe se a caixa que recorta é a certa;
sabe apenas que ela não corta pelo miolo.

**O segundo não é bug: o `chanel` come 42,5% da barba** — contra 24,2% do assimétrico
e 1,2% do espetado. Medido: 0 px de barba por cima do cabelo, nenhum vão de pele, o
contorno fecha na junção. A oclusão é legítima; o `chanel` é um bob que desce pelas
bochechas e está fisicamente na frente. **É defeito de elenco, e vai ao Doug como
decisão** — registrado em **G33**, com as quatro saídas e nenhuma delas de código.

### A barra preta do chanel sobre a barba — consertada (2026-08-19, mais tarde)

O Doug mandou um crop da lateral direita: *"isso ainda está errado"*, e depois
*"erro é na sobreposição do cabelo chanel, bem nessa parte. está acima da barba"*.

**Eu tinha errado o diagnóstico duas vezes antes de olhar.** A primeira hipótese
(descasamento de tom entre `--av-cabelo` e `--av-cabelo-s`) caiu na medição: o corpo
do chanel é **82% `--av-cabelo`**, a mesma cor da barba. A segunda (o recorte das
feições) era um defeito real e foi consertada, mas não era a que ele estava vendo.
Só o zoom renderizado mostrou.

**A causa.** A peça traçada emite quatro camadas (`pecaSobreposta`):

```
1. kk-tinta     — a silhueta PRETA cheia
2. kk-cabelo-m  — o núcleo colorido
3. kk-cabelo    — a clara
4. kk-tinta     — as pretas internas
```

O que se vê da camada 1 é só **o anel que o núcleo não cobre** — contra a pele isso é
o contorno da peça, e é o certo. Com a barba desenhada logo ANTES do cabelo, esse anel
passou a cair sobre a barba: uma **barra preta de ~18 u atravessando um campo de uma
cor só**, porque as duas peças são da mesma cor. No loiro é um risco no meio do
dourado; no preto some.

**O conserto.** `pecaSobreposta()` devolve `{ fundo, frente }` — a camada 1 separada
das outras três — e `compor()` intercala:

```
sobreposta.fundo  +   ← a silhueta preta do cabelo
rosto(true)       +   ← a barba (preto e cor)
sobreposta.frente +   ← núcleo, clara, pretas internas
rosto(false)      +
sobrepor(chapeu)
```

**As pretas de todo mundo primeiro, as coloridas depois.** É a mesma doutrina que
`sobrepor()` já usa por dentro (*todo preenchimento antes de todo traço*) e que
`extensoes()` usa. O resultado é exatamente a **D17**: onde barba e cabelo encostam,
viram uma massa só — o núcleo do cabelo continua por cima da barba (o pedido dele
continua valendo), mas o anel preto do cabelo é coberto pela cor da barba.

A família **sintetizada** (`espetado`) não entra na partição: o preto dela é `stroke`
(`kk-cabelo-l`), não laço cheio, e não há camada para separar. Custa pouco — ela cobre
**1,2%** da barba.

**A condição que mantém os selos:** sem peça de rosto, `fundo + frente` é a
concatenação de sempre, **sem um caractere entre as duas**. Os 11 selos de
`parametrico-congelado.ts` não se mexeram, a base careca continua em 19 formas, e o
composto de 3 camadas tem a mesma contagem. `pecas-de-elenco.test.ts` ganhou uma
asserção que cobra essa colagem byte a byte — um espaço a mais ali mataria os selos
todos de uma vez, com a causa longe daqui.

**Três testes meus caíram no conserto, e a régua deles é que estava grossa.** Eles
mediam `search(/<path class="kk-(tinta|cabelo-m)"/)` — o mesmo marcador de
`linhas-cabelo.test.ts` —, que casa com as DUAS camadas e devolve a primeira. Com a
peça partida, ele dizia *"a barba saiu depois do cabelo"* quando ela tinha saído no
meio dele. Agora são dois marcadores separados, e o contrato virou uma linha:
**silhueta preta → barba → núcleo colorido**.

### A barra preta não era barra — a partição de ontem caiu (2026-08-20)

O Doug olhou o render de ontem: *"pirou do lado esquerdo (saiu o contorno preto do
cabelo) e melhorou um pouco do lado direito, mas ainda é possível ver o tom diferente
que sobrou do chanel"*.

**Dois sintomas, uma causa, e a causa era minha.** `compositor.ts` emitia
`sobreposta.fundo + rosto(true) + sobreposta.frente`: a forma colorida da barba
pintada por cima da silhueta preta do cabelo apagava **12 733 px** de preto ao longo
de toda a junção.

**A premissa de ontem estava medida errada.** Eu escrevi que aquele anel era *"uma
barra preta de ~18 u atravessando um campo de uma cor só"*. `.scratch/largura-do-anel.ts`
mede a espessura como a menor corrida preta que passa por cada pixel, nas quatro
direções:

```
TRACO do compositor = 12 u · contorno pintado da barba = 5,2 u

anel APAGADO pela barba            n= 12733  p50 11.7 u  p90 12.2 u  máx 21.1 u
anel que sobrevive (contra pele)   n= 16325  p50 10.6 u  p90 25.6 u  máx 35.0 u
```

**11,7 u é o `TRACO`.** Não era barra: era o contorno de oclusão do cabelo, na
espessura de linha de todo o resto do boneco. Só **205 px (1,6%)** passam de 16 u, e
ficam num trecho de queixo em u x 181→353 — nenhuma barra larga em lugar nenhum.

**O segundo sintoma é consequência do primeiro, não um item separado.** A linha preta
era o que separava o núcleo escuro do chanel (`--av-cabelo-s`) da massa clara da barba
(`--av-cabelo`). Apagada, os dois tons passaram a encostar direto: **489 px de
costura**, de u x 156 a 424 (`.scratch/degrau-onde.ts`). É o "tom diferente que sobrou
do chanel", e ele **nasceu** do conserto de ontem.

**O conserto:** reverter a partição. `pecaSobreposta()` volta a devolver uma string, e
`compor()` volta a `rosto(true) + sobreposta`. **`cabeloPorCima` não caiu** — o pedido
do Doug de 2026-08-19 (*a barba veste, o cabelo cobre*) continua exatamente de pé; o
que voltou é o cabelo cobrir INTEIRO, contorno junto, em vez de só com as coloridas.

| régua | antes | depois |
|---|---|---|
| preto do cabelo apagado pela barba | 12 733 px | **5 914 px** |
| costura núcleo escuro × barba clara | 489 px | **269 px** |

**Os 5 914 px que sobram não são do cabelo.** A mesma medição no CARECA dá o mesmo
resultado (`.scratch/o-que-a-barba-apaga.ts`): é a barba cobrindo o contorno do
**queixo do boneco**, numa faixa em u x 176→414 · y 319→364 — comportamento da arte,
anterior a tudo isto. No careca o miolo cai na reserva `#262626` e continua escuro; com
cabelo ele vira `--av-cabelo` e clareia. Os 269 px de costura que sobram são o **item 2
do G33**, que segue aberto e é da arte, não da ordem.

### O gate, e ele falha antes e passa depois

`pecas-de-elenco.test.ts`, o contrato virou **barba → silhueta preta → núcleo colorido**
(era o inverso desde ontem). Rodado nos dois estados:

```
ANTES  × com a bandeira, a peça entra ANTES do cabelo INTEIRO
       AssertionError: a silhueta preta do cabelo saiu ANTES da barba:
         expected 8083 to be less than 6917
DEPOIS ✓ 21 tests passed
```

O comentário do teste guarda os números da medição, para que a próxima pessoa que
quiser partir a peça de novo leia primeiro por que ela não se parte.

### Verificação

`npm run typecheck` · `npm run lint` (1 warning pré-existente em `GameReview.tsx`) ·
**555 testes** · `npm run verify:arte` (exit 0) · `npm run build`. Os **11 selos** de
`parametrico-congelado.ts` parados — `linhas-cabelo.test.ts` verde —, porque sem peça
de rosto a string do cabelo nunca foi partida.

`npm run arte:folha-rosto` e os dois zooms laterais regerados para o parecer.

### A leitura dos zooms depois do conserto, por subagente

**Lateral DIREITA — resolvido.** A linha preta acompanha toda a extensão da serrilha da
barba contra o cabelo, contínua, na mesma espessura dos outros contornos da peça. Lê
como contorno natural, não como barra sobre campo chapado. **Nenhum degrau de tom
sobrou** ali dentro da massa.

**Lateral ESQUERDA — o braço diagonal do defeito sumiu.** Na coluna do magenta (o preto
que a barba apaga), o **braço diagonal longo** que descia pela mecha **não existe mais**;
sobrou só a faixa horizontal, que é o contorno do queixo do boneco, e ela já aparece
cortada ao meio pelo preto restaurado. Onde a mecha encontra a serrilha há agora um
entalhe preto na espessura do desenho.

**O que sobrou, e é o G33 item 2:** logo à direita desse entalhe, uma transição curta de
tom entre o marrom do cabelo e o da barba, sem preto cobrindo. São os 269 px medidos.
**Não é da ordem das camadas — é a arte da barba ter um tom só contra as duas do chanel.**

### A cunha do chanel dentro da barba — diagnosticada, e o conserto REVERTIDO (2026-08-20)

O Doug: *"o Chanel morde/recorta a silhueta lateral da barba. No castanho isso aparece
claramente como uma cunha castanha entrando entre a bochecha e a barba, principalmente no
lado direito"*.

**O diagnóstico está certo e é uma unidade de duas camadas.** A mecha é o **lóbulo 2 de
`nucleo`** da `chanel` (`pecas-da-arte.ts`, y 339,8–383,0), **85,0% dentro da silhueta da
`barba-cheia`**, mais a **banda preta da `massa`** em volta dele.

**O conserto que escrevi primeiro — `Cabelo.nucleoQueCedeAoRosto: [1]` — não consertou.**
Ele cedia só o preenchimento colorido, e o A/B mediu o que isso faz:

```
pixels que a cessão mudou: 11 723 = 1 495 u²   bbox u x 358→409 y 339→383  (= o lóbulo 2)
  --av-cabelo-s → --av-cabelo (a clara):        0
  --av-cabelo-s → PRETO (a silhueta):      11 388
```

**Trocou a cunha castanha por uma cunha preta**, da mesma forma e no mesmo lugar. Pior:
a lateral serrilhada da barba, que o controle mostra com 4–5 pontas, vira um bloco preto
liso. **Revertido** — cabelo, compositor e teste voltaram ao estado da entrada anterior.

**Erro meu de leitura, e vale registrar:** eu li o preto que sobrou como *"contorno
contínuo que funde com a barba"* e chamei a massa externa de intacta. Não estava. A
crítica que o Doug trouxe apontou isso antes da minha própria régua.

**Isolação por camada** (`.scratch/isola-meia-lua.ts`, 6 colunas, uma camada desligada por
vez): sem a **silhueta preta** a meia-lua some; sem `pretas` e sem `clara`, **nada muda**.
Medido, o preto do cabelo dentro da barba acima de 16 u: **936 u², máx 26,1 u = 2,2× o
`TRACO`**, todo do lado direito, em u x 348→395 · y 335→365. Não é contorno; é massa.

### Por que não existe conserto por ordem, e as quatro saídas medidas

A mecha é uma unidade visual de duas camadas, e a `massa` é **um laço fechado só**. Não
há como dizer *"aqui o contorno vale, ali não"* dentro de um path — e é por isso que
`nucleoQueCede...` + `pretoQueCede...` seriam duas metades da mesma peça, não uma
abstração.

| | o que faz | custo, medido |
|---|---|---|
| **A** cabelo por cima (estado de hoje) | — | cunha castanha de 1 495 u² dentro da barba; lateral serrilhada amputada |
| **B** ceder só o núcleo | revertida | mesma forma, agora PRETA; pior das três |
| **C** barba por cima (`cabeloPorCima: false`) | mata a cunha inteira, devolve as 4–5 pontas da barba | reabre 2026-08-19: perímetro da região visível do cabelo **+34%** (2 173 → 2 921 u) com área −5% — a serrilha da barba passa a morder a borda do bob |
| **D** recortar a mecha em forma própria | única que atende tudo que o Doug pediu | geometria nova em `pecas-da-arte.ts`, que é **gerado**: seria a segunda descrição de uma borda medida, que é o defeito que aquele arquivo existe para evitar |

**Uma medição minha que era vazia, e fica anotada:** cheguei a comparar a *silhueta
externa* de A e C e achei 0 px de diferença nas três cores. Não prova nada — a silhueta
de uma união não depende da ordem de desenho. O que a objeção de 2026-08-19 mede é
fronteira INTERNA, e é a linha do perímetro na tabela acima.

**A folha da decisão:** `.scratch/arte/tres-caminhos.png` — controle · A · B · C · C no
preto, em três faixas (zoom da junção, rosto inteiro, 56 px ampliado 4×). Leitura por
subagente: **C é a mais próxima do controle, com folga**; B é a pior; a 56 px nenhuma das
três colapsa, porque o que sustenta a leitura *"barba"* naquele tamanho é a silhueta dela
contra a PELE, idêntica nas três.

**Está parado esperando o Doug**, porque C troca um defeito que ele reprovou por outro que
ele já reprovou antes, e D mexe em arte medida.

### ⛔ A entrada do "caminho C" foi ESCRITA E NUNCA VALEU — corrigida em 2026-08-20

**Esta seção substitui uma entrada que afirmava, com todas as letras, que o caminho C
tinha sido escolhido e executado.** Ela dizia que `rostos.ts` deixava de emitir
`cabeloPorCima: true`, que `arte:rostos` tinha regerado o literal, e que o teste
`rostos-da-arte.test.ts` tinha virado de *"declara"* para *"NÃO declara"*.

**Nada disso foi para o código, e não deveria ter ido:** perguntado hoje, o Doug
confirmou que **mudou de ideia no fim daquela sessão**. A ordem vigente é a de
2026-08-19 e continua sendo a diretriz do slot — *a peça NASCE da cabeça, ou é POSTA
nela?* Pelo nasce e veste **sob** o cabelo; acessório é posto e vai por cima.

**O código nunca esteve errado.** `rostos.ts:149` emite `cabeloPorCima: true`,
`rostos-da-arte.ts` o carrega, `rostos-da-arte.test.ts:103` o cobra, e a doutrina está
escrita no docstring de `LadoDoRosto` (`camadas.ts`) e no `compositor.ts`. Os cinco
concordam entre si; quem discordava dos cinco era este registro.

**O que a auditoria mediu ao pegar isto** (`.scratch/estilo/ordem-perdida.ts`, 2026-08-20),
para que o custo desta ordem fique com número e ninguém precise remedir:

| cabelo | silhueta da barba | comida pelo cabelo | % |
|---|---|---|---|
| `chanel` | 26 728 u² | 5 977 u² | **22,4%** |
| `assimetrico` | 26 728 u² | 3 284 u² | **12,3%** |
| `espetado` | 26 728 u² | 246 u² | **0,9%** |
| `coque` · `moicano` | 26 728 u² | 0 u² | **0,0%** — inertes, vivem no clip do crânio |

É o mesmo fato que o **G33** já registrou como **custo declarado**, medido por outra
régua (lá, 42,5% pela área da peça; aqui, 22,4% pelo pixel que o cabelo de fato
substitui). As duas contas respondem perguntas diferentes e nenhuma reabre a ordem.

**A lição, e ela é de processo, não de arte.** As quatro saídas medidas (A, B, C, D) e
a folha `.scratch/arte/tres-caminhos.png` continuam valendo — o que não valia era a
linha seguinte, que registrou uma decisão como **executada** antes de existir código.
Este arquivo é registro de execução: **entrada que descreve mudança tem de ser escrita
DEPOIS de o gate passar sobre ela**, nunca junto com a intenção. A entrada de ontem
citava até a contagem de testes ("555") de um estado que nunca compilou.


### 2026-08-20 · "a cor está fugindo do traço" — a franja da borda virava miolo

O Doug abriu a folha individual da `cheia` e disse: *"o contorno da barba, que deveria
ser um traço preto, tem a cor fugindo, excedendo o traço"*. Defeito de **esteira**, e
os dois números que separam a culpa:

| peça | a ARTE deixa a borda sem preto | o RENDER punha cor na borda |
|---|---|---|
| **cheia** | 28 px (**1,7%**) | 342 px (**24,4%**) |
| cheia-com-bigode | 29 px (1,5%) | 391 px (22,5%) |
| rala | 265 px (17,0%) | 689 px (52,7%) |
| bigode-ferradura | 118 px (9,7%) | 199 px (18,8%) |
| bigode-puro | 0 | 0 |
| cavanhaque-nova | 11 px (1,4%) | 22 px (3,3%) |
| cavanhaque-antiga | 2 px (0,2%) | 24 px (2,2%) |

**A CAUSA, com arquivo e linha.** `barba-para-formas.ts`, passo 3: a peça é *o que
difere da base*, então o anel mais externo dela é **antialias** entre o preto do
contorno (lum 18) e a pele (lum 183). A mistura lê lum ≈ 100, acima de
`LUM_CONTORNO = 60`, e a franja entrava no MIOLO. O miolo é a segunda forma e vai por
cima do contorno — a cor terminava pintada exatamente onde o traço deveria estar.

**A BANCADA** (`.scratch/estilo/franja-da-borda.ts`), k passos de erosão da peça:

| peça | k=0 | k=1 | k=2 | recolore k=0 → k=1 |
|---|---|---|---|---|
| cheia | 24,4% | **1,7%** | 0,0% | 83,6% → 80,7% |
| cheia-com-bigode | 22,5% | **0,4%** | 0,0% | 61,6% → 58,7% |
| rala | 52,7% | **2,8%** | 0,0% | 62,7% → 59,0% |
| bigode-ferradura | 18,8% | **0,8%** | 0,0% | 79,5% → 73,8% |
| cavanhaque-nova | 3,3% | 1,0% | 0,0% | 44,6% → 40,5% |
| cavanhaque-antiga | 2,2% | 0,0% | 0,0% | 7,6% → 3,1% |

**k = 1, e o motivo de não ser 2:** com 1 px o que sobra **é o defeito da arte**, e os
números batem — 24 px de resíduo na `cheia` contra 28 px que o gerador deixou sem
preto. k = 2 zera a coluna e, ao zerá-la, apaga também o erro do gerador, que é
justamente o que a folha existe para mostrar ao Doug. É a lição do *"não desenhar para
a régua"*.

**O GATE:** `scripts/avatar/arte/__tests__/franja-da-borda.test.ts` — *"nenhum pixel de
miolo encosta em não-peça"*. Antes: **1 094 px**. Depois: **0**.

**Efeito colateral medido, e o selo o pegou sozinho:** o `d` da `barba-cheia` caiu de
**13 674 para 11 372 bytes** (−16,8%) — o miolo deixou de perseguir a beirada
serrilhada. O selo de `rostos-da-arte.test.ts` reprovou pedindo explicação, que é o
que ele existe para fazer.

**⚠️ Consequência para a `cavanhaque-antiga`:** ela cai de 7,6% para **3,1%** de
recolorimento. Não é regressão nova — é o achado **G31** ficando mais caro, e reforça
a bancada da divisão por `erosao` (75,8% na mesma peça), que segue esperando o olho do
Doug.

577 testes · verify:arte=0 · typecheck=0

### 2026-08-20 (2) · "ainda tem cor vazando embaixo" — e desta vez é a ARTE

O passo 3b consertou um defeito real (o miolo encostando na borda, 1 094 px → 0), mas
o Doug olhou de novo e o defeito continuava, **embaixo**. Ele apontou "embaixo" duas
vezes; quatro réguas minhas responderam com estatística da peça inteira e disseram que
embaixo era igual ao resto. **Quem estava medindo o alvo errado era eu, e são quatro
erros no mesmo dia, todos da mesma família.** Ficam registrados porque o padrão importa
mais que cada um:

| régua | o que ela dizia | por que estava errada |
|---|---|---|
| miolo fora da silhueta | 0 px | as duas curvas nunca se cruzam; o defeito não é esse |
| banda por lado (cima/baixo/esq/dir) | embaixo 66% fino, cima 76% | p50 da peça inteira **esconde** trecho contínuo ruim |
| perfil da borda de baixo, 1ª versão | 59,9% das colunas com ZERO preto | contava a MOLDURA do recorte como borda |
| perfil da borda de baixo, 2ª versão | idem | parava no pixel de **antialias** da ponta e devolvia zero sobre colunas com 11 px de `#000000` |

O que destravou foi **imprimir os pixels crus** de quatro colunas
(`.scratch/estilo/dump-colunas.ts`) em vez de escrever uma quinta estatística.

**O ACHADO, medido nas duas pontas.** A banda preta abaixo do último pixel de cor:

| peça | na máscara da ARTE (p50) | colunas SEM preto no RENDER |
|---|---|---|
| `cheia` | **1 px** | 24,7% |
| `cheia-com-bigode` | **1 px** | 43,1% |
| `bigode-ferradura` | 6 px | 25,8% |
| **`rala`** | **12 px** | **0%** |

Referência: o contorno do boneco mede 12 u = **14,4 px** do canvas, e no render de
800 px ele mede 23,2 px contra os 0–4 px da barba. **A `rala` é a única que o gerador
fechou por baixo, e é a única que não vaza.** A correlação é a prova de que o defeito é
de arte, não de esteira.

**Não tem conserto de programa, e isso é decisão de rota, não preguiça:** transcrever
preto que não existe é desenhar, e o G20 separa restaurar de desenhar. Engrossar por
dentro foi medido e o Doug reprovou a olho — a bancada
(`.scratch/estilo/banda-do-contorno.ts`, K = 1/3/5/8) mostra que K ≥ 3 colapsa a
textura da `cheia` de 6 ilhas de miolo para 1, que é a mesma perda que ele reprovou em
2026-08-19. Parecer dele: *"nenhuma ficou bom. K1 quase boa"*.

**A SAÍDA:** retoque cirúrgico no gerador, com a peça pronta como única imagem de
entrada — o texto está no `PEDIDO-BARBAS.md`, seção "Retoque cirúrgico". Mais uma
cláusula nova de FORMA no pedido geral: a que existia (*"contorno da mesma espessura
das outras linhas"*) mora na lista de CORES, e o gerador a lê como instrução de cor.

**Fica de pé o passo 3b**, que é defeito independente e já gateado.

### 2026-08-21 · O TOM CONTÍNUO POR MÁSCARA — a esteira do rosto troca de espinha

Registro de execução do **Bloco 5** do plano homônimo, escrito **depois** dos gates:
`typecheck` 0 · `npm test` 602 · `verify:all` **exit 0** · `avatar:pose` 0 ·
`npm run build` 0.

#### O que mudou, e por quê

O Doug perguntou por que a esteira só entregava duas cores. A investigação de
2026-08-20 mostrou que a leitura corrente estava errada: **a D17 proíbe cor assada,
não tom.** Quem produzia duas cores era o `potrace` — ele traça CONTORNO, e contorno
é binário. Toda a partição contorno × miolo existia para dar duas cores a uma arte
de muitas.

O padrão novo, aprovado a olho em `.scratch/estilo/bancada-tom-continuo.png`:
**o vetor carrega só o que precisa ser vetor, e o raster carrega o tom.**

```
<path d=silhueta fill="var(--av-linha)"/>            ← o preto, por baixo
<path d=silhueta fill="var(--av-cabelo)" mask=…/>    ← a cor, com a luz da arte
```

#### Os números, medidos pela esteira de produção

| | `barba-cheia` | `trancada-v4` |
|---|---|---|
| peça | 38.505 px, 1 componente | 54.264 px, 1 componente |
| formas | **2, com o mesmo `d`** | **2, mesmo `d`** |
| esticão p2/p98 | lum 1 → 159 | lum **0 → 140** |
| máscara (50%) | 218×113 · 8,8 KB b64 | 213×184 · **21,5 KB b64** |
| cortado nas feições | 0 px | 0 px |

A `trancada-v4` reproduz número a número a bancada que o Doug aprovou (0/140 ·
21,5 KB) — o porte da régua para a produção é fiel.

**O selo da `rosto-barba-cheia` virou dois:** `d` **11.372 → 10.624 B** (o `d` caiu
6,6% porque o miolo deixou de ser traçado) e **8.960 B de base64**, que é o preço do
tom e está pago com os olhos abertos.

#### O G31 se dissolve por construção

O achado era a `cavanhaque` saindo **preta chapada** — 7,6% de miolo pela partição
por luminância. A saída aberta na época (`divisao: "erosao"`) foi apagada junto com a
partição, e não fez falta: o esticão por **percentil da própria arte** normaliza o
contraste peça a peça. Medido com a esteira nova:

| peça | esticão | tons distintos na máscara |
|---|---|---|
| `barba-cheia` | 1 → 159 | 254 |
| `trancada-v4` | 0 → 140 | 256 |
| `barba-bigode` | 4 → 155 | 228 |
| **`barba-cavanhaque`** | **0 → 146** | **180** |

Contra os **2** da esteira anterior.

#### O braço do TRAJE — arte nova em raster

Mesma descoberta, outro corredor: peça de cor assada não é pintada pelo compositor,
então não há o que ser vetor. `construirPeca(…, "raster")` embrulha o recorte num
`<image>` WEBP q82 dentro do mesmo `.svg`, com o mesmo `viewBox`.

| peça | vetor (cru / gzip / formas) | raster (cru / gzip / formas) |
|---|---|---|
| `traje-farda` | 152,0 KB / 42,8 KB / 473 | 21,9 KB / 16,0 KB / 0 |
| `traje-gambesao` | 228,2 KB / 60,6 KB / 530 | 20,0 KB / 14,6 KB / 0 |

**As duas continuam CONGELADAS no vetor** (`CONGELADAS_NO_VETOR`, `traje.ts`) — foi a
opção 3, escolhida pelo Doug. A tabela é o que elas custariam, medido em pasta
temporária. A trava é mecânica porque `arte:trajes --check` reescreve os `.svg` mesmo
em `--check`; conferido: `git status` de `public/items/traje/` **limpo** depois do
gate, e `arte:peso` nos mesmos 8.119 / 62.060 B.

#### O que morreu, e por que apagar em vez de guardar

- o passo 3 (partição contorno × miolo) e o `divisao: "erosao"`;
- o passo 3b (a franja da borda) — com tom contínuo não há corte, e aquele anel é só
  um cinza intermediário, que é o que sempre foi;
- o segundo `tracar` do núcleo;
- `franja-da-borda.test.ts`. **Um gate de um caminho que deixou de existir passa por
  vacuidade e mente sobre o que protege** — por isso foi apagado, não desativado.

#### Uma régua minha que reprovou desenho correto

A asserção "a caixa da máscara cobre a peça" reprovou medindo os números crus do `d`:
o ponto mais alto era **y 241,1** contra uma caixa começando em 244,2. Era **ponto de
controle de Bézier**, que não desenha — a curva achatada para em **243,8**, 0,40 u
fora da caixa (0,48 px do canvas; 0,04 px no boneco de 56). A régua foi refeita
achatando a curva, com folga de 1 px do canvas (`1 / ESCALA` ≈ 0,83 u). É a mesma
família dos quatro erros de 2026-08-20 registrados acima: **medir o alvo errado.**

#### As pendências, escritas em vez de esquecidas

1. **Safari/iOS não foi medido.** `<mask>` + `<image href="data:…">` é suportado
   desde Safari 12 pela documentação, mas este projeto mediu **só no Chromium**. Não
   é bloqueio conhecido; é ignorância declarada.
2. **A resolução é por SLOT, e só a barba tem número.** Os 50% saem da escada
   1.038 → 917 → 916 tons medida na `trancada-v4`. O traje já fala em supersample 2×
   (`traje.ts:99`) e `uniforme.ts` tem variantes até DPR 3 — cada slot precisa do seu.
3. **O percentil por arte NORMALIZA contraste, e isso é decisão de produto.** Uma
   arte desenhada escura passa a ler como uma clara. Conserta a `cavanhaque` e é o
   que o olho do Doug precisa julgar na folha — medir quanto tom a peça tem é fácil;
   decidir se ficou boa não é.
4. **Base64 não comprime, e o catálogo vai para o bundle do cliente.**
   `AvatarKokeshi.tsx` importa `catalogo`, e cada barba com tom são ~9 a ~21 KB que
   nenhuma compressão devolve. A mitigação (catálogo preguiçoso, ou máscara em
   arquivo externo) está **fora do escopo por decisão** — só entra se o número da
   folha pedir, e a decisão é do Doug. O registro está em `CUSTO_DE_SOBREPOSTA`
   (`cabelo.ts`), que subiu de 4.500 para 30.000 B com a ressalva escrita ao lado.

### 2026-08-21 (2) · O ACHADO DO BLOCO G — o gzip do ranking cai de um penhasco

**Medido na folha do Bloco G, e é achado estrutural, não afinação.** Ele não estava
previsto no plano e contradiz a premissa de peso que este projeto usa desde o Bloco 4
(*"SVG é texto, e a razão de compressão MELHORA com as camadas: 6,6× → 8,6×"*).

#### O número

Trinta bonecos com a mesma barba — a lista do ranking, `escala: 0,92`, cabelo `chanel`:

| peça | boneco composto | cru | **gzip** | brotli |
|---|---|---|---|---|
| `barba-cheia` · novo | 31.857 B | 933,9 KB | **24,9 KB** | 13,7 KB |
| `trancada-v4` · novo | 49.101 B | 1.439,1 KB | **753,0 KB** | 24,1 KB |

**30× de diferença no gzip entre duas peças da mesma família.** O brotli não sente.

#### A causa, provada por controle

O DEFLATE casa repetição dentro de uma **janela deslizante de 32.768 bytes**. Se o
boneco inteiro cabe nela, a cópia seguinte encontra o blob base64 anterior e ele vira
uma referência de poucos bytes. Se não cabe, **cada cópia paga o blob inteiro**.

A curva por N mostra o penhasco sem ambiguidade (`.scratch/estilo/janela-do-gzip.ts`):

| peça | N=1 | N=2 | N=5 | N=30 | gzip **por cópia** |
|---|---|---|---|---|---|
| `barba-cheia` (31.857 B) | 14,6 K | 15,1 K | 16,4 K | 24,9 K | 14,6 → **0,8 K** |
| `trancada-v4` (49.101 B) | 25,4 K | 50,0 K | 125,3 K | 753,0 K | 25,4 → **25,1 K** |

E o controle direto — o mesmo blob 30×, variando só o espaço entre as cópias:

| espaço entre cópias | gzip |
|---|---|
| 0 B | 21,4 KB |
| 10.000 B | 22,0 KB |
| **20.000 B** | **489,1 KB** |
| 32.000 B | 490,5 KB |
| 60.000 B | 493,9 KB |

O blob da `trancada` mede 22.032 B; com 20.000 B de espaço, blob + espaço passa de
32.768 e a dedução morre. **É a janela, e nada mais.**

#### O que isto significa na prática

- **A `barba-cheia` está do lado bom por 911 bytes.** 31.857 contra 32.768. Não há
  margem nenhuma: qualquer peça um pouco maior, ou um chapéu somado à barba, cruza.
- **O brotli salva** (24,1 KB nos dois casos), e a Vercel serve brotli para navegador
  moderno. O gzip é o caminho de fallback — não é hipótese remota, é o que roda em
  cliente velho e em alguns proxies.
- **É custo de bundle também**, e ali não há compressão que resolva:
  `AvatarKokeshi.tsx` importa `catalogo`, e o catálogo viaja inteiro.
  `barba-cheia` **13.674 → 19.584 B** (Δ +5.910); `trancada-v4` **19.677 → 36.832 B**
  (Δ +17.155).

#### O que NÃO foi feito, e por quê

A mitigação — catálogo preguiçoso, ou máscara em arquivo externo em vez de inline —
está **fora do escopo por decisão do plano**, que a reservou para "só se o número do
Bloco G pedir, e é decisão sua". **O número pede.** A decisão é do Doug, e é ela que
decide também se a `trancada-v4` (blob de 22 KB) deve ser promovida como está.

#### O ganho, do outro lado da balança — tons medidos NO RENDER

| peça | hoje | novo |
|---|---|---|
| `barba-cheia` | 971 | **1.405** |
| `trancada-v4` | 1.084 | **1.842** |

(recorte da cabeça a 420 px, cabelo castanho, `chanel` por cima)

### 2026-08-21 (3) · A BANCADA DO PENHASCO — as saídas medidas, nenhuma escolhida

Pedido do Doug: *"medir as duas saídas primeiro; você decide com número na mão"*.
Régua: `.scratch/estilo/bancada-do-penhasco.ts`. Nada foi implementado — cada saída é
simulada sobre o SVG que o compositor já emite, para os números ficarem comparáveis
contra a mesma linha de base.

**Uma terceira entrou na medição** (`C`), porque é nativa deste código: `folhaExterna`
já iça o `<style>` único para N avatares, e a máscara subiria pelo mesmo caminho.

#### `barba-cheia` — boneco 31.857 B, **cabe na janela com 911 B de folga**

máscara: 6.718 B de PNG · 8.960 B em base64

| cenário (30 bonecos) | cru | gzip | brotli | bundle |
|---|---|---|---|---|
| linha de base — SEM tom | 663,8 K | 14,9 K | 6,8 K | 0 B |
| novo, inline (o do branch) | 933,9 K | 24,9 K | 13,7 K | 8.960 B |
| **A** · máscara em arquivo externo | 671,9 K | **15,4 K** | 7,1 K | **38 B** |
| **B** · catálogo preguiçoso | 933,9 K | 24,9 K | 13,7 K | 0 B |
| **C** · máscara içada para a folha | 673,9 K | 22,7 K | 13,5 K | 8.960 B |

#### `trancada-v4` — boneco 49.101 B, **16.333 B ALÉM da janela**

máscara: 16.524 B de PNG · 22.032 B em base64

| cenário (30 bonecos) | cru | gzip | brotli | bundle |
|---|---|---|---|---|
| linha de base — SEM tom | 786,1 K | 17,2 K | 7,5 K | 0 B |
| novo, inline (o do branch) | 1.439,1 K | **753,0 K** | 24,1 K | 22.032 B |
| **A** · máscara em arquivo externo | 794,1 K | **17,6 K** | 7,8 K | **38 B** |
| **B** · catálogo preguiçoso | 1.439,1 K | 753,0 K | 24,1 K | 0 B |
| **C** · máscara içada para a folha | 809,0 K | 34,8 K | 24,0 K | 22.032 B |

#### A leitura

- **A apaga o penhasco**, não o suaviza: 17,6 K contra 17,2 K da linha de base sem
  tom nenhum. O tom passa a custar **0,4 KB no fio** em vez de 736 KB. E tira 21.994 B
  do bundle. Preço: **+1 requisição por peça** (cacheada; os 30 bonecos da lista
  apontam para a MESMA url) e o avatar renderizando em dois tempos — silhueta
  primeiro, tom quando o PNG chega. O arquivo passa a valer para
  `arteDaPecaNoDeploy`: em `public/`, commitado, ou a peça some em produção.
- **C tira 95,4% do gzip sem requisição nova e sem mexer no catálogo**, mas para em
  34,8 K — o dobro de A —, porque o blob continua aparecendo uma vez e base64 não
  comprime. E **só vale onde há LISTA**: num avatar sozinho o blob sai igual.
- **B não toca no penhasco.** 753,0 K com ou sem ela. Ela adia bytes de bundle, e
  isso é real — mas o problema medido no Bloco G é de fio, e ela não o alcança.
  Registrar isso é metade do motivo de tê-la medido.
- **A e B não se somam:** A tira o blob do catálogo de vez (38 B), então não sobra
  nada para B adiar.

**A escolha é do Doug.** Nada aqui foi implementado.

### 2026-08-21 (4) · A DECISÃO — saída A, e o penhasco fechou

O Doug aprovou a folha (*"ficou melhor"*) e delegou a escolha entre as saídas. **A
escolhida foi a A: a máscara vira arquivo servido à parte**, `public/items/rosto/
<slug>-tom.png`, com o catálogo guardando o caminho em vez dos bytes.

#### O que desempatou não foi o peso

Foi o **precedente**. A saída A não inventa mecanismo: é o que o TRAJE já faz desde
2026-08-17. `Traje.tinta.arte` é um caminho (`/items/traje/traje-farda.svg`), colado
pelo mesmo `<image>`, com o mesmo gate de deploy e a mesma renderização em dois
tempos. A barba passou a usar o corredor que já existia.

A saída C (içar o `<defs>` para a folha) exigiria **quebrar a unicidade de id** que
`${ns}-tom-${slot}` acabara de estabelecer e que três arquivos de teste guardam — e
compraria menos: 34,8 K contra 17,6 K, sem tocar no bundle, e sem valer para o aluno
sozinho. A saída B não alcançava o problema medido.

#### O resultado, no código de produção (não na bancada)

|  | antes (base64 embutido) | **depois (saída A)** |
|---|---|---|
| boneco composto | 31.857 B | **22.913 B** |
| folga dentro da janela de 32.768 B | **911 B** | **9.855 B** |
| 30 bonecos, gzip | 24,9 KB | **15,4 KB** |
| 30 bonecos, brotli | 13,7 KB | **7,1 KB** |
| a máscara, no SVG | 8.960 B de base64 | **38 B de caminho** |
| a máscara, no bundle | 8.960 B | **38 B** |
| a máscara, no fio | por boneco | **6.718 B uma vez, cacheados** |

O chão — os mesmos 30 bonecos SEM a peça — mede 9,9 KB de gzip. O tom inteiro custa
hoje 5,5 KB no fio para uma lista de 30, mais um PNG cacheado.

**A folga de 911 → 9.855 bytes é o número que mais importa.** Com 911 B, somar um
chapéu à barba cruzaria a janela e o gzip explodiria sem aviso. Com 9.855, não.

#### O que a troca arrastou junto

- `TomDaPeca.png: string` (base64) → **`TomDaPeca.arte: string`** (caminho);
- `construirRosto` devolve os **bytes** do PNG e **não grava nada** — quem grava é
  `rostos.ts`. Ela é chamada pelas réguas de bancada sobre arte que nunca vai ao
  catálogo; se gravasse, medir sujaria o deploy;
- **`arte:rostos --check` deixou de escrever.** Ele compara o PNG do disco byte a
  byte com o que a esteira produz e reprova se divergir. É conserto sobre
  `arte:trajes --check`, que **reescreve** os `.svg` mesmo em `--check` — e foi por
  causa daquilo que a trava das peças congeladas precisou ser mecânica;
- `arteDaPecaNoDeploy.test.ts` passou a cobrir as **duas famílias** de endereço, com
  contagem por extensão para nenhuma delas poder zerar em silêncio;
- **`arte:peso` passou a medir `.png`**, não só `.svg`.

#### O achado de graça: 68 KB de lastro invisível

Estender o `arte:peso` para `.png` revelou **dois arquivos que ninguém media**:

| arquivo | gzip | referências em `src/`, `scripts/`, `e2e/` |
|---|---|---|
| `public/items/base/avatar-base-female.png` | 35,2 KB | **zero** |
| `public/items/base/avatar-base-male.png` | 32,8 KB | **zero** |

Estão lá desde `715a44e` ("sistema de avatar com dual-gender"), somam **68 KB no
deploy**, e ficaram invisíveis porque o gate filtrava por extensão — **o modo de
falha que o docstring do próprio gate nomeia, acontecido dentro dele**. São a mesma
família dos dois `.svg` órfãos já registrados no G24. Entraram no baseline (ficam
visíveis a cada rodada) e **apagá-los é decisão do Doug**.

#### Gates

`verify:all` **exit 0** · `typecheck` 0 · **605 testes** (36 arquivos) · `lint` 0 ·
`arte:rostos --check` 0 · `arte:peso` 0.

#### E a peça ficou MAIS LEVE dentro do SVG do que antes de tudo isto

O resultado que não estava previsto: o tom foi ganho **e** o SVG encolheu.

| peça | antes do tom (`d` de 2 formas) | depois (saída A) | Δ |
|---|---|---|---|
| `barba-cheia` | 13.674 B | **10.662 B** (10.624 de `d` + 38 de caminho) | **−3.012 B** |
| `trancada-v4` | 19.677 B | **14.838 B** (14.800 de `d` + 38 de caminho) | **−4.839 B** |

A causa é o segundo traçado ter morrido: as duas formas passaram a ser a MESMA curva,
e a máscara custa um caminho. O PNG saiu do SVG e do bundle, e entrou no orçamento de
`arte:peso`, que passou a medir a prateleira inteira.
