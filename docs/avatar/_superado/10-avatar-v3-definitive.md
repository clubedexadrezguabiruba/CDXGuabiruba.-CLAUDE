# Avatar v3 — "O Estrategista": Versão Definitiva (Avatar/Cosméticos)

> ⚠️ **ARQUIVADO em 2026-08-03 — não é mais o plano vigente.** Este texto se
> declarava vigente porque superou a v2; ele mesmo caiu com o **v4**. O plano de
> execução de hoje é [`../15-plano-ate-pronto.md`](../15-plano-ate-pronto.md), e o
> racional está em [`../12-avatar-v4-plano-completo.md`](../12-avatar-v4-plano-completo.md).
> Ver [README](README.md).
>
> _(status original, mantido como registro:)_ Ele **supersede** os documentos
> `01`–`09` desta pasta onde houver conflito.
> Em especial, a **Fase 6 do doc 09** (produção de assets `dressed_base`) **não
> deve ser executada** — `dressed_base` foi descartado por este documento.
>
> Natureza: **especificação de design + decisão**, não ordem de implementação.
> Decisão de produto já tomada: **corpo único unissex**.

## Ajustes do revisor sobre a proposta original
1. **Capa NÃO é baked no uniforme.** A proposta original colocava a capa do
   Comandante+ dentro da arte do `outfit`. Como já existe o slot `back`, isso
   duplicaria (uniforme com capa baked + `back` do jogador = duas capas).
   **Regra definitiva:** capa vive só no slot `back`. Patente que inclui capa
   (Comandante→) **concede + auto-equipa um item `back` de capa** correspondente
   (mesmo padrão do uniforme). Mantém 1 capa por slot, evita conflito visual, e o
   jogador pode trocar por capa cosmética que possua sem cair abaixo do mérito.
2. **Migração suave, sem re-gate forçado.** A proposta original re-setava
   `avatar_chosen` para forçar todos os usuários existentes de volta ao
   `criar-personagem`. **Substituído por:** usuários existentes recebem tom de
   pele default (`medio`), mantêm `avatar_chosen=true`, e veem um prompt **uma
   vez, dispensável** no perfil ("escolha seu tom de pele"). Sem re-onboarding
   forçado.

---

## 1. Princípios
1. **O avatar é o histórico legível do mérito.** Olhar o boneco responde: quanto
   estudou (uniforme/patente), o que conquistou (relíquia/moldura/pet), há quanto
   tempo caminha (qualidade dos itens). Identidade (pele, cabelo) é o tempero;
   mérito é o prato.
2. **Servidor concede, cliente veste.** Todo item entra em `user_inventory` por
   RPC/trigger idempotente. Client só escolhe o que vestir dentre o que possui —
   inclusive uniformes.
3. **Arte é o recurso escasso; eixos multiplicam arte.** Eixos devem ser
   ortogonais por construção (tom de pele só toca o corpo-base; roupa nunca toca
   pele). Eixo que não pode ser isolado, não entra.
4. **Silhueta constante, qualidade crescente.** Progressão = material/acabamento
   melhores no mesmo lugar; nunca mais volume/brilho/penduricalho. É o que impede
   o "palhaço".
5. **Zero sistemas novos onde os existentes servem.** Baús, conquistas, streak,
   level-up e títulos já são o pipeline de distribuição. A v3 reaproveita; não
   cria moeda, loja, crafting nem tabela de upgrade.

## 2. MANTER
**Do sistema atual:** render mode por slot (nunca por item); character-root
motion group; anchors normalizados em config TS; asset resolver como função pura
(fica mais simples); schema `items`/`user_inventory`/`user_equipped` + cache
`avatar_config`; pipeline de aquisição (baús/conquistas/level-up/welcome/streak);
frame CSS por raridade; pet APNG + ovos; princípio "zero DB migration por padrão,
gatilhos documentados" (v3 ativa 3 gatilhos previstos).

**Do PDF de produto:** corpo único unissex; uniforme=patente quase-permanente;
relíquias como símbolos de conhecimento (mapeiam no slot `hand`); paleta sóbria;
"amadurece, não troca de personagem"; nunca vender mérito; todos começam iguais.

