# A esteira do TRAJE, comando a comando

*Escrita em 2026-08-12, quando a primeira peça de traje passou pela rota
(`traje-soldado-farda`). A rota nasceu para cabelo; esta é a metade dela que muda.*

> ### ⚠️ EMENDA DE 2026-08-20 — arte NOVA sai em RASTER
>
> **O invólucro continua `.svg` e a colagem não mudou.** O que muda é o conteúdo:
> em vez de centenas de paths chapados, **um `<image>` WEBP q82** com o recorte
> inteiro. Medido: gambesão **228,2 KB → 20,0 KB**; farda **152,0 → 21,9 KB**.
>
> **Por quê:** peça de cor assada não é pintada pelo compositor — ele só a cola.
> Traçá-la é converter raster em polígonos para imitar de volta o tom que o raster
> já tinha: custa peso e perde desenho.
>
> **⚠️ `traje-farda` e `traje-gambesao` NÃO se regeneram.** Estão congeladas no
> vetor (`CONGELADAS_NO_VETOR`, `traje.ts`) — já aprovadas pelo Doug, e o ganho
> seria de custo, não de qualidade. A trava é mecânica porque `arte:trajes --check`
> reescreve os `.svg` mesmo em `--check`. Quem decide o braço é `formatoDoTraje(slug)`.
>
> Detalhe na §12 do runbook.

> ### ⚠️ EMENDA DE 2026-08-13 — leia antes de qualquer passo daqui
>
> A esteira mudou em quatro pontos, e o texto abaixo ainda descreve os antigos.
> **Onde divergir, esta caixa vence.** O detalhe está na §12 do runbook.
>
> 1. **A arte chega em COR FINAL.** O ciano instrumental saiu do
>    `PEDIDO-TRAJE.md`, e o passo 4 (`arte:traje`) **não recolore mais nada** — ele
>    só recorta. A cor que a artista pintou é a que vai à tela.
> 2. **A peça é reconhecida por DIFERENÇA contra a base**, restrita ao campo do
>    traje (`noCampoDoTraje` em `base.ts`: queixo em cima, +26 u dos lados, +18 u
>    abaixo da base do tronco), mais salpico e conectividade.
> 3. **O slug perdeu a patente:** `traje-<nome>`, não `traje-<patente>-<nome>`.
>    `traje-soldado-farda` virou `traje-farda`.
> 4. **O controle negativo é outro:** extrair a **própria base** tem de devolver
>    **0 px**. O controle antigo (remedir a luminância de cada papel) vigiava a
>    recolorização e morreu com ela.
>
> **Uma peça ainda se recolore:** a `traje-farda`, em `COR_FINAL_DECLARADA`
> (`traje.ts`), porque ela foi desenhada em ciano e o que o Doug aprovou foi o
> oliva. É resíduo de transição, não mecanismo — arte nova não entra ali.
>
> **E o Gate −1 mudou antes de tudo:** ele tira do alvo do registro o que a peça
> escureceu na faixa de rodapé (achado **G19**, fechado). Sem isso nenhum traje com
> barra passa.

O runbook do processo é
[docs/avatar/19-rota-de-arte-runbook.md](../../../../docs/avatar/19-rota-de-arte-runbook.md);
o registro de execução, com cada número medido, é
[ESTADO-DA-ROTA.md](../../../../scripts/avatar/arte/ESTADO-DA-ROTA.md).

---

## 1. Os dez passos, contra os do cabelo

Quatro passos são idênticos, e isso é o ponto: quem sabe a rota do cabelo sabe
esta.

| # | passo | cabelo | **traje** |
|---|---|---|---|
| 0 | base de edição | `arte:base` | **`arte:base-tronco`** (a mesma base, o campo medido) |
| 1 | o pedido | `PEDIDO-GEMINI.md` | **`PEDIDO-TRAJE.md`** |
| 2 | Gate −1 | `arte:gate` | **igual, sem mudança** |
| 3 | extração | `arte:extrair` | **igual, sem mudança** |
| 4 | a peça | `arte:contorno` → `arte:converter` → `arte:espessura` | **`arte:traje`** |
| 5 | o literal | `arte:pecas` | **`arte:trajes`** |
| 6 | o `--check` no CI | `arte:pecas --check` | **`arte:trajes --check`** |
| 7 | a folha | `arte:folha` | **`arte:folha-traje`** |
| 7b | **a conferência** | **eu, antes do Doug** — teto de 2 min | **igual** |
| 8 | o parecer | o Doug | o Doug |
| 9 | promoção | `CABELOS` | `TRAJES` + seed do banco |

