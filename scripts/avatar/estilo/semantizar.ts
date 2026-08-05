/**
 * PROPOR O PAPEL DE CADA PATH — `npm run avatar:semantizar`
 *
 * Lê o `origem.svg` congelado e escreve um `semantica.svg` com um
 * `data-avatar-role` em cada `<path>`. **É assistência, não decisão.** O arquivo
 * que sai daqui é rascunho: quem responde por ele é a curadoria, e quem o reprova
 * é `fonte-peca.ts`.
 *
 * ---------------------------------------------------------------------------
 * UM `<path>` POR SUBPATH — a explosão, e por que ela não perde nada
 * ---------------------------------------------------------------------------
 *
 * O conversor entrega 437 `<path>` com 520 subpaths, e o path #0 sozinho tem 6
 * subpaths de papéis diferentes: a moldura, a silhueta da cabeça, o tronco. Com o
 * rótulo no `<path>`, esses 6 teriam de dividir um papel só.
 *
 * A saída sai explodida: **um `<path>` por subpath**, 520 deles. Uma regra em vez
 * de duas (nada de "explode quando precisar"), e a identidade não se mexe — ela é
 * o `d` normalizado do SUBPATH, mais área e caixa, que a explosão preserva byte a
 * byte. `conferirCompletude` continua fechando contra a origem.
 *
 * O que se perde é o enrolamento `nonzero` entre subpaths do mesmo `<path>` — o
 * vazado que a moldura fazia no path #0. Não custa nada aqui: a peça é
 * rasterizada por CAMADA, cada subpath sólido, e o teal desta arte é
 * essencialmente sem furo (21 paths de corpo em 21 subpaths, 27 de sombra em 27).
 * Se um dia uma peça precisar de furo de verdade, isso volta como papel próprio,
 * medido — não como efeito colateral de enrolamento.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A PROPOSTA SAI DE COR + POSIÇÃO, E NÃO DE FORMA
 * ---------------------------------------------------------------------------
 *
 * A primeira ideia foi separar traço de mancha pela **esbeltez** do subpath
 * (perímetro² / 4π·área — 1 num disco, alto numa fita). Medida no A0, ela não
 * separa nada: mediana **3,3** nos pretos contra **3,2** nos não-pretos. O
 * conversor fragmenta mancha e traço no mesmo formato de lasca, e a forma do
 * fragmento não lembra a forma da peça.
 *
 * O que separa é a **família de cor** — que `classificar()` acha por partição
 * ótima de luminância, sem limiar escolhido — e a **posição contra o crânio**.
 *
 * ---------------------------------------------------------------------------
 * O TOM CLARO É `tom-claro`, E A PRIMEIRA VERSÃO TROCOU OS DOIS — MEDIDO
 * ---------------------------------------------------------------------------
 *
 * A família `corpo` de `classificar()` é a **clara**, e a `sombra` é a escura. A
 * primeira versão mandava `corpo` para o papel `massa` e `sombra` para `tom-claro`,
 * e o resultado é um arquivo legal com os nomes invertidos: o papel chamado
 * *tom-claro* carregava os paths escuros, com `paint="cabelo-s"` — a tinta de
 * sombra. Nenhum gate do contrato acusa isso; é exatamente a família de defeito que
 * o próprio `fonte-peca.ts` declara não pegar (*"rótulo plausível mas errado"*).
 *
 * Quem o desmentiu foi o compositor, e a conta fecha em unidade:
 *
 *  - `.kk-cabelo-s` pinta a **massa** com `--av-cabelo-s` (o tom escuro) e leva o
 *    traço; `.kk-cabelo` pinta a **clara** por cima com `--av-cabelo` (o claro);
 *  - nesta arte, claro 62 452 u² · escuro 20 897 u² · preto 8 370 u²;
 *  - a união é 91 719, e **91 719 − 62 452 = 29 267 = 20 897 + 8 370**. Ou seja: a
 *    sombra que sobra depois de a camada clara ser desenhada por cima é exatamente
 *    o escuro mais o preto da arte. O claro é a camada de CIMA, e é ele o `clara`.
 *
 * Com os nomes trocados, `Cabelo.clara` sairia com a região escura pintada de tom
 * claro — a peça inteira com o volume ao contrário — e o número de fidelidade por
 * papel reportaria a troca como se fosse defeito de forma.
 *
 * A geometria não mudou: a troca é de atributo, e `conferirCompletude` continua
 * fechando 235 = 235 contra a origem.
 *
 * ---------------------------------------------------------------------------
 * A GUIA DA CABEÇA É O MARCO, E ELA É ACHADA POR CONTENÇÃO
 * ---------------------------------------------------------------------------
 *
 * O registro da peça sai da silhueta da cabeça da arte, não dos marcos do corpo —
 * ver `mapaPelaCaixa` em `tracar-cabelo.ts` para os 28% que isso custava.
 *
 * Achar a cabeça por índice seria repetir o erro que `fonte-svg.ts` já documenta
 * (*"o conversor não promete ordem"*). Ela é achada por **contenção**: o menor
 * subpath significativo não-moldura cuja caixa contém a caixa inteira do teal. O
 * cabelo está desenhado dentro da cabeça, então só a cabeça — e a moldura, que sai
 * por área — pode contê-lo.
 */

