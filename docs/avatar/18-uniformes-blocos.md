# Uniformes — os blocos para colar no gerador

> Este arquivo é para **abrir, copiar e fechar** — não para ler. O porquê de cada
> regra está no [runbook](16-uniformes-runbook.md); o porquê de cada **cor** está
> no [doc 17](17-patentes-uniformes-design.md).
>
> São 4 peças: **Capitão, Comandante, General e Mestre**. Soldado e Aspirante já
> estão prontos e commitados.

---

## Antes de qualquer bloco — as quatro coisas que fazem a rodada valer

**1. Anexe a referência.** Todo bloco começa anexando este arquivo:

```
scripts/avatar/fonte/referencia-base.png
```

Sem o anexo o gerador desenha um personagem novo em vez de editar o nosso, e isso
**não se corrige com prompt melhor** — é regerar. Se voltar rosto diferente,
contorno novo ou proporção nova, é isso que aconteceu.

**2. A silhueta é um macacão, e não dá para mudar isso.** O nosso sistema recorta
o uniforme pela silhueta da base com **1,2% de folga**. Túnica solta, sobreveste,
saiote, manto e capa **são cortados fora** — não é escolha de estilo, é geometria
medida. O medieval vem da **construção dentro da silhueta**: gola alta, cordão,
painéis, faixa, braçadeira e cano de bota. As duas folgas generosas são a **gola**
(sobe até a metade do pescoço) e a **bota** (~7% da altura, então cano alto
dobrado e alargado funciona).

**3. O metal é aço TINGIDO, nunca dourado nem couro.** Latão, ouro e marrom caem
na faixa de matiz que o nosso pipeline descarta — a peça **some**. Toda fivela e
toda braçadeira sai na cor da família da patente.

**4. Uma peça por vez, e a cor exata é no Canva.** O gerador chega perto do hex,
não acerta. Gere, ajuste no Canva com a tabela do bloco, passe pela esteira, olhe
a folha visual — e só então comece a próxima.

---

## 1. Capitão

**Anexe:** `scripts/avatar/fonte/referencia-base.png`

```
EDITE a imagem anexada. Não desenhe um personagem novo: parta desta imagem e
mude só a roupa. O corpo, a cabeça, o rosto, as mãos, os pés, a pose, o tamanho
e a posição de tudo continuam EXATAMENTE onde estão.

MANTENHA IGUAL: rosto, orelhas, formato e tamanho da cabeça, proporção
cabeça-corpo, pose dos braços e das mãos, enquadramento de corpo inteiro
centralizado, fundo transparente.

ESTILO: fantasia medieval elegante, em desenho infantil de livro ilustrado.
NÃO é macacão de trabalho. NÃO é uniforme militar moderno. NÃO é roupa tática.
Pense em um jovem oficial de uma fortaleza — alguém que estuda mapas de
batalha, não alguém que conserta motores.

A SILHUETA NÃO MUDA: manga comprida até o punho, perna comprida até o
tornozelo, colada ao corpo como na imagem. NÃO desenhe túnica solta, sobreveste,
tabardo, saiote, manto nem capa — o nosso sistema recorta tudo isso fora.
Toda a fantasia medieval tem que caber DENTRO dessa silhueta.

O UNIFORME — patente de CAPITÃO, um GIBÃO de oficial:
- VERDE-PETRÓLEO médio, um verde-azulado de água profunda (#3E8C81)
- GOLA ALTA fechada, subindo pelo pescoço, com debrum claro em verde-água
  pálido (#B4D2C9)
- CORDÃO CRUZADO em V no peito, claro, como o laço de um gibão medieval
- o tronco dividido em PAINÉIS VERTICAIS por linhas de costura — linhas finas
  desenhadas, sem relevo e sem volume
- DOIS CHEVRONS claros no peito, um sobre o outro, como galão heráldico
- FAIXA LARGA DE PANO na cintura, no lugar de cinto, com uma fivela OVAL
- BRAÇADEIRAS no antebraço de cada braço, em aço claro esverdeado — são as
  ÚNICAS peças de metal da roupa
- punho com debrum largo
- BOTAS ALTAS DE CANO DOBRADO, cobrindo o pé inteiro e subindo bem acima do
  tornozelo, com a boca do cano virada para fora, em verde-petróleo bem
  escuro (#1C4A45)
- as MÃOS ficam descobertas, sem luva
- FOLGADO: ombro, manga, calça e bota alguns por cento maiores que o corpo.
  Tecido ultrapassando um pouco a silhueta é melhor que faltando.

CORES — regra que não pode ser quebrada:
- TODO tom claro precisa ser TINGIDO DE VERDE-ÁGUA. Nenhum cinza neutro,
  nenhum branco puro: um chevron cinza ou branco DESAPARECE no nosso pipeline.
- o metal é AÇO ESVERDEADO, não dourado e não latão
- NÃO use marrom, bege, caramelo, dourado nem couro em nada
- NÃO use nenhum tom alaranjado ou terroso

NÃO FAÇA:
- sem BOLSO de nenhum tipo
- sem cinto de fivela retangular
- sem faixas ou listras no antebraço
- sem zíper, sem botão de camisa, sem velcro
- sem cota de malha nem escamas
- sem CAPA, manto, sobreveste, tabardo, saiote ou capuz
- sem textura de tecido, sem trama, sem acolchoado com relevo: pano liso
- sem brilho, aura ou glow em volta do personagem
- sem sombra no chão, cenário, texto, moldura ou marca d'água
- sem elmo, arma, escudo, mochila ou luva

Legível a 56 px de altura. Entregue em PNG com fundo transparente, na maior
resolução possível.
```

