import { describe, it, expect } from "vitest";
import { resolveAssetUrl, resolveAsset } from "../assetResolver";
import { AVATAR_ASSETS, assetExiste } from "../assetManifest";

/**
 * T0.2/T0.3 — o resolver passou a consultar o manifesto.
 *
 * O que estes testes protegem: a diferença entre "não há item equipado"
 * (candidato null, ausente false) e "há item equipado e o arquivo sumiu"
 * (candidato preenchido, ausente true). Confundir os dois é o que fazia
 * 45 itens desaparecerem sem sintoma.
 */

describe("resolveAssetUrl — regras de nomenclatura", () => {
  it("head_swap acrescenta -swap-{gênero}", () => {
    expect(resolveAssetUrl("/items/head/x.png", "male", "head_swap")).toBe("/items/head/x-swap-male.png");
    expect(resolveAssetUrl("/items/head/x.png", "female", "head_swap")).toBe("/items/head/x-swap-female.png");
  });

  it("dressed_base acrescenta -{gênero}", () => {
    expect(resolveAssetUrl("/items/outfit/x.png", "female", "dressed_base")).toBe("/items/outfit/x-female.png");
  });

  it("companion só vira -animated quando animated=true", () => {
    expect(resolveAssetUrl("/items/pet/x.png", "male", "companion", false)).toBe("/items/pet/x.png");
    expect(resolveAssetUrl("/items/pet/x.png", "male", "companion", true)).toBe("/items/pet/x-animated.png");
  });

  it("underlay e frame_ui não transformam o caminho", () => {
    for (const modo of ["underlay", "frame_ui"] as const) {
      expect(resolveAssetUrl("/items/x/a.png", "male", modo)).toBe("/items/x/a.png");
    }
  });

  it("baseUrl nulo devolve null", () => {
    expect(resolveAssetUrl(null, "male", "underlay")).toBeNull();
  });
});

describe("resolveAsset — confronto com o manifesto", () => {
  it("sem item equipado: nada ausente", () => {
    expect(resolveAsset(null, "male", "underlay")).toEqual({ candidato: null, src: null, ausente: false });
  });

  it("arquivo presente no manifesto: src preenchido, ausente false", () => {
    const presente = "/items/bg/castelo.png";
    expect(assetExiste(presente)).toBe(true);
    expect(resolveAsset(presente, "male", "underlay")).toEqual({
      candidato: presente,
      src: presente,
      ausente: false,
    });
  });

  it("arquivo fora do manifesto: src null e ausente TRUE, com o candidato preservado", () => {
    // Caso real: o Elmo de Cavaleiro não tem as variantes -swap-*.
    const r = resolveAsset("/items/head/elmo-cavaleiro.png", "male", "head_swap");
    expect(r.candidato).toBe("/items/head/elmo-cavaleiro-swap-male.png");
    expect(r.src).toBeNull();
    expect(r.ausente).toBe(true);
  });
});

describe("manifesto", () => {
  it("está ordenado e sem duplicatas — a geração é determinística", () => {
    const ordenado = [...AVATAR_ASSETS].sort();
    expect([...AVATAR_ASSETS]).toEqual(ordenado);
    expect(new Set(AVATAR_ASSETS).size).toBe(AVATAR_ASSETS.length);
  });

  it("todo caminho começa em /items/", () => {
    for (const c of AVATAR_ASSETS) expect(c.startsWith("/items/")).toBe(true);
  });

  it("assetExiste rejeita null, vazio e caminho desconhecido", () => {
    expect(assetExiste(null)).toBe(false);
    expect(assetExiste("")).toBe(false);
    expect(assetExiste("/items/nao/existe.png")).toBe(false);
  });
});
