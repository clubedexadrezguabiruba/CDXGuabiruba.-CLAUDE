# `gambesao-aprovado.png` — a arte aprovada pelo Doug em 2026-08-12

**O que é:** a 3ª rodada do gambesão do Soldado, gerada no Gemini
(`Gemini_Generated_Image_ipfpn5ipfpn5ipfp.png`). **Aprovada pelo Doug** junto com a
virada de direção que tornou a paleta permissiva — a frase dele: *"esta arte foi
recusada somente pelas cores"*.

**Por que o nome não começa com `traje-`:** `trajes.ts:98` varre
`/^traje-.+\.png$/i` e qualquer arquivo com esse prefixo entra no literal gerado,
deixando `verify:arte` vermelho. Ela só ganha o slug definitivo quando a esteira de
cores finais existir (Bloco B4 do plano).

**Este arquivo existe porque a medição foi feita por subagente e não estava em
lugar nenhum do disco.** O original em `Downloads` já sumiu uma vez — a candidata
anterior (`hkmqo0...`) foi perdida assim.

---

## O estado contra o Gate −1 de hoje

```
Resultado: REPROVADA
  ✗ registro: deslocamento (0, 2) px e escala 100.00%
  Rodapé mensurável: 94,9%
  rosto   1 ladrilho de forma diferente de 144 · 2,11% de tinta
  corpo   0 ladrilhos de forma            · 35,28% de tinta
  NÃO EXPLICADO  2 867 px (2,6%)
```

Parte disso é o **G19** (o registro é medido na faixa de rodapé, que a barra do
traje invade). Mas **não é tudo**: o rosto acusa 1 ladrilho de forma e 2 867 px não
explicados, contra 442 px da candidata anterior. Há dano real à base, descrito
abaixo.

## O que muda com a nova direção, e o que NÃO muda

**Deixa de ser problema** (morre com a paleta permissiva):

| | medido |
|---|---|
| luz | **2 px** em 100 737 (o alvo antigo era ~8,7%) |
| histograma | **um aglomerado só** — rampa contínua de L 64 a 133, aerógrafo |
| platô do pano | p50 = 108, p99 = 133; nunca chega ao alvo L 142 |
| cor fora do ciano | **3 354 px** — tira quente (182,128,88), cordão (104,73,44), ilhoses dourados (210,174,86) |
| nº de cores | **20 090** distintas, contra 1 511 da base |

**Continua sendo problema** (é geometria e composição, não cor):

1. **O traço do queixo foi cortado.** Em y = 502 a base tem uma corrida contínua de
   preto de x 363 a 696; esta arte tem 362–430 e 617–698 — **um vazio de 186 px**.
   Divergência na cabeça: **214 px** contra 10 px da candidata anterior.
2. **Uma tira cor de pele passa por esse corte** — 1 666 px, RGB (182,128,88), bbox
   x 497–566 × y 513–649. A bbox da pele desce até y 647, **146 px abaixo do
   queixo**. Lê como pescoço, que este boneco não tem.
3. **O decote está 19 px à direita do centro** — eixo da abertura em x 532, centro
   do corpo em 512–513. (Era 42 px na rodada anterior; melhorou, não zerou.)
4. **Seis canaletas, assimétricas** — costuras em x 392, 465, 535, 596, 657;
   larguras 53 / 73 / 70 / 61 / 61 / 26 px. O pedido é cinco, simétricas.

**A decisão que fica para o Doug:** aceitar os quatro como estão, ou pedir **um**
retoque leve só de geometria (fechar o queixo, centrar o decote). Nenhum deles é de
cor, então nenhum deles é resolvido pela mudança de direção.

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

**O transbordo é o melhor das três rodadas** e está dentro de todos os tetos
medidos — que é a diretriz de 2026-08-12 (doc 19 §12, 4ª amarra).

Cordão: **3 travessões em X** completos mais uma barra horizontal no topo; **8
ilhoses**, 4 por lado, em y 540 / 576 / 608 / 640, de 12 × 15 px, anéis dourados
com miolo escuro.

## A 56 px

Canaletas viram **textura fraca** (4–5 riscos, nenhuma coluna se separa da
vizinha); o **decote não lê**; o cordão vira **mancha escura vertical** com um sinal
de dourado; a **barra não lê**. O corpo é uma massa chapada de teal.

É o argumento mais forte a favor da paleta permissiva: com cor final e contraste
próprio, essa leitura muda — e com ela a régua de distinção entre peças, que era o
problema que a lei de "mesmo pano por patente" criava.

## Onde continuar

O plano da virada está em
`~/.claude/plans/farei-algimas-mudan-as-definitivas-tingly-seahorse.md`. Esta arte é
o insumo do **bloco B4** (esteira de cores finais), e o **G19 se conserta antes**
dela entrar.
