# Os gates da rota de arte

Cada linha responde a uma pergunta diferente. Nenhum deles substitui o olho do
Doug, e a tabela diz explicitamente o que cada um **não** pega — gate que se
apresenta como completo é pior que gate ausente.

| gate | pergunta | comando | o que ele NÃO pega |
|---|---|---|---|
| **Gate −1** | o boneco se mexeu? | `arte:gate` | se a peça é bonita, ou se a arte serve |
| **a causa** | de que **cor** é a reprovação? | `arte:causa` | nada — ele é diagnóstico, não veto. Sai no laudo **sempre**, aprovada ou reprovada |
| **cor proibida** | alguma cor da base cai na janela do ciano? | `arte:cor-proibida` | cor que o Gemini invente na arte |
| **as 15 asserções** | as réguas separam o que dizem separar? | `arte:reguas` | régua que ninguém escreveu — a `luz` é o buraco declarado |
| **escala** | o hash da base bate com o manifesto? | `arte:escala` | alguém apagar o `escala: 1` de outro medidor |
| **fixtures A–F** | os seis vereditos exatos continuam? | `arte:fixtures` | modo de falha que nenhuma fixture encena |
| **`--check`** | `pecas-da-arte.ts` ainda é o que o `converter()` produz? | `arte:pecas -- --check` | literal certo gerado de arte errada |
| **os 6 controles** | a régua está medindo a coisa certa? | `arte:revisao` | a peça — ele julga a **régua** |
| **os selos** | o render das peças congeladas mudou? | `npm test` | peça que ainda não tem selo |
| **56 px** | o penteado continua reconhecível? | `arte:folha` | **nada substitui o olho do Doug** |

`verify:arte` encadeia cinco deles — fixtures → réguas → cor proibida → escala →
`--check` — e está em `verify:all`. Nenhum exige render.

## Reprovação e achado são coisas diferentes

**Reprovação** é o que a rota controla: o Gate −1, os controles, o `--check`, os
selos. Sai 1, e a correção mora neste pipeline.

**Achado** é o que só a arte ou o Doug resolvem: a franja alta, a mecha sobre o
tronco, o giro que lê como cabeça torta. Reprovar por eles faria o gate exigir do
importador uma decisão que não é dele — e um gate que ninguém consegue deixar
verde é um gate que se aprende a ignorar. Achado vai para `docs/achados.md` e/ou
para a lista aberta do `ESTADO-DA-ROTA.md`, **e para ali**.

## As seis fixtures do Gate −1, e o que cada uma prova

`arte:fixtures` gera e `arte:gate` julga. Cada uma viola **uma** coisa: fixture que
reprova por dois motivos não prova nada sobre nenhum dos dois.

| A dimensões | B deslocamento | C escala | D recorte | E antialias | F corpo |
|---|---|---|---|---|---|
| REPROVA | REPROVA | REPROVA | REPROVA | **APROVA** | REPROVA |

**A `E` é a que importa mais**, porque ela é a que aprova: toda borda vetorial
rasterizada tem ~1 px de antialiasing, e um gate que reprova por isso reprova toda
arte legítima. E a **`F`** é a isca do buraco que já foi aberto e fechado no mesmo
bloco: um quadrado **preto** de 14 u colado no tronco, sem um pixel de ciano. A
primeira `mascaraDaPeca` tinha uma exceção — preto novo virava peça mesmo sem
encostar em ciano — e com ela a `F` passava. A regra ficou sem cláusula. Custo nas
artes reais: **zero**, porque nelas o preto sempre encosta no ciano.

## Os 6 controles de `arte:revisao` — eles julgam a RÉGUA, não a peça

| # | controle | teto | o que ele pega |
|---|---|---|---|
| 1 | identidade — dois renders da mesma coisa | IoU > 99,9% | a régua é determinística? |
| 2 | careca — sem peça nenhuma | IoU < 0,5% | denominador vazio disfarçado de acerto |
| 3 | peça trocada no lugar desta | < a certa − 5 pp | a régua distingue peças? |
| 4 | `naTela` bate no raster | ≤ 2 u | o registro entre as escalas é confiável |
| 5 | denominadores > 0 | — | **aprovação por vacuidade** |
| 6 | o literal colado é o que o conversor produz | ponto a ponto | `pecas-da-arte.ts` defasado |

Se um falhar, **os números da peça abaixo não valem** — a régua está medindo outra
coisa. Conserte a régua antes de olhar a peça.

O 6 **recusa desenhar a folha**. Ele é dispensado, com o motivo impresso, quando se
roda `--variante` forçada: ali a folha é bancada de arte e a peça medida não é a
colada, então comparar as duas acusaria divergência correta e inútil.

## O modo de falha desta rota, e ele é sempre o mesmo

**Régua que devolve o mesmo número para coisas diferentes.** Cinco ocorrências
registradas no `ESTADO-DA-ROTA.md`, e o número errado ficou preservado ao lado do
certo em todas:

| régua | o erro | o número errado × o certo |
|---|---|---|
| `coroa.ts` | limiar de luminância calibrado na **arte**, aplicado no **render** | 89,0 u × 89,0 u (diferença **0,0**) × 12,0 u pelo método por cor |
| `silhueta.ts` | `cobertos = 0` → `aro = 0/0` | "não há aro", **por vacuidade**, de qualquer peça |
| `silhueta.ts` | fundo classificado como pele exposta | **100,0%** numa touca × 4,7% |
| `escala.ts` | o caso "100%" **omitia** o campo depois que o padrão virou 92% | os dois lados iguais |
| a barra | perfil agregado, que só é concêntrico na careca | disse que A era **3× pior**; a leitura visual disse o contrário |

**A defesa:** toda régua nova entra com controle negativo, e o controle negativo
tem de **nascer vermelho**. `arte:reguas` são 15 asserções nesse formato (PASSA /
REPROVA / SEPARA por régua); `nucleo-cabelo.test.ts` (14) e `refino-spline.test.ts`
são as do Bloco 13–14.

## O que NENHUM gate pega, e é declarado

**Beleza.** A franja torta do chanel atravessou três blocos com tudo verde — ela
estava **escondida sob o stroke** de 12 u da família sintetizada, e só apareceu
quando o preto passou a ser transcrito.

**O papel `luz`.** A arte tem três tons de ciano; a paleta do render tem
exatamente **dois**. Uma mancha de brilho de 7,9% da peça / 12,4% da cúpula devolve
**6 pixels**. Nenhuma das 21 asserções toca nisso. É a régua que falta, e a luz é o
Passo 8 — decidido para entrar por último (decisão B).

**Barra enterrada.** Não chega a zero (14,1 / 8,8 / 6,1%). O resíduo é contorno de
mecha cruzando a fronteira do crânio, não o traço do crânio, e a régua não os
separa.

## Por que não há hash em markdown

O risco real é o literal divergir da arte em silêncio — e quem fecha isso é o
`--check` no CI, não um hash escrito num doc.

**Não se grava hash em markdown.** Este repositório já pagou esse erro: o
`docs/ESTADO.md` existe porque números escritos à mão em 13 documentos discordavam
entre si, e o `CLAUDE.md` proíbe — *"ou o painel já mede, ou é caso de ensinar
`scripts/estado.ts` a medir"*.
