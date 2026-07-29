/**
 * Boneco base do avatar v4 (Bloco 2).
 *
 * Sucede `prototipo/boneco.ts`, que continua servindo a `/dev/avatar` até o
 * Bloco 5 removê-lo. O protótipo provou a proporção; este é a arte.
 *
 * REFERÊNCIA: quatro imagens do usuário em 2026-07-29 — herói chibi de RPG;
 * o mesmo sem capa, de camiseta e bermuda, mãos abertas; um close do rosto;
 * o mesmo careca; e a versão feminina, que é **o mesmo rosto** com cabelo
 * longo. A última confirmou o desenho do sistema: quem define a leitura de
 * gênero é o slot `hair`, não o rosto.
 *
 * **A BASE É DESENHADA CARECA, E NUNCA É VISTA CARECA.** Ver `cabelos.ts`.
 *
 * TODA PROPORÇÃO AQUI FOI MEDIDA nas referências, normalizada pela
 * meia-largura do crânio. As seis primeiras rodadas foram chutadas, e o
 * resultado foi seis rodadas corrigindo proporção.
 *
 * A GEOMETRIA USA CURVA, NÃO RETÂNGULO ARREDONDADO. Foi o diagnóstico que
 * fechou aquelas seis rodadas: `poligono()` produz caixas de canto redondo, e
 * caixa nunca lê como membro. Ver `curvas.ts`. `poligono()` continua servindo
 * ao que é duro de verdade — bota, cinto, fivela.
 */

import { escurecer, CABELO, LINHA, PELE, TRAJE_BASE } from "../palette";
import { cabelo, type ModeloCabelo } from "./cabelos";
import { elipse, peca, poligono, n1, type Ponto } from "./formas";
import { curvaFechada, espinhaReta, formaAfilada } from "./curvas";

/** Canvas 4:5 do v4 — os 4 tamanhos são recortes deste. */
export const LARGURA = 400;
export const ALTURA = 500;

const CX = LARGURA / 2;
const CHAO = 482;

/**
 * Cabeça careca = 36% da figura; com cabelo = 39%. Isso é ~1:2,6, e não o 1:3
 * da T0.12.
 *
 * **A T0.12 continua valendo como método** — ela mediu que abaixo de 1:3 o
 * acabamento do uniforme (gola, cinto, divisa) começa a sumir a 56 px. A
 * referência aprovada é mais cabeçuda que isso, então o risco que ela apontou
 * volta a existir e vai ser conferido no 2.6, com o uniforme de Soldado
 * desenhado, na folha de contato. Se sumir, a cabeça encolhe; não o contrário.
 */
const TOPO_CRANIO = 40;
const CHAO_CRANIO = 200; // queixo
const H_CRANIO = CHAO_CRANIO - TOPO_CRANIO;
const CY_CRANIO = TOPO_CRANIO + H_CRANIO / 2;
/** Meia-largura: 0,41 da altura. O crânio é um OVO. */
const W_CRANIO = H_CRANIO * 0.41;

/** O cabelo sobe até aqui. É o topo da figura quando há cabelo. */
const TOPO = 18;

const Y_OMBRO = 213;
const W_TORSO = 56;
const W_MANGA = 78;
const H_MANGA = 53;
const Y_CAMISETA_FIM = 324;

const W_QUADRIL = 52;
const Y_BERMUDA = 398;

const X_BRACO_TOPO = 74;
const X_BRACO = 85;
const W_BRACO_TOPO = 13;
const W_BRACO_FIM = 10;
const Y_BRACO_INICIO = Y_OMBRO + H_MANGA - 10;
const Y_BRACO_FIM = 322;

const W_MAO = 22;
const H_MAO = 38;
const Y_MAO = Y_BRACO_FIM + H_MAO * 0.42;

const VAO = 15;
const W_PERNA = 15;
const Y_BOTA_TOPO = 422;
const H_BOTA = CHAO - Y_BOTA_TOPO;
const X_BOTA_INT = 13;
const X_BOTA_EXT = 71;

/**
 * Âncoras da família de corpo, em coordenadas do canvas.
 *
 * Saem daqui de propósito: quem sabe onde fica a mão é quem desenhou a mão. O
 * Bloco 5.2 formaliza isto em `bodyFamilies.ts` com offset por item; até lá é
 * esta a fonte, e é contra ela que o gate mede "o `hand` ancora na mão".
 */
