# Avatar v4 — Plano do estado atual até pronto

> **Para quem abre este documento numa sessão nova.** Ele é autossuficiente:
> diz onde o projeto está (medido, não estimado), o que falta, em que ordem, e
> com que gate cada coisa fecha.
>
> **Relação com os outros documentos:**
> - `12-avatar-v4-plano-completo.md` — as 30 decisões e o **porquê** de cada uma.
>   Continua valendo. Consulte quando precisar entender a razão de algo.
> - `13-checklist-de-verificacao.md` — os ~90 itens de auditoria. É a lista de
>   conferência, não o plano.
> - `14-backlog-execucao.md` — o backlog original, com o progresso marcado
>   tarefa a tarefa. **Continue marcando lá.**
> - **Este documento (15)** é o plano de execução daqui até o fim. Onde ele
>   divergir dos anteriores, ele vence — as divergências estão todas listadas
>   na seção 4, com o motivo.
>
> Levantado em **2026-07-29** contra o banco de produção e o código real.

---

# 1. Onde estamos

## O que já está feito e em produção

| | |
|---|---|
| **Ponte dos baús** | `items.renderable` filtra o sorteio. Medido: antes, 60 aberturas davam 36 itens distintos com **25 invisíveis**; agora dão 20 distintos com **0 invisíveis** |
| **Manifesto de assets** | `public/items/` é uma lista consultável; o resolver pergunta a ela. `prebuild` quebra se o manifesto divergir do disco |
| **Gates** | `npm run verify:all` roda **14** (eram 11). Três novos: catálogo×assets, banco do avatar, pool dos baús |
| **Testes unitários** | **164**. `src/lib/avatar/` tinha zero |
| **Página de teste** | `/dev/avatar-base`, trancada em professor/admin (404 para aluno) |
| **Boneco base** | Arte do usuário, vetorizada e **recolorível**: um arquivo serve aos 8 tons de pele por uma variável. 478 KB no disco, **83 KB em brotli**. O protótipo gerado em código foi apagado — ver a T0.10 do doc 14 |
| **CI** | Verde. `env-shape`, typecheck, lint, test, build, `verify:all`, ~100 s |

## O que ainda está quebrado

| fato medido | número |
|---|---|
| Itens do catálogo que **não** vestem o boneco | **45 de 77** |
| Itens sem miniatura no inventário | **30 de 77** (todos pets) |
| Telas onde o avatar aparece | **2**, nenhuma social |
| Peso de `public/items/` | **7,0 MB**, dos quais 4,0 MB são **um** pet |
| Usuários com título acima de "Aprendiz" | **0 de 17** — mesmo com 46 aulas concluídas por 7 deles |
| Uniformes equipados em produção que não renderizam | 1 de 1 (Camiseta do Clube) |

O render de produção continua sendo o **v2**: PNG, variante por gênero,
knockout de cabeça, canvas 5:7, `body_family` `recruta_v1`.

## O achado mais grave desta fase — e a correção do diagnóstico

**O sistema de patente estava morto, e não pelo motivo que este documento
afirmava.** A versão original desta seção dizia que a causa era a régua:
`complete_lesson_step` comparava a trilha concluída contra um array de 7
trilhas, e o banco tem 2.

**Medido em 2026-07-29, é outra coisa.** `teacherdoug001` concluiu as 15 aulas da
trilha `recruta` organicamente, a última em 2026-07-29 01:10:27 pela RPC. E
`recruta` é a **posição 1** do array — a régua teria funcionado. Ele é o **único
dos 18 usuários sem linha em `user_titles`** (cadastro em 2026-02-17, anterior à
tabela). O bloco fazia `UPDATE ... WHERE user_id` sem `UPSERT`: casou zero
linhas, e "Soldado" foi calculado e descartado **sem erro**.

O "7 usuários com 46 aulas" que este documento citava também estava inflado: 22
daquelas aulas são de um usuário de e2e, cujo progresso entra direto por
service_role sem passar pela RPC.

Eram **três defeitos**, e o plano enxergava só o terceiro:

| | defeito | efeito |
|---|---|---|
| 1 | `UPDATE` sem `UPSERT` | 0 de 1 elegível real recebeu. Falha silenciosa |
| 2 | Concessão *event-only*, sem reconciliação | Quem concluiu antes da feature, quem teve o UPDATE falhar e quem tiver aula acrescentada à trilha depois nunca recebem |
| 3 | Régua de 7 contra banco de 2 | 5 títulos inalcançáveis |

Nenhum gate cobria 1 nem 2 — por isso passou 4 meses despercebido, a mesma
história da curva de XP. **Os três foram fechados no Bloco 7a**, em
`20260729120000_patente_por_marcos.sql`. Ver **D-A** na seção 3.

---

# 2. O que "pronto" significa

Sem uma definição, "polido" não fecha nunca. Proponho estas seis:

1. **Todo item que a criança pode receber aparece no boneco.** `renderable` é
   `true` para 100% do catálogo, e o gate prova.
2. **O avatar é visto.** Aparece em navbar, ranking geral, ranking de turma,
   mural e Companhia — não só nas duas telas de perfil.
3. **O boneco conta a história do aluno.** Uniforme por mérito, alcançável,
   concedido e vestido automaticamente.
4. **Lê a 56 px.** Todo item se distingue dos irmãos de slot no tamanho `sm`.
5. **Aguenta uma turma.** Ranking com 30 alunos pinta rápido num celular fraco,
   sem salto de layout.
6. **Não exclui ninguém.** 8 tons de pele, `alt` com nome, contraste,
   navegação por teclado, `prefers-reduced-motion`, e raridade sinalizada por
   mais que cor.

---

# 3. As quatro decisões — todas fechadas em 2026-07-29

## D-A — A régua da patente ✅ **DECIDIDA em 2026-07-29**

