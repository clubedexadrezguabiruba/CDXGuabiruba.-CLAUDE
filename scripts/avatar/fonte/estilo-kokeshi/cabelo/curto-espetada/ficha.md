# curto-espetada — ficha da fonte

Guarda só o que máquina não deriva. **Nenhum número de progresso, nenhum hash:**
quem mede a fonte é `avatar:importar`, quem mede a fidelidade é `avatar:fidelidade`,
e número escrito à mão em markdown apodrece — é o motivo de `docs/ESTADO.md` existir.

## Selo

| | |
|---|---|
| **estado** | **NÃO APROVADA** — a peça já é importada da fonte declarada e o literal está colado em `peca.ts`, mas ela **não foi vista em folha**. O catálogo segue intocado |
| data | 2026-08-04 |
| frase do Doug | *(pendente — o selo só existe depois da folha do checkpoint C)* |

## Os quatro arquivos

| arquivo | papel |
|---|---|
| `referencia.png` | cor, enquadramento, julgamento visual. É a régua do olho |
| `origem.svg` | saída crua do conversor Adobe. Forma bruta, tom por path. **Não é insumo do build** — existe para refazer a curadoria do zero, e para a completude estrutural ter contra o que conferir |
| `semantica.svg` | **a fonte de verdade.** Gerado por `avatar:semantizar`, um `<path>` por subpath, um `data-avatar-role` em cada |
| `peca.ts` | o literal `{t, y}` que `avatar:importar` produziu, colado à mão — massa, clara e os arcos de traço. Fica aqui e **não** no catálogo enquanto a peça não passar pela folha; quem prova que ele continua fiel é `avatar:importar -- --check`, no `verify:all` |
| `ficha.md` | este arquivo |

## Simplificações declaradas

Nenhuma ainda. O destino das ~12 pontas da arte — preservar ou simplificar — é
decisão de direção de arte com a folha na mão, e pertence ao checkpoint C. O
pipeline só garante que a simplificação, se houver, seja **declarada** aqui.

## O que a curadoria decidiu

