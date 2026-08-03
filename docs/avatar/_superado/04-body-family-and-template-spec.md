# 04 — Body Family & Template Spec

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

Este documento define a base canônica do avatar, as regiões de slot, e as especificações estruturais que assets devem seguir para funcionar sem ajuste manual no frontend.

> **Escopo**: Este documento é fundacional — define *o que* um asset deve ser. Prompts de geração AI, pipelines de processamento (flood fill, ffmpeg), erros comuns e checklists de validação detalhados serão documentados em docs operacionais separados.

---

## recruta_v1 — o body family atual

### Canvas: produção vs runtime

O sistema distingue dois níveis de canvas:

| Nível | Propósito | Dimensão (avatar scene) | Dimensão (body) |
|-------|-----------|------------------------|-----------------|
| **Production master** | Geração, processamento, arquivo de qualidade | 800 × 1120 px | 800 × 1200 px |
| **Runtime export** | O que é servido ao browser e renderizado | 400 × 560 px | 400 × 600 px |

**Por que separar**:
- **Qualidade retina**: O maior render runtime é xl (340×476). A 400px de largura, há apenas 1.17× de margem. A 800px, há 2.35× — suficiente para telas HiDPI.
- **Processamento sem perda**: Flood fill, crop e resize são operações lossy. Começar de 2× preserva detalhes.
- **Re-export sem regeneração**: Se o runtime canvas mudar (ex: novo size `2xl`), basta re-exportar do master sem regenerar com AI.
- **Consistência**: Head (1024×1024) e pet (1024×1024) já são produzidos a 2×+. Body e background a 1× eram inconsistentes.

**Assets existentes a 1× continuam válidos.** 2× é recomendação para novos assets, não requerimento retroativo.

**Aspect ratio**: Sempre 5:7. Tanto production master (800×1120) quanto runtime export (400×560) preservam o ratio.

### Canvas runtime (referência do renderer)

```
┌──────────────────────────────────┐
│          400 × 560 px            │
│          ratio 5:7               │
│                                  │
│    Headroom (7% topo)            │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   Personagem (93% h)       │  │
│  │   Centrado horizontalmente │  │
│  │   Ancorado no bottom       │  │
│  │                            │  │
│  │                            │  │
│  │                            │  │
│  └────────────────────────────┘  │
│    Ground line: y = 532px        │
└──────────────────────────────────┘
```

