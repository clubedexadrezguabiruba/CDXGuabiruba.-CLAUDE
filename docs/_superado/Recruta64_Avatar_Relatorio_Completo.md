# Relatório Completo — Sistema Avatar Recruta 64

## Contexto
Este documento registra todo o processo, decisões, lições aprendidas e pipeline de produção do sistema de avatar do Recruta 64. Serve como referência para futuras sessões de ajuste de arte, novos itens vestíveis e onboarding de artistas/AIs.

---

## 1. Arquitetura do Avatar

### Stack de camadas (z-index)
O avatar é renderizado como uma pilha de imagens absolutas dentro de um container com ratio 5:7:

| Z | Camada | O que é | Status |
|---|--------|---------|--------|
| 0 | **Background** | Cenário (sala de aula, castelo, etc.) | Funcional |
| 1 | **Base** | Corpo do personagem (male/female) | Funcional |
| 2 | **Outfit** | Roupa/armadura vestida | **Pendente** — body-swap não funciona com AI |
| 3 | **Hand** | Item na mão (escudo, espada, livro) | Funcional |
| 4 | **Head** | Cabeça inteira redesenhada com item | Funcional (male + female) |
| 5 | **Pet** | Companion ao lado da perna | Funcional + APNG animado |

### Tamanhos responsivos (SIZE_CONFIG)
```
sm: 56×78    (petSize: 24)   — thumbnails, ranking
md: 100×140  (petSize: 40)   — cards, listas
lg: 200×280  (petSize: 80)   — perfil mobile
xl: 340×476  (petSize: 110)  — perfil desktop
```

### Gênero
- Dois avatares base: `avatar-base-male.png` (400×600) e `avatar-base-female.png` (400×600)
- Usuário escolhe na tela `/criar-personagem` (pós-registro)
- Head slot tem variantes por gênero: `[slug].png` (male), `[slug]-swap-female.png` (female)
- Hand e Pet: mesmos assets para ambos os gêneros
- Posicionamento do head difere por gênero (valores diferentes no código)

### Animações — Duas técnicas combinadas

O avatar usa **duas abordagens diferentes** de animação simultaneamente:

#### Técnica 1: Framer Motion (CSS transforms) — Avatar + Itens
Biblioteca `motion/react` aplica transforms CSS (rotate, scaleY) em cada camada. Ativada apenas em **lg/xl** (perfil) via flag `animated = size === "lg" || size === "xl"`.

**Como funciona**: Cada camada usa `<motion.img>` ou `<motion.div>` com props `animate` + `transition`. O Framer Motion interpola os valores em loop infinito. Apenas **move/rotaciona/escala a imagem inteira** — não pode mover partes individuais.

| Camada | Animação | Valores | Duração | Transform Origin | Efeito |
|--------|----------|---------|---------|-----------------|--------|
| **Base** (z:1) | Breathing + sway | scaleY: [1, 1.004, 1], rotate: [-0.3°, 0.3°] | 4s | bottom center | Corpo sobe/desce e balança dos pés |
| **Hand** (z:3) | Waving | rotate: [-2°, 2°, -2°] | 3s | top center | Braço oscila do ombro |
| **Head** (z:4) | Tilt | rotate: [-0.5°, 0.5°, -0.5°] | 3.5s | bottom center | Cabeça inclina do pescoço |
| **Outfit** (z:2) | Nenhuma | — | — | — | Estático |

**Padrão de código** (exemplo base):
```tsx
<motion.img
  src={`/items/base/avatar-base-${avatarBase}.png`}
  style={{ transformOrigin: "bottom center" }}
  {...(animated ? {
    animate: {
      scaleY: [1, 1.004, 1],       // breathing: expande 0.4%
      rotate: [-0.3, 0.3, -0.3],   // sway lateral
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  } : {})}                          // sm/md: sem animação
/>
```

**Detalhes importantes**:
- `transformOrigin` define o pivô da rotação — `bottom center` = balança dos pés, `top center` = do ombro
- Durações DIFERENTES por camada (3s, 3.5s, 4s) criam **dessincronização natural** — evita aspecto robótico
- Valores MUITO SUTIS (0.3°–2°) — se a animação for perceptível conscientemente, está exagerada
- `{...(animated ? {...} : {})}` = spread condicional — zero animação em sm/md

