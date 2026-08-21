<!-- SEED: estabelecido a partir da Bíblia Tonal, dos tokens em código e da
landing (src/app/page.tsx), que é a única superfície que já executa a direção
escolhida. Rodar `/impeccable document` de novo depois que os primitivos de
src/components/ui/ existirem, para capturar componentes reais. -->

---
name: Academia 64
description: A Academia 64 — a formação em xadrez do Clube de Xadrez Guabiruba, no celular do aluno
colors:
  deep-navy: "#0F1A2E"
  dark-base: "#060F18"
  gold: "#C9A84C"
  gold-light: "#E8D48B"
  brand-cyan: "#00D4AA"
  brand-teal: "#0A8F7F"
  warm-stone: "#F5F0E8"
  warm-ivory: "#FAF8F3"
  patente-soldado: "#78833B"
  patente-aspirante: "#384966"
  patente-capitao: "#3E8C81"
  patente-comandante: "#3A55B5"
  patente-general: "#7A3168"
  patente-mestre: "#AEBCCE"
  patente-latao: "#B5AE4A"
  traco-kokeshi: "#000000"
typography:
  display:
    fontFamily: "var(--font-cinzel), Georgia, serif"
    fontWeight: 700
  headline:
    fontFamily: "var(--font-cinzel), Georgia, serif"
    fontWeight: 600
  body:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontWeight: 600
---

# Design System: Academia 64

## Overview

**Creative North Star: "Academia 64"** — uma academia extraordinária de
estratégia onde se estuda xadrez, e onde o aluno **conquista títulos** conforme
aprende. Fantasia leve e mistério, **sem época**: a coerência vem do lugar
compartilhado, não de um século compartilhado.

> O universo e o produto passaram a ter o mesmo nome em 2026-08-20. *Recruta 64* é
> nome histórico — sobrevive em nome de arquivo de doc, migration e diretório do
> repositório, e em lugar nenhum que o aluno leia. A lei é
> [`docs/Academia64_Biblia_Tonal_v2.md`](docs/Academia64_Biblia_Tonal_v2.md); o
> porquê medido está no Apêndice A de lá. **Slogan oficial:** *"Uma academia
> inteira, e 64 casas para explorar."*

**Direção macro: Continuidade** — decidida em 2026-07-31, comparando três
candidatas lado a lado em `/design-lab`. O app passa a falar a língua que a
landing já fala: navy profundo, ouro raro, Cinzel nos títulos, marfim quente no
fundo. Fio de contorno finíssimo em vez de peso; sombra quase ausente.

**Rejeições confirmadas** — foram construídas, vistas e descartadas, e não
devem voltar como sugestão:
- **Kokeshi** (contorno preto de 2,5px, cor chapada, sombra dura deslocada): é o
  traço do avatar, mas na interface inteira infantiliza o aluno mais velho e
  briga com o tabuleiro do chessground.
- **Patentes** (a tela toda muda de temperatura com o degrau): executa bem a
  curva tonal §14, mas são seis temas para manter em vez de um, num produto que
  ainda não tem nem primitivos.

A personalidade é **premium e limpa, não barulhenta**. A fantasia entra pelo
vocabulário e pela cor do título, quase nunca por ornamento: o objeto central de
quase toda tela é um tabuleiro de xadrez, e ele não disputa atenção com moldura.
A **moldura de título é a única exceção**, e é pequena de propósito: um anel em
volta do avatar, nunca em volta do tabuleiro.
A densidade é **alta em informação, baixa em decoração** — o aluno abre o produto
em intervalos de minutos, no celular, e precisa ver onde parou antes de ler
qualquer número.

A curva tonal da Bíblia Tonal §8 é regra de sistema, não de texto: **início
acolhedor e humano → meio curioso e preciso → fim econômico e marcante.**
Uma tela de primeira aula e uma tela de Grão-Mestre não devem ter a mesma
temperatura.

**Key Characteristics:**
- Fantasia leve e mistério, com símbolos de estudo, estratégia e reconhecimento
- Interface premium e limpa; o tabuleiro é o herói, a moldura recua
- Progressão visível por título — a cor é o degrau, e o lugar dela é a **moldura
  em volta do avatar**, não a roupa do boneco
