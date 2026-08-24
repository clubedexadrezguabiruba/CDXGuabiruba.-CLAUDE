/**
 * O POUSO — a bancada dos mapeamentos, com o mesmo insumo e a mesma saída.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO EXISTE PARA DECIDIR
 * ---------------------------------------------------------------------------
 *
 * O bloco 0 mediu que o traçador **não** é o gargalo: `potrace` descreve a máscara
 * congelada com 0,2 unidade de desvio médio de borda, um trigésimo do piso de meio
 * traço. Se a peça reprovada erra 54 pontos de cobertura de coroa e desce 20 a 42
 * unidades sobre a sobrancelha, o erro está **entre a arte e o crânio**, e não entre
 * o PNG e a curva.
 *
 * `importar-peca.ts:313` já dizia onde: *"O mapa afim continua mandando em `y` — ali
 * não há analogia por coluna."* O eixo x ganhou "fração da feature" e a cobertura
 * saltou de 8,3% para 45,9%. O eixo y nunca ganhou.
 *
 * ---------------------------------------------------------------------------
 * OS QUATRO CANDIDATOS, E POR QUE OS QUATRO
 * ---------------------------------------------------------------------------
 *
 * | | x | y | o que ele isola |
 * |---|---|---|---|
 * | **M0** | caixa | caixa | o controle: o mapa afim puro, antes de tudo |
 * | **M1** | fração da linha | caixa | o que está em produção HOJE |
 * | **M2** | caixa | marcos | o y sozinho, para saber quanto dele é y |
 * | **M1M2** | fração da linha | marcos | os dois, e é o candidato |
 *
 * Sem M0 e M2 o resultado seria "melhorou", que não é um número: não se saberia
 * quanto do ganho é do eixo novo e quanto é do que já existia.
 *
 * ---------------------------------------------------------------------------
 * ISTO NÃO É "SUBIR A PEÇA", E A DIFERENÇA É A QUE JÁ CUSTOU UMA FOLHA
 * ---------------------------------------------------------------------------
 *
 * O erro 1 da lista do Doug é *"não subir a peça para consertar folga"* — foi o que
 * produziu a faixa de testa nua da folha HSHC93. Uma **translação** move a peça
 * inteira e abre couro cabeludo no alto exatamente na medida em que fecha a folga
 * embaixo: um defeito trocado por outro.
 *
 * O mapa por marcos não translada nada. O topo da cabeça da arte continua pousando no
 * topo do crânio — ele é um dos dois marcos, e fica **fixo**. O que muda é a
 * **escala** entre os dois marcos, que é o análogo exato do que a fração da linha fez
 * em x. Se o resultado abrir testa nua no alto, `coberturaDaCoroa` cai, e o número
 * reprova o candidato — que é o motivo de os dois gates saírem lado a lado.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A BANCADA REPETE O FIM DE `importarPeca` EM VEZ DE CHAMÁ-LO
 * ---------------------------------------------------------------------------
 *
 * `importar-peca.ts` está na lista de **não tocar** desta rodada (plano §1.2 e §8):
 * o pipeline de hoje fica verde e intocado, e as rotas candidatas nascem ao lado.
 * Então a bancada consome as funções **exportadas** dele e de `tracar-cabelo.ts` —
 * `mascarasDaPeca`, `segmentacaoDaPeca`, `bordasDaArte`, `medirMassa`, `medirClara`,
 * `comprimirNoTeto`, `sangrarNaSilhueta`, `conterAClara`, `escolherN`,
 * `decimarPorCorda` — e reescreve **uma** função privada, `decidirN`, marcada como
 * cópia. No dia em que um candidato for aprovado, a cópia volta para lá e some.
 */

import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  CABELOS,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  type Cabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import { CABECA, CAIXA_CABECA, bordasEm } from "../../../src/lib/avatar/estilo/geometria";
import { decimarPorCorda, desvioDaCorda } from "./medir";
import { binarizar } from "./fonte-svg";
import { guiaChamada, lerFontePecaOuFalhar, svgDaCamada } from "./fonte-peca";
import { rasterizarSvg } from "./raster";
import {
  type BordasDaArte,
  type Marcos,
  bordasDaArte,
  decidirN,
  marcosDaPeca,
  mascarasDaPeca,
  pousarPorMarcos,
  registroDaPeca,
  segmentacaoDaPeca,
} from "./importar-peca";
import {
  ALTURA_SVG,
  type Mapa,
  aplicarK,
  autoIntersecoes,
  comprimirNoTeto,
  conterAClara,
  medirClara,
  medirMassa,
  paraTY,
  paraXY,
  sangrarNaSilhueta,
} from "./tracar-cabelo";
import { CONTROLE_PARAMETRICO } from "./controle-parametrico";

/* ------------------------------------------------------------------ */
/* Os marcos                                                           */
/* ------------------------------------------------------------------ */

/**
 * OS MARCOS MORAM EM `importar-peca.ts` AGORA — junto com o candidato que os usa.
 *
 * O M4 venceu a bancada e foi promovido a produção no bloco 2. `Marcos`,
 * `marcosDaPeca` e `pousarPorMarcos` foram com ele; aqui eles são re-exportados para
 * a bancada e para o `coroa-teto.test.ts` continuarem falando com um endereço só.
 */
export type { Marcos } from "./importar-peca";
export { marcosDaPeca } from "./importar-peca";

/* ------------------------------------------------------------------ */
/* Os mapeamentos                                                      */
/* ------------------------------------------------------------------ */

export interface ContextoDeMapa {
  /** O mapa afim px do raster da arte → unidade do produto. */
  mapa: Mapa;
  bordas: BordasDaArte;
  marcos: Marcos;
  /** Altura do raster de que `bordas` saiu, para converter marco em linha. */
  altura: number;
  viewBoxDaArte: { w: number; h: number };
}

export interface Mapeamento {
  nome: string;
  descricao: string;
  /**
   * Pontos que já saíram do mapa afim, em unidade do produto, corrigidos.
   *
   * A entrada e a saída são o mesmo espaço de propósito: o resto do caminho
   * (compressão do teto, sangria, decimação) trabalha nele, e trocar de espaço no
   * meio é o erro de método que já custou uma medição inteira.
   */
  aplicar(
    pts: { x: number; y: number }[],
    ctx: ContextoDeMapa,
  ): { pts: { x: number; y: number }[]; corrigidos: number };
}

/** Unidade do produto → linha do raster da arte. A inversa de `paraY`. */
const linhaDaArte = (uy: number, m: Mapa) => Math.round((uy - m.tu0) / m.ky + m.ty0);

