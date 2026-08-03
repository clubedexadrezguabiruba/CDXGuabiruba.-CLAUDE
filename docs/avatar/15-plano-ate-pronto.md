# Avatar v4 — Plano do estado atual até pronto

> **Para quem abre este documento numa sessão nova.** Ele é autossuficiente:
> diz onde o projeto está (medido, não estimado), o que falta, em que ordem, e
> com que gate cada coisa fecha.
>
> **Relação com os outros documentos:**
> - `12-avatar-v4-plano-completo.md` — as 30 decisões e o **porquê** de cada uma.
>   Continua valendo. Consulte quando precisar entender a razão de algo.
> - `13-checklist-de-verificacao.md` — os ~90 itens de auditoria. É a lista de
>   conferência, não o plano.
> - `14-backlog-execucao.md` — o backlog original, com o progresso marcado
>   tarefa a tarefa. **Continue marcando lá.**
> - **Este documento (15)** é o plano de execução daqui até o fim. Onde ele
>   divergir dos anteriores, ele vence — as divergências estão todas listadas
>   na seção 4, com o motivo.
>
> Levantado em **2026-07-29** contra o banco de produção e o código real.

---

# 1. Onde estamos

## O que já está feito e em produção

| | |
|---|---|
| **Ponte dos baús** | `items.renderable` filtra o sorteio. Medido: antes, 60 aberturas davam 36 itens distintos com **25 invisíveis**; agora dão 20 distintos com **0 invisíveis** |
| **Manifesto de assets** | `public/items/` é uma lista consultável; o resolver pergunta a ela. `prebuild` quebra se o manifesto divergir do disco |
| **Gates** | `npm run verify:all` cresceu com três novos: catálogo×assets, banco do avatar, pool dos baús. Quantos são hoje: `docs/ESTADO.md` |
| **Testes unitários** | **164**. `src/lib/avatar/` tinha zero |
| **Página de teste** | `/dev/avatar-base`, trancada em professor/admin (404 para aluno) |
| **Boneco base** | Arte do usuário, vetorizada e **recolorível**: um arquivo serve aos 8 tons de pele por uma variável. 478 KB no disco, **83 KB em brotli**. O protótipo gerado em código foi apagado — ver a T0.10 do doc 14 |
| **CI** | Verde. `env-shape`, typecheck, lint, test, build, `verify:all`, ~100 s |

## O que ainda está quebrado

| fato medido | número |
|---|---|
| Itens do catálogo que **não** vestem o boneco | **45 de 77** |
| Itens sem miniatura no inventário | **30 de 77** (todos pets) |
| Telas onde o avatar aparece | **2**, nenhuma social |
| Peso de `public/items/` | **7,0 MB**, dos quais 4,0 MB são **um** pet |
| ~~Usuários com título acima de "Aprendiz"~~ | **resolvido em 2026-07-29.** Era `UPDATE` sem `UPSERT`, não a régua — ver a §3 (D-A), onde o `teacherdoug001` aparece promovido a Soldado. Esta linha dizia "0 de 17" e contradizia a §3 do próprio documento |
| Uniformes equipados em produção que não renderizam | 1 de 1 (Camiseta do Clube) |

O render de produção continua sendo o **v2**: PNG, variante por gênero,
knockout de cabeça, canvas 5:7, `body_family` `recruta_v1`.

## O achado mais grave desta fase — e a correção do diagnóstico

**O sistema de patente estava morto, e não pelo motivo que este documento
afirmava.** A versão original desta seção dizia que a causa era a régua:
`complete_lesson_step` comparava a trilha concluída contra um array de 7
trilhas, e o banco tem 2.

**Medido em 2026-07-29, é outra coisa.** `teacherdoug001` concluiu as 15 aulas da
trilha `recruta` organicamente, a última em 2026-07-29 01:10:27 pela RPC. E
`recruta` é a **posição 1** do array — a régua teria funcionado. Ele é o **único
dos 18 usuários sem linha em `user_titles`** (cadastro em 2026-02-17, anterior à
tabela). O bloco fazia `UPDATE ... WHERE user_id` sem `UPSERT`: casou zero
linhas, e "Soldado" foi calculado e descartado **sem erro**.

O "7 usuários com 46 aulas" que este documento citava também estava inflado: 22
daquelas aulas são de um usuário de e2e, cujo progresso entra direto por
service_role sem passar pela RPC.

Eram **três defeitos**, e o plano enxergava só o terceiro:

| | defeito | efeito |
|---|---|---|
| 1 | `UPDATE` sem `UPSERT` | 0 de 1 elegível real recebeu. Falha silenciosa |
| 2 | Concessão *event-only*, sem reconciliação | Quem concluiu antes da feature, quem teve o UPDATE falhar e quem tiver aula acrescentada à trilha depois nunca recebem |
| 3 | Régua de 7 contra banco de 2 | 5 títulos inalcançáveis |

Nenhum gate cobria 1 nem 2 — por isso passou 4 meses despercebido, a mesma
história da curva de XP. **Os três foram fechados no Bloco 7a**, em
`20260729120000_patente_por_marcos.sql`. Ver **D-A** na seção 3.

---

# 2. O que "pronto" significa

Sem uma definição, "polido" não fecha nunca. Proponho estas seis:

1. **Todo item que a criança pode receber aparece no boneco.** `renderable` é
   `true` para 100% do catálogo, e o gate prova.
2. **O avatar é visto.** Aparece em navbar, ranking geral, ranking de turma,
   mural e Companhia — não só nas duas telas de perfil.
3. **O boneco conta a história do aluno.** Uniforme por mérito, alcançável,
   concedido e vestido automaticamente.
4. **Lê a 56 px.** Todo item se distingue dos irmãos de slot no tamanho `sm`.
5. **Aguenta uma turma.** Ranking com 30 alunos pinta rápido num celular fraco,
   sem salto de layout.
6. **Não exclui ninguém.** 8 tons de pele, `alt` com nome, contraste,
   navegação por teclado, `prefers-reduced-motion`, e raridade sinalizada por
   mais que cor.

---

# 3. As quatro decisões — todas fechadas em 2026-07-29

## D-A — A régua da patente ✅ **DECIDIDA em 2026-07-29**

**Decisão do usuário:** a patente vem de concluir uma **trilha de nível**, e cada
nível são **15 aulas**. Os níveis usam a nomenclatura do método holandês
(Stappenmethode): **Passo 1** a **Passo 7**.

Mecanicamente é marco por contagem de aulas, com uma narrativa melhor: a criança
entende "terminei o Passo 1", não "cheguei em 15".

A régua encaixa no conteúdo que existe: o Passo 1 é a trilha `recruta` (15
aulas) e o Passo 2 é a `soldado` (30 acumuladas). O nível é o rótulo pedagógico;
a patente (Soldado, Aspirante, …) é a recompensa temática. São coisas diferentes
de propósito.

| tier | patente | nível | aulas |
|---|---|---|---|
| 0 | Aprendiz | — | 0 |
| 1 | Soldado | Passo 1 | 15 |
| 2 | Aspirante | Passo 2 | 30 |
| 3 | Capitão | Passo 3 | 45 |
| 4 | Comandante | Passo 4 | 60 |
| 5 | General | Passo 5 | 75 |
| 6 | Grão-Mestre | Passo 6 | 90 |
| 7 | Lenda | Passo 7 | 105 |

**Implementado como contagem de aulas concluídas, não como "as 30 primeiras
aulas".** São equivalentes hoje (o desbloqueio é sequencial), mas "as 30
primeiras" quebra se uma trilha for inserida no meio do currículo.

**A régua vive em `title_tiers`, não no código.** Mudar marco ou acrescentar
patente é `UPDATE`/`INSERT`; nunca editar função. Era código carregando uma
premissa sobre o conteúdo sem ter como saber que ela mudou — a mesma família da
curva de XP.

**Duas consequências que valem registro:**

1. Com 30 aulas no banco, **2 das 7 patentes são alcançáveis** (Soldado e
   Aspirante). E a régua deixou de ser teórica: o `teacherdoug001` tem 15 aulas
   concluídas e foi promovido a **Soldado** no backfill — a primeira patente
   concedida na história deste banco. O ranking já mostra.
2. Por isso a F4 desenha **2 uniformes, não 7**. As 5 patentes acima esperam
   conteúdo, e o gate falha se alguém atrelar uniforme a marco inalcançável.

O gate T0.17 foi reescrito para essa forma.

## D-B — O pipeline de vetorização ✅ **CORTADO**

O T0.6 (`raster → VTracer → encaixe na paleta → SVGO`) existia porque a arte
viria de IA geradora de imagem, em raster. Não há passo raster: eu escrevo SVG
direto.

**Decisão do usuário:** a arte antiga vai quase toda ser descartada — foi feita
para o layout antigo. A nova nasce com identidade nova, e o fluxo é **referência
visual, não conversão**:

```
você gera a imagem na IA  →  me manda no chat  →  eu olho e escrevo o SVG
   →  Chromium renderiza a 56 e 340 px  →  eu leio o PNG e critico  →  refino
```

Some o T0.6 e a §2.5 do doc 12. **Fica o SVGO** como faxina dos arquivos de
saída, que é barata e vale de qualquer jeito.

Continua valendo a saída de escape: se alguma arte ficar melhor em raster, ela
entra **como PNG**, sem conversão — o resolver já lê o manifesto e o
`public/items/` de hoje é todo PNG. O limite é que PNG serve para `pet` e
`background`, e **não** para nada que precise trocar de cor em tempo de execução
(pele, cabelo), porque custom property só alcança SVG inline.

## D-C — Ordem ✅ **DECIDIDA: F1 curta → F2 → F4**

O backlog mandava F1 (arte) → F2 (render). Vale a ordem nova.

O motivo é concreto: o bug de colisão de cor entre bonecos só apareceu quando
pus vários avatares diferentes na mesma página — coisa que a `/dev/avatar` não
faz. A F2 tem mais defeitos dessa família esperando (anchors, remoção do
knockout, recorte de cabeça para foto de perfil, canvas 4:5, 30 avatares numa
lista). **Achá-los com arte quase pronta é barato; achá-los depois dos 39
desenhos é caro**, porque cada correção obriga a recortar arte.

"F1 curta" = só o boneco base e o uniforme de Soldado, refinados até você
aprovar. O resto da arte vem na F4, sobre um sistema já provado.

O Bloco 7a já validou o princípio: foi puxado para antes da arte pelo mesmo
raciocínio, e o resultado foi a primeira patente concedida no mesmo dia.

