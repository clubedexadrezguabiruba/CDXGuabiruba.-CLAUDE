# Avatar / Cosméticos / Baús — Checklist de Verificação

> Tudo que precisa ser verificado no subsistema, por camada. Marque `[x]` ao
> conferir. Legenda de estado: **✅ existe** · **⚠️ parcial** · **❌ não existe**.
>
> Levantado em 2026-07-29 contra o banco de produção e o código real.

## Inventário do que existe hoje

| | |
|---|---|
| **Tabelas** | `items`, `user_inventory`, `user_equipped`, `user_chests`, `daily_chests`, `user_eggs`, `user_titles`, `xp_grants`, `title_tiers` — provas das duas ausentes no inventário antigo: `20260312100000_phase7_user_chests.sql:64` e `20260729120000_patente_por_marcos.sql:51` |
| **RPCs** | `claim_chest`, `equip_item`, `unequip_slot`, `update_avatar_base`, `get_eggs`, `hatch_egg`, `_create_random_pet_egg`, `_create_specific_pet_egg` |
| **Policies RLS** | **9 no histórico versionado:** 14 `CREATE POLICY` menos 5 remoções efetivas. As 14 são 11 em `20260216180200_rls.sql:170-232`, 2 em `20260312100000_phase7_user_chests.sql:36,78` e 1 em `20260729120000_patente_por_marcos.sql:73`. Saíram 3 de mutação (`20260314100000_phase8_equip_rpcs.sql:10-12`) e 2 de leitura entre colegas (`20260318100000_fix_inventory_rls_leak.sql:5`; `20260320200000_fix_equipped_rls_leak.sql:5`). O `DROP` de `title_tiers_select_all` em `20260729120000_patente_por_marcos.sql:72` não reduz a conta porque a policy é recriada na linha 73. Estado efetivo ainda precisa ser confirmado no banco. |
| **Componentes** | `AvatarDisplay`, `InventoryGrid`, `SlotGrid`, `Chocadeira` |
| **Hooks** | `useInventory`, `useChests`, `useEggs`, `useAchievements` |
| **Cobertura e2e** | 8 testes em `phase8-avatar.spec.ts` |
| **Testes unitários** | **8 arquivos** em `src/lib/avatar/**/__tests__/`: resolver, paleta, renderabilidade e contrato SVG (`assetResolver.test.ts:14-75`; `palette.test.ts:28-137`; `renderability.test.ts:17-90`; `svgContrato.test.ts:13-70`) mais cabelo/estilo (`cabelo.test.ts:80-373`; `linhas-cabelo.test.ts:78-225`; `rosto-cor.test.ts:42-62`; `trava-silhueta.test.ts:27-98`). |
| **Gate de verify** | **4 gates** em `scripts/verify/phase8/`: assets, banco, pool de baús e paleta de patentes, registrados em `package.json:38-44`. |

---

# 1. Dados e schema

- [ ] `items`: toda linha tem `slot` válido, `rarity` válida, `image_url` não nulo
- [ ] CHECK de `items.slot` cobre os 8 slots do D6 (falta `hair`, `back`)
- [ ] CHECK de `user_equipped.slot` idem
- [ ] CHECK de `items.rarity` = common/rare/epic/legendary
- [ ] `user_inventory` tem UNIQUE `(user_id, item_id)` — base da idempotência
- [ ] `user_equipped` tem UNIQUE `(user_id, slot)` — 1 item por slot
- [ ] FKs de `user_inventory.item_id` e `user_equipped.item_id` → `items.id`
- [ ] `user_equipped.item_id` só aceita item que está em `user_inventory` do mesmo user *(hoje garantido só pelo RPC — verificar se há constraint)*
- [ ] `users.avatar_chosen` e `avatar_base` — estado e uso após o D25/D27
- [ ] Distribuição de raridade bate com a pirâmide do D28 (hoje **19/20/20/18**, fora da pirâmide)
- [ ] Nenhum item órfão: todo `image_url` aponta para arquivo existente **(hoje: 45 de 77 falham)**

# 2. Concessão — como um item entra no inventário

Todo caminho precisa ser **server-side, idempotente e transacional**.

