/**
 * QUEM JÁ ATRAVESSOU A ESTEIRA — a lista de artes que as réguas de traço julgam.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO NASCEU, E QUAL DEFEITO ELE FECHA
 * ---------------------------------------------------------------------------
 *
 * `arte:traco` e `arte:borda` julgam o mesmo traço em faixas vizinhas do mesmo eixo:
 * uma pergunta se o traço do BONECO continua inteiro, a outra se o contorno da PEÇA é
 * preto. As duas percorriam uma constante `APROVADAS` **escrita à mão**, e cada uma
 * tinha a própria cópia.
 *
 * Em 2026-08-24 as duas cópias estavam defasadas do mesmo jeito: listavam
 * `barba-trancada`, `chanel`, `entrada` e `entrada-2` — e **três artes promovidas em
 * 2026-08-22 nunca entraram nelas**, `moicano`, `assimetrico` e `burst-fade`. As duas
 * réguas passavam verdes sobre 1 dos 4 cabelos do catálogo.
 *
 * Medido no dia em que o defeito foi encontrado, e é por isso que ele não virou
 * incêndio: as três passam nas duas réguas — `arte:borda` 0 px de cinza nas três;
 * `arte:traco` 0 px apagados em duas e 18 px em 18 ilhas de 1 px no `assimetrico`,
 * contra piso de 8 por componente. **A omissão não escondeu defeito. Escondia a
 * possibilidade de haver um**, que é a única coisa que uma régua faz.
 *
 * ---------------------------------------------------------------------------
 * A LISTA É DERIVADA, E É POR ISSO QUE ELA MORA AQUI
 * ---------------------------------------------------------------------------
 *
 * Lista escrita envelhece uma vez por promoção, e envelhece **em silêncio**: ninguém
 * lembra de dois arquivos de régua ao colar a peça no catálogo. Então ela sai de onde
 * a promoção já obriga a escrever — os mapas `NOMES` dos geradores, que são a mesma
 * fonte de `CABELOS_DA_ARTE` e `ROSTOS_DA_ARTE`. Peça promovida entra na régua no
 * mesmo gesto em que entra no produto, sem terceiro lugar para esquecer.
 *
 * Os mapas moram AQUI, e não em `cabelos.ts` / `rostos.ts`, por um motivo mecânico:
 * aqueles dois arquivos são executáveis — chamam `principal()` no topo do módulo —, e
 * importá-los de dentro de uma régua rodaria o gerador junto com a medição.
 *
 * ⚠️ **O traje não entra.** Ele é a outra metade da bifurcação da Regra Inviolável
 * nº 4: cor final assada, servida como `<image>` dentro do `.svg`. O que estas duas
 * réguas medem é o traço de quem RECOLORE, e a lista sempre foi só de cabelo e rosto.
 */

import { PASTA } from "./base";

/**
 * O nome que a criança lê, por arte de CABELO promovida. Uma linha por peça.
 *
 * A chave é o nome do ARQUIVO sem extensão, como em `PECAS_DA_ARTE` — e não o slug
 * com prefixo. É por essa chave que `CABELOS.<modelo>` espalha o objeto, e é ela que
 * o `id` gravado carrega, motivo pelo qual o catálogo **sobrescreve a identidade** na
 * promoção (ver `CABELOS` em `cabelo.ts`).
 *
 * ⚠️ **Uma linha por arte que ATRAVESSOU A ESTEIRA — não por peça aprovada.** A regra
 * mudou em 2026-08-22, quando o Doug pediu para julgar a peça no runtime: estar aqui
 * põe a arte no seletor *"da arte · tonal"* do `/dev/avatar-kokeshi`, que é onde o
 * parecer acontece. **A aprovação continua morando em `CABELOS`** (`cabelo.ts`), que
 * é o que a criança vê. A trava do outro lado não mudou: um nome **sem** arte no
 * disco reprova.
 */
