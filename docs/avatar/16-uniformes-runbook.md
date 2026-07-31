# Uniformes — o processo, de ponta a ponta

> **Leia isto antes de gerar arte de uniforme.** Cada regra e cada número aqui
> saiu de uma rodada que falhou. Seguir o documento custa minutos; redescobrir
> custou um dia.
>
> Companheiros: o doc **15** tem o plano e as regras gerais de arte (§7, §7b,
> §7c); o **12** tem as decisões numeradas. Onde divergirem, o 15 vence.

---

# 1. O princípio que faz tudo funcionar

> **A silhueta do avatar pertence ao SISTEMA, não à imagem gerada.**

Nenhum gerador de imagem reproduz a silhueta da base. Medido entre duas
ilustrações independentes do mesmo personagem: a divergência vai de **8 a 52
unidades** conforme a altura, e **nenhuma transformação afim única corrige** —
porque o erro é função da altura, não uma constante.

A saída não é fazer o uniforme caber. É o uniforme ser **grande demais** e o
sistema tirar o excesso:

- **sobra** se remove por máscara, de forma determinística;
- **falta** exigiria inventar desenho.

Por isso o pedido ao gerador é *folgado*, nunca justo. Duas tentativas de encaixe
justo falharam antes disto.

---

# 2. O que pedir ao gerador de imagem

Cole no ChatGPT **anexando o PNG mestre da base** — sem a referência ele desenha
outro personagem. O mestre agora vive **dentro do repositório**:

```
scripts/avatar/fonte/referencia-base.png
```

> Ele morava em `Downloads`, com caminho absoluto no código, e **sumiu de lá duas
> vezes nesta fase** — a segunda em silêncio, porque o uso na folha de conferência
> é protegido por `existsSync` e a figura "original (PNG)" simplesmente parou de
> aparecer. A cópia commitada encerra isso.
>
> **Os pedidos prontos, um por patente, estão no [doc 18](18-uniformes-blocos.md).**
> O bloco genérico abaixo é o molde deles.

```
EDITE a imagem anexada. Não desenhe um personagem novo: parta desta imagem e
mude só a roupa. O corpo, a cabeça, o rosto, as mãos, os pés, a pose, o tamanho
e a posição de tudo continuam EXATAMENTE onde estão.

MANTENHA IGUAL: rosto, orelhas, formato e tamanho da cabeça, proporção
cabeça-corpo, pose dos braços e das mãos, enquadramento de corpo inteiro
centralizado, fundo transparente.

O UNIFORME:
- <cor> em tom médio — ver a tabela de matiz abaixo
- manga comprida e perna comprida
- gola, cinto e um bolso no peito, todos GRANDES e simples
- BOTAS cobrindo os pés inteiros, até acima do tornozelo
- as MÃOS ficam descobertas, sem luva
- FOLGADO: ombro, manga, calça e bota alguns por cento maiores que o corpo.
  Tecido ultrapassando um pouco a silhueta é melhor que faltando.

TODO DETALHE EM TOM DA MESMA FAMÍLIA OU ESCURO QUASE PRETO:
- NÃO use marrom, bege, caramelo, dourado nem couro em nada
- NÃO use nenhum tom alaranjado ou terroso

NÃO FAÇA:
- sem textura de tecido, sem trama, sem camuflagem: pano liso
- sem brilho, aura ou glow em volta do personagem
- sem sombra no chão, cenário, texto, moldura ou marca d'água
- sem luva, capacete, mochila ou arma

Legível a 56 px de altura. Entregue em PNG com fundo transparente, na maior
resolução possível.
```

## 2.1 A tabela de matiz — a regra que mais falha

A **pele vive entre 17° e 29°**. O classificador separa pele de pano por matiz, e
`MATIZ_PANO` é **45°**. Então:

| cor do uniforme | matiz | serve? |
|---|---|---|
| verde-oliva `#7A8C55` | 80° | ✅ folga de 35° |
| azul-acinzentado `#6B87A8` | 210° | ✅ folga enorme |
| cinza-azulado | 200–220° | ✅ |
| azul-ardósia `#3E5670` | 211° | ✅ o Aspirante |
| creme-pêssego | ~30° | ❌ **grudado na pele** |
| marrom, caramelo, couro | 20–30° | ❌ **vira pele** |
| dourado `#C9B37E` | 42° | ❌ por 3° |
| **cinza ou branco NEUTRO** (`R=G=B`) | **0°** | ❌ **matiz indefinido vira 0** |