| Propriedade | Valor (runtime) | Valor (production) |
|-------------|-----------------|-------------------|
| Canvas | 400 × 560 px | 800 × 1120 px |
| Aspect ratio | 5:7 | 5:7 |
| Body region | 93% do canvas, bottom-anchored, center-x | Idem (proporcionalmente) |
| Ground line | y = 532 (95% da altura) | y = 1064 |
| Headroom | ~7% topo (39px) | ~7% (78px) |
| Estilo | Cartoon storybook, contornos marrom-escuro (#3d2b1f), flat colors | Idem |
| Pose | Frontal, levemente angled, braços relaxados | Idem |

### Base skins

| Gender | Arquivo | Dimensão atual | Production master recomendado |
|--------|---------|---------------|------------------------------|
| male | `public/items/base/avatar-base-male.png` | 400×600 | 800×1200 |
| female | `public/items/base/avatar-base-female.png` | 400×600 | 800×1200 |

**Por que body é 400×600 (runtime) e não 400×560**: A base é ligeiramente mais alta que o canvas. A renderização a 93% com bottom-anchor faz o personagem "caber" naturalmente, com a cabeça terminando abaixo do topo do canvas.

---

## Slot regions

Cada slot tem uma região no canvas onde seu asset é renderizado. As coordenadas são normalizadas (0–1, relativas ao canvas 400×560).

### Mapa visual das regiões

```
┌────────────────────────────────────┐  0.0
│             BACKGROUND             │
│          (preenche tudo)           │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │ ┌─────────────────────────┐ │  │  ~0.095
│  │ │      HEAD REGION        │ │  │
│  │ │   (cabeça + acessório)  │ │  │
│  │ └─────────────────────────┘ │  │  ~0.31
│  │                             │  │
│  │  ┌──────┐                   │  │  ~0.32
│  │  │ HAND │    BODY           │  │
│  │  │REGION│                   │  │
│  │  └──────┘                   │  │  ~0.57
│  │                             │  │
│  │      CHARACTER ROOT         │  │
│  │   (body + head + hand)      │  │
│  │                             │  │
│  │                             │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                        ┌───────┐  │
│          GROUND LINE   │  PET  │  │  ~0.91
│                        └───────┘  │
│  ┌──────────────────────────────┐ │
│  │           FRAME (CSS)        │ │
│  │    (envolve o container)     │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘  1.0
```

### Anchor profiles — valores canônicos

#### Head

| Gender | top | left | width | height | origin |
|--------|-----|------|-------|--------|--------|
| male | 0.095 | 0.1 | 0.8 | 0.215 | bottom center |
| female | 0.098 | 0.039 | 0.92 | 0.230 | bottom center |

**Por que female é maior**: Cabelo mais longo e volumoso. A região precisa acomodar sem cortar.

**Posição em pixels (canvas 400×560)**:
- Male: top=53px, left=40px, width=320px, height=120px
- Female: top=55px, left=16px, width=368px, height=129px

#### Head Knockout Mask

Quando head está equipado, o body recebe clipPath que recorta a região da cabeça/cabelo, evitando vazamento atrás do head_swap.

| Parâmetro | Male (validado) | Female (validado) | Descrição |
|-----------|----------------|-------------------|-----------|
| `KNOCKOUT_FACTOR_Y` | 0.71 | 0.66 | Fração vertical da head region a recortar do topo |
| `KNOCKOUT_SIDE_SHRINK` | 0.20 | 0.20 | Fração lateral extra a recortar de cada lado |

**Regra**: Valores derivados da head anchor region, aplicados per-gender. Sem head equipado, body aparece completo (sem clipPath).

#### Hand

| Gender | top | left | width | height | origin |
|--------|-----|------|-------|--------|--------|
| ambos | 0.32 | 0.17 | 0.25 | 0.25 | top center |

**Posição em pixels**: top=179px, left=68px, width=100px, height=140px

**Lado**: Braço direito do personagem = lado esquerdo da tela.

#### Pet

| Propriedade | Valor |
|-------------|-------|
| bottom | h × 0.09 |
| right | w × -0.01 |
| size | petSize × 1.3 |

Pet não usa anchor profile padrão (top/left/width/height). Usa bottom/right com tamanho absoluto baseado no petSize do SIZE_CONFIG.

#### Body (base / outfit)

| Propriedade | Valor |
|-------------|-------|
| width | 93% do canvas |
| height | 93% do canvas |
| position | bottom-0, center-x |

Sempre a mesma posição. Base e outfit (dressed_base) compartilham este posicionamento.

---

## Template-space: por que assets "just work" sem ajuste manual

### O princípio

O sistema atual e o novo compartilham o mesmo modelo: **posicionamento é per-slot, nunca per-item**. Todos os head items compartilham a mesma head region. Todos os hand items compartilham a mesma hand region.

A diferença do novo sistema é que formaliza isso:
1. **Anchor profile** define a região do slot (uma vez, per-body_family+gender)
2. **O asset é produzido em template-space** — desenhado para preencher toda a região disponível
3. **O renderer posiciona a região** e o asset preenche via `object-contain`
4. **Nenhum ajuste per-item é necessário** — se o asset preenche o template corretamente, ele encaixa

### Níveis de ajuste

| Nível | Quando acontece | Frequência | Exemplo |
|-------|----------------|------------|---------|
| Per-body_family + gender | Ao definir/ajustar o body_family | Uma vez (+ correções raras) | Head anchor male: top 0.095 |
| Per-slot | Implícito no anchor profile | Nunca separadamente | Todos os head items usam o mesmo anchor |
| **Per-item** | **Nunca** | **Zero** | ❌ Ajustar top/left de "Bandana Tática" individualmente |

### Se um asset não encaixa

A resposta é **corrigir o asset**, não adicionar override no código. Cenários:
- Chapéu muito alto cortado → redesenhar o asset menor dentro do template
- Item desalinhado → reposicionar dentro do canvas do asset
- Proporções erradas → regenerar com referência da base correta

O único caso que justificaria override per-item é se o próprio conceito do item for incompatível com a região (ex: um chapéu que dobra a altura da cabeça). Nesse caso, o item precisa ser redesenhado ou o conceito repensado.

---

## Specs de criação de assets por slot

### Background (underlay)

| Spec | Valor (runtime) | Valor (production) |
|------|-----------------|-------------------|
| Dimensão | 400 × 560 px | 800 × 1120 px |
| Aspect ratio | 5:7 | 5:7 |
| Formato | PNG ou JPEG | PNG |
| Transparência | Não necessária | Não necessária |
| Variante de gênero | Não | Não |

**Conteúdo**: Cenário completo. Chão/piso na parte inferior (ground line ~95%). Céu/teto/interior no topo. O personagem ficará de pé sobre o chão desta imagem.

---

### Base skin / Outfit (dressed_base)

| Spec | Valor (runtime) | Valor (production) |
|------|-----------------|-------------------|
| Dimensão | 400 × 600 px | 800 × 1200 px |
| Formato | PNG com alpha real | PNG com alpha real |
| Conteúdo | Personagem de corpo inteiro, pose frontal canônica | Idem |
| Pés | Tocando a borda inferior da imagem | Idem |
| Centralização | Horizontalmente centrado no canvas | Idem |
| Variante de gênero | Sim — `{slug}-male.png` e `{slug}-female.png` | Idem |

**Invariantes de dressed_base (outfit)**:

O asset de outfit é o MESMO personagem, na MESMA pose, vestindo a roupa. NÃO é um personagem novo.

| Invariante | Motivo |
|------------|--------|
| Mesma pose que base_skin (frontal, braços relaxados) | Head e hand dependem da pose para encaixar |
| Mesmas proporções corporais (altura, largura, membros) | Anchor profiles de head e hand são fixos |
| Mesma posição dos pés (touching bottom edge) | Bottom-anchor do renderer assume isso |
| Head region intacta (pescoço visível, sem gola cobrindo queixo) | head_swap precisa da emenda no queixo |
| Hand region intacta (braço direito visível e acessível) | overlay de hand precisa do braço |
| Mesmo estilo visual (traço, contorno, flat colors) | Coerência visual com head/hand/pet |

**Por que full-body e não overlay**: AI não consegue gerar overlay de roupa que case pixel-a-pixel com proporções da base. Testado com múltiplas abordagens (overlay, body-swap parcial, gradient alpha no pescoço) — todas falham. Dressed_base é a abordagem confiável.

**Naming**:
- Base: `avatar-base-male.png`, `avatar-base-female.png`
- Outfit: `{slug}-male.png`, `{slug}-female.png` (ex: `tunica-azul-male.png`)

---

### Head (head_swap)

| Spec | Valor |
|------|-------|
| Dimensão | 1024 × 1024 px (quadrado) |
| Formato | PNG com alpha real |
| Conteúdo | Cabeça INTEIRA (cabelo + face + acessório) SEM PESCOÇO |
| Corte | Na linha do queixo — sem pescoço, sem gola |
| Centralização | Cabeça centrada no canvas quadrado, ocupando ~60-70% |
| Transparência | Alpha real (processamento via flood fill, não threshold global) |
| Variante de gênero | Sim — `{slug}-swap-male.png` e `{slug}-swap-female.png` |

**Posicionamento pelo renderer**: O renderer escala o 1024×1024 para caber na head region do anchor profile usando `object-contain`. O asset é produzido grande para preservar qualidade.

> Detalhes de processamento (flood fill, erros comuns, pipeline) documentados no playbook operacional.

---

### Hand (overlay)

| Spec | Valor |
|------|-------|
| Dimensão | 512 × 512 px (ou proporcional) |
| Formato | PNG com alpha real |
| Conteúdo | Item isolado (espada, escudo, livro, etc.) |
| Orientação | Como seria segurado na mão direita do personagem |
| Transparência | Alpha real |
| Variante de gênero | Não — mesmo asset para ambos |

**Posicionamento**: O renderer coloca este asset na hand region (100×140px em canvas runtime). O item aparece na mão direita do personagem (lado esquerdo da tela).

---

### Pet (companion)

| Spec | Valor |
|------|-------|
| Dimensão estático | 1024 × 1024 px (quadrado) |
| Dimensão animado | 240px width, aspect ratio preservado |
| Formato estático | PNG com alpha real |
| Formato animado | APNG (PNG animado com alpha real) |
| Conteúdo | Criatura/companion ao lado do personagem |
| Variante de gênero | Não |
| Naming | `{slug}.png` (estático) + `{slug}-animated.png` (APNG) |

**Posicionamento**: Bottom-right do container, colado na perna do personagem. Animado apenas em lg/xl; estático em sm/md.

> Pipeline APNG (extração de frames, flood fill, ffmpeg) documentado no playbook operacional.

---

### Frame (frame_ui)

| Spec | Valor |
|------|-------|
| Formato | PNG para border-image (9-slice) ou SVG |
| Conteúdo | Moldura decorativa com corners e edges |
| Uso | CSS `border-image` ou `box-shadow` |
| Variante de gênero | Não |

**9-slice**: A imagem é dividida em 9 regiões (4 cantos + 4 bordas + centro). CSS `border-image` estica as bordas e repete, preservando os cantos. O centro é transparente.

**Border widths por size**: sm: 2px, md: 3px, lg: 4px, xl: 5px.

**Recomendação**: `border-image` para frames com textura (madeira, ouro). `box-shadow` para frames simples (glow por rarity).

---

## Template guides

Template guides são arquivos visuais (PNG overlay ou Figma) que mostram ao artista/AI onde desenhar. Cada template mostra: contorno do canvas, silhueta do personagem (referência), região do slot ativa, áreas seguras, e ground line.

### Templates necessários

| Template | Conteúdo | Usado para |
|----------|----------|-----------|
| `template-outfit-male` | Silhueta masculina + canvas body | Outfit dressed_base male |
| `template-outfit-female` | Silhueta feminina + canvas body | Outfit dressed_base female |
| `template-head-male` | Rosto masculino + head region + linha de corte queixo | Head-swap male |
| `template-head-female` | Rosto feminino + head region + linha de corte queixo | Head-swap female |
| `template-hand` | Braço do personagem + hand region | Item de mão |
| `template-pet` | Ground line + pet region + escala | Pet |
| `template-background` | Canvas 5:7 + ground line + silhueta (escala) | Cenário |

**Formato e criação** dos templates serão detalhados no playbook operacional.

---

## Versionamento

### Quando criar recruta_v2?

Apenas se as proporções fundamentais mudarem:
- Pose diferente (não mais frontal)
- Proporções corporais diferentes (cabeça maior, corpo mais magro)
- Canvas diferente (não mais 5:7)
- Estilo visual fundamentalmente diferente

### O que NÃO justifica novo body_family

- Novo item em slot existente (usa mesmos anchors)
- Novo cenário (background é genérico)
- Novo pet (companion é independente do body)
- Ajuste fino de anchor (é correção, não versão nova)

### Migração entre versões

Se recruta_v2 existir:
1. Adicionar `users.body_family` coluna (default `'recruta_v1'`)
2. Opcionalmente: `items.body_family` (nullable — null = universal)
3. Renderer consulta body_family do usuário para anchors
4. Items universais funcionam com qualquer body_family
5. Items específicos requerem o body_family correto → `equip_item` valida

---

## Critérios mínimos de aceitação de asset

Regras estruturais que um asset deve cumprir. Checklists detalhados de validação visual (erros comuns, como testar, etc.) serão documentados no playbook operacional.

| Slot | Critérios estruturais |
|------|-----------------------|
| Head | 1024×1024, alpha real, sem pescoço, variantes male+female |
| Outfit | Mesma dimensão que base, mesma pose, mesmas proporções, pés no bottom, variantes male+female, head/hand regions intactas |
| Hand | Alpha real, orientação correta, reconhecível em sm |
| Pet | 1024×1024 estático + 240px APNG animado, alpha real |
| Background | Ratio 5:7 exato, chão sólido no terço inferior |
| Frame | Funciona como CSS border-image (9-slice), centro transparente |

---

## Próximos documentos operacionais

Conteúdos que foram intencionalmente separados deste documento fundacional:

| Documento | Conteúdo |
|-----------|----------|
| `05-asset-generation-playbook.md` | Prompts AI por slot, workflow de geração, ferramentas recomendadas |
| `06-asset-processing-pipeline.md` | Flood fill, sharp, ffmpeg, scripts de processamento, erros comuns e prevenção |
| `07-asset-validation-checklists.md` | Checklists detalhados por slot, testes visuais, critérios de qualidade |
