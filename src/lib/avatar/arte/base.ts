/**
 * Boneco base do avatar v4 (Bloco 2).
 *
 * Sucede `prototipo/boneco.ts`, que continua servindo a `/dev/avatar` até o
 * Bloco 5 removê-lo. O protótipo provou a proporção; este é a arte.
 *
 * REFERÊNCIA: três imagens do usuário em 2026-07-29 — herói chibi de RPG a
 * 1:3; depois o mesmo personagem sem capa, de camiseta e bermuda, com as mãos
 * abertas; e um close do rosto.
 *
 * **A BASE É DESENHADA CARECA, E NUNCA É VISTA CARECA.** O cabelo é o slot
 * `hair`, em `cabelos.ts`. Ver o porquê lá — em uma frase: cabelo soldado na
 * base obrigaria todo modelo feminino a esconder o de baixo, que é o
 * `headKnockout` do v2 de volta.
 *
 * DUAS CORREÇÕES QUE AS IMAGENS NOVAS FORÇARAM, e que valem registro porque eu
 * tinha decidido o contrário lendo a primeira imagem, pequena demais:
 *
 *  1. **O rosto TEM sobrancelhas**, grossas e sempre visíveis. Eu havia
 *     escrito que não tinha e que elas apareceriam só nas expressões. O plano
 *     original (item 2.1) estava certo.
 *  2. **O olho não tem anel branco.** É um oval escuro alto com um brilho
 *     pequeno. A esclera cheia que eu tinha posto lia como óculos de proteção
 *     a 340 px. A regra do projeto já avisava: "esclera cheia dá olho
 *     arregalado".
 */

import { escurecer, CABELO, LINHA, PELE, TRAJE_BASE } from "../palette";
import { cabelo, type ModeloCabelo } from "./cabelos";
import { elipse, peca, poligono, n1, type Ponto } from "./formas";

/** Canvas 4:5 do v4 — os 4 tamanhos são recortes deste. */
export const LARGURA = 400;
export const ALTURA = 500;

const CX = LARGURA / 2;

/**
 * Cabeça (com cabelo) é 1/2,75 da figura, não 1/3.
 *
 * A T0.12 decidiu "1:3" comparando 1:2, 1:3 e 1:4 — e 1:3 venceu porque as
 * duas metades do catálogo (11 itens na cabeça, 7 no tronco) continuavam
 * distinguíveis. Medida a referência aprovada pelo usuário, a cabeça dela é
 * **40% da altura**, não 33%. 1:2,75 fica entre as duas e é muito mais perto
 * do vencedor do que do reprovado: mantém sala no tronco e ganha a leitura
 * chibi que faltava.
 */
const CHAO = 482;

/**
 * TUDO ABAIXO SAIU DE MEDIÇÃO nas três referências do usuário, normalizado
 * pela meia-largura do crânio. Antes eu chutava, e o resultado foi cinco
 * rodadas corrigindo proporção.
 *
 * Cabeça careca = 36% da figura; com cabelo = 39%. Isso é ~1:2,6, e não o
 * 1:3 da T0.12. **A T0.12 continua valendo como método** — ela mediu que
 * abaixo de 1:3 o acabamento do uniforme (gola, cinto, divisa) começa a
 * sumir a 56 px. A referência aprovada é mais cabeçuda que isso, então o
 * risco que a T0.12 apontou volta a existir e vai ser conferido no 2.6, com
 * o uniforme de Soldado desenhado, na folha de contato. Se sumir, a cabeça
 * encolhe; não o contrário.
 */
const TOPO_CRANIO = 40;
const CHAO_CRANIO = 200; // queixo
const H_CRANIO = CHAO_CRANIO - TOPO_CRANIO;
const CY_CRANIO = TOPO_CRANIO + H_CRANIO / 2;
/** Meia-largura: 0,41 da altura. O crânio é um OVO, não um quadrado. */
const W_CRANIO = H_CRANIO * 0.41;

/** O cabelo sobe até aqui. É o topo da figura quando há cabelo. */
const TOPO = 18;

const Y_OMBRO = 213;

/**
 * A CAMISETA TEM MANGA, e é ela que define a largura do ombro.
 *
 * Foi o defeito estrutural da rodada 3: sem manga, o braço ficava solto ao
 * lado do tronco e lia como salsicha desconectada. Na referência, camiseta e
 * mangas formam uma massa larga só, e só o antebraço aparece embaixo.
 */
// RODADA 5: as larguras saíram de MEDIÇÃO na referência, normalizadas pela
// meia-largura do crânio. Antes eu chutava, e o resultado foi o braço cair
// dentro da largura do tronco — a camiseta cobria o antebraço inteiro.
//   manga 0,96 · torso 0,85 · antebraço 1,20 (fora do corpo) · quadril 0,80
const W_TORSO = 56;
const W_MANGA = 78;
const H_MANGA = 53;

