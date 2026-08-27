/**
 * FURO CERCADO — a peça é figurinha, e figurinha é opaca por dentro.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ESTE ARQUIVO PRENDE, E ELE TEM DATA
 * ---------------------------------------------------------------------------
 *
 * A `chapeu-toca-de-cozinha` chegou em 2026-08-25 com a copa pintada de BRANCO. O
 * fundo da base é bege quase branco, e a extração é diferença contra a base com
 * corte em 24 níveis:
 *
 * | | |
 * |---|---|
 * | a copa | `rgb(240,245,249)` |
 * | o fundo atrás dela | `rgb(251,248,245)` |
 * | diferença mediana | **11** |
 *
 * **40 238 px — 34,2% da peça — não entraram na máscara**, e o `.svg` saiu vazado.
 * Ninguém viu, porque o fundo da PÁGINA é do mesmo bege que aparecia pelo vão.
 * Renderizado sobre magenta, 22 905 px do casco continuavam magenta.
 *
 * ---------------------------------------------------------------------------
 * A FIXTURE REPRODUZ ISSO NA FORMA PURA — E O CONTROLE É METADE DO TESTE
 * ---------------------------------------------------------------------------
 *
 * Um anel escuro com o miolo pintado numa cor a **6 níveis** do fundo: o anel entra
 * na máscara, o miolo não, e o miolo fica cercado. É a toca sem mais nada junto.
 *
 * E o braço negativo, que é o que impede este teste de aprovar um tapa-tudo: o
 * MESMO anel com uma **fenda** num lado. O miolo passa a alcançar a borda do canvas,
 * deixa de ser cercado, e tem de continuar aberto. Sem ele, uma implementação que
 * preenchesse todo vazio passaria — e comeria a fresta entre o braço e o tronco de
 * uma túnica.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

import { LADO, PNG_BASE, noCampoDoChapeu, paraUnidade } from "../base";
import { CHAPEU, tintaDoChapeu } from "../chapeu";
import { extrairPorCampo } from "../extrair";
import { construirPeca, taparFurosCercados } from "../peca-de-arte";

/** O anel mora ACIMA da coroa, onde a base é fundo puro e sem feição por perto. */
const CAIXA = { x: 400, y: 10, w: 300, h: 80 };
const PAREDE = 10;
const MIOLO = { w: CAIXA.w - 2 * PAREDE, h: CAIXA.h - 2 * PAREDE };

/**
 * O miolo, a 6 níveis do fundo `rgb(251,248,245)` — bem abaixo do corte de 24.
 * É a toca: tinta que existe no arquivo e a régua não vê.
 */
const INVISIVEL = [245, 243, 240];
/** A parede, no azul instrumental do slot. Difere do fundo em 200 níveis. */
const PAREDE_COR = [0x00, 0x00, 0xc8];

function anel(comFenda: boolean): Buffer {
  const b = Buffer.alloc(CAIXA.w * CAIXA.h * 3);
  for (let y = 0; y < CAIXA.h; y++)
    for (let x = 0; x < CAIXA.w; x++) {
      const naParede = x < PAREDE || x >= CAIXA.w - PAREDE || y < PAREDE || y >= CAIXA.h - PAREDE;
      // A FENDA: um corte na parede de baixo, no meio. Ela liga o miolo ao lado de
      // fora, e é o que faz o braço negativo ser negativo.
      const naFenda =
        comFenda && y >= CAIXA.h - PAREDE && x > CAIXA.w / 2 - 20 && x < CAIXA.w / 2 + 20;
      const c = naParede && !naFenda ? PAREDE_COR : INVISIVEL;
      const i = (y * CAIXA.w + x) * 3;
      b[i] = c[0];
      b[i + 1] = c[1];
      b[i + 2] = c[2];
    }
  return b;
}

const pintar = (destino: string, comFenda: boolean) =>
  sharp(PNG_BASE)
    .composite([
      {
        input: anel(comFenda),
        raw: { width: CAIXA.w, height: CAIXA.h, channels: 3 },
        left: CAIXA.x,
        top: CAIXA.y,
      },
    ])
    .toFile(destino);

