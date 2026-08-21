# Bíblia Tonal — Recruta 64

## 1. Propósito do documento

Este documento define a **identidade tonal, narrativa e simbólica** do Recruta 64.

Ele serve como guia para garantir consistência em:

- interface e layout
- textos do produto
- nomes de telas e seções
- progressão do aluno
- criação de bots
- trilhas e aulas
- puzzles e desafios
- ranking, perfil, missões e recompensas

O objetivo é fazer o site parecer um **mundo único e coerente**, em vez de uma soma de funcionalidades soltas.

---

## 2. Ideia central do produto

### Conceito-mãe

**O xadrez como arte da guerra inteligente.**

No Recruta 64, o aluno não está apenas “jogando xadrez”.
Ele está entrando em uma **campanha estratégica de formação**, onde cada aula, puzzle, missão e batalha contra bots representa um passo na sua evolução.

A jornada começa com um recém-chegado no campo de treinamento e avança até os níveis mais altos de domínio, comando e maestria.

### Tradução emocional

O aluno deve sentir que:

- entrou em uma ordem ou campanha maior do que ele
- está sendo treinado com propósito
- cada pequena vitória tem significado
- o progresso é uma ascensão de patente, disciplina e inteligência
- o xadrez é apresentado como estratégia, honra, leitura e comando

---

## 3. Posicionamento tonal

> **Revisão de 2026-08-13 — a Academia 64.** As §3, §5, §12 e §13 foram reescritas
> nesta data. O tema deixou de ser *reino medieval / campanha* e passou a ser a
> **Academia 64**. O que motivou a mudança está na §3b, e o que ainda **não** foi
> migrado está na §5b — leia as duas antes de usar qualquer outra seção deste doc
> como lei.

### Fórmula tonal do produto

- **70% formação estratégica** — a Academia leva o estudo a sério
- **20% fantasia leve e mistério** — extraordinário, não de época
- **10% calor humano e humor leve**

O que mudou foi só a linha do meio, e ela é a que carrega a direção de arte. Antes
dizia *fantasia medieval elegante*; agora diz **fantasia leve e mistério**, sem
âncora de época.

### O que "fantasia leve e mistério" autoriza, e o que continua proibindo

**Autoriza:** aluno moderno ou excêntrico; bot que é coruja, autômato ou criatura;
traje que não existe em nenhum século; cor que não pede licença a uma paleta de
patente. A Academia é o lugar onde essas coisas convivem — é ela que dá coerência,
não a época.

**Continua proibindo** exatamente o que a §12 sempre proibiu: guerra realista,
brutalidade, humor pastelão, estética caótica, dark fantasy no core. Afrouxar a
época não afrouxa o gosto.

### O que isso significa na prática

O site deve transmitir:

- progressão
- honra
- preparo
- disciplina
- conquista
- inteligência
- prestígio

Mas sem ficar:

- militarista demais
- sombrio demais
- agressivo demais
- infantil demais
- caricato demais

### Regra de ouro do tom

> O Recruta 64 não fala de guerra literal. Ele fala de **estratégia, formação, avanço e comando**.

A guerra aqui é **simbólica**.
É o campo da mente, da disciplina, da decisão e da leitura do jogo.

---

## 3b. Por que a época caiu — os três atritos medidos

A época não foi trocada por gosto. Ela vinha cobrando preço em três lugares, e os
três estavam medidos antes da decisão.

**1. O gerador de arte brigava com ela.** Os pedidos de traje precisavam repetir
"nada de fantasia", listar exceções ("túnica oriental é aceita") e recusar peças
que o gerador insistia em desenhar (camisa social). Uma direção que precisa de
lista de exceções para ser obedecida está descrevendo mal o que quer. Na Academia
64 a túnica pertence ao mundo, e a exceção morre sozinha.

