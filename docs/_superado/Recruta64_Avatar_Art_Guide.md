# Guia Técnico de Arte — Avatar Recruta 64

## 1. Propósito
Referência técnica para produção e ajuste de assets visuais do avatar.
Qualquer decisão de posicionamento, escala ou alinhamento deve ser registrada aqui.

---

## 2. Canvas e Proporções

| Elemento | Dimensão (px) | Ratio | Notas |
|----------|---------------|-------|-------|
| Container (SIZE_CONFIG) | 5:7 (ex: 200×280, 340×476) | 5:7 | Define o espaço visível |
| Avatar base (male/female) | 400×600 | 2:3 | Ligeiramente mais alto que o container |
| Background | 400×560 | 5:7 | Bate exatamente com o container |

### Consequência da diferença de ratio (base vs container)
- A base (2:3) é ~7% mais estreita que o container (5:7) quando escalada por `object-contain`
- Gera ~3.3% de margem horizontal de cada lado — imperceptível visualmente
- A base preenche 100% da altura do container

---

## 3. Decisões de Posicionamento

### 3.1 Alinhamento vertical da base: 93% + bottom anchor
**Decisão:** A imagem base renderiza a **93% do container** e ancorada no fundo (`bottom-0`).

**Motivo:** A base (400×600, 2:3) preenche 100% da altura do container (5:7) com `object-contain`, então `object-bottom` sozinho não cria headroom. Reduzir para 93% cria ~7% de espaço acima da cabeça — simulando pé-direito natural.

**Resultado (validado visualmente):**
- xl (340×476): headroom ~33px — cabeça abaixo das vigas do teto
- lg (200×280): headroom ~20px — proporcional
- Pés sempre tocam o chão do background
- Funciona universalmente para todos os backgrounds futuros

**Código:** `AvatarDisplay.tsx`, img base (sem div wrapper):
```jsx
<img
  src={`/items/base/avatar-base-${avatarBase}.png`}
  alt="Avatar"
  className="absolute bottom-0 left-1/2 -translate-x-1/2 z-1 object-contain"
  style={{ width: cfg.w * 0.93, height: cfg.h * 0.93 }}
/>
```

### 3.2 Posicionamento dos slots (valores atuais)
Todos os valores são proporcionais ao SIZE_CONFIG (w, h):

| Slot | Posição | Tamanho | z-index | Notas |
|------|---------|---------|---------|-------|
| Background | absolute inset-0 | w×h (100%) | 0 | Preenche container exato (5:7) |
| Base | bottom-0, center-x | w×0.93, h×0.93 | 1 | Ancorada no chão, 7% headroom |
| Outfit | top: h×0.28, left: w×0.1 | w×0.8, h×0.55 | 2 | *Pendente ajuste fino* |
| Hand | top: h×0.32, left: w×0.17 | w×0.25, h×0.25 | 3 | Braço direito do personagem (validado male+female) |
| Head | top: h×0.098, left: w×0.039 | w×0.92, h×0.230 | 4 | Head-swap sem pescoço (validado male+female) |
| ~~Frame~~ | — | — | — | **REMOVIDO** — não funciona com object-fit/overflow |
| Pet | bottom: h×0.09, right: -w×0.01 | petSize×1.3 | 5 | Dentro do container, colado na perna direita |

> **Nota:** Valores de outfit/hand/head/frame serão ajustados conforme os assets reais forem validados. Atualizar esta tabela a cada ajuste.

---

## 4. Regras para Produção de Novos Assets

### Background
- **Deve ser 400×560px (5:7)** para preencher o container sem distorção
- O chão/piso deve estar na parte inferior da imagem
- O personagem será ancorado pelos pés — prever espaço para a cabeça no terço superior

### Base (avatar-base-male/female)
- **400×600px (2:3)**
- Personagem de corpo inteiro, centralizado horizontalmente
- Pés próximos à borda inferior (~93-95% da altura)
- Transparência ao redor do personagem