**Forma descartada não muda de cor: ela SOME.** Só o pano entra no asset, então um
cinto reprovado deixa o fundo de segurança chapado no lugar do cinto.

A última linha é a que ninguém antevê. Com `R=G=B` o delta é zero e o matiz sai
**0°**, abaixo do corte. **Um galão branco ou um cinto cinza neutro desaparece.**
Detalhe claro precisa ser *tingido* — `#D8DEE6` (214°) e `#B9C4D0` (211°) passam;
`#F0F0F0` não.

**Uma bota marrom não é "cor errada": ela é entendida como PELE** e muda de cor
junto com o tom do aluno. Foi medido: numa rodada em que o macacão saiu
creme-pêssego, o tronco saiu salpicado de manchas cor de pele.

**A cor que você escolher é DEFINITIVA.** Pela emenda à D27, só pele e cabelo
recolorem. A cor do uniforme **é o sinal da patente**, e duas peças da mesma
patente precisam sair na mesma cor entre pedidos, porque nada as harmoniza depois.

## 2.2 Quatro armadilhas do caminho da arte

1. **O "SVG" que o Canva exporta não é vetor.** É um PNG em base64 dentro de um
   `<svg>`, com a transparência num SEGUNDO PNG cuja luminância vira o alfa.
   Extrair só o de cor entrega fundo preto, e o traçador desenha esse preto como
   forma. **Exporte PNG do Canva, não SVG.**
2. **Confira a transparência antes de vetorizar.** Uma rodada veio com fundo
   branco opaco (0% de transparência) e outra com um glow: **10,6% do quadro em
   meio-tom de alfa**, contra 1,5% na arte que funcionou. O glow virou ~60 formas
   cinzentas no traço, e cinza cai na família da tinta do olho.
3. **O gerador redesenha em vez de editar.** Aconteceu duas vezes seguidas. Se
   voltar rosto diferente, contorno novo ou proporção nova, é isso — e não se
   corrige com prompt melhor. Regere.
4. **Sem textura de tecido.** Uma trama quase invisível no PNG o traçador
   transforma em regiões esfarrapadas do tamanho do tronco.

---

# 3. Da arte ao arquivo

```
gerar por IA (PNG)  →  refinar no Canva  →  exportar PNG TRANSPARENTE
                    →  vetorizar (conversor da Adobe)  →  SVG
                    →  commitar em scripts/avatar/fonte/uniformes/<nome>.svg
                    →  npm run avatar:garment
```

**Onde o arquivo mora.** A pasta de arte é `C:\Users\Lenovo\Desktop\avatar Canva`
— é onde a peça é trabalhada. O **repositório é onde a peça aprovada entra**.
Caminho absoluto no Desktop torna o gerador e todo gate sobre ele impossíveis de
rodar em máquina limpa, e isso já quebrou **duas vezes** nesta fase com o mesmo
arquivo: o PNG mestre saiu do Downloads, e depois mudou de pasta. Por isso ele
agora é `scripts/avatar/fonte/referencia-base.png`, commitado.

**Conferência rápida do SVG antes de rodar:** ~600 paths e ~30 cores distintas é
saudável. **250 cores** significa fundo ou glow no PNG.

---

# 4. Rodar o gerador

```bash
npm run avatar:garment                                   # o Soldado
UNIFORME=caminho.svg UNIFORME_NOME=nome npm run avatar:garment   # outra peça
```

Saída em `scripts/avatar/uniformes/<nome>-{128,256,512,1024,1920}.png`,
diagnósticos em `.scratch/uniforme/`. **Sai com código 1 se algum gate reprovar.**

Os assets ficam em pasta de **estágio**, não em `public/items/`: o
`verify:avatar-assets` reprova arquivo órfão, e a linha do uniforme em `items` só
nasce no Bloco 7b.

---

# 5. Como o asset é montado

Três camadas assadas, de baixo para cima. **A ordem e o recorte de cada uma
custaram um defeito.**

