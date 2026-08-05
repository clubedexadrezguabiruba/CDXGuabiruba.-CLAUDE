---
name: avatar-desenho
description: Desenha peça de catálogo do avatar kokeshi — cabelo, chapéu, traje, acessório, pet, fundo — em variantes genuinamente diferentes, cada uma renderizada e criticada antes de qualquer entrega. Use quando o pedido for "desenhe um cabelo novo", "faça um chapéu de general", "os 39 desenhos do Bloco 8", "me dá opções desse acessório", "essa peça ficou feia / genérica / não parece nada", ou quando uma peça existente precisar ser refeita porque lê errado a 56 px. Não é para medir referência (isso é avatar-regua) nem para interface do produto (isso é design-recruta64).
version: 1.0.0
argument-hint: "[peça] [nº de variantes, padrão 3]"
---

# Desenhar uma peça do elenco

*Escrita em 2026-08-03, para o pipeline kokeshi — em que a arte é código que emite
SVG. Se o pipeline de arte trocar, metade daqui caduca junto: é a regra 13 do §7b
acontecendo de novo.*

## O que esta skill faz, e o que ela não faz

Ela garante três coisas: que o resultado foi **visto**, que houve **alternativa**, e
que o defeito foi **nomeado**.

Ela **não** garante que a peça fique bonita. O que ela faz é mudar a natureza do erro
— de *"defeito que ninguém percebeu"* para *"escolha discutível"* — e escolha
discutível o Doug resolve no seletor. Não espere dela o que ela não pode dar.

O defeito que ela existe para consertar é concreto. No Bloco 2a.1 os cinco cabelos
foram desenhados em uma versão cada e depois corrigidos. Os três defeitos reais só
apareceram **renderizando**: o moicano lia como pluma de capacete, o coque como
boina, a trança como borrão. Gate nenhum pegou, e gate nenhum poderia. E o resultado,
correto, é *o primeiro resultado plausível refinado* — que não é uma escolha.

## 1. Onde mora a personalidade, neste estilo

**Na silhueta.** Não em detalhe interno.

O estilo é contorno preto grosso, cor chapada, sem gradiente, lido a 56 px numa lista
de 30. Ali o `viewBox` de 700 unidades dá **12,5 unidades por pixel**: a sobrancelha
inteira mede 0,66 px de espessura. Detalhe interno some. O que sobrevive é o recorte
contra o fundo.

Três consequências, e elas mandam nas fases seguintes:

- **as variantes divergem em silhueta e em massa**, não em ornamento;
- **um detalhe distintivo por peça**, e ele tem de sobreviver a 56 px;
- **a assimetria se ancora no `GIRO`**, nunca inventada. A cabeça vira minimamente
  para a direita da imagem, e isso é dado do sistema (`GIRO.eixoCabeca`,
  `desvioOlhos`, `desnivelOlhos`). Uma peça simétrica sobre uma base assimétrica
  briga consigo mesma; uma peça que inventa a própria assimetria briga com a base.

## 2. Quando SAIR desta skill

Retoque de peça **já aprovada** — mover dois pontos, trocar um tom, apertar uma
folga — não pede variantes. Faça o ajuste, rode `npm run avatar:folha-base` e pronto.

Três variantes de um retoque é desperdício, e desperdício repetido ensina a pular o
processo quando ele importa.

**E há um fork antes de tudo: já existe arte aprovada para esta peça?**

| a peça | o que fazer |
|---|---|
| não existe ainda — só o pedido | **desenhar**: as seis fases abaixo, três variantes |
| existe como **arte gerada aprovada** (PNG do `avatar:gerar`) | **traçar**: `npm run avatar:tracar -- <png>`, e não desenhar variante nenhuma |

Desenhar variante de uma arte que já foi aprovada é inventar três interpretações de
uma decisão que já foi tomada — e a que o Doug escolher vai ser aquela que por acaso
se parece mais com o PNG que ele já tinha aprovado. O fluxo do traçado está em
[references/traco-fiel.md](references/traco-fiel.md), com os números da rodada que o
produziu: IoU 68,77% contra 36,62% do desenho paramétrico, na mesma régua.

## 3. As seis fases

Cada uma tem critério objetivo de conclusão. Não avance sem ele.

### Fase 1 — Escopo e amarras
Uma peça por rodada. Reformule o pedido do Doug em uma frase, e **liste com número as
amarras que vão reprovar** — elas cortam o espaço de desenho, e propor fora delas é
perder a rodada. Carregue [references/amarras.md](references/amarras.md) aqui.

> **Conclui quando:** as amarras estão listadas com o número de cada uma.

### Fase 2 — Três direções, com eixo nomeado
O nome descreve a **direção** — "Domada", "Selvagem", "Presa" —, nunca "A/B/C". Cada
uma declara um **eixo**: a frase que diz em que ela diverge.

- Duas que diferem só na altura de um ponto são **uma** direção. Troque.
- **Uma das três tem de ser a que você não escolheria primeiro.** É o que separa
  explorar de justificar.
- Peça pequena demais para três eixos genuínos (um par de óculos tem uma forma e dois
  tamanhos): entregue **duas**, declare `MOTIVO_DE_DUAS` no rascunho, e diga qual
  terceira descartou e por quê.

> **Conclui quando:** três eixos escritos, nenhum repetido, **antes de qualquer
> código**.

### Fase 3 — Construir as três
Cada variante é uma entrada real de catálogo (um `Cabelo`, um `Traje`), não um
esboço, e as três passam pelos **mesmos** gates. Divergência não desculpa variante
mal-feita: uma que reprova não alarga a exploração, ela perde por execução e não
ensina nada sobre a direção que representava.

