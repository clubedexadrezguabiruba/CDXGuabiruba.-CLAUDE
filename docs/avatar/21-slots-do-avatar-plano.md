# 21 — Os outros slots do avatar: traje, chapéu, rosto, fundo e pet

> **Este documento é o plano vigente do guarda-roupa do avatar.** Onde ele
> divergir do doc 14 (backlog), do doc 15 (plano até pronto), do doc 16
> (runbook de uniforme) ou do doc 18 (blocos de pedido), **ele vence** — os
> quatro foram escritos quando a pilha v2 ainda era o caminho, e o doc 16 já
> traz o próprio banner declarando-se morto para este boneco.
>
> Ele **não** revoga o doc 17 (design das patentes), que é paleta medida e
> continua sendo a régua de cor, nem o doc 19 (rota de arte), que continua
> sendo o caminho de arte desenhada pelo Doug.
>
> Decidido pelo Doug em 2026-08-11, com a bancada na mesa. A execução, bloco a
> bloco, marca-se aqui.

## 1. A decisão, e o que ela reverte

O avatar kokeshi tem **um** item vestível: cabelo. Este plano dá a ele os
outros cinco — **traje, chapéu, rosto (óculos/bigode/barba), fundo e pet** —
com desbloqueio **misto**: parte por marco (nível, patente), parte por **baú com
raridade**.

**Isso reverte parte da decisão T7 (2026-08-10), que matou raridade e baú de
item.** A reversão é consciente e datada, não deriva. O que a justifica é a
resposta do Doug à pergunta que abriu esta sessão:

### 1.1 O que falhou na v2, na palavra do Doug

> **A arte era do boneco velho.** Nada falhou na mecânica — os itens morreram
> porque vestiam um boneco que morreu.

É a leitura que os números sustentam. O que a varredura do T7 mediu não foi
"raridade não funciona": foi que **7 dos 8 chapéus já não renderizavam** e o
ratchet contava **45 itens `sem_boneco`**. A mecânica de baú, raridade,
inventário e ovo nunca foi o problema — ela ficou órfã de corpo.

**Consequência para este plano:** raridade e baú voltam **como mecânica**, e a
arte nasce medida contra o boneco que existe.

### 1.2 As quatro decisões de produto desta sessão

| Pergunta | Decisão do Doug | Por quê |
|---|---|---|
| O pet volta por qual porta? | **Ovo + Chocadeira** | A mecânica hibernou de propósito: `hatch_egg` e `_create_random_pet_egg` ficaram byte a byte no banco e o `verify:avatar-db` **cobra que existam** (`RPCS_ESPERADAS`, `verify-avatar-db.ts:62-68`). A Chocadeira está na tela prometendo (`Chocadeira.tsx:47-50`), e o modal de eclosão com moldura de raridade continua vivo (achado **D6**, "código à espera") |
| Quanto traje desenhar? | **Por demanda** — **3 para Aprendiz**, 4 para Soldado e 4 para Aspirante (11 peças) | São as três patentes que existem para o aluno hoje (achado **D11**). 6 patentes × 4 seriam **24 peças, 16 invisíveis** por tempo indeterminado — o formato exato do erro que matou a v2 |
| E quem ainda não foi promovido? | **Aprendiz (tier 0) também escolhe** — 3 opções, e a primeira é o macacão de hoje | Decisão do Doug em 2026-08-11. Sem isso, a aba "Roupa" nasce vazia para todo aluno novo, e o slot só ganha vida na primeira promoção. Ver §7, Bloco 2 |
| O que o baú faz, com peça no pool? | **O XP vira um prêmio comum**, sorteado no meio das peças como um item igual aos outros | Palavras do Doug. Mantém a lição da T9 (o baú nunca sai de mãos vazias) sem criar duas economias |
| Peça de baú ainda não ganha, no editor? | **Silhueta/"?" com a cor da raridade** — cria desejo | Vitrine é o que faz raridade significar alguma coisa. Sem ela, o aluno não sabe que existe o que não tem |

### 1.3 O que a T7 ensinou, e FICA

Reverter a decisão não é apagar o que ela custou a aprender. Quatro travas
nascem deste plano, não do arrependimento futuro:

1. **Arte por demanda, nunca estoque.** A v1 dos slots tem **~32 peças** (11
   trajes, ~6 fundos, ~6 rostos, 4-6 chapéus, 4 pets), não as 39 do Bloco 8 do
   doc 15. Cada uma passa pela folha de contato antes de a seguinte começar.
2. **Peça sem arte não pode ser semeada** — e isso vira **gate**, não
   disciplina. O pecado da v2 (8 uniformes no banco, 0 renderáveis) fica
   impossível: o conjunto de slugs do banco tem de ser igual ao do código,
   slot a slot (§8).
3. **Pool de baú só com estético** (a lição D16): fundo, rosto, chapéu, pet.
   **Uniforme nunca sai de baú** — traje é mérito de patente, e misturar as
   duas coisas apaga o mérito.
4. **A moldura de raridade (6.2 do doc 15) continua morta.** O argumento que a
   criou ("lê a 56 px porque é a borda do cartão, custa zero desenho") de fato
   ressuscita com a raridade — mas isso é decisão nova do Doug, registrada como
   aberta na §9, não escopo deste plano.

## 2. As quatro tensões, encaradas

O pedido cruza quatro fatos medidos. Nenhum é objeção; todos precisam de
resposta escrita.

**(a) A trava técnica contra a v2 — e por que ela NÃO afrouxa.**
`verify:avatar-db` exige a ausência de `items`, `user_inventory`,
`user_equipped`, `equip_item`, `unequip_slot`, `user_chests.item_id`,
`user_eggs.pet_item_id`, `achievements.reward_item_id` e
`title_tiers.outfit_item_id` (`verify-avatar-db.ts:47-59`), mais um scan de
regex sobre o corpo de **todas** as funções de `public` (`:146-151`).

**Todas as proibições ficam.** Os nomes da v2 continuam mortos; os nomes deste
plano são outros (`avatar_catalogo`, `avatar_guarda_roupa`, `equipar_peca`,
`user_eggs.pet_slug`) e não colidem com nenhuma lista nem com nenhuma regex. O
gate não é afrouxado — ele **ganha** conferências, inclusive a que o próprio
cabeçalho dele pede de volta:

> *"A antiga conferência do uniforme ('uniforme só para patente alcançável')
> saiu no Bloco B junto com a coluna `title_tiers.outfit_item_id`. Ela impedia
> gastar arte em marco inalcançável; quando o uniforme voltar, por outro
> caminho, ela precisa voltar com ele."* — `verify-avatar-db.ts:36-39`

