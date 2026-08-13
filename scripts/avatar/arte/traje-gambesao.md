# `traje-gambesao.png` — a arte aprovada pelo Doug em 2026-08-12, importada em 2026-08-13

> ## ⚠️ ESTE PNG NÃO É MAIS A SAÍDA CRUA DO GERADOR
>
> Em 2026-08-13 ele passou pelo **reparo do G20**: 3 151 pixels trocados por
> `scripts/avatar/arte/reparo-g20.ts`, com aprovação do Doug na folha. A saída
> original do Gemini está no git, no commit anterior ao do reparo. **O cabeçalho
> daquele script é a procedência** — se ele acusar mais de 0 px sobre este arquivo,
> o PNG no disco não é o que foi aprovado.

> ## ✅ APROVADA NA FOLHA EM 2026-08-13, e o conserto encomendado FOI FEITO
>
> As palavras do Doug, olhando `folha-traje.png` com as duas peças lado a lado:
> *"analisei a folha traje e aprovo os dois trajes! apenas arrume a parte do
> pescoço do traje azul, mas faremos isso em um novo chat."*
>
> O novo chat aconteceu no mesmo dia, e ele aprovou o reparo na folha: **"aprovado"**.
>
> **O que isso fecha:** a parada do Bloco B4 — a única aprovação que existe nesta
> rota é o olho dele na folha (doc 19 §2, passo 12). As duas peças estão no
> catálogo e são sorteáveis.
>
> **O que virou trabalho encomendado, e fechou:** a **tira de pele no decote** (os
> defeitos nº 1 e nº 2 abaixo — eram um gesto só do gerador, não dois). É o achado
> **G20** em `docs/achados.md`, hoje **FECHADO**.
>
> **O que ele NÃO pediu, e portanto fica como está:** o decote 19 px fora do
> centro, as seis canaletas em vez de cinco, e o contorno fino de 2–3 px (que é o
> G17 e não é desta peça). Ele viu a folha e aprovou; assimetria de decote não é a
> mesma classe de defeito que pele onde não há pescoço.
>
> **Os dois números que ele viu e aceitou**, e que caem fora do alvo: transbordo de
> **17,64%** contra o alvo de ~10% (a farda, do outro lado, mede 3,86%), e os dois
> vocabulários de arte destoando lado a lado — chapado-com-gradiente contra
> pintado-com-sombra-dura. **Estilo misto está aceito na tela**, que é onde o doc
> 21 §0.4 mandava decidir.

**O que é:** a 3ª rodada do gambesão, gerada no Gemini
(`Gemini_Generated_Image_ipfpn5ipfpn5ipfp.png`). **Aprovada pelo Doug** junto com a
virada de direção que tornou a paleta permissiva — a frase dele: *"esta arte foi
recusada somente pelas cores"*.

**Ela ENTROU no catálogo em 2026-08-13**, pela esteira de cores finais do Bloco B4.
Antes disso o arquivo se chamava `gambesao-aprovado.png` e ficava fora do prefixo
`traje-` de propósito, porque `trajes.ts` varre `/^traje-.+\.png$/i` e qualquer
arquivo com esse prefixo entra no literal gerado.

**Este arquivo existe porque a medição foi feita por subagente e não estava em lugar
nenhum do disco.** O original em `Downloads` já sumiu uma vez — a candidata anterior
(`hkmqo0...`) foi perdida assim.

---

## O que a importação mediu

| | |
|---|---|
| Gate −1 | **APROVADA** — deslocamento (0, 0), escala 100,00%, rodapé mensurável 94,2% |
| máscara (diff contra a base ∩ campo do traje) | **113 533 px** na importação → **113 538 px** depois do reparo do G20 |
| caixa | u x 97→401 · y 353→642 |
| fora do campo do traje | 5 957 px na importação → **4 068 px depois do reparo do G20** (feição repintada, sombra do chão, ruído) |
| salpico removido | 0 px |
| componentes soltas descartadas | 0 |
| controle negativo (a régua na própria base) | **0 px** |
| cor dominante, medida na saída | **`#13ABB3`** — teal, e é a cor final |
| colagem | **1 : 1, no pixel** (registro pelo traço, 2º lugar atrás por 23,0%) |
| visível na tela | 74,38% · total visível 99,59% (só a cabeça esconde) |
| **transbordo** | **17,64%** — acima do alvo de ~10% |
| distinção a 56 px contra o boneco sem traje | **43,90%** (piso 5%) |
| distinção a 56 px contra a farda | **43,47%** |
| composto | 17 formas / 5 540 bytes (−2 formas contra o sem-traje) |

**O G19 foi consertado antes dela entrar**, e era ele que a reprovava: o Gate −1 media
o registro numa faixa de rodapé que só excluía ciano, e o contorno preto da barra
enviesava o mínimo em 2 px. Ver `docs/achados.md`, G19.

## O que muda com a nova direção, e o que NÃO muda

