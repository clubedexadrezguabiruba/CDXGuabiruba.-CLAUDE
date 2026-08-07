# A rota semântica — legado, e o que dela NÃO se apaga

*A versão 1.0 desta skill (2026-08-04) ensinava esta rota. Ela foi substituída em
2026-08-07 pela rota de `scripts/avatar/arte/`. Esta página existe para duas
coisas: dizer por que ela existiu, e impedir que alguém apague o que continua
vivo.*

## O que ela era

```
referencia.png (congelado)      ← cor, enquadramento, julgamento visual
   ↓ conversor Adobe
origem.svg (congelado)          ← forma bruta, tom por path
   ↓ npm run avatar:semantizar   ← ASSISTÊNCIA: propõe o papel de cada path
semantica.svg (VERSIONADO)      ← A FONTE: um data-avatar-role por <path>
   ↓ npm run avatar:importar     ← contrato + completude + máscara→pontos
peca.ts (VERSIONADO, ao lado da fonte)
   ↓ npm run avatar:importar -- --check
   ↓ npm run avatar:fidelidade
```

A fonte mora em `scripts/avatar/fonte/estilo-kokeshi/<família>/<peça>/`, com cinco
arquivos: `referencia.png`, `origem.svg`, `semantica.svg`, `peca.ts`, `ficha.md`.
O contrato está em [contrato-fonte.md](contrato-fonte.md), e ele continua exato.

## O defeito que ela existiu para fechar — e ele continua real

O traçado ainda anterior decidia o que pertence à peça **olhando pixel**: filtrava
o matiz do cabelo, achava as componentes conexas, e ficava com a maior. O que
sobrava virava um `⚠` no log e não reprovava nada.

Numa arte com cortina — a massa que desce ao lado do rosto, separada do volume por
um vão — a cortina **é outra componente**, e saía da peça em silêncio. O render
ficava com 79% da massa da arte, e 77% do desvio de fidelidade não tinha causa
apontada.

**Adivinhar não tem conserto por afinação.** A rota semântica respondeu fazendo a
peça ser **declarada** path a path. A rota de arte responde de outro jeito, e é o
motivo de ela ter vencido: a peça é **isolada pela cor instrumental** sobre um
render do próprio compositor, então não há o que adivinhar — e componente solta
tem para onde ir (`Cabelo.claras`, `Cabelo.formas`, medido em 0 u² de perda nas
três artes).

## Por que ela perdeu

| | rota semântica | rota de arte |
|---|---|---|
| de onde vem a arte | gerador externo, enquadramento próprio | **render do próprio compositor** |
| o registro | `registroPelaCabeca` — cabeça da arte × cabeça do produto | **já feito por construção**; o Gate −1 só prova que não quebrou |
| insumo | `origem.svg` de conversor Adobe | PNG editado no Gemini |
| quem anota o papel | uma pessoa, path a path | a **cor** que o pedido ao gerador manda usar |
| a folha de fidelidade | `avatar:fidelidade --folha`, e ela **recusa receber PNG** por escrito | `arte:revisao`, que sobrepõe PNG × render |

O passo caro da semântica era exatamente o que a rota de arte tornou
desnecessário. E `avatar:fidelidade --folha` está amarrada ao pipeline antigo por
construção (`fidelidade.ts:1757-1766`): ela exige `semantica.svg`, `importarPeca` e
`registroPelaCabeca`.

## ⚠ O QUE NÃO APAGAR

**1. `tracar-cabelo.ts` é biblioteca compartilhada, não "pipeline velho".** O
**refino da spline** do Bloco 14 mora lá (`refinarPelaSpline`), e ele é o que
consertou a franja torta do chanel — a régua media a **corda** enquanto o
compositor desenha **spline**, e numa reta a corda erra zero, então a decimação não
punha ponto. `escolherN` e `medirMassa` também vivem lá e são usados pela rota
vigente.

**2. `verify:fonte-peca` está no `verify:all`.** É `avatar:importar -- --check`: ele
prova que o literal da `curto-espetada` ainda bate com a `semantica.svg` que o
originou. Enquanto essa fonte existir versionada, o gate tem função.

**3. A família sintetizada de peça traçada está congelada, não morta.** Três peças
usam `Cabelo.linhas` (o `stroke` de 12 u). O **Passo 7** — matar o sintetizado —
está **bloqueado por construção** até todas as traçadas transcreverem, e o espetado
está congelado por decisão do Doug (decisão C, 2026-08-06): re-emiti-lo pela `lei`
custa nova aprovação visual.

**Nada é apagado.** Foi decisão explícita do Doug em 2026-08-07, revogando as
decisões 2 e 4 de 06/08 — nem arte, nem paramétrico, nem a `entrada-3`, que
continua servindo de isca do controle 3.

## As lições dela que a rota nova herdou

1. **Fechado é geométrico, jamais sintático.** O conversor escrevia 520 `M` para
   437 `z`; a folga medida entre último e primeiro ponto era **0,0000 em todos os
   520**. Ler `z` reprovaria 83 paths corretos.
2. **Identidade é hash do conteúdo, nunca índice.** *"O conversor não promete
   ordem."*
3. **Descarte tem motivo escrito.** Descarte sem motivo é o buraco original.
4. **Teto calibrado na peça que se quer aprovar aprova o defeito junto.** Por isso
   os tetos saem de fixture sintética. É a mesma regra que faz a rota nova exigir
   controle negativo em toda régua.
5. **Rótulo plausível mas errado nenhuma contabilidade pega.** Marcar a silhueta da
   cabeça como `massa` produz um arquivo perfeitamente legal. Quem pega é a folha e
   o olho do Doug — e isso não mudou.
