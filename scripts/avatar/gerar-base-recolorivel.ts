/**
 * Torna a arte do boneco base RECOLORÍVEL.
 *
 * Uso: npm run avatar:base
 * Entrada: scripts/avatar/fonte/avatar-base-corpo-v3.svg
 * Saída:   public/items/base/avatar-base-neutro.svg  (folha de <symbol>)
 *          .scratch/recolor/                          (folhas de conferência)
 *
 * DE ONDE VEM A ARTE
 * Doug gera o boneco por IA, refina no Canva Pro e converte no conversor
 * online do Adobe. Duas armadilhas do caminho, ambas já pagas:
 *   - O "SVG" que o Canva exporta NÃO é vetor: é um PNG embutido em base64,
 *     com a transparência num SEGUNDO PNG cuja luminância vira o alfa. Extrair
 *     só o de cor entrega fundo preto, e a Adobe traça esse preto como forma.
 *   - Mesmo com PNG transparente, a Adobe ainda emite um retângulo `#000000`
 *     no lugar do fundo. É a família `fundo`, descartada aqui.
 * O que o conversor não faz é o essencial: a arte sai com as cores ASSADAS, e
 * o avatar precisa dos 8 tons de pele de `PELE` — que são a razão declarada de
 * o boneco não excluir ninguém.
 *
 * A IDEIA
 * O auto-trace decompõe a pintura em faixas de luminosidade. Se as faixas de
 * pele forem repintadas com `var(--av-pele)` e a DIFERENÇA de luminosidade
 * virar sombra preta translúcida por cima, o sombreado sobrevive e a cor volta
 * a ser trocável. A sombra não conhece a cor de baixo, então serve aos 8 tons.
 *
 * AS CINCO ARMADILHAS — todas medidas, nenhuma suposta. Mexer aqui sem ler:
 *
 *  1. Sombra EMPILHA em faixas aninhadas (a escura mora dentro da clara).
 *     Elementos translúcidos separados dobram nas bordas e encardem o rosto.
 *     Juntar tudo num `<path>` só resolve o empilhamento e cria outro defeito:
 *     sub-formas de winding oposto se cancelam no `fill-rule` e o rosto ganha
 *     anéis de contorno. A saída certa é `<g opacity>` por nível — o grupo é
 *     composto OPACO e a transparência se aplica ao resultado achatado.
 *  2. Poucos degraus chapa a pintura em manchas de borda dura. 12, não 5.
 *  3. Cortar fiapo da BASE abre buraco: parte dos fiapos é a única cobertura
 *     daquele ponto, e o boneco fica pipocado de pontos claros com a borda do
 *     crânio serrilhada. O corte vale só para a camada de sombra.
 *  4. O limiar de área NÃO pode ser único. A boca deste boneco são três formas
 *     de ~140 de área. No corpo isso é granulado da pintura e vira mancha; no
 *     rosto, é o sorriso. Acima do queixo o limiar cai 10×.
 *  5. Classificar só por matiz manda o brilho do nariz para a família "roupa",
 *     e ele passa a ser pintado com a cor do uniforme: um borrão esverdeado no
 *     meio do rosto. Desempata por posição.
 */

import { readFileSync } from "fs";
import { PELE, TRAJE_BASE, LINHA } from "../../src/lib/avatar/palette";
import { otimizar } from "./otimizar-svg";
import { abrirNavegador, renderizarSvg, renderizarHtml, salvar } from "./render-svg";

const FONTE = "scripts/avatar/fonte/avatar-base-corpo-v3.svg";
const DESTINO = "public/items/base/avatar-base-neutro.svg";
const REF_PNG = "C:/Users/Lenovo/Downloads/avatar_base_macacao_azul_4k_transparente_v02.png";
const OUT = ".scratch/recolor";

/** Id do <symbol>. A página do app referencia este nome. */
export const SYMBOL_ID = "avatar-base-neutro";

/** Canvas da arte de origem. */
const W = 2556;
const H = 3840;

