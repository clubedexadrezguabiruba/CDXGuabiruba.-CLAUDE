/**
 * O REGISTRO DA PEÇA IMPORTADA — onde a arte encosta no boneco do produto.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, EM UMA FRASE
 * ---------------------------------------------------------------------------
 *
 * Um cabelo é peça da CABEÇA, e estava sendo posicionado pelos marcos do CORPO.
 *
 * `mapa()` tira a escala de `(yBase − yPescoco)` — as duas pontas do tronco — e a
 * aplica igual nos dois eixos. Para enquadrar a figura inteira é o certo. Para uma
 * peça da cabeça, herda inteira a diferença de proporção entre o boneco do gerador
 * e o do `geometria.ts`, que é de **28%**.
 *
 * Medido na `curto-espetada`, com a arte e a peça no MESMO referencial:
 *
 * |                                | pelo tronco | pela cabeça |
 * |--------------------------------|-------------|-------------|
 * | IoU da massa                   | 70,78%      | **81,98%**  |
 * | borda de baixo, médio          | 18,6 u      | **9,7 u**   |
 * | borda de baixo, PIOR coluna    | 175,5 u     | **50,0 u**  |
 * | borda de cima, PIOR coluna     | 203,0 u     | **78,5 u**  |
 * | massa da arte coberta          | 77,8%       | **85,9%**   |
 * | desvio fora da caixa do crânio | 8,6 u       | **0,0 u**   |
 *
 * ---------------------------------------------------------------------------
 * O MARCO É DECLARADO, NÃO INFERIDO
 * ---------------------------------------------------------------------------
 *
 * A cabeça da arte vem da guia `cabeca` do `semantica.svg`. Poderia ser achada por
 * heurística — e heurística some no dia em que erra, e some calada. Declarada, a
 * ausência dela é um erro que diz o que fazer (`guiaChamada`).
 */

import {
  arcosDeTraco,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  type Cabelo,
  type PontoFranja,
} from "../../../src/lib/avatar/estilo/cabelo";
import {
  CAIXA_CABECA,
  OLHO,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  TRACO,
  bordasEm,
} from "../../../src/lib/avatar/estilo/geometria";
import { acharOlhos, binarizar, lerSvg } from "./fonte-svg";
import {
  guiaChamada,
  lerFontePecaOuFalhar,
  nosDoSubpath,
  svgDaCamada,
  type CamadaFonte,
  type FontePeca,
} from "./fonte-peca";
import { decimarPorCorda, desvioDaCorda, type Bitmap } from "./medir";
import { rasterizarSvg } from "./raster";
import {
  ALTURA_SVG,
  amostrar,
  anisotropia,
  aplicarK,
  autoIntersecoes,
  comprimirNoTeto,
  conexas,
  conterAClara,
  cru,
  distanciaDe,
  escolherN,
  medirClara,
  medirMassa,
  paraTY,
  paraX,
  paraXY,
  paraY,
  registroPelaCabeca,
  sangrarNaSilhueta,
  type Mapa,
  type Segmentacao,
} from "./tracar-cabelo";

const MEIO_TRACO = TRACO / 2;
/** O arredondamento do literal. O mesmo de `imprimirTracado` — 3 casas em unidade. */
const num = (v: number) => Number(v.toFixed(3));

/**
 * QUANTO DA PEÇA CABE NO CRÂNIO — o gate do registro.
 *
 * A pergunta é a que o `clip-path` faz no navegador: cada ponto da peça está
 * dentro da silhueta da cabeça? Pelo registro do tronco a resposta era **46,5%**;
 * pela cabeça, **99,5%**. Não é um teto afinado — é a diferença entre a peça caber
 * e não caber.
 *
 * Ponderado por área, porque o conversor fragmenta: contando subpath a subpath, uma
 * lasca de 20 u² pesaria igual à massa de 8 000.
 */
export function fracaoNoCranio(peca: FontePeca, m: Mapa): number {
  let dentro = 0;
  let total = 0;
  for (const c of peca.camadas) {
    for (const s of c.subpaths) {
      const ns = nosDoSubpath(s);
      if (!ns.length) continue;
      const peso = Math.abs(s.area) / ns.length;
      for (const n of ns) {
        total += peso;
        const x = paraX(m, n.x);
        const y = paraY(m, n.y);
        if (y < CAIXA_CABECA.y0 || y > CAIXA_CABECA.y1) continue;
        const b = bordasEm(y);
        if (x >= b.esq && x <= b.dir) dentro += peso;
      }
    }
  }
  return total ? dentro / total : 0;
}

/**
 * O REGISTRO DA PEÇA, EM UNIDADES DO `viewBox` DA ARTE.
 *
 * `registroPelaCabeca` converte para pixel do raster porque é assim que o traçador
 * come; aqui a conta é a mesma com `alturaDoRaster = viewBox.h`, que é a identidade.
 * Ter as duas evita o erro de misturar as réguas — que já custou uma medição.
 */
export function registroDaPeca(peca: FontePeca, emPixelDoRaster = false): Mapa {
  const guia = guiaChamada(peca, "cabeca");
  return registroPelaCabeca(
    guia.caixa,
    peca.viewBox,
    emPixelDoRaster ? ALTURA_SVG : peca.viewBox.h,
    { x0: CAIXA_CABECA.x0, y0: CAIXA_CABECA.y0, x1: CAIXA_CABECA.x1, y1: CAIXA_CABECA.y1 },
  );
}

/** O piso do gate. Abaixo disto a peça não cabe no crânio, e nenhum traço conserta. */
export const PISO_NO_CRANIO = 0.99;
/** Acima disto os dois eixos discordam, e a diferença é de FORMA, não de registro. */
export const TETO_ANISOTROPIA = 0.02;

export function conferirRegistro(caminhoSemantica: string) {
  const peca = lerFontePecaOuFalhar(caminhoSemantica);
  const m = registroDaPeca(peca);
  const dentro = fracaoNoCranio(peca, m);
  const aniso = anisotropia(m);
  const falhas: string[] = [];
  if (dentro < PISO_NO_CRANIO) {
    falhas.push(
      `só ${(100 * dentro).toFixed(1)}% da peça cai dentro do crânio (piso ${100 * PISO_NO_CRANIO}%). ` +
        `O clip come o resto, e nenhum traço conserta registro.`,
    );
  }
  if (aniso > TETO_ANISOTROPIA) {
    falhas.push(
      `anisotropia ${(100 * aniso).toFixed(2)}% (teto ${100 * TETO_ANISOTROPIA}%): os dois eixos ` +
        `discordam, então a cabeça da arte tem FORMA diferente da do produto — e isso é ` +
        `direção de arte, não registro.`,
    );
  }
  return { peca, mapa: m, dentro, anisotropia: aniso, falhas };
}

/* ------------------------------------------------------------------ */
/* As máscaras por papel                                               */
/* ------------------------------------------------------------------ */

/**
 * OS TOKENS DE TINTA DO CABELO, e o que cada um é no compositor.
 *
 * Não é decoração: é a régua que desmentiu a primeira semantização. `.kk-cabelo-s`
 * pinta a MASSA com o tom escuro e leva o traço; `.kk-cabelo` pinta a CLARA por cima
 * com o tom base. Um papel `tom-claro` carregando `cabelo-s` é o volume ao contrário,
 * e nenhuma contabilidade de conjunto acusa isso — ver `semantizar.ts`.
 */
const TINTA = { base: "cabelo-s", clara: "cabelo", linha: "linha" } as const;

export interface MascaraDaCamada {
  camada: CamadaFonte;
  mask: Uint8Array;
  /** Pixels acesos. É a área da camada NO RASTER, e não a área assinada do `d`. */
  pixels: number;
}

export interface MascarasDaPeca {
  w: number;
  h: number;
  camadas: MascaraDaCamada[];
  /**
   * TODA A TINTA DECLARADA DA PEÇA — e é daqui que sai o laço, nunca de um papel só.
   *
   * O conversor **ladrilha**: corpo, sombra e traço são regiões disjuntas que juntas
   * cobrem o cabelo. Tomar a silhueta do papel `massa` sozinho devolveria uma região
   * com um buraco no formato da camada clara, porque é exatamente esse o recorte que
   * o conversor fez. A silhueta da peça é da UNIÃO, e a decomposição por papel só
   * decide qual tinta vai por cima.
   */
  uniao: Uint8Array;
  /** A tinta que o compositor põe por cima, em `--av-cabelo`: o papel `tom-claro`. */
  clara: Uint8Array;
  /** O preto declarado. Alimenta a sondagem pela normal, que acha a linha de centro. */
  linha: Uint8Array;
}

/** Uma camada de cada vez, rasterizada sólida no `viewBox` da arte. */
export async function mascarasDaPeca(peca: FontePeca, altura = ALTURA_SVG): Promise<MascarasDaPeca> {
  const camadas: MascaraDaCamada[] = [];
  let w = 0;
  let h = 0;
  for (const camada of peca.camadas) {
    const bmp = await rasterizarSvg(svgDaCamada(peca.arquivo, camada.subpaths), altura);
    const { mask } = binarizar(bmp);
    w = bmp.w;
    h = bmp.h;
    let pixels = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) pixels++;
    camadas.push({ camada, mask, pixels });
  }

  const n = w * h;
  const uniao = new Uint8Array(n);
  const clara = new Uint8Array(n);
  const linha = new Uint8Array(n);
  for (const c of camadas) {
    const alvo = c.camada.papel === "tom-claro" ? clara : c.camada.papel === "linha-mascara" ? linha : null;
    for (let i = 0; i < n; i++) {
      if (!c.mask[i]) continue;
      uniao[i] = 1;
      if (alvo) alvo[i] = 1;
    }
  }
  return { w, h, camadas, uniao, clara, linha };
}

