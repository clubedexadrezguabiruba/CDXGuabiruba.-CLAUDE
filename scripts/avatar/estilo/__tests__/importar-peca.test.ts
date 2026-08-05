/**
 * AS DUAS AMARRAS QUE O B3 ACRESCENTOU, cada uma com a fixture que a derruba.
 *
 * As duas nasceram de defeito medido, e não de zelo:
 *
 *  - **a reancoragem por linha**, porque registrar caixa contra caixa acerta escala e
 *    erra forma. A cabeça do gerador é redonda e a do kokeshi é de canto arredondado:
 *    com as duas caixas coincidindo, a arte fica até 100 unidades mais estreita na
 *    cúpula, e o cabelo — que na arte encosta na borda da cabeça em toda linha —
 *    aparecia com couro cabeludo à mostra em volta da coroa;
 *  - **o contrato de tinta**, porque a primeira semantização mandou a família clara
 *    para o papel `massa` e a escura para `tom-claro`. O arquivo era perfeitamente
 *    legal, e a peça sairia com o volume ao contrário.
 */
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";

import {
  CAIXA_CABECA,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  bordasEm,
} from "../../../../src/lib/avatar/estilo/geometria";
import { lerFontePecaOuFalhar } from "../fonte-peca";
import {
  FAIXA_COM_LARGURA,
  PISO_DESTINO,
  alturaComLargura,
  decidirN,
  importarPeca,
  pousarPorMarcos,
  type BordasDaArte,
  type Marcos,
} from "../importar-peca";
import { mapaPelaCaixa } from "../tracar-cabelo";

const dir = mkdtempSync(join(tmpdir(), "importar-"));
let n = 0;

function quad(x0: number, y0: number, x1: number, y1: number): string {
  const c = (ax: number, ay: number) => `C${ax},${ay} ${ax},${ay} ${ax},${ay}`;
  return `M${x0},${y0} ${c(x1, y0)} ${c(x1, y1)} ${c(x0, y1)} z`;
}

const path = (d: string, attrs: Record<string, string>, fill = "#19C7C0") =>
  `<path fill="${fill}" opacity="1.000000" stroke="none" ` +
  Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ") +
  ` d="${d}"/>`;

function arquivo(corpo: string): string {
  const p = join(dir, `i${n++}.svg`);
  writeFileSync(p, `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${corpo}</svg>`);
  return p;
}

/**
 * A CABEÇA DA ARTE: a guia, MAIS as duas cápsulas de olho.
 *
 * Os olhos não são enfeite da fixture — são um dos dois marcos do pouso, e sem eles
 * `marcosDaPeca` não tem onde ancorar e diz isso em voz alta. `acharOlhos` os
 * identifica por **razão de aspecto** (`OLHO.w / OLHO.h` = 0,458), então 22 × 48 é a
 * razão certa; eles vão de `descarte`, que é o que são para a peça de cabelo — a mesma
 * classificação que o contorno do boneco leva na arte de verdade.
 */
const olho = (x0: number) =>
  path(
    quad(x0, 140, x0 + 22, 188),
    { "data-avatar-role": "descarte", "data-motivo": "olho do boneco — marco do pouso, não é peça" },
    "#000000",
  );
const OLHOS = olho(80) + olho(154);

const GUIA =
  path(quad(20, 20, 230, 236), { "data-avatar-role": "guia", "data-avatar-grupo": "cabeca" }, "#000000") +
  OLHOS;

