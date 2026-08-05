/**
 * O TETO DA COMPLETUDE RASTER, CALIBRADO ONDE PODE SER — em fixture sintética.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO NA `curto-espetada`
 * ---------------------------------------------------------------------------
 *
 * Teto calibrado na peça que se quer aprovar aprova o defeito junto. Aqui o par
 * PNG/SVG é **construído**, então o buraco tem tamanho conhecido antes de ser medido,
 * e o número que sai é a resposta do gate a um defeito de tamanho declarado — e não
 * uma foto do estado atual de uma arte.
 *
 * ---------------------------------------------------------------------------
 * OS TRÊS CASOS, E O QUE CADA UM PROVA
 * ---------------------------------------------------------------------------
 *
 *  - **idêntico** — a mesma forma dos dois lados. O que sobra é a diferença entre dois
 *    rasterizadores sobre a MESMA borda, e é o piso do método. Se o teto estivesse
 *    abaixo dele, nenhuma peça passaria;
 *  - **buraco** — um pedaço da tinta declarado fora da peça. É o `cortina-solta` do
 *    plano visto pelo raster: o conversor perdeu tinta antes de o SVG existir, e a
 *    completude estrutural não tem como enxergar (origem e semântica concordam);
 *  - **rosto-e-gola** — o controle negativo. A pele do boneco marcada como peça. Sem
 *    ele, um gate de cobertura fica verde porque a FIGURA inteira está lá, e não
 *    porque a peça está.
 *
 * As formas são retângulos escritos em `C`: o repertório do conversor é `M C z`, e um
 * `L` reprovaria por comando desconhecido antes de chegar à regra que se quer testar.
 */
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { lerFontePecaOuFalhar } from "../fonte-peca";
import { BANDA, TETO_COMPLETUDE, completudeRaster } from "../importar-peca";

const dir = mkdtempSync(join(tmpdir(), "completude-"));
let n = 0;

const LADO = 256;
/** O teal que o pedido ao gerador exige, e o que `segmentarPorMatiz` procura. */
const TEAL = "#19C7C0";
const PELE = "#FED5A3";

/** Um retângulo fechado, só com `M`, `C` e `z`. */
function quad(x0: number, y0: number, x1: number, y1: number): string {
  const c = (ax: number, ay: number) => `C${ax},${ay} ${ax},${ay} ${ax},${ay}`;
  return `M${x0},${y0} ${c(x1, y0)} ${c(x1, y1)} ${c(x0, y1)} z`;
}

const svg = (corpo: string) =>
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}">${corpo}</svg>`;

/**
 * A "arte": um bloco de cabelo, um de pele, e a cabeça que serve de guia.
 *
 * A guia precisa CONTER o cabelo — `guiaChamada` não é usada aqui, mas o contrato de
 * `lerFontePecaOuFalhar` exige que ela exista e o registro do B2 já cobre isso.
 */
function fixture(opts: { buraco?: boolean; invadindo?: boolean }): { semantica: string; png: Buffer } {
  // O cabelo da ARTE: dois blocos lado a lado. Com `buraco`, só o primeiro é declarado.
  const cabeloA = quad(40, 40, 120, 200);
  const cabeloB = quad(130, 40, 210, 200);
  const pele = quad(40, 210, 210, 240);

  const declarados = [
    `<path fill="${TEAL}" opacity="1.000000" stroke="none" data-avatar-role="massa" data-avatar-paint="cabelo-s" d="${cabeloA}"/>`,
    ...(opts.buraco
      ? [`<path fill="${TEAL}" opacity="1.000000" stroke="none" data-avatar-role="descarte" data-motivo="o buraco da fixture" d="${cabeloB}"/>`]
      : [`<path fill="${TEAL}" opacity="1.000000" stroke="none" data-avatar-role="massa" data-avatar-paint="cabelo-s" d="${cabeloB}"/>`]),
    // A pele: descarte no caso normal, PEÇA no controle negativo.
    opts.invadindo
      ? `<path fill="${PELE}" opacity="1.000000" stroke="none" data-avatar-role="massa" data-avatar-paint="cabelo-s" d="${pele}"/>`
      : `<path fill="${PELE}" opacity="1.000000" stroke="none" data-avatar-role="descarte" data-motivo="pele do boneco" d="${pele}"/>`,
    `<path fill="#000000" opacity="1.000000" stroke="none" data-avatar-role="guia" data-avatar-grupo="cabeca" d="${quad(20, 20, 230, 245)}"/>`,
  ].join("");

  const p = join(dir, `f${n++}.svg`);
  writeFileSync(p, svg(declarados));

  // O PNG é a arte INTEIRA, sempre — é ele que o gate usa como referência, e o defeito
  // de cada caso mora só no que a semântica declara.
  const arte = svg(
    `<path fill="${TEAL}" d="${cabeloA}"/><path fill="${TEAL}" d="${cabeloB}"/><path fill="${PELE}" d="${pele}"/>`,
  );
  return { semantica: p, png: Buffer.from(arte) };
}

async function medir(opts: { buraco?: boolean; invadindo?: boolean }) {
  const f = fixture(opts);
  const png = await sharp(Buffer.from(f.png)).resize({ height: LADO }).png().toBuffer();
  return completudeRaster(lerFontePecaOuFalhar(f.semantica), png);
}

describe("completude raster — o teto sai da fixture, e a fixture diz o tamanho do defeito", () => {
  it("o par idêntico fica MUITO abaixo do teto — é só a borda de dois rasterizadores", async () => {
    const r = await medir({});
    expect(r.buraco).toBeLessThan(TETO_COMPLETUDE / 5);
    expect(r.invasao).toBeLessThan(TETO_COMPLETUDE / 5);
    // A borda existe e é medida: o total é maior que o buraco, e a diferença é o
    // perímetro. É por isso que o gate olha para o buraco, e não para o total.
    expect(r.soNaArte).toBeGreaterThanOrEqual(r.buraco);
  }, 30000);

  it("um bloco não declarado reprova, e por MUITO — não é questão de afinar teto", async () => {
    const r = await medir({ buraco: true });
    // Metade do cabelo da fixture. O gate não precisa de precisão para pegar isso.
    expect(r.buraco).toBeGreaterThan(0.4);
    expect(r.buraco).toBeGreaterThan(TETO_COMPLETUDE * 20);
  }, 30000);

  it("rosto-e-gola: a pele declarada como peça reprova pelo controle negativo", async () => {
    const r = await medir({ invadindo: true });
    // A cobertura do cabelo continua perfeita — é exatamente esse o engano que o
    // controle negativo existe para desfazer.
    expect(r.buraco).toBeLessThan(TETO_COMPLETUDE);
    expect(r.invasao).toBeGreaterThan(TETO_COMPLETUDE * 10);
  }, 30000);

  it("a banda de borda é menor que o menor defeito que a fixture consegue esconder", () => {
    // 5 px contra um bloco de 80×160. Uma banda da ordem do defeito seria um teto
    // disfarçado de tolerância.
    expect(BANDA).toBeLessThan(80 / 4);
  });
});
