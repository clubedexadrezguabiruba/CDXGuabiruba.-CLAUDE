# 20 — A troca de pilha: apagar o avatar v2 e pôr o kokeshi em produção

> **Este documento existe porque a decisão do T7 foi tomada em 2026-08-10 e é
> maior que o achado que a pedia.** Onde ele divergir do doc 14 (backlog) ou do
> doc 15 (plano até pronto), **ele vence** — os dois foram escritos quando a
> pilha v2 ainda era o caminho.
>
> O T7 fechou apontando para cá. A execução, bloco a bloco, marca-se aqui.

## 1. A decisão

**Toda a arte e todos os itens do boneco antigo são apagados. Nada é
reaproveitado — nem os pets.** O avatar novo é novo, e tem **cabelo** como único
item vestível.

Decidido pelo Doug em 2026-08-10, depois de a troca ser dimensionada (atualização
1 do T7). O que a mediu está na §3 abaixo, para não se perder junto com o achado.

### 1.1 As quatro decisões de produto que vieram junto

| Pergunta | Decisão | Por quê |
|---|---|---|
| O que o baú dá, sem catálogo de item? | **XP puro** por raridade (5/10/20/35) | A mecânica já existe: é a "forja" de item repetido, `grant_xp(p_source := 'item_scrap')`. Menor mudança possível, e as 5 fontes de baú seguem intactas |
| Ovos e Chocadeira, sem pets? | **Ficam**, sempre dando XP (15/25/40/60) | O ramo de "ovo de XP" já existe em `_create_random_pet_egg` como fallback. Vira o único caminho, e a UI construída sobrevive |
| Como o aluno ganha cabelo? | Alguns livres na criação, o resto **desbloqueável** | Mantém progressão sem depender de arte nova |
| O que desbloqueia? | **Nível de XP** | Já existe, já é calculado no servidor, já aparece no perfil. **Não depende do T1**, que é a régua de patente ainda indecisa — amarrar aqui travaria esta frente atrás daquela |

### 1.2 O catálogo de cabelo, hoje

**5 modelos** — `coque`, `moicano` (paramétricos) e `espetado`, `chanel`,
`assimetrico` (vindos da arte) — em `src/lib/avatar/estilo/cabelo.ts:93-98`. Com a
careca, que é a ausência de peça e não uma peça, **o aluno vê 6 opções**.

Eram sete; o Doug podou para cinco em 2026-08-08. `coque` é quem abre a lista
desde a poda, e por isso é o default da coluna nova.

## 2. A armadilha de ordem — é o R4 outra vez

**Não há banco separado (D3): toda migration bate em produção na hora.** O site no
ar serve a `main`, que ainda chama `equip_item`, lê `user_inventory` e monta o
inventário. Quando o banco muda, **o site no ar quebra** — a mesma forma exata do
R4 que acabou de fechar.

⚠️ **CORREÇÃO de 2026-08-10, depois de aplicar o Bloco A: a quebra começa no
Bloco A, não no B.** Este documento dizia "Bloco B" e estava errado. O
`claim_chest` novo devolve XP em vez de item, e o `useChests.ts:122` da `main`
publicada faz `json.item as Record` seguido de `item.id` — com `item` ausente,
**abrir baú no ar estoura na tela**. O erro é do cliente velho contra o banco
novo, e some no Bloco F.

**Como se lida:** o trabalho fica na branch, as migrations vão sendo aplicadas (e
batem em produção), e **a `main` só é atualizada uma vez, no Bloco F**. Do Bloco A
ao F o site fica quebrado. Hoje isso é aceitável — zero alunos, só o Doug — mas é
**escolha consciente, não descuido**. O perfil do Doug perde os itens equipados,
inclusive o pet.

## 3. O que a varredura mediu (2026-08-10)

Registrado aqui porque foi o que sustentou a decisão, e o achado que o carregava
fecha.

### 3.1 O ponto que quebra o jogo