import { readFileSync, writeFileSync } from "fs";
import { CAIXA_CABECA, VIEWBOX, bordasEm } from "../../../src/lib/avatar/estilo/geometria";
import { classificar, eSignificativo, lerSvg, type Caixa, type PathSvg, type Subpath } from "./fonte-svg";
import { anisotropia, mapaPelaCaixa, paraX, paraY } from "./tracar-cabelo";

/**
 * QUANTO DE UM SUBPATH PRECISA CAIR FORA DO CRÂNIO PARA ELE VIRAR EXTENSÃO.
 *
 * Não é um teto afinado: é a maioria. Um fragmento que atravessa a borda do crânio
 * pertence ao lado onde está a maior parte dele, e a emenda entre `massa` e
 * `extensao` acontece no raster — as duas camadas são rasterizadas inteiras antes
 * de virar laço, então um fragmento a mais ou a menos na fronteira muda a borda em
 * menos de um pixel.
 */
const MAIORIA = 0.5;

const TEAL = ["corpo", "sombra", "traco"];

interface Rotulo {
  papel: string;
  paint?: string;
  plano?: string;
  grupo?: string;
  motivo?: string;
}

interface Item {
  path: PathSvg;
  subpath: Subpath;
  rotulo: Rotulo;
  /** Fração da área que cai fora da silhueta do crânio, sob o registro pela cabeça. */
  fora: number;
}

/** Os nós que estão SOBRE a curva: o `M` e o ponto final de cada `C`. */
function nosDoSubpath(s: Subpath): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const t = s.d.match(/[MC]|-?\d*\.?\d+/g) ?? [];
  for (let i = 0; i < t.length; ) {
    if (t[i] === "M") {
      pts.push({ x: Number(t[i + 1]), y: Number(t[i + 2]) });
      i += 3;
    } else if (t[i] === "C") {
      pts.push({ x: Number(t[i + 5]), y: Number(t[i + 6]) });
      i += 7;
    } else i++;
  }
  return pts;
}

const contem = (a: Caixa, b: Caixa) => a.x0 <= b.x0 && a.y0 <= b.y0 && a.x1 >= b.x1 && a.y1 >= b.y1;
const unir = (a: Caixa, b: Caixa): Caixa => ({
  x0: Math.min(a.x0, b.x0),
  y0: Math.min(a.y0, b.y0),
  x1: Math.max(a.x1, b.x1),
  y1: Math.max(a.y1, b.y1),
});

/** O ponto está dentro da silhueta do crânio? A mesma pergunta do `clip-path`. */
function dentroDoCranio(x: number, y: number): boolean {
  if (y < CAIXA_CABECA.y0 || y > CAIXA_CABECA.y1) return false;
  const b = bordasEm(y);
  return x >= b.esq && x <= b.dir;
}

