---
name: avatar-importar-arte
description: Importa uma arte do avatar (CABELO, TRAJE ou ROSTO/barba) para o catálogo pela rota de arte — o Doug edita a peça sobre um render do próprio compositor, o Gate −1 prova que o boneco não se mexeu, e a peça sai medida em vez de adivinhada. Use quando já existe arte editada sobre a base oficial e ela precisa virar peça de código; quando uma arte retocada volta para reentrada; quando um traçado saiu com menos massa que a arte; quando algo da referência "sumiu" da peça sem nenhum gate reprovar; quando um LOTE de artes reprova em peso no Gate −1 com "a FORMA mudou"; ou quando o pedido for "importa esse cabelo", "importa esse traje", "importa essa barba", "cola essa peça no catálogo", "por que a mecha não apareceu?". Cobre as TRÊS esteiras: cabelo (contorno → converter → pecas), traje (arte:traje → arte:trajes → arte:folha-traje) e rosto/barba (restaurar-peca → gate → arte:rostos), que dividem o Gate −1 — mas a do rosto INVERTE a ordem dos dois primeiros passos, e rodar a ordem das outras nela reprova arte boa em lote. Não é para inventar forma nova (isso é avatar-desenho) nem para medir número solto de referência (isso é avatar-regua).
version: 3.2.0
argument-hint: "[nome da arte, sem extensão]"
---

# Importar arte para o catálogo — a rota de arte

*Reescrita em 2026-08-07. A versão 1.0 desta skill ensinava a **rota semântica**
(SVG anotado path a path, `avatar:semantizar` → `avatar:importar`), que foi
substituída pela rota de `scripts/avatar/arte/`. O que sobrou dela está na §6, como
legado.*

## O runbook é a fonte de verdade

**[docs/avatar/19-rota-de-arte-runbook.md](../../../docs/avatar/19-rota-de-arte-runbook.md)**
— a esteira comando a comando, o significado de cada reprovação, as duas famílias
de peça, a promoção e a reentrada. **Leia antes de rodar qualquer coisa.**

O registro de execução — cada número medido, contra que teto — fica em
[`scripts/avatar/arte/ESTADO-DA-ROTA.md`](../../../scripts/avatar/arte/ESTADO-DA-ROTA.md).
Ele é longo (2 000+ linhas) e **não é para ler inteiro**: vá pela lista de blocos
ou por `grep`.

## A regra que decide se é esta skill

| situação | skill |
|---|---|
| inventar forma nova, variantes, refazer peça que lê errado | `avatar-desenho` |
| medir um número de referência para `geometria.ts` | `avatar-regua` |
| **arte editada sobre a base oficial precisa virar peça** | **esta** |
| **arte retocada volta para reentrada** | **esta** (§8 do runbook) |

## Primeira pergunta: é CABELO, é TRAJE ou é ROSTO?

São **três** esteiras. Errar de corredor faz o programa reclamar de um jeito que
não aponta a causa — e no rosto ele reprova **arte boa em lote**.

| | **cabelo** | **traje** | **rosto (barba, bigode)** |
|---|---|---|---|
| o arquivo | `entrada.png`, `chanel.png`, … | **`traje-<nome>.png`** | **`rosto-*.png`**, `barba-*`, `cavanhaque-*`, `bigode-*` |
| a peça vira | geometria `{t,y}` | **`.svg` com um `<image>` WEBP** (arte nova; as duas antigas ficam no vetor) | **`formas[]` com token de cor + máscara de tom** (recolore com o cabelo, D17) |
| a base | `arte:base` | `arte:base-tronco` | **`arte:base-barba`** |
| **a ordem** | gate → extração | gate → extração | ⛔ **limpeza → gate** — invertida |
| os comandos do meio | `arte:contorno` → `arte:converter` → `arte:espessura` → `arte:pecas` | **`arte:traje` → `arte:trajes`** | **`restaurar-peca.ts` → `arte:gate` → `arte:traco` → `arte:rostos`** |
| a folha | `arte:folha` | **`arte:folha-traje`** | **`.scratch/estilo/folha-elenco.ts`** |
| onde está escrito | este arquivo, abaixo | **[`references/esteira-traje.md`](references/esteira-traje.md)** | **§13 do runbook** |

**Se o nome começa com `traje-`**, vá para
[`references/esteira-traje.md`](references/esteira-traje.md) e siga por lá.