- Celular primeiro, a sério: 375px é o alvo de projeto
- Prestígio sem humilhação

## Colors

Duas famílias que **não se misturam**: a paleta de marca (navy/ouro/creme, que
ambienta) e a escada de títulos (que sinaliza progresso, e é medida por gate).

### Primary
- **Deep Navy** (`#0F1A2E`): o fundo de seção escura e a cor de comando. É o
  "dentro da Academia" — usado em faixas, cabeçalhos e superfícies de destaque,
  nunca como fundo de leitura longa.
- **Gold** (`#C9A84C`): o acento de honra. CTA primário, marco alcançado,
  destaque de mérito. É o ouro do estandarte, não de moeda.
- **Gold Light** (`#E8D48B`): estado hover/ativo do ouro.

### Secondary
- **Brand Cyan** (`#00D4AA`): a cor do logotipo e do wordmark. Vive na identidade,
  não na interface.
- **Brand Teal** (`#0A8F7F`): par escuro do ciano, para contraste sobre claro.

### Neutral
- **Warm Ivory** (`#FAF8F3`): o fundo claro padrão. Marfim quente, não branco puro
   — o branco puro brilha demais no celular sob luz de sala.
- **Warm Stone** (`#F5F0E8`): superfície de card sobre o marfim.
- **Dark Base** (`#060F18`): o mais escuro, para rodapé e para o degrau abaixo do
  navy.

### Onde os tokens moram

**`src/app/globals.css`, no bloco `@theme`. Fonte única.** No Tailwind v4 o
`@theme` gera a CSS var e a utility de uma vez, então não há como declarar duas
vezes. `tailwind.config.ts` foi deletado; a régua espelhada em TS é
`scripts/design/tokens.ts`, e `npm run verify:design-tokens` mede que os dois
continuam de acordo.

Além dos 8 de marca, três tokens que a direção A pediu:
- **Ink** (`#1B2432`): a cor de texto do app. Não é preto — preto sobre marfim
  é duro demais para leitura longa em celular.
- **Ok** (`#16A34A`) e **Erro** (`#DC2626`): semânticos. O matiz é **provisório**
  — foi herdado do que o código já usava (green-600/red-600) para a migração ser
  neutra. Refiná-los dentro da direção A é trabalho registrado, não feito.

### A escada de títulos
As seis cores de progressão. **Não são decorativas: são a régua do produto**, e
vêm de `scripts/avatar/patentes.ts`, que é a fonte única e é medida por
`npm run verify:paleta-patentes`.

| tier | título | token CSS | Cor | Matiz |
|---|---|---|---|---|
| 1 | Aprendiz | `patente-soldado` | `#78833B` | oliva |
| 2 | Estudante | `patente-aspirante` | `#384966` | aço |
| 3 | Analista | `patente-capitao` | `#3E8C81` | verde-azulado |
| 4 | Estrategista | `patente-comandante` | `#3A55B5` | azul |
| 5 | Mestre | `patente-general` | `#7A3168` | púrpura |
| 6 | Grão-Mestre | `patente-mestre` | `#AEBCCE` + latão `#B5AE4A` | prata |

**Os tokens CSS e o nome do arquivo continuam dizendo "patente"** — e é de
propósito. Renomear token, componente e script npm é churn sem valor: ninguém os
lê a não ser quem programa. O nome **exibido** é a coluna "título"; o token é
chave, não texto de aluno. Passivo conhecido e declarado (Bíblia v2 §6).

Os tiers **0 (Calouro)** e **7 (Lenda)** não têm cor na escada — usam o tone
`neutro`.

### Named Rules

**The Title Ladder Rule.** As seis cores da escada só significam título. Usar
`#3A55B5` porque "ficou bonito nesse botão" quebra o único sinal de progressão
que o produto tem. Se a cor não está dizendo *em que degrau o aluno está*, ela
não é dessa família.

**The Two Color Languages Rule.** Existem **duas** linguagens de cor com significado
no produto, e elas nunca ocupam o mesmo elemento:

| | título | raridade |
|---|---|---|
| responde | quem o aluno **é** | quanto uma peça é **rara** |
| onde vive | **moldura em volta do avatar** — navbar, rankings, mural, saguão, perfil | **vitrine e cards do editor de avatar** |
| fonte | `scripts/avatar/patentes.ts` | as cores de raridade do editor |

Cor de raridade em volta de um avatar, ou cor de título num card de vitrine, ensina
o aluno que cor não significa nada. A escada **deixou de vestir o boneco** em
2026-08-13 — o traje é peça de catálogo com cor livre, e o título aparece só na
moldura.

**The Frame Is Not Art Rule.** A moldura de título é **CSS fora do SVG** e é
**automática** — sai de `achieved_tier`, sem slot, sem escolha, sem estado novo.
Custo de arte zero, e é por isso que ela cabe. Uma moldura que precisasse de asset
por título seria seis assets para manter, e não valeria.

**Ela tem duas camadas, e a de fora é a que a faz existir** (2026-08-17, achado
G23): o anel do título, e um **fio de 1 px de `ink` por fora dele**. Sem o fio, o
anel do Grão-Mestre `#AEBCCE` fica em razão de contraste **1,82** contra o marfim —
abaixo do piso 3 da WCAG 1.4.11, e portanto invisível justamente no aluno mais
avançado do produto. Trocar a cor dele não resolve: contra o navy quem reprova são
Estudante (1,92), Mestre (2,04) e Estrategista (2,61), e o Grão-Mestre passa em
9,01. A
luminância das seis vai de 0,066 a 0,494, e **nenhuma superfície única cobre essa
faixa nas duas pontas** — é aritmética, não gosto. O fio tira a questão do eixo da
cor e a põe no da forma, que é a regra 8 da direção Continuidade aplicada ao
avatar: *separação por fio tingido, não por sombra*.

O fio é **token da superfície, não do título**: sobre o marfim ele é `ink`; sobre
uma superfície escura ele terá de ser claro. Quando isso acontecer, o que muda é o
fio — as seis cores da escada não se mexem. `verify:paleta-patentes` mede as duas
metades separadamente: o **fio contra o fundo** em razão de contraste (≥ 3 — faz a
forma existir) e cada **título contra o fio** em distância RGB (≥ 40 — faz a cor
ainda ser cor). E `moldura-fio.test.ts` renderiza o componente para provar que as
duas camadas chegam à tela, porque foi a distância entre régua e render que deixou
o Grão-Mestre invisível com o gate verde.

A **faixa proibida de matiz 0°–44°** (doc 17) era lei do pipeline de recoloração do
SVG, onde matiz quente colidia com a pele do boneco. Fora do SVG não há colisão: **a
moldura pode usar dourado.** As distâncias mínimas — ≥40 entre títulos quaisquer,
≥60 entre vizinhos — continuam valendo e continuam medidas.

**The Measured Palette Rule.** Nenhuma cor entra perto da escada de títulos sem
passar por `verify:paleta-patentes`. Existe lei de distância mínima de matiz entre
títulos vizinhos, e ela já reprovou um dourado: **`#C9B37E` é proibido** — cai a
3° de outro título. Cuidado especial porque o `gold #C9A84C` da marca vive na
mesma vizinhança: ele é cor de *marca*, e nunca deve aparecer como se fosse
título.

**The One Gold Rule.** O ouro é raro por definição. Numa tela, ele marca **uma**
coisa: a ação principal ou o mérito alcançado. Dois ouros disputando é nenhum
ouro.

**The Colorblind Rule.** Cor nunca sozinha. Acerto, erro, bloqueado e concluído
carregam forma ou ícone além da cor. Não negociável: é produto de xadrez, para
crianças, e daltonismo é comum.

## Typography

**Display Font:** Cinzel (`var(--font-cinzel)`, com Georgia / serif)
**Body Font:** Inter (`var(--font-inter)`, com system-ui / sans-serif)
**Label/Mono Font:** nenhuma distinta hoje.