| camada | recorte | cor | o defeito que ela evita |
|---|---|---|---|
| fundo de segurança | `corpoVestido` **sem** a folga da bota | cor média do pano | buraco na borda, visível só em fundo colorido |
| oclusão do pé | `pes` ∩ `cobertura`, dilatada 2 px | cor da **bota** | faixa de pele sob as solas |
| arte do uniforme | `cobertura` **menos** `peleFrente` | a própria arte | — |

## 5.1 As máscaras, e de onde saem

Não há autoria manual. **O macacão de treino da base já É a cobertura "manga
longa + calça"** — cobre tronco, braços até o punho e pernas até o tornozelo, e
exclui cabeça, mãos e pés, porque é isso que ele veste.

- **`cobertura`** — o TETO do pano. Macacão + folga de gola + folga de bota,
  dilatado 40 unidades. Dilatar é seguro: é teto, não piso.
- **`peleFrente`** — cabeça, orelhas, pescoço e mãos. O asset sai com **BURACO**
  aqui, e a base aparece por ali sozinha. É o que dispensa uma terceira camada e
  deixa gola e punho passarem por baixo da pele sem costura.
- **`corpoVestido`** — a região que o uniforme substitui, e o limite do fundo.
- **`pes`** — a pele abaixo do tornozelo. Fica **fora** de `peleFrente` de
  propósito: o pé vai por baixo da bota, não na frente dela.

## 5.2 Registro

Escala X pela altura da figura; escala Y por **dois marcos**, pescoço e sola. A
âncora dupla é o que resolve o pé aparecendo por baixo da bota, que é folga
**vertical** e nenhuma dilatação corrige. A anisotropia que sobra é de ~1,5%,
invisível.

O pescoço de cada peça é achado sozinho: a linha mais estreita da silhueta na
metade de cima. O mesmo critério que acha o da base — por isso o registro não
depende de o gerador acertar tamanho ou enquadramento.

**`CORRIGE_X = 40`, e é medido:** o centro da caixa da figura **mente**, porque as
botas abrem para os lados e puxam esse centro para fora do eixo do corpo.

## 5.3 Em runtime

`<use>` da base com o macacão escondido, mais **um** `<image>`. **Zero máscara,
zero filtro** — máscara é ferramenta de build. O ranking mostra 30 avatares, e
filtro força composição fora da tela por instância.

E a pele continua recolorível nos 8 tons, porque ela nunca sai do SVG da base. O
que virou raster é só o uniforme, que por decisão permanente nunca muda de cor.

---

# 6. As variantes

| altura | dimensão | comprimido | **decodificado** |
|---|---|---|---|
| 128 | 85×128 | 6 KB | **0,04 MiB** ← o ranking |
| 256 | 170×256 | 17 KB | 0,17 MiB |
| 512 | 341×512 | 45 KB | 0,67 MiB |
| 1024 | 682×1024 | 116 KB | 2,66 MiB |
| 1920 | 1278×1920 | 265 KB | **9,36 MiB** |

**Peso de arquivo não é memória**, e foi o erro que quase passou: 30 uniformes
distintos no master chegariam a **281 MiB de bitmap**. Com a de 128 no ranking:
**1,25 MiB**.

**A variante é escolhida por altura CSS × devicePixelRatio**, nunca por altura
CSS. A 70 px com DPR 2 o navegador precisa de 140, e servir a de 128 seria
**ampliar**.

```ts
const preciso = alturaCss * Math.min(Math.max(dpr, 1), 3);
const variante = VARIANTES.find((h) => h >= preciso) ?? 1920;
```

Cada variante é rasterizada **direto do vetor** — reduzir a de 1920 em cascata
acumula perda e rasteriza a solda errado nos tamanhos pequenos. E a largura sai
sempre da razão canônica, **nunca herdada** de outra variante.

---

# 7. Os gates, e o que cada reprovação significa

