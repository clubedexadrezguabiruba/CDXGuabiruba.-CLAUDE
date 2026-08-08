/**
 * PASSO 1 DO BLOCO 13 — A RÉGUA DA ESPESSURA, nas quatro artes e nos dois lados.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA QUE ELE DECIDE, e ele decide ANTES de custar uma linha de tipo
 * ---------------------------------------------------------------------------
 *
 * O plano do Bloco 13 tem uma bifurcação de arte: o núcleo de ciano sai da
 * máscara **da artista** (`mascara ∧ papeis ≠ 4`, banda variável) ou de uma
 * **erosão por meio traço** (banda de 12 u constante, igual ao crânio). A
 * primeira exige emenda declarada a `tracar-cabelo.ts:1584-1596`, que hoje diz
 * que *"reproduzir a variação da arte seria trocar a lei do estilo pelo capricho
 * do modelo de difusão"*.
 *
 * Se a banda da artista for fina demais para ler a 56 px, a variante fiel morre
 * aqui — antes da emenda, antes do tipo, antes do compositor.
 *
 * ---------------------------------------------------------------------------
 * A MESMA RÉGUA NOS DOIS LADOS
 * ---------------------------------------------------------------------------
 *
 * `espessuraDoTraco` (em `converter.ts`) mede a banda **na arte**, pela normal do
 * contorno denso. `medirCoroa` (em `coroa.ts`) mede a faixa **no render**, na
 * vertical do eixo da cabeça. As duas devolvem unidades do `viewBox`, e é a
 * comparação delas que diz se o render engrossa a banda — que é o defeito medido
 * no Bloco 12 (render 34 485 px de preto contra 28 461 da arte, **1,21×**).
 *
 * As duas medem coisas diferentes de propósito: `faixaU` é uma corrida na coluna
 * do eixo (uma amostra, no lugar onde o Doug reclamou), a espessura é a
 * distribuição pelo perímetro inteiro. Uma não substitui a outra, e nenhuma delas
 * é gate — o gate do Passo 2 é outro.
 */

import { mkdirSync } from "fs";

import { TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { PASTA, saidaDaArte } from "./base";
import { converter } from "./converter";
import { medirCoroa } from "./coroa";
import { extrair } from "./extrair";

const ARTES = ["entrada", "entrada-2", "chanel"];

/** Unidades do `viewBox` viram pixels no tamanho que manda, o do ranking. */
const U_POR_PX_56 = VIEWBOX.h / 56;
const px56 = (u: number) => u / U_POR_PX_56;

async function principal(): Promise<void> {
  console.log(`PASSO 1 — A RÉGUA DA ESPESSURA\n`);
  console.log(
    `  Referências: TRACO = ${TRACO} u = ${px56(TRACO).toFixed(2)} px a 56;` +
      `  a sobrancelha inteira tem 0,66 px (cabelo.ts:334-337) e é o limite do legível.\n`,
  );
  console.log(
    `  arte         p05           p50           p95           < 8 u    satur.   com traço`,
  );

  const guardado: Record<string, { p50: number }> = {};

  for (const nome of ARTES) {
    const arte = `${PASTA}/${nome}.png`;
    const c = await converter(arte);
    const e = c.espessura;
    guardado[nome] = { p50: e.p50 };
    const col = (u: number) => `${u.toFixed(1)} u/${px56(u).toFixed(2)}px`.padEnd(14);
    console.log(
      `  ${nome.padEnd(11)} ${col(e.p05)}${col(e.p50)}${col(e.p95)}` +
        `${(100 * e.fracaoFina).toFixed(1).padStart(6)}%  ` +
        `${(100 * e.fracaoSaturada).toFixed(1).padStart(6)}%  ` +
        `${(100 * c.traco.densa).toFixed(1).padStart(6)}%`,
    );
  }

  // ------------------------------------------------- os papéis, para contexto
  console.log(`\n  O PAPEL \`traco\` DA ARTE — a área que a hipótese do Passo 2 usa como denominador\n`);
  console.log(`  arte         papel traco    papel massa    papel sombra   papel luz`);
  for (const nome of ARTES) {
    const e = await extrair(`${PASTA}/${nome}.png`);
    const p = (v: number) => `${v}`.padStart(9) + " px";
    console.log(
      `  ${nome.padEnd(11)} ${p(e.porPapel.traco.pixels)}  ${p(e.porPapel.massa.pixels)}  ` +
        `${p(e.porPapel.sombra.pixels)}  ${p(e.porPapel.luz.pixels)}`,
    );
  }

  // ------------------------------------------------------ a régua do RENDER
  console.log(`\n  A MESMA RÉGUA NO RENDER — \`medirCoroa\`, faixa na vertical do eixo\n`);
  console.log(`  arte         faixa no eixo   escuros a 56 px   p50 da ARTE`);
  let i = 0;
  for (const nome of ARTES) {
    const arte = `${PASTA}/${nome}.png`;
    const destino = saidaDaArte(arte);
    mkdirSync(destino, { recursive: true });
    const c = await converter(arte);
    const m = await medirCoroa(c.peca, `e${i++}`, destino);
    console.log(
      `  ${nome.padEnd(11)} ${m.faixaU.toFixed(1).padStart(10)} u   ` +
        `${String(m.escurosA56).padStart(11)} px   ` +
        `${guardado[nome].p50.toFixed(1).padStart(8)} u`,
    );
  }

  // A careca é o PISO da régua da coroa (Bloco 1: 1 px, não 0). Sem ela, um número
  // baixo não se distingue de vacuidade.
  const destino = saidaDaArte(`${PASTA}/chanel.png`);
  const piso = await medirCoroa(undefined, `episo`, destino);
  console.log(
    `  ${"[careca]".padEnd(11)} ${piso.faixaU.toFixed(1).padStart(10)} u   ` +
      `${String(piso.escurosA56).padStart(11)} px   ` +
      `${"—".padStart(8)}  ← o piso da régua`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
