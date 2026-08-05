/**
 * ROTA B — `potrace` sobre a máscara congelada.
 *
 * ---------------------------------------------------------------------------
 * OS QUATRO PARÂMETROS, E O QUE CADA UM DECIDE NESTA ARTE
 * ---------------------------------------------------------------------------
 *
 * | parâmetro | o que faz | por que importa aqui |
 * |---|---|---|
 * | `turdSize` | descarta mancha menor que N px | a máscara tem **40 componentes**, e 39 deles somam 70 px — os borrões redondos da arte, medidos |
 * | `alphaMax` | preserva ou suaviza canto | **é o que decide se as ~12 pontas sobrevivem** |
 * | `optTolerance` | tolerância da otimização de curva | troca direta entre nº de pontos e fidelidade |
 * | `turnPolicy` | política para pixel ambíguo | determinismo entre execuções |
 *
 * **`optCurve` fica DESLIGADO por padrão, e é a escolha menos óbvia deste arquivo.**
 * A otimização de curva do `potrace` existe para produzir um SVG pequeno e bonito;
 * aqui o destino é `Cabelo.massa`, que é **lista de pontos** — a curva quem faz é o
 * `spline()` de `cabelo.ts`, depois. Otimizar aqui seria aproximar a poligonal por
 * Bézier, achatá-la de novo em `contornosDoD`, e comparar o resultado com a máscara:
 * duas aproximações empilhadas para chegar ao mesmo tipo de dado com que se começou.
 * Ligá-lo é uma linha (`optCurve=1` no comando), e o número de pontos e o desvio
 * saem lado a lado — o bloco 0 mede as duas.
 *
 * **`turdSize` é 0 por padrão, e a medição transformou isso de zelo em causa.** A
 * máscara já foi congelada com as decisões declaradas, e deixar o `potrace`
 * descartar mancha aqui seria uma quinta decisão de segmentação escondida dentro do
 * traçador, fora do hash. Isso já bastaria — mas há um número: com `turdSize=21` (o
 * `PISO_AREA` de `fonte-svg.ts` convertido para este raster) a **ponta mais alta da
 * coroa perde 15,0 unidades de topo**, porque o ápice dela é um dos borrões soltos.
 * O bico mais proeminente desta arte (104,8 u) tem a ponta **desconectada** na
 * máscara, e um `turdSize` "razoável" a decapita em silêncio.
 */

import { Potrace, type PotraceOptions } from "potrace";
import type { MascaraCongelada } from "../mascara";
import { contornosDoD, type OpcoesRota, type Rota, type Tracado } from "./rota";

/**
 * `minority` é o padrão do próprio `potrace` e o único determinístico entre
 * execuções sobre a mesma máscara — as políticas `left`/`right` também são, mas
 * enviesam o traçado para um lado em cada pixel ambíguo, e o viés se acumula ao
 * longo de um perímetro de ~2 900 px.
 */
const PADRAO: PotraceOptions = {
  turnPolicy: "minority",
  turdSize: 0,
  /**
   * 0,6 — MEDIDO, e não o padrão do `potrace` (que é 1,0).
   *
   * Varredura sobre a máscara `699cae7273236b36`, com `turdSize` 0:
   *
   * | `alphaMax` | IoU | borda baixo máx | borda cima máx | pontos | pior ponta |
   * |---|---|---|---|---|---|
   * | 1,3 | 99,25% | 20,5 u | 41,5 u | 5 335 | 0,5 u |
   * | 1,0 | 99,26% | 20,5 u | 41,5 u | 5 323 | 0,5 u |
   * | **0,6** | **99,38%** | **13,5 u** | **15,0 u** | **4 675** | **0,0 u** |
   *
   * Menos suavização de canto ganha nos três eixos ao mesmo tempo — mais fiel, com
   * menos pontos, e com as três pontas do alto batendo exatamente. É o resultado que
   * se espera de uma arte de bicos: `alphaMax` alto existe para não deixar ruído de
   * raster virar quina, e aqui a quina é a peça.
   */
  alphaMax: 0.6,
  optCurve: false,
  optTolerance: 0.2,
  threshold: 128,
  blackOnWhite: true,
};

function numero(v: unknown, padrao: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
}

export const rotaPotrace: Rota = {
  nome: "potrace",
  origem: "potrace sobre a máscara binária congelada",

  async tracar(mc: MascaraCongelada, opcoes: OpcoesRota = {}): Promise<Tracado> {
    const params: PotraceOptions = {
      ...PADRAO,
      turdSize: numero(opcoes.turdSize, PADRAO.turdSize!),
      alphaMax: numero(opcoes.alphaMax, PADRAO.alphaMax!),
      optCurve: opcoes.optCurve === undefined ? PADRAO.optCurve : Boolean(Number(opcoes.optCurve)),
      optTolerance: numero(opcoes.optTolerance, PADRAO.optTolerance!),
      turnPolicy: (opcoes.turnPolicy as PotraceOptions["turnPolicy"]) ?? PADRAO.turnPolicy,
    };

    const p = new Potrace(params);
    await new Promise<void>((ok, falhar) => {
      // O PNG da máscara, e não o PNG do gerador: o `threshold` do `potrace` sobre a
      // arte crua seria uma SEXTA decisão de segmentação, e fora do hash.
      p.loadImage(mc.png, (err) => (err ? falhar(err) : ok()));
    });

    const tag = p.getPathTag();
    const d = /d="([^"]*)"/.exec(tag)?.[1];
    if (!d) throw new Error(`potrace: o \`<path>\` devolvido não tem \`d\` — ${tag.slice(0, 120)}`);

    const contornos = contornosDoD(d, "potrace");
    const pontos = contornos.reduce((a, c) => a + c.pts.length, 0);
    const externos = contornos.filter((c) => c.area * contornos[0].area > 0).length;

    return {
      rota: "potrace",
      hashDaMascara: mc.hash,
      contornos,
      pontos,
      laudo: [
        `potrace · turdSize ${params.turdSize} · alphaMax ${params.alphaMax} · ` +
          `optCurve ${params.optCurve ? "on" : "off"} · optTolerance ${params.optTolerance} · ` +
          `turnPolicy ${params.turnPolicy}`,
        `  máscara ${mc.hash} · ${mc.w}×${mc.h} · ${mc.pixels} px`,
        `  ${contornos.length} contorno(s) · ${externos} externo(s) · ` +
          `${contornos.length - externos} buraco(s) · ${pontos} pontos`,
        `  maior contorno: ${contornos[0]?.pts.length ?? 0} pontos · ` +
          `área ${Math.abs(contornos[0]?.area ?? 0).toFixed(0)} px²`,
        `  contornos com menos de 100 px² de área: ` +
          `${contornos.filter((c) => Math.abs(c.area) < 100).length}`,
      ],
    };
  },
};
