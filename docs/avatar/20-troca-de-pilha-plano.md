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
  — ⚠️ **corrigido em 2026-08-10, no Bloco D: só os 44 morrem.** Os 4 de
  `/items/base/` são a base do pipeline **kokeshi**, não arte de item:
  `avatar-base-neutro.svg` é gerado por `npm run avatar:base` e lido do disco por
  dois testes que ficam (`svgContrato.test.ts:62`, `otimizar-svg.test.ts:25`), por
  `/dev/avatar-base` e por 5 scripts de arte; `avatar-base-sem-traje.svg` é a base
  de runtime do uniforme. Os 2 PNGs `male`/`female` são v2, mas `/criar-personagem`
  ainda os serve até o Bloco E

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

⚠️ **A ressalva ganhou uma irmã maior, e essa foi medida em produção:** o **T9** de
`docs/achados.md` (2026-08-10, depois do F.1). Os outros **55%** — os que viram ovo —
caem numa fila que choca **em série, 72h por ovo**: 5 baús do Doug = **140 XP presos
por 15 dias**, 9,3 XP/dia contra a calibração de ~300 XP/dia do `verify:xp-curve`. E
a forma é pior que o número: espera-se 72h para receber a **mesma moeda** que o
`common` dá na hora, porque sem pet a espera não tem conteúdo. É o preço da decisão
da §1.1, e ele não estava precificado. As quatro saídas estão no T9.

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

- [x] **Bloco C fechado em 2026-08-10.** `20260810160000_bloco_c_identidade_do_avatar.sql`
  aplicada em produção pelo Doug. Gate novo: **1 falha → 18 passed / 0 failed**.
  `verify:all` exit 0 · `typecheck` 0 · `lint` 0 erros · **478/478** testes ·
  build verde. O `verify:phase8` passou de 3 gates para 4.

  **A régua semeada** (decisão do Doug, 2026-08-10): desbloqueio por nível de XP,
  na escada longa.

  | | livres na criação | travados |
  |---|---|---|
  | | careca · `espetado` · `assimetrico` | `coque` 10 · `moicano` 20 · `chanel` 30 |

  Traduzido pela curva viva (`100 × 1,08^(n−1)`, XP consumido) e pela calibração
  de ~300 XP/dia que o `verify:xp-curve` cobra: nível 10 ≈ **4,2 dias** de aluno
  dedicado, 20 ≈ **13,8**, 30 ≈ **35**. Escolha consciente: o cabelo é marco
  raro. Com 5 modelos só, o terceiro degrau pode nunca ser visto por aluno
  casual — a resposta a isso é arte nova (Bloco 8 do doc 15), não escada curta.

  **Duas divergências deste plano, e as duas estão escritas na migration:**

  1. **O default de `avatar_hair` é `NULL` (careca), não `coque`.** A §Bloco C
     pedia `coque` de quando ele abria a lista e se presumia livre; a decisão o
     pôs no nível 10. Default não pode ser peça travada — o aluno nasceria
     vestindo o que a régua lhe nega, e a primeira gravação legítima o
     **rebaixaria**. `NULL` é o único valor que nenhuma escada alcança.
  2. **`avatar_skin` e `avatar_hair_color` guardam índice, não hex.** Guardar
     `#E9B183` criaria uma segunda cópia da paleta de `palette.ts`, e duas
     descrições da mesma coisa divergem sempre. O gate cobra que a faixa do
     `CHECK` tenha exatamente o tamanho da paleta do código. Preço declarado:
     reordenar `PELE`/`CABELO` muda a aparência de quem já escolheu — com 5
     contas isso é barato hoje; quando não for, as listas são append-only.

  **A careca não é linha do catálogo**, e isso é o desenho, não uma exceção: ela
  é `avatar_hair IS NULL`. Daí caem de graça duas coisas — é livre por
  construção, sem `min_level` a comparar; e as duas listas podem ser comparadas
  byte a byte sem exceção escrita à mão dos dois lados. O gate **cobra
  ativamente** que `'careca'` não apareça no banco.

  ⚠️ **Duas pendências que o Bloco E herda, e nenhuma é acidente:**

  - **A view materializada `user_public_profiles` não carrega as três colunas
    novas**, e a RPC não chama `refresh_public_profiles()`. Recriá-la aqui
    custaria uma varredura por troca de cabelo sem mudar um byte do que ela
    devolve. Quem a recria é o Bloco E, que terá tela de perfil público para
    servir.
  - **`avatar_chosen` continua `true` para quem escolheu o avatar v2** (é o caso
    do Doug). A RPC nova marca `true`, mas ninguém escolheu a identidade nova
    ainda. Zerar agora mandaria o dashboard para uma `/criar-personagem` que só
    existe no Bloco E — então o `UPDATE` vai na migration de lá, junto da tela
    que o torna verdadeiro.

  **A lição deste bloco, e ela custou zero porque foi medida antes:** a migration
  rodou primeiro **a seco**, dentro de uma transação revertida, junto com as
  conferências mais frágeis do próprio gate. Foi assim que se descobriu que o
  Postgres **normaliza `BETWEEN 0 AND 7`** para `((x >= 0) AND (x <= 7))` — o
  regex que o gate usava para ler o `CHECK` nunca casaria, e ele teria reprovado
  por defeito próprio **depois** do apply. As três lições do Bloco B eram sobre
  descobrir tarde; esta é sobre o ensaio que faz descobrir cedo.

### Bloco D — apagar a pilha v2 do código

- Deletar os 13 arquivos + `AvatarDisplay.tsx` (§3.3)
- Deletar `InventoryGrid.tsx`, `SlotGrid.tsx`, `useInventory.ts`,
  `assetResolver.test.ts`, `renderability.test.ts`