**Decisão do usuário:** a patente vem de concluir uma **trilha de nível**, e cada
nível são **15 aulas**. Os níveis usam a nomenclatura do método holandês
(Stappenmethode): **Passo 1** a **Passo 7**.

Mecanicamente é marco por contagem de aulas, com uma narrativa melhor: a criança
entende "terminei o Passo 1", não "cheguei em 15".

A régua encaixa no conteúdo que existe: o Passo 1 é a trilha `recruta` (15
aulas) e o Passo 2 é a `soldado` (30 acumuladas). O nível é o rótulo pedagógico;
a patente (Soldado, Aspirante, …) é a recompensa temática. São coisas diferentes
de propósito.

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

**Implementado como contagem de aulas concluídas, não como "as 30 primeiras
aulas".** São equivalentes hoje (o desbloqueio é sequencial), mas "as 30
primeiras" quebra se uma trilha for inserida no meio do currículo.

**A régua vive em `title_tiers`, não no código.** Mudar marco ou acrescentar
patente é `UPDATE`/`INSERT`; nunca editar função. Era código carregando uma
premissa sobre o conteúdo sem ter como saber que ela mudou — a mesma família da
curva de XP.

**Duas consequências que valem registro:**

1. Com 30 aulas no banco, **2 das 7 patentes são alcançáveis** (Soldado e
   Aspirante). E a régua deixou de ser teórica: o `teacherdoug001` tem 15 aulas
   concluídas e foi promovido a **Soldado** no backfill — a primeira patente
   concedida na história deste banco. O ranking já mostra.
2. Por isso a F4 desenha **2 uniformes, não 7**. As 5 patentes acima esperam
   conteúdo, e o gate falha se alguém atrelar uniforme a marco inalcançável.

O gate T0.17 foi reescrito para essa forma.

## D-B — O pipeline de vetorização ✅ **CORTADO**

O T0.6 (`raster → VTracer → encaixe na paleta → SVGO`) existia porque a arte
viria de IA geradora de imagem, em raster. Não há passo raster: eu escrevo SVG
direto.

**Decisão do usuário:** a arte antiga vai quase toda ser descartada — foi feita
para o layout antigo. A nova nasce com identidade nova, e o fluxo é **referência
visual, não conversão**:

```
você gera a imagem na IA  →  me manda no chat  →  eu olho e escrevo o SVG
   →  Chromium renderiza a 56 e 340 px  →  eu leio o PNG e critico  →  refino
```

Some o T0.6 e a §2.5 do doc 12. **Fica o SVGO** como faxina dos arquivos de
saída, que é barata e vale de qualquer jeito.

Continua valendo a saída de escape: se alguma arte ficar melhor em raster, ela
entra **como PNG**, sem conversão — o resolver já lê o manifesto e o
`public/items/` de hoje é todo PNG. O limite é que PNG serve para `pet` e
`background`, e **não** para nada que precise trocar de cor em tempo de execução
(pele, cabelo), porque custom property só alcança SVG inline.

## D-C — Ordem ✅ **DECIDIDA: F1 curta → F2 → F4**

O backlog mandava F1 (arte) → F2 (render). Vale a ordem nova.

O motivo é concreto: o bug de colisão de cor entre bonecos só apareceu quando
pus vários avatares diferentes na mesma página — coisa que a `/dev/avatar` não
faz. A F2 tem mais defeitos dessa família esperando (anchors, remoção do
knockout, recorte de cabeça para foto de perfil, canvas 4:5, 30 avatares numa
lista). **Achá-los com arte quase pronta é barato; achá-los depois dos 39
desenhos é caro**, porque cada correção obriga a recortar arte.

"F1 curta" = só o boneco base e o uniforme de Soldado, refinados até você
aprovar. O resto da arte vem na F4, sobre um sistema já provado.

O Bloco 7a já validou o princípio: foi puxado para antes da arte pelo mesmo
raciocínio, e o resultado foi a primeira patente concedida no mesmo dia.

**Ordem resultante:** 1 (paleta) → 2 (boneco base) → 4 (migration) → 5 (render)
→ 6 (alcance) → 3 (QA da arte) → 7b (uniforme) → 8 (39 desenhos) → 9 (catálogo)
→ 10 (polimento).

## D-D — Revisão ✅ **DECIDIDA: rosto a fundo + 3 pets a fundo + resto em lote**

Meu limite, dito com honestidade: estrutura, geometria, legibilidade e
consistência eu resolvo sozinho e verifico renderizando. **Carisma facial e
bicho orgânico é onde seu olho decide.**

Você revisa a fundo **o rosto do boneco base** (uma vez, no Bloco 2) e **3
pets** (no Bloco 8). Dos 3 sai o acordo de estilo — tamanho do olho em relação à
cabeça, quanto detalhe, que pose, espessura do contorno — que eu aplico nos
outros 17. Os 20 você confere de uma vez na folha de contato e aponta só o que
estiver fora.

Cerca de 3 sessões suas, em vez de ~20 rodadas de ida e volta.

<details>
<summary>Texto original da recomendação (antes de decidir)</summary>

**Recomendo:** você revisa a fundo **o rosto do boneco base** (uma vez, na F1) e
**os 20 pets** (na F4). Nos outros 32 desenhos, aceite a primeira passada e só
aponte o que estiver claramente errado.

</details>

---

# 4. Onde este plano diverge dos documentos anteriores

