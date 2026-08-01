/**
 * O GATE DA POSE — `npm run avatar:pose`
 *
 * Existe porque a folha de contato aprovou uma base errada em oito proporções.
 * Ela não falhou por descuido: comparar duas imagens lado a lado com o olho pega
 * traço, cor e presença, e **não pega proporção**. Cabeça 4× mais chata no ápice,
 * olho 24% estreito, sombra do chão com metade do tamanho, tronco com o ponto
 * mais largo no lugar errado, orelhas simétricas numa referência assimétrica —
 * tudo isso passou por baixo de uma leitura visual atenta.
 *
 * São TRÊS medidas, e nenhuma enxerga o que a outra enxerga:
 *
 *  **(a) Perfil externo** — largura por linha contra a referência, por região
 *  (topo, lateral e base da cabeça; ombro, barriga e base do tronco). Reporta
 *  **erro médio absoluto, percentil 95 e máximo**, e não só o máximo: um pico
 *  isolado de antialiasing não pode pesar o mesmo que um topo sistematicamente
 *  chato. As linhas que saltam do núcleo da cabeça ficam de fora — na arte com
 *  orelhas a saliência dominaria o erro. A arte definitiva não tem nenhuma, e o
 *  filtro fica como guarda para uma protuberância futura.
 *
 *  **(b) Marcos da pose** — tudo que o perfil externo é cego para: para que lado
 *  os olhos andam, se um está mais alto, se os eixos da cabeça e do tronco
 *  coincidem, se as duas facetas do rosto existem e em que razão, e se o eixo do
 *  rosto está limpo. Uma silhueta pode estar perfeita com a pose inteira errada.
 *
 *  **(c) Unicidade de `id` no DOM** — com as instâncias renderizadas JUNTAS no
 *  mesmo documento, que é a única situação em que a colisão existe.
 *
 * ---------------------------------------------------------------------------
 * A NORMALIZAÇÃO É SÓ PELA ALTURA
 * ---------------------------------------------------------------------------
 *
 * `medir.ts` escala tudo por `600 / alturaÚtil`, e **nunca pela largura**.
 * Normalizar pelos dois eixos faria uma cabeça 9% estreita virar erro zero — que
 * é exatamente o defeito que este gate existe para pegar, e que passou na
 * primeira rodada.
 *
 * ---------------------------------------------------------------------------
 * A FOLGA DE PROJETO ENTRA NA CONTA DO TRONCO
 * ---------------------------------------------------------------------------
 *
 * O tronco é desenhado 5% para dentro da referência de propósito
 * (`FOLGA_PROJETO`), para que a tinta de um traje gerado a partir da mesma
 * referência cubra o clip com sobra. O gate multiplica a referência por esse
 * mesmo fator antes de comparar. Um gate que acusa o que é deliberado é um gate
 * que se aprende a ignorar — e este projeto já tem a lição medida: o
 * `verify:avatar-assets` ficou vermelho por meses sem ninguém saber.
 *
 * ---------------------------------------------------------------------------
 * AS QUATRO FIXTURES
 * ---------------------------------------------------------------------------
 *
 * Cada uma mata uma medida diferente, e é isso que prova que elas enxergam coisas
 * distintas. A do rosto chapado entrou no Bloco 1c e é UM DEFEITO QUE PASSOU VERDE
 * no 1b — o rosto sem faceta esquerda. Ela tem a silhueta externa exatamente certa,
 * então passa no perfil e reprova nos marcos: é a demonstração, em código, de que a
 * silhueta externa não era régua suficiente.
 *
 * A do `id` é a que faz o teste deixar de ser teatro: com geometrias idênticas a
 * colisão resolve para o primeiro clip e **nada muda na tela**, então só clips
 * divergentes a tornam visível.
 *
 * **Eram cinco.** A quinta reproduzia a orelha esquerda colada atrás, e saiu no
 * Bloco 1d porque a arte definitiva não tem orelha: ela reprovava um defeito que
 * deixou de ser possível. Não entra outra no lugar — uma fixture sem um defeito real
 * por trás é teatro, e o histórico deste arquivo mostra o custo disso.
 */

import { readFileSync } from "fs";
import sharp from "sharp";
import { chromium, type Browser } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  BOCA,
  EIXO_CABECA,
  FAIXA_FACETA,
  FACETAS,
  FOLGA_PROJETO,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SOBRANCELHA,
  SOMBRA_CHAO,
  TRACO,
  VIEWBOX,
  fatorDeTom,
  pathBoca,
  pathCabeca,
  pathEspecular,
  pathFacetaDir,
  pathFacetaEsq,
  pathPlanoLateralTronco,
  pathSobrancelha,
  pathSombraQueixoTronco,
  pathTronco,
} from "../../../src/lib/avatar/estilo/geometria";
import { LINHA, PELE, TRAJE_BASE, escurecer } from "../../../src/lib/avatar/palette";
import { medir, type Bitmap, type Marcos } from "./medir";

const REFERENCIA = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";

