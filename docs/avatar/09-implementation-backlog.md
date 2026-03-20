# 09 — Backlog de Implementação

Este documento quebra a reestruturação do avatar em fases executáveis com critérios de pronto claros.

---

## Visão geral das fases

```
Fase 1: Config & Types ──── extrair config do hardcode
Fase 2: Asset Resolver ──── centralizar resolução de URLs
Fase 3: Template Guides ─── régua visual para geração de assets
Fase 4: Render Rewrite ──── character-root motion group
Fase 5: Frame CSS ───────── frame fora do image stack
Fase 6: Outfit Assets ───── produção dressed_base
Fase 7: QA & Polish ─────── validação end-to-end
```

Dependências:
```
Fase 1 ──→ Fase 2 ──→ Fase 4 (render rewrite)
                          ↓
Fase 3 (templates) ──→ Fase 5 (frame CSS, independente de 6)
      ↓               Fase 6 (outfit assets, depende de 3+4)
      └────────────────────↗
                          ↓
                      Fase 7 (após 4+5+6)
```

**Por que templates antes de assets**: O template é a régua canônica contra a qual assets são validados. Gerar dressed_base sem template congelado é gerar sem referência — aumenta retrabalho.

---

## Fase 1: Config & Types

**Objetivo**: Extrair body family config e tipos do código hardcoded para módulos tipados.

### Tarefas

| # | Tarefa | Arquivo |
|---|--------|---------|
| 1.1 | Criar tipo `BodyFamily` com canvas, anchors, render modes | `src/lib/avatar/types.ts` (novo) |
| 1.2 | Criar tipo `AnchorProfile` com top/left/width/height/origin | `src/lib/avatar/types.ts` |
| 1.3 | Criar tipo `RenderMode` union: underlay, dressed_base, head_swap, overlay, companion, frame_ui | `src/lib/avatar/types.ts` |
| 1.4 | Criar config `RECRUTA_V1` com anchors male/female, SIZE_CONFIG, pet positioning | `src/lib/avatar/bodyFamilies.ts` (novo) |
| 1.5 | Exportar `SLOT_RENDER_MODES` mapeamento slot → render_mode | `src/lib/avatar/bodyFamilies.ts` |

### Dependências
- Nenhuma. Pode ser feita primeiro.

### Critério de pronto
- `npm run build` passa
- Tipos exportados e importáveis
- Config contém exatamente os valores de `AvatarDisplay.tsx` linhas 15-30 (SIZE_CONFIG, headPos)
- Nenhum componente usa a config ainda (só extração)

---

## Fase 2: Asset Resolver

**Objetivo**: Centralizar resolução de variantes de URL em uma função pura testável.

### Tarefas

| # | Tarefa | Arquivo |
|---|--------|---------|
| 2.1 | Criar função `resolveAssetUrl(baseUrl, avatarBase, renderMode, animated?)` | `src/lib/avatar/assetResolver.ts` (novo) |
| 2.2 | Implementar regras: head_swap → `-swap-{gender}`, dressed_base → `-{gender}`, companion+animated → `-animated` | `src/lib/avatar/assetResolver.ts` |
| 2.3 | Criar `resolveBodyUrl(equippedOutfit, avatarBase)` — lógica mutuamente exclusiva base/outfit | `src/lib/avatar/assetResolver.ts` |

### Dependências
- Fase 1 (tipos `RenderMode`, `AvatarBase`)

### Critério de pronto
- `npm run build` passa
- Função é pura (sem side effects, sem state)
- Cobre os 3 padrões de variante + fallback para overlay/underlay
- Nenhum componente usa ainda (só criação)

---

## Fase 3: Template Guides

**Objetivo**: Criar os guias visuais canônicos que servem como régua para geração de assets.

### Por que antes do render rewrite

Templates não dependem de código — são arquivos visuais. Mas a produção de outfit assets (Fase 6) depende deles. Criá-los cedo congela a régua e reduz retrabalho na geração.

### Tarefas