| # | o que muda | por quê |
|---|---|---|
| 1 | Catálogo final é **60 itens**, não 52 | O doc 12 diz os dois. 7+6+5+6+20+8+8 = 60. O "52" é anterior à revisão que levou pets de 12 para 20 |
| 2 | Orçamento de arte é **53 desenhos**, não 45 | Os 8 backgrounds antigos **destoam** — confirmado visualmente na `/dev/avatar`. Eram "verificar"; agora são certeza |
| 3 | Cor vai em **custom property**, não embutida na regra CSS | Medido: com a cor na regra, dois bonecos na mesma página colidem e o último pinta todos. Inviabilizava o D30 inteiro |
| 4 | Renderizador headless é **Chromium**, não `sharp` | O destino é o navegador; `sharp` usa librsvg, com suporte diferente. E o Playwright já é dependência |
| 5 | ~~A régua da patente volta a ser questão aberta~~ **Decidida:** trilha de nível de 15 aulas (Passo 1–7), régua em `title_tiers` | Ver D-A |
| 6 | **Mãos** entram no orçamento do boneco base | Os braços do protótipo terminam em cápsula. O slot `hand` tem 6 relíquias para segurar |
| 7 | A causa da patente morta **não era a régua** — era `UPDATE` sem `UPSERT` | Medido contra produção em 2026-07-29. Ver seção 1 |
| 8 | O Bloco 7 vira **7a** (concessão, feito) e **7b** (uniforme, espera o render) | 7a não depende de arte e entrega valor hoje; 7b entregaria item invisível |
| 9 | Orçamento de arte do Bloco 8 cai de 44 para **39 desenhos** | Com marcos de 15 aulas e 30 aulas no banco, 2 uniformes são alcançáveis. Os outros 5 esperam conteúdo |

---

# 5. O plano

Dez blocos. Cada um cabe numa sessão de trabalho e fecha com um gate.
**Nada começa antes de o gate anterior passar.**

---

## Bloco 1 — Paleta como módulo de verdade ✅ **FEITO em 2026-07-29**

*Sem arte. Bloqueava a F1, porque a arte consome a paleta.*

- **1.1** `src/lib/avatar/palette.ts`: pele (8), cabelo (**8**, não 5 — o D27
  pede 5 modelos × 8 cores), fundos escolhíveis (8), traje da base, e a cor por
  raridade **espelhando `RARITY_STYLES`**, senão o mesmo item sairia de uma cor
  no inventário e de outra no ranking. `prototipo/boneco.ts` e `pet.ts` agora
  consomem; antes cada um tinha a sua cópia do contorno.
- **1.2** Validador (T0.8). A régua original era "não se fundir no encaixe da
  paleta" — o encaixe morreu junto com o T0.6 (D-B), mas o validador continua
  valendo por outro motivo, mais direto: **duas cores próximas não se
  distinguem a 56 px**. Duas distâncias: 25 entre irmãos de um conjunto
  escolhível, 40 entre o contorno e qualquer preenchimento.
- **1.3** Custom properties congeladas em `PROPRIEDADES`, com **dois escopos**:
  o `<svg>` carrega o padrão da composição, cada camada redeclara no próprio
  `<g>` o que é dela. Sem isso, chapéu, relíquia e pet na mesma composição
  brigariam pelas mesmas variáveis — e é o mesmo defeito de colisão já medido
  entre bonecos. De brinde, o fallback do 5.9 sai de graça: a camada do
  uniforme redeclara `--av-roupa`, e sem uniforme o traje da base aparece
  sozinho, por cascata.
- **1.4** SVGO no pipeline, com `inlineStyles` **desligado**. Medido: com o
  default, ele apagou `.c-roupa`, `.c-cabelo`, `.c-calca` e `.c-sapato` do
  `<style>` e escreveu `style="fill:var(--av-sapato)"` no elemento. Funciona
  hoje e inviabiliza o 5.7 amanhã.
- **1.5** `svgContrato.ts`: as duas conferências que falham em silêncio no
  navegador — comentário dentro do `<style>` e custom property fora do
  contrato (`var(--av-pelle)` não é erro de sintaxe; o elemento só sai preto).
  **Pegou um caso real na primeira execução:** `pet.ts` tinha três comentários
  dentro do `<style>`.

🔒 **Gate:** `npm test` — 172 testes (eram 138). O validador reprova duas cores
injetadas a 18 de distância, e o teste do SVGO reprova cada plugin que
desmontaria o recolorir.

Duas decisões minhas que você pode vetar em uma linha: as duas últimas cores de
cabelo são **roxo e azul**, fantasia deliberada (o D27 existe para 30 alunos não
saírem iguais); e o preto do cabelo é `#3A2F2A`, não preto de verdade — contra o
contorno `#241610`, um preto real apagaria a silhueta.

---

## Bloco 2 — F1 curta: o boneco base

*Aqui mora o carisma. É o único bloco que depende do seu olho.*

O protótipo lê bem, mas é rígido. O que precisa mudar, concretamente:

- **2.1 Rosto.** Hoje são dois pontos e uma curva. Precisa de sobrancelhas com
  forma, insinuação de nariz, e uma boca com caráter. O rosto sai em **paths
  próprios com classes**, que é o que torna as 4 expressões (D8) gratuitas.
- **2.2 Mãos.** Os braços terminam em cápsula. Sem mão não há onde ancorar as 6
  relíquias do slot `hand`.
- **2.3 Silhueta.** Tudo é retângulo arredondado. Falta peso: um quadril
  levemente mais largo, ombro com queda, pescoço encaixado.
- **2.4 Um degrau de sombra.** Chapado com contorno duro ainda comporta uma
  segunda tonalidade — sob o queixo, dentro da manga, embaixo da franja. É o
  que separa "clipart vetorial" de "storybook".
- **2.5 Cabelo.** Hoje é uma tampa. Precisa de silhueta, porque ele também é o
  primeiro dos 5 modelos do slot `hair`.
- **2.6 Uniforme de Soldado**, como prova do `garment` sobre o corpo.
- **2.7 Você critica** — principalmente 2.1. Eu regero.

🔒 **Gate:** lê a 56 px · registra nos 8 tons sem vazar cor · a paleta não funde
nenhuma classe · passa na folha de contato · o `hand` ancora na mão.

---

## Bloco 3 — Ferramentas de QA da arte

*Sem arte nova. Fica pronto antes dos 44 desenhos restantes, não depois.*

