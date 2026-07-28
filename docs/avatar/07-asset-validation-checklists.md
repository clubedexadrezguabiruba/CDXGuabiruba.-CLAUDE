# 07 — Checklists de Validação de Assets

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

Este documento define os checklists operacionais para validar assets antes de deploy. Cada slot tem validação visual, técnica e de compatibilidade.

---

## Classificação de problemas

| Severidade | Significado | Ação |
|-----------|-------------|------|
| **REPROVA** | Asset não pode ir para produção | Regenerar ou reprocessar |
| **CORRIGÍVEL** | Pode ser consertado sem regenerar | Aplicar correção (crop, flood fill, resize) |
| **ACEITAR** | Imperfeição menor, aceitável | Seguir adiante |

---

## Dressed Base / Base Skin (outfit)

### Validação visual

| # | Check | Severidade se falhar |
|---|-------|---------------------|
| 1 | Mesma pose que base_skin (frontal, braços relaxados) | REPROVA |
| 2 | Mesmas proporções corporais (altura, largura, membros) | REPROVA |
| 3 | Pés tocando a borda inferior da imagem | CORRIGÍVEL (reposicionar) |
| 4 | Pescoço/queixo visíveis (head region intacta) | REPROVA |
| 5 | Braço direito acessível (hand region intacta) | REPROVA |
| 6 | Tom de pele idêntico à base | REPROVA |
| 7 | Espessura de traço e cor de contorno compatíveis | REPROVA |
| 8 | Expressão facial amigável | CORRIGÍVEL (inpainting) |
| 9 | Roupa visualmente reconhecível em sm (56×78) | ACEITAR se não for |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Dimensão: 400×600 (runtime) ou 800×1200 (production) | CORRIGÍVEL (resize) |
| 2 | PNG com alpha real (fundo transparente) | CORRIGÍVEL (flood fill) |
| 3 | Sem halo branco ao redor do personagem | CORRIGÍVEL (reprocessar flood fill) |
| 4 | Variante male E female existem | REPROVA (gerar a variante faltante) |

### Validação de compatibilidade

| # | Check | Como testar | Severidade |
|---|-------|------------|-----------|
| 1 | Head_swap encaixa corretamente sobre o outfit | Equipar head + outfit no localhost | REPROVA |
| 2 | Hand overlay encaixa sobre o outfit | Equipar hand + outfit no localhost | REPROVA |
| 3 | Visual OK com background equipado | Testar combinação | ACEITAR se menor |

---

## Head (head_swap)

### Validação visual

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Tom de pele match com base | REPROVA |
| 2 | Estilo de olhos match (forma, cor, sem eyeliner indesejado) | REPROVA |
| 3 | Espessura de traço compatível | REPROVA |
| 4 | Acessório integrado à cabeça (não flutuando) | REPROVA |
| 5 | Sem pescoço (corte limpo no queixo) | CORRIGÍVEL (crop/inpainting) |
| 6 | Cabeça centrada no canvas, ocupando ~60-70% | CORRIGÍVEL (reposicionar) |
| 7 | Expressão amigável | CORRIGÍVEL (inpainting) |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Dimensão: 1024×1024 | CORRIGÍVEL (resize) |
| 2 | PNG com alpha real | CORRIGÍVEL (flood fill) |
| 3 | Olhos intactos (sem artefatos de threshold) | REPROVA se flood fill foi mal feito |
| 4 | Variante male E female existem | REPROVA |

### Validação de compatibilidade

| # | Check | Como testar | Severidade |
|---|-------|------------|-----------|
| 1 | Encaixa na head region sem gap no pescoço | Equipar no localhost sobre base skin | REPROVA |
| 2 | Encaixa na head region sem gap sobre dressed base | Equipar no localhost com outfit | REPROVA |
| 3 | Proporcional em todos os tamanhos (sm, md, lg, xl) | Preview em cada size | CORRIGÍVEL |
| 4 | Visual OK com background | Testar combinação | ACEITAR |

---

## Hand (overlay)

### Validação visual

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Item reconhecível quando renderizado em sm (56×78) | ACEITAR se não for |
| 2 | Orientação correta (como segurado na mão direita) | REPROVA |
| 3 | Estilo compatível (cartoon storybook) | REPROVA |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | PNG com alpha real | CORRIGÍVEL |
| 2 | Dimensão razoável (512×512 ou proporcional) | CORRIGÍVEL |
| 3 | Item centralizado no canvas | CORRIGÍVEL |