**(b) Chapéu depende da Frente B, que está decidida e não executada.**
O teto **livre** acima do cabelo mais alto é **zero** (T1.5, remedido no
Chromium em 2026-08-11: o moicano é cortado em 1,0 unidade, e as outras cinco
opções não são cortadas). A opção B — `viewBox` vira `0 −80 500 780` — está
decidida e **não se repropõe**.

**Mas as 80 unidades são chute, e ninguém sabe se são demais ou de menos.** A
saída barata, sugerida pelo próprio Doug, entra como Bloco 6: **desenhar UM
chapéu de prova antes e medir quanto ele pede.** O −80 vira número medido antes
de mexer nos ~25 arquivos que citam a proporção ou a altura.

**(c) Óculos perderam o apoio no Bloco 1d — e a decisão do Doug dissolve o
problema.** A constante `GIRO.saliencia` saiu junto com as orelhas; o
necrológio está no lugar exato onde ela morava (`geometria.ts:188-192`): *"era o
dado que os acessórios liam para saber quanto de orelha há para cobrir, e a
resposta agora é nenhuma"*.

**Decisão do Doug: óculos sem haste, e a lente pode ser maior que o rosto, por
estilo.** Sem haste, não há o que apoiar — a peça deixa de precisar da orelha.
Tecnicamente isso a torna **camada sobreposta**, que é o mecanismo já provado do
cabelo traçado (`compositor.ts:531-575`, fora de todo clip). A bancada mede uma
coisa: a lente mais larga cabe no `RECORTE_CABECA` (`recorte.ts:107`)?

**(d) "4 opções por patente" × quantas patentes existem.** O banco tem **8
tiers** (`20260729120000_patente_por_marcos.sql:80-89`), a paleta travada por
`verify:paleta-patentes` tem **6** (`scripts/avatar/patentes.ts:92-165`), e só
**2** são alcançáveis. É o achado **D11**, e ele fica aberto: a decisão "por
demanda" o contorna sem precisar resolvê-lo. Quando a trilha 3 tiver conteúdo,
o Capitão ganha as suas 4 — e aí o D11 precisa estar decidido.

## 3. A arquitetura de slot

É a primeira decisão, antes de qualquer arte.

### 3.1 A bancada

Hoje o catálogo é `avatar_hair_catalog(slug, min_level)` — uma tabela para
**uma** peça — mais 3 colunas em `users`
(`20260810160000_bloco_c_identidade_do_avatar.sql:69-73` e `:130-136`). O
extremo oposto é a tabela `items` genérica da v2, que acabou de ir para o lixo.

| | **A — 5 tabelas no molde do cabelo** | **B — 1 catálogo + guarda-roupa** |
|---|---|---|
| Tabelas novas | 5 | **2** |
| RLS, policies, grants | ×5 | ×2 |
| Colunas em `users` | ~5 | ~5 (igual) |
| Sorteio do baú | `UNION` de 4+ tabelas, mantido à mão dentro do `claim_chest` | uma consulta: `WHERE raridade = X AND origem = 'bau'` |
| Raridade e origem | coluna repetida em cada tabela | escrita uma vez |
| Gate | 5 conferências paralelas | 1 conferência |
| A favor | molde provado (`verify:cabelo-catalogo` já o vigia) | **o baú**, que é a mecânica central do pedido |

**Escolhida: B.** O molde do cabelo foi desenhado para uma peça **sem
raridade** — ele é ótimo no que faz e não sabe sortear. O que muda o jogo aqui
é o baú atravessando quatro slots: em A ele vira SQL costurado à mão dentro da
função mais delicada do sistema, que é exatamente o tipo de código que já
reverteu a curva de XP em silêncio por quatro meses (`src/lib/gamification/xp.ts:3-12`).

B não é a tabela `items` da v2 de volta: **não há inventário genérico, não há
`equip_item`, não há slot livre.** É um catálogo fechado, com CHECK por slot,
e uma linha por peça que o aluno ganhou de baú.

### 3.2 O desenho

**`avatar_catalogo`** — o que existe para vestir:

| coluna | o que é |
|---|---|
| `slug` | PK global, ex. `traje-soldado-a`, `fundo-vila`, `rosto-oculos-redondo` |
| `slot` | CHECK: `traje` · `chapeu` · `rosto` · `fundo` · `pet` |
| `origem` | CHECK: `marco_nivel` · `marco_patente` · `bau` |
| `raridade` | CHECK: `common` · `rare` · `epic` · `legendary`. **Só quando `origem = 'bau'`** |
| `min_level` | só quando `origem = 'marco_nivel'` |
| `min_tier` | só quando `origem = 'marco_patente'`, FK para `title_tiers.tier` |

Com CHECK de consistência amarrando origem × colunas (o que não é da origem é
`NULL`). **Como no cabelo, o banco guarda só o desbloqueio; nome e arte moram no
código** — é o que faz `verify:cabelo-catalogo` conseguir comparar os dois
conjuntos, e é o que vai impedir peça fantasma aqui.

**`avatar_guarda_roupa`** — o que cada aluno ganhou: `(user_id, slug, ganho_em,
fonte)`, UNIQUE em `(user_id, slug)`. **Peça de marco não tem linha aqui** — o
direito se verifica ao vivo contra nível ou patente, exatamente como o cabelo
faz hoje. A tabela guarda só o que o acaso deu.

**5 colunas em `users`** — `avatar_traje`, `avatar_chapeu`, `avatar_rosto`,
`avatar_fundo`, `avatar_pet`, todas FK para `avatar_catalogo(slug)` e `NULL` =
sem a peça. Mesmo molde de `users.avatar_hair`.

**1 RPC `equipar_peca(p_slot text, p_slug text)`** — `SECURITY DEFINER`,
`SET search_path = public, pg_temp`, no molde de `update_avatar_identity`
(`20260810200000_e3_perfil_publico_com_identidade.sql:286-353`). Ela valida
três coisas e o cliente não valida nenhuma:

1. o slug existe e é **daquele slot**;
2. o dono **tem direito** — marco atingido (`users.level >= min_level` ou
   `user_titles.achieved_tier >= min_tier`) ou linha no guarda-roupa;
3. `p_slug IS NULL` = tirar a peça, sempre permitido.

E chama `refresh_public_profiles()` no fim, como a irmã dela. Server-authority
como manda a regra inviolável nº 1 do `CLAUDE.md`: o client envia a intenção, o
servidor decide.

### 3.3 O que NÃO se mexe

