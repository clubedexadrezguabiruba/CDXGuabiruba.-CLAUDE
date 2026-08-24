/**
 * O CATÁLOGO INTEIRO COMO ELE SAI HOJE — o congelamento da regressão.
 *
 * ---------------------------------------------------------------------------
 * 13 SELOS, EM QUATRO GRUPOS QUE NÃO SIGNIFICAM A MESMA COISA
 * ---------------------------------------------------------------------------
 *
 * ⚠️ **Os números desta seção são DERIVADOS das listas de família, não escritos.**
 * Eles já envelheceram uma vez: o cabeçalho dizia "quinze selos" com onze no
 * arquivo, porque a poda de 2026-08-08 mudou o elenco e a prosa ficou. Número de
 * contagem em prosa é a coisa que este repositório paga mais caro.
 *
 * **2 paramétricos** (1 modelo(s) × parado/animado — coque) —
 * congelados desde o B4. Um movimento aqui é a pergunta *"por que os paramétricos
 * mudaram?"*.
 *
 * **2 traçados promovidos** (espetado) — congelados desde a
 * promoção de cada um. Um movimento aqui quer dizer que a saída da **rota de arte**
 * mudou: ou uma arte foi redesenhada, ou o `converter()` passou a produzir outra
 * coisa. Nos dois casos há uma peça aprovada mudando de aparência, e a decisão é do
 * Doug.
 *
 * **8 tonais promovidos** (chanel, moicano, assimetrico, burst-fade) — o grupo mais novo, e ele
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
 * guarda os 13, não só os 2 paramétricos. Renomear custaria nove arquivos, a
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
 * olhada se a regra que vazou foi a do cabelo. Guardar o SVG completo dos 13 casos
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
 * GERADO por `npm run avatar:congelar` (`scripts/avatar/estilo/dump-parametricos.ts`).
 * Não edite à mão: um arquivo meio regerado mistura duas gerações e ninguém
 * consegue mais dizer quais linhas descrevem o quê.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
  "coque": {
    bytes: 7963,
    sha: "d32dfbd2a9618bce67b213add327aa36e10f8aec497938afca215daa7994389f",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "coque (animado)": {
    bytes: 8580,
    sha: "1df800ab59f45802cddc52b043f544b8bf556ed3438d9473094492bd923fdce7",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "espetado": {
    bytes: 13319,
    sha: "8d64c618dc3a7fbe7288c06066152bf5c3182a4129d732fa087da598f7c6ab99",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-cabelo-l{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "espetado (animado)": {
    bytes: 13936,
    sha: "00eca1078bf40d6285efe9da09fe3111b95eea9af2af1adfff03301d0ca14b46",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-cabelo-l{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "chanel": {
    bytes: 12620,
    sha: "08fee70bd03200f0d0c82e565b8ca374f7bd36957d58b692405550badeb0092a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "chanel (animado)": {
    bytes: 13237,
    sha: "e5665ef31310c391bde3da17d5d725da0a38664595d244d1fbe706a57d29107f",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "moicano": {
    bytes: 9731,
    sha: "58c3f6aa95fb014eb6885d589c7f2c9a533a6dc56e580b27401395a82324b6e1",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "moicano (animado)": {
    bytes: 10348,
    sha: "d895994a28cc3c0feff3c9ea8bd80e341a0900c5edc4a0f76ceaebb2d6704352",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "assimetrico": {
    bytes: 12176,
    sha: "06bf07fc2caeda3c315528d1d7723da98a649aea27de52c2630daa6336f75d90",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "assimetrico (animado)": {
    bytes: 12793,
    sha: "72c2e9776ceabc2ca92cd69f7c1018e4904a061f1e72c84a79e2cca64c1edfc5",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "burst-fade": {
    bytes: 11616,
    sha: "91068373d6d51b978ec16939974b357f40d43ba316c6b715043bd2b2f65233dc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "burst-fade (animado)": {
    bytes: 12233,
    sha: "0d4b9e5ddaaaf0b2858609d2cda873aed1f466e094d8fb83e7c3287f945ca40b",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "__careca": {
    bytes: 6813,
    sha: "e96995516ba3e09004576d934dac50e7b3787223ad32768707dfbf1e8303b959",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
};