export const ANCORAS = {
  /** Centro da mão direita do boneco (a da esquerda de quem olha). */
  mao: [CX - X_BRACO, Y_MAO] as Ponto,
  /** Onde um item de cabeça assenta: topo do crânio, no eixo. */
  cabeca: [CX, TOPO_CRANIO] as Ponto,
  /**
   * Recorte quadrado para foto de perfil (5.11). Do topo do cabelo até um
   * pouco abaixo do queixo, para o pescoço não sair cortado rente.
   */
  recorteCabeca: (() => {
    const lado = CHAO_CRANIO + 16 - TOPO;
    return { x: CX - lado / 2, y: TOPO, lado };
  })(),
} as const;

/** Ponto no crânio por fração de largura/altura. Tudo escala junto. */
const q = (fx: number, fy: number): Ponto => [
  CX + W_CRANIO * 2 * fx,
  CY_CRANIO + H_CRANIO * fy,
];

const GEOMETRIA_CRANIO = { q, hCranio: H_CRANIO };

export type Acabamento = "chapado" | "cel";

export interface OpcoesBase {
  /** Índice na rampa de pele (0–7). */
  pele?: number;
  /** Índice na rampa de cor de cabelo (0–7). */
  corCabelo?: number;
  /** Modelo do slot `hair`. `null` mostra a base careca — só para conferência. */
  modeloCabelo?: ModeloCabelo | null;
  /** `chapado` = cor lisa + contorno. `cel` = um degrau de sombra a mais. */
  acabamento?: Acabamento;
  /** Espessura do contorno, em unidades do viewBox. */
  traco?: number;
  /** Silhueta cheia, para conferir a forma antes de a cor importar. */
  silhueta?: boolean;
  /** Relíquia de teste na mão, para provar a âncora. */
  reliquiaTeste?: boolean;
}

