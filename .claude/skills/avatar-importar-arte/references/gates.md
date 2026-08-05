# Os gates da importação

Cada linha responde a uma pergunta diferente. Nenhum deles substitui o olho do
Doug, e a tabela diz explicitamente o que cada um **não** pega — gate que se
apresenta como completo é pior que gate ausente.

| gate | pergunta | onde | o que ele NÃO pega |
|---|---|---|---|
| **contrato** | a fonte é legível e completa em forma? | `lerFontePeca` | rótulo plausível mas errado (massa marcada como tom) |
| **contrato de tinta** | cada papel carrega o token que o compositor pinta nele? | `importarPeca` | tinta certa no papel certo com a geometria errada |
| **completude estrutural** | todo path significativo tem exatamente um dono? | `conferirCompletude` | tinta que o conversor perdeu antes de gerar o SVG |
| **ilha solta** | a tinta declarada é uma componente só? | `importarPeca`, `PISO_ILHA` | ilha abaixo de meio por cento da massa |
| **completude raster** | a união dos papéis cobre a tinta da referência? | `completudeRaster` | detalhe menor que a banda de borda |
| **laço limpo** | o laço entregue se cruza? | `decidirN` | forma feia sem cruzamento |
| **`--check`** | o literal colado ainda é o que a fonte produz? | `avatar:importar -- --check` | fonte errada colada corretamente |
| **fidelidade por papel** | massa, tom, linha e extensão, cada um contra a arte | `avatar:fidelidade` | leitura — beleza não é número |
| **56 px** | o penteado continua reconhecível? | folha | **nada substitui o olho do Doug** |

## Reprovação e achado são coisas diferentes

`avatar:importar` imprime duas listas, e a distinção é o que dá dente às duas.

**Reprovação** é o que a importação controla — contrato, tinta, ilha, completude,
laço cruzado. Sai 1, e a correção mora neste pipeline.

**Achado** é o que só a arte resolve: a cabeça do gerador ser mais redonda que a do
kokeshi, a franja descer sobre a sobrancelha do produto, a clara encostar na borda.
Reprovar por eles faria o gate exigir do importador uma decisão que é do Doug com a
folha na mão — e um gate que ninguém consegue deixar verde é um gate que se aprende
a ignorar.

## As fixtures, e o que cada uma prova

Em `scripts/avatar/estilo/__tests__/fonte-peca.test.ts`. Cada fixture viola **uma**
regra: uma que reprova por dois motivos ao mesmo tempo não prova nada sobre nenhum
dos dois.

`papel-desconhecido` · `sem-papel` · `comando-desconhecido` · `massa-aberta` ·
`linha-aberta` · `extensao-sem-plano` · `plano-desconhecido` · `plano-fora-de-extensao` ·
`sem-paint` · `descarte-sem-motivo` · `moldura-como-peca` · `dois-donos` ·
`g-transform-use` · `opacity-parcial` · `guia-vazando` · `cortina-solta` ·
`geometria-inventada` · `viewbox-diferente`.

As formas são retângulos escritos em `C`, porque o repertório do conversor é
`M C z` e mais nada — um `L` na fixture reprovaria por comando desconhecido antes
de chegar à regra que se quer testar.

## Os dois níveis de completude, e por que são dois

**Estrutural** é exato e **não tem teto**: cada subpath significativo da origem tem
de aparecer exatamente uma vez na semântica. É contabilidade de conjunto — dá para
apontar *qual* path sumiu, com área e caixa.

**Raster** é rede de proteção: a união dos papéis, rasterizada, cobre a tinta de
cabelo da referência? Ele pega o que o estrutural não vê — tinta que o conversor
já tinha perdido antes de o arquivo existir.

O raster precisa de um teto, e **teto calibrado na peça que se quer aprovar aprova
o defeito junto**. Por isso ele é calibrado em **fixture sintética**, nunca na
`curto-espetada`. Medido lá: idêntico 0,00% · um bloco não declarado 50,00% ·
`rosto-e-gola` 19,92% de invasão. O teto de 1% fica na faixa inteira entre "nada" e
"metade da peça sumiu" — não é um número afinado.

### O raster mede PERÍMETRO se ninguém segurar

A primeira versão do gate comparou área com área e devolveu **5,32%** na
`curto-espetada` — reprovaria a peça. A distribuição desmente a leitura: 99,4% dessa
tinta está a **≤ 5 px** da união, e não existe **um único pixel** a mais de 20 px.
Não é buraco; é a diferença entre duas descrições da mesma borda, e ela cresce com o
número de fragmentos, não com o que se perdeu.

Por isso o gate olha só o que está além da **banda de borda** (`BANDA`, 5 px, a
mesma ordem do `PISO_AREA`). Com ela: buraco 0,03%, invasão 0,44%.

## O controle negativo

`rosto-e-gola`: a pele e a gola do boneco do gerador **não** podem contar como
cobertura de cabelo. Sem esse controle, um gate de cobertura fica verde porque a
figura inteira está lá — e não porque a peça está.

Na fixture ele é decisivo: com a pele marcada como peça, o buraco continua em 0,00%
— a cobertura do cabelo está perfeita — e só a invasão acusa, em 19,92%.

## `--check`, e por que não há hash em markdown

O risco real: `semantica.svg` muda, o literal em `cabelo.ts` não é recolado, e
fonte e runtime divergem em silêncio.

`avatar:importar -- --check` reimporta, compara numericamente com o literal
importado de `cabelo.ts`, e sai 1 se divergir. Entra no `verify:all`.

**Não se grava hash em `ficha.md`.** Este repositório já pagou esse erro: o
`docs/ESTADO.md` existe porque números escritos à mão em 13 documentos discordavam
entre si, e o `CLAUDE.md` proíbe — *"ou o painel já mede, ou é caso de ensinar
`scripts/estado.ts` a medir"*. Com o `--check` no CI, o hash seria redundante e
apodreceria.

`ficha.md` guarda só o que máquina não deriva: **selo, data, a frase do Doug**,
simplificações declaradas, detalhes que não sobrevivem a 56 px, riscos aceitos.
