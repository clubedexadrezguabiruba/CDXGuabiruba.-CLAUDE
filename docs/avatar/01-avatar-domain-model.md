# 01 — Modelo de Domínio do Avatar

Este documento define os conceitos fundamentais do sistema de avatar.
Cada conceito é descrito com precisão suficiente para guiar implementação, criação de assets e comunicação entre subsistemas.

---

## Diagrama de relações

```
body_family (ex: "recruta_v1")
  ├── gender_variant: "male" | "female"
  │     └── base_skin (imagem do corpo nu/default)
  ├── anchor_profile (por slot + gender_variant)
  │     └── { top, left, width, height, origin }
  └── slot_config (por slot)
        └── render_mode (ex: dressed_base, head_swap) + animation_mode

item (ex: "Bandana Tática")
  ├── slot: "head"
  ├── rarity: "rare"
  └── item_asset (resolvido em runtime)
        ├── variante male: bandana-tatica-swap-male.png
        └── variante female: bandana-tatica-swap-female.png

user
  ├── avatar_base: "male" (gender_variant escolhido)
  ├── user_inventory: [item_ids que possui]
  └── user_equipped: { slot → item_id }
        └── renderizado via: body_family + anchor_profile + render_mode
```

---

## Conceitos

### body_family

**O que é**: Um template canônico de personagem que define proporções, pose, canvas e regiões de slot. Tudo que define "como este tipo de avatar é montado".

**Exemplo atual**: `"recruta_v1"` — o único body_family existente. Personagem cartoon estilo storybook, contornos marrom-escuro, flat colors, pose frontal, canvas 5:7.

**O que contém**:
- Canvas mestre (400×560px, ratio 5:7)
- Ground line (posição dos pés)
- Anchor profiles para cada slot × gender_variant
- Render mode de cada slot
- Base skins por gender_variant

**Por que existe**: Isola todas as decisões de posicionamento e proporção em uma unidade coerente. Quando um novo item é criado, ele é criado *para* um body_family específico. Quando o renderer compõe o avatar, ele consulta o body_family para saber onde posicionar cada slot.

**Onde vive**: Config TypeScript em `src/lib/avatar/bodyFamilies.ts`. Não é tabela DB — não há variação por usuário, apenas por deploy de código.

**Futuro**: Se algum dia houver um segundo estilo de personagem (chibi, realista), será um novo body_family com seus próprios anchors, bases e specs. O renderer é genérico.

---

### gender_variant

**O que é**: Variação visual dentro de um body_family. Atualmente `"male" | "female"`.

**O que muda entre variantes**:
- Base skin (corpo diferente)
- Anchor profiles de head (posição/tamanho diferem — female tem cabelo mais longo)
- Assets de head (cada item de head tem versão male e female)
- Assets de outfit (full-body swap é por gênero)

**O que NÃO muda**:
- Canvas (mesmo 400×560)
- Anchor profiles de hand, pet (mesma posição para ambos)
- Items de hand, background, pet (mesmos assets)
- Frame (mesmo CSS)

**Onde vive**: `users.avatar_base` no DB. Usado como discriminador pelo asset resolver e pelo renderer para selecionar anchors e variantes corretos.

---

### slot

**O que é**: Uma posição lógica no avatar onde um item pode ser equipado. Exatamente um item por slot por vez.

**Slots existentes (6)**:

| Slot | Descrição | render_mode | Tem variante de gênero? |
|------|-----------|-------------|------------------------|
| `background` | Cenário atrás do personagem | `underlay` | Não |
| `outfit` | Roupa/armadura — mesmo corpo vestido | `dressed_base` | Sim (male/female) |
| `hand` | Item segurado na mão | `overlay` | Não |
| `head` | Cabeça redesenhada com acessório | `head_swap` | Sim (male/female) |
| `pet` | Companion ao lado do personagem | `companion` | Não |
| `frame` | Moldura decorativa ao redor do avatar | `frame_ui` | Não |

**Invariante**: Um slot tem exatamente um render_mode. O render_mode é propriedade do slot, não do item. Todos os items de `head` são renderizados como `head_swap`.

---

### render_mode

**O que é**: A estratégia de composição visual de um slot. Define *como* o asset é colocado no avatar.