export function base({
  pele = 3,
  corCabelo = 1,
  modeloCabelo = 1,
  acabamento = "cel",
  traco = 9,
  silhueta = false,
  reliquiaTeste = false,
}: OpcoesBase = {}): string {
  const cel = acabamento === "cel" && !silhueta;

  // --- Crânio: um OVO, sem um canto sequer -----------------------------------
  const cranio = curvaFechada([
    q(0.0, -0.50), q(0.30, -0.44), q(0.47, -0.22), q(0.50, 0.02),
    q(0.39, 0.30), q(0.17, 0.47), q(0.0, 0.50), q(-0.17, 0.47),
    q(-0.39, 0.30), q(-0.50, 0.02), q(-0.47, -0.22), q(-0.30, -0.44),
  ]);

  /** Orelha grande e redonda — na referência ela é personagem. */
  const orelha = (lado: 1 | -1): string =>
    curvaFechada([
      q(lado * 0.44, -0.08),
      q(lado * 0.58, -0.07),
      q(lado * 0.63, 0.02),
      q(lado * 0.57, 0.13),
      q(lado * 0.44, 0.15),
    ]);

  const pescoco = curvaFechada([
    [CX - W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.13],
    [CX - W_CRANIO * 0.33, Y_OMBRO + 6],
    [CX + W_CRANIO * 0.33, Y_OMBRO + 6],
    [CX + W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.13],
  ]);

  // --- Rosto ------------------------------------------------------------------
  // Medidos no close, normalizados pela meia-largura do crânio:
  //   olho em 63% da altura, separação 0,49 · oval 1,4× mais alto que largo
  //   sobrancelha em 43% — MUITO acima do olho, é a marca do estilo
  //   nariz em 75% · boca em 87%, e pequena
  const yOlho = TOPO_CRANIO + H_CRANIO * 0.63;
  const dxOlho = W_CRANIO * 0.49;
  const rxOlho = W_CRANIO * 0.125;
  const ryOlho = H_CRANIO * 0.073;
  const yBoca = TOPO_CRANIO + H_CRANIO * 0.87;
  const ySobr = TOPO_CRANIO + H_CRANIO * 0.43;

  /** Olho: oval escuro alto com um brilho pequeno. Sem anel branco. */
  const olho = (lado: 1 | -1): string => {
    const cx = CX + lado * dxOlho;
    return (
      peca("c-tinta", elipse(cx, yOlho, rxOlho, ryOlho)) +
      peca("c-brilho", elipse(cx + rxOlho * 0.30, yOlho - ryOlho * 0.44, rxOlho * 0.32, ryOlho * 0.22))
    );
  };

  /**
   * Sobrancelha em vírgula: grossa na ponta de dentro, afinando para fora.
   * É a forma da referência, e a alavanca mais forte do D8 depois.
   */
  const sobrancelha = (lado: 1 | -1): string => {
    const cx = CX + lado * dxOlho;
    const w = W_CRANIO * 0.22;
    return peca(
      "c-tinta",
      curvaFechada([
        [cx - lado * w * 0.95, ySobr + H_CRANIO * 0.030],
        [cx - lado * w * 0.40, ySobr - H_CRANIO * 0.024],
        [cx + lado * w * 0.55, ySobr - H_CRANIO * 0.008],
        [cx + lado * w * 0.95, ySobr + H_CRANIO * 0.026],
        [cx + lado * w * 0.45, ySobr + H_CRANIO * 0.014],
        [cx - lado * w * 0.45, ySobr + H_CRANIO * 0.016],
      ]),
    );
  };

  /** Nariz: só a insinuação, em sombra e sem contorno. */
  const nariz = peca(
    "c-pele-s",
    elipse(CX, TOPO_CRANIO + H_CRANIO * 0.75, W_CRANIO * 0.075, H_CRANIO * 0.030),
  );

  const rosto =
    `<g class="rosto rosto-neutra">` +
    (cel ? nariz : "") +
    olho(-1) +
    olho(1) +
    sobrancelha(-1) +
    sobrancelha(1) +
    `<path class="boca" d="M ${n1(CX - W_CRANIO * 0.20)} ${n1(yBoca)} ` +
    `Q ${n1(CX)} ${n1(yBoca + H_CRANIO * 0.040)} ${n1(CX + W_CRANIO * 0.20)} ${n1(yBoca)}"/>` +
    `</g>`;

  // --- Camiseta: manga e corpo numa massa macia só -----------------------------
  const camiseta = curvaFechada([
    [CX - W_TORSO * 0.44, Y_OMBRO - 5],
    [CX - W_TORSO * 0.90, Y_OMBRO + 1],
    [CX - W_MANGA, Y_OMBRO + 22],
    [CX - W_MANGA + 5, Y_OMBRO + H_MANGA],
    [CX - W_TORSO - 1, Y_OMBRO + H_MANGA - 3],
    [CX - W_TORSO - 3, Y_CAMISETA_FIM - 8],
    [CX - W_TORSO * 0.55, Y_CAMISETA_FIM],
    [CX + W_TORSO * 0.55, Y_CAMISETA_FIM],
    [CX + W_TORSO + 3, Y_CAMISETA_FIM - 8],
    [CX + W_TORSO + 1, Y_OMBRO + H_MANGA - 3],
    [CX + W_MANGA - 5, Y_OMBRO + H_MANGA],
    [CX + W_MANGA, Y_OMBRO + 22],
    [CX + W_TORSO * 0.90, Y_OMBRO + 1],
    [CX + W_TORSO * 0.44, Y_OMBRO - 5],
  ], 0.9);

  /** Gola: uma curva só. Sem ela a camiseta lê como placa. */
  const gola =
    `<path class="traco-fino" d="M ${n1(CX - W_CRANIO * 0.42)} ${n1(Y_OMBRO - 2)} ` +
    `Q ${n1(CX)} ${n1(Y_OMBRO + 20)} ${n1(CX + W_CRANIO * 0.42)} ${n1(Y_OMBRO - 2)}"/>`;

  // --- Membros: espinha e grossura, não quatro cantos --------------------------
  const braco = (lado: 1 | -1): string =>
    formaAfilada(
      espinhaReta(
        [CX + lado * X_BRACO_TOPO, Y_BRACO_INICIO],
        [CX + lado * X_BRACO, Y_BRACO_FIM],
        W_BRACO_TOPO,
        W_BRACO_FIM,
        4,
      ),
    );

  /**
   * Mão aberta: palma macia com três lóbulos de dedo e o polegar do lado de
   * dentro. A 56 px eles fundem numa luva — e é o certo. O que precisa
   * sobreviver é a mão ser nitidamente mais larga que o antebraço.
   */
  const mao = (lado: 1 | -1): string => {
    const cx = CX + lado * X_BRACO;
    const t = Y_MAO - H_MAO * 0.5;
    const b = Y_MAO + H_MAO * 0.5;
    const pts: Ponto[] = [
      [cx - W_MAO * 0.62, t],
      [cx - W_MAO * 1.02, t + H_MAO * 0.30],
      [cx - W_MAO * 0.80, t + H_MAO * 0.62], // polegar
      [cx - W_MAO * 0.46, b - H_MAO * 0.12],
      [cx - W_MAO * 0.30, b],
      [cx - W_MAO * 0.06, b - H_MAO * 0.10],
      [cx + W_MAO * 0.16, b + H_MAO * 0.02],
      [cx + W_MAO * 0.40, b - H_MAO * 0.12],
      [cx + W_MAO * 0.62, b - H_MAO * 0.04],
      [cx + W_MAO * 0.86, b - H_MAO * 0.36],
      [cx + W_MAO * 0.74, t + H_MAO * 0.10],
    ];
    return curvaFechada(
      lado === 1 ? pts : pts.map(([x, y]): Ponto => [2 * cx - x, y]).reverse(),
      0.9,
    );
  };

  const perna = (lado: 1 | -1): string =>
    formaAfilada(
      espinhaReta(
        [CX + lado * (VAO + W_PERNA), Y_BERMUDA - 20],
        [CX + lado * (VAO + W_PERNA + 3), Y_BOTA_TOPO + 10],
        W_PERNA + 1,
        W_PERNA - 1,
        3,
      ),
    );

  /** Bota chunky. Aqui `poligono` é o certo: bota tem quina. */
  const bota = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * X_BOTA_INT, Y_BOTA_TOPO],
        [CX + lado * X_BOTA_INT, CHAO],
        [CX + lado * X_BOTA_EXT, CHAO],
        [CX + lado * X_BOTA_EXT, Y_BOTA_TOPO],
      ],
      14,
    );

  const canoBota = (lado: 1 | -1): string =>
    `<path class="traco-fino" d="M ${n1(CX + lado * (X_BOTA_INT + 3))} ${n1(Y_BOTA_TOPO + H_BOTA * 0.34)} ` +
    `L ${n1(CX + lado * (X_BOTA_EXT - 3))} ${n1(Y_BOTA_TOPO + H_BOTA * 0.34)}"/>`;

  const bermuda = curvaFechada([
    [CX - W_QUADRIL, Y_CAMISETA_FIM - 22],
    [CX - W_QUADRIL - 1, Y_BERMUDA - 6],
    [CX - W_QUADRIL * 0.60, Y_BERMUDA],
    [CX - VAO - 1, Y_BERMUDA],
    [CX, Y_BERMUDA - 26],
    [CX + VAO + 1, Y_BERMUDA],
    [CX + W_QUADRIL * 0.60, Y_BERMUDA],
    [CX + W_QUADRIL + 1, Y_BERMUDA - 6],
    [CX + W_QUADRIL, Y_CAMISETA_FIM - 22],
  ], 0.85);

  // --- O degrau de sombra: quatro lugares, e só quatro --------------------------
  // Formas explícitas, construídas para caírem dentro da peça — sem clip-path,
  // que exigiria id, e id colide quando as camadas viram um documento só.
  const sombraQueixo = curvaFechada([
    [CX - W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.13],
    [CX - W_CRANIO * 0.34, CHAO_CRANIO + 6],
    [CX + W_CRANIO * 0.34, CHAO_CRANIO + 6],
    [CX + W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.13],
  ]);

  /** Orla escura da camiseta: faixa fina colada ao contorno, não painel. */
  const sombraTronco = curvaFechada([
    [CX + W_TORSO * 0.74, Y_OMBRO + H_MANGA],
    [CX + W_TORSO * 0.78, Y_CAMISETA_FIM - 4],
    [CX + W_TORSO * 0.55, Y_CAMISETA_FIM],
    [CX + W_TORSO + 3, Y_CAMISETA_FIM - 8],
    [CX + W_TORSO + 1, Y_OMBRO + H_MANGA - 3],
    [CX + W_MANGA - 5, Y_OMBRO + H_MANGA],
    [CX + W_MANGA, Y_OMBRO + 22],
    [CX + W_MANGA * 0.82, Y_OMBRO + 14],
  ], 0.85);

  const sombraBraco = (lado: 1 | -1): string =>
    formaAfilada(
      espinhaReta(
        [CX + lado * (X_BRACO_TOPO - W_BRACO_TOPO * 0.5), Y_BRACO_INICIO],
        [CX + lado * (X_BRACO - W_BRACO_FIM * 0.5), Y_BRACO_FIM],
        W_BRACO_TOPO * 0.5,
        W_BRACO_FIM * 0.5,
        3,
      ),
    );

  // --- Relíquia de teste --------------------------------------------------------
  // Não é arte: existe para o gate medir se a âncora cai DENTRO da mão.
  const reliquia = !reliquiaTeste
    ? ""
    : `<g class="camada-hand" style="--av-item-a:#C0392B">` +
      peca("c-item-a contorno", elipse(CX - X_BRACO, Y_MAO, 13, 13)) +
      `</g>`;

  const camadaCabelo =
    modeloCabelo === null
      ? ""
      : `<g class="camada-hair">${cabelo(modeloCabelo, GEOMETRIA_CRANIO, cel)}</g>`;

  // --- Montagem: de trás para a frente ------------------------------------------
  const corpo = [
    peca("c-pele contorno", braco(-1)),
    peca("c-pele contorno", braco(1)),
    peca("c-pele contorno", perna(-1)),
    peca("c-pele contorno", perna(1)),
    peca("c-sapato contorno", bota(-1)),
    peca("c-sapato contorno", bota(1)),
    silhueta ? "" : canoBota(-1),
    silhueta ? "" : canoBota(1),
    peca("c-calca contorno", bermuda),
    peca("c-pele contorno", pescoco),
    cel ? peca("c-pele-s", sombraQueixo) : "",
    peca("c-roupa contorno", camiseta),
    cel ? peca("c-roupa-s", sombraTronco) : "",
    silhueta ? "" : gola,
    cel ? peca("c-pele-s", sombraBraco(-1)) : "",
    cel ? peca("c-pele-s", sombraBraco(1)) : "",
    peca("c-pele contorno", mao(-1)),
    peca("c-pele contorno", mao(1)),
    peca("c-pele contorno", orelha(-1)),
    peca("c-pele contorno", orelha(1)),
    peca("c-pele contorno", cranio),
    silhueta ? "" : rosto,
    camadaCabelo,
    reliquia,
  ]
    .filter(Boolean)
    .join("\n");

  const vars = [
    `--av-traco:${traco}`,
    `--av-linha:${LINHA}`,
    `--av-pele:${silhueta ? LINHA : PELE[pele]}`,
    `--av-pele-s:${escurecer(PELE[pele], 0.82)}`,
    `--av-cabelo:${silhueta ? LINHA : CABELO[corCabelo]}`,
    `--av-cabelo-s:${escurecer(CABELO[corCabelo], 0.74)}`,
    `--av-roupa:${silhueta ? LINHA : TRAJE_BASE.roupa}`,
    `--av-roupa-s:${escurecer(TRAJE_BASE.roupa, 0.86)}`,
    `--av-calca:${silhueta ? LINHA : TRAJE_BASE.calca}`,
    `--av-sapato:${silhueta ? LINHA : TRAJE_BASE.sapato}`,
  ].join(";");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" class="av" style="${vars}">