- [ ] `claim_chest`: sorteio respeita raridade; duplicata vira XP (`scrapped_xp`)
- [ ] `claim_chest`: não sorteia uniforme nem moldura (**D16** — verificar após reseed). *A relíquia saiu da frase com o slot `hand`, removido pela **D-E** do doc 15 em 2026-07-31.*
- [ ] `claim_chest`: baú já reclamado retorna `already_claimed`, não concede de novo
- [ ] Conquistas concedem via `reward_item_id` sem duplicar
- [ ] Level-up, streak e welcome concedem pelo mesmo caminho idempotente
- [ ] `hatch_egg`: ovo já chocado não choca duas vezes
- [ ] **D25** — patente concede e auto-equipa uniforme ao atingir o tier de aulas
- [ ] **D25** — backfill idempotente para quem já passou do marco
- [ ] **D29** — baú de escolha: as 3 opções vêm do servidor; escolher 1 não permite pegar as outras
- [ ] Nenhum caminho de concessão confia em dado do client
- [ ] Origem registrada em `user_inventory.source` (chest/achievement/title/…)

# 3. Equipar e desequipar

- [ ] `equip_item` rejeita item que o usuário não possui **(✅ coberto no e2e)**
- [ ] `equip_item` no mesmo slot substitui o anterior, não acumula
- [ ] `unequip_slot` em slot vazio não quebra
- [ ] Item de slot inválido é rejeitado
- [ ] INSERT direto em `user_equipped` bloqueado por RLS **(✅ coberto no e2e)**
- [ ] Estado otimista do `useInventory` reverte se o RPC falhar
- [ ] Erro de equipar aparece na UI *(corrigido em `47fdf2c` — confirmar que segue)*
- [ ] **D27** — escolha de cor persiste e valida contra a paleta no servidor
- [ ] Equipar em outro dispositivo reflete ao recarregar

# 4. Render

- [ ] Ordem de camadas (z) confere com a §2.3 do plano v4
- [ ] Cada slot usa o render mode correto
- [ ] Anchors posicionam corretamente nos 4 tamanhos
- [ ] **D24** — offset por item respeitado (chapéu alto × boné)
- [ ] Chapéu esconde cabelo; válvula `showsHair` funciona
- [ ] **D8** — as 4 expressões trocam só por classe CSS, sem novo request
- [ ] **D4** — os 8 tons de pele aplicam sem sujar o contorno
- [ ] Uniforme registra sobre o corpo em **todos** os tons
- [ ] Asset ausente **falha alto**, não devolve `null` em silêncio *(hoje falha em silêncio — causa dos 45 invisíveis)*
- [ ] Fallback de uniforme ausente cai para o traje da base, nunca boneco pelado
- [ ] Animação de respiro do `character-root` não desalinha as camadas
- [ ] Pet animado não trava a página em celular fraco

# 5. Assets e integridade catálogo ↔ arte

- [ ] **D20** — manifesto gerado no build lista todo arquivo existente
- [ ] **Gate:** item de catálogo sem asset **quebra o build**
- [ ] **Gate:** asset órfão (arquivo sem item) é reportado
- [ ] Toda cor usada está na paleta (**D18**)
- [ ] **Regra da paleta:** cores têm separação suficiente para não se fundirem no encaixe *(medido: `#4a3526` colou em `#3d2b1f`)*
- [ ] SVG passa pelo SVGO e não tem metadado de editor
- [ ] `viewBox` consistente entre itens do mesmo slot
- [ ] **D30** — recorte de cabeça enquadra bem em todos os cabelos e chapéus
- [ ] **D23** — folha de contato gerada e revisada
- [ ] Peso total de `public/items/` dentro do orçamento *(hoje 7,2 MB)*

# 6. Visual e UX