## 3. MUDAR / APRIMORAR
**No sistema atual:**
- 2 gêneros + anchors/knockout per-gender → **corpo único + `avatar_skin`**
  (5 tons por asset).
- `outfit`=`dressed_base` (troca corpo inteiro) → **`garment`** (roupa sobre
  corpo persistente, transparente onde há pele). Decisivo: com `dressed_base`, o
  tom de pele multiplicaria cada outfit por 5 para sempre.
- `head`=`head_swap` + knockout mask → **`hair` + `headgear` como overlays** no
  anchor de cabeça; **knockout deletado**.
- Patente=texto em `user_titles` → **concede e auto-equipa uniforme** via trigger
  existente.
- `criar-personagem` male/female → **tom de pele + cabelo inicial** (mesmo flag
  `avatar_chosen`).

**Onde o PDF erra (correção):**
- **~15 micro-slots (botas/luvas/cinto/colar/bracelete/ombreira/lenço) —
  REJEITADO.** Invisíveis em chibi (`sm` 56×78, `md`), e caminho do efeito
  palhaço. Viram **detalhe baked nos tiers de uniforme** (o "cinto couro→ouro" do
  PDF = Capitão vs General).
- **Rosto composível (formato+olhos+sobrancelha+boca+nariz+orelha) —
  REJEITADO.** Nariz/orelha em 30px são invisíveis; matriz de QA explode.
  Identidade facial = **tom de pele + cabelo**. Rosto neutro baked.
- **6 expressões como customização — REBAIXADO a reação de runtime**
  (vitória/concentração), camada de linha-arte agnóstica a tom, sem DB, só
  `lg`/`xl`, fase final. 4 bastam.
- **Barba — CORTADA** (público escolar; eixo extra cruzando headgear).
- **"Evolui no lugar" genérico — CONTIDO** a uniforme + 2 famílias de relíquia
  (tiers = linhas em `items` agrupadas por config TS; zero tabela nova).
- **Loja/venda — REJEITADA nesta versão** (sem moeda; público infantil de clube;
  LGPD; coerência com mérito). Cosméticos entram por baú/streak/conquista.
  Revisão só com catálogo >120 + RNG frustrante, e mesmo assim moeda de troca
  ganha em jogo, nunca dinheiro real.
- **Insígnia como decalque discreto — REJEITADO como camada** ("discreto" em 56px
  = inexistente). Insígnia de patente é baked no peito do uniforme (cresce por
  tier); conquistas se expressam por frame/background/pet/relíquia + painel
  existente.

## 4. A VERSÃO DEFINITIVA
### 4.1 Corpo único "O Estrategista"
- 1 body family `estrategista_v1` (substitui `recruta_v1`). Mesma pose/canvas
  5:7/ground line.
- **Baked na base:** rosto neutro, cabelo curto simples, traje de treino simples.
  Consequências grátis: "todos começam iguais" = o asset base; 404 de garment cai
  para traje de Aprendiz (nunca boneco pelado); outfit vazio = estado válido
  (Aprendiz), então **não existe item "uniforme Aprendiz"** (o primeiro é
  Soldado).
- **Composível:** tom de pele (5 assets `estrategista-{tone}.png`), cabelo
  (itens), slots.
- **5 tons de pele** (claro→escuro), escolhidos em `criar-personagem`. **Cores por
  asset, nunca hue-shift em runtime** (tint sobre flat colors + contorno #3d2b1f
  = sujeira, QA impossível). Custo total e definitivo do eixo = 5 PNGs; item nunca
  multiplica por ele (mangas terminam no punho, mãos são do corpo-base).