| # | Tarefa | Formato |
|---|--------|---------|
| 3.1 | Template outfit male (silhueta + canvas 800×1200) | PNG ou Figma |
| 3.2 | Template outfit female | PNG ou Figma |
| 3.3 | Template head male (rosto + head region + linha queixo) | PNG ou Figma |
| 3.4 | Template head female | PNG ou Figma |
| 3.5 | Template hand (braço + hand region) | PNG ou Figma |
| 3.6 | Template pet (ground line + pet region + escala) | PNG ou Figma |
| 3.7 | Template background (canvas 5:7 + ground line + silhueta) | PNG ou Figma |

### Dependências
- Nenhuma forte. Requer acesso às base skins atuais como referência.

### Critério de pronto
- 7 template guides criados em `docs/avatar/templates/`
- Cada template mostra claramente a região do slot
- Templates usáveis como referência para AI e artistas

---

## Fase 4: Render Rewrite

**Objetivo**: Reescrever `AvatarDisplay.tsx` com character-root motion group, usando config e resolver.

### Tarefas

| # | Tarefa | Arquivo |
|---|--------|---------|
| 4.1 | Refatorar container: importar `SIZE_CONFIG` e `RECRUTA_V1` de bodyFamilies | `src/components/avatar/AvatarDisplay.tsx` |
| 4.2 | Criar `<motion.div>` character-root agrupando body + head + hand | `src/components/avatar/AvatarDisplay.tsx` |
| 4.3 | Mover body (base/outfit) para DENTRO de character-root como primeiro filho | `src/components/avatar/AvatarDisplay.tsx` |
| 4.4 | Mover head-anchor para DENTRO de character-root, posicionar via anchor profile | `src/components/avatar/AvatarDisplay.tsx` |
| 4.5 | Mover hand-anchor para DENTRO de character-root, posicionar via anchor profile | `src/components/avatar/AvatarDisplay.tsx` |
| 4.6 | Mover animação global (breathing+sway) para character-root em vez de base img | `src/components/avatar/AvatarDisplay.tsx` |
| 4.7 | Head e hand mantêm suas animações locais (aditivas ao global) | `src/components/avatar/AvatarDisplay.tsx` |
| 4.8 | Substituir `.replace()` inline por chamadas a `resolveAssetUrl()` | `src/components/avatar/AvatarDisplay.tsx` |
| 4.9 | Implementar lógica dressed_base: se outfit equipado, body mostra outfit asset, senão base skin | `src/components/avatar/AvatarDisplay.tsx` |
| 4.10 | Pet mantém posição fora do character-root (sem mudança) | `src/components/avatar/AvatarDisplay.tsx` |
| 4.11 | Remover outfit como camada z:2 separada (agora é body z:1 via dressed_base) | `src/components/avatar/AvatarDisplay.tsx` |

### Dependências
- Fase 1 (config/types)
- Fase 2 (asset resolver)

### Política de interface

- **API pública preservada**: `AvatarDisplayProps` (`equipped`, `avatarBase`, `size`) não muda. Todos os call sites continuam funcionando sem modificação.
- **Estrutura interna livre**: DOM tree, subcomponentes, motion divs, z-indices — tudo pode mudar conforme necessário para a arquitetura correta. Não ficar preso a estrutura antiga se ela impede a solução.
- **Se API pública precisar mudar**: Documentar motivo, atualizar todos os call sites na mesma fase, e manter backward-compatible quando possível (props opcionais com defaults).

### Critério de pronto
- `npm run build` passa
- `npm run lint` passa
- Head e hand acompanham breathing do character-root (verificar visualmente em lg/xl)
- Outfit equipado substitui base (dressed_base, não camada separada)
- Pet continua independente do character-root
- Todos os call sites de AvatarDisplay continuam funcionando
- Avatar visualmente idêntico ao atual (exceto fix do floating) em todos os sizes

### Arquivos afetados (apenas)
- `src/components/avatar/AvatarDisplay.tsx` — rewrite principal
- Nenhuma mudança em RPCs, types, hooks, ou outros componentes

