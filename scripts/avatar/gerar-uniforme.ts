/**
 * Assa um UNIFORME vestível a partir da arte vetorizada. `npm run avatar:garment`
 *
 * O PROBLEMA: a arte vem de geração por IA, e nenhum gerador reproduz a silhueta
 * da base. Duas ilustrações independentes do mesmo personagem divergem — medido,
 * de 8 a 52 unidades conforme a altura, o que nenhuma transformação afim corrige.
 *
 * A SAÍDA foi inverter quem manda: a silhueta pertence ao SISTEMA. O uniforme é
 * recortado pelas máscaras derivadas da base, então ele pode ser grande demais.
 * Sobra se remove por máscara; falta exigiria inventar desenho.
 *
 * A PILHA em runtime é `<use>` da base com o macacão escondido, mais UM `<image>`.
 * Zero máscara, zero filtro: máscara é ferramenta de build.
 *
 * O TRUQUE que dispensa uma terceira camada: o asset sai com BURACO onde ficam
 * cabeça e mãos. A base está por baixo e aparece por ali sozinha, então gola e
 * punho passam por baixo da pele sem costura.
 *
 * AS ARMADILHAS desta fase, todas medidas:
 *
 *  1. As máscaras de PANO e de FUNDO não podem ser a mesma. Com uma só, o fundo
 *     escorre para a folga da bota e o boneco ganha um pedestal verde.
 *  2. Cada variante é rasterizada DIRETO do vetor. Reduzir a de 1920 em cascata
 *     acumula perda e rasteriza a solda errado nos tamanhos pequenos.
 *  3. Peso de arquivo não é memória: 1278×1920 são 265 KB comprimidos e **9,36
 *     MiB decodificados**. Trinta uniformes distintos chegariam a 281 MiB. É por
 *     isso que existem cinco variantes.
 *  4. RGB residual em pixel transparente pode virar halo em interpolação
 *     não-pré-multiplicada. A cor é sangrada para fora da borda por precaução —
 *     o Chromium compõe pré-multiplicado e não precisaria, mas outros consumidores
 *     podem não fazer isso, e custa nada.
 *
 * O CONTORNO ESCURO da arte é PRESERVADO, por decisão do usuário: removê-lo
 * algoritmicamente arriscaria apagar sombra e separação interna legítimas, e o
 * teste no tamanho mínimo mostrou que ele continua legível.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chromium, type Browser, type Page } from "@playwright/test";
import {
  BASE_H,
  BASE_W,
  area,
  derivarMascaras,
  dilatar,
  faixa,
  intersecao,
  paraPngAlfa,
  recortes,
  subtrair,
  type Mascara,
  type MascarasBase,
} from "./mascara-base";
import { VARIANTES, corDominante, larguraDe, lerUniforme, registro } from "./uniforme";
import { SENTINELA, composicao } from "./composicao";
import { distancia } from "../../src/lib/avatar/palette";

/**
 * A fonte é COMMITADA, como a da base.
 *
 * O Desktop do usuário é onde a arte é trabalhada; o repositório é onde a peça
 * aprovada entra. Caminho absoluto aqui tornaria o gerador — e qualquer gate sobre
 * ele — impossível de rodar em máquina limpa ou em CI, e nesta sessão isso já
 * quebrou uma vez, quando o PNG mestre saiu da pasta de downloads.
 */
const FONTE = process.env.UNIFORME ?? "scripts/avatar/fonte/uniformes/recruta.svg";
const NOME = process.env.UNIFORME_NOME ?? "recruta";

/**
 * Pasta de ESTÁGIO, não `public/items/`.
 *
 * `verify:avatar-assets` reprova arquivo órfão — asset que nenhum item
 * referencia. A linha do uniforme em `items` só nasce no Bloco 7b, então publicar
 * agora quebraria aquele gate. Sai daqui quando o item existir.
 */
const DESTINO = "scripts/avatar/uniformes";
const DIAG = ".scratch/uniforme";

/** Teto de memória decodificada da variante do ranking, com 30 na tela. */
const TETO_RANKING_MIB = 4;

async function rasterizar(pg: Page, dentro: string, altura: number): Promise<Buffer> {
  const largura = larguraDe(altura);
  await pg.setViewportSize({ width: largura, height: altura });
  await pg.setContent(
    `<body style="margin:0;background:transparent">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${BASE_W} ${BASE_H}">${dentro}</svg>` +
      `</body>`,
  );
  return pg.screenshot({ omitBackground: true });
}

