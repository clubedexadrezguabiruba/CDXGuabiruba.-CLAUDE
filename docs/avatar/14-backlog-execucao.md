# Avatar / Arte / Baús — Backlog de Execução

> **O plano de execução vigente é o `15-plano-ate-pronto.md`.** Este documento
> continua sendo onde o **progresso** fica marcado, tarefa a tarefa, mas a
> ordem e o escopo daqui para a frente vêm do 15 — inclusive seis divergências
> deliberadas em relação a este arquivo, todas listadas lá com o motivo.

> Lista completa de tarefas para refazer o subsistema. Ordenada por dependência:
> nada numa fase começa antes de a anterior fechar o gate.
>
> **Fontes:** decisões em `12-avatar-v4-plano-completo.md`, verificações em
> `13-checklist-de-verificacao.md`.
>
> **Convenções:** 🤖 = eu faço · 👤 = você faz · 🔒 = gate que precisa passar.
>
> **Decisões que mudaram depois do doc 12:**
> - ~~**D25 revertida:** as trilhas vão crescer para 7, então a patente volta a
>   ser por **trilha completa**.~~ **Revogado em 2026-07-29.** A patente passou a
>   ser por **trilha de nível de 30 aulas**, e a régua virou dado
>   (`title_tiers`). Ver F3a. O motivo: o levantamento contra produção mostrou
>   que o defeito não era a régua nem a premissa não verificada — era um
>   `UPDATE` sem `UPSERT` que perdia a concessão em silêncio para quem não
>   tinha linha em `user_titles`.
> - **Arte:** eu gero a primeira passada dos 45 assets em SVG; você refina.
> - **Sem piloto** antes do redesenho — decisão do usuário, registrada.

---

# F0 — Fundação técnica

Nada aqui depende de arte. Pode começar hoje.

> **Estado em 2026-08-03:** **19 das 23 tarefas da F0 fechadas.** Abertas:
> T0.9 (folha de contato), T0.20 e T0.22 (testes unitários de ordem de camadas
> e de offset) e T0.23. As duas decisões do usuário (T0.12, T0.14) foram
> delegadas e estão tomadas, com a evidência renderizada.
>
> Para **ver o boneco**: `/dev/avatar-base` no app (professor/admin), ou
> `npm run avatar:base`, que regera o SVG e a folha de conferência em `.scratch/`.
> A rota `/dev/avatar` e o `avatar:prototipo` foram apagados junto com o boneco
> gerado em código — ver a T0.10.

## Detecção e integridade

- [x] **T0.1** 🤖 Manifesto de assets: script varre `public/items/`, gera `assetManifest.ts`
      → `scripts/avatar/gen-manifest.ts` + `asset-scan.ts`; `prebuild` roda `--check`
- [x] **T0.2** 🤖 `assetResolver` consulta o manifesto em vez de montar caminho por convenção
      → `resolveAsset()` devolve `{ candidato, src, ausente }`
- [x] **T0.3** 🤖 `AvatarLayer` falha alto em asset ausente (hoje devolve `null` em silêncio)
      → `console.error` sempre, `data-avatar-missing` no container, moldura magenta em dev.
      A falha DURA é o gate no CI; derrubar a tela de uma criança por causa de um chapéu seria pior
- [x] 🔒 **Gate:** item de catálogo sem asset **quebra o build**. Provar injetando um item órfão
      → provado removendo `peao-madeira.png`: gate e `prebuild` saem com código 1; restaurado, saem 0
- [x] **T0.4** 🤖 Gate reporta asset órfão (arquivo sem item correspondente)
      → 1 órfão hoje: `camiseta-clube-male-master.png`

**Medido**: 32 dos 77 itens vestem o boneco, 47 têm miniatura. O gate é ratchet
(`asset-baseline.json`) — o passivo fica congelado, item novo quebrado falha.

**Achado colateral (bug pior que "nada muda")**: o `headKnockout` recortava o
topo da base sempre que havia item de `head` equipado, mesmo quando o chapéu não
renderizava. Equipar 7 dos 8 itens de head deixava o boneco **decapitado**.
Corrigido: só recorta quando o chapéu realmente aparece.

## Ponte — loop honesto sem arte

- [x] **T0.5** 🤖 `claim_chest` sorteia só itens que renderizam (32 dos 77)
      → migration `20260729120000_avatar_v4_ponte_baus.sql`: `items.renderable`
      (default **false**, fail-closed) + filtro em `claim_chest` e `_create_random_pet_egg`
- [x] 🔒 **Gate:** abrir 20 baús, todo item recebido aparece no boneco
      → `verify-chest-pool.ts` abre **60**, dentro de uma transação com ROLLBACK,
      personificando um usuário existente via `request.jwt.claims`. Não deixa rastro,
      então roda em CI — ao contrário do e2e
- [x] ⚠️ Extrair o corpo da função de `pg_get_functiondef` do banco **vivo**, nunca de migration antiga

**Medido, antes**: 60 aberturas → 36 itens distintos, **25 invisíveis**.
**Depois**: 60 aberturas → 20 itens distintos, **0 invisíveis**.

`_create_random_pet_egg` entrou junto porque `claim_chest` só decide "caiu em
pet" — quem escolhe o pet é ela. Filtrar de um lado só deixaria a criança chocar
um ovo de 72 h para receber um pet invisível.

## Pipeline de arte

- [x] **T0.6** 🤖 Pipeline de vetorização — **cumprida por outro caminho**
      → não é `vetorizar.ts` com VTracer embutido: é `scripts/avatar/gerar-base-recolorivel.ts`
      (`npm run avatar:base`), e a vetorização acontece **fora**, no conversor da Adobe.
      O contrato de entrada e saída é o mesmo — raster entra, SVG recolorível sai —
      mas quem traça é uma ferramenta externa, e o script existe para **devolver a cor**
      ao traço: faixas de pele viram `var(--av-pele)`, pano vira `var(--av-roupa)`, e a
      diferença de luminosidade entre faixas vira sombra por cima. Oito defeitos do
      traçador estão documentados e medidos no cabeçalho do script
