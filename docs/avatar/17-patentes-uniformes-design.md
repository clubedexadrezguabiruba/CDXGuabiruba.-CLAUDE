# Os uniformes das patentes — o design

> ## ⚠️ Emenda de 2026-08-20 — leia antes do resto
>
> **A palavra "patente" virou "título"** e os seis degraus foram renomeados
> (Bíblia v2 §6): Soldado→**Aprendiz**, Aspirante→**Estudante**,
> Capitão→**Analista**, Comandante→**Estrategista**, General→**Mestre**,
> Mestre→**Grão-Mestre**. Os slugs e os nomes de arquivo **não** mudaram.
>
> **A §4 (uniforme por patente) é histórico.** A cor deixou de vestir o boneco em
> 2026-08-13 e virou **moldura** em volta do avatar; o traje é peça de catálogo
> com cor final livre (doc 21 §0, doc 22).
>
> **A §6 (as 5 regiões: Acampamento dos Recrutas, Vila dos Soldados, Fortaleza
> dos Estrategistas, Cidade dos Generais, Cidadela dos Mestres) morreu.** No lugar
> dela está o **mapa da Academia** (Bíblia v2 §5), e lugar não ordena progresso.
> O campo `regiao` de `patentes.ts`, que espelhava essas regiões, **foi removido**.
>
> **O que continua valendo:** a paleta medida, os dois pisos de distância
> (≥40 / ≥60) e a faixa proibida de matiz 0°–44° **para o pipeline de SVG** — ela
> nunca valeu para a moldura em CSS.

> **Para gerar a arte, vá direto ao [doc 18](18-uniformes-blocos.md).** Este aqui
> é o documento de leitura: de onde cada cor veio, e por que ela não pode ser
> trocada por gosto.
>
> Companheiros: o [runbook](16-uniformes-runbook.md) tem o processo de ponta a
> ponta; o [doc 15](15-plano-ate-pronto.md) tem o plano e as regras de arte.
> A tabela de cor que vale é `scripts/avatar/patentes.ts` — este doc a espelha,
> e `npm run verify:paleta-patentes` mede o arquivo, não o texto.

---

# 1. A escada, e por que são 6 uniformes

| tier | patente | aulas | região da Bíblia Tonal | uniforme |
|---|---|---|---|---|
| 0 | Aprendiz | 0 | Acampamento dos Recrutas | nenhum — veste o macacão de treino da base |
| 1 | Soldado | 15 | Vila dos Soldados | ✅ pronto |
| 2 | Aspirante | 30 | Fortaleza dos Estrategistas | ✅ pronto |
| 3 | Capitão | 45 | Fortaleza → transição para a Cidade | a gerar |
| 4 | Comandante | 60 | Cidade dos Generais | a gerar |
| 5 | General | 75 | Cidade dos Generais → Cidadela | a gerar |
| 6 | **Mestre** | 90 | Cidadela dos Mestres | a gerar |

**Duas divergências deliberadas** com o que os docs 12 (D9) e 14 registram:

1. **O tier 7 sai.** Ele era "Lenda", e era extensão nossa: o método holandês, que
   nomeia os níveis, vai até o Passo 6 — está escrito no comentário da migration
   `20260729140000`. A Bíblia Tonal §7 também termina em Mestre. Um degrau a mais
   que nenhuma das duas réguas prevê é um uniforme a mais para desenhar, sem
   ninguém para vesti-lo.
2. **O tier 6 passa de "Grão-Mestre" para "Mestre"**, o nome da Bíblia, que casa
   com a região — a Cidadela dos Mestres.

**O tier 0 continua Aprendiz**, e isso *não* é descuido: a Bíblia §7 chama a
primeira faixa de "Recruta", mas `recruta` já é o nome de uma **trilha de aulas**
no banco (`lessons.trail`). Duas coisas diferentes com o mesmo nome já custaram
caro aqui uma vez — foi essa confusão que batizou de `recruta.svg` a peça que o
**Soldado** veste. O arquivo passou a se chamar `soldado.svg`.

