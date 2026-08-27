# Os cabelos — o elenco refeito no padrão tonal

> **A decisão, 2026-08-22.** O Doug olhou a `rosto-barba-trancada` v10 e disse
> *"ficou perfeito, a melhor arte, quero este padrão sempre"*. O elenco de cabelo é o
> padrão VELHO — geometria declarada com 2 a 4 cores chapadas —, e ele decidiu:
> **os cinco modelos são refeitos**, elenco inteiro, no acabamento da trancada.
> Coerência visual vale mais que o trabalho já feito.
>
> **Uma peça por vez.** Cada uma atravessa a esteira, vai à folha, ele vê local e
> aprova antes da próxima. **Nenhum modelo sai de produção antes de ter substituta.**

Este arquivo é o **molde do pedido**. A lei de arte que julga a peça está em
[doc 23](../../../docs/avatar/23-linha-de-arte.md); o envelope espacial do slot — onde
o cabelo cabe, medido — está em
[doc 24 §4](../../../docs/avatar/24-cabelo-e-barba-ficha-do-slot.md). O registro de
execução, rodada a rodada, vai em [ESTADO-DA-ROTA.md](ESTADO-DA-ROTA.md).

| ordem | modelo | arte de partida | estado |
|---|---|---|---|
| **B** | `chanel` | `chanel.png` — a forma já aprovada | ✅ **promovido** em 2026-08-22 |
| C | `espetado` | `entrada.png` | ❌ **reprovado e APAGADO** em 2026-08-24 |
| D | `assimetrico` | `entrada-2.png` | ✅ **promovido** em 2026-08-22 |
| E | `coque` | **nenhuma** — arte do zero | ❌ **reprovado 2× e APAGADO** em 2026-08-24 |
| F | `moicano` | **nenhuma** — arte do zero | ✅ **promovido** em 2026-08-22 |
| — | `burst-fade` | **nenhuma** — modelo NOVO, fora dos cinco | ✅ **promovido** em 2026-08-22 |

## O elenco fechou em QUATRO, e as duas que faltavam foram apagadas

**Decisão do Doug, 2026-08-24.** O plano dizia *"nenhuma peça some antes de ter
substituta"*. Ele revogou a regra com a razão à vista: as duas que restavam já tinham
sido **reprovadas por ele**, e peça reprovada em produção esperando substituta é o
contrário do que a régua serve para fazer.

| peça | a reprovação, medida |
|---|---|
| `espetado` | passou todos os gates e ele reprovou a olho: *"cor vazando pelo contorno do cabelo em todo o rosto, especialmente acima da sobrancelha direita"*. Cinco réguas não separaram a reprovada da aprovada — **espessura está descartada**, e o próximo pedido ataca a **opacidade** do contorno |
| `coque` | duas vezes. Na segunda, medido: **8 921 px (9,0% da peça) fora do `viewBox`**, cortados numa linha reta de 214 px |

**Ele vai desenhar arte nova**, e ela não precisa se chamar `espetado` nem `coque`: o
slot está livre. O que sai do disco com elas — `entrada.png`, `entrada-2.png`,
`espetado.png`, `espetado-crua.jpg` e 9,7 MB de pastas de bancada — não volta, e o
**defeito registrado do `arte:borda` morreu junto** (a `entrada.png` era a única
entrada dele).

O que continua valendo deste arquivo é **tudo daqui para baixo**: as amarras do slot,
o teto do `viewBox`, a regra do contorno azul-marinho e o molde do pedido. Para a arte
nova, troque a chave e o parágrafo da forma.

---

## O que muda em relação ao pedido da barba

**Três coisas, e só três.** O resto é o mesmo texto de
[PEDIDO-BARBAS.md](PEDIDO-BARBAS.md), pelo mesmo motivo: cabelo e barba são a mesma
família (doc 24 §1), recolorem pela mesma variável e passam pela mesma esteira.

1. **o parágrafo da peça** — a descrição do modelo, em fios contados;
2. **o "onde cabe"** — o parágrafo do cabelo do doc 24 §5.6 no lugar do da barba,
   mais três restrições nomeadas (olhos, sobrancelhas, boca);
