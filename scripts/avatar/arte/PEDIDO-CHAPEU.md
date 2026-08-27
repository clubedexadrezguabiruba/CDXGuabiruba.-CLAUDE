# O que fazer no Gemini — chapéu `chapeu-<nome>`

> **ESTE ARQUIVO É MOLDE, e o molde tem UMA lacuna.** O bloco para colar é fixo;
> só a linha **`O CHAPÉU:`** muda de peça para peça. Slug, raridade e paleta não
> são campos separados: o slug sai do nome do arquivo de arte, a raridade aparece
> como **quantidade de elementos repetidos** dentro daquela linha (doc 22 §3), e a
> **cor é escolha do gerador** — ela vai ao produto como for pintada.
>
> Reescrito em **2026-08-25**, depois de quatro artes: três linhas entraram com
> número atrás e três saíram porque a evidência as derrubou. Ver a seção *"O que
> este bloco aprendeu"*.

**Nasceu em 2026-08-24**, com o teto. O chapéu é o **segundo** slot de cor assada
— o traje foi o primeiro —, então este pedido é irmão de
[PEDIDO-TRAJE.md](PEDIDO-TRAJE.md) na **cor** (final, assada) e de
[PEDIDO-CABELOS.md](PEDIDO-CABELOS.md) na **linha** (azul instrumental). A revisão
de 2026-08-24 explica por que as duas coisas convivem — ver a seção logo abaixo.

**Arquivo para anexar:** `scripts/avatar/arte/base-oficial.png` (1024 × 1024).

**Arquivo para OLHAR antes, e não anexar:** `scripts/avatar/arte/base-chapeu-campo.png`
— o campo pintado sobre a base. Gere com `npx tsx scripts/avatar/arte/base-chapeu.ts`.

---

## O campo, medido

A peça só chega ao boneco dentro da `CAIXA_DA_ARTE`. Fora dela a tinta existe no
arquivo e **não existe no produto** — o descarte que esta rota inteira existe para
não deixar acontecer em silêncio.

| fronteira | em unidades | **em pixels do canvas** |
|---|---|---|
| **teto** | y −75 | **y 2** — 2 px de margem até a borda do arquivo |
| **piso, na coluna central** | y 183,0 | **y 312** — o topo do olho, e só de x 187,5 a 392,5 |
| **piso, nas laterais** | y 347,2 | **y 509** — a base da cabeça |
| **lados** | x −75 → 575 | **x 122 → 902** |
| a coroa (referência) | y 39,5 | y 139 |

**O teto acima da coroa é 114,5 u — 36,5% de uma altura de cabeça.** Até
2026-08-24 eram 39,5 u (12,6%), e não havia chapéu que coubesse: a colagem parava
no `viewBox`. Use a folga inteira; ultrapassá-la custa a arte.

**Transbordo lateral livre: 144,2 u à esquerda e 129,8 à direita** da cabeça — dá
aba larga, e não dá aba infinita.

⚠️ **Os lados cresceram DUAS vezes em 2026-08-25.** Primeiro de `x 0 → 500` para
`−20 → 520` — toda a folga que o quadro de 500 tinha, porque a figura é desenhada a
`ESCALA_PADRAO = 0,92` e o quadro mostrava de interno −21,7 a 521,7. O Doug olhou o
render de novo: *"ainda corta lateral dois chapéus com aba comprida."*

Então **o quadro cresceu**: `VIEWBOX.w` de 500 para **600**, e o campo o acompanhou
até `−75 → 575`. O chapéu mais largo do lote passou de **7 447 px de desenho
aparados para 179**.

⚠️ **E o piso deixou de ser uma reta.** Ele valia para toda a largura, e os olhos
ocupam 41% dela — nos outros 59% cortava sem proteger nada. Agora é a
`CAIXA_DAS_FEICOES` (x 187,5 → 392,5): dentro dela o piso é o olho, fora dela é a
base da cabeça. **Aba que desce pelas laterais deixou de ser amputada.**

### Quanta altura sobra de verdade — medido em 2026-08-25

