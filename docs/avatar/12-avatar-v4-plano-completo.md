# Avatar v4 — Plano Completo (decisões tomadas + execução)

> ## ⚠️ Emenda de 2026-08-20 — a virada para a Academia 64
>
> Este doc foi escrito na era do **reino medieval**, e três coisas dele já não
> valem. A lei vigente é
> [`../Academia64_Biblia_Tonal_v2.md`](../Academia64_Biblia_Tonal_v2.md).
>
> - **D27 — a justificativa mudou, a regra não.** "Só pele e cabelo recolorem"
>   continua sendo lei dura (`CLAUDE.md`, regra 4). O que caiu foi o *porquê*
>   escrito aqui, que apelava ao **uniforme por patente**: a cor deixou de vestir
>   o boneco em 2026-08-13 e virou moldura. A razão da regra hoje é outra e é mais
>   simples — **cor assada é cor que o artista controla**, e recolorir peça de
>   catálogo com 40 formas diferentes não tem como dar certo.
> - **D10 — o elenco de chapéu não tem elmo nem coroa.** São peças de época e de
>   reino; a Academia não as pede.
> - **"Patente" virou "título"**, e os degraus foram renomeados (Bíblia v2 §6).
>   Onde este doc disser Soldado/Aspirante/Capitão/Comandante/General/Mestre, leia
>   Aprendiz/Estudante/Analista/Estrategista/Mestre/Grão-Mestre. Os slugs do banco
>   não mudaram.
>
> **D9, D16 e D25 já estavam revogadas antes desta emenda** — o que as substituiu
> está no doc 15 e no doc 21, e não se reabre aqui.

> **Para o usuário verificar e aprovar.** Todas as decisões do
> `_superado/11-checklist-de-decisoes.md` estão respondidas aqui, cada uma com o motivo em
> uma linha. Discordou de alguma? Diga qual — várias se encadeiam, e eu recalculo
> o que muda.
>
> **Supersede:** o `_superado/10-avatar-v3-definitive.md` nos pontos de **canvas, estilo de
> arte e catálogo**. O resto do v3 permanece e está incorporado aqui: corpo único,
> `garment` no lugar de `dressed_base`, knockout deletado, server-authority,
> uniforme por patente, anti-palhaço.
>
> **Por que agora:** só existem contas de teste (16 usuários), toda a arte é
> placeholder, e o canvas vive em 2 constantes. Depois do lançamento, cada uma
> destas decisões vira migração de dados.

---

# 1. Decisões tomadas

## Fundação visual

| # | Decisão | Escolha | Por quê, em uma linha |
|---|---|---|---|
| D1 | Proporção | ~~1:3~~ → **REVOGADA em 2026-07-31: a cabeça é 0,508 da figura (≈1:2)** | a T0.12 do doc 14 escolheu 1:3 para um boneco com pernas. O estilo kokeshi não tem pernas, e sem pernas a figura de três cabeças que o D1 media deixa de existir — a razão passa a ser cabeça↔tronco, medida em **0,508** na `referencia-base.png`. A régua de verdade é `src/lib/avatar/estilo/geometria.ts`; o custo é o item 8 da §2 do doc 15 (tudo que identifica o aluno cabe na cabeça), endereçado pelos slots `emblema` e `rosto` |
| D2 | Canvas | **4:5 — `viewBox` 400×500** | com SVG o `viewBox` escala livremente, então errar a proporção do quadro **deixou de ser caro**. Decisão rebaixada de crítica para ajustável |
| D3 | Pose | ~~frontal simétrica~~ → **REVOGADA em 2026-07-31: quase frontal, com giro mínimo para a direita da imagem** | a `referencia-base.png` não é simétrica, e não é por pouco: **quatro sinais independentes** concordam, todos medidos em pixel por `scripts/avatar/estilo/medir.ts` — orelha esquerda sai 24,1 unidades e a direita 14,7; o par de olhos anda +33,5 do eixo da cabeça; o plano lateral escuro mede 0 à esquerda e 16 à direita; e o eixo da cabeça fica +7,4 do eixo do tronco. **O imposto é real e está pago de olhos abertos:** todo chapéu, emblema, decalque de rosto e capa passa a ser autorado *para aquele giro* — um chapéu centrado fica errado —, e são 92 itens de catálogo. **Por que vale mesmo assim:** os trajes são gerados A PARTIR desta mesma referência, então uma base simétrica receberia tinta assimétrica e brigaria consigo mesma em toda peça — defeito novo, permanente e em 14 peças. **A mitigação** é a constante `GIRO` em `geometria.ts`, ao lado de `LUZ`: a assimetria vira dado do sistema, lido por todo acessório futuro, em vez de julgamento de quem desenha. Medido por `npm run avatar:pose` |
| D4 | Tons de pele | **8** (era 5) | com classe de paleta, tom de pele é **uma linha de CSS** — 8 custam o mesmo que 3. O número 5 tinha sido calibrado contra custo de PNG, que não existe mais. Para clube de escola pública, representação melhor sai de graça |
| D5 | Cabelo | **curto baked na base + slot `hair`** | ninguém aparece careca por 404, e o slot dá o eixo de identidade |

