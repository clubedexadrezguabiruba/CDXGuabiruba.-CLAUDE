/**
 * DEFEITOS 2 e 4 — os dois que são sobre PRETO NA COROA, medidos juntos.
 *
 * ---------------------------------------------------------------------------
 * POR QUE OS DOIS NO MESMO ARQUIVO
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou duas coisas que parecem diferentes e vivem no mesmo lugar:
 *
 *  - **defeito 2**, *"traço preto muito grosso no cabelo parte de cima"*;
 *  - **defeito 4**, *"a faixa escura na coroa me incomoda sim"*.
 *
 * O estado da rota levantou a hipótese de que 2 é o mesmo que 1 — que o traço de
 * cima não estaria grosso, estaria sozinho, e nasceria com os arcos de
 * `Cabelo.linhas`. Medir antes de afirmar é a regra, e é o que este arquivo faz.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS RÉGUAS
 * ---------------------------------------------------------------------------
 *
 * **Espessura da faixa (defeito 2)** — a coluna vertical que passa pelo eixo da
 * cabeça, do topo do quadro até a coroa. Conta a maior corrida contígua de preto
 * e converte para unidades do `viewBox`. `TRACO` é 12: uma faixa de 12 u é um
 * traço; 24 u são dois traços encostados, e aí "grosso" é literal.
 *
 * **Preto na coroa a 56 px (defeito 4)** — o tamanho que manda, o do ranking.
 * Conta pixels escuros dentro da calota, que é onde a faixa incomoda. É a mesma
 * régua que mediu 97 px contra 13 na rodada anterior.
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import type { Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, EIXO_CABECA, TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE, escurecer } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarSvg } from "../render-svg";
import { FUNDO, PASTA, saidaDaArte } from "./base";
import { converter } from "./converter";


/** O tamanho que manda: o boneco no ranking. */
const P = 56;
/** O tamanho de leitura, para a espessura ter resolução. */
const G = 700;
/**
 * PRETO É O QUE ESTÁ MAIS PERTO DE `--av-linha` QUE DAS DUAS CORES DE CABELO.
 *
 * Não é limiar de luminância, e isso é conserto de um erro medido: a primeira
 * versão usava luminância < 90, e `CABELO[1]` é `#6E4326`, luminância 76,5 — a
 * massa inteira contava como traço e a régua devolveu 144 u de "faixa" nas
 * quatro configurações, ou seja o mesmo número para coisas visivelmente
 * diferentes. Régua que não separa não é régua.
 *
 * As três referências são exatamente o que o compositor emite, então a decisão é
 * por distância em RGB e não por número escolhido.
 */