**2. A lei de cor por patente apagava as peças.** Amarrado à época e à patente, todo
traje de uma mesma patente saía do mesmo pano, e a régua de distinção media pouco:
a 56 px, o piso de 5% entre duas peças do mesmo oliva era arrancado a fórceps. Com
cor final e livre, a distinção sai de graça — e a régua volta a **julgar**, em vez
de projetar (é a lição de `nao-desenhar-para-a-regua`).

**3. A patente ocupava o corpo do boneco.** Vestir a patente gastava o único slot
grande do avatar num eixo que só tem 6 valores. Trocada por **moldura** — CSS em
volta do avatar, custo de arte zero —, a patente aparece melhor e o traje fica
livre para as ~40 peças de catálogo.

Nenhum dos três é argumento estético. Os três são custo.

---

## 4. Promessa de marca

### Frase de identidade

**Entre como recruta. Evolua como estrategista. Torne-se mestre do seu próprio campo de batalha.**

### Promessa principal ao aluno

Você não precisa nascer sabendo.
No Recruta 64, você entra como aprendiz, treina com método, sobe de patente e aprende a pensar com clareza, paciência e estratégia.

---

## 5. O mundo do produto

## Nome oficial do universo

**A Academia 64**

Uma academia extraordinária de estratégia. É o nome oficial do universo narrativo e
simbólico do Recruta 64, e substitui *O Reino das 64 Casas* a partir de 2026-08-13.

O que a Academia é, em uma frase: **um lugar, não uma época.** Ela tem corredores,
salas, professores, turmas, um quadro de honra e um arquivo — e quem passa por eles
pode ter vindo de qualquer lugar e qualquer tempo. É esse afrouxamento que a
palavra *reino* não permitia.

### O que a Academia dá que o reino não dava

| | Reino das 64 Casas | Academia 64 |
|---|---|---|
| coerência vem de | época compartilhada | **lugar compartilhado** |
| aluno pode ser | de época | moderno, excêntrico, de qualquer parte |
| bot pode ser | personagem medieval | coruja, autômato, criatura — é professor ou visitante |
| traje é | uniforme da patente | peça de catálogo, cor livre |
| patente aparece | na roupa | na **moldura** em volta do avatar |

## Estrutura macro da jornada

**A Formação do Recruta**

Essa é a estrutura narrativa da progressão do aluno dentro do produto. Ela organiza
a sensação de avanço, formação e ascensão ao longo da experiência.

A palavra **campanha** sai do vocabulário de lei. Ela descrevia uma marcha por
territórios; a Academia descreve uma **formação** que acontece num lugar só, e que
sobe por patentes em vez de por mapas.

### Lógica do mundo

O aluno progride por **etapas de formação**. Cada etapa representa não apenas
dificuldade maior, mas também um novo nível de maturidade estratégica — e a
Academia o reconhece publicamente por patente.

---

## 5b. O que ainda NÃO migrou — e por isso não vale como lei

A virada de 2026-08-13 tocou **as leis e os docs**. A interface não foi tocada, de
propósito: trocar vocabulário em tela é um bloco próprio, com revisão de texto, e
misturá-lo à virada da arte tornaria os dois irrevisáveis.

Enquanto esse bloco não acontecer, estes lugares ainda dizem *reino* e *campanha* —
e onde eles contradisserem as §3, §5, §12 ou §13, **quem vence são as §3, §5, §12 e
§13**:

- **§6 deste doc** (as 5 regiões: Acampamento dos Recrutas, Vila dos Soldados,
  Fortaleza dos Estrategistas…). Os nomes das três primeiras estão **no banco**, na
  coluna `stage` dos bots, e são lidos por `BotGrid.tsx` — mudá-los é migration de
  dados, não edição de texto.
- **§11 e §16 deste doc** (nomes de tela e textos por feature).
- **A interface**: `supertitulo="Reino das 64 Casas"` em 5 telas, mais a landing
  (`src/app/page.tsx`) e o design-lab.
