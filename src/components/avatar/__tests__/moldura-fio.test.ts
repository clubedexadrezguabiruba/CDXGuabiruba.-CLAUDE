/**
 * O FIO DA MOLDURA — a prova de que ele chega à tela (G23)
 *
 * `verify:paleta-patentes` mede a TABELA: que o fio contrasta com o fundo e que
 * cada patente se distingue do fio. Nada nele olha o componente, e foi exatamente
 * essa distância entre régua e render que deixou o anel do Mestre invisível em
 * produção com o gate verde. Um piso medido numa constante que ninguém desenha não
 * protege nada.
 *
 * Então aqui a pergunta é outra e é a única que falta: **o `<MolduraPatente>`
 * emite as duas camadas?** Renderizado de verdade, por `react-dom/server`, e lido
 * do HTML — não por leitura do arquivo-fonte, que passaria igual se a `box-shadow`
 * fosse montada e nunca aplicada.
 *
 * Sem JSX de propósito: a suíte roda em `environment: "node"` com
 * `include: *.test.ts`, e trazer JSX para cá seria mexer na configuração da suíte
 * inteira para testar um componente.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MolduraPatente from "../MolduraPatente";
import { FIO_DA_MOLDURA, PATENTES, corDaMoldura } from "../../../../scripts/avatar/patentes";

/** O HTML de uma moldura, com um filho qualquer — o avatar não importa aqui. */
function render(tier: number | null, espessura?: number): string {
  // `children` vai DENTRO das props, e não como terceiro argumento: a interface o
  // declara obrigatório, e a sobrecarga variádica de `createElement` não o
  // satisfaz — o `tsc --noEmit` reprova.
  //
  // O `react/no-children-prop` existe para impedir `<div children={x}/>` em JSX,
  // onde há a forma óbvia de escrever. Aqui não há JSX (a suíte roda em `node`
  // com `include: *.test.ts`), e as duas regras se contradizem: obedecer o lint
  // quebra o typecheck. O typecheck ganha, e a exceção fica com o motivo escrito.
  return renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop
    createElement(MolduraPatente, {
      tier,
      ...(espessura === undefined ? {} : { espessura }),
      children: createElement("span", null, "boneco"),
    }),
  );
}

/** As camadas de `box-shadow`, na ordem em que o CSS as declara. */
function camadas(html: string): string[] {
  const m = html.match(/box-shadow:([^"]+)"/);
  if (!m) throw new Error(`sem box-shadow no HTML renderizado:\n${html}`);
  // A vírgula que separa camadas nunca aparece dentro dos valores em uso aqui
  // (hex e `rgb(… / …)` com barra), então dividir por vírgula é seguro — e o
  // `rgb(27 36 50 / 0.12)` do Aprendiz é justamente o caso que provaria o
  // contrário se alguém trocasse por `rgb(27, 36, 50, .12)`.
  return m[1].split(",").map((s) => s.trim());
}

describe("a moldura de patente desenha o fio de contorno", () => {
  it("emite DUAS camadas: o anel de patente e o fio 1 px por fora", () => {
    const cs = camadas(render(6));
    expect(cs).toHaveLength(2);
    expect(cs[0]).toBe("0 0 0 2px #AEBCCE");
    expect(cs[1]).toBe(`0 0 0 3px ${FIO_DA_MOLDURA}`);
  });

  it.each(PATENTES.map((p) => [p.patente, p.tier, p.pano] as const))(
    "%s (tier %i) mantém a própria cor no anel, e o fio é o mesmo para todos",
    (_nome, tier, pano) => {
      const cs = camadas(render(tier));
      expect(cs[0]).toContain(pano);
      expect(cs[1]).toContain(FIO_DA_MOLDURA);
    },
  );

  it("o Aprendiz também ganha o fio — senão o avatar do aluno novo teria moldura de outra espessura", () => {
    const cs = camadas(render(0));
    expect(corDaMoldura(0)).toBeNull();
    expect(cs[0]).toContain("rgb(27 36 50 / 0.12)");
    expect(cs[1]).toBe(`0 0 0 3px ${FIO_DA_MOLDURA}`);
  });

  it("o fio acompanha a espessura do anel — 3 px no palco vira fio em 4 px", () => {
    const cs = camadas(render(3, 3));
    expect(cs[0]).toBe("0 0 0 3px #3E8C81");
    expect(cs[1]).toBe(`0 0 0 4px ${FIO_DA_MOLDURA}`);
  });

  it("o fio vem por FORA: o spread da segunda camada é maior que o da primeira", () => {
    // É o que separa "fio por fora" de "fio por baixo do anel", e as duas escrevem
    // duas camadas. Sem esta conferência, inverter a ordem passaria — e na tela o
    // anel de patente cobriria o fio inteiro.
    for (const espessura of [2, 3]) {
      const [anel, fio] = camadas(render(6, espessura));
      const spread = (c: string) => Number(c.split(" ")[3].replace("px", ""));
      expect(spread(fio)).toBe(spread(anel) + 1);
    }
  });
});
