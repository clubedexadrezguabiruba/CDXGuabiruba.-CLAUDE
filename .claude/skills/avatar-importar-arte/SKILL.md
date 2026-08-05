---
name: avatar-importar-arte
description: Importa uma arte aprovada do avatar para o catálogo por fonte semântica versionada — a peça é declarada path a path num SVG, não adivinhada a partir de pixels. Use quando já existe arte gerada e aprovada e ela precisa virar peça de código; quando um traçado saiu com menos massa que a arte; quando algo da referência "sumiu" da peça sem nenhum gate reprovar; ou quando o pedido for "importa esse cabelo", "cola esse traje", "por que a cortina não apareceu?". Não é para inventar forma nova (isso é avatar-desenho) nem para medir número solto de referência (isso é avatar-regua).
version: 1.0.0
argument-hint: "[peça] [caminho da arte aprovada]"
---

# Importar arte aprovada para o catálogo

*Escrita em 2026-08-04, depois de três folhas reprovadas do `curto-espetada`
(93ETYY, HSHC93, XHHXP9) em que **todos os gates automáticos passaram e a folha
visual reprovou**.*

## O defeito que esta skill existe para fechar

O traçado antigo decide o que pertence à peça **olhando pixel**: filtra o matiz do
cabelo, acha as componentes conexas, e fica com a maior. O que sobra vira um `⚠` no
log e não reprova nada.

Numa arte com cortina — a massa que desce ao lado do rosto, separada do volume por
um vão — a cortina **é outra componente**. Ela saía da peça em silêncio. O render
ficava com 79% da massa da arte, e 77% do desvio de fidelidade não tinha causa
apontada: *"a peça simplesmente não tem os pontos lá"*.

**Adivinhar não tem conserto por afinação.** A saída é a peça deixar de ser inferida
e passar a ser **declarada**, num arquivo versionado, path a path — e o que não foi
declarado **reprova**, em vez de sumir.

## A regra que decide se é esta skill

| situação | skill |
|---|---|
| inventar forma nova, variantes, refazer peça que lê errado | `avatar-desenho` |
| medir um número de referência para `geometria.ts` | `avatar-regua` |
| **arte já aprovada precisa virar peça de código** | **esta** |

Se a peça já tem arte aprovada, **não desenhe variante**: importe.

## O fluxo, e o que é fonte de verdade em cada etapa

```
referencia.png (congelado)      ← cor, enquadramento, julgamento visual
   ↓ conversor Adobe
origem.svg (congelado)          ← forma bruta, tom por path
   ↓ npm run avatar:semantizar   ← ASSISTÊNCIA: propõe o papel de cada path
semantica.svg (VERSIONADO)      ← A FONTE: um data-avatar-role por <path>
   ↓ npm run avatar:importar     ← contrato + completude + máscara→pontos
peca.ts (VERSIONADO, ao lado da fonte)  ← o literal {t,y}, colado à mão
   ↓ npm run avatar:importar -- --check   ← o literal ainda bate com a fonte?
   ↓ npm run avatar:fidelidade   ← por papel, e a folha
folha  →  olho do Doug  →  selo em ficha.md  →  SÓ ENTÃO cola em cabelo.ts
```

A fonte mora em `scripts/avatar/fonte/estilo-kokeshi/<família>/<peça>/`, com cinco
arquivos: `referencia.png`, `origem.svg`, `semantica.svg`, `peca.ts`, `ficha.md`.
**Nada depende de `.scratch/`** — foi de lá que veio metade do problema: o insumo
do pipeline morava numa pasta que o git ignora.

**O literal não entra no catálogo antes da folha.** `peca.ts` fica ao lado da fonte
que o originou: o `--check` já tem dente (fonte mudou sem recolar = vermelho, e ele
está no `verify:all`), o catálogo fica intocado enquanto a peça não é aprovada, e a
regressão dos cinco cabelos paramétricos continua valendo para os cinco.

## As cinco coisas que não se negocia

**1. O papel vai em cada `<path>`, nunca em `<g>`.** O parser lança em `<g>`,
`transform` e `<use>`, e a razão está escrita em `fonte-svg.ts`: matriz de grupo
tornaria toda coordenada não confiável. Sem grupo, o problema **não existe** — não
há regra nova para escrever nem para testar.

**2. Fechado é geométrico, jamais sintático.** O conversor escreve 520 `M` para 437
`z`: 83 subpaths não escrevem o próprio fecho, e a folga medida entre o último ponto
e o primeiro é **0,0000 em todos os 520**. Ler `z` reprovaria 83 paths corretos.

**3. A linha de centro é produto do importador, não da fonte.** O conversor traça
tinta como **região fechada**; ele nunca emite stroke (`stroke="none"` em 437/437).
Então `linha-mascara` é fechada na fonte, e a polilinha **aberta** sai da mesma
sondagem por normal que o PNG usa — `medirMassa`, em `tracar-cabelo.ts`.

**4. Identidade de path é hash do `d`, nunca índice.** *"O conversor não promete
ordem"* — `fonte-svg.ts` já aprendeu isso para a moldura. Medido: 235 identidades
distintas para 235 subpaths, zero colisões.

**5. Descarte tem motivo escrito.** `data-motivo` é obrigatório. Descarte sem motivo
é exatamente o buraco que esta skill fecha.

**6. `t` é fração da largura da cabeça NAQUELA altura — inclusive na hora de medir.**
Registrar caixa contra caixa acerta escala e posição e erra **forma**: a cabeça do
gerador é redonda, a do kokeshi é de canto arredondado, e medido, a arte fica até
100 unidades mais estreita na cúpula com as duas caixas coincidindo. O cabelo, que
na arte encosta na borda da cabeça em toda linha, aparecia com couro cabeludo à
mostra em volta da coroa — 8,3% de cobertura onde se exige 100. A conversão fiel
pergunta à ARTE o mesmo que `bordasEm` pergunta ao produto. Ver `reancorarNaCabeca`.

## O que os gates NÃO pegam — e é declarado

**Rótulo plausível mas errado.** Marcar a silhueta da cabeça como `massa` produz um
arquivo perfeitamente legal: fechado, com papel, com tinta, reclamado uma vez.
Nenhuma contabilidade de conjunto acusa isso.

Tentei uma regra exata para ele e ela é **vazia nesta arte** — ver o cabeçalho de
`fonte-peca.ts`. Um teto de área resolveria, e teto calibrado na peça que se quer
aprovar aprova o defeito junto. Quem pega rótulo errado é a **folha** e a trava de
silhueta do runtime. Não finja o contrário.

## Referências

- `references/contrato-fonte.md` — os atributos, papel a papel, e o que reprova
- `references/gates.md` — cada gate, a pergunta que ele faz, a fixture que o prova
  e o que ele não pega