- [x] **T0.7** 🤖 `src/lib/avatar/palette.ts`: rampas de pele (8), cabelo (5), destaque por raridade
- [x] **T0.8** 🤖 Validador de paleta: falha se duas cores estão próximas demais para não se fundirem
      → medido contra o boneco real: tinta contra o tom mais escuro dá **82,5** (mínimo 40),
      roupa da base contra o tom mais próximo dá **47,7** (mínimo 25)
- [ ] **T0.9** 🤖 Folha de contato: renderiza cada item sobre a base nos 4 tamanhos, gera 1 imagem
      → **a metade da base está feita**: `avatar:base` emite `folha-recolor.png` com os 8 tons,
      os 4 tamanhos, o corte de 56 px e o rosto de perto. Falta a versão com os itens
      sobre a base, que é o 3.1 do doc 15. A `folha-contato.ts` antiga foi apagada:
      renderizava o boneco de protótipo, que não existe mais
- [x] **T0.10** 🤖 Página de teste de tamanhos: 56 / 100 / 200 / 340 px, com fundo, moldura e pet
      → **a rota `/dev/avatar` foi apagada** junto com o boneco de protótipo. Sucedida por
      `/dev/avatar-base`, que mostra o boneco real nos 4 tamanhos, nos 8 tons e a 56 px,
      com a mesma tranca (professor/admin, 404 para aluno) e o mesmo e2e,
      `e2e/dev-avatar.spec.ts`, reapontado. Os controles de chapéu, uniforme, fundo e
      moldura morreram com o protótipo e voltam no Bloco 5, quando houver composição

**Achado na T0.10, adiantando a T4.5:** os **8 backgrounds antigos destoam**.
São pinturas suaves; o boneco novo é chapado com contorno duro. Lado a lado não
lêem como um sistema só. Provável **+8 desenhos** no orçamento — confirmar na F1,
mas a evidência já existe em `.scratch/pagina-avatar-v4-completo.png`.

## Decisões que dependem de ver

- [x] **T0.11** 🤖 Gerar o boneco em **1:2, 1:3 e 1:4** e renderizar a 56 px
      → `npm run avatar:prototipo`; uma função gera as três, `cabecas` é o único
      parâmetro que muda, para a comparação ser entre proporções e não entre desenhos
- [x] **T0.12** 👤→🤖 ~~**Proporção escolhida: 1:3**~~ *(usuário delegou a escolha)*
      → **REVOGADA em 2026-07-31 pela troca de estilo (doc 15, Bloco 1).** A cabeça
      passa a ser **0,52 da figura** (≈1:2), medida na `referencia-base.png`. O
      boneco kokeshi não tem pernas, então a figura de três cabeças que a T0.11
      comparou não existe mais. A régua é `src/lib/avatar/estilo/geometria.ts`
      *(o 0,508 escrito aqui antes saiu de uma medição que lia a silhueta como
      "pixel diferente do fundo" e engolia a sombra do chão junto; o valor certo é
      0,52 — ver o cabeçalho de `scripts/avatar/estilo/medir.ts`)*
- [x] **T0.15** 🤖 **Bloco 1b — a base refeita com a assimetria medida**
      *(2026-07-31)*. O Bloco 1 entregou a arquitetura e o Doug a aprovou; a base
      visual foi **reprovada** e é isto que a refaz. A pose deixou de ser tratada
      como simétrica: entra a constante `GIRO` em `geometria.ts` com os cinco
      deslocamentos medidos, o topo da cabeça vira cúpula (o chato do ápice cai de
      48% para 10% da largura), os olhos ficam assimétricos e 32% mais largos, a
      mancha diagonal no rosto vira **plano lateral** na borda, a sombra do chão
      volta a ser centrada e do tamanho medido, e o tronco passa a ter o ponto
      mais largo a 57% da altura. Nasce junto `npm run avatar:pose` — o 15º gate
      do `verify:all` —, que mede perfil externo, marcos da pose e unicidade de
      `id`, com **três fixtures** que reprovam uma em cada. `ns` deixou de ter
      valor padrão: o `typecheck` agora cobra a unicidade de quem compõe
- [x] **T0.13** 🤖 Converter 1 pet para SVG animado por CSS e comparar com o APNG
- [x] **T0.14** 👤→🤖 **Pets viram SVG** *(usuário delegou; confirmar se discordar)*

### Por que 1:3 (T0.12)

A pergunta útil não é qual boneco é mais bonito — é **em qual proporção o
catálogo continua distinguível a 56 px**. O plano tem 6 chapéus + 5 cabelos na
cabeça (11 itens) e 7 uniformes no tronco. Cabeça grande favorece 11, tronco
grande favorece 7. Os três foram renderizados vestidos, a 56 px reais:

| | 1:2 | 1:3 | 1:4 |
|---|---|---|---|
| boné / elmo / coroa se distinguem? | sim | **sim** | elmo perde a forma |
| acabamento do uniforme (gola, cinto, divisa) | some, sobra só a cor | **aparece** | aparece |
| rosto | ótimo | **bom** | boca some |

**1:3 é o único ponto em que as duas metades do catálogo funcionam.** Não é
compromisso por indecisão: 1:2 reduz os 7 uniformes a 7 cores chapadas, o que
contradiz o D17 ("raridade é acabamento, nunca volume"), e 1:4 mata os itens de
cabeça, que são a maioria.

Folha da prova: `.scratch/proporcao/vestidos/folha-vestidos.png`.

### Por que SVG nos pets (T0.14)

Medido no único pet com arte real:

| formato | peso | 20 pets |
|---|---|---|
| APNG animado + PNG estático | 4,0 MB por pet | **78,1 MB** |
| SVG animado por CSS | 3,7 KB | **74,6 KB** |