3. **a arte de partida** — três dos cinco **já têm forma aprovada**, e é ela que vai
   como 2ª imagem. Ver a seção seguinte.

## O fluxo, em duas imagens — e por que não em três

| imagem | papel | o que se diz dela |
|---|---|---|
| **1ª** | **a base** | `base-oficial.png` — o avatar base, careca. **Não muda um pixel.** É o único boneco que o Gate −1 aceita |
| **2ª** | **a forma** | a arte ATUAL do modelo (`chanel.png`, `entrada.png`, `entrada-2.png`) — **só a silhueta**, que o Doug já aprovou |

**A 3ª imagem não vai**, e é ganho, não corte. Ela carregava o *nível de acabamento*,
e desde 2026-08-22 o acabamento da trancada está medido e escrito em palavras (doc 24
§5). Anexar a trancada aqui arrastaria **textura de pelo** para uma peça que é cabelo
— é a contradição que o doc 23 §9 alerta: *o nível atravessa slots, a textura não*.

⚠️ **A 2ª imagem é o mesmo boneco da 1ª**, e isso é uma vantagem que a barba não
teve. As artes de cabelo do repositório foram desenhadas **sobre esta mesma base**, e
o Gate −1 já as aprovou uma vez. Não há registro a refazer, não há personagem estranho
a ignorar: a tarefa é **repintar por dentro**, mantendo a silhueta.

**Para o `coque` e o `moicano` não há arte de partida.** Neles a 2ª imagem vem do
ChatGPT, como nas barbas, e vale o alerta de sempre — ela virá de outro gerador, com
outro boneco e outra paleta, então as cláusulas de cor e de "sem braços" pesam mais.

---

## As amarras do slot — medidas, valem para todo cabelo novo

Do doc 24 §4, que mediu as três artes do repositório. **É faixa observada, não teto
aprovado**: o slot ainda não tem peça-padrão, e a primeira aprovada passa a ser ela.

| | |
|---|---|
| massa | **113 a 196 mil px** — o cabelo é 2 a 4× a barba. Cabelo com massa de barba está ralo |
| largura | **nunca abaixo de ~430 u** — o crânio tem 364 e o cabelo o veste por fora |
| topo | **pode passar do topo da IMAGEM, nunca do `viewBox`.** São coisas diferentes e a `coque` morreu na diferença — ver o aviso abaixo |
| piso | quem desce, desce muito (596 u) ou quase nada (239 u). Isso é o elenco atual, não uma lei |

⚠️ **O TETO REAL É O `viewBox`, e ele corta reto.** A base tem 92 px de folga acima da
coroa no PNG de 1024, e é fácil ler isso como "a peça pode subir o quanto quiser". Não
pode: o avatar montado é um `viewBox` de **500 × 700 que começa em y = 0**, e tudo
acima disso **some com um corte horizontal**, não com uma ponta.

A `coque` de 2026-08-22 foi reprovada por causa disto, medido: a caixa da máscara dela
começava em **u y −47,5**, e **8 921 px — 9,0% da peça — ficavam fora**, guilhotinados
numa linha reta de **214 px de largura**. O `chanel` aprovado começa em u y **8,3** e
tem **0 px** cortados.

Na prática, para o pedido: **peça que prende cabelo em cima — coque, rabo, crista —
precisa nascer mais baixa do que o gerador quer desenhar.** Vale dizer com todas as
letras que a peça inteira tem de caber na imagem com folga, e que o alto dela não
encosta na borda de cima.

⚠️ **O que o cabelo NÃO pode**, e é do compositor, não de gosto (doc 23 §7.1): capuz,
capa, gola por trás, ou cabelo passando **por cima do ombro**. O que fica atrás da
cabeça precisaria de `extensao` em vetor com `atras: true`, e **a esteira de traçado
disso não existe**. Pedir arte assim é pedir o que o programa não monta.

⚠️ **A boca é inerte, sem tolerância.** Nenhum cabelo do elenco chega perto dela, mas
a esteira mantém a janela da boca aberta e o gate conta: **0 janelas de feição** numa
peça de cabelo. Uma janela ali quer dizer que a arte encostou onde não devia.

## O ciano não se pede — quem o produz é o programa