| gate | limite | se reprovar, a causa provável |
|---|---|---|
| máscaras distintas | pano > fundo | alguém unificou os dois recortes |
| **fundo representativo** | dista ≤ 40 da cor dominante | a cor média pegou um detalhe em vez do pano — **vira orla na silhueta inteira** |
| alfa fora da cobertura | ≤ 0,5% | o recorte não está sendo aplicado |
| cabeça e mãos vazadas | ≤ 0,5% sobre `peleFrente` | o buraco não foi aberto; a gola cobriria o rosto |
| pedestal sob as botas | ≤ 5.000 px da cor do fundo | o **fundo** escorreu para a folga da bota |
| **pé visível sob a bota** | **0 px** | a **oclusão** não cobre. Não conserte preenchendo a folga com a cor média — isso recria o pedestal |
| caixa e centro entre variantes | ≤ 1 px | largura herdada em vez de canônica |
| memória do ranking | ≤ 4 MiB | a variante de 128 cresceu |
| halo na borda | ≤ 2% acima de 40 | resíduo de cor na faixa de transição |

## 7.0 O fundo de segurança precisa ser a cor que a peça VESTE

Ele é invisível atrás da arte. O único lugar onde ele erra em público é a
**borda** — e ali erra na silhueta inteira.

Descoberto no Aspirante, a primeira peça em família de cor diferente do oliva. A
cor média filtrava `lum > 0.3` para o contorno preto não puxar o resultado, e
esse **0,3 era o oliva** (lum 0,503). O azul-ardósia tem os três tons principais
entre **0,260 e 0,279**: todos caíram fora. Sobrou uma forma só, a listra clara
da calça, e ela virou o fundo da peça inteira.

| | Soldado | Aspirante, antes |
|---|---|---|
| fundo | `#737e38` | **`#859dab`** — a listra, não a farda |
| distância até a cor dominante do pano | **7,7** | **133,2** |
| px do fundo encostando na borda transparente | 7.513 de 213.422 (3,5%) | **5.647 de 21.354 (26,4%)** |

O teto de **40** é a mesma distância que a paleta usa para "contorno e
preenchimento não se fundem", e o vão medido é de uma ordem de grandeza para cada
lado.

**A correção não foi baixar o corte, foi tirá-lo.** A cor do fundo passou a ser o
**maior GRUPO de cores vizinhas** (raio 20 em RGB): o traçador quebra um pano
chapado em vários tons quase iguais — o oliva do Soldado sai em cinco, nenhum com
15% do pano — e somados eles ganham do contorno, que sozinho tem 12,2%. Separados,
quase empatam. O Soldado continua dando exatamente `#737e38`, então a peça que já
passava não mudou.

**A lição geral:** todo número calibrado numa peça só é uma premissa sobre aquela
peça. Aqui o gate de halo até reprovou, mas por tabela e raspando (3,31% contra
teto de 2%, e só na variante de 128) — sintoma, não causa. **O gate que vale mede
a causa e falha antes de rasterizar.**

## 7.1 Pedestal e pé visível são defeitos OPOSTOS

Isto é a lição mais fácil de esquecer:

- **pedestal** — o fundo verde **invade** a folga da bota, onde não há pano por
  cima. Bloco verde sob os pés.
- **pé visível** — a folga fica **transparente** e a pele da base passa. Faixa
  cor de pele sob as solas.

**Um gate não pega o outro.** O do pedestal olha cor onde não devia haver; o do pé
olha transparência onde não devia haver.

E o gate do pedestal tem uma calibração que não é arbitrária: **contar pixels na
folga não basta**, porque a bota ocupa aquela região por direito. O que denuncia é
a **cor** ser a do fundo, que é chapada. O teto sai da magnitude do defeito real —
quando o pedestal existiu, o fundo cobria ~30 mil px; a barra da calça, que passa
por direito, mede 475. Cinco mil separa os dois por uma ordem de grandeza para
cada lado, e por isso o gate não oscila.

## 7.2 Ao medir alfa, olhe a faixa de TRANSIÇÃO

Meu primeiro gate contava "RGB escuro em pixel transparente" no quadro inteiro e
dava **99%** — contava o fundo vazio, que é 85% da imagem e nunca se mistura com a
figura em interpolação nenhuma.

O que a interpolação puxa é o pixel com **8 < alfa < 255**, comparado com a média
dos vizinhos **opacos**, em espaço **pré-multiplicado**. Comparar RGB desassociado
com alfa baixo amplifica ruído, porque diferenças pequenas viram números enormes
ao dividir por alfa.

