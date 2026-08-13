/**
 * P0-T — A BASE DE EDIÇÃO DO TRONCO: o campo em que o TRAJE é desenhado.
 *
 * ---------------------------------------------------------------------------
 * A BASE É A MESMA. O QUE MUDA É O CAMPO, E ISSO NÃO É PREGUIÇA
 * ---------------------------------------------------------------------------
 *
 * O doc 21 (§7, Bloco 2, "a esteira que a próxima sessão constrói") prevê a
 * linha *"base de edição — tronco em foco"*. Reenquadrar foi considerado e
 * **recusado**, com a conta na mesa:
 *
 *  - a transformação pixel ↔ `viewBox` mora em `base.ts` como **constante de
 *    módulo** (`ESCALA`, `ORIGEM`), e é lida pelo Gate −1, pela extração, pelo
 *    contorno, pelo conversor e pelas cinco réguas de diagnóstico. Um segundo
 *    enquadramento não é um arquivo novo: é um segundo sistema de coordenadas
 *    atravessando a rota inteira;
 *  - o ganho é pequeno. A cabeça, que precisa continuar no quadro para o Gate −1
 *    ter o que comparar, já ocupa 437 × 362 px — o zoom máximo com o boneco
 *    inteiro dentro dos 1024 é **1,65 px/u contra 1,2**, +38% linear;
 *  - e o campo do tronco **já é grande**: 326 × 344 px, contra os 437 × 362 px
 *    da cabeça que produziram o chanel e o espetado, as duas peças que o Doug
 *    aprovou.
 *
 * Então a base de edição do traje é `base-oficial.png`, byte a byte a mesma que
 * o cabelo usa — e a amarra da §9.1 do doc 19 (*"a base de edição não encolhe"*)
 * continua valendo sem exceção, em vez de ganhar uma.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE PROGRAMA FAZ, ENTÃO
 * ---------------------------------------------------------------------------
 *
 *  1. **prova que a base está viva**: recompõe o SVG com a mesma chamada de
 *     `base-oficial.ts` e confere os dois hashes contra o manifesto. Se o
 *     compositor tiver andado desde 2026-08-10, a arte nasceria desenhada sobre
 *     um boneco que o produto não desenha mais — e o Gate −1 acusaria isso só
 *     depois de o Doug ter desenhado;
 *  2. **mede o campo**: quanto do tronco é campo de desenho, quanto dele a
 *     criança vê (o resto some atrás da cabeça), e onde ele cai no PNG;
 *  3. **desenha o campo** em `base-tronco-campo.png` — diagnóstico, para o olho
 *     do Doug. **Não é o arquivo que sobe para o Gemini.** O que sobe é a base
 *     limpa: qualquer marca aqui seria copiada pelo gerador.
 *
 * O campo e a cabeça são desenhados por `<use>` dos paths que o próprio
 * compositor pôs no `<defs>` — nunca por uma segunda descrição da forma. É a
 * mesma razão de `base-oficial.ts:90-95`: uma cópia do contorno concordaria com
 * a intenção, e não com o código.
 *
 * ---------------------------------------------------------------------------
 * A INVERSÃO DA PROTEÇÃO NÃO ACONTECE AQUI
 * ---------------------------------------------------------------------------
 *
 * `REGIOES_QUE_REPROVAM = ["rosto", "corpo"]` (`base.ts:281`) continua como
 * está. Para traje o corpo é o campo e a cabeça é que precisa ficar intacta —
 * mas essa é a esteira do Gate −1, e ela se constrói **quando a arte voltar**,
 * contra a arte de verdade. Semear a inversão antes seria escrever régua sem ter
 * o que medir, que é o modo de falha nº 1 desta rota (aprovação por vacuidade,
 * doc 19 §5).
 */

import { mkdirSync, existsSync, readFileSync } from "fs";
import { basename } from "path";

import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, TRACO, TRONCO } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarSvg } from "../render-svg";
import {
  ESCALA,
  FUNDO,
  LADO,
  MANIFESTO,
  ORIGEM,
  PASTA,
  PNG_BASE,
  embrulhar,
  paraPx,
  selo,
} from "./base";
import { carregar, luz } from "./pixels";

