/**
 * P7-T — A FOLHA DE ESCOLHA DO TRAJE: as peças entre si, e contra o boneco sem
 * traje.
 *
 * É o passo 7 da esteira e o análogo de `arte:folha`. Nasce plural de propósito —
 * recebe N peças e as põe lado a lado —, porque a regra do doc 21 §6 é *"folha de
 * contato entre peças antes de a seguinte começar"*, e são 8 peças atrás desta.
 *
 * ---------------------------------------------------------------------------
 * O PNG ENTRA COMO DATA-URI, E NÃO É PREFERÊNCIA
 * ---------------------------------------------------------------------------
 *
 * `Traje.tinta.png` guarda `/dev/traje/<slug>.png`, que é o que o BROWSER pede — e
 * funciona no produto, porque o SVG é inline no documento e o caminho resolve
 * contra o domínio. Numa folha, não: `renderizarSvg` usa `page.setContent()` sem
 * `baseURL`, a página fica em `about:blank`, e um `href` relativo resolve contra
 * `about:blank` e **falha em silêncio** — `<image>` de SVG não emite erro, só
 * deixa a área vazia. A folha mostraria o boneco de macacão e ninguém saberia que
 * a peça não carregou.
 *
 * Por isso `paraFolha()` troca o caminho por data-URI antes de compor. É o que as
 * dez folhas deste repositório já fazem, sem exceção.
 *
 * ---------------------------------------------------------------------------
 * O QUE A FOLHA MOSTRA, E O QUE ELA MEDE
 * ---------------------------------------------------------------------------
 *
 * Mostra quatro seções, e **a coluna "sem traje" é o controle negativo em todas**:
 * ela é o piso. Se a peça não colou, as duas colunas ficam idênticas e a régua da
 * distinção devolve zero — que é o defeito que uma folha sem controle deixaria
 * passar como "ficou parecido".
 *
 * Mede quatro coisas, e todas saem no TERMINAL, nunca na imagem (doc 19 §11):
 * a distinção com × sem traje a 56 px, a distinção entre peças, quanto o
 * `clipPath` cortou da arte, e **a colagem** — se a peça caiu no pixel certo.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";

import sharp from "sharp";

import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CENTRO_X, TRACO, TRONCO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { TRAJES_DA_ARTE } from "../../../src/lib/avatar/estilo/trajes-da-arte";
import type { Traje } from "../../../src/lib/avatar/estilo/tipos";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarHtml, renderizarSvg } from "../render-svg";
import { ESCALA, FUNDO, LADO, PASTA, embrulhar } from "./base";
import { mascarasDoCampo } from "./base-tronco";
import { dilatar, erodir } from "./pixels";
import { RECORTE } from "./traje";

const b64 = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

/** Os tamanhos: 56 é o ranking, 340 é a ficha de perfil. */
const TAMANHOS = [56, 100, 200, 340];
const P = 56;

const FUNDOS: [string, string][] = [
  ["claro", "#FBF8F5"],
  ["magenta", "#FF00AA"],
  ["escuro", "#1B1B1F"],
  ["xadrez", "repeating-conic-gradient(#DDD 0% 25%, #FFF 0% 50%) 50% / 12px 12px"],
];

const est = { pele: PELE[2], cabelo: CABELO[1] };

/** Um PNG de 1×1 totalmente transparente. Ver o uso, no referencial chapado. */
const PNG_VAZIO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk" +
  "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** O caminho vira data-URI. Ver o cabeçalho: sem isto a folha mente. */
function paraFolha(t: Traje): Traje {
  if (!t.tinta.png) return t;
  return { ...t, tinta: { ...t.tinta, png: b64(`public${t.tinta.png}`) } };
}

