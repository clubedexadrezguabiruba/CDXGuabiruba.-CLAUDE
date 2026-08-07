# Fila do Codex — o que já rodou e o que falta

> **Isto é registro de progresso, mantido à mão.** Não escreva aqui número
> agregado nem percentual: o `docs/ESTADO.md` é gerado e é ele que mede. Aqui vai
> só o estado de cada rodada e onde o resultado caiu.
>
> As regras de como operar o Codex vivem no `AGENTS.md` (o que ele nunca pode
> fazer) e na seção **Coordenação entre agentes** do `CLAUDE.md`.

## Painel

| # | Tarefa | Estado | Quando | Onde caiu |
|---|---|---|---|---|
| **P0** | Piloto — doc 13: cabeçalho, §7 e §10 | ✅ **feito** | 2026-08-06 | `260e657`, mais `ed393ad` |
| **C1** | Varredura de coerência entre documentos | ⬜ não iniciada | — | — |
| **C2** | Doc 13 — §1 (dados/schema) e §5 (assets) | ⬜ não iniciada | — | — |
| **C3** | Doc 15 §10 — checklist de lançamento | ⬜ não iniciada | — | — |
| **C4** | Prioridade de teste por superfície de recompensa | ⬜ opcional | — | — |

---

## As regras, em sete linhas

1. **Só relatório.** O Codex não escreve no repositório. Eu aplico o que valer.
2. **Fotografia estável.** A rodada nasce de um worktree `--detach` do commit da
   hora, e **o relatório abre declarando o hash auditado** — sem ele,
   `arquivo:linha` não é conferível, porque número de linha anda.
3. **Comandos: só leitura.** `rg`, `Get-Content`, `ls`, `git log/show/diff`.
   Proibidos teste, build, gate, rede, `.env.local`, escrita e todo git que
   altere estado.
4. **Quatro rótulos por extenso**, nunca `[x]`:
   `COMPROVADO` · `ESTÁTICO — FALTA BANCO` · `EXIGE RUNTIME` · `AUSENTE`.
5. **Arquivo + linha em toda afirmação.**
6. **Migration nunca é prova de produção.** Ela diz a intenção de um momento.
7. **Amostra julga o relatório; ela não autoriza aplicar.** Cinco pares dizem se
   o relatório merece confiança. Cada achado que for aplicado é conferido um a um.

---

## P0 — Piloto ✅ feito em 2026-08-06

**Escopo:** tabela de inventário do cabeçalho, §7 Segurança, §10 Cobertura de teste.

**Voltou:** 16 linhas de checkbox — **2** comprovadas, **7** estáticas pendentes de
banco, **0** exigindo runtime, **7** ausentes.

**Inventário do cabeçalho, quatro células erradas:**
faltavam as tabelas `xp_grants` e `title_tiers` · policies não eram 5 e sim 9 no
histórico versionado · testes unitários não eram zero e sim 8 arquivos · gates da
fase 8 não eram zero e sim 4.

**Achou o que estava lacrado**, com o número exato nos dois casos (8 testes, 4
gates), e **pegou uma sutileza que eu não vi**: `title_tiers_select_all` tem
`DROP` seguido de recriação na linha seguinte, o que quebra a contagem ingênua.

**Dois achados registrados sem conclusão:**
- `titles_select_classmate` foi criada junto das duas policies de vazamento,
  nunca foi dropada, e não consta de `POLICIES_PROIBIDAS` do gate — assimetria
  sem justificativa escrita. **Segue em aberto.**
- O ranking de turma ignora `ranking_visible` de propósito. **Metade fechou** em
  `ed393ad` (a matview estava legível por `anon`; revogada e vigiada pelo gate);
  a outra metade é decisão sua e **segue em aberto**.

**O que eu tive de corrigir nele:** uma marca `[x]` enganosa no gate de
integridade catálogo↔assets — verdadeira sobre o gate existir, falsa sobre o bug
estar resolvido, porque os 45 itens invisíveis seguem congelados no baseline. Foi
o que motivou a regra 4 acima.

---

## C1 — Varredura de coerência entre documentos

**Por que primeiro:** a doença fundadora do projeto, escrita no `CLAUDE.md` —
*"o estado deste projeto vivia em 13 documentos que discordavam"*. O `ESTADO.md`
resolveu os **números**; a prosa segue divergindo.

