/**
 * A FONTE AUTOMÁTICA — `referencia.png` direto para `origem.svg`, sem conversor externo.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO EXISTE PARA DECIDIR
 * ---------------------------------------------------------------------------
 *
 * Existe **uma** peça pronta e ~38 desenhos pela frente, e o que se repete 38 vezes
 * não é a decimação: é a curadoria. Hoje a cadeia de uma peça é
 *
 *   `referencia.png` → conversor externo → `origem.svg` → CURADORIA → `semantica.svg`
 *
 * e o `origem.svg` desta arte tem **437 `<path>` com 235 subpaths significativos**.
 * `semantizar.ts` já propõe um papel para cada um, mas o docstring dele diz o que ele
 * é: *"É assistência, não decisão."* Com 235 fragmentos a proposta precisa de revisão
 * humana, e é essa revisão que multiplica por 38.
 *
 * A aposta deste arquivo é que o gargalo não é o rotulador — é a **origem**. O VTracer
 * agrupa por cor, e a arte é chapada: 70,75% dos pixels são `#000000` e o resto são
 * duas famílias de pele e duas de teal, com 20 429 valores distintos que são só
 * anti-aliasing. Trocando o conversor externo pelo VTracer, os 235 subpaths viram
 * **46** — e aí a proposta automática de `semantizar` deixa de precisar de revisão.
 *
 * **Nada do pipeline muda.** Este arquivo produz um `origem.svg` e chama `semantizar`
 * e `importarPeca` **exportados**, sem tocar em nenhum deles. O que ele troca é de
 * onde vem o arquivo de entrada.
 *
 * ---------------------------------------------------------------------------
 * AS TRÊS ESCOLHAS DE CONFIGURAÇÃO SÃO MEDIDAS, E CADA UMA TEM UM CONTRA-EXEMPLO
 * ---------------------------------------------------------------------------
 *
 * Nenhuma delas é gosto. Cada uma foi varrida e cada uma tem uma vizinha que reprova.
 *
 * **1. `pathPrecision: 0` — coordenada INTEIRA, e é a única que funciona.**
 *
 * `semantizar` acha a guia da cabeça por **contenção**: o menor subpath não-teal cuja
 * caixa contém a caixa inteira do teal. O teste é `a.x0 <= b.x0` — sem tolerância, e
 * está certo assim para um conversor que faz cabelo e cabeça **compartilharem o
 * vértice**. O VTracer ajusta cada camada de forma independente, e elas caem um
 * centésimo de pixel apartadas:
 *
 * |  | teal x0 | cabeça x0 | folga |
 * |---|---|---|---|
 * | conversor externo | 240,5350 | 240,5350 | **0,0000** |
 * | VTracer, `pathPrecision` 1–3 | 250,9577 | 251,0000 | **−0,0423** |
 *
 * 0,0423 unidade — quatro centésimos de pixel em 1024 — é o bastante para a cabeça ser
 * descartada como candidata. Sobra a figura inteira, e o registro sai com **76,41% de
 * anisotropia** contra um teto de 2%. Com coordenada inteira as camadas caem na mesma
 * grade, a cabeça é escolhida, e a anisotropia vai a **0,89%**. Medido nos quatro
 * valores: 1, 2 e 3 reprovam idêntico; só o 0 passa.
 *
 * Não se perde nada: o traço veio de um raster de 1024, e sub-pixel ali não descreve
 * informação que o raster tinha.
 *
 * **2. `Hierarchical.Cutout` — porque `Stacked` perde a cabeça.**
 *
 * Em `Stacked` as camadas se sobrepõem e o preto sai como **uma** mancha da figura
 * inteira, caixa (237,38)-(792,850). Em `Cutout` elas se recortam, e aparece o anel de
 * contorno da cabeça sozinho: caixa (251,53)-(776,492), contra (241,44)-(788,495) da
 * guia à mão. É a mesma silhueta, ~10 px para dentro — a espessura do traço.
 *
 * **3. `colorPrecision: 5 · layerDifference: 24 · filterSpeckle: 8`.**
 *
 * Os dois extremos reprovam por motivos opostos, e o meio é largo:
 *
 * | config | paths | subpaths signif. | o que quebra |
 * |---|---|---|---|
 * | prec 6 · dif 16 (default) | 681 | — | a curadoria não sumiu, só mudou de lugar |
 * | **prec 5 · dif 24 · speckle 8** | **40** | **46** | — |
 * | prec 4 · dif 32 · speckle 16 | 12 | 19 | some `massa` e `linha-mascara`: o volume |
 * | prec 3 · dif 48 | 5 | — | funde os dois teais |
 * | prec 2 · dif 64 | 1 | — | a arte inteira vira uma mancha |
 *
 * O `prec 4` é tentador — 12 paths! —, e é justamente o que perde as duas famílias
 * tonais. Calibrar pela contagem de paths seria calibrar no número errado.
 */