```
npm run arte:base-tronco                                    # olhe o campo uma vez
# o Doug desenha no Gemini, pelo PEDIDO-TRAJE.md
npm run arte:gate       -- scripts/avatar/arte/<SLUG>.png
npm run arte:extrair    -- scripts/avatar/arte/<SLUG>.png
npm run arte:traje      -- scripts/avatar/arte/<SLUG>.png   # recolore + recorta
npm run arte:trajes                                         # gera o literal
npm run arte:folha-traje                                    # a folha, N peças
# a CONFERÊNCIA: eu olho a folha contra o PNG antes do Doug — SKILL.md, teto 2 min
```

**Os passos 2 e 3 não precisaram de nenhuma mudança**, e isso foi surpresa. Eu
tinha planejado inverter `REGIOES_QUE_REPROVAM` (que protege `rosto` e `corpo`)
porque no traje o corpo é o campo. Não foi preciso: a regra do Bloco 12 atribuiu
**99,1%** do que mudou à própria peça e o Gate −1 aprovou de primeira. A inversão
só entra se alguma arte reprovar por ela.

## 2. O que só existe no traje

**A cor vem da régua, não do desenho.** O slug é `traje-<patente>-<nome>`, e
`arte:traje` lê o pano em `scripts/avatar/patentes.ts` (`PATENTES`), travado por
`verify:paleta-patentes`. Nenhum hexadecimal escrito à mão, e as três opções de uma
patente saem no mesmo pano **por construção** — que é a regra 14 do doc 15. Aprendiz
não está em `PATENTES` (começa no tier 1) e cai em `TRAJE_BASE.roupa`.

**A razão de tom vem da arte.** Sombra e luz não se escolhem: saem da razão de
luminância que a artista pôs no ciano. Medido na primeira peça: sombra **0,3290 ×**
massa, luz **1,5506 ×**.

**A luz mistura com branco, não multiplica.** Multiplicar estoura o canal em pano
claro — o Mestre (`#AEBCCE`) × 1,55 vira branco e perde o matiz. A mistura acerta a
luminância alvo exatamente. É o que o produto já faz com `.kk-luz` (branco com
opacidade).

**A colagem é conta.** `escalaMedida` fica **ausente** — o campo diz "nunca escrita
à mão" e o auto-ajuste que a produziria não existe em código. Com ela ausente,
`k = 1` e o `<image>` ocupa o `viewBox` inteiro, que na base de edição é o retângulo
px 212→812 × 92→932 = **600 × 840**, 5:7 cravado. Recortar ali põe a peça 1 : 1.

**O transbordo é obrigatório, com alvo medido — e é diretriz, não preferência.**
Decisão do Doug em 2026-08-12: *"deve passar da silhueta, que nem a primeira arte.
isso deve ser padrão e diretriz"*. A farda mediu **10,75%** em `ALÉM DA SILHUETA`;
é o **alvo**, não o teto de tolerância. Peça perto de zero ali reprova sozinha,
mesmo com o resto verde. Ela passa em **três lugares e nos três** — barra, lateral
do alto, lateral da cintura —, com teto de 21 px na barra e 31 px por lado. **O
pedido não pode dizer "na dúvida, passe menos"**: foi essa frase que produziu a
rodada de transbordo zero, porque gerador em dúvida passa zero.

**E o outro lado: a roupa não abre para fora embaixo — mas isso é critério de
aceitação, não texto de prompt.** Decisão do Doug de 2026-08-12: *"não precisa dizer
isso no prompt, pois as artes já vêm sem abrir para fora por baixo"*. Quem manda na
forma geral é o boneco; a roupa engrossa a borda dele. ⚠️ **A régua para isso não
existe:** a tabela de folgas mede cintura (31 px), ombro (46 px) e a descida da
barra (21 px), e **não** a largura na altura da barra — justo onde o corpo curva
para dentro e pano pendurado não acompanha. Aplicar o teto da cintura ali é
inventar régua, e foi o que eu fiz na 2ª rodada do gambesão: chamei de "virou
vestido" uma peça que media **+20/+23 na cintura, dentro do teto**.

