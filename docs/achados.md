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

### T3 — Os documentos do avatar se contradizem sobre decisões **já tomadas**
**Prova:** `LIDO` — 13 pares, todos com arquivo:linha. Achado por Codex, C1,
2026-08-07. Cinco conferidos por amostra pelo Claude: cinco confirmados.

**É um achado, não treze.** A doença é uma: decisão tomada num documento e não
propagada aos outros. Fecha numa passada só pelo conjunto 12·13·14·15·17·18 —
e o `CLAUDE.md` já diz quem vence: *"onde divergir dos outros, o doc 15 vence"*.

O caso mais grave é o doc 15 **contra ele mesmo**, justamente o que deveria
arbitrar:

| Diz | E também diz |
|---|---|
| `15:398` — "A sobrancelha ✅ **DECIDIDA em 2026-07-31: fica PRETA**" | `15:974` — "a cor do cabelo move também a **sobrancelha**" |
| `15:1103` — alvo do reseed é **54** | `15:1474` — o checklist ainda diz **60 de 60** |

Os outros onze:

| Divergência | Obsoleto | Vigente |
|---|---|---|
| Reseed do catálogo: 60 × 54 | `14:457` | `15:1103` — o 60 ainda conta o `hand`, removido em `15:1063` |
| Baú "nunca relíquia" × "nunca frame" | `14:459` | `15:1108-1109` — a relíquia saiu com o `hand`; a moldura assumiu o mérito |
| **Sete patentes** (Grão-Mestre, Lenda) × **seis uniformes** | `15:117`, `14:405` | `17:14` — "por que são 6 uniformes", e o `CLAUDE.md:184` nomeia o 17 como design vigente |
| Total 54 derivado de **sete** uniformes | `15:1103` | com seis, a soma dá **53** |
| Escolha de **cor de fundo** | `14:460`, `15:1115` | `15:926` — sem `avatar_bg_color`, pela emenda à D27 (`12:74`) |
| Sobrancelha segue a cor do cabelo | `12:85`, `14:365` | `15:398` — fica preta, por medição |
| Base ganha **cabelo assado** | `12:29` | `15:935` — a D5 fechou pela terceira saída; base fica careca |
| Pets em **APNG** | `12:108` | `14:139` — SVG animado, por decisão medida |
| **Oito slots**, incluindo `hand` | `12:35`, `13:26` | `15:332` — o `hand` foi removido |
| Pipeline `avatar:garment`, variantes e máscaras | `CLAUDE.md:180`, `18:353` | `16:3`, `15:768` — é da base antiga, passa por vacuidade, **suspenso**. A substituição segue em aberto (`15:784`) |
| Asset ausente "hoje falha em silêncio" | `13:75` | `14:49` — a falha alta já está implementada, com erro e marcador |

**O que falta para fechar:** uma passada pelos seis documentos aplicando "o doc
15 vence", **mais** resolver as duas autocontradições internas dele, que nenhuma
regra de precedência resolve. E decidir de fato a escada de patentes, porque
`15`/`14` dizem sete, o `17` diz seis e a migration insere **oito** tiers (até
`Lenda`, 210) — três respostas, não duas. Conecta com o **T1**.

### T4 — Dois documentos do currículo ainda declaram o plano técnico inexistente
**Prova:** `LIDO` — `docs/curriculo/01-curriculo-definitivo-v1.md:6`

> *"O plano técnico é documento separado, **ainda não escrito**."*

**Trabalho meu incompleto, não achado de terceiro.** Em 2026-08-06 eu corrigi a
§13 (linha 615) e não vi o cabeçalho (linha 6) — e o cabeçalho é o que se lê
primeiro. O doc 02 também preserva a narrativa antiga em `02:7`.

Cabe junto: `01:234` lista a **peça cravada** entre as competências críticas da
T1, mas a grade põe o tema na T2 (`01:297`), e o plano técnico a remove por isso
(`02:104`).

**O que falta:** três linhas. Está aqui, e não no conserto, porque a regra 9 vale
para mim também.

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

### T6 — O matcher do proxy não isenta `sounds/` nem `stockfish/`
**Prova:** `VERSIONADO` — `src/proxy.ts:16-20` · efeito em runtime **não reproduzido**

O matcher isenta `_next/static`, `_next/image`, `favicon`, `robots`, `sitemap`, `chess/`
e uma lista de extensões — `svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|ico`. **Não** isenta
`sounds/`, `stockfish/`, `.mp3` nem `.wasm`.

