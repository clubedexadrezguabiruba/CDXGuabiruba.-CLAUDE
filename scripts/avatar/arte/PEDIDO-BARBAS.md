# As barbas — o elenco e os pedidos

> ⚠️ **REESCRITO EM 2026-08-21, e o motivo é que o pedido antigo produzia peça que a
> esteira REPROVA.**
>
> Ele exigia *"três tons chapados de ciano… sem gradiente, sem textura, sem fios, sem
> mechas, sem textura de pelo"*. A esteira nova extrai o **tom** da luminância da arte
> e reprova peça chapada por construção (`hi <= lo`) — então o pedido antigo
> **empobrecia o tom na origem**: era pedir exatamente a peça de dois tons que a
> esteira existe para não produzir.
>
> A trancaça, que é hoje a peça-padrão da linha de arte, **veio castanha, é feita de
> fios e tem 917 tons** — ela desobedece cada linha do pedido antigo e é a melhor
> peça que esta rota já produziu.
>
> **E o ciano saiu do pedido.** Ele continua sendo a língua interna da esteira (o
> Gate −1 e o `extrair.ts` colhem por ele, `arte:cor-proibida` protege a janela de
> ±30°), mas **quem o produz é o programa** — `restaurar-peca.ts` leva o matiz para
> 180° preservando saturação e luminância. Pedir cor instrumental ao gerador para
> repintar depois é uma das quatro coisas que a Regra Inviolável nº 4 do `CLAUDE.md`
> proíbe por nome, e o ciano do gerador morreu em 2026-08-13.

O elenco vive em [doc 22 §5-B.1](../../../docs/avatar/22-catalogo-de-pecas.md) — **8
barbas**, e a lei de arte que julga cada uma está em
[doc 23](../../../docs/avatar/23-linha-de-arte.md). Este arquivo é só o **molde do
pedido**.

| raridade | slug | estado |
|---|---|---|
| `legendary` | `rosto-barba-trancada` | ✅ **promovida** em 2026-08-21 — a peça-padrão da linha de arte |
| as outras 7 | ver doc 22 §5-B.1 | a fazer, **uma por vez, quando o Doug chamar pelo nome** |

⚠️ **O elenco de 6 barbas de 2026-08-18 foi cortado para 1 em 2026-08-21**, e as
artes da `cheia`, do `cavanhaque` e do `bigode` foram apagadas. O registro rodada a
rodada de como elas chegaram, e o de como a trancaça foi promovida, está em
[ESTADO-DA-ROTA.md](ESTADO-DA-ROTA.md).

---

## O fluxo, em três imagens

Eram duas até 2026-08-21. A terceira entrou porque o nível de acabamento não estava
sendo pedido a ninguém — e **os papéis passam a ser nomeados**, porque este gerador é
literal e uma imagem sem papel declarado vira contradição com a anterior:

| imagem | papel | o que se diz dela |
|---|---|---|
| **1ª** | **a base** | `BASE-OFICIAL.png` — o avatar base, careca e sem barba. **Não muda um pixel.** É o único boneco que o Gate −1 aceita |
| **2ª** | **a forma** | o boneco com a barba que se quer, feito antes no ChatGPT. **Só a silhueta**: ignore o personagem, o estilo e o fundo dela |
| **3ª** | **o acabamento** | `barba-trancada.png` — **só o NÍVEL de acabamento**: os fios, a serrilha da borda, a variação de luz, a espessura da linha interna |

⚠️ **A 3ª define o NÍVEL, não a TEXTURA.** O nível atravessa slots; a textura não. A
trancaça é uma barba, e citá-la como textura para um chapéu de feltro arrastaria pelo
para onde não cabe. Ver [doc 23 §9](../../../docs/avatar/23-linha-de-arte.md).

⚠️ **Desde 2026-08-22 a 3ª imagem é OPCIONAL para cabelo e barba.** O acabamento da
trancaça foi medido e escrito em palavras — estrutura tonal, sombra, traço, unidade e
borda — em [doc 24 §5](../../../docs/avatar/24-cabelo-e-barba-ficha-do-slot.md), com
o bloco pronto para colar na §5.6. Anexá-la continua valendo e é mais forte quando a
peça nova for da mesma textura; **para as outras, o texto evita a contradição** que a
§9 do doc 23 alerta.

⚠️ **E ela não pode contradizer a 2ª.** A 2ª imagem já diz *"ignore o estilo dela"*;
por isso a 3ª entra com o papel escrito — **acabamento**, não forma e não personagem.
O registro da rota mostra por que isto importa: *"na dúvida, passe menos"* produziu
transbordo **zero**, porque gerador em dúvida passa zero.