export interface Metrica {
  altura: number;
  largura: number;
  bytes: number;
  bytesDecodificado: number;
  pctTransparente: number;
  caixaAlfa: [number, number, number, number];
  centro: [number, number];
}

/**
 * Sangra a cor para fora da borda e mede.
 *
 * Sem função nomeada dentro do `evaluate`: o esbuild do tsx as envolve num helper
 * (`__name`) que não existe no navegador, e o `evaluate` morre com
 * `__name is not defined`.
 */
async function sangrarEMedir(pg: Page, png: Buffer, altura: number, raio = 3) {
  return pg.evaluate(
    async ([b64, raio]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + (b64 as string);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const im = cx.getImageData(0, 0, c.width, c.height);
      const d = im.data;
      const W = c.width;
      const H = c.height;

      for (let passo = 0; passo < (raio as number); passo++) {
        const copia = new Uint8ClampedArray(d);
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            if (copia[i + 3] > 8) continue;
            let r = 0, g = 0, b = 0, n = 0;
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const yy = y + dy, xx = x + dx;
                if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
                const j = (yy * W + xx) * 4;
                if (copia[j + 3] <= 8 && !(copia[j] || copia[j + 1] || copia[j + 2])) continue;
                r += copia[j]; g += copia[j + 1]; b += copia[j + 2]; n++;
              }
            if (!n) continue;
            // o alfa NÃO muda: a sangria é só de cor
            d[i] = Math.round(r / n);
            d[i + 1] = Math.round(g / n);
            d[i + 2] = Math.round(b / n);
          }
      }
      cx.putImageData(im, 0, 0);

      let transp = 0;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (d[(y * W + x) * 4 + 3] < 8) transp++;
          else {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      return {
        png: c.toDataURL("image/png").split(",")[1],
        largura: W,
        pctTransparente: Number(((transp / (W * H)) * 100).toFixed(1)),
        caixaAlfa: [x0, y0, x1, y1] as [number, number, number, number],
        centro: [Number(((x0 + x1) / 2 / W).toFixed(4)), Number(((y0 + y1) / 2 / H).toFixed(4))] as [number, number],
      };
    },
    [png.toString("base64"), raio] as [string, number],
  );
}

/**
 * Conta pixels opacos do asset que caem FORA de uma máscara, e dentro de outra.
 *
 * É a base de três gates: nada de alfa fora da cobertura, cabeça e mãos vazadas,
 * e nenhum fundo na folga da bota.
 */
async function contarContra(
  pg: Page,
  asset: Buffer,
  m: MascarasBase,
  mascara: Mascara,
): Promise<{ dentro: number; fora: number }> {
  return pg.evaluate(
    async ([b64, mask, mw, mh]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + (b64 as string);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const W = c.width, H = c.height;
      const M = mask as number[];
      let dentro = 0, fora = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (d[(y * W + x) * 4 + 3] <= 24) continue;
          const mx = Math.min((mw as number) - 1, Math.floor((x / W) * (mw as number)));
          const my = Math.min((mh as number) - 1, Math.floor((y / H) * (mh as number)));
          if (M[my * (mw as number) + mx]) dentro++;
          else fora++;
        }
      return { dentro, fora };
    },
    [asset.toString("base64"), Array.from(mascara), m.w, m.h] as [string, number[], number, number],
  );
}

/**
 * Conta pixels de uma COR específica dentro de uma máscara.
 *
 * O fundo de segurança é um retângulo de cor chapada, então é reconhecível por
 * igualdade quase exata. A arte do pano, mesmo em oliva, tem sombreado e não bate.
 */