/**
 * AS MÁSCARAS DECLARADAS VESTINDO A INTERFACE QUE A GEOMETRIA JÁ COME.
 *
 * `Segmentacao` foi escrita para ser a **fronteira** entre "de onde vem o booleano" e
 * "o que a geometria faz com ele" — o seu próprio docstring diz que trocar a fonte não
 * muda uma linha de geometria. Esta é a terceira fonte: nem matiz de pixel, nem família
 * de cor, e sim **papel declarado**. `medirMassa` e `medirClara` não sabem a diferença.
 *
 * `tom` fica ausente de propósito, como na fonte de path: aqui a fronteira entre os
 * dois tons é a borda entre dois papéis, exata por construção. Varrer limiar nela
 * mediria a largura do antialiasing do rasterizador.
 *
 * `ancoras` é o campo que não tem sentido nesta fonte, e o valor diz isso: a máscara
 * contém **só a peça** — não há tronco, não há pescoço, e o limite de varredura é o
 * raster inteiro. Quem registra a peça é a guia `cabeca`, não um marco de corpo.
 */
export function segmentacaoDaPeca(m: MascarasDaPeca, laudo: string[] = []): Segmentacao {
  const em = (mask: Uint8Array) => (x: number, y: number) =>
    x >= 0 && y >= 0 && x < m.w && y < m.h && mask[y * m.w + x] === 1;
  const bmp: Bitmap = { data: Buffer.alloc(m.w * m.h * 3, 255), w: m.w, h: m.h, canais: 3 };
  for (let i = 0; i < m.uniao.length; i++) {
    if (!m.uniao[i]) continue;
    bmp.data[i * 3] = 0;
    bmp.data[i * 3 + 1] = 0;
    bmp.data[i * 3 + 2] = 0;
  }
  return {
    bmp,
    cabelo: em(m.uniao),
    claro: em(m.clara),
    escuro: em(m.linha),
    ancoras: { yPescoco: m.h, yBase: m.h, eixo: m.w / 2 },
    fonte: "path",
    laudo,
  };
}

/* ------------------------------------------------------------------ */
/* A reancoragem por linha — o `t` é fração, e a caixa não sabe disso   */
/* ------------------------------------------------------------------ */

/**
 * A CABEÇA DA ARTE, LINHA A LINHA — e ela NÃO tem a forma do crânio do produto.
 *
 * ---------------------------------------------------------------------------
 * O QUE FOI MEDIDO, E POR QUE A CAIXA NÃO BASTA
 * ---------------------------------------------------------------------------
 *
 * `registroPelaCabeca` casa a **caixa** da cabeça da arte com a caixa do crânio, e
 * isso conserta escala e posição — foi o que levou a peça de 46,5% para 99,5% dentro
 * do crânio. Duas formas com a mesma caixa ainda podem ter curvaturas diferentes, e a
 * anisotropia (0,56% aqui) é cega para isso: ela compara os dois fatores de escala, e
 * os dois saem da caixa.
 *
 * Medido nesta arte, com as duas cabeças no MESMO referencial (largura em unidades do
 * produto):
 *
 * | y  | cabeça da arte | crânio do produto | diferença |
 * |----|----------------|-------------------|-----------|
 * | 58 | 163            | 246               | **−83**   |
 * | 82 | 231            | 331               | **−100**  |
 * | 106| 301            | 358               | −57       |
 * | 142| 333            | 363               | −30       |
 * | 202| 354            | 362               | −8        |
 *
 * O boneco do gerador tem a cabeça **redonda**; o kokeshi tem a cabeça de canto
 * arredondado, que alcança a largura cheia quase de imediato. Pela caixa, a cúpula da
 * arte cai **inteira dentro** da cúpula do produto, e o cabelo — que na arte encosta
 * na borda da cabeça em todas as linhas (medido: as colunas 2 e 4 da tabela acima são
 * a mesma) — aparece no produto com até 100 unidades de couro cabeludo à mostra em
 * volta da coroa. `coberturaDaCoroa` mede **8,3%** onde se exige 100.
 *
 * ---------------------------------------------------------------------------
 * O CONSERTO É O PRÓPRIO CONTRATO DE `PontoFranja`, LIDO ATÉ O FIM
 * ---------------------------------------------------------------------------
 *
 * `cabelo.ts` define `t` como *"fração da largura da cabeça NAQUELA altura"*, e o
 * arquivo já explica o que acontece com quem ignora o "naquela altura": o moicano
 * virou pluma de capacete porque uma faixa de `t` constante é um funil em pixel.
 *
 * A conversão fiel, então, não é afim: é perguntar à ARTE a mesma coisa que
 * `bordasEm` pergunta ao produto. Um ponto que na arte está a 40% da largura da
 * cabeça daquela linha vai para 40% da largura do crânio na linha correspondente. O
 * mapa afim continua mandando em **`y`** — ali não há analogia por coluna — e no
 * pixel do raster, que é onde `medirMassa` trabalha.
 *
 * A caixa continua sendo gate: `fracaoNoCranio` prova que a ESCALA está certa antes
 * de qualquer reancoragem. As duas não competem — uma é a régua, a outra é a fração.
 */
export interface BordasDaArte {
  /** Por linha do raster: o primeiro e o último pixel de cabeça. `null` onde não há. */
  esq: Float32Array;
  dir: Float32Array;
  w: number;
  h: number;
}

/**
 * A linha estreita demais para ter fração.
 *
 * No ápice da cúpula a cabeça tem 12 unidades de largura, e uma fração medida sobre 12
 * unidades multiplica todo erro de meio pixel por trinta. Abaixo deste piso o ponto sai
 * pelo mapa afim, que ali é uma aproximação boa — a diferença entre as duas cabeças no
 * ápice é o próprio ápice.
 */
const PISO_LARGURA = 16;

/**
 * A JANELA DE SUAVIZAÇÃO DA BORDA DA CABEÇA, EM LINHAS DO RASTER — e ela não é zelo.
 *
 * A primeira versão usou os extremos crus. O resultado, medido: o desvio da decimação
 * saltou de 8,6 para **24,6 unidades** e apareceram **4 auto-interseções** no laço.
 * A causa é aritmética — reancorar divide pela largura da linha, então um pixel de
 * antialiasing em `esq` ou `dir` vira um deslocamento em `x` proporcional à distância
 * do ponto até a borda. Um serrilhado de meio pixel na cabeça vira um serrilhado de
 * unidades no cabelo, e a decimação por erro de corda não tem o que aproximar.
 *
 * Do outro lado da comparação a borda **já é lisa por construção**: `bordasEm` sai de
 * `CABECA.contorno`, 42 pontos de spline sobre ~300 unidades — um ponto de controle a
 * cada ~7 unidades. 17 linhas de raster são ~8,5 unidades da arte: a mesma
 * granularidade. Suavizar aqui não inventa forma; iguala as duas réguas.
 */
const JANELA_BORDA = 8;

export async function bordasDaArte(peca: FontePeca, altura = ALTURA_SVG): Promise<BordasDaArte> {
  const g = guiaChamada(peca, "cabeca");
  const bmp = await rasterizarSvg(svgDaCamada(peca.arquivo, g.subpaths), altura);
  const { mask } = binarizar(bmp);
  const esq = new Float32Array(bmp.h).fill(NaN);
  const dir = new Float32Array(bmp.h).fill(NaN);
  for (let y = 0; y < bmp.h; y++) {
    let a = -1;
    let z = -1;
    for (let x = 0; x < bmp.w; x++) {
      if (!mask[y * bmp.w + x]) continue;
      if (a < 0) a = x;
      z = x;
    }
    if (a >= 0 && z - a >= PISO_LARGURA) {
      esq[y] = a;
      dir[y] = z;
    }
  }

  // Média móvel só sobre as linhas que têm cabeça. Estender a janela para fora da
  // cabeça puxaria a borda em direção ao nada e afinaria a peça nos dois extremos,
  // que é justamente onde a cúpula importa.
  const suave = (v: Float32Array) => {
    const s = new Float32Array(v.length).fill(NaN);
    for (let y = 0; y < v.length; y++) {
      if (Number.isNaN(v[y])) continue;
      let soma = 0;
      let q = 0;
      for (let j = -JANELA_BORDA; j <= JANELA_BORDA; j++) {
        const k = y + j;
        if (k < 0 || k >= v.length || Number.isNaN(v[k])) continue;
        soma += v[k];
        q++;
      }
      s[y] = soma / q;
    }
    return s;
  };

  return { esq: suave(esq), dir: suave(dir), w: bmp.w, h: bmp.h };
}