O Gemini **transplanta**: fica com o boneco da 1ª, a forma da 2ª e o acabamento da
3ª. É o gesto que funcionou na `cheia` e na `trancada`, e a única coisa que as
rodadas provaram que ele faz bem.

**Por que a imagem manda, e o texto só a reforça:** medido nas rodadas 4 e 5 —
instrução específica vence instrução genérica, e o gerador obedece ao texto quando
texto e imagem discordam. Por isso todo pedido abaixo diz, com todas as letras, que
em caso de dúvida se segue a imagem.

**Por que as cláusulas de cor e de "sem braços" estão em todos:** a 2ª imagem vem de
**outro gerador**, com outra paleta e outro boneco. Ele vai devolver a barba na cor
que quiser, e pode dar braços, orelhas e pescoço ao boneco. As cláusulas existem para
o Gemini copiar **só a forma**.

**O bloco de estilo comum mora no [doc 23 §10](../../../docs/avatar/23-linha-de-arte.md)**,
e cada pedido o cola. Antes de 2026-08-21 o mesmo parágrafo estava repetido em quatro
lugares deste arquivo, que é como uma regra vira quatro regras que discordam.

---

## A restrição que manda no elenco inteiro

**As 5 recolorem com o cabelo** (D17, e é o que a Regra Inviolável nº 4 permite).
Num mesmo aluno, as cinco saem da mesma cor — então **cor não diferencia nada, e só
a silhueta separa uma barba da outra.**

E a silhueta útil está quase toda abaixo do queixo. Medido:

| | |
|---|---|
| da boca ao queixo | 51,8 u = **4,7 px** a 56 |
| do queixo ao fim do tronco | 249,8 u = **22,7 px** a 56 |
| 1 px a 56 px | **11 u** — nada menor existe |
| para LER como forma (3 px) | **33 u** |
| piso de distinção entre peças, a 56 px | **5%** (`folha-traje.ts:85`) — ele julga, não projeta |

Por isso as duas common se separam por **largura**, e as três de cima pela **borda de
baixo**: é a parte que tem espaço para ser lida.

## As amarras comuns às cinco

Todas medidas na peça que passou. Valem para toda barba nova, sem exceção.

| | |
|---|---|
| cápsulas dos olhos | **0 px** de tinta |
| linha da boca | **0 px** por cima |
| miolo acima da boca | **vazio nas cinco; o `bigode` é a exceção medida** — com o contorno pintado pelo gerador sobra 1 px de vão a 56 e a 32 px, e o Doug aprovou a olho; com o `kk-traco` de 12 u ele funde. A segunda morte do bigode (2026-08-18) foi medida com colunas fora da boca (G27) e com o traço que não foi decidido (G29) |
| pele nua abaixo da boca | **NÃO TEM PISO, e agora está medido por que** — ver o bloco logo abaixo (achado **G28**, fechado em 2026-08-20) |
| contorno | 12 u de espessura **e azul-marinho `#000080` de cor** — ⛔ **mudou em 2026-08-22**, era `#000000` igual ao do boneco. Ver a seção *"O contorno da peça se pede em AZUL-MARINHO"*. As duas metades são medidas em separado: `arte:espessura` e `arte:borda` |
| menor detalhe | ≥ 11 u para existir · ≥ 33 u para ler |
| tinta | 1 componente contínuo · **na cor que o gerador quiser** · sem sombra projetada |
| luz | **amplitude**, não faixa: `hi > lo` no esticão p2/p98. Peça chapada reprova na esteira |
| o boneco | não se mexe: 0 px de deslocamento, escala 100,00% |
| **topo** | **≥ y 270 u**, a base do olho. Acima disso encosta na cápsula |
| **massa, largura, piso, tronco** | **não têm teto** — ver o bloco logo abaixo |

⚠️ **OS TETOS DE TAMANHO CAÍRAM EM 2026-08-22, e não é afrouxamento — é medição.**
Eles diziam massa ≤ 70 000 px, largura ≤ 1,00 da cabeça, piso ≤ y 545 e tronco ≤ 12%.
Tinham nascido dias antes, da única barba que existia então (a v4: 54 264 px, 0,89,
y 530, 8,93%).

