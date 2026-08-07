/**
 * P0 — ESCREVE A BASE OFICIAL: o PNG que o Doug entrega ao Gemini.
 *
 * Três arquivos, e cada um tem um papel distinto:
 *
 *  - `base-oficial.png` — o que sobe para o Gemini **e** o que o Gate −1 compara
 *    depois. É o MESMO arquivo nos dois papéis, de propósito: se a base subisse
 *    por um render e fosse comparada contra outro, toda diferença de rasterizador
 *    entraria na conta como se fosse o Gemini tendo mexido no boneco;
 *  - `base-oficial.svg` — a fonte do PNG, para conferir que é o compositor real;
 *  - `base-oficial.json` — o manifesto: versão, hash dos dois, o canvas, a
 *    transformação e as regiões. É o que a rota lê para saber contra o que está
 *    medindo, em vez de alguém escolher a base na mão a cada execução.
 *
 * Mais `base-regioes.png`, que é diagnóstico: a base com as regiões pintadas por
 * cima, para a divisão poder ser conferida com o olho e não só no JSON.
 *
 * O render é o Chromium do Playwright, e não o `sharp`, pela razão escrita em
 * `render-svg.ts`: o destino é o navegador, e o `sharp` usa librsvg, que suporta
 * um subconjunto diferente. A base é o objeto de comparação de tudo que vem
 * depois — ela precisa ser o que o produto de verdade desenha.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";

import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
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
  ROSTO,
  SOBRANCELHAS,
  SVG_BASE,
  Y_FIM_TRONCO,
  Y_QUEIXO,
  embrulhar,
  noCorpo,
  paraPx,
  paraUnidade,
  selo,
} from "./base";

/**
 * A PELE DA BASE OFICIAL — e ela é uma escolha com consequência.
 *
 * O tom entra na arte que o Gemini recebe, e o Gemini vai desenhar o cabelo
 * ENCOSTADO nele. `PELE[2]` (`#E9B183`) é o meio da rampa: claro o bastante para
 * o contorno preto separar, escuro o bastante para não fundir com o fundo
 * `#FBF8F5`. Os extremos da rampa fariam uma das duas fronteiras sumir.
 *
 * Não é escolha do aluno nem entra no produto: é o corpo de prova. A peça que sai
 * daqui é recolorível, então serve para os 8 tons.
 */
const PELE_DA_BASE = PELE[2];

/** A versão da base. Muda quando a geometria ou o compositor mudarem. */
const VERSAO = "base-oficial-v1";

