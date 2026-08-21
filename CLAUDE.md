# Academia 64 — Plataforma Educacional de Xadrez

## Sobre o Projeto
Plataforma web educacional de xadrez do Clube de Xadrez Guabiruba (Academia 64).
Mobile-first, com gamificação e progressão verificável pelo servidor.

**O produto se chama Academia 64 desde 2026-08-20.** *Recruta 64* é nome
histórico: sobrevive no nome deste diretório, em nome de arquivo de doc e em
migration já aplicada — e em lugar nenhum que o aluno leia. A lei tonal é
[docs/Academia64_Biblia_Tonal_v2.md](docs/Academia64_Biblia_Tonal_v2.md).

## Stack
- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS + RPCs)
- chessground + chess.js (tabuleiro e lógica)
- Stockfish WASM (Web Worker, browser-only)
- Zustand (state) + Howler.js (áudio)
- Deploy: Vercel + Supabase

## REGRAS INVIOLÁVEIS

### 1. Server-authority
Toda concessão de recompensa (XP, rating, missões, baús, conquistas, streak)
acontece EXCLUSIVAMENTE no servidor via RPC/trigger.
O client envia tentativas. O servidor valida e decide.
- Client envia: puzzle_id + lances; bot_id + PGN; lesson_step + resposta
- Servidor: valida, calcula, concede (idempotente, transacional)

### 2. Segurança
- RLS ativo em TODAS as tabelas (aluno só vê/edita seus dados)
- NUNCA expor service_role key ou segredos no client
- NUNCA confiar no relógio do client para prazos/expiração
- SEMPRE usar @supabase/ssr (createBrowserClient / createServerClient com getAll/setAll)
- NUNCA usar @supabase/auth-helpers-nextjs (deprecado)

### 3. Não over-engineer
- Não adicionar features, refactors ou abstrações além do pedido
- Mínimo de complexidade necessária para a tarefa atual
- Não criar helpers/utils para operações usadas uma única vez

### 4. O aluno escolhe DUAS cores, e são estas: pele e cabelo
**Nada mais no avatar recolore. Nunca.** Traje, chapéu, rosto, óculos, pet,
fundo, moldura, item de baú — todos têm **cor final, assada no desenho**.
É a *emenda à D27*, decidida e permanente; ela já revogou a cor de fundo
(`avatar_bg_color` não existe) e a recolorização do traje por título.

Na prática, isto proíbe quatro coisas que já foram tentadas:
- **coluna nova de cor** no banco (`avatar_*_color` além de `avatar_hair_color`);
- **custom property nova** `--av-*` no SVG — tem trava: `svgContrato.ts` reprova
  qualquer propriedade fora do contrato, e o escopo `camada` está **vazio**;
- **seletor de cor** na interface para qualquer slot que não seja pele ou cabelo;
- **pedir arte em cor instrumental** para repintar depois (o ciano morreu em
  2026-08-13; a arte chega em **cor final**).

A barba é a única exceção aparente, e não é exceção: ela recolore **junto com o
cabelo** (`var(--av-cabelo)`, decisão D17), porque é cabelo.

**Consequência de esteira, e é o que decide o formato de toda peça nova:** quem
tem cor assada vira `.svg` avulso pela rota do traje; quem recolore (cabelo e
barba) fica na geometria declarada com token de cor. É a única pergunta que
bifurca a esteira de arte — ver doc 19 §12.

**Desde 2026-08-20, o RASTER carrega o tom nos dois lados dessa bifurcação — e
isso não abre exceção nenhuma aqui.** A regra proíbe **cor assada** onde o aluno
escolhe; ela nunca proibiu **tom**. Quem produzia peça de duas cores era o
`potrace`, que traça contorno, e contorno é binário. Então:

- **quem tem cor assada** (traje, chapéu, óculos, pet, fundo) sai como `<image>`
  WEBP dentro do `.svg` — arte NOVA só; `traje-farda` e `traje-gambesao` estão
  congeladas no vetor por decisão do Doug, com trava mecânica em `traje.ts`;
