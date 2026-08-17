/**
 * AS PEÇAS DE CIMA — chapéu e rosto — e as DUAS pontas que elas precisam honrar.
 *
 * O Bloco 1 do doc 21 é encanamento com uma promessa forte: **zero mudança
 * visual**. Um campo novo em `EstadoAvatar` é exatamente o tipo de coisa que
 * quebra essa promessa sem ninguém ver — um `<g>` vazio emitido "só quando não
 * há peça", um espaço a mais na concatenação, e o teto de regressão da
 * `folha-base` deixa de ser teto de regressão para virar teto de folga.
 *
 * Mas o teste do lado oposto importa tanto quanto, e é o que este projeto já
 * pagou para aprender: um gate que só confere a ausência **passa por vacuidade**
 * se a presença nunca funcionar. A peça pode nunca ter sido emitida, e o Bloco 7
 * descobriria isso depois de desenhar quatro chapéus.
 *
 * Então: ausente não muda um byte, presente aparece — e aparece DEPOIS das
 * feições e do cabelo, que é a ordem declarada em `compor()`.
 */

import { describe, expect, it } from "vitest";
import { compor } from "../compositor";
import { conferirSvg } from "../../svgContrato";
import type { EstadoAvatar, PecaSobreposta } from "../tipos";

const BASE: EstadoAvatar = {
  pele: "#E9B183",
  cabelo: "#3A2F2A",
  ns: "t",
};

/** Uma peça de mentira. Forma reconhecível, cor que não existe no boneco. */
const FALSA: PecaSobreposta = {
  id: "zz-peca-de-teste",
  nome: "Peça de teste",
  formas: [{ d: "M10 20 L30 20 L30 40 Z", cor: "#FF00FF" }],
};

describe("peças sobrepostas (chapéu e rosto)", () => {
  it("ausentes, o SVG sai byte a byte igual ao de antes do campo existir", () => {
    const semNada = compor(BASE);

    // `undefined` explícito tem de ser indistinguível do campo omitido — é o
    // caminho que `svgDoAluno` percorre em toda tela hoje, porque os dois
    // catálogos estão vazios e `pecaDeCabeca` devolve `undefined`.
    expect(compor({ ...BASE, chapeu: undefined, rosto: undefined })).toBe(semNada);

    // E uma peça sem forma nenhuma também não emite nada: lista vazia é ausência,
    // não é uma peça invisível que ocupa lugar na string.
    expect(compor({ ...BASE, chapeu: { id: "x", nome: "X", formas: [] } })).toBe(semNada);
  });

  it("presentes, aparecem — preenchimento e traço, nesta ordem", () => {
    const comChapeu = compor({ ...BASE, chapeu: FALSA });

    expect(comChapeu).not.toBe(compor(BASE));
    expect(comChapeu).toContain(`fill="#FF00FF"`);
    // O contorno é do compositor, não da peça: mesma classe do crânio e do tronco.
    expect(comChapeu).toContain(`<path class="kk-traco" d="M10 20 L30 20 L30 40 Z"/>`);
    expect(comChapeu.indexOf(`fill="#FF00FF"`)).toBeLessThan(
      comChapeu.indexOf(`<path class="kk-traco" d="M10 20 L30 20 L30 40 Z"/>`),
    );
  });

  it("entram DEPOIS das feições, e o chapéu depois do rosto", () => {
    const svg = compor({
      ...BASE,
      rosto: FALSA,
      chapeu: { ...FALSA, id: "zz-chapeu", formas: [{ d: "M50 60 L70 60 L70 80 Z", cor: "#00FF00" }] },
    });

    // A boca é a última feição emitida; tudo do elenco vem depois dela. Sem isto,
    // um óculos sairia pintado POR BAIXO do rosto — o defeito medido em 2026-08-08
    // com a sobrancelha, que custou uma investigação inteira.
    const boca = svg.lastIndexOf("kk-risco");
    const doRosto = svg.indexOf(`fill="#FF00FF"`);
    const doChapeu = svg.indexOf(`fill="#00FF00"`);

    expect(boca).toBeGreaterThan(-1);
    expect(doRosto).toBeGreaterThan(boca);
    expect(doChapeu).toBeGreaterThan(doRosto);
  });

  it("não quebram o contrato do SVG", () => {
    expect(conferirSvg(compor({ ...BASE, chapeu: FALSA, rosto: FALSA }))).toEqual([]);
  });
});

/**
 * `semTraco` — E AS TRÊS ASSERÇÕES QUE O IMPEDEM DE PASSAR POR VACUIDADE.
 *
 * É o mesmo perigo que o docstring do topo nomeia, um andar abaixo: um campo
 * opcional cujo caminho verdadeiro nunca é exercido está "verde" e não existe.
 * Aqui a peça de duas camadas é o caso real — a barba do Bloco 5 —, e o que
 * quebraria em silêncio é o traço voltando para o núcleo: uma linha preta de 12 u
 * atravessando o meio da peça, que nenhum gate de forma, byte ou contrato acusa.
 *
 * A terceira asserção parece pedante e não é: `false` e ausente terem caminhos
 * diferentes seria a peça mudar de aparência ao ganhar um campo que declara o
 * comportamento de sempre.
 */
describe("semTraco — a forma que vive dentro de outra", () => {
  const MISTA: PecaSobreposta = {
    id: "zz-mista",
    nome: "Mista",
    formas: [
      { d: "M0 0 L100 0 L100 100 Z", cor: "var(--av-linha)" },
      { d: "M10 10 L80 10 L80 80 Z", cor: "#5A4632", semTraco: true },
    ],
  };

  it("a forma com semTraco pinta, mas não ganha o `kk-traco`", () => {
    const svg = compor({ ...BASE, rosto: MISTA });

    expect(svg).toContain(`<path d="M10 10 L80 10 L80 80 Z" fill="#5A4632"/>`);
    expect(svg).not.toContain(`<path class="kk-traco" d="M10 10 L80 10 L80 80 Z"/>`);
  });

  it("na peça mista sobra exatamente um traço — o da forma que tem borda externa", () => {
    const svg = compor({ ...BASE, rosto: MISTA });
    const traçosDaPeca = MISTA.formas.filter(
      (f) => svg.includes(`<path class="kk-traco" d="${f.d}"/>`),
    );

    expect(traçosDaPeca).toHaveLength(MISTA.formas.filter((f) => !f.semTraco).length);
    expect(traçosDaPeca[0].d).toBe("M0 0 L100 0 L100 100 Z");

    // E a ordem de `sobrepor()` continua sendo TODO fill antes de TODO traço: o
    // filtro tira uma linha da segunda passada, não muda de passada.
    expect(svg.indexOf(`fill="#5A4632"`)).toBeLessThan(
      svg.indexOf(`<path class="kk-traco" d="M0 0 L100 0 L100 100 Z"/>`),
    );
  });

  it("`semTraco: false` é byte a byte igual ao campo ausente", () => {
    const ausente = compor({ ...BASE, rosto: FALSA });
    const explicito = compor({
      ...BASE,
      rosto: { ...FALSA, formas: FALSA.formas.map((f) => ({ ...f, semTraco: false })) },
    });

    expect(explicito).toBe(ausente);
  });
});