O comentário logo acima (`src/proxy.ts:8-15`) descreve esta classe de falha em detalhe,
porque o projeto **já a pagou uma vez** com `chess/`: uma ida ao Supabase por download, e
um modo de falha silencioso — cookie expira → 307 para `/login` → o fetch segue o
redirecionamento → o parser recebe HTML → devolve `null` sem avisar ninguém.

Consumidores reais existem: `public/sounds/` (17 `.mp3`, via `soundManager.ts`) e
`public/stockfish/` (`stockfish.js` + `stockfish.wasm`, via
`new Worker("/stockfish/stockfish.js")` em `StockfishEngine.ts`). Não autenticado em rota
protegida vira redirect para `/login` (`src/lib/supabase/proxy.ts:46-51`).

**É hipótese de efeito, não bug provado.** O fato estático está confirmado; ninguém
observou a requisição. A lição do G6 é exatamente esta: *a causa que se escreve ao achar
não é necessariamente a causa.*

**O que falta para fechar:** rodar `/gate` — observar `/sounds/move.mp3`,
`/stockfish/stockfish.js` e `/stockfish/stockfish.wasm` com sessão válida, deslogado e com
cookie expirado. Se atravessar o proxy, o fix mínimo é acrescentar `sounds/` e `stockfish/`
ao matcher, nunca abrir a regex.
**Gravidade provisória:** a taxonomia não tem casa para bug latente de runtime; fica 🟠
porque a Fase 11 (sons + service worker cacheando exatamente estes caminhos) construiria
sobre a premissa de que asset público não passa pelo proxy. Revisar depois da medição.
**Achado por:** Fable, revisão da integração, 2026-08-07.

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

### G8 — a variante `faixa` fura a própria álgebra, e o teto não age na calota
**Prova:** `MEDIDO` — 2026-08-08, render a 2 px/unidade da `entrada-2`

A variante `faixa` (`scripts/avatar/arte/converter.ts`) deriva o núcleo por

```
núcleo = { d > PISO } ∩ ( ciano ∪ { d > TETO } )
```

Por álgebra, `núcleo_lei = { d > TETO }` é **subconjunto** de `núcleo_faixa` — todo
pixel com `d > TETO` satisfaz os dois termos. Logo o preto da `faixa`, que é
`massa − núcleo`, teria de ser **subconjunto do preto da `lei`**.

**Medido: 7 741 px de preto existem na `faixa` e não existem na `lei`**, com focos na
calota. E lá a massa contígua tem **155–583 u de profundidade**, ou seja `d > TETO`
é alcançável com folga — o teto tinha como agir e não agiu. O que roda não é a
fórmula que o comentário descreve.

**O custo, e é o que tirou a variante de uso:** amplitude ÷ mediana de **0,91**
contra 0,39 da `fiel` e 0,29 do chanel, com máximo de **20,6 u** — o dobro da `lei`,
que já tinha sido reprovada por grossa. A variante existe, está documentada e **não
está em `TRANSCREVEM`**.

**Hipótese mais curta, NÃO PROVADA:** o piso parte o núcleo em componentes abaixo de
`PISO_FORMA` numa mecha de ~21 u (8 u de cada lado deixam ~5 no meio),
`lacosPorComponente` as descarta, e a mecha inteira sai preta. Outros candidatos: a
decimação do contorno do núcleo, o `TETO_REFINO`, a ordem das camadas.

**O que falta para fechar:** medir qual dos quatro, com a máscara crua ao lado do
laço decimado. **A causa escrita aqui é hipótese, não causa** — é a lição do G6, e
ela vale para esta entrada também.
**Quem decide se vale a pena:** Doug. Hoje nada depende da `faixa`.

### G5 — `folgaDoRosto` não separa franja de cortina numa peça de laço fechado
**Prova:** `MEDIDO` — `src/lib/avatar/estilo/cabelo.ts`, `folgaDoRosto`

A régua devolve o `y` **mais baixo de qualquer trecho** da poligonal dentro da faixa
de `x` da sobrancelha. Numa franja paramétrica isso é exatamente a franja. Num laço
fechado vindo de arte, a **cortina lateral** atravessa a mesma coluna de `x` bem mais
abaixo, e é ela que o `Math.max` encontra.

Medido na promoção de 2026-08-07:

| peça | `folgaDoRosto` | sobrancelha sob a massa (`dentroDe`, 21 amostras) |
|---|---|---|
| espetado | esq **+7,0** · dir **+3,7** | **0/21** e **0/21** |
| chanel | esq **−233,9** · dir **−238,2** | **0/21** e **0/21** |

