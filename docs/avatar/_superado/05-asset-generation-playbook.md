# 05 — Playbook de Geração de Assets

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

Este documento define o processo operacional de geração de assets visuais para o sistema de avatar. Complementa o [doc 04 (Body Family & Template Spec)](04-body-family-and-template-spec.md) que define *o que* cada asset deve ser — este doc define *como* produzi-lo.

---

## Princípios de consistência visual

Todo asset do avatar pertence ao universo do **Reino das 64 Casas**. Independente do slot ou ferramenta de geração, o asset deve respeitar:

| Princípio | Regra concreta |
|-----------|---------------|
| **Estilo storybook** | Cartoon com contornos marrom-escuro (#3d2b1f), cores flat, sem gradientes suaves |
| **Espessura de traço uniforme** | Mesmo peso de linha da base skin. Traço visível mas não grosseiro |
| **Paleta tonal** | Cores terrosas/quentes predominantes. Sem neon. Cores saturadas apenas em itens epic/legendary |
| **Expressão** | Sorriso amigável, olhos grandes e expressivos. Sem expressões agressivas |
| **Anatomia** | Proporções cartoon (cabeça ~1/3 do corpo). Mãos simplificadas |
| **Fundo de geração** | Sempre WHITE SOLID (#FFFFFF). Nunca pedir "transparent" — AI gera xadrez baked |

---

## Workflow geral de geração

```
1. SELECIONAR slot + item a gerar
2. CARREGAR template guide do slot (referência visual)
3. PREPARAR prompt com referências + specs do doc 04
4. GERAR com AI de imagem (ChatGPT/DALL-E, Gemini, etc.)
5. AVALIAR resultado contra critérios do slot
6. SE aprovado → enviar para processamento (doc 06)
7. SE reprovado → identificar causa e REGENERAR ou EDITAR
```

**Regra**: Nunca processar (flood fill, crop, etc.) um asset que não passou na avaliação visual. O processamento não conserta problemas de composição.

---

## Geração por slot

### Background (underlay)

**Objetivo visual**: Cenário do Reino das 64 Casas onde o personagem ficará de pé.

| Aspecto | Spec |
|---------|------|
| Canvas de geração | 800 × 1120 px (production master 2×) |
| Canvas runtime | 400 × 560 px (5:7) |
| Referência obrigatória | Template guide de background (com silhueta + ground line) |
| Formato de saída | PNG |

**Estrutura da imagem**:
- Terço inferior: superfície sólida (piso, grama, pedra, tabuleiro)
- Terço médio: ambiente (paredes, árvores, mobília)
- Terço superior: espaço aberto (céu, teto, arco)
- Ground line a ~95% da altura — o personagem pisa aqui
- **Zona do pet livre**: O canto inferior direito (~25% da largura, ~25% da altura desde o chão) deve ter chão vazio ou superfície baixa (banquinho, tapete, pedra rasa). Nunca mesa, mobília alta ou objeto que faça o pet parecer "em cima de algo".

**Quando reprovar**:
- Chão não é sólido (personagem flutuaria)
- Estilo incompatível (realista, 3D, pixel art)
- Ratio não é 5:7
- Elementos que competem visualmente com o personagem (objetos no centro)
- Mobília ou objetos altos no canto inferior direito (zona do pet)

**Quando usar inpainting**: Para corrigir áreas específicas (ex: adicionar mais chão, remover objeto do centro) sem regenerar tudo.

---

### Dressed Base (outfit)

**Objetivo visual**: O MESMO personagem da base skin, na MESMA pose, vestindo a roupa.

| Aspecto | Spec |
|---------|------|
| Canvas de geração | 800 × 1200 px (production master 2×) |
| Canvas runtime | 400 × 600 px |
| Referência obrigatória | `avatar-base-{gender}.png` (SEMPRE anexar como referência) |
| Variantes necessárias | 2: `{slug}-male.png` + `{slug}-female.png` |

**Processo**:
1. Anexar base skin como referência à AI
2. Pedir: "Draw this EXACT character wearing [roupa]"
3. Enfatizar: mesma pose, mesmas proporções, pés no bottom edge
4. Gerar versão male e female separadamente

**Invariantes inegociáveis** (ver [doc 01](01-avatar-domain-model.md)):
- Mesma pose (frontal, braços relaxados)
- Mesmas proporções corporais
- Pés tocando borda inferior
- Pescoço/queixo visíveis (head region intacta)
- Braço direito acessível (hand region intacta)

**Quando reprovar**:
- Pose diferente da base (braços levantados, corpo virado)
- Proporções mudaram (cabeça maior/menor, corpo mais alto/baixo)
- Pés não estão no bottom edge
- Gola alta ou capuz cobrindo o queixo (quebra head_swap)
- Estilo visual divergente (traço diferente, cores diferentes)

**Quando usar inpainting**: Para corrigir detalhes da roupa sem mudar a pose/proporções. Nunca para "consertar" pose errada — regenerar.

**Risco**: Este é o slot mais difícil de gerar com IA. A AI tende a mudar proporções. Pode exigir 3-5 tentativas por item. Considerar edição manual (Photoshop/Figma) se a AI não convergir.

---

### Head (head_swap)

**Objetivo visual**: Cabeça inteira do personagem com o acessório vestido. Sem pescoço.

| Aspecto | Spec |
|---------|------|
| Canvas de geração | 1024 × 1024 px |
| Referência obrigatória | `avatar-base-{gender}.png` (rosto como referência de estilo) |
| Variantes necessárias | 2: `{slug}-swap-male.png` + `{slug}-swap-female.png` |

**Processo**:
1. Anexar base skin como referência
2. Pedir: cabeça inteira com o acessório, sem pescoço, corte no queixo
3. Fundo WHITE SOLID
4. Cabeça ocupando ~60-70% do canvas, centralizada
5. Gerar versão male e female separadamente

**Atenção especial**:
- **Olhos**: AI tende a adicionar eyeliner preto ou cílios grossos. Enfatizar: "NO black eyeliner, NO thick eyelashes"
- **Pescoço**: Se a AI incluir pescoço, pedir remoção via inpainting ou Gemini antes de processar
- **Fundo**: Nunca pedir "transparent" — pedir WHITE SOLID e remover no processamento (doc 06)

**Quando reprovar**:
- Tom de pele diferente da base
- Estilo de olhos diferente
- Espessura de traço diferente
- Acessório parece flutuando (não integrado à cabeça)
- Expressão agressiva ou incompatível

**Quando usar inpainting**: Para remover pescoço, ajustar posição do acessório, corrigir artefatos de olho. Funciona bem para ajustes localizados.

---

### Hand (overlay)

**Objetivo visual**: Item isolado, orientado como seria segurado na mão direita do personagem.

| Aspecto | Spec |
|---------|------|
| Canvas de geração | 512 × 512 px (ou proporcional) |
| Referência obrigatória | Template guide de hand (com braço do personagem) |
| Variantes necessárias | Nenhuma (mesmo asset para ambos os gêneros) |

**Processo**:
1. Gerar item isolado (espada, escudo, livro, etc.)
2. Fundo WHITE SOLID
3. Orientação: como seria visto na mão direita do personagem (lado esquerdo da tela)

**Quando reprovar**:
- Item muito detalhado (irreconhecível em sm: 56×78)
- Estilo incompatível (realista, 3D)
- Orientação errada (virado para o lado errado)

**Risco baixo**: Slot mais simples de gerar. Items isolados são confiáveis com AI.

---

### Pet (companion)

**Objetivo visual**: Criatura/companion do universo de xadrez, ao lado do personagem.

| Aspecto | Spec |
|---------|------|
| Canvas estático | 1024 × 1024 px |
| Canvas animado | 240px width (resultado final APNG) |
| Referência obrigatória | Template guide de pet (com escala do personagem) |
| Variantes necessárias | 2 arquivos: `{slug}.png` (estático) + `{slug}-animated.png` (APNG) |

**Processo estático**:
1. Gerar criatura isolada, fundo WHITE SOLID
2. Personagem de pé, tamanho proporcional (~30-40% da altura do avatar)
3. Estilo consistente com o universo (cartoon, contornos marrom)

**Processo animado** (ver [doc 06](06-asset-processing-pipeline.md) para pipeline técnico):
1. A partir do estático, gerar animação via AI de vídeo (Runway/Pika/Kling)
2. Solicitar: movimentos sutis, lentos, calmos — NÃO hiperativo
3. Ciclo ~14-16 segundos, loop seamless
4. Sequência sugerida: breathing (4s) → blink (1s) → wave (2s) → rest (7s)

**Quando reprovar**:
- Desproporcional ao personagem (muito grande ou muito pequeno)
- Estilo incompatível
- Animação muito rápida ou exagerada (deve ser sutil)
- Loop não é seamless (salto visível entre último e primeiro frame)

---

### Frame (frame_ui)

**Objetivo visual**: Moldura decorativa para envolver o avatar. Renderizada via CSS, não como imagem no canvas.

| Aspecto | Spec |
|---------|------|
| Formato | PNG 9-slice para `border-image` ou SVG |
| Referência obrigatória | Nenhuma (frame é independente do personagem) |
| Variantes necessárias | Nenhuma |

**Processo para 9-slice**:
1. Gerar moldura decorativa completa (retangular, com cantos elaborados)
2. Garantir que os 4 cantos são simétricos e bem definidos
3. Bordas (top/bottom/left/right) devem ser repetíveis/esticáveis
4. Centro deve ser transparente

**Alternativa para frames simples**: Não gerar imagem — definir como CSS puro (`box-shadow`, gradients, border com cor). Mapeamento rarity → estilo CSS já existe no código.

**Quando reprovar**:
- Cantos assimétricos
- Centro não é transparente
- Não funciona como 9-slice (bordas não são repetíveis)

**Risco**: Este slot é o menos maduro. Recomendação: começar com frames CSS puro (box-shadow por rarity) e evoluir para 9-slice depois.

---

## Ferramentas recomendadas

| Ferramenta | Uso principal | Pontos fortes | Limitações |
|------------|--------------|---------------|------------|
| ChatGPT (DALL-E) | Head, hand, pet, background | Boa aderência a referência, detalhes de estilo | Pode mudar proporções em outfit |
| Gemini | Correções, remoção de pescoço, ajustes | Bom para edição/inpainting | Menos controle de estilo |
| Runway / Pika / Kling | Animação de pet | Gera vídeo/GIF a partir de imagem | Pode adicionar movimentos excessivos |
| Photoshop / Figma | Correções manuais, montagem | Controle total | Manual, mais lento |

**Princípio**: AI gera o rascunho, humano valida e corrige. Nunca enviar para produção sem validação visual.

---

## Ordem recomendada de geração por set temático

Ao criar um novo set de itens (ex: "Set Medieval"):

1. **Background** primeiro — define o cenário e estabelece a paleta
2. **Dressed base** segundo — confirma que a roupa funciona com a pose
3. **Head** terceiro — confirma compatibilidade visual com dressed base
4. **Hand** quarto — item simples, rápido
5. **Pet** quinto — companion temático, pode ser gerado em paralelo
6. **Frame** por último — ou usar CSS puro

**Motivo**: Cada etapa valida compatibilidade com a anterior. Gerar head antes de confirmar que a dressed base funciona é desperdício se o outfit precisar ser refeito.