/*
 * `reancorarNaCabeca` MORAVA AQUI, e o que ela fazia agora mora em `pousarPorMarcos`.
 *
 * Ela era a fração da linha com o `y` do mapa afim — o M1 da bancada. O pouso por
 * marcos faz a mesma conta em `x` e troca só o `y`, então mantê-la seria a segunda
 * descrição da mesma fração, que é a dívida que o topo deste arquivo já declarou uma
 * vez. Os testes dela foram apontados para a função nova, sem perder nenhuma medida:
 * ver `__tests__/importar-peca.test.ts`.
 *
 * `mapear.ts` continua tendo o M1 como CONTROLE da bancada, com a conta escrita lá —
 * e ali ela é um candidato reprovado sendo comparado, não uma segunda produção.
 */

/* ------------------------------------------------------------------ */
/* O pouso por marcos — o M4, e por que o topo sai da conta            */
/* ------------------------------------------------------------------ */

/**
 * OS MARCOS QUE O CABELO NÃO CONTAMINA — a linha dos olhos e a base do queixo.
 *
 * ---------------------------------------------------------------------------
 * A GUIA `cabeca`, NO ALTO, É O CABELO — e é isso que invalida o topo como marco
 * ---------------------------------------------------------------------------
 *
 * A guia é a silhueta externa da cabeça na arte. Medido: **99,94% da tinta declarada
 * da peça cai dentro dela**, e o que sai não passa de 5,2 unidades em 13 borrões,
 * nenhum maior que um traço ao quadrado. Não há tufo saindo da cabeça porque no alto
 * o contorno da cabeça **é** o contorno do cabelo: o gerador desenhou os bicos como a
 * silhueta.
 *
 * Casar `guia.topo` com `CAIXA_CABECA.y0` é, então, casar a **ponta dos bicos** com o
 * topo do crânio pelado. Os bicos pousam na cúpula, tudo que está entre eles pousa
 * abaixo dela — que é o couro cabeludo da coroa —, e a peça fica presa dentro da
 * silhueta, sem nada que quebre o contorno. É por isso que ela lia como capacete.
 *
 * A âncora sai daqui: **olhos e queixo**, os dois marcos que o cabelo não toca, e o
 * topo sai da conta. Medido na `curto-espetada`, no laço denso: a cobertura da coroa
 * vai de **0,520 para 0,860**, e a fração do pior arco de 0,218 para 0,057 — de
 * *"entre as duas famílias"* para **entalhe**, que é como cabelo espetado lê.
 *
 * **Por que os OLHOS e não a sobrancelha**, sendo que a reclamação era de sobrancelha:
 * a sobrancelha do produto é canônica (derivada do olho) e a da arte é um borrão que
 * nenhuma assinatura geométrica separa da franja escura em volta. Casar os olhos casa
 * a sobrancelha por construção nos dois.
 *
 * Os olhos da arte saem de `acharOlhos`, que identifica as duas cápsulas por **razão
 * de aspecto** e não por posição — derivar posição de uma posição presumida seria
 * circular.
 */
export interface Marcos {
  /** Em unidades do `viewBox` da ARTE. */
  arte: { topo: number; olhos: number; base: number };
  /** Em unidades do `viewBox` do PRODUTO. */
  produto: { topo: number; olhos: number; base: number };
  viewBoxDaArte: { w: number; h: number };
  laudo: string[];
}

export function marcosDaPeca(peca: FontePeca): Marcos {
  const g = guiaChamada(peca, "cabeca");
  const svg = lerSvg(peca.arquivo);
  const olhos = acharOlhos(svg, OLHO.w / OLHO.h);
  if (olhos.length < 2) {
    throw new Error(
      `marcosDaPeca: achei ${olhos.length} olho(s) em ${peca.arquivo}, preciso de 2.\n` +
        `O marco é a razão de aspecto ${(OLHO.w / OLHO.h).toFixed(3)}; se a arte não tiver ` +
        `as duas cápsulas, o pouso por marcos não se aplica a ela.`,
    );
  }
  const cyArte = olhos.reduce((a, o) => a + (o.caixa.y0 + o.caixa.y1) / 2, 0) / olhos.length;
  const cyProduto = (OLHO_CY_ESQ + OLHO_CY_DIR) / 2;

  const arte = { topo: g.caixa.y0, olhos: cyArte, base: g.caixa.y1 };
  const produto = { topo: CAIXA_CABECA.y0, olhos: cyProduto, base: CAIXA_CABECA.y1 };
  const kCaixa = (produto.base - produto.topo) / (arte.base - arte.topo);
  const olhoPeloAfim = produto.topo + (arte.olhos - arte.topo) * kCaixa;

  return {
    arte,
    produto,
    viewBoxDaArte: peca.viewBox,
    laudo: [
      `  marcos — arte topo ${arte.topo.toFixed(1)} · olhos ${arte.olhos.toFixed(1)} · ` +
        `base ${arte.base.toFixed(1)}   (viewBox ${peca.viewBox.w}×${peca.viewBox.h})`,
      `           produto topo ${produto.topo.toFixed(1)} · olhos ${produto.olhos.toFixed(1)} · ` +
        `base ${produto.base.toFixed(1)} · escala olhos→queixo ` +
        `${((produto.base - produto.olhos) / (arte.base - arte.olhos)).toFixed(4)}`,
      `           o mapa de CAIXA poria a linha dos olhos em ${olhoPeloAfim.toFixed(1)} contra ` +
        `${produto.olhos.toFixed(1)}: ${(olhoPeloAfim - produto.olhos).toFixed(1)} u abaixo`,
    ],
  };
}

/**
 * O PISO DE LARGURA DO LADO DO **PRODUTO** — o simétrico do `PISO_LARGURA` da arte.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ELE FECHA, MEDIDO
 * ---------------------------------------------------------------------------
 *
 * `PISO_LARGURA` já existe do lado da arte, e o motivo escrito ali vale palavra por
 * palavra: *"uma fração medida sobre 12 unidades multiplica todo erro de meio pixel por
 * trinta"*. O que faltava era a mesma pergunta do lado de **destino** — e é lá que uma
 * peça ancorada em olhos+queixo mora, porque ela sobe acima da coroa.
 *
 * `bordasEm(y)` acima de `CAIXA_CABECA.y0` **não é uma leitura do contorno**: é o
 * fallback documentado para "a horizontal não corta o crânio", e ele devolve a CAIXA
 * inteira — 364 unidades de largura, numa altura em que o crânio é um ponto. Logo
 * abaixo de `y0` a leitura vale, mas vai a zero: 0,77 u em `y = 45,51`, 7,7 em 45,6,
 * 38,4 em 46.
 *
 * Nas duas pontas a fração perde sentido, e nas duas ela explode. Medido no laço denso
 * do M4, com passo lateral **mediano de 0,335 u**:
 *
 * | | maior salto lateral entre pontos densos vizinhos |
 * |---|---|
 * | sem o piso de destino | **169,2 u** (e um segundo de 144,8) |
 * | com ele, pela vizinha | **22,7 u** |
 *
 * 169 unidades é 500× o passo mediano, e a arte não tem salto nenhum ali: é um ponto
 * com `t ≈ 1` pousando na borda LATERAL do crânio, 30 unidades acima da coroa. Era a
 * agulha que aparecia no canto superior direito da peça, e o mesmo do outro lado era
 * o nick na borda esquerda.
 *
 * O remédio é o que a função já faz do lado da arte: usar a linha VÁLIDA mais próxima.
 * Não inventa medição — repete a última que existiu, que é o que uma cúpula faz de
 * qualquer jeito perto do ápice.
 *
 * ---------------------------------------------------------------------------
 * O VALOR **NÃO** É O 16 DA ARTE, E COPIÁ-LO TERIA SIDO COPIAR A MOEDA ERRADA
 * ---------------------------------------------------------------------------
 *
 * `PISO_LARGURA` é em **pixel do raster da arte** (2048 de altura); este é em
 * **unidade do `viewBox` do produto** (700). Com o registro desta arte, 16 px de lá
 * valem ~5,3 unidades daqui — os dois 16 não são a mesma grandeza, e a simetria entre
 * os dois lados é de regra, não de número.
 *
 * O valor sai do **traço**, que é a régua de "cabe alguma coisa aqui?" no resto deste
 * pipeline: `MEIO_TRACO` é o limiar abaixo do qual duas curvas caem dentro da mesma
 * tinta preta. Uma fração precisa de um lado de dentro e um de fora, então ela precisa
 * de **dois traços** — 24 unidades. Abaixo disso o crânio inteiro naquela altura cabe
 * dentro de uma linha, e qualquer `t` desenha no mesmo preto.
 *
 * **A varredura concorda, e é ela que autoriza o número.** Maior salto lateral entre
 * pontos densos vizinhos no laço do M4, por piso — o passo mediano é 0,335 u:
 *
 * | piso | 0 | 4–16 | **24** | 32 | 48 | 64 | 96 | … | 300 |
 * |---|---|---|---|---|---|---|---|---|---|
 * | maior salto | 22,0 | 20,5 | **16,5** | 16,5 | 16,5 | 16,5 | 16,5 | 16,5 | 16,5 |
 *
 * A partir de 24 o número **para de responder**, e para em 16,5 — que é exatamente o
 * maior salto que o M1M2 já tem longe da coroa, ou seja o passo normal do laço onde a
 * sangria empurra uma borda. O piso deixou de ser o gargalo. É um platô de mais de uma
 * ordem de grandeza (24 a 300), e não um ponto afinado: o 2 × `TRACO` cai na primeira
 * casa dele.
 *
 * **O que o piso NÃO conserta, e o número diz:** a cobertura da coroa no laço DENSO é
 * 0,865 para todo piso de 0 a 300 — o mapa não é o que a perde. Ela cai para 0,742 na
 * peça decimada, e essa diferença é da decimação, que escolhe N por desvio e por
 * cruzamento e não tem como saber que comeu um bico da coroa. Escolher o piso pela
 * coroa FINA daria 96 ou 240 nesta arte e seria calibrar no desenho que se quer
 * aprovar — a série dela nem é monótona (0,843 · 0,651 · 0,773 · 0,843).
 */
