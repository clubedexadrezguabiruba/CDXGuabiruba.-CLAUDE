/**
 * A TRAVA DO RECORTE DE CABEÇA — nenhuma peça do catálogo sangra para fora dele.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ELE EXISTE PARA IMPEDIR
 * ---------------------------------------------------------------------------
 *
 * `<AvatarCabeca>` mostra o boneco por uma janela menor. Uma janela apertada não
 * quebra nada: ela **corta cabelo** — e corta em silêncio, porque SVG não avisa
 * quando algo cai fora do `viewBox`. É a mesma classe de falha que o T1.5 mediu no
 * corpo inteiro (a crista do moicano desenhada em `y = −76`, três bicos virando
 * barra reta), e ela atravessou meses invisível.
 *
 * A janela é derivada de constantes; a folga lateral é um número escolhido. Este
 * teste é o que impede o número escolhido de envelhecer: ele **rasteriza as 6
 * opções** (careca + os 5 modelos), lê a caixa da tinta na região da cabeça, e
 * exige que ela caiba na janela. Peça nova que não couber reprova aqui, no dia em
 * que entra — e a regra é **o recorte cresce, nunca a peça encolhe.**
 *
 * ---------------------------------------------------------------------------
 * POR QUE RASTERIZAR, E NÃO LER OS PONTOS DA PEÇA
 * ---------------------------------------------------------------------------
 *
 * Os pontos de `CABELOS` são a massa; o que a tela mostra é a massa **mais o
 * `stroke` de 12 unidades**, mais o clip da cabeça, mais a escala de 92% que
 * `compor()` aplica. Medir os pontos mediria o que se pretendeu desenhar. Aqui se
 * mede o que sai — que é a única coisa que a criança vê.
 *
 * ---------------------------------------------------------------------------
 * E POR QUE O CHROMIUM, E NÃO O `sharp`
 * ---------------------------------------------------------------------------
 *
 * Custou uma rodada, e o repositório já tinha a lição escrita em dois lugares
 * (`scripts/avatar/arte/folha.ts:37`, `tracar-cabelo.ts:150`): o `sharp` usa
 * librsvg, que **não resolve custom property**. O compositor pinta tudo por
 * `var(--av-*)`, e o que não resolve vira inválido — o `fill` renderiza preto e,
 * pior para esta medida, `stroke-width: var(--av-traco)` cai de **12 para 1**.
 * Medido: a mesma careca dá x0 = 89,0 no `sharp` e **83,5** no Chromium. São 5,5
 * unidades de tinta que o `sharp` não vê **de cada lado**, e um teto calibrado
 * nelas aprovaria um recorte que corta cabelo no navegador.
 *
 * O CI instala o Chromium antes do `npm test` (`ci.yml:62`), então isto roda lá.
 *
 * ---------------------------------------------------------------------------
 * A REGIÃO DA CABEÇA, E POR QUE ELA PARA NO QUEIXO
 * ---------------------------------------------------------------------------
 *
 * Vai do topo do quadro (`y = 0`) à base da cabeça. Abaixo dali o que existe é
 * tronco — e mecha sobre o tronco, no caso do `chanel`, que um recorte de cabeça
 * corta como qualquer retrato corta o ombro. Incluir o tronco na região faria o
 * teste exigir que o recorte mostrasse o boneco inteiro, que é exatamente o que
 * ele existe para não fazer.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "@playwright/test";
import { compor, naTela } from "../../../../src/lib/avatar/estilo/compositor";
import { MODELOS_CABELO } from "../../../../src/lib/avatar/estilo/cabelo";
import { CAIXA_CABECA, TRACO, VIEWBOX } from "../../../../src/lib/avatar/estilo/geometria";
import { RECORTE_CABECA, recortarNaCabeca } from "../../../../src/lib/avatar/estilo/recorte";
import { CABELO, PELE } from "../../../../src/lib/avatar/palette";
import { cru } from "../tracar-cabelo";

/** As 6 opções que o aluno vê. `undefined` é a careca — ausência de peça. */
const OPCOES = [undefined, ...MODELOS_CABELO] as const;

/**
 * Altura do raster: 1400 px para 700 unidades, ou **0,5 unidade por pixel**.
 *
 * A pergunta aqui é "a tinta cabe na janela?", e a resposta é uma comparação de
 * caixas com dezenas de unidades de folga. Meia unidade de discretização é duas
 * ordens de grandeza abaixo disso.
 */
const ALTURA_PX = 1400;
const LARGURA_PX = Math.round((ALTURA_PX * VIEWBOX.w) / VIEWBOX.h);

/**
 * O fundo é branco, então tinta é todo pixel que não é branco. **Não se usa o
 * limiar de `ESCURO`**: ele enxerga só o contorno, e a pergunta aqui inclui o
 * preenchimento do cabelo e a pele — que também sangram.
 */
const TOL_BRANCO = 6;

