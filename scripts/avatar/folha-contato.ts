/**
 * A FOLHA DE CONTATO — todas as peças, num quadro só. `npm run avatar:folha`
 *
 * POR QUE ELA EXISTE, e por que a folha do gerador não bastava: `avatar:garment`
 * escreve `.scratch/uniforme/folha.png` e a **sobrescreve a cada execução**.
 * Comparar duas peças exigia rodar, guardar o arquivo à mão, rodar de novo e
 * abrir os dois — e comparar de memória, entre duas abas, é como se aprova um
 * defeito que só aparece lado a lado.
 *
 * O QUE ELA MOSTRA, e nada aqui é escolhido a olho:
 *
 *  1. os quatro fundos, todas as peças, no tamanho em que o defeito é visível;
 *  2. os 56 px, que é o tamanho que MANDA na leitura;
 *  3. cada close derivado, com **antes e depois** — o recorte de `6e3feb6` ao
 *     lado do canônico, sobre a MESMA base, para o antes/depois isolar o recorte
 *     e não misturar duas mudanças;
 *  4. a tabela de diff numérico por região, porque nenhuma afirmação sobre
 *     imagem vale sem o número ao lado.
 *
 * A base das seções 3 e 4 é a base COM macacão, de propósito. É a única em que o
 * recorte legado tem o que vazar, e comparar o legado sobre a base com traje
 * contra o canônico sobre a base sem traje mediria as duas correções ao mesmo
 * tempo, sem saber qual delas fez o quê.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chromium, type Browser, type Page } from "@playwright/test";
import {
  BASE_H,
  BASE_W,
  closes,
  derivarMascaras,
  dilatar,
  erodir,
  recortesFundoNaMao,
  recortesLegado,
  subtrair,
  type Close,
  type MascarasBase,
} from "./mascara-base";
import { SENTINELA, composicao } from "./composicao";
import { larguraDe, lerUniforme } from "./uniforme";
import { SENTINELA_BASE, baseSentinela } from "./sentinela";
import { PATENTES, caminhoSvg, type Patente } from "./patentes";
import { ID_SEM_TRAJE, SAIDA } from "./gerar-base-sem-traje";

const DIAG = ".scratch/uniforme";
const FOLHA = `${DIAG}/folha-contato.png`;
const BASE_SVG = "public/items/base/avatar-base-neutro.svg";

/** Altura de análise das medições. A mesma do gate de proveniência. */
const ALTURA = 1920;

const FUNDOS = ["#EFEAE2", "#FF00FF", "#1B1B1F", "xadrez"] as const;
const XADREZ =
  "background-image:linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)," +
  "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%);" +
  "background-size:16px 16px;background-position:0 0,8px 8px;background-color:#fff";

interface Peca {
  patente: Patente;
  /** Composição canônica, rasterizada em `ALTURA`. Data URI. */
  canonico: string;
  /** A mesma peça pelo recorte de `6e3feb6`. Data URI. */
  legado: string;
  /**
   * A PILHA sentinela: base com macacão repintada mais o asset sentinela por
   * cima. É onde o resíduo se mede — no asset isolado o vermelho de `av-roupa`
   * não existe, porque ele vem da BASE, e medir ali daria 0 para tudo, inclusive
   * para o recorte que sabidamente vaza.
   */
  empilhadoOk: string;
  /** A mesma pilha, com o recorte de `6e3feb6`. Base COM macacão. */
  empilhadoLegado: string;
  /**
   * A pilha com o recorte de `1403143`, sobre a base SEM traje.
   *
   * É o defeito OPOSTO: o fundo chapado do uniforme por cima da mão. Vive na base
   * de produção, onde não há macacão para confundir a leitura.
   */
  empilhadoFundoNaMao: string;
  /** A pilha de PRODUÇÃO: base sem traje mais o asset canônico, em cor real. */
  producao: string;
  /** A variante pequena, no tamanho real. Data URI. */
  pequeno: string;
}

/**
 * A pilha de runtime achatada num PNG: `<use>` da base mais o asset.
 *
 * Achatar é o que deixa o mesmo quadro ser recortado em qualquer `viewBox`
 * depois, sem re-renderizar a base cinco vezes por close.
 */
