/**
 * O CHAPÉU CONTÉM O CABELO — a supressão de `escondeCabelo`, medida no que
 * `compor()` emite.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE FUNDOU ESTE GATE
 * ---------------------------------------------------------------------------
 *
 * Até 2026-08-25 o chapéu era pintado por cima do cabelo INTEIRO e nada era
 * suprimido. O que se via, medido nos 171 pares do elenco: o `moicano` deixava
 * **29,2% da própria massa** visível acima da linha da `touca-de-la`, e o
 * `coque-individual` furava o topo da `cartola` com 0,2% da massa subindo **238 u**.
 * Lido a olho na folha do `chapeu-mago`, o efeito é sempre o mesmo — cabelo
 * emoldurado por preto em cima e embaixo, que lê como cabelo **nascendo através** do
 * chapéu, ou como tufo solto grudado nele.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO COBRA, E O QUE ELE DEIXA PARA A `arte:par`
 * ---------------------------------------------------------------------------
 *
 * Aqui é **estrutura**: o `clipPath` existe, veste as QUATRO emissões de cabelo, e
 * some inteiro quando falta chapéu, falta cabelo ou falta a linha. É o que trava a
 * ligação — arrancar o clip do compositor reprova aqui e em lugar nenhum mais.
 *
 * A **geometria** (quanto de cada cabelo sobra debaixo de cada chapéu) é da
 * `npm run arte:par`, que rasteriza os 171 pares. As duas se completam: sem esta, a
 * régua de lá mediria uma linha que o produto não aplica; sem a de lá, esta
 * aprovaria um `clipPath` apontando para uma região vazia.
 */
import { describe, expect, it } from "vitest";

import { CHAPEUS_DA_ARTE } from "../chapeus-da-arte";
import { compor } from "../compositor";
import { CABELOS } from "../cabelo";
import { conferirSvg } from "../../svgContrato";
import type { EstadoAvatar, PecaDeChapeu } from "../tipos";

const BASE: EstadoAvatar = {
  pele: "#E9B183",
  cabelo: "#3A2F2A",
  ns: "t",
};

/** Um chapéu do elenco, com linha de verdade extraída pela esteira. */
const COM_LINHA: PecaDeChapeu = CHAPEUS_DA_ARTE["chapeu-mago"];

/** O mesmo chapéu sem a linha — o estado de antes de 2026-08-25. */
const SEM_LINHA: PecaDeChapeu = { id: COM_LINHA.id, nome: COM_LINHA.nome, arte: COM_LINHA.arte! };

/** O cabelo que mais escapava: 29,2% da massa acima da linha, medido. */
const CABELO = "moicano" as const;

const CLIP = `clip-path="url(#t-c-chapeu)"`;

describe("o chapéu contém o cabelo (`escondeCabelo`)", () => {
  it("todos os 9 chapéus do elenco declaram a linha", () => {
    const sem = Object.values(CHAPEUS_DA_ARTE).filter((c) => !c.escondeCabelo);
    expect(sem.map((c) => c.id)).toEqual([]);
    expect(Object.keys(CHAPEUS_DA_ARTE).length).toBeGreaterThan(0);
  });

  it("com chapéu E cabelo, o clip existe e a linha do catálogo entra nele", () => {
    const svg = compor({ ...BASE, modeloCabelo: CABELO, chapeu: COM_LINHA });
    expect(svg).toContain(`<clipPath id="t-c-chapeu"`);
    expect(svg).toContain(COM_LINHA.escondeCabelo!);
    expect(svg).toContain(CLIP);
  });

  it("o cabelo é emitido DENTRO do clip, e o chapéu FORA dele", () => {
    const svg = compor({ ...BASE, modeloCabelo: CABELO, chapeu: COM_LINHA });
    const d = CABELOS[CABELO].tonal!.formas[0].d;

    // A peça de cabelo aparece depois da abertura do grupo e antes do fechamento.
    const abre = svg.indexOf(`<g ${CLIP}>`);
    expect(abre).toBeGreaterThan(-1);
    const fecha = svg.indexOf("</g>", abre);
    const ondeCabelo = svg.indexOf(d);
    expect(ondeCabelo).toBeGreaterThan(abre);
    expect(ondeCabelo).toBeLessThan(fecha);

    // E o chapéu NÃO: quem contém não pode ser contido pela própria linha.
    const ondeChapeu = svg.indexOf(COM_LINHA.arte!);
    expect(ondeChapeu).toBeGreaterThan(fecha);
  });

  it("AUSENTE ≡ o comportamento histórico, byte a byte", () => {
    // Sem chapéu: nada muda.
    const soCabelo = compor({ ...BASE, modeloCabelo: CABELO });
    expect(soCabelo).not.toContain("c-chapeu");

    // Chapéu SEM linha: o SVG é idêntico ao de antes do campo existir. É a 4ª
    // condição que `camadas.ts` cobra de toda válvula nova, e é ela que garante que
    // um chapéu novo sem linha não regride nada — só não esconde.
    const semLinha = compor({ ...BASE, modeloCabelo: CABELO, chapeu: SEM_LINHA });
    expect(semLinha).not.toContain("c-chapeu");
    expect(semLinha).not.toContain(CLIP);

    // Chapéu COM linha e SEM cabelo: também nada, porque não há o que conter.
    const soChapeu = compor({ ...BASE, chapeu: COM_LINHA });
    expect(soChapeu).not.toContain("c-chapeu");
    expect(soChapeu).toBe(compor({ ...BASE, chapeu: SEM_LINHA }));
  });

  it("o clip MUDA o SVG — não é decoração inerte", () => {
    const contido = compor({ ...BASE, modeloCabelo: CABELO, chapeu: COM_LINHA });
    const solto = compor({ ...BASE, modeloCabelo: CABELO, chapeu: SEM_LINHA });
    expect(contido).not.toBe(solto);
    expect(contido.length).toBeGreaterThan(solto.length);
  });

  it("a linha de cada chapéu é DISTINTA — a esteira não carimbou a mesma em todos", () => {
    const linhas = Object.values(CHAPEUS_DA_ARTE).map((c) => c.escondeCabelo!);
    expect(new Set(linhas).size).toBe(linhas.length);
  });

  it("o contrato do SVG continua valendo com o clip ligado", () => {
    expect(conferirSvg(compor({ ...BASE, modeloCabelo: CABELO, chapeu: COM_LINHA }))).toEqual([]);
  });

  it("vale para os 19 cabelos, e o ns não vaza entre bonecos", () => {
    const tonais = Object.entries(CABELOS).filter(([, c]) => c.tonal);
    expect(tonais.length).toBe(19);
    for (const [id] of tonais) {
      const svg = compor({ ...BASE, modeloCabelo: id as never, chapeu: COM_LINHA, ns: "z" });
      expect(svg, id).toContain(`<clipPath id="z-c-chapeu"`);
      expect(svg, id).not.toContain("t-c-chapeu");
    }
  });
});
