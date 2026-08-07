/**
 * AS FIXTURES — imagens sintéticas para calibrar os tetos SEM olhar a arte real.
 *
 * A regra é do pipeline vigente e está escrita em `gates.md`: *"teto calibrado na
 * peça que se quer aprovar aprova o defeito junto"*. Cada fixture aqui deriva da
 * própria base oficial e viola **uma** coisa, para o gate poder ser medido contra
 * um defeito que se sabe existir e um tamanho que se sabe qual é.
 *
 *   A  dimensões      1000 × 1024              → REPROVA
 *   B  deslocamento   figura 3 px para a direita e para baixo   → REPROVA
 *   C  escala         figura a 103% no mesmo canvas             → REPROVA
 *   D  recorte        60 px cortados da esquerda, recolocado    → REPROVA
 *   E  antialiasing   mesma geometria, borda amolecida          → APROVA
 *   F  corpo          quadrado de 14 u desenhado no tronco      → REPROVA
 *
 * E mais a `simulada.png`, que **não é fixture de gate**: é uma arte de melhor
 * caso, com cabelo espetado em ciano desenhado sobre a base. Ela existe porque a
 * prova precisa de uma entrada enquanto a arte real do Gemini não chega, e está
 * marcada como simulação em todo lugar que a consome — uma arte que o próprio
 * programa desenhou não prova nada sobre o gerador, só sobre o resto da cadeia.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O CABELO SIMULADO TEM PONTAS QUE PASSAM DO TOPO DO `viewBox`
 * ---------------------------------------------------------------------------
 *
 * Porque é o defeito que a rodada anterior não conseguiu mostrar. Ela mediu **0
 * pontas externas** no render a 56 px e silhuetas idênticas pixel a pixel entre a
 * peça nova e a aprovada — o cabelo carregava as pontas e o `clip-path` do crânio
 * as apagava. Uma fixture cujas pontas ficam todas dentro do crânio deixaria a
 * cadeia inteira passar verde sem nunca tocar no problema.
 *
 * As pontas sobem até ~25 unidades ACIMA de y = 0, que é fora do `viewBox`. É
 * deliberado: o teto de 39 u acima da cabeça (doc 14, T1.5) é um fato medido sem
 * correção, e a folha precisa mostrar onde ele corta.
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CABECA, CAIXA_CABECA, TRACO } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarSvg } from "../render-svg";
import { FUNDO, LADO, PASTA, PNG_BASE, embrulhar } from "./base";

export const PASTA_FIXTURES = `${PASTA}/fixtures`;

/** A paleta instrumental. Os mesmos três tons que o pedido ao Gemini declara. */
export const TINTA = {
  massa: "#00C8C8",
  sombra: "#00696E",
  luz: "#7DF0F0",
  contorno: "#000000",
} as const;

// ---------------------------------------------------------------------------
// O cabelo simulado
// ---------------------------------------------------------------------------

/**
 * A silhueta do cabelo espetado, derivada do contorno do crânio.
 *
 * Derivada e não desenhada à mão pelo motivo de sempre neste repositório: uma
 * segunda descrição da cabeça divergiria da primeira. A massa segue o crânio
 * afastada `AFASTA` unidades, e a cada dois pontos do contorno sobe uma ponta de
 * `PONTA` unidades na direção que sai do centro da cabeça.
 */
const AFASTA = 10;
const PONTA = 62;

function silhuetaDoCabelo(): string {
  const cx = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
  const cy = CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.55;
  // Só a parte de cima do crânio: da têmpora esquerda, por cima, à direita.
  const alto = CABECA.contorno.filter((p) => p.y <= CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.52);
  // Ordena em ângulo para a poligonal andar de um lado ao outro sem cruzar.
  const ang = (p: { x: number; y: number }) => Math.atan2(p.y - cy, p.x - cx);
  const ordenado = [...alto].sort((a, b) => ang(b) - ang(a));

  const fora = (p: { x: number; y: number }, d: number) => {
    const vx = p.x - cx;
    const vy = p.y - cy;
    const n = Math.hypot(vx, vy) || 1;
    return { x: p.x + (vx / n) * d, y: p.y + (vy / n) * d };
  };

  const pontos: { x: number; y: number }[] = [];
  ordenado.forEach((p, i) => {
    pontos.push(fora(p, AFASTA));
    if (i % 2 === 1 && i < ordenado.length - 1) {
      const meio = {
        x: (p.x + ordenado[i + 1].x) / 2,
        y: (p.y + ordenado[i + 1].y) / 2,
      };
      pontos.push(fora(meio, AFASTA + PONTA));
    }
  });

  // Fecha por baixo: desce a lateral direita, cruza a testa e sobe a esquerda.
  const yFranja = CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.44;
  const yLado = CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.62;
  const fim = pontos[pontos.length - 1];
  const ini = pontos[0];
  const fecho = [
    { x: fim.x, y: yLado },
    { x: cx + 96, y: yFranja + 16 },
    { x: cx + 30, y: yFranja + 30 },
    { x: cx - 44, y: yFranja + 6 },
    { x: cx - 104, y: yFranja + 26 },
    { x: ini.x, y: yLado },
  ];
  return (
    [...pontos, ...fecho].map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    " Z"
  );
}