## Camadas

| # | Decisão | Escolha | Por quê |
|---|---|---|---|
| D6 | Slots | **8**: `background`, `back`, `outfit`, `hair`, `head`, `hand`, `pet`, `frame` | nenhum é gordura; três já funcionam hoje |
| D7 | Capa (`back`) | **slot agora, arte depois** | adicionar slot depois obriga revisar todo item das outras camadas |
| D8 | Expressões runtime | **4, no lançamento** (era: fora) | rejeitei por custo de asset, e o custo evaporou: com o rosto desenhado como paths próprios no SVG da base, expressão é **troca de classe CSS** — zero arquivo, zero requisição. Neutra, vitória, concentração, derrota |

**Não existirão:** botas, luvas, cinto, colar, ombreira, lenço, bolsa. Em 56 px são
invisíveis e cada um multiplica a matriz de compatibilidade. Viram detalhe
desenhado dentro do uniforme de cada patente.

## Catálogo

| # | Slot | Hoje | Decidido | Observação |
|---|---|---|---|---|
| D9 | `outfit` | 8 (0 funcionam) | **7** | um por patente, Soldado→Lenda; Aprendiz é a própria base |
| D10 | `head` | 8 (1 funciona) | **6** | mantém os que contam história: boné, elmo, coroa |
| D11 | `hair` | — | **5 modelos** | curto, cacheado, trança, coque, moicano |
| D12 | `hand` | 8 (8 funcionam) | **6** | 2 famílias × 3 tiers, ganhas por marco de aprendizado |
| D13 | `pet` | 37 (7 funcionam) | **20** (era 12) | cortei para 12 por **custo de arte, que caiu**. E catálogo enxuto piora duplicata: com ~8 itens por raridade, a criança recebe repetido no 8º baú. Confirmar após o teste de SVG animado (§6.5) |
| D14 | `background` | 8 (8 funcionam) | **8** | reaproveita; verificar se combinam com o estilo novo |
| D15 | `frame` | 8 (8 funcionam) | **8** | é CSS, custo de arte zero |
| D7 | `back` | — | **0 no lançamento** | slot existe, arte depois |

**Catálogo final: 60 itens** (7+6+5+6+20+8+8), contra 77 hoje dos quais 45
invisíveis. Distribuídos pela pirâmide de raridade do D28.

## Regras do sistema

| # | Decisão | Escolha |
|---|---|---|
| D16 | O que cai em baú | **só estético**: `head`, `hair`, `background`, `pet`, `back`. **Nunca** uniforme nem relíquia — esses são mérito, e sorteá-los faz o boneco parar de contar a história do aluno |
| D17 | O que raridade significa | **acabamento, nunca volume**: material e detalhe melhores no mesmo espaço. Sem espinhos, sem penduricalho. Brilho só na moldura, que é CSS e não toca o boneco |
| **D25** | **Régua da patente** | **aulas concluídas**, não trilhas — 30 aulas → 7 tiers. Ver §9.1: só existem 2 trilhas, então a régua atual torna 5 dos 7 uniformes inalcançáveis |
| **D26** | **Mérito × gosto** | separação **sem exceção**: uniforme, relíquia e itens de conquista são determinísticos e legíveis; cabelo, fundo, cor e pets comuns são sorteados e não significam nada. Hoje estão no mesmo pote |
| **D27** | **Cor escolhida pelo aluno** | ~~cabelo e fundo~~ → **só pele e cabelo**. Ver a emenda abaixo |
| **D28** | **Pirâmide de raridade** | ⛔ **SUPERADA pelos números** — a decisão (mais raro é mais raro) vale; a razão 40/30/20/10 não é a que o banco usa. Ver §9.4 |
| **D29** | **Baú de escolha** | em marcos (trilha completa, tier de bots): a criança escolhe **1 entre 3**. Sem moeda e sem loja, transforma "torcer" em "decidir" |
| **D30** | **Avatar em toda superfície social** | hoje aparece em **2 telas**, nenhuma social (§10). Passa a ser a identidade em navbar, ranking, mural e Companhia. **O avatar É a foto de perfil** — mesmo SVG, `viewBox` recortado na cabeça |