#### Técnica 2: APNG (PNG animado nativo) — Pet
O pet precisa de animações **complexas** (piscar olhos, acenar braço, folha mexendo) que são impossíveis com CSS transforms numa imagem estática. Solução: **APNG** — PNG animado com transparência alpha real, renderizado nativamente pelo browser sem JavaScript extra.

```tsx
<img
  src={animated
    ? equipped.pet.image_url?.replace(/\.png$/, "-animated.png")  // APNG
    : equipped.pet.image_url}                                      // estático
  className="h-full w-full object-contain"
/>
```

**Por que APNG e não Framer Motion para o pet?**

| Aspecto | Framer Motion (CSS) | APNG (baked) |
|---------|-------------------|--------------|
| O que anima | Imagem inteira (translate/rotate/scale) | Partes individuais (olhos, braços, folha) |
| Peso | ~0KB (só CSS) | ~3.2MB (97 frames × 240px) |
| Controle | Paramétrico (ajustar valores no código) | Fixo (regravar para mudar) |
| Transparência | N/A (imagem já tem alpha) | Alpha real por frame |
| Ideal para | Breathing, sway, tilt | Piscar, acenar, expressões |
| Produção | Zero arte extra | Pipeline GIF→frames→APNG (seção 4.3) |

**Convenção de arquivos**:
- Estático: `[pet-slug].png` (sm/md)
- Animado: `[pet-slug]-animated.png` (lg/xl)
- Sufixo `-animated.png` adicionado automaticamente pelo código

---

## 2. Posicionamento — Valores Validados

### Base
```
width: w × 0.93, height: h × 0.93
position: bottom-0, center-x (translate-x-1/2)
```
**Motivo**: A 100% a cabeça encostava no teto. 93% cria ~7% de headroom natural.

### Head (head-swap)
```
Male:   top: h×0.095, left: w×0.1,   width: w×0.8,  height: h×0.215
Female: top: h×0.098, left: w×0.039, width: w×0.92, height: h×0.230
```
**Motivo**: Female tem cabelo mais longo, precisa de dimensões maiores.

### Hand
```
Male + Female: top: h×0.32, left: w×0.17, width: w×0.25, height: h×0.25
```

### Pet
```
Male + Female: bottom: h×0.09, right: -w×0.01, size: petSize×1.3
```

### Outfit
```
Atual: top: h×0.28, left: w×0.1, width: w×0.8, height: h×0.55
Status: PENDENTE — body-swap com AI não funciona (proporções não casam)
```

### Frame
```
Status: REMOVIDO — problemas com object-fit/overflow não resolvidos
```

---

## 3. Slots — Abordagens e Lições Aprendidas

### Background ✅
- **Abordagem**: Imagem 400×560 (5:7) que preenche o container
- **Sucesso**: Direto, sem complicações
- **Lição**: O personagem precisa estar ancorado no chão (bottom-0 + 93% scale)

### Head ✅ (head-swap)
- **Abordagem final**: Cabeça INTEIRA redesenhada com o item vestido (não overlay isolado)
- **Tentativas que falharam**:
  1. ❌ Overlay da bandana sobre a cabeça → flutua, não parece vestido
  2. ❌ Bandana posicionada mais baixo → still floating
  3. ❌ Head-swap com pescoço → emenda visível no pescoço
  4. ❌ Gradient alpha no pescoço → artefatos visíveis
- **Solução final**: Head sem pescoço (corte no queixo), 1024×1024, alpha real
- **Problema com processamento**: Remoção de fundo agressiva (threshold simples) danifica pixels dos OLHOS. Solução: flood fill das bordas (8 direções)
- **Problema com checkered**: AI gera "transparência" como xadrez baked nos pixels. Solução: pedir fundo BRANCO SÓLIDO e remover no processamento
- **Cada gênero precisa de sua versão** — posicionamento difere

### Hand ✅
- **Abordagem**: Overlay simples posicionado no braço
- **Ajuste**: Movido para o braço direito do personagem (lado esquerdo da tela)
- **Lição**: Funciona bem para itens pequenos (escudo, espada)

### Outfit ❌ (pendente)
- **Tentativas que falharam**:
  1. ❌ Overlay do colete sobre o torso → não alinha com o corpo
  2. ❌ Body-swap (corpo inteiro sem cabeça) → proporções da AI não casam com a base