const Y_CAMISETA_FIM = 324;
const W_QUADRIL = 52;
const Y_BERMUDA = 398;

/**
 * Antebraço: fino, do fim da manga até a mão, e **afastado do corpo**.
 * Levemente angulado — é o que dá o ar solto da referência, em vez de braço
 * grudado na lateral.
 */
const W_BRACO = 11;
const X_BRACO_TOPO = 76;
const X_BRACO = 85; // na altura da mão
const Y_BRACO_INICIO = Y_OMBRO + H_MANGA - 8;
const Y_BRACO_FIM = 322;

/** Mão do DOBRO da largura do antebraço, e grande. É o que a separa dele. */
const W_MAO = 22;
const H_MAO = 40;
const Y_MAO = Y_BRACO_FIM + H_MAO * 0.42;

const VAO = 15;
const W_PERNA = 14;
const Y_BOTA_TOPO = 422;
const H_BOTA = CHAO - Y_BOTA_TOPO;
const X_BOTA_INT = 14;
const X_BOTA_EXT = 72;

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
   * Recorte quadrado para foto de perfil (5.11). Vai do topo do cabelo até um
   * pouco abaixo do queixo, para o pescoço não ficar cortado rente.
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

  // --- Crânio ---------------------------------------------------------------
  // Quadrado nos cantos, não elipse: oval puro lê como carinha genérica, e a
  // quadratura sutil dá queixo. Queixo é o que separa "boneco" de "smiley".
  // OVO: domo largo em cima, mais largo logo acima do meio, queixo estreito e
  // arredondado. A rodada 4 tinha um perfil quadrado com cantos, e lia como
  // caixa. A referência não tem um canto sequer.
  const cranio: Ponto[] = [
    q(0.0, -0.50), q(0.28, -0.45), q(0.44, -0.30),
    q(0.50, -0.06), q(0.46, 0.20), q(0.32, 0.40),
    q(0.12, 0.50), q(-0.12, 0.50), q(-0.32, 0.40),
    q(-0.46, 0.20), q(-0.50, -0.06), q(-0.44, -0.30), q(-0.28, -0.45),
  ];

  /** Orelha grande, redonda e destacada — na referência ela é personagem. */
  const orelha = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * (W_CRANIO * 2 * 0.42), CY_CRANIO - H_CRANIO * 0.08],
        [CX + lado * (W_CRANIO * 2 * 0.42), CY_CRANIO + H_CRANIO * 0.16],
        [CX + lado * (W_CRANIO * 2 * 0.63), CY_CRANIO + H_CRANIO * 0.12],
        [CX + lado * (W_CRANIO * 2 * 0.64), CY_CRANIO - H_CRANIO * 0.05],
      ],
      W_CRANIO * 0.24,
    );

  const pescoco = poligono(
    [
      [CX - W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.14],
      [CX - W_CRANIO * 0.36, Y_OMBRO + 8],
      [CX + W_CRANIO * 0.36, Y_OMBRO + 8],
      [CX + W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.14],
    ],
    8,
  );

  // --- Rosto ----------------------------------------------------------------
  // Medidos no close do rosto, normalizados pela meia-largura do crânio:
  //   olho em 63% da altura, separação 0,49 · oval 1,4× mais alto que largo
  //   sobrancelha em 43% — MUITO acima do olho, é a marca do estilo
  //   nariz em 75% · boca em 87%, e pequena (0,20 da meia-largura)
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
      peca("c-brilho", elipse(cx + rxOlho * 0.30, yOlho - ryOlho * 0.42, rxOlho * 0.34, ryOlho * 0.24))
    );
  };

  /**
   * Sobrancelha em vírgula: grossa e alta na ponta de dentro, afinando para
   * fora. É a forma da referência, e é a alavanca mais forte do D8 depois.
   */
  const sobrancelha = (lado: 1 | -1): string => {
    const cx = CX + lado * dxOlho;
    const w = W_CRANIO * 0.21;
    return peca(
      "c-tinta",
      poligono(
        [
          [cx - lado * w * 0.9, ySobr + H_CRANIO * 0.030],
          [cx - lado * w * 0.5, ySobr - H_CRANIO * 0.022],
          [cx + lado * w * 0.6, ySobr - H_CRANIO * 0.006],
          [cx + lado * w * 0.95, ySobr + H_CRANIO * 0.028],
          [cx + lado * w * 0.55, ySobr + H_CRANIO * 0.020],
          [cx - lado * w * 0.5, ySobr + H_CRANIO * 0.014],
        ],
        H_CRANIO * 0.012,
      ),
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
    `Q ${n1(CX)} ${n1(yBoca + H_CRANIO * 0.038)} ${n1(CX + W_CRANIO * 0.20)} ${n1(yBoca)}"/>` +
    `</g>`;

  // --- Corpo ----------------------------------------------------------------
  /** Camiseta com manga: uma massa só, do ombro à barra. */
  const camiseta: Ponto[] = [
    [CX - W_MANGA, Y_OMBRO + 6],
    [CX - W_MANGA, Y_OMBRO + H_MANGA],
    [CX - W_TORSO, Y_OMBRO + H_MANGA],
    [CX - W_TORSO - 2, Y_CAMISETA_FIM],
    [CX + W_TORSO + 2, Y_CAMISETA_FIM],
    [CX + W_TORSO, Y_OMBRO + H_MANGA],
    [CX + W_MANGA, Y_OMBRO + H_MANGA],
    [CX + W_MANGA, Y_OMBRO + 6],
    [CX + W_TORSO * 0.72, Y_OMBRO - 4],
    [CX - W_TORSO * 0.72, Y_OMBRO - 4],
  ];

  const bermuda = poligono(
    [
      [CX - W_QUADRIL, Y_CAMISETA_FIM - 14],
      [CX - W_QUADRIL + 1, Y_BERMUDA],
      [CX - VAO - 2, Y_BERMUDA],
      [CX, Y_BERMUDA - 22],
      [CX + VAO + 2, Y_BERMUDA],
      [CX + W_QUADRIL - 1, Y_BERMUDA],
      [CX + W_QUADRIL, Y_CAMISETA_FIM - 14],
    ],
    12,
  );

  /** Gola: uma curva só. Sem ela a camiseta lê como placa. */
  const gola =
    `<path class="traco-fino" d="M ${n1(CX - W_CRANIO * 0.40)} ${n1(Y_OMBRO + 3)} ` +
    `Q ${n1(CX)} ${n1(Y_OMBRO + 20)} ${n1(CX + W_CRANIO * 0.40)} ${n1(Y_OMBRO + 3)}"/>`;

  /** Antebraço: do fim da manga até a mão, angulado para fora. */
  const braco = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * (X_BRACO_TOPO - W_BRACO), Y_BRACO_INICIO],
        [CX + lado * (X_BRACO - W_BRACO), Y_BRACO_FIM],
        [CX + lado * (X_BRACO + W_BRACO), Y_BRACO_FIM],
        [CX + lado * (X_BRACO_TOPO + W_BRACO), Y_BRACO_INICIO],
      ],
      W_BRACO,
    );

  /**
   * Mão aberta, mas com TRÊS lóbulos moles, não quatro dedos articulados.
   *
   * A rodada 3 tinha quatro lóbulos com recorte fundo e lia como garra. A 56 px
   * dedo nenhum sobrevive — o que precisa sobreviver é a mão ser nitidamente
   * mais larga que o antebraço, senão os dois viram um salsichão só.
   */
  const mao = (lado: 1 | -1): string => {
    const cx = CX + lado * X_BRACO;
    const t = Y_MAO - H_MAO * 0.5;
    const b = Y_MAO + H_MAO * 0.5;
    // RODADA 6: o raio de canto era 0,40 da largura e arredondava os lóbulos
    // até virarem um ovo. Com 0,20 os dedos sobrevivem a 340 px e fundem numa
    // luva a 56 px, que é exatamente o comportamento desejado.
    const pts: Ponto[] = [
      [cx - W_MAO * 0.78, t],
      [cx - W_MAO * 1.0, b - H_MAO * 0.42],
      [cx - W_MAO * 0.72, b - H_MAO * 0.06],
      [cx - W_MAO * 0.40, b - H_MAO * 0.22],
      [cx - W_MAO * 0.12, b + H_MAO * 0.02],
      [cx + W_MAO * 0.20, b - H_MAO * 0.20],
      [cx + W_MAO * 0.52, b - H_MAO * 0.04],
      [cx + W_MAO * 0.78, b - H_MAO * 0.34],
      [cx + W_MAO * 0.82, t],
    ];
    return poligono(
      lado === 1 ? pts : pts.map(([x, y]): Ponto => [2 * cx - x, y]).reverse(),
      W_MAO * 0.20,
    );
  };

  const perna = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * VAO, Y_BERMUDA - 16],
        [CX + lado * VAO, Y_BOTA_TOPO + 12],
        [CX + lado * (VAO + W_PERNA * 2), Y_BOTA_TOPO + 12],
        [CX + lado * (VAO + W_PERNA * 2), Y_BERMUDA - 16],
      ],
      10,
    );

  /** Bota chunky: bem mais larga que a perna, como na referência. */
  const bota = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * X_BOTA_INT, Y_BOTA_TOPO],
        [CX + lado * X_BOTA_INT, CHAO],
        [CX + lado * X_BOTA_EXT, CHAO],
        [CX + lado * X_BOTA_EXT, Y_BOTA_TOPO],
      ],
      15,
    );

  /** Cano da bota: a linha que a separa da perna e a faz ler como bota. */
  const canoBota = (lado: 1 | -1): string =>
    `<path class="traco-fino" d="M ${n1(CX + lado * (X_BOTA_INT + 2))} ${n1(Y_BOTA_TOPO + H_BOTA * 0.34)} ` +
    `L ${n1(CX + lado * (X_BOTA_EXT - 2))} ${n1(Y_BOTA_TOPO + H_BOTA * 0.34)}"/>`;

  // --- O degrau de sombra: quatro lugares, e só quatro ------------------------
  // Formas explícitas, construídas para caírem dentro da peça — sem clip-path,
  // que exigiria id, e id colide quando as camadas viram um documento só.
  const sombraQueixo = poligono(
    [
      [CX - W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.14],
      [CX - W_CRANIO * 0.36, CHAO_CRANIO + 9],
      [CX + W_CRANIO * 0.36, CHAO_CRANIO + 9],
      [CX + W_CRANIO * 0.36, CHAO_CRANIO - H_CRANIO * 0.14],
    ],
    8,
  );

  /**
   * Lado escuro da camiseta: uma orla estreita colada ao contorno direito.
   * Na rodada 2 ela começava no meio do peito e lia como listra vertical.
   */
  // RODADA 6: a orla ocupava 40% do peito e lia como colete. Agora ela é uma
  // faixa fina colada ao contorno — sombra de forma, não painel de roupa.
  const sombraTronco = poligono(
    [
      [CX + W_TORSO * 0.78, Y_OMBRO + H_MANGA],
      [CX + W_TORSO * 0.82, Y_CAMISETA_FIM],
      [CX + W_TORSO + 2, Y_CAMISETA_FIM],
      [CX + W_TORSO, Y_OMBRO + H_MANGA],
      [CX + W_MANGA, Y_OMBRO + H_MANGA],
      [CX + W_MANGA, Y_OMBRO + 6],
      [CX + W_MANGA * 0.80, Y_OMBRO + 2],
    ],
    8,
  );

  /** Sombra dentro do antebraço, do lado que encosta no corpo. */
  const sombraManga = (lado: 1 | -1): string =>
    poligono(
      [
        [CX + lado * (X_BRACO_TOPO - W_BRACO), Y_BRACO_INICIO],
        [CX + lado * (X_BRACO - W_BRACO), Y_BRACO_FIM],
        [CX + lado * (X_BRACO - W_BRACO * 0.15), Y_BRACO_FIM],
        [CX + lado * (X_BRACO_TOPO - W_BRACO * 0.15), Y_BRACO_INICIO],
      ],
      W_BRACO * 0.8,
    );

  // --- Relíquia de teste ------------------------------------------------------
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

  // --- Montagem: de trás para a frente ----------------------------------------
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
    peca("c-roupa contorno", poligono(camiseta, 14)),
    cel ? peca("c-roupa-s", sombraTronco) : "",
    silhueta ? "" : gola,
    cel ? peca("c-pele-s", sombraManga(-1)) : "",
    cel ? peca("c-pele-s", sombraManga(1)) : "",
    peca("c-pele contorno", mao(-1)),
    peca("c-pele contorno", mao(1)),
    peca("c-pele contorno", orelha(-1)),
    peca("c-pele contorno", orelha(1)),
    peca("c-pele contorno", poligono(cranio, H_CRANIO * 0.18)),
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
    `--av-pele-s:${escurecer(PELE[pele], 0.80)}`,
    `--av-cabelo:${silhueta ? LINHA : CABELO[corCabelo]}`,
    `--av-cabelo-s:${escurecer(CABELO[corCabelo], 0.74)}`,
    `--av-roupa:${silhueta ? LINHA : TRAJE_BASE.roupa}`,
    `--av-roupa-s:${escurecer(TRAJE_BASE.roupa, 0.84)}`,
    `--av-calca:${silhueta ? LINHA : TRAJE_BASE.calca}`,
    `--av-sapato:${silhueta ? LINHA : TRAJE_BASE.sapato}`,
  ].join(";");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" class="av" style="${vars}">
<style>
  .av .contorno { stroke: var(--av-linha); stroke-width: var(--av-traco); stroke-linejoin: round; }
  .av .traco-fino { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.60); stroke-linecap: round; }
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
  .av .boca      { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.62); stroke-linecap: round; }
  .av .sobr      { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.90); stroke-linecap: round; }
</style>
<g class="personagem">
${corpo}
</g>
</svg>`;
}