export const PISO_DESTINO = 2 * TRACO;

/**
 * A FAIXA DE ALTURA EM QUE O CRÂNIO TEM LARGURA — calculada uma vez, e não por ponto.
 *
 * Fora dela a largura só encolhe (é o ápice de um lado e o queixo do outro), então a
 * altura válida mais próxima de um `y` fora é sempre a **ponta da faixa**, e o
 * `clamp` abaixo é exato em vez de aproximado. Que a faixa seja contígua — que não
 * haja um estrangulamento no meio da cabeça — é o que torna isso verdade, e
 * `__tests__/importar-peca.test.ts` mede a contiguidade em vez de supô-la.
 */
export const FAIXA_COM_LARGURA = (() => {
  const passo = 0.25;
  let de = NaN;
  let ate = NaN;
  for (let y = CAIXA_CABECA.y0; y <= CAIXA_CABECA.y1; y += passo) {
    const b = bordasEm(y);
    if (b.dir - b.esq < PISO_DESTINO) continue;
    if (Number.isNaN(de)) de = y;
    ate = y;
  }
  return { de, ate };
})();

/** A altura mais próxima de `y` em que o crânio é largo o bastante para ter fração. */
export const alturaComLargura = (y: number) =>
  Math.min(Math.max(y, FAIXA_COM_LARGURA.de), FAIXA_COM_LARGURA.ate);

/**
 * O PONTO, DA CABEÇA DA ARTE PARA A DO PRODUTO — `y` por marcos, `x` por fração.
 *
 * Entra em pixel do raster da arte pelo mapa afim (é o espaço em que `medirMassa`
 * trabalha) e sai em unidade do produto, que é o espaço do resto do caminho —
 * compressão do teto, sangria, decimação. Trocar de espaço no meio é o erro de método
 * que já custou uma medição inteira.
 *
 * As duas contas são independentes e as duas precisam da outra: o `y` novo muda a
 * linha em que a borda do crânio tem de ser lida, e ler a linha de onde o ponto **veio**
 * reabriria em `x` o erro que se está fechando em `y`. Por isso `bordasEm` é
 * consultada em `yDestino`, e não em `p.y`.
 */
export function pousarPorMarcos(
  pts: { x: number; y: number }[],
  m: Mapa,
  b: BordasDaArte,
  marcos: Marcos,
  alturaDoRaster = ALTURA_SVG,
): { pts: { x: number; y: number }[]; corrigidos: number } {
  const { arte, produto } = marcos;
  const k = (produto.base - produto.olhos) / (arte.base - arte.olhos);
  const linhaDaArte = (uy: number) => Math.round((uy - m.tu0) / m.ky + m.ty0);
  const unidadeDaArte = (py: number) => (py * marcos.viewBoxDaArte.h) / alturaDoRaster;

  let corrigidos = 0;
  const saida = pts.map((p) => {
    const py0 = linhaDaArte(p.y);
    const y = produto.olhos + (unidadeDaArte(py0) - arte.olhos) * k;

    // A linha da ARTE sem largura: a válida mais próxima, para os dois lados. É o
    // ápice da cúpula, onde a cabeça da arte tem menos de `PISO_LARGURA` pixels.
    let py = py0;
    if (py >= 0 && py < b.h && Number.isNaN(b.esq[py])) {
      for (let d = 1; d < b.h; d++) {
        if (py0 + d < b.h && !Number.isNaN(b.esq[py0 + d])) {
          py = py0 + d;
          break;
        }
        if (py0 - d >= 0 && !Number.isNaN(b.esq[py0 - d])) {
          py = py0 - d;
          break;
        }
      }
    }
    if (py < 0 || py >= b.h || Number.isNaN(b.esq[py])) return { x: p.x, y };

    const px = (p.x - m.eu0) / m.kx + m.ex0;
    const t = (px - b.esq[py]) / (b.dir[py] - b.esq[py]);
    // E a linha do PRODUTO sem largura: a mesma regra, do outro lado. Ver `PISO_DESTINO`.
    const { esq, dir } = bordasEm(alturaComLargura(y));
    corrigidos++;
    return { x: esq + t * (dir - esq), y };
  });
  return { pts: saida, corrigidos };
}

/* ------------------------------------------------------------------ */
/* A peça                                                              */
/* ------------------------------------------------------------------ */

/**
 * O TAMANHO A PARTIR DO QUAL UMA COMPONENTE SOLTA REPROVA, em % da maior.
 *
 * O laço externo é **um**: `bordaOrdenada` anda por uma fronteira só. Se a tinta
 * declarada estiver partida em duas ilhas, a segunda não entra na peça — que é
 * literalmente o descarte silencioso que este pipeline existe para fechar, só que
 * agora vindo de dentro.
 *
 * Meio por cento porque abaixo disso a ilha é menor que a fragmentação do próprio
 * traço da arte (medida: o preto vem em 47 subpaths, e o maior fragmento solto do teal
 * desta arte pesa 0,05% da massa). Acima, ou a curadoria declarou como peça algo que
 * está separado dela, ou existe ali uma mecha que precisa virar `extensao`.
 */
export const PISO_ILHA = 0.5;

/**
 * O N DA CURVA, COM UMA EXIGÊNCIA A MAIS: O LAÇO ENTREGUE NÃO PODE SE CRUZAR.
 *
 * `escolherN` julga uma coisa só — o erro de corda —, e ela é a certa para a régua
 * paramétrica, onde a curva é aberta e não preenche nada. Num laço FECHADO o `nonzero`
 * do SVG vaza o trecho entre o cruzamento e a ponta, e sai um entalhe que ninguém
 * desenhou. Um entalhe não é um desvio maior: é outra forma.
 *
 * Medido nesta arte, varrendo a escala inteira sobre o mesmo laço denso:
 *
 * | N  | desvio | cruzamentos |
 * |----|--------|-------------|
 * | 20 | 46,2   | 0           |
 * | 24 | 18,6   | 1           |
 * | 32 | 18,4   | 2           |
 * | **40** | **21,2** | **0** |
 * | 48 | 13,6   | 1           |
 * | 64 | 10,8   | 2           |
 *
 * Não existe N que tenha os dois. A escolha é entre 10,8 unidades de desvio com dois
 * entalhes e 21,2 sem nenhum — 1,7 px a 56 —, e o que produz os cruzamentos é
 * conhecido e está escrito em `autoIntersecoes`: a **ponta da cortina**, onde a massa
 * afina até os dois lados quase se encostarem e a decimação come a largura antes do
 * comprimento. É a mesma família do destino das ~12 pontas, que é decisão do
 * checkpoint C — e enquanto ela não é tomada, a régua entrega a forma inteira, não a
 * forma com buracos.
 *
 * ---------------------------------------------------------------------------
 * O LAÇO JULGADO TEM DE SER O LAÇO ENTREGUE — e para a clara ele não era
 * ---------------------------------------------------------------------------
 *
 * A clara não sai daqui direto para a peça: ela ainda passa por `conterAClara`, que
 * translada as cordas que vazam da massa. Julgar a decimação **antes** dessa etapa é
 * julgar um laço que ninguém desenha, e foi assim que 11 auto-interseções chegaram à
 * peça com este gate verde.
 *
 * Medido na `curto-espetada` pelo M4, na escala inteira de N: a clara decimada tem
 * **0** cruzamentos em todos os doze valores, de 8 a 64 — e depois da contenção tem
 * **11** em N = 40 e em N = 48. O defeito nascia do outro lado do teste.
 *
 * `depois` é o que fecha isso: quem chama passa a transformação que ainda falta, e a
 * varredura passa a perguntar da forma que o navegador vai receber. Para a massa não
 * há `depois`, e ali o parâmetro é ausente em vez de identidade — ausente diz *nada
 * acontece depois*, identidade diria *acontece alguma coisa que não muda nada*.
 *
 * ---------------------------------------------------------------------------
 * E UMA TERCEIRA: A DECIMAÇÃO NÃO PODE COBRAR A COROA
 * ---------------------------------------------------------------------------
 *
 * O erro de corda é uma distância **sem sinal**: uma corda que atravessa a cúpula 16
 * unidades por DENTRO e uma que passa 16 por FORA valem a mesma nota. As duas não
 * valem a mesma coisa — a de fora é um cabelo mais gordo, a de dentro é couro
 * cabeludo à mostra, que é o gate `coberturaDaCoroa`. O cruzamento tampouco enxerga
 * isso: um entalhe cavado por uma corda não é um laço que se cruza.
 *
 * Medido na `curto-espetada`, com o laço denso em 0,865 de coroa, o N escolhido pelos
 * dois critérios de cima entregava **0,742** — 0,122 de coroa perdidos numa etapa que
 * não tinha como saber que os estava perdendo, e a série de coroa contra N nem é
 * monótona (0,72 · 0,52 · 0,61 · 0,28 · 0,76 · 0,74 · 0,88).
 *
 * `aprova` é a exigência que quem chama acrescenta sobre o laço **entregue**. Para a
 * massa ela é *"a coroa da peça decimada não pode ser menor que a do laço denso"* — e
 * repare que a régua é o laço denso **desta peça**, não um piso escolhido. Um teto
 * afinado aqui seria calibrar na arte que se quer aprovar; um *não regride* compara a
 * decimação com aquilo que ela existe para aproximar, e vale igual em qualquer arte.
 *
 * Para a clara o parâmetro é ausente: `coberturaDaCoroa` pergunta da camada da touca,
 * e a clara não é uma touca — exigir dela a mesma coisa mediria outra peça.
 *
 * **Quando nenhum N cumpre as três, `aprovados` sai vazio e a escolha cai de volta nos
 * limpos** — um laço que se cruza vaza um buraco, e isso é pior que uma coroa curta.
 * Quem chama imprime a queda: silêncio aqui seria a peça saindo com a coroa comida e
 * o laudo dizendo que estava tudo bem, que é o defeito que esta rodada fechou.
 */