- **Preservar** `palette.ts` e `svgContrato.ts`
- Deletar os **44** arquivos de item de `public/items/` — **`public/items/base/`
  fica** (ver a ressalva na §3.3) — e tirar o check de manifesto do `prebuild`,
  senão `npm run build` morre antes de compilar
- `src/types/inventory.ts` e `src/lib/constants/items.ts` encolhem para o que baú
  e ovo ainda usam (raridade)

🔒 **Gate:** `npm run build` verde — é ele que prova que nada ficou importando o
que sumiu. Mais `npm test` e `verify:all`.
📊 **Número:** ~1.400 linhas e 48 arquivos a menos, build verde.

- [x] **Bloco D fechado em 2026-08-10.** **68 arquivos apagados** (44 de arte +
  **24 de código**) e **3.114 linhas de código a menos** — mais que o dobro da
  estimativa de ~1.400, e a §"o que a estimativa não contava" abaixo diz de onde
  vem a diferença. `build` verde (exit 0, compilou em 10,6s) · `typecheck` 0 ·
  `lint` 0 erros · **454/454** testes · **`verify:all` exit 0**, 19 gates.

  **Os testes foram de 478 para 454, e isso é subtração, não regressão:** os 24
  que saíram viviam em `assetResolver.test.ts` e `renderability.test.ts`, que
  testavam resolução de asset de item. O painel recontou os arquivos de teste de
  `src/` de 15 para 13.

  #### O que a estimativa de 1.400 linhas não contava

  A §3.3 mediu **1.384 linhas** (os 13 módulos + `AvatarDisplay`) e acertou nisso.
  O que ficou de fora, e que o build cobrou ou a varredura achou:

  | | linhas | por que não estava na conta |
  |---|---|---|
  | `e2e/phase8-avatar.spec.ts` + `helpers/inventory-helpers.ts` | 605 | a §3.3 mediu `src/`, e o e2e não entra em `tsconfig` nenhum — **o build não o vê** |
  | `renderability.ts` | 104 | contado à parte na §3.3 ("morre com os gates de item"), fora dos 1.384 |
  | `InventoryGrid` + `SlotGrid` + `useInventory` | 528 | listados no Bloco D, nunca somados |
  | `scripts/avatar/gen-manifest.ts` + `asset-scan.ts` | 178 | a §3.3 falava de tirar o **check** do prebuild, não de apagar o gerador |
  | os 2 testes unitários | 191 | idem |
  | **cirurgia em 7 arquivos que ficam** | **265 − 60** | ver abaixo — não era deleção |

  **O gerador do manifesto foi apagado, não só desligado do `prebuild`.** A entrada
  dele (`public/items/`) e a saída (`src/lib/avatar/assetManifest.ts`) sumiram as
  duas; deixá-lo vivo é deixar `npm run avatar:manifest` a um comando de
  **ressuscitar** o módulo morto. O script saiu do `package.json` junto.

  #### As três coisas que o build não podia cobrar

  1. **`public/items/base/` não é arte de item — é a base do pipeline kokeshi, e
     apagá-la quebrou 7 testes.** O plano dizia "48 arquivos" e a §3.3 avisava "44
     de item + 4 estruturais em `/items/base/`"; apagar os 48 derrubou
     `svgContrato.test.ts:62` e as 6 asserções de `otimizar-svg.test.ts:25`, que
     leem `avatar-base-neutro.svg` **do disco**. O arquivo é gerado por
     `npm run avatar:base` e também é servido por `/dev/avatar-base` e por 5
     scripts de arte; `avatar-base-sem-traje.svg` é a base de runtime do uniforme
     (`/dev/avatar-uniforme`). Os 4 foram restaurados. **O número certo é 44.**
     Isto é o `if (assets)` da lição 3: o build compila import, não `readFileSync`.
  2. **`PerfilClient.tsx` não era import solto — era 211 linhas de cirurgia**
     (−211/+35). Saíram o palco do boneco nos dois tamanhos, o botão "Trocar
     aparência" (`update_avatar_base`), o `useInventory` com os handlers de
     equipar/desequipar e o alerta de erro deles, a seção "Equipamentos da
     Campanha" (`SlotGrid`), a seção "Personalizar Avatar" (`InventoryGrid`), a
     stat "Coleção" e o ícone `IconChest` que ficou órfão. **A Chocadeira ficou.**
     O `avatarBase` deixou de ser buscado no `page.tsx` — era coluna deprecada
     sendo lida para alimentar componente apagado. E como o boneco era o *centro*
     de um layout que o flanqueava com duas colunas de stat só no desktop, e
     repetia o mesmo trio num grid 2×2 só no mobile, as duas estruturas viraram
     **uma**: um grid de 3, igual nas duas larguras. O Bloco E recompõe o palco.
  3. **`scripts/estado.ts` media um passivo que o Bloco B já havia apagado.** As
     linhas 263-272 liam `scripts/verify/phase8/asset-baseline.json` para publicar
     "Itens que não vestem o boneco", "Itens sem miniatura" e "Arquivos órfãos". O
     arquivo saiu com o gate `verify:avatar-assets` no Bloco B, e o `if (assets)`
     vinha **omitindo as três linhas em silêncio**. Bloco morto, removido.

  #### O que o Bloco E herda daqui, de propósito

  - **`/criar-personagem` continua sendo a tela do avatar v2.** Escolhe
    macho/fêmea, chama a `update_avatar_base` deprecada e mostra os dois PNGs de
    `/items/base/`. Não foi apagada porque o Bloco E a reescreve com as 3 escolhas
    novas, e apagar em D para recriar em E é só churn. Hoje ninguém chega lá — o
    `avatar_chosen` do Doug segue `true` (pendência registrada no Bloco C).
  - **`src/types/ranking.ts` mantém `equipped_items`, `avatar_config` e
    `avatar_base`, agora sem nenhum leitor.** Ficaram porque o tipo espelha o que
    a RPC devolve hoje: `get_public_profile` retorna `'equipped_items', '[]'` fixo
    desde o Bloco B, e as duas colunas existem deprecadas. Os três campos saem
    quando o Bloco E recriar a view e a RPC — que é a pendência que ele já herdou.
  - **`PublicProfileClient` perdeu o avatar do cabeçalho** (−26/+7). Desde o Bloco
    B o boneco já vinha vazio, porque o laço que montava o `EquippedMap` iterava
    sobre uma lista vazia.

  #### Dois achados registrados, e um baseline que eu decidi NÃO tocar

  Pela regra 9, os dois foram para `docs/achados.md` e param ali: o **G9** (o
  ratchet de cores cruas carrega 234 cores de folga fantasma em 14 arquivos) e o
  **D6** (o `EggHatchingModal` tem um card de pet inteiro que `hatch_egg` nunca
  vai preencher). Fecharam junto, por terem a condição de fechamento cumprida, o
  **T8** (pelo Bloco C) e o **G2** (o gate de assets, cujo assunto B e D
  apagaram).

  ⚠️ **O `--update` do baseline de cores cruas foi medido e revertido.** Ele
  regrava o arquivo inteiro: apagaria as 4 entradas dos arquivos que este bloco
  deletou — e **zeraria 10 arquivos que o Bloco D não tocou** (`LessonMap`,
  `dashboard/page`, `(main)/layout`, `RankingClient` e 6 de gamificação), que já
  foram migrados para tokens e nunca tiveram o teto baixado. Apertar o ratchet em
  frente alheia dentro de um diff de 3.100 linhas apagadas esconde o aperto.
  `verify:design-tokens` passa com o baseline original — 0 violações. O conserto
  é commit próprio, e está no G9.

  **A lição deste bloco:** *"deixe o build reclamar" funciona para import e só
  para import.* O build passou **de primeira**, em 10,6s, com 7 testes quebrados
  esperando — porque `readFileSync` de um PNG apagado não é erro de compilação, e
  porque o e2e não está em `tsconfig` nenhum. Quem achou os dois foi `npm test` e
  a varredura de `grep` **antes** de apagar. O mapa de erros do build é um mapa de
  imports, não de dependências.