/**
 * A SEGUNDA REFERÊNCIA, e ela existe para três marcos só.
 *
 * `referencia-base.png` é a arte definitiva, e ela foi exportada sem fundo. **A
 * sombra do chão era pintada no fundo** e sumiu junto: medidos, sobram 69 px de
 * ruído onde a arte anterior tem 7 940 px de sombra.
 *
 * Os três marcos da sombra — largura, eixo e escurecimento — passariam a comparar
 * zero contra zero e ficariam **verdes por vacuidade**. Um marco assim é pior que
 * marco nenhum: ele ocupa a linha do relatório e não reprova nada, que é como o
 * `verify:avatar-assets` deste projeto ficou vermelho por meses sem ninguém saber
 * (só que ao contrário).
 *
 * Então a arte ANTERIOR fica aqui, e é lida só por esses três. O que autoriza
 * misturar duas fontes é a prova de que o corpo não se moveu, medida e registrada no
 * docstring de `geometria.ts`: cabeça 376,0 contra 376,3, tronco 285,7 contra 287,9,
 * corte 0,519 contra 0,520, platô 221,2 contra 221,4.
 *
 * **É dívida, e está declarada.** Uma reexportação da arte nova COM fundo apaga esta
 * constante e a função que a lê.
 */
const REFERENCIA_SOMBRA = "scripts/avatar/fonte/estilo-kokeshi/referencia-sombra.png";

/**
 * Altura de render, em pixel. 1400 dá ~2,3 unidades de `viewBox` por pixel, o
 * que põe o ruído de antialiasing bem abaixo das tolerâncias.
 */
const ALTURA_RENDER = 1400;

/** Fundo claro e neutro: a silhueta é lida pelo contorno escuro, não pelo fundo. */
const FUNDO = "#FBF8F5";

// ---------------------------------------------------------------------------
// Render e leitura
// ---------------------------------------------------------------------------

async function bitmapDoHtml(nav: Browser, corpo: string, larg: number, alt: number): Promise<Bitmap> {
  const pg = await nav.newPage({ viewport: { width: larg, height: alt } });
  await pg.setContent(`<body style="margin:0;background:${FUNDO}">${corpo}</body>`);
  const buf = await pg.screenshot({ type: "png" });
  await pg.close();
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, canais: info.channels };
}

function dimensionar(svg: string, alt: number): string {
  const larg = Math.round((alt * VIEWBOX.w) / VIEWBOX.h);
  return svg.replace("<svg ", `<svg width="${larg}" height="${alt}" `);
}

async function medirSvg(nav: Browser, svg: string): Promise<Marcos> {
  const larg = Math.round((ALTURA_RENDER * VIEWBOX.w) / VIEWBOX.h);
  return medir(await bitmapDoHtml(nav, dimensionar(svg, ALTURA_RENDER), larg, ALTURA_RENDER));
}

async function medirPng(caminho: string): Promise<Marcos> {
  const { data, info } = await sharp(readFileSync(caminho))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return medir({ data, w: info.width, h: info.height, canais: info.channels });
}

// ---------------------------------------------------------------------------
// As fixtures
// ---------------------------------------------------------------------------

interface Mutacao {
  /** Escala horizontal da cabeça, em torno do eixo dela. 0,9 = 10% estreita. */
  escalaCabecaX?: number;
  /** Põe os olhos no eixo da cabeça e no mesmo nível. */
  olhosCentrados?: boolean;
  /** Não desenha plano lateral nenhum no tronco. */
  semPlanoTronco?: boolean;
  /**
   * **A base do Bloco 1b, em uma linha.** Sem faceta esquerda, e a direita de tom
   * chapado em vez de gradiente. A silhueta fica exatamente certa.
   */
  rostoChapado?: boolean;
}

/**
 * Um boneco DELIBERADAMENTE errado, montado com os MESMOS paths da geometria.
 *
 * Ele reusa `pathCabeca()` e `pathTronco()` de propósito: assim a fixture da
 * pose tem a silhueta exatamente certa e só a pose errada, que é o que a faz
 * passar no gate (a) e reprovar no (b). Uma fixture desenhada à mão reprovaria
 * nos dois e não provaria nada sobre qual gate enxerga o quê.
 */
