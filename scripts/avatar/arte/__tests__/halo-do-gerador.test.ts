/**
 * O HALO DO GERADOR — sombra fraca que a extração adotava como se fosse peça.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ESTE ARQUIVO PRENDE, E ELE TEM DATA E TEM DONO
 * ---------------------------------------------------------------------------
 *
 * O `chapeu-cand-10` chegou em 2026-08-25, o Doug **aprovou no render**, e a
 * `arte:perimetro` reprovou a 78,8% — na mesma faixa das duas tocas que ele mesmo
 * tinha reprovado. Eu marquei os 632 px que reprovavam num painel e mostrei a ele.
 * A resposta dele foi o diagnóstico:
 *
 * > *"onde vc marcou em magenta, nem é parte do chapéu."*
 *
 * Ele estava certo, e o número diz por quê:
 *
 * | onde | diferença contra a base, mediana |
 * |---|---|
 * | a massa do chapéu | **223** |
 * | a borda com linha | 66 |
 * | **os 632 px que reprovavam** | **29** — o corte da extração é 24 |
 *
 * Não era desenho faltando: era o halo que o gerador pinta em volta da peça
 * passando raspando do corte, entrando na máscara, e a conectividade o adotando
 * por estar colado na peça. A régua media a silhueta do HALO e cobrava contorno
 * dele.
 *
 * ---------------------------------------------------------------------------
 * A HISTERESE, E POR QUE O BRAÇO NEGATIVO É METADE DO TESTE
 * ---------------------------------------------------------------------------
 *
 * `extrairPorCampo` passou a ter dois cortes: **forte** (`NIVEL_FORTE` = 100) entra
 * sempre; **fraco** (> `NIVEL_TRAJE` = 24) entra só se houver forte a até
 * `ALCANCE_DO_FRACO` = 3 px.
 *
 * O braço positivo é o halo largo: 12 px de tinta fraca em volta do núcleo, que
 * **tem de sair**.
 *
 * O braço negativo é o anti-aliasing: 2 px de tinta igualmente fraca, colada no
 * núcleo, que **tem de ficar**. Sem ele, uma implementação que simplesmente jogasse
 * fora todo pixel fraco passaria neste teste — e comeria a borda de toda peça do
 * projeto, que é justamente o modo de falha que o corte único de 24 existia para
 * não ter.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

import { LADO, noCampoDoChapeu, PNG_BASE } from "../base";
import { extrairPorCampo } from "../extrair";

/** Acima da coroa, onde a base é fundo puro e não há feição por perto. */
const CAIXA = { x: 380, y: 8, w: 240, h: 100 };
/** O núcleo forte, no azul instrumental do slot: difere do fundo em ~200 níveis. */
const NUCLEO = { w: 80, h: 40 };
/** O azul instrumental. Forte por qualquer corte. */
const FORTE = [0x00, 0x00, 0xc8];

/**
 * O fraco: **29 níveis** abaixo do fundo da base, que é a mediana MEDIDA no halo do
 * `chapeu-cand-10`. Não é um número escolhido para o teste passar — é o defeito.
 */
const FUNDO_DA_BASE = [251, 248, 245];
const FRACO = [FUNDO_DA_BASE[0] - 29, FUNDO_DA_BASE[1] - 29, FUNDO_DA_BASE[2] - 29];

/**
 * `largura` = quantos px de tinta FRACA cercam o núcleo.
 *  - 12 px → halo do gerador, tem de sair;
 *  -  2 px → anti-aliasing de borda, tem de ficar.
 */