A **v10** os estoura em todos os quatro — 92 831 px, 1,02, y 581, 15,52% — e é a
peça-padrão do slot: *"ficou perfeito, a melhor arte"*. E a **v8**, que tinha
praticamente o mesmo tamanho dela (96 530 px, 1,02), reprovou **pela BOCA**, não pelo
tamanho. Ou seja: **estes quatro números nunca reprovaram peça nenhuma.** Pedir 1,00
de largura hoje é pedir uma barba menor que a aprovada.

O quinto argumento, o do tronco, caiu por **decisão do Doug**: *"a barba pode sim
cobrir parte da silhueta"* — sabendo que a peça de rosto é pintada POR CIMA da do
traje, e que cada ponto de tronco coberto é traje que some. A troca é consciente.

**O que continua reprovando é a BOCA, os olhos, a peça furada, a peça chapada e o
contorno de baixo** — e nenhum deles é tamanho. A faixa observada nas quatro barbas,
para o pedido ter escala concreta sem virar teto, está no
[doc 24 §3.3](../../../docs/avatar/24-cabelo-e-barba-ficha-do-slot.md).

⚠️ **O próximo teto de tamanho nasce da próxima barba reprovada por ser grande** — e
o dia de escrevê-lo é aquele, não hoje. Um limite herdado sem medir é pior que
nenhum.

⚠️ **O ciano instrumental saiu desta tabela em 2026-08-21, e não morreu — mudou de
dono.** Ele continua sendo como a esteira reconhece a peça (o Gate −1 e o
`extrair.ts` colhem por ele, `arte:cor-proibida` protege a janela de ±30°), mas
**quem o cria é `restaurar-peca.ts`**, levando o matiz da arte para 180° e
preservando saturação e luminância. Pedi-lo ao gerador é o que a Regra Inviolável
nº 4 lista como *"pedir arte em cor instrumental para repintar depois"*, e ele
morreu como pedido em 2026-08-13.

### Por que a "pele nua abaixo da boca" não vira piso — medido, não abandonado

O 30 u que morava na tabela acima foi calibrado **na `cheia`**, a peça que ele deveria
julgar, e reprovou as três `cavanhaque` — uma das quais o Doug aprovou a olho. Isso já
bastava para tirá-lo. O que faltava era responder de onde um piso com lastro sairia, e
a resposta, medida em 2026-08-20 (`.scratch/estilo/g28-piso-sintetico.ts`), é que
**ele não sai de lugar nenhum, porque os tamanhos não o comportam.**

Um piso honesto seria: *meia boca + o contorno que a peça traz + pele que sobreviva a
um pixel renderizado*. Os dois primeiros são fixos (2,6 u e 5,2 u). O terceiro depende
de onde o boneco é servido:

| onde | 1 px vale | piso que isso exigiria | cabe nos 48,4 u de boca-a-queixo? |
|---|---|---|---|
| corpo inteiro no `/perfil`, 160 px | 3,1 u | **10,9 u** | sim, com folga |
| corpo inteiro a 56 px | 8,9 u | **16,7 u** | sim |
| recorte de cabeça a 40 px | 12,1 u | **19,9 u** | sim, apertado |
| recorte de cabeça a **32 px** | **15,1 u** | **22,9 u** | sobra 25 u para a barba inteira |

E com **dois** pixels de pele — que é o mínimo para uma faixa parecer faixa e não
serrilha — o piso a 32 px vai a **38,0 u** dentro de um vão de 48,4 u: a barba
precisaria caber inteira em 10 u. Impossível.

**A conclusão é a mesma que a rota já registrou por outro caminho:** o que sustenta a
leitura *"barbudo"* a 32 px **não é o vão sob a boca** — é a silhueta da barba contra a
PELE, na linha do maxilar. Pedir faixa de pele visível dentro de 3,2 px de vão é pedir
o que o tamanho não dá.

**Então a régua vira RELATO, como a `boca-livre.ts` virou depois do G29.** As sondas
continuam medindo e imprimindo o vão; nenhuma reprova por ele. Quem reprova é o olho
do Doug, e nas três vezes em que ele e um piso discordaram, o piso é que estava errado.

## ⚠️ O CONTORNO FECHA EM VOLTA — e a borda de baixo é a que o gerador larga

**Achado de 2026-08-20, medido, e vale para todo pedido de barba daqui em diante.**

O Doug olhou a folha da `cheia` e disse: *"o contorno da barba, que deveria ser um
traço preto, tem a cor fugindo, excedendo o traço"*, e depois *"ainda tem cor vazando
embaixo"*. Estava certo nas duas vezes. A causa é a arte, e é **local**: o gerador
pinta o contorno nas laterais e no topo e deixa a barba morrer sem preto **na borda
de baixo**, onde ela encosta no pescoço e na túnica.

