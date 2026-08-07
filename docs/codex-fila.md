# Guia do Codex — como se trabalha aqui, e o que fazer agora

> **Se você é um agente e sua tarefa veio da fila abaixo, leia este arquivo
> inteiro antes de tocar em qualquer coisa.** Ele não repete a arquitetura do
> produto — isso é do `CLAUDE.md`. Ele diz **como** se trabalha, e **o que** está
> na vez.

| Arquivo | Papel | Quando ler |
|---|---|---|
| [`AGENTS.md`](../AGENTS.md) | **a porta** — o que nunca se faz, e por quê | sempre, primeiro |
| [`CLAUDE.md`](../CLAUDE.md) | **o projeto** — fonte de verdade | sempre, depois |
| **este arquivo** | **como se trabalha + o que fazer agora** | sempre que a tarefa vier da fila |

---

## Quem é quem

| Papel | Faz |
|---|---|
| **Doug** | dono do produto e diretor visual. **Decide.** Aprova aparência, pedagogia e qualquer ação sobre produção |
| **Codex** | investiga o repositório e redige rascunho. **Não decide, não implementa** |
| **Claude Code** | verifica achado a achado, corrige, roda gate, aplica migration e integra. É quem tem banco e runtime |
| **ChatGPT** | arquiteta, contesta e gera arte. Não lê o repositório de forma confiável |
| **Fable** | promove rascunho a documento e implementa o que custa caro errar |

Isto está escrito porque **modelo que entende o porquê da regra a segue melhor do
que modelo que lê lista.** Quando uma regra abaixo parecer atrapalhar a tarefa,
volte a esta tabela: quase sempre a regra existe porque outro papel resolve
aquilo melhor.

---

## A escada de três modos

O modo vem escrito na fila, junto com a tarefa. **Cada modo é conquistado pelo
anterior.**

| Modo | Estado | Pode |
|---|---|---|
| **1 · AUDITOR** | ✅ **provado** (piloto de 2026-08-06) | ler e relatar. Zero escrita |
| **2 · RASCUNHO** | ⏳ **a provar** | tudo do AUDITOR, mais **criar e commitar exatamente um** arquivo `*-RASCUNHO.md` |
| **3 · IMPLEMENTADOR** | ❌ **não existe** | — |

### Modo AUDITOR
Snapshot congelado · só leitura · arquivo+linha em toda afirmação · os rótulos
abaixo · **nenhum arquivo alterado, nenhum commit**.

### Modo RASCUNHO
Pode criar **um** arquivo novo cujo nome termine em `-RASCUNHO.md`, declarado no
briefing, e commitar **só ele**, na branch `codex/*` do worktree próprio.

**Não pode:** editar arquivo existente · migration · código de produção ·
`package.json` · teste · `.env.local` · banco · e2e · `push` · `merge`.

**Nada com `RASCUNHO` no nome é fonte de verdade.** Não entra na lista de
referências do `CLAUDE.md` nem na lista de frescor de `scripts/estado.ts`. Vira
documento de verdade só por promoção do Claude ou do Fable, em commit separado.

Cabeçalho obrigatório de todo rascunho:

```
STATUS: RASCUNHO — não é fonte de verdade
Base factual: commit <hash>
Objetivo: <o que este documento adianta>
Bloqueado por: <o que falta para promover>
```

### Modo IMPLEMENTADOR
Não existe. O modo 2 precisa entregar algumas vezes e ser corrigido antes de
ganhar direito de tocar código. **Escrever código é o único modo em que o erro
entra em produção.**

---

## As regras, e o motivo de cada uma

Regra sem motivo é regra que se racionaliza para fora numa hora apertada.

1. **Fotografia estável.** A rodada nasce de um worktree do commit da hora, e **o
   relatório abre declarando o hash auditado**. *Por quê:* número de linha anda.
   Sem o hash, `arquivo:linha` não é conferível, e conferir vira arqueologia.
2. **Comandos: só leitura.** `rg`, `Get-Content`, `ls`, `git log/show/diff`.
   Proibido teste, build, gate, rede, `.env.local`, escrita, e todo git que
   altere estado (`add`, `commit` fora do modo 2, `checkout`, `reset`, `clean`,
   `stash`, `push`). *Por quê:* o `npm run test:e2e` deste projeto cria e apaga
   **usuários reais em produção**. Não existe ambiente de teste separado.
3. **Arquivo + linha em toda afirmação.** *Por quê:* é o que torna o relatório
   conferível em segundos em vez de refazer a investigação.
4. **Migration não é prova de produção.** *Por quê:* aconteceu duas vezes em
   2026-08-06 — ver os rótulos abaixo.