async function contarCor(
  pg: Page,
  asset: Buffer,
  m: MascarasBase,
  mascara: Mascara,
  hex: string,
): Promise<number> {
  const alvo = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return pg.evaluate(
    async ([b64, mask, mw, mh, cor]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + (b64 as string);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const W = c.width, H = c.height;
      const M = mask as number[];
      const A = cor as number[];
      let n = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (d[i + 3] <= 24) continue;
          const mx = Math.min((mw as number) - 1, Math.floor((x / W) * (mw as number)));
          const my = Math.min((mh as number) - 1, Math.floor((y / H) * (mh as number)));
          if (!M[my * (mw as number) + mx]) continue;
          if (Math.abs(d[i] - A[0]) <= 4 && Math.abs(d[i + 1] - A[1]) <= 4 && Math.abs(d[i + 2] - A[2]) <= 4) n++;
        }
      return n;
    },
    [asset.toString("base64"), Array.from(mascara), m.w, m.h, alvo] as [string, number[], number, number, number[]],
  );
}

/**
 * O gate da BORDA, em espaço pré-multiplicado.
 *
 * O QUE ELE NÃO OLHA: pixel totalmente transparente. Alfa zero com RGB escuro é
 * inofensivo em composição pré-multiplicada, e medir o quadro inteiro dá 99% de
 * "RGB escuro" contando o fundo vazio — que é 85% da imagem e nunca se mistura
 * com nada. Foi o meu primeiro gate, e ele media o fenômeno errado.
 *
 * O QUE ELE OLHA: a faixa de TRANSIÇÃO, 8 < alfa < 255. Para cada pixel dela,
 * acha a cor de referência nos vizinhos OPACOS — que é a cor que aquele ponto da
 * borda deveria ter — e compara em pré-multiplicado.
 *
 * POR QUE PRÉ-MULTIPLICADO: comparar RGB desassociado com alfa baixo é instável,
 * porque diferenças pequenas viram números enormes ao dividir por alfa. Em
 * pré-multiplicado a diferença é ponderada pelo alfa, então um pixel de alfa 10
 * pesa 10/255 do que um de alfa 250.
 *
 * POR QUE O CONTORNO ESCURO PASSA: onde a arte tem contorno preto, os vizinhos
 * opacos também são escuros, então a referência é escura e a diferença é zero. O
 * gate reprova halo — borda muito mais escura que o interior correspondente — e
 * não estilo.
 */
async function conferirBorda(pg: Page, asset: Buffer) {
  return pg.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, c.width, c.height).data;
    const W = c.width, H = c.height;
    let n = 0, somaDif = 0, piores = 0, semReferencia = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const a = d[i + 3];
        if (a <= 8 || a === 255) continue;
        // referência: média dos vizinhos OPACOS, preferindo para dentro da forma
        let r = 0, g = 0, b = 0, k = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
            const j = (yy * W + xx) * 4;
            if (d[j + 3] < 200) continue;
            r += d[j]; g += d[j + 1]; b += d[j + 2]; k++;
          }
        n++;
        if (!k) { semReferencia++; continue; }
        r /= k; g /= k; b /= k;
        // pré-multiplicado: a diferença é ponderada pelo alfa do próprio pixel
        const p = a / 255;
        const dif = (Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b)) / 3 * p;
        somaDif += dif;
        if (dif > 40) piores++;
      }
    return {
      transicao: n,
      semReferencia,
      difMedia: n ? Number((somaDif / n).toFixed(2)) : 0,
      pctPiores: n ? Number(((piores / n) * 100).toFixed(2)) : 0,
    };
  }, asset.toString("base64"));
}

/**
 * A FOLHA VISUAL. É o que o gate não pega: gates provam estrutura, não leitura.
 *
 * Os quatro fundos existem porque cada um revela um defeito diferente. Claro
 * esconde buraco, porque a pele e o creme são claros. Magenta revela buraco.
 * Escuro revela halo claro. Quadriculado revela alfa parcial, que os outros três
 * escondem.
 */
