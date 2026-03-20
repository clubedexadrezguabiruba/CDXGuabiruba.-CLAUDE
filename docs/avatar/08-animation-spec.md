# 08 — Especificação de Animação

Este documento define a especificação completa de animação do sistema de avatar. Todas as amplitudes, durações e regras são valores canônicos — não devem ser alterados sem teste visual.

---

## Arquitetura de motion

```
avatar-container (estático)
  │
  ├── background (z:0) .................. nenhuma animação
  │
  ├── character-root (z:1) .............. GLOBAL: breathing + sway
  │   ├── body .......................... herda global (sem local)
  │   ├── hand-anchor ................... herda global + LOCAL: swing
  │   └── head-anchor ................... herda global + LOCAL: tilt
  │
  ├── pet-anchor (z:5) .................. BAKED: APNG nativo
  │
  └── frame (z:10) ...................... nenhuma (ou CSS glow)
```

### Três modos de animação

| Modo | Tecnologia | Onde se aplica | Controle |
|------|-----------|----------------|----------|
| **Global** | Framer Motion (`motion.div`) | character-root | Paramétrico (valores no código) |
| **Local** | Framer Motion (`motion.div`) | head-anchor, hand-anchor | Paramétrico, aditivo ao global |
| **Baked** | APNG nativo (browser) | pet | Fixo (gravado no arquivo) |

---

## Motion global (character-root)

Aplicada ao `<motion.div>` que agrupa body + head + hand. Todos os filhos herdam via CSS transform composition.

| Propriedade | Valor |
|-------------|-------|
| Transforms | `scaleY: [1, 1.004, 1]` + `rotate: [-0.3, 0.3, -0.3]` (graus) |
| Duração | 4 segundos |
| Easing | `easeInOut` |
| Repeat | `Infinity` |
| Transform origin | `bottom center` |
| Condição | `size === "lg" \|\| size === "xl"` |

### Efeito visual

- **Breathing**: scaleY de ±0.4% simula respiração — o corpo sobe/desce imperceptivelmente
- **Sway**: rotate de ±0.3° simula balanço natural — o corpo oscila lateralmente dos pés
- **Combinação**: O personagem parece vivo e parado, não estático nem hiperativo

### Por que bottom center

O transform origin `bottom center` faz o personagem pivotar dos pés. Sem isso, o personagem pivotaria do centro e os pés sairiam do chão — quebrando a ancoragem visual.

---

## Motion local: hand (swing)

Aplicada ao `<motion.div>` hand-anchor, que é filho de character-root.

| Propriedade | Valor |
|-------------|-------|
| Transform | `rotate: [-2, 2, -2]` (graus) |
| Duração | 3 segundos |
| Easing | `easeInOut` |
| Repeat | `Infinity` |
| Transform origin | `top center` |
| Condição | `size === "lg" \|\| size === "xl"` |

### Efeito visual

- O braço/mão oscila ±2° do ombro (top center)
- **Aditivo**: Este rotate é composto com o rotate global do character-root
- O browser calcula: `transform(parent) * transform(child)` → o braço acompanha o breathing E faz seu próprio swing

### Por que top center

O braço pivota do ombro (topo). Se fosse `center`, o item rotacionaria do meio — pareceria solto.

---

## Motion local: head (tilt)

Aplicada ao `<motion.div>` head-anchor, que é filho de character-root.

| Propriedade | Valor |
|-------------|-------|
| Transform | `rotate: [-0.5, 0.5, -0.5]` (graus) |
| Duração | 3.5 segundos |
| Easing | `easeInOut` |
| Repeat | `Infinity` |
| Transform origin | `bottom center` |
| Condição | `size === "lg" \|\| size === "xl"` |

### Efeito visual

- A cabeça inclina ±0.5° do pescoço (bottom center)
- Muito sutil — quase imperceptível conscientemente, mas dá vida ao personagem
- **Aditivo**: Composto com breathing global

### Por que bottom center

A cabeça pivota do pescoço (base da cabeça). Se fosse `center`, a cabeça rotacionaria do nariz — não parece natural.

---

## Dessincronização intencional

| Layer | Duração |
|-------|---------|
| character-root (global) | 4.0s |
| head (local) | 3.5s |
| hand (local) | 3.0s |

As três durações são intencionalmente DIFERENTES e não-múltiplas entre si. Isso cria um padrão de movimento que nunca se repete exatamente da mesma forma — evitando o aspecto mecânico de "loop óbvio".

Se todas fossem 4s, respiração + tilt + swing sincronizariam e o personagem pareceria um robô pulsando.

**Regra**: Ao ajustar durações, nunca usar valores múltiplos entre si (ex: 2s, 4s, 8s).

---

## Animação baked: pet (APNG)

| Propriedade | Valor |
|-------------|-------|
| Formato | APNG (PNG animado com alpha real) |
| Resolução | 240px width |
| Frame rate | 8 fps |
| Duração do ciclo | 10-16 segundos |
| Loop | Infinito (nativo do browser) |
| Tecnologia | `<img src="...animated.png">` — zero JavaScript |

### Conteúdo da animação

Sequência sugerida dentro de um ciclo:
1. **Breathing** (0-4s): Subida/descida lenta do corpo
2. **Blink** (~4s): Um piscar natural dos olhos
3. **Action** (~8s): Um aceno, gesto ou movimento temático
4. **Rest** (10-16s): Volta à pose inicial, apenas breathing

### Por que APNG e não Framer Motion para o pet

| Aspecto | Framer Motion | APNG |
|---------|--------------|------|
| Pode mover partes individuais (olhos, braço) | Não — move a imagem inteira | Sim — cada frame é livre |
| Peso | ~0 KB | ~3 MB |
| Controle paramétrico | Sim | Não |
| Transparência | N/A | Alpha real por frame |