O "2 pixels antes da borda" não é uma regra tímida: é a borda do arquivo, e **quem
manda no topo é o ARQUIVO, não o quadro do produto.**

| limite | interno | o que é |
|---|---|---|
| **o ARQUIVO** (`CAIXA_DA_ARTE`) | **y −75** | px y 2 no canvas 1024². Acima disto não existe imagem |
| o QUADRO do produto | y −80,8 | `tela = 74,36 + 0,92 × interno`, com `ESCALA_PADRAO` |
| a `chapeu-toca-de-cozinha` aprovada | y −58 | topa aqui |

**Sobram 17,0 unidades de altura** entre a toca aprovada e a borda do arquivo — a
peça pode crescer **cerca de 17%** acima da coroa (de 97,5 para 114,5 u) e nada
mais. Passado o arquivo vem o quadro, 5,8 u depois. Os dois acabam quase juntos, e
foi assim de propósito: a parte 8 escolheu −75 porque é exato dos dois lados.

**Na largura sobra menos:** a toca ocupa u x 7 → 484 num campo de 0 → 500 — 7
unidades à esquerda, 16 à direita. Cerca de **5%** a mais.

⚠️ **Para uma peça substancialmente maior, os dois lados teriam de mudar juntos** —
o canvas da base de arte E o `viewBox` do produto. Só um dos dois não adianta: o
arquivo é o limite mais apertado hoje, e o quadro é o mais apertado depois dele. É
a Frente B que a parte 8 adiou, e ela não está pedindo por conta de chapéu ainda.

⚠️ **Medir isto com `escala: 1` dá o número errado.** `escala: 1` é a **base de
edição** — o que vai ao gerador. O produto desenha a **`ESCALA_PADRAO` = 0,92**, com
a figura reancorada, e é ela que decide o que a criança vê.

⚠️ **O piso desceu em 2026-08-25.** Ele era a **sobrancelha** (y 157,7), e o Doug o
levou ao **olho**: *"arte chapéu não cobre os olhos"*. São 25 unidades a mais, e o
piso velho custava 5 817 px da primeira toca — cortados numa reta horizontal que
atravessava a cabeça inteira. Ver `Y_PISO_DO_CHAPEU` em `base.ts`.

---

## O que muda em relação ao pedido do CABELO — e o contorno NÃO muda

⚠️ **REVISADO EM 2026-08-24, depois da primeira peça.** Este arquivo pedia contorno
**preto**, com o argumento de que o chapéu tem cor assada e o azul do cabelo é
instrumental. O argumento estava certo sobre a cor e **errado sobre a esteira**, e o
Doug pegou na primeira arte: *"a borda da arte se misturou com a borda da cabeça e a
esteira se confundiu e eliminou a borda."*

**O contorno da peça vem em AZUL `#0000C8`, igual ao do cabelo.** O azul não chega ao
aluno: a esteira o converte em cinza da própria luminância antes de assar o raster —
uma linha `#0000C8` sai `(14, 14, 14)`, praticamente o `#000000` do boneco. No
produto o contorno do chapéu fica **idêntico ao do cabelo**, que é a coleção.

**Por que o chapéu precisa disso mais que o traje.** Extração é *diferença contra a
base*, e preto sobre preto difere ~0. O traje mora no tronco e quase nunca encosta na
fronteira do boneco — atravessou duas peças sem ninguém notar. **O chapéu senta na
cabeça: a borda de baixo dele corre por cima do contorno do crânio por construção.**

Medido, com um gorro cuja linha cai exatamente sobre a tabela do contorno do crânio
(`linha-instrumental.test.ts`, e o braço preto fica no arquivo como controle):

| contorno | borda que sobrevive à extração |
|---|---|
| **preto** | 370 de 4 897 px — **7,6%** |
| **azul `#0000C8`** | 4 739 de 4 897 px — **96,8%** |

A única diferença de verdade em relação ao cabelo é a **cor da massa**: no cabelo *"a
cor não importa"*, porque o aluno a escolhe. **No chapéu a cor é FINAL** e vai ao
produto como pintada. Todo o resto — unidades contadas, meia-luz que varia, nada de
chapado, nada de aerógrafo, brilho só na crista — é idêntico.

