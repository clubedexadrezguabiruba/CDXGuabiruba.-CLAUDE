# 06 — Pipeline de Processamento de Assets

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

Este documento define o pipeline técnico de processamento e normalização dos assets gerados. Transforma a saída bruta da geração (doc 05) em arquivos prontos para deploy.

---

## Visão geral do pipeline

```
GERAÇÃO (AI/manual)
  └── asset bruto (fundo branco, dimensão variável)

PROCESSAMENTO
  ├── 1. Remoção de fundo (flood fill)
  ├── 2. Crop/reposicionamento no template-space
  ├── 3. Resize para production master (se necessário)
  ├── 4. Export runtime (downscale 2× → 1×)
  └── 5. Geração de variantes (gender, animated)

SAÍDA
  └── arquivo final em public/items/{slot}/{slug}.png
```

---

## Etapa 1: Remoção de fundo

### Quando é necessária

| Slot | Remoção de fundo? | Motivo |
|------|-------------------|--------|
| Head | Obrigatório | Asset sobre corpo, precisa de alpha |
| Hand | Obrigatório | Item sobre corpo, precisa de alpha |
| Pet | Obrigatório | Companion sobre background, precisa de alpha |
| Dressed base / Base | Obrigatório | Personagem sobre background, precisa de alpha |
| Background | Não necessário | Preenche canvas inteiro |
| Frame | Depende | Centro transparente sim, bordas não |

### Método: Flood Fill 8-direções (obrigatório)

**Nunca usar threshold global** (ex: "todo pixel com r > 235 vira transparente"). Isso danifica pixels claros internos ao asset — especialmente olhos, dentes, brilhos.

**Método correto**: Flood fill partindo das bordas da imagem, 8 direções (N, NE, E, SE, S, SW, W, NW).

**Critério de preenchimento**:
```
Pixel é "fundo branco" se:
  r > 230 AND
  abs(r - g) < 20 AND
  abs(g - b) < 20
```

**Implementação** (Node.js + sharp):
```javascript
// Pseudocódigo
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);

// Marcar pixels como "visitado" ou "fundo"
// Iniciar flood fill de cada pixel das bordas (row 0, row max, col 0, col max)
// Para cada pixel visitado que passa no critério: alpha = 0
// Não modificar pixels que não são alcançáveis pelas bordas (pixels internos claros preservados)

await sharp(processedPixels, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(output);
```

**Por que flood fill e não threshold**:
- Threshold global: olhos brancos/claros ficam transparentes → artefatos pretos
- Flood fill das bordas: só remove pixels brancos conectados à borda externa. Pixels brancos internos (olhos, dentes) são preservados porque estão "cercados" pelo personagem

### Causas de reprovação no processamento

| Problema | Causa | Ação |
|----------|-------|------|
| Olhos com buracos | Threshold global usado em vez de flood fill | Reprocessar com flood fill |
| Fundo xadrez residual | AI gerou xadrez em vez de branco sólido | Regenerar pedindo WHITE SOLID |
| Halo branco ao redor do personagem | Threshold muito alto (< 230) | Ajustar threshold ou usar anti-alias |
| Brilhos/destaques removidos | Pixels claros internos removidos | Reprocessar com flood fill (não threshold) |

---

## Etapa 2: Crop e reposicionamento

### Objetivo

Garantir que o asset está corretamente posicionado no template-space canônico. Se o asset foi gerado em um canvas maior ou com offset, reposicionar.

### Por slot

| Slot | Reposicionamento |
|------|-----------------|
| Background | Nenhum — preenche canvas 5:7 exato |
| Dressed base | Verificar: personagem centrado horizontalmente, pés no bottom edge |
| Head | Verificar: cabeça centrada no canvas quadrado, ~60-70% de ocupação |
| Hand | Verificar: item orientado corretamente, centralizado |
| Pet | Verificar: criatura centralizada no canvas quadrado |
| Frame | Verificar: cantos simétricos, centro vazio |

**Se o personagem está deslocado** (ex: pés não estão no bottom edge):
1. Calcular offset necessário
2. Reposicionar via sharp `.extend()` / `.extract()` / `.composite()`
3. Re-exportar

**Princípio**: O processamento garante que o asset preenche o template-space corretamente. Isso é o que elimina ajuste manual no frontend. Se o asset está correto no template-space, o renderer só precisa posicionar a região (anchor profile) e o asset encaixa.

---

## Etapa 3: Production master

### Canvas de produção (2×)

| Slot | Production master | Ratio |
|------|------------------|-------|
| Background | 800 × 1120 px | 5:7 |
| Base / Dressed base | 800 × 1200 px | 2:3 |
| Head | 1024 × 1024 px | 1:1 |
| Hand | 512 × 512 px | 1:1 |
| Pet estático | 1024 × 1024 px | 1:1 |
| Frame | Variável | — |

Se o asset foi gerado em resolução diferente, fazer resize para o production master.

**Regra**: Sempre preservar (ou gerar em) resolução do production master ANTES de fazer qualquer downscale. O master é o arquivo de referência.

**Assets existentes a 1×** (gerados antes desta spec): Mantidos como estão. Não fazer upscale artificial. Production master 2× é recomendação para novos assets.

---

## Etapa 4: Export runtime

Downscale do production master para o runtime export:

| Slot | De (production) | Para (runtime) | Método |
|------|-----------------|----------------|--------|
| Background | 800 × 1120 | 400 × 560 | sharp `.resize(400, 560)` |
| Base / Dressed base | 800 × 1200 | 400 × 600 | sharp `.resize(400, 600)` |
| Head | 1024 × 1024 | 1024 × 1024 | Sem downscale (já é runtime) |
| Hand | 512 × 512 | 512 × 512 | Sem downscale |
| Pet estático | 1024 × 1024 | 1024 × 1024 | Sem downscale |
| Pet animado | — | 240px width | Via ffmpeg (etapa 5) |

