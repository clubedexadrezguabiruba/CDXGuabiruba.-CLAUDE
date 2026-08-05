/**
 * O TRAÇO DA PEÇA TRAÇADA — e a regressão de que ele não vazou para quem não devia.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, EM UMA FRASE
 * ---------------------------------------------------------------------------
 *
 * `.kk-cabelo-s` tem `fill` **e** `stroke`. Na família paramétrica isso está certo:
 * a touca fecha por um retângulo a `FORA` da caixa da cabeça, o clip come aquele
 * trecho inteiro, e o que sobra traçado é exatamente a franja — perímetro matemático
 * e traço visível coincidem por construção.
 *
 * Num laço FECHADO eles deixam de coincidir. O laço tem borda também por cima, e ali
 * quem desenha o contorno na arte é a cabeça do BONECO do gerador, que é `descarte`.
 * Medido na `curto-espetada`: em **876 dos 3 028** pontos do laço a sonda pela normal
 * não encontra preto nenhum. Traçar o laço inteiro põe uma barra preta atravessando a
 * coroa, com pele por cima, que ninguém desenhou.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO MEDE, E O QUE ELE DE PROPÓSITO NÃO MEDE
 * ---------------------------------------------------------------------------
 *
 * Ele **não** mede "a linha corre sobre a massa". Com `Cabelo.linhas` sendo arcos de
 * ÍNDICE, o traço não corre sobre a massa: ele *é* a massa no trecho apontado,
 * emitido pelos mesmos comandos `C`. Uma amarra que não pode falhar é a aprovação
 * por vacuidade que este projeto já pagou duas vezes — então o que se mede aqui é
 * que a **emissão** cumpre isso, comparando `d` com `d`.
 */

import { describe, expect, it } from "vitest";
import {
  CABELOS,
  MODELOS_CABELO,
  arcosDeTraco,
  pathCabelo,
  pathCabeloLinhas,
} from "../cabelo";
import type { Cabelo, PontoFranja } from "../cabelo";
import { compor } from "../compositor";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";
import { PARAMETRICO_CONGELADO } from "./parametrico-congelado";
import { createHash } from "node:crypto";

const svgDe = (modelo?: Parameters<typeof compor>[0]["modeloCabelo"], animado = false) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t", animado });