/** Os pixels em que dois PNGs RGBA diferem, sobre os que alguma das duas pinta. */
async function distinguir(a: string, b: string): Promise<number> {
  const [ia, ib] = await Promise.all(
    [a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  let uniao = 0;
  let difere = 0;
  for (let i = 0; i < ia.info.width * ia.info.height; i++) {
    const j = i * 4;
    const va = ia.data[j + 3] > 0;
    const vb = ib.data[j + 3] > 0;
    if (!va && !vb) continue;
    uniao++;
    const d = Math.max(
      Math.abs(ia.data[j] - ib.data[j]),
      Math.abs(ia.data[j + 1] - ib.data[j + 1]),
      Math.abs(ia.data[j + 2] - ib.data[j + 2]),
      Math.abs(ia.data[j + 3] - ib.data[j + 3]),
    );
    if (d > 8) difere++;
  }
  return uniao ? difere / uniao : 0;
}

/** A caixa dos pixels de uma máscara booleana. */
function caixa(m: Uint8Array, w: number, h: number) {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1,
    n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (m[y * w + x]) {
        n++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1, n };
}

async function principal() {
  const pedidos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const slugs = pedidos.length
    ? pedidos.map((p) => p.split(/[\\/]/).pop()!.replace(/\.png$/i, ""))
    : Object.keys(TRAJES_DA_ARTE);
  const pecas = slugs.map((s) => {
    const t = TRAJES_DA_ARTE[s];
    if (!t) throw new Error(`${s} não está em trajes-da-arte.ts — rode \`npm run arte:trajes\``);
    return { slug: s, traje: paraFolha(t), cru: t };
  });

  mkdirSync(`${PASTA}/traje`, { recursive: true });
  const nav = await abrirNavegador();
  const larg = (h: number) => Math.round((h * VIEWBOX.w) / VIEWBOX.h);

  /** Um render do boneco, com ou sem traje, na altura pedida. */
  const render = async (
    chave: string,
    h: number,
    traje: Traje | undefined,
    cabelo?: keyof typeof CABELOS | undefined,
    fundo = "transparent",
  ) => {
    const arq = `${PASTA}/traje/.t-${chave}.png`;
    await renderizarSvg(
      nav,
      compor({
        ...est,
        ...(traje ? { traje } : {}),
        ...(cabelo ? { modeloCabelo: CABELOS[cabelo] } : {}),
        ns: `t${chave.replace(/\W/g, "")}`,
      }),
      larg(h),
      h,
      arq,
      fundo,
    );
    return arq;
  };

  // ------------------------------------------------------------ os renders
  const semTraje: Record<number, string> = {};
  for (const h of TAMANHOS) semTraje[h] = await render(`sem-${h}`, h, undefined);

  const comTraje: Record<string, Record<number, string>> = {};
  for (const p of pecas) {
    comTraje[p.slug] = {};
    for (const h of TAMANHOS) comTraje[p.slug][h] = await render(`${p.slug}-${h}`, h, p.traje);
  }

  // Seção 4: o traje sob cada cabelo. O traje não deve mudar com o cabelo.
  const cabelos = ["careca", ...Object.keys(CABELOS)] as const;
  const comCabelo: Record<string, Record<string, string>> = {};
  for (const p of pecas) {
    comCabelo[p.slug] = {};
    for (const c of cabelos) {
      comCabelo[p.slug][c] = await render(
        `${p.slug}-c-${c}`,
        100,
        p.traje,
        c === "careca" ? undefined : (c as keyof typeof CABELOS),
      );
    }
  }

  // ------------------------------------------------ a colagem e o corte
  //
  // Render a 1024², `escala: 1`, no MESMO enquadramento da base de edição — é o
  // único jeito de comparar o que a tela mostra com o PNG que entrou.
  const campo = await mascarasDoCampo(nav);
  const laudo: Record<
    string,
    {
      total: number;
      alemDaSilhueta: number;
      transbordoTraco: number;
      sobACabeca: number;
      repintado: number;
      sobOTraco: number;
      visivel: number;
      desloc: number[];
      separacao: number;
      segundo: number[];
    }
  > = {};
  for (const p of pecas) {
    const svgCom = embrulhar(compor({ ...est, traje: p.traje, ns: "z1", escala: 1 }));
    // O REFERENCIAL CHAPADO leva um PNG de 1×1 TRANSPARENTE, e não `png` ausente.
    //
    // Desde que o compositor passou a suprimir a sombra do queixo e o plano
    // lateral quando há arte (2026-08-12, ressalva do Doug), tirar o `png` do
    // referencial faria as duas voltarem — e o diff acusaria as sombras do
    // sistema como se fossem desenho da peça. Com um PNG vazio, o referencial cai
    // no mesmo ramo do compositor e pinta só o pano chapado.
    const svgSem = embrulhar(
      compor({
        ...est,
        traje: { ...p.traje, tinta: { cor: p.cru.tinta.cor, png: PNG_VAZIO } },
        ns: "z2",
        escala: 1,
      }),
    );
    const aCom = `${PASTA}/traje/.z-${p.slug}-com.png`;
    const aSem = `${PASTA}/traje/.z-${p.slug}-sem.png`;
    await renderizarSvg(nav, svgCom, LADO, LADO, aCom, FUNDO);
    await renderizarSvg(nav, svgSem, LADO, LADO, aSem, FUNDO);

    const [iCom, iSem] = await Promise.all(
      [aCom, aSem].map((f) => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })),
    );
    // Onde o PNG mudou alguma coisa em relação ao pano chapado. A massa é o
    // próprio pano e não aparece aqui — de propósito: o que registra a colagem é
    // sombra, luz e traço, que são justamente o desenho.
    const naTela = new Uint8Array(LADO * LADO);
    for (let i = 0; i < LADO * LADO; i++) {
      const j = i * 3;
      const d = Math.max(
        Math.abs(iCom.data[j] - iSem.data[j]),
        Math.abs(iCom.data[j + 1] - iSem.data[j + 1]),
        Math.abs(iCom.data[j + 2] - iSem.data[j + 2]),
      );
      if (d > 8) naTela[i] = 1;
    }

    // O mesmo desenho, no PNG que entrou: tudo que não é o pano chapado.
    const { data: cru } = await sharp(`public${p.cru.tinta.png}`)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pano = [
      parseInt(p.cru.tinta.cor.slice(1, 3), 16),
      parseInt(p.cru.tinta.cor.slice(3, 5), 16),
      parseInt(p.cru.tinta.cor.slice(5, 7), 16),
    ];
    const noPng = new Uint8Array(LADO * LADO);
    let total = 0;
    for (let y = 0; y < RECORTE.h; y++) {
      for (let x = 0; x < RECORTE.w; x++) {
        const j = (y * RECORTE.w + x) * 4;
        if (cru[j + 3] === 0) continue;
        const d = Math.max(
          Math.abs(cru[j] - pano[0]),
          Math.abs(cru[j + 1] - pano[1]),
          Math.abs(cru[j + 2] - pano[2]),
        );
        if (d <= 8) continue;
        total++;
        noPng[(y + RECORTE.y) * LADO + (x + RECORTE.x)] = 1;
      }
    }

    // ------------------------------------------------------------------
    // TRÊS CAUSAS, TRÊS NÚMEROS — e a primeira versão desta régua somava as
    // três num só.
    //
    // Ela devolvia "25,59% cortado" numa peça cujo transbordo medido é +5,0 u,
    // e a caixa aparecia encolhida 19-23 px de cada lado. Nada disso era
    // deslocamento: um pedaço do desenho **sai do clip**, outro fica **atrás da
    // cabeça** (que é desenhada depois do tronco e é opaca), e outro some **sob
    // o traço do tronco**, que tem 12 u e é desenhado por último. Só o primeiro
    // é perda; os outros dois são o boneco funcionando.
    //
    // Um número para três causas é *o* modo de falha desta rota (doc 19 §5).
    const alemDaSilhueta = new Uint8Array(LADO * LADO);
    const sobACabeca = new Uint8Array(LADO * LADO);
    const sobOTraco = new Uint8Array(LADO * LADO);
    const visivel = new Uint8Array(LADO * LADO);
    // O miolo: o clip erodido por meio traço, fora da cabeça. É onde a pergunta
    // "a peça caiu no pixel certo?" tem resposta — na borda quem manda é o traço.
    const miolo = erodir(campo.tronco, LADO, LADO, Math.ceil((TRACO / 2) * ESCALA));
    const cabecaFolgada = dilatar(campo.cabeca, LADO, LADO, 2);
    for (let i = 0; i < LADO * LADO; i++) {
      if (!noPng[i]) continue;
      if (!campo.tronco[i]) alemDaSilhueta[i] = 1;
      else if (cabecaFolgada[i]) sobACabeca[i] = 1;
      else if (!miolo[i]) sobOTraco[i] = 1;
      else visivel[i] = 1;
    }

    // ------------------------------------------------------------------
    // A COLAGEM POR BUSCA, e não por caixa — a caixa não distingue oclusão de
    // desregistro.
    //
    // A primeira versão comparava as caixas do desenho no PNG e na tela, e
    // acusou `y 15/0`. Não era a peça deslocada: é a **sombra do queixo**
    // (`pathSombraQueixoTronco`), que o compositor pinta DEPOIS da arte e
    // repinta a faixa de cima. Qualquer oclusão desloca uma caixa.
    //
    // A busca é imune a isso: desloca-se o PNG de −2 a +2 px e conta-se a
    // concordância com a tela dentro do miolo. Oclusão derruba todos os
    // deslocamentos por igual, então o máximo continua onde a peça de fato
    // caiu. Máximo em (0,0) é a colagem 1 : 1 provada.
    // A BUSCA CORRE SOBRE O TRAÇO DA PEÇA, e não sobre a massa dela.
    //
    // A primeira versão casava o desenho inteiro e devolveu (−2, 0) numa peça que
    // a versão anterior media em (0, 0). Nenhuma das duas estava certa: a massa
    // de um traje é uma mancha larga e chapada, e deslocá-la 2 px muda uma fração
    // do total. A régua não tinha o que separar — resposta quase igual para
    // posições diferentes, que é o modo de falha desta rota inteira.
    //
    // As linhas pretas da peça são o contrário: finas, de contraste máximo, e um
    // pixel de desvio já derruba a concordância. Dentro do `miolo` — o clip
    // erodido por meio traço — não existe preto do boneco, então todo preto ali é
    // da peça. É a feição certa para perguntar "caiu no pixel?".
    const pretoNoPng = new Uint8Array(LADO * LADO);
    for (let y = 0; y < RECORTE.h; y++) {
      for (let x = 0; x < RECORTE.w; x++) {
        const j = (y * RECORTE.w + x) * 4;
        if (cru[j + 3] === 0) continue;
        if (cru[j] < 40 && cru[j + 1] < 40 && cru[j + 2] < 40)
          pretoNoPng[(y + RECORTE.y) * LADO + (x + RECORTE.x)] = 1;
      }
    }
    const pretoNaTela = new Uint8Array(LADO * LADO);
    for (let i = 0; i < LADO * LADO; i++) {
      if (!miolo[i] || cabecaFolgada[i]) continue;
      const j = i * 3;
      if (iCom.data[j] < 40 && iCom.data[j + 1] < 40 && iCom.data[j + 2] < 40) pretoNaTela[i] = 1;
    }

    const busca: { dx: number; dy: number; n: number }[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        let n = 0;
        for (let y = 2; y < LADO - 2; y++) {
          for (let x = 2; x < LADO - 2; x++) {
            const i = y * LADO + x;
            if (!pretoNaTela[i]) continue;
            if (pretoNoPng[(y + dy) * LADO + (x + dx)]) n++;
          }
        }
        busca.push({ dx, dy, n });
      }
    }
    busca.sort((a, b) => b.n - a.n);
    const melhor = busca[0];
    const segundo = busca[1];
    // Se o segundo colocado empata com o primeiro, a busca não separou nada e a
    // resposta não vale — é o controle da própria régua.
    const separacao = melhor.n ? (melhor.n - segundo.n) / melhor.n : 0;

    // O que sobrou dentro do miolo e NÃO apareceu: o compositor repintou por
    // cima. É a sombra do queixo e o plano lateral, e é comportamento pedido.
    let repintado = 0;
    for (let i = 0; i < LADO * LADO; i++) if (visivel[i] && !naTela[i]) repintado++;

    // Quanto do que o clip cortou era o TRAÇO da peça — que o contorno do
    // tronco redesenha por cima de qualquer jeito, e portanto não se perde.
    let transbordoTraco = 0;
    for (let y = 0; y < RECORTE.h; y++) {
      for (let x = 0; x < RECORTE.w; x++) {
        const i = (y + RECORTE.y) * LADO + (x + RECORTE.x);
        if (!alemDaSilhueta[i]) continue;
        const j = (y * RECORTE.w + x) * 4;
        if (cru[j] < 40 && cru[j + 1] < 40 && cru[j + 2] < 40) transbordoTraco++;
      }
    }

    laudo[p.slug] = {
      total,
      alemDaSilhueta: caixa(alemDaSilhueta, LADO, LADO).n,
      transbordoTraco,
      sobACabeca: caixa(sobACabeca, LADO, LADO).n,
      sobOTraco: caixa(sobOTraco, LADO, LADO).n,
      repintado,
      visivel: caixa(visivel, LADO, LADO).n - repintado,
      desloc: [melhor.dx, melhor.dy],
      separacao,
      segundo: [segundo.dx, segundo.dy],
    };
  }

  // ------------------------------------------------------- o close do tronco
  const ALT_CLOSE = 1400;
  const porU = ALT_CLOSE / VIEWBOX.h;
  const meioMax = Math.max(...TRONCO.perfil.map((q) => q.meio)) * 0.95 + TRACO / 2;
  const cx0 = Math.round((CENTRO_X - meioMax - 8) * porU);
  const cx1 = Math.round((CENTRO_X + meioMax + 8) * porU);
  const cy0 = Math.round((TRONCO.perfil[0].y + 20) * porU);
  const cy1 = Math.round((TRONCO.yBase + TRACO) * porU);
  const closes: Record<string, string> = {};
  for (const p of [...pecas.map((q) => ({ slug: q.slug, traje: q.traje })), { slug: "sem traje", traje: undefined }]) {
    const arq = `${PASTA}/traje/.tc-${p.slug.replace(/\W/g, "")}.png`;
    await renderizarSvg(
      nav,
      compor({ ...est, ...(p.traje ? { traje: p.traje } : {}), ns: `k${p.slug.replace(/\W/g, "")}` }),
      larg(ALT_CLOSE),
      ALT_CLOSE,
      arq,
      FUNDO,
    );
    const rec = `${PASTA}/traje/.tx-${p.slug.replace(/\W/g, "")}.png`;
    await sharp(arq)
      .extract({ left: cx0, top: cy0, width: cx1 - cx0, height: cy1 - cy0 })
      .resize({ width: 360 })
      .toFile(rec);
    closes[p.slug] = b64(rec);
  }

  await nav.close();

  // ------------------------------------------------------------------ o HTML
  const cel = (src: string, rot: string, h: number) =>
    `<div class="c"><img src="${src}" style="height:${h}px"/><span>${rot}</span></div>`;

  let html = `<style>
    body{margin:0;background:#F4F1EC;font:12px/1.4 ui-sans-serif,system-ui;color:#2A2A2E}
    h2{font-size:13px;margin:22px 0 8px;letter-spacing:.04em;text-transform:uppercase;color:#6B6560}
    .fila{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:6px}
    .c{display:flex;flex-direction:column;align-items:center;gap:4px}
    .c span{font-size:10px;color:#8A837D}
    .bl{background:#FFF;border-radius:8px;padding:12px 14px;margin-bottom:10px}
    .f{padding:10px;border-radius:6px}
    .z{image-rendering:pixelated}
    .wrap{padding:18px 22px;max-width:1560px}
  </style><div class="wrap">`;

  html += `<h2>1 · os tamanhos — com traje × sem traje</h2>`;
  for (const p of pecas) {
    html += `<div class="bl"><div class="fila">`;
    for (const h of TAMANHOS) html += cel(b64(comTraje[p.slug][h]), `${p.slug} · ${h}px`, h);
    html += `</div><div class="fila">`;
    for (const h of TAMANHOS) html += cel(b64(semTraje[h]), `sem traje · ${h}px`, h);
    html += `</div></div>`;
  }

  html += `<h2>2 · 56 px, o tamanho do ranking, nos quatro fundos</h2>`;
  for (const [nome, css] of FUNDOS) {
    html += `<div class="f" style="background:${css}"><div class="fila">`;
    for (const p of pecas) {
      html += `<div class="c"><img class="z" src="${b64(comTraje[p.slug][P])}" style="height:${P * 2}px"/><span style="color:${nome === "escuro" ? "#DDD" : "#3A3A3A"}">${p.slug}</span></div>`;
    }
    html += `<div class="c"><img class="z" src="${b64(semTraje[P])}" style="height:${P * 2}px"/><span style="color:${nome === "escuro" ? "#DDD" : "#3A3A3A"}">sem traje</span></div>`;
    html += `</div></div>`;
  }

  html += `<h2>3 · o tronco de perto — recorte de coordenada medida</h2><div class="bl"><div class="fila">`;
  for (const [k, v] of Object.entries(closes)) {
    html += `<div class="c"><img src="${v}" style="width:360px;height:auto"/><span>${k}</span></div>`;
  }
  html += `</div></div>`;

  html += `<h2>4 · o traje sob cada cabelo, a 100 px — o traje não muda com o cabelo</h2>`;
  for (const p of pecas) {
    html += `<div class="bl"><div class="fila">`;
    for (const c of cabelos) html += cel(b64(comCabelo[p.slug][c]), c, 100);
    html += `</div></div>`;
  }

  html += `</div>`;
  const arqHtml = `${PASTA}/folha-traje.html`;
  const arqPng = `${PASTA}/folha-traje.png`;
  writeFileSync(arqHtml, html, "utf-8");
  const nav2 = await abrirNavegador();
  await renderizarHtml(nav2, html, 1560, arqPng);
  await nav2.close();

  // ------------------------------------------------------------------ laudo
  console.log(`\nP7-T — FOLHA DO TRAJE — ${pecas.length} peça(s)\n`);

  console.log(`  A COLAGEM — a peça caiu no pixel certo?`);
  for (const p of pecas) {
    const l = laudo[p.slug];
    const pct = (n: number) => `${((100 * n) / l.total).toFixed(2)}%`;
    const [dx, dy] = l.desloc;
    console.log(
      `    ${p.slug}   registro pelo TRAÇO, busca ±2 px → ` +
        `(${dx}, ${dy})   2º lugar (${l.segundo[0]}, ${l.segundo[1]}) atrás por ${(l.separacao * 100).toFixed(1)}%`,
    );
    console.log(
      `    ${" ".repeat(p.slug.length)}   ${
        l.separacao < 0.02
          ? "⚠ EMPATE — a busca não separou; o número não vale"
          : dx === 0 && dy === 0
            ? "· COLAGEM 1 : 1, no pixel"
            : "⚠ DESREGISTRADA"
      }`,
    );
    console.log(`\n      onde foi parar o desenho (${l.total} px de sombra, luz e traço)`);
    console.log(`        visível na tela      ${String(l.visivel).padStart(6)}  ${pct(l.visivel)}`);
    console.log(
      `        atrás da cabeça      ${String(l.sobACabeca).padStart(6)}  ${pct(l.sobACabeca)}` +
        `   — a cabeça é opaca e vem depois do tronco`,
    );
    console.log(
      `        sob o traço do tronco${String(l.sobOTraco).padStart(6)}  ${pct(l.sobOTraco)}` +
        `   — o contorno de ${TRACO} u é redesenhado por último`,
    );
    console.log(
      `        repintado por cima   ${String(l.repintado).padStart(6)}  ${pct(l.repintado)}` +
        `   — deve ser ~0: o compositor não sombreia peça com arte`,
    );
    console.log(
      `        ALÉM DA SILHUETA     ${String(l.alemDaSilhueta).padStart(6)}  ${pct(l.alemDaSilhueta)}` +
        `   ← o TRANSBORDO (doc 21 §6.1), dos quais`,
    );
    console.log(
      `        ${" ".repeat(28)}${l.transbordoTraco} px são o traço da peça, ` +
        `virando a borda externa`,
    );
    console.log(
      `\n      total visível = ${l.visivel + l.alemDaSilhueta + l.sobOTraco} px ` +
        `(${pct(l.visivel + l.alemDaSilhueta + l.sobOTraco)}) — só a cabeça esconde`,
    );
  }

  console.log(`\n  A DISTINÇÃO a ${P} px — o controle é a coluna sem traje`);
  for (const p of pecas) {
    const d = await distinguir(comTraje[p.slug][P], semTraje[P]);
    console.log(
      `    ${p.slug.padEnd(24)} × sem traje   ${(d * 100).toFixed(2)}%   ` +
        `${d >= 0.05 ? "· acima do piso de 5%" : "✗ ABAIXO DO PISO — a peça não lê a 56 px"}`,
    );
  }
  for (let i = 0; i < pecas.length; i++) {
    for (let j = i + 1; j < pecas.length; j++) {
      const d = await distinguir(comTraje[pecas[i].slug][P], comTraje[pecas[j].slug][P]);
      console.log(
        `    ${pecas[i].slug} × ${pecas[j].slug}   ${(d * 100).toFixed(2)}%   ` +
          `${d >= 0.05 ? "· separam" : "✗ NÃO SEPARAM a 56 px"}`,
      );
    }
  }

  console.log(`\n  O ORÇAMENTO do composto (base + traje, sem cabelo)`);
  const sinal = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const contar = (s: string) => (s.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
  const semSvg = compor({ ...est, ns: "o0" });
  console.log(
    `    sem traje                ${contar(semSvg)} formas   ${Buffer.byteLength(semSvg)} bytes`,
  );
  for (const p of pecas) {
    const s = compor({ ...est, traje: p.cru, ns: "o1" });
    console.log(
      `    ${p.slug.padEnd(24)} ${contar(s)} formas   ${Buffer.byteLength(s)} bytes   ` +
        `(${sinal(contar(s) - contar(semSvg))} formas, ${sinal(Buffer.byteLength(s) - Buffer.byteLength(semSvg))} bytes — <image> não conta como forma)`,
    );
  }

  console.log(`\n  escritos            ${arqPng}\n                      ${arqHtml}`);
  console.log(`  o close saiu de     x ${cx0}→${cx1}  y ${cy0}→${cy1} px do render de ${ALT_CLOSE}`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