/** A mesma pele da base oficial, pelo mesmo motivo (`base-oficial.ts:50-61`). */
const PELE_DA_BASE = PELE[2];

const CAMPO = `${PASTA}/base-tronco-campo.png`;
/** Máscaras cruas, só para a conta. Regeneradas a cada rodada. */
const M_TRONCO = `${PASTA}/.t-tronco.png`;
const M_CABECA = `${PASTA}/.t-cabeca.png`;

/** O `<defs>` do compositor, para o `<use>` resolver fora do `<svg>` interno. */
const defsDe = (svg: string): string => {
  const m = svg.match(/<defs>[\s\S]*?<\/defs>/);
  if (!m) throw new Error("o compositor não emitiu <defs> — a extração do campo pressupõe ele");
  return m[0];
};

/** Um `<use>` no sistema de coordenadas do `viewBox`, posto sobre o canvas. */
const noViewBox = (conteudo: string) =>
  `<g transform="translate(${ORIGEM.x},${ORIGEM.y}) scale(${ESCALA})">${conteudo}</g>`;

/** Uma máscara chapada: a forma em preto sobre branco, no canvas inteiro. */
const svgDaMascara = (defs: string, conteudo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" ` +
  `width="${LADO}" height="${LADO}">` +
  `<rect width="${LADO}" height="${LADO}" fill="#FFFFFF"/>` +
  defs +
  noViewBox(conteudo) +
  `</svg>`;

/** Preto = dentro. O corte em 128 é folgado: a forma é chapada, não tem meio-tom. */
async function mascara(caminho: string): Promise<Uint8Array> {
  const im = await carregar(caminho, "#FFFFFF");
  const m = new Uint8Array(im.w * im.h);
  for (let i = 0; i < m.length; i++) {
    const j = i * 3;
    m[i] = luz(im.data[j], im.data[j + 1], im.data[j + 2]) < 128 ? 1 : 0;
  }
  return m;
}

const caixaDa = (m: Uint8Array) => {
  let x0 = LADO,
    y0 = LADO,
    x1 = -1,
    y1 = -1,
    area = 0;
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      if (!m[y * LADO + x]) continue;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1, area };
};

/**
 * AS DUAS MÁSCARAS DO CAMPO, para quem precisar delas — a esteira do traje
 * precisa.
 *
 * `tronco` é o `clipPath` que corta a tinta; `cabeca` é a silhueta externa que a
 * cobre por cima. Separá-las é o que permite a `arte:folha-traje` responder
 * "quanto o clip cortou?" sem misturar a resposta com "quanto a cabeça tapou?" —
 * a primeira versão daquela régua somava as duas e devolvia 25,59% de corte numa
 * peça que o clip mal toca.
 */
export async function mascarasDoCampo(
  navegador: Awaited<ReturnType<typeof abrirNavegador>>,
): Promise<{ tronco: Uint8Array; cabeca: Uint8Array }> {
  const interno = compor({ pele: PELE_DA_BASE, cabelo: CABELO[0], ns: "base", escala: 1 });
  const defs = defsDe(interno);
  await renderizarSvg(
    navegador,
    svgDaMascara(defs, `<use href="#base-p-tronco" fill="#000000"/>`),
    LADO,
    LADO,
    M_TRONCO,
    "#FFFFFF",
  );
  await renderizarSvg(
    navegador,
    svgDaMascara(
      defs,
      `<use href="#base-p-cabeca" fill="#000000" stroke="#000000" stroke-width="${TRACO}"/>`,
    ),
    LADO,
    LADO,
    M_CABECA,
    "#FFFFFF",
  );
  return { tronco: await mascara(M_TRONCO), cabeca: await mascara(M_CABECA) };
}

