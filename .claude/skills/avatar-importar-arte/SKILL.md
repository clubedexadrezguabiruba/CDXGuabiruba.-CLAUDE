---
name: avatar-importar-arte
description: Importa uma arte do avatar (CABELO ou TRAJE) para o catálogo pela rota de arte — o Doug edita a peça sobre um render do próprio compositor, o Gate −1 prova que o boneco não se mexeu, e a peça sai medida em vez de adivinhada. Use quando já existe arte editada sobre a base oficial e ela precisa virar peça de código; quando uma arte retocada volta para reentrada; quando um traçado saiu com menos massa que a arte; quando algo da referência "sumiu" da peça sem nenhum gate reprovar; ou quando o pedido for "importa esse cabelo", "importa esse traje", "cola essa peça no catálogo", "por que a mecha não apareceu?". Cobre as DUAS esteiras: a do cabelo (contorno → converter → pecas) e a do traje (arte:traje → arte:trajes → arte:folha-traje), que dividem o Gate −1 e a extração. Não é para inventar forma nova (isso é avatar-desenho) nem para medir número solto de referência (isso é avatar-regua).
version: 3.0.0
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

## Primeira pergunta: é CABELO ou é TRAJE?

São duas esteiras, e elas dividem quatro passos. Errar de corredor faz o programa
reclamar de um jeito que não aponta a causa.

| | **cabelo** | **traje** |
|---|---|---|
| o arquivo | `entrada.png`, `chanel.png`, … | **`traje-<patente>-<nome>.png`** |
| a peça vira | geometria `{t,y}` | **raster recortado** |
| os comandos do meio | `arte:contorno` → `arte:converter` → `arte:espessura` → `arte:pecas` | **`arte:traje` → `arte:trajes`** |
| a folha | `arte:folha` | **`arte:folha-traje`** |
| onde está escrito | este arquivo, abaixo | **[`references/esteira-traje.md`](references/esteira-traje.md)** |

**Se o nome do arquivo começa com `traje-`, vá para
[`references/esteira-traje.md`](references/esteira-traje.md) e siga por lá.** O
resto deste arquivo é a rota do cabelo. Os passos 2 e 3 — Gate −1 e extração — são
os mesmos nas duas, sem uma linha de diferença.

**Três regras do traje que o cabelo não tem, e que valem antes de qualquer
comando:**

1. **a cor não se escreve** — sai do slug, via `PATENTES` em
   `scripts/avatar/patentes.ts`, travada por `verify:paleta-patentes`;
2. **a arte carrega o próprio volume**, inclusive a sombra sob o queixo — o
   compositor não sombreia peça que tem `tinta.png`;
3. **o contorno do tronco é do compositor, sempre.** Já foi tentado tirá-lo e já
   foi tentado reconstruí-lo no PNG; as duas reprovaram na tela. Ver §3.3 da
   referência e o achado **G17**.

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
   ↓ /dev/avatar-kokeshi → parecer do Doug   ← a única aprovação que existe
   ↓ promoção em CABELOS (§7 do runbook)
```

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

## O que os gates NÃO pegam — e é declarado

**Beleza.** A folha e o olho do Doug julgam a peça; os controles julgam a régua.
Nenhum número desta rota diz que a peça é bonita, e a franja torta do chanel
atravessou três blocos com todos os gates verdes.

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