> Nada disto está no banco ainda. A renomeação de `title_tiers` (tier 6 e a
> remoção do tier 7) é um bloco à parte, com migration e gate próprios.

---

# 2. A lei das cores — o que o pipeline aceita

Esta seção é a razão de a paleta não ser escolha de gosto. Tudo aqui é
consequência de uma linha em `scripts/avatar/uniforme.ts`:

```ts
export function ehPano(p: Forma, pescoco: number): boolean {
  ...
  if (h >= MATIZ_PANO) return true;   // MATIZ_PANO = 45
  return false;
}
```

É **um corte só**, e não uma banda em volta da pele. Daí tudo o mais:

### A faixa proibida é 0°–44°

Marrom, caramelo, couro, creme, terracota — e o **dourado `#C9B37E`, que reprova
por 3°** (42,4°). Uma cor nessa faixa não é entendida como pano.

### Forma reprovada não muda de cor: ela SOME

Este é o ponto que mais surpreende. O asset é montado só com o que passou no
corte, então uma peça reprovada não sai feia — **ela não sai**. Um cinto fora da
lei deixa no lugar dele o fundo de segurança chapado.

### Cinza e branco NEUTROS somem também

Com `R = G = B` o delta entre canais é zero, e o matiz sai **0°** — abaixo do
corte. **Um galão branco ou um cinto cinza desaparece.** Todo tom claro precisa
ser *tingido*: `#AFC0D2` (211°) passa, `#F0F0F0` não.

É por isso que a tabela tem um piso de amplitude de canal (`MIN_DELTA_CANAL = 20`)
além do teste de matiz. Matiz sozinho não pega o cinza que *quase* é neutro.

### Vermelho fica fora de propósito

Um bordô vive perto de 350° e passaria. Mas o traçador quebra um pano chapado em
vários tons quase iguais — o oliva do Soldado sai em cinco —, e qualquer um que
derive para 10° cai abaixo do corte e vira buraco no meio da peça. O risco não
compensa: a paleta não usa vermelho.

### O que mora em 17°–29° é PELE

E pele é a única coisa que recolore, nos 8 tons do aluno. Uma bota marrom não
seria "cor errada": seria **entendida como pele** e mudaria de cor junto com o
aluno. Já aconteceu — numa rodada em que o macacão saiu creme-pêssego, o tronco
saiu salpicado de manchas cor de pele.

### E a restrição que não é do pipeline, é do olho

**A 56 px o uniforme é só massa de cor.** Gola, cinto e galão somem nesse tamanho,
e 56 px é o tamanho do ranking — onde o aluno vê 30 bonecos ao mesmo tempo. Então
a separação entre patentes tem de estar na **cor**, e a ornamentação existe para a
ficha de perfil.

---

# 3. A paleta

| tier | patente | pano | matiz | lum | bota | detalhe claro |
|---|---|---|---|---|---|---|
| 1 | Soldado | `#78833B` oliva | 69° | 0,47 | `#2d3012` | — *(não tem)* |
| 2 | Aspirante | `#384966` ardósia | 218° | 0,28 | `#1e2b44` | `#859DAB` |
| 3 | Capitão | `#3E8C81` petróleo | 172° | 0,45 | `#1C4A45` | `#B4D2C9` |
| 4 | Comandante | `#3A55B5` azul-real | 227° | 0,34 | `#1D2A63` | `#C6D2E2` |
| 5 | General | `#7A3168` ameixa | 315° | 0,30 | `#421539` | `#D9BCD1` |
| 6 | Mestre | `#AEBCCE` pedra clara | 214° | 0,73 | `#4B5A70` | `#B5AE4A` latão |

## 3.1 Alvo e medido — a coluna que o texto não mostra

Cada linha carrega um estado, e a diferença importa:

- **`medido`** — o valor é o que `corDominante` leu do SVG commitado. Soldado e
  Aspirante estão aqui, e o gate confere: distância **0,0** nos quatro valores.
