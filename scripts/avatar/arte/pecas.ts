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
 *
 * ---------------------------------------------------------------------------
 * `--check` — O MESMO GERADOR, SEM ESCREVER
 * ---------------------------------------------------------------------------
 *
 * O controle 6 de `arte:revisao` já pega a defasagem, mas ele **renderiza**: abre
 * navegador, compõe SVG, desenha folha. Caro demais para o CI, e ele só roda para
 * a arte que se passa por argumento — nunca para as quatro.
 *
 * `--check` gera as quatro em memória e compara a string com o arquivo em disco.
 * Sem render, sem imagem, sem escrita. É o que entra em `verify:arte`: o CI fica
 * vermelho quando `pecas-da-arte.ts` defasa do `converter()` que o produziu.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";

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
 * AS PEÇAS TRAÇADAS DA ARTE — a saída da rota, e a **fonte** das promovidas.
 *
 * ---------------------------------------------------------------------------
 * DUAS DELAS ESTÃO NO CATÁLOGO. AS OUTRAS DUAS NÃO. A DIFERENÇA IMPORTA
 * ---------------------------------------------------------------------------
 *
 * Em 2026-08-07 o Doug aprovou \`entrada\` (espetado) e \`chanel\`, e elas foram
 * promovidas: \`CABELOS.espetado\` e \`CABELOS.chanel\` **espalham os objetos daqui**
 * e sobrescrevem só a identidade (\`id\` e \`nome\`). A geometria não é recopiada —
 * duas descrições da mesma borda é o defeito que a rota inteira evita.
 *
 * ⚠️ **Por isso, mexer neste arquivo mexe no catálogo.** Regerá-lo com uma arte
 * redesenhada move o render de um modelo do produto, e os selos de
 * \`parametrico-congelado.ts\` reprovam — o que é o comportamento certo: promoção é
 * decisão do Doug, e mudança silenciosa de peça aprovada é o que o selo pega.
 *
 * \`entrada-2\` e \`entrada-3\` **não** estão no catálogo. Elas existem para a página
 * \`/dev/avatar-kokeshi\` poder mostrá-las no navegador, no runtime real, do jeito
 * que o \`AvatarDisplay\` vai montá-las — e a \`entrada-3\` é a isca do controle 3 de
 * \`arte:revisao\`. Render em PNG de folha e render no navegador não são a mesma
 * coisa: foi por isso que a primeira folha desta rota saiu com o rosto preto e
 * ninguém viu até alguém olhar.
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

/**
 * O id de uma peça da arte — o nome do ARQUIVO, não o slug do catálogo.
 *
 * Não é \`ModeloCabelo\`: \`entrada\` e \`entrada-2\` não existem no catálogo, e as duas
 * promovidas entraram com outro nome (\`entrada\` → \`espetado\`). É por isso que
 * \`CABELOS\` sobrescreve o \`id\` ao espalhar — o cast abaixo não corrige runtime.
 */
export type IdDaArte = keyof typeof PECAS_DA_ARTE;

export const IDS_DA_ARTE = Object.keys(PECAS_DA_ARTE) as IdDaArte[];
`;

/** Gera o arquivo inteiro em memória, imprimindo a linha de cada arte. */
async function gerar(): Promise<string> {
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
  return `${CABECALHO}\n${blocos.join("\n\n")}\n${RODAPE}`;
}

/** A primeira linha em que as duas strings divergem — para o laudo dizer ONDE. */
function primeiraDivergencia(a: string, b: string): number {
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return i + 1;
  }
  return 0;
}

async function principal(): Promise<void> {
  const check = process.argv.includes("--check");

  if (check) {
    console.log(`CONFERINDO ${SAIDA} (--check: gera em memória, não escreve)\n`);
    const esperado = await gerar();
    let emDisco: string;
    try {
      emDisco = readFileSync(SAIDA, "utf-8");
    } catch {
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:pecas\`.`);
      process.exit(1);
    }
    if (emDisco === esperado) {
      console.log(`\n  · ${SAIDA} confere byte a byte com o \`converter()\` de hoje.`);
      return;
    }
    const linha = primeiraDivergencia(emDisco, esperado);
    console.error(
      `\n  ✗ ${SAIDA} DEFASOU do \`converter()\`.\n` +
        `    Primeira divergência na linha ${linha}` +
        ` (disco ${emDisco.length} bytes × gerado ${esperado.length} bytes).\n` +
        `    Conserto: \`npm run arte:pecas\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma arte que ninguém redesenhou, a mudança veio do conversor e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar();
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(`\n  escrito. Confira com \`npm run arte:revisao -- entrada\` (controle 6).`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