- **`docs/Recruta64_Diretriz_Geral_dos_Bots_v1.md`** — a Diretriz dos 20 Mestres
  inteira pressupõe o reino. É o doc mais desalinhado com a Academia, e o mais caro
  de reescrever; fica para o mesmo bloco.

**Não conserte esses lugares de carona em outra tarefa.** Achado é achado
(`docs/achados.md`); a hora é do Doug.

---

## 6. Mapa macro de progressão

A jornada do aluno é organizada em 5 grandes regiões simbólicas dentro de **A Campanha do Jovem Recruta**.

### 1. Acampamento dos Recrutas

**Função narrativa:** ponto de chegada e acolhimento.

**Sensação:**

- começo
- descoberta
- treino básico
- ambiente seguro

**Elementos visuais:**

- barracas
- madeira
- bandeiras simples
- mapas rabiscados
- mesas de treino
- armas e escudos simbólicos de prática

**Tom de voz:**

- acolhedor
- didático
- encorajador
- simples

**Tipo de experiência:**

- primeiras aulas
- primeiros puzzles
- primeiros bots
- reforço positivo

---

### 2. Vila dos Soldados

**Função narrativa:** início da rotina de formação e da disciplina prática.

**Sensação:**

- crescimento
- disciplina
- consistência
- pertencimento

**Elementos visuais:**

- praça central
- quartéis
- campo de treino
- oficinas
- torre de observação

**Tom de voz:**

- firme
- motivador
- mais confiante
- menos tutorial

**Tipo de experiência:**

- desafios intermediários
- treino consistente
- ordens do dia
- primeiros confrontos mais sérios

---

### 3. Fortaleza dos Estrategistas

**Função narrativa:** entrada no xadrez sério.

**Sensação:**

- respeito
- cálculo
- estudo
- sofisticação

**Elementos visuais:**

- muralhas
- salão de análise
- biblioteca de guerra
- mapas de batalha
- torres altas

**Tom de voz:**

- estratégico
- elegante
- preciso
- menos expansivo

**Tipo de experiência:**

- puzzles mais fortes
- análise de erros
- bots técnicos
- trilhas de aprofundamento

---

### 4. Cidade dos Generais

**Função narrativa:** comando, prestígio e liderança.

**Sensação:**

- grandeza
- autoridade
- ambição
- domínio

**Elementos visuais:**

- cidade murada
- sala de comando
- conselho de guerra
- estandartes elaborados
- guardas de elite

**Tom de voz:**

- forte
- nobre
- respeitoso
- desafiador

**Tipo de experiência:**

- desafios avançados
- rankings
- títulos importantes
- bots de elite

---

### 5. Cidadela dos Mestres

**Função narrativa:** maestria, legado e refinamento máximo.

**Sensação:**

- silêncio
- domínio
- refinamento
- prestígio máximo

**Elementos visuais:**

- pedra e ouro
- observatórios
- salões elevados
- geometria refinada
- luz controlada

**Tom de voz:**

- nobre
- minimalista
- seguro
- memorável

**Tipo de experiência:**

- bots finais
- conquistas altas
- títulos máximos
- sensação de legado

---

## 7. Correspondência com as patentes do produto

| Patente | Região principal |
|---|---|
| Recruta | Acampamento dos Recrutas |
| Soldado | Vila dos Soldados |
| Aspirante | Fortaleza dos Estrategistas |
| Capitão | Fortaleza dos Estrategistas / transição para Cidade |
| Comandante | Cidade dos Generais |
| General | Cidade dos Generais / Cidadela |
| Mestre | Cidadela dos Mestres |

Essa lógica ajuda a alinhar:

- aulas
- títulos
- avatares
- bots
- textos de progressão
- recompensas

---

## 8. Vocabulário oficial do produto

A seguir, a nomenclatura oficial consolidada para o produto.

### Navegação principal

- **Início**
- **Trilhas**
- **Desafios**
- **Bots**
- **Quadro de Honra**
- **Perfil**
- **Turmas**