**Cores para acertar no Canva**

| papel | hex |
|---|---|
| pano | `#3E8C81` |
| bota | `#1C4A45` |
| gola, cordão, chevron, braçadeira | `#B4D2C9` |

**Depois:** siga a esteira no fim deste arquivo, com `UNIFORME_NOME=capitao`.

---

## 2. Comandante

**Anexe:** `scripts/avatar/fonte/referencia-base.png`

```
EDITE a imagem anexada. Não desenhe um personagem novo: parta desta imagem e
mude só a roupa. O corpo, a cabeça, o rosto, as mãos, os pés, a pose, o tamanho
e a posição de tudo continuam EXATAMENTE onde estão.

MANTENHA IGUAL: rosto, orelhas, formato e tamanho da cabeça, proporção
cabeça-corpo, pose dos braços e das mãos, enquadramento de corpo inteiro
centralizado, fundo transparente.

ESTILO: fantasia medieval elegante, em desenho infantil de livro ilustrado.
NÃO é macacão de trabalho. NÃO é uniforme militar moderno. NÃO é roupa tática.
Pense em um comandante de uma cidade murada, em traje de gala: estandartes,
guarda de elite, prestígio.

A SILHUETA NÃO MUDA: manga comprida até o punho, perna comprida até o
tornozelo, colada ao corpo como na imagem. NÃO desenhe túnica solta, sobreveste,
tabardo, saiote, manto nem capa — o nosso sistema recorta tudo isso fora.

O UNIFORME — patente de COMANDANTE, gibão de gala com reforço:
- AZUL-REAL vivo e saturado (#3A55B5)
- GOLA ALTA fechada, subindo pelo pescoço, com debrum claro em azul-prateado
  (#C6D2E2)
- CORDÃO CRUZADO em V no peito, claro
- BANDA HERÁLDICA clara cruzando o peito na diagonal, de um ombro à cintura
- OMBREIRAS arredondadas em aço azulado, RENTES ao ombro — elas NÃO podem
  passar da linha do ombro nem para cima nem para os lados
- TRÊS CHEVRONS claros no peito
- o tronco dividido em PAINÉIS VERTICAIS por linhas de costura finas
- FAIXA LARGA DE PANO na cintura, com fivela OVAL de aço azulado
- BRAÇADEIRAS de aço azulado no antebraço de cada braço
- punho com debrum largo
- BOTAS ALTAS DE CANO DOBRADO, cobrindo o pé inteiro e subindo bem acima do
  tornozelo, com a boca do cano virada para fora, em azul-marinho bem escuro
  (#1D2A63)
- as MÃOS ficam descobertas, sem luva
- FOLGADO: ombro, manga, calça e bota alguns por cento maiores que o corpo.

CORES — regra que não pode ser quebrada:
- TODO tom claro precisa ser TINGIDO DE AZUL. Nenhum cinza neutro, nenhum
  branco puro: uma ombreira ou banda cinza DESAPARECE no nosso pipeline.
- o metal é AÇO AZULADO, não dourado e não latão
- NÃO use marrom, bege, caramelo, dourado nem couro em nada
- NÃO use nenhum tom alaranjado ou terroso

NÃO FAÇA:
- sem BOLSO de nenhum tipo
- sem cinto de fivela retangular
- sem faixas ou listras no antebraço
- sem zíper, sem botão de camisa, sem velcro
- sem cota de malha nem escamas
- sem CAPA, manto, sobreveste, tabardo, saiote ou capuz
- sem ombreira grande, pontuda ou saliente
- sem textura de tecido, sem trama, sem acolchoado com relevo: pano liso
- sem brilho, aura ou glow em volta do personagem
- sem sombra no chão, cenário, texto, moldura ou marca d'água
- sem elmo, arma, escudo, mochila ou luva

Legível a 56 px de altura. Entregue em PNG com fundo transparente, na maior
resolução possível.
```

