/**
 * A FOLHA DE ESTILO ÚNICA — N avatares, um bloco `<style>`.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO MEDE, E O QUE ELE DELIBERADAMENTE NÃO MEDE
 * ---------------------------------------------------------------------------
 *
 * Ele **não** mede bytes do SVG no modo folha externa, e a ausência é o assunto:
 * quando o `<style>` sai de dentro do SVG, os bytes mudam **por construção**, e um
 * selo ali seria um número congelado sem pergunta por trás. Quem responde pela
 * aparência continua sendo `parametrico-congelado.ts` (modo embutido, 11 selos byte
 * a byte) e `npm run avatar:pose`.
 *
 * O que ele mede é o que o modo novo pode quebrar e nada mais acusaria:
 *
 *  1. **o número** — que a dedup do React de fato acontece;
 *  2. **a completude da folha** — classe emitida sem regra correspondente renderiza
 *     PRETO e passa em todo o resto (é o defeito nº 2 de `svgContrato.ts`);
 *  3. **o contrato** — o CSS saiu de dentro do SVG e saiu junto do alcance de
 *     `conferirSvg`; aqui ele volta;
 *  4. **a unicidade de `id`** — a única coisa que o `ns` ainda faz no modo novo.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import { compor, folhaAvatar } from "@/lib/avatar/estilo/compositor";
import { MODELOS_CABELO } from "@/lib/avatar/estilo/cabelo";
import { IDS_DA_ARTE, PECAS_DA_ARTE } from "@/lib/avatar/estilo/pecas-da-arte";
import { ROSTOS } from "@/lib/avatar/catalogo";
import { CABELO, PELE } from "@/lib/avatar/palette";
import { conferirSvg } from "@/lib/avatar/svgContrato";

/** O tamanho da lista do ranking, que é o caso que motivou a folha (doc 15, 5.7). */
const N = 30;

const blocosDeEstilo = (html: string) => (html.match(/<style/g) ?? []).length;

/**
 * A lista do ranking, variando pele, cor e modelo — 30 iguais mediriam o cache.
 *
 * **Com peça de rosto**, e isso não é enfeite: desde o tom contínuo (Bloco 5) a peça
 * pode trazer um `<mask id="{ns}-tom-{slot}">`, e o `<mask>` é a coisa mais fatal de
 * colidir que existe nesta lista — id repetido faz a segunda máscara vestir o
 * desenho da primeira, sem erro nenhum, em nenhum lugar. Um ranking sem rosto
 * deixaria a asserção dos 30 conjuntos distintos passando por cima do caso.
 */
const ROSTO_DO_RANKING = Object.keys(ROSTOS)[0];

const ranking = () =>
  createElement(
    "div",
    null,
    Array.from({ length: N }, (_, i) =>
      createElement(AvatarKokeshi, {
        key: i,
        skin: i % PELE.length,
        hair: MODELOS_CABELO[i % MODELOS_CABELO.length],
        hairColor: i % CABELO.length,
        rosto: ROSTO_DO_RANKING,
        altura: 78,
        ns: `r${i}`,
      }),
    ),
  );

describe("a folha de estilo única", () => {
  it(`emite UM bloco <style> para ${N} avatares`, () => {
    const html = renderToStaticMarkup(ranking());

    expect(blocosDeEstilo(html)).toBe(1);
    // E os SVGs em si não carregam nenhum — senão a dedup estaria apenas escondendo
    // 30 blocos dentro de um `<style>` só.
    expect(html.match(/<svg/g) ?? []).toHaveLength(N);
    expect(html).not.toContain("</style><svg");
  });

  it("cada avatar continua carregando as próprias cores", () => {
    const html = renderToStaticMarkup(ranking());

    // A folha é comum; a identidade não é. Se as custom properties tivessem subido
    // junto, os 30 sairiam com a mesma pele — que é a falha silenciosa desta troca.
    for (const tom of PELE) expect(html).toContain(`--av-pele:${tom}`);
  });

  it("o SVG do modo folha externa não traz <style>, e o embutido traz", () => {
    const base = { pele: PELE[2], cabelo: CABELO[0], modeloCabelo: "coque" as const, ns: "t" };

    expect(compor({ ...base })).toContain("<style>");
    expect(compor({ ...base, folhaExterna: true })).not.toContain("<style>");
  });
});