### Emenda à D27 — só pele e cabelo recolorem

**Decisão do usuário, permanente.** A D27 original dava cor à escolha para
**cabelo e fundo**. O escopo encolheu:

> **Recolorem: pele (8 tons) e cabelo (rampa da paleta).**
> **Cor fixa, assada no desenho: roupa, uniforme, chapéu, relíquia, pet e fundo.**

A razão é a mesma da D26 — mérito não é gosto. A cor do uniforme **é** o sinal da
patente; deixá-la escolhível apagaria o sinal. Cor de olho foi considerada e
recusada: a 56 px o olho ocupa 2×3 px, e o eixo custaria uma classe no SVG, uma
coluna no banco e uma escolha na tela para não ser visto onde o avatar é visto.

**A sobrancelha segue `--av-cabelo`.** Não é um eixo novo, é o mesmo eixo
aplicado onde ele faz falta: cabelo loiro com sobrancelha preta não lê como
loiro. É o que separa "trocou de cabelo" de "colocou uma peruca". Na base ela é
uma camada própria, `av-sobrancelha`, separada de `av-olho` por um corte medido
(sobrancelha de y=918 a 964, olho de 1065 a 1187 — 100 unidades de vão).

**Consequências, todas já aplicadas ou registradas:**

| onde | o que muda |
|---|---|
| `palette.ts` | `PROPRIEDADES` encolheu para `--av-traco`, `--av-linha`, `--av-pele`, `--av-pele-s`, `--av-cabelo`, `--av-cabelo-s`. `camada` ficou **vazia** — nada mais é escopado por camada porque nada mais recolore |
| `svgContrato.ts` | o gate passa a **reprovar** desenho que leia `--av-roupa`, `--av-fundo`, `--av-item-a/b`, `--av-detalhe`, `--av-calca`, `--av-sapato` ou `--av-raridade`. A decisão deixou de depender de disciplina |
| Boneco base | o macacão leva `TRAJE_BASE.roupa` (**`#C9BFA8`**) assado. A paleta continua a fonte de verdade, só que lida na geração |
| Migration (T2.1) | **`users.avatar_bg_color` não entra.** Sobram `avatar_skin`, `avatar_hair`, `avatar_hair_color` — ⛔ e `avatar_hair` virou **`avatar_cabelo`** em 2026-08-23, com FK para `avatar_catalogo(slug)`, quando o cabelo passou a ser peça de baú (doc 22 §5-E) |
| `criar-personagem` (T2.10) | **três** escolhas, não quatro: tom de pele, modelo de cabelo, cor do cabelo |
| §9.5 | perde um eixo. Fica 8 tons × 5 modelos × 8 cores de cabelo = **320 combinações** com 5 arquivos de cabelo |
| `--av-raridade` | a moldura é `frame_ui` — CSS na camada z=10, fora do SVG (§2.3). Se um dia precisar entrar num desenho, é uma linha no contrato, e o gate vai exigir |

## Arquitetura

| # | Decisão | Escolha | Por quê |
|---|---|---|---|
| D18 | Cor | **classes de paleta no SVG, recoloridas por CSS** | recolorir deixa de gerar arquivo: 5 cabelos × 5 cores = 5 arquivos, não 25 |
| D19 | Formato | **SVG** para corpo e itens; **APNG** para pets | ver §2.5 — decidido por medição, não por opinião |
| D20 | Manifesto de assets | **fazer** | item sem asset vira **erro de build**; mata a classe de bug que deixou 45 itens invisíveis |
| D21 | String canônica | **fazer** | chave de cache, avatar compartilhável, estado debugável |
| D22 | Composição no servidor | **descartado — resolvido de graça** | com SVG, compor N camadas é concatenar strings num único `<svg>`: 1 requisição, sem servidor de render nem cache. A solução do Habbo existe porque eles compõem bitmaps; o problema sumiu junto com o formato |
| D23 | Folha de contato (QA) | **fazer** | revisa 45 desenhos numa imagem; pega desalinhamento antes do aluno |
| D24 | Offset por item | **fazer** | chapéu alto e boné não assentam no mesmo ponto; barato agora |

---

# 2. Especificação resultante

## 2.1 O corpo

- **1 body family** `estrategista_v2`, substitui `recruta_v1`.
- Proporção ~~1:3 provisória~~ → **medida: cabeça 0,52 da figura** (D1 revogada),
  pose ~~frontal simétrica~~ → **quase frontal, com giro mínimo para a direita da
  imagem** (D3 revogada), `viewBox` ~~4:5~~ → **5:7, 500×700**.
