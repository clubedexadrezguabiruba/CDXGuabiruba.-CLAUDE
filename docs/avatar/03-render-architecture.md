# 03 — Arquitetura de Render do Avatar

> [!WARNING]
> **Parcialmente superado pelo [doc 10 — Avatar v3 "O Estrategista"](10-avatar-v3-definitive.md).**
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

Este documento define como o avatar é renderizado no frontend: árvore de componentes, motion, render modes, e asset resolver.

---

## Problema atual

```
<div> container
  <img> background         z:0  — estático
  <motion.img> base        z:1  — breathing (scaleY + rotate)
  <img> outfit             z:2  — estático, posição absoluta ao container
  <motion.div> hand        z:3  — swing, posição absoluta ao CONTAINER
  <motion.div> head        z:4  — tilt, posição absoluta ao CONTAINER
  <div> pet                z:5  — estático ou APNG
```

**O bug**: head e hand são filhos do container, não do base. Quando base respira (scaleY + rotate via Framer Motion), head e hand NÃO herdam esse transform. Resultado: base sobe/desce e balança, mas head e hand ficam fixos ou animam independentemente. O avatar parece uma montagem de peças soltas, não um personagem coeso.

**Causa raiz**: CSS transforms aplicados a um elemento não propagam para siblings — apenas para children. Head e hand precisam ser DOM children de quem respira.

---

## Solução: component tree com character root

```
<div> avatar-container (w, h, rounded, overflow-hidden, relative)
  │
  ├── <img> background (z:0, absolute inset-0)
  │   render_mode: underlay
  │   Fora do character root — cenário estático
  │
  ├── <motion.div> character-root (z:1, absolute bottom-0 center-x)
  │   │ GLOBAL ANIMATION: breathing + sway
  │   │ transformOrigin: "bottom center"
  │   │ Ativo apenas em lg/xl
  │   │
  │   ├── <img> body (w:93%, h:93%, bottom-anchored)
  │   │   Se outfit equipado → asset do outfit (dressed_base)
  │   │   Se não → base skin (avatar-base-{gender}.png)
  │   │
  │   ├── <motion.div> hand-anchor (posicionado por anchor_profile)
  │   │   │ LOCAL ANIMATION: swing (±2°, 3s)
  │   │   │ transformOrigin: "top center"
  │   │   │ Aditivo ao global — herda breathing do parent
  │   │   └── <img> hand asset
  │   │
  │   └── <motion.div> head-anchor (posicionado por anchor_profile)
  │       │ LOCAL ANIMATION: tilt (±0.5°, 3.5s)
  │       │ transformOrigin: "bottom center"
  │       │ Aditivo ao global — herda breathing do parent
  │       └── <img> head asset (gender variant via resolver)
  │
  ├── <div> pet-anchor (z:5, absolute bottom-right)
  │   render_mode: companion
  │   Fora do character root — posição fixa relativa ao container
  │   └── <img> pet asset (static ou APNG baseado no size)
  │
  └── {frame equipado && <FrameDecoration> z:10, CSS border-image}
      render_mode: frame_ui
      Fora do canvas de imagens — pura decoração CSS
```

### Por que isto resolve o problema

Head e hand são **DOM children** de `character-root`. Quando `character-root` aplica `transform: scaleY(1.004) rotate(0.3deg)` via Framer Motion, todos os children herdam automaticamente via CSS transform composition. As animações locais (tilt, swing) são **aditivas** — o browser compõe o transform do parent com o do child.

Resultado: quando o corpo respira, a cabeça e a mão respiram junto. A cabeça ainda faz seu micro-tilt próprio, mas *em cima* da respiração global. O personagem se move como uma unidade coesa.

### Por que pet está fora

O pet é um companion independente. Ele tem sua própria animação (APNG baked). Se estivesse dentro do character-root, herdaria o breathing do personagem — o que é errado visualmente (um dragãozinho ao lado não deve respirar no ritmo do dono).

### Por que background está fora

Background é cenário. Não faz parte do personagem. Preenche o container inteiro sem interação com o motion group.

---

## Render modes: implementação

### underlay (background)

```
Posição: absolute inset-0 (preenche container)
Z-index: 0
Fallback: gradient linear zinc-100 → zinc-200
Source: equipped.background.image_url (sem transformação)
Animação: nenhuma
```

### dressed_base (outfit) / base skin

```
Posição: absolute bottom-0, center-x, w:93%, h:93%
Z-index: 1 (dentro do character-root)

Lógica mutuamente exclusiva:
  SE outfit equipado:
    src = resolveAssetUrl(outfit.image_url, gender, "dressed_base")
    → /items/outfit/{slug}-{gender}.png
  SENÃO:
    src = /items/base/avatar-base-{gender}.png

Animação: herda global do character-root (não tem local própria)
```

### overlay (hand)

```
Posição: anchor_profile do slot hand
  top: h × 0.32, left: w × 0.17, width: w × 0.25, height: w × 0.25
Z-index: 3 (dentro do character-root, acima do body)

Source: equipped.hand.image_url (sem transformação de gênero)

Animação:
  Global: herda do character-root (breathing)
  Local: rotate [-2°, 2°, -2°], 3s, easeInOut, loop infinito
  transformOrigin: "top center" (oscila do ombro)
```

### head_swap (head)

```
Posição: anchor_profile do slot head (varia por gênero)
  Male:   top: h×0.095, left: w×0.1,   width: w×0.8,  height: h×0.215
  Female: top: h×0.098, left: w×0.039, width: w×0.92, height: h×0.230
Z-index: 4 (dentro do character-root, acima do hand)

Source: resolveAssetUrl(head.image_url, gender, "head_swap")
  → /items/head/{slug}-swap-{gender}.png

Animação:
  Global: herda do character-root (breathing)
  Local: rotate [-0.5°, 0.5°, -0.5°], 3.5s, easeInOut, loop infinito
  transformOrigin: "bottom center" (inclina do pescoço)
```