O gerador devolve na cor que quiser, e é **`restaurar-peca.ts`** que leva o matiz para
180° preservando saturação e luminância. Pedir cor instrumental ao gerador para
repintar depois é uma das quatro coisas que a Regra Inviolável nº 4 proíbe por nome, e
o ciano do gerador morreu em 2026-08-13.

## O contorno da peça se pede em AZUL — decisão do Doug, 2026-08-22

> ⚠️ **A COR FOI CORRIGIDA EM 2026-08-24, e o molde estava mandando a que FALHA.**
> Este arquivo pedia `#000080` em quatro lugares. O que o Doug realmente envia ao
> gerador, e o que as 14 peças aprovadas usaram, é **`#0000C8`** — mais claro no
> canal azul, e não por gosto: `restaurar-peca.ts:114-117` registra que o azul
> escuro **não passa** na máscara. *"O Gemini entregou p50 de 47 no canal azul, e
> com o antialias a diferença média caiu a 23,2 — meio pixel abaixo do limiar
> (`NIVEL = 24`), e metade da linha se perdeu."*
>
> Quem tivesse copiado este molde teria mandado a cor que perde metade da linha.

**A causa, nas palavras dele:** *"a linha do contorno do cabelo é igual ao contorno do
boneco e, quando a linha do contorno do cabelo se conflita com o do avatar, a esteira
erra."* O passo 1 da esteira é *peça = o que difere da base*, e *preto sobre preto
difere ~0*. É UM mecanismo com dois sintomas, os dois já pagos:

- fio preto **sobre** o traço do boneco fica FORA da máscara — o furo do maxilar da
  `trancada` v10, o canal da calota medido no Bloco A;
- traço preto **novo** rente ao do boneco é indecidível — a mancha no ombro do
  `chanel` de 2026-08-22 (1.928 px na esquerda + 93 na direita), que o Doug pegou a
  olho com todos os gates verdes.

**A regra: o contorno da peça vem em azul-marinho `#0000C8`, e FICA assim no PNG.**
Não é o ciano proibido — o ciano era cor instrumental para repintar cor FINAL, e isto
é desambiguação de LINHA numa peça que recolore inteira. Os dois porquês medidos:

- **luminância ~9**: no render o contorno sai PRETO de graça — a máscara de tom
  carrega luminância, e onde ela é ~0 aparece a forma de baixo, `var(--av-linha)`.
  Nenhum passo de "voltar ao preto" existe, nem pode existir: `arte:cabelos --check`
  re-roda a esteira sobre o PNG do repositório, e um PNG re-escurecido à mão
  recriaria a ambiguidade a cada verificação. Cor mais clara que lum 40 é proibida —
  é o defeito registrado da `entrada.png` (traço cinza lum 70, `arte:borda` reprova);
- **128 níveis no canal azul** contra o preto do boneco: a esteira separa com 24 por
  canal — são 5× a margem, com sobra para o reencode do Gemini (que o Gate −1 já
  tolera, medido q95→q60).

Para o olho é quase preto. Quem precisa da diferença é a máquina.

---

# Pedido B — `chanel`

**Anexe as duas imagens**, `base-oficial.png` primeiro e `chanel.png` em segundo.
**Salve o retorno cru em** `scripts/avatar/arte/chanel-v2-crua.png` — o `-crua` é a
convenção da trancada e existe para o passo 2 nunca escrever por cima da procedência.

⚠️ **O nome novo não é capricho: `chanel.png` é a 2ª imagem E a peça em produção.**
Sobrescrevê-la apagaria a forma que o pedido manda copiar e moveria o `CABELOS.chanel`
de hoje no mesmo gesto. A antiga só sai do disco no Bloco G, depois que as cinco
tiverem substituta aprovada.