### Camada temática interna

- Dashboard → **Quartel-General**
- Aulas → **Trilhas de Formação**
- Puzzles → **Desafios Táticos**
- Missões diárias → **Ordens do Dia**
- Review / análise pós-jogo → **Revisão de Batalha**
- Ranking → **Quadro de Honra**
- Streak → **Sequência de Campanha**
- Conquistas visuais / badges → **Insígnias**
- Itens equipáveis → **Equipamentos**
- Turmas em ambientação → **Companhias**

### Termos operacionais recomendados

- concluir aula → completar treinamento
- resolver puzzle → concluir desafio tático
- errar puzzle → falha tática
- subir nível → avançar na campanha / alcançar nova patente
- missão concluída → ordem concluída
- análise pós-jogo → revisão de batalha
- inventário → inventário
- perfil → perfil

### Princípio de uso

A navegação deve priorizar clareza.
A camada temática deve aparecer em títulos, subtítulos, blocos internos, feedbacks e ambientação.

---

## 9. Diretriz de tom de voz

## Tom no início da jornada

**Objetivo:** acolher e reduzir medo.

Características:

- simples
- encorajador
- claro
- humano
- caloroso

Exemplos:

- “Todo mestre já foi recruta um dia.”
- “Vamos começar pelo essencial.”
- “Boa. Você está formando sua base.”

---

## Tom no meio da jornada

**Objetivo:** reforçar consistência e identidade estratégica.

Características:

- firme
- mais confiante
- prestigioso
- disciplinado

Exemplos:

- “Agora o campo exige mais precisão.”
- “Você está deixando de reagir e começando a comandar.”
- “Sua leitura do tabuleiro está mais sólida.”

---

## Tom no fim da jornada

**Objetivo:** transmitir domínio, legado e sofisticação.

Características:

- nobre
- elegante
- econômico
- marcante

Exemplos:

- “Nem toda vitória nasce do ataque. Algumas nascem do controle.”
- “Aqui, cada lance carrega intenção.”
- “Você já não joga apenas peças. Você comanda o ritmo do campo.”

---

## Slogans oficiais

### Slogan principal

**Entre como recruta. Evolua como estrategista. Torne-se mestre.**

### Slogan institucional

**No Reino das 64 Casas, a mente é o verdadeiro comando.**

---

## 10. Regras práticas de copy

### O produto deve soar:

- inteligente
- motivador
- claro
- elegante
- progressivo

### O produto não deve soar:

- infantilizado
- debochado demais
- militarista agressivo
- sombrio demais
- excessivamente épico em telas comuns

### Regras de escrita

1. Priorizar clareza antes de fantasia.
2. Usar a temática como moldura, não como muleta.
3. Frases curtas funcionam melhor que textos floreados.
4. Em tela de erro, derrota ou falha, o tom deve continuar respeitoso.
5. O aluno deve se sentir treinado, não humilhado.

---

## 11. Aplicação por área do site

## 11.1 Aulas

As aulas representam a formação do aluno ao longo da campanha.

### Diretriz

Cada aula pode soar como um módulo de treinamento com objetivo claro.

### Exemplos de naming

- Primeiro Juramento
- Linha de Frente dos Peões
- Sentinelas do Rei
- Emboscada de Cavalo
- Muralha de Defesa
- Conselho Tático

### Sensação desejada

- progresso estruturado
- aprendizado com propósito
- treinamento de verdade

---

## 11.2 Puzzles

Os puzzles são exercícios táticos e simulações rápidas.

### Diretriz

O tom aqui deve transmitir:

- precisão
- leitura rápida
- resposta sob pressão

### Exemplos de linguagem

- “Desafio tático concluído.”
- “Falha tática. Revise e tente novamente.”
- “Boa leitura. Você viu o golpe antes do inimigo.”

---

## 11.3 Bots

Os bots são personagens do mundo da campanha estratégica.

### Diretriz

Eles devem crescer em:

- força
- prestígio
- profundidade
- presença visual

O início é mais humano e acessível.
O topo é mais lendário, mas ainda coerente com o mundo.

### Regra importante

Os bots não devem parecer personagens aleatórios de universos diferentes.
Todos pertencem ao mesmo grande mundo tonal.

---

## 11.4 Dashboard

O dashboard deve funcionar como centro operacional do aluno.

### Nome sugerido

- Quartel-General
- Mesa de Comando

### Sensação desejada

- visão clara de progresso
- controle da campanha atual
- próximos objetivos bem definidos

### Elementos que combinam

- progresso de patente
- ordens do dia
- continuar treinamento
- desafio rápido
- histórico recente

---

## 11.5 Missões diárias

As missões diárias funcionam muito bem como **Ordens do Dia**.

### Exemplos

- “Complete 1 treinamento.”
- “Vença 5 desafios táticos.”
- “Derrote 1 bot da sua faixa.”
- “Mantenha sua sequência ativa.”

### Sensação desejada

- disciplina
- regularidade
- avanço constante

---

## 11.6 Ranking

O ranking deve soar como um espaço de prestígio.

### Nome sugerido

- Quadro de Honra

### Sensação desejada

- respeito
- conquista
- reconhecimento

Não deve soar como zombaria, competição tóxica ou humilhação pública.

---

## 12. Direção visual macro

## Estilo geral recomendado

- **fantasia leve, com mistério** — extraordinário sem época
- interface premium e limpa
- símbolos de estudo, estratégia e reconhecimento
- progressão visual por etapas e patentes

### Palavras-chave de direção

- academia
- formação
- disciplina
- honra
- estudo
- mistério
- estratégia
- comando
- progressão
- maestria

### Evitar

- guerra realista
- brutalidade explícita
- humor pastelão
- estética caótica
- dark fantasy excessiva no core do produto

### Onde a patente aparece — e onde a raridade aparece

São **duas linguagens de cor**, e elas nunca podem ocupar o mesmo elemento. Quando
ocupam, o aluno aprende que cor não significa nada.

| | patente | raridade |
|---|---|---|
| eixo | quem o aluno **é** (6 tiers) | quanto uma peça é **rara** (4 faixas) |
| onde aparece | **moldura em volta do avatar** — navbar, rankings, mural, dashboard, perfil | **vitrine e cards do editor** — nunca fora dela |
| fonte da cor | `scripts/avatar/patentes.ts` | as cores de raridade do editor |
| onde **nunca** aparece | dentro do SVG do boneco; nos cards da vitrine | em volta do avatar; em qualquer lugar do perfil ou do ranking |

A moldura é **CSS fora do SVG** e **automática** — derivada de `achieved_tier`, sem
slot, sem escolha, sem estado novo. A paleta medida das 6 patentes
(`docs/avatar/17-patentes-uniformes-design.md`) migra inteira para ela, junto com as
distâncias mínimas: **≥40 entre patentes quaisquer, ≥60 entre vizinhas**.

A **faixa proibida de matiz 0°–44°** que aquele doc declara **não vale para a
moldura**. Ela era lei do pipeline de recoloração do SVG — existia porque matiz
quente colidia com a pele do boneco. Em CSS, fora do SVG, não há colisão: a moldura
**pode** usar dourado.

### A lei da arte de traje, depois que a paleta afrouxou

Permissiva **não é** sem lei. Morreram duas coisas — a cor obrigatória da patente e
os 3 tons chapados. Ficaram cinco, e as duas últimas são novas:

1. **Gate −1** — a peça não move o boneco. Continua sendo a trava de entrada.
2. **Transbordo obrigatório, com alvo (~10%)** — traje que não transborda parece
   pintado no corpo, não vestido.
3. **Legibilidade a 56 px na folha** — se a peça vira mancha, não entra.
4. **Contraste com o fundo claro `#FBF8F5`** (nova). Peça bege some no card marfim
   do editor; é o defeito que a cor livre torna possível, então vira lei junto com
   ela.
