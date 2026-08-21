# O que pedir ao gerador — os 10 retratos da Academia

> **ESTE ARQUIVO É MOLDE + FILA.** O texto da §4 é fixo e se cola inteiro em todo
> pedido; o que muda de bot para bot é só o bloco da §5. O elenco e a lei estão em
> [`Academia64_Diretriz_dos_Bots_v2.md`](Academia64_Diretriz_dos_Bots_v2.md).
>
> **Escrito em 2026-08-21**, no molde de `scripts/avatar/arte/PEDIDO-TRAJE.md`.
>
> | preencher | onde |
> |---|---|
> | **slug** | a §5, um bloco por bot |
> | **onde salvar** | `public/bots/<slug>.png` — o nome do arquivo **é** o slug |
> | **a descrição do personagem** | o único bloco que muda: a §5 |

---

## 1. O retrato é um CÍRCULO de 96 pixels — e isto foi medido, não suposto

Antes de escrever qualquer pedido, esta é a régua, e ela reprova a arte que existe
hoje.

[`BotAvatar.tsx`](../src/components/bots/BotAvatar.tsx) monta o retrato dentro de um
`div` com `rounded-full overflow-hidden` e a imagem com `object-cover`. Ou seja: **o
PNG quadrado é recortado no círculo inscrito**, e os quatro cantos — 21,5% da área —
não existem na tela. E os tamanhos são estes, os únicos que o produto usa:

| tamanho | px | onde aparece |
|---|---|---|
| `xs` | **32** | barra da partida, linha da revisão |
| `sm` | **48** | pós-jogo |
| `md` | **64** | **a grade da Sala de Duelos** e o modal de fim de partida |
| `lg` | **80** | pré-jogo |
| `xl` | **96** | painel lateral durante a partida |

**Não existe lugar nenhum no produto que mostre o retrato maior que 96 px, e não
existe lugar nenhum que o mostre quadrado.**

O que isso quer dizer, medido sobre os retratos atuais (`leo.png` e `helena.png`,
1024 × 1024):

- **O fundo é jogado fora.** O acampamento do Léo e a sala de estudos da Helena —
  castelo, mapas emoldurados, globos, astrolábio — estão fora do círculo ou pequenos
  demais para existir a 64 px.
- **As mãos e o objeto também.** A Helena segura um mapa aberto entre 55% e 70% da
  altura; na tela isso é uma mancha de 4 px, quando não é cortada.
- **O rosto da Helena tem 13% da largura do quadro** — a 64 px são **8 pixels de
  rosto**. O do Léo tem 19%, ou 12 px. Os dois estão enquadrados largos demais para o
  frame que o produto dá a eles.
- A marca d'água do gerador, no canto inferior direito dos dois arquivos (≈91% / 92%),
  cai **fora** do círculo e nunca apareceu. Continua sem importar — a menos que o
  retrato um dia seja exibido quadrado.

**Conclusão que manda no enquadramento da §4:** o retrato novo é um **close**. O que
tem de sobreviver é cabeça, cabelo/chapéu, expressão, silhueta e o alto da roupa.
Cenário, mãos, objeto segurado e detalhe de cintura são trabalho perdido.

✅ **A saída oposta — mudar o produto para mostrar o retrato maior ou quadrado — foi
posta ao Doug e descartada por ele em 2026-08-21:** *"deixa como está hoje em dia."*
O frame está fechado, e é ele que manda no enquadramento. Ver §7.

---

## 2. O que se herda da arte atual, e o que morre com o Reino

O subagente mediu os dois extremos do elenco velho. **A gramática de desenho é boa e
fica inteira.** O mundo é que morreu.

**Fica** (é o que faz os 10 parecerem do mesmo elenco):

- 1024 × 1024, PNG opaco, sangrando até as quatro bordas, **sem moldura e sem
  vinheta**;
- **contorno de tinta contínuo**, de 5 a 7 px a 1024 — cerca de **0,6% da largura**;
- o contorno **não é preto uniforme**: quase preto dentro da figura, clareando para
  um cinza-marrom onde encosta em área luminosa;
- **sombra suave**, dois a três tons por superfície, sem degrau duro de cel-shading e
  sem sombra projetada marcada;