A banda preta abaixo do último pixel de cor, por coluna, na máscara da própria peça:

| peça | banda embaixo (p50) | colunas SEM preto no render |
|---|---|---|
| `cheia` | **1 px** do canvas | 24,7% |
| `cheia-com-bigode` | **1 px** | 43,1% |
| `bigode-ferradura` | 6 px | 25,8% |
| **`rala`** | **12 px** | **0%** |

Referência: o contorno do boneco é **12 u = 14,4 px** do canvas. A `rala` é a única
que o gerador fechou por baixo — e é a única que não vaza no render. A correlação é a
prova.

**Por que a cláusula que já existe não bastou:** ela está na lista de cores
(*"contorno da barba: preto, da mesma espessura das outras linhas do boneco"*), e o
gerador a lê como instrução de COR. Ela tem de ser instrução de **forma**, com a borda
de baixo nomeada — é o que o parágrafo abaixo faz. **Cole-o em todo pedido**, junto
com o bloco de cores:

> **O CONTORNO DA BARBA DÁ A VOLTA COMPLETA NELA.** A linha que envolve a barba tem a
> **mesma espessura da linha preta que contorna o corpo do boneco** e não afina em
> lugar nenhum. **A COR DESSA LINHA É AZUL-MARINHO BEM ESCURO, `#000080`** — não
> preta, não cinza: um azul tão escuro que quase parece preto. TODA linha da barba usa
> esse azul, o contorno de fora e qualquer divisão por dentro. As linhas do BONECO
> continuam pretas como estão — o azul é só das linhas da BARBA. Ela existe nos quatro
> lados, e a **borda de baixo é a mais importante**: onde a barba termina e começa a
> roupa ou o pescoço, tem de haver a mesma linha grossa que existe nas laterais. A
> barba **nunca** termina com a cor dela encostando direto na roupa, na pele ou no
> fundo. Se em algum ponto a linha ficar mais fina que a do corpo do boneco,
> engrosse-a até ficar igual.

**Como conferir sem abrir a imagem:** `npx tsx .scratch/estilo/de-quem-e-a-borda.ts`
imprime a banda de baixo por peça. Abaixo de ~8 px do canvas, a peça vaza no render.

---

## O contorno da peça se pede em AZUL-MARINHO — decisão do Doug, 2026-08-22

> ⛔ **PORTADA DE `PEDIDO-CABELOS.md` EM 2026-08-23, e é pré-condição de qualquer
> barba nova.** Este arquivo é de 22/08 14h37 e a decisão é de ~21h do mesmo dia:
> ela foi escrita só no pedido do cabelo. Gerar barba por este documento sem esta
> seção devolve **linha preta**, que é exatamente a causa que o Doug nomeou. A regra
> vale para a barba pela mesma razão que vale para o cabelo: **as duas recolorem**,
> e a esteira das duas separa peça de base por diferença de pixel.

**A causa, nas palavras dele:** *"a linha do contorno do cabelo é igual ao contorno do
boneco e, quando a linha do contorno do cabelo se conflita com o do avatar, a esteira
erra."* O passo 1 da esteira é *peça = o que difere da base*, e *preto sobre preto
difere ~0*. É UM mecanismo com dois sintomas, os dois já pagos **e um deles na
barba**:

- fio preto **sobre** o traço do boneco fica FORA da máscara — **o furo do maxilar da
  `trancada` v10**, que é peça deste slot, e o canal da calota medido no Bloco A;
- traço preto **novo** rente ao do boneco é indecidível — a mancha no ombro do
  `chanel` de 2026-08-22 (1.928 px na esquerda + 93 na direita), que o Doug pegou a
  olho com todos os gates verdes.

**A regra: o contorno da peça vem em azul-marinho `#000080`, e FICA assim no PNG.**
Não é o ciano proibido — o ciano era cor instrumental para repintar cor FINAL, e isto
é desambiguação de LINHA numa peça que recolore inteira. Os dois porquês medidos:

- **luminância ~9**: no render o contorno sai PRETO de graça — a máscara de tom
  carrega luminância, e onde ela é ~0 aparece a forma de baixo, `var(--av-linha)`.
  Nenhum passo de "voltar ao preto" existe, nem pode existir: o `--check` da esteira
  re-roda sobre o PNG do repositório, e um PNG re-escurecido à mão recriaria a
  ambiguidade a cada verificação. Cor mais clara que lum 40 é proibida — é o defeito
  registrado da `entrada.png` (traço cinza lum 70, `arte:borda` reprova);
