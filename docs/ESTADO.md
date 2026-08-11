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

**A prioridade virou em 2026-08-09 (D4): a tela do aluno vem primeiro.** A ordem era
**Lote 1** → **R1** → **Lote 3** → **F2**, e **os três primeiros fecharam** — os dois
primeiros em 2026-08-09, a conferência do 2b e o Lote 3 (Next **16.2.12**, um degrau
acima do previsto) em 2026-08-10. **O que resta é a F2, e ela virou a troca de pilha
descrita abaixo.** O Lote 2 e a linha A5 da fila do Codex ficam parados, porque
existem para destravar desenho.

**A conferência do 2b saiu em 2026-08-10: a F2 NÃO depende do traje.** Quatro das
cinco telas da F2 são recorte de cabeça (32 e 40 px) e o tronco nem aparece; onde ele
aparece — só a Companhia, a 56×70 px — já sai vestido, porque o fallback do 5.9 é
código no repositório (`compositor.ts:255` cai em `TRAJE_BASE.roupa`). A dependência
declarada aponta ao contrário: o uniforme espera o Bloco 5, não o inverso. **A F2 é
uma fase, e a conta de tarefas abaixo está certa.** As quatro medidas com linha estão
na atualização 3 do **D4**, em `docs/achados.md`.

**A decisão do T7 saiu em 2026-08-10, e é maior que a pergunta que a pediu: a pilha
v2 vai inteira para o lixo.** Toda a arte e todos os itens do boneco antigo são
apagados, sem reaproveitar nada — nem os pets. **O avatar novo tem cabelo como único
item vestível**, e são 5 modelos + a careca = 6 opções. Vieram junto quatro decisões
de produto: o **baú vira XP puro** (5/10/20/35, a régua da forja que já existe), os
**ovos e a Chocadeira ficam** sempre dando XP, o cabelo é **parte livre e parte
desbloqueável**, e o desbloqueio é **por nível** — de propósito, para não travar
atrás do T1.

**O plano de execução é `docs/avatar/20-troca-de-pilha-plano.md`**, em 6 blocos com
gate e número medido no fim de cada um. Onde ele divergir dos docs 14 e 15, **ele
vence** — os dois foram escritos quando a v2 ainda era o caminho. O T8 deixou de
estar parado: fecha no Bloco C.

✅ **A TROCA DE PILHA TERMINOU EM 2026-08-10.** O plano do doc 20 está **inteiro
fechado**: A, B, C, D, E.1–E.5, F.1 e F.2. O avatar kokeshi está **no ar**, nas três
telas (`/criar-personagem`, `/perfil`, `/perfil/[userId]`), com a identidade em
`avatar_skin`/`avatar_hair`/`avatar_hair_color` e o desbloqueio de cabelo decidido
pelo servidor. O Doug conferiu na tela: a escolha vai ao servidor e volta, a matview
se refresca sozinha, e o cadeado vem do `avatar_hair_catalog`.

O **E.5** fechou por último — a suíte e2e reescrita para a pilha nova
(`avatar-identidade.spec.ts` **4/4**, `auth.spec.ts` **3/3**). Ela estava morta desde
o Bloco D, e nenhum gate acusou: virou o **G13**.

⚠️ **A armadilha de ordem que este plano carregou não vale mais, e o registro fica
como precedente.** Não há banco separado (D3), então toda migration bate em produção
na hora — do Bloco B ao F.1 o site no ar ficou quebrado de propósito (zero alunos
hoje). A `main` foi atualizada em duas janelas, F.1 e F.2, e não numa só como o plano
previa: o motivo original terminou no Bloco D, quando o cliente voltou a bater com o
banco.

**O R1 fechou em 2026-08-09** — nenhuma das 30 tabelas de `public` aceita escrita
direta do navegador, `verify:all` está verde. Três migrations (`20260809120000`,
`130000`, `140000`) e duas RPCs novas: `set_preferencias` e `set_task_active`. O que
sobrou dele está registrado como **R3** em `docs/achados.md`, e é decisão, não
trabalho parado.

**O R4 fechou em 2026-08-10, e o site no ar deixou de estar atrás do próprio banco.**
A `main` estava em `54d7e8a` (2026-07-31) enquanto as migrations do R1 já rodavam no
Supabase de produção — e **Configurações e o liga/desliga de tarefa falhavam no ar**.
O merge saiu fast-forward (`54d7e8a` → `8d31bca`, 76 commits, zero conflito), o push
disparou a Vercel, e o Doug conferiu as duas telas no ar: **as duas salvam**. A `main`
publicada e esta branch estão no mesmo commit.

**O boneco velho saiu do ar no F.2.** Até o Bloco D o perfil publicado mostrava o
avatar da pilha v2, porque `compor()` só era importado por `/dev/avatar-kokeshi`.
Hoje `AvatarDisplay` não existe e as três telas servem `compor()` pelo
`<AvatarKokeshi>` — 0 chamadas do componente velho, medido.

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
| **Commits à frente de `origin/main`** | 0 |
| **Árvore** | **7 arquivos sujos** |
| **Último commit** | 3ba2dc4 · 2026-08-10 · docs(avatar): F.2 provado na tela — a matview refrescou sozinha e o D8 não perdeu nada |
<!-- VOLATIL:fim -->

## Fases do produto

**10 de 12 feitas.**

Abertas:

- **11. Sound Design + PWA + Polish** — não existe manifest nem service worker
- **12. Testes Finais e Lançamento**

_Fonte: tabela §Estado real de `docs/Recruta64_Roadmap_Tecnico_v1.md`._

## Gates

**19 entradas** em `verify:all`, que expandem para **27 scripts**. O número difere entre branches — a `main` não tem `verify:pose` nem `verify:design-tokens`.

`verify:phase2` · `verify:seeds` · `verify:revanche` · `verify:rush` · `verify:phase5` · `verify:phase6` · `verify:avatar-db` · `verify:chest-pool` · `verify:paleta-patentes` · `verify:cabelo-catalogo` · `verify:perfil-publico` · `verify:turmas` · `verify:privileges` · `verify:xp-curve` · `verify:no-dup-rpc` · `verify:puzzle-authority` · `verify:curriculo` · `avatar:pose` · `verify:design-tokens` · `verify:estado` · `verify:aberturas` · `verify:fonte-peca` · `arte:fixtures` · `arte:reguas` · `arte:cor-proibida` · `arte:escala` · `arte:pecas-check`

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
| Cores cruas — teto tolerado | **1331 em 69 arquivos** | ratchet |
| RPCs redefinidas mais de uma vez | **54 (pior: puzzle_attempt, 12×)** | ratchet |

_Ratchets: o gate reprova se crescerem. Só encolhem com `--update`._

## Repositório

| | |
|---|---|
| **Migrations** | 81 |
| **Rotas (`page.tsx`)** | 33 |
| **Arquivos de teste** | 14 |
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
