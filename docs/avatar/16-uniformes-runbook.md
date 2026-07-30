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
outro personagem. O mestre é `avatar_base_macacao_azul_4k_transparente_v02.png`,
na pasta de arte.

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

**Onde o arquivo mora.** A pasta de arte do usuário é onde a peça é trabalhada; o
**repositório é onde a peça aprovada entra**. Caminho absoluto no Desktop torna o
gerador e todo gate sobre ele impossíveis de rodar em máquina limpa — e isso já
quebrou uma vez nesta fase, quando o PNG mestre saiu do Downloads.

**Conferência rápida do SVG antes de rodar:** ~600 paths e ~30 cores distintas é
saudável. **250 cores** significa fundo ou glow no PNG.

---

# 4. Rodar o gerador

```bash
npm run avatar:garment                                   # o Recruta
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

| | Recruta | Aspirante, antes |
|---|---|---|
| fundo | `#737e38` | **`#859dab`** — a listra, não a farda |
| distância até a cor dominante do pano | **7,7** | **133,2** |
| px do fundo encostando na borda transparente | 7.513 de 213.422 (3,5%) | **5.647 de 21.354 (26,4%)** |

O teto de **40** é a mesma distância que a paleta usa para "contorno e
preenchimento não se fundem", e o vão medido é de uma ordem de grandeza para cada
lado.

**A correção não foi baixar o corte, foi tirá-lo.** A cor do fundo passou a ser o
**maior GRUPO de cores vizinhas** (raio 20 em RGB): o traçador quebra um pano
chapado em vários tons quase iguais — o oliva do Recruta sai em cinco, nenhum com
15% do pano — e somados eles ganham do contorno, que sozinho tem 12,2%. Separados,
quase empatam. O Recruta continua dando exatamente `#737e38`, então a peça que já
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

**O que olhar com atenção crítica:** a gola contra o pescoço, a manga contra o
pulso, e a sola contra o chão. São as três fronteiras onde os defeitos moraram.

---

# 9. Restrições de composição — para o Bloco 5

1. **`<style>` dentro de `<svg>` inline tem escopo de DOCUMENTO, não de SVG.** A
   regra que esconde o macacão num avatar vestido **escapa e esconde o de todos os
   avatares da página**. Numa lista de turma isso desnuda a turma inteira porque
   um aluno tem uniforme. Toda regra da composição precisa de **escopo por classe
   de ancestral**.
2. **Máscara e filtro são de build, não de runtime.**
3. **Benchmark com asset repetido mede cache, não memória.** O navegador
   compartilha o bitmap decodificado de uma URL só. Medido: 30 cópias do mesmo
   asset levam 481 ms; **30 assets distintos levam 893 ms** — quase o dobro.

---

# 10. Checklist da próxima peça

- [ ] Arte pedida com as regras da §2, **folgada**, cor com matiz ≥ 45°
- [ ] PNG exportado do Canva com **fundo transparente** (não SVG)
- [ ] Vetorizado na Adobe; o SVG tem ~30 cores, não 250
- [ ] Commitado em `scripts/avatar/fonte/uniformes/<nome>.svg`
- [ ] `UNIFORME_NOME=<nome> npm run avatar:garment` sai com código 0
- [ ] Folha visual lida nos quatro fundos, com atenção a gola, punho e sola
- [ ] A 56 px o uniforme se distingue do traje de treino
- [ ] A cor registrada aqui, para as outras patentes não repetirem

## 10.2 Cores já usadas — não repetir

| patente | fonte | dominante do pano | fundo | bota |
|---|---|---|---|---|
| **Soldado** (hoje nomeado `recruta`) | `fonte/uniformes/recruta.svg` | `#78833B` oliva, 69° | `#737e38` | `#2d3012` |
| **Aspirante** | `fonte/uniformes/aspirante.svg` | `#384966` ardósia, 218° | `#354663` | `#1e2b44` |

As duas distam 149° em matiz — a 56 px o uniforme é **só cor**, gola e cinto somem,
então é a massa de cor que precisa separar as patentes.

## 10.1 Quando algo novo aparecer

Escreva o **gate antes da correção**, e confira que ele **reprova**. Foi assim que
o pé sob a bota deixou de ser suposição e virou 2.696 px medidos. Gate escrito
depois da correção não prova nada — ele só concorda com o que já está lá.