describe("o contrato de tinta reprova o volume ao contrário", () => {
  it("aceita o par certo: massa com `cabelo-s`, tom-claro com `cabelo`", async () => {
    const f = arquivo(
      GUIA +
        path(quad(40, 40, 200, 200), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo-s" }) +
        path(quad(60, 60, 180, 120), { "data-avatar-role": "tom-claro", "data-avatar-paint": "cabelo" }),
    );
    const r = await importarPeca(f);
    expect(r.falhas).toEqual([]);
  }, 60000);

  it("reprova os dois trocados, e diz o que o compositor faz com cada token", async () => {
    const f = arquivo(
      GUIA +
        path(quad(40, 40, 200, 200), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }) +
        path(quad(60, 60, 180, 120), { "data-avatar-role": "tom-claro", "data-avatar-paint": "cabelo-s" }),
    );
    const r = await importarPeca(f);
    expect(r.falhas.length).toBe(2);
    expect(r.falhas.join(" ")).toMatch(/volume ao contrário/);
  }, 60000);

  it("reprova a tinta declarada partida em duas ilhas — o descarte silencioso por dentro", async () => {
    const f = arquivo(
      GUIA +
        path(quad(40, 40, 100, 200), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo-s" }) +
        // Longe da primeira: componente separada, e o laço externo é UM.
        path(quad(160, 40, 200, 200), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo-s" }),
    );
    const r = await importarPeca(f);
    expect(r.falhas.join(" ")).toMatch(/tinta declarada está partida/);
  }, 60000);
});

describe("o pouso por marcos põe a borda da arte na borda do crânio", () => {
  /**
   * Uma cabeça de arte com a MESMA caixa do crânio e forma diferente: largura cheia
   * só a partir da metade, como uma cúpula redonda contra a do kokeshi.
   */
  const H = 512;
  const bordas: BordasDaArte = (() => {
    const esq = new Float32Array(H).fill(NaN);
    const dir = new Float32Array(H).fill(NaN);
    for (let y = 0; y < H; y++) {
      // Meia largura crescendo linearmente de 20 px no topo a 200 px embaixo.
      const meia = 20 + (180 * y) / (H - 1);
      esq[y] = 256 - meia;
      dir[y] = 256 + meia;
    }
    return { esq, dir, w: 512, h: H };
  })();

  // A caixa da arte é 56–456 nos dois eixos (a linha mais larga), casada com o crânio.
  const m = mapaPelaCaixa(
    { x0: 56, y0: 0, x1: 456, y1: H - 1 },
    { x0: CAIXA_CABECA.x0, y0: CAIXA_CABECA.y0, x1: CAIXA_CABECA.x1, y1: CAIXA_CABECA.y1 },
  );

  /**
   * Os marcos da fixture, e o `viewBox` dela é o próprio raster — assim
   * `unidadeDaArte` é a identidade e a linha `py` do raster é o `y` da arte, sem uma
   * conversão a mais para o teste ter de acompanhar de cabeça.
   */
  const marcos: Marcos = {
    arte: { topo: 0, olhos: 300, base: H - 1 },
    produto: {
      topo: CAIXA_CABECA.y0,
      olhos: (OLHO_CY_ESQ + OLHO_CY_DIR) / 2,
      base: CAIXA_CABECA.y1,
    },
    viewBoxDaArte: { w: 512, h: H },
    laudo: [],
  };
  const pousar = (pts: { x: number; y: number }[], b = bordas) =>
    pousarPorMarcos(pts, m, b, marcos, H);

  /** Onde a linha `py` da arte vai parar, pelos marcos. */
  const destino = (py: number) =>
    marcos.produto.olhos +
    (py - marcos.arte.olhos) *
      ((marcos.produto.base - marcos.produto.olhos) / (marcos.arte.base - marcos.arte.olhos));

  it("um ponto na borda da cabeça da arte cai na borda do crânio, em qualquer altura", () => {
    for (const py of [64, 160, 256, 384, 500]) {
      const naBorda = { x: (bordas.dir[py] - m.ex0) * m.kx + m.eu0, y: (py - m.ty0) * m.ky + m.tu0 };
      const { pts, corrigidos } = pousar([naBorda]);
      expect(corrigidos).toBe(1);
      // A borda é lida na altura de DESTINO, e não na de origem: é o `y` novo que diz
      // qual é a largura do crânio ali. Ler a de origem reabriria em x o erro que o
      // pouso está fechando em y.
      expect(pts[0].y).toBeCloseTo(destino(py), 6);
      expect(pts[0].x).toBeCloseTo(bordasEm(alturaComLargura(pts[0].y)).dir, 4);
    }
  });

  it("sem a fração, o mesmo ponto fica DENTRO do crânio — é o defeito medido", () => {
    // No alto a cabeça da arte é estreita: a caixa a joga longe da borda do crânio.
    const py = 64;
    const y = (py - m.ty0) * m.ky + m.tu0;
    const x = (bordas.dir[py] - m.ex0) * m.kx + m.eu0;
    expect(bordasEm(y).dir - x).toBeGreaterThan(50);
  });

  it("o ponto no meio da linha continua no meio, e a fração é preservada", () => {
    const py = 200;
    const meio = {
      x: ((bordas.esq[py] + bordas.dir[py]) / 2 - m.ex0) * m.kx + m.eu0,
      y: (py - m.ty0) * m.ky + m.tu0,
    };
    const { pts } = pousar([meio]);
    const b = bordasEm(alturaComLargura(pts[0].y));
    expect(pts[0].x).toBeCloseTo((b.esq + b.dir) / 2, 4);
  });

  it("onde a arte não tem cabeça, o x sai intacto pelo mapa afim — mas o y anda", () => {
    const vazias: BordasDaArte = {
      ...bordas,
      esq: new Float32Array(H).fill(NaN),
      dir: new Float32Array(H).fill(NaN),
    };
    const p = { x: 123, y: 200 };
    const { pts, corrigidos } = pousar([p], vazias);
    expect(corrigidos).toBe(0);
    expect(pts[0].x).toBe(p.x);
    // O `y` é dos marcos e não da fração: ele anda mesmo sem borda de arte nenhuma.
    expect(pts[0].y).toBeCloseTo(destino(Math.round((p.y - m.tu0) / m.ky + m.ty0)), 6);
  });

  /**
   * ---------------------------------------------------------------------------
   * O PISO DE DESTINO — a agulha na coroa, em forma de teste
   * ---------------------------------------------------------------------------
   *
   * `bordasEm` acima de `CAIXA_CABECA.y0` devolve a CAIXA (364 u de largura) numa
   * altura em que o crânio é um ponto; logo abaixo dela devolve a leitura real, que
   * ali vale quase zero. Sem piso, um ponto com `t ≈ 1` pousa na borda LATERAL do
   * crânio dezenas de unidades acima da coroa — e o laço vai e volta até lá.
   *
   * Medido no laço denso do M4 da `curto-espetada`, cujo passo lateral mediano é
   * 0,335 u: o maior salto entre pontos densos vizinhos era de **169,2 u** sem o
   * piso, e é de **22,7 u** com ele.
   */
  describe("o piso de destino tapa o buraco em que a fração perde sentido", () => {
    it("a descontinuidade que ele existe para tapar é real", () => {
      const acima = bordasEm(CAIXA_CABECA.y0 - 0.01);
      const abaixo = bordasEm(CAIXA_CABECA.y0 + 0.01);
      // Acima do topo do crânio, `bordasEm` cai para a caixa: 364 unidades.
      expect(acima.dir - acima.esq).toBeCloseTo(CAIXA_CABECA.larg, 6);
      // Dois centésimos de unidade abaixo, a leitura real é quase nada.
      expect(abaixo.dir - abaixo.esq).toBeLessThan(PISO_DESTINO);
    });

    it("a faixa com largura é CONTÍGUA — é o que torna o `clamp` exato", () => {
      // Se houvesse um estrangulamento no meio da cabeça, a altura válida mais
      // próxima de um `y` interno não seria a ponta da faixa, e o `clamp` mentiria.
      let buracos = 0;
      for (let y = FAIXA_COM_LARGURA.de; y <= FAIXA_COM_LARGURA.ate; y += 0.25) {
        const b = bordasEm(y);
        if (b.dir - b.esq < PISO_DESTINO) buracos++;
      }
      expect(buracos).toBe(0);
      expect(FAIXA_COM_LARGURA.de).toBeGreaterThan(CAIXA_CABECA.y0);
      expect(FAIXA_COM_LARGURA.ate).toBeLessThan(CAIXA_CABECA.y1);
    });

    it("um ponto que pousa acima da coroa não é jogado na borda lateral do crânio", () => {
      /**
       * Marcos que SOBEM a peça, que é o caso em que o M4 vive: com a linha dos olhos
       * baixa na arte, a escala olhos→queixo é grande e o topo da arte cai acima da
       * coroa. Os marcos do bloco de fora não sobem, e um teto que nunca é atingido
       * não prova teto nenhum.
       */
      const sobe: Marcos = { ...marcos, arte: { ...marcos.arte, olhos: 430 } };
      const py = 0;
      const naBorda = { x: (bordas.dir[py] - m.ex0) * m.kx + m.eu0, y: (py - m.ty0) * m.ky + m.tu0 };
      const { pts } = pousarPorMarcos([naBorda], m, bordas, sobe, H);
      expect(pts[0].y).toBeLessThan(CAIXA_CABECA.y0);

      const semPiso = bordasEm(pts[0].y).dir; // a borda da CAIXA — o defeito
      const comPiso = bordasEm(alturaComLargura(pts[0].y)).dir;
      expect(pts[0].x).toBeCloseTo(comPiso, 4);
      expect(semPiso - comPiso).toBeGreaterThan(100);
    });

    it("dentro da faixa o piso não mexe em nada — ele não é um encolhimento", () => {
      for (const y of [100, 180, 232, 300]) expect(alturaComLargura(y)).toBe(y);
    });
  });
});

/**
 * A TERCEIRA EXIGÊNCIA DE `decidirN` — e ela é sobre o laço ENTREGUE, não sobre a curva.
 *
 * O erro de corda é uma distância sem sinal: uma corda que atravessa a cúpula 16
 * unidades por dentro tira a mesma nota de uma que passa 16 por fora. A de dentro é
 * couro cabeludo à mostra e a de fora é um cabelo mais gordo — e nem o desvio nem o
 * cruzamento sabem a diferença. Medido na `curto-espetada`: laço denso com 0,865 de
 * coroa entregando 0,742, com os dois critérios de cima verdes.
 *
 * O teste é sobre o MECANISMO, com um `aprova` sintético: qual N a função escolhe
 * quando a exigência tem solução, e o que ela faz — e diz — quando não tem. A régua de
 * coroa de verdade é medida na peça, em `importar-peca.ts`.
 */
describe("decidirN atende a exigência que quem chama acrescenta", () => {
  /** Um círculo denso: qualquer N reduz sem se cruzar, então só `aprova` decide. */
  const circulo = Array.from({ length: 400 }, (_, i) => ({
    x: 200 + 100 * Math.cos((2 * Math.PI * i) / 400),
    y: 200 + 100 * Math.sin((2 * Math.PI * i) / 400),
  }));

  it("sem exigência extra, `aprovados` é o próprio conjunto dos limpos", () => {
    const r = decidirN(circulo, true);
    expect(r.limpos.length).toBeGreaterThan(0);
    expect(r.aprovados).toEqual(r.limpos);
  });

  it("com exigência, escolhe entre os que a cumprem", () => {
    // Só os laços com 40 vértices ou mais passam — e o N escolhido tem de ser um deles.
    const r = decidirN(circulo, true, undefined, (laco) => laco.length >= 40);
    expect(r.aprovados.every((n) => n >= 40)).toBe(true);
    expect(r.aprovados).toContain(r.n);
    expect(r.n).toBeGreaterThanOrEqual(40);
  });

  it("quando NENHUM cumpre, cai nos limpos e diz que caiu", () => {
    // Silêncio aqui seria a peça saindo com a coroa comida e o laudo dizendo que estava
    // tudo bem — que é exatamente o defeito que esta exigência fechou.
    const r = decidirN(circulo, true, undefined, () => false);
    expect(r.aprovados).toEqual([]);
    expect(r.limpos).toContain(r.n);
  });
});

describe("a peça congelada continua importável", () => {
  const FONTE = "scripts/avatar/fonte/estilo-kokeshi/cabelo/curto-espetada/semantica.svg";

  it("a fonte passa no contrato e tem as três camadas nomeadas", () => {
    const p = lerFontePecaOuFalhar(FONTE);
    expect(p.camadas.map((c) => `${c.papel}:${c.paint}`).sort()).toEqual([
      "linha-mascara:linha",
      "massa:cabelo-s",
      "tom-claro:cabelo",
    ]);
  });
});