**Ordem resultante:** 1 (paleta) → 2 (boneco base) → 4 (migration) → 5 (render)
→ 6 (alcance) → 3 (QA da arte) → 7b (uniforme) → 8 (39 desenhos) → 9 (catálogo)
→ 10 (polimento).

## D-D — Revisão ✅ **DECIDIDA: rosto a fundo + 3 pets a fundo + resto em lote**

Meu limite, dito com honestidade: estrutura, geometria, legibilidade e
consistência eu resolvo sozinho e verifico renderizando. **Carisma facial e
bicho orgânico é onde seu olho decide.**

Você revisa a fundo **o rosto do boneco base** (uma vez, no Bloco 2) e **3
pets** (no Bloco 8). Dos 3 sai o acordo de estilo — tamanho do olho em relação à
cabeça, quanto detalhe, que pose, espessura do contorno — que eu aplico nos
outros 17. Os 20 você confere de uma vez na folha de contato e aponta só o que
estiver fora.

Cerca de 3 sessões suas, em vez de ~20 rodadas de ida e volta.

<details>
<summary>Texto original da recomendação (antes de decidir)</summary>

**Recomendo:** você revisa a fundo **o rosto do boneco base** (uma vez, na F1) e
**os 20 pets** (na F4). Nos outros 32 desenhos, aceite a primeira passada e só
aponte o que estiver claramente errado.

</details>

---

# 4. Onde este plano diverge dos documentos anteriores

| # | o que muda | por quê |
|---|---|---|
| 1 | Catálogo final é **60 itens**, não 52 | O doc 12 diz os dois. 7+6+5+6+20+8+8 = 60. O "52" é anterior à revisão que levou pets de 12 para 20 |
| 2 | Orçamento de arte é **53 desenhos**, não 45 | Os 8 backgrounds antigos **destoam** — confirmado visualmente na `/dev/avatar`. Eram "verificar"; agora são certeza |
| 3 | Cor vai em **custom property**, não embutida na regra CSS | Medido: com a cor na regra, dois bonecos na mesma página colidem e o último pinta todos. Inviabilizava o D30 inteiro |
| 4 | Renderizador headless é **Chromium**, não `sharp` | O destino é o navegador; `sharp` usa librsvg, com suporte diferente. E o Playwright já é dependência |
| 5 | ~~A régua da patente volta a ser questão aberta~~ **Decidida:** trilha de nível de 15 aulas (Passo 1–7), régua em `title_tiers` | Ver D-A |
| 6 | ~~**Mãos** entram no orçamento do boneco base~~ **Revogado em 2026-07-31 pela D-E: o slot `hand` sai por completo** | A linha valia para o protótipo antigo, cujos braços terminavam em cápsula. O kokeshi não tem braços, e o tronco mede **21 × 25 px a 56 px** — não cabe emblema que distinga 6 relíquias. Orçamento de arte cai de 39 para **33** |
| 7 | A causa da patente morta **não era a régua** — era `UPDATE` sem `UPSERT` | Medido contra produção em 2026-07-29. Ver seção 1 |
| 8 | O Bloco 7 vira **7a** (concessão, feito) e **7b** (uniforme, espera o render) | 7a não depende de arte e entrega valor hoje; 7b entregaria item invisível |
| 9 | Orçamento de arte do Bloco 8 cai de 44 para **39 desenhos** | Com marcos de 15 aulas e 30 aulas no banco, 2 uniformes são alcançáveis. Os outros 5 esperam conteúdo |

---

# 5. O plano

Dez blocos. Cada um cabe numa sessão de trabalho e fecha com um gate.

> ⚠️ **EMENDA DE SEQUENCIAMENTO — 2026-08-03.** A regra original desta linha era
> *"nada começa antes de o gate anterior passar"*, e ela **custou o alcance do
> avatar**: escrita para proteger codepath, foi aplicada a roadmap, e o resultado
> medido é que a **F2 — o alcance social, que o próprio D-C chama de "onde o
> investimento inteiro passa a motivar alguém" — está 0 de 16 tarefas**, presa
> atrás de arte de cabelo da qual **não depende tecnicamente**: a base foi
> aprovada no Bloco 1d e o cabelo é dado trocável, o que é precisamente a
> propriedade que a arquitetura foi construída para ter.
>
> **A regra passa a ser:** um gate de arte trava **a arte e o flip de
> lançamento** daquela peça — nunca a construção do que vem depois. Os blocos
> **2c, 4, 5 e 6** correm em paralelo ao 2a, com o cabelo de hoje como
> provisório. O que continua travado por gate anterior é tudo que **consome
> forma**: os 33 desenhos do Bloco 8 e o reseed do 9.
>
> Isto não afrouxa gate nenhum: o Bloco 5 continua não podendo **lançar** com
> arte reprovada. Ele passa a poder **existir** enquanto ela é refeita.

---

## Bloco 1 — Paleta como módulo de verdade ✅ **FEITO em 2026-07-29**

*Sem arte. Bloqueava a F1, porque a arte consome a paleta.*

- **1.1** `src/lib/avatar/palette.ts`: pele (8), cabelo (**8**, não 5 — o D27
  pede 5 modelos × 8 cores), fundos escolhíveis (8), traje da base, e a cor por
  raridade **espelhando `RARITY_STYLES`**, senão o mesmo item sairia de uma cor
  no inventário e de outra no ranking. `prototipo/boneco.ts` e `pet.ts` agora
  consomem; antes cada um tinha a sua cópia do contorno.
- **1.2** Validador (T0.8). A régua original era "não se fundir no encaixe da
  paleta" — o encaixe morreu junto com o T0.6 (D-B), mas o validador continua
  valendo por outro motivo, mais direto: **duas cores próximas não se
  distinguem a 56 px**. Duas distâncias: 25 entre irmãos de um conjunto
  escolhível, 40 entre o contorno e qualquer preenchimento.
- **1.3** Custom properties congeladas em `PROPRIEDADES`, com **dois escopos**:
  o `<svg>` carrega o padrão da composição, cada camada redeclara no próprio
  `<g>` o que é dela. Sem isso, chapéu, relíquia e pet na mesma composição
  brigariam pelas mesmas variáveis — e é o mesmo defeito de colisão já medido
  entre bonecos. De brinde, o fallback do 5.9 sai de graça: a camada do
  uniforme redeclara `--av-roupa`, e sem uniforme o traje da base aparece
  sozinho, por cascata.
- **1.4** SVGO no pipeline, com `inlineStyles` **desligado**. Medido: com o
  default, ele apagou `.c-roupa`, `.c-cabelo`, `.c-calca` e `.c-sapato` do
  `<style>` e escreveu `style="fill:var(--av-sapato)"` no elemento. Funciona
  hoje e inviabiliza o 5.7 amanhã.
- **1.5** `svgContrato.ts`: as duas conferências que falham em silêncio no
  navegador — comentário dentro do `<style>` e custom property fora do
  contrato (`var(--av-pelle)` não é erro de sintaxe; o elemento só sai preto).
  **Pegou um caso real na primeira execução:** `pet.ts` tinha três comentários
  dentro do `<style>`.

🔒 **Gate:** `npm test` — 172 testes (eram 138). O validador reprova duas cores
injetadas a 18 de distância, e o teste do SVGO reprova cada plugin que
desmontaria o recolorir.

Duas decisões minhas que você pode vetar em uma linha: as duas últimas cores de
cabelo são **roxo e azul**, fantasia deliberada (o D27 existe para 30 alunos não
saírem iguais); e o preto do cabelo é `#3A2F2A`, não preto de verdade — contra o
contorno, um preto real apagaria a silhueta.

> **Atualizado no Bloco 1d:** o contorno era `#241610` (marrom-escuro, herdado do
> Style Anchor do v3) e passou a ser **`#000000`**. A referência do estilo kokeshi é
> preta: as cores escuras mais frequentes dela são `#010101`, `#020202` e `#000000`,
> e o traço mede luminância 3,0. A folga do cabelo preto contra o contorno **sobe**
> de 42,2 para 85,7 com a troca.

---

## Bloco 2 — F1 curta: o boneco base ⚠️ **RE-ESCOPADO em 2026-07-31**

*Aqui mora o carisma. É o único bloco que depende do seu olho.*

A lista original foi escrita contra o **protótipo antigo** — braços em cápsula,
pernas, macacão, retângulos arredondados. A troca de estilo para kokeshi
(2026-07-31) e os sub-blocos **1b, 1c e 1d** consumiram metade dela e deixaram um
item **sem objeto**. O que está abaixo é o saldo, medido contra o código de hoje.

| item original | estado | onde ficou |
|---|---|---|
| **2.1** Rosto | ✅ **feito e aprovado** | 1c: olhos e facetas. 1d: sobrancelhas arqueadas e boca. `OLHO`, `SOBRANCELHA`, `BOCA` em `geometria.ts` |
| **2.2** Mãos | ⛔ **sem objeto** | o boneco não tem braços. Vira a **D-E**, abaixo |
| **2.3** Silhueta | ✅ **feito** | 1c: linha de centro medida no line-art, `CABECA.contorno` e `TRONCO.perfil` ponto a ponto |
| **2.4** Degrau de sombra | ✅ **feito** | 1c: `FACETAS`, plano lateral, sombra do queixo e `SOMBRA_CHAO` |
| **2.5** Cabelo | ⬜ **é o trabalho** | vira o **2a** |
| **2.6** Uniforme de Soldado | ⬜ **é o trabalho, e mudou de natureza** | vira o **2b** |
| **2.7** Você critica | ✅ **aconteceu três vezes** | reprovou o 1b, o 1c e a primeira volta do 1d |

O que sobra, então, são **duas peças de arte e uma decisão**. E as duas peças
carregam, cada uma, uma pendência declarada por escrito no código — elas entram
como o primeiro item de cada uma, não como nota de rodapé, porque as duas
**precedem** o desenho.

---

### D-E — o slot `hand` ✅ **DECIDIDA em 2026-07-31: REMOVER por completo**

**O fato que abriu a questão:** o slot `hand` existe no banco (`CHECK` em
`items.slot` e `user_equipped.slot`), tem **8 itens semeados** — não 6; os 6 são o
alvo do Bloco 9 — e o v4 lhe reserva 6 desenhos no Bloco 8. No boneco kokeshi
**não há braço, mão nem antebraço**, e nunca houve intenção de haver: a proporção
1:2 e a ausência de membros são o estilo, não uma etapa faltando.