**⛔ Se a peça é do slot `rosto` — barba, bigode, cavanhaque —, vá para a §13 do
runbook e siga por lá. NÃO siga este arquivo.** A rota do rosto **inverte os dois
primeiros passos**: `restaurar-peca.ts` roda **antes** do Gate −1, porque o gate
reconhece a peça pelo ciano instrumental e a barba volta do gerador no matiz que
ele quis. Rodar o Gate −1 na arte crua **reprova todas as artes, inclusive as
boas**, com a mensagem *"a FORMA mudou"* — que é a mensagem de gerador que
redesenhou o boneco, sobre uma arte em que o boneco está intacto. Medido na `rala`
em 2026-08-20: crua **14,7% não explicado, 27 ladrilhos, REPROVADA**; depois da
limpeza, **0 px, 0 ladrilhos, aprovada**. **Esta ordem já foi errada uma vez — se
um lote reprovar em peso, a primeira pergunta é a ordem, não o gerador.**

### ⚠️ O RASTER CARREGA O TOM — mudou em 2026-08-20, e mexe nos dois corredores

Se você leu este arquivo antes desta data, a coisa mais importante mudou. Traçar
arte raster em vetor **para imitar de volta o tom que o raster já tinha** deixou de
ser a rota. O que passou a valer:

| | antes | **agora** |
|---|---|---|
| **traje** (cor assada) | 530 paths chapados, 228,2 KB | **um `<image>` WEBP q82, 20,0 KB** — só para arte NOVA |
| **rosto** (recolore) | silhueta + miolo, **2 tons** na tela | **silhueta em vetor + máscara de luminosidade**, 917 tons |

**Isto não abre exceção na Regra Inviolável nº 4.** Ela proíbe **cor assada** onde o
aluno escolhe; nunca proibiu **tom**. A máscara da barba é um PNG **cinza** — não
tem cor para assar —, e a cor continua vindo inteira de `var(--av-cabelo)`.

**A máscara é ARQUIVO, não `data:`** (`public/items/rosto/<slug>-tom.png`, e o
catálogo guarda o caminho). Embutir o base64 foi a primeira versão e custava
**753,0 KB de gzip** num ranking de 30 — ver §13 do runbook.

Duas travas que você vai encontrar e que são de propósito:

- `traje-farda` e `traje-gambesao` estão **congeladas no vetor** (`CONGELADAS_NO_VETOR`
  em `traje.ts`). A trava é mecânica porque `arte:trajes --check` reescreve os `.svg`
  mesmo em `--check`;
- o braço `arte` de `PecaSobreposta` declara `tom?: never` — peça de cor assada **não
  compila** com tom, porque ela É o raster.

O resto deste arquivo é a rota do **cabelo**. Os passos Gate −1 e extração são os
mesmos no cabelo e no traje, sem uma linha de diferença.

**Quatro regras do traje que o cabelo não tem, e que valem antes de qualquer
comando:**

1. **a cor é a que a artista pintou** — a emenda de 2026-08-13 tirou o ciano e a
   patente do caminho: o passo 4 **só recorta**, não recolore, e o slug é
   `traje-<nome>` sem patente. Exceção única e sem sucessora: `traje-farda`, que
   continua recolorida por `COR_FINAL_DECLARADA` (`traje.ts`) porque assar o oliva
   na arte reprovou duas vezes no Gate −1;
2. **a arte carrega o próprio volume**, inclusive a sombra sob o queixo — o
   compositor não sombreia peça de traje (pintar por cima dobrava o sombreado);
3. **o contorno do tronco é do compositor, sempre.** Já foi tentado tirá-lo e já
   foi tentado reconstruí-lo no PNG; as duas reprovaram na tela. Ver §3.3 da
   referência e o achado **G17**;
4. **o transbordo além da silhueta é obrigatório e tem alvo**, não tolerância: a
   farda aprovada mediu **10,75%**. Peça perto de zero ali reprova sozinha, mesmo
   com todo o resto verde — *"roupa veste, não pinta"* (decisão do Doug,
   2026-08-12).

**A peça do traje sai em `.svg`, não em raster** — emenda de 2026-08-17. O campo do
literal é `tinta.arte`, não `tinta.png`, e o traçador é `CONFIG_TRAJE`, que **não é
a calibração do cabelo** (a do cabelo apaga o pesponto tracejado da carcela).