Assim o **contorno escuro legítimo passa**, porque os vizinhos também são escuros:
o gate reprova halo, não estilo.

## 7.3 Resíduo de camada base em vãos internos

**O sintoma.** Numa costura interna — gola, punho, o vazio entre braço e tronco —
aparece um fio de cor que não é do uniforme nem da pele. Contra fundo claro ele
some; contra fundo escuro ou magenta ele salta. Nenhum gate anterior via.

**A causa, comprovada.** As duas máscaras de recorte subtraíam a MESMA região:

```
pano  = cobertura    − peleFrente        ← certo
fundo = corpoVestido − peleFrente        ← o defeito
```

Com isso as duas camadas abriam o mesmo buraco, e exatamente onde a pele encosta
no macacão **nenhuma das duas pintava**. Medido: **2851 px** de base crua, em
(367,791)–(942,1606).

`corpoVestido` é a silhueta do macacão e **já exclui cabeça e mãos**. Subtrair a
pele dele não protegia rosto nenhum — só abria a costura.

**A correção é estrutural, e são duas coisas distintas:**

1. O fundo **não** subtrai `peleFrente`. Onde a arte cobre, ele continua
   invisível; onde a arte falha, aparece a cor do pano — que é a resposta certa
   numa região que por definição é vestida.
   > ⚠️ **Esta metade foi SUBSTITUÍDA.** Subtrair pele nenhuma criou o defeito
   > oposto — o fundo chapado sobre as mãos, §7.4. Hoje o fundo subtrai
   > `peleExposta`, que é a pele **própria**, sem o forro que passa sob a gola e
   > o punho. A costura continua coberta; a mão, não.
2. A base de runtime é `avatar-base-sem-traje.svg`, com as camadas de roupa
   **removidas do arquivo**. Esconder por CSS nunca funcionou — ver a §9.1.
   **É esta metade que de fato mata o bege**, e por isso a primeira pôde ser
   trocada sem o defeito voltar.

**Por que fundo claro engana.** O macacão da base é bege `#c9bfa8`. Contra o oliva
do Soldado ele praticamente some; contra a ardósia do Aspirante ele salta. Foi
assim que a mesma composição, com o mesmo defeito, produziu a impressão de que uma
peça estava perfeita e a outra quebrada.

**Por que contagem global não basta.** São poucos milhares de pixels num quadro de
9,8 milhões — 0,03%. E o gate de halo mede a faixa de transição do **asset
isolado**, onde o macacão não está: ele mora na base, por baixo.

**A regra.** Em vão legítimo aparece **só o fundo da página**. Nem uniforme, nem
roupa da base, nem forro. Sem essa segunda metade, "consertar" o resíduo
preenchendo o vão inteiro passaria — e engordaria o boneco.

**Como se prova:** `npm run avatar:proveniencia`. Ele renderiza a composição real
com cada camada repintada numa cor impossível de confundir, e a cor que aparece na
região **é** a proveniência. Tolerância zero, inclusive em alfa parcial.

**E o gate prova a si mesmo.** Toda execução monta uma FIXTURE com o recorte
antigo (`recortesLegado`) e exige que ela **vaze**: medido, 2652 px no Soldado e
2626 no Aspirante. Se um dia a fixture passar limpa, o gate parou de enxergar o
defeito que existe para pegar — e é assim que gates morrem sem ninguém notar. Foi
o que aconteceu com o `verify:avatar-assets`, vermelho por meses sem que ninguém
rodasse.

**Os closes obrigatórios**, todos derivados de coordenada medida e nenhum escolhido
a olho: gola, punho, os dois vãos de braço, a mão e a sola. `npm run avatar:folha`.

## 7.4 Fundo de segurança sobre a pele à mostra

**É o PAR da §7.3, e a lição só existe junto com ela.** Consertar um lado sem
saber do outro foi exatamente o que aconteceu: o commit que fechou a costura da
§7.3 abriu este.

**O sintoma.** Resíduo **da cor do uniforme** sobre as mãos e o pescoço. Visível a
425 px, no boneco inteiro, **nas duas peças e no mesmo lugar**.

**A causa.** Na região do punho, das três camadas do asset:

