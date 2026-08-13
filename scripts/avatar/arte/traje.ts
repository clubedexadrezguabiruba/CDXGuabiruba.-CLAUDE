/**
 * P4-T — A ARTE DO TRAJE VIRA PNG DE PEÇA: recolorir e recortar.
 *
 * É o passo 4 da esteira do traje, e o análogo do trio
 * `arte:contorno` → `arte:converter` → `arte:espessura` do cabelo. Onde o cabelo
 * vira geometria `{t,y}`, o traje vira **raster recortado** — e a escolha tem
 * número por trás, não conveniência (ver o bloco seguinte).
 *
 * ---------------------------------------------------------------------------
 * POR QUE RASTER AQUI, SE A §6.1 DO DOC 21 MANDOU O CONTRÁRIO
 * ---------------------------------------------------------------------------
 *
 * A diretriz *"roupa veste, não pinta"* (doc 21 §6.1) diz que o que EXCEDE a
 * silhueta é `Traje.extensoes`, e extensão é vetor — `{ d, cor }`, nunca PNG. O
 * tipo repete: `tinta.png` é *"o interior, nunca a fronteira"* (`tipos.ts:51`).
 *
 * Esta peça **não excede**: o transbordo medido é +5,0 u no pico (o nó da faixa)
 * contra os 26 u que o teto permite, e negativo em toda a outra altura. O
 * `clipPath` do tronco não come nada dela. O raster serve; a esteira de traçado
 * continua devendo para a primeira arte que transborde de verdade, e é a §6.1
 * quem vai cobrar.
 *
 * ---------------------------------------------------------------------------
 * A COLAGEM É CONTA, E É POR ISSO QUE O RECORTE É ESTE
 * ---------------------------------------------------------------------------
 *
 * `tintaTronco()` emite `<image x=(500−500k)/2 y=… width=500k height=700k
 * preserveAspectRatio="xMidYMid meet"/>`, com `k = traje.escalaMedida ?? 1`
 * (`compositor.ts:373`). **A peça não declara `escalaMedida`** — o campo diz
 * *"nunca escrita à mão"*, e o auto-ajuste que a produziria não existe em código.
 * Com `k = 1` o `<image>` ocupa `x=0 y=0 w=500 h=700`: o `viewBox` inteiro.
 *
 * E o `viewBox` inteiro, na base de edição, é exatamente
 * `[ORIGEM, ORIGEM + VIEWBOX × ESCALA]` = px **212→812 × 92→932**, que mede
 * **600 × 840** e é 5:7 cravado. Recortar ali põe a arte no lugar 1 : 1, sem
 * registro, sem ajuste e sem número escolhido a olho.
 *
 * 600 × 840 é 1,2 px/u; o maior render do produto tem 425 px de altura
 * (0,607 px/u). O PNG fica ~2× supersampleado, que é o que DPR 2 pede.
 *
 * ---------------------------------------------------------------------------
 * A COR VEM DA RÉGUA; A RAZÃO DE TOM VEM DA ARTE
 * ---------------------------------------------------------------------------
 *
 * O ciano é instrumento de medição e não chega ao aluno. O pano é o da patente,
 * lido de `PATENTES` (`scripts/avatar/patentes.ts`), que `verify:paleta-patentes`
 * trava. O slug do catálogo é `traje-<patente>-<nome>`, então a cor é **derivada
 * do nome do arquivo** — nenhum hexadecimal escrito à mão, e as três opções de
 * uma patente saem no mesmo pano por construção, que é a regra 14 do doc 15.
 *
 * Sombra e luz **não se escolhem**: saem da razão de luminância que a artista já
 * pôs na arte. Medido nesta primeira peça: sombra 0,3290 × massa, luz 1,5506 ×.
 * Aplicar as razões ao pano preserva o volume desenhado e entrega a cor que é lei.
 *
 * **A luz mistura com branco em vez de multiplicar**, e isso não é detalhe: a
 * multiplicação satura o canal em cores claras — o pano do Mestre (`#AEBCCE`,
 * lum 0,73) × 1,55 estoura os três canais e vira branco, perdendo o matiz. A
 * mistura com branco atinge a luminância alvo **exatamente** e nunca estoura. É
 * também o que o produto já faz: `.kk-luz` é `#FFFFFF` com opacidade
 * (`compositor.ts`), ou seja, branco POR CIMA da cor. Aqui isso fica assado.
 *
 * ---------------------------------------------------------------------------
 * O CONTROLE NEGATIVO
 * ---------------------------------------------------------------------------
 *
 * Régua nova entra com controle ao lado — é *o* modo de falha desta rota, e já
 * mordeu cinco vezes (doc 19 §5). Aqui o controle é **remedir a luminância de
 * cada papel no PNG de saída** e comparar com o alvo que a razão da arte pedia.
 * Recolorização que troque o papel de um pixel, ou que estoure um canal em
 * silêncio, aparece como divergência em vez de passar calada.
 *
 * **A tolerância é 0,50 NÍVEL, e não uma porcentagem — a primeira rodada desta
 * régua provou por quê.** Ela comparava a *razão* (sombra ÷ massa) com teto de
 * 0,5%, e reprovou a peça aprovada pelo Doug: razão 0,3290 na arte contra 0,3269
 * na saída, 0,618% de erro. A causa não era a arte. `escurecer` arredonda cada
 * canal para inteiro (`palette.ts:161`), e num tom escuro um nível de RGB vale
 * muito: os canais exatos eram 39,48 / 43,10 / 19,41 e viraram 39 / 43 / 19 —
 * **0,248 nível de luminância** de desvio. O teto do arredondamento é
 * `0,5 × (0,299 + 0,587 + 0,114) = 0,500` nível, porque os coeficientes de
 * Rec. 601 somam 1. Medir em razão relativa castiga o escuro por ser escuro; medir
 * em nível é a régua que 8 bits permitem, e ainda pega papel trocado por dezenas
 * de níveis de folga.
 */