**O nome é a única coisa que uma pessoa escreve.** `NOMES` em `trajes.ts`, uma linha
por peça. Arte sem nome **reprova** em vez de inventar "Traje Soldado Farda".

## 3. As três ressalvas do Doug, e o que cada uma virou

Ele reprovou a primeira folha em três pontos, todos com o olho, todos antes da
régua. **As três valem para toda peça nova.**

### 3.1 "a roupa passa da silhueta, e você eliminou isso"

A arte era desenhada **dentro** do `clipPath` do tronco, então tudo que passava era
cortado: 5 767 px, dos quais 1 497 de sombra e luz sumiam de verdade. Com eles ia
embora o transbordo que faz roupa parecer roupa (doc 21 §6.1).

**Conserto:** `arteDoTraje()` emite o `<image>` **fora do clip**, depois do contorno
do tronco. Medido depois: **95,38% da arte visível**, e só a cabeça esconde.

### 3.2 "a sombra do corpo ficou por cima da roupa"

`pathSombraQueixoTronco()` e `pathPlanoLateralTronco()` eram desenhados depois da
arte. Foram feitos para o macacão **chapado** da base, que não tem volume de si; uma
arte de traje traz o próprio, e as duas por cima **dobravam o sombreado**.

**Conserto:** quem tem `tinta.png` não recebe sombra nenhuma do compositor. Medido:
1 933 px repintados → **10 px**. O `PEDIDO-TRAJE.md` passou a pedir o contrário do
que pedia: a arte desenha o próprio volume, **inclusive a sombra sob o queixo**.

### 3.3 "o contorno do tronco briga com o do PNG" — e o conserto foi REVERTIDO

Duas saídas foram tentadas e as duas reprovaram na tela:

1. **tirar o traço do tronco quando há arte** → a borda caiu para p50 **7,5 u**, com
   51,6% do perímetro abaixo de 8 u, contra os 11,7 u limpos da referência;
2. **reconstruir a banda no PNG** com um anel de `TRACO/2` → subiu para p50
   **15,0 u**, um quarto mais pesada que o contorno da cabeça. O Doug: *"regrediu e
   muito, deixa a borda como estava"*.

**Fica como estava: o compositor desenha o traço do tronco, sempre.** A causa real —
a extração entrega o miolo do traço, não o traço — está registrada como **G17** em
`docs/achados.md`, e não se conserta aqui. Ela só morde quando uma peça transbordar
muito, porque ali o contorno externo é o da arte.

## 4. O que a folha mede, e o controle de cada número

`arte:folha-traje` desenha 4 seções — tamanhos, os 4 fundos a 56 px, close do
tronco, e o traje sob os 6 cabelos. **A coluna "sem traje" é o controle negativo em
todas**: se a peça não colou, as duas ficam idênticas e a distinção dá zero.

No terminal, nunca na imagem (doc 19 §11):

| número | o que ele responde | referência |
|---|---|---|
| **registro pelo traço** | a peça caiu no pixel certo? | máximo em (0,0), e o 2º lugar tem de ficar atrás |
| onde foi parar o desenho | visível / atrás da cabeça / sob o traço / repintado / além da silhueta | repintado ≈ 0 |
| distinção × sem traje a 56 px | a peça lê no ranking? | piso de 5% (`folha-base.ts:185`) |
| distinção entre peças | duas opções da mesma patente separam? | piso de 5% |
| orçamento | formas e bytes | `<image>` custa **0 formas** |

**A busca de registro corre sobre o TRAÇO da peça, não sobre a massa** — e isso
custou uma rodada. Casando o desenho inteiro, a régua devolveu (−2, 0) numa peça que
estava em (0, 0): a massa de um traje é uma mancha larga e chapada, e deslocá-la 2 px
muda uma fração do total. Régua que devolve quase o mesmo número para posições
diferentes é *o* modo de falha desta rota. As linhas pretas são finas e de contraste
máximo — um pixel de desvio já derruba a concordância. **A régua imprime a distância
para o 2º colocado, e declara empate se ela for menor que 2%.**

## 5. Os números da primeira peça, para comparar com a próxima

`traje-soldado-farda`, 2026-08-12:

| | |
|---|---|
| Gate −1 | APROVADA · deslocamento 0/0 px · escala 100,00% · rosto forma 0 |
| extração | 99 167 px · 1 componente · 0 descartadas · matizes 180/181/179° |
| recolorização | os 4 papéis dentro do teto de quantização (±0,50 nível) |
| PNG da peça | **9,9 KB**, 600 × 840 |
| registro | **(0, 0)**, 2º lugar 19,9% atrás |
| visível | **95,38%** |
| transbordo | 10,75% da arte além da silhueta |
| distinção × sem traje | **38,93%** (piso 5%) |
| orçamento | **−2 formas, −1 294 bytes** (as sombras do sistema saem) |

## 6. As asserções negativas, que são o trabalho

Peça nova não pode mover o que já está congelado:

- `npm run avatar:folha-base` em **19 formas / 7 468 bytes**, exatos. Se andarem, a
  mudança vazou para o caso **sem traje** — isso é achado, não rebase;
- os **11 selos** de `parametrico-congelado.ts` verdes. Eles assam
  `TRAJE_BASE.roupa`: "harmonizar" essa cor moveria os 11 de uma vez;
- **497 testes** parados;
- `npm run arte:trajes -- --check` conferindo caractere a caractere;
- `verify:catalogo-slots` verde — e enquanto a peça não for promovida, ele tem de
  seguir dizendo **"vazio dos dois lados"**.

## 7. A promoção — o que ainda falta, e não é pouco

O catálogo e o banco **andam juntos**: `verify:catalogo-slots` compara os conjuntos
de slugs slot a slot, nos dois sentidos. Promover exige, na mesma passada:

1. ~~`TRAJES` em `src/lib/avatar/catalogo.ts` + `CATALOGO.traje` derivado de
   `Object.keys()`~~ ✅ **fechado no B5** — `catalogo.ts:69`;
2. ~~a seed no banco — a migration `20260812120000` semeia **9 slugs** e precisa ser
   reescrita para semear só os que têm arte~~ ✅ **fechado no B5** —
   `20260813140000_b5_vitrine_do_traje.sql` semeia 2, e `verify:catalogo-slots`
   confirma *"slot traje: 2 slug(s) iguais dos dois lados"*;
3. ~~**`AvatarKokeshi` não tem prop `traje`**~~ ✅ **fechado no B5** — `trajeDe()` e o
   repasse em `svgDoAluno`; o `/perfil`, o `/criar-personagem`, o
   `EditorDeAparencia` e o `ChestOpeningModal` passam a peça;
4. ~~`useUser` não lê `avatar_traje`~~ ✅ **fechado em 2026-08-13**. Nenhuma tela
   consome ainda — as três que desenham o boneco inteiro recebem o slug por prop do
   Server Component, que é o caminho certo. Os outros quatro slots existem na mesma
   tabela e entram quando tiverem arte;
5. ~~o teste que não existe: o análogo de `pecas-de-elenco.test.ts` para traje~~
   ✅ **fechado em 2026-08-13** — `estilo/__tests__/traje-de-elenco.test.ts`, 9
   asserções. Ele carrega o que o análogo do chapéu não tem: a supressão da sombra
   do queixo e do plano lateral é **do campo `tinta.png` declarado, não do arquivo
   existindo**, e é isso que fez o endereço errado virar boneco sem volume em
   silêncio. **A âncora do "ausente não muda nada" é a contagem de formas
   congelada (19 sem traje / 17 com arte)**, medida por dois programas de fora —
   `avatar:folha-base` e `arte:folha-traje`. A primeira versão comparava
   `compor()` com `compor()` e uma mutação provou que ela não podia falhar;
6. ~~o PNG sai de `public/dev/traje/` (ignorado pelo git) para o endereço
   definitivo~~ ✅ **fechado em 2026-08-13**. O endereço é **`public/items/traje/`**,
   e os PNGs são **versionados**, pelo precedente do livro de aberturas
   (`public/chess/`, 875 KB gerados e commitados). `PASTA_TRAJE` já escreve lá, e
   `src/lib/avatar/__tests__/pngDaPecaNoDeploy.test.ts` cobra peça a peça: existe no
   disco, é rastreada pelo git (**rastreado = vai no deploy**), e não mora em
   `public/dev/`. **Depois de `arte:trajes`, `git add` o PNG.**