- **3.1** Folha de contato (T0.9): renderiza **cada item sobre a base**, nos 4
  tamanhos, numa imagem só. Com 53 desenhos, revisar um a um é inviável.
- **3.2** Teste unitário de ordem de camadas e z-index (T0.20).
- **3.3** A `/dev/avatar-base` ganha um modo **"turma"**: 12 bonecos com
  configurações diferentes lado a lado. Foi exatamente o caso que revelou a
  colisão de cor, e ele precisa ser permanente, não um teste de uma vez.
- **3.4** Terceira conferência em `svgContrato.ts`: **animação que esconde**.
  As duas do Bloco 1 pegam defeito de cor; esta pega defeito de movimento, e é
  a mesma classe de falha — renderiza, não avisa, e só se descobre olhando.
  Duas regras:
  - `@keyframes` que mexa em `opacity`, `visibility` ou `display` exige que a
    regra que aplica aquela animação declare a mesma propriedade no estado
    base. É a regra 6 da seção 7, virada em código: sem `opacity: 0` fora do
    keyframe, a pálpebra cobre o olho onde a animação não roda.
  - documento com `@keyframes` exige um `@media (prefers-reduced-motion:
    reduce)` que desligue a animação. O item **10.4** já exige isso; hoje nada
    confere.

  **Não** vale a regra ampla "toda propriedade do keyframe declarada no estado
  base". Ela reprovaria o pet **correto**: `.flutua` não declara `transform`, e
  está certo, porque `transform: none` já é a pose de descanso. Só
  `opacity`/`visibility`/`display` têm estado desligado diferente do inicial.

  Hoje a disciplina existe em prosa (comentário do `pet.ts`) e num único
  assert à mão — `scripts/avatar/__tests__/otimizar-svg.test.ts` testa
  `peaozinho()` com a classe `.palpebra` escrita dentro do teste. É regressão
  contra o SVGO, não contrato: os **39 desenhos do Bloco 8** e as **4
  expressões do 10.1** não herdariam nada. Disciplina manual documentada em
  comentário é exatamente o que falhou no `UPDATE` sem `UPSERT` e na curva de
  XP.

🔒 **Gate:** a folha de contato gera; o modo turma mostra 12 bonecos distintos;
`conferirSvg` reprova um SVG com pálpebra sem estado base e outro com
`@keyframes` sem `prefers-reduced-motion`, e continua aprovando `peaozinho()`.

---

## Bloco 4 — F2 banco: a migration

- **4.1** Migration `avatar_v4`, **aditiva**:
  - `items.slot` e `user_equipped.slot` CHECK **+= `hair`, `back`**
  - `user_inventory.source` CHECK **+= `title`**
  - `users.avatar_skin` (8 tons, default `medio`)
  - `users.avatar_hair`, `avatar_hair_color` — **sem `avatar_bg_color`**: pela
    emenda à D27, só pele e cabelo recolorem, e o fundo passou a ter cor fixa
  - `update_avatar_identity` substitui `update_avatar_base`
  - **recriar `user_public_profiles`** com os campos novos — hoje ela tem
    `avatar_base` e nenhum dos novos, e é dela que o ranking lê
  - `users.avatar_base` **deprecada, não dropada**
- **4.2** Migração suave: os 17 usuários existentes recebem tom default,
  mantêm `avatar_chosen = true`, sem re-onboarding forçado.
- **4.3** `unequip_slot` passa a aceitar `hair` e `back` — a lista dentro da
  função é uma segunda cópia do CHECK, e o gate já confere que as duas batem.

⚠️ **Extrair o corpo de qualquer função existente de `pg_get_functiondef` do
banco vivo, nunca de migration antiga.** E ele **não emite o `;`** depois de
`$function$`.

🔒 **Gate:** `verify:phase8` passa com os slots novos; `verify:privileges` e
`verify:no-dup-rpc` continuam verdes.

---

## Bloco 5 — F2 render: a reescrita

- **5.1** `constants.ts`: canvas 4:5, `SIZE_CONFIG` novo (56×70, 100×125,
  200×250, 340×425), z-order das 8 camadas.
- **5.2** `bodyFamilies.ts`: `ESTRATEGISTA_V2`, anchors **sem gênero** +
  **offset por item** (D24 — chapéu alto e boné não assentam no mesmo ponto).
- **5.3** `types.ts`: remove `GenderVariant`, `dressed_base`, `head_swap`.
- **5.4** `renderModes.ts`: `garment`, `head_attach`, `back_attach`.
- **5.5** `resolvedAvatar.ts`: **deletar todo o knockout**.
- **5.6** `AvatarDisplay.tsx`: nova pilha de camadas, sem `clipPath`, head-group
  com tilt.
- **5.7** **Folha de estilo única.** Trinta avatares numa lista hoje emitiriam
  30 blocos `<style>` idênticos. As regras sobem para o CSS global; cada `<svg>`
  carrega só as custom properties. Sem isso o D30 fica pesado.
- **5.8** `assetResolver.ts` sem variante de gênero.
- **5.9** Fallback: uniforme ausente cai para o traje da base, nunca boneco pelado.
- **5.10** `criar-personagem`: male/female → **tom de pele + modelo de cabelo +
  cor do cabelo**. Três escolhas, não quatro: a cor de fundo saiu com a emenda à
  D27. A cor do cabelo move também a **sobrancelha**, que é camada própria na base.
- **5.11** `viewBox` de cabeça, para o avatar servir de foto de perfil.

🔒 **Gate:** `npm run build` · e2e 149/149 · `verify:all` 14/14 · gate de assets
100% · avatar antigo degrada sem erro · **nenhum código per-gender restante**
(grep por `male`/`female` em `src/lib/avatar/` volta vazio).

---

## Bloco 6 — F2 alcance: o D30

*É aqui que o investimento inteiro passa a motivar alguém.*