## O TEXTO PARA COLAR — fixo, com UMA linha para editar

**Copie o bloco inteiro. A única coisa que muda de peça para peça é a linha `O
CHAPÉU:`.** Nela vai o que a peça é *e o que se repete nela* — as dobras, os gomos,
o trançado, as voltas do pano. A raridade não entra por nome: ela aparece como
**quantidade de elementos repetidos** (doc 22 §3), e é isso que a sua frase descreve.

```
Edite a imagem. Não crie um personagem novo. Adicione ao boneco APENAS um chapéu.

O CHAPÉU: ⟨o que é a peça, e o que se repete nela⟩

ONDE ELE FICA. A borda de baixo fica na testa, com testa à vista entre ela e as
sobrancelhas — nada do chapéu desce até os olhos. Aba cresce para os LADOS e para
CIMA, nunca para baixo. E essa borda acompanha a curva do crânio: não é uma reta
atravessando a cabeça.

O CONTORNO É AZUL, no código #0000C8 — um azul forte e escuro. TODA linha do
CHAPÉU usa esse azul, por fora e por dentro; as linhas pretas do BONECO continuam
pretas como estão.

E ELE DÁ A VOLTA COMPLETA: não afina e não some em lugar nenhum, muito menos
embaixo, onde o chapéu encosta na cabeça. É ali que a linha sempre morre, e é ali
que a peça deixa de parecer vestida.

A LINHA DE FORA É MAIS GROSSA QUE AS DE DENTRO. A silhueta tem o peso da linha que
contorna o boneco; as de construção — dobras, costuras, franzido — são
visivelmente mais FINAS. Com o mesmo peso nas duas, a forma some no tamanho
pequeno.

A PEÇA É SÓLIDA POR DENTRO. Nenhum buraco, nenhuma fresta por onde apareça o que
está atrás. Onde duas dobras se encontram o preenchimento continua: o vão entre
elas é uma linha, nunca um furo.

ACABAMENTO. Unidades contadas, não massa lisa. A luz corre por dentro da forma,
em muitos tons. Nada de cor chapada, nada de degradê de aerógrafo, nada de mancha
de brilho — o claro é só a crista do relevo.

A COR É SUA E É DEFINITIVA — vai ao produto exatamente como você pintar. Peça
clara precisa de uma parte ESCURA que a ancore: uma faixa, uma aba, uma fita. E
ela não pode ser preta nem quase preta por inteiro, senão come a silhueta do
boneco.

PRESERVAÇÃO OBRIGATÓRIA:

Mantenha o canvas nativo em 1024x1024.

Preserve 100% o design original do avatar: olhos, sobrancelhas, formato e contorno
da cabeça, pele, corpo, roupa, fundo, sombra e enquadramento. NÃO REDESENHE OS
OLHOS NEM AS SOBRANCELHAS — nem a forma, nem a largura, nem a posição. NÃO MOVA,
não redimensione e não reenquadre o boneco: nem um pixel.

RESTRIÇÕES:

O chapéu não faz sombra no rosto.

O chapéu não passa por trás da cabeça, não encosta no ombro e não vira capuz nem
gola.

O chapéu pode subir até quase o topo da imagem: pare a 2 pixels da borda de
cima. Essa é toda a altura que existe — acima dela não há imagem, e o que
passar é cortado em reta.
```

**Anexe `scripts/avatar/arte/base-oficial.png`** (1024 × 1024). Antes de escrever a
linha do chapéu, vale olhar `base-chapeu-campo.png` — o campo pintado sobre a base
(`npm run arte:base-chapeu`).

### Exemplos da linha `O CHAPÉU:` — os slugs do doc 22