E a 56 px — lembrando que o pet renderiza a **24 px** no tamanho `sm` — o APNG
vira um borrão marrom enquanto o SVG mantém silhueta, olhos e boca. A
refinaria do APNG só existe em tamanhos que quase ninguém vê. De brinde: o SVG
recolore pela paleta, um arquivo serve a todos os tamanhos, e a animação
respeita `prefers-reduced-motion`, coisa que APNG não faz.

**Ressalva honesta:** perde-se animação com deformação quadro a quadro, e meus
pets orgânicos vão precisar do seu refino — o que a T4.7 já assumia. O formato
não muda a dificuldade de desenhar um bicho; muda todo o resto.

Folha da prova: `.scratch/pet/folha-pet.png`.

### Confirmado de brinde: D4 e D18

Os 8 tons de pele e os 5 cabelos são troca de classe CSS, um arquivo só. Menor
distância entre cor e contorno: **58** — contra **18** no caso documentado que
fundiu (`#4a3526` com `#3d2b1f`). Folha: `.scratch/proporcao/paleta/`.

## Gates de banco que faltam

- [x] **T0.15** 🤖 `scripts/verify/phase8/`: RPCs presentes; CHECK de slots; UNIQUE de `user_inventory` e `user_equipped`
      → mais: confere que a lista de slots hard-coded dentro de `unequip_slot` bate com o CHECK.
      São duas cópias da mesma verdade, e na F2 esquecer uma deixa `hair`/`back` impossíveis de desequipar
- [x] **T0.16** 🤖 **No mesmo gate:** assertar que `inventory_select_classmate` e `equipped_select_classmate` **NÃO existem**
- [x] **T0.17** 🤖 Gate da premissa da patente
      → **reescrito em 2026-07-29**, junto com a F3a. A versão antiga lia os
      `ARRAY[...]` de dentro de `complete_lesson_step`; esses arrays não existem
      mais. Agora confere a régua em `title_tiers` (escada contígua e crescente),
      a wiring (a função chama `recompute_user_title`), o estado dos usuários
      (todo mundo tem linha; ninguém abaixo do que a contagem lhe dá) e o alcance
      (uniforme só em patente que o conteúdo alcança)
- [x] **T0.18** 🤖 Adicionar `verify:phase8` ao `verify:all` e ao CI
      → `verify:all` ganhou os gates novos. O CI já roda `verify:all`, então não precisou de passo novo

## Testes unitários — não existe nenhum hoje

- [x] **T0.19** 🤖 `src/lib/avatar/__tests__/`: resolver de asset
      → 25 testes novos (108 → 133). Inclui um que amarra `renderability.ts` a
      `resolveAssetUrl()`, para mudar o sufixo num lugar e não no outro não passar despercebido
- [ ] **T0.20** 🤖 Ordem de camadas e z-index
- [x] **T0.21** 🤖 Encaixe na paleta (incluindo o caso de cores próximas)
      → medição de distância roda dentro de `npm run avatar:prototipo`
- [ ] **T0.22** 🤖 Offset de anchor por item *(depende da F2, que reescreve os anchors)*
- [ ] **T0.23** 🤖 Contrato de animação em `svgContrato.ts` *(Bloco 3.4 do doc 15)*
      → `@keyframes` que mexe em `opacity`/`visibility`/`display` exige a mesma
      propriedade declarada no estado base da regra que aplica a animação; e
      documento com `@keyframes` exige `@media (prefers-reduced-motion: reduce)`.
      **Não** vale a regra ampla para toda propriedade: `transform` reprovaria o
      `peaozinho()` correto, porque `transform: none` já é a pose de descanso.
      Hoje isso é conferido em 1 asset, com a classe escrita à mão em
      `scripts/avatar/__tests__/otimizar-svg.test.ts` — os 39 desenhos da F4 e as
      4 expressões da F5 não herdam. **Antes da F4**, não depois

---

# F1 — Arte de fundação

Bloqueia todo o resto da arte.

- [ ] **T1.1** 🤖 Corpo base na proporção escolhida: rosto em **paths próprios** (habilita expressões), cabelo curto e traje de treino baked
      → **corpo, mãos, pés e traje: feitos.** `avatar-base-neutro.svg`, 478 KB no disco e
      83 KB em brotli, recolorível nos 8 tons por uma variável. Duas partes NÃO foram
      feitas, e nenhuma é detalhe:
      - **rosto em paths próprios: não.** O rosto é traçado, não desenhado — olho e
        sobrancelha são 10 formas herdadas do traçador, juntas na camada `av-tinta`.
        **Isso muda o preço da D8**: as 4 expressões em runtime prometiam "zero arquivo,
        zero requisição" justamente porque o rosto seria authored. A forma da boca alegre
        não existe no arquivo, então trocar classe não troca expressão. Custo novo:
        **3 desenhos a mais** (o usuário desenha os 4 rostos, o traço de cada um é
        extraído na região do rosto e empilhado como camada alternável). A D8 não morreu,
        mas deixou de ser de graça
      - **cabelo curto baked: não.** O boneco é careca, e a **D5** existe para que ninguém
        apareça careca por um 404. Ou a base ganha cabelo assado, ou a D5 muda e careca
        passa a ser estado de falha aceito. **Decisão do usuário, em aberto**
