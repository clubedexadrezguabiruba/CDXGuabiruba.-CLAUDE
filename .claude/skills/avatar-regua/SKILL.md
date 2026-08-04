---
name: avatar-regua
description: Transforma referência de arte em número medido — um PNG ou um line-art SVG viram constantes de geometria.ts, com a mesma régua aplicada à referência e ao render. Use quando chegar uma referência nova do avatar, quando a pergunta for "essa proporção está certa?", "qual a espessura do traço?", "onde passa a linha de centro?", "de que cor é esse tom?", "essa curva tem quina?", quando avatar:pose ou avatar:folha-base reprovar e for preciso descobrir por quê, ou quando um número estiver prestes a entrar no código sem régua por trás. Também para escrever script de medição novo em .scratch/estilo. Não é para inventar forma nova — isso é avatar-desenho.
version: 1.0.0
argument-hint: "[o que medir] [em qual referência]"
---

# A régua do avatar

*Escrita em 2026-08-03, para o pipeline kokeshi — em que a arte é código que emite
SVG. A regra 13 do §7b existe porque uma decisão que dependia de **como** a arte foi
feita já caducou uma vez e voltou a valer depois. Confira a cada troca de pipeline.*

O ciclo inteiro:

```
referência → rasterizar → varrer em pixel → tabela impressa
           → colar em geometria.ts À MÃO → gate prende o número
```

A Anthropic não tem API de geração de imagem, e isso não é lacuna — é o desenho do
pipeline. O que existe e funciona é medir a arte que o Doug entrega, escrever a forma
em código, renderizar, **ler o próprio PNG** e criticar.

## 1. As cinco invariantes

Quebrar qualquer uma invalida tudo que vier depois.

1. **Silhueta é o primeiro e o último pixel ESCURO** de cada linha (`lum < 80`),
   nunca "pixel diferente do fundo". A sombra do chão é tinta clara (luminância 227
   contra 249 do fundo): lida como silhueta, ela engorda a figura em ~60 px na base.
   Foi assim que a altura útil saiu 837 px onde o valor é 896 — e **todo** número
   derivado ficou 7% grande.
2. **Normalize só pela ALTURA** — `600 / alturaUtilPx`. Normalizar pelos dois eixos
   faz uma cabeça 9% estreita virar erro zero, que é exatamente o defeito que a
   régua existe para pegar.
3. **A mesma função mede a referência e o render.** Não escreva uma régua para a
   arte e outra para o SVG: duas réguas concordam por acidente e discordam por
   motivo errado.
4. **Centerline de peça: a identidade é a LINHA DE CENTRO DO PRETO**, nunca a borda
   interna do preenchimento. O render desenha o stroke **centrado** no path, então o
   que o catálogo guarda tem de ser a linha que o desenhista traçou — e a borda do
   preenchimento fica meio traço para dentro dela. Medir a borda e guardá-la como
   identidade desloca a peça inteira, de forma sistemática, para um lado só. Na ida e
   volta paramétrica esse erro apareceu como **6,8 · 6,5 · 6,5 unidades** nos três
   pontos centrais: erro constante em todo o percurso não é ruído, é uma grandeza
   diferente. `corridas()` de `medir.ts` devolve o centro; use-o.
5. **Conferência teal × preto ≈ metade do traço MEDIDO**, e ela roda no mesmo raio.
   Duas leituras independentes do mesmo lugar — o centro da corrida de preto e o
   começo do preenchimento depois dela — têm de distar meia espessura. Fora da janela,
   ou a máscara pega preto que não é da peça (mediana alta) ou pega a borda do
   preenchimento no lugar do centro (mediana baixa).
   **Meça a espessura, não a suponha:** o compositor desenha com `TRACO = 12`, e a
   arte gerada tem a espessura que o gerador quis — 3,7 u de mediana na
   `curto-espetada`. Comparar com 6 ali reprovaria uma medição perfeita.
   **E meça no raio, não no plano:** a primeira versão usou transformada de distância
   sobre a imagem inteira e deu 0,8 u onde o traço tem 3,7, porque o antialiasing
   entre o preto e o teal produz pixels que ainda passam no teste de matiz — havia
   "borda do preenchimento" espalhada por dentro do próprio traço.

## 2. Duas fontes, divisão de trabalho fixa

**Forma vem do line-art. Cor vem do PNG.** Não misture.

O conversor da Adobe devolve dois SVG do mesmo PNG, e só um serve: o **line-art**
(traço virado região preenchida, 6 paths, `fill="#000000"`) mede forma; o
**colorido** não serve para nada — ele veio com 532 tons numa ilustração de oito
tons chapados, e esses tons são invenção do traçador, assados em `fill=` literais
que não recolorem.

Antes de tocar em qualquer arquivo de referência, e sempre que uma medida vier de
uma imagem que você não mediu nesta sessão, carregue
[references/fontes.md](references/fontes.md).

## 3. O fluxo, em cinco passos

1. **Enquadrar.** `enquadramento(bitmap)` de `scripts/avatar/estilo/medir.ts` devolve
   `utilY0`, `utilY1`, `alturaUtilPx`, `fator`, `yCorte` e `eixoTroncoPx`. **Não
   recalcule à mão** — este cálculo já esteve copiado em quatro lugares.
2. **Escolher a varredura.** Onde a borda é quase vertical, varra por linha
   (`naLinha`); onde é quase horizontal, por coluna (`naColuna`). Uma varredura
   horizontal atravessa traço inclinado na diagonal e mede `t·√(1+m²)` — no ápice da
   cabeça a corrida mede **84 unidades para um traço de 12**.
