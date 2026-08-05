/**
 * OS CINCO PARAMÉTRICOS COMO ELES SAÍAM ANTES DO B4 — o congelamento da regressão.
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
 * Regerar é legítimo em um caso só: quando um dos cinco for **re-traçado** e sair da
 * família paramétrica de propósito (o `curto` é o primeiro da fila, no checkpoint C).
 * Aí o teste avisa antes, pelo nome certo — a amarra "os cinco continuam
 * paramétricos" reprova primeiro, dizendo que a peça mudou de família em vez de
 * deixar um diff de bytes sem explicação.
 *
 * Gerado por `.scratch/estilo/b4-dump-parametricos.ts` sobre o código de antes do B4.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
  "curto": {
    bytes: 7715,
    sha: "b42ee54995e34b12935de32cef06e42ad335d4abd1968d05588d2c656c5084bc",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "curto (animado)": {
    bytes: 8332,
    sha: "acbed14875d80c1472641115517816f48c8b6316df9e5ef52908e275aaa45628",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "cacheado": {
    bytes: 8337,
    sha: "0c77596d7e0522e08231d1bdd79bef98c707332b1bcd19176cc50187b1bb4658",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "cacheado (animado)": {
    bytes: 8954,
    sha: "8921594730f9eda3af44c872a734dbd876a40b28f96462f19f93c217465b9177",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "tranca": {
    bytes: 8145,
    sha: "c450e0a387ad0f606a5efbed2ce868b53c0a2e2bbd8ce7f359e99744230260a3",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "tranca (animado)": {
    bytes: 8762,
    sha: "7fac3caca9ecb593eeeb207c2ffc605c0eba972ef355922c498475203279275a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "coque": {
    bytes: 7913,
    sha: "64f5964758939673133f0552fa08e752b5bfd15cfb97647c2e0a6ada3761940d",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "coque (animado)": {
    bytes: 8530,
    sha: "abe2655d42988d9b7e3ea3b84b45dc7763dc15c2a7747cb0041d67fa86332869",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "moicano": {
    bytes: 7475,
    sha: "f73e715e44c63f2c85787bbb60b1359778276b15a31e1d6910d355c8aa0b2197",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
  "moicano (animado)": {
    bytes: 8092,
    sha: "c4d234f8353155e812780399f3a39c329750e648a9dffe5e099bebecbeecd6aa",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo{fill:var(--av-cabelo)}.t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-cabelo-e{fill:var(--av-cabelo);stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}.t .kk-respira{animation:t-respira 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-sombra{animation:t-sombra 3.5s ease-in-out infinite;transform-origin:250px 622px}.t .kk-olho{animation:t-pisca 5.2s ease-in-out infinite}@keyframes t-respira{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-4px) scaleY(1.012)}}@keyframes t-sombra{0%,100%{transform:scale(1)}50%{transform:scale(.94)}}@keyframes t-pisca{0%,96%,100%{transform:scaleY(1)}97.4%{transform:scaleY(.08)}98.8%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.t .kk-respira,.t .kk-sombra,.t .kk-olho{animation:none}}",
  },
  "__careca": {
    bytes: 6763,
    sha: "6bdd6af8ac326bbf504bd9c795109f59e267e23c177d444bd7d2dd225703058a",
    css: ".t .kk-traco{fill:none;stroke:var(--av-linha);stroke-width:var(--av-traco);stroke-linejoin:round;stroke-linecap:round}.t .kk-pele{fill:var(--av-pele)}.t .kk-pele-s{fill:var(--av-pele-s)}.t .kk-tinta{fill:var(--av-linha)}.t .kk-risco{fill:none;stroke:var(--av-linha);stroke-linecap:round}.t .kk-luz{fill:#FFFFFF;opacity:.30}.t .kk-olho{transform-box:fill-box;transform-origin:center}",
  },
};
