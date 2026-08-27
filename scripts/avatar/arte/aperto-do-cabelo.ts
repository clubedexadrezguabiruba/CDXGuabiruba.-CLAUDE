/**
 * A TABELA DO APERTO — quanto cada chapéu achata cada cabelo, decidido a olho.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA É TABELA, E NÃO UM NÚMERO DERIVADO
 * ---------------------------------------------------------------------------
 *
 * A primeira ideia foi a máquina calcular: *largura do chapéu ÷ largura do cabelo*,
 * os dois medidos do alfa das peças. Ela cai por uma razão medida — a largura não
 * decide sozinha. O `elvis` fecha em 0,95 porque o que sobra é UMA mecha na têmpora;
 * o `dreadlocks` precisaria de 0,85 e ali as cordas perdem 57% do volume. Duas peças
 * com a mesma largura pedem apertos diferentes conforme ONDE está a massa e o que o
 * penteado perde ao encolher.
 *
 * ⚠️ **É o mesmo lugar em que este projeto já apanhou:** deixar a régua projetar a
 * forma. A régua mede; quem decide quanto uma peça pode encolher sem deixar de ser
 * ela é o olho do Doug, par a par, no editor.
 *
 * ---------------------------------------------------------------------------
 * ENTRADA DA ESTEIRA, COMO A CORREÇÃO DE OCLUSÃO
 * ---------------------------------------------------------------------------
 *
 * `aperto.json` é **entrada**, e mora ao lado da arte — é o LIVRO DE DECISÕES do
 * Doug, com uma linha por par do elenco, inclusive as que valem 1. Quem apaga o 1 é
 * o gerador do catálogo, para o produto continuar recebendo ausência.
 *
 * ⚠️ **Par sem linha REPROVA em `arte:apertos`** — é peça nova que ninguém vestiu
 * ainda. Foi por isso que o 1 passou a ocupar linha: enquanto "não aperta" e "ninguém
 * olhou" eram a mesma ausência, um cabelo novo entrava com 1,00 nos nove chapéus e
 * nada reprovava.
 *
 * O par vive como `"<chapeu>|<cabelo>"` numa chave só, e não como objeto aninhado,
 * porque é assim que ele é lido: pelo par, nunca por chapéu inteiro.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

/** Onde a decisão do Doug mora. Opcional: sem o arquivo, nada aperta. */
export const CAMINHO_DO_APERTO = "scripts/avatar/arte/aperto.json";

/**
 * Os limites do que é aperto e do que é deformação.
 *
 * O teto é 1 por definição — não existe "alargar o cabelo", isso seria arte nova. O
 * piso é 0,75 porque abaixo dele nenhuma peça medida continua sendo ela: a 0,85 o
 * `dreadlocks` já perde 57% do volume das cordas e o bob do `chanel` encosta no olho.
 */
export const APERTO_MIN = 0.75;
export const APERTO_MAX = 1;

/**
 * ⚠️ **`1` OCUPA LINHA, e essa é a decisão que faz a esteira ter memória.**
 *
 * Até 2026-08-26 o arquivo largava o par que valia 1 — "não aperta" e "ninguém
 * olhou" caíam na mesma ausência. Com isso, **um cabelo NOVO entrava com 1,00 nos
 * nove chapéus e nada reprovava**: o trabalho de decidir sumia em silêncio, com a
 * cadeia toda verde. É o modo de falha desta rota, e já custou a mão do Doug na
 * `boina` uma vez.
 *
 * Agora `aperto.json` é o LIVRO DE DECISÕES: todo par do elenco tem linha, inclusive
 * o que vale 1. Quem some com o 1 é o GERADOR do catálogo (`apertos.ts`), para o
 * produto continuar recebendo ausência e o SVG sair byte a byte igual. Entrada
 * registra a decisão; saída carrega só o que muda desenho.
 */
export type TabelaDeAperto = Record<string, number>;

export const chaveDoPar = (chapeu: string, cabelo: string) => `${chapeu}|${cabelo}`;

/** Lê a tabela do disco. Arquivo ausente ou ilegível = tabela vazia, sem erro. */
export function lerAperto(caminho = CAMINHO_DO_APERTO): TabelaDeAperto {
  if (!existsSync(caminho)) return {};
  try {
    const cru = JSON.parse(readFileSync(caminho, "utf-8")) as unknown;
    if (!cru || typeof cru !== "object" || Array.isArray(cru)) return {};
    const saida: TabelaDeAperto = {};
    for (const [k, v] of Object.entries(cru as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v >= APERTO_MIN && v <= APERTO_MAX) {
        saida[k] = arredondar(v);
      }
    }
    return saida;
  } catch {
    return {};
  }
}

/**
 * Grava a tabela ORDENADA, com o `1` incluído.
 *
 * Ordenar é o que faz o `git diff` mostrar a decisão que mudou em vez de embaralhar
 * o arquivo inteiro. O `1` fica porque ele é decisão — ver a nota em `TabelaDeAperto`.
 */
export function gravarAperto(t: TabelaDeAperto, caminho = CAMINHO_DO_APERTO): void {
  const limpa: TabelaDeAperto = {};
  for (const k of Object.keys(t).sort()) {
    const v = t[k];
    if (v > APERTO_MAX || v < APERTO_MIN) continue;
    limpa[k] = arredondar(v);
  }
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, `${JSON.stringify(limpa, null, 1)}\n`);
}

/** Dois decimais, que é a resolução em que a decisão é tomada no editor. */
export const arredondar = (v: number) => Math.round(v * 100) / 100;

/** O aperto de um par. Ausente é `1` — mas ausente também é par NÃO DECIDIDO. */
export const apertoDoPar = (t: TabelaDeAperto, chapeu: string, cabelo: string) =>
  t[chaveDoPar(chapeu, cabelo)] ?? APERTO_MAX;