import { mkdirSync } from "fs";
import { basename } from "path";

import sharp from "sharp";

import { TRAJE_BASE, escurecer } from "../../../src/lib/avatar/palette";
import { PATENTES } from "../patentes";
import { ESCALA, LADO, ORIGEM } from "./base";
import { PAPEIS, extrair, type Papel } from "./extrair";
import { luz } from "./pixels";

/** Onde os PNGs de peça nascem. `dev/` porque `public/items/` é policiado. */
export const PASTA_TRAJE = "public/dev/traje";

/** O recorte: o `viewBox` inteiro, em pixels da base de edição. */
export const RECORTE = {
  x: ORIGEM.x,
  y: ORIGEM.y,
  w: Math.round(500 * ESCALA),
  h: Math.round(700 * ESCALA),
} as const;

/**
 * O maior desvio de luminância que o arredondamento de RGB para inteiro pode
 * produzir sozinho. Meio nível em cada canal, e os coeficientes de Rec. 601 somam
 * 1 — logo o pior caso é exatamente 0,5. Acima disso não é quantização: é papel
 * trocado ou canal estourado.
 */
const TETO_QUANTIZACAO = 0.5;

type Rgb = [number, number, number];

const paraRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/**
 * Clareia até a luminância alvo misturando com branco.
 *
 * `L` é linear em RGB (Rec. 601), então `c' = c + t(255 − c)` dá
 * `L' = L + t(255 − L)`, e `t = (alvo − L) / (255 − L)` acerta o alvo exato sem
 * estourar canal nenhum. Mora aqui e não em `palette.ts` de propósito: é conta de
 * esteira de arte, não token de produto — e o produto já faz o equivalente com
 * `#FFFFFF` e opacidade.
 */
function clarearAte(cor: Rgb, alvo: number): Rgb {
  const L = luz(cor[0], cor[1], cor[2]);
  if (alvo <= L) return cor;
  const t = Math.min(1, (alvo - L) / (255 - L));
  return cor.map((c) => Math.round(c + t * (255 - c))) as Rgb;
}

/**
 * O pano da peça, derivado do slug — e a ausência do Aprendiz é deliberada.
 *
 * `PATENTES` começa no tier 1 porque o Aprendiz não tem uniforme: ele veste o
 * macacão de treino da base, que é `TRAJE_BASE.roupa`. É a decisão do doc 21 §7,
 * e é o que faz a opção A do Aprendiz custar zero de arte.
 */
export function panoDoSlug(slug: string): { cor: string; patente: string } {
  const m = /^traje-([a-z]+)-/.exec(slug);
  if (!m) {
    throw new Error(
      `slug "${slug}" fora do formato traje-<patente>-<nome> — a cor sai da patente, ` +
        `e sem ela não há de onde tirar`,
    );
  }
  const patente = m[1];
  if (patente === "aprendiz") return { cor: TRAJE_BASE.roupa, patente };
  const p = PATENTES.find((q) => q.slug === patente);
  if (!p) {
    throw new Error(
      `patente "${patente}" não está em scripts/avatar/patentes.ts — ` +
        `a cor é travada por verify:paleta-patentes e não se inventa aqui`,
    );
  }
  return { cor: p.pano, patente };
}

