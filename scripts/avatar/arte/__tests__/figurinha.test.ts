/**
 * A PEÇA É FIGURINHA — opaca por dentro, decisão do Doug em 2026-08-22.
 *
 * ⚠️ **Vale para os DOIS slots que recolorem**, e não só para a barba onde o
 * defeito apareceu: a esteira é uma (`construirPecaTonal`), a base careca é a
 * mesma e o passo 2c é o mesmo. Ver `ARTES`, logo abaixo dos imports.
 *
 * O defeito que fundou este gate: a v10 da `barba-trancada` chegou ao render com o
 * traço do maxilar do boneco aparecendo DENTRO da barba. A causa não era camada nem
 * desenho: `construirRosto` reconhece a peça pelo que difere da base (> 24 por
 * canal), e onde o gerador pintou fio escuro exatamente sobre o traço PRETO da base
 * a diferença é ~0 — o pixel fica fora da máscara, o `potrace` o devolve como FURO
 * na silhueta, e pelo furo aparece o que estiver por baixo no produto: o
 * `cabeca-contorno`, a pele, e o traje que o aluno tiver vestido.
 *
 * A regra decidida: *"a barba é colada como figurinha — nada atrás dela pode ser
 * visto"*. As únicas janelas que uma peça de rosto pode manter abertas são as
 * FEIÇÕES — a espinha da boca e as cápsulas dos olhos, que são exatamente as
 * regiões que a esteira já protege no recorte do passo 2. Todo outro buraco
 * interior da máscara é a figurinha falhando em ser opaca.
 *
 * Medido na v10 antes do conserto: 4 furos fora das feições (o maior com 380 px do
 * canvas, colado no contorno do maxilar em u x 341→368 · y 341→413). Depois: 0 —
 * e a janela da boca continua aberta, porque a linha da boca é da base, nunca da
 * peça (ficha do slot, doc 24 §3: "0 px de tinta na boca, sem tolerância").
 */
import { describe, expect, it } from "vitest";

import { construirPecaTonal, type SlotTonal } from "../barba-para-formas";
import { LADO, naCapsulaDoOlho, naEspinhaDaBoca, paraUnidade } from "../base";

/**
 * AS ARTES QUE ESTE GATE ATRAVESSA — e são DUAS, nos dois slots que recolorem.
 *
 * A regra da figurinha não é da barba: é da esteira, e a esteira é uma só
 * (`construirPecaTonal`, com dois parâmetros de slot). Rodá-la só sobre a barba
 * deixaria o slot `cabelo` inteiro fora do gate justamente no bloco em que ele
 * nasceu.
 *
 * ⚠️ **`chanel.png` é FIXTURE, não peça em promoção.** É a arte do elenco VELHO — a
 * mesma que hoje vira `CABELOS.chanel` pela família traçada — e está aqui porque é
 * arte de cabelo de verdade, versionada, desenhada sobre a base oficial. Quando o
 * chanel novo for aprovado (Bloco B), esta linha troca de arquivo e o gate segue
 * medindo a mesma coisa.
 *
 * O contraste entre as duas é o que torna o teste interessante: a barba tem UMA
 * janela de feição (a boca, cuja linha é da base e nunca da peça) e o cabelo não tem
 * nenhuma — ele mora acima das feições. O gate cobra o número certo em cada caso, em
 * vez de "pelo menos uma".
 */
const ARTES: { arte: string; slot: SlotTonal; janelas: number }[] = [
  { arte: "scripts/avatar/arte/barba-trancada.png", slot: "rosto", janelas: 1 },
  { arte: "scripts/avatar/arte/chanel.png", slot: "cabelo", janelas: 0 },
];

const PECAS = await Promise.all(
  ARTES.map(async (a) => ({ ...a, p: await construirPecaTonal(a.arte, a.slot) })),
);

/**
 * Os buracos interiores da máscara, agrupados: pixel fora da peça que NÃO alcança a
 * borda do canvas sem atravessar peça. É a definição topológica de furo — a mesma
 * que o `potrace` materializa como subcaminho de furo no `d`.
 */