5. **O contorno preto do boneco continua legível** (nova). A cor livre não pode
   engolir a silhueta que dá identidade ao personagem.

A aprovação final continua sendo **o olho do Doug na folha de contato**. As cinco
leis reprovam; nenhuma delas aprova.

**Estilo misto é aceito em princípio.** O catálogo vai ter peça chapada (a farda) ao
lado de peça aerografada (o gambesão). Se destoar, decide-se **na folha, lado a
lado, peça a peça** — não por regra escrita antes de olhar.

---

## 13. Regras para personagens e bots

1. Cada bot deve ter identidade clara e fácil de lembrar.
2. O humor deve ser leve e pontual, principalmente nos níveis iniciais.
3. Os bots avançados devem parecer prestigiosos, não aleatórios.
4. A progressão visual dos bots deve acompanhar a progressão do mundo.
5. **Um bot não precisa ser humano nem ser de época.** Coruja, autômato, criatura —
   tudo cabe, desde que pertença à **Academia**: seja professor, visitante,
   bibliotecário, adversário convidado. O que amarra o elenco é o lugar
   compartilhado, não um século compartilhado.
6. Mesmo os bots finais precisam continuar pertencendo ao universo do Recruta 64.

**Zero acoplamento técnico.** Um bot é um PNG por slug em `public/bots/` mais
`phrases_json` no banco — trocar o elenco não toca em código. Foi isso que tornou
esta regra barata de afrouxar.

⚠️ A `docs/Recruta64_Diretriz_Geral_dos_Bots_v1.md` (os 20 Mestres) foi escrita para
o reino e **ainda não** foi revista. Ver §5b.

---

## 14. Regra de progressão tonal

### Início
Mais humano, acolhedor e simples.

### Meio
Mais firme, técnico e respeitável.

### Fim
Mais nobre, silencioso, poderoso e memorável.

Essa curva deve aparecer em:

- textos
- ilustrações
- nomes
- bots
- ambientação
- animações
- recompensas

---

## 15. O que esta bíblia deve evitar no futuro

Este documento existe justamente para impedir que o produto fique inconsistente.

### Não fazer

- misturar fantasia épica com piadas bobas demais na mesma camada
- fazer páginas premium e bots com linguagem infantil demais
- criar personagens que não combinem com o mundo
- exagerar no tema de guerra a ponto de afastar o público
- usar jargão militar em excesso a ponto de atrapalhar clareza

---

## 16. Aplicação da Bíblia Tonal por Feature

Esta seção traduz a identidade do Recruta 64 em regras práticas para cada área principal do produto.

O objetivo é garantir que cada feature não apenas funcione, mas também pareça pertencer ao mesmo universo: **O Reino das 64 Casas**.

---

## 16.1 Início / Quartel-General

### Função no produto

A página inicial do aluno centraliza:

- progresso atual
- ordens do dia
- atalhos principais
- continuidade da jornada
- visão geral da campanha pessoal

### Papel no universo

O Quartel-General representa o centro de comando do aluno dentro da campanha.
É o lugar onde ele acompanha seu avanço, recebe suas ordens, vê seu estado atual e decide o próximo passo.

### Tom de voz

- claro
- encorajador
- organizado
- confiante

O tom aqui deve transmitir sensação de direção.
O aluno deve entrar e entender rapidamente o que já conquistou e o que precisa fazer agora.

### Direção visual

- sensação de mesa de comando
- blocos com informação bem organizada
- prioridade para leitura rápida
- elementos de campanha e progressão, sem excesso visual

### Exemplos de copy

- “Bem-vindo ao seu Quartel-General.”
- “Sua campanha segue avançando.”
- “Estas são suas Ordens do Dia.”
- “Pronto para o próximo desafio?”
- “Seu progresso no Reino das 64 Casas continua.”

### O que evitar