export interface Peca {
  slug: string;
  patente: string;
  png: string;
  cores: Record<Papel, string>;
  razoes: { sombra: number; luz: number };
  /** A luminância que cada papel DEVIA ter, pela razão medida na arte. */
  alvos: Record<Papel, number>;
  /** A luminância REMEDIDA no PNG de saída — o controle negativo. */
  medidos: Record<Papel, number>;
  pixels: Record<Papel, number>;
  foraDoRecorte: number;
  bytes: number;
}

export async function construir(caminhoArte: string): Promise<Peca> {
  const slug = basename(caminhoArte).replace(/\.png$/i, "");
  const { cor, patente } = panoDoSlug(slug);
  const e = await extrair(caminhoArte);

  // ------------------------------------------------------------ as razões
  const lum = (p: Papel) => {
    const [r, g, b] = e.porPapel[p].corMedia;
    return luz(r, g, b);
  };
  const lMassa = lum("massa");
  const razoes = { sombra: lum("sombra") / lMassa, luz: lum("luz") / lMassa };

  const pano = paraRgb(cor);
  const lPano = luz(pano[0], pano[1], pano[2]);
  const cores: Record<Papel, Rgb> = {
    massa: pano,
    sombra: paraRgb(escurecer(cor, razoes.sombra)),
    luz: clarearAte(pano, lPano * razoes.luz),
    traco: [0, 0, 0],
  };

  // A PEÇA NÃO GANHA CONTORNO RECONSTRUÍDO, e a tentativa está registrada porque
  // ela custou uma rodada.
  //
  // A extração entrega o MIOLO do traço, não o traço: `traco` é o preto que sobrou
  // dentro da máscara da peça, e o rabo antialiasado do contorno, que morre contra
  // o fundo bege, não é preto o bastante para entrar. Medido: p50 7,5 u de banda
  // preta na borda, com 51,6% do perímetro abaixo de 8 u, contra 11,7 u limpos do
  // contorno do tronco.
  //
  // Reconstruir a banda com um anel de `TRACO/2` centrado na fronteira do núcleo
  // colorido levou a borda a p50 15,0 u — um quarto mais pesada que o contorno da
  // cabeça —, e o Doug reprovou na tela: *"regrediu e muito, deixa a borda como
  // estava"*. Quem entrega o contorno do tronco é o compositor, como sempre foi.
  //
  // O contorno fino da arte fica em `docs/achados.md`, não aqui.

  // ------------------------------------------------------------- o recorte
  const { x: X0, y: Y0, w: W, h: H } = RECORTE;
  const saida = Buffer.alloc(W * H * 4); // RGBA, tudo alfa 0 por padrão
  const pixels: Record<Papel, number> = { massa: 0, sombra: 0, luz: 0, traco: 0 };
  let foraDoRecorte = 0;

  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const p = e.papeis[y * LADO + x];
      if (!p) continue;
      const papel = PAPEIS[p - 1];
      pixels[papel]++;
      const xr = x - X0;
      const yr = y - Y0;
      if (xr < 0 || xr >= W || yr < 0 || yr >= H) {
        foraDoRecorte++;
        continue;
      }
      const j = (yr * W + xr) * 4;
      const c = cores[papel];
      saida[j] = c[0];
      saida[j + 1] = c[1];
      saida[j + 2] = c[2];
      saida[j + 3] = 255;
    }
  }

  mkdirSync(PASTA_TRAJE, { recursive: true });
  const png = `${PASTA_TRAJE}/${slug}.png`;
  const buf = await sharp(saida, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(buf).toFile(png);

  // --------------------------------------- o controle: remedir na SAÍDA
  //
  // Lê o PNG que acabou de ser escrito — não o buffer em memória — porque o que
  // vai para a tela é o arquivo, e é dele que a régua tem de falar.
  const { data: cru } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const soma: Record<Papel, { l: number; n: number }> = {
    massa: { l: 0, n: 0 },
    sombra: { l: 0, n: 0 },
    luz: { l: 0, n: 0 },
    traco: { l: 0, n: 0 },
  };
  const chave = (r: number, g: number, b: number) => `${r},${g},${b}`;
  const porCor = new Map<string, Papel>();
  for (const papel of PAPEIS) porCor.set(chave(...cores[papel]), papel);
  for (let i = 0; i < W * H; i++) {
    if (cru[i * 4 + 3] === 0) continue;
    const papel = porCor.get(chave(cru[i * 4], cru[i * 4 + 1], cru[i * 4 + 2]));
    if (!papel) continue;
    soma[papel].l += luz(cru[i * 4], cru[i * 4 + 1], cru[i * 4 + 2]);
    soma[papel].n++;
  }
  const med = (p: Papel) => (soma[p].n ? soma[p].l / soma[p].n : 0);
  const medidos: Record<Papel, number> = {
    massa: med("massa"),
    sombra: med("sombra"),
    luz: med("luz"),
    traco: med("traco"),
  };
  const alvos: Record<Papel, number> = {
    massa: lPano,
    sombra: lPano * razoes.sombra,
    luz: lPano * razoes.luz,
    traco: 0,
  };

  const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  return {
    slug,
    patente,
    png,
    cores: {
      massa: hex(cores.massa),
      sombra: hex(cores.sombra),
      luz: hex(cores.luz),
      traco: hex(cores.traco),
    },
    razoes,
    alvos,
    medidos,
    pixels,
    foraDoRecorte,
    bytes: buf.length,
  };
}

