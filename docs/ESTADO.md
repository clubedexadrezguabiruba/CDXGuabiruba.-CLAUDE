# Estado — Recruta 64

> **Este arquivo é gerado. Não edite à mão** — o gate `verify:estado` reprova se
> você editar. A única parte sua é o bloco **Agora**, logo abaixo, que sobrevive a
> cada regeneração. Todo o resto é recontado do repositório por `npm run estado`.
>
> Existe porque o estado deste projeto vivia em 13 lugares que discordavam entre si.
> Ver o cabeçalho de `scripts/estado.ts` para os números daquela auditoria.

## Agora

<!-- AGORA:inicio -->
🏛️ **A VIRADA PARA A ACADEMIA 64 — em execução desde 2026-08-20, branch
`tema/academia-64`** (a partir de `avatar/bloco5-rosto`, não de `main`: `main`
estava 15 commits atrás e não tinha nem a regra 4 do `CLAUDE.md`).

O produto deixa de se chamar **Recruta 64** e passa a se chamar **Academia 64**; a
espinha militar sai da lei. A virada de 2026-08-13 tinha feito metade — trocou o
universo e a direção de arte, mas manteve a fórmula 70/20/10, a palavra "patente",
as 5 regiões e o vocabulário de interface. Esta fecha a outra metade.

- **Bloco 0 — a lei. FECHADO.** `docs/Academia64_Biblia_Tonal_v2.md`: um doc, uma
  era. A v1 foi para `docs/_superado/`. Fórmula nova **50/25/15/10**, mapa da
  Academia (10 lugares + 5 alas de bot), escada de **títulos**, vocabulário
  oficial, palavras banidas de tela. Slogan escolhido pelo Doug: *"Uma academia
  inteira, e 64 casas para explorar."*
- **Bloco 1 — lei derivada e código de referência. FECHADO.** `DESIGN.md`,
  `PRODUCT.md`, `CLAUDE.md`, a skill `design-recruta64`, `scripts/avatar/
  patentes.ts` (nomes novos; o campo `regiao` **morreu** — era o espelho das 5
  regiões e ninguém o lia), `TRAILS.name`, os mocks do design-lab, e emendas
  datadas nos docs 12 e 17, no currículo (revisão 5), na Visão do Produto e na
  Diretriz dos Bots v1 (marcada como **superada**).
- **Bloco 2 — banco + interface. FECHADO em 2026-08-21.** A ordem foi invertida
  de propósito em relação ao plano — interface primeiro, banco por último —,
  porque não há banco separado (D3) e toda migration bate em produção na hora:
  descer o banco antes da tela deixaria a produção dizendo "Analista" dentro de
  um "Quartel-General". **53 arquivos, 264 linhas trocadas**, e o grep de
  fechamento dá **zero** para `Reino das 64 Casas`, `Quartel-General`, `Duelos da
  Campanha`, `Revisão de Batalha`, `Criação do Recruta`, `Ordens do Dia`,
  `Sequência de Campanha` e `Companhia` em `src/` e `e2e/`. A migration
  `20260821120000_academia_titulos.sql` **está aplicada**, e `verify:all=0`
  medido depois dela.
- **Bloco 3 — os bots. EM EXECUÇÃO desde 2026-08-21, parado no Ponto 5 (a arte).**
  A lei do elenco existe: `docs/Academia64_Diretriz_dos_Bots_v2.md` substitui a
  Diretriz v1. **Elenco aprovado pelo Doug** — 10 personagens, **2 por ala nas 5
  alas** (Pátio · Salas de Treino · Biblioteca · Observatório · Arena), variedade
  medida em natureza (6 humanos · 1 autômato · 1 criatura · 1 animal · 1 não
  declarada) e função. `elo`, `skill_level`, `depth` e `unlock_order` **não mudam**:
  o elenco novo entra por cima da calibração que já existe. Falta: os 10 retratos
  (arte do Doug, **sem prazo**) e as **110 falas — as duas ficam com o Doug, por
  decisão dele em 2026-08-21**; depois delas, a migration de `UPDATE`, e
  `BotGrid.tsx:8-22` + as 4 asserções de `e2e/bots-ui-audit.spec.ts` que ainda
  procuram as regiões do Reino. Os **10 pedidos de arte estão escritos**:
  `docs/Academia64_Pedidos_de_Retrato_dos_Bots.md`.