**Nenhuma das duas invade o rosto.** O −233,9 do chanel é o segmento 21→22 da massa
dele, a `y 392,9` — a borda interna da cortina do bob descendo ao lado da bochecha,
dentro da faixa `x 189,5…235,5` da sobrancelha esquerda. O docstring da função já
prevê o laço fechado (*"a cortina desce ao lado do rosto pelo trecho de VOLTA"*), mas
para o caso oposto: garantir que a régua **não** devolva `Infinity`.

**Nada quebra hoje:** `cabelo.test.ts` só exige finitude para peça traçada, de
propósito, e o piso da traçada é fato da arte. O custo é de leitura — a linha do
`avatar:folha-base` imprime `folga do rosto esq -233.9 ⚠ é a folga DA ARTE`, e quem
ler entende "a arte enterra o rosto", que é falso.

**Conserto possível:** medir por `dentroDe` na altura da sobrancelha em vez do `y`
mais baixo da faixa — a pergunta vira *"há tinta SOBRE a sobrancelha?"* em vez de
*"há tinta abaixo dela nesta coluna?"*. Mexe numa régua que três testes usam.
**Quem decide:** Doug.

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

### D2 — Por qual caminho a arte do cabelo volta
**Prova:** `LIDO` — bloco AGORA do `ESTADO.md:22` × `15:558`

Listado como decisão travada, mas **já foi tomada**: o plano 15 registra três
decisões fechadas — arte do Doug, dois modelos extremos, aprovação visual. Resta
bloqueio **técnico** (`15:574`), não bloqueio de decisão. E os commits `5db008e`,
`ba18dd0` e `49389a6` de 2026-08-06 fecharam a rota de arte e o chanel.

*(Antes eram quatro entradas aqui. Reseed 60×54, relíquia×moldura e o caminho do
cabelo migraram para o **T3**, que é onde elas de fato vivem: a mesma doença, no
mesmo conjunto de documentos, que fecha numa passada.)*

### D3 — Não existe Supabase separado para teste, CI e e2e
**Prova:** `LIDO` — `.github/workflows/ci.yml:10-13,77-78` · `AGENTS.md:28-30`

O CI roda `npm run verify:all`, e o próprio workflow registra que *"A maioria toca o banco
remoto"* (`ci.yml:77-78`). O e2e está fora do CI de propósito, pelo motivo escrito em
`ci.yml:10-13`: *"cria e deleta usuários reais no Supabase de PRODUÇÃO via admin API…
Pré-requisito para incluí-lo um dia: um projeto Supabase separado para teste."* O
`AGENTS.md:30` diz o mesmo em uma linha: *"Não existe ambiente de teste separado."*

**O que NÃO está medido:** para qual projeto os secrets do GitHub apontam. O repositório
documenta um único projeto Supabase, mas isso é leitura de documento, não medição — confere
em Settings → Secrets, e não se afirma antes disso.

Hoje não há dado de aluno em produção, então o risco é futuro, não corrente.

**Decisão do Doug, 2026-08-08:** criar o projeto separado é **pré-requisito de lançamento**.
O produto não entra em uso real com alunos sem isso resolvido. Construir o ambiente é
trabalho próprio, fora dos lotes atuais.
**Achado por:** Fable, revisão da integração, 2026-08-07.

### D4 — A tela do aluno (F2) vem antes de mais desenho e antes do currículo?
**Prova:** `LIDO` — as contagens da F2 e do backlog do avatar estão em `docs/ESTADO.md`,
que é quem as mede

**O trabalho fechado do avatar não chega a ninguém.** Não existe tela onde o aluno veja o
próprio boneco. A F2 é o que transforma o que já está pronto em produto — e a proposta é
que ela venha **antes de mais desenho** (o Bloco 8, a linha A5) e **antes do currículo**.

Não é achado técnico: é ordem de prioridade. Está aqui porque é escolha não tomada, e
porque a alternativa era viver na conversa.

**Se for adotada:** o **Lote 2** do plano de integração sai da fila e espera — ele existe
para destravar a A5, que é justamente mais desenho. O **Lote 1** (contrato da oficina) e o
**Lote 3** (Next 16.2.11) seguem: são oficina e suportabilidade, não arte.

**Conferir ANTES de dimensionar a fase:** se a tela mostra o boneco **vestido**, ela pode
depender do **2b (traje)**, que está aberto e cujo pipeline antigo foi declarado morto
(*"Nenhum traje existe ainda — o Soldado é o primeiro"*, doc 15). Se depender, a fase é
maior do que o painel declara.