| tela | vira | custo |
|---|---|---|
| navbar | cabeça, 32 px | UI (hoje mostra iniciais) |
| ranking geral | cabeça + moldura, 40 px | **só UI** — `get_ranking` já devolve `avatar_config` |
| ranking de turma | cabeça + moldura | UI + conferir RPC |
| mural | cabeça, 32 px | UI + incluir no feed |
| Companhia | corpo inteiro (`sm`) | UI + conferir RPC |

- **6.1** Um componente `<AvatarCabeca>` reutilizável, para as quatro telas que
  usam o recorte quadrado.
- **6.2** A moldura de raridade no ranking. **É o melhor retorno do plano
  inteiro:** CSS puro, custo de arte zero, e é onde raridade vira status social.
- **6.3** Opt-out de ranking respeitado também no avatar (LGPD).

🔒 **Gate e2e:** o avatar aparece no ranking · 12 alunos com configurações
diferentes saem **diferentes** · nenhum salto de layout ao carregar.

---

## Bloco 7a — F3: a concessão da patente ✅ **FEITO em 2026-07-29**

*Puxado para antes do Bloco 5 porque não depende de arte nem do render novo, e
porque `user_public_profiles.title` já alimenta navbar, dashboard e ranking —
entrega valor visível e prova a régua da D-A antes de comprometer arte.*

Migration `20260729120000_patente_por_marcos.sql`:

- **7a.1** `title_tiers` — a régua vira dado, com RLS, leitura para aluno logado
  e escrita para ninguém.
- **7a.2** `user_titles.achieved_tier` — marca d'água **monotônica**. O modo
  retry de `complete_lesson_step` zera `completed` antes de reconcluir, então a
  contagem cai por um instante; sem marca d'água o aluno seria rebaixado durante
  o próprio retry e promovido de novo, com evento no mural das duas vezes.
- **7a.3** `recompute_user_title(uuid)` — idempotente, com UPSERT.
  `complete_lesson_step` passa a delegar. `EXECUTE` revogado de
  anon/authenticated: recebe `user_id` arbitrário.
- **7a.4** Backfill de todos os usuários.

⚠️ Corpo extraído de `pg_get_functiondef` do banco vivo, com dois pontos
alterados (as variáveis do DECLARE e o bloco virando `PERFORM`) e o `;` final
acrescentado à mão.

🔒 **Gate:** `verify:avatar-db` — falhava antes, passa depois. Cinco cenários
provados em transação revertida contra produção: 29 aulas não promove, 30
promove, chamar de novo não duplica evento, retry não rebaixa, e **linha ausente
em `user_titles` recria e concede** (o defeito original).

## Bloco 7b — F3: o uniforme por patente

*Depois do Bloco 5. Hoje `items` tem 8 uniformes e **0 renderáveis** — conceder
agora entregaria item invisível.*

- **7b.1** Preencher `title_tiers.outfit_item_id` e conceder + auto-equipar.
- **7b.2** Capa `back` junto, a partir de Comandante (slot existe; arte depois).

🔒 **Gate e2e:** atingir o marco veste o uniforme, e ele aparece no ranking.

---

## Bloco 8 — F4 arte: os 39 desenhos restantes

*O bloco mais longo. Várias sessões. Ordem por valor.*

| ordem | o quê | quantos | quem refina |
|---|---|---|---|
| 1 | Uniformes: **Aspirante feito**. Restam **Capitão, Comandante, General e Mestre** — 4, não 5, porque o tier 7 (Lenda) saiu da escada. O **design das 4 já está pronto e travado por gate**: cor, bota, detalhe e o pedido colável em [17](17-patentes-uniformes-design.md) e [18](18-uniformes-blocos.md). Falta só gerar a imagem, e quem gera é o Doug | ~~6~~ **4** | Doug gera, eu asso |
| 2 | Cabelos | 5 | eu |
| 3 | Chapéus | 6 | eu |
| 4 | Relíquias (2 famílias × 3 tiers) | 6 | eu |
| 5 | Backgrounds | 8 | eu |
| 6 | **Pets** | 20 | **você refina bastante** |

**Regra de ouro do lote:** cada desenho passa pela folha de contato antes do
seguinte começar. Trinta e nove desenhos revisados só no fim é como se descobre,
tarde, que a régua de estilo derivou.

🔒 **Gate:** manifesto 100% coberto · folha de contato revisada · nenhum item
invisível · `asset-baseline.json` **zerado** (é o momento em que o passivo dos
45 itens acaba).

---

## Bloco 9 — F4 dados: o catálogo novo

- **9.1** Reseed: **77 → 60 itens** (7 uniforme + 6 head + 5 hair + 6 hand +
  20 pet + 8 background + 8 frame).
- **9.2** Pirâmide de raridade **40/30/20/10** (hoje 19/20/20/18 — um quarto do
  catálogo é lendário, então lendário não quer dizer nada).
- **9.3** **D16** — pool de baú só com estético (`head`, `hair`, `background`,
  `pet`, `back`). **Nunca** uniforme nem relíquia: esses são mérito, e sorteá-los
  faz o boneco parar de contar a história do aluno.
- **9.4** **D27** — escolha de cor de cabelo e fundo, validada no servidor
  contra a paleta.
- **9.5** Limpeza: remover os PNG órfãos de `public/items/` (hoje 7,0 MB, dos
  quais 4,0 MB são um único pet), regerar manifesto, zerar baseline.

🔒 **Gate:** `verify:phase8` verde com o catálogo novo · a distribuição bate a
pirâmide · abrir 60 baús não devolve uniforme nem relíquia · `public/items/`
abaixo de 1 MB.

---

## Bloco 10 — F5: polimento e lançamento

- **10.1** **D8** — 4 expressões por classe CSS: neutra, vitória, concentração,
  derrota. Zero asset novo, porque o rosto já sai em paths próprios. *Nasce
  coberto pelo **3.4**: expressão é animação que esconde, e sem estado base a
  cara certa some onde a animação não roda.*