- linguagem épica demais para tarefas simples
- excesso de metáforas militares em todos os blocos
- transformar a home em uma tela dramática demais

---

## 16.2 Trilhas / Trilhas de Formação

### Função no produto

As trilhas organizam o aprendizado do aluno em aulas progressivas.
São a base da formação estruturada.

### Papel no universo

As Trilhas de Formação representam o treinamento oficial do aluno na campanha.
Cada etapa desenvolve uma capacidade estratégica e prepara o jogador para níveis maiores de leitura, disciplina e comando.

### Tom de voz

- didático
- prestigioso
- progressivo
- firme sem ser rígido

### Direção visual

- sensação de progressão clara
- conexão com regiões e patentes
- aparência de mapa de campanha ou rota de formação
- destaque para status: bloqueado, em andamento, concluído

### Exemplos de copy

- “Sua formação começa aqui.”
- “Cada treinamento fortalece sua leitura do campo.”
- “Trilha concluída. Sua campanha avançou.”
- “Você está pronto para a próxima etapa.”
- “O domínio nasce da repetição com propósito.”

### O que evitar

- nomear tudo como “guerra” ou “batalha”
- transformar as aulas em algo agressivo demais
- perder clareza pedagógica em nome da ambientação

---

## 16.3 Desafios / Desafios Táticos

### Função no produto

Os desafios são o principal ambiente de prática rápida e repetida:

- rating
- categorias
- rush
- revanche

### Papel no universo

Os Desafios Táticos representam exercícios de campo, escaramuças e testes de leitura sob pressão.
São o espaço em que o aluno treina resposta rápida, cálculo e precisão.

### Tom de voz

- direto
- energético
- preciso
- motivador

### Direção visual

- senso de foco e ação
- feedbacks rápidos e claros
- reforço visual de acerto, erro, streak e progresso
- aparência de teste prático de campanha

### Exemplos de copy

- “Desafio tático concluído.”
- “Boa leitura. Você viu o golpe antes do rival.”
- “Falha tática. Revise e tente novamente.”
- “Sua sequência de campanha cresceu.”
- “Hora da revanche.”

### O que evitar

- mensagens punitivas ou humilhantes
- excesso de floreio em contextos rápidos
- linguagem confusa em modos competitivos ou com timer

---

## 16.4 Bots / Duelos da Campanha

### Função no produto

A área de bots oferece partidas progressivas contra oponentes com estilos e personalidades distintas.
É um espaço de prática, desafio e prestígio crescente.

### Papel no universo

Os bots são rivais, instrutores, especialistas e mestres do Reino das 64 Casas.
Eles representam a escalada do aluno dentro da campanha, do treino inicial até os confrontos de elite.

### Tom de voz

- respeitoso
- progressivo
- marcante
- mais prestigioso à medida que o nível sobe

### Direção visual

- progressão clara entre bots básicos, intermediários, avançados e lendários
- retratos fortes e coerentes entre si
- pre-game com sensação de preparação
- pós-jogo com sensação de revisão e aprendizado

### Exemplos de copy

- “Escolha seu rival.”
- “Prepare o duelo.”
- “O confronto começou.”
- “Revisão de Batalha.”
- “Você venceu um rival da campanha.”
- “O próximo duelo já está ao alcance.”

### O que evitar

- bots que pareçam de universos diferentes entre si
- humor bobo em bots avançados
- agressividade excessiva ou humilhação do jogador
- dark fantasy exagerada cedo demais

---

## 16.5 Quadro de Honra / Ranking

### Função no produto

O ranking mostra liderança, progresso e destaques da comunidade.

### Papel no universo

O Quadro de Honra é o espaço de reconhecimento público dentro do Reino das 64 Casas.
Ele registra quem avançou mais, quem dominou certos desafios e quem alcançou posições de prestígio.

### Tom de voz

- nobre
- respeitoso
- competitivo sem toxicidade
- celebratório

### Direção visual