- **`alvo`** — intenção de design, ainda sem arte. **Nenhum gerador de imagem
  honra um hex**; o valor exato é acertado no Canva, e depois volta para a tabela
  como `medido`.

O detalhe claro é sempre autoria — instrução para quem desenha, não medição. Com
uma exceção que vale registrar: o `#859DAB` do Aspirante **foi medido**, e é
exatamente a listra da calça que, sozinha, virou o fundo de segurança da peça
inteira antes da correção do §7.0 do runbook.

E o Soldado **não tem detalhe claro nenhum** — medido: os cinco tons do arquivo
dele são o mesmo oliva. O primeiro galão nasce no Capitão, o que casa com a
progressão de ornamento do §5.

## 3.2 Os números, e os pisos que eles precisam bater

| medida | piso | valor | folga |
|---|---|---|---|
| menor matiz das 17 cores | ≥ 45° | **56,1°** *(latão do Mestre)* | +11,1° |
| menor delta de canal | ≥ 20 | **28** *(detalhe do Comandante)* | +8 |
| pior par de panos | ≥ 40 | **70,3** | +30,3 |
| pior par **vizinho** | ≥ 60 | **72,5** *(Aspirante × Capitão)* | +12,5 |
| menor distância pano ↔ bota | ≥ 40 | **52** | +12 |
| menor distância pano ↔ contorno `#000000` | ≥ 40 | **102** | +62 |

**De onde vêm os dois pisos de distância.** O **40** é o mesmo `MIN_CONTORNO` que
a paleta já usa para "contorno e preenchimento não se fundem" — abaixo disso duas
massas de cor viram a mesma coisa a 56 px. O **60** vale só entre patentes
vizinhas, porque a promoção é comparada com o que veio logo antes: quem sobe de
Aspirante para Capitão precisa *ver* que subiu. Entre patentes distantes a
confusão custa pouco — o aluno nunca tem as duas no próprio boneco.

---

# 4. De onde cada cor veio — a Bíblia Tonal

A §14 da Bíblia descreve a curva: *início humano e acolhedor → meio firme e
técnico → fim nobre, silencioso e memorável*. A paleta a percorre em **dois eixos
ao mesmo tempo** — matiz e luminosidade —, e é essa dupla variação que mantém as
seis distinguíveis quando só a massa de cor sobrevive.

**Soldado — oliva `#78833B`, Vila dos Soldados.**
"Quartéis, campo de treino, oficinas." Cor de trabalho: terrosa sem ser marrom,
média sem ser chamativa. É o uniforme de quem está na rotina.

**Aspirante — ardósia `#384966`, Fortaleza dos Estrategistas.**
"Muralhas, salão de análise, biblioteca de guerra." O primeiro salto de seriedade,
e ele é feito por **temperatura e valor** ao mesmo tempo: sai do verde quente para
o azul frio, e escurece de 0,47 para 0,28. A 56 px isso lê como "ficou sério".

**Capitão — verde-petróleo `#3E8C81`, a transição.**
A Bíblia põe o Capitão entre a Fortaleza e a Cidade, e a cor faz literalmente essa
ponte: um verde-azulado que guarda o verde do campo do Soldado e já pertence à
família fria do Aspirante. É a única cor da roda que ocupa esse lugar — e ela volta
a clarear (0,45), porque o Capitão é *ascensão*, não aprofundamento.

**Comandante — azul-real `#3A55B5`, Cidade dos Generais.**
"Estandartes elaborados, guardas de elite." É o azul **mais saturado da escada**
(amplitude de canal 123, contra 46 do Aspirante) — o primeiro uniforme que não é
discreto. A mesma família do Aspirante, levada ao volume máximo: a diferença entre
estudar na Fortaleza e comandar na Cidade.

**General — ameixa `#7A3168`, Cidade → Cidadela.**
"Grandeza, autoridade, domínio." Púrpura é a cor histórica de comando, e aqui ela
resolve um problema técnico junto: dá autoridade **sem passar pelo vermelho**, que
o pipeline não aguenta (§2).

