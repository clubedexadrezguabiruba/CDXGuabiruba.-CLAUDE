# Avatar / Arte / Baús — Backlog de Execução

> Lista completa de tarefas para refazer o subsistema. Ordenada por dependência:
> nada numa fase começa antes de a anterior fechar o gate.
>
> **Fontes:** decisões em `12-avatar-v4-plano-completo.md`, verificações em
> `13-checklist-de-verificacao.md`.
>
> **Convenções:** 🤖 = eu faço · 👤 = você faz · 🔒 = gate que precisa passar.
>
> **Decisões que mudaram depois do doc 12:**
> - **D25 revertida:** as trilhas vão crescer para 7, então a patente volta a ser
>   por **trilha completa** (mais significativa que contagem de aulas). O defeito
>   real não era a régua — era nada verificar a premissa. Vira gate (T1.6).
> - **Arte:** eu gero a primeira passada dos 45 assets em SVG; você refina.
> - **Sem piloto** antes do redesenho — decisão do usuário, registrada.

---

# F0 — Fundação técnica

Nada aqui depende de arte. Pode começar hoje.

## Detecção e integridade

- [ ] **T0.1** 🤖 Manifesto de assets: script varre `public/items/`, gera `assetManifest.ts`
- [ ] **T0.2** 🤖 `assetResolver` consulta o manifesto em vez de montar caminho por convenção
- [ ] **T0.3** 🤖 `AvatarLayer` falha alto em asset ausente (hoje devolve `null` em silêncio)
- [ ] 🔒 **Gate:** item de catálogo sem asset **quebra o build**. Provar injetando um item órfão
- [ ] **T0.4** 🤖 Gate reporta asset órfão (arquivo sem item correspondente)

## Ponte — loop honesto sem arte

- [ ] **T0.5** 🤖 `claim_chest` sorteia só itens que renderizam (32 dos 77)
- [ ] 🔒 **Gate:** abrir 20 baús, todo item recebido aparece no boneco
- [ ] ⚠️ Extrair o corpo da função de `pg_get_functiondef` do banco **vivo**, nunca de migration antiga

## Pipeline de arte

- [ ] **T0.6** 🤖 `scripts/avatar/vetorizar.ts`: raster → VTracer → encaixe na paleta → SVGO
- [ ] **T0.7** 🤖 `src/lib/avatar/palette.ts`: rampas de pele (8), cabelo (5), destaque por raridade
- [ ] **T0.8** 🤖 Validador de paleta: falha se duas cores estão próximas demais para não se fundirem
- [ ] **T0.9** 🤖 Folha de contato: renderiza cada item sobre a base nos 4 tamanhos, gera 1 imagem
- [ ] **T0.10** 🤖 Página de teste de tamanhos: 56 / 100 / 200 / 340 px, com fundo, moldura e pet

## Decisões que dependem de ver

- [ ] **T0.11** 🤖 Gerar o boneco em **1:2, 1:3 e 1:4** e renderizar a 56 px
- [ ] **T0.12** 👤 **Escolher a proporção (D1)** olhando as três
- [ ] **T0.13** 🤖 Converter 1 pet para SVG animado por CSS e comparar com o APNG
- [ ] **T0.14** 👤 **Decidir se pets viram SVG (§6.5)** — muda o orçamento de 20 assets

## Gates de banco que faltam

- [ ] **T0.15** 🤖 `scripts/verify/phase8/`: RPCs presentes; CHECK de slots; UNIQUE de `user_inventory` e `user_equipped`
- [ ] **T0.16** 🤖 **No mesmo gate:** assertar que `inventory_select_classmate` e `equipped_select_classmate` **NÃO existem** — vazavam inventário entre colegas de turma
- [ ] **T0.17** 🤖 Gate da premissa: nº de trilhas no banco = nº de títulos no mapa. Foi essa divergência silenciosa que tornou 5 de 7 patentes inalcançáveis
- [ ] **T0.18** 🤖 Adicionar `verify:phase8` ao `verify:all` e ao CI

## Testes unitários — não existe nenhum hoje

- [ ] **T0.19** 🤖 `src/lib/avatar/__tests__/`: resolver de asset
- [ ] **T0.20** 🤖 Ordem de camadas e z-index
- [ ] **T0.21** 🤖 Encaixe na paleta (incluindo o caso de cores próximas)
- [ ] **T0.22** 🤖 Offset de anchor por item

---

# F1 — Arte de fundação

Bloqueia todo o resto da arte.