- [ ] **T1.5** 🤖 **O `moicano` e o `coque` do catálogo estão guilhotinados pelo `viewBox`**
      → achado em 2026-08-03, medido por `.scratch/estilo/topo-corte.ts`, **sem correção**.
      A figura base ocupa de `y = 39` a `y = 655` num canvas de 700: sobram **39 unidades
      acima da cabeça**, 3,1 px no tamanho do ranking. Tudo que uma peça desenhe acima de
      `y = 0` o viewport corta, **sem erro e sem aviso**.
      - o **moicano** sai com **147 px de largura constante nas seis primeiras linhas** —
        a crista dele (`y` −34, −76, −60) é cortada desde o 2a.1, e o que resta lê como
        barra reta;
      - o **coque** perde **34 unidades** do mesmo jeito.
      → A régua de cabelo já resolveu isto do lado dela: `TETO_Y = 8` em
      `scripts/avatar/estilo/tracar-cabelo.ts` **comprime** o excesso em torno da linha da
      coroa em vez de guilhotinar, e a distinção das três variantes subiu de 5,04–5,98%
      para 6,70–7,41% só com essa troca. O catálogo não passou pela régua e continua com
      os números de 2026-08-01. **Duas saídas, e a escolha é medida, não de gosto:** ou as
      duas peças re-traçam pela régua (barato, cabe no Bloco 2a), ou o `viewBox` ganha
      altura no topo (caro — mexe em `VIEWBOX`, na `folha-base` congelada em 19 formas /
      7 418 bytes e em todo asset já assado).
      → **A esteira agora existe** (T1.6): as duas re-traçam por `avatar:tracar` +
      `avatar:fidelidade` depois do piloto aprovado. Continua sem correção aplicada.
- [ ] **T1.6** 🤖 **O cabelo deixa de ser desenhado e passa a ser traçado da arte**
      → pipeline pronto em 2026-08-03, **piloto aguardando o olho** (item (f)).
      `Cabelo` ganhou `massa` e `clara` — laços FECHADOS em `{t, y}` —, e é o fechamento
      que deixa a peça ter **cortina**: massa descendo ao lado do rosto, por dentro da
      silhueta, que uma franja aberta não descreve porque franja aberta é função de `x`.
      - `npm run avatar:tracar -- <png>` — a arte vira literal para colar. Máscara
        (teal ∪ o preto dele) → borda ordenada por Moore → centro da corrida de preto na
        normal local → suavizar → decimar por erro de corda. É o pipeline dos 42 pontos
        do crânio, aplicado ao cabelo;
      - `npm run avatar:fidelidade` — dois gates com `exitCode`, mais `--inverter` (R10),
        `--piso` e `--folha`;
      - `--ida-e-volta-massa` é a regressão sem gerador, e ela recupera o próprio traço:
        espessura medida **11,5 u** contra `TRACO = 12`.
      **Registro das folhas** — selo, data, veredito:
      | selo | data | o que era | veredito |
      |---|---|---|---|
      | 93ETYY | 2026-08-03 | 3 variantes traçadas pela régua paramétrica | reprovada — laje no topo (guilhotina do `viewBox`), quina de aba na ponta lateral |
      | HSHC93 | 2026-08-03 | arte × melhor traço paramétrico | **reprovada** — *"vc não está reproduzindo a arte fielmente, como foi feito com o avatar"*. IoU 61,7%, desvio médio de borda 36,1 u, cortina segurando ~220 u sozinha |
      | XHHXP9 | 2026-08-03 | arte × traço fiel (laço fechado) | **reprovada** — lê como capacete com aba; 4 defeitos nomeados abaixo |
      **A XHHXP9 foi lida e reprovada, e os quatro defeitos têm causa medida:**
      1. **"linha preta de têmpora a têmpora, capacete liso embaixo"** — 36,1% do
         perímetro do laço (566 de 1 570 u) tem o traço VISÍVEL dentro do crânio,
         concentrado em y 126–189. É a franja em ziguezague: ela está no lugar certo, e
         o que lê errado é ela ser a única aresta forte de uma massa quase lisa;
      2. **2 auto-interseções**, uma em cada ponta de cortina — (463, 175) e (70, 247).
         A cortina afina até os dois lados se encostarem, e a decimação come a largura
         antes do comprimento: sobra um espeto de ida e volta cujos lados se cruzam, e
         o `nonzero` do SVG vaza o trecho entre o cruzamento e a ponta. Já é gate
         (`--ida-e-volta-massa`, quinto número), e reprova este traço;
      3. **cortina só de um lado** — a esquerda desce a y 273 e a direita para em 231.
         A arte tem as duas;
      4. **6 entalhes rasos no lugar de ~12 pontas afiladas.** Bate com o número que o
         traçador já imprimia: menor período de recorte **0,35 px a 56**, abaixo de
         1 px. As pontas não cabem no tamanho do ranking, e a resposta é direção de
         arte (feições maiores), nunca simplificação silenciosa.
      → **Nada foi colado no catálogo.** O `curto` continua paramétrico.
      Os números do piloto `curto-espetada`, todos medidos: IoU **68,77%** (contra 36,62%
      do paramétrico na mesma régua), borda de cima **10,2 u** (contra 51,8), massa só na
      arte **1,8%** (contra 21,4% — é a cortina existindo). O gate 1 é ancorado no piso
      medido da própria arte, e o piso é **27,6 u**: rodado com a decimação DESLIGADA
      (1 193 pontos) o desvio é o mesmo da peça de 64 pontos, ou seja **a decimação custa
      0,3 unidade** e o resto é o boneco do gerador não ser o do `geometria.ts`.
      **A folga do rosto foi RE-ANCORADA (2026-08-04), e a escolha em aberto fechou.** A
      arte deixa **6,2 u** de testa contra o piso de 24, e o traçador **não sobe mais a
      peça** — subir foi o que produziu a faixa de testa nua da HSHC93. Entre re-gerar a
      arte e re-ancorar a amarra, o Doug escolheu re-ancorar: na peça **paramétrica** o
      piso continua 24 u, absoluto; na **traçada** ele passa a ser `folga da arte − meio
      traço`, medido lado a lado pelo **gate 3 de `avatar:fidelidade`**. Sem ele a
      traçada não tinha gate nenhum — um traço comendo 40 u de testa que a arte não come
      passava em silêncio, e é essa a inversão que `--inverter-folga` roda (render de
      12,0 u para −6,5 e −7,0, contra pisos de −2,0 e −5,0). O número absoluto abaixo de
      24 vira aviso alto, em u e em px a 56: trocar a arte é direção de arte, item (f).
      O racional e os números estão no doc 15 §2a.5.
      O menor período de recorte sai em **0,35 px a 56**, abaixo de 1 px:
      as espículas podem sumir no tamanho do ranking, e aí a resposta é direção de arte
      (feições maiores), nunca simplificação silenciosa.