**Cores para acertar no Canva**

| papel | hex |
|---|---|
| pano | `#3A55B5` |
| bota | `#1D2A63` |
| gola, banda, chevron, ombreira, braçadeira | `#C6D2E2` |

**Depois:** esteira no fim, com `UNIFORME_NOME=comandante`.

---

## 3. General

**Anexe:** `scripts/avatar/fonte/referencia-base.png`

```
EDITE a imagem anexada. Não desenhe um personagem novo: parta desta imagem e
mude só a roupa. O corpo, a cabeça, o rosto, as mãos, os pés, a pose, o tamanho
e a posição de tudo continuam EXATAMENTE onde estão.

MANTENHA IGUAL: rosto, orelhas, formato e tamanho da cabeça, proporção
cabeça-corpo, pose dos braços e das mãos, enquadramento de corpo inteiro
centralizado, fundo transparente.

ESTILO: fantasia medieval elegante, em desenho infantil de livro ilustrado.
NÃO é macacão de trabalho. NÃO é uniforme militar moderno. NÃO é roupa tática.
Pense em um general de conselho de guerra: autoridade, grandeza, domínio —
mas nobre, nunca brutal.

A SILHUETA NÃO MUDA: manga comprida até o punho, perna comprida até o
tornozelo, colada ao corpo como na imagem. NÃO desenhe túnica solta, sobreveste,
tabardo, saiote, manto nem capa — o nosso sistema recorta tudo isso fora.

O UNIFORME — patente de GENERAL, gibão com peitoral:
- AMEIXA, uma púrpura escura e encorpada (#7A3168)
- GOLA ALTA E RÍGIDA, fechada até em cima, com debrum claro em lilás (#D9BCD1)
- PEITORAL de aço arroxeado claro cobrindo o CENTRO do tronco, do peito até a
  cintura — um painel liso e arredondado, colado ao corpo, sem passar da
  largura do tronco
- o GALÃO vai sobre o peitoral: três chevrons claros
- OMBREIRAS arredondadas em aço arroxeado, RENTES ao ombro — elas NÃO podem
  passar da linha do ombro
- FAIXA MUITO LARGA de pano na cintura, por baixo da borda do peitoral
- BRAÇADEIRAS de aço arroxeado no antebraço de cada braço
- punho com debrum largo
- as pernas em painéis verticais separados por linhas de costura finas
- BOTAS ALTAS DE CANO DOBRADO, cobrindo o pé inteiro e subindo bem acima do
  tornozelo, com a boca do cano virada para fora, em púrpura quase preta
  (#421539)
- as MÃOS ficam descobertas, sem luva
- FOLGADO: ombro, manga, calça e bota alguns por cento maiores que o corpo.

CORES — regra que não pode ser quebrada:
- TODO tom claro precisa ser TINGIDO DE LILÁS OU ROSA-ARROXEADO. Nenhum cinza
  neutro, nenhum branco puro: um debrum cinza DESAPARECE no nosso pipeline.
- o metal é AÇO ARROXEADO, não dourado, não prata neutra e não latão
- NÃO use marrom, bege, caramelo, dourado nem couro em nada
- NÃO use VERMELHO nem vinho alaranjado: a púrpura tem de puxar para o roxo,
  nunca para o vermelho

NÃO FAÇA:
- sem BOLSO de nenhum tipo
- sem cinto de fivela retangular
- sem faixas ou listras no antebraço
- sem zíper, sem botão de camisa, sem velcro
- sem cota de malha nem escamas
- sem CAPA, manto, sobreveste, tabardo, saiote ou capuz
- sem ombreira grande, pontuda ou saliente
- sem armadura de corpo inteiro: o peitoral é UM painel no centro do tronco
- sem textura de tecido, sem trama, sem acolchoado com relevo: pano liso
- sem brilho, aura ou glow em volta do personagem
- sem sombra no chão, cenário, texto, moldura ou marca d'água
- sem elmo, arma, escudo, mochila ou luva

Legível a 56 px de altura. Entregue em PNG com fundo transparente, na maior
resolução possível.
```

