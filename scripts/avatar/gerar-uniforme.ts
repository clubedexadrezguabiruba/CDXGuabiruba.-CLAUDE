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
  paraPngAlfa,
  recortes,
  subtrair,
  type Mascara,
  type MascarasBase,
} from "./mascara-base";
import { VARIANTES, larguraDe, lerUniforme, registro, type Uniforme } from "./uniforme";

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

/** A solda que fecha fresta de antialiasing entre formas vizinhas do traço. */
const SOLDA = `stroke-width="1.6" stroke-linejoin="round"`;

const b64png = (buf: Buffer) => "data:image/png;base64," + buf.toString("base64");

/** A composição vetorial, pronta para rasterizar em qualquer tamanho. */
function composicao(u: Uniforme, m: MascarasBase): string {
  const { pano, fundo } = recortes(m);
  const dim = { w: m.w, h: m.h };
  const mask = (id: string, href: string) =>
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${BASE_W}" height="${BASE_H}" style="mask-type:alpha">` +
    `<image href="${href}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></mask>`;
  return (
    `<defs>${mask("mp", b64png(paraPngAlfa(pano, dim)))}${mask("mf", b64png(paraPngAlfa(fundo, dim)))}</defs>` +
    // FUNDO primeiro, limitado ao corpo vestido. Ver a armadilha 1.
    `<g mask="url(#mf)"><rect x="0" y="0" width="${BASE_W}" height="${BASE_H}" fill="${u.corFundo}"/></g>` +
    `<g mask="url(#mp)"><g transform="${registro(u).transform}">` +
    u.pano.map((p) => `<path fill="${p.fill}" stroke="${p.fill}" ${SOLDA} d="${p.d}"/>`).join("") +
    `</g></g>`
  );
}

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

  const nav: Browser = await chromium.launch();
  const violacoes: Violacao[] = [];
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

      const naPele = await contarContra(pg, master, m, m.peleFrente);
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
      const folgaBota = subtrair(m.cobertura, m.corpoVestido);
      const naFolga = await contarContra(pg, master, m, folgaBota);
      const pedestal = await contarCor(pg, master, m, folgaBota, u.corFundo);
      // O teto sai da MAGNITUDE do defeito, não de um número escolhido: quando o
      // pedestal existiu de verdade, o fundo cobria a folga inteira, uns 30 mil px.
      // O que passa por direito é a barra da calça, que cai nessa região e tem a
      // cor média do pano — medido, 475 px. Teto de 5 mil separa os dois por uma
      // ordem de grandeza para cada lado, e por isso não oscila.
      if (pedestal > 5000)
        violacoes.push({
          gate: "pedestal sob as botas",
          detalhe:
            `${pedestal} px da cor do fundo (${u.corFundo}) na folga da bota — ` +
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
