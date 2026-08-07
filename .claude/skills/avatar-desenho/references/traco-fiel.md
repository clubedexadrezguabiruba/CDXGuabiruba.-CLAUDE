# O traço fiel — de PNG gerado a peça de catálogo · **rota LEGADA**

> **Este não é o caminho para arte nova.** Desde 2026-08-07 a rota vigente é a de
> `scripts/avatar/arte/`, no
> [runbook 19](../../../../docs/avatar/19-rota-de-arte-runbook.md) — o Doug edita
> sobre um render do próprio compositor, e o registro caro que esta página faz
> (cabeça da arte × cabeça do produto) deixa de ser necessário.
>
> Esta página vale como **histórico dos números daquela rodada**. E o que ela
> descreve **não se apaga**: `tracar-cabelo.ts` é biblioteca compartilhada — o
> `refinarPelaSpline` do Bloco 14, o `escolherN` e o `medirMassa` moram lá e são
> usados pela rota vigente.

Quando a arte já existe e foi aprovada, **não se desenha variante: traça-se.** Esta
página é o fluxo inteiro, com os números da rodada que o produziu.

## Por que ele existe

O `cabelo.ts` abre dizendo, na linha 28, que os números dele são **desenhados, não
medidos** — e por muito tempo isso não tinha conserto, porque a `referencia-base.png`
é um boneco careca e não havia de onde extrair a forma de um cabelo.

Quando o gerador de imagem passou a entregar arte, passou a haver. A primeira
tentativa mediu a arte pela régua paramétrica e a folha **HSHC93** foi reprovada com
uma frase: *"vc não está reproduzindo a arte fielmente, como foi feito com o avatar"*.
Os números concordaram — IoU 61,7%, desvio médio de borda 36,1 unidades — e a causa
não era o critério de decimação:

| o que a arte tem | por que não cabia |
|---|---|
| **cortina** — massa descendo ao lado do rosto até a bochecha, DENTRO da silhueta | não é franja (é a 2ª corrida da coluna) e não é extensão (não passa do crânio). Segurava ~220 u de desvio sozinha |
| ~12 espículas no topo | viravam calota de 5 bossas |
| 6–8 bicos em V na franja | viravam curva única |
| sombra seguindo as mechas | virava faixa chapada paralela |

**O problema era o modelo de dados e o traçador, não o N.** Uma franja aberta é uma
função de `x`, e cortina não é.

## O fluxo, ponta a ponta

```
gerar → traçar → fidelidade → folha → (f) → colar → folha-base
```

### 1. gerar

`npm run avatar:gerar`. O pedido exige o cabelo em **verde-azulado ~177°**, e isso é
instrumento, não estética: o contorno tem 12 unidades e é preto, cabelo escuro mora no
mesmo limiar de luminância, e só o matiz separa os dois. É a regra 10 da §7b usada ao
contrário.

### 2. traçar

```
npm run avatar:tracar -- .scratch/estilo/gerado/<arte>.png
```

Devolve um literal `Cabelo` pronto para colar. O método é o da base:

1. **máscara** = teal ∪ o preto **dele** (o preto a menos de um traço do teal). O
   componente sai do **teal**, não da união — o preto é conexo, e partindo dele a peça
   atravessa a bochecha até o queixo e reencontra o teal da gola;
2. **ordem** por traçado de borda (Moore). É o que a cortina obriga: varredura por
   coluna tem de escolher um `y` por `x`, e a cortina tem dois;
3. **posição** pelo centro da corrida de preto na normal local — `corridas()` de
   `medir.ts`, a mesma mecânica dos 42 pontos do crânio;
4. suavizar por arco **antes** de decimar (lição 3 do Bloco 1d);
5. `decimarPorCorda({ fechado: true })`, com **N por curva** escolhido pelo desvio até
   encostar no piso da própria curva.

**O que o traçador NÃO faz mais: subir a peça.** `liberarORosto()` subia a franja
inteira até o rosto respirar — na `curto-espetada` seriam 43,5 unidades — e o que
apareceu na folha foi uma **faixa de testa nua que não existe no PNG**. A folga da arte
é medida, impressa por sobrancelha, e um valor abaixo do piso vira aviso e item para o
olho. Amarra que briga com a arte se re-ancora na arte.

### 3. fidelidade

```
npm run avatar:fidelidade              # os dois gates
npm run avatar:fidelidade -- --piso    # quanto do desvio é decimação e quanto é piso
npm run avatar:fidelidade -- --inverter # R10: o paramétrico TEM de sair vermelho
```

- **gate 1** — desvio de borda por curva, contra o **piso medido na mesma arte**;
- **gate 2** — massa só na arte ≤ 2%. É o gate da cortina: com ela representada, ele
  cai de 21,4% para 1,8%.

O piso não é um número registrado à mão, e a medição explicou por quê: rodada com a
decimação **desligada** (1 193 pontos), a `curto-espetada` dá 27,6 u contra os 27,3 da
peça entregue de 64. **A decimação custa 0,3 unidade.** Os 27 restantes são o boneco do
gerador não ser o do `geometria.ts` mais o clip do crânio — não respondem a N nem a
critério. Um piso constante valeria para uma arte só.

### 4. folha, e a decisão (f)

```
npm run avatar:fidelidade -- --folha
```

Duas colunas — a arte recortada no retângulo do `viewBox` e o traço —, quatro tamanhos,
mais a repetição a 56 px na paleta de verdade. **A leitura vai por subagente**, e o
relatório começa citando o selo.

O que o olho decide, e a régua não: se a peça lê como cabelo a 56 px, e o que fazer
quando a folga da arte é curta — re-gerar com a franja mais alta, ou re-ancorar a
amarra.

### 5. colar

Colagem **manual**, no `CABELOS`. É o mesmo pipeline dos 42 pontos do crânio, pelo
mesmo motivo: literal colado aparece no diff; literal gerado em tempo de build, não.

Sem `pontos` e sem `sombra` — as duas famílias são exclusivas por gate.

### 6. folha-base

```
npm run avatar:folha-base
```

Base careca **19 formas / 7 418 bytes exatos** (regressão, não teto), composto contra
`ORCAMENTO_COMPOSTO`. **O teto de bytes não veta arte aprovada** (doc 15:463): se o
composto passar, o número novo é medido e registrado, não a peça simplificada.

## Cortina virou representável

O prompt do `gerar.ts` proíbe cortina para o `curto`, e a arte aprovada tem uma. Isso
deixou de ser um "ou/ou": `massa` guarda cortina, e o pedido pode pedi-la de propósito.

## Os números do piloto (`curto-espetada`, 2026-08-03)

| | paramétrico | traçado |
|---|---|---|
| IoU | 36,62% | **68,77%** |
| borda de baixo (médio) | 42,5 u | **27,3 u** (piso 27,6) |
| borda de cima (médio) | 51,8 u | **10,2 u** (piso 10,2) |
| massa só na arte | 21,4% | **1,8%** |

Espessura do traço **da arte**: 3,7 u de mediana, contra `TRACO = 12` que o compositor
desenha. É desvio aceito e declarado — o estilo tem **uma** espessura.
