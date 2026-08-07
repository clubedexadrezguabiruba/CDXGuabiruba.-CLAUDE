/**
 * OS CINCO PARAMÉTRICOS COMO ELES SAEM HOJE — o congelamento da regressão.
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
 * Regerar é legítimo em **dois** casos, e o segundo entrou em 2026-08-06:
 *
 *  1. quando um dos cinco for **re-traçado** e sair da família paramétrica de
 *     propósito. Aí o teste avisa antes, pelo nome certo — a amarra "os cinco
 *     continuam paramétricos" reprova primeiro, dizendo que a peça mudou de família
 *     em vez de deixar um diff de bytes sem explicação;
 *  2. quando uma **decisão declarada** muda o que `compor()` emite para todos.
 *
 * O caso 2 aconteceu uma vez: **os 92% viraram padrão** (`ESCALA_PADRAO` em
 * `compositor.ts`). O `viewBox` deixa 45,5 u acima da coroa e a peça traçada da
 * primeira arte real sobe a −38,9 u — o viewport guilhotinava sem erro e sem aviso.
 * A figura passou a ser reancorada e encolhida, o que acrescenta um `<g transform>`
 * de **+50 bytes** a cada um dos onze. Nenhum outro selo do repositório se moveu:
 * `verify:pose` continua passando e os outros 435 testes também.
 *
 * GERADO por `npm run avatar:congelar` (`scripts/avatar/estilo/dump-parametricos.ts`).
 * Não edite à mão: um arquivo meio regerado mistura duas gerações e ninguém
 * consegue mais dizer quais linhas descrevem o quê.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
  "curto": {
    bytes: 7765,
    sha: "b8b9659be2b5b7deed5f50103cbfea11a73d8aa45d7c6d8f02ce826a195c7442",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "curto (animado)": {
    bytes: 8382,
    sha: "f892ee5f71c41eba8eb51f3a41cecb21f71ef534cd091711b369740d73bf70b1",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "cacheado": {
    bytes: 8387,
    sha: "6b704e66542e7940ada2398827f0e86368119c81452eebdf42161a3a62594bc5",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "cacheado (animado)": {
    bytes: 9004,
    sha: "e7c1004a5903a9d8f28788b5522fc96cef04367d172c8c12f27d4aadc0113095",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "tranca": {
    bytes: 8195,
    sha: "72e8e5da12747f84c1a59e6125d8ddf0ee69047ce76291be080b4a89fa5246c3",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "tranca (animado)": {
    bytes: 8812,
    sha: "4bdbaabc7d40d84c53ae99ab906ea8cb5a9754956042a9d7bfed51336961c401",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
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
  "__careca": {
    bytes: 6813,
    sha: "e96995516ba3e09004576d934dac50e7b3787223ad32768707dfbf1e8303b959",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
};
