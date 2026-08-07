/**
 * POR QUE A REGIÃO PROTEGIDA MUDOU — a causa, separada por cor.
 *
 * ---------------------------------------------------------------------------
 * O GATE −1 NÃO CONSEGUE RESPONDER ISTO, E É DE PROPÓSITO
 * ---------------------------------------------------------------------------
 *
 * O Gate −1 mede FORMA por correlação em ladrilhos, sem saber o que é peça e o
 * que é boneco — nesse momento ainda não existe extração. Ele responde "a forma
 * do rosto mudou", e essa resposta é honesta e cega às duas causas possíveis:
 *
 *  - **cabelo legítimo cobrindo o boneco.** Uma franja sobre o olho, uma mecha
 *    caindo na frente do ombro. O desenho está certo e o gate reprova por
 *    construção — é a dívida declarada de `base.ts:174-189`, que trocou a caixa
 *    larga pela silhueta do tronco justamente para reduzir esse caso, e só
 *    conseguiu salvar o cabelo que cai AO LADO do tronco.
 *  - **o Gemini redesenhou o boneco.** Aí a arte é lixo e gerar de novo é a
 *    única saída.
 *
 * A diferença entre as duas é a COR do que apareceu. Cabelo é ciano instrumental
 * ou o preto do contorno dele; boneco redesenhado é pele, ou o preto das feições
 * saindo do lugar. Este arquivo faz essa separação e mais nada — ele não aprova,
 * não reprova e não conserta. Ele diz de que cor é a reprovação.
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import {
  FUNDO,
  LADO,
  PASTA,
  PNG_BASE,
  REGIOES_QUE_REPROVAM,
  paraUnidade,
  regiaoDoPixel,
  saidaDaArte,
} from "./base";
import { carregar, delta, distanciaMatiz, luz, matiz } from "./pixels";

/** Os mesmos três de `extrair.ts` — o ciano instrumental do pedido ao Gemini. */
const MATIZ = 180;
const TOL_MATIZ = 30;
const SAT_MIN = 0.18;
const ESCURO = 90;
/** O mesmo `NIVEL` do Gate −1: 24 níveis de luminância. */
const NIVEL = 24;

type Classe = "ciano" | "preto novo" | "clareou" | "outro";

const CORES: Record<Classe, [number, number, number]> = {
  ciano: [0, 200, 200],
  "preto novo": [40, 40, 40],
  clareou: [240, 170, 30],
  outro: [220, 30, 140],
};

export interface Laudo {
  /** Contagem por região protegida e por classe de cor. */
  conta: Record<string, Record<Classe, number>>;
  caixa: Record<string, { x0: number; y0: number; x1: number; y1: number }>;
  /** As três causas somadas nas duas regiões que reprovam. */
  soma: { peca: number; repintura: number; outro: number };
  total: number;
  /** Frações em % — o que a tabela do estado guarda. */
  fracao: { peca: number; repintura: number; outro: number };
  painel: string;
}

/**
 * A SEPARAÇÃO POR COR, devolvida como número — não só impressa.
 *
 * No Bloco 2 este laudo deixa de ser diagnóstico opcional e passa a entrar no
 * Gate −1. Um diagnóstico que só existe dentro de um `console.log` não pode ser
 * consumido por gate nenhum, e é por isso que a função saiu de dentro do script.
 */