- **Baked na base:** cabelo curto simples e traje de treino. O **rosto sai em
  paths próprios**, com classes — é o que torna as 4 expressões (D8) gratuitas.
- **Pele por paleta:** o artista desenha **1 corpo**; os **8 tons** são classes
  CSS, não arquivos.
- Consequências de graça: "todos começam iguais" é o próprio asset base; 404 de
  uniforme cai para o traje de treino (nunca boneco pelado); **não existe item
  "uniforme de Aprendiz"**.

## 2.2 Tamanhos

| tamanho | hoje (5:7) | novo (4:5) | onde aparece |
|---|---|---|---|
| `sm` | 56×78 | **56×70** | ranking, mural, cards de turma |
| `md` | 100×140 | **100×125** | listas, perfil compacto |
| `lg` | 200×280 | **200×250** | perfil mobile |
| `xl` | 340×476 | **340×425** | perfil desktop |

**O tamanho que manda é o `sm`.** Cabeça grande existe para funcionar a 56 px. Se
ler bem ali, lê em todos.

## 2.3 Camadas e ordem

| z | camada | slot | render mode | dentro do character-root? |
|---|---|---|---|---|
| 0 | fundo | `background` | `underlay` | não |
| 1 | costas | `back` | `back_attach` | sim |
| 2 | corpo | — (`avatar_skin`) | `body` | sim |
| 3 | uniforme | `outfit` | `garment` | sim |
| 4 | cabelo | `hair` | `head_attach` | sim (head-group) |
| 5 | chapéu | `head` | `head_attach` | sim (head-group) |
| 6 | expressão | — (runtime) | classe CSS no rosto da base | sim (head-group) |
| 7 | relíquia | `hand` | `overlay` | sim |
| 8 | pet | `pet` | `companion` | não |
| 10 | moldura | `frame` | `frame_ui` (CSS) | não |

Chapéu esconde cabelo por padrão; válvula `showsHair` por item na config TS.

## 2.4 Paleta (D18)

- `palette.ts` define rampas: **pele (8)**, cabelo (5), destaque por raridade.
- A vetorização (§2.5) marca cada preenchimento com uma **classe de paleta**
  (`c-pele`, `c-roupa`, `c-linha`, `c-metal`…).
- **Recolorir é CSS** — mas só onde recolorir existe. Pela **emenda à D27**, os
  únicos eixos recoloríveis são **pele** e **cabelo** (e a sobrancelha, que segue
  o cabelo). Roupa, uniforme, chapéu, relíquia, pet e fundo têm a cor **assada no
  desenho**, e o `conferirSvg` reprova quem tentar recolori-los. O exemplo
  original desta seção — *"trocar `.c-roupa` muda a cor sem gerar arquivo"* — não
  vale mais: `.c-roupa` é cor fixa.
- **O que a classe de paleta ainda serve:** identificar qual preenchimento é
  pele, para o pipeline saber o que trocar. Por isso a arte de origem precisa de
  **matizes distantes entre pele e pano** — ver a regra 10 da §7b do doc 15.
- **Regra de paleta obrigatória:** cores precisam de separação visual suficiente
  entre si. Medido no experimento: um cabelo `#4a3526` perto demais do contorno
  `#3d2b1f` foi **fundido** na mesma classe e deixou de ser recolorível. Cor que
  se confunde com o contorno também some a 56 px, então a restrição é saudável —
  mas precisa estar escrita, senão vira bug de arte difícil de diagnosticar.

## 2.5 Formato e pipeline de vetorização (D19)

**Decidido por medição**, em `scratchpad/vetor`:

| arte | PNG | SVG | paths | dif@56px |
|---|---|---|---|---|
| pintada (estilo antigo) | 33 KB | **112 KB** | 407 | 7,51 |
| **chapada com contorno duro (alvo)** | 15,5 KB | **4,0 KB** | 9 | **2,39** |

Diferença abaixo de ~3 é imperceptível. Para o estilo escolhido no D1/D3, o SVG
é **4× menor** que o PNG e visualmente idêntico. Para o estilo antigo seria 3,4×
**maior** — daí a primeira decisão errada, tomada contra a arte errada.

**O pipeline, que roda no build e é automatizado:**

```
PNG da IA  →  VTracer  →  encaixe na paleta  →  SVGO  →  SVG com classes
```

- `@neplex/vectorizer` (binding Node do VTracer, Rust/NAPI, O(n) e colorido).
  `potrace` não serve: só aceita preto e branco.
- **O encaixe é indispensável.** O VTracer devolve cores aproximadas (`#e7b889`
  em vez de `#e8b98a`) e quebra uma cor em várias quase-iguais por causa do
  anti-aliasing. Encaixar cada preenchimento na cor mais próxima da paleta
  corrige os dois e funde paths.