Havia três saídas. A recomendação inicial foi a **B** (virar `emblema` pintado no
tronco), e **a medição a derrubou** — o que é o motivo de a condição ter sido
escrita como medida, e não como gosto.

**A medição.** Do `pathTronco()` canônico, com o canvas de 700 unidades:

| canvas | figura | tronco |
|---|---|---|
| **56 px** | 47,1 px | **21,0 × 25,1 px** |
| 96 px | 80,7 px | 35,9 × 43,1 px |
| 340 px | 285,9 px | 127,3 × 152,5 px |

Um emblema que **não** compita com o uniforme cabe numa fração de 21 × 25 —
ordem de 7 × 7 px. E o `TRACO` é 12 unidades, o que a 56 px dá **0,96 px**: o
contorno do próprio sistema já é uma linha de um pixel ali. Um emblema com
detalhe interno — peão, livro, cetro, orbe — precisaria de traço **mais fino que
o traço do sistema**, dentro de 7 px, e ainda assim distinguir 6 relíquias em 2
famílias × 3 tiers. É exatamente o que a **definição 4 de pronto** exige, e não é
alcançável: a 7 px os seis viram a mesma mancha escura.

O tronco também não está vazio a 56 px. Ele já carrega a cor do uniforme, a
sombra do queixo (14,5 unidades ≈ 1,2 px), o plano lateral e a decoração vetorial
da patente. O emblema seria o **quinto** elemento em 21 × 25 px.

A **C** (objeto flutuante ao lado) caiu antes, por outro motivo: é literalmente a
mesma âncora do pet (doc 01, §"anchor profiles de hand e pet"), e o pet tem **20**
itens contra 6. Dois objetos soltos ao lado de uma figura de duas cabeças é
entulho que estragaria também os 20 desenhos do pet.

**E o mérito não cai para um canal só.** Sobram dois: o **uniforme** e a
**moldura**. A moldura é `frame_ui` — CSS na camada z=10, **fora do SVG** (§2.3).
Ela não gasta superfície nenhuma do boneco e lê a 56 px porque é a borda do cartão
inteiro, não uma marca dentro dele. O doc 10 já roteia conquistas para frames, e a
lista do pool de baú do 9.3 já a deixa de fora. É o lugar do papel que a relíquia
ia ocupar, e custa **zero desenho novo**.

**O que a remoção alcança**, medido contra produção em 2026-07-31:

| | |
|---|---|
| `items` com `slot='hand'` | **8** (ids 17–24) |
| conquistas com `reward_item_id` → item de `hand` | **0** — *o único risco apontado não existe* |
| linhas em `user_inventory` | **12**, em 7 usuários (contas de teste) |
| equipados agora (`user_equipped`) | **2** |
| já sorteados em baú (`user_chests.item_id`) | **11** |

As 12 + 11 + 2 linhas são FK para `items(id)`: a migration de remoção tem de
desfazê-las antes de apagar as 8 linhas de `items`, e é por isso que **isto é um
bloco próprio** — não entra junto com o cabelo nem com o uniforme.

**Efeito colateral bom:** com a remoção, o `CHECK` de slot do **Bloco 4 volta a
ser puramente aditivo** (`+= hair, back`, menos `hand` numa migration à parte), o
que era o único ponto em que a B travava aquele bloco.

---

### 2a — Cabelo: 5 modelos × 8 cores

- **2a.0 — A sobrancelha** ✅ **DECIDIDA em 2026-07-31: fica PRETA.**

  O `palette.ts` afirmava que `--av-cabelo` era lido "também pela sobrancelha, que
  mora na base", e **justificava o escopo da propriedade com isso**. A arte nunca
  fez: a sobrancelha sai em `.kk-risco` → `stroke: var(--av-linha)`, a cor do
  contorno. O defeito não era a prosa — era o docstring descrever uma intenção
  como se fosse o código, na mesma família do `UPDATE` sem `UPSERT`.

  **E a intenção estava errada.** Distância de cada cor de cabelo contra o pior
  dos 8 tons de pele, na régua de `MIN_CONTORNO` (40):

  | cabelo | cru | escurecido .82 | escurecido .60 |
  |---|---|---|---|
  | preto `#3A2F2A` | 51 | 63 | 79 |
  | **castanho** | **9** | **18** | 47 |
  | **castanho claro** | **20** | **19** | **11** |
  | **loiro** | **33** | **25** | **26** |
  | **ruivo** | **29** | **21** | **13** |
  | grisalho | 42 | 66 | 75 |
  | roxo | 108 | 94 | 71 |
  | azul | 149 | 125 | 98 |
  | **`#000000`, o de hoje** | **127** | — | — |

  **Cinco das oito reprovam**, e são as quatro que a maioria das crianças escolhe.
  É a regra 10 do §7b por outro ângulo: cabelo castanho e pele castanha moram no
  mesmo matiz. Escurecer não salva — a .60 o castanho claro cai para 11, pior que
  o cru. E a escala confirma: a sobrancelha mede **3,7 × 0,66 px a 56 px**, menos
  de um pixel de espessura, onde o que decide não é a cor e sim haver contraste
  para o pixel existir. Em estilo chibi com contorno preto grosso, a sobrancelha é
  parte do **traço do rosto**, não pelo — tingir é convenção de estilo realista,
  que tem volume e sombreamento de pele para sustentar contraste baixo.

  Preso por `estilo/__tests__/rosto-cor.test.ts`, que **reprova 3 de 4 quando a
  sobrancelha é tingida** (verificado invertendo o compositor). O escopo `avatar`
  de `--av-cabelo` fica, com o motivo verdadeiro: há um cabelo por avatar, então
  não existe a colisão entre camadas que o escopo `camada` resolveria.

- **2a.1 / 2a.2 / 2a.3** ⚠️ **CÓDIGO FEITO em 2026-08-01; ARTE REPROVADA em
  2026-08-03** — o gate (a) passou e o Doug não. Ver **2a.4**, abaixo, que é o
  saldo aberto. O que segue neste item continua valendo: é a arquitetura, e ela
  não foi contestada.

  Feitos num bloco só — os três se provam no mesmo artefato, e separá-los teria
  significado três rodadas de render para julgar o mesmo desenho.
  `src/lib/avatar/estilo/cabelo.ts` (novo),
  `EstadoAvatar.modeloCabelo`, três camadas no compositor, `cabelo.test.ts` e o
  `avatar:folha-base` estendido.

  **O ORÇAMENTO FOI PARTIDO EM DOIS, e a partição corrigiu o que ele media.** Ele
  era um teto só (20 formas / 7 680 bytes) sobre a saída de `compor()`, com um
  racional escrito sobre o **ranking** — 30 bonecos juntos a 56 px. Só que ninguém
  no ranking é careca: todo avatar carrega um cabelo. O teto media a base e o texto
  falava do composto, e a "folga" de 262 bytes nunca foi orçamento de nada — era o
  resto da conta do Bloco 1d.

  | | teto | medido |
  |---|---|---|
  | **base careca** — regressão, não folga | 19 formas · 7 418 bytes | 19 · 7 418 |
  | **composto** — base + 1 cabelo | 26 formas · 10 240 bytes | pior: `cacheado`, 22 · 8 995 |

  A base virou teto de **regressão**: ela não pode crescer nem um byte, porque
  crescer significa alguém ter achado espaço nela para pagar uma camada que não é
  dela. E o composto é `base + UM` cabelo porque nunca há dois num render — somar
  os cinco orçaria uma composição que não existe.

  ⚠️ **OS DOIS TETOS NÃO TÊM A MESMA AUTORIDADE — 2026-08-03.** O da **base** é
  regressão medida e continua absoluto: crescer é sintoma de defeito, não de
  ambição. O do **composto** (26 formas · 10 240 bytes) é um número **escolhido**,
  não medido, e ele **não pode vetar arte que o Doug aprovou**. Se um cabelo
  medido a partir da arte estourar o teto, quem decide é o **benchmark do 10.6**
  — 30 avatares num celular fraco, tempo até pintar — e não o número. Byte bruto
  não é custo: SVG comprime, e o que pesa numa lista é nó de DOM, path e tempo de
  composição. Sacrificar mecha para economizar 2 KB antes de existir a medição é
  otimizar contra uma suposição, e o projeto já pagou por decisão assim.

  **Como o cabelo não declara a lateral do crânio.** Cada ponto de franja é
  `{ t, y }`, com `t` **fração da largura da cabeça naquela altura**, lida de
  `bordasEm(y)`. As pontas têm `t` fora de [0, 1] de propósito: elas terminam fora
  da silhueta e o `clipPath` da cabeça é quem corta. Não existe segunda descrição
  do crânio para divergir da primeira, que é a regra do `geometria.ts` um slot
  acima.

  **Estes números são desenhados, não medidos, e isso está escrito no arquivo.** A
  referência é um boneco careca — não há régua de onde extrair a forma de cinco
  cabelos. No lugar da medição entraram quatro amarras que reprovam:

  1. **folga do rosto ≥ 24 unidades** sobre cada sobrancelha (1,9 px a 56). Foi ela
     que pegou o defeito não óbvio do bloco: **o giro aperta o lado direito**. A
     sobrancelha direita é 3 unidades mais alta, e a primeira tabela do `curto`
     dava 25,5 à esquerda e **8,3** à direita — um cabelo simétrico em `t` sai
     assimétrico em folga. Três dos cinco reprovaram na primeira medição;
  2. **ancoragem ≥ `SANGRIA`** de toda extensão dentro da cabeça — o análogo, um
     slot acima, do gate (d) que o `tipos.ts:65` promete aos trajes. Sem ela um
     coque pode ficar tangente ao crânio e abrir fresta de fundo;
  3. **pontas da franja fora da silhueta**;
  4. **a base careca não paga nada** pelo slot: sem modelo, `compor()` não emite
     camada, nem as três regras de CSS, nem `--av-cabelo`/`--av-cabelo-s`, e o SVG
     sai byte a byte igual ao aprovado no 1d.

  As três primeiras foram verificadas **invertendo o dado** (franja 40 u mais
  baixa → folga −13,3; coque subido 40 u → ancoragem 0,0; ponta em `t` 0,1 → dentro
  da silhueta). Teste que não reprova quando devia é relatório.

  **O `--av-cabelo` estava morto, e ninguém tinha como saber.** O `compor()` nunca
  lia `estado.cabelo` e nunca emitia as duas propriedades, embora as duas estejam
  congeladas em `PROPRIEDADES.avatar` desde o Bloco 1. O `conferirSvg` não pegava:
  ele reprova propriedade **a mais**, não **a menos**. É a mesma família do
  docstring da sobrancelha que o 2a.0 consertou.

  **Duas correções de desenho que só apareceram renderizando** (regra 9 da §7):

  - o **moicano** saiu como pluma de capacete, e a causa não era de gosto: no
    espaço `{t, y}`, `t` constante é um **funil que abre para baixo**, porque a
    largura da cabeça vai de 206 unidades em y 54 a 362 em y 126. Ele deixou de ter
    touca e virou **só extensão**, em coordenada absoluta — e ficou o mais barato
    dos cinco (+1 forma, +715 bytes). A topologia `faixa`, que existia só para ele,
    saiu do arquivo junto com o defeito;
  - o **coque** era um ovo deitado de 124 × 104 e, com o crânio comendo a metade de
    baixo, o que sobrava na tela era uma laje de topo reto — boina, não coque. Uma
    circunferência resolve: calota de círculo é redonda em qualquer altura.

  **O especular passou a ser desenhado DEPOIS do cabelo.** A mancha mora em
  (139,9 · 93,4), acima da franja dos cinco: com cabelo, ela cai inteira sobre o
  cabelo, que é o certo e é de graça — ela é `#FFFFFF` com opacidade, não uma cor.
  Desenhada antes, seria um brilho de pele sob um cabelo opaco, e a cabeça perderia
  o ponto de luz justamente nos avatares que têm cabelo, que são todos. A base
  careca não mudou um byte com a troca.