### companion (pet)

```
Posição: absolute bottom, right (fora do character-root)
  bottom: h × 0.09, right: w × -0.01
  Size: petSize × 1.3
Z-index: 5

Source:
  SE size lg/xl (animated):
    resolveAssetUrl(pet.image_url, gender, "companion", animated=true)
    → /items/pet/{slug}-animated.png
  SENÃO:
    pet.image_url (estático)

Animação: baked (APNG) — sem Framer Motion
```

### frame_ui (frame)

```
Posição: envolvendo o avatar-container
Z-index: 10 (acima de tudo)
NÃO é <img> — é CSS

Implementação recomendada:
  <div className="absolute inset-0 pointer-events-none" style={{
    borderImage: `url(${frame.image_url}) 30 round`,
    borderWidth: frameBorderWidth[size],
    borderStyle: "solid"
  }} />

Border widths por size:
  sm: 2px, md: 3px, lg: 4px, xl: 5px

Alternativa: box-shadow com imagem ou SVG inline

Animação: nenhuma (ou CSS glow opcional por rarity)
```

---

## Asset Resolver

Função pura centralizada que elimina `.replace()` espalhados pelo código.

**Localização proposta**: `src/lib/avatar/assetResolver.ts`

**Interface**:
```
resolveAssetUrl(
  baseUrl: string | null,    // image_url do item no DB
  avatarBase: "male"|"female",
  renderMode: RenderMode,
  animated?: boolean          // true para lg/xl com pet
) → string | null
```

**Regras de resolução**:

| render_mode | Regra | Exemplo |
|-------------|-------|---------|
| `head_swap` | `{slug}-swap-{gender}.png` | `bandana-tatica.png` → `bandana-tatica-swap-male.png` |
| `dressed_base` | `{slug}-{gender}.png` | `tunica-azul.png` → `tunica-azul-male.png` |
| `companion` + animated | `{slug}-animated.png` | `peaozinho-madeira.png` → `peaozinho-madeira-animated.png` |
| `overlay`, `underlay` | Sem transformação | `peao-madeira.png` → `peao-madeira.png` |
| `frame_ui` | Sem transformação (ou 9-slice URL) | `madeira.png` → `madeira.png` |

**Por que função e não tabela DB**: São 3 regras determinísticas derivadas do render_mode. Uma tabela `item_assets` teria ~140 rows codificando a mesma lógica. A função é testável em uma linha, a tabela requer migration + seed + manutenção.

---

## Animation architecture

### Hierarquia de motion

```
character-root (GLOBAL)
  ├── body: herda global, sem local
  ├── hand: herda global + local swing
  └── head: herda global + local tilt
pet: baked (APNG), independente
background: nenhuma
frame: nenhuma (ou CSS animation)
```

### Parâmetros preservados

| Layer | Animação | Valores | Duração | Origin |
|-------|----------|---------|---------|--------|
| character-root | breathing + sway | scaleY: [1, 1.004, 1], rotate: [-0.3°, 0.3°, -0.3°] | 4s | bottom center |
| hand | swing | rotate: [-2°, 2°, -2°] | 3s | top center |
| head | tilt | rotate: [-0.5°, 0.5°, -0.5°] | 3.5s | bottom center |

**Durações diferentes por camada**: Intencional. 3s, 3.5s, 4s criam dessincronização orgânica que evita aspecto robótico.

**Valores sutis**: Se a animação for perceptível conscientemente, está exagerada. Os valores atuais são validados.

### Condição de ativação

Animações ativas apenas quando `size === "lg" || size === "xl"`.
Em `sm` e `md`, tudo é estático (performance em listas/rankings).

---

## Fallbacks e edge cases

| Cenário | Comportamento |
|---------|---------------|
| Nenhum item equipado | Base skin + gradient background |
| Asset não encontrado (404) | Layer não renderiza (null) — preserva via `AvatarLayer` com error state |
| Outfit equipado mas asset não existe | Fallback para base skin (body mostra avatar-base ao invés de outfit) |
| Frame equipado | CSS border-image ao redor do container, z:10 |
| Pet em sm/md | PNG estático (sem APNG) |
| Gender variant sem asset de head | Head não renderiza (slot vazio visual) |

---

## Componentes propostos

| Componente | Responsabilidade |
|-----------|-----------------|
| `AvatarDisplay` | Componente público. Recebe `equipped`, `avatarBase`, `size`. Compõe a árvore completa. |
| `CharacterRoot` | motion.div interno. Agrupa body + head + hand. Aplica global animation. |
| `AvatarLayer` | img wrapper com error handling. Retorna null se src inválido/404. Já existe. |
| `FrameDecoration` | CSS border-image/SVG wrapper. Renderizado condicionalmente quando frame equipado. |

**Não criar**: componentes separados por slot (HeadLayer, HandLayer, etc.). Cada slot é simplesmente um `AvatarLayer` posicionado por anchor profile dentro do `CharacterRoot`. A distinção é data (anchor + resolver), não componente.

---

## Interface do componente (sem mudanças externas)

```typescript
interface AvatarDisplayProps {
  equipped: EquippedMap;           // Partial<Record<ItemSlot, EquippedItem>>
  avatarBase?: "male" | "female";  // default: "male"
  size?: "sm" | "md" | "lg" | "xl"; // default: "lg"
}
```

**Todos os call sites continuam funcionando sem modificação.** A reestruturação é interna — mesma interface, mesmo output visual (exceto que agora head/hand acompanham o breathing corretamente).