**O cabelo fica exatamente como está.** `avatar_hair_catalog`, as três colunas
de identidade e a RPC `update_avatar_identity` são código provado, com gate
próprio (`verify:cabelo-catalogo`, incluindo negação medida em
`verify-cabelo-catalogo.ts:240-411`) e com o Doug tendo conferido na tela.
Migrá-lo para o catálogo novo seria refatoração além do pedido — proibida pela
regra nº 3 do `CLAUDE.md`.

O preço é honesto: **duas gramáticas convivem** — a do cabelo e a dos cinco
slots novos. É menos caro que mexer no que funciona.

### 3.4 No render: quem entra no `compor()` e quem não entra

`compor()` é uma **concatenação literal de string** (`compositor.ts:821-936`),
com dez passos em prosa e dois `clipPath` nomeados por parte do corpo. Não há
registro de camadas, nem z-index, nem função `camada(nome, z)`. **Cada slot que
veste é uma inserção manual na pilha** — e é por isso que quem não precisa
vestir fica de fora.

| Slot | Onde vive | Por quê |
|---|---|---|
| **Traje** | dentro de `compor()` — o caminho **já existe**: `tintaTronco()` (`compositor.ts:368-395`) tem os três estados, e sem traje cai em `TRAJE_BASE.roupa` (`palette.ts:131-135`) | é tinta clipada no tronco, tem de respeitar a silhueta |
| **Chapéu** | dentro de `compor()`, como **peça sobreposta** | disputa o crânio; é o mecanismo escolhido na bancada A×B do Bloco 3/4 justamente por servir chapéu sem invenção nova (`ESTADO-DA-ROTA.md:546-548`) |
| **Rosto** | dentro de `compor()`, como **peça sobreposta** | lente maior que o rosto não cabe em clip nenhum |
| **Fundo** | **fora** — componente irmão `<FundoAvatar>`, atrás do SVG | não toca a geometria; e mantém o recorte de cabeça (navbar, rankings) livre de fundo por engano |
| **Pet** | **fora** — componente irmão `<PetKokeshi>`, ao lado | idem; zero risco ao orçamento do boneco |

`EstadoAvatar` (`tipos.ts:92-179`) ganha `traje` já existente mais `chapeu?` e
`rosto?`, **opcionais como `modeloCabelo`** — para que a base careca continue
saindo byte a byte igual e o teto de regressão da `folha-base` (19 formas /
7 468 bytes, `folha-base.ts:144,162`) continue sendo teto de regressão, não de
folga.

**A cor das peças novas é assada no desenho.** Só pele e cabelo recolorem
(emenda à D27), e o escopo `camada` de custom properties fica vazio
(`palette.ts:281`) — mexer nele esbarra na trava de `svgContrato.ts:35`.

## 4. O baú com peça

`claim_chest` v3, na decisão do Doug — **o XP é um prêmio comum, sorteado como
os outros**:

1. **Sorteia a raridade** com as chances de hoje, intactas: 7% legendary, 18%
   epic, 30% rare, 45% common
   (`20260810180000_e2_bau_paga_xp_direto.sql:140-149`).
2. **Monta o pool daquela raridade:**
   - peças de baú **inéditas** para aquele aluno (`origem = 'bau'`, sem linha no
     guarda-roupa) — nunca uniforme, nunca cabelo;
   - **o prêmio "XP"**, presente só no pool `common`, pagando os 15 de hoje;
   - **o ovo**, nos pools altos, quando houver pet inédito (Bloco 8) — a volta
     "rara" que a T9 prometeu.
3. **Sorteio uniforme** dentro do pool.
4. **Concede:** linha no guarda-roupa · ou `grant_xp` · ou ovo.
5. **Pool vazio** (todas as peças daquela raridade já são do aluno) → **XP da
   raridade**, a escala 15/25/40/60 de hoje. O baú nunca sai de mãos vazias, e
   o catálogo esgotado degrada sozinho.

Idempotência como está: guarda `claimed` mais `xp_grants UNIQUE (user_id,
source, source_id)`. O `p_source` continua `'item_scrap'` mesmo mentindo o
nome — trocá-lo obriga a recolar o corpo de `grant_xp`, e o motivo de não fazer
isso está escrito em `20260810180000_e2_bau_paga_xp_direto.sql:37-49`.

## 5. O editor de aparência

**Duas decisões do Doug nesta sessão, e as duas mudam o desenho da tela.**

### 5.1 Abas, como guarda-roupa de jogo

Hoje `EditorDeAparencia.tsx` são três fileiras empilhadas (modelo de cabelo,
cor do cabelo, cor da pele). Cinco slots novos por esse molde dariam **oito
seções num rolo comprido** — e isso aconteceria sozinho, um bloco de cada vez,
sem ninguém ter escolhido que a tela fosse assim.

**Decidido: abas por slot** — `Cabelo | Roupa | Rosto | Fundo | Pet` (+ Chapéu
quando chegar). A casca nasce no **Bloco 2**, já com duas abas; cada bloco
seguinte só acrescenta a sua.

### 5.2 O card mostra a PEÇA, nunca o boneco vestido com ela

Hoje cada card do cabelo renderiza o boneco inteiro
(`EditorDeAparencia.tsx:374-380`). **Decidido: o card mostra só a parte que a
peça ocupa.**

| Aba | O card mostra | Como |
|---|---|---|
| Cabelo, Chapéu, Rosto | **só a cabeça**, sem corpo | `<AvatarCabeca>`, que **já existe** desde a V1 (`src/components/avatar/AvatarCabeca.tsx`, recorte por `viewBox` via `recortarNaCabeca`) |
| Roupa | **só o tronco**, cabeça de fora | **recorte de tronco, novo** — mesma técnica de janela, derivada de `TRONCO` (`geometria.ts:596-622`, `yTopo: 320` a `yBase: 634`) |
| Fundo | a cena sozinha | — |
| Pet | o pet sozinho | — |

**O palco grande continua mostrando o conjunto montado** — é ali que o aluno vê
o resultado. Os cards servem para escolher a peça, e peça se escolhe vendo a
peça.

### 5.3 A vitrine

Peça de baú que o aluno ainda não ganhou aparece como **silhueta/"?" com a cor
da raridade**. Peça de marco continua com o cadeado de hoje
(`EditorDeAparencia.tsx:328-410`), que informa o nível ou a patente que falta.

**Nos dois casos o cadeado é informação, não trava** — quem recusa é a RPC. É a
regra que o editor já segue (docstring `EditorDeAparencia.tsx:28-40`) e que
não muda.