### Itens vestíveis — Regra geral
- Fundo transparente (PNG)
- **TODOS os itens devem ser overlays frontais** — desenhados como se o personagem estivesse de frente para a câmera
- Devem parecer **vestidos/usados**, não objetos soltos sobre o personagem
- Devem alinhar com a anatomia da base quando sobrepostos nos offsets da tabela acima
- Manter estilo: cartoon storybook, contornos marrom-escuro, flat colors

### Head — Abordagem "Head Swap" (cabeça inteira)
**Decisão**: Em vez de sobrepor um item isolado, o asset de head é a **cabeça inteira do personagem redesenhada** já com o item vestido. Isso garante integração perfeita (cabelo + item se mesclam naturalmente).

**Regras de produção:**
- **Desenhar a cabeça completa**: cabelo, rosto, orelhas — com o item vestido
- **SEM PESCOÇO** — cortar na linha do queixo. O pescoço original da base fica visível
- **Dimensão**: 1024×1024px (quadrado), fundo transparente (PNG com alpha real, NÃO checkered)
- A cabeça deve estar **centralizada** e ocupar ~60-70% do canvas
- O rosto mantém a mesma expressão (sorriso amigável) e traços EXATOS do personagem base
- O item deve parecer **naturalmente vestido** (fios de cabelo passando por cima, dobras realistas)
- Estilo: cartoon storybook, contornos marrom-escuro, flat colors — idêntico à base
- **CRÍTICO**: fornecer o avatar-base completo como referência — a AI deve copiar exatamente o estilo, tom de pele, formato dos olhos, espessura do traço
- **Cada variante de avatar base (male/female) precisa de sua versão do head asset**

**Posicionamento no código (validado — male + female):**
```
top: h×0.098, left: w×0.039, width: w×0.92, height: h×0.230
```

**Convenção de arquivos por gênero:**
- Male: `[item-slug].png` (ex: `bandana-tatica.png`) — referenciado pelo `image_url` do banco
- Female: `[item-slug]-female.png` (ex: `bandana-tatica-female.png`) — sufixo automático no código

**Pipeline de processamento do asset:**
1. Gerar arte via AI com prompt padrão (ver seção 7)
2. Se AI gerar fundo branco: processar com sharp para criar alpha real
3. Se AI incluir pescoço: usar Gemini/editor para remover (cortar na linha do queixo)
4. Resultado final: cabeça sem pescoço, fundo transparente, 1024×1024

**Prompt padrão para gerar head assets (male):**
```
Task: Draw this EXACT character's head wearing [NOME DO ITEM].

CRITICAL — Style matching:
- You MUST match the attached character EXACTLY: same face shape, same eye
  style, same eye color (brown), same skin tone, same hair color, same line
  weight, same outline color (dark brown)
- This head will be placed ON TOP of this character's body — any difference
  in style, proportions, or colors will be immediately visible
- Do NOT reinterpret the character — copy the existing art style precisely

The [ITEM]:
- [DESCREVER O ITEM: cor, material, como é vestido, detalhes]

Technical specs:
- Include: full head (hair + [item] + face + ears) — NO NECK, cut at jawline
- Canvas: 1024×1024px, transparent background (real alpha, NOT checkered)
- The head should be centered and occupy roughly 60-70% of the canvas
- Expression: friendly smile, matching the base character

Reference attached: The full base character — match this art style EXACTLY
```
**Referência obrigatória**: sempre anexar `avatar-base-male.png` (ou female) ao prompt.

### Outfit (roupas, armaduras, mantos)
- Fundo transparente (PNG)
- Devem cobrir o torso do personagem de forma natural

### Hand (armas, escudos, livros, acessórios de mão)
- Fundo transparente (PNG)
- Devem parecer segurados/empunhados pelo personagem
- Posicionado no **braço direito do personagem** (lado esquerdo da tela)

**Posicionamento no código (validado):**
```
Male:   top: h×0.32, left: w×0.17, width: w×0.25, height: h×0.25
Female: top: h×0.32, left: w×0.17, width: w×0.25, height: h×0.25
```