**Cores para acertar no Canva**

| papel | hex |
|---|---|
| pano | `#7A3168` |
| bota | `#421539` |
| gola, peitoral, chevron, faixa, braçadeira | `#D9BCD1` |

> ⚠️ **O vermelho é o risco desta peça.** Uma ameixa que puxe para o vermelho cai
> abaixo do corte de matiz do pipeline e **some** do asset. Se o gerador entregar
> algo avermelhado, empurre para o roxo no Canva antes de vetorizar.

**Depois:** esteira no fim, com `UNIFORME_NOME=general`.

---

## 4. Mestre

**Anexe:** `scripts/avatar/fonte/referencia-base.png`

```
EDITE a imagem anexada. Não desenhe um personagem novo: parta desta imagem e
mude só a roupa. O corpo, a cabeça, o rosto, as mãos, os pés, a pose, o tamanho
e a posição de tudo continuam EXATAMENTE onde estão.

MANTENHA IGUAL: rosto, orelhas, formato e tamanho da cabeça, proporção
cabeça-corpo, pose dos braços e das mãos, enquadramento de corpo inteiro
centralizado, fundo transparente.

ESTILO: fantasia medieval elegante, em desenho infantil de livro ilustrado.
NÃO é macacão de trabalho. NÃO é uniforme militar moderno. NÃO é roupa tática.
Pense em um mestre em veste de cerimônia, num salão de pedra e luz calma. É o
posto MAIS ALTO, e por isso é a roupa MAIS SIMPLES de todas: refinamento por
subtração, nunca por enfeite.

A SILHUETA NÃO MUDA: manga comprida até o punho, perna comprida até o
tornozelo, colada ao corpo como na imagem. NÃO desenhe túnica solta, sobreveste,
tabardo, saiote, manto nem capa — o nosso sistema recorta tudo isso fora.

O UNIFORME — patente de MESTRE, veste de cerimônia:
- CINZA-PEDRA CLARO com tom AZULADO (#AEBCCE) — claro, mas nunca branco
- GOLA ALTA fechada, lisa, sem debrum largo
- CORTE INTEIRAMENTE RETO E LISO: sem painéis, sem cordão, sem chevron, sem
  faixa, sem cinto, sem ombreira, sem braçadeira, sem peça de metal nenhuma
- um debrum FINO cor de LATÃO, um dourado esverdeado (#B5AE4A), em três
  lugares só: a borda da gola, a borda do punho e a barra da calça
- nenhum outro enfeite em lugar nenhum
- BOTAS ALTAS DE CANO DOBRADO, cobrindo o pé inteiro e subindo bem acima do
  tornozelo, com a boca do cano virada para fora, em cinza-azulado escuro
  (#4B5A70), com o mesmo fio fino de latão na borda do cano
- as MÃOS ficam descobertas, sem luva
- FOLGADO: ombro, manga, calça e bota alguns por cento maiores que o corpo.

CORES — a regra mais importante desta peça:
- O CINZA-PEDRA TEM DE SER AZULADO, NUNCA CINZA NEUTRO E NUNCA BRANCO. Um
  cinza com R, G e B iguais DESAPARECE no nosso pipeline — a peça inteira
  sumiria. O azul precisa ser perceptível em todos os tons, inclusive nos
  brilhos e nas dobras claras.
- o LATÃO é um dourado ESVERDEADO, puxando para o oliva. Não use ouro amarelo
  nem dourado alaranjado: os dois somem.
- NÃO use marrom, bege, caramelo nem couro em nada

NÃO FAÇA:
- sem BOLSO de nenhum tipo
- sem zíper, sem botão de camisa, sem velcro
- sem cota de malha nem escamas
- sem CAPA, manto, sobreveste, tabardo, saiote ou capuz
- sem textura de tecido, sem trama, sem acolchoado com relevo: pano liso
- sem brilho, aura ou glow em volta do personagem
- sem sombra no chão, cenário, texto, moldura ou marca d'água
- sem elmo, arma, escudo, mochila ou luva

Legível a 56 px de altura. Entregue em PNG com fundo transparente, na maior
resolução possível.
```