export const NOMES_CABELO: Record<string, string> = {
  // A primeira peça tonal do slot, aprovada pelo Doug em 2026-08-22 sobre a folha.
  // O arquivo `chanel.png` foi SOBRESCRITO pela arte nova, por decisão dele ("ele
  // substitui o velho, pode manter o mesmo nome") — e é por isso que `chanel` saiu
  // de `ARTES` em `pecas.ts` no mesmo commit: um nome de arquivo, uma arte, uma
  // esteira.
  chanel: "Chanel",
  // Atravessou a esteira em 2026-08-22: Gate −1 aprovada com 0 px nas protegidas,
  // traço do boneco inteiro, contorno preto, figurinha de 562 px e nenhuma janela de
  // feição aberta. Era PARAMÉTRICA antes — a primeira migração que apaga selo de
  // congelado em vez de só movê-lo.
  moicano: "Moicano",
  // Atravessou a esteira em 2026-08-22 e substituiu `entrada-2.png`, a arte traçada
  // do mesmo modelo. É a primeira arte que nasce inteira sob a regra do contorno
  // azul-marinho: 35 661 px de linha azul (20,2%) e 3 947 px dela POR CIMA do traço
  // do boneco — o conjunto que a versão preta perdia inteiro.
  assimetrico: "Assimétrico",
  // O primeiro cabelo tonal que NÃO substitui ninguém — modelo novo, fora dos cinco
  // do elenco antigo, e por isso ele não saiu de família nenhuma na promoção: entrou
  // direto em `CABELOS` e em `MODELOS_TONAIS`.
  "burst-fade": "Burst Fade",
  // ─────────────────────────────────────────────────────────────────────────
  // O LOTE DE 2026-08-24 — seis artes novas do Doug, a primeira leva depois de o
  // elenco ter sido cortado a quatro. Atravessaram a esteira JUNTAS e passaram nas
  // três réguas: Gate −1 APROVADA nas seis (deslocamento 0/0 px, escala 100,00%,
  // **0 ladrilho de forma** em rosto e em corpo), `arte:traco` com o traço do
  // boneco inteiro e `arte:borda` com 0 px de cinza.
  //
  // ⚠️ Estar aqui é estar no seletor *"da arte · tonal"* do `/dev/avatar-kokeshi`,
  // e mais nada. O parecer do Doug passou a ser no RENDER em vez de na folha de
  // contato (decisão dele, 2026-08-24), e a aprovação continua morando em
  // `CABELOS` — que é o que a criança vê.
  // ─────────────────────────────────────────────────────────────────────────

  // 88 175 px em 1 componente · 0 px de tinta em rosto e corpo. A mais limpa do
  // lote nas protegidas, junto com a `curto-repartido`.
  "cachos-anjo": "Cachos de Anjo",
  // 81 253 px — a MENOR massa do lote, e abaixo da faixa de 113–196 mil que o
  // doc 24 §4 observou nas três artes de 2026-08-19. A faixa é observação, não
  // teto, e o `moicano` promovido tem 39 452 px; fica registrado porque massa
  // baixa é o que faz um cabelo ler "ralo", e isso é julgamento de olho.
  "curto-repartido": "Curto Repartido",
  // 149 717 px, a maior do lote. É a que desce sobre o tronco: 25 084 px (8,07%)
  // de tinta em "corpo" e 1 091 px (17,83%) em "sobrancelha" — medidos contra o
  // `assimetrico` JÁ PROMOVIDO, que dá 27 147 px (8,74%) e 1 096 px (17,91%).
  // A peça nova é mais leve que a que está em produção nas duas contas.
  "longo-unilateral": "Longo Unilateral",
  // 86 827 px · 64 px (1,05%) na sobrancelha, o mesmo patamar do `chanel` (65 px).
  "pixie": "Pixie",
  // 106 803 px · 1 007 px (0,32%) em "corpo", numa caixa em u x 108→141 y 353→486
  // — o rabo caindo nas costas, em frente ao tronco.
  "rabo-baixo": "Rabo Baixo",
  // 121 920 px em **2 componentes** (107 539 + 14 381 px) — a primeira peça do slot
  // que não é uma mancha só. O segundo componente tem 13,4% da maior, bem acima do
  // piso de ruído de 5%, então é trança e não sujeira. A esteira TONAL traça por
  // `potrace`, que emite subcaminhos no mesmo `d`; a limitação de UM laço era da
  // família traçada (`Cabelo.massa`), que hoje está vazia.
  "trancas-duplas": "Tranças Duplas",
  // A SÉTIMA do dia, e ela chegou por reentrada: o Doug apagou a arte velha do
  // `coque` e desenhou outra com o mesmo nome — *"são artes novas já, apaguei as
  // velhas e coloquei o mesmo nome"*. Conferido por hash contra o blob que o commit
  // `404fca2` apagou, e é arquivo diferente. 62.788 px em 1 componente · Gate −1
  // **APROVADA** com 0 px e 0 ladrilho em rosto, corpo e sobrancelha. O defeito que
  // matou a versão anterior — 9,0% da peça guilhotinada acima do `viewBox` — não se
  // repete: a caixa da máscara começa dentro do quadro.
  "coque-simples": "Coque Simples",
  // A OITAVA do dia, entregue às 09:30 e passada na esteira em seguida. 83 375 px em
  // 1 componente · Gate −1 **APROVADA** com 0 px e 0 ladrilho em rosto, corpo e
  // sobrancelha.
  //
  // ⚠️ **É a arte mais limpa do dia na régua que derrubou a `espetado`**: 0 px de
  // peça abaixo do piso de saturação do Gate −1, contra 46 836 na `espetado` e 6 990
  // no `chanel` que está em produção. Ela não exercita o buraco — o que quer dizer
  // que ela também não o prova consertado.
  "tigela-franja": "Tigela com Franja",
  // A NONA, e ela é a REENTRADA do `espetado` — a terceira tentativa do modelo, e a
  // primeira que atravessa. 95 495 px em 1 componente · Gate −1 **APROVADA** com 0 px
  // e 0 ladrilho em rosto e corpo (458 px na sobrancelha, que só relata).
  //
  // ⚠️ **Ela reusa o nome limpo, e a arte anterior não foi apagada.** A versão que
  // reprovou continua no disco como `espetado-vetado*.png`: ela é a única cobaia do
  // buraco do piso de saturação do Gate −1 (531 px de peça invisível num bloco só), e
  // régua sem exemplo-ruim é detector de fumaça sem fumaça. O slug `cabelo-espetado`
  // estava livre porque a migration de ontem fez `DELETE`, não marcação.
  //
  // O que separa a que passou da que não passou, medido: **8 495 px invisíveis, 0
  // deles em região protegida** — contra 46 836 px, sendo 531 no rosto.
  espetado: "Espetado",
  // A REENTRADA da maria chiquinha — a primeira arte dela foi reprovada pelo Doug no
  // desenho e apagada. Esta é outra (hash `1d66558e2e11` contra `d8fc2e0604f3`).
  //
  // 84 650 px em **3 componentes** — a massa da cabeça e as duas chiquinhas —, e é a
  // única peça do catálogo com mais de dois. Gate −1 **APROVADA** com 0 px em rosto,
  // corpo E sobrancelha, as três zeradas.
  //
  // Ela é também a peça que traz de volta o caso real de `coroa-multicomponente.test.ts`:
  // foi a versão anterior desta arte que revelou que as réguas achatavam o `d` e
  // apagavam uma sobrancelha do boneco.
  "maria-chiquinha": "Maria Chiquinha",
  // 91 308 px em 1 componente. Gate −1 com **0 ladrilho até na região permitida** —
  // a arte mais limpa que já passou por aqui nessa conta.
  //
  // ⚠️ É a família que morreu no teto do `viewBox` (o `coque`, 9,0% guilhotinados),
  // e o `PEDIDO-CABELOS.md` cobra que peça que prende cabelo em cima nasça mais
  // baixa. Medido: ver a entrada em `CABELOS`.
  "coques-duplos": "Coques Duplos",
  // 81 225 px em 1 componente. Gate −1 **APROVADA** com 0 px em rosto e corpo (21 px
  // na sobrancelha, que só relata) e traço do boneco inteiro — 19 ilhas de 1 px,
  // contra piso de 8 por componente.
  //
  // A terceira arte do slot na família do coque, depois das duas reprovadas em
  // 2026-08-24 de manhã. Ver a folga do teto na entrada de `CABELOS`.
  "coque-individual": "Coque Individual",
  // 144 331 px em 1 componente — a segunda maior massa do slot, atrás só da
  // `longo-unilateral` (149 717). Gate −1 **APROVADA**: 0 px em rosto e sobrancelha,
  // 1 963 px em "corpo" dos quais **98,7% é a própria peça caindo sobre o tronco** —
  // o mesmo mecanismo do `assimetrico` e da `longo-unilateral`, os dois já em
  // produção. `arte:traco` 11 px em 5 ilhas, maior de 7, contra piso de 8.
  dreadlocks: "Dreadlocks",
  // ENTROU EM 2026-08-25, a pedido direto do Doug — *"cabelo elvis não passou pela
  // esteira, faça isso"*. Ela estava em `Downloads/cabelos/elvis(epic).jpg` desde
  // 2026-08-24 e nunca tinha sido importada; a divergência apareceu ao reescrever a
  // §5-E do doc 22 pela pasta de entrega.
  //
  // Gate −1 **APROVADA**: deslocamento 0/0 px, escala 100,00%, **0 ladrilho de forma
  // em rosto e em corpo**. `arte:traco` com o traço do boneco inteiro (0 px apagados,
  // 0 ilhas) e `arte:borda` com **0 px de cinza** — as duas com o controle reprovando
  // nas duas alturas, como manda.
  //
  // 124 410 px em **2 formas** · esticão de luminância 12→137 · tom 269×222 (31,4 KB
  // de PNG) · **0 px descartados nas FEIÇÕES**. A massa fica na metade de cima da
  // faixa do slot (81 mil a 149 mil), o que é esperado numa peça de volume alto no
  // topo.
  elvis: "Elvis",
  // A ÚLTIMA da pasta a entrar, em 2026-08-25: *"todos da pasta cabelos e pasta
  // chapéus entram no repositório"*. Com ela, `Downloads/cabelos/` e o repositório
  // param de divergir — 19 artes de cada lado.
  //
  // Gate −1 **APROVADA**: 0/0 px, escala 100,00%, **0 ladrilho de forma** em rosto,
  // corpo E sobrancelha. `arte:traco` com o traço do boneco inteiro (0 px apagados).
  //
  // ⚠️ `arte:borda` achou **2 px de cinza em 2 ilhas de 1 px** (lum 45), em
  // u x 108 y 332. Passa — o piso é 8 px por componente —, e fica escrito porque
  // é o primeiro cabelo do elenco que não dá zero cravado nessa régua.
  "curto-penteado": "Curto Penteado",
};