**Character:** Cinzel é capitalis romana — pedra, inscrição, honra. É de onde vem
toda a gravidade do produto sem precisar de um único ornamento; na Academia 64 ela
lê como inscrição de fachada e placa de sala, não como pergaminho de reino — é a
fachada de pedra da Academia, e a fantasia mora dentro do prédio. Inter
faz o trabalho de leitura no celular, invisível de propósito. O par funciona
porque um fala e o outro informa; **quando os dois falam, nenhum é ouvido.**

### Hierarchy
- **Display** (Cinzel 700): título de tela e título do aluno. Aparição rara.
- **Headline** (Cinzel 600): título de bloco — "Missões do Dia", "Sequência de
  Presença".
- **Title** (Inter 600): título de card e de item de lista.
- **Body** (Inter 400): todo texto corrido. Português para leitor iniciante —
  frase curta, voz ativa.
- **Label** (Inter 600, com tracking): rótulo, badge, valor numérico.

### Named Rules

**The Cinzel Scarcity Rule.** Cinzel só em título de tela e título de bloco.
Cinzel em corpo de texto, em botão ou em rótulo lê como convite de casamento e
some no celular — a face é de inscrição, não de leitura. Se está em dúvida, é
Inter.

**The Number Is Not Prose Rule.** Rating, XP, streak e posição são **rótulo**, não
corpo: peso 600, tabular quando disponível, e nunca dentro de uma frase que o
aluno tenha de ler para achar o número.

## Layout

Mobile-first, e literalmente: **375px é a largura de projeto**, não o caso
degradado. O layout se desenha em coluna única e cresce; nunca se desenha em
grade de desktop e encolhe.

Duas superfícies com regras distintas:
- **Telas de prática** (Desafios, Sala de Duelos, exercício de aula): o tabuleiro
  ocupa a largura, e tudo que não for o tabuleiro ou a ação seguinte sai de cima
  da dobra. Nenhuma dessas telas pode exigir rolagem entre ver a posição e fazer
  o lance.
- **Telas de leitura** (Saguão, Perfil, Quadro de Honra, Turmas): blocos
  empilhados, o mais mutável no topo. Sensação de **mesa de estudo**: cada bloco
  com uma pergunta só, respondida em um relance.

**Alvo de toque: 44px mínimo.** A mão é de criança e a tela é pequena.

Sem overflow horizontal em 375px — é a asserção que
`e2e/bots-ui-audit.spec.ts` já faz, e é o piso para qualquer tela nova.

## Elevation & Depth

**Sistema tonal com fio, não sistema de sombra.** A separação entre superfícies
vem de um contorno de 1px levemente tingido — o padrão que a landing já usa
(`border-gold/10`, `/20`, `/25`) e que a superfície de app traduz para
`border-[#1B2432]/10`. Cartão branco sobre fundo marfim, separado por fio.

O motivo é medido, não estético: sombra difusa sobre marfim, em celular barato
sob luz de sala de aula, **desaparece**. Se a hierarquia depende dela, a
hierarquia sumiu.

### Shadow Vocabulary
- **Repouso** (`shadow-sm` ou nenhuma): o padrão. Superfície plana, separada por
  fio.
- **Sobreposto** (`shadow-md`): só o que flutua de fato — modal, popover, menu.
- **Glow de honra** (`shadow-glow-gold`, `0 0 20px rgba(201,168,76,.15)`): a
  sombra-assinatura, reservada ao momento de mérito — título conquistado, baú
  concedido, marco de formação. É o único brilho do sistema.

### Named Rules

**The Flat-By-Default Rule.** Superfície em repouso é plana. Elevação é
**resposta a estado** (flutuar, focar, conquistar), nunca decoração de partida.

**The One Glow Rule.** `shadow-glow-gold` marca conquista, e conquista é rara.
Usá-la em card comum gasta o único momento visual que o produto guardou.

## Shapes

Raio moderado e consistente, herdado da landing:

- **`rounded-lg` (8px)** — o padrão. Card, botão, campo, linha de lista.
- **`rounded-xl` (12px)** — bloco grande e contêiner de seção.
- **`rounded-full`** — só pílula: badge de título, avatar, barra de XP.