### ~~Frame~~ (REMOVIDO)
Slot frame removido do AvatarDisplay. Problemas com object-fit/overflow não resolvidos. Pode ser reimplementado no futuro com abordagem diferente (ex: CSS border-image ou SVG).

### Pet (companion)
- **1024×1024px** (quadrado), fundo transparente ou branco sólido
- Renderizado **dentro** do container, posicionado absolutamente no canto inferior direito
- Colado na perna do personagem como companion
- Tamanho: `petSize × 1.3` (30% maior que o petSize base)

**Posicionamento no código (validado):**
```
Male:   bottom: h×0.09, right: -w×0.01, size: petSize×1.3
Female: bottom: h×0.09, right: -w×0.01, size: petSize×1.3
```

---

## 5. SIZE_CONFIG (referência rápida)

```typescript
const SIZE_CONFIG = {
  sm: { w: 56, h: 78, petSize: 24 },   // thumbnails, ranking
  md: { w: 100, h: 140, petSize: 40 },  // cards, listas
  lg: { w: 200, h: 280, petSize: 80 },  // perfil mobile
  xl: { w: 340, h: 476, petSize: 110 }, // perfil desktop
};
```

---

## 6. Pet Animado — Pipeline GIF → APNG

### Visão geral
O pet usa APNG (PNG animado) com transparência real. O browser renderiza nativamente sem código extra. Em tamanhos sm/md usa a imagem estática; em lg/xl usa o APNG animado.

### Convenção de arquivos
- Estático: `[pet-slug].png` (ex: `peaozinho-madeira.png`)
- Animado: `[pet-slug]-animated.png` (ex: `peaozinho-madeira-animated.png`)
- O código troca automaticamente para `-animated.png` quando `animated=true` (lg/xl)

### Passo 1 — Gerar o GIF via AI de vídeo
Usar Runway, Pika, Kling ou similar. **Prompt padrão:**
```
Animate this cute character with very subtle, gentle movements.

Animation style: Very slow, calm, and gentle. Minimal movement.
Like a character standing quietly and breathing. NOT hyperactive or bouncy.

Animation sequence (~14-16 seconds, seamless loop):
- Breathing: Very slow, gentle rise and fall of the body throughout
  (subtle chest/torso expansion, ~4 second breath cycle)
- Blink: ONE single natural eye blink at ~4 seconds
- Wave: ONE single slow, gentle hand wave at ~8 seconds
  (small movement, friendly, then hand returns to rest)
- Leaf/accessory: Tiny, slow wiggle throughout (almost imperceptible)
- The rest of the time the character is just breathing quietly
- The animation ends in the EXACT same pose as it starts
  for a perfect seamless loop

What NOT to do:
- No jumping or bouncing
- No exaggerated movements
- No fast or jerky motion
- No background changes
- No multiple blinks or waves — only ONE of each

Technical:
- Keep the white background as-is
- Seamless loop — last frame identical to first frame
- Duration: 14-16 seconds
- Output: MP4 or GIF

Reference attached: The static pet character image
```