O pet precisa de animações complexas (piscar, acenar) impossíveis com CSS transforms numa imagem estática. APNG é a solução correta.

### Por que pet está FORA do character-root

Se estivesse dentro, herdaria o breathing global — o pet respiraria no ritmo do personagem. Visualmente errado: o pet é um ser independente com seu próprio ritmo.

---

## Comportamento por viewport

| Size | Dimensão | Animações ativas |
|------|----------|-----------------|
| sm | 56×78 | Nenhuma — tudo estático |
| md | 100×140 | Nenhuma — tudo estático |
| lg | 200×280 | Global + local + pet APNG |
| xl | 340×476 | Global + local + pet APNG |

### Por que sm/md são estáticos

- **Performance**: Avatares em listas (ranking, leaderboard) podem ter 10-50 instâncias visíveis. Animar todos seria pesado.
- **Legibilidade**: Em 56×78px, animações de 0.3° são invisíveis. Sem benefício visual.
- **Pet**: APNG em sm/md seria ~3MB por avatar. Em uma lista de 20 jogadores = 60MB de APNG. Inaceitável.

### Implementação

```typescript
const animated = size === "lg" || size === "xl";

// Character root: spread condicional
<motion.div {...(animated ? { animate: {...}, transition: {...} } : {})}>

// Pet: src condicional
<img src={animated ? slug + "-animated.png" : slug + ".png"} />
```

---

## O que o sistema NÃO faz

| Capacidade | Status | Motivo |
|-----------|--------|--------|
| Rig de esqueleto (skeletal animation) | Não implementado | Complexidade excessiva para benefício marginal. CSS transforms + APNG cobrem as necessidades |
| Animação de transição (equip/unequip) | Não implementado | Escopo futuro; swap é instantâneo |
| Animações interativas (hover/click) | Não implementado | Avatar é display-only, não interativo |
| Particles/effects (brilho, aura) | Não implementado | Pode ser adicionado via CSS/canvas sem mudar a arquitetura |
| Animação do body (APNG para o personagem inteiro) | Não implementado | CSS breathing é suficiente e muito mais leve |

**Princípio**: O sistema simula vida com transforms CSS mínimos + APNG para o pet. Não tenta ser um engine de animação. A prioridade é performance e consistência, não realismo.

---

## Performance budget: pet APNG

Este budget é contrato, não recomendação. Assets que excedem os limites devem ser reprocessados ou reprovados.

### Limites

| Parâmetro | Alvo | Máximo absoluto | Se exceder |
|-----------|------|-----------------|-----------|
| File size | ~3 MB | 5 MB | Reduzir resolução ou fps |
| Resolução | 240px width | 320px | Re-encode com scale menor |
| Frame rate | 8 fps | 12 fps | Re-encode com fps menor |
| Duração do ciclo | 12-14s | 16s | Cortar frames, manter loop |

### Fallback estático

O pet APNG só é carregado em `lg` e `xl` (perfil). Em `sm` e `md`, o browser carrega o PNG estático (~50-100KB). Isso significa:

- **Ranking com 20 avatares**: 20 × ~80KB = ~1.6MB (estático). Aceitável.
- **Perfil com 1 avatar**: 1 × ~3MB (APNG). Aceitável.
- **Nunca**: APNG em lista. 20 × 3MB = 60MB. Inaceitável.

### Loading

- APNG carregado via `<img>` nativo — browser gerencia cache
- Sem lazy loading explícito necessário (perfil tem no máximo 1 pet APNG)
- Se futuro size `2xl` surgir, APNG continua aceitável (1 instância)

### Condições de reprovação

| Condição | Ação |
|----------|------|
| File > 5MB | Re-encode: reduzir para 200px width e/ou 6fps |
| File > 5MB após re-encode | Reprovar animação, usar apenas estático |
| Loop não é seamless | Reprovar, regenerar com AI de vídeo |
| Movimentos excessivos/rápidos | Reprovar, regenerar com prompt mais restritivo |
| Alpha quebrado em qualquer frame | Reprocessar flood fill em todos os frames |

---

## Limites absolutos

Valores que não devem ser excedidos sob nenhuma circunstância:

| Parâmetro | Limite máximo | Motivo |
|-----------|--------------|--------|
| Rotate global | ±1° | Acima disso o personagem "dança" |
| ScaleY global | ±1% | Acima disso parece pulsação |
| Rotate hand | ±5° | Acima disso o item parece solto |
| Rotate head | ±2° | Acima disso parece negação |
| Duração mínima | 2s | Abaixo é rápido demais |
| Duração máxima | 8s | Acima perde a sensação de "vivo" |
| APNG file size | 5MB | Acima impacta loading (ver budget acima) |

---

## Resumo de valores canônicos

| Layer | Transform | Valores | Duração | Origin | Easing |
|-------|-----------|---------|---------|--------|--------|
| character-root | scaleY + rotate | [1, 1.004, 1] + [-0.3°, 0.3°, -0.3°] | 4s | bottom center | easeInOut |
| hand (prop) | (herda global) | — | — | — | — |
| head | rotate | [-0.5°, 0.5°, -0.5°] | 3.5s | bottom center | easeInOut |
| pet | baked (APNG) | 240px, 8fps | 10-16s ciclo | — | — |
| body | (herda global) | — | — | — | — |
| background | nenhuma | — | — | — | — |
| frame | nenhuma | — | — | — | — |

> **Hand/prop sem motion local**: Removido porque a base tem braços relaxados — swing local fazia o item parecer adesivo flutuante. Props herdam apenas o breathing global. Motion local para held_prop poderá ser reintroduzida quando existir pose variant `grip`.