**Mestre — pedra clara `#AEBCCE` com latão `#B5AE4A`, Cidadela dos Mestres.**
"Pedra e ouro. Observatórios, geometria refinada, luz controlada." Duas decisões
aqui, e as duas saem direto da Bíblia:

- **É a única peça clara da escada inteira** (lum 0,73 contra 0,28–0,47 de todas as
  outras). A chegada é marcada por **inverter o valor**, não por escurecer mais.
- **É a menos ornamentada.** A §14 pede "nobre, minimalista, econômico" no fim, e a
  §12 fala em "geometria refinada" e "luz controlada". Então o topo da escada tira
  ornamento em vez de acrescentar: corte reto, sem bolso, sem faixa, e um debrum
  fino em três lugares.

## 4.1 O ouro, e o preço dele

A Bíblia pede "pedra e **ouro**" para a Cidadela. O ouro clássico `#C9B37E` está
em **42,4°** e reprova por 3° — ele sumiria da peça.

O latão `#B5AE4A` está em **56,1°** e passa. É um dourado mais esverdeado, puxando
para o oliva, e é o mais próximo do ouro que esta arquitetura permite. Vale
registrar como custo consciente: **a lei do matiz cobra o ouro**, e o que se paga
é um pouco de calor.

E o ouro é **exclusivo do Mestre**. Comandante e General, que também são postos de
prestígio, levam prata azulada. Guardar o metal quente para o último degrau é o
que faz ele significar chegada.

---

# 5. A progressão de silhueta — "gibão com reforço"

## 5.0 O erro que produziu esta seção

A primeira rodada do Capitão saiu **macacão de mecânico**: bolso com aba no peito,
cinto de fivela retangular, duas faixas claras no antebraço lendo como fita
refletiva.

A causa não foi o gerador. **Foi o pedido**, que dizia literalmente "gola, cinto e
um bolso no peito" e "duas faixas claras no antebraço" — a descrição de um uniforme
de trabalho. Aquele vocabulário veio do bloco genérico do runbook §2, escrito para
a peça do Soldado, e nunca passou pela Bíblia Tonal.

A Bíblia pede **"fantasia medieval elegante"** (§12) e manda evitar "guerra
realista". A lição vale além desta peça: **o runbook garante que a arte ENTRE no
pipeline; ele não garante que ela pertença ao mundo.** São duas conferências
diferentes, e só uma delas tem gate.

## 5.1 O arco

O metal entra devagar e **sai no fim**:

| patente | o que a peça é | o galão |
|---|---|---|
| Capitão | **gibão** de pano, gola alta, cordão cruzado em V. Só as braçadeiras são de aço | 2 chevrons no peito |
| Comandante | o mesmo, mais **ombreiras rentes** e banda heráldica na diagonal | 3 chevrons |
| General | **peitoral parcial** de aço tingido sobre o gibão, gola alta rígida, faixa muito larga | galão sobre o peitoral |
| Mestre | **volta ao pano puro.** Sem metal, sem chevron, sem cordão. Corte reto, debrum fino de latão | nenhum — a ausência é o sinal |

O ornamento **cresce do Capitão ao General e cai no Mestre**. Não é
inconsistência: é a curva da §14. Acumular enfeite até o fim daria um uniforme
carregado onde a Bíblia pede silêncio, e o Mestre já era, pela cor, o único claro.

**O galão saiu do antebraço e foi para o peito.** Chevron no peito é vocabulário
heráldico, e o peito tem muito mais pixels que o antebraço a 56 px. As faixas no
antebraço eram justamente o que mais fazia a peça ler como fita refletiva.

Vale para a ficha de perfil, a 340 px. **A 56 px nada disto lê** — lá é só cor.

## 5.2 A geometria decide o que é possível, e é apertado

Medido em `scripts/avatar/mascara-base.ts`:

| constante | valor | o que governa |
|---|---|---|
| `BASE_W × BASE_H` | 2556 × 3840 | o canvas |
| **`FOLGA`** | **40** | quanto a roupa pode passar da silhueta do macacão |
| `BOTA_ACIMA` / `BOTA_FOLGA` | 240 / 240 | quanto a bota sobe e alarga |
| `yGola` | `(Y_PESCOCO + topoTraje) / 2` | até onde a gola pode subir |