- [ ] Lê bem a **56 px** — o tamanho que manda
- [ ] Lê bem nos 4 tamanhos (`sm`/`md`/`lg`/`xl`)
- [ ] **D30** — avatar aparece em navbar, ranking, ranking de turma, mural e Companhia *(hoje: só nas 2 telas de perfil)*
- [ ] Moldura de raridade visível no ranking
- [ ] Estado vazio do inventário tem texto útil **(✅ existe)**
- [ ] Estado de carregando não pisca nem salta layout
- [ ] Estado de erro é visível e diz o que fazer
- [ ] Filtros de inventário por slot e raridade **(✅ cobertos no e2e)**
- [ ] Animação de abertura de baú roda até o fim sem travar
- [ ] Duplicata comunica claramente "você já tinha, virou XP"
- [ ] Item recém-ganho é destacado no inventário
- [ ] Trocar de cor/item dá retorno imediato, sem esperar servidor
- [ ] Perfil não monta dois `AvatarDisplay` visíveis ao mesmo tempo *(armadilha conhecida: mobile + desktop, um escondido por CSS)*

# 7. Segurança

- [ ] — estático: as migrations declaram RLS nas 9 tabelas do inventário (`20260216180200_rls.sql:168-232`; `20260312100000_phase7_user_chests.sql:34,76`; `20260319100000_egg_hatching_system.sql:59`; `20260729120000_patente_por_marcos.sql:70`); falta confirmar no banco que todas seguem com RLS ativo.
- [ ] — estático: `inventory_select_classmate` e `equipped_select_classmate` são dropadas em `20260318100000_fix_inventory_rls_leak.sql:5` e `20260320200000_fix_equipped_rls_leak.sql:5`, e o gate as proíbe em `scripts/verify/phase8/verify-avatar-db.ts:52-53,170-185`; falta confirmar no banco. **Assimetria sem justificativa escrita:** `titles_select_classmate` foi criada junto delas (`20260216180200_rls.sql:232`), nunca foi dropada no histórico de `supabase/migrations/` e não consta de `POLICIES_PROIBIDAS`, que nomeia somente as outras duas (`scripts/verify/phase8/verify-avatar-db.ts:53`). Isto não prova vazamento; registra uma diferença que precisa ser justificada ou corrigida.
- [ ] — estático: as três policies de INSERT/UPDATE/DELETE de `user_equipped` são removidas em `20260314100000_phase8_equip_rpcs.sql:10-12`, e as policies restantes do subsistema são de SELECT (`20260216180200_rls.sql:170-232`; `20260312100000_phase7_user_chests.sql:36,78`; `20260729120000_patente_por_marcos.sql:73-74`); falta tentar INSERT/UPDATE/DELETE como `anon` e `authenticated` no banco para confirmar que toda mutação direta está bloqueada.
- [ ] — estático: EXECUTE dos helpers `_create_*` é revogado de `anon`/`authenticated` em `20260725120000_security_search_path_revokes.sql:80-81`, e o gate consulta os privilégios efetivos em `scripts/verify/security/verify-privileges.ts:19-32,87-118`; falta confirmar no banco.
- [ ] — estático: a migration fixa `search_path` nas funções DEFINER existentes em `20260725120000_security_search_path_revokes.sql:22-63`, as funções posteriores preservam a regra (`20260729120000_avatar_v4_ponte_baus.sql:75-76,243-244`; `20260729120000_patente_por_marcos.sql:118-119,197-198`; `20260731100000_remover_slot_hand.sql:137-142`; `20260804120000_analise_lance_de_livro.sql:99-110`) e o gate varre todas em `scripts/verify/security/verify-privileges.ts:56-84`; falta confirmar no banco.
- [ ] — estático: `get_public_profile` monta `equipped_items` exclusivamente de `user_equipped` filtrado por `p_user_id`, sem ler `user_inventory` (`20260321100000_avatar_base.sql:125-136,138-155`); falta confirmar a definição efetiva e a resposta no banco.
- [ ] — estático: `avatar_config` é cache derivado somente de `slot → item_id` equipado (`20260314100000_phase8_equip_rpcs.sql:52-59,98-105`) e é publicado pela view (`20260321100000_avatar_base.sql:16-25`); falta confirmar no banco que a definição efetiva não carrega outros campos.
- [ ] — **metade fechada em 2026-08-06, metade em aberto.** *Fechada:* `user_public_profiles` é MATERIALIZED VIEW e matview não aceita RLS; o gate mediu no banco e ela estava **SELECTável por `anon` e `authenticated`**, com `display_name` cru e a coluna `ranking_visible` dentro. O opt-out era cortesia da camada de RPC, não garantia. Revogada por `20260806150000_revogar_leitura_perfis_publicos.sql`, aplicada; `npm run verify:privileges` §4 reprovava antes e passa depois, e agora vigia. *Em aberto:* o ranking de turma **ignora `ranking_visible` deliberadamente** (comentário em `20260316100000_phase10_rankings.sql:232`, implementação em `:277-284`). Requisito e código discordam de propósito; falta decidir qual vence — é decisão, não bug.