- **quem recolore** (barba) sai como silhueta em `formas` com token de cor **mais
  uma máscara de luminosidade**: um PNG **cinza** servido à parte, em
  `public/items/rosto/`, com o catálogo guardando só o caminho. A máscara não tem
  cor — é um canal de cinza —, então a cor continua vindo inteira de
  `var(--av-cabelo)`, que é a escolha do aluno. O `typecheck` cobra isso: o braço
  `arte` da união declara `tom?: never`.

Doc 19 §12 (traje) e §13 (rosto); o argumento longo está em `TomDaPeca`
(`src/lib/avatar/estilo/tipos.ts`).

#### 5. Regra de Evidência (anti-hallucination)
Antes de alterar qualquer bug/fluxo:
1) Reproduzir (passos).
2) Apontar 1 causa provável com **arquivo+linhas** e/ou **query SQL**.
3) Propor fix mínimo.
4) Criar/rodar Gate de verificação que falha antes e passa depois.

## Padrões do Projeto

### Auth e Routing
- Next.js 16 usa proxy.ts (NÃO middleware.ts)
- Entry point: src/proxy.ts → src/lib/supabase/proxy.ts
- Rotas públicas: /, /login, /registro, /auth/*
- Tudo mais requer autenticação

### Componentes
- Preferir Server Components; Client Components só com interatividade/hooks
- Puzzles pré-importados do Lichess CSV (nunca API em tempo real)
- Stockfish roda no browser via Web Worker (nunca no servidor)
- Sons respeitam configuração de mudo do usuário

### Migrations
- NUNCA modificar uma migration já aplicada — sempre criar nova
- Formato: supabase/migrations/YYYYMMDDHHMMSS_descricao.sql
- Aplicar no banco remoto:
  `npx tsx scripts/apply-migration.ts supabase/migrations/<arquivo.sql>`
  - **O caminho é a partir da raiz do projeto** — só o nome do arquivo dá `ENOENT`
  - Conecta direto via connection string do .env.local (não requer Supabase CLI)
  - Supabase CLI NÃO está instalado nesta máquina
  - **Nunca escrever `BEGIN;`/`COMMIT;` na migration.** O postgres.js recusa
    transação explícita (`UNSAFE_TRANSACTION`) — e recusa DEPOIS de o servidor ter
    executado, então o terminal imprime erro sobre uma migration que aplicou. Um
    lote de comandos já roda em transação implícita; as 69 migrations anteriores
    não têm `BEGIN` e são atômicas do mesmo jeito

## Workflow
- Antes de iniciar fase/tarefa grande: `npm run build`
- Entregar arquivos completos (sem patches soltos)
- Commits em português: "feat: adicionar modo rating de puzzles"
- Se precisar de informação ou ação do usuário para avançar ou para realizar um tarefa de forma mais rápida e/ou efetiva, perguntar imediatamente — não assumir
- Se o prompt do usuário for ambíguo, incompleto ou puder ser melhorado, apontar antes de executar

## Coordenação entre agentes

- **Uma tarefa tem um único executor.** O outro agente, se houver, revisa ou audita.
- **Agentes diferentes trabalham em branches e worktrees separados.** Nunca dois
  na mesma cópia de trabalho.
- **Cada tarefa declara seus arquivos de posse antes de começar** — e o escopo
  fica no briefing da tarefa, não em arquivo de regra, porque escopo envelhece.
- **Nunca dois mexendo ao mesmo tempo** em arquivo compartilhado, migration ou
  `package.json`.

Existe um [AGENTS.md](AGENTS.md) na raiz: é a porta de entrada de agentes que não
sejam o Claude Code (o Codex o lê; `.claude/settings.json` e os hooks **não**
valem para ele). Ele é **subordinado a este arquivo** e só repete as proibições
que aqui têm trava técnica e lá não têm. Não deixe virar segunda fonte de verdade.

O que já foi delegado ao Codex e o que está na fila fica em
[docs/codex-fila.md](docs/codex-fila.md) — com as regras de engajamento, os modos
de trabalho e os briefings.

**Problema que eu acho, eu conserto.** Se um defeito aparece no meio do trabalho e
o conserto está ao meu alcance, o caminho é consertar — com a Regra de Evidência
(reproduzir, uma causa com arquivo e linha, fix mínimo, gate que falha antes e passa
depois), não registrar e seguir. Registrar em vez de consertar foi uma regra deste
projeto até 2026-08-20 e o Doug a revogou: ela transformava achado em fila e fila em
represa.

Parar e perguntar continua certo em três casos, e só neles:

- o conserto exige **arte do Doug** (desenhar, redesenhar, julgar a olho);
- ele tem **mais de uma saída defensável** e escolher uma é decidir por ele — aí a
  pergunta é curta e vem com as opções medidas, não com a minha preferida;
- ele **atropela uma frente em execução** — outro agente, outro branch, migration
  pendente.

[docs/achados.md](docs/achados.md) **passa a ser do Codex.** É onde ele registra o
que encontra, ranqueado por gravidade, para o Doug mandar consertar na hora certa.
Eu leio de lá quando ele mandar; eu não escrevo lá o que eu mesmo posso resolver.

## Skills — invocar, não torcer para lembrar

Este projeto tem skills escritas para si mesmo e elas quase nunca dispararam: em
45 sessões, o tool `Skill` foi chamado **4 vezes**, e nem `design-recruta64` nem
`/gate` estavam entre elas — inclusive nos commits de design em que a primeira
era obrigatória. Skill que depende de eu lembrar é skill que não roda. **Invoque
pelo gatilho abaixo, antes de começar, sem esperar o usuário pedir.**

| Gatilho | Invocar |
|---|---|
| Qualquer tela, componente, cor, tipografia, animação, texto de UI — e sempre ao trazer tela do v0.app/Gemini | `design-recruta64` (regras vinculantes) |
| Construir componente novo, migrar tela para os primitivos de `src/components/ui/`, ou mexer em espaçamento/hierarquia/estado vazio | `impeccable` |
| Bug, comportamento errado, "isso não devia acontecer" | `/gate` |
| Desenhar peça do elenco do avatar — cabelo, chapéu, traje, pet, fundo — ou refazer uma que lê errado | `avatar-desenho` (3 variantes, crítica renderizada) |
| **O Doug editou a arte sobre a base oficial** (`arte:base` → Gemini) e ela precisa virar peça — não desenhe variante: **importe pela rota de arte**. Vale para **cabelo e traje**: a skill bifurca no começo, e se o arquivo começa com `traje-` o corredor é outro | `avatar-importar-arte` (o runbook é [docs/avatar/19-rota-de-arte-runbook.md](docs/avatar/19-rota-de-arte-runbook.md); a esteira do traje é a §12 dele) |
| Referência de arte nova, ou qualquer número de `geometria.ts` que precise sair de medição | `avatar-regua` |
| Detalhe de movimento, transição, o que faz a interface "sentir" bem | `emil-design-eng` |
| Antes de mexer em auth, RLS, RPC de recompensa, ou qualquer coisa que o repositório público exponha | `security-review` |
| Escrever ou revisar busca de dados (`page.tsx` com `await`, hook de fetch), import pesado, ou qualquer suspeita de lentidão — **exceto a família `js-`**, que não vale aqui | `vercel-react-best-practices` (vendorizada da Vercel, MIT; leia `rules/<nome>.md`, nunca tudo) |

O usuário digita `/prototype` e `/review-animations` quando quiser — as duas têm
`disable-model-invocation` e **nunca** disparam sozinhas. Se o caso pedir uma
delas, sugira em uma linha em vez de tentar invocar.

**As três de avatar quase sempre olham PNG — a imagem vai por subagente.** Quem
lê o arquivo é o subagente; o thread principal recebe a descrição medida em
texto. As de `.scratch/` chegam a 500 KB e ficam sendo relidas até o fim da
sessão. Regra completa na seção **Imagens** do `~/.claude/CLAUDE.md`.

## Verificação (rodar antes de concluir)
- `npm run typecheck` (tsc --noEmit)
- `npm run lint`
- `npm test` (vitest)
- `npm run build`
- `npm run verify:all` (a cadeia inteira de gates — substitui rodar um a um)
- `npm run test:e2e` (quando mexer em UI/auth) — **ATENÇÃO: bate no Supabase de
  PRODUÇÃO**, cria e remove usuários reais. Rodar com intenção, nunca em CI.

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push/PR **exceto o e2e**,
pelo motivo acima. Os scripts de verify leem as credenciais de `process.env`
quando não há `.env.local` — é assim que funcionam em CI.

## Estrutura-chave
- src/app/ → rotas (App Router)
- src/components/chess/ → componentes do tabuleiro
- src/lib/supabase/ → clients SSR + proxy de auth
- src/hooks/ → useUser, useSound, etc.
- supabase/migrations/ → SQL migrations versionadas
- scripts/verify/ → gates de validação por fase

## Referências (ler antes de mudanças grandes)
- **Onde estamos: `docs/ESTADO.md` — comece por aqui.** É **gerado**, não escrito:
  `npm run estado` reconta tudo do repositório, e `verify:estado` reprova se
  envelhecer. Existe porque o estado deste projeto vivia em 13 documentos que
  discordavam — a contagem de gates do `verify:all` aparecia à mão em seis lugares,
  com quatro valores diferentes. **Não escreva número de progresso em doc nenhum:
  ou o painel já mede, ou é caso de ensinar `scripts/estado.ts` a medir**
- **A lei tonal: `docs/Academia64_Biblia_Tonal_v2.md`.** Um doc, uma era —
  identidade, mapa da Academia, escada de títulos, vocabulário oficial, tom de
  voz, direção visual, lei da arte de traje e lei do elenco de bots. Onde
  divergir de outro doc de produto ou design, **ela vence** (só este arquivo está
  acima dela). A v1, escrita para o reino medieval, está em `docs/_superado/`.
  **A escada mudou de nome e não de número** — quem ler doc antigo traduz assim:
  Soldado→**Aprendiz**, Aspirante→**Estudante**, Capitão→**Analista**,
  Comandante→**Estrategista**, General→**Mestre**, Mestre→**Grão-Mestre**; o
  tier 0 é **Calouro**. Os slugs do banco não mudam
- Design System: [DESIGN.md](DESIGN.md) — tokens, escada de cor, tipografia,
  componentes e os Do's/Don'ts. Deriva da Bíblia; a skill `design-recruta64` é só
  o gatilho dele
- Produto: [PRODUCT.md](PRODUCT.md) — superfícies, restrições e brand commitments
- Visão do Produto: docs/Recruta64_Visao_do_Produto_v1.md — **a §5 (aulas) está
  superada** pelo currículo abaixo
- Currículo das aulas: `docs/curriculo/01-curriculo-definitivo-v1.md` — **aprovado em
  2026-07-30, revisão 4 em 2026-07-31; é a fonte de verdade do conteúdo pedagógico.**
  126 aulas em 7 trilhas (26·21·19·18·17·14·11), coluna de defesa da trilha 1 à 6,
  **meta de volume derivável célula a célula** (§4), 3 blocos de revisão espaçada
  obrigatórios por trilha, 10 mini-jogos, 5 duelos com missão, **prática contra o
  motor** em 20 aulas de técnica (modelo lichess Practice) e o professor-guia.
  **Posições vêm dos livros comprados** (cadernos do Steps + de la Villa; posição é
  fato, explicação se redige do zero — regras na §4) e do banco Lichess mediante o
  gate de lastro. §15 = changelog da rev. 3; §16 = da rev. 4. **É só conteúdo** —
  o plano técnico dos formatos está no doc abaixo
- Plano técnico dos formatos: `docs/curriculo/02-plano-tecnico-trilha1-v1.md` —
  **aprovado, revisões 2 e 3 em 2026-08-04.** Cobre lição interativa (§3.1),
  prática contra o motor (§3.2), quiz (§3.3), mini-jogo (§3.4 + a §4 inteira: um
  motor, três famílias, sete jogos), bloco de puzzles na aula (§3.5), bloco de
  revisão espaçada (§3.6), duelo com missão (§3.7) e `verify:curriculo-banco`
  (§5.3). Mais a camada de competência (§2), o mapa tema×faixa (§5.2), as
  decisões D1–D6 (§6) e os blocos de execução B0–B7 (§7, **propostos, não
  iniciados**). O **move trainer** foi adiado de propósito para o plano da T3 —
  está na §9, "o que este plano adia com todas as letras"
- Roadmap Técnico: docs/Recruta64_Roadmap_Tecnico_v1.md (a seção "Estado real" é a
  única parte confiável — a Parte 1 é um guia de setup pré-projeto)
- Avatar: **o plano vigente é o v4**, e são seis documentos com papéis distintos:
  - `docs/avatar/15-plano-ate-pronto.md` — **comece por aqui.** O plano de
    execução do estado atual até pronto, em 10 blocos com gate. Onde divergir
    dos outros, ele vence. As §7, §7b e §7c são as regras de arte e de composição
  - `docs/avatar/19-rota-de-arte-runbook.md` — **antes de mexer em arte de peça
    (cabelo, chapéu), leia este.** A rota vigente: o Doug edita sobre um render do
    próprio compositor, o Gate −1 prova que o boneco não se mexeu, e a peça sai
    medida. A esteira comando a comando, o que cada reprovação significa, a régua
    que decide `fiel` × `lei`, a promoção e a reentrada. O registro de execução
    número a número fica em `scripts/avatar/arte/ESTADO-DA-ROTA.md`. **Ele
    substitui o traçado antigo** (`avatar:tracar` → `avatar:fidelidade`) como
    caminho para arte nova — mas `tracar-cabelo.ts` é biblioteca compartilhada e
    **não se apaga**
  - `docs/avatar/16-uniformes-runbook.md` — **antes de gerar arte de uniforme,
    leia este.** O processo de ponta a ponta: o que pedir ao gerador, a tabela de
    matiz, as três camadas do asset, as variantes por DPR, os oito gates e o que
    cada reprovação significa
  - `docs/avatar/17-patentes-uniformes-design.md` — o design dos 6 títulos com
    cor: a lei das cores do pipeline, a paleta medida e o racional pela Bíblia
    Tonal. A régua de verdade é `scripts/avatar/patentes.ts`, medida por
    `verify:paleta-patentes`. **A §4 (uniforme por patente) e a §6 (as 5 regiões)
    são histórico** — a cor migrou para a moldura e as regiões viraram o mapa da
    Academia (Bíblia v2 §5)
  - `docs/avatar/18-uniformes-blocos.md` — **para abrir, copiar e fechar.** Os 4
    pedidos prontos (Capitão, Comandante, General, Mestre) e a esteira até o gate
  - `docs/avatar/23-linha-de-arte.md` — **a LEI de arte de peça, e é fonte única.**
    Antes de desenhar, pedir ou julgar qualquer peça de qualquer slot. As cinco
    leis promovidas de *traje* para *peça*, com o que cada uma quer dizer em cada
    slot; o traço em **espessura E cor** (a régua `arte:borda` nasceu com ele); as
    regras do tom; a raridade em desenho por slot; e os **três** tamanhos de
    julgamento — 56 px tronco, **32 px peça de cabeça**, 340 px extremo. Ele
    substituiu três cópias do mesmo texto (doc 22 §4, doc 21 §0.4, Bíblia v2 §10),
    que hoje são ponteiros de uma linha
  - `docs/avatar/22-catalogo-de-pecas.md` — **o menu de onde a próxima arte é
    escolhida**, nos 4 slots: 56 peças com raridade, organizadas por corredor da
    Academia. Não é fila de produção, e a lei de arte não está mais nele
  - `docs/avatar/21-slots-do-avatar-plano.md` — o plano vigente do guarda-roupa
    (traje, chapéu, rosto, pet), e onde o título deixou a roupa e virou moldura
  - `docs/avatar/20-troca-de-pilha-plano.md` — a troca de pilha: apagar o avatar
    v2 e pôr o kokeshi em produção
  - `docs/avatar/12-avatar-v4-plano-completo.md` — as 30 decisões e o porquê,
    mais a **emenda à D27**: só pele e cabelo recolorem
  - `docs/avatar/13-checklist-de-verificacao.md` — os ~90 itens de auditoria
  - `docs/avatar/14-backlog-execucao.md` — **é onde o progresso fica marcado**,
    tarefa a tarefa. Quantas são e quantas fecharam: `docs/ESTADO.md`
  - As gerações v2 e v3 (os antigos docs 00–11) foram arquivadas em
    `docs/avatar/_superado/` — **não valem como instrução**, e o README de lá diz
    o que substituiu cada uma. O mesmo para `docs/_superado/` (Art Guide e
    Relatório da v2). Não leia nenhum dos dois sem motivo histórico