`claim_chest` (versão viva em `20260729120000_avatar_v4_ponte_baus.sql:72-229`)
sorteia raridade → busca item renderável → e **se não achar nada, `RAISE
EXCEPTION 'Nenhum item disponível no sistema'` (`:154-156`)**.

**Não existe degradação para XP nesse ramo.** Com o catálogo vazio, o baú não dá
XP: ele lança exceção, a transação falha, o baú fica eternamente `claimed = false`
e a criança não consegue abrir. O XP só entra **depois** de um item ser escolhido,
quando ele já estava no inventário — a "forja".

O baú é a **única** fonte de item do produto: não há loja, moeda ou compra em
lugar nenhum. E cinco coisas dão baú: cadastro, subir de nível, completar as
missões do dia, conquista e ofensiva.

**É por isso que o Bloco A vem antes do B.**

### 3.2 A superfície no banco

- **69 itens vivos** (77 emitidos em 2 seeds, −8 do slot `hand`), dos quais **24
  renderáveis** e **0 uniformes renderáveis**
- **3 tabelas dedicadas**: `items`, `user_inventory`, `user_equipped`
- **4 FKs apontando para `items`** de fora: `achievements.reward_item_id`,
  `user_chests.item_id`, `user_eggs.pet_item_id`, `title_tiers.outfit_item_id`
- **1 cache jsonb que nenhum CASCADE alcança**: `users.avatar_config`
- **4 CHECK constraints** + **1 cópia hard-coded** da lista de slots dentro do
  corpo de `unequip_slot`
- **19 migrations** tocam itens

`achievements.reward_item_id` **nunca foi usada**: nenhum seed a preenche, e o
bloco que a consome em `check_achievements` nunca executou. É código morto com FK.

### 3.3 A superfície no código

- **`AvatarDisplay` tem 2 chamadas em produção** — `PerfilClient.tsx:437,458` e
  `PublicProfileClient.tsx:50`. Todo o resto é `/dev`
- **O resto do produto não mostra avatar**: navbar, ranking geral, ranking de
  turma, mural, Companhia e relatórios mostram **iniciais ou nada**. O
  `avatar_config` viaja até o cliente nos rankings e **é descartado**
- **Morrem limpos** (só importador dentro da própria v2): 13 arquivos de
  `src/lib/avatar/` = 1.037 linhas, mais `AvatarDisplay.tsx` (347) = **1.384 linhas**
- **NÃO morrem** — o kokeshi importa: `palette.ts` (397 linhas, o `compositor.ts`
  puxa `LINHA`, `TRAJE_BASE`, `escurecer`) e `svgContrato.ts` (80)
- **`renderability.ts` (104)** morre com os gates de item, não com o render
- `InventoryGrid`, `SlotGrid` e `Chocadeira` **não importam nada de
  `src/lib/avatar/`** — dependem só de `@/types/inventory` e `@/lib/constants/items`
- **48 arquivos** em `public/items/` (44 de item + 4 estruturais em `/items/base/`)

### 3.4 O que não existe e o Bloco E precisa criar

- **Componente React que embrulhe `compor()`** — não existe. O único consumidor de
  tela é a função **local e não exportada** `Boneco()` em
  `src/app/(main)/dev/avatar-kokeshi/AvatarKokeshiClient.tsx:28`
- **Recorte de cabeça em `src/`** — não existe. `compor()` sempre emite
  `viewBox="0 0 500 700"`. **Os números existem** (`CAIXA_CABECA`,
  `CABECA_H_EXTERNA`, `EIXO_CABECA`, `bordasEm()` em `geometria.ts`) e a função de
  recorte existe **fora do bundle**, em `scripts/avatar/estilo/folha-base.ts:252`
- **As colunas do avatar novo** — `avatar_skin`, `avatar_hair` e
  `avatar_hair_color` têm **zero ocorrências** em `supabase/migrations/`. E
  `update_avatar_identity` não existe em lugar nenhum do repositório

### 3.5 O precedente a seguir