async function empilhar(
  pg: Page,
  folha: string,
  asset: string,
  sentinela = true,
): Promise<string> {
  const largura = larguraDe(ALTURA);
  await pg.setViewportSize({ width: largura, height: ALTURA });
  await pg.setContent(
    `<body style="margin:0">` +
      `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${ALTURA}" ` +
      `viewBox="0 0 ${BASE_W} ${BASE_H}" ` +
      `style="--av-pele:${sentinela ? SENTINELA_BASE["av-pele"] : "#E9B183"};--av-cabelo:#3A2F2A">` +
      `<use href="#avatar-base-neutro" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` +
      `<image href="${asset}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` +
      `</svg></body>`,
  );
  return "data:image/png;base64," + (await pg.screenshot({ omitBackground: true })).toString("base64");
}

async function rasterizar(pg: Page, dentro: string, altura: number): Promise<string> {
  const largura = larguraDe(altura);
  await pg.setViewportSize({ width: largura, height: altura });
  await pg.setContent(
    `<body style="margin:0;background:transparent">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" ` +
      `viewBox="0 0 ${BASE_W} ${BASE_H}">${dentro}</svg></body>`,
  );
  return "data:image/png;base64," + (await pg.screenshot({ omitBackground: true })).toString("base64");
}

/**
 * Conta pixels de uma cor exata DENTRO de cada caixa, e os pixels diferentes
 * entre duas imagens na mesma caixa.
 *
 * As caixas chegam em unidades do canvas da base e são convertidas pela razão da
 * própria imagem — nenhuma constante de escala escrita à mão.
 */
async function medirEmCaixas(
  pg: Page,
  a: string,
  b: string | null,
  caixas: [number, number, number, number][],
  cor: string,
  /**
   * Restringe a contagem a uma região. É OBRIGATÓRIO para as duas cores desta
   * folha, e por motivos opostos: o `av-roupa` só é defeito FORA da pele própria
   * (dentro dela é o buraco de desenho, e a base de produção não tem macacão), e
   * o fundo do uniforme só é defeito DENTRO dela (fora, ele preenche a região
   * vestida por direito e a caixa inteira sairia amarela).
   */
  mascara?: { m: number[]; mw: number; mh: number },
) {
  return pg.evaluate(
    async ([uriA, uriB, cxs, hex, baseW, baseH, msk]) => {
      // SEM FUNÇÃO NOMEADA AQUI DENTRO, nem `const ler = () => …`: o esbuild do
      // tsx envolve toda função nomeada num helper `__name` que não existe no
      // navegador, e o `evaluate` morre com `__name is not defined`. A leitura
      // das duas imagens fica repetida de propósito.
      const imA = new Image();
      imA.src = uriA as string;
      await imA.decode();
      const cA = document.createElement("canvas");
      cA.width = imA.width;
      cA.height = imA.height;
      const ctxA = cA.getContext("2d", { willReadFrequently: true })!;
      ctxA.drawImage(imA, 0, 0);
      const A = { d: ctxA.getImageData(0, 0, cA.width, cA.height).data, W: cA.width, H: cA.height };

      let B: { d: Uint8ClampedArray; W: number; H: number } | null = null;
      if (uriB) {
        const imB = new Image();
        imB.src = uriB as string;
        await imB.decode();
        const cB = document.createElement("canvas");
        cB.width = imB.width;
        cB.height = imB.height;
        const ctxB = cB.getContext("2d", { willReadFrequently: true })!;
        ctxB.drawImage(imB, 0, 0);
        B = { d: ctxB.getImageData(0, 0, cB.width, cB.height).data, W: cB.width, H: cB.height };
      }
      const alvo = [1, 3, 5].map((i) => parseInt((hex as string).slice(i, i + 2), 16));
      const kx = A.W / (baseW as number);
      const ky = A.H / (baseH as number);
      const M = msk as { m: number[]; mw: number; mh: number } | undefined;
      return (cxs as number[][]).map((caixa) => {
        const x0 = Math.max(0, Math.round(caixa[0] * kx));
        const y0 = Math.max(0, Math.round(caixa[1] * ky));
        const x1 = Math.min(A.W - 1, Math.round((caixa[0] + caixa[2]) * kx));
        const y1 = Math.min(A.H - 1, Math.round((caixa[1] + caixa[3]) * ky));
        let daCor = 0, diferentes = 0, total = 0;
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x++) {
            const i = (y * A.W + x) * 4;
            total++;
            // O mesmo mapeamento imagem→máscara de `classificar`.
            const dentro =
              !M ||
              M.m[
                Math.min(M.mh - 1, Math.floor((y / A.H) * M.mh)) * M.mw +
                  Math.min(M.mw - 1, Math.floor((x / A.W) * M.mw))
              ] === 1;
            if (
              dentro &&
              A.d[i + 3] > 0 &&
              Math.abs(A.d[i] - alvo[0]) + Math.abs(A.d[i + 1] - alvo[1]) + Math.abs(A.d[i + 2] - alvo[2]) < 31
            )
              daCor++;
            if (B && (B.W !== A.W || B.H !== A.H)) continue;
            if (
              B &&
              (Math.abs(A.d[i] - B.d[i]) > 8 ||
                Math.abs(A.d[i + 1] - B.d[i + 1]) > 8 ||
                Math.abs(A.d[i + 2] - B.d[i + 2]) > 8 ||
                Math.abs(A.d[i + 3] - B.d[i + 3]) > 8)
            )
              diferentes++;
          }
        return { daCor, diferentes, total };
      });
    },
    [a, b, caixas.map((c) => [...c]), cor, BASE_W, BASE_H, mascara ?? null] as [
      string,
      string | null,
      number[][],
      string,
      number,
      number,
      { m: number[]; mw: number; mh: number } | null,
    ],
  );
}