function fixture(mut: Mutacao): string {
  const cxOlhoE = mut.olhosCentrados ? EIXO_CABECA - OLHO.separacao / 2 : OLHO_CX_ESQ;
  const cxOlhoD = mut.olhosCentrados ? EIXO_CABECA + OLHO.separacao / 2 : OLHO_CX_DIR;
  const cyOlhoE = mut.olhosCentrados ? OLHO.cy : OLHO_CY_ESQ;
  const cyOlhoD = mut.olhosCentrados ? OLHO.cy : OLHO_CY_DIR;
  const k = mut.escalaCabecaX ?? 1;
  const pele = PELE[2];
  const tom = (delta: number) => escurecer(pele, fatorDeTom(delta, FACETAS.PLATO_PELE));
  const traco = `fill="none" stroke="${LINHA}" stroke-width="${TRACO}" stroke-linejoin="round" stroke-linecap="round"`;
  const olho = (cx: number, cy: number) =>
    `<rect x="${cx - OLHO.w / 2}" y="${cy - OLHO.h / 2}" width="${OLHO.w}" height="${OLHO.h}" ` +
    `rx="${OLHO.r}" fill="${LINHA}"/>`;
  /**
   * O risco de sobrancelha e de boca, igual ao do compositor.
   *
   * Elas entram na fixture mesmo não sendo o alvo de mutação nenhuma, pelo mesmo
   * motivo que a sombra do chão entra: **uma fixture só prova alguma coisa se for
   * idêntica à base exceto pelo defeito**. Uma fixture sem sobrancelha teria uma
   * diferença a mais contra a referência, e aí não dá para dizer qual das duas fez o
   * marco reprovar.
   */
  const risco = (d: string, w: number) =>
    `<path d="${d}" fill="none" stroke="${LINHA}" stroke-width="${w}" stroke-linecap="round"/>`;

  /** A mesma aresta do queixo que o compositor emite. Ver `FAIXA_FACETA`. */
  const tQ = Number(
    (
      (FAIXA_FACETA.yQueixo - FAIXA_FACETA.yAmostraTopo) /
      (FAIXA_FACETA.yFundo - FAIXA_FACETA.yAmostraTopo)
    ).toFixed(3),
  );
  const dCabeca = pathCabeca();

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}">` +
    `<defs><clipPath id="fx-cabeca"><path d="${dCabeca}"/></clipPath>` +
    `<clipPath id="fx-tronco"><path d="${pathTronco()}"/></clipPath>` +
    `<radialGradient id="fx-sombra">` +
    SOMBRA_CHAO.paradas
      .map((p) => `<stop offset="${p.em}" stop-color="${LINHA}" stop-opacity="${p.opacidade}"/>`)
      .join("") +
    `</radialGradient>` +
    `<linearGradient id="fx-fe" gradientUnits="userSpaceOnUse" x1="0" ` +
    `y1="${FAIXA_FACETA.yAmostraTopo}" x2="0" y2="${FAIXA_FACETA.yFundo}">` +
    `<stop offset="0" stop-color="${tom(FACETAS.esq.deltaTopo)}"/>` +
    `<stop offset="${tQ}" stop-color="${tom(FACETAS.esq.deltaBase)}"/>` +
    `<stop offset="${tQ}" stop-color="${tom(FACETAS.queixo.delta)}"/>` +
    `<stop offset="1" stop-color="${tom(FACETAS.queixo.delta)}"/></linearGradient>` +
    `</defs>` +
    // A sombra do chão entra igual à da base de propósito. Sem ela a fixture
    // reprovaria TAMBÉM nos marcos da sombra, e aí ela deixaria de isolar o que
    // se quer provar — que é o gate enxergar pose errada com silhueta certa.
    `<ellipse cx="${SOMBRA_CHAO.cx}" cy="${SOMBRA_CHAO.cy}" rx="${SOMBRA_CHAO.rx}" ` +
    `ry="${SOMBRA_CHAO.ry}" fill="url(#fx-sombra)"/>` +
    `<g clip-path="url(#fx-tronco)">` +
    `<path d="${pathTronco()}" fill="${TRAJE_BASE.roupa}"/>` +
    `<path d="${pathSombraQueixoTronco()}" fill="${escurecer(TRAJE_BASE.roupa, fatorDeTom(FACETAS.sombraQueixo.delta, FACETAS.PLATO_TRONCO))}"/>` +
    (mut.semPlanoTronco
      ? ""
      : `<path d="${pathPlanoLateralTronco()}" fill="${escurecer(TRAJE_BASE.roupa, 0.9)}" opacity=".42"/>`) +
    `</g>` +
    `<path d="${pathTronco()}" ${traco}/>` +
    `<g transform="translate(${EIXO_CABECA} 0) scale(${k} 1) translate(${-EIXO_CABECA} 0)">` +
    `<path d="${dCabeca}" fill="${pele}"/>` +
    `<g clip-path="url(#fx-cabeca)">` +
    (mut.rostoChapado
      ? // Sem faceta esquerda; a direita de tom chapado. A base do 1b.
        `<path d="${pathFacetaDir()}" fill="${tom(FACETAS.dir.deltaTopo)}"/>`
      : `<path d="${pathFacetaEsq()}" fill="url(#fx-fe)"/>` +
        `<path d="${pathFacetaDir()}" fill="${tom(FACETAS.dir.deltaBase)}"/>`) +
    `<path d="${pathEspecular()}" fill="#FFFFFF" opacity=".30"/>` +
    `</g>` +
    `<path d="${dCabeca}" ${traco}/>` +
    olho(cxOlhoE, cyOlhoE) +
    olho(cxOlhoD, cyOlhoD) +
    risco(pathSobrancelha(cxOlhoE, cyOlhoE), SOBRANCELHA.espessura) +
    risco(pathSobrancelha(cxOlhoD, cyOlhoD), SOBRANCELHA.espessura) +
    risco(pathBoca(), BOCA.espessura) +
    `</g>` +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// (a) Perfil externo
