# As amarras, por tipo de peça

Cada uma tem **um número** e **um teste**. Liste as que se aplicam antes de propor
qualquer direção: elas cortam o espaço de desenho, e propor fora delas é perder a
rodada.

Onde a amarra é computável, `npm run avatar:variantes` a mede sozinho. Onde não é,
está dito — e o script avisa em voz alta em vez de ficar verde por vacuidade.

---

## Toda peça, sem exceção

| amarra | número | quem mede |
|---|---|---|
| orçamento composto | **26 formas · 10 240 bytes** | `avatar:variantes`, `avatar:folha-base` |
| a base careca não muda | **19 formas · 7 418 bytes**, exatos | `avatar:folha-base` |
| contrato de custom properties | 0 problemas | `conferirSvg` |
| distinção contra as irmãs do slot, a 56 px | **≥ 5%** dos pixels de 40×56 | `avatar:folha-base` |
| a peça não declara silhueta do corpo | não compila se tentar | `typecheck` |

**O teto da base é de REGRESSÃO, comparado com `!==`.** Ela não pode crescer *nem
encolher* — crescer significa alguém ter achado espaço na base para pagar uma camada
que não é dela.

**O composto é base + UM item**, medido, nunca somado: nunca há dois cabelos num
render, então somar os cinco orçaria uma composição que não existe.

**Os 5% saem de pixel, não do par mais parecido que existe**: 5% de 2 240 são 112 px,
um bloco de ~10 × 11 na miniatura. Calibrar o piso pelo desenho que ele julga é
justificativa circular — quando `curto × trança` mediu 3,66%, a resposta certa foi
engrossar a trança, não baixar o piso.

---

## Cabelo

| amarra | número | onde |
|---|---|---|
| folga sobre **cada** sobrancelha | **≥ 24 unidades** | `FOLGA_ROSTO`, `folgaDoRosto()` |
| ancoragem de cada extensão dentro da cabeça | **≥ 10** (`SANGRIA`) | `ancoragemDasExtensoes()` |
| pontas da franja fora da silhueta | `t` fora de [0, 1] | `avatar:variantes` |
| degrau de sombra sob a franja | 22 unidades (`DEGRAU`) | `pathCabeloClaro()` |

**A folga é medida nos DOIS lados, e os dois números diferem.** O `GIRO` deixa a
sobrancelha direita 3 unidades mais alta, então sobra menos testa daquele lado: a
primeira tabela do `curto` deu **25,5 à esquerda e 8,3 à direita**, e três dos cinco
modelos reprovaram na primeira medição. Um cabelo simétrico em `t` sai assimétrico em
folga.

**As 24 unidades saem da escala de leitura:** são 1,9 px de pele entre duas peças
pretas a 56 px. Menos de um pixel e elas encostam por antialiasing — e a sobrancelha
inteira tem 0,66 px de espessura ali.

**A ancoragem impede o coque flutuante.** Extensão tangente ao crânio lê como adesivo
colado ao lado, e meio pixel de antialiasing abre uma fresta de fundo entre as duas
peças. É o análogo, um slot acima, do gate (d) que o `tipos.ts` promete aos trajes.

**As extensões guardam PONTOS, não `d: string`.** Foi a troca que permitiu ao gate
enxergar a peça — guardando path emitido, a régua de folga ficava cega justamente
para o moicano, que é só extensão.

---

## Traje

| amarra | número | quem mede |
|---|---|---|
| matiz longe da pele | **fora de 18–28°** | ninguém — é olho |
| a cor é definitiva | a da tabela de patentes | `verify:paleta-patentes` |
| folgado, nunca justo | alguns por cento maior | ninguém |
| sem textura de tecido | — | ninguém |
| sobreposição das extensões | ≥ 10 (`SANGRIA`) | **ninguém, e isto é dívida** |

**A dívida é real e está declarada.** `Traje.extensoes` ainda guarda `d: string`, e
path emitido não se mede. A amarra que o `tipos.ts:65` promete ao Bloco 2 é, hoje,
olho e não gate. A correção é a mesma que `Cabelo.extensoes` já recebeu: guardar
pontos. O `avatar:variantes` imprime esse aviso toda vez que uma variante de traje
aparece, para ninguém confundir silêncio com aprovação.

**Por que nada que não seja pele pode morar em 18–28°:** o pipeline separa pele de
pano por matiz, e é a pele que troca de cor. Uma bota marrom não seria "pano de cor
fixa" — seria **entendida como pele** e mudaria de cor junto com o aluno. Na rodada em
que o macacão saiu creme-pêssego, pele e pano ficaram ambos em ~30° e o tronco saiu
salpicado de manchas cor de pele.

**Por que a cor é definitiva:** pela emenda à D27 só pele e cabelo recolorem. A cor do
uniforme **é** o sinal da patente, e duas peças da mesma patente precisam sair na
mesma cor entre pedidos diferentes, porque nada as harmoniza depois.

---

## Animação, quando a peça tiver

| amarra | número | quem mede |
|---|---|---|
| o olho nasce ABERTO | ≥ 95% da altura aberta | `avatar:animacao` |
| pisca | mínimo ≤ 30% | `avatar:animacao` |
| respira | amplitude > 2 px | `avatar:animacao` |
| `prefers-reduced-motion` para tudo | zero animação ativa | `avatar:animacao` |

**Estado inicial explícito em tudo que a animação esconde.** Pálpebra com `opacity: 0`
dentro do `@keyframes` apaga os olhos quando a animação não roda — e ela não roda na
folha de contato, no gate, e para quem pediu movimento reduzido.

---

## Composição

| amarra | quem mede |
|---|---|
| `id` único com 30 instâncias no mesmo documento | `avatar:pose` |
| nenhum comentário dentro do `<style>` | `conferirSvg` |
| toda custom property lida está congelada em `PROPRIEDADES` | `conferirSvg` |

**O `conferirSvg` é cego de um lado:** ele reprova propriedade **a mais**, nunca **a
menos**. Foi assim que `--av-cabelo` ficou congelada na paleta desde o Bloco 1 e nunca
foi emitida. Se a sua peça declara que lê uma variável, confira você que ela sai.

**A colisão de `id` resolve para o primeiro em silêncio.** Com geometrias idênticas
nada muda na tela, e por isso ela sobreviveu a um bloco inteiro. `ns` é obrigatório no
tipo por causa disso, e mesmo assim nada impede passar a mesma string duas vezes — daí
o gate medir no DOM.