- **10.2** **D29** — baú de escolha em marcos: a criança escolhe 1 entre 3. As
  3 opções vêm do servidor; escolher uma não permite pegar as outras.
- **10.3** Capas `back` — as primeiras 3 ou 4.
- **10.4** Acessibilidade: `alt` com o nome do aluno, contraste do nome sobre o
  fundo equipado, botões de equipar alcançáveis por teclado,
  `prefers-reduced-motion` no `character-root`, e **raridade sinalizada por mais
  que cor**.
- **10.5** Sons de equipar e de abrir baú — hoje são placeholder, e o loop de
  recompensa sem som fica pela metade.
- **10.6** **Medir no celular mais fraco disponível**: ranking com 30 alunos,
  número de requisições e tempo até pintar.
- **10.7** e2e novos: concessão por patente, baú de escolha, escolha de cor
  persiste, avatar no ranking, duplicata vira XP.
- **10.8** **D21** string canônica — só se a medição do 10.6 pedir.

🔒 **Gate:** as 6 definições de "pronto" da seção 2, uma a uma.

---

# 6. Riscos vivos

| risco | mitigação | estado |
|---|---|---|
| A régua da patente não resolvida deixa 5 uniformes mortos | Decisão **D-A** tomada; gate reprova uniforme em patente inalcançável | mitigado |
| Concessão de patente falhar em silêncio de novo | `recompute_user_title` é idempotente e faz UPSERT; o gate confere que todo usuário tem linha | mitigado |
| Minha arte sair genérica | O Bloco 2 é ponto de crítica **antes** dos outros 44 | mitigado |
| Pets orgânicos ficarem fracos | Bloco 8 assume refino seu | aceito |
| Uniforme não registrar nos 8 tons | Testar só no Soldado antes dos outros 6 | mitigado |
| Cores da paleta se fundirem | Validador do Bloco 1 | mitigado |
| Animação esconder elemento em silêncio (pálpebra sem estado base) | Hoje só o pet é conferido, à mão, no teste do SVGO. O **3.4** vira contrato antes dos 39 desenhos | **aberto até o Bloco 3** |
| `complete_lesson_step` regredir | Extrair do banco vivo; `verify:no-dup-rpc` é ratchet | mitigado |
| 30 avatares numa lista pesarem | Folha de estilo única (5.7) + medição (10.6) | **aberto até medir** |
| Trilhas crescerem e quebrarem títulos de novo | Gate T0.17 | mitigado |

---

# 7. Método de trabalho da arte

**A Anthropic não tem API de geração de imagem.** Não é lacuna temporária, é
decisão. O que existe, e funciona:

```
escrever SVG  →  Chromium renderiza a 56 e 340 px  →  LER o PNG  →  criticar  →  refinar
```

O terceiro passo é o que importa: **o agente enxerga o próprio resultado** e
itera sozinho, sem você em cada volta. Validado nesta fase.

**Regras que custaram tempo real e vão se repetir:**

1. **Nada de comentário dentro do `<style>` do SVG.** Um `/* … <path> … */` fez
   o navegador descartar em silêncio **todas as regras seguintes**. Comentário
   fica no gerador; o SVGO removeria de qualquer jeito.
2. **Cor em custom property, nunca embutida na regra.** Senão dois bonecos na
   mesma página colidem e o último pinta todos.
3. **Classe CSS ganha de atributo de apresentação.** `class="l"` com
   `stroke-width: 7` vence `stroke-width="15"` escrito no elemento.
4. **Contorno e preenchimento no mesmo elemento, pintados de trás para a
   frente.** Fills primeiro e strokes depois cria costura dupla.
5. **Braço é linha, e linha não tem contorno.** Duas passadas: traço grosso
   escuro por baixo, fino colorido por cima.
6. **Estado inicial explícito em tudo que a animação esconde.** Pálpebra só com
   `opacity: 0` dentro do `@keyframes` apaga os olhos quando a animação não roda.
   *Deixa de ser disciplina manual no **3.4**, que a confere junto com o
   `prefers-reduced-motion` exigido pelo 10.4.*
7. **Pele escura precisa de esclera** — uma amêndoa branca fina nas laterais.
   Esclera cheia dá olho arregalado.
8. **Renderizar sempre nos dois extremos** (56 e 340 px) antes de julgar. **O
   que manda é o menor.**
9. **Não julgar arte por descrição.** Renderizar e olhar.

## 7b. Regras da arte de ORIGEM — o que pedir antes de desenhar

*Escritas na fase da arte vetorizada, e cada uma custou uma rodada inteira. Valem
para os 39 desenhos do Bloco 8, não só para a base.*

10. **Pele e pano em matizes distantes.** O pipeline separa as duas famílias por
    matiz, e a separação tem de ter vão. Na rodada em que o macacão saiu
    creme-pêssego, pele e pano ficaram ambos em ~30° e o tronco saiu **salpicado
    de manchas cor de pele**, que mudavam de cor junto com o tom do aluno. Com o
    macacão em azul (200°) contra pele em 18–28°, a separação é limpa.

    O motivo da regra **não** é que o pano será repintado — pela emenda à D27, só
    pele e cabelo recolorem, e a cor do pano é definitiva. O motivo é que o
    pipeline precisa saber **o que é pele**, porque é a pele que troca de cor. Uma
    bota marrom não seria "pano de cor trocável": seria **entendida como pele** e
    mudaria de cor junto com o aluno. A regra fica mais estrita, não menos: nada
    que não seja pele pode morar em 18–28°, nem no cinto, nem na gola.