// ---------------------------------------------------------------------------
// Cor
// ---------------------------------------------------------------------------

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Luminosidade perceptual. É o eixo em que as faixas do trace se ordenam. */
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

function matiz(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: mx === 0 ? 0 : d / mx, l: (mx + mn) / 2 };
}

// ---------------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------------

/**
 * O trace emite "1038.000000,553.000000". Coordenada INTEIRA basta e corta o
 * arquivo pela metade: neste canvas de 3840 de altura, o avatar aparece no
 * máximo a 425 px, então 1 unidade vale 0,11 px e o arredondamento erra 0,06 px
 * no pior caso. MEDIDO: 760 → 462 KB bruto, 114 → 70 KB em brotli.
 */
const enxugar = (d: string) =>
  d.replace(/-?\d+\.\d+/g, (v) => String(Math.round(Number(v)))).replace(/\s+/g, " ").trim();

function coords(d: string): number[] {
  return d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
}

/**
 * Área aproximada pela fórmula do laço sobre os nós do `d`. Ignora a curvatura
 * das Béziers — aqui a área separa FORMA de FIAPO, não mede com precisão.
 */
function area(d: string): number {
  const nums = coords(d);
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/** Centro vertical aproximado. */
function centroY(d: string): number {
  const nums = coords(d);
  const ys: number[] = [];
  for (let i = 1; i < nums.length; i += 2) ys.push(nums[i]);
  return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
}

/** Centro horizontal aproximado. */
function centroX(d: string): number {
  const nums = coords(d);
  const xs: number[] = [];
  for (let i = 0; i < nums.length; i += 2) xs.push(nums[i]);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Caixa envolvente: [x0, y0, x1, y1]. */
function caixa(d: string): [number, number, number, number] {
  const nums = coords(d);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// ---------------------------------------------------------------------------
// Parâmetros — os números que custaram rodada
// ---------------------------------------------------------------------------

/**
 * Pescoço, medido no canal alfa do PNG mestre: é a linha mais estreita da
 * silhueta na metade de cima (235 px de largura). Acima disso é cabeça.
 */
const Y_QUEIXO = 1554;

/**
 * Piso da TINTA — abaixo daqui, escuro não é olho.
 *
 * A sombra sob o queixo também é escura, e ela caía na família da tinta: virava
 * uma barra preta atravessada no pescoço, com a solda grossa do olho. MEDIDO na
 * fonte: olho e sobrancelha ocupam de y=935 a y=1187, e a próxima forma escura
 * só aparece em y=1555 — o corte mora no meio desse vão. O que fica abaixo volta
 * a ser classificado por matiz e vira sombra de pele, que é o que ele é.
 */
const Y_TINTA = 1300;
const MIN_AREA = W * H * 0.00035;
const MIN_AREA_ROSTO = MIN_AREA / 10;
/** Piso da tinta. Ver o comentário em `olhos`: separa olho de lasca de trace. */
const MIN_AREA_TINTA = W * H * 0.00002;
/**
 * Luminosidade máxima para uma forma ser ADOTADA pela tinta. Ver o comentário
 * da adoção em `gerar`: dentro da caixa do olho há pedaços do próprio olho em
 * 0,08 a 0,32 e brilho de pele a partir de 0,67. O corte mora nesse vão.
 */
const LIMIAR_TINTA = 0.5;

const NIVEIS = 12;
/**
 * Zona morta de sombra da ROUPA. Ver o comentário em `camada`: abaixo desta
 * diferença de luminosidade, o que o trace achou é textura de tecido, não
 * dobra. A pele usa zero — rosto precisa do gradiente inteiro.
 */
const ZONA_MORTA_ROUPA = 0.18;
/** Teto do degrau de sombra: sem ele a sombra calculada sobre pele clara vira
 *  breu quando aplicada sobre pele escura. */
const TETO = 0.4;
/** Cor da sombra da PELE. Marrom escuro, não preto: preto acinzenta a pele. */
const COR_SOMBRA = "#2A1206";

/**
 * Cor da sombra da ROUPA — preto neutro, e aqui o marrom é que estaria errado.
 *
 * A pele tem matiz conhecido, então uma sombra marrom cai bem nela. A roupa não:
 * `--av-roupa` é variável e pode ser qualquer cor de uniforme. Marrom sobre azul
 * não escurece o azul, ENCARDE ele — a textura fina de tecido desta arte, que na
 * fonte é quase invisível, virava um borrão pardo no peito. Preto escurece
 * preservando o matiz, que é o que uma sombra faz.
 */
const COR_SOMBRA_ROUPA = "#000000";
/**
 * A solda é medida em unidades do viewBox, então ela precisa acompanhar o
 * tamanho do canvas: os valores abaixo foram achados a 1037 de largura, e a
 * fonte atual tem 2556. Sem esta escala a solda encolheria para 40% do que foi
 * calibrado e as frestas voltariam.
 */
const ESCALA = W / 1037;

/** Engorda cada forma o bastante para cobrir a fresta de antialiasing. */
const SOLDA = `stroke-width="${(1.6 * ESCALA).toFixed(1)}" stroke-linejoin="round"`;

/**
 * Olho e sobrancelha precisam de solda mais grossa que o resto.
 *
 * O trace picotou cada um em várias formas e deixou vãos de algumas unidades
 * entre elas — a 1.6 as rachaduras continuavam abrindo e a pele atravessava o
 * olho. MEDIDO num recorte fechado: 1.6 e 2 não fecham, 4 fecha, e a 4 o
 * contorno do olho não muda de forma perceptível. Acima disso a sobrancelha
 * começa a engordar.
 */
const SOLDA_TINTA = `stroke-width="${(4 * ESCALA).toFixed(1)}" stroke-linejoin="round"`;

/**
 * Margem da caixa da semente, em unidades do viewBox.
 *
 * Sem ela o teste de contenção decide no fio: a ponta da sobrancelha direita
 * (`#953C17`, área 735) tem o centro em x=1598,4 e a caixa da sobrancelha
 * termina em x=1598,0 — ficava de fora por QUATRO DÉCIMOS de unidade, e o arco
 * aparecia com um caco solto.
 *
 * O valor é 2, não mais: ele existe só para absorver o arredondamento inteiro
 * de `enxugar` e centros no fio da caixa. MEDIDO com margem de 10 (a largura
 * da solda, que parecia a escolha elegante): a sobrancelha fecha, mas a caixa
 * cresce o bastante para adotar as lascas escuras em volta do olho, e os dois
 * olhos ganham calombos na borda.
 */
const MARGEM_TINTA = 2;

// ---------------------------------------------------------------------------
// Leitura e classificação
// ---------------------------------------------------------------------------

interface Peca {
  fill: string;
  d: string;
  a: number;
}

type Fam = "fundo" | "escuro" | "pele" | "roupa";

export interface Resultado {
  /** As camadas, sem invólucro. É o que vira `<symbol>` ou `<svg>`. */
  corpo: string;
  paths: number;
  porFamilia: Record<Fam, number>;
}

function ler(): Peca[] {
  const svg = readFileSync(FONTE, "utf-8");
  return [...svg.matchAll(/<path\s+fill="(#[0-9A-Fa-f]{6})"[^>]*?d="\s*([^"]+)"/g)].map((m) => {
    const d = enxugar(m[2]);
    return { fill: m[1].toUpperCase(), d, a: area(d) };
  });
}

function familia(p: Peca): Fam {
  // FUNDO é preto E do tamanho do canvas. Preto pequeno é ARTE: nesta fonte,
  // duas formas de área 2023 e 390 dentro do olho esquerdo — o miolo mais
  // escuro dele. Enquanto todo `#000000` virava fundo, elas eram descartadas e
  // o forro aparecia por baixo: um entalhe claro cravado no olho, que resistiu
  // a duas hipóteses erradas (winding no `fill-rule`, brilho mal classificado).
  if (p.fill === "#000000" && p.a >= W * H * 0.25) return "fundo";
  const { h, s, l } = matiz(p.fill);
  if ((l < 0.2 || s < 0.1) && centroY(p.d) < Y_TINTA) return "escuro";
  const porCor: Fam = h < 30 ? "pele" : "roupa";
  return porCor === "roupa" && centroY(p.d) < Y_QUEIXO ? "pele" : porCor;
}

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------

function camada(ps: Peca[], cor: string, minArea: number, corSombra: string, zonaMorta: number): string {
  if (!ps.length) return "";

  const cores = [...new Set(ps.map((p) => p.fill))].sort((a, b) => lum(b) - lum(a));
  const lMax = lum(cores[0]);
  const lMin = lum(cores[cores.length - 1]);
  const nivel = (c: string) =>
    lMax === lMin ? 0 : Math.round(((lMax - lum(c)) / (lMax - lMin)) * (NIVEIS - 1));

  // Luminosidade representativa de cada nível: média das faixas que caíram
  // nele. Nível vazio herda a anterior, para o degrau não saltar.
  const lNivel: number[] = [];
  for (let k = 0; k < NIVEIS; k++) {
    const doNivel = cores.filter((c) => nivel(c) === k);
    lNivel[k] = doNivel.length
      ? doNivel.reduce((s, c) => s + lum(c), 0) / doNivel.length
      : lNivel[k - 1] ?? lMax;
  }

  // Alfa RELATIVO À FAIXA ANTERIOR. Empilhados nesta ordem, os degraus
  // telescopam até L_k/L_ref sem dobrar nas bordas.
  const alfa = lNivel.map((l, k) =>
    Math.min(TETO, Math.max(0, 1 - l / (k === 0 ? lNivel[0] : lNivel[k - 1]))),
  );

  // A BASE É UM <path> SÓ, com todas as sub-formas da família dentro dele.
  //
  // MEDIDO: com uma forma por path, as centenas de arestas compartilhadas
  // deixam fresta de antialiasing e o fundo vaza em riscos claros por cima do
  // boneco inteiro. O `stroke` da própria cor tapa a fresta em unidades do
  // viewBox — mas 1.6 unidade num viewBox de 1037 vira 0,26 px quando o
  // boneco é desenhado a 171 px de largura, e some. Engrossar a solda o
  // bastante para o tamanho MENOR engordaria a silhueta no MAIOR.
  //
  // Num path único não há aresta interna, então não há costura em tamanho
  // nenhum — e o arquivo encolhe junto. Mantém `stroke` só para fechar a
  // borda externa.
  const base =
    `<path fill="${cor}" stroke="${cor}" ${SOLDA} d="${ps.map((p) => p.d).join(" ")}"/>`;

  // ZONA MORTA: variação de luminosidade menor que isto não é sombra, é ruído.
  //
  // O macacão desta arte tem uma textura de tecido que na fonte é quase
  // invisível — ela afasta a luminosidade da base em 0,03 a 0,06. O trace,
  // porém, a desenhou em regiões esfarrapadas do TAMANHO DO TRONCO, então nem
  // filtro de área nem menos degraus a separam da dobra real: medi as duas
  // saídas, e com poucos degraus o salto só fica maior e a textura vira salpico.
  // O que separa as duas é a AMPLITUDE — a sombra real do braço e da lateral
  // afasta 0,30. Com a zona morta, o tecido colapsa na cor da base e some.
  const semRuido = (p: Peca) => lum(p.fill) <= lMax - zonaMorta;

  const sombras = alfa
    .map((a, k) => {
      if (a <= 0.02) return "";
      const dentro = ps
        .filter((p) => nivel(p.fill) === k && p.a >= minArea && semRuido(p))
        // SEM solda, ao contrário da base. A solda existe para tapar a fresta de
        // antialiasing por onde o FUNDO vazaria; atrás da sombra não há fundo,
        // há a base opaca, então a fresta só mostra a cor certa. E soldar tem
        // custo: engorda cada forma em ~4 unidades, o que numa renda fina de
        // textura funde o rendilhado numa massa sólida — foi o que transformou
        // o tecido deste macacão num anel escuro no peito.
        .map((p) => `<path fill="${corSombra}" d="${p.d}"/>`)
        .join("");
      return dentro ? `<g opacity="${a.toFixed(3)}">${dentro}</g>` : "";
    })
    .join("");

  return base + sombras;
}

export function gerar(): Resultado {
  const todas = ler();

  const porFam: Record<Fam, Peca[]> = { fundo: [], escuro: [], pele: [], roupa: [] };
  for (const p of todas) porFam[familia(p)].push(p);

  // ADOÇÃO — o que mora DENTRO do olho ou da sobrancelha volta a ser tinta.
  //
  // O trace fatia a sobrancelha em faixas de luminosidade como fatia qualquer
  // outra coisa, e as faixas do meio têm matiz de pele: iam para a família da
  // pele e abriam entalhes no arco, que aparecia rachado e com um caco solto na
  // ponta. As formas escuras que sobraram viram SEMENTE, e o que estiver dentro
  // da caixa de uma semente é candidato a voltar.
  //
  // O critério é a LUMINOSIDADE, e o corte é medido: dentro das sementes há
  // formas em 0,08 · 0,15 · 0,32 — pedaços da própria sobrancelha — e depois um
  // salto para 0,67, que é brilho de pele legítimo. `LIMIAR_TINTA` mora no vão.
  //
  // DUAS HIPÓTESES CARAS, ambas testadas e descartadas — não repita:
  //
  //  - Abrir `LIMIAR_TINTA` para 0,72, para engolir a cunha de 0,71 que partia a
  //    sobrancelha direita. Não fechou o arco E deformou os dois olhos, porque
  //    nesse limiar entra brilho de pele de verdade.
  //  - Adotar por TAMANHO RELATIVO ("migalha cercada de tinta é furo do trace,
  //    seja qual for a cor"). Fecha a sobrancelha, mas as migalhas claras que ele
  //    adota no olho estão na BORDA dela, não no miolo — e viram calombo.
  //
  // O que resolveu foi a `MARGEM_TINTA`: o pedaço que faltava era escuro (0,32)
  // e já passava pela luminosidade; ele só caía fora da caixa por quatro décimos
  // de unidade. Uma porta só, portanto.
  const sementes = porFam.escuro.filter((p) => p.a >= MIN_AREA_TINTA);
  const caixas = sementes.map((p) => caixa(p.d));

  const adotada = (p: Peca) => {
    if (lum(p.fill) >= LIMIAR_TINTA) return false;
    const x = centroX(p.d);
    const y = centroY(p.d);
    const m = MARGEM_TINTA;
    return caixas.some((bb) => x >= bb[0] - m && x <= bb[2] + m && y >= bb[1] - m && y <= bb[3] + m);
  };

  const tinta = [...sementes];
  for (const fam of ["escuro", "pele", "roupa"] as const) {
    const fica: Peca[] = [];
    for (const p of porFam[fam]) {
      if (sementes.includes(p)) continue;
      if (adotada(p)) tinta.push(p);
      else fica.push(p);
    }
    porFam[fam] = fica;
  }

  // Olho e sobrancelha em LINHA, não na cor traçada: LINHA é a única cor que
  // `validarPaleta()` garante a 40 de distância de TODOS os 8 tons. É o que
  // faz o olho continuar existindo no tom mais escuro.
  //
  // UM PATH POR FORMA, cada um com solda. O que fecha as frestas entre elas é
  // o `stroke` da própria cor; sem ele a pele atravessava e o olho aparecia
  // rachado por dentro.
  //
  // NÃO unir tudo num path só: cada olho desta fonte são duas formas ANINHADAS
  // (a mais escura mora dentro da menos escura). Num path único o laço de
  // dentro tem winding oposto, SUBTRAI no `fill-rule`, e abre um entalhe claro
  // no meio do olho. Como paths separados elas só se pintam por cima — e todas
  // são a mesma cor, então a sobreposição não aparece.
  //
  // E só as formas com ÁREA, ou adotadas: a solda que o olho precisa é grossa,
  // e ela engorda tudo que soldar. O trace deixou duas lascas de área 23 e 21 na
  // borda da orelha direita — sozinhas seriam invisíveis, mas com solda grossa
  // viraram uma mancha preta na orelha. Elas ficam de fora porque não moram
  // dentro de semente nenhuma.
  const olhos = tinta
    .map((p) => `<path fill="${LINHA}" stroke="${LINHA}" ${SOLDA_TINTA} d="${p.d}"/>`)
    .join("");

  // FORRO — a silhueta inteira, por baixo de tudo.
  //
  // Cada família já é um path único, então não há costura DENTRO da pele nem
  // DENTRO do macacão. Sobra a costura ENTRE as duas: punho, tornozelo e
  // pescoço são fronteiras onde dois paths vizinhos se encostam, e a fresta de
  // antialiasing deixava o fundo da página vazar num fiapo branco em volta das
  // mãos e dos pés.
  //
  // Com um forro embaixo, a fresta passa a mostrar o forro em vez do fundo.
  // Ele é pintado com `var(--av-pele)` porque as três fronteiras que existem
  // neste boneco são justamente pele contra roupa — nas três, o que deveria
  // aparecer ali é pele.
  // Só as formas grandes: o forro precisa cobrir a SILHUETA, não repetir cada
  // detalhe interno. Com os 552 paths ele custava 182 KB — quase o dobro do
  // desenho inteiro — para tapar frestas de meio pixel.
  //
  // E sem a família `fundo`: o retângulo `#000000` que o trace põe no lugar da
  // transparência é a MAIOR forma do arquivo. Dentro do forro ele pintava a
  // página inteira de cor de pele, com o boneco por cima.
  const forro =
    `<path class="av-forro" fill="var(--av-pele)" stroke="var(--av-pele)" ${SOLDA}` +
    ` d="${todas.filter((p) => familia(p) !== "fundo" && p.a >= MIN_AREA).map((p) => p.d).join(" ")}"/>`;

  const corpo =
    forro +
    // O corte de fiapo é POR FAMÍLIA, e não por altura no canvas.
    //
    // Toda a pele deste boneco é detalhe fino: rosto acima do queixo, e abaixo
    // dele só existem mão, pé e pescoço. Com o corte grosso, as linhas que
    // separam os dedos — que a Adobe CAPTUROU — eram descartadas por serem
    // finas, e a mão virava um borrão sem dedo nenhum.
    //
    // O pano é o contrário: lá o que é pequeno é granulado da pintura, e passá-lo
    // para a sombra suja o macacão.
    `<g class="av-pele">${camada(porFam.pele, "var(--av-pele)", MIN_AREA_ROSTO, COR_SOMBRA, 0)}</g>` +
    `<g class="av-roupa">${camada(porFam.roupa, "var(--av-roupa)", MIN_AREA, COR_SOMBRA_ROUPA, ZONA_MORTA_ROUPA)}</g>` +
    `<g class="av-tinta">${olhos}</g>`;

  return {
    corpo,
    paths: todas.length,
    porFamilia: {
      fundo: porFam.fundo.length,
      escuro: porFam.escuro.length,
      pele: porFam.pele.length,
      roupa: porFam.roupa.length,
    },
  };
}

/** Um SVG autônomo, para renderizar fora do app. */
function autonomo(corpo: string, pele: number, vb = `0 0 ${W} ${H}`): string {
  const vars = `--av-pele:${PELE[pele]};--av-roupa:${TRAJE_BASE.roupa}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" style="${vars}">${corpo}</svg>`;
}

/**
 * Otimiza e embrulha numa folha de `<symbol>`.
 *
 * O SVGO roda no SVG PLANO, nunca na folha pronta: `removeHiddenElems` apaga a
 * árvore inteira quando a raiz tem `display:none` (medido — a saída veio com
 * 0 KB), e nada garante que ele preserve um `<symbol>` cuja única referência
 * vive noutro documento.
 */
function folhaDeSymbol(corpo: string): string {
  const plano = otimizar(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${corpo}</svg>`);
  const dentro = plano.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">` +
    `<symbol id="${SYMBOL_ID}" viewBox="0 0 ${W} ${H}">${dentro}</symbol>` +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const b64 = (c: string) => "data:image/png;base64," + readFileSync(c).toString("base64");

async function main() {
  const { corpo, paths, porFamilia } = gerar();
  const folha = folhaDeSymbol(corpo);
  salvar(DESTINO, folha);

  console.log(`paths: ${paths}  (pele ${porFamilia.pele}, roupa ${porFamilia.roupa}, olho ${porFamilia.escuro}, fundo ${porFamilia.fundo})`);
  console.log(`${DESTINO}: ${(folha.length / 1024).toFixed(0)} KB`);

  const nav = await abrirNavegador();
  try {
    // Recorte da cabeça, da coroa ao pescoço, medido no alfa do PNG mestre.
    const CAB = "664 410 1311 1224";
    const RAZAO = W / H;
    for (let i = 0; i < PELE.length; i++) {
      await renderizarSvg(nav, otimizar(autonomo(corpo, i)), Math.round(234 * RAZAO), 234, `${OUT}/pele-${i}.png`, "#EFEAE2");
      await renderizarSvg(nav, otimizar(autonomo(corpo, i, CAB)), 300, Math.round(300 * (1224 / 1311)), `${OUT}/cab-${i}.png`, "#EFEAE2");
    }
    await renderizarSvg(nav, otimizar(autonomo(corpo, 2)), Math.round(497 * RAZAO), 497, `${OUT}/xl.png`, "#EFEAE2");
    await renderizarSvg(nav, otimizar(autonomo(corpo, 2)), Math.round(82 * RAZAO), 82, `${OUT}/sm.png`, "#EFEAE2");

    const tiras = PELE.map((_, i) => `<img src="${b64(`${OUT}/pele-${i}.png`)}" height="234">`).join("");
    const caras = PELE.map((_, i) => `<img src="${b64(`${OUT}/cab-${i}.png`)}" height="186">`).join("");

    await renderizarHtml(
      nav,
      `<!doctype html><html><body style="margin:0;background:#fff;font:14px system-ui;color:#333">
       <p style="margin:14px 18px 6px"><b>Boneco base recolorível</b> &mdash; arte do Doug, reconstruída. Original ao lado.</p>
       <div style="display:flex;gap:16px;padding:0 18px;align-items:flex-end">
         <figure style="margin:0"><img src="${b64(REF_PNG)}" height="497" style="background:#EFEAE2"><figcaption style="text-align:center;color:#666">original (PNG)</figcaption></figure>
         <figure style="margin:0"><img src="${b64(`${OUT}/xl.png`)}" height="497"><figcaption style="text-align:center;color:#666">reconstruído (SVG)</figcaption></figure>
         <figure style="margin:0"><img src="${b64(`${OUT}/sm.png`)}" height="492" style="image-rendering:pixelated;border:1px solid #ccc"><figcaption style="text-align:center;color:#666">56 px, 6&times;</figcaption></figure>
       </div>
       <p style="margin:18px 18px 6px"><b>Os 8 tons &mdash; um arquivo, uma variável.</b></p>
       <div style="display:flex;gap:8px;padding:0 18px;flex-wrap:wrap">${tiras}</div>
       <p style="margin:18px 18px 6px">O rosto de perto em cada tom &mdash; é onde os defeitos apareceram.</p>
       <div style="display:flex;gap:8px;padding:0 18px;flex-wrap:wrap">${caras}</div>
       </body></html>`,
      1780,
      `${OUT}/folha-recolor.png`,
    );
  } finally {
    await nav.close();
  }

  console.log(`${OUT}/folha-recolor.png`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