- **2a.4 — A ARTE FOI REPROVADA em 2026-08-03, e o gate não tinha como pegar.**

  Veredito do Doug, olhando a `folha-base`: *"está tudo muito quadrado, sem toque
  humano"*. **Quatro causas, todas visíveis no código** — não são impressão:

  1. **a franja do `curto` é uma reta.** Quatro pontos, `y` = 134, 124, 123, 130 de
     `t` 0,2 a 0,88 ([cabelo.ts:225‑234](../../src/lib/avatar/estilo/cabelo.ts#L225-L234)):
     onze unidades de variação em toda a largura da cabeça, ou **0,9 px a 56**;
  2. **nenhum dos cinco tem mecha, ponta afinada ou recorte interno.** Um cabelo é
     *uma* borda mais o retângulo de fechamento fora da silhueta. Não há um único
     path de detalhe interno no arquivo;
  3. **os cinco moram na mesma faixa de altura** — `y` entre 100 e 140, espremidos
     entre a coroa e o `FOLGA_ROSTO`. São cinco variações de uma reta na mesma faixa
     de 40 unidades, e é a explicação de o par apertado ter dado **5,18% contra piso
     de 5%**: a margem de 0,18 ponto é sintoma, não sorte;
  4. **a sombra é a mesma forma subida 22 unidades** (`DEGRAU`): faixa de espessura
     constante, paralela em todo o percurso. Cabelo desenhado tem sombra que segue a
     mecha.

  **A raiz está escrita no próprio arquivo, linha 28:** *"estes números são
  desenhados, não medidos"*. As três amarras que substituem a régua impedem
  **defeito** — franja no rosto, extensão flutuando, orçamento estourado. Nenhuma
  exige **forma**, e nenhuma poderia: não há régua de beleza.

  **A ferramenta que existe para isto nunca rodou nesta peça.** O
  `scripts/avatar/estilo/variantes.ts` abre dizendo, sobre este bloco, que *"os cinco
  cabelos foram desenhados em **uma** versão cada, e depois consertados — o primeiro
  resultado plausível, refinado, que não é a mesma coisa que uma escolha"*. Os 5
  cabelos são de **2026-08-01 07:14** (`63a13ba`); a skill `avatar-desenho` e o
  `avatar:variantes` que a forçam, de **2026-08-03 08:03** (`d6caed8`). A trava
  nasceu dois dias depois da peça que a motivou.

  **AS TRÊS DECISÕES FORAM TOMADAS — 2026-08-03** (briefing em
  `.scratch/estilo/BRIEFING-CABELO.md`):

  1. **Caminho:** arte gerada pelo Doug e convertida por régua. Ele gera à mão no
     AI Studio (grátis; a API foi tentada e o Gemini responde `limit: 0` no plano
     livre), e `.scratch/estilo/franja.ts` mede. **Desenho em código está
     descartado por evidência, não por gosto** — é a causa raiz deste próprio item.
  2. **Escopo da primeira rodada: DOIS modelos extremos, não um nem os cinco.**
     `curto` prova franja, sombra variável e leitura a 56 px; `coque` (ou `trança`)
     prova extensão externa, ancoragem e o plano de trás. Um modelo só não exercita
     `Extensao`, e os cinco de uma vez repetem exatamente o erro de 2026-08-01 —
     cinco peças autoradas antes de o caminho estar provado. Os outros três só
     depois de o piloto fechar.
  3. **"Toque humano" vira item de gate com o olho do Doug**, não número — é o
     item **(f)** do gate deste bloco, abaixo.

  **O que está bloqueando é uma coisa só, e é técnica:** a régua produz `pontos`,
  e `pontos` é clipado pelo `clipPath` do crânio — toda a expansão medida (7,6 a
  13,3% lateral, 12,2 a 20,1% vertical) vive FORA da silhueta e é descartada. Por
  isso as três variantes medidas dão **2,41 a 2,99%** contra o piso de 5%: o gate
  está comparando três franjas dentro da mesma silhueta. A extração da massa
  externa como `Extensao.forma` já está escrita em `franja.ts` (`lobos()`, por
  componente conexa); falta fechar o laço.

  **O piso de 5% não se discute antes disso.** Se, com a massa externa entrando,
  um par que o olho do Doug distingue ainda reprovar, aí sim o piso é recalibrado
  — contra os pares que ele já julgou, que é dado rotulado. Baixar o piso agora,
  com a causa técnica conhecida e por fechar, seria a justificativa circular que o
  gate (a) já recusou uma vez.

---

### 2b — Uniforme de Soldado

- **2b.0 — O arremate do tronco, ANTES de assar qualquer traje.** O fundo do
  tronco fecha hoje com raio de canto **80** onde a referência mede **40 a 60**,
  e a causa está declarada em
  [geometria.ts:879‑905](../../src/lib/avatar/estilo/geometria.ts#L879-L905): o
  modelo é uma elipse de 103 × 18,7, que tem raio de curvatura **3,4** na ponta
  lateral — um quarto de traço. A amostra única em `t = 0,7` só escolheu o menos
  ruim entre os que não invertem a curvatura; o modelo continua errado desde o 1b.

  O próprio docstring diz que fechar isso "é trabalho de um bloco que tenha o
  tronco no escopo, não deste". **Este é esse bloco** — e a ordem importa: os 14
  trajes clipam em `pathTronco()`, então assar o Soldado contra uma base errada
  significa reassar os 14 depois. O conserto é remedir `TRONCO.ryArremate` contra
  a base extraída por coluna, não mexer na tabela do perfil, que é geometria
  aprovada.

- **2b.1 — O `avatar:garment` de hoje NÃO serve para este boneco, e isso não é
  ajuste.** O `mascara-base.ts` deriva as três máscaras do **macacão da base
  antiga** (`public/items/base/avatar-base-neutro.svg`, seu padrão na linha 322),
  e os marcos que ele mede são `topoTraje`, `tornozelo`, `yGola` e `yBota` — ombro,
  tornozelo, gola e bota. O kokeshi não tem tornozelo, bota, mão, orelha nem
  macacão; a `peleFrente` recorta "cabeça, orelhas, pescoço e mãos", e três dessas
  quatro não existem. Rodá-lo mediria contra o nada e ficaria **verde por
  vacuidade**, que é o defeito que este projeto já pagou duas vezes.

  A substituição **já está escrita e já tem trava**: a `interface Traje`
  ([tipos.ts:31](../../src/lib/avatar/estilo/tipos.ts#L31)) declara só `tinta`,
  `decoracao` e `extensoes`, e o `tintaTronco()` do compositor já pinta os três
  casos dentro do `clipPath` do tronco. Não há máscara, não há `registro()`, não
  há dilatação. **Nenhum traje existe ainda** — o Soldado é o primeiro, e é o que
  prova o caminho.

  O que fica **em aberto** e este bloco decide medindo: se as **5 variantes por
  DPR** e os **gates de alfa** do doc 16 ainda se aplicam a um PNG clipado por
  `pathTronco()`, ou se com o clip do sistema a arte vira `decoracao` vetorial e
  o PNG deixa de ser necessário para uma peça chapada.

- **2b.2** O Soldado como **cor + decoração vetorial** primeiro (é o estado que o
  `Traje.tinta.cor` existe para servir), e só então a pergunta de se ele precisa
  de PNG. A cor sai da tabela travada por `verify:paleta-patentes`, não de escolha
  nova.

- **2b.3** Marcar no **doc 16** que ele descreve o pipeline da base antiga. Ele é
  o runbook que o §"Referências" do `CLAUDE.md` manda ler antes de gerar arte de
  uniforme, e hoje manda para o caminho errado. As §2.1 (tabela de matiz), §2.2
  (as cinco armadilhas) e §7.0 continuam valendo — são sobre a **arte de origem** e
  sobre o **conversor**, não sobre as máscaras.

---

🔒 **Gate do Bloco 2:**

- **(a)** ✅ **A MEDIÇÃO passou em 2026-08-01** — e só ela; o desenho reprovou em
  2026-08-03, ver **2a.4**. Os 5 se distinguem **a 56 px**, e agora isso é
  um número e não uma impressão: o `avatar:folha-base` renderiza cada modelo a
  40 × 56, conta os pixels que diferem em mais de 24 níveis em algum canal, e
  reprova abaixo de **5%** (112 px de 2 240 — um bloco de ~10 × 11 na miniatura).

  **São dois pisos, porque são duas perguntas.** Contra a **careca** o piso é 2%, e
  ele não mede distinção de catálogo: careca não é escolha de aluno (D5), então
  exigir 5% entre "moicano" e "careca" cobraria distinção entre duas opções que
  nunca disputam a mesma escolha. O que aquela coluna testa é **o cabelo aparece?**
  — o gate contra a camada que existe no código, passa em todo teste de unidade e
  some na tela.

  Medido: o par de catálogo mais parecido é `Corte curto × Trança`, **5,18%**. A
  primeira rodada deu **3,66%**, e a resposta certa foi engrossar a trança até ela
  ser outra silhueta, não baixar o piso até ela passar — calibrar o gate pelo
  desenho que ele deveria julgar é justificativa circular.
- **(b)** ✅ **feito no 2a.0** — a sobrancelha faz o que o `palette.ts` diz que
  ela faz, e é um teste que confere, não um docstring;
- **(c)** o arremate do tronco mede **40 a 60** de raio de canto, sem inversão de
  curvatura em ponto nenhum da base — a mesma régua de `getPointAtLength` que
  achou o bico de 10,7;
- **(d)** o Soldado compõe sobre a base, e a `extensao` (se houver) sobrepõe o
  tronco em **≥ `SANGRIA`** — o gate que o `tipos.ts:65` já promete a este bloco;
- **(e)** `avatar:pose`, `avatar:animacao`, `avatar:folha-base`, `verify:all`,
  `build` e a suíte continuam verdes.
- **(f)** ✅ **ACRESCENTADO em 2026-08-03 — A APROVAÇÃO ARTÍSTICA DO DOUG.**

  Os itens (a)–(e) medem distinção, cor, geometria e verde de suíte, e **os cinco
  passaram num cabelo que o Doug reprovou de olho**. A §"F1 curta" e a D-D sempre
  exigiram essa aprovação; o gate nunca a listou, e é assim que uma peça reprovada
  atravessa um bloco "verde". **Trabalho verde e trabalho completo não são a mesma
  coisa** — o (f) é onde a diferença passa a estar escrita.

  **O que ele exige, e é registro e não sentimento:** uma linha no doc 14, com o
  **selo da folha** que o Doug abriu (os 6 caracteres que `avatar:variantes`
  desenha no canto e não imprime no terminal), a **data**, e o **veredito em uma
  frase**. Sem os três, o bloco não fecha — mesmo com (a)–(e) verdes.

  **O que ele deliberadamente NÃO é:** uma métrica. Não há régua de beleza, e
  tentar escrever uma foi o que produziu cinco cabelos matematicamente válidos e
  artisticamente quadrados. **O gate julga número; o Doug julga arte** — a regra 10
  da skill `avatar-desenho`, agora com efeito no plano.

**Fora do gate, e agora sem sucessor:** a régua antiga (*"o `hand` ancora na
mão"*) some junto com o slot, pela **D-E**.

---

### Bloco 2c — a remoção do slot `hand`

*Bloco próprio, e não pedaço do 2a nem do 2b: ele mexe em banco de produção com
FK a desfazer, e misturar isso com arte é como se perde a chance de rodar o gate
certo.*

- **2c.1 Migration.** Desfazer as FK antes de apagar as linhas — `user_equipped`
  (2), `user_inventory` (12) e `user_chests.item_id` (11) —, depois as 8 linhas de
  `items`, depois o `CHECK` de `items.slot` e de `user_equipped.slot`, e a lista
  dentro do `unequip_slot`/`equip` (que é a segunda cópia do `CHECK`, e o gate já
  confere que as duas batem).
- **2c.2 Código.** `ItemSlot`, `ALL_SLOTS`, `Z_INDEX`, `renderModes`,
  `slotDefinitions`, `templateGuides`, `templateMasks`, `bodyFamilies`,
  `renderability`, `resolvedAvatar`, `AvatarDisplay`, `assetManifest` e os rótulos
  de `constants/items.ts`. É deleção, então **`grep` prova o fim** — ao contrário
  da adição que a B exigiria.
- **2c.3 Assets.** Os 8 PNG de `public/items/hand/`, e regerar o manifesto.

🔒 **Gate:** `grep -r "hand" src/ supabase/` não devolve nenhum slot ·
`verify:phase8` verde (incl. `avatar-db`, que compara `CHECK` com a lista da RPC)
· `verify:all` · `build` · a suíte.

---

## Bloco 3 — Ferramentas de QA da arte

*Sem arte nova. Fica pronto antes dos 44 desenhos restantes, não depois.*

- **3.1** Folha de contato (T0.9): renderiza **cada item sobre a base**, nos 4
  tamanhos, numa imagem só. Com 53 desenhos, revisar um a um é inviável.
- **3.2** Teste unitário de ordem de camadas e z-index (T0.20).
- **3.3** A `/dev/avatar-base` ganha um modo **"turma"**: 12 bonecos com
  configurações diferentes lado a lado. Foi exatamente o caso que revelou a
  colisão de cor, e ele precisa ser permanente, não um teste de uma vez.
- **3.4** Terceira conferência em `svgContrato.ts`: **animação que esconde**.
  As duas do Bloco 1 pegam defeito de cor; esta pega defeito de movimento, e é
  a mesma classe de falha — renderiza, não avisa, e só se descobre olhando.
  Duas regras:
  - `@keyframes` que mexa em `opacity`, `visibility` ou `display` exige que a
    regra que aplica aquela animação declare a mesma propriedade no estado
    base. É a regra 6 da seção 7, virada em código: sem `opacity: 0` fora do
    keyframe, a pálpebra cobre o olho onde a animação não roda.
  - documento com `@keyframes` exige um `@media (prefers-reduced-motion:
    reduce)` que desligue a animação. O item **10.4** já exige isso; hoje nada
    confere.

  **Não** vale a regra ampla "toda propriedade do keyframe declarada no estado
  base". Ela reprovaria o pet **correto**: `.flutua` não declara `transform`, e
  está certo, porque `transform: none` já é a pose de descanso. Só
  `opacity`/`visibility`/`display` têm estado desligado diferente do inicial.

  Hoje a disciplina existe em prosa (comentário do `pet.ts`) e num único
  assert à mão — `scripts/avatar/__tests__/otimizar-svg.test.ts` testa
  `peaozinho()` com a classe `.palpebra` escrita dentro do teste. É regressão
  contra o SVGO, não contrato: os **39 desenhos do Bloco 8** e as **4
  expressões do 10.1** não herdariam nada. Disciplina manual documentada em
  comentário é exatamente o que falhou no `UPDATE` sem `UPSERT` e na curva de
  XP.

🔒 **Gate:** a folha de contato gera; o modo turma mostra 12 bonecos distintos;
`conferirSvg` reprova um SVG com pálpebra sem estado base e outro com
`@keyframes` sem `prefers-reduced-motion`, e continua aprovando `peaozinho()`.

---

## Bloco 4 — F2 banco: a migration

- **4.1** Migration `avatar_v4`, **aditiva** — e ela só volta a ser puramente
  aditiva porque a **D-E** removeu o `hand` numa migration à parte (**2c**), que
  roda antes:
  - `items.slot` e `user_equipped.slot` CHECK **+= `hair`, `back`**
  - `user_inventory.source` CHECK **+= `title`**
  - `users.avatar_skin` (8 tons, default `medio`)
  - `users.avatar_hair`, `avatar_hair_color` — **sem `avatar_bg_color`**: pela
    emenda à D27, só pele e cabelo recolorem, e o fundo passou a ter cor fixa
  - `update_avatar_identity` substitui `update_avatar_base`
  - **recriar `user_public_profiles`** com os campos novos — hoje ela tem
    `avatar_base` e nenhum dos novos, e é dela que o ranking lê
  - `users.avatar_base` **deprecada, não dropada**
- **4.2** Migração suave: os 17 usuários existentes recebem tom default,
  mantêm `avatar_chosen = true`, sem re-onboarding forçado.

  ✅ **A D5 FECHA AQUI — 2026-08-03.** A T1.1 do doc 14 deixou em aberto: *"ou a
  base ganha cabelo assado, ou a D5 muda e careca passa a ser estado de falha
  aceito"*. **É a terceira saída, e ela não custa arte nenhuma:**
  `users.avatar_hair` nasce com **default `'curto'`** e `NOT NULL`. Careca deixa
  de ser alcançável por aluno — que é exatamente o que a D5 pede ("ninguém aparece
  careca por um 404") — sem assar cabelo na base, o que quebraria o teto de
  regressão do Bloco 1d. **A base careca continua existindo**, e continua sendo o
  artefato que aquele teto mede; ela só deixa de ser um estado que a criança
  alcança.
- **4.3** `unequip_slot` passa a aceitar `hair` e `back` — a lista dentro da
  função é uma segunda cópia do CHECK, e o gate já confere que as duas batem.

⚠️ **Extrair o corpo de qualquer função existente de `pg_get_functiondef` do
banco vivo, nunca de migration antiga.** E ele **não emite o `;`** depois de
`$function$`.

🔒 **Gate:** `verify:phase8` passa com os slots novos; `verify:privileges` e
`verify:no-dup-rpc` continuam verdes.

---

## Bloco 5 — F2 render: a reescrita

- **5.1** `constants.ts`: canvas 4:5, `SIZE_CONFIG` novo (56×70, 100×125,
  200×250, 340×425), z-order das 8 camadas.
- **5.2** `bodyFamilies.ts`: `ESTRATEGISTA_V2`, anchors **sem gênero** +
  **offset por item** (D24 — chapéu alto e boné não assentam no mesmo ponto).
- **5.3** `types.ts`: remove `GenderVariant`, `dressed_base`, `head_swap`.
- **5.4** `renderModes.ts`: `garment`, `head_attach`, `back_attach`.
- **5.5** `resolvedAvatar.ts`: **deletar todo o knockout**.
- **5.6** `AvatarDisplay.tsx`: nova pilha de camadas, sem `clipPath`, head-group
  com tilt.
- **5.7** **Folha de estilo única.** Trinta avatares numa lista hoje emitiriam
  30 blocos `<style>` idênticos. As regras sobem para o CSS global; cada `<svg>`
  carrega só as custom properties. Sem isso o D30 fica pesado.
- **5.8** `assetResolver.ts` sem variante de gênero.
- **5.9** Fallback: uniforme ausente cai para o traje da base, nunca boneco pelado.
- **5.10** `criar-personagem`: male/female → **tom de pele + modelo de cabelo +
  cor do cabelo**. Três escolhas, não quatro: a cor de fundo saiu com a emenda à
  D27. A cor do cabelo move também a **sobrancelha**, que é camada própria na base.
- **5.11** `viewBox` de cabeça, para o avatar servir de foto de perfil.

🔒 **Gate:** `npm run build` · e2e 149/149 · `verify:all` inteiro · **sem
regressão contra o `asset-baseline.json`** · avatar antigo degrada sem erro ·
**nenhum código per-gender restante** (grep por `male`/`female` em
`src/lib/avatar/` volta vazio).

> ⚠️ **O "gate de assets 100%" saiu daqui em 2026-08-03, e foi para o Bloco 9,
> que é onde ele pertence.** Exigir catálogo 100% renderável para **construir** o
> render novo é circular: os itens só passam a renderizar depois de o render novo
> existir. O que este bloco tem de provar é que **nada regrediu** — o ratchet do
> `asset-baseline.json` já é exatamente essa medida. Zerar o baseline continua
> sendo obrigação, e continua sendo o gate do Bloco 8/9.

---

## Bloco 6 — F2 alcance: o D30

*É aqui que o investimento inteiro passa a motivar alguém.*

| tela | vira | custo |
|---|---|---|
| navbar | cabeça, 32 px | UI (hoje mostra iniciais) |
| ranking geral | cabeça + moldura, 40 px | **só UI** — `get_ranking` já devolve `avatar_config` |
| ranking de turma | cabeça + moldura | UI + conferir RPC |
| mural | cabeça, 32 px | UI + incluir no feed |
| Companhia | corpo inteiro (`sm`) | UI + conferir RPC |

- **6.1** Um componente `<AvatarCabeca>` reutilizável, para as quatro telas que
  usam o recorte quadrado.
- **6.2** A moldura de raridade no ranking. **É o melhor retorno do plano
  inteiro:** CSS puro, custo de arte zero, e é onde raridade vira status social.
- **6.3** Opt-out de ranking respeitado também no avatar (LGPD).

🔒 **Gate e2e:** o avatar aparece no ranking · 12 alunos com configurações
diferentes saem **diferentes** · nenhum salto de layout ao carregar.

---

## Bloco 7a — F3: a concessão da patente ✅ **FEITO em 2026-07-29**

*Puxado para antes do Bloco 5 porque não depende de arte nem do render novo, e
porque `user_public_profiles.title` já alimenta navbar, dashboard e ranking —
entrega valor visível e prova a régua da D-A antes de comprometer arte.*

Migration `20260729120000_patente_por_marcos.sql`:

- **7a.1** `title_tiers` — a régua vira dado, com RLS, leitura para aluno logado
  e escrita para ninguém.
- **7a.2** `user_titles.achieved_tier` — marca d'água **monotônica**. O modo
  retry de `complete_lesson_step` zera `completed` antes de reconcluir, então a
  contagem cai por um instante; sem marca d'água o aluno seria rebaixado durante
  o próprio retry e promovido de novo, com evento no mural das duas vezes.
- **7a.3** `recompute_user_title(uuid)` — idempotente, com UPSERT.
  `complete_lesson_step` passa a delegar. `EXECUTE` revogado de
  anon/authenticated: recebe `user_id` arbitrário.
- **7a.4** Backfill de todos os usuários.

⚠️ Corpo extraído de `pg_get_functiondef` do banco vivo, com dois pontos
alterados (as variáveis do DECLARE e o bloco virando `PERFORM`) e o `;` final
acrescentado à mão.

🔒 **Gate:** `verify:avatar-db` — falhava antes, passa depois. Cinco cenários
provados em transação revertida contra produção: 29 aulas não promove, 30
promove, chamar de novo não duplica evento, retry não rebaixa, e **linha ausente
em `user_titles` recria e concede** (o defeito original).

## Bloco 7b — F3: o uniforme por patente

*Depois do Bloco 5. Hoje `items` tem 8 uniformes e **0 renderáveis** — conceder
agora entregaria item invisível.*

- **7b.1** Preencher `title_tiers.outfit_item_id` e conceder + auto-equipar.
- **7b.2** Capa `back` junto, a partir de Comandante (slot existe; arte depois).

🔒 **Gate e2e:** atingir o marco veste o uniforme, e ele aparece no ranking.

---

## Bloco 8 — F4 arte: os 39 desenhos restantes

*O bloco mais longo. Várias sessões. Ordem por valor.*

| ordem | o quê | quantos | quem refina |
|---|---|---|---|
| 1 | Uniformes: **Aspirante feito**. Restam **Capitão, Comandante, General e Mestre** — 4, não 5, porque o tier 7 (Lenda) saiu da escada. O **design das 4 já está pronto e travado por gate**: cor, bota, detalhe e o pedido colável em [17](17-patentes-uniformes-design.md) e [18](18-uniformes-blocos.md). Falta só gerar a imagem, e quem gera é o Doug | ~~6~~ **4** | Doug gera, eu asso |
| 2 | Cabelos | 5 | eu |
| 3 | Chapéus | 6 | eu |
| ~~4~~ | ~~Relíquias (2 famílias × 3 tiers)~~ **cortadas pela D-E** — o slot `hand` não existe neste boneco | ~~6~~ **0** | — |
| 5 | Backgrounds | 8 | eu |
| 6 | **Pets** | 20 | **você refina bastante** |

**Total: ~~39~~ → 33 desenhos**, pela D-E.

**Regra de ouro do lote:** cada desenho passa pela folha de contato antes do
seguinte começar. Trinta e nove desenhos revisados só no fim é como se descobre,
tarde, que a régua de estilo derivou.

### ⚠️ ANTES DOS 6 CHAPÉUS: a regra de chapéu × cabelo — 2026-08-03

**Um chapéu e um cabelo disputam a mesma cabeça, e hoje nada no sistema diz quem
cede.** Cada chapéu precisa de uma destas quatro respostas: mostra o cabelo
inteiro · esconde só a franja · esconde o cabelo todo · pede uma **variante
achatada** (o *hat hair* dos jogos). Uma boina deixa a franja aparecer; um elmo
fechado não pode ter mecha atravessando o metal.

**A resposta vive no item, nunca no compositor.** Um campo declarado no chapéu
(`escondeCabelo?: "nada" | "franja" | "tudo"`) e o `compor()` obedecendo — o
mesmo idioma do `atras` que as extensões já usam. A alternativa é um `if` por
chapéu dentro do compositor, e seis chapéus × cinco cabelos são **30 combinações**
para consertar caso a caso.

**Decidir isto depois de os 6 chapéus estarem desenhados custa redesenho**, porque
a resposta muda a forma da peça: um chapéu que esconde a franja pode ser mais
raso, um que a mostra precisa de aba que não brigue com ela. É a mesma lição do
2b.0 — arremate do tronco antes dos 14 trajes, não depois.

*(Achado do parecer externo de 2026-08-03; é a única lacuna estrutural que as três
análises daquele dia apontaram e que o plano ainda não cobria.)*

🔒 **Gate:** manifesto 100% coberto · folha de contato revisada · nenhum item
invisível · `asset-baseline.json` **zerado** (é o momento em que o passivo dos
45 itens acaba).

---

## Bloco 9 — F4 dados: o catálogo novo

- **9.1** Reseed: **77 → ~~60~~ 54 itens** (7 uniforme + 6 head + 5 hair +
  20 pet + 8 background + 8 frame). O `hand` saiu pela **D-E**, e as suas 8 linhas
  já terão sido removidas no **2c** — aqui não sobra nada dele para reseed.
- **9.2** Pirâmide de raridade **40/30/20/10** (hoje 19/20/20/18 — um quarto do
  catálogo é lendário, então lendário não quer dizer nada).
- **9.3** **D16** — pool de baú só com estético (`head`, `hair`, `background`,
  `pet`, `back`). **Nunca** uniforme nem `frame`: esses são mérito, e sorteá-los
  faz o boneco parar de contar a história do aluno. *A relíquia saiu da frase pela
  **D-E**; a moldura entrou no lugar dela, e é o segundo canal de mérito que
  sobra.* ⚠️ Hoje o `claim_chest` **não filtra slot nenhum** — as três consultas
  dele (`FROM items WHERE rarity = …`) sorteiam qualquer item, e 11 relíquias já
  saíram de baú em produção. O D16 é código a escrever, não descrição do que há.
- **9.4** **D27** — escolha de cor de cabelo e fundo, validada no servidor
  contra a paleta.
- **9.5** Limpeza: remover os PNG órfãos de `public/items/` (hoje 7,0 MB, dos
  quais 4,0 MB são um único pet), regerar manifesto, zerar baseline.

🔒 **Gate:** `verify:phase8` verde com o catálogo novo · a distribuição bate a
pirâmide · abrir 60 baús não devolve uniforme nem moldura · `public/items/`
abaixo de 1 MB.

---

## Bloco 10 — F5: polimento e lançamento

- **10.1** **D8** — 4 expressões por classe CSS: neutra, vitória, concentração,
  derrota. Zero asset novo, porque o rosto já sai em paths próprios. *Nasce
  coberto pelo **3.4**: expressão é animação que esconde, e sem estado base a
  cara certa some onde a animação não roda.*

  ⚠️ **A D8 estava dada como morta pela regra 13 do §7b, e voltou.** A regra dizia
  que a promessa de "4 expressões de graça" não sobreviveu à arte traçada, porque
  um rosto traçado não tem a boca alegre no arquivo — a expressão passaria a
  custar 3 desenhos. **A arte kokeshi não é traçada: ela é código.** A sobrancelha
  é uma cápsula construída de cinco números (`SOBRANCELHA`), a boca de outros
  quatro (`BOCA`), e a piscada já prova o mecanismo — ela não troca o olho, ela o
  **achata** (`scaleY(.08)`).

  As quatro expressões cabem só em `transform`, sem forma nova, e a mais bonita é
  a derrota: o sorriso tem sagita 3,6 para baixo, e **espelhado na vertical vira
  uma boca triste** — um comando de CSS. Concentração é a boca achatada;
  vitória e concentração movem a sobrancelha por deslocamento e rotação. Mudar o
  `d` de um path é o que **não** dá — não anima de forma confiável entre
  navegadores —, e a tabela acima foi montada para não precisar.

  **O que custa, medido:** a folha reprova acima de 20 formas e **7 680 bytes**;
  a base tem 19 e **7 418**, ou seja **262 bytes de folga**, e as regras das quatro
  expressões custam ~400. Não cabe no orçamento de hoje — e não precisa caber:
  expressão entra pela mesma chave que o `animado` já usa para desligar o piscar
  no ranking. **Zero byte a 56 px numa lista de 30**, ~400 na tela de jogo e no
  perfil, que é onde uma careta significa alguma coisa.
- **10.2** **D29** — baú de escolha em marcos: a criança escolhe 1 entre 3. As
  3 opções vêm do servidor; escolher uma não permite pegar as outras.
- **10.3** Capas `back` — as primeiras 3 ou 4.
- **10.4** Acessibilidade: `alt` com o nome do aluno, contraste do nome sobre o
  fundo equipado, botões de equipar alcançáveis por teclado,
  `prefers-reduced-motion` no `character-root`, e **raridade sinalizada por mais
  que cor**.
- **10.5** Sons de equipar e de abrir baú — hoje são placeholder, e o loop de
  recompensa sem som fica pela metade.
- **10.6** **Medir no celular mais fraco disponível**: ranking com 30 alunos,
  número de requisições e tempo até pintar.
- **10.7** e2e novos: concessão por patente, baú de escolha, escolha de cor
  persiste, avatar no ranking, duplicata vira XP.
- **10.8** **D21** string canônica — só se a medição do 10.6 pedir.

🔒 **Gate:** as 6 definições de "pronto" da seção 2, uma a uma.

---

# 6. Riscos vivos

| risco | mitigação | estado |
|---|---|---|
| A régua da patente não resolvida deixa 5 uniformes mortos | Decisão **D-A** tomada; gate reprova uniforme em patente inalcançável | mitigado |
| Concessão de patente falhar em silêncio de novo | `recompute_user_title` é idempotente e faz UPSERT; o gate confere que todo usuário tem linha | mitigado |
| Minha arte sair genérica | O Bloco 2 é ponto de crítica **antes** dos outros 44 | mitigado |
| Pets orgânicos ficarem fracos | Bloco 8 assume refino seu | aceito |
| Uniforme não registrar nos 8 tons | Testar só no Soldado antes dos outros 6 | mitigado |
| Cores da paleta se fundirem | Validador do Bloco 1 | mitigado |
| Animação esconder elemento em silêncio (pálpebra sem estado base) | Hoje só o pet é conferido, à mão, no teste do SVGO. O **3.4** vira contrato antes dos 39 desenhos | **aberto até o Bloco 3** |
| `complete_lesson_step` regredir | Extrair do banco vivo; `verify:no-dup-rpc` é ratchet | mitigado |
| 30 avatares numa lista pesarem | Folha de estilo única (5.7) + medição (10.6) | **aberto até medir** |
| Trilhas crescerem e quebrarem títulos de novo | Gate T0.17 | mitigado |

---

# 7. Método de trabalho da arte

**A Anthropic não tem API de geração de imagem.** Não é lacuna temporária, é
decisão. O que existe, e funciona:

```
escrever SVG  →  Chromium renderiza a 56 e 340 px  →  LER o PNG  →  criticar  →  refinar
```

O terceiro passo é o que importa: **o agente enxerga o próprio resultado** e
itera sozinho, sem você em cada volta. Validado nesta fase.

**Regras que custaram tempo real e vão se repetir:**

1. **Nada de comentário dentro do `<style>` do SVG.** Um `/* … <path> … */` fez
   o navegador descartar em silêncio **todas as regras seguintes**. Comentário
   fica no gerador; o SVGO removeria de qualquer jeito.
2. **Cor em custom property, nunca embutida na regra.** Senão dois bonecos na
   mesma página colidem e o último pinta todos.
3. **Classe CSS ganha de atributo de apresentação.** `class="l"` com
   `stroke-width: 7` vence `stroke-width="15"` escrito no elemento.
4. **Contorno e preenchimento no mesmo elemento, pintados de trás para a
   frente.** Fills primeiro e strokes depois cria costura dupla.
5. **Braço é linha, e linha não tem contorno.** Duas passadas: traço grosso
   escuro por baixo, fino colorido por cima.
6. **Estado inicial explícito em tudo que a animação esconde.** Pálpebra só com
   `opacity: 0` dentro do `@keyframes` apaga os olhos quando a animação não roda.
   *Deixa de ser disciplina manual no **3.4**, que a confere junto com o
   `prefers-reduced-motion` exigido pelo 10.4.*
7. **Pele escura precisa de esclera** — uma amêndoa branca fina nas laterais.
   Esclera cheia dá olho arregalado.
8. **Renderizar sempre nos dois extremos** (56 e 340 px) antes de julgar. **O
   que manda é o menor.**
9. **Não julgar arte por descrição.** Renderizar e olhar.

## 7b. Regras da arte de ORIGEM — o que pedir antes de desenhar

*Escritas na fase da arte vetorizada, e cada uma custou uma rodada inteira. Valem
para os 39 desenhos do Bloco 8, não só para a base.*

10. **Pele e pano em matizes distantes.** O pipeline separa as duas famílias por
    matiz, e a separação tem de ter vão. Na rodada em que o macacão saiu
    creme-pêssego, pele e pano ficaram ambos em ~30° e o tronco saiu **salpicado
    de manchas cor de pele**, que mudavam de cor junto com o tom do aluno. Com o
    macacão em azul (200°) contra pele em 18–28°, a separação é limpa.

    O motivo da regra **não** é que o pano será repintado — pela emenda à D27, só
    pele e cabelo recolorem, e a cor do pano é definitiva. O motivo é que o
    pipeline precisa saber **o que é pele**, porque é a pele que troca de cor. Uma
    bota marrom não seria "pano de cor trocável": seria **entendida como pele** e
    mudaria de cor junto com o aluno. A regra fica mais estrita, não menos: nada
    que não seja pele pode morar em 18–28°, nem no cinto, nem na gola.
11. **Pano sem textura.** Uma textura fina de tecido, quase invisível no PNG, o
    traçador transforma em **regiões esfarrapadas do tamanho do tronco**. Nem
    filtro de área nem menos degraus as separam da dobra real — só a amplitude
    (`ZONA_MORTA_ROUPA`), e ela custa quase toda a sombra intermediária do pano.
    Com uniforme sem textura, esse valor precisa **baixar**, senão apaga dobra
    de verdade.
12. **O SVG que o Canva exporta não é vetor.** É um PNG em base64 dentro de um
    `<svg>`, com a transparência num SEGUNDO PNG cuja luminância vira o alfa.
    Extrair só o de cor entrega fundo preto, e o traçador desenha esse preto
    como forma.
13. **Nem toda decisão de "de graça" sobrevive à arte traçada.** A **D8** prometia
    4 expressões em runtime a custo zero, porque o rosto seria desenhado em paths
    próprios. Rosto traçado não tem a forma da boca alegre no arquivo: a
    expressão passou a custar **3 desenhos**. Antes de contar com uma decisão que
    depende de *como* a arte foi feita, conferir se ela ainda foi feita assim.

    ⚠️ *Atualizado em 2026-07-31.* **A regra vale, e a conclusão dela caducou** —
    o que é a própria regra funcionando. A arte kokeshi não é traçada: o rosto é
    construído por função a partir de números medidos, então a D8 voltou a ser de
    graça. A lição a guardar não é "a D8 morreu", é **conferir de novo a cada
    troca de pipeline de arte**. Ver o **10.1** para o custo real, que não é zero:
    é ~400 bytes contra 262 de folga, resolvido por chave em vez de orçamento.
14. **A cor que você escolher para roupa e acessório é definitiva.** Pela emenda à
    D27, só pele e cabelo recolorem. Então a cor do uniforme na arte de origem
    **é a cor final** — e ela é o sinal da patente. Duas peças da mesma patente
    precisam sair na mesma cor entre pedidos diferentes, porque nada as harmoniza
    depois.
15. **Peça o uniforme FOLGADO, nunca justo.** A silhueta pertence ao sistema: o
    uniforme é recortado pelas máscaras derivadas da base, então sobra se remove
    de forma determinística e falta exigiria inventar desenho. Ombro, manga,
    calça e bota alguns por cento maiores é o pedido certo — e é o que fez a arte
    do Recruta servir sem rodada nova, depois de duas tentativas de encaixe justo
    que falharam.

15b. **A pose é "quase frontal, com giro mínimo para a direita da imagem" — e o
    pedido tem de dizer isso com essas palavras.** ⚠️ *Escrito em 2026-07-31, e as
    duas formulações anteriores estavam erradas em direções opostas.*

    Este plano já disse **"levemente em 3/4"** e o Bloco 1 respondeu com **"frontal
    simétrica"**. Nenhum dos dois descreve a `referencia-base.png`. A medição
    (`scripts/avatar/estilo/medir.ts`, em unidades do `viewBox` com a altura útil
    normalizada em 600) diz:

    | sinal                                      | medido |
    |--------------------------------------------|--------|
    | o par de olhos, contra o eixo da cabeça     | +33,9  |
    | desnível entre os dois olhos                | 3,6    |
    | desnível entre as duas sobrancelhas         | 3,5    |
    | eixo da cabeça, contra o eixo do tronco     | +7,0   |
    | razão entre as facetas laterais, no alto    | 2:1    |

    ⚠️ *Atualizado no Bloco 1d.* A tabela citava as saliências das duas orelhas
    (24,1 e 14,7) como os dois primeiros sinais; **a arte definitiva não tem
    orelhas** — elas saíram porque orelha na base obriga cada um dos 92 itens de
    chapéu e cabelo a decidir se cobre ou não. Entraram no lugar o desnível das
    sobrancelhas e a razão das facetas. Os sinais que restam são todos medidos e
    todos estão no gate.

    **Por que isso é regra de PEDIDO e não só de código.** A referência vai anexada
    idêntica em todo pedido ao gerador, e é dela que o gerador copia a leitura
    espacial. Se o pedido não exigir a assimetria, ele devolve simetria — e aí a
    base (que é assimétrica, por medição) recebe tinta simétrica e briga consigo
    mesma em toda peça. O inverso também vale: uma base simétrica com tinta
    assimétrica é o mesmo defeito pelo outro lado.

15c. **Peça o "efeito cubo" com essas palavras: o rosto tem QUATRO facetas, não um
    degradê.** ⚠️ *Escrito no Bloco 1c, corrigido no 1d.*

    O Bloco 1b entregou um rosto chapado e o Doug reprovou assim: *"não há
    sombreamento lateral do rosto do lado esquerdo — **efeito cubo**, e é um dos
    principais fatores para entender que o rosto está levemente de lado"*. Não era
    gosto: a referência tem uma **aresta dura** em cada lateral, e é a razão entre
    as larguras das duas que carrega o giro.

    | faceta | largura no topo | largura na base | tom no topo | tom na base |
    |---|---|---|---|---|
    | esquerda (vira para o observador) | 32,7 | 25,8 | −4,6 | −29,9 |
    | direita (foge) | 16,0 | 22,5 | −29,9 | −33,2 |
    | queixo (faixa acima do contorno) | — | largura toda | — | −33,1 |
    | sombra da cabeça no tronco | — | 14,5 de altura | — | −45,3 |

    Os tons são níveis de luminância contra o platô do rosto (221). **A esquerda é
    o dobro da direita no alto** — essa razão *é* o giro, e é informação que a
    silhueta não carrega: dois desenhos com o mesmo contorno podem ter um o rosto
    virado e o outro chapado.

    **Duas armadilhas de medição, as duas pagas com uma rodada cada.** A primeira:
    perguntar *"quantos pixels seguidos, a partir da borda, são mais escuros que o
    platô?"* tem o sinal embutido e mede ZERO onde a faceta cruza o tom frontal. A
    pergunta certa não tem sinal — *onde está a descontinuidade?* A segunda: as
    janelas de amostragem precisam **evitar a tinta do rosto**. Na arte definitiva,
    sobrancelha em `fracCab` 0,398–0,438 e boca em 0,822–0,844; uma janela que
    encoste nelas mede sobrancelha achando que mede faceta, e fica **verde**.

    **No pedido, escrever literalmente:** *"pose quase frontal, com um giro mínimo
    para a direita da imagem: a orelha esquerda aparece inteira e a direita fica
    parcialmente escondida; há um plano lateral mais escuro só na borda direita da
    cabeça e do tronco; os olhos ficam ligeiramente à direita do centro da cabeça,
    com o direito um pouco mais alto."*

    A assimetria mora em `GIRO`, em `geometria.ts`, ao lado de `LUZ`, e
    `npm run avatar:pose` reprova quem a perder. Ela revoga a **D3 do doc 12**, com
    o imposto (92 itens de catálogo autorados para o giro) registrado lá.

## 7c. Restrições de composição — aprendidas no `avatar:garment`

16. **Regra de CSS NÃO alcança o conteúdo de `<use>` — e este item já disse o
    contrário.** ⚠️ *Corrigido; a versão anterior estava ao revés.*

    A afirmação antiga era que `.vestido .av-roupa{display:none}` **escapava e
    escondia o macacão de todos os avatares da página**, e que a proteção era pôr
    escopo por classe de ancestral. O escopo já estava lá, e o problema era outro:
    a regra **não faz absolutamente nada** quando a base entra por `<use>`, porque
    o conteúdo referenciado mora numa árvore-sombra que o seletor do documento não
    atravessa.

    Medido, mesma base, mesmo viewport, hash do PNG:

    | montagem | sem a regra | com a regra | |
    |---|---|---|---|
    | via `<use>` | `582078712a8ba94c` · 65037 B | `582078712a8ba94c` · 65037 B | **byte a byte idênticos** |
    | inline | `582078712a8ba94c` · 65037 B | `d517a82e72187bfb` · 40798 B | o seletor **funciona** |

    A segunda linha é o controle: o seletor está correto, e some com 24 KB de
    macacão quando o elemento é inline. É a fronteira do `<use>` que ele não cruza.

    **Por que a lição invertida era pior que nenhuma lição.** Ela protegia contra
    um risco que não existe (desnudar a turma) e escondia o real: o macacão
    continuava desenhado sob todo uniforme, e aparecia em cada vão que a arte não
    cobre. A correção é **estrutural, não de CSS** — `avatar-base-sem-traje.svg`,
    em que as camadas de roupa são REMOVIDAS do arquivo. Ausência estrutural se
    confere procurando `av-roupa` no arquivo e não achando; ausência por CSS
    depende de o navegador concordar, e ele não concordava.

    A regra que sobra, e essa vale: **escopo por classe de ancestral continua
    obrigatório** em qualquer `<style>` que a composição emita, porque `<style>`
    dentro de `<svg>` inline é mesmo de escopo do DOCUMENTO. Só que sozinho ele
    não resolvia nada aqui.
17. **Máscara é ferramenta de BUILD, não de runtime.** O ranking mostra 30
    avatares; máscara e filtro forçam composição fora da tela por instância. O
    recorte, o fundo de segurança e o vazado de cabeça e mãos são assados no alfa
    do asset, e em runtime sobra `<use>` da base mais **um** `<image>`.
18. **Peso de arquivo não é memória.** A variante de 1920 tem 265 KB comprimidos
    e **9,36 MiB decodificados**; 30 uniformes distintos chegariam a 281 MiB de
    bitmap. Daí as cinco variantes, e daí a regra: **a variante é escolhida por
    altura CSS × devicePixelRatio**, não por altura CSS — a 70 px com DPR 2 o
    navegador precisa de 140, e servir a de 128 seria ampliar.
19. **Benchmark com asset repetido mede cache, não memória.** O navegador
    compartilha o bitmap decodificado de uma URL só. Medido: 30 cópias do mesmo
    asset levam 481 ms; **30 assets distintos levam 893 ms** — quase o dobro.
20. **Ao medir alfa, olhe a faixa de TRANSIÇÃO.** Contar "RGB escuro em pixel
    transparente" no quadro inteiro dá 99% e não quer dizer nada: o fundo vazio é
    85% da imagem e nunca se mistura com a figura. O que a interpolação puxa é o
    pixel com 8 < alfa < 255, comparado com os vizinhos opacos **em espaço
    pré-multiplicado** — comparar RGB desassociado com alfa baixo amplifica ruído.
    Assim o contorno escuro legítimo passa, porque os vizinhos também são escuros.

**Comandos:**

**Os do estilo kokeshi** (as duas skills `avatar-regua` e `avatar-desenho` roteiam
para eles; a tabela de gatilhos do `CLAUDE.md` invoca as skills):

```
npm run avatar:linha-de-centro  extrai contorno e perfil de uma referência nova
npm run avatar:curvatura        onde a curva EMITIDA repuxa — reporta, não reprova
npm run avatar:variantes        N candidatas com as amarras medidas + o selo
npm run avatar:pose             perfil, 26 marcos, unicidade de id, 4 fixtures
npm run avatar:folha-base       orçamento, distinção a 56 px, folha para o Doug
npm run avatar:animacao         nasce aberto, pisca, respira, obedece reduced-motion
npm run dev                     e abrir /dev/avatar-kokeshi ou /dev/avatar-variantes
```

**Os da base antiga**, que o banner do doc 16 declara mortos para este boneco:

```
npm run avatar:base         regera o boneco base e a folha de conferência
npm run avatar:garment      assa um uniforme vestível, com as 5 variantes e os gates
npm run avatar:manifest     regera o manifesto depois de mexer em public/items/
npm run dev                 e abrir /dev/avatar-base (professor/admin)
```

O `avatar:garment` sai com código 1 se algum gate reprovar, e escreve a folha
visual em `.scratch/uniforme/folha.png` — quatro fundos a 425 px, os 56 px
ampliados com pixel visível, e os quatro closes de fronteira. Para assar outra
peça: `UNIFORME=caminho.svg UNIFORME_NOME=nome npm run avatar:garment`.

---

# 8. Armadilhas do projeto

*Para quem abre uma sessão nova. Todas já custaram caro.*

- **O e2e bate no Supabase de PRODUÇÃO** e cria/apaga usuários reais. Rodar com
  intenção, nunca em CI.
- **Antes de medir a suíte e2e completa, reinicie o `npm run dev`.** Servidor
  usado entre runs degrada e derruba dezenas de testes que passam sozinhos.
  **Não aumente o timeout — isso piora.**
- **Nunca copie corpo de função SQL de migration antiga.** Extraia de
  `pg_get_functiondef` do banco vivo. Ele **não emite o `;`** depois de
  `$function$`. Foi assim que a curva de XP ficou 4 meses errada.
- **`getByRole` do Playwright é caro** em página pesada; use localizador CSS.
- **`.first()` pega elemento escondido** quando o componente é renderizado duas
  vezes (mobile + desktop). Use `filter({ visible: true })`.
- **O Supabase CLI não está instalado.** Aplicar migration com
  `npx tsx scripts/apply-migration.ts <arquivo.sql>`.
- **O usuário não consegue dar push.** Quando os commits estiverem prontos,
  peça que ele rode `git push origin main`.
- **Toda correção precisa de um gate que falha antes e passa depois.** Regra do
  `CLAUDE.md`, e a razão de o passivo ter parado de crescer.

---

# 9. O que não está neste plano

Fronteiras deliberadas, para não haver surpresa:

| item | por quê |
|---|---|
| **Fase 11 (PWA)** e **Fase 12 (lançamento)** | São fases próprias do roadmap. O avatar não depende delas nem elas dele |
| **Revisão do conteúdo das aulas** | Prioridade sua: depois do avatar. Mas a decisão **D-A** encosta nisso |
| **Loja, moeda, passe de temporada** | Público infantil de clube escolar, LGPD, e o avatar conta mérito, não gasto |
| **Rosto composível, barba, micro-slots** | Invisíveis a 56 px |
| **Motor de animação (Rive/Lottie)** | Dependência nova; CSS já resolve o respiro e o idle do pet |
| **Composição no servidor (D22)** | Com SVG, compor é concatenar string. Revisitar só se a medição do 10.6 pedir |
| **Repositório público com dados de menores** | Decisão de lançamento, não de avatar — mas **precisa ser revisitada antes** |

---

# 10. Checklist final de pronto

Marque só com evidência medida, não com impressão.

- [ ] `asset-baseline.json` zerado — 60 de 60 itens vestem o boneco
- [ ] `npm run verify:all` verde, incluindo `verify:phase8`
- [ ] `public/items/` abaixo de 1 MB
- [ ] Avatar em navbar, ranking geral, ranking de turma, mural e Companhia
- [ ] 12 alunos diferentes numa lista saem **visualmente diferentes**
- [ ] Uniforme concedido e vestido ao atingir a patente, visível no ranking
- [ ] Baú não sorteia uniforme nem moldura
- [ ] Distribuição de raridade em 40/30/20/10
- [ ] Os 8 tons de pele registram com todos os 7 uniformes
- [ ] Cada slot: os itens irmãos se distinguem a 56 px na folha de contato
- [ ] Ranking com 30 alunos medido em celular fraco
- [ ] `alt`, contraste, teclado, `prefers-reduced-motion`, raridade não só por cor
- [ ] e2e completo verde, com os 5 testes novos
- [ ] `docs/avatar/14-backlog-execucao.md` com todas as tarefas marcadas —
      `docs/ESTADO.md` mostra quantas faltam
