/**
 * Gate do Bloco 1 (T0.8): a paleta não pode ter duas cores que a criança não
 * consiga distinguir a 56 px.
 *
 * O teste que importa é o último: injetar duas cores próximas TEM de quebrar.
 * Um validador que só confirma a paleta atual não prova nada — ele passaria
 * igual se a régua estivesse errada.
 */

import { describe, expect, it } from "vitest";
import {
  CABELO,
  FUNDO,
  LINHA,
  MIN_CONTORNO,
  MIN_DISTINGUIVEL,
  PELE,
  PROPRIEDADES,
  RARIDADE,
  TRAJE_BASE,
  distancia,
  escurecer,
  menorDistancia,
  paresProximos,
  validarPaleta,
} from "../palette";

describe("distância entre cores", () => {
  it("reproduz o caso documentado de fusão", () => {
    // #4a3526 colando em #3d2b1f: o par que fundiu e tirou a cor de circulação
    // (doc 12, §2.4). É a referência da régua.
    expect(Math.round(distancia("#4a3526", "#3d2b1f"))).toBe(18);
  });

  it("é zero para a mesma cor e simétrica", () => {
    expect(distancia("#AABBCC", "#AABBCC")).toBe(0);
    expect(distancia("#000000", "#FFFFFF")).toBeCloseTo(distancia("#FFFFFF", "#000000"));
  });

  it("rejeita cor fora do formato #RRGGBB", () => {
    expect(() => distancia("#FFF", "#000000")).toThrow(/fora do formato/);
    expect(() => distancia("vermelho", "#000000")).toThrow(/fora do formato/);
  });
});

describe("a paleta de produção", () => {
  it("não tem nenhum par próximo demais", () => {
    const problemas = validarPaleta();
    const legivel = problemas
      .map((p) => `${p.conjunto}: ${p.a} × ${p.b} = ${p.distancia.toFixed(1)} (mínimo ${p.minimo})`)
      .join("\n");
    expect(legivel).toBe("");
  });

  it("tem 8 tons de pele, 8 cabelos e 8 fundos", () => {
    expect(PELE).toHaveLength(8);
    expect(CABELO).toHaveLength(8);
    expect(FUNDO).toHaveLength(8);
  });

  it("mantém folga acima do mínimo em cada conjunto escolhível", () => {
    // Registra a folga real. Se uma cor nova encostar no limite, o número cai
    // e aparece aqui antes de aparecer no boneco.
    for (const [nome, cores] of [
      ["pele", PELE],
      ["cabelo", CABELO],
      ["fundo", FUNDO],
    ] as const) {
      const menor = menorDistancia(cores);
      expect(menor, `${nome}: menor distância ${menor.toFixed(1)}`).toBeGreaterThanOrEqual(
        MIN_DISTINGUIVEL,
      );
    }
  });

  it("mantém o contorno longe de todo preenchimento", () => {
    const fills = [...PELE, ...CABELO, ...Object.values(TRAJE_BASE)];
    for (const cor of fills) {
      expect(distancia(LINHA, cor), `contorno × ${cor}`).toBeGreaterThanOrEqual(MIN_CONTORNO);
    }
  });

  it("cobre as quatro raridades do banco", () => {
    expect(Object.keys(RARIDADE).sort()).toEqual(["common", "epic", "legendary", "rare"]);
  });
});

describe("o validador reprova de verdade", () => {
  it("pega duas cores próximas injetadas num conjunto", () => {
    const problemas = paresProximos("teste", ["#4a3526", "#3d2b1f"]);
    expect(problemas).toHaveLength(1);
    expect(problemas[0].distancia).toBeCloseTo(17.8, 1);
  });

  it("pegaria a paleta de cabelo se o preto voltasse a ser preto de verdade", () => {
    // `#1F1712` contra o contorno `#241610` dista ~7: a silhueta do cabelo
    // desapareceria. É o motivo de o preto da paleta ser #3A2F2A.
    expect(distancia(LINHA, "#1F1712")).toBeLessThan(MIN_CONTORNO);
  });

  it("aceita um conjunto folgado", () => {
    expect(paresProximos("teste", ["#000000", "#FFFFFF", "#FF0000"])).toEqual([]);
  });
});

describe("sombra", () => {
  it("escurece sem sair do intervalo", () => {
    expect(escurecer("#FFFFFF")).toBe("#D1D1D1"); // 255 × 0,82 = 209
    expect(escurecer("#000000")).toBe("#000000");
  });

  it("produz uma sombra visível mas não um segundo contorno", () => {
    // A sombra tem de se distinguir da cor base, e ao mesmo tempo não pode
    // competir com o contorno — senão vira desenho de duas linhas.
    for (const cor of PELE) {
      const s = escurecer(cor);
      expect(distancia(cor, s), `sombra de ${cor}`).toBeGreaterThan(8);
      expect(distancia(LINHA, s), `sombra de ${cor} × contorno`).toBeGreaterThan(20);
    }
  });
});

describe("contrato das custom properties", () => {
  it("não repete nome entre escopo de avatar e de camada", () => {
    const repetidos = PROPRIEDADES.avatar.filter((p) =>
      (PROPRIEDADES.camada as readonly string[]).includes(p),
    );
    expect(repetidos).toEqual([]);
  });

  it("usa o prefixo --av- em todas", () => {
    for (const p of [...PROPRIEDADES.avatar, ...PROPRIEDADES.camada]) {
      expect(p.startsWith("--av-"), p).toBe(true);
    }
  });
});