**`supabase/migrations/20260731100000_remover_slot_hand.sql`** já fez exatamente
esta remoção para o slot `hand`, em 6 passos e nesta ordem: limpar
`avatar_config` → anular FK em `user_chests` → `DELETE` em `user_equipped` e
`user_inventory` → `DELETE FROM items` → trocar os CHECKs → recriar
`unequip_slot`. **É o molde do Bloco B.**

## 4. Os blocos

Cada um fecha com **um número medido**, nunca com relatório.

### Bloco A — o banco para de depender de item

Nada é apagado. Só se corta a dependência.

- `claim_chest` reescrita: **sempre XP por raridade, nunca item, nunca exceção**
- `_create_random_pet_egg` e `hatch_egg`: o ramo de XP vira o único
- `scripts/verify/security/rpc-baseline.json` atualizado

🔒 **Gate:** `verify:chest-pool` reescrito para o contrato novo — 60 aberturas
reais em transação revertida, **zero exceção, XP em todas**. Falha antes, passa
depois.
📊 **Número:** 60/60 baús abertos sem erro.

**A regra do baú, e de onde ela saiu.** Medido em 2026-08-10 com o `claim_chest`
**vivo**, 300 aberturas em transação revertida (`.scratch/medir-taxa-ovo.ts`):
**55,7%** dos baús já viravam ovo, e a raridade decidia quase sozinha —
`common` 13,1% · `rare` 97,7% · `epic` 94,1% · `legendary` 88,9%. Daí a regra
**`common` paga XP na hora, `rare` para cima vira ovo**, que o gate mede em
**55,0%**. Não é chute: é a taxa de hoje escrita como regra, em vez de emergir
por acidente de quais itens eram renderáveis.

⚠️ **Ressalva de produto, registrada e não resolvida:** um baú `common` hoje
entrega um **colecionável** em 87% dos casos e amanhã entrega **5 XP**. Os
5/10/20/35 eram valor de consolação da forja e viraram o valor principal. É um
`CASE` na migration, fácil de subir — mas é decisão do Doug, não conserto.

**Estado da execução:**

- [x] **A.1 — banco.** `20260810120000_bloco_a_bau_e_ovo_sem_item.sql` aplicada
  em produção pelo Doug em 2026-08-10. Gate: **10 passed / 0 failed**, de 7
  falhas antes. As três funções (`claim_chest`, `_create_random_pet_egg`,
  `hatch_egg`) não consultam mais `items`
- [x] **A.2 — cliente.** `useChests.ts`, `ChestPanel.tsx` e
  `ChestOpeningModal.tsx` pararam de esperar item. O modal foi de 5 fases para
  **3**, e de 317 para 137 linhas: saíram o card do item, o despedaçamento e a
  fase 5. Sobraram dois desfechos — **ovo** ou **XP**. O tipo `ClaimedItem`
  morreu junto, e as três keyframes da forja (`item-shake`, `item-shatter`,
  `fragment-fly`) saíram de `globals.css` por ficarem órfãs.

  *O despedaçamento **não** foi trocado por outra animação, de propósito: ele
  animava um equipamento concreto se quebrando, e sem o equipamento seria
  movimento sem referente. A regra da direção A é que recompensa é reação a
  fato — e o XP já foi concedido pelo servidor antes de a tela existir.*

  *O modal segue **não migrado** para a direção A (ainda tem `zinc-*`/`amber-*`).
  Não se acrescentou cor crua nova; migrá-lo é trabalho à parte.*

  *Achado do hook do `impeccable`, **registrado e não consertado** (regra 9): a
  fase 1 usa `animate-bounce` (`ChestOpeningModal.tsx:79`), e bounce/elástico lê
  datado — a direção A pede desaceleração suave (ease-out-quart/quint/expo). **A
  linha é pré-existente**, não veio deste bloco. Entra na lista de quem migrar o
  modal, junto com as cores cruas.*