- [ ] **T1.2** 🤖 Uniforme Soldado — prova do `garment` sobre o corpo
- [x] **T1.3** 👤 **Criticar e refinar** — principalmente o rosto, que é onde mora o carisma
      → quatro rodadas de arte e oito defeitos do traçador corrigidos, cada um com a
      medição no comentário do gerador. A pose foi refeita a pedido: palma virada para
      dentro, dedos relaxados, e vão livre entre a mão e a coxa — requisito do slot `hand`
- [x] **T1.4** 🤖 Aplicar os ajustes e regerar
- [ ] 🔒 **Gate:** lê a 56 px · registra nos 8 tons sem vazar cor · paleta não funde nenhuma classe · passa na folha de contato
      → **4 de 5 passam, todos medidos.** Lê a 56 px e o rosto até 32 px; registra nos 8
      tons por uma variável; a paleta não funde (82,5 contra mínimo 40 na tinta, 47,7
      contra 25 na roupa); o `hand` ancora na mão — âncoras medidas no alfa, em
      **(795, 2565)** e **(1809, 2562)**, provadas com o Peão de Madeira do catálogo.
      A folha de contato é a que falta, e é o 3.1 do doc 15. O contrato de SVG também
      passa: o arquivo usa só `--av-pele` e `--av-roupa`, ambas congeladas

---

# F2 — Migration e reescrita do render

## Banco

- [ ] **T2.1** 🤖 Migration `avatar_v4` (aditiva):
  - `items.slot` e `user_equipped.slot` CHECK += `hair`, `back`
  - `user_inventory.source` CHECK += `title`
  - `users.avatar_skin` (8 tons, default `medio`)
  - `users.avatar_hair_color` — **`avatar_bg_color` NÃO entra.** A emenda à D27
    restringiu o recolorir a pele e cabelo; o fundo passou a ter cor fixa. Criar a
    coluna seria criar dívida: campo que ninguém escreve e que a próxima pessoa
    tenta usar
  - `update_avatar_identity` substitui `update_avatar_base`
  - recriar `user_public_profiles` com os campos novos
  - `users.avatar_base` **deprecada, não dropada**
- [ ] **T2.2** 🤖 Migração suave: usuários existentes recebem tom default, mantêm `avatar_chosen=true`, sem re-onboarding

## Render

- [ ] **T2.3** 🤖 `constants.ts`: `viewBox` novo, `SIZE_CONFIG`, z-order
- [ ] **T2.4** 🤖 `bodyFamilies.ts`: `ESTRATEGISTA_V2`, anchors únicos + offset por item
- [ ] **T2.5** 🤖 `types.ts`: remover `GenderVariant`, `dressed_base`, `head_swap`
- [ ] **T2.6** 🤖 `renderModes.ts`: `garment`, `head_attach`, `back_attach`
- [ ] **T2.7** 🤖 `resolvedAvatar.ts`: **deletar todo o knockout** (clipPath por gênero)
- [ ] **T2.8** 🤖 `AvatarDisplay.tsx`: nova pilha de camadas, sem clipPath, head-group com tilt
- [ ] **T2.9** 🤖 Fallback: uniforme ausente cai para o traje da base, nunca boneco pelado

## Identidade e telas

- [ ] **T2.10** 🤖 `criar-personagem`: male/female → **tom de pele + modelo de cabelo + cor do cabelo**
      → três escolhas, não quatro: a cor de fundo saiu com a emenda à D27. A cor do
      cabelo move também a sobrancelha, que já é camada própria (`av-sobrancelha`) na base

> ### ⚠️ REGISTRO PARA A F2 — o cabelo, quando esta fase chegar (2026-08-07)
>
> Escrito agora porque a F2 está **0 de 16** e quem a executar não vai ter este
> contexto. Nada aqui foi executado; é o que a fase precisa saber.
>
> **1. A tela do aluno lê `MODELOS_CABELO` / `CABELOS`, e não uma lista de cinco.**
> O catálogo foi de 5 para 7 em 2026-08-07 (`espetado` e `chanel`, pela rota de
> arte), e vai mudar de novo — cabelo novo agora nasce por arte, não por desenho
> paramétrico. **Qualquer lista de modelos escrita à mão numa tela nasce errada.**
> A régua de verdade é `src/lib/avatar/estilo/cabelo.ts`; o default de
> `users.avatar_hair` continua `'curto'` e não mudou com a promoção.
>
> **2. Não existe PNG de cabelo, e não vai existir.** O cabelo **recolore em
> runtime** (doc 15:168-170), então PNG não serve — é a razão de a peça ser
> geometria em código. `avatar:gerar` e `avatar:variantes` são **folhas de
> conferência**, não exportadores: nenhum dos dois produz asset. Hoje o produto
> monta `<img>` de `public/` (arquitetura v2) e **nada em produção chama
> `compor()`** — a única chamada fora de teste é `/dev/avatar-kokeshi`. Fechar essa
> distância é trabalho da F2, e é ele que decide como o cabelo chega à tela.
>
> **3. Quando a F2 tocar UI:** a skill `design-recruta64` é **obrigatória**, e o
> `npm run test:e2e` entra no gate — rodado com intenção, porque ele bate no
> Supabase de **produção** e cria usuários reais.
- [ ] **T2.11** 🤖 `viewBox` de cabeça para uso como foto de perfil
- [ ] **T2.12** 🤖 **D30** — avatar na **navbar** (32 px, cabeça)
- [ ] **T2.13** 🤖 **D30** — avatar no **ranking geral** + moldura de raridade *(dados já chegam: `get_ranking` devolve `avatar_config`)*
- [ ] **T2.14** 🤖 **D30** — avatar no **ranking de turma**
- [ ] **T2.15** 🤖 **D30** — avatar no **mural**
- [ ] **T2.16** 🤖 **D30** — avatar na **Companhia** (lista de membros)
- [ ] 🔒 **Gate:** `npm run build` · e2e 149/149 · `verify:all` inteiro · gate de assets 100% · avatar antigo degrada sem erro · nenhum código per-gender restante

