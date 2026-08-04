# Estado — Recruta 64

> **Este arquivo é gerado. Não edite à mão** — o gate `verify:estado` reprova se
> você editar. A única parte sua é o bloco **Agora**, logo abaixo, que sobrevive a
> cada regeneração. Todo o resto é recontado do repositório por `npm run estado`.
>
> Existe porque o estado deste projeto vivia em 13 lugares que discordavam entre si.
> Ver o cabeçalho de `scripts/estado.ts` para os números daquela auditoria.

## Agora

<!-- AGORA:inicio -->
**Em execução:** avatar kokeshi, branch `avatar/estilo-kokeshi`. Base visual
aprovada no Bloco 1d. Duas frentes abertas, e **elas não dependem uma da outra**:

- **2a — o cabelo voltou.** O código está pronto e a medição passou; **a arte
  reprovou em 2026-08-03** ("tudo muito quadrado, sem toque humano"). Diagnóstico
  com as quatro causas medidas no **2a.4** do doc 15; briefing para a sessão de
  desenho em `.scratch/estilo/BRIEFING-CABELO.md`.
- **2b** — arremate do tronco (2b.0) e o `avatar:garment`, que hoje passa por
  vacuidade (2b.1). Mexe em tronco; o cabelo é cortado pelo `clipPath` da cabeça.

**Decisões travando trabalho:**

- **Cabelo — por qual caminho a arte volta.** Desenho em código pela skill
  `avatar-desenho` (que nunca rodou nesta peça), arte gerada pelo Doug e convertida
  por régua, ou line-art vetorial. Trava o 2a. As quatro perguntas estão no briefing.

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
| **Branch** | `avatar/estilo-kokeshi` |
| **Commits à frente de `origin/main`** | 36 |
| **Árvore** | **26 arquivos sujos** |
| **Último commit** | f1724aa · 2026-08-04 · feat(cabelo): o laço para de dobrar na cortina, e o resto perde o nome errado |
<!-- VOLATIL:fim -->

## Fases do produto

**10 de 12 feitas.**

Abertas:

- **11. Sound Design + PWA + Polish** — não existe manifest nem service worker
- **12. Testes Finais e Lançamento**

_Fonte: tabela §Estado real de `docs/Recruta64_Roadmap_Tecnico_v1.md`._

## Gates

**17 entradas** em `verify:all`, que expandem para **20 scripts**. O número difere entre branches — a `main` não tem `verify:pose` nem `verify:design-tokens`.

`verify:phase2` · `verify:seeds` · `verify:revanche` · `verify:rush` · `verify:phase5` · `verify:phase6` · `verify:avatar-assets` · `verify:avatar-db` · `verify:chest-pool` · `verify:paleta-patentes` · `verify:turmas` · `verify:privileges` · `verify:xp-curve` · `verify:no-dup-rpc` · `verify:puzzle-authority` · `verify:curriculo` · `avatar:pose` · `verify:design-tokens` · `verify:estado` · `verify:aberturas`

## Frentes

| frente | fechadas | detalhe em |
|---|---|---|
| Backlog do avatar | **25 de 67** (37%) | `docs/avatar/14-backlog-execucao.md` |
| Auditoria do avatar | **0 de 92** (0%) | `docs/avatar/13-checklist-de-verificacao.md` |

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
| **Migrations** | 71 |
| **Rotas (`page.tsx`)** | 32 |
| **Arquivos de teste** | 13 |
| **Primitivos de UI** | 4 |

## Frescor das fontes

<!-- VOLATIL:inicio -->
| doc | última edição |
|---|---|
| `CLAUDE.md` | 2026-08-03 |
| `README.md` | 2026-08-03 |
| `docs/Recruta64_Roadmap_Tecnico_v1.md` | 2026-08-03 |
| `docs/avatar/14-backlog-execucao.md` | 2026-08-04 |
| `docs/avatar/15-plano-ate-pronto.md` | 2026-08-04 |
| `docs/avatar/13-checklist-de-verificacao.md` | 2026-07-31 |
| `docs/curriculo/01-curriculo-definitivo-v1.md` | 2026-07-31 |

_Doc parado há semanas e ainda citado como fonte é candidato a `_superado/`._
<!-- VOLATIL:fim -->