- [x] **Bloco A fechado.** `typecheck` 0 · `lint` 0 erros · `npm test`
  **478/478** · `build` verde (Next 16.2.12, 21,8s) · **`verify:all` exit 0**.
  O `rpc-baseline.json` subiu +1 em `claim_chest`, `_create_random_pet_egg` e
  `hatch_egg` — e de brinde registrou `set_preferencias` e `set_task_active`,
  que estavam fora do baseline desde o R1.

### Bloco B — apagar os itens do banco

Na ordem do `remover_slot_hand`:

1. `users.avatar_config` → `'{}'`
2. Anular as 4 FKs (`user_chests.item_id`, `user_eggs.pet_item_id`,
   `achievements.reward_item_id`, `title_tiers.outfit_item_id`)
3. `DELETE user_equipped` → `DELETE user_inventory` → `DELETE FROM items` (69)
4. Dropar as 4 colunas de FK, depois `DROP TABLE` nas 3
5. `DROP FUNCTION equip_item, unequip_slot`
6. `users.avatar_config` **deprecada, não dropada** (convenção do projeto)
7. Recriar `user_public_profiles` sem `avatar_config`

🔒 **Gate:** `verify:avatar-db` reescrito para exigir a **ausência** das 3 tabelas
e das 2 RPCs — o truque do "Gate 6b" do R1, para não passar por vacuidade.
📊 **Número:** 3 tabelas a menos, 0 itens, `verify:all` verde.

- [x] **Bloco B fechado em 2026-08-10.** `verify:avatar-db` de **11 falhas → 24
  passed / 0 failed**; `verify:all` exit 0; 478/478 testes; build verde.
  Apagados: **69 itens, 73 linhas de inventário, 16 equipados, 3 tabelas, 3
  RPCs e 4 colunas de FK**. Conferido no banco depois: as 3 tabelas ausentes,
  `avatar_config` vazio em 100% dos usuários, **XP e nível intactos**.

  **Resguardo** (não há `pg_dump` nesta máquina — foi por consulta, em JSON):
  `~/Desktop/recruta64-BACKUP-itens-avatar-v2-2026-08-10.json`.

  **Os 13 ovos viraram ovos de XP de verdade**, com o bônus da própria raridade,
  e ganharam a constraint `user_eggs_xp_positivo` — "todo ovo é ovo de XP" virou
  mecanismo, não disciplina.

  ⚠️ **Três lições, e as três custaram uma falha cada:**

  1. **A primeira tentativa falhou** em `user_eggs_check`, que exige
     `(pet IS NOT NULL AND xp = 0) OR (pet IS NULL AND xp > 0)`. Anular o pet
     deixando o bônus em zero cria o terceiro estado proibido. O conserto não
     foi lutar com a constraint: foi ver que **os `UPDATE`s eram inúteis** —
     anular coluna que vai ser dropada não faz nada, e o `DROP COLUMN` leva a
     constraint junto.
  2. **Duas funções minhas do Bloco A citavam colunas que iam sumir**
     (`claim_chest` lia `user_chests.item_id`; `_create_random_pet_egg` inseria
     em `pet_item_id`). **plpgsql não valida corpo contra esquema**: não
     quebraria no `apply`, quebraria em runtime na hora de uma criança abrir um
     baú. Achado por varredura de `pg_get_functiondef` — e virou conferência
     permanente no `verify:avatar-db`.
  3. Essa conferência nasceu **larga demais** e reprovou pelos próprios
     comentários das migrations, que citam os nomes das colunas para explicar a
     remoção. Agora ela tira comentário antes de procurar.

  **Gates que mudaram junto:** `verify:avatar-assets` foi **apagado** — o
  assunto dele (o catálogo no banco × `public/items/`) deixou de existir, e
  quem vigia agora é a exigência de ausência. Também ajustados `verify:seeds`,
  `validate-phase2` e `verify:privileges`, que morreriam com as tabelas.

  **Medido de brinde, e fecha uma pendência do T1:** `title_tiers` tem **8
  patentes** com marcos `0 → 15 → 30 → 45 → 60 → 75 → 90 → 105` — é a régua de
  **15 aulas por nível** que está viva em produção. O painel pedia essa medida
  ("migration prova intenção, não estado"); a escolha entre ela e as fronteiras
  de trilha segue sendo do Doug.

  **Perdido de propósito:** a conferência "uniforme só para patente alcançável"
  saiu com a coluna `title_tiers.outfit_item_id`. Ela impedia gastar arte em
  marco inalcançável, e **precisa voltar quando o uniforme voltar**.