describe("a folha cobre TODA classe que o SVG emite", () => {
  /**
   * As classes que aparecem em `class="…"` de um SVG, sem a classe da raiz.
   *
   * Só interessam as `kk-*`: a raiz leva `kk` e `kk-anima`, que são seletores da
   * folha e não elementos pintados por ela.
   */
  function classesPintadas(svg: string): Set<string> {
    const achadas = new Set<string>();
    for (const m of svg.matchAll(/class="([^"]+)"/g))
      for (const c of m[1].split(/\s+/))
        if (c.startsWith("kk-") && c !== "kk-anima") achadas.add(c);
    return achadas;
  }

  /**
   * Todo caso que o produto pode desenhar: as duas famílias de cabelo, a careca, e
   * as peças da arte — que ainda não têm slug, mas passam pelo mesmo `compor()` e
   * exercitam a família traçada com e sem arcos.
   */
  const casos = [
    { nome: "careca", modelo: undefined },
    ...MODELOS_CABELO.map((m) => ({ nome: m, modelo: m })),
    ...IDS_DA_ARTE.map((id) => ({ nome: `arte:${id}`, modelo: PECAS_DA_ARTE[id] })),
  ];

  for (const animado of [false, true]) {
    for (const { nome, modelo } of casos) {
      it(`${nome}${animado ? " (animado)" : ""}`, () => {
        const svg = compor({
          pele: PELE[2],
          cabelo: CABELO[0],
          modeloCabelo: modelo,
          animado,
          ns: "u",
          folhaExterna: true,
        });
        const folha = folhaAvatar();

        for (const classe of classesPintadas(svg)) {
          // A regra pode estar escopada por `.kk` OU pelo interruptor `.kk-anima` —
          // `kk-respira`, `kk-sombra` e `kk-olho` saem SEMPRE nos elementos, e a
          // regra delas mora atrás do portão. Exigir só `.kk ` reprovaria o boneco
          // parado por um falso positivo.
          const temRegra =
            folha.includes(`.kk .${classe}{`) || folha.includes(`.kk-anima .${classe}{`);
          expect(temRegra, `.${classe} é emitida no SVG e não tem regra na folha`).toBe(true);
        }
      });
    }
  }
});

describe("o contrato do SVG segue valendo depois que o CSS saiu de dentro dele", () => {
  it("a folha não tem comentário nem propriedade fora de PROPRIEDADES", () => {
    // `conferirSvg` lê blocos `<style>` e custom properties, então a folha entra
    // embrulhada — é o mesmo texto que o navegador vai receber.
    expect(conferirSvg(`<svg><style>${folhaAvatar()}</style></svg>`)).toEqual([]);
  });

  it("o SVG do modo folha externa também passa", () => {
    const svg = compor({
      pele: PELE[2],
      cabelo: CABELO[0],
      modeloCabelo: "assimetrico",
      ns: "c",
      folhaExterna: true,
    });
    expect(conferirSvg(svg)).toEqual([]);
  });
});

describe("o ns continua sendo o que separa os id", () => {
  it("dois avatares com ns diferente não compartilham id", () => {
    const de = (ns: string, skin: number) =>
      compor({
        pele: PELE[skin],
        cabelo: CABELO[0],
        modeloCabelo: "coque",
        ns,
        folhaExterna: true,
      });

    const ids = (svg: string) => [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    const a = ids(de("a", 2));
    const b = ids(de("b", 6));

    expect(a.length).toBeGreaterThan(0);
    expect(a.filter((x) => b.includes(x))).toEqual([]);
    // O motivo de a unicidade importar aqui e não ser zelo: os gradientes das
    // facetas carregam o TOM DE PELE. Colididos, os dois bonecos ficam com a
    // mesma pele e nada acusa.
    expect(a.some((x) => x.endsWith("-fe"))).toBe(true);
  });

  it("os 30 do ranking emitem 30 conjuntos distintos de id", () => {
    const html = renderToStaticMarkup(ranking());
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`os ${N} do ranking com TOM emitem ${N} máscaras de id distinto`, () => {
    // O caso mais fatal da lista, e ele não pode esperar o catálogo declarar `tom`
    // para ser medido: `${ns}-tom-${slot}` colidido faz a máscara do segundo boneco
    // vestir o desenho do primeiro — o tom sai no lugar errado e nada acusa.
    //
    // Por isso a peça é sintética aqui em vez de vir de `ROSTOS`: um teste que
    // dependesse de o catálogo já ter tom estaria verde e vazio até o Bloco D.
    const comTom = (ns: string) =>
      compor({
        pele: PELE[0],
        cabelo: CABELO[0],
        modeloCabelo: "coque",
        ns,
        folhaExterna: true,
        rosto: {
          id: "zz-tom",
          nome: "Tom",
          formas: [{ d: "M10 20 L30 20 L30 40 Z", cor: "var(--av-cabelo, #262626)" }],
          tom: {
            arte: "/items/rosto/zz-tom-tom.png",
            x: 10,
            y: 20,
            w: 20,
            h: 20,
          },
        },
      });

    const svgs = Array.from({ length: N }, (_, i) => comTom(`r${i}`));
    const idsDeTom = svgs.flatMap((s) => [...s.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]));

    expect(idsDeTom).toHaveLength(N);
    expect(new Set(idsDeTom).size).toBe(N);

    // E cada um fecha com o próprio `mask="url(#…)"` — id único que não fecha é o
    // mesmo defeito com outra cara.
    for (const [i, svg] of svgs.entries()) expect(svg).toContain(`mask="url(#r${i}-tom-rosto)"`);
  });
});