async function folhaVisual(pg: Page, folha: string, assetPorAltura: Map<number, string>) {
  const XADREZ =
    "background-image:linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)," +
    "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%);" +
    "background-size:16px 16px;background-position:0 0,8px 8px;background-color:#fff";
  const USO = `<use href="#avatar-base-neutro" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>`;
  const semUniforme = USO;
  const comUniforme = (altura: number) =>
    USO + `<image href="${assetPorAltura.get(altura)}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>`;

  /**
   * A REGRA QUE ESCONDE O MACACÃO PRECISA DE ESCOPO, e descobri isso aqui.
   *
   * `<style>` dentro de um `<svg>` inline num documento HTML é de escopo do
   * DOCUMENTO, não do SVG. Sem a classe de ancestral, a regra de um avatar
   * vestido escapa e esconde o macacão de TODOS os avatares da página —
   * inclusive dos alunos sem uniforme. Numa lista de turma isso desnudaria a
   * turma inteira porque um aluno tem uniforme.
   *
   * Vale para o Bloco 5: a composição não pode emitir regra sem escopo.
   */
  const ESCOPO = `<style>.vestido .av-roupa,.vestido .av-forro-roupa{display:none}</style>`;

  const cena = (dentro: string, h: number, fundo: string, vb = `0 0 ${BASE_W} ${BASE_H}`, vestido = true) => {
    const [, , w0, h0] = vb.split(" ").map(Number);
    const estilo = fundo === "xadrez" ? XADREZ : `background:${fundo}`;
    return (
      `<svg class="${vestido ? "vestido" : ""}" width="${Math.round((h * w0) / h0)}" height="${h}" viewBox="${vb}" ` +
      `style="--av-pele:#E9B183;--av-cabelo:#3A2F2A;${estilo}">${dentro}</svg>`
    );
  };
  const fig = (rot: string, dentro: string) =>
    `<figure style="margin:0;text-align:center">${dentro}` +
    `<figcaption style="font:11px system-ui;color:#666">${rot}</figcaption></figure>`;
  // O de 56 px é RASTERIZADO no tamanho real e só depois ampliado como imagem,
  // com pixel visível: é o pixel que o aluno vê. Ampliar o SVG com `transform`
  // não serve — ele redesenha em vetor no tamanho grande e mente sobre a leitura.
  const alturaSm = 70;
  const larguraSm = Math.round((alturaSm * BASE_W) / BASE_H);
  const tiros = new Map<string, string>();
  for (const fundo of ["#EFEAE2", "#FF00FF", "#1B1B1F", "xadrez"]) {
    await pg.setViewportSize({ width: larguraSm, height: alturaSm });
    await pg.setContent(
      `<body style="margin:0">` +
        `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
        ESCOPO +
        cena(comUniforme(128), alturaSm, fundo) +
        `</body>`,
    );
    tiros.set(fundo, (await pg.screenshot()).toString("base64"));
  }
  const px56 = (fundo: string) =>
    `<img src="data:image/png;base64,${tiros.get(fundo)}" width="${larguraSm * 5}" height="${alturaSm * 5}" ` +
    `style="image-rendering:pixelated;border:1px solid #ddd">`;

  await pg.setViewportSize({ width: 1480, height: 1180 });
  await pg.setContent(
    `<body style="margin:0;background:#fff;padding:14px;font:12px system-ui;color:#555">` +
      `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>${ESCOPO}` +
      `<p style="margin:0 0 6px"><b>425 px — os quatro fundos.</b> Claro esconde buraco; magenta revela; ` +
      `escuro revela halo claro; xadrez revela alfa parcial.</p>` +
      `<div style="display:flex;gap:10px">` +
      ["#EFEAE2", "#FF00FF", "#1B1B1F", "xadrez"]
        .map((f) => fig(f === "xadrez" ? "quadriculado" : f, cena(comUniforme(1024), 425, f)))
        .join("") +
      fig("sem uniforme", cena(semUniforme, 425, "#EFEAE2", undefined, false)) +
      `</div>` +
      `<p style="margin:14px 0 6px"><b>56 px, ampliado 5×</b> — o tamanho que manda</p>` +
      `<div style="display:flex;gap:10px">` +
      ["#EFEAE2", "#FF00FF", "#1B1B1F", "xadrez"].map((f) => fig(f === "xadrez" ? "quadriculado" : f, px56(f))).join("") +
      `</div>` +
      `<p style="margin:14px 0 6px"><b>As fronteiras de perto</b>, sobre magenta</p>` +
      `<div style="display:flex;gap:10px">` +
      (
        [
          ["gola", "950 1420 700 700"],
          ["punho e mão", "500 2150 620 620"],
          ["ombro e braço", "700 1500 900 900"],
          ["bota e tornozelo", "820 3000 900 700"],
        ] as [string, string][]
      )
        .map(([rot, vb]) => fig(rot, cena(comUniforme(1920), 300, "#FF00FF", vb)))
        .join("") +
      `</div></body>`,
  );
  await pg.screenshot({ path: `${DIAG}/folha.png` });
}

/**
 * BENCHMARK com 30 assets DISTINTOS.
 *
 * Repetir o mesmo PNG trinta vezes mediria cache: o navegador compartilha o
 * bitmap decodificado de uma URL só, e o resultado sairia otimista e não
 * representaria uma turma com uniformes diferentes. Aqui cada avatar recebe um
 * asset próprio, gerado com matiz rodado — trinta bitmaps de verdade.
 */
async function benchmark(pg: Page, folha: string, dentro: string, quantos = 30) {
  const distintos: string[] = [];
  for (let i = 0; i < quantos; i++) {
    const giro = Math.round((360 / quantos) * i);
    const comGiro =
      `<defs><filter id="g" color-interpolation-filters="sRGB">` +
      `<feColorMatrix type="hueRotate" values="${giro}"/></filter></defs>` +
      `<g filter="url(#g)">${dentro}</g>`;
    distintos.push(b64png(await rasterizar(pg, comGiro, 128)));
  }
  const USO = `<use href="#avatar-base-neutro" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>`;
  const um = (asset: string) =>
    `<svg width="${larguraDe(128)}" height="128" viewBox="0 0 ${BASE_W} ${BASE_H}" ` +
    `class="vestido" style="--av-pele:#E9B183;--av-cabelo:#3A2F2A">` +
    `${USO}<image href="${asset}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></svg>`;

  const medir = async (assets: string[], rotulo: string) => {
    await pg.setViewportSize({ width: 1200, height: 700 });
    const t0 = Date.now();
    await pg.setContent(
      `<body style="margin:0;display:flex;flex-wrap:wrap;gap:2px"><style>.vestido .av-roupa,.vestido .av-forro-roupa{display:none}</style>` +
        `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
        assets.map(um).join("") +
        `</body>`,
    );
    await pg.evaluate(
      () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(null)))),
    );
    const ms = Date.now() - t0;
    const distintasUrls = new Set(assets).size;
    const bytes = distintasUrls * larguraDe(128) * 128 * 4;
    console.log(
      `  ${rotulo}: ${ms} ms · ${distintasUrls} bitmaps distintos · ${(bytes / 1048576).toFixed(2)} MiB decodificados`,
    );
    return ms;
  };

  console.log(`\nbenchmark com ${quantos} avatares:`);
  const msIguais = await medir(new Array(quantos).fill(distintos[0]), "o MESMO asset 30 vezes (mede cache)");
  const msDistintos = await medir(distintos, "30 assets DISTINTOS (mede o caso real)");
  return { msIguais, msDistintos, bitmapMiB: (quantos * larguraDe(128) * 128 * 4) / 1048576 };
}

/**
 * Conta pixels de uma máscara onde o asset está TRANSPARENTE.
 *
 * É o gate do pé aparecendo por baixo da bota, e ele é o INVERSO do gate do
 * pedestal. O pedestal era fundo verde invadindo a folga da bota; aqui a folga
 * fica transparente e deixa a pele da base aparecer sob a sola. Um não pega o
 * outro, e a folha visual achou este quando os gates diziam que estava tudo bem.
 */
async function contarVazado(pg: Page, asset: Buffer, m: MascarasBase, mascara: Mascara): Promise<number> {
  return pg.evaluate(
    async ([b64, mask, mw, mh]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + (b64 as string);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const W = c.width, H = c.height;
      const M = mask as number[];
      let n = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const mx = Math.min((mw as number) - 1, Math.floor((x / W) * (mw as number)));
          const my = Math.min((mh as number) - 1, Math.floor((y / H) * (mh as number)));
          if (!M[my * (mw as number) + mx]) continue;
          // alfa baixo = a base aparece por ali
          if (d[(y * W + x) * 4 + 3] < 128) n++;
        }
      return n;
    },
    [asset.toString("base64"), Array.from(mascara), m.w, m.h] as [string, number[], number, number],
  );
}

interface Violacao {
  gate: string;
  detalhe: string;
}

async function main() {
  if (!existsSync(FONTE))
    throw new Error(
      `arte do uniforme não encontrada:\n  ${FONTE}\n` +
        `Passe outra com UNIFORME=caminho/para.svg npm run avatar:garment`,
    );
  mkdirSync(DESTINO, { recursive: true });
  mkdirSync(DIAG, { recursive: true });

  const u = lerUniforme(readFileSync(FONTE, "utf-8"));
  const r = registro(u);
  console.log(`fonte ${FONTE}`);
  console.log(`  ${u.canvas[0]}×${u.canvas[1]} · ${u.arte.length} formas, ${u.pano.length} de pano`);
  console.log(`  pescoço y=${u.pescoco} · cor de fundo ${u.corFundo}`);
  console.log(
    `  registro ${r.escX.toFixed(4)}×${r.escY.toFixed(4)} ` +
      `(anisotropia ${(((r.escY / r.escX) - 1) * 100).toFixed(1)}%), deslocamento (${r.dx.toFixed(0)}, ${r.dy.toFixed(0)})`,
  );

  const violacoes: Violacao[] = [];

  // FUNDO DE SEGURANÇA REPRESENTATIVO. Ele existe para ser invisível atrás da
  // arte, então precisa ser a cor que a peça realmente veste. Quando não é, ele
  // vira ORLA visível em toda a silhueta — medido no Aspirante: 5647 px da cor
  // do fundo encostando na borda transparente, contra 7513 de 213422 (3,5%) no
  // Recruta, que está certo.
  //
  // O teto de 40 é a mesma distância que a paleta usa para "contorno e
  // preenchimento não se fundem", e o vão medido é de uma ordem de grandeza para
  // cada lado: Recruta 7,7 · Aspirante 133,2.
  const dominante = corDominante(u.pano);
  const distFundo = distancia(u.corFundo, dominante);
  console.log(`  cor dominante do pano ${dominante} · fundo dista ${distFundo.toFixed(1)} dela`);
  if (distFundo > 40)
    violacoes.push({
      gate: "fundo de segurança representativo",
      detalhe:
        `o fundo (${u.corFundo}) dista ${distFundo.toFixed(1)} da cor dominante do pano (${dominante}), teto 40 — ` +
        `ele vai aparecer como orla na silhueta inteira. A cor média pegou a peça errada.`,
    });

  const nav: Browser = await chromium.launch();
  try {
    const m = await derivarMascaras(nav);
    const { pano: recortePano, fundo: recorteFundo } = recortes(m);
    console.log(`máscaras ${m.w}×${m.h}: pano ${area(recortePano)} px · fundo ${area(recorteFundo)} px`);

    if (area(recortePano) <= area(recorteFundo))
      violacoes.push({
        gate: "máscaras distintas",
        detalhe: "a máscara do pano tem de ser MAIOR que a do fundo — ver a armadilha 1",
      });

    const dentro = composicao(u, m);
    const pg = await nav.newPage();
    const metricas: Metrica[] = [];
    let master: Buffer | null = null;
    try {
      for (const altura of VARIANTES) {
        const cru = await rasterizar(pg, dentro, altura);
        const s = await sangrarEMedir(pg, cru, altura);
        const buf = Buffer.from(s.png, "base64");
        writeFileSync(`${DESTINO}/${NOME}-${altura}.png`, buf);
        if (altura === 1920) master = buf;
        metricas.push({
          altura,
          largura: s.largura,
          bytes: buf.length,
          bytesDecodificado: s.largura * altura * 4,
          pctTransparente: s.pctTransparente,
          caixaAlfa: s.caixaAlfa,
          centro: s.centro,
        });
      }

      console.log("\nvariante   dimensão      comprimido   decodificado   transparente");
      for (const x of metricas)
        console.log(
          `${String(x.altura).padStart(5)} px   ${String(x.largura).padStart(4)}×${String(x.altura).padEnd(5)}` +
            `  ${(x.bytes / 1024).toFixed(0).padStart(7)} KB   ${(x.bytesDecodificado / 1048576).toFixed(2).padStart(8)} MiB` +
            `   ${String(x.pctTransparente).padStart(6)}%`,
        );

      // ---- GATES ESTRUTURAIS, todos sem julgamento visual --------------------
      if (!master) throw new Error("variante de 1920 não foi gerada");

      const fora = await contarContra(pg, master, m, m.cobertura);
      const pctFora = (fora.fora / (fora.dentro + fora.fora)) * 100;
      if (pctFora > 0.5)
        violacoes.push({
          gate: "alfa fora da cobertura",
          detalhe: `${fora.fora} px opacos fora da máscara (${pctFora.toFixed(2)}%) — o recorte não está sendo aplicado`,
        });

      // A PELE QUE PRECISA FICAR LIVRE é a que NÃO está sob roupa: rosto, orelhas
      // e as mãos de verdade. `peleFrente` inteira inclui a costura em que a pele
      // passa por baixo da gola e do punho — 2851 px que o macacão cobre por
      // direito, e que o fundo de segurança agora pinta de propósito. Medir a
      // `peleFrente` inteira contava essa costura e dava 0,91% num boneco de
      // rosto perfeitamente limpo.
      const peleDescoberta = subtrair(m.peleFrente, m.corpoVestido);
      const naPele = await contarContra(pg, master, m, peleDescoberta);
      const pctNaPele = (naPele.dentro / (naPele.dentro + naPele.fora)) * 100;
      if (pctNaPele > 0.5)
        violacoes.push({
          gate: "cabeça e mãos vazadas",
          detalhe: `${naPele.dentro} px opacos sobre a região de pele (${pctNaPele.toFixed(2)}%) — o buraco não foi aberto`,
        });

      // PEDESTAL: na folga da bota — a região da cobertura que NÃO é corpo
      // vestido — só o PANO pode estar. Fundo de segurança ali é o bloco verde
      // sob os pés, e CONTAR PIXELS NÃO BASTA: a bota ocupa essa região por
      // direito. O que denuncia o defeito é a cor ser a do fundo, que é chapada.
      // SÓ A FAIXA DA BOTA. `cobertura − corpoVestido` é o anel inteiro em volta
      // do corpo, e o pedestal é um defeito do pé para baixo. Medir o anel todo
      // fazia a sangria de 1 px do fundo — ~4 mil px de perímetro, invisível e de
      // propósito — comer quase todo o teto de 5 mil, deixando o gate a um passo
      // de reprovar um boneco limpo.
      const folgaBota = faixa(
        subtrair(m.cobertura, m.corpoVestido),
        { w: m.w, h: m.h },
        m.marcos.yBota,
        m.h - 1,
      );
      const naFolga = await contarContra(pg, master, m, folgaBota);
      // O PEDESTAL É MEDIDO NA COMPOSIÇÃO SENTINELA, não por cor no asset final.
      //
      // Contar "pixels da cor do fundo" só funcionava enquanto a cor do fundo era
      // uma média que não batia com nenhuma forma da arte. Desde que ela passou a
      // ser a cor DOMINANTE do pano, a barra da calça — que ocupa a folga da bota
      // por direito — casa com ela dentro dos ±4 e é contada: 475 px viraram 5385
      // sem nenhum defeito novo, e o gate reprovaria um boneco limpo.
      //
      // Com a sentinela não há colisão possível: o fundo é a única coisa amarela
      // na composição, e o que se conta é a CAMADA, não uma coincidência de cor.
      const sentinelaPng = await rasterizar(pg, composicao(u, m, true), 1920);
      const pedestal = await contarCor(pg, sentinelaPng, m, folgaBota, SENTINELA.fundo);
      // O teto sai da MAGNITUDE do defeito, não de um número escolhido: quando o
      // pedestal existiu de verdade, o fundo cobria a folga inteira, uns 30 mil px.
      // O que passa por direito é a barra da calça, que cai nessa região e tem a
      // cor média do pano — medido, 475 px. Teto de 5 mil separa os dois por uma
      // ordem de grandeza para cada lado, e por isso não oscila.
      if (pedestal > 5000)
        violacoes.push({
          gate: "pedestal sob as botas",
          detalhe:
            `${pedestal} px da CAMADA de fundo na folga da bota (medido na sentinela) — ` +
            `o fundo escorreu para fora do corpo vestido. As duas máscaras de recorte viraram uma?`,
        });
      console.log(
        `\ngates: fora da cobertura ${fora.fora} px (${pctFora.toFixed(2)}%) · ` +
          `sobre a pele ${naPele.dentro} px (${pctNaPele.toFixed(2)}%) · ` +
          `na folga da bota ${naFolga.dentro} px, dos quais ${pedestal} da cor do fundo`,
      );

      // Caixa e centro iguais entre variantes, tolerância de 1 px.
      const ref = metricas[metricas.length - 1];
      for (const x of metricas) {
        const k = x.altura / ref.altura;
        const desvioCaixa = Math.max(...x.caixaAlfa.map((v, i) => Math.abs(v - ref.caixaAlfa[i] * k)));
        const desvioCentro = Math.max(
          Math.abs((x.centro[0] - ref.centro[0]) * x.largura),
          Math.abs((x.centro[1] - ref.centro[1]) * x.altura),
        );
        if (desvioCaixa > 1.01 || desvioCentro > 1.01)
          violacoes.push({
            gate: "caixa e centro entre variantes",
            detalhe: `variante ${x.altura}: caixa desvia ${desvioCaixa.toFixed(1)} px, centro ${desvioCentro.toFixed(2)} px`,
          });
      }

      // Memória do ranking.
      const daRanking = metricas.find((x) => x.altura === 128)!;
      const mib30 = (daRanking.bytesDecodificado * 30) / 1048576;
      console.log(`  30 avatares com a variante de 128: ${mib30.toFixed(2)} MiB de bitmap`);
      if (mib30 > TETO_RANKING_MIB)
        violacoes.push({
          gate: "memória do ranking",
          detalhe: `${mib30.toFixed(1)} MiB para 30 avatares, teto ${TETO_RANKING_MIB} MiB`,
        });

      // PÉ VISÍVEL POR BAIXO DA BOTA. Uniforme com bota tem de ocluir o pé
      // inteiro: a máscara do pé, dentro do envelope da bota, não pode ter um
      // pixel transparente no asset. Tolerância zero — não é questão de grau.
      const peNoEnvelope = intersecao(m.pes, m.cobertura);
      const peVisivel = await contarVazado(pg, master, m, peNoEnvelope);
      console.log(`  pé sob a bota: ${peVisivel} px transparentes de ${area(peNoEnvelope)} na região`);
      if (peVisivel > 0)
        violacoes.push({
          gate: "pé visível sob a bota",
          detalhe:
            `${peVisivel} px da pele do pé aparecem por baixo da sola. ` +
            `A oclusão do pé não está cobrindo — e NÃO se conserta preenchendo a folga da bota ` +
            `com a cor média, que recriaria o pedestal verde.`,
        });

      // Borda em pré-multiplicado, na variante grande e na do ranking.
      for (const altura of [1920, 128]) {
        const buf = readFileSync(`${DESTINO}/${NOME}-${altura}.png`);
        const b = await conferirBorda(pg, buf);
        console.log(
          `  borda ${altura} px: ${b.transicao} px de transição · diferença média ${b.difMedia} · ` +
            `acima de 40: ${b.pctPiores}%${b.semReferencia ? ` · sem referência: ${b.semReferencia}` : ""}`,
        );
        if (b.pctPiores > 2)
          violacoes.push({
            gate: "halo na borda",
            detalhe:
              `variante ${altura}: ${b.pctPiores}% dos pixels de transição divergem mais de 40 ` +
              `(pré-multiplicado) da cor dos vizinhos opacos`,
          });
      }
      // Folha visual e benchmark. Não são gates: a folha é para o olho, e o
      // benchmark é número que a gente compara entre rodadas.
      const folhaBase = readFileSync("public/items/base/avatar-base-neutro.svg", "utf-8");
      const porAltura = new Map<number, string>(
        VARIANTES.map((h) => [h, b64png(readFileSync(`${DESTINO}/${NOME}-${h}.png`))]),
      );
      await folhaVisual(pg, folhaBase, porAltura);
      const bench = await benchmark(pg, folhaBase, dentro);
      writeFileSync(`${DIAG}/benchmark.json`, JSON.stringify(bench, null, 2));
      console.log(`  ${DIAG}/folha.png`);
    } finally {
      await pg.close();
    }

    writeFileSync(`${DIAG}/metricas.json`, JSON.stringify(metricas, null, 2));
  } finally {
    await nav.close();
  }

  if (violacoes.length) {
    console.error(`\n${violacoes.length} GATE(S) REPROVADO(S):`);
    for (const v of violacoes) console.error(`  - ${v.gate}: ${v.detalhe}`);
    process.exit(1);
  }
  console.log(`\ntodos os gates passaram · ${DESTINO}/ · ${DIAG}/metricas.json`);
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
