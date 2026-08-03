# 02 — Modelo de Dados do Avatar

> [!WARNING]
> ⚠️ **ARQUIVADO em 2026-08-03 — não vale como instrução.** O banner original mandava ler o doc 10 (v3), que **também** caiu. O plano vigente é o v4: [`../15-plano-ate-pronto.md`](../15-plano-ate-pronto.md). Ver [README](README.md).
>
> A v3 é o plano vigente. Onde este documento conflitar com o 10, vale o 10.
> O que caiu:
> - **`dressed_base`** (outfit trocando o corpo inteiro) → **`garment`** (roupa
>   sobre corpo persistente, transparente na pele).
> - **`head_swap` + knockout mask** → **`hair` + `headgear` como overlays**;
>   o knockout foi **deletado**.
> - **`GenderVariant` / dual male-female** → **corpo único unissex + `avatar_skin`**
>   (5 tons de pele). Some todo sufixo `-{gender}` / `-swap-{gender}`.
> - Slots **`hair`** e **`back`** passam a existir.
>
> **Não produza assets seguindo este documento sem antes ler o 10** — em especial,
> a **Fase 6 do doc 09** ("Outfit Assets — produção dressed_base") **não deve ser
> executada**: são 14 assets que a v3 descarta.

Este documento define o que é persistido no banco, o que é config em código, e o que é derivado em runtime.

**Posição sobre migration**: O schema DB existente atende todos os casos concretos atuais. Nenhuma migration é obrigatória para a reestruturação do render. Esta decisão não é dogmática — triggers explícitos para migration futura estão documentados na seção final.

---

## Visão geral: onde cada dado vive

| Dado | Localização | Tipo | Motivo |
|------|-------------|------|--------|
| Catálogo de items | DB: `items` | Persistido | Fonte de verdade para itens existentes |
| Inventário do usuário | DB: `user_inventory` | Persistido | Server-authority, RLS |
| Equipamento do usuário | DB: `user_equipped` | Persistido | Server-authority, RLS |
| Cache de avatar | DB: `users.avatar_config` | Derivado (cache) | Otimização para ranking/profile sem JOINs |
| Gênero do avatar | DB: `users.avatar_base` | Persistido | Escolha do usuário |
| Flag de escolha | DB: `users.avatar_chosen` | Persistido | Controle de fluxo pós-registro |
| Body family config | Código: `bodyFamilies.ts` | Config estática | Sem variação por usuário, muda com deploy |
| Anchor profiles | Código: `bodyFamilies.ts` | Config estática | Idem |
| Render modes por slot | Código: `bodyFamilies.ts` | Config estática | Idem |
| Resolução de variantes | Código: `assetResolver.ts` | Função pura | Regras determinísticas, 3 padrões |
| Animação params | Código: `AvatarDisplay.tsx` | Config estática | UI concern, sem envolvimento server |
| Frame CSS styles | Código: `items.ts` | Config estática | Mapeamento rarity → CSS |

---

## Schema DB existente (sem mudanças)

### items

