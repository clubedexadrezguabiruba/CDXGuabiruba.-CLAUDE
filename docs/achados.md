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

### R3 — o opt-out do ranking só vale depois que a matview refresca
**Prova:** `MEDIDO` — 2026-08-09, ao escrever a `set_preferencias` do R1.
Achado pelo Claude, executando o R1. Registrado e **não consertado**, pela regra 9.

`ranking_visible` é **coluna da matview** `user_public_profiles`, e é a cópia de lá
que `get_ranking` filtra. Quem desliga o botão em Configurações muda
`public.users` — e continua aparecendo no ranking global até a matview refrescar.

O refresh acontece por level-up (`20260313500000_phase7_refresh_on_levelup.sql`) e
dentro de `update_avatar_base`. Nenhum dos dois é o ato de desligar o botão. Numa
base pouco ativa, a janela é longa.

**Não é regressão do R1.** O `UPDATE` direto de antes também não refrescava; a RPC
nova preserva o comportamento **de propósito**, para o passo 2 não misturar conserto
de segurança com mudança de comportamento. Fica registrado porque agora tem dono
óbvio: uma linha guardada dentro da RPC.

**O conserto, se o Doug mandar:** `IF p_ranking_visible IS NOT NULL THEN PERFORM
public.refresh_public_profiles(); END IF;` em `set_preferencias`. É o precedente que
`update_avatar_base` já usa para a própria coluna. Migration nova, uma linha.

**O que NÃO está medido:** quanto tempo a janela dura na prática, e se
`REFRESH ... CONCURRENTLY` a cada toque do botão custa caro. A segunda pergunta é o
motivo de isto não ser óbvio o bastante para consertar sem decisão.

**Decisão do Doug, 2026-08-10: continua esperando.** Perguntado com as três saídas na
mesa (consertar, esperar, medir o custo antes), escolheu esperar. **Não repropor** — o
próximo a abrir este arquivo já tem a resposta.

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

### G19 — ~~o Gate −1 mede o registro na faixa que a diretriz do transbordo manda invadir~~ ✅ FECHADO

> **CONSERTADO em 2026-08-13**, na abertura do Bloco B4 — e ele deixou de ter
> conserto opcional: com a paleta permissiva a arte chega em **cor final**, então a
> máscara de ciano não fica pior, ela fica **vazia**.
>
> **O conserto é o que o próprio achado previa:** tirar do alvo do SAD, dentro da
> faixa de rodapé, os pixels que **escureceram** em relação à base — conservador e
> independente do registro. `gate-menos-um.ts`, constante `ESCURECEU = NIVEL = 24`.
>
> **Por que "escureceu" e não "mudou":** excluir tudo que difere no índice 0 faria o
> SAD valer ~0 em (0,0) por construção, e o registro passaria a aprovar tudo. A
> assimetria salva o sinal — um boneco deslocado escurece de um lado da elipse de
> sombra e **clareia** do outro, e o lado que clareou continua medindo.
>
> | entrada | antes | depois |
> |---|---|---|
> | `traje-soldado-farda` (controle negativo) | 0 / 0 · 100,00% | **0 / 0 · 100,00%** |
> | a própria base (controle negativo) | 0 / 0 · 100,00% | **0 / 0 · 100,00%** |
> | gambesão aprovado | 0 / **2** · REPROVADA | **0 / 0 · APROVADA** |
> | fixture b (deslocamento 3 px) | (3, 3) reprova | (3, 3) reprova |
> | fixture c (escala 103%) | (0, 8) reprova | (0, 8) reprova |
> | fixture d (recorte 60 px) | (−18, 3) reprova | **(−2, 0)** reprova |
> | fixtures e, f | passam no registro | passam no registro |
>
> **O preço está declarado no código:** a fixture d perdeu margem — de 18× para 2× a
> tolerância —, embora continue reprovando duas vezes (registro **e** 79 ladrilhos
> de forma no rosto). O limite de profundidade que a consertaria (30 u) derruba o
> gambesão de volta, e escolher 40 u seria calibrar o teto na peça que se quer
> aprovar. Ficou a régua simples com o custo escrito.
>
> O texto abaixo fica como registro do defeito.

**Prova:** `MEDIDO` — 2026-08-12, na 2ª rodada de arte do gambesão do Soldado.
Achado pelo Claude ao conciliar o gate com a leitura por subagente. Registrado e
**não consertado**, pela regra do "achar não é consertar".

**A contradição, dentro da saída do MESMO comando.** `npm run arte:gate` na
candidata do Gemini reprovou com *"registro: deslocamento (0, 8) px e escala
100,25% — o gerador moveu ou redimensionou o boneco"*, e no painel logo acima
imprimiu:

```
· rosto            0    144      0       119   0.33%
```

**Zero ladrilhos de forma diferentes, de 144.** Um deslocamento real de 8 px com
escala 100,25% acenderia o rosto inteiro. A leitura independente por subagente
mediu a cabeça idêntica no pixel: 10 px divergentes em toda a região y 130–500 ×
x 250–790, bbox da pele igual (y 154, x 310–730), traço preto do queixo com
310–314 px por linha contra 310–318 da base.

**A causa, com arquivo e linha.** O registro é um SAD calculado **só sobre a faixa
de rodapé** — `gate-menos-um.ts:544`, `paraUnidade(x, y).y > Y_FIM_TRONCO`, com
`Y_FIM_TRONCO` em `base.ts:241`. A máscara que protege essa faixa da peça é
**preliminar e só de ciano** (`:533`: matiz ∩ saturação). O **contorno preto** que
a barra da roupa carrega não é ciano, **não entra na máscara**, e fica dentro do
alvo do SAD como estrutura escura que a base não tem. Aí o mínimo escorrega:
descer a base ~8 px alinha parcialmente a borda da elipse de sombra do chão com a
barra nova.

**Dose-dependente, com controle negativo:**

| arte | peça dentro do rodapé | registro medido |
|---|---|---|
| `traje-soldado-farda` — **aprovada** | 0,7% (rodapé mensurável 99,3%) | 0 / 0 · 100,00% |
| gambesão, candidata Gemini | **6,6%** (rodapé mensurável 93,4%) | 0 / **8** · **100,25%** |

E os 6,6% contam **só o ciano**: o traço preto da barra, que é o que de fato
enviesa, não aparece nesse número.