11. **Pano sem textura.** Uma textura fina de tecido, quase invisível no PNG, o
    traçador transforma em **regiões esfarrapadas do tamanho do tronco**. Nem
    filtro de área nem menos degraus as separam da dobra real — só a amplitude
    (`ZONA_MORTA_ROUPA`), e ela custa quase toda a sombra intermediária do pano.
    Com uniforme sem textura, esse valor precisa **baixar**, senão apaga dobra
    de verdade.
12. **O SVG que o Canva exporta não é vetor.** É um PNG em base64 dentro de um
    `<svg>`, com a transparência num SEGUNDO PNG cuja luminância vira o alfa.
    Extrair só o de cor entrega fundo preto, e o traçador desenha esse preto
    como forma.
13. **Nem toda decisão de "de graça" sobrevive à arte traçada.** A **D8** prometia
    4 expressões em runtime a custo zero, porque o rosto seria desenhado em paths
    próprios. Rosto traçado não tem a forma da boca alegre no arquivo: a
    expressão passou a custar **3 desenhos**. Antes de contar com uma decisão que
    depende de *como* a arte foi feita, conferir se ela ainda foi feita assim.
14. **A cor que você escolher para roupa e acessório é definitiva.** Pela emenda à
    D27, só pele e cabelo recolorem. Então a cor do uniforme na arte de origem
    **é a cor final** — e ela é o sinal da patente. Duas peças da mesma patente
    precisam sair na mesma cor entre pedidos diferentes, porque nada as harmoniza
    depois.
15. **Peça o uniforme FOLGADO, nunca justo.** A silhueta pertence ao sistema: o
    uniforme é recortado pelas máscaras derivadas da base, então sobra se remove
    de forma determinística e falta exigiria inventar desenho. Ombro, manga,
    calça e bota alguns por cento maiores é o pedido certo — e é o que fez a arte
    do Recruta servir sem rodada nova, depois de duas tentativas de encaixe justo
    que falharam.

15b. **A pose é "quase frontal, com giro mínimo para a direita da imagem" — e o
    pedido tem de dizer isso com essas palavras.** ⚠️ *Escrito em 2026-07-31, e as
    duas formulações anteriores estavam erradas em direções opostas.*

    Este plano já disse **"levemente em 3/4"** e o Bloco 1 respondeu com **"frontal
    simétrica"**. Nenhum dos dois descreve a `referencia-base.png`. A medição
    (`scripts/avatar/estilo/medir.ts`, em unidades do `viewBox` com a altura útil
    normalizada em 600) diz:

    | sinal                                     | medido |
    |-------------------------------------------|--------|
    | a orelha ESQUERDA sai da cabeça            | 24,1   |
    | a orelha DIREITA sai da cabeça             | 14,7   |
    | o par de olhos, contra o eixo da cabeça    | +33,5  |
    | plano lateral escuro: esquerda / direita   | 0 / 16 |
    | eixo da cabeça, contra o eixo do tronco    | +7,4   |

    **Por que isso é regra de PEDIDO e não só de código.** A referência vai anexada
    idêntica em todo pedido ao gerador, e é dela que o gerador copia a leitura
    espacial. Se o pedido não exigir o plano lateral direito e as orelhas
    assimétricas, ele devolve simetria — e aí a base (que é assimétrica, por
    medição) recebe tinta simétrica e briga consigo mesma em toda peça. O inverso
    também vale: uma base simétrica com tinta assimétrica é o mesmo defeito pelo
    outro lado.

    **No pedido, escrever literalmente:** *"pose quase frontal, com um giro mínimo
    para a direita da imagem: a orelha esquerda aparece inteira e a direita fica
    parcialmente escondida; há um plano lateral mais escuro só na borda direita da
    cabeça e do tronco; os olhos ficam ligeiramente à direita do centro da cabeça,
    com o direito um pouco mais alto."*

    A assimetria mora em `GIRO`, em `geometria.ts`, ao lado de `LUZ`, e
    `npm run avatar:pose` reprova quem a perder. Ela revoga a **D3 do doc 12**, com
    o imposto (92 itens de catálogo autorados para o giro) registrado lá.

## 7c. Restrições de composição — aprendidas no `avatar:garment`

16. **Regra de CSS NÃO alcança o conteúdo de `<use>` — e este item já disse o
    contrário.** ⚠️ *Corrigido; a versão anterior estava ao revés.*

    A afirmação antiga era que `.vestido .av-roupa{display:none}` **escapava e
    escondia o macacão de todos os avatares da página**, e que a proteção era pôr
    escopo por classe de ancestral. O escopo já estava lá, e o problema era outro:
    a regra **não faz absolutamente nada** quando a base entra por `<use>`, porque
    o conteúdo referenciado mora numa árvore-sombra que o seletor do documento não
    atravessa.

    Medido, mesma base, mesmo viewport, hash do PNG:

    | montagem | sem a regra | com a regra | |
    |---|---|---|---|
    | via `<use>` | `582078712a8ba94c` · 65037 B | `582078712a8ba94c` · 65037 B | **byte a byte idênticos** |
    | inline | `582078712a8ba94c` · 65037 B | `d517a82e72187bfb` · 40798 B | o seletor **funciona** |

    A segunda linha é o controle: o seletor está correto, e some com 24 KB de
    macacão quando o elemento é inline. É a fronteira do `<use>` que ele não cruza.

    **Por que a lição invertida era pior que nenhuma lição.** Ela protegia contra
    um risco que não existe (desnudar a turma) e escondia o real: o macacão
    continuava desenhado sob todo uniforme, e aparecia em cada vão que a arte não
    cobre. A correção é **estrutural, não de CSS** — `avatar-base-sem-traje.svg`,
    em que as camadas de roupa são REMOVIDAS do arquivo. Ausência estrutural se
    confere procurando `av-roupa` no arquivo e não achando; ausência por CSS
    depende de o navegador concordar, e ele não concordava.

    A regra que sobra, e essa vale: **escopo por classe de ancestral continua
    obrigatório** em qualquer `<style>` que a composição emita, porque `<style>`
    dentro de `<svg>` inline é mesmo de escopo do DOCUMENTO. Só que sozinho ele
    não resolvia nada aqui.
