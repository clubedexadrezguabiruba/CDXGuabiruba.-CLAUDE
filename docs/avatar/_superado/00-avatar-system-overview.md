# 00 — Sistema de Avatar: Visão Geral

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

## Por que esta reestruturação existe

O sistema de avatar do Recruta 64 foi construído incrementalmente durante a Fase 8.
Ele funciona para o caso básico (base + head + hand + pet + background), mas acumulou
problemas estruturais que impedem expansão confiável:

| Problema | Impacto | Documento que resolve |
|----------|---------|----------------------|
| Motion aplicada camada a camada — head e hand flutuam quando base respira | Avatar parece montagem, não personagem | [03-render-architecture](03-render-architecture.md) |
| Outfit quebrado (body-swap AI não casa proporções) | Slot inutilizado, 8 itens sem render | [04-body-family-and-template-spec](04-body-family-and-template-spec.md) |
| Frame removido (CSS object-fit incompatível) | Slot inutilizado, 8 itens sem render | [03-render-architecture](03-render-architecture.md) |
| Posicionamento hardcoded por multiplicadores no componente | Cada novo item exige calibração manual no frontend | [01-avatar-domain-model](01-avatar-domain-model.md), [04-body-family](04-body-family-and-template-spec.md) |
| URL swap frágil (`.replace('.png', '-swap-male.png')` inline) | Quebra silenciosa se convenção mudar | [03-render-architecture](03-render-architecture.md) |
| Sem spec formal para criação de assets | Artista/AI gera imagem incompatível → retrabalho | [04-body-family-and-template-spec](04-body-family-and-template-spec.md) |
| Sem modelo de domínio explícito | Conceitos implícitos no código dificultam comunicação e evolução | [01-avatar-domain-model](01-avatar-domain-model.md) |

---

## Princípios inegociáveis

1. **Servidor é autoridade** — inventário, equipamento e recompensas continuam exclusivamente em RPCs server-side. O frontend renderiza, nunca decide.

2. **Nenhum ajuste manual por item no frontend** — todo posicionamento vem de anchor profiles definidos por body_family. Items são desenhados para encaixar na região do slot. Se o item não encaixa, o problema é do asset, não do código.

3. **Assets inteligentes, código simples** — a complexidade de encaixe é resolvida no pipeline de produção de assets (templates, regions, specs de canvas). O renderer é genérico.

4. **Compatibilidade com dados existentes** — as tabelas `items`, `user_inventory`, `user_equipped` e os RPCs `equip_item`/`unequip_slot` não mudam. Zero migration destrutiva.

5. **Sem overengineering** — body_family como config TypeScript (não tabela DB). Asset resolver como função pura (não tabela de variantes). Nenhuma abstração além do necessário para o estado atual do produto.

---

## Subsistemas

```
┌─────────────────────────────────────────────────────┐
│                    AVATAR SYSTEM                     │
├──────────────┬──────────────┬───────────────────────┤
│  Data Model  │ Render Engine│   Asset Pipeline      │
│  (Supabase)  │  (React)     │   (Docs + Tooling)    │
├──────────────┼──────────────┼───────────────────────┤
│ items        │ AvatarDisplay│ Body Family Spec      │
│ user_inventory│ character-root│ Template Guides      │
│ user_equipped│ AvatarLayer  │ Canvas/Region Rules   │
│ avatar_config│ FrameDecor   │ AI Prompts            │
│ equip RPCs   │ assetResolver│ Processing Pipeline   │
├──────────────┼──────────────┼───────────────────────┤
│  Body Family │  Animation   │  Variant Resolution   │
│  Config (TS) │  (Framer)    │  (TS function)        │
├──────────────┼──────────────┼───────────────────────┤
│ anchors      │ global idle  │ head → gender swap     │
│ slot regions │ local micro  │ pet → animated swap    │
│ render modes │ baked (APNG) │ outfit → gender swap   │
└──────────────┴──────────────┴───────────────────────┘
```

| Subsistema | Responsabilidade | Localização |
|------------|-----------------|-------------|
| **Data Model** | Items, inventário, equipamento, avatar_config cache | Supabase DB (existente, sem mudanças) |
| **Body Family Config** | Anchor profiles, slot regions, canvas spec | `src/lib/avatar/bodyFamilies.ts` (novo) |
| **Asset Resolver** | Mapear (item, gender, size) → URL correto | `src/lib/avatar/assetResolver.ts` (novo) |
| **Render Engine** | Árvore de componentes, composição de camadas | `src/components/avatar/AvatarDisplay.tsx` (rewrite) |
| **Animation** | Global idle + local micro-motion + baked APNG | Framer Motion no component tree |
| **Asset Pipeline** | Templates, specs de canvas, processamento | Documentação + scripts existentes |