5. **Uma tarefa, um executor.** *Por quê:* dois agentes no mesmo arquivo se
   sobrescrevem sem conflito de git, porque não é edição, é sobrescrita.
6. **Deixar em branco é acerto, não fracasso.** *Por quê:* no piloto, o resultado
   certo foi marcar 2 de 16 e deixar 14 com o motivo. Auditor que preenche tudo
   não está medindo, está adivinhando.
7. **Não procure erro para provar valor.** Cobertura e força de prova são a
   régua; **zero contradições é resultado válido** se cada afirmação foi
   confrontada individualmente. *Por quê:* "achar erro" como métrica de sucesso
   pressiona o modelo a fabricar defeito — o oposto da regra 6.
8. **Commit é memória.** Nada depende de "o agente lembra". Vale para este
   arquivo também: briefing de tarefa fechada é compactado, e o texto integral
   fica recuperável no histórico do git.

---

## Os rótulos

### Nos relatórios (modo AUDITOR)

| Rótulo | Significa |
|---|---|
| `COMPROVADO` | a afirmação **inteira** está provada pelo que você leu |
| `ESTÁTICO — FALTA BANCO` | o código diz a intenção; o comportamento não foi visto |
| `EXIGE RUNTIME` | precisa render, tela, celular ou medição |
| `AUSENTE` | procurei em `<onde>` e não existe |

Fora do doc 13, **não use `[x]`** — ele lê como "o requisito está resolvido", que
foi exatamente a armadilha que reprovou uma marca do piloto.

### Nos rascunhos (modo RASCUNHO)

| Rótulo | Significa |
|---|---|
| `FATO` | o que existe — **sempre qualificado**, ver abaixo |
| `NOVO` | precisa ser construído |
| `DECISÃO` | escolha em aberto, com **alternativa nomeada e custo de errar** |
| `DEPENDENTE DO PILOTO` | não fecha antes de observar a T1 com criança real |

**Todo `FATO` diz fato de quê.** Em 2026-08-06 o projeto se queimou duas vezes
confundindo níveis de evidência:

```
FATO — CÓDIGO      <arquivo:linha>
FATO — MIGRATION   <migration:linha> — intenção versionada, NÃO produção
FATO — BANCO       medido por gate; o único que fala de produção
FATO — PLANO       o doc promete; não prova implementação
```

Os dois casos que criaram esta regra:

- **A matview.** Nenhuma migration escrevia `GRANT` ou `REVOKE` sobre
  `user_public_profiles`. Lendo só migration, a conclusão era "nada a ver aqui".
  O banco dizia outra coisa: `SELECT` exposto a `anon` e `authenticated`.
- **A régua da patente.** O Claude escreveu "a quarta fonte é o banco" citando
  uma linha de *migration*. Migration prova intenção, não estado.

**Um agente offline não pode originar `FATO — BANCO`.** Sem uma medição entregue
no briefing (com data, gate e resultado), escreva `EXIGE BANCO` ou
`FATO — MIGRATION <linha>. Produção: não verificada.`

---

## Painel

| # | Modo | Tarefa | Estado |
|---|---|---|---|
| **P0** | AUDITOR | Piloto — doc 13: cabeçalho, §7, §10 | ✅ concluído 2026-08-06 |
| **A1** | **RASCUNHO** | Matriz de server-authority da T1 | ✅ concluída 2026-08-07 |
| **C1** | AUDITOR | Coerência documental | 🔵 **ativa** |
| — | — | *Decisão da patente* (Doug) | ⏸ depois do C1 |
| **A2** | AUDITOR | T2: relatório de delta | ⬜ |
| **A3** | AUDITOR | T2: mapa factual de reuso | ⬜ só se A2 disser que delta não basta |
| **A4** | RASCUNHO | T2: pré-plano bloqueado | ⬜ só depois de A2/A3 |
| **V1** | AUDITOR | Auditoria adversarial do A4 — **outro thread** | ⬜ |
| **A5** | RASCUNHO | Os 31 pedidos de arte da F4 | ⬜ corre por fora |
| **C2** | AUDITOR | Doc 13 §1 e §5 | ⬜ |

**Teto: duas frentes técnicas simultâneas.** Acima disso o gargalo de revisão
passa a ser o Doug. Arte corre por fora e não conta.

---

### P0 — concluído