```sql
CREATE TABLE public.items (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      text NOT NULL,
  slot      text NOT NULL CHECK (slot IN ('head','outfit','hand','background','frame','pet')),
  rarity    text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  image_url text,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Papel no sistema de avatar**: Catálogo de itens. O `image_url` é a referência canônica do asset — o asset resolver deriva variantes a partir dele.

**Observação sobre `image_url`**: Contém o path relativo do asset principal (ex: `/items/head/bandana-tatica.png`). Variantes por gênero e animação são derivadas em runtime pelo resolver, não armazenadas no DB.

### user_inventory

```sql
CREATE TABLE public.user_inventory (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id     bigint NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'chest'
              CHECK (source IN ('chest','achievement','level_up','welcome','streak')),
  obtained_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
```

**Papel**: Registro de posse. UNIQUE garante que cada item é obtido uma única vez. Source rastreia origem (baú, conquista, level up, welcome, streak).

### user_equipped

```sql
CREATE TABLE public.user_equipped (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slot        text NOT NULL CHECK (slot IN ('head','outfit','hand','background','frame','pet')),
  item_id     bigint NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot)
);
```

**Papel**: Estado de equipamento. UNIQUE(user_id, slot) garante máximo 1 item por slot. O slot é determinado pelo item (via `items.slot`), não pelo client.

### users (colunas de avatar)

| Coluna | Tipo | Default | Uso |
|--------|------|---------|-----|
| `avatar_config` | jsonb | `'{}'` | Cache derivado: `{slot → item_id}`. Reconstruído por `equip_item`/`unequip_slot` |
| `avatar_base` | text | `'male'` | Gender variant escolhida. CHECK: `IN ('male','female')` |
| `avatar_chosen` | boolean | `false` | Flag: usuário já passou pela tela de seleção pós-registro |

---

## RPCs (sem mudanças)

### equip_item(p_item_id bigint) → jsonb

**Validações server-side**:
1. Item existe em `items`
2. Usuário possui item (existe em `user_inventory`)
3. Slot determinado por `items.slot` (nunca pelo client)

**Efeitos**:
- UPSERT em `user_equipped` (substitui item anterior no slot)
- Reconstrói `users.avatar_config` como `{slot → item_id}` de todos os slots equipados

**Retorna**: `{ equipped: true, slot, item: { id, name, slot, rarity, image_url } }`

### unequip_slot(p_slot text) → jsonb

**Efeitos**:
- DELETE de `user_equipped` para aquele slot
- Reconstrói `users.avatar_config`

**Retorna**: `{ unequipped: true, slot }`

### update_avatar_base(p_base text) → jsonb

**Efeitos**:
- Atualiza `users.avatar_base`
- Seta `users.avatar_chosen = true`
- Refresh da materialized view `user_public_profiles`

**Retorna**: `{ updated: true, avatar_base }`

---

## avatar_config: padrão de cache derivado

`users.avatar_config` é um JSON reconstruído atomicamente pelos RPCs:

```json
{
  "head": 42,
  "hand": 15,
  "background": 3,
  "pet": 28
}
```

**Por que existe**: A materialized view `user_public_profiles` inclui `avatar_config` para que rankings e perfis públicos possam mostrar mini-avatares sem JOINs adicionais. É uma otimização de leitura.

**Invariante**: Sempre sincronizado com `user_equipped`. Se `user_equipped` tem 3 rows para um usuário, `avatar_config` tem exatamente 3 chaves.

**Quem reconstrói**: Apenas `equip_item` e `unequip_slot` — nunca o client.

---

## O que NÃO vai para o DB

### Body family config
**Motivo**: Não há variação por usuário. Todos os usuários compartilham o mesmo body_family (`recruta_v1`). A config muda apenas com deploys de código (novo slot, novo anchor, nova proporção). Colocar no DB adicionaria uma tabela, uma query, e um cache — sem benefício.

**Exceção futura**: Se houver múltiplos body_families que o usuário pode escolher, adicionar `users.body_family` como coluna (similar a `avatar_base`). Até lá, é implícito.

### Anchor profiles
**Motivo**: São dados de render, não dados de usuário. O DB armazena *o que* está equipado; o código define *onde* renderizar. Misturar os dois acopla frontend ao schema de forma desnecessária.

### Tabela de item_assets / variantes
**Motivo**: Existem exatamente 3 regras de variante:
1. Head: `{slug}-swap-{gender}.png`
2. Outfit (dressed_base): `{slug}-{gender}.png`
3. Pet: `{slug}-animated.png`

Três regras determinísticas em uma função pura. Uma tabela `item_assets` com foreign key para `items` teria N×M rows (47 items × até 3 variantes = 141 rows) para codificar a mesma informação que 10 linhas de TypeScript. Overengineering.

**Condição que invalidaria esta decisão**: Se algum item precisar de um padrão de variante diferente dos 3 acima (ex: um head que não tem variante female, ou um outfit com 3 variantes de cor). Nesse caso, o resolver não consegue derivar o URL e seria necessário storage explícito. Ver seção "Triggers para migration".

### Render modes
**Motivo**: O render_mode é propriedade do slot, não do item. Todos os items de `head` são `head_swap`. O slot já está no `items.slot`. Adicionar `render_mode` no DB seria redundante.

---

## Fluxo de dados: do DB ao pixel

```
1. user_equipped (DB)
   → { slot: "head", item_id: 42 }