3. **Medir com a técnica certa.** Tabela da §4.
4. **Conferir cruzado.** Meça a mesma coisa nas duas fontes, por réguas
   independentes, e **imprima a discordância**. Na arte definitiva ela deu 0,4 na
   meia-largura da cabeça e 0,1 na do tronco. Duas medições independentes que
   concordam em décimo de unidade não estão as duas erradas do mesmo jeito — é esse
   número que autoriza tratar um trace, que é um redesenho, como fonte de geometria.
5. **Colar e prender.** A tabela vai à mão para `geometria.ts`, e roda-se
   `npm run avatar:pose`.

**Os passos 4 e 5 não são opcionais.** Sem o 4 você tem um número; com ele, uma
medida. Sem o 5, o número não sobrevive ao próximo bloco.

## 4. Mapa: pergunta → ferramenta

| a pergunta | o que responde | o porquê está em |
|---|---|---|
| onde a figura começa e acaba? | `enquadramento(b)` | `medir.ts` |
| qual a silhueta em cada altura? | `silhueta(b)` | `medir.ts` |
| onde passa a **linha** do traço, e quanto ele mede? | `corridas` / `naLinha` / `naColuna` | `medir.ts` |
| todos os marcos do boneco de uma vez? | `medir(b)` | `medir.ts` |
| onde está a **aresta**, sem supor de que lado é mais escuro? | `particao(v, k)` | `medir.ts` |
| como abrir um PNG ou rasterizar um SVG? | `carregarPng` / `rasterizarSvg` | `raster.ts` |
| o contorno da cabeça e o perfil do tronco | `npm run avatar:linha-de-centro` | `linha-de-centro.ts` |
| minha curva emitida tem quina ou repuxo? | `npm run avatar:curvatura` | `curvatura.ts` |
| a pose está certa? os marcos batem? | `npm run avatar:pose` | `verificar-pose.ts` |
| cabe no orçamento? os cabelos se distinguem? | `npm run avatar:folha-base` | `folha-base.ts` |
| nasce aberto, pisca, respira, obedece reduced-motion? | `npm run avatar:animacao` | `medir-animacao.ts` |
| minhas 3 candidatas divergem de verdade? | `npm run avatar:variantes` | `variantes.ts` |
| esta arte aprovada vira peça de catálogo | `npm run avatar:tracar -- <png>` | `tracar-cabelo.ts` |
| o traço se parece com a arte? quanto disso é piso? | `npm run avatar:fidelidade` | `fidelidade.ts` |

Quando a pergunta não estiver aqui, ou quando duas técnicas parecerem responder à
mesma coisa, carregue [references/tecnicas.md](references/tecnicas.md).

## 5. Onde o número mora depois

`src/lib/avatar/estilo/geometria.ts` é o **dono único** da fronteira do boneco. O
`linha-de-centro.ts` **imprime** e não escreve: a colagem é manual de propósito,
porque colar é o momento em que alguém lê o número.

Todo número novo precisa de um gate que reprove quando ele for perdido — e o gate
**se valida invertendo o dado até ficar vermelho**. Teste que não reprova quando
devia é relatório. Antes de escrever gate novo, e sempre que um gate ficar verde na
primeira tentativa, carregue [references/provar.md](references/provar.md).

## 6. Escrever medição nova

Vive em `.scratch/estilo/<nome>.ts` e é **efêmero**. Regras que custaram rodada:

- **Importe** `medir.ts`, `raster.ts` e `geometria.ts`. Nunca recopie `spline`, `n`,
  o enquadramento nem os parâmetros de rasterização — três splines medindo a mesma
  curva é o modo de falha que este projeto já pagou seis vezes.
- **Constante a varrer entra por `process.env`**, com valor padrão:
  `const J = Number(process.env.JANELA ?? 15)`. A varredura vira um laço de shell.
  **Nunca reescreva o próprio script-fonte** para varrer — foi assim que
  `.scratch/estilo/densidade.ts` ficou sintaticamente quebrado, e ele ainda está lá.
- **Promova para `scripts/avatar/estilo/` só no segundo uso** (regra 3 do
  `CLAUDE.md`: nada de helper para operação usada uma vez).

Importe **símbolos nomeados**, não o arquivo inteiro de cabeça: `geometria.ts` tem
64 KB de docstring denso. O que você quase sempre quer é `bordasEm`, `spline`, `n`,
`CABECA`, `CAIXA_CABECA`, `GIRO`, `TRACO`, `SANGRIA`, `OLHO`, `SOBRANCELHA`.

## 7. Quando NÃO é esta skill

**Se não existe referência de onde extrair o número, ele é desenhado — e o assunto é
`avatar-desenho`.**

Esta seção não é cortesia: é a defesa contra a falha mais cara das duas skills.
Reportar número desenhado como se fosse medido é a mesma família do docstring que
afirmava que a sobrancelha lia `--av-cabelo` quando a arte nunca fez isso — uma
intenção descrita como se fosse fato. Os cinco cabelos de `cabelo.ts` são
desenhados, e o arquivo diz isso em caixa alta pelo mesmo motivo.

Cor de interface, tipografia, layout de tela: é `design-recruta64`, não esta.

## As regras de arte, que esta skill não repete

Elas são vinculantes e vivem em `docs/avatar/15-plano-ate-pronto.md`, seções **§7**
(método), **§7b** (arte de origem) e **§7c** (composição) — leia essas três e só
essas. A tabela de matiz e as cinco armadilhas do conversor estão em
`docs/avatar/16-uniformes-runbook.md`, **§2, §2.1 e §2.2, e só elas**: o banner no
topo daquele documento declara o resto morto, e ele está certo.