### Validação de compatibilidade

| # | Check | Como testar | Severidade |
|---|-------|------------|-----------|
| 1 | Posição correta sobre base skin (na mão) | Equipar no localhost | CORRIGÍVEL (ajustar orientação) |
| 2 | Não conflita visualmente com outfit | Testar combinação | ACEITAR |

---

## Pet (companion)

### Validação visual

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Proporcional ao personagem (~30-40% da altura) | REPROVA |
| 2 | Estilo compatível | REPROVA |
| 3 | Reconhecível em sm/md (estático) | ACEITAR |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Estático: 1024×1024, PNG com alpha | CORRIGÍVEL |
| 2 | Animado: APNG, ~240px width | CORRIGÍVEL |
| 3 | Animado: tamanho ≤5MB | CORRIGÍVEL (reduzir fps/resolução) |
| 4 | Animado: alpha real em todos os frames | REPROVA (reprocessar frames) |

### Validação de animação

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Loop seamless (sem salto visível) | REPROVA |
| 2 | Movimentos sutis e lentos (não hiperativo) | REPROVA |
| 3 | Duração do ciclo: 10-16 segundos | CORRIGÍVEL (ajustar fps) |
| 4 | Fundo transparente em todos os frames | REPROVA |
| 5 | Browser renderiza APNG corretamente | CORRIGÍVEL (re-encode) |

---

## Background (underlay)

### Validação visual

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Chão sólido no terço inferior | REPROVA |
| 2 | Personagem não ficaria "flutuando" | CORRIGÍVEL (inpainting do chão) |
| 3 | Sem elementos dominantes no centro (onde o avatar ficará) | CORRIGÍVEL (inpainting) |
| 4 | Canto inferior direito livre (zona do pet) — sem mesa, mobília alta ou objetos | CORRIGÍVEL (inpainting) |
| 4 | Estilo consistente com Reino das 64 Casas | REPROVA |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Ratio exatamente 5:7 | CORRIGÍVEL (crop) |
| 2 | Dimensão: 400×560 (runtime) ou 800×1120 (production) | CORRIGÍVEL (resize) |
| 3 | Sem artefatos de compressão visíveis | CORRIGÍVEL (re-export em PNG) |

---

## Frame (frame_ui)

### Validação visual

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Cantos simétricos e bem definidos | REPROVA |
| 2 | Bordas repetíveis/esticáveis | REPROVA |
| 3 | Centro transparente | REPROVA |
| 4 | Estilo compatível com a rarity do item | ACEITAR |

### Validação técnica

| # | Check | Severidade |
|---|-------|-----------|
| 1 | Funciona como CSS `border-image` em todos os tamanhos | REPROVA |
| 2 | Cantos preservados quando esticado | CORRIGÍVEL (ajustar 9-slice) |
| 3 | Visual OK em sm (56×78) e xl (340×476) | CORRIGÍVEL |

---

## Teste de compatibilidade cross-slot

Após validar cada asset individualmente, testar COMBINAÇÕES no localhost:

| # | Combinação | O que verificar |
|---|-----------|----------------|
| 1 | base skin + head + hand | Head encaixa no pescoço, hand na mão |
| 2 | dressed base + head + hand | Mesmo teste com outfit |
| 3 | dressed base + head + hand + background | Visual coeso, sem conflitos |
| 4 | Tudo + pet | Pet não sobrepõe o personagem |
| 5 | Tudo + frame | Frame não corta o avatar |
| 6 | Verificar em sm, md, lg, xl | Proporcional em todos os tamanhos |
| 7 | male E female | Repetir testes acima para ambos os gêneros |

**Ferramenta**: Usar o localhost em `/perfil` para visualizar o avatar com items equipados. Testar swap de gênero com o botão de trocar avatar.

---

## Workflow de validação resumido

```
1. VISUAL: O asset parece correto? (estilo, proporções, pose)
   └── Se não → REGENERAR

2. TÉCNICO: Dimensão, alpha, variantes existem?
   └── Se não → PROCESSAR/CORRIGIR

3. COMPATIBILIDADE: Encaixa com outros slots?
   └── Se não → REPROVAR e voltar à geração

4. CROSS-SLOT: Combinações funcionam?
   └── Se não → Identificar qual asset é o problema

5. DEPLOY: Copiar para public/items/{slot}/
```