**Escopo:** `CLAUDE.md`, `docs/ESTADO.md`, `docs/avatar/12`–`18`,
`docs/curriculo/01` e `02`. Ignorar `_superado/`.

**Divergências já conhecidas — não são a tarefa, são a calibragem:**

| Divergência | Estado |
|---|---|
| Plano técnico da trilha 1 "não existe" (`CLAUDE.md`) | ✅ corrigida 2026-08-06 |
| idem, na §13 de `docs/curriculo/01` | ✅ corrigida 2026-08-06 |
| Reseed do catálogo: **60** (doc 14, T4.9) vs **54** (doc 15 §9.1) | ⬜ aberta |
| Pool de baú "nunca relíquia" (doc 14, T4.11) — a relíquia foi cortada pela D-E; o lugar é a moldura (`frame`) | ⬜ aberta |
| **Régua da patente: decidida ✅ no doc 15 §3 vs aberta e travando o Bloco 7b no bloco AGORA do `ESTADO.md`** | ⬜ **aberta — a grave** |
| Branch em execução: bloco AGORA diz `avatar/estilo-kokeshi`; a real é `avatar/vtracer` | ⬜ aberta (bloco AGORA é escrito à mão) |

A quinta é a que custa dias: dois documentos discordam sobre se uma decisão que
**trava trabalho** foi tomada.

**Entrega:** tabela `arquivo:linha A` × `arquivo:linha B`, qual parece obsoleto e
por quê, precedida do hash auditado. Sem editar nada.

**Quando rodar** — não antes de todo bloco, que vira burocracia. Os gatilhos:
documento de fonte de verdade foi alterado · um plano novo depende de três ou
mais documentos · retomada depois de semanas · indício concreto de conflito.

---

## C2 — Doc 13, §1 (dados e schema) e §5 (assets e integridade)

Continua o piloto nas duas seções que sobraram com massa estática. A §5 cobre o
**bloqueador de lançamento nº 1** do próprio doc: os 45 itens que não vestem o
boneco.

**Não mandar §6, §8, §9.** Exigem ver na tela e medir em celular fraco —
voltariam inteiras como `EXIGE RUNTIME`, gastando uma rodada para nada.

---

## C3 — Doc 15 §10, checklist de lançamento

14 caixas, **zero marcadas desde que o arquivo nasceu** — o doc 13 de novo, em
menor escala, e é a lista de "estamos prontos?". Não urgente: as fases 11 e 12
não começaram, então boa parte volta `AUSENTE` com razão.

---

## C4 — Prioridade de teste por superfície de recompensa *(opcional)*

20 dos 28 RPCs chamados em `src/` não aparecem em teste nenhum — inclusive
`claim_chest` e `end_rush`, que são caminho de economia. A lista crua sai de um
grep; o valor é o **julgamento** de quais concedem recompensa e portanto tocam a
Regra Inviolável nº 1.

**Entrega apenas um backlog priorizado.** Validar RPC de recompensa continua
comigo e com os gates.

---

## Modelo de briefing — abrir, preencher as duas linhas, colar

```
Você é um auditor. Não altera nada no repositório: a entrega é um relatório.

Abra o relatório declarando o hash do commit auditado (git rev-parse HEAD).

Leia, nesta ordem: AGENTS.md, CLAUDE.md, docs/ESTADO.md.

TAREFA: <<< o escopo da rodada, arquivo e seções >>>
FORA DE ESCOPO: <<< o que não tocar >>>

COMANDOS: só leitura — rg, Get-Content, ls, git log/show/diff. NÃO rodar teste,
build, gate, nada de rede, nada que use .env.local, nada que escreva, e nenhum
git que altere estado (add, commit, checkout, reset, clean, stash, push).

RÓTULOS — um por afirmação, sempre com arquivo+linha:
  COMPROVADO             a afirmação INTEIRA está provada pelo que você leu
  ESTÁTICO — FALTA BANCO o código diz a intenção; o comportamento não foi visto
  EXIGE RUNTIME          precisa render, tela, celular ou medição
  AUSENTE                procurei em <onde> e não existe

REGRA DURA: migration não é prova de produção. Achar ENABLE ROW LEVEL SECURITY
numa migration NÃO autoriza COMPROVADO em "RLS ativo" — migration posterior pode
ter desligado, e objeto pode ter nascido fora do versionamento.

ENTREGUE no fim: os quatro números, um por rótulo.
```