---

# F3 — Patente → uniforme

> **Partida em duas.** A F3a (a concessão da patente) não depende de arte nem do
> render v4 e foi feita em 2026-07-29. A F3b (o uniforme) espera o Bloco 5,
> porque hoje `items` tem 8 uniformes e **0 renderáveis** — conceder agora seria
> entregar item invisível.

## F3a — a concessão (feita)

- [x] **T3.0** 🤖 Régua vira dado: tabela `title_tiers` (tier, título, nome do
      nível, marco em aulas, uniforme). Substitui o `ARRAY[...]` de 7 trilhas
      hard-coded dentro de `complete_lesson_step`
- [x] **T3.1a** 🤖 `recompute_user_title(uuid)` idempotente, com **UPSERT** e
      marca d'água monotônica. `complete_lesson_step` passa a delegar
- [x] **T3.3** 🤖 Backfill idempotente de todos os usuários
- [x] ⚠️ Corpo extraído de `pg_get_functiondef` do banco vivo; o `;` final
      acrescentado à mão
- [x] 🔒 **Gate T0.17 reescrito** (`verify:avatar-db`): régua é escada, todo
      usuário tem linha, reconciliação em dia, wiring presente, e **uniforme só
      em patente alcançável**. Falhava antes da migration, passa depois

**Régua decidida em 2026-07-29 (decisão do usuário):** a patente vem de concluir
uma trilha de nível, e cada nível são **15 aulas**. Os níveis usam a
nomenclatura do método holandês (Stappenmethode): **Passo 1** a **Passo 7**.
Mudar marco ou acrescentar patente é `UPDATE`/`INSERT` em `title_tiers`, nunca
editar função.

| tier | patente | nível | aulas |
|---|---|---|---|
| 0 | Aprendiz | — | 0 |
| 1 | Soldado | Passo 1 | 15 |
| 2 | Aspirante | Passo 2 | 30 |
| 3 | Capitão | Passo 3 | 45 |
| 4 | Comandante | Passo 4 | 60 |
| 5 | General | Passo 5 | 75 |
| 6 | Grão-Mestre | Passo 6 | 90 |
| 7 | Lenda | Passo 7 | 105 |

A régua encaixa no conteúdo existente: Passo 1 = trilha `recruta`, Passo 2 =
trilha `soldado`. **Com 30 aulas no banco, 2 das 7 patentes são alcançáveis.**
Por isso a F4 desenha **2** uniformes, não 7 — as outras 5 esperam conteúdo, e o
gate falha se alguém atrelar uniforme a marco inalcançável.

**Primeira concessão real:** `teacherdoug001` (15 aulas concluídas) virou
Soldado no backfill, e o ranking já mostra.

## F3b — o uniforme (espera o Bloco 5)

- [ ] **T3.1b** 🤖 Preencher `title_tiers.outfit_item_id` e conceder +
      auto-equipar o uniforme ao atingir a patente
- [ ] **T3.2** 🤖 Capa `back` junto, a partir de Comandante (slot existe; arte depois)
- [ ] 🔒 **Gate e2e:** atingir o marco veste o uniforme, e ele aparece no ranking

---

# F4 — Catálogo completo

## Arte (primeira passada minha, refino seu)

- [x] **T4.1** 🤖 **Aspirante feito** — os 5 acima (Capitão → Lenda) ficam de fora,
      são inalcançáveis até o conteúdo crescer, e o gate reprova uniforme em marco
      inalcançável. Arte em `fonte/uniformes/aspirante.svg`, ardósia `#384966`,
      9 de 9 gates. Expôs um defeito que o oliva escondia: o corte `lum > 0.3` da
      cor de fundo era calibrado no oliva e apagava a peça inteira do Aspirante —
      ver a §7.0 do doc 16
- [ ] **T4.2** 🤖 5 cabelos
- [ ] **T4.3** 🤖 6 chapéus
- [x] ~~**T4.4** 🤖 6 relíquias (2 famílias × 3 tiers)~~ — **CORTADA pela D-E**
      (doc 15, 2026-07-31): o slot `hand` não existe neste boneco, e as 8 linhas
      dele já saíram do banco em `20260731100000_remover_slot_hand.sql`. O
      orçamento de arte caiu de 39 para 33 desenhos. *Marcada aqui em 2026-08-03 —
      continuava aberta neste doc contra o plano vigente.*
- [ ] **T4.5** 👤 Verificar se os 8 backgrounds antigos combinam com o estilo novo
- [ ] **T4.6** 🤖 Redesenhar backgrounds, **se** destoarem (+8)
- [ ] **T4.7** 🤖/👤 20 pets — eu sou fraco em orgânico, então aqui você provavelmente refina bastante
- [ ] **T4.8** 👤 Passada de refino em tudo

## Dados

- [ ] **T4.9** 🤖 Reseed do catálogo: 77 → **60 itens**
- [ ] **T4.10** 🤖 Pirâmide de raridade **40/30/20/10** (hoje 19/20/20/18)
- [ ] **T4.11** 🤖 **D16** — pool de baú só com estético; nunca uniforme nem relíquia
- [ ] **T4.12** 🤖 **D27** — escolha de cor de cabelo e fundo, validada no servidor
- [ ] 🔒 **Gate:** manifesto 100% coberto · folha de contato revisada · nenhum item invisível

---

# F5 — Polimento

