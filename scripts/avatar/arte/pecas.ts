/**
 * O GERADOR DE `pecas-da-arte.ts` — porque "GERADO" sem gerador é escrito à mão.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE NASCE AGORA
 * ---------------------------------------------------------------------------
 *
 * `src/lib/avatar/estilo/pecas-da-arte.ts` se declara gerado desde que existe, e
 * nunca teve gerador: as três peças foram **coladas à mão** a partir de três
 * `peca/peca.ts` diferentes. Enquanto nada mudava, a mentira era barata.
 *
 * O Bloco 8 cobrou. Uma linha em `comprimirNoTeto` mudou o `k` das três peças, e
 * de repente o literal colado passou a descrever uma conversão que não existe
 * mais — a página `/dev/avatar-kokeshi` mostraria a peça velha enquanto todo
 * número da folha falaria da nova. O controle 6 de `arte:revisao` pega isso e
 * **recusa desenhar**, mas pegar não é consertar: sem gerador, o conserto é
 * transcrever 144 pares de números à mão, três vezes.
 *
 * É o mesmo caso do `dump-parametricos.ts` do Bloco 5, e a mesma solução.
 *
 * ---------------------------------------------------------------------------
 * ELE NÃO PROMOVE NINGUÉM
 * ---------------------------------------------------------------------------
 *
 * O arquivo que sai daqui continua **fora de `CABELOS`**. Colar no catálogo é
 * decisão do Doug e custa os onze selos, as amarras de `cabelo.test.ts` e o
 * orçamento composto. Este gerador só garante que o que a página mostra é o que
 * a rota produz hoje.
 */

import { mkdirSync, writeFileSync } from "fs";

import type { Cabelo, PontoFranja } from "../../../src/lib/avatar/estilo/cabelo";
import { converter } from "./converter";
import { PASTA } from "./base";

/** As artes e o rótulo que cada uma leva na página. */
const ARTES: { arquivo: string; nome: string; nota: string }[] = [
  { arquivo: "entrada", nome: "Espetado", nota: "espetado, com pontas altas" },
  { arquivo: "entrada-2", nome: "Assimétrico", nota: "largo, assimétrico, desce ao lado do rosto" },
  { arquivo: "entrada-3", nome: "Chanel", nota: "liso, chanel" },
  { arquivo: "chanel", nome: "Chanel novo", nota: "chanel simétrico, gerado sobre a base oficial" },
];

const SAIDA = "src/lib/avatar/estilo/pecas-da-arte.ts";

const ty = (p: PontoFranja) => `{ t: ${p.t.toFixed(3)}, y: ${p.y.toFixed(3)} }`;
const xy = (p: { x: number; y: number }) => `{ x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)} }`;

/** Um laço em `{t,y}` indentado, quatro por linha para o arquivo não virar coluna. */
const laco = (pts: readonly PontoFranja[], ind: string) =>
  `[\n${pts.map((p) => `${ind}  ${ty(p)},`).join("\n")}\n${ind}]`;

function corpoDaPeca(id: string, nome: string, c: Cabelo): string {
  const i = "    ";
  const linhas: string[] = [
    `  "${id}": {`,
    `${i}id: "${id}" as Cabelo["id"],`,
    `${i}nome: ${JSON.stringify(nome)},`,
    `${i}massa: ${laco(c.massa!, i)},`,
  ];
  if (c.clara) linhas.push(`${i}clara: ${laco(c.clara, i)},`);
  if (c.claras?.length) {
    linhas.push(
      `${i}claras: [\n${c.claras.map((f) => `${i}  ${laco(f, `${i}  `)},`).join("\n")}\n${i}],`,
    );
  }
  // AS CAMADAS DA PEÇA TRANSCRITA. Quais artes transcrevem é `TRANSCREVEM`, em
  // `converter.ts` — a lista mora lá porque o controle 6 de `arte:revisao` precisa
  // da mesma resposta que este gerador.
  if (c.nucleo?.length) {
    linhas.push(
      `${i}nucleo: [\n${c.nucleo.map((f) => `${i}  ${laco(f, `${i}  `)},`).join("\n")}\n${i}],`,
    );
  }
  if (c.pretas?.length) {
    linhas.push(
      `${i}pretas: [\n${c.pretas.map((f) => `${i}  ${laco(f, `${i}  `)},`).join("\n")}\n${i}],`,
    );
  }
  if (c.linhas?.length) linhas.push(`${i}linhas: ${JSON.stringify(c.linhas)},`);
  if (c.formas?.length) {
    linhas.push(
      `${i}formas: [\n` +
        c.formas
          .map(
            (f) =>
              `${i}  {\n${i}    forma: [\n` +
              f.forma.map((p) => `${i}      ${xy(p)},`).join("\n") +
              `\n${i}    ],` +
              (f.linhas?.length ? `\n${i}    linhas: ${JSON.stringify(f.linhas)},` : "") +
              `\n${i}  },`,
          )
          .join("\n") +
        `\n${i}],`,
    );
  }
  linhas.push(`  },`);
  return linhas.join("\n");
}