const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const dist = (a: [number, number, number], b: [number, number, number]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * A CALOTA — de meio traço acima da coroa até um terço da altura da cabeça.
 *
 * Não é caixa escolhida a olho: `CAIXA_CABECA.y0` é a linha de centro do
 * contorno e meio traço acima dela é a silhueta externa, o mesmo ponto que
 * `CABECA_H_EXTERNA` e `folha-base.ts:213` usam. Um terço da altura pega a coroa
 * inteira e para bem acima da sobrancelha.
 */
const CALOTA = {
  y0: CAIXA_CABECA.y0 - TRACO / 2,
  y1: CAIXA_CABECA.y0 + CAIXA_CABECA.alt / 3,
  x0: CAIXA_CABECA.x0,
  x1: CAIXA_CABECA.x1,
};

export interface Coroa {
  /** Defeito 4: pixels escuros dentro da calota, no tamanho do ranking. */
  escurosA56: number;
  /** Defeito 2: maior corrida contígua de preto na vertical do eixo, em u. */
  faixaU: number;
}

/**
 * COMO A RÉGUA DECIDE O QUE É PRETO — e o modo `luminancia` existe para FALHAR.
 *
 * `cor` é o método consertado (distância em RGB até as três cores que o
 * compositor de fato emite). `luminancia` é o método ANTIGO, com o limiar de 90
 * que `extrair.ts` usa sobre a ARTE — e ele está aqui de propósito, preservado
 * como reprodução do erro: `reguas-conferidas.ts` roda os dois e mostra que o
 * antigo devolve o MESMO número para peças visivelmente diferentes.
 *
 * Uma régua consertada sem o erro ao lado é uma régua que ninguém consegue
 * conferir que está consertada.
 */
export type MetodoDePreto = "cor" | "luminancia";

export async function medirCoroa(
  peca: Cabelo | undefined,
  rotulo: string,
  destino: string,
  opc: { escala?: number; metodo?: MetodoDePreto } = {},
): Promise<Coroa> {
  const { metodo = "cor", ...doCompositor } = opc;
  const nav = await abrirNavegador();
  const est = { pele: PELE[2], cabelo: CABELO[1] };
  // `escala: 1` por padrão: a `CALOTA` sai de `CAIXA_CABECA` em coordenadas do
  // `viewBox`, e uma figura encolhida dentro do mesmo quadro poria a coroa fora da
  // janela em que a régua conta preto. Quem quiser medir a 92% passa `escala`
  // explicitamente — é o que o Bloco 5 mede.
  const svg = compor({
    ...est,
    ...(peca ? { modeloCabelo: peca } : {}),
    ns: `co${rotulo}`,
    escala: 1,
    ...doCompositor,
  });

  const medir = async (alt: number) => {
    const larg = Math.round((alt * VIEWBOX.w) / VIEWBOX.h);
    const arq = `${destino}/c-${rotulo}-${alt}.png`;
    await renderizarSvg(nav, svg, larg, alt, arq, FUNDO);
    const { data } = await sharp(arq).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, larg, alt, porU: alt / VIEWBOX.h };
  };

  const p = await medir(P);
  const g = await medir(G);
  await nav.close();

  const LINHA_RGB = hex("#000000");
  const CLARO = hex(est.cabelo);
  const ESCURO_RGB = hex(escurecer(est.cabelo));
  const ePreto = (d: Buffer | Uint8Array, j: number) => {
    const v: [number, number, number] = [d[j], d[j + 1], d[j + 2]];
    if (metodo === "luminancia") return 0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2] < 90;
    const dl = dist(v, LINHA_RGB);
    return dl < dist(v, CLARO) && dl < dist(v, ESCURO_RGB);
  };

  // Defeito 4 — pixels de TRAÇO na calota, a 56 px.
  let escurosA56 = 0;
  for (let y = Math.floor(CALOTA.y0 * p.porU); y < Math.ceil(CALOTA.y1 * p.porU); y++) {
    for (let x = Math.floor(CALOTA.x0 * p.porU); x < Math.ceil(CALOTA.x1 * p.porU); x++) {
      if (x < 0 || y < 0 || x >= p.larg || y >= p.alt) continue;
      if (ePreto(p.data, (y * p.larg + x) * 3)) escurosA56++;
    }
  }

  // Defeito 2 — a maior corrida de traço na vertical do eixo da cabeça, a 700 px.
  const col = Math.round(EIXO_CABECA * g.porU);
  let maior = 0;
  let atual = 0;
  for (let y = 0; y < Math.ceil(CALOTA.y1 * g.porU); y++) {
    if (ePreto(g.data, (y * g.larg + col) * 3)) {
      atual++;
      if (atual > maior) maior = atual;
    } else atual = 0;
  }

  return { escurosA56, faixaU: maior / g.porU };
}

if (process.argv[1]?.endsWith("coroa.ts")) {
  const arte = process.argv[2] ?? `${PASTA}/chanel.png`;
  const destino = saidaDaArte(arte);
  mkdirSync(destino, { recursive: true });
  converter(arte)
    .then(async (c) => {
      // A progressão dos quatro defeitos morreu junto com os caminhos que ela
      // comparava — `massaPorCima`, o `atras` da peça traçada e a partição
      // massa/extensão saíram no Bloco 4. O que resta comparar é o que sobrou:
      // a CARECA, que é o piso da régua, e a peça sobreposta.
      const semLinhas: Cabelo = { ...c.peca, linhas: undefined };
      const casos: [string, Cabelo | undefined][] = [
        ["careca (o piso da régua)", undefined],
        ["peça sem `linhas`", semLinhas],
        ["peça sobreposta", c.peca],
      ];

      console.log(`DEFEITOS 2 e 4 — PRETO NA COROA — ${arte}\n`);
      console.log(`  configuração                    escuros a 56 px   faixa no eixo`);
      let i = 0;
      for (const [nome, peca] of casos) {
        const m = await medirCoroa(peca, `k${i++}`, destino);
        console.log(
          `  ${nome.padEnd(30)} ${String(m.escurosA56).padStart(9)} px   ${m.faixaU.toFixed(1).padStart(8)} u`,
        );
      }
      console.log(`\n  TRACO nominal = ${TRACO} u. Faixa perto de ${TRACO} é UM traço;`);
      console.log(`  perto de ${2 * TRACO} são dois encostados, e aí "grosso" é literal.`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