export function decidirN(
  denso: { x: number; y: number }[],
  fechado = true,
  depois?: (laco: { x: number; y: number }[]) => { x: number; y: number }[],
  aprova?: (laco: { x: number; y: number }[]) => boolean,
) {
  const e = escolherN(denso, fechado);
  const entregue = (n: number) => {
    const red = decimarPorCorda(denso, n, { fechado });
    return depois ? depois(red) : red;
  };
  const limpos = e.varredura.filter((v) => autoIntersecoes(entregue(v.n)).length === 0);
  const aprovados = aprova ? limpos.filter((v) => aprova(entregue(v.n))) : limpos;
  const pool = aprovados.length ? aprovados : limpos;
  const alvo = Math.max(MEIO_TRACO, e.piso * 1.1);
  const escolhido = pool.find((v) => v.max <= alvo) ?? [...pool].sort((a, b) => a.max - b.max)[0];
  return {
    ...e,
    n: escolhido?.n ?? e.n,
    limpos: limpos.map((v) => v.n),
    aprovados: aprovados.map((v) => v.n),
  };
}

/**
 * ONDE O LAÇO ENTREGUE LEVA TRAÇO — a sonda pela normal, promovida a decisão.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA É POR TRECHO, E NÃO POR VÉRTICE
 * ---------------------------------------------------------------------------
 *
 * `medirMassa` responde "há preto da arte aqui?" em cada um dos ~3 000 pontos do
 * laço denso. O que se desenha são os ~40 TRECHOS do laço decimado, e cada trecho
 * resume ~75 pontos densos. Perguntar ao vértice — um ponto de 75 — decidiria o
 * trecho inteiro por uma amostra: bastaria o vértice cair na única emenda em que o
 * gerador não fechou o contorno para um trecho traçado sumir, ou o contrário.
 *
 * Então a régua é a MAIORIA do trecho. É a mesma escolha, e o mesmo motivo, do
 * `maisBaixo` de `folgaDoRosto`: comparar por faixa em vez de parear por índice,
 * quando as duas amostragens têm densidades diferentes.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO EXISTE TETO PARA CALIBRAR AQUI
 * ---------------------------------------------------------------------------
 *
 * Meio a meio não é um limiar afinado: é a definição de maioria. Um trecho em que
 * 51% do denso tem preto e 49% não tem é um trecho em que a arte hesita, e as duas
 * respostas erram pela mesma margem — não há número melhor a escolher, e escolher
 * 0,6 ou 0,4 seria calibrar na `curto-espetada`, que é o que a regra do teto proíbe.
 */
const MAIORIA = 0.5;

export function arcosComPreto(
  laco: readonly { i: number }[],
  comContorno: readonly boolean[],
): [number, number][] {
  const N = laco.length;
  const D = comContorno.length;
  if (N < 2 || !D) return [];

  const traca = laco.map((v, k) => {
    let q = 0;
    let total = 0;
    for (let j = v.i; j !== laco[(k + 1) % N].i; j = (j + 1) % D) {
      total++;
      if (comContorno[j]) q++;
      if (total > D) break;
    }
    // Trecho sem ponto denso no meio (dois vértices vizinhos no denso): cai no
    // próprio vértice, que ali é a amostra inteira e não uma amostra de muitas.
    return total ? q / total >= MAIORIA : Boolean(comContorno[v.i]);
  });

  // O laço inteiro traçado é UM arco, e a convenção de `Cabelo.linhas` para ele é
  // `[k, k]` — sem este caso a varredura abaixo não acharia início nenhum, porque
  // início é "traça e o anterior não traça", e aqui não existe anterior que não trace.
  if (traca.every(Boolean)) return [[0, 0]];

  const arcos: [number, number][] = [];
  for (let k = 0; k < N; k++) {
    if (!traca[k] || traca[(k - 1 + N) % N]) continue;
    let q = 0;
    while (q < N && traca[(k + q) % N]) q++;
    arcos.push([k, (k + q) % N]);
  }
  return arcos;
}

export interface Importacao {
  peca: Cabelo;
  mapa: Mapa;
  mascaras: MascarasDaPeca;
  /** Componentes conexas da união, em % da maior. A primeira é sempre 100. */
  ilhas: number[];
  teto: { k: number; antes: number };
  n: { massa: ReturnType<typeof decidirN>; clara: ReturnType<typeof decidirN> };
  desvio: { massa: number; clara: number };
  sangria: { quantos: number; travados: number };
  conferencia: ReturnType<typeof medirMassa>["conferencia"];
  furos: number[];
  cruzamentos: { massa: number; clara: number };
  /**
   * O laço DENSO já tratado — mil e duzentos pontos que não cabem em orçamento nenhum.
   *
   * Ele não é entregável: existe para separar duas causas que o número ponta a ponta
   * soma — quanto do desvio é a decimação e quanto é a arte. Sem a separação, um
   * limiar reprovando não diz se a resposta é mais pontos ou outra arte.
   */
  densoMassa: { x: number; y: number }[];
  /** Reprova a importação: contrato, tinta, ilha, completude, laço cruzado. */
  falhas: string[];
  /** Não reprova: o que só a arte resolve, e que vai para a folha do checkpoint C. */
  achados: string[];
  laudo: string[];
}

/**
 * DA FONTE DECLARADA PARA `{t, y}` — o mesmo caminho da régua, com outra origem.
 *
 * Nada de geometria nova mora aqui. `medirMassa`, `medirClara`, `comprimirNoTeto`,
 * `sangrarNaSilhueta`, `escolherN` e `decimarPorCorda` são as funções de
 * `tracar-cabelo.ts`, consumidas por `export`. O que esta função troca é só **de onde
 * vem a máscara**: papel declarado em vez de componente conexa adivinhada no pixel.
 */