function buracos(m: Uint8Array) {
  const n = LADO * LADO;
  const fora = new Uint8Array(n);
  const fila: number[] = [];
  const põe = (i: number) => {
    if (!m[i] && !fora[i]) {
      fora[i] = 1;
      fila.push(i);
    }
  };
  for (let x = 0; x < LADO; x++) {
    põe(x);
    põe((LADO - 1) * LADO + x);
  }
  for (let y = 0; y < LADO; y++) {
    põe(y * LADO);
    põe(y * LADO + LADO - 1);
  }
  while (fila.length) {
    const i = fila.pop()!;
    const x = i % LADO;
    const y = (i / LADO) | 0;
    if (x > 0) põe(i - 1);
    if (x < LADO - 1) põe(i + 1);
    if (y > 0) põe(i - LADO);
    if (y < LADO - 1) põe(i + LADO);
  }

  // Agrupar o que sobrou em componentes, cada uma com a pergunta da feição já
  // respondida: ela contém pixel de espinha da boca ou de cápsula de olho?
  const visto = new Uint8Array(n);
  const comps: { px: number; temFeicao: boolean; x0: number; x1: number; y0: number; y1: number }[] = [];
  for (let i0 = 0; i0 < n; i0++) {
    if (m[i0] || fora[i0] || visto[i0]) continue;
    visto[i0] = 1;
    const pilha = [i0];
    const c = { px: 0, temFeicao: false, x0: LADO, x1: -1, y0: LADO, y1: -1 };
    while (pilha.length) {
      const i = pilha.pop()!;
      c.px++;
      const x = i % LADO;
      const y = (i / LADO) | 0;
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      const u = paraUnidade(x, y);
      if (naEspinhaDaBoca(u.x, u.y) || naCapsulaDoOlho(u.x, u.y)) c.temFeicao = true;
      for (const q of [x > 0 ? i - 1 : -1, x < LADO - 1 ? i + 1 : -1, y > 0 ? i - LADO : -1, y < LADO - 1 ? i + LADO : -1])
        if (q >= 0 && !m[q] && !fora[q] && !visto[q]) {
          visto[q] = 1;
          pilha.push(q);
        }
    }
    comps.push(c);
  }
  return comps;
}

/**
 * O piso do `potrace` (`turdSize = 50`): furo menor que isto nunca chega ao `d`,
 * então cobrá-lo aqui seria cobrar o que o render não mostra.
 */
const TURD = 50;

describe.each(PECAS)("$slot · $arte — figurinha, opaca fora das feições", ({ p, janelas }) => {
  const comps = buracos(p.mascara);
  const grandes = comps.filter((c) => c.px >= TURD);

  it("nenhum furo fora das feições sobrevive na máscara", () => {
    const ilegais = grandes.filter((c) => !c.temFeicao);
    const laudo = ilegais
      .map((c) => `  ${c.px} px · px x ${c.x0}→${c.x1} y ${c.y0}→${c.y1}`)
      .join("\n");
    expect(ilegais, `furos sem feição dentro — a figurinha está furada:\n${laudo}`).toHaveLength(0);
  });

  it("as janelas de feição são exatamente as declaradas — nem uma a mais, nem a menos", () => {
    // CONTAGEM, e não `toBeGreaterThan(0)`: a barba abre a janela da boca porque a
    // linha da boca é da base (doc 24 §3, "0 px de tinta na boca, sem tolerância"), e
    // o cabelo não abre nenhuma porque mora acima das feições. Uma janela a mais no
    // cabelo é a esteira recortando o que o desenho não pediu; uma a menos na barba é
    // a peça tapando a boca — que é o defeito que este slot mais teme.
    expect(grandes.filter((c) => c.temFeicao)).toHaveLength(janelas);
  });

  it("o `d` traçado tem os subcaminhos da figurinha: o contorno + um por janela", () => {
    // Cada `M` do `d` é um subcaminho. A figurinha certa tem 1 (contorno externo)
    // + 1 por janela de feição. Um `d` com mais subcaminhos que isso está
    // desenhando furo que nenhuma feição explica.
    const sub = (p.formas[0].d.match(/M/g) ?? []).length;
    expect(sub).toBe(1 + janelas);
  });
});