- bochecha corada, brilho especular pequeno no olho, cílio superior grosso;
- **detalhe têxtil desenhado a traço** — costura, remendo, bordado, hachura de trama.
  Nunca textura fotográfica;
- **cabelo em mechas agrupadas** de 4 a 8 fios entintados. Nunca fio a fio;
- paleta **terrosa e dessaturada** como base — couro, linho, oliva, pedra, pergaminho.

**Morre com o Reino** (Bíblia §5: é um lugar, não uma época):

- acampamento, tenda, lança, feixe de armas, castelo, bandeira, brasão;
- armadura, cota, elmo, escudo, uniforme militar, divisa de patente;
- e qualquer coisa que só faça sentido dentro de um século.

---

## 3. A progressão que o aluno tem de sentir — e por que ela NÃO é o fundo

A arte velha já tinha uma progressão, e ela foi medida: o fundo do Léo tem
variância de Laplaciano 16; o da Helena, 1346 a 2819 — **cerca de 100× mais
detalhe no bot forte**. É uma boa ideia. **E ela é invisível**, pela §1.

A progressão tem de morar no que sobrevive a um círculo de 64 px: **valor, temperatura
de cor e silhueta.** É o que fica:

| ala | luz | fundo | silhueta |
|---|---|---|---|
| 1 **o Pátio** ★ | alta, dia aberto | claro e quente (creme, palha, terracota clara) | simples, arredondada, aberta |
| 2 **as Salas de Treino** ★★ | alta, interna | neutro médio (pedra, madeira clara) | um acessório de trabalho legível **na massa**, não no detalhe |
| 3 **a Biblioteca** ★★★ | média, lateral | tom médio quente e escuro (madeira, couro, pergaminho velho) | mais contraste entre cabelo e fundo |
| 4 **o Observatório** ★★★★ | baixa, noturna, vinda de lado ou de baixo | **escuro e frio** — o azul-petróleo `#71877e`/`#596a66` é o único acento frio do elenco e **começa aqui** | contida, vertical |
| 5 **a Arena** ★★★★★ | máxima, dura | o mais contrastado do elenco | a mais distinta das dez — reconhecível só pelo contorno |

**Regra de fechamento:** encolha os dez para 64 px, em círculo, lado a lado. Se dois
deles trocarem de lugar sem ninguém notar, um dos dois está errado — e a correção é
silhueta ou valor, nunca mais detalhe.

---

## 4. Cole este texto — é o mesmo nos dez