import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { ColorMode, Hierarchical, PathSimplifyMode, vectorize } from "@neplex/vectorizer";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  CABELOS,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  type Cabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import { eSignificativo, lerSvg } from "./fonte-svg";
import { lerFontePecaOuFalhar } from "./fonte-peca";
import { semantizar } from "./semantizar";
import {
  completudeRaster,
  conferirRegistro,
  importarPeca,
  marcosDaPeca,
} from "./importar-peca";

const RAIZ = "scripts/avatar/fonte/estilo-kokeshi";
/**
 * A SAÍDA MORA NO `.scratch`, E ISSO NÃO É PROVISÓRIO.
 *
 * `scripts/avatar/fonte/.../curto-espetada/` é a única peça que atravessou a cadeia
 * inteira, e é contra ela que tudo aqui se mede. Escrever por cima dela apagaria o
 * gabarito na primeira execução — e a pergunta deste arquivo ("chega no mesmo
 * lugar?") deixaria de ter contra o que ser respondida.
 */
const SAIDA = ".scratch/estilo/vtracer";
const FOLHA = ".scratch/estilo/folha-vtracer.png";

/** A configuração medida. Cada campo tem contra-exemplo no topo do arquivo. */
export const CONFIG = {
  colorMode: ColorMode.Color,
  hierarchical: Hierarchical.Cutout,
  filterSpeckle: 8,
  colorPrecision: 5,
  layerDifference: 24,
  mode: PathSimplifyMode.Spline,
  cornerThreshold: 60,
  lengthThreshold: 4,
  maxIterations: 10,
  spliceThreshold: 45,
  pathPrecision: 0,
} as const;

/**
 * O SVG DO VTRACER VIRANDO ARQUIVO QUE `lerSvg` ACEITA — e as duas coisas que faltam.
 *
 * **O `viewBox`.** O VTracer emite `width`/`height` e mais nada. `lerSvg` exige
 * `viewBox` e lança sem ele, com razão: sem a caixa, nenhuma coordenada do arquivo é
 * comparável com a de outro.
 *
 * **O `transform`.** Cada camada sai na origem, reposicionada por
 * `transform="translate(dx,dy)"`. `lerSvg` recusa arquivo com `transform` — *"nenhuma
 * coordenada daqui seria a da arte"* — e somar o deslocamento é obrigação de quem
 * escreve, não de quem lê.
 *
 * Somar par a par só é exato se todo comando for absoluto e todo número for
 * coordenada. Medido nesta saída o repertório é `M`, `C`, `Z`, e é isso. `H`/`V` movem
 * um eixo só e `A` tem cinco números que não são coordenada — os dois quebrariam a
 * conta **em silêncio**, com o arquivo saindo perfeitamente legal e a peça deslocada.
 * Por isso a função **lança** em vez de adivinhar.
 */