// ---------------------------------------------------------------------------

interface Teto {
  mae: number;
  p95: number;
  max: number;
}

interface Regiao {
  nome: string;
  de: number;
  ate: number;
  /** Multiplica a referência antes de comparar. O tronco tem a folga de projeto. */
  fator: number;
  teto: Teto;
}

interface ErroRegiao {
  nome: string;
  n: number;
  mae: number;
  p95: number;
  max: number;
  teto: Teto;
}

/**
 * As seis regiões, cada uma com o SEU teto — e a diferença entre eles não é
 * frouxidão, é geometria.
 *
 * Comparar largura-na-mesma-altura é hipersensível onde a borda é quase
 * horizontal. Na cúpula da cabeça a largura vai de 36 a 293 unidades em 18
 * unidades de altura: meia linha de diferença em ONDE a curva vira já são ~14
 * unidades de largura, sem que a forma esteja errada. O mesmo vale para a base
 * da cabeça e para o arremate do tronco. Nas laterais retas, um erro de 5
 * unidades é forma errada de verdade, e lá o teto é apertado.
 *
 * O que se perde afrouxando o topo é recuperado por um marco dedicado, o "chato
 * no ápice" — que é o defeito real daquela região e é medido em cheio, sem
 * sensibilidade a altura nenhuma.
 */
function regioes(fracCabeca: number): Regiao[] {
  const c = fracCabeca;
  const t = 1 - c;
  const inclinado: Teto = { mae: 9, p95: 20, max: 28 };
  const reto: Teto = { mae: 5, p95: 10, max: 14 };
  // As fronteiras não são terços redondos: elas saem dos RAIOS DOS CANTOS. O
  // "topo" é onde a cúpula ainda está abrindo (ryTopo mais meio traço, sobre a
  // altura externa da cabeça: ~0,21); o "base" é o canto de baixo (ryBase, ~0,26
  // contado do fim). Entre os dois a borda é reta, e é lá que 5 unidades de erro
  // já são forma errada. Um terço arbitrário misturaria reta com curva na mesma
  // estatística e obrigaria a afrouxar as duas.
  return [
    { nome: "cabeça · topo", de: 0, ate: c * 0.25, fator: 1, teto: inclinado },
    { nome: "cabeça · lateral", de: c * 0.25, ate: c * 0.74, fator: 1, teto: reto },
    { nome: "cabeça · base", de: c * 0.74, ate: c, fator: 1, teto: inclinado },
    { nome: "tronco · ombro", de: c, ate: c + t * 0.25, fator: FOLGA_PROJETO, teto: reto },
    { nome: "tronco · barriga", de: c + t * 0.25, ate: c + t * 0.85, fator: FOLGA_PROJETO, teto: reto },
    { nome: "tronco · base", de: c + t * 0.85, ate: 1, fator: FOLGA_PROJETO, teto: inclinado },
  ];
}

/**
 * O PERFIL É COMPARADO **POR LADO**, contra o eixo do tronco.
 *
 * Comparar largura total é cego para deriva de eixo: uma cabeça deslocada 8 unidades
 * para a direita tem a mesma largura em toda altura e passa verde. E a referência
 * TEM deriva — o eixo da cabeça anda de +7 no corpo dela para +15 no quarto de
 * baixo. O item "base da cabeça: o eixo escorre para a direita" do plano ficou verde
 * no Bloco 1b exatamente por isto, e é a razão de o gate agora somar as duas
 * distâncias como amostras independentes em vez de somá-las numa largura.
 */
function compararPerfil(alvo: Marcos, ref: Marcos): ErroRegiao[] {
  const fracCabeca = ref.cabeca.alt / 600;
  return regioes(fracCabeca).map((r) => {
    const erros: number[] = [];
    for (let i = 0; i < ref.perfil.length; i++) {
      const a = alvo.perfil[i];
      const b = ref.perfil[i];
      if (!a || !b) continue;
      if (b.frac < r.de || b.frac >= r.ate) continue;
      // A banda das orelhas fica fora: a saliência dominaria o erro do perfil, e
      // ela é medida em separado nos marcos.
      if (a.orelha || b.orelha) continue;
      // A primeira e a última linha da figura são uma ponta de 1 px em que o
      // antialiasing decide sozinho a largura.
      if (b.frac < 0.004 || b.frac > 0.996) continue;
      erros.push(Math.abs(a.esq - b.esq * r.fator), Math.abs(a.dir - b.dir * r.fator));
    }
    erros.sort((x, y) => x - y);
    const n = erros.length;
    return {
      nome: r.nome,
      n,
      mae: n ? erros.reduce((s, v) => s + v, 0) / n : 0,
      p95: n ? erros[Math.min(n - 1, Math.floor(n * 0.95))] : 0,
      max: n ? erros[n - 1] : 0,
      teto: r.teto,
    };
  });
}

const reprovou = (e: ErroRegiao) => e.mae > e.teto.mae || e.p95 > e.teto.p95 || e.max > e.teto.max;

// ---------------------------------------------------------------------------
// (b) Marcos da pose
// ---------------------------------------------------------------------------