function comFranja(largura: number): Buffer {
  const b = Buffer.alloc(CAIXA.w * CAIXA.h * 3);
  const cx = CAIXA.w / 2;
  const cy = CAIXA.h / 2;
  for (let y = 0; y < CAIXA.h; y++)
    for (let x = 0; x < CAIXA.w; x++) {
      const dentroNucleo = Math.abs(x - cx) < NUCLEO.w / 2 && Math.abs(y - cy) < NUCLEO.h / 2;
      const dentroFranja =
        Math.abs(x - cx) < NUCLEO.w / 2 + largura && Math.abs(y - cy) < NUCLEO.h / 2 + largura;
      const c = dentroNucleo ? FORTE : dentroFranja ? FRACO : FUNDO_DA_BASE;
      const i = (y * CAIXA.w + x) * 3;
      b[i] = c[0];
      b[i + 1] = c[1];
      b[i + 2] = c[2];
    }
  return b;
}

const pintar = (destino: string, largura: number) =>
  sharp(PNG_BASE)
    .composite([
      {
        input: comFranja(largura),
        raw: { width: CAIXA.w, height: CAIXA.h, channels: 3 },
        left: CAIXA.x,
        top: CAIXA.y,
      },
    ])
    .toFile(destino);

/** Quantos px da máscara caem FORA do núcleo forte — ou seja, quanto de franja entrou. */
function franjaNaMascara(m: Uint8Array): number {
  const cx = CAIXA.x + CAIXA.w / 2;
  const cy = CAIXA.y + CAIXA.h / 2;
  let n = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const x = i % LADO;
    const y = Math.floor(i / LADO);
    if (Math.abs(x - cx) < NUCLEO.w / 2 && Math.abs(y - cy) < NUCLEO.h / 2) continue;
    n++;
  }
  return n;
}

describe("o halo do gerador não é peça", () => {
  let tmp: string;
  let largo: string;
  let colado: string;

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), "halo-gerador-"));
    largo = join(tmp, "chapeu-zz-halo.png");
    colado = join(tmp, "chapeu-zz-serrilha.png");
    await pintar(largo, 12);
    await pintar(colado, 2);
  }, 60_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it(
    "o HALO de 12 px fica fora da máscara — o defeito do `cand-10`",
    { timeout: 60_000 },
    async () => {
      const e = await extrairPorCampo(largo, noCampoDoChapeu);
      const franja = franjaNaMascara(e.mascara);
      // O halo de 12 px em volta de um núcleo de 80×40 vale ~3 700 px. Com histerese,
      // sobrevivem só os 3 px colados no forte — ~1 500. O piso de 2 500 fica no meio,
      // longe dos dois, para o teste não virar um selo de implementação.
      expect(franja).toBeLessThan(2500);
    },
  );

  it(
    "o ANTI-ALIASING de 2 px CONTINUA na máscara — o braço que impede um corta-tudo",
    { timeout: 60_000 },
    async () => {
      const e = await extrairPorCampo(colado, noCampoDoChapeu);
      const franja = franjaNaMascara(e.mascara);
      // A serrilha de 2 px em volta de 80×40 vale ~500 px. Uma implementação que
      // jogasse fora todo pixel fraco devolveria 0 aqui, e é ela que este braço mata.
      expect(franja).toBeGreaterThan(400);
    },
  );

  it(
    "o núcleo forte entra INTEIRO nos dois casos — sem isto os dois acima passam por vacuidade",
    { timeout: 60_000 },
    async () => {
      // Contado por AUSÊNCIA, não por total: quantos px do núcleo ficaram DE FORA.
      // O total exato depende de como o `<` cai nos inteiros da borda (3 081 e não
      // 3 200), e um teste que persegue esse número vira selo de aritmética.
      for (const arq of [largo, colado]) {
        const e = await extrairPorCampo(arq, noCampoDoChapeu);
        let faltando = 0;
        const cx = CAIXA.x + CAIXA.w / 2;
        const cy = CAIXA.y + CAIXA.h / 2;
        for (let y = 0; y < LADO; y++)
          for (let x = 0; x < LADO; x++) {
            if (Math.abs(x - cx) >= NUCLEO.w / 2 - 1 || Math.abs(y - cy) >= NUCLEO.h / 2 - 1) continue;
            if (!e.mascara[y * LADO + x]) faltando++;
          }
        expect(faltando).toBe(0);
      }
    },
  );
});