**Deixou de ser problema** (morreu com a paleta permissiva):

| | medido |
|---|---|
| luz | **2 px** em 100 737 (o alvo antigo era ~8,7%) |
| histograma | **um aglomerado só** — rampa contínua de L 64 a 133, aerógrafo |
| platô do pano | p50 = 108, p99 = 133; nunca chega ao alvo L 142 |
| cor fora do ciano | **3 354 px** — tira quente (182,128,88), cordão (104,73,44), ilhoses dourados (210,174,86) |
| nº de cores | **20 090** distintas, contra 1 511 da base |

O teal `#13ABB3` **é a cor final da peça**. Nada é recolorido: ela não está em
`COR_FINAL_DECLARADA` (`traje.ts`), que hoje tem uma entrada só, a farda.

**Continua sendo problema** (é geometria e composição, não cor):

1. ~~**O traço do queixo foi cortado.**~~ ✅ **CONSERTADO em 2026-08-13.** Em y = 502
   a base tem uma corrida contínua de preto de x 363 a 696; esta arte tinha 362–432
   e 615–698 — **um vazio de 182 px**. O reparo restaurou 1 889 px copiados da
   própria base, e a corrida voltou a ser contínua (362–698).
2. ~~**Uma tira cor de pele passa por esse corte.**~~ ✅ **CONSERTADO no mesmo
   gesto** — era o mesmo defeito: o gerador desenhou um pescoço, furando o traço e
   pintando pele pelo buraco. Eram 2 006 px de RGB (182,128,88) ± 40 abaixo de
   y 505, bbox x 487–596 × y 506–647, dos quais **1 344 caíam dentro do campo do
   traje** e viravam peça. Hoje: **0**. O preenchimento saiu da interpolação do pano
   vizinho de cada linha — 1 262 px com **725 tons distintos**, contra 212 tons da
   área equivalente do pano. Cordão e ilhoses intactos.
3. **O decote está 19 px à direita do centro** — eixo da abertura em x 532, centro
   do corpo em 512–513. (Era 42 px na rodada anterior; melhorou, não zerou.)
4. **Seis canaletas, assimétricas** — costuras em x 392, 465, 535, 596, 657;
   larguras 53 / 73 / 70 / 61 / 61 / 26 px. O pedido é cinco, simétricas. Na folha
   elas leem como 6 canaletas regulares e bem separadas, e **3 a 4 ainda se
   distinguem a 56 px** — o defeito é de contagem, não de leitura.
5. **O contorno da peça é fino** — 2–3 px contra os 5 px do contorno do boneco, e a
   cabeça mantém os 5. Há degrau de peso na junção do queixo. **É o achado G17**, e
   não é desta peça: a extração entrega o miolo do traço, não o traço.

**A decisão que ficou para o Doug, e ele decidiu:** os dois primeiros foram
consertados em 2026-08-13 — mas **não pelo Gemini**, e é a novidade de método. O
retoque saiu no pixel, por programa, porque o defeito era descritível em régua:
restaurar o traço é *copiar a base de volta*, e a pele estava separada do cordão por
um vale medido no histograma (miolo do cordão em R 32–95, pele em R ≥ 144). Isso
evitou uma rodada de gerador — que traria de volta o risco de mexer no que já estava
aprovado. **Os outros três (nº 3, 4 e 5) ficam como estão**, por decisão dele.

## O que ela acerta, e é o que a aprovou

| | medido | teto |
|---|---|---|
| descida da barra | +2 px | 21 |
| lateral no alto do corpo | +7/+8 esq · +11 dir | 46 |
| lateral na cintura | +12/+14 esq · +13/+14 dir | 31 |
| lateral na altura da barra | +33/+27 esq · +30/+25 dir | *não medido* |
| largura em y 825 | 345 px (base: 282) | — |
| sombra de contato sob o queixo | banda y 512–540, 42 abaixo do platô | existe |
| ciano acima de y 505 | **0 px** | 0 |

Cordão: **3 travessões em X** completos mais uma barra horizontal no topo; **8
ilhoses**, 4 por lado, em y 540 / 576 / 608 / 640, de 12 × 15 px, anéis dourados
com miolo escuro.

## A 56 px — e a leitura mudou com a cor final

A leitura de 2026-08-12, com o ciano instrumental, dizia: *"canaletas viram textura
fraca, o decote não lê, o cordão vira mancha escura, a barra não lê; o corpo é uma
massa chapada de teal"*.

**Com a peça montada e medida na folha, a leitura é melhor do que aquela previa:**
o teal lê limpo, a silhueta é clara, **3 a 4 canaletas ainda se distinguem como
listras**, o cordão vira uma marquinha escura vertical no peito com pontinhos
alaranjados — lê como "tem algo no peito", não como cordão —, e a barra vira um fio
tênue. É a peça mais legível das duas a 56 px.

Foi o argumento mais forte a favor da paleta permissiva, e ele se confirmou.