### 4.2 Taxonomia de slots — 8 equipáveis + camadas de sistema
| z | Camada | Slot DB | Render mode | No character-root? | Novo? |
|---|---|---|---|---|---|
| 0 | Background | `background` | `underlay` | não | existente |
| 1 | Costas (capa/estandarte/mochila) | `back` | `back_attach` (canvas cheio, atrás) | sim (respira junto) | **novo** |
| 2 | Corpo-base (tom de pele; rosto+cabelo+traje baked) | `avatar_skin` (atributo, não item) | `body` | sim | mudou |
| 3 | Uniforme | `outfit` | `garment` (canvas cheio, transparente na pele) | sim | mudou |
| 4 | Cabelo | `hair` | `head_attach` | sim (head-group) | **novo** |
| 5 | Chapéu/adorno | `head` | `head_attach` | sim (head-group) | mudou |
| 6 | Expressão (runtime, não persiste) | — | `expression` | sim (head-group) | novo, fase final |
| 7 | Relíquia (mão) | `hand` | `overlay` | sim | existente (renomeia UI) |
| 8 | Pet | `pet` | `companion` | não | existente |
| 10 | Moldura | `frame` | `frame_ui` (CSS) | não | existente |

- `hair`+`head` separados (chapéu oculta cabelo por padrão; exceções via flag
  `showsHair` em config TS por item).
- Itens de cabelo/chapéu cobrem o cabelo baked (trivial em chibi).
- `back` entra no schema agora, arte depois (capa é o equipamento mais legível em
  chibi).
- **Capa é `back`, não baked no uniforme** (ver Ajuste 1). Botas/luvas/cinto/
  ombreira/colar/bracelete/bolsa **não são slots** — são detalhe de arte dos tiers.

### 4.3 Taxonomia de itens → slots
| Categoria | Slot(s) | Aquisição | Vende? |
|---|---|---|---|
| **Uniforme** (Soldado→Lenda) | `outfit` (+ `back` quando a patente inclui capa) | Trigger de patente; nunca em baú | Nunca |
| **Equipamento** (estética) | `back`, `head`, `hair`, `background` | Baús, level-up, streak, welcome | Nunca |
| **Insígnia** (conquista) | `frame`+`background`+`pet` temáticos; painel | Conquistas (`reward_item_id` existente) | Nunca |
| **Relíquia** (conhecimento) | `hand` | Marcos de aprendizado (trilhas/estudo/streak) | Nunca |

UI agrupa por categoria (config TS mapeia slot→categoria); DB só conhece slots.

### 4.4 Progressão & desbloqueio (server-authority)
| Evento (ponto server-side existente) | Concede | Mecânica |
|---|---|---|
| Trilha completa → título sobe (`complete_lesson_step`, bloco 6) | Uniforme do tier + **capa `back` se a patente inclui** + auto-equip | `INSERT user_inventory … ON CONFLICT DO NOTHING` + UPSERT `user_equipped` + rebuild `avatar_config`. Fonte `'title'` |
| Trilha completa | Próximo tier da relíquia "Livro do Estrategista" | Mesmo padrão |
| Conquistas (`check_achievements`) | Frames/pets/backgrounds/relíquias one-shot | `reward_item_id` (existe) |
| Marcos vs bots | Tiers da relíquia "Peça do Rei" | `reward_item_id` das conquistas de bot |
| Baús de missões (`claim_chest`) | Equipamentos por raridade | Pool sem uniformes/relíquias |
| Streak/level-up/welcome | Equipamentos temáticos | Existe |

Regras: nunca desbloqueio por tempo puro; nunca relógio do client; concessão
idempotente por `UNIQUE(user_id,item_id)`. Prestígio reverso grátis (General pode
vestir uniforme de Soldado — só veste o que mereceu).

### 4.5 "Evolui no lugar" — concreto e contido
- Tier = **linha própria em `items`** (ex.: Livro I/II/III = ids 201/202/203).
  Zero tabela/coluna/estado novo.
- Config TS `itemFamilies.ts`: `{ familyId, tiers:[ids] }`. UI mostra a família
  como 1 card no tier mais alto possuído. Conceder tier N com N−1 equipado →
  auto-equipa (parece "evoluiu").
- **Vale em:** uniforme (7 tiers) + **2 famílias de relíquia** no lançamento
  (Livro do Estrategista / Peça do Rei, 3 tiers cada). ~13 assets de evolução.
