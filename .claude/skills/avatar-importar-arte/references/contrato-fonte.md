# O contrato da fonte semântica — **rota LEGADA**

> **Este não é o caminho para arte nova.** A rota vigente é a de
> `scripts/avatar/arte/`, no
> [runbook 19](../../../../docs/avatar/19-rota-de-arte-runbook.md). Este documento
> continua exato e continua valendo para a peça que já entrou por aqui
> (`curto-espetada`) e para o gate `verify:fonte-peca`, que está no `verify:all` e
> **não deve ser removido**. Contexto e o que não apagar:
> [rota-semantica-legado.md](rota-semantica-legado.md).

A régua de verdade é `scripts/avatar/estilo/fonte-peca.ts`, medida por
`scripts/avatar/estilo/__tests__/fonte-peca.test.ts`. Este documento explica; ele
não decide. Onde os dois divergirem, o código venceu.

## A forma do arquivo

`semantica.svg` é o `origem.svg` **com atributos acrescentados**. Mesma geometria,
mesmo `viewBox`, mesma ordem — o que muda é que cada `<path>` passa a dizer o que
ele é.

```xml
<path fill="#19C7C0" opacity="1.000000" stroke="none"
      data-avatar-role="massa" data-avatar-paint="cabelo" d="M…C…z"/>
<path fill="#040D0C" opacity="1.000000" stroke="none"
      data-avatar-role="linha-mascara" data-avatar-paint="linha" d="M…C…z"/>
<path fill="#19C7C0" opacity="1.000000" stroke="none"
      data-avatar-role="extensao" data-avatar-paint="cabelo"
      data-plano="atras" data-avatar-grupo="cortina-esq" d="M…C…z"/>
<path fill="#FED5A3" opacity="1.000000" stroke="none"
      data-avatar-role="descarte" data-motivo="rosto do boneco do gerador" d="M…C…z"/>
```

Proibidos, e o parser lança: `<g>` · `transform` · `<use>` · `opacity` ≠ 1 ·
qualquer comando em `d` fora de `M C z`.

## Os seis papéis

| `data-avatar-role` | geometria na fonte | exige | vira |
|---|---|---|---|
| `massa` | fechada | `paint` | o tom **base**, o que o compositor pinta com `cabelo-s` |
| `tom-claro` | fechada | `paint` | `Cabelo.clara` — o tom **claro**, pintado por cima com `cabelo` |
| `linha-mascara` | **fechada** (tinta preta) | `paint` | `Cabelo.linhas` — **aberta**, extraída pelo importador |
| `extensao` | fechada | `paint` + `data-plano` | `Cabelo.extensoes` / `Traje.extensoes` |
| `guia` | qualquer | — | **nada.** Nunca entra na peça; conta na completude |
| `descarte` | qualquer | `data-motivo` | nada, mas **conta na completude** |

`data-avatar-grupo` é opcional e serve a um caso só: juntar subpaths de uma mesma
extensão que o conversor partiu em pedaços, quando eles precisam ser um laço só.

`data-avatar-paint` é o token de tinta, não uma cor. Cabelo usa `cabelo`,
`cabelo-s`, `linha`. Traje usa os tokens da patente — `scripts/avatar/patentes.ts`
é a fonte única deles.

**O par papel + tinta é gate, e ele existe porque os dois nasceram trocados.** A
primeira semantização mandou a família clara para `massa` e a escura para
`tom-claro`, produzindo um arquivo legal com os nomes invertidos — e a peça sairia
com o volume ao contrário. O contrato de tinta de `importarPeca` exige
`massa`→`cabelo-s`, `tom-claro`→`cabelo`, `linha-mascara`→`linha`, porque é isso
que o compositor faz: `.kk-cabelo-s` pinta a massa com o escuro e leva o traço,
`.kk-cabelo` pinta a clara por cima com o base.

**`Cabelo.massa` não sai do papel `massa` sozinho.** O conversor **ladrilha**: os
tons são regiões disjuntas que juntas cobrem a peça, então o papel `massa` isolado
teria um buraco no formato exato da camada clara. A silhueta vem da **união** de
todo papel que pinta; a decomposição por papel só decide qual tinta vai por cima.

## A unidade de contabilidade: o subpath significativo

**Significativo** = não é moldura (≥95% do `viewBox`) **e** está acima do piso de
área (`PISO_AREA`, 0,002% do `viewBox` ≈ 21 u² em 1024²).

Nesta arte: 520 subpaths → 1 moldura + 284 sob o piso (0,1% da área) + **235
significativos**. São 235 decisões de rótulo, e cada uma precisa de **exatamente um**
dono.

## O que reprova, e por quê

| reprovação | por quê |
|---|---|
| path significativo sem `data-avatar-role` | é o descarte silencioso voltando pela porta dos fundos |
| papel desconhecido | erro de digitação vira peça faltando |
| comando fora de `M C z` | um `L` pulado deforma o subpath sem sintoma, e todo número derivado continua plausível |
| `opacity` ≠ 1 | a máscara sairia com menos tinta do que a arte tem, e nada acusaria |
| `massa`/`tom-claro`/`linha-mascara`/`extensao` **aberta** | a fonte guarda tinta como região; aberta é sinal de que a curadoria mexeu na geometria |
| `extensao` sem `data-plano` | o compositor não saberia se a mecha passa atrás ou na frente |
| `data-plano` em papel que não é `extensao` | plano sem sentido é rótulo copiado sem ler |
| papel que pinta sem `data-avatar-paint` | o traje tem quatro tintas fixas; sem token, o contrato não atravessa o segundo piloto |
| `descarte` sem `data-motivo` | descarte sem motivo é o buraco original |
| moldura com papel de peça | pintaria o quadro inteiro |
| mesmo subpath reclamado por dois paths | curadoria duplicou um path e rotulou os dois |
| `<g>` / `transform` / `<use>` | matriz não composta faz toda coordenada mentir |
| subpath da origem que sumiu da semântica | apagar não é rotular — é a `cortina-solta` |
| subpath na semântica que a origem não tem | geometria inventada, sem referência para conferir |

## O fechamento é geométrico

Medido no A0: a arte tem **520 `M` para 437 `z`**, e a distância entre o último
ponto e o primeiro é **0,0000 nos 520**. O conversor fecha a geometria e economiza
a letra.

Então `fechado` é `|fim − ini| ≤ EPS_FECHO` (0,05 u), ou `z` explícito. Ler `z`
reprovaria 83 subpaths corretos da arte que o pipeline existe para importar.

## Identidade

`identidadeDoSubpath()` = hash do `d` normalizado + área + caixa. Nunca o índice:
*"o conversor não promete ordem"*, e qualquer passagem por editor reordena.

Área e caixa entram junto do `d` porque uma colisão de hash com geometria diferente
vira discordância visível, em vez de troca calada.
