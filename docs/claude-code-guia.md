# Claude Code no Recruta 64 — guia de uso

> Baseado no [cheat sheet do Njengah](https://github.com/Njengah/claude-code-cheat-sheet),
> mas filtrado: aqui só entra o que faz diferença **neste projeto**, do jeito que
> você trabalha. O que é genérico e você acha no link, eu cortei.

Nada neste doc está instalado. Os blocos de configuração são para copiar quando
você decidir — não mexi em `.claude/` nem em `settings.json`.

> **Procurando o texto pronto para colar?** Está em
> [claude-code-blocos.md](claude-code-blocos.md). Este aqui é para ler e entender;
> aquele é para abrir, copiar e fechar.

---

## O diagnóstico primeiro

Olhei os 93 commits, o `package.json` e a sua config atual. Quatro padrões saltam,
e eles definem o que vale a pena para você:

**1. Você trabalha em rajadas longas.** 17 commits em 29/07, 13 em 20/03, 11 em
14/03. E vãos enormes: nada entre 25/03 e 25/07. Isso significa duas coisas
opostas — sessões de horas que estouram contexto, e retomadas depois de meses que
dependem de você reconstruir o estado. **Gestão de contexto e de sessão é sua maior
alavanca**, muito mais que aprender comandos novos.

**2. Você é dirigido por documento e por gate.** 17 docs em `docs/avatar/`, um
backlog onde o progresso fica marcado, a Regra de Evidência no CLAUDE.md, 14 gates
no `verify:all`. Plano antes de execução já é seu hábito. O Claude Code tem duas
features desenhadas exatamente para isso (plan mode e slash commands) e você não
usa nenhuma das duas.

**3. Boa parte dos seus `fix:` são de coisas que mentiam.** "testes que mediam a
coisa errada", "contadores mostravam totais errados", "gate que a folha visual
expôs". Você já sabe que relatório não é verificação. Vale endurecer isso na
ferramenta, não só na disciplina.

**4. Sua superfície de customização está vazia.** Existe só o
`.claude/settings.local.json`, com 22 permissões acumuladas ao acaso. Zero slash
commands, zero hooks, zero `settings.json` versionado. É onde tem mais ganho parado.

---

## 0. O diagnóstico medido

> O diagnóstico acima saiu do **repositório** — commits, scripts, config. Ele
> inferiu o seu comportamento pelo que sobrou no git. Esta seção é a versão
> medida: saiu das **16 transcrições de sessão** em
> `~/.claude/projects/c--Users-Lenovo-Desktop-cdxguabirubaCLAUDE/`, 131 MB, com
> os 187 prompts que você digitou. Números medidos em 30/07/2026, não estimados.

| Medida | Valor |
|---|---|
| Sessões / prompts digitados por você | 16 / 187 |
| **Slash commands usados em toda a história** | **0** |
| **Estouros de contexto** (auto-compact disparado) | **5** |
| Sessão mais longa | 51,7 h — com 9 prompts e 483 chamadas de ferramenta |
| Sessão maior | 50 MB, 21,3 h, 60 prompts, 503 chamadas |
| Prompts de 60 caracteres ou menos | 85 de 187 (45%) |
| Chamadas Bash | 1096 — dentre elas 113 `grep`, 91 `cat`, 88 `sed`, 55 `ls` |
| Chamadas de subagente (delegação) | 17 |
| Mesmo PNG relido numa única sessão | `folha-recolor.png` 11×, `cab-1.png` 9×, `xl.png` 8× |
| Saídas de terminal coladas por você na mão | 4, de 1,5 mil a 8,9 mil caracteres |

### O que fazer com cada número

**1. Imagem é o seu maior custo de contexto — e é o que você mais usa.**
O mesmo PNG relido 11 vezes numa sessão é o que produziu o arquivo de 50 MB e
boa parte dos 5 estouros. Trabalho de arte exige verificação visual, então isso
não vai desaparecer; o que dá para mudar é a forma. Peça a **folha de contato**
(você mesmo inventou isso, commit `7687a87`) em vez de N imagens soltas, reduza a
resolução antes de eu abrir, e quando eu já tiver descrito um defeito, peça que eu
trabalhe **pela descrição** em vez de reabrir a imagem. Reler a mesma arte não me
faz enxergar melhor — só reocupa o espaço.

**2. Você nunca gerenciou contexto; o sistema fez por você, e pior.**
Zero slash commands e 5 auto-compacts contam a mesma história: quando lotou, o
sistema resumiu sozinho — e resumo cego é exatamente onde decisão de arte se
perde. Numa sessão você escreveu um handoff à mão ("*Sessão anterior ficou longa;
tudo relevante está com...*"). O instinto estava certo, a ferramenta é o
`/compact <instrução>`. Ver §2.

**3. Suas sessões duram de 21 a 52 horas.**
Uma delas: 51,7 h para 9 prompts. Isso é uma janela aberta ao longo de dias, não
uma sessão. Uma sessão deveria ser uma tarefa. Ver §3.

**4. Aprovação em cascata.**
45% dos seus prompts têm 60 caracteres ou menos, e boa parte é literalmente
`"sim"`, `"prossiga"`, `"siga"`, `"tente de novo"`. Em algumas sessões isso dá
~54 chamadas de ferramenta por prompt seu — eu corro muito, sozinho, e você
carimba no fim. Um `"sim"` **depois de um plano** é ótimo: barato e informado. Um
`"sim"` sem plano é cheque em branco, e se eu peguei a direção errada você só
descobre 50 ferramentas depois. Plan mode (§4) move o seu esforço para antes,
onde ele custa pouco e decide muito.

**5. Você cola saída de terminal na mão.**
Quatro vezes, uma delas com 8,9 mil caracteres do `verify:all`. Isso é você
rodando num terminal, copiando e colando aqui — trabalho seu que não precisa
existir. Peça que **eu** rode; as permissões para os comandos de verificação já
estão em `.claude/settings.json`.

**6. Das 1096 chamadas Bash, cerca de 350 fazem o que ferramenta dedicada faz
melhor.** `cat`, `grep`, `sed`, `ls` despejam texto cru; Read, Grep e Glob
devolvem resultado estruturado e mais barato. Esse é comportamento **meu**, não
seu — mas se incomodar, uma linha no `CLAUDE.md` resolve: *"prefira Read/Grep/Glob
a cat/grep/sed/ls no Bash"*.

**7. Você quase não delega: 17 subagentes.**
Quando a pergunta é "onde está X" ou "quais arquivos fazem Y", um subagente lê os
30 arquivos e devolve cinco linhas — os 30 nunca entram na sua sessão. Ver §2.

**8. Você digitou `--enable-auto-mode` no chat, três vezes.**
Isso é flag de linha de comando, não prompt: no chat vira texto e não faz nada. O
que você queria está no `Shift+Tab`, que alterna os modos de permissão dentro da
sessão.

### Se for mudar só dois hábitos

`/clear` ao trocar de assunto, e **folha de contato em vez de imagem solta** nas
rodadas de arte. Os dois juntos atacam os 5 estouros de contexto, que é o que mais
degrada suas sessões longas.

---

## 1. Os dez que resolvem 90%

| Comando | O que faz | Quando usar **aqui** |
|---|---|---|
| `/context` | Mostra quanto do contexto está ocupado, por categoria | Antes de abrir um bloco do backlog do avatar. Se já estiver acima de ~60%, `/clear` primeiro |
| `/compact <instrução>` | Resume o histórico e libera contexto | No meio de uma rajada, quando o assunto continua mas o histórico pesa |
| `/clear` | Zera a conversa (a anterior continua resumível) | Ao trocar de assunto: terminou o uniforme, vai para PWA → `/clear` |
| `Esc Esc` | Rewind — desfaz código e/ou conversa até um ponto anterior | Quando eu fui por um caminho errado. Melhor que `git checkout --` porque volta a conversa junto |
| `Shift+Tab` | Alterna modo de permissão (inclui plan mode) | Antes de qualquer tarefa que toque em mais de 2 arquivos |
| `@` | Autocomplete de caminho de arquivo | `@scripts/avatar/uniforme.ts` em vez de descrever. Mais barato e sem ambiguidade |
| `!` | Modo shell — roda o comando direto, sem me consultar | `!npm run typecheck` quando você só quer o resultado, sem gastar turno |
| `Ctrl+O` | Abre/fecha o transcript | Para ver o que eu de fato rodei quando o resultado parece bom demais |
| `/model` | Troca o modelo na sessão | Sonnet para trabalho mecânico, Opus para bloco de arquitetura |
| `/effort` | Ajusta o esforço de raciocínio | Ver a §4 — você está com `max` global, e isso custa caro em tarefa boba |

Outros que valem saber: `/status` (versão, modelo, conta), `/usage` (custo e
limites da sessão), `/doctor` (saúde da instalação), `/diff` (visualizador de
diff), `Ctrl+R` (busca reversa no histórico), `Ctrl+T` (lista de tarefas).

---

## 2. Contexto — a seção mais importante para o seu padrão

Sessão de 17 commits é sessão de horas. O que degrada não é o modelo, é o contexto
poluído: 40 leituras de arquivo que não importam mais competindo com a decisão que
você tomou há duas horas.

### `/compact` cego é desperdício

O `/compact` sozinho resume do jeito que der. Com instrução, ele preserva o que
você escolher:

```
/compact mantenha as decisões de arte, os nomes dos gates e o que já falhou.
descarte os dumps de arquivo e as saídas de teste que já passaram.
```

Use isso quando o assunto **continua**. Quando o assunto muda, `/compact` é o
comando errado — é `/clear`.

### `/clear` mais do que você imagina

A regra prática: **se a próxima tarefa não precisa de nada da anterior, `/clear`**.
Terminar uma peça de uniforme e começar a fase 11 (PWA) na mesma sessão não te dá
nada e te custa contexto e qualidade. A conversa anterior não some — dá para
retomar com `claude --resume`.

### `/branch` para explorar sem sujar

```
/branch tentativa-forro-dividido
```

Bifurca a conversa a partir daqui. Você testa uma abordagem de composição de
camada, e se não prestar volta para a linha principal com o contexto intacto. Isso
é muito melhor do que o que você faz hoje (desfazer no git e me reexplicar tudo).

### Delegue busca ampla

Quando a pergunta é "onde está X" ou "quais arquivos fazem Y", peça explicitamente
que eu **despache um subagente**. Ele lê os 30 arquivos e me devolve 5 linhas — os
30 arquivos nunca entram no seu contexto. Frase que funciona: *"use um subagente
para mapear isso e me traga só a conclusão"*.

---

## 3. Rewind e sessões — sua rede de segurança

### `Esc Esc`

Aperte duas vezes. Abre o menu de rewind, e você escolhe voltar **só o código**,
**só a conversa**, ou **os dois**. É a ferramenta certa quando eu fiz uma sequência
de edições e a terceira estragou: você não precisa achar qual foi, só volta.

### Retomar depois de meses

O vão de 25/03 a 25/07 é o seu caso real. O que faz a retomada funcionar:

```powershell
claude -n avatar-v4-f2        # nomeia a sessão ao abrir
claude --resume               # abre o seletor de sessões
claude -c                     # retoma a última, direto
```

Dentro da sessão, `/rename uniformes-bloco-3` nomeia depois do fato. Sessão com
nome descritivo é a diferença entre achar e não achar em julho o que você fez em
março.

E `/export` gera um arquivo da conversa — útil para o handoff multi-AI (§10).

---

## 4. Plan mode, thinking e effort — onde gastar, onde economizar

### Plan mode é feito para o seu jeito de trabalhar

`Shift+Tab` até aparecer plan mode. Nele eu **não posso editar nada** — só leio,
investigo e escrevo um plano que você aprova antes de qualquer linha mudar.

Você já trabalha assim manualmente: escreve o doc, marca no backlog, executa. Plan
mode é isso com a garantia de que eu não vou sair editando no meio da investigação.

Use sempre antes de: abrir bloco do `14-backlog-execucao.md`, mexer em RPC/migration,
qualquer coisa que toque em mais de 2 arquivos.

Não use para: corrigir um lint, renomear uma variável, ajustar um texto.

### Seu `effortLevel` está em `max` global

Está no seu `~/.claude/settings.json`. Isso significa que eu penso no talo até para
formatar um arquivo — mais lento e mais caro sem ganho nenhum.

Sugestão: baixar o global para `high` e subir pontualmente.

```jsonc
// ~/.claude/settings.json
{
  "effortLevel": "high"
}
```

E na sessão:

| Situação | Comando |
|---|---|
| Renomear, formatar, corrigir lint | `/effort low` |
| Trabalho normal de feature | `/effort high` (padrão) |
| Bloco de arquitetura, bug que não reproduz, composição de camadas do avatar | `/effort max` |

Atalhos relacionados: `Alt+T` liga/desliga o extended thinking, `Alt+O` liga o fast
mode (Opus com saída mais rápida — não é modelo menor).

---

## 5. Slash commands do projeto — sua maior lacuna

Qualquer `.md` dentro de `.claude/commands/` vira um comando. O nome do arquivo é o
nome do comando. `$ARGUMENTS` recebe o que você digitar depois.

> ⚠️ **Antes de criar a pasta:** o seu `.gitignore` ignora `.claude/` inteiro
> (linha 35). Do jeito que está, nem os comandos nem o `settings.json` iriam para o
> git. Para versionar, troque a linha 35 por:
>
> ```gitignore
> .claude/*
> !.claude/commands/
> !.claude/settings.json
> ```
>
> Isso mantém o `settings.local.json` (pessoal, com o caminho da sua máquina) fora
> do repo e deixa entrar só o que é do projeto. Se você preferir não versionar
> nada disso, tudo abaixo funciona igual — só não acompanha o repo em outra máquina
> nem no CI.

Os cinco abaixo saem direto do que você já faz.

### `.claude/commands/verificar.md`

O `verify:all` sozinho não te diz o que fazer quando quebra.

```markdown
---
description: Roda a bateria completa de verificação do projeto, na ordem
allowed-tools: Bash(npm run *), Read, Grep
---

Rode nesta ordem e pare no primeiro que falhar:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm run verify:all`

Regras:
- NÃO rode `npm run test:e2e` — bate no Supabase de produção e cria usuários reais.
- Ao falhar, mostre a saída real do erro, aponte arquivo+linha e proponha o fix
  mínimo. Não resuma "deu erro de tipo" sem o texto do compilador.
- Se tudo passar, diga apenas quais dos 5 rodaram e que passaram. Sem floreio.
```

### `.claude/commands/gate.md`

Materializa a Regra de Evidência do CLAUDE.md, que hoje depende de eu lembrar.

```markdown
---
description: Investiga um bug seguindo a Regra de Evidência do projeto
---

Bug: $ARGUMENTS

Siga exatamente esta ordem, sem pular etapa:

1. **Reproduzir** — os passos concretos. Se não reproduziu, diga isso e pare.
2. **Uma causa provável** — com arquivo+linha e/ou a query SQL. Uma só, a mais
   provável. Não liste hipóteses.
3. **Fix mínimo** — nada além do necessário. Sem refactor de carona.
4. **Gate** — um teste ou script de verificação que **falha antes** do fix e
   **passa depois**. Rode nos dois estados e me mostre as duas saídas.

Não me diga que funcionou sem o passo 4 executado de verdade.
```

Esse é o mais valioso dos cinco, porque endereça direto o seu padrão de `fix:` em
coisas que mentiam.

### `.claude/commands/migration.md`

Você tem **duas migrations com o mesmo timestamp** hoje (`20260729120000_avatar_v4_ponte_baus.sql`
e `20260729120000_patente_por_marcos.sql`). Investiguei: as duas são independentes
(tabelas e funções disjuntas, zero referência cruzada), e o `apply-migration.ts`
recebe **um arquivo por vez** — não existe ordenação automática que possa errar.
Ou seja, hoje é inerte. Só vira problema se algum dia a Supabase CLI entrar em
uso: ela usa o prefixo de timestamp como chave da `schema_migrations`, e duas
iguais colidem. Não vale mexer numa migration já aplicada por causa disso — mas
vale o comando garantir que não aconteça de novo.

```markdown
---
description: Cria e aplica uma migration seguindo as regras do projeto
allowed-tools: Read, Write, Glob, Bash(npx tsx scripts/apply-migration.ts *)
---

Migration: $ARGUMENTS

1. Liste `supabase/migrations/` e confirme que o timestamp novo é **maior que
   todos** e **não colide** com nenhum existente. Formato: `YYYYMMDDHHMMSS_descricao.sql`.
2. NUNCA edite uma migration já aplicada. Se o que eu pedi implica alterar uma
   existente, pare e me diga — a saída é uma migration nova.
3. Escreva o SQL. RLS ativo na tabela nova, sem exceção.
4. Só aplique depois que eu aprovar: `npx tsx scripts/apply-migration.ts <arquivo>`.
   (Supabase CLI não está instalada nesta máquina.)
5. Depois de aplicar, rode `npm run verify:all`.
```

### `.claude/commands/uniforme.md`

```markdown
---
description: Gera uma peça de uniforme seguindo o runbook
allowed-tools: Read, Write, Edit, Bash(npm run avatar:*), Glob
---

Peça: $ARGUMENTS

1. Leia `docs/avatar/16-uniformes-runbook.md` **antes de qualquer coisa** — é o
   processo de ponta a ponta, com a tabela de matiz e as três camadas do asset.
2. Confirme contra as §7, §7b e §7c de `docs/avatar/15-plano-ate-pronto.md` (regras
   de arte e de composição). Em conflito com outros docs, o 15 vence.
3. Rode `npm run avatar:garment` e confira os oito gates. Para cada reprovação,
   diga o que ela significa segundo o runbook — não tente contornar o gate.
4. Ao terminar, marque a tarefa em `docs/avatar/14-backlog-execucao.md`.
```

### `.claude/commands/commit.md`

Seu estilo de mensagem é bem específico e consistente — vale codificar.

```markdown
---
description: Faz commit no estilo do projeto
allowed-tools: Bash(git *)
---

1. `git status` e `git diff` para ver o que entra.
2. Mensagem em **português**, no formato `tipo: oração` — e quando houver um porquê
   que não é óbvio pelo diff, ele vem depois de um travessão.

Tipos em uso: feat, fix, docs, test, chore, ci, wip.

Exemplos reais deste repo (siga o registro):
- `fix: oclui o pe sob a bota, e o gate que a folha visual expos`
- `fix: cor do avatar em custom property, senão dois bonecos na mesma página colidem`
- `ci: falhar em senha truncada na connection string, em vez de dar tudo certo`
- `test: fazer o e2e medir o que diz medir, e destravar a suíte`

Descreva o efeito, não o arquivo mexido. Nada de "atualiza componente X".
3. Mostre a mensagem e espere aprovação antes de commitar.
```

---

## 6. As três guardas

Três coisas neste repo podem dar errado de um jeito que nenhuma boa vontade
impede. Vale travar na ferramenta.

Cole em `.claude/settings.json` (vale para o repo todo — e veja o aviso do
`.gitignore` na §5 se quiser que ele seja versionado de fato):

```json
{
  "permissions": {
    "deny": [
      "Bash(npm run test:e2e:*)",
      "Bash(npx playwright test:*)",
      "Bash(*apply-migration*)",
      "Read(./.env.local)"
    ],
    "allow": [
      "Bash(npm run typecheck)",
      "Bash(npm run lint)",
      "Bash(npm test)",
      "Bash(npm run build)",
      "Bash(npm run verify:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ]
  }
}
```

**`deny` vence `allow`.** Um `deny` não impede você de rodar o comando — impede que
ele aconteça sem que você peça explicitamente, fora do modo automático.

Por que cada um:

- **e2e** — o CLAUDE.md diz que bate no Supabase de **produção** e cria/remove
  usuários reais. Isso nunca deveria ser algo que eu decido rodar sozinho no meio
  de uma verificação.
- **apply-migration** — escreve no banco remoto, e o efeito não desfaz.
- **`.env.local`** — o repositório é **público**, e você já teve uma senha vazada
  num chat (rotacionada em 28/07). Se eu não posso ler, não posso vazar.

### ⏳ Revisar isto antes do lançamento

> **Estado em 30/07/2026:** os quatro `deny` acima estão instalados em
> `.claude/settings.json` e funcionando (testado). O padrão do apply-migration
> ficou como `Bash(*apply-migration*)`, que é **largo demais** — ele bloqueia até
> listar ou dar grep no arquivo, não só executar. Decisão consciente de deixar
> assim por ora, porque o banco só tem contas de teste e o risco do e2e é baixo.
>
> **Quando houver aluno de verdade no banco, faça duas coisas:**
>
> 1. Trocar `"Bash(*apply-migration*)"` por `"Bash(*tsx *apply-migration*)"` —
>    bloqueia executar, libera consultar.
> 2. Acrescentar `"Bash(npm run test:e2e)"` (sem o `:*`), porque não está
>    confirmado que a forma com sufixo cobre o comando sem argumento nenhum. Nesse
>    caso específico, redundância vale mais que dúvida.
>
> A partir daí, um e2e acidental deixa de ser incômodo e passa a ser incidente com
> dado de menor de idade. É a linha que separa os dois cenários.

### O hook da migration

A regra "nunca modificar uma migration já aplicada" é a única do CLAUDE.md que
depende inteiramente de eu lembrar dela. Um hook a transforma em garantia:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -Command \"$p = ($env:CLAUDE_TOOL_INPUT_FILE_PATH -replace '\\\\','/'); if ($p -match 'supabase/migrations/') { $rel = $p -replace '.*?(supabase/migrations/.*)$','$1'; git ls-files --error-unmatch $rel 2>$null; if ($LASTEXITCODE -eq 0) { Write-Error 'Migration ja commitada — crie uma nova, nao edite esta.'; exit 2 } }\""
          }
        ]
      }
    ]
  }
}
```

Bloqueia edição de qualquer arquivo em `supabase/migrations/` que já esteja
rastreado pelo git. Migration nova (ainda não commitada) passa normal. Saída 2 é o
código que o Claude Code lê como "bloqueado, e o motivo está no stderr".

> Vale testar esse hook uma vez antes de confiar nele: tente me pedir para editar
> uma migration antiga e confirme que trava.

---

## 7. Higiene de permissões

Seu `.claude/settings.local.json` tem 22 entradas acumuladas ao longo dos meses,
várias inúteis — tem um `sed -E 's/^[a-f0-9]+ //'` que você aprovou uma vez e nunca
mais vai usar.

Diferença que importa:

| Arquivo | Escopo | Vai pro git? |
|---|---|---|
| `.claude/settings.json` | O repo. Vale para qualquer máquina | Deveria — hoje **não vai**, veja §5 |
| `.claude/settings.local.json` | Só esta máquina | Não, e é o certo |

Hoje os dois estão fora do git, porque o `.gitignore` ignora `.claude/` inteiro.
Não é um problema urgente (o CI não usa nada disso), mas significa que qualquer
comando ou permissão que você criar vive só nesta máquina.

As regras estáveis (rodar `npm run verify:*`, ler o git) pertencem ao
`settings.json`. O `local` é para experimento e coisa pessoal.

E existe uma skill que faz a faxina sozinha: **`/fewer-permission-prompts`**. Ela
varre seus transcripts, vê o que você mais aprova na mão, e propõe uma allowlist
priorizada. Rode uma vez — provavelmente elimina metade dos prompts que você
responde por reflexo.

---

## 8. Headless — o Claude fora da sessão

`claude -p` roda e sai, sem REPL. Serve para colar num script.

```powershell
# Revisar o diff antes de empurrar
git diff main | claude -p "Revise este diff contra as REGRAS INVIOLÁVEIS do CLAUDE.md. Liste só violações reais, com arquivo e linha. Se não houver, responda OK." --max-turns 3

# Triar uma falha do CI
gh run view --log-failed | claude -p "Qual dos gates quebrou e por quê? Uma causa, com o trecho da saída que prova." --max-turns 2

# Saída estruturada para script
claude -p "liste os arquivos sem teste em scripts/avatar/" --output-format json
```

Flags que importam aqui: `--max-turns` (limita o loop e o custo), `--allowedTools`
(permite só o necessário, sem prompt), `--output-format json` (para consumir em
script), `--model sonnet` (mais barato para triagem).

O primeiro exemplo é o que eu recomendo virar hábito: rodar antes do push, não
depois do CI reclamar.

---

## 9. Windows e PowerShell — o que muda

O cheat sheet original assume bash. Na sua máquina:

- **Instalar/atualizar**: `irm https://claude.ai/install.ps1 | iex`, e `claude update` depois
- **`&&` não existe** no PowerShell 5.1. Use `comando1; if ($?) { comando2 }`
- **`Alt`** no lugar do `Option` do Mac (`Alt+P` modelo, `Alt+T` thinking, `Alt+O` fast)
- **Caminho com espaço** sempre entre aspas duplas
- Você tem o Git Bash disponível também — quando o script for POSIX, ele é mais
  simples que traduzir para PowerShell
- Rodando pela extensão do VSCode, os caminhos que eu cito viram link clicável

---

## 10. Multi-AI — o handoff

Você usa ChatGPT, Gemini e v0.app junto. Duas coisas ajudam:

- **`/export`** gera o arquivo da conversa. É o jeito rápido de levar o contexto de
  uma investigação para outra IA sem reescrever tudo.
- **Os `docs/` numerados já são o seu protocolo de handoff** — o
  `16-uniformes-runbook.md` é literalmente "o que pedir ao gerador". Vale manter
  esse padrão: quando outra IA precisa de contexto, o caminho é apontar o doc, não
  colar o chat.

Uma anotação da memória do projeto que continua valendo: o conversor Adobe → SVG
serve como **referência de pose, não como asset** (auto-trace entrega fundo preto,
cor assada e zero slot — e o `conferirSvg` aprova mesmo assim).

---

## Se você for aplicar só três coisas

1. **`/clear` entre tarefas e `/compact <instrução>` dentro delas.** Custo zero,
   efeito imediato na qualidade das suas rajadas longas.
2. **`.claude/commands/gate.md`.** Transforma a Regra de Evidência de intenção em
   procedimento — e é a resposta direta ao seu histórico de bugs que mentiam.
3. **Os quatro `deny` da §6.** Cinco minutos, e o e2e nunca mais roda em produção
   por acidente.

O resto é ganho incremental. Esses três mudam o dia.