/** Varredura do lado de FORA: o vazio conexo à borda do canvas. */
function marcarFora(m: Uint8Array, w: number, h: number): Uint8Array {
  const fora = new Uint8Array(m.length);
  const pilha: number[] = [];
  const empilhar = (i: number) => {
    if (!m[i] && !fora[i]) {
      fora[i] = 1;
      pilha.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    empilhar(x);
    empilhar((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    empilhar(y * w);
    empilhar(y * w + w - 1);
  }
  while (pilha.length) {
    const i = pilha.pop() as number;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) empilhar(i - 1);
    if (x < w - 1) empilhar(i + 1);
    if (y > 0) empilhar(i - w);
    if (y < h - 1) empilhar(i + w);
  }
  return fora;
}

/** Quantos px de vazio NÃO alcançam a borda do canvas — os furos que sobraram. */
function furosQueSobraram(m: Uint8Array, w = LADO, h = LADO): number {
  const fora = marcarFora(m, w, h);
  let n = 0;
  for (let i = 0; i < m.length; i++) if (!m[i] && !fora[i]) n++;
  return n;
}

const noCampo = (i: number) => {
  const u = paraUnidade(i % LADO, Math.floor(i / LADO));
  return noCampoDoChapeu(u.x, u.y);
};

describe("furo cercado: a peça é figurinha, opaca por dentro", () => {
  let tmp: string;
  let fechado: string;
  let comFenda: string;

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), "furo-cercado-"));
    fechado = join(tmp, "chapeu-zz-anel.png");
    comFenda = join(tmp, "chapeu-zz-fenda.png");
    await pintar(fechado, false);
    await pintar(comFenda, true);
  }, 60_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("a tinta invisível VIRA furo na extração — é o defeito, e ele existe", { timeout: 60_000 }, async () => {
    // Sem esta asserção o teste seguinte poderia passar por vacuidade: se a extração
    // enxergasse o miolo, não haveria furo para tapar e o tapa-furo nunca rodaria.
    const e = await extrairPorCampo(fechado, noCampoDoChapeu);
    expect(furosQueSobraram(e.mascara)).toBeGreaterThan(MIOLO.w * MIOLO.h * 0.9);
  });

  it("`taparFurosCercados` tapa o miolo — e devolve quantos", { timeout: 60_000 }, async () => {
    const e = await extrairPorCampo(fechado, noCampoDoChapeu);
    const tapados = taparFurosCercados(e.mascara, LADO, LADO, noCampo);

    expect(tapados).toBeGreaterThan(MIOLO.w * MIOLO.h * 0.9);
    expect(furosQueSobraram(e.mascara)).toBe(0);
  });

  it("O CONTROLE: com uma FENDA na parede, o miolo continua aberto", { timeout: 60_000 }, async () => {
    // Vazio que alcança o lado de fora não é furo — é fresta desenhada, e tapá-la
    // seria a esteira inventando peça. É este braço que impede o tapa-tudo.
    const e = await extrairPorCampo(comFenda, noCampoDoChapeu);
    expect(furosQueSobraram(e.mascara)).toBe(0);
    expect(taparFurosCercados(e.mascara, LADO, LADO, noCampo)).toBe(0);
  });

  it("na esteira inteira, a peça sai OPACA e o número aparece no relatório", { timeout: 120_000 }, async () => {
    const p = await construirPeca(fechado, { ...CHAPEU, pasta: tmp }, tintaDoChapeu, "raster");

    // O número não é decorativo: remendo em silêncio é tão ruim quanto descarte em
    // silêncio, e é a coisa que esta rota inteira existe para não deixar acontecer.
    expect(p.furosTapados).toBeGreaterThan(MIOLO.w * MIOLO.h * 0.9);

    // E a peça no disco não deixa passar o que está atrás: nenhum pixel transparente
    // cercado por pixel opaco no recorte que virou `<image>`.
    const { data, info } = await sharp(p.raster)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const opaco = new Uint8Array(info.width * info.height);
    for (let i = 0; i < opaco.length; i++) opaco[i] = data[i * 4 + 3] > 0 ? 1 : 0;

    expect(furosQueSobraram(opaco, info.width, info.height)).toBe(0);
  });
});
