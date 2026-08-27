/**
 * O CHAPÉU ACHATA O CABELO — e quem decide o número é o CATÁLOGO, não quem chama.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------------------------------------------------------
 *
 * `apertoDoCabelo` é a quinta válvula da tabela de `camadas.ts`, e ela tem as mesmas
 * quatro condições das outras — mais uma que é só dela:
 *
 *  1. **ausente é o padrão histórico, byte a byte**. Sem chapéu, sem cabelo, ou com
 *     par que ninguém decidiu, o SVG não ganha um caractere;
 *  2. **o clip fica POR FORA da escala**. `transform` e `clip-path` no mesmo elemento
 *     fazem o clip ser resolvido no espaço já transformado — a região do chapéu
 *     encolheria junto com o cabelo e o corte cairia no lugar errado;
 *  3. **o número vem do catálogo sozinho**. Exigir que o chamador passasse seria
 *     garantir divergência entre ranking, perfil, folha e editor;
 *  4. o override de bancada continua vencendo — é o que faz o editor mostrar o valor
 *     EM PROVA antes de ele virar decisão gravada.
 */

import { describe, expect, it } from "vitest";

import { CHAPEUS } from "../../catalogo";
import { CABELOS, type ModeloCabelo } from "../cabelo";
import { compor } from "../compositor";
import { APERTOS_DA_ARTE } from "../apertos-da-arte";
import { CAIXA_CABECA } from "../geometria";
import { CABELO, PELE } from "../../palette";

const EIXO = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;

/**
 * O aperto lido DO SVG, e não do estado que o produziu.
 *
 * A busca é pelo `translate(eixo 0) scale(x 1)`, que é a única transformação do
 * boneco que gira em volta do eixo da cabeça — a escala da figura é uniforme e mora
 * na âncora. Ler `scale(0.` cru casaria com ela e o teste passaria por engano; foi o
 * que aconteceu com a primeira versão desta régua, na bancada.
 */
const APERTO = new RegExp(`translate\\(${EIXO} 0\\) scale\\(([\\d.]+) 1\\)`);
const apertoDe = (svg: string) => {
  const m = APERTO.exec(svg);
  return m ? Number(m[1]) : 1;
};

const svgDe = (modelo?: ModeloCabelo, chapeu?: string, aperto?: number) =>
  compor({
    pele: PELE[2],
    cabelo: CABELO[1],
    modeloCabelo: modelo,
    chapeu: chapeu ? CHAPEUS[chapeu] : undefined,
    apertoDoCabelo: aperto,
    ns: "ap",
  });

const TONAIS = Object.keys(CABELOS).filter(
  (c) => (CABELOS as Record<string, { tonal?: unknown }>)[c].tonal,
) as ModeloCabelo[];

describe("o aperto sai do catálogo, sem ninguém passar nada", () => {
  it.each(Object.entries(APERTOS_DA_ARTE))("%s desenha com %s", (chave, valor) => {
    const [chapeu, cabelo] = chave.split("|");
    expect(apertoDe(svgDe(cabelo as ModeloCabelo, chapeu))).toBe(valor);
  });

  it("par que ninguém decidiu sai SEM transform — 1 é ausente", () => {
    const orfaos = TONAIS.flatMap((c) =>
      Object.keys(CHAPEUS)
        .filter((ch) => !(`${ch}|${c}` in APERTOS_DA_ARTE))
        .map((ch) => [ch, c] as const),
    );
    for (const [ch, c] of orfaos) expect(apertoDe(svgDe(c, ch))).toBe(1);
  });
});

describe("ausente é o SVG de sempre, byte a byte", () => {
  it("sem chapéu, o aperto não tem efeito nenhum", () => {
    expect(svgDe("chanel")).toBe(svgDe("chanel", undefined, 0.8));
  });

  it("sem cabelo, o aperto não muda um byte", () => {
    expect(svgDe(undefined, "chapeu-bone")).toBe(svgDe(undefined, "chapeu-bone", 0.8));
  });

  it("aperto 1 é idêntico a não haver aperto", () => {
    // O `burst-fade` + `bone` é um par sem linha na tabela: o catálogo não manda nada.
    expect(svgDe("burst-fade", "chapeu-bone", 1)).toBe(svgDe("burst-fade", "chapeu-bone"));
  });
});

describe("as duas travas de estrutura", () => {
  it("o override de bancada vence o catálogo — é o que o editor usa", () => {
    expect(APERTOS_DA_ARTE["chapeu-bone|chanel"]).toBeDefined();
    expect(apertoDe(svgDe("chanel", "chapeu-bone", 0.8))).toBe(0.8);
    expect(apertoDe(svgDe("chanel", "chapeu-bone", 1))).toBe(1);
  });

  it("a escala fica DENTRO do clip do chapéu, nunca no mesmo elemento", () => {
    const svg = svgDe("chanel", "chapeu-bone");
    expect(svg).toMatch(/clip-path="url\(#ap-c-chapeu\)"><g transform="translate\(/);
    // e o inverso: nenhum elemento carrega os dois atributos de uma vez
    expect(svg).not.toMatch(/<g transform="translate\([^"]*scale\([\d.]+ 1\)[^"]*" clip-path=/);
  });
});
