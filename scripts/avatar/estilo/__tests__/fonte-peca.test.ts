/**
 * O CONTRATO DA FONTE SEMÂNTICA — uma fixture vermelha por regra.
 *
 * Cada `it` aqui monta um SVG mínimo que viola **uma** regra e confere que a
 * mensagem aponta o path. Uma fixture que reprova por dois motivos ao mesmo tempo
 * não prova nada sobre nenhum dos dois.
 *
 * As formas são retângulos escritos em `C`, porque o repertório do conversor —
 * medido no A0 — é `M C z` e mais nada: um `L` na fixture reprovaria por comando
 * desconhecido antes de chegar à regra que se quer testar.
 */
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { conferirCompletude, guiaChamada, lerFontePeca, PAPEIS } from "../fonte-peca";

const dir = mkdtempSync(join(tmpdir(), "fonte-peca-"));
let n = 0;

/** Um retângulo fechado, só com `M`, `C` e `z`. Área `(x1-x0)·(y1-y0)`. */
function quad(x0: number, y0: number, x1: number, y1: number): string {
  const c = (ax: number, ay: number) => `C${ax},${ay} ${ax},${ay} ${ax},${ay}`;
  return `M${x0},${y0} ${c(x1, y0)} ${c(x1, y1)} ${c(x0, y1)} z`;
}

/** O mesmo retângulo sem o lado de volta e sem `z` — termina longe de onde começou. */
function aberto(x0: number, y0: number, x1: number, y1: number): string {
  const c = (ax: number, ay: number) => `C${ax},${ay} ${ax},${ay} ${ax},${ay}`;
  return `M${x0},${y0} ${c(x1, y0)} ${c(x1, y1)}`;
}

