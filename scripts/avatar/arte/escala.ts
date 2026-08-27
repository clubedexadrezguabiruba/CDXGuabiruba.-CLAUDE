/**
 * BLOCO 6 — OS 92%, medidos no render e não na planilha.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO PROVA
 * ---------------------------------------------------------------------------
 *
 * A decisão foi tomada sobre uma tabela aritmética: `700 − folga − 610,3 × escala`.
 * Aritmética prevê; render mede. As quatro perguntas que só o render responde:
 *
 *  1. quanto espaço sobra **acima da coroa** depois de encolher;
 *  2. se a peça a `y = −39,7 u` de fato **cabe** agora, ou se ainda encosta no
 *     teto do quadro — que é o defeito que o `viewBox` comete em silêncio;
 *  3. quanto o boneco **perde de altura** no tamanho que manda, 56 px;
 *  4. se a **base de edição** continua intacta — a AMARRA.
 *
 * ---------------------------------------------------------------------------
 * A AMARRA MUDOU DE NATUREZA NO BLOCO 5, E ESTE ARQUIVO É QUEM A SUSTENTA
 * ---------------------------------------------------------------------------
 *
 * Enquanto o padrão de `compor()` era 1, a amarra era **estrutural**:
 * `base-oficial.ts` chamava sem o campo, o campo ausente não emitia transformação
 * nenhuma, e a base que vai ao gerador não encolhia nem que alguém esquecesse —
 * não havia ordem a obedecer, havia um caminho que não existia.
 *
 * Com os 92% virando padrão, ela virou **uma linha que alguém pode apagar**:
 * `base-oficial.ts` agora pede `escala: 1` explicitamente. A troca foi consciente
 * e tem preço, e o preço é este arquivo — a conferência do hash do PNG contra o
 * manifesto deixou de ser zelo e passou a ser a única coisa entre o gerador e uma
 * base encolhida. Por isso `verify:arte` a executa.
 *
 * **A escala é sempre explícita aqui**, nos dois lados da comparação. Este arquivo
 * mede escala; um medidor de escala que herda o padrão mede o padrão, não a
 * escala — e foi o que aconteceu por uma rodada, com "100%" e "92%" saindo com o
 * mesmo número na folha.
 */

import { createHash } from "crypto";
import { mkdirSync, readFileSync } from "fs";

import sharp from "sharp";

import type { Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarSvg } from "../render-svg";
import { FUNDO, MANIFESTO, PASTA, PNG_BASE, saidaDaArte } from "./base";
import { converter } from "./converter";
import { luz } from "./pixels";

/** A escala decidida pelo Doug em 2026-08-06. */
export const ESCALA_BONECO = 0.92;
/** Alto o bastante para 1 unidade valer 2 px. */
const ALT = 1400;

/** Primeira e última linha com tinta, em unidades do `viewBox`. */
async function extensao(arq: string, larg: number, alt: number) {
  const { data } = await sharp(arq).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const porU = alt / VIEWBOX.h;
  let y0 = -1;
  let y1 = -1;
  for (let y = 0; y < alt; y++) {
    let tem = false;
    for (let x = 0; x < larg && !tem; x++) {
      const j = (y * larg + x) * 3;
      // Tinta = qualquer coisa distinguível do fundo. O mesmo `NIVEL` do Gate −1.
      if (Math.abs(luz(data[j], data[j + 1], data[j + 2]) - luz(251, 248, 245)) > 6) tem = true;
    }
    if (tem) {
      if (y0 < 0) y0 = y;
      y1 = y;
    }
  }
  return { y0: y0 / porU, y1: y1 / porU, tocaOTeto: y0 <= 0 };
}

export interface MedidaDaFigura {
  y0: number;
  y1: number;
  tocaOTeto: boolean;
  arq: string;
}