async function principal() {
  const artes = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!artes.length) {
    console.error(
      "uso: npm run arte:traje -- scripts/avatar/arte/<ARTE>.png [outra.png …]\n" +
        "     (uma ou mais; a cor sai do slug via scripts/avatar/patentes.ts)",
    );
    process.exit(1);
  }

  let reprovou = false;
  for (const arte of artes) {
    const p = await construir(arte);
    console.log(`\nP4-T — A PEÇA DE TRAJE — ${arte}\n`);
    console.log(`  slug                ${p.slug}`);
    console.log(`  patente             ${p.patente}   pano ${p.cores.massa}  (patentes.ts)`);
    console.log(
      `  recorte             px ${RECORTE.x}→${RECORTE.x + RECORTE.w} × ` +
        `${RECORTE.y}→${RECORTE.y + RECORTE.h}  =  ${RECORTE.w} × ${RECORTE.h}` +
        `   (o viewBox inteiro, 5:7)`,
    );
    console.log(`  escalaMedida        ausente de propósito → k = 1 no compositor`);

    console.log(`\n  papel      pixels    cor de saída`);
    for (const papel of PAPEIS) {
      console.log(
        `  ${papel.padEnd(9)} ${String(p.pixels[papel]).padStart(6)}    ${p.cores[papel]}`,
      );
    }

    console.log(
      `\n  RAZÃO DE TOM MEDIDA NA ARTE   sombra ${p.razoes.sombra.toFixed(4)} × massa   ` +
        `luz ${p.razoes.luz.toFixed(4)} × massa`,
    );
    console.log(
      `\n  O CONTROLE — luminância que o papel DEVIA ter × a que o PNG de saída tem`,
    );
    console.log(`    papel      alvo     medido    desvio    teto`);
    for (const papel of PAPEIS) {
      const erro = p.medidos[papel] - p.alvos[papel];
      const ok = Math.abs(erro) <= TETO_QUANTIZACAO;
      if (!ok) reprovou = true;
      console.log(
        `    ${papel.padEnd(9)}${p.alvos[papel].toFixed(3).padStart(7)}  ` +
          `${p.medidos[papel].toFixed(3).padStart(8)}  ${erro >= 0 ? "+" : ""}${erro.toFixed(3).padStart(6)}    ` +
          `±${TETO_QUANTIZACAO.toFixed(2)}   ${ok ? "· confere" : "✗ DIVERGE"}`,
      );
    }
    console.log(
      `    o teto é o arredondamento de RGB para inteiro: 0,5 × (0,299+0,587+0,114) = 0,50`,
    );

    console.log(
      `\n  fora do recorte     ${p.foraDoRecorte} px` +
        (p.foraDoRecorte ? `   ✗ a peça sai do viewBox — seria cortada` : `   · nada perdido`),
    );
    console.log(`  escrito             ${p.png}   ${(p.bytes / 1024).toFixed(1)} KB`);
    if (p.foraDoRecorte) reprovou = true;
  }

  if (reprovou) {
    console.error(
      `\n✗ A recolorização não fecha. Não siga para o literal: o PNG na tela não é a\n` +
        `  arte que o Doug aprovou. Desvio acima de ${TETO_QUANTIZACAO} nível quer dizer papel\n` +
        `  trocado ou canal estourado; pixel fora do recorte quer dizer arte fora do viewBox.`,
    );
    process.exit(1);
  }
}

if (process.argv[1] && basename(process.argv[1]) === "traje.ts") {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
