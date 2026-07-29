# Avatar — Checklist de Decisões (redesenho)

> **Como usar:** cada decisão tem opções, minha recomendação e o custo de mudar
> depois. Escreva sua escolha na linha `DECISÃO:` e marque o `[x]`. Nada de arte
> antes do Bloco 3 estar fechado.
>
> **Status deste documento:** rascunho de decisão. Quando fechado, ele altera o
> `10-avatar-v3-definitive.md` nos pontos de canvas e catálogo — o resto do v3
> (corpo único, `garment`, knockout deletado, server-authority) **permanece**.

## Por que agora

- **Só existem contas de teste.** Nenhum aluno perde item.
- **Toda a arte é placeholder.** Retrabalho ≈ zero.
- **Canvas está centralizado** em `src/lib/avatar/constants.ts:13-16` e
  `SIZE_CONFIG`; anchors em `bodyFamilies.ts`. Só 6 arquivos tocam dimensão.

Depois do lançamento, cada uma destas decisões vira migração de dados.

## Painel

| # | Decisão | Bloqueia | Status |
|---|---|---|---|
| D1 | Proporção cabeça/corpo | tudo | [ ] |
| D2 | Canvas e formato | tudo | [ ] |
| D3 | Pose | itens | [ ] |
| D4 | Tons de pele | base | [ ] |
| D5 | Cabelo: baked ou slot | base + itens | [ ] |
| D6 | Quais slots existem | volume de arte | [ ] |
| D7 | Capa (`back`) entra agora? | volume de arte | [ ] |
| D8 | Expressões de runtime | polimento | [ ] |
| D9 | Uniformes — quantos tiers | arte | [ ] |
| D10 | Chapéus — quantos | arte | [ ] |
| D11 | Cabelos — quantos | arte | [ ] |
| D12 | Relíquias (mão) — quantas | arte | [ ] |
| D13 | **Pets — quantos (hoje 37)** | **maior custo** | [ ] |
| D14 | Backgrounds — manter 8? | arte | [ ] |
| D15 | Frames — manter 8? | nada (é CSS) | [ ] |
| D16 | Baús sorteiam o quê | regra | [ ] |
| D17 | Raridade = o quê visualmente | regra | [ ] |
| **D18** | **Cor por asset ou por paleta** | **volume de arte** | [ ] |
| **D19** | **PNG ou SVG** | formato de tudo | [ ] |
| D20 | Manifesto de assets no build | detecção | [ ] |
| D21 | String canônica do avatar | cache, compartilhar | [ ] |
| D22 | Composição no servidor para listas | performance mobile | [ ] |
| D23 | Folha de contato automática (QA) | qualidade da arte | [ ] |
| D24 | Offset de anchor por item | encaixe | [ ] |

---

# Bloco 1 — Fundação visual (bloqueia tudo)

## D1 — Quão cabeçudo?

Medida usual: quantas "cabeças" cabem na altura total do boneco.

**Opções**
- **A) 1:2 — super deformado.** Cabeça = metade da altura. Máxima leitura em
  tamanho pequeno, mínimo espaço de corpo.
- **B) 1:3 — chibi clássico.** Cabeça = um terço. Equilíbrio entre leitura e
  espaço de corpo.
- **C) 1:4 — levemente estilizado.** Perto do atual, mais elegante, pior em 56px.

**Recomendo: B (1:3).** O motivo não é estética, é o **uniforme**: ele é a
espinha da progressão — o aluno sobe de patente e o corpo muda. Em 1:2 quase não
sobra torso para o uniforme aparecer, e você mata a mecânica central para ganhar
legibilidade que 1:3 já entrega.

**Se mudar depois:** redesenha 100% do acervo.

**DECISÃO:** _(em aberto)_

---

## D2 — Canvas e formato

Hoje: **5:7** (400×560 em runtime), tamanhos `sm` 56×78, `md` 100×140,
`lg` 200×280, `xl` 340×476.

**Opções**
- **A) Manter 5:7.** Zero mexida em layout. Mas sobra espaço vertical vazio com
  corpo curto — o boneco fica pequeno dentro do quadro.