- [ ] **T5.1** 🤖 **D8** — 4 expressões por classe CSS (neutra, vitória, concentração, derrota)
- [ ] **T5.2** 🤖 **D29** — baú de escolha: 1 entre 3 em marcos
- [ ] **T5.3** 🤖 Capas `back` — primeiras 3-4
- [ ] **T5.4** 🤖 Acessibilidade: `alt` com nome, contraste, teclado, `prefers-reduced-motion`
- [ ] **T5.5** 👤 Medir no **celular mais fraco disponível** — ranking com 30 alunos
- [ ] **T5.6** 🤖 **D21** string canônica — só se a performance pedir

---

# Adiado conscientemente

| item | por quê |
|---|---|
| **D21** string canônica | resolve problema de escala que não existe com ~100 alunos |
| **D22** composição no servidor | com SVG, compor é concatenar string — problema sumiu |
| Revisão das aulas | prioridade do usuário: depois do avatar |
| Piloto com turma | decisão do usuário |
| Motor de animação (Rive/Lottie) | dependência nova; CSS já resolve o respiro |
| **Rodada de unificação da peça traçada (Passo 7)** | ⛔ **CANCELADA em 2026-08-07 pelo Doug** — ver abaixo |

## A rodada de unificação — CANCELADA em 2026-08-07, e a decisão é do Doug

**As duas famílias de peça traçada convivem em caráter PERMANENTE.** Era custo
declarado e temporário (decisão C de 2026-08-06); virou definitivo:

| | **sintetizada** | **transcrita** |
|---|---|---|
| o preto | `stroke` de 12 u centrado no laço (`Cabelo.linhas`) | diferença entre formas cheias (`nucleo` + `pretas`) |
| IoU do preto | 34,4% | **80,1%** |
| quem usa | `espetado` | `chanel` e `assimetrico` |
| decimação | régua da corda | corda + `refinarPelaSpline` |

**Nem "legada" nem "vigente": as duas são caminhos válidos.** A transcrita é o
pipeline de arte nova; a sintetizada é o que o espetado usa e vai continuar usando.

### Por que foi cancelada

O Passo 7 dependia de o espetado transcrever, e **ele não tem variante que sirva** —
medido de ponta a ponta em 2026-08-07: a `fiel` some a 56 px (p50 6,3 u, 79,8% do
perímetro abaixo de 8 u) e a `lei` vaza a clara para fora do núcleo erodido
(`conterAClara` desiste com `convergiu: false`; `contencaoDaClara` em −9,2 u). A
única saída era **redesenhar a arte**, e o Doug decidiu **não redesenhar**: o
espetado fica congelado no sintetizado e o Passo 7 sai do plano.

### O que isso aceita, com todas as letras

- `Cabelo.linhas` é **campo permanente do tipo**, não dívida a remover. O docstring
  dele já o descreve como mecanismo legítimo, e passa a estar certo.
- O espetado fica com **IoU do preto 34,4%** contra a arte, e decimando pela régua
  da corda que o Bloco 14 provou medir a curva errada.
- **E isso não é peça quebrada.** O `stroke` de 12 u **centrado** é justamente o que
  encobre o erro da régua — foi por isso que o defeito atravessou três blocos
  invisível. Mantendo o stroke, mantém-se o encobrimento: a peça que o aluno vê é a
  peça que o Doug aprovou no Bloco 9. O que se perde é fidelidade à arte, não
  qualidade do render.

### O que sobra vivo, e mudou de motivo

✅ **A `entrada-2` (Assimétrico) ENTROU NO CATÁLOGO em 2026-08-08**, pela `fiel`, e
sem passar por retoque de arte: o Doug corrigiu olhando o render. A reentrada da §8
do runbook não chegou a ser usada.

⛔ **E o catálogo foi PODADO no mesmo dia, de sete para cinco.** Ficaram só as peças
que ele aprovou olhando: `coque`, `moicano`, `espetado`, `chanel` e `assimetrico`.
Saíram `curto`, `cacheado` e `tranca`. Com a careca — que não é peça, é a ausência
de uma — o aluno vê **seis opções**.

A `entrada-3` foi **apagada** junto: era a única arte que não virava peça nenhuma.
Ela servia de isca do controle 3 de `arte:revisao`, e a isca passou a ser uma peça
paramétrica do catálogo — mais seguro, porque a `entrada-3` seria a própria peça sob
exame no dia em que alguém a revisasse.

**O mínimo de 10 continua valendo**, e agora faltam 5 — todos por arte nova. Quantos
faltam hoje: `docs/ESTADO.md`, linha "Catálogo de cabelo", medido e não escrito à
mão.

⛔ **Os pedidos novos têm de voltar com contorno de 12 u**, como o
`PEDIDO-GEMINI.md` exige. É onde o espetado morreu (T5), e é a diferença entre uma
rodada e três.

**A luz (Passo 8) segue não iniciada** — decisão B. Separável e cortável, e depende
de uma régua que **não existe**: a arte tem três tons de ciano e a paleta do render
tem **dois**. Uma mancha de brilho de 12,4% da cúpula devolve 6 pixels, e nenhuma
das 21 asserções toca nisso.

---

# Riscos vivos

| risco | mitigação |
|---|---|
| Minha arte sair dura ou genérica | T1.3 é ponto de crítica **antes** dos outros 43; SVG é editável |
| Pets orgânicos ficarem fracos | T4.7 assume refino seu |
| Uniforme não registrar nos 8 tons | testar **só no Soldado** (F1) antes dos outros 6 |
| Cores da paleta se fundirem | validador T0.8 |
| `complete_lesson_step` regredir | extrair do banco vivo; `verify:no-dup-rpc` é ratchet |
| Trilhas crescerem e quebrarem títulos de novo | gate T0.17 — e a régua saiu do código para `title_tiers` |
| Concessão de patente falhar em silêncio de novo | `recompute_user_title` é idempotente e faz UPSERT; o gate confere que todo usuário tem linha |