### Bloco E — o componente novo e as telas

- **`<AvatarKokeshi>`** — extrair da `Boneco()` local de `AvatarKokeshiClient.tsx:28`
- ~~**`<AvatarCabeca>`**~~ — **saiu do Bloco E em 2026-08-10, por decisão do Doug.**
  O recorte de cabeça existe para placement pequeno — navbar, os dois rankings,
  mural —, e a §5 deste plano põe o **D30 inteiro fora do E**: é o Bloco 6 do doc
  15. Construir aqui deixaria um componente **sem consumidor nenhum** até lá, e sem
  tela que prove que o recorte lê certo a 56 px. Vai junto com o Bloco 6. Os
  números continuam medidos e esperando: `CAIXA_CABECA`, `CABECA_H_EXTERNA`,
  `EIXO_CABECA` e `bordasEm()` em `geometria.ts`, com `folha-base.ts:252` como
  referência
- **Folha de estilo única** (doc 15, 5.7): 30 avatares num ranking emitiriam 30
  blocos `<style>` idênticos
- **A migration das duas pendências herdadas do Bloco C** — recriar
  `user_public_profiles` e `get_public_profile` com as três colunas novas, chamar
  `refresh_public_profiles()` dentro da `update_avatar_identity`, e zerar
  `avatar_chosen` de quem escolheu o avatar v2. O `UPDATE` do `avatar_chosen` tem
  de chegar **junto** com `/criar-personagem`, nunca antes: zerado sem a tela, o
  dashboard manda o aluno para uma rota que ainda é a v2
- Telas: `/criar-personagem` (3 escolhas), `/perfil` (avatar + seletor de cabelo
  com o bloqueado visível e o nível que falta), `/perfil/[userId]`
- **`design-recruta64` é obrigatória** aqui; `impeccable` para os primitivos

🔒 **Gate:** `build` · `verify:all` · `test:e2e` reescrito — lembrando que o e2e
**bate no Supabase de produção**.
📊 **Número:** 3 telas servindo `compor()`, 0 chamadas de `AvatarDisplay`.

#### O E foi partido em cinco em 2026-08-10, e a ordem mudou por causa do T9

O Doug pediu o bloco replanejado **a partir da tela do aluno**, e uma revisão em
Fable derrubou uma premissa: a API do componente falava a língua do laboratório
(cor hex), não a do banco (índice e slug). Com **oito** consumidores até o fim do
Bloco 6, cada um reescreveria a mesma tradução.

Junto veio a **decisão do T9** (registrada em `docs/achados.md`), que destravou as
telas: **o baú paga XP direto, na hora, para toda raridade; o ovo deixa de ser
recipiente de XP e volta a ser recipiente de pet.** Como pet não existe — foi
apagado no Bloco B —, nenhum baú cria ovo até haver arte. Daí:

- **E.1** o componente e a folha única — *fechado, abaixo*
- **E.2** a migration do baú (o T9 em SQL): XP direto **15/25/40/60**, os ovos
  da fila pagos e a fila esvaziada. **Migration própria** — um assunto, uma
  migration
- **E.3** a migration do avatar: recriar `user_public_profiles` e
  `get_public_profile` com as 3 colunas, `refresh_public_profiles()` dentro da
  RPC, e o `UPDATE avatar_chosen` — que **só é aplicado na hora do F.2**, junto do
  push, senão o dashboard vivo manda o aluno para a `/criar-personagem` v2
