# Estado — Recruta 64

> **Este arquivo é gerado. Não edite à mão** — o gate `verify:estado` reprova se
> você editar. A única parte sua é o bloco **Agora**, logo abaixo, que sobrevive a
> cada regeneração. Todo o resto é recontado do repositório por `npm run estado`.
>
> Existe porque o estado deste projeto vivia em 13 lugares que discordavam entre si.
> Ver o cabeçalho de `scripts/estado.ts` para os números daquela auditoria.

## Agora

<!-- AGORA:inicio -->
**Em execução:** avatar kokeshi, branch `avatar/vtracer`. Base visual aprovada no
Bloco 1d.

- **2a — o cabelo voltou, e a rota de arte é o caminho.** **Decidido e provado em
  2026-08-06/07:** o Doug edita a arte sobre um render do próprio compositor e a
  peça sai medida. Duas peças aprovadas por ela — **espetado** (Bloco 9) e
  **chanel** (Bloco 14, variante `fiel`, preto transcrito). O processo está em
  `docs/avatar/19-rota-de-arte-runbook.md`; o registro de execução, número a
  número, em `scripts/avatar/arte/ESTADO-DA-ROTA.md`.
- **2b** — arremate do tronco (2b.0) e o `avatar:garment`, que hoje passa por
  vacuidade (2b.1). Mexe em tronco; o cabelo é cortado pelo `clipPath` da cabeça.

**A prioridade virou em 2026-08-09 (D4): a tela do aluno vem primeiro.** A ordem
agora é **Lote 1** (feito) → **medir o R1** → **Lote 3** (Next 16.2.11) → **F2**.
O Lote 2 e a linha A5 da fila do Codex ficam parados, porque existem para
destravar desenho. **Antes de dimensionar a F2, conferir se ela depende do 2b**
(traje) — o que o painel conta são tarefas da F2, não o traje. Quando existir, a
tela deve consumir `MODELOS_CABELO`/`CABELOS` como fonte, sem hardcodar modelos.

**O avatar espera, e o que sobrou dele está em ordem:** colar espetado e chanel em
`CABELOS` · reentrada da `entrada-2` quando o retoque do Doug chegar (ajuste fino,
**não** será refeita) · rodada de unificação (espetado pela variante `lei`, com
nova aprovação visual) · a luz, por último (decisão B).

**Decisões travando trabalho:**

- **Régua da patente — três versões vivas e incompatíveis.** 15 aulas por nível
  (doc 15 §3), 30 aulas (memória do `UPDATE` sem `UPSERT`), e 0·26·47·66·84·101·115·126
  (currículo §, "decidida e não executada"). Trava o Bloco 7b. Nenhum script
  resolve isto — é escolha.
- **Doc 13 inerte.** 92 itens de auditoria, **zero marcados desde que o arquivo
  nasceu**. Ou passa a ser usado, ou vai para `_superado/`.

**Pendências grandes fora do avatar:** fase 11 (PWA — não existe manifest nem
service worker) e fase 12 (lançamento). Fase 6C (extras) segue aberta.

**A revisitar antes do lançamento:** o repositório é público e vai guardar dados
de alunos menores de idade.
<!-- AGORA:fim -->

## Git

<!-- VOLATIL:inicio -->
| | |
|---|---|
| **Branch** | `avatar/vtracer` |
| **Commits à frente de `origin/main`** | 70 |
| **Árvore** | limpa |
| **Último commit** | e1d69a2 · 2026-08-09 · docs(codex): o contrato da oficina ganha as cinco linhas que faltavam |
<!-- VOLATIL:fim -->

## Fases do produto

**10 de 12 feitas.**

Abertas:

- **11. Sound Design + PWA + Polish** — não existe manifest nem service worker
- **12. Testes Finais e Lançamento**

_Fonte: tabela §Estado real de `docs/Recruta64_Roadmap_Tecnico_v1.md`._

## Gates

**19 entradas** em `verify:all`, que expandem para **26 scripts**. O número difere entre branches — a `main` não tem `verify:pose` nem `verify:design-tokens`.

`verify:phase2` · `verify:seeds` · `verify:revanche` · `verify:rush` · `verify:phase5` · `verify:phase6` · `verify:avatar-assets` · `verify:avatar-db` · `verify:chest-pool` · `verify:paleta-patentes` · `verify:turmas` · `verify:privileges` · `verify:xp-curve` · `verify:no-dup-rpc` · `verify:puzzle-authority` · `verify:curriculo` · `avatar:pose` · `verify:design-tokens` · `verify:estado` · `verify:aberturas` · `verify:fonte-peca` · `arte:fixtures` · `arte:reguas` · `arte:cor-proibida` · `arte:escala` · `arte:pecas-check`

## Frentes

| frente | fechadas | detalhe em |
|---|---|---|
| Backlog do avatar | **25 de 67** (37%) | `docs/avatar/14-backlog-execucao.md` |
| Auditoria do avatar | **2 de 92** (2%) | `docs/avatar/13-checklist-de-verificacao.md` |
| Catálogo de cabelo | **5 de 10** no mínimo (faltam **5**) | `docs/avatar/19-rota-de-arte-runbook.md` |

Backlog do avatar, fase a fase:

| F0 | F1 | F2 | F3 | F4 | F5 |
|---|---|---|---|---|---|
| 19/23 | 2/6 | 0/16 | 3/5 | 1/11 | 0/6 |

_Conta tarefas numeradas (`**T0.1**`), que é a régua do próprio doc 14. Contar todos os checkboxes dá um número maior porque inclui as linhas de gate._

## Passivo congelado

| o quê | quanto | congelado desde |
|---|---|---|
| Itens que não vestem o boneco | **45** | 2026-07-29 |
| Itens sem miniatura | **30** | 2026-07-29 |
| Arquivos órfãos | **1** | 2026-07-29 |
| Cores cruas — teto tolerado | **1331 em 69 arquivos** | ratchet |
| RPCs redefinidas mais de uma vez | **51 (pior: puzzle_attempt, 12×)** | ratchet |

_Ratchets: o gate reprova se crescerem. Só encolhem com `--update`._

## Repositório

| | |
|---|---|
| **Migrations** | 72 |
| **Rotas (`page.tsx`)** | 33 |
| **Arquivos de teste** | 15 |
| **Primitivos de UI** | 4 |

## Frescor das fontes

<!-- VOLATIL:inicio -->
| doc | última edição |
|---|---|
| `CLAUDE.md` | 2026-08-07 |
| `README.md` | 2026-08-03 |
| `docs/Recruta64_Roadmap_Tecnico_v1.md` | 2026-08-03 |
| `docs/avatar/14-backlog-execucao.md` | 2026-08-08 |
| `docs/avatar/15-plano-ate-pronto.md` | 2026-08-08 |
| `docs/avatar/13-checklist-de-verificacao.md` | 2026-08-06 |
| `docs/curriculo/01-curriculo-definitivo-v1.md` | 2026-08-06 |
| `docs/curriculo/02-plano-tecnico-trilha1-v1.md` | 2026-08-05 |

_Doc parado há semanas e ainda citado como fonte é candidato a `_superado/`._
<!-- VOLATIL:fim -->