**O artista continua desenhando em raster com IA.** A conversão é automática.

**Consequências:**
- um arquivo serve de 56 px a 340 px — acaba o par master 2× / runtime 1×
- `public/items/` sai de 7,2 MB para poucas centenas de KB
- recolorir é CSS, então o D18 sai de graça
- **pets continuam APNG** — animação não migra para este pipeline

---

# 3. Custo de arte

O que **o artista desenha** (o build multiplica):

| o quê | desenhos | arquivos publicados |
|---|---|---|
| Corpo base | **1** | 1 SVG (8 tons + 4 expressões por CSS) |
| Uniformes | **7** | 7 SVG |
| Cabelos | **5** | 5 SVG (5 cores por CSS) |
| Chapéus | **6** | 6 SVG |
| Relíquias | **6** | 6 SVG |
| Pets | **20** | 20 (APNG ou SVG — ver §6.5) |
| Backgrounds | **0** | reaproveita os 8 |
| Molduras | **0** | é CSS |
| Capas | **0** | slot sem arte nesta versão |
| **Total** | **45 desenhos** | **45 arquivos** |

Com SVG + classes de paleta, **desenho e arquivo passam a ser 1:1** — antes, com
PNG, os mesmos 45 desenhos virariam ~90 arquivos por causa das variantes de cor.

**Ressalva honesta:** os 20 pets e os 8 backgrounds existentes são do estilo
antigo. Pets ficam ao lado do boneco, então destoar é visível — por isso contei
os 12 como redesenho. Backgrounds ficam atrás e são menos acoplados ao estilo:
**verificar antes de decidir**; se destoarem, são +8.

Para comparar: **remendar o sistema atual custaria ~60 desenhos** (7 chapéus × 2
gêneros + 8 uniformes × 2 + 30 pets) e entregaria o estilo que você não quer.

---

# 4. Plano de execução

## F0 — Fundação técnica (eu, **não depende de arte**)

Pode começar hoje, em paralelo às suas decisões.

1. **Ponte:** baús passam a sortear só itens que renderizam. O loop de recompensa
   fica honesto **agora**, sem esperar arte. Gate que prova.
2. **Manifesto de assets** (D20): script de build varre `public/items/`, gera
   `assetManifest.ts`. Resolver consulta o manifesto. Item sem asset = erro de
   build. **Gate: injetar um item sem asset e ver o build quebrar.**
3. **Folha de contato** (D23): script que renderiza cada item sobre a base nos 4
   tamanhos e gera uma imagem de revisão.
4. **Página de teste de tamanhos:** você joga um PNG e vê o boneco a 56, 100, 200
   e 340 px, com fundo, moldura e pet.
5. **Pipeline de vetorização** (D19): `raster → VTracer → encaixe na paleta →
   SVGO → SVG com classes`. Você continua desenhando em raster; a conversão é
   automática. Já validado em `scratchpad/vetor`.

6. **Protótipo de proporção (D1):** eu autoro em SVG o mesmo boneco em **1:2,
   1:3 e 1:4** e você escolhe olhando a 56 px — sem desenhar nada. É a decisão
   mais cara de reverter do plano e não deve ser tomada por opinião minha.
7. **Teste do pet em SVG** (§6.5): converter um pet existente e comparar com o
   APNG lado a lado.

**Entregável:** você escolhe a proporção olhando três opções renderizadas, e só
então desenha o primeiro boneco de verdade.

## F1 — Prova de arte (você)

Desenhe **dois arquivos**: o corpo base e o uniforme de Soldado.

**Gate:** na página de teste, os dois lêem bem a **56 px**, o uniforme registra
sobre o corpo nos 8 tons, e a paleta troca as cores sem sujar o contorno.

É aqui que se descobre se a proporção 1:3 e o método de cor funcionam — com 2
desenhos, não com 37.

## F2 — Migration + reescrita do render (eu)

- Migration `avatar_v4` (aditiva): `slot` CHECK += `hair`, `back`;
  `users.avatar_skin`; `user_inventory.source` += `'title'`;
  `update_avatar_identity` substitui `update_avatar_base`; recriar
  `user_public_profiles` com `avatar_skin`.
- Reescrever `bodyFamilies` (anchors sem gênero + offset por item, D24),
  `assetResolver` (lê manifesto), `resolvedAvatar` (**deletar todo o knockout**),
  `AvatarDisplay` (nova pilha de camadas), `constants` (canvas 4:5).