```
P0 — concluído · modo AUDITOR · base 1ace81b · resultado 260e657
Veredito: aprovado com 1 correção
O que ele errou: marcou [x] no gate de integridade catálogo↔assets. Verdadeiro
  sobre o gate existir, falso sobre o bug estar resolvido — os 45 itens
  invisíveis seguem congelados no baseline. É por isso que os rótulos hoje são
  por extenso e não caixinha.
O que ele acertou e ninguém tinha visto: title_tiers_select_all tem DROP seguido
  de recriação na linha seguinte, o que quebra a contagem ingênua de policies.
Promovido para: docs/avatar/13-checklist-de-verificacao.md
Desdobramento: o achado do opt-out virou conserto medido em ed393ad e 81a2723
```

---

### A1 — concluída · o primeiro uso do modo RASCUNHO

```
A1 — concluído · modo RASCUNHO · base 5953132 · resultado f589788 (cherry-pick d845f13)
Veredito: APROVADO. O modo RASCUNHO passou no primeiro uso.
Escopo: 1 arquivo, 211 linhas, árvore limpa, nasceu do commit certo.
Cabeçalho com as quatro linhas obrigatórias.
Nove superfícies, todas com ESTADO declarado: 4 SÓ PLANO, 5 PARCIAL.
Rótulos: 18 FATO—CÓDIGO · 37 FATO—MIGRATION · 10 FATO—PLANO · 61 NOVO ·
         12 DECISÃO · 8 DEPENDENTE DO PILOTO · 10 EXIGE BANCO.
         Contagens conferidas e batem — a diferença para um grep cru é a
         própria seção de contagem, que ele excluiu de propósito.
FATO — BANCO: zero originados. Ele antecipou que um grep encontraria a
         expressão duas vezes e explicou por escrito que as duas são meta.

Casos de controle lacrados (3, ele não sabia quais eram):
  ✅ bot_result só exige PGN com dez caracteres, não reexecuta xadrez —
     ACHOU, e com migration:linha melhor que a minha
  ❌ os gates verify:curriculo-banco, verify:trilha1 e verify:competencia
     são prometidos no §7 do doc 02 e NÃO existem no package.json — NÃO ACHOU
  ~  camada de competência — lacre injusto meu: é a §2 do doc 02, e o briefing
     escopava só a §2.5. Não conta como falha dele

O que ele errou, e o que corrigir no próximo briefing:
  O campo "Gate" pedia "que teste DEVERIA reprovar uma implementação
  insegura" — pergunta de desenho. Isso desviou do inventário: gate prometido
  por nome e ausente do package.json não apareceu em lugar nenhum. O campo
  precisa de duas perguntas, não uma: "o gate prometido existe?" e só então
  "o que ele deveria medir?". A culpa é do briefing, não do modelo.

Achado que virou trabalho: o rascunho aponta que as migrations concedem INSERT
  direto em user_puzzle_attempts e INSERT/UPDATE direto em user_lesson_progress
  (20260216180200_rls.sql:59-68,81-93). Conferido: verdadeiro no histórico
  versionado. Marcado por ele como EXIGE BANCO, que é a marcação certa —
  medir privilégio efetivo é query, e é do Claude.

Promovido para: não. Segue RASCUNHO até revisão do Fable.
```

---

### C1 — Coerência documental · modo AUDITOR · 🔵 ativa

**Por que.** A doença fundadora, escrita no `CLAUDE.md`: *"o estado deste projeto
vivia em 13 documentos que discordavam"*. O `docs/ESTADO.md` resolveu os
**números**; a prosa segue divergindo.

**Divergências já conhecidas — calibragem, não a tarefa:**

| Divergência | Estado |
|---|---|
| Plano técnico da T1 "não existe" (`CLAUDE.md`) | ✅ corrigida 2026-08-06 |
| idem, na §13 de `docs/curriculo/01` | ✅ corrigida 2026-08-06 |
| Reseed do catálogo: **60** (doc 14, T4.9) vs **54** (doc 15 §9.1) | ⬜ aberta |
| Pool de baú "nunca relíquia" (doc 14, T4.11) — a relíquia foi cortada pela D-E; o lugar é a moldura (`frame`) | ⬜ aberta |
| **Régua da patente: `decidida ✅` no doc 15 §3 vs `aberta e travando o Bloco 7b` no bloco AGORA do `ESTADO.md`** | ⬜ **aberta — a grave** |
| Branch em execução: bloco AGORA diz `avatar/estilo-kokeshi`; a real é `avatar/vtracer` | ⬜ aberta |
| Doc 13 listado como decisão aberta no bloco AGORA — mas fechou por uso (0 de 92 → 2 de 92) | ⬜ aberta |
| `docs/ESTADO.md:19` aponta para `.scratch/estilo/BRIEFING-CABELO.md`, **que não existe** | ⬜ aberta |

