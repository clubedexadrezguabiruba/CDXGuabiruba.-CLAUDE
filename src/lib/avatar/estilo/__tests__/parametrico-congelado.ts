/**
 * OS SETE MODELOS COMO ELES SAEM HOJE — o congelamento da regressão.
 *
 * ---------------------------------------------------------------------------
 * QUINZE SELOS, EM TRÊS GRUPOS QUE NÃO SIGNIFICAM A MESMA COISA
 * ---------------------------------------------------------------------------
 *
 * **10 paramétricos** (5 modelos × parado/animado) — congelados desde o B4. Um
 * movimento aqui é a pergunta *"por que os paramétricos mudaram?"*.
 *
 * **4 traçados promovidos** (`espetado` e `chanel`, aprovados pelo Doug em
 * 2026-08-07) — congelados desde a promoção. Um movimento aqui quer dizer que a
 * saída da **rota de arte** mudou: ou uma arte foi redesenhada, ou o
 * `converter()` passou a produzir outra coisa. Nos dois casos há uma peça
 * aprovada mudando de aparência, e a decisão é do Doug.
 *
 * **1 careca** — o teto de regressão absoluto do estilo.
 *
 * ⚠️ **O nome `PARAMETRICO_CONGELADO` ficou estreito e não foi trocado**: ele
 * guarda os quinze, não só os dez paramétricos. Renomear custaria nove arquivos, a
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
 * olhada se a regra que vazou foi a do cabelo. Guardar o SVG completo dos onze casos
 * custaria 89 KB de fixture para melhorar um relatório que estas duas linhas já
 * resolvem.
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
  "moicano": {
    bytes: 7525,
    sha: "3e11df56c6fc504a15854ff5948eef8b648ad39c279b370494e48112838f82bc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "moicano (animado)": {
    bytes: 8142,
    sha: "d177baa6929b8fd23eea4641bff79608352b345fd845bc663a2f35f1205715fd",
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
    bytes: 11867,
    sha: "5c10682e89d96350041f92984c7422f2f9a7d3306641a6203afc50be811a4f4c",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "chanel (animado)": {
    bytes: 12484,
    sha: "025e4efcb1bd47fa4243c21f7672b9bd92cef30b74a18c3e79601698bbb91e78",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "assimetrico": {
    bytes: 14074,
    sha: "e33e27bdc704f2862eb62dee9590231903ccafab6a460c703f25c07daec9820c",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "assimetrico (animado)": {
    bytes: 14691,
    sha: "04ed776deb924f7ff4068eef83b46ce2e56ac5a00ea15574036bd6138c6ece20",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-m{fill:var(--av-cabelo-s)}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "__careca": {
    bytes: 6813,
    sha: "e96995516ba3e09004576d934dac50e7b3787223ad32768707dfbf1e8303b959",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
};