/** A sombra: a mesma silhueta, rebaixada, e clipada pela massa. */
function camadasDoCabelo(): string {
  const d = silhuetaDoCabelo();
  const cx = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
  const yFranja = CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.44;
  const sombra =
    `M${CAIXA_CABECA.x0 - 40} ${yFranja - 40} L${CAIXA_CABECA.x1 + 40} ${yFranja - 46} ` +
    `L${CAIXA_CABECA.x1 + 40} ${yFranja + 60} L${CAIXA_CABECA.x0 - 40} ${yFranja + 60} Z`;
  const luz =
    `M${cx - 118} ${CAIXA_CABECA.y0 + 26} L${cx - 40} ${CAIXA_CABECA.y0 + 12} ` +
    `L${cx - 26} ${CAIXA_CABECA.y0 + 62} L${cx - 112} ${CAIXA_CABECA.y0 + 78} Z`;
  return (
    `<defs><clipPath id="sim-c"><path d="${d}"/></clipPath></defs>` +
    `<path d="${d}" fill="${TINTA.massa}" stroke="${TINTA.contorno}" stroke-width="${TRACO}" ` +
    `stroke-linejoin="round"/>` +
    `<g clip-path="url(#sim-c)">` +
    `<path d="${sombra}" fill="${TINTA.sombra}"/>` +
    `<path d="${luz}" fill="${TINTA.luz}"/>` +
    `</g>`
  );
}

// ---------------------------------------------------------------------------
// As seis fixtures do gate
// ---------------------------------------------------------------------------

async function principal() {
  mkdirSync(PASTA_FIXTURES, { recursive: true });
  const navegador = await abrirNavegador();

  // A arte simulada: a base com o cabelo por cima, no MESMO embrulho.
  // `escala: 1`: a simulada é desenhada SOBRE a base de edição, que não encolhe.
  const interno = compor({ pele: PELE[2], cabelo: CABELO[0], ns: "sim", escala: 1 });
  const comCabelo = interno.replace(/<\/svg>$/, camadasDoCabelo() + `</svg>`);
  await renderizarSvg(
    navegador,
    embrulhar(comCabelo),
    LADO,
    LADO,
    `${PASTA}/simulada.png`,
    FUNDO,
  );
  await navegador.close();

  const base = sharp(PNG_BASE);
  const p = (n: string) => `${PASTA_FIXTURES}/${n}.png`;

  // A — dimensões
  await base.clone().resize(1000, LADO, { fit: "fill" }).toFile(p("a-dimensoes"));

  // B — deslocamento de 3 px
  await base
    .clone()
    .extract({ left: 0, top: 0, width: LADO - 3, height: LADO - 3 })
    .extend({ left: 3, top: 3, background: FUNDO })
    .toFile(p("b-deslocamento"));

  // C — escala a 103%, recortada de volta ao canvas
  const k = 1.03;
  const lado103 = Math.round(LADO * k);
  const corte = Math.round((lado103 - LADO) / 2);
  await base
    .clone()
    .resize(lado103, lado103)
    .extract({ left: corte, top: corte, width: LADO, height: LADO })
    .toFile(p("c-escala"));

  // D — 60 px cortados da esquerda e recolocado no mesmo canvas
  await base
    .clone()
    .extract({ left: 60, top: 0, width: LADO - 60, height: LADO })
    .extend({ right: 60, background: FUNDO })
    .toFile(p("d-recorte"));

  // E — só antialiasing: a mesma geometria, borda amolecida
  await base.clone().blur(0.6).toFile(p("e-antialias"));

  // F — um quadrado de 14 u desenhado no tronco
  const lado14 = Math.round(14 * 1.2);
  const selo = Buffer.alloc(lado14 * lado14 * 3, 0);
  await base
    .clone()
    .composite([
      { input: selo, raw: { width: lado14, height: lado14, channels: 3 }, left: 500, top: 700 },
    ])
    .toFile(p("f-corpo"));

  console.log(`FIXTURES escritas em ${PASTA_FIXTURES}/`);
  console.log(`  a-dimensoes  b-deslocamento  c-escala  d-recorte  e-antialias  f-corpo`);
  console.log(`\nARTE SIMULADA (não é fixture de gate): ${PASTA}/simulada.png`);
}

if (process.argv[1]?.endsWith("fixtures.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