const formas = (svg: string) => (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
const sha = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");
const cssDe = (svg: string) => svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";

/** O mesmo laço com cortina de `cabelo.test.ts` — a topologia que a arte exige. */
const MASSA: readonly PontoFranja[] = [
  { t: -0.14, y: 236 },
  { t: 0.04, y: 300 },
  { t: 0.14, y: 246 },
  { t: 0.24, y: 132 },
  { t: 0.5, y: 122 },
  { t: 0.78, y: 130 },
  { t: 1.0, y: 178 },
  { t: 1.16, y: 234 },
  { t: 1.2, y: 30 },
  { t: 0.5, y: 12 },
  { t: -0.2, y: 30 },
];

/** Traço na borda de baixo (0→7) e num pedaço da volta. A coroa fica sem linha. */
const tracado: Cabelo = {
  id: "curto",
  nome: "curto (traçado, com arcos de traço)",
  massa: MASSA,
  linhas: [
    [0, 7],
    [9, 10],
  ],
};

describe("a regressão: o B4 não vazou para a família paramétrica", () => {
  it("os cinco do catálogo continuam paramétricos — se um mudou de família, é aqui que se lê", () => {
    // Esta amarra vem ANTES das de bytes de propósito. No dia em que o `curto` for
    // re-traçado (checkpoint C), o SVG dele muda por um motivo legítimo, e sem esta
    // linha o relatório seria um diff de SHA sem explicação nenhuma.
    for (const modelo of MODELOS_CABELO) {
      expect(CABELOS[modelo].massa, `${modelo} deixou de ser paramétrico`).toBeUndefined();
    }
  });

  it.each(MODELOS_CABELO)("%s compõe byte a byte igual ao de antes do B4", (modelo) => {
    for (const animado of [false, true]) {
      const chave = `${modelo}${animado ? " (animado)" : ""}`;
      const svg = svgDe(modelo, animado);
      const antes = PARAMETRICO_CONGELADO[chave];
      // O CSS primeiro: é onde a mudança do B4 teria caído, e é o único dos três que
      // dá um diff legível. O SHA logo abaixo é quem garante o resto do arquivo.
      expect(cssDe(svg), `${chave}: o bloco <style> mudou`).toBe(antes.css);
      expect(Buffer.byteLength(svg, "utf-8"), `${chave}: o tamanho mudou`).toBe(antes.bytes);
      expect(sha(svg), `${chave}: algum byte fora do <style> mudou`).toBe(antes.sha);
    }
  });

  it("a base careca continua idêntica — o teto de regressão absoluto do estilo", () => {
    const careca = svgDe();
    expect(cssDe(careca)).toBe(PARAMETRICO_CONGELADO["__careca"].css);
    expect(sha(careca)).toBe(PARAMETRICO_CONGELADO["__careca"].sha);
    // E ela continua sem pagar nada pelo slot: nem regra nova, nem classe nova.
    expect(careca).not.toContain(".kk-cabelo");
  });
});

describe("as classes do cabelo saem por família, e nenhuma regra sai à toa", () => {
  it("o paramétrico emite `.kk-cabelo-s` com fill E stroke, e nenhuma das duas novas", () => {
    const css = cssDe(svgDe("curto"));
    expect(css).toContain(".t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha)");
    expect(css).not.toContain(".kk-cabelo-m");
    expect(css).not.toContain(".kk-cabelo-l");
  });

  it("o traçado emite `.kk-cabelo-m` SEM stroke, e `.kk-cabelo-l` sem fill", () => {
    const css = cssDe(svgDe(tracado));
    expect(css).toContain(".t .kk-cabelo-m{fill:var(--av-cabelo-s)}");
    expect(css).toContain(".t .kk-cabelo-l{fill:none;stroke:var(--av-linha)");
    // A que tinha os dois papéis não sai para quem não é dela. Se saísse, o laço
    // fechado voltaria a ser traçado no perímetro inteiro pela regra antiga.
    expect(css).not.toContain(".kk-cabelo-s");
  });

  it("traçado SEM arcos não emite `.kk-cabelo-l` — regra emitida à toa custa bytes", () => {
    const semTraco: Cabelo = { id: "curto", nome: "chapado de traço", massa: MASSA };
    const css = cssDe(svgDe(semTraco));
    expect(css).toContain(".kk-cabelo-m");
    expect(css).not.toContain(".kk-cabelo-l");
    expect(svgDe(semTraco)).not.toContain(`d=""`);
  });
});

describe("o traço é a própria massa, no trecho apontado", () => {
  it("os comandos do arco são os MESMOS que o laço emite ali — não uma curva parecida", () => {
    // A prova de que não há duas descrições da mesma borda. O laço fechado emite um
    // `C` por trecho, na ordem; o arco [0,7] tem de ser os sete primeiros, idênticos.
    const doLaco = pathCabelo(tracado).match(/C [^C]*/g) ?? [];
    const arco = pathCabeloLinhas(tracado);
    const doArco = arco.split("M ")[1].match(/C [^C]*/g) ?? [];
    expect(doLaco.length).toBe(MASSA.length);
    expect(doArco.length).toBe(7);
    expect(doArco.join("")).toBe(doLaco.slice(0, 7).join(""));
  });

  it("o arco dá a volta pelo fim do vetor quando `último` é menor que `primeiro`", () => {
    const daVolta: Cabelo = { ...tracado, linhas: [[9, 2]] };
    const d = pathCabeloLinhas(daVolta);
    // 9→10→0→1→2 são quatro trechos, e um `M` só.
    expect((d.match(/C /g) ?? []).length).toBe(4);
    expect((d.match(/M /g) ?? []).length).toBe(1);
  });

  it("um arco por subpath, e o traço não fecha com `Z`", () => {
    // Fechar transformaria a polilinha aberta num laço, e o `stroke-linecap:round`
    // deixaria de aparecer nas pontas — que é justamente onde o traço da arte acaba.
    const d = pathCabeloLinhas(tracado);
    expect((d.match(/M /g) ?? []).length).toBe(2);
    expect(d).not.toContain("Z");
  });

  it("sem `linhas`, não há path de traço — e o compositor não emite forma vazia", () => {
    const semTraco: Cabelo = { id: "curto", nome: "chapado de traço", massa: MASSA };
    expect(pathCabeloLinhas(semTraco)).toBe("");
    expect(pathCabeloLinhas("curto")).toBe("");
  });
});

describe("a régua dos arcos", () => {
  it("mede a fração do laço que sai traçada, e não reprova a peça boa", () => {
    const r = arcosDeTraco(tracado)!;
    expect(r.falhas).toEqual([]);
    // 8 dos 11 trechos: [0,7] são sete, [9,10] é um.
    expect(r.fracao).toBeCloseTo(8 / 11, 6);
  });

  it("devolve `null` quando não há o que medir, e os dois casos são nomeados", () => {
    expect(arcosDeTraco("curto")).toBeNull(); // paramétrico
    expect(arcosDeTraco({ id: "curto", nome: "chapado", massa: MASSA })).toBeNull();
  });

  it("R10: reprova índice fora da massa — o `d` sairia com NaN e nada acusaria", () => {
    const fora: Cabelo = { ...tracado, linhas: [[0, 99]] };
    expect(arcosDeTraco(fora)!.falhas.length).toBeGreaterThan(0);
    expect(arcosDeTraco(fora)!.falhas[0]).toContain("fora da massa");
  });

  it("R10: reprova arcos sobrepostos — dois traços coincidentes são invisíveis na tela", () => {
    const sobrepostos: Cabelo = {
      ...tracado,
      linhas: [
        [0, 7],
        [5, 9],
      ],
    };
    const falhas = arcosDeTraco(sobrepostos)!.falhas;
    expect(falhas.length).toBeGreaterThan(0);
    expect(falhas[0]).toContain("mais de um arco");
  });

  it("`primeiro === último` é o laço INTEIRO, e a fração diz isso", () => {
    // É a barra preta falsa escrita de outro jeito. Ela não reprova aqui — só é
    // defeito quando a arte não tem preto no perímetro todo, e a arte não mora neste
    // arquivo. Quem tem as duas do lado é `avatar:importar`.
    const inteiro: Cabelo = { ...tracado, linhas: [[3, 3]] };
    expect(arcosDeTraco(inteiro)!.fracao).toBe(1);
    expect(arcosDeTraco(inteiro)!.falhas).toEqual([]);
  });
});

describe("a peça traçada composta", () => {
  it("passa no contrato de custom properties", () => {
    expect(conferirSvg(svgDe(tracado))).toEqual([]);
  });

  it("paga UMA forma pelo traço, e só quando há arcos", () => {
    const semTraco: Cabelo = { id: "curto", nome: "chapado de traço", massa: MASSA };
    // Sem clara: massa (1) + traço (1). A base careca são 19.
    expect(formas(svgDe(tracado))).toBe(19 + 2);
    expect(formas(svgDe(semTraco))).toBe(19 + 1);
  });

  it("o traço vem DEPOIS da camada clara, senão a clara o cobriria", () => {
    const comClara: Cabelo = {
      ...tracado,
      clara: [
        { t: 0.28, y: 108 },
        { t: 0.5, y: 100 },
        { t: 0.72, y: 106 },
        { t: 0.72, y: 52 },
        { t: 0.28, y: 52 },
      ],
    };
    const svg = svgDe(comClara);
    // Pelo ATRIBUTO, e não pelo nome da classe: o nome aparece antes, dentro do
    // `<style>`, e a ordem que importa é a dos elementos — quem é pintado por cima.
    const ondeEsta = (classe: string) => svg.indexOf(`class="${classe}"`);
    expect(ondeEsta("kk-cabelo-l")).toBeGreaterThan(ondeEsta("kk-cabelo"));
    expect(ondeEsta("kk-cabelo")).toBeGreaterThan(ondeEsta("kk-cabelo-m"));
  });
});