- **NÃO vale em:** pets, backgrounds, frames, cabelos, chapéus, capas (loot
  single-stage). Terceira família futura = 1 linha de config + seeds.

### 4.6 Patente → uniforme (coração)
7 uniformes (Soldado azul→Lenda creme+ouro), mesma silhueta, insígnia de peito
crescente, micro-equipamento evolui dentro da arte; **capa via `back` a partir de
Comandante**. Implementação: `CREATE OR REPLACE complete_lesson_step` (migration
nova), no bloco que já faz `UPDATE user_titles` — adicionar concessão+auto-equip,
mapa trilha→item em array SQL (como `v_title_map`). **Backfill idempotente** por
`highest_trail_completed`. Ranking exibe de graça (`user_public_profiles` já
carrega `avatar_config`).

### 4.7 Economia/loja
**Não existe nesta versão.** Cosméticos do PDF (cabelos/cores/capas
comemorativas) entram por baú/streak sazonal ("evento" = curadoria de pool, não
SKU). Revisão só com gatilho concreto.

### 4.8 Guarda-corpos anti-palhaço (mecanismos)
1. Paleta fechada em `palette.ts` (10 tons + #3d2b1f); fora da paleta = reprovado
   no checklist (docs 05–07).
2. Regra do 1 herói (máx. 1 cor de destaque por item).
3. Raridade = acabamento, nunca volume; glow só no frame CSS.
4. Orçamento de silhueta (item não ultrapassa a region do template — doc 04/07).
5. Teto estrutural: só 4 camadas tocam o boneco (uniforme/cabelo/chapéu/mão) +
   capa atrás.

## 5. Data model (uma migration aditiva `avatar_v3`)
- `items.slot` e `user_equipped.slot` CHECK += `'hair'`, `'back'`.
- `user_inventory.source` CHECK += `'title'`.
- `users` ADD `avatar_skin text NOT NULL DEFAULT 'medio' CHECK (IN
  claro/medio_claro/medio/medio_escuro/escuro)`.
- RPC `update_avatar_identity(p_skin, p_hair_item_id?)` substitui
  `update_avatar_base` (valida, seta `avatar_chosen`, refresh view).
- Recriar `user_public_profiles` incluindo `avatar_skin`.
- `CREATE OR REPLACE complete_lesson_step`: grant+auto-equip de uniforme+capa+
  relíquia Livro; backfill.
- `users.avatar_base` **deprecada, não dropada** (drop em limpeza futura). Gatilho
  "terceiro gênero" morre (corpo único + tons resolve representação).
- **Nada de:** tabela de tiers/upgrade, `item_assets`, `render_mode` no DB, moeda,
  preços.
- **Config TS (deploy):** body family, anchors (um conjunto, sem gênero), z-order,
  render modes, `itemFamilies`, `showsHair`, paleta, expressões, animação,
  categoria de item.

> **Atenção ao mexer em `complete_lesson_step`:** nunca copiar o corpo da função
> de uma migration antiga. Foi assim que a curva de XP foi revertida em silêncio
> e ficou 4 meses errada em produção. Extrair de `pg_get_functiondef` do banco
> **vivo** e alterar só o necessário — e lembrar que `pg_get_functiondef` **não
> emite o `;` final** depois de `$function$`.

## 6. Render (arquitetura character-root permanece)
- `bodyFamilies.ts`: `ESTRATEGISTA_V1` substitui `RECRUTA_V1`; `anchors` deixa de
  ser `Record<GenderVariant,…>` → conjunto único (head/hand/pet + sub-anchor
  `face`).
- `types.ts`: remove `GenderVariant`; `RenderMode` = underlay|body|garment|
  back_attach|head_attach|overlay|companion|frame_ui|expression (some
  `dressed_base`/`head_swap`).
- `assetResolver.ts`: caem regras `-swap-{gender}`/`-{gender}`; sobra `-animated`
  do pet. Corpo-base via `fallbacks.ts` `resolveBodySrc(skin)`.
- `resolvedAvatar.ts`: **deletar todo o knockout** (clipPath per-gênero); montar
  novas camadas.
- `AvatarDisplay.tsx`: reescrita dirigida — dentro do root: `back`(z1)→
  `BodyImage`(z2, sem clipPath)→`garment`(z3, mesmo box do body)→**head-group**
  (um MotionAnchor com tilt: hair+headgear+expression inclinam juntos)→`hand`(z7);
  fora: bg/pet/frame intocados. Fallback 404 degrada para traje de Aprendiz.
- `slotDefinitions.ts`: 8 entradas; `requiresGenderVariant` removido.
- Assets: itens mantêm ids/slugs; muda o PNG no path (outfit sem sufixo `-male`;
  heads redesenhados como attachments). **Arte real ainda é placeholder →
  retrabalho ~zero; momento certo do projeto para a troca.**

## 7. Riscos & o que NÃO fazer
**Riscos:** registro garment×corpo nos 5 tons (mitiga contorno #3d2b1f na borda +
QA doc 07; testar no uniforme Soldado antes dos outros 6 — risco técnico nº1);
cabelo×chapéu (regra "chapéu oculta cabelo" + válvula `showsHair`); migração suave
(Ajuste 2); escopo de **arte é o caminho crítico** (~32 assets p/ v3 completa —
ainda menos que o 2× por gênero futuro). Trade-off assumido: perde escolha
explícita de gênero; postura consciente (identidade via pele+cabelo é maior, não
menor).

**NÃO fazer:** rosto composível/barbas; micro-slots; sistema genérico de upgrade;
loja/moeda/passes/emotes vendáveis; insígnia como decalque; tint/hue em runtime;
2º body family/animações compradas/editor de pose; qualquer coluna de render no DB.

## 8. Faseamento (ROI ÷ risco)
- **F0 — Arte de fundação (bloqueia tudo):** Estrategista base × 5 tons +
  templates atualizados + uniforme Soldado como prova do registro garment. Gate:
  5 tons + garment Soldado passam QA nos 4 tamanhos.
- **F1 — Migration + render rewrite:** migration `avatar_v3`; reescrita
  `bodyFamilies`/`assetResolver`/`resolvedAvatar`/`AvatarDisplay`;
  `criar-personagem`→pele+cabelo. Gate: build+e2e; avatar antigo degrada sem erro;
  knockout/código per-gender deletados.
- **F2 — Patente→uniforme (maior ROI):** `complete_lesson_step` concede+
  auto-equipa+capa; backfill; 7 uniformes (arte tier a tier, Soldado/Aspirante
  primeiro). Gate: completar trilha veste uniforme e aparece no ranking.
- **F3 — Relíquias:** `hand`→"Relíquia" na UI; 2 famílias + one-shots ligados a
  conquistas/trilhas. Gate: concessão idempotente.
- **F4 — Catálogo:** cabelos, headgear redesenhado, primeiras capas `back`,
  rebalance de baús.
- **F5 — Expressões runtime (polish, opcional):** 3 overlays no head-group por
  evento, só `lg`/`xl`.

F1+F2 entregam a promessa central: **olhar o avatar e ler a jornada**. Depois, o
sistema só cresce por seeds e assets — nunca mais por schema.

---

## Estado real hoje (julho/2026)

A v2 está implementada e a v3 **ainda não foi iniciada**. O que existe em
produção usa `dressed_base` para `outfit` e `head_swap` para `head` — e é por isso
que **14 dos 16 itens de cabeça e roupa não aparecem no boneco**: só
**Bandana Tática** e **Camiseta do Clube** têm as variantes por gênero que esses
render modes exigem. Nos outros 14 a imagem dá 404 e o `AvatarLayer`
(`src/components/avatar/AvatarDisplay.tsx`) devolve `null` em silêncio.

Isso é argumento a favor de executar a v3 (ou ao menos produzir os assets
faltantes) **antes do lançamento**: para crianças, o loop de recompensa é o
cosmético — abrir um baú, ganhar um Elmo de Cavaleiro, equipar e o boneco não
mudar quebra a promessa central da gamificação no primeiro contato.