/** Linha do raster da arte → unidade do `viewBox` da arte. Exata: as duas alturas são conhecidas. */
const unidadeDaArte = (py: number, ctx: ContextoDeMapa) => (py * ctx.viewBoxDaArte.h) / ctx.altura;

/**
 * O MAPA POR TRECHOS, EM `y` — dois marcos, e interpolação proporcional entre eles.
 *
 * Acima da linha dos olhos vale a razão `(olhos−topo)` de um para o outro; abaixo,
 * a razão `(base−olhos)`. Fora do intervalo dos marcos a última razão continua
 * valendo — extrapolação linear, e não corte: uma mecha que desça abaixo da base da
 * cabeça da arte é peça, não erro.
 */
function yPorMarcos(uy: number, ctx: ContextoDeMapa): number {
  const { arte, produto } = ctx.marcos;
  const ya = unidadeDaArte(linhaDaArte(uy, ctx.mapa), ctx);
  if (ya <= arte.olhos) {
    const k = (produto.olhos - produto.topo) / (arte.olhos - arte.topo);
    return produto.topo + (ya - arte.topo) * k;
  }
  const k = (produto.base - produto.olhos) / (arte.base - arte.olhos);
  return produto.olhos + (ya - arte.olhos) * k;
}

/**
 * A FRAÇÃO DA LINHA, em `x` — a conta de `reancorarNaCabeca`, com uma diferença.
 *
 * A original pergunta a fração na linha da arte e a aplica em `bordasEm(p.y)`, com
 * o `y` **antigo**. Quando o `y` também muda, a borda do crânio tem de ser lida na
 * linha para onde o ponto vai, e não naquela de onde ele veio: são larguras
 * diferentes, e usar a errada reabre em x o erro que se está fechando em y.
 */
function xPorFracao(
  p: { x: number; y: number },
  yDestino: number,
  ctx: ContextoDeMapa,
  /**
   * O QUE FAZER NA LINHA ESTREITA DEMAIS — e é aqui que a coroa se decide.
   *
   * `bordasDaArte` marca `NaN` onde a cabeça da arte tem menos de `PISO_LARGURA`
   * pixels, e o motivo escrito em `importar-peca.ts:335` é bom: *"uma fração medida
   * sobre 12 unidades multiplica todo erro de meio pixel por trinta"*.
   *
   * O que ele não diz é **para onde o ponto vai** quando a fração não pode ser
   * medida. Hoje vai para o mapa afim — e isso acontece exatamente no ápice da
   * cúpula, que é onde as duas cabeças mais discordam: a do gerador é redonda e
   * afina depressa, a do kokeshi é quase **chata** no topo (45,5 em x 255 · 46,1 em
   * 295 · 48,9 em 335). O afim devolve a curvatura da arte ali, e o que sobra é
   * couro cabeludo em volta do bico central.
   *
   * `vizinha` é a alternativa: em vez do afim, usar a fração da linha VÁLIDA mais
   * próxima. Não inventa medição — repete a última que existiu, que é o que uma
   * cúpula faz de qualquer jeito perto do ápice. Se ela não mover a coroa, o
   * `PISO_LARGURA` está inocente e o problema é outro.
   */
  naEstreita: "afim" | "vizinha" = "afim",
): { x: number; corrigido: boolean } {
  const py0 = linhaDaArte(p.y, ctx.mapa);
  let py = py0;
  if (py >= 0 && py < ctx.bordas.h && Number.isNaN(ctx.bordas.esq[py]) && naEstreita === "vizinha") {
    for (let d = 1; d < ctx.bordas.h; d++) {
      if (py0 + d < ctx.bordas.h && !Number.isNaN(ctx.bordas.esq[py0 + d])) {
        py = py0 + d;
        break;
      }
      if (py0 - d >= 0 && !Number.isNaN(ctx.bordas.esq[py0 - d])) {
        py = py0 - d;
        break;
      }
    }
  }
  if (py < 0 || py >= ctx.bordas.h || Number.isNaN(ctx.bordas.esq[py])) {
    return { x: p.x, corrigido: false };
  }
  const px = (p.x - ctx.mapa.eu0) / ctx.mapa.kx + ctx.mapa.ex0;
  const t = (px - ctx.bordas.esq[py]) / (ctx.bordas.dir[py] - ctx.bordas.esq[py]);
  const { esq, dir } = bordasEm(yDestino);
  return { x: esq + t * (dir - esq), corrigido: true };
}

export const M0: Mapeamento = {
  nome: "M0",
  descricao: "o mapa afim puro — x pela caixa, y pela caixa (o controle)",
  aplicar: (pts) => ({ pts: pts.map((p) => ({ ...p })), corrigidos: 0 }),
};

export const M1: Mapeamento = {
  nome: "M1",
  descricao: "x pela fração da linha, y pela caixa (o que está em produção hoje)",
  aplicar(pts, ctx) {
    let corrigidos = 0;
    const saida = pts.map((p) => {
      const { x, corrigido } = xPorFracao(p, p.y, ctx);
      if (corrigido) corrigidos++;
      return { x, y: p.y };
    });
    return { pts: saida, corrigidos };
  },
};

export const M2: Mapeamento = {
  nome: "M2",
  descricao: "x pela caixa, y por marcos (topo e linha dos olhos)",
  aplicar(pts, ctx) {
    let corrigidos = 0;
    const saida = pts.map((p) => {
      const y = yPorMarcos(p.y, ctx);
      if (y !== p.y) corrigidos++;
      return { x: p.x, y };
    });
    return { pts: saida, corrigidos };
  },
};

export const M1M2: Mapeamento = {
  nome: "M1M2",
  descricao: "x pela fração da linha do DESTINO, y por marcos — o candidato",
  aplicar(pts, ctx) {
    let corrigidos = 0;
    const saida = pts.map((p) => {
      const y = yPorMarcos(p.y, ctx);
      const { x, corrigido } = xPorFracao(p, y, ctx);
      if (corrigido) corrigidos++;
      return { x, y };
    });
    return { pts: saida, corrigidos };
  },
};

/**
 * M3 — o M1M2 com a linha estreita resolvida pela VIZINHA em vez do afim.
 *
 * Ataca a reclamação 1 no único lugar que sobrou depois de o bloco 0 e o bloco 1
 * eliminarem o traçador (0,2 u de desvio), o eixo y (M1 e M1M2 empatam na coroa), o
 * recuo (0,511 sem ele) e a compressão do teto (idêntica sem ela).
 */
export const M3: Mapeamento = {
  nome: "M3",
  descricao: "M1M2, e no ápice a fração vem da linha válida vizinha, não do afim",
  aplicar(pts, ctx) {
    let corrigidos = 0;
    const saida = pts.map((p) => {
      const y = yPorMarcos(p.y, ctx);
      const { x, corrigido } = xPorFracao(p, y, ctx, "vizinha");
      if (corrigido) corrigidos++;
      return { x, y };
    });
    return { pts: saida, corrigidos };
  },
};