/** `viewBox` "x y w h" como números. */
const numerosDe = (vb: string): [number, number, number, number] =>
  vb.split(" ").map(Number) as [number, number, number, number];

async function assar(
  pg: Page,
  m: MascarasBase,
  patente: Patente,
  folhaSentinela: string,
  folhaProducao: string,
): Promise<Peca> {
  const u = lerUniforme(readFileSync(caminhoSvg(patente), "utf-8"));
  const sentOk = await rasterizar(pg, composicao(u, m, { sentinela: true }), ALTURA);
  const sentLegado = await rasterizar(
    pg,
    composicao(u, m, { sentinela: true, recortes: recortesLegado }),
    ALTURA,
  );
  const sentFundoNaMao = await rasterizar(
    pg,
    composicao(u, m, { sentinela: true, recortes: recortesFundoNaMao }),
    ALTURA,
  );
  const canonico = await rasterizar(pg, composicao(u, m), ALTURA);
  return {
    patente,
    canonico,
    legado: await rasterizar(pg, composicao(u, m, { recortes: recortesLegado }), ALTURA),
    empilhadoOk: await empilhar(pg, folhaSentinela, sentOk),
    empilhadoLegado: await empilhar(pg, folhaSentinela, sentLegado),
    empilhadoFundoNaMao: await empilhar(pg, baseSentinela(folhaProducao), sentFundoNaMao),
    producao: await empilhar(pg, folhaProducao, canonico, false),
    pequeno: await rasterizar(pg, composicao(u, m), 128),
  };
}

