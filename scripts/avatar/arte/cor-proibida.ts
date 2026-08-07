/**
 * BLOCO 2c — A AMARRA QUE NÃO EXISTIA: cor proibida na base de edição.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTÁ EM RISCO
 * ---------------------------------------------------------------------------
 *
 * A rota inteira reconhece a peça pela **cor instrumental**: o ciano em ~180°,
 * com tolerância de ±30° e saturação ≥ 0,18 (`extrair.ts`). A afirmação implícita
 * é que nada mais na base de edição mora perto disso.
 *
 * Hoje ela é verdadeira: a base é monocromática em matiz — tudo entre 26,9° e
 * 43,2°, mais preto e branco —, e a margem até o ciano é de **136,8°**, mais de
 * quatro vezes a tolerância.
 *
 * **Mas isso é coincidência de configuração, não amarra.** A base é gerada por
 * `compor()` com a paleta escolhida por quem chama, e a paleta do projeto tem
 * cores muito mais perto:
 *
 * | cor | matiz | distância até 180° |
 * |---|---|---|
 * | `FUNDO[5]` água `#95D2CB` | ~173° | **6,9°** |
 * | `FUNDO[0]` azul `#BBD4E8` | ~207° | 26,7° |
 * | `CABELO[7]` azul `#3E7CA8` | ~205° | 24,9° |
 *
 * As três estão **dentro** da tolerância de ±30°. No dia em que a base de edição
 * ganhar fundo escolhível, ou em que alguém compuser a base com o cabelo azul,
 * `extrair()` colhe boneco como peça — em silêncio, sem gate nenhum acusar, e a
 * peça que sai dali leva pedaço de fundo junto.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE TESTE FAZ
 * ---------------------------------------------------------------------------
 *
 * Roda a MESMA régua de matiz de `extrair.ts` sobre **toda cor emitida** no
 * `base-oficial.svg` — atributos `fill`, `stroke`, `stop-color` e as custom
 * properties `--av-*` — e reprova se alguma cair dentro da janela do ciano.
 *
 * O SVG e não a paleta: o que importa é o que de fato saiu no arquivo que vai ao
 * gerador. Uma cor que existe em `palette.ts` mas não é emitida não faz mal
 * nenhum, e uma cor emitida por um caminho que ninguém previu faria — é a mesma
 * razão de `conferirSvg` medir o SVG e não a intenção.
 *
 * A tabela de "quão perto passou" sai junto, porque um teste que só diz
 * "passou" não avisa que a margem encolheu de 136,8° para 40°.
 */

import { readFileSync } from "fs";

import { CABELO, FUNDO, LINHA, PELE, TRAJE_BASE } from "../../../src/lib/avatar/palette";
import { SVG_BASE } from "./base";
import { distanciaMatiz, matiz } from "./pixels";

/** Os mesmos três de `extrair.ts`. Importar seria melhor; eles são privados lá. */
const MATIZ = 180;
const TOL_MATIZ = 30;
const SAT_MIN = 0.18;

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** Expande `#abc` para `#aabbcc`. O SVG pode ter as duas formas. */
function normalizar(h: string): string {
  const s = h.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return s;
}

export interface Cor {
  hex: string;
  onde: string;
  matiz: number;
  saturacao: number;
  distancia: number;
  proibida: boolean;
}