| camada | pinta ali? | por quê |
|---|---|---|
| arte | **não** | `pano` subtrai `peleFrente` — o buraco da mão é de propósito |
| oclusão do pé | **não** | só existe do tornozelo para baixo |
| fundo de segurança | **sim, chapado** | saía de `corpoVestido` sem subtrair pele nenhuma |

E `corpoVestido` **invade a mão**: ele é a silhueta das duas camadas de pano, e o
forro de pano passa por **trás** da mão. Medido: **1889 px**, o mesmo número exato
nas duas peças — a assinatura de geometria de máscara —, dos quais **557 na gola**.

**A correção.** O fundo subtrai `peleExposta`: a camada `av-pele` **sozinha**, sem
o forro de pele. Sem dilatar — 1 px de raio comeria o forro e reabriria a costura.

**Por que `peleExposta` e não `peleFrente`** — a distinção é o coração das duas
seções:

- `peleFrente` é o corpo nu **inteiro**, forro incluso. Subtrair ela do fundo é o
  que causou os 2851 px da §7.3;
- `peleExposta` é a pele **própria**. A diferença entre as duas é justamente o
  forro que passa sob a gola e o punho — que continua coberto.

E a base de produção **não tem macacão**: `avatar-base-sem-traje.svg` não tem
`av-roupa` nem `av-forro-roupa`. Então "o punho do macacão cobre a mão?" não se
aplica ali — aquele pixel é mão.

**A tabela 2×2 — cada fixture é o controle negativo da outra.** É o artefato que
impede a próxima pessoa de consertar um lado reabrindo o outro:

| recorte | base vazando (fora da pele) | fundo sobre a pele |
|---|---|---|
| `recortesLegado` (`6e3feb6`) | **180** ← reprova | 0 |
| `recortesFundoNaMao` (`1403143`) | 0 | **1889** ← reprova |
| `recortes()` canônico | **0** | **0** |

`npm run avatar:proveniencia` monta as duas em toda execução e exige que **as duas
vazem**.

**Por que nenhum gate pegava**, e é a lição mais transferível daqui:

> **Todo gate desta fase perguntava "a base vazou para cima?". Nenhum perguntava
> "o asset cobriu o que não devia?".** Todas as camadas proibidas eram da base;
> `SENTINELA.fundo` e `SENTINELA.arte` eram permitidas **sem restrição de região**,
> e `peleFrente` nunca chegava a ser espacializada.

O gate irmão no `avatar:garment` era pior: além de excluir a costura inteira da
região, dividia por **todos os px opacos do asset** (~373 mil) em vez da área da
máscara (~6 mil). O teto de 0,5% virava ~1865 px e o gate **não conseguia
reprovar nem com a região 100% coberta**. Media 628 px e passava.

---

# 8. A folha visual — e por que ela não é opcional

`.scratch/uniforme/folha.png`

**Gate estrutural prova estrutura. A folha visual acha o que ninguém pensou em
olhar.** Aconteceu duas vezes nesta fase: os gates diziam 0 px fora da cobertura e
0% de halo enquanto havia uma faixa de pele bem visível sob as solas.

Os quatro fundos não são decoração — cada um revela um defeito diferente:

| fundo | revela |
|---|---|
| claro | quase nada. **Esconde buraco**, porque pele e creme são claros |
| magenta | **buraco** e vazamento |
| escuro | **halo claro** |
| quadriculado | **alfa parcial**, que os outros três escondem |

E os 56 px são **rasterizados no tamanho real** e ampliados como imagem, com pixel
visível. Ampliar o SVG com `transform` redesenha em vetor no tamanho grande e
**mente sobre a leitura**.

> ⚠️ **O menor manda na LEITURA, não na aprovação.** "A 56 px não dá para ver" não
> aprova defeito nenhum. Legibilidade — a peça se distingue do traje de treino? a
> silhueta se lê? — é o que se julga no tamanho pequeno. **Defeito estrutural se
> julga a 425 px e na sentinela**, e resíduo de camada base reprova com tolerância
> zero mesmo que o olho não o encontre no ranking. O defeito da §7.3 sumia
> completamente a 56 px e a 425 px sobre fundo claro; foi só sobre magenta, e
> depois em número, que ele existiu.

**O que olhar com atenção crítica:** a gola contra o pescoço, a manga contra o
pulso, e a sola contra o chão. São as três fronteiras onde os defeitos moraram.