### Bloco C — as colunas do avatar novo

- Migration aditiva: `users.avatar_skin` (8 tons), `users.avatar_hair` (default
  `coque`), `users.avatar_hair_color`. **Isto fecha o T8**
- Tabela `avatar_hair_catalog(slug, min_level)`, semeada com os 5 — **a régua de
  desbloqueio mora no banco**, porque a Regra Inviolável nº 1 exige que quem
  decide seja o servidor
- RPC `update_avatar_identity(skin, hair, hair_color)` — valida o slug **e** o
  nível. `update_avatar_base` e `avatar_base` ficam deprecadas

🔒 **Gate:** `verify:cabelo-catalogo` novo — banco e `MODELOS_CABELO` com os
mesmos slugs; e gravar cabelo acima do nível é **negado**, provado como o papel
`authenticated`.
📊 **Número:** 5 slugs batendo dos dois lados, 1 negação medida.

- [ ] Bloco C

### Bloco D — apagar a pilha v2 do código

- Deletar os 13 arquivos + `AvatarDisplay.tsx` (§3.3)
- Deletar `InventoryGrid.tsx`, `SlotGrid.tsx`, `useInventory.ts`,
  `assetResolver.test.ts`, `renderability.test.ts`
- **Preservar** `palette.ts` e `svgContrato.ts`
- Deletar `public/items/` e tirar o check de manifesto do `prebuild` — senão
  `npm run build` morre antes de compilar
- `src/types/inventory.ts` e `src/lib/constants/items.ts` encolhem para o que baú
  e ovo ainda usam (raridade)

🔒 **Gate:** `npm run build` verde — é ele que prova que nada ficou importando o
que sumiu. Mais `npm test` e `verify:all`.
📊 **Número:** ~1.400 linhas e 48 arquivos a menos, build verde.

- [ ] Bloco D

### Bloco E — o componente novo e as telas

- **`<AvatarKokeshi>`** — extrair da `Boneco()` local de `AvatarKokeshiClient.tsx:28`
- **`<AvatarCabeca>`** — recorte a partir de `CAIXA_CABECA` / `CABECA_H_EXTERNA`,
  usando `folha-base.ts:252` como referência medida
- **Folha de estilo única** (doc 15, 5.7): 30 avatares num ranking emitiriam 30
  blocos `<style>` idênticos
- Telas: `/criar-personagem` (3 escolhas), `/perfil` (avatar + seletor de cabelo
  com o bloqueado visível e o nível que falta), `/perfil/[userId]`
- **`design-recruta64` é obrigatória** aqui; `impeccable` para os primitivos

🔒 **Gate:** `build` · `verify:all` · `test:e2e` reescrito — lembrando que o e2e
**bate no Supabase de produção**.
📊 **Número:** 3 telas servindo `compor()`, 0 chamadas de `AvatarDisplay`.

- [ ] Bloco E

### Bloco F — publicar

Merge na `main`, push, e **conferência manual do Doug no ar** — a prova é a tela
funcionando, como foi no R4.

- [ ] Bloco F

## 5. O que este plano NÃO resolve

- **Arte nova.** Continuam 5 cabelos e 6 opções. Se é pouco para um catálogo de
  recompensa, é fila do Bloco 8 (desenho), não daqui
- **A régua da patente (T1).** Foi deliberadamente evitada: o desbloqueio é por
  nível justamente para não travar atrás dela
- **O D30 inteiro** (avatar na navbar, nos dois rankings, no mural). O Bloco E
  entrega as 3 telas que hoje têm avatar; levá-lo às outras 4 é o Bloco 6 do doc 15