export interface MedidaDaEscala {
  carecaCem: MedidaDaFigura;
  careca92: MedidaDaFigura;
  pecaCem: MedidaDaFigura;
  peca92: MedidaDaFigura;
  /** Onde a coroa (linha de centro) pousa no quadro, em u. */
  coroaEm: (s: number) => number;
  /** Altura do boneco no quadro que manda, 56 × 70 px. */
  alturaNoQuadro: (m: { y0: number; y1: number }) => number;
  picoAntes: number;
  hashConfere: boolean;
  bytes: { sem: number; com: number };
}

/**
 * OS NÚMEROS DOS 92%, medidos no render — separados da impressão de propósito.
 *
 * `reguas-conferidas.ts` precisa dos mesmos números que o terminal mostra, e a
 * primeira versão deste arquivo só sabia imprimir. Uma régua que só existe dentro
 * de um `console.log` não pode ser conferida por ninguém.
 */
export async function medirEscala(arte?: string): Promise<MedidaDaEscala> {
  const destino = saidaDaArte(arte ?? `${PASTA}/chanel.png`);
  mkdirSync(destino, { recursive: true });
  const c = await converter(arte ?? `${PASTA}/chanel.png`);

  const larg = Math.round((ALT * VIEWBOX.w) / VIEWBOX.h);
  const nav = await abrirNavegador();
  const est = { pele: PELE[2], cabelo: CABELO[1] };

  // A ESCALA É SEMPRE EXPLÍCITA AQUI, e isso é conserto de 2026-08-06.
  //
  // Este arquivo foi escrito quando o padrão de `compor()` era 1, e por isso o caso
  // "100%" omitia o campo. Quando os 92% viraram padrão (Bloco 5), o "100%" passou
  // a renderizar a 92% — e a folha mostrou os dois casos com o MESMO número, que é
  // o modo de falha que este projeto já pagou três vezes: régua que não separa não
  // é régua. Um medidor de escala não pode depender de qual é o padrão.
  const medir = async (nome: string, peca: Cabelo | undefined, escala: number) => {
    const arq = `${destino}/e-${nome}.png`;
    await renderizarSvg(
      nav,
      compor({ ...est, ...(peca ? { modeloCabelo: peca } : {}), ns: `e${nome}`, escala }),
      larg,
      ALT,
      arq,
      FUNDO,
    );
    return { ...(await extensao(arq, larg, ALT)), arq };
  };

  const carecaCem = await medir("careca-100", undefined, 1);
  const careca92 = await medir("careca-92", undefined, ESCALA_BONECO);
  // A peça CRUA — a que sobe a −38,9 u, sem compressão nenhuma. É ela que o
  // Doug quer fiel ao PNG, e é ela que o viewport cortava.
  const pecaCem = await medir("peca-100", c.crua, 1);
  const peca92 = await medir("peca-92", c.crua, ESCALA_BONECO);

  await nav.close();

  /**
   * Onde a coroa (linha de centro) pousa no quadro.
   *
   * A 100% não há `<g transform>` nenhum, então ela está onde `geometria.ts` a
   * põe e ponto. Aplicar a fórmula do reposicionamento ali daria 68 u, que é
   * quanto ela ESTARIA se a figura fosse reancorada sem encolher — número que
   * não descreve nada que exista.
   */
  const coroaEm = (s: number) =>
    s === 1 ? CAIXA_CABECA.y0 : VIEWBOX.h - 20 - 658 * s + CAIXA_CABECA.y0 * s;

  /**
   * O QUADRO QUE MANDA É 56 × 70, e a altura é a que aperta.
   *
   * O `viewBox` de 5:7 rende por altura dentro de um quadro 4:5: sobram 6 px na
   * horizontal e zero na vertical. Medir o boneco contra 56 daria um número
   * certo numa régua que não é a do produto — e incomparável com a tabela em que
   * a decisão dos 92% foi tomada.
   */
  const QUADRO_ALT = 70;
  const noQuadro = (u: number) => (u / VIEWBOX.h) * QUADRO_ALT;

  const selo = createHash("sha256").update(readFileSync(PNG_BASE)).digest("hex");
  const man = JSON.parse(readFileSync(MANIFESTO, "utf-8")) as { hash: { png: string } };
  const est2 = { pele: PELE[2], cabelo: CABELO[1] };

  return {
    carecaCem,
    careca92,
    pecaCem,
    peca92,
    coroaEm,
    alturaNoQuadro: (m) => noQuadro(m.y1 - m.y0),
    picoAntes: c.picoAntes,
    hashConfere: selo === man.hash.png,
    bytes: {
      // `sem` é agora "com escala 1", a base de EDIÇÃO — e é o número que interessa
      // conferir, porque é ele que a arte já gerada depende de não mudar.
      sem: Buffer.byteLength(compor({ ...est2, ns: "kk", animado: true, escala: 1 }), "utf-8"),
      com: Buffer.byteLength(compor({ ...est2, ns: "kk", animado: true }), "utf-8"),
    },
  };
}

