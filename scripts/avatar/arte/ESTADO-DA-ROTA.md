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
| `silhueta` | PASSA | `CABELOS.curto` sem extensão: o preto CRUZA a normal | aro **6,8%** em −10 u |
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
   **centradas** na fronteira e vai por cima de tudo. `CABELOS.curto`, que cobre a
   coroa inteira, devolvia **`cobertos = 0`** e com isso `aro = 0/0 = 0`. A régua
   dizia "não há aro" **por vacuidade**, e teria dito o mesmo de qualquer peça.
   Conserto: coberto = a peça pinta **logo por dentro** da fronteira, de meio traço
   para dentro até o alcance. `curto` passou de 0 para **1 095 de 2 262** pontos.
2. **`silhueta.ts` classificava FUNDO como pele exposta.** Fora do crânio, onde a
   peça não chega, o render com peça é idêntico ao careca — os dois mostram fundo,
   que tem luminância alta. `CABELOS.curto` acusava **100,0% de pele exposta** numa
   touca que não deixa um milímetro de testa à mostra. Conserto: pele só existe
   **dentro da máscara do crânio**, que a sonda já carregava. 100,0% → **4,7%**.
3. **A janela do `aro` começava EM CIMA da borda interna do traço.** Ela ia até
   −6 u, e −6 é exatamente onde o contorno de 12 u centradas acaba. `CABELOS.curto`,
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

`CABELOS.curto` **não é só um cabelo do catálogo — é o controle aprovado de que a
rota inteira depende.** Ele aparece como referência em:

- `reguas-conferidas.ts` — `sondar(CABELOS.curto)` e `medirCoroa(CABELOS.curto)`
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
| 9 | **Papel `luz` sem correspondente no render de 2 tons; `tresTons` sempre parte em três.** O Bloco 10 subiu o preço disto e **o Bloco 11 subiu de novo**: na rodada 1 a mancha de brilho (20–25% da cúpula) virava um filete de 3–5 px; na rodada 2 ela é **7,9% da peça e 12,4% da cúpula, e o render devolve 6 pixels**. A paleta do render tem exatamente **dois** tons de ciano — não existe terceiro. **Nenhuma das 21 asserções toca nisso.** É a régua que falta | eu |
| ~~10~~ | ~~**O chanel novo foi MEDIDO e NÃO aprovado** (Bloco 10)~~ — **a rodada 2 rodou (Bloco 11).** Cinco dos seis defeitos de desenho caíram; o sexto (cabelo sobre a roupa) não se moveu, e o Doug decidiu que **ele fica** — ver item 12. Sobram três defeitos NOVOS de rota (slivers de fundo, rebordo de sombra, traço interno descartado) e a franja alta | parcial |
| ~~12~~ | ~~**A MECHA SOBRE O TRONCO FICA**~~ — **feito no Bloco 12.** O tronco saiu da extração; descartado 4 776 → **21 px**, borda amputada 7,2% → **0,0%**, perímetro de preto 95,2% → **100,0%**. As pontas voltaram inteiras e o entalhe caiu de 42 px para 7–8 | fechado |
| ~~14~~ | ~~**O ESPETADO FOI APROVADO CONTRA UMA PEÇA QUE NÃO EXISTE MAIS**~~ — **decidido: CONGELAR** (decisão C acima). O espetado não passa pelo caminho novo e a aprovação do Bloco 9 vale para o literal de hoje (3 806 bytes, com a mecha recuperada). O preço é duas famílias de peça traçada convivendo | fechado |
| 15 | **A TINTA NÃO É TRANSCRITA — e são três defeitos que viraram um.** A forma vai bem (IoU 89,4%, contorno 100%); a tinta não vai. **Luz:** arte 6,17% em 3 manchas, render **55 px de serrilha**. **Sombra:** a arte tem 3 massas medidas, o render devolve sombreamento **sistêmico** do compositor abraçando o traço — não é a sombra da arte. **Traço interno:** descartado por construção — `Cabelo.linhas` são arcos DO LAÇO DA MASSA, e traço que corre por dentro da peça não tem onde morar no tipo. **PLANO ESCRITO** — ver o bloco no topo desta seção. **Duas correções ao que eu havia dito:** o anel **não** custa o dobro dos pontos (a borda externa já é o laço da massa, e o stroke de hoje já re-emite o laço inteiro — fica ~neutro, equilíbrio em N′ ≈ 30 a ~34 bytes por comando `C`); e o furo **não some, muda de lado** — passa a ser do ciano, e ali é barato. **FEITO no Bloco 13, Passos 1–6:** o traço interno voltou (866 px em 4 formas, contra 0 px da ordem invertida), o preto passou de IoU 34,4% / 1,21× para **68,8% / 0,81×** (fiel) ou **66,1% / 0,98×** (lei). **A luz (Passo 8) NÃO entrou** — fica depois da parada, e o item 9 continua aberto | parcial |
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