**Por que 🟠 e não 🟡:** em 2026-08-12 o Doug tornou o transbordo **diretriz
obrigatória** (*"deve passar da silhueta, que nem a primeira arte. isso deve ser
padrão e diretriz"*), com teto de **21 px na barra** — e a barra desce exatamente
dentro da faixa de rodapé. O `PEDIDO-TRAJE.md` agora manda o gerador fazer a coisa
que faz este gate mentir. A reprovação vem com a instrução *"gere a arte de novo
sobre a base oficial"*, então o custo é uma rodada de gerador e o tempo do Doug,
por um defeito que não existe. Vai se repetir em toda peça de traje daqui em
diante.

**A saída provável, quando for a hora** — e ela não é mexer no teto do
transbordo: a máscara do rodapé precisa excluir **também o preto que não está na
base**, não só o ciano. Hoje `preliminar` é construída antes do registro de
propósito (o comentário em `:524-526` explica: o traço da peça exigiria um registro
que ainda não existe). Um passo barato: tirar do alvo os pixels que **escureceram**
em relação à base dentro da faixa, que é conservador e não depende de registro.
**Nada disso se faz sem controle negativo** — a farda aprovada tem de continuar
medindo 0 / 0 · 100,00%.

### T1 — ~~A régua da patente: por trilha, ou por dose fixa?~~ FECHADO
> ✅ **Decidido pelo Doug em 2026-08-11: a patente vem de concluir uma trilha.**
> Fechado no mesmo dia, porque a medição mostrou que a decisão **não exige mudar
> número nenhum** — só amarrar o princípio. `title_tiers.trail` +
> `verify:avatar-db` (e), migration `20260811120000_t1_patente_por_trilha.sql`.
> Gate de **24 passed / 1 failed** para **27 passed / 0 failed**. O corpo abaixo
> fica como está — é ele que explica por que a pergunta existia.

**A medição que virou a pergunta do avesso** (`MEDIDO` — 2026-08-11, contra
produção, leitura pura):

`title_tiers.lessons_required` é `tier * 15`, 8 tiers, Lenda em 105. E as trilhas
do banco são `recruta` (15 aulas) e `soldado` (15). Ou seja: **os marcos 15 e 30
já são as fronteiras das duas trilhas.** A régua viva já obedecia ao princípio —
15 nunca foi uma alternativa a "por trilha", era a consequência dele com o
conteúdo de hoje. As duas opções da pergunta original eram a mesma opção, vista
de dois anos diferentes.

Trocar agora para o acumulado do currículo colocaria o marco 26 no **meio** da
trilha `soldado` (aulas 16 a 30): o aluno terminaria a trilha inteira sem ganhar
nada e ganharia a patente onze aulas antes, sem nada na tela para explicar. É o
defeito que a decisão existe para evitar.

**O estado dos alunos, medido:** 19 contas; **2** cruzaram o tier 1
(`aulas-sol+1785163858599` com 22 aulas, `teacherdoug001` com 15); ninguém chegou
ao tier 2. Nenhuma muda de patente com a decisão — e não mudaria nem sob a régua
do currículo, porque a marca d'água de `recompute_user_title` nunca rebaixa.

**O que a decisão trocou de lugar:** o número deixou de ser digitado e passou a
ser conferido. `title_tiers.trail` diz qual trilha cada patente fecha, e o gate
mede o acumulado em `lessons` contra `lessons_required`. Quando a T1 crescer para
26 aulas, o gate reprova até o `UPDATE` acompanhar — **o B0.5 do currículo deixou
de depender de alguém lembrar.**

**E isso foi medido, não prometido.** Simulando a T1 já com 26 aulas contra o
banco real (`.scratch/t1-simula-26.ts`, leitura pura), a conferência (e) reprova
os dois marcos com a linha inteira: *"Soldado fecha a trilha `recruta`; o
acumulado até ela é 26 aulas, e o marco está em 15"* — e o `Aspirante` junto, em
41 contra 30.

**O corpo original da pergunta**, preservado:

> A patente acompanha cada **trilha** curricular, com marcos irregulares
> 26·47·66·84·101·115·126 — ou é progressão **gamificada independente**, a cada
> 15 aulas?

Não são três versões vivas, como o `ESTADO.md` dizia. São duas: o histórico
versionado e o doc 15 §3 **concordam em 15**; o currículo quer as fronteiras de
trilha. A versão de 30 morreu duas horas depois de nascer, na migration
seguinte.

**Travava:** o Bloco 7b do avatar (uniforme por patente) e o B0.5 do currículo.
Os dois estão destravados.

### T9 — ~~o baú deixou de ser recompensa: 55% dele vai para uma fila que rende 9 XP/dia~~ FECHADO
> ✅ **Fechado em 2026-08-10 pelo E.2**, que era a condição de fechamento escrita
> no fim deste achado. `20260810180000_e2_bau_paga_xp_direto.sql` aplicada em
> produção pelo Doug; `verify:chest-pool` de **11 passed / 7 failed** para **18
> passed / 0 failed**. Medido no banco depois: **fila 0**, 16 grants de
> `egg_bonus` somando **445 XP** em **5 contas**, e 3 baús de level-up criados
> pelo próprio `grant_xp` ao subir gente de nível com o XP represado. O corpo
> abaixo fica como está — é ele que explica por que a decisão foi tomada.

**Prova:** `MEDIDO` — 2026-08-10, **em produção**, depois do F.1. `pg_get_functiondef`
da `claim_chest` viva + as 24 linhas de `user_chests` e os 5 ovos na fila do
`teacherdoug001`. Achado pelo Doug, abrindo 5 baús no ar; medido pelo Claude.
Registrado e **não consertado**, pela regra 9.

**Não é bug, e não é regressão de bloco nenhum.** É o preço da decisão da §1.1 de
`docs/avatar/20-troca-de-pilha-plano.md` — *"ovos e Chocadeira **ficam**, sempre
dando XP, e a UI construída sobrevive"* —, e esse preço não estava na mesa quando a
decisão foi tomada.

**A regra viva.** `claim_chest` sorteia `random()` uma vez, independente da fonte:
`legendary` 7% · `epic` 18% · `rare` 30% · `common` 45%. **P(ovo) = 55%**, que é
exatamente o que o `verify:chest-pool` cobra. Os 5 ovos seguidos do Doug são
**0,55⁵ = 5,0%** — um em vinte, azar dentro da regra.

**A fila é o achado.** Os ovos chocam **em série**, 72h cada (`EGG_HATCH_HOURS`, e
`status` só admite um `hatching`). Medido na conta do Doug: 1 chocando + 4 `queued`,
**140 XP presos por 15 dias** — `rare` 25 · `epic` 40 · `rare` 25 · `rare` 25 ·
`rare` 25. São **9,3 XP/dia**, contra a calibração de ~300 XP/dia que o
`verify:xp-curve` cobra: o baú virou **3% de um dia de XP**.

**E a forma é pior que o número:** o aluno espera 72h para receber **a mesma moeda**
que o baú `common` entrega na hora. Antes o ovo guardava um pet, e o colecionável
pagava a espera. Sem pet, a espera não tem conteúdo — é atraso puro sobre XP. O baú
`rare` (30% dos casos) é **estritamente pior** que o `common` em tempo, e melhor só
em número.

**Efeito estrutural, não medido:** a fila drena 1 ovo a cada 3 dias. Um aluno que
ganhe mais de um baú por 3 dias — e há 5 fontes: cadastro, level up, missões do dia,
conquista e ofensiva — **acumula fila sem limite**. Na conta do Doug isso não
aparece (24 baús em ~6 meses, ~1 por semana), mas ele é um professor testando, não
um aluno em trilha.

De brinde: o degrau **`common` → 15 XP da escada do ovo ficou inalcançável**, porque
`common` nunca vira ovo. Os 4 ovos `common` com `xp_bonus = 15` no banco são os
convertidos pelo Bloco B.

**As quatro saídas, e nenhuma é conserto óbvio:**

1. **Chocar em paralelo** — mata a fila e preserva a Chocadeira e a decisão da §1.1.
   É a mais barata em decisão e a menos medida em código: a UI hoje desenha *um* ovo
   e uma fila atrás.
2. **Baixar as 72h.** Uma constante nos dois lados. Não resolve a forma, só encurta.
3. **Matar o ovo e pagar o XP na abertura** — resolve a forma inteira e **reverte a
   §1.1**: a Chocadeira, o `EggCard` e o `EggHatchingModal` perdem assunto. É o
   vizinho do **D6**, que já registra o card de pet que nunca abre.
4. **Devolver conteúdo ao ovo** — o ovo passa a dar **cabelo** em vez de XP. Amarra
   esta frente ao catálogo de arte (Bloco 8 do doc 15), que hoje tem 5 modelos.

**Quem decide:** Doug. A 1 e a 3 são as que mudam a experiência de verdade, e são
opostas: uma salva a Chocadeira, a outra a aposenta.

---

✅ **DECIDIDO pelo Doug em 2026-08-10 — e é uma QUINTA saída, não uma das quatro.**

> *"o xp não deve vir dentro do ovo (hoje deve ser lendário e vir um pet). temos que
> arrumar isso. xp vem direto do baú, como se fosse um item comum."*

**O ovo deixa de ser recipiente de XP e volta a ser recipiente de PET.** O XP passa
a ser pago pelo próprio baú, na hora, para toda raridade — como um item comum
sempre foi entregue. A espera some porque o motivo dela some: não se espera 72h por
uma moeda que já está na mão.

É diferente da saída 3 (*matar o ovo*) num ponto que importa: **o ovo não morre, ele
hiberna.** A mecânica, a Chocadeira e o modal continuam existindo, esperando a única
coisa que lhes dava sentido — o pet, que o Bloco B apagou junto com o catálogo v2.
Quando houver arte de pet (Bloco 8 do doc 15), o ovo volta pelo caminho que já está
construído, e volta **raro**.

Três decisões acessórias, tomadas junto:

| | decisão |
|---|---|
| enquanto não houver pet | **nenhum baú cria ovo.** O lendário paga XP como os outros — recompensa presa atrás de prazo indefinido é o defeito que se está consertando |
| a Chocadeira no `/perfil` | **fica na tela, vazia, "em breve"** — a promessa continua visível para o aluno |
| a escala de XP | **15 / 25 / 40 / 60**, que era a do ovo. Os 5/10/20/35 eram valor de consolação da forja de item repetido, e a §1.1 do doc 20 já registrava que 5 XP por baú é pouco |

E os **ovos presos na fila** pagam o `xp_bonus` na própria migration, que a
esvazia — os 140 XP do Doug entram em vez de ficarem 15 dias em espera.

⚠️ **Não são 13 — são 16, e não são só do Doug.** Medido no banco vivo em
2026-08-10, ao escrever a migration do E.2: **16 ovos em voo** (5 `hatching` +
11 `queued`), **445 XP** presos, em **5 contas** — `suzanfbaron` 5 ovos/135 XP,
`teacherdoug001` 5/140, `gbitelbrun` 3/75, `pafischersgrott` 2/55,
`englishwithteacherdoug` 1/40. O 13 era número velho, herdado da contagem do
Bloco B; o que a migration paga é o medido.

**O achado NÃO fecha aqui**, porque decisão não é conserto: ele fecha quando o
**E.2** do `docs/avatar/20-troca-de-pilha-plano.md` aplicar a migration e o
`verify:chest-pool` medir 0 ovos e o XP certo por raridade.

📌 **Como o E.2 foi medido antes de bater em produção:** a migration rodou
primeiro **a seco**, em transação revertida, com o **gate inteiro rodando dentro
da mesma transação** — 11/7 antes, 18/0 depois, produção intacta. Sem banco
separado (D3), é o único jeito de medir "passa depois" sem aplicar. A previsão
bateu com o mundo número a número depois do apply.

**O que a decisão derruba, e vale registrar:** a saída 4 (*o ovo dá cabelo*) está
descartada. O seletor do Bloco E segue com **uma** fonte de desbloqueio — o nível de
XP —, e a régua semeada no Bloco C **não muda**. O **D6** (o card de pet que
`hatch_egg` nunca preenche) deixa de ser código morto e vira **código à espera**;
ele passa a fechar junto do pet, não contra ele.

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

### T8 — ~~a F2 deixa o aluno escolher um cabelo que não tem onde ser guardado~~ FECHADO
**Prova:** `MEDIDO` — 2026-08-10, grep em `supabase/migrations/` e leitura da T2.1.

> ✅ **Fechado em 2026-08-10 pelo Bloco C**, que era a condição de fechamento escrita
> abaixo. A linha do resumo está na tabela de Fechados; o corpo fica como estava,
> porque é ele que explica de onde vinha a divergência. **Uma emenda:** o default de
> `avatar_hair` ficou **`NULL` (careca)**, não `coque` — a régua semeada pôs `coque`
> no nível 10, e default não pode ser peça travada. O porquê está na §Bloco C do
> `docs/avatar/20-troca-de-pilha-plano.md`.

A **T2.10** (`docs/avatar/14-backlog-execucao.md:365`) entrega `criar-personagem` com
**três escolhas**: tom de pele, **modelo de cabelo** e cor do cabelo. A **T2.1**
(`14:340-350`), que é a migration da fase, cria `users.avatar_skin` e
`users.avatar_hair_color` — e **não cria `users.avatar_hair`**.

A coluna não existe hoje: `avatar_hair` tem **zero ocorrências** em
`supabase/migrations/`. O código já mediu isso e registrou certo, em
`src/lib/avatar/estilo/cabelo.ts:502-506` — as colunas de avatar hoje são
`avatar_config`, `avatar_base`, `avatar_url` e `avatar_chosen`. E `tipos.ts:99-100`
declara a expectativa de **duas** colunas separadas, `avatar_hair` e
`avatar_hair_color`, justamente para não desmontar um objeto nas duas pontas.

Quem executar a fase na ordem escrita descobre o buraco no meio da migration.

**Junto vem um erro de fato no backlog**, e ele está na nota escrita *para quem
executar a F2*: `14:379` afirma que *"o default de `users.avatar_hair` continua
`'curto'` e não mudou com a promoção"*. A coluna não existe, e `curto` não é mais um
`ModeloCabelo` (`cabelo.ts:93-98`) — foi podado. O próprio `cabelo.ts:499-506` já
corrige as duas coisas; o backlog não recebeu a correção.

**Trava:** a T2.1. Construir sobre a lista como está produz migration incompleta.
**O fix, quando a F2 abrir:** acrescentar `users.avatar_hair` à T2.1 com default num
`ModeloCabelo` vivo — `coque` é quem abre a lista desde a poda (`cabelo.ts:499-500`) —
e corrigir a linha 379 do backlog.
**Achado por:** Claude, conferência do 2b, 2026-08-10.

*Atualização de 2026-08-10: **deixou de estar parado — está agendado.** A decisão do
T7 substituiu a T2.1 pelo **Bloco C** de `docs/avatar/20-troca-de-pilha-plano.md`, que
cria as três colunas (`avatar_skin`, `avatar_hair`, `avatar_hair_color`) com default
`coque`. Fecha quando o Bloco C fechar; segue aberto até lá.*

### T10 — 28 páginas de servidor esperam uma consulta de cada vez; `Promise.all` e `React.cache()` não aparecem nenhuma vez no servidor
**Prova:** `MEDIDO` — 2026-08-10, varredura da `vercel-react-best-practices` sobre
`src/`. `grep` de `Promise.all` em `src/`: **4 ocorrências, todas em componente de
cliente** (`AlunoRelatorioClient.tsx:58`, `RelatorioClient.tsx:53`,
`ActivityToasts.tsx:175`, `rush/page.tsx:113`). `grep` de `cache(` de `react` e de
`unstable_cache`: **zero**. Achado pelo Claude; registrado e **não consertado**.

Toda página de servidor deste projeto tem a mesma forma: uma fila de `await
supabase…`, cada um esperando o anterior terminar, mesmo quando nenhum depende do
outro. É a regra `async-parallel` da skill, e o desenho é sistêmico — 28 arquivos.

Os dois piores, medidos linha a linha:

| Arquivo | Idas seriais | Quantas dependem da anterior |
|---|---|---|
| [perfil/page.tsx](src/app/(main)/perfil/page.tsx#L28-L83) | 8 | 1 (só o `getUser`) |
| [dashboard/page.tsx](src/app/(main)/dashboard/page.tsx#L35-L67) | 4 | 1 (só o `getUser`) |

No `/perfil`, as linhas 39, 49, 53, 59, 66, 72 e 79 só precisam de `user.id` — que
já existe desde a linha 28. São **sete viagens em fila para o mesmo banco** quando
uma rodada de sete em paralelo dava o mesmo resultado. O `/dashboard` repete em
menor escala: linhas 41, 56 e 64 são independentes entre si.

**A segunda metade é pior que a primeira.** [(main)/layout.tsx](src/app/(main)/layout.tsx#L13-L35)
faz `auth.getUser()` + `users` + `user_titles` — e o `dashboard/page.tsx` faz
**exatamente as mesmas três** de novo. Layout e page rodam em paralelo, então não é
cascata: é consulta duplicada. `React.cache()` resolveria com uma linha por função,
e é a regra `server-cache-react`. Como o layout é o de **todas** as rotas de
`(main)`, a duplicata acontece em toda página autenticada que também lê `users` —
`/perfil`, `/puzzles`, `/turmas`, `/dev/*`.

**Nenhum gate olha para isto**, e é por isso que está aqui e não no backlog: a
próxima página nova vai nascer com a mesma forma, porque é a forma que o
repositório inteiro ensina.

**O conserto, se o Doug mandar:** é mecânico e sem decisão de arquitetura —
`const [a, b, c] = await Promise.all([...])` nas 28 páginas, e um
`src/lib/supabase/sessao.ts` com `getUsuarioAtual = cache(...)` para matar a
duplicata layout×page. Dá para fatiar por rota e medir uma de cada vez.

**O que NÃO está medido:** quanto tempo cada ida custa contra o Supabase de
produção. A economia é certa em número de viagens (de 8 para 2 no `/perfil`); em
milissegundos, não medi.
**Achado por:** Claude, varredura da `vercel-react-best-practices`, 2026-08-10.

*Atualização de 2026-08-10 — **1 página de 28 fechada; o achado segue aberto.** O
Doug mandou consertar o `/dashboard` como piloto, e só ele. As três consultas agora
saem num `Promise.all` (4 idas viraram 2), com guarda em
`src/app/(main)/dashboard/__tests__/dashboard-cascata.test.ts`: o teste prende as
respostas e exige que as três tenham partido antes de qualquer uma chegar — em
fila ele reprova com `expected [ 'users' ] to deeply equal [ 'users',
'user_titles', 'rpc:ranking' ]`. **O que continua igual:** as outras 27 páginas,
com o `/perfil` (8 em fila) na frente, e a duplicata layout×page — `React.cache()`
segue com zero ocorrências no repositório.*

---

## 🟡 Promessa sem lastro

### G20 — o gambesão tem PELE no pescoço, e este boneco não tem pescoço

**Prova:** `MEDIDO` — 2026-08-12 por subagente sobre a arte crua, reconfirmado
2026-08-13 na folha de contato da peça montada.

**O Doug APROVOU a peça em 2026-08-13, com este defeito nomeado**, e pediu o
conserto em sessão própria: *"aprovo os dois trajes! apenas arrume a parte do
pescoço do traje azul"*. Ou seja: **isto é trabalho encomendado**, não achado à
espera de decisão — a única linha desta lista nesse estado.

**O que está lá, medido:**

| | |
|---|---|
| na arte crua (1024²) | **1 666 px** de RGB (182, 128, 88), bbox x 497–566 × y 513–649 |
| quanto desce | a bbox da pele vai a y 647 — **146 px abaixo do queixo** |
| na peça montada, na folha | pele exposta no decote laçado entre y 1035 e 1055, **13 px de largura no pico**, afinando para 4 |
| a 340 px | lê como gola aberta, e é plausivelmente intencional |
| **a 56 px** | vira **um ponto pêssego isolado no pescoço**, sem explicação |

É a **única pele abaixo da cabeça em toda a folha** — o controle sem traje e a
farda não têm nenhuma.

**A causa não é a extração.** A rota de cores finais faz o que deve: aqueles
pixels diferem da base e caem dentro do campo do traje, então são peça. O gerador
é que desenhou pele onde o boneco não tem pescoço — e o mesmo gesto cortou o traço
do queixo (vazio de 186 px em y 502, divergência de 214 px na cabeça).

**Por que 🟡 e não 🟠:** nada trava. A peça está no catálogo, é sorteável e
renderiza; o defeito é de leitura a 56 px, que é onde o avatar mais aparece.

**O conserto, quando for a hora** — e as duas saídas têm custo diferente:

1. **Retoque de geometria no Gemini**, uma rodada: fechar o traço do queixo e
   tirar a tira de pele. Reentra pela esteira inteira (Gate −1 → `arte:traje` →
   `arte:trajes` → folha), e o slug não muda. É o que o sidecar
   `traje-gambesao.md` já previa como "um retoque leve só de geometria".
2. **Cortar no campo do traje**: subir o piso de `noCampoDoTraje` acima do decote.
   Barato e **errado** — cortaria decote legítimo de toda peça futura, e é a
   forma exata de calibrar a régua no defeito que este repositório proíbe.

**O decote 19 px fora do centro fica de fora deste achado**, e é decisão: o Doug
aprovou a peça vendo a folha, e assimetria de decote não é a mesma classe de
defeito que pele onde não há pescoço.

### G18 — ~~o passo 0 da esteira do traje ensina o CONTRÁRIO do pedido~~ ✅ FECHADO

> **CONSERTADO em 2026-08-13**, de carona no Bloco B1 da virada de direção — o
> `PEDIDO-TRAJE.md` estava sendo reescrito no mesmo commit, e deixar o terminal
> contradizendo o pedido novo repetiria o defeito com outra roupagem.
>
> **O conserto é o que o próprio achado previa:** o bloco bifurcou.
> `base-tronco.ts:303-317` agora imprime **COM arte** (só o contorno de 12 u; o
> volume inteiro é da arte, inclusive a sombra de contato) e **SEM arte** (as duas
> camadas do macacão bege). Uma tela, nenhuma régua nova — como estava escrito.
>
> O texto abaixo fica como registro do defeito.

**Prova:** `MEDIDO` — 2026-08-12, ao abrir a segunda peça de traje
(`traje-soldado-duas-pecas`). Achado pelo Claude ao rodar o passo 0. Registrado e
**não consertado**, pela regra do "achar não é consertar".

`npm run arte:base-tronco` imprime, como última seção antes de o Doug ir desenhar:

```
O QUE O SISTEMA REPÕE POR CIMA DA ARTE (compositor.ts:389-393)
  sombra do queixo    contato da cabeça no tronco
  plano lateral       escurecimento da lateral, opacidade .42
  → a arte é pintada CHAPADA; quem faz o volume de contato é o compositor
```

**Nada disso vale mais para peça com arte.** No mesmo dia, atendendo à segunda
ressalva do Doug (*"a sombra do corpo ficou por cima da roupa"*), `tintaTronco()`
passou a suprimir as duas quando existe `tinta.png` —
`src/lib/avatar/estilo/compositor.ts:391`, `if (!traje?.tinta.png)`. E toda peça
que sai desta esteira tem `tinta.png`, por construção: é o que `arte:traje` gera.

**A fonte:** `scripts/avatar/arte/base-tronco.ts:303-305`. É `console.log` puro,
sem gate por trás — e a citação de linha (`compositor.ts:389-393`) hoje aponta
para o comentário que explica a supressão, não para o código suprimido.

**Por que 🟡 e não 🟠:** nenhum gate lê esse texto e nenhum render depende dele. O
custo é humano e concreto: quem seguir o passo 0 desenha a peça **sem** a sombra
de contato sob o queixo, esperando que o sistema a reponha — e ela não vem. Volta
uma rodada de Gemini e o tempo do Doug. O `PEDIDO-TRAJE.md` diz o certo (*"o
volume é TODO seu, inclusive a sombra sob o queixo"*), então hoje quem lê os dois
vê a contradição; quem lê só o terminal, não.

**O conserto, quando for a hora:** o bloco tem de bifurcar — o que o sistema repõe
**sem** arte (as duas camadas) e **com** arte (só o contorno de 12 u, desenhado
depois). Uma tela, nenhuma régua nova.

### G17 — a extração entrega o MIOLO do traço, não o traço: o contorno da peça chega com metade do perímetro abaixo do legível

**Prova:** `MEDIDO` — 2026-08-12, na primeira peça de traje pela rota de arte
(`traje-soldado-farda`). Achado pelo Claude ao consertar uma ressalva do Doug.
Registrado e **não consertado**, pela regra do "achar não é consertar".

**O número, na borda do tronco, em banda de preto puro (< 25 por canal):**

| render | p05 | p50 | p95 | perímetro < 8 u |
|---|---|---|---|---|
| o boneco sem traje (referência) | 10,8 | **11,7** | 16,7 | **0,0%** |
| a peça sozinha, sem o traço do tronco | 2,5 | **7,5** | 11,7 | **51,6%** |

O traço do boneco é 12 u. O contorno que a peça carrega mede **7,5 u de mediana**,
e **metade do perímetro fica abaixo de 8 u** — que é o piso de legibilidade desta
rota (0,64 px a 56, logo abaixo da sobrancelha inteira, `cabelo.ts:334-337`).

**A causa, com arquivo:** `extrair.ts` classifica como `traco` o preto que sobrou
**dentro da máscara da peça**. O rabo antialiasado do contorno morre contra o fundo
bege e não é preto o bastante para entrar na máscara. Chega o miolo do traço.

**Hoje não aparece na tela, e é por isso que é 🟡 e não 🟠:** o compositor desenha
o contorno do tronco por baixo da arte (`compositor.ts`, `compor`), e ele entrega
os 12 u. O achado morde no dia em que uma peça **transbordar de verdade** — ali o
contorno externo é o da arte, e a régua diz que ele é fino.

**Duas saídas foram tentadas e as duas reprovaram, o que vale registrar:**

1. **tirar o traço do tronco quando há arte** ("o PNG tem preferência") — a borda
   caiu para os 7,5 u da tabela;
2. **reconstruir a banda no PNG** com um anel de `TRACO/2` centrado na fronteira do
   núcleo colorido — subiu para **p50 15,0 u**, um quarto mais pesada que o
   contorno da cabeça. **O Doug reprovou a olho**, sem ver a medição:
   *"regrediu e muito, deixa a borda como estava"*.

A saída que ainda não foi tentada é **a montante**: pedir ao gerador um contorno
de peça mais escuro, ou alargar a máscara antes de classificar o papel. As duas
mexem na extração, que é compartilhada com o cabelo — e o cabelo está aprovado.

### G16 — nenhum gate mede o boneco COMPLETO: base + cabelo + traje
**Prova:** `MEDIDO` — 2026-08-12, ao orçar a arte do Bloco 2 dos slots. Achado
pelo Claude, desenhando os trajes. Registrado e **não consertado**, pela regra 9.

**Os dois gates de orçamento medem metades diferentes, e nenhum mede o todo:**

| gate | compõe | não compõe |
|---|---|---|
| `avatar:variantes` | base + **traje** | cabelo |
| `avatar:folha-base` | base + **cabelo** | traje |

`ORCAMENTO_COMPOSTO` (26 formas / 10 240 bytes) declara-se "base + UM item", e o
docstring justifica: *"nunca há dois cabelos num render, então somar os cinco
orçaria uma composição que não existe."* O argumento vale para dois cabelos e
**não vale para cabelo + traje**, que são dois itens no mesmo render — e sempre
foram, desde que o boneco veste o macacão da base.

**Medido, compondo os dois juntos:**

| cena | formas | bytes |
|---|---|---|
| base careca, sem traje | 19 | 6 813 |
| chanel, sem traje | 23 | 11 867 |
| base + o traje mais pesado dos 9 rascunhos | 22 | 8 235 |
| **chanel + esse mesmo traje** | **26** | **13 289** |

O boneco completo bate **exatamente** o teto de formas — zero folga —, e nenhum
gate olha para esse número. Um traje com uma forma a mais passaria nos dois
gates e estouraria na tela.

**Os bytes já estão acima do teto hoje, e isso NÃO é o achado.** É decisão A do
Doug em 2026-08-06: peça traçada de arte real tem mais pontos que paramétrica, e
o teto de bytes *"não veta arte aprovada"* — ele vira registro (`folha-base.ts:417-423`).
O que não existe é a mesma conversa sobre FORMAS, que veta.

**Consequência para quem for desenhar traje:** o orçamento real de uma peça é
**3 formas** (26 − 23 do cabelo mais pesado), não as 7 que a conta ingênua
sugere. Isso é contornável agrupando subpaths num `<path>` só — o truque que
`extensoesCabelo` já usa —, mas quem não souber vai descobrir tarde.

**O conserto, quando o Doug mandar:** medir o composto real (base + cabelo +
traje) em um dos dois gates, e decidir se o teto de 26 sobe. O número de 26 saiu
da conta do ranking com **um** item; com dois ele precisa ser remedido, não
reinterpretado.

### G14 — o e2e roda contra qualquer app que esteja na porta 3000, e reporta como falha desta
**Prova:** `MEDIDO` — 2026-08-10, run real do E.5. `playwright.config.ts:88-93`
(`reuseExistingServer: true` + `baseURL` fixo em `http://localhost:3000`). Achado
pelo Claude, executando o E.5. Registrado e **não consertado**, pela regra 9.

**Aconteceu, custou 10,5 minutos e uma causa errada.** Havia um `next dev` de
**outro projeto** do Doug escutando na 3000 —
`Documents/ChatGPT/laboratório de finais`. O Playwright viu a porta ocupada,
reusou, e rodou a suíte inteira contra o app errado. Medido no servidor vivo:

| rota | resposta | por quê |
|---|---|---|
| `/` | 200, 45 KB, `<title>Laboratório de Finais</title>` | a home do OUTRO app |
| `/login` | **404** | rota que lá não existe |
| `/dashboard` | **404** | idem — e por isso "sem redirect de auth" |

**O modo de falha é o pior possível: ele imita defeito de código.** As seis
falhas foram `page.fill: waiting for locator('input[type="email"]')` e
`toHaveURL(/\/login/) recebeu /dashboard` — que se leem, palavra por palavra,
como "a tela de login quebrou" e "o proxy de auth parou de redirecionar". Duas
frases sobre código que não foi executado nenhuma vez.

**O único teste verde foi o único que não abre navegador** (a recusa da RPC, por
`fetch` direto no Supabase). É o que separou ambiente de código, e foi por acaso —
não há nada na suíte que faça essa separação de propósito.

**O precedente já estava escrito, e não bastou.** O `playwright.config.ts` já
avisa em comentário que "quando muitos testes estouram o tempo, a causa costuma
ser a máquina" e manda reiniciar o dev server. O aviso trata do servidor CERTO
lento; este caso é o servidor ERRADO respondendo rápido, e o comentário não cobre.

**O que falta para fechar:** decisão do Doug entre três, e nenhuma é trabalho de
bloco de avatar:
1. **`reuseExistingServer: false`** — o mais simples; o Playwright sempre sobe o
   seu. Custa: falha se a porta estiver ocupada, o que é exatamente o aviso que
   faltou, e obriga a esperar o boot a cada run;
2. **porta própria** para o e2e (`3100`, por exemplo), no `baseURL` e no
   `webServer.port` — some a colisão com qualquer outro projeto;
3. **conferência de identidade no `globalSetup`** — bater em `/` e exigir a marca
   do Recruta 64 antes do primeiro teste, falhando com "há OUTRO app na 3000" em
   vez de 149 timeouts. É a única que diz a verdade na primeira linha.

**ATUALIZAÇÃO 1 — aconteceu de novo em 2026-08-11, no fim do Bloco 1 dos slots, e
desta vez com número que SEPARA ambiente de código.** A suíte inteira devolveu
**17 falhas e 11 instáveis**, a maioria em `settleAfterLogin` não achando nem
"Criação do Recruta" nem "Quartel-General". Lido como código, isso diz "o login
quebrou" — exatamente o modo de falha que este achado descreve.

O discriminante custou **1 minuto**: porta 3000 esvaziada, servidor novo, e só o
spec que era verde:

| | resultado |
|---|---|
| suíte inteira, servidor herdado | 17 falhas · **11 instáveis** |
| `e2e/auth.spec.ts` sozinho, servidor limpo | **3/3 em 18,7 s** |
| o teste que estourava 20 s (`login exibe dashboard`) | **7,0 s** |

**As 11 instáveis eram a pista, e vale escrever porque é generalizável:** teste
que passa no retry não é regressão. Regressão de código é determinística — ela
não melhora na segunda tentativa. Um run com muitos "flaky" é uma afirmação sobre
a máquina, não sobre o commit.

**O que foi eliminado antes de culpar o ambiente**, para o registro não virar
desculpa: o app medido de pé com a migration aplicada (`/login` 200 com
`<title>Recruta 64</title>`; `/dashboard`, `/aulas` e `/puzzles` em 307 para
`/login?next=…`); e **zero** referência em `src/` a qualquer coluna ou RPC do
Bloco 1 — o `useUser` lê lista explícita de colunas (`useUser.ts:53-55`), à qual
coluna nova é invisível.

**A saída nº 3 subiu de "a melhor" para "a única que teria evitado as duas
vezes".** A nº 1 e a nº 2 protegem contra o app ERRADO na porta; nenhuma das duas
protege contra o app CERTO degradado, que foi o caso agora. Um `globalSetup` que
exija marca **e** tempo de resposta cobre os dois. Continua sendo decisão do Doug.

### G15 — três specs do e2e estão quebrados no próprio teste, e escondem o resto
**Prova:** `MEDIDO` — 2026-08-11, run completo. Achado pelo Claude, executando o
Bloco 1 dos slots. Registrado e **não consertado**, pela regra 9.

Três falham por defeito do teste, não do produto — nenhuma migration ou mudança
de código as causa, e as três continuariam vermelhas num run perfeito:

| spec | falha | o que é |
|---|---|---|
| `turmas-complete.spec.ts:337` | `strict mode violation`: `text=Bots` casa o link da navbar **e** o `<h2>Bots derrotados (0)</h2>` | seletor por texto solto numa página que ganhou navbar |
| `phase9-teacher.spec.ts:86` | idem: o nome da turma casa um `<strong>` e um `<h3>` | idem |
| `bots-analysis.spec.ts:246` | espera `/\/bots\//` e recebe `http://localhost:3000/bots` | o clique no card não navegou, ou a rota mudou de forma |

**Por que isto importa mais do que parece:** com três vermelhos permanentes, o
run nunca fecha verde — e um run que nunca fecha verde deixa de ser sinal.
Ninguém consegue distinguir "quebrei alguma coisa" de "é aquilo de sempre", que
é a condição em que o G13 nasceu.

**O que falta para fechar:** trocar os dois `text=` por `getByRole` com nome
exato, e medir o que a terceira faz de verdade antes de mexer nela. Não é
trabalho de bloco de avatar.

### G13 — a suíte e2e pode morrer inteira sem nenhum gate ficar vermelho
**Prova:** `MEDIDO` — 2026-08-10, `tsconfig.json:34-40` + `package.json` (`lint`
= `eslint src/`) + `.github/workflows/ci.yml`. Achado pelo Claude, executando o
E.5. Registrado e **não consertado**, pela regra 9.

**O caso é desta sessão, e não é hipótese.** O Bloco D apagou a tela do avatar v2.
`e2e/helpers/auth-helpers.ts` continuou dirigindo aquela tela — clicando num
`<img alt="Masculino">` e esperando um "Confirmar" que nasce `disabled` —, e é o
helper por onde passa **todo** login de usuário novo (`avatar_chosen` nasce
`false`, então a conta nova sempre cai no gate). Ou seja: **6 specs mortos**, e
entre o Bloco D e o E.5 nada avisou. Nesse intervalo o repositório fechou o F.1 e
o F.2 — dois pushes para produção — com `verify:all` exit 0, 478 testes verdes e
`build` verde.

**As três coberturas param antes do `e2e/`, cada uma por um motivo diferente:**

| | escopo | por quê |
|---|---|---|
| `npm run typecheck` | `src/**` + `.next/types/**` | `tsconfig.json:34-40`, por omissão |
| `npm run lint` | `eslint src/` | por omissão |
| CI | tudo menos o e2e | **de propósito** — o e2e bate em produção |

São **16 arquivos e 6.001 linhas** sem uma linha de conferência estática. Rodar
`tsc` neles à mão funciona (feito no E.5: 0 erros, com `--lib dom.iterable`), o
que mostra que não há impedimento técnico — só ninguém roda.

⚠️ **E o remédio óbvio não cobre o buraco.** `tsc` e `eslint` no `e2e/` **não
teriam pego este caso**: `page.getByAltText("Masculino")` é código tipado
corretamente que aponta para um DOM que não existe mais. O que morre aqui morre
por fora do tipo. Uma conferência que pegaria é do gênero do
`verify:no-dup-rpc` — grep do vocabulário morto (`equip_item`, `update_avatar_base`,
`user_inventory`) sobre `e2e/`, com a ressalva que o E.4 já pagou uma vez: a
palavra sobrevive em COMENTÁRIO, e um gate que não os descarta mede a lápide em
vez do código (foi assim que `perfilCounters.test.ts` passou por três blocos).

**O que falta para fechar:** decisão do Doug sobre qual das duas — cobertura
estática (barata, pega o erro de digitação e a assinatura mudada) ou gate de
vocabulário morto (pega o caso real acima, e precisa tirar comentário antes de
procurar). Não são excludentes, e nenhuma das duas é trabalho do Bloco E.

### G12 — o seletor de cabelo oferece 6 opções e só 4 são reconhecíveis pelo desenho
**Prova:** `MEDIDO` — 2026-08-10, rasterização das 6 fichas do seletor a 2× no
chromium, comparação pixel a pixel par a par. Achado pelo Claude, executando o
E.4. Registrado e **não consertado**, pela regra 9.

O seletor do `<EditorDeAparencia>` desenha o mesmo boneco seis vezes, um por
modelo. Rasterizadas as fichas (214×300 px = 64.200 px cada) e medida a diferença
entre cada par:

| par | pixels diferentes | % da ficha |
|---|---|---|
| Careca × Moicano | 3.309 | **5,2%** |
| Coque × Moicano | 4.027 | **6,3%** |
| Careca × Coque | 4.406 | **6,9%** |
| os outros 12 pares | 10.865–20.731 | 16,9%–32,3% |

**Careca, Coque e Moicano formam um bloco de quase-duplicatas.** A massa de tinta
de cabelo é 339 px na careca (só o antialias do contorno), **2.340 no moicano** e
**3.308 no coque**, contra 10.257 do espetado, 12.923 do chanel e 18.455 do
assimétrico. O moicano difere da careca por 5,2% — está mais perto de "sem
cabelo" do que de "com cabelo".

**E as duas leem como outra coisa.** Em loiro, o coque lê como **gorro de tricô
com pompom** (a faixa cruzando a testa mais a bola no alto) e o moicano como
**coroa** (crista destacada, têmporas na cor da pele). São duas das seis peças do
slot *cabelo* ocupando a leitura do slot *chapéu*.

**Não é tamanho, é massa — a subida de 100 px para 150 px não resolveu.** Ela
resolveu o espetado, o chanel e o assimétrico; o coque e o moicano não têm o que
crescer. Duas causas somadas:

1. **A peça em si.** Coque e moicano são os dois modelos **paramétricos**
   (`MODELOS_PARAMETRICOS` em `cabelo.ts:659`), desenhados antes da rota de arte.
   Os três traçados da arte têm 3× a 8× mais tinta. Conserto = redesenho, e cai
   no Bloco 8 do doc 15.
2. **O boneco é de corpo inteiro.** Medido: a cabeça é 39,6% da altura do
   desenho, e **57% da ficha é o mesmo tronco nas seis**. O recorte de cabeça
   (`CAIXA_CABECA`, `bordasEm()`, `folha-base.ts:252`) existe medido e **está
   fora do Bloco E por decisão do Doug** — é o Bloco 6 do doc 15. Com ele, a
   mesma ficha ampliaria ~1,56×: a crista do moicano iria de 24 px para ~29 px
   dentro de um card do mesmo tamanho.

**Medido de brinde, e é o único item com cheiro de defeito:** a ponta do moicano
**encosta no teto do `viewBox`** — 3 px de tinta na linha 0 do SVG, folga zero,
contra 7 a 23 px de folga nos outros cinco. Hoje não corta nada porque o SVG não
tem `overflow: hidden` no caminho, mas é a peça que quebra primeiro se algum
recorte entrar.

**O que falta para fechar:** decisão do Doug sobre a ordem — se o recorte de
cabeça (Bloco 6) vem antes do redesenho das duas peças (Bloco 8), ou o contrário.
Nenhum dos dois é trabalho do E.

### G10 — a escada de desbloqueio do cabelo foi derivada com a curva errada, e é ~40% mais curta do que o doc diz
**Prova:** `MEDIDO` — 2026-08-10, `pg_get_functiondef('grant_xp')` no banco vivo
+ `src/lib/gamification/xp.ts:20`. Achado pelo Claude, executando o E.2.
Registrado e **não consertado**, pela regra 9.

O Bloco C do `docs/avatar/20-troca-de-pilha-plano.md:299` justifica a escada de
cabelo (`coque` 10 · `moicano` 20 · `chanel` 30) assim:

> Traduzido pela curva viva (`100 × 1,08^(n−1)`, XP consumido) [...] nível 10 ≈
> **4,2 dias** de aluno dedicado, 20 ≈ **13,8**, 30 ≈ **35**.

**A curva viva não é 1,08 — é 1,05.** `grant_xp` em produção roda
`round(100 * power(1.05, v_new_level - 1))`, e `XP_GROWTH_FACTOR = 1.05` em
`src/lib/gamification/xp.ts:20`. Os dois concordam, e é por isso que
`verify:xp-curve` passa: o gate compara banco × client, e **nenhum dos dois é o
1,08 do texto**. O 1,08 entrou por uma migration em 16/03, foi revertido por
acidente em 17/03 e nunca voltou — a história inteira está no cabeçalho do
próprio `verify-xp-curve.ts:4-13`.

Refeita a conta com a curva que roda, a ~300 XP/dia:

| nível | XP acumulado | dias (medido) | dias (no doc) |
|---|---|---|---|
| 10 (`coque`) | 1.104 | **3,7** | 4,2 |
| 20 (`moicano`) | 3.056 | **10,2** | 13,8 |
| 30 (`chanel`) | 6.236 | **20,8** | 35 |

**Não é bug de código, e nada em produção está errado.** É a derivação que está,
e ela sustentou uma decisão de produto: *"escolha consciente: o cabelo é marco
raro"*. O terceiro degrau custa **três semanas**, não cinco — o marco é
sensivelmente menos raro do que o Doug aprovou. A migration do Bloco C não
precisa mudar; o que precisa é o Doug decidir se 3,7/10,2/20,8 ainda é a escada
que ele quer, agora que são esses os números.

**O que falta para fechar:** o Doug olhar a tabela acima e dizer se a escada
fica ou muda. Se ficar, corrigir a frase do `20-troca-de-pilha-plano.md:299`, que
hoje ensina um número que não existe. Conecta com o **T3** — é a mesma doença de
número que sobrevive à decisão que o invalidou.

### G1 — Três gates prometidos por nome que não existem
**Prova:** `LIDO` — `docs/curriculo/02-plano-tecnico-trilha1-v1.md` §7

`verify:curriculo-banco` (B0), `verify:trilha1` (B2) e `verify:competencia` (B3)
são citados como travas dos blocos de execução e **não estão no `package.json`**.
O que existe é `verify:curriculo`, que confere somas do documento, não o lastro
do banco.

Não é urgente — os blocos B0–B7 têm zero linhas de código. Mas o plano promete
verificação que não existe, e quem for construir vai descobrir tarde.

### ~~G11 — `RankingEntry.avatar_base` é um campo obrigatório que a RPC nunca devolveu~~ ✅ **FECHADO em 2026-08-11**
**Prova:** `MEDIDO` — 2026-08-10, `get_ranking_with_position('rating', 3)` chamada
como `authenticated` contra produção. Achado pelo Claude, executando o E.3.

**Fechado pelo Bloco 6 (a V1 do avatar nas telas), como previsto no último
parágrafo deste achado.** `src/types/ranking.ts` perdeu `avatar_base` **e**
`avatar_config`, e ganhou as três colunas da identidade kokeshi; a migration
`20260811140000_bloco6_identidade_nas_listas.sql` fez as três RPCs devolverem
exatamente essas três. O gate novo `verify:identidade-nas-listas` chama as três de
verdade e reprova se qualquer uma voltar a devolver um dos dois campos mortos — ou
seja, o tipo e a RPC agora têm quem os compare.

`avatar_config` continua existindo em `users` e na matview, **sem nenhuma função
que o leia** — a conferência 6 do `verify:perfil-publico` passou a dizer isso
sozinha, e ele pode cair numa migration futura sem decisão nova.

---

<details>
<summary>O registro original</summary>

As chaves reais de uma entrada do ranking são sete:

```
level, title, user_id, position, public_name, metric_value, avatar_config
```

`src/types/ranking.ts:5` declara `avatar_base: string` — **não opcional** — em
`RankingEntry`. Nenhuma das três RPCs de ranking o devolve: a varredura de
`pg_get_functiondef` mostrou `avatar_base` citado por uma única leitora da matview,
`get_public_profile`, que o E.3 acabou de reescrever para não citá-lo mais.

**Não há bug em produção**, e é por isso que está aqui e não no vermelho: nada lê
`entry.avatar_base`. `RankingClient` usa nome, nível, título, métrica e posição. O
campo é uma promessa de tipo que o servidor nunca cumpriu, e TypeScript não a pega
porque o retorno da RPC entra por `as RankingData`.

`avatar_config` está no caso oposto: a RPC **devolve**, o tipo declara, e ninguém
lê — é `'{}'` em 100% dos usuários desde o Bloco B.

**Por que não foi consertado aqui:** os dois campos saem quando as três RPCs de
ranking forem reescritas para servir o avatar kokeshi, que é o D30 / Bloco 6 do doc
15 — explicitamente fora do Bloco E (doc 20, §5). Consertar só o tipo agora deixaria
o `avatar_config` de pé e obrigaria a mexer no mesmo arquivo duas vezes.
**Quem decide:** Doug.

</details>

### G9 — o baseline de cores cruas tem 234 cores de folga fantasma, em 14 arquivos
**Prova:** `MEDIDO` — 2026-08-10, `verify:design-tokens -- --update` rodado num
arquivo de rascunho e comparado chave a chave com `HEAD`. Achado pelo Claude,
executando o Bloco D. Registrado e **não consertado**, pela regra 9.

O ratchet de `scripts/verify/design/cores-cruas-baseline.json` congela um teto por
arquivo e reprova o crescimento. Medido hoje: o baseline soma **1.331** cores cruas
em 69 arquivos; o repositório tem **1.097** em 55. A diferença são **14 entradas que
não correspondem a nada**, e vêm de duas causas distintas:

- **4 arquivos deixaram de existir** — `InventoryGrid.tsx` (14), `SlotGrid.tsx` (6),
  `AvatarDisplay.tsx` (4) e `lib/avatar/frameStyles.ts` (4), apagados no Bloco D.
- **10 arquivos foram migrados para tokens e o teto nunca foi baixado** —
  `LessonMap.tsx` (29), `dashboard/page.tsx` (23), `AchievementPanel.tsx` (22),
  `RankingClient.tsx` (21), `(main)/layout.tsx` (19), `MissionPanel.tsx` (19),
  `TaskPanel.tsx` (17), `ChestPanel.tsx` (13), `StreakDisplay.tsx` (8) e
  `XPBar.tsx` (6) medem **zero** hoje e continuam com teto no baseline.

Mais três que baixaram sem ser zerados: `PerfilClient.tsx` 83→70 e
`ChestOpeningModal.tsx` 26→12 (os dois do Bloco D e do A.2) e
`GameOverModal.tsx` 30→28.

**Não afeta a força do ratchet** — o teto é por arquivo, então folga em arquivo
apagado não se gasta em outro, e arquivo novo com cor crua reprova igual. O que
está errado é o **número que o gate relata** e o que o `ESTADO.md` copia dele: o
projeto diz carregar 1.331 cores cruas de dívida e carrega 1.097.

**Por que não foi consertado aqui:** `--update` regrava o arquivo inteiro. Rodá-lo
dentro de um commit de deleção apertaria o ratchet em **10 arquivos que o Bloco D
não tocou**, escondendo trabalho de outra frente — a migração para tokens — dentro
de um diff de 2.900 linhas apagadas. O conserto é `npm run verify:design-tokens --
--update` num commit só dele, que consiga dizer no corpo o que apertou e por quê.
**Quem decide:** Doug.

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

### D13 — o produto não tem favicon, e toda aba do navegador sai sem ícone
**Prova:** `MEDIDO` — 2026-08-11, `GET http://localhost:3000/favicon.ico 404 (Not
Found)` no console do Doug, mais varredura do repositório. Achado pelo Doug,
olhando o Console ao conferir o Bloco 6. Registrado e **não consertado**, pela
regra 9.

Não existe `public/favicon.ico`, nem `src/app/icon.*`, nem `apple-icon.*` — as
três convenções que o Next.js 16 reconhece. O navegador pede o arquivo em toda
visita e leva 404.

**Não é bug de código, e acontece em produção também** — não é artefato do modo de
desenvolvimento. O efeito é cosmético: a aba do Recruta 64 sai com o ícone genérico
de página, ao lado de abas que têm marca.

**Por que não foi consertado na hora:** porque não é um arquivo, é uma **decisão de
marca**. O produto tem uma direção visual fechada ("Continuidade": navy `#0F1A2E`,
ouro `#C9A84C`, marfim, Cinzel nos títulos) e um elenco de arte próprio — o boneco
kokeshi, as 6 patentes. Qual deles vira o ícone de 32 px é escolha, e um ícone
posto às pressas vira o ícone definitivo por inércia.

**O que ele custa quando for feito:** um arquivo em `src/app/icon.png` (o Next
gera as variantes). O trabalho é o desenho, não a instalação — e a 32 px valem as
mesmas regras da folha de contato do Bloco 6: silhueta que separa, nada de detalhe
de 1 px.

**Quem decide:** Doug — e o lugar natural é o pacote de acabamento antes do
lançamento (fase 12), junto do PWA (fase 11), que **também** vai exigir ícone.

### D12 — o `useUser` ainda busca duas colunas mortas em toda tela do produto
**Prova:** `MEDIDO` — 2026-08-11, `grep` em `src/` ao fechar o Bloco 6. Achado
pelo Claude. Registrado e **não consertado**, pela regra 9.

`src/hooks/useUser.ts:54` pede 20 colunas de `public.users`, e duas delas são da
pilha v2: **`avatar_config`** e **`avatar_base`**. O tipo do hook as declara
(`useUser.ts:22-23`). **Nenhum arquivo de `src/` lê qualquer uma das duas** — a
varredura devolve só as próprias declarações.

`avatar_config` é `'{}'` em 100% dos usuários desde o Bloco B (os 69 itens foram
apagados). `avatar_base` era o caminho do PNG do boneco antigo, e `AvatarDisplay`
não existe mais desde o F.2.

**Não é bug**: são dois campos a mais num `select` que já traz 20, e o hook roda
no dashboard, no perfil e em Configurações. É dívida de limpeza, e ela ficou
**mais barata** agora: com o Bloco 6, as três RPCs de ranking pararam de citar
`avatar_config`, e a conferência 6 do `verify:perfil-publico` já registra que a
coluna pode cair da matview. Tirar as duas do hook é o passo que falta para a
coluna poder cair de `users` também.

**O que NÃO está medido:** se alguma tela lê `avatar_url`, a terceira coluna da
mesma família. **Quem decide:** Doug.

### D11 — as duas patentes do topo não têm cor, e três documentos discordam de quantas são
**Prova:** `MEDIDO` — 2026-08-11, contra produção, ao fechar o **T1**. Achado
pelo Claude. Registrado e **não consertado**, pela regra 9.

O banco tem **8 tiers** e termina em `Grão-Mestre` (6) e `Lenda` (7). A paleta
travada por `verify:paleta-patentes` — `scripts/avatar/patentes.ts` — tem **6
patentes** e termina em **`Mestre`**. Nenhum dos dois nomes do topo do banco
existe na paleta.

O `Badge` (`src/components/ui/Badge.tsx:45`) faz `PATENTES.find(...)` e cai em
`undefined` sem quebrar: a pílula sai sem o ponto de cor. **Não é bug em
produção** — ninguém passou do tier 1, e o `Aprendiz` já usa esse caminho de
propósito. É dívida que vence quando alguém chegar lá.

**Três documentos, três respostas:** o doc 15 afirma que *"o tier 7 (Lenda) saiu
da escada"* (`15:1060`) e o banco discorda; o doc 17 desenha 6 patentes; a
migration insere 8. O currículo já resolveu **metade** disso: a §3 (`01:59-62`)
registra que a T6 veste `Grão-Mestre` e a trilha 7 se chama `mestre`, e que os
dois rótulos são dados reais — para ninguém "corrigir" um pelo outro. O que
sobra sem dono é a **paleta**, que não conhece nenhum dos dois.

**O que falta para fechar:** decidir se a escada tem 7 patentes ou 8, e dar cor
às que faltarem em `scripts/avatar/patentes.ts`. É decisão de arte e de produto,
e mexe no orçamento de uniformes do Bloco 7b.

### D7 — o `/perfil` ficou com dois idiomas visuais na mesma tela
**Prova:** `MEDIDO` — 2026-08-10, `verify:design-tokens` depois do E.4. Achado
pelo Claude, executando o E.4. Registrado e **não consertado**, pela regra 9.

O E.4 pôs na tela dois blocos escritos na direção A (o palco do `<AvatarKokeshi>`
e o card "Aparência", ambos em token: `ink`, `gold`, `warm-stone`, `font-heading`)
**ao lado** dos blocos que continuam em Tailwind cru desde antes da direção
existir. O gate mede o resto: `PerfilClient.tsx` ainda tem **70 cores cruas**
(era 83 antes do bloco), quase todas `stone-*` e `amber-*`, e
`PublicProfileClient.tsx` tem 17, quase todas `zinc-*`.

Na prática, no mesmo scroll, o aluno vê um card de conquistas com gradiente âmbar
e um card de aparência com fio `ink/10` e ouro pontual. **Âmbar e ouro são
vizinhos de matiz**, então não briga — mas também não é o mesmo produto.

**Por que não foi consertado aqui:** o ratchet do `verify:design-tokens` aceita
legado e reprova crescimento, e o E.4 só baixou o número. Migrar a tela inteira
é ~500 linhas de reescrita visual que nada no Bloco E pediu, dentro de um bloco
cuja instrução era *"as três telas, e nada além"*. Também não é dívida deste
bloco: é a mesma dos 54 arquivos que o DESIGN.md nomeia como o débito a pagar.

**Um item concreto, para quem pegar:** o hook do `impeccable` apontou
`PerfilClient.tsx:461` — o link "Ver perfil público" usa `text-stone-600` com
`hover:bg-amber-50`. É pré-existente ao E.4 e está dentro do baseline.

**O que falta para fechar:** decisão do Doug sobre quando o `/perfil` entra na
fila de migração para a direção A — junto do Bloco 6 (que já reescreve rankings e
navbar) ou como commit próprio.

### D8 — a migration do F.2 diz "as 19 no default integral", e já são 18
**Prova:** `MEDIDO` — 2026-08-10, leitura só-leitura de `public.users` no F.2,
**antes** do apply. Achado pelo Claude, executando o F.2. Registrado e **não
consertado**, pela regra 9.

O cabeçalho de `20260810220000_f2_avatar_chosen_zerado.sql` e a §4 do doc 20
apoiam o `WHERE avatar_chosen = true` largo em duas medições feitas mais cedo no
mesmo dia: **8 de 19** contas com `avatar_chosen = true`, e **as 19** no default
integral (`avatar_skin = 2`, `avatar_hair IS NULL`, `avatar_hair_color = 0`).

Na releitura do F.2, o primeiro número confere e o segundo não:

```
avatar_chosen   total 19 · true 8 · false 11 · NULL 0     ← confere
default integral                18 de 19                  ← eram 19
fora do default   id 53f4fc3d…  chosen=true  skin=7  hair=espetado  cor=0
```

Uma conta tem identidade kokeshi de verdade — pele 7, cabelo espetado — e é uma
das 8 com `chosen = true`. A explicação provável é o próprio Doug conferindo a
tela do E.4 em `localhost` contra o Supabase de produção, que é o mesmo banco.

**Não muda a decisão de aplicar, e não é perda de dado.** O `UPDATE` toca só
`avatar_chosen`; `avatar_skin`, `avatar_hair` e `avatar_hair_color` ficam onde
estão. E `criar-personagem/page.tsx:42-44` pré-carrega a identidade do banco —
essa conta reentra na tela com pele 7 e espetado **já selecionados**, e sai
confirmando. O custo real é um clique a mais para uma conta.

**O que fica errado é o texto**, não o banco: dois documentos afirmam "as 19"
como fato medido, e quem os reler depois vai construir sobre a premissa vencida —
exatamente o que o `WHERE` largo pede que não aconteça. O parágrafo *"por que
`WHERE avatar_chosen = true` e não uma condição mais fina"* fica mais fraco: já
existe uma conta cujo estado de identidade **é** distinguível do default.

**Confirmado na tela, depois do apply:** a `53f4fc3d…` (`teacherdoug001`) foi
redirecionada para a criação e a tela **abriu com o espetado já marcado**. O Doug
confirmou sem reescolher; pele 7 e cabelo espetado intactos. O custo previsto —
um clique — foi o custo real.

**O conserto, se o Doug mandar:** trocar a frase nos dois lugares por "18 de 19,
mais uma conta de teste com identidade kokeshi real" — texto, não SQL. A
migration **não** muda: aplicada na janela do F.2, ela continua correta.

### D1 — O ranking de turma ignora `ranking_visible` de propósito
**Prova:** `VERSIONADO` — `20260316100000_phase10_rankings.sql:232,277-284`

O comentário da migration declara: *"Ignora ranking_visible (turma sempre vê
todos os membros)"*. O requisito da §7 do doc 13 diz que o opt-out deve valer
também no avatar. **Requisito e código discordam, e a discordância é deliberada.**

A outra metade deste achado **fechou** em 2026-08-06: a matview era legível por
`anon` e o opt-out era cortesia da camada de RPC. Revogado e vigiado
(`81a2723`). Falta decidir se o ranking de turma é exceção legítima.
**Quem decide:** Doug.

### D6 — o ovo ainda tem uma tela de pet que nunca vai abrir
**Prova:** `MEDIDO` — 2026-08-10, leitura do `hatch_egg` vivo (Bloco A) contra
`EggHatchingModal.tsx:42-46,86`. Achado pelo Claude, executando o Bloco D.
Registrado e **não consertado**, pela regra 9.

O Bloco A fez o ramo de XP ser **o único** em `hatch_egg`, e o Bloco B apagou os
pets junto com os 69 itens. Mas o cliente continua com o caminho inteiro do pet:
`HatchResult.pet` (`src/types/inventory.ts`) declara um objeto com `name`,
`rarity`, `image_url` e `description`; `useEggs.ts:133` o lê do JSON; e
`EggHatchingModal.tsx:42-46,86` pinta um card com moldura por raridade e o rótulo
de `RARITY_LABELS`. **O servidor nunca devolve `pet`** — é um `null` fixo, e o
modal cai sempre no ramo de XP.

Não é bug: nada quebra, nada mente para a criança. É tela morta numa tela viva, e
`RARITY_STYLES`/`RARITY_LABELS` sobreviveram ao Bloco D em parte por causa dela.

**Por que não foi consertado aqui:** apagar o ramo do pet muda o que o aluno vê ao
chocar um ovo, e isso é decisão de produto, não deleção. E tem um vizinho: o
`ChestOpeningModal` também segue **não migrado** para a direção A (`zinc-*`,
`amber-*` e o `animate-bounce` da linha 79, já registrado no plano 20). Os dois
modais de recompensa querem uma passada junta, com o `design-recruta64`.
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

*Atualização de 2026-08-09: o G3 fechou e a medição saiu — vermelho, 11 tabelas, três
delas alimentando concessão de XP e patente. O R1 deixou de ser suspeita.*

*Atualização 2 de 2026-08-09: o **R1 fechou** — as 11 portas fecharam, `verify:all` está
verde. A ordem passa a ser **Lote 3 → F2**, e a ressalva do 2b abaixo continua sendo a
primeira coisa a fazer quando a F2 abrir.*

**Trazido ao plano em:** 2026-08-08.
**Decisão do Doug, 2026-08-09: adotada. A F2 sobe.** A ordem passa a ser **Lote 1 → medir o
R1 → Lote 3 → F2**. O **Lote 2 fica parado** até o desenho voltar à frente, e a linha A5 da
fila do Codex espera com ele.

A ressalva acima continua valendo e é a primeira coisa a fazer quando a F2 abrir: **conferir
a dependência do 2b antes de dimensionar**. O que o painel conta são tarefas da F2 — o traje
não está nessa conta.

*Atualização 3 de 2026-08-10: **a conferência foi feita, e a F2 NÃO depende do 2b.**
Quatro medidas:*

1. *Quatro das cinco telas da F2 são **recorte de cabeça**, 32 e 40 px — o tronco nem
   aparece (`docs/avatar/15-plano-ate-pronto.md:995-1001`). Só a Companhia mostra corpo
   inteiro, e no tamanho `sm`, que é **56×70 px** (`15:959`).*
2. *Onde o tronco aparece, ele **já sai vestido**, e isso é código no repositório, não
   promessa: `src/lib/avatar/estilo/compositor.ts:255` cai em `TRAJE_BASE.roupa`, cujo
   comentário em `src/lib/avatar/palette.ts:127-135` é literalmente "é o fallback do
   5.9: uniforme ausente cai para isto, nunca para boneco pelado". A cadeia inteira
   degrada sem erro — `compositor.ts:258`, `:269`, `:296-297`.*
3. *A dependência declarada aponta **ao contrário**: o Bloco 7b vem "depois do Bloco 5"
   (`15:1043-1045`), e "a F3b (o uniforme) espera o Bloco 5" (`14:448`). O traje espera
   a tela.*
4. *A emenda de sequenciamento **já liberou** os blocos 4, 5 e 6 — que são a F2 inteira
   — a correr em paralelo (`15:247-251`). O 2b não é citado como travador de nada.*

*Nenhuma das 16 tarefas produz traje; a única que toca a palavra é a T2.9 (`14:361`), e
ela é o requisito de **não haver** traje. **A F2 é uma fase, de 16 tarefas, e a conta do
painel está certa.** Dependesse, seriam ~20: mais as quatro do 2b (`15:751-798`, zero
fechadas) e a T1.2 da F1 (`14:320`) — e a 2b.1 nem é execução, é decidir se as variantes
por DPR ainda se aplicam (`15:784-787`).*

***O que encarece a F2 é outra coisa, e está no T7**; a lacuna da migration, no **T8**.
Esta ressalva do D4 fecha aqui.*

### D5 — `npm audit` acusa 19 vulnerabilidades, e ninguém mediu quais chegam ao ar
**Prova:** `MEDIDO` — 2026-08-10, `npm audit --json` na árvore do Lote 3.

**Não vem do Lote 3.** A subida do Next 16.1.6 → 16.2.12 não criou nenhuma delas; o
número já estava lá antes e apareceu porque o `npm install` o imprime. Registrado
porque ninguém tinha olhado, não porque piorou.

São **19: 2 baixas, 5 moderadas, 11 altas, 1 crítica.** As diretas:

| Pacote | Grau | Onde vive |
|---|---|---|
| `vitest` | 🔴 crítica | devDependency — o furo exige o **Vitest UI escutando**, que este projeto não sobe |
| `sharp` | alta | devDependency — CVEs herdadas do libvips; roda nos scripts de arte, não no servidor |
| `postcss` | alta | devDependency — XSS no stringify de CSS, superfície de build |
| `next` | alta | **dependency** — mas o `via` do audit aponta para `postcss` e `sharp`, não para código do Next |
| `@anthropic-ai/claude-code` | alta | **está em `dependencies`, não em `devDependencies`** — escalada de privilégio local |

**A pergunta que falta responder é uma só: quais destas chegam ao bundle que o
navegador do aluno baixa, ou ao servidor da Vercel?** Pela leitura acima, nenhuma —
todas as diretas são ferramenta de build ou de teste. Mas isso é **leitura, não
medida**, e é exatamente o tipo de conclusão que a Regra de Evidência manda não
registrar como causa.

**O fato de embalagem que não depende de medição:** `@anthropic-ai/claude-code` está
em `dependencies` (`package.json:91`). É ferramenta de desenvolvimento e o lugar dela
é `devDependencies` — de onde está, ela viaja no `npm install --production`. Mover é
uma linha, mas é mudança de embalagem num repositório público às vésperas de receber
aluno, então **não vira trabalho sem o Doug mandar**.

**Não subiu a 🔴** porque nada aqui está medido como via até dado de aluno. Junta-se
ao D3 e à ressalva do repositório público como coisa a resolver **antes do
lançamento**, não agora.
**Achado por:** Claude, ao rodar o Lote 3, 2026-08-10.

### D9 — o primeiro load vai de 503 KB a 892 KB de JS, `next/dynamic` não aparece uma vez, e o chessground entra três vezes
**Prova:** `MEDIDO` — 2026-08-10, `npm run build` real (Next 16.2.12, Turbopack,
exit 0) e leitura de `.next/diagnostics/route-bundle-stats.json`. Achado pelo
Claude; registrado e **não consertado**.

Números do build, JS não comprimido do primeiro load, por rota:

| Rota | First-load JS |
|---|---|
| `/bots/[id]` | 892 KB |
| `/puzzles/rush` | 837 KB |
| `/aulas/[id]` | 835 KB |
| `/dashboard` | 806 KB |
| `/login` | 711 KB |
| `/_not-found` (o piso) | 503 KB |

**503 KB estão em 8 chunks que TODAS as 34 rotas carregam** — React + runtime do
Next, dos quais 222 KB e 134 KB em dois chunks só. Esse piso não é nosso e não se
mexe. O que é nosso é o que vem por cima, e ele tem três buracos medidos:

1. **O chessground entra três vezes.** Três chunks distintos de **65.194 bytes cada**
   contêm a string `chessground`: um serve `/puzzles/{rush,revanche,rating,categorias/[tema]}`,
   outro serve só `/bots/[id]`, o terceiro serve `/aulas/[id]` e `/aulas/review/[trail]`.
   Um aluno que passe por puzzle, bot e aula **baixa a mesma biblioteca três vezes**.
   A causa é que [PuzzleBoard](src/components/chess/PuzzleBoard.tsx#L5),
   [BotBoard](src/components/chess/BotBoard.tsx#L5) e
   [LessonBoard](src/components/chess/LessonBoard.tsx#L5) importam `Chessground` de
   forma estática, cada um na sua árvore, e nenhum divide um ancestral comum.
2. **O howler viaja em 11 rotas** num chunk de 36 KB — entre elas `/dashboard`,
   `/turmas/[id]` e `/configuracoes`, que não tocam som nenhum até um toast disparar.
   Chega por [soundManager.ts:1](src/lib/sounds/soundManager.ts#L1), que faz
   `import { Howl } from "howler"` no topo do módulo; quem o puxa para o dashboard
   são o `ActivityToasts` e o `TaskCompletionToast`. É a regra `bundle-conditional`.
3. **`next/dynamic` tem zero ocorrências em `src/`.** Nenhum componente pesado é
   carregado sob demanda — nem os três tabuleiros, nem o
   [compositor do avatar](src/lib/avatar/estilo/compositor.ts) (47 KB de fonte, ao
   lado de `geometria.ts` com 68 KB e `cabelo.ts` com 67 KB).

**O que está limpo:** não há nenhum `index.ts` de barril em `src/` — a regra
`bundle-barrel-imports`, que costuma ser a pior das duas, não se aplica aqui.

**Por que é 🔵 e não 🟠:** ninguém está parado, e o conserto tem decisão dentro.
Dividir o tabuleiro em `next/dynamic` troca bytes por um estado de carregamento na
tela — e isso é assunto da `design-recruta64`, não meu. O mesmo para o howler: dá
para adiar com `await import("howler")` no primeiro `play()`, ao custo de o
primeiro som sair com atraso.

**O conserto, se o Doug mandar** — em ordem de bytes por unidade de risco:
`import("howler")` preguiçoso no `soundManager.play()` (36 KB × 11 rotas, risco
quase nulo) · `next/dynamic` nos três tabuleiros (~130 KB de duplicata, precisa de
skeleton) · gate de tamanho lendo o próprio `route-bundle-stats.json`, para o número
parar de crescer sem ninguém ver.

**O que NÃO está medido:** nada disto é o tamanho comprimido que o aluno baixa de
fato — `route-bundle-stats.json` dá bytes crus. O ganho real na rede é menor, e o
ganho em tempo de parse/execução no celular é maior que a razão dos bytes sugere.
**Achado por:** Claude, varredura da `vercel-react-best-practices`, 2026-08-10.

*Atualização de 2026-08-10 — **o item 2 (howler) fechou; 1 e 3 seguem abertos.** O
`soundManager` passou a carregar o howler por `import("howler")` dentro do
`init()`, e o `import` do topo virou `import type`, que não emite código. Medido em
build novo: o chunk saiu do primeiro load das **11 rotas**, −35 KB em dez delas e
−36 KB em `/dashboard` e `/bots/[id]`. `/dashboard` foi de 806 para 770 KB;
`/bots/[id]`, de 892 para 856. Guarda em
`src/lib/sounds/__tests__/soundManager-preguicoso.test.ts` — antes do conserto ele
reprova com `expected true to be false`, porque importar o gerenciador já bastava
para avaliar a biblioteca. **O que continua igual:** o chessground nos três chunks
de 65.194 bytes, o `next/dynamic` ainda com zero ocorrências, e o piso de 503 KB.*

### D10 — o dashboard busca no cliente, em seis requisições depois da hidratação, o que o servidor já tinha na mão
**Prova:** `MEDIDO` — 2026-08-10, leitura de
[dashboard/page.tsx](src/app/(main)/dashboard/page.tsx) e dos 6 hooks que ele monta,
mais o `route-bundle-stats.json` do build. Achado pelo Claude; registrado e **não
consertado**.

O `/dashboard` renderiza no servidor e entrega HTML. Depois que o navegador hidrata,
o `<DailyPanel>` e o `<TaskPanel>` abrem **seis requisições novas**, cada uma no seu
`useEffect`, nenhuma coordenada com as outras:

| Hook | Chamada | Onde |
|---|---|---|
| `useMissions` | `rpc check_daily_missions` | [useMissions.ts:51](src/hooks/useMissions.ts#L51) |
| `useUser` | `auth.getUser()` **e depois** `users` (20 colunas) | [useUser.ts:47-57](src/hooks/useUser.ts#L47-L57) |
| `useChests` | `user_chests` | [useChests.ts:43](src/hooks/useChests.ts#L43) |
| `useEggs` | `rpc get_eggs` | [useEggs.ts:55](src/hooks/useEggs.ts#L55) |
| `useAchievements` | `rpc get_achievements` | [useAchievements.ts:35](src/hooks/useAchievements.ts#L35) |
| `useMyTasks` | `rpc check_my_tasks` | [useMyTasks.ts:27](src/hooks/useMyTasks.ts#L27) |

Duas coisas se somam aí:

**O `useUser` é uma cascata dentro de outra.** Ele espera `auth.getUser()` — que é
ida à rede, não leitura local — para só então buscar `users`. Dessas 20 colunas o
`<DailyPanel>` usa **uma**: `profile.level`, na linha 57. E o servidor já leu `level`
na linha 41 da própria página, para a `FaixaDeComando`. São duas viagens do celular
do aluno para buscar um número que já estava no HTML.

**O preço em bytes é o `@supabase` no bundle.** O chunk de **200 KB** que contém
`@supabase` está no first-load de **21 das 34 rotas**, e o `/dashboard` é uma delas —
303 KB dos 806 KB dele estão fora do piso compartilhado, e 200 desses 303 são este
chunk. Ele está ali porque os hooks acima chamam `createBrowserClient` no cliente.

**A decisão que isto pede, e é por isso que é 🔵:** os painéis do dashboard podem
virar Server Components com os dados descendo por prop (`server-serialization`), ou
podem continuar no cliente com deduplicação — a skill sugere SWR
(`client-swr-dedup`), o que significa **dependência nova**, e isso é escolha do Doug,
não minha. O caminho barato do meio, sem trocar arquitetura nem adicionar pacote: o
`<DailyPanel>` já recebe `title` por prop do servidor; receber `level` do mesmo jeito
apaga o `useUser` inteiro da tela.

**Vale notar o que já foi feito certo:** o comentário da
[linha 39](src/app/(main)/dashboard/page.tsx#L39) mostra que o XP já foi subido para
o servidor exatamente por este motivo. Este achado é o resto do mesmo caminho.

**O que NÃO está medido:** quanto as seis requisições atrasam o dashboard num 4G
real. Contei requisições e bytes de bundle, não milissegundos na tela do aluno.
**Achado por:** Claude, varredura da `vercel-react-best-practices`, 2026-08-10.

*Atualização de 2026-08-10 — **o `useUser` saiu do dashboard; as outras quatro
requisições seguem.** O `level` agora desce por prop do servidor, e com ele foram
embora as duas idas em fila do `useUser` (`auth.getUser()` + o `SELECT` de 20
colunas). Seis requisições viraram quatro. Guarda no mesmo
`dashboard-cascata.test.ts`, segundo teste.*

*Um efeito colateral que valeu por si: a trava do `<ActivityToasts>` era
`profile && !profileLoading`, e ela não estava ali por causa do perfil — era o
atraso do `useUser` segurando o toast até as missões chegarem, por acidente. Se
montasse antes, o silenciamento de primeiro mount não achava missão nenhuma para
silenciar e missão velha voltava a pipocar. A trava agora é `!loading` do
`useMissions`, que é a condição de verdade. **Não repropor trocar por `!!profile`:**
o que importa ali são as missões, não o perfil.*

*O que continua igual: o chunk de 200 KB do `@supabase` segue no primeiro load de
21 rotas — ele entra pelo `ActivityToasts`, que chama `createClient()` direto
(linha 82) para achar o `userId` do localStorage, e pelos hooks de baú, ovo,
insígnia e tarefa. Tirá-lo do `/dashboard` é a decisão grande (painéis viram Server
Component, ou entra SWR) e **continua não tomada**.*

---

## Fechados — ficam aqui como precedente

| # | Achado | Fechado em | Como |
|---|---|---|---|
| ✅ | **T1** — a régua da patente: por trilha, ou por dose fixa de 15 aulas? Travava o Bloco 7b do avatar e o B0.5 do currículo | 2026-08-11 | **fechado por decisão + medição, sem mudar marco nenhum.** Medido contra produção: `tier * 15` já *era* a fronteira de trilha (`recruta`=15, `soldado`=30) — as duas opções eram a mesma, vistas de anos diferentes. O Doug decidiu **"a patente vem de concluir uma trilha"**, e o princípio virou dado (`title_tiers.trail`, migration `20260811120000`) e trava (conferência (e) do `verify:avatar-db`, que mede o acumulado em `lessons`). Gate de 24/1 para 26/0. Nenhum dos 2 alunos promovidos mudou de patente |
| ✅ | `user_public_profiles` era MATERIALIZED VIEW legível por `anon` e `authenticated`, com `display_name` cru e `ranking_visible` dentro — o opt-out era cortesia da camada de RPC | 2026-08-06 | gate estendido (§4 de `verify:privileges`), reprovou, migration `20260806150000` aplicada, gate passou. `81a2723` |
| ✅ | Doc 13 inerte, 92 itens e zero marcados desde que nasceu | 2026-08-06 | passou a ser usado: 2 comprovados, e a linha do opt-out virou conserto medido. `260e657`, `ed393ad` |
| ✅ | `CLAUDE.md` e o currículo §13 afirmavam que o plano técnico da T1 não existia | 2026-08-06 | corrigido; `scripts/estado.ts` passou a vigiar o doc 02. `f6b97f8` |
| ✅ | **G4** — `arte:gate` sem argumento apontava para `.scratch/arte/`, pasta que o git ignora: resíduo da graduação do Bloco 4, com o caminho escrito à mão em vez de `PASTA` | 2026-08-07 | uma linha. Reproduzido (`Input file is missing: .scratch/arte/entrada.png`, exit 1) e conferido depois (`Resultado: APROVADA`, exit 0) |
| ✅ | **T5** — o espetado **não tem variante que sirva**: a `fiel` some a 56 px (p50 6,3 u, 79,8% do perímetro `< 8 u`) e a `lei` vaza a clara para fora do núcleo erodido (`conterAClara` desiste com `convergiu: false`, 18 vértices, 8 cordas; `contencaoDaClara` −9,2 u). A pré-condição 1 do Passo 7 — *"re-emitir pela `lei`"* — era **falsa**, e três documentos a repetiam | 2026-08-07 | **fechado por DECISÃO, não por conserto.** O Doug escolheu aceitar o espetado congelado no sintetizado e **tirar o Passo 7 do plano**. As duas famílias de peça traçada passam a conviver em caráter permanente e `Cabelo.linhas` vira campo definitivo. Corrigidos o backlog 14, a §3 e a §4 do runbook 19 e o docstring de `TRANSCREVEM` |
| ✅ | **G7** — a rota de arte **descartava `convergiu`**. `conterAClara` devolve `convergiu: false` quando conter a clara dobraria o laço, e `importarPeca` sempre reprovou nisso; `converter.ts` consumia só `.pts` e emitia a clara não-contida **calada**. Quem reprovava era `cabelo.test.ts` dois passos depois, com um número que não diz de onde veio | 2026-08-07 | `Convertido.claraConvergiu` passou a carregar a resposta, `arte:converter` a imprime e `arte:pecas` reprova nomeando a arte. Provado nos dois sentidos: exit 1 com o espetado na `lei`, exit 0 sem ele — e o literal voltou byte a byte ao HEAD |
| ✅ | **G3** — `verify:privileges` vigiava leitura, não escrita: a §4 conferia `SELECT` numa lista de objetos e nenhuma seção conferia `INSERT`/`UPDATE`/`DELETE` em tabela nenhuma — a cegueira exata que o **R1** precisava enxergar | 2026-08-09 | §5 nova, medindo o par que abre a porta (`GRANT` **e** policy PERMISSIVE que alcance o papel), mais RLS desligado. Provada nos dois sentidos: reprova nomeando as 11 tabelas e a via de cada uma; enche-se a allowlist e passa (`33 passed | 0 failed`). O achado que ela destravou está no R1, fechado no mesmo dia |
| ✅ | **R1** — o navegador escrevia direto em **11 das 30 tabelas** de `public` (o achado original nomeava 2). Três alimentavam concessão de recompensa por `COUNT(*)`, então XP, conquista e patente se compravam forjando o lastro. E `users` era pior que lastro: `users_update_own` não restringia coluna e `authenticated` tinha `UPDATE` nas **26 de 26** — o aluno escrevia o próprio `xp`, `puzzle_rating` e o próprio `role`, que é escalada para professor | 2026-08-09 | **três migrations, um número medido em cada uma.** `20260809120000` dropa 15 policies de escrita nas 9 tabelas que nenhum código de cliente usa (§5: 11→2). `20260809130000` cria `set_preferencias` — 4 booleanos, a assinatura É o whitelist — e faz `REVOKE INSERT, UPDATE, DELETE ON public.users` (§5: 2→1). `20260809140000` cria `set_task_active` e fecha `class_tasks` (§5: **0**). **Rejeitada** a saída de regrantar coluna a coluna: cega o gate, que é o G2 de novo. Provado como o papel `authenticated` de um aluno real, em transação revertida: `UPDATE` de `xp`, `role` e `sound_muted` todos `42501 permission denied`, e as duas RPCs funcionando — inclusive negando a tarefa alheia. `verify:all` verde, 478 testes, build limpo |
| ✅ | **T2** — o bloco Agora do `ESTADO.md`, único trecho manual de um arquivo gerado e o primeiro que o `CLAUDE.md` manda ler, errava em quatro pontos. Ganhou um quinto ao fechar o R1: seguia mandando **medir** o que já estava consertado | 2026-08-09 | os quatro fechados — a régua da patente passa a dizer **duas** versões e não três (a de 30 morreu na migration seguinte), a branch já tinha sido corrigida em `af7589e`, o doc 13 saiu da lista de decisões abertas por ter fechado por uso, e o ponteiro morto para `.scratch/estilo/BRIEFING-CABELO.md` deu lugar ao runbook 19 e ao `ESTADO-DA-ROTA.md`. Mais o quinto: a ordem agora lê **conferir o 2b → Lote 3 → F2**, e o bloco carrega a pendência de deploy que ninguém mediu. O gate `verify:estado` **não alcança** este bloco por desenho — a trava aqui é humana |
| ✅ | **2 verdes por vacuidade** achados ao fechar o R1, nas réguas que provariam o próprio conserto | 2026-08-09 | a §3 de `verify:privileges` percorria só as RPCs que a query **achou**, então RPC dropada sumia da régua calada — corrigido, e provado reprovando pelas duas funções que ainda não existiam. E o Gate 6 de `verify:turmas` exigia por nome as 7 policies de escrita que o R1 removeu: viraram **Gate 6b**, que agora exige que continuem **removidas**. Apagar da lista bastaria para passar; não bastaria para medir |
| ✅ | **R4** — a `main` no ar estava em `54d7e8a` (2026-07-31) e escrevia direto em `users` e `class_tasks`, que as migrations do R1 já haviam fechado **no mesmo banco** — porque não há Supabase separado (D3). As migrations viajaram para produção; o código que as substitui, não. **Configurações e o liga/desliga de tarefa falhavam no ar**, em silêncio, porque só o Doug estava lá | 2026-08-10 | **merge fast-forward, sem conflito possível:** `origin/main` era ancestral de `avatar/vtracer` (76 commits à frente, 0 atrás), medido antes com `git merge-base --is-ancestor`. `git merge --ff-only` levou `54d7e8a` → `8d31bca`, push disparou a Vercel. **Provado no site no ar, não em relatório:** o Doug conferiu as duas telas exatas que o achado nomeava — Configurações salva, liga/desliga de tarefa funciona. O 3º item da conferência (o perfil ainda mostra o avatar da pilha v2) **não é regressão**: `compor()` só é importado por `/dev/avatar-kokeshi`, e trocar a produção é o **T7** |
| ✅ | **T7** — a F2 estava sem preço, e o que a encarecia não era o traje: 7 das 16 tarefas nomeavam arquivos da pilha v2 enquanto o boneco novo se monta por `compor()`. Remendar e trocar eram trabalhos de tamanhos diferentes, e a escolha estava sem uma linha de estimativa | 2026-08-10 | **fechado por DECISÃO, depois de medido.** A pedido do Doug a troca foi dimensionada primeiro (6 medidas com arquivo e linha), e a medida reformulou a pergunta: `compor()` tem 0 slot de item contra os 5 da v2; 20 dos 44 arquivos não sobrevivem porque `outfit` é corpo inteiro e `head` é cabeça inteira; **mas 7 dos 8 chapéus já não renderizavam** e o ratchet media 45 itens `sem_boneco` — remendar era ressuscitar arte morta. A superfície da troca é de **2 chamadas**. Com isso o Doug decidiu **mais fundo que a pergunta: apagar toda a arte e todos os itens do boneco antigo, sem reaproveitar nada, nem os pets** — o avatar novo tem cabelo como único item vestível. As 4 decisões de produto que vieram junto (baú vira XP, ovos ficam dando XP, cabelo parte livre parte desbloqueável, desbloqueio **por nível** para não travar atrás do T1) e os 6 blocos de execução estão em **`docs/avatar/20-troca-de-pilha-plano.md`**, que é onde o progresso se marca |
| ✅ | **T8** — a T2.10 entregava `criar-personagem` com três escolhas (pele, **modelo de cabelo**, cor) e a T2.1, que era a migration da fase, criava `avatar_skin` e `avatar_hair_color` e **não criava `avatar_hair`**: zero ocorrências em `supabase/migrations/`. Quem executasse a fase na ordem escrita descobria o buraco no meio da migration | 2026-08-10 | **Bloco C** de `docs/avatar/20-troca-de-pilha-plano.md`: `20260810160000_bloco_c_identidade_do_avatar.sql` cria as três colunas, a tabela `avatar_hair_catalog` com a régua de nível e a RPC `update_avatar_identity`. Gate novo `verify:cabelo-catalogo`, **1 falha → 18 passed**, e o `verify:phase8` foi de 3 gates para 4. **Divergência do plano, deliberada:** o default de `avatar_hair` é `NULL` (careca) e não `coque`, porque a régua semeada pôs `coque` no nível 10 e o aluno nasceria vestindo o que a escada lhe nega |
| ✅ | **G2** — o gate de assets era um ratchet com 45 itens congelados: `verify:avatar-assets` só reprovava se o número **crescer**, e os 45 itens que não vestiam o boneco seguiam tolerados por desenho — o **bloqueador de lançamento nº 1** do doc 13 | 2026-08-10 | **fechado por deleção do assunto, não por conserto.** O Bloco B apagou os 69 itens, as 3 tabelas e o gate `verify:avatar-assets` junto com o `asset-baseline.json`; o Bloco D apagou os 44 arquivos de `public/items/` e o gerador do manifesto. Não há catálogo para cruzar com o disco. O que vigia agora é a **exigência de ausência** em `verify:avatar-db` (24 passed), que é o truque do Gate 6b: apagar da lista não basta para passar. Quem mede o passivo que sobrou é `verify:design-tokens` — e o dele está no **G9** |
| ✅ | **T9** — 55% dos baús viravam ovo, e os ovos chocam **em série, 72h cada**: medido em produção, **445 XP presos em 5 contas**, a 9,3 XP/dia contra a calibração de ~300. E a forma era pior que o número — esperava-se 72h pela **mesma moeda** que o baú `common` já entregava na hora, porque sem pet a espera não tem conteúdo | 2026-08-10 | **E.2** de `docs/avatar/20-troca-de-pilha-plano.md`: `20260810180000_e2_bau_paga_xp_direto.sql`. O baú paga **15/25/40/60** na hora em toda raridade; `claim_chest` perde a chamada ao criador de ovo, e `hatch_egg`/`_create_random_pet_egg` ficam **dormentes, não apagadas** — o gate agora cobra que **existam**, porque é por elas que o pet volta no Bloco 8. Gate de **11 passed / 7 failed → 18 passed / 0 failed**; produção depois: fila **0**, 16 grants de `egg_bonus` somando **445 XP** em 5 contas, e 3 baús de level-up criados pelo próprio `grant_xp`. **Medido a seco antes do apply** — a migration rodou em transação revertida com o gate inteiro dentro dela, e a previsão bateu número a número. Dois defeitos caíram nesse ensaio, os dois antes de tocar produção: `user_eggs_check1` exige `hatch_start_at NOT NULL` para `hatched` (os 11 ovos `queued` têm a coluna nula), e o gate ia reprovar por um **comentário** da própria migration citando a função dormente — a lição 3 do Bloco B repetida por um gate novo |
| ✅ | **G6** — `npm run build` vermelho no `prebuild`. **A causa registrada estava ERRADA:** não era manifesto defasado. Era `--check` comparando **bytes crus** através da fronteira LF/CRLF — o gerador escreve `\n`, o `git checkout` desta máquina (`core.autocrlf=true`) devolve `\r\n`, e a comparação reprovava **todo arquivo que o git tivesse tocado** | 2026-08-07 | quebras normalizadas antes de comparar, como `gerar-livro-aberturas.ts:116` já fazia. Provado nos dois sentidos: passa com o arquivo em CRLF, e reprova nomeando o defeito quando um caminho falso é injetado |

O precedente que importa: **todos fecharam com gate ou com prova medida, nunca
com relatório.** É o padrão a repetir.

E o precedente **novo**, do G6: *a causa que se escreve ao achar não é
necessariamente a causa.* A primeira entrada dele dizia "o manifesto está defasado" e
mandava rodar `avatar:manifest` — rodar não mudava um byte (`git diff` vazio) e o
check continuava vermelho. Só medindo as quebras de linha arquivo a arquivo a causa
apareceu. **Registrar a hipótese como causa é o erro que a Regra de Evidência existe
para impedir**, e ele aconteceu aqui, dentro do próprio arquivo de achados.