> Crie um retrato de personagem, quadrado, 1024 × 1024 pixels.
>
> **O mundo é a Academia 64: uma academia extraordinária de estratégia.** É um
> **lugar**, não uma época — nela convivem gente moderna, gente excêntrica, bichos,
> autômatos e criaturas. Fantasia leve, com um fio de mistério. **Não é medieval, não
> é militar, não é guerra, não é brutalidade, não é humor pastelão, não é dark
> fantasy.** Nada de armadura, elmo, escudo, lança, tenda, castelo, bandeira, brasão
> ou divisa de patente.
>
> **Estilo de desenho — igual em todos os retratos deste elenco:** ilustração digital
> com **contorno de tinta contínuo**, de espessura média, cerca de 0,6% da largura do
> quadro; o contorno é quase preto dentro da figura e clareia para um cinza-marrom
> onde encosta numa área luminosa. Por baixo, pintura com **sombreamento suave, dois a
> três tons por superfície** — sem degrau duro de cel-shading, sem sombra projetada
> marcada, sem oclusão pesada. Bochecha levemente corada, brilho especular pequeno no
> olho, cílio superior grosso. **O detalhe de tecido é sempre desenhado a traço** —
> costura, remendo, bordado, hachura de trama —, nunca textura fotográfica.
> **O cabelo é feito de mechas agrupadas** de quatro a oito fios entintados, nunca fio
> a fio. Paleta terrosa e dessaturada como base.
>
> **É um CLOSE. Isto é o mais importante do pedido.** A imagem será exibida recortada
> num **círculo de no máximo 96 pixels**, e na maior parte das telas em **64 pixels**.
> Só a cabeça e o alto do corpo existem na tela.
>
> - Topo da cabeça — incluindo chapéu, orelha, chifre, antena ou o que houver ali —
>   em **10% da altura**, contando do topo.
> - Linha dos olhos em **32% da altura**.
> - Queixo em **58% da altura**.
> - A cabeça ocupa em largura, no máximo, de **28% a 72%** do quadro.
> - Ombros e alto da roupa entram por baixo e são cortados pela borda inferior.
> - **Tudo que importa fica dentro de um círculo centrado no quadro, com raio de 45%
>   da largura.** O que estiver fora dele será cortado e não aparecerá.
>
> O personagem é **centrado**, de frente ou em leve três quartos, **olhando para o
> espectador**.
>
> **Não desenhe:** mãos, braços, objeto segurado, cintura, pernas, moldura, borda,
> vinheta, texto, legenda, assinatura, logotipo.
>
> **O fundo é um campo simples**, de uma a duas cores, com no máximo uma insinuação do
> lugar em massa de cor desfocada. **Nada de cenário legível** — sem arquitetura, sem
> móvel, sem objeto identificável, sem paisagem. O fundo existe para separar a cabeça
> do resto por **contraste de valor**: se o cabelo é escuro, o fundo é claro, e o
> contrário.
>
> **O fundo não pode ser branco, bege, marfim nem creme muito claro** — o retrato é
> recortado em círculo sobre um cartão quase branco, e um fundo claro demais dissolve
> a borda do círculo.
>
> **O detalhe se ganha por repetição, não por tamanho.** Uma fileira de pontos do
> mesmo tamanho, cinco tranças iguais, dobras paralelas, losangos de tricô, rebites em
> linha: detalhe repetido vira textura quando a imagem encolhe. Um ornamento pequeno e
> sozinho vira sujeira.
>
> **[AQUI ENTRA O BLOCO DO PERSONAGEM — o único que muda de retrato para retrato.]**
>
> A arte sangra até as quatro bordas do quadro. Devolva um único PNG de 1024 × 1024.

**Se o gerador oferecer escolha de proporção, peça 1:1 e a maior resolução.**

---

## 5. Os dez blocos

Cada bloco entra inteiro no lugar marcado da §4. **A linha "textura repetida" não é
enfeite** — é a resposta à pergunta do doc 22: *qual é a textura desta peça que as
outras nove não têm?* Retrato sem resposta ali ainda não está pronto para virar
pedido.

---

### Ala 1 — o Pátio ★

#### 1. `bia` — Bia, a Caloura

> É **Bia, uma aluna humana recém-chegada à Academia**, de uns doze anos. Cabelo
> castanho-claro, farto, preso às pressas, com mechas soltas fugindo. Rosto redondo,
> sardas, sobrancelhas altas de quem ainda está achando graça em tudo. Sorriso aberto,
> mostrando os dentes. Usa um **suéter de tricô cor de terracota clara**, gola larga,
> e a alça de uma mochila cruzando o ombro. **Textura repetida:** os **losangos do
> tricô** do suéter, do mesmo tamanho, cobrindo o pano inteiro. Fundo: **creme
> amarelado quente**, luz de manhã.

#### 2. `bolt` — Bolt, o Autômato de Corda

> É **Bolt, um autômato de corda que mora no pátio da Academia**. Cabeça de latão
> fosco, arredondada como um sino, com **uma fileira de rebites iguais** correndo pela
> emenda do topo. Dois olhos redondos de vidro, grandes, iluminados por dentro num
> âmbar quente, com uma pupila desenhada. Sem boca — no lugar dela, **uma grade de
> ripas paralelas**. Na lateral da cabeça, uma chave de corda de metal. O corpo é uma
> carcaça de latão com placas rebitadas. **Expressão obtida só pelos olhos e pela
> inclinação da cabeça: curiosa, obstinada, sem malícia.** **Textura repetida:** os
> **rebites**, do mesmo tamanho, em linha, na emenda e nas placas. Fundo: **palha
> clara**, luz de dia aberto.

---

### Ala 2 — as Salas de Treino ★★

#### 3. `pip` — Pip, o Bicho do Armário

