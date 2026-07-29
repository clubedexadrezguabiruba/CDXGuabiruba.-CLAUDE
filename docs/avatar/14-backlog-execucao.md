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

> **Estado em 2026-07-29:** 13 das 22 tarefas fechadas. Falta o pipeline de
> vetorização (T0.6–T0.9) e os testes unitários de ordem de camadas e offset
> (T0.20, T0.22). As duas decisões do usuário (T0.12, T0.14) foram delegadas e
> estão tomadas, com a evidência renderizada.
>
> Para **ver o boneco**: `/dev/avatar` no app (professor/admin), ou
> `npm run avatar:prototipo` para regerar as folhas em `.scratch/`.

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

- [ ] **T0.6** 🤖 `scripts/avatar/vetorizar.ts`: raster → VTracer → encaixe na paleta → SVGO
- [ ] **T0.7** 🤖 `src/lib/avatar/palette.ts`: rampas de pele (8), cabelo (5), destaque por raridade
- [ ] **T0.8** 🤖 Validador de paleta: falha se duas cores estão próximas demais para não se fundirem
- [ ] **T0.9** 🤖 Folha de contato: renderiza cada item sobre a base nos 4 tamanhos, gera 1 imagem
- [x] **T0.10** 🤖 Página de teste de tamanhos: 56 / 100 / 200 / 340 px, com fundo, moldura e pet
      → rota `/dev/avatar`, trancada em professor/admin (404 para aluno). Monta o SVG
      ao vivo com proporção, 8 tons de pele, 5 cabelos, chapéu, uniforme, fundo, moldura,
      pet e lupa de 6× no 56 px. Coberta por `e2e/dev-avatar.spec.ts`

**Achado na T0.10, adiantando a T4.5:** os **8 backgrounds antigos destoam**.
São pinturas suaves; o boneco novo é chapado com contorno duro. Lado a lado não
lêem como um sistema só. Provável **+8 desenhos** no orçamento — confirmar na F1,
mas a evidência já existe em `.scratch/pagina-avatar-v4-completo.png`.

## Decisões que dependem de ver

- [x] **T0.11** 🤖 Gerar o boneco em **1:2, 1:3 e 1:4** e renderizar a 56 px
      → `npm run avatar:prototipo`; uma função gera as três, `cabecas` é o único
      parâmetro que muda, para a comparação ser entre proporções e não entre desenhos
- [x] **T0.12** 👤→🤖 **Proporção escolhida: 1:3** *(usuário delegou a escolha)*
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
      → `verify:all` foi de 11 para 14 gates. O CI já roda `verify:all`, então não precisou de passo novo

## Testes unitários — não existe nenhum hoje

- [x] **T0.19** 🤖 `src/lib/avatar/__tests__/`: resolver de asset
      → 25 testes novos (108 → 133). Inclui um que amarra `renderability.ts` a
      `resolveAssetUrl()`, para mudar o sufixo num lugar e não no outro não passar despercebido
- [ ] **T0.20** 🤖 Ordem de camadas e z-index
- [x] **T0.21** 🤖 Encaixe na paleta (incluindo o caso de cores próximas)
      → medição de distância roda dentro de `npm run avatar:prototipo`
- [ ] **T0.22** 🤖 Offset de anchor por item *(depende da F2, que reescreve os anchors)*

---

# F1 — Arte de fundação

Bloqueia todo o resto da arte.

- [ ] **T1.1** 🤖 Corpo base na proporção escolhida: rosto em **paths próprios** (habilita expressões), cabelo curto e traje de treino baked
- [ ] **T1.2** 🤖 Uniforme Soldado — prova do `garment` sobre o corpo
- [ ] **T1.3** 👤 **Criticar e refinar** — principalmente o rosto, que é onde mora o carisma
- [ ] **T1.4** 🤖 Aplicar os ajustes e regerar
- [ ] 🔒 **Gate:** lê a 56 px · registra nos 8 tons sem vazar cor · paleta não funde nenhuma classe · passa na folha de contato

---

# F2 — Migration e reescrita do render

## Banco

- [ ] **T2.1** 🤖 Migration `avatar_v4` (aditiva):
  - `items.slot` e `user_equipped.slot` CHECK += `hair`, `back`
  - `user_inventory.source` CHECK += `title`
  - `users.avatar_skin` (8 tons, default `medio`)
  - `users.avatar_hair_color`, `avatar_bg_color` (D27)
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

- [ ] **T2.10** 🤖 `criar-personagem`: male/female → **tom de pele + cabelo + cor**
- [ ] **T2.11** 🤖 `viewBox` de cabeça para uso como foto de perfil
- [ ] **T2.12** 🤖 **D30** — avatar na **navbar** (32 px, cabeça)
- [ ] **T2.13** 🤖 **D30** — avatar no **ranking geral** + moldura de raridade *(dados já chegam: `get_ranking` devolve `avatar_config`)*
- [ ] **T2.14** 🤖 **D30** — avatar no **ranking de turma**
- [ ] **T2.15** 🤖 **D30** — avatar no **mural**
- [ ] **T2.16** 🤖 **D30** — avatar na **Companhia** (lista de membros)
- [ ] 🔒 **Gate:** `npm run build` · e2e 149/149 · `verify:all` 12/12 · gate de assets 100% · avatar antigo degrada sem erro · nenhum código per-gender restante

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

- [ ] **T4.1** 🤖 6 uniformes restantes (Aspirante → Lenda), silhueta constante
- [ ] **T4.2** 🤖 5 cabelos
- [ ] **T4.3** 🤖 6 chapéus
- [ ] **T4.4** 🤖 6 relíquias (2 famílias × 3 tiers)
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

| fase | tarefas | depende de você? |
|---|---|---|
| F0 | 22 — **13 fechadas** | T0.12 e T0.14 delegadas e decididas |
| F1 | 4 | T1.3 (crítica da arte) |
| F2 | 16 | não |
| F3 | 6 — **5 fechadas** (F3a) | não |
| F4 | 12 | T4.5, T4.7, T4.8 (refino) |
| F5 | 6 | T5.5 (medir no celular) |
| **total** | **63** | **7 pontos** |

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