17. **Máscara é ferramenta de BUILD, não de runtime.** O ranking mostra 30
    avatares; máscara e filtro forçam composição fora da tela por instância. O
    recorte, o fundo de segurança e o vazado de cabeça e mãos são assados no alfa
    do asset, e em runtime sobra `<use>` da base mais **um** `<image>`.
18. **Peso de arquivo não é memória.** A variante de 1920 tem 265 KB comprimidos
    e **9,36 MiB decodificados**; 30 uniformes distintos chegariam a 281 MiB de
    bitmap. Daí as cinco variantes, e daí a regra: **a variante é escolhida por
    altura CSS × devicePixelRatio**, não por altura CSS — a 70 px com DPR 2 o
    navegador precisa de 140, e servir a de 128 seria ampliar.
19. **Benchmark com asset repetido mede cache, não memória.** O navegador
    compartilha o bitmap decodificado de uma URL só. Medido: 30 cópias do mesmo
    asset levam 481 ms; **30 assets distintos levam 893 ms** — quase o dobro.
20. **Ao medir alfa, olhe a faixa de TRANSIÇÃO.** Contar "RGB escuro em pixel
    transparente" no quadro inteiro dá 99% e não quer dizer nada: o fundo vazio é
    85% da imagem e nunca se mistura com a figura. O que a interpolação puxa é o
    pixel com 8 < alfa < 255, comparado com os vizinhos opacos **em espaço
    pré-multiplicado** — comparar RGB desassociado com alfa baixo amplifica ruído.
    Assim o contorno escuro legítimo passa, porque os vizinhos também são escuros.

**Comandos:**

```
npm run avatar:base         regera o boneco base e a folha de conferência
npm run avatar:garment      assa um uniforme vestível, com as 5 variantes e os gates
npm run avatar:manifest     regera o manifesto depois de mexer em public/items/
npm run dev                 e abrir /dev/avatar-base (professor/admin)
```

O `avatar:garment` sai com código 1 se algum gate reprovar, e escreve a folha
visual em `.scratch/uniforme/folha.png` — quatro fundos a 425 px, os 56 px
ampliados com pixel visível, e os quatro closes de fronteira. Para assar outra
peça: `UNIFORME=caminho.svg UNIFORME_NOME=nome npm run avatar:garment`.

---

# 8. Armadilhas do projeto

*Para quem abre uma sessão nova. Todas já custaram caro.*

- **O e2e bate no Supabase de PRODUÇÃO** e cria/apaga usuários reais. Rodar com
  intenção, nunca em CI.
- **Antes de medir a suíte e2e completa, reinicie o `npm run dev`.** Servidor
  usado entre runs degrada e derruba dezenas de testes que passam sozinhos.
  **Não aumente o timeout — isso piora.**
- **Nunca copie corpo de função SQL de migration antiga.** Extraia de
  `pg_get_functiondef` do banco vivo. Ele **não emite o `;`** depois de
  `$function$`. Foi assim que a curva de XP ficou 4 meses errada.
- **`getByRole` do Playwright é caro** em página pesada; use localizador CSS.
- **`.first()` pega elemento escondido** quando o componente é renderizado duas
  vezes (mobile + desktop). Use `filter({ visible: true })`.
- **O Supabase CLI não está instalado.** Aplicar migration com
  `npx tsx scripts/apply-migration.ts <arquivo.sql>`.
- **O usuário não consegue dar push.** Quando os commits estiverem prontos,
  peça que ele rode `git push origin main`.
- **Toda correção precisa de um gate que falha antes e passa depois.** Regra do
  `CLAUDE.md`, e a razão de o passivo ter parado de crescer.

---

# 9. O que não está neste plano

Fronteiras deliberadas, para não haver surpresa:

| item | por quê |
|---|---|
| **Fase 11 (PWA)** e **Fase 12 (lançamento)** | São fases próprias do roadmap. O avatar não depende delas nem elas dele |
| **Revisão do conteúdo das aulas** | Prioridade sua: depois do avatar. Mas a decisão **D-A** encosta nisso |
| **Loja, moeda, passe de temporada** | Público infantil de clube escolar, LGPD, e o avatar conta mérito, não gasto |
| **Rosto composível, barba, micro-slots** | Invisíveis a 56 px |
| **Motor de animação (Rive/Lottie)** | Dependência nova; CSS já resolve o respiro e o idle do pet |
| **Composição no servidor (D22)** | Com SVG, compor é concatenar string. Revisitar só se a medição do 10.6 pedir |
| **Repositório público com dados de menores** | Decisão de lançamento, não de avatar — mas **precisa ser revisitada antes** |

---

# 10. Checklist final de pronto

Marque só com evidência medida, não com impressão.

- [ ] `asset-baseline.json` zerado — 60 de 60 itens vestem o boneco
- [ ] `npm run verify:all` verde, incluindo `verify:phase8`
- [ ] `public/items/` abaixo de 1 MB
- [ ] Avatar em navbar, ranking geral, ranking de turma, mural e Companhia
- [ ] 12 alunos diferentes numa lista saem **visualmente diferentes**
- [ ] Uniforme concedido e vestido ao atingir a patente, visível no ranking
- [ ] Baú não sorteia uniforme nem relíquia
- [ ] Distribuição de raridade em 40/30/20/10
- [ ] Os 8 tons de pele registram com todos os 7 uniformes
- [ ] Cada slot: os itens irmãos se distinguem a 56 px na folha de contato
- [ ] Ranking com 30 alunos medido em celular fraco
- [ ] `alt`, contraste, teclado, `prefers-reduced-motion`, raridade não só por cor
- [ ] e2e completo verde, com os 5 testes novos
- [ ] `docs/avatar/14-backlog-execucao.md` com as 63 tarefas marcadas
