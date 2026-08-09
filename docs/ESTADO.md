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
era **Lote 1** → **R1** → **Lote 3** → **F2**; os dois primeiros fecharam no mesmo
dia. **O que resta é: conferir a dependência do 2b → Lote 3 (Next 16.2.11) → F2.**
O Lote 2 e a linha A5 da fila do Codex ficam parados, porque existem para
destravar desenho.

**A conferência do 2b vem antes do Lote 3, e é a mais barata que existe aqui:** se
a tela do aluno mostra o boneco **vestido**, ela depende do **2b (traje)**, que
está aberto e cujo pipeline antigo foi declarado morto — *"nenhum traje existe
ainda, o Soldado é o primeiro"*. As tarefas que o painel conta abaixo são da F2; **o
traje não está nessa conta.** Meia hora de leitura decide se a F2 é uma fase ou
duas. Quando a tela existir, ela deve consumir `MODELOS_CABELO`/`CABELOS` como
fonte, sem hardcodar modelos.

**O R1 fechou em 2026-08-09** — nenhuma das 30 tabelas de `public` aceita escrita
direta do navegador, `verify:all` está verde. Três migrations (`20260809120000`,
`130000`, `140000`) e duas RPCs novas: `set_preferencias` e `set_task_active`. O que
sobrou dele está registrado como **R3** em `docs/achados.md`, e é decisão, não
trabalho parado.

**Pendência de deploy, não medida:** as migrations do R1 foram aplicadas ao Supabase
de **produção**; o código das duas telas que dependem delas está nesta branch, 71
commits à frente da `main` e nunca mesclada. Se houver site no ar servindo a `main`,
Configurações e o liga/desliga de tarefa estão quebrados em silêncio. **Ninguém
conferiu se há deploy ativo.**

**O avatar espera, e o que sobrou dele está em ordem:** colar espetado e chanel em
`CABELOS` · reentrada da `entrada-2` quando o retoque do Doug chegar (ajuste fino,
**não** será refeita) · rodada de unificação (espetado pela variante `lei`, com
nova aprovação visual) · a luz, por último (decisão B).

**Decisões travando trabalho:**

- **Régua da patente — duas versões vivas, não três** (achado **T1**). O histórico
  versionado e o doc 15 §3 **concordam em 15 aulas** por nível; o currículo quer as
  fronteiras de trilha (26·47·66·84·101·115·126). A versão de 30 morreu duas horas
  depois de nascer, na migration seguinte. Trava o Bloco 7b e o B0.5 do currículo.
  Nenhum script resolve isto — é escolha, e é do Doug. **Falta medir**
  `title_tiers.lessons_required` no banco: migration prova intenção, não estado.

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
| **Commits à frente de `origin/main`** | 73 |
| **Árvore** | limpa |
| **Último commit** | c1d2c4d · 2026-08-09 · fix(gates): as duas réguas que iam provar o R1 passavam por vacuidade |
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
| **Migrations** | 75 |
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