# 8. Performance

- [ ] Ranking com 30 alunos: número de requisições e tempo até pintar
- [ ] Payload do avatar por aluno em lista
- [ ] `useInventory` não refaz query a cada render
- [ ] Sem layout shift ao carregar avatar em lista
- [ ] Medir no **celular mais fraco disponível**, não no desktop

# 9. Acessibilidade

- [ ] Avatar tem `alt`/`aria-label` com nome do aluno
- [ ] Contraste do nome sobre o fundo equipado
- [ ] Botões de equipar alcançáveis por teclado
- [ ] Animação respeita `prefers-reduced-motion`
- [ ] Cor não é o único sinal de raridade

# 10. Cobertura de teste — o que falta

- [x] Gate de banco da fase 8 existe e verifica RPCs, CHECKs de slots, UNIQUE de inventário e ausência das duas policies de vazamento nomeadas (`scripts/verify/phase8/verify-avatar-db.ts:41-53,77-184`; registrado em `package.json:39,44`).
- [ ] — ausente: há testes do resolver (`src/lib/avatar/__tests__/assetResolver.test.ts:14-75`) e da paleta (`src/lib/avatar/__tests__/palette.test.ts:28-137`), mas procurei ordem geral de camadas e offset por item em `src/lib/avatar/**/*test.ts` e não existem.
- [ ] — ausente: procurei concessão por patente (**D25**) nos oito testes de `e2e/phase8-avatar.spec.ts:161-392` e nos demais `e2e/*.spec.ts`; não existe.
- [ ] — ausente: procurei baú de escolha (**D29**) nos oito testes de `e2e/phase8-avatar.spec.ts:161-392` e nos demais `e2e/*.spec.ts`; não existe.
- [ ] — ausente: procurei persistência da escolha de cor (**D27**) nos oito testes de `e2e/phase8-avatar.spec.ts:161-392` e nos demais `e2e/*.spec.ts`; não existe.
- [ ] — ausente: procurei avatar no ranking (**D30**) nos oito testes de `e2e/phase8-avatar.spec.ts:161-392` e nos demais `e2e/*.spec.ts`; não existe.
- [ ] — ausente: procurei teste que prove que duplicata vira XP em `e2e/`, `src/lib/avatar/**/__tests__/` e `scripts/verify/phase8/`; não existe. O gate de baús apenas coleta os itens duplicados para verificar renderabilidade (`scripts/verify/phase8/verify-chest-pool.ts:207-214`), sem assertar conversão em XP.
- [x] Gate de integridade catálogo ↔ assets (**D20**) existe como ratchet: cruza `items` com o disco, identifica miniatura/asset ausente e órfãos e falha em item novo quebrado ou regressão (`scripts/verify/phase8/verify-avatar-assets.ts:92-125,150-205`; registrado em `package.json:38,44`). **A marca é sobre o gate existir, não sobre o bug estar resolvido:** os 45 itens invisíveis seguem congelados em `scripts/verify/phase8/asset-baseline.json` e são tolerados por desenho — o gate só reprova se o número crescer. O bloqueador nº 1 da seção Prioridade continua aberto.

---

# Prioridade

**Bloqueia o lançamento:**
1. Integridade catálogo ↔ assets (§5) — é o bug dos 45 itens invisíveis
2. Gate da fase 8 com as policies de vazamento (§7)
3. Avatar nas superfícies sociais (§6, D30) — sem isso o sistema não motiva

**Alto valor, custo baixo:**
4. Testes unitários de `src/lib/avatar/` (§10)
5. Falha alta em asset ausente (§4)
6. Pirâmide de raridade (§1, D28)

**Depois do piloto:**
7. Performance medida em celular real (§8)
8. Acessibilidade completa (§9)