- destaque para mérito e posição
- apresentação limpa e respeitosa
- foco em prestígio, não em humilhação

### Exemplos de copy

- “Os estrategistas em maior destaque no reino.”
- “Seu nome também pode chegar ao Quadro de Honra.”
- “Prestígio conquistado por mérito.”
- “Cada posição reflete disciplina e constância.”

### O que evitar

- linguagem de deboche
- tom de superioridade tóxica
- exagerar competição acima do espírito educacional

---

## 16.6 Perfil / Registro da Campanha

### Função no produto

O perfil reúne:

- patente
- nível e XP
- conquistas
- inventário
- equipamentos
- histórico de progresso

### Papel no universo

O perfil é o registro pessoal do estrategista dentro da campanha.
É a ficha viva do aluno, mostrando sua identidade, evolução, conquistas e presença no Reino das 64 Casas.

### Tom de voz

- pessoal
- prestigioso
- claro
- recompensador

### Direção visual

- sensação de ficha de progressão
- destaque para identidade visual do aluno
- boa leitura de progresso, insígnias e equipamentos

### Exemplos de copy

- “Seu registro de campanha.”
- “Patente atual.”
- “Insígnias conquistadas.”
- “Equipamentos da campanha.”
- “Seu avanço fala por você.”

### O que evitar

- visual excessivamente cosmético sem conexão com progresso
- misturar recompensas sem hierarquia clara
- copiar linguagem de RPG genérico sem conexão com xadrez

---

## 16.7 Turmas / Companhias

### Função no produto

As turmas organizam grupos de alunos com acompanhamento do professor.
Incluem tarefas, mural, relatório e progresso coletivo.

### Papel no universo

As turmas representam companhias em formação dentro da campanha.
O professor atua como orientador e comandante da formação, guiando o avanço dos recrutas.

### Tom de voz

- coletivo
- encorajador
- organizado
- respeitoso

### Direção visual

- sensação de grupo, progressão e coordenação
- destaque para tarefas, mural e progresso compartilhado
- aparência de unidade e pertencimento

### Exemplos de copy

- “Sua companhia está em formação.”
- “Ordens da companhia.”
- “Acompanhe o avanço dos seus recrutas.”
- “Cada integrante fortalece a campanha.”
- “Mural da companhia.”

### O que evitar

- militarizar demais a relação professor-aluno
- transformar a turma em ambiente punitivo
- perder o caráter educacional e cooperativo

---

## 16.8 Progressão Global / Patente, XP e avanço

### Função no produto

A progressão global reúne:

- nível
- XP
- patente
- sequência
- recompensas
- títulos

### Papel no universo

Essa camada representa a ascensão do aluno dentro da Campanha do Recruta.
Cada avanço simboliza crescimento de disciplina, leitura estratégica e prestígio dentro do Reino das 64 Casas.

### Tom de voz

- progressivo
- recompensador
- respeitoso
- aspiracional

### Direção visual

- sensação de conquista contínua
- marcos visíveis
- feedback de progresso claro e satisfatório

### Exemplos de copy

- “Nova patente alcançada.”
- “Sua campanha avançou.”
- “Sequência de campanha mantida.”
- “Você está pronto para desafios maiores.”
- “Cada avanço fortalece sua posição no reino.”

### O que evitar

- transformar progressão em grind sem significado
- usar linguagem agressiva ou humilhante em derrotas
- fazer a fantasia parecer desconectada do esforço real do aluno

---

## 17. Diretriz final

O Recruta 64 deve passar a sensação de que o aluno está entrando em um **mundo de formação estratégica**, onde cada treino importa, cada desafio ensina e cada avanço representa mérito real.

O site deve ser:

- acolhedor para quem começa
- prestigioso para quem evolui
- memorável para quem permanece

### Síntese final

**Recruta 64 é uma campanha estratégica de aprendizado, onde o xadrez é apresentado como disciplina, inteligência, honra e ascensão.**