> É **Pip, uma criatura pequena que mora atrás dos armários das salas de treino da
> Academia**. Não é um animal conhecido e não é um monstro: é um bicho de pelo curto e
> escuro, cor de fuligem, com orelhas grandes e móveis, olhos enormes e brilhantes de
> quem enxerga no escuro, e um sorriso torto mostrando um dente só. **Fofo e atrevido,
> nunca assustador.** Está meio saindo da sombra, como quem foi flagrado. Usa uma
> echarpe puída, encontrada, cor de mostarda. **Textura repetida:** o **pelo em tufos
> curtos e paralelos**, todos na mesma direção, cobrindo a cabeça inteira. Fundo:
> **cinza-pedra médio**, luz interna fria e baixa.

#### 4. `dona-filo` — Dona Filó, a Zeladora

> É **Dona Filó, a zeladora da Academia**, uma mulher de uns sessenta anos, negra,
> baixa e robusta. Cabelo grisalho preso num coque apertado, com **um lenço de
> estampa miúda** amarrado em volta. Rosto largo, rugas de expressão fundas, olhos
> estreitos de quem já viu de tudo. **Boca fechada, sobrancelha erguida: não está
> impressionada.** Usa um **jaleco de trabalho azul-acinzentado** com gola de camisa
> por baixo e um pano dobrado sobre o ombro. **Textura repetida:** a **estampa miúda e
> regular do lenço**, o mesmo motivo repetido em toda a superfície. Fundo:
> **madeira clara média**, luz interna alta.

---

### Ala 3 — a Biblioteca ★★★

#### 5. `prof-abelardo` — Professor Abelardo, o Distraído

> É **o Professor Abelardo, um professor humano da Academia**, magro, de uns setenta
> anos, pele clara. Cabelo branco desgrenhado saindo dos dois lados de uma careca alta.
> **Óculos redondos e grossos, empurrados para a testa** — e um segundo par esquecido
> pendurado na gola. Barba branca curta e mal aparada. **Olha para o espectador com
> meio segundo de atraso, sobrancelhas erguidas, boca entreaberta como quem ia dizer
> alguma coisa e perdeu.** Usa um **cardigã de tricô cor de mostarda escura** com
> cotoveleiras, sobre camisa e gravata torta. **Textura repetida:** as **tranças
> verticais e paralelas do tricô** do cardigã, todas da mesma largura. Fundo:
> **marrom-couro médio escuro**, luz lateral baixa.

#### 6. `noctua` — Noctua, a Coruja do Arquivo

> É **Noctua, uma coruja que guarda o Arquivo da Academia**. Coruja de verdade, não
> desenho animado e não humanizada: sem roupa, sem chapéu, sem mãos. Plumagem
> castanho-escura e creme, disco facial claro e bem marcado, tufos de pena erguidos
> sobre a cabeça. **Olhos enormes, âmbar, fixos e absolutamente parados** — encara o
> espectador sem piscar. Postura ereta e imóvel. Em volta do pescoço, uma **fita
> estreita de couro com uma etiqueta de arquivo** pendurada — a única coisa que a
> liga à Academia. **Textura repetida:** as **penas do peito, em fileiras sobrepostas
> e regulares**, como escamas. Fundo: **verde-oliva escuro**, luz lateral fraca.

---

### Ala 4 — o Observatório ★★★★

#### 7. `gael` — Gael, o Relojoeiro

> É **Gael, o relojoeiro da Academia**, que cuida dos relógios e do mecanismo do
> telescópio. Homem de uns quarenta anos, pele morena, cabelo preto curto penteado
> para trás, bigode aparado. **Uma lupa de relojoeiro presa na testa por uma tira de
> couro**, sobre um dos olhos. Expressão econômica: boca fechada, olhar direto e
> paciente, sem sorriso. Usa um **avental de couro escuro** sobre camisa de trabalho,
> com **uma fileira de pequenos bolsos de ferramenta** no peito. **Textura repetida:**
> os **bolsos, todos do mesmo tamanho, em linha** no peitilho do avental. Fundo:
> **azul-petróleo escuro** — é aqui que o acento frio do elenco começa. Luz baixa,
> vinda de lado.

#### 8. `vespera` — Madame Véspera, a Astrônoma