Sem canto vivo (`rounded-none`) e sem canto exagerado (`rounded-3xl`): o
primeiro lê como planilha, o segundo como brinquedo. A silhueta do produto é
sóbria.

**Contorno:** fio de 1px tingido do texto ou do ouro, nunca preto puro. O
`#000000` pertence à arte do avatar (base kokeshi aprovada), **não à interface**
— contorno preto e sistema tonal com fio não convivem na mesma tela.

## Components

**Wave 1 existe** em `src/components/ui/`: `Button`, `Card`/`CardTitle`, `Badge`,
`ProgressBar`, mais o helper `cn()` em `src/lib/cn.ts`. A referência viva é
`src/app/design-lab/VariantA.tsx`, que os consome — e que renderiza **pixel a
pixel idêntico** à versão escrita à mão, medido por screenshot do elemento.

Ainda **não** existem (wave 2, nascem com a tela que os pedir): `Modal` +
`ConfirmDialog`, `Field`/`Input`/`Select`, `Toast`, `Spinner`/`Skeleton`,
`EmptyState`/`ErrorBanner`. Até lá, cada modal segue reimplementando o próprio
overlay — 4 deles, nenhum com ESC, foco preso ou `role="dialog"`.

### Buttons
- **Shape:** `rounded-lg`, altura mínima **44px** (alvo de toque).
- **Primary:** fundo `gold #C9A84C`, texto `deep-navy`. É o "One Gold" — um por
  tela.
- **Secondary:** fundo branco, fio `border-[#1B2432]/10`, texto navy. É o botão
  padrão do app; a maioria das ações mora aqui.
- **Hover / Focus:** hover muda o fio para `border-gold/60`, não a cor de fundo —
  transição de cor em ~150ms. Foco visível sempre, com anel próprio.

### Cards / Containers
- **Corner:** `rounded-lg`; `rounded-xl` em bloco de seção.
- **Background:** branco sobre o marfim `#FAF8F3` da página.
- **Border:** `border-[#1B2432]/10`. **Shadow:** nenhuma em repouso.
- **Padding:** 16px; 20px em bloco de seção.
- **Título:** Cinzel 13px, versalete, `tracking-[0.14em]`, em `/70` de opacidade.

### Badge de título
- **Style:** pílula com o ponto de cor do título vindo de
  `scripts/avatar/patentes.ts` (importado, nunca copiado) — e **o nome escrito
  junto**, nunca a cor sozinha.
- **Onde:** só onde o título é protagonista — faixa de comando, perfil, tela de
  promoção. **Não em linha de lista.** A "Colorblind Rule" pede cor nunca
  sozinha, não cor sempre: cinco pílulas coloridas numa lista de cinco competem
  com o nome e o número, que são a informação. Em lista, o título é texto.
- Título sem cor na escada ("Calouro", "Lenda") usa o tone `neutro`, sem
  inventar cor.

### Inputs / Fields
- **Style:** fundo branco, fio `border-[#1B2432]/10`, `rounded-lg`, altura 44px.
- **Focus:** fio vira ouro. **Erro:** fio + ícone + texto — nunca só a cor.

### Navigation
- Rótulos em palavra clara (Início, Trilhas, Desafios, Bots, Quadro de Honra,
  Perfil, Turmas) em Inter. Item ativo marcado por **peso e fio inferior ouro**,
  não por fundo colorido. No celular, barra inferior fixa com alvos de 44px.

### Faixa de comando (componente-assinatura)
O cabeçalho de tela em `deep-navy`, com o supertítulo em Cinzel/versalete/ouro
("ACADEMIA 64", "TÍTULO ANALISTA"), o título grande em Cinzel, e a barra
de XP em ouro sobre `warm-ivory/15`. É o que faz o app parecer o mesmo produto
que a landing — ver `VariantA.tsx`.

## Do's and Don'ts

### Do:
- **Do** usar o vocabulário oficial da Bíblia Tonal §7 em todo título e bloco:
  Saguão, Trilhas, Desafios, Missões do Dia, Revisão da Partida, Quadro de Honra,
  Sequência de Presença, Insígnias, Guarda-roupa, Turmas, Sala de Duelos,
  Matrícula. A **navegação principal** fica em palavra clara (Início, Trilhas,
  Desafios, Bots, Quadro de Honra, Perfil, Turmas) — o tema entra dentro da tela,
  não no menu.