interface Marco {
  nome: string;
  medido: number;
  esperado: number;
  tol: number;
}

function marcos(alvo: Marcos, ref: Marcos, refSombra: Marcos): Marco[] {
  const media = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const troncoDir = (m: Marcos) => media(m.planoLateralTronco.map((p) => p.dir));
  const troncoEsq = (m: Marcos) => media(m.planoLateralTronco.map((p) => p.esq));

  /**
   * OS MARCOS DO VOLUME — os oito que o Bloco 1b não tinha, e cada um mata um
   * defeito que passou verde.
   *
   * Eles ficam separados dos marcos de pose porque medem outra coisa: pose é onde as
   * peças estão, volume é como a luz cai. Um boneco pode ter a pose exata e o rosto
   * chapado — foi o que o 1b entregou e o que o Doug reprovou como "efeito cubo"
   * faltando.
   *
   * A tolerância de largura é maior que a de tom (6 contra 5) porque a aresta é
   * achada por partição sobre pixels com antialiasing: onde ela cai tem ±2 unidades
   * de indeterminação, enquanto o tom de um segmento inteiro é uma média de dezenas
   * de pixels e é estável.
   */
  /**
   * O desnível de tom, **normalizado ao platô de 221 da referência**.
   *
   * Sombreamento é multiplicativo, e o gate compara duas imagens com platôs
   * diferentes: o rosto da referência lê 221, o boneco renderizado com `PELE[2]` lê
   * 185,6. A mesma faceta correta sai −28 lá e −24 aqui. Comparar o número cru
   * reprovaria o desenho certo — e, numa pele clara, aprovaria o errado.
   *
   * Dividir pelo platô medido de cada lado e remultiplicar por 221 deixa os dois
   * comparáveis e os números legíveis: continuam sendo "níveis de luminância", só
   * que sempre na escala da referência.
   */
  const rel = (delta: number, plato: number) => (plato > 1 ? (delta / plato) * 221 : 0);
  const fTopo = (m: Marcos) => m.facetas.topo;
  const fBase = (m: Marcos) => m.facetas.base;

  const volume: Marco[] = [
    { nome: "espessura do traço", medido: alvo.espessuraTraco, esperado: ref.espessuraTraco, tol: 1.5 },
    { nome: "faceta esq · largura topo", medido: fTopo(alvo).largEsq, esperado: fTopo(ref).largEsq, tol: 6 },
    { nome: "faceta esq · delta topo", medido: rel(fTopo(alvo).deltaEsq, fTopo(alvo).plato), esperado: rel(fTopo(ref).deltaEsq, fTopo(ref).plato), tol: 5 },
    { nome: "faceta esq · delta base", medido: rel(fBase(alvo).deltaEsq, fBase(alvo).plato), esperado: rel(fBase(ref).deltaEsq, fBase(ref).plato), tol: 5 },
    { nome: "faceta dir · largura topo", medido: fTopo(alvo).largDir, esperado: fTopo(ref).largDir, tol: 6 },
    { nome: "faceta dir · delta topo", medido: rel(fTopo(alvo).deltaDir, fTopo(alvo).plato), esperado: rel(fTopo(ref).deltaDir, fTopo(ref).plato), tol: 5 },
    { nome: "faceta dir · delta base", medido: rel(fBase(alvo).deltaDir, fBase(alvo).plato), esperado: rel(fBase(ref).deltaDir, fBase(ref).plato), tol: 5 },
    { nome: "queixo · delta", medido: rel(alvo.facetas.queixo.delta, alvo.facetas.queixo.plato), esperado: rel(ref.facetas.queixo.delta, ref.facetas.queixo.plato), tol: 6 },
    { nome: "sombra do queixo · altura", medido: alvo.facetas.sombraQueixo.altura, esperado: ref.facetas.sombraQueixo.altura, tol: 6 },
    { nome: "sombra do queixo · delta", medido: rel(alvo.facetas.sombraQueixo.delta, alvo.facetas.sombraQueixo.plato), esperado: rel(ref.facetas.sombraQueixo.delta, ref.facetas.sombraQueixo.plato), tol: 8 },
  ];

  return [
    ...volume,
    { nome: "largura da cabeça", medido: alvo.cabeca.larg, esperado: ref.cabeca.larg, tol: 10 },
    { nome: "altura da cabeça", medido: alvo.cabeca.alt, esperado: ref.cabeca.alt, tol: 10 },
    /**
     * O CHATO NO ÁPICE — a largura da primeira linha de tinta.
     *
     * É o defeito que mais gritava na base anterior (178 de 370, ou 48% da
     * largura, contra os 10% da referência) e o que o perfil externo mede pior,
     * porque ali a borda é quase horizontal. Aqui ele vira um número só, imune a
     * meia linha de deslocamento vertical.
     */
    { nome: "chato no ápice", medido: alvo.perfil[0].larg, esperado: ref.perfil[0].larg, tol: 12 },
    { nome: "eixo cabeça ↔ tronco", medido: alvo.giroDoEixo, esperado: ref.giroDoEixo, tol: 3 },
    {
      nome: "desvio do par de olhos",
      medido: alvo.olhos.desvioDoEixo,
      esperado: ref.olhos.desvioDoEixo,
      tol: 6,
    },
    { nome: "desnível dos olhos", medido: alvo.olhos.desnivel, esperado: ref.olhos.desnivel, tol: 2.5 },
    { nome: "separação dos olhos", medido: alvo.olhos.separacao, esperado: ref.olhos.separacao, tol: 8 },
    { nome: "largura do olho", medido: alvo.olhos.esq.larg, esperado: ref.olhos.esq.larg, tol: 5 },
    { nome: "altura do olho", medido: alvo.olhos.esq.alt, esperado: ref.olhos.esq.alt, tol: 8 },
    { nome: "plano lateral do tronco, dir", medido: troncoDir(alvo), esperado: troncoDir(ref), tol: 6 },
    { nome: "plano lateral do tronco, esq", medido: troncoEsq(alvo), esperado: troncoEsq(ref), tol: 6 },
    { nome: "faixa escura no eixo do rosto", medido: alvo.faixaNoEixo, esperado: ref.faixaNoEixo, tol: 6 },
    {
      nome: "ombro do tronco",
      medido: alvo.tronco.largOmbro,
      esperado: ref.tronco.largOmbro * FOLGA_PROJETO,
      tol: 10,
    },
    {
      nome: "ponto mais largo do tronco",
      medido: alvo.tronco.largMax,
      esperado: ref.tronco.largMax * FOLGA_PROJETO,
      tol: 10,
    },
    {
      nome: "altura do ponto mais largo",
      medido: alvo.tronco.fracLargMax,
      esperado: ref.tronco.fracLargMax,
      tol: 0.1,
    },
    // A sombra do chão foi DOIS dos oito defeitos (metade do tamanho, e
    // deslocada quando devia ser centrada) e não aparece no perfil externo, que
    // lê contorno escuro. Ela não estava na lista de marcos do plano; entra
    // porque deixá-la de fora seria repetir a razão de este gate existir.
    //
    // OS TRÊS LEEM DE `refSombra`, E SÓ ELES. A arte definitiva foi exportada sem
    // fundo e a sombra foi junto — 69 px de ruído contra 7 940 px de sombra na arte
    // anterior. Comparar contra ela deixaria os três verdes medindo nada. Ver
    // `REFERENCIA_SOMBRA`, no alto do arquivo, para a prova de que as duas artes têm
    // o mesmo corpo.
    { nome: "largura da sombra do chão", medido: alvo.sombra.larg, esperado: refSombra.sombra.larg, tol: 25 },
    { nome: "eixo da sombra do chão", medido: alvo.sombra.desvio, esperado: refSombra.sombra.desvio, tol: 8 },
    {
      nome: "escurecimento da sombra",
      medido: alvo.sombra.escurecimento,
      esperado: refSombra.sombra.escurecimento,
      tol: 10,
    },
  ];
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

const nf = (v: number) => (Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1));