/** Um `<path>` com os atributos que o conversor escreve, mais os rótulos pedidos. */
function path(d: string, attrs: Record<string, string> = {}, fill = "#19C7C0"): string {
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<path fill="${fill}" opacity="1.000000" stroke="none" ${extra} d="${d}"/>`;
}

function arquivo(corpo: string, vb = "0 0 100 100"): string {
  const p = join(dir, `f${n++}.svg`);
  writeFileSync(p, `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${corpo}</svg>`);
  return p;
}

/** O menor arquivo que passa: uma massa fechada, com papel e tinta. */
const MASSA_OK = path(quad(10, 10, 40, 40), {
  "data-avatar-role": "massa",
  "data-avatar-paint": "cabelo",
});

describe("o contrato aceita a fonte bem formada", () => {
  it("lê camadas, tinta, plano e grupo", () => {
    const { peca, falhas } = lerFontePeca(
      arquivo(
        MASSA_OK +
          path(quad(45, 10, 60, 25), { "data-avatar-role": "tom-claro", "data-avatar-paint": "cabelo-s" }) +
          path(quad(10, 50, 40, 60), {
            "data-avatar-role": "linha-mascara",
            "data-avatar-paint": "linha",
          }, "#040D0C") +
          path(quad(70, 10, 90, 40), {
            "data-avatar-role": "extensao",
            "data-avatar-paint": "cabelo",
            "data-plano": "atras",
            "data-avatar-grupo": "cortina-esq",
          }),
      ),
    );
    expect(falhas).toEqual([]);
    expect(peca!.camadas.map((c) => c.papel).sort()).toEqual([
      "extensao",
      "linha-mascara",
      "massa",
      "tom-claro",
    ]);
    const ext = peca!.camadas.find((c) => c.papel === "extensao")!;
    expect(ext.plano).toBe("atras");
    expect(ext.grupo).toBe("cortina-esq");
    expect(peca!.camadas.find((c) => c.papel === "massa")!.area).toBeCloseTo(900, 5);
  });

  it("junta numa camada só os fragmentos com o mesmo papel, tinta, plano e grupo", () => {
    const { peca, falhas } = lerFontePeca(
      arquivo(
        MASSA_OK +
          path(quad(50, 50, 70, 70), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }),
      ),
    );
    expect(falhas).toEqual([]);
    expect(peca!.camadas).toHaveLength(1);
    expect(peca!.camadas[0].subpaths).toHaveLength(2);
    expect(peca!.camadas[0].area).toBeCloseTo(900 + 400, 5);
  });

  it("aceita subpath sem `z` que fecha geometricamente — o A0 achou 83 assim", () => {
    // O conversor escreve 520 `M` para 437 `z`, e a folga medida é 0,0000 em
    // todos. Fechado é geométrico; ler `z` reprovaria arte correta.
    const c = (ax: number, ay: number) => `C${ax},${ay} ${ax},${ay} ${ax},${ay}`;
    const semZ = `M10,10 ${c(40, 10)} ${c(40, 40)} ${c(10, 40)} ${c(10, 10)}`;
    const { falhas } = lerFontePeca(
      arquivo(path(semZ, { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" })),
    );
    expect(falhas).toEqual([]);
  });

  it("ignora o que está abaixo do piso de área sem exigir papel", () => {
    // 0,002% de 100×100 são 0,2 u². Este quadradinho tem 0,04.
    const { falhas } = lerFontePeca(arquivo(MASSA_OK + path(quad(90, 90, 90.2, 90.2))));
    expect(falhas).toEqual([]);
  });
});

describe("o contrato reprova", () => {
  const falhaDe = (corpo: string, vb?: string) => lerFontePeca(arquivo(corpo, vb)).falhas.join("\n");

  it("papel desconhecido", () => {
    const f = falhaDe(path(quad(10, 10, 40, 40), { "data-avatar-role": "massinha" }));
    expect(f).toMatch(/papel "massinha" desconhecido/);
    expect(f).toContain(PAPEIS.join(", "));
  });

  it("path significativo sem papel nenhum", () => {
    const f = falhaDe(path(quad(10, 10, 40, 40)));
    expect(f).toMatch(/sem `data-avatar-role`/);
  });

  /**
   * A AMARRA CONTINUA, E O `L` SAIU DELA POR TER SIDO IMPLEMENTADO — não tolerado.
   *
   * O docstring de `acharSubpaths` manda *"implemente-o antes de medir, nunca
   * ignore"*, e quem trouxe o `L` foi o `potrace`, que devolve reta onde a máscara
   * tem reta. Quem guarda a amarra agora é o `A` — o arco, que continua fora do
   * repertório e continua lançando.
   */
  it("comando desconhecido em `d` — a amarra que já existia", () => {
    const f = falhaDe(`<path fill="#19C7C0" stroke="none" d="M10,10 A5,5 0 0 1 40,40 z"/>`);
    expect(f).toMatch(/comando "A" não implementado/);
  });

  it("`L` é implementado, e a poligonal sai com o vértice certo", () => {
    const { peca, falhas } = lerFontePeca(
      arquivo(
        `<path fill="#19C7C0" stroke="none" data-avatar-role="massa" data-avatar-paint="cabelo" ` +
          `d="M10,10 L40,10 L40,40 L10,40 z"/>`,
      ),
    );
    expect(falhas).toEqual([]);
    const s = peca!.camadas[0].subpaths[0];
    // Quatro vértices, e a área do sapateiro sobre um quadrado de 30 é 900.
    expect(s.pts).toHaveLength(4);
    expect(Math.abs(s.area)).toBeCloseTo(900, 6);
    expect(s.caixa).toEqual({ x0: 10, y0: 10, x1: 40, y1: 40 });
  });

  it("massa aberta", () => {
    const f = falhaDe(
      path(aberto(10, 10, 40, 40), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }),
    );
    expect(f).toMatch(/papel "massa" com 1 subpath\(s\) ABERTO/);
  });

  it("linha-mascara aberta — a fonte guarda tinta, não linha de centro", () => {
    const f = falhaDe(
      path(aberto(10, 10, 40, 40), {
        "data-avatar-role": "linha-mascara",
        "data-avatar-paint": "linha",
      }),
    );
    expect(f).toMatch(/papel "linha-mascara" com 1 subpath\(s\) ABERTO/);
    expect(f).toMatch(/produto do importador/);
  });

  it("extensao sem `data-plano`", () => {
    const f = falhaDe(
      path(quad(10, 10, 40, 40), { "data-avatar-role": "extensao", "data-avatar-paint": "cabelo" }),
    );
    expect(f).toMatch(/`extensao` sem `data-plano`/);
  });

  it("`data-plano` desconhecido", () => {
    const f = falhaDe(
      path(quad(10, 10, 40, 40), {
        "data-avatar-role": "extensao",
        "data-avatar-paint": "cabelo",
        "data-plano": "meio",
      }),
    );
    expect(f).toMatch(/`data-plano="meio"` desconhecido/);
  });

  it("`data-plano` em papel que não é extensao", () => {
    const f = falhaDe(
      path(quad(10, 10, 40, 40), {
        "data-avatar-role": "massa",
        "data-avatar-paint": "cabelo",
        "data-plano": "atras",
      }),
    );
    expect(f).toMatch(/com `data-plano`, que só vale em `extensao`/);
  });

  it("papel que pinta sem `data-avatar-paint`", () => {
    const f = falhaDe(path(quad(10, 10, 40, 40), { "data-avatar-role": "massa" }));
    expect(f).toMatch(/sem `data-avatar-paint`/);
  });

  it("descarte sem `data-motivo`", () => {
    const f = falhaDe(path(quad(10, 10, 40, 40), { "data-avatar-role": "descarte" }));
    expect(f).toMatch(/`descarte` sem `data-motivo`/);
  });

  it("moldura com papel de peça", () => {
    const f = falhaDe(
      path(quad(0, 0, 100, 100), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }),
    );
    expect(f).toMatch(/numa moldura/);
  });

  it("o mesmo subpath reclamado por dois paths", () => {
    const d = quad(10, 10, 40, 40);
    const f = falhaDe(
      path(d, { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }) +
        path(d, { "data-avatar-role": "tom-claro", "data-avatar-paint": "cabelo-s" }),
    );
    expect(f).toMatch(/reclamado por 2 paths/);
    expect(f).toMatch(/Exatamente um dono/);
  });

  it("`<g>`, `transform` e `<use>` — as três que fazem a coordenada mentir", () => {
    expect(falhaDe(`<g><path fill="#000000" stroke="none" d="${quad(1, 1, 9, 9)}"/></g>`)).toMatch(/tem <g>/);
    expect(
      falhaDe(`<path fill="#000000" stroke="none" transform="translate(3)" d="${quad(1, 1, 9, 9)}"/>`),
    ).toMatch(/tem `transform`/);
    expect(falhaDe(`<use href="#x"/>${MASSA_OK}`)).toMatch(/tem <use>/);
  });

  it("`opacity` diferente de 1 — o buraco que o A0 achou aberto", () => {
    const f = falhaDe(
      `<path fill="#19C7C0" opacity="0.500000" stroke="none" data-avatar-role="massa" ` +
        `data-avatar-paint="cabelo" d="${quad(10, 10, 40, 40)}"/>`,
    );
    expect(f).toMatch(/opacity="0.500000"/);
    expect(f).toMatch(/sem sintoma/);
  });
});

describe("guia nunca entra na peça, e serve de marco", () => {
  it("é lida pelo nome e não vira camada", () => {
    const { peca, falhas } = lerFontePeca(
      arquivo(
        MASSA_OK +
          path(quad(50, 50, 90, 90), { "data-avatar-role": "guia", "data-avatar-grupo": "cabeca" }),
      ),
    );
    expect(falhas).toEqual([]);
    expect(peca!.camadas).toHaveLength(1);
    expect(peca!.camadas[0].papel).toBe("massa");
    // E a área da guia não vazou para dentro da massa.
    expect(peca!.camadas[0].area).toBeCloseTo(900, 5);

    const g = guiaChamada(peca!, "cabeca");
    expect(g.caixa).toEqual({ x0: 50, y0: 50, x1: 90, y1: 90 });
    expect(g.area).toBeCloseTo(1600, 5);
  });

  it("guia sem nome reprova — marco anônimo não pode ser pedido", () => {
    const { falhas } = lerFontePeca(arquivo(MASSA_OK + path(quad(60, 60, 90, 90), { "data-avatar-role": "guia" })));
    expect(falhas.join("\n")).toMatch(/`guia` sem `data-avatar-grupo`/);
  });

  it("pedir uma guia que não existe explica o erro de 28%, em vez de devolver nada", () => {
    const { peca } = lerFontePeca(arquivo(MASSA_OK));
    expect(() => guiaChamada(peca!, "cabeca")).toThrow(/28% de erro de escala/);
  });
});

describe("descarte conta na completude, e o motivo fica escrito", () => {
  it("agrupa por motivo", () => {
    const { peca, falhas } = lerFontePeca(
      arquivo(
        MASSA_OK +
          path(quad(60, 10, 90, 40), { "data-avatar-role": "descarte", "data-motivo": "rosto do boneco" }, "#FED5A3") +
          path(quad(60, 50, 90, 80), { "data-avatar-role": "descarte", "data-motivo": "rosto do boneco" }, "#FED5A3") +
          path(quad(10, 60, 40, 90), { "data-avatar-role": "descarte", "data-motivo": "gola" }, "#DDC19C"),
      ),
    );
    expect(falhas).toEqual([]);
    expect(peca!.descartes.map((d) => d.motivo).sort()).toEqual(["gola", "rosto do boneco"]);
    expect(peca!.descartes.find((d) => d.motivo === "rosto do boneco")!.subpaths).toHaveLength(2);
  });
});

describe("completude estrutural contra a origem", () => {
  const ORIGEM = arquivo(
    path(quad(10, 10, 40, 40)) + path(quad(60, 10, 90, 40)) + path(quad(10, 60, 40, 90)),
  );

  it("passa quando todo path da origem tem dono na semântica", () => {
    const semantica = arquivo(
      path(quad(10, 10, 40, 40), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }) +
        path(quad(60, 10, 90, 40), {
          "data-avatar-role": "extensao",
          "data-avatar-paint": "cabelo",
          "data-plano": "atras",
        }) +
        path(quad(10, 60, 40, 90), { "data-avatar-role": "descarte", "data-motivo": "gola" }),
    );
    expect(conferirCompletude(semantica, ORIGEM).falhas).toEqual([]);
    expect(lerFontePeca(semantica).falhas).toEqual([]);
  });

  it("`cortina-solta`: apagar um path da semântica deixa vermelho", () => {
    // É a falha que a rota antiga come em silêncio — `gruposTeal[0]` fica com a
    // maior componente e imprime as outras num log que não reprova nada.
    const semCortina = arquivo(
      path(quad(10, 10, 40, 40), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }) +
        path(quad(10, 60, 40, 90), { "data-avatar-role": "descarte", "data-motivo": "gola" }),
    );
    const { falhas } = conferirCompletude(semCortina, ORIGEM);
    expect(falhas).toHaveLength(1);
    expect(falhas[0]).toMatch(/sumiu da semântica/);
    expect(falhas[0]).toMatch(/900 u²/);
    expect(falhas[0]).toMatch(/\(60,10\)-\(90,40\)/);
  });

  it("geometria inventada na curadoria também reprova", () => {
    const comExtra = arquivo(
      path(quad(10, 10, 40, 40), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }) +
        path(quad(60, 10, 90, 40), {
          "data-avatar-role": "extensao",
          "data-avatar-paint": "cabelo",
          "data-plano": "atras",
        }) +
        path(quad(10, 60, 40, 90), { "data-avatar-role": "descarte", "data-motivo": "gola" }) +
        path(quad(60, 60, 80, 80), { "data-avatar-role": "massa", "data-avatar-paint": "cabelo" }),
    );
    const { falhas } = conferirCompletude(comExtra, ORIGEM);
    expect(falhas).toHaveLength(1);
    expect(falhas[0]).toMatch(/surgiu na semântica/);
  });

  it("viewBox diferente para a conferência antes de comparar coordenada", () => {
    const outro = arquivo(MASSA_OK, "0 0 200 200");
    expect(conferirCompletude(outro, ORIGEM).falhas[0]).toMatch(/viewBox difere/);
  });
});