- **128 níveis no canal azul** contra o preto do boneco: a esteira separa com 24 por
  canal — são 5× a margem, com sobra para o reencode do Gemini (que o Gate −1 já
  tolera, medido q95→q60).

Para o olho é quase preto. Quem precisa da diferença é a máquina.

---

## O elenco, em número

| raridade | slug | assinatura | largura | desce do queixo | a 56 px |
|---|---|---|---|---|---|
| common | `cavanhaque` | mancha central no queixo, laterais do rosto nuas | ~120 u (0,33 cabeça) | ~30 u | 11 × 3 px |
| common | `aparada` | contorna a mandíbula de lado a lado, borda seguindo o queixo | ~300 u (0,82) | ~20 u | 27 × 2 px |
| rare | `quadrada` | **borda de baixo reta**, cortada a régua | ~260 u | ~70 u | 24 × 6 px |
| epic | `bipartida` | **duas pontas** com entalhe em V de ~40 u | ~310 u | ~100 u | 28 × 9 px |
| legendary | `cheia` | cobre a cara de bochecha a bochecha, sobe à altura dos olhos, **ponta única** | 356 u (0,98) | 74,5 u | 32 × 7 px |
| rare | `bigode` | **ferradura em volta da boca** + cavanhaque pontudo; a única acima da boca | 154 u (0,41) | 70 u | 14 × 6 px |

**A lendária não é a mais longa, e é de propósito** — decisão do Doug em 2026-08-18.
A `bipartida` desce mais; a `cheia` é a mais larga e a única que sobe até a altura
dos olhos, que é o que se vê primeiro num rosto.

---

# Pedido 1 — `cavanhaque` (common)

**No ChatGPT, peça antes:** *um cavanhaque — só uma mancha de barba no meio do
queixo, com cerca de um terço da largura da cabeça, descendo pouco abaixo do queixo.
As bochechas e as laterais do rosto ficam sem barba nenhuma. A boca fica livre, sem
bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/cavanhaque-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** é **uma única mancha
> compacta no meio do queixo**, com cerca de **um terço da largura da cabeça**. Ela
> começa abaixo da boca, cobre o queixo, e desce só um pouco abaixo dele — cerca de
> **um décimo da altura da cabeça**. A borda de baixo dela é arredondada. É uma peça
> só, cheia, sem divisões. **As bochechas e as laterais do rosto ficam sem barba
> nenhuma** — nada de pelo subindo pelos lados da cabeça. Se a descrição e a segunda
> imagem discordarem em algum detalhe, **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **A COR DA BARBA É SUA — pinte na cor que ficar melhor.** Um castanho, um preto,
> um ruivo, o que a peça pedir. Não existe paleta técnica a seguir, e você não precisa
> acertar cor nenhuma: a cor que você escolher **será trocada por programa depois**,
> e quem escolhe a cor final é a criança que usa o avatar.
>
> **O QUE IMPORTA É A LUZ, e é isto que decide se a peça é aceita:** a barba tem de
> ter **amplitude de luz** — partes claras e partes escuras, com a luz acompanhando a
> forma. Não são três tons chapados, e não é um degradê liso de aerógrafo: é claro e
> escuro nascendo da própria estrutura do pelo.
>
> **A ESTRUTURA:** fios, mechas, ranhuras, pontas — unidades que se contam. A borda da
> barba não é uma curva lisa: ela é serrilhada pelas pontas do pelo. Veja a terceira
> imagem para o nível de acabamento.
>
> **O CONTORNO DA BARBA É PRETO PURO — `#000000`**, da mesma espessura das outras
> linhas do boneco. Preto puro quer dizer preto puro: **cinza escuro não serve**, e um
> traço cinza é o defeito mais comum desta rota (medido: lum 70 em vez de 0, e a peça
> reprova em `npm run arte:borda`).
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 2 — `aparada` (common)