2. items (DB, JOIN)
   → { id: 42, name: "Bandana Tática", slot: "head", image_url: "/items/head/bandana-tatica.png" }

3. EquippedMap (TypeScript, montado no client ou via RPC)
   → { head: { slot: "head", id: 42, name: "Bandana Tática", image_url: "/items/head/bandana-tatica.png" } }

4. bodyFamilies.ts (config)
   → recruta_v1.anchors.male.head = { top: 0.095, left: 0.1, width: 0.8, height: 0.215 }

5. assetResolver (função pura)
   → resolveAssetUrl("/items/head/bandana-tatica.png", "male", "head_swap")
   → "/items/head/bandana-tatica-swap-male.png"

6. AvatarDisplay (React)
   → <motion.div style={{ top, left, width, height }}> ← do anchor
       <img src="/items/head/bandana-tatica-swap-male.png" /> ← do resolver
```

---

## Migração conceitual

### Fase A: Config extraction
- **DB**: nada muda
- **Código**: criar `bodyFamilies.ts` e `assetResolver.ts` extraindo valores hardcoded

### Fase B: Render restructure
- **DB**: nada muda
- **Código**: reescrever `AvatarDisplay.tsx` usando config e resolver

### Fase C: Outfit dressed_base
- **DB**: nada muda (outfit items já existem no catálogo com `image_url`)
- **Assets**: produzir 16 imagens (8 outfits × 2 gêneros) no formato dressed_base
- **Código**: resolver já trata `dressed_base` com variante de gênero

### Fase D: Frame CSS
- **DB**: nada muda
- **Assets**: converter frame PNGs para formato 9-slice ou CSS
- **Código**: frame renderizado como CSS, não como `<img>`

### Futuro: segundo body_family
- **DB**: adicionar coluna `users.body_family DEFAULT 'recruta_v1'`
- **DB**: opcionalmente adicionar `items.body_family` (nullable, null = universal)
- **Código**: body_family config já suporta múltiplas entradas por design

---

## Triggers para migration futura

A decisão de zero-migration não é permanente. Estes são os cenários concretos que justificariam uma migration:

| Trigger | O que adicionaria | Quando |
|---------|-------------------|--------|
| Segundo body_family (ex: chibi) | `users.body_family DEFAULT 'recruta_v1'` + opcionalmente `items.body_family` nullable | Quando houver decisão de produto para estilo visual alternativo |
| Item com padrão de variante não-padrão | `item_assets` table (item_id, variant_key, url) | Quando o resolver de 3 regras não for suficiente (ex: item com 3 variantes de cor) |
| Terceiro gender_variant (ex: non-binary) | Revisar CHECK constraint de `users.avatar_base` + avaliar impacto nos assets | Decisão de produto, não técnica |
| Item restrito a body_family específico | `items.body_family` nullable | Quando existirem 2+ body_families e items exclusivos |
| Metadata de render por item (override de anchor) | `items.render_config` jsonb nullable | Se surgir item que precisa de posição diferente dos demais no mesmo slot — evitar ao máximo via template-space |

**Princípio**: Migrar quando houver caso concreto, não preventivamente. Cada trigger acima tem custo zero enquanto não é ativado e custo bem definido quando for.

---

## Checklist de integridade

- [ ] `items` table: sem mudanças de schema
- [ ] `user_inventory`: sem mudanças
- [ ] `user_equipped`: sem mudanças
- [ ] `users.avatar_config`: sem mudanças (cache continua sendo reconstruído pelos RPCs)
- [ ] `users.avatar_base`: sem mudanças
- [ ] `equip_item` RPC: sem mudanças
- [ ] `unequip_slot` RPC: sem mudanças
- [ ] `update_avatar_base` RPC: sem mudanças
- [ ] RLS policies: sem mudanças
- [ ] `user_public_profiles` view: sem mudanças