## 6. A arte, slot a slot

**Regras que valem para toda peça nova**, herdadas do doc 15 §7/§7b/§7c e do
critério de 2026-08-11:

- **Renderizar antes de julgar**, sempre no Chromium, **nunca com `sharp`** — o
  librsvg não resolve `var(--av-*)`, o rosto sai preto e o traço cai de 12 para
  1. Uma folha feita com `sharp` reprova arte boa e aprova arte ruim.
- **Folha de contato entre peças** antes de a seguinte começar.
- **Peça de cabeça tem de SEPARAR das outras a 32 px** — largura da silhueta e
  massa, não detalhe interno. Tronco julga a 56 px.
- **A cor de roupa e acessório é definitiva** (regra 14): duas peças da mesma
  patente têm de sair na mesma cor, porque nada as harmoniza depois.

### 6.1 Roupa VESTE, não pinta — a diretriz da silhueta

**Decisão do Doug em 2026-08-12, olhando a primeira rodada de arte do traje:**
*"roupa deve passar a silhueta (como é na vida real, senão vira pintura de
tronco)"*.

Ela reverte o que este plano dizia na §3.4 (*"traje é tinta clipada no tronco,
tem de respeitar a silhueta"*) e o que o doc 17 §5.2 proíbe — mas aquela
proibição era do **pipeline morto**: `FOLGA = 40` em `mascara-base.ts` media
contra as máscaras do macacão da base antiga, e o kokeshi não tem esse teto.

**A regra:** toda peça de traje excede a silhueta em **pelo menos um evento** —
barra, gola, ombro ou punho. Peça inteiramente contida no `clipPath` do tronco lê
como tinta sobre o boneco, não como roupa vestida nele.

**O mecanismo já existe e não é a tinta.** `Traje.extensoes` (`tipos.ts:72-82`)
é forma própria com contorno próprio, desenhada **fora do clip**: onde ela cruza
o tronco, o preenchimento dela tapa o traço de baixo e o traço dela vira a nova
borda externa. `atras: true` põe a forma sob o tronco; `atras: false` põe por
cima. Exigência: sobreposição de no mínimo `SANGRIA = 10 u` com o corpo — a
extensão **cobre** o tronco, nunca encosta nele.

**Os tetos, medidos em 2026-08-12** (`FOLGA_PROJETO` + meio traço, contra a
meia-largura externa da cabeça, que é 188,0 u):

| onde | y | tronco externo | **transbordo da cabeça** | até a borda do `viewBox` |
|---|---|---|---|---|
| ombro | 360 | 111,0 u | **77,0 u** | 139,0 u |
| peito | 483 | 135,6 u | **52,4 u** | 114,4 u |
| **cintura** | 543 | 136,1 u | **51,9 u** | 113,9 u |
| barra | 615 | 109,4 u | **78,6 u** | 140,6 u |

O **transbordo de 51,9 u na cintura é o que define o kokeshi**: a cabeça é a
parte mais larga do boneco. O teto lateral é **metade dele — 26 u por lado** —, e
é o mesmo 26 u que a régua de silhueta binária já tinha registrado nesta seção.
Passar disso não deixa a roupa mais legível: apaga o boneco.

Para baixo há **18 u** da barra do tronco (y 640) até o fim da sombra do chão
(y 658), e 60 u até o fim do `viewBox`. Para cima, **a gola na frente para no
queixo (y 347,2)**: `extensoes(traje, false)` é a **última** camada do SVG
(`compositor.ts:971`), depois do rosto, do cabelo e do chapéu — uma gola alta com
`atras: false` cobriria a boca da criança.

⚠️ **A consequência que isto teria na rota de arte — e ela foi resolvida de outro
jeito no mesmo dia.** Extensão é `{ d, cor }`, vetor, e o tipo diz que `tinta.png`
é *"o interior, nunca a fronteira"* (`tipos.ts:51`). Pela letra, o que excede a
silhueta teria de ser traçado, e a esteira de traçado viraria obrigatória.

**Não foi o que aconteceu.** Ao ver a primeira folha, o Doug pegou o defeito antes
da régua: *"a imagem PNG passa sim da silhueta, mesmo que pouco; a arte feita por
você eliminou essa silhueta e desenhou apenas dentro do corpo"*. O conserto foi
mover a arte para **fora do `clipPath`**, e não traçá-la:

- `arteDoTraje()` (`compositor.ts`) emite o `<image>` **depois do contorno do
  tronco** e antes da cabeça. Onde a roupa transborda, o traço dela vira a borda
  externa — a mesma regra que `extensoes()` enuncia, com o formato trocado;
- medido antes: 5 767 px fora do clip, dos quais **1 497 px de sombra e luz
  sumiam**. Depois: **95,38% da arte visível**, e só a cabeça esconde;
- **sem `tinta.png` a função devolve string vazia**, e o SVG sai byte a byte
  igual — é o que manteve os 19 formas / 7 468 bytes e os 11 selos parados.

O traçado continua devendo para uma peça que precise de forma própria (capa,
ombreira), não para o transbordo do pano.

### 6.2 O volume é da ARTE, nunca do compositor

Segunda ressalva do Doug na mesma folha: *"a sombra do corpo ficou por cima da
roupa, não foi ajustado/eliminado"*.

`pathSombraQueixoTronco()` e `pathPlanoLateralTronco()` eram desenhados depois da
arte, e foram feitos para o macacão **chapado** da base, que não tem volume de si.
Uma arte de traje traz o próprio — a farda do Soldado chegou com 29 790 px de
sombra e 11 626 de luz —, e as duas camadas por cima **dobravam o sombreado**.

**A regra:** quem tem `tinta.png` responde pelo próprio volume, inclusive pela
sombra de contato sob o queixo; o compositor não acrescenta nada. Medido: 1 933 px
repintados viraram **10 px**. O `PEDIDO-TRAJE.md` foi virado do avesso para pedir
o contrário do que pedia.

| Slot | Como se desenha | Por quê assim |
|---|---|---|
| **Traje** | **Código**: `tinta.cor` = o pano medido da patente (doc 17) + `decoracao` (gola, botões, faixa, debrum, galão) | As opções de uma patente têm **o mesmo pano** — a lei do doc 17 diz que a separação entre patentes está na cor (a 56 px o uniforme é massa de cor, `17:96-101`). A variação mora na decoração e nos tons medidos da família. O pipeline `avatar:garment` **não é ressuscitado**: ele mede contra as máscaras do macacão da base antiga e fica verde por vacuidade no kokeshi (`16:3-29`) |
| **Fundo** | Código: cenas simples nas regiões da Bíblia Tonal (acampamento, vila, fortaleza, cidade, cidadela), cor fixa | Não toca a geometria do boneco, não disputa espaço, não depende da Frente B. **O mais barato de todos**, e por isso é quem estreia a esteira de baú |
| **Rosto** | Código: paramétrico ancorado em `OLHO` e `BOCA` (`geometria.ts:420-449`, `:537`), como **camada sobreposta** | **Sem haste, lente pode exceder o rosto** (decisão do Doug). A rota de arte não entra: o rosto é região protegida do Gate −1 (`ESTADO-DA-ROTA.md:186`) — e não precisa entrar |
| **Chapéu** | **Um chapéu de prova em código primeiro**; os demais pela rota que a peça pedir | A rota de arte foi desenhada para servir chapéu (`ESTADO-DA-ROTA.md:546-548`), mas **nunca foi exercitada com um** — e o teto disponível é zero. O de prova mede o teto real antes da Frente B |
| **Pet** | Código: SVG animado por CSS — o protótipo "Peãozinho de Madeira" já existe (`src/lib/avatar/prototipo/pet.ts`) | Não toca o boneco. Tema: peças de xadrez vivas. 4 pets iniciais, não os 20 do Bloco 8 |

**Antes do primeiro chapéu, uma decisão obrigatória: a regra chapéu × cabelo.**
Cada chapéu precisa de uma de quatro respostas — mostra o cabelo inteiro,
esconde só a franja, esconde tudo, ou pede variante achatada. **A resposta vive
no item, nunca no compositor**: campo `escondeCabelo?: "nada" | "franja" |
"tudo"`, e o `compor()` obedecendo. Decidir isso **depois** dos chapéus
desenhados custa redesenho (doc 15, Bloco 8).

## 7. Os blocos de execução

Cada bloco termina com **gate verde e número medido**. Nenhum começa antes de o
anterior fechar.

### Bloco 0 — Publicar a V1 ✅

Merge `avatar/vtracer` → `main` (fast-forward) + push; a Vercel publica sozinha.

Existe porque a migration da V1 **já está aplicada em produção e o código não**
— é o formato exato do achado **R4**, em que a `main` ficou 11 dias atrás do
próprio banco e duas telas falhavam no ar sem ninguém notar.

**Parada:** `main` e branch no mesmo commit; o Doug confere duas telas no ar.

> **FECHADO em 2026-08-11.** O merge saiu fast-forward (`037c990` → `661c833`,
> 4 commits, 26 arquivos, zero conflito) e o push saiu quando a rede voltou.
> `origin/main` em `661c833`, publicado pela Vercel.

### Bloco 1 — A fundação ✅

Uma migration, um gate novo, e o encanamento — **zero mudança visual**.

- `avatar_catalogo` e `avatar_guarda_roupa` com RLS (leitura do catálogo aberta
  a quem está logado, guarda-roupa só o próprio; escrita para ninguém a não ser
  pela RPC) — mesmo molde de `20260810160000:98-109`.
- As 5 colunas de equipar em `users`, a RPC `equipar_peca`.
- A matview `user_public_profiles`, a `get_public_profile` e as RPCs de ranking
  ganham as colunas **numa rodada só** — no ranking entram apenas `chapeu` e
  `rosto`, que são o que o recorte de cabeça mostra.
- `EstadoAvatar.chapeu?` / `.rosto?` e as props dos componentes, com fallback =
  o que se vê hoje.
- Gate novo `verify:catalogo-slots` (§8) e conferências novas no
  `verify:avatar-db`. `rpc-baseline.json` atualizado **de propósito**, com o
  motivo escrito.

**Parada:** `verify:all` verde; **3 recusas medidas** (equipar peça de outro
slot, equipar sem direito, slug inexistente), no padrão de negação de
`verify-cabelo-catalogo.ts:302-364`; `avatar:folha-base` nos números
congelados, byte a byte.

> **FECHADO em 2026-08-11, com a parada cumprida e uma recusa a mais.**
>
> | o quê | número medido |
> |---|---|
> | `verify:all` | verde — **19 entradas / 29 scripts** (era 28) |
> | `verify:catalogo-slots` (novo) | **35 passed / 0 failed** |
> | `verify:avatar-db` | 27/2 → **30/0** (entram `equipar_peca` e as 2 tabelas) |
> | recusas medidas | **4**: outro slot · sem direito por nível · slug inexistente · peça de baú sem linha no guarda-roupa |
> | `avatar:folha-base` | **19 formas / 7 468 bytes** — igual ao congelado |
> | suíte | **497 testes / 29 arquivos**, com `pecas-de-elenco.test.ts` novo |
>
> **Medido ANTES de aplicar**, em ensaio a seco (transação → migration → gates →
> `ROLLBACK`, o método do Bloco C / E.2 / Bloco 6): o gate novo foi de **2 falhas
> a 35 verdes**, e `verify:perfil-publico` (**28/0**) e
> `verify:identidade-nas-listas` (**32/0**) rodaram verdes **na mesma transação**
> — a prova de que recolar a matview e as 5 funções não quebrou o que estava no
> ar. Nada sobreviveu ao `ROLLBACK`.
>
> **Duas decisões tomadas na execução, e as duas ficam registradas:**
>
> 1. **A trava "traje só para patente alcançável" NÃO entrou no
>    `verify:avatar-db`.** Com zero trajes semeados ela passaria por vacuidade,
>    que é o defeito que ela existe para não ter. Ela vem no **Bloco 2**, junto
>    com o primeiro traje. O necrológio de `verify-avatar-db.ts:36-39` foi
>    reescrito para apontar o endereço, em vez de só lamentar a falta.
> 2. **A ordem das camadas de cabeça ficou declarada em `compor()`:** cabelo →
>    rosto → chapéu. Óculos POR CIMA do cabelo porque, sem haste, a peça que a
>    criança desbloqueou não pode depender de qual franja está por baixo; chapéu
>    por último porque ele disputa o crânio e vence. A regra fina
>    (`escondeCabelo`) continua sendo decisão obrigatória do **Bloco 7** — este
>    bloco só garantiu o lugar.
>
> **O `rpc-baseline.json` subiu de propósito:** +1 em `get_ranking`,
> `get_ranking_with_position`, `get_public_profile`, `get_class_ranking` e
> `get_class_feed`; mais `equipar_peca: 1`, que é nova. As quatro de lista usam
> `EXECUTE format(...)` com SQL dinâmico e não há helper a extrair — é o mesmo
> dilema que o Bloco 6 encarou e resolveu do mesmo jeito.
>
> **Duas constraints de banco nasceram como trava de produto**, e não estavam
> escritas neste plano: `avatar_catalogo_traje_nao_e_de_bau` (a trava nº 3 da
> §1.3 vira CHECK em vez de disciplina) e `avatar_catalogo_origem_coerente` (o
> que não é da origem é `NULL`).

### Bloco 2 — Traje por patente

O momento de produto: **a promoção veste** — e o aluno novo já se veste.

- **11 peças em código**, pela skill `avatar-desenho`:
  - **Aprendiz ×3** (tier 0). A **opção A é o macacão de treino de hoje**,
    `tinta.cor = TRAJE_BASE.roupa` (`#C9BFA8`) e nenhuma decoração. Isso não é
    peça nova disfarçada: `tintaTronco()` resolve os dois casos na **mesma
    linha** (`compositor.ts:369`, `traje?.tinta.cor ?? TRAJE_BASE.roupa`), então
    o SVG sai **byte a byte igual** ao de hoje — custo de arte **zero**, e o
    teto de regressão da `folha-base` continua válido. As outras duas são
    variações de treino (cor e debrum), não uniforme: o primeiro galão nasce no
    Capitão (doc 17).
  - **Soldado ×4** e **Aspirante ×4**, com as cores medidas do doc 17
    (`#78833B` oliva e `#384966` ardósia).
- Seeds com `origem = 'marco_patente'`; Aprendiz é `min_tier = 0`, que **todo
  aluno satisfaz** — sem caso especial no código, sem exceção na RPC.
- **Auto-equipar a 1ª opção na promoção**, e o aluno troca depois no perfil.
- **O editor vira abas aqui** (Cabelo | Roupa), com `design-recruta64` e
  `impeccable`; os cards do cabelo trocam o boneco inteiro pelo recorte de
  cabeça; nasce o **recorte de tronco** para os cards de roupa.
- **`/criar-personagem` ganha a aba Roupa** — é o que a decisão do Aprendiz
  compra: a criança veste o boneco na criação, não só depois da primeira
  promoção. Ela salva com duas RPCs em sequência (`update_avatar_identity` e
  `equipar_peca`); se a segunda falhar, o aluno fica com o macacão — que é
  exatamente a opção A, e é o mesmo desenho. **Falha parcial não deixa boneco
  errado, deixa boneco padrão.**
- A Companhia (56×70 px) já mostra o tronco vestido, sem trabalho extra.
- A trava **"traje só para patente alcançável"** entra no `verify:avatar-db`,
  fechando a dívida de `verify-avatar-db.ts:36-39`.

**Parada:** folha de contato a 56 px aprovada pelo Doug; e2e "promover veste e
aparece" (roda o Doug).

> ### ⏸️ EXECUÇÃO DE 2026-08-12 — a arte NÃO passou, e o caminho mudou
>
> **Onde parou:** a folha de contato foi reprovada pelo Doug, e a decisão dele
> fecha a questão do método: **o traje vai pela ROTA DE ARTE (doc 19), com ele
> desenhando — não por código escrito pelo Claude.**
>
> As palavras dele, olhando a folha: *"as peças desenhadas diretamente por você
> via código estão feias, sem vida, quadradas. Elas se distinguem pelo menos e
> têm leitura boa… quero o nível de cabelo feito através de arte, não por você —
> espetado ou assimétrico ou chanel."*
>
> **E o número confirma a leitura dele, medido depois:**
>
> | cabelo | origem | pontos |
> |---|---|---|
> | coque | código | **7** |
> | moicano | código | **0** |
> | chanel | **arte** | **64** |
> | assimetrico | **arte** | **85** |
> | espetado | **arte** | **112** |
>
> Os três que ele citou são exatamente os três que vieram de arte; os dois de
> código são os que ele não citou. A diferença é de **uma ordem de grandeza**, e
> ele a identificou a olho antes de qualquer medição.
>
> #### As quatro decisões do Doug nesta sessão, e as quatro ficam
>
> 1. **A silhueta foi tentada e não cabe.** Três voltas de arte perseguiram
>    silhueta porque três críticos disseram que é o canal forte a 56 px. Eles têm
>    razão sobre o canal; a geometria deste boneco não o oferece — ver a régua
>    abaixo. **Não repropor.**
> 2. **São 3 opções por patente, não 4** (9 peças, não 11). Decisão de
>    2026-08-12, com a régua de silhueta binária na mesa: a quarta opção de
>    Soldado e de Aspirante repetia a terceira (1,47% e 1,56% de diferença de
>    FORMA, contra os 10 e 15% que a régua de cor mostrava).
> 3. **O Macacão do Aprendiz fica exatamente como está.** A crítica leu *"boneco
>    de madeira sem pintar"* e a causa é medida (o bege fica preso entre o fundo
>    e o tom da pele), mas o custo de consertar é o byte a byte: a opção A
>    deixaria de ser gratuita e todo aluno careca mudaria de aparência.
> 4. **Os 9 rascunhos ficam guardados e intocados**, em `.scratch/`. Eles
>    passam na régua de leitura; o que falta neles é a pele.
>
> #### As cinco réguas que esta execução produziu, e que valem para todo slot
>
> Nenhuma delas se remede — todas estão medidas e escritas nos rascunhos:
>
> | régua | o número | onde ela morde |
> |---|---|---|
> | **valor** (luminância) | piso 40 entre massas vizinhas | dois tons podem estar longe em matiz e colados em valor: `#5E5442` × `#4F5A46` distam 17 em RGB e **1** em valor — a mesma tinta a 56 px |
> | **teto de silhueta** | **26 u na cintura**, 53 u na barra | na cintura o teto é MENOR que o piso de leitura (50 u): ali não existe saliência legível, e crescer apaga o transbordo de 51,9 u que define o kokeshi |
> | **margem útil de um bloco** | a geométrica **− 6 − 19** | meio traço mais o plano lateral; explica por que uma tarja de 49 u lê como 1,95 px |
> | **silhueta binária** | mede forma, ignora tinta | as 9 peças diferem 0,31 a 2,46% em FORMA e 6 a 16% em COR: elas se separam por tinta, não por silhueta |
> | **escala** | a fração de pixels é **invariante de escala** | 5,89% a 56 px, 5,46% a 150, 5,41% a 340 — a métrica não sabe responder "onde a criança escolhe" |
>
> #### O que fica pronto e não se refaz
>
> - **A migration `20260812120000_bloco2_traje_por_patente.sql` está escrita e
>   NÃO aplicada.** Ela semeia os 9 slugs, cria a coluna `ordem` e ensina
>   `recompute_user_title` a vestir na promoção. **Ela não pode ser aplicada
>   sozinha** — `verify:catalogo-slots` exige que banco e código tenham os mesmos
>   slugs, e o código das peças não existe. Se a arte mudar os slugs, a migration
>   muda junto.
> - **A coluna `ordem`, que este plano não previa.** O §7 manda "auto-equipar a
>   1ª opção", e não existia "primeira" no banco: por slug,
>   `traje-soldado-avental` vem antes de `traje-soldado-farda`, e a promoção
>   vestiria o avental em vez da farda lisa.
> - **Os alunos que JÁ têm patente passam a vestir**, num `UPDATE` de
>   reconciliação — sem ele o traje só apareceria para quem fosse promovido
>   depois, e é o formato do achado R4 um andar abaixo.
> - **O Aprendiz A é gratuito, provado**: 4 configurações compostas (careca,
>   animado, com cabelo, folha externa) e 4 SVGs **byte a byte idênticos**. O
>   caso animado dá 7 468 bytes, que é o número congelado da `folha-base`.
> - **O achado G16**: nenhum gate mede o boneco completo (base + cabelo + traje),
>   e com os dois juntos ele bate exatamente o teto de 26 formas.
>
> #### A esteira que a próxima sessão constrói
>
> A rota de arte (doc 19) **já suporta traje quase inteira**. O que muda é uma
> inversão de duas linhas: hoje `REGIOES_QUE_REPROVAM = ["rosto", "corpo"]`
> (`scripts/avatar/arte/base.ts:281`) protege o corpo, porque a rota nasceu para
> cabelo. Para traje o corpo é o campo de desenho e **a cabeça é que precisa
> ficar intacta**.
>
> | passo | existe | muda |
> |---|---|---|
> | base de edição | `arte:base`, 1024 px, escala 1,2 | tronco em foco |
> | o Doug desenha | Gemini/Canva sobre o PNG | igual |
> | Gate −1 | protege `rosto` + `corpo` | protege a **cabeça**; corpo livre |
> | traçado | `tracar-cabelo.ts` (biblioteca compartilhada) | outra geometria de origem |
> | catálogo | `Cabelo.massa/clara/linhas` | `Traje` ganha os mesmos três campos |
>
> **O atalho a considerar antes de investir no traçado:** `Traje.tinta.png` já
> está no tipo e `tintaTronco()` já sabe desenhá-lo, clipado no tronco e escalado
> pela `escalaMedida`. A arte do Doug entraria como PNG direto, sem traçado — fica
> pesada (um arquivo por peça) e não escala para 9, mas prova o nível na tela
> antes de a esteira de traçado ser construída.
>
> **Primeira peça sugerida:** uma do **Soldado** — a patente sem cor clara
> (decisão medida do doc 17 §3.1). Se o volume funcionar só com tons de oliva,
> funciona em qualquer patente.