**No ChatGPT, peça antes:** *uma barba curta e aparada — ela cobre as laterais do
rosto e o queixo, de lado a lado, mas é cortada rente ao queixo e não cai sobre o
peito. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/aparada-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** é uma **barba curta e
> aparada, colada ao rosto**. Ela cobre as laterais do rosto e o queixo, de lado a
> lado, quase tão larga quanto a cabeça. A borda de baixo **acompanha a linha do
> queixo** e desce só um pouquinho além dele — cerca de **um quinze avos da altura da
> cabeça**. **Ela não cai sobre o peito**, e não tem ponta. É uma peça só, cheia, sem
> divisões. Se a descrição e a segunda imagem discordarem em algum detalhe, **siga a
> segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **A COR DA BARBA É SUA — pinte na cor que ficar melhor.** Um castanho, um preto,
> um ruivo, o que a peça pedir. Não existe paleta técnica a seguir, e você não precisa
> acertar cor nenhuma: a cor que você escolher **será trocada por programa depois**,
> e quem escolhe a cor final é a criança que usa o avatar.
>
> **O QUE IMPORTA É A LUZ, e é isto que decide se a peça é aceita:** a barba tem de
> ter **amplitude de luz** — partes claras e partes escuras, com a luz acompanhando a
> forma. Não são três tons chapados, e não é um degradê liso de aerógrafo: é claro e
> escuro nascendo da própria estrutura do pelo.
>
> **A ESTRUTURA:** fios, mechas, ranhuras, pontas — unidades que se contam. A borda da
> barba não é uma curva lisa: ela é serrilhada pelas pontas do pelo. Veja a terceira
> imagem para o nível de acabamento.
>
> **O CONTORNO DA BARBA É PRETO PURO — `#000000`**, da mesma espessura das outras
> linhas do boneco. Preto puro quer dizer preto puro: **cinza escuro não serve**, e um
> traço cinza é o defeito mais comum desta rota (medido: lum 70 em vez de 0, e a peça
> reprova em `npm run arte:borda`).
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 3 — `quadrada` (rare)

**No ChatGPT, peça antes:** *uma barba de borda reta — em vez de terminar em ponta,
ela termina numa linha horizontal reta, como cortada com régua, um pouco mais
estreita que a cabeça. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/quadrada-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** ela cobre as laterais do
> rosto e o queixo, ficando **um pouco mais estreita que a cabeça**, e desce sobre o
> peito cerca de **um quarto da altura da cabeça** abaixo do queixo. **A borda de
> baixo é uma linha horizontal reta**, de lado a lado, como se a barba tivesse sido
> cortada com régua, com os cantos levemente arredondados. **Ela não tem ponta.** Os
> lados são quase retos, e a silhueta inteira é um bloco de base reta. É uma peça só,
> cheia, sem divisões. Se a descrição e a segunda imagem discordarem em algum detalhe,
> **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **A COR DA BARBA É SUA — pinte na cor que ficar melhor.** Um castanho, um preto,
> um ruivo, o que a peça pedir. Não existe paleta técnica a seguir, e você não precisa
> acertar cor nenhuma: a cor que você escolher **será trocada por programa depois**,
> e quem escolhe a cor final é a criança que usa o avatar.
>
> **O QUE IMPORTA É A LUZ, e é isto que decide se a peça é aceita:** a barba tem de
> ter **amplitude de luz** — partes claras e partes escuras, com a luz acompanhando a
> forma. Não são três tons chapados, e não é um degradê liso de aerógrafo: é claro e
> escuro nascendo da própria estrutura do pelo.
>
> **A ESTRUTURA:** fios, mechas, ranhuras, pontas — unidades que se contam. A borda da
> barba não é uma curva lisa: ela é serrilhada pelas pontas do pelo. Veja a terceira
> imagem para o nível de acabamento.
>
> **O CONTORNO DA BARBA É PRETO PURO — `#000000`**, da mesma espessura das outras
> linhas do boneco. Preto puro quer dizer preto puro: **cinza escuro não serve**, e um
> traço cinza é o defeito mais comum desta rota (medido: lum 70 em vez de 0, e a peça
> reprova em `npm run arte:borda`).
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

# Pedido 4 — `bipartida` (epic)

**No ChatGPT, peça antes:** *uma barba comprida terminada em duas pontas — ela desce
sobre o peito e se divide no meio, com um entalhe em V bem aberto separando as duas
pontas. A boca fica livre, sem bigode.*