- **Causa raiz**: AI não consegue gerar um corpo que case pixel-a-pixel com a base existente
- **Soluções possíveis para o futuro**:
  - Gerar o personagem INTEIRO (cabeça + corpo) com a roupa, substituindo a base completa
  - Arte feita por humano que copie a base exatamente
  - Aceitar overlay imperfeito como "bom o suficiente"

### Frame ❌ (removido)
- **Tentativas que falharam**:
  1. ❌ object-contain → barras desproporcionais, não preenche a área
  2. ❌ object-fill → estica a imagem mas centralização falha
  3. ❌ Ajustes de overflow/posicionamento → nunca cobre o container corretamente
- **Causa raiz**: Moldura decorativa como `<img>` não funciona bem com CSS object-fit
- **Solução futura**: CSS border-image ou SVG border

### Pet ✅ + Animação APNG
- **Abordagem**: Imagem posicionada ao lado da perna
- **Animação**: GIF gerado por AI de vídeo → processado → convertido para APNG
- **Lição**: GIF não suporta alpha real. APNG sim. Browser renderiza nativamente.

---

## 4. Pipeline de Produção de Assets com AI

### 4.1 Pipeline HEAD (head-swap)

**Entrada**: Avatar base + descrição do item
**Saída**: PNG 1024×1024 com alpha, sem pescoço

**Passo 1 — Prompt para AI de imagem (ChatGPT/Gemini)**:
```
Task: Draw this EXACT character's head wearing [NOME DO ITEM].

CRITICAL — Style matching:
- Match the attached character EXACTLY: same face shape, same eye style,
  same eye color, same skin tone, same hair color, same line weight,
  same outline color (dark brown)
- EYES: NO black eyeliner or thick eyelashes (common AI artifact)
- This head will be placed ON TOP of this character's body

The [ITEM]:
- [DESCREVER: cor, material, como é vestido]

Technical specs:
- Full head (hair + item + face + ears) — NO NECK, cut at jawline
- Canvas: 1024×1024px, WHITE SOLID BACKGROUND (#FFFFFF)
- Head centered, ~60-70% of canvas
- Expression: friendly smile

Reference attached: avatar-base-[male/female].png
```

**Passo 2 — Limpeza do pescoço (se necessário)**:
- Pedir ao Gemini: "Remove the neck from this image, cut cleanly at the jawline"

**Passo 3 — Processamento (Node.js + sharp)**:
```javascript
// Remover fundo branco via flood fill (NÃO threshold simples!)
// Flood fill 8 direções partindo das bordas
// Threshold: r > 230 && neutral (abs(r-g) < 20 && abs(g-b) < 20)
// Resultado: alpha real, olhos preservados
```

**Passo 4 — Validação visual**: Equipar no localhost, verificar:
- [ ] Cabeça proporcional ao corpo
- [ ] Queixo encaixa no pescoço sem gap
- [ ] Item parece vestido, não flutuando
- [ ] Olhos intactos (sem artefatos pretos)
- [ ] Funciona com background equipado

### 4.2 Pipeline HAND

**Entrada**: Arte do item
**Saída**: PNG com fundo transparente

**Processamento**: Mesmo flood fill do head
**Validação**: Verificar que está na posição do braço, tamanho proporcional

### 4.3 Pipeline PET ANIMADO (GIF → APNG)

**Entrada**: Imagem estática do pet com fundo branco
**Saída**: APNG com alpha, 240px, 8fps, ~3MB

**Passo 1 — Prompt para AI de vídeo (Runway/Pika/Kling)**:
```
Animate this character with very subtle, gentle movements.

Style: Very slow, calm, gentle. NOT hyperactive or bouncy.

Sequence (~14-16 seconds, seamless loop):
- Breathing: slow rise and fall (~4 second cycle)
- Blink: ONE natural eye blink at ~4 seconds
- Wave: ONE slow hand wave at ~8 seconds
- Rest of time: just breathing quietly
- Ends in EXACT same pose as start (seamless loop)

What NOT to do: No jumping, no exaggerated movements, no fast motion
Keep white background. Duration: 14-16 seconds. Output: GIF or MP4
```

**Passo 2 — Extrair frames + remover fundo (Node.js + sharp)**:
```javascript
// Para cada frame do GIF:
// 1. sharp(gifPath, { page: i }).ensureAlpha()
// 2. Flood fill 8 direções das bordas (threshold r>230)
// 3. Salvar como PNG individual
```

