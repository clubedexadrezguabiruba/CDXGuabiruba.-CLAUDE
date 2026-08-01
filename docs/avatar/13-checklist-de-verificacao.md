# Avatar / Cosméticos / Baús — Checklist de Verificação

> Tudo que precisa ser verificado no subsistema, por camada. Marque `[x]` ao
> conferir. Legenda de estado: **✅ existe** · **⚠️ parcial** · **❌ não existe**.
>
> Levantado em 2026-07-29 contra o banco de produção e o código real.

## Inventário do que existe hoje

| | |
|---|---|
| **Tabelas** | `items`, `user_inventory`, `user_equipped`, `user_chests`, `daily_chests`, `user_eggs`, `user_titles` |
| **RPCs** | `claim_chest`, `equip_item`, `unequip_slot`, `update_avatar_base`, `get_eggs`, `hatch_egg`, `_create_random_pet_egg`, `_create_specific_pet_egg` |
| **Policies RLS** | 5, todas `_select_own` — mutação só via RPC |
| **Componentes** | `AvatarDisplay`, `InventoryGrid`, `SlotGrid`, `Chocadeira` |
| **Hooks** | `useInventory`, `useChests`, `useEggs`, `useAchievements` |
| **Cobertura e2e** | 8 testes em `phase8-avatar.spec.ts` |
| **Testes unitários** | **❌ nenhum** para `src/lib/avatar/` |
| **Gate de verify** | **❌ nenhum** `scripts/verify/phase8/` |

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

- [ ] Todas as tabelas com RLS ativo **(✅ 5 policies `_select_own`)**
- [ ] **Policies `inventory_select_classmate` e `equipped_select_classmate` NÃO existem** — vazavam inventário entre colegas; foram dropadas e precisam de gate
- [ ] Nenhuma mutação direta possível: INSERT/UPDATE/DELETE só via RPC
- [ ] RPCs internos (`_create_*`) não são chamáveis por `anon`/`authenticated` *(coberto por `verify:privileges`)*
- [ ] Toda função SECURITY DEFINER fixa `search_path` *(coberto por `verify:privileges`)*
- [ ] Perfil público não expõe item não equipado nem inventário alheio
- [ ] `avatar_config` na view pública não carrega dado sensível
- [ ] Opt-out de ranking respeitado também no avatar (LGPD)

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

- [ ] **Gate `scripts/verify/phase8/`** — não existe. Deve assertar: RPCs presentes; CHECK de slots; UNIQUE de inventário; **ausência das policies de vazamento**
- [ ] **Testes unitários de `src/lib/avatar/`** — não existe nenhum. Cobrir: resolver de asset, ordem de camadas, encaixe na paleta, offset por item
- [ ] e2e: concessão por patente (**D25**)
- [ ] e2e: baú de escolha (**D29**)
- [ ] e2e: escolha de cor persiste (**D27**)
- [ ] e2e: avatar aparece no ranking (**D30**)
- [ ] Teste de que duplicata vira XP
- [ ] Gate de integridade catálogo ↔ assets (**D20**)

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
