/**
 * Protótipo de proporção (T0.11) — "O Estrategista".
 *
 * UMA função gera o boneco; `cabecas` é o único parâmetro que muda entre as
 * três variantes. Altura total, largura do torso, espessura do contorno,
 * paleta e traços do rosto são idênticos nas três — senão a comparação seria
 * entre desenhos diferentes, não entre proporções.
 *
 * Ordem de pintura: de trás para a frente, cada parte com fill E stroke no
 * mesmo elemento. É o que evita a costura dupla entre braço e manga que a
 * primeira versão tinha (o braço aparecia POR CIMA da manga, com cara de
 * placa de armadura).
 */

// As cores vêm de palette.ts, que é a fonte única e a que o validador do
// Bloco 1 confere. Antes viviam soltas aqui, duplicadas com pet.ts.
import { CABELO, LINHA, PELE, TRAJE_BASE } from "../palette";

export { CABELO, LINHA, PELE };

type Ponto = [number, number];

/**
 * Polígono de cantos arredondados. Serve tanto para cantos convexos quanto
 * côncavos (a axila da manga é côncava), o que um <rect rx> não resolve.
 */
function poligono(pts: Ponto[], raio: number): string {
  const n = pts.length;
  let d = "";

  for (let i = 0; i < n; i++) {
    const ant = pts[(i - 1 + n) % n];
    const at = pts[i];
    const prox = pts[(i + 1) % n];

    const recuar = (de: Ponto): Ponto => {
      const dx = de[0] - at[0];
      const dy = de[1] - at[1];
      const len = Math.hypot(dx, dy) || 1;
      const r = Math.min(raio, len / 2);
      return [at[0] + (dx / len) * r, at[1] + (dy / len) * r];
    };

    const entra = recuar(ant);
    const sai = recuar(prox);

    d += i === 0 ? `M ${f(entra)} ` : `L ${f(entra)} `;
    d += `Q ${at[0].toFixed(1)} ${at[1].toFixed(1)} ${f(sai)} `;
  }

  return d + "Z";
}