**Anexe as duas imagens**, `BASE-OFICIAL.png` primeiro. **Salve o retorno em**
`.scratch/arte/bipartida-1.png`.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco. A primeira é ele careca, sem barba. A segunda é
> ele com a barba que eu quero. A segunda imagem é o resultado que eu quero — o único
> problema dela é que o boneco por baixo foi redesenhado e saiu de lugar.
>
> **A sua tarefa: reproduzir a barba da segunda imagem sobre o boneco da primeira,
> sem mexer em mais nada.**
>
> Não invente uma barba. Não desenhe a barba que você acha que combina. Não "melhore"
> a barba da segunda imagem. Copie a que está lá.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é a barba.
>
> **A FORMA DA BARBA, como ela está na segunda imagem:** ela cobre as laterais do
> rosto e o queixo, quase tão larga quanto a cabeça, e **desce bastante sobre o
> peito** — cerca de **um terço da altura da cabeça** abaixo do queixo. Em baixo ela
> **termina em duas pontas, separadas por um entalhe em V no meio**. O entalhe é bem
> aberto e bem visível: ele sobe pelo menos até **a metade do comprimento que a barba
> tem abaixo do queixo**. As duas pontas são iguais e simétricas. Acima do entalhe a
> barba é uma peça só, cheia, sem divisões. Se a descrição e a segunda imagem
> discordarem em algum detalhe, **siga a segunda imagem**.
>
> **A boca fica completamente à mostra**, com pele nua em volta dela por todos os
> lados — por cima, pelos cantos e por baixo. Não desenhe pelo acima da boca. Entre a
> boca e a barba fica uma faixa de pele nua com cerca de **cinco vezes a espessura da
> linha da boca**. Os olhos e as sobrancelhas também ficam inteiramente livres.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, não tem mãos, não tem pernas,
> não tem pés, não tem orelhas e não tem pescoço. O corpo dele é uma peça só, em forma
> de sino, e a cabeça senta direto em cima dela. Não acrescente nenhuma dessas partes,
> nem desenhando, nem sugerindo com uma sombra — **mesmo que a segunda imagem tenha**.
>
> **A COR DA BARBA É SUA — pinte na cor que ficar melhor.** Um castanho, um preto,
> um ruivo, o que a peça pedir. Não existe paleta técnica a seguir, e você não precisa
> acertar cor nenhuma: a cor que você escolher **será trocada por programa depois**,
> e quem escolhe a cor final é a criança que usa o avatar.
>
> **O QUE IMPORTA É A LUZ, e é isto que decide se a peça é aceita:** a barba tem de
> ter **amplitude de luz** — partes claras e partes escuras, com a luz acompanhando a
> forma. Não são três tons chapados, e não é um degradê liso de aerógrafo: é claro e
> escuro nascendo da própria estrutura do pelo.
>
> **A ESTRUTURA:** fios, mechas, ranhuras, pontas — unidades que se contam. A borda da
> barba não é uma curva lisa: ela é serrilhada pelas pontas do pelo. Veja a terceira
> imagem para o nível de acabamento.
>
> **O CONTORNO DA BARBA É PRETO PURO — `#000000`**, da mesma espessura das outras
> linhas do boneco. Preto puro quer dizer preto puro: **cinza escuro não serve**, e um
> traço cinza é o defeito mais comum desta rota (medido: lum 70 em vez de 0, e a peça
> reprova em `npm run arte:borda`).
>
> **A BARBA NÃO PROJETA SOMBRA.** Não escureça a roupa, o corpo, o fundo nem a pele
> por causa dela. Tudo que está fora da barba fica exatamente com a cor que já tinha,
> chapada, sem nenhum degradê. A roupa do boneco é uma cor sólida única e continua
> sendo uma cor sólida única.
>
> Devolva um único PNG de 1024 × 1024.

---

## A esteira de cada uma

```
npm run arte:gate .scratch/arte/<slug>-1.png      # Gate −1: registro e forma
npx tsx .scratch/medir-modelo-barba.ts <png>      # largura, altura, componentes
npx tsx .scratch/modelo-detalhe.ts <png>          # boca, olhos, caixa ROSTO
npx tsx .scratch/bigode-no-tamanho.ts <png>       # a boca sobrevive a 56 e 32 px?
```

**Mais um passo, aprendido na `cavanhaque` (achado G31):**

```
npx tsx .scratch/quanto-recolore.ts     # que fracao da peca REcolore?
```

A `cavanhaque` chegou do gerador quase toda **preta** em vez de ciano, e recolore só
**8%** de si mesma — sai preta nas 8 cores de cabelo. O Gate −1 não pega isso, porque
mede forma, não saturação. Piso de referência: `bigode` 80%, `cheia` 83%.

**Reprovou por sombra ou por cor?** É caso da quarta saída — `restaurar-barba5.ts`
troca matiz e restaura a base, sem tocar na silhueta.
**Reprovou por forma?** Volta ao gerador, ou vira achado. Nunca se desenha por
programa.

