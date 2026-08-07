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
| 9 | **Papel `luz` sem correspondente no render de 2 tons; `tresTons` sempre parte em três.** O Bloco 10 subiu o preço disto: no chanel novo a mancha de brilho (20–25% da cúpula) virou **um filete junto da franja** — outro lugar, outra forma — e a peça a 100% lê como capacete. **Nenhuma das 21 asserções toca nisso**, e o mesmo filete aparece no controle 3, logo é padrão do conversor. É a régua que falta | eu |
| 10 | **O chanel novo foi MEDIDO e NÃO aprovado** (Bloco 10). Todo gate verde, o olho reprovou por assimetria, corte sobre a roupa e contorno furado. Recomendação registrada: **regerar a arte** antes da régua da luz e antes do guia | Doug |
| 11 | **`pecas-da-arte.ts` tem 4 peças, e a decisão 2 mandou apagar duas.** `entrada-2` e `entrada-3` continuam lá ao lado do `chanel`. Apagar exige conferir antes se alguma sustenta controle — a `entrada-3` é hoje a isca do controle 3 de `arte:revisao` | Doug |