> ### ✅ EXECUÇÃO DE 2026-08-12 (2ª sessão) — a esteira do traje existe, e a
> ### primeira peça passou por ela
>
> **`traje-soldado-farda` aprovada pelo Doug na folha**, e a esteira ficou pronta
> para as 8 seguintes. Ela é a §12 do doc 19 e a
> `references/esteira-traje.md` da skill `avatar-importar-arte`.
>
> | comando novo | o que faz |
> |---|---|
> | `arte:base-tronco` | a base de edição e o campo do tronco, medidos |
> | `arte:traje -- <N artes>` | recolore pelo slug e recorta 1 : 1 |
> | `arte:trajes [--check]` | **gera** `trajes-da-arte.ts`; o `--check` está no `verify:arte` |
> | `arte:folha-traje -- <N>` | a folha de N peças entre si, com o controle sem-traje |
>
> **Os números da peça:** Gate −1 aprovada (deslocamento 0/0, escala 100,00%),
> extração com 1 componente e 0 descartadas, colagem em **(0, 0)** pela busca de
> registro, **95,38%** da arte visível, transbordo de **10,75%**, distinção de
> **38,93%** contra o boneco sem traje (piso 5%), e o composto **−2 formas /
> −1 294 bytes**. `folha-base` em 19 / 7 468 e os 11 selos parados.
>
> **Três ressalvas do Doug, todas pegas a olho antes de qualquer régua:**
>
> 1. *"a roupa passa da silhueta, e você eliminou isso"* → a arte saiu de dentro do
>    `clipPath` (§6.1 acima);
> 2. *"a sombra do corpo ficou por cima da roupa"* → o compositor não sombreia peça
>    com arte (§6.2 acima);
> 3. *"o contorno do tronco briga com o do PNG"* → **tentado e revertido**, por
>    decisão dele: *"regrediu e muito, deixa a borda como estava"*. A causa real —
>    a extração entrega o miolo do traço, não o traço — virou o achado **G17**.
>
> **Duas réguas minhas erraram e os controles pegaram**, e as duas ficam escritas
> no código: o controle de tom media razão relativa e castigava tom escuro (a
> régua certa é luminância em níveis, com teto de 0,50 vindo do arredondamento de
> 8 bits); e a busca de registro corria sobre a massa chapada, devolvendo quase o
> mesmo número para posições diferentes — corre sobre o traço da peça, e declara
> empate se o 2º colocado ficar a menos de 2%.
>
> **O que a promoção ainda deve** está na §7 da referência da skill: `TRAJES` no
> catálogo, a seed reescrita, a prop `traje` no `AvatarKokeshi`, o `useUser`, o
> teste de ausência byte a byte, e o PNG saindo de `public/dev/`.