/**
 * O nome que a criança lê, por arte de ROSTO promovida. Uma linha por peça.
 *
 * Ele não se deriva do slug pelo motivo que `trajes.ts` já escreve: `barba-cheia`
 * viraria "Cheia", que não é nome de coisa nenhuma. E a raridade **não** mora aqui —
 * ela é do servidor, e vive em `avatar_catalogo` (Regra Inviolável nº 1).
 *
 * ⚠️ **Uma só, e é assim desde 2026-08-21.** O elenco do slot chegou a nove artes de
 * barba; o Doug reprovou oito olhando e ficou com a trançada, que ele chamou de *"a
 * melhor arte"* e que virou o padrão de acabamento do projeto inteiro. Em 2026-08-24
 * ele confirmou: só a trançada fica.
 */
export const NOMES_ROSTO: Record<string, string> = {
  "barba-trancada": "Barba Trancada",
};

/**
 * O nome que a criança lê, por arte de ÓCULOS. A SEGUNDA família do slot `rosto`.
 *
 * Ela é outra lista e não outra linha em `NOMES_ROSTO` porque as duas famílias saem
 * de esteiras diferentes — a bifurcação da Regra Inviolável nº 4 cai DENTRO do slot:
 * a barba recolore e vira `formas` + máscara de tom; o óculos tem cor final assada e
 * vira `<image>` WEBP por `peca-de-arte.ts`. Misturá-las numa lista só obrigaria o
 * gerador a adivinhar de qual esteira cada chave é, pelo prefixo do nome — que é
 * exatamente a descoberta por nome de arquivo que este repositório recusa.
 *
 * ⚠️ **A arte de óculos entra CRUA, e é o contrário da barba.** `restaurar-peca.ts`
 * gira o matiz da peça para 180°, e uma armação girada chega ao produto CIANO. Então
 * `oculos-<nome>.png` é a arte como a artista pintou — é dela que a peça é feita — e
 * `oculos-<nome>-limpa.png` é a versão ciano, que existe só para o Gate −1 e o
 * `arte:traco` terem o que reconhecer. Na barba os papéis são o inverso, e o sufixo
 * também: lá o cru é `-crua` e o limpo leva o nome puro.
 */