- `types.ts`: remove `GenderVariant`, `dressed_base`, `head_swap`.
- `criar-personagem`: male/female → **tom de pele + cabelo**.
- String canônica (D21).
- **Migração suave:** usuários existentes recebem tom `medio`, mantêm
  `avatar_chosen=true`, sem re-onboarding forçado.

**Gate:** `npm run build`, e2e 149/149, `verify:all` inteiro, e um gate novo que
assere que nenhum item do catálogo está sem asset.

## F3 — Patente → uniforme (maior ROI de produto)

`complete_lesson_step` concede e auto-equipa o uniforme do tier ao subir de
patente, com backfill idempotente por `highest_trail_completed`.

> **Atenção:** nunca copiar o corpo dessa função de migration antiga. Extrair de
> `pg_get_functiondef` do banco **vivo** — e lembrar que ele **não emite o `;`
> final** depois de `$function$`. Foi assim que a curva de XP ficou 4 meses errada.

**Gate:** completar uma trilha veste o uniforme e ele aparece no ranking.

## F4 — Catálogo (você desenha, eu semeio)

Os outros 35 desenhos, em ordem de valor: uniformes → cabelos → chapéus →
relíquias → pets. Migration de reseed leva o catálogo de 77 para 52.

## F5 — Capas e expressões

Só depois do lançamento. O slot `back` já existe desde a F2.

---

# 5. O que muda no código

| arquivo | mudança |
|---|---|
| `src/lib/avatar/constants.ts` | canvas 4:5, `SIZE_CONFIG` novo, z-order |
| `src/lib/avatar/bodyFamilies.ts` | `ESTRATEGISTA_V2`, anchors únicos + offset por item |
| `src/lib/avatar/types.ts` | remove `GenderVariant`, `dressed_base`, `head_swap` |
| `src/lib/avatar/assetResolver.ts` | consulta manifesto em vez de montar caminho |
| `src/lib/avatar/resolvedAvatar.ts` | **deletar knockout inteiro** |
| `src/lib/avatar/renderModes.ts` | `garment`, `head_attach`, `back_attach` |
| `src/lib/avatar/palette.ts` | **novo** — rampas de cor |
| `src/lib/avatar/assetManifest.ts` | **novo, gerado** |
| `src/components/avatar/AvatarDisplay.tsx` | nova pilha de camadas, sem clipPath |
| `src/app/(main)/criar-personagem/` | tom de pele + cabelo |
| `scripts/avatar/gen-palette.ts` | **novo** — gera cores no build |
| `scripts/avatar/gen-manifest.ts` | **novo** |
| `scripts/avatar/contact-sheet.ts` | **novo** — QA visual |
| `scripts/verify/avatar/verify-assets.ts` | **novo gate** — todo item tem asset |

---

# 6. Riscos

| risco | mitigação |
|---|---|
| Registro do uniforme sobre o corpo nos 8 tons | contorno na borda + testar **só no Soldado** antes dos outros 6 (F1) |
| Cor de paleta sujar contorno | contorno em camada não-colorível; geração no build permite inspecionar antes de publicar |
| Arte não ler a 56 px | página de teste na F0, antes de desenhar o resto |
| Pets antigos destoarem | contados como redesenho no orçamento |
| Backgrounds antigos destoarem | **verificar na F1**; se destoarem, +8 desenhos |
| `complete_lesson_step` regredir | extrair de `pg_get_functiondef`; `verify:no-dup-rpc` é ratchet |

---

# 6.5 Pets: APNG ou SVG animado? (reaberto)

Escrevi "animação não migra para este pipeline" e isso repete o erro do D19.
**O projeto já anima por CSS** — o `character-root` faz o respiro do boneco com
`transform`. Um pet balançando é exatamente isso.

Se pets forem SVG animados por CSS, eles entram no mesmo pipeline: recoloração
por paleta, tamanho irrisório, um arquivo por pet.

**Não afirmo que resolve** — animação expressiva (rabo, piscar, pulo) é mais
difícil em CSS que num APNG pré-renderizado. Mas foi descartado sem teste.

**Gate:** na F0, converter **um** pet existente para SVG animado e comparar com
o APNG lado a lado. Se convencer, os 20 pets saem do orçamento de APNG.

# 7. O que fica de fora, deliberadamente

- **Loja, moeda, passe de temporada.** Público infantil de clube escolar, LGPD, e
  o avatar conta mérito, não gasto.
- **Rosto composível, barba, micro-slots.** Invisíveis no tamanho que importa.
- **Motor de animação (Rive/Lottie).** Melhor que APNG, mas é dependência nova e
  formato que IA generativa não produz. Anotado como opção futura.