async function main() {
  mkdirSync(DIAG, { recursive: true });
  const disponiveis = PATENTES.filter((p) => existsSync(caminhoSvg(p)));
  if (!disponiveis.length) throw new Error("nenhuma arte de uniforme encontrada");
  console.log(`peças com arte: ${disponiveis.map((p) => p.patente).join(", ")}`);
  console.log(`sem arte ainda: ${PATENTES.filter((p) => !existsSync(caminhoSvg(p))).map((p) => p.patente).join(", ") || "—"}`);

  const nav: Browser = await chromium.launch();
  try {
    const m = await derivarMascaras(nav);
    const recortesDeClose = closes(m);
    const pg = await nav.newPage();

    // AS DUAS BASES. A sem traje é a de produção; a com macacão é a única em que
    // o recorte legado tem o que vazar, e é a das seções de close.
    const semTraje = readFileSync(SAIDA, "utf-8").replace(new RegExp(ID_SEM_TRAJE, "g"), "avatar-base-neutro");
    const comTraje = readFileSync(BASE_SVG, "utf-8");

    const pecas: Peca[] = [];
    for (const p of disponiveis) pecas.push(await assar(pg, m, p, baseSentinela(comTraje), semTraje));

    console.log(`\nclosses derivados (nenhum número escrito à mão):`);
    for (const c of recortesDeClose) console.log(`  ${c.rotulo.padEnd(14)} "${c.vb}"   ← ${c.origem}`);

    // ---------------------------------------------------------------------
    // 4.3 — o diff numérico por região
    // ---------------------------------------------------------------------
    const caixas = recortesDeClose.map((c) => numerosDe(c.vb));
    const vermelho = SENTINELA_BASE["av-roupa"];
    const dim = { w: m.w, h: m.h };

    // AS DUAS REGIÕES, e são complementares de propósito. `av-roupa` só é defeito
    // FORA da pele própria — dentro dela é o buraco de desenho, e a base de
    // produção não tem macacão. O fundo do uniforme só é defeito DENTRO dela.
    // A assimetria de raio é a de sempre: o que exclui é generoso, o que testa é
    // estrito.
    const cheia = new Uint8Array(m.w * m.h).fill(1);
    const foraDaPele = {
      m: Array.from(subtrair(cheia, dilatar(m.peleExposta, dim, 1))),
      mw: m.w,
      mh: m.h,
    };
    const naPele = { m: Array.from(erodir(m.peleExposta, dim, 1)), mw: m.w, mh: m.h };

    console.log(`\nRESÍDUO POR REGIÃO — as duas direções, e cada uma com a sua máscara`);
    const residuo: Record<
      string,
      { legado: number; canonico: number; naMao: number; canonicoPele: number }[]
    > = {};
    for (const p of pecas) {
      const legado = await medirEmCaixas(pg, p.empilhadoLegado, null, caixas, vermelho, foraDaPele);
      const ok = await medirEmCaixas(pg, p.empilhadoOk, null, caixas, vermelho, foraDaPele);
      const naMao = await medirEmCaixas(pg, p.empilhadoFundoNaMao, null, caixas, SENTINELA.fundo, naPele);
      const okPele = await medirEmCaixas(pg, p.empilhadoOk, null, caixas, SENTINELA.fundo, naPele);
      recortesDeClose.forEach((c, i) => {
        (residuo[c.rotulo] ??= []).push({
          legado: legado[i].daCor,
          canonico: ok[i].daCor,
          naMao: naMao[i].daCor,
          canonicoPele: okPele[i].daCor,
        });
      });
    }
    for (const p of pecas.keys()) {
      console.log(`\n  ${pecas[p].patente.patente}`);
      console.log(`  região           base vazando (fora da pele)   fundo sobre a pele`);
      for (const c of recortesDeClose) {
        const r = residuo[c.rotulo][p];
        console.log(
          `  ${c.rotulo.padEnd(14)} ${String(r.legado).padStart(8)} → ${String(r.canonico).padStart(4)}` +
            `           ${String(r.naMao).padStart(8)} → ${String(r.canonicoPele).padStart(4)}`,
        );
      }
    }

    // Diferença ENTRE AS PEÇAS, por região. Duas artes distintas na mesma máscara
    // têm de divergir: se uma região der 0, as duas peças são a mesma imagem ali,
    // e o close não está olhando para o uniforme.
    let entrePecas: { rotulo: string; dif: number; total: number }[] = [];
    if (pecas.length >= 2) {
      const d = await medirEmCaixas(pg, pecas[0].canonico, pecas[1].canonico, caixas, vermelho);
      entrePecas = recortesDeClose.map((c, i) => ({ rotulo: c.rotulo, dif: d[i].diferentes, total: d[i].total }));
      console.log(`\nDIFERENÇA ENTRE ${pecas[0].patente.patente.toUpperCase()} E ${pecas[1].patente.patente.toUpperCase()}, por região`);
      for (const e of entrePecas)
        console.log(
          `  ${e.rotulo.padEnd(14)} ${String(e.dif).padStart(7)} px de ${String(e.total).padStart(7)} ` +
            `(${((e.dif / e.total) * 100).toFixed(1)}%)`,
        );
    }

    // ---------------------------------------------------------------------
    // A folha
    // ---------------------------------------------------------------------
    const cena = (
      base: string,
      asset: string,
      h: number,
      fundo: string,
      vb = `0 0 ${BASE_W} ${BASE_H}`,
    ) => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      const estilo = fundo === "xadrez" ? XADREZ : `background:${fundo}`;
      return (
        `<svg width="${Math.round((h * w0) / h0)}" height="${h}" viewBox="${vb}" ` +
        `style="--av-pele:#E9B183;--av-cabelo:#3A2F2A;${estilo}">` +
        `<use href="#${base}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` +
        (asset ? `<image href="${asset}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` : "") +
        `</svg>`
      );
    };
    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:2px">${rot}</figcaption></figure>`;
    const titulo = (t: string, sub = "") =>
      `<p style="margin:16px 0 6px;font:13px system-ui"><b>${t}</b>` +
      (sub ? ` <span style="color:#888;font-weight:400">— ${sub}</span>` : "") +
      `</p>`;

    // Só a base de PRODUÇÃO entra na página. Os closes já vêm achatados em PNG,
    // com a base que cada um precisa assada dentro.
    const defs = `<div aria-hidden style="position:absolute;width:0;height:0">${semTraje}</div>`;

    const secaoFundos = FUNDOS.map((f) =>
      fig(
        f === "xadrez" ? "quadriculado" : f,
        `<div style="display:flex;gap:4px">` +
          pecas.map((p) => cena("avatar-base-neutro", p.canonico, 300, f)).join("") +
          `</div>`,
      ),
    ).join("");

    const secaoPequeno = pecas
      .map((p) =>
        fig(
          `${p.patente.patente} · 128 px ampliado 4×`,
          `<img src="${p.pequeno}" width="${larguraDe(128) * 4}" height="${128 * 4}" ` +
            `style="image-rendering:pixelated;border:1px solid #ddd;background:#EFEAE2">`,
        ),
      )
      .join("");

    /** Um quadro já achatado, recortado num `viewBox` de close. */
    const recorte = (uri: string, h: number, vb: string, fundo = "#FF00FF") => {
      const [, , w0, h0] = vb.split(" ").map(Number);
      const estilo = fundo === "xadrez" ? XADREZ : `background:${fundo}`;
      return (
        `<svg width="${Math.round((h * w0) / h0)}" height="${h}" viewBox="${vb}" style="${estilo}">` +
        `<image href="${uri}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></svg>`
      );
    };

    /**
     * CADA CLOSE EM TRÊS COLUNAS POR PEÇA, e a do meio é a que prova.
     *
     * Nas cores reais o legado e o canônico são quase indistinguíveis — o macacão
     * da base é bege `#c9bfa8` e some contra o oliva. Foi assim que "não mudou
     * nada" virou "está consertado" nesta fase. Na sentinela o macacão é vermelho
     * puro, e os 437 px da gola deixam de ser uma alegação.
     */
    const secaoCloses = recortesDeClose
      .map(
        (c) =>
          `<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:12px">` +
          `<div style="width:132px;font:11px system-ui;color:#555;padding-top:50px">` +
          `<b>${c.rotulo}</b><br><span style="color:#999">${c.origem}</span></div>` +
          pecas
            .map((p, i) => {
              const r = residuo[c.rotulo][i];
              const cor = (n: number) => (n ? "#b00" : "#0a0");
              return (
                `<div style="border:1px solid #eee;padding:4px;border-radius:3px">` +
                `<div style="font:11px system-ui;color:#333;margin-bottom:2px"><b>${p.patente.patente}</b> &nbsp;` +
                `base <span style="color:#b00">${r.legado}</span>→` +
                `<b style="color:${cor(r.canonico)}">${r.canonico}</b> &nbsp;·&nbsp; ` +
                `fundo na pele <span style="color:#b00">${r.naMao}</span>→` +
                `<b style="color:${cor(r.canonicoPele)}">${r.canonicoPele}</b></div>` +
                `<div style="display:flex;gap:4px">` +
                fig("base vaza · 6e3feb6", recorte(p.empilhadoLegado, 150, c.vb)) +
                fig("fundo na mão · 1403143", recorte(p.empilhadoFundoNaMao, 150, c.vb)) +
                fig("canônico · prova", recorte(p.empilhadoOk, 150, c.vb)) +
                fig("canônico · real", recorte(p.producao, 150, c.vb, "xadrez")) +
                `</div></div>`
              );
            })
            .join("") +
          `</div>`,
      )
      .join("");

    const tabela =
      `<table style="border-collapse:collapse;font:11px system-ui;color:#444">` +
      `<tr style="background:#f4f4f4"><th style="padding:3px 8px;text-align:left">região</th>` +
      pecas
        .map(
          (p) =>
            `<th style="padding:3px 8px">${p.patente.patente}<br>` +
            `<span style="font-weight:400;color:#888">base fora da pele</span></th>` +
            `<th style="padding:3px 8px">${p.patente.patente}<br>` +
            `<span style="font-weight:400;color:#888">fundo sobre a pele</span></th>`,
        )
        .join("") +
      (entrePecas.length ? `<th style="padding:3px 8px">diferença entre as peças</th>` : "") +
      `</tr>` +
      recortesDeClose
        .map((c, i) => {
          const e = entrePecas[i];
          const cel = (antes: number, depois: number) =>
            `<td style="padding:3px 8px;text-align:center">${antes} → ` +
            `<b style="color:${depois ? "#b00" : "#0a0"}">${depois}</b></td>`;
          return (
            `<tr style="border-top:1px solid #e4e4e4"><td style="padding:3px 8px"><b>${c.rotulo}</b></td>` +
            residuo[c.rotulo].map((r) => cel(r.legado, r.canonico) + cel(r.naMao, r.canonicoPele)).join("") +
            (e
              ? `<td style="padding:3px 8px;text-align:center">${e.dif} px de ${e.total} (${((e.dif / e.total) * 100).toFixed(1)}%)</td>`
              : "") +
            `</tr>`
          );
        })
        .join("") +
      `</table>`;

    const largura = Math.max(1500, 180 + pecas.length * 3 * 175);
    await pg.setViewportSize({ width: largura, height: 900 });
    await pg.setContent(
      `<body style="margin:0;background:#fff;padding:16px;font:12px system-ui;color:#555">` +
        defs +
        `<h1 style="font:600 16px system-ui;margin:0 0 2px">Folha de contato — ${pecas.map((p) => p.patente.patente).join(" · ")}</h1>` +
        `<p style="margin:0;color:#888">Todas as peças no mesmo enquadramento. Cada close sai de coordenada medida; cada afirmação tem o número ao lado.</p>` +
        titulo("Os quatro fundos", "claro esconde buraco · magenta revela · escuro revela halo · xadrez revela alfa parcial") +
        `<div style="display:flex;gap:12px">${secaoFundos}</div>` +
        titulo("56 px é o tamanho que manda na leitura") +
        `<div style="display:flex;gap:12px">${secaoPequeno}</div>` +
        titulo(
          "Closes derivados — antes e depois, sobre a base COM macacão",
          "a mesma base nos dois lados, para o antes/depois isolar o RECORTE",
        ) +
        secaoCloses +
        titulo("O diff numérico", "resíduo de av-roupa por região, e o quanto as peças divergem") +
        tabela +
        `</body>`,
    );
    await pg.screenshot({ path: FOLHA, fullPage: true });
    writeFileSync(
      `${DIAG}/folha-contato.json`,
      JSON.stringify({ closes: recortesDeClose, residuo, entrePecas }, null, 2),
    );
    console.log(`\n${FOLHA}`);
    console.log(`${DIAG}/folha-contato.json`);
    await pg.close();
  } finally {
    await nav.close();
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
