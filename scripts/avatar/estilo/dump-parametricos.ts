/**
 * O GERADOR DE `parametrico-congelado.ts` — e ele existe porque já fez falta.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE FOI REESCRITO
 * ---------------------------------------------------------------------------
 *
 * O original morava em `.scratch/estilo/b4-dump-parametricos.ts`, dentro de uma
 * pasta que o `.gitignore` ignora, e sumiu. Quando o Bloco 5 precisou remedir os
 * onze selos pelos 92%, não havia como — o arquivo de congelamento diz no rodapé
 * "gerado por" um script que não existe mais, o que é a mesma coisa que dizer
 * "escrito à mão".
 *
 * Um congelado que só pode ser regerado à mão é um congelado que ninguém regera:
 * a tentação é editar o número que o teste reclamou e deixar os outros dez como
 * estavam. Aí o arquivo passa a misturar duas gerações, e a próxima pessoa que
 * olhar não tem como saber quais linhas descrevem o quê.
 *
 * Ele nasce em `scripts/`, versionado, pelo mesmo motivo que a rota de arte
 * graduou no Bloco 4.
 *
 * ---------------------------------------------------------------------------
 * QUANDO RODAR — e o docstring do arquivo gerado repete isto
 * ---------------------------------------------------------------------------
 *
 * **Vermelho no teste NÃO é motivo para rodar.** Vermelho ali é a pergunta *"por
 * que os paramétricos mudaram?"*, e regerar sem responder é apagar a pergunta.
 *
 * Os dois motivos legítimos são:
 *
 *  1. um dos cinco foi **re-traçado** e saiu da família paramétrica de propósito;
 *  2. uma decisão declarada mudou o que `compor()` emite **para todos** — foi o
 *     caso dos 92% em 2026-08-06, que acrescentaram um `<g transform>` de 50 bytes
 *     a cada um dos onze.
 *
 * Nos dois casos o número novo é remedido **de propósito** e o motivo entra no
 * docstring do arquivo gerado. Rodar sem um desses dois motivos afrouxa o teste
 * sem ninguém perceber — que é o defeito que o congelamento existe para impedir.
 */

import { writeFileSync } from "fs";
import { createHash } from "node:crypto";

import { MODELOS_CABELO } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";

const DESTINO = "src/lib/avatar/estilo/__tests__/parametrico-congelado.ts";

/**
 * As MESMAS opções de `linhas-cabelo.test.ts`.
 *
 * `PELE[1]`, `CABELO[1]` e `ns: "t"` não são escolha deste arquivo: são o que o
 * teste compõe. Divergir aqui produziria onze selos que nenhum teste confere.
 */
const svgDe = (modelo?: Parameters<typeof compor>[0]["modeloCabelo"], animado = false) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t", animado });

const sha = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");
const cssDe = (svg: string) => svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";