- **Nada aqui está descartado por custo de arte sem antes checar se uma
  ferramenta elimina o custo.** Foi o erro do D19 (ver §8).
- **Composição no servidor.** Ver D22, com gatilho definido para revisitar.
- **Editor de avatar rico.** Quanto mais eixos a criança combina, mais perto do
  efeito palhaço. A restrição é a qualidade.

---

# 8. Revisão crítica — o padrão de erro a vigiar

O D19 foi decidido errado por um motivo específico, e vale nomear porque ele
reaparece: **eu confundi o formato de ENTRADA com o formato de SAÍDA.** "A IA
gera raster" não impede o produto final ser vetor — só exige um passo de
conversão, que é exatamente o tipo de coisa a automatizar, não a usar como
argumento contrário.

Generalizando: **rejeitar algo por custo, sem antes checar se uma ferramenta
elimina o custo.** Revendo o plano com essa lente, cinco decisões mudaram:

| # | era | virou | o que eu não tinha considerado |
|---|---|---|---|
| D22 | servidor de render com cache | **descartado** | compor SVG é concatenar string: 1 requisição, sem servidor |
| D8 | expressões fora | **4 no lançamento** | rosto em paths = expressão por CSS, zero asset |
| D4 | 5 tons de pele | **8 tons** | classe de paleta: 8 custa o mesmo que 3 |
| D1 | 1:3 por asserção | **medir na F0** | dá para gerar as 3 proporções em SVG e comparar a 56 px |
| pets | APNG, ponto final | **testar SVG+CSS** | o projeto já anima por CSS no `character-root` |

**Capacidade que eu não tinha oferecido:** eu consigo **autorar SVG
diretamente** — o boneco de teste do experimento foi escrito à mão em ~20 linhas.
Isso não substitui personagem desenhado, mas serve para (a) prototipar proporção
sem você desenhar nada e (b) produzir itens geométricos simples (moldura, coroa,
livro, boné). Reduz o que precisa sair do seu prato.

**Regra para o resto do projeto:** antes de cortar escopo por custo de produção,
perguntar "existe ferramenta que faz isso por nós?" — e testar, não supor. O
custo de checar foi de minutos; o custo de não checar teria sido um pipeline
inteiro no formato errado.

---

# 9. Análise crítica do sistema de recompensa

Levantado no banco de produção, não estimado.

## 9.1 Cinco dos sete uniformes seriam impossíveis (D25)

`20260313400000_phase7_block6_titles.sql:41` espera **7 trilhas**:

```
recruta, soldado, aspirante, capitao, comandante, general, mestre
```

O banco tem **2**: `recruta` (15 aulas) e `soldado` (15 aulas). O
`array_position` só acha as duas primeiras, então **nenhum aluno passa de
"Aspirante"** — Capitão, Comandante, General, Grão-Mestre e Lenda são
inalcançáveis hoje, em produção.

Isso não é só conteúdo faltando: **a espinha do avatar v4 se apoiava nisso**.
Eu teria mandado desenhar 5 uniformes que nenhuma criança jamais vestiria.

**Decidido (D25):** a patente passa a ser medida por **aulas concluídas**, não
por trilhas. 30 aulas → 7 tiers (sugestão: 2, 6, 12, 18, 24, 28, 30). As 2
trilhas continuam existindo como organização de conteúdo. Vantagem extra: a
criança vê o progresso subir continuamente, e sabe exatamente o que falta.

**Implementação:** o mesmo bloco de `complete_lesson_step` que hoje faz
`UPDATE user_titles` passa a contar aulas em vez de comparar trilhas. Vale a
regra de sempre: extrair de `pg_get_functiondef` do banco vivo, nunca copiar de
migration antiga.

## 9.2 O plano prometia legibilidade que a mecânica impedia (D26)

Origem dos baús hoje, no banco:

| origem | baús |
|---|---|
| level_up | **61** |
| welcome | 17 |
| daily_missions | 10 |
| streak_bonus | 8 |

A maioria esmagadora vem de subir de nível, com conteúdo **sorteado**. Dois
alunos com os mesmos itens não fizeram as mesmas coisas — então o princípio "o
avatar é o histórico legível do mérito" era falso na prática, exceto pelo
uniforme (travado no tier 2, §9.1) e pelas relíquias.

**Decidido (D26):** separação explícita e sem exceção.

| eixo | o quê | como se ganha | conta história? |
|---|---|---|---|
| **Mérito** | uniforme, relíquia, itens de conquista | determinístico | **sim** |
| **Gosto** | cabelo, fundo, cor, pets comuns | sorteio | não, e tudo bem |

## 9.3 Duplicata e tamanho de catálogo (D13, D29)