#### `underlay`
- **Usado por**: background
- **Comportamento**: Imagem preenche o canvas inteiro (inset-0). Renderizada atrás de tudo (z:0). Fora do character root.
- **Sem anchor profile** — sempre preenche o container.

#### `dressed_base`
- **Usado por**: outfit
- **Comportamento**: Quando equipado, substitui a base skin inteira. O asset é o MESMO personagem, na MESMA pose e proporções, vestindo a roupa. Renderizado na posição da base (z:1, bottom-anchored). Dentro do character root.
- **Por que não overlay**: AI não consegue gerar overlay de roupa que case pixel-a-pixel com o corpo base. Full-body replacement é confiável.
- **Variantes**: Requer versão male e female (`{slug}-male.png`, `{slug}-female.png`).

**Invariantes obrigatórias de dressed_base** (o que um outfit NÃO pode fazer):

| Invariante | Motivo |
|------------|--------|
| Mesma pose que base_skin (frontal, braços relaxados) | Head e hand dependem da pose para encaixar |
| Mesmas proporções corporais (altura, largura, membros) | Anchor profiles de head e hand são fixos |
| Mesma posição dos pés (touching bottom edge) | Bottom-anchor do renderer assume isso |
| Head region intacta (pescoço visível, sem gola alta cobrindo queixo) | head_swap precisa da emenda no queixo |
| Hand region intacta (braço direito visível e acessível) | overlay de hand precisa do braço |
| Mesmo estilo visual (traço, contorno, flat colors) | Coerência visual com head/hand/pet |

**O outfit NÃO é**: um personagem novo, uma pose diferente, proporções alteradas, ou um estilo visual divergente. É a mesma base_skin com roupa.

#### `head_swap`
- **Usado por**: head
- **Comportamento**: Substitui a região da cabeça. Asset é a cabeça inteira redesenhada com o acessório (sem pescoço, corte no queixo). Posicionado pelo anchor profile de head. Renderizado sobre o corpo (z:4). Dentro do character root.
- **Variantes**: Requer versão male e female (`{slug}-swap-male.png`, `{slug}-swap-female.png`).

#### `overlay`
- **Usado por**: hand
- **Comportamento**: Imagem sobreposta ao corpo na posição definida pelo anchor profile. Renderizado sobre o corpo (z:3). Dentro do character root.
- **Sem variantes de gênero** — mesmo asset para ambos.

#### `companion`
- **Usado por**: pet
- **Comportamento**: Posicionado próximo ao personagem mas fora do character root motion group. Tem posicionamento próprio (bottom-right). Renderizado com z:5.
- **Variantes de tamanho**: Static PNG em sm/md, APNG animado em lg/xl.
- **Sem variante de gênero** — mesmo asset e posição.

#### `frame_ui`
- **Usado por**: frame
- **Comportamento**: Não é camada de imagem. Renderizado como CSS `border-image`, `box-shadow`, ou SVG wrapper ao redor do container do avatar. Fora do render stack de imagens.
- **Sem anchor profile** — envolve o container inteiro.

---

### anchor_profile

**O que é**: Coordenadas normalizadas (0–1, relativas ao canvas) que definem onde o conteúdo de um slot é renderizado dentro de um body_family + gender_variant.

**Estrutura**:
```
{
  top: number     // fração da altura do canvas (0 = topo, 1 = base)
  left: number    // fração da largura do canvas (0 = esquerda, 1 = direita)
  width: number   // fração da largura do canvas
  height: number  // fração da altura do canvas
  origin: string  // CSS transform-origin para animação (ex: "bottom center")
}
```

**Quem tem anchor profile**:
- `head` — sim, difere por gender_variant
- `hand` — sim, igual para ambos os gêneros
- `background` — não (preenche tudo)
- `outfit` — não (usa posição da base)
- `pet` — posicionamento especial (bottom/right, não top/left/width/height)
- `frame` — não (CSS, fora do canvas)

**Valores atuais de recruta_v1** (extraídos de AvatarDisplay.tsx):

| Slot | Gender | top | left | width | height | origin |
|------|--------|-----|------|-------|--------|--------|
| head | male | 0.095 | 0.1 | 0.8 | 0.215 | bottom center |
| head | female | 0.098 | 0.039 | 0.92 | 0.230 | bottom center |
| hand | ambos | 0.32 | 0.17 | 0.25 | 0.25 | top center |