- **B) 4:5** (ex. 400×500). Mais compacto, boneco ocupa mais do quadro.
- **C) 1:1** (quadrado). Máximo aproveitamento para chibi; muda mais o layout.

**Recomendo: B (4:5).** Acompanha o corpo mais curto sem virar quadrado — e
quadrado tende a parecer ícone de app, não personagem.

**Se mudar depois:** barato em código (2 constantes), caro em arte. Também mexe
no espaço reservado em `/perfil`, `/ranking` e nos cards de turma — ajuste de
layout, não reescrita.

**DECISÃO:** _(em aberto)_

---

## D3 — Pose

**Opções**
- **A) Frontal simétrica.** Personagem de frente, braços ao corpo.
- **B) Três-quartos.** Levemente virado, mais vida.

**Recomendo: A (frontal).** Simetria é o que faz overlay simples funcionar: o
chapéu assenta no centro, a manga bate no braço, a relíquia na mão. Três-quartos
obriga cada item a ser desenhado em perspectiva — e é justamente o que hoje
força `head_swap` e `dressed_base` a existirem. Vida vem da animação de respiro
que já existe, não da pose.

**Se mudar depois:** redesenha todos os itens que tocam o corpo.

**DECISÃO:** _(em aberto)_

---

## D4 — Tons de pele

**Opções**
- **A) 5 tons** (claro → escuro), como o v3 propõe.
- **B) 3 tons.**
- **C) 6+ tons.**

**Recomendo: A (5).** Custo total e definitivo é **5 PNGs** — o eixo nunca
multiplica item nenhum, desde que as mangas terminem no punho e as mãos sejam do
corpo-base. Com corpo único, tom de pele + cabelo são a identidade inteira do
aluno; 3 é pouco para um clube de escola pública.

**Se mudar depois:** adicionar tom = 1 PNG. É a decisão mais barata de reverter
da lista.

**DECISÃO:** _(em aberto)_

---

## D5 — Cabelo: desenhado na base ou item separado?

**Opções**
- **A) Cabelo curto baked na base + slot `hair` para variações.** (proposta v3)
- **B) Só baked.** Sem slot de cabelo; identidade = tom de pele apenas.
- **C) Só slot.** Base careca; todo mundo precisa equipar cabelo.

**Recomendo: A.** O baked garante que ninguém apareça careca por 404, e o slot
dá o eixo de identidade. **C é ruim** porque cria um estado inicial esquisito e
força o onboarding a escolher cabelo antes de jogar.

**Se mudar depois:** de A para B é grátis (some o slot). De B para A exige
redesenhar a base.

**DECISÃO:** _(em aberto)_

---

# Bloco 2 — Camadas (cada camada é um eixo de QA)

## D6 — Quais slots existem

Proposta do v3, para você cortar:

| slot | o que é | custo |
|---|---|---|
| `background` | cenário atrás | **já existe e funciona (8 itens)** |
| `back` | capa / estandarte | slot novo |
| `outfit` | uniforme de patente | arte nova |
| `hair` | cabelo | slot novo |
| `head` | chapéu / adorno | existe, redesenhar |
| `hand` | relíquia | **já existe e funciona (8 itens)** |
| `pet` | bichinho animado | existe, 7 de 37 com arte |
| `frame` | moldura | **CSS, custo zero (8 itens)** |

**Recomendo:** manter os 8. Nenhum é gordura — e três deles (`background`,
`hand`, `frame`) já funcionam hoje, então cortá-los seria jogar fora arte pronta.

**O que eu NÃO recomendo criar:** botas, luvas, cinto, colar, ombreira, lenço.
Em 56px são invisíveis, e cada um multiplica a matriz de QA. Viram detalhe
desenhado dentro do uniforme de cada patente.

**Se mudar depois:** cortar slot é fácil; **adicionar slot depois obriga a
revisar todo item das outras camadas** (conflito visual).

**DECISÃO:** _(em aberto)_

---

## D7 — Capa (`back`) entra no lançamento?

**Opções**
- **A) Slot no schema agora, arte depois.** Existe quando você quiser, sem
  custar arte no caminho crítico.
- **B) Slot + 3-4 capas no lançamento.**
- **C) Nem slot nem arte.**