⚠️ **O retrato de bot é um CÍRCULO de no máximo 96 px, e a arte atual foi feita para
outro frame.** `BotAvatar.tsx` recorta o PNG no círculo inscrito (`rounded-full` +
`object-cover`) e o produto só o usa em 32 · 48 · 64 · 80 · 96 px — `md` (64) na grade
da Sala de Duelos. Medido nos dois extremos do elenco velho: o rosto da `helena.png`
tem **13% da largura do quadro**, ou **8 pixels na tela**; o cenário inteiro dela
(castelo, mapas, globos, astrolábio) cai fora do círculo ou some. A progressão que a
arte velha tinha — fundo do bot fraco borrado (lapVar 16) contra fundo do forte nítido
(lapVar 1346–2819), **~100× mais detalhe** — nunca chegou ao aluno. Os pedidos novos
pedem **close**, fundo simples, e a progressão por **valor, temperatura e silhueta**,
que é o que sobrevive a 64 px. **A saída oposta — dar ao produto uma superfície que
mostre o retrato grande — foi posta ao Doug e descartada por ele:** o frame fica como
está, e é ele que manda no enquadramento.

✅ **Um defeito de produção achado ao escrever a Diretriz v2, consertado e medido no
mesmo dia.** `on_win` e `on_loss` estão **invertidos entre banco e código**: o
código lê as duas chaves na perspectiva do bot ([`GameOverModal.tsx:94`](../src/components/bots/GameOverModal.tsx#L94)
sobre `result`, que é o resultado *do aluno*), e os 10 bots semeados em
`20260307120000` foram escritos na perspectiva do aluno. Efeito: o aluno dava
xeque-mate no Sargento Pardo e ouvia *"Revise os fundamentos, recruta."* Medido nos 10
com `.scratch/medir-perspectiva-falas.ts` — **os 10 estavam trocados, e consistentes
entre si**. A migration `20260821170000_bots_perspectiva_das_falas.sql` **foi aplicada
pelo Doug em 2026-08-21**, e a medição depois mostra os 10 trocados de volta: o
`on_win` do `sargento-pardo` agora é *"Revise os fundamentos, recruta."* e o `on_loss`
é *"Aprovado, soldado. Pode seguir."* `verify:phase6` 18/0 e `verify:seeds` OK depois.
Não há gate permanente possível ("esta frase
foi dita por quem venceu?" não é decidível por máquina); a evidência é a medição
antes/depois. O que **é** verificável, e entra junto com a migration do elenco, é a
contagem por chave da lei das falas (3 · 4 · 2 · 2) — hoje 9 dos 10 já batem, só o
`leo` tem `during` 5.

✅ **A janela do `Badge` durou uma sessão e fechou.** `Badge` casa o título por
**string** (`Badge.tsx:45`), e entre o Bloco 1 (que renomeou `patentes.ts`) e esta
migration a pílula saiu **sem o ponto de cor, em silêncio**. Medido depois de aplicar:
**os 8 degraus batem** — tiers 1 a 6 com nome idêntico dos dois lados, tiers 0 e 7 sem
cor dos dois lados.

⚠️ **E esse casamento continua sem régua.** Nenhum gate compara `title_tiers.title` com
`PATENTES[].patente`: `verify:paleta-patentes` mede **cor**, não nome. Foi conferido à
mão nesta sessão, com script descartável. Quem renomear um degrau de novo não será
avisado — é o candidato natural a uma conferência nova dentro do `verify:paleta-patentes`.

✅ **A suíte e2e foi atualizada junto.** `Quartel-General`→`Saguão`,
`Criação do Recruta`→`Matrícula`, `Duelos da Campanha`→`Sala de Duelos`,
`Revisão de Batalha`→`Revisão da Partida`, `Companhia`→`Turma`, e a trilha exibida
`Recruta`→`Calouro` (que o Bloco 1 já tinha quebrado sem ninguém acusar).
**`Acampamento dos Recrutas` e `Vila dos Soldados` FICARAM de propósito** em
`bots-ui-audit.spec.ts:170,232-237`: são valores de `bots.stage` no banco, que só
mudam no Bloco 3 junto com `BotGrid.tsx`. Trocá-los agora quebraria a suíte.
O e2e **não foi rodado** — bate no Supabase de produção.

⚠️ **A migration achou uma coisa que o plano não previa, e ela é a razão de a
migration ser maior que três UPDATEs.** Havia **três** lugares gravando `'Aprendiz'`
como título inicial — o `DEFAULT` da coluna `user_titles.current_title`, a
`ensure_user_profile` e a `handle_new_user`. Como o nome "Aprendiz" **desce um
degrau** (era tier 0, vira tier 1), todo aluno novo nasceria com nome de tier 1 sobre
o degrau 0, e a conferência (d) do `verify:avatar-db` reprovaria na primeira matrícula
seguinte. As duas funções passam a **ler o primeiro degrau de `title_tiers`**, como a
`recompute_user_title` já fazia. Isso custou **+2 no `rpc-baseline.json`**
(`handle_new_user` 2→3, `ensure_user_profile` 1→2): é o escape sancionado pelo próprio
ratchet, e está justificado aqui e no commit.

✅ **As duas confirmações que o plano exigia antes da migration foram medidas no banco,
não presumidas.** `recompute_user_title` **lê** o nome de `title_tiers` — renomear a
régua propaga sozinho, e a função não precisou ser recriada. E **nenhuma** função viva
cita `v_title_map` (zero linhas em `pg_get_functiondef` sobre todo o `public`).

✅ **Ensaio a seco da migration, em transação com `ROLLBACK`:** escada nova com `trail`
e `lessons_required` intactos; os 19 alunos reconciliados (17 Calouro, 2 Aprendiz);
`DEFAULT` em `'Calouro'`; as duas funções lendo a régua; e a **conferência (d) do
`verify:avatar-db` com 0 atrasados dentro da transação** — que é a prova de que o gate
passa depois de aplicar.

✅ **PASSE DE ACHADOS DO AVATAR — 2026-08-20.** Nove entradas fechadas com número
medido: **D2 · D8 · D12 · D14 · G5 · G16 · G27 · G28 · G30**, mais o **G32**
remedido (23,1% → **1,3%**). Um gate novo (`arte:traco`, 20º do `verify:arte`), uma
régua nova (`sobrancelhaCoberta`), uma constante nova (`EIXO_ROSTO`) e duas colunas
mortas fora do `useUser`. `verify:all=0` · 574 testes · `build=0`.

⚠️ **E o passe achou uma coisa que não era achado: o `ESTADO-DA-ROTA` registrava o
caminho C (barba por cima do cabelo) como EXECUTADO, e ele nunca foi para o código.**
Perguntado, o Doug confirmou que mudou de ideia no fim daquela sessão — o código
estava certo, o registro é que mentia. A entrada foi substituída por um corrigendum,
e a lição virou regra escrita ali: **entrada de execução se escreve DEPOIS de o gate
passar sobre ela**, nunca junto com a intenção.

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

✅ **A rota de arte não tem mais ponta solta — as quatro morreram.** Colagem do
espetado e do chanel em `CABELOS`: **feita** em 2026-08-07 (`068303b`). Reentrada da
`entrada-2`: **superada** — ela entrou pela variante `fiel` em 2026-08-08, sem
retoque. Rodada de unificação: **cancelada** pelo Doug em 2026-08-07 (achado T5,
fechado). E **a luz (Passo 8) está MORTA desde 2026-08-11**, por decisão final dele —
não é adiamento: o passo deixa de existir, e com ele a régua que nunca foi escrita.

✅ **A V1 DO AVATAR NAS TELAS SAIU EM 2026-08-11 — o boneco aparece onde a criança
aparece.** Eram 3 telas (as de perfil) e são **8**: entraram navbar, Quadro de Honra
do dashboard, ranking global, ranking de turma e mural. Fecha o **D30** / Bloco 6 do
doc 15 e as tarefas T2.11–T2.15. O catálogo continua em **5 cabelos** e os cadeados
de nível 10/20/30 ficam como estão — as duas por decisão do Doug.

O que a V1 trouxe: `<AvatarCabeca>`, o recorte de cabeça que **só muda o `viewBox`**
(a cabeça a 32 px sai de 13,2 para **19,2 px**), a migration
`20260811140000_bloco6_identidade_nas_listas.sql` (as 3 RPCs de ranking param de
servir o `avatar_config` morto, e nasce a `get_class_feed` para o mural), o gate
`verify:identidade-nas-listas`, a trava `recorte-cabeca.test.ts` e 2 testes e2e
novos. **Fecha o achado G11**; abre o **D12**.

✅ **O espaço da cabeça foi DECIDIDO em 2026-08-11: opção B — o canvas cresce para
cima** (`viewBox` vira `0 −80 500 780`). Decisão do Doug com a bancada na mesa, e a
recomendação era outra ("nada agora"): a bancada mostrou que o T1.5 envelheceu — ele
mediu 39 unidades de folga em **2026-08-03, três dias antes** de `ESCALA_PADRAO`
virar 0,92, que já comprou **111 unidades** de teto, e hoje o corte é de **1,0
unidade** na ponta do moicano (0,046 px a 32 px). O que continua verdadeiro é o
resto, e é o que a decisão compra: o teto **livre** acima do cabelo mais alto é
**zero**, então chapéu e acessório não têm onde existir. **Não repropor.**

⏭️ **A frente B ainda não começou, e é a próxima do avatar depois da arte.** Ela
mexe em `VIEWBOX` (22 arquivos citam a proporção ou a altura), re-congela a
`folha-base` e o `asset-baseline`, e pede conferência de `verify:pose`,
`avatar:fidelidade` e `arte:escala`. O `RECORTE_CABECA` acompanha sozinho — é
derivado. Custo declarado: **boneco 11% menor a 32 px** e o fim do 5:7. O T1.5 fica
aberto até ela rodar.

🗺️ **O PLANO DOS OUTROS SLOTS SAIU EM 2026-08-11: `docs/avatar/21-slots-do-avatar-plano.md`.**
Traje, chapéu, rosto (óculos/bigode/barba), fundo e pet, em **9 blocos com gate**.
Onde ele divergir dos docs 14, 15, 16 e 18, **ele vence** — os quatro foram escritos
na era v2. Não revoga o doc 17 (paleta medida) nem o doc 19 (rota de arte).

**Ele reverte parte da T7, e a reversão é datada.** O Doug respondeu o que falhou
na v2: **a arte era do boneco velho** — a mecânica de baú e raridade nunca foi o
problema, ela ficou órfã de corpo. Então **raridade e baú de peça voltam**, com
quatro travas nascidas da lição: arte por demanda (**~32 peças**, não 39), peça sem
arte **não pode ser semeada** (vira gate, não disciplina), pool de baú só estético
(**uniforme nunca sai de baú**), e a moldura de raridade (6.2) **continua morta** até
o Doug decidir. **O `verify:avatar-db` não afrouxa** — os nomes da v2 seguem
proibidos, os nomes novos são outros, e o gate **ganha** a trava que o próprio
cabeçalho dele pede de volta (traje só para patente alcançável).

As decisões de produto do dia: pet por **ovo + Chocadeira** (a mecânica que hibernou
de propósito); traje **por demanda** — 3 Aprendiz + 4 Soldado + 4 Aspirante, e as
outras patentes quando a trilha delas tiver conteúdo; **o XP vira prêmio comum do
baú**, sorteado como um item igual aos outros; **óculos sem haste, lente livre**
(o que dissolve a falta da `saliencia`); **editor em abas** de guarda-roupa; e o
card mostra **a peça, nunca o boneco vestido com ela** — cabeça para cabelo/chapéu/
rosto, tronco para roupa. A arquitetura escolhida é **1 catálogo + 1 guarda-roupa**
(não 5 tabelas, não a `items` da v2), porque é o baú que atravessa os slots.

✅ **O Bloco 0 fechou: a V1 está no ar.** O merge saiu fast-forward (`037c990` →
`661c833`, 4 commits, 26 arquivos, zero conflito) e o push saiu quando a rede
voltou. `origin/main` está em `661c833` e a Vercel publicou.

✅ **O BLOCO 1 DO DOC 21 FECHOU EM 2026-08-11 — a fundação do guarda-roupa, com
ZERO mudança visual.** Uma migration
(`20260811160000_bloco1_fundacao_dos_slots.sql`), um gate novo
(`verify:catalogo-slots`, **35 conferências**) e o encanamento do código. O
`verify:all` está verde e a **`folha-base` saiu nos números congelados byte a
byte: 19 formas / 7 468 bytes** — o boneco não se mexeu.

O que ela criou: `avatar_catalogo` + `avatar_guarda_roupa` (arquitetura B —
1 catálogo + 1 guarda-roupa), as 5 colunas de equipar em `users`, a RPC
`equipar_peca` (`SECURITY DEFINER`, valida slot · existência · pertencimento ao
slot · direito), e a matview mais 5 funções recoladas **numa rodada só** —
`get_public_profile` serve as 5 peças, as 3 de ranking e `get_class_feed` servem
**chapéu e rosto**, que são o que o recorte de cabeça mostra. No código:
`PecaSobreposta`, `EstadoAvatar.chapeu?`/`.rosto?`, `src/lib/avatar/catalogo.ts`
e as props dos dois componentes.

**Medido antes de aplicar**, num ensaio a seco (transação → migration → gates →
`ROLLBACK`): o gate novo foi de **2 falhas a 35 verdes**, e `verify:perfil-publico`
(28) e `verify:identidade-nas-listas` (32) continuaram verdes **dentro da mesma
transação** — que é a prova de que recolar a matview e as 5 funções não quebrou o
que já estava no ar. **4 recusas medidas**, não 3: outro slot, sem direito por
nível, slug inexistente, e peça de baú sem linha no guarda-roupa.

O `rpc-baseline.json` **subiu de propósito**: +1 em `get_ranking`,
`get_ranking_with_position`, `get_public_profile`, `get_class_ranking` e
`get_class_feed` — as quatro de lista usam `EXECUTE format(...)` e não há helper a
extrair, o mesmo dilema do Bloco 6 — mais `equipar_peca: 1`, que é nova.

**A trava "traje só para patente alcançável" NÃO entrou** (a dívida de
`verify-avatar-db.ts:36-39`): com zero trajes semeados ela passaria por vacuidade.
Ela chega junto com o primeiro traje, no Bloco 2. O necrológio dela no gate agora
tem endereço.

⏸️ **O BLOCO 2 (traje por patente) PAROU EM 2026-08-12, e o método mudou: o traje
vai pela ROTA DE ARTE, com o Doug desenhando.** A folha de contato foi reprovada
por ele — *"feias, sem vida, quadradas… quero o nível de cabelo feito através de
arte, não por você: espetado ou assimétrico ou chanel"* —, e o número confirmou a
leitura depois: os três cabelos que ele citou são os três que vieram de arte
(**64, 85 e 112 pontos**), contra 7 e 0 dos dois de código. Uma ordem de
grandeza, identificada a olho antes de qualquer medição.

**O registro completo está em `docs/avatar/21-slots-do-avatar-plano.md`**, no
bloco de execução do Bloco 2: as 4 decisões do Doug (a silhueta não cabe e não se
repropõe; 3 opções por patente e não 4; o Macacão fica byte a byte; os 9
rascunhos ficam intocados), as 5 réguas novas que valem para todo slot, e a
esteira que a próxima sessão constrói — **a rota de arte já suporta traje quase
inteira, e o que muda é uma inversão de duas linhas** em
`scripts/avatar/arte/base.ts:281` (hoje o Gate −1 protege o corpo; para traje ele
tem de proteger a cabeça).

**A migration `20260812120000_bloco2_traje_por_patente.sql` está escrita e NÃO
aplicada** — ela semeia os 9 slugs, cria a coluna `ordem` e ensina
`recompute_user_title` a vestir na promoção. Aplicá-la sozinha reprova o
`verify:catalogo-slots` de propósito: o código das peças ainda não existe.

✅ **O G22 fechou em 2026-08-13, e o Bloco 3 é o próximo.** As cinco telas de
recorte de cabeça passavam ao boneco só pele/cabelo/cor, e o `as` descartava
`avatar_chapeu` e `avatar_rosto` que as RPCs já devolviam — o G21 em cinco telas.
**Zero migrations.** A régua é a **conferência 5** de `verify:identidade-nas-listas`
(**59/10 → 73/0**), ancorada no que o próprio `<AvatarCabeca>` repassa ao SVG: nada
de lista de slots à mão. Fechado **antes** do Bloco 3 de propósito — régua escrita
depois da primeira peça de chapéu não previne nada.

Ele derrubou duas coisas de caminho: a navbar **não** lia do `useUser` (faz o
próprio `SELECT`), e o `/dashboard` mantinha um **terceiro** `RankingEntry`, cópia
local que cegou a primeira versão da régua — o `tsc` pegou, e o gate ganhou a
conferência do `import` para não depender disso. Detalhe em `docs/achados.md`.

**Decisões travando trabalho: nenhuma.** A última caiu em 2026-08-11 —

- ~~**Régua da patente — duas versões vivas, não três** (achado **T1**)~~
  ✅ **DECIDIDO em 2026-08-11: a patente vem de concluir uma trilha.** Medido no
  banco antes de decidir: `tier * 15` **já era** a fronteira de trilha, porque
  `recruta` tem 15 aulas e `soldado` tem 15. Não eram duas réguas — era a mesma,
  escrita contra dois conteúdos. **Nenhum marco mudou**, e nenhum dos 2 alunos
  promovidos mudou de patente. O que mudou é que o princípio virou dado
  (`title_tiers.trail`) e trava de gate (conferência (e) do `verify:avatar-db`,
  que mede o acumulado real em `lessons`). **Destrava o Bloco 7b e o B0.5** — e o
  B0.5 passa a se cobrar sozinho: subir as 26 aulas da T1 sem o `UPDATE` deixa o
  `verify:all` vermelho.

**Pendências grandes fora do avatar:** fase 11 (PWA — não existe manifest nem
service worker) e fase 12 (lançamento). Fase 6C (extras) segue aberta.

**A revisitar antes do lançamento:** o repositório é público e vai guardar dados
de alunos menores de idade.
<!-- AGORA:fim -->

## Git

<!-- VOLATIL:inicio -->
| | |
|---|---|
| **Branch** | `avatar/barba-trancada-v10` |
| **Commits à frente de `origin/main`** | 23 |
| **Árvore** | **54 arquivos sujos** |
| **Último commit** | a3d0953 · 2026-08-24 · docs(avatar): o registro da rota fecha o dia — o crash do laço vazio, as três réguas sem cobaia e a conta das esteiras |
<!-- VOLATIL:fim -->

## Fases do produto

**10 de 12 feitas.**

Abertas:

- **11. Sound Design + PWA + Polish** — não existe manifest nem service worker
- **12. Testes Finais e Lançamento**

_Fonte: tabela §Estado real de `docs/Recruta64_Roadmap_Tecnico_v1.md`._

## Gates

**19 entradas** em `verify:all`, que expandem para **35 scripts**. O número difere entre branches — a `main` não tem `verify:pose` nem `verify:design-tokens`.

`verify:phase2` · `verify:seeds` · `verify:revanche` · `verify:rush` · `verify:phase5` · `verify:phase6` · `verify:avatar-db` · `verify:chest-pool` · `verify:paleta-patentes` · `verify:cabelo-catalogo` · `verify:catalogo-slots` · `verify:perfil-publico` · `verify:identidade-nas-listas` · `verify:turmas` · `verify:privileges` · `verify:xp-curve` · `verify:no-dup-rpc` · `verify:puzzle-authority` · `verify:curriculo` · `avatar:pose` · `verify:design-tokens` · `verify:estado` · `verify:aberturas` · `verify:fonte-peca` · `arte:fixtures` · `arte:reguas` · `arte:cor-proibida` · `arte:escala` · `arte:pecas-check` · `arte:trajes-check` · `arte:rostos-check` · `arte:cabelos-check` · `arte:traco` · `arte:borda` · `arte:peso`

## Frentes

| frente | fechadas | detalhe em |
|---|---|---|
| Backlog do avatar | **30 de 67** (45%) | `docs/avatar/14-backlog-execucao.md` |
| Auditoria do avatar | **2 de 92** (2%) | `docs/avatar/13-checklist-de-verificacao.md` |
| Catálogo de cabelo | **14 de 10** no mínimo ✅ | `docs/avatar/19-rota-de-arte-runbook.md` |

Backlog do avatar, fase a fase:

| F0 | F1 | F2 | F3 | F4 | F5 |
|---|---|---|---|---|---|
| 19/23 | 2/6 | 5/16 | 3/5 | 1/11 | 0/6 |

_Conta tarefas numeradas (`**T0.1**`), que é a régua do próprio doc 14. Contar todos os checkboxes dá um número maior porque inclui as linhas de gate._

## Passivo congelado

| o quê | quanto | congelado desde |
|---|---|---|
| Cores cruas — teto tolerado | **1331 em 69 arquivos** | ratchet |
| RPCs redefinidas mais de uma vez | **56 (pior: puzzle_attempt, 12×)** | ratchet |

_Ratchets: o gate reprova se crescerem. Só encolhem com `--update`._

## Repositório

| | |
|---|---|
| **Migrations** | 96 |
| **Rotas (`page.tsx`)** | 33 |
| **Arquivos de teste** | 24 |
| **Primitivos de UI** | 4 |

## Frescor das fontes

<!-- VOLATIL:inicio -->
| doc | última edição |
|---|---|
| `CLAUDE.md` | 2026-08-22 |
| `README.md` | 2026-08-03 |
| `docs/Recruta64_Roadmap_Tecnico_v1.md` | 2026-08-03 |
| `docs/avatar/14-backlog-execucao.md` | 2026-08-11 |
| `docs/avatar/15-plano-ate-pronto.md` | 2026-08-11 |
| `docs/avatar/13-checklist-de-verificacao.md` | 2026-08-06 |
| `docs/curriculo/01-curriculo-definitivo-v1.md` | 2026-08-20 |
| `docs/curriculo/02-plano-tecnico-trilha1-v1.md` | 2026-08-11 |

_Doc parado há semanas e ainda citado como fonte é candidato a `_superado/`._
<!-- VOLATIL:fim -->