- [ ] **T1.1** 🤖 Corpo base na proporção escolhida: rosto em **paths próprios** (habilita expressões), cabelo curto e traje de treino baked
- [ ] **T1.2** 🤖 Uniforme Soldado — prova do `garment` sobre o corpo
- [ ] **T1.3** 👤 **Criticar e refinar** — principalmente o rosto, que é onde mora o carisma
- [ ] **T1.4** 🤖 Aplicar os ajustes e regerar
- [ ] 🔒 **Gate:** lê a 56 px · registra nos 8 tons sem vazar cor · paleta não funde nenhuma classe · passa na folha de contato

---

# F2 — Migration e reescrita do render

## Banco

- [ ] **T2.1** 🤖 Migration `avatar_v4` (aditiva):
  - `items.slot` e `user_equipped.slot` CHECK += `hair`, `back`
  - `user_inventory.source` CHECK += `title`
  - `users.avatar_skin` (8 tons, default `medio`)
  - `users.avatar_hair_color`, `avatar_bg_color` (D27)
  - `update_avatar_identity` substitui `update_avatar_base`
  - recriar `user_public_profiles` com os campos novos
  - `users.avatar_base` **deprecada, não dropada**
- [ ] **T2.2** 🤖 Migração suave: usuários existentes recebem tom default, mantêm `avatar_chosen=true`, sem re-onboarding

## Render

- [ ] **T2.3** 🤖 `constants.ts`: `viewBox` novo, `SIZE_CONFIG`, z-order
- [ ] **T2.4** 🤖 `bodyFamilies.ts`: `ESTRATEGISTA_V2`, anchors únicos + offset por item
- [ ] **T2.5** 🤖 `types.ts`: remover `GenderVariant`, `dressed_base`, `head_swap`
- [ ] **T2.6** 🤖 `renderModes.ts`: `garment`, `head_attach`, `back_attach`
- [ ] **T2.7** 🤖 `resolvedAvatar.ts`: **deletar todo o knockout** (clipPath por gênero)
- [ ] **T2.8** 🤖 `AvatarDisplay.tsx`: nova pilha de camadas, sem clipPath, head-group com tilt
- [ ] **T2.9** 🤖 Fallback: uniforme ausente cai para o traje da base, nunca boneco pelado

## Identidade e telas

- [ ] **T2.10** 🤖 `criar-personagem`: male/female → **tom de pele + cabelo + cor**
- [ ] **T2.11** 🤖 `viewBox` de cabeça para uso como foto de perfil
- [ ] **T2.12** 🤖 **D30** — avatar na **navbar** (32 px, cabeça)
- [ ] **T2.13** 🤖 **D30** — avatar no **ranking geral** + moldura de raridade *(dados já chegam: `get_ranking` devolve `avatar_config`)*
- [ ] **T2.14** 🤖 **D30** — avatar no **ranking de turma**
- [ ] **T2.15** 🤖 **D30** — avatar no **mural**
- [ ] **T2.16** 🤖 **D30** — avatar na **Companhia** (lista de membros)
- [ ] 🔒 **Gate:** `npm run build` · e2e 149/149 · `verify:all` 12/12 · gate de assets 100% · avatar antigo degrada sem erro · nenhum código per-gender restante

---

# F3 — Patente → uniforme

- [ ] **T3.1** 🤖 `complete_lesson_step`: ao completar trilha, concede + auto-equipa uniforme do tier
- [ ] **T3.2** 🤖 Capa `back` junto, a partir de Comandante (slot existe; arte depois)
- [ ] **T3.3** 🤖 Backfill idempotente para quem já passou do marco
- [ ] ⚠️ Extrair de `pg_get_functiondef` do banco vivo. `pg_get_functiondef` **não emite o `;` final** depois de `$function$`
- [ ] 🔒 **Gate e2e:** completar trilha veste o uniforme, e ele aparece no ranking

---

# F4 — Catálogo completo

## Arte (primeira passada minha, refino seu)

- [ ] **T4.1** 🤖 6 uniformes restantes (Aspirante → Lenda), silhueta constante
- [ ] **T4.2** 🤖 5 cabelos
- [ ] **T4.3** 🤖 6 chapéus
- [ ] **T4.4** 🤖 6 relíquias (2 famílias × 3 tiers)
- [ ] **T4.5** 👤 Verificar se os 8 backgrounds antigos combinam com o estilo novo
- [ ] **T4.6** 🤖 Redesenhar backgrounds, **se** destoarem (+8)
- [ ] **T4.7** 🤖/👤 20 pets — eu sou fraco em orgânico, então aqui você provavelmente refina bastante
- [ ] **T4.8** 👤 Passada de refino em tudo