export function prepararSvg(svg: string, w: number, h: number): string {
  const comCaixa = svg.replace(/<svg /, `<svg viewBox="0 0 ${w} ${h}" `);
  if (comCaixa === svg) throw new Error("vtracer: não achei o `<svg ` para inserir o viewBox");

  return comCaixa.replace(
    /<path([^>]*?)\sd="([^"]*)"([^>]*?)\stransform="translate\(([-\d.]+)[ ,]([-\d.]+)\)"([^>]*)>/g,
    (_todo, antes: string, d: string, meio: string, sdx: string, sdy: string, depois: string) => {
      const dx = Number(sdx);
      const dy = Number(sdy);
      const comandos = d.match(/[A-Za-z][^A-Za-z]*/g) ?? [];
      const estranhos = [...new Set(comandos.map((c) => c[0]))].filter((k) => !"MCZ".includes(k));
      if (estranhos.length) {
        throw new Error(
          `vtracer: o traçador emitiu o(s) comando(s) "${estranhos.join("")}" além de M/C/Z. ` +
            `Somar o deslocamento par a par deixa de ser exato — \`H\`/\`V\` movem um eixo só e ` +
            `\`A\` tem cinco números que não são coordenada. Ensine esta função antes de ` +
            `confiar no arquivo: a peça sairia deslocada com todos os gates verdes.`,
        );
      }
      const assado = comandos
        .map((cmd) => {
          if (cmd[0] === "Z") return "Z";
          const ns = (cmd.slice(1).match(/-?[\d.]+/g) ?? []).map(Number);
          return cmd[0] + ns.map((v, i) => v + (i % 2 ? dy : dx)).join(" ");
        })
        .join("");
      return `<path${antes} d="${assado}"${meio}${depois}>`;
    },
  );
}

/**
 * A ARTE VIRANDO FONTE DECLARADA — os dois arquivos que a cadeia espera encontrar.
 *
 * Escreve `origem.svg` **e** `semantica.svg` porque `conferirCompletude` compara o
 * conjunto de subpaths de um contra o do outro. Com os dois saindo da mesma passada, o
 * gate continua fechando exato — e passa a checar o que sempre quis checar: *a
 * rotulagem não perdeu nada*.
 */
export async function fonteAutomatica(alvo: string): Promise<{
  origem: string;
  semantica: string;
  paths: number;
  significativos: number;
}> {
  const dir = `${SAIDA}/${alvo}`;
  mkdirSync(dir, { recursive: true });

  const png = await sharp(`${RAIZ}/${alvo}/referencia.png`).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  if (!width || !height) throw new Error(`vtracer: ${alvo}/referencia.png sem dimensão`);

  const bruto = await vectorize(png, { ...CONFIG });
  const origem = `${dir}/origem.svg`;
  writeFileSync(origem, prepararSvg(bruto, width, height));

  const lido = lerSvg(origem);
  const significativos = lido.paths.reduce(
    (n, p) => n + p.subpaths.filter((s) => eSignificativo(s, lido.vb)).length,
    0,
  );

  const semantica = `${dir}/semantica.svg`;
  semantizar(origem, semantica);
  return { origem, semantica, paths: lido.paths.length, significativos };
}

export interface Linha {
  nome: string;
  paths: number;
  significativos: number;
  dentro: number;
  aniso: number;
  marcos: { topo: number; olhos: number; base: number };
  coroa: number;
  folga: { esq: number; dir: number };
  contencao: number;
  cruzamentos: number;
  n: { massa: number; clara: number };
  desvio: { massa: number; clara: number };
  buraco: number;
  invasao: number;
  bytes: number;
  peca: Cabelo;
  falhas: string[];
  achados: string[];
}