Se a peça já tem arte, **não desenhe variante**: importe. Desenhar três
interpretações de uma decisão já tomada faz o Doug escolher a que por acaso mais
se parece com o PNG que ele já tinha.

## O fluxo, em uma tela

```
arte:base → base-oficial.png (1024²)   ← UMA para todas as artes
   ↓ o Doug edita no Gemini pelo PEDIDO-GEMINI.md (contorno de 12 u OBRIGATÓRIO)
scripts/avatar/arte/<ARTE>.png (VERSIONADO)
   ↓ arte:gate      GATE −1: o boneco se mexeu?   (reprovou → arte:causa)
   ↓ arte:extrair   ciano ∩ região permitida → máscara + papéis
   ↓ arte:contorno  bordaOrdenada (Moore) → decimação por erro
   ↓ arte:converter massa {t,y} + clara + formas + o preto
   ↓ arte:espessura A RÉGUA QUE DECIDE A VARIANTE — fiel ou lei
   ↓ TRANSCREVEM em converter.ts
   ↓ arte:pecas     → src/lib/avatar/estilo/pecas-da-arte.ts (GERADO)
   ↓ arte:revisao   6 controles, e ela RECUSA desenhar se o literal defasou
   ↓ arte:folha     as artes entre si a 56 px
   ↓ A CONFERÊNCIA  eu olho a folha ANTES do Doug — teto de 2 min (abaixo)
   ↓ /dev/avatar-kokeshi → parecer do Doug   ← a única aprovação que existe
   ↓ promoção em CABELOS (§7 do runbook)
```

## ⛔ A folha NÃO vai ao Doug sem eu olhar antes

*Decidido em 2026-08-20. §14 do runbook — vale para as três esteiras.*

Terminar a esteira e mandar a folha é **metade do passo**. O outro meio é meu, e
tem **teto de 2 minutos**:

**1. As réguas primeiro, que custam segundos** — `arte:revisao` (6 controles),
`arte:reguas` (21 asserções), `arte:espessura`. Reprovou aqui, conserto **sem
abrir imagem nenhuma**.

**2. Passando as réguas, UMA leitura por subagente** — a folha a 56 px contra o
PNG que foi ao gerador, respondendo só estas cinco, fechadas:

1. a peça tem as mesmas partes do PNG? sumiu alguma?
2. a cor bate?
3. o contorno é contínuo — sem buraco, sem fio solto?
4. mudou alguma parte do boneco que não devia?
5. a peça cobre algo que devia aparecer? (boca, olho)

**Pergunta aberta é proibida.** "O que você acha da peça" custa o mesmo e devolve
julgamento que não é meu para dar.

**3. Conserto só o descritível.** Defeito com régua por trás → quarta saída (§8 do
runbook), refaço a folha, aí chamo o Doug. Forma nova ou "está feio" → sobe com o
problema **apontado**, sem tentar consertar.

**4. Reprovação do Doug vira régua** antes da próxima arte entrar na esteira. É o
que faz o custo cair: a barba que apagava a boca não tinha gate — se tivesse
virado asserção na hora, as duas artes seguintes pegavam de graça.

⏱ **Cronometre e anote no ESTADO-DA-ROTA.** O teto de 2 min é aposta, não medição:
o número que existe (8–12 min) é de leitura de PNG grande com tarefa aberta, que é
outra coisa. Estourou duas vezes seguidas → corta a leitura, mantém as réguas e a
amarra 4, e registre no runbook.

## As seis coisas que não se negocia

**1. O registro já está feito por construção.** A arte foi desenhada **sobre o
render**, então não há cabeça a registrar contra cabeça. O Gate −1 não calcula o
registro: ele **prova que não se quebrou**. É o passo caro que a rota antiga fazia
e esta tornou desnecessário.

**2. Régua nova entra com controle negativo, e o número errado fica impresso ao
lado do certo.** Este é *o* modo de falha da rota: régua que devolve o mesmo número
para coisas diferentes. Aconteceu cinco vezes, todas registradas. Uma régua sem
controle devolve 0% e ninguém sabe se é conserto ou vacuidade.

**3. `arte:revisao` recusa desenhar quando o controle 6 falha.** Julgar uma peça
enquanto o navegador mostra outra é pior que não julgar. Se ele reclamar, rode
`arte:pecas` antes de olhar a folha.