<style>
  .av .contorno { stroke: var(--av-linha); stroke-width: var(--av-traco); stroke-linejoin: round; }
  .av .traco-fino { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.55); stroke-linecap: round; }
  .av .c-pele    { fill: var(--av-pele); }
  .av .c-pele-s  { fill: var(--av-pele-s); }
  .av .c-cabelo  { fill: var(--av-cabelo); }
  .av .c-cabelo-s{ fill: var(--av-cabelo-s); }
  .av .c-roupa   { fill: var(--av-roupa); }
  .av .c-roupa-s { fill: var(--av-roupa-s); }
  .av .c-calca   { fill: var(--av-calca); }
  .av .c-sapato  { fill: var(--av-sapato); }
  .av .c-detalhe { fill: var(--av-detalhe); }
  .av .c-item-a  { fill: var(--av-item-a); }
  .av .c-item-b  { fill: var(--av-item-b); }
  .av .c-tinta   { fill: var(--av-linha); }
  .av .c-brilho  { fill: #FFFFFF; }
  .av .boca      { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.60); stroke-linecap: round; }
  .av .mecha     { fill: none; stroke: var(--av-cabelo-s); stroke-width: calc(var(--av-traco) * 0.65); stroke-linecap: round; }
</style>
<g class="personagem">
${corpo}
</g>
</svg>`;
}
