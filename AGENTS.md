# AGENTS.md — porta de entrada para agentes que não sejam o Claude Code

Este arquivo **não é a fonte de verdade**. A fonte é o [CLAUDE.md](CLAUDE.md).
Aqui está só o mínimo que um agente precisa saber **antes** de ler qualquer outra
coisa, porque as travas técnicas do projeto não valem fora do Claude Code.

Ordem de leitura: este arquivo → `CLAUDE.md` → `docs/ESTADO.md`.

**Se a sua tarefa veio da fila, leia também [docs/codex-fila.md](docs/codex-fila.md)
— é lá que moram os modos de trabalho, os rótulos de evidência e o briefing da
tarefa.** Este arquivo diz o que nunca se faz; aquele diz como se faz.

Não acrescente regra de produto, de estilo ou de arquitetura aqui. Elas vivem no
`CLAUDE.md`, e duplicá-las cria duas fontes que divergem — o problema que o
`docs/ESTADO.md` foi criado para resolver.

---

## Por que este aviso existe

O Claude Code roda com travas configuradas em `.claude/settings.json` e com um
hook em `scripts/hooks/bloqueia-migration-aplicada.mjs`. **Nenhum outro agente
herda isso.** Fora do Claude Code, as proibições abaixo não têm nada segurando
além desta folha.

## Proibido, sem exceção

- **Nunca** `npm run test:e2e` nem `npx playwright test`. Os testes de ponta a
  ponta criam e apagam **usuários reais** no Supabase de **produção** via admin
  API. Não existe ambiente de teste separado.
- **Nunca** `scripts/apply-migration.ts`. Ele aplica direto no banco remoto de
  produção.
- **Nunca** ler, copiar ou imprimir `.env.local`. Ele contém a `service_role`,
  que ignora toda a segurança por linha do banco.
- **Nunca** editar uma migration já aplicada. Cria-se outra — regra do
  `CLAUDE.md`, e o histórico do banco depende dela.

A ausência de `.env.local` numa cópia de trabalho é uma **camada, não uma
garantia**: variável de ambiente tem precedência sobre o arquivo. Não teste estas
travas executando a operação proibida.

## Como se trabalha aqui

- **Uma tarefa, um executor.** Dois agentes nunca no mesmo arquivo ao mesmo
  tempo.
- **Branch e worktree próprios.** Nada direto na `main`.
- **A tarefa declara seus arquivos de posse antes de começar.** Esse escopo vem
  no briefing da tarefa, não deste arquivo — escopo de tarefa envelhece, regra
  durável não.
- **Nunca afirmar que banco, teste ou render funcionou sem ter executado.** O
  projeto chama isso de Regra de Evidência (`CLAUDE.md`, §4 das Regras
  Invioláveis): reproduzir, apontar causa com arquivo e linha, fix mínimo, e um
  gate que falha antes e passa depois. Relatório não é verificação.
