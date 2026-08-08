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

import { MODELOS_PARAMETRICOS, MODELOS_TRACADOS } from "../../../src/lib/avatar/estilo/cabelo";
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
 * OS SETE MODELOS COMO ELES SAEM HOJE — o congelamento da regressão.
 *
 * ---------------------------------------------------------------------------
 * QUINZE SELOS, EM TRÊS GRUPOS QUE NÃO SIGNIFICAM A MESMA COISA
 * ---------------------------------------------------------------------------
 *
 * **10 paramétricos** (5 modelos × parado/animado) — congelados desde o B4. Um
 * movimento aqui é a pergunta *"por que os paramétricos mudaram?"*.
 *
 * **4 traçados promovidos** (\`espetado\` e \`chanel\`, aprovados pelo Doug em
 * 2026-08-07) — congelados desde a promoção. Um movimento aqui quer dizer que a
 * saída da **rota de arte** mudou: ou uma arte foi redesenhada, ou o
 * \`converter()\` passou a produzir outra coisa. Nos dois casos há uma peça
 * aprovada mudando de aparência, e a decisão é do Doug.
 *
 * **1 careca** — o teto de regressão absoluto do estilo.
 *
 * ⚠️ **O nome \`PARAMETRICO_CONGELADO\` ficou estreito e não foi trocado**: ele
 * guarda os quinze, não só os dez paramétricos. Renomear custaria nove arquivos, a
 * maioria em prosa (\`ESTADO-DA-ROTA\`, o runbook 19, a skill), por um ganho de
 * nome — e o que este repositório paga caro é número escrito em muitos lugares,
 * não nome estreito com o esclarecimento ao lado. Fica escrito aqui.
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
 * Regerar é legítimo em **três** casos, e o terceiro entrou em 2026-08-07:
 *
 *  1. quando um dos paramétricos for **re-traçado** e sair da família de propósito.
 *     Aí o teste avisa antes, pelo nome certo — a amarra "os paramétricos continuam
 *     paramétricos" reprova primeiro, dizendo que a peça mudou de família em vez de
 *     deixar um diff de bytes sem explicação;
 *  2. quando uma **decisão declarada** muda o que \`compor()\` emite para todos;
 *  3. quando um modelo **entra ou sai do catálogo** — a promoção de uma peça da
 *     rota de arte, ou a re-emissão de uma promovida por outra variante. Aqui o
 *     número novo não é acidente: é uma arte que o Doug aprovou de novo.
 *
 * O caso 2 aconteceu uma vez: **os 92% viraram padrão** (\`ESCALA_PADRAO\` em
 * \`compositor.ts\`). O \`viewBox\` deixa 45,5 u acima da coroa e a peça traçada da
 * primeira arte real sobe a −38,9 u — o viewport guilhotinava sem erro e sem aviso.
 * A figura passou a ser reancorada e encolhida, o que acrescenta um \`<g transform>\`
 * de **+50 bytes** a cada um dos onze. Nenhum outro selo do repositório se moveu:
 * \`verify:pose\` continua passando e os outros 435 testes também.
 *
 * O caso 3 aconteceu uma vez: **espetado e chanel entraram no catálogo** em
 * 2026-08-07, e os onze selos viraram quinze. Os onze antigos **não se moveram um
 * byte** — foi a asserção negativa da promoção.
 *
 * O caso 4 aconteceu uma vez: **a peça sobreposta passou a ser emitida depois das
 * feições do rosto**, em 2026-08-08. Antes ela saía logo após o contorno da cabeça,
 * e a sobrancelha era pintada POR CIMA do cabelo — medido na \`entrada-2\`: 315 dos
 * 753 px visíveis de sobrancelha, 41,8%, em cima da massa.
 *
 * **Só os 4 selos dos dois traçados se moveram, e só no \`sha\`: os \`bytes\` são
 * idênticos.** Mesma quantidade de conteúdo, ordem diferente — que é exatamente o
 * que este selo existe para pegar. Os onze paramétricos e o careca não mudaram, e o
 * render foi conferido pixel a pixel nas duas versões: **0 de 350 000 pixels
 * diferentes** em espetado, chanel, curto, coque, moicano e careca. Só a
 * \`entrada-2\` mudou (322 px), que é o defeito sendo consertado. O selo mediu ordem
 * de emissão, não aparência — por isso reescrevê-lo aqui é registro, não
 * afrouxamento.
 *
 * O caso 5 aconteceu uma vez: **o Doug podou o catálogo de sete para cinco**, em
 * 2026-08-08, mantendo só o que ele aprovou olhando o render. Saíram \`curto\`,
 * \`cacheado\` e \`tranca\`; entrou \`assimetrico\`, promovida da \`entrada-2\`. Os selos
 * foram de quinze para **onze**, e os das peças que ficaram **não se moveram um
 * byte** — foi a asserção negativa da poda.
 *
 * ⚠️ O \`curto\` era o controle aprovado das ferramentas de medição (\`folha.ts\`,
 * \`reguas-conferidas.ts\`, \`mapear.ts\`) e o padrão da página \`/dev/avatar-kokeshi\`.
 * O controle passou a ser o \`coque\`, que é o paramétrico que sobrou. **Um controle
 * que aponta para peça apagada não reprova: ele deixa de existir**, e o gate passa
 * por vacuidade.
 *
 * GERADO por \`npm run avatar:congelar\` (\`scripts/avatar/estilo/dump-parametricos.ts\`).
 * Não edite à mão: um arquivo meio regerado mistura duas gerações e ninguém
 * consegue mais dizer quais linhas descrevem o quê.
 */
export const PARAMETRICO_CONGELADO: Record<string, { bytes: number; sha: string; css: string }> = {
`;

/** Os dois selos de um modelo: parado e animado. */
const selosDe = (modelo: string): [string, string][] =>
  [false, true].map((animado): [string, string] => [
    `${modelo}${animado ? " (animado)" : ""}`,
    svgDe(modelo as Parameters<typeof svgDe>[0], animado),
  ]);

function principal(): void {
  // AS DUAS FAMÍLIAS SAEM SEPARADAS, e não de `MODELOS_CABELO`, pelo mesmo motivo
  // que as listas são escritas em `cabelo.ts`: um modelo que nasça fora das duas
  // não pode escorregar para dentro do congelado sem ninguém decidir.
  const parametricos = MODELOS_PARAMETRICOS.flatMap(selosDe);
  const tracados = MODELOS_TRACADOS.flatMap(selosDe);
  const casos: [string, string][] = [
    ...parametricos,
    ...tracados,
    ["__careca", svgDe(undefined, false)],
  ];

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

  console.log(`OS SELOS DO CATÁLOGO, REMEDIDOS — ${DESTINO}\n`);
  const grupo = (titulo: string, lista: [string, string][]) => {
    console.log(`  ── ${titulo}`);
    console.log(`     caso                   bytes   sha (12)`);
    for (const [chave, svg] of lista) {
      console.log(
        `     ${chave.padEnd(20)} ${String(Buffer.byteLength(svg, "utf-8")).padStart(7)}   ${sha(svg).slice(0, 12)}`,
      );
    }
    console.log("");
  };
  grupo(`${parametricos.length} PARAMÉTRICOS (${MODELOS_PARAMETRICOS.join(", ")})`, parametricos);
  grupo(`${tracados.length} TRAÇADOS PROMOVIDOS (${MODELOS_TRACADOS.join(", ")})`, tracados);
  grupo(`1 CARECA — o teto de regressão absoluto`, [casos[casos.length - 1]]);

  console.log(
    `  ${casos.length} selos escritos. Rode \`npm test\` e confira que a razão do movimento` +
      `\n  está no docstring do arquivo gerado — senão o congelamento afrouxou sem motivo.`,
  );
}

principal();