> Edite a primeira imagem. Não crie um personagem novo.
>
> As duas imagens são o MESMO boneco, com o mesmo tamanho e o mesmo enquadramento. A
> primeira é ele careca. A segunda é ele com o cabelo que eu quero, **e a forma desse
> cabelo está certa** — o que está errado é só o acabamento dele, que é chapado.
>
> **A sua tarefa: redesenhar esse mesmo cabelo, com a mesma silhueta, sobre o boneco
> da primeira imagem — trocando o acabamento chapado por fios.**
>
> Não invente um corte novo. Não "melhore" a forma. Não alongue, não encurte, não
> mude a franja. A borda externa do cabelo fica **onde ela está na segunda imagem**.
> O que muda é só o que acontece **por dentro** dela.
>
> **O BONECO DA PRIMEIRA IMAGEM NÃO MUDA NADA.** A imagem que você devolver será
> comparada com a primeira pixel a pixel. Ficam idênticos: o tamanho do arquivo
> (1024 × 1024), o enquadramento, o tamanho do boneco, a posição do boneco, o formato
> da cabeça, o formato do corpo, os olhos, as sobrancelhas, **a boca**, a cor da pele,
> a cor da roupa, o fundo bege claro, e todas as linhas pretas de contorno que já
> existem. Não redesenhe o contorno do boneco. Não redesenhe as feições. Não mova, não
> recorte, não redimensione, não reenquadre e não gire.
>
> A única tinta nova na imagem é o cabelo.
>
> **A FORMA DO CABELO, como ela está na segunda imagem:** um bob curto e liso, de
> risca no meio, que veste o crânio por fora e desce dos dois lados do rosto até
> **pouco abaixo do queixo**, com as pontas viradas levemente para dentro. A franja
> cai sobre a testa sem chegar aos olhos. Se a descrição e a segunda imagem
> discordarem em algum detalhe, **siga a segunda imagem**.
>
> **Onde o cabelo pode existir.** Ele veste o crânio por fora e pode passar do topo
> da imagem. Ele **não passa por cima do ombro** nem por trás da cabeça, e não vira
> capuz, capa nem gola.
>
> **Os olhos ficam inteiramente livres** — nenhum fio sobre eles. As sobrancelhas
> podem acabar cobertas pelo cabelo se a forma pedir, e tudo bem; o que você **não**
> faz é redesenhá-las, movê-las ou mudar a espessura delas. **A boca fica exatamente
> como está**, sem um pixel de tinta nova em cima dela.
>
> **ESTE BONECO NÃO TEM BRAÇOS.** Ele não tem braços, mãos, ombros salientes, pernas,
> pés, orelhas nem pescoço. O corpo dele é uma peça só em forma de sino, e a cabeça
> senta direto em cima dela. Não acrescente nenhuma dessas partes, nem desenhando, nem
> sugerindo com manga, cava, punho ou sombra — **mesmo que a segunda imagem tenha**.
>
> **A COR DO CABELO É SUA — pinte na cor que ficar melhor.** Um castanho, um preto, um
> ruivo, o que a peça pedir. Não existe paleta técnica a seguir, e você não precisa
> acertar cor nenhuma: a cor que você escolher **será trocada por programa depois**, e
> quem escolhe a cor final é a criança que usa o avatar.
>
> **O acabamento.** A peça é feita de **fios (ou mechas) contados**, não de massa
> lisa. Cerca de **um quinto** dela é linha azul-marinho `#0000C8` — o contorno
> externo mais as linhas finas que separam as mechas por dentro. **Todo o resto é meia-luz que varia**: a luz
> corre por dentro da forma, no sentido dos fios, em muitos tons contínuos. **Não
> pinte a peça com uma cor chapada e não use degradê liso de aerógrafo.** O brilho é
> pontual, na crista dos fios — **sem mancha de reflexo**.
>
> **Sem sombra. NÃO ESCUREÇA A ROUPA NEM A PELE EM VOLTA DA PEÇA.** Não desenhe
> sombra da peça sobre o boneco, nem do boneco sobre a peça, nem sombra no chão. A
> roupa encostada na peça fica **exatamente com a cor que já tem**. O volume vem da
> própria luz interna da peça.
>
> **O contorno.** A peça é contornada por uma linha **da mesma espessura da linha
> que contorna o corpo do boneco** — compare com ela na imagem e iguale. **A cor
> dessa linha é AZUL-MARINHO BEM ESCURO, `#0000C8`** — não preta, não cinza: um azul
> tão escuro que quase parece preto. TODA linha da peça usa esse azul: o contorno
> externo e as linhas finas que separam as mechas por dentro. As linhas pretas do
> BONECO continuam pretas como estão — o azul é só das linhas do CABELO. A linha
> **dá a volta completa** e não afina em lugar nenhum, **inclusive embaixo**, onde a
> peça encosta na roupa ou no fundo. A peça nunca termina com a cor dela encostando
> direto em outra coisa.
>
> **A borda é serrilhada** pelo fim de cada fio — não é curva lisa nem reta.
>
> **O que não fazer, de novo, porque cada um destes já apareceu:** não acrescente
> braços, mãos, orelhas nem pescoço. Não desenhe sombra projetada. Não mude o fundo.
> Não escreva texto. Não deixe o contorno da peça em preto nem em cinza — ele é o
> azul-marinho `#0000C8` descrito acima. Não pinte o cabelo por cima da linha do
> ombro do boneco. Não cubra os olhos nem toque na boca.
>
> Devolva um único PNG de 1024 × 1024.