| slug | a linha |
|---|---|
| `chapeu-boina` | *uma boina inclinada, uma forma só, com o cabinho no topo. A aba não existe* |
| `chapeu-gorro` | *um gorro de tricô com a barra virada; o canelado da barra se repete volta toda* |
| `chapeu-bone` | *um boné de gomos com aba para a frente; conte os gomos e as costuras entre eles* |
| `chapeu-bandana` | *uma bandana amarrada, com o nó de LADO e as duas pontas soltas* |
| `chapeu-toca-de-cozinha` | *uma toca de cozinheiro alta, com faixa escura embaixo e a copa clara e larga transbordando por cima; o franzido da copa se repete volta toda* |
| `chapeu-chapeu-de-palha` | *um chapéu de palha de aba larga e plana, com fita na copa; o trançado da palha se repete* |
| `chapeu-capelo` | *um capelo de formatura: a placa quadrada e a borla pendente* |
| `chapeu-turbante` | *um turbante com as voltas do pano visíveis e contadas, mais a dobra da frente* |
| `chapeu-coroa-de-vitral` | *uma coroa de painéis de vidro separados por chumbo, cada ponta de um tom, com a luz atravessando* |

---

## O QUE ESTE BLOCO APRENDEU COM AS QUATRO PRIMEIRAS ARTES

Toda linha acima tem uma reprovação atrás. E **três linhas saíram**, porque a
evidência as derrubou — pedido que cresce a cada rodada vira pedido que o gerador
não lê inteiro.

### O que ENTROU, e o número que colocou lá

| linha | o que ela impede | medido |
|---|---|---|
| contorno **AZUL** `#0000C8` | a extração apaga a borda de baixo, que corre por cima do contorno do crânio por construção | com preto, **7,6%** da borda sobrevive; com azul, **96,8%** |
| **o contorno dá a volta completa** | a linha morre embaixo e a peça descola | Toca Alta 65,2% e Toca Curta 77,5% de perímetro com linha; a que passou, **100,0%** |
| **linha de fora mais grossa** | a forma some no tamanho pequeno | as duas reprovadas tinham externo 3 px e internos 1–3 px |
| **não desce até os olhos** | a peça come a feição | a que passou tem **0 px** sobre a faixa dos olhos |
| **NÃO MOVA o boneco** | o Gate −1 reprova e nenhum número depois vale | a `cozinheiro2` desceu o boneco **8 px** e o ampliou **1,5%** — rosto 100% alterado |

### O que SAIU, e por quê

- **"Um quinto da peça é linha azul."** A peça que o Doug aprovou tem **48,4%** de
  linha — duas vezes e meia o pedido. A fração era chute, e o olho dele reprovou o
  chute, não a arte. O que importa da linha é a **hierarquia** (fora mais grossa
  que dentro), e essa linha ficou;
- **"A peça não pode ser branca."** Ela existia porque branco sobre o bege da base
  difere 11 níveis contra um corte de 24, e a copa sumia na extração. **Isso virou
  conserto de esteira** (`taparFurosCercados`, 2026-08-25): furo cercado pela
  própria peça é tapado com a tinta da artista. Uma toca de cozinheiro é branca por
  definição — proibir branco proibia a peça. O que ficou é a parte que continua
  valendo: peça clara precisa de **parte escura que a ancore**;
- **a tabela "a unidade contada de cada peça"**, que era uma seção inteira. Ela
  virou a coluna de exemplos da linha `O CHAPÉU:` acima — o mesmo dado, dentro da
  única linha que muda.


---

## A esteira, comando a comando

Salve a arte como `scripts/avatar/arte/chapeu-<nome>.png` e rode, nesta ordem:

```bash
npm run arte:gate     -- scripts/avatar/arte/chapeu-<nome>.png   # Gate −1: o boneco não se mexeu
npm run arte:causa    -- scripts/avatar/arte/chapeu-<nome>.png   # se reprovou: de que cor é a reprovação
npm run arte:chapeus                                             # extrai, vetoriza e gera o literal
npm run arte:borda    -- scripts/avatar/arte/chapeu-<nome>.png   # o contorno da peça é PRETO
npm run arte:traco    -- scripts/avatar/arte/chapeu-<nome>.png   # o traço do boneco está inteiro
```

Depois: `/dev/avatar-kokeshi`, o seletor do slot chapéu, e o seu olho.

**O parecer é no render**, não na folha de contato — decisão de 2026-08-24, a
mesma que fez o lote de dez cabelos caber numa sessão.