- **E.4** as três telas. A **Chocadeira fica na tela, vazia, "em breve"** (decisão
  do Doug), e o seletor de cabelo segue com **uma** fonte de desbloqueio: o nível.
  A régua do Bloco C **não muda** — a saída 4 do T9 morreu com a decisão
- **E.5** o e2e reescrito

- [x] **E.1 fechado em 2026-08-10 — `<AvatarKokeshi>` e a folha de estilo única.**
  `verify:all` exit 0 · `typecheck` 0 · `lint` 0 erros · **479/479** testes (os
  454 mais 25 novos) · build verde.

  📊 **O número:** **30 avatares emitem 1 bloco `<style>`, não 30.** Medido em
  bytes na lista do ranking: **−16 628 B parados (5,0%)** e **−35 468 B animados
  (10,2%)**. A folha inteira são **1 524 B**, emitidos uma vez; o CSS embutido
  custava **700 B por boneco**.

  **A folha externa é opt-in, e é isso que mantém os 11 selos.**
  `parametrico-congelado.ts` congela `bytes` + `sha` + `css` do SVG inteiro, e
  tirar o `<style>` de dentro dele muda os três **por construção**. Então
  `compor()` sem o campo novo emite a string de sempre, byte a byte — é o que os
  gates, a `folha-base.ts`, a `base-oficial.ts` e os ~30 chamadores de `scripts/`
  medem. `folhaExterna: true` é o modo do produto, e **nenhum selo cobra bytes
  dele**: seria número congelado sem pergunta atrás. Quem responde pela aparência
  continua sendo o congelado e o `avatar:pose` (que mediu **210 id emitidos, 210
  únicos**).

  **Uma declaração, duas montagens.** Os corpos das regras viraram constantes
  (`CORPO_DA_REGRA` em `compositor.ts`), e `estilo()` e `folhaAvatar()` montam a
  partir delas. Escrever o CSS duas vezes deixaria o congelado vigiando só um dos
  lados — a divergência sairia calada justamente do lado que ninguém mede.

  **Três diferenças entre as duas montagens, e as três são obrigatórias:** escopo
  fixo `.kk` no lugar de `.${ns}`; **união** das duas famílias de cabelo (seguro
  porque as classes são disjuntas — paramétrica `-s`/`-e`, traçada `-m`/`-l`); e
  animação sempre presente, ligada pela classe `.kk-anima` no `<svg>`, porque
  folha estática não pode ser condicional a um estado que varia por instância.

  **O `ns` continua obrigatório, e agora com um papel só: prefixar `id`.** Não é
  zelo — `${ns}-fe` e `${ns}-fd` são os gradientes das facetas e carregam o **tom
  de pele** daquele boneco. Trinta avatares com o mesmo `ns` sairiam todos com a
  pele do primeiro. Está escrito na prop que ele é **por instância, não por
  aluno**: o seletor do E.4 desenha a mesma criança ~7 vezes.

  **O componente fala a língua do banco** — `skin`/`hair`/`hairColor`, índice e
  slug como as colunas do Bloco C os guardam, com a tradução para hex acontecendo
  **uma vez**, dentro dele. E como as três colunas têm `DEFAULT` total, **todo
  usuário é renderizável** desde que a linha exista: nenhuma tela precisa de
  estado "ainda não escolheu".

  **Sem `"use client"`**, de propósito: sendo string + `dangerouslySetInnerHTML`,
  ele serve Server Component (o ranking de 30 sai do servidor sem mandar JS) e
  Client Component (o seletor, que troca a peça na mão do aluno) pelo mesmo
  caminho. Quem garante o bloco único é o React, que deduplica
  `<style href precedence>` — mecanismo, não disciplina: a folha vem grudada em
  quem a usa, em vez de depender de alguém lembrar de pô-la na página.

  ⚠️ **O gate novo (`folha-unica.test.ts`) tem uma amarra que quase nasceu torta:**
  a conferência "toda classe emitida tem regra na folha" precisa aceitar regra
  **atrás do portão `.kk-anima`**. `kk-respira`, `kk-sombra` e `kk-olho` saem
  SEMPRE nos elementos, e exigir só `.kk ` reprovaria o boneco parado por falso
  positivo. O achado é da revisão em Fable, antes de o teste existir.

  **A conferência que node não faz foi feita no chromium**, com o CSS do Tailwind
  do build presente: 30 SVGs, **1 bloco de folha**, `fill` do rosto computado em
  `rgb(255,226,199)` no primeiro e `rgb(158,98,56)` no último (peles **diferentes**
  — os gradientes não colidiram), contorno `rgb(0,0,0)` a `12px`, e a animação
  ligada só no boneco que leva a classe. `/dev/avatar-kokeshi` exige login, então
  a conferência da página no ar continua sendo do Doug.

  **A página `/dev` mantém a `Boneco()` local**, e não é migração pela metade: as
  peças **traçadas da arte** não estão no catálogo e não têm slug, então não são
  exprimíveis na API do componente. Colar slug falso nelas é o defeito que a rota
  de arte já pegou uma vez, quando três artes se diziam `"curto"`. A seção dos 30
  passou para o componente — é o caso do ranking, e é onde a folha se prova.