**Briefing — colar no Codex:**

```
MODO: AUDITOR

Você não altera nada. A entrega é um relatório, na sua resposta.

Leia AGENTS.md, CLAUDE.md e docs/codex-fila.md antes de qualquer coisa.

Abra o relatório declarando o hash do commit auditado (git rev-parse HEAD).

TAREFA: encontrar afirmações que se contradizem entre documentos.

ESCOPO: CLAUDE.md · docs/ESTADO.md · docs/avatar/12 a 18 ·
        docs/curriculo/01 e 02.
FORA DE ESCOPO: qualquer coisa em _superado/, e todo arquivo de código.

COMANDOS: só leitura — rg, Get-Content, ls, git log/show/diff. NÃO rodar teste,
build, gate, nada de rede, nada que use .env.local, nada que escreva, e nenhum
git que altere estado.

A seção C1 do docs/codex-fila.md lista 8 divergências já conhecidas, sendo 2 já
corrigidas. Elas são CALIBRAGEM, não a tarefa: confirme que ainda valem e
procure as que ninguém viu.

ENTREGA — uma linha por divergência:
  arquivo:linha A  ×  arquivo:linha B
  o que cada um afirma, em meia linha
  qual parece obsoleto, e a evidência de por quê
  gravidade: TRAVA TRABALHO | ENGANA QUEM LÊ | COSMÉTICA

Priorize as que TRAVAM TRABALHO — dois documentos discordando sobre se uma
decisão foi tomada custa dias.

Zero divergências novas é resultado válido. Não invente para provar valor.

ENTREGUE no fim: quantas confirmou das conhecidas, quantas novas achou, e a
contagem por gravidade.
```

---

### A2 · A3 · A4 · V1 · A5 · C2 — ainda sem briefing

Os briefings nascem aqui quando a rodada for começar. **Briefing escrito com
semanas de antecedência apodrece igual a documento** — é a doença que este
arquivo existe para não repetir.

- **A2 — T2: relatório de delta.** *A trilha 2 precisa de algum mecanismo
  pedagógico que o plano da T1 não cubra?* Por aula: formato · mecanismo
  necessário · correspondente na T1 · diferença · decisão · dependência do
  piloto. Pode colapsar a questão inteira da T2 — o doc 02 §9 adia o *move
  trainer* para o plano da **T3**, não da T2.
- **A3 — T2: mapa factual de reuso.** Só se A2 disser que delta não basta.
- **A4 — T2: pré-plano.** Modo RASCUNHO, **e nasce bloqueado**: o doc 02 fecha a
  questão em três lugares (linha 1184, linha 1111, linha 29) — Trilhas 2–7
  dependem dos dados reais do piloto da T1.
- **V1 — auditoria adversarial do A4**, em **outro thread**. Quem redigiu defende
  o que escreveu. Caça as palavras que escondem trabalho: *já existe · basta ·
  reutiliza · herda · mesma RPC · mesma tabela · mesmo gate · sem mudança*.
- **A5 — os 31 pedidos de arte da F4** (5 cabelos, 6 chapéus, 20 pets), a partir
  do gabarito de `scripts/avatar/arte/PEDIDO-CHANEL.md` e do
  `docs/avatar/16-uniformes-runbook.md`. Pré-requisito de escrita para os
  chapéus: a regra chapéu × cabelo do doc 15, linha 1073.
- **C2 — doc 13, §1 e §5.** A §5 cobre o bloqueador de lançamento nº 1. **Não
  mandar §6, §8, §9:** voltariam inteiras como `EXIGE RUNTIME`.

---

## Modelo de briefing

```
MODO: AUDITOR | RASCUNHO

Leia AGENTS.md, CLAUDE.md e docs/codex-fila.md antes de qualquer coisa.
Declare o hash do commit auditado no topo da entrega (git rev-parse HEAD).

TAREFA: <<< id da fila + escopo >>>
FORA DE ESCOPO: <<< o que não tocar >>>

COMANDOS: só leitura — rg, Get-Content, ls, git log/show/diff. NÃO rodar teste,
build, gate, nada de rede, nada que use .env.local, nada que escreva, e nenhum
git que altere estado.
[modo RASCUNHO: exceto o commit do único arquivo *-RASCUNHO.md declarado acima]

RÓTULOS: os da seção "Os rótulos" deste guia. Todo FATO é qualificado, e um
agente offline nunca origina FATO — BANCO.

Zero achados é resultado válido. A régua é cobertura e força de prova, não
número de problemas encontrados.

ENTREGUE no fim: a contagem por rótulo.
```
