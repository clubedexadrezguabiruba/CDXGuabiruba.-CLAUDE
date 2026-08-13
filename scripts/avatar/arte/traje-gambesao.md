# `traje-gambesao.png` — a arte aprovada pelo Doug em 2026-08-12, importada em 2026-08-13

> ## ✅ APROVADA NA FOLHA EM 2026-08-13, com um conserto encomendado
>
> As palavras do Doug, olhando `folha-traje.png` com as duas peças lado a lado:
> *"analisei a folha traje e aprovo os dois trajes! apenas arrume a parte do
> pescoço do traje azul, mas faremos isso em um novo chat."*
>
> **O que isso fecha:** a parada do Bloco B4 — a única aprovação que existe nesta
> rota é o olho dele na folha (doc 19 §2, passo 12). As duas peças estão no
> catálogo e são sorteáveis.
>
> **O que isso NÃO fecha, e virou trabalho encomendado:** a **tira de pele no
> decote** (o defeito nº 2 abaixo). É o achado **G20** em `docs/achados.md`, e ele
> é a única linha daquela lista que já tem "sim" do Doug — os outros esperam a hora.
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
| máscara (diff contra a base ∩ campo do traje) | **113 533 px** |
| caixa | u x 97→401 · y 353→642 |
| fora do campo do traje | 5 957 px (feição repintada, sombra do chão, ruído) |
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

1. **O traço do queixo foi cortado.** Em y = 502 a base tem uma corrida contínua de
   preto de x 363 a 696; esta arte tem 362–430 e 617–698 — **um vazio de 186 px**.
   Divergência na cabeça: **214 px** contra 10 px da candidata anterior.
2. **Uma tira cor de pele passa por esse corte** — 1 666 px, RGB (182,128,88), bbox
   x 497–566 × y 513–649. Confirmado na folha de contato: a pele aparece no decote
   laçado, **13 px de largura no pico**, e a 56 px vira um ponto pêssego isolado no
   pescoço, sem explicação. É a única pele abaixo da cabeça em toda a folha.
3. **O decote está 19 px à direita do centro** — eixo da abertura em x 532, centro
   do corpo em 512–513. (Era 42 px na rodada anterior; melhorou, não zerou.)
4. **Seis canaletas, assimétricas** — costuras em x 392, 465, 535, 596, 657;
   larguras 53 / 73 / 70 / 61 / 61 / 26 px. O pedido é cinco, simétricas. Na folha
   elas leem como 6 canaletas regulares e bem separadas, e **3 a 4 ainda se
   distinguem a 56 px** — o defeito é de contagem, não de leitura.
5. **O contorno da peça é fino** — 2–3 px contra os 5 px do contorno do boneco, e a
   cabeça mantém os 5. Há degrau de peso na junção do queixo. **É o achado G17**, e
   não é desta peça: a extração entrega o miolo do traço, não o traço.

**A decisão que fica para o Doug:** aceitar os cinco como estão, ou pedir **um**
retoque leve só de geometria (fechar o queixo, centrar o decote). Nenhum deles é de
cor, então nenhum é resolvido pela mudança de direção.

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