### Bloco 3 — Fundo

O slot mais barato estreia a esteira de baú.

~6 fundos em código, origem mista (2 por nível, 4 por baú); `<FundoAvatar>` no
palco do perfil e do perfil público; aba "Fundo" com a **vitrine** (silhueta/"?"
na cor da raridade).

⚠️ Entre este bloco e o 4, peça de `origem = 'bau'` está semeada mas o baú
ainda não a dá — **vitrine sem porta**. Janela curta e aceita conscientemente;
o Bloco 4 vem logo atrás.

**Parada:** folha aprovada; **contraste boneco × fundo medido** — o contorno
preto tem de ler sobre cada um dos seis.

### Bloco 4 — O baú volta a dar peça

`claim_chest` v3 (§4). O `ChestOpeningModal` mostra a peça — e migra para a
direção A na mesma passada, que ele ainda deve (vizinho do D6: `zinc-*`,
`amber-*` e `animate-bounce` na linha 79). `verify:chest-pool` reescrito:
chances intactas, XP-como-comum presente no pool, fallback conferido no ledger.

**Parada:** gate verde; um baú aberto em produção pelo Doug entrega peça ou XP
corretamente.

### Bloco 5 — Rosto

Bancada de geometria: 2-3 formas contra `OLHO` e `BOCA`, **sem haste**, medindo
que a lente mais larga cabe no `RECORTE_CABECA` → ~6 peças como camada
sobreposta, maioria por baú. Aparece nos recortes de cabeça (navbar, rankings),
que é onde identidade rende. No editor é só mais uma aba.