async function principal() {
  mkdirSync(PASTA, { recursive: true });

  // Careca de propósito: sem `modeloCabelo`, `compor()` não emite a camada nem as
  // duas custom properties do cabelo — o SVG sai byte a byte igual ao que o
  // Bloco 1d aprovou (ver `tipos.ts`, `EstadoAvatar.modeloCabelo`).
  // `escala: 1` É A AMARRA, e ela é explícita desde que os 92% viraram padrão.
  //
  // A base de EDIÇÃO não encolhe. Ela existe para o Doug desenhar em cima dela e a
  // arte voltar registrada contra o sistema de coordenadas interno — se ela
  // encolhesse, toda arte já gerada passaria a medir contra um boneco que ele nunca
  // viu, e o Gate −1 acusaria uma escala que ninguém mudou.
  //
  // Enquanto o padrão era 1, isto era estrutural: o campo ausente não emitia
  // transformação nenhuma. Agora é uma linha que alguém pode apagar, e por isso
  // `arte:escala` confere o hash deste PNG contra o manifesto a cada rodada de
  // `verify:arte`.
  const interno = compor({ pele: PELE_DA_BASE, cabelo: CABELO[0], ns: "base", escala: 1 });
  const svg = embrulhar(interno);
  writeFileSync(SVG_BASE, svg, "utf-8");

  const navegador = await abrirNavegador();
  await renderizarSvg(navegador, svg, LADO, LADO, PNG_BASE, FUNDO);

  // O diagnóstico: as regiões por cima da base, para a divisão ser vista.
  //
  // O corpo é desenhado varrendo o predicado `noCorpo` linha a linha, e não a
  // partir de uma segunda descrição da forma. É o mesmo motivo de sempre: uma
  // cópia do contorno para o overlay poderia divergir do que o gate mede, e o
  // desenho concordaria com a intenção em vez de com o código.
  const caixaPx = (c: { x0: number; y0: number; x1: number; y1: number }, cor: string) => {
    const a = paraPx(c.x0, c.y0);
    const b = paraPx(c.x1, c.y1);
    return (
      `<rect x="${a.x}" y="${a.y}" width="${b.x - a.x}" height="${b.y - a.y}" ` +
      `fill="${cor}" fill-opacity="0.35" stroke="${cor}" stroke-width="3"/>`
    );
  };
  const faixasDoCorpo = () => {
    let saida = "";
    for (let yPx = 0; yPx < LADO; yPx += 4) {
      let ini = -1;
      for (let xPx = 0; xPx <= LADO; xPx++) {
        const u = paraUnidade(xPx, yPx);
        const dentro = xPx < LADO && noCorpo(u.x, u.y);
        if (dentro && ini < 0) ini = xPx;
        if (!dentro && ini >= 0) {
          saida += `<rect x="${ini}" y="${yPx}" width="${xPx - ini}" height="4" fill="#2B5BD9" fill-opacity="0.35"/>`;
          ini = -1;
        }
      }
    }
    return saida;
  };
  const overlay = svg.replace(
    /<\/svg>$/,
    caixaPx(ROSTO, "#D92B2B") +
      caixaPx(SOBRANCELHAS, "#E8A33D") +
      faixasDoCorpo() +
      `</svg>`,
  );
  await renderizarSvg(navegador, overlay, LADO, LADO, `${PASTA}/base-regioes.png`, FUNDO);
  await navegador.close();

  const png = readFileSync(PNG_BASE);
  const manifesto = {
    versao: VERSAO,
    gerado: "P0",
    canvas: { largura: LADO, altura: LADO, fundo: FUNDO },
    viewBox: { w: VIEWBOX.w, h: VIEWBOX.h },
    transformacao: {
      escala: ESCALA,
      origem: ORIGEM,
      comentario: "x_u = (x_px - origem.x) / escala; y_u = (y_px - origem.y) / escala",
    },
    pele: PELE_DA_BASE,
    regioes: {
      rosto: ROSTO,
      sobrancelhas: { ...SOBRANCELHAS, reprova: false },
      corpo: {
        yQueixo: Y_QUEIXO,
        yFimTronco: Y_FIM_TRONCO,
        comentario: "silhueta do tronco entre as duas alturas; abaixo, o canvas inteiro",
      },
    },
    caixaCabeca: CAIXA_CABECA,
    hash: { png: selo(png), svg: selo(svg) },
  };
  writeFileSync(MANIFESTO, JSON.stringify(manifesto, null, 2) + "\n", "utf-8");

  // ------------------------------------------------------------------ laudo
  const folgaTopo = paraUnidade(0, 0).y;
  const folgaLado = paraUnidade(0, 0).x;
  const coroa = paraPx(CAIXA_CABECA.x0, CAIXA_CABECA.y0);
  const queixo = paraPx(CAIXA_CABECA.x1, CAIXA_CABECA.y1);

  console.log(`P0 — BASE OFICIAL  [${VERSAO}]\n`);
  console.log(`  canvas              ${LADO} × ${LADO} px, fundo ${FUNDO}`);
  console.log(`  viewBox             ${VIEWBOX.w} × ${VIEWBOX.h} u`);
  console.log(`  escala              ${ESCALA} px/u   origem (${ORIGEM.x}, ${ORIGEM.y}) px`);
  console.log(`  figura no canvas    ${VIEWBOX.w * ESCALA} × ${VIEWBOX.h * ESCALA} px`);
  console.log(
    `  cabeça no canvas    x ${coroa.x.toFixed(1)}→${queixo.x.toFixed(1)}  ` +
      `y ${coroa.y.toFixed(1)}→${queixo.y.toFixed(1)} px`,
  );
  console.log(
    `  folga p/ ponta      ${(-folgaTopo).toFixed(1)} u acima do viewBox ` +
      `(+${CAIXA_CABECA.y0.toFixed(1)} u até a coroa) · ${(-folgaLado).toFixed(1)} u de cada lado`,
  );
  console.log(`  pele                ${PELE_DA_BASE}`);
  console.log(
    `  rosto protegido     x ${ROSTO.x0.toFixed(1)}→${ROSTO.x1.toFixed(1)}  ` +
      `y ${ROSTO.y0.toFixed(1)}→${ROSTO.y1.toFixed(1)} u   (reprova)`,
  );
  console.log(
    `  sobrancelhas        y ${SOBRANCELHAS.y0.toFixed(1)}→${SOBRANCELHAS.y1.toFixed(1)} u   ` +
      `(só relata — franja legítima passa aqui)`,
  );
  console.log(
    `  corpo protegido     silhueta do tronco de y ${Y_QUEIXO.toFixed(1)} a ` +
      `${Y_FIM_TRONCO.toFixed(1)} u; abaixo, o canvas inteiro   (reprova)`,
  );
  console.log(`  bytes do SVG        ${Buffer.byteLength(svg, "utf-8")}`);
  console.log(`  bytes do PNG        ${png.length}`);
  console.log(`\n  hash png            ${manifesto.hash.png}`);
  console.log(`  hash svg            ${manifesto.hash.svg}`);
  console.log(`\n  escritos            ${PNG_BASE}\n                      ${SVG_BASE}`);
  console.log(`                      ${MANIFESTO}\n                      ${PASTA}/base-regioes.png`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