const CABECALHO = `/**
 * AS PEÇAS TRAÇADAS DA ARTE, para conferência no runtime — **e só isso**.
 *
 * ---------------------------------------------------------------------------
 * ELAS NÃO ESTÃO NO CATÁLOGO, E A DIFERENÇA IMPORTA
 * ---------------------------------------------------------------------------
 *
 * \`CABELOS\` é o catálogo do produto: cinco modelos paramétricos, com amarras que
 * o teste cobra (folga do rosto, coroa, contenção da clara, orçamento) e com os
 * onze selos byte a byte de \`parametrico-congelado.ts\`. Colar uma peça de arte
 * ali é decisão de catálogo e é do Doug — a rota produz o literal, ela não
 * promove ninguém.
 *
 * Este arquivo existe para uma coisa: a página \`/dev/avatar-kokeshi\` poder
 * mostrar as peças no navegador, no runtime real, do jeito que o
 * \`AvatarDisplay\` vai montá-las. Render em PNG de folha e render no navegador não
 * são a mesma coisa — foi por isso que a primeira folha desta rota saiu com o
 * rosto preto e ninguém viu até alguém olhar.
 *
 * ---------------------------------------------------------------------------
 * GERADO por \`npm run arte:pecas\` — não editar à mão
 * ---------------------------------------------------------------------------
 *
 * Ele roda \`converter()\` sobre os PNGs versionados em \`scripts/avatar/arte/\`
 * e escreve este arquivo inteiro. **Regerar quando:** uma arte for redesenhada, ou
 * quando uma decisão do conversor mudar o que ele produz para todas — foi o caso
 * do teto de compressão passar a ser lido na escala de entrega.
 *
 * Quem cobra que este arquivo não envelheça é o **controle 6** de
 * \`npm run arte:revisao\`: ele reconverte a arte e compara ponto a ponto, e
 * recusa desenhar a folha se divergir.
 *
 * O formato é o da **peça sobreposta** (Bloco 4): \`massa\` como laço fechado em
 * {t,y}, \`clara\`/\`claras\` para a região iluminada, \`linhas\` como arcos de índice
 * sobre a massa, e \`formas\` para os pedaços que a massa não alcança.
 */

import type { Cabelo } from "./cabelo";

export const PECAS_DA_ARTE = {`;

const RODAPE = `} as const satisfies Record<string, Cabelo>;

/** O id de uma peça da arte. Não é \`ModeloCabelo\` — elas não estão no catálogo. */
export type IdDaArte = keyof typeof PECAS_DA_ARTE;

export const IDS_DA_ARTE = Object.keys(PECAS_DA_ARTE) as IdDaArte[];
`;

async function principal(): Promise<void> {
  console.log(`GERANDO ${SAIDA}\n`);
  const blocos: string[] = [];
  for (const a of ARTES) {
    const c = await converter(`${PASTA}/${a.arquivo}.png`);
    const p = c.peca;
    console.log(
      `  ${a.arquivo.padEnd(11)} massa ${String(p.massa?.length ?? 0).padStart(3)} pts · ` +
        `clara ${String(p.clara?.length ?? 0).padStart(3)} · ` +
        `claras ${p.claras?.length ?? 0} · formas ${p.formas?.length ?? 0} · ` +
        (p.nucleo?.length
          ? `TRANSCRITA: núcleo ${p.nucleo.length} forma(s)/${p.nucleo.reduce((s, f) => s + f.length, 0)} pts · ` +
            `pretas ${p.pretas?.length ?? 0}`
          : `linhas ${JSON.stringify(p.linhas ?? [])}`) +
        ` · k ${c.k.toFixed(4)}`,
    );
    blocos.push(
      `  /** ${a.nota}. Traçada de \`${a.arquivo}.png\` por \`npm run arte:pecas\`. */\n` +
        corpoDaPeca(a.arquivo, a.nome, p),
    );
  }
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, `${CABECALHO}\n${blocos.join("\n\n")}\n${RODAPE}`, "utf-8");
  console.log(`\n  escrito. Confira com \`npm run arte:revisao -- entrada\` (controle 6).`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