export async function importarPeca(caminhoSemantica: string, id: Cabelo["id"] = "curto"): Promise<Importacao> {
  const falhas: string[] = [];
  const achados: string[] = [];
  const laudo: string[] = [];
  const peca = lerFontePecaOuFalhar(caminhoSemantica);

  // O contrato de tinta, e ele é o gate que pega a inversão de tom. Um papel
  // `tom-claro` pintado com o token de sombra produz um arquivo perfeitamente legal e
  // a peça sai com o volume ao contrário — ver `semantizar.ts`.
  for (const c of peca.camadas) {
    const esperado =
      c.papel === "tom-claro" ? TINTA.clara : c.papel === "linha-mascara" ? TINTA.linha : TINTA.base;
    if (c.paint !== esperado) {
      falhas.push(
        `camada "${c.papel}" com \`data-avatar-paint="${c.paint}"\`, esperado "${esperado}". ` +
          `O compositor pinta a massa com \`${TINTA.base}\` e a clara por cima com ` +
          `\`${TINTA.clara}\` — com os tokens trocados a peça sai com o volume ao contrário.`,
      );
    }
    if (c.papel === "extensao") {
      falhas.push(
        `camada \`extensao\` ("${c.grupo ?? "sem grupo"}"): o caminho de extensão não está medido. ` +
          `Esta arte tem ZERO — a cortina está 100% dentro da cabeça —, e o primeiro uso real ` +
          `é o traje do Soldado, no checkpoint D. Escrevê-lo agora seria código sem arte que o prove.`,
      );
    }
  }

  const mapa = registroDaPeca(peca, true);
  const mascaras = await mascarasDaPeca(peca);
  const grupos = conexas(mascaras.uniao, mascaras.w, mascaras.h);
  const ilhas = grupos.map((g) => (100 * g.length) / (grupos[0]?.length || 1));
  for (const [i, pct] of ilhas.entries()) {
    if (i === 0 || pct < PISO_ILHA) continue;
    falhas.push(
      `a tinta declarada está partida: componente ${i + 1} com ${pct.toFixed(2)}% da maior ` +
        `(piso ${PISO_ILHA}%). O laço externo é UM, então ela não entraria na peça — que é o ` +
        `descarte silencioso de volta. Ou ela é \`extensao\`, ou não é desta peça.`,
    );
  }

  const seg = segmentacaoDaPeca(mascaras, [`fonte semântica · ${caminhoSemantica}`]);

  /**
   * DUAS PASSADAS, E A PRIMEIRA EXISTE PARA MEDIR O TRAÇO DA ARTE.
   *
   * `medirMassa` recua meio `TRACO` — 6 unidades, a espessura do PRODUTO — onde a
   * normal não acha preto. Nesta importação isso acontece em 876 dos 3 028 pontos, e a
   * razão é estrutural: quem desenha a borda do alto da cabeça na arte é o contorno do
   * BONECO, que é `descarte`. O traço desta arte tem 3,0 u, então o recuo padrão
   * encolheria a peça 4,5 u em cada um desses pontos — e para dentro, calado.
   *
   * A espessura não se sabe antes de medir, então ela é medida e devolvida. A segunda
   * passada é a peça; a primeira é a régua da primeira.
   */
  const sonda = medirMassa(seg, mapa, mascaras.h);
  const recuoPx = sonda.conferencia.espessura.mediana / 2 / mapa.kx;
  const massa = medirMassa(seg, mapa, mascaras.h, recuoPx);
  const clara = medirClara(seg, mapa, mascaras.h);

  // O pouso vem ANTES de tudo: a compressão do teto e a sangria falam do crânio do
  // produto, e aplicá-las sobre um ponto ainda ancorado na cabeça da arte seria medir
  // uma silhueta com a régua da outra.
  const bordas = await bordasDaArte(peca);
  const marcos = marcosDaPeca(peca);
  const rMassa = pousarPorMarcos(massa.denso, mapa, bordas, marcos);
  const rClara = pousarPorMarcos(clara.denso, mapa, bordas, marcos);

  const k = comprimirNoTeto(rMassa.pts.length ? Math.min(...rMassa.pts.map((p) => p.y)) : CAIXA_CABECA.y0);
  const mover = aplicarK(k);
  const sangria = sangrarNaSilhueta(rMassa.pts.map(mover));
  const massaC = sangria.pts;
  const claraC = rClara.pts.map(mover);

  // A coroa do laço DENSO é a régua da terceira exigência de `decidirN`: a decimação
  // pode custar desvio, e não pode custar cobertura da coroa. Ver o docstring de lá.
  const coroaDensa = coberturaDaCoroa({ id, nome: "denso", massa: massaC.map(paraTY) }) ?? 0;
  const nMassa = decidirN(
    massaC,
    true,
    undefined,
    (laco) => (coberturaDaCoroa({ id, nome: "n", massa: laco.map(paraTY) }) ?? 0) >= coroaDensa,
  );
  // A massa DECIMADA é o que a contenção da clara persegue, então ela precisa existir
  // antes do N da clara — e é por isso que a ordem aqui não é simétrica.
  const massaParaConter = massaC.length ? decimarPorCorda(massaC, nMassa.n, { fechado: true }) : [];
  const nClara = claraC.length
    ? decidirN(claraC, true, (laco) => conterAClara(laco.map((q) => ({ ...q })), massaParaConter).pts)
    : { n: 0, piso: 0, varredura: [], limpos: [], aprovados: [] };
  // O laço decimado carrega o ÍNDICE DENSO de cada vértice — `decimarPorCorda` é
  // genérica e devolve os próprios objetos, então o campo atravessa de graça. Sem ele
  // não há como perguntar, depois, qual trecho do denso cada trecho do laço final
  // resume, e a sonda de preto ficaria sem onde pousar.
  const massaIdx = massaC.map((p, i) => ({ x: p.x, y: p.y, i }));
  const massaFina = massaC.length ? decimarPorCorda(massaIdx, nMassa.n, { fechado: true }) : [];
  const claraFina = claraC.length ? decimarPorCorda(claraC, nClara.n, { fechado: true }) : [];
  const contida = conterAClara(claraFina, massaFina);
  if (!contida.convergiu) {
    falhas.push(
      `a contenção da clara não chegou ao ponto fixo dentro do teto de passadas: ` +
        `${contida.cordas} corda(s) ainda saindo da massa. Nesta arte ela converge em 5 — ` +
        `estourar o teto quer dizer que a clara e a massa discordam de forma, e isso é ` +
        `medição no lugar errado, não ruído de amostragem.`,
    );
  }
  const linhas = arcosComPreto(massaFina, massa.comContorno);

  const saida: Cabelo = {
    id,
    nome: "importado",
    massa: massaFina.map(paraTY),
    ...(contida.pts.length ? { clara: contida.pts.map(paraTY) } : {}),
    ...(linhas.length ? { linhas } : {}),
  };

  const desvioDe = (denso: { x: number; y: number }[], reduzido: { x: number; y: number }[]) =>
    reduzido.length ? desvioDaCorda(denso, [...reduzido, reduzido[0]]).max : 0;

  const cruzamentos = {
    massa: autoIntersecoes((saida.massa ?? []).map(paraXY)).length,
    clara: autoIntersecoes((saida.clara ?? []).map(paraXY)).length,
  };
  if (cruzamentos.massa || cruzamentos.clara) {
    falhas.push(
      `laço com auto-interseção (massa ${cruzamentos.massa} · clara ${cruzamentos.clara}): o ` +
        `\`nonzero\` do SVG VAZA o trecho entre o cruzamento e a ponta, e sai um entalhe que ` +
        `ninguém desenhou.`,
    );
  }

  /**
   * ACHADO NÃO É FALHA, E MISTURAR OS DOIS TIRA O DENTE DOS DOIS.
   *
   * **Falha** é o que a importação controla: contrato, tinta, ilha solta, completude,
   * laço que se cruza. Ela reprova, e a correção mora neste pipeline.
   *
   * **Achado** é o que só a arte resolve — a cabeça do gerador ser mais redonda que a
   * do kokeshi, a franja da arte descer sobre a sobrancelha do produto, a clara
   * encostar na borda. Reprovar por eles faria o gate exigir do importador uma decisão
   * que é do Doug com a folha na mão (checkpoint C), e um gate que ninguém consegue
   * deixar verde é um gate que se aprende a ignorar.
   */
  const contencao = contencaoDaClara(saida);
  const folga = folgaDoRosto(saida);
  const coroa = coberturaDaCoroa(saida) ?? 0;
  if (coroa < 1) {
    achados.push(
      `a peça cobre ${(100 * coroa).toFixed(1)}% da coroa (exigido 100), contra ` +
        `${(100 * coroaDensa).toFixed(1)}% do laço denso — o que falta é da ARTE, não da decimação. ` +
        `A cabeça da arte é mais ESTREITA que o crânio do kokeshi na cúpula — até 100 u a menos —, e ` +
        `o que sobra são os entalhes entre as ~12 pontas. Destino das pontas = checkpoint C.`,
    );
  }
  if (!nMassa.aprovados.length) {
    achados.push(
      `nenhum N da escala manteve a coroa do laço denso (${(100 * coroaDensa).toFixed(1)}%): a escolha ` +
        `caiu de volta nos ${nMassa.limpos.length} N sem auto-interseção, e a peça saiu com ` +
        `${(100 * coroa).toFixed(1)}%. Ou a escala de N é curta para esta arte, ou o laço denso tem um ` +
        `dente que come o orçamento — ver \`sangrarNaSilhueta\`.`,
    );
  }
  if (Math.min(folga.esq, folga.dir) < 0) {
    achados.push(
      `a peça desce sobre a sobrancelha: folga esq ${folga.esq.toFixed(1)} · dir ${folga.dir.toFixed(1)} u. ` +
        `A ARTE deixa 1,0 u de testa na cabeça DELA; a sobrancelha do produto está mais alta. ` +
        `A régua não sobe a peça — subir foi o que produziu a faixa de testa nua da folha HSHC93.`,
    );
  }
  if (contencao < 0) {
    achados.push(
      `a clara sai ${(-contencao).toFixed(2)} u da massa (piso 0) = ${(-contencao / 12.5).toFixed(2)} px a 56. ` +
        `\`conterAClara\` projeta VÉRTICE, e \`contencaoDaClara\` mede o SEGMENTO entre eles — o ` +
        `resíduo é a corda passando por fora onde os dois laços têm curvatura diferente.`,
    );
  }

  laudo.push(`IMPORTAR — ${caminhoSemantica}`);
  laudo.push(
    `  raster ${mascaras.w}×${mascaras.h} · registro kx ${mapa.kx.toFixed(4)} ky ${mapa.ky.toFixed(4)} ` +
      `· anisotropia ${(100 * anisotropia(mapa)).toFixed(2)}%`,
  );
  for (const c of mascaras.camadas) {
    laudo.push(
      `  ${c.camada.papel.padEnd(13)} ${c.camada.paint.padEnd(9)} ` +
        `${String(c.camada.subpaths.length).padStart(3)} subpaths · ${String(c.pixels).padStart(8)} px do raster`,
    );
  }
  laudo.push(
    `  componentes da união: ${ilhas.length} — ${ilhas.slice(0, 4).map((p) => `${p.toFixed(2)}%`).join(" · ")}` +
      (ilhas.length > 4 ? ` · …` : ""),
  );
  laudo.push(...marcos.laudo);
  laudo.push(
    `  pousados pela fração da linha: massa ${rMassa.corrigidos}/${massa.denso.length} · ` +
      `clara ${rClara.corrigidos}/${clara.denso.length}   (o resto sai pelo mapa afim)`,
  );

  return {
    peca: saida,
    mapa,
    mascaras,
    ilhas,
    teto: { k, antes: rMassa.pts.length ? Math.min(...rMassa.pts.map((p) => p.y)) : CAIXA_CABECA.y0 },
    n: { massa: nMassa, clara: nClara },
    desvio: { massa: desvioDe(massaC, massaFina), clara: desvioDe(claraC, contida.pts) },
    sangria: { quantos: sangria.quantos, travados: sangria.travados },
    conferencia: massa.conferencia,
    furos: massa.furos,
    cruzamentos,
    densoMassa: massaC,
    falhas,
    achados,
    laudo,
  };
}