async function principal() {
  const arte = process.argv[2] ?? `${PASTA}/chanel.png`;
  const m = await medirEscala(arte);
  const { carecaCem, careca92, pecaCem, peca92, coroaEm } = m;
  const QUADRO_ALT = 70;

  console.log(`BLOCO 6 — OS 92% — ${arte}\n`);
  console.log(`  A FIGURA NO QUADRO (medida no render, em unidades do viewBox)`);
  console.log(`    careca 100%   tinta de y ${carecaCem.y0.toFixed(1)} a ${carecaCem.y1.toFixed(1)}`);
  console.log(`    careca  92%   tinta de y ${careca92.y0.toFixed(1)} a ${careca92.y1.toFixed(1)}`);
  console.log(
    `    espaço acima da coroa   ${coroaEm(1).toFixed(0)} u a 100%  →  ${coroaEm(ESCALA_BONECO).toFixed(0)} u a 92%`,
  );

  console.log(`\n  A PEÇA CRUA (pico ${m.picoAntes.toFixed(1)} u, sem compressão)`);
  console.log(
    `    a 100%   tinta começa em y ${pecaCem.y0.toFixed(1)}   ${pecaCem.tocaOTeto ? "✗ ENCOSTA NO TETO — o viewport corta" : "· cabe"}`,
  );
  console.log(
    `    a  92%   tinta começa em y ${peca92.y0.toFixed(1)}   ${peca92.tocaOTeto ? "✗ ENCOSTA NO TETO — o viewport corta" : "· cabe"}`,
  );

  const noQuadro = (u: number) => (u / VIEWBOX.h) * QUADRO_ALT;
  console.log(`\n  CUSTO, no quadro que manda (56 × ${QUADRO_ALT} px)`);
  console.log(
    `    boneco   ${m.alturaNoQuadro(carecaCem).toFixed(1)} px a 100%  →  ${m.alturaNoQuadro(careca92).toFixed(1)} px a 92%`,
  );
  console.log(
    `    traço    ${noQuadro(TRACO).toFixed(2)} px  →  ${noQuadro(TRACO * ESCALA_BONECO).toFixed(2)} px`,
  );

  console.log(`\n  A AMARRA — a base de EDIÇÃO não encolheu`);
  console.log(`    ${m.hashConfere ? "· CONFERE — a arte já gerada continua válida" : "✗ NÃO CONFERE"}`);

  console.log(`\n  OS DOIS CONCEITOS, LADO A LADO`);
  console.log(`    compor() a 100% (base de edição)   ${m.bytes.sem} bytes`);
  console.log(
    `    compor() padrão, a 92%            ${m.bytes.com} bytes  ` +
      `(+${m.bytes.com - m.bytes.sem}, o \`<g transform>\`)`,
  );
}

// A guarda importa: `folha.ts` importa `ESCALA_BONECO` daqui, e sem ela o
// arquivo inteiro rodaria de novo a cada import — três navegadores por engano.
if (process.argv[1]?.endsWith("escala.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