---

# Resumo

> **Contado em 2026-08-03**, checkbox a checkbox. A versão anterior desta tabela
> dizia "F0 — 13 fechadas" e "total 64" e estava desatualizada em ambos: número
> escrito à mão envelhece calado. Para recontar:
>
> ```bash
> grep -oE '^- \[x\] \*\*T[0-9]+\.[0-9]+[a-z]?\*\*' docs/avatar/14-backlog-execucao.md | sort -u | wc -l
> ```

| fase | tarefas | fechadas | depende de você? |
|---|---|---|---|
| F0 | 23 | **19** | T0.12 e T0.14 delegadas e decididas |
| F1 | 6 | **2** | T1.3 (crítica da arte), T1.6 (decisão (f) do traço) |
| F2 | 16 | **0** | não |
| F3 | 5 | **3** | não |
| F4 | 11 | **1** | T4.5, T4.7, T4.8 (refino) |
| F5 | 6 | **0** | T5.5 (medir no celular) |
| **total** | **67** | **25 (37%)** | **8 pontos** |

> **A F1 subiu de 4 para 5 tarefas em 2026-08-03**, e o total de 65 para 66: a
> **T1.5** (moicano e coque guilhotinados pelo `viewBox`) é achado da rodada de
> fidelidade do cabelo, medido e **sem correção**. Tarefa nova entra na conta como
> pendente — foi o `verify:estado` que cobrou a atualização desta tabela na mesma
> rodada em que ela nasceu.
>
> **E subiu de 5 para 6 no mesmo dia**, com o total indo a 67: a **T1.6** (o cabelo
> traçado da arte) tem o pipeline pronto e a primeira folha reprovada, então ela é
> pendente pelo mesmo critério. O `verify:estado` cobrou de novo, na mesma rodada.
>
> **A F4 caiu de 12 para 11 tarefas em 2026-08-03**, e o total de 66 para 65: a
> **T4.4** (6 relíquias) foi **cortada** pela D-E, não concluída. Tarefa cortada
> não é pendente nem fechada — ela sai da conta, e a linha riscada acima fica só
> como registro. *O `verify:estado` pegou a primeira tentativa, em que ela tinha
> sido marcada `[x]`: teria contado como trabalho feito.*

---

# Método de geração de arte (pesquisado em 2026-07-29)

**A Anthropic não tem API de geração de imagem.** Claude não gera raster — é
decisão deliberada da empresa, não lacuna temporária. O que existe:

| capacidade | serve? |
|---|---|
| Gerar SVG por código | **sim** — é o caminho |
| Ler imagens (vision) | **sim** — e é o que fecha o ciclo |
| Gerar PNG/JPEG | não existe |
| MCP com FLUX / Stable Diffusion | existe, mas exige serviço externo e chave |

## O ciclo fechado

```
escrever SVG  →  sharp renderiza a 56 e 340 px  →  LER o PNG  →  criticar  →  refinar
```

O terceiro passo é o que importa: **o agente enxerga o próprio resultado** e
itera sozinho, sem o usuário em cada volta. Validado nesta sessão.

## Por que isso vence um gerador de imagem, aqui

- **Editável** — o usuário abre o SVG e ajusta um path; PNG de IA é pegar ou largar
- **Consistente por construção** — paleta, `viewBox` e regra do "1 herói" aplicadas
  por código, não por revisão manual
- **Verificável** — o manifesto (T0.1) e a folha de contato (T0.9) conferem
  cobertura e alinhamento automaticamente

## Configuração recomendada

- Carregar a skill **`frontend-design`** antes de decisões estéticas
- Renderizar sempre nos **dois extremos** (56 px e 340 px) antes de julgar —
  o menor é o que manda
- Não julgar arte por descrição: **renderizar e olhar**
- Limite honesto: geometria e formas chapadas saem bem; orgânico (pets) e
  carisma facial saem fracos e pedem refino do usuário

## Renderizador: Chromium, não sharp

`scripts/avatar/render-svg.ts` usa o Chromium do Playwright, que já é
dependência do projeto. O doc 12 sugeria `sharp`, que usa librsvg — um motor
com suporte a SVG/CSS **diferente do navegador**. Como o destino é o navegador,
uma incompatibilidade só apareceria em produção. De quebra, evita uma
dependência nativa nova no CI.

## Armadilhas descobertas gerando a primeira arte

Custaram tempo real nesta sessão e vão se repetir na F1/F4:

1. **Nada de comentário dentro do `<style>` do SVG.** Um `/* ... <path> ... */`
   fez o navegador **descartar em silêncio todas as regras seguintes**: braços
   viraram vultos pretos e as pálpebras cobriram os olhos, sem erro nenhum no
   console. Comentário fica no gerador, não no asset — o SVGO os removeria de
   qualquer jeito.
2. **Classe CSS ganha de atributo de apresentação.** `class="l"` com
   `stroke-width: 7` no CSS vence `stroke-width="15"` escrito no elemento.
   Quem precisa de espessura própria precisa de classe própria.
3. **Contorno e preenchimento no MESMO elemento, pintados de trás para a
   frente.** Desenhar todos os fills e depois todos os strokes cria costura
   dupla: a primeira versão do boneco tinha ombros com cara de placa de armadura.
4. **Braço é linha, e linha não tem contorno.** Precisa de duas passadas:
   traço grosso escuro por baixo, traço fino colorido por cima.
5. **Estado inicial explícito em tudo que a animação esconde.** As pálpebras só
   tinham `opacity: 0` dentro do `@keyframes`; sem a animação (motor pausado,
   `prefers-reduced-motion`, screenshot) elas apagavam os olhos.
6. **Pele escura precisa de esclera.** Com o olho sendo um oval da cor do
   contorno, os 3 tons mais escuros perdiam contraste a 56 px. Uma amêndoa
   branca fina nas laterais resolve; uma esclera cheia dá olho arregalado.