Declare em `.scratch/variantes.ts`. Carregue
[references/variantes.md](references/variantes.md) quando for montar — não antes, e
não para planejar.

> **Conclui quando:** as três compilam e `npm run avatar:variantes` sai com 0.

### Fase 4 — A crítica, e ela é obrigatória
`npm run avatar:variantes` gera a folha com um **selo** de seis caracteres que **não
é impresso no terminal**. Abra o PNG com a ferramenta de leitura de imagem.

**O relatório desta fase começa citando o selo.** Sem selo citado, a fase não
aconteceu.

Preencha a ficha, por variante:

1. a 56 px e sem contexto, isto lê como **o quê**?
2. o que da forma **sobra visível** depois da oclusão pelo crânio ou pelo tronco?
3. a silhueta se distingue das outras peças do mesmo slot?
4. onde está a assimetria — ela concorda com o `GIRO` ou briga com ele?
5. qual é o **único** detalhe distintivo, e ele sobrevive a 56 px?

**Regra de forma da resposta:** ela nomeia o que a forma **lê como**, não se ela é
boa. *"Lê como pluma de capacete"* é resposta. *"Ficou legal"* não é, e não muda
desenho nenhum. Resposta sem um substantivo do mundo — pluma, boina, borrão, capacete,
antena — não é resposta.

Carregue [references/leitura.md](references/leitura.md) antes de olhar a folha, e de
novo sempre que uma variante parecer certa e não convencer.

> **Conclui quando:** 5 respostas × N variantes, selo citado, e **ao menos um defeito
> nomeado**. Se as três saíram sem defeito, a crítica não aconteceu — volte e olhe o
> menor tamanho.

### Fase 5 — A segunda versão
Cada defeito nomeado vira uma correção **generalizável**, não um ajuste de número.
*"O coque lia como boina"* virou *"calota de círculo é redonda em qualquer altura em
que ela seja cortada"* — que serve para toda peça futura, e por isso foi para a
`leitura.md`. Rode a folha de novo.

> **Conclui quando:** o que vai ao Doug é a **segunda** versão de cada variante.

### Fase 6 — Entregar o seletor
`/dev/avatar-variantes` mostra uma por vez, em tamanho ajustável, com troca
instantânea — é onde se compara alternando **no mesmo pixel**, que revela o que lado
a lado esconde.

Entregue a tabela: **nome · eixo · quando ela é a certa · o que ela custa**.

**Nunca marque favorita.** Se duas convergiram durante a construção, corte uma e diga
que cortou.

> **Conclui quando:** o Doug tem o link, a tabela, e nenhuma recomendação.

## 4. Regras duras

1. **Renderize nos dois extremos e o que manda é o MENOR.** Regra 8 da §7. Peça que
   só se defende grande já perdeu.
2. **A peça não declara a fronteira do corpo.** Cabelo dá `{ t, y }` com `t` fração
   de `bordasEm(y)`; traje dá tinta e decoração, nunca silhueta. Quem corta é o
   `clipPath`. Um traje que tente declarar silhueta **não compila**.
3. **A ponta de toda franja cai FORA da silhueta.** Sangria e faca de corte: o
   excesso é o comportamento exigido, não o defeito.
4. **Nada que não seja pele mora em 18–28° de matiz.** Nem no cinto, nem na gola. O
   pipeline separa pele de pano por matiz, e uma bota marrom seria entendida como
   pele e mudaria de cor junto com o aluno.
5. **A cor que você escolher é definitiva.** Só pele e cabelo recolorem (emenda à
   D27). A cor do uniforme **é** o sinal da patente.
6. **Uniforme folgado, nunca justo.** Sobra se remove de forma determinística; falta
   exigiria inventar desenho.
7. **Nada de comentário dentro do `<style>`** do SVG — um `/* … */` já fez o Chromium
   descartar em silêncio todas as regras seguintes.
8. **Estado inicial explícito em tudo que a animação esconde.** Pálpebra que nasce
   fechada entrega um boneco cego na folha de contato.
9. **O orçamento é base + UM item**, medido, nunca somado: nunca há dois cabelos num
   render. Composto 26 formas / 10 240 bytes; a base careca é **regressão** em
   19 / 7 418 e não pode crescer nem um byte para pagar a sua peça.
10. **O Doug julga arte; o gate julga número.** Nunca troque os papéis — nem
    aprovando por gate verde, nem pedindo que ele confira uma folga.

## 5. O que importar, e de onde

`geometria.ts` tem 64 KB e `cabelo.ts` 21 KB, quase tudo docstring denso. **Importe
símbolos nomeados**, não leia os arquivos inteiros:

- forma: `bordasEm`, `spline`, `n`, `CABECA`, `CAIXA_CABECA`, `GIRO`, `TRACO`,
  `SANGRIA`, `OLHO_CX_ESQ`, `OLHO_CY_ESQ`, `SOBRANCELHA`
- cabelo: `Cabelo`, `FOLGA_ROSTO`, `folgaDoRosto`, `ancoragemDasExtensoes`
- composição: `compor` de `compositor.ts`; `Traje` e `EstadoAvatar` de `tipos.ts`
- cor: `PELE`, `CABELO`, `LINHA`, `escurecer` de `palette.ts`

O melhor modelo do que uma peça de catálogo é: `src/lib/avatar/estilo/cabelo.ts`.

## As regras de arte, que esta skill não repete

Vinculantes, em `docs/avatar/15-plano-ate-pronto.md` — **§7** (método), **§7b** (arte
de origem) e **§7c** (composição). Leia essas três e só essas. A tabela de matiz e as
cinco armadilhas do conversor estão em `docs/avatar/16-uniformes-runbook.md`, **§2,
§2.1 e §2.2, e só elas**: o banner no topo daquele documento declara o resto morto, e
ele está certo.