/* ------------------------------------------------------------------ */
/* Completude raster — a rede de proteção                              */
/* ------------------------------------------------------------------ */

/**
 * A UNIÃO DOS PAPÉIS COBRE A TINTA DA REFERÊNCIA?
 *
 * A completude **estrutural** (`conferirCompletude`) é exata e não tem teto: ela
 * compara conjunto de subpaths com conjunto de subpaths. O que ela não enxerga é
 * tinta que o conversor perdeu **antes de o SVG existir** — nesse caso a origem e a
 * semântica concordam perfeitamente, e as duas estão erradas do mesmo jeito.
 *
 * Esta olha para fora das duas: rasteriza a união dos papéis no tamanho do PNG de
 * referência e pergunta quanto do cabelo do PNG ficou de fora. As duas direções são
 * medidas, e a segunda é o **controle negativo**: tinta declarada que a arte não tem
 * como cabelo é rosto, gola ou fundo entrando na peça — o defeito que faria um gate de
 * cobertura ficar verde porque a figura inteira está lá, e não porque a peça está.
 *
 * O teto é calibrado em **fixture sintética** (`completude-raster.test.ts`), nunca
 * nesta arte: teto calibrado na peça que se quer aprovar aprova o defeito junto.
 */
export interface CompletudeRaster {
  /** Toda a tinta de cabelo do PNG fora da união. Dominado pelo PERÍMETRO — ver `BANDA`. */
  soNaArte: number;
  /** Dela, só o que está a mais de `BANDA` px da união. É **isto** que é buraco. */
  buraco: number;
  /** Toda a união que cai onde o PNG não tem cabelo. */
  soNaPeca: number;
  /** Dela, só o que está a mais de `BANDA` px do cabelo do PNG. É o controle negativo. */
  invasao: number;
  pixelsDaArte: number;
  pixelsDaPeca: number;
}

/**
 * A BANDA DE BORDA, EM PIXELS DO PNG — e ela existe porque a primeira versão do gate
 * media o PERÍMETRO e chamava o resultado de completude.
 *
 * Medido na `curto-espetada`: **5,32%** da tinta de cabelo do PNG cai fora da união
 * dos papéis, o que com um teto de área reprovaria a peça. A distribuição desmente a
 * leitura de buraco:
 *
 * | distância até a união | acumulado do que faltou |
 * |---|---|
 * | ≤ 1 px | 57,4% |
 * | ≤ 3 px | 93,3% |
 * | ≤ 5 px | **99,4%** |
 * | ≤ 10 px | 100,0% |
 * | > 20 px | **0 pixels** |
 *
 * Não há um único pixel de cabelo a mais de 20 px da peça. O que existe é a diferença
 * entre duas descrições da MESMA borda — o conversor traça a fronteira do
 * preenchimento, e o teste de matiz no PNG aceita a rampa de antialiasing que ela
 * exclui —, e essa diferença cresce com o **perímetro**. Esta arte tem 520 subpaths;
 * uma peça com o dobro de fragmentos teria o dobro do número sem ter perdido nada.
 *
 * Cinco pixels, e não um número escolhido: é onde a distribuição acima satura, e é a
 * mesma ordem de grandeza do `PISO_AREA` de `fonte-svg.ts` — 21 u², um borrão de
 * 4,6×4,6. Um buraco que cabe dentro da banda é menor que o fragmento que o piso já
 * declara não carregar forma.
 */
export const BANDA = 5;

/**
 * O TETO DO BURACO E DA INVASÃO — calibrado em fixture sintética, nunca nesta arte.
 *
 * Teto calibrado na peça que se quer aprovar aprova o defeito junto. A fixture de
 * `__tests__/completude-raster.test.ts` constrói o par PNG/SVG, então o tamanho do
 * defeito é conhecido **antes** de ser medido:
 *
 * | fixture | buraco | invasão |
 * |---|---|---|
 * | idêntico | **0,00%** | **0,00%** |
 * | um dos dois blocos não declarado | **50,00%** | 0,00% |
 * | `rosto-e-gola` (pele marcada como peça) | 0,00% | **19,92%** |
 *
 * Um por cento fica duas ordens de grandeza acima do piso do método e vinte vezes
 * abaixo do menor defeito que a fixture sabe produzir. Não é um número afinado: é a
 * faixa inteira entre "nada" e "metade da peça sumiu".
 *
 * A `curto-espetada` mede 0,03% de buraco e 0,44% de invasão — os dois passam, e os
 * dois estão longe do teto pelos dois lados.
 */
export const TETO_COMPLETUDE = 0.01;

export async function completudeRaster(
  peca: FontePeca,
  png: Buffer | string,
): Promise<CompletudeRaster> {
  const bmp = await cru(png);
  const m = await mascarasDaPeca(peca, bmp.h);

  const arte = new Uint8Array(bmp.w * bmp.h);
  let daArte = 0;
  for (let y = 0; y < bmp.h; y++) {
    for (let x = 0; x < bmp.w; x++) {
      // , e não : a pergunta aqui é só *este pixel é tinta
      // de cabelo?*.  traz junto os âncoras de TRONCO, que dependem de
      // haver contorno escuro na imagem — e reprovariam toda fixture sintética por um
      // motivo que não tem nada a ver com completude.
      if (!amostrar(bmp, x, y).eCabelo) continue;
      arte[y * bmp.w + x] = 1;
      daArte++;
    }
  }
  const ateAPeca = distanciaDe(m.uniao, m.w, m.h);
  const ateAArte = distanciaDe(arte, bmp.w, bmp.h);

  let soNaArte = 0;
  let buraco = 0;
  let soNaPeca = 0;
  let invasao = 0;
  let daPeca = 0;
  for (let i = 0; i < arte.length; i++) {
    const ePeca = m.uniao[i] === 1;
    if (ePeca) daPeca++;
    if (arte[i] && !ePeca) {
      soNaArte++;
      if (ateAPeca[i] > BANDA) buraco++;
    }
    if (!arte[i] && ePeca) {
      soNaPeca++;
      if (ateAArte[i] > BANDA) invasao++;
    }
  }
  const f = (v: number) => (daArte ? v / daArte : 0);
  return {
    soNaArte: f(soNaArte),
    buraco: f(buraco),
    soNaPeca: f(soNaPeca),
    invasao: f(invasao),
    pixelsDaArte: daArte,
    pixelsDaPeca: daPeca,
  };
}

/* ------------------------------------------------------------------ */
/* O literal, e a prova de que o colado ainda é o importado            */
/* ------------------------------------------------------------------ */

/**
 * O LITERAL PARA COLAR — e a colagem é manual, de propósito.
 *
 * O mesmo motivo dos 42 pontos do crânio: um literal colado aparece no diff, um
 * literal gerado em tempo de build não. Quem prova que a cópia continua fiel é
 * `--check`, e não um hash escrito em markdown — este repositório já pagou o erro de
 * número à mão em documento (é por isso que `docs/ESTADO.md` é gerado).
 */
export function literalDaPeca(p: Cabelo): string {
  const L: string[] = [];
  L.push(`export const PECA = {`);
  L.push(`  massa: [`);
  for (const q of p.massa ?? []) L.push(`    { t: ${num(q.t)}, y: ${num(q.y)} },`);
  L.push(`  ],`);
  if (p.clara?.length) {
    L.push(`  clara: [`);
    for (const q of p.clara) L.push(`    { t: ${num(q.t)}, y: ${num(q.y)} },`);
    L.push(`  ],`);
  }
  if (p.linhas?.length) {
    // Um par por linha do arquivo custaria 40 linhas de diff para 20 números. Os
    // arcos são pares de inteiros pequenos e cabem lado a lado sem ninguém perder o
    // fio — ao contrário dos pontos, que têm três casas decimais em dois eixos.
    L.push(`  linhas: [${p.linhas.map(([a, b]) => `[${a}, ${b}]`).join(", ")}],`);
  }
  L.push(`} as const;`);
  return L.join("\n");
}

/** Uma peça achatada em números, na ordem em que sai. É o que `--check` compara. */
type Colada = {
  massa?: readonly PontoFranja[];
  clara?: readonly PontoFranja[];
  linhas?: readonly (readonly [number, number])[];
};
const achatar = (p: Colada): number[] => [
  (p.massa ?? []).length,
  ...(p.massa ?? []).flatMap((q) => [num(q.t), num(q.y)]),
  (p.clara ?? []).length,
  ...(p.clara ?? []).flatMap((q) => [num(q.t), num(q.y)]),
  // Os arcos entram na conferência pelo mesmo motivo das curvas: `semantica.svg`
  // muda, o traço passa a cair em outro lugar do laço, e sem isto o `--check`
  // aprovaria um literal em que só a massa foi recolada.
  (p.linhas ?? []).length,
  ...(p.linhas ?? []).flatMap((a) => [a[0], a[1]]),
];