**Princípio**: O item é desenhado para caber na região definida pelo anchor profile. O renderer posiciona a região; o asset preenche a região. Não há ajuste manual por item.

---

### item_asset

**O que é**: O arquivo de imagem concreto associado a um item, potencialmente em múltiplas variantes.

**Variantes existentes**:

| Tipo de variante | Slots afetados | Convenção de nome | Exemplo |
|-----------------|----------------|-------------------|---------|
| Gender (male) | head, outfit | `{slug}-swap-male.png` / `{slug}-male.png` | `bandana-tatica-swap-male.png` |
| Gender (female) | head, outfit | `{slug}-swap-female.png` / `{slug}-female.png` | `bandana-tatica-swap-female.png` |
| Animated | pet | `{slug}-animated.png` | `peaozinho-madeira-animated.png` |
| Default | hand, background, frame | `{slug}.png` | `peao-madeira.png` |

**Resolução**: Uma função pura `resolveAssetUrl(baseUrl, gender, renderMode, animated)` determina o URL correto. Não há tabela DB de variantes — as regras são poucas e determinísticas.

**Onde vivem os arquivos**: `public/items/{slot}/{slug}.png` e variantes. Servidos como static files pelo Next.js.

---

### base_skin

**O que é**: A imagem padrão do corpo do personagem quando nenhum outfit está equipado. Existe uma por gender_variant por body_family.

**Arquivos atuais**:
- `public/items/base/avatar-base-male.png` (400×600px)
- `public/items/base/avatar-base-female.png` (400×600px)

**Comportamento**: Sempre renderizada na camada z:1. Quando um outfit (base_swap) está equipado, a base_skin é substituída pelo asset do outfit. A lógica é mutuamente exclusiva — nunca renderizam simultaneamente.

---

### animation_mode

**O que é**: A estratégia de animação aplicada a uma camada do avatar.

#### `global` (character root)
- Aplicada ao container que agrupa base + head + hand + outfit
- Efeito: breathing (scaleY ±0.4%) + sway lateral (rotate ±0.3°)
- Duração: 4s, loop infinito
- Todos os filhos herdam via composição de CSS transforms
- Ativa apenas em `lg` e `xl`

#### `local` (camadas individuais)
- Aplicada a camadas dentro do character root
- Efeito **aditivo** ao global — head tilt (±0.5°, 3.5s), hand swing (±2°, 3s)
- Durações diferentes por camada criam dessincronização natural
- Ativa apenas em `lg` e `xl`

#### `baked` (APNG)
- Usada apenas pelo pet
- Animação embutida no arquivo de imagem (APNG com alpha)
- Sem Framer Motion — browser renderiza nativamente
- Ativa apenas em `lg` e `xl` (sm/md usam PNG estático)

#### `none`
- Background, outfit, frame — sem animação própria
- Background: estático
- Outfit: herda global (é filho do character root)
- Frame: CSS, sem animação (ou animação CSS separada, se desejado)

---

### compatibility_rule

**O que é**: Regra que determina se um item é compatível com um body_family.

**Estado atual**: Todos os 47 items são compatíveis com o único body_family (`recruta_v1`). Não há restrição de compatibilidade.

**Regra futura (quando houver múltiplos body_families)**:
- Item pode ter campo opcional `body_family` na tabela `items`
- Se `NULL`, compatível com todos
- Se preenchido, só compatível com aquele body_family
- `equip_item` RPC validaria compatibilidade

**Decisão**: Não implementar agora. YAGNI. Quando surgir o segundo body_family, adicionar a coluna e a validação.

---

## Glossário rápido

| Conceito | Uma frase |
|----------|-----------|
| body_family | Template canônico que define canvas, pose, anchors e render modes |
| gender_variant | male/female dentro de um body_family |
| slot | Posição lógica no avatar (6 slots fixos) |
| render_mode | Como o slot é composto visualmente (underlay, dressed_base, head_swap, overlay, companion, frame_ui) |
| anchor_profile | Coordenadas normalizadas de posição/tamanho de um slot no canvas |
| item_asset | Arquivo de imagem concreto, com possíveis variantes por gênero/animação |
| base_skin | Imagem do corpo padrão (sem outfit) |
| animation_mode | Estratégia de animação: global, local, baked, none |
| compatibility_rule | Restrição de item por body_family (futuro, não implementado) |