- [x] **E.2 fechado em 2026-08-10 — o baú paga XP direto, e a fila esvaziou.**
  `20260810180000_e2_bau_paga_xp_direto.sql` aplicada em produção pelo Doug.
  **Isto fecha o T9.**

  📊 **O número:** o gate foi de **11 passed / 7 failed** para **18 passed / 0
  failed**. `verify:all` exit 0 · `typecheck` 0 · `lint` 0 erros · **479/479**
  testes · build verde.

  **Medido em produção depois do apply:** fila **0**, 18 ovos `hatched`, **16
  grants de `egg_bonus` somando 445 XP** em 5 contas — `teacherdoug001` 140 ·
  `suzanfbaron` 135 · `gbitelbrun` 75 · `pafischersgrott` 55 ·
  `englishwithteacherdoug` 40. Zero ovo em estado inválido. E os baús foram de
  112 para **115**: os 3 a mais são baús de level-up que o próprio `grant_xp`
  criou ao subir gente de nível com o XP represado — a prova de que o pagamento
  passou pela autoridade do servidor em vez de um `UPDATE` na mão.

  **A previsão do ensaio a seco bateu com o mundo, número a número** (18/0, 445
  XP, 16 ovos, fila 0). É o que a bancada de ensaio existe para poder afirmar.

  **Como se mede "passa depois" sem banco separado (D3).** As conferências do
  gate viraram `conferir(db)`, que recebe o handle de fora; o gate abre a própria
  transação e o ensaio a seco passa a dele. Sem isso, "passa depois" seria
  previsão — e previsão sobre migration que bate em produção é o que a Regra de
  Evidência proíbe. É o mesmo movimento do Bloco C, agora com o gate inteiro
  dentro do ensaio em vez de duas conferências escolhidas a dedo.

  **O que a migration faz, e o que ela deliberadamente não faz:** `claim_chest`
  perde a chamada a `_create_random_pet_egg` e paga **15/25/40/60** na hora, em
  toda raridade. `hatch_egg` e `_create_random_pet_egg` **não são tocadas** —
  dormentes, e o gate agora **cobra que existam**: hibernar não é morrer, e é por
  elas que o pet volta no Bloco 8. O `p_source` continua `'item_scrap'` porque
  trocá-lo obrigaria a recolar o corpo de `grant_xp`, que é exatamente como a
  curva de XP foi revertida em silêncio por 4 meses.

  **A fila era 16, não 13 — e não era só do Doug.** 5 `hatching` + 11 `queued`,
  **445 XP** em **5 contas**. O 13 do T9 era número velho. Os 16 são pagos por
  `grant_xp` de verdade, personificando cada dono dentro da transação, com a
  mesma chave de idempotência que `hatch_egg` usaria (`egg_bonus_<id>`) — em vez
  de um `UPDATE users SET xp = xp + …`, que reimplementaria a curva num sexto
  lugar.

  ⚠️ **O ensaio a seco pagou por si duas vezes, e as duas antes de qualquer apply:**

  1. **`user_eggs_check1` exige `hatch_start_at NOT NULL` para `status =
     'hatched'`** — e os 11 ovos `queued` têm a coluna nula, porque ovo na fila
     ainda não começou a chocar. Marcar `hatched` direto derruba a migration
     inteira. Daí o `COALESCE(hatch_start_at, created_at)`. É a irmã da lição 1
     do Bloco B, que caiu na constraint vizinha pelo mesmo motivo.
  2. **O gate ia reprovar por um comentário meu.** A conferência "`claim_chest`
     não chama mais o criador de ovo" achava o nome no corpo — porque a migration
     **explica, dentro da função**, que `_create_random_pet_egg` ficou viva de
     propósito. É a lição 3 do Bloco B repetida por um gate novo, e por isso ele
     agora tira comentário antes de procurar chamada.

  **Medido antes de escrever, e é o que torna "0 ovos" mecânico em vez de
  amostral:** `_create_random_pet_egg` é a **única** função que insere em
  `user_eggs`, `claim_chest` era a **única** que a chamava, `user_eggs` não tem
  trigger e tem **zero policies de RLS** (com RLS ligado — ninguém insere de
  fora). Cortar aquela chamada corta a criação de ovo inteira. O gate cobra as
  quatro coisas, não só as 60 aberturas.

  **A Chocadeira publicada não quebra com a fila vazia — conferido antes, não
  depois.** `get_eggs` só devolve `hatching`/`queued`, então passa a devolver
  `[]`; `Chocadeira.tsx:46` e `EggCard.tsx:33` fazem
  `if (loading || eggCount === 0) return null` na primeira linha. O painel
  **desaparece**, não estoura. Os dois arquivos são idênticos na `main` e na
  branch. O que sobra é uma coluna vazia no grid do `/perfil` — cosmético, e é
  onde o E.4 põe o "em breve".

  **Enquanto a migration não foi aplicada, o `verify:all` ficou vermelho, e isso
  era o gate funcionando** — o único vermelho foi o `verify:chest-pool`, que mede
  produção. Vale registrar porque é a forma normal de um gate de banco entre
  escrever e aplicar: verde antes do apply significaria que ele não olha o banco.

  **Achado registrado e não consertado, pela regra 9:** o **G10** — a escada de
  desbloqueio de cabelo do Bloco C foi derivada com `1,08`, e a curva viva é
  `1,05`. Os degraus custam **3,7 / 10,2 / 20,8 dias**, não 4,2 / 13,8 / 35. Não
  há bug em produção; há uma decisão de produto tomada sobre número errado.