/**
 * O LITERAL COLADO AINDA É O QUE A FONTE PRODUZ?
 *
 * O risco é concreto e silencioso: `semantica.svg` muda, ninguém recola, e a fonte e o
 * que o produto desenha divergem sem nada acusar. A comparação é numérica sobre o
 * literal já **importado como módulo** — comparar texto pegaria uma vírgula movida e
 * perderia um número trocado por outro que arredonda igual.
 */
export function conferirLiteral(importada: Cabelo, colada: Colada): string[] {
  const a = achatar(importada);
  const b = achatar(colada);
  if (a.length !== b.length) {
    return [
      `o literal colado tem ${(colada.massa ?? []).length} pontos de massa, ` +
        `${(colada.clara ?? []).length} de clara e ${(colada.linhas ?? []).length} arco(s) de ` +
        `traço; a fonte produz ${(importada.massa ?? []).length}, ` +
        `${(importada.clara ?? []).length} e ${(importada.linhas ?? []).length}. Recole.`,
    ];
  }
  const difs = a.map((v, i) => [i, v, b[i]] as const).filter(([, v, w]) => v !== w);
  if (!difs.length) return [];
  return [
    `${difs.length} número(s) divergem entre a fonte e o literal colado. O primeiro: ` +
      `posição ${difs[0][0]}, fonte ${difs[0][1]}, colado ${difs[0][2]}. Recole.`,
  ];
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const RAIZ = "scripts/avatar/fonte/estilo-kokeshi";

async function principal() {
  const args = process.argv.slice(2);
  const alvo = args.find((a) => !a.startsWith("--")) ?? "cabelo/curto-espetada";
  const pasta = `${RAIZ}/${alvo}`;
  const r = await importarPeca(`${pasta}/semantica.svg`);
  const registro = conferirRegistro(`${pasta}/semantica.svg`);
  const completude = await completudeRaster(registro.peca, `${pasta}/referencia.png`);
  const falhas = [...registro.falhas, ...r.falhas];

  for (const l of r.laudo) console.log(l);
  console.log(
    `  peça dentro do crânio: ${(100 * registro.dentro).toFixed(1)}%   (piso ${100 * PISO_NO_CRANIO}%)`,
  );

  const c = r.conferencia;
  const meia = c.espessura.mediana / 2;
  console.log(
    `\nespessura do traço DA ARTE: mediana ${c.espessura.mediana.toFixed(1)} u ` +
      `(o compositor desenha com TRACO = ${TRACO}, constante)`,
  );
  console.log(
    `conferência cruzada — borda do teal × linha de centro do preto: mediana ` +
      `${c.mediana.toFixed(1)} u (esperado ≈ ${meia.toFixed(1)})` +
      (c.semContorno ? ` · ${c.semContorno} ponto(s) sem preto na normal` : ""),
  );
  for (const f of r.furos) console.log(`  furo interno de ${f.toFixed(2)}% da massa — engolido pelo laço externo`);
  if (r.teto.k < 1) {
    console.log(`comprimido k=${r.teto.k.toFixed(4)}: pico da arte em y=${r.teto.antes.toFixed(1)}`);
  }
  if (r.sangria.quantos) {
    console.log(
      `sangria: ${r.sangria.quantos} ponto(s) empurrado(s) para fora da silhueta` +
        (r.sangria.travados ? ` · ${r.sangria.travados} travado(s) pelo alcance do laço` : ""),
    );
  }

  console.log(`\nN por curva (limiar meio traço = ${MEIO_TRACO}):`);
  for (const [nome, e, d] of [
    ["massa", r.n.massa, r.desvio.massa],
    ["clara", r.n.clara, r.desvio.clara],
  ] as const) {
    if (!e.n) continue;
    console.log(
      `  ${nome.padEnd(6)} N=${String(e.n).padStart(2)} · piso da arte ${e.piso.toFixed(1)} u · ` +
        `desvio da decimação ${d.toFixed(1)} u` +
        (d > MEIO_TRACO && d > e.piso * 1.1 ? "   ✗" : ""),
    );
    console.log(`    varredura: ${e.varredura.map((v) => `${v.n}:${v.max.toFixed(1)}`).join("  ")}`);
    console.log(
      `    sem auto-interseção: ${e.limpos.join(" ") || "nenhum"}` +
        (nome === "massa"
          ? `   ·   e que mantêm a coroa do denso: ${e.aprovados.join(" ") || "NENHUM"}`
          : ""),
    );
  }

  console.log(
    `\ncompletude raster (banda de borda ${BANDA} px · teto ${(100 * TETO_COMPLETUDE).toFixed(1)}%):` +
      `\n  cabelo do PNG fora da peça: ${(100 * completude.soNaArte).toFixed(2)}% — ` +
      `dele, BURACO (além da banda): ${(100 * completude.buraco).toFixed(2)}%` +
      `\n  peça fora do cabelo do PNG: ${(100 * completude.soNaPeca).toFixed(2)}% — ` +
      `dele, INVASÃO: ${(100 * completude.invasao).toFixed(2)}%   ← controle negativo (rosto e gola)`,
  );
  if (completude.buraco > TETO_COMPLETUDE) {
    falhas.push(
      `completude raster: ${(100 * completude.buraco).toFixed(2)}% da tinta de cabelo do PNG está ` +
        `a mais de ${BANDA} px da união dos papéis (teto ${(100 * TETO_COMPLETUDE).toFixed(1)}%). ` +
        `Isso não é borda: o conversor perdeu tinta antes de o SVG existir, ou a curadoria descartou peça.`,
    );
  }
  if (completude.invasao > TETO_COMPLETUDE) {
    falhas.push(
      `controle negativo: ${(100 * completude.invasao).toFixed(2)}% da união dos papéis cai a mais ` +
        `de ${BANDA} px de qualquer cabelo do PNG (teto ${(100 * TETO_COMPLETUDE).toFixed(1)}%). ` +
        `Rosto, gola ou fundo entraram na peça.`,
    );
  }

  const arcos = arcosDeTraco(r.peca);
  if (arcos) {
    const linhas = r.peca.linhas ?? [];
    console.log(
      `\ntraço da peça: ${linhas.length} arco(s) cobrindo ${(100 * arcos.fracao).toFixed(1)}% do laço` +
        `\n  a sonda pela normal não achou preto em ${r.conferencia.semContorno} dos ` +
        `${r.densoMassa.length} pontos densos — traçar o laço INTEIRO poria uma barra preta ` +
        `onde a arte não tem` +
        `\n  arcos (índice do laço): ${linhas.map(([a, b]) => `${a}→${b}`).join(" · ")}`,
    );
    falhas.push(...arcos.falhas);
  }

  const folga = folgaDoRosto(r.peca);
  // As duas coroas lado a lado, porque a diferença entre elas é a única parte que este
  // pipeline controla: a da peça é arte, a subtração é decimação.
  const coroaEntregue = coberturaDaCoroa(r.peca) ?? 0;
  const coroaDensa =
    coberturaDaCoroa({ id: "curto", nome: "denso", massa: r.densoMassa.map(paraTY) }) ?? 0;
  console.log(
    `\nfolga da peça sobre as sobrancelhas: esq ${folga.esq.toFixed(1)} · dir ${folga.dir.toFixed(1)} u` +
      `\ncontenção da clara: ${contencaoDaClara(r.peca).toFixed(2)} u (piso 0)` +
      `\ncobertura da coroa: ${(100 * coroaEntregue).toFixed(1)}% (exigido 100) — laço denso ` +
      `${(100 * coroaDensa).toFixed(1)}%, então a decimação custou ` +
      `${(100 * (coroaDensa - coroaEntregue)).toFixed(1)} ponto(s)` +
      `\nauto-interseções: massa ${r.cruzamentos.massa} · clara ${r.cruzamentos.clara} (exigido 0)`,
  );

  if (r.achados.length) {
    console.log(`\nPARA O OLHO DO DOUG — ${r.achados.length} achado(s) que o importador NÃO resolve:`);
    for (const a of r.achados) console.log(`  · ${a}`);
  }

  if (args.includes("--check")) {
    const mod = (await import(`../fonte/estilo-kokeshi/${alvo}/peca.ts`)) as { PECA: Colada };
    const difs = conferirLiteral(r.peca, mod.PECA);
    console.log(
      `\n--check — o literal de ${alvo}/peca.ts contra a fonte: ` +
        (difs.length ? `✗ divergiu` : `✓ idêntico`),
    );
    falhas.push(...difs);
  } else {
    console.log(`\n${"-".repeat(70)}\n${literalDaPeca(r.peca)}`);
  }

  if (falhas.length) {
    console.log(`\n✗ ${falhas.length} reprovação(ões):`);
    for (const f of falhas) console.log(`  · ${f}`);
    process.exit(1);
  }
  console.log(`\n✓ a peça foi importada da fonte declarada, e todos os gates passaram`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("importar-peca.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