interface Caixa {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

let navegador: Browser;
let pagina: Page;

beforeAll(async () => {
  navegador = await chromium.launch();
  pagina = await navegador.newPage({
    viewport: { width: LARGURA_PX, height: ALTURA_PX },
    deviceScaleFactor: 1,
  });
}, 60_000);

// 30 s, e o `beforeAll` acima já pedia 60: fechar o Chromium sob a carga da corrida
// cheia passou dos 10 s padrão em 2026-08-25, quando o `RECORTE` cresceu de 600 para
// 648 px de largura e a esteira ficou ~8% mais pesada. O trabalho é o mesmo; o que
// acabou foi a margem. Solo, este arquivo inteiro roda em ~2,5 s.
afterAll(async () => {
  await navegador?.close();
}, 30_000);

/** A caixa da tinta acima de `yLimite`, em unidades do QUADRO. `null` se não há tinta. */
async function caixaDaTintaNaCabeca(modelo: string | undefined, yLimite: number) {
  const svg = compor({
    pele: PELE[2],
    cabelo: CABELO[0],
    modeloCabelo: modelo as never,
    ns: "trava",
    folhaExterna: false,
  });

  await pagina.setContent(
    `<body style="margin:0;background:#FFF">` +
      svg.replace("<svg ", `<svg width="${LARGURA_PX}" height="${ALTURA_PX}" `) +
      `</body>`,
  );
  const png = await pagina.screenshot({
    clip: { x: 0, y: 0, width: LARGURA_PX, height: ALTURA_PX },
  });
  const b = await cru(png);

  const u = VIEWBOX.h / b.h; // px → unidade de quadro
  const yLimitePx = Math.round(yLimite / u);

  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;

  for (let y = 0; y <= Math.min(yLimitePx, b.h - 1); y++) {
    for (let x = 0; x < b.w; x++) {
      const i = (y * b.w + x) * b.canais;
      if (
        b.data[i] > 255 - TOL_BRANCO &&
        b.data[i + 1] > 255 - TOL_BRANCO &&
        b.data[i + 2] > 255 - TOL_BRANCO
      ) {
        continue;
      }
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  if (x0 === Infinity) return null;
  return { x0: x0 * u, x1: (x1 + 1) * u, y0: y0 * u, y1: (y1 + 1) * u } satisfies Caixa;
}

/** A base da cabeça no quadro — onde a região do retrato acaba. */
const Y_BASE_CABECA = naTela({ y: CAIXA_CABECA.y1 + TRACO / 2 }).y;

describe("o recorte de cabeça contém as 6 opções do catálogo", () => {
  it.each(OPCOES.map((m) => [m ?? "careca", m] as const))(
    "%s cabe inteiro na janela",
    async (nome, modelo) => {
      const caixa = await caixaDaTintaNaCabeca(modelo, Y_BASE_CABECA);
      expect(caixa, `${nome}: nenhuma tinta na região da cabeça`).not.toBeNull();
      const c = caixa!;

      const dir = RECORTE_CABECA.x + RECORTE_CABECA.w;
      const baixo = RECORTE_CABECA.y + RECORTE_CABECA.h;

      // As quatro bordas, uma asserção cada: quando reprovar, a mensagem diz de que
      // lado a peça escapou — e é o lado que decide se a folga cresce ou o recorte
      // desce.
      expect(c.x0, `${nome} sangra pela ESQUERDA`).toBeGreaterThanOrEqual(RECORTE_CABECA.x);
      expect(c.x1, `${nome} sangra pela DIREITA`).toBeLessThanOrEqual(dir);
      expect(c.y0, `${nome} sangra por CIMA`).toBeGreaterThanOrEqual(RECORTE_CABECA.y);
      expect(c.y1, `${nome} sangra por BAIXO`).toBeLessThanOrEqual(baixo);
    },
    30_000,
  );

  /**
   * O TETO SUPERIOR É `y = 0`, E É POR ISSO QUE O RECORTE NÃO MENTE.
   *
   * Se ele começasse acima do quadro, a navbar mostraria a crista do moicano que o
   * `/perfil` corta — duas telas discordando sobre a mesma criança. Se começasse
   * abaixo, cortaria cabelo que o corpo inteiro mostra.
   */
  it("a janela começa exatamente no topo do quadro", () => {
    expect(RECORTE_CABECA.y).toBe(0);
  });

  /** Quadrado: quem consome são cápsulas redondas, e cápsula redonda quer lado. */
  it("a janela é quadrada", () => {
    expect(RECORTE_CABECA.w).toBe(RECORTE_CABECA.h);
  });

  /**
   * O recorte tem de PAGAR pelo que custa. A cabeça a 32 px sai de 13,2 px no corpo
   * inteiro para 19,2 px aqui — e é essa conta, e não o gosto, que justifica um
   * componente a mais. Um recorte que crescesse até engolir o boneco todo passaria
   * em todas as asserções acima e não compraria nada.
   */
  it("a cabeça ocupa pelo menos metade da janela, senão o recorte não comprou nada", () => {
    const alturaDaCabeca =
      naTela({ y: CAIXA_CABECA.y1 + TRACO / 2 }).y - naTela({ y: CAIXA_CABECA.y0 - TRACO / 2 }).y;
    expect(alturaDaCabeca / RECORTE_CABECA.h).toBeGreaterThan(0.5);
    // E o ganho contra o corpo inteiro, escrito como número e não como promessa.
    expect(RECORTE_CABECA.h).toBeLessThan(VIEWBOX.h * 0.75);
  });

  /**
   * `String.replace` que não casa devolve a string ORIGINAL, em silêncio. O sintoma
   * seria um boneco de corpo inteiro espremido em 32 px na navbar: feio o bastante
   * para alguém notar, sutil o bastante para atravessar um deploy.
   */
  it("recortarNaCabeca lança se o viewBox de compor() mudar de formato", () => {
    expect(() => recortarNaCabeca('<svg viewBox="0 0 1 1"></svg>')).toThrow(/viewBox/);
  });

  it("recortarNaCabeca troca o viewBox do corpo inteiro pelo da cabeça", () => {
    const svg = compor({
      pele: PELE[2],
      cabelo: CABELO[0],
      ns: "t",
      folhaExterna: true,
    });
    const cortado = recortarNaCabeca(svg);
    expect(cortado).not.toContain(`viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}"`);
    expect(cortado).toContain(`viewBox="${RECORTE_CABECA.x.toFixed(1)}`);
    // Nada além do viewBox se move: o SVG é o MESMO documento.
    expect(cortado.length - svg.length).toBeLessThan(40);
  });
});