## Dados

- [ ] **T4.9** 🤖 Reseed do catálogo: 77 → **60 itens**
- [ ] **T4.10** 🤖 Pirâmide de raridade **40/30/20/10** (hoje 19/20/20/18)
- [ ] **T4.11** 🤖 **D16** — pool de baú só com estético; nunca uniforme nem relíquia
- [ ] **T4.12** 🤖 **D27** — escolha de cor de cabelo e fundo, validada no servidor
- [ ] 🔒 **Gate:** manifesto 100% coberto · folha de contato revisada · nenhum item invisível

---

# F5 — Polimento

- [ ] **T5.1** 🤖 **D8** — 4 expressões por classe CSS (neutra, vitória, concentração, derrota)
- [ ] **T5.2** 🤖 **D29** — baú de escolha: 1 entre 3 em marcos
- [ ] **T5.3** 🤖 Capas `back` — primeiras 3-4
- [ ] **T5.4** 🤖 Acessibilidade: `alt` com nome, contraste, teclado, `prefers-reduced-motion`
- [ ] **T5.5** 👤 Medir no **celular mais fraco disponível** — ranking com 30 alunos
- [ ] **T5.6** 🤖 **D21** string canônica — só se a performance pedir

---

# Adiado conscientemente

| item | por quê |
|---|---|
| **D21** string canônica | resolve problema de escala que não existe com ~100 alunos |
| **D22** composição no servidor | com SVG, compor é concatenar string — problema sumiu |
| Revisão das aulas | prioridade do usuário: depois do avatar |
| Piloto com turma | decisão do usuário |
| Motor de animação (Rive/Lottie) | dependência nova; CSS já resolve o respiro |

---

# Riscos vivos

| risco | mitigação |
|---|---|
| Minha arte sair dura ou genérica | T1.3 é ponto de crítica **antes** dos outros 43; SVG é editável |
| Pets orgânicos ficarem fracos | T4.7 assume refino seu |
| Uniforme não registrar nos 8 tons | testar **só no Soldado** (F1) antes dos outros 6 |
| Cores da paleta se fundirem | validador T0.8 |
| `complete_lesson_step` regredir | extrair do banco vivo; `verify:no-dup-rpc` é ratchet |
| Trilhas crescerem e quebrarem títulos de novo | gate T0.17 |

---

# Resumo

| fase | tarefas | depende de você? |
|---|---|---|
| F0 | 22 | só T0.12 e T0.14 (duas decisões) |
| F1 | 4 | T1.3 (crítica da arte) |
| F2 | 16 | não |
| F3 | 3 | não |
| F4 | 12 | T4.5, T4.7, T4.8 (refino) |
| F5 | 6 | T5.5 (medir no celular) |
| **total** | **63** | **7 pontos** |

---

# Método de geração de arte (pesquisado em 2026-07-29)

**A Anthropic não tem API de geração de imagem.** Claude não gera raster — é
decisão deliberada da empresa, não lacuna temporária. O que existe:

| capacidade | serve? |
|---|---|
| Gerar SVG por código | **sim** — é o caminho |
| Ler imagens (vision) | **sim** — e é o que fecha o ciclo |
| Gerar PNG/JPEG | não existe |
| MCP com FLUX / Stable Diffusion | existe, mas exige serviço externo e chave |

## O ciclo fechado

```
escrever SVG  →  sharp renderiza a 56 e 340 px  →  LER o PNG  →  criticar  →  refinar
```

O terceiro passo é o que importa: **o agente enxerga o próprio resultado** e
itera sozinho, sem o usuário em cada volta. Validado nesta sessão.

## Por que isso vence um gerador de imagem, aqui

- **Editável** — o usuário abre o SVG e ajusta um path; PNG de IA é pegar ou largar
- **Consistente por construção** — paleta, `viewBox` e regra do "1 herói" aplicadas
  por código, não por revisão manual
- **Verificável** — o manifesto (T0.1) e a folha de contato (T0.9) conferem
  cobertura e alinhamento automaticamente

## Configuração recomendada

- Carregar a skill **`frontend-design`** antes de decisões estéticas
- Renderizar sempre nos **dois extremos** (56 px e 340 px) antes de julgar —
  o menor é o que manda
- Não julgar arte por descrição: **renderizar e olhar**
- Limite honesto: geometria e formas chapadas saem bem; orgânico (pets) e
  carisma facial saem fracos e pedem refino do usuário