- [x] **E.3 fechado em 2026-08-10 — o perfil público carrega o kokeshi.**
  `20260810200000_e3_perfil_publico_com_identidade.sql` aplicada em produção pelo
  Doug.

  📊 **O número:** o gate novo (`verify:perfil-publico`) foi de **16 passed / 13
  failed** para **29 passed / 0 failed**. `verify:all` exit 0 (27 scripts) ·
  `typecheck` 0 · `lint` 0 erros · **479/479** testes · `build` verde.

  **O ensaio a seco previu os 29/0 exatos**, dentro de uma transação revertida com
  a migration aplicada ali dentro — e a produção depois do rollback estava intacta
  (as 14 colunas de sempre, cobaia em `skin=2 hair=null cor=0`). É a segunda vez
  seguida, depois do E.2, que a bancada de ensaio acerta número a número. É o que
  ela existe para poder afirmar.

  **Conferido em produção depois do apply, e não só pelo gate:** matview com **19
  linhas**, `relacl` **idêntico** ao de antes (`postgres | service_role`), **0**
  contas com identidade fora do default, `avatar_chosen` ainda em **8** (a
  migration do F.2 não foi aplicada), e **0** linhas em que a matview divergiu de
  `users`. O gate roda em rollback, e essa conferência é o que prova que ele não
  deixou rastro.

  **Duas migrations, porque são dois momentos.**
  `20260810200000_e3_perfil_publico_com_identidade.sql` é para aplicar agora;
  `20260810220000_f2_avatar_chosen_zerado.sql` **espera o F.2**. Migration que
  espera é migration própria, não bloco comentado dentro de outra.

  **A conta de qual coluna legada fica na matview é por coluna, não por época — e
  a seção 6 do gate é que a fez.** `avatar_config` tem **3 leitoras** vivas
  (`get_ranking`, `get_ranking_with_position`, `get_class_ranking`) e **fica**:
  tirá-la obrigaria a recolar o corpo de três RPCs de ranking dentro deste bloco,
  que é o movimento pelo qual a curva de XP deste projeto foi revertida em silêncio
  por 4 meses. `avatar_base` tinha **uma** leitora — o próprio
  `get_public_profile`, que esta migration reescreve —, então depois dela tem
  **zero**, e **sai**. A conferência se aposenta sozinha: coluna legada só é
  exigida na view enquanto alguma função a citar, e nada precisa ser editado à mão
  quando o Bloco 6 reescrever os rankings.

  **A prova do refresh é comportamental, não textual.** Como o papel
  `authenticated`, o gate grava um cabelo livre por `update_avatar_identity` e
  exige que `get_public_profile` devolva o cabelo **novo** na mesma hora — medido:
  careca → `assimetrico`, pele 5, cor 3. Sem o `PERFORM`, o `/perfil` do aluno
  mostraria o cabelo novo (lê `users` direto) e o `/perfil/[userId]` dos colegas o
  antigo, até alguém subir de nível. Ler o corpo da função é a anti-regressão
  barata que fica **ao lado** da prova, nunca no lugar dela.

  **O REVOKE veio junto do CREATE, e o ensaio mediu o par.** O ALTER DEFAULT
  PRIVILEGES do schema `public` no Supabase concede tudo a `anon` e
  `authenticated`: matview recriada **nasce legível pelo navegador**, e o que sai
  por ali é `display_name` CRU e a coluna `ranking_visible` — o opt-out do ranking.
  O aviso estava escrito em `20260806150000` endereçado a quem recriasse a view.
  Medido no ensaio: `relacl` **idêntico** antes e depois
  (`postgres=arwdDxtm | service_role=arwdDxtm`).

  **`get_public_profile` perdeu 3 chaves e ganhou 3.** Saíram `avatar_config`,
  `avatar_base` e `equipped_items` — os três da pilha v2, sem leitor nenhum em
  `src/` (o F.1 publicou o Bloco D, e `PublicProfileClient` não toca em nenhum).
  Entraram `avatar_skin`, `avatar_hair` e `avatar_hair_color`, como **índice e
  slug**: a tradução para hex acontece uma vez, dentro do `<AvatarKokeshi>` do E.1.
  `PublicProfileData` foi ajustado junto, e a `EquippedItem` órfã saiu.

  ⚠️ **A pergunta nova deste bloco, e ela foi isolada de propósito no ensaio:**
  `update_avatar_identity` passa a chamar `REFRESH MATERIALIZED VIEW CONCURRENTLY`
  — dentro de uma transação, sobre uma matview criada na **mesma** transação. Não
  era óbvio que funcionasse. Funciona, e foi medido antes do apply em vez de
  descoberto depois. O `UNIQUE` em `user_id` é condição dele: sem esse índice o
  refresh recusa, e quem o chama é `grant_xp` a cada level-up — perder o índice na
  recriação quebraria **toda subida de nível do produto**, não só o avatar. Por
  isso o gate cobra os 6 índices e a unicidade do primeiro.

  **O `verify:all` ficou vermelho até o apply, e isso era o gate funcionando.** O
  único vermelho era o `verify:perfil-publico`, que mede produção — verde antes do
  apply significaria que ele não olha o banco. É a mesma forma registrada no E.2.

  ⚠️ **Depois do apply sobrou um segundo vermelho, e ele é estrutural, não do
  bloco:** o `verify:no-dup-rpc` cobrou o baseline de definições, porque
  `CREATE OR REPLACE` numa migration nova soma +1 à contagem de cada função
  recolada — `get_public_profile` 3→4 e `update_avatar_identity` 1→2. É o mesmo
  passo que o Bloco A deu. O `--update` foi rodado e **o diff foi conferido antes
  de aceitar**: exatamente as duas subidas, nenhuma entrada baixada em silêncio. É a
  ressalva do G9 aplicada ao ratchet vizinho — `--update` que regrava arquivo
  inteiro precisa de diff lido, não de fé.

  **A migration do F.2, e por que o `WHERE` largo se sustenta na ORDEM.** Medido:
  **8 de 19 contas** têm `avatar_chosen = true`, todas pela `update_avatar_base` da
  v2, e as 19 estão no default integral da identidade nova. Não existe no banco
  marca de *qual* identidade foi escolhida — as duas RPCs escrevem o mesmo booleano
  —, e o default integral não serve de prova, porque pele 2 + careca + cor 0 é uma
  escolha legítima. O que sustenta o `UPDATE ... WHERE avatar_chosen = true` é o
  momento: aplicada na janela do F.2, nenhuma conta pode ter escolhido a identidade
  nova, porque a tela que a grava está sendo publicada no mesmo push. Ensaiada a
  seco: **8 true → 0**, e a segunda aplicação não acha linha nenhuma.
  ⚠️ **Ordem dentro do F.2: push primeiro, apply depois.** O inverso abre uma
  janela em que o cliente no ar ainda é o do F.1 e o redirecionamento aponta para a
  `/criar-personagem` **v2** — quem entrar nela escolhe male/female e volta a
  `avatar_chosen = true`, desfazendo a migration por dentro.

  **Achado registrado e não consertado, pela regra 9:** o **G11** — `RankingEntry`
  declara `avatar_base: string` obrigatório, e as 7 chaves que a RPC devolve de
  verdade não o incluem. Sem bug em produção (ninguém lê o campo); sai junto com
  `avatar_config` quando o Bloco 6 reescrever os rankings.