## 8.1 A folha de contato — todas as peças, num quadro só

```bash
npm run avatar:folha        # .scratch/uniforme/folha-contato.png
```

A folha do gerador (`folha.png`) é de **uma peça** e é **sobrescrita a cada
execução**. Comparar duas peças exigia rodar, salvar à mão, rodar de novo e
comparar de memória entre duas abas — que é como se aprova um defeito que só
aparece lado a lado.

A folha de contato traz todas as peças com arte, no mesmo enquadramento, e para
cada close mostra **três colunas por peça**:

| coluna | o que responde |
|---|---|
| LEGADO · prova | o defeito EXISTIA aqui? (sentinela, base com macacão) |
| canônico · prova | ele SUMIU? |
| canônico · real | a arte está boa? |

A coluna do meio é a que decide. **Nas cores reais o antes e o depois são quase
indistinguíveis** — é o bege contra o oliva de novo. Na sentinela o macacão é
vermelho puro e o resíduo é impossível de não ver.

**As caixas de close saem de medição**, nunca do olho: a gola do maior pedaço de
costura no eixo, o punho do maior pedaço de costura ladeando, os vãos dos
componentes de `vaoAnatomico` fora do eixo, e a bota do componente do pé. Um
recorte escolhido a olho já produziu um antes/depois idêntico e uma conclusão
errada nesta fase — a caixa simplesmente não continha o defeito.

Cada close vem com o número ao lado, e os dois lados importam:

- **legado > 0** prova que aquela caixa enquadra defeito de verdade;
- **canônico = 0** prova que ele sumiu;
- **a divergência entre as peças > 0** prova que o close está olhando para o
  uniforme, e não para uma região em que as duas peças são a mesma imagem.

---

# 9. Restrições de composição — para o Bloco 5

## 9.1 Regra de CSS não alcança o conteúdo de `<use>`

⚠️ *Este item já afirmou o contrário. A versão anterior dizia que a regra
`.vestido .av-roupa{display:none}` **escapava e escondia o macacão de todos os
avatares da página**, e que a proteção era escopo por classe de ancestral.*

**O escopo já estava lá.** O que a regra faz, via `<use>`, é **nada** — o conteúdo
referenciado mora numa árvore-sombra que o seletor do documento não atravessa.

Medido, mesma base, mesmo viewport, hash do PNG:

| montagem | sem a regra | com a regra | |
|---|---|---|---|
| via `<use>` | `582078712a8ba94c` · 65037 B | `582078712a8ba94c` · 65037 B | **byte a byte idênticos** |
| inline | `582078712a8ba94c` · 65037 B | `d517a82e72187bfb` · 40798 B | o seletor **funciona** |

A segunda linha é o controle: o seletor está correto e some com 24 KB de macacão
quando o elemento é inline. É a fronteira do `<use>` que ele não cruza.

**A lição invertida era pior que nenhuma lição.** Ela protegia contra um risco
inexistente e escondia o real: o macacão continuava desenhado sob todo uniforme e
aparecia em cada vão que a arte não cobre — o defeito da §7.3.

**A correção é estrutural:** `avatar-base-sem-traje.svg`, com as camadas de roupa
removidas do arquivo. Ausência estrutural se confere procurando `av-roupa` e não
achando. Ausência por CSS depende de o navegador concordar, e ele não concordava.

**O que continua valendo:** `<style>` dentro de `<svg>` inline é mesmo de escopo do
DOCUMENTO, e toda regra que a composição emitir precisa de **escopo por classe de
ancestral**. Só que sozinho isso não resolvia nada aqui.

## 9.2 As outras duas

1. **Máscara e filtro são de build, não de runtime.**
2. **Benchmark com asset repetido mede cache, não memória.** O navegador
   compartilha o bitmap decodificado de uma URL só. Medido: 30 cópias do mesmo
   asset levam 481 ms; **30 assets distintos levam 893 ms** — quase o dobro.

---

# 10. Checklist da próxima peça

