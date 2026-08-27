/**
 * O CATÁLOGO INTEIRO COMO ELE SAI HOJE — o congelamento da regressão.
 *
 * ---------------------------------------------------------------------------
 * 39 SELOS, EM QUATRO GRUPOS QUE NÃO SIGNIFICAM A MESMA COISA
 * ---------------------------------------------------------------------------
 *
 * ⚠️ **Os números desta seção são DERIVADOS das listas de família, não escritos.**
 * Eles já envelheceram uma vez: o cabeçalho dizia "quinze selos" com onze no
 * arquivo, porque a poda de 2026-08-08 mudou o elenco e a prosa ficou. Número de
 * contagem em prosa é a coisa que este repositório paga mais caro.
 *
 * **0 paramétricos** (0 modelo(s) × parado/animado — ) —
 * congelados desde o B4. Um movimento aqui é a pergunta *"por que os paramétricos
 * mudaram?"*.
 *
 * **0 traçados promovidos** () — congelados desde a
 * promoção de cada um. Um movimento aqui quer dizer que a saída da **rota de arte**
 * mudou: ou uma arte foi redesenhada, ou o `converter()` passou a produzir outra
 * coisa. Nos dois casos há uma peça aprovada mudando de aparência, e a decisão é do
 * Doug.
 *
 * **38 tonais promovidos** (chanel, moicano, assimetrico, burst-fade, cachos-anjo, curto-repartido, longo-unilateral, pixie, rabo-baixo, trancas-duplas, coque-simples, tigela-franja, espetado, maria-chiquinha, coque-individual, coques-duplos, dreadlocks, elvis, curto-penteado) — o grupo mais novo, e ele
 * **nasceu de um buraco medido**. Quando o `chanel` migrou de `MODELOS_TRACADOS`
 * para `MODELOS_TONAIS` em 2026-08-22, este arquivo só emitia as duas primeiras
 * listas: os dois selos dele **pararam de ser conferidos por ninguém** e ficaram no
 * disco como texto morto, descobertos na promoção do `moicano` no mesmo dia. A
 * regra da rota — *"um paramétrico que mude de família não pode sumir do teste em
 * silêncio"* — valia para a saída e não tinha quem cobrasse a chegada. Agora tem.
 *
 * **1 careca** — o teto de regressão absoluto do estilo.
 *
 * ⚠️ **O nome `PARAMETRICO_CONGELADO` ficou estreito e não foi trocado**: ele
 * guarda os 39, não só os 0 paramétricos. Renomear custaria nove arquivos, a
 * maioria em prosa (`ESTADO-DA-ROTA`, o runbook 19, a skill), por um ganho de
 * nome — e o que este repositório paga caro é número escrito em muitos lugares,
 * não nome estreito com o esclarecimento ao lado. Fica escrito aqui.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * O B4 separou a classe do cabelo que tinha dois papéis: `.kk-cabelo-s` (fill **e**
 * stroke) continua servindo à família paramétrica, e a família traçada passou a
 * `.kk-cabelo-m` + `.kk-cabelo-l`. A correção é para o laço fechado; se ela vazar
 * para quem não devia, os cinco modelos do catálogo mudam de bytes — e mudam
 * **caladas**, porque nenhuma das amarras de `cabelo.test.ts` mede byte: elas medem
 * folga, coroa, contenção, orçamento. Um cabelo que mudasse de aparência sem mudar
 * nenhum desses números passaria inteiro.
 *
 * ---------------------------------------------------------------------------
 * SHA E CSS, E POR QUE OS DOIS
 * ---------------------------------------------------------------------------
 *
 * O `sha` é a garantia byte a byte: qualquer caractere diferente em qualquer lugar
 * do SVG reprova. Ele sozinho, porém, dá o pior relatório possível — "duas strings
 * de 64 caracteres diferem" não diz o que mudou.
 *
 * O `css` é o bloco `<style>` inteiro, em texto, e é onde a mudança do B4 teria
 * caído. Quando o teste quebra, é ele que aparece no diff do vitest e diz em uma
 * olhada se a regra que vazou foi a do cabelo. Guardar o SVG completo dos 39 casos
 * custaria fixture de dezenas de KB para melhorar um relatório que estas duas linhas
 * já resolvem.
 *
 * ---------------------------------------------------------------------------
 * QUANDO REGERAR — E QUANDO **NÃO**
 * ---------------------------------------------------------------------------
 *
 * Este arquivo é congelado de propósito. Ele **não** se regenera porque o teste
 * ficou vermelho: vermelho aqui é a pergunta "por que os paramétricos mudaram?", e
 * regerar sem responder é apagar a pergunta.
 *
 * Regerar é legítimo em **três** casos, e o terceiro entrou em 2026-08-07:
 *
 *  1. quando um dos paramétricos for **re-traçado** e sair da família de propósito.
 *     Aí o teste avisa antes, pelo nome certo — a amarra "os paramétricos continuam
 *     paramétricos" reprova primeiro, dizendo que a peça mudou de família em vez de
 *     deixar um diff de bytes sem explicação;
 *  2. quando uma **decisão declarada** muda o que `compor()` emite para todos;
 *  3. quando um modelo **entra ou sai do catálogo** — a promoção de uma peça da
 *     rota de arte, ou a re-emissão de uma promovida por outra variante. Aqui o
 *     número novo não é acidente: é uma arte que o Doug aprovou de novo.
 *
 * O caso 2 aconteceu uma vez: **os 92% viraram padrão** (`ESCALA_PADRAO` em
 * `compositor.ts`). O `viewBox` deixa 45,5 u acima da coroa e a peça traçada da
 * primeira arte real sobe a −38,9 u — o viewport guilhotinava sem erro e sem aviso.
 * A figura passou a ser reancorada e encolhida, o que acrescenta um `<g transform>`
 * de **+50 bytes** a cada um dos onze. Nenhum outro selo do repositório se moveu:
 * `verify:pose` continua passando e os outros 435 testes também.
 *
 * O caso 3 aconteceu uma vez: **espetado e chanel entraram no catálogo** em
 * 2026-08-07, e os onze selos viraram quinze. Os onze antigos **não se moveram um
 * byte** — foi a asserção negativa da promoção.
 *
 * O caso 4 aconteceu uma vez: **a peça sobreposta passou a ser emitida depois das
 * feições do rosto**, em 2026-08-08. Antes ela saía logo após o contorno da cabeça,
 * e a sobrancelha era pintada POR CIMA do cabelo — medido na `entrada-2`: 315 dos
 * 753 px visíveis de sobrancelha, 41,8%, em cima da massa.
 *
 * **Só os 4 selos dos dois traçados se moveram, e só no `sha`: os `bytes` são
 * idênticos.** Mesma quantidade de conteúdo, ordem diferente — que é exatamente o
 * que este selo existe para pegar. Os onze paramétricos e o careca não mudaram, e o
 * render foi conferido pixel a pixel nas duas versões: **0 de 350 000 pixels
 * diferentes** em espetado, chanel, curto, coque, moicano e careca. Só a
 * `entrada-2` mudou (322 px), que é o defeito sendo consertado. O selo mediu ordem
 * de emissão, não aparência — por isso reescrevê-lo aqui é registro, não
 * afrouxamento.
 *
 * O caso 5 aconteceu uma vez: **o Doug podou o catálogo de sete para cinco**, em
 * 2026-08-08, mantendo só o que ele aprovou olhando o render. Saíram `curto`,
 * `cacheado` e `tranca`; entrou `assimetrico`, promovida da `entrada-2`. Os selos
 * foram de quinze para **onze**, e os das peças que ficaram **não se moveram um
 * byte** — foi a asserção negativa da poda.
 *
 * ⚠️ O `curto` era o controle aprovado das ferramentas de medição (`folha.ts`,
 * `reguas-conferidas.ts`, `mapear.ts`) e o padrão da página `/dev/avatar-kokeshi`.
 * O controle passou a ser o `coque`, que é o paramétrico que sobrou. **Um controle
 * que aponta para peça apagada não reprova: ele deixa de existir**, e o gate passa
 * por vacuidade.
 *
 * O caso 2 aconteceu uma SEGUNDA vez, em 2026-08-25: **o `viewBox` foi de 500 para
 * 600 de largura**, para caber chapéu de aba comprida. Os **29 selos** se moveram, e
 * **os `bytes` são idênticos em todos** — só o `sha` mudou.
 *
 * A prova de que foi o QUADRO e não o desenho está medida: desfazendo no SVG de hoje
 * **apenas dois tokens** — `viewBox="0 0 600 700"` de volta a 500, e
 * `translate(70 ` de volta a 20 —, **os 28 selos de cabelo voltam a bater byte a
 * byte**. Nenhum outro caractere se moveu.
 *
 * ⚠️ E o caminho até essa prova achou um defeito de verdade: `pathFacetaEsq` e
 * `pathFacetaDir` escreviam `VIEWBOX.w + FORA` na aba que fecha o polígono fora da
 * silhueta. Ali o número queria dizer *"além da borda direita do DESENHO"*, e as duas
 * medidas valeram 500 até aquele dia. Com o quadro em 600 os quatro números andaram
 * 100 unidades **sem mudar um pixel do render** — a aba já estava fora da figura. Os
 * selos pegaram; o olho não pegaria. Corrigido para `LARGURA_INTERNA + FORA`, que é a
 * constante que nasceu no mesmo dia para separar as duas larguras.
 *
 * GERADO por `npm run avatar:congelar` (`scripts/avatar/estilo/dump-parametricos.ts`).
 * Não edite à mão: um arquivo meio regerado mistura duas gerações e ninguém
 * consegue mais dizer quais linhas descrevem o quê.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
  "chanel": {
    bytes: 12620,
    sha: "c366a52ce7dfd106c99b2b7affbf9e401b2cabc44804d92a8b52c8e6c1be5ddc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "chanel (animado)": {
    bytes: 13237,
    sha: "e0ba25a2b4dde2d22ad9dddc9ce55ca3d4c1ef820768b1c188b5355548b9a629",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "moicano": {
    bytes: 9731,
    sha: "29a5567435eaeba31a73575a948a99b33a0dfb1ba8961399d2f6882158bce225",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "moicano (animado)": {
    bytes: 10348,
    sha: "2e0bbe590be52576544ed9da09fba81485bec3ec687480fd24bf2a56bcd999b9",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "assimetrico": {
    bytes: 12176,
    sha: "25f2446a51c4c5ba509525461408f09d72f3673d05e6f97ccfa1cef3e4e89a89",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "assimetrico (animado)": {
    bytes: 12793,
    sha: "f8c828e94b948c069182b4a19f15c330ea5be59603c7e8bce8a74cd39ac248e2",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "burst-fade": {
    bytes: 11616,
    sha: "39c6475c99d7c42286cac399f1c5a59f4ae296bda6dfc98e4f1a4b1ff3d6eef6",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "burst-fade (animado)": {
    bytes: 12233,
    sha: "0561feb535286e105d563fe074b8acf587aa279d2f95fc6974ecf24e8653fde2",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "cachos-anjo": {
    bytes: 16255,
    sha: "bce8672749e98ec6ef055e9f88d4c2a51302ed2670c3c775a992d4398d9d74bf",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "cachos-anjo (animado)": {
    bytes: 16872,
    sha: "7caf9edfabac24957af382c987bf9bc326a07d62b0706a92683b4393cb86e6e2",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "curto-repartido": {
    bytes: 9663,
    sha: "b3638f920aa85171ad9e213adbf13d3d6d8190a9e66a499cee3b047aece2e98e",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "curto-repartido (animado)": {
    bytes: 10280,
    sha: "4534396fd60d4bd73292dc693ee0a34d33f006dd7a44acfc3d634c03e5524a47",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "longo-unilateral": {
    bytes: 10949,
    sha: "368378e9c6d020e02bc019bf648787dd96d5f6664a28a7162b8ea1ee8608d5ea",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "longo-unilateral (animado)": {
    bytes: 11566,
    sha: "f8f00259a349a4f7514617adc80c06fc21530ff78f4ec5e188cba099433100a9",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "pixie": {
    bytes: 10837,
    sha: "b765d2b5ddc0bc7bba1cf0197bc793a3342acf2b88e03757a61d8a913c3ecb2c",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "pixie (animado)": {
    bytes: 11454,
    sha: "61c054c5fd3ae7832c765e79ac1c1776892f687442a921480d95468b384936db",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "rabo-baixo": {
    bytes: 10768,
    sha: "2ce8f9c7e12506bee2ad0c3a89cdba26b9389da292dedd83489c3f7931da15ff",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "rabo-baixo (animado)": {
    bytes: 11385,
    sha: "4609dd43afae681ccd5c04554c96df1f7c16f2c49c530ddbf1e39f91cff16610",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "trancas-duplas": {
    bytes: 14622,
    sha: "20d153303a86800319979900ea9a467ae53d2713ef1970aeb36867d225cb1564",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "trancas-duplas (animado)": {
    bytes: 15239,
    sha: "f548025f92c226946f8f2dcd6a437fe0c573fc50664feefdf7b20fe055cd8d4e",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "coque-simples": {
    bytes: 10865,
    sha: "b8a4dbc617930132699708bd333338732174677b0644fdb45db6a54737b1579e",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "coque-simples (animado)": {
    bytes: 11482,
    sha: "0164b2561be83d3d294168099e22e960b3ad227f5c08a85f75f59235a0eadee1",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "tigela-franja": {
    bytes: 9649,
    sha: "3b093012d304bd60e0937eb517c4531b679bc5e22c555a89c35700dbbaca4356",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "tigela-franja (animado)": {
    bytes: 10266,
    sha: "9b621e7ad322f8e0d2a9856da99f1f7024ee7a87bd6cd888b5342b41befe23dc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "espetado": {
    bytes: 14372,
    sha: "08fac661dedc7f0d77deda32a9750eefeff6874e86d9df903701aa18029a0fa2",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "espetado (animado)": {
    bytes: 14989,
    sha: "f1914712dc47b7d9792ec8b5bc73d0e100403d3189fa72ca85d935a6c5e365c8",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "maria-chiquinha": {
    bytes: 11755,
    sha: "c6c9890d0c254b5214d8067ad84a8843d87b4dd14706377c40430a4a70ac938a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "maria-chiquinha (animado)": {
    bytes: 12372,
    sha: "d93e6b60298d7bc4c7d4109ac255d54f824ddb74cbbc0745d4ef14a4938317fd",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "coque-individual": {
    bytes: 11462,
    sha: "e7456f58c3c3e08e49518feffb60efeef904efe4557682193ad73532d213cb7a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "coque-individual (animado)": {
    bytes: 12079,
    sha: "fe05dcbcb12011f5036b97b03235efab8f7081c47a38242b81416c6eb8e743a8",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "coques-duplos": {
    bytes: 10413,
    sha: "a4b74e3c78648095fedf78df1941f96d3891210c5a551fb23f3426e5a12e1673",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "coques-duplos (animado)": {
    bytes: 11030,
    sha: "8493e2d7dc24e2e670ce7dc7b5cc424d864f0fb1184dfcd0b5226028ca627b4b",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "dreadlocks": {
    bytes: 16672,
    sha: "fe08d36878039091fe0d60c2fbded4a8c90cf92f24d5fd1e74df0e79a91ed60b",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "dreadlocks (animado)": {
    bytes: 17289,
    sha: "48c1ec052b53e2b1d0bbc9d4d44f6794e16e9dc7696d69011c5765f746cb58dc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "elvis": {
    bytes: 11851,
    sha: "1d0bfb56b39944a000e2bf2551c00feaac898ca39b04a888e7b169c247e358bc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "elvis (animado)": {
    bytes: 12468,
    sha: "7bc76cd225890e539bdca2c43130428bee85ccd993f03b52d56d464f793e84ce",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "curto-penteado": {
    bytes: 10916,
    sha: "026a1446479199f234be05eb534e6695980132dc035fc5baa86b6b138bb08980",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "curto-penteado (animado)": {
    bytes: 11533,
    sha: "3cfe1d713b9df24d8c3c352ca616572e161888fb6b52ca7d77a1c616b78d3334",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "__careca": {
    bytes: 6813,
    sha: "7c8743d6e76080d0bd21dbb6ac162db4a902741564221bd576472399ea42947a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
};