**Cores para acertar no Canva**

| papel | hex |
|---|---|
| pano | `#AEBCCE` |
| bota | `#4B5A70` |
| debrum de latão | `#B5AE4A` |

> ⚠️ **Esta é a peça mais frágil das quatro**, por dois motivos que se somam: é a
> única clara, e cor clara tende ao branco neutro — que some. E o latão vive a 11°
> do corte de matiz. Confira as duas coisas no Canva antes de vetorizar.

---

## A esteira — igual para as quatro

```
1.  conferir a TRANSPARÊNCIA do PNG recebido
      fundo branco opaco ou glow em volta = regerar, não consertar
2.  abrir no Canva e recolorir para os hex EXATOS da tabela do bloco
3.  exportar PNG com fundo transparente
      NUNCA exportar SVG do Canva: o "SVG" dele é um PNG em base64
4.  vetorizar no conversor da Adobe
      conferir: ~600 paths e ~30 cores. 250 cores = tem fundo ou glow no PNG
5.  salvar em scripts/avatar/fonte/uniformes/<nome>.svg
6.  UNIFORME_NOME=<nome> npm run avatar:garment
      sai com código 1 se qualquer um dos 9 gates reprovar
7.  abrir .scratch/uniforme/folha.png e olhar os quatro fundos
      com atenção crítica a: a gola contra o pescoço,
                             a manga contra o pulso,
                             a sola contra o chão
8.  registrar a cor MEDIDA de volta em scripts/avatar/patentes.ts
      (trocar estado: "alvo" por "medido" e pôr o hex que o gate imprimiu)
9.  npm run verify:paleta-patentes
```

Os nomes: `capitao`, `comandante`, `general`, `mestre`.

O passo 8 é o que fecha o ciclo — sem ele a tabela volta a ser intenção, e o gate
reprova de propósito: uma linha `alvo` com SVG no disco é exatamente o esquecimento
que ele existe para pegar.

## Se algo reprovar

| o que apareceu | o que é |
|---|---|
| **parece macacão de trabalho** | bolso, cinto retangular ou listra no antebraço passaram. **Regere** com esses três negativos reforçados |
| **a roupa ficou solta ou com saiote** | o gerador ignorou a silhueta. Vai ser recortada; regere |
| rosto ou proporção diferentes | o gerador redesenhou em vez de editar. **Regere** — prompt melhor não resolve |
| uma peça sumiu do asset | a cor dela caiu abaixo de 45° de matiz. Cinza neutro, dourado amarelo, marrom |
| orla colorida em volta da silhueta | o fundo de segurança pegou a cor errada. Ver runbook §7.0 |
| bloco de cor sob as botas | pedestal: o fundo escorreu para a folga da bota |
| faixa cor de pele sob as solas | o oposto: a oclusão do pé não cobre. **Não** conserte preenchendo com a cor média |
| 250 cores no SVG | fundo ou glow no PNG que você vetorizou |
| regiões esfarrapadas no tronco | tinha textura de tecido, ou acolchoado com relevo, no PNG |