**Recomendo: A.** Capa é o item mais legível que existe em chibi — vale muito
visualmente. Mas é o único slot totalmente novo, e adicioná-lo depois é o caso
caro do D6. Criar a coluna agora custa uma linha de migration.

**DECISÃO:** _(em aberto)_

---

## D8 — Expressões de runtime (sorriso ao vencer, concentração)

**Opções**
- **A) Fora do lançamento.**
- **B) 3-4 expressões, só nos tamanhos grandes.**

**Recomendo: A.** É polimento genuíno, mas não é o que quebra hoje. Entra depois
que o loop de recompensa estiver funcionando.

**DECISÃO:** _(em aberto)_

---

# Bloco 3 — Catálogo (define o volume de arte)

> Hoje: **77 itens, 45 não aparecem no boneco.** Os números abaixo são o que eu
> defenderia. Corte à vontade — o asset mais barato é o que não se desenha.

## D9 — Uniformes (`outfit`)

**Recomendo: 7** — um por patente (Soldado → Lenda). É a espinha do mérito: o
aluno completa uma trilha, sobe de patente, e o boneco muda sozinho. Não é
cosmético, é o placar da jornada.

Observação: **não existe uniforme de Aprendiz** — o traje inicial é desenhado na
própria base. Isso resolve "todos começam iguais" de graça e evita boneco pelado
quando falta arte.

**DECISÃO:** _(em aberto)_

---

## D10 — Chapéus (`head`)

Hoje: 8 no banco, **1 aparece**.

**Recomendo: 6.** Lê muito bem em cabeça grande. Corte os genéricos e mantenha
os que contam história (boné de peão, elmo, coroa).

**DECISÃO:** _(em aberto)_

---

## D11 — Cabelos (`hair`)

Slot novo.

**Recomendo: 5.** Com corpo único, cabelo é o principal eixo de identidade.
Formas simples e distintas (curto, cacheado, trança, coque, moicano) — em chibi,
silhueta importa mais que fio.

**DECISÃO:** _(em aberto)_

---

## D12 — Relíquias (`hand`)

Hoje: 8 no banco, **todas aparecem**.

**Recomendo: 6** — 2 famílias de 3 tiers (ex.: Livro do Estrategista I/II/III e
Peça do Rei I/II/III), ganhas por marcos de aprendizado. "Evoluir no lugar" é
uma linha nova em `items` + config, sem tabela nova.

**DECISÃO:** _(em aberto)_

---

## D13 — Pets — a maior decisão de custo

Hoje: **37 no banco, 7 com arte, 30 sem.** Pet é APNG animado — o asset mais
caro do projeto.

**Opções**
- **A) 12 pets** (mantém os 7 que existem + 5 novos).
- **B) 20 pets.**
- **C) Manter 37.**

**Recomendo: A (12).** Cortar 25 animações é a maior economia disponível, e
ninguém sente falta: com 12, o aluno ainda leva meses para completar. 37 é
catálogo de free-to-play, não de clube de xadrez.

**DECISÃO:** _(em aberto)_

---

## D14 — Backgrounds

Hoje: 8, **todos funcionam**.

**Recomendo: manter os 8.** Custo zero. Se o estilo novo destoar deles, aí sim
redesenha — mas confira antes, pode ser que combinem.

**DECISÃO:** _(em aberto)_

---

## D15 — Frames

Hoje: 8, **todos funcionam**, e são **CSS puro** — não usam imagem nenhuma.

**Recomendo: manter.** Custo de arte literalmente zero.

**DECISÃO:** _(em aberto)_

---

# Bloco 4 — Regras do sistema

## D16 — O que os baús sorteiam

**Recomendo:** baú sorteia **equipamento estético** (chapéu, cabelo, background,
pet, capa). **Nunca uniforme nem relíquia** — esses são mérito, não sorte. Se
caírem em baú, o boneco deixa de contar a história do aluno.

**DECISÃO:** _(em aberto)_

---

## D17 — O que raridade significa visualmente

**Recomendo:** raridade = **acabamento**, nunca volume. Um item lendário tem
material e detalhe melhores no mesmo espaço; não tem mais espinhos, brilho nem
penduricalho. É a regra que impede o efeito palhaço quando o aluno equipa 4
coisas ao mesmo tempo.