---

## Fase 5: Frame CSS

**Objetivo**: Reativar o slot de frame como CSS border-image, fora do render stack de imagens.

### Tarefas

| # | Tarefa | Arquivo |
|---|--------|---------|
| 5.1 | Criar componente `FrameDecoration` que renderiza CSS border-image | `src/components/avatar/AvatarDisplay.tsx` (inline) ou novo arquivo |
| 5.2 | Mapear frame items existentes para estilos CSS (border-image ou box-shadow) | `src/lib/avatar/bodyFamilies.ts` ou `src/lib/constants/items.ts` |
| 5.3 | Renderizar `FrameDecoration` condicionalmente quando `equipped.frame` presente | `src/components/avatar/AvatarDisplay.tsx` |
| 5.4 | Definir border widths por size (sm:2, md:3, lg:4, xl:5) | `src/lib/avatar/bodyFamilies.ts` |

### Dependências
- Fase 4 (render rewrite concluído)

### Critério de pronto
- Frame items existentes renderizam como CSS ao redor do avatar
- Frame não interfere com layers internos (pointer-events: none)
- Visual OK em sm e xl
- `npm run build` passa

### Risco
- Assets de frame existentes (`public/items/frame/`) podem não funcionar como 9-slice. Pode ser necessário:
  - Usar box-shadow/gradient CSS como fallback (mapear por rarity)
  - Converter assets para formato 9-slice
  - Ou ambos: CSS puro para frames simples, 9-slice para frames premium

---

## Fase 6: Produção de Assets Outfit (dressed_base)

**Objetivo**: Produzir os 16 assets de outfit (8 itens × 2 gêneros) no formato dressed_base.

### Tarefas

| # | Tarefa | Detalhes |
|---|--------|---------|
| 6.1 | Para cada um dos 8 outfit items: gerar versão male | Seguir playbook (doc 05) |
| 6.2 | Para cada um dos 8 outfit items: gerar versão female | Seguir playbook (doc 05) |
| 6.3 | Processar todos os assets (flood fill, resize) | Seguir pipeline (doc 06) |
| 6.4 | Validar cada asset contra checklist (doc 07) | Inclui teste de compatibilidade cross-slot |
| 6.5 | Deploy: copiar para `public/items/outfit/` com naming correto | `{slug}-male.png`, `{slug}-female.png` |

### 8 outfits existentes no DB

| Item | Slug esperado |
|------|--------------|
| Uniforme de Aprendiz | `uniforme-aprendiz` |
| Camiseta do Clube | `camiseta-clube` |
| Túnica Azul | `tunica-azul` |
| Armadura Leve | `armadura-leve` |
| Veste de Mago | `veste-mago` |
| Armadura Real | `armadura-real` |
| Manto Lendário | `manto-lendario` |
| Armadura do Grande Mestre | `armadura-gm` |

### Dependências
- Fase 3 (templates — régua canônica para validar assets)
- Fase 4 (render precisa suportar dressed_base para testar)
- Docs 05, 06, 07 (playbook, pipeline, checklists)

### Política de falha para dressed_base

Este é o slot de maior risco. AI tende a mudar proporções. Para evitar looping indefinido de geração:

| Etapa | Ação | Condição de saída |
|-------|------|-------------------|
| 1. Geração AI | Até **3 tentativas** por item+gênero com AI de imagem | Asset passa nos invariantes (pose, proporções, pés, head/hand region) |
| 2. Inpainting | Até **2 tentativas** de correção por inpainting/edição guiada | Correção resolve o problema sem quebrar outro invariante |
| 3. Edição manual | Photoshop/Figma — edição humana sobre a melhor tentativa AI | Asset passa em todos os invariantes |
| 4. Bloqueio | Se edição manual não resolve | Item **não entra no release**. Slot outfit mostra base skin (fallback já implementado). Item pode ser retentado em onda futura com arte profissional. |