**Nota**: Head, hand e pet estáticos não são downscalados porque o renderer já faz isso via CSS `object-contain` dentro do anchor region. Servir a 1024px permite qualidade em futuras telas maiores.

**Formato de saída**: Sempre PNG. Nunca JPEG (perde alpha). Compressão: `sharp.png({ quality: 90, compressionLevel: 9 })`.

---

## Etapa 5: Geração de variantes

### Variantes de gênero (head, dressed_base)

Para cada asset de head ou dressed base, produzir DUAS versões:

```
head/bandana-tatica.png           → NÃO usado diretamente pelo renderer
head/bandana-tatica-swap-male.png → usado para gender_variant male
head/bandana-tatica-swap-female.png → usado para gender_variant female

outfit/tunica-azul.png            → NÃO usado diretamente
outfit/tunica-azul-male.png       → usado para male
outfit/tunica-azul-female.png     → usado para female
```

**Processo**: Gerar separadamente com AI (uma geração por gênero, anexando a base skin correspondente).

**Arquivo base** (`{slug}.png` sem sufixo): Armazenado no DB como `image_url`. O asset resolver deriva as variantes em runtime. O arquivo base pode não existir fisicamente — é uma referência lógica.

### Variante animada (pet)

```
pet/peaozinho-madeira.png          → estático (sm/md)
pet/peaozinho-madeira-animated.png → APNG (lg/xl)
```

**Pipeline GIF → APNG**:

```
1. INPUT: GIF ou vídeo animado do pet (saída da AI de vídeo)

2. EXTRAIR FRAMES:
   sharp(gifPath, { page: frameIndex }).ensureAlpha().raw().toBuffer()
   → Para cada frame: aplicar flood fill bg removal
   → Salvar como PNG individual: frames/frame_0001.png, frame_0002.png, ...

3. MONTAR APNG:
   ffmpeg -y -framerate 12 -i frames/frame_%04d.png \
     -vf "fps=8,scale=240:-1" \
     -plays 0 -f apng output-animated.png

   Parâmetros:
   - framerate 12: input fps (sobrecarregar frames é OK)
   - fps=8: output fps (reduz tamanho)
   - scale=240:-1: 240px largura, altura proporcional
   - plays 0: loop infinito
   - formato: apng (PNG animado com alpha real)

4. VALIDAR:
   - Tamanho: alvo ~3MB (aceitável: 1.5-5MB)
   - Loop: visualmente seamless (sem salto entre último e primeiro frame)
   - Alpha: fundo transparente em todos os frames
```

**Tamanhos de referência**:

| Config | Tamanho | Uso |
|--------|---------|-----|
| 480px, 12fps | ~18MB | Excessivo — não usar |
| 240px, 8fps | ~3.2MB | Recomendado |
| 160px, 6fps | ~1.5MB | Mínimo aceitável (se 3MB for muito) |

---

## Convenções de saída

### Estrutura de diretórios

```
public/items/
├── base/
│   ├── avatar-base-male.png
│   └── avatar-base-female.png
├── bg/
│   └── {slug}.png
├── outfit/
│   ├── {slug}-male.png
│   └── {slug}-female.png
├── head/
│   ├── {slug}-swap-male.png
│   └── {slug}-swap-female.png
├── hand/
│   └── {slug}.png
├── pet/
│   ├── {slug}.png
│   └── {slug}-animated.png
└── frame/
    └── {slug}.png
```

### Naming

- Slugs em kebab-case: `bandana-tatica`, `peaozinho-madeira`, `sala-aula`
- Sufixos de variante: `-male`, `-female`, `-swap-male`, `-swap-female`, `-animated`
- Extensão: sempre `.png`

### DB reference

O campo `items.image_url` armazena o path com o slug base:
- Head: `/items/head/bandana-tatica.png` (resolver adiciona `-swap-{gender}`)
- Outfit: `/items/outfit/tunica-azul.png` (resolver adiciona `-{gender}`)
- Pet: `/items/pet/peaozinho-madeira.png` (resolver adiciona `-animated`)
- Outros: path direto usado pelo renderer

---

## Processamento obrigatório vs opcional

| Etapa | Obrigatório? | Quando pular |
|-------|-------------|-------------|
| Flood fill bg removal | Sim (exceto background) | Nunca — sempre necessário para assets com alpha |
| Crop/reposicionamento | Se necessário | Se o asset já está corretamente posicionado no template-space |
| Production master resize | Se gerado em resolução diferente | Se já está na resolução correta |
| Runtime export downscale | Para bg e body (2× → 1×) | Head, hand, pet não são downscalados |
| Variante de gênero | Para head e outfit | Hand, pet, bg, frame não têm variante |
| APNG | Para pet | Apenas se animação desejada |

---

## Como o pipeline reduz ajuste manual no frontend

```
SEM PIPELINE (antes):
  Asset gerado → tamanho arbitrário, fundo branco, posição variável
  → frontend precisa de top/left/width/height ajustado por item
  → bugs de posicionamento frequentes

COM PIPELINE (agora):
  Asset gerado → processado → normalizado no template-space canônico
  → frontend usa anchor profile do slot (fixo, não per-item)
  → object-contain faz o scaling
  → ZERO ajuste per-item
```

O pipeline é a ponte entre "AI gerou algo" e "funciona no renderer sem tocar em código".