async function principal() {
  mkdirSync(PASTA, { recursive: true });

  // -------------------------------------------------------------- a amarra
  //
  // A MESMA CHAMADA de `base-oficial.ts:83`, letra por letra. Se ela deixar de
  // produzir o SVG do manifesto, a base envelheceu e nenhuma arte nova deve ser
  // desenhada sobre ela.
  const interno = compor({ pele: PELE_DA_BASE, cabelo: CABELO[0], ns: "base", escala: 1 });
  const svg = embrulhar(interno);

  if (!existsSync(MANIFESTO) || !existsSync(PNG_BASE)) {
    throw new Error(`base ausente — rode 'npm run arte:base' antes (${PNG_BASE})`);
  }
  const manifesto = JSON.parse(readFileSync(MANIFESTO, "utf-8")) as {
    versao: string;
    hash: { png: string; svg: string };
  };
  const seloSvg = selo(svg);
  const seloPng = selo(readFileSync(PNG_BASE));
  const svgConfere = seloSvg === manifesto.hash.svg;
  const pngConfere = seloPng === manifesto.hash.png;

  // ------------------------------------------------------------- as máscaras
  const defs = defsDe(interno);
  const navegador = await abrirNavegador();

  // O campo é o `clipPath` do tronco — literalmente o mesmo path que
  // `compor()` usa para cortar a tinta do traje (`compositor.ts:894`). Fill sem
  // stroke: a silhueta externa nasce do traço, que é desenhado DEPOIS e por cima.
  await renderizarSvg(
    navegador,
    svgDaMascara(defs, `<use href="#base-p-tronco" fill="#000000"/>`),
    LADO,
    LADO,
    M_TRONCO,
    "#FFFFFF",
  );
  // A cabeça com o traço inteiro: é a silhueta EXTERNA que tapa o tronco, e é
  // ela que decide o que da peça a criança nunca vai ver.
  await renderizarSvg(
    navegador,
    svgDaMascara(
      defs,
      `<use href="#base-p-cabeca" fill="#000000" stroke="#000000" stroke-width="${TRACO}"/>`,
    ),
    LADO,
    LADO,
    M_CABECA,
    "#FFFFFF",
  );

  const mTronco = await mascara(M_TRONCO);
  const mCabeca = await mascara(M_CABECA);
  const mVisivel = new Uint8Array(mTronco.length);
  for (let i = 0; i < mTronco.length; i++) mVisivel[i] = mTronco[i] && !mCabeca[i] ? 1 : 0;

  const campo = caixaDa(mTronco);
  const visivel = caixaDa(mVisivel);
  const cabeca = caixaDa(mCabeca);

  // ----------------------------------------------------------- o diagnóstico
  const overlay = svg.replace(
    /<\/svg>$/,
    noViewBox(
      `<use href="#base-p-tronco" fill="#2B5BD9" fill-opacity="0.34"/>` +
        `<use href="#base-p-cabeca" fill="#D92B2B" fill-opacity="0.34" ` +
        `stroke="#D92B2B" stroke-opacity="0.34" stroke-width="${TRACO}"/>`,
    ) + `</svg>`,
  );
  await renderizarSvg(navegador, overlay, LADO, LADO, CAMPO, FUNDO);
  await navegador.close();

  // ------------------------------------------------------------------ laudo
  const emU = (px: number) => px / ESCALA;
  const pxDoTopoVisivel = paraPx(0, CAIXA_CABECA.y1).y;

  console.log(`P0-T — A BASE DE EDIÇÃO DO TRONCO  [${manifesto.versao}]\n`);
  console.log(`  A BASE (a mesma do cabelo — nada de novo sobe para o gerador)`);
  console.log(`    arquivo a anexar    ${PNG_BASE}`);
  console.log(`    canvas              ${LADO} × ${LADO} px, fundo ${FUNDO}`);
  console.log(`    escala              ${ESCALA} px/u   origem (${ORIGEM.x}, ${ORIGEM.y}) px`);
  console.log(
    `    hash do SVG         ${svgConfere ? "· CONFERE" : "✗ DIVERGE"}  ${seloSvg.slice(0, 16)}…`,
  );
  console.log(
    `    hash do PNG         ${pngConfere ? "· CONFERE" : "✗ DIVERGE"}  ${seloPng.slice(0, 16)}…`,
  );

  console.log(`\n  O CAMPO — o clipPath do tronco, que é onde a tinta do traje pode morar`);
  console.log(
    `    em unidades         y ${TRONCO.yTopo} → ${TRONCO.yBase}   ` +
      `(topo escondido sob a cabeça, que termina em ${CAIXA_CABECA.y1})`,
  );
  console.log(
    `    no PNG              x ${campo.x0} → ${campo.x1}  y ${campo.y0} → ${campo.y1} px   ` +
      `(${campo.x1 - campo.x0 + 1} × ${campo.y1 - campo.y0 + 1})`,
  );
  console.log(
    `    área                ${campo.area.toLocaleString("pt-BR")} px   ` +
      `(${((100 * campo.area) / (LADO * LADO)).toFixed(2)}% do canvas)`,
  );

  console.log(`\n  O QUE A CRIANÇA VÊ — o campo menos a cabeça, que é desenhada por cima`);
  console.log(
    `    no PNG              x ${visivel.x0} → ${visivel.x1}  y ${visivel.y0} → ${visivel.y1} px   ` +
      `(${visivel.x1 - visivel.x0 + 1} × ${visivel.y1 - visivel.y0 + 1})`,
  );
  console.log(
    `    área                ${visivel.area.toLocaleString("pt-BR")} px   ` +
      `(${((100 * visivel.area) / campo.area).toFixed(1)}% do campo)`,
  );
  console.log(
    `    perdido sob a cabeça ${(campo.area - visivel.area).toLocaleString("pt-BR")} px   ` +
      `(o queixo cruza o tronco em y ${pxDoTopoVisivel.toFixed(1)} px = ${CAIXA_CABECA.y1} u)`,
  );
  console.log(
    `    em unidades         ${emU(visivel.x1 - visivel.x0 + 1).toFixed(1)} × ` +
      `${emU(visivel.y1 - visivel.y0 + 1).toFixed(1)} u`,
  );

  console.log(`\n  O QUE NÃO PODE MUDAR — a cabeça, silhueta externa (fill + traço de ${TRACO} u)`);
  console.log(
    `    no PNG              x ${cabeca.x0} → ${cabeca.x1}  y ${cabeca.y0} → ${cabeca.y1} px   ` +
      `(${cabeca.x1 - cabeca.x0 + 1} × ${cabeca.y1 - cabeca.y0 + 1})`,
  );

  // Este bloco BIFURCA de propósito, e a bifurcação é o conserto do achado G18.
  // Ele dizia "a arte é pintada CHAPADA; quem faz o volume é o compositor" — o
  // contrário do que o PEDIDO-TRAJE.md pede desde 2026-08-12. Quem seguisse o
  // terminal desenhava a peça SEM a sombra de contato, esperando que o sistema a
  // repusesse, e ela não vinha: `tintaTronco()` suprime as duas camadas quando
  // existe `tinta.png` (compositor.ts:391), e toda peça desta esteira tem uma.
  console.log(`\n  O QUE O SISTEMA DESENHA POR CIMA — e depende de haver arte`);
  console.log(`    COM arte (o seu caso, sempre nesta esteira):`);
  console.log(`      contorno do tronco  ${TRACO} u, desenhado DEPOIS da tinta (compositor.ts:895)`);
  console.log(`      e MAIS NADA         → o volume inteiro é da ARTE, inclusive a`);
  console.log(`                            sombra de contato logo abaixo do queixo`);
  console.log(`    SEM arte (o macacão bege da base, só para você saber o que é o quê):`);
  console.log(`      sombra do queixo    contato da cabeça no tronco`);
  console.log(`      plano lateral       escurecimento da lateral, opacidade .42`);

  console.log(`\n  escritos            ${CAMPO}   (diagnóstico — NÃO sobe para o gerador)`);
  console.log(`                      ${M_TRONCO}\n                      ${M_CABECA}`);

  if (!svgConfere || !pngConfere) {
    console.error(
      `\n✗ A BASE DIVERGE DO MANIFESTO. Não desenhe sobre ela: o Gate −1 vai acusar\n` +
        `  um boneco que ninguém moveu de propósito. Rode 'npm run arte:base' e releia\n` +
        `  o doc 19 §9.1 antes de regravar o manifesto — as artes já aprovadas foram\n` +
        `  desenhadas sobre a base atual.`,
    );
    process.exit(1);
  }
}

// Só roda quando é ELE o programa chamado. Sem esta guarda, `mascarasDoCampo`
// não poderia ser importada: o import executaria o laudo inteiro.
if (process.argv[1] && basename(process.argv[1]) === "base-tronco.ts") {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