const CABECALHO = `/**
 * OS CINCO PARAMÉTRICOS COMO ELES SAEM HOJE — o congelamento da regressão.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * O B4 separou a classe do cabelo que tinha dois papéis: \`.kk-cabelo-s\` (fill **e**
 * stroke) continua servindo à família paramétrica, e a família traçada passou a
 * \`.kk-cabelo-m\` + \`.kk-cabelo-l\`. A correção é para o laço fechado; se ela vazar
 * para quem não devia, os cinco modelos do catálogo mudam de bytes — e mudam
 * **caladas**, porque nenhuma das amarras de \`cabelo.test.ts\` mede byte: elas medem
 * folga, coroa, contenção, orçamento. Um cabelo que mudasse de aparência sem mudar
 * nenhum desses números passaria inteiro.
 *
 * ---------------------------------------------------------------------------
 * SHA E CSS, E POR QUE OS DOIS
 * ---------------------------------------------------------------------------
 *
 * O \`sha\` é a garantia byte a byte: qualquer caractere diferente em qualquer lugar
 * do SVG reprova. Ele sozinho, porém, dá o pior relatório possível — "duas strings
 * de 64 caracteres diferem" não diz o que mudou.
 *
 * O \`css\` é o bloco \`<style>\` inteiro, em texto, e é onde a mudança do B4 teria
 * caído. Quando o teste quebra, é ele que aparece no diff do vitest e diz em uma
 * olhada se a regra que vazou foi a do cabelo. Guardar o SVG completo dos onze casos
 * custaria 89 KB de fixture para melhorar um relatório que estas duas linhas já
 * resolvem.
 *
 * ---------------------------------------------------------------------------
 * QUANDO REGERAR — E QUANDO **NÃO**
 * ---------------------------------------------------------------------------
 *
 * Este arquivo é congelado de propósito. Ele **não** se regenera porque o teste
 * ficou vermelho: vermelho aqui é a pergunta "por que os paramétricos mudaram?", e
 * regerar sem responder é apagar a pergunta.
 *
 * Regerar é legítimo em **dois** casos, e o segundo entrou em 2026-08-06:
 *
 *  1. quando um dos cinco for **re-traçado** e sair da família paramétrica de
 *     propósito. Aí o teste avisa antes, pelo nome certo — a amarra "os cinco
 *     continuam paramétricos" reprova primeiro, dizendo que a peça mudou de família
 *     em vez de deixar um diff de bytes sem explicação;
 *  2. quando uma **decisão declarada** muda o que \`compor()\` emite para todos.
 *
 * O caso 2 aconteceu uma vez: **os 92% viraram padrão** (\`ESCALA_PADRAO\` em
 * \`compositor.ts\`). O \`viewBox\` deixa 45,5 u acima da coroa e a peça traçada da
 * primeira arte real sobe a −38,9 u — o viewport guilhotinava sem erro e sem aviso.
 * A figura passou a ser reancorada e encolhida, o que acrescenta um \`<g transform>\`
 * de **+50 bytes** a cada um dos onze. Nenhum outro selo do repositório se moveu:
 * \`verify:pose\` continua passando e os outros 435 testes também.
 *
 * GERADO por \`npm run avatar:congelar\` (\`scripts/avatar/estilo/dump-parametricos.ts\`).
 * Não edite à mão: um arquivo meio regerado mistura duas gerações e ninguém
 * consegue mais dizer quais linhas descrevem o quê.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
`;

function principal(): void {
  const casos: [string, string][] = [];
  for (const modelo of MODELOS_CABELO) {
    for (const animado of [false, true]) {
      casos.push([`${modelo}${animado ? " (animado)" : ""}`, svgDe(modelo, animado)]);
    }
  }
  casos.push(["__careca", svgDe(undefined, false)]);

  let corpo = CABECALHO;
  for (const [chave, svg] of casos) {
    corpo +=
      `  ${JSON.stringify(chave)}: {\n` +
      `    bytes: ${Buffer.byteLength(svg, "utf-8")},\n` +
      `    sha: ${JSON.stringify(sha(svg))},\n` +
      `    css: ${JSON.stringify(cssDe(svg))},\n` +
      `  },\n`;
  }
  corpo += `};\n`;
  writeFileSync(DESTINO, corpo, "utf-8");

  console.log(`OS ONZE SELOS PARAMÉTRICOS, REMEDIDOS — ${DESTINO}\n`);
  console.log(`  caso                   bytes   sha (12)`);
  for (const [chave, svg] of casos) {
    console.log(
      `  ${chave.padEnd(20)} ${String(Buffer.byteLength(svg, "utf-8")).padStart(7)}   ${sha(svg).slice(0, 12)}`,
    );
  }
  console.log(
    `\n  ${casos.length} selos escritos. Rode \`npm test\` e confira que a razão do movimento` +
      `\n  está no docstring do arquivo gerado — senão o congelamento afrouxou sem motivo.`,
  );
}

principal();