function relatarPerfil(erros: ErroRegiao[]): string[] {
  const falhas: string[] = [];
  console.log(`\n(a) PERFIL EXTERNO — largura por linha contra a referência, em unidades do viewBox`);
  for (const e of erros) {
    const ruim = reprovou(e);
    console.log(
      `    ${ruim ? "✗" : "·"} ${e.nome.padEnd(18)} MAE ${nf(e.mae).padStart(6)}/${e.teto.mae}  ` +
        `p95 ${nf(e.p95).padStart(6)}/${e.teto.p95}  máx ${nf(e.max).padStart(6)}/${e.teto.max}` +
        `   (${e.n} linhas)`,
    );
    if (ruim)
      falhas.push(
        `perfil "${e.nome}": MAE ${nf(e.mae)} (teto ${e.teto.mae}), p95 ${nf(e.p95)} ` +
          `(teto ${e.teto.p95}), máximo ${nf(e.max)} (teto ${e.teto.max})`,
      );
  }
  return falhas;
}

function relatarMarcos(lista: Marco[]): string[] {
  const falhas: string[] = [];
  console.log(`\n(b) MARCOS DA POSE — o que o perfil externo é cego para`);
  for (const m of lista) {
    const d = Math.abs(m.medido - m.esperado);
    const ruim = d > m.tol;
    console.log(
      `    ${ruim ? "✗" : "·"} ${m.nome.padEnd(30)} ${nf(m.medido).padStart(7)}  ` +
        `esperado ${nf(m.esperado).padStart(7)} ± ${m.tol}`,
    );
    if (ruim)
      falhas.push(`marco "${m.nome}": ${nf(m.medido)} contra ${nf(m.esperado)} ± ${m.tol}`);
  }
  return falhas;
}

// ---------------------------------------------------------------------------
// (c) Unicidade de id
// ---------------------------------------------------------------------------

