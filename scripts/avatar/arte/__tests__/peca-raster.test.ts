/**
 * O BRAÇO RASTER DA PEÇA DE COR ASSADA — e as duas coisas separadas que ele é.
 *
 * ---------------------------------------------------------------------------
 * 1. A DECISÃO (`formatoDoTraje`) — pura, e prendida sem tocar em PNG nenhum
 * ---------------------------------------------------------------------------
 *
 * `traje-farda` e `traje-gambesao` ficam no VETOR. Foram desenhadas, medidas e
 * aprovadas pelo Doug no traçado, e regerá-las gastaria o olho dele para devolver a
 * mesma peça mais leve — ganho de custo, não de qualidade. Foi a opção 3, escolhida
 * por ele em 2026-08-20.
 *
 * Isso **precisa** ser trava mecânica: `arte:trajes --check` reescreve os `.svg` mesmo
 * no modo `--check`, então uma decisão escrita só no runbook seria desfeita pelo
 * primeiro `verify:arte` de quem não a leu.
 *
 * ---------------------------------------------------------------------------
 * 2. A ESTEIRA — e a fixture NASCE AQUI, num diretório temporário
 * ---------------------------------------------------------------------------
 *
 * Duas razões, e nenhuma é preferência:
 *
 *  - **arte de verdade não pode ser usada**, porque as duas que existem são
 *    justamente as congeladas — testar com elas seria testar o caminho que este
 *    bloco decidiu não percorrer;
 *  - **`construirPeca` ESCREVE em `slot.pasta`**, e a pasta do traje é
 *    `public/items/traje/`, que vai ao deploy. Um teste que escrevesse lá sujaria o
 *    `git status` a cada rodada e, pior, poderia sobrescrever peça de produção. O
 *    slot é clonado com `pasta` apontando para o `mkdtemp`.
 *
 * A fixture segue o padrão de `fixtures.ts:196-204`: a base oficial com um retângulo
 * composto por cima, no campo do tronco.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

import { PNG_BASE } from "../base";
import { construirPeca } from "../peca-de-arte";
import { CONGELADAS_NO_VETOR, TRAJE, formatoDoTraje } from "../traje";

describe("`formatoDoTraje` — a trava do «não regenere», e ela é pura", () => {
  it("as duas aprovadas continuam no vetor", () => {
    expect(formatoDoTraje("traje-farda")).toBe("vetor");
    expect(formatoDoTraje("traje-gambesao")).toBe("vetor");
  });

  it("toda arte NOVA sai em raster", () => {
    expect(formatoDoTraje("traje-tunica-do-analista")).toBe("raster");
    expect(formatoDoTraje("traje-qualquer-coisa")).toBe("raster");
  });

  it("a lista congelada tem exatamente as duas — e nomear é a metade do ponto", () => {
    // Uma terceira entrada aqui é uma peça deixando de ganhar o tom do raster, e isso
    // é decisão do Doug, nunca conveniência de quem estiver mexendo na esteira.
    expect([...CONGELADAS_NO_VETOR].sort()).toEqual(["traje-farda", "traje-gambesao"]);
  });
});

describe("a esteira do raster, numa fixture sintética", () => {
  let tmp: string;
  let arte: string;

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), "peca-raster-"));
    arte = join(tmp, "traje-zz-fixture.png");

    // Um retângulo de cor chapada sobre o tronco: difere da base, cai no campo do
    // traje, e é grande o bastante para o traçador produzir forma no braço de
    // controle. `#B8442A` não existe na base.
    const L = 220;
    const patch = Buffer.alloc(L * L * 3);
    for (let i = 0; i < L * L; i++) {
      patch[i * 3] = 0xb8;
      patch[i * 3 + 1] = 0x44;
      patch[i * 3 + 2] = 0x2a;
    }
    await sharp(PNG_BASE)
      .composite([
        { input: patch, raw: { width: L, height: L, channels: 3 }, left: 400, top: 640 },
      ])
      .toFile(arte);
  }, 60_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("em `raster`, o `.svg` é UM `<image>` WEBP e nenhum `<path>`", { timeout: 120_000 }, async () => {
    const p = await construirPeca(arte, { ...TRAJE, pasta: tmp }, undefined, "raster");
    const svg = readFileSync(p.arte, "utf-8");

    expect(svg.match(/<image href="data:image\/webp;base64,/g) ?? []).toHaveLength(1);
    expect(svg).not.toContain("<path");

    // `formas: 0` é o DADO CERTO, não falta de dado: `<image>` não é forma, e os
    // contadores de orçamento do projeto já o excluem (`cabelo.ts`, a regex
    // `/(path|ellipse|rect|circle|use)/`).
    expect(p.formato).toBe("raster");
    expect(p.formas).toBe(0);

    // O `viewBox` é o mesmo dos dois braços — é o que mantém `colarArte()` sendo uma
    // conta só, com `k = 1` ocupando o retângulo inteiro.
    expect(svg).toContain('viewBox="0 0 600 840"');

    // E o payload decodifica como WEBP: os bytes 0–3 são "RIFF" e os 8–11, "WEBP".
    const b64 = /base64,([^"]+)"/.exec(svg)![1];
    const buf = Buffer.from(b64, "base64");
    expect(buf.subarray(0, 4).toString("latin1")).toBe("RIFF");
    expect(buf.subarray(8, 12).toString("latin1")).toBe("WEBP");
  });

  it("o controle: a MESMA fixture em `vetor` sai com `<path>` e sem `<image>`", { timeout: 120_000 }, async () => {
    // Sem este braço o teste acima passaria por vacuidade — bastaria a esteira estar
    // quebrada de um jeito que nunca produzisse path.
    const p = await construirPeca(arte, { ...TRAJE, pasta: tmp }, undefined, "vetor");
    const svg = readFileSync(p.arte, "utf-8");

    expect(svg).toContain("<path");
    expect(svg).not.toContain("<image");
    expect(p.formato).toBe("vetor");
    expect(p.formas).toBeGreaterThan(0);
  });
});