/** Toda cor hexadecimal emitida no SVG, com o atributo de onde ela saiu. */
export function coresDoSvg(svg: string): Cor[] {
  const achados = new Map<string, string>();
  const guardar = (h: string, onde: string) => {
    const k = normalizar(h);
    if (/^#[0-9a-f]{6}$/.test(k) && !achados.has(k)) achados.set(k, onde);
  };
  for (const m of svg.matchAll(/(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g))
    guardar(m[2], m[1]);
  for (const m of svg.matchAll(/(--av-[a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g)) guardar(m[2], m[1]);
  return [...achados].map(([h, onde]) => avaliar(h, onde));
}

function avaliar(h: string, onde: string): Cor {
  const { h: hh, s } = matiz(...hex(h));
  const d = distanciaMatiz(hh, MATIZ);
  return {
    hex: h,
    onde,
    matiz: hh,
    saturacao: s,
    distancia: d,
    proibida: s >= SAT_MIN && d <= TOL_MATIZ,
  };
}

function principal(): void {
  const svg = readFileSync(SVG_BASE, "utf-8");
  const cores = coresDoSvg(svg).sort((a, b) => a.distancia - b.distancia);

  console.log(`BLOCO 2c — COR PROIBIDA NA BASE DE EDIÇÃO — ${SVG_BASE}\n`);
  console.log(`  A janela da peça: matiz ${MATIZ}° ± ${TOL_MATIZ}°, com saturação ≥ ${SAT_MIN}.`);
  console.log(`  Cor emitida dentro dela vira PEÇA em silêncio na extração.\n`);
  console.log(`  cor        de onde              matiz    sat.   distância até ${MATIZ}°`);
  for (const c of cores) {
    console.log(
      `  ${c.proibida ? "✗" : "·"} ${c.hex}  ${c.onde.padEnd(18)} ${c.matiz.toFixed(0).padStart(5)}°  ` +
        `${c.saturacao.toFixed(2)}   ${c.distancia.toFixed(1).padStart(6)}°` +
        (c.proibida ? "   ← DENTRO DA JANELA" : ""),
    );
  }

  const margem = cores.filter((c) => c.saturacao >= SAT_MIN).reduce((m, c) => Math.min(m, c.distancia), 360);
  console.log(
    `\n  MARGEM da base até o ciano: ${margem.toFixed(1)}°  ` +
      `(${(margem / TOL_MATIZ).toFixed(1)}× a tolerância de ${TOL_MATIZ}°)`,
  );

  // O AVISO SOBRE A PALETA — não reprova, porque a base de hoje não usa estas
  // cores. Existe porque uma amarra que só diz "passou" não avisa que o próximo
  // campo escolhível quebra tudo.
  const daPaleta: Cor[] = [
    ...FUNDO.map((h, i) => avaliar(h, `FUNDO[${i}]`)),
    ...CABELO.map((h, i) => avaliar(h, `CABELO[${i}]`)),
    ...PELE.map((h, i) => avaliar(h, `PELE[${i}]`)),
    avaliar(TRAJE_BASE.roupa, "TRAJE_BASE.roupa"),
    avaliar(TRAJE_BASE.calca, "TRAJE_BASE.calca"),
    avaliar(TRAJE_BASE.sapato, "TRAJE_BASE.sapato"),
    avaliar(LINHA, "LINHA"),
  ];
  const perigosas = daPaleta.filter((c) => c.proibida).sort((a, b) => a.distancia - b.distancia);
  console.log(`\n  AVISO — cores da PALETA que cairiam dentro da janela se fossem emitidas:`);
  if (!perigosas.length) {
    console.log(`    nenhuma.`);
  } else {
    for (const c of perigosas)
      console.log(
        `    ${c.hex}  ${c.onde.padEnd(18)} ${c.matiz.toFixed(0).padStart(5)}°  sat ${c.saturacao.toFixed(2)}   ` +
          `${c.distancia.toFixed(1)}° do ciano`,
      );
    console.log(
      `\n    Nenhuma delas está na base de HOJE, e por isso o teste passa. No dia em que a\n` +
        `    base de edição ganhar fundo escolhível, ou for composta com o cabelo azul, este\n` +
        `    teste reprova ANTES de a arte ser gerada — que é o único momento em que dá para\n` +
        `    consertar sem jogar arte fora.`,
    );
  }

  const proibidas = cores.filter((c) => c.proibida);
  console.log(
    `\n  RESULTADO: ${proibidas.length ? `✗ REPROVA — ${proibidas.length} cor(es) dentro da janela` : "· PASSA — nenhuma cor emitida cai na janela da peça"}`,
  );
  if (proibidas.length) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("cor-proibida.ts")) principal();