**Regras**:
- Máximo **5 tentativas totais** (3 AI + 2 inpainting) antes de escalar para edição manual
- Cada tentativa é avaliada contra os 6 invariantes do doc 01 (pose, proporções, pés, head region, hand region, estilo)
- Se 2+ invariantes falham, é regeneração completa (não inpainting)
- Se apenas 1 invariante falha e é corrigível (ex: pés deslocados), inpainting é aceitável
- **Não existe tentativa #6 com AI**. Após 5, escala para manual ou bloqueia.

### Critério de pronto
- Assets aprovados em `public/items/outfit/` (pode ser menos de 16 se alguns forem bloqueados)
- Cada asset aprovado passa no checklist do doc 07
- Outfits renderizam corretamente no localhost com head e hand equipados
- Items bloqueados documentados com motivo de falha

---

## Fase 7: QA & Polish

**Objetivo**: Validação end-to-end do sistema reestruturado.

### Tarefas

| # | Tarefa | Detalhes |
|---|--------|---------|
| 7.1 | Testar todas as combinações de slots equipados | base, base+head, base+head+hand, base+outfit+head+hand+pet+bg+frame |
| 7.2 | Testar ambos os gêneros | Trocar avatar via botão no perfil |
| 7.3 | Testar todos os 4 tamanhos | sm (ranking), md (cards), lg (perfil mobile), xl (perfil desktop) |
| 7.4 | Verificar animações em lg/xl | Character-root breathing, head tilt, hand swing, pet APNG |
| 7.5 | Verificar fallbacks | Outfit sem asset → mostra base, head 404 → não renderiza, etc. |
| 7.6 | Verificar perfil público | `get_public_profile` RPC retorna dados corretos para avatar rendering |
| 7.7 | Verificar ranking | Mini-avatares em sm/md renderizam corretamente |
| 7.8 | `npm run build` | Build completa sem erros |
| 7.9 | `npm run lint` | Zero warnings/errors |
| 7.10 | Testar em mobile real | Avatar responsivo e sem layout shift |

### Dependências
- Fases 4, 5, 6 completas

### Critério de pronto
- Todos os testes acima passam
- Nenhum ajuste per-item no código
- Avatar funciona identicamente para male e female
- Performance OK (sem jank em listas de ranking)

---

## Resumo de arquivos afetados

| Arquivo | Fase | Tipo de mudança |
|---------|------|----------------|
| `src/lib/avatar/types.ts` | 1 | **Novo** — tipos do sistema |
| `src/lib/avatar/bodyFamilies.ts` | 1 | **Novo** — config recruta_v1 |
| `src/lib/avatar/assetResolver.ts` | 2 | **Novo** — função resolveAssetUrl |
| `docs/avatar/templates/` | 3 | **Novos** — 7 template guides |
| `src/components/avatar/AvatarDisplay.tsx` | 4, 5 | **Rewrite** — character-root + frame |
| `public/items/outfit/*.png` | 6 | **Novos** — até 16 assets dressed_base |

### Arquivos que NÃO mudam

- `src/types/inventory.ts` — EquippedMap, ItemSlot inalterados
- `src/hooks/useInventory.ts` — interface inalterada
- `supabase/migrations/*` — zero DB migration
- `src/app/(main)/perfil/PerfilClient.tsx` — usa AvatarDisplay (API pública preservada)
- RPCs (`equip_item`, `unequip_slot`, etc.) — inalterados

---

## Estimativa de complexidade por fase

| Fase | Código novo | Assets | Risco |
|------|------------|--------|-------|
| 1. Config & Types | ~100 linhas TS | — | Baixo |
| 2. Asset Resolver | ~50 linhas TS | — | Baixo |
| 3. Template Guides | — | 7 templates | Baixo |
| 4. Render Rewrite | ~200 linhas TS (rewrite) | — | Médio (visual) |
| 5. Frame CSS | ~50 linhas TS | Talvez re-export frames | Médio (CSS) |
| 6. Outfit Assets | — | Até 16 imagens | Alto (geração AI, policy de falha) |
| 7. QA | — | — | Baixo |