/**
 * M4 — ancorado nos DOIS marcos que o cabelo não contamina: olhos e queixo.
 *
 * **É o vencedor da bancada, e por isso ele não mora mais aqui.** A implementação foi
 * para `importar-peca.ts:pousarPorMarcos`, que é o que a produção chama; esta entrada
 * só a envolve para o M4 continuar na tabela, ao lado dos candidatos que perdeu.
 *
 * Se ele fosse reescrito aqui, a bancada mediria uma cópia e a peça sairia da outra —
 * que é exatamente a divergência que a bancada existe para não deixar acontecer.
 *
 * O racional (por que o topo da guia `cabeca` é o cabelo, e não a cabeça) está escrito
 * junto com a implementação, em `Marcos`.
 */
export const M4: Mapeamento = {
  nome: "M4",
  descricao: "y ancorado em olhos+queixo (marcos sem cabelo), o topo sai da conta",
  aplicar: (pts, ctx) => pousarPorMarcos(pts, ctx.mapa, ctx.bordas, ctx.marcos, ctx.altura),
};

export const MAPEAMENTOS: Record<string, Mapeamento> = { M0, M1, M2, M1M2, M3, M4 };

/* ------------------------------------------------------------------ */
/* A bancada                                                           */
/* ------------------------------------------------------------------ */

/*
 * A CÓPIA DE `decidirN` SUMIU, e era isso que o topo deste arquivo prometia.
 *
 * *"No dia em que um candidato for aprovado, a cópia volta para lá e some."* O M4 foi
 * aprovado, `importar-peca.ts` saiu da lista de não tocar, e `decidirN` é importada de
 * lá. A bancada e a produção passam a decidir N pela mesma função — inclusive a
 * exigência nova de julgar o laço DEPOIS da contenção.
 */

export interface Resultado {
  nome: string;
  descricao: string;
  peca: Cabelo;
  coroa: number;
  folga: { esq: number; dir: number };
  contencao: number;
  cruzamentos: { massa: number; clara: number };
  n: { massa: number; clara: number };
  desvio: { massa: number; clara: number };
  corrigidos: number;
  formas: number;
  bytes: number;
  /**
   * O MESMO MAPA COM A DECIMAÇÃO DESLIGADA — o teto do mapeamento.
   *
   * Sem ele, "a coroa caiu de 0,459 para 0,332" não diz se o mapa piorou ou se a
   * decimação comeu mais. No laço denso não há redução para culpar: o que sobrar
   * aqui é do mapa, e o que sumir entre as duas colunas é da decimação. É a mesma
   * separação que o `--onde` de `fidelidade.ts` faz na borda de baixo.
   */
  denso: { coroa: number; folga: { esq: number; dir: number }; pontos: number; peca: Cabelo };
}

export async function bancada(caminhoSemantica: string): Promise<{
  marcos: Marcos;
  resultados: Resultado[];
  /** A arte crua, para a pergunta que precede o mapa. Ver `encostaNaCabeca`. */
  arte: {
    uniao: Uint8Array;
    cabeca: Uint8Array;
    w: number;
    h: number;
    bordas: BordasDaArte;
    mapa: Mapa;
  };
}> {
  const fonte = lerFontePecaOuFalhar(caminhoSemantica);
  const mapa = registroDaPeca(fonte, true);
  const mascaras = await mascarasDaPeca(fonte);
  const seg = segmentacaoDaPeca(mascaras, []);
  const bordas = await bordasDaArte(fonte);
  const marcos = marcosDaPeca(fonte);

  // As duas passadas de `importarPeca`: a primeira mede o traço da arte, a segunda
  // é a peça. Idênticas às de lá, e é de propósito — o que a bancada varia é o mapa.
  const sonda = medirMassa(seg, mapa, mascaras.h);
  const recuoPx = sonda.conferencia.espessura.mediana / 2 / mapa.kx;
  const massa = medirMassa(seg, mapa, mascaras.h, recuoPx);
  const clara = medirClara(seg, mapa, mascaras.h);

  const ctx: ContextoDeMapa = {
    mapa,
    bordas,
    marcos,
    altura: ALTURA_SVG,
    viewBoxDaArte: fonte.viewBox,
  };

  /**
   * AS DUAS ETAPAS QUE MEXEM NA COROA E NÃO SÃO MAPA — isoladas para não virarem
   * "o mapa piorou".
   *
   * **O recuo** é meio traço para dentro: `medirMassa` procura a corrida de preto
   * pela normal e devolve a LINHA DE CENTRO dela, porque é isso que `cabelo.ts`
   * guarda. Custa meia espessura de silhueta, sistematicamente, em todo o perímetro.
   *
   * **A compressão do teto** encolhe a peça verticalmente quando o pico dela passa
   * do topo do crânio. Ela protege o clip, e o preço dela é justamente altura na
   * coroa — que é o gate que se está medindo.
   *
   * Nenhuma das duas é candidata a sumir: as duas existem por motivo escrito. Elas
   * entram na tabela para o número dizer **quanto** custam, e para a decisão do
   * bloco 2 não gastar esforço no lugar errado.
   */
  const variantes: { sufixo: string; recuo: boolean; teto: boolean }[] = [
    { sufixo: "", recuo: true, teto: true },
    { sufixo: "/sem-recuo", recuo: false, teto: true },
    { sufixo: "/sem-teto", recuo: true, teto: false },
  ];

  const massaSemRecuo = medirMassa(seg, mapa, mascaras.h);

  const resultados: Resultado[] = [];
  for (const { m, v } of Object.values(MAPEAMENTOS).flatMap((m) =>
    variantes
      .filter((v) => v.sufixo === "" || m.nome === "M1M2")
      .map((v) => ({ m, v })),
  )) {
    const denso = v.recuo ? massa.denso : massaSemRecuo.denso;
    const rMassa = m.aplicar(denso, ctx);
    const rClara = m.aplicar(clara.denso, ctx);

    const k = v.teto
      ? comprimirNoTeto(rMassa.pts.length ? Math.min(...rMassa.pts.map((p) => p.y)) : CAIXA_CABECA.y0)
      : 1;
    const mover = aplicarK(k);
    const sangria = sangrarNaSilhueta(rMassa.pts.map(mover));
    const massaC = sangria.pts;
    const claraC = rClara.pts.map(mover);

    // A MESMA ordem de `importarPeca`, e ela não é simétrica de propósito: o N da
    // clara é julgado contra a massa já decimada, porque é dela que a contenção corre
    // atrás. Ver `decidirN`.
    const nMassa = decidirN(massaC, true);
    const massaFina = massaC.length ? decimarPorCorda(massaC, nMassa.n, { fechado: true }) : [];
    const nClara = claraC.length
      ? decidirN(claraC, true, (laco) => conterAClara(laco.map((q) => ({ ...q })), massaFina).pts)
      : { n: 0, piso: 0, varredura: [], limpos: [] };
    const claraFina = claraC.length ? decimarPorCorda(claraC, nClara.n, { fechado: true }) : [];
    const contida = conterAClara(claraFina, massaFina);

    const peca: Cabelo = {
      id: "chanel",
      nome: m.nome + v.sufixo,
      massa: massaFina.map(paraTY),
      ...(contida.pts.length ? { clara: contida.pts.map(paraTY) } : {}),
    };

    const pecaDensa: Cabelo = { id: "chanel", nome: `${m.nome}${v.sufixo}-denso`, massa: massaC.map(paraTY) };

    const svg = compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: peca, ns: "mp" });
    const desvioDe = (denso: { x: number; y: number }[], red: { x: number; y: number }[]) =>
      red.length ? desvioDaCorda(denso, [...red, red[0]]).max : 0;

    resultados.push({
      nome: m.nome + v.sufixo,
      descricao: m.descricao + (v.sufixo ? ` (${v.sufixo.slice(1)})` : ""),
      peca,
      coroa: coberturaDaCoroa(peca) ?? 0,
      folga: folgaDoRosto(peca),
      contencao: contencaoDaClara(peca),
      cruzamentos: {
        massa: autoIntersecoes((peca.massa ?? []).map(paraXY)).length,
        clara: autoIntersecoes((peca.clara ?? []).map(paraXY)).length,
      },
      n: { massa: nMassa.n, clara: nClara.n },
      desvio: { massa: desvioDe(massaC, massaFina), clara: desvioDe(claraC, contida.pts) },
      corrigidos: rMassa.corrigidos,
      formas: (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length,
      bytes: Buffer.byteLength(svg, "utf-8"),
      denso: {
        coroa: coberturaDaCoroa(pecaDensa) ?? 0,
        folga: folgaDoRosto(pecaDensa),
        pontos: massaC.length,
        peca: pecaDensa,
      },
    });
  }

  return {
    marcos,
    resultados,
    arte: {
      uniao: mascaras.uniao,
      cabeca: binarizar(
        await rasterizarSvg(svgDaCamada(fonte.arquivo, guiaChamada(fonte, "cabeca").subpaths), ALTURA_SVG),
      ).mask,
      w: mascaras.w,
      h: mascaras.h,
      bordas,
      mapa,
    },
  };
}