export const NOMES_OCULOS: Record<string, string> = {
  // ─────────────────────────────────────────────────────────────────────────
  // O ELENCO DE ÓCULOS, batizado pelo Doug em 2026-08-27 — cinco peças.
  //
  // As cinco atravessaram o Gate −1: deslocamento 0/0 px e escala 100,00% nas cinco,
  // **0 ladrilho de forma** nas cinco, `arte:traco` com 0 px do traço do boneco
  // apagados, e **2 janelas abertas** em cada uma — uma por lente.
  //
  // A raridade é do SERVIDOR (Regra Inviolável nº 1) e não mora aqui; ela fica no
  // comentário só para quem lê esta lista saber de que degrau é a peça, e entra de
  // verdade na seed de `avatar_catalogo`.
  //
  // ⚠️ **A terceira arte foi SUBSTITUÍDA e APAGADA** — decisão do Doug: *"a arte
  // substituída pode deletar. Aqui entrou, entrou no lugar."* Ela era a das volutas
  // com corrente pendurada, e foi a corrente dela — 4 818 px ligados à peça, descendo
  // até u y 445 — que derrubou o piso do campo da base da cabeça para o piso do traje.
  //
  // Apagá-la tiraria a cobaia daquele piso, e é por isso que a régua foi amarrada na
  // `duplo-art-nouveau` antes: o enfeite de contas dela desce 950 px abaixo do queixo,
  // e `vao-da-lente.test.ts` cobra isso por nome. **A cobaia mudou de peça, não sumiu**
  // — régua sem exemplo que a exercite é detector de fumaça sem fumaça.
  // ─────────────────────────────────────────────────────────────────────────

  // common. Dois aros circulares, traço preto grosso, ponte curta. É a peça de
  // referência do slot: a que lê melhor a 32 px junto com a `quadrado-retro-rosa`.
  "oculos-redondo-simples": "Óculos Redondo Simples",
  // rare. Modelo browline — barra superior preta espessa, aros finos fechando por
  // baixo. ⚠️ É a que FUNDE com a barba a 32 px: a barra e o topo da massa de pelo
  // viram uma faixa escura contínua. Medido na folha de 2026-08-27; passa porque a
  // legibilidade é julgamento do Doug e ele aprovou.
  "oculos-escolar-simples": "Óculos Escolar Simples",
  // epic. A ÚNICA das cinco que veio com as linhas em PRETO, contra o azul `#0000C8`
  // que o `PEDIDO-OCULOS.md` exige — e atravessou porque o defeito que o azul evita
  // não aconteceu nela: `arte:traco` mediu 0 px do traço do boneco apagados. É também
  // a mais limpa do lote no Gate −1: 3 px não explicados.
  "oculos-quadrado-retro-rosa": "Quadrado Retrô Rosa",
  // legendary. Aros finos claros com enfeite de contas na têmpora, descendo abaixo do
  // queixo — 950 px que o piso antigo do campo cortava.
  "oculos-duplo-art-nouveau": "Duplo Art Nouveau",
  // epic. A SEXTA arte do dia e a segunda tentativa da terceira peça: ela substitui a
  // das volutas, que o Doug trocou. Gate −1 **APROVADA** com 0 ladrilho em rosto,
  // corpo e sobrancelha; `arte:traco` com 0 px apagados.
  //
  // ⚠️ Ela tem **82 px de REPINTURA das feições** no Gate −1 — a maior do lote (as
  // outras ficam entre 0 e 19). Repintura é tinta, não forma, então o gate aprova; o
  // que o número diz é que a armação ENCOSTA no olho. É consequência declarada de o
  // campo do óculos não excluir a cápsula (ver `noCampoDoOculos`), e é o Gate −1 que
  // a mede, que é onde essa pergunta sempre morou.
  "oculos-aviator": "Aviator",
};

/**
 * As artes que a rota já promoveu SOBRE A BASE OFICIAL, como caminho de PNG.
 *
 * É a lista que `arte:traco` e `arte:borda` percorrem quando ninguém passa alvo na
 * linha de comando. Rosto primeiro, cabelo depois, cada bloco em ordem de inserção —
 * a ordem só afeta a leitura do relatório.
 */
export const ARTES_PROMOVIDAS: string[] = [
  ...Object.keys(NOMES_ROSTO),
  ...Object.keys(NOMES_CABELO),
].map((arquivo) => `${PASTA}/${arquivo}.png`);