### Passo 2 — Extrair frames e remover fundo branco
Usar Node.js + sharp. O script abaixo faz flood fill das bordas (8 direções) para remover APENAS o fundo branco, preservando detalhes internos:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function extractAndClean(gifPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await sharp(gifPath, { animated: true }).metadata();
  const pages = meta.pages;
  const w = meta.width;
  const h = meta.pageHeight || Math.floor(meta.height / pages);

  for (let i = 0; i < pages; i++) {
    const frame = sharp(gifPath, { page: i }).ensureAlpha();
    const raw = await frame.raw().toBuffer();

    // Flood fill from edges
    const vis = new Uint8Array(w * h);
    const stack = [];

    function isBg(idx) {
      const r = raw[idx*4], g = raw[idx*4+1], b = raw[idx*4+2];
      return r > 230 && Math.abs(r-g) < 20 && Math.abs(g-b) < 20;
    }

    // Seed edges
    for (let x = 0; x < w; x++) {
      for (const y of [0, h-1]) {
        const p = y*w+x;
        if (isBg(p) && !vis[p]) { vis[p]=1; stack.push(p); }
      }
    }
    for (let y = 0; y < h; y++) {
      for (const x of [0, w-1]) {
        const p = y*w+x;
        if (isBg(p) && !vis[p]) { vis[p]=1; stack.push(p); }
      }
    }

    // DFS 8-dir flood fill
    while (stack.length > 0) {
      const p = stack.pop();
      raw[p*4+3] = 0; // set alpha to 0
      const px = p%w, py = (p-px)/w;
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const nx=px+dx, ny=py+dy;
        if (nx>=0 && nx<w && ny>=0 && ny<h) {
          const np = ny*w+nx;
          if (!vis[np] && isBg(np)) { vis[np]=1; stack.push(np); }
        }
      }
    }

    const framePath = path.join(outDir, 'frame_' + String(i).padStart(4,'0') + '.png');
    await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toFile(framePath);
  }
}
```

### Passo 3 — Montar APNG com ffmpeg
```bash
ffmpeg -y -framerate 12 -i frames/frame_%04d.png \
  -vf "fps=8,scale=240:-1" \
  -plays 0 -f apng output-animated.png
```
- `fps=8`: reduz frames por segundo para diminuir tamanho
- `scale=240:-1`: reduz resolução para ~240px largura (proporcional)
- `-plays 0`: loop infinito
- Resultado esperado: ~3-4MB para 14-16 segundos

### Passo 4 — Limpar temporários
```bash
rm -rf frames/
```

### Otimização de tamanho
| Configuração | Tamanho aprox. | Qualidade |
|---|---|---|
| 480px, 12fps, 145 frames | ~18MB | Excessivo |
| 240px, 8fps, 97 frames | ~3.2MB | Bom equilíbrio |
| 160px, 6fps, 72 frames | ~1.5MB | Mínimo aceitável |

### Notas importantes
- **GIF não suporta alpha real** — sempre converter para APNG
- **Não usar CSS mix-blend-mode:multiply** para "remover" fundo branco — não funciona corretamente
- **Usar flood fill das bordas** para remover fundo — threshold simples (r>230) remove pixels internos claros (olhos, dentes)
- A AI de vídeo funciona melhor com **fundo branco sólido** na entrada
- Testar o loop no browser antes de deployar

---

## 7. Histórico de Ajustes

| Data | Ajuste | Motivo |
|------|--------|--------|
| 2026-03-18 | Base: 93% + bottom-0 | Personagem com cabeça no teto; reduzir para 93% e ancorar no fundo cria 7% de headroom natural |
| 2026-03-18 | Head: head-swap sem pescoço | Overlay isolado flutua; head com pescoço cria emenda. Solução final: cabeça inteira SEM pescoço (corte no queixo), 1024×1024, alpha real |
| 2026-03-19 | Head: valores finais male+female | top: 0.098, left: 0.039, width: 0.92, height: 0.230. Convenção: `-female.png` suffix automático |
| 2026-03-19 | Head: processamento bg | Flood fill das bordas para checkered; threshold simples (r>235) para fundo branco. NUNCA usar remoção por cor agressiva — afeta olhos |
| 2026-03-19 | Hand: reposicionado | Movido de right para left (braço direito do personagem). Valores: top 0.32, left 0.17, width 0.25, height 0.25 |
| 2026-03-19 | Frame: removido | Problemas com object-fit/overflow não resolvidos |
| 2026-03-19 | Pet: dentro do container | Movido de fora para dentro do container, colado na perna. bottom 0.09, right -0.01, size petSize×1.3 |
| 2026-03-19 | Pet: APNG animado | GIF→APNG pipeline: extract frames→flood fill bg removal→ffmpeg APNG. 240px, 8fps, ~3.2MB. Convenção: `-animated.png` |