**Parada:** separação a 32 px medida na folha; catálogo no ar.

### Bloco 6 — Chapéu de prova + Frente B

**A única mexida na geometria do boneco.**

1. Um chapéu de prova em código.
2. **Medir o teto que ele pede de verdade.**
3. Dimensionar a Frente B com esse número — o −80 deixa de ser chute.
4. Executar: `VIEWBOX` novo, **reconferir na hora a lista de arquivos** que
   citam a proporção ou a altura (o ESTADO diz 22, a varredura desta sessão
   achou 25 por identificador — número medido antes de mudança de escala
   envelhece calado, e já envelheceu uma vez neste projeto).
5. Re-congelar `folha-base` e os selos de `parametrico-congelado.ts`;
   reconferir `avatar:pose`, `avatar:fidelidade`, `arte:escala` e
   `recorte-cabeca.test.ts`. `RECORTE_CABECA` acompanha sozinho — é derivado.

Custo já aceito pelo Doug: boneco ~11% menor a 32 px (**remedir**, não repetir o
número) e o fim da proporção 5:7.

**Parada:** teto antes e depois medido; `verify:all` verde; **T1.5 fecha**.

### Bloco 7 — Chapéus

**Antes do primeiro:** decidir a regra chapéu × cabelo (§6) — campo
`escondeCabelo` no item.