Brilho fica só na moldura (que é CSS e não toca o boneco).

**DECISÃO:** _(em aberto)_

---

## D18 — Cor: um asset por cor, ou uma camada colorível?

O doc 10 §4.1 proíbe cor por paleta ("tint sobre flat colors + contorno #3d2b1f
= sujeira, QA impossível"). **Essa regra está mais forte do que deveria.**

A objeção é válida contra **um método específico**: `hue-rotate` do CSS na
imagem inteira, que rotaciona o matiz do contorno junto e suja tudo. Não é
válida contra o método profissional: **separar o que é colorível do que não é**.
Contorno e sombra ficam numa camada não-colorível; só o preenchimento recebe
cor. É literalmente o campo `colorable` do `figuredata` do Habbo, que roda assim
para dezenas de milhões de avatares infantis há duas décadas.

Arte chapada com contorno duro — o estilo escolhido no D1/D3 — é o caso ideal
para isso. Quem sofre com tint é arte com gradiente e textura.

**Opções**
- **A) Um asset por cor.** Como o doc 10 manda hoje. 5 cabelos × 5 cores = 25
  arquivos.
- **B) Camada colorível, cor aplicada no navegador.** 5 arquivos + paleta. Exige
  código de composição (canvas ou SVG) e QA de contorno.
- **C) Camada colorível, cores geradas no build.** O artista desenha 1 arquivo;
  um script lê a paleta e cospe os N PNGs coloridos. O navegador recebe PNG
  comum — zero código de tint, zero risco em runtime, zero custo de
  performance. Trocar uma cor feia = mudar uma linha e regerar.

**Recomendo: C.** Fica com a economia de arte de B e o risco de A. `sharp` já
está disponível no projeto (veio junto com o Next), então é um script curto.

**O que está em jogo:**

| | por asset (A) | colorível (B ou C) |
|---|---|---|
| 5 cabelos × 5 cores | 25 | 5 |
| 7 uniformes × 3 cores | 21 | 7 |
| 4 capas × 5 cores | 20 | 4 |

A variedade percebida pela criança é a mesma. O custo é 5× menor.

**Se mudar depois:** de A para C exige redesenhar separando contorno de
preenchimento. Decidir antes de desenhar é o barato.

**DECISÃO:** _(em aberto)_

---

## D19 — Formato: PNG ou SVG?

Para arte achatada, com cor chapada e contorno duro, **SVG é tecnicamente
superior**:

- nítido de 56 px a 340 px com **um arquivo só** (hoje mantém-se master 2× +
  runtime 1×)
- recolorir é atributo `fill`, não processamento de imagem — o D18 sai de graça
- peso irrisório: `public/items/` tem **7,2 MB** de PNG hoje

**O contra é real:** seu pipeline de arte é de IA generativa, que produz raster.
Converter PNG → SVG automaticamente dá resultado ruim quando há nuance. E pets
são APNG animado, que não migram.

**Recomendo:** não decidir no abstrato. No primeiro boneco de teste, faça uma
versão em cada formato e compare **a 56 px**. Se o estilo for chapado o bastante
para vetorizar bem, o ganho é grande. Se não for, PNG + D18(C) já resolve o
essencial.

**Possível meio-termo:** SVG para o que é geométrico e chapado (molduras,
backgrounds, talvez uniformes); PNG para o que tem nuance; APNG para pets.

**DECISÃO:** _(em aberto)_

---

# Bloco 5 — Arquitetura profissional

> Estas cinco não mudam a arte; mudam o que separa um sistema amador de um
> profissional. Referência: Habbo/Club Penguin — não "AAA", que significa 3D com
> morph targets e economia de cosméticos, coisas que este projeto rejeitou por
> boas razões (público infantil de clube escolar, LGPD, mérito ≠ gasto).

## D20 — Manifesto de assets gerado no build

**O problema, medido:** o resolver monta o caminho por convenção
(`{slug}-swap-{gender}.png`). Arquivo ausente = 404 = `AvatarLayer` devolve
`null` **em silêncio**. Foi assim que **45 dos 77 itens** ficaram invisíveis sem
ninguém notar.