/** A régua, e ela é a MESMA de `importar-peca.ts` — nenhum número novo é inventado aqui. */
export async function medir(
  nome: string,
  caminhoSemantica: string,
  png: string,
  paths: number,
  significativos: number,
): Promise<Linha> {
  const r = await importarPeca(caminhoSemantica);
  const registro = conferirRegistro(caminhoSemantica);
  const completude = await completudeRaster(registro.peca, png);
  const marcos = marcosDaPeca(lerFontePecaOuFalhar(caminhoSemantica));
  const svg = compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: r.peca, ns: "vt" });

  return {
    nome,
    paths,
    significativos,
    dentro: registro.dentro,
    aniso: registro.anisotropia,
    marcos: marcos.arte,
    coroa: coberturaDaCoroa(r.peca) ?? 0,
    folga: folgaDoRosto(r.peca),
    contencao: contencaoDaClara(r.peca),
    cruzamentos: r.cruzamentos.massa + r.cruzamentos.clara,
    n: { massa: r.n.massa.n, clara: r.n.clara.n },
    desvio: { massa: r.desvio.massa, clara: r.desvio.clara },
    buraco: completude.buraco,
    invasao: completude.invasao,
    bytes: Buffer.byteLength(svg, "utf-8"),
    peca: r.peca,
    falhas: [...registro.falhas, ...r.falhas],
    achados: r.achados,
  };
}

/* ------------------------------------------------------------------ */
/* A folha                                                             */
/* ------------------------------------------------------------------ */

/**
 * A FOLHA — e a pergunta dela é uma só: *a peça automática é a mesma peça?*
 *
 * Por isso ela é menor que a de `mapear.ts`. Lá a pergunta era *qual mapa parece o
 * penteado*, e valia uma grade de quatro tamanhos. Aqui as duas peças ou coincidem ou
 * não, e 56 px — o tamanho do boneco no ranking, que é o que manda — mais 200 px para
 * ver o que 56 esconde, respondem. `CABELOS.curto` entra pelo mesmo motivo de sempre:
 * sem uma peça aprovada na folha, "ficou parecido" é uma frase sobre duas peças.
 */
const TAMANHOS = [56, 200] as const;

async function folhaDoVtracer(alvo: string, linhas: Linha[]) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);
  const selo = createHash("sha256")
    .update(linhas.map((l) => `${l.nome}:${l.coroa.toFixed(4)}:${l.bytes}`).join("|"))
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  const refPng = `data:image/png;base64,${(
    await sharp(`${RAIZ}/${alvo}/referencia.png`).resize({ height: 380 }).png({ palette: true, colours: 64 }).toBuffer()
  ).toString("base64")}`;

  const em = (peca: Cabelo, px: number, ns: string, fundo: string) =>
    `<div><div style="background:${fundo};padding:4px">` +
    `<div style="width:${px}px;height:${px}px;overflow:hidden;display:block">` +
    compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: peca, ns }).replace(
      "<svg ",
      `<svg width="${px}" height="${(px * 1400) / 1000}" `,
    ) +
    `</div></div></div>`;

  const bloco = (l: Linha, i: number) =>
    `<div style="border:1px solid #E4DFD6;border-radius:6px;padding:10px 12px;margin:0 0 10px">` +
    `<p style="font:600 13px system-ui;color:#1B2432;margin:0 0 8px">${esc(l.nome)}</p>` +
    `<div style="display:flex;gap:14px;align-items:flex-end">` +
    TAMANHOS.map((px) => em(l.peca, px, `a${i}${px}`, "#F6F2EA")).join("") +
    em(l.peca, 200, `b${i}`, "#1B2432") +
    `<p style="font:10px ui-monospace,monospace;color:#5A5248;margin:0;line-height:1.9">` +
    `coroa <b>${(100 * l.coroa).toFixed(1)}%</b> · folga <b>${l.folga.esq.toFixed(1)}</b> / ` +
    `<b>${l.folga.dir.toFixed(1)}</b> u · contenção ${l.contencao.toFixed(2)}<br>` +
    `N ${l.n.massa}/${l.n.clara} · desvio ${l.desvio.massa.toFixed(1)} u · cruzamentos ${l.cruzamentos}<br>` +
    `buraco ${(100 * l.buraco).toFixed(2)}% · invasão ${(100 * l.invasao).toFixed(2)}% · ${l.bytes} B<br>` +
    `<b>${l.significativos || "—"}</b> subpaths a curar · anisotropia ${(100 * l.aniso).toFixed(2)}%` +
    `${l.falhas.length ? `<br><b style="color:#B0402F">✗ ${l.falhas.length} reprovação(ões)</b>` : ``}</p>` +
    `</div></div>`;

  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();
    await pg.setContent(
      `<body style="margin:0;background:#FFFFFF;display:inline-block;min-width:1000px">` +
        `<div style="padding:18px 20px 10px">` +
        `<h1 style="font:600 15px system-ui;margin:0 0 2px;color:#1B2432">${esc(alvo)} — ` +
        `a fonte automática contra a fonte à mão</h1>` +
        `<p style="font:11px ui-monospace,monospace;color:#8A8378;margin:0;line-height:1.7">` +
        `56 px é o tamanho do ranking e é o que manda · a última linha é peça APROVADA do ` +
        `catálogo, na mesma régua<br>a pergunta é uma só: a peça automática é a MESMA peça?</p>` +
        `</div>` +
        `<div style="display:flex;gap:18px;padding:0 20px 16px;align-items:flex-start">` +
        `<div><p style="font:600 12px system-ui;color:#1B2432;margin:0 0 4px">a arte de origem</p>` +
        `<img src="${refPng}" height="380" style="display:block;outline:1px solid #E4DFD6"></div>` +
        `<div style="flex:1">${linhas.map(bloco).join("")}</div></div>` +
        `<p style="font:10px ui-monospace,monospace;color:#BBB;margin:0;padding:0 20px 14px">selo ${selo}</p>` +
        `</body>`,
    );
    const caixa = (await pg.locator("body").boundingBox())!;
    const w = Math.ceil(caixa.width);
    const h = Math.ceil(caixa.height);
    await pg.setViewportSize({ width: w, height: h });
    writeFileSync(FOLHA, await pg.screenshot({ clip: { x: 0, y: 0, width: w, height: h } }));
  } finally {
    await nav.close();
  }
  return { caminho: FOLHA, selo };
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");

