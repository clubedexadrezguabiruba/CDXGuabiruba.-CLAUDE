/**
 * O GATE DO REGISTRO — falha com o registro antigo, passa com o novo.
 *
 * A peça importada é um CABELO. Ela estava sendo posicionada pelos marcos do
 * TRONCO, e o boneco do gerador não tem a proporção cabeça/tronco do
 * `geometria.ts`. O erro medido é de 28% de escala, e ele não aparecia em nenhum
 * gate: `fidelidade.ts` registrava os dois lados pelo tronco, então o desvio
 * cancelava na comparação e sobrava só no clip — e no olho, na folha.
 *
 * Este teste roda contra a fonte congelada de verdade, e não contra fixture: o
 * defeito era da relação entre DUAS geometrias reais, e uma fixture sintética
 * teria a proporção que eu escolhesse — provaria o teste, não a arte.
 */
import { describe, expect, it } from "vitest";

import { CAIXA_CABECA } from "../../../../src/lib/avatar/estilo/geometria";
import { guiaChamada, lerFontePecaOuFalhar } from "../fonte-peca";
import {
  PISO_NO_CRANIO,
  TETO_ANISOTROPIA,
  conferirRegistro,
  fracaoNoCranio,
} from "../importar-peca";
import { anisotropia, mapaPelaCaixa } from "../tracar-cabelo";

const FONTE = "scripts/avatar/fonte/estilo-kokeshi/cabelo/curto-espetada/semantica.svg";

describe("registro pela cabeça", () => {
  const r = conferirRegistro(FONTE);

  it("põe a peça dentro do crânio", () => {
    // Medido: 99,5%. Pelo registro do tronco, 46,5%.
    expect(r.dentro).toBeGreaterThanOrEqual(PISO_NO_CRANIO);
    expect(r.falhas).toEqual([]);
  });

  it("os dois eixos concordam — é registro, e não forma", () => {
    // 0,56% medido. Se a cabeça da arte tivesse outra PROPORÇÃO, os dois fatores
    // de escala discordariam, e aí nenhum registro resolveria — seria arte.
    expect(r.anisotropia).toBeLessThan(TETO_ANISOTROPIA);
  });

  it("a guia da cabeça contém toda a peça", () => {
    const peca = lerFontePecaOuFalhar(FONTE);
    const g = guiaChamada(peca, "cabeca");
    for (const c of peca.camadas) {
      expect(c.caixa.x0).toBeGreaterThanOrEqual(g.caixa.x0);
      expect(c.caixa.y0).toBeGreaterThanOrEqual(g.caixa.y0);
      expect(c.caixa.x1).toBeLessThanOrEqual(g.caixa.x1);
      expect(c.caixa.y1).toBeLessThanOrEqual(g.caixa.y1);
    }
  });
});

describe("o gate tem dente — o registro errado reprova", () => {
  const peca = lerFontePecaOuFalhar(FONTE);
  const g = guiaChamada(peca, "cabeca");

  /** A cabeça da arte com a caixa encolhida por `f`, mantendo o centro. */
  const encolhida = (f: number) => {
    const cx = (g.caixa.x0 + g.caixa.x1) / 2;
    const cy = (g.caixa.y0 + g.caixa.y1) / 2;
    const w = (g.caixa.x1 - g.caixa.x0) / (2 * f);
    const h = (g.caixa.y1 - g.caixa.y0) / (2 * f);
    return { x0: cx - w, y0: cy - h, x1: cx + w, y1: cy + h };
  };
  const cranio = {
    x0: CAIXA_CABECA.x0,
    y0: CAIXA_CABECA.y0,
    x1: CAIXA_CABECA.x1,
    y1: CAIXA_CABECA.y1,
  };

  it("uma cabeça 28% fora de escala derruba a peça para fora do crânio", () => {
    // 1,28 é o fator medido entre o registro pelo tronco e o pela cabeça. Com ele,
    // a peça sai do crânio quase pela metade — que foi o 46,5% medido na arte.
    const errado = mapaPelaCaixa(encolhida(1.28), cranio);
    const dentro = fracaoNoCranio(peca, errado);
    expect(dentro).toBeLessThan(0.6);
    expect(dentro).toBeLessThan(PISO_NO_CRANIO);
  });

  it("erro pequeno de escala ainda passa — o gate não é histérico", () => {
    expect(fracaoNoCranio(peca, mapaPelaCaixa(encolhida(1.01), cranio))).toBeGreaterThan(0.9);
  });

  it("um registro anisotrópico reprova por anisotropia", () => {
    const c = g.caixa;
    const esticada = { x0: c.x0, y0: c.y0, x1: c.x0 + (c.x1 - c.x0) * 1.2, y1: c.y1 };
    expect(anisotropia(mapaPelaCaixa(esticada, cranio))).toBeGreaterThan(TETO_ANISOTROPIA);
  });
});
