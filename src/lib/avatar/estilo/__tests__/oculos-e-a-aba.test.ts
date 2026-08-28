/**
 * O ÓCULOS FICA POR CIMA DO CHAPÉU — menos onde a aba desce sobre os olhos.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO EXISTE PARA IMPEDIR
 * ---------------------------------------------------------------------------
 *
 * Até 2026-08-28 o óculos vinha ANTES do chapéu, sempre, com o argumento de que
 * *"aba de chapéu por cima de óculos é o que aba faz"*. O render dos 45 pares
 * derrubou o argumento: na maioria das peças a aba que cruza o óculos é a de TRÁS —
 * a que contorna o crânio pelo outro lado —, e aba de trás por cima da armação é
 * impossível. Medido antes da troca: **8,29% da pegada do óculos comida à esquerda e
 * 9,23% à direita**, somados os 45 pares. Nunca foi defeito de um lado só, e é por
 * isso que a correção não pôde ser "à direita o óculos vence".
 *
 * Sobrou **um** chapéu na ordem antiga, e o Doug o nomeou olhando a folha: o `bone`.
 * *"Por ter uma aba que desce abaixo da testa. O óculos por cima dessa aba não faz
 * sentido, pois na vida real a aba deve estar acima dos óculos."*
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE MEDE O ELENCO REAL, E NÃO UMA FIXTURE
 * ---------------------------------------------------------------------------
 *
 * `pilha-de-camadas.test.ts` já prova que as DUAS linhas da tabela existem e saem no
 * lugar certo — mas com peça sintética, onde a bandeira é escrita à mão pelo próprio
 * teste. O que ele não pode ver é se o CATÁLOGO declarou a bandeira na peça certa.
 * Este arquivo fecha isso: percorre os 9 chapéus e os 5 óculos que o produto publica.
 */

import { describe, expect, it } from "vitest";
import { compor } from "../compositor";
import { CHAPEUS_DA_ARTE } from "../chapeus-da-arte";
import { OCULOS_DA_ARTE } from "../oculos-da-arte";
import { MODELOS_CABELO } from "../cabelo";

const CHAPEUS = Object.keys(CHAPEUS_DA_ARTE).sort();
const OCULOS = Object.keys(OCULOS_DA_ARTE).sort();

/** O único chapéu do elenco com pala para a frente, nomeado pelo Doug no render. */
const COM_ABA_NA_FRENTE = "chapeu-bone";

const svgDe = (chapeu?: string, oculos?: string) =>
  compor({
    pele: "#E9B183",
    cabelo: "#3A2F2A",
    modeloCabelo: MODELOS_CABELO[0],
    chapeu: chapeu ? CHAPEUS_DA_ARTE[chapeu] : undefined,
    oculos: oculos ? OCULOS_DA_ARTE[oculos] : undefined,
    ns: "aba",
  });

/** Onde cada peça aparece no SVG. `-1` se não apareceu — e aí a asserção diz isso. */
function posicoes(svg: string) {
  return {
    oculos: svg.search(/<image href="\/items\/oculos\//),
    chapeu: svg.search(/<image href="\/items\/chapeu\//),
  };
}

describe("o óculos contra a aba do chapéu", () => {
  it("o catálogo declara a bandeira em exatamente UMA peça, e é o boné", () => {
    const comBandeira = CHAPEUS.filter((c) => CHAPEUS_DA_ARTE[c].abaSobreOculos);
    expect(comBandeira).toEqual([COM_ABA_NA_FRENTE]);
    // Não-vacuidade: se o elenco encolher para zero chapéus, o `toEqual` acima
    // continuaria passando contra uma lista vazia se o esperado também esvaziasse.
    expect(CHAPEUS.length).toBeGreaterThan(1);
  });

  it.each(CHAPEUS)("%s — a ordem contra os 5 óculos é a que a peça declara", (chapeu) => {
    const naFrente = Boolean(CHAPEUS_DA_ARTE[chapeu].abaSobreOculos);
    for (const oculos of OCULOS) {
      const p = posicoes(svgDe(chapeu, oculos));
      expect(p.oculos, `${chapeu} + ${oculos}: o óculos não foi emitido`).toBeGreaterThan(-1);
      expect(p.chapeu, `${chapeu} + ${oculos}: o chapéu não foi emitido`).toBeGreaterThan(-1);
      if (naFrente) {
        expect(
          p.oculos,
          `${chapeu} + ${oculos}: a pala desce sobre os olhos, então o óculos tem de sair ANTES do chapéu`,
        ).toBeLessThan(p.chapeu);
      } else {
        expect(
          p.oculos,
          `${chapeu} + ${oculos}: a aba que cruza o óculos é a de trás, então o óculos tem de sair DEPOIS do chapéu`,
        ).toBeGreaterThan(p.chapeu);
      }
    }
  });

  /**
   * O CONTROLE NEGATIVO, e sem ele o teste acima poderia estar lendo o slug.
   *
   * A mesma arte do `bone` sem a bandeira tem de inverter, e a de outro chapéu COM a
   * bandeira também. Se a ordem não se mexer, quem decide não é o campo — e o gate
   * estaria confirmando o catálogo de hoje em vez de medir o mecanismo.
   */
  it("é a BANDEIRA que decide, não o slug", () => {
    const bone = CHAPEUS_DA_ARTE[COM_ABA_NA_FRENTE];
    const outro = CHAPEUS_DA_ARTE[CHAPEUS.find((c) => c !== COM_ABA_NA_FRENTE)!];
    const oculos = OCULOS_DA_ARTE[OCULOS[0]];

    const semBandeira = compor({
      pele: "#E9B183",
      cabelo: "#3A2F2A",
      modeloCabelo: MODELOS_CABELO[0],
      chapeu: { ...bone, abaSobreOculos: undefined },
      oculos,
      ns: "aba",
    });
    const comBandeira = compor({
      pele: "#E9B183",
      cabelo: "#3A2F2A",
      modeloCabelo: MODELOS_CABELO[0],
      chapeu: { ...outro, abaSobreOculos: true },
      oculos,
      ns: "aba",
    });

    const a = posicoes(semBandeira);
    const b = posicoes(comBandeira);
    expect(a.oculos, "o boné SEM a bandeira continuou embaixo — o campo não decide nada").toBeGreaterThan(
      a.chapeu,
    );
    expect(b.oculos, "outro chapéu COM a bandeira não subiu — o campo não decide nada").toBeLessThan(
      b.chapeu,
    );
  });

  it("sem chapéu, o óculos sai uma vez e não some", () => {
    for (const oculos of OCULOS) {
      const svg = svgDe(undefined, oculos);
      const n = (svg.match(/<image href="\/items\/oculos\//g) ?? []).length;
      expect(n, `${oculos} sem chapéu: esperava 1 emissão, veio ${n}`).toBe(1);
    }
  });
});