function f(p: Ponto): string {
  return `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
}

export interface OpcoesBoneco {
  /** 2, 3 ou 4 — quantas alturas de cabeça o corpo inteiro tem. */
  cabecas: number;
  /** Índice na rampa de pele (0–7). */
  pele?: number;
  /** Índice na rampa de cabelo (0–7). */
  cabelo?: number;
  /** Espessura do contorno, em unidades do viewBox. */
  traco?: number;
  /** Sem o rosto — usado para inspecionar só a silhueta. */
  semRosto?: boolean;
  /** Chapéu de teste, para medir se os itens de head se distinguem a 56 px. */
  chapeu?: "bone" | "elmo" | "coroa";
  /** Uniforme de teste, para medir se as patentes se distinguem a 56 px. */
  uniforme?: "soldado" | "general";
}

export function boneco({
  cabecas,
  pele = 3,
  cabelo = 1,
  traco = 9,
  semRosto = false,
  chapeu,
  uniforme,
}: OpcoesBoneco): string {
  const CX = 200;
  const TOPO = 30;
  const CHAO = 478;
  const H = CHAO - TOPO;

  // --- Cabeça ---
  const hCab = H / cabecas;
  const wCab = hCab * 0.92;
  const cyCab = TOPO + hCab / 2;
  const baseCab = TOPO + hCab;

  // --- Corpo: largura constante nas três variantes ---
  const wT = 58; // meia-largura do tronco
  const hPescoco = Math.min(20, hCab * 0.11);
  const yOmbro = baseCab + hPescoco;
  const hCorpo = CHAO - yOmbro;
  const hTronco = hCorpo * 0.46;
  const yCintura = yOmbro + hTronco;
  const hPerna = CHAO - yCintura;

  // --- Manga e braço ---
  const mangaFora = 26;      // quanto a manga passa da lateral do tronco
  const hManga = hTronco * 0.36;
  const wBraco = 22;
  const hBraco = hTronco * 0.98;
  const cxBracoE = CX - wT - mangaFora / 2;
  const cxBracoD = CX + wT + mangaFora / 2;

  // --- Pernas ---
  const wPerna = 42;
  const vao = 12;
  const hSapato = Math.min(26, hPerna * 0.19);
  const hShort = hPerna * 0.36;
  const wShort = wT - 4;     // MAIS ESTREITO que o tronco: é o que tira o
                             // ar de saia que a primeira versão tinha

  // --- Rosto: tudo relativo à cabeça, para escalar junto ---
  const yOlho = TOPO + hCab * 0.60;
  const dxOlho = wCab * 0.21;
  const rxOlho = wCab * 0.105;
  const ryOlho = hCab * 0.115;
  const yBoca = TOPO + hCab * 0.81;
  const yOrelha = TOPO + hCab * 0.58;

  // A sobrancelha esquerda sobe um fio a mais que a direita. É o único
  // detalhe assimétrico, e fica DENTRO do rosto — nenhum item se ancora nela,
  // então não quebra a simetria de que o overlay depende. Sem isso a
  // expressão neutra lê como vazia; com isso, lê como avaliando o tabuleiro.
  const ySobrE = yOlho - ryOlho * 2.2;
  const ySobrD = yOlho - ryOlho * 1.75;
  const wSobr = rxOlho * 1.9;
  const hSobr = Math.max(hCab * 0.024, 5);

  // Crânio levemente quadrado, não elipse. Um oval puro lê como carinha
  // genérica; a quadratura sutil combina com o assunto (xadrez é feito de
  // casas) e dá um queixo, que é o que separa "boneco" de "smiley".
  const q = (fx: number, fy: number): Ponto => [CX + wCab * fx, cyCab + hCab * fy];
  const cranio: Ponto[] = [
    q(-0.50, -0.16), q(-0.42, -0.42), q(-0.15, -0.50),
    q(0.15, -0.50), q(0.42, -0.42), q(0.50, -0.16),
    q(0.45, 0.26), q(0.22, 0.50), q(-0.22, 0.50), q(-0.45, 0.26),
  ];

  // Cabelo curto com franja: acompanha o topo do crânio e mergulha no meio.
  const cabeloPts: Ponto[] = [
    q(-0.50, -0.14), q(-0.43, -0.43), q(-0.15, -0.51),
    q(0.15, -0.51), q(0.43, -0.43), q(0.50, -0.14),
    q(0.44, -0.20), q(0.16, -0.07), q(0.0, -0.23), q(-0.19, -0.06), q(-0.44, -0.20),
  ];

  const camisa: Ponto[] = [
    [CX - wT - mangaFora, yOmbro + 8],
    [CX - wT - mangaFora, yOmbro + hManga],
    [CX - wT, yOmbro + hManga],
    [CX - wT, yCintura],
    [CX + wT, yCintura],
    [CX + wT, yOmbro + hManga],
    [CX + wT + mangaFora, yOmbro + hManga],
    [CX + wT + mangaFora, yOmbro + 8],
    [CX + wT, yOmbro - 4],
    [CX - wT, yOmbro - 4],
  ];

  const yShortFim = yCintura + hShort;
  const short: Ponto[] = [
    [CX - wShort, yCintura - hTronco * 0.14],
    [CX - wShort, yShortFim],
    [CX - vao / 2 - 2, yShortFim],
    [CX, yShortFim - 14],            // entreperna: mata o ar de saia
    [CX + vao / 2 + 2, yShortFim],
    [CX + wShort, yShortFim],
    [CX + wShort, yCintura - hTronco * 0.14],
  ];

  const rInt = 14;
  const t = (n: number) => Number(n.toFixed(1));
  const peca = (classe: string, d: string) =>
    `  <path class="${classe} contorno" d="${d}"/>`;

  // --- Itens de teste ---------------------------------------------------
  // Formas mínimas, só para medir legibilidade a 56 px. Não são a arte final.

  const svgChapeu = !chapeu ? "" : (() => {
    const topo = cyCab - hCab * 0.5;
    if (chapeu === "bone") {
      const dome = poligono([
        q(-0.46, -0.16), q(-0.40, -0.44), q(-0.14, -0.53),
        q(0.14, -0.53), q(0.40, -0.44), q(0.46, -0.16),
      ], hCab * 0.16);
      const aba = poligono([
        [CX - wCab * 0.54, cyCab - hCab * 0.20],
        [CX - wCab * 0.54, cyCab - hCab * 0.09],
        [CX + wCab * 0.54, cyCab - hCab * 0.09],
        [CX + wCab * 0.54, cyCab - hCab * 0.20],
      ], hCab * 0.05);
      return `${peca("c-item-a", dome)}\n${peca("c-item-b", aba)}`;
    }
    if (chapeu === "elmo") {
      const casco = poligono([
        q(-0.47, -0.05), q(-0.42, -0.44), q(-0.14, -0.54),
        q(0.14, -0.54), q(0.42, -0.44), q(0.47, -0.05),
        q(0.33, -0.10), q(-0.33, -0.10),
      ], hCab * 0.12);
      const nasal = poligono([
        [CX - wCab * 0.07, cyCab - hCab * 0.30],
        [CX - wCab * 0.07, cyCab + hCab * 0.16],
        [CX + wCab * 0.07, cyCab + hCab * 0.16],
        [CX + wCab * 0.07, cyCab - hCab * 0.30],
      ], wCab * 0.05);
      const crista = poligono([
        [CX - wCab * 0.05, topo - hCab * 0.16],
        [CX - wCab * 0.05, cyCab - hCab * 0.40],
        [CX + wCab * 0.05, cyCab - hCab * 0.40],
        [CX + wCab * 0.05, topo - hCab * 0.16],
      ], wCab * 0.04);
      return `${peca("c-item-b", crista)}\n${peca("c-item-a", casco)}\n${peca("c-item-a", nasal)}`;
    }
    const banda = poligono([
      [CX - wCab * 0.46, cyCab - hCab * 0.30],
      [CX - wCab * 0.46, cyCab - hCab * 0.17],
      [CX + wCab * 0.46, cyCab - hCab * 0.17],
      [CX + wCab * 0.46, cyCab - hCab * 0.30],
    ], hCab * 0.04);
    const pontas = poligono([
      [CX - wCab * 0.46, cyCab - hCab * 0.28],
      [CX - wCab * 0.34, cyCab - hCab * 0.52],
      [CX - wCab * 0.22, cyCab - hCab * 0.32],
      [CX, cyCab - hCab * 0.60],
      [CX + wCab * 0.22, cyCab - hCab * 0.32],
      [CX + wCab * 0.34, cyCab - hCab * 0.52],
      [CX + wCab * 0.46, cyCab - hCab * 0.28],
    ], hCab * 0.03);
    return `${peca("c-item-a", pontas)}\n${peca("c-item-b", banda)}`;
  })();

  const svgUniforme = !uniforme ? "" : (() => {
    const yPeito = yOmbro + hTronco * 0.42;
    const gola = poligono([
      [CX - wT * 0.34, yOmbro - 6],
      [CX - wT * 0.22, yOmbro + hTronco * 0.20],
      [CX + wT * 0.22, yOmbro + hTronco * 0.20],
      [CX + wT * 0.34, yOmbro - 6],
    ], 6);
    const cinto = poligono([
      [CX - wT, yCintura - hTronco * 0.16],
      [CX - wT, yCintura - hTronco * 0.02],
      [CX + wT, yCintura - hTronco * 0.02],
      [CX + wT, yCintura - hTronco * 0.16],
    ], 4);
    const divisa = poligono([
      [CX + wT * 0.30, yPeito - hTronco * 0.07],
      [CX + wT * 0.30, yPeito + hTronco * 0.03],
      [CX + wT * 0.74, yPeito + hTronco * 0.03],
      [CX + wT * 0.74, yPeito - hTronco * 0.07],
    ], 3);
    const extra = uniforme === "general"
      ? peca("c-detalhe", poligono([
          [CX - wT * 0.74, yPeito - hTronco * 0.07],
          [CX - wT * 0.74, yPeito + hTronco * 0.03],
          [CX - wT * 0.30, yPeito + hTronco * 0.03],
          [CX - wT * 0.30, yPeito - hTronco * 0.07],
        ], 3))
      : "";
    // A camada redesenha a camisa com a MESMA classe `c-roupa` da base. Como
    // ela redeclara `--av-roupa` no próprio <g>, a cor da patente ganha por
    // cascata — e um boneco sem uniforme cai sozinho no traje da base, que é
    // o fallback do 5.9 sem precisar de código nenhum.
    return `${peca("c-roupa", poligono(camisa, 16))}\n${peca("c-detalhe", gola)}\n${peca("c-detalhe", cinto)}\n${peca("c-detalhe", divisa)}\n${extra}`;
  })();

  const rosto = semRosto
    ? ""
    : `
  <g class="rosto rosto-neutra">
    <rect class="c-tinta" x="${t(CX - dxOlho - wSobr / 2)}" y="${t(ySobrE)}" width="${t(wSobr)}" height="${t(hSobr)}" rx="${t(hSobr / 2)}"/>
    <rect class="c-tinta" x="${t(CX + dxOlho - wSobr / 2)}" y="${t(ySobrD)}" width="${t(wSobr)}" height="${t(hSobr)}" rx="${t(hSobr / 2)}"/>
    <ellipse class="c-brilho" cx="${t(CX - dxOlho)}" cy="${t(yOlho)}" rx="${t(rxOlho * 1.3)}" ry="${t(ryOlho * 0.84)}"/>
    <ellipse class="c-brilho" cx="${t(CX + dxOlho)}" cy="${t(yOlho)}" rx="${t(rxOlho * 1.3)}" ry="${t(ryOlho * 0.84)}"/>
    <ellipse class="c-tinta"  cx="${t(CX - dxOlho)}" cy="${t(yOlho)}" rx="${t(rxOlho)}" ry="${t(ryOlho)}"/>
    <ellipse class="c-tinta"  cx="${t(CX + dxOlho)}" cy="${t(yOlho)}" rx="${t(rxOlho)}" ry="${t(ryOlho)}"/>
    <ellipse class="c-brilho" cx="${t(CX - dxOlho + rxOlho * 0.34)}" cy="${t(yOlho - ryOlho * 0.36)}" rx="${t(rxOlho * 0.33)}" ry="${t(ryOlho * 0.30)}"/>
    <ellipse class="c-brilho" cx="${t(CX + dxOlho + rxOlho * 0.34)}" cy="${t(yOlho - ryOlho * 0.36)}" rx="${t(rxOlho * 0.33)}" ry="${t(ryOlho * 0.30)}"/>
    <path class="traco-fino" d="M ${t(CX - wCab * 0.09)} ${t(yBoca)} Q ${CX} ${t(yBoca + hCab * 0.06)} ${t(CX + wCab * 0.09)} ${t(yBoca)}"/>
  </g>`;

  // As cores vão em CUSTOM PROPERTIES, não embutidas nas regras.
  //
  // Por quê: o `<style>` de um SVG inline é global à página. Com as cores
  // dentro das regras, dois bonecos diferentes na mesma página colidem e o
  // último pinta todos — quatro alunos de um ranking sairiam idênticos, e a
  // coroa de um herdaria a cor do boné do outro. Medido, não suposto.
  //
  // Com `var()`, todo `<style>` emitido diz exatamente a mesma coisa (então
  // duplicá-los é inofensivo) e a cor vem da variável de cada instância.
  //
  // DOIS ESCOPOS, e a diferença importa (ver PROPRIEDADES em palette.ts):
  // o `<svg>` carrega o padrão da composição inteira; cada camada redeclara
  // no próprio `<g>` o que é dela. Sem isso, um chapéu e um pet na mesma
  // composição brigariam pelas mesmas variáveis.
  const vars = [
    `--av-traco:${traco}`,
    `--av-linha:${LINHA}`,
    `--av-pele:${PELE[pele]}`,
    `--av-cabelo:${CABELO[cabelo]}`,
    `--av-roupa:${TRAJE_BASE.roupa}`,
    `--av-calca:${TRAJE_BASE.calca}`,
    `--av-sapato:${TRAJE_BASE.sapato}`,
  ].join(";");

  const varsChapeu = !chapeu
    ? ""
    : ` style="--av-item-a:${chapeu === "coroa" ? "#E8B23A" : chapeu === "elmo" ? "#9AA6B0" : "#3D6B8F"};` +
      `--av-item-b:${chapeu === "coroa" ? "#B8801E" : chapeu === "elmo" ? "#C0362C" : "#284860"}"`;

  const varsUniforme = !uniforme
    ? ""
    : ` style="--av-roupa:${uniforme === "general" ? "#2B3A5C" : "#5C6E3F"};` +
      `--av-detalhe:${uniforme === "general" ? "#E0B44A" : "#38452A"}"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" class="est" style="${vars}">
<style>
  .est .contorno   { stroke: var(--av-linha); stroke-width: var(--av-traco); stroke-linejoin: round; }
  .est .traco-fino { fill: none; stroke: var(--av-linha); stroke-width: calc(var(--av-traco) * 0.85); stroke-linecap: round; }
  .est .c-pele     { fill: var(--av-pele); }
  .est .c-cabelo   { fill: var(--av-cabelo); }
  .est .c-roupa    { fill: var(--av-roupa); }
  .est .c-calca    { fill: var(--av-calca); }
  .est .c-sapato   { fill: var(--av-sapato); }
  .est .c-detalhe  { fill: var(--av-detalhe); }
  .est .c-tinta    { fill: var(--av-linha); }
  .est .c-brilho   { fill: #FFFFFF; }
  .est .c-item-a   { fill: var(--av-item-a); }
  .est .c-item-b   { fill: var(--av-item-b); }
</style>
<g class="personagem">
${peca("c-pele", poligono([
    [cxBracoE - wBraco / 2, yOmbro + 4],
    [cxBracoE - wBraco / 2, yOmbro + hBraco],
    [cxBracoE + wBraco / 2, yOmbro + hBraco],
    [cxBracoE + wBraco / 2, yOmbro + 4],
  ], wBraco / 2))}
${peca("c-pele", poligono([
    [cxBracoD - wBraco / 2, yOmbro + 4],
    [cxBracoD - wBraco / 2, yOmbro + hBraco],
    [cxBracoD + wBraco / 2, yOmbro + hBraco],
    [cxBracoD + wBraco / 2, yOmbro + 4],
  ], wBraco / 2))}
${peca("c-pele", poligono([
    [CX - vao / 2 - wPerna, yCintura],
    [CX - vao / 2 - wPerna, CHAO - hSapato + 6],
    [CX - vao / 2, CHAO - hSapato + 6],
    [CX - vao / 2, yCintura],
  ], rInt))}
${peca("c-pele", poligono([
    [CX + vao / 2, yCintura],
    [CX + vao / 2, CHAO - hSapato + 6],
    [CX + vao / 2 + wPerna, CHAO - hSapato + 6],
    [CX + vao / 2 + wPerna, yCintura],
  ], rInt))}
${peca("c-sapato", poligono([
    [CX - vao / 2 - wPerna - 4, CHAO - hSapato],
    [CX - vao / 2 - wPerna - 4, CHAO],
    [CX - vao / 2 + 2, CHAO],
    [CX - vao / 2 + 2, CHAO - hSapato],
  ], 9))}
${peca("c-sapato", poligono([
    [CX + vao / 2 - 2, CHAO - hSapato],
    [CX + vao / 2 - 2, CHAO],
    [CX + vao / 2 + wPerna + 4, CHAO],
    [CX + vao / 2 + wPerna + 4, CHAO - hSapato],
  ], 9))}
${peca("c-calca", poligono(short, 12))}
${peca("c-pele", poligono([
    [CX - wCab * 0.15, baseCab - hCab * 0.10],
    [CX - wCab * 0.15, yOmbro + 10],
    [CX + wCab * 0.15, yOmbro + 10],
    [CX + wCab * 0.15, baseCab - hCab * 0.10],
  ], 8))}
${peca("c-roupa", poligono(camisa, 16))}
${svgUniforme ? `<g class="camada-outfit"${varsUniforme}>\n${svgUniforme}\n</g>` : ""}
${peca("c-pele", poligono([
    [CX - wCab * 0.55, yOrelha - hCab * 0.09],
    [CX - wCab * 0.55, yOrelha + hCab * 0.09],
    [CX - wCab * 0.44, yOrelha + hCab * 0.09],
    [CX - wCab * 0.44, yOrelha - hCab * 0.09],
  ], wCab * 0.055))}
${peca("c-pele", poligono([
    [CX + wCab * 0.44, yOrelha - hCab * 0.09],
    [CX + wCab * 0.44, yOrelha + hCab * 0.09],
    [CX + wCab * 0.55, yOrelha + hCab * 0.09],
    [CX + wCab * 0.55, yOrelha - hCab * 0.09],
  ], wCab * 0.055))}
${peca("c-pele", poligono(cranio, hCab * 0.14))}
${peca("c-cabelo", poligono(cabeloPts, hCab * 0.055))}
${rosto}
${svgChapeu ? `<g class="camada-head"${varsChapeu}>\n${svgChapeu}\n</g>` : ""}
</g>
</svg>`;
}