- **Do** tratar `#FAF8F3` como o branco do produto. Branco puro brilha demais.
- **Do** deixar o tabuleiro ser o herói. O chessground tem CSS próprio e não se
  redesenha à vontade; a interface se acomoda a ele.
- **Do** projetar acerto e erro com **forma além da cor**.
- **Do** mostrar recompensa apenas depois que o servidor concedeu. XP, baú e
  level-up são reação a fato confirmado — nunca promessa otimista na tela.
- **Do** aplicar a curva tonal §8: a tela de primeira aula é mais acolhedora, a
  tela de título alto é mais econômica e mais marcante.

### Don't:
- **Don't** cair em guerra realista, brutalidade explícita, humor pastelão,
  estética caótica ou dark fantasy pesada. São as cinco rejeições nomeadas na
  Bíblia Tonal §3, e valem para ilustração, ícone e cor.
- **Don't** humilhar no Quadro de Honra (Bíblia §12.5). Nada de "pior colocado", vermelho de
  fracasso ou queda destacada. Crianças da mesma turma se conhecem pessoalmente.
- **Don't** usar `#C9B37E` — reprovado pelo gate de matiz por 3°.
- **Don't** usar cor da escada de títulos para qualquer coisa que não seja
  título.
- **Don't** escrever palavra banida em texto de aluno (Bíblia §7): campanha,
  patente, recruta, companhia, quartel, batalha, tropa, reino, "falha tática".
  Elas vivem só em `docs/_superado/`, migration antiga e nome interno de código.
- **Don't** deixar `zinc-*`, `amber-*` ou qualquer cor crua do Tailwind numa tela
  já migrada. Hoje o app tem 171 usos de `text-zinc-500` — é exatamente o débito
  que este arquivo existe para pagar.
- **Don't** fabricar prova social. Não há depoimento, número de usuário, prêmio ou
  caso de sucesso: o produto só tem contas de teste.
- **Don't** projetar em desktop e encolher.

---

## Como ver o que foi construído

Não critique design por leitura de código. O laço é: construir → ver → criticar
→ corrigir, **em 375px primeiro**.

```
npm run dev            # num terminal
npm run shot:design    # noutro — sai em .validation-shots/
```

Gera a folha de contato (as três direções lado a lado, uma imagem só) e cada
direção em 375px, e **reprova com exit 1 se houver overflow horizontal**.

Com o **Playwright MCP** carregado, dirija o navegador direto: `npm run dev`,
navegue até `http://localhost:3000/design-lab`, screenshot em 375px antes de
1280px. A vitrine não tem login e não toca no Supabase — é por isso que ela
existe.

⚠️ **Nunca use `npm run test:e2e` nem `npx playwright test` para verificação
visual.** Eles batem no Supabase de **produção** e criam usuários reais. Estão
bloqueados por `deny` em `.claude/settings.json`, e o bloqueio é para ficar.

---

## O que a escolha da direção A ainda deixa em aberto

- **Tema escuro.** Hoje `color-scheme: light` está fixo. A direção A tem navy
  como cor de comando, o que torna um tema escuro plausível — mas ele não foi
  decidido nem projetado.
- **A curva tonal §8 dentro de uma direção só.** A direção C resolvia isso por
  temperatura de tela inteira. Na A, a diferença entre "primeira aula" e
  "Grão-Mestre" ainda precisa de um mecanismo — provavelmente densidade de ouro e
  silêncio, não cor de fundo.
- **Onde o título aparece.** Ficou como badge e como cor de marca no ranking. Se
  isso é sinal suficiente de progressão só se descobre com o aluno.

As duas direções descartadas **foram removidas do código** (commit da wave 1 de
primitivos). O registro do que foi comparado, e por que cada uma caiu, está na
seção *Overview* deste arquivo — que é onde ele sobrevive a um `git log`.
`/design-lab` agora tem duas abas: o comp do Saguão e a folha de
estados dos primitivos.
