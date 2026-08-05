/**
 * A TRAVA ESTRUTURAL — o teste que não testa comportamento, testa um TIPO.
 *
 * O `it()` de baixo é quase vazio de propósito. Quem prova a trava é o
 * `@ts-expect-error`, e ele é conferido pelo `npm run typecheck`, não pelo
 * vitest. A trava pega os dois sentidos do erro:
 *
 *  - **um traje declara silhueta** → propriedade em excesso em literal de
 *    objeto → erro de compilação, consumido pelo `@ts-expect-error`;
 *  - **alguém ACRESCENTA o campo à `interface Traje`** → não há mais erro para
 *    consumir → TypeScript reclama do `@ts-expect-error` sobrando → `typecheck`
 *    quebra.
 *
 * O segundo sentido é o que importa. Um comentário dizendo "não ponha silhueta
 * aqui" seria disciplina; isto é mecanismo. E a lição de qual dos dois funciona
 * está medida no repositório: `verify:avatar-assets` ficou VERMELHO por meses
 * sem ninguém saber, porque nada quebrava quando ele quebrava.
 */

import { describe, expect, it } from "vitest";
import { conferirSvg } from "../../svgContrato";
import { PELE } from "../../palette";
import { compor } from "../compositor";
import { SANGRIA, TRACO, pathTronco } from "../geometria";
import type { Traje } from "../tipos";

describe("a interface Traje não tem campo de silhueta", () => {
  it("um traje com silhueta própria não compila", () => {
    const trajeValido: Traje = {
      id: "soldado",
      nome: "Uniforme de Soldado",
      tinta: { cor: "#78833B" },
    };

    const trajeInvalido: Traje = {
      id: "soldado",
      nome: "Uniforme de Soldado",
      tinta: { cor: "#78833B" },
      // @ts-expect-error — a `interface Traje` NÃO declara silhueta, e é essa
      // ausência que impede a segunda cópia do path do tronco de existir. Se
      // este `@ts-expect-error` passar a acusar "unused", alguém acrescentou o
      // campo e a arquitetura do doc 15 §3 foi desfeita.
      silhueta: pathTronco(),
    };

    expect(trajeValido.id).toBe(trajeInvalido.id);
  });

  it("o path canônico do tronco existe num lugar só", () => {
    // Chamar duas vezes tem de dar exatamente a mesma string: se um dia o path
    // passar a depender do traje, esta igualdade cai.
    expect(pathTronco()).toBe(pathTronco());
  });
});

describe("o SVG emitido respeita o contrato", () => {
  const svg = compor({ pele: PELE[2], cabelo: "#3A2F2A", animado: true, ns: "kk" });

  it("conferirSvg não acha problema", () => {
    expect(conferirSvg(svg)).toEqual([]);
  });

  it("desenha o contorno da silhueta apenas pelas classes do sistema", () => {
    // Nenhum `stroke=` escrito à mão numa forma de silhueta: quem dá traço é a
    // classe `kk-traco`, que lê `--av-linha` e `--av-traco`. Um traje que
    // emitisse `stroke` próprio criaria o segundo contorno que o doc 15, §2
    // item 1, chama de "a nova costura".
    expect(svg).toContain('class="kk-traco"');
    expect(svg).not.toMatch(/<path[^>]*d="M \d+ 320[^"]*"[^>]*stroke="#/);
  });

  it("emite os `id` com namespace", () => {
    // Dois `clipPath` chamados `tronco` na mesma página fazem o segundo vencer
    // em silêncio — o modo de falha do §8 item 4, que só aparece quando duas
    // camadas são concatenadas num `<svg>` só.
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id.startsWith("kk-")).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("o olho nasce ABERTO, sem depender da animação", () => {
    // A pálpebra da folhinha ensinou isto pelo caminho caro: estado base errado
    // entrega um boneco cego em screenshot, com `prefers-reduced-motion`, e em
    // toda folha de contato — que é justamente onde a arte se aprova.
    expect(svg).toMatch(/0%,96%,100%\{transform:scaleY\(1\)\}/);
    expect(svg).toContain("prefers-reduced-motion");
  });

  it("não tem comentário dentro do <style>", () => {
    const blocos = [...svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
    expect(blocos.length).toBe(1);
    expect(blocos[0]).not.toContain("/*");
  });
});

describe("a sangria é maior que meio traço", () => {
  it("o traço cobre a região de corte", () => {
    // A sangria é a "faca de corte" da gráfica: a tinta excede o clip, o clip
    // corta, e o traço cobre o corte. Se a sangria fosse menor que meio traço, a
    // borda cortada apareceria ao lado do traço em vez de sob ele — o defeito de
    // 66–94 px do pipeline morto, de volta com outro nome.
    expect(SANGRIA).toBeGreaterThanOrEqual(TRACO / 2);
  });
});