export function semantizar(origem: string, saida: string) {
  const svg = lerSvg(origem);
  classificar(svg.paths, svg.vb);

  const todos = svg.paths.flatMap((path) => path.subpaths.map((subpath) => ({ path, subpath })));
  const sig = todos.filter((x) => eSignificativo(x.subpath, svg.vb));

  /* ---------------- a guia da cabeça ---------------- */

  const doTeal = sig.filter((x) => TEAL.includes(x.path.familia));
  if (!doTeal.length) throw new Error(`${origem}: nenhum teal significativo — não há peça a importar`);
  const caixaTeal = doTeal.map((x) => x.subpath.caixa).reduce(unir);

  const candidatas = sig
    .filter((x) => contem(x.subpath.caixa, caixaTeal) && !TEAL.includes(x.path.familia))
    .sort((a, b) => Math.abs(a.subpath.area) - Math.abs(b.subpath.area));
  if (!candidatas.length) {
    throw new Error(
      `${origem}: nenhum subpath contém a caixa do teal (${JSON.stringify(caixaTeal)}). ` +
        `Sem a silhueta da cabeça não há marco de registro.`,
    );
  }
  const cabeca = candidatas[0];

  /* ---------------- o registro, e o "fora" ---------------- */

  const m = mapaPelaCaixa(cabeca.subpath.caixa, {
    x0: CAIXA_CABECA.x0,
    y0: CAIXA_CABECA.y0,
    x1: CAIXA_CABECA.x1,
    y1: CAIXA_CABECA.y1,
  });

  const foraDe = (s: Subpath): number => {
    const ns = nosDoSubpath(s);
    if (!ns.length) return 0;
    let fora = 0;
    for (const n of ns) if (!dentroDoCranio(paraX(m, n.x), paraY(m, n.y))) fora++;
    return fora / ns.length;
  };

  /* ---------------- o rótulo ---------------- */

  const itens: Item[] = [];
  for (const { path, subpath } of todos) {
    if (subpath.eMoldura) {
      itens.push({ path, subpath, rotulo: { papel: "descarte", motivo: "moldura do conversor" }, fora: 0 });
      continue;
    }
    if (!eSignificativo(subpath, svg.vb)) {
      // Abaixo do piso não precisa de papel — mas rotular é mais barato que
      // explicar depois por que 284 paths não têm nada escrito.
      itens.push({ path, subpath, rotulo: { papel: "descarte", motivo: "fragmento sob o piso de área" }, fora: 0 });
      continue;
    }
    if (subpath === cabeca.subpath) {
      itens.push({ path, subpath, rotulo: { papel: "guia", grupo: "cabeca" }, fora: 0 });
      continue;
    }

    const fora = foraDe(subpath);
    if (TEAL.includes(path.familia)) {
      if (fora >= MAIORIA) {
        const cx = (subpath.caixa.x0 + subpath.caixa.x1) / 2;
        const lado = paraX(m, cx) < VIEWBOX.w / 2 ? "esq" : "dir";
        itens.push({
          path,
          subpath,
          rotulo: { papel: "extensao", paint: "cabelo", plano: "frente", grupo: `mecha-${lado}` },
          fora,
        });
      } else {
        const r: Rotulo =
          path.familia === "corpo"
            ? { papel: "tom-claro", paint: "cabelo" }
            : path.familia === "sombra"
              ? { papel: "massa", paint: "cabelo-s" }
              : { papel: "linha-mascara", paint: "linha" };
        itens.push({ path, subpath, rotulo: r, fora });
      }
      continue;
    }
    itens.push({
      path,
      subpath,
      rotulo: {
        papel: "descarte",
        motivo: path.familia === "pele" ? "pele do boneco do gerador" : "traço e feições do boneco do gerador",
      },
      fora,
    });
  }

  /* ---------------- escrever ---------------- */

  const src = readFileSync(origem, "utf8");
  const cabecalho = src.slice(0, src.indexOf("<path"));
  const corpo = itens
    .map((it) => {
      const a = [
        `fill="${it.path.fill}"`,
        `opacity="1.000000"`,
        `stroke="none"`,
        `data-avatar-role="${it.rotulo.papel}"`,
        it.rotulo.paint ? `data-avatar-paint="${it.rotulo.paint}"` : "",
        it.rotulo.plano ? `data-plano="${it.rotulo.plano}"` : "",
        it.rotulo.grupo ? `data-avatar-grupo="${it.rotulo.grupo}"` : "",
        it.rotulo.motivo ? `data-motivo="${it.rotulo.motivo}"` : "",
      ].filter(Boolean);
      return `<path ${a.join(" ")} d="${it.subpath.d}"/>`;
    })
    .join("\n");
  writeFileSync(saida, `${cabecalho}${corpo}\n</svg>\n`);

  /* ---------------- laudo ---------------- */

  const L: string[] = [];
  L.push(`SEMANTIZAR — ${origem}`);
  L.push(`  ${svg.paths.length} paths · ${todos.length} subpaths · ${sig.length} significativos`);
  L.push(`  escrito EXPLODIDO em ${saida}: ${itens.length} <path>, um por subpath`);
  L.push("");
  L.push(`GUIA "cabeca" — achada por contenção, não por índice:`);
  const c = cabeca.subpath.caixa;
  L.push(
    `  path#${cabeca.path.i} · ${cabeca.subpath.nos} nós · ${Math.abs(cabeca.subpath.area).toFixed(0)} u² · ` +
      `caixa (${c.x0.toFixed(0)},${c.y0.toFixed(0)})-(${c.x1.toFixed(0)},${c.y1.toFixed(0)})`,
  );
  L.push(
    `  registro: kx ${m.kx.toFixed(4)} · ky ${m.ky.toFixed(4)} · anisotropia ${(100 * anisotropia(m)).toFixed(2)}%` +
      `   (acima de poucos por cento, é FORMA diferente e não registro)`,
  );
  L.push("");

  const porPapel = new Map<string, { n: number; area: number }>();
  for (const it of itens) {
    if (!eSignificativo(it.subpath, svg.vb) && !it.subpath.eMoldura) continue;
    const chave =
      it.rotulo.papel +
      (it.rotulo.grupo ? ` (${it.rotulo.grupo})` : "") +
      (it.rotulo.motivo ? ` — ${it.rotulo.motivo}` : "");
    const e = porPapel.get(chave) ?? { n: 0, area: 0 };
    e.n++;
    e.area += Math.abs(it.subpath.area);
    porPapel.set(chave, e);
  }
  L.push("proposta por papel (só os significativos e a moldura):");
  for (const [k, e] of [...porPapel].sort((a, b) => b[1].area - a[1].area)) {
    L.push(`  ${k.padEnd(50)} ${String(e.n).padStart(4)} subpaths · ${e.area.toFixed(0).padStart(7)} u²`);
  }

  const areaTeal = doTeal.reduce((a, x) => a + Math.abs(x.subpath.area), 0);
  const areaFora = doTeal.reduce((a, x) => a + Math.abs(x.subpath.area) * foraDe(x.subpath), 0);
  L.push("");
  L.push(
    `O TEAL CONTRA O CRÂNIO, sob o registro pela cabeça: ` +
      `${(100 - (100 * areaFora) / areaTeal).toFixed(1)}% dentro · ${((100 * areaFora) / areaTeal).toFixed(1)}% fora`,
  );

  const duvidosos = itens.filter((it) => TEAL.includes(it.path.familia) && it.fora > 0.2 && it.fora < 0.8);
  L.push(
    `NA FRONTEIRA (20% a 80% fora) — ${duvidosos.length} subpath(s), onde a maioria decide sozinha:`,
  );
  for (const it of duvidosos.sort((a, b) => Math.abs(b.subpath.area) - Math.abs(a.subpath.area)).slice(0, 10)) {
    L.push(
      `  path#${String(it.path.i).padStart(3)} ${it.path.familia.padEnd(7)} ` +
        `${Math.abs(it.subpath.area).toFixed(0).padStart(6)} u² · ${(100 * it.fora).toFixed(0)}% fora → ${it.rotulo.papel}`,
    );
  }

  console.log(L.join("\n"));
  return { itens, laudo: L, mapa: m, cabeca: cabeca.subpath };
}

const RAIZ = "scripts/avatar/fonte/estilo-kokeshi";

if (process.argv[1]?.replace(/\\/g, "/").endsWith("semantizar.ts")) {
  const peca = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "cabelo/curto-espetada";
  semantizar(`${RAIZ}/${peca}/origem.svg`, `${RAIZ}/${peca}/semantica.svg`);
}