- [x] **E.4 fechado em 2026-08-10 — as três telas servem `compor()`.**
  `typecheck` 0 · `lint` 0 erros · **478/478** testes · `build` verde ·
  **`verify:all` exit 0**.

  📊 **O número:** **3 telas com boneco, 0 chamadas de `AvatarDisplay`** — que é
  o número que o Bloco E prometia. E, de brinde, `verify:design-tokens` foi de
  **1.154 para 1.083 cores cruas**: `/criar-personagem` foi de 14 para **0**, e
  o `PerfilClient` de 83 para **70**.

  **Um componente, três telas, e o estado mora na tela.** O
  `<EditorDeAparencia>` é **controlado**: quem guarda a `Aparencia` é a tela, que
  também desenha o palco. Foi a única forma de não haver **dois bonecos grandes**
  no `/perfil` — um "quem eu sou" e um "o que estou provando", sem o aluno saber
  qual manda. Assim o palco do cabeçalho **é** a prévia, e mexer numa amostra
  repinta a criança em cima na mesma hora.

  **As seis fichas do seletor são o segundo preview, e saem de graça:** cada uma
  desenha a MESMA criança com um modelo. Trocar cor de cabelo ou tom de pele
  repinta as seis de uma vez. É onde o `ns` por instância do E.1 se paga — com um
  `ns` só, as seis resolveriam para o gradiente da primeira e a troca de pele não
  apareceria em nenhuma.

  **O que o `/perfil` ganhou além do combinado, e por quê:** o editor oferece
  **pele também**, não só cabelo. A RPC grava as três colunas de uma vez, sempre;
  um seletor que mostra duas e escreve três esconde o que faz — e tom de pele
  escolhido uma vez na vida, sem volta, é porta de mão única para uma criança que
  errou o toque. Uma fileira de amostras a mais. É a única coisa neste bloco fora
  do texto do pedido, e sai em uma linha se o Doug quiser.

  **`/criar-personagem` lê o nível REAL, e não presume 1.** A tentação é assumir
  que quem chega ali acabou de nascer — e ela quebra na migration do F.2, que
  zera `avatar_chosen` de **8 contas com XP, nível e baú**. Um aluno de nível 20
  mandado de volta tem direito ao coque e ao moicano.

  **A Chocadeira ficou, vazia, com "em breve"** (decisão do Doug). Ela retornava
  `null` com fila zero — e desde o E.2 a fila é zero para sempre. Sumir seria
  mais limpo e mais errado: quem já viu ovo ali concluiria que perdeu alguma
  coisa, e quem nunca viu não saberia que existe.

  ⚠️ **O laço "construir → ver → criticar" rodou quatro vezes, e as três primeiras
  acharam defeito meu.** A conferência foi no chromium, numa bancada temporária
  em `/design-lab/e4` — a vitrine é a única rota que dispensa login, e
  `/perfil` exige sessão. A bancada foi **apagada** no fim. O que ela pegou, e
  que leitura de código não pegaria:

  1. **Três colunas em 375px davam ficha de 92px e cabeça de 39px** — o moicano
     lia como coroa. Duas colunas e boneco de 150px dão cabeça de 59px.
  2. **`opacity-55` na ficha travada apagava a ARTE junto com o texto.** O cabelo
     preto do chanel virava cinza e lia como "Grisalho" — que é uma das 8 cores
     logo abaixo. E o "Nível 30" caía para **1,89:1** de contraste, atenuado duas
     vezes (`ink/55` dentro de `opacity-55`). Agora travado é **fio tracejado +
     fundo branco**, com a arte em cor cheia: a peça travada é a que se quer
     desejar, e mostrá-la desbotada vende o contrário.
  3. **`sm:grid-cols-3` mede a JANELA, não o contêiner.** Num monitor de 1280 a
     coluna estreita do perfil recebia 3 colunas de 108px para uma arte de 107px
     **fixos** — 0,8px de folga. Saiu.
  4. **Teto em grade não é teto em ficha.** `max-w-md` na grade virava ficha de
     220px com 56px de branco de cada lado do desenho. Com `max-w-xs` a ficha
     mede 135–156px em qualquer largura.
  5. **`fit-content` é a largura do filho mais largo** — e a nota de dica ("A cor
     entra em cena quando você escolher um cabelo") mandava na seção inteira,
     abrindo os discos para 47px de vão e desalinhando o cabeçalho em 27px. No
     estado padrão de quem acabou de chegar. A nota saiu de dentro do `w-fit`.

  Conferido no fim: **0 overflow horizontal** em 375 e 1280, amostras 4+4 em toda
  largura, passo idêntico entre os dois grupos de cor, ficha de altura uniforme.

  ⚠️ **Um teste caiu, e ele estava vivo por um comentário.**
  `perfilCounters.test.ts` exigia a string `"catalogTotal"` no `PerfilClient` —
  mas a stat "Coleção" foi apagada no Bloco D e o catálogo de itens no Bloco B.
  A asserção passou por três blocos porque a palavra sobrevivia **num comentário
  que explicava a remoção**: o teste media a própria lápide. Caiu quando o E.4
  reescreveu o comentário. A resposta não foi recolocar a palavra — foi tirar a
  asserção sem sujeito. O outro `it` (nenhum total literal em contador) fica, e
  vale para qualquer contador da tela. **478 testes, não 479, e isso é subtração.**

  **Dois achados registrados e não consertados, pela regra 9:** o **G12** (o
  seletor oferece 6 cabelos e só 4 são reconhecíveis pelo desenho — coque e
  moicano têm 3% e 5% da tinta dos traçados e leem como gorro e coroa; medido por
  rasterização par a par) e o **D7** (o `/perfil` ficou com dois idiomas visuais
  na mesma tela — 70 cores cruas legadas ao lado dos blocos novos em token).

- [ ] **E.5 — o e2e reescrito.**

### Bloco F — publicar

Merge na `main`, push, e **conferência manual do Doug no ar** — a prova é a tela
funcionando, como foi no R4.

⚠️ **O F foi partido em dois em 2026-08-10, por decisão do Doug, e a §2 deste
documento deixou de valer aqui.** A §2 manda atualizar a `main` uma vez só, no F,
e o motivo escrito era a armadilha de ordem: cliente no ar mais velho que o banco.
**Esse motivo terminou no Bloco D.** O A.2 fez o cliente parar de esperar item e o
D tirou o resto — medido por grep, nada na branch chama `equip_item`,
`unequip_slot`, `user_inventory`, `user_equipped` ou `items`. Pela primeira vez
desde o Bloco A, o cliente da branch **bate com o banco de produção**.

Manter a `main` parada até o fim do E custaria caro por nada: o que está no ar é o
pré-Bloco-A, que faz `json.item as Record` seguido de `item.id` em
`useChests.ts:122` — **abrir baú estoura na tela**, e estouraria por quantas
sessões o E levar.

- [x] **F.1 — publicar o D, em 2026-08-10.** Fecha o estouro do baú e aceita, de
  propósito, um perfil **sem boneco nenhum** até o E — espaço vazio, não boneco
  errado. Fast-forward, como no R4: `origin/main` era ancestral da branch, 0 atrás
  e 12 à frente, medido com `git merge-base --is-ancestor` antes.
- [x] **F.2 — publicar o E, em 2026-08-10**, com o avatar novo nas 3 telas. A
  conferência manual do Doug no ar continua sendo a prova, e é aqui que ela vale.
  Fast-forward outra vez: `origin/main` ancestral, 0 atrás e 5 à frente, medido
  antes. `8f6483b..9249254`. `verify:all` exit 0 antes e depois.

  **A ordem foi cumprida: push primeiro, apply depois.** Medido em produção nos
  dois lados do apply, só leitura:

  | | antes | depois |
  |---|---|---|
  | `avatar_chosen = true` | 8 | **0** |
  | `avatar_chosen = false` | 11 | 19 |
  | `NULL` | 0 | 0 |
  | default integral | 18 de 19 | 18 de 19 |
  | `COMMENT` da coluna | ausente | presente |

  As três colunas de identidade **não se mexeram**, que é o que a migration
  promete: a única conta fora do default integral (pele 7, cabelo espetado)
  continua com pele 7 e espetado, e só perdeu o `chosen`. Ela reentra na tela de
  criação com a própria identidade pré-selecionada, por
  `criar-personagem/page.tsx:42-44`.

  ⚠️ **O "as 19 no default integral" desta §4 e do cabeçalho da migration está
  vencido — são 18.** Medido na releitura do F.2, registrado como **D8** em
  `docs/achados.md` e **não consertado**, pela regra 9. Não afeta a aplicação: na
  janela do F.2 o `WHERE` largo continua correto pelo motivo escrito, que é a
  ordem, não a heurística.

  **A conferência manual do Doug aconteceu, e é o que fecha o F.2.** Duas contas,
  quatro telas, mais duas medições no banco que a tela não mostra:

  - **A escolha vai ao servidor e volta.** `sirdouglasvieira` (nv. 9) caiu na
    tela de criação sem clicar em nada, escolheu, e o banco foi de
    `chosen=false, pele 2, careca, cor 0` para `chosen=true, pele 7, espetado,
    cor 3` — o mesmo boneco que a tela pintou.
  - **A matview se atualizou sozinha depois de uma escolha real.** Primeira vez
    medido: `users` 19 × matview 19, **0 divergências** de identidade, e a
    escolha nova já estava na cópia. É o refresh que o E.3 pendurou na RPC.
  - **O cadeado vem do servidor.** Mesma tela, nv. 23 mostra 1 cadeado (chanel,
    nível 30) e nv. 9 mostra 3 (coque, moicano, chanel) — a régua do
    `avatar_hair_catalog`, não um número chumbado no cliente.
  - **O caso do D8 não perdeu nada.** `teacherdoug001`, a única conta com
    identidade real e `chosen=false`, foi redirecionada para a criação e a tela
    abriu **com o espetado já marcado**. Confirmou sem reescolher; pele 7 e
    espetado intactos, `chosen` de volta a true.
  - **Os dois caminhos do perfil público renderizam**, um aluno vendo o outro.

  `avatar_chosen` no fim: **2 de 19** — as duas contas do teste. As outras 17
  continuam sendo mandadas para a tela nova, que é o que a migration quis.

## 5. O que este plano NÃO resolve

- **Arte nova.** Continuam 5 cabelos e 6 opções. Se é pouco para um catálogo de
  recompensa, é fila do Bloco 8 (desenho), não daqui
- **A régua da patente (T1).** Foi deliberadamente evitada: o desbloqueio é por
  nível justamente para não travar atrás dela
- **O D30 inteiro** (avatar na navbar, nos dois rankings, no mural). O Bloco E
  entrega as 3 telas que hoje têm avatar; levá-lo às outras 4 é o Bloco 6 do doc 15