async function principal() {
  const args = process.argv.slice(2);
  const alvo = args.find((a) => !a.startsWith("--")) ?? "cabelo/curto-espetada";
  const png = `${RAIZ}/${alvo}/referencia.png`;

  console.log(`FONTE AUTOMÁTICA — ${png}\n`);

  const auto = await fonteAutomatica(alvo);
  console.log(`  VTracer → ${auto.origem}`);
  console.log(`            ${auto.paths} <path> · ${auto.significativos} subpath(s) significativo(s)\n`);

  // O gabarito: o mesmo `origem.svg` do conversor externo, na mesma contagem.
  const mao = lerSvg(`${RAIZ}/${alvo}/origem.svg`);
  const maoSig = mao.paths.reduce(
    (n, p) => n + p.subpaths.filter((s) => eSignificativo(s, mao.vb)).length,
    0,
  );

  const linhas: Linha[] = [];
  for (const [nome, caminho, np, ns] of [
    ["à mão", `${RAIZ}/${alvo}/semantica.svg`, mao.paths.length, maoSig],
    ["VTracer", auto.semantica, auto.paths, auto.significativos],
  ] as const) {
    try {
      linhas.push(await medir(nome, caminho, png, np, ns));
    } catch (e) {
      console.log(`  ${nome}: REPROVOU ao importar — ${(e as Error).message}\n`);
    }
  }

  const controle = CABELOS.curto;
  linhas.push({
    nome: "[curto] aprovado",
    paths: 0,
    significativos: 0,
    dentro: 1,
    aniso: 0,
    marcos: { topo: 0, olhos: 0, base: 0 },
    coroa: coberturaDaCoroa(controle) ?? 0,
    folga: folgaDoRosto(controle),
    contencao: contencaoDaClara(controle),
    cruzamentos: 0,
    n: { massa: controle.massa?.length ?? 0, clara: controle.clara?.length ?? 0 },
    desvio: { massa: 0, clara: 0 },
    buraco: 0,
    invasao: 0,
    bytes: Buffer.byteLength(compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: controle, ns: "ct" }), "utf-8"),
    peca: controle,
    falhas: [],
    achados: [],
  });

  console.log(
    `  ${"fonte".padEnd(18)}${"curar".padStart(7)}${"aniso".padStart(8)}${"crânio".padStart(8)}` +
      `${"coroa".padStart(8)}${"folga e".padStart(9)}${"folga d".padStart(9)}${"cruz".padStart(6)}` +
      `${"N".padStart(5)}${"desvio".padStart(8)}${"buraco".padStart(8)}${"invasão".padStart(9)}` +
      `${"bytes".padStart(7)}`,
  );
  for (const l of linhas) {
    console.log(
      `  ${l.nome.padEnd(18)}${String(l.significativos || "—").padStart(7)}` +
        `${(100 * l.aniso).toFixed(2).padStart(7)}%${(100 * l.dentro).toFixed(1).padStart(7)}%` +
        `${(100 * l.coroa).toFixed(1).padStart(7)}%` +
        `${f1(l.folga.esq).padStart(9)}${f1(l.folga.dir).padStart(9)}${String(l.cruzamentos).padStart(6)}` +
        `${String(l.n.massa).padStart(5)}${l.desvio.massa.toFixed(1).padStart(8)}` +
        `${(100 * l.buraco).toFixed(2).padStart(7)}%${(100 * l.invasao).toFixed(2).padStart(8)}%` +
        `${String(l.bytes).padStart(7)}`,
    );
  }

  console.log(
    `\n  "curar" = subpaths significativos que precisam de um papel. É a moeda do pedido:\n` +
      `  ${maoSig} pelo conversor externo contra ${auto.significativos} pelo VTracer — ` +
      `${(maoSig / Math.max(1, auto.significativos)).toFixed(1)}× menos.`,
  );

  /**
   * A COROA E O CRÂNIO SÃO O MESMO EFEITO, E LER SÓ A COROA SERIA VENDER O NÚMERO.
   *
   * A guia do VTracer é menor que a guia à mão, então `registroPelaCabeca` escala a
   * arte PARA CIMA contra o mesmo crânio. Cabelo maior cobre mais coroa **e** sobra
   * mais fora da silhueta: um gate gosta, o outro reprova, e é a mesma causa. Sem esta
   * linha, "a coroa foi de 74,2% para 99,6%" leria como qualidade do traçado.
   */
  const marcosDe = (l: Linha) => l.marcos.base - l.marcos.topo;
  const [a, b] = linhas;
  if (a && b && marcosDe(a) && marcosDe(b)) {
    console.log(
      `\n  O REGISTRO, e é a causa comum da coroa e do crânio:\n` +
        `  altura da guia da cabeça — à mão ${marcosDe(a).toFixed(1)} u · ` +
        `VTracer ${marcosDe(b).toFixed(1)} u  ⇒ o VTracer escala a arte ` +
        `${((marcosDe(a) / marcosDe(b) - 1) * 100).toFixed(1)}% maior contra o mesmo crânio.\n` +
        `  A coroa sobe por isso, e é por isso também que a peça sai do crânio. Mesma causa.`,
    );
  }

  for (const l of linhas.filter((x) => x.falhas.length || x.achados.length)) {
    if (l.falhas.length) {
      console.log(`\n  ${l.nome} — ${l.falhas.length} REPROVAÇÃO(ÕES):`);
      for (const f of l.falhas) console.log(`    · ${f}`);
    }
    if (l.achados.length) {
      console.log(`\n  ${l.nome} — ${l.achados.length} achado(s) que o importador não resolve:`);
      for (const a of l.achados) console.log(`    · ${a}`);
    }
  }

  if (args.includes("--folha")) {
    mkdirSync(".scratch/estilo", { recursive: true });
    const { caminho, selo } = await folhaDoVtracer(alvo, linhas);
    console.log(`\n  selo ${selo}\n  ${caminho}`);
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/avatar/estilo/vtracer.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
