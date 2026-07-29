import { describe, it, expect } from "vitest";
import { assetsExigidos, avaliarRenderabilidade } from "../renderability";
import { resolveAssetUrl } from "../assetResolver";
import { SLOT_DEFINITION_MAP } from "../slotDefinitions";
import type { ItemSlot } from "@/types/inventory";

/**
 * A regra de renderabilidade é uma cópia declarativa das regras de
 * nomenclatura do resolver. Se as duas divergirem, o gate de assets passa a
 * aprovar itens que o render não consegue desenhar — que é exatamente o bug
 * que ele existe para pegar. Estes testes amarram uma na outra.
 */

const NENHUM_ASSET = () => false;
const TODO_ASSET = () => true;

describe("assetsExigidos", () => {
  it("head exige as duas variantes de gênero, não o arquivo cru", () => {
    expect(assetsExigidos({ slot: "head", image_url: "/items/head/elmo.png" })).toEqual([
      "/items/head/elmo-swap-male.png",
      "/items/head/elmo-swap-female.png",
    ]);
  });

  it("outfit exige as duas variantes de gênero", () => {
    expect(assetsExigidos({ slot: "outfit", image_url: "/items/outfit/tunica.png" })).toEqual([
      "/items/outfit/tunica-male.png",
      "/items/outfit/tunica-female.png",
    ]);
  });

  it("background, hand e pet exigem só o próprio arquivo", () => {
    for (const slot of ["background", "hand", "pet"] as ItemSlot[]) {
      expect(assetsExigidos({ slot, image_url: "/items/x/a.png" })).toEqual(["/items/x/a.png"]);
    }
  });

  it("o APNG do pet é opcional — pet sem animação ainda aparece", () => {
    const exigidos = assetsExigidos({ slot: "pet", image_url: "/items/pet/coruja.png" });
    expect(exigidos).not.toContain("/items/pet/coruja-animated.png");
  });

  it("frame não exige arquivo nenhum — é CSS por raridade", () => {
    expect(assetsExigidos({ slot: "frame", image_url: "/items/frame/ouro.png" })).toEqual([]);
  });
});

describe("assetsExigidos casa com resolveAssetUrl", () => {
  // Sem isto, mudar o sufixo em um dos dois lugares passa despercebido.
  const casos: { slot: ItemSlot; url: string }[] = [
    { slot: "head", url: "/items/head/elmo.png" },
    { slot: "outfit", url: "/items/outfit/tunica.png" },
    { slot: "background", url: "/items/bg/castelo.png" },
    { slot: "hand", url: "/items/hand/cetro.png" },
    { slot: "pet", url: "/items/pet/coruja.png" },
  ];

  for (const { slot, url } of casos) {
    it(`${slot}: todo caminho que o resolver produz está na lista de exigidos`, () => {
      const modo = SLOT_DEFINITION_MAP[slot].renderMode;
      const exigidos = assetsExigidos({ slot, image_url: url });
      for (const genero of ["male", "female"] as const) {
        const produzido = resolveAssetUrl(url, genero, modo, false);
        expect(exigidos).toContain(produzido);
      }
    });
  }
});

describe("avaliarRenderabilidade", () => {
  it("frame renderiza mesmo sem asset algum", () => {
    const r = avaliarRenderabilidade({ slot: "frame", image_url: null }, NENHUM_ASSET);
    expect(r.renderiza).toBe(true);
  });

  it("image_url nulo não renderiza", () => {
    const r = avaliarRenderabilidade({ slot: "head", image_url: null }, TODO_ASSET);
    expect(r.renderiza).toBe(false);
    expect(r.motivo).toBe("image_url nulo");
  });

  it("head com apenas uma das duas variantes NÃO renderiza", () => {
    // Foi assim que a Camiseta do Clube ficou meio-quebrada: existe
    // -male, não existe -female, e ninguém percebeu do lado feminino.
    const soMale = (c: string) => c.endsWith("-swap-male.png");
    const r = avaliarRenderabilidade({ slot: "head", image_url: "/items/head/elmo.png" }, soMale);
    expect(r.renderiza).toBe(false);
    expect(r.faltando).toEqual(["/items/head/elmo-swap-female.png"]);
  });

  it("pet com o arquivo estático presente renderiza", () => {
    const r = avaliarRenderabilidade({ slot: "pet", image_url: "/items/pet/coruja.png" }, TODO_ASSET);
    expect(r.renderiza).toBe(true);
    expect(r.faltando).toEqual([]);
  });
});