**4. A régua da espessura decide a variante, e decide ANTES de custar tipo.**
Banda legível (p50 ≳ 9 u) → `fiel`, que preserva a modulação de peso da artista.
Banda fina → **redesenhar** com contorno de 12 u (o pedido ao Gemini já exige) ou,
como rede, `lei`. O espetado tem 79,8% do perímetro abaixo de 8 u e não sobrevive
à `fiel`; o chanel tem 2,3% e é por isso que ela funcionou nele.

**5. Nada é apagado.** A família sintetizada (o `stroke` de 12 u, `Cabelo.linhas`)
está **congelada, não morta** — três peças usam. `tracar-cabelo.ts` é biblioteca
compartilhada e o refino da spline mora lá: **não apagar**.

**6. Bytes acima do teto não vetam arte aprovada.** Decisão A de 2026-08-06, e o
doc 15:463 já dizia. O valor é registrado; `ORCAMENTO_COMPOSTO` é autoimposto.

## Ao promover: a asserção negativa é o trabalho

Promover uma peça mexe em teste congelado. **O que tem de ficar parado, e você tem
de mostrar que ficou:**

- `pecas-da-arte.ts` com **uma hunk só**, dentro do bloco da arte que mudou;
- os selos de `parametrico-congelado.ts` **verdes** por lista explícita
  (`MODELOS_PARAMETRICOS`), nunca por filtro automático — um paramétrico que mude
  de família não pode sumir do teste em silêncio;
- `npm run avatar:folha-base` nos números do dia;
- **critério de fronteira:** rodar a esteira de outra arte não move um byte do
  render das peças já promovidas.

**Se algo além do previsto se mexer, pare e mostre.** Um paramétrico que muda um
byte quer dizer que a mudança veio do conversor e vale para todos — isso é achado
(`docs/achados.md`), não rebase.

## Depois de promover CABELO: vestir a peça — §7b do runbook

⚠️ **A peça não está pronta quando entra em `CABELOS`.** Um cabelo novo nasce com
**nove pares por decidir**, um por chapéu, e o `verify:arte` reprova até que os nove
estejam no `scripts/avatar/arte/aperto.json`.

O motivo é de largura: os penteados têm de 105% a 133% da largura da cabeça e os
chapéus não têm folga para eles; abaixo da aba não há o que esconder, então o conserto
é **estreitar o cabelo**, não cortar. O número é do OLHO do Doug, par a par, em
`/dev/avatar-oclusao` — **não tente derivá-lo de largura**, isso já foi medido e cai.

Fluxo: par na mesa -> aperto nos botões -> `gravar par` (inclusive `1,00`, que também
é decisão) -> nos nove chapéus -> `npm run arte:apertos`. Detalhe e as quatro
reprovações: **§7b do runbook**.

## O que os gates NÃO pegam — e é declarado

**Beleza.** A folha e o olho do Doug julgam a peça; os controles julgam a régua.
Nenhum número desta rota diz que a peça é bonita, e a franja torta do chanel
atravessou três blocos com todos os gates verdes. **A conferência acima não muda
isso**: ela pega fidelidade — o que a folha tem que o PNG não tem, e vice-versa —,
nunca *lê bem a 56 px*, *é bonita* ou *serve ao elenco*. Essas três continuam
sendo do Doug, e ele já acertou antes da régua mais de uma vez.

**O papel `luz`.** A arte tem três tons de ciano; o render tem **dois**. Não existe
terceiro. Uma mancha de brilho de 12,4% da cúpula vira 6 pixels no render, e
**nenhuma das 21 asserções toca nisso.** É a régua que falta (item 9 da lista
aberta), e a luz é o Passo 8, decidido para entrar por último.

**Barra enterrada.** Não chega a zero, e a régua não separa contorno de mecha de
contorno de crânio.

## Referências

- **`references/esteira-traje.md`** — a rota do TRAJE inteira: os 10 passos, o que
  só existe nela, as três ressalvas do Doug de 2026-08-12 e o que cada uma virou,
  os números da primeira peça para comparar com a próxima, e o que a promoção ainda
  deve
- `references/gates.md` — cada gate desta rota, a pergunta que ele faz, o controle
  que o prova e o que ele não pega
- `references/rota-semantica-legado.md` — a rota antiga, por que ela existiu, o que
  dela continua vivo e **o que não apagar**
- `references/contrato-fonte.md` — o contrato da fonte semântica. **Legado**, mas
  exato, e ainda é a régua de `verify:fonte-peca`, que está no `verify:all`