**Passo 3 — Montar APNG (ffmpeg)**:
```bash
ffmpeg -y -framerate 12 -i frames/frame_%04d.png \
  -vf "fps=8,scale=240:-1" \
  -plays 0 -f apng output-animated.png
```

**Tamanhos de referência**:
| Config | Tamanho | Qualidade |
|--------|---------|-----------|
| 480px, 12fps | ~18MB | Excessivo |
| 240px, 8fps | ~3.2MB | Bom equilíbrio ✅ |
| 160px, 6fps | ~1.5MB | Mínimo aceitável |

---

## 5. Erros Comuns e Como Evitar

| Erro | Causa | Solução |
|------|-------|---------|
| Olhos com artefatos pretos | Threshold simples (r>235) remove pixels claros dos olhos | Usar FLOOD FILL das bordas, nunca threshold global |
| Fundo checkered baked | AI interpreta "transparent" como xadrez cinza/branco | Sempre pedir WHITE SOLID BACKGROUND no prompt |
| Pescoço duplicado | Head-swap inclui pescoço que conflita com base | Cortar na linha do queixo (usar Gemini para remover) |
| Item flutua sobre o personagem | Overlay isolado não integra com o corpo | Abordagem head-swap (redesenhar toda a cabeça com item) |
| GIF com fundo branco | GIF não suporta alpha real (1-bit apenas) | Converter para APNG via flood fill + ffmpeg |
| mix-blend-mode:multiply | Tenta "esconder" fundo branco via CSS | NÃO FUNCIONA — sempre processar o alpha real |
| Proporções da AI não casam | AI gera corpo/cabeça com proporções diferentes | Sempre anexar avatar-base como referência + enfatizar EXACT match |
| object-fill no frame | Frame não preenche área corretamente | Slot frame removido — usar CSS border-image no futuro |

---

## 6. Ferramentas Utilizadas

| Ferramenta | Uso |
|-----------|-----|
| **ChatGPT (DALL-E)** | Gerar head-swap, pets, items |
| **Gemini** | Remover pescoço, limpar fundo, regenerar com referência |
| **Runway/Pika/Kling** | Animar pet (imagem estática → vídeo/GIF) |
| **Node.js + sharp** | Processamento de imagem: resize, flood fill bg removal, crop |
| **ffmpeg** | Montar APNG a partir de frames PNG individuais |
| **v0.app** | UI/layout (mencionado no workflow do usuário) |

---

## 7. Arquivos-Chave

| Arquivo | Propósito |
|---------|-----------|
| `src/components/avatar/AvatarDisplay.tsx` | Componente principal — renderiza todas as camadas |
| `docs/Recruta64_Avatar_Art_Guide.md` | Guia técnico de arte com valores, prompts e pipeline |
| `public/items/base/avatar-base-male.png` | Base masculina (400×600) — referência para AI |
| `public/items/base/avatar-base-female.png` | Base feminina (400×600) — referência para AI |
| `public/items/head/bandana-tatica.png` | Head-swap male (1024×1024, sem pescoço) |
| `public/items/head/bandana-tatica-swap-female.png` | Head-swap female |
| `public/items/pet/peaozinho-madeira.png` | Pet estático |
| `public/items/pet/peaozinho-madeira-animated.png` | Pet APNG animado (240px, 8fps, 3.2MB) |
| `supabase/migrations/20260321100000_avatar_base.sql` | Schema: avatar_base, avatar_chosen, RPC |

---

## 8. Próximos Passos

### Pendentes
- [ ] **Outfit**: Definir abordagem viável (full-body replacement? overlay aceito? arte humana?)
- [ ] **Frame**: Reimplementar com CSS border-image ou SVG (se desejado)
- [ ] **Mais head items**: Usar pipeline validado para gerar elmo, coroa, capuz etc.
- [ ] **Mais pets**: Gerar + animar usando pipeline APNG
- [ ] **Pet female**: Validar posicionamento do pet animado com avatar feminino
- [ ] **Otimizar APNG**: Testar 160px/6fps para mobile (reduzir de 3.2MB para ~1.5MB)
- [ ] **Arte profissional**: Substituir placeholders por arte feita por artista humano

### Decisões em aberto
- Outfit: body-swap não funciona com AI → precisa de decisão sobre abordagem alternativa
- Frame: removido → vale a pena reimplementar?
- Animação do avatar base: apenas CSS breathing/sway, ou também APNG como o pet?