**Tudo por proposta automática, sem correção manual.** O `avatar:semantizar`
propôs por família de cor (`classificar`, partição ótima de luminância) e por
posição contra o crânio, e o contrato aceitou sem uma falha. Um único subpath caiu
na faixa de fronteira (path#23, 42% fora), e a maioria decidiu por
`linha-mascara` — coerente com a família de cor dele.

**Os dois papéis de tom nasceram trocados, e quem os desmentiu foi o compositor.**
A primeira semantização mandou a família `corpo` (a clara, 62 452 u²) para o papel
`massa` e a `sombra` (a escura, 20 897 u²) para `tom-claro`. O arquivo era
perfeitamente legal — é a família de defeito que `fonte-peca.ts` declara não pegar.
A conta que fecha: `.kk-cabelo-s` pinta a massa com o tom **escuro** e `.kk-cabelo`
pinta a clara por cima com o **base**, e 91 719 − 62 452 = 29 267 = 20 897 + 8 370.
Ou seja, o que sobra de sombra depois da camada clara é exatamente o escuro mais o
preto da arte: a clara é a de cima. Corrigido no B3; a geometria não mudou e a
completude estrutural continua fechando 235 = 235.

**Zero `extensao`.** A hipótese inicial era que a cortina do penteado excedia a
silhueta e precisava de coordenada absoluta. Medido, ela não excede: o teal está
**100,0% dentro da cabeça da própria arte** (transbordo 0 px acima, 0 à esquerda,
0 à direita). O que parecia transbordo era o erro de registro — ver abaixo.

## Riscos aceitos

**A arte deixa 1,0 u de testa** entre a franja e a sobrancelha — 0,08 px a 56.
Abaixo de 24 u as duas encostam por antialiasing e viram uma mancha só no tamanho
do ranking. O gate não reprova: a arte é a referência, e trocá-la é direção de
arte. Fica para o olho do Doug sobre a folha.

**8,0% das colunas têm massa só na arte** (gate 2 reprova, teto 2%). São colunas
onde a arte tem cabelo e a peça reconstruída não tem nenhum. É defeito de MODELO,
não de fonte nem de registro — e é o que o laço fechado do checkpoint B existe
para resolver.

**A cabeça do gerador é mais estreita que o crânio do kokeshi na cúpula.** Medido
no B3, com as duas no mesmo referencial: y 58 → 163 contra 246; y 82 → 231 contra
331; y 106 → 301 contra 358; e as duas convergem a partir de y 200. As caixas
coincidem (é isso que o registro faz) e as curvaturas não — a anisotropia, que
compara os dois fatores de escala, é cega para isso e sai em 0,56%.

O importador reancora pela **largura da linha**, que é o que `PontoFranja` sempre
disse ser (`t` = fração da largura da cabeça *naquela altura*). Isso levou a
cobertura da coroa de 8,3% para 45,9% sem tocar na arte. O que sobra é decimação
sobre as ~12 pontas, e o destino delas é decisão de direção de arte — checkpoint C.

**A peça desce sobre a sobrancelha do produto** (folga −20,7 e −42,1 u) mesmo
deixando 1,0 u de testa na cabeça da própria arte: a sobrancelha do kokeshi está
mais alta que a do boneco do gerador. A régua **não** sobe a peça — subir foi o que
produziu a faixa de testa nua da folha HSHC93.

Os dois achados saem impressos por `avatar:importar`, num bloco separado das
reprovações. Achado não reprova: reprovar por eles faria o gate exigir do
importador uma decisão que é do Doug com a folha na mão.

**Eram três.** A contenção da clara estava em −4,58 u e saiu da lista no B4, porque
ela não era decisão de arte — era duas réguas discordando. Ver abaixo.

## O traço não é o perímetro do laço, e isso é do B4

A peça declara `linhas`: os **arcos do próprio laço da massa** que saem traçados,
em índices, não numa segunda curva. O resto do laço fica sem linha.

O motivo é medido: em **876 dos 3 028** pontos do laço a sonda pela normal não
acha preto nenhum, porque ali quem desenha a borda na arte é o contorno do boneco
do gerador — que é `descarte`. Traçar o laço inteiro poria uma barra preta
atravessando a coroa, com pele por cima, que a arte não tem.

**O que foi medido antes de escrever qualquer coisa**, e que matou a versão
original do plano: o papel `linha-mascara` é ~90% contorno externo. Tapando os
furos, 76,7% do preto está a menos de uma espessura de traço da borda da união, e
o que sobra no interior são **38 borrões redondos** (preenchimento de caixa 40–63%,
o maior com 20×18 u = 1,6 px a 56), não mechas. **Esta arte não tem divisão de
mecha**, então `linhas` como polilinha independente extraída do raster não se
pagava — e a informação de onde há traço já estava sendo calculada e jogada fora
por `medirMassa`.

## Por que a contenção da clara deixou de ser achado

Ela era **−4,58 u**, e a causa não era a arte: `conterAClara` projetava VÉRTICE e
`contencaoDaClara` mede o SEGMENTO entre eles. Medido, os **64 vértices da clara
estavam todos dentro** (o pior com 0,46 u de folga) e **uma única corda das 64** —
29 unidades — passava 4,52 u por fora no meio, onde a borda da massa é côncava. Uma
corda corta o canto que a borda faz.

Partir a corda foi tentado e reprovou medido: levou o resíduo a −2,29 e produziu
**1 auto-interseção** na clara. O que fecha é transladar a corda inteira. Hoje a
contenção é **+0,14 u**, ponto fixo alcançado em 5 passadas, e a peça não ganhou
nenhum vértice.

## O erro de registro, e por que ele mora nesta ficha

A guia `cabeca` do `semantica.svg` não é decoração: ela é o marco de registro.

Um cabelo é peça da **cabeça**, e estava sendo posicionado pelos marcos do
**tronco** (`mapa()`, escala tirada de `yBase − yPescoco`). O boneco do gerador
não tem a proporção cabeça/tronco do `geometria.ts`, e a peça herdava a diferença
inteira. Os números estão no cabeçalho de `importar-peca.ts` e de `mapaPelaCaixa`,
onde o CI os lê; aqui fica só o que não se mede: **sem a guia declarada, o erro
volta calado.** `guiaChamada` recusa importar sem ela, e diz por quê.