> É **Madame Véspera, a astrônoma da Academia**, uma mulher alta de uns cinquenta anos,
> pele muito clara, feições angulosas. Cabelo preto azulado, liso, repartido ao meio e
> preso baixo. **Expressão neutra e distante, olhar direto, boca fechada.** Usa um
> **manto de gola alta em azul-petróleo profundo**, fechado à frente, com **uma fileira
> de pequenos botões redondos** subindo pelo peito. Nos ombros do manto, um bordado
> discreto de pontos regulares, como um mapa de estrelas. **Luz noturna, vinda de
> baixo e de lado, endurecendo o maxilar.** **Textura repetida:** os **botões
> redondos, iguais e alinhados**, e os **pontos regulares do bordado**. Fundo:
> **azul-noite muito escuro, quase sem detalhe**.

---

### Ala 5 — a Arena ★★★★★

#### 9. `isis` — Ísis, a Campeã do Torneio

> É **Ísis, a aluna veterana que ganhou o torneio da Academia três vezes**. Mulher
> jovem, uns dezoito anos, pele escura, **cabelo crespo volumoso preso alto**, com um
> aro de metal simples atravessado. Maxilar erguido, olhar direto e frontal, **um
> canto da boca subindo: competitiva e cordial ao mesmo tempo, nunca arrogante.**
> Usa uma **jaqueta de treino curta cor de vinho intenso**, gola erguida, com **uma
> fileira de listras paralelas** descendo pelo ombro. **Luz dura e frontal, o
> contraste mais alto do elenco.** **Textura repetida:** as **listras paralelas da
> jaqueta**, todas da mesma largura, e as **mechas do cabelo crespo em tufos
> regulares**. Fundo: **terracota escura saturada**, o mais quente e mais forte dos
> dez.

#### 10. `visitante` — O Visitante

> É **O Visitante: alguém que veio de fora e está passando uma temporada na
> Academia. A identidade dele é um mistério, e o retrato não a revela.** Uma figura de
> pé, de frente, com um **capuz largo de pano pesado cor de ardósia** cobrindo a
> cabeça inteira. **Dentro do capuz não há rosto visível — só sombra, e dois pontos de
> luz fria onde estariam os olhos.** Não é caveira, não é monstro, não é vazio total:
> é uma pessoa cujo rosto simplesmente não se vê. Postura ereta e perfeitamente
> calma; o capuz e os ombros formam uma silhueta larga e simétrica, **a mais
> reconhecível do elenco só pelo contorno**. Em volta dos ombros, uma **fileira de
> dobras paralelas e regulares** do pano pesado. **Cortês e sereno, jamais ameaçador
> ou sinistro — ele pertence à Academia.** **Textura repetida:** as **dobras paralelas
> e iguais** do capuz e dos ombros. Fundo: **cinza-ardósia muito escuro, liso**, com o
> contorno do capuz recortado por uma luz de borda fria.

---

## 6. Depois

1. Salve cada arquivo em `public/bots/<slug>.png` — **o nome é o slug**, e é assim que
   [`BotAvatar.tsx:47`](../src/components/bots/BotAvatar.tsx#L47) o encontra.
2. **Os dez têm de estar no disco antes de a migration do elenco descer.** Slug novo
   sem PNG no disco dá 404 na cara do aluno.
3. Confira à vista, com os dez encolhidos a 64 px em círculo, lado a lado: a §3 diz o
   que reprova.
4. Os PNG antigos (`leo`, `skippy`, `tome`, `sargento-pardo`, `iris`, `breno`, `silas`,
   `capita-lucia`, `cassio`, `helena`) saem do repositório no mesmo commit. O git
   guarda.

---

## 7. O frame não muda — decidido em 2026-08-21

**O produto nunca mostra o retrato maior que 96 px nem fora do círculo** (§1), e
**fica assim**. Decisão do Doug: *"deixa como está hoje em dia."*

Portanto vale **(A): a arte se adapta ao frame que existe** — close, fundo simples,
progressão por valor e silhueta. Custo zero de código, e o enquadramento da §4 está
fechado.

**A alternativa descartada, registrada para não voltar sozinha:** dar ao produto uma
superfície que mostre o retrato grande e quadrado (o pré-jogo era a candidata — hoje
usa `lg`, 80 px, em círculo). Ela faria o cenário voltar a valer e devolveria sentido
à progressão por nitidez de fundo. Se algum dia for reaberta, **este doc é reescrito
antes de qualquer arte nova**, porque um close não vira retrato de corpo depois.