---

## Escopo e não-escopo

### Dentro do escopo (esta onda de documentos)
- Definir modelo de domínio completo do avatar
- Definir data model final (confirmando que o atual é suficiente)
- Definir arquitetura de render com component tree correto
- Definir body family spec com regions e templates
- Resolver arquiteturalmente outfit (base_swap) e frame (CSS border-image)

### Fora do escopo (próximas ondas)
- Implementação de código (componentes, config, resolver)
- Produção de novos assets (outfits full-body, frames 9-slice)
- Playbook operacional de geração (prompts AI, pipeline de processamento, flood fill, ffmpeg)
- Checklists detalhados de validação de assets
- Tooling automatizado de validação de assets
- Segundo body_family (chibi, realista, etc.)
- Loja de itens / marketplace
- Animações complexas do body (APNG para o personagem principal)

---

## Mapa dos documentos

### Fundacionais

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | **Este documento** | Visão geral, princípios, subsistemas, escopo |
| 01 | [Domain Model](01-avatar-domain-model.md) | Conceitos: body_family, slot, render_mode, anchor_profile, etc. |
| 02 | [Data Model](02-avatar-data-model.md) | Schema DB, o que é persistido vs derivado vs config |
| 03 | [Render Architecture](03-render-architecture.md) | Component tree, motion, render modes, asset resolver |
| 04 | [Body Family & Template Spec](04-body-family-and-template-spec.md) | Canvas produção/runtime, regions, template-space, invariantes de outfit |

### Operacionais

| # | Documento | Conteúdo |
|---|-----------|----------|
| 05 | [Asset Generation Playbook](05-asset-generation-playbook.md) | Processo de geração por slot, consistência visual, ferramentas |
| 06 | [Asset Processing Pipeline](06-asset-processing-pipeline.md) | Flood fill, resize, export master/runtime, APNG, naming |
| 07 | [Asset Validation Checklists](07-asset-validation-checklists.md) | Checklists por slot, severidades, compatibilidade cross-slot |
| 08 | [Animation Spec](08-animation-spec.md) | Valores canônicos, hierarquia de motion, limites, performance |
| 09 | [Implementation Backlog](09-implementation-backlog.md) | 7 fases executáveis com critérios de pronto |

**Ordem de leitura**: Fundacionais 00 → 01 → 04 → 03 → 02. Operacionais 05 → 06 → 07, depois 08 e 09 independentes.

---

## Decisões já tomadas

| Decisão | Alternativa descartada | Motivo |
|---------|----------------------|--------|
| Outfit = dressed_base (full-body com roupa, mesma pose/proporções) | Overlay sobre corpo / body-swap AI / personagem novo por outfit | AI não gera overlay que case com base; dressed_base garante compatibilidade com head/hand |
| Frame = CSS border-image / SVG | Image layer no render stack | `object-fit` em `<img>` não funciona para molduras decorativas |
| Anchor profiles em TypeScript | Tabela `anchor_profiles` no DB | Config de render não tem variação por usuário, muda com deploys |
| Asset resolver como função pura | Tabela `item_assets` no DB | 3 regras de variante (gender, animated, base_swap) não justificam tabela |
| Character root com motion group | Motion individual por camada | Herança de CSS transform resolve floating — filhos herdam motion do pai |
| Zero DB migration para render (com triggers documentados) | Novas tabelas/colunas preventivas | Schema atual atende todos os casos concretos; triggers para migration futura documentados em [02-data-model](02-avatar-data-model.md) |

## Decisões em aberto

| Questão | Opções | Impacto |
|---------|--------|---------|
| Frame: border-image vs SVG wrapper vs box-shadow | Depende da qualidade visual dos assets 9-slice | Afeta formato dos assets de frame |
| Pet: APNG para todos os tamanhos ou só lg/xl? | Performance mobile vs consistência visual | Afeta peso da página de ranking |
| Outfit fallback: mostrar base quando asset não existe? | UX durante migração de assets | Temporário, resolve sozinho |
| Template guides: Figma, PNG overlay, ou ambos? | Depende do workflow de criação de assets | Afeta playbook operacional |
| Production master 2× obrigatório ou recomendado? | Peso vs qualidade | Assets 1× existentes continuam válidos |