4-6 chapéus, rota de arte ou código conforme a peça pedir; origem mista.

**Parada:** matriz chapéu × cabelo completa na folha (todos × 5 cabelos +
careca), aprovada pelo Doug.

### Bloco 8 — Pet: a Chocadeira acorda

- 4 pets iniciais em código.
- `user_eggs.pet_slug` (**nome novo**, fora das listas e da regex do gate) e a
  constraint `user_eggs_xp_positivo` ajustada — hoje ela exige `xp_bonus > 0`
  (`20260810140000:487-488`), e o ovo de pet não paga XP.
- `_create_random_pet_egg` v2: reserva **pet inédito** por raridade; sem pet
  inédito, **não nasce ovo**.
- `claim_chest` ganha o ramo do ovo nas raridades altas — "volta raro" (T9).
- `hatch_egg` concede ao guarda-roupa e devolve o pet que `HatchResult.pet` e o
  `EggHatchingModal` já esperam — **fecha o achado D6**.
- `<PetKokeshi>` no palco; a Chocadeira deixa de dizer "em breve".

**Parada:** um ovo sorteado, chocado e o pet no palco, conferido pelo Doug;
`verify:all` verde.

## 8. Os gates

**`verify:catalogo-slots` (novo)**, no molde de `verify:cabelo-catalogo`:

1. **A trava anti-v2, e é a mais importante:** o conjunto de slugs do banco tem
   de ser **igual** ao conjunto de peças do código, **slot a slot**. Peça sem
   arte renderizável não pode ser semeada; peça no código sem linha no banco não
   pode ficar órfã. É esta conferência que torna impossível repetir "8 uniformes
   no banco, 0 renderáveis".
2. Consistência origem × colunas: `bau` tem raridade e não tem marco;
   `marco_nivel` tem `min_level`; `marco_patente` tem `min_tier` alcançável.
3. **Negação medida**, dentro de `sql.begin` com `Rollback`, com `set local
   role authenticated`: equipar peça de outro slot é negado; equipar sem
   direito é negado; slug inexistente é negado; peça a que se tem direito é
   aceita **e persistida**; `authenticated` não escreve no catálogo nem no
   guarda-roupa.
4. Pirâmide de raridade do pool de baú dentro da faixa declarada.

**`verify:avatar-db` (ampliado, nunca afrouxado):** as três listas de proibidos
e a regex de colunas mortas ficam **intactas**; entram (a) **traje só para
patente alcançável**, fechando a dívida de `:36-39`, e (b) peça equipada existe
e pertence ao dono.

**`verify:chest-pool` (reescrito no Bloco 4):** chances 45/30/18/7 intactas,
XP presente no pool comum, fallback de pool vazio conferido no ledger.

## 9. O que este plano NÃO resolve

- **A moldura de raridade (6.2).** Morta desde 2026-08-11 com a justificativa
  "raridade morreu com os itens" — justificativa que este plano derruba. O
  argumento original volta a valer, e a decisão é do Doug. **Registrado como
  aberto, não incluído.**
- **O achado D11** (Lenda / Grão-Mestre × Mestre; 8 tiers × 6 patentes). "Por
  demanda" o contorna; ele precisa estar decidido antes dos trajes do Capitão
  para cima.
- **A escada de nível está mais curta do que o Doug aprovou** (achado **G10**):
  a curva viva é 1,05, não 1,08, e a ~300 XP/dia o nível 30 custa **20,8 dias**,
  não 35. Se este plano amarrar peça a nível, **essa é a régua real** — e é
  decisão do Doug se ela ainda serve.
- **A Companhia com o boneco completo** (T2.16) — segue fora, como na V1.
- **Os cabelos 6 a 10** do mínimo de catálogo — fila própria da rota de arte
  (doc 19), não deste plano.
- **O `useUser` ainda pede duas colunas mortas** (achado **D12**:
  `avatar_config` e `avatar_base`). Não atrapalha, e some quando alguém quiser.

## 10. Changelog

- **2026-08-11 — criado.** Decisões do Doug nesta sessão: a v2 falhou por arte
  do boneco velho (raridade e baú voltam); pet por ovo + Chocadeira; traje por
  demanda (11 peças, não 24); **o Aprendiz também escolhe, com 3 opções**, e a
  primeira é o macacão de hoje — byte a byte, custo de arte zero; XP como prêmio
  comum do baú; óculos sem haste com lente livre; editor em abas; card mostra a
  peça, não o boneco. Arquitetura B escolhida (1 catálogo + guarda-roupa). Bloco
  0 executado até o merge; **push pendente por falta de rede**.