**Como o profissional resolve:** o Habbo tem o `figuredata` — um arquivo de
dados que **declara** o que existe. O renderizador consulta o registro; não
chuta caminho.

**Proposta:** script de build varre `public/items/` e gera `assetManifest.ts`. O
resolver consulta o manifesto. **Item de catálogo sem asset = erro de build.**

Mesmo princípio dos 11 gates do CI: transformar falha silenciosa em barulhenta.
É a mudança de maior valor desta lista.

**Recomendo: fazer.** Custo ~1 sessão.

**DECISÃO:** _(em aberto)_

---

## D21 — String canônica do avatar

Hoje o estado vive espalhado em linhas de `user_equipped` + JSON `avatar_config`.
O Habbo usa uma string determinística: `hd-180-1.hr-110-61.ch-210-66`.

**Dá:** chave de cache natural, avatar compartilhável por link, estado debugável
numa olhada, e habilita o D22.

**Recomendo: fazer** — é derivada do que já existe, não é schema novo.

**DECISÃO:** _(em aberto)_

---

## D22 — Composição no servidor, com cache, para tamanhos pequenos

**O problema:** ranking com 20 alunos × 5 camadas = **100 requisições de
imagem**, em celular Android barato e wi-fi de escola. O projeto é mobile-first.

**Como o profissional resolve:** o servidor compõe, renderiza e cacheia
(`habbo-imaging` faz exatamente isso).

**Proposta contida:** rota que recebe a string do D21 e devolve PNG composto,
cacheado. Usar **só em `sm`/`md`** (ranking, mural, cards de turma). Em
`lg`/`xl` continua em camadas no cliente, onde existe animação.

**Honestidade:** é o único dos cinco que pode ser prematuro para ~100 alunos. Se
a lista de ranking estiver fluida no celular mais fraco disponível, adie.

**DECISÃO:** _(em aberto)_

---

## D23 — Folha de contato automática para QA de arte

Script que renderiza **cada item sobre a base**, nos 4 tamanhos, e gera uma
única imagem de revisão. Estúdios fazem isso; é como se revisa 34 assets sem
abrir 34 arquivos.

Pega desalinhamento, item que some no tamanho pequeno e cor fora da paleta
**antes** de chegar ao aluno. Roda com o `sharp` que já está no projeto.

**Recomendo: fazer** junto com o D20 — os dois leem o mesmo manifesto.

**DECISÃO:** _(em aberto)_

---

## D24 — Offset de anchor por item

Hoje anchors são por slot. Sistemas de paper doll guardam pivô **por peça**,
porque um chapéu alto e um boné não assentam no mesmo ponto.

**Proposta:** manter anchor por slot como padrão + campo opcional de offset por
item na config TS. Zero mudança de schema.

**Recomendo: fazer** — é barato agora e evita redesenhar arte para compensar
encaixe.

**DECISÃO:** _(em aberto)_

---

# Resumo do custo, se você seguir todas as recomendações

| item | assets novos |
|---|---|
| Corpo base × 5 tons | 5 |
| Uniformes | 7 |
| Chapéus | 6 |
| Cabelos | 5 |
| Relíquias | 6 |
| Pets (12 − 7 existentes) | 5 |
| Backgrounds | 0 (reaproveita) |
| Frames | 0 (é CSS) |
| Capas | 0 (slot sem arte) |
| **Total** | **~34** |

Para comparar: **remendar o sistema atual custaria ~60** (7 chapéus × 2 gêneros
+ 8 uniformes × 2 + 30 pets). O redesenho é quase metade do preço de consertar.

# Depois que este checklist fechar

1. Eu monto uma página de teste onde você joga um PNG e vê o boneco nos **4
   tamanhos reais** (56, 100, 200, 340 px), com fundo, moldura e pet.
   **O tamanho que manda é o menor** — se ler bem a 56px, lê em todos.
2. Você desenha a base em 1 tom + 1 uniforme, e valida a proporção ali.
3. Só então os outros ~32.
4. Em paralelo, eu escrevo a migration e a reescrita do render.
