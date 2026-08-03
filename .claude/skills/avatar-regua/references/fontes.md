# As fontes, e as armadilhas do caminho até elas

## Os arquivos que existem

`scripts/avatar/fonte/estilo-kokeshi/`

| arquivo | tamanho | serve para |
|---|---|---|
| `referencia-linha-de-centro.svg` | `viewBox 0 0 1024 1024`, **6 paths**, todos `fill="#000000" stroke="none"` | **medir FORMA** |
| `referencia-base.png` | **2038×2038**, 3 canais, sem alpha | **medir COR e TOM** |
| `referencia-sombra.png` | 1254×1254 | **só 3 marcos de sombra** — dívida declarada |
| `referencia-folha.png` | 1254×1254 | **órfão** — zero referências em código ou doc |

Os 6 paths do line-art, na ordem: `0` contorno, `1`/`2` olhos, `3`/`4`
sobrancelhas, `5` boca.

**Enquadramento medido da `referencia-base.png`:** `tintaY0 = 244`, `tintaY1 = 1692`
(altura útil **1449 px**), `eixoTronco = 994,5`. Os quatro estão em `folha-base.ts`
como a constante `REF`, e **rodar o enquadramento de novo ao trocar a arte é
obrigatório**: os números da arte anterior eram 1254 / 149 / 1044 / 611,5, e não
trocá-los desalinha a comparação inteira em ~30%.

⚠️ Não confunda com `scripts/avatar/fonte/referencia-base.png` (2556×3840, com
alpha) — essa é do pipeline de uniformes, que é outro assunto.

## Por que existem duas referências, e isso incomoda

A arte nova foi exportada **sem fundo**, e a sombra do chão era pintada no fundo:
sumiu junto (69 px de ruído contra 7 940 px de sombra). A anterior ficou como
`referencia-sombra.png`, lida **só pelos três marcos de sombra**. O gate avisa toda
vez que roda. Uma reexportação com fundo quita a dívida; o Doug decidiu não
reexportar.

## Como rasterizar — e por que cada parâmetro

Use `rasterizarSvg()` e `carregarPng()` de `scripts/avatar/estilo/raster.ts`. **Não
recopie os parâmetros**; eles estavam duplicados em três scripts, e trocar a altura
em um só faria duas medidas concordarem por acidente.

- **`density: 300`** — sem ele o `sharp` rasteriza o SVG a 72 dpi e o `resize` sobe
  de um raster pequeno. A borda vira rampa, e a rampa entra na conta da espessura.
- **`height: 2048`** — dá 0,29 u/px, então o erro de discretização da espessura fica
  em ±0,3 u: uma ordem de grandeza abaixo da diferença que se quer resolver (12
  contra 13). É isso que torna a medição conclusiva em vez de sugestiva.
- **`flatten({ background: "#FFFFFF" })` ANTES de `removeAlpha()`** — a ordem
  importa. `removeAlpha` sozinho descarta o canal e deixa o RGB de baixo, que num SVG
  transparente é **preto**: a imagem inteira viraria contorno para o limiar.
- **`raw()`** — pixel cru. O limiar de luminância é comparação exata e não sobrevive
  a recompressão.

## As cinco armadilhas do caminho da arte

Do `docs/avatar/16-uniformes-runbook.md` §2.2, que continua vivo apesar do banner de
"pipeline morto" no topo daquele arquivo.

1. **O "SVG" que o Canva exporta não é vetor.** É um PNG em base64 dentro de um
   `<svg>`, com a transparência num **segundo** PNG cuja luminância vira o alfa.
   Extrair só o de cor entrega fundo preto, e o traçador desenha esse preto como
   forma. **Exporte PNG do Canva, não SVG.**
2. **Confira a transparência antes de vetorizar.** Uma rodada veio com fundo branco
   opaco e outra com um glow: **10,6% do quadro em meio-tom de alfa**, contra 1,5% na
   arte que funcionou. O glow virou ~60 formas cinzentas no traço, e cinza cai na
   família da tinta do olho.
3. **O gerador redesenha em vez de editar.** Aconteceu duas vezes seguidas. Se voltar
   rosto diferente, contorno novo ou proporção nova, é isso — e **não se corrige com
   prompt melhor**. Regere.
4. **Sem textura de tecido.** Uma trama quase invisível no PNG o traçador transforma
   em regiões esfarrapadas do tamanho do tronco.
5. **O conversor da Adobe devolve DOIS SVG, e só um é fonte de medida.**

## A conferência rápida de um SVG que chegou

| saída | o que é | serve para |
|---|---|---|
| **line-art** | traço virado região preenchida, poucos paths, `fill="#000000"` | **forma — sim** |
| **colorido** | auto-trace de tudo, centenas de paths e de cores | **nada** |

Números das duas rodadas do kokeshi: o line-art veio com **3 paths** na arte anterior
e **6** na definitiva. O colorido veio com **640 paths e 558 tons** na primeira e
**563 paths e 532 tons** na segunda — numa ilustração de oito tons chapados.

**Por que o colorido não serve nem para cor.** Um trace é um redesenho: ajusta curvas
aos pixels **e quantiza a cor**. Os 532 tons são invenção do traçador, assados em
`fill=` literais que não recolorem — e o `conferirSvg` **aprova mesmo assim**, porque
ele confere as custom properties declaradas, não a ausência de cor assada.

**Por que o line-art serve, apesar de ser redesenho.** Porque isso é verificável, e é
verificado: `npm run avatar:linha-de-centro` mede a mesma coisa nas duas fontes e
imprime a discordância. Na arte definitiva ela dá **0,4** na meia-largura da cabeça e
**0,1** na do tronco. Se a conferência abrir, o trace não serve — e é melhor saber
disso antes de a tabela dele virar a silhueta de 14 trajes.

## O que pedir ao Doug quando a arte precisar ser refeita

Duas exportações do mesmo desenho:

1. **PNG de cor**, sem alpha, **COM fundo** — senão a sombra do chão some.
2. **SVG line-art** do conversor da Adobe — traço como região preenchida, `fill`
   preto, `stroke` nenhum. Não o colorido.

E a pose, com estas palavras: **"quase frontal, com giro mínimo para a direita da
imagem"**. Nem "3/4", nem "frontal simétrica" — as duas formulações já foram usadas e
as duas estavam erradas, em direções opostas.

## Um risco de infraestrutura, declarado

**O `sharp` não está em `package.json`.** Ele funciona por ser dependência transitiva
do Next. Todo script de medição quebra se o Next parar de trazê-lo, e o sintoma vai
ser um `MODULE_NOT_FOUND` a quilômetros da causa.
