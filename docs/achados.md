# Achados abertos — o que se sabe e ainda não se consertou

> **Achar não é consertar.** Nada nesta lista vira trabalho sem o Doug mandar.
> Quem acha (Codex, ChatGPT, Claude) **registra aqui e para**; quem decide a hora
> é o Doug; quem executa é o Claude.
>
> Existe porque, até 2026-08-07, os achados viviam espalhados entre mensagem de
> commit, `docs/avatar/13-checklist-de-verificacao.md`, o bloco AGORA do
> `docs/ESTADO.md` e a conversa — que morre no `/clear`. Isso é a doença que o
> `CLAUDE.md` descreve, não a cura.

**Antes de reportar, confira se já está aqui.** Achado repetido gasta a rodada.

## Como ler a gravidade

| | Significa |
|---|---|
| 🔴 **RISCO EM PRODUÇÃO** | pode expor dado de aluno ou furar a Regra Inviolável nº 1 |
| 🟠 **TRAVA TRABALHO** | alguém está parado, ou vai construir sobre premissa errada |
| 🟡 **PROMESSA SEM LASTRO** | o projeto diz que verifica algo que não verifica |
| 🔵 **DECISÃO / DIVERGÊNCIA** | não é bug; é escolha não tomada ou documento desatualizado |

**Estado da prova:** `MEDIDO` (gate rodou) · `VERSIONADO` (está na migration, produção não medida) · `LIDO` (está no texto).

---

## 🔴 Risco em produção

### R1 — O navegador escreve direto em tabelas de tentativa e progresso
**Prova:** `VERSIONADO` — `supabase/migrations/20260216180200_rls.sql:59-68,81-93`

```
attempts_insert_own        ON user_puzzle_attempts   FOR INSERT
lesson_progress_insert_own ON user_lesson_progress   FOR INSERT
lesson_progress_update_own ON user_lesson_progress   FOR UPDATE
```

Um aluno autenticado pode gravar nessas tabelas **sem passar por RPC**. A Regra
Inviolável nº 1 diz que toda concessão acontece exclusivamente no servidor via
RPC. Se algo lê essas tabelas para estatística, ofensiva ou rating, o dado é
forjável pelo cliente.

**O que falta para fechar:** medir o privilégio efetivo no banco — a policy só
vale se o papel tiver `GRANT` de tabela. Estender `verify:privileges` com a
asserção de escrita, rodar, e só então decidir se precisa de migration. Depois,
rastrear quem lê essas tabelas para dimensionar o estrago.
**Achado por:** Codex, tarefa A1, 2026-08-07. Confirmado pelo Claude.
**Custo estimado:** meia hora até a tela vermelha ou verde.

### R2 — `titles_select_classmate` nunca foi removida, e o gate não a vigia
**Prova:** `VERSIONADO` — `20260216180200_rls.sql:232` ·
`scripts/verify/phase8/verify-avatar-db.ts:53`

Três policies "de colega" nasceram juntas. Duas foram removidas como vazamento
(`inventory_select_classmate`, `equipped_select_classmate`) e o gate as proíbe
pelo nome. A terceira nunca foi dropada e **não consta da lista do gate**.

Provavelmente é intencional — o título já aparece no ranking público. Mas
ninguém escreveu isso, e o doc 13 fala das irmãs como se fossem só duas.
**Assimetria sem justificativa registrada, não vazamento provado.**

**O que falta para fechar:** decidir se é intencional. Se for, escrever o porquê
e o gate passa a permitir explicitamente. Se não for, dropar e acrescentar à
lista.
**Achado por:** Codex, piloto P0, 2026-08-06.

---

## 🟠 Trava trabalho

### T1 — A régua da patente: por trilha, ou por dose fixa?
**Prova:** `VERSIONADO` — `20260729140000_patente_marcos_15_aulas.sql:31`

> A patente acompanha cada **trilha** curricular, com marcos irregulares
> 26·47·66·84·101·115·126 — ou é progressão **gamificada independente**, a cada
> 15 aulas?

Não são três versões vivas, como o `ESTADO.md` diz. São duas: o histórico
versionado e o doc 15 §3 **concordam em 15**; o currículo quer as fronteiras de
trilha. A versão de 30 morreu duas horas depois de nascer, na migration
seguinte.

**Trava:** o Bloco 7b do avatar (uniforme por patente) e o B0.5 do currículo, que
assume a escada do currículo enquanto o banco tem 15.
**Falta ainda:** medir `title_tiers.lessons_required` no banco. Migration prova
intenção, não estado.
**Quem decide:** Doug. É pedagogia e produto, não investigação técnica.

### T2 — O `docs/ESTADO.md` mente sobre o próprio estado
**Prova:** `LIDO` — bloco AGORA, escrito à mão (linhas 12–41)

Quatro erros no documento que o `CLAUDE.md` manda ler primeiro:

1. diz "três versões vivas e incompatíveis" da régua da patente — são duas (T1)
2. diz que a branch em execução é `avatar/estilo-kokeshi` — é `avatar/vtracer`
3. lista o doc 13 como decisão aberta — ele fechou por uso (0 de 92 → 2 de 92)
4. a linha 19 aponta para `.scratch/estilo/BRIEFING-CABELO.md`, **que não
   existe na pasta** — e é o briefing citado como fonte das quatro perguntas que
   travam o Bloco 2a

**O que falta:** reescrever o bloco AGORA. Ele é a única parte manual de um
arquivo gerado, então o gate `verify:estado` não o alcança.

---

## 🟡 Promessa sem lastro

### G1 — Três gates prometidos por nome que não existem
**Prova:** `LIDO` — `docs/curriculo/02-plano-tecnico-trilha1-v1.md` §7

`verify:curriculo-banco` (B0), `verify:trilha1` (B2) e `verify:competencia` (B3)
são citados como travas dos blocos de execução e **não estão no `package.json`**.
O que existe é `verify:curriculo`, que confere somas do documento, não o lastro
do banco.

Não é urgente — os blocos B0–B7 têm zero linhas de código. Mas o plano promete
verificação que não existe, e quem for construir vai descobrir tarde.

### G2 — O gate de assets é um ratchet com 45 itens congelados
**Prova:** `MEDIDO` — `scripts/verify/phase8/asset-baseline.json`

O gate `verify:avatar-assets` só reprova se o número **crescer**. Os 45 itens que
não vestem o boneco seguem tolerados por desenho — e são o **bloqueador de
lançamento nº 1** declarado no próprio doc 13.

A marca verde no doc 13 é sobre o gate existir, não sobre o bug estar resolvido.
Já está escrito lá, para ninguém ler o quadradinho como "resolvido".

### G3 — `verify:privileges` §4 vigia leitura, não escrita
**Prova:** `MEDIDO` — `scripts/verify/security/verify-privileges.ts`

A seção 4, criada em 2026-08-06, confere `SELECT` numa lista de objetos. Não
confere `INSERT`/`UPDATE`/`DELETE` em tabela nenhuma — que é exatamente o que o
R1 precisa.

---

## 🔵 Decisão ou divergência

### D1 — O ranking de turma ignora `ranking_visible` de propósito
**Prova:** `VERSIONADO` — `20260316100000_phase10_rankings.sql:232,277-284`

O comentário da migration declara: *"Ignora ranking_visible (turma sempre vê
todos os membros)"*. O requisito da §7 do doc 13 diz que o opt-out deve valer
também no avatar. **Requisito e código discordam, e a discordância é deliberada.**

A outra metade deste achado **fechou** em 2026-08-06: a matview era legível por
`anon` e o opt-out era cortesia da camada de RPC. Revogado e vigiado
(`81a2723`). Falta decidir se o ranking de turma é exceção legítima.
**Quem decide:** Doug.

### D2 — Reseed do catálogo: 60 ou 54?
**Prova:** `LIDO` — `docs/avatar/14-backlog-execucao.md` T4.9 (60) ×
`docs/avatar/15-plano-ate-pronto.md` §9.1 (54)

O doc 15 vence quando diverge, segundo o próprio `CLAUDE.md`. Falta o doc 14
receber a atualização.

### D3 — "Pool de baú nunca relíquia" ficou obsoleto
**Prova:** `LIDO` — `docs/avatar/14-backlog-execucao.md` T4.11

A relíquia foi cortada pela decisão D-E; o lugar dela é a moldura (`frame`). O
texto do backlog não acompanhou.

### D4 — Por qual caminho a arte do cabelo volta
**Prova:** `LIDO` — bloco AGORA do `ESTADO.md`

Listado como decisão travada, mas **provavelmente já resolvido na prática**: os
commits `5db008e`, `ba18dd0` e `49389a6` de 2026-08-06 fecharam a rota de arte e
o chanel. Conferir antes de tratar como aberto.

---

## Fechados — ficam aqui como precedente

| # | Achado | Fechado em | Como |
|---|---|---|---|
| ✅ | `user_public_profiles` era MATERIALIZED VIEW legível por `anon` e `authenticated`, com `display_name` cru e `ranking_visible` dentro — o opt-out era cortesia da camada de RPC | 2026-08-06 | gate estendido (§4 de `verify:privileges`), reprovou, migration `20260806150000` aplicada, gate passou. `81a2723` |
| ✅ | Doc 13 inerte, 92 itens e zero marcados desde que nasceu | 2026-08-06 | passou a ser usado: 2 comprovados, e a linha do opt-out virou conserto medido. `260e657`, `ed393ad` |
| ✅ | `CLAUDE.md` e o currículo §13 afirmavam que o plano técnico da T1 não existia | 2026-08-06 | corrigido; `scripts/estado.ts` passou a vigiar o doc 02. `f6b97f8` |

O precedente que importa: **os três fecharam com gate ou com prova medida, nunca
com relatório.** É o padrão a repetir.