/* ------------------------------------------------------------------ */
/* O controle: uma peça APROVADA, na mesma régua                       */
/* ------------------------------------------------------------------ */

/**
 * SEM CONTROLE, "MELHOROU" NÃO TEM ESCALA.
 *
 * `CONTROLE_PARAMETRICO` é peça aprovada, desenhada à mão, e passa pelos mesmos três gates.
 * Sem ela na tabela não se sabe que nota uma peça BOA tira nestes números — e um
 * candidato que chegue a 0,80 de coroa pode ser ótimo ou péssimo dependendo do que
 * uma peça aprovada tira.
 */
function controle(): Resultado[] {
  // O `coque` era o primeiro desta lista e saiu do CATÁLOGO em 2026-08-24, quando o
  // Doug o apagou. Ele continua sendo controle, porque a geometria dele nunca foi o
  // problema — o que ele reprovou foi a arte tonal que tentou substituí-la. Só que
  // agora entra pelo objeto, de `CONTROLE_PARAMETRICO`, que mora em `scripts/` e não
  // é peça vestível. Perder o controle paramétrico deixaria a tabela com um único
  // ponto de referência, e aí "melhorou" volta a não ter escala.
  const alvos: { rotulo: string; peca: Cabelo }[] = [
    { rotulo: "controle-parametrico", peca: CONTROLE_PARAMETRICO },
    { rotulo: "moicano", peca: CABELOS.moicano },
  ];
  return alvos.map(({ rotulo: id, peca }) => {
    const svg = compor({ pele: PELE[1], cabelo: CABELO[0], modeloCabelo: peca, ns: "ct" });
    return {
      nome: `[${id}]`,
      descricao: "peça APROVADA do catálogo, na mesma régua",
      peca,
      coroa: coberturaDaCoroa(peca) ?? 0,
      folga: folgaDoRosto(peca),
      contencao: contencaoDaClara(peca),
      cruzamentos: {
        massa: autoIntersecoes((peca.massa ?? []).map(paraXY)).length,
        clara: autoIntersecoes((peca.clara ?? []).map(paraXY)).length,
      },
      n: { massa: peca.massa?.length ?? 0, clara: peca.clara?.length ?? 0 },
      desvio: { massa: 0, clara: 0 },
      corrigidos: 0,
      formas: (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length,
      bytes: Buffer.byteLength(svg, "utf-8"),
      // A peça aprovada não tem laço denso: ela nasceu com estes pontos.
      denso: {
        coroa: coberturaDaCoroa(peca) ?? 0,
        folga: folgaDoRosto(peca),
        pontos: peca.massa?.length ?? 0,
        peca,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/* Onde a coroa falha — porque a média não diz o que consertar         */
/* ------------------------------------------------------------------ */

/**
 * A COROA, PONTO A PONTO DO CONTORNO — e não uma fração só.
 *
 * `coberturaDaCoroa` devolve *"0,52"*, e 0,52 não diz se falta cabelo **no ápice**
 * (que seria altura), **nas têmporas** (que seria largura) ou **na faixa de baixo da
 * coroa** (que seria o corte do mapa). São três consertos diferentes, e dois deles
 * nem são de código.
 *
 * A régua é a mesma de `cabelo.ts`: amostra o contorno do crânio a cada ~2 unidades,
 * fica com os pontos acima de `y0 + 0,25 · altura`, e pergunta se cada um está dentro
 * do polígono da massa. A repetição existe porque as duas funções de lá são privadas
 * e o arquivo está na lista de não tocar — ver o topo.
 */
function dentroDoPoligono(poli: readonly { x: number; y: number }[], p: { x: number; y: number }) {
  let dentro = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i];
    const b = poli[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/**
 * CÓPIA de `poligonoDaTouca` (`cabelo.ts:793`), e as duas pernas dela importam.
 *
 * Peça de **massa** é um laço fechado e o polígono é ele. Peça de **pontos** é uma
 * curva ABERTA que atravessa a cabeça, e o polígono se fecha por dois cantos muito
 * acima do crânio — é assim que os cinco cabelos paramétricos do catálogo medem
 * `coberturaDaCoroa` 1,000. Sem a segunda perna, o controle aprovado sai 0,000 e a
 * tabela mentiria justamente na linha que existe para dar escala.
 */
const FORA_DO_CRANIO = 60;

function poligonoDaMassa(c: Cabelo): { x: number; y: number }[] | null {
  if (c.massa) return c.massa.map(paraXY);
  if (!c.pontos) return null;
  return [
    ...c.pontos.map(paraXY),
    { x: CAIXA_CABECA.x1 + FORA_DO_CRANIO, y: CAIXA_CABECA.y0 - FORA_DO_CRANIO },
    { x: CAIXA_CABECA.x0 - FORA_DO_CRANIO, y: CAIXA_CABECA.y0 - FORA_DO_CRANIO },
  ];
}

/**
 * O TETO DA COROA PARA PEÇA DE LAÇO FECHADO — calibrado em fixture, nunca na arte.
 *
 * `coberturaDaCoroa` é exigida em 1,000, e esse número nunca foi medido: é o que os
 * cinco cabelos paramétricos devolvem **por construção**, porque `poligonoDaTouca`
 * fecha uma peça de `pontos` com dois cantos 60 unidades acima do crânio. Peça de
 * `massa` — que é o que a importação de arte produz — não tem essa folga.
 *
 * A calibração inteira, com a tabela das duas famílias de defeito, mora em
 * `__tests__/coroa-teto.test.ts`. O resumo:
 *
 *  - **entalhe** (bico, e é a arte funcionando): cobertura ≥ 0,825 · arco ≤ 0,074;
 *  - **aro** (a touca pequena, e é o defeito): cobertura ≤ 0,598 · arco ≥ 0,402.
 *
 * Os dois tetos ficam no meio dos dois vãos, com fator 2 de folga para cada lado — e
 * o teste quebra no dia em que uma fixture nova aproximar as famílias.
 *
 * **Eles ainda não reprovam nada em produção.** Esta rodada não toca
 * `importar-peca.ts` nem `cabelo.ts` (plano §1.2): o teto entra na bancada, e migra
 * para o gate quando o Doug aprovar a peça na folha.
 */
export const FRACAO_DE_ARCO = 0.2;
export const PISO_DE_COBERTURA = 0.7;

export function ondeACoroaFalha(peca: Cabelo) {
  const poli = poligonoDaMassa(peca) ?? [];
  const limite = CAIXA_CABECA.y0 + 0.25 * CAIXA_CABECA.alt;
  const contorno = CABECA.contorno;
  const meio = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;

  /** Distância de um ponto até a poligonal fechada. Zero se ele estiver em cima dela. */
  const ateAPoligonal = (p: { x: number; y: number }) => {
    let melhor = Infinity;
    for (let i = 0; i < poli.length; i++) {
      const a = poli[i];
      const b = poli[(i + 1) % poli.length];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const L = vx * vx + vy * vy;
      const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / L)) : 0;
      melhor = Math.min(melhor, Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy)));
    }
    return Number.isFinite(melhor) ? melhor : 0;
  };

  const amostras: { x: number; y: number; dentro: boolean; dist: number }[] = [];
  for (let i = 0; i < contorno.length; i++) {
    const a = contorno[i];
    const b = contorno[(i + 1) % contorno.length];
    const passos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
    for (let k = 0; k < passos; k++) {
      const p = {
        x: a.x + ((b.x - a.x) * k) / passos,
        y: a.y + ((b.y - a.y) * k) / passos,
      };
      if (p.y > limite) continue;
      const dentro = poli.length ? dentroDoPoligono(poli, p) : false;
      amostras.push({ ...p, dentro, dist: dentro ? 0 : ateAPoligonal(p) });
    }
  }

  // Três faixas de altura, que são os três consertos possíveis. O ápice é o terço de
  // cima da faixa da coroa; a base dela é o terço de baixo.
  const y0 = Math.min(...amostras.map((a) => a.y));
  const faixa = (limite - y0) / 3;
  const bandas = [
    { nome: `ápice (y ${y0.toFixed(0)}–${(y0 + faixa).toFixed(0)})`, de: y0, ate: y0 + faixa },
    { nome: `meio  (y ${(y0 + faixa).toFixed(0)}–${(y0 + 2 * faixa).toFixed(0)})`, de: y0 + faixa, ate: y0 + 2 * faixa },
    { nome: `base  (y ${(y0 + 2 * faixa).toFixed(0)}–${limite.toFixed(0)})`, de: y0 + 2 * faixa, ate: limite + 1 },
  ];

  const linhas = bandas.flatMap((b) =>
    (["esq", "dir"] as const).map((lado) => {
      const sel = amostras.filter(
        (a) => a.y >= b.de && a.y < b.ate && (lado === "esq" ? a.x < meio : a.x >= meio),
      );
      const dentro = sel.filter((a) => a.dentro).length;
      const fora = sel.filter((a) => !a.dentro);
      return {
        banda: b.nome,
        lado,
        total: sel.length,
        dentro,
        pct: sel.length ? dentro / sel.length : 1,
        /** Quão FORA está o que está fora: a distância até a borda da massa. */
        foraMedio: fora.length ? fora.reduce((s, a) => s + a.dist, 0) / fora.length : 0,
        foraMax: fora.length ? Math.max(...fora.map((a) => a.dist)) : 0,
      };
    }),
  );
  /**
   * OS ARCOS QUE FALHAM — e é isto que separa entalhe de aro.
   *
   * `coberturaDaCoroa` devolve a mesma fração para dois defeitos que não têm nada a
   * ver um com o outro: **um entalhe** entre dois bicos (uma corrida curta e funda,
   * que é como cabelo espetado lê) e **um aro** de couro cabeludo em volta da coroa
   * inteira (muitas corridas, ou uma comprida, e é o defeito de verdade).
   *
   * O comprimento sai em unidades de arco do próprio contorno — as amostras estão a
   * ~2 unidades uma da outra por construção, então contar amostra é medir arco.
   */
  const arcos: { de: number; ate: number; comprimento: number; profundidade: number }[] = [];
  for (let i = 0; i < amostras.length; i++) {
    if (amostras[i].dentro) continue;
    if (i > 0 && !amostras[i - 1].dentro) continue;
    let j = i;
    while (j < amostras.length && !amostras[j].dentro) j++;
    const trecho = amostras.slice(i, j);
    arcos.push({
      de: trecho[0].x,
      ate: trecho[trecho.length - 1].x,
      comprimento: 2 * trecho.length,
      profundidade: Math.max(...trecho.map((a) => a.dist)),
    });
  }
  arcos.sort((a, b) => b.comprimento - a.comprimento);

  const fora = amostras.filter((a) => !a.dentro);
  return {
    total: amostras.length,
    dentro: amostras.filter((a) => a.dentro).length,
    linhas,
    arcos,
    /** O arco de falha mais comprido, em unidades. É o número que separa entalhe de aro. */
    piorArco: arcos[0]?.comprimento ?? 0,
    perimetro: 2 * amostras.length,
    /**
     * A DISTRIBUIÇÃO DA DISTÂNCIA — e ela é a pergunta que separa dois defeitos.
     *
     * Um ponto do contorno do crânio que caia 0,3 unidade fora do laço não é couro
     * cabeludo à mostra: é a borda do cabelo **coincidindo** com a borda do crânio,
     * e o teste de dentro/fora decidindo no fio da navalha. Um que caia 30 unidades
     * fora é careca de verdade. `coberturaDaCoroa` devolve o mesmo `false` para os
     * dois, e a diferença entre eles é a diferença entre "a arte não serve" e "a
     * régua está no limite".
     */
    escada: [0.5, 2, 6, 12, 24, Infinity].map((ate, i, todos) => ({
      de: i ? todos[i - 1] : 0,
      ate,
      quantos: fora.filter((a) => a.dist > (i ? todos[i - 1] : 0) && a.dist <= ate).length,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* A pergunta anterior a todo mapa: a ARTE cobre a coroa DELA?          */
/* ------------------------------------------------------------------ */

/**
 * O CABELO ENCOSTA NA BORDA DA CABEÇA DA ARTE? — e é a pergunta que precede o mapa.
 *
 * Todo mapeamento por fração da linha carrega o cabelo até a borda do crânio **se e
 * somente se** ele encostar na borda da cabeça da arte. Se na arte já sobra couro
 * cabeludo, nenhum mapa o preenche: `t` de 0,93 vira 0,93 do outro lado, e a folga
 * de 7% viaja junto, agora medida contra um crânio mais largo.
 *
 * O plano afirma que *"o cabelo encosta na borda da cabeça em todas as linhas
 * (medido)"*. Esta função põe número nisso, linha a linha, no raster da própria arte
 * — sem mapa nenhum no meio, que é o que a torna capaz de desmentir o mapa.
 */
/**
 * `coberturaDaCoroa` APLICADA À ARTE, CONTRA A CABEÇA DA ARTE — o teto de verdade.
 *
 * `encostaNaCabeca` mede o extremo esquerdo e o direito de cada linha, e por isso é
 * cega ao defeito que interessa: um **entalhe no meio da coroa**. Num cabelo
 * espetado o entalhe entre dois bicos é justamente onde a cabeça aparece — e a linha
 * continua encostando nas duas pontas.
 *
 * Esta é a mesma pergunta de `coberturaDaCoroa`, feita antes de qualquer mapa: dos
 * pixels de **borda** da cabeça da arte, na faixa da coroa, quantos estão dentro da
 * tinta declarada da peça? Se a resposta for 0,5 na própria arte, nenhum traçador e
 * nenhum mapa levam o número a 1,0 — o que sobra é direção de arte.
 */
export function coroaNaArte(
  cabeca: Uint8Array,
  uniao: Uint8Array,
  w: number,
  h: number,
  fracaoDaCoroa = 0.25,
) {
  let y0 = h;
  let y1 = -1;
  for (let i = 0; i < cabeca.length; i++) {
    if (!cabeca[i]) continue;
    const y = (i / w) | 0;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const limite = y0 + fracaoDaCoroa * (y1 - y0);

  let total = 0;
  let dentro = 0;
  const porColuna: { x: number; total: number; dentro: number }[] = [];
  for (let x = 0; x < w; x++) porColuna.push({ x, total: 0, dentro: 0 });
  for (let y = y0; y <= limite; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!cabeca[i]) continue;
      const borda =
        (x > 0 && !cabeca[i - 1]) ||
        (x < w - 1 && !cabeca[i + 1]) ||
        (y > 0 && !cabeca[i - w]) ||
        (y < h - 1 && !cabeca[i + w]);
      if (!borda) continue;
      total++;
      porColuna[x].total++;
      if (uniao[i]) {
        dentro++;
        porColuna[x].dentro++;
      }
    }
  }
  return { total, dentro, cobertura: total ? dentro / total : 0, y0, limite, porColuna };
}

export function encostaNaCabeca(
  uniao: Uint8Array,
  w: number,
  bordas: BordasDaArte,
  deY: number,
  ateY: number,
  passo: number,
) {
  const linhas: { y: number; folgaEsq: number; folgaDir: number; largura: number }[] = [];
  for (let y = Math.round(deY); y <= ateY; y += passo) {
    if (y < 0 || y >= bordas.h || Number.isNaN(bordas.esq[y])) continue;
    let a = -1;
    let z = -1;
    for (let x = 0; x < w; x++) {
      if (!uniao[y * w + x]) continue;
      if (a < 0) a = x;
      z = x;
    }
    if (a < 0) continue;
    linhas.push({
      y,
      folgaEsq: a - bordas.esq[y],
      folgaDir: bordas.dir[y] - z,
      largura: bordas.dir[y] - bordas.esq[y],
    });
  }
  return linhas;
}

/* ------------------------------------------------------------------ */
/* A folha — todos os candidatos no mesmo quadro, com controle          */
/* ------------------------------------------------------------------ */

/**
 * A FOLHA DE CONTATO DA BANCADA — e ela existe para o olho, não para o gate.
 *
 * A `--folha` de `fidelidade.ts` desenha **a peça importada** contra a arte, e é a
 * folha do checkpoint C. Esta é outra pergunta: *qual dos mapeamentos candidatos
 * parece o penteado?* — e para respondê-la os candidatos têm de estar lado a lado, no
 * mesmo tamanho, com uma peça **aprovada** no meio deles.
 *
 * O controle não é enfeite. Sem `CONTROLE_PARAMETRICO` na mesma folha, "o M1M2 melhorou" é
 * uma frase sobre duas peças ruins; com ele, a distância até uma peça que já passou
 * pelo olho do Doug fica visível na mesma linha.
 *
 * **56 px é o tamanho que manda** — o boneco no ranking, 30 por tela. Os outros três
 * existem para ver o que 56 esconde, não para julgar.
 */
const FOLHA_BANCADA = ".scratch/estilo/folha-mapeamentos.png";
const TAMANHOS_DA_FOLHA = [56, 100, 200, 425] as const;

function seloDe(partes: string[]): string {
  const h = createHash("sha256").update(partes.join("|")).digest("hex");
  return h.slice(0, 6).toUpperCase();
}

async function folhaDaBancada(alvo: string, resultados: Resultado[], marcos: Marcos, arte: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);
  const svgDe = (p: Cabelo, ns: string, cabelo: string) =>
    compor({ pele: PELE[1], cabelo, modeloCabelo: p, ns });

  const linhas = [...resultados, ...controle()];
  const selo = seloDe([
    alvo,
    ...linhas.map((r) => `${r.nome}:${r.coroa.toFixed(4)}:${r.folga.esq.toFixed(2)}:${r.bytes}`),
  ]);

  const refPng = `data:image/png;base64,${(
    await sharp(arte).resize({ height: 425 }).png({ palette: true, colours: 64 }).toBuffer()
  ).toString("base64")}`;

  const em = (svg: string, px: number) =>
    `<div style="width:${px}px;height:${px}px;overflow:hidden;display:block">` +
    svg.replace("<svg ", `<svg width="${px}" height="${(px * 1400) / 1000}" `) +
    `</div>`;

  const bloco = (r: Resultado) =>
    `<div style="border:1px solid #E4DFD6;border-radius:6px;padding:10px 12px;margin:0 0 10px">` +
    `<p style="font:600 13px system-ui;color:#1B2432;margin:0 0 1px">${esc(r.nome)}</p>` +
    `<p style="font:10px ui-monospace,monospace;color:#8A8378;margin:0 0 8px">${esc(r.descricao)}</p>` +
    `<div style="display:flex;gap:14px;align-items:flex-end">` +
    TAMANHOS_DA_FOLHA.map(
      (px) =>
        `<div><div style="background:#F6F2EA;padding:4px">${em(svgDe(r.peca, `a${px}${r.nome.replace(/\W/g, "")}`, CABELO[0]), px)}</div>` +
        `<p style="font:9px ui-monospace,monospace;color:#8A8378;margin:3px 0 0;text-align:center">${px}px</p></div>`,
    ).join("") +
    `<div><div style="background:#1B2432;padding:4px">${em(svgDe(r.peca, `b${r.nome.replace(/\W/g, "")}`, CABELO[0]), 100)}</div>` +
    `<p style="font:9px ui-monospace,monospace;color:#8A8378;margin:3px 0 0;text-align:center">escuro</p></div>` +
    `<p style="font:10px ui-monospace,monospace;color:#5A5248;margin:0 0 4px;line-height:1.8">` +
    `coroa <b>${r.coroa.toFixed(3)}</b> (densa ${r.denso.coroa.toFixed(3)}) · ` +
    `folga <b>${f1(r.folga.esq)}</b> / <b>${f1(r.folga.dir)}</b> u<br>` +
    `contenção ${r.contencao.toFixed(2)} · cruzamentos ${r.cruzamentos.massa + r.cruzamentos.clara} · ` +
    `N ${r.n.massa} · desvio ${r.desvio.massa.toFixed(1)} u<br>` +
    `${r.formas} formas · ${r.bytes} B (teto 26 / 10240)` +
    `${r.bytes > 10240 ? ` <b style="color:#B0402F">✗ estourou</b>` : ``}</p>` +
    `</div></div>`;

  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();
    await pg.setContent(
      `<body style="margin:0;background:#FFFFFF;display:inline-block;min-width:1120px">` +
        `<div style="padding:18px 20px 10px">` +
        `<h1 style="font:600 15px system-ui;margin:0 0 2px;color:#1B2432">` +
        `${esc(alvo)} — os mapeamentos candidatos, lado a lado</h1>` +
        `<p style="font:11px ui-monospace,monospace;color:#8A8378;margin:0;line-height:1.7">` +
        `56 px é o tamanho do ranking e é o que manda · as três últimas linhas são peças ` +
        `APROVADAS do catálogo, na mesma régua<br>` +
        `marcos — arte topo ${marcos.arte.topo.toFixed(1)} olhos ${marcos.arte.olhos.toFixed(1)} · ` +
        `produto topo ${marcos.produto.topo.toFixed(1)} olhos ${marcos.produto.olhos.toFixed(1)}</p>` +
        `</div>` +
        `<div style="display:flex;gap:18px;padding:0 20px 16px;align-items:flex-start">` +
        `<div><p style="font:600 12px system-ui;color:#1B2432;margin:0 0 4px">a arte de origem</p>` +
        `<img src="${refPng}" height="425" style="display:block;outline:1px solid #E4DFD6"></div>` +
        `<div style="flex:1">${linhas.map(bloco).join("")}</div>` +
        `</div>` +
        `<p style="font:10px ui-monospace,monospace;color:#BBB;margin:0;padding:0 20px 14px">selo ${selo}</p>` +
        `</body>`,
    );
    const caixa = (await pg.locator("body").boundingBox())!;
    const w = Math.ceil(caixa.width);
    const h = Math.ceil(caixa.height);
    await pg.setViewportSize({ width: w, height: h });
    writeFileSync(FOLHA_BANCADA, await pg.screenshot({ clip: { x: 0, y: 0, width: w, height: h } }));
  } finally {
    await nav.close();
  }
  return { caminho: FOLHA_BANCADA, selo };
}

const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");

async function main() {
  const alvo =
    process.argv.slice(2).find((a) => !a.startsWith("--")) ??
    "scripts/avatar/fonte/estilo-kokeshi/cabelo/curto-espetada/semantica.svg";
  const { marcos, resultados, arte } = await bancada(alvo);
  for (const l of marcos.laudo) console.log(l);

  /**
   * A PERGUNTA ANTERIOR AO MAPA — e ela roda primeiro de propósito.
   *
   * Se a arte já deixa couro cabeludo na coroa DELA, a tabela de mapeamentos abaixo
   * está discutindo o teto errado.
   */
  const linhaDe = (u: number) => (u * arte.bordas.h) / marcos.viewBoxDaArte.h;
  const banda = encostaNaCabeca(
    arte.uniao,
    arte.w,
    arte.bordas,
    linhaDe(marcos.arte.topo),
    linhaDe(marcos.arte.topo + 0.25 * (marcos.arte.base - marcos.arte.topo)),
    Math.round(linhaDe(marcos.arte.base - marcos.arte.topo) / 24),
  );
  console.log(
    `\nA ARTE COBRE A COROA DELA? — folga entre o cabelo e a borda da cabeça DA ARTE,\n` +
      `em pixel do raster ${ALTURA_SVG}. Positivo = couro cabeludo à mostra na própria arte.\n`,
  );
  for (const l of banda) {
    console.log(
      `  y ${String(l.y).padStart(4)}   largura da cabeça ${l.largura.toFixed(0).padStart(4)} px   ` +
        `folga esq ${l.folgaEsq.toFixed(1).padStart(7)}   dir ${l.folgaDir.toFixed(1).padStart(7)}`,
    );
  }

  // O TETO DE VERDADE: a mesma pergunta de `coberturaDaCoroa`, feita à arte contra a
  // cabeça DA ARTE. Nenhum traçador e nenhum mapa passam daqui.
  const ca = coroaNaArte(arte.cabeca, arte.uniao, arte.w, arte.h);
  console.log(
    `\n  ⇒ o mesmo gate aplicado à ARTE contra a cabeça DA ARTE (borda da cabeça dentro da\n` +
      `    tinta declarada, faixa y ${ca.y0}–${ca.limite.toFixed(0)} do raster): ` +
      `**${ca.cobertura.toFixed(3)}** (${ca.dentro}/${ca.total})\n` +
      `    É o teto. A arte já mostra ${(100 * (1 - ca.cobertura)).toFixed(1)}% de cabeça na coroa DELA —\n` +
      `    entalhe entre bicos é como cabelo espetado lê, e nenhum mapa o preenche.`,
  );

  const linhas = [...resultados, ...controle()];
  console.log(
    `\nO POUSO — ${alvo}\n` +
      `  coroa: exigido 1,000 · folga: exigido ≥ 0 (a arte deixa 1,0 u na cabeça DELA)\n`,
  );
  console.log(
    `  ${"mapa".padEnd(10)}${"coroa".padStart(7)}${"folga esq".padStart(11)}${"folga dir".padStart(11)}` +
      `${"contenção".padStart(11)}${"cruz".padStart(6)}${"N".padStart(5)}${"desvio".padStart(8)}` +
      `${"formas".padStart(8)}${"bytes".padStart(7)}`,
  );
  for (const r of linhas) {
    console.log(
      `  ${r.nome.padEnd(10)}${r.coroa.toFixed(3).padStart(7)}` +
        `${f1(r.folga.esq).padStart(11)}${f1(r.folga.dir).padStart(11)}` +
        `${r.contencao.toFixed(2).padStart(11)}${String(r.cruzamentos.massa + r.cruzamentos.clara).padStart(6)}` +
        `${String(r.n.massa).padStart(5)}${r.desvio.massa.toFixed(1).padStart(8)}` +
        `${String(r.formas).padStart(8)}${String(r.bytes).padStart(7)}`,
    );
  }

  console.log(
    `\n  O TETO DO MAPA — o mesmo laço com a DECIMAÇÃO DESLIGADA.\n` +
      `  O que sobrar aqui é do mapa; o que sumir entre as duas tabelas é da decimação.\n`,
  );
  console.log(
    `  ${"mapa".padEnd(10)}${"coroa".padStart(7)}${"folga esq".padStart(11)}${"folga dir".padStart(11)}` +
      `${"pontos".padStart(9)}${"    coroa perdida na decimação".padStart(32)}`,
  );
  for (const r of linhas) {
    console.log(
      `  ${r.nome.padEnd(10)}${r.denso.coroa.toFixed(3).padStart(7)}` +
        `${f1(r.denso.folga.esq).padStart(11)}${f1(r.denso.folga.dir).padStart(11)}` +
        `${String(r.denso.pontos).padStart(9)}` +
        `${(r.denso.coroa - r.coroa).toFixed(3).padStart(32)}`,
    );
  }

  /**
   * ONDE A COROA FALHA — no laço DENSO, para o defeito não vir misturado com
   * decimação, e no controle aprovado ao lado, para "0,52" ter escala.
   */
  console.log(`\n  ONDE A COROA FALHA — laço denso, por faixa de altura e por lado:\n`);
  for (const r of [...resultados.filter((x) => ["M1", "M1M2", "M4"].includes(x.nome)), controle()[0]]) {
    const d = ondeACoroaFalha(r.denso.peca);
    console.log(`  ${r.nome}  (${d.dentro}/${d.total} = ${(d.dentro / d.total).toFixed(3)})`);
    for (const l of d.linhas) {
      const barra = "█".repeat(Math.round(20 * l.pct)).padEnd(20, "·");
      console.log(
        `    ${l.banda.padEnd(24)} ${l.lado}  ${barra} ${(100 * l.pct).toFixed(0).padStart(3)}%  ` +
          `(${l.dentro}/${l.total})   o que está fora: médio ${l.foraMedio.toFixed(1)} u · ` +
          `máx ${l.foraMax.toFixed(1)} u`,
      );
    }
    console.log(
      `    QUÃO fora — ${d.escada
        .map((e) => `${e.ate === Infinity ? `>${e.de}` : `≤${e.ate}`} u: ${e.quantos}`)
        .join(" · ")}`,
    );
    const frac = d.piorArco / d.perimetro;
    const cob = d.dentro / d.total;
    console.log(
      `    VEREDITO na régua calibrada — cobertura ${cob.toFixed(3)} ` +
        `(piso ${PISO_DE_COBERTURA})${cob >= PISO_DE_COBERTURA ? " ✓" : " ✗"} · ` +
        `fração do pior arco ${frac.toFixed(3)} (teto ${FRACAO_DE_ARCO})` +
        `${frac <= FRACAO_DE_ARCO ? " ✓" : " ✗"}  ⇒ ` +
        (cob >= PISO_DE_COBERTURA && frac <= FRACAO_DE_ARCO
          ? "família ENTALHE (bico, e é a arte funcionando)"
          : cob < PISO_DE_COBERTURA && frac > FRACAO_DE_ARCO
            ? "família ARO (a touca é pequena)"
            : "ENTRE as duas famílias — nem bico limpo, nem aro"),
    );
    console.log(
      `    ARCOS que falham (perímetro da coroa ${d.perimetro} u) — ${d.arcos.length} arco(s), ` +
        `o pior com ${d.piorArco} u:` +
        (d.arcos.length
          ? `\n      ` +
            d.arcos
              .slice(0, 4)
              .map(
                (a) =>
                  `x ${a.de.toFixed(0)}→${a.ate.toFixed(0)}: ${a.comprimento} u de arco, ` +
                  `${a.profundidade.toFixed(1)} u de fundo`,
              )
              .join("\n      ")
          : ""),
    );
  }

  console.log(`\n  ${resultados.map((r) => `${r.nome} = ${r.descricao}`).join("\n  ")}`);

  if (process.argv.includes("--folha")) {
    mkdirSync(".scratch/estilo", { recursive: true });
    const { caminho, selo } = await folhaDaBancada(
      alvo,
      resultados,
      marcos,
      alvo.replace(/semantica\.svg$/, "referencia.png"),
    );
    console.log(`\n  selo ${selo}\n  ${caminho}`);
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/avatar/estilo/mapear.ts")) {
  void main();
}