Depois de aprovada: folha de contato ao olho do Doug, **duas colunas — careca e com
cabelo** — porque a barba cai no castanho de reserva `#5A4632` quando não há cabelo,
e esse salto de cor nunca foi visto.

## Se o Gemini vier em outra cor

Aconteceu na `barba-5`: ele pintou a barba em verde apesar dos hexadecimais no
pedido. **Não é motivo para refazer a arte** — a troca de matiz preserva saturação e
luminância e não move um pixel, e está medida: sozinha, ela derrubou os ladrilhos do
rosto de 30 para 0. Rode `restaurar-barba5.ts` e siga.

## Não passe por Canva nem por Adobe

A rota compara a arte com a base pixel a pixel, e qualquer reamostragem estraga a
comparação. O PNG cru do Gemini é a entrada certa. **Formato nunca é a causa de
reprovação — redesenho é:** a base oficial passada por JPEG q95, q85, q75 e q60
aprova no Gate −1 nas quatro qualidades, com 0,0 px de deslocamento.

---

# Retoque cirúrgico — fechar o contorno de baixo

**Para quem:** `cheia`, `cheia-com-bigode` e `bigode-ferradura`, medidas em 2026-08-20.
A `rala` **não** precisa: ela já tem 12 px de banda embaixo.

**Não é um pedido de barba nova.** A forma das três está aprovada; o que falta é a
linha preta na borda de baixo. Pedir uma barba nova troca um defeito conhecido por uma
rodada inteira de incerteza — e a `cheia` é a única peça que já está no banco.

**Anexe UMA imagem:** a própria arte da peça (`scripts/avatar/arte/barba-cheia.png`,
ou a do lote em `.scratch/arte/lote/<peça>.png`). **Salve o retorno em**
`.scratch/arte/<peça>-contorno-1.png` e passe pela rota: `restaurar-peca.ts` →
`arte:gate` → `de-quem-e-a-borda.ts`.

> Edite esta imagem. Não crie um personagem novo, não redesenhe nada, não reenquadre.
>
> Esta imagem está quase certa. **O único problema é a linha preta de contorno da
> barba: ela some na borda de baixo.** Nas laterais e em cima a barba tem uma linha
> preta em volta; embaixo, onde a barba termina e começa a roupa, a cor da barba
> encosta direto na roupa, sem linha nenhuma.
>
> **A sua tarefa, e é a única: desenhar a linha preta que falta na borda de baixo da
> barba.**
>
> A linha nova tem exatamente **a mesma espessura da linha preta que contorna o corpo
> do boneco** — compare com ela na própria imagem e iguale. Ela acompanha a borda de
> baixo da barba de ponta a ponta, sem interrupção, e se encontra com as linhas que já
> existem nas laterais, formando um contorno fechado em volta da barba inteira.
>
> **A BARBA NÃO MUDA DE TAMANHO NEM DE FORMATO.** A linha nova ocupa a beirada da
> barba que já existe — ela come um pouco da cor da barba, e **não** avança sobre a
> roupa, sobre o pescoço nem sobre o fundo. A silhueta da barba na imagem que você
> devolver é a mesma da imagem que eu mandei.
>
> **NADA MAIS NA IMAGEM MUDA.** A imagem que você devolver será comparada com esta
> pixel a pixel. Ficam idênticos: o tamanho do arquivo (1024 × 1024), o enquadramento,
> o tamanho e a posição do boneco, o formato da cabeça e do corpo, os olhos, as
> sobrancelhas, a boca, a cor da pele, a cor da roupa, o fundo, a cor da barba, e todas
> as linhas pretas que já existem. Não "melhore" nada. Não acrescente sombra, textura,
> fios, brilho nem gradiente. Não escureça a roupa em volta da barba.
>
> Devolva um único PNG de 1024 × 1024.

**O que reprova o retorno, em ordem de gravidade:**

| sintoma | o que aconteceu | régua |
|---|---|---|
| Gate −1 reprova em "rosto/corpo" com causa *repintura* | o gerador redesenhou o boneco | `arte:gate` |
| a banda de baixo continua < 8 px | ele ignorou o pedido | `de-quem-e-a-borda.ts` |
| a peça cresceu para baixo | a linha foi desenhada POR FORA | comparar `pxPeca` antes/depois |
| o recolorimento despencou | a linha comeu a barba inteira | `barba-para-formas.ts`, laudo |