`cobertura` é o macacão da base dilatado por `FOLGA`, e é o **teto** do que o asset
pode ocupar. **40 unidades são ~1,2% da altura da figura.** Daí:

- ❌ **túnica solta, sobreveste, tabardo, saiote, manto e capa** — todos passariam
  muito disso e seriam **recortados**. O gate "alfa fora da cobertura ≤ 0,5%"
  reprovaria a peça.
- ❌ **ombreira que passa da linha do ombro** — mesmo motivo. Por isso os blocos
  dizem "rentes ao ombro".
- ✅ **gola alta** — `yGola` dá a folga, até a metade do pescoço.
- ✅ **bota alta de cano dobrado e alargada** — 240 unidades são ~7% da altura, a
  folga mais generosa que existe no sistema, e um sinal medieval forte de graça.

> **A silhueta continua sendo um macacão.** O medieval vem da **construção dentro
> dela** — painéis de costura, gola, cordão, faixa, braçadeira, cano de bota —,
> nunca de uma peça de roupa com outro contorno.

Isto virou uma linha explícita em cada bloco do doc 18, porque é a regra que o
gerador mais quer desobedecer.

**Se um dia a túnica com saiote for mesmo necessária**, não é questão de prompt: é
subir `FOLGA` e refazer o gate de cobertura junto — e aí o fundo de segurança, que
sai de `corpoVestido` **sem** a folga, passa a deixar vão transparente sob a saia.

## 5.3 A capa continua fora, e o metal medieval também é problema

A capa (doc 15, 7b.2) cai na primeira linha proibida do §5.2: é slot `back`, com
arte e pipeline próprios.

E o vocabulário metálico da fantasia medieval — **latão, ouro, couro marrom** —
é exatamente a faixa de matiz 0°–44° que o §2 descarta. Todo metal destas quatro
peças é **aço tingido na cor da família da patente**: aço esverdeado no Capitão,
azulado no Comandante, arroxeado no General. É o mesmo custo já pago no latão do
Mestre, e vale registrar como decisão consciente, não como descuido.

---

# 6. Como isto deixa de ser texto

O runbook §10.2 já pedia que a cor de cada peça fosse registrada antes da próxima.
Em texto. **Texto não reprova nada** — e a regra do §10.1 do próprio runbook é
"escreva o gate antes da correção, e confira que ele reprova".

```
scripts/avatar/patentes.ts                        a régua, como dado
scripts/verify/phase8/verify-paleta-patentes.ts   o gate
npm run verify:paleta-patentes                    (encadeado em verify:phase8)
```

O gate roda **offline** — nenhuma consulta ao banco —, então entra no CI junto dos
outros. Ele mede nove coisas; três merecem nota:

- **a tabela contra a arte real**: para toda linha `medido`, `corDominante` e
  `corBota` do SVG têm de bater com o registro. É isto que impede a tabela de
  virar opinião.
- **linha `alvo` não pode ter SVG no disco**. Pega o esquecimento de registrar a
  cor medida depois de gerar a peça.
- **a referência da base tem de existir**. Sem ela, nenhum bloco do doc 18
  funciona: o gerador desenha outro personagem em vez de editar o nosso.

**Provado que reprova**, com a linha do Capitão adulterada de dois jeitos:

| adulteração | o que o gate disse |
|---|---|
| `#C9B37E` (o dourado) | `matiz 42.4° (mínimo 45°)` — 1 violação, exit 1 |
| `#B0B0B0` (cinza neutro) | `matiz 0.0°`, `delta 0`, **e** `Capitão × Mestre distância 32.4` — 3 violações, exit 1 |

A terceira violação do cinza neutro não estava prevista e é a mais interessante: um
cinza claro colide com a pedra do Mestre. O gate pegou por um caminho que eu não
tinha desenhado para ele.