- [ ] Arte pedida com as regras da §2, **folgada**, cor com matiz ≥ 45°
- [ ] PNG exportado do Canva com **fundo transparente** (não SVG)
- [ ] Vetorizado na Adobe; o SVG tem ~30 cores, não 250
- [ ] Commitado em `scripts/avatar/fonte/uniformes/<nome>.svg`
- [ ] `UNIFORME_NOME=<nome> npm run avatar:garment` sai com código 0
- [ ] `UNIFORME_NOME=<nome> npm run avatar:proveniencia` sai com código 0, **e as
      DUAS fixtures vazam** — a legada (§7.3) e a do fundo-na-mão (§7.4). Se
      qualquer uma passar limpa, aquele gate ficou cego
- [ ] `npm run avatar:folha`: em cada close, as **duas** colunas fecham em **0** —
      `base fora da pele` e `fundo sobre a pele`. As máscaras importam: `av-roupa`
      dentro da pele é o buraco de desenho e é lícito; o fundo fora da pele
      preenche a região vestida por direito
- [ ] Folha visual lida nos quatro fundos, com atenção a gola, punho e sola
- [ ] A 56 px o uniforme se distingue do traje de treino — **legibilidade**, não
      aprovação de defeito (§8)
- [ ] Cor **medida** registrada em `scripts/avatar/patentes.ts` (trocar `alvo` por
      `medido`), e `npm run verify:paleta-patentes` verde

## 10.2 Cores já usadas — a tabela saiu daqui

**A régua das cores agora é dado, não texto:** ela vive em
`scripts/avatar/patentes.ts` e é medida por `npm run verify:paleta-patentes`. O
racional de cada cor está no [doc 17](17-patentes-uniformes-design.md); os pedidos
prontos para colar, no [doc 18](18-uniformes-blocos.md).

Duas tabelas de cor divergem; uma não. Esta virou ponteiro de propósito.

---

# 11. Dívidas conhecidas deste pipeline

Registradas para não voltarem a ser descobertas. Nenhuma bloqueia a próxima peça.

| dívida | por quê, e o risco |
|---|---|
| **`avatar:garment`, `avatar:proveniencia` e `avatar:folha` estão fora do `verify:all` e do CI** | Os três gates existem e **ninguém os roda sozinho**. É exatamente como o `verify:avatar-assets` ficou vermelho por meses. Rodá-los exige navegador, o que os torna caros para o CI — mas a decisão de deixá-los fora é uma escolha, não um esquecimento |
| **`scripts/verify/**` fora do typecheck** | `npm run typecheck` cobre `src/**` e `scripts/avatar/**` (via `tsconfig.scripts.json`). O resto de `scripts/` continua sem cobertura de tipo — e foi a ausência dela que deixou `rasterizarSentinela is not defined` e `b64png is not defined` passarem verdes |
| **Runtime em `src/` ainda usa a regra de CSS que não funciona** | E não aponta para `avatar-base-sem-traje.svg`. É uma linha, mas pertence ao Bloco 5 do doc 15. Até lá, o que está provado limpo é o pipeline de build, não a página |
| **`ZONA_MORTA_ROUPA = 0,18` precisa baixar para uniforme sem textura** | Sem gate hoje |
| **Constantes de posição da base ainda absolutas** | Conhecidas; mancha na coroa da cabeça |

## 11.1 O que este pipeline garante, e o que não

**Garante:** que o ASSET assado não deixa resíduo de camada nenhuma, para qualquer
peça, provado por medição — e que a medição funciona, provado pela fixture.

**Não garante:** que a PÁGINA monta a pilha certa. Isso é o Bloco 5 do doc 15.
Trabalho verde e trabalho completo não são a mesma coisa.

O gate confere, para toda peça já commitada, que `corDominante` e `corBota` do SVG
batem com o registro — hoje com distância **0,0** nas duas peças. E reprova uma
linha ainda marcada `alvo` que já tenha SVG no disco: é o esquecimento de voltar e
registrar a cor depois de gerar.

Valores **derivados** que o gate não guarda, porque o gerador os calcula: o fundo
de segurança sai `#737e38` no Soldado e `#354663` no Aspirante.

## 10.1 Quando algo novo aparecer

Escreva o **gate antes da correção**, e confira que ele **reprova**. Foi assim que
o pé sob a bota deixou de ser suposição e virou 2.696 px medidos. Gate escrito
depois da correção não prova nada — ele só concorda com o que já está lá.