**Eleva a prioridade do R1.** Aproximar a tela do aluno aproxima dado de aluno real — e o
R1 é o único 🔴 aberto, cego por desenho enquanto o **G3** não medir escrita.

**Quem decide:** Doug.
**Trazido ao plano em:** 2026-08-08.

---

## Fechados — ficam aqui como precedente

| # | Achado | Fechado em | Como |
|---|---|---|---|
| ✅ | `user_public_profiles` era MATERIALIZED VIEW legível por `anon` e `authenticated`, com `display_name` cru e `ranking_visible` dentro — o opt-out era cortesia da camada de RPC | 2026-08-06 | gate estendido (§4 de `verify:privileges`), reprovou, migration `20260806150000` aplicada, gate passou. `81a2723` |
| ✅ | Doc 13 inerte, 92 itens e zero marcados desde que nasceu | 2026-08-06 | passou a ser usado: 2 comprovados, e a linha do opt-out virou conserto medido. `260e657`, `ed393ad` |
| ✅ | `CLAUDE.md` e o currículo §13 afirmavam que o plano técnico da T1 não existia | 2026-08-06 | corrigido; `scripts/estado.ts` passou a vigiar o doc 02. `f6b97f8` |
| ✅ | **G4** — `arte:gate` sem argumento apontava para `.scratch/arte/`, pasta que o git ignora: resíduo da graduação do Bloco 4, com o caminho escrito à mão em vez de `PASTA` | 2026-08-07 | uma linha. Reproduzido (`Input file is missing: .scratch/arte/entrada.png`, exit 1) e conferido depois (`Resultado: APROVADA`, exit 0) |
| ✅ | **T5** — o espetado **não tem variante que sirva**: a `fiel` some a 56 px (p50 6,3 u, 79,8% do perímetro `< 8 u`) e a `lei` vaza a clara para fora do núcleo erodido (`conterAClara` desiste com `convergiu: false`, 18 vértices, 8 cordas; `contencaoDaClara` −9,2 u). A pré-condição 1 do Passo 7 — *"re-emitir pela `lei`"* — era **falsa**, e três documentos a repetiam | 2026-08-07 | **fechado por DECISÃO, não por conserto.** O Doug escolheu aceitar o espetado congelado no sintetizado e **tirar o Passo 7 do plano**. As duas famílias de peça traçada passam a conviver em caráter permanente e `Cabelo.linhas` vira campo definitivo. Corrigidos o backlog 14, a §3 e a §4 do runbook 19 e o docstring de `TRANSCREVEM` |
| ✅ | **G7** — a rota de arte **descartava `convergiu`**. `conterAClara` devolve `convergiu: false` quando conter a clara dobraria o laço, e `importarPeca` sempre reprovou nisso; `converter.ts` consumia só `.pts` e emitia a clara não-contida **calada**. Quem reprovava era `cabelo.test.ts` dois passos depois, com um número que não diz de onde veio | 2026-08-07 | `Convertido.claraConvergiu` passou a carregar a resposta, `arte:converter` a imprime e `arte:pecas` reprova nomeando a arte. Provado nos dois sentidos: exit 1 com o espetado na `lei`, exit 0 sem ele — e o literal voltou byte a byte ao HEAD |
| ✅ | **G6** — `npm run build` vermelho no `prebuild`. **A causa registrada estava ERRADA:** não era manifesto defasado. Era `--check` comparando **bytes crus** através da fronteira LF/CRLF — o gerador escreve `\n`, o `git checkout` desta máquina (`core.autocrlf=true`) devolve `\r\n`, e a comparação reprovava **todo arquivo que o git tivesse tocado** | 2026-08-07 | quebras normalizadas antes de comparar, como `gerar-livro-aberturas.ts:116` já fazia. Provado nos dois sentidos: passa com o arquivo em CRLF, e reprova nomeando o defeito quando um caminho falso é injetado |

O precedente que importa: **os cinco fecharam com gate ou com prova medida, nunca
com relatório.** É o padrão a repetir.

E o precedente **novo**, do G6: *a causa que se escreve ao achar não é
necessariamente a causa.* A primeira entrada dele dizia "o manifesto está defasado" e
mandava rodar `avatar:manifest` — rodar não mudava um byte (`git diff` vazio) e o
check continuava vermelho. Só medindo as quebras de linha arquivo a arquivo a causa
apareceu. **Registrar a hipótese como causa é o erro que a Regra de Evidência existe
para impedir**, e ele aconteceu aqui, dentro do próprio arquivo de achados.