Duplicata já vira XP (`20260317100000_duplicate_item_to_xp.sql`) — isso funciona.
O problema é a frequência: com ~31 cosméticos sorteáveis em 4 raridades, são ~8
por raridade, e a partir do 8º baú daquela raridade o retorno vira "XP de novo"
— justo quando a criança está mais engajada.

**Decidido:** (a) catálogo maior onde ficou barato — pets 12 → **20**, a
confirmar após o teste de SVG animado; (b) **baú de escolha** em marcos, com 1
entre 3 (D29). Sem moeda: ficha de troca foi considerada e rejeitada por
contradizer "nunca vender mérito".

## 9.4 Raridade não significava nada (D28)

⛔ **SUPERADO nos números desde 2026-08-13, registrado em 2026-08-23.** A pirâmide
que o banco sorteia é **45 / 30 / 18 / 7**, escrita em
[`20260813160000_b6_bau_da_peca.sql:124-133`](../../supabase/migrations/20260813160000_b6_bau_da_peca.sql#L124-L133)
e cobrada por `verify:chest-pool`. Os 40/30/20/10 abaixo nunca chegaram a existir
no banco. **A decisão de D28 continua de pé** — raro tem de ser raro, e um quarto
do catálogo lendário não é raridade; só a razão mudou. Doc 22 §2 é a fonte da
pirâmide viva, e ela está **em revisão pelo Doug** (as contagens de arte vão variar).

~~Distribuição atual: 19 comuns, 20 raros, 20 épicos, **18 lendários** — um quarto
do catálogo é lendário. Reseed adota pirâmide: **40 / 30 / 20 / 10**.~~

## 9.5 Cor escolhível resolve o "todo mundo igual" (D27)

Numa turma de 30 com catálogo enxuto, os bonecos ficariam parecidos. Com classes
de paleta, **a cor é escolha do aluno** e custa zero: 5 cabelos × 8 cores = 40
visuais a partir de 5 arquivos.

**Uniforme fica com cor fixa** — deixar escolher destruiria a legibilidade da
patente, que é justamente o que o D26 protege.

---

# 10. Onde o avatar aparece (D30)

## O problema, levantado no código

O avatar é renderizado em **duas telas**, e nenhuma é social:

| tela | mostra hoje |
|---|---|
| `/perfil` | **avatar** |
| `/perfil/[userId]` | **avatar** |
| navbar (`layout.tsx:43-47`) | iniciais do nome |
| ranking geral (`RankingClient.tsx:98-101`) | iniciais |
| ranking de turma (`ClassRankingClient.tsx`) | iniciais |
| mural | nada |
| lista de turmas / Companhia | nada |

**Isso invalidaria o investimento do v4.** Cosmético só motiva se for visto: a
criança ganha um Elmo de Cavaleiro que só ela vê, e apenas se lembrar de abrir o
próprio perfil.

Ironia registrada: o D22 foi descartado com o argumento "com SVG, muitos
avatares numa lista saem de graça" — mas **não existe lista nenhuma com avatar**.
Descartei a solução de um problema que ainda não temos, porque nunca colocamos o
avatar onde ele importa.

## Metade já está pronta

`get_ranking` **já devolve `avatar_config`** (verificado via
`pg_get_functiondef`). O servidor manda e o cliente descarta. Para o ranking
geral é mudança **só de UI** — sem migration, sem RPC.

## O avatar É a foto de perfil

Com SVG, o mesmo arquivo serve aos dois enquadramentos — basta trocar o
`viewBox`:

```
viewBox="0 0 400 500"    → corpo inteiro (perfil)
viewBox="90 20 220 220"  → só a cabeça, quadrado (lista, navbar)
```

Mesmo download, dois usos. Em PNG exigiria um segundo asset recortado por item.

**Vantagem de contexto:** numa plataforma infantil, o avatar **substitui a foto
real** — sem upload de imagem de criança, sem consentimento de imagem, sem
moderação. Um problema de LGPD que deixa de existir.

## Plano

| tela | vira | custo |
|---|---|---|
| navbar | cabeça, 32 px | UI |
| ranking geral | cabeça + moldura, 40 px | **só UI** (dados já chegam) |
| ranking de turma | cabeça + moldura | UI + conferir RPC |
| mural | cabeça, 32 px | UI + incluir no feed |
| Companhia | corpo inteiro (`sm`) | UI + conferir RPC |

**A moldura no ranking é o melhor retorno do plano inteiro:** é CSS puro, custo
de arte zero, e é onde raridade vira status social visível.

Entra na **F2**, junto com a reescrita do render — as telas já serão tocadas.