function idsDe(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------

async function main() {
  const ref = await medirPng(REFERENCIA);
  const refSombra = await medirPng(REFERENCIA_SOMBRA);
  console.log(
    `referência lida: altura útil ${ref.alturaUtilPx} px → 600 unidades (fator ${ref.fator.toFixed(4)})`,
  );
  console.log(
    `sombra do chão lida de ${REFERENCIA_SOMBRA} (${refSombra.alturaUtilPx} px) — ` +
      `a arte definitiva foi exportada sem fundo e perdeu a sombra`,
  );
  // Se a arte definitiva um dia voltar com sombra, este aviso some junto com a
  // segunda referência. Enquanto ele aparece, a dívida está na tela de quem roda.
  if (ref.sombra.larg > 100)
    console.log(
      `    ⚠ a referência principal TEM sombra (${ref.sombra.larg.toFixed(0)} u): ` +
        `dá para apagar REFERENCIA_SOMBRA e voltar a uma fonte só`,
    );

  const falhas: string[] = [];
  const nav = await chromium.launch();
  try {
    // ---- a base de verdade ----
    const svg = compor({ pele: PELE[2], cabelo: "#3A2F2A", ns: "pose" });
    const base = await medirSvg(nav, svg);
    console.log(`base autorada renderizada a ${ALTURA_RENDER} px de altura`);

    falhas.push(...relatarPerfil(compararPerfil(base, ref)));
    falhas.push(...relatarMarcos(marcos(base, ref, refSombra)));

    // ---- (c) unicidade de id, com as instâncias JUNTAS ----
    console.log(`\n(c) UNICIDADE DE id — 30 instâncias no mesmo documento`);
    const trinta = Array.from({ length: 30 }, (_, i) =>
      dimensionar(compor({ pele: PELE[i % PELE.length], cabelo: "#3A2F2A", ns: `r${i}` }), 78),
    ).join("");
    const ids = idsDe(trinta);
    const unicos = new Set(ids).size;
    console.log(`    ${unicos === ids.length ? "·" : "✗"} ${ids.length} id emitidos, ${unicos} únicos`);
    if (unicos !== ids.length)
      falhas.push(`unicidade de id: ${ids.length} emitidos e só ${unicos} únicos`);

    // ---- as quatro fixtures ----
    //
    // Eram cinco até o Bloco 1c. A quinta era a "orelha esquerda colada atrás", e ela
    // saiu porque **perdeu objeto**: a arte definitiva não tem orelha, e a fixture
    // reproduzia um defeito que não é mais possível cometer. Inventar outra no lugar,
    // sem um defeito real por trás, seria teatro — e este gate já teve uma fixture de
    // teatro (a do `ns` repetido, que reportava "nada mudou em pixel" porque os clips
    // não divergiam) e ela foi consertada no 1c justamente por isso.
    console.log(`\nAS QUATRO FIXTURES — cada uma tem de reprovar num marco diferente`);

    // 1. cabeça 10% estreita → perfil externo
    const f1 = await medirSvg(nav, fixture({ escalaCabecaX: 0.9 }));
    const e1 = compararPerfil(f1, ref).filter((e) => e.nome.startsWith("cabeça"));
    const pegou1 = e1.some((e) => reprovou(e));
    console.log(
      `    ${pegou1 ? "·" : "✗"} cabeça 10% estreita → perfil externo: ` +
        e1.map((e) => `${e.nome.replace("cabeça · ", "")} máx ${nf(e.max)}`).join(", "),
    );
    if (!pegou1) falhas.push(`a fixture "cabeça 10% estreita" PASSOU no perfil externo`);

    // 2. silhueta certa, pose errada → marcos
    const f2 = await medirSvg(nav, fixture({ olhosCentrados: true, semPlanoTronco: true }));
    const perfil2 = compararPerfil(f2, ref);
    const marcos2 = marcos(f2, ref, refSombra).filter(
      (m) => Math.abs(m.medido - m.esperado) > m.tol,
    );
    const perfilLimpo2 = !perfil2.some(
      (e) => reprovou(e),
    );
    console.log(
      `    ${marcos2.length ? "·" : "✗"} silhueta certa + pose errada → marcos: ` +
        `${marcos2.length} reprovados (${marcos2.map((m) => m.nome).join(", ") || "nenhum"})`,
    );
    console.log(
      `      e o perfil externo ${perfilLimpo2 ? "PASSA, como tem de passar" : "também reprovou — a fixture não isola o gate"}`,
    );
    if (!marcos2.length) falhas.push(`a fixture "pose errada" PASSOU nos marcos da pose`);
    if (!perfilLimpo2)
      falhas.push(
        `a fixture "pose errada" reprovou no PERFIL também — ela deveria ter a silhueta certa, ` +
          `então ou a fixture mudou de silhueta ou o perfil está medindo pose`,
      );

    // ---- a fixture do Bloco 1c que sobreviveu: um defeito que PASSOU verde ----
    //
    // Ela tem a silhueta externa exatamente certa, e é isso que a torna útil: prova
    // que os marcos de volume enxergam o que o perfil não enxerga. Se ela passasse, o
    // gate estaria de volta ao estado em que aprovou a base que o Doug reprovou.
    const olhaFixture = async (
      rotulo: string,
      mut: Mutacao,
      quais: string[],
    ): Promise<void> => {
      const m = await medirSvg(nav, fixture(mut));
      const pegos = marcos(m, ref, refSombra).filter(
        (x) => quais.some((q) => x.nome.includes(q)) && Math.abs(x.medido - x.esperado) > x.tol,
      );
      const perfilLimpo = !compararPerfil(m, ref).some((e) => reprovou(e));
      console.log(
        `    ${pegos.length ? "·" : "✗"} ${rotulo}: ` +
          `${pegos.length} marco(s) — ${pegos.map((x) => x.nome).join(", ") || "NENHUM"}`,
      );
      console.log(
        `      e o perfil externo ${perfilLimpo ? "PASSA, como tem de passar" : "também reprovou — a fixture não isola o marco"}`,
      );
      if (!pegos.length) falhas.push(`a fixture "${rotulo}" PASSOU nos marcos ${quais.join("/")}`);
      if (!perfilLimpo)
        falhas.push(
          `a fixture "${rotulo}" reprovou no PERFIL também — ela deveria ter a silhueta certa`,
        );
    };

    await olhaFixture("rosto chapado, sem faceta esquerda", { rostoChapado: true }, ["faceta"]);

    // 4. duas instâncias, MESMO ns e clips DIFERENTES → unicidade de id
    //
    // Sem clips divergentes este teste é teatro: a colisão resolve para o
    // primeiro clip e, com geometrias idênticas, nada muda na tela. Aqui a
    // segunda instância pede um clip estreito e recebe o largo da primeira, o
    // que é medível em pixel.
    //
    // O `id` mudou de `-clip-tronco` para `-c-tronco` no Bloco 1c, quando os paths
    // passaram a viver em `<defs>` e o `clipPath` virou um `<use>`. A substituição
    // ficou sem casar e a fixture reportou "nada mudou em pixel" — que é a mensagem
    // certa para um teste que virou teatro, e foi assim que ela apareceu.
    const clipEstreito = `<clipPath id="dup-c-tronco"><path d="M 200 320 L 300 320 L 300 620 L 200 620 Z"/></clipPath>`;
    const a = dimensionar(compor({ pele: PELE[2], cabelo: "#3A2F2A", ns: "dup" }), 600);
    const bMutado = dimensionar(compor({ pele: PELE[6], cabelo: "#3A2F2A", ns: "dup" }), 600).replace(
      /<clipPath id="dup-c-tronco">.*?<\/clipPath>/,
      clipEstreito,
    );
    const idsDup = idsDe(a + bMutado);
    const colidiu = new Set(idsDup).size !== idsDup.length;
    const juntos = await bitmapDoHtml(nav, a + bMutado, 900, 620);
    const sozinho = await bitmapDoHtml(nav, bMutado, 450, 620);
    const tintaJuntos = pixelsDeTinta(juntos, 430, 900, TRAJE_BASE.roupa);
    const tintaSozinho = pixelsDeTinta(sozinho, 0, 450, TRAJE_BASE.roupa);
    const visivel = Math.abs(tintaJuntos - tintaSozinho) > tintaSozinho * 0.25;
    console.log(
      `    ${colidiu && visivel ? "·" : "✗"} dois \`ns\` iguais com clips diferentes → ` +
        `${idsDup.length} id, ${new Set(idsDup).size} únicos; a tinta do tronco da 2ª ocupa ` +
        `${tintaJuntos} px junto e ${tintaSozinho} px sozinho`,
    );
    if (!colidiu) falhas.push(`a fixture "ns repetido" NÃO produziu id duplicado`);
    if (!visivel)
      falhas.push(
        `a fixture "ns repetido" produziu id duplicado mas nada mudou em pixel — ` +
          `os clips não divergiram o bastante e o teste seria teatro`,
      );
  } finally {
    await nav.close();
  }

  if (falhas.length) {
    console.error(`\n${falhas.length} REPROVAÇÃO(ÕES):`);
    for (const f of falhas) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log(`\npose conferida: perfil, marcos e unicidade de id, com as 4 fixtures reprovando`);
  }
}

/**
 * Quantos pixels de uma faixa têm a COR DA TINTA do tronco. Só para a fixture 3.
 *
 * Tem de ser a tinta, e não o contorno: o `stroke` do tronco é desenhado FORA do
 * grupo clipado, então trocar o `clipPath` não mexe um pixel dele. Quem o clip
 * corta é o preenchimento — e foi medindo o contorno que a primeira versão desta
 * fixture reportou "nada mudou" numa colisão que existia.
 */
function pixelsDeTinta(b: Bitmap, x0: number, x1: number, cor: string): number {
  const alvo = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16));
  let n = 0;
  for (let y = 0; y < b.h; y++) {
    for (let x = x0; x < Math.min(x1, b.w); x++) {
      const i = (y * b.w + x) * b.canais;
      const d =
        Math.abs(b.data[i] - alvo[0]) + Math.abs(b.data[i + 1] - alvo[1]) + Math.abs(b.data[i + 2] - alvo[2]);
      if (d < 24) n++;
    }
  }
  return n;
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