---

## A esteira, depois que o PNG chegar

A ordem é a do **rosto** (doc 19 §13) — limpeza ANTES do gate, porque quem cria o
ciano é `restaurar-peca.ts` e o Gate −1 mede a peça já na língua da rota.

Com o `chanel` como exemplo — troque a chave nos outros quatro.

```
1.  o PNG do Gemini      →  scripts/avatar/arte/chanel-v2-crua.png

2.  npx tsx scripts/avatar/arte/restaurar-peca.ts \
      scripts/avatar/arte/chanel-v2-crua.png \
      scripts/avatar/arte/chanel-v2.png
                                     ← matiz → ciano, resto → base. QUEM CRIA O CIANO
                                       É ESTE PASSO, e é por isso que ele vem antes

3.  npm run arte:gate  -- scripts/avatar/arte/chanel-v2.png    ← o boneco não se mexeu
    npm run arte:traco -- scripts/avatar/arte/chanel-v2.png    ← o traço do boneco intacto
    npm run arte:borda -- scripts/avatar/arte/chanel-v2.png    ← o contorno da peça é PRETO

4.  npx tsx scripts/avatar/arte/barba-para-formas.ts \
      scripts/avatar/arte/chanel-v2.png --slot cabelo
                                     ← o laudo: massa, componentes, figurinha, esticão,
                                       caixa do tom, bytes de `d`. Nada é escrito ainda

5.  npm run arte:folha-cabelo -- chanel-v2
                                     ← a folha: arte · traçado · só o cabelo ·
                                       + trancada · + trancada em outra cor,
                                       com os minis a 32 e 56 px

6.  parecer do Doug no /dev/avatar-kokeshi   ← A ÚNICA APROVAÇÃO QUE EXISTE

7.  promoção, só depois do parecer:
      a) `NOMES` em scripts/avatar/arte/cabelos.ts ganha `"chanel-v2": "Chanel"`
      b) npm run arte:cabelos          ← escreve o literal e o PNG de tom
      c) CABELOS.chanel espalha ...CABELOS_DA_ARTE["chanel-v2"] com id/nome próprios
      d) o id migra de MODELOS_TRACADOS para MODELOS_TONAIS
      e) npm run avatar:congelar       ← regrava o selo DAQUELA peça, nunca em lote
      f) npm run verify:all
```

**O passo 6 não se pula e não se substitui por régua.** O doc 23 §6 diz, por escrito,
que a folha é a única aprovação que existe — e a peça de cabeça se julga a **32 px**,
que é o tamanho que a criança vê.

## Se o Gemini vier em outra cor, ou chapado

- **outra cor** — não é problema. `restaurar-peca.ts` leva o matiz para 180°;
- **chapado** — é problema, e a esteira reprova sozinha: sem tom para esticar, `p2` e
  `p98` da luminância caem no mesmo valor e `construirPecaTonal` lança. Refaça o
  pedido reforçando o parágrafo do acabamento;
- **com braços, orelhas ou pescoço** — refaça. Não conserte à mão: a mão que conserta
  é a mesma que move o boneco, e o Gate −1 pega.

## Não passe por Canva nem por Adobe

Qualquer editor que reencode o PNG mexe no antialias e no perfil de cor, e o Gate −1
compara pixel a pixel contra a base. O caminho é: gerador → disco → esteira.