export async function porqueReprovou(arte: string): Promise<Laudo> {
  const saida = saidaDaArte(arte);
  mkdirSync(saida, { recursive: true });

  const base = await carregar(PNG_BASE, FUNDO);
  const art = await carregar(arte, FUNDO);
  if (art.w !== base.w || art.h !== base.h) {
    throw new Error(`dimensões diferentes — o Gate −1 já reprovaria antes disto`);
  }

  const conta: Record<string, Record<Classe, number>> = {};
  const caixa: Record<string, { x0: number; y0: number; x1: number; y1: number }> = {};
  for (const r of REGIOES_QUE_REPROVAM) {
    conta[r] = { ciano: 0, "preto novo": 0, clareou: 0, outro: 0 };
    caixa[r] = { x0: LADO, y0: LADO, x1: -1, y1: -1 };
  }

  const painel = Buffer.alloc(LADO * LADO * 3);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const i = y * LADO + x;
      const j = i * 3;
      // Fundo do painel: a arte esmaecida, para o olho achar onde é.
      const claro = (v: number) => Math.round(255 - (255 - v) * 0.18);
      painel[j] = claro(art.data[j]);
      painel[j + 1] = claro(art.data[j + 1]);
      painel[j + 2] = claro(art.data[j + 2]);

      const r = regiaoDoPixel(x, y);
      if (!REGIOES_QUE_REPROVAM.includes(r)) continue;
      if (delta(base, art, x, y) <= NIVEL) continue;

      const [ar, ag, ab] = [art.data[j], art.data[j + 1], art.data[j + 2]];
      const { h, s } = matiz(ar, ag, ab);
      const luzAgora = luz(ar, ag, ab);
      const luzAntes = luz(base.data[j], base.data[j + 1], base.data[j + 2]);

      const classe: Classe =
        s >= SAT_MIN && distanciaMatiz(h, MATIZ) <= TOL_MATIZ
          ? "ciano"
          : luzAgora < ESCURO && luzAntes >= ESCURO
            ? "preto novo"
            : luzAgora > luzAntes + NIVEL
              ? "clareou"
              : "outro";

      conta[r][classe]++;
      const c = caixa[r];
      if (x < c.x0) c.x0 = x;
      if (y < c.y0) c.y0 = y;
      if (x > c.x1) c.x1 = x;
      if (y > c.y1) c.y1 = y;

      const cor = CORES[classe];
      painel[j] = cor[0];
      painel[j + 1] = cor[1];
      painel[j + 2] = cor[2];
    }
  }

  const arqPainel = `${saida}/11-porque-reprovou.png`;
  await sharp(painel, { raw: { width: LADO, height: LADO, channels: 3 } })
    .png()
    .toFile(arqPainel);

  // São TRÊS baldes e não dois. `clareou` é a repintura que o Gemini faz nas
  // feições (`#000000` → `#464646`, medida em 2026-08-06) — tinta trocada onde já
  // havia tinta, sem forma nova. Ela não é peça e não é redesenho, e é justamente
  // por causa dela que o Gate −1 mede forma por correlação e não cor. Somá-la a
  // "redesenhado" faria a arte APROVADA parecer 100% redesenhada.
  const soma = REGIOES_QUE_REPROVAM.reduce(
    (s, r) => {
      s.peca += conta[r].ciano + conta[r]["preto novo"];
      s.repintura += conta[r].clareou;
      s.outro += conta[r].outro;
      return s;
    },
    { peca: 0, repintura: 0, outro: 0 },
  );
  const total = soma.peca + soma.repintura + soma.outro;
  const pc = (v: number) => (total ? (100 * v) / total : 0);
  return {
    conta,
    caixa,
    soma,
    total,
    fracao: { peca: pc(soma.peca), repintura: pc(soma.repintura), outro: pc(soma.outro) },
    painel: arqPainel,
  };
}

async function principal() {
  const arte = process.argv[2] ?? `${PASTA}/entrada.png`;
  const { conta, caixa, soma, total, painel } = await porqueReprovou(arte);

  console.log(`POR QUE A REGIÃO PROTEGIDA MUDOU — ${arte}\n`);
  console.log(`  Só as duas regiões que reprovam. Pixels que mudaram mais que ${NIVEL} níveis.\n`);
  for (const r of REGIOES_QUE_REPROVAM) {
    const c = conta[r];
    const total = c.ciano + c["preto novo"] + c.clareou + c.outro;
    console.log(`  ${r}   ${total} px mudados`);
    if (!total) {
      console.log(`    (nada)\n`);
      continue;
    }
    for (const k of ["ciano", "preto novo", "clareou", "outro"] as Classe[]) {
      const pc = (100 * c[k]) / total;
      console.log(`    ${k.padEnd(12)} ${String(c[k]).padStart(7)} px  ${pc.toFixed(1).padStart(5)}%`);
    }
    const b = caixa[r];
    const a0 = paraUnidade(b.x0, b.y0);
    const a1 = paraUnidade(b.x1, b.y1);
    console.log(
      `    caixa em u   x ${a0.x.toFixed(0)}→${a1.x.toFixed(0)}   y ${a0.y.toFixed(0)}→${a1.y.toFixed(0)}\n`,
    );
  }

  console.log(`  VEREDITO DE CAUSA (não é aprovação — o Gate −1 continua valendo)`);
  if (!total) {
    console.log(`    nada mudou nas regiões protegidas.`);
  } else {
    const pc = (v: number) => `${((100 * v) / total).toFixed(1)}%`;
    console.log(`    PEÇA cobrindo o boneco (ciano + preto novo)  ${soma.peca} px  ${pc(soma.peca)}`);
    console.log(`    REPINTURA das feições (só clareou)           ${soma.repintura} px  ${pc(soma.repintura)}`);
    console.log(`    NÃO EXPLICADO                                ${soma.outro} px  ${pc(soma.outro)}`);
  }
  console.log(`\n  painel em ${painel}`);
}

if (process.argv[1]?.endsWith("porque-reprovou.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
